from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier

from pest_risk.config import DiseaseConfig, ModelSettings, RuleRegistry
from pest_risk.constants import DEFAULT_FEATURE_COLUMNS
from pest_risk.labeling.aggregate import (
    AggregationResult,
    aggregate_labels,
    weighted_vote_probabilities,
)
from pest_risk.labeling.analysis import analyze_label_matrix
from pest_risk.labeling.functions import apply_rules
from pest_risk.modeling.artifacts import RiskModelArtifact, positive_class_probability
from pest_risk.modeling.calibrate import SigmoidCalibrator
from pest_risk.modeling.evaluate import classification_metrics

LOGGER = logging.getLogger(__name__)


@dataclass
class DiseaseTrainingResult:
    artifact: RiskModelArtifact
    weak_probabilities: np.ndarray
    label_matrix: np.ndarray
    lf_summary: pd.DataFrame
    split_assignments: pd.Series


def temporal_split(
    dates: pd.Series,
    train_fraction: float = 0.70,
    validation_fraction: float = 0.15,
) -> pd.Series:
    parsed = pd.to_datetime(dates)
    unique_dates = np.array(sorted(parsed.dropna().unique()))
    if len(unique_dates) < 3:
        return pd.Series("train", index=dates.index)
    train_index = min(max(int(len(unique_dates) * train_fraction), 1), len(unique_dates) - 2)
    validation_index = min(
        max(int(len(unique_dates) * (train_fraction + validation_fraction)), train_index + 1),
        len(unique_dates) - 1,
    )
    train_end = unique_dates[train_index - 1]
    validation_end = unique_dates[validation_index - 1]
    return pd.Series(
        np.where(
            parsed <= train_end,
            "train",
            np.where(parsed <= validation_end, "validation", "test"),
        ),
        index=dates.index,
    )


def _build_classifier(settings: ModelSettings, random_seed: int) -> Any:
    model_cfg = settings.raw.get("model", {})
    return HistGradientBoostingClassifier(
        learning_rate=float(model_cfg.get("learning_rate", 0.06)),
        max_iter=int(model_cfg.get("max_iter", 120)),
        max_leaf_nodes=int(model_cfg.get("max_leaf_nodes", 31)),
        min_samples_leaf=int(model_cfg.get("min_samples_leaf", 30)),
        l2_regularization=float(model_cfg.get("l2_regularization", 0.1)),
        early_stopping=True,
        validation_fraction=0.10,
        n_iter_no_change=15,
        random_state=random_seed,
    )


def _training_rows(
    probabilities: np.ndarray,
    positive_cutoff: float,
    negative_cutoff: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    confident = (probabilities >= positive_cutoff) | (probabilities <= negative_cutoff)
    labels = (probabilities >= positive_cutoff).astype(int)
    weights = np.maximum(np.abs(probabilities - 0.5) * 2.0, 0.05)
    return confident, labels, weights


def _ensure_trainable_aggregation(
    aggregation: AggregationResult,
    matrix: np.ndarray,
    disease: DiseaseConfig,
    positive_cutoff: float,
    negative_cutoff: float,
    minimum_class_rows: int,
) -> AggregationResult:
    """Keep Snorkel as primary, but avoid silently training a one-class model.

    Sparse, nearly independent labeling functions can make an unsupervised LabelModel
    conservative. If either confident class is absent, the deterministic research-weighted
    vote is used and the fallback reason is recorded in the model artifact.
    """

    probabilities = aggregation.probabilities
    positive_rows = int((probabilities >= positive_cutoff).sum())
    negative_rows = int((probabilities <= negative_cutoff).sum())
    if positive_rows >= minimum_class_rows and negative_rows >= minimum_class_rows:
        aggregation.metadata["confident_class_rows"] = {
            "negative": negative_rows,
            "positive": positive_rows,
        }
        return aggregation

    fallback = weighted_vote_probabilities(matrix, disease.rules)
    fallback_positive = int((fallback >= positive_cutoff).sum())
    fallback_negative = int((fallback <= negative_cutoff).sum())
    metadata = dict(aggregation.metadata)
    metadata.update(
        {
            "fallback_reason": (
                "Requested label aggregation did not produce enough high-confidence examples "
                f"for both classes (negative={negative_rows}, positive={positive_rows})."
            ),
            "requested_method": aggregation.method,
            "confident_class_rows_before_fallback": {
                "negative": negative_rows,
                "positive": positive_rows,
            },
            "confident_class_rows": {
                "negative": fallback_negative,
                "positive": fallback_positive,
            },
            "rule_weights": {rule.id: rule.weight for rule in disease.rules},
        }
    )
    LOGGER.warning(
        "%s label aggregation was degenerate; using weighted vote for model training",
        disease.display_name,
    )
    return AggregationResult(
        probabilities=fallback,
        method=f"{aggregation.method}_to_weighted_vote_fallback",
        metadata=metadata,
        model=aggregation.model,
    )


def _bounded_fit_mask(
    train_mask: np.ndarray,
    labels: np.ndarray,
    max_rows: int,
    random_seed: int,
) -> np.ndarray:
    indices = np.flatnonzero(train_mask)
    if max_rows <= 0 or len(indices) <= max_rows:
        return train_mask.copy()

    rng = np.random.default_rng(random_seed)
    selected: list[np.ndarray] = []
    classes = np.unique(labels[indices])
    for class_value in classes:
        class_indices = indices[labels[indices] == class_value]
        class_quota = max(1, int(round(max_rows * len(class_indices) / len(indices))))
        selected.append(
            rng.choice(
                class_indices,
                size=min(class_quota, len(class_indices)),
                replace=False,
            )
        )

    sampled = np.concatenate(selected)
    if len(sampled) > max_rows:
        sampled = rng.choice(sampled, size=max_rows, replace=False)
    elif len(sampled) < max_rows:
        remaining = np.setdiff1d(indices, sampled, assume_unique=False)
        extra_count = min(max_rows - len(sampled), len(remaining))
        if extra_count:
            sampled = np.concatenate(
                [sampled, rng.choice(remaining, size=extra_count, replace=False)]
            )

    mask = np.zeros_like(train_mask, dtype=bool)
    mask[sampled] = True
    return mask


def train_disease_model(
    features: pd.DataFrame,
    disease_id: str,
    disease: DiseaseConfig,
    registry: RuleRegistry,
    settings: ModelSettings,
    aggregator_method: str = "snorkel",
) -> DiseaseTrainingResult:
    if "date" not in features:
        raise ValueError("Feature frame must include date")

    matrix = apply_rules(features, disease.rules)
    snorkel_cfg = settings.raw.get("snorkel", {})
    aggregation: AggregationResult = aggregate_labels(
        matrix,
        disease.rules,
        method=aggregator_method,
        epochs=int(snorkel_cfg.get("epochs", 500)),
        learning_rate=float(snorkel_cfg.get("learning_rate", 0.01)),
        class_balance=snorkel_cfg.get("class_balance"),
        seed=int(settings.raw.get("random_seed", 42)),
    )
    weak_cfg = settings.raw.get("weak_label_training", {})
    positive_cutoff = float(weak_cfg.get("positive_cutoff", 0.70))
    negative_cutoff = float(weak_cfg.get("negative_cutoff", 0.30))
    aggregation = _ensure_trainable_aggregation(
        aggregation,
        matrix,
        disease,
        positive_cutoff=positive_cutoff,
        negative_cutoff=negative_cutoff,
        minimum_class_rows=int(weak_cfg.get("minimum_class_rows", 100)),
    )
    weak_probabilities = aggregation.probabilities
    confident, labels, weights = _training_rows(
        weak_probabilities,
        positive_cutoff=positive_cutoff,
        negative_cutoff=negative_cutoff,
    )

    split_cfg = settings.raw.get("splits", {})
    split = temporal_split(
        features["date"],
        train_fraction=float(split_cfg.get("train_fraction", 0.70)),
        validation_fraction=float(split_cfg.get("validation_fraction", 0.15)),
    )

    feature_columns = [column for column in DEFAULT_FEATURE_COLUMNS if column in features]
    if not feature_columns:
        raise ValueError("No configured model features exist in the feature frame")

    train_mask = confident & split.eq("train").to_numpy()
    validation_mask = confident & split.eq("validation").to_numpy()
    test_mask = confident & split.eq("test").to_numpy()
    random_seed = int(settings.raw.get("random_seed", 42))
    model_cfg = settings.raw.get("model", {})
    fit_mask = _bounded_fit_mask(
        train_mask,
        labels,
        max_rows=int(model_cfg.get("max_training_rows", 12_000)),
        random_seed=random_seed,
    )

    y_train = labels[fit_mask]
    if fit_mask.sum() < 20 or len(np.unique(y_train)) < 2:
        LOGGER.warning(
            "%s has insufficient class diversity; fitting a prior-only dummy model", disease_id
        )
        classifier: Any = DummyClassifier(strategy="prior")
        fallback_rows = confident if confident.any() else np.ones(len(features), dtype=bool)
        fallback_labels = (
            labels[fallback_rows]
            if confident.any()
            else np.zeros(len(features), dtype=int)
        )
        if len(np.unique(fallback_labels)) < 2 and len(fallback_labels) >= 2:
            fallback_labels = fallback_labels.copy()
            fallback_labels[0] = 0
            fallback_labels[1] = 1
        classifier.fit(features.loc[fallback_rows, feature_columns], fallback_labels)
        model_kind = "dummy_prior"
    else:
        classifier = _build_classifier(settings, random_seed)
        classifier.fit(
            features.loc[fit_mask, feature_columns],
            y_train,
            sample_weight=weights[fit_mask],
        )
        model_kind = "hist_gradient_boosting"

    calibrator = SigmoidCalibrator()
    calibration_source = "none"
    if validation_mask.sum() >= 20 and len(np.unique(labels[validation_mask])) >= 2:
        validation_raw = positive_class_probability(
            classifier, features.loc[validation_mask, feature_columns]
        )
        calibrator.fit(validation_raw, labels[validation_mask])
        calibration_source = "weak_validation_labels"

    metrics: dict[str, Any] = {}
    for name, mask in [("train", train_mask), ("validation", validation_mask), ("test", test_mask)]:
        if not mask.any():
            metrics[name] = {"rows": 0}
            continue
        raw_prob = positive_class_probability(classifier, features.loc[mask, feature_columns])
        calibrated = calibrator.predict(raw_prob)
        metrics[name] = classification_metrics(labels[mask], calibrated)

    trained_at = datetime.now(UTC).isoformat()
    artifact = RiskModelArtifact(
        disease_id=disease_id,
        display_name=disease.display_name,
        crops=disease.crops,
        pathogen=disease.pathogen,
        category=disease.category,
        feature_columns=feature_columns,
        model=classifier,
        calibrator=calibrator,
        model_version=f"0.1.0-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}",
        rule_version=registry.version,
        aggregation_method=aggregation.method,
        trained_at=trained_at,
        forecast_horizon_days=disease.forecast_horizon_days,
        confidence_tier=disease.confidence_tier,
        metrics=metrics,
        metadata={
            "model_kind": model_kind,
            "aggregation": aggregation.metadata,
            "calibration_source": calibration_source,
            "calibration_warning": (
                "Calibration based on weak labels is provisional. Replace with "
                "field-confirmed gold labels."
            ),
            "confident_training_fraction": float(confident.mean()),
            "weak_positive_rate": float(labels[confident].mean()) if confident.any() else None,
            "fit_rows": int(fit_mask.sum()),
            "all_confident_train_rows": int(train_mask.sum()),
            "training_row_cap": int(model_cfg.get("max_training_rows", 12_000)),
        },
    )
    return DiseaseTrainingResult(
        artifact=artifact,
        weak_probabilities=weak_probabilities,
        label_matrix=matrix,
        lf_summary=analyze_label_matrix(matrix, disease.rules),
        split_assignments=split,
    )

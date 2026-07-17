from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from pest_risk.config import DiseaseConfig
from pest_risk.labeling.aggregate import weighted_vote_probabilities
from pest_risk.labeling.functions import apply_rules
from pest_risk.modeling.artifacts import RiskModelArtifact


@dataclass(frozen=True)
class PseudoLabelSettings:
    positive_threshold: float = 0.95
    negative_threshold: float = 0.05
    minimum_feature_completeness: float = 0.80
    require_rule_agreement: bool = True
    weak_positive_threshold: float = 0.70
    weak_negative_threshold: float = 0.30
    max_rows_per_class: int = 10_000
    random_seed: int = 42


def _feature_completeness(frame: pd.DataFrame, columns: list[str]) -> np.ndarray:
    if not columns:
        return np.zeros(len(frame), dtype=float)
    available = frame.reindex(columns=columns).notna().mean(axis=1)
    return available.to_numpy(dtype=float)


def _bounded_sample(
    selected: pd.DataFrame,
    max_rows_per_class: int,
    random_seed: int,
) -> pd.DataFrame:
    if max_rows_per_class <= 0 or selected.empty:
        return selected
    groups: list[pd.DataFrame] = []
    for label, group in selected.groupby("pseudo_label", sort=True):
        if len(group) > max_rows_per_class:
            class_offset = 1 if label == 1 else 0
            group = group.sample(
                n=max_rows_per_class, random_state=random_seed + class_offset
            )
        groups.append(group)
    if not groups:
        return selected.iloc[0:0]
    return pd.concat(groups, ignore_index=True).sort_values(
        ["pseudo_label", "model_probability"], ascending=[True, False]
    )


def generate_pseudo_labels(
    features: pd.DataFrame,
    artifact: RiskModelArtifact,
    disease: DiseaseConfig,
    settings: PseudoLabelSettings | None = None,
) -> pd.DataFrame:
    """Select only very confident model predictions for optional self-training.

    This function deliberately rejects model/rule contradictions. It does not claim
    that pseudo-labels are equivalent to field labels; their provenance is retained.
    """

    cfg = settings or PseudoLabelSettings()
    model_probability = artifact.predict_probability(features)
    matrix = apply_rules(features, disease.rules)
    weak_probability = weighted_vote_probabilities(matrix, disease.rules)
    completeness = _feature_completeness(features, artifact.feature_columns)

    pseudo_label = np.full(len(features), -1, dtype=int)
    pseudo_label[model_probability >= cfg.positive_threshold] = 1
    pseudo_label[model_probability <= cfg.negative_threshold] = 0

    selected = pseudo_label >= 0
    selected &= completeness >= cfg.minimum_feature_completeness
    agreement = np.ones(len(features), dtype=bool)
    if cfg.require_rule_agreement:
        positive_conflict = (pseudo_label == 1) & (
            weak_probability <= cfg.weak_negative_threshold
        )
        negative_conflict = (pseudo_label == 0) & (
            weak_probability >= cfg.weak_positive_threshold
        )
        agreement &= ~(positive_conflict | negative_conflict)
        selected &= agreement

    output = pd.DataFrame(
        {
            "date": pd.to_datetime(features["date"]).dt.date.astype(str),
            "province": features["province"].astype(str),
            "disease_id": artifact.disease_id,
            "pseudo_label": pseudo_label,
            "model_probability": model_probability,
            "weak_rule_probability": weak_probability,
            "feature_completeness": completeness,
            "rule_agreement": agreement,
            "model_version": artifact.model_version,
            "rule_version": artifact.rule_version,
            "provenance": "high_confidence_model_pseudo_label",
        }
    )
    output = output.loc[selected].reset_index(drop=True)
    return _bounded_sample(output, cfg.max_rows_per_class, cfg.random_seed)

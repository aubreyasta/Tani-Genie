from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import numpy as np

from pest_risk.config import RuleConfig
from pest_risk.constants import NEGATIVE, POSITIVE

LOGGER = logging.getLogger(__name__)


@dataclass
class AggregationResult:
    probabilities: np.ndarray
    method: str
    metadata: dict[str, Any]
    model: Any | None = None


def weighted_vote_probabilities(
    matrix: np.ndarray,
    rules: list[RuleConfig],
    smoothing: float = 0.5,
) -> np.ndarray:
    weights = np.asarray([rule.weight for rule in rules], dtype=float)
    positive_support = ((matrix == POSITIVE) * weights).sum(axis=1)
    negative_support = ((matrix == NEGATIVE) * weights).sum(axis=1)
    denominator = positive_support + negative_support + (2 * smoothing)
    return np.asarray((positive_support + smoothing) / denominator, dtype=float)


def aggregate_labels(
    matrix: np.ndarray,
    rules: list[RuleConfig],
    method: str = "snorkel",
    epochs: int = 500,
    learning_rate: float = 0.01,
    class_balance: list[float] | None = None,
    seed: int = 42,
) -> AggregationResult:
    if matrix.shape[1] != len(rules):
        raise ValueError("Rule count does not match label matrix columns")
    if not len(rules):
        raise ValueError("At least one labeling rule is required")

    if method == "weighted":
        probabilities = weighted_vote_probabilities(matrix, rules)
        return AggregationResult(
            probabilities=probabilities,
            method="weighted_vote",
            metadata={"rule_weights": {rule.id: rule.weight for rule in rules}},
        )

    if method != "snorkel":
        raise ValueError("method must be snorkel or weighted")

    try:
        from snorkel.labeling.model import LabelModel

        label_model = LabelModel(cardinality=2, verbose=False)
        fit_kwargs: dict[str, Any] = {
            "L_train": matrix,
            "n_epochs": epochs,
            "lr": learning_rate,
            "seed": seed,
            "log_freq": max(epochs // 5, 1),
        }
        if class_balance is not None:
            fit_kwargs["class_balance"] = class_balance
        label_model.fit(**fit_kwargs)
        probabilities = label_model.predict_proba(matrix)[:, POSITIVE]
        learned = label_model.get_weights().tolist()
        return AggregationResult(
            probabilities=probabilities,
            method="snorkel_label_model",
            metadata={
                "learned_rule_weights": {
                    rule.id: float(weight) for rule, weight in zip(rules, learned, strict=True)
                },
                "epochs": epochs,
                "learning_rate": learning_rate,
                "class_balance": class_balance,
            },
            model=label_model,
        )
    except Exception as exc:
        LOGGER.warning("Snorkel aggregation failed; using weighted fallback: %s", exc)
        probabilities = weighted_vote_probabilities(matrix, rules)
        return AggregationResult(
            probabilities=probabilities,
            method="weighted_vote_fallback",
            metadata={
                "fallback_reason": str(exc),
                "rule_weights": {rule.id: rule.weight for rule in rules},
            },
        )

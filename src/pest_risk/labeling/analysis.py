from __future__ import annotations

import numpy as np
import pandas as pd

from pest_risk.config import RuleConfig
from pest_risk.constants import ABSTAIN, NEGATIVE, POSITIVE


def analyze_label_matrix(matrix: np.ndarray, rules: list[RuleConfig]) -> pd.DataFrame:
    if matrix.ndim != 2:
        raise ValueError("Label matrix must be two-dimensional")
    rows = max(matrix.shape[0], 1)
    non_abstain_count = (matrix != ABSTAIN).sum(axis=1)
    has_positive = (matrix == POSITIVE).any(axis=1)
    has_negative = (matrix == NEGATIVE).any(axis=1)
    conflict_rows = has_positive & has_negative

    summaries: list[dict[str, float | str]] = []
    for index, rule in enumerate(rules):
        labels = matrix[:, index]
        fired = labels != ABSTAIN
        overlap = fired & (non_abstain_count > 1)
        conflict = fired & conflict_rows
        summaries.append(
            {
                "rule_id": rule.id,
                "vote": rule.vote,
                "weight": rule.weight,
                "coverage": float(fired.sum() / rows),
                "overlap": float(overlap.sum() / rows),
                "conflict": float(conflict.sum() / rows),
                "positive_count": float((labels == POSITIVE).sum()),
                "negative_count": float((labels == NEGATIVE).sum()),
            }
        )
    return pd.DataFrame(summaries)

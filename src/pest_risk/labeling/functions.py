from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from typing import Any, cast

import numpy as np
import pandas as pd

from pest_risk.config import ConditionConfig, RuleConfig
from pest_risk.constants import ABSTAIN, NEGATIVE, POSITIVE


def vote_value(rule: RuleConfig) -> int:
    return POSITIVE if rule.vote == "positive" else NEGATIVE


def _sequence_value(condition: ConditionConfig) -> Sequence[Any]:
    expected = condition.value
    if not isinstance(expected, (list, tuple)):
        raise ValueError(f"Operator {condition.op} requires a list or tuple value")
    return cast(Sequence[Any], expected)


def _iterable_value(condition: ConditionConfig) -> Iterable[Any]:
    expected = condition.value
    if isinstance(expected, (str, bytes)) or not isinstance(expected, Iterable):
        raise ValueError(f"Operator {condition.op} requires a non-string iterable value")
    return expected


def _scalar_value(condition: ConditionConfig) -> Any:
    expected = condition.value
    if expected is None:
        raise ValueError(f"Operator {condition.op} requires a value")
    return expected


def evaluate_condition_value(value: Any, condition: ConditionConfig) -> bool:
    op = condition.op

    if op == "isna":
        return bool(pd.isna(value))
    if op == "notna":
        return not bool(pd.isna(value))
    if pd.isna(value):
        return False

    if op == "between":
        bounds = _sequence_value(condition)
        if len(bounds) != 2:
            raise ValueError("between requires exactly two values")
        lower, upper = bounds
        return bool(lower <= value <= upper)
    if op == "in":
        return bool(value in _iterable_value(condition))
    if op == "not_in":
        return bool(value not in _iterable_value(condition))

    expected = _scalar_value(condition)
    if op == "gt":
        return bool(value > expected)
    if op == "gte":
        return bool(value >= expected)
    if op == "lt":
        return bool(value < expected)
    if op == "lte":
        return bool(value <= expected)
    if op == "eq":
        return bool(value == expected)
    if op == "neq":
        return bool(value != expected)
    raise ValueError(f"Unsupported operator: {op}")


def evaluate_rule_record(record: Mapping[str, Any], rule: RuleConfig) -> int:
    all_match = all(
        evaluate_condition_value(record.get(condition.feature), condition)
        for condition in rule.all
    )
    any_match = (
        any(
            evaluate_condition_value(record.get(condition.feature), condition)
            for condition in rule.any
        )
        if rule.any
        else True
    )
    has_condition = bool(rule.all or rule.any)
    return vote_value(rule) if has_condition and all_match and any_match else ABSTAIN


def condition_mask(df: pd.DataFrame, condition: ConditionConfig) -> pd.Series:
    if condition.feature not in df:
        return pd.Series(False, index=df.index)
    series = df[condition.feature]
    op = condition.op

    if op == "isna":
        return series.isna()
    if op == "notna":
        return series.notna()
    if op == "between":
        bounds = _sequence_value(condition)
        if len(bounds) != 2:
            raise ValueError("between requires exactly two values")
        lower, upper = bounds
        return series.between(lower, upper, inclusive="both").fillna(False)
    if op == "in":
        return series.isin(_iterable_value(condition)).fillna(False)
    if op == "not_in":
        return (~series.isin(_iterable_value(condition)) & series.notna()).fillna(False)

    expected = _scalar_value(condition)
    # Pandas stubs cannot fully express dynamic YAML scalar comparisons.
    dynamic_expected = cast(Any, expected)
    if op == "gt":
        return series.gt(dynamic_expected).fillna(False)
    if op == "gte":
        return series.ge(dynamic_expected).fillna(False)
    if op == "lt":
        return series.lt(dynamic_expected).fillna(False)
    if op == "lte":
        return series.le(dynamic_expected).fillna(False)
    if op == "eq":
        return series.eq(dynamic_expected).fillna(False)
    if op == "neq":
        return series.ne(dynamic_expected).fillna(False)
    raise ValueError(f"Unsupported operator: {op}")


def rule_mask(df: pd.DataFrame, rule: RuleConfig) -> pd.Series:
    if not (rule.all or rule.any):
        return pd.Series(False, index=df.index)

    all_mask = pd.Series(True, index=df.index)
    for condition in rule.all:
        all_mask &= condition_mask(df, condition)

    any_mask = pd.Series(True, index=df.index)
    if rule.any:
        any_mask = pd.Series(False, index=df.index)
        for condition in rule.any:
            any_mask |= condition_mask(df, condition)

    return (all_mask & any_mask).fillna(False)


def apply_rules(df: pd.DataFrame, rules: list[RuleConfig]) -> np.ndarray:
    matrix = np.full((len(df), len(rules)), ABSTAIN, dtype=np.int8)
    for index, rule in enumerate(rules):
        mask = rule_mask(df, rule).to_numpy(dtype=bool)
        matrix[mask, index] = vote_value(rule)
    return matrix


def triggered_rules(record: Mapping[str, Any], rules: list[RuleConfig]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for rule in rules:
        label = evaluate_rule_record(record, rule)
        if label == ABSTAIN:
            continue
        output.append(
            {
                "rule_id": rule.id,
                "vote": rule.vote,
                "weight": rule.weight,
                "rationale": rule.rationale,
            }
        )
    return sorted(output, key=lambda item: float(item["weight"]), reverse=True)

import numpy as np
import pandas as pd

from pest_risk.config import ConditionConfig, RuleConfig
from pest_risk.constants import ABSTAIN, NEGATIVE, POSITIVE
from pest_risk.labeling.aggregate import weighted_vote_probabilities
from pest_risk.labeling.functions import apply_rules, evaluate_rule_record


def test_rule_returns_vote_or_abstain() -> None:
    rule = RuleConfig(
        id="wet",
        vote="positive",
        weight=1.0,
        rationale="test",
        all=[ConditionConfig(feature="rh", op="gte", value=90)],
    )
    assert evaluate_rule_record({"rh": 95}, rule) == POSITIVE
    assert evaluate_rule_record({"rh": 80}, rule) == ABSTAIN


def test_weighted_vote_balances_positive_and_negative() -> None:
    rules = [
        RuleConfig(
            id="p",
            vote="positive",
            weight=2.0,
            rationale="positive",
            all=[ConditionConfig(feature="x", op="gt", value=0)],
        ),
        RuleConfig(
            id="n",
            vote="negative",
            weight=1.0,
            rationale="negative",
            all=[ConditionConfig(feature="y", op="gt", value=0)],
        ),
    ]
    frame = pd.DataFrame({"x": [1, -1], "y": [1, 1]})
    matrix = apply_rules(frame, rules)
    assert matrix.tolist() == [[POSITIVE, NEGATIVE], [ABSTAIN, NEGATIVE]]
    probabilities = weighted_vote_probabilities(matrix, rules)
    assert probabilities[0] > 0.5
    assert probabilities[1] < 0.5
    assert np.all((probabilities >= 0) & (probabilities <= 1))

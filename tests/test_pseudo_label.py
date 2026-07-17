from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier

from pest_risk.config import DiseaseConfig, RuleConfig
from pest_risk.modeling.artifacts import RiskModelArtifact
from pest_risk.modeling.calibrate import SigmoidCalibrator
from pest_risk.modeling.pseudo_label import PseudoLabelSettings, generate_pseudo_labels


def test_pseudo_labels_keep_provenance_and_thresholds() -> None:
    frame = pd.DataFrame(
        {
            "date": pd.date_range("2026-01-01", periods=4),
            "province": ["A"] * 4,
            "temp_avg_3d_c": [20.0, 20.0, 35.0, 35.0],
        }
    )
    model = DummyClassifier(strategy="constant", constant=1)
    model.fit(frame[["temp_avg_3d_c"]], np.array([0, 1, 0, 1]))
    artifact = RiskModelArtifact(
        disease_id="demo",
        display_name="Demo",
        crops=["rice"],
        pathogen="X",
        category="FUNGAL_DISEASE",
        feature_columns=["temp_avg_3d_c"],
        model=model,
        calibrator=SigmoidCalibrator(),
        model_version="test",
        rule_version="test",
        aggregation_method="weighted",
        trained_at="2026-01-01T00:00:00Z",
        forecast_horizon_days=1,
        confidence_tier="low",
    )
    disease = DiseaseConfig(
        display_name="Demo",
        pathogen="X",
        category="FUNGAL_DISEASE",
        crops=["rice"],
        forecast_horizon_days=1,
        confidence_tier="low",
        description="Demo",
        sources=[],
        rules=[
            RuleConfig(
                id="positive_temp",
                vote="positive",
                weight=1.0,
                rationale="demo",
                all=[{"feature": "temp_avg_3d_c", "op": "lte", "value": 25}],
            )
        ],
    )
    selected = generate_pseudo_labels(
        frame,
        artifact,
        disease,
        PseudoLabelSettings(
            positive_threshold=0.95,
            negative_threshold=0.05,
            minimum_feature_completeness=1.0,
            require_rule_agreement=False,
        ),
    )
    assert len(selected) == 4
    assert set(selected["pseudo_label"]) == {1}
    assert set(selected["provenance"]) == {"high_confidence_model_pseudo_label"}

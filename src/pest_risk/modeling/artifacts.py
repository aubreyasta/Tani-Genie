from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from pest_risk.modeling.calibrate import SigmoidCalibrator


def positive_class_probability(model: Any, frame: pd.DataFrame) -> np.ndarray:
    probabilities = np.asarray(model.predict_proba(frame), dtype=float)
    classes = np.asarray(getattr(model, "classes_", [0, 1]))
    positive = np.flatnonzero(classes == 1)
    if positive.size:
        return probabilities[:, int(positive[0])]
    return np.zeros(len(frame), dtype=float)


@dataclass
class RiskModelArtifact:
    disease_id: str
    display_name: str
    crops: list[str]
    pathogen: str
    category: str
    feature_columns: list[str]
    model: Any
    calibrator: SigmoidCalibrator
    model_version: str
    rule_version: str
    aggregation_method: str
    trained_at: str
    forecast_horizon_days: int
    confidence_tier: str
    metrics: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def predict_probability(self, frame: pd.DataFrame) -> np.ndarray:
        missing = [column for column in self.feature_columns if column not in frame]
        working = frame.copy()
        for column in missing:
            working[column] = np.nan
        raw = positive_class_probability(self.model, working[self.feature_columns])
        return self.calibrator.predict(raw)

    def public_metadata(self) -> dict[str, Any]:
        payload = asdict(self)
        payload.pop("model", None)
        payload.pop("calibrator", None)
        return payload


class ArtifactStore:
    def __init__(self, directory: str | Path) -> None:
        self.directory = Path(directory)
        self._artifacts: dict[str, RiskModelArtifact] = {}

    def load(self) -> ArtifactStore:
        self._artifacts = {}
        if not self.directory.exists():
            return self
        for path in sorted(self.directory.glob("*.joblib")):
            artifact = joblib.load(path)
            if not isinstance(artifact, RiskModelArtifact):
                continue
            self._artifacts[artifact.disease_id] = artifact
        return self

    def get(self, disease_id: str) -> RiskModelArtifact | None:
        return self._artifacts.get(disease_id)

    def all(self) -> dict[str, RiskModelArtifact]:
        return dict(self._artifacts)


def save_artifact(artifact: RiskModelArtifact, directory: str | Path) -> Path:
    target_dir = Path(directory)
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / f"{artifact.disease_id}.joblib"
    joblib.dump(artifact, path)
    metadata_path = target_dir / f"{artifact.disease_id}.json"
    metadata_path.write_text(
        json.dumps(artifact.public_metadata(), indent=2, ensure_ascii=False, default=str),
        encoding="utf-8",
    )
    return path

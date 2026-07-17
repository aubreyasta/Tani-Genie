from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression


class SigmoidCalibrator:
    """Small Platt-style probability calibrator.

    This class is intentionally independent of CalibratedClassifierCV so artifacts
    remain stable across scikit-learn versions. Calibration on weak labels is only
    provisional; production calibration must use field-confirmed gold labels.
    """

    def __init__(self) -> None:
        self.model: LogisticRegression | None = None

    def fit(self, probabilities: np.ndarray, labels: np.ndarray) -> SigmoidCalibrator:
        x = self._logit(probabilities).reshape(-1, 1)
        y = np.asarray(labels, dtype=int)
        if len(np.unique(y)) < 2:
            self.model = None
            return self
        self.model = LogisticRegression(C=1.0, solver="lbfgs", max_iter=500)
        self.model.fit(x, y)
        return self

    def predict(self, probabilities: np.ndarray) -> np.ndarray:
        values = np.asarray(probabilities, dtype=float)
        if self.model is None:
            return values.clip(0, 1)
        x = self._logit(values).reshape(-1, 1)
        return np.asarray(self.model.predict_proba(x)[:, 1], dtype=float)

    @staticmethod
    def _logit(probabilities: np.ndarray) -> np.ndarray:
        clipped = np.clip(np.asarray(probabilities, dtype=float), 1e-6, 1 - 1e-6)
        return np.asarray(np.log(clipped / (1 - clipped)), dtype=float)

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from pest_risk.config import (
    CropRegistry,
    DiseaseConfig,
    ModelSettings,
    RuleRegistry,
    load_crop_registry,
    load_model_settings,
    load_rule_registry,
    normalize_crop,
)
from pest_risk.data.quality import sanitize_environmental_data
from pest_risk.features.engineer import engineer_features
from pest_risk.inference.explain import compact_feature_snapshot
from pest_risk.labeling.aggregate import weighted_vote_probabilities
from pest_risk.labeling.functions import apply_rules, triggered_rules
from pest_risk.modeling.artifacts import ArtifactStore

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class ServicePaths:
    model_dir: Path
    rule_config: Path
    crop_config: Path
    model_config: Path


class RiskService:
    def __init__(self, paths: ServicePaths, allow_rule_fallback: bool = True) -> None:
        self.paths = paths
        self.allow_rule_fallback = allow_rule_fallback
        self.rules: RuleRegistry = load_rule_registry(paths.rule_config)
        self.crops: CropRegistry = load_crop_registry(paths.crop_config)
        self.settings: ModelSettings = load_model_settings(paths.model_config)
        self.artifacts = ArtifactStore(paths.model_dir).load()

    def reload_artifacts(self) -> int:
        self.artifacts.load()
        return len(self.artifacts.all())

    def disease_catalog(self) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        for disease_id, disease in self.rules.diseases.items():
            artifact = self.artifacts.get(disease_id)
            output.append(
                {
                    "disease_id": disease_id,
                    "display_name": disease.display_name,
                    "pathogen": disease.pathogen,
                    "category": disease.category,
                    "crops": disease.crops,
                    "forecast_horizon_days": disease.forecast_horizon_days,
                    "confidence_tier": disease.confidence_tier,
                    "model_available": artifact is not None,
                    "model_version": artifact.model_version if artifact else None,
                    "rule_version": self.rules.version,
                }
            )
        return output

    def predict(
        self,
        crop: str,
        province: str,
        weather_history: list[dict[str, Any]],
        prediction_date: str | None = None,
    ) -> dict[str, Any]:
        crop_id = normalize_crop(crop, self.crops)
        if not weather_history:
            raise ValueError("weather_history cannot be empty")

        raw = pd.DataFrame(weather_history)
        raw["province"] = province
        raw = sanitize_environmental_data(raw)
        features = engineer_features(raw)
        if prediction_date:
            target_date = pd.Timestamp(prediction_date)
            eligible = features[features["date"] <= target_date]
            if eligible.empty:
                raise ValueError("prediction_date is earlier than every weather record")
            latest = eligible.tail(1)
        else:
            latest = features.tail(1)
        latest_record = {str(key): value for key, value in latest.iloc[0].to_dict().items()}

        crop_config = self.crops.crops[crop_id]
        disease_results: list[dict[str, Any]] = []
        for disease_id in crop_config.supported_diseases:
            disease = self.rules.diseases[disease_id]
            disease_results.append(
                self._predict_disease(disease_id, disease, latest, latest_record)
            )

        disease_results.sort(key=lambda item: float(item["risk_score"]), reverse=True)
        overall_score = max((float(item["risk_score"]) for item in disease_results), default=0.0)
        overall_level = self._risk_level(overall_score)
        observed_date = pd.Timestamp(latest_record["date"]).date().isoformat()
        return {
            "crop": crop_id,
            "province": province,
            "prediction_date": observed_date,
            "overall_flag": overall_level,
            "overall_score": round(overall_score, 4),
            "disease_risks": disease_results,
            "data_window_days": int(len(features)),
            "rule_version": self.rules.version,
            "disclaimer": (
                "Skor menunjukkan risiko kondisi lingkungan yang kondusif, bukan diagnosis "
                "bahwa tanaman telah terinfeksi. Konfirmasi dengan inspeksi lapangan."
            ),
        }

    def _predict_disease(
        self,
        disease_id: str,
        disease: DiseaseConfig,
        latest: pd.DataFrame,
        latest_record: dict[str, Any],
    ) -> dict[str, Any]:
        artifact = self.artifacts.get(disease_id)
        model_available = artifact is not None

        if artifact is not None:
            probability = float(artifact.predict_probability(latest)[0])
            prediction_method = "machine_learning"
            model_version = artifact.model_version
        elif self.allow_rule_fallback:
            matrix = apply_rules(latest, disease.rules)
            probability = float(weighted_vote_probabilities(matrix, disease.rules)[0])
            prediction_method = "rule_fallback"
            model_version = None
        else:
            raise RuntimeError(f"No model is available for {disease_id}")

        evidence = triggered_rules(latest_record, disease.rules)
        relevant_features = {
            condition.feature
            for rule in disease.rules
            for condition in [*rule.all, *rule.any]
        }
        snapshots = compact_feature_snapshot(latest_record, relevant_features)
        completeness = self._feature_completeness(latest_record, relevant_features)
        confidence = self._confidence(
            probability=probability,
            completeness=completeness,
            confidence_tier=disease.confidence_tier,
            model_available=model_available,
        )
        positive_evidence = [item for item in evidence if item["vote"] == "positive"][:4]
        negative_evidence = [item for item in evidence if item["vote"] == "negative"][:3]

        return {
            "disease_id": disease_id,
            "disease_name": disease.display_name,
            "pathogen": disease.pathogen,
            "category": disease.category,
            "risk_score": round(probability, 4),
            "risk_level": self._risk_level(probability),
            "confidence": round(confidence, 4),
            "confidence_tier": disease.confidence_tier,
            "forecast_horizon_days": disease.forecast_horizon_days,
            "prediction_method": prediction_method,
            "model_version": model_version,
            "rule_version": self.rules.version,
            "data_completeness": round(completeness, 4),
            "positive_evidence": positive_evidence,
            "negative_evidence": negative_evidence,
            "feature_snapshot": snapshots,
        }

    def _risk_level(self, probability: float) -> str:
        thresholds = self.settings.risk_thresholds
        if probability < float(thresholds.get("low_max", 0.30)):
            return "LOW"
        if probability < float(thresholds.get("medium_max", 0.65)):
            return "MEDIUM"
        return "HIGH"

    @staticmethod
    def _feature_completeness(record: dict[str, Any], features: set[str]) -> float:
        if not features:
            return 0.0
        present = 0
        for feature in features:
            value = record.get(feature)
            if value is None:
                continue
            try:
                if np.isnan(float(value)):
                    continue
            except (TypeError, ValueError):
                pass
            present += 1
        return present / len(features)

    @staticmethod
    def _confidence(
        probability: float,
        completeness: float,
        confidence_tier: str,
        model_available: bool,
    ) -> float:
        tier_base = {"low": 0.35, "medium": 0.50, "high": 0.65}[confidence_tier]
        separation = abs(probability - 0.5) * 2.0
        score = tier_base + (0.20 * completeness) + (0.15 * separation)
        if model_available:
            score += 0.10
        return float(np.clip(score, 0.0, 0.95))

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field, field_validator

from pest_risk.constants import SUPPORTED_OPERATORS


class ConditionConfig(BaseModel):
    feature: str
    op: str
    value: Any | None = None

    @field_validator("op")
    @classmethod
    def validate_operator(cls, value: str) -> str:
        if value not in SUPPORTED_OPERATORS:
            raise ValueError(f"Unsupported operator: {value}")
        return value


class RuleConfig(BaseModel):
    id: str
    vote: str
    weight: float = Field(default=1.0, gt=0)
    rationale: str
    all: list[ConditionConfig] = Field(default_factory=list)
    any: list[ConditionConfig] = Field(default_factory=list)

    @field_validator("vote")
    @classmethod
    def validate_vote(cls, value: str) -> str:
        if value not in {"positive", "negative"}:
            raise ValueError("vote must be positive or negative")
        return value

    @field_validator("all")
    @classmethod
    def validate_has_conditions(cls, value: list[ConditionConfig]) -> list[ConditionConfig]:
        return value


class SourceConfig(BaseModel):
    id: str
    title: str
    organization: str
    url: str
    notes: str


class DiseaseConfig(BaseModel):
    display_name: str
    pathogen: str
    category: str
    crops: list[str]
    forecast_horizon_days: int = Field(gt=0, le=30)
    confidence_tier: str
    description: str
    sources: list[SourceConfig]
    rules: list[RuleConfig]

    @field_validator("confidence_tier")
    @classmethod
    def validate_confidence_tier(cls, value: str) -> str:
        if value not in {"low", "medium", "high"}:
            raise ValueError("confidence_tier must be low, medium, or high")
        return value


class RuleRegistry(BaseModel):
    version: str
    labels: dict[str, int]
    diseases: dict[str, DiseaseConfig]


class CropConfig(BaseModel):
    display_name: str
    aliases: list[str]
    supported_diseases: list[str]


class CropRegistry(BaseModel):
    version: str
    crops: dict[str, CropConfig]


@dataclass(frozen=True)
class ModelSettings:
    raw: dict[str, Any]

    @property
    def risk_thresholds(self) -> dict[str, float]:
        raw_thresholds = self.raw.get(
            "risk_thresholds", {"low_max": 0.3, "medium_max": 0.65}
        )
        if not isinstance(raw_thresholds, dict):
            raise ValueError("risk_thresholds must be a mapping")
        return {str(key): float(value) for key, value in raw_thresholds.items()}


def _load_yaml(path: str | Path) -> dict[str, Any]:
    target = Path(path)
    if not target.exists():
        raise FileNotFoundError(f"Config file not found: {target}")
    with target.open("r", encoding="utf-8") as handle:
        loaded = yaml.safe_load(handle)
    if not isinstance(loaded, dict):
        raise ValueError(f"Expected mapping in config: {target}")
    return loaded


def load_rule_registry(path: str | Path) -> RuleRegistry:
    return RuleRegistry.model_validate(_load_yaml(path))


def load_crop_registry(path: str | Path) -> CropRegistry:
    return CropRegistry.model_validate(_load_yaml(path))


def load_model_settings(path: str | Path) -> ModelSettings:
    return ModelSettings(raw=_load_yaml(path))


def normalize_crop(value: str, registry: CropRegistry) -> str:
    normalized = value.strip().lower().replace("-", "_")
    for crop_id, crop in registry.crops.items():
        candidates = {crop_id.lower(), *(alias.lower().replace("-", "_") for alias in crop.aliases)}
        if normalized in candidates:
            return crop_id
    raise ValueError(f"Unsupported crop: {value}")

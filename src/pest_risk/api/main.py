from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pest_risk import __version__
from pest_risk.api.schemas import BatchPredictionRequest, PredictionRequest
from pest_risk.inference.service import RiskService, ServicePaths
from pest_risk.utils.logging import configure_logging

configure_logging()

app = FastAPI(
    title="Tani-Genie Pest & Disease Risk API",
    version=__version__,
    description=(
        "Environmental disease-risk scoring with research rules, weak supervision, "
        "Snorkel aggregation, and tabular machine learning."
    ),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_service() -> RiskService:
    model_dir = Path(os.getenv("PEST_RISK_MODEL_DIR", "models"))
    rule_config = Path(os.getenv("PEST_RISK_RULE_CONFIG", "configs/disease_rules.yaml"))
    crop_config = Path(os.getenv("PEST_RISK_CROP_CONFIG", "configs/crops.yaml"))
    model_config = Path(os.getenv("PEST_RISK_MODEL_CONFIG", "configs/model.yaml"))
    allow_fallback = os.getenv("PEST_RISK_ALLOW_RULE_FALLBACK", "true").lower() in {
        "1",
        "true",
        "yes",
    }
    return RiskService(
        ServicePaths(
            model_dir=model_dir,
            rule_config=rule_config,
            crop_config=crop_config,
            model_config=model_config,
        ),
        allow_rule_fallback=allow_fallback,
    )


@app.get("/health")
def health() -> dict[str, Any]:
    service = get_service()
    return {
        "status": "ok",
        "version": __version__,
        "model_count": len(service.artifacts.all()),
        "rule_version": service.rules.version,
        "rule_fallback_enabled": service.allow_rule_fallback,
    }


@app.get("/v1/diseases")
def diseases() -> list[dict[str, Any]]:
    return get_service().disease_catalog()


@app.post("/v1/risk/predict")
def predict(request: PredictionRequest) -> dict[str, Any]:
    try:
        return get_service().predict(
            crop=request.crop,
            province=request.province,
            prediction_date=(
                request.prediction_date.isoformat() if request.prediction_date else None
            ),
            weather_history=[record.model_dump(mode="json") for record in request.weather_history],
        )
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/v1/risk/predict-batch")
def predict_batch(request: BatchPredictionRequest) -> dict[str, Any]:
    predictions: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    for index, item in enumerate(request.requests):
        try:
            predictions.append(
                get_service().predict(
                    crop=item.crop,
                    province=item.province,
                    prediction_date=item.prediction_date.isoformat()
                    if item.prediction_date
                    else None,
                    weather_history=[
                        record.model_dump(mode="json") for record in item.weather_history
                    ],
                )
            )
        except Exception as exc:  # Batch requests should preserve successful siblings.
            errors.append({"index": index, "error": str(exc)})
    return {"predictions": predictions, "errors": errors}


@app.post("/admin/reload-models")
def reload_models() -> dict[str, Any]:
    count = get_service().reload_artifacts()
    return {"status": "reloaded", "model_count": count}

"""
FastAPI application exposing price predictions to the website's backend.

Run locally:
    uvicorn api.main:app --reload --port 8000

Then e.g.:
    curl -X POST http://localhost:8000/predict \
      -H "Content-Type: application/json" \
      -d '{"commodity":"beras","market":"pasar_tradisional","province":"DKI Jakarta","target_date":"2026-08-01"}'
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api import service
from api.schemas import PredictionRequest, PredictionResponse, SeriesOption
from src.models.predict import UnknownSeriesError

app = FastAPI(
    title="Tani Genie Price Prediction API",
    description=(
        "Serves next-N-day price forecasts for beras, bawang merah, bawang putih, "
        "cabai merah, and cabai rawit across Indonesia's four market levels "
        "(pasar tradisional, pasar modern, pedagang besar, produsen) and 34 provinces."
    ),
    version="1.0.0",
)

# Restrict this to the website's actual origin(s) in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/metadata")
def metadata() -> dict:
    """Lets the frontend populate commodity/market dropdowns without
    hard-coding them."""
    return service.get_metadata()


@app.get("/series/{commodity}", response_model=list[SeriesOption])
def series_options(commodity: str) -> list[dict]:
    """Lists the (market, province) combinations available for a commodity."""
    try:
        return service.get_series_options(commodity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict", response_model=PredictionResponse)
def predict_price(request: PredictionRequest) -> dict:
    try:
        return service.get_prediction(
            commodity=request.commodity,
            market=request.market,
            province=request.province,
            target_date=request.target_date,
        )
    except UnknownSeriesError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

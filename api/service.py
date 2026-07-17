"""
Thin service layer between the FastAPI routes and src/models/predict.py.
Keeping this separate means the web framework can be swapped (FastAPI ->
Flask/Django) without touching the ML code, and the ML code can be unit
tested (see tests/) without spinning up a web server.
"""
from __future__ import annotations

from src.config import COMMODITIES, MARKETS
from src.models.predict import (
    UnknownSeriesError,
    available_commodities,
    available_series,
    predict,
)


def get_metadata() -> dict:
    """Static metadata a frontend can use to populate form dropdowns."""
    return {
        "commodities": COMMODITIES,
        "markets": list(MARKETS.keys()),
        "trained_commodities": available_commodities(),
    }


def get_series_options(commodity: str) -> list[dict]:
    if commodity not in COMMODITIES:
        raise ValueError(f"Unknown commodity '{commodity}'. Valid options: {COMMODITIES}")
    df = available_series(commodity)
    return df.to_dict(orient="records")


def get_prediction(commodity: str, market: str, province: str, target_date) -> dict:
    if commodity not in COMMODITIES:
        raise ValueError(f"Unknown commodity '{commodity}'. Valid options: {COMMODITIES}")
    if market not in MARKETS:
        raise ValueError(f"Unknown market '{market}'. Valid options: {list(MARKETS.keys())}")
    return predict(commodity, market, province, target_date)


__all__ = ["get_metadata", "get_series_options", "get_prediction", "UnknownSeriesError"]

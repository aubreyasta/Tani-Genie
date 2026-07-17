from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    commodity: str = Field(..., examples=["beras"])
    market: str = Field(..., examples=["pasar_tradisional"])
    province: str = Field(..., examples=["DKI Jakarta"])
    target_date: date = Field(..., examples=["2026-08-01"])


class PredictionResponse(BaseModel):
    commodity: str
    market: str
    province: str
    target_date: str
    predicted_price: float
    horizon_days: int
    last_known_date: str
    last_known_price: float


class SeriesOption(BaseModel):
    market: str
    province: str


class ErrorResponse(BaseModel):
    detail: str

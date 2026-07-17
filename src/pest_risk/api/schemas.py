from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, model_validator


class DailyEnvironmentalRecord(BaseModel):
    date: date
    temp_avg_c: float | None = None
    temp_max_c: float | None = None
    temp_min_c: float | None = None
    relative_humidity_pct: float | None = Field(default=None, ge=0, le=100)
    rainfall_mm: float | None = Field(default=None, ge=0)
    wind_speed_ms: float | None = Field(default=None, ge=0)
    estimated_wet_hours: float | None = Field(default=None, ge=0, le=24)
    root_zone_soil_moisture_raw: float | None = None
    surface_soil_moisture_raw: float | None = None
    ndvi: float | None = Field(default=None, ge=-1, le=1)

    @model_validator(mode="after")
    def infer_temperature_bounds(self) -> DailyEnvironmentalRecord:
        if self.temp_avg_c is not None:
            if self.temp_max_c is None:
                self.temp_max_c = self.temp_avg_c
            if self.temp_min_c is None:
                self.temp_min_c = self.temp_avg_c
        return self


class PredictionRequest(BaseModel):
    crop: str
    province: str
    prediction_date: date | None = None
    weather_history: list[DailyEnvironmentalRecord] = Field(min_length=1, max_length=400)


class BatchPredictionRequest(BaseModel):
    requests: list[PredictionRequest] = Field(min_length=1, max_length=100)

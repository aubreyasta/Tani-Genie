"""HTTP API the Tani Genie web app calls. Run from backend/: uvicorn app.main:app --port 8001"""

import datetime as dt

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from features.planting_calendar import CROPS, build_calendar, fetch_nasa_power, get_status

app = FastAPI(title="Tani Genie Planting Calendar")

WEATHER_PARAMS = "T2M,PRECTOTCORR,RH2M,WS2M"


class CalendarRequest(BaseModel):
    crop: str
    planting_date: dt.date


class WeatherRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    days: int = Field(default=7, ge=1, le=30)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/calendar")
def calendar(req: CalendarRequest):
    if req.crop not in CROPS:
        raise HTTPException(404, f"Unknown crop: {req.crop}")
    return {
        **build_calendar(req.crop, req.planting_date),
        "status": get_status(req.crop, req.planting_date),
    }


@app.post("/weather")
def weather(req: WeatherRequest):
    end = dt.date.today()
    try:
        df = fetch_nasa_power(
            req.latitude, req.longitude, end - dt.timedelta(days=req.days), end, WEATHER_PARAMS
        )
    except Exception as e:
        raise HTTPException(502, f"NASA POWER request failed: {e.__class__.__name__}") from e
    return latest_reading(df)


def latest_reading(df):
    # POWER lags a few days behind today; its newest rows are all -999 (NaN after load).
    complete = df.dropna()
    if complete.empty:
        raise HTTPException(502, "NASA POWER returned no complete day in range")
    day, row = complete.index[-1], complete.iloc[-1]
    return {
        "observed_at": day.date().isoformat(),
        "temperature_c": round(float(row["T2M"]), 1),
        "rainfall_mm": round(float(row["PRECTOTCORR"]), 1),
        "humidity_pct": round(float(row["RH2M"]), 1),
        "wind_speed_kmh": round(float(row["WS2M"]) * 3.6, 1),
        "source": "NASA POWER",
    }

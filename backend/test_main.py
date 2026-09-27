"""Run from backend/: python -m pytest test_main.py"""

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app, latest_reading

client = TestClient(app)


def test_calendar_returns_schedule_and_status():
    res = client.post("/calendar", json={"crop": "cabai_merah", "planting_date": "2026-01-01"})
    assert res.status_code == 200
    body = res.json()
    assert body["stages"] and body["tasks"]
    assert body["status"]["total_days"] > 0


def test_calendar_rejects_unknown_crop():
    res = client.post("/calendar", json={"crop": "kopi", "planting_date": "2026-01-01"})
    assert res.status_code == 404


def test_latest_reading_skips_incomplete_days():
    df = pd.DataFrame(
        {"T2M": [27.0, np.nan], "PRECTOTCORR": [4.2, np.nan], "RH2M": [82.0, 80.0], "WS2M": [2.0, np.nan]},
        index=pd.to_datetime(["2026-09-20", "2026-09-21"]),
    )
    reading = latest_reading(df)
    assert reading["observed_at"] == "2026-09-20"
    assert reading["wind_speed_kmh"] == 7.2

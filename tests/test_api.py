import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_metadata_lists_five_commodities():
    r = client.get("/metadata")
    assert r.status_code == 200
    assert len(r.json()["commodities"]) == 5


def test_series_endpoint_unknown_commodity():
    r = client.get("/series/durian")
    assert r.status_code == 400


def test_predict_success():
    payload = {
        "commodity": "beras",
        "market": "pasar_tradisional",
        "province": "DKI Jakarta",
        "target_date": "2026-08-01",
    }
    r = client.post("/predict", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["predicted_price"] > 0
    assert body["horizon_days"] > 0


def test_predict_unknown_province_returns_404():
    payload = {
        "commodity": "beras",
        "market": "pasar_tradisional",
        "province": "Atlantis",
        "target_date": "2026-08-01",
    }
    r = client.post("/predict", json=payload)
    assert r.status_code == 404


def test_predict_horizon_too_far_returns_400():
    payload = {
        "commodity": "beras",
        "market": "pasar_tradisional",
        "province": "DKI Jakarta",
        "target_date": "2027-06-01",
    }
    r = client.post("/predict", json=payload)
    assert r.status_code == 400

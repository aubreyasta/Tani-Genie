import json
from pathlib import Path

from fastapi.testclient import TestClient

from pest_risk.api.main import app, get_service


def test_health_and_rule_fallback_prediction() -> None:
    get_service.cache_clear()
    client = TestClient(app)
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    payload = json.loads(Path("data/sample/prediction_request.json").read_text(encoding="utf-8"))
    response = client.post("/v1/risk/predict", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["crop"] == "chili_red"
    assert body["overall_flag"] in {"LOW", "MEDIUM", "HIGH"}
    assert len(body["disease_risks"]) == 2

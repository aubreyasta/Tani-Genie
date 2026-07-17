from __future__ import annotations

import argparse
import json
from pathlib import Path

from pest_risk.inference.service import RiskService, ServicePaths


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a local risk prediction")
    parser.add_argument("--request", required=True)
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--rule-config", default="configs/disease_rules.yaml")
    parser.add_argument("--crop-config", default="configs/crops.yaml")
    parser.add_argument("--model-config", default="configs/model.yaml")
    args = parser.parse_args()

    payload = json.loads(Path(args.request).read_text(encoding="utf-8"))
    service = RiskService(
        ServicePaths(
            model_dir=Path(args.model_dir),
            rule_config=Path(args.rule_config),
            crop_config=Path(args.crop_config),
            model_config=Path(args.model_config),
        ),
        allow_rule_fallback=True,
    )
    result = service.predict(
        crop=payload["crop"],
        province=payload["province"],
        prediction_date=payload.get("prediction_date"),
        weather_history=payload["weather_history"],
    )
    print(json.dumps(result, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()

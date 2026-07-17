from __future__ import annotations

import argparse
import json
from pathlib import Path

from pest_risk.data.loader import load_dataset_zip
from pest_risk.data.quality import build_quality_report, sanitize_environmental_data
from pest_risk.features.engineer import engineer_features


def main() -> None:
    parser = argparse.ArgumentParser(description="Build cleaned rolling features")
    parser.add_argument("--zip", required=True, dest="zip_path")
    parser.add_argument("--output", required=True)
    parser.add_argument("--rainfall-source", choices=["nasa", "master"], default="nasa")
    parser.add_argument("--quality-report", default="reports/data_quality.json")
    args = parser.parse_args()

    raw = load_dataset_zip(args.zip_path, rainfall_source=args.rainfall_source)
    clean = sanitize_environmental_data(raw)
    features = engineer_features(clean)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    features.to_parquet(output, index=False)

    quality_path = Path(args.quality_report)
    quality_path.parent.mkdir(parents=True, exist_ok=True)
    quality_path.write_text(
        json.dumps(build_quality_report(clean).to_dict(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Saved {len(features):,} rows and {len(features.columns)} columns to {output}")


if __name__ == "__main__":
    main()

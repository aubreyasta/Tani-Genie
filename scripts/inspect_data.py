from __future__ import annotations

import argparse
import json

from pest_risk.data.loader import load_dataset_zip
from pest_risk.data.quality import build_quality_report, sanitize_environmental_data


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect the uploaded pest environmental ZIP")
    parser.add_argument("--zip", required=True, dest="zip_path")
    parser.add_argument("--rainfall-source", choices=["nasa", "master"], default="nasa")
    args = parser.parse_args()

    frame = load_dataset_zip(args.zip_path, rainfall_source=args.rainfall_source)
    report_before = build_quality_report(frame)
    clean = sanitize_environmental_data(frame)
    report_after = build_quality_report(clean)

    print(
        json.dumps(
            {
                "before_sanitization": report_before.to_dict(),
                "after_sanitization": report_after.to_dict(),
            },
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()

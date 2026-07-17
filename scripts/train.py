from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from pest_risk.config import load_model_settings, load_rule_registry
from pest_risk.modeling.artifacts import save_artifact
from pest_risk.modeling.train import train_disease_model
from pest_risk.utils.logging import configure_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Train one binary risk model per disease")
    parser.add_argument("--features", required=True)
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--report-dir", default="reports")
    parser.add_argument("--rule-config", default="configs/disease_rules.yaml")
    parser.add_argument("--model-config", default="configs/model.yaml")
    parser.add_argument("--aggregator", choices=["snorkel", "weighted"], default="snorkel")
    parser.add_argument("--disease", action="append", default=[])
    args = parser.parse_args()

    configure_logging()
    features = pd.read_parquet(args.features)
    registry = load_rule_registry(args.rule_config)
    settings = load_model_settings(args.model_config)
    model_dir = Path(args.model_dir)
    report_dir = Path(args.report_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)

    selected = args.disease or list(registry.diseases)
    manifest: dict[str, object] = {
        "rule_version": registry.version,
        "aggregator_requested": args.aggregator,
        "features_path": str(args.features),
        "diseases": {},
    }

    for disease_id in selected:
        if disease_id not in registry.diseases:
            raise ValueError(f"Unknown disease: {disease_id}")
        result = train_disease_model(
            features=features,
            disease_id=disease_id,
            disease=registry.diseases[disease_id],
            registry=registry,
            settings=settings,
            aggregator_method=args.aggregator,
        )
        artifact_path = save_artifact(result.artifact, model_dir)
        result.lf_summary.to_csv(report_dir / f"{disease_id}_lf_summary.csv", index=False)
        weak = features[["date", "province"]].copy()
        weak["weak_probability"] = result.weak_probabilities
        weak["split"] = result.split_assignments
        weak.to_parquet(report_dir / f"{disease_id}_weak_labels.parquet", index=False)
        manifest["diseases"][disease_id] = {
            "artifact": str(artifact_path),
            "aggregation_method": result.artifact.aggregation_method,
            "metrics": result.artifact.metrics,
            "metadata": result.artifact.metadata,
        }
        print(f"Trained {disease_id}: {artifact_path}")

    (report_dir / "training_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False, default=str),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

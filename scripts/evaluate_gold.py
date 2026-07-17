from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from pest_risk.modeling.artifacts import ArtifactStore
from pest_risk.modeling.evaluate import classification_metrics


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate model artifacts on field-confirmed labels"
    )
    parser.add_argument("--features", required=True)
    parser.add_argument("--gold", required=True)
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--output", default="reports/gold_evaluation.json")
    args = parser.parse_args()

    features = pd.read_parquet(args.features).copy()
    features["date"] = pd.to_datetime(features["date"]).dt.normalize()
    gold = pd.read_csv(args.gold)
    required = {"province", "observation_date", "disease_id", "label"}
    missing = required - set(gold.columns)
    if missing:
        raise ValueError(f"Gold file is missing columns: {sorted(missing)}")
    gold["date"] = pd.to_datetime(gold["observation_date"], errors="coerce").dt.normalize()
    gold["label"] = pd.to_numeric(gold["label"], errors="coerce")
    gold = gold.dropna(subset=["province", "date", "disease_id", "label"])
    gold = gold[gold["label"].isin([0, 1])]

    artifacts = ArtifactStore(args.model_dir).load()
    report: dict[str, object] = {
        "evaluation_type": "field_confirmed_gold_labels",
        "diseases": {},
    }
    for disease_id, disease_gold in gold.groupby("disease_id"):
        artifact = artifacts.get(str(disease_id))
        if artifact is None:
            report["diseases"][str(disease_id)] = {"error": "model artifact not found"}
            continue
        merged = disease_gold.merge(features, on=["province", "date"], how="inner")
        if merged.empty:
            report["diseases"][str(disease_id)] = {
                "rows": 0,
                "error": "no matching province/date features",
            }
            continue
        probability = artifact.predict_probability(merged)
        report["diseases"][str(disease_id)] = classification_metrics(
            merged["label"].astype(int).to_numpy(), probability
        )

    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(target)


if __name__ == "__main__":
    main()

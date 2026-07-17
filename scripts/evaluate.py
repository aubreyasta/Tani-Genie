from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from pest_risk.config import load_model_settings, load_rule_registry
from pest_risk.labeling.aggregate import weighted_vote_probabilities
from pest_risk.labeling.functions import apply_rules
from pest_risk.modeling.artifacts import ArtifactStore
from pest_risk.modeling.evaluate import classification_metrics
from pest_risk.modeling.train import temporal_split


def _load_weak_probabilities(
    disease_id: str,
    features: pd.DataFrame,
    weak_label_dir: Path,
    rule_probabilities: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, str]:
    path = weak_label_dir / f"{disease_id}_weak_labels.parquet"
    if path.exists():
        weak = pd.read_parquet(path)
        if len(weak) != len(features):
            raise ValueError(
                f"Weak-label row count for {disease_id} does not match features: "
                f"{len(weak)} != {len(features)}"
            )
        return (
            weak["weak_probability"].to_numpy(dtype=float),
            weak["split"].astype(str).to_numpy(),
            "saved_training_aggregation",
        )
    split = temporal_split(features["date"]).astype(str).to_numpy()
    return rule_probabilities, split, "weighted_rule_reconstruction"


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate artifacts against held-out weak labels")
    parser.add_argument("--features", required=True)
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--weak-label-dir", default="reports")
    parser.add_argument("--rule-config", default="configs/disease_rules.yaml")
    parser.add_argument("--model-config", default="configs/model.yaml")
    parser.add_argument("--output", default="reports/evaluation.json")
    args = parser.parse_args()

    features = pd.read_parquet(args.features)
    registry = load_rule_registry(args.rule_config)
    settings = load_model_settings(args.model_config)
    artifacts = ArtifactStore(args.model_dir).load()
    weak_label_dir = Path(args.weak_label_dir)
    weak_cfg = settings.raw.get("weak_label_training", {})
    positive_cutoff = float(weak_cfg.get("positive_cutoff", 0.70))
    negative_cutoff = float(weak_cfg.get("negative_cutoff", 0.30))

    output: dict[str, object] = {
        "warning": (
            "These metrics use held-out weak labels, not field-confirmed gold labels. "
            "They measure rule/model consistency and must not be reported as agronomic accuracy."
        ),
        "diseases": {},
    }
    for disease_id, disease in registry.diseases.items():
        artifact = artifacts.get(disease_id)
        if artifact is None:
            output["diseases"][disease_id] = {"error": "model artifact not found"}
            continue
        matrix = apply_rules(features, disease.rules)
        reconstructed = weighted_vote_probabilities(matrix, disease.rules)
        weak_probability, split, label_source = _load_weak_probabilities(
            disease_id,
            features,
            weak_label_dir,
            reconstructed,
        )
        confident = (weak_probability >= positive_cutoff) | (
            weak_probability <= negative_cutoff
        )
        mask = confident & (split == "test")
        labels = (weak_probability[mask] >= positive_cutoff).astype(int)
        probabilities = (
            artifact.predict_probability(features.loc[mask])
            if mask.any()
            else np.array([])
        )
        metrics = classification_metrics(labels, probabilities) if mask.any() else {"rows": 0}
        metrics["weak_label_source"] = label_source
        metrics["positive_rows"] = int(labels.sum())
        metrics["negative_rows"] = int(len(labels) - labels.sum())
        output["diseases"][disease_id] = metrics

    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(path)


if __name__ == "__main__":
    main()

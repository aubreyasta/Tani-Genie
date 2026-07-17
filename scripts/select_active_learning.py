from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from pest_risk.config import load_rule_registry
from pest_risk.constants import NEGATIVE, POSITIVE
from pest_risk.labeling.aggregate import weighted_vote_probabilities
from pest_risk.labeling.functions import apply_rules
from pest_risk.modeling.artifacts import ArtifactStore


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Select uncertain, conflicting, or model-rule-disagreement rows for review"
    )
    parser.add_argument("--features", required=True)
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--rule-config", default="configs/disease_rules.yaml")
    parser.add_argument("--output", default="data/gold/active_learning_batch.csv")
    parser.add_argument("--rows-per-disease", type=int, default=100)
    parser.add_argument("--disease", action="append", default=[])
    args = parser.parse_args()

    features = pd.read_parquet(args.features)
    registry = load_rule_registry(args.rule_config)
    artifacts = ArtifactStore(args.model_dir).load()
    selections: list[pd.DataFrame] = []
    selected_diseases = set(args.disease or registry.diseases)

    for disease_id, disease in registry.diseases.items():
        if disease_id not in selected_diseases:
            continue
        artifact = artifacts.get(disease_id)
        if artifact is None:
            continue
        matrix = apply_rules(features, disease.rules)
        model_probability = artifact.predict_probability(features)
        weak_probability = weighted_vote_probabilities(matrix, disease.rules)
        positive_votes = (matrix == POSITIVE).sum(axis=1)
        negative_votes = (matrix == NEGATIVE).sum(axis=1)
        conflict = ((positive_votes > 0) & (negative_votes > 0)).astype(float)
        uncertainty = 1.0 - np.abs(model_probability - 0.5) * 2.0
        disagreement = np.abs(model_probability - weak_probability)
        review_score = 0.50 * uncertainty + 0.30 * disagreement + 0.20 * conflict

        candidate = pd.DataFrame(
            {
                "plot_id": "",
                "province": features["province"].astype(str),
                "observation_date": pd.to_datetime(features["date"]).dt.date.astype(str),
                "crop": ",".join(disease.crops),
                "disease_id": disease_id,
                "model_probability": model_probability,
                "weak_rule_probability": weak_probability,
                "positive_lf_votes": positive_votes,
                "negative_lf_votes": negative_votes,
                "review_priority": review_score,
                "label": "",
                "severity_percent": "",
                "growth_stage": "",
                "observation_method": "",
                "observer_id": "",
                "photo_uri": "",
                "laboratory_confirmed": "",
                "notes": "",
            }
        )
        selections.append(candidate.nlargest(args.rows_per_disease, "review_priority"))

    output = pd.concat(selections, ignore_index=True) if selections else pd.DataFrame()
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(target, index=False)
    print(f"Saved {len(output):,} review candidates to {target}")


if __name__ == "__main__":
    main()

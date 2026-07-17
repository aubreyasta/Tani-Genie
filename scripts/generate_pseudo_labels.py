from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from pest_risk.config import load_rule_registry
from pest_risk.modeling.artifacts import ArtifactStore
from pest_risk.modeling.pseudo_label import PseudoLabelSettings, generate_pseudo_labels


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate conservative pseudo-labels after a validated model exists"
    )
    parser.add_argument("--features", required=True)
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--rule-config", default="configs/disease_rules.yaml")
    parser.add_argument("--output", default="reports/pseudo_labels.parquet")
    parser.add_argument("--positive-threshold", type=float, default=0.95)
    parser.add_argument("--negative-threshold", type=float, default=0.05)
    parser.add_argument("--minimum-completeness", type=float, default=0.80)
    parser.add_argument("--max-per-class", type=int, default=10_000)
    parser.add_argument("--allow-rule-disagreement", action="store_true")
    parser.add_argument("--disease", action="append", default=[])
    args = parser.parse_args()

    features = pd.read_parquet(args.features)
    registry = load_rule_registry(args.rule_config)
    artifacts = ArtifactStore(args.model_dir).load()
    selected_diseases = args.disease or list(registry.diseases)
    settings = PseudoLabelSettings(
        positive_threshold=args.positive_threshold,
        negative_threshold=args.negative_threshold,
        minimum_feature_completeness=args.minimum_completeness,
        require_rule_agreement=not args.allow_rule_disagreement,
        max_rows_per_class=args.max_per_class,
    )

    outputs: list[pd.DataFrame] = []
    for disease_id in selected_diseases:
        artifact = artifacts.get(disease_id)
        if artifact is None:
            raise FileNotFoundError(f"No model artifact for {disease_id}")
        outputs.append(
            generate_pseudo_labels(
                features,
                artifact,
                registry.diseases[disease_id],
                settings,
            )
        )

    result = pd.concat(outputs, ignore_index=True) if outputs else pd.DataFrame()
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    result.to_parquet(target, index=False)
    print(f"Saved {len(result):,} pseudo-labels to {target}")


if __name__ == "__main__":
    main()

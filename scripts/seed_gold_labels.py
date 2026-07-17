from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

COLUMNS = [
    "plot_id",
    "province",
    "observation_date",
    "crop",
    "disease_id",
    "label",
    "severity_percent",
    "growth_stage",
    "observation_method",
    "observer_id",
    "photo_uri",
    "laboratory_confirmed",
    "notes",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a gold-label annotation template")
    parser.add_argument("--output", default="data/gold/gold_labels_template.csv")
    parser.add_argument("--features")
    parser.add_argument("--rows", type=int, default=0)
    parser.add_argument("--random-seed", type=int, default=42)
    args = parser.parse_args()

    if args.features:
        features = pd.read_parquet(args.features)
        sample_size = args.rows if args.rows > 0 else min(300, len(features))
        sampled = features.sample(
            n=min(sample_size, len(features)),
            random_state=args.random_seed,
        )
        template = pd.DataFrame(
            {
                "plot_id": "",
                "province": sampled["province"].astype(str).to_numpy(),
                "observation_date": pd.to_datetime(sampled["date"]).dt.date.astype(str).to_numpy(),
                "crop": "",
                "disease_id": "",
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
    else:
        template = pd.DataFrame(columns=COLUMNS)

    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    template.to_csv(path, index=False)
    print(path)


if __name__ == "__main__":
    main()

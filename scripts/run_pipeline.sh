#!/usr/bin/env bash
# Runs the full pipeline end to end: raw CSVs -> processed dataset -> trained
# models. Run this whenever new raw data lands in data/raw/.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1/2 Building processed dataset =="
python3 -m src.data.make_dataset

echo "== 2/2 Training models =="
python3 -m src.models.train

echo "Done. Models saved under models/, metrics in models/training_metrics.json"

from __future__ import annotations

import argparse
import subprocess
import sys


def main() -> None:
    parser = argparse.ArgumentParser(prog="pest-risk")
    parser.add_argument("command", choices=[
            "inspect",
            "build",
            "train",
            "evaluate",
            "evaluate-gold",
            "pseudo-label",
            "active-learning",
            "predict",
        ])
    args, remaining = parser.parse_known_args()
    script_map = {
        "inspect": "scripts/inspect_data.py",
        "build": "scripts/build_dataset.py",
        "train": "scripts/train.py",
        "evaluate": "scripts/evaluate.py",
        "evaluate-gold": "scripts/evaluate_gold.py",
        "pseudo-label": "scripts/generate_pseudo_labels.py",
        "active-learning": "scripts/select_active_learning.py",
        "predict": "scripts/predict.py",
    }
    raise SystemExit(subprocess.call([sys.executable, script_map[args.command], *remaining]))


if __name__ == "__main__":
    main()

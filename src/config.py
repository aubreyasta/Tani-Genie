"""
Loads config/config.yaml once and exposes it as a simple, importable object.
Every path in the project is resolved relative to the project root, so the
code works regardless of the current working directory it's launched from.
"""
from __future__ import annotations

from pathlib import Path
import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = PROJECT_ROOT / "config" / "config.yaml"


def _load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


_cfg = _load_config()

# ---- resolved paths -------------------------------------------------------
RAW_DIR = PROJECT_ROOT / _cfg["paths"]["raw_dir"]
INTERIM_DIR = PROJECT_ROOT / _cfg["paths"]["interim_dir"]
PROCESSED_DIR = PROJECT_ROOT / _cfg["paths"]["processed_dir"]
MODELS_DIR = PROJECT_ROOT / _cfg["paths"]["models_dir"]

# ---- domain constants ------------------------------------------------------
COMMODITIES = _cfg["commodities"]
MARKETS = _cfg["markets"]  # dict: market_name -> {folder_layout: split|single}
DATE_COLUMN = _cfg["date_column"]
NATIONAL_AGGREGATE_COLUMN = _cfg["national_aggregate_column"]
VALIDATION_DAYS = _cfg["validation_days"]
MAX_FORECAST_HORIZON_DAYS = _cfg["max_forecast_horizon_days"]
RANDOM_SEED = _cfg["random_seed"]

for d in (INTERIM_DIR, PROCESSED_DIR, MODELS_DIR):
    d.mkdir(parents=True, exist_ok=True)

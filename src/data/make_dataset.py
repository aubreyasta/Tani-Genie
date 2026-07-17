"""
Entry point: builds data/processed/prices_long.parquet from the raw CSVs.

Run as:
    python -m src.data.make_dataset
"""
from __future__ import annotations

import logging

from src.config import COMMODITIES, MARKETS, PROCESSED_DIR
from src.data.load_raw import load_all

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    markets = list(MARKETS.keys())
    logger.info("Loading %s commodities x %s markets ...", len(COMMODITIES), len(markets))
    df = load_all(COMMODITIES, markets)
    logger.info("Loaded %s rows total", len(df))

    out_path = PROCESSED_DIR / "prices_long.parquet"
    df.to_parquet(out_path, index=False)
    logger.info("Saved to %s", out_path)

    # Small CSV sample for quick manual inspection / non-parquet tooling
    sample_path = PROCESSED_DIR / "prices_long_sample.csv"
    df.sample(min(2000, len(df)), random_state=42).to_csv(sample_path, index=False)
    logger.info("Saved inspection sample to %s", sample_path)


if __name__ == "__main__":
    main()

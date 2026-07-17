"""
Reads the raw, wide-format CSVs (one column per province, one row per day)
for a given market + commodity, stitches the historical "cleaned" file
together with the more recent "continuation" (scraped) file when the market
uses the split layout, and returns a tidy long-format DataFrame:

    Date | Province | Market | Commodity | Price

This is the only module that needs to know about the raw folder layout.
Everything downstream (features, training, API) works off the long format.
"""
from __future__ import annotations

import pandas as pd

from src.config import RAW_DIR, MARKETS, DATE_COLUMN, NATIONAL_AGGREGATE_COLUMN


def _read_wide_csv(path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN])
    if NATIONAL_AGGREGATE_COLUMN in df.columns:
        df = df.drop(columns=[NATIONAL_AGGREGATE_COLUMN])
    return df


def _melt_wide(df: pd.DataFrame, market: str, commodity: str) -> pd.DataFrame:
    long_df = df.melt(id_vars=[DATE_COLUMN], var_name="province", value_name="price")
    long_df = long_df.rename(columns={DATE_COLUMN: "date"})
    long_df["market"] = market
    long_df["commodity"] = commodity
    return long_df


def load_commodity_market(market: str, commodity: str) -> pd.DataFrame:
    """Load one (market, commodity) pair as a tidy long DataFrame.

    Handles both raw layouts transparently:
      - "split": data/raw/<market>/cleaned/<commodity>.csv (historical, imputed)
                 + data/raw/<market>/continuation/<commodity>.csv (latest scrape)
      - "single": data/raw/<market>/<commodity>.csv (already continuous)
    """
    layout = MARKETS[market]["folder_layout"]
    market_dir = RAW_DIR / market

    if layout == "split":
        cleaned = _read_wide_csv(market_dir / "cleaned" / f"{commodity}.csv")
        continuation = _read_wide_csv(market_dir / "continuation" / f"{commodity}.csv")
        # Continuation may overlap the tail of `cleaned` by a day or two;
        # keep continuation as the source of truth for overlapping dates.
        cutoff = continuation[DATE_COLUMN].min()
        cleaned = cleaned[cleaned[DATE_COLUMN] < cutoff]
        wide = pd.concat([cleaned, continuation], ignore_index=True)
    elif layout == "single":
        wide = _read_wide_csv(market_dir / f"{commodity}.csv")
    else:
        raise ValueError(f"Unknown folder_layout '{layout}' for market '{market}'")

    wide = wide.sort_values(DATE_COLUMN).drop_duplicates(subset=[DATE_COLUMN], keep="last")
    long_df = _melt_wide(wide, market, commodity)
    long_df = long_df.dropna(subset=["price"]).sort_values(["province", "date"])
    return long_df.reset_index(drop=True)


def load_all(commodities: list[str], markets: list[str]) -> pd.DataFrame:
    """Load and concatenate every (market, commodity) combination requested."""
    frames = [
        load_commodity_market(market, commodity)
        for market in markets
        for commodity in commodities
    ]
    return pd.concat(frames, ignore_index=True)

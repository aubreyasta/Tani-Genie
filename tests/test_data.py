import pandas as pd

from src.config import COMMODITIES, MARKETS
from src.data.load_raw import load_commodity_market


def test_load_commodity_market_has_expected_columns():
    df = load_commodity_market("pasar_tradisional", "beras")
    assert set(df.columns) == {"date", "province", "price", "market", "commodity"}


def test_load_commodity_market_no_duplicate_dates_per_province():
    df = load_commodity_market("pasar_tradisional", "beras")
    dupes = df.duplicated(subset=["province", "date"]).sum()
    assert dupes == 0


def test_load_commodity_market_prices_are_positive():
    df = load_commodity_market("produsen", "cabai_rawit")
    assert (df["price"] > 0).all()


def test_all_markets_and_commodities_load_without_error():
    # Note: `produsen` (producer-level) coverage for bawang_putih (garlic) is
    # genuinely sparse -- Indonesia grows very little of its own garlic, so
    # most provinces simply have no producer price to report. That's a real
    # characteristic of the data, not a loading bug, hence the low floor.
    for market in MARKETS:
        for commodity in COMMODITIES:
            df = load_commodity_market(market, commodity)
            assert len(df) > 0, f"empty data for {market}/{commodity}"
            assert df["province"].nunique() >= 2

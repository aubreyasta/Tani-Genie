import pandas as pd

from src.data.load_raw import load_commodity_market
from src.features.build_features import FEATURE_COLUMNS, TARGET_COLUMN, build_feature_table


def _sample_df():
    return load_commodity_market("pasar_tradisional", "beras")


def test_build_feature_table_has_no_nans_in_feature_columns():
    df = _sample_df()
    feat = build_feature_table(df)
    assert feat[FEATURE_COLUMNS].isna().sum().sum() == 0


def test_build_feature_table_keeps_target_column():
    df = _sample_df()
    feat = build_feature_table(df)
    assert TARGET_COLUMN in feat.columns


def test_lag_1_equals_previous_day_price_for_one_province():
    df = _sample_df()
    feat = build_feature_table(df)
    one_province = feat[feat["province"] == "DKI Jakarta"].sort_values("date").reset_index(drop=True)
    # lag_1 at row i should equal price at row i-1 (within the feature table, which
    # already dropped the earliest rows lacking full history)
    assert (one_province["lag_1"].iloc[1:].values == one_province["price"].iloc[:-1].values).all()

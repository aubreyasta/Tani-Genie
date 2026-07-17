"""
Turns the tidy long-format price data into a supervised-learning table.

Feature groups added per (market, commodity, province) time series:
  - calendar: day of week, day of month, month, is_weekend
  - lags: price N days ago, for N in LAG_DAYS
  - rolling stats: rolling mean/std over ROLLING_WINDOWS (computed on
    values *before* the current day, so there is no leakage)

`market` and `province` are kept as plain string columns; the model
pipeline (src/models/train.py) is responsible for encoding them, so this
module has no encoder state to manage.
"""
from __future__ import annotations

import pandas as pd

LAG_DAYS = [1, 3, 7, 14, 30]
ROLLING_WINDOWS = [7, 14, 30]


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    return df


def add_lag_and_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """Adds lag/rolling features, grouped by the unique series key
    (market, commodity, province). Assumes df is already sorted by date
    within each group -- callers should sort before calling, or use
    build_feature_table() which handles this end to end.
    """
    df = df.copy()
    group_cols = ["market", "commodity", "province"]
    grouped_price = df.groupby(group_cols)["price"]

    for lag in LAG_DAYS:
        df[f"lag_{lag}"] = grouped_price.shift(lag)

    # shift(1) first so rolling stats never see the current day's price
    shifted = grouped_price.shift(1)
    for window in ROLLING_WINDOWS:
        df[f"roll_mean_{window}"] = (
            shifted.groupby([df["market"], df["commodity"], df["province"]])
            .rolling(window, min_periods=max(2, window // 2))
            .mean()
            .reset_index(level=group_cols, drop=True)
        )
        df[f"roll_std_{window}"] = (
            shifted.groupby([df["market"], df["commodity"], df["province"]])
            .rolling(window, min_periods=max(2, window // 2))
            .std()
            .reset_index(level=group_cols, drop=True)
        )
    return df


def build_feature_table(df: pd.DataFrame) -> pd.DataFrame:
    """Full feature pipeline: sort -> calendar -> lags/rolling -> drop rows
    that don't yet have enough history for the longest lag/window.
    """
    df = df.sort_values(["market", "commodity", "province", "date"]).reset_index(drop=True)
    df = add_calendar_features(df)
    df = add_lag_and_rolling_features(df)
    min_history = max(LAG_DAYS + ROLLING_WINDOWS)
    df = df.dropna(subset=[f"lag_{max(LAG_DAYS)}"]).reset_index(drop=True)
    return df


FEATURE_COLUMNS = (
    ["day_of_week", "day_of_month", "month", "is_weekend", "market", "province"]
    + [f"lag_{lag}" for lag in LAG_DAYS]
    + [f"roll_mean_{w}" for w in ROLLING_WINDOWS]
    + [f"roll_std_{w}" for w in ROLLING_WINDOWS]
)
CATEGORICAL_COLUMNS = ["market", "province"]
TARGET_COLUMN = "price"

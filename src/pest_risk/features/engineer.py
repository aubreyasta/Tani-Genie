from __future__ import annotations

import logging
from collections.abc import Iterable

import numpy as np
import pandas as pd

LOGGER = logging.getLogger(__name__)


def _rolling_group(
    df: pd.DataFrame,
    column: str,
    window: int,
    operation: str,
) -> pd.Series:
    grouped = df.groupby("province", sort=False, observed=True)[column]
    rolling = grouped.rolling(window=window, min_periods=1)
    if operation == "sum":
        values = rolling.sum()
    elif operation == "mean":
        values = rolling.mean()
    elif operation == "max":
        values = rolling.max()
    elif operation == "min":
        values = rolling.min()
    else:
        raise ValueError(f"Unsupported rolling operation: {operation}")
    return values.reset_index(level=0, drop=True).sort_index()


def _rolling_zscore(df: pd.DataFrame, column: str, window: int = 90) -> pd.Series:
    grouped = df.groupby("province", sort=False, observed=True)[column]
    mean = grouped.transform(lambda series: series.rolling(window, min_periods=14).mean())
    std = grouped.transform(lambda series: series.rolling(window, min_periods=14).std(ddof=0))
    zscore = (df[column] - mean) / std.replace(0, np.nan)
    return zscore.clip(-5, 5)


def _consecutive_true(values: pd.Series) -> pd.Series:
    mask = values.fillna(False).astype(bool)
    group_id = (~mask).cumsum()
    counts = mask.groupby(group_id).cumsum()
    return counts.astype(float)


def _days_since_true(values: pd.Series) -> pd.Series:
    mask = values.fillna(False).astype(bool).to_numpy()
    output = np.empty(len(mask), dtype=float)
    last_true: int | None = None
    for index, current in enumerate(mask):
        if current:
            last_true = index
            output[index] = 0.0
        elif last_true is None:
            output[index] = np.nan
        else:
            output[index] = float(index - last_true)
    return pd.Series(output, index=values.index)


def engineer_features(
    raw: pd.DataFrame,
    windows: Iterable[int] = (1, 3, 7, 14),
) -> pd.DataFrame:
    """Create leakage-safe rolling features within each province.

    Features use current and previous records only. The caller must sort and split
    by time after this transformation; no future rows are read by rolling windows.
    """

    if not {"province", "date"}.issubset(raw.columns):
        raise ValueError("Input must contain province and date")

    df = raw.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "province"])
    df = df.sort_values(["province", "date"]).reset_index(drop=True)

    numeric_columns = [
        "temp_avg_c",
        "temp_max_c",
        "temp_min_c",
        "relative_humidity_pct",
        "rainfall_mm",
        "wind_speed_ms",
        "estimated_wet_hours",
        "root_zone_soil_moisture_raw",
        "surface_soil_moisture_raw",
        "ndvi",
    ]
    for column in numeric_columns:
        if column not in df:
            df[column] = np.nan
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df["estimated_wet_hours"] = df["estimated_wet_hours"].clip(0, 24)
    df["is_rainy_day"] = df["rainfall_mm"].ge(1.0).astype(float)
    df["is_wet_day"] = df["estimated_wet_hours"].ge(1.0).astype(float)

    for window in windows:
        suffix = f"{window}d"
        df[f"temp_avg_{suffix}_c"] = _rolling_group(df, "temp_avg_c", window, "mean")
        df[f"temp_max_{suffix}_c"] = _rolling_group(df, "temp_max_c", window, "max")
        df[f"temp_min_{suffix}_c"] = _rolling_group(df, "temp_min_c", window, "min")
        df[f"rh_mean_{suffix}_pct"] = _rolling_group(
            df, "relative_humidity_pct", window, "mean"
        )
        df[f"rh_max_{suffix}_pct"] = _rolling_group(
            df, "relative_humidity_pct", window, "max"
        )
        df[f"rain_sum_{suffix}_mm"] = _rolling_group(df, "rainfall_mm", window, "sum")
        df[f"rainy_days_{suffix}"] = _rolling_group(df, "is_rainy_day", window, "sum")
        df[f"wet_hours_{suffix}"] = _rolling_group(
            df, "estimated_wet_hours", window, "sum"
        )
        df[f"wet_days_{suffix}"] = _rolling_group(df, "is_wet_day", window, "sum")
        df[f"wind_mean_{suffix}_ms"] = _rolling_group(df, "wind_speed_ms", window, "mean")
        df[f"ndvi_mean_{suffix}"] = _rolling_group(df, "ndvi", window, "mean")

    df["root_soil_z_90d"] = _rolling_zscore(df, "root_zone_soil_moisture_raw", 90)
    df["surface_soil_z_90d"] = _rolling_zscore(df, "surface_soil_moisture_raw", 90)
    df["rainfall_z_90d"] = _rolling_zscore(df, "rainfall_mm", 90)

    df["consecutive_wet_days"] = (
        df.groupby("province", sort=False, observed=True)["is_wet_day"]
        .transform(_consecutive_true)
        .astype(float)
    )
    df["days_since_rain"] = (
        df.groupby("province", sort=False, observed=True)["is_rainy_day"]
        .transform(_days_since_true)
        .astype(float)
    )
    df["ndvi_change_7d"] = df.groupby("province", sort=False, observed=True)["ndvi"].diff(7)

    month = df["date"].dt.month.astype(float)
    df["month_sin"] = np.sin(2 * np.pi * month / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * month / 12.0)

    LOGGER.info("Engineered %s columns for %s rows", len(df.columns), len(df))
    return df

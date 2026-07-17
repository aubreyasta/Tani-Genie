from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class QualityReport:
    rows: int
    provinces: int
    start_date: str | None
    end_date: str | None
    duplicate_keys: int
    missing_fraction: dict[str, float]
    invalid_counts: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def build_quality_report(df: pd.DataFrame) -> QualityReport:
    invalid_counts: dict[str, int] = {}

    checks: dict[str, pd.Series] = {
        "humidity_outside_0_100": (df.get("relative_humidity_pct", pd.Series(dtype=float)) < 0)
        | (df.get("relative_humidity_pct", pd.Series(dtype=float)) > 100),
        "negative_rainfall": df.get("rainfall_mm", pd.Series(dtype=float)) < 0,
        "wet_hours_outside_0_24": (df.get("estimated_wet_hours", pd.Series(dtype=float)) < 0)
        | (df.get("estimated_wet_hours", pd.Series(dtype=float)) > 24),
        "ndvi_outside_minus1_1": (df.get("ndvi", pd.Series(dtype=float)) < -1)
        | (df.get("ndvi", pd.Series(dtype=float)) > 1),
        "temperature_outside_plausible": (
            df.get("temp_avg_c", pd.Series(dtype=float)) < -20
        )
        | (df.get("temp_avg_c", pd.Series(dtype=float)) > 55),
    }
    for name, mask in checks.items():
        invalid_counts[name] = int(mask.fillna(False).sum())

    date_min = df["date"].min() if "date" in df else None
    date_max = df["date"].max() if "date" in df else None
    missing = {
        column: float(np.round(df[column].isna().mean(), 6))
        for column in sorted(df.columns)
        if column not in {"date", "province"}
    }

    duplicates = (
        int(df.duplicated(["province", "date"]).sum())
        if {"province", "date"}.issubset(df.columns)
        else 0
    )
    return QualityReport(
        rows=len(df),
        provinces=int(df["province"].nunique()) if "province" in df else 0,
        start_date=date_min.date().isoformat() if pd.notna(date_min) else None,
        end_date=date_max.date().isoformat() if pd.notna(date_max) else None,
        duplicate_keys=duplicates,
        missing_fraction=missing,
        invalid_counts=invalid_counts,
    )


def _collapse_duplicate_daily_rows(result: pd.DataFrame) -> pd.DataFrame:
    keys = ["province", "date"]
    if not set(keys).issubset(result.columns) or not result.duplicated(keys).any():
        return result

    numeric_columns = [
        column
        for column in result.columns
        if column not in keys and pd.api.types.is_numeric_dtype(result[column])
    ]
    other_columns = [
        column for column in result.columns if column not in keys and column not in numeric_columns
    ]
    aggregations: dict[str, str] = {column: "mean" for column in numeric_columns}
    aggregations.update({column: "first" for column in other_columns})
    return result.groupby(keys, as_index=False, observed=True).agg(aggregations)


def sanitize_environmental_data(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    if "date" in result:
        result["date"] = pd.to_datetime(result["date"], errors="coerce")
    if "province" in result:
        result["province"] = result["province"].astype("string").str.strip()
    result = result.dropna(subset=[column for column in ["date", "province"] if column in result])

    # Sentinel values from gridded providers must become missing before range checks.
    result = result.replace([-999, -999.0, -9999, -9999.0], np.nan)

    ranges = {
        "relative_humidity_pct": (0, 100),
        "rainfall_mm": (0, None),
        "rainfall_nasa_mm": (0, None),
        "rainfall_master_mm": (0, None),
        "estimated_wet_hours": (0, 24),
        "wind_speed_ms": (0, None),
        "ndvi": (-1, 1),
        "temp_avg_c": (-20, 55),
        "temp_min_c": (-30, 55),
        "temp_max_c": (-20, 65),
    }

    for column, (minimum, maximum) in ranges.items():
        if column not in result:
            continue
        values = pd.to_numeric(result[column], errors="coerce")
        if minimum is not None:
            values = values.mask(values < minimum)
        if maximum is not None:
            values = values.mask(values > maximum)
        result[column] = values

    # Keep soil values as raw indices because the source unit has not been verified.
    for column in ["root_zone_soil_moisture_raw", "surface_soil_moisture_raw"]:
        if column in result:
            result[column] = pd.to_numeric(result[column], errors="coerce")

    # Multiple same-day satellite/NDVI rows must not be interpreted as multiple days.
    result = _collapse_duplicate_daily_rows(result)
    return result.sort_values(["province", "date"]).reset_index(drop=True)

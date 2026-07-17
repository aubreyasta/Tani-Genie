from __future__ import annotations

ABSTAIN = -1
NEGATIVE = 0
POSITIVE = 1

SUPPORTED_OPERATORS = {
    "gt",
    "gte",
    "lt",
    "lte",
    "eq",
    "neq",
    "between",
    "in",
    "not_in",
    "isna",
    "notna",
}

DEFAULT_FEATURE_COLUMNS = [
    "temp_avg_1d_c",
    "temp_avg_3d_c",
    "temp_avg_7d_c",
    "temp_max_3d_c",
    "temp_min_3d_c",
    "rh_mean_1d_pct",
    "rh_mean_3d_pct",
    "rh_mean_7d_pct",
    "rh_max_3d_pct",
    "rain_sum_1d_mm",
    "rain_sum_3d_mm",
    "rain_sum_7d_mm",
    "rain_sum_14d_mm",
    "rainy_days_3d",
    "rainy_days_7d",
    "wet_hours_1d",
    "wet_hours_3d",
    "wet_hours_7d",
    "wet_days_3d",
    "wet_days_7d",
    "consecutive_wet_days",
    "days_since_rain",
    "wind_mean_3d_ms",
    "root_soil_z_90d",
    "surface_soil_z_90d",
    "rainfall_z_90d",
    "ndvi_mean_7d",
    "ndvi_change_7d",
    "month_sin",
    "month_cos",
]

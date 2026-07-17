from __future__ import annotations

RAW_ENVIRONMENT_COLUMNS = [
    "date",
    "province",
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

REQUIRED_FOR_MINIMUM_PREDICTION = [
    "date",
    "province",
    "temp_avg_c",
    "relative_humidity_pct",
    "rainfall_mm",
    "estimated_wet_hours",
]

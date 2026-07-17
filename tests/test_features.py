import pandas as pd
import pytest

from pest_risk.features.engineer import engineer_features


def test_engineer_features_uses_only_past_rows() -> None:
    raw = pd.DataFrame(
        {
            "date": pd.date_range("2026-01-01", periods=4),
            "province": ["X"] * 4,
            "temp_avg_c": [20, 21, 22, 23],
            "temp_max_c": [22, 23, 24, 25],
            "temp_min_c": [18, 19, 20, 21],
            "relative_humidity_pct": [80, 90, 100, 70],
            "rainfall_mm": [0, 2, 3, 0],
            "wind_speed_ms": [1, 1, 1, 1],
            "estimated_wet_hours": [0, 3, 4, 0],
            "root_zone_soil_moisture_raw": [10, 11, 12, 13],
            "surface_soil_moisture_raw": [5, 6, 7, 8],
            "ndvi": [0.4, 0.5, 0.6, 0.7],
        }
    )
    features = engineer_features(raw)
    assert features.loc[1, "rain_sum_3d_mm"] == 2
    assert features.loc[2, "rain_sum_3d_mm"] == 5
    assert features.loc[3, "rain_sum_3d_mm"] == 5
    assert features.loc[2, "wet_hours_3d"] == 7


def test_sanitizer_collapses_duplicate_daily_rows() -> None:
    from pest_risk.data.quality import sanitize_environmental_data

    raw = pd.DataFrame(
        {
            "province": ["Jawa Tengah", "Jawa Tengah"],
            "date": ["2026-07-01", "2026-07-01"],
            "rainfall_mm": [2.0, 2.0],
            "ndvi": [0.4, 0.6],
        }
    )
    clean = sanitize_environmental_data(raw)
    assert len(clean) == 1
    assert clean.loc[0, "rainfall_mm"] == 2.0
    assert clean.loc[0, "ndvi"] == pytest.approx(0.5)

from __future__ import annotations

from typing import Any

FEATURE_LABELS = {
    "temp_avg_3d_c": "Rata-rata suhu 3 hari",
    "temp_avg_7d_c": "Rata-rata suhu 7 hari",
    "rh_mean_3d_pct": "Rata-rata kelembapan udara 3 hari",
    "rh_max_3d_pct": "Kelembapan udara maksimum 3 hari",
    "rain_sum_3d_mm": "Akumulasi hujan 3 hari",
    "rain_sum_7d_mm": "Akumulasi hujan 7 hari",
    "rainy_days_3d": "Jumlah hari hujan dalam 3 hari",
    "rainy_days_7d": "Jumlah hari hujan dalam 7 hari",
    "wet_hours_1d": "Estimasi jam basah hari ini",
    "wet_hours_3d": "Akumulasi jam basah 3 hari",
    "wet_hours_7d": "Akumulasi jam basah 7 hari",
    "root_soil_z_90d": "Anomali kelembapan tanah zona akar",
    "surface_soil_z_90d": "Anomali kelembapan tanah permukaan",
    "rainfall_z_90d": "Anomali hujan terhadap 90 hari",
    "ndvi_mean_7d": "Rata-rata NDVI 7 hari",
}


def compact_feature_snapshot(
    record: dict[str, Any], feature_names: set[str]
) -> list[dict[str, Any]]:
    snapshots: list[dict[str, Any]] = []
    for feature in sorted(feature_names):
        value = record.get(feature)
        if value is None:
            continue
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            continue
        if numeric != numeric:
            continue
        snapshots.append(
            {
                "feature": feature,
                "label": FEATURE_LABELS.get(feature, feature),
                "value": round(numeric, 3),
            }
        )
    return snapshots

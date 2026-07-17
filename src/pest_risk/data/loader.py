from __future__ import annotations

import io
import logging
import re
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

LOGGER = logging.getLogger(__name__)

MASTER_RENAME = {
    "tanggal": "date",
    "provinsi": "province",
    "curah_hujan_mm": "rainfall_master_mm",
    "kelembapan_tanah_perakaran": "root_zone_soil_moisture_raw",
    "kelembapan_tanah_permukaan": "surface_soil_moisture_raw",
    "ndvi": "ndvi",
}

NASA_RENAME = {
    "tanggal": "date",
    "provinsi": "province",
    "suhu_avg": "temp_avg_c",
    "suhu_max": "temp_max_c",
    "suhu_min": "temp_min_c",
    "kelembapan_persen": "relative_humidity_pct",
    "curah_hujan_mm": "rainfall_nasa_mm",
    "kecepatan_angin_ms": "wind_speed_ms",
    "estimasi_jam_basah": "estimated_wet_hours",
    "lwd_berturut_jam": "cumulative_lwd_hours_raw",
}


def normalize_province(value: object) -> str:
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _read_member(archive: zipfile.ZipFile, member: str) -> pd.DataFrame:
    with archive.open(member) as source:
        return pd.read_csv(io.BytesIO(source.read()))


def _clean_common(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result = result.replace([-999, -999.0, "-999"], np.nan)
    result["date"] = pd.to_datetime(result["date"], errors="coerce")
    result["province"] = result["province"].map(normalize_province)
    result = result.dropna(subset=["date", "province"])
    return result


def _aggregate_duplicate_days(df: pd.DataFrame) -> pd.DataFrame:
    numeric = [column for column in df.columns if column not in {"date", "province"}]
    return (
        df.groupby(["province", "date"], as_index=False, observed=True)[numeric]
        .median(numeric_only=True)
        .sort_values(["province", "date"])
        .reset_index(drop=True)
    )


def load_dataset_zip(
    zip_path: str | Path,
    rainfall_source: str = "nasa",
) -> pd.DataFrame:
    """Load and merge all province CSVs from the uploaded dataset ZIP.

    The NASA and master datasets use the same keys but not always the same set of
    provinces. The function therefore performs an outer join and preserves both
    rainfall series before selecting a configurable canonical rainfall column.
    """

    source_path = Path(zip_path)
    if not source_path.exists():
        raise FileNotFoundError(f"Dataset ZIP not found: {source_path}")
    if rainfall_source not in {"nasa", "master"}:
        raise ValueError("rainfall_source must be nasa or master")

    master_frames: list[pd.DataFrame] = []
    nasa_frames: list[pd.DataFrame] = []

    with zipfile.ZipFile(source_path) as archive:
        members = archive.namelist()
        for member in members:
            lower = member.lower()
            if lower.endswith("_master_dataset.csv"):
                frame = _read_member(archive, member).rename(columns=MASTER_RENAME)
                required = set(MASTER_RENAME.values())
                missing = required.difference(frame.columns)
                if missing:
                    raise ValueError(f"Missing master columns in {member}: {sorted(missing)}")
                master_frames.append(_clean_common(frame[list(MASTER_RENAME.values())]))
            elif lower.endswith("_nasa_power.csv"):
                frame = _read_member(archive, member).rename(columns=NASA_RENAME)
                required = set(NASA_RENAME.values())
                missing = required.difference(frame.columns)
                if missing:
                    raise ValueError(f"Missing NASA columns in {member}: {sorted(missing)}")
                nasa_frames.append(_clean_common(frame[list(NASA_RENAME.values())]))

    if not master_frames:
        raise ValueError("No *_master_dataset.csv files found in ZIP")
    if not nasa_frames:
        raise ValueError("No *_nasa_power.csv files found in ZIP")

    master = _aggregate_duplicate_days(pd.concat(master_frames, ignore_index=True))
    nasa = _aggregate_duplicate_days(pd.concat(nasa_frames, ignore_index=True))

    merged = nasa.merge(master, on=["province", "date"], how="outer", validate="one_to_one")
    if rainfall_source == "nasa":
        merged["rainfall_mm"] = merged["rainfall_nasa_mm"].combine_first(
            merged["rainfall_master_mm"]
        )
    else:
        merged["rainfall_mm"] = merged["rainfall_master_mm"].combine_first(
            merged["rainfall_nasa_mm"]
        )

    merged["rainfall_source"] = np.where(
        merged[f"rainfall_{rainfall_source}_mm"].notna(), rainfall_source, "fallback"
    )
    merged = merged.sort_values(["province", "date"]).reset_index(drop=True)

    LOGGER.info(
        "Loaded %s rows across %s provinces from %s",
        len(merged),
        merged["province"].nunique(),
        source_path,
    )
    return merged

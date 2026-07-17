"""
Inference module. This is what the backend/API calls -- it never touches
training code or raw CSVs directly.

Because the model relies on lag/rolling features, forecasting more than
one day ahead is done *recursively*: predict day t+1, append it to the
history as if it were observed, recompute features, predict t+2, etc.
Error compounds with horizon, which is exactly why
`max_forecast_horizon_days` in config.yaml exists as a guardrail.
"""
from __future__ import annotations

import functools
from datetime import date, datetime, timedelta

import joblib
import pandas as pd

from src.config import MAX_FORECAST_HORIZON_DAYS, MODELS_DIR, PROCESSED_DIR
from src.features.build_features import add_calendar_features, add_lag_and_rolling_features


class UnknownSeriesError(ValueError):
    """Raised when a (market, province) combination has no training history."""


@functools.lru_cache(maxsize=None)
def _load_artifact(commodity: str) -> dict:
    path = MODELS_DIR / f"{commodity}.joblib"
    if not path.exists():
        raise FileNotFoundError(
            f"No trained model found for commodity '{commodity}' at {path}. "
            "Run `python -m src.models.train` first."
        )
    return joblib.load(path)


@functools.lru_cache(maxsize=None)
def _load_history() -> pd.DataFrame:
    return pd.read_parquet(PROCESSED_DIR / "prices_long.parquet")


def available_commodities() -> list[str]:
    return sorted(p.stem for p in MODELS_DIR.glob("*.joblib"))


def available_series(commodity: str) -> pd.DataFrame:
    """Returns the distinct (market, province) combinations available for
    a commodity, useful for a backend to populate dropdowns / validate
    requests before calling predict().
    """
    history = _load_history()
    sub = history[history["commodity"] == commodity]
    return sub[["market", "province"]].drop_duplicates().sort_values(["market", "province"])


def _apply_categories(df: pd.DataFrame, categories: dict) -> pd.DataFrame:
    df = df.copy()
    for col, levels in categories.items():
        df[col] = pd.Categorical(df[col], categories=levels)
    return df


def _get_series_history(commodity: str, market: str, province: str) -> pd.DataFrame:
    history = _load_history()
    series = history[
        (history["commodity"] == commodity)
        & (history["market"] == market)
        & (history["province"] == province)
    ].sort_values("date")
    if series.empty:
        raise UnknownSeriesError(
            f"No history for commodity='{commodity}' market='{market}' province='{province}'. "
            f"Available markets/provinces: use available_series('{commodity}')."
        )
    return series.reset_index(drop=True)


def predict(
    commodity: str,
    market: str,
    province: str,
    target_date: str | date | datetime,
) -> dict:
    """Forecasts the price for a single commodity/market/province on a
    single future (or past-but-untrained) date.

    Returns a dict ready to be serialized as JSON by an API layer:
        {
          "commodity": ..., "market": ..., "province": ...,
          "target_date": "2026-08-01",
          "predicted_price": 15234.5,
          "horizon_days": 15,
          "last_known_date": "2026-07-17",
          "last_known_price": 15100.0
        }
    """
    artifact = _load_artifact(commodity)
    model = artifact["model"]
    feature_columns = artifact["feature_columns"]
    categories = artifact["categories"]

    if isinstance(target_date, str):
        target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
    elif isinstance(target_date, datetime):
        target_date = target_date.date()

    series = _get_series_history(commodity, market, province)
    last_known_date = series["date"].max().date()
    last_known_price = float(series.loc[series["date"].idxmax(), "price"])

    horizon = (target_date - last_known_date).days
    if horizon <= 0:
        raise ValueError(
            f"target_date {target_date} is not after the last known date {last_known_date}. "
            "This endpoint forecasts the future; for historical dates, read data/processed directly."
        )
    if horizon > MAX_FORECAST_HORIZON_DAYS:
        raise ValueError(
            f"horizon of {horizon} days exceeds max_forecast_horizon_days="
            f"{MAX_FORECAST_HORIZON_DAYS}. Forecast accuracy degrades quickly with "
            "recursive multi-step prediction; request a nearer date."
        )

    working = series[["date", "province", "market", "commodity", "price"]].copy()
    predicted_price = None

    for step in range(1, horizon + 1):
        next_date = last_known_date + timedelta(days=step)
        new_row = pd.DataFrame(
            [{
                "date": pd.Timestamp(next_date),
                "province": province,
                "market": market,
                "commodity": commodity,
                "price": float("nan"),
            }]
        )
        working["price"] = working["price"].astype(float)
        working = pd.concat([working, new_row], ignore_index=True)

        feat = add_calendar_features(working)
        feat = add_lag_and_rolling_features(feat)
        feat = _apply_categories(feat, categories)

        row_to_predict = feat.iloc[[-1]][feature_columns]
        step_pred = float(model.predict(row_to_predict)[0])
        working.loc[working.index[-1], "price"] = step_pred
        predicted_price = step_pred

    return {
        "commodity": commodity,
        "market": market,
        "province": province,
        "target_date": target_date.isoformat(),
        "predicted_price": round(predicted_price, 2),
        "horizon_days": horizon,
        "last_known_date": last_known_date.isoformat(),
        "last_known_price": last_known_price,
    }

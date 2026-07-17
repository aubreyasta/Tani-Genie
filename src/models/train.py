"""
Trains one LightGBM regression model per commodity.

Design choice: rather than one model per (commodity, market, province)
-- which would mean 5 x 4 x 34 = 680 tiny models to maintain -- we train a
single model per commodity that takes `market` and `province` as
categorical features. This:
  - generalizes better (provinces/markets with less history borrow
    strength from similar ones)
  - keeps the artifact count small and easy for a backend to load
    (models/<commodity>.joblib)
  - still lets the API predict for any (commodity, market, province)
    combination present in training data

Run as:
    python -m src.models.train
"""
from __future__ import annotations

import json
import logging

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

from src.config import COMMODITIES, MODELS_DIR, PROCESSED_DIR, VALIDATION_DAYS, RANDOM_SEED
from src.features.build_features import (
    CATEGORICAL_COLUMNS,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    build_feature_table,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def _encode_categoricals(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Converts market/province string columns to pandas 'category' dtype
    and returns the fitted category levels so the exact same mapping can
    be reapplied at inference time.
    """
    df = df.copy()
    categories = {}
    for col in CATEGORICAL_COLUMNS:
        df[col] = df[col].astype("category")
        categories[col] = df[col].cat.categories.tolist()
    return df, categories


def _time_split(df: pd.DataFrame, validation_days: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    cutoff = df["date"].max() - pd.Timedelta(days=validation_days)
    train_df = df[df["date"] <= cutoff]
    val_df = df[df["date"] > cutoff]
    return train_df, val_df


def train_one_commodity(commodity: str, long_df: pd.DataFrame) -> dict:
    logger.info("[%s] building features ...", commodity)
    subset = long_df[long_df["commodity"] == commodity]
    feat_df = build_feature_table(subset)
    feat_df, categories = _encode_categoricals(feat_df)

    train_df, val_df = _time_split(feat_df, VALIDATION_DAYS)
    logger.info(
        "[%s] train rows=%s val rows=%s (val = last %s days)",
        commodity, len(train_df), len(val_df), VALIDATION_DAYS,
    )

    X_train, y_train = train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN]
    X_val, y_val = val_df[FEATURE_COLUMNS], val_df[TARGET_COLUMN]

    model = lgb.LGBMRegressor(
        objective="regression",
        n_estimators=600,
        learning_rate=0.05,
        num_leaves=63,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=RANDOM_SEED,
        verbosity=-1,
    )
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        categorical_feature=CATEGORICAL_COLUMNS,
        callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(0)],
    )

    preds = model.predict(X_val)
    mae = mean_absolute_error(y_val, preds)
    mape = mean_absolute_percentage_error(y_val, preds)
    logger.info("[%s] validation MAE=%.2f MAPE=%.4f", commodity, mae, mape)

    artifact = {
        "model": model,
        "categories": categories,
        "feature_columns": FEATURE_COLUMNS,
        "categorical_columns": CATEGORICAL_COLUMNS,
        "commodity": commodity,
    }
    joblib.dump(artifact, MODELS_DIR / f"{commodity}.joblib")

    return {
        "commodity": commodity,
        "val_mae": float(mae),
        "val_mape": float(mape),
        "train_rows": int(len(train_df)),
        "val_rows": int(len(val_df)),
        "last_train_date": str(feat_df["date"].max().date()),
    }


def main() -> None:
    long_df = pd.read_parquet(PROCESSED_DIR / "prices_long.parquet")
    metrics = [train_one_commodity(c, long_df) for c in COMMODITIES]

    metrics_path = MODELS_DIR / "training_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info("Wrote metrics to %s", metrics_path)
    for m in metrics:
        logger.info(m)


if __name__ == "__main__":
    main()

# EDA notes -- Tani Genie price prediction

Quick reference for exploring `data/processed/prices_long.parquet` in a
notebook. Copy these cells into `notebooks/01_eda.ipynb` (or just run this
file as a script) to sanity-check the data before retraining.

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_parquet("data/processed/prices_long.parquet")

# 1. Coverage check: rows per (market, commodity)
print(df.groupby(["market", "commodity"]).size())

# 2. Missing-day check per series (should be ~0 after load_raw stitching)
full_range = pd.date_range(df["date"].min(), df["date"].max(), freq="D")
sample = df[(df.market == "pasar_tradisional") & (df.commodity == "beras") & (df.province == "DKI Jakarta")]
missing_days = full_range.difference(sample["date"])
print("missing days:", len(missing_days))

# 3. Plot one series
sample.set_index("date")["price"].plot(title="Beras - Pasar Tradisional - DKI Jakarta")
plt.show()

# 4. Cross-market comparison for one commodity/province
pivot = (
    df[(df.commodity == "cabai_rawit") & (df.province == "Jawa Barat")]
    .pivot(index="date", columns="market", values="price")
)
pivot.plot(title="Cabai Rawit across market levels - Jawa Barat")
plt.show()
```

## Things worth checking before a hackathon demo
- `produsen` + `bawang_putih` has very few provinces with data (Indonesia
  imports most of its garlic) -- don't be surprised if the API returns 404
  for most provinces on that specific combination.
- Prices in `data/raw/*/cleaned/*.csv` are imputed for 2022-01-01 through
  2026-02-12; treat those early values as smoothed, not raw observations.
- `models/training_metrics.json` (created by `scripts/run_pipeline.sh`) has
  the validation MAE/MAPE per commodity -- check it after every retrain.

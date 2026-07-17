# Tani Genie — Commodity Price Prediction

Price forecasting service for five staple Indonesian commodities —
**beras** (rice), **bawang merah** (shallot), **bawang putih** (garlic),
**cabai merah** (red chili), and **cabai rawit** (cayenne pepper) — across
four market levels (**pasar tradisional**, **pasar modern**, **pedagang
besar**, **produsen**) and Indonesia's 34 provinces.

Built so a website's backend can call one HTTP endpoint and get back a
price forecast for any (commodity, market, province, future date)
combination it needs, without having to know anything about the model
internals.

## Project structure

```
.
├── config/
│   └── config.yaml          # single source of truth: paths, commodities, markets
├── data/
│   ├── raw/                 # original CSVs, organized by market/commodity (read-only inputs)
│   ├── interim/              # scratch space for intermediate steps (empty by default)
│   └── processed/            # prices_long.parquet -- the long-format table everything else reads
├── src/
│   ├── config.py             # loads config.yaml, resolves paths
│   ├── data/
│   │   ├── load_raw.py       # wide CSV -> long DataFrame, stitches cleaned+continuation files
│   │   └── make_dataset.py   # entry point: writes data/processed/prices_long.parquet
│   ├── features/
│   │   └── build_features.py # calendar features, lags, rolling stats (leak-free)
│   └── models/
│       ├── train.py          # trains one LightGBM model per commodity
│       └── predict.py        # recursive multi-day forecasting for a single series
├── api/
│   ├── main.py                # FastAPI app -- what the backend actually calls
│   ├── schemas.py             # request/response validation
│   └── service.py             # thin glue layer between api/main.py and src/models/predict.py
├── models/                    # trained artifacts (<commodity>.joblib) + training_metrics.json
├── tests/                      # pytest suite covering data, features, and API layers
├── notebooks/
│   └── 01_eda_notes.md         # copy-pasteable EDA snippets
├── scripts/
│   └── run_pipeline.sh         # data build + training, one command
└── requirements.txt
```

**Why this shape:** raw data never gets mutated in place, every derived
artifact (`data/processed/`, `models/`) can be regenerated from `data/raw/`
by re-running the pipeline, and the API layer only imports from
`src/models/predict.py` — never from `train.py` or the raw loaders — so
serving and training stay decoupled.

## How the data is put together

The raw export has two shapes:

- **`pasar_tradisional`, `pasar_modern`, `produsen`**: split into a
  `cleaned/` file (imputed, 2022‑01‑01 → 2026‑02‑12) and a `continuation/`
  file (freshly scraped, 2026‑02‑13 → present). `src/data/load_raw.py`
  stitches these together automatically, trusting the continuation file
  for any overlapping dates.
- **`pedagang_besar`**: already one continuous file, no stitching needed.

Every file is wide (one column per province); `load_raw.py` melts
everything into one tidy long table:

```
date | province | market | commodity | price
```

which is the only format the rest of the codebase deals with.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Running the pipeline

```bash
bash scripts/run_pipeline.sh
# or step by step:
python -m src.data.make_dataset   # builds data/processed/prices_long.parquet
python -m src.models.train        # trains models/*.joblib + models/training_metrics.json
```

Re-run this whenever new raw CSVs land in `data/raw/`.

## Serving predictions (what the backend calls)

```bash
uvicorn api.main:app --reload --port 8000
```

### Endpoints

| Method | Path                  | Purpose                                               |
|--------|------------------------|--------------------------------------------------------|
| GET    | `/health`              | Liveness check                                          |
| GET    | `/metadata`             | Valid commodities/markets, for populating dropdowns     |
| GET    | `/series/{commodity}`  | Valid (market, province) combos for that commodity      |
| POST   | `/predict`             | The actual forecast                                     |

`POST /predict` example:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "commodity": "beras",
    "market": "pasar_tradisional",
    "province": "DKI Jakarta",
    "target_date": "2026-08-01"
  }'
```

```json
{
  "commodity": "beras",
  "market": "pasar_tradisional",
  "province": "DKI Jakarta",
  "target_date": "2026-08-01",
  "predicted_price": 16848.97,
  "horizon_days": 15,
  "last_known_date": "2026-07-17",
  "last_known_price": 16850.0
}
```

Errors are plain HTTP status codes with a JSON `detail` message:
- `400` — unknown commodity/market, or `target_date` too far in the
  future (see `max_forecast_horizon_days` in `config/config.yaml`)
- `404` — that (market, province) combination has no history for the
  requested commodity (e.g. most provinces have no `produsen`-level garlic
  price, since Indonesia grows very little of its own garlic)

Interactive API docs (Swagger UI) are auto-generated at
`http://localhost:8000/docs` once the server is running.

## Modeling approach

One LightGBM regression model **per commodity**, trained across all
markets and provinces at once (`market` and `province` are categorical
features rather than one-model-per-series). This keeps the artifact count
at 5 instead of 5 × 4 × 34, lets thin series borrow statistical strength
from similar ones, and is easy for a backend to load and cache.

Features: calendar (day of week/month, weekend flag), price lags (1, 3, 7,
14, 30 days), and rolling mean/std (7/14/30-day windows) — all computed so
the model never sees same-day or future information (no leakage).

Forecasting more than one day ahead is done **recursively**: the model
predicts day *t+1*, that prediction is fed back in as if it were observed
to build the lag features for *t+2*, and so on. Error compounds with
horizon, which is why `max_forecast_horizon_days` (default 30) exists as a
guardrail — extend it in `config/config.yaml` if your use case genuinely
needs longer-range forecasts, but expect accuracy to degrade.

Current validation metrics (last 30 held-out days, see
`models/training_metrics.json` after training):

| Commodity     | Val MAE (Rp) | Val MAPE |
|---------------|--------------|----------|
| beras         | ~18          | ~0.1%    |
| bawang_merah  | ~534         | ~1.1%    |
| bawang_putih  | ~286         | ~0.7%    |
| cabai_merah   | ~730         | ~1.5%    |
| cabai_rawit   | ~1095        | ~1.7%    |

These numbers reflect 1-step-ahead validation error on recent history —
treat them as a ceiling on accuracy, since real deployment predicts
further into the future where recursive error compounds.

## Testing

```bash
pytest tests/ -v
```

Covers: raw-data loading (no duplicate dates, all provinces present),
feature engineering (no leakage, no NaNs), and the API (happy path + the
400/404 error cases above).

## Extending this project

- **New commodity**: drop matching CSVs into `data/raw/<market>/...`,
  add the name to `commodities:` in `config/config.yaml`, re-run
  `scripts/run_pipeline.sh`.
- **New market level**: add an entry under `markets:` in `config.yaml`
  with the right `folder_layout` (`split` or `single`), place the raw
  files, re-run the pipeline.
- **Swap the model**: only `src/models/train.py` and `predict.py` know
  about LightGBM; the API and feature code are model-agnostic.

# Tani-Genie Pest & Disease Risk Service

A research service for weakly supervised crop disease-risk classification. It converts recent weather, soil-moisture, wetness, and vegetation observations into disease-specific environmental risk scores.

The service is designed for early warning and field-inspection prioritization. Its output is a **risk flag**, not a diagnosis that a crop is infected.

## Supported risk models

| Disease | Crops | Initial confidence |
|---|---|---:|
| Onion downy mildew | Shallot, garlic | Medium |
| Rice blast | Rice | Medium |
| Chili Phytophthora blight/rot | Red chili, bird's-eye chili | Medium |
| Chili anthracnose | Red chili, bird's-eye chili | Low |

Vector-driven pests and diseases are intentionally excluded from disease-name prediction because environmental data alone is not enough to identify them reliably.

## Repository layout

```text
configs/                  Versioned crop, rule, and model configuration
src/pest_risk/            Data, features, labeling, training, and inference code
scripts/                  Reproducible command-line workflows
tests/                    Unit and API tests
integration/tani-genie/   Next.js integration example
data/raw/                 Local source data; ignored by Git
data/processed/           Generated features; ignored by Git
models/                   Generated model artifacts; ignored by Git
reports/                  Generated evaluation outputs; ignored by Git
```

The repository intentionally excludes datasets, trained artifacts, and generated reports. Recreate them locally through the commands below.

## Installation

Python 3.11 is recommended.

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

## Data preparation

Place the source ZIP locally at:

```text
data/raw/Pest Dataset.zip
```

The file is ignored by Git and must not contain private field data unless access controls are in place.

Audit the ZIP:

```bash
PYTHONPATH=src python scripts/inspect_data.py \
  --zip "data/raw/Pest Dataset.zip"
```

Build leakage-safe rolling features:

```bash
PYTHONPATH=src python scripts/build_dataset.py \
  --zip "data/raw/Pest Dataset.zip" \
  --output data/processed/features.parquet \
  --quality-report reports/data_quality.json
```

The data loader:

- converts sentinel values such as `-999` to missing values;
- resolves duplicate province-date records;
- preserves separate rainfall sources;
- validates environmental ranges;
- avoids interpreting unverified soil-moisture units as percentages.

## Feature groups

The default feature pipeline creates lagged and rolling variables without using future observations:

- temperature mean, minimum, and maximum;
- relative-humidity means and extremes;
- rainfall accumulation and rainy-day counts;
- estimated wet hours and consecutive wet days;
- days since rain;
- root-zone and surface-soil moisture anomalies;
- NDVI level and short-term change;
- seasonal sine/cosine encoding;
- data-completeness indicators.

Rolling windows include 1, 3, 7, and 14 days. Ninety-day history improves rainfall and soil-moisture anomaly estimates.

## Weak supervision

Research knowledge is stored in `configs/disease_rules.yaml`. Each labeling function returns:

```text
-1 = ABSTAIN
 0 = NEGATIVE
 1 = POSITIVE
```

`ABSTAIN` prevents a rule from treating missing or irrelevant evidence as a negative observation.

The training pipeline uses one binary model per disease:

```text
environmental history
        ↓
rolling features
        ↓
versioned labeling functions
        ↓
Snorkel LabelModel or documented weighted-vote fallback
        ↓
probabilistic weak labels
        ↓
tabular classifier
        ↓
risk score, confidence, and rule evidence
```

Train all configured models:

```bash
PYTHONPATH=src python scripts/train.py \
  --features data/processed/features.parquet \
  --model-dir models \
  --report-dir reports \
  --aggregator snorkel
```

Train selected diseases:

```bash
PYTHONPATH=src python scripts/train.py \
  --features data/processed/features.parquet \
  --disease onion_downy_mildew \
  --disease rice_blast
```

If Snorkel does not produce enough high-confidence examples for both classes, the pipeline records the issue and uses the configured weighted-rule aggregation. It does not silently train a one-class classifier.

## Evaluation

Run a pipeline-level evaluation:

```bash
PYTHONPATH=src python scripts/evaluate.py \
  --features data/processed/features.parquet \
  --model-dir models \
  --output reports/evaluation.json
```

These metrics measure agreement with held-out weak labels, not agronomic accuracy. Real performance claims require field-confirmed positive and negative labels.

Create a field-review batch:

```bash
PYTHONPATH=src python scripts/seed_gold_labels.py \
  --features data/processed/features.parquet \
  --output data/gold/review_batch.csv \
  --rows 300
```

Evaluate reviewed labels:

```bash
PYTHONPATH=src python scripts/evaluate_gold.py \
  --features data/processed/features.parquet \
  --gold data/gold/gold_labels.csv \
  --model-dir models \
  --output reports/gold_evaluation.json
```

Recommended metrics include PR-AUC, recall at the alert threshold, false alerts per plot-month, event detection, warning lead time, Brier score, and performance by province and season.

## Active learning and pseudo-labeling

Select uncertain or conflicting cases for field review:

```bash
PYTHONPATH=src python scripts/select_active_learning.py \
  --features data/processed/features.parquet \
  --model-dir models \
  --rows-per-disease 100 \
  --output data/gold/active_learning_batch.csv
```

Generate conservative pseudo-label candidates:

```bash
PYTHONPATH=src python scripts/generate_pseudo_labels.py \
  --features data/processed/features.parquet \
  --model-dir models \
  --positive-threshold 0.95 \
  --negative-threshold 0.05 \
  --minimum-completeness 0.80 \
  --output reports/pseudo_labels.parquet
```

Pseudo-labels are not automatically mixed into training. Validate them against a locked field-labeled test set before use.

## API

Start the service after training artifacts are available:

```bash
PYTHONPATH=src uvicorn pest_risk.api.main:app \
  --host 0.0.0.0 \
  --port 8002 \
  --reload
```

Endpoints:

```text
GET  /health
GET  /v1/diseases
POST /v1/risk/predict
POST /v1/risk/predict-batch
POST /v1/models/reload
```

A sample request is available at `data/sample/prediction_request.json`.

The response includes:

- disease-specific `risk_score`;
- LOW, MEDIUM, or HIGH risk level;
- evidence and data-completeness confidence;
- positive and negative rules that fired;
- compact feature snapshots;
- rule and model versions;
- an environmental-risk disclaimer.

Send at least 14 days of recent history. Ninety days is preferable for stable anomaly features.

## Docker

The repository does not include model artifacts. Train or place model files in `models/` before starting the service.

```bash
cp .env.example .env
docker compose up --build
```

Open:

```text
http://localhost:8002/docs
http://localhost:8002/health
```

## Tani-Genie integration

`integration/tani-genie/` contains:

- a typed API client;
- a server-side Next.js proxy route;
- a risk card component;
- environment-variable additions;
- an optional Prisma persistence snippet.

Keep the existing generic weather verdict as a fallback when the Python service is unavailable. Do not display an unavailable disease risk as a safe condition.

## Quality checks

```bash
make test
make lint
```

Or directly:

```bash
PYTHONPATH=src pytest -q
ruff check .
mypy src
```

## Scientific constraints

Before operational deployment:

1. review thresholds with Indonesian plant-pathology experts;
2. add plot-level crop, planting date, and growth stage;
3. collect representative field-confirmed positive and negative labels;
4. test temporal and geographic holdouts;
5. calibrate probability on field labels;
6. select alert thresholds using false-alert and missed-outbreak costs;
7. monitor data drift, missingness, and alert fatigue;
8. consistently present the output as risk rather than diagnosis.

See `CONSTRAINTS.md`, `MODEL_CARD.md`, and `SOURCES.md` for detailed boundaries and research provenance.

## License

MIT. See `LICENSE`.

PYTHON ?= python
ZIP ?= data/raw/Pest\ Dataset.zip

.PHONY: install install-dev inspect audit build-data train evaluate evaluate-gold pseudo-label active-learning serve test lint format clean demo

install:
	$(PYTHON) -m pip install -r requirements.txt
	$(PYTHON) -m pip install -e .

install-dev:
	$(PYTHON) -m pip install -r requirements-dev.txt
	$(PYTHON) -m pip install -e .

inspect:
	$(PYTHON) scripts/inspect_data.py --zip "$(ZIP)"

audit: inspect

build-data:
	$(PYTHON) scripts/build_dataset.py --zip "$(ZIP)" --output data/processed/features.parquet

train: build-data
	$(PYTHON) scripts/train.py --features data/processed/features.parquet --model-dir models --report-dir reports --aggregator snorkel

train-fallback: build-data
	$(PYTHON) scripts/train.py --features data/processed/features.parquet --model-dir models --report-dir reports --aggregator weighted

evaluate:
	$(PYTHON) scripts/evaluate.py --features data/processed/features.parquet --model-dir models --output reports/evaluation.json

evaluate-gold:
	$(PYTHON) scripts/evaluate_gold.py --features data/processed/features.parquet --gold data/gold/gold_labels.csv --model-dir models

pseudo-label:
	$(PYTHON) scripts/generate_pseudo_labels.py --features data/processed/features.parquet --model-dir models

active-learning:
	$(PYTHON) scripts/select_active_learning.py --features data/processed/features.parquet --model-dir models

serve:
	uvicorn pest_risk.api.main:app --reload --port 8002

test:
	pytest

lint:
	ruff check .

format:
	ruff format .

clean:
	rm -f data/processed/*.parquet data/processed/*.csv models/*.joblib models/*.json reports/*.csv reports/*.json

demo:
	$(PYTHON) scripts/predict.py --request data/sample/prediction_request.json

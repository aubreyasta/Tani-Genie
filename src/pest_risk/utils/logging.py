from __future__ import annotations

import logging
import os


def configure_logging(level: str | None = None) -> None:
    resolved = (level or os.getenv("PEST_RISK_LOG_LEVEL") or "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, resolved, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

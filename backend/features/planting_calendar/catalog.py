"""
catalog.py — Kebunku: the crop catalog + home dashboard.

Sits on top of the planting-calendar feature. It owns two records:

    Plot     — a piece of land: name, GPS, size. Entered ONCE.
    Planting — a crop growing on a plot: crop, planting date, data-points.

and exposes the flows the UI and the early-warning system use:

    add_plot(...)          register a plot (location + size)
    preview_crop(...)      the add-crop preview: expected yield + input cost
    add_crop(...)          commit a planting (by date OR by current stage)
    home(...)              the Kebunku home: all crops + aggregate to-do list
    planting_detail(...)   one crop's full calendar/GDD/cost/tasks
    set_data_points(...)   configure a crop's data-points (source or IoT)
    flag_risk(...)         early-warning hook -> adds one task to a crop

Records are plain dataclasses (a "row" each), so they map cleanly onto DB
tables later (e.g. Prisma Plot / Planting), matching the lofi data model.
"""

import datetime as dt
import uuid
from dataclasses import dataclass, field
from typing import Optional

from .crops import CROPS
from .cost import estimate_cost, rupiah
from .calendar_calc import get_status
from .tasks import TaskStore
from .dashboard import plant_dashboard


# The fixed menu of drag-and-drop data-points, and where each can come from.
DATA_POINTS = ["temp", "humidity", "rainfall", "soil_moisture", "nutrients_ph"]
DATA_SOURCES = ["api", "iot"]          # our data feed, or the farmer's own sensor


def _id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


@dataclass
class Plot:
    id: str
    name: str
    latitude: float
    longitude: float
    area_ha: float


@dataclass
class Planting:
    id: str
    plot_id: str
    crop_key: str
    planting_date: dt.date
    seedlings: Optional[int] = None
    data_points: dict = field(default_factory=dict)     # {signal: "api"|"iot"}
    created_at: dt.date = field(default_factory=dt.date.today)


class Kebunku:
    """Crop catalog + home dashboard. One instance = one farmer's garden."""

    def __init__(self):
        self.plots: dict[str, Plot] = {}
        self.plantings: dict[str, Planting] = {}
        self.tasks = TaskStore()                        # shared task DB

    # ------------------------------------------------------------------ #
    # Plots (location + size, entered once)
    # ------------------------------------------------------------------ #
    def add_plot(self, name, latitude, longitude, area_ha):
        plot = Plot(_id("plot"), name, latitude, longitude, area_ha)
        self.plots[plot.id] = plot
        return plot

    # ------------------------------------------------------------------ #
    # Add-crop flow
    # ------------------------------------------------------------------ #
    def preview_crop(self, crop_key, area_ha, seedlings=None,
                     sell_price_per_kg=None, price_overrides=None):
        """
        Shown BEFORE the farmer confirms: expected yield (static knowledge
        base) + predicted input cost. Feed live fertilizer rates via
        `price_overrides` when you have them.
        """
        cost = estimate_cost(crop_key, area_ha,
                             price_overrides=price_overrides,
                             sell_price_per_kg=sell_price_per_kg)
        return {
            "crop": CROPS[crop_key]["display_name"],
            "area_ha": area_ha,
            "seedlings": seedlings,
            "expected_yield_kg": cost["expected_yield_kg"],
            "estimated_modal": cost["total_modal"],
            "estimated_modal_str": rupiah(cost["total_modal"]),
            "cost_detail": cost,
        }

    def stage_to_planting_date(self, crop_key, stage_name, on_date=None):
        """
        Already-planted case: infer the planting date from the stage the
        farmer says the crop is at now (assume the middle of that stage).
        """
        on_date = on_date or dt.date.today()
        for s in CROPS[crop_key]["stages"]:
            if s["name"] == stage_name:
                mid_day = (s["start"] + s["end"]) // 2
                return on_date - dt.timedelta(days=mid_day)
        raise ValueError(f"unknown stage '{stage_name}' for {crop_key}")

    def add_crop(self, plot_id, crop_key, planting_date=None, stage=None,
                 seedlings=None, data_points=None, on_date=None):
        """
        Commit a planting. Provide EITHER:
          planting_date  -> not planted yet, or a known date (calendar starts then)
          stage          -> already planted; date is inferred from current stage
        Default data-points = pull all five from our API (farmer can change later).
        """
        on_date = on_date or dt.date.today()
        if planting_date is None:
            planting_date = (self.stage_to_planting_date(crop_key, stage, on_date)
                             if stage else on_date)

        pl = Planting(
            id=_id("plant"), plot_id=plot_id, crop_key=crop_key,
            planting_date=planting_date, seedlings=seedlings,
            data_points=data_points or {dp: "api" for dp in DATA_POINTS},
        )
        self.plantings[pl.id] = pl
        self.tasks.create_planting(pl.id, crop_key, planting_date)   # seed fixed tasks
        return pl

    # ------------------------------------------------------------------ #
    # Data-points (per-crop, drag-and-drop config)
    # ------------------------------------------------------------------ #
    def set_data_points(self, planting_id, mapping):
        """mapping: {signal: 'api'|'iot'}. Validated against the fixed menus."""
        for sig, src in mapping.items():
            if sig not in DATA_POINTS:
                raise ValueError(f"unknown data point: {sig}")
            if src not in DATA_SOURCES:
                raise ValueError(f"unknown source: {src}")
        self.plantings[planting_id].data_points = mapping
        return mapping

    # ------------------------------------------------------------------ #
    # Early-warning hook
    # ------------------------------------------------------------------ #
    def flag_risk(self, planting_id, risk_type, label=None, on_date=None):
        """
        Called by the early-warning system: adds ONE task for a detected risk
        to this crop's calendar (dedup handled by TaskStore).
        """
        pl = self.plantings[planting_id]
        return self.tasks.add_risk_task(pl.id, pl.crop_key, risk_type,
                                        on_date=on_date, label=label)

    def complete_task(self, planting_id, task_id):
        return self.tasks.complete(planting_id, task_id)

    # ------------------------------------------------------------------ #
    # Home dashboard
    # ------------------------------------------------------------------ #
    def home(self, on_date=None):
        """The Kebunku home: a card per crop + one aggregate to-do list."""
        on_date = on_date or dt.date.today()
        cards = []
        for pl in self.plantings.values():
            st = get_status(pl.crop_key, pl.planting_date, on_date)
            plot = self.plots.get(pl.plot_id)
            cards.append({
                "planting_id": pl.id,
                "crop": st["crop"],
                "plot": plot.name if plot else None,
                "stage": st["current_stage"],
                "progress_pct": st["progress_pct"],
                "days_to_harvest": st["days_to_harvest"],
                "next_task": st["next_task"],
            })
        todo = self.tasks.all_pending()
        return {"crops": cards, "todo": todo, "todo_count": len(todo)}

    # ------------------------------------------------------------------ #
    # Per-crop detail
    # ------------------------------------------------------------------ #
    def planting_detail(self, planting_id, on_date=None, sell_price_per_kg=None):
        """Tapping a crop -> its full calendar, GDD progress, cost, tasks."""
        pl = self.plantings[planting_id]
        plot = self.plots.get(pl.plot_id)
        payload = plant_dashboard(
            pl.crop_key, pl.planting_date,
            plot_ha=plot.area_ha if plot else 0.0,
            lat=plot.latitude if plot else None,
            lon=plot.longitude if plot else None,
            sell_price_per_kg=sell_price_per_kg,
            planting_id=pl.id, task_store=self.tasks, on_date=on_date,
        )
        payload["plot"] = plot.name if plot else None
        payload["data_points"] = pl.data_points
        return payload
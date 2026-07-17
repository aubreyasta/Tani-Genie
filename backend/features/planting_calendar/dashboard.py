"""
dashboard.py — the one function the app/UI calls.

plant_dashboard() bundles everything for the "Kalender + biaya" screen:
  * the plain calendar + current status (stage, progress, next task)
  * the weather-adjusted harvest estimate (GDD), if a location is given
  * the input-cost breakdown, plus profit if a sell price is given
"""

import datetime as dt

from .calendar_calc import build_calendar, get_status
from .gdd import gdd_status, gdd_stage
from .weather import get_temperature
from .cost import estimate_cost
from .tasks import generate_tasks


def plant_dashboard(crop_key, planting_date, plot_ha,
                    lat=None, lon=None,
                    sell_price_per_kg=None, price_overrides=None,
                    on_date=None, allow_synthetic=True,
                    planting_id=None, task_store=None):
    """
    Build the full feature payload for one planted crop — everything the
    "Kalender + biaya" screen needs, in one call.

    Required: crop_key, planting_date (date), plot_ha (float).
    Optional:
      lat/lon            -> enables the GDD harvest estimate + heat progress
      sell_price_per_kg  -> enables revenue/profit
      price_overrides    -> real input prices
      on_date            -> defaults to today
      planting_id        -> id used for the task list (and the task_store)
      task_store         -> a TaskStore; if given, the returned task list is
                            LIVE (fixed tasks + any early-warning risk tasks).
                            If omitted, only the fixed tasks are returned.
    """
    if on_date is None:
        on_date = dt.date.today()
    pid = planting_id or "temp"

    payload = {
        "calendar": build_calendar(crop_key, planting_date),
        "status": get_status(crop_key, planting_date, on_date),
        "cost": estimate_cost(crop_key, plot_ha,
                              price_overrides=price_overrides,
                              sell_price_per_kg=sell_price_per_kg),
        "gdd": None,
        "weather_source": None,
        "tasks": [],
    }

    # --- Task list: fixed tasks, plus early-warning risk tasks if a store
    #     is supplied. The store is the shared DB the early-warning system
    #     writes into via add_risk_task(); reading it here keeps the UI in sync.
    if task_store is not None:
        existing = getattr(task_store, "_by_planting", {}).get(pid)
        if existing is None:                       # first time: seed fixed tasks
            task_store.create_planting(pid, crop_key, planting_date)
        payload["tasks"] = task_store.pending(pid)
    else:
        payload["tasks"] = [t for t in generate_tasks(pid, crop_key, planting_date)
                            if t["status"] == "pending"]

    # --- GDD needs a location to pull temperatures for.
    if lat is not None and lon is not None:
        wx, source = get_temperature(lat, lon, planting_date, on_date,
                                     allow_synthetic=allow_synthetic)
        payload["weather_source"] = source
        wx = wx[wx.index.date <= on_date]          # POWER may return extra rows
        if len(wx):
            gdd = gdd_status(crop_key, planting_date, wx, on_date)
            gdd.update(gdd_stage(crop_key, wx, on_date))   # + heat-driven progress
            payload["gdd"] = gdd

    return payload
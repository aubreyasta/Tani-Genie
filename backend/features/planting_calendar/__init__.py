"""
tanigata_calendar — planting-calendar feature.

Public API:
    plant_dashboard(...)   one call -> everything the UI needs
    list_crops()           available crops
    estimate_cost(...)     cost/profit only
    get_status(...)        calendar status only
    rupiah(n)              format Rupiah
"""

from .crops import CROPS, list_crops
from .calendar_calc import build_calendar, get_status
from .gdd import gdd_status, daily_gdd, gdd_stage
from .tasks import TaskStore, generate_tasks, RISK_ACTIONS
from .cost import estimate_cost, rupiah
from .weather import fetch_nasa_power, get_temperature
from .dashboard import plant_dashboard

__all__ = [
    "CROPS", "list_crops", "build_calendar", "get_status",
    "gdd_status", "daily_gdd", "gdd_stage", "estimate_cost", "rupiah",
    "TaskStore", "generate_tasks", "RISK_ACTIONS",
    "fetch_nasa_power", "get_temperature", "plant_dashboard",
]
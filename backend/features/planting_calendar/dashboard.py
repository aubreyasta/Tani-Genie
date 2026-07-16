"""
  * the plain calendar + current status (stage, progress, next task)
  * the weather-adjusted harvest estimate (GDD), if a location is given
  * the input-cost breakdown, plus profit if a sell price is given
"""

import datetime as dt

from .calendar_calc import build_calendar, get_status
from .gdd import gdd_status
from .weather import get_temperature
from .cost import estimate_cost


def plant_dashboard(crop_key, planting_date, plot_ha,
                    lat=None, lon=None,
                    sell_price_per_kg=None, price_overrides=None,
                    on_date=None, allow_synthetic=True):
    """
    Required: crop_key, planting_date (date), plot_ha (float).
    Optional: lat/lon (enables the GDD harvest estimate),
              sell_price_per_kg (enables revenue/profit),
              price_overrides (real input prices),
              on_date (defaults to today).
    """
    if on_date is None:
        on_date = dt.date.today()

    payload = {
        "calendar": build_calendar(crop_key, planting_date),
        "status": get_status(crop_key, planting_date, on_date),
        "cost": estimate_cost(crop_key, plot_ha,
                              price_overrides=price_overrides,
                              sell_price_per_kg=sell_price_per_kg),
        "gdd": None,
        "weather_source": None,
    }

    if lat is not None and lon is not None:
        wx, source = get_temperature(lat, lon, planting_date, on_date,
                                     allow_synthetic=allow_synthetic)
        payload["weather_source"] = source
        
        wx = wx[wx.index.date <= on_date]
        if len(wx):
            payload["gdd"] = gdd_status(crop_key, planting_date, wx, on_date)

    return payload
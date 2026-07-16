import datetime as dt
import math

from .crops import CROPS


def daily_gdd(tmax, tmin, tbase, tupper=30.0):
    tmax = min(tmax, tupper)       
    tmin = max(tmin, tbase)    
    return max(0.0, (tmax + tmin) / 2.0 - tbase)


def add_gdd_columns(weather_df, tbase, tupper=30.0):
    df = weather_df.copy()
    df["gdd"] = [daily_gdd(mx, mn, tbase, tupper)
                 for mx, mn in zip(df["T2M_MAX"], df["T2M_MIN"])]
    df["gdd_cum"] = df["gdd"].cumsum()
    return df


def gdd_status(crop_key, planting_date, weather_df, on_date=None):
    crop = CROPS[crop_key]
    tbase = crop["base_temp_c"]
    target = crop["gdd_to_harvest"]
    if on_date is None:
        on_date = weather_df.index.max().date()

    df = add_gdd_columns(weather_df, tbase)
    accumulated = float(df["gdd"].sum())
    recent_rate = float(df["gdd"].tail(10).mean())
    remaining = max(0.0, target - accumulated)
    days_left = math.ceil(remaining / recent_rate) if recent_rate > 0 else None

    projected_harvest = (on_date + dt.timedelta(days=days_left)
                         if days_left is not None else None)
    calendar_harvest = planting_date + dt.timedelta(days=crop["days_to_harvest"])
    diff = ((projected_harvest - calendar_harvest).days
            if projected_harvest else None)

    return {
        "accumulated_gdd": round(accumulated),
        "target_gdd": target,
        "progress_pct": max(0, min(100, round(accumulated / target * 100))),
        "recent_gdd_per_day": round(recent_rate, 1),
        "projected_harvest": projected_harvest,   
        "calendar_harvest": calendar_harvest,    
        "days_vs_calendar": diff,                  
    }
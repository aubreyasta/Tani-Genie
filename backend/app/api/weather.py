"""
fetch_nasa_power()  : real daily Tmax/Tmin from NASA POWER (no API key).
synthetic_weather() : offline fallback so demos run without internet.
get_temperature()   : tries the real API, falls back to synthetic.
"""

import datetime as dt
import requests
import pandas as pd


def fetch_nasa_power(lat, lon, start, end):
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M_MAX,T2M_MIN",
        "community": "ag",
        "latitude": lat,
        "longitude": lon,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()
    block = resp.json()["properties"]["parameter"]

    df = pd.DataFrame(block)
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "date"
    df = df.where(df != -999)          
    return df.sort_index()


def synthetic_weather(start, end, warm_spell=True):
    rows = []
    d, i = start, 0
    n = (end - start).days
    while d <= end:
        tmax, tmin = 31.0, 24.0
        if warm_spell and i > n - 15:      
            tmax, tmin = 34.5, 26.5
        rows.append({"date": pd.Timestamp(d), "T2M_MAX": tmax, "T2M_MIN": tmin})
        d += dt.timedelta(days=1)
        i += 1
    return pd.DataFrame(rows).set_index("date")


def get_temperature(lat, lon, start, end, allow_synthetic=True):
    try:
        return fetch_nasa_power(lat, lon, start, end), "NASA POWER"
    except Exception as e:              
        if not allow_synthetic:
            raise
        return synthetic_weather(start, end), f"synthetic (POWER failed: {e.__class__.__name__})"
import datetime as dt

from features.planting_calendar.crops import CROPS


def build_calendar(crop_key, planting_date):
    crop = CROPS[crop_key]

    def day_to_date(n):
        return planting_date + dt.timedelta(days=n)

    stages = [
        {"name": s["name"],
         "start_date": day_to_date(s["start"]),
         "end_date": day_to_date(s["end"])}
        for s in crop["stages"]
    ]
    tasks = [
        {"label": t["label"], "date": day_to_date(t["day"]), "day": t["day"]}
        for t in crop["tasks"]
    ]
    return {
        "crop": crop["display_name"],
        "planting_date": planting_date,
        "harvest_date": day_to_date(crop["days_to_harvest"]),
        "stages": stages,
        "tasks": tasks,
    }


def get_status(crop_key, planting_date, on_date=None):
    crop = CROPS[crop_key]
    if on_date is None:
        on_date = dt.date.today()

    day_n = (on_date - planting_date).days
    total = crop["days_to_harvest"]

    current_stage = None
    for s in crop["stages"]:
        if s["start"] <= day_n <= s["end"]:
            current_stage = s["name"]
            break
    if day_n < 0:
        current_stage = "Belum ditanam"
    elif current_stage is None:
        current_stage = "Selesai / panen lanjutan"

    next_task = None
    for t in sorted(crop["tasks"], key=lambda x: x["day"]):
        if t["day"] >= day_n:
            task_date = planting_date + dt.timedelta(days=t["day"])
            next_task = {"label": t["label"], "date": task_date,
                         "days_until": (task_date - on_date).days}
            break

    return {
        "crop": crop["display_name"],
        "day_n": day_n,
        "total_days": total,
        "progress_pct": max(0, min(100, round(day_n / total * 100))),
        "current_stage": current_stage,
        "days_to_harvest": total - day_n,
        "next_task": next_task,
    }
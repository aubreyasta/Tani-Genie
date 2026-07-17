"""
tasks.py — the task database for a planting.

Two kinds of tasks live together in one store:

  * FIXED tasks  — generated from the crop knowledge base (plant -> yield),
                   one per entry in CROPS[crop]["tasks"], with real due dates.
  * RISK tasks   — injected by the EARLY-WARNING SYSTEM when it detects a
                   risk (too dry, disease, etc). Capped at ONE open task per
                   risk type per planting, per the project brief.

The early-warning system integrates through ONE function: add_risk_task().
Everything is plain dict records (a "row"), so this maps cleanly onto a real
DB table (e.g. Prisma `Task`) later — id, plantingId, category, origin,
dueDate, status, ...
"""

import datetime as dt
import uuid

from .crops import CROPS


# What the early-warning system can raise, and the default task it becomes.
# The caller may override `label` (e.g. with a Gemini-Flash-generated line).
RISK_ACTIONS = {
    "too_dry":      {"label": "Tanah kering — tambah penyiraman",         "category": "irrigation",   "priority": "high"},
    "too_wet":      {"label": "Tanah tergenang — perbaiki drainase",      "category": "irrigation",   "priority": "high"},
    "disease_risk": {"label": "Risiko penyakit — semprot preventif",      "category": "pest_control", "priority": "high"},
    "pest_risk":    {"label": "Risiko hama — scout & kendalikan",         "category": "pest_control", "priority": "high"},
    "heat_stress":  {"label": "Cuaca panas — jaga kelembapan tanaman",    "category": "irrigation",   "priority": "normal"},
}


def _new_id():
    return uuid.uuid4().hex[:12]


def _stage_for_day(crop_key, day_n):
    """Which stage a given day-offset falls in (for tagging tasks)."""
    for s in CROPS[crop_key]["stages"]:
        if s["start"] <= day_n <= s["end"]:
            return s["name"]
    return "—"


def generate_tasks(planting_id, crop_key, planting_date):
    """
    Build the FIXED task list for a planting: one record per knowledge-base
    task, with a real due date and its stage. Returns a list of task dicts.
    """
    rows = []
    for t in CROPS[crop_key]["tasks"]:
        due = planting_date + dt.timedelta(days=t["day"])
        rows.append({
            "id": _new_id(),
            "planting_id": planting_id,
            "crop": crop_key,
            "label": t["label"],
            "category": t["category"],
            "stage": _stage_for_day(crop_key, t["day"]),
            "origin": "fixed",
            "risk_type": None,
            "due_date": due,
            "status": "pending",           # pending | done | skipped
            "priority": "normal",
        })
    return rows


class TaskStore:
    """
    Minimal in-memory task DB keyed by planting_id.
    Swap for a real table later; the record shape is already DB-ready.
    """

    def __init__(self):
        self._by_planting = {}

    # ---- creation ----
    def create_planting(self, planting_id, crop_key, planting_date):
        self._by_planting[planting_id] = generate_tasks(planting_id, crop_key, planting_date)
        return self._by_planting[planting_id]

    # ---- the EARLY-WARNING hook -------------------------------------- #
    def add_risk_task(self, planting_id, crop_key, risk_type,
                      on_date=None, label=None):
        """
        Called by the early-warning system. Adds ONE task for a detected risk.
        Enforces "one open task per risk type" — if an unfinished task for the
        same risk already exists, it is NOT duplicated (returns it instead).

        risk_type : a key in RISK_ACTIONS (or any string; falls back to generic)
        label     : optional override (e.g. the Gemini-Flash one-liner)
        """
        on_date = on_date or dt.date.today()
        tasks = self._by_planting.setdefault(planting_id, [])

        # cap: don't stack the same risk
        for t in tasks:
            if (t["origin"] == "early_warning" and t["risk_type"] == risk_type
                    and t["status"] == "pending"):
                return t   # already flagged; keep it to one

        spec = RISK_ACTIONS.get(risk_type,
                                {"label": f"Tindakan untuk: {risk_type}",
                                 "category": "pest_control", "priority": "high"})
        row = {
            "id": _new_id(),
            "planting_id": planting_id,
            "crop": crop_key,
            "label": label or spec["label"],
            "category": spec["category"],
            "stage": "—",
            "origin": "early_warning",
            "risk_type": risk_type,
            "due_date": on_date,           # act now
            "status": "pending",
            "priority": spec["priority"],
        }
        tasks.append(row)
        return row

    # ---- queries / updates ----
    def complete(self, planting_id, task_id):
        for t in self._by_planting.get(planting_id, []):
            if t["id"] == task_id:
                t["status"] = "done"
                return t
        return None

    def pending(self, planting_id):
        return [t for t in self._by_planting.get(planting_id, [])
                if t["status"] == "pending"]

    def all_pending(self):
        """Aggregate to-do list across every planting (the Kebunku home list)."""
        out = []
        for tasks in self._by_planting.values():
            out.extend(t for t in tasks if t["status"] == "pending")
        # high-priority first, then by due date
        return sorted(out, key=lambda t: (t["priority"] != "high", t["due_date"]))
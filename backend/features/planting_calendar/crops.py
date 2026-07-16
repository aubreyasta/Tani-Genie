"""
crops.py — the crop knowledge base.

This is the single source of truth for everything the feature needs about a
crop: its growth stages, dated tasks, GDD parameters, and the inputs used by
the cost calculator.

Citation tags [A#]/[B#]/[G#] map to SOURCES.md.

TWO honesty notes carried from research:
  * gdd_to_harvest values are CALIBRATED estimates, not field-measured.
  * cost `inputs` quantities are researched where possible, but the PRICES are
    ILLUSTRATIVE DEFAULTS (Rp) — replace with real / subsidized prices, and
    feed the live sell price from PIHPS for revenue.
"""

CROPS = {
    # ==================================================================== #
    "bawang_merah": {
        "display_name": "Bawang Merah",
        "day_zero": "tanam",
        "days_to_harvest": 60,
        "base_temp_c": 4,          # cool-season allium ~4 C [G2]
        "gdd_to_harvest": 1350,    # CALIBRATED estimate, not field-measured
        "stages": [
            {"name": "Tanam & tumbuh awal", "start": 0,  "end": 20},
            {"name": "Vegetatif",           "start": 21, "end": 35},
            {"name": "Pembentukan umbi",    "start": 36, "end": 50},
            {"name": "Pematangan & panen",  "start": 51, "end": 60},
        ],
        "tasks": [
            {"day": 0,  "label": "Tanam + pupuk dasar (NPK, SP-36, kompos, dolomit)"},
            {"day": 12, "label": "Pemupukan susulan I (Urea / ZA)"},          # 10-15 HST [A1][A3]
            {"day": 32, "label": "Pemupukan susulan II (Urea / ZA + KCl)"},   # 30-35 HST [A1]
            {"day": 50, "label": "Kurangi penyiraman jelang panen"},          # [A2]
            {"day": 58, "label": "Panen (70-80% daun rebah)"},                # 55-65 HST [A1][A2]
        ],
        # ---- cost inputs (per hectare) -------------------------------- #
        "cost": {
            "inputs": [
                # name, category, qty per ha, unit, default price/unit (Rp)
                {"name": "Bibit umbi",   "category": "bibit", "qty_per_ha": 1000, "unit": "kg", "price_per_unit": 35000},  # [A2]
                {"name": "Pupuk kandang","category": "pupuk", "qty_per_ha": 5000, "unit": "kg", "price_per_unit": 1000},   # [A2]
                {"name": "NPK",          "category": "pupuk", "qty_per_ha": 200,  "unit": "kg", "price_per_unit": 9000},   # [A2]
                {"name": "SP-36",        "category": "pupuk", "qty_per_ha": 150,  "unit": "kg", "price_per_unit": 5000},   # [A2]
                {"name": "Urea",         "category": "pupuk", "qty_per_ha": 150,  "unit": "kg", "price_per_unit": 6000},   # [A1]
                {"name": "ZA",           "category": "pupuk", "qty_per_ha": 300,  "unit": "kg", "price_per_unit": 5000},   # [A1]
                {"name": "KCl",          "category": "pupuk", "qty_per_ha": 150,  "unit": "kg", "price_per_unit": 12000},  # [A1]
                {"name": "Dolomit",      "category": "pupuk", "qty_per_ha": 1500, "unit": "kg", "price_per_unit": 1000},   # [A2]
            ],
            "labor_per_ha": 15000000,      # lump estimate (Rp/ha) — refine
            "yield_kg_per_ha": 10000,      # ~10 t/ha typical
        },
        "source": "fertilizer [A1][A3], budidaya/rates [A2], base temp [G2] — see SOURCES.md",
    },
    # ==================================================================== #
    "cabai_rawit": {
        "display_name": "Cabai Rawit",
        "day_zero": "semai",
        "days_to_harvest": 90,     # to FIRST harvest, then periodic
        "base_temp_c": 10,         # warm-season, pepper ~10 C [G2]
        "gdd_to_harvest": 1485,    # CALIBRATED estimate
        "stages": [
            {"name": "Semai",              "start": 0,  "end": 21},
            {"name": "Vegetatif",          "start": 22, "end": 45},
            {"name": "Berbunga & berbuah", "start": 46, "end": 89},
            {"name": "Panen berkala",      "start": 90, "end": 150},
        ],
        "tasks": [
            {"day": 0,  "label": "Semai benih di tray"},
            {"day": 21, "label": "Pindah tanam + pupuk dasar (NPK 16-16-16)"},  # ~21 d nursery [B1][B2]
            {"day": 35, "label": "Pupuk susulan I (kocor, interval 2 minggu)"}, # from 14 HST [B1]
            {"day": 49, "label": "Pupuk susulan II; pasang ajir / mulsa"},
            {"day": 63, "label": "Geser ke pupuk tinggi P-K jelang berbunga"},  # [B3][B4]
            {"day": 90, "label": "Mulai panen berkala (tiap 3-7 hari)"},        # [B1][B2][B3]
        ],
        "cost": {
            "inputs": [
                {"name": "Bibit / benih", "category": "bibit", "qty_per_ha": 18000, "unit": "batang", "price_per_unit": 300},   # ~18k plants/ha [B1]
                {"name": "Pupuk kandang", "category": "pupuk", "qty_per_ha": 10000, "unit": "kg", "price_per_unit": 1000},
                {"name": "NPK dasar",     "category": "pupuk", "qty_per_ha": 700,   "unit": "kg", "price_per_unit": 9000},       # 700 kg/ha [B1]
                {"name": "NPK susulan",   "category": "pupuk", "qty_per_ha": 300,   "unit": "kg", "price_per_unit": 9000},       # [B4]
                {"name": "Mulsa plastik", "category": "lain",  "qty_per_ha": 1,     "unit": "paket", "price_per_unit": 4000000},
                {"name": "Ajir bambu",    "category": "lain",  "qty_per_ha": 1,     "unit": "paket", "price_per_unit": 3000000},
            ],
            "labor_per_ha": 25000000,      # long season + repeated harvest
            "yield_kg_per_ha": 8000,
        },
        "source": "susulan/harvest [B1], budidaya [B2], harvest window [B3], fert-by-phase [B4], base temp [G2] — see SOURCES.md",
    },
    # ==================================================================== #
    "padi": {
        "display_name": "Padi",
        "day_zero": "tanam",
        "days_to_harvest": 115,
        "base_temp_c": 10,         # rice 10-12 C [G1][G2]
        "gdd_to_harvest": 1900,    # CALIBRATED estimate
        "stages": [
            {"name": "Vegetatif",   "start": 0,   "end": 60},
            {"name": "Reproduktif", "start": 61,  "end": 95},
            {"name": "Pematangan",  "start": 96,  "end": 115},
        ],
        "tasks": [
            {"day": 0,   "label": "Tanam / tabur + pupuk dasar"},
            {"day": 21,  "label": "Pemupukan I (Urea + NPK)"},
            {"day": 42,  "label": "Pemupukan II (Urea)"},
            {"day": 60,  "label": "Pemupukan III jelang primordia"},
            {"day": 112, "label": "Panen (butir menguning ~90%)"},
        ],
        "cost": {
            "inputs": [
                {"name": "Benih",        "category": "bibit", "qty_per_ha": 25,  "unit": "kg", "price_per_unit": 12000},
                {"name": "Urea",         "category": "pupuk", "qty_per_ha": 200, "unit": "kg", "price_per_unit": 6000},
                {"name": "NPK",          "category": "pupuk", "qty_per_ha": 300, "unit": "kg", "price_per_unit": 9000},
            ],
            "labor_per_ha": 8000000,
            "yield_kg_per_ha": 5500,
        },
        "source": "base temp [G1][G2]; STAGE DURATIONS & costs are general reference — VERIFY",
    },
    # ==================================================================== #
    "jagung": {
        "display_name": "Jagung",
        "day_zero": "tanam",
        "days_to_harvest": 100,
        "base_temp_c": 10,         # maize 10 C [G1][G3][G4]
        "gdd_to_harvest": 1500,    # CALIBRATED estimate
        "stages": [
            {"name": "Vegetatif",      "start": 0,  "end": 45},
            {"name": "Berbunga",       "start": 46, "end": 65},
            {"name": "Pengisian biji", "start": 66, "end": 95},
            {"name": "Matang & panen", "start": 96, "end": 100},
        ],
        "tasks": [
            {"day": 0,  "label": "Tanam + pupuk dasar"},
            {"day": 15, "label": "Pemupukan I (Urea + NPK)"},
            {"day": 35, "label": "Pemupukan II (Urea) + pembumbunan"},
            {"day": 95, "label": "Panen (klobot kering, biji keras)"},
        ],
        "cost": {
            "inputs": [
                {"name": "Benih",  "category": "bibit", "qty_per_ha": 20,  "unit": "kg", "price_per_unit": 90000},
                {"name": "Urea",   "category": "pupuk", "qty_per_ha": 300, "unit": "kg", "price_per_unit": 6000},
                {"name": "NPK",    "category": "pupuk", "qty_per_ha": 300, "unit": "kg", "price_per_unit": 9000},
            ],
            "labor_per_ha": 7000000,
            "yield_kg_per_ha": 7000,
        },
        "source": "base temp [G1][G3][G4]; STAGE DURATIONS & costs are general reference — VERIFY",
    },
}


def list_crops():
    """Return the crop keys and their display names."""
    return {k: v["display_name"] for k, v in CROPS.items()}
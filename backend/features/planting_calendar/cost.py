"""
crops.py — the crop knowledge base (5 crops).

Single source of truth for stages, the FIXED task list (plant -> yield),
GDD parameters, and cost inputs.

Each task carries:
    day      : days after day_zero (see per-crop "day_zero")
    label    : what the farmer does
    category : task type -> lets the early-warning system slot its own
               tasks alongside the fixed ones (planting / fertilizing /
               irrigation / harvest ...)

Citation tags ([R#]/[GAR#]/[CHI#]/[A#]/[B#]/[G#]) resolve in TASK_LISTS.md,
which lists the peer-reviewed sources. Stage day-ranges are calibrated to
lowland/upland Indonesia; verify per variety before deployment.

Honesty: `gdd_to_harvest` are CALIBRATED estimates (not field-measured);
cost prices/yields are ILLUSTRATIVE defaults.
"""

CROPS = {
    # ==================================================================== #
    "padi": {
        "display_name": "Padi",
        "day_zero": "tanam",                # transplanting
        "days_to_harvest": 115,
        "base_temp_c": 10,                  # rice 10-12 C [G1]
        "gdd_to_harvest": 1950,             # calibrated estimate
        "stages": [                         # IRRI 3-phase model [R1][R2]
            {"name": "Vegetatif",   "start": 0,   "end": 55},   # germ. -> panicle init.
            {"name": "Reproduktif", "start": 56,  "end": 90},   # ~35 d in tropics [R1]
            {"name": "Pematangan",  "start": 91,  "end": 115},  # ~30 d incl. dry-down [R1]
        ],
        "tasks": [
            {"day": 0,   "label": "Tanam bibit + pupuk dasar",          "category": "planting"},
            {"day": 14,  "label": "Penyiangan I + pemupukan I (Urea+NPK)", "category": "fertilizing"},
            {"day": 30,  "label": "Pemupukan II (Urea)",                "category": "fertilizing"},
            {"day": 45,  "label": "Pemupukan III jelang primordia",     "category": "fertilizing"},   # [R1]
            {"day": 55,  "label": "Jaga genangan air jelang bunting",   "category": "irrigation"},
            {"day": 108, "label": "Keringkan sawah jelang panen",       "category": "irrigation"},
            {"day": 113, "label": "Panen (butir menguning ~85-90%)",    "category": "harvest"},
        ],
        "cost": {
            "inputs": [
                {"name": "Benih", "category": "bibit", "qty_per_ha": 25,  "unit": "kg", "price_per_unit": 12000},
                {"name": "Urea",  "category": "pupuk", "qty_per_ha": 200, "unit": "kg", "price_per_unit": 6000},
                {"name": "NPK",   "category": "pupuk", "qty_per_ha": 300, "unit": "kg", "price_per_unit": 9000},
            ],
            "labor_per_ha": 8000000, "yield_kg_per_ha": 5500,
        },
        "source": "stages IRRI 3-phase [R1][R2]; base temp [G1]",
    },
    # ==================================================================== #
    "bawang_merah": {
        "display_name": "Bawang Merah",
        "day_zero": "tanam",                # bulb planting
        "days_to_harvest": 60,
        "base_temp_c": 4,                   # cool-season allium ~4 C [G2]
        "gdd_to_harvest": 1350,
        "stages": [
            {"name": "Tumbuh awal",        "start": 0,  "end": 20},
            {"name": "Vegetatif",          "start": 21, "end": 35},
            {"name": "Pembentukan umbi",   "start": 36, "end": 50},
            {"name": "Pematangan & panen", "start": 51, "end": 60},
        ],
        "tasks": [
            {"day": 0,  "label": "Tanam umbi + pupuk dasar (NPK, SP-36, kompos)", "category": "planting"},
            {"day": 12, "label": "Pemupukan susulan I (Urea / ZA)",              "category": "fertilizing"},  # 10-15 HST [A1]
            {"day": 32, "label": "Pemupukan susulan II (Urea / ZA + KCl)",       "category": "fertilizing"},  # 30-35 HST [A1]
            {"day": 50, "label": "Kurangi penyiraman jelang panen",             "category": "irrigation"},   # [A2]
            {"day": 58, "label": "Panen (70-80% daun rebah)",                   "category": "harvest"},      # 55-65 HST [A1][A2]
        ],
        "cost": {
            "inputs": [
                {"name": "Bibit umbi",    "category": "bibit", "qty_per_ha": 1000, "unit": "kg", "price_per_unit": 35000},
                {"name": "Pupuk kandang", "category": "pupuk", "qty_per_ha": 5000, "unit": "kg", "price_per_unit": 1000},
                {"name": "NPK",           "category": "pupuk", "qty_per_ha": 200,  "unit": "kg", "price_per_unit": 9000},
                {"name": "Urea",          "category": "pupuk", "qty_per_ha": 150,  "unit": "kg", "price_per_unit": 6000},
                {"name": "KCl",           "category": "pupuk", "qty_per_ha": 150,  "unit": "kg", "price_per_unit": 12000},
            ],
            "labor_per_ha": 15000000, "yield_kg_per_ha": 10000,
        },
        "source": "fertilizer [A1], budidaya/watering [A2]; base temp [G2]",
    },
    # ==================================================================== #
    "bawang_putih": {
        "display_name": "Bawang Putih",
        "day_zero": "tanam",                # clove planting
        "days_to_harvest": 110,             # highland Indonesia ~100-120
        "base_temp_c": 4,                   # cool-season allium ~4 C [G2]
        "gdd_to_harvest": 1850,
        "stages": [                         # BBCH principal stages [GAR1]
            {"name": "Tumbuh & perakaran", "start": 0,   "end": 20},   # sprouting/emergence
            {"name": "Perkembangan daun",  "start": 21,  "end": 55},   # leaf development
            {"name": "Inisiasi umbi",      "start": 56,  "end": 80},   # bulb initiation
            {"name": "Pembesaran umbi",    "start": 81,  "end": 100},  # bulbing
            {"name": "Pematangan & panen", "start": 101, "end": 110},  # maturity
        ],
        "tasks": [
            {"day": 0,   "label": "Tanam siung + pupuk dasar",                  "category": "planting"},
            {"day": 20,  "label": "Pemupukan susulan I (N tinggi)",             "category": "fertilizing"},
            {"day": 45,  "label": "Pemupukan susulan II",                       "category": "fertilizing"},
            {"day": 70,  "label": "Geser ke pupuk P-K jelang pembesaran umbi",  "category": "fertilizing"},  # reduce N, raise P/K [GAR1]
            {"day": 95,  "label": "Hentikan penyiraman saat daun menguning",    "category": "irrigation"},
            {"day": 105, "label": "Panen (daun menguning / rebah)",             "category": "harvest"},
        ],
        "cost": {
            "inputs": [
                {"name": "Bibit siung",   "category": "bibit", "qty_per_ha": 500,  "unit": "kg", "price_per_unit": 30000},
                {"name": "Pupuk kandang", "category": "pupuk", "qty_per_ha": 10000,"unit": "kg", "price_per_unit": 1000},
                {"name": "NPK",           "category": "pupuk", "qty_per_ha": 300,  "unit": "kg", "price_per_unit": 9000},
            ],
            "labor_per_ha": 18000000, "yield_kg_per_ha": 9000,
        },
        "source": "BBCH garlic phenology [GAR1]; base temp [G2]",
    },
    # ==================================================================== #
    "cabai_rawit": {
        "display_name": "Cabai Rawit",
        "day_zero": "semai",                # sowing in nursery
        "days_to_harvest": 90,              # to FIRST harvest, then periodic
        "base_temp_c": 10,                  # warm-season, pepper ~10 C [G2]
        "gdd_to_harvest": 1485,
        "stages": [                         # WOFOST-Chili stages [CHI2]
            {"name": "Semai",              "start": 0,  "end": 21},
            {"name": "Vegetatif",          "start": 22, "end": 45},
            {"name": "Berbunga & berbuah", "start": 46, "end": 89},
            {"name": "Panen berkala",      "start": 90, "end": 150},
        ],
        "tasks": [
            {"day": 0,  "label": "Semai benih di tray",                        "category": "planting"},
            {"day": 21, "label": "Pindah tanam + pupuk dasar (NPK 16-16-16)",  "category": "planting"},     # ~21 d nursery [B1]
            {"day": 35, "label": "Pupuk susulan I (kocor, tiap 2 minggu)",     "category": "fertilizing"},  # from 14 HST [B1]
            {"day": 49, "label": "Pasang ajir / mulsa; pupuk susulan II",      "category": "fertilizing"},
            {"day": 63, "label": "Geser ke pupuk tinggi P-K jelang berbunga",  "category": "fertilizing"},  # [B3]
            {"day": 90, "label": "Mulai panen berkala (tiap 3-7 hari)",        "category": "harvest"},      # [B1][B2]
        ],
        "cost": {
            "inputs": [
                {"name": "Bibit / benih", "category": "bibit", "qty_per_ha": 18000, "unit": "batang", "price_per_unit": 300},
                {"name": "NPK dasar",     "category": "pupuk", "qty_per_ha": 700,   "unit": "kg", "price_per_unit": 9000},
                {"name": "Mulsa + ajir",  "category": "lain",  "qty_per_ha": 1,     "unit": "paket", "price_per_unit": 7000000},
            ],
            "labor_per_ha": 25000000, "yield_kg_per_ha": 8000,
        },
        "source": "susulan/harvest [B1][B2], P-K phase [B3]; BBCH/WOFOST stages [CHI1][CHI2]; base temp [G2]",
    },
    # ==================================================================== #
    "cabai_merah": {
        "display_name": "Cabai Merah",
        "day_zero": "semai",
        "days_to_harvest": 100,             # C. annuum, slightly longer than rawit
        "base_temp_c": 10,                  # warm-season, pepper ~10 C [G2]
        "gdd_to_harvest": 1650,
        "stages": [                         # WOFOST-Chili: transplant->anthesis->fruiting [CHI2]
            {"name": "Semai",            "start": 0,  "end": 28},
            {"name": "Vegetatif",        "start": 29, "end": 55},
            {"name": "Berbunga (anthesis)", "start": 56, "end": 75},
            {"name": "Berbuah & panen",  "start": 76, "end": 120},
        ],
        "tasks": [
            {"day": 0,  "label": "Semai benih di tray",                        "category": "planting"},
            {"day": 28, "label": "Pindah tanam + pupuk dasar + mulsa",         "category": "planting"},     # ~4-wk nursery [CHI1]
            {"day": 42, "label": "Pupuk susulan I (kocor)",                    "category": "fertilizing"},
            {"day": 56, "label": "Pasang ajir; pupuk susulan II",             "category": "fertilizing"},
            {"day": 70, "label": "Geser ke pupuk P-K jelang berbunga",         "category": "fertilizing"},
            {"day": 95, "label": "Mulai panen (buah merah)",                   "category": "harvest"},
        ],
        "cost": {
            "inputs": [
                {"name": "Bibit / benih", "category": "bibit", "qty_per_ha": 16000, "unit": "batang", "price_per_unit": 350},
                {"name": "NPK dasar",     "category": "pupuk", "qty_per_ha": 800,   "unit": "kg", "price_per_unit": 9000},
                {"name": "Mulsa + ajir",  "category": "lain",  "qty_per_ha": 1,     "unit": "paket", "price_per_unit": 8000000},
            ],
            "labor_per_ha": 27000000, "yield_kg_per_ha": 10000,
        },
        "source": "BBCH chilli keys [CHI1]; WOFOST-Chili stages [CHI2]; base temp [G2]",
    },
}


def list_crops():
    return {k: v["display_name"] for k, v in CROPS.items()}
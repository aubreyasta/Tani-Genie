"""
cost.py — input-cost & profit calculator.

Uses each crop's `cost` block (inputs per hectare, labor, expected yield),
scales it to the farmer's plot size, and — if a sell price is given — estimates
revenue and profit.

Price handling:
  * Input prices default to the (illustrative) values in crops.py.
  * Pass `price_overrides={"Urea": 2250, ...}` to use real / subsidized prices.
  * Pass `sell_price_per_kg` (e.g. from PIHPS) to get revenue and profit.
"""

from .crops import CROPS


def estimate_cost(crop_key, plot_ha, price_overrides=None, sell_price_per_kg=None):
    """
    Returns a breakdown dict. All money values are in Rupiah.
    """
    cost = CROPS[crop_key]["cost"]
    price_overrides = price_overrides or {}

    # --- itemised inputs, scaled to plot size ---
    items = []
    by_category = {}
    for inp in cost["inputs"]:
        qty = inp["qty_per_ha"] * plot_ha
        price = price_overrides.get(inp["name"], inp["price_per_unit"])
        subtotal = qty * price
        items.append({
            "name": inp["name"],
            "category": inp["category"],
            "qty": round(qty, 2),
            "unit": inp["unit"],
            "price_per_unit": price,
            "subtotal": round(subtotal),
        })
        by_category[inp["category"]] = by_category.get(inp["category"], 0) + subtotal

    materials = sum(by_category.values())
    labor = cost["labor_per_ha"] * plot_ha
    total_modal = materials + labor

    result = {
        "crop": CROPS[crop_key]["display_name"],
        "plot_ha": plot_ha,
        "items": items,
        "by_category": {k: round(v) for k, v in by_category.items()},
        "labor": round(labor),
        "total_modal": round(total_modal),
        "expected_yield_kg": round(cost["yield_kg_per_ha"] * plot_ha),
    }

    # --- revenue & profit, only if we know the sell price ---
    if sell_price_per_kg is not None:
        revenue = result["expected_yield_kg"] * sell_price_per_kg
        result["sell_price_per_kg"] = sell_price_per_kg
        result["revenue"] = round(revenue)
        result["profit"] = round(revenue - total_modal)
        result["margin_pct"] = (round((revenue - total_modal) / revenue * 100)
                                if revenue else None)

    return result


def rupiah(n):
    """Format an integer as Rp1.234.567 (Indonesian thousands separator)."""
    return "Rp" + f"{int(round(n)):,}".replace(",", ".")
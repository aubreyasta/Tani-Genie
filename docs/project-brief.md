# Tanigata — Project Brief

*An all-in-one climate & price companion for Indonesian smallholder farmers.*

> **Working name:** Tanigata (from *tani*, "farming"). This document is the group's main reference — problem, solution, architecture, data, and scope in one place.

---

## 1. The problem

Indonesian smallholder farmers absorb two kinds of volatility they can't see coming:

- **Climate volatility** — erratic rainfall, shifting wet/dry seasons, heat, and weather-driven pest and disease outbreaks that can wipe out a season.
- **Price volatility** — commodity prices (chili, shallots, rice) swing sharply, and farmers, dependent on middlemen (*tengkulak*) and lacking forward visibility, routinely sell at the wrong time for the wrong price.

The information that could help already exists — government weather data, national price panels, soil maps — but it's scattered, raw, and not translated into decisions a farmer can act on. There is no single place that turns "here is the data" into "here is what to do this week for *your* crop."

## 2. What we're building

A mobile-first platform that ingests climate, soil, and price data, runs it through a shared analytics engine, and delivers **plain-language decisions** tailored to each farmer's specific crops. Not a weather app and not a price ticker — a decision companion.

The **crop catalog is the spine**: a farmer logs their crops once (species, seeds planted, target yield, plot size, location), and every feature then adapts to those crops automatically. The *same* weather or price data produces *different* guidance for shallots vs. chili, because each crop carries its own thresholds.

## 3. Core features

**Crop catalog ("My Farm" / Kebunku).** The home base. Farmers log and manage their plots; this drives the tailoring across everything else.

**1 · Weather + pest early warning.** Beyond forecasts: proactive, crop-specific insights — when to irrigate (from a rainfall-minus-crop-water-need balance), disease and pest risk windows (from humidity/temperature models), the best spray window, and a harvest countdown from accumulated heat (growing degree days).

**2 · Price forecasting.** Current producer-level prices pulled from national panels, plus an 8-week forecast with an honest confidence band that visibly widens after week 4, and a recommended *best sell window* marked on the chart.

**3 · Planting calendar + input cost.** A stage-by-stage timeline with the next action to take, combined with a cost calculator that estimates input cost (*modal*) vs. projected revenue and profit, scaled to the farmer's plot size and current prices.

Suggested **MVP wedge:** crop catalog + weather/pest alerts + price forecasting + a notification engine. These are the features people check *daily*; they earn the right to introduce the rest.

## 4. How it works (architecture)

The flow is four layers — see **`tanigata-dataflow.svg`** for the full diagram.

1. **Sources** — climate/weather, land/soil, prices, and farmer-logged catalog data.
2. **Engine** — an ingestion + offline-cache layer; an analytics layer computing agronomic statistics, time-series forecasts, and land suitability; and a **tailoring layer** that applies each crop's thresholds from the catalog.
3. **Features** — the three dashboards plus the catalog, each rendered from the tailored output.
4. **Delivery** — in-app dashboard, WhatsApp bot, SMS/USSD, and an extension-officer view.

A key loop: the farmer's catalog both feeds the engine *and* is what the tailoring layer reads, so logging a new crop instantly reshapes every feature.

## 5. Data sources

| Source | Provides | Feeds |
|---|---|---|
| **BMKG** (village forecast API, free) | 3-day forecast per village: temp, rainfall, humidity, wind, cloud cover | Weather + pest |
| **NASA POWER** | Solar radiation & inputs for evapotranspiration (ET) | Weather + pest (irrigation) |
| **CHIRPS** | Satellite rainfall estimates (fills station gaps) | Weather + pest |
| **SMAP / ERA5-Land** | Soil moisture | Weather + pest (irrigation) |
| **Sentinel-2** | NDVI crop-vigor imagery (larger plots) | Weather + pest (monitoring) |
| **SoilGrids / IndoSoilFis** | Soil pH, texture, organic carbon, nutrients by location | Suitability, calendar |
| **PIHPS** (Bank Indonesia) | Strategic food prices | Price forecasting |
| **Panel Harga Pangan** (Bapanas) | Prices at producer / wholesale / retail levels | Price forecasting |
| **Farmer crop catalog** | Species, seeds, target yield, plot size, location | Tailoring (all features) |

**Attribution note:** BMKG requires visible credit as the data source anywhere its data appears — build that into the UI. PIHPS/Panel Harga have no heavily documented public API, so plan for responsible scraping or reverse-engineered endpoints and check terms first.

**For crop-suitability matching**, each crop needs a requirements profile: optimal/tolerable pH range, salinity tolerance, water needs, growing-season length, temperature/altitude range, and typical yield — matched against soil/climate values pulled by location (with optional farmer correction of pH/salinity from a test kit).

## 6. Design & accessibility principles

- **Verdict-first.** Every screen opens with one plain-language decision + a status color (green/amber/red) + a one-line reason. Charts and numbers live one layer deeper.
- **Built for the phone people actually have.** Small cheap Android, patchy/expensive data → big touch targets, icon- and color-led design, and an **offline-first** approach (cache latest data, sync when reconnected). A Progressive Web App fits well.
- **Multiple channels, not one app.** WhatsApp is the primary interface in much of rural Indonesia; SMS/USSD covers basic phones and dead zones; the extension officer (*penyuluh*) acts as a human relay for non-users.
- **Local language + voice.** Bahasa Indonesia first, with voice output/input and regional languages on the roadmap for low-literacy and older users.
- **The five-second test:** could a farmer who reads slowly understand the main answer in under five seconds, in bright sunlight, on a cracked screen?

## 7. Technical approach

- **Weather insights** = derived statistics (GDD, ET0/ETc via FAO Penman-Monteith, water balance, humidity-driven disease indices, pest degree-days) rather than raw forecasts.
- **Forecasting** = time-series models for weather and price; the price model outputs an 8-week horizon with explicit uncertainty widening past ~4 weeks.
- **Suitability** = rule-based matching of location-derived soil/climate against per-crop requirement tables (FAO land-evaluation framework).
- **Pest diagnosis (later)** = photo-based computer-vision classifier; launch with weather-triggered rule-based alerts first.

## 8. Scope

**MVP:** crop catalog · weather + pest alerts · price forecasting · notifications · Bahasa UI + WhatsApp channel.

**Later:** input cost calculator polish · marketplace / buyer connection (to reduce middleman dependence) · financial resilience (crop insurance *AUTP*, credit *KUR*) · CV pest diagnosis · NDSI/NDVI satellite monitoring · voice & regional languages.

## 9. Risks & assumptions

- **Adoption, not accuracy, is the hard part.** Many well-built Indonesian agri-apps failed because they solved a data problem farmers didn't feel, or ignored trust and middleman dynamics. The daily-checked feature (prices/weather) is the wedge; the rest follows.
- **Data access** depends on informal price APIs staying available — build a caching/fallback layer.
- **Forecast honesty** matters for trust: over-promising precision, especially on price, erodes credibility fast. Show uncertainty plainly.

## 10. Team & next steps

*(Fill in.)*

- [ ] Roles & owners
- [ ] Lock MVP feature set and success metric
- [ ] Prototype the price-forecast model on real PIHPS/Panel Harga history
- [ ] Validate two crop requirement profiles (e.g. shallot, chili) end-to-end
- [ ] Field-test the verdict copy with 2–3 actual farmers

---

*Companion files: `tanigata-dataflow.svg` (architecture), `tanigata-mockup.html` (interactive UI prototype).*
# Knowledge Base Sources

References for the values in `tanigata_calendar/crops.py`. Tags `[A#]/[B#]/[G#]`
appear as inline comments next to the values they support. Accessed July 2026 —
archive copies of anything you rely on (government pages move).

## Tier 1 — Crop agronomy (stages, fertilizer timing, input quantities)

### Bawang merah
- **[A1] Kementan / Cybext** (via Kompas) — susulan I at 10–15 d, susulan II at 30–35 d.
  https://agri.kompas.com/read/2023/07/23/154030784/pedoman-pemupukan-bawang-merah-yang-efektif-dan-efisien
- **[A2] BBPP / BPPSDMP Pertanian** — watering phases, base fertilizer rates (NPK 200, SP-36 150, dolomit 1.5 t, kompos), pH 5.6–6.5.
  https://pustaka.bppsdmp.pertanian.go.id/info-literasi/info-teknologi-sukses-budi-daya-bawang-merah
- **[A3] Corteva** — temp 25–32 °C, humidity 50–70%, susulan timing (corroborates A1).
  https://www.corteva.com/id/berita/Cara-Budidaya-Bawang-Merah-Yuk-Simak-Tipsnya.html

### Cabai rawit
- **[B1] Universitas Mataram (eprints)** — ~21 d nursery; base fertilizer NPK 700 kg/ha; susulan from 14 HST at 2-wk intervals; first harvest 72 HST.
  https://eprints.unram.ac.id/41783/2/ARTIKEL%20ILMIAH-MARDIYANTI%20AULIAH-C1M019085.pdf
- **[B2] BBPP Lembang** — first harvest ~3 months after sowing; periodic every 3–7 d; plant lives ~2 yr.
  https://bbpplembang.bppsdmp.pertanian.go.id/publikasi-detail/1187
- **[B3] Liputan6** — flowering 40–50 HST; fruit 20–30 d later; first harvest 70–90 HST.
  https://www.liputan6.com/hot/read/6257140/kapan-waktu-panen-kebun-cabai-rawit-rumahan-berikut-tipsnya-agar-berbuah-lebat
- **[B4] Kumparan** — N-heavy in vegetative, shift to P–K at flowering/fruiting.
  https://kumparan.com/seputar-hobi/waktu-pemupukan-cabai-rawit-setelah-tanam-23pnO0y7Rw6

### Padi & jagung
Stage durations and cost inputs are **general reference values** (flagged "VERIFY"
in code). Only their GDD base temperatures are sourced (Tier 2).

## Tier 2 — GDD base temperatures (peer-reviewed)

- **[G1]** ScienceDirect review — maize Tbase 8–10 °C, rice 8–12 °C.
  https://www.sciencedirect.com/science/article/pii/S037837742500469X
- **[G2]** ScienceDirect review — cool-season vegetables 2–6 °C (shallot ~4), warm-season incl. pepper 10 °C.
  https://www.sciencedirect.com/science/article/pii/S037837742500472X
- **[G3]** Growing degree-day, Wikipedia — 5 °C cool / 10 °C warm convention.
  https://en.wikipedia.org/wiki/Growing_degree-day
- **[G4]** Extension (method, 30 °C cap): Penn State, Purdue, MRCC.
  https://extension.psu.edu/understanding-growing-degree-days

## Tier 3 — Estimated / illustrative (NOT sourced)

Be upfront about these in any writeup:
- **`gdd_to_harvest`** — calibrated (days × typical Indonesian daily heat), not field-measured.
- **Input `price_per_unit` and `labor_per_ha`** — illustrative Rp defaults. Replace with
  real / subsidized (Kartu Tani) prices.
- **`yield_kg_per_ha`** — typical figures; actual yield varies widely.
- **Padi & jagung** stage durations and inputs — general reference.

## Suggested citation (slides / report)

> Crop stage and fertilizer schedules are adapted from Indonesian Ministry of
> Agriculture (Kementan/Cybext) and BBPP extension guidance plus a Universitas
> Mataram field study; GDD base temperatures follow published FAO56-based reviews.
> Heat-unit targets, input prices, and yields are calibrated/illustrative estimates
> pending field and market validation.
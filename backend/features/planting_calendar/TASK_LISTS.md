# Fixed Task Lists (plant → yield)

The fixed task list for each of the five crops, grouped by growth stage, as
encoded in `tanigata_calendar/crops.py`. Day numbers are days after **day-zero**
(noted per crop). These are the *fixed* tasks; the early-warning system injects
additional risk tasks at runtime (see `tasks.py`).

> **Source tiering (be honest about this):**
> **Phenology / growth stages and GDD base temperatures are peer-reviewed** (BBCH
> scales, crop models, threshold reviews — tags `[GAR#]/[CHI#]/[R#]/[G#]`).
> **Local task *timing*** (fertilizer schedules, watering) is drawn from
> Indonesian **extension / government** guidance and one field study
> (`[A#]/[B#]`) — appropriate for local practice, but not all peer-reviewed.
> `gdd_to_harvest` values are calibrated estimates.

---

## Padi (Rice) — day-zero: transplanting · ~115 days
*Stages: IRRI three-phase model [R1][R2]; base temp [G1]*

- **Vegetatif (day 0–55)**
  - d0 · Tanam bibit + pupuk dasar *(planting)*
  - d14 · Penyiangan I + pemupukan I (Urea+NPK) *(fertilizing)*
  - d30 · Pemupukan II (Urea) *(fertilizing)*
  - d45 · Pemupukan III jelang primordia *(fertilizing)*
  - d55 · Jaga genangan air jelang bunting *(irrigation)*
- **Reproduktif (day 56–90)** — ~35 d in the tropics [R1]
- **Pematangan (day 91–115)** — ~30 d incl. dry-down [R1]
  - d108 · Keringkan sawah jelang panen *(irrigation)*
  - d113 · Panen (butir menguning ~85–90%) *(harvest)*

## Bawang Merah (Shallot) — day-zero: bulb planting · ~60 days
*Fertilizer timing [A1]; watering/pH [A2]; base temp allium ~4 °C [G2]*

- **Tumbuh awal (day 0–20)**
  - d0 · Tanam umbi + pupuk dasar (NPK, SP-36, kompos) *(planting)*
  - d12 · Pemupukan susulan I (Urea/ZA) — 10–15 HST [A1] *(fertilizing)*
- **Vegetatif (day 21–35)**
  - d32 · Pemupukan susulan II (Urea/ZA + KCl) — 30–35 HST [A1] *(fertilizing)*
- **Pembentukan umbi (day 36–50)**
  - d50 · Kurangi penyiraman jelang panen [A2] *(irrigation)*
- **Pematangan & panen (day 51–60)**
  - d58 · Panen (70–80% daun rebah) — 55–65 HST [A1][A2] *(harvest)*

## Bawang Putih (Garlic) — day-zero: clove planting · ~110 days
*Stages: BBCH garlic scale, Lopez-Bellido et al. 2016 [GAR1]; base temp [G2]*

- **Tumbuh & perakaran (day 0–20)**
  - d0 · Tanam siung + pupuk dasar *(planting)*
  - d20 · Pemupukan susulan I (N tinggi) *(fertilizing)*
- **Perkembangan daun (day 21–55)**
  - d45 · Pemupukan susulan II *(fertilizing)*
- **Inisiasi umbi (day 56–80)**
  - d70 · Geser ke pupuk P-K jelang pembesaran umbi — reduce N, raise P/K [GAR1] *(fertilizing)*
- **Pembesaran umbi (day 81–100)**
  - d95 · Hentikan penyiraman saat daun menguning *(irrigation)*
- **Pematangan & panen (day 101–110)**
  - d105 · Panen (daun menguning/rebah) *(harvest)*

## Cabai Rawit — day-zero: sowing (nursery) · ~90 days to first harvest
*Stages: BBCH chilli [CHI1] / WOFOST-Chili [CHI2]; timing [B1][B2][B3]; base temp [G2]*

- **Semai (day 0–21)**
  - d0 · Semai benih di tray *(planting)*
  - d21 · Pindah tanam + pupuk dasar (NPK 16-16-16) — ~21 d nursery [B1] *(planting)*
- **Vegetatif (day 22–45)**
  - d35 · Pupuk susulan I (kocor, tiap 2 minggu) — from 14 HST [B1] *(fertilizing)*
- **Berbunga & berbuah (day 46–89)**
  - d49 · Pasang ajir/mulsa; pupuk susulan II *(fertilizing)*
  - d63 · Geser ke pupuk tinggi P-K jelang berbunga [B3] *(fertilizing)*
- **Panen berkala (day 90–150)**
  - d90 · Mulai panen berkala (tiap 3–7 hari) [B1][B2] *(harvest)*

## Cabai Merah — day-zero: sowing (nursery) · ~100 days to first harvest
*Stages: BBCH chilli [CHI1] / WOFOST-Chili [CHI2]; base temp [G2]*

- **Semai (day 0–28)**
  - d0 · Semai benih di tray *(planting)*
  - d28 · Pindah tanam + pupuk dasar + mulsa — ~4-wk nursery [CHI1] *(planting)*
- **Vegetatif (day 29–55)**
  - d42 · Pupuk susulan I (kocor) *(fertilizing)*
- **Berbunga / anthesis (day 56–75)**
  - d56 · Pasang ajir; pupuk susulan II *(fertilizing)*
  - d70 · Geser ke pupuk P-K jelang berbunga *(fertilizing)*
- **Berbuah & panen (day 76–120)**
  - d95 · Mulai panen (buah merah) *(harvest)*

---

## Sources

### Peer-reviewed — phenology / growth stages
- **[R1]** IRRI, *Growth stages of the rice plant* (Rice Knowledge Bank) — three-phase model; tropical reproductive ≈35 d, ripening ≈30 d; vegetative varies by cultivar (IR64 ≈110 d).
- **[R2]** *Staging of Rice Plant Growth and Development*, Springer Nature (2024) — full-cycle 70–170 d; vegetative/reproductive/ripening definitions. https://link.springer.com/chapter/10.1007/978-981-97-5235-5_4
- **[GAR1]** Lopez-Bellido F.J. et al. (2016), *New phenological growth stages of garlic (Allium sativum)*, **Annals of Applied Biology** 169(3), BBCH scale. https://onlinelibrary.wiley.com/doi/10.1111/aab.12312
- **[CHI1]** Feldmann F. et al., *Phenological growth stages and BBCH-identification keys of Chilli (Capsicum annuum L., C. chinense Jacq., C. baccatum L.)* — BBCH keys for chilli.
- **[CHI2]** *Modelling growth of chili pepper (Capsicum annuum L.) with the WOFOST model*, **Agricultural Systems** (2023) — stages: transplanting → anthesis → early/mid/peak-fruiting. https://www.sciencedirect.com/science/article/pii/S0308521X23000938

### Peer-reviewed — GDD base temperatures
- **[G1]** Base/upper temperature thresholds review (FAO56rev), ScienceDirect — maize/rice Tbase. https://www.sciencedirect.com/science/article/pii/S037837742500469X
- **[G2]** Companion review, ScienceDirect — cool-season vegetables (allium ~4 °C), warm-season incl. pepper (10 °C). https://www.sciencedirect.com/science/article/pii/S037837742500472X

### Extension / government / field study — local task timing (not all peer-reviewed)
- **[A1]** Kementan / Cybext — bawang merah fertilizer schedule (susulan I 10–15 d, II 30–35 d). https://agri.kompas.com/read/2023/07/23/154030784/pedoman-pemupukan-bawang-merah-yang-efektif-dan-efisien
- **[A2]** BBPP / BPPSDMP Pertanian — bawang merah watering phases, base fertilizer, pH. https://pustaka.bppsdmp.pertanian.go.id/info-literasi/info-teknologi-sukses-budi-daya-bawang-merah
- **[B1]** Universitas Mataram (eprints) — cabai rawit field study: ~21 d nursery, susulan from 14 HST, first harvest 72 HST. https://eprints.unram.ac.id/41783/
- **[B2]** BBPP Lembang — cabai rawit: first harvest ~3 months after sowing, periodic 3–7 d. https://bbpplembang.bppsdmp.pertanian.go.id/publikasi-detail/1187
- **[B3]** Kumparan — cabai fertilizer by phase (N vegetative → P–K flowering). *(popular source; corroborates [B1])*

*Archive copies of government/extension pages — they move.*
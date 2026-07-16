# Tanigata — Comprehensive User Journey

*The full lifecycle: from first hearing about the app to becoming a farmer who checks it every morning and tells his neighbours.*

> Goes deeper than the at-a-glance journey map (`tanigata-user-journey.svg`) — this covers the whole adoption lifecycle, including the moments before and after the core-feature loop, with pain points and design opportunities at each phase. Pairs with the navigational logic in `tanigata-user-flow.svg`.

---

## Primary persona

**Pak Tarno** — 48, grows shallots (*bawang merah*, 0.5 ha) and chili (*cabai rawit*, 0.3 ha) in Brebes, Central Java. Inexpensive Android phone, rationed mobile data, reads slowly, sells through a local middleman (*tengkulak*). Lives in several WhatsApp groups. Skeptical of "apps" but trusts his neighbours and the local extension officer (*penyuluh*).

His deeper goal isn't "use software" — it's **a more predictable season and a fairer price.** Every phase below is measured against that.

---

## Journey at a glance

| Phase | Goal | Emotion | Main risk to us |
|---|---|---|---|
| 0 · Awareness | Understand what this even is | Skeptical | Dismissed as "another app" |
| 1 · Onboarding | Get set up without frustration | Cautious | Abandons at the form |
| 2 · First value | See something useful, fast | Surprised | No "aha" → never returns |
| 3 · Habit | Make checking a routine | Reassured | Forgets it exists |
| 4 · Peak value | Survive a real threat | Worried → relieved | Advice is wrong or too late |
| 5 · Payoff | Sell at a good price | Confident | Can't act on the insight |
| 6 · Season close | Plan the next cycle | In control | Loses momentum between seasons |
| 7 · Advocacy | Tell others / keep going | Loyal | Silent churn |

---

## Phase 0 — Awareness

**Goal:** figure out whether this is worth any of his attention.
**How it happens:** a *penyuluh* demos it at a farmer-group meeting; a neighbour forwards a WhatsApp message; a poster with a QR code at the *kios* (input shop).
**Thinking:** *"Is this another thing that wastes my data and my time?"*
**Emotion:** skeptical.
**Pain points:** app fatigue; distrust of digital tools; low bandwidth to even install.
**Design opportunities:**
- Lead with a **WhatsApp-first entry** — he can get value before installing anything. A single "reply with your village" message that returns today's weather + shallot price proves worth in one exchange.
- Recruit the *penyuluh* and existing groups as the distribution channel; trust transfers through people, not ads.
- Make the value proposition one sentence a neighbour can repeat: *"it tells you when to spray and when to sell."*

## Phase 1 — Onboarding & first crop log

**Goal:** get set up without feeling stupid or spending data.
**Does:** picks his village, logs his first crop (species, seeds, target yield, plot size).
**Touchpoint:** Kebunku (catalog) — or the same flow inside WhatsApp.
**Thinking:** *"How long is this going to take?"*
**Emotion:** cautious → curious.
**Pain points:** typing on a small keyboard; unfamiliar terms; forms that ask too much up front.
**Design opportunities:**
- **Almost no typing:** village from GPS or a searchable list; crop from a picture-led picker; numbers via steppers and sensible defaults.
- Ask for the *minimum* to produce value (one crop), defer the rest.
- End onboarding on an **immediate payoff** — the moment he saves a crop, the home screen already shows a real verdict for it, not an empty state.

## Phase 2 — First value (the "aha")

**Goal:** see one genuinely useful thing.
**Does:** reads the first tailored verdict — e.g. "siram sore ini" for shallots, or a chili price already climbing.
**Touchpoint:** Home + first notification.
**Thinking:** *"Oh — it actually knows about my crop."*
**Emotion:** mild surprise, the first spark of trust.
**Pain points:** if the first thing he sees is generic or obviously wrong, the app is dead on arrival.
**Design opportunities:**
- The **verdict-first** card must land here: a plain decision he'd have wanted anyway.
- Make the tailoring *visible* — name his crop back to him so it's clearly about *his* field, not a generic forecast.
- Time the first push notification for something real and near-term, so the first ping feels helpful rather than spammy.

## Phase 3 — Habit formation

**Goal:** fold a quick check into the daily routine.
**Does:** a morning glance — app or a scheduled WhatsApp message — sees "2 hal perlu perhatian."
**Touchpoint:** morning notification → Home.
**Thinking:** *"Anything I need to do today?"*
**Emotion:** reassured, oriented.
**Pain points:** notification fatigue; no signal in the field; forgetting the app between events.
**Design opportunities:**
- One **daily digest** at a farmer-friendly hour (early morning), not scattered pings.
- **Offline-first**, so the morning check works in the field with cached data.
- Every notification is glanceable and actionable — a decision, not a data dump. Guard against crying wolf; a wrong or noisy alert costs trust fast.

## Phase 4 — Peak value (a real threat)

**Goal:** protect the crop from something that could ruin the season.
**Does:** gets a high pest/disease alert for chili, reads the recommended action and the best spray window, acts.
**Touchpoint:** Cuaca + hama.
**Thinking:** *"Good thing it warned me — I'll spray this afternoon."*
**Emotion:** worried → relieved. **This is the emotional low that the product turns around — where it earns real loyalty.**
**Pain points:** advice that's too late, too vague, or not matched to his crop; recommending an input he can't afford or find.
**Design opportunities:**
- **One clear action per alert**, tailored to the exact crop and stage.
- Give the *why* briefly (weather conditions) so the advice is trustworthy, not a black box.
- Where possible, tie the action to what's locally available/affordable (link to the input-cost and, later, *kios* availability).

## Phase 5 — The payoff (selling well)

**Goal:** sell at a good price instead of dumping at the middleman's rate.
**Does:** sees chili prices peaking with an honest forecast, harvests in batches while high, holds shallots for a better window.
**Touchpoint:** Harga (+ buyer connection, later scope).
**Thinking:** *"I'll sell now while it's high, and wait on the shallots."*
**Emotion:** confident — the peak of the journey. **This is the payoff that converts a user into a daily one and an advocate.**
**Pain points:** knowing the right time but being *unable to act* — locked into a middleman, no storage, no buyer access.
**Design opportunities:**
- Make the sell recommendation concrete and honest (clear window + visible uncertainty).
- This is the strongest case for the **buyer/marketplace feature** on the roadmap — insight without the ability to act is frustrating.
- Let him **mark a sale** and, over time, show whether following the app beat his usual timing — proof that compounds trust.

## Phase 6 — Season close & planning

**Goal:** understand how the season went and plan the next one.
**Does:** reviews the cost calculator (modal vs. profit), plans the next planting, logs the next crop.
**Touchpoint:** Kalender + biaya → back into the catalog.
**Thinking:** *"Did I actually make money? What should I plant next?"*
**Emotion:** in control, forward-looking.
**Pain points:** the dangerous gap *between* seasons where engagement drops to zero and he forgets the app.
**Design opportunities:**
- A simple **season summary** ("you earned ≈ Rp X; you sold better than the district average") closes the loop and rewards the effort.
- Use the calendar to **stay present in the off-season** — planting-window reminders, suitability suggestions for the next crop — so the habit survives the gap.
- Feed profit outcomes back into future crop suggestions (suitability + economics together).

## Phase 7 — Retention & advocacy

**Goal:** keep going, and bring others.
**Does:** recommends it in his WhatsApp group; the *penyuluh* uses his result as a demo.
**Touchpoint:** WhatsApp, farmer group, *penyuluh* dashboard.
**Thinking:** *"This actually helped — my neighbour should use it."*
**Emotion:** loyal.
**Pain points:** **silent churn** — he just stops, and we never learn why.
**Design opportunities:**
- Make sharing effortless (forward a result/summary to a group).
- Give the **extension officer** a view that turns his success into a teaching example, feeding Phase 0 for the next farmer — the loop closes.
- Watch for the leading indicators of churn (missed daily checks, ignored alerts) and re-engage gently.

---

## Beyond the primary persona (edge cases to design for)

- **WhatsApp-only / low-literacy user:** never opens the app; must get the full core value — daily verdict, pest alert, price + sell timing — through chat and voice alone. The WhatsApp flow is not a teaser; it's a complete product surface.
- **Basic-phone / no-signal user:** reached via SMS/USSD for the essentials; the *penyuluh* relays richer detail in person.
- **The extension officer (penyuluh):** a power user with a fleet view — pulls insights for many farmers and relays them. Their dashboard is both a support tool and our best distribution channel.
- **Younger, more literate farmer:** wants the deeper charts and the cost model; give them the layered detail beneath the verdicts without making it the default.

## What success looks like across the journey

Not installs or session length. Success is the arc completing: he **forms a daily glance habit** (Phase 3), **acts on a real threat** (Phase 4), **sells better than before** (Phase 5), and **comes back next season** (Phase 6) — and ideally **brings someone with him** (Phase 7). The two make-or-break moments are the first "aha" (Phase 2) and the pest scare handled well (Phase 4); if those land, the rest follows.

---

*Companion files: `tanigata-user-flow.svg` (navigational flow), `tanigata-user-journey.svg` (visual journey map), `tanigata-uiux-brief.md` (UX brief), `tanigata-brief.md` (project brief), `tanigata-mockup.html` (prototype).*
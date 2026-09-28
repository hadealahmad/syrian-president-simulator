# Electricity grid: 2,250 MW

**Status: OUTDATED.** Correct for 2025, already superseded by the time the game
is set — and the demand figure is roughly double independent estimates.

## What the game says

```ts
gridCapacityMW:   2_250,   // "Operational power (demand: 8,500 MW)"
dailyPowerHours:  3.5,     // "Average daily electricity"
```

Grid CapEx converts to capacity at **+12 MW per $1M** (× competence-waste
factor). The comment's "8,500 MW unconstrained national demand" is inherited from
pre-war installed capacity.

## What the sources say

Syria's Ministry of Energy, via the IDOS research discussion paper (2026):

| Period | Generation |
| :--- | --- |
| ~1 year before 2025 | ~1,600 MW |
| **2025** | **~2,250 MW** |
| **April 2026** | **~3,000 MW** |
| Installed capacity if fuel were sufficient | up to 4,500 MW |
| **Independent expert estimate of demand** | **5,000–7,000 MW** |

Other findings:

- Generation rose from ~1,600 MW to ~2,250 MW within a year, helped by Qatari
  and then Jordanian gas via the Arab Gas Pipeline, and Azerbaijani gas via
  Türkiye (SOCAR).
- **More than 70% of power plants and transmission lines were damaged**, cutting
  national grid capacity by more than 75% (UNDP 2025).
- Electricity generation fell from **43 TWh (2010) to 16 TWh (2015)** (World
  Bank 2017).
- Nameplate installed capacity: **9,636 MW** (2023 est.); consumption 15.5 bn kWh.
- **Off-grid solar capacity exceeds 2,200 MW** — cross-validated local expert
  estimate, equivalent to **73% of aggregate centralised generating capacity** as
  of December 2025. Almost all of it is stand-alone, with wastage "reaching up
  to 40 per cent in some systems".
- Electricity access: 89% total, 100% urban, 75% rural (2022).
- Oil and gas revenue from recaptured fields is earmarked for energy,
  reconstruction and services.

## Verdict

**OUTDATED on capacity, and the demand figure is unsourced.**

- `gridCapacityMW: 2_250` is an **excellent** figure for 2025 — the game clearly
  used a real 2025 number. But generation reached **~3,000 MW by April 2026**, and
  the game is set in **2027**. The starting value is already low for its own
  setting year.
- The **8,500 MW "demand"** figure appears to be pre-war *installed capacity*,
  not current demand. Independent experts put current demand at **5,000–7,000
  MW**. This matters: the gap between supply and demand drives power hours, which
  feeds tax compliance, utility revenue, the `GRID` ending gate, and CapEx
  urgency. An overstated demand figure makes the grid look more catastrophic than
  it is.
- `dailyPowerHours: 3.5` is plausible against the 2–4 h/day rationing reported
  for 2023–2024, but no current hour-of-day figure was located.

## Newly verified additions

- **UNDP's 2026–2027 programme** targets rehabilitation of **~680 MW of power
  generation capacity**, upgrading **164 km** of electricity networks and
  installing **81 transformers** across multiple governorates.
- **A $7 billion, 5,000 MW private energy project** was agreed in a memorandum of
  understanding signed 29 May 2025 — four gas plants plus one solar plant, by
  Moataz Al-Khayyat (PIH / UCC Holding) with the Syrian government. 5,000 MW sits
  at the top of independent estimates of *total* national demand.
- **February 2026: the government regained control of key oil and gas areas,
  raising its share of national oil production from ~20% to 88%.** The 1,600 →
  2,250 → 3,000 MW recovery and the oil recapture are the same story.
- **June 2025: the World Bank approved its first project in Syria in nearly four
  decades — a $146M IDA grant** (Syria Emergency Electricity Project), after
  Saudi Arabia and Qatar cleared Syria's IDA arrears in May 2025 and restored
  funding eligibility after a 14-year suspension.

## Game impact

- **OUTDATED:** `gridCapacityMW`. Raising it toward ~3,000 for a 2027 start is a
  defensible, sourced change.
- **INCORRECT (likely):** the 8,500 MW demand figure. If real demand is
  5,000–7,000 MW, the deficit is smaller and the grid less hopeless than modelled.
- **MISSING FROM GAME: the off-grid solar boom.** This is the largest single gap
  in the energy model. **2,200+ MW of stand-alone solar — 73% of centralised
  capacity** — exists outside the national grid, mostly unwired, wasting up to
  40% of what it generates. In gameplay terms this is a ready-made tension:
  a huge distributed generation fleet that is *not* dispatchable, not taxable and
  not stabilising, and whose integration is politically and technically blocked.
  The game models only a central grid.
- **MISSING: fuel supply as the real constraint.** The Ministry notes 4,500 MW is
  achievable *if fuel were sufficient*, and the recovery of gas supply from Qatar,
  Jordan and Azerbaijan is what actually drove the 1,600→3,000 MW recovery. The
  game has no fuel-supply pipeline mechanic — the grid improves only via CapEx.
- **MISSING: recaptured oil and gas fields.** This is now quantified: the state
  went from ~20% to **88%** of national oil production in **February 2026**. No
  production mechanic exists at all.
- **MISSING: the $7B / 5,000 MW private project**, which is larger than the
  entire modelled grid and larger than any single strategic project. See
  [confiscated-assets-and-restitution.md](confiscated-assets-and-restitution.md).

## Sources

- IDOS Discussion Paper 6/2026, "Towards a transformative reconstruction of the
  electricity sector in Syria" — the primary source for all MW figures —
  <https://www.idos-research.de/fileadmin/user_upload/pdfs/publikationen/discussion_paper/2026/DP_6.2026.pdf>
- UN Common Country Analysis (Syria) — >70% of plants damaged; 89% access —
  <https://syria.un.org/sites/default/files/remote-resources/0ebedb4696282d412da50442b4a40915.pdf>
- World Factbook 2026: Syria, energy —
  <https://worldfactbooks.com/country/syria/>
- The National, 23 Feb 2026 (recaptured fields earmarked for energy) —
  <https://www.thenationalnews.com/news/mena/2026/02/23/syria-replaces-a-third-of-its-cash-in-weeks-after-introducing-new-currency/>

See also: [provincial-damage.md](provincial-damage.md),
[unmodelled-sectors.md](unmodelled-sectors.md)

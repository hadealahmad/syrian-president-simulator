# Population and displacement: 23.46 million

**Status: OUTDATED.** The figure was credible for its vintage; every current
estimate is roughly 2 million higher, and the displacement story has changed
character entirely.

## What the game says

Fourteen `population` fields in `BASELINE_GOVERNORATES`, totalling
**23,462,346**, with `hostPopulation`, `idpPopulation` and `returneePopulation`
broken out per governorate. The fact-check report claimed these "match the
official UNOCHA 2024–2025 HNO baseline dataset" exactly.

The game also models inter-provincial migration (`processInterProvincialMigration`)
and seeds a `migrationLedger` with four war-years corridors
(`raqqa>aleppo`, `deir_ez_zor>damascus`, `quneitra>damascus`, `quneitra>daraa`).

## What the sources say

| Source | Estimate | Date |
| :--- | --- | --- |
| UN Common Country Analysis | **24.4 million** | Aug 2025 |
| UNData | **25.62 million** | 2025 |
| World Bank / Factbook | **25.62 million** | 2025 |
| UN WPP 2024 (medium variant) | ~26.1 million | 2026 |
| **Game** | **23,462,346** | — |

**Returns are larger than previously recorded.** UNDP's 2025 annual report puts
the total at close to year end at **~3 million Syrians returned** — 1.2M returning
refugees and 1.9M internally displaced — against 6 million still displaced abroad
and 7.1M internally displaced as of Q1 2025. Between Dec 2024 and Aug 2025 alone,
~1.7M IDPs and ~844,000 refugees returned. UNDP estimates the support cost of
reintegration at **$12–24 billion** ($10,000–20,000 per family).

**A specific provincial flag:** the As-Suwayda governorate census (end-2023) gives
**~650,000** residents; the game uses **446,493**. Methodologies may differ, so
this is a flag rather than a settled correction — but Suwayda is well below.

**Displacement has reversed direction.** As of 2025:

- Over **1,000,000 refugees have returned** to Syria since December 2024.
- **1,900,000 IDP returns** recorded since December 2024.
- Total IDPs: **6,140,000** (Oct 2025), of whom 1,400,000 are in sites.
- **892,000** newly displaced during 2025 — the displacement crisis is ongoing,
  not resolving.
- 15,255 registered refugees/asylum seekers inside Syria; ~418,000 Palestine
  refugees.

## Verdict

**OUTDATED by roughly 2 million people (~8%).**

The 23.46M figure is not wrong so much as stale — it is consistent with a
2022-vintage baseline, which is what the May 2026 audit would have been reading.
But every current estimate puts Syria at **24.4–26.1 million**, and the game's
starting population is below all of them.

The far more interesting problem is directional. The game models **out-migration**
from restive provinces (flight from `RIOT`/`REVOLT`) and seeds a ledger of
**outflow** corridors. Reality as of 2025–2026 is dominated by **return
migration at scale** — 2.9 million people coming back — layered on top of an
ongoing displacement crisis. The game has no mechanic for people arriving.

## Game impact

- **OUTDATED:** every `population` field. Low direct mechanical impact —
  population feeds the migration flow rates and the century engine's social
  pillar, not the turn-by-turn economy.
- **MISSING FROM GAME: return migration.** ~2.9 million returnees since December
  2024 is one of the largest single demographic events in the country's modern
  history, and the game cannot represent it. Returnees would plausibly:
  - increase demand and food pressure in host governorates,
  - improve construction and agricultural labour capacity,
  - add to the political-capital strain of housing and services.
  This is a genuinely playable mechanic that is missing.
- **MISSING: ongoing displacement.** 892,000 newly displaced in 2025, 6.14M total
  IDPs. The game models unrest as a *consequence* of policy but not as a
  population-displacement driver.
- **NOTE:** Quneitra appears in two seeded outflow corridors, which is
  directionally consistent with 2025 Golan-related displacement.

## Sources

- UN Common Country Analysis (Syria) — population 24.4M, displacement, IDP/return
  figures, power capacity — <https://syria.un.org/sites/default/files/remote-resources/0ebedb4696282d412da50442b4a40915.pdf>
- UNData Syria — <https://data.un.org/en/iso/sy.html>
- World Bank Syria Macro-Fiscal Outlook (population/growth context) —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>
- World Factbook 2026: Syria — 25.62M, 2025 —
  <https://worldfactbooks.com/country/syria/>

See also: [unmodelled-sectors.md](unmodelled-sectors.md),
[outdated-electricity-grid.md](outdated-electricity-grid.md)

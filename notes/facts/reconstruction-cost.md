# Reconstruction cost: $216 billion

**Status: VERIFIED.** The game's headline reconstruction figure is correct and
the breakdown is exact.

## What the game says

The reconstruction deficit is not stored in code. `BASELINE_MACRO` has no
`reconstructionDeficitUSD` field. The figure appears in documentation only, and
what *is* stored is the damage leg per governorate as `unrepairedDamageUSD`.

The national total of those 14 fields is **$108,206,000,000**.

## What the sources say

The World Bank's *Syria Physical Damage and Reconstruction Assessment
(2011–2024)*, published 21 October 2025:

- Direct physical damage: **$108 billion** — infrastructure $52B (48% of
  damage), residential $33B, non-residential $23B.
- Reconstruction best estimate: **$216 billion** — $82B infrastructure, $75B
  residential, $59B non-residential.
- Range: $140B–$345B (the report's own text elsewhere states $141B–$343B; the
  press release rounds to $140B–$345B — a minor internal inconsistency in the
  source).
- Reconstruction is "nearly double the assessed physical damage", because unit
  construction costs are 2.1–2.3× pre-conflict for buildings and 2.1–3.3× for
  infrastructure.
- The estimate excludes service restoration for sectoral functioning.

Hardest hit: **Aleppo ~$31B, Rif Dimashq ~$22B, Homs ~$11B**.

## Verdict

Every number the game asserts matches. The $216B/$108B/$82B/$75B/$59B split is
exact, and the damage leg is stored per governorate and sums to $108.2B, which is
the published national damage total.

## Game impact

**Nothing to fix on the figures.** Two notes:

- The $216B reconstruction cost is **design context, not a simulated quantity**.
  The game never spends it. This is a legitimate choice — the reconstruction
  horizon is a century-projection concern, not a 40-turn budget — but it means
  the fact-check report's "verified" verdict covers a number the player never
  sees.
- A **related figure is much larger and is not modelled**: UNDP puts cumulative
  losses including physical damage *and* economic deprivation at **>$923
  billion** as of end-2025. See [unmodelled-sectors.md](unmodelled-sectors.md).

## Sources

- World Bank press release, 21 Oct 2025 —
  <https://www.worldbank.org/en/news/press-release/2025/10/21/syria-s-post-conflict-reconstruction-costs-estimated-at-216-billion>
- World Bank report PDF —
  <https://documents1.worldbank.org/curated/en/099102025095540101/pdf/P510947-f30bd5f6-78d5-4712-9f1e-a558b5c8ba75.pdf>
- AP coverage — <https://apnews.com/article/syria-world-bank-civil-war-rebuilding-costs-234a2e6727670650f79ebd8a8d447f5f>
- The National — <https://www.thenationalnews.com/business/economy/2025/10/21/syrias-post-war-reconstruction-costs-estimated-at-216bn-says-world-bank/>

See also: [provincial-damage.md](provincial-damage.md),
[unmodelled-sectors.md](unmodelled-sectors.md)

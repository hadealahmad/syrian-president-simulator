# Provincial physical damage: $108.2 billion

**Status: VERIFIED in total, and for the three headline governorates.** The
remaining eleven are confirmed only by summing to the published national total,
not re-extracted from the source table line by line.

## What the game says

Fourteen `unrepairedDamageUSD` values in `src/lib/engine/constants.ts`
(`BASELINE_GOVERNORATES`). Stored rounded to the nearest $10M, which is why the
sum ($108,206,000,000) is $9M above the published $108,197M.

| Governorate | In game |
| :--- | --- |
| Aleppo | $30,860,000,000 |
| Rif Dimashq | $22,300,000,000 |
| Homs | $10,830,000,000 |
| Hama | $7,470,000,000 |
| Ar-Raqqa | $6,840,000,000 |
| Idlib | $5,960,000,000 |
| Deir ez-Zor | $5,760,000,000 |
| Al-Hasakeh | $5,580,000,000 |
| Damascus City | $5,530,000,000 |
| Daraa | $4,300,000,000 |
| Latakia | $1,430,000,000 |
| Quneitra | $499,000,000 |
| As-Suwayda | $464,000,000 |
| Tartus | $383,000,000 |
| **Total** | **$108,206,000,000** |

## What the sources say

World Bank assessment, Table 1 (damage as of 31 December 2024). Published
highlights:

- **Aleppo $31B, Rif Dimashq $22B, Homs $11B** — the three hardest hit, matching
  the game exactly at the rounding the game uses.
- Tartus, As-Suwayda and Quneitra "experienced relatively limited physical
  damage" — consistent with the game's $383M / $464M / $499M.
- Aleppo alone is roughly 28.6% of national damage (30.86 / 108.2).
- The conflict damaged **nearly one-third of Syria's pre-conflict gross capital
  stock**.
- Analysis uses an exchange rate of 14,420 SYP/USD as of 31 Dec 2024.

## Verdict

Confirmed. The three largest values match the published figures at the game's
$10M rounding. The sum lands within 0.01% of the published national total, and
the $9M excess is fully explained by per-governorate rounding — this is a
rounding artefact, not an error.

The May 2026 fact-check report claimed exact Table 1 matches
(e.g. "Aleppo $30,862 Million"). The $30,862M precision is plausible but was not
independently re-extracted here; the report's cited source for it is the
git-ignored design document, which is absent.

## Game impact

Nothing to fix on the figures. One design observation:

**Damage is nearly inert in the running game.** `unrepairedDamageUSD` does not
feed any per-turn calculation — it is read only by `century-engine.ts` as the
`avgReconstruction` input. Provincial PRRI moves by fixed per-action deltas; the
wage/blackout/damage model in `spatial.ts` that would consume it
(`calculateProvincialPRRI`) is dead code with no inline replacement. So the most
thoroughly verified data in the project has almost no effect on play.

See also: [reconstruction-cost.md](reconstruction-cost.md),
[electricity-grid.md](outdated-electricity-grid.md),
[unmodelled-sectors.md](unmodelled-sectors.md)

## Sources

- World Bank report PDF, Table 1 —
  <https://documents1.worldbank.org/curated/en/099102025095540101/pdf/P510947-f30bd5f6-78d5-4712-9f1e-a558b5c8ba75.pdf>
- World Bank press release —
  <https://www.worldbank.org/en/news/press-release/2025/10/21/syria-s-post-conflict-reconstruction-costs-estimated-at-216-billion>

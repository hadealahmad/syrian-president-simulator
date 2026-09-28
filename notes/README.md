# Notes

Empirical research: **what is actually true about Syria, what the game gets
right, and what it gets wrong.**

- [`documentation/`](../documentation/README.md) explains how the software works.
- This folder explains whether the software is *accurate*.

The distinction matters because a simulation can be internally elegant and
externally wrong. Several of the numbers below are wrong in ways that change
gameplay.

## Status of the original audit

`FACT_CHECK_REPORT.md` (repo root, git-tracked) is a May 2026 audit of an earlier
design. Its own header now records that its primary source is git-ignored and
absent, and that its headline scores were withdrawn. **The files in `facts/`
supersede it.** Where they disagree, `facts/` is newer and better sourced.

## Conventions

### Filename tags

| Tag | Meaning |
| :--- | :--- |
| *(none)* | Verified against a primary or authoritative secondary source |
| `partial-` prefix | Partially true — some component holds, another does not, or the figure is right for one date and not another |
| `unverified-` prefix | Could not be checked against any source in this pass |
| `outdated-` prefix | Was accurate when the audit ran; the real-world figure has since moved |

The `partial-` tag is a **prefix** so partial facts sort together and can be
globbed: `notes/facts/partial-*.md`.

### Every fact file has the same shape

1. **Status** — one line, the verdict.
2. **What the game says** — the claim and where it lives in code.
3. **What the sources say** — with links.
4. **Verdict** — why the status is what it is.
5. **Game impact** — what to do about it, if anything. Includes
   `MISSING FROM GAME` and `INCORRECT IN GAME` markers.

### Sourcing standard

Prefer, in order: World Bank / UN / WFP primary publications, then national
statistics, then established outlets (Reuters, AP, Al Jazeera), then
aggregators. Aggregator sites (`worldfactbooks.com`, `populationclock.org`) are
recorded only where they agree with a primary source, and are marked as such.

**Not re-verified in this pass** is a real status. Several claims carried over
from the May 2026 audit were not independently re-checked here; those files say
so explicitly rather than implying confirmation.

## Fact files

### Sovereign assets and concessions

| File | Topic | Status |
| :--- | :--- | :--- |
| [russian-concessions-terminated.md](facts/russian-concessions-terminated.md) | Tartus / Stroytransgaz, Palmyra phosphate | **Verified — both cancelled 2025, replaced 2026** |
| [confiscated-assets-and-restitution.md](facts/confiscated-assets-and-restitution.md) | €51M French restitution, oligarch assets, $7B/5,000 MW MoU | Partly verified |

### Macroeconomy and fiscal

| File | Topic | Status |
| :--- | :--- | :--- |
| [gdp-and-contraction.md](facts/gdp-and-contraction.md) | Nominal GDP $21.4B, the contraction, growth rate | Verified, with a design gap |
| [reconstruction-cost.md](facts/reconstruction-cost.md) | $216B reconstruction, $108B damage | **Verified** |
| [provincial-damage.md](facts/provincial-damage.md) | The 14 governorate damage figures | **Verified** |
| [population-and-displacement.md](facts/outdated-population-and-displacement.md) | 23.46M population, IDPs, returns | **Outdated — ~2M low** |
| [fx-reserves.md](facts/partial-fx-reserves.md) | $320M reserve figure | **Partial** |
| [exchange-rate-and-redenomination.md](facts/exchange-rate-and-redenomination.md) | The 2026 redenomination, peg and parallel rate | **Partial — redenomination confirmed** |
| [sovereign-debt.md](facts/sovereign-debt.md) | Game says $6.1B; reality ~$27B | **Largest gap in the project** |
| [national-budget.md](facts/national-budget.md) | 35.5tn SYP state budget | Verified |
| [inflation.md](facts/inflation.md) | Inflation history and current level | Verified, volatile |
| [poverty-and-food-basket.md](facts/partial-poverty-and-food-basket.md) | "90% below $3/day", food basket, wage | **Partial — conflated measures** |
| [electricity-grid.md](facts/outdated-electricity-grid.md) | 2,250 MW, power hours, solar | **Outdated — rising fast** |
| [remittances.md](facts/remittances.md) | ~$1B/yr diaspora remittances | **Corrected — report said $2.2B** |
| [civil-service-wage.md](facts/civil-service-wage.md) | 4,050 SYP wage, 1.4M headcount | Verified as plausible |

### Governance and legal

| File | Topic | Status |
| :--- | :--- | :--- |
| [assad-regime-collapse.md](facts/assad-regime-collapse.md) | 8 December 2024 | Verified |
| [constitutional-declaration.md](facts/constitutional-declaration.md) | 13 March 2025 declaration, 5-year term | Verified, with a gap |
| [decrees-19-20-transitional-justice.md](facts/decrees-19-20-transitional-justice.md) | Missing Persons vs Transitional Justice | **Verified — game is correct** |
| [decrees-13-16-illicit-wealth.md](facts/decrees-13-16-illicit-wealth.md) | Decree 16 property restitution | **Verified — report overstated it** |
| [decrees-59-98-100-101.md](facts/decrees-59-98-100-101.md) | May 2026 reshuffle; Decree 13/2026 | **Verified vs SANA — game correct**; Decree 59 unverified |
| [monetary-reform-2026.md](facts/monetary-reform-2026.md) | Redenomination execution, unpegging, CB change | **MISSING FROM GAME** |

### Geopolitics, commodities, assets

| File | Topic | Status |
| :--- | :--- | :--- |
| [suwayda-and-al-lajat.md](facts/suwayda-and-al-lajat.md) | Suwayda autonomy, July 2025 escalation, al-Lajat | **Verified — displacement corrected 3×** |
| [golan-and-israeli-role.md](facts/golan-and-israeli-role.md) | Buffer zone, Hermon, Israel's role in the south | Partly verified, reframed |
| [bab-el-mandeb-and-hormuz.md](facts/unverified-bab-el-mandeb-and-hormuz.md) | Maritime chokepoint disruption | **Not yet checked** |
| [confiscated-assets-and-restitution.md](facts/confiscated-assets-and-restitution.md) | Rifaat al-Assad €51M, oligarch assets, $7B energy MoU | Partly verified — new finding |
| [russian-concessions-terminated.md](facts/russian-concessions-terminated.md) | Tartus + phosphate concessions cancelled and re-signed | **Verified — game mechanic is inverted** |

### Cross-cutting

| File | Topic | Status |
| :--- | :--- | :--- |
| [unmodelled-sectors.md](facts/unmodelled-sectors.md) | Real sectors and dynamics the game omits entirely | **Read this one** |
| [fact-check-report-errors.md](facts/fact-check-report-errors.md) | Errors in the May 2026 audit itself | Corrections |

## Known blind spots in this folder

- The geopolitical, commodity and asset files (Sections 3) were **not**
  independently re-verified. They record what the audit claimed and flag it as
  inherited, not confirmed.
- No source is cited for several `UNVERIFIED` files because the original
  `sfuturem.org` placeholder citation was the only reference and it is not a
  resolvable source.
- The 14 per-governorate damage figures are confirmed **in total** and for the
  three headline governorates. The remaining eleven were not re-extracted from
  World Bank Table 1 line by line; they are confirmed only by summing to the
  published national total.

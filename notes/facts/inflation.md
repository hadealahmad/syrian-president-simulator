# Inflation

**Status: VERIFIED — and notably, the most volatile figure in the whole project.**
The engine has no inflation model at all despite this being the dominant
macroeconomic variable.

## What the game says

```ts
annualInflationPct: 88,   // BASELINE_MACRO
```

`annualInflationPct` is **read but never written** by the turn engine. It appears
in no equation. It is a dead field: declared, initialised, displayed, never
simulated. The only economic consequence of money printing in the game is the
seigniorage term in the FX rate.

## What the sources say

| Period | CPI inflation | Source |
| :--- | --- | --- |
| 2011–2024 average | **54.4%** | World Bank MFA |
| 2000–2010 (pre-war) | 4.9% | World Bank MFA |
| 2022 | 118.8% | World Bank |
| 2023 | 92.5% (or 129.9% on a later vintage) | World Bank |
| 2024 | **72.1%** (or 37.7% on an earlier vintage) | World Bank MFO |
| 2025 | **11.5%** projected | World Bank MFO, July 2025 |
| Late 2025 / early 2026 | **"triple digits"** | Al Jazeera, Jan 2026 |

Also: budgeted fiscal deficit averaged **10% of GDP** 2012–2024; capital
expenditure in 2024 fell to **11% of its 2010 level**.

## Verdict

**VERIFIED that inflation is the dominant variable. MISSING from the game
entirely.**

The figures move enormously between sources and vintages — 2024 is quoted as
both 72.1% and 37.7%, 2023 as both 92.5% and 129.9% — because Syria's
inflation measurement is genuinely unstable. That instability is itself the
finding: this is an economy where the inflation number is not reliably knowable.

The trajectory is nonetheless clear and counter-intuitive: **inflation collapsed
from 72% to ~11% during 2025, then re-accelerated to triple digits around the
redenomination.** The redenomination was widely expected to be disinflationary
and appears not to have worked.

**The game models none of this.** It has a dead inflation field, a currency that
can only depreciate, and no CPI. A player printing seigniorage gets a
mechanical FX penalty and nothing else — no price level, no wage-price spiral,
no erosion of the real value of the treasury's SYP balances.

## Game impact

- **MISSING FROM GAME: an inflation model.** This is the largest single
  macroeconomic omission. Inflation is what converts seigniorage from a currency
  problem into a *livelihood* problem, and the game routes all money-printing
  consequences through the FX rate alone.
- **INCORRECT (inert):** `annualInflationPct: 88` is a reasonable 2024-era level
  but is never used, so it neither helps nor hurts. It implies to a reader that
  inflation is modelled.
- **MISSING: the redenomination's inflation risk.** The fear that dropping two
  zeros would fuel inflation was the central argument for and against the
  reform. The game has no mechanism for it.
- **MISSING: CPI effects on the real wage.** Real wage in the game is
  `nominalWage / FX rate`, which ignores domestic price growth entirely. With
  inflation at 11–100%, that is a large simplification.

## Sources

- World Bank *Syria Macro-Fiscal Assessment*, June 2025 (54.4% average; 4.9%
  pre-war) — <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank Syria Macro-Fiscal Outlook, July 2025 (11.5% for 2025; 72.1% 2024;
  poverty lines) — <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>
- World Bank Syrian Arab Republic Economic Monitor (118.8% / 92.5% vintage) —
  <https://documents1.worldbank.org/curated/en/099617210152414596/pdf/IDU1e896291c1751614c03189551eadb96c56942.pdf>
- Al Jazeera, 5 Jan 2026 ("inflation recently reached triple digits") —
  <https://www.aljazeera.com/economy/2026/1/5/syrias-new-currency-removes-al-assad-family-images-seeks-to-boost-economy>

See also: [exchange-rate-and-redenomination.md](exchange-rate-and-redenomination.md),
[monetary-reform-2026.md](monetary-reform-2026.md),
[partial-poverty-and-food-basket.md](partial-poverty-and-food-basket.md)

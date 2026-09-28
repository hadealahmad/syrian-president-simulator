# Nominal GDP: $21.4 billion

**Status: VERIFIED.** The figure and its pre-war peak are both correct. The
*growth rate the engine assumes* is not, and that is a design gap.

## What the game says

No GDP field exists. `BASELINE_MACRO` has no `gdpUSD`. The figure appears in
documentation only, and is cited as "contracted from a pre-war peak of $67.5B
in 2011".

What the engine *does* have is a hard-coded growth assumption:

```ts
// turn-manager.ts — every FX-rate call site
calculateParallelRate(..., gdpGrowthPct = 2.5, ...)
```

`gdpGrowthPct` is a default parameter, never passed a real value and never
derived from state. So the currency model assumes **+2.5% GDP growth every turn,
forever**.

## What the sources say

World Bank *Syria Physical Damage and Reconstruction Assessment* and *Syria
Macro-Fiscal Assessment* (June 2025):

- Nominal GDP contracted from **$67.5B (2011)** to an estimated **$21.4B
  (2024)**.
- Reconstruction costs are "nearly ten times Syria's projected 2024 GDP".
- Real GDP fell approximately **53% between 2010 and 2022**.
- Nighttime-light data suggest an **83% decline 2010–2024**.
- GNI per capita was **$830 in 2024**.
- Real GDP growth: **−1.2% (2023), −1.5% (2024), +1.0% (2025 projected)**. A
  later World Bank Macro-Fiscal Outlook vintage gives +0.3% / +0.9% /
  2.0–4.0% — vintages disagree, which the report acknowledges.
- Between 2000 and 2010, pre-war, real GDP grew at an average **4.8%/year**.

## Verdict

The **$21.4B** figure and the **$67.5B** peak are both correct and traceable to
the World Bank. The fact-check report had no source for these and marked them
`[VERIFIED FACTUAL]` with a "corrected code ref" — that judgement was right even
though the citation was missing. The missing source is the World Bank *Syria
Macro-Fiscal Assessment* (June 2025).

The engine's `gdpGrowthPct = 2.5` is **fictionally generous**. Syria has been in
contraction for most of the past decade and is projected at ~1%. The term enters
the FX formula as a *dampener* (`- gdpGrowthPct/100 × 0.5`), so the engine
credits the pound with 1.25% of depreciation relief per turn that the real
economy has not been delivering.

## Game impact

- **MISSING FROM GAME:** no `gdpUSD` field, so no GDP-dependent mechanic exists.
  The `d.gdpGrowthPct`-shaped lever does not exist as a player control.
- **INCORRECT IN GAME:** the implicit +2.5%/turn growth assumption. It makes the
  currency more stable than reality, which makes the game slightly *easier* than
  the historical moment it portrays.
- Low practical impact — the term is one of four in the FX equation and is
  swamped by the seigniorage and drain terms. Fixing it would not change
  balance materially, but it would remove a fictional input.

## Sources

- World Bank damage/reconstruction PDF (GDP figures) —
  <https://documents1.worldbank.org/curated/en/099102025095540101/pdf/P510947-f30bd5f6-78d5-4712-9f1e-a558b5c8ba75.pdf>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025 —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank Syria Macro-Fiscal Outlook —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>

See also: [sovereign-debt.md](sovereign-debt.md), [inflation.md](inflation.md)

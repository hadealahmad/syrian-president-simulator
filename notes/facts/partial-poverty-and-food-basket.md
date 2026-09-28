# Poverty and the food basket

**Status: PARTIAL — and it conflates two different measures.** The "90% below
$3/day" claim in the fact-check report is a misreading of a WFP hardship figure.

## What the game says

```ts
monthlyFoodBasketSYP: 19_000,   // new SYP = 1,900,000 old SYP
civilServiceWageSYP:    4_050,   // new SYP = 405,000 old SYP
```

Implied coverage: 4,050 / 19,000 = **21.3%** of the basket. The fact-check report
states "90% of Population Below Poverty Line ($3.00/day)" as a `[VERIFIED
FACTUAL]`.

## What the sources say

**The WFP basket, December 2025:**

- Minimum Expenditure Basket: **SYP 2.2 million** (USD 206 at the official rate).
- **25% lower year-on-year**, but still high.
- **Triple the official minimum wage.**
- "Leaving **nearly 90 percent of households facing difficulties in meeting basic
  needs**."

**The actual poverty rates, World Bank (using the 2021 PPP):**

| Line | 2023 | 2024 | 2025 |
| :--- | --- | --- | --- |
| International poverty ($3.00, 2021 PPP) | 20.1% | 21.1% | 20.9% |
| Lower-middle-income poverty ($4.20, 2021 PPP) | 44.5% | 46.8% | 46.8% |

An earlier World Bank vintage using 2017 PPP lines gives higher figures
(extreme poverty rising to 37.4% by 2025), because the PPP base and poverty line
changed. Both are published; they are not comparable.

## Verdict

**PARTIAL. Two distinct errors.**

1. **The "90%" is a different measure.** It is the WFP *hardship* share —
   households struggling to meet basic needs — not the share below $3.00/day.
   The share below $3.00/day is about **21%**; below $4.20/day it is about
   **47%**. The fact-check report presented the hardship figure as the
   international poverty rate, which overstates extreme poverty by roughly 4×.
   The real-world phenomenon is severe; the specific number was wrong.

2. **The food basket is superseded.** 1,900,000 old SYP was right for 2024. The
   WFP basket was **2.2 million** by December 2025, ~16% higher. Given the game's
   2027 start, the current figure is the better choice.

The **wage-to-basket ratio is the part that holds up.** A basket at "triple the
official minimum wage" implies ~33% coverage in late 2025, against the game's
21.3%. The game's ratio is more adverse than reality but the right order of
magnitude — and it was derived from a defensible 2024 wage figure.

## Game impact

- **INCORRECT IN GAME:** `monthlyFoodBasketSYP: 19_000` is a 2024 figure. The
  December 2025 WFP basket is 2,200,000 old SYP = 22,000 new SYP.
- **INCORRECT IN GAME (likely):** the derived real wage. The game computes
  $25.00 at 4,050 new SYP ÷ 162. If the official minimum wage is genuinely a third
  of the basket, the wage/basket relationship is roughly right but the *rate* is
  the shaky input — see
  [exchange-rate-and-redenomination.md](exchange-rate-and-redenomination.md).
- **DOCUMENTATION ERROR:** the "90% below $3.00/day" claim should be corrected in
  `FACT_CHECK_REPORT.md` to distinguish the WFP hardship threshold from the
  World Bank poverty line. It is currently a `[VERIFIED FACTUAL]` row built on
  that conflation.
- **MISSING FROM GAME:** the poverty line as a *mechanic*. The engine has real
  wage feeding `SECURITY_MUTINY` and unrest tiers, but no subsistence threshold.
  A "minimum expenditure basket" that the civil wage must cover is a more
  legible and more historically grounded version of the same tension than a
  dollar wage threshold.

## Sources

- World Bank Syria Macro-Fiscal Outlook — WFP MEB SYP 2.2m Dec 2025, "nearly 90%
  of households"; poverty rates on 2021 PPP —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>
- World Bank Syrian Arab Republic Economic Monitor (2017 PPP poverty lines) —
  <https://documents1.worldbank.org/curated/en/099617210152414596/pdf/IDU1e896291c1751614c03189551eadb96c56942.pdf>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025 (CPI, WFP references) —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>

See also: [civil-service-wage.md](civil-service-wage.md), [inflation.md](inflation.md)

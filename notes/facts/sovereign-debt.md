# Sovereign debt: the largest factual gap in the project

**Status: the game is wrong by roughly 4.4×, and the gap is unaudited.**

> This is the single most consequential error in the project's empirical
> foundation. The fact-check report never audited the debt parameter set at all.

## What the game says

| Parameter | Game value | Location |
| :--- | --- | --- |
| Recognised sovereign debt | **$6,100,000,000** | `BASELINE_MACRO.sovereignDebtUSD` |
| Paris Club debt | $4.2B (implied) | `constants.ts:8` |
| Russia debt | $1.6B (implied) | `constants.ts:9` |
| Iran oil debt (side ledger) | **$7,000,000,000** | `IRAN_OIL_DEBT_USD` |
| Iran informal claim | $30,000,000,000 | `IRAN_INFORMAL_CLAIM_USD` |
| Legacy coupon | **$45,000,000/turn** | `revenues.ts` `LEGACY_DEBT_COUPON_USD` |
| Iran oil coupon | $25,000,000/turn | `IRAN_OIL_COUPON_USD` |
| Foreign loan packages | 3 (invented instruments) | `BASELINE_FOREIGN_LOANS` |

`sovereignDebtUSD` deliberately **excludes** the Iran oil ledger and the informal
claim — those are tracked in separate fields.

## What the sources say

World Bank *Syria Macro-Fiscal Assessment*, June 2025:

> "The Central Bank reports Syria's total debt at about **$27 billion** at the
> end of 2024 (**128 percent of GDP**), of which **$22.3 billion (104 percent of
> GDP) is external**, with substantial arrears, particularly to Iran. Domestic
> debt has reportedly also risen sharply to about **$5 billion in March 2025**,
> equivalent to around 24 percent of GDP."

For scale, the same report gives 2024 GDP as $21.4B.

## Verdict

**INCORRECT IN GAME, materially.**

| | Game | Reality | Ratio |
| :--- | :--- | --- | --- |
| Total debt | $6.1B | ~$27B | **0.23×** |
| External debt | $5.8B (implied) | ~$22.3B | **0.26×** |
| Debt / GDP | 28% | 128% | — |

The game understates total debt by about **$21 billion** and external debt by
about **$16.5 billion**. Against a $21.4B GDP, real Syrian debt is a sovereign
crisis of a different order than the game portrays.

The Iran arrears claim is also larger than modelled: the game holds $7B in a side
ledger, while the World Bank attributes *substantial* arrears specifically to
Iran within a $22.3B external total.

**The $45M flat legacy coupon has no traceable basis.** It is a hard-coded
constant with no Paris Club schedule, no maturity structure and no partial
relief behind it. Together with the $25M Iran coupon it is **$70M/turn of
unfounded debt service against $320M of reserves** — roughly 4.5 turns of runway
before the player does anything. This single line is the dominant driver of the
game's difficulty.

The three "foreign loan packages" are entirely invented. They are not modelled
on any real facility, and presenting them as game objects is fine — but they are
not facts and the fact-check report's Section 6, titled "Confiscated Oligarch
Assets & **Sovereign Liabilities**", contained no liability figures at all.

## Game impact

This is the highest-value correction available, and it is also the one that most
changes balance:

- **INCORRECT:** `sovereignDebtUSD` $6.1B should be ~$27B if the game intends to
  represent actual Syrian indebtedness.
- **MISSING FROM GAME:** no debt/GDP ratio, no arrears structure, no maturity
  profile, no partial-relief mechanics. The `mortgaged_enclave` ending tests
  `sovereignDebtUSD > 12B || sovereignLeverage < 35` — a threshold that is
  already half-met at the game's *understated* baseline, so the ending triggers
  far too easily.
- **MISSING:** a Paris Club / creditors' haircut mechanic, which is the obvious
  real-world resolution for a 128%-of-GDP debt stock and is the single most
  interesting fiscal decision the game could offer.
- **Repudiation exists** (`REPUDIATE_PARIS`, `REPUDIATE_RUSSIA`,
  `REPUDIATE_IRAN_FORMAL`) but is modelled on the wrong magnitudes, so the
  stakes of repudiating $6.1B rather than $27B are badly understated.

Note the balance implication: raising the debt stock without also raising
starting reserves or revenue makes the game substantially harder. Any fix should
be paired with a difficulty pass, which makes these two pieces of work
dependent — see the difficulty discussion.

## Sources

- World Bank *Syria Macro-Fiscal Assessment*, June 2025, debt and reserves
  sections —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank report landing page —
  <https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099844407042516353>
- GDP denominator: World Bank damage/reconstruction PDF —
  <https://documents1.worldbank.org/curated/en/099102025095540101/pdf/P510947-f30bd5f6-78d5-4712-9f1e-a558b5c8ba75.pdf>

See also: [gdp-and-contraction.md](gdp-and-contraction.md),
[partial-fx-reserves.md](partial-fx-reserves.md),
[unmodelled-sectors.md](unmodelled-sectors.md)

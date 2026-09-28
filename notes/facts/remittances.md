# Diaspora remittances: ~$1 billion/year

**Status: VERIFIED — and the fact-check report's figure was roughly 2× too high.**

## What the game says

`remittanceCaptureSpread` (default 10, range 0–25) scales remittance capture in
the fiscal engine, with a **hawala threshold at >15** that triggers a trust
penalty, PRRI bumps in six urban governorates, and a small parallel-rate
divergence. Remittances are a modelled revenue stream with a genuine trade-off
attached: capture more, lose informal trust.

## What the sources say

A Middle East Council issue brief (2 October 2025), citing the **World Bank's
"Personal remittances, received (current US$)"** indicator for Syria (accessed
21 June 2025):

> "remittances to Syria are estimated at **around $1 billion annually**, largely
> from the Syrian diaspora in Europe."

Supporting context from the same source and from UNDP:

- **Over 6 million Syrians** were living as refugees outside the country (UNHCR,
  2024), concentrated in Germany, Sweden and the Netherlands.
- Remittances are described as **non-conditional** — no political or institutional
  strings, so families direct them by local need rather than by state preference.
  That is precisely the dynamic `remittanceCaptureSpread` models.
- Remittances are one of the ways sanctions "reduced both exports and remittances",
  contributing to currency depreciation.
- Household incomes "from employment **or remittances**" failed to keep pace with
  prices.

## Verdict

**The fact-check report's $2.2 billion is wrong by roughly 2×.** It cited
"UNDP, World Bank, and EUAA studies" giving "$1.5B–$2.2B formally, rising to
$2.5B–$3B including informal hawala couriers". The World Bank's own remittances
indicator — the most directly citable source — gives **~$1 billion**.

The report appears to have conflated the formal-channel estimate with an
hawala-inclusive upper bound, then recorded the upper bound as the figure, and
attributed all three tiers to sources that were never identified.

At $1B against $21.4B GDP, remittances are roughly **4.7% of GDP** — economically
significant for a household-livelihood flow, but modest at the macro level. The
game treats them as a meaningful revenue line, which is defensible given they are
largely untaxed and therefore disproportionately important to the treasury's
cash position.

## Game impact

- **CORRECTED IN GAME (period).** The engine held `totalRemittancesUSD =
  1_000_000_000` with the comment "Expatriates remit ~$1.0B USD per 6-month turn".
  The *value* matched this file's figure, but a turn is six months, so applying
  $1.0bn per turn booked **$2bn/yr — double the real flow**. Now
  `500_000_000` ($1.0bn/yr ÷ 2 turns). The emergency branch above the hawala
  threshold is an absolute USD surge rather than a share of the pool, so it was
  deliberately left unscaled.
- **INCORRECT (scale):** the $2.2B figure, which the report marked
  `[VERIFIED FACTUAL]`.
- **SOUND: the mechanic.** `remittanceCaptureSpread` is one of the better-designed
  levers in the game — it converts an informal economy into a dilemma rather than
  a free-money slider, and the non-conditionality documented by the sources is
  exactly the property that makes the dilemma real.
- **WORTH ADDING: the formal/informal split.** The sources distinguish formal
  channels from *hawala*. The game has one blended lever. Splitting it — a
  formalisation push that trades PC/trust for captured volume — would be a more
  faithful model of what a government is actually deciding.
- **MISSING: the return-migration link.** Remittance flows and return migration
  are the same diaspora making the same decision. The game models neither
  interacting.

## Sources

- Middle East Council, *The Distant Anchor: How Diasporas Can Stabilize Fragile
  States*, 2 Oct 2025 — the ~$1B estimate, sourced to World Bank Data
  "Personal remittances, received (current US$)", Syria, accessed 21 Jun 2025 —
  <https://mecouncil.org/publication/the-distant-anchor-how-diasporas-can-stabilize-fragile-states/>
- World Bank remittances indicator (Syria) —
  <https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=SY>
- UNDP Syria Socio-Economic Impact Assessment — remittances, 99.7% pound
  depreciation, market rate 14,000/USD by Nov 2024 —
  <https://www.undp.org/sites/g/files/zskgke326/files/2025-02/undp-sy-seia-final_0.pdf>

See also: [outdated-population-and-displacement.md](outdated-population-and-displacement.md),
[fact-check-report-errors.md](fact-check-report-errors.md)

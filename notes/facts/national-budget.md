# National budget: SYP 35.5 trillion

**Status: VERIFIED.** Figure and USD equivalent both check out; one sub-claim in
the fact-check report is a slight overstatement.

## What the game says

Not directly modelled. The nearest stored value is
`treasurySYP: 42_000_000_000` (42 billion new SYP = 4.2 trillion old SYP of
liquid working cash), and the engine runs a ~54 billion new SYP annualised
operating deficit against it.

## What the sources say

World Bank *Syria Macro-Fiscal Assessment*, June 2025:

> "In 2024, the Syrian government's budget was **SYP 35.5tn (equivalent to
> $2.5 billion, or about 12 percent of GDP)**."

Composition: 26.5tn current expenditure, 9.0tn investment capital.

Additional context from the same source:

- Budgeted fiscal deficit averaged **10% of GDP** over 2012–2024, *excluding*
  off-budget military and electricity subsidies.
- Capital expenditure in 2024 fell to **11% of its 2010 level**.
- Revenue declined sharply post-conflict: lower oil and tax receipts, collapsed
  trade under sanctions, a growing informal economy, and weak collection
  capacity.
- Later vintage: fiscal balance **+1.4% of GDP** in 2025 (a projected surplus,
  on a different vintage from the deficit series above).

## Verdict

**VERIFIED.** SYP 35.5tn and the ~$2.5bn equivalent are both correct.

One correction to the fact-check report: row 1.3 claims the budget was "worth
~$2.8B at late 2024 rates". The World Bank's own conversion is **$2.5B**. The
$2.8B figure appears to come from applying a *later* (appreciated) rate to the
same nominal budget. Both numbers are defensible for their date, but the report
presents a range as if it were the audited value.

The "10% of GDP average deficit excluding off-budget military" detail is
worth noting: the published deficit understates the true fiscal hole, because
military and electricity subsidies are off-budget.

## Game impact

- **No correction needed** to stored constants — the budget figure is not stored.
- **MISSING FROM GAME: off-budget military spending.** The World Bank explicitly
  excludes it from the headline deficit, and the game has no military payroll
  line at all. `fail-states.ts` reuses `civilServiceWageSYP` as the *soldier*
  wage, which is a stand-in for a budget category the engine does not have. A
  defence budget is one of the most natural spending levers a president of Syria
  would actually control.
- **MISSING: the capital-expenditure collapse.** CapEx at 11% of 2010 levels is
  the single most important fiscal fact for a reconstruction game, and the game's
  `gridCapExUSD` is a player-chosen number with no baseline decline attached to
  it.

## Sources

- World Bank *Syria Macro-Fiscal Assessment*, June 2025 —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank Syria Macro-Fiscal Outlook, July 2025 (2025 fiscal balance) —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>
- The National, 21 Oct 2025 (also gives ~$2.8B at late-2024 rates) —
  <https://www.thenationalnews.com/business/economy/2025/10/21/syrias-post-war-reconstruction-costs-estimated-at-216bn-says-world-bank/>

See also: [gdp-and-contraction.md](gdp-and-contraction.md),
[outdated-electricity-grid.md](outdated-electricity-grid.md),
[unmodelled-sectors.md](unmodelled-sectors.md)

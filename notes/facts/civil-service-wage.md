# Civil service wage and headcount

**Status: VERIFIED as plausible; the wage-to-basket ratio is more adverse in the
game than in reality.**

## What the game says

```ts
civilServiceWageSYP:  4_050,        // new SYP = 405,000 old SYP
civilServiceHeadcount: 1_400_000,   // "Total active public & security personnel"
```

Implied real wage at the game's starting rate: 4,050 / 162 = **$25.00/month**.
Implied basket coverage: 4,050 / 19,000 = **21.3%**.

`fail-states.ts` reuses `civilServiceWageSYP` as the **soldier** wage for the
`SECURITY_MUTINY` check.

## What the report claimed

- "Standard 5-Person Food Basket (MEB) is 1.9M old-SYP/month; average civil
  service wage of ~405,000 old-SYP covers only ~21% of food basket" —
  `[VERIFIED FACTUAL]`, with the correct code references
  (`constants.ts:23-24`).
- "Public Sector Work Force: 1.1M to 1.4M civil service and security employees" —
  `[VERIFIED FACTUAL]`.

## What the sources say

**Confirmed, and the wage side is solid.** The World Bank Syria Macro-Fiscal
Outlook (Dec 2025 data) states the WFP Minimum Expenditure Basket was
**SYP 2.2 million** and was **"triple the official minimum wage"**.

That implies wage ≈ 733,000 old SYP/month and basket coverage ≈ **33%**.

The report's own wage figure is internally consistent: 1,900,000 × 21.3% =
404,700 ≈ 405,000. So the wage and the 2024 basket are mutually consistent, and
the 21% coverage figure is correct **for 2024**.

The headcount range of 1.1–1.4M is plausible and the game sits at the top of it,
which is a defensible reading of "civil service *and security* personnel" — a
combined figure that includes the military, which the game counts in the same
field.

## Verdict

**VERIFIED as plausible.** The wage is well-grounded. The discrepancy is in the
basket, not the wage — see
[partial-poverty-and-food-basket.md](partial-poverty-and-food-basket.md).

The one real modelling problem is the **double use of one field**: the game uses
`civilServiceWageSYP` both as the civil payroll cost *and* as the military
soldier's wage in a fail-state check. The narration for `SECURITY_MUTINY`
attributes an $8 threshold to military ranks, but the number is a civil-service
average.

## Game impact

- **PLAUSIBLE:** `civilServiceWageSYP: 4_050` and `civilServiceHeadcount:
  1_400_000`. No change needed.
- **STRUCTURAL:** `civilServiceWageSYP` serving as both civil payroll and soldier
  wage. These are different populations and different costs. Combined with
  [unmodelled-sectors.md](unmodelled-sectors.md) §7 (no military budget at all),
  the `SECURITY_MUTINY` fail state is currently triggered off a number that does
  not mean what its narration says.
- **NOTE:** `SECURITY_MUTINY` also requires `systemicCorruption > 75`. Starting
  corruption is 58, so the fail state needs both a real-wage collapse *and* a
  corruption spiral — the scenario is reachable but requires compounding failure.

## Sources

- World Bank Syria Macro-Fiscal Outlook, July 2025 — WFP MEB SYP 2.2m Dec 2025,
  "triple the official minimum wage" —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025 (CPI, wages context) —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>

See also: [partial-poverty-and-food-basket.md](partial-poverty-and-food-basket.md),
[national-budget.md](national-budget.md)

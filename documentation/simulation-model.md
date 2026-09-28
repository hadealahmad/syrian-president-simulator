# Simulation model

Every equation the engine computes, with the reasoning. Each formula is quoted
from the code that implements it.

Notation: `SYP` is the **new** (post-2026 redenominated) Syrian pound. The
redenomination divided by 100, so `1 new SYP = 100 old SYP`. See
[`../notes/facts/exchange-rate-and-redenomination.md`](../notes/facts/exchange-rate-and-redenomination.md).

---

## 1. Dual-currency premise

The simulation's central design choice: two currencies that do not convert
freely.

- **SYP** — sovereign fiat. The treasury can print it (`moneyPrintingSYP`), and
  the budget may run negative at a 5%/turn overdraft interest.
- **USD reserves** — scarce, non-printable, and the binding constraint. Reaching
  zero is instant `SOVEREIGN_INSOLVENCY`.

The dual-currency *affordability* test is the single most reused function in the
engine. It lives in `currency.ts` (not `turn-manager.ts`) so both the turn
directives and event options can use it without a circular import.

```
canAfford(reservesUSD, treasurySYP, costUSD, costSYP, parallelRate):

  if costUSD > reservesUSD:                      return false
  usableSYP = max(0, treasurySYP)
  if usableSYP >= costSYP:                       return true
  sypShortfall = costSYP - usableSYP
  usdNeededForSYP = sypShortfall / max(1, parallelRate)
  return reservesUSD >= costUSD + usdNeededForSYP
```

**Design choice, not accident:** the accumulated overdraft is deliberately
excluded from the test. Only the *new* cost needs backing. The README promises
the treasury may run negative without forcing immediate seigniorage, and this is
how that promise is kept. Earlier revisions multiplied the coverage bar by the
whole overdraft, which made the state effectively unplayable.

---

## 2. Parallel FX rate

`currency.ts` → `calculateParallelRate`. A deliberately linear model.

```
netDepreciation =
      (m2Delta / m2Current)            # seigniorage
    + (nonAuctionDrain / reserves) * 0.50    # FX drain, as a share of reserves
    - (gdpGrowthPct / 100) * 0.50      # growth dampener
    - min(0.25, (auctionUSD / 10e6) * 0.015)   # auction relief

deltaRate  = currentRate * clamp(netDepreciation, -0.25, +1.20)
parallelRate = currentRate + deltaRate
```

Four terms, each a design lever:

| Term | Why it exists |
| :--- | :--- |
| `m2Delta / m2Current` | Printing is the primary depreciation channel. A 5T print on a 40T M2 base is +12.5%. |
| `nonAuctionDrain / reserves × 0.5` | Running out of hard currency weakens the pound. Auction dollars are *excluded* — they are the stabiliser. |
| `gdpGrowthPct × 0.5` | Growth damps depreciation. |
| `auctionRelief` | Each $10M auctioned buys 1.5% relief, capped at 25%. |

**Two clamps are load-bearing.** Per turn the rate can fall at most 25% and rise
at most 120%. Without the floor, a bad turn could collapse the currency past
recovery; without the ceiling, a large print could make the real-wage stat
meaningless. Both were added after playtesting, not derived.

**Accident worth knowing:** `gdpGrowthPct` is hard-coded to `2.5` at every call
site. There is no GDP field in state. Real GDP has in fact been contracting
(−1.5% in 2024, +1.0% in 2025 per the World Bank), so this term is a fictional
constant. See `../notes/facts/gdp-and-contraction.md`.

### Real wage

```
realWageUSD = civilServiceWageSYP / parallelRateSYP     (0 if rate <= 0)
```

This is the linchpin of the `SECURITY_MUTINY` fail state. The baseline is
4,050 new SYP at 162 = **$25.00**; the fail threshold is **$8**. A player who
prints heavily can cross that in a handful of turns.

---

## 3. Tax compliance

`revenues.ts` → `auditSemiannualBudget`. Five-term additive model:

```
avgCompetence = mean(ministries[].competence)     (fallback 50)
avgPRRI       = mean(governorates[].prri)         (fallback 45)

rawCompliance = 0.47                             # base
              + (dailyPowerHours / 24) * 0.25     # power
              + (avgCompetence / 100) * 0.25      # state capacity
              - (systemicCorruption / 100) * 0.30 # leakage
              - (avgPRRI / 100) * 0.25            # unrest
              + militiaAbsorptionBonus            # 0 → 0.04

complianceRate = clamp(rawCompliance, 0.12, 0.88)
```

At baseline (3.5 h, competence 51.13, corruption 58, PRRI 45) this lands near
**0.35**, matching `BASELINE_MACRO.taxCompliancePct: 35`.

**Design choice:** the corruption coefficient (0.30) is the largest single drag,
so corruption is the most efficient thing a player can attack for revenue.
**Design choice:** the 0.12/0.88 clamp is a floor and a ceiling on state capacity
— the state can never be so bad it collects nothing, nor so good it collects
everything.

> **Note.** `effectCompetence` on event options feeds `avgCompetence` and is
> therefore the only event-authored lever on tax revenue. It was authored on all
> 194 options and read by nothing until it was wired up; it now moves the
> national average by the full per-option delta. `scripts/test-event-effects.ts`
> asserts each effect lands exactly once.

---

## 4. Grid CapEx → capacity

```
competenceWaste = avgCompetence < 40 ? 0.25 : 0.05
effectiveCapEx  = gridCapExUSD * (1 - competenceWaste)
gridCapacityMW += round((effectiveCapEx / 1e6) * 12)
```

The `× 12` MW per $M encodes "a dollar of procurement competence buys 12 MW",
and the two-tier competence waste means a state below 40 average competence
loses a quarter of every CapEx dollar. At the $35M baseline that is +399 MW/turn.

---

## 5. The growth valve

`constants.ts` → `GROWTH_TUNING`, consumed in `revenues.ts` and `turn-manager.ts`.

```
capacityMult = 1 + max(0, capacityPct - 20) * 0.004
```

So capacity 20 → 1.00×, capacity 100 → 1.32×. **The multiplier is zero at the
starting baseline on purpose**, which makes the growth valve a pure
*player-earned* reward: doing nothing earns nothing, and the revenue bonus scales
only the domestic SYP lines (corporate tax, telecom excise, fuel surcharge,
utility bills, SOE profit).

Capacity moves per turn from:

| Input | Effect |
| :--- | :--- |
| Grid CapEx ≥ $35M | +1.0 |
| Grid CapEx ≥ $20M | +0.5 |
| Zero CapEx | −1.0 |
| Each executed income project | +4 (scaled by cost tier) |
| Each `REVOLT` province | −2.0 |
| `systemicCorruption > 60` | halves all gains |
| `ABSORB_MILITIAS` | +0.01/turn compliance ramp, capped +0.04, decays otherwise |

**The erosion terms are the point.** A state can only net positive growth while
it holds order; `REVOLT` provinces destroy capacity faster than CapEx builds it.
That is what makes the unrest variables strategically coupled to the economy
rather than decorative.

---

## 6. Fiscal audit and runway

`revenues.ts` → `auditSemiannualBudget` is the largest function in the engine.
It runs six sections in order and returns a 24-field `RevenueAudit` receipt.

```
grossCapturedSYP  = Σ SYP inflows   (corp tax, telecom, fuel, utilities,
                                     auction absorption, capacity bonus, projects)
expendedSYP       = operatingSYP + investmentSYP
seignioragePrinted = directives.moneyPrintingSYP
netSYPDelta       = grossCapturedSYP + seignioragePrinted - expendedSYP

netUSDDelta       = discretionaryUSD - expendedUSD
reservesAfterTurn = max(0, reservesUSD + netUSDDelta)
```

### Runway

```
if netUSDDelta < 0:
    runwayTurns = min(99, floor(reservesAfterTurn / |netUSDDelta|))
    runwayMonths = clamp(round1(reservesAfterTurn / |netUSDDelta| * 6), 0.1, 99)
else:
    runwayTurns = runwayMonths = 99          # reserves growing, no runway concern

runwayAlertTier = runwayMonths <= 3 ? CRITICAL
                : runwayMonths <= 6 ? WARNING : STABLE
```

**Both must read `reservesAfterTurn`, not the opening balance.** `netUSDDelta` is
applied to reserves *after* the audit returns, so an audit that divides
`reservesUSD` is describing a balance the player never sees. That bug reported
`STABLE` at 1.2 months of true runway — the alert tier gates the game's primary
fail state, so it has to be derived from the real number.

### The dual-currency split

Every SYP cost has a USD-equivalent shadow cost so the player cannot spend the
treasury for free:

```
gridCapExSYPEquiv = round(gridCapExUSD * max(1, parallelRateSYP))
```

---

## 7. Dollar auction

One definition, in `currency.ts`, used by the audit, the money supply and the
receipt:

```
AUCTION_CLEARING_DISCOUNT  = 0.95    # clearing price vs street rate
AUCTION_STERILIZATION_FACTOR = 0.40  # share of collected SYP removed from M2
M2_FLOOR_SYP               = 10e9

computeAuctionAbsorbedSYP(auctionUSD, parallelRate):
    if auctionUSD <= 0 or parallelRate <= 0:  return 0
    collected = auctionUSD * parallelRate * AUCTION_CLEARING_DISCOUNT
    return round(collected * AUCTION_STERILIZATION_FACTOR)
```

The reserve guard is enforced at the single point where the auction is priced:

```
requested = max(0, directives.dollarAuctionUSD)
affordable = min(requested, max(0, reservesUSD))       # hard constraint
```

This implements the documented rule that the state cannot sell USD it does not
hold. The guard used to live only in `executeDollarAuction`, which nothing called;
the auction was open-coded, so a $10B auction against $320M drained reserves to
zero and triggered instant insolvency.

**Why the 0.40 factor exists.** Gross collections are not M2 destruction — part of
the SYP re-enters circulation through the banking system. The receipt previously
reported gross while M2 fell by 40% of it, priced at a different FX rate,
overstating the destruction by 2.5×–3.3×. The receipt is now restated to the
realised, floor-clamped amount, so `auctionAbsorbedSYP` always equals the real
M2 delta. `scripts/test-dollar-auction.ts` asserts exactly that.

---

## 8. Debt service

| Item | Rule |
| :--- | :--- |
| Legacy coupon | Flat $45M/turn (`LEGACY_DEBT_COUPON_USD`). No Paris Club schedule behind it. |
| Iran oil coupon | $25M/turn, overridable to $10M by the Iran reschedule facility. |
| Interest | Accrues on the **opening** balance, so it starts the turn *after* signing. |
| Voluntary repayment | Highest interest rate first, clamped to reserves-after-terminations. |
| Buyback leverage | `floor(paid / 100M) × 2`, capped at `SOVEREIGN_LEVERAGE_CAP = 65`. |
| Termination reward | +6 PC, +4 leverage, +1 trust per loan, all-or-nothing per loan. |

**Design choice:** interest accrues on the opening balance and the audit runs
before the repayment loop, so a player cannot pay down debt and dodge that turn's
interest.

**Accident worth knowing:** the leverage cap (65) equals the baseline leverage,
so a player at baseline can never bank termination leverage at all. Baseline is
already the ceiling.

> **All of these numbers are unaudited.** The World Bank reports total Syrian debt
> at ~$27B with $22.3B external; the game recognises $6.1B. See
> `../notes/facts/sovereign-debt.md` — this is the largest factual gap in the
> project.

---

## 9. Provincial unrest

PRRI (Provincial Riot Risk Index) is 0–100. Tiers come from one function:

```
getUnrestTier(prri):  prri < 40 → CALM
                      prri < 65 → TENSE
                      prri < 85 → RIOT
                      else      → REVOLT
```

Contagion: a `REVOLT` neighbour spills 10% of its PRRI to adjacent provinces.
Migration: `RIOT`/`REVOLT` provinces shed population to `CALM`/`TENSE` ones.

**Design choice:** the thresholds are 40/65/85, not round numbers, so the tiers
are not evenly spaced. `CALM` is 40% of the range, `TENSE` 25%, `RIOT` 20%,
`REVOLT` 15% — the top tier is deliberately the hardest to enter.

`nationalRRI = round(mean(governorates[].prri))`, recomputed each turn from the
provinces rather than tracked independently. That keeps the national number
honest to the map, at the cost of letting a single quiet province mask a crisis.

> **Design gap:** `calculateProvincialPRRI` in `spatial.ts` implements a
> wage/blackout/damage/sectarian model for PRRI that is **never called**, and has
> no inline replacement. Actual PRRI only ever moves by fixed per-action deltas,
> so `monthlyFoodBasketSYP` never influences unrest. The intended feedback loop
> in `plan/01` §3.1 is not in the running game.

---

## 10. Century projection

If the player survives `MAX_TURNS = 40`:

```
economicPillar     = min(30, reservesUSD / 10e6 * 1.5)
socialPillar       = min(25, civicTrust * 0.25)
infrastructurePillar = min(25, avgReconstruction * 25)
integrityPillar    = max(0, 20 - systemicCorruption * 0.20)
finalScore         = round(sum)
```

Then a single if/else chain selects one of five national endings, plus three
southern sub-endings. **No simulation, no epochs, no year-by-year projection.**

**Design gap:** the spec's gates have drifted from the implementation — the
Sovereign Phoenix ending is missing its own documented southern-accord
prerequisite, Garrison Bastion has its RRI condition inverted relative to the
spec, Mortgaged Enclave uses leverage 35 where the spec says 25, and "The Broken
Marches" has no branch at all. See `../notes/facts/unmodelled-sectors.md`.

---

## 11. Determinism

One `PRNG` (mulberry32) is constructed per turn from `seed + turnNumber`, and
`drawEventsForTurn` is its only consumer. Same seed plus same decisions resolves
identically.

`MAX_TURNS` is 40 — 20 years of two half-year turns. It is defined once in
`constants.ts` and imported by `turn-manager.ts`; an earlier revision hard-coded
`40` at the call site, so changing the constant did nothing.

## Constant reference

| Constant | Value | Fact-checked? |
| :--- | :--- | :--- |
| `MAX_TURNS` | 40 | Design choice |
| `reservesUSD` | $320,000,000 | See `fx-reserves.md` |
| `sovereignDebtUSD` | $6,100,000,000 | **Unaudited — real figure ~$27B** |
| `treasurySYP` | 42,000,000,000 | Design choice |
| `LEGACY_DEBT_COUPON_USD` | $45,000,000 | **Unaudited** |
| `IRAN_OIL_COUPON_USD` | $25,000,000 | **Unaudited** |
| `IRAN_OIL_DEBT_USD` | $7,000,000,000 | **Unaudited — real external debt $22.3B** |
| `systemicCorruption` | 58 | Design choice (plausible range) |
| `nationalRRI` | 45 | Design choice |
| `gridCapacityMW` | 2,250 | Accurate for 2025, **outdated for 2027** |
| `dailyPowerHours` | 3.5 | Plausible |
| `monthlyFoodBasketSYP` | 19,000 | Accurate 2024, **superseded** (2.2M old SYP Dec 2025) |
| `civilServiceWageSYP` | 4,050 | Plausible |
| `civilServiceHeadcount` | 1,400,000 | Plausible (1.1–1.4M cited) |
| `politicalCapital` | 50 of 200 | Design choice |
| `SOVEREIGN_LEVERAGE_CAP` | 65 | Design choice |
| `GROWTH_TUNING.capacityBaseline` | 20 | Design choice |
| `GROWTH_TUNING.capacityRate` | 0.004 | Design choice |
| Population (14 governorates) | 23,462,346 | Verified for its vintage, **~2M low for 2026** |
| Provincial damage total | $108,206,000,000 | **Verified** — matches the World Bank |

# Monetary reform: redenomination, unpegging, and a central bank crisis

**Status: MISSING FROM GAME — and it contradicts the engine's central bank model.**

This is the newest and most consequential body of real-world fact, none of which
the simulation knows about. The game is set in **2027**; all of this happened in
**2025–2026**.

## What the game says

Effectively nothing. The game has:

- `officialRateSYP: 135` — a **frozen constant, never written by any code path**.
- An `officialRateAdjustment` directive that exists in the type and defaults to
  0, and is **read nowhere**.
- `adjustOfficialPeg()` in `currency.ts` — **dead code**, never called. Its
  threshold `adjustmentSpread > 2000` is unreachable against a 135–162 peg, so
  even if called its "substantial devaluation" trust penalty could never fire.
- A dollar auction mechanic that implies an **active central bank defending a
  level with reserves** — the exact opposite of the real situation.

## What the sources say

**The redenomination.** Two zeros removed; new 10–500 SYP notes in circulation
from **1 January 2026**; Assad imagery replaced with agricultural motifs; printed
by Goznak. About **41 trillion old SYP** was in cash before the reform, with an
estimated **40 trillion circulating outside the formal financial system** —
which the reform was explicitly designed to bring under oversight.

**The swap is still not finished.** ~35% replaced by February 2026; under 40% by
mid-March 2026; the completion deadline was pushed to end-June 2026. The extended
coexistence of two currencies "has sown confusion, opened the door to
speculation and led to greater reliance on the parallel market."

**The central bank unpegged.** Reuters, August 2025: under the new government
"the use of foreign currencies [was] outlawed" under Assad, but the new leaders
"pledged to create a free-market economy and lifted restrictions". The central
bank then pursued a **"managed unpegging of the pound"**, which Jusoor
attributes directly to its **limited ability to intervene and lack of foreign
currency reserves**. That unpegging "has contributed to rising living costs and
increased economic and social pressures."

**Leadership change.** By May 2026 the central bank governor had been replaced
(Jusoor, 24 May 2026) amid a "liquidity crisis".

**Institutional repair.** The central bank began a gap assessment with **Oliver
Wyman** to restore access to international banking, and is seeking to
**reactivate its account with the Federal Reserve Bank of New York** — "a key
step towards restoring access to dollar transactions after years of financial
isolation." Oil and gas revenue from recaptured fields is earmarked for energy,
reconstruction and services, with double-digit GDP growth targeted by the
governor (against the World Bank's 1%).

## Verdict

**MISSING FROM GAME, and the engine's central bank model is backwards.**

The World Bank and the central bank both describe the same causal chain: **no
reserves → cannot defend the peg → managed unpegging → rising prices → social
pressure.** The game models a central bank that *can* sell dollars into the
market to compress a spread it is defending, and that never moves its official
rate at all. Those are not the same institution.

The redenomination is the most significant monetary event in Syria in decades,
it is two years before the game's start date, and the game has no trace of it.

## Game impact

The highest-value additions here are all *mechanics*, not constants:

- **MISSING: redenomination as an event.** A one-shot, largely nominal
  re-denomination with uncertain credibility. The real-world lesson is
  counterintuitive and playable: it simplified transactions, cost hundreds of
  millions to print, and **did not strengthen the currency** — the pound has
  depreciated further since. A player who bets on "the zeros come off, confidence
  returns" should be able to be wrong.
- **MISSING: two currencies in parallel.** For most of 2026 old and new notes
  circulated side by side, with the coexistence itself driving speculation and
  parallel-market reliance. That is a genuinely tense, well-specified interim
  state.
- **MISSING: a reserve-constrained central bank.** The auction should be
  rationed by a *policy* choice under a reserves constraint, with the
  official/parallel spread moving as the real thing did — appreciating under
  external support, not only depreciating under seigniorage.
- **MISSING: the spread as a live variable.** `officialRateSYP` should move. Its
  being frozen means the FX-spread mechanic is decorative.
- **MISSING: banking re-access.** Fed account restoration, gap assessment,
  sanctions compliance, correspondent banking — each is a discrete, gated
  milestone that gates aid and investment flows.
- **FIX REQUIRED:** either implement `officialRateAdjustment` or delete the
  directive and `adjustOfficialPeg()`. A player-visible control that does
  nothing is worse than no control.

## Sources

- Jusoor, 24 May 2026 — managed unpegging, swap delays, governor change —
  <https://jusoor.co/en/details/central-bank-swaps-chief-as-liquidity-crisis-mounts>
- Reuters, 22 Aug 2025, via The Gazette — redenomination plan, 40tn outside the
  formal system, dollarisation lifted, 12-month coexistence —
  <https://gazette.com/2025/08/22/exclusive-syria-to-revalue-currency-dropping-two-zeros-in-bid-for-stability-64cfdc41-4f4b-57e6-a38e-92a1a02d374a/>
- The National, 23 Feb 2026 — 35% swapped, Oliver Wyman gap assessment, Fed
  account, recaptured oil and gas —
  <https://www.thenationalnews.com/news/mena/2026/02/23/syria-replaces-a-third-of-its-cash-in-weeks-after-introducing-new-currency/>
- The National, 26 Aug 2025 — redenomination as nominal adjustment only —
  <https://www.thenationalnews.com/business/economy/2025/08/26/success-of-syrias-new-currency-move-will-rely-more-on-policy-than-new-notes/>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025 — reserves, dollarisation,
  informality — <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>

See also: [exchange-rate-and-redenomination.md](exchange-rate-and-redenomination.md),
[partial-fx-reserves.md](partial-fx-reserves.md), [inflation.md](inflation.md)

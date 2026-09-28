# Exchange rate and the 2026 redenomination

**Status: PARTIAL.** The redenomination is real and the game's ÷100 convention is
correct. The exchange-rate levels are not, and the game has no model for the
monetary reform that has actually been happening.

## What the game says

`BASELINE_MACRO`:

```
officialRateSYP:  135     # "Central Bank peg"
parallelRateSYP:  162     # street rate
```

Both in **new** SYP. The README states the convention explicitly: 1 new = 100
old, so the game is representing 13,500 official and 16,200 parallel in old SYP.
That gives a **20% official-to-parallel spread**.

The game also exposes an `officialRateAdjustment` directive (`types.ts`) defaulted
to 0. It is **read nowhere** — `macro.officialRateSYP` is never written, so the
"peg" is a frozen display constant.

## What the sources say

**The redenomination is confirmed.** Syria removed two zeros from the pound.

- Announced by Central Bank Governor Abdelkader Husrieh; described as "a
  strategic pillar of fiscal and monetary reforms".
- New banknotes **entered circulation 1 January 2026**, denominations 10–500
  new SYP, printed by Goznak.
- New notes replace Assad family images with agricultural motifs (roses, wheat,
  olives, oranges).
- Roughly **41 trillion old SYP** was in cash circulation before the reform.
- A 12-month coexistence period was planned, and as of mid-2026 the swap was
  **incomplete** — around 35% replaced by February 2026, under 40% by
  mid-March, with the deadline pushed to end-June 2026.
- Purpose: reduce dollarisation, improve oversight of the ~40tn old SYP held
  outside the formal system, and restore monetary sovereignty.

**The exchange rate history:**

| Date | Rate (old SYP/USD) | Source |
| :--- | --- | --- |
| 2010 | ~47–50 | World Bank; Reuters |
| End 2024 | **14,800** (market) | World Bank MFA |
| 31 Dec 2024 | 14,420 (WB conversion rate) | World Bank damage report |
| Aug 2025 | **~10,000–11,000** | Reuters via Al Jazeera |
| 2025 (UNData) | 14,650 | UNData |

The pound **lost more than 99% of its value** since 2011, and has been
**appreciating since December 2024** on improved external conditions and
easing sanctions.

## Verdict

**PARTIAL — split three ways.**

1. **Redenomination ÷100: CORRECT.** The game's arithmetic convention matches
   what Syria actually did. This is a genuine success — and the May 2026 audit
   could not have confirmed it, because the redenomination had not happened yet.
   The audit's 13,500/16,200 "pre-redenomination units" framing is now
   retroactively validated.

2. **Official peg 135 (13,500 old): PLAUSIBLE, unverified.** No source located
   for a 13,500 official rate in the period. Al Jazeera reports the CBS stopped
   publishing balance-sheet data.

3. **Parallel rate 162 (16,200 old): TOO HIGH.** The documented market rate was
   14,800 at end-2024 and roughly 10,000–11,000 by mid-2025. The game uses a
   figure above the highest documented rate and about 50% above where the
   currency actually traded before the game's start year. The resulting
   **20% spread** is not supported by any source — the real spread between the
   managed rate and the parallel market was wider in 2024 and had largely closed
   by mid-2025.

## Game impact

- **INCORRECT IN GAME:** `parallelRateSYP: 162` overstates the pre-redenomination
  parallel rate. This propagates: it sets the real wage
  (`4,050 / 162 = $25.00`), it is the denominator for the `SECURITY_MUTINY`
  threshold, and it is the conversion rate for every SYP cost in the audit. A
  lower starting rate would make the real wage *higher* and the game slightly
  easier.
- **MISSING FROM GAME:** appreciation. The pound has been *appreciating* since
  December 2024. The engine only ever depreciates it (clamped to −25%/turn), so
  it cannot represent the actual post-collapse trend. This is the single most
  surprising macro fact of the period and the model cannot express it.
- **MISSING FROM GAME:** the currency swap itself. There is no mechanic for
  redenomination, for two currencies circulating in parallel, or for the
  incomplete swap. The World Bank and the central bank both treat FX
  availability and confidence as the binding constraint; a "swap your cash"
  event with real upside and real confusion is highly playable and entirely
  absent.
- **MISSING:** the managed unpegging. The central bank pursued a "managed
  unpegging of the pound" because it lacked reserves to defend a peg. The game
  has a peg mechanic that is dead code — the exact inverse of reality.
- **MISSING:** dollarisation as a dynamic. The new notes are explicitly aimed at
  reducing it.

See also: [monetary-reform-2026.md](monetary-reform-2026.md),
[partial-fx-reserves.md](partial-fx-reserves.md), [inflation.md](inflation.md)

## Sources

- Reuters, 22 Aug 2025, via The Gazette —
  <https://gazette.com/2025/08/22/exclusive-syria-to-revalue-currency-dropping-two-zeros-in-bid-for-stability-64cfdc41-4f4b-57e6-a38e-92a1a02d374a/>
- Al Jazeera, 5 Jan 2026 —
  <https://www.aljazeera.com/economy/2026/1/5/syrias-new-currency-removes-al-assad-family-images-seeks-to-boost-economy>
- The National, 23 Feb 2026 (35% swapped) —
  <https://www.thenationalnews.com/news/mena/2026/02/23/syria-replaces-a-third-of-its-cash-in-weeks-after-introducing-new-currency/>
- The National, 26 Aug 2025 (redenomination analysis) —
  <https://www.thenationalnews.com/business/economy/2025/08/26/success-of-syrias-new-currency-move-will-rely-more-on-policy-than-new-notes/>
- Aawsat, 25 Dec 2025 (1 Jan 2026 start date) —
  <https://english.aawsat.com/arab-world/5223092-syria-start-currency-swap-january-1st-central-bank-governor-says>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025 (14,800 market rate) —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- UNData Syria (14,650) — <https://data.un.org/en/iso/sy.html>

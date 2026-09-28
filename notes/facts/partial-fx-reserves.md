# Foreign exchange reserves: $320 million

**Status: PARTIAL.** Directionally right, magnitude unconfirmed, and the only
published figure located is lower than the game's.

## What the game says

```ts
// src/lib/engine/constants.ts
reservesUSD: 320_000_000,   // $320M FX liquid reserves (~2.4 months import cover)
```

The figure-check report asserted a real-world range of **$320M–$450M**, citing
"IMF, EIU, and independent economists".

## What the sources say

- **~$200 million.** Toward the end of 2025 an unnamed official told Reuters the
  Central Bank of Syria "had just $200m in foreign exchange reserves". Reported
  by Al Jazeera, 5 January 2026.
- For contrast, reserves were **$17–19.5 billion at end-2010**, covering roughly
  nine months of total imports.
- The World Bank *Macro-Fiscal Assessment* has an entire section titled
  *"Syria's Foreign Reserves Have Been Almost Depleted"* and states reserves
  "have almost been depleted completely."
- The central bank pursued a **managed unpegging** of the pound specifically
  because of its **limited ability to intervene and lack of foreign currency
  reserves**.
- The **World Bank cleared a $15.5 million** Syria arrears balance in May 2025,
  and allocated **$146 million** in June 2025 to restore electricity supply.
  Relative to a $200M stock, these are small but not trivial.

## Verdict

**PARTIAL.** The qualitative claim — reserves are nearly exhausted, down by over
an order of magnitude from 2010 — is firmly supported. The specific number is
not.

- The only concrete figure located in this pass is **~$200M**, sourced to an
  unnamed official via Reuters, versus the game's **$320M**. The game is ~60%
  higher.
- The fact-check report's "$320M–$450M" range could not be traced to any IMF, EIU
  or other publication. The report's own citation for most claims is the
  git-ignored design document, and for this one the reference was a placeholder
  (`sfuturem.org`).
- The game's "~2.4 months import cover" gloss is not supported by any source
  located.

$320M is not absurd for early 2027 — reserves could plausibly have been rebuilt
from Gulf and World Bank inflows. But it is a **design choice presented as a
sourced fact**, and it is 60% above the last figure anyone published.

## Game impact

- **UNSOURCED:** `reservesUSD`. The number is load-bearing — it is the
  denominator in the FX drain term, the trigger for `SOVEREIGN_INSOLVENCY`, and
  the ceiling on the dollar auction. A 60% error in it propagates through the
  entire difficulty curve.
- **The game is easier than reality** on this axis, which compounds the
  understatement in [sovereign-debt.md](sovereign-debt.md). Together they mean
  the player starts with far more breathing room than the historical situation
  allowed.
- **MISSING FROM GAME:** the *mechanism* behind the reserve constraint is far more
  interesting than the level. In reality the central bank could not defend a peg
  because it had no reserves, which forced a managed unpegging. In the game
  reserves are just a number that drains, and the peg never moves at all.

**Recommendation:** either source $320M properly or relabel it as a chosen
starting position. Do not leave it attributed to IMF/EIU figures that cannot be
produced.

## Sources

- Al Jazeera, 5 Jan 2026 (~$200M reserves, $17bn in 2010) —
  <https://www.aljazeera.com/economy/2026/1/5/syrias-new-currency-removes-al-assad-family-images-seeks-to-boost-economy>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025, §16 "Foreign reserves
  have almost been depleted" —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- Jusoor, 24 May 2026 (managed unpegging; swap delays) —
  <https://jusoor.co/en/details/central-bank-swaps-chief-as-liquidity-crisis-mounts>
- The National, 21 Oct 2025 ($15.5M arrears cleared; $146M for electricity) —
  <https://www.thenationalnews.com/business/economy/2025/10/21/syrias-post-war-reconstruction-costs-estimated-at-216bn-says-world-bank/>

See also: [sovereign-debt.md](sovereign-debt.md),
[exchange-rate-and-redenomination.md](exchange-rate-and-redenomination.md)

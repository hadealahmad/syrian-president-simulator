# Russian port and phosphate concessions: terminated and re-concessioned

**Status: VERIFIED — and the game has the direction exactly backwards.**

> The 49-year concessions **do not exist in 2026**. Both were cancelled in
> January 2025 and replaced. The game lets the player *pledge* Tartus and
> Khnifis to foreign creditors; by the game's 2027 start date, the real Syria had
> **taken both back** and re-signed them with new partners.

This is the single most consequential factual error in the project, because the
mechanic is not just mis-scaled — it is **inverted**.

## What the game says

`BASELINE_SOVEREIGN_MORTGAGES` — two player actions, each granting cash at a
leverage and trust cost:

| Mortgage | Effect |
| :--- | :--- |
| `mortgage_tartus_port` | `immediateCashUSD` (large), leverage −14, trust −5 |
| `mortgage_khneifis_phosphate` | `immediateCashUSD`, leverage −14, trust −5 |

Phosphate is also a recurring revenue line in `revenues.ts`, and the
`mortgaged_enclave` century ending is gated on low leverage plus high debt. The
40-turn endings test **actively relies on this**: it reaches `mortgaged_enclave`
by signing all three foreign loans *and* executing the Tartus mortgage, arriving
at leverage 27 and debt $7.35B.

## What the sources say — Tartus

**The concession existed and was 49 years.**

Signed 2019 between the Assad government and **Stroytransgaz (STG)**. Stroytransgaz
agreed to invest **>$500M**. It received **65% of the port's profits**, with 35%
going to the Assad government.

**January 2025 — terminated.** Syria's new authorities cancelled the contract in
the week of 22 January. Tartous customs head **Riyad Judi** told the semi-official
*Al-Watan* that the investment contract had been annulled because STG had **failed
to fulfil the infrastructure-investment terms** of the 2019 deal.

**February 2025 — disputed.** STG Engineering CEO **Dmitry Trifonov** told Reuters
the company was still managing the port and had not been notified of annulment.
The termination was contested for roughly a year.

**August 2026 — replaced.** Syria signed an **$800 million, 30-year** terminal and
logistics concession with **DP World** (UAE). The first civilian wheat and cement
shipments arrived at the formerly-Russian **Pier No. 4 on 12 August 2026**. The
General Authority for Ports and Customs took over Pier No. 4, its warehouses and
all commercial operations.

**10 August 2026 — military handover.** A Syria–Russia memorandum brought
**Hmeimim airport** and **Tartus** civilian sectors under Syrian control within
**90 days**; active Russian combat outposts become **joint training and
qualification centres**. Forbes (Aug 2026) describes this as ending Russian
autonomous control of sites "previously under Russian dominance with a 49-year
lease granted by the Assad regime."

## What the sources say — phosphate

**The concession existed and was 50 years.**

- **2017** — Stroytransgaz began extracting at **Khneifis and al-Sharqiya**.
- **26 March 2018** — the People's Assembly ratified an agreement between the
  General Establishment of Geology and Mineral Resources and Stroytransgaz:
  investment in Palmyra-area phosphate for **50 years**, targeting **2.2 million
  tons/year** from a reserve of **105 million tons**.
- Stroytransgaz is owned by **Gennady Timchenko**; per a Russian diplomatic
  source, it is 50/50 Russian and Syrian, the Syrian half held by a company close
  to the Assad regime.
- **December 2023** — PM Hussein Arnous requested a review and to "explore
  alternative options". Pre-collapse intent to cancel.
- **January 2025** — the interim government moved to cancel. As of March 2025
  Enab Baladi reported **no formal cancellation decision** had been issued and the
  Ministry of Oil had not responded; investments intended for the Russian
  companies were **frozen** after Assad's fall.
- **December 2025** — Syria signed a cooperation agreement with the **Serbian
  company Elixir Group** for exploration and export of **1.5 million tons** of
  phosphate in 2026, **ending the Russian monopoly** in the sector.
- **25 November 2025** — Energy Minister **Mohammed al-Bashir** reopened the
  **Sharqiya phosphate wash and drying plant** after a **ten-year hiatus**,
  capacity **1.2 million tons/year**, with a national target of **7–8 million tons**.

Context: Khneifis lies 50–75 km southwest of Palmyra, ~160 km southwest of Homs,
and is Syria's largest phosphate mine at ~1.1M tons/year historically. Syrian
phosphate **exports fell almost 80% in H1 2025** before the recovery.

## Verdict

**The claim in the fact-check report was historically correct. Its relevance to a
2027 game is nil.**

The report's `[VERIFIED FACTUAL]` — 49-year Tartus lease to Stroytransgaz, 2018,
50-year phosphate concession — all checks out. But every element of it was
**cancelled before the game is set**, and the assets were **re-signed to other
foreign partners** (DP World/UAE at Tartus, Elixir Group/Serbia in phosphate).

The real 2027 position:

| Asset | Game says | Reality in 2026 |
| :--- | :--- | :--- |
| Tartus | Available to pledge to a creditor | **Re-concessioned to DP World, 30 years, $800M** |
| Khnifis / Sharqiya | Available to pledge | **State-operated directly + Serbian partnership** |
| Russian role | Creditor with leverage over Syria | **Excluded from both**; retains only military training ties |

## Game impact

**The mechanic is backwards.** In 2027 Syria's problem is not finding a creditor
willing to accept a mortgage — it is that its two most valuable national assets
are **freshly pledged to third parties for 30 years**, which is a *worse* fiscal
position than owning them outright, and one the state cannot undo.

- **INCORRECT IN GAME:** `mortgage_tartus_port` and
  `mortgage_khneifis_phosphate` model an instrument that no longer exists.
- **A REACHABLE ENDING IS BUILT ON IT.** `mortgaged_enclave` requires executing
  the Tartus mortgage. That ending is not just unsourced — it is unreachable in
  the actual historical situation, because the asset is already mortgaged to
  someone else.
- **MISSING FROM GAME: the recapture direction.** The real 2025–2026 story is the
  state *recovering* national assets and then re-concessioning them under its own
  terms. A mechanic where the player can **renegotiate or reclaim** a concession
  is both more accurate and more interesting: a 30-year DP World lease signed in
  2026 is a live, exploitable constraint on a 2027 player.
- **MISSING: the profit-split arithmetic.** The old deal gave the foreign operator
  **65% of profits**. The DP World and Elixir arrangements presumably have
  comparable terms. A revenue-share mechanic is a better fit than a one-off cash
  payment, and it recurs.
- **CORRECTED IN GAME (mechanic inverted).** `mortgage_tartus_port` is no longer a
  pledge of a Russian lease: it is now *negotiating a buy-back of the DP World
  concession Syria has already granted* — 30 years (not 49), $150M up front
  (not $450M) because that is what a counterparty pays to release it early, and a
  $55M/turn revenue loss with a sovereign penalty about losing Gulf investor
  confidence. `mortgage_khneifis_phosphate` is reframed as a **state-owned**
  asset (Sharqiya reopened Nov 2025, Elixir partnership Dec 2025) and is now the
  one strategic reserve the state genuinely still owns, so it remains pledgeable.
- **STRUCTURAL (still open):** the mechanic grants cash with **no repayment
  obligation and no expiry**, and `SOVEREIGN_LEVERAGE_CAP = 65` equals baseline
  leverage — so mortgaging is close to a free win on the leverage axis. A
  revenue-share obligation matching the historical 65/35 profit split would be a
  better fit than a one-off payment.

## Sources

**Tartus**
- Reuters, 24 Jan 2025 (cancellation) —
  <https://www.reuters.com/world/middle-east/syria-cancels-port-management-contract-with-russian-firm-sources-say-2025-01-24/>
- Reuters, 28 Feb 2025 (STG disputes) —
  <https://www.reuters.com/business/russian-operator-syrias-tartous-port-dismisses-reports-it-has-lost-its-contract-2025-02-28/>
- Al-Monitor, 22 Jan 2025 (49-year term, 65/35 profit split, >$500M investment) —
  <https://www.al-monitor.com/originals/2025/01/syrias-new-government-ends-russian-lease-tartous-port-what-we-know>
- DP World $800M / 30-year replacement; Pier 4 handover —
  <https://conven.org/syria/news/damascus-retakes-control-of-hmeimeem-airport-and-tartous-berth-as-russian-presence-is-reorganised/>
- Newsformal, 15 Aug 2026 (DP World deal, 12 Aug first shipments) —
  <https://www.newsformal.com/energy/syria-reclaims-oil-and-port-assets-as-western-and-gulf-deals-erode-russias-role>
- Azat TV, 10 Aug 2026 (Hmeimim/Tartus MoU, 90-day handover) —
  <https://azat.tv/en/syria-russia-agreement-hmeimim-tartous-transition-2026/>
- Forbes, 23 Aug 2026 — <https://www.forbes.com/sites/pauliddon/2026/08/23/russia-never-realized-full-potential-of-syrias-tartus-naval-base-and-never-will/>

**Phosphate**
- Enab Baladi, 26 Mar 2025 (50-year 2018 contract, 2.2M t/y target, cancellation
  status) — <https://english.enabbaladi.net/archives/2025/03/struggle-for-syrian-phosphate-awaits-fate-of-russian-contract/>
- Pravda Egypt / Elixir Group agreement, 19 Dec 2025 —
  <https://egypt.news-pravda.com/en/world/2025/12/19/11020.html>
- Anadolu, 25 Nov 2025 (Sharqiya plant reopening, 1.2M t/y) —
  <https://www.aa.com.tr/en/middle-east/syria-restarts-major-phosphate-plant-in-homs-after-10-year-shutdown/3753905>
- BCI Insight, 29 Jan 2026 (exports −80% in H1 2025) —
  <https://www.bcinsight.crugroup.com/2026/01/29/syria-restarts-sharqiya-phosphate-washing-and-drying-plant/>
- RFE/RL (Stroytransgaz / Timchenko ownership) —
  <https://www.rferl.org/a/russia-surovikin-syria-deal-navalny/32126030.html>
- NTI Deposit No. 1188 (Khneifis geography and output) —
  <https://www.nti.org/education-center/facilities/deposit-no-1188/>

See also: [unmodelled-sectors.md](unmodelled-sectors.md),
[sovereign-debt.md](sovereign-debt.md),
[confiscated-assets-and-restitution.md](confiscated-assets-and-restitution.md)

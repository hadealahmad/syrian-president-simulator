# Unmodelled sectors and dynamics

**Status: the gap list.** Real, sourced dynamics that the simulation omits
entirely. Read this before changing any constant — several of the entries below
matter more to gameplay than the constants that *are* in the engine.

Ordered by how much they would change play, not by size.

---

## 1. Sovereign debt at the correct magnitude

**INCORRECT — see [sovereign-debt.md](sovereign-debt.md).** The game recognises
$6.1B against a real ~$27B total / $22.3B external (128% of GDP). The $45M flat
legacy coupon has no basis. This single line is the dominant driver of game
difficulty, and the `mortgaged_enclave` ending's $12B threshold is already half
met at the understated baseline.

**Missing mechanics that follow from it:** debt/GDP ratio, maturity profile,
creditor haircuts, arrears and rescheduling, and a Paris Club negotiation. A
128%-of-GDP debt stock has an obvious real-world resolution — a haircut — and it
is the most interesting fiscal decision available to a president of Syria.

---

## 2. No inflation model

**MISSING — see [inflation.md](inflation.md).** `annualInflationPct` exists as a
field and is never read or written by the engine. All seigniorage consequences
route through the FX rate alone.

Reality: CPI averaged 54.4% (2011–2024), was 72.1% in 2024, fell to ~11.5% in
2025, then re-accelerated to **triple digits** around the redenomination. Money
printing in Syria destroys household purchasing power far faster than it
depreciates the currency, and the game models only the second effect.

Missing: a price level, CPI feedback into the real wage, and a wage-price spiral.

---

## 3. No return migration

**MISSING — see [outdated-population-and-displacement.md](outdated-population-and-displacement.md).**
Over **1,000,000 refugees** and **1,900,000 IDPs** returned since December 2024.
The game seeds `migrationLedger` with four *outflow* corridors and models only
flight from unrest.

Returning people plausibly raise food and housing pressure on host
governorates, add construction and agricultural labour, and strain political
capital. The game has no mechanic for arrivals, and its population is ~2M below
every current estimate (24.4–26.1M).

---

## 4. The off-grid solar boom

**MISSING — see [outdated-electricity-grid.md](outdated-electricity-grid.md).**
Cross-validated local expert estimates put off-grid solar at **>2,200 MW** — 73%
of aggregate centralised generating capacity as of December 2025, mostly
stand-alone, wasting **up to 40%** of output.

The game models only a central grid improved by CapEx. In reality the most
important source of new generation in Syria is distributed, unwired, untaxed and
undispatchable. That is a ready-made tension — a huge private generation fleet
that does nothing for grid stability — and it is the obvious answer to the
energy deck's energy-shortage cards.

---

## 5. Fuel supply, not just generation capacity

**MISSING.** The Ministry of Energy notes installed capacity could reach
**4,500 MW if fuel were sufficient**, and the actual 1,600 → 2,250 → 3,000 MW
recovery was driven by gas resupply from **Qatar, then Jordan via the Arab Gas
Pipeline, and Azerbaijan via Türkiye (SOCAR)**. Power generation fell from 43 TWh
(2010) to 16 TWh (2015) largely on fuel supply, not on plant damage alone.

The game improves the grid only through the player's `gridCapExUSD`, scaled by
ministry competence. There is no fuel supply chain, no transit dependence, and no
route to the recovery that actually happened.

Related: the game's 8,500 MW "demand" figure appears to be pre-war *installed
capacity*; independent experts put current demand at **5,000–7,000 MW**, so the
modelled deficit is larger than reality.

---

## 5b. No reconstruction institution

**MISSING.** **Decree 59 of 2026** (issued 8 March) established a national
committee to rehabilitate infrastructure in destroyed areas ahead of returns —
chaired by the Minister of Emergency and Disaster Management, with the finance,
public works, social affairs and local administration ministers, the governors of
**Aleppo, Hama and Idlib**, and the foreign ministry's international cooperation
director. It **meets every 15 days** and files a **monthly report to the
Presidency**, and has a **financial subcommittee** for budgets.

The game has Raed al-Saleh as emergency minister and models $216B of
reconstruction as a number, but no institution, no reporting clock, and no
separate budget channel. Northern Syria still holds ~800 camps with 120,000+
people. See [decrees-59-98-100-101.md](decrees-59-98-100-101.md).

## 5c. No citizenship or registration question

**MISSING.** **Decree 13 of 2026** abolished the laws and exceptional measures
arising from the **1962 Hasakah census**, granted nationality to Kurdish-origin
residents including those **previously unregistered**, and made **Nowruz a paid
national holiday**. The game has no citizenship, registration or documentation
axis at all — arguably the largest unmodelled social question in the project.

## 6. No legislature

**MISSING — see [constitutional-declaration.md](constitutional-declaration.md).**
The **People's Assembly was seated on 12 July 2026**, five months before the
game's 2027 start. A Supreme Constitutional Court was established 11 July 2026.
The game has a pure presidential system with 8 ministries and 5 commissions and
no legislature at all.

Also missing: the **five-year transition clock**. The Constitutional Declaration
expires in 2030; a 2027-start 40-turn game runs to 2046 — three transitions past
its life.

---

## 7. No military budget

**MISSING — see [national-budget.md](national-budget.md).** The World Bank
explicitly excludes "off-budget military and electricity subsidies" from its
headline deficit, so the published 10%-of-GDP average *understates* the fiscal
hole. `fail-states.ts` reuses `civilServiceWageSYP` as the *soldier* wage, which
is a stand-in for a budget category the engine does not have.

A defence budget is one of the most natural spending levers a Syrian president
would actually control, and it is the category whose absence makes the published
deficit figures misleading.

---

## 8. Aid flows and banking re-access

**MISSING.** Net ODA received was **40.21% of GNI (2025)**. For scale, the World
Bank cleared a **$15.5M** Syria arrears balance in May 2025 and allocated **$146M**
in June 2025 for electricity restoration.

The central bank is working through an **Oliver Wyman** gap assessment and seeking
to **reactivate its Federal Reserve Bank of New York account**. Aid and
re-access are gated, discrete, milestone-shaped processes — the natural shape of
event cards, and the game has no equivalent.

---

## 9. No oil and gas sector — and the recapture already happened

**MISSING, and the single largest verified change the game misses.** In
**February 2026 the transitional government regained control of key oil and gas
areas, raising its share of national oil production from ~20% to 88%**
(World Bank). Crude reserves ~2.5bn barrels; gas proven reserves 240.7 BCM.
Port throughput at Tartous and Latakia is running ~300,000 t/month of imports
with a "heavy crude shipment in 14 years" recorded.

The game has `IRAN_OIL_*` debt constants but **no oil production, no gas supply
and no recaptured-fields mechanic** — despite a 6-card energy deck. An 88%
production share achieved in a single month is the kind of step-change the
fiscal engine should be able to represent.

## 9b. Multiple competing currencies

**MISSING.** Real business practice in Syria runs on **the Turkish lira, the US
dollar and the Syrian pound simultaneously**, and UNDP names "competing
currencies" as a core business-environment problem. A manufacturing owner in
Idleb describes exchange-rate volatility in the lira making pricing impossible.

The game has exactly one domestic currency plus USD reserves. The lira — a third
currency, regionally dominant, and the vehicle for most Turkish imports — is
absent. So is the accounting problem.

## 9c. Cheap Turkish import competition

**MISSING.** Turkey's exports to Syria reached **~$508M in Q1 2025, up 31.2%**
year on year. Local producers report being unable to compete with Turkish
imports on price. Manufacturing output fell from **428.4bn SYP (2010) to
261bn SYP (2024)** and private services contracted to roughly one third.

The game has no external price-competition pressure on domestic producers, and
no manufacturing sector to lose.

---

## 10. The redenomination and central bank crisis

**MISSING and contradictory — see
[monetary-reform-2026.md](monetary-reform-2026.md).** Two zeros came off the
pound on 1 January 2026; the swap was still incomplete in mid-2026; the central
bank pursued a **managed unpegging** because it lacked reserves; the governor
was replaced by May 2026.

The game has a **frozen** `officialRateSYP` that no code path writes, an
`officialRateAdjustment` directive that is read nowhere, and a dollar auction
that presumes a central bank defending a level it cannot defend. The engine's
central bank model is the inverse of the real one.

---

## 11. Cumulative losses vastly exceed modelled damage

**PARTIAL.** The game's $108.2B damage figure is verified, but UNDP puts
**cumulative losses including physical damage *and* economic deprivation at
>$923 billion** as of end-2025. The economic-deprivation leg is ~8.5× the
damage leg and is not modelled at all.

---

## 13. Sovereign concessions run the wrong way

**INVERTED — see [russian-concessions-terminated.md](russian-concessions-terminated.md).**
The 49-year Tartus lease to Stroytransgaz and the 50-year Palmyra phosphate
concession were both **cancelled in January 2025** and replaced — Tartus by a
**$800M / 30-year DP World (UAE) concession** (first shipments 12 August 2026),
phosphate by a **Serbian Elixir Group** partnership plus direct state operation.
The game lets the player *pledge* these assets; by its 2027 start date they are
already pledged to third parties.

## 14. Selective restitution as an investment channel

**MISSING — see [confiscated-assets-and-restitution.md](confiscated-assets-and-restitution.md).**
The state cannot restitute property to the ~320,000 people affected, but it
unfroze the assets of 14 named individuals — and one of them immediately signed a
**$7 billion, 5,000 MW energy project** with the government (MoU 29 May 2025,
following Finance Ministry Decision 963 of 2 July 2025). Separately, **€51M**
was restituted from France under a 2021 law on 7 July 2026.

## 15. The Suwayda and northeast fronts

**MISSING.** Suwayda is in a de facto fragmented state with only a fragile calm;
a **US–Jordan roadmap** agreed 16 September 2025 is "moving slowly"; **155,000
remain displaced**; and a **second front** opened in **January 2026** when
clashes with the Kurdish-led SDF killed 23 and displaced over 100,000. Israel
conducted airstrikes in July 2025 and was implicated in an April 2026
assassination. The game has no SDF and models Israel passively.

## 16. Climate and drought

**MISSING.** Projected **1.5–2.0°C warming by 2050** with a **10–20% decrease in
precipitation** (IPCC AR6 via UN CCA), elevated drought frequency, and worsening
groundwater depletion. The 8-card agriculture deck handles food shocks
reactively; there is no slow-moving climate trend behind them.

---

## Summary table

| # | Gap | Type | Magnitude |
| :--- | :--- | :--- | :--- |
| 1 | Debt at $27B not $6.1B | Incorrect | Gameplay-dominant |
| 2 | No inflation model | Missing | Very high |
| 3 | No return migration | Missing | High |
| 4 | Off-grid solar (>2,200 MW) | Missing | High |
| 5 | Fuel supply chain | Missing | High |
| 6 | No legislature / transition clock | Missing | Medium-high |
| 7 | No military budget | Missing | Medium |
| 8 | Aid flows / banking re-access | Missing | Medium |
| 9 | No oil & gas (88% recaptured Feb 2026) | Missing | High |
| 9b | Multiple competing currencies (lira/USD/SYP) | Missing | High |
| 9c | Turkish import competition | Missing | Medium |
| 13 | Concessions run the wrong way | Inverted | Very high |
| 5b | No reconstruction institution (Decree 59) | Missing | High |
| 5c | No citizenship/registration (Decree 13/2026) | Missing | High |
| 10 | Redenomination / unpegging | Missing + wrong | High |
| 11 | $923B cumulative losses | Partial | Framing |
| 12 | Climate / drought trend | Missing | Medium |


## Primary sources

Every figure in this file is sourced in the linked fact file. The sources
underlying the highest-severity entries:

- World Bank *Syria Macro-Fiscal Assessment*, June 2025 — debt ($27B / $22.3B
  external), reserves, inflation, budget, exchange rate, informality —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank Syria Macro-Fiscal Outlook, July 2025 — WFP basket, poverty lines,
  2025 inflation and fiscal balance —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>
- World Bank *Physical Damage and Reconstruction Assessment 2011–2024* — GDP,
  damage, reconstruction, exchange rate at 31 Dec 2024 —
  <https://documents1.worldbank.org/curated/en/099102025095540101/pdf/P510947-f30bd5f6-78d5-4712-9f1e-a558b5c8ba75.pdf>
- IDOS Discussion Paper 6/2026 — electricity generation, MW figures, off-grid
  solar, fuel supply —
  <https://www.idos-research.de/fileadmin/user_upload/pdfs/publikationen/discussion_paper/2026/DP_6.2026.pdf>
- UN Common Country Analysis (Syria) — population, displacement, returns,
  power capacity, climate projections —
  <https://syria.un.org/sites/default/files/remote-resources/0ebedb4696282d412da50442b4a40915.pdf>
- SANA decree archive — primary decree texts —
  <https://archive.sana.sy/en/?p=355958>

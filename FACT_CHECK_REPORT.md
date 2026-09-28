# Syria Post-War Economic Simulation: Comprehensive Empirical Fact-Check Report

> ## ⚠️ Status of this document — read before relying on it
>
> **This report is a point-in-time audit of a design that has since changed. Its
> code references and headline claims were re-checked on 2026-09-28; the
> corrections are listed below. Two structural limits cannot be fixed by editing
> this file:**
>
> 1. **The primary cited source is not in this repository.**
>    `Syria Post-War Economic Simulation Design.md` is listed in `.gitignore`
>    (line 31) and is not present on disk. Every `Design Doc Line N` citation
>    below (~20 of them) therefore **cannot be independently verified** by a
>    reader of this repo. Treat those rows as unverifiable provenance, not as
>    confirmed line-level references.
> 2. **No external source was re-checked.** The World Bank / UN OCHA / UNMAS /
>    WFP / FAO / IATA figures were transcribed in the original audit pass. The
>    re-check confirmed the *code* matches what the report says the code says;
>    it did not re-verify the underlying real-world figures. Confirm any figure
>    you intend to publish against the primary source directly.
>
> **What *was* verified on 2026-09-28:** all in-game constant values, all 14
> governorate damage and population figures and their totals, the existence of
> every cited event ID, and the four Section 7 remediation claims. Corrections
> applied: 5 dead file/line references, 4 dead event IDs, 1 phantom citation
> (`sfuturem.org`), and the unreconciled 94.2% / 100% headline scores.

**Audit Date:** May 2026 / Turn 1 Baseline Audit
**Code references re-verified:** 2026-09-28
**Audited Sources:**
- `Syria Post-War Economic Simulation Design.md` — ⚠️ **not present in this repository** (gitignored, `.gitignore:31`). Cited below for provenance only; line references unverifiable.
- `plan/01_macroeconomic_and_fiscal_engine.md` — ⚠️ **gitignored** (`.gitignore:27`) and part of a directory whose own `plan/README.md:4` declares it superseded design history
- `plan/02_spatial_provincial_systems.md` — same status as above
- `plan/03_governance_institutions_and_decrees.md` — same status as above
- `plan/04_game_loop_and_turn_lifecycle.md` — same status as above
- `plan/05_event_engine_and_deck_ledger.md` — same status as above
- Codebase constants and event decks (present and re-verified): [`src/lib/engine/constants.ts`](src/lib/engine/constants.ts), [`src/lib/engine/baseline.ts`](src/lib/engine/baseline.ts), [`src/lib/engine/revenues.ts`](src/lib/engine/revenues.ts), [`src/lib/engine/deck/`](src/lib/engine/deck/) (all ten deck files)

> **Removed reference:** the original header also listed `src/lib/ui/PresidentGuideModal.svelte`. No such file exists; the in-game guide is now `src/lib/ui/GuideTour.svelte` + `guide-tour.ts` + `tour-steps.ts`.

---

## Executive Summary

This independent audit cross-references every empirical claim, economic metric, demographic census, legal decree, provincial damage figure, and infrastructure parameter against primary documentation from the **World Bank**, **UN OCHA (Humanitarian Needs Overview)**, **UNMAS (UN Mine Action Service)**, **WFP (World Food Programme)**, **FAO**, **IATA**, and official legislative bulletins issued by the Syrian transitional authorities following the December 8, 2024 fall of the Assad regime.

### Overall Verification Summary
- **Audit coverage:** 36 empirical claims carry a verdict — **33 `[VERIFIED FACTUAL]`**, **3 `[PARTIALLY FACTUAL (NUANCED)]`**. Unqualified claims: 33/36 (91.7%); claims fully or substantially confirmed: 34/36 (94.4%).
- **Corrected 2026-09-28:** the previous headline claimed "94.2%" with no stated denominator, and the Conclusion separately claimed "100% factual fidelity". Neither number was reproducible from the report's own contents and they were mutually inconsistent. The figures above are derived from the verdict tallies in this document and can be re-derived by counting them.
- **Not audited at all** — see [Section 6 addendum](#section-6-addendum-unaudited-sovereign-liabilities): the entire debt and sovereign-liability parameter set (the $45M legacy coupon, the $25M Iran coupon, the $7B Iran oil ledger, the $6.1B recognized debt stock, the three foreign loan packages, and the two sovereign mortgages). Section 6 is titled "Sovereign Liabilities" but originally contained no liability figures. These numbers are unaudited design choices, not verified facts.
- **Notable Discoveries:**
  1. **World Bank Damage Assessment:** The $216B national reconstruction-needs figure is World Bank context; the 14 provincial damage figures stored in-game (`unrepairedDamageUSD`, rounded to the nearest $10M) track Table 1 of the World Bank's *The Syrian Conflict: Physical Damage and Reconstruction Assessment (2011–2024)* (Aleppo $30.86B, Rif Dimashq $22.30B, Homs $10.83B, down to Tartus $383M). Re-verified 2026-09-28: all 14 match, total **$108,206,000,000**.
  2. **UN OCHA Demographics:** The total population (23.46M) and provincial host, IDP, and returnee counts across all 14 governorates match the official UNOCHA 2024–2025 HNO baseline dataset. Re-verified 2026-09-28: all 14 match, total **23,462,346**.
  3. **Cabinet & Decrees:** Key historical figures (Ahmed al-Sharaa, Mohammed al-Bashir, Dr. Nidal al-Shaar, Raed al-Saleh, Abdulrahman al-Aama, Qutaiba Badawi) and presidential decrees (Decree 13, 16, 19, 20, 59, 98/100/101) represent actual legal and institutional developments in post-Assad Syria. Re-verified 2026-09-28: decrees 98, 100 and 101 are all present in `BASELINE_MINISTRIES` / `BASELINE_COMMISSIONS`, and Decree 20 on the transitional-justice commission.
  4. **Corrections Identified:** A minor decree numbering inversion exists between Decree 19 (Missing Persons) and Decree 20 (Transitional Justice); the May 2026 ministerial reshuffle was a three-decree bundle (Decrees 98, 100, and 101); and residual mentions of Law 10 and M5 checkpoints remain in certain code/documentation fields despite policy removal.

---

## Audit Section 1: Macroeconomics, Fiscal Engine & Demographics

| # | Claim in Game / Documentation | Code Location / Doc Ref | Real-World Empirical Finding & Citation | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 1.1 | **Nominal GDP is ~$21.4 Billion USD** (contracted from pre-war peak of $67.5B in 2011). | Design-doc context only — **no `gdpUSD` field exists in `BASELINE_MACRO`** (`src/lib/engine/constants.ts:17-37`) | **Verified (real-world figure) with corrected code ref.** World Bank *Syria Economic Monitor* and *Physical Damage Assessment (2011–2024)* peg Syria's nominal 2024 GDP at ~$21.4B, down ~68% from the 2010–2011 peak of $67.5B. The figure informs the design but is not stored as a baseline constant in code. | `[VERIFIED FACTUAL]` |
| 1.2 | **Reconstruction Cost is $216.0 Billion USD** (Breakdown: $82B infrastructure, $75B residential, $59B commercial/public). | Per-governorate `unrepairedDamageUSD` in `BASELINE_GOVERNORATES` (sums to ~$108.2B damage) — **no `reconstructionDeficitUSD` scalar exists in `BASELINE_MACRO`** (`src/lib/engine/constants.ts:17-37`) | **Verified (real-world figure) with corrected code ref.** Exact baseline figure from the World Bank report *The Syrian Conflict: Physical Damage and Reconstruction Assessment (2011–2024)*. Direct physical damage is estimated at $108B; total reconstruction needs are estimated at $216B ($82B infra, $75B residential, $59B non-residential). Code stores the damage leg per governorate; the $216B reconstruction-need figure is design context, not a stored constant. | `[VERIFIED FACTUAL]` |
| 1.3 | **National Budget is ~35.5 Trillion SYP (~$2.5B–$2.8B USD).** | `Design Doc Line 31`<br>`plan/01 Section 2` | **Verified.** The Syrian state budget for fiscal year 2024 was enacted at 35.5 trillion SYP (26.5T current expenditures, 9.0T investment capital), worth ~$2.8B at late 2024 rates. | `[VERIFIED FACTUAL]` |
| 1.4 | **FX Liquid Reserves are $320M – $450M USD** (< 3 months import cover). | `BASELINE_MACRO.reservesUSD: 320_000_000` (`src/lib/engine/constants.ts:19`)<br>`Design Doc Line 30` | **Verified.** CBS suspended official balance sheet releases, but IMF, EIU, and independent economists estimated usable liquid cash reserves were depleted to $300M–$450M prior to external stabilization. | `[VERIFIED FACTUAL]` |
| 1.5 | **Exchange Rate Dual Spread:** Official Central Bank peg at 13,500 SYP/USD vs. Parallel street rate at 15,000–16,200 SYP/USD (pre-redenomination units). | `BASELINE_MACRO.officialRateSYP: 135`<br>`BASELINE_MACRO.parallelRateSYP: 162` (`src/lib/engine/constants.ts:21-22`, new SYP = old SYP ÷ 100) | **Partially Factual / Chronologically Nuanced.** In late 2024 prior to regime collapse, the CBS official remittance bulletin hovered around 13,500 SYP while street trading fluctuated between 14,800 and 16,200 SYP. On Dec 17–18, 2024, the transitional central bank unified the rate around 15,000 SYP. Keeping a spread in simulation reflects ongoing parallel market premiums. Code stores redenominated new-SYP values (135 / 162); the 13,500 / 16,200 figures above are the equivalent pre-redenomination (old-SYP) quotes. | `[PARTIALLY FACTUAL (NUANCED)]` |
| 1.6 | **Operational Electrical Grid is 2,100–2,250 MW** against 8,500 MW unconstrained national demand (2–4 hours grid power/day). | `BASELINE_MACRO.dailyPowerHours: 3.5`<br>`Design Doc Line 35` | **Verified.** Syrian Ministry of Electricity and PEEG reported operational generation of ~2,100–2,250 MW in 2023–2024 (down 75% from 8,500 MW pre-war installed capacity). Rationing delivered only 2–4 hours of power daily across most governorates. | `[VERIFIED FACTUAL]` |
| 1.7 | **90% of Population Below Poverty Line ($3.00/day).** | `Design Doc Line 37`<br>`plan/01 Section 2` | **Verified.** UN OCHA, WFP, and World Bank socioeconomic updates report that over 85–90% of Syria's resident population lives below the national and extreme international poverty lines. | `[VERIFIED FACTUAL]` |
| 1.8 | **Standard 5-Person Food Basket (MEB) is 1.9M old-SYP/month**; average civil service wage of ~405,000 old-SYP covers only ~21% of food basket. | `monthlyFoodBasketSYP: 19_000`<br>`civilServiceWageSYP: 4_050` (`src/lib/engine/constants.ts:23-24`, new SYP = old SYP ÷ 100) | **Verified.** WFP Market Price Bulletins for 2024 showed the standard family food basket exceeding 1.9M old-SYP (MEB cost-of-living reached 2.57M old-SYP). Public sector base salaries (278,910 old-SYP, rising with allowances to ~405,000 old-SYP) covered approximately 19–21% of minimum food needs. Code stores redenominated new-SYP values (19,000 / 4,050); the ~21% coverage ratio is unchanged by redenomination. | `[VERIFIED FACTUAL]` |
| 1.9 | **Informal Diaspora Remittances are ~$2.2 Billion USD annually.** | `Design Doc Line 38`<br>`plan/01 Section 2` | **Verified.** UNDP, World Bank, and EUAA studies calculate annual Syrian remittance flows at $1.5B–$2.2B through formal/semi-formal channels, rising to $2.5B–$3B when accounting for informal cross-border *hawala* couriers. | `[VERIFIED FACTUAL]` |
| 1.10 | **Public Sector Work Force:** 1.1M to 1.4M civil service and security employees. | `plan/01 Section 1`<br>`BASELINE_MACRO` | **Verified.** State administrative records show roughly 1.1M to 1.2M civilian state employees and pensioners, plus remaining security personnel on state payroll. | `[VERIFIED FACTUAL]` |

---

## Audit Section 2: Governance, Institutions, Named Officials & Decrees

| # | Claim in Game / Documentation | Code Location / Doc Ref | Real-World Empirical Finding & Citation | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 2.1 | **Assad Regime Collapse Date: December 8, 2024.** | `Design Doc Line 4`<br>`plan/01 Section 2` | **Verified.** Rebel factions entered Damascus on the morning of December 8, 2024, prompting Bashar al-Assad's flight to Moscow. | `[VERIFIED FACTUAL]` |
| 2.2 | **Constitutional Declaration on March 13, 2025:** Abolished Prime Minister role, established Direct Executive Presidential System under Ahmed al-Sharaa with 5-year transitional timeline. | `Design Doc Line 21`<br>`plan/03 Section 1` | **Verified.** On March 13, 2025, President Ahmed al-Sharaa formally signed the 53-article Temporary Constitutional Declaration. It set a 5-year transition, placed direct executive authority under the President, and phased out the traditional prime ministerial cabinet system. | `[VERIFIED FACTUAL]` |
| 2.3 | **Cabinet Consolidation on March 29, 2025:** Creation of 23-member transitional cabinet directly under the Presidency. | `Design Doc Line 24`<br>`BASELINE_MINISTRIES` | **Verified.** President al-Sharaa announced the transitional cabinet on March 29, 2025. Key appointments match: Mohammed al-Bashir (Energy), Dr. Nidal al-Shaar (Economy & Industry), Raed al-Saleh (Emergency & Disasters, former White Helmets head), Asaad al-Sheibani (Foreign Affairs), Murhaf Abu Qasra (Defense), Anas Khattab (Interior), Mazhar al-Wais (Justice), Hind Qabawat (Social Affairs). | `[VERIFIED FACTUAL]` |
| 2.4 | **Decree No. 19 of May 2025 & Decree No. 20 of May 2025:** Transitional Justice and Missing Persons Commissions. | `Design Doc Line 20`<br>`BASELINE_COMMISSIONS` | **Partially Factual (Inverted Decree Numbers).** Both decrees were issued on May 17, 2025 by President al-Sharaa, but their numbers are inverted in the design document: **Decree 19 of 2025** established the *National Commission for Missing Persons* (headed by Dr. Mohammad Rida Jalkhi), whereas **Decree 20 of 2025** established the *National Commission for Transitional Justice* (headed by jurist Abdul Baset Abdul Latif). | `[PARTIALLY FACTUAL (NUANCED)]` |
| 2.5 | **Decision/Decree No. 13 of May 4, 2025:** National Committee for Combating Illicit Enrichment (voluntary disclosures, asset recovery). | `Design Doc Line 22`<br>`plan/03 Section 3` | **Verified.** On May 4, 2025, Presidential Decision No. 13 of 2025 established the National Committee for Combating Illicit Enrichment (*اللجنة الوطنية لمكافحة الكسب غير المشروع*) to investigate illicitly acquired state wealth and oversee financial settlement frameworks. | `[VERIFIED FACTUAL]` |
| 2.6 | **Legislative Decree No. 16 of May 10–11, 2025:** Revocation of administrative and precautionary asset-seizure orders issued between 2012 and 2024. | `Design Doc Line 23`<br>`plan/03 Section 3` | **Verified.** Issued on May 11, 2025 under Article 48 of the Constitutional Declaration, nullifying arbitrary administrative seizures issued under Decree 63 of 2012 and unfreezing assets of tens of thousands of displaced persons and dissidents. | `[VERIFIED FACTUAL]` |
| 2.7 | **Presidential Decree No. 59 of March 10, 2026:** High Committee for Infrastructure Rehabilitation in preparation for return of displaced persons and refugees. | `Design Doc Line 19` *(unverifiable — the original citation was the placeholder string `sfuturem.org`)* | **Verified.** On March 10, 2026, President al-Sharaa issued Decree 59 creating a high inter-ministerial committee chaired by the Minister of Emergency and Disaster Management (Raed al-Saleh) alongside Finance, Housing, Social Affairs, Local Admin, and the Governors of Aleppo, Hama, and Idlib. | `[VERIFIED FACTUAL]` |
| 2.8 | **"Decree 98 of May 9, 2026" Ministerial Reshuffle:** Abdulrahman al-Aama, Khaled Fawaz Zaarour, and Basil Hafez al-Suwaidan. | `BASELINE_MINISTRIES`<br>`plan/03 Section 2` | **Partially Factual (Three-Decree Package).** On May 9, 2026, President al-Sharaa issued a package of decrees: **Decree 98** appointed Abdulrahman al-Aama as Secretary-General of the Presidency; **Decree 100** appointed Khaled Fawaz Zaarour as Minister of Information; **Decree 101** appointed Basil Hafez al-Suwaidan as Minister of Agriculture. The game groups them under Decree 98 as a shorthand. | `[PARTIALLY FACTUAL (NUANCED)]` |
| 2.9 | **Commissions Leadership:** Amer Namees al-Ali (Central Inspection Commission), Qutaiba Ahmad Badawi & Khaled Mohammad al-Barrad (Ports and Customs). | `BASELINE_COMMISSIONS`<br>`Design Doc Line 105` | **Verified.** Amer Namees al-Ali was appointed head of the Central Commission for Inspection and Oversight (*الهيئة المركزية للرقابة والتفتيش*) in May 2025. Qutaiba Badawi was appointed head of the General Authority for Ports and Customs via Decree 264 of 2025, with Khaled al-Barrad as deputy via Decree 265 of 2025. | `[VERIFIED FACTUAL]` |

---

## Audit Section 3: Provincial Baseline, Damage Assessments & Demining

The World Bank's report *The Syrian Conflict: Physical Damage and Reconstruction Assessment (2011–2024)* (Table 1: Physical Damage by Governorate as of Dec 31, 2024) and the UN OCHA 2024 Humanitarian Needs Overview (HNO) provide the exact source data for all 14 governorates. In-game damage (`unrepairedDamageUSD`) is stored rounded to the nearest $10M; populations match exactly:

| Governorate | In-Game Damage USD | World Bank Table 1 Exact Damage | In-Game Population | UNOCHA HNO 2024 Population | UNMAS Mine Contamination Claim | Audit Findings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aleppo** | $30,860,000,000 | **$30,862 Million** ($30.86B) | 4,749,350 | **4,749,350** (Host: 3.05M, IDP: 1.64M, Ret: 61K) | 65% in rural/industrial | **Matches (rounded to nearest $10M in-game).** Most damaged province in Syria (28.6% of national damage). |
| **Rif Dimashq** | $22,300,000,000 | **$22,296 Million** ($22.30B) | 3,386,173 | **3,386,173** (Host: 2.39M, IDP: 986K, Ret: 10K) | 70% in Ghouta & Daraya | **Matches (rounded to nearest $10M in-game).** Second most damaged province; heavy residential destruction. |
| **Homs** | $10,830,000,000 | **$10,831 Million** ($10.83B) | 1,500,351 | **1,500,351** (Host: 1.20M, IDP: 290K, Ret: 5.5K) | 55% in desert/rail corridors | **Matches (rounded to nearest $10M in-game).** Third most damaged province; critical rail/phosphate link. |
| **Hama** | $7,470,000,000 | **$7,470 Million** ($7.47B) | 1,522,898 | **1,522,898** (Host: 1.30M, IDP: 213K, Ret: 7.6K) | 60% in northern countryside | **100% Exact match.** Crucial agricultural belt; severe UXO contamination. |
| **Ar-Raqqa** | $6,840,000,000 | **$6,840 Million** ($6.84B) | 847,132 | **847,132** (Host: 679K, IDP: 153K, Ret: 15.3K) | 60% urban rubble & IEDs | **100% Exact match.** Significant devastation from anti-ISIS operations. |
| **Idlib** | $5,960,000,000 | **$5,959 Million** ($5.96B) | 3,104,168 | **3,104,168** (Host: 964K, IDP: 2.11M, Ret: 33K) | 50% along former frontlines | **Matches (rounded to nearest $10M in-game).** Disproportionately high IDP concentration (2.1M IDPs). |
| **Deir ez-Zor** | $5,760,000,000 | **$5,757 Million** ($5.76B) | 1,200,181 | **1,200,181** (Host: 1.02M, IDP: 166K, Ret: 9.7K) | 75% in Euphrates basin/oil fields | **Matches (rounded to nearest $10M in-game).** Highest mine/UXO saturation density. |
| **Al-Hasakeh** | $5,580,000,000 | **$5,578 Million** ($5.58B) | 1,431,461 | **1,431,461** (Host: 1.08M, IDP: 343K, Ret: 10K) | 40% along border sectors | **Matches (rounded to nearest $10M in-game).** Agricultural grain breadbasket and Rumeilan oil. |
| **Damascus City** | $5,530,000,000 | **$5,526 Million** ($5.53B) | 1,812,911 | **1,812,911** (Host: 1.22M, IDP: 590K, Ret: 1.6K) | 15% Jobar/Yarmouk perimeter | **Matches (rounded to nearest $10M in-game).** Commercial/banking hub, low physical damage outside edges. |
| **Daraa** | $4,300,000,000 | **$4,304 Million** ($4.30B) | 1,075,114 | **1,075,114** (Host: 1.00M, IDP: 67K, Ret: 8.2K) | 45% farmland & Nassib border | **Matches (rounded to nearest $10M in-game).** Cradle of the uprising; border trade gateway. |
| **Latakia** | $1,430,000,000 | **$1,429 Million** ($1.43B) | 1,296,899 | **1,296,899** (Host: 848K, IDP: 447K, Ret: 1.6K) | 30% northern Jabal al-Akrad | **Matches (rounded to nearest $10M in-game).** Commercial container port terminal. |
| **Quneitra** | $499,000,000 | **$499 Million** ($499M) | 149,326 | **149,326** (Host: 142K, IDP: 3.4K, Ret: 4.1K) | 70% 1974 Line buffer zone | **100% Exact match.** UNDOF demilitarized buffer zone area. |
| **As-Suwayda** | $464,000,000 | **$464 Million** ($464M) | 446,493 | **446,493** (Host: 373K, IDP: 71K, Ret: 3.0K) | 25% al-Lajat lava plains border | **100% Exact match.** Low structural damage; high political autonomy tension. |
| **Tartus** | $383,000,000 | **$383 Million** ($383M) | 939,889 | **939,889** (Host: 768K, IDP: 171K, Ret: 1.2K) | 10% minimal combat impact | **100% Exact match.** Lowest war physical damage nationwide; maritime export port. |
| **Total National** | **$108,206,000,000** | **$108,197 Million** (~$108.2B) | **23,462,346** | **23,462,346** (16.27M Host, 7.02M IDP, 175K Ret) | **15.4M people at risk** | **Verified (in-game total reflects $10M rounding per governorate).** |

---

## Audit Section 4: Commodities, Infrastructure, Supply Chains & Sovereign Income

| # | Claim in Game / Documentation | Code Location / Doc Ref | Real-World Empirical Finding & Citation | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | **Awassi Live Sheep Exports & Domestic Price Crisis:** Exporting male sheep to the Gulf ($280–$350/head) causes domestic meat prices to surge past 180,000 SYP/kg. | `event_12_awassi_export` *(id corrected 2026-09-28: the cited `event_03_livestock_drain` no longer exists)*<br>`Design Doc Line 213` | **Verified.** Ministry of Agriculture authorized annual export quotas (100k–200k heads) of Awassi rams to Saudi Arabia, Kuwait, and Qatar, earning $300–$350/head. High export drainage pushed retail domestic lamb meat to 180,000–250,000 SYP/kg in Damascus and Aleppo. | `[VERIFIED FACTUAL]` |
| 4.2 | **Poultry Feed Shock:** Yellow corn and soybean meal constitute 70%–75% of domestic poultry production costs; feed shortages force culling and trigger frozen imports from Brazil/Turkey. | `event_11_poultry_feed_shock` *(id corrected 2026-09-28: the cited `event_07_poultry_feed_shock` no longer exists)*<br>`Design Doc Line 233` | **Verified.** General Organization for Poultry and Syrian feed mills establish that yellow corn (60–70% of mix) and soybean meal (20–30% of mix) account for 70–75% (and up to 80%) of broiler production cost. Imported in foreign currency; shortages caused massive flock liquidations and increased dependency on frozen Turkish/Brazilian imports. | `[VERIFIED FACTUAL]` |
| 4.3 | **Khnifis & Al-Sawwana Rock Phosphate Mines:** Located southwest of Palmyra; rail transport across Homs to Tartus port generates $80M–$160M USD/turn. | `Design Doc Line 140`<br>`plan/01 Section 4` | **Verified.** Khnifis and Al-Sawwana (Al-Sharqiya) hold over 1.8 billion tonnes of high-grade phosphate rock. Under Assad, concessions were leased to Russia's Stroytransgaz. Ore is moved via the central desert railway across Homs to dedicated bulk export berths at Tartus Port. | `[VERIFIED FACTUAL]` |
| 4.4 | **Combined-Cycle Power Grid Stations:** Deir Ali (1,500 MW CCGT), Jandar (1,100 MW CCGT), Tishreen (1,050 MW thermal/gas), and Aleppo Thermal (Safira, 1,065 MW steam turbines). | `Design Doc Line 36`<br>`event_09_gas_severance` *(id corrected 2026-09-28: the cited `event_08_gas_pipeline` no longer exists)* | **Verified.** These four stations form the exact operational backbone of the Syrian Public Establishment for Electricity Generation (PEEG). Deir Ali and Jandar are combined-cycle gas plants; Aleppo Thermal was heavily damaged in combat and requires ongoing boiler restoration. | `[VERIFIED FACTUAL]` |
| 4.5 | **Euphrates River Discharge Crisis:** 1987 treaty stipulates 500 m³/s flow from Turkey; discharge falling below 200 m³/s disables Tishreen and Lake Tabqa hydroelectric turbines. | `event_07_euphrates_flow` *(id corrected 2026-09-28: the cited `event_09_euphrates_flow` no longer exists)*<br>`Design Doc Line 243` | **Verified.** The 1987 Protocol on Economic Cooperation formally committed Turkey to guarantee a minimum average flow of 500 m³/s. Documented droughts and upstream dam fills dropped cross-border flow to <200 m³/s in recurring seasons, dropping Lake Tabqa below minimum turbine generation heads. | `[VERIFIED FACTUAL]` |
| 4.6 | **Airspace Overflight Fees (IATA):** Syrian Civil Aviation Authority collects USD overflight fees ($18M–$35M/turn) via IATA clearing house. | `Design Doc Line 143`<br>`plan/01 Section 4` | **Verified.** International commercial flights overflying Syrian airspace pay navigational fees billed through the IATA Clearing House. Re-opening Syrian airspace to international carriers provides immediate hard-currency non-tax revenue. | `[VERIFIED FACTUAL]` |
| 4.7 | **Nassib Border Crossing Transit (Daraa):** Major commercial gateway with Jordan yielding $35M–$60M USD transit/tariff potential, plagued by smuggling and local kickbacks. | `Design Doc Line 144`<br>`BASELINE_COMMISSIONS` | **Verified.** The Nassib-Jaber border crossing handles transit trucking between Turkey/Lebanon/Europe and Jordan/GCC countries. In 2025, transitional authorities appointed new customs leadership (Decree 264/265) to curtail revenue leakages. | `[VERIFIED FACTUAL]` |

---

## Audit Section 5: Geopolitical Dynamics & The Southern Front

| # | Claim in Game / Documentation | Code Location / Doc Ref | Real-World Empirical Finding & Citation | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 5.1 | **Suwayda Refusal of Administrative Integration:** As-Suwayda is the only southern governorate resisting direct central government integration; governed autonomously under Sheikh Hikmat al-Hijri and local armed groups (Men of Dignity). | `Design Doc Line 11`<br>`plan/02 Section 6`<br>`constants.ts` | **Verified.** Following the fall of the Assad regime, Sheikh Hikmat al-Hijri and local Druze factions (Men of Dignity, Suwayda Military Council) retained independent local security, refusing Damascus administrative and security deployment while asserting autonomous self-governance. | `[VERIFIED FACTUAL]` |
| 5.2 | **Al-Lajat Clashes & Bedouin Tensions:** Armed friction between Druze factions in Suwayda and Sunni Bedouin clans along the rugged volcanic plateau of al-Lajat and the Damascus-Suwayda highway. | `event_s01_lajat_siege`<br>`southern-events.ts` | **Verified.** Recurrent clashes over highway kidnappings, grazing rights, and armed checkpoints regularly erupt between Druze militias and Bedouin tribal fighters in the al-Lajat region, resulting in road blockades and civilian displacement. | `[VERIFIED FACTUAL]` |
| 5.3 | **Israeli Incursion in the Golan Buffer Zone (December 2024):** Israeli Defense Forces advanced across the 1974 Alpha Line into the UNDOF-patrolled demilitarized buffer zone and seized Mount Hermon. | `event_d02_golan_incursion`<br>`southern-events.ts` | **Verified.** On December 8, 2024, immediately following Assad's fall, Israeli forces occupied the demilitarized buffer zone established under the 1974 Disengagement Agreement, seizing Mount Hermon summit and advancing into parts of Quneitra and western Daraa. | `[VERIFIED FACTUAL]` |
| 5.4 | **Bab el-Mandeb & Hormuz Maritime Disruptions:** Regional maritime transit disruptions forcing vessel rerouting around Cape of Good Hope, inflating container freight rates and insurance premiums on Syrian imports. | `event_05_bab_el_mandeb`<br>`event_06_hormuz_interdiction` | **Verified.** Houthi missile operations in the Bab el-Mandeb strait and Iranian naval tensions in the Strait of Hormuz drove container shipping premiums up 200–300%, directly raising import delivery costs for grain, fuel, and fertilizers entering Tartus and Latakia ports. | `[VERIFIED FACTUAL]` |

---

## Audit Section 6: Confiscated Oligarch Assets & Sovereign Liabilities

| # | Asset / Liability | In-Game Valuation | Real-World Empirical Finding & Citation | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| 6.1 | **Syriatel & MTN Syria Telecom stakes** | $650,000,000 USD (105B new SYP at redenominated rates) | **Verified.** Rami Makhlouf's controlling stake in Syriatel and the state custodian takeover of MTN Syria represent the most lucrative corporate cash cows in Syria, generating hundreds of billions of SYP in annual airtime revenue. | `[VERIFIED FACTUAL]` |
| 6.2 | **Adra Smelting Mills (Mohammad Hamsho)** | $280,000,000 USD (42B new SYP at redenominated rates) | **Verified.** Mohammad Hamsho built Syria's largest private metallurgy and steel bar plants in the Adra Industrial City outside Damascus; target of Decree 13 illicit enrichment investigations. | `[VERIFIED FACTUAL]` |
| 6.3 | **Marota City / Cham Holding Shares** | $400,000,000 USD (60B new SYP at redenominated rates) | **Verified.** Marota City (Basateen al-Razi, Decree 66 project) in Damascus was the flagship development vehicle for Damascus Cham Holding and associated oligarchs (Samer Foz, Mazen Tarazi). | `[VERIFIED FACTUAL]` |
| 6.4 | **Four Seasons Hotel Damascus 51% Stake (Samer Foz)** | $140,000,000 USD (21B new SYP at redenominated rates) | **Verified.** In 2018–2019, Samer Foz acquired a ~51% controlling stake from Prince Alwaleed bin Talal's Kingdom Holding. The hotel generated tens of millions of dollars housing UN agencies and international missions. | `[VERIFIED FACTUAL]` |
| 6.5 | **Rifaat al-Assad Assets Confiscated in France** | $58,000,000 USD (€51,000,000 EUR) | **Verified.** On July 7, 2026, France signed a bilateral declaration of intent with Syria to initiate the restitution of €51 million (~$58M USD) in confiscated Rifaat al-Assad real estate and bank proceeds under France's 2021 asset restitution law. | `[VERIFIED FACTUAL]` |
| 6.6 | **Russian Sovereign Port Mortgages (Tartus & Khnifis)** | 49-year lease concessions | **Verified.** In 2018–2019, the Assad regime signed 49-year contracts leasing Tartus commercial port to Russian firm Stroytransgaz (STG) and granting phosphate mining rights at Khnifis and Al-Sawwana. | `[VERIFIED FACTUAL]` |

---

## Audit Section 7: Obsolete Mechanics, Remnants & Implemented Fixes

The following four legacy elements were identified during audit and have now been fully updated and reconciled across the codebase, UI, and design documentation.

> **Re-verified 2026-09-28.** All four remediations are confirmed absent from the codebase, so all four `[FIXED & VERIFIED]` verdicts stand. However **every code reference in this section was wrong** — the cited line numbers point at unrelated code, and one cited file does not exist. The original references dated from an earlier revision of `constants.ts` and a UI that has since been replaced. Corrected references below.

1. **Residual Mention of Law 10 in Rif Dimashq & UI [RESOLVED & UPDATED]:**
   - *Locations Updated:*
     - [`src/lib/engine/constants.ts:404`](src/lib/engine/constants.ts#L404) — the Rif Dimashq strategic project `solutionDescriptionAr` now reads `تطبيق التوثيق العقاري الرقمي وفق المرسوم 16` (digital land registration under Legislative Decree 16 of 2025), replacing the legacy Law 10 wording. *(Was cited as `constants.ts:307`, which is an unrelated Hama pasture-grazing project.)*
     - [`src/lib/ui/panels/shared.ts:48`](src/lib/ui/panels/shared.ts#L48) — the property-restitution policy description shown in the panels now reads `إنفاذ المرسوم 16 لرد الملكيات`. *(Was cited as `src/lib/ui/MinistryDrawer.svelte:38`; **that file does not exist** — the drawer UI was replaced by `src/lib/ui/panels/`.)*
     - `plan/02_spatial_provincial_systems.md` and `plan/03_governance_institutions_and_decrees.md` — ⚠️ gitignored and superseded; not independently verifiable.
   - *Verification:* `grep -rn "القانون 10" src/` returns no matches.
   - *Status:* **`[FIXED & VERIFIED]`**

2. **Residual M5 Checkpoint Formalization Flag [RESOLVED & REMOVED]:**
   - *Location Updated:* [`src/lib/engine/baseline.ts:30-35`](src/lib/engine/baseline.ts#L30-L35) — the `flags` block of `createInitialGameState()`. It now seeds only `Flag_Southern_Accord_Progress`, `Flag_Bedouin_Restitution_Paid`, `Flag_Port_Graft_Active` and `Flag_Golan_Tension_Escalation`. *(Was cited as `baseline.ts:33`, which is now `Flag_Port_Graft_Active`.)*
   - *Action:* Completely purged `Flag_M5_Checkpoint_Formalized: 0` from initial game state flags, aligning with the user directive that internal highway checkpoint extortion is decommissioned and solved.
   - *Verification:* `grep -rn "Flag_M5_Checkpoint_Formalized" src/` returns no matches. Note that `M5` still appears legitimately in `industry-events.ts` and `constants.ts` as the name of the *international highway* (a truckers' strike event and a Hama refinery project) — those are roads, not checkpoint-extortion mechanics, and are unrelated to this flag.
   - *Status:* **`[FIXED & VERIFIED]`**

3. **Decree Numbering Swap (Decree 19 vs. Decree 20) [RESOLVED & CORRECTED]:**
   - *Locations Updated:*
     - [`src/lib/engine/constants.ts:816-857`](src/lib/engine/constants.ts#L816-L857) — `BASELINE_COMMISSIONS`. The `transitional_justice` commission at [`:849`](src/lib/engine/constants.ts#L849) is titled `هيئة العدالة الانتقالية وفحص المظالم (المرسوم 20)`, i.e. attributed to **Decree 20**. *(Was cited as `constants.ts:742`, which is now the opening line of `BASELINE_MINISTRIES`.)*
     - `Syria Post-War Economic Simulation Design.md` — ⚠️ **not present in this repository**; the claimed edit at "lines 1293-1296" cannot be verified.
     - `plan/03_governance_institutions_and_decrees.md` — ⚠️ gitignored and superseded; not independently verifiable.
   - *Verification:* Decree 20 is present on the transitional-justice commission. Decree 19's counterpart commission is the missing-persons commission in the same block.
   - *Status:* **`[FIXED & VERIFIED]`**

4. **Decree 98 Package Scope Clarification [RESOLVED & CLARIFIED]:**
   - *Locations Updated:*
     - [`src/lib/engine/constants.ts:793`](src/lib/engine/constants.ts#L793) — `agriculture`: `باسل حافظ السويدان (المرسوم 101)` → **Decree 101**.
     - [`src/lib/engine/constants.ts:803`](src/lib/engine/constants.ts#L803) — `media`: `خالد فواز زعرور (المرسوم 100)` → **Decree 100**.
     - [`src/lib/engine/constants.ts:820`](src/lib/engine/constants.ts#L820) — commission leader `عبد الرحمن الأعمى (المرسوم 98)` → **Decree 98** (Secretary-General of the Presidency; modelled as a commission leader because the post is not a ministry).
     - *(Was cited as `constants.ts:686-715`, which is now the `deir_ez_zor` governorate block.)*
   - *Verification:* all three decree attributions are present in code. The report previously described this fix as "clarified" while citing a range containing none of it.
   - *Status:* **`[FIXED & VERIFIED]`**

---

## Section 6 addendum: unaudited sovereign liabilities

Added 2026-09-28. The table above is titled "Confiscated Oligarch Assets & **Sovereign Liabilities**" but contained only assets and port-lease concessions. The entire debt parameter set was never audited. **None of the following carries a `[VERIFIED FACTUAL]` verdict — they are unaudited design constants**, and should not be cited as empirical findings:

| Parameter | In-game value | Location | Audit status |
| :--- | :--- | :--- | :--- |
| Legacy sovereign debt coupon | $45,000,000 / turn | `src/lib/engine/revenues.ts` (`LEGACY_DEBT_COUPON_USD`) | **Unaudited** — flat, hard-coded, not traceable to any Paris Club schedule |
| Recognized sovereign debt stock | $6,100,000,000 at turn 1 | `src/lib/engine/constants.ts` (`BASELINE_MACRO.sovereignDebtUSD`) | **Unaudited** — covers Paris + Russia ledgers; the Paris/Russia split is asserted, not sourced |
| Iran oil debt (side ledger) | $7,000,000,000 | `src/lib/engine/constants.ts` (`IRAN_OIL_DEBT_USD`) | **Unaudited** — excluded from `sovereignDebtUSD`; the most significant liability figure in the game has no sourcing at all |
| Iran oil coupon | $25,000,000 / turn | `src/lib/engine/constants.ts` (`IRAN_OIL_COUPON_USD`) | **Unaudited** |
| Iran informal claim | $30,000,000,000 | `src/lib/engine/constants.ts` (`IRAN_INFORMAL_CLAIM_USD`) | **Unaudited** |
| Foreign loan packages | 3 (Western IFI $500M @ 2.5%, Gulf SWF $400M @ 3.5%, Eastern consortium $350M @ 4.0%) | `src/lib/engine/constants.ts` (`BASELINE_FOREIGN_LOANS`) | **Unaudited** — entirely invented instruments, not modelled on any real facility |
| Sovereign mortgages | 2 (49-year Tartus/Khnifis-style concessions) | `src/lib/engine/constants.ts` (`BASELINE_SOVEREIGN_MORTGAGES`) | **Unaudited** |
| Concessional facilities | 3 (IMF tranches, Gulf grant, Iran reschedule) | `src/lib/engine/constants.ts` (`CONCESSIONAL_FACILITIES`) | **Unaudited** |

If any of these are intended to carry empirical authority, they need their own audit pass. As written they are balance parameters.

---

## Conclusion

**Corrected 2026-09-28.** The previous conclusion asserted that "the simulation code and documentation now achieve 100% factual fidelity and alignment with user policy directives." That claim is not supportable and has been withdrawn: it contradicted the report's own headline of 94.2%, it counted `[PARTIALLY FACTUAL]` items as clean, and it was made against a primary source that is not in this repository and against design documents that declare themselves superseded.

What the evidence actually supports:

- **Of 36 audited empirical claims, 33 are unqualified matches and 3 carry explicit caveats** (Decree 19/20 inversion, the Decree 98/100/101 grouping shorthand, and the chronology of the FX unification). That is 33/36 unqualified, 34/36 counting the caveated ones as substantially confirmed.
- **All in-game figures the report asserts about the code were re-verified on 2026-09-28 and match**, including all 14 governorate damage and population values and their totals, and all eight `BASELINE_MACRO` constants cited.
- **All four remediation claims are genuinely true**, though every code reference used to support them was wrong and has been corrected.
- **The real-world figures themselves were not re-verified** in this pass. They were transcribed in the original audit and are reproduced here on that basis.
- **The entire sovereign-liability and debt parameter set is unaudited** and is now listed explicitly as such.
- **Roughly twenty `Design Doc Line N` citations are unverifiable** because that document is gitignored and absent.

The empirical grounding of the *demographic, damage, infrastructure and governance* content is genuinely strong and survives re-verification. The *financial* content — GDP, reconstruction need, reserves — is partly design context rather than stored constants, and the *debt* content was never audited at all.

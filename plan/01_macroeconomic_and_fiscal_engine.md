# 01. Macroeconomic & Fiscal Engine Design

## 1. Executive Summary & Dual-Currency Architecture

In *President Game*, the state does **not** have a single fungible bank balance. One of the core design pillars is the **Dual-Currency Reality**:
1. **Domestic Currency (Syrian Pound - SYP):** Sovereign fiat. Can be printed by the Central Bank via seigniorage. Used to pay domestic civil service payrolls, security forces, local contracts, pensions, and domestic vendor procurement. However, printing in excess of economic productivity depreciates the parallel street exchange rate and fuels consumer inflation.
2. **Foreign Exchange Reserves (Hard USD):** Non-printable, scarce sovereign lifeblood. Required to purchase vital imports (bulk milling wheat, imported heating diesel *mazout*, natural gas feedstocks, electrical turbine replacement parts, specialized medical supplies) and to service international loans. If USD reserves hit zero during an import deficit, the state enters immediate **Sovereign Insolvency** (an instant fail state).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          THE DUAL-CURRENCY FLOWS                            │
├──────────────────────────────────────────┬──────────────────────────────────┤
│ FOREIGN EXCHANGE RESERVES (USD)          │ DOMESTIC TREASURY (SYP)          │
├──────────────────────────────────────────┼──────────────────────────────────┤
│ • Phosphate & Hydrocarbon Exports        │ • Corporate & Personal Income Tax│
│ • Airspace Overflight Fees (IATA USD)    │ • Telecom Airtime Excises (15%)  │
│ • Nassib Cross-Border Transit (USD fees) │ • Domestic Fuel Surcharges       │
│ • Oligarch Offshore Asset Repatriation   │ • Municipal Power & Water Bills  │
│ • Bilateral Reconstruction Loans         │ • State Enterprise Dividends     │
│ • Tied UN Humanitarian Grants            │ • Seized Domestic Bank Balances  │
│                                          │ • Central Bank Seigniorage (M2)  │
├──────────────────────────────────────────┼──────────────────────────────────┤
│ DRAIN VECTORS:                           │ DRAIN VECTORS:                   │
│ • Wheat & Grain Shipments                │ • 1.1M Civil Service Payroll     │
│ • Imported Fuel (Mazout / Gas)           │ • Military & Police Salaries     │
│ • Power Turbine OEM Spare Parts          │ • Local Reconstruction Contracts │
│ • Sovereign Foreign Debt Service         │ • Domestic Crop Purchasing       │
└──────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 2. Macroeconomic Baseline Parameters (Turn 1 / Month 24 Post-Liberation)

The simulation begins at late 2026 (Month 24 following the fall of the Ba'athist regime on December 8, 2024):

| Metric | Starting Value | Context & Gameplay Role |
| :--- | :--- | :--- |
| **Nominal GDP** | $21.4 Billion USD | Contracted from pre-war peak of $67.5B; reflects damaged productive base. |
| **Reconstruction Deficit** | $216.0 Billion USD | World Bank assessment ($82B infra, $75B residential, $59B commercial/public). |
| **FX Reserves** | $320,000,000 USD | ~2.4 months of essential import cover (danger threshold is < 3 months). |
| **Domestic Treasury Cash** | 4.20 Trillion SYP | Liquid working accounts spread across central and provincial ministries. |
| **Official Central Bank Rate**| 13,500 SYP / $1 USD | Peg used for state transactions and official remittance conversions. |
| **Parallel Street FX Rate** | 16,200 SYP / $1 USD | Commercial rate for merchant invoices, imports, and black market trade. |
| **Average Civil Service Wage**| 405,000 SYP ($25.00/mo)| Covers only 21.3% of the basic 5-person Monthly Food Basket (MEB). |
| **Monthly Food Basket (MEB)** | 1,900,000 SYP/month | Standard survival basket for a family of 5; benchmark for misery. |
| **Operational Grid Capacity** | 2,250 MW | Unconstrained national demand is 8,500 MW (delivers 2–4 hours/day). |
| **Systemic Corruption** | 58 / 100 | Percentage drag across customs, procurement contracts, and payroll. |
| **Political Capital (PC)** | 50 / 100 | Executive authority available to enact decrees, dismiss ministers, or audit ports. |
| **National Riot Risk (RRI)** | 44 / 100 | Simmering discontent; wildcat strikes; localized civil disobedience. |
| **Total Population** | 22.5 Million | Includes 6.5M returned/internal IDPs; 90% below the $3.00/day poverty line. |
| **Informal Remittances** | $2.2 Billion USD/yr | Inflows routed through informal *hawala* brokers. |

---

## 3. Mathematical Formulations & Continuous Feedback Loops

Every turn, the economic engine resolves continuous feedback calculations:

### 3.1 Real Wage Formulation
The real purchasing power of the population dictates civic stability and emigration pressure:
$$\text{Real Wage (USD)} = \frac{\text{Nominal Wage (SYP)}}{\text{Parallel FX Rate}}$$
* If $\text{Real Wage} < \$35/\text{month}$ for 4 consecutive turns, it triggers the **Medical Faculty Resignation Wave** (Event 10).
* If military/police real wages drop below $\$8.00/\text{month}$ while corruption exceeds 75, it trips the **Security Force Mutiny** fail state.

### 3.2 Parallel Market FX Depreciation Engine
When the domestic deficit is bridged by money printing (Central Bank seigniorage), or when hard foreign reserves are drained to purchase emergency imports:
$$\Delta\text{FX}_{\text{street}}\% = \left(\frac{\Delta M_2}{M_2}\right) + \left(\frac{\text{Net FX Drain}}{\text{Total FX Reserves}} \times 0.50\right) - (\text{GDP Growth}\% \times 0.50)$$
* Every $1.0\text{ Trillion SYP}$ of unbacked new currency issued shifts the parallel exchange rate upward by $\approx 600\text{ to }1,200\text{ SYP/\$}$.
* As the spread between the Official Rate ($13,500$) and Parallel Rate ($16,200+$) widens past $15\%$, formal remittances collapse into black-market *hawala* couriers.

### 3.3 Infrastructure Capital Expenditure (CapEx) Output Efficiency
Capital allocated to rebuild infrastructure does not translate 1:1 into physical megawatts, hospitals, or roads. It is filtered through ministerial competence and institutional graft:
$$\text{Effective CapEx Output} = \text{Allocated CapEx (USD)} \times \left(\frac{\text{Ministry Competence}}{100}\right) \times \left(1 - \frac{\text{Systemic Corruption}}{100}\right)$$
* In provincial nodes, this is further multiplied by $(1 - (\text{Mine Saturation} \times 0.40))$ and the local skilled labor availability ratio.
* If Ministry of Energy competence is $31$ and corruption is $58$, an allocation of $\$100\text{M}$ yields only $\$100\text{M} \times 0.31 \times 0.42 = \$13.02\text{M}$ of actual installed infrastructure!

### 3.4 Domestic Tax Compliance Engine
Because $80\%+$ of post-war enterprise operates informally, statutory tax rates cannot simply be collected by decree:
$$\text{Effective Tax Captured} = \text{Theoretical Tax Base} \times \text{Statutory Rate} \times \text{Compliance Rate}$$
Where:
$$\begin{aligned}
\text{Compliance Rate} = &\ 0.30\ (\text{Base Civic Trust}) \\
&+ \left(\frac{\text{Daily Electricity Hours}}{24} \times 0.25\right) \\
&+ \left(\frac{\text{Ministry Competence}}{100} \times 0.25\right) \\
&- \left(\frac{\text{Systemic Corruption}}{100} \times 0.30\right) \\
&- \left(\frac{\text{Provincial PRRI}}{100} \times 0.25\right)
\end{aligned}$$
* Raising statutory tax rates on an angry, blacked-out population lowers compliance faster than the rate hike, causing a net collapse in collected revenues (Lafer curve effect).

### 3.5 Foreign Direct Investment (FDI) & Private Capital Inflow
$$\text{FDI Inflow (USD)} = \text{Base Attractiveness} \times \left(\frac{\text{Daily Power Hours}}{24}\right) \times \left(1 - \frac{\text{Corruption}}{100}\right) \times \text{Property Title Security}$$
* Expatriate and private capital demands at least 8 hours of power and legal title clarity before investing in factories or commercial centers.

---

## 4. Income Architecture: The Four State Revenue Pillars

Every semiannual turn, the state receives income across both currencies according to specific policy choices:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE FOUR STATE REVENUE PILLARS                        │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Confiscated Wealth         │ 2. Post-War Taxation Engine                 │
│ • Offshore recovered funds    │ • Corporate profits tax (15-28% SYP)        │
│ • 80/20 Oligarch settlements  │ • Telecom user excise (15-20% digital SYP)  │
│ • Operating corporate equity  │ • Retail fuel distribution duty (SYP)       │
│ • Seized domestic bank cash   │ • Nassib & Port customs tariffs (USD & SYP) │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. State Enterprises & Rents  │ 4. External Aid & Financing                 │
│ • Phosphate exports (USD)     │ • UN Humanitarian Food Aid (Tied USD)       │
│ • Crude oil exports (USD)     │ • Bilateral reconstruction credit lines     │
│ • Syriatel / MTN dividends    │ • Multilateral World Bank grants            │
│ • IATA Airspace overflight fee│ • Build-Operate-Transfer (BOT) concessions  │
│ • M5 Highway freight tolls    │                                             │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

### Pillar I: Confiscated Assets & Oligarch Settlements (Decree 13 of 2025)
Following the regime collapse, the *National Committee for Combating Illicit Enrichment* identified over 900 crony-capitalist figures (Rami Makhlouf, Mohammad Hamsho, Samer Foz, Katerji logistics, Rifaat al-Assad).
1. **Liquid Capital (Movable):**
   * Seized domestic bank deposits ($\sim 12.8\text{ Trillion SYP}$).
   * Offshore bank funds recovered from European courts (e.g. France returning $\$58\text{M}$ from Rifaat al-Assad's real estate seizures).
2. **Corporate Operating Assets (Immovable):**
   * *Telecommunications:* Syriatel and MTN mobile network stakes provide immediate, high-volume recurring dividends ($\approx 2.38\text{T SYP} + \$25\text{M USD}$ per turn).
   * *Heavy Industry:* Hamsho's Adra smelting plants, Samer Foz's sugar/pharmaceutical facilities.
   * *Hospitality/Real Estate:* Four Seasons Hotel Damascus 51% stake, Marota City commercial plots.
3. **Policy Dilemma: Settlement vs. Nationalization vs. Liquidation:**
   * **80/20 Voluntary Disclosure:** Oligarch surrenders 80% net worth to state, retains 20% equity and operational management. *Effect:* Factory stays open, jobs preserved, Competence $+4$, Civic Trust $-8$ (seen as elite impunity).
   * **100% State Nationalization (SOE Conversion):** State takes total control. *Effect:* Zero liquid cash upfront; corruption rises $+12$; incompetent political appointees run factories into ground (smelting plants operate at 30% capacity).
   * **Open Market Auction to Foreigners:** Sell to Gulf/Turkish syndicates for immediate USD cash. *Effect:* Max USD reserves, but enrages nationalist factions and forfeits long-term dividends.
4. **The Decree 16 Property Restitution Conflict:**
   * Thousands of properties confiscated under the Ba'athist regime belonged to political refugees.
   * *Return immediately:* Loses $\$380\text{M USD}$ in state land assets and billions in rent, but Civic Trust jumps $+20$ and refugee returns surge.
   * *Hold and rent for state income:* Generates cash, but crushes diaspora trust and halts remittance growth.

### Pillar II: The Post-War Taxation Engine
1. **Direct Taxes (SYP):**
   * *Corporate Profit Tax (15–28%):* Above 22%, informal evasion jumps by 40%.
   * *Progressive Income Tax:* Collected only from formal banking/multinational workers in Damascus/Latakia.
   * *Commercial Property Transfer Duty:* High yield when property title registry is digitized.
2. **Indirect Taxes & Excises (SYP):**
   * *Telecom Airtime Surcharge (15–20%):* Highly effective digital collection point on Syriatel/MTN; near-zero evasion.
   * *Fuel Retail Surcharge:* Generates massive SYP, but every 5% hike increases urban microbus fares and food delivery costs, adding $+4$ PRRI.
3. **Border Tariffs & Customs (USD & SYP):**
   * *Nassib Crossing (Daraa):* Transit freight moving from Turkey/Europe to Jordan/Gulf pays $\$300\text{--}\$600\text{ USD}$ per manifest. If border corruption is suppressed, yields $\$35\text{M}\text{--}\$60\text{M USD}$ per turn.
   * *Latakia & Tartus Ports:* Maritime container customs duties, 50% paid in hard currency.

### Pillar III: State Enterprises, Natural Resources & Infrastructure Rents
1. **Khnifis & Sawwana Phosphate Mines (Palmyra Basin):**
   * High-margin rock phosphate exports to India/Europe yielding $\$80\text{M}\text{--}\$160\text{M USD}$ per turn.
   * *Prerequisite:* Desert railway from Palmyra to Tartus port must be demined. If trains are down, trucking eats 45% of export profits.
2. **Crude Oil Extraction (Rumeilan & Al-Omar Fields):**
   * Yields $\$120\text{M}\text{--}\$300\text{M USD}$ per turn.
   * *Dilemma:* Exporting crude earns hard currency but starves domestic Homs/Baniyas refineries, causing transport fuel shortages.
   * *Mandatory Constraint:* Requires remitting a **30% Regional Development Dividend** to eastern tribal councils; withholding it causes pipeline bombings and armed revolts.
3. **Airspace Overflight Fees (IATA USD):**
   * Commercial airlines overflying Syrian airspace between Europe and the Gulf pay direct foreign currency fees ($\$18\text{M}\text{--}\$35\text{M USD}$ per turn) into Central Bank clearing accounts. Requires modern radar and air traffic safety certification.
4. **Adra & Tartus Cement Complexes:**
   * Generates $1.8\text{T SYP}$ per turn for reconstruction projects; requires continuous electrical power or natural gas feedstock.
5. **M5 Highway Electronic Freight Tolls:**
   * Automated weigh-station tolls generate steady SYP without armed militia checkpoint extortion.

### Pillar IV: Foreign Aid, Loans & Private Investments
1. **Humanitarian & Multilateral Aid (UN / Donors):**
   * Provides $\$150\text{M}\text{--}\$300\text{M USD}$ per turn in non-repayable grants.
   * *Strict Restriction:* 100% tied to humanitarian line items (flour, clinics, school kits). Diverting this to repair turbines or pay police triggers immediate donor suspensions.
2. **Bilateral Sovereign Credit Lines:**
   * *Gulf Sovereign Facility (UAE/KSA/Qatar):* Low interest, high diplomacy. Demands prime coastal and downtown development concessions (Marota City, port real estate).
   * *Eastern Strategic Partners (China/Russia/Regional):* High-interest resource-backed credit lines that mortgage future phosphates and oil at a 25% discount, eroding 100-year Sovereign Leverage.
3. **Build-Operate-Transfer (BOT) Concessions:**
   * Private consortia construct massive infrastructure (airport terminals, 500MW solar parks) at zero state CapEx, operate them for 25 years collecting revenues, then transfer ownership back to the republic.

---

## 5. Expenditure Breakdown & Budget Reconciliation

A concrete semiannual budget resolution (Turn 1 H1 baseline audit):

```
REVENUE AUDIT REPORT: SEMIANNUAL FISCAL CYCLE (H1 2027)
=======================================================================================================
REVENUE CATEGORY                         POTENTIAL YIELD     EFFICIENCY / CORRUPTION    ACTUAL CAPTURED
-------------------------------------------------------------------------------------------------------
HARD CURRENCY LEDGER (USD)
1. Confiscated Asset Recovery
   ├── Recovered Offshore Bank Funds     $  50,000,000       100% (Direct Wire/France)  $  50,000,000 USD
   ├── Hamsho 80/20 Voluntary Settle     $  80,000,000       Legal Settlement Payment   $  80,000,000 USD
2. Natural Resource Exports
   ├── Khnifis Rock Phosphate Exports    $  90,000,000       75% (Rail Transport Lag)   $  67,500,000 USD
   ├── Deir ez-Zor Crude Oil Sales       $ 140,000,000       70% (Tribal Revenue Cut)   $  98,000,000 USD
3. Strategic Sovereign Rents
   ├── Airspace Overflight Fees (IATA)   $  22,000,000       100% (Clean Flight Routing)$  22,000,000 USD
   ├── Nassib & Border Crossings Transit $  45,000,000       55% (Daraa Smuggling Graft)$  24,750,000 USD
   ├── Port Maritime Dues (Latakia)      $  30,000,000       70% (Customs Underinvoicing)$ 21,000,000 USD
4. External Aid & Financing
   ├── UN Humanitarian Food Aid (Tied)   $ 160,000,000       100% (In-Kind Grain/Flour) $ 160,000,000 USD
   └── Gulf Sovereign Reconstruction Loan $ 200,000,000      100% (Tranche 1 Disbursed) $ 200,000,000 USD
-------------------------------------------------------------------------------------------------------
TOTAL HARD CURRENCY REVENUE CAPTURED (FX):                                              $ 723,250,000 USD
[Excluding Tied UN Aid & Debt: Discretionary FX = $363,250,000 USD]
=======================================================================================================

DOMESTIC CURRENCY LEDGER (SYP)
1. Confiscated Domestic Liquidity
   ├── Seized Oligarch Commercial Accts  3.50 Trillion SYP   100% (Central Bank Seizure) 3.50 Trillion SYP
2. State Corporate Enterprise Dividends
   ├── Syriatel & MTN Telecom Profits    2.80 Trillion SYP   85% (Operational Diesel Cost) 2.38 Trillion SYP
   ├── Adra & Tartus Cement Complexes    1.20 Trillion SYP   60% (Power Outage Stoppages) 0.72 Trillion SYP
3. Domestic Taxation Levers
   ├── Corporate Profits (Formal Zones)  2.40 Trillion SYP   42% (Tax Evasion & Informality) 1.01 Trillion SYP
   ├── Telecom User Excises & Airtime    1.80 Trillion SYP   92% (Digital Electronic Point) 1.66 Trillion SYP
   ├── Retail Fuel Distribution Surcharge 1.40 Trillion SYP  75% (Checkpoint Fuel Divert) 1.05 Trillion SYP
4. Municipal Utility Collections
   ├── Electrical Grid Power Tariffs     1.10 Trillion SYP   35% (Non-Payment / Wire Theft) 0.38 Trillion SYP
   └── Municipal Water & Irrigation Fees 0.60 Trillion SYP   40% (Unmetered Well Bypass)  0.24 Trillion SYP
-------------------------------------------------------------------------------------------------------
TOTAL DOMESTIC REVENUE CAPTURED (SYP):                                                  10.94 Trillion SYP
=======================================================================================================
```

---

## 6. Code Data Schema & State Management

In the simulation engine, the macroeconomic state is modeled as follows:

```typescript
export interface MacroeconomicState {
  // Currency Balance Sheets
  treasurySYP: number;          // Nominal SYP cash in state accounts
  reservesUSD: number;          // Hard currency liquid FX reserves
  m2MoneySupplySYP: number;     // Total circulating domestic money supply
  
  // Exchange Rates
  officialRateSYP: number;      // Central bank official peg (e.g. 13500)
  parallelRateSYP: number;      // Free-market street rate (e.g. 16200)
  
  // Living Standards & Inflation
  monthlyFoodBasketSYP: number; // Cost of 5-person survival basket (MEB)
  civilServiceWageSYP: number;  // Average monthly base wage
  annualInflationPct: number;   // Projected annual CPI inflation
  
  // Sovereign Health & Levers
  sovereignDebtUSD: number;     // Accumulated external debt
  sovereignLeverage: number;    // 0 to 100 (Autonomy vs vassalage)
  politicalCapital: number;     // 0 to 100 (Executive decree resource)
  civicTrust: number;           // 0 to 100 (Public confidence in state)
  systemicCorruption: number;   // 0 to 100 (Leakage / institutional drag)
  nationalRRI: number;          // 0 to 100 (Riot Risk Index)
  concessionsSignedCount: number; // Count of mortgaged ports/mines
  
  // Infrastructure Snapshot
  gridCapacityMW: number;       // Current operational generation (demand = 8500MW)
  dailyPowerHours: number;      // Calculated daily mains power (0 - 24)
}
```

---

## 7. Deep Macroeconomic Sub-Systems (Implemented)

### 7.1 Dynamic Tax Compliance Formulation
Rather than a static compliance percentage, compliance is dynamically calculated every semiannual audit:
$$\text{Compliance Rate} = 0.30 + \left(\frac{\text{dailyPowerHours}}{24} \times 0.25\right) + \left(\frac{\text{avgMinisterialCompetence}}{100} \times 0.25\right) - \left(\frac{\text{systemicCorruption}}{100} \times 0.30\right) - \left(\frac{\text{avgProvincialPRRI}}{100} \times 0.25\right)$$
Bounded between $0.12$ and $0.88$. It directly governs formal corporate profit tax yields, utility fee recovery, and customs transit collection.

### 7.2 Remittance Skimming vs. Hawala Flight Threshold
- Expatriates remit approximately **$1.0 Billion USD** every 6-month cycle.
- The Central Bank enforces a spread margin between the official rate and parallel market rate ($0\% - 25\%$).
- **The Hawala Threshold (15%):** If the skim spread exceeds $15\%$, remitters boycott formal bank channels and flight to informal Hawala networks occurs. State capture collapses from up to $\$150\text{M}$ down to a meager $2\%$ ($\$20\text{M}$).

### 7.3 Commodity Smuggling & Wheat Procurement
- **Subsidized Low:** State offers below-market procurement prices in nominal SYP. Up to $40\%$ of the domestic harvest is smuggled across northern and eastern borders, forcing the state to import emergency grain ($+\$70\text{M}$ import bill).
- **Market Parity:** Standard procurement.
- **Premium Incentive:** Attractive state procurement price ($+350\text{B}$ SYP outlay) captures over $85\%$ of domestic harvest, eliminating $\$120\text{M}$ in USD foreign grain import drains.

# 05. Event Engine & Deck Ledger Design

## 1. Event State Machine Architecture

The event system in *President Game* is not a random roll of disconnected cards; it is a **state-machine driven crisis pipeline** that tests player policies, punishes neglected systems, and models external geopolitical volatility.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE 3-POOL DRAW PIPELINE                            │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Exogenous Shock Pool       │ 2. Endogenous Threshold Pool                │
│ • Independent global events   │ • Internal structural crises                │
│ • Probability-based rolls     │ • Triggers when metrics cross critical lines│
│ • Bab el-Mandeb drone crisis, │ • Medical strikes, turbine explosions,      │
│   Hormuz tanker seizures,     │   Beirut banking contagions, port standoffs │
│   Euphrates river drought     │                                             │
├───────────────────────────────┴─────────────────────────────────────────────┤
│ 3. Cascading Crisis Chains                                                  │
│ • Downstream shocks triggered by persistent hidden state flags set by       │
│   earlier compromises.                                                      │
│ • Example: Tolerating port smuggling in Turn 2 sets `Flag_Port_Graft_Active`│
│   which unlocks `Event 04: Latakia Terminal Standoff` in Turn 6.            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Turn Draw Capacity
* In any given semiannual turn, the system draws a **maximum of 2 events** (typically 1 Exogenous + 1 Endogenous or 1 Cascading Chain event) to prevent decision paralysis while forcing brutal resource competition between foreign currency, domestic pounds, and political capital.

---

## 2. Active Master Event Deck (12 Core Events)

Following the constitutional stabilization and the elimination of obsolete wartime dynamics (Captagon networks, Ba'athist conscription fees, and Caesar Act sanctions), the active 12-event roster focuses on **maritime chokepoints, primary energy feedstocks, human capital, and agricultural food security**.

---

### Event 01: The Black Sea Grain Corridor Collapse
*The maritime grain export corridor ruptures due to regional conflict, causing global durum and milling wheat prices to surge by 48% on the international spot market within 30 days.*
* **Trigger:** Exogenous Pool | Earliest: Turn 3 (Year 2) | Probability: 15% per turn.
* **Option A: Full Fiscal Absorption (Maintain Standard Bread Rations)**
  * *Req:* $\text{FX Reserves} \ge \$180\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$180\text{M USD}$, $\text{Civic Trust} +4$, $\text{RRI} -6$, $\text{Parallel FX} +450\text{ SYP/\$}$.
  * *Flag:* Sets `Flag_Grain_Subsidies_Maximized`. If FX drops below $\$100\text{M}$ within 3 turns, triggers sovereign default on bulk grain shipments.
* **Option B: Dilution & Rationing Quotas (The "Yellow Flour" Mandate)**
  * *Req:* None
  * *Impacts:* $\text{FX Reserves} -\$55\text{M USD}$, $\text{SYP Treasury} -1.2\text{T SYP}$, $\text{Civic Trust} -14$, $\text{RRI} +18$ (breadline scuffles), $\text{Corruption} +6$ (bakers divert flour to pastry black markets).
* **Option C: Emergency Bilateral Grain Swap (Eastern Credit Line)**
  * *Req:* $\text{Sovereign Leverage} \ge 30$
  * *Impacts:* $\text{FX Reserves } \$0$, $\text{Sovereign Debt} +\$290\text{M USD}$ (at 7.5% interest), $\text{Sovereign Leverage} -15$, $\text{Civic Trust} -2$.
  * *Concession:* Grants creditor state trading houses a 10-year customs exemption at Tartus Port.

---

### Event 02: The Mediterranean Tanker Interdiction
*A maritime fuel shipment carrying 1.5 million barrels of crude oil destined for the Baniyas Refinery is intercepted and detained in international waters.*
* **Trigger:** Exogenous / Geopolitical Pool | Probability: 20% if fuel stock < 25 days.
* **Option A: Emergency Land-Bridge Smuggling Route**
  * *Req:* $\text{Political Capital} \ge 25$, $\text{Corruption} \ge 35$
  * *Impacts:* $\text{SYP Treasury} -2.8\text{T SYP}$, $\text{Corruption} +12$, $\text{Daily Blackout} +4\text{ hours}$ (delivery lag), $\text{Inflation} +11\%$.
* **Option B: Total Civilian Energy Curtailment (Prioritize Security & Bakeries)**
  * *Req:* None
  * *Impacts:* $\text{FX Reserves } \$0$, $\text{Daily Blackout} +8\text{ hours}$ (grid down to 1.5 hrs/day), $\text{Civic Trust} -22$, $\text{RRI} +26$, $\text{Factory Output} -35\%$.
* **Option C: Emergency Spot-Market Purchase via Front Companies**
  * *Req:* $\text{FX Reserves} \ge \$140\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$140\text{M USD}$, $\text{State Competence} -5$, $\text{Daily Blackout} +1\text{ hour}$.

---

### Event 03: The Beirut Banking Contagion
*A major banking freeze and currency devaluation in Lebanon locks down correspondent accounts, trapping an estimated $1.2B in Syrian merchant deposits and dollar credit lines.*
* **Trigger:** Endogenous | Turns 1–10 | Probability: 100% (Historical inevitability if Parallel FX Spread > 15%).
* **Option A: Criminalize All Parallel Dollar Transactions (Decree 54)**
  * *Req:* $\text{Security Loyalty} \ge 60$
  * *Impacts:* Parallel FX surges $+3,200\text{ SYP/\$}$ (cash goes underground), Informal Remittances $-65\%$, $\text{Civic Trust} -15$, $\text{Private Investment} -40\%$.
* **Option B: Official Exchange Rate Realignment (Devaluation Catch-Up)**
  * *Req:* $\text{Central Bank Competence} \ge 45$
  * *Impacts:* Parallel spread compresses $-800\text{ SYP/\$}$, Formal Remittances $+40\%$, $\text{FX Reserves} +\$85\text{M USD/yr}$, $\text{Real Wage} -25\%$ (imported food inflation).

---

### Event 04: The Latakia Port Terminal Standoff
*A prominent war-profiteering tycoon and parliamentary deputy refuses to transfer container scanning and customs inspection revenues to the central treasury, withholding $85M.*
* **Trigger:** Endogenous | Prerequisite: $\text{Systemic Corruption} > 50$ AND $\text{Oligarch Loyalty} < 50$.
* **Option A: Deploy State Security to Seize the Port Docks**
  * *Req:* $\text{Political Capital} \ge 40$, $\text{Military Loyalty} \ge 65$
  * *Impacts:* $\text{FX Captured} +\$85\text{M USD}$, $\text{SYP Treasury} -1.5\text{T SYP}$, $\text{Oligarch Loyalty} -35$, $\text{Corruption} -10$, $\text{Civic Trust} +8$.
  * *Skill Check:* If $\text{Competence} < 40$, a port firefight erupts; container traffic halts for 3 weeks ($-\$22\text{M USD}$ in spoiled imports).
* **Option B: Settle for a 35% Compromise Kickback**
  * *Req:* None
  * *Impacts:* $\text{FX Captured} +\$30\text{M USD}$, $\text{Oligarch Loyalty} +10$, $\text{Competence} -12$, $\text{Corruption} +8$.
* **Option C: Nationalize & Concession to Foreign Shipping Line**
  * *Req:* $\text{Sovereign Leverage} \ge 40$
  * *Impacts:* $\text{FX Upfront Lease} +\$160\text{M USD}$, $\text{Sovereign Leverage} -20$, $\text{Port Labor Strikes Triggered}$.

---

### Event 05: The Bab el-Mandeb Maritime Squeeze
*Drone interdictions along the Bab el-Mandeb force container fleets to circumnavigate Africa. Shipping times extend by 22 days, and Asian freight rates surge by 260%.*
* **Trigger:** Exogenous Pool | Earliest: Turn 3 (Year 2) | Probability: 25% annually.
* **Option A: Sovereign Maritime Freight & Insurance Subvention**
  * *Req:* $\text{FX Reserves} \ge \$95\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$95\text{M USD}$, $\text{Inflation capped at } +4.5\%$, $\text{Factory Output protected}$, $\text{Civic Trust} +3$.
* **Option B: Full Commercial Pass-Through (Laissez-Faire)**
  * *Req:* None
  * *Impacts:* $\text{FX Reserves } \$0$, $\text{Inflation} +18.2\%$, $\text{Factory Output} -24\%$ (missing parts), $\text{RRI} +11$, $\text{Parallel FX} +650\text{ SYP/\$}$.
* **Option C: Overland Redirection via Gulf-Jordan Land Freight Corridors**
  * *Req:* $\text{Political Capital} \ge 25$, $\text{Competence} \ge 40$
  * *Impacts:* $\text{SYP Treasury} -1.4\text{T SYP}$, Delivery time reduced by 8 days, $\text{Regional Economic Integration} +12$.

---

### Event 06: The Strait of Hormuz Energy Interdiction
*Clashes and tanker boardings in the Strait of Hormuz cause crude prices to surge by 32%; insurers withdraw war-risk coverage for Eastern Mediterranean tankers.*
* **Trigger:** Exogenous Pool | Earliest: Turn 5 (Year 3) | Probability: 20% if crude reserves < 30 days.
* **Option A: Underwrite Sovereign Guarantee & War-Risk Premiums**
  * *Req:* $\text{FX Reserves} \ge \$160\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$160\text{M USD}$, $\text{Refinery Throughput maintained at 85\%}$, $\text{Civic Trust} +4$, $\text{RRI} -5$.
* **Option B: Severe Industrial & Municipal Load Shedding**
  * *Req:* None
  * *Impacts:* $\text{FX Reserves } \$0$, $\text{Daily Blackouts} +8\text{ hours}$ (cities down to 2–4 hrs/day), $\text{Public Transport Cost} +140\%$, $\text{RRI} +22$.
* **Option C: Emergency Overland Pipeline & Trucking Protocol from Kirkuk**
  * *Req:* $\text{Political Capital} \ge 35$, $\text{Sovereign Leverage} \ge 25$
  * *Impacts:* $\text{SYP Treasury} -2.2\text{T SYP}$, $\text{Refinery Throughput stabilized at 55\%}$, $\text{Sovereign Leverage} -8$.

---

### Event 07: The Euphrates Flow Depletion Crisis
*Upstream diversions and drought drop Euphrates river flow by 60%, dropping water levels at Tabqa and Tishreen dams below turbine intake levels.*
* **Trigger:** Exogenous / Environmental | Earliest: Turn 7 (Year 4) | Probability: 30% if CapEx Water < $150M.
* **Option A: Thermal Fuel Substitution (Preserve Canals for Wheat)**
  * *Req:* $\text{FX Reserves} \ge \$110\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$110\text{M USD}$ (fuel imports), $\text{Urban Blackouts} +5\text{ hours}$, $\text{Wheat Harvest Saved}$.
* **Option B: Emergency Drawdown of Dam Reservoirs**
  * *Req:* None
  * *Impacts:* Hydro power maintained for 90 days, then reservoirs dry up; 350,000 hectares of downstream crops perish; $\text{Future Food Import Bill} +\$240\text{M USD}$.
* **Option C: Diplomatic Water-for-Trade Protocol**
  * *Req:* $\text{Political Capital} \ge 35$, $\text{Sovereign Leverage} \ge 25$
  * *Impacts:* $\text{Border Tariff Revenue} -\$60\text{M USD/yr}$, $\text{Hydro Output} +350\text{ MW restored}$, $\text{Sovereign Leverage} -10$.

---

### Event 08: Aleppo Grid Phase-B Turbine Explosion
*The primary 400MW steam block at Aleppo Thermal Station suffers a boiler rupture from substandard maintenance and burning unrefined heavy mazout.*
* **Trigger:** Endogenous | Prerequisite: $\text{Ministry Competence} < 35$ AND $\text{CapEx Grid} < \$200\text{M}$.
* **Option A: Western OEM Emergency Overhaul Contract**
  * *Req:* $\text{FX Reserves} \ge \$175\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$175\text{M USD}$, 18-month industrial blackout, followed by $+450\text{ MW}$ permanent clean capacity and $+10\text{ Competence}$.
* **Option B: Patch Repair via Local Scrap Metal**
  * *Req:* None
  * *Impacts:* $\text{SYP Treasury} -450\text{B SYP}$, 45-day downtime, but 40% chance of detonation each subsequent turn; permanently caps turbine output at 45%.
* **Option C: Bilateral Turnkey Energy Concession**
  * *Req:* $\text{Sovereign Leverage} \ge 20$
  * *Impacts:* $\text{State CapEx } \$0$, $+400\text{ MW}$ restored in 6 months, but foreign firm sets commercial power rates in USD, pricing out 60% of small workshops; $\text{Sovereign Leverage} -12$.

---

### Event 09: The Natural Gas Feedstock Severance
*Regional pipeline arrears and compressor breakdowns cut natural gas imports by 6.5M $m^3$/day, threatening to trip 1,100 MW of combined-cycle plants.*
* **Trigger:** Endogenous | Earliest: Turn 3 (Year 2) | Probability: 30% if CapEx Energy < $250M.
* **Option A: Liquidate FX Arrears & Reset Contract**
  * *Req:* $\text{FX Reserves} \ge \$135\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$135\text{M USD}$, $+1,000\text{ MW}$ restored, $\text{Civic Trust} +6$, $\text{RRI} -8$.
* **Option B: Force Fuel-Switching to Heavy Fuel Oil (Mazout)**
  * *Req:* None
  * *Impacts:* $\text{FX Burners} -\$40\text{M USD}$, $\text{SYP Fuel} -1.8\text{T SYP}$, Turbine lifespan reduced by 40%, toxic smog; requires end-of-turn maintenance check.
* **Option C: Decouple Industry to Preserve Residential Grid**
  * *Req:* $\text{Political Capital} \ge 20$
  * *Impacts:* $\text{FX Reserves } \$0$, $\text{SYP Lost Taxes} -850\text{B SYP}$, Residential power maintained, but $\text{Industrial Output} -42\%$ and $\text{Unemployment} +18\%$.

---

### Event 10: The Medical Faculty Resignation Wave
*Over 60% of resident surgeons and senior university hospital faculty resign following the collapse of public health sector wages to $22/month.*
* **Trigger:** Endogenous | Prerequisite: $\text{Real Wage} < \$35/\text{month}$ for 4 consecutive turns.
* **Option A: Dollar-Indexed Professional Retention Stipend**
  * *Req:* $\text{FX Reserves} \ge \$45\text{M/yr}$
  * *Impacts:* $\text{FX Reserves} -\$45\text{M USD/yr}$, Medical brain drain drops to 15%, but teachers and engineers strike demanding dollar parity ($\text{RRI} +8$).
* **Option B: Travel Bans & Compulsory Public Service Lock-In**
  * *Req:* State Terror / Martial Order $\ge 30$
  * *Impacts:* $\text{FX Reserves } \$0$, Staffing stabilized on paper, but $\text{Medical Competence} -30\%$ (absenteeism and underground flight), $\text{Civic Trust} -20$.
* **Option C: Corporatize Municipal Hospitals**
  * *Req:* None
  * *Impacts:* $\text{SYP Budget Saved} +950\text{B SYP}$, Hospital quality jumps for rich, but $\text{Poverty Index} \to 93\%$, $\text{Impoverished Mortality} +35\%$, $\text{RRI} +14$.

---

### Event 11: The Poultry Feed Shock & Frozen Chicken Dilemma
*Imported yellow corn and soybean meal prices surge by 55%. Faced with unpayable feed bills and blackouts, 60% of domestic poultry farmers slaughter laying hens; egg and chicken prices skyrocket.*
* **Trigger:** Endogenous | Earliest: Turn 1 (Year 1) | Probability: 35% if Inflation > 20%.
* **Option A: Emergency Open-Door Import of Cheap Frozen Chicken**
  * *Req:* $\text{FX Reserves} \ge \$75\text{M}$
  * *Impacts:* $\text{FX Reserves} -\$75\text{M USD}$, Consumer chicken prices drop 45% ($\text{RRI} -12$), but 80% of domestic poultry farmers go bankrupt ($\text{Rural Unemployment} +65,000$).
* **Option B: Strategic Feed Grain Subsidization**
  * *Req:* $\text{SYP Treasury} \ge 3.5\text{T SYP}$
  * *Impacts:* $\text{SYP Treasury} -3.5\text{T SYP}$, Prices stabilize slowly over 6 months, 70% of farms preserved, $\text{Corruption} +9$ (feed distributor diversions).
* **Option C: Mandatory Price Caps & Farm Output Requisitions**
  * *Req:* None
  * *Impacts:* $\text{Treasury } \$0$, Chicken vanishes into black market at double price; farmers cull chicks to avoid costs; $\text{Childhood Malnutrition} +14\%$, $\text{RRI} +16$.

---

### Event 12: The Awassi Lamb Export & Smuggling Schism
*Surging Gulf demand for indigenous fat-tailed Awassi sheep pushes export prices to $350/head. Herders divert livestock across borders for hard cash, causing domestic lamb prices to hit 180,000 SYP/kilo.*
* **Trigger:** Endogenous | Earliest: Turn 3 (Year 2) | Probability: 30% if Parallel FX Spread > 20%.
* **Option A: Total Livestock Export Ban**
  * *Req:* $\text{Security Loyalty} \ge 55$
  * *Impacts:* Lost $\text{FX} -\$180\text{M USD}$, $\text{SYP Enforcement} -800\text{B SYP}$, Domestic meat prices drop 40% ($\text{Civic Trust} +8$), but desert smuggling explodes.
* **Option B: State-Monopolized Export Quota System**
  * *Req:* $\text{State Competence} \ge 45$
  * *Impacts:* $\text{FX Captured} +\$140\text{M USD}$, $\text{SYP Licensing} +1.2\text{T SYP}$, Meat stays luxury export; working-class diet loses red meat.
* **Option C: The "Protein Swap" Offset Protocol**
  * *Req:* $\text{FX Reserves} \ge \$60\text{M}$, $\text{Political Capital} \ge 30$
  * *Impacts:* Export high-end Awassi lamb ($+\$80\text{M FX net}$), import cheap subsidized frozen beef ($-\$60\text{M FX}$); caloric parity maintained ($\text{RRI} -4$).

---

## 3. Dedicated Southern Shocks Deck

### Event S-01: The Al-Lajat Tribal Highway Siege
*Enraged by central fuel and flour deliveries to As-Suwayda without Bedouin property restitution, 4,000 armed tribal fighters erect barriers across the al-Lajat lava plains, halting all southern transit.*
* **Trigger:** Endogenous | Prereq: $\text{Suwayda Aid Sent} > 0$ AND $\text{Tribal Rage (TRI)} > 70$.
* **Option A: Deploy Armed Forces to Clear the Highway by Force**
  * *Req:* $\text{Security Loyalty} \ge 65$, $\text{PC} \ge 35$
  * *Impacts:* $\text{SYP Treasury} -1.2\text{T SYP}$, $TRI$ surges to 95 (sparks guerrilla warfare), $SSP -10$ (proves state can protect corridors), severe civilian casualties.
* **Option B: Concede to Tribal Demands (Halt Convoy & Pay Blood Money)**
  * *Req:* $\text{Treasury} \ge 2.5\text{T SYP}$
  * *Impacts:* $\text{SYP Treasury} -2.5\text{T SYP}$, $TRI -30$ (barriers dismantled), but $SSP +25$ (Druze leadership brands Damascus untrustworthy), $SII \to 0$.
* **Option C: Tripartite Notables' Shura (The Southern Reconciliation Council)**
  * *Req:* $\text{Political Capital} \ge 50$, $\text{State Competence} \ge 60$
  * *Impacts:* $\text{PC} -40$, $TRI -15$, $SSP -12$; highway closed for 30 days while talks proceed ($-\$15\text{M USD}$ in transit trade).

---

### Event D-02: The Golan Buffer Zone Incursion & Local Ultimatums
*Foreign mechanized forces advance 4km past the 1974 Alpha line into rural Quneitra/Daraa. Daraa militias give Damascus 72 hours to deploy armor or surrender state armories.*
* **Trigger:** Exogenous / Geopolitical Pool | Probability: 25% annually.
* **Option A: The Restraint Protocol (Diplomatic Mediation)**
  * *Req:* None
  * *Impacts:* Golan Tension ($GTI$) drops $-20$, infrastructure intact, but Daraa Defiance ($DDI$) jumps $+35$; local militias seize state police stations and assault rifles.
* **Option B: Sovereign Armor Forward Deployment**
  * *Req:* $\text{Military Loyalty} \ge 60$
  * *Impacts:* $DDI \to 0$ (populace rallies around flag), $\text{Civic Trust Daraa} +25$, but foreign standoff airstrikes destroy columns and southern infrastructure ($-\$120\text{M USD}$ CapEx loss, $+1.8\text{T SYP}$ military replenishment).
* **Option C: Commissioning the Local Frontier Guard (Light Border Gendarmerie)**
  * *Req:* $\text{Political Capital} \ge 30$, $\text{State Competence} \ge 45$
  * *Impacts:* $\text{SYP Treasury} -650\text{B SYP/yr}$, $DDI -15$, $GTI +5$, Nassib border corruption $+6$ (local brigades demand revenue cuts).

---

## 4. Cascading State Machine Walkthrough Example

```
[Turn 4: Event 02] ───► Player chooses Option A (Trucking Land-Bridge)
                        • Drains -2.8T SYP; tolerates corruption (+12)
                        • Sets Flag: `Flag_Smuggling_Cartels_Entrenched`
                                      │
                                      ▼
[Turn 8: Check]    ───► System detects: Corruption = 68, Security Payroll low
                        • Automatically activates Event 04 (Port Terminal Standoff)
                                      │
                                      ▼
[Turn 8: Event 04] ───► Player chooses Option B (Settle for 35% Kickback)
                        • State Competence -12; sets `Flag_Elite_Impunity`
                                      │
                                      ▼
[Turn 12: Event 01]───► Exogenous Shock Hits: Global Wheat Spikes +48%
                        • Compounded by high logistics graft (+15%)
                        • Bread basket cost surges past Real Wage by 320%
                                      │
                                      ▼
[Turn Resolution]  ───► Riot Risk Index (RRI) hits 88 (> 85 critical threshold)
                        • 5 Governorates trip into Armed Revolt!
                        • INSTANT FAIL STATE: General Urban Insurrection!
```

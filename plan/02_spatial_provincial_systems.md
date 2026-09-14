# 02. Spatial & Provincial Systems Design

## 1. Spatial Topology: The 14 Administrative Nodes

The simulation models post-conflict Syria not as a uniform landmass, but as **14 discrete, interconnected administrative and spatial nodes**. Each governorate features its own physical destruction level, landmine contamination rate, demographic sensitivities, and economic asset profile.

```
                                  [ALEPPO] ────── [RAQQA] ────── [HASAKEH]
                                (Industrial)    (Hydro/Basin)  (Oil/Jazira)
                                     │               │              │
[IDLIB] ────────────────────────── [HAMA]            │        [DEIR EZ-ZOR]
(Agri/Returnees)                 (Agri Hub)          │        (Hydrocarbons)
       │                             │               │              │
       │     [LATAKIA] ─────── [HOMS] ───────────────┴──────────────┘
       │     (Port/Minority) (Central Transit Corridor)
       │         │                   │
       └───── [TARTOUS]              │
              (Port/Naval)           ▼
                             [RIF DIMASHQ]
                             (Devastated Belt)
                                     │
                             [DAMASCUS CITY]
                             (Intact Capital Core)
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
          [QUNEITRA]              [DARAA]              [AS-SUWAYDA]
       (Golan Frontier)       (Southern Cradle)       (Druze Mountain)
```

### Strategic Baseline Ledger (World Bank / UNMAS Data)

| Governorate | Joined State | Demographic Balance | Physical Damage ($) | Recon Cost ($) | Mine Threat | Strategic Key Asset |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Idlib** | Core Base | Sunni / Returnee Hub | $5.96B | $10.14B | High (45%) | Agritech, Bab al-Hawa trade corridor |
| **Aleppo** | Nov 30, 2024 | Sunni / Kurdish / Christian | $30.86B | $60.10B | Severe (65%) | Sheikh Najjar industrial complex |
| **Hama** | Dec 05, 2024 | Sunni / Alawite / Ismaili / Chr | $7.47B | $14.50B | Severe (60%) | Central agricultural & livestock hub |
| **Homs** | Dec 07, 2024 | Sunni / Alawite / Christian | $10.83B | $22.00B | High (40%) | Strategic highway crossroads, Baniyas link |
| **Daraa** | Dec 06, 2024 | Sunni Tribal / Reconciled | $4.30B | $8.50B | Moderate (30%)| Nassib border transit corridor |
| **As-Suwayda** | Dec 07, 2024 | Druze Majority (Autonomous) | $464M | $900M | Low (5%) | Southern mountain agriculture |
| **Quneitra** | Dec 07, 2024 | Sunni / Circassian | $499M | $950M | Severe (55%) | Golan 1974 buffer frontier |
| **Damascus City**| Dec 08, 2024 | Sunni / Cosmopolitan / Min. | $5.53B | $11.50B | Low (5%) | Central Bank, executive ministries |
| **Rif Dimashq** | Dec 08, 2024 | Sunni Working-Class / IDPs | $22.30B | $45.00B | Severe (70%) | Capital agricultural belt & industrial suburbs |
| **Latakia** | Dec 08, 2024 | Alawite / Sunni / Turkmen / Chr | $1.43B | $2.80B | Low (8%) | Latakia container port & maritime terminal |
| **Tartus** | Dec 09, 2024 | Alawite / Christian | $383M | $750M | Minimal (2%) | Tartus commercial & naval port |
| **Deir ez-Zor** | Dec 08, 2024 | Arab Tribal Majority | $5.76B | $11.20B | Severe (75%) | Al-Omar oilfields, Euphrates river basin |
| **Ar-Raqqa** | Dec 08, 2024 | Arab Tribal / Kurdish | $6.84B | $13.50B | Severe (65%) | Tabqa hydroelectric dam & durum wheat silos |
| **Al-Hasakeh** | Dec 08, 2024 | Kurdish / Arab / Assyrian | $5.58B | $11.00B | Moderate (35%)| Rumeilan oilfields & Jazira breadbasket |

---

## 2. Regional Governance Archetypes

Every governorate falls into one of three administrative archetypes with distinct player trade-offs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REGIONAL GOVERNANCE ARCHETYPES                        │
├─────────────────────┬─────────────────────────┬─────────────────────────────┤
│ The Revolution Hubs │ Coastal Enclaves        │ Autonomous & Frontier Zones │
│ (Idlib, Aleppo,     │ (Latakia, Tartus)       │ (As-Suwayda, Al-Hasakeh,    │
│  Homs, Daraa)       │                         │  Deir ez-Zor)               │
├─────────────────────┼─────────────────────────┼─────────────────────────────┤
│ Core Demands:       │ Core Demands:           │ Core Demands:               │
│ • Rapid physical    │ • Physical safety       │ • Administrative autonomy   │
│   reconstruction    │ • Minority protection   │ • Natural resource revenue  │
│ • Returnee property │ • Retention of public   │   sharing (30% dividend)    │
│   restitution       │   sector jobs           │ • Local gendarmerie policing│
│ • Speedy justice    │ • Zero retribution     │ • Clan/ethnic representation│
└─────────────────────┴─────────────────────────┴─────────────────────────────┘
```

1. **The Revolution Hubs (Aleppo, Idlib, Homs, Daraa):**
   * Heavily scarred by urban warfare. High expectations of immediate economic relief. If reconstruction funds bypass them to appease minority enclaves or foreign creditors, revolutionary civil committees mobilize within turns.
2. **The Coastal Enclaves (Latakia, Tartus):**
   * Physically intact infrastructure and high concentration of civil servants and former military families.
   * *Sectarian Anxiety Metric (0–100):* If de-Ba'athification or transitional justice purges are executed aggressively without safeguards, Anxiety spikes above 75, triggering port container strikes that throttle national fuel and grain imports.
3. **The Eastern Hydrocarbon & Agrarian Belt (Deir ez-Zor, Raqqa, Hasakeh):**
   * Produces 80%+ of domestic crude oil, natural gas, and durum wheat.
   * *Revenue-Sharing Compact:* The central state **must** remit a 30% Regional Development Dividend back to local provincial councils. If Damascus siphons oil without paying, tribes blow up pipelines and seize oil wellheads.
   * *Ethnic Parity Slider:* Local directorates in Raqqa and Hasakeh require balanced Kurdish and Arab appointments to prevent civic boycotts.

---

## 3. The Localized Riot Risk Engine (PRRI)

National stability is not a flat number; it is the population-weighted aggregate of **14 autonomous Provincial Riot Risk Indices ($PRRI_i$)**:

$$PRRI_i = \left(\frac{\text{Local Food Basket Cost}_i}{\text{Local Real Wage}_i} \times 0.35\right) + \left(\frac{\text{Daily Blackout Hours}_i}{24} \times 0.20\right) + \left(\frac{\text{Unrepaired Damage}_i}{\text{Total Capital}_i} \times 0.15\right) + \text{Sectarian Friction}_i - (\text{Security Efficacy}_i \times 0.25)$$

### PRRI Unrest Tiers

| PRRI Score | Status Tier | In-Game Mechanics & Systemic Impact |
| :--- | :--- | :--- |
| **0 – 39** | **Calm** | Normal economic activity; 100% municipal tax compliance; positive diaspora sentiment. |
| **40 – 64** | **Tense** | Localized sit-ins; wildcat strikes; 25% municipal tax withholding; freight transport delays. |
| **65 – 84** | **Riot** | State grain silos and substations blockaded; CapEx construction projects suspended locally. |
| **85 – 100** | **Revolt** | Governorate secedes from national grid; local armed factions take control; **Contagion spread triggered**. |

### Spatial Contagion Mechanics
When any governorate crosses into **Armed Revolt ($PRRI_i > 85$)**:
$$\text{For all adjacent connected governorates } j:\quad PRRI_j = PRRI_j + (PRRI_i \times 0.15 \times \text{Road Connectivity Factor}_{ij})$$
* If Aleppo revolts, Hama and Idlib receive $+12$ to $+15$ PRRI per turn along the M5 corridor.
* If 5 or more governorates simultaneously reach $PRRI > 85$, the game immediately trips the **General Urban Insurrection** fail state!

---

## 4. Internal Migration & Domestic Brain Drain Engine

Citizens and skilled technical talent possess dynamic agency; they move away from devastated, blacked-out provinces to stable regions, or flee the country entirely.

### 4.1 Push / Pull Migration Equation
$$\text{Net Migration Flow}_{A \to B} = \text{Population}_A \times \left[ \left(\frac{\text{Safety}_B - \text{Safety}_A}{100}\right) + \left(\frac{\text{Power}_B - \text{Power}_A}{24}\right) + \left(\frac{\text{Wage}_B - \text{Wage}_A}{\text{Wage}_A}\right) \right] \times 0.05$$

### 4.2 Brain Drain Flight Mechanics
* If a governorate's power and hospital infrastructure remain below 30% restoration for 4 consecutive turns, **60% of its local doctors, electrical engineers, and teachers migrate** to Damascus City, Tartus, or abroad.
* **The Abandonment Penalty:** The origin governorate incurs a permanent **$-40\%$ CapEx Execution Efficiency penalty**. Projects cost significantly more and take twice as long because outside engineers must be paid hazardous hardship bonuses.
* **The Destination Strain:** Recipient cities (Damascus, Latakia) suffer rental housing inflation ($+35\%$), sewage overload, and water shortages, fueling secondary cost-of-living unrest among local native residents.

---

## 5. Landmines, UXO & The Agricultural Reactivation Mechanic

Over 15 million citizens live in areas contaminated by explosive remnants of war (ERW). Between 30% and 75% of prime agricultural land in Aleppo, Hama, Idlib, Rif Dimashq, and Deir ez-Zor is contaminated.

$$\text{Active Arable Land}_i = \text{Total Arable Land}_i \times (1 - \text{Mine Saturation}_i)$$

```
                               AGRICULTURAL LAND PARADOX
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       Option A: Accelerated Replanting              Option B: Methodical Demining
┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│ • Force farmers onto contaminated land  │   │ • Deploy Disaster Management deminers   │
│ • Rapid domestic wheat harvest gains    │   │ • Cost: -$20M FX / 800B SYP per turn    │
│ • Massive casualty spike: amputations   │   │ • Safe clearance: 8% per turn           │
│ • PRRI in rural belts increases (+12)   │   │ • Food recovery delayed; import bill up │
└─────────────────────────────────────────┘   └─────────────────────────────────────────┘
```

### Demining Mechanics
* Deploying units from the *Ministry of Emergency and Disaster Management* costs **$\$20\text{M USD} + 800\text{ Billion SYP}$** per governorate per turn, clearing **$8\%$ of mine saturation**.
* **The Impoverished Farmer Dilemma:** If the state under-funds demining but cuts food subsidies, desperate farmers cultivate contaminated minefields anyway:
  * Crop yield is only 60% of potential due to unworked pockets.
  * Explosion casualties trigger rural protests ($+10$ PRRI).
  * Surviving families demand permanent state disability pensions, draining the *Social Affairs and Labor* budget.

---

## 6. The Decoupled Southern Front: As-Suwayda vs. Daraa

A critical geopolitical reality of post-liberation Syria is that the south is **not** a single bloc. As-Suwayda and Daraa have fundamentally different political architectures and dilemmas:

```
                              SOUTHERN THEATER REALIGNMENT
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
[AS-SUWAYDA: UNINTEGRATED CANTON]              [DARAA: THE FRONTIER CRUCIBLE]
• Status: Autonomous / Non-Integrated          • Status: Formally Unified, Structurally Fragile
• Rulers: Druze Spiritual Council / Militias   • Drivers: Former Opposition Factions, Tribal Notables
• Core Dilemma: Bedouin Grievance vs Secession • Core Dilemma: Golan Infractions vs Nassib Graft
• Israeli Air Strike Risk on Central Army      • Jordan Border Transit & 1974 Treaty Violations
```

### 6.1 As-Suwayda: The Un-Integrated Canton & The Tribal Vise
As-Suwayda is the only governorate that refused administrative integration with Damascus. Parliamentary seats are vacant, and the province is run by local factions (*Men of Dignity*, *Suwayda Military Council*) guided by Sheikh Hikmat al-Hijri.

#### Dynamic Variables
* **Suwayda Integration Index ($SII$ - 0 to 100):** Starts at **8/100**. Measures willingness to recognize central ministries.
* **Secession Probability ($SSP$ - 0% to 100%):** Probability of declaring an independent state or requesting foreign protection.
* **Tribal Rage Index ($TRI$ - 0 to 100):** Starts at **74/100**. Measures anger of 50,000+ Sunni Bedouin tribesmen displaced from Suwayda and the al-Lajat plains during the July 2025 clashes.

#### Interaction Formulations
$$\Delta SSP = \left(\frac{\text{Flour \& Fuel Deficit}}{10}\right) + \left(\frac{\text{Damascus Military Threats}}{5}\right) - \left(\frac{\text{Local Administrative Autonomy}}{10}\right)$$
$$\Delta TRI = \left(\frac{\text{Unconditional Budget to Suwayda}}{\$100\text{M}} \times 15\right) - \left(\frac{\text{Bedouin Restitution Compensation}}{\$50\text{M}} \times 20\right) - (\text{Tribal Right-of-Return Checks} \times 10)$$

* **The Tribal Rage Trigger ($TRI > 80$):** Bedouin fighters mount technicals across the al-Lajat lava plains and the Damascus-Suwayda highway, shooting at police, raiding state depots, and blockading transit.
* **The Secession Trigger ($SSP > 85$):** Druze factions declare formal independence. If the Syrian Army attempts a military assault, foreign/Israeli air strikes immediately pound the Ministry of Defense in Damascus.

#### Policy Levers for As-Suwayda

| Policy Lever | Cost / Requirements | Impact on Suwayda | Impact on Tribes | Geopolitical Fallout |
| :--- | :--- | :--- | :--- | :--- |
| **Complete Economic Siege** | PC $\ge 30$, High Security Presence | $SSP +30$, Civic collapse, Zero power/flour | $TRI -25$ (Tribes applaud tough stance) | Invites direct foreign air strikes on Damascus military HQ. |
| **Unconditional Reconstruction Aid**| $-\$60\text{M FX}$, $-1.5\text{T SYP}$ | $SSP -15$, $SII +4$, Services restored | $TRI +35$ (Tribes view it as appeasement) | Highway ambushes; Bedouin revolt along southern transport routes. |
| **Conditional Return & Restitution** | $-\$40\text{M FX}$ (Land Fund), PC $\ge 55$ | $SSP -5$, $SII +12$, Fears pacified | $TRI -30$ (Bedouin families receive land/cash) | Requires delicate international and Jordanian diplomatic brokerage. |
| **Decentralized Service Vouchers** | $-800\text{B SYP}$ directly to municipalities | $SSP -10$ (Bypasses armed militias) | $TRI +5$ (Muted tribal resentment) | Prevents humanitarian starvation without legitimizing armed groups. |

### 6.2 Daraa: The Frontier Crucible & Golan Buffer Powderkeg
Daraa is re-integrated, but sits on two razor-sharp friction points: customs graft at the **Nassib Border Crossing** and civilian outrage over **Israeli incursions past the 1974 Golan Disengagement Line**.

#### Dynamic Variables
* **Golan Tension Index ($GTI$ - 0 to 100):** Depth and frequency of foreign incursions past the Alpha/Bravo lines.
* **Daraa Defiance Index ($DDI$ - 0 to 100):** Willingness of local Daraa armed councils to take up arms independently of Damascus.
* **Nassib Revenue Capture ($NRC$ - 0% to 100%):** Percentage of border customs tariffs reaching Damascus vs. pocketed by local cartels (Starts at **32%**).

#### The 1974 Golan Line Dilemma
$$\Delta DDI = (\text{Incursion Depth (km)} \times 12) - (\text{Damascus Military Pushback} \times 20) + (\text{Damascus Diplomatic De-escalation} \times 15)$$
* **If Player Pulls Back Army to Avoid War:** $GTI$ normalizes, but $DDI$ surges by $+25$. Daraa citizens brand the government weak or complicit; former opposition militias raid state arsenals to mount their own anti-tank border defense.
* **If Player Deploys Armor to 1974 Line:** Daraa civil trust jumps $+25$, but foreign airstrikes destroy armor and radar stations, inflicting $\$120\text{M USD}$ in CapEx damage.

#### The Nassib Customs Corruption War
$$\text{Captured Nassib Revenue} = \text{Gross Transit Freight} \times \text{Tariff Rate} \times NRC$$
* **Option A: Central Anti-Corruption Raid (Costs 20 PC):** Roll State Competence vs. Daraa Local Loyalty. If check fails, local militias shut down the crossing, costing $\$1.8\text{M USD/day}$ in stalled trade.
* **Option B: Power-Sharing Deal:** Damascus cedes 40% of customs revenue to Daraa Provincial Council for local reconstruction, guaranteeing a clean 60% inflow into central vaults.

---

## 7. Provincial Code Data Structure

```typescript
export interface GovernorateNode {
  id: string;                      // e.g. "aleppo", "as_suwayda", "daraa"
  name: string;
  archetype: 'revolution_hub' | 'coastal_enclave' | 'autonomous_frontier';
  
  // Demographics & Unrest
  population: number;
  prri: number;                    // 0 - 100 Provincial Riot Risk Index
  sectarianAnxiety: number;        // 0 - 100
  securityEfficacy: number;        // 0 - 100
  
  // Physical Infrastructure & Damage
  totalCapitalValueUSD: number;
  unrepairedDamageUSD: number;     // Starting damage from World Bank data
  dailyBlackoutHours: number;      // 0 - 24
  activeHospitalsPct: number;      // 0 - 100%
  
  // Agriculture & Landmines
  totalArableHectares: number;
  mineSaturationPct: number;       // 0 - 100%
  localWaterIndex: number;         // Water supply factor (0.0 - 1.0)
  
  // Labor & Migration
  skilledLaborCount: number;       // Engineers, doctors, administrators
  skilledOutflowTurn: number;      // Net loss this turn
  
  // Southern Front Specifics (if applicable)
  suwaydaIntegrationIndex?: number; // 0 - 100 (SII)
  suwaydaSecessionProb?: number;    // 0 - 100 (SSP)
  tribalRageIndex?: number;         // 0 - 100 (TRI)
  daraaDefianceIndex?: number;      // 0 - 100 (DDI)
  nassibRevenueCapturePct?: number; // 0 - 100% (NRC)
  
  // Strategic Connections
  connectedGovernorateIds: string[];
}
```


---

## 5. Unique Governorate Strategic Projects Ledger

| Governorate | Strategic Project Title | Field Crisis / Dilemma | Presidential Solution | Cost | Direct Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aleppo** | تأهيل عنفات محطة حلب ومحولات الشيخ نجار | 20h blackout & debris halting 140 textile factories in Sheikh Najjar | Overhaul steam turbines & repair high-voltage substations | 5M + 500B SYP (0 PC) | -8h blackout, -24 PRRI, 00M repaired, +25k skilled labor |
| **Rif Dimashq** | المسح العقاري الرقمي وتطهير بساتين الغوطة | 70% mine contamination in Ghouta/Daraya & Law 10 property deadlock | Digital property deeds & deployment of heavy mechanical deminers | 5M + 600B SYP (10 PC) | -20% mines, -18 PRRI, 00M repaired, opens 45k ha arable land |
| **Idlib** | كونسورتيوم تصدير الزيتون وتفكيك القنابل العنقودية | Absorbing 2.1M IDPs, 45% cluster munition contamination in orchards | Export cooperative for olive oil & cluster munition demining units | 0M + 300B SYP (5 PC) | -15% CMR mines, -15 PRRI, 50M repaired, aids 120k farming families |
| **Damascus City** | تأهيل مضخات عين الفيجة وضبط سقوف الإيجارات | Water shortages in capital & 45% rent hyperinflation from IDP influx | Replace Ain al-Fijeh hydraulic pumps & set state employee rent caps | 5M + 400B SYP (15 PC) | Secures drinking water, -14 PRRI, 00M repaired, +10k civil talent |
| **Hama** | تطهير مراعي البادية وتأهيل قنوات ري سهل الغاب | 60% eastern steppe mines killing shepherds & clogged Ghab canals | Flail mine-clearers on pastoral routes & dredging Orontes irrigation canals | 5M + 350B SYP (5 PC) | -20% mines, -16 PRRI, protects 300k Awassi sheep livestock |
| **Homs** | عمرة مصفاة حمص وتأمين محور الترانزيت M5 | Refinery catalytic cracker breakdown & M5 highway convoy security | Overhaul distillation towers & deploy joint military-police escorts on M5 | 0M + 450B SYP (5 PC) | Domestic fuel supply, -4h blackout, -18 PRRI, -15 sectarian anxiety |
| **Latakia** | أتمتة جمارك المرفأ وتأمين الاستقرار الوظيفي | Smuggling loopholes at container berths & coastal public sector purge fear | Container optical/X-ray scanners & tenure guarantees for teachers/doctors | 5M + 250B SYP (10 PC) | -25 sectarian anxiety, -12 PRRI, +customs FX collection, +8k labor |
| **Tartus** | خط شحن الحمضيات المبرد وإعادة التدقيق المرفئي | Rotted citrus harvests & minimal treasury yield from legacy naval contracts | Subsidized reefer shipping line for citrus exports & port contract audit | 0M + 200B SYP (10 PC) | Liquidity for 60k farmers, -10 PRRI, -15 sectarian anxiety |
| **Daraa** | حوسبة معبر نصيب وتشكيل حرس حدود حوران | Smuggling rings capturing 68% border dues & Yarmouk armed skirmishes | Automated weighbridges at Nassib & formalizing local Houri border guard | 0M + 250B SYP (15 PC) | Boosts Nassib capture to 80%, -25 Daraa defiance, -18 PRRI |
| **As-Suwayda** | محطة تحويل كهرباء الجبل وميثاق صلح اللجاة | Grid blackouts causing tax boycotts & Bedouin-Druze armed clashes in Lajat | Dedicated 66kV substation & sponsoring historic tribal peace covenant | 5M + 200B SYP (20 PC) | +40 integration, reduces secession risk to <4%, -20 PRRI, -35 tribal rage |
| **Quneitra** | تطهير حزام الجولان وإعادة حفر آبار خط الهدنة | 55% mine contamination on 1974 ceasefire line & destroyed farm wells | Demining with UNDOF support & deep-aquifer well drilling for frontier villages | 2M + 150B SYP (10 PC) | -25% border mines, -20 Golan tension, -15 PRRI, resettlement of 8k farmers |
| **Deir ez-Zor** | الميثاق العشائري لحقول النفط وتطهير ضفاف الفرات | 75% mine saturation & tribal threats to cut al-Omar / Conoco pipelines | 30% oil revenue dividend to local municipalities & Euphrates demining brigades | 0M + 400B SYP (15 PC) | -25% mines, -40 tribal rage, -26 PRRI, guarantees 45k bpd oil flow |
| **Ar-Raqqa** | صيانة عنفات سد الطبقة ونزع تفخيخ أحياء المدينة | Damaged hydro turbines at Tabqa & extensive urban IED booby-traps (65%) | Import hydro replacement runners & deploy robotic explosive clearance teams | 5M + 300B SYP (5 PC) | +250 MW grid output, -5h blackout, -20% mines, -20 PRRI |
| **Al-Hasakeh** | التسوية الاقتصادية للقمح وتشغيل محطة السويدية | Dual administration with AANES, disputed grain pricing & Rumeilan gas disruption | High-price procurement pact for durum wheat & technical protocol for gas turbines | 0M + 500B SYP (15 PC) | Secures 600k tons wheat, -4h blackout, -18 PRRI, -20 national anxiety |

---

## 6. Dynamic Inter-Provincial Demographic Migration Engine (Implemented)

Rather than static provincial populations, the simulation calculates semiannual population shifts:
1. **Conflict Flight:**
   - Any governorate reaching `RIOT` or `REVOLT` status loses $1.5\%$ to $3.0\%$ of its population in forced internal displacement.
   - Fleeing populations migrate toward connected or tranquil nodes (`CALM` tier like Damascus, Latakia, Tartus).
2. **Reconstruction & Stability Attraction:**
   - Governorates that achieve high reconstruction scores ($\ge 0.55$), reliable power ($\le 16$ blackout hours), and low unrest attract voluntary returnees ($+1\%$ per turn).
   - This dynamically shifts local tax collection capacity, labor pools, and municipal service burdens.

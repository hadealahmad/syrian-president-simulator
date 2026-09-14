# 04. Game Loop & Turn Lifecycle Design

## 1. Playable Horizon & Temporal Structure

*President Game* spans a **20-year playable tenure** across **40 Semiannual Turns** (2 turns per calendar year, starting in H1 2027 / Month 24 post-liberation and concluding in H2 2046 / Year 20).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE 20-YEAR / 40-TURN HORIZON                            │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ H1: Spring / Summer Cycle            │ H2: Autumn / Winter Cycle            │
│ (Months 1 – 6 of each Year)          │ (Months 7 – 12 of each Year)         │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Durum wheat & barley harvest       │ • Freezing temperatures & fuel freeze│
│ • Peak hydroelectric dam discharge   │ • Heating oil (mazout) demand surges │
│ • High cooling electrical demand     │ • Hydroelectric flow drops           │
│ • Higher water aquifer evaporation   │ • Solar generation hours contract    │
│ • Dust storms & desert logistics     │ • Agricultural downtime; transport   │
│   strains in the Badia               │   delays across snowy mountain passes│
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. The 5-Phase Turn Execution Loop

Every semiannual turn follows a strict, deterministic sequence of five phases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     5-PHASE SEMIANNUAL EXECUTION LOOP                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PHASE 1: LEDGER AUDIT & SEASONAL MODIFIERS                                │
│   • Reconcile recurring baseline revenues (SOEs, taxes, rents, tariffs)    │
│   • Deduct mandatory OpEx (civil payroll, security, debt service)           │
│   • Apply H1 harvest bonuses or H2 winter fuel multipliers                  │
│                                      │                                      │
│                                      ▼                                      │
│   PHASE 2: PROVINCIAL SPATIAL SCAN (14 NODES)                               │
│   • Calculate local blackout hours, hospital availability, and food cost    │
│   • Update individual PRRI scores; trigger unrest tiers (Calm to Revolt)    │
│   • Compute inter-provincial migration and brain drain flight               │
│                                      │                                      │
│                                      ▼                                      │
│   PHASE 3: EXECUTIVE ALLOCATION (PLAYER AGENCY)                             │
│   • Macro Budget: Nominal wage bump %, subsidy levels, deficit financing    │
│   • Spatial Directives: Assign CapEx to power plants, demining, highways    │
│   • Executive Decrees: Spend Political Capital (PC) on commissions & audits │
│   • Confiscated Wealth: Settle, nationalize, or liquidate oligarch assets   │
│                                      │                                      │
│                                      ▼                                      │
│   PHASE 4: EMERGENT SHOCKS & CRISIS DECK RESOLUTION                         │
│   • Draw 1–2 events from the 3-pool engine (Exogenous, Endogenous, Cascade) │
│   • Player selects a resolution path (weighing FX, SYP, PC, Trust, Spoilers)│
│   • Set persistent flags and branching downstream crisis conditions         │
│                                      │                                      │
│                                      ▼                                      │
│   PHASE 5: REALITY ENGINE EXECUTION & BREAKING POINT CHECK                  │
│   • Calculate seigniorage, parallel FX rate shift, CPI inflation, real wage │
│   • Evaluate the 4 Instant Fail States (Insolvency, Riot, Mutiny, Balkanize)│
│   • If Year == 20 (Turn 40): Launch the Century Simulation Engine (Yr 21-100│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Four Instant Fail States (Breaking Points)

If the player's policies violate critical systemic tolerances, the simulation ends immediately in a national catastrophe:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE FOUR INSTANT FAIL STATES                          │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Sovereign Insolvency       │ 2. General Urban Insurrection               │
│ • Condition: FX Reserves = $0 │ • Condition: National RRI > 85 AND          │
│   for 60 days with an active  │   5+ Governorates simultaneously in         │
│   trade deficit.              │   Armed Revolt status (PRRI > 85).          │
│ • Outcome: Fuel & wheat ports │ • Outcome: Police outposts overrun; armed   │
│   refuse docking; total grid  │   councils surround the Presidential Palace;│
│   collapse; state bankruptcy. │   central government collapses in anarchy.  │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. Security Force Mutiny      │ 4. Balkanization Cascade                    │
│ • Condition: Military/police  │ • Condition: As-Suwayda Secession (SSP > 85)│
│   unpaid for 2 turns OR real  │   AND 2+ other governorates declare formal  │
│   wage < $8/mo with corrup >75│   autonomous self-rule.                     │
│ • Outcome: General staff      │ • Outcome: The Syrian Arab Republic dissolves│
│   mounts an armored coup;     │   into hostile, unviable warlord cantons and│
│   Presidential Palace seized. │   foreign military protectorates.           │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 4. The 100-Year Generational Outcome Engine (Year 21 to 100)

Surviving the 40 playable turns is only half the journey. At the end of Year 20 (Turn 40), the simulation locks the player's cumulative record and feeds it into the **Century Outcome Engine**. The engine projects the nation's trajectory from Year 21 to Year 100 across five generational pillars:

1. **Sovereign Debt-to-GDP Ratio:** Did the state maintain fiscal sovereignty or sell out its future to predatory creditors?
2. **Cumulative Brain Drain:** Did technical cadres stay to educate the next generation, or did the country become a demographic wasteland?
3. **Ecological & Aquifer Health:** Was farmland demined and water infrastructure modernized, or were aquifers drained dry?
4. **Institutional Integrity:** Did democratic, transparent institutions take root, or did a new crony-patrimonial web emerge?
5. **Territorial Integration:** Was a unified constitutional order achieved, or did armed enclaves calcify?

---

### The Six 100-Year Endings

```
                              YEAR 100 TRAJECTORY MATRIX
                                          │
     ┌──────────────┬──────────────┬──────┴───────┬──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼              ▼
[ENDING I:     [ENDING II:    [ENDING III:   [ENDING IV:    [ENDING V:     [ENDING VI:
 SOVEREIGN      MORTGAGED       HOLLEWED        BROKEN         ECOLOGICAL     GARRISON
 PHOENIX]       ENCLAVE]       REPUBLIC]       MARCHES]       DUST BOWL]     BASTION]
 (Democratic    (Indebted      (Demographic    (Warlord       (Agrarian      (Autarkic
  Tiger)         Vassal)        Exodus)         Warlords)      Collapse)      Police State)
```

#### Ending I: The Sovereign Phoenix (The Levant Tiger)
* **Year 20 Prerequisites:**
  * External Debt-to-GDP $< 45\%$
  * Real Wage $\ge \$160/\text{month}$
  * Daily Electricity $= 24\text{ hours}$
  * Demining completed $\ge 90\%$
  * Systemic Corruption $< 25$
  * As-Suwayda and all frontier regions fully integrated into the constitution.
* **Century Report (Year 100):**
  > *"By Year 100, Syria stands as the dominant technological, logistics, and renewable energy hub of the Eastern Mediterranean. A sovereign wealth fund capitalized by domestic phosphate and tech exports finances free universal healthcare. The diaspora returned en masse, transforming Damascus and Aleppo into world-renowned university and research cities."*

#### Ending II: The Mortgaged Enclave (The Indebted Protectorate)
* **Year 20 Prerequisites:**
  * External Debt-to-GDP $> 110\%$
  * Sovereign Leverage $< 25$
  * 3 or more long-term resource/infrastructure concessions granted to foreign powers.
* **Century Report (Year 100):**
  > *"Damascus is gleaming with luxury towers, but the Syrian state owns virtually nothing within its borders. Port revenues, phosphate mines, mobile networks, and highways are concessioned to foreign sovereign funds for 99-year leases. Syrian citizens are second-class tenants in their own land, servicing debts incurred four generations ago."*

#### Ending III: The Hollowed Republic (The Demographic Wasteland)
* **Year 20 Prerequisites:**
  * Cumulative Brain Drain $> 55\%$
  * Real Wage $< \$45/\text{month}$ for 12 or more turns
  * Active Hospitals $< 40\%$
* **Century Report (Year 100):**
  > *"A nation of the very old and the very young. Four generations of continuous emigration left the country with an irreversible demographic deficit. Factories stand silent for lack of skilled technicians; ancient irrigation channels decay because no engineers remain to maintain them. The state survives exclusively on foreign remittance transfers sent home from Europe and the Gulf."*

#### Ending IV: The Broken Marches (The Warlord Confederation)
* **Year 20 Prerequisites:**
  * Central Security Efficacy $< 40$
  * Suwayda and Daraa remain unintegrated autonomous cantons
  * M5 highway tolls formalized to local paramilitaries
* **Century Report (Year 100):**
  > *"The Syrian Arab Republic exists only on paper at the United Nations. In reality, the country is broken into four hostile fiefdoms separated by fortified checkpoints. Clan bosses and warlords command private gendarmeries, levy informal tariffs on cross-country trade, and negotiate independent treaties with foreign patrons."*

#### Ending V: The Ecological Dust Bowl (Agrarian Desertification)
* **Year 20 Prerequisites:**
  * Farmland demining completed $< 45\%$
  * Ground Aquifer Depletion critical; Euphrates water treaties neglected.
* **Century Report (Year 100):**
  > *"The eastern and southern agricultural plains collapsed into arid dust. Unregulated artesian well-drilling exhausted deep aquifers by Year 48, turning the Jazira and Horan into barren deserts. Over 5 million environmental refugees crowd into informal slums surrounding Damascus and Homs, sustained by international caloric emergency relief."*

#### Ending VI: The Garrison Bastion (The Autarkic Surveillance State)
* **Year 20 Prerequisites:**
  * Military & Security Payroll $> 55\%$ of total national budget
  * Civil Liberties suppressed to keep $RRI < 50$
  * Price controls and mandatory labor drafts enforced by state security.
* **Century Report (Year 100):**
  > *"Order was maintained through absolute terror. The state is a vast armed camp, highly militarized and culturally isolated. Citizens receive caloric rations via digital entitlement cards and work in state-directed agricultural cooperatives. The streets are safe, dissent is impossible, and society is completely frozen in time."*

---

### Southern Regional Generational Outcomes

In addition to the national ending, the southern theater computes its own localized destiny based on the resolution of As-Suwayda and Daraa:
1. **The Unified Marches:** Suwayda integrated as an autonomous constitutional province; displaced Bedouin tribes compensated and resettled; Nassib crossing transparently automated, funding southern hospitals.
2. **The Fractured Buffer:** Suwayda seceded into an impoverished, isolated canton under foreign air umbrellas; Daraa permanently militarized under cross-border standoff fire.
3. **The Cartel Frontier:** Armed smuggling mafias control the southern highways; Nassib custom revenues permanently captured by warlords.

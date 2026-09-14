# 08. Resolved Design Decisions & Gameplay Specifications

This document records the definitive, binding design decisions and systemic resolutions for *President Game*, answering all open game design, balance, UI, and technical architecture questions.

---

## 1. Macroeconomic Engine & Monetary Decisions

### D1.1: Linear Seigniorage & Exchange Rate Depreciation
* **Decision:** Depreciation of the Syrian Pound (SYP) parallel street rate follows a **linear, predictable model** rather than an exponential runaway loop:
  $$\Delta\text{FX}_{\text{street}}\% = \left(\frac{\Delta M_2}{M_2}\right) + \left(\frac{\text{Net FX Drain}}{\text{Total FX Reserves}} \times 0.50\right) - (\text{GDP Growth}\% \times 0.50)$$
* **Rationale:** Keeps the monetary model understandable and prevents accidental instant death spirals from early learning mistakes while still maintaining strict mathematical accountability.

---

### D1.2: Central Bank FX Intervention & Spread Levers
* **Decision:** All three policy levers are available to the player:
  1. **Official Peg Devaluation (تعديل السعر الرسمي):** Adjust the official peg toward the street rate to capture remittances, at the cost of immediate import inflation.
  2. **Central Bank Dollar Auctions (مزاد العملة الأجنبية):** The state injects USD from reserves into domestic banks to mop up excess domestic SYP.
     * **Hard Constraint:** The engine enforces strict validation: `reservesUSD >= auctionAmount`. The player **cannot sell USD they do not hold**.
  3. **Regulatory Crackdown (مكافحة المضاربة):** Enforce strict laws against black-market currency manipulation, lowering visible trading but slightly reducing informal remittance efficiency.

---

### D1.3: Fiscal Runway & Survival Predictor UI
* **Decision:** The UI features a persistent, dynamic **Fiscal Runway Alert Gauge (مؤشر الاستدامة المالية)**.
* **Mechanism:** When the player adjusts budget sliders, the engine calculates the net burn rate per turn and displays an explicit predictive warning:
  * Example: `"[تنبيه استدامة] بهذا المعدل من الإنفاق، ستنفد الاحتياطيات النقدية بالدولار خلال 3 أدوار (خطر إفلاس سيادي)"` *(At this rate of spending, FX reserves will be exhausted in 3 turns [Sovereign Default Risk])*.
  * Gives the player the ability to foresee the downstream consequences of deficit spending before confirming the turn.

---

### D1.4: Sovereign Debt Default & Concessionary Seizure
* **Decision:** If sovereign foreign debt is defaulted on (FX reserves hit 0 during an active debt coupon payment), **foreign creditors immediately seize concessionary assets**:
  * Eastern creditors seize the Palmyra phosphate railway rights and Khnifis export facilities.
  * Gulf creditors seize prime development leases (e.g. Marota City and coastal port zones).
  * The state permanently loses the recurring revenues from these assets, and Sovereign Leverage drops precipitously.

---

## 2. Spatial & Regional Systems Decisions

### D2.1: Macro Policy with Regional Emergency Interventions
* **Decision:** The player manages **national ministerial policies** (e.g. Energy generation distribution, national agricultural subsidies, demining priority tiers). 
* Provincial councils automatically execute these directives locally based on provincial administrative competence.
* The player only intervenes with direct micro-directives in **specific crisis nodes** (e.g. negotiating with As-Suwayda notables, managing Daraa border crises, or deploying emergency demining units to Aleppo).

---

### D2.2: As-Suwayda & The Southern Front: The "Perfect Integration" Path
* **Decision:** A 100% harmonious integration of As-Suwayda **is achievable** without sparking tribal rebellions.
* **Requirements for the Perfect Southern Accord (وفاق الجنوب التاريخي):**
  1. **The Southern Shura Pact:** Damascus funds full property restitution and land grants for displaced Bedouin clans in al-Lajat.
  2. **Autonomous Municipal Elections:** Legalize local administrative councils in As-Suwayda under constitutional decentralization, respecting the Druze Spiritual Leadership.
  3. **Mutual Security Protocol:** Druze local gendarmeries and Bedouin tribal border patrols operate under a shared regional security committee.
  4. **Outcome:** $SII = 100$, $SSP = 0$, $TRI = 0$, unlocking the prestigious southern trajectory: **The Unified Marches (الثغور الموحدة)**.

---

### D2.3: Golan Frontier: Frozen Conflict & Financial Attrition
* **Decision:** Forward military deployments or resistance to border incursions do **not** trigger foreign superpower world-war cascades; instead, they lock into a **Frozen Conflict Frontier (جبهة الاستنزاف المجمدة)**:
  * Causes massive recurring financial drain on the defense and emergency budget ($+1.8\text{T SYP}$ and $-\$120\text{M USD}$ in ongoing readiness and equipment repairs).
  * Stabilizes national dignity and Daraa public trust without causing an uncontrollable interstate war fail state.

---

## 3. Governance, Political Capital & Decrees Decisions

### D3.1: Political Capital (PC) Recovery Mechanisms
* **Decision:** When PC is depleted, the player can utilize three specific governance actions:
  1. **Public Cabinet Hearings (جلسات المساءلة الحكومية العلنية):** Low boost ($+5\text{ to }+8\text{ PC}$). Increases transparency and public satisfaction.
  2. **National Unity Presidential Addresses (خطاب الوحدة الوطنية):** Very low boost ($+2\text{ to }+4\text{ PC}$). Muted impact in post-war cynicism.
  3. **Conceding Ministerial Seats to Opposition Factions (إشراك قوى المعارضة في الحقائب الوزارية):** Medium boost ($+15\text{ to }+25\text{ PC}$), but introduces **Cabinet Misalignment**:
     * Opposition-controlled ministries suffer $-15\%$ execution compliance, occasionally exceed budget allowances, or drag their feet on presidential directives.

---

### D3.2: State of Exception / Martial Law (مرسوم حالة الطوارئ)
* **Decision:** The President can invoke emergency martial decrees to freeze Provincial Riot Risk ($PRRI$) across all governorates for 1 turn.
* **Consequences:**
  * Western and humanitarian donors immediately suspend up to $\$100\text{M USD}$ in aid.
  * Systemic corruption increases.
  * **Backfire Risk (5–10% chance):** The crackdown backfires, triggering spontaneous urban insurgencies and violent strikes in university and industrial hubs.

---

## 4. UI/UX, Language & Player Comprehension Decisions

### D4.1: Predictive Previews as "Ranges"
* **Decision:** Dynamic previews on sliders and choices show **probabilistic ranges** rather than 100% exact values:
  * Example: `"السعر الموازي المتوقع: 17,200 - 17,550 ل.س / دولار"`
  * Example: `"متوسط الأجر الحقيقي: $26.80 - $28.10 / شهريا"`
* Accurately reflects real-world economic uncertainty and ministerial execution drag.

---

### D4.2: Turn Action Rehearsal (Draft Desk)
* **Decision:** The player can freely adjust sliders, toggle decree options, and test budget allocations in a **Draft Rehearsal state**.
* Actions can be undone, reset, or modified at any point before pressing the final seal:
* **Once the turn execution button is confirmed, the turn is permanent and cannot be rolled back.** The player must live with the consequences until game completion.

---

### D4.3: 100% Arabic UI & Tactical Geometric Design System
* **Decision:**
  * **Language:** **Arabic Only (عربي فقط)**. No English in the main player interface.
  * **Typography:** **Thmanyah Sans (خط ثمانية)** across all headers, narrative cards, and data numbers.
  * **Icons:** Icon set sourced from **icones.js.org** (clean, monochromatic SVG line icons).
  * **Strict Zero Rounded Borders:** All borders, buttons, cards, tags, and modals have `border-radius: 0px` (`rounded-none`).
  * **Defined Color System:**
    * **Forest Palette:** Forest Accent (`#428177`), Mid Forest (`#054239`), Deep Forest (`#002623`).
    * **Golden Wheat Palette:** Light Wheat (`#edebe0`), Mid Wheat (`#b9a779`), Dark Wheat (`#988561`).
    * **Deep Umber Palette:** Crimson Umber (`#6b1f2a`), Mid Umber (`#4a151e`), Deep Umber (`#260f14`).
    * **Charcoal Palette:** Pure White (`#ffffff`), Mid Charcoal (`#3d3a3b`), Deep Charcoal (`#161616`).
  * **Financial Presentation:** High-level, color-coded status cards with plain Arabic summaries instead of dense multi-column accounting tables.

---

## 5. Three.js Spatial Map & Technical Stack Decisions

### D5.1: 3D Hexagonal Spatial Map of Syria
* **Decision:** The 14 governorates are represented as a **3D Hexagonal Tile Grid** matching the relative geographical topology of Syria on a Deep Charcoal (`#161616`) canvas.
* **Dynamic Hexagon Height:** The vertical height (extrusion) of each hexagonal column corresponds directly to governorate metrics (e.g. Capital value, reconstruction progress, or infrastructure capacity).
* **Dynamic Hexagon Color Shaders:** The color of the hexagon reflects the provincial health status:
  * Forest Accent (`#428177`): Calm ($PRRI < 40$).
  * Golden Wheat Mid (`#b9a779`): Tense ($PRRI\ 40-64$).
  * Deep Umber Mid (`#4a151e`): Civil Disobedience / Riot ($PRRI\ 65-84$).
  * Deep Umber Crimson (`#6b1f2a`): Armed Revolt ($PRRI \ge 85$).
  * Charcoal Dimming (`#3d3a3b`): Heavy Electrical Blackouts ($> 18\text{ hrs/day}$).

---

### D5.2: Frontend Stack: Svelte + Vite + Three.js
* **Decision:**
  * **Svelte + Vite:** Ultra-lightweight reactive framework, near-zero bundle overhead, instant reactivity for complex HUD dials, sliders, and drawers.
  * **Three.js:** Handles the WebGL 3D hexagonal map, camera controls, lighting, and particle effects.
  * Custom UI components built from scratch with a focus on simplicity, ease of access, keyboard/mouse RTS controls, and zero rounded corners.

---

## 6. Scope: Full 40 Turns & Complete 100-Year Generational Engine

### D6.1: Full Production Scope for the Game Jam
* **Decision:** The project is planned and developed as a **complete, full-scope title**:
  * **All 40 Semiannual Turns** (20-year playable presidential tenure).
  * **Full 14-Governorate Hexagonal Topology**.
  * **All 12 Active Master Event Cards + Southern Shocks**.
  * **All 4 Instant Fail States**.
  * **Complete Century Generational Engine** projecting Year 21 to Year 100 across the 6 national endings and southern regional trajectories.

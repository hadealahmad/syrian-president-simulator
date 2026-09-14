# 07. Three.js Spatial Visualization & Technical Architecture

## 1. High-Level Technical Architecture

The technology stack consists of:
* **Frontend Framework:** **Svelte 5** (utilizing runes: `$state`, `$derived`, `$props`) for the reactive command HUD.
* **Build System:** **Vite** + **TypeScript**.
* **3D Spatial Rendering:** **Three.js** inside an HTML `<canvas>` embedded behind the HUD.
* **Design & Styling:** **Tailwind CSS** with strict zero-radius border styling (`rounded-none`), Thmanyah Sans (خط ثمانية) typography, and the Forest, Golden Wheat, Deep Umber, and Charcoal palettes.
* **Deterministic Core:** Headless simulation engine written in pure, decoupled TypeScript.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM ARCHITECTURE LAYERS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [UI Layer: Svelte 5 Command HUD] (Arabic RTL, Zero Rounded Borders)       │
│  • Top Sovereign Ribbon • Portfolios Drawer • Provincial Inspector Drawer    │
│  • Bottom Command Dock with Rehearsal Undo & Definitive Decree Seal         │
│                                      │                                      │
│                                      ▼                                      │
│  [Reactive State & Store Manager] (Svelte 5 Runes)                          │
│  • gameStore.svelte.ts (Uncommitted draft actions vs. committed state)      │
│  • cameraStore.ts (Selected province focus & raycast events)               │
│                                      │                                      │
│                                      ▼                                      │
│  [Three.js 3D Spatial Canvas] (Center Viewport)                             │
│  • 14 Hexagonal Prism Meshes (Syrian Governorates) on Deep Charcoal Base   │
│  • Dynamic column height scaling with reconstruction score                  │
│  • Custom GLSL Status Shaders (Forest Accent to Deep Umber Crimson)         │
│  • Trade & fuel transit particle flows along M5 Highway splines             │
│                                      │                                      │
│                                      ▼                                      │
│  [Deterministic Headless Simulation Core] (Pure TypeScript)                 │
│  • Macro & Monetary Engine (Linear seigniorage, parallel FX, real wages)   │
│  • Provincial Spatial Matrix (PRRI unrest contagion, demining, blackouts)   │
│  • 3-Pool Event State Machine (12 Active cards + Southern Shock cards)     │
│  • 5-Phase Turn Lifecycle, 4 Instant Fail States & Century Engine          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Three.js Spatial Viewport Specification

### 2.1 Scene Setup & Lighting
* **Canvas Mount:** Fullscreen or responsive container with `z-index: 0`. The Svelte HUD overlays it with `z-index: 10`.
* **Clear Color:** Deep Charcoal (`#161616`) to provide a stark, high-contrast command theater.
* **Lighting:**
  * Ambient light: Dim cool slate (`#002623`, intensity 0.6) representing the situation room glow.
  * Directional light: Warm Wheat tint (`#edebe0`, intensity 1.2) angled at $45^\circ$ to cast sharp crisp shadows along the hexagonal column edges.

---

### 2.2 The 14 Hexagonal Mesh Grid
Each Syrian governorate is modeled as a 3D regular hexagonal prism (`CylinderGeometry(radius, radius, height, 6)`):
* **The Radius:** Uniform radius $R$ positioned at axial/offset grid coordinates $(q, r)$.
* **Dynamic Column Height ($Y$):** The height of each hexagon dynamically scales based on provincial stats:
  * **Default Metric:** Current Provincial Capital / Reconstruction Level ($h = 0.5 + (\text{Reconstruction Pct} \times 2.0)$).
  * As the player invests CapEx into a province, its hexagonal pillar physically rises from the landscape.

---

### 2.3 Dynamic Color Shading & Status Materials
Each hexagonal mesh utilizes a custom shader or material reacting to provincial health:

| Metric State | Hexagon Color / Shading | Visual Treatment |
| :--- | :--- | :--- |
| **Calm ($PRRI < 40$)** | Forest Accent (`#428177`) | Smooth, steady clean surface. |
| **Tense ($PRRI\ 40-64$)** | Golden Wheat Mid (`#b9a779`) | Subtle edge highlight. |
| **Riot ($PRRI\ 65-84$)** | Deep Umber Mid (`#4a151e`) | Warning strobe; particle smoke on top face. |
| **Revolt ($PRRI \ge 85$)**| Deep Umber Crimson (`#6b1f2a`) | Rapid emergency flash; red beacon light. |
| **Severe Blackout ($>18\text{h}$)**| Charcoal Mid (`#3d3a3b`) | Hexagon top face is darkened and dimmed. |
| **Minefield Saturation**| Hazard Crosshatching | Yellow/black hazard border ring around base. |

---

### 2.4 Raycasting, Selection & Camera Rig
* **Pointer Hover:** Raycaster detects intersection with any of the 14 hexagon meshes; top border highlights with an illuminated Golden Wheat wireframe (`#b9a779`) and plays a muted tactile click.
* **Click to Inspect:** Smoothly interpolates `camera.position` and `controls.target` toward the chosen hexagon, while triggering the Svelte store to slide open the **Provincial Dossier Drawer (إضبارة المحافظة)** on the right.
* **Camera Bounds:** `OrbitControls` with polar angle restricted between $20^\circ$ and $65^\circ$ to maintain an RTS tabletop perspective.

---

## 3. Deterministic Simulation Engine

### 3.1 Headless Core in Pure TypeScript
* Zero dependency on DOM, Three.js, or browser APIs.
* Easily runs automated test simulations (e.g. 500 playthroughs) to verify economic balance.
* Seeded PRNG ensures identical random event draws and market shocks for a given initial seed.

### 3.2 Full 40-Turn Lifecycle Architecture
The engine handles the complete 20-year span (Turns 1 to 40) through the 5-phase loop:
1. `auditPhase(state)`: Resolves recurring revenues, operational payroll, and seasonal modifiers (H1 harvest vs. H2 winter).
2. `spatialScanPhase(state)`: Updates individual PRRI scores, blackout hours, and migration vectors across the 14 hexagons.
3. `rehearsalActionPhase(state, playerDirectives)`: Evaluates draft actions and provides real-time predictive ranges.
4. `eventResolutionPhase(state, chosenOptions)`: Evaluates triggers across the 3 pools (Exogenous, Endogenous, Cascades) and applies option deltas.
5. `realityEnginePhase(state)`: Calculates linear seigniorage, parallel FX rate, consumer inflation, real wages, checks the 4 Instant Fail States, and advances the clock.

---

### 3.3 The 100-Year Generational Outcome Engine (Year 21 to 100)
When Turn 40 concludes without a fail state, the engine launches `runCenturyProjection(finalState)`:
* Evaluates the 5 generational determinants: Sovereign Debt-to-GDP, Cumulative Brain Drain, Farmland/Aquifer Health, Institutional Integrity, and Southern Integration.
* Deterministically selects one of the **Six 100-Year Endings** (e.g. *Sovereign Phoenix* vs. *Mortgaged Enclave*) and the **Southern Regional Trajectory** (*Unified Marches* vs. *Cartel Frontier*).
* Generates the final Arabic Century Report with historical narrative retrospectives.

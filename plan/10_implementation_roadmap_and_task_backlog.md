# 10. Implementation Roadmap & Granular Task Backlog

## 1. Phased Implementation Overview

The development of *President Game* is structured into **seven sequential phases**, ensuring that the pure mathematical simulation engine is fully verified and decoupled before connecting to the Three.js 3D spatial layer and the Svelte Nordic-RTS HUD.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       7-PHASE IMPLEMENTATION ROADMAP                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 0: TOOLING & REPOSITORY SCAFFOLDING                                  │
│  • Vite + Svelte 5 + TypeScript + Tailwind CSS + Three.js setup             │
│  • Forest, Golden Wheat, Deep Umber & Charcoal color tokens                 │
│  • Zero-radius border reset (no rounded corners anywhere)                   │
│  • Font embedding (Thmanyah Sans (خط ثمانية)) & monochromatic icon loader        │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 1: DETERMINISTIC SIMULATION CORE (HEADLESS ENGINE)                   │
│  • Master interfaces, baseline macro & provincial state (Turn 1 H1 2027)    │
│  • Dual-currency engine (linear seigniorage, parallel FX, real wages)       │
│  • Spatial engine (14 nodes, PRRI unrest tiers, contagion, demining)        │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 2: EVENT STATE MACHINE & CRISIS DECK                                 │
│  • 3-Pool event engine (Exogenous, Endogenous, Cascades)                    │
│  • Active 12 core events + 2 southern shock events + persistent state flags │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 3: TURN LIFECYCLE, FAIL STATES & CENTURY ENGINE                      │
│  • 5-Phase turn controller (Audit -> Scan -> Action -> Event -> Engine)     │
│  • 4 Instant Fail States validation (Insolvency, Riot, Mutiny, Balkanize)   │
│  • Century Generational Projection Engine (Years 21 to 100, 6 endings)      │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 4: THREE.JS 3D HEXAGONAL SPATIAL VISUALIZATION                       │
│  • 14 Hexagonal tile columns arranged in relative Syrian geography          │
│  • Dynamic extrusion height (by reconstruction score)                       │
│  • Custom GLSL shader for dynamic status color-coding (Forest to Umber)     │
│  • M5 highway & pipeline transit particle systems                           │
│  • Raycasting, smooth camera framing, and OrbitControls clamp               │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 5: NORDIC-RTS ARABIC HUD & DRAFT REHEARSAL DESK                      │
│  • Top Sovereign Ribbon with persistent Fiscal Runway Alert                 │
│  • Executive Portfolios Drawer with range-based predictive previews         │
│  • Provincial Inspector Drawer (damage, blackout, mines)                    │
│  • Bottom Command Dock with draft rehearsal and definitive seal             │
│  • Strict zero-radius rectangular components (no rounded borders)           │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 6: ARABIC EVENT DOSSIERS, AUDIT SCREENS & MODALS                     │
│  • Classified crisis dossier modal (with strict requirements)               │
│  • High-level semiannual turn reconciliation audit cards                    │
│  • Instant fail-state breaking point screen                                 │
│  • Century 100-Year Generational Destiny Report                             │
│                                      │                                      │
│                                      ▼                                      │
│  PHASE 7: SOUNDSCAPE, HEADLESS PLAYTESTING & POLISH                         │
│  • Web Audio SFX (telex typewriter, mechanical switches, seal stamp)        │
│  • Headless 500-run balance simulation verifying ending distributions       │
│  • Performance profiling, Three.js memory disposal audit                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Task Backlog by Phase

### Phase 0: Tooling & Repository Scaffolding
* [ ] **Task 0.1: Initialize Vite Project (`package.json`)**
  * Create Vite project with Svelte 5 (`svelte@next`), TypeScript, and Tailwind CSS.
  * Install dependencies: `three`, `@types/three`, `lucide-svelte`, and sound libraries.
* [ ] **Task 0.2: Configure Tailwind CSS & Global CSS Tokens (`tailwind.config.js`, `app.css`)**
  * Define color tokens: Forest (`#428177`, `#054239`, `#002623`), Golden Wheat (`#edebe0`, `#b9a779`, `#988561`), Deep Umber (`#6b1f2a`, `#4a151e`, `#260f14`), and Charcoal (`#ffffff`, `#3d3a3b`, `#161616`).
  * Enforce strict zero-radius styling (`borderRadius: { DEFAULT: '0px', none: '0px' }`).
  * Global CSS reset: `*, *::before, *::after { border-radius: 0px !important; }`.
* [ ] **Task 0.3: Arabic Typography & Font Integration (`index.html`)**
  * Embed Google Fonts / self-hosted `Thmanyah Sans (خط ثمانية)` (weights: 400, 500, 600, 700).
  * Configure HTML document root: `<html lang="ar" dir="rtl">`.

---

### Phase 1: Deterministic Simulation Core (Headless Engine)
* [ ] **Task 1.1: Core TypeScript Data Interfaces (`src/lib/engine/types.ts`)**
  * Define all sovereign metrics: `MacroeconomicState`, `ProvincialNode`, `MinistryState`, `CommissionState`, `EventCard`, `TurnAudit`.
* [ ] **Task 1.2: Initial State Ledger Initialization (`src/lib/engine/initialState.ts`)**
  * Initialize Year 1 H1 2027 parameters:
    * Domestic Treasury: 4.20 Trillion SYP ($M_2 = 18.5\text{T}$).
    * Liquid FX Reserves: $320 Million USD.
    * Official Rate: 13,500 SYP/$ | Parallel Market Rate: 16,200 SYP/$.
    * Public Sector Wage: 380,000 SYP/mo | Real Wage: $23.45/mo | MEB: $118/mo.
    * Political Capital: 50/100 | National RRI: 44/100.
  * Initialize the 14 Governorates baseline ledger with precise population, damage, blackouts, and unexploded ordnance percentages.
* [ ] **Task 1.3: Macroeconomic & Fiscal Calculations Engine (`src/lib/engine/macroEngine.ts`)**
  * Implement **Linear Seigniorage Formula**:
    $$\Delta M_2 = \max(0, \text{Deficit}_{\text{SYP}})$$
    $$\text{Rate}_{\text{Parallel}} = \text{Rate}_{\text{Parallel}} \times \left(1 + \frac{\Delta M_2}{M_2} \times 0.65\right)$$
  * Implement **Real Wage Calculation**:
    $$W_{\text{real}} = \frac{W_{\text{nominal}}}{\text{Rate}_{\text{Parallel}}}$$
  * Implement **Central Bank FX Auction Validation**:
    * Enforce check: `reservesUSD >= auctionAmount`. If insufficient, block transaction.
    * Linear stabilization: $\text{Rate}_{\text{Parallel}} \times (1 - \frac{\text{Auction}}{100\text{M}} \times 0.08)$.
  * Implement **Oligarch Asset Seizure Default**:
    * Flag and execute automated sovereign concession forfeiture on loan defaults.
* [ ] **Task 1.4: Spatial Provincial Engine (`src/lib/engine/spatialEngine.ts`)**
  * Calculate Provincial Riot Risk Index ($PRRI$):
    $$PRRI_i = \text{Damage}_i \times 0.30 + \left(1 - \frac{\text{Power}_i}{24}\right) \times 0.35 + \text{Mines}_i \times 0.20 + \dots$$
  * Implement PRRI 4-tier status mapping: Calm (0-39), Tense (40-64), Riot (65-84), Revolt (85-100).
  * Implement cross-border unrest contagion:
    $$\Delta PRRI_i = \sum_{j \in \text{Neighbors}(i)} \max(0, PRRI_j - 65) \times 0.10$$
  * Implement Demining progression and land recovery mechanics.
  * Implement Decoupled Southern Front logic:
    * As-Suwayda peaceful integration pathway (*Southern Shura Accord*).
    * Golan frozen conflict frontier border tension.

---

### Phase 2: Event State Machine & Crisis Deck
* [ ] **Task 2.1: Event Engine Architecture (`src/lib/engine/eventEngine.ts`)**
  * Implement 3-Pool event draw logic:
    * Pool 1: Exogenous Geopolitical/Commodity Shocks (Fixed draw: 1 per turn).
    * Pool 2: Endogenous Systemic Crises (Triggered by state thresholds).
    * Pool 3: Cascading Consequences (Triggered by prior choices).
* [ ] **Task 2.2: Implement 12 Active Master Event Cards (`src/lib/engine/eventDeck.ts`)**
  * Card 01: Central Bank Liquid FX Depletion Runway.
  * Card 02: Civil Service & Military Subsistence Crisis.
  * Card 03: The Bread Basket & Diesel Bottleneck.
  * Card 04: The Phosphates & Port Concession Clash.
  * Card 05: Bab el-Mandeb Maritime Interdiction.
  * Card 06: Strait of Hormuz Tanker Interception.
  * Card 07: Aleppo Thermal Plant Turbine Failure.
  * Card 08: Euphrates Upstream Flow Restriction.
  * Card 09: Imported Poultry Feed Cargo Default.
  * Card 10: Smuggling Syndicate Pipeline Tapping.
  * Card 11: The Marota City Title Forfeiture.
  * Card 12: Awassi Sheep Smuggling Hemorrhage.
* [ ] **Task 2.3: Implement Southern Front Shock Events**
  * Card 13: Al-Lajat Bedouin-Druze Highway Siege.
  * Card 14: Golan Buffer Incursion & Cross-Border Shelling.

---

### Phase 3: Turn Lifecycle, Fail States & Century Engine
* [ ] **Task 3.1: Turn Controller State Machine (`src/lib/engine/turnController.ts`)**
  * Manage 5-Phase Turn Sequence:
    * Phase 1: Semiannual Ledger Audit & Commodity Baseline.
    * Phase 2: Spatial Provincial Scan (Contagion & Blackouts).
    * Phase 3: Player Executive Decree & Budget Rehearsal.
    * Phase 4: Crisis Dossier Draw & Mandatory Decision.
    * Phase 5: Deterministic Resolution & Engine State Mutation.
  * Manage H1 Harvest vs. H2 Winter Stress semiannual modifiers.
* [ ] **Task 3.2: Instant Fail-State Evaluator (`src/lib/engine/failStateEngine.ts`)**
  * Validate breaking points after Phase 5:
    1. Sovereign Insolvency: $\text{Reserves}_{\text{USD}} \le 0$.
    2. General Urban Insurrection: $\ge 4$ governorates in Armed Revolt ($PRRI \ge 85$).
    3. Military & Security Mutiny: $W_{\text{real, military}} < \$8.00\text{/mo}$ OR Security Unrest $\ge 90$.
    4. Balkanization Cascade: As-Suwayda + 2 other regions declare independence.
* [ ] **Task 3.3: Century Generational Outcome Engine (`src/lib/engine/centuryEngine.ts`)**
  * Triggers automatically upon completing Turn 40 (Year 20):
  * Simulates Year 21 to Year 100 in four 20-year epochs.
  * Calculates and renders the 6 National Century Endings:
    * Ending I: The Levantine Tiger (المارد السوري).
    * Ending II: The Mortgaged Protectorate (المحمية المرهونة).
    * Ending III: The Hollow Republic (الجمهورية المفرغة).
    * Ending IV: The Shattered Marches (الثغور الممزقة).
    * Ending V: The Dust Belt (حزام الغبار).
    * Ending VI: The Fortress State (المعسكر المغلق).
  * Calculates and appends regional southern trajectories (Peaceful Integration vs. Druze Canton).

---

### Phase 4: Three.js 3D Hexagonal Spatial Visualization
* [ ] **Task 4.1: Three.js Viewport & Scene Scaffold (`src/lib/spatial3d/HexGridScene.ts`)**
  * Setup Three.js scene, perspective camera, ambient & directional lighting.
  * Base background set to Deep Charcoal (`#161616`).
* [ ] **Task 4.2: Hexagonal Prism Mesh Generation & Status Shaders (`src/lib/spatial3d/HexTile.ts`)**
  * Generate 14 regular hexagonal prism geometries arranged to match Syria's map layout.
  * Dynamically scale column height ($Y$-axis extrusion) based on provincial reconstruction score.
  * Implement custom GLSL shader for dynamic status color-coding:
    * Calm: Forest Accent (`#428177`)
    * Tense: Wheat Mid (`#b9a779`)
    * Riot: Umber Mid (`#4a151e`)
    * Revolt: Umber Crimson (`#6b1f2a`)
    * Blackout: Charcoal dimming (`#3d3a3b`)
* [ ] **Task 4.3: Logistics Flow & Particle Curves (`src/lib/spatial3d/LogisticsFlow.ts`)**
  * Construct 3D spline curves for the M5 Highway (Aleppo to Jordan) and eastern oil pipelines.
  * Render moving light particles along splines proportional to transit trade volume.
* [ ] **Task 4.4: Camera Rig & Raycasting (`src/lib/spatial3d/CameraRig.ts`)**
  * Setup OrbitControls with clamped polar angles ($25^\circ\text{ to }65^\circ$).
  * Implement raycast click detection: smooth camera zoom-and-frame transition to clicked hexagon.

---

### Phase 5: Nordic-RTS Arabic HUD & Draft Rehearsal Desk
* [ ] **Task 5.1: Sovereign Top Ribbon Component (`src/lib/ui/TopRibbon.svelte`)**
  * Display 6 core indicators: Domestic Treasury SYP, FX Reserves USD, Parallel FX Rate, Real Wage, Political Capital (PC), and National RRI.
  * Integrate the **Fiscal Runway Indicator (`مؤشر الاستدامة المالية`)** with dynamic alert badges:
    * `"[تنبيه عاجل] بهذا المعدل، سينفد النقد الأجنبي خلال 3 أدوار"`.
* [ ] **Task 5.2: Executive Portfolios Drawer (`src/lib/ui/MinistryDrawer.svelte`)**
  * Left-side collapsible drawer featuring the 6 consolidated ministries.
  * Sliders for budget allocations with real-time **range-based predictive previews** (e.g. `17,200 - 17,550 ل.س / دولار`).
* [ ] **Task 5.3: Provincial Inspector Drawer (`src/lib/ui/ProvincialDrawer.svelte`)**
  * Right-side drawer opening on hexagon click.
  * Display provincial damage, reconstruction cost, blackout hours, minefield contamination, and local policy toggles.
* [ ] **Task 5.4: Decree & Political Capital Desk (`src/lib/ui/DecreeDesk.svelte`)**
  * Interface to spend PC on public hearings, unity addresses, opposition cabinet appointments, port audits, and emergency martial law.
* [ ] **Task 5.5: Draft Rehearsal & Undo Store (`src/lib/stores/draftStore.ts`)**
  * Store uncommitted turn changes in a draft buffer.
  * Implement "تراجع عن التعديلات" (Undo all draft tweaks).
  * Implement the definitive seal: "اعتماد المراسيم وإنهاء الدور" (locks turn permanently).

---

### Phase 6: Arabic Event Dossiers, Audit Screens & Modals
* [ ] **Task 6.1: Crisis Telex Dossier Modal (`src/lib/ui/EventModal.svelte`)**
  * Styled as an official classified intelligence folder in Arabic with zero rounded borders.
  * Display narrative briefing, option cards with explicit requirements, instant costs, and probabilistic ranges.
* [ ] **Task 6.2: Semiannual Reconciliation Card (`src/lib/ui/TurnSummaryModal.svelte`)**
  * High-level color-coded audit card summarizing cash flows, currency shifts, grid changes, and breaking point proximity margins.
* [ ] **Task 6.3: Fail-State Breaking Point Screen (`src/lib/ui/FailStateModal.svelte`)**
  * Dramatic modal displaying catastrophic game-over report when any of the 4 breaking points are tripped.
* [ ] **Task 6.4: Century 100-Year Generational Report (`src/lib/ui/CenturyReport.svelte`)**
  * Grand conclusion screen presenting the Year 100 narrative report, historical retrospective, and final national legacy score.

---

### Phase 7: Soundscape, Headless Playtesting & Polish
* [ ] **Task 7.1: Web Audio Sound Effects (`src/lib/audio/soundManager.ts`)**
  * Ambient Situation Room terminal drone.
  * Typewriter sound for incoming crisis telex cables.
  * Tactile mechanical sound for toggles and sliders.
  * Heavy wax-seal thud when confirming turn execution.
  * Emergency siren cue when approaching fail-state thresholds.
* [ ] **Task 7.2: Headless 500-Run Balance Testing (`scripts/simulate_runs.ts`)**
  * Write headless Node.js simulation script running 500 complete 40-turn games with random heuristics.
  * Track win/loss ratios: verify that Sovereign Phoenix is rare (~5-10% of runs) and fail states occur organically under reckless policies.
* [ ] **Task 7.3: Performance Optimization & Bundle Audit**
  * Verify 60 FPS in Three.js viewport on mid-range hardware.
  * Ensure Three.js geometries and materials are properly disposed of on scene teardown.

---

### Phase 8: Deep Simulation Systems & Macroeconomic Levers (Completed)
* [x] **Task 8.1: Confiscated Assets & Oligarch Monopolies Pipeline (`src/lib/engine/revenues.ts`, `src/lib/engine/constants.ts`, `src/lib/ui/MinistryDrawer.svelte`)**
  * Implemented Decree 13/16 pipeline covering Syriatel & MTN, Hamsho Adra Steel, Marota City, and Four Seasons Hotel.
  * Three actionable presidential directives: 80/20 Voluntary Disclosure, Total State Nationalization (SOE), and Foreign Liquidation Auction.
  * Implemented Decree 16 Property Restitution to refugees vs. Monetization as state land.
* [x] **Task 8.2: Dynamic Tax Compliance Engine (`src/lib/engine/revenues.ts`)**
  * Dynamic compliance formulation based on Civic Trust, Daily Power Hours, Ministry Competence, Systemic Corruption, and Provincial PRRI.
  * Controllable statutory knobs: Corporate Profit Tax (15–30%), Telecom User Excise (10–25%), and Nassib Transit Toll ($200–$800/truck).
* [x] **Task 8.3: Foreign Financing & Sovereign Mortgages (`src/lib/engine/constants.ts`, `src/lib/engine/turn-manager.ts`, `src/lib/ui/MinistryDrawer.svelte`)**
  * Tri-Bloc loan packages: Western IFI, Gulf Sovereign Wealth Funds, and Eastern Infrastructure Credit lines.
  * Emergency concessionary mortgages: Tartus Port 49-year lease and Khneifis Phosphate 30-year concession.
* [x] **Task 8.4: Commodity Economics & Anti-Smuggling Engine (`src/lib/engine/revenues.ts`)**
  * Domestic wheat purchase pricing strategy (Subsidized Low, Market Parity, Premium Incentive) driving domestic harvest capture vs foreign grain import drain.
  * Subsidized diesel smuggling divergence (Permissive vs Standard vs Border Crackdown).
* [x] **Task 8.5: Remittance Dual Exchange Skimming (`src/lib/engine/revenues.ts`)**
  * Official Central Bank remittance skimming spread slider with the 15% underground Hawala backfire threshold.
* [x] **Task 8.6: Dynamic Inter-Provincial Demographic Migration (`src/lib/engine/spatial.ts`, `src/lib/engine/turn-manager.ts`)**
  * Semiannual population shifts simulating conflict flight from riot/revolt zones and returnee attraction to calm reconstructed governorates.
* [x] **Task 8.7: Public Sector Headcount & Clientelism Trap (`src/lib/engine/revenues.ts`, `src/lib/engine/turn-manager.ts`)**
  * Active headcount modeling with workforce strategies: Maintain, Absorb Militias, and Prune Civil Service.

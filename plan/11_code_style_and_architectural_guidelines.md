# 11. Code Style & Architectural Guidelines

## 1. Core Architectural Principles

To ensure extreme maintainability, rock-solid testability, and smooth execution during development, the codebase must adhere to four immutable architectural principles:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CORE ARCHITECTURAL PILLARS                            │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Pure Headless Simulation   │ 2. Unidirectional Data Flow                 │
│ • The simulation core has     │ • State flows down; events/actions dispatch │
│   ZERO DOM, CSS, or Three.js  │   upward.                                   │
│   dependencies.               │ • Svelte components only read derived state;│
│ • Runs headlessly in Node.js  │   they never mutate engine variables        │
│   for automated balance tests.│   directly.                                 │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. Draft Rehearsal Pattern    │ 4. Deterministic Reproducibility            │
│ • Sliders mutate an isolated  │ • All random events, shocks, and rolls      │
│   draft buffer.               │   utilize a seeded PRNG.                    │
│ • Player can Undo all changes │ • Given the same seed and player decisions, │
│   until the turn is executed. │   every playthrough resolves identically.   │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. File & Directory Organization

```
src/
├── lib/
│   ├── engine/                     # PURE SIMULATION ENGINE (Zero UI / 3D code)
│   │   ├── types.ts                # Master TypeScript interfaces & types
│   │   ├── constants.ts            # Baseline economic numbers & thresholds
│   │   ├── prng.ts                 # Seeded Pseudo-Random Number Generator
│   │   ├── baseline.ts             # Initial GameState factory (Turn 1 H1 2027)
│   │   ├── currency.ts             # Linear seigniorage & parallel FX formulas
│   │   ├── spatial.ts              # 14 Hexagon calculations & PRRI contagion
│   │   ├── revenues.ts             # Tax compliance, demining & resource rents
│   │   ├── events.ts               # 3-Pool event engine & draw state machine
│   │   ├── fail-states.ts          # The 4 Instant Fail States verification
│   │   ├── century-engine.ts       # Years 21–100 generational outcome engine
│   │   ├── turn-manager.ts         # 5-Phase semiannual turn controller
│   │   └── deck/                   # Event definitions
│   │       ├── master-events.ts    # The 12 active core event cards
│   │       └── southern-events.ts  # Al-Lajat siege & Golan incursion cards
│   ├── spatial3d/                  # THREE.JS VISUALIZATION LAYER
│   │   ├── HexagonMap.svelte       # Three.js canvas mount & resize observer
│   │   ├── hexagon-grid.ts         # 14 Hexagonal meshes & coordinate layout
│   │   ├── hexagon-shader.ts       # Custom GLSL shaders for status color-coding
│   │   ├── logistics-particles.ts  # M5 highway & crude pipeline particle flows
│   │   ├── camera-rig.ts           # Smooth raycast camera zoom & orbit clamps
│   │   └── scene-manager.ts        # Scene, renderer, lighting & disposal
│   ├── ui/                         # SVELTE 5 NORDIC-RTS ARABIC HUD
│   │   ├── TopRibbon.svelte        # Sovereign ribbon (Treasury, FX, Runway)
│   │   ├── MinistryDrawer.svelte   # Left drawer: 6 Portfolios & budget sliders
│   │   ├── ProvincialDrawer.svelte # Right drawer: Hexagon inspector & PRRI
│   │   ├── DecreeDesk.svelte       # Executive decrees & political capital
│   │   ├── EventModal.svelte       # Classified crisis telex folder
│   │   ├── TurnSummaryModal.svelte # End-of-turn Arabic audit card
│   │   ├── FailStateModal.svelte   # Catastrophic game-over sequence
│   │   ├── CenturyReport.svelte    # Final Year 100 generational report
│   │   └── common/                 # Reusable Nordic-RTS UI primitives
│   │       ├── NordicButton.svelte # Tactile button with sound & seal effect
│   │       ├── NordicToggle.svelte # Distinct mechanical toggle switch
│   │       ├── RangeSlider.svelte  # Slider with dynamic predictive range
│   │       └── MetricBadge.svelte  # Slate card badge with status glow
│   ├── stores/                     # REACTIVE SVELTE STORES
│   │   ├── game-store.ts           # Committed GameState & turn history
│   │   ├── draft-store.ts          # Active rehearsal buffer & undo stack
│   │   └── ui-store.ts             # Active drawers, selected hexagon, overlays
│   └── audio/                      # AUDIO CONTROLLER
│       └── sound-manager.ts        # Web Audio API procedural / sample triggers
├── App.svelte                      # Master layout orchestrator
└── main.ts                         # Entry point & Thmanyah Sans (خط ثمانية) loader
```

---

## 3. Naming Conventions

### 3.1 Files & Directories
* **TypeScript Engine & Store Files:** Use **kebab-case** (`turn-manager.ts`, `game-store.ts`, `century-engine.ts`).
* **Svelte Component Files:** Use **PascalCase** (`TopRibbon.svelte`, `MinistryDrawer.svelte`, `NordicButton.svelte`).
* **Asset / Audio Files:** Use **kebab-case** (`seal-thud.mp3`, `telex-chime.mp3`).

### 3.2 Functions & Methods
* Always use **camelCase** with explicit **Verb-Noun** semantics.
* Avoid ambiguous names like `update()` or `process()`.

```typescript
// GOOD: Explicit verb-noun intent
export function calculateParallelRateDepreciation(m2Delta: number, fxDrainUSD: number, reservesUSD: number): number;
export function auditSemiannualRevenues(state: GameState): RevenueAuditResult;
export function evaluateProvincialRiotRisk(node: GovernorateNode): number;
export function checkInstantFailStates(state: GameState): FailStateCheckResult;
export function generateCenturyReport(finalState: GameState): CenturyOutcomeReport;

// BAD: Ambiguous or implicit names
export function calcRate(): void;
export function doAudit(): void;
export function update(): void;
```

### 3.3 Event Handlers
* Prefix UI event handler functions with `handle` followed by the action:
  * `handleExecuteTurn()`
  * `handleSelectGovernorate(id: string)`
  * `handleResetDraft()`
  * `handleSelectEventOption(optionId: string)`

### 3.4 Boolean Variables & Flags
* Always prefix boolean variables and state flags with `is`, `has`, `can`, or `should`:
  * `isGameOver: boolean`
  * `hasRevoltTriggered: boolean`
  * `canAffordSubsidy: boolean`
  * `isFiscalRunwayCritical: boolean`
  * `shouldTriggerGolanCrisis: boolean`

### 3.5 Constants & Configuration
* Use **UPPER_SNAKE_CASE** for static domain constants:
  * `INITIAL_SYP_TREASURY = 4_200_000_000_000;`
  * `MAX_TURNS = 40;`
  * `CRITICAL_RUNWAY_MONTHS_THRESHOLD = 3.0;`
  * `OFFICIAL_PEG_SYP = 13_500;`

---

## 4. TypeScript Strict Standards

### 4.1 Zero Tolerance for `any`
* The codebase must compile with `noImplicitAny: true` and `strict: true`.
* If a type is unknown or dynamic (such as deserializing save state), use `unknown` combined with type guards:

```typescript
// GOOD: Strong type safety
export function isGovernorateNode(obj: unknown): obj is GovernorateNode {
  return typeof obj === 'object' && obj !== null && 'prri' in obj && 'dailyBlackoutHours' in obj;
}

// BAD: Suppressing type checking
export function processNode(node: any) { ... }
```

### 4.2 Discriminated Unions for State Machines
Represent turn phases, fail state reasons, and event pools as discriminated unions:

```typescript
export type TurnPhase = 
  | 'PHASE_1_AUDIT'
  | 'PHASE_2_SPATIAL_SCAN'
  | 'PHASE_3_PLAYER_DIRECTIVES'
  | 'PHASE_4_EVENT_RESOLUTION'
  | 'PHASE_5_REALITY_ENGINE';

export type FailStateReason =
  | { type: 'SOVEREIGN_INSOLVENCY'; daysExhausted: number }
  | { type: 'URBAN_INSURRECTION'; revoltingGovernorateIds: string[] }
  | { type: 'SECURITY_MUTINY'; soldierRealWageUSD: number }
  | { type: 'BALKANIZATION_CASCADE'; secededProvinceIds: string[] };
```

---

## 5. Svelte 5 Coding Conventions

### 5.1 Modern Svelte 5 Runes Usage
Components should utilize modern Svelte 5 runes rather than legacy reactive declarations:
* Use `$state()` for local component state.
* Use `$derived()` for computed reactive values (e.g. calculating preview ranges).
* Use `$props()` for type-safe component props.
* Use `$effect()` sparingly, exclusively for DOM side effects (e.g., audio triggers or resizing canvas).

```svelte
<script lang="ts">
  import type { GovernorateNode } from '$lib/engine/types';
  
  interface Props {
    node: GovernorateNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }
  
  let { node, isSelected, onSelect }: Props = $props();
  
  // Derived unrest label in Arabic
  let statusTierText = $derived(
    node.prri < 40 ? 'مستقر' :
    node.prri < 65 ? 'متوتر' :
    node.prri < 85 ? 'اضطرابات' : 'تمرد مسلح'
  );
</script>
```

### 5.2 Component Isolation & Accessibility
* Every interactive button must include accessible `aria-label` tags in Arabic.
* Toggles and buttons must have distinct focus indicators for keyboard navigation.

---

## 6. Three.js Best Practices & Memory Management

### 6.1 Strict Resource Disposal
Three.js objects allocated on the GPU are **not** garbage-collected automatically by JavaScript. Every custom geometry, material, and texture must be explicitly disposed of when unmounting:

```typescript
export function disposeThreeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((mat) => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  renderer.dispose();
  renderer.forceContextLoss();
}
```

### 6.2 Zero Allocations Inside the Render Loop
* Never instantiate objects (`new THREE.Vector3()`, `new THREE.Raycaster()`, `new THREE.Color()`) inside the animation tick function (`requestAnimationFrame` / `render()`).
* Pre-allocate scratch vectors and matrices at module scope:

```typescript
// GOOD: Pre-allocated scratch objects
const scratchVec3 = new THREE.Vector3();

export function updateHexagonHover(raycaster: THREE.Raycaster, camera: THREE.Camera): void {
  // Use scratchVec3 without allocating new memory each frame
}

// BAD: Creating garbage collection stutter at 60 FPS
export function render() {
  const temp = new THREE.Vector3(); // NEVER DO THIS
}
```

---

## 7. State Management & Draft Rehearsal Pattern

```typescript
// Draft Rehearsal Store Implementation Pattern
export class DraftStore {
  private committedState: GameState;
  public draftDirectives: TurnDirectives;
  
  constructor(initialState: GameState) {
    this.committedState = structuredClone(initialState);
    this.draftDirectives = this.getDefaultDirectives();
  }
  
  public resetDraft(): void {
    this.draftDirectives = this.getDefaultDirectives();
  }
  
  public getPreviewRanges(): PredictivePreviewRanges {
    // Pure function: evaluates draftDirectives against committedState
    return evaluateRehearsalDirectives(this.committedState, this.draftDirectives);
  }
  
  public commitTurn(): GameState {
    // Irreversible transition: executes the full 5-phase reality engine
    const nextState = executeTurnLifecycle(this.committedState, this.draftDirectives);
    this.committedState = structuredClone(nextState);
    this.resetDraft();
    return this.committedState;
  }
}
```

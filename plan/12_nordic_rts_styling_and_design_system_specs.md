# 12. Nordic-RTS Styling & Design System Specifications

## 1. Aesthetic Identity: Nordic Minimalism Meets Grand Strategy

The visual identity of *President Game* merges **Nordic minimalism** (functional elegance, uncluttered layouts, deep matte slate surfaces, ample negative space, sharp geometric framing) with a **tactile presidential RTS command interface** (Golden Wheat sovereign accents, Forest green state panels, Deep Umber crisis alerts, crisp 1px grid borders).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NORDIC-RTS VISUAL DNA OVERVIEW                         │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ • Ground Canvas: Deep Charcoal│ • Sovereign Accents: Golden Wheat           │
│   `#161616` (Stark dark base) │   `#b9a779` (Sovereign authority & border)  │
│ • Surface Panels: Deep Forest │ • Primary Text: Light Golden Wheat          │
│   `#002623` & Mid Forest      │   `#edebe0` (High-contrast typography)      │
│   `#054239`                   │ • Zero Rounded Corners: Sharp 0px borders   │
│ • High Alert: Deep Umber      │   Strictly `rounded-none` everywhere        │
│   `#6b1f2a` & `#4a151e`       │ • Simpler UI: Minimal clutter, high contrast│
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Definitive Color Palette & Design Tokens

The UI strictly adheres to the four designated tonal palettes:

### 2.1 The Forest Palette (Base Surfaces & Stability)
* **Accent Forest:** `#428177` | `hsl(171, 32%, 38%)` | `oklch(0.536 0.061 189.6)`
  * *Role:* Active interactive state, stability status, positive trends, verified indicators.
* **Mid Forest:** `#054239` | `hsl(171, 86%, 14%)` | `oklch(0.334 0.057 186.2)`
  * *Role:* Elevated cards, active tab backgrounds, secondary containers.
* **Deep Forest:** `#002623` | `hsl(173, 100%, 7%)` | `oklch(0.208 0.038 184.5)`
  * *Role:* Primary panel surfaces, drawers, top sovereign ribbon, bottom command dock.

### 2.2 The Golden Wheat Palette (Authority & Typography)
* **Light Golden Wheat:** `#edebe0` | `hsl(49, 26%, 90%)` | `oklch(0.938 0.010 95.8)`
  * *Role:* Primary text, prominent numerical figures, headers, high-contrast labels.
* **Mid Golden Wheat:** `#b9a779` | `hsl(43, 32%, 60%)` | `oklch(0.722 0.063 88.5)`
  * *Role:* Sovereign presidential seal, focused borders, active toggle knobs, key accents.
* **Dark Golden Wheat:** `#988561` | `hsl(40, 22%, 49%)` | `oklch(0.598 0.058 87.2)`
  * *Role:* Secondary text, subtle card framing, muted descriptive labels.

### 2.3 The Deep Umber Palette (Alerts, Danger & Fail States)
* **Crimson Umber:** `#6b1f2a` | `hsl(351, 55%, 27%)` | `oklch(0.354 0.108 20.7)`
  * *Role:* Critical emergency alerts, fail-state proximity warnings, armed revolt status, deficit markers.
* **Mid Umber:** `#4a151e` | `hsl(350, 56%, 19%)` | `oklch(0.279 0.083 19.5)`
  * *Role:* Alert card surfaces, warning notification badges, crisis modal backdrop accents.
* **Deep Umber:** `#260f14` | `hsl(348, 43%, 10%)` | `oklch(0.183 0.039 18.2)`
  * *Role:* Severe crisis container background, critical countdown panel base.

### 2.4 The Charcoal Palette (Structural Ground & Monochrome)
* **Pure White:** `#ffffff` | `hsl(0, 0%, 100%)` | `oklch(1 0 0)`
  * *Role:* Extreme contrast focal points, vital ticker numbers.
* **Mid Charcoal:** `#3d3a3b` | `hsl(340, 3%, 24%)` | `oklch(0.344 0.005 348.0)`
  * *Role:* Structural dividing lines, inactive borders, default slider tracks.
* **Deep Charcoal:** `#161616` | `hsl(0, 0%, 9%)` | `oklch(0.185 0 0)`
  * *Role:* Root viewport canvas background behind the 3D hexagonal map.

---

## 3. Tailwind CSS Configuration Blueprint

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Forest Group
        forest: {
          accent: '#428177',
          mid: '#054239',
          deep: '#002623',
        },
        // Golden Wheat Group
        wheat: {
          light: '#edebe0',
          mid: '#b9a779',
          dark: '#988561',
        },
        // Deep Umber Group
        umber: {
          crimson: '#6b1f2a',
          mid: '#4a151e',
          deep: '#260f14',
        },
        // Charcoal Group
        charcoal: {
          white: '#ffffff',
          mid: '#3d3a3b',
          deep: '#161616',
        },
      },
      fontFamily: {
        arabic: ['"Thmanyah Sans (خط ثمانية)"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        // Strict requirement: no rounded corners
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        full: '0px',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
};
```

---

## 4. Geometric Principle: Strict Zero-Radius Borders (No Rounded Corners)

Every UI element in the game uses **sharp, 90-degree angular corners**:
* All buttons are rectangular blocks (`rounded-none`).
* Modals, drawers, and dossiers have crisp 1px solid borders.
* Badges and tags are rectangular with `border-radius: 0px`.
* Sliders and toggles use rectangular geometric thumbs and tracks.

```css
/* Global Reset for Angular Precision */
*, *::before, *::after {
  border-radius: 0px !important;
}
```

---

## 5. Simpler UI: Distinct Visual Language (Toggles vs. Passive Stats)

To maintain a minimal and functional interface, interactive elements are clearly distinguished from passive telemetry:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PASSIVE STAT VS. ACTIVE TOGGLE                        │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ PASSIVE DATA READOUT (.stat-block)   │ MECHANICAL ACTIVE TOGGLE (.cmd-toggle)│
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Flat surface in #002623 (Deep)     │ • Tactile sharp-cornered switch block│
│ • Border: 1px solid #3d3a3b (Charcoal│ • Border: 1px solid #b9a779 (Wheat)  │
│ • No hover displacement or pointer   │ • Sharp rectangular sliding indicator│
│ • High-contrast #edebe0 readout      │ • Crisp active state in #428177      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Component Code Blueprint: Passive Stat Gauge (Sharp & Minimal)
```html
<div class="flex flex-col p-2.5 bg-forest-deep border border-charcoal-mid rounded-none">
  <span class="text-xs text-wheat-dark font-medium mb-1 font-arabic">الخزينة العامة (ل.س)</span>
  <div class="flex items-center justify-between">
    <span class="text-base font-bold text-wheat-light font-mono">4.20 تريليون</span>
    <span class="text-xs text-forest-accent font-semibold font-mono">(+1.2T)</span>
  </div>
</div>
```

### Component Code Blueprint: Mechanical Active Toggle (Rectangular & Tactile)
```html
<button 
  type="button" 
  role="switch" 
  aria-checked={isActive}
  class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-none border border-wheat-dark transition-colors duration-100 {isActive ? 'bg-forest-mid' : 'bg-charcoal-deep'}"
>
  <span 
    class="pointer-events-none inline-block h-5 w-5 transform rounded-none border border-wheat-mid transition duration-100 {isActive ? 'translate-x-0 bg-forest-accent' : '-translate-x-6 bg-charcoal-mid'}"
  >
  </span>
</button>
```

---

## 6. Persistent Fiscal Runway Alert (Sharp & High-Contrast)

Positioned directly under the Hard Currency FX Reserves readout in the top ribbon:

```html
{#if runwayMonths < 2.0}
  <!-- CRITICAL EMERGENCY WARNING -->
  <div class="flex items-center gap-2 px-2.5 py-1 bg-umber-deep border border-umber-crimson text-wheat-light text-xs font-semibold rounded-none">
    <span class="w-2 h-2 bg-umber-crimson shrink-0"></span>
    <span class="font-arabic">خطر وشيك: إفلاس سيادي متوقع خلال الدور القادم</span>
  </div>
{:else if runwayMonths <= 3.5}
  <!-- MODERATE WARNING -->
  <div class="flex items-center gap-2 px-2.5 py-1 bg-forest-mid border border-wheat-mid text-wheat-light text-xs font-semibold rounded-none">
    <span class="w-2 h-2 bg-wheat-mid shrink-0"></span>
    <span class="font-arabic">تنبيه استدامة: النقد الأجنبي يكفي {Math.round(runwayMonths)} أدوار</span>
  </div>
{:else}
  <!-- STABLE -->
  <div class="flex items-center gap-2 px-2.5 py-1 bg-forest-deep border border-charcoal-mid text-wheat-dark text-xs rounded-none">
    <span class="w-2 h-2 bg-forest-accent shrink-0"></span>
    <span class="font-arabic">الاستدامة: تغطية {Math.round(runwayMonths)} أدوار</span>
  </div>
{/if}
```

---

## 7. Range-Based Predictive Sliders (Clean & Rectangular)

```html
<div class="space-y-2 p-3 bg-forest-deep border border-charcoal-mid rounded-none">
  <div class="flex justify-between items-center text-xs font-arabic">
    <span class="text-wheat-light font-medium">تعديل أجور القطاع العام</span>
    <span class="text-wheat-mid font-bold font-mono">+{wageBumpPercent}%</span>
  </div>
  
  <input 
    type="range" 
    min="0" 
    max="50" 
    step="5" 
    bind:value={wageBumpPercent} 
    class="w-full accent-wheat-mid cursor-pointer rounded-none bg-charcoal-deep h-1.5"
  />
  
  <!-- Predictive Range Preview Box -->
  <div class="p-2 bg-charcoal-deep border border-charcoal-mid rounded-none text-xs space-y-1">
    <div class="text-wheat-dark text-[11px] font-medium font-arabic">الأثر المتوقع للقرار:</div>
    <div class="flex justify-between text-wheat-light">
      <span class="font-arabic">سعر السوق الموازي:</span>
      <span class="font-mono text-wheat-mid">{projectedFxMin} - {projectedFxMax} ل.س</span>
    </div>
    <div class="flex justify-between text-wheat-light">
      <span class="font-arabic">متوسط الأجر الحقيقي:</span>
      <span class="font-mono text-forest-accent">${projectedWageMin} - ${projectedWageMax} / شهريا</span>
    </div>
  </div>
</div>
```

---

## 8. Turn Action Dock & Command Confirmation

The bottom dock features clean rectangular action buttons with zero border-radius:

```html
<div class="h-16 w-full px-6 flex items-center justify-between bg-forest-deep border-t border-charcoal-mid rounded-none">
  <!-- Undo Draft Rehearsal -->
  <button 
    onclick={handleResetDraft}
    class="px-4 py-2 text-xs font-semibold text-wheat-dark hover:text-wheat-light hover:bg-forest-mid border border-charcoal-mid rounded-none transition-colors duration-100 font-arabic"
  >
    تراجع عن التعديلات
  </button>
  
  <!-- Draft Balance Summary -->
  <div class="flex items-center gap-3 text-xs font-medium font-arabic">
    <span class="text-wheat-dark">صافي العجز التقديري:</span>
    <span class="font-bold text-wheat-mid font-mono">{draftDeficitText}</span>
  </div>
  
  <!-- Execute Turn Button -->
  <button 
    onclick={handleExecuteTurn}
    class="px-6 py-2.5 bg-wheat-mid hover:bg-wheat-light text-forest-deep font-bold text-sm border border-wheat-mid rounded-none transition-colors duration-100 font-arabic"
  >
    مصادقة المراسيم وإنهاء الدور
  </button>
</div>
```

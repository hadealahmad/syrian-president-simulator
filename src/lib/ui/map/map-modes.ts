import type { GovernorateNode, UnrestTier } from '../../engine/types';

/**
 * Operations Console 2D map layers.
 *
 * Uses discrete flat severity fills (`--map-sev-0` .. `--map-sev-3`) defined
 * in `src/app.css` so both the default and mono themes render without
 * gradients or scattered hex codes.
 */
export type MapModeId = 'unrest' | 'power' | 'damage' | 'mines';

export type SeverityLevel = 0 | 1 | 2 | 3;

export const SEVERITY_FILLS: readonly [string, string, string, string] = [
  'var(--map-sev-0)',
  'var(--map-sev-1)',
  'var(--map-sev-2)',
  'var(--map-sev-3)',
];

export interface MapMode {
  id: MapModeId;
  labelAr: string;
  /** Icon glyph name in GameIcon. */
  icon: string;
  /** Long unit shown in the tooltip/legend where useful. */
  unitAr: string;
  /** Four legend buckets, low severity → high severity (`--map-sev-0..3`). */
  legend: { label: string; color: string }[];
}

export const MAP_MODES: MapMode[] = [
  {
    id: 'unrest',
    labelAr: 'الاحتقان',
    icon: 'flame',
    unitAr: '/100',
    legend: [
      { label: 'هادئ', color: 'var(--map-sev-0)' },
      { label: 'متوتر', color: 'var(--map-sev-1)' },
      { label: 'اضطراب', color: 'var(--map-sev-2)' },
      { label: 'تمرد', color: 'var(--map-sev-3)' },
    ],
  },
  {
    id: 'power',
    labelAr: 'الكهرباء',
    icon: 'power-generator',
    unitAr: 'س/يوم',
    legend: [
      { label: '9س+', color: 'var(--map-sev-0)' },
      { label: '7–8س', color: 'var(--map-sev-1)' },
      { label: '5–6س', color: 'var(--map-sev-2)' },
      { label: '≤ 4س', color: 'var(--map-sev-3)' },
    ],
  },
  {
    id: 'damage',
    labelAr: 'الأضرار',
    icon: 'broken-wall',
    unitAr: '% غير مُصلحة',
    legend: [
      { label: '≤ 20%', color: 'var(--map-sev-0)' },
      { label: '21–40%', color: 'var(--map-sev-1)' },
      { label: '41–60%', color: 'var(--map-sev-2)' },
      { label: '+60%', color: 'var(--map-sev-3)' },
    ],
  },
  {
    id: 'mines',
    labelAr: 'الألغام',
    icon: 'minefield',
    unitAr: '% تلوث',
    legend: [
      { label: '≤ 15%', color: 'var(--map-sev-0)' },
      { label: '16–35%', color: 'var(--map-sev-1)' },
      { label: '36–55%', color: 'var(--map-sev-2)' },
      { label: '+55%', color: 'var(--map-sev-3)' },
    ],
  },
];

export function modeById(id: MapModeId): MapMode {
  return MAP_MODES.find((m) => m.id === id) ?? MAP_MODES[0];
}

/** Daily power hours derived from blackout hours, clamped to the day. */
export function governoratePowerHours(gov: GovernorateNode): number {
  return Math.max(0, Math.min(24, 24 - (gov.dailyBlackoutHours ?? 0)));
}

/** Share of the province's capital stock still unrepaired (0–100). */
export function governorateDamagePct(gov: GovernorateNode): number {
  const capital = gov.totalCapitalUSD ?? 0;
  if (capital <= 0) return 0;
  const pct = ((gov.unrepairedDamageUSD ?? 0) / capital) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function modeValue(gov: GovernorateNode, mode: MapModeId): number {
  switch (mode) {
    case 'power':
      return Math.round(governoratePowerHours(gov) * 10) / 10;
    case 'damage':
      return governorateDamagePct(gov);
    case 'mines':
      return Math.max(0, Math.min(100, gov.mineSaturationPct ?? 0));
    default:
      return Math.round(gov.prri ?? 0);
  }
}

export interface ModeBadge {
  value: string;
  suffix: string;
}

/** Short numeric badge text for the active layer. */
export function modeBadge(gov: GovernorateNode, mode: MapModeId): ModeBadge {
  const value = modeValue(gov, mode);
  if (mode === 'power') {
    return { value: Number.isInteger(value) ? String(value) : value.toFixed(1), suffix: 'س' };
  }
  if (mode === 'damage' || mode === 'mines') {
    return { value: String(Math.round(value)), suffix: '%' };
  }
  return { value: String(Math.round(value)), suffix: '' };
}

export interface TierDisplay {
  labelAr: string;
  /** Theme-aware accent used for the tier label. */
  tone: string;
}

const TIER_DISPLAY: Record<UnrestTier, TierDisplay> = {
  CALM: { labelAr: 'هادئ', tone: 'var(--c-pos)' },
  TENSE: { labelAr: 'متوتر', tone: 'var(--c-accent)' },
  RIOT: { labelAr: 'اضطرابات', tone: 'var(--c-neg)' },
  REVOLT: { labelAr: 'تمرد', tone: 'var(--c-neg)' },
};

export function tierDisplay(tier: UnrestTier | string | undefined): TierDisplay {
  return TIER_DISPLAY[(tier as UnrestTier) ?? 'TENSE'] ?? TIER_DISPLAY.TENSE;
}

const SEVERITY_STEPS: readonly [string, string, string, string] = [
  'var(--map-sev-0)',
  'var(--map-sev-1)',
  'var(--map-sev-2)',
  'var(--map-sev-3)',
];

/**
 * Piecewise-linear mapping onto [0, 1] across ordered [value, t] knots.
 * Supports either ascending or descending value order.
 */
function piecewiseNorm(value: number, knots: readonly (readonly [number, number])[]): number {
  if (knots.length === 0) return 0;
  const ascending = knots[knots.length - 1][0] >= knots[0][0];
  if (ascending) {
    if (value <= knots[0][0]) return knots[0][1];
    for (let i = 1; i < knots.length; i += 1) {
      const [x1, y1] = knots[i];
      if (value <= x1) {
        const [x0, y0] = knots[i - 1];
        const span = x1 - x0 || 1;
        return y0 + ((value - x0) / span) * (y1 - y0);
      }
    }
    return knots[knots.length - 1][1];
  }
  // Descending (e.g. higher power hours -> lower severity)
  if (value >= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i += 1) {
    const [x1, y1] = knots[i];
    if (value >= x1) {
      const [x0, y0] = knots[i - 1];
      const span = x0 - x1 || 1;
      return y0 + ((x0 - value) / span) * (y1 - y0);
    }
  }
  return knots[knots.length - 1][1];
}

/**
 * Resolve one solid flat CSS fill per province by blending adjacent
 * `--map-sev-*` theme tokens via `color-mix()` (zero gradients, theme-aware).
 */
function interpolatedFill(tRaw: number): string {
  const t = Math.max(0, Math.min(1, tRaw));
  if (t <= 0) return SEVERITY_STEPS[0];
  if (t >= 1) return SEVERITY_STEPS[3];
  const scaled = t * 3;
  const idx = Math.min(2, Math.floor(scaled));
  const frac = scaled - idx;
  const pctB = Math.round(frac * 100);
  if (pctB <= 0) return SEVERITY_STEPS[idx];
  if (pctB >= 100) return SEVERITY_STEPS[idx + 1];
  return `color-mix(in srgb, ${SEVERITY_STEPS[idx]} ${100 - pctB}%, ${SEVERITY_STEPS[idx + 1]} ${pctB}%)`;
}

export interface ModeSeverity {
  level: SeverityLevel;
  fill: string;
  tone: string;
  isCrisis: boolean;
}

/**
 * Discrete legend bucket (0..3), interpolated flat fill (`--map-sev-0..3`),
 * indicator tone, and crisis flag for the active map layer.
 */
export function modeSeverity(node: GovernorateNode | undefined, mode: MapModeId): ModeSeverity {
  if (!node) {
    return {
      level: 1,
      fill: SEVERITY_FILLS[1],
      tone: 'var(--c-accent)',
      isCrisis: false,
    };
  }
  switch (mode) {
    case 'power': {
      const hours = governoratePowerHours(node);
      const fill = interpolatedFill(
        piecewiseNorm(hours, [
          [14, 0],
          [11, 0.12],
          [9, 0.28],
          [7, 0.5],
          [5, 0.78],
          [3, 1],
        ])
      );
      if (hours <= 4) {
        return { level: 3, fill, tone: 'var(--c-neg)', isCrisis: true };
      }
      if (hours <= 6) {
        return { level: 2, fill, tone: 'var(--c-neg)', isCrisis: false };
      }
      if (hours <= 8) {
        return { level: 1, fill, tone: 'var(--c-accent)', isCrisis: false };
      }
      return { level: 0, fill, tone: 'var(--c-pos)', isCrisis: false };
    }
    case 'damage': {
      const pct = governorateDamagePct(node);
      const fill = interpolatedFill(
        piecewiseNorm(pct, [
          [0, 0],
          [15, 0.18],
          [35, 0.42],
          [49, 0.62],
          [60, 0.86],
          [75, 1],
        ])
      );
      if (pct > 60) {
        return { level: 3, fill, tone: 'var(--c-neg)', isCrisis: true };
      }
      if (pct > 40) {
        return { level: 2, fill, tone: 'var(--c-neg)', isCrisis: false };
      }
      if (pct > 20) {
        return { level: 1, fill, tone: 'var(--c-accent)', isCrisis: false };
      }
      return { level: 0, fill, tone: 'var(--c-pos)', isCrisis: false };
    }
    case 'mines': {
      const pct = node.mineSaturationPct ?? 0;
      const fill = interpolatedFill(
        piecewiseNorm(pct, [
          [0, 0],
          [15, 0.22],
          [35, 0.46],
          [55, 0.74],
          [75, 1],
        ])
      );
      if (pct > 55) {
        return { level: 3, fill, tone: 'var(--c-neg)', isCrisis: true };
      }
      if (pct > 35) {
        return { level: 2, fill, tone: 'var(--c-neg)', isCrisis: false };
      }
      if (pct > 15) {
        return { level: 1, fill, tone: 'var(--c-accent)', isCrisis: false };
      }
      return { level: 0, fill, tone: 'var(--c-pos)', isCrisis: false };
    }
    default: {
      const prri = node.prri ?? 0;
      const fill = interpolatedFill(
        piecewiseNorm(prri, [
          [25, 0],
          [38, 0.22],
          [46, 0.4],
          [55, 0.64],
          [65, 0.8],
          [78, 1],
        ])
      );
      if (node.tier === 'REVOLT' || prri >= 70) {
        return { level: 3, fill, tone: 'var(--c-neg)', isCrisis: true };
      }
      if (node.tier === 'RIOT' || prri >= 65) {
        return { level: 2, fill, tone: 'var(--c-neg)', isCrisis: true };
      }
      if (node.tier === 'TENSE' || prri >= 45) {
        return { level: 1, fill, tone: 'var(--c-accent)', isCrisis: false };
      }
      return { level: 0, fill, tone: 'var(--c-pos)', isCrisis: false };
    }
  }
}

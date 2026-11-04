import type { GovernorateNode, UnrestTier } from '../../engine/types';

/**
 * Concept D map layers.
 *
 * The ramp colours are DATA colours (the seven-step heat scale from
 * `concepts/concept-d-hybrid.html`), not UI theme tokens: they encode a value
 * and must keep the same meaning in every theme, exactly like the old map's
 * `--map-ramp-*` scale. Everything else on the map (strokes, chrome, chips)
 * uses the theme tokens from `src/app.css`.
 */
export type MapModeId = 'unrest' | 'power' | 'damage' | 'mines';

export interface MapMode {
  id: MapModeId;
  labelAr: string;
  /** Long unit shown in the tooltip/legend where useful. */
  unitAr: string;
  /** [value, hex] interpolation stops (low → high). */
  stops: [number, string][];
  /** Four legend buckets, low → high. */
  legend: { label: string; color: string }[];
}

export const MAP_MODES: MapMode[] = [
  {
    id: 'unrest',
    labelAr: 'الاحتقان',
    unitAr: '/100',
    stops: [
      [0, '#1c4f40'],
      [45, '#5b4a1e'],
      [70, '#7a2230'],
      [100, '#9b1c2c'],
    ],
    legend: [
      { label: 'هادئ', color: '#20604f' },
      { label: 'متوتر', color: '#ad6421' },
      { label: 'اضطرابات', color: '#b74a2a' },
      { label: 'تمرد', color: '#c01f34' },
    ],
  },
  {
    id: 'power',
    labelAr: 'الكهرباء',
    unitAr: 'س/يوم',
    stops: [
      [2, '#6b3620'],
      [5, '#5b4a1e'],
      [8, '#2f5a3a'],
      [12, '#1f7a66'],
    ],
    legend: [
      { label: '≤ 4س', color: '#8f2f39' },
      { label: '5–6س', color: '#8a732c' },
      { label: '7–8س', color: '#4e7a44' },
      { label: '9س+', color: '#21957c' },
    ],
  },
  {
    id: 'damage',
    labelAr: 'الأضرار',
    unitAr: '% غير مُصلحة',
    stops: [
      [0, '#1c4f40'],
      [25, '#5b4a1e'],
      [50, '#6b3620'],
      [75, '#9b1c2c'],
    ],
    legend: [
      { label: '≤ 20%', color: '#1b5247' },
      { label: '21–40%', color: '#8a732c' },
      { label: '41–60%', color: '#a8452a' },
      { label: '+60%', color: '#b01a30' },
    ],
  },
  {
    id: 'mines',
    labelAr: 'الألغام',
    unitAr: '% تلوث',
    stops: [
      [0, '#1c4f40'],
      [20, '#5b4a1e'],
      [40, '#6b3620'],
      [70, '#9b1c2c'],
    ],
    legend: [
      { label: '≤ 15%', color: '#1b5247' },
      { label: '16–35%', color: '#8a732c' },
      { label: '36–55%', color: '#a8452a' },
      { label: '+55%', color: '#b01a30' },
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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Linear interpolation across the mode's stops (same math as concept D). */
export function rampColor(stops: [number, string][], value: number): string {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (value <= b[0]) {
      const t = Math.max(0, Math.min(1, (value - a[0]) / (b[0] - a[0] || 1)));
      const ca = hexToRgb(a[1]);
      const cb = hexToRgb(b[1]);
      const c = ca.map((channel, index) => Math.round(channel + (cb[index] - channel) * t));
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
  }
  return stops[stops.length - 1][1];
}

export interface TierDisplay {
  labelAr: string;
  /** Theme-aware accent used for the tier pill and the unrest ring. */
  tone: string;
}

const TIER_DISPLAY: Record<UnrestTier, TierDisplay> = {
  CALM: { labelAr: 'هادئ', tone: 'var(--color-forest-accent)' },
  TENSE: { labelAr: 'متوتر', tone: 'var(--color-wheat-gold)' },
  RIOT: { labelAr: 'اضطرابات', tone: 'var(--color-umber-glow)' },
  REVOLT: { labelAr: 'تمرد', tone: 'var(--color-umber-crimson)' },
};

export function tierDisplay(tier: UnrestTier | string | undefined): TierDisplay {
  return TIER_DISPLAY[(tier as UnrestTier) ?? 'TENSE'] ?? TIER_DISPLAY.TENSE;
}

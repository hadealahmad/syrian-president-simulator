// Statistic catalog for the Concept-D stats sheet.
//
// Ported verbatim from the retired stats table in `panels/StatsPanel.svelte`:
// every label, formatter, suffix and section survives here, so the new KPI
// grid shows exactly the numbers the dense table used to show. New in this
// file: the icon / range / explainer-id metadata that the tiles need, and the
// governorate card helpers that used to live inline in the panel.

import { STAT_EXPLAINERS_AR, statState, STAT_STATE_TEXT } from '../panels/shared';

export type ProjectedKey =
  | 'politicalCapital'
  | 'treasurySYP'
  | 'reservesUSD'
  | 'sovereignDebtUSD'
  | 'realWageUSD'
  | 'parallelRateSYP'
  | 'taxCompliancePct'
  | 'systemicCorruption'
  | 'civicTrust'
  | 'nationalRRI'
  | 'dailyPowerHours'
  | 'sovereignLeverage'
  | 'm2MoneySupplySYP'
  | 'civilServiceHeadcount'
  | 'civilPayrollSYP';

export type StatFmt =
  | 'points'
  | 'billion'
  | 'mUSD'
  | 'bUSD'
  | 'usd'
  | 'int'
  | 'pct'
  | 'per100'
  | 'hours'
  | 'headcount';

/** Bounded indicators get a mini bar in their tile. */
export interface StatRange {
  min: number;
  max: number;
  /** Optional tripwire/threshold drawn on the bar (e.g. the $8 wage mutiny line). */
  dangerAt?: number;
}

export interface KpiSpec {
  key: ProjectedKey;
  /** Filter/explainer id consumed by `selectedStatForOptions`. */
  statId: string;
  labelAr: string;
  fmt: StatFmt;
  icon: string;
  range?: StatRange;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function formatBillion(syp: number): string {
  const val = Number((syp / 1_000_000_000).toFixed(2));
  if (Object.is(val, -0) || val === 0) return '0.00';
  return val.toFixed(2);
}

/** Unit rendered as a small trailing label; mirrors the old table's suffixes. */
const FMT_SUFFIX: Record<string, string> = {
  points: 'نقطة',
  per100: '/100',
  hours: 'س',
  headcount: 'نسمة',
};

export function suffixFor(fmt: StatFmt): string {
  return FMT_SUFFIX[fmt] ?? '';
}

/** The exact formatter set the dense table used (money, percentages, counts). */
export function fmtVal(fmt: StatFmt, v: number): string {
  switch (fmt) {
    case 'pct':
      return `${v}%`;
    case 'points':
      return `${v}`;
    case 'per100':
      return `${v}`;
    case 'billion':
      return `${formatBillion(v)}B`;
    case 'mUSD':
      return `$${(v / 1_000_000).toFixed(1)}M`;
    case 'bUSD':
      return `$${(v / 1_000_000_000).toFixed(2)}B`;
    case 'usd':
      return `$${Number.isInteger(v) ? v : v.toFixed(1)}`;
    case 'int':
      return formatNumber(v);
    case 'hours':
      return `${v}`;
    case 'headcount':
      return formatNumber(v);
    default:
      return `${v}`;
  }
}

/** Format an intermediate interpolated value to match the target precision. */
export function fmtAnimatedVal(fmt: StatFmt, v: number, target: number): string {
  switch (fmt) {
    case 'pct':
      return Number.isInteger(target) ? `${Math.round(v)}%` : `${v.toFixed(1)}%`;
    case 'points':
    case 'per100':
      return `${Math.round(v)}`;
    case 'usd':
      return Number.isInteger(target) ? `$${Math.round(v)}` : `$${v.toFixed(1)}`;
    case 'hours':
      return Number.isInteger(target) ? `${Math.round(v)}` : v.toFixed(1);
    default:
      return fmtVal(fmt, v);
  }
}

export function signed(n: number, digits = 1): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}`;
}

export function signedPct(pctChange: number): string {
  return `${signed(pctChange)}%`;
}

/** Format an absolute delta in the stat's own unit and precision. */
export function fmtAbsDelta(fmt: StatFmt, absDiff: number): string {
  switch (fmt) {
    case 'billion':
      return `${formatBillion(absDiff)}B`;
    case 'mUSD':
      return `$${(absDiff / 1_000_000).toFixed(1)}M`;
    case 'bUSD':
      return `$${(absDiff / 1_000_000_000).toFixed(2)}B`;
    case 'usd':
      return `$${Number.isInteger(absDiff) ? absDiff : absDiff.toFixed(1)}`;
    case 'pct':
      return Number.isInteger(absDiff) ? `${absDiff}%` : `${absDiff.toFixed(1)}%`;
    case 'points':
    case 'per100':
      return `${Math.round(absDiff)}`;
    case 'hours':
      return `${Number.isInteger(absDiff) ? absDiff : absDiff.toFixed(1)}س`;
    case 'int':
    case 'headcount':
      return formatNumber(absDiff);
    default:
      return `${Math.round(absDiff)}`;
  }
}

// ── Projected-turn stat tiles (general tab) ────────────────────────────────
// 15 live-rehearsal stats. `statId` is the id TopBar uses for the explainer +
// "options related to this stat" filter, so the ids differ from the store
// keys for three of them (parallelRate, civilServiceWageUSD, unrestIndex).
export const KPI_STATS: KpiSpec[] = [
  {
    key: 'politicalCapital',
    statId: 'politicalCapital',
    labelAr: 'الرصيد السياسي',
    fmt: 'points',
    icon: 'crown-coin',
    range: { min: 0, max: 200 },
  },
  {
    key: 'treasurySYP',
    statId: 'treasurySYP',
    labelAr: 'الخزينة العامة',
    fmt: 'billion',
    icon: 'money-stack',
  },
  {
    key: 'reservesUSD',
    statId: 'reservesUSD',
    labelAr: 'احتياطي النقد الأجنبي',
    fmt: 'mUSD',
    icon: 'coins',
  },
  {
    key: 'sovereignDebtUSD',
    statId: 'sovereignDebtUSD',
    labelAr: 'الدين السيادي الخارجي',
    fmt: 'bUSD',
    icon: 'scales',
  },
  {
    key: 'realWageUSD',
    statId: 'civilServiceWageUSD',
    labelAr: 'الأجر الحقيقي للموظف',
    fmt: 'usd',
    icon: 'banknote',
    // The $8 line is the security-force mutiny tripwire (STAT_EXPLAINERS_AR).
    range: { min: 0, max: 30, dangerAt: 8 },
  },
  {
    key: 'parallelRateSYP',
    statId: 'parallelRate',
    labelAr: 'سعر الصرف الموازي',
    fmt: 'int',
    icon: 'trade',
  },
  {
    key: 'taxCompliancePct',
    statId: 'taxCompliancePct',
    labelAr: 'الامتثال الضريبي',
    fmt: 'pct',
    icon: 'abacus',
    range: { min: 0, max: 100 },
  },
  {
    key: 'systemicCorruption',
    statId: 'systemicCorruption',
    labelAr: 'الفساد المؤسسي',
    fmt: 'per100',
    icon: 'blindfold',
    range: { min: 0, max: 100, dangerAt: 65 },
  },
  {
    key: 'civicTrust',
    statId: 'civicTrust',
    labelAr: 'الثقة الشعبية',
    fmt: 'pct',
    icon: 'crowned-heart',
    range: { min: 0, max: 100, dangerAt: 35 },
  },
  {
    key: 'nationalRRI',
    statId: 'unrestIndex',
    labelAr: 'الاحتقان الوطني',
    fmt: 'per100',
    icon: 'flame',
    range: { min: 0, max: 100, dangerAt: 70 },
  },
  {
    key: 'dailyPowerHours',
    statId: 'dailyPowerHours',
    labelAr: 'ساعات التغذية اليومية',
    fmt: 'hours',
    icon: 'power-generator',
    range: { min: 0, max: 24 },
  },
  {
    key: 'sovereignLeverage',
    statId: 'sovereignLeverage',
    labelAr: 'الرافعة السيادية',
    fmt: 'pct',
    icon: 'checked-shield',
    range: { min: 0, max: 100 },
  },
  {
    key: 'm2MoneySupplySYP',
    statId: 'm2MoneySupplySYP',
    labelAr: 'المعروض النقدي',
    fmt: 'billion',
    icon: 'wallet',
  },
  {
    key: 'civilServiceHeadcount',
    statId: 'civilServiceHeadcount',
    labelAr: 'الملاك الوظيفي',
    fmt: 'headcount',
    icon: 'meeple-group',
  },
  {
    key: 'civilPayrollSYP',
    statId: 'civilPayrollSYP',
    labelAr: 'كتلة الرواتب',
    fmt: 'billion',
    icon: 'banknote',
  },
];

// Which shared state tier colours each value (same mapping the top bar uses).
const TONE_KEYS: Record<string, string> = {
  civicTrust: 'civicTrust',
  unrestIndex: 'unrestIndex',
  nationalRRI: 'unrestIndex',
  systemicCorruption: 'systemicCorruption',
  civilServiceWageUSD: 'civilServiceWageUSD',
  realWageUSD: 'civilServiceWageUSD',
};

export function valueTone(statId: string, key: ProjectedKey, value: number): string {
  if (key === 'treasurySYP' && value < 0) return 'text-umber-crimson';
  const tierKey = TONE_KEYS[statId] ?? TONE_KEYS[key];
  if (tierKey) return STAT_STATE_TEXT[statState(tierKey, value)];
  return 'text-wheat-light';
}

export type StatTone = 'ok' | 'warn' | 'crit';

export function meterTone(statId: string, key: ProjectedKey, value: number): StatTone {
  const tierKey = TONE_KEYS[statId] ?? TONE_KEYS[key];
  if (!tierKey) return value < 0 ? 'crit' : 'ok';
  return statState(tierKey, value);
}

export const METER_FILL: Record<StatTone, string> = {
  ok: 'bg-forest-accent',
  warn: 'bg-status-warn',
  crit: 'bg-umber-crimson',
};

export function explainerFor(statId: string): string {
  return STAT_EXPLAINERS_AR[statId] ?? '';
}

// ── Governorates ──────────────────────────────────────────────────────────
export const TIER_NAMES_AR: Record<string, string> = {
  CALM: 'مستقرة',
  TENSE: 'متوترة',
  RIOT: 'اضطرابات',
  REVOLT: 'تمرد مسلح',
};

/** SVG fills resolve through theme tokens, so a theme swap recolours the map. */
export const TIER_FILL: Record<string, string> = {
  CALM: 'var(--color-forest-accent-muted)',
  TENSE: 'var(--color-wheat-dark)',
  RIOT: 'var(--color-umber-border)',
  REVOLT: 'var(--color-umber-mid)',
};

export const TIER_CHIP: Record<string, string> = {
  CALM: 'border-forest-accent/40 bg-forest-accent/10 text-forest-accent',
  TENSE: 'border-wheat-mid/40 bg-wheat-mid/10 text-wheat-gold',
  RIOT: 'border-umber-border/70 bg-umber-deep/70 text-umber-crimson',
  REVOLT: 'border-umber-border bg-umber-mid text-umber-crimson',
};

/** PRRI tier colour for the province unrest meter (40 / 65 / 85 thresholds). */
export function prriToneClass(prri: number): string {
  if (prri >= 85) return 'bg-umber-crimson';
  if (prri >= 65) return 'bg-umber-crimson/70';
  if (prri >= 40) return 'bg-status-warn';
  return 'bg-forest-accent';
}

import type { ProjectedStat, ProjectedTurnSummary } from '../../engine/types';
import { STAT_EXPLAINERS_AR, STAT_STATE_TEXT, statState } from '../panels/shared';

/**
 * Shared TopBar stat model, so the bar keeps every value and its live-
 * rehearsal preview (current → projected, delta % and beneficial/harmful
 * colouring) plus raw numbers/formatters for animated count-up/down.
 */
export interface TopStat {
  /** Stat id used by `selectedStatForOptions` / `STAT_EXPLAINERS_AR`. */
  id: string;
  labelAr: string;
  /** Compact label for 360px portrait capsules. */
  shortLabelAr: string;
  icon: string;
  /** Optional currency prefix rendered before the number (e.g. '$'). */
  prefix?: string;
  /** Current numeric value, already formatted (no suffix). */
  value: string;
  /** Raw numeric current value for count-up/down tweening. */
  rawCurrent: number;
  /** Raw numeric projected value for rehearsal delta tracking. */
  rawProjected: number;
  /** Formatter matching `value` so intermediate tween frames format identically. */
  formatValue: (num: number) => string;
  /** Small unit suffix rendered after the value. */
  suffix: string;
  /** Optional shorter suffix for tight phone-landscape capsules. */
  shortSuffix?: string;
  /** Projected numeric value (only meaningful when `hasDelta`). */
  projected: string;
  /** Absolute projected change formatted in the stat's own unit, e.g. `53.96B` or `$29.8M`. */
  deltaText: string;
  /** Signed percentage string kept for the explainer popover, e.g. `+2.4%`. */
  pctText: string;
  /** Directional triangle matching `rawProjected - rawCurrent`. */
  deltaArrow: '▲' | '▼' | '';
  hasDelta: boolean;
  /** Whether the rehearsal considers the move beneficial. */
  beneficial: boolean;
  /** True when the current value is in an acute danger zone. */
  isCritical: boolean;
  /** Tailwind text colour for the current value (state tiers). */
  toneClass: string;
  explainer: string;
  /** Optional guide-tour hook (only the tiles the tour spotlights). */
  tour?: string;
}

type StatMap = Pick<
  ProjectedTurnSummary,
  | 'treasurySYP'
  | 'reservesUSD'
  | 'parallelRateSYP'
  | 'realWageUSD'
  | 'politicalCapital'
  | 'nationalRRI'
  | 'dailyPowerHours'
  | 'civicTrust'
  | 'sovereignDebtUSD'
  | 'm2MoneySupplySYP'
  | 'taxCompliancePct'
  | 'systemicCorruption'
  | 'sovereignLeverage'
  | 'civilServiceHeadcount'
  | 'civilPayrollSYP'
>;

export type TopBarStats = StatMap;

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

function formatBillion(syp: number): string {
  const val = Number((syp / 1_000_000_000).toFixed(2));
  if (Object.is(val, -0) || val === 0) return '0.00';
  return val.toFixed(2);
}

function formatBillionUSD(usd: number): string {
  return (usd / 1_000_000_000).toFixed(2);
}

function formatMillionUSD(usd: number): string {
  return (usd / 1_000_000).toFixed(1);
}

function formatMillionPeople(count: number): string {
  return (count / 1_000_000).toFixed(2);
}

/** Tone key → shared tier definition in `panels/shared.ts`. */
const TIER_KEYS: Record<string, string> = {
  civicTrust: 'civicTrust',
  unrestIndex: 'unrestIndex',
  systemicCorruption: 'systemicCorruption',
  civilServiceWageUSD: 'civilServiceWageUSD',
};

function toneFor(id: string, stat: ProjectedStat): string {
  if (id === 'treasurySYP' && stat.current < 0) return STAT_STATE_TEXT.crit;
  if (id === 'reservesUSD' && stat.current < 100_000_000) return STAT_STATE_TEXT.crit;
  if (id === 'politicalCapital' && stat.current < 15) return STAT_STATE_TEXT.crit;
  const tierKey = TIER_KEYS[id];
  if (tierKey) return STAT_STATE_TEXT[statState(tierKey, stat.current)];
  return 'text-wheat-light';
}

function criticalFor(id: string, stat: ProjectedStat): boolean {
  if (id === 'treasurySYP' && stat.current < 0) return true;
  if (id === 'reservesUSD' && stat.current < 100_000_000) return true;
  if (id === 'politicalCapital' && stat.current < 15) return true;
  const tierKey = TIER_KEYS[id];
  if (tierKey) return statState(tierKey, stat.current) === 'crit';
  return false;
}

function pctDeltaFor(stat: ProjectedStat): string {
  if (!stat.isChanged) return '';
  return `${stat.pctChange > 0 ? '+' : ''}${stat.pctChange.toFixed(1)}%`;
}

function deltaArrowFor(stat: ProjectedStat): '▲' | '▼' | '' {
  if (!stat.isChanged) return '';
  if (stat.projected > stat.current) return '▲';
  if (stat.projected < stat.current) return '▼';
  return '';
}

interface StatSpec {
  /** ProjectedTurnSummary field to read. */
  key: keyof StatMap & string;
  /** Filter/explainer id consumed by `selectedStatForOptions`. */
  id: string;
  labelAr: string;
  shortLabelAr: string;
  icon: string;
  prefix?: string;
  /** Number formatter (no suffix). */
  formatValue: (num: number) => string;
  /** Absolute magnitude formatter for the change line (includes unit when relevant). */
  formatAbsDelta: (absDiff: number) => string;
  suffix: string;
  shortSuffix?: string;
  tour?: string;
}

const PRIMARY_SPECS: StatSpec[] = [
  {
    key: 'treasurySYP',
    id: 'treasurySYP',
    labelAr: 'الخزينة',
    shortLabelAr: 'الخزينة',
    icon: 'money-stack',
    formatValue: formatBillion,
    formatAbsDelta: (d) => `${formatBillion(d)}B`,
    suffix: 'B',
  },
  {
    key: 'reservesUSD',
    id: 'reservesUSD',
    labelAr: 'الاحتياطي',
    shortLabelAr: 'الاحتياطي',
    icon: 'coins',
    prefix: '$',
    formatValue: formatMillionUSD,
    formatAbsDelta: (d) => `$${formatMillionUSD(d)}M`,
    suffix: 'M',
    tour: 'reserves',
  },
  {
    key: 'politicalCapital',
    id: 'politicalCapital',
    labelAr: 'الرصيد السياسي',
    shortLabelAr: 'الرصيد',
    icon: 'crown-coin',
    formatValue: (n) => String(Math.round(n)),
    formatAbsDelta: (d) => String(Math.round(d)),
    suffix: '/200',
    tour: 'capital',
  },
  {
    key: 'civicTrust',
    id: 'civicTrust',
    labelAr: 'الثقة الشعبية',
    shortLabelAr: 'الثقة',
    icon: 'crowned-heart',
    formatValue: (n) => String(Math.round(n)),
    formatAbsDelta: (d) => `${Math.round(d)}%`,
    suffix: '%',
  },
  {
    key: 'nationalRRI',
    id: 'unrestIndex',
    labelAr: 'الاحتقان',
    shortLabelAr: 'الاحتقان',
    icon: 'flame',
    formatValue: (n) => String(Math.round(n)),
    formatAbsDelta: (d) => String(Math.round(d)),
    suffix: '/100',
    tour: 'unrest',
  },
  {
    key: 'parallelRateSYP',
    id: 'parallelRate',
    labelAr: 'السوق الموازي',
    shortLabelAr: 'الصرف',
    icon: 'trade',
    formatValue: formatNumber,
    formatAbsDelta: (d) => formatNumber(d),
    suffix: 'ل.س/$',
    shortSuffix: 'ل.س',
    tour: 'fx-rate',
  },
];

const SECONDARY_SPECS: StatSpec[] = [
  {
    key: 'sovereignDebtUSD',
    id: 'sovereignDebtUSD',
    labelAr: 'الدين الخارجي',
    shortLabelAr: 'الدين',
    icon: 'scales',
    prefix: '$',
    formatValue: formatBillionUSD,
    formatAbsDelta: (d) => `$${formatBillionUSD(d)}B`,
    suffix: 'B',
  },
  {
    key: 'systemicCorruption',
    id: 'systemicCorruption',
    labelAr: 'الفساد المؤسسي',
    shortLabelAr: 'الفساد',
    icon: 'blindfold',
    formatValue: (n) => String(Math.round(n)),
    formatAbsDelta: (d) => String(Math.round(d)),
    suffix: '/100',
  },
  {
    key: 'taxCompliancePct',
    id: 'taxCompliancePct',
    labelAr: 'الامتثال الضريبي',
    shortLabelAr: 'الامتثال',
    icon: 'abacus',
    formatValue: (n) => String(Math.round(n)),
    formatAbsDelta: (d) => `${Math.round(d)}%`,
    suffix: '%',
  },
  {
    key: 'realWageUSD',
    id: 'civilServiceWageUSD',
    labelAr: 'أجر الموظف',
    shortLabelAr: 'الأجر',
    icon: 'banknote',
    prefix: '$',
    formatValue: (n) => String(Math.round(n * 10) / 10),
    formatAbsDelta: (d) => `$${Math.round(d * 10) / 10}`,
    suffix: '',
  },
  {
    key: 'dailyPowerHours',
    id: 'dailyPowerHours',
    labelAr: 'ساعات الكهرباء',
    shortLabelAr: 'الكهرباء',
    icon: 'power-generator',
    formatValue: (n) => String(Math.round(n * 10) / 10),
    formatAbsDelta: (d) => `${Math.round(d * 10) / 10}س`,
    suffix: 'س',
  },
  {
    key: 'sovereignLeverage',
    id: 'sovereignLeverage',
    labelAr: 'الرافعة السيادية',
    shortLabelAr: 'الرافعة',
    icon: 'checked-shield',
    formatValue: (n) => String(Math.round(n)),
    formatAbsDelta: (d) => `${Math.round(d)}%`,
    suffix: '%',
  },
  {
    key: 'm2MoneySupplySYP',
    id: 'm2MoneySupplySYP',
    labelAr: 'الكتلة النقدية M2',
    shortLabelAr: 'M2',
    icon: 'wallet',
    formatValue: formatBillion,
    formatAbsDelta: (d) => `${formatBillion(d)}B`,
    suffix: 'B SP',
  },
  {
    key: 'civilServiceHeadcount',
    id: 'civilServiceHeadcount',
    labelAr: 'ملاك الموظفين',
    shortLabelAr: 'الموظفون',
    icon: 'meeple-group',
    formatValue: formatNumber,
    formatAbsDelta: (d) => formatNumber(d),
    suffix: 'نسمة',
  },
  {
    key: 'civilPayrollSYP',
    id: 'civilPayrollSYP',
    labelAr: 'كتلة الأجور',
    shortLabelAr: 'الأجور',
    icon: 'banknote',
    formatValue: formatBillion,
    formatAbsDelta: (d) => `${formatBillion(d)}B`,
    suffix: 'B SP',
  },
];

/** Population helper kept for the TurnChip / provincial subtitle. */
export function formatPopulation(count: number): string {
  return formatMillionPeople(count);
}

function build(spec: StatSpec, map: StatMap): TopStat {
  const stat = map[spec.key];
  const hasDelta = stat.isChanged;
  const absDiff = Math.abs(stat.projected - stat.current);
  return {
    id: spec.id,
    labelAr: spec.labelAr,
    shortLabelAr: spec.shortLabelAr,
    icon: spec.icon,
    prefix: spec.prefix,
    value: spec.formatValue(stat.current),
    rawCurrent: stat.current,
    rawProjected: stat.projected,
    formatValue: spec.formatValue,
    suffix: spec.suffix,
    shortSuffix: spec.shortSuffix,
    projected: spec.formatValue(stat.projected),
    deltaText: hasDelta ? spec.formatAbsDelta(absDiff) : '',
    pctText: pctDeltaFor(stat),
    deltaArrow: deltaArrowFor(stat),
    hasDelta,
    beneficial: stat.isBeneficial,
    isCritical: criticalFor(spec.id, stat),
    toneClass: toneFor(spec.id, stat),
    explainer: STAT_EXPLAINERS_AR[spec.id] ?? '',
    tour: spec.tour,
  };
}

export function buildPrimaryStats(map: TopBarStats): TopStat[] {
  return PRIMARY_SPECS.map((spec) => build(spec, map));
}

export function buildSecondaryStats(map: TopBarStats): TopStat[] {
  return SECONDARY_SPECS.map((spec) => build(spec, map));
}

export const PRIMARY_STAT_IDS = PRIMARY_SPECS.map((s) => s.id);

import type { ProjectedStat, ProjectedTurnSummary } from '../../engine/types';
import { STAT_EXPLAINERS_AR, STAT_STATE_TEXT, statState } from '../panels/shared';

/**
 * Shared TopBar stat model. Ported from the retired `TopRibbon.svelte` so the
 * new bar keeps every value and its live-rehearsal preview (current →
 * projected, delta % and beneficial/harmful colouring) instead of duplicating
 * the mapping in markup.
 */
export interface TopStat {
  /** Stat id used by `selectedStatForOptions` / `STAT_EXPLAINERS_AR`. */
  id: string;
  labelAr: string;
  icon: string;
  /** Current numeric value, already formatted (no suffix). */
  value: string;
  /** Small unit suffix rendered after the value. */
  suffix: string;
  /** Projected numeric value (only meaningful when `hasDelta`). */
  projected: string;
  /** Signed percentage chip, e.g. `+2.4%`. */
  deltaText: string;
  hasDelta: boolean;
  /** Whether the rehearsal considers the move beneficial. */
  beneficial: boolean;
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
  const tierKey = TIER_KEYS[id];
  if (tierKey) return STAT_STATE_TEXT[statState(tierKey, stat.current)];
  return 'text-wheat-light';
}

function deltaFor(stat: ProjectedStat): string {
  if (!stat.isChanged) return '';
  return `${stat.pctChange > 0 ? '+' : ''}${stat.pctChange.toFixed(1)}%`;
}

interface StatSpec {
  /** ProjectedTurnSummary field to read. */
  key: keyof StatMap & string;
  /** Filter/explainer id consumed by `selectedStatForOptions`. */
  id: string;
  labelAr: string;
  icon: string;
  /** Formatted current number (no suffix). */
  value: (stat: ProjectedStat) => string;
  /** Formatted projected number (no suffix). */
  projected: (stat: ProjectedStat) => string;
  suffix: string;
  tour?: string;
}

const PRIMARY_SPECS: StatSpec[] = [
  {
    key: 'treasurySYP',
    id: 'treasurySYP',
    labelAr: 'الخزينة',
    icon: 'money-stack',
    value: (s) => formatBillion(s.current),
    projected: (s) => formatBillion(s.projected),
    suffix: 'B',
  },
  {
    key: 'reservesUSD',
    id: 'reservesUSD',
    labelAr: 'الاحتياطي',
    icon: 'coins',
    value: (s) => formatMillionUSD(s.current),
    projected: (s) => formatMillionUSD(s.projected),
    suffix: 'M$',
    tour: 'reserves',
  },
  {
    key: 'politicalCapital',
    id: 'politicalCapital',
    labelAr: 'الرصيد السياسي',
    icon: 'crown-coin',
    value: (s) => String(Math.round(s.current)),
    projected: (s) => String(Math.round(s.projected)),
    suffix: '/200',
    tour: 'capital',
  },
  {
    key: 'civicTrust',
    id: 'civicTrust',
    labelAr: 'الثقة الشعبية',
    icon: 'crowned-heart',
    value: (s) => String(Math.round(s.current)),
    projected: (s) => String(Math.round(s.projected)),
    suffix: '%',
  },
  {
    key: 'nationalRRI',
    id: 'unrestIndex',
    labelAr: 'الاحتقان',
    icon: 'flame',
    value: (s) => String(Math.round(s.current)),
    projected: (s) => String(Math.round(s.projected)),
    suffix: '/100',
    tour: 'unrest',
  },
  {
    key: 'parallelRateSYP',
    id: 'parallelRate',
    labelAr: 'السوق الموازي',
    icon: 'trade',
    value: (s) => formatNumber(s.current),
    projected: (s) => formatNumber(s.projected),
    suffix: 'ل.س/$',
    tour: 'fx-rate',
  },
];

const SECONDARY_SPECS: StatSpec[] = [
  {
    key: 'sovereignDebtUSD',
    id: 'sovereignDebtUSD',
    labelAr: 'الدين الخارجي',
    icon: 'scales',
    value: (s) => formatBillionUSD(s.current),
    projected: (s) => formatBillionUSD(s.projected),
    suffix: 'B$',
  },
  {
    key: 'systemicCorruption',
    id: 'systemicCorruption',
    labelAr: 'الفساد المؤسسي',
    icon: 'blindfold',
    value: (s) => String(Math.round(s.current)),
    projected: (s) => String(Math.round(s.projected)),
    suffix: '/100',
  },
  {
    key: 'taxCompliancePct',
    id: 'taxCompliancePct',
    labelAr: 'الامتثال الضريبي',
    icon: 'abacus',
    value: (s) => String(Math.round(s.current)),
    projected: (s) => String(Math.round(s.projected)),
    suffix: '%',
  },
  {
    key: 'realWageUSD',
    id: 'civilServiceWageUSD',
    labelAr: 'أجر الموظف',
    icon: 'banknote',
    value: (s) => String(s.current),
    projected: (s) => String(s.projected),
    suffix: '$',
  },
  {
    key: 'dailyPowerHours',
    id: 'dailyPowerHours',
    labelAr: 'ساعات الكهرباء',
    icon: 'power-generator',
    value: (s) => String(s.current),
    projected: (s) => String(s.projected),
    suffix: 'س',
  },
  {
    key: 'sovereignLeverage',
    id: 'sovereignLeverage',
    labelAr: 'الرافعة السيادية',
    icon: 'checked-shield',
    value: (s) => String(Math.round(s.current)),
    projected: (s) => String(Math.round(s.projected)),
    suffix: '%',
  },
  {
    key: 'm2MoneySupplySYP',
    id: 'm2MoneySupplySYP',
    labelAr: 'الكتلة النقدية M2',
    icon: 'wallet',
    value: (s) => formatBillion(s.current),
    projected: (s) => formatBillion(s.projected),
    suffix: 'B SP',
  },
  {
    key: 'civilServiceHeadcount',
    id: 'civilServiceHeadcount',
    labelAr: 'ملاك الموظفين',
    icon: 'meeple-group',
    value: (s) => formatNumber(s.current),
    projected: (s) => formatNumber(s.projected),
    suffix: 'نسمة',
  },
  {
    key: 'civilPayrollSYP',
    id: 'civilPayrollSYP',
    labelAr: 'كتلة الأجور',
    icon: 'banknote',
    value: (s) => formatBillion(s.current),
    projected: (s) => formatBillion(s.projected),
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
  return {
    id: spec.id,
    labelAr: spec.labelAr,
    icon: spec.icon,
    value: spec.value(stat),
    suffix: spec.suffix,
    projected: spec.projected(stat),
    deltaText: deltaFor(stat),
    hasDelta,
    beneficial: stat.isBeneficial,
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

import type { GameState, GovernorateNode } from '../../engine/types';
import { BASELINE_MACRO } from '../../engine/constants';

/**
 * Turn-results headline model.
 *
 * The results stage is a staged newspaper: one card per significant movement
 * of the committed turn, followed by the financial ledger. Everything here is
 * derived from data the retired results view already read (`lastTurnAudit`,
 * `macro`, `governorates`) — nothing is invented and no engine value is
 * recomputed. Where the engine does not persist a previous snapshot (power
 * hours, unrest, FX) the card reports the current figure with a qualitative
 * tone instead of a fabricated delta.
 */

export type HeadlineTone = 'good' | 'bad' | 'neutral';

export interface HeadlineCard {
  id: string;
  /** Small category line, e.g. "الاقتصاد · الأول". */
  kicker: string;
  title: string;
  body: string;
  /** Big figure shown in the delta band. */
  delta: string;
  /** Secondary figure/percent shown next to the big number. */
  note: string;
  tone: HeadlineTone;
  /** Issuing body shown in the footer (newspaper attribution). */
  source: string;
  icon: string;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function formatBillionSYP(syp: number): string {
  const val = Number((syp / 1_000_000_000).toFixed(2));
  if (Object.is(val, -0) || val === 0) return '0.00';
  return val.toFixed(2);
}

export function formatMillionUSD(usd: number): string {
  return (usd / 1_000_000).toFixed(1);
}

function signedMillionUSD(usd: number): string {
  const value = formatMillionUSD(Math.abs(usd));
  return `${usd >= 0 ? '+' : '-'}$${value}M`;
}

function signedBillionSYP(syp: number): string {
  const value = formatBillionSYP(Math.abs(syp));
  return `${syp >= 0 ? '+' : '-'}${value}B`;
}

function percentChange(delta: number, previous: number): string {
  if (!previous || !Number.isFinite(previous) || previous <= 0) return '';
  const pct = (delta / previous) * 100;
  if (!Number.isFinite(pct)) return '';
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function toneForDelta(delta: number): HeadlineTone {
  if (delta > 0) return 'good';
  if (delta < 0) return 'bad';
  return 'neutral';
}

function byUnrest(a: GovernorateNode, b: GovernorateNode): number {
  return b.prri - a.prri;
}

/** Worst three provinces by unrest, joined for the headline body. */
function hottestProvinces(governorates: Record<string, GovernorateNode>): string {
  const names = Object.values(governorates)
    .sort(byUnrest)
    .slice(0, 3)
    .map((gov) => gov.nameAr);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join('، ')} و${names[names.length - 1]}`;
}

export function buildTurnHeadlines(state: GameState): HeadlineCard[] {
  const audit = state.lastTurnAudit;
  if (!audit) return [];

  const cards: HeadlineCard[] = [];
  const macro = state.macro;

  // 1. Foreign reserves — the engine persists both the level and the delta,
  //    so the previous value can be reconstructed honestly.
  const previousReserves = macro.reservesUSD - audit.netUSDDelta;
  const reservesPercent = percentChange(audit.netUSDDelta, previousReserves);
  const reservesVerb =
    audit.netUSDDelta > 0
      ? 'يرتفع إلى'
      : audit.netUSDDelta < 0
        ? 'يهبط إلى'
        : 'يستقر عند';
  const debtServiceLine =
    (audit.debtServiceUSD ?? 0) > 0
      ? ` وبلغت خدمة الدين الخارجي ${formatMillionUSD(audit.debtServiceUSD)} مليون دولار.`
      : '';
  cards.push({
    id: 'reserves',
    kicker: 'الاقتصاد · الأول',
    title: `الاحتياطي الأجنبي ${reservesVerb} ${formatMillionUSD(macro.reservesUSD)} مليون دولار`,
    body:
      `صافي التغيّر ${signedMillionUSD(audit.netUSDDelta)} هذا الدور، والغطاء يكفي ` +
      `${audit.runwayMonths.toFixed(1)} شهراً من الاستيراد.${debtServiceLine}`,
    delta: signedMillionUSD(audit.netUSDDelta),
    note: reservesPercent,
    tone: toneForDelta(audit.netUSDDelta),
    source: 'مصرف سوريا المركزي',
    icon: 'coins',
  });

  // 2. Treasury.
  const previousTreasury = macro.treasurySYP - audit.netSYPDelta;
  const treasuryPercent = percentChange(audit.netSYPDelta, previousTreasury);
  const treasuryVerb =
    audit.netSYPDelta > 0 ? 'ترتفع إلى' : audit.netSYPDelta < 0 ? 'تهبط إلى' : 'تستقر عند';
  cards.push({
    id: 'treasury',
    kicker: 'المالية · الثاني',
    title: `الخزينة العامة ${treasuryVerb} ${formatBillionSYP(macro.treasurySYP)} مليار ل.س`,
    body:
      `المحصّل ${formatBillionSYP(audit.grossCapturedSYP)} مليار ل.س مقابل مصروف ` +
      `${formatBillionSYP(audit.expendedSYP)} مليار، منه ` +
      `${formatBillionSYP(audit.operatingExpendedSYP ?? audit.expendedSYP)} مليار تشغيلي و` +
      `${formatBillionSYP(audit.investmentExpendedSYP ?? 0)} مليار استثماري.`,
    delta: signedBillionSYP(audit.netSYPDelta),
    note: treasuryPercent,
    tone: toneForDelta(audit.netSYPDelta),
    source: 'وزارة المالية',
    icon: 'money-stack',
  });

  // 3. Electricity — level only (no previous snapshot in the audit).
  const powerTone: HeadlineTone =
    macro.dailyPowerHours >= 12 ? 'good' : macro.dailyPowerHours <= 6 ? 'bad' : 'neutral';
  cards.push({
    id: 'power',
    kicker: 'الكهرباء · الثالث',
    title: `ساعات التغذية الكهربائية تبلغ ${macro.dailyPowerHours} ساعة يومياً`,
    body:
      `قدرة التوليد المتاحة ${formatNumber(macro.gridCapacityMW)} ميغاواط، ` +
      `ويبلغ متوسط التغذية ${macro.dailyPowerHours} ساعة يومياً على المستوى الوطني.`,
    delta: `${macro.dailyPowerHours}`,
    note: 'ساعة/يوم',
    tone: powerTone,
    source: 'وزارة الكهرباء',
    icon: 'power-generator',
  });

  // 4. National unrest + rebel provinces.
  const provinces = Object.values(state.governorates);
  const revoltCount = provinces.filter((gov) => gov.tier === 'REVOLT').length;
  const hottest = hottestProvinces(state.governorates);
  const unrestTone: HeadlineTone =
    macro.nationalRRI < 40 ? 'good' : macro.nationalRRI < 65 ? 'neutral' : 'bad';
  const unrestBody =
    revoltCount > 0
      ? `تتصدر ${hottest} قائمة المحافظات احتقاناً، وعدد المحافظات المتمردة ${revoltCount}.`
      : hottest
        ? `لم تُسجّل محافظات في مرحلة التمرد، مع بقاء ${hottest} في مقدمة المحافظات احتقاناً.`
        : 'لم تُسجّل محافظات في مرحلة التمرد.';
  cards.push({
    id: 'unrest',
    kicker: 'الاحتقان · الرابع',
    title: `الاحتقان الوطني يبلغ ${macro.nationalRRI}/100`,
    body: unrestBody,
    delta: `${macro.nationalRRI}`,
    note: '/100',
    tone: unrestTone,
    source: 'غرفة العمليات الوطنية',
    icon: 'flame',
  });

  // 5. Parallel market + real wage.
  const realWage = (macro.civilServiceWageSYP / Math.max(1, macro.parallelRateSYP)).toFixed(1);
  const fxTone: HeadlineTone =
    macro.parallelRateSYP <= BASELINE_MACRO.parallelRateSYP * 1.15
      ? 'good'
      : macro.parallelRateSYP <= BASELINE_MACRO.parallelRateSYP * 1.5
        ? 'neutral'
        : 'bad';
  cards.push({
    id: 'fx',
    kicker: 'النقد · الخامس',
    title: `الليرة عند ${formatNumber(macro.parallelRateSYP)} ل.س في السوق الموازية`,
    body:
      `متوسط الأجر الحقيقي للموظف ${realWage} دولاراً شهرياً، ` +
      `والكتلة النقدية ${formatBillionSYP(macro.m2MoneySupplySYP)} مليار ل.س.`,
    delta: formatNumber(macro.parallelRateSYP),
    note: 'ل.س/$',
    tone: fxTone,
    source: 'نشرة السوق الموازي',
    icon: 'trade',
  });

  return cards;
}

// Presentation metadata for the Concept-D decree experience.
// Data (titles, descriptions, effects, PC costs) stays in `panels/shared.ts`;
// this file only adds grouping, badges, short labels and number formatting so
// both the decrees panel and the emergency panel speak one card language.

import {
  DECREE_PC_COSTS,
  formatBillion,
  type DecreeBehaviorType,
  type PoliticalDecreeItem,
} from '../panels/shared';
import {
  CHARITY_FUND_COST_SYP,
  IMPORT_SURGE_COST_USD,
  POPULIST_GRANT_COST_SYP,
} from '../../engine/revenues';

export type EffectTone = 'good' | 'bad' | 'neutral' | 'warn';

/** Visual state shared by every decree-style card (decrees, loans, facilities…). */
export type DecreeCardState = 'available' | 'queued' | 'enacted' | 'locked' | 'info';

export interface EffectChipData {
  text: string;
  tone: EffectTone;
}

export type SealTone = 'cost' | 'gain' | 'money' | 'neutral';

export interface SealData {
  value: string;
  unit: string;
  tone: SealTone;
}

/** Cost → gold seal content. Negative PC costs are gains (sovereignty acts). */
export function pcSeal(costPC: number): SealData {
  if (costPC > 0) return { value: `−${costPC}`, unit: 'رصيد', tone: 'cost' };
  if (costPC < 0) return { value: `+${Math.abs(costPC)}`, unit: 'رصيد', tone: 'gain' };
  return { value: '0', unit: 'رصيد', tone: 'neutral' };
}

export function usdSeal(usd: number): SealData {
  return {
    value: `+${(usd / 1_000_000).toFixed(0)}`,
    unit: 'مليون $',
    tone: 'gain',
  };
}

export function sypSeal(syp: number, unit = 'مليار ل.س'): SealData {
  return { value: formatBillion(syp), unit, tone: 'money' };
}

export function usdMillions(usd: number, digits = 1): string {
  return `${(usd / 1_000_000).toFixed(digits)}M$`;
}

// ── Categories ─────────────────────────────────────────────────────────────
export type DecreeCategoryId = 'reform' | 'reconcile' | 'security' | 'economy' | 'sovereignty';

export interface DecreeCategoryMeta {
  id: DecreeCategoryId;
  labelAr: string;
  /** Tailwind literals (kept whole so the compiler emits them). */
  stripClass: string;
  textClass: string;
}

export const DECREE_CATEGORIES: DecreeCategoryMeta[] = [
  {
    id: 'reform',
    labelAr: 'النزاهة والإصلاح',
    stripClass: 'bg-wheat-gold',
    textClass: 'text-wheat-gold',
  },
  {
    id: 'reconcile',
    labelAr: 'المصالحة والعودة',
    stripClass: 'bg-forest-accent',
    textClass: 'text-forest-accent',
  },
  {
    id: 'security',
    labelAr: 'الأمن والحدود',
    stripClass: 'bg-status-warn',
    textClass: 'text-status-warn',
  },
  {
    id: 'economy',
    labelAr: 'الاقتصاد والمعيشة',
    stripClass: 'bg-wheat-mid',
    textClass: 'text-wheat-mid',
  },
  {
    id: 'sovereignty',
    labelAr: 'السيادة والديون',
    stripClass: 'bg-status-info',
    textClass: 'text-status-info',
  },
];

const CATEGORY_MAP: Record<DecreeCategoryId, DecreeCategoryMeta> = Object.fromEntries(
  DECREE_CATEGORIES.map((c) => [c.id, c])
) as Record<DecreeCategoryId, DecreeCategoryMeta>;

const DECREE_CATEGORY_BY_ID: Record<string, DecreeCategoryId> = {
  ANTI_CORRUPTION_COMMISSION: 'reform',
  CABINET_HEARING: 'reform',
  PROPERTY_RESTITUTION_PORTAL: 'reconcile',
  UNITY_SPEECH: 'reconcile',
  OPPOSITION_SEATS: 'reconcile',
  SMUGGLING_BORDER_SWEEP: 'security',
  TRIBAL_CUSTOMS_COUNCIL: 'security',
  MARTIAL_LAW: 'security',
  REPUDIATE_IRAN_INFORMAL: 'sovereignty',
  REPUDIATE_IRAN_FORMAL: 'sovereignty',
  REPUDIATE_RUSSIA: 'sovereignty',
  REPUDIATE_PARIS: 'sovereignty',
};

export function decreeCategoryOf(dec: PoliticalDecreeItem): DecreeCategoryMeta {
  const id =
    DECREE_CATEGORY_BY_ID[dec.id] ?? (dec.category === 'DECREE' ? 'reform' : 'reconcile');
  return CATEGORY_MAP[id];
}

// ── Badges / short labels ──────────────────────────────────────────────────
export function decreeTypeLabel(behavior: DecreeBehaviorType): string {
  if (behavior === 'ONE_TIME') return 'مرة واحدة';
  if (behavior === 'CONTINUOUS_TOGGLE') return 'مستمر';
  return 'دوري';
}

export function decreeTypeIcon(behavior: DecreeBehaviorType): string {
  if (behavior === 'ONE_TIME') return 'scroll-quill';
  if (behavior === 'CONTINUOUS_TOGGLE') return 'power-button';
  return 'cycle';
}

const SHORT_TITLES: Record<string, string> = {
  ANTI_CORRUPTION_COMMISSION: 'هيئة النزاهة',
  PROPERTY_RESTITUTION_PORTAL: 'منصة الملكيات',
  SMUGGLING_BORDER_SWEEP: 'حملة الحدود',
  TRIBAL_CUSTOMS_COUNCIL: 'ميثاق العشائر',
  CABINET_HEARING: 'جلسة مساءلة',
  UNITY_SPEECH: 'خطاب المصالحة',
  OPPOSITION_SEATS: 'توسيع الحكومة',
  MARTIAL_LAW: 'حالة الطوارئ',
  REPUDIATE_IRAN_INFORMAL: 'بطلان المطالب الإيرانية',
  REPUDIATE_IRAN_FORMAL: 'التنصل من الائتمان الإيراني',
  REPUDIATE_RUSSIA: 'التنصل من الدين الروسي',
  REPUDIATE_PARIS: 'التنصل من الدين الباريسي',
  populistGrant: 'المنحة الشعبية',
  charityFund: 'صندوق الكرامة',
  importSurge: 'دفعة الاستيراد',
};

export function shortDecreeTitle(id: string, fallback = ''): string {
  if (SHORT_TITLES[id]) return SHORT_TITLES[id];
  const words = fallback.trim().split(/\s+/).slice(0, 3).join(' ');
  return words || id;
}

/** National effect chips for compact cards; local-only decrees fall back to all. */
export function cardEffectChips(dec: PoliticalDecreeItem): EffectChipData[] {
  const national = dec.effectsAr.filter((fx) => fx.scope === 'national');
  const source = national.length > 0 ? national : dec.effectsAr;
  return source.map((fx) => ({ text: fx.text, tone: fx.tone === 'good' ? 'good' : 'bad' }));
}

export function allEffectChips(dec: PoliticalDecreeItem): EffectChipData[] {
  return dec.effectsAr.map((fx) => ({
    text: fx.text,
    tone: fx.tone === 'good' ? 'good' : 'bad',
  }));
}

export function decreePcCost(id: string): number {
  return DECREE_PC_COSTS[id] ?? 0;
}

// ── Cash-for-legitimacy actions ────────────────────────────────────────────
export type BenefactorId = 'populistGrant' | 'charityFund' | 'importSurge';

export interface BenefactorActionDef {
  id: BenefactorId;
  shortAr: string;
  titleAr: string;
  descriptionAr: string;
  categoryLabel: string;
  typeLabel: string;
  typeIcon: string;
  costValue: string;
  costUnit: string;
  sealTone: SealTone;
  chips: EffectChipData[];
  cashSyp: number;
  cashUsd: number;
  pcDelta: number;
}

export const BENEFACTOR_ACTIONS: BenefactorActionDef[] = [
  {
    id: 'populistGrant',
    shortAr: 'المنحة الشعبية',
    titleAr: 'منحة شعبية استثنائية',
    descriptionAr: 'تحويل نقدي مباشر يشتري ولاء الشارع ويشحن الرصيد السياسي فوراً.',
    categoryLabel: 'شراء الشرعية',
    typeLabel: 'دوري',
    typeIcon: 'cycle',
    costValue: formatBillion(POPULIST_GRANT_COST_SYP),
    costUnit: 'مليار ل.س',
    sealTone: 'money',
    chips: [
      { text: '+8 رصيد سياسي', tone: 'good' },
      { text: 'لمرة واحدة هذا الدور', tone: 'neutral' },
    ],
    cashSyp: POPULIST_GRANT_COST_SYP,
    cashUsd: 0,
    pcDelta: -8,
  },
  {
    id: 'charityFund',
    shortAr: 'صندوق الكرامة',
    titleAr: 'صندوق الكرامة السيادي (إعانات أسر الشهداء)',
    descriptionAr: 'إعانات دورية مستمرة تشحن الرصيد السياسي وترفع الثقة الشعبية.',
    categoryLabel: 'شراء الشرعية',
    typeLabel: 'دوري',
    typeIcon: 'cycle',
    costValue: formatBillion(CHARITY_FUND_COST_SYP),
    costUnit: 'مليار/دور',
    sealTone: 'money',
    chips: [
      { text: '+3 رصيد سياسي/دور', tone: 'good' },
      { text: '+1 ثقة', tone: 'good' },
    ],
    cashSyp: CHARITY_FUND_COST_SYP,
    cashUsd: 0,
    pcDelta: -3,
  },
  {
    id: 'importSurge',
    shortAr: 'دفعة الاستيراد',
    titleAr: 'دفعة استيراد إغاثية طارئة (غذاء ووقود)',
    descriptionAr: 'شراء دولاري سريع يسد نقص الغذاء والوقود ويطفئ الغضب الشعبي.',
    categoryLabel: 'شراء الشرعية',
    typeLabel: 'دوري',
    typeIcon: 'cycle',
    costValue: (IMPORT_SURGE_COST_USD / 1_000_000).toFixed(0),
    costUnit: 'مليون $',
    sealTone: 'money',
    chips: [
      { text: '+6 رصيد سياسي', tone: 'good' },
      { text: '−1 سا تقنين / −2 احتقان', tone: 'good' },
      { text: 'لمرة واحدة هذا الدور', tone: 'neutral' },
    ],
    cashSyp: 0,
    cashUsd: IMPORT_SURGE_COST_USD,
    pcDelta: -6,
  },
];

export function benefactorById(id: BenefactorId): BenefactorActionDef {
  return BENEFACTOR_ACTIONS.find((a) => a.id === id) as BenefactorActionDef;
}

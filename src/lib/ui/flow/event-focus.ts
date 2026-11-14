import type { EventCard } from '../../engine/types';

export const GOV_NAMES: Record<string, string> = {
  damascus: 'دمشق',
  rif_dimashq: 'ريف دمشق',
  aleppo: 'حلب',
  homs: 'حمص',
  hama: 'حماة',
  latakia: 'اللاذقية',
  tartus: 'طرطوس',
  idlib: 'إدلب',
  deir_ez_zor: 'دير الزور',
  raqqa: 'الرقة',
  hasakeh: 'الحسكة',
  daraa: 'درعا',
  as_suwayda: 'السويداء',
  quneitra: 'القنيطرة',
};

export const CATEGORY_NAMES_AR: Record<string, string> = {
  EXOGENOUS: 'خارجي',
  ENDOGENOUS: 'داخلي',
  MACRO: 'اقتصادي كلي',
  SOUTHERN: 'الجبهة الجنوبية',
  SECURITY: 'أمني',
  INFRASTRUCTURE: 'بنية تحتية',
  AGRICULTURE: 'زراعة',
  ENERGY: 'طاقة',
  INDUSTRY: 'صناعة',
  HEALTH: 'صحة',
  ENVIRONMENT: 'بيئة',
  TRADE: 'تجارة',
  FOOD: 'غذاء',
  LOGISTICS: 'لوجستيات',
  SOVEREIGNTY: 'سيادة',
  EDUCATION: 'تعليم',
};

export function getGovName(id: string): string {
  return GOV_NAMES[id] || id;
}

/**
 * Determine which governorate an event concerns for the pre-card map focus step.
 * Uses `card.targetGovernorateId` when present and valid; otherwise falls back to
 * a unique governorate referenced across option `governorateEffects`. National or
 * multi-governorate events return `null` so they skip straight to the card.
 */
export function resolveEventFocusGovId(card: EventCard | null): string | null {
  if (!card) return null;
  if (card.targetGovernorateId && card.targetGovernorateId in GOV_NAMES) {
    return card.targetGovernorateId;
  }
  const govIds = new Set<string>();
  for (const opt of card.options ?? []) {
    for (const eff of opt.governorateEffects ?? []) {
      if (eff.governorateId in GOV_NAMES) {
        govIds.add(eff.governorateId);
      }
    }
  }
  if (govIds.size === 1) {
    return Array.from(govIds)[0];
  }
  return null;
}

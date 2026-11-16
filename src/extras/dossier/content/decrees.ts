import type { StandingDecree } from '../engine/types';

export const STANDING_DECREES: Record<string, StandingDecree> = {
  IMF_PROGRAM: {
    id: 'IMF_PROGRAM',
    name: 'برنامج صندوق النقد',
    drift: { treasury: 1, sovereignty: -1 },
  },
  MONEY_PRINTING: {
    id: 'MONEY_PRINTING',
    name: 'التمويل بالعجز',
    drift: { treasury: 1, trust: -1 },
  },
  AUSTERITY_PACT: {
    id: 'AUSTERITY_PACT',
    name: 'ميثاق التقشف',
    drift: { treasury: 1, trust: -1 },
  },
  MILITIA_INTEGRATION: {
    id: 'MILITIA_INTEGRATION',
    name: 'دمج الفصائل',
    drift: { security: 1, treasury: -1 },
  },
  LOCAL_COUNCILS: {
    id: 'LOCAL_COUNCILS',
    name: 'لامركزية خدمية',
    drift: { trust: 1, sovereignty: -1 },
  },
  FOREIGN_CONCESSION: {
    id: 'FOREIGN_CONCESSION',
    name: 'امتياز المرافئ',
    drift: { treasury: 1, sovereignty: -1 },
  },
  EMERGENCY_LAW: {
    id: 'EMERGENCY_LAW',
    name: 'أحكام الطوارئ',
    drift: { security: 2, trust: -1 },
  },
  SOLAR_FUND: {
    id: 'SOLAR_FUND',
    name: 'دعم الطاقة الشمسية',
    drift: { trust: 1, treasury: -1 },
  },
  WHEAT_RESERVE: {
    id: 'WHEAT_RESERVE',
    name: 'مخزون القمح الوطني',
    drift: { sovereignty: 1, treasury: -1 },
  },
  JUSTICE_COURT: {
    id: 'JUSTICE_COURT',
    name: 'العدالة الانتقالية',
    drift: { sovereignty: 1, security: -1 },
  },
};

export const DECREE_LIST: readonly StandingDecree[] = Object.values(STANDING_DECREES);

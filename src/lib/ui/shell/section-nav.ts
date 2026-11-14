import { get, writable } from 'svelte/store';
import { uiStore } from '../../stores/ui-store';
import {
  isOptionRelated,
  isProvincialActionRelated,
  PROVINCIAL_OPTION_KEYS,
} from '../panels/shared';

export type SectionId = 'provincial' | 'tax' | 'emergency' | 'decrees' | 'stats';
export type TreasuryTab = 'revenue' | 'spending' | 'currency';
export type GovernanceTab = 'decrees' | 'stances' | 'assets';
export type ReportsTab = 'general' | 'ministries' | 'commissions' | 'governorates';

export interface SectionNavState {
  treasuryTab: TreasuryTab;
  governanceTab: GovernanceTab;
  reportsTab: ReportsTab;
}

const DEFAULT_STATE: SectionNavState = {
  treasuryTab: 'revenue',
  governanceTab: 'decrees',
  reportsTab: 'general',
};

function createSectionNavStore() {
  const { subscribe, update, set } = writable<SectionNavState>({ ...DEFAULT_STATE });

  return {
    subscribe,
    setTreasuryTab: (tab: TreasuryTab) =>
      update((s) => (s.treasuryTab === tab ? s : { ...s, treasuryTab: tab })),
    setGovernanceTab: (tab: GovernanceTab) =>
      update((s) => (s.governanceTab === tab ? s : { ...s, governanceTab: tab })),
    setReportsTab: (tab: ReportsTab) =>
      update((s) => (s.reportsTab === tab ? s : { ...s, reportsTab: tab })),
    reset: () => set({ ...DEFAULT_STATE }),
  };
}

export const sectionNav = createSectionNavStore();

export interface OptionLocation {
  section: SectionId;
  subTab?: TreasuryTab | GovernanceTab | ReportsTab;
}

/**
 * Authoritative home for every option key in the 5-section Operations Console
 * layout (TASK-6-COMMON.md §4).
 */
export const OPTION_LOCATIONS: Record<string, OptionLocation> = {
  // الخريطة (provincial)
  project: { section: 'provincial' },
  demining: { section: 'provincial' },
  power: { section: 'provincial' },
  southernPolicy: { section: 'provincial' },

  // الخزينة › الإيرادات (tax.revenue)
  corporateTaxRate: { section: 'tax', subTab: 'revenue' },
  telecomExciseRate: { section: 'tax', subTab: 'revenue' },
  nassibTransitFeeUSD: { section: 'tax', subTab: 'revenue' },
  remittanceCaptureSpread: { section: 'tax', subTab: 'revenue' },
  taxOverview: { section: 'tax', subTab: 'revenue' },

  // الخزينة › الإنفاق (tax.spending)
  wageBumpPercent: { section: 'tax', subTab: 'spending' },
  foodSubsidyLevel: { section: 'tax', subTab: 'spending' },
  wheatProcurement: { section: 'tax', subTab: 'spending' },
  gridCapExUSD: { section: 'tax', subTab: 'spending' },
  brainGain: { section: 'tax', subTab: 'spending' },
  charityFund: { section: 'tax', subTab: 'spending' },
  populistGrant: { section: 'tax', subTab: 'spending' },
  importSurge: { section: 'tax', subTab: 'spending' },

  // الخزينة › العملة (tax.currency)
  moneyPrintingSYP: { section: 'tax', subTab: 'currency' },
  dollarAuctionUSD: { section: 'tax', subTab: 'currency' },

  // الدَّين (emergency)
  loans: { section: 'emergency' },
  mortgages: { section: 'emergency' },
  facilities: { section: 'emergency' },
  loanTermination: { section: 'emergency' },
  extraDebtRepaymentUSD: { section: 'emergency' },
  REPUDIATE_IRAN_INFORMAL: { section: 'emergency' },
  REPUDIATE_IRAN_FORMAL: { section: 'emergency' },
  REPUDIATE_RUSSIA: { section: 'emergency' },
  REPUDIATE_PARIS: { section: 'emergency' },

  // الحكم › المراسيم (decrees.decrees)
  ANTI_CORRUPTION_COMMISSION: { section: 'decrees', subTab: 'decrees' },
  PROPERTY_RESTITUTION_PORTAL: { section: 'decrees', subTab: 'decrees' },
  SMUGGLING_BORDER_SWEEP: { section: 'decrees', subTab: 'decrees' },
  TRIBAL_CUSTOMS_COUNCIL: { section: 'decrees', subTab: 'decrees' },
  CABINET_HEARING: { section: 'decrees', subTab: 'decrees' },
  UNITY_SPEECH: { section: 'decrees', subTab: 'decrees' },
  OPPOSITION_SEATS: { section: 'decrees', subTab: 'decrees' },

  // الحكم › المواقف (decrees.stances)
  workforceStrategy: { section: 'decrees', subTab: 'stances' },
  propertyRestitution: { section: 'decrees', subTab: 'stances' },
  dieselSmuggling: { section: 'decrees', subTab: 'stances' },
  golanBorderStance: { section: 'decrees', subTab: 'stances' },
  MARTIAL_LAW: { section: 'decrees', subTab: 'stances' },

  // الحكم › الأصول (decrees.assets)
  oligarchs: { section: 'decrees', subTab: 'assets' },
};

export const TREASURY_SUBTAB_KEYS: Record<TreasuryTab, string[]> = {
  revenue: [
    'corporateTaxRate',
    'telecomExciseRate',
    'nassibTransitFeeUSD',
    'remittanceCaptureSpread',
    'taxOverview',
  ],
  spending: [
    'wageBumpPercent',
    'foodSubsidyLevel',
    'wheatProcurement',
    'gridCapExUSD',
    'brainGain',
    'charityFund',
    'populistGrant',
    'importSurge',
  ],
  currency: ['moneyPrintingSYP', 'dollarAuctionUSD'],
};

export const GOVERNANCE_SUBTAB_KEYS: Record<GovernanceTab, string[]> = {
  decrees: [
    'ANTI_CORRUPTION_COMMISSION',
    'PROPERTY_RESTITUTION_PORTAL',
    'SMUGGLING_BORDER_SWEEP',
    'TRIBAL_CUSTOMS_COUNCIL',
    'CABINET_HEARING',
    'UNITY_SPEECH',
    'OPPOSITION_SEATS',
  ],
  stances: [
    'workforceStrategy',
    'propertyRestitution',
    'dieselSmuggling',
    'golanBorderStance',
    'MARTIAL_LAW',
  ],
  assets: ['oligarchs'],
};

export const EMERGENCY_KEYS: string[] = [
  'loans',
  'mortgages',
  'facilities',
  'loanTermination',
  'extraDebtRepaymentUSD',
  'REPUDIATE_IRAN_INFORMAL',
  'REPUDIATE_IRAN_FORMAL',
  'REPUDIATE_RUSSIA',
  'REPUDIATE_PARIS',
];

const EXTRA_OPTION_STATS: Record<string, string[]> = {
  southernPolicy: ['unrestIndex', 'civicTrust', 'politicalCapital'],
  golanBorderStance: ['unrestIndex', 'civicTrust', 'treasurySYP'],
  propertyRestitution: ['reservesUSD', 'treasurySYP', 'civicTrust', 'unrestIndex'],
  facilities: ['reservesUSD', 'sovereignDebtUSD', 'sovereignLeverage', 'politicalCapital'],
  extraDebtRepaymentUSD: ['reservesUSD', 'sovereignDebtUSD', 'sovereignLeverage'],
};

export function isSectionOptionRelated(selectedStat: string | null, optionKey: string): boolean {
  if (!selectedStat) return true;
  if (
    optionKey === 'project' ||
    optionKey === 'demining' ||
    optionKey === 'power'
  ) {
    return isProvincialActionRelated(selectedStat, optionKey);
  }
  if (EXTRA_OPTION_STATS[optionKey]?.includes(selectedStat)) return true;
  return isOptionRelated(selectedStat, optionKey);
}

export function subTabHasRelated(
  selectedStat: string | null,
  sectionId: SectionId,
  subTab: string,
): boolean {
  if (!selectedStat) return false;
  if (sectionId === 'tax') {
    const keys = TREASURY_SUBTAB_KEYS[subTab as TreasuryTab] ?? [];
    return keys.some((k) => isSectionOptionRelated(selectedStat, k));
  }
  if (sectionId === 'decrees') {
    const keys = GOVERNANCE_SUBTAB_KEYS[subTab as GovernanceTab] ?? [];
    return keys.some((k) => isSectionOptionRelated(selectedStat, k));
  }
  return false;
}

export function sectionHasRelated(selectedStat: string | null, sectionId: string): boolean {
  if (!selectedStat) return false;
  const resolved = resolveLegacySection(sectionId);
  if (!resolved) return false;

  switch (resolved.section) {
    case 'provincial':
      return (
        PROVINCIAL_OPTION_KEYS.some((k) => isProvincialActionRelated(selectedStat, k)) ||
        isSectionOptionRelated(selectedStat, 'southernPolicy')
      );
    case 'tax':
      return (Object.keys(TREASURY_SUBTAB_KEYS) as TreasuryTab[]).some((tab) =>
        subTabHasRelated(selectedStat, 'tax', tab),
      );
    case 'emergency':
      return EMERGENCY_KEYS.some((k) => isSectionOptionRelated(selectedStat, k));
    case 'decrees':
      if (resolved.subTab) {
        return subTabHasRelated(selectedStat, 'decrees', resolved.subTab);
      }
      return (Object.keys(GOVERNANCE_SUBTAB_KEYS) as GovernanceTab[]).some((tab) =>
        subTabHasRelated(selectedStat, 'decrees', tab),
      );
    case 'stats':
      return false;
  }
}

export function resolveLegacySection(
  id: string,
  explicitSubTab?: string,
): OptionLocation | null {
  if (id === 'policies') {
    return {
      section: 'decrees',
      subTab: (explicitSubTab as GovernanceTab) ?? 'stances',
    };
  }
  if (id === 'assets') {
    return {
      section: 'decrees',
      subTab: (explicitSubTab as GovernanceTab) ?? 'assets',
    };
  }
  if (
    id === 'provincial' ||
    id === 'tax' ||
    id === 'emergency' ||
    id === 'decrees' ||
    id === 'stats'
  ) {
    return {
      section: id,
      subTab: explicitSubTab as OptionLocation['subTab'],
    };
  }
  return null;
}

function applySubTab(section: SectionId, subTab?: string): void {
  if (!subTab) return;
  if (
    section === 'tax' &&
    (subTab === 'revenue' || subTab === 'spending' || subTab === 'currency')
  ) {
    sectionNav.setTreasuryTab(subTab);
  } else if (
    section === 'decrees' &&
    (subTab === 'decrees' || subTab === 'stances' || subTab === 'assets')
  ) {
    sectionNav.setGovernanceTab(subTab);
  } else if (
    section === 'stats' &&
    (subTab === 'general' ||
      subTab === 'ministries' ||
      subTab === 'commissions' ||
      subTab === 'governorates')
  ) {
    sectionNav.setReportsTab(subTab);
  }
}

/**
 * Open one of the 5 sections (or legacy `policies` / `assets` deep links),
 * optionally selecting a sub-tab.
 */
export function openSection(id: SectionId | 'policies' | 'assets' | string, subTab?: string): void {
  const target = resolveLegacySection(id, subTab);
  if (!target) return;

  applySubTab(target.section, target.subTab);

  if (target.section === 'stats') {
    uiStore.closeCommandPanel();
    uiStore.toggleStatsSidebar(true);
    return;
  }

  if (target.section === 'provincial' && !get(uiStore).selectedGovernorateId) {
    uiStore.selectGovernorate('damascus');
  }
  if (target.section === 'decrees') uiStore.checkItem('decrees');
  if (target.section === 'provincial') uiStore.checkItem('province');

  uiStore.openCommandPanel(target.section, true);
}

/**
 * Navigate directly to the section and sub-tab that hosts `optionKey`.
 */
export function locateOption(optionKey: string): boolean {
  const loc = OPTION_LOCATIONS[optionKey];
  if (!loc) return false;
  openSection(loc.section, loc.subTab);
  return true;
}

/**
 * Find the first section + sub-tab containing options related to `statId`.
 */
export function locateStatTarget(statId: string): OptionLocation | null {
  const order: SectionId[] = ['tax', 'decrees', 'emergency', 'provincial'];
  for (const section of order) {
    if (section === 'tax') {
      for (const tab of ['revenue', 'spending', 'currency'] as TreasuryTab[]) {
        if (subTabHasRelated(statId, 'tax', tab)) return { section: 'tax', subTab: tab };
      }
    } else if (section === 'decrees') {
      for (const tab of ['decrees', 'stances', 'assets'] as GovernanceTab[]) {
        if (subTabHasRelated(statId, 'decrees', tab)) return { section: 'decrees', subTab: tab };
      }
    } else if (sectionHasRelated(statId, section)) {
      return { section };
    }
  }
  return null;
}

/**
 * Activate or toggle stat-related option filtering and jump straight to a
 * matching section + sub-tab when enabling the filter.
 */
export function selectStatAndJump(statId: string): void {
  const prev = get(uiStore).selectedStatForOptions;
  uiStore.openStatRelatedOptions(statId);
  if (prev === statId) return;

  const ui = get(uiStore);
  const currentSection = (ui.activeCommandPanel ??
    (ui.isStatsSidebarOpen ? 'stats' : null)) as SectionId | null;
  const nav = get(sectionNav);

  // If already viewing a section that has related options for this stat, keep
  // the section and just align its sub-tab if the current sub-tab has none.
  if (currentSection && sectionHasRelated(statId, currentSection)) {
    if (currentSection === 'tax' && !subTabHasRelated(statId, 'tax', nav.treasuryTab)) {
      const nextTab = (['revenue', 'spending', 'currency'] as TreasuryTab[]).find((t) =>
        subTabHasRelated(statId, 'tax', t),
      );
      if (nextTab) sectionNav.setTreasuryTab(nextTab);
    } else if (
      currentSection === 'decrees' &&
      !subTabHasRelated(statId, 'decrees', nav.governanceTab)
    ) {
      const nextTab = (['decrees', 'stances', 'assets'] as GovernanceTab[]).find((t) =>
        subTabHasRelated(statId, 'decrees', t),
      );
      if (nextTab) sectionNav.setGovernanceTab(nextTab);
    }
    return;
  }

  const target = locateStatTarget(statId);
  if (target) {
    openSection(target.section, target.subTab);
  }
}

// Bridge legacy `uiStore.openCommandPanel('policies' | 'assets')` calls
// (e.g. from unmigrated modals/banners) to the new الحكم sub-tabs.
uiStore.registerCommandPanelHandler((id: string) => {
  if (id === 'policies') {
    sectionNav.setGovernanceTab('stances');
    return 'decrees';
  }
  if (id === 'assets') {
    sectionNav.setGovernanceTab('assets');
    return 'decrees';
  }
  return id;
});

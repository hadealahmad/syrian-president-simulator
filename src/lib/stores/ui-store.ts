import { writable } from 'svelte/store';

export type MinistryTab = 'macro' | 'finance' | 'governance' | 'tax' | 'decrees' | 'oligarch' | 'ministries';

export interface UIState {
  selectedGovernorateId: string | null;
  isMinistryDrawerOpen: boolean;
  isProvincialDrawerOpen: boolean;
  isDecreeDeskOpen: boolean;
  isTurnSummaryModalOpen: boolean;
  isTurnReviewModalOpen: boolean;
  isRestartModalOpen: boolean;
  isGuideModalOpen: boolean;
  guideStep: number;
  activeEventModalId: string | null;
  ministryTab: MinistryTab;
}

const GUIDE_STORAGE_KEY = 'president_has_seen_guide_v1';

function checkInitialGuideSeen(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(GUIDE_STORAGE_KEY) === 'true';
  }
  return false;
}

function createUIStore() {
  const { subscribe, update, set } = writable<UIState>({
    selectedGovernorateId: null,
    isMinistryDrawerOpen: true,
    isProvincialDrawerOpen: true,
    isDecreeDeskOpen: false,
    isTurnSummaryModalOpen: false,
    isTurnReviewModalOpen: false,
    isRestartModalOpen: false,
    isGuideModalOpen: !checkInitialGuideSeen(),
    guideStep: 0,
    activeEventModalId: null,
    ministryTab: 'macro',
  });

  return {
    subscribe,
    selectGovernorate: (id: string | null) => {
      update((s) => ({
        ...s,
        selectedGovernorateId: id,
        isProvincialDrawerOpen: true,
      }));
    },
    toggleMinistryDrawer: () => {
      update((s) => ({ ...s, isMinistryDrawerOpen: !s.isMinistryDrawerOpen }));
    },
    toggleProvincialDrawer: () => {
      update((s) => ({ ...s, isProvincialDrawerOpen: !s.isProvincialDrawerOpen }));
    },
    setMinistryTab: (tab: MinistryTab) => {
      update((s) => ({ ...s, ministryTab: tab, isMinistryDrawerOpen: true }));
    },
    toggleDecreeDesk: () => {
      update((s) => ({
        ...s,
        ministryTab: 'governance',
        isMinistryDrawerOpen: true,
        isDecreeDeskOpen: false,
      }));
    },
    setTurnSummaryModal: (open: boolean) => {
      update((s) => ({ ...s, isTurnSummaryModalOpen: open }));
    },
    setTurnReviewModal: (open: boolean) => {
      update((s) => ({ ...s, isTurnReviewModalOpen: open }));
    },
    setRestartModal: (open: boolean) => {
      update((s) => ({ ...s, isRestartModalOpen: open }));
    },
    setGuideModal: (open: boolean, step: number = 0) => {
      if (typeof window !== 'undefined' && window.localStorage && !open) {
        window.localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
      }
      update((s) => ({ ...s, isGuideModalOpen: open, guideStep: step }));
    },
    setGuideStep: (step: number) => {
      update((s) => ({ ...s, guideStep: step }));
    },
    setActiveEventModal: (eventId: string | null) => {
      update((s) => ({ ...s, activeEventModalId: eventId }));
    },
    closeAllDrawers: () => {
      update((s) => ({
        ...s,
        isDecreeDeskOpen: false,
        isTurnReviewModalOpen: false,
        isRestartModalOpen: false,
        isGuideModalOpen: false,
      }));
    },
  };
}

export const uiStore = createUIStore();

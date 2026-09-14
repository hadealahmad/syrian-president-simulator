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
  activeEventModalId: string | null;
  ministryTab: MinistryTab;
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
    setActiveEventModal: (eventId: string | null) => {
      update((s) => ({ ...s, activeEventModalId: eventId }));
    },
    closeAllDrawers: () => {
      update((s) => ({
        ...s,
        isDecreeDeskOpen: false,
        isTurnReviewModalOpen: false,
        isRestartModalOpen: false,
      }));
    },
  };
}

export const uiStore = createUIStore();

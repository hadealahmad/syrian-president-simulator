import { writable } from 'svelte/store';

export interface UIState {
  selectedGovernorateId: string | null;
  isMinistryDrawerOpen: boolean;
  isProvincialDrawerOpen: boolean;
  isTurnSummaryModalOpen: boolean;
  isTurnReviewModalOpen: boolean;
  isRestartModalOpen: boolean;
  tourCompleted: boolean;
  checklist: { decrees: boolean; province: boolean; endTurn: boolean };
  selectedStatForOptions: string | null;
  activeCommandPanel: string | null;
  commandPanelPinned: boolean;
  isStatsSidebarOpen: boolean;
}

const TOUR_KEY = 'president_guide_tour_v2';

function checkTourSeen(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(TOUR_KEY) === 'true';
  }
  return false;
}

function createUIStore() {
  const { subscribe, update, set } = writable<UIState>({
    selectedGovernorateId: null,
    isMinistryDrawerOpen: false,
    isProvincialDrawerOpen: false,
    isTurnSummaryModalOpen: false,
    isTurnReviewModalOpen: false,
    isRestartModalOpen: false,
    tourCompleted: checkTourSeen(),
    checklist: { decrees: false, province: false, endTurn: false },
    selectedStatForOptions: null,
    activeCommandPanel: null,
    commandPanelPinned: false,
    isStatsSidebarOpen: false,
  });

  return {
    subscribe,
    selectGovernorate: (id: string | null) => {
      update((s) => ({
        ...s,
        selectedGovernorateId: id,
        // Map clicks pin the provincial command panel (drawers retired).
        // The stats sidebar is fully independent and never affected.
        activeCommandPanel: id ? 'provincial' : s.activeCommandPanel,
        commandPanelPinned: id ? true : s.commandPanelPinned,
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
    completeTour: () => {
      update((s) => ({ ...s, tourCompleted: true }));
    },
    checkItem: (item: 'decrees' | 'province' | 'endTurn') => {
      update((s) => ({ ...s, checklist: { ...s.checklist, [item]: true } }));
    },
    openStatRelatedOptions: (statId: string) => {
      update((s) => {
        const isSame = s.selectedStatForOptions === statId;
        return {
          ...s,
          selectedStatForOptions: isSame ? null : statId,
        };
      });
    },
    closeStatRelatedOptions: () => {
      update((s) => ({ ...s, selectedStatForOptions: null }));
    },
    openCommandPanel: (id: string | null, pinned: boolean = false) => {
      // Bottom panels never touch the independent stats sidebar.
      update((s) => ({ ...s, activeCommandPanel: id, commandPanelPinned: pinned }));
    },
    closeCommandPanel: () => {
      // Only the bottom panel; the stats sidebar has its own toggle and
      // survives canvas/governorate map clicks and other hub buttons.
      update((s) => ({ ...s, activeCommandPanel: null, commandPanelPinned: false }));
    },
    toggleStatsSidebar: (open?: boolean) => {
      // Fully independent toggle: never opens/closes bottom panels.
      update((s) => ({ ...s, isStatsSidebarOpen: open ?? !s.isStatsSidebarOpen }));
    },
  };
}

export const uiStore = createUIStore();

import { writable } from 'svelte/store';

export interface UIState {
  selectedGovernorateId: string | null;
  isMinistryDrawerOpen: boolean;
  isProvincialDrawerOpen: boolean;
  isTurnSummaryModalOpen: boolean;
  isTurnReviewModalOpen: boolean;
  isRestartModalOpen: boolean;
  isGuideModalOpen: boolean;
  guideStep: number;
  selectedStatForOptions: string | null;
  activeCommandPanel: string | null;
  commandPanelPinned: boolean;
  isStatsSidebarOpen: boolean;
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
    isMinistryDrawerOpen: false,
    isProvincialDrawerOpen: false,
    isTurnSummaryModalOpen: false,
    isTurnReviewModalOpen: false,
    isRestartModalOpen: false,
    isGuideModalOpen: false, // TEMP-SHOT
    guideStep: 0,
    selectedStatForOptions: null,
    activeCommandPanel: 'decrees', // TEMP-SHOT
    commandPanelPinned: true, // TEMP-SHOT
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
    setGuideModal: (open: boolean, step: number = 0) => {
      if (typeof window !== 'undefined' && window.localStorage && !open) {
        window.localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
      }
      update((s) => ({ ...s, isGuideModalOpen: open, guideStep: step }));
    },
    setGuideStep: (step: number) => {
      update((s) => ({ ...s, guideStep: step }));
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

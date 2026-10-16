import { writable } from 'svelte/store';

export interface UIState {
  selectedGovernorateId: string | null;
  isMinistryDrawerOpen: boolean;
  isProvincialDrawerOpen: boolean;
  isRestartModalOpen: boolean;
  /** End-turn flow stage: review -> results (same modal) -> events (alert on
      top, review recedes underneath) -> closed. */
  turnFlowStage: 'closed' | 'review' | 'results' | 'events';
  isSettingsOpen: boolean;
  /** Whether the visitor has started a game session (false on first visit so
      the fullscreen classic menu acts as the opening title screen). */
  hasStartedGame: boolean;
  /** Full-screen About page (project idea, sourced facts, MIT licence, author). */
  isAboutOpen: boolean;
  tourCompleted: boolean;
  checklist: { decrees: boolean; province: boolean; endTurn: boolean };
  selectedStatForOptions: string | null;
  activeCommandPanel: string | null;
  commandPanelPinned: boolean;
  isStatsSidebarOpen: boolean;
  showMigrationArrows: boolean;
  /** CRT tube glass over the map canvas (purely visual; off = raw map). */
  crtTube: boolean;
}

const TOUR_KEY = 'president_guide_tour_v2';
const STARTED_KEY = 'president_has_started_v1';
const GAME_STATE_KEY = 'president_game_state_v1';

function checkTourSeen(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(TOUR_KEY) === 'true';
  }
  return false;
}

function checkGameStarted(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (window.localStorage.getItem(STARTED_KEY) === 'true') return true;
      if (window.localStorage.getItem(TOUR_KEY) === 'true') return true;
      const raw = window.localStorage.getItem(GAME_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.turnNumber === 'number' && parsed.turnNumber > 1) {
          return true;
        }
      }
    } catch {
      return false;
    }
  }
  return false;
}

function isCompactViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 1024;
}

function createUIStore() {
  const initialStarted = checkGameStarted();
  const { subscribe, update } = writable<UIState>({
    selectedGovernorateId: null,
    isMinistryDrawerOpen: false,
    isProvincialDrawerOpen: false,
    isRestartModalOpen: false,
    turnFlowStage: 'closed',
    isSettingsOpen: !initialStarted,
    hasStartedGame: initialStarted,
    isAboutOpen: false,
    tourCompleted: checkTourSeen(),
    checklist: { decrees: false, province: false, endTurn: false },
    selectedStatForOptions: null,
    activeCommandPanel: null,
    commandPanelPinned: false,
    isStatsSidebarOpen: false,
    showMigrationArrows: true,
    crtTube: true,
  });

  return {
    subscribe,
    selectGovernorate: (id: string | null) => {
      update((s) => ({
        ...s,
        selectedGovernorateId: id,
        // Map clicks pin the provincial command panel (drawers retired).
        // On desktop (lg+), the stats sidebar is independent; on compact
        // viewports (<1024px) we auto-close the sidebar so it doesn't cover
        // the provincial panel.
        activeCommandPanel: id ? 'provincial' : s.activeCommandPanel,
        commandPanelPinned: id ? true : s.commandPanelPinned,
        isStatsSidebarOpen: id && isCompactViewport() ? false : s.isStatsSidebarOpen,
      }));
    },
    setTurnFlowStage: (stage: UIState['turnFlowStage']) => {
      update((s) => ({ ...s, turnFlowStage: stage }));
    },
    setRestartModal: (open: boolean) => {
      update((s) => ({ ...s, isRestartModalOpen: open }));
    },
    setSettingsOpen: (open: boolean) => {
      update((s) => ({ ...s, isSettingsOpen: open }));
    },
    markGameStarted: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STARTED_KEY, 'true');
        } catch {
          /* ignore */
        }
      }
      update((s) => ({ ...s, hasStartedGame: true, isSettingsOpen: false }));
    },
    setAboutOpen: (open: boolean) => {
      update((s) => ({ ...s, isAboutOpen: open }));
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
      // On desktop (lg+) bottom panels never touch the independent stats sidebar;
      // on compact screens (<1024px) opening a bottom panel closes the overlay sidebar.
      update((s) => ({
        ...s,
        activeCommandPanel: id,
        commandPanelPinned: pinned,
        isStatsSidebarOpen: id && isCompactViewport() ? false : s.isStatsSidebarOpen,
      }));
    },
    closeCommandPanel: () => {
      // Only the bottom panel; the stats sidebar has its own toggle and
      // survives canvas/governorate map clicks and other hub buttons.
      update((s) => ({ ...s, activeCommandPanel: null, commandPanelPinned: false }));
    },
    toggleStatsSidebar: (open?: boolean) => {
      update((s) => {
        const nextOpen = open ?? !s.isStatsSidebarOpen;
        const closeBottom = nextOpen && isCompactViewport();
        return {
          ...s,
          isStatsSidebarOpen: nextOpen,
          activeCommandPanel: closeBottom ? null : s.activeCommandPanel,
          commandPanelPinned: closeBottom ? false : s.commandPanelPinned,
        };
      });
    },
    setMigrationArrows: (show: boolean) => {
      update((s) => ({ ...s, showMigrationArrows: show }));
    },
    setCrtTube: (on: boolean) => {
      update((s) => ({ ...s, crtTube: on }));
    },
  };
}

export const uiStore = createUIStore();

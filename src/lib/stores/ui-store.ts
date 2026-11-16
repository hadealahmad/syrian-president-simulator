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
  /** Full-screen Achievements & Top Runs records panel. */
  isRecordsOpen: boolean;
  recordsInitialTab: 'achievements' | 'runs';
  tourCompleted: boolean;
  checklist: { decrees: boolean; province: boolean; endTurn: boolean };
  selectedStatForOptions: string | null;
  activeCommandPanel: string | null;
  commandPanelPinned: boolean;
  isStatsSidebarOpen: boolean;
  showMigrationArrows: boolean;
  /** CRT tube glass over the map canvas (purely visual; off = raw map). */
  crtTube: boolean;
  /** Alerts hidden by the player until the next committed turn. */
  dismissedAlertIds: string[];
  /** Phone alarm tray (pill on portrait, bell panel on landscape). */
  isAlertsOpen: boolean;
}

const TOUR_KEY = 'president_guide_tour_v2';
const STARTED_KEY = 'president_has_started_v1';
const GAME_STATE_KEY = 'president_game_state_v1';

function checkTourSeen(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(TOUR_KEY) === 'true';
    }
  } catch {
    // Blocked storage: behave like a first visit instead of failing bootstrap.
  }
  return false;
}

function checkGameStarted(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (window.localStorage.getItem(STARTED_KEY) === 'true') return true;
      if (window.localStorage.getItem(TOUR_KEY) === 'true') return true;
      const raw = window.localStorage.getItem(GAME_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.turnNumber === 'number' && parsed.turnNumber > 1) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
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
    isRecordsOpen: false,
    recordsInitialTab: 'achievements',
    tourCompleted: checkTourSeen(),
    checklist: { decrees: false, province: false, endTurn: false },
    selectedStatForOptions: null,
    activeCommandPanel: null,
    commandPanelPinned: false,
    isStatsSidebarOpen: false,
    showMigrationArrows: true,
    crtTube: false,
    dismissedAlertIds: [],
    isAlertsOpen: false,
  });

  let commandPanelHandler: ((id: string) => string) | null = null;

  return {
    subscribe,
    registerCommandPanelHandler: (fn: (id: string) => string) => {
      commandPanelHandler = fn;
    },
    selectGovernorate: (id: string | null) => {
      update((s) => ({
        ...s,
        selectedGovernorateId: id,
        // Map clicks pin the provincial command panel. The new shell has a
        // single responsive Sheet, so any open panel (including stats) gives
        // way to the provincial dossier.
        activeCommandPanel: id ? 'provincial' : s.activeCommandPanel,
        commandPanelPinned: id ? true : s.commandPanelPinned,
        isStatsSidebarOpen: false,
        isAlertsOpen: false,
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
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STARTED_KEY, 'true');
        }
      } catch {
        /* ignore */
      }
      update((s) => ({ ...s, hasStartedGame: true, isSettingsOpen: false }));
    },
    setAboutOpen: (open: boolean) => {
      update((s) => ({ ...s, isAboutOpen: open }));
    },
    openRecords: (tab: 'achievements' | 'runs' = 'achievements') => {
      update((s) => ({ ...s, isRecordsOpen: true, recordsInitialTab: tab }));
    },
    closeRecords: () => {
      update((s) => ({ ...s, isRecordsOpen: false }));
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
      const resolvedId = id && commandPanelHandler ? commandPanelHandler(id) : id;
      if (resolvedId === 'stats') {
        update((s) => ({
          ...s,
          activeCommandPanel: null,
          commandPanelPinned: false,
          isStatsSidebarOpen: true,
          isAlertsOpen: false,
        }));
        return;
      }
      // Single Sheet shell: opening a section always dismisses the stats view.
      update((s) => ({
        ...s,
        activeCommandPanel: resolvedId,
        commandPanelPinned: pinned,
        isStatsSidebarOpen: false,
        isAlertsOpen: false,
      }));
    },
    closeCommandPanel: () => {
      // Close the command section only. The stats view uses its own toggle;
      // `closeActivePanel()` closes whichever one the Sheet is showing.
      update((s) => ({ ...s, activeCommandPanel: null, commandPanelPinned: false }));
    },
    /** Close whichever section the Sheet is currently showing. */
    closeActivePanel: () => {
      update((s) => ({
        ...s,
        activeCommandPanel: null,
        commandPanelPinned: false,
        isStatsSidebarOpen: false,
      }));
    },
    toggleStatsSidebar: (open?: boolean) => {
      update((s) => {
        const nextOpen = open ?? !s.isStatsSidebarOpen;
        return {
          ...s,
          isStatsSidebarOpen: nextOpen,
          activeCommandPanel: nextOpen ? null : s.activeCommandPanel,
          commandPanelPinned: nextOpen ? false : s.commandPanelPinned,
          isAlertsOpen: false,
        };
      });
    },
    setAlertsOpen: (open: boolean) => {
      update((s) => ({ ...s, isAlertsOpen: open }));
    },
    dismissAlert: (id: string) => {
      update((s) =>
        s.dismissedAlertIds.includes(id)
          ? s
          : { ...s, dismissedAlertIds: [...s.dismissedAlertIds, id] }
      );
    },
    clearDismissedAlerts: () => {
      update((s) => (s.dismissedAlertIds.length ? { ...s, dismissedAlertIds: [] } : s));
    },
    setMigrationArrows: (show: boolean) => {
      update((s) => ({ ...s, showMigrationArrows: show }));
    },
    setCrtTube: (on: boolean) => {
      update((s) => ({ ...s, crtTube: on }));
    },
    /**
     * Reset every per-game UI selection after a new game starts. Keeps the
     * session-level preferences (theme/CRT, tour and "started" flags) intact.
     * Must run together with gameStore.restart() and draftStore.reset() — the
     * single shared new-game path in stores/new-game.ts.
     */
    resetGameUi: () => {
      update((s) => ({
        ...s,
        selectedGovernorateId: null,
        isMinistryDrawerOpen: false,
        isProvincialDrawerOpen: false,
        isRestartModalOpen: false,
        turnFlowStage: 'closed',
        isAboutOpen: false,
        isRecordsOpen: false,
        checklist: { decrees: false, province: false, endTurn: false },
        selectedStatForOptions: null,
        activeCommandPanel: null,
        commandPanelPinned: false,
        isStatsSidebarOpen: false,
        dismissedAlertIds: [],
        isAlertsOpen: false,
      }));
    },
  };
}

export const uiStore = createUIStore();

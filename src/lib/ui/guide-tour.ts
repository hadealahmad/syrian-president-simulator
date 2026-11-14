import { writable, get } from 'svelte/store';
import { uiStore } from '../stores/ui-store';
import { openSection } from './shell/section-nav';
import { TOUR_STEPS } from './tour-steps';

const TOUR_KEY = 'president_guide_tour_v2';

export interface TourChecklist {
  openedDecrees: boolean;
  openedProvince: boolean;
  endedFirstTurn: boolean;
}

const active = writable<boolean>(false);
const index = writable<number>(0);
const direction = writable<1 | -1>(1);

export const tourStore = { subscribeActive: active.subscribe, subscribeIndex: index.subscribe, active, index };
export { active as tourActive, index as tourIndex, direction as tourDirection };

function applyStepSideEffects(next: number, prev: number): void {
  const p = TOUR_STEPS[prev];
  const n = TOUR_STEPS[next];

  if (n?.open) {
    openSection(n.open.section, n.open.subTab);
  } else if (p?.open) {
    uiStore.closeActivePanel();
  }
}

export function hasSeenTour(): boolean {
  try {
    return window.localStorage?.getItem(TOUR_KEY) === 'true';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.localStorage?.setItem(TOUR_KEY, 'true');
  } catch {
    /* ignore */
  }
  uiStore.completeTour();
}

function setTourRootFlag(on: boolean): void {
  if (typeof document === 'undefined') return;
  if (on) {
    document.documentElement.dataset.tourActive = 'true';
  } else {
    delete document.documentElement.dataset.tourActive;
  }
}

export function startGuideTour(): void {
  uiStore.closeActivePanel();
  // The tour owns the screen: close curtains and alert tray underneath.
  uiStore.setSettingsOpen(false);
  uiStore.setAlertsOpen(false);
  direction.set(1);
  index.set(0);
  setTourRootFlag(true);
  active.set(true);
}

export function stopGuideTour(): void {
  // Defensive stop from settings/menus should only record seen when active.
  if (!get(active)) return;
  const i = get(index);
  if (TOUR_STEPS[i]?.open) {
    uiStore.closeActivePanel();
  }
  setTourRootFlag(false);
  active.set(false);
  markSeen();
}

export function tourNext(): void {
  const i = get(index);
  if (i >= TOUR_STEPS.length - 1) {
    stopGuideTour();
    return;
  }
  direction.set(1);
  applyStepSideEffects(i + 1, i);
  index.set(i + 1);
}

export function tourPrev(): void {
  const i = get(index);
  if (i <= 0) return;
  direction.set(-1);
  applyStepSideEffects(i - 1, i);
  index.set(i - 1);
}

/** Called by GuideTour when a step's selector has no visible target in the
 *  current layout, skipping cleanly in the active navigation direction. */
export function tourSkipMissingStep(stepIndex: number): void {
  if (!get(active) || get(index) !== stepIndex) return;
  const dir = get(direction);
  const next = stepIndex + dir;
  if (dir > 0) {
    if (next >= TOUR_STEPS.length) {
      stopGuideTour();
      return;
    }
    applyStepSideEffects(next, stepIndex);
    index.set(next);
  } else {
    if (next < 0) {
      direction.set(1);
      if (stepIndex + 1 < TOUR_STEPS.length) {
        applyStepSideEffects(stepIndex + 1, stepIndex);
        index.set(stepIndex + 1);
      } else {
        stopGuideTour();
      }
      return;
    }
    applyStepSideEffects(next, stepIndex);
    index.set(next);
  }
}

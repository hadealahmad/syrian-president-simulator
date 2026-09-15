import { writable, get } from 'svelte/store';
import { uiStore } from '../stores/ui-store';
import { TOUR_STEPS } from './tour-steps';

const TOUR_KEY = 'president_guide_tour_v2';

export interface TourChecklist {
  openedDecrees: boolean;
  openedProvince: boolean;
  endedFirstTurn: boolean;
}

const active = writable<boolean>(false);
const index = writable<number>(0);

export const tourStore = { subscribeActive: active.subscribe, subscribeIndex: index.subscribe, active, index };
export { active as tourActive, index as tourIndex };

function applyStepSideEffects(next: number, prev: number): void {
  const p = TOUR_STEPS[prev];
  const n = TOUR_STEPS[next];
  if (p?.id === 'stats') uiStore.toggleStatsSidebar(false);
  if (n?.id === 'stats') {
    uiStore.closeCommandPanel();
    uiStore.toggleStatsSidebar(true);
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

export function startGuideTour(): void {
  uiStore.closeCommandPanel();
  uiStore.toggleStatsSidebar(false);
  index.set(0);
  active.set(true);
}

export function stopGuideTour(): void {
  const i = get(index);
  if (TOUR_STEPS[i]?.id === 'stats') uiStore.toggleStatsSidebar(false);
  active.set(false);
  markSeen();
}

export function tourNext(): void {
  const i = get(index);
  if (i >= TOUR_STEPS.length - 1) {
    stopGuideTour();
    return;
  }
  applyStepSideEffects(i + 1, i);
  index.set(i + 1);
}

export function tourPrev(): void {
  const i = get(index);
  if (i <= 0) return;
  applyStepSideEffects(i - 1, i);
  index.set(i - 1);
}

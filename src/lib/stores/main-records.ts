import type { GameState } from '../engine/types';
import { createRecordsStore } from '../records';
import {
  MAIN_ACHIEVEMENTS,
  advanceRunMetaOnTransition,
  buildMainRunRecord,
  createInitialRunMeta,
  ensureRunMeta,
  evaluateMainAchievements,
  toMainRunStats,
} from '../records/main-achievements';

export const LIFE_TURNS_COUNTER_KEY = 'lifetimeTurns';

export const mainRecords = createRecordsStore('main');

export { MAIN_ACHIEVEMENTS };

/**
 * Attach fresh runMeta to a newly started playthrough.
 */
export function attachFreshMainRunMeta(state: GameState, now = Date.now()): GameState {
  state.runMeta = createInitialRunMeta(state, now);
  return state;
}

/**
 * Ensure a loaded save has `runMeta` (legacy saves receive first-load timestamp
 * as `startedAt`), without re-recording already ended saves.
 * Returns true if `state.runMeta` was newly created or updated.
 */
export function hydrateLoadedMainRunMeta(state: GameState, now = Date.now()): boolean {
  if (state.runMeta && state.runMeta.runId && Number.isFinite(state.runMeta.startedAt)) {
    return false;
  }
  const meta = ensureRunMeta(state, now);
  if (state.isGameOver) {
    // Legacy save that had already ended prior to run tracking: mark recorded so
    // reloading an old finished screen never fabricates duplicate runs.
    meta.recorded = true;
  }
  state.runMeta = meta;
  return true;
}

/**
 * Mutates `nextState.runMeta` in place during a turn commit or crisis resolution,
 * updates lifetime turns, unlocks any earned achievements, and records the run
 * once if the game has ended.
 */
export function applyMainRecordsTransition(
  prevState: GameState,
  nextState: GameState,
  turnCommitted: boolean,
  now = Date.now()
): void {
  const meta = advanceRunMetaOnTransition(prevState, nextState, turnCommitted, now);
  nextState.runMeta = meta;

  const lifetimeTurns = turnCommitted
    ? mainRecords.incrementCounter(LIFE_TURNS_COUNTER_KEY, 1)
    : mainRecords.getCounter(LIFE_TURNS_COUNTER_KEY);

  const stats = toMainRunStats(meta, lifetimeTurns, nextState);
  const earned = evaluateMainAchievements(prevState, nextState, stats);
  for (const achId of earned) {
    mainRecords.unlock(achId, meta.runId);
  }

  if (nextState.isGameOver && !meta.recorded) {
    const rec = buildMainRunRecord(nextState, now);
    if (rec) {
      mainRecords.addRun(rec);
      meta.recorded = true;
    }
  }
}

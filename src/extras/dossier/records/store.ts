import { createRecordsStore, type RecordsStore } from '../../../lib/records';
import type { DossierCard, DossierState } from '../engine/types';
import { DOSSIER_ACHIEVEMENTS } from './defs';
import {
  advanceDossierRunMeta,
  buildDossierRunRecord,
  createInitialDossierRunMeta,
  didCompleteDossierTurn,
  ensureDossierRunMeta,
  evaluateDossierAchievements,
  toDossierRunStats,
} from './evaluate';

export const DOSSIER_TURNS_COUNTER_KEY = 'turns';

export const dossierRecords: RecordsStore = createRecordsStore('dossier');

export { DOSSIER_ACHIEVEMENTS };

/**
 * Attach fresh `runMeta` to a newly created Dossier term.
 */
export function attachFreshDossierRunMeta(
  state: DossierState,
  now = Date.now()
): DossierState {
  state.runMeta = createInitialDossierRunMeta(state, now);
  return state;
}

/**
 * Ensure a loaded Dossier save has `runMeta` (legacy saves receive first-load
 * timestamp as `startedAt`). If the save had already ended, mark `recorded = true`
 * so reloading an ended save never records a duplicate run.
 * Returns true if `state.runMeta` was newly created or updated.
 */
export function hydrateLoadedDossierRunMeta(
  state: DossierState,
  deck?: readonly DossierCard[],
  now = Date.now()
): boolean {
  if (state.runMeta && state.runMeta.runId && Number.isFinite(state.runMeta.startedAt)) {
    return false;
  }
  const meta = ensureDossierRunMeta(state, now, deck);
  if (state.isGameOver) {
    meta.recorded = true;
  }
  state.runMeta = meta;
  return true;
}

/**
 * Mutates `nextState.runMeta` in place after an answer, increments the lifetime
 * `turns` counter on every completed turn, unlocks any earned achievements, and
 * records the finished run once when `nextState.isGameOver` becomes true.
 */
export function applyDossierRecordsTransition(
  prevState: DossierState,
  nextState: DossierState,
  answeredCard: DossierCard | null,
  store: RecordsStore = dossierRecords,
  now = Date.now()
): void {
  const meta = advanceDossierRunMeta(prevState, nextState, answeredCard, now);
  nextState.runMeta = meta;

  const turnCompleted = didCompleteDossierTurn(prevState, nextState);
  const lifetimeTurns = turnCompleted
    ? store.incrementCounter(DOSSIER_TURNS_COUNTER_KEY, 1)
    : store.getCounter(DOSSIER_TURNS_COUNTER_KEY);

  const stats = toDossierRunStats(meta, lifetimeTurns, nextState);
  const earned = evaluateDossierAchievements(prevState, nextState, stats);
  for (const achId of earned) {
    store.unlock(achId, meta.runId);
  }

  if (nextState.isGameOver && !meta.recorded) {
    const rec = buildDossierRunRecord(nextState, now);
    if (rec) {
      store.addRun(rec);
      meta.recorded = true;
    }
  }
}

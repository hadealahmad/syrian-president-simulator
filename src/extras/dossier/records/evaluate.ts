import type { RunRecord } from '../../../lib/records';
import { ENDINGS } from '../content/endings';
import { MAX_TURNS, STARTING_POSTPONES } from '../engine/engine';
import {
  METER_IDS,
  type DossierCard,
  type DossierRunMeta,
  type DossierState,
  type EndingId,
} from '../engine/types';
import { DOSSIER_ACHIEVEMENTS } from './defs';

export { DOSSIER_ACHIEVEMENTS };

const ENDING_ACH_MAP: Record<EndingId, string> = {
  collapse_paralysis: 'end_collapse_paralysis',
  collapse_treasury: 'end_collapse_treasury',
  collapse_trust: 'end_collapse_trust',
  collapse_security: 'end_collapse_security',
  collapse_sovereignty: 'end_collapse_sovereignty',
  term_phoenix: 'end_term_phoenix',
  term_mortgaged: 'end_term_mortgaged',
  term_garrison: 'end_term_garrison',
  term_desert: 'end_term_desert',
  term_hollow: 'end_term_hollow',
};

export interface DossierRunStats {
  minMeterEver: number;
  overreachAnswered: number;
  everHadDecree: boolean;
  lifetimeTurns: number;
}

export function lowestMeter(meters: DossierState['meters']): number {
  return Math.min(meters.treasury, meters.trust, meters.security, meters.sovereignty);
}

export function highestMeter(meters: DossierState['meters']): number {
  return Math.max(meters.treasury, meters.trust, meters.security, meters.sovereignty);
}

export function createInitialDossierRunMeta(
  state: DossierState,
  startedAt = Date.now()
): DossierRunMeta {
  let minEver = lowestMeter(state.meters);
  for (const snap of state.history) {
    minEver = Math.min(minEver, snap.treasury, snap.trust, snap.security, snap.sovereignty);
  }
  return {
    runId: `dossier-${state.rng.seed}-${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt,
    minMeterEver: minEver,
    overreachAnswered: 0,
    everHadDecree: state.decrees.length > 0,
    recorded: false,
  };
}

export function ensureDossierRunMeta(
  state: DossierState,
  fallbackStartedAt = Date.now(),
  deck?: readonly DossierCard[]
): DossierRunMeta {
  if (state.runMeta && state.runMeta.runId && Number.isFinite(state.runMeta.startedAt)) {
    return { ...state.runMeta };
  }
  const initial = createInitialDossierRunMeta(state, fallbackStartedAt);
  if (deck && state.drawnIds.length > 0) {
    const overreachIds = new Set(
      deck.filter((c) => c.kind === 'overreach').map((c) => c.id)
    );
    let count = 0;
    for (const id of state.drawnIds) {
      if (id !== state.currentCardId && overreachIds.has(id)) {
        count += 1;
      }
    }
    initial.overreachAnswered = count;
  }
  return initial;
}

/**
 * Purely advances `runMeta` after an answered card (`answeredCard`) and state transition.
 */
export function advanceDossierRunMeta(
  prevState: DossierState | null,
  nextState: DossierState,
  answeredCard: DossierCard | null,
  now = Date.now()
): DossierRunMeta {
  const base = ensureDossierRunMeta(prevState ?? nextState, now);
  let minMeterEver = Math.min(base.minMeterEver, lowestMeter(nextState.meters));
  for (const snap of nextState.history) {
    minMeterEver = Math.min(
      minMeterEver,
      snap.treasury,
      snap.trust,
      snap.security,
      snap.sovereignty
    );
  }
  const overreachAnswered =
    base.overreachAnswered + (answeredCard?.kind === 'overreach' ? 1 : 0);
  const everHadDecree =
    Boolean(base.everHadDecree) ||
    (prevState ? prevState.decrees.length > 0 : false) ||
    nextState.decrees.length > 0;

  return {
    ...base,
    minMeterEver,
    overreachAnswered,
    everHadDecree,
  };
}

export function toDossierRunStats(
  meta: DossierRunMeta,
  lifetimeTurns: number,
  currentState: DossierState
): DossierRunStats {
  return {
    minMeterEver: Math.min(meta.minMeterEver, lowestMeter(currentState.meters)),
    overreachAnswered: meta.overreachAnswered,
    everHadDecree: Boolean(meta.everHadDecree) || currentState.decrees.length > 0,
    lifetimeTurns,
  };
}

/**
 * Did this answer complete a full turn (2nd file resolved without collapse)?
 * - On turns 1..39: `prevState.fileInTurn === 2 && !nextState.isGameOver && nextState.turn > prevState.turn`
 * - On turn 40: `prevState.fileInTurn === 2 && nextState.isGameOver && endDef.kind === 'term'`
 */
export function didCompleteDossierTurn(
  prevState: DossierState,
  nextState: DossierState
): boolean {
  if (prevState.fileInTurn !== 2) return false;
  if (!nextState.isGameOver) {
    return nextState.turn > prevState.turn;
  }
  const endDef = nextState.endingId ? ENDINGS[nextState.endingId] : null;
  return endDef?.kind === 'term';
}

/**
 * Pure achievement evaluator called after every answer/turn and at the end of a term.
 * Returns all achievement IDs whose condition is satisfied on `nextState`.
 */
export function evaluateDossierAchievements(
  _prevState: DossierState | null,
  nextState: DossierState,
  runStats: DossierRunStats
): string[] {
  const out: string[] = [];
  const endDef = nextState.endingId ? ENDINGS[nextState.endingId] : null;
  const isComplete = Boolean(nextState.isGameOver && endDef?.kind === 'term');
  const isCollapse = Boolean(nextState.isGameOver && endDef?.kind === 'collapse');

  // 1. Endings
  if (nextState.isGameOver && nextState.endingId) {
    const achId = ENDING_ACH_MAP[nextState.endingId];
    if (achId) out.push(achId);
  }

  // 2. Single-term & lifetime turns
  const aliveOrCompletedTurn = isComplete
    ? MAX_TURNS
    : !isCollapse
      ? nextState.turn
      : 0;
  if (aliveOrCompletedTurn >= 10) out.push('turns_run_10');
  if (aliveOrCompletedTurn >= 20) out.push('turns_run_20');
  if (aliveOrCompletedTurn >= 30) out.push('turns_run_30');
  if (isComplete) out.push('turns_run_40');

  if (runStats.lifetimeTurns >= 100) out.push('turns_life_100');
  if (runStats.lifetimeTurns >= 250) out.push('turns_life_250');
  if (runStats.lifetimeTurns >= 500) out.push('turns_life_500');

  // 3. Special achievements
  const minNow = lowestMeter(nextState.meters);
  const maxNow = highestMeter(nextState.meters);

  if (minNow >= 80) {
    out.push('spec_all_80');
  }
  if (maxNow >= 100) {
    out.push('spec_any_100');
  }
  if (isComplete && nextState.postponesLeft >= STARTING_POSTPONES) {
    out.push('spec_no_postpone');
  }
  if (isComplete && runStats.minMeterEver >= 25) {
    out.push('spec_never_below_25');
  }
  if (!isCollapse && nextState.decrees.length >= 4) {
    out.push('spec_decrees_4');
  }
  if (isComplete && maxNow - minNow <= 10) {
    out.push('spec_balanced_10');
  }
  if (isComplete && runStats.overreachAnswered >= 3) {
    out.push('spec_overreach_3');
  }
  if (isComplete && nextState.endingId === 'term_phoenix' && minNow >= 75) {
    out.push('spec_phoenix_75');
  }
  if (isComplete && !runStats.everHadDecree && nextState.decrees.length === 0) {
    out.push('spec_clean_desk');
  }
  if (isComplete && runStats.minMeterEver <= 10) {
    out.push('spec_cliffhanger_10');
  }
  if (!isCollapse && nextState.decrees.length >= 7) {
    out.push('spec_decrees_7');
  }

  return out;
}

/**
 * Score formula:
 * - complete = 1000 + round(average of the four final meters * 10)
 * - collapse = turns * 20
 */
export function computeDossierRunScore(state: DossierState): number {
  const endDef = state.endingId ? ENDINGS[state.endingId] : null;
  if (endDef?.kind === 'term') {
    const sum = METER_IDS.reduce((acc, k) => acc + state.meters[k], 0);
    const avg = sum / METER_IDS.length;
    return 1000 + Math.round(avg * 10);
  }
  const turns = Math.min(Math.max(1, state.turn), MAX_TURNS);
  return turns * 20;
}

export function buildDossierRunRecord(
  state: DossierState,
  endedAt = Date.now()
): RunRecord | null {
  if (!state.isGameOver || !state.endingId) return null;
  const endDef = ENDINGS[state.endingId];
  if (!endDef) return null;

  const meta = ensureDossierRunMeta(state, endedAt);
  const isComplete = endDef.kind === 'term';
  const turns = isComplete ? MAX_TURNS : Math.min(Math.max(1, state.turn), MAX_TURNS);

  return {
    id: meta.runId,
    startedAt: meta.startedAt,
    endedAt: Math.max(meta.startedAt, endedAt),
    turns,
    maxTurns: MAX_TURNS,
    resultId: endDef.id,
    resultTitle: endDef.title,
    outcome: isComplete ? 'complete' : 'collapse',
    score: computeDossierRunScore(state),
    details: {
      treasury: Math.round(state.meters.treasury),
      trust: Math.round(state.meters.trust),
      security: Math.round(state.meters.security),
      sovereignty: Math.round(state.meters.sovereignty),
    },
  };
}

import { newSeed, pickWeighted, type RngState } from '../../shared/rng';
import { STANDING_DECREES } from '../content/decrees';
import { ENDINGS } from '../content/endings';
import {
  METER_IDS,
  type Condition,
  type DossierCard,
  type DossierState,
  type EndingDef,
  type MeterId,
  type SeasonId,
} from './types';

export const SAVE_KEY = 'extras-dossier-v1';
export const INITIAL_YEAR = 2027;
export const MAX_TURNS = 40;
export const STARTING_METER = 50;
export const STARTING_POSTPONES = 3;

export function clampMeter(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function getYearAndSeason(turn: number): { year: number; season: SeasonId } {
  const year = INITIAL_YEAR + Math.floor((turn - 1) / 2);
  const season: SeasonId = turn % 2 === 1 ? 'H1_HARVEST' : 'H2_WINTER';
  return { year, season };
}

export function getSeasonLabel(season: SeasonId): string {
  return season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء';
}

export function evaluateCondition(cond: Condition | undefined, state: DossierState): boolean {
  if (!cond) return true;
  if (cond.minTurn !== undefined && state.turn < cond.minTurn) return false;
  if (cond.maxTurn !== undefined && state.turn > cond.maxTurn) return false;
  if (cond.season !== undefined && state.season !== cond.season) return false;
  if (cond.requireFlags) {
    for (const f of cond.requireFlags) {
      if (!state.flags[f]) return false;
    }
  }
  if (cond.forbidFlags) {
    for (const f of cond.forbidFlags) {
      if (state.flags[f]) return false;
    }
  }
  if (cond.requireDecrees) {
    for (const d of cond.requireDecrees) {
      if (!state.decrees.includes(d)) return false;
    }
  }
  if (cond.forbidDecrees) {
    for (const d of cond.forbidDecrees) {
      if (state.decrees.includes(d)) return false;
    }
  }
  if (cond.minMeter) {
    for (const k of METER_IDS) {
      const req = cond.minMeter[k];
      if (req !== undefined && state.meters[k] < req) return false;
    }
  }
  if (cond.maxMeter) {
    for (const k of METER_IDS) {
      const lim = cond.maxMeter[k];
      if (lim !== undefined && state.meters[k] > lim) return false;
    }
  }
  if (cond.anyMeterAtLeast !== undefined) {
    const thr = cond.anyMeterAtLeast;
    if (!METER_IDS.some((k) => state.meters[k] >= thr)) return false;
  }
  return true;
}

export function drawNextCardId(state: DossierState, deck: readonly DossierCard[]): string | null {
  if (deck.length === 0) return null;
  const byId = new Map<string, DossierCard>();
  for (const c of deck) byId.set(c.id, c);

  // 1. Check due follow-up files first
  for (let i = 0; i < state.followUps.length; i++) {
    const item = state.followUps[i];
    if (item.dueAtFile <= state.filesResolved) {
      state.followUps.splice(i, 1);
      i--;
      const fCard = byId.get(item.id);
      if (
        fCard &&
        !state.drawnIds.includes(fCard.id) &&
        fCard.id !== state.postponedId &&
        evaluateCondition(fCard.when, state)
      ) {
        state.drawnIds.push(fCard.id);
        state.postponedId = null;
        state.lastTag = fCard.tags[0] ?? null;
        return fCard.id;
      }
    }
  }

  const hasOverreach = METER_IDS.some((k) => state.meters[k] >= 90);

  const isEligibleNonFollowup = (c: DossierCard, allowDrawn: boolean): boolean => {
    if (c.kind === 'followup') return false;
    if (c.kind === 'overreach' && !hasOverreach) return false;
    if (!allowDrawn && state.drawnIds.includes(c.id)) return false;
    if (!evaluateCondition(c.when, state)) return false;
    return true;
  };

  let pool = deck.filter((c) => c.id !== state.postponedId && isEligibleNonFollowup(c, false));

  // If all non-followup eligible cards have been seen, recycle non-followup drawn IDs
  if (pool.length === 0) {
    const followupIds = new Set(deck.filter((c) => c.kind === 'followup').map((c) => c.id));
    state.drawnIds = state.drawnIds.filter((id) => followupIds.has(id));
    pool = deck.filter((c) => c.id !== state.postponedId && isEligibleNonFollowup(c, false));
  }

  if (pool.length === 0) {
    pool = deck.filter((c) => isEligibleNonFollowup(c, true));
  }
  if (pool.length === 0) {
    pool = deck.slice();
  }

  // Prefer category rotation: avoid repeating the same primary tag back-to-back
  let activePool = pool;
  if (state.lastTag) {
    const rotated = pool.filter((c) => (c.tags[0] ?? '') !== state.lastTag);
    if (rotated.length > 0) activePool = rotated;
  }

  const chosen = pickWeighted(state.rng, activePool, (c) => {
    const base = c.weight > 0 ? c.weight : 10;
    return hasOverreach && c.kind === 'overreach' ? base * 6 : base;
  });

  if (!state.drawnIds.includes(chosen.id)) {
    state.drawnIds.push(chosen.id);
  }
  state.postponedId = null;
  state.lastTag = chosen.tags[0] ?? null;
  return chosen.id;
}

export function createGame(deck: readonly DossierCard[], seed?: number): DossierState {
  const rng: RngState = { seed: seed !== undefined ? seed | 0 : newSeed() };
  const { year, season } = getYearAndSeason(1);
  const state: DossierState = {
    version: 1,
    rng,
    turn: 1,
    maxTurns: MAX_TURNS,
    fileInTurn: 1,
    filesResolved: 0,
    year,
    season,
    meters: {
      treasury: STARTING_METER,
      trust: STARTING_METER,
      security: STARTING_METER,
      sovereignty: STARTING_METER,
    },
    postponesLeft: STARTING_POSTPONES,
    decrees: [],
    flags: {},
    followUps: [],
    drawnIds: [],
    postponedId: null,
    lastTag: null,
    lastOutcome: null,
    history: [
      {
        turn: 0,
        year,
        treasury: STARTING_METER,
        trust: STARTING_METER,
        security: STARTING_METER,
        sovereignty: STARTING_METER,
      },
    ],
    currentCardId: null,
    isGameOver: false,
    endingId: null,
  };
  state.currentCardId = drawNextCardId(state, deck);
  return state;
}

export function getCurrentCard(
  state: DossierState,
  deck: readonly DossierCard[],
): DossierCard | null {
  if (!state.currentCardId) return null;
  return deck.find((c) => c.id === state.currentCardId) ?? null;
}

export function checkCollapse(meters: Record<MeterId, number>): EndingDef | null {
  const zeros = METER_IDS.filter((k) => meters[k] <= 0);
  if (zeros.length >= 2) return ENDINGS.collapse_paralysis;
  if (meters.treasury <= 0) return ENDINGS.collapse_treasury;
  if (meters.trust <= 0) return ENDINGS.collapse_trust;
  if (meters.security <= 0) return ENDINGS.collapse_security;
  if (meters.sovereignty <= 0) return ENDINGS.collapse_sovereignty;
  return null;
}

export function computeTermEnding(meters: Record<MeterId, number>): EndingDef {
  const vals = METER_IDS.map((k) => meters[k]);
  const lowest = Math.min(...vals);
  const average = (vals[0] + vals[1] + vals[2] + vals[3]) / 4;

  if (lowest >= 55 && average >= 68) return ENDINGS.term_phoenix;
  if (meters.sovereignty < 35) return ENDINGS.term_mortgaged;
  if (meters.security >= 65 && meters.trust < 45) return ENDINGS.term_garrison;
  if (meters.treasury < 35) return ENDINGS.term_desert;
  return ENDINGS.term_hollow;
}

export function applyDecreeDrift(state: DossierState): Record<MeterId, number> {
  const drift: Record<MeterId, number> = {
    treasury: 0,
    trust: 0,
    security: 0,
    sovereignty: 0,
  };
  for (const id of state.decrees) {
    const dec = STANDING_DECREES[id];
    if (!dec) continue;
    for (const k of METER_IDS) {
      drift[k] += dec.drift[k] ?? 0;
    }
  }
  for (const k of METER_IDS) {
    if (drift[k] !== 0) {
      state.meters[k] = clampMeter(state.meters[k] + drift[k]);
    }
  }
  return drift;
}

export function chooseAnswer(
  state: DossierState,
  side: 'right' | 'left',
  deck: readonly DossierCard[],
): DossierState {
  if (state.isGameOver || !state.currentCardId) return state;
  const card = getCurrentCard(state, deck);
  if (!card) return state;

  const before: Record<MeterId, number> = { ...state.meters };
  const answer = card[side];

  for (const k of METER_IDS) {
    const delta = answer.effects[k] ?? 0;
    if (delta !== 0) {
      state.meters[k] = clampMeter(state.meters[k] + delta);
    }
  }

  if (answer.setFlags) {
    for (const f of answer.setFlags) state.flags[f] = true;
  }
  if (answer.endDecree) {
    state.decrees = state.decrees.filter((d) => d !== answer.endDecree);
  }
  if (answer.decree && STANDING_DECREES[answer.decree] && !state.decrees.includes(answer.decree)) {
    state.decrees.push(answer.decree);
  }

  state.filesResolved += 1;

  if (answer.followUp) {
    state.followUps.push({
      id: answer.followUp.id,
      dueAtFile: state.filesResolved + Math.max(1, answer.followUp.delay),
    });
  }

  const computeDeltas = (): Record<MeterId, number> => ({
    treasury: state.meters.treasury - before.treasury,
    trust: state.meters.trust - before.trust,
    security: state.meters.security - before.security,
    sovereignty: state.meters.sovereignty - before.sovereignty,
  });

  // 1. Check immediate collapse after the answer
  const immediateCollapse = checkCollapse(state.meters);
  if (immediateCollapse) {
    state.lastOutcome = {
      cardId: card.id,
      side,
      headline: answer.result,
      deltas: computeDeltas(),
    };
    state.history.push({
      turn: state.turn,
      year: state.year,
      ...state.meters,
    });
    state.isGameOver = true;
    state.endingId = immediateCollapse.id;
    state.currentCardId = null;
    return state;
  }

  // 2. First file of turn -> move to second file
  if (state.fileInTurn === 1) {
    state.fileInTurn = 2;
    state.lastOutcome = {
      cardId: card.id,
      side,
      headline: answer.result,
      deltas: computeDeltas(),
    };
    state.currentCardId = drawNextCardId(state, deck);
    return state;
  }

  // 3. End of turn (after second file): apply standing decrees drift & record history
  applyDecreeDrift(state);
  state.lastOutcome = {
    cardId: card.id,
    side,
    headline: answer.result,
    deltas: computeDeltas(),
  };
  state.history.push({
    turn: state.turn,
    year: state.year,
    ...state.meters,
  });

  const driftCollapse = checkCollapse(state.meters);
  if (driftCollapse) {
    state.isGameOver = true;
    state.endingId = driftCollapse.id;
    state.currentCardId = null;
    return state;
  }

  if (state.turn >= state.maxTurns) {
    const termEnding = computeTermEnding(state.meters);
    state.isGameOver = true;
    state.endingId = termEnding.id;
    state.currentCardId = null;
    return state;
  }

  state.turn += 1;
  state.fileInTurn = 1;
  const nextYS = getYearAndSeason(state.turn);
  state.year = nextYS.year;
  state.season = nextYS.season;
  state.currentCardId = drawNextCardId(state, deck);
  return state;
}

export function postponeCard(state: DossierState, deck: readonly DossierCard[]): boolean {
  if (state.isGameOver || !state.currentCardId || state.postponesLeft <= 0) return false;
  state.postponesLeft -= 1;
  state.postponedId = state.currentCardId;
  if (state.lastOutcome) {
    state.lastOutcome = {
      ...state.lastOutcome,
      deltas: { treasury: 0, trust: 0, security: 0, sovereignty: 0 },
    };
  }
  state.currentCardId = drawNextCardId(state, deck);
  return true;
}

export function getHintMagnitudes(
  card: DossierCard | null,
  side: 'right' | 'left' | null,
): Record<MeterId, 0 | 1 | 2 | 3> {
  const out: Record<MeterId, 0 | 1 | 2 | 3> = {
    treasury: 0,
    trust: 0,
    security: 0,
    sovereignty: 0,
  };
  if (!card || !side) return out;
  const eff = card[side].effects;
  for (const k of METER_IDS) {
    const abs = Math.abs(eff[k] ?? 0);
    if (abs === 0) out[k] = 0;
    else if (abs <= 5) out[k] = 1;
    else if (abs <= 10) out[k] = 2;
    else out[k] = 3;
  }
  return out;
}

/** Bot helper: picks the answer that best protects the lowest meter. */
export function pickCarefulSide(state: DossierState, card: DossierCard): 'right' | 'left' {
  let lowestKey: MeterId = METER_IDS[0];
  let lowestVal = state.meters[lowestKey];
  for (const k of METER_IDS) {
    if (state.meters[k] < lowestVal) {
      lowestVal = state.meters[k];
      lowestKey = k;
    }
  }

  const rPost = METER_IDS.map((k) => state.meters[k] + (card.right.effects[k] ?? 0));
  const lPost = METER_IDS.map((k) => state.meters[k] + (card.left.effects[k] ?? 0));
  const rMin = Math.min(...rPost);
  const lMin = Math.min(...lPost);

  // Never pick an option that immediately drops a meter to <= 0 if the other survives
  if (rMin <= 0 && lMin > 0) return 'left';
  if (lMin <= 0 && rMin > 0) return 'right';

  // Maximize the post-move lowest meter; break ties by current lowest meter delta, then total sum
  if (rMin !== lMin) {
    return rMin > lMin ? 'right' : 'left';
  }
  const rDelta = card.right.effects[lowestKey] ?? 0;
  const lDelta = card.left.effects[lowestKey] ?? 0;
  if (rDelta !== lDelta) {
    return rDelta > lDelta ? 'right' : 'left';
  }
  const rSum = rPost[0] + rPost[1] + rPost[2] + rPost[3];
  const lSum = lPost[0] + lPost[1] + lPost[2] + lPost[3];
  return rSum >= lSum ? 'right' : 'left';
}

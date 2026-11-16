import { shuffle } from '../../shared/rng';
import { chooseWaveLanes } from './ai';
import {
  allocUid,
  getCrisisEffectivePower,
  getEffectiveCardCost,
  getUnitEffectivePower,
  hasExpertise,
  isBossAlive,
  makeBossInstance,
  makeCrisisInstance,
  makeUnitInstance,
  previewRound,
  resolveRoundCore,
} from './battle-resolve';
import { CATEGORIES, createDeckCard, getCardDef, getCrisisDef } from './content';
import type {
  BattleEvent,
  BattleState,
  DeckCard,
  EncounterSpec,
  ForecastSlotView,
  LaneIndex,
  PlayerAction,
  QueueSlotView,
} from './types';

export {
  getCrisisEffectivePower,
  getEffectiveCardCost,
  getUnitEffectivePower,
  hasExpertise,
  previewRound,
};

const LANES: LaneIndex[] = [0, 1, 2, 3];

export interface CreateBattleOptions {
  deck: DeckCard[];
  encounter: EncounterSpec;
  seed: number;
}

function makeVolunteerToken(state: BattleState): DeckCard {
  return createDeckCard('volunteers', allocUid(state, 'tok'), true);
}

function drawFromDeck(state: BattleState): DeckCard | null {
  if (state.drawPile.length === 0 && state.discardPile.length > 0) {
    state.drawPile = shuffle(state.rng, state.discardPile);
    state.discardPile = [];
  }
  return state.drawPile.shift() ?? null;
}

function refreshDarkLanes(state: BattleState): void {
  const dark = new Set<LaneIndex>();
  if (state.modifier === 'fog') dark.add(3);
  if (isBossAlive(state, 'blackout')) {
    const picked = shuffle(state.rng, LANES).slice(0, 2);
    for (const l of picked) dark.add(l);
  }
  state.darkLanes = [...dark].sort((a, b) => a - b);
}

function prepareNextForecast(state: BattleState): void {
  const nextWave = state.remainingWaves.shift() ?? [];
  state.plannedWave = chooseWaveLanes(state.rng, state, nextWave);
}

function startRound(state: BattleState, events: BattleEvent[]): void {
  for (const lane of LANES) {
    const u = state.playerLine[lane];
    if (u) {
      u.tempPower = 0;
      u.movedThisRound = false;
      u.shieldUsedThisRound = false;
    }
    const c = state.crisisLine[lane];
    if (c) c.hardenUsedThisRound = false;
  }

  refreshDarkLanes(state);

  if (state.round >= 16) {
    events.push({ t: 'stalemate', round: state.round });
    let anyCrisis = false;
    for (const lane of LANES) {
      const c = state.crisisLine[lane];
      if (c) {
        c.power += 1;
        anyCrisis = true;
      }
      if (state.queue[lane]) anyCrisis = true;
    }
    if (!anyCrisis) {
      const fallbackId = state.act === 1 ? 'outage' : 'unrest';
      state.crisisLine[0] = makeCrisisInstance(state, fallbackId);
    }
  }

  const baseIncome = state.modifier === 'tight-budget' && state.round <= 2 ? 1 : 2;
  const traitIncome = state.playerLine.reduce(
    (sum, u) => sum + (u && u.traits.includes('income') ? 1 : 0),
    0,
  );
  const debtPenalty = state.hand.reduce(
    (sum, c) => sum + (c.defId === 'old-debt' ? 1 : 0),
    0,
  );
  const gained = Math.max(0, baseIncome + traitIncome - debtPenalty);
  state.budget = Math.min(9, state.budget + gained);
  events.push({ t: 'income', amount: gained, budget: state.budget });

  // Supply offer: 2 deck cards (or 1 with 'shortage') + 1 volunteer token
  const deckSlots = state.modifier === 'shortage' ? 1 : 2;
  if (state.drawPile.length === 0 && state.discardPile.length > 0) {
    state.drawPile = shuffle(state.rng, state.discardPile);
    state.discardPile = [];
  }
  const options: DeckCard[] = [];
  const takeCount = Math.min(deckSlots, state.drawPile.length);
  for (let i = 0; i < takeCount; i++) {
    const c = state.drawPile.shift();
    if (c) options.push(c);
  }
  options.push(makeVolunteerToken(state));
  state.supplyOptions = options;
  state.phase = 'supply';
  events.push({ t: 'supply', options: options.map((o) => ({ ...o })) });
}

export function createBattle(opts: CreateBattleOptions): BattleState {
  const rng = { seed: opts.seed | 0 };
  const copiedDeck = opts.deck.map((c) => ({ ...c }));
  const shuffled = shuffle(rng, copiedDeck);

  const state: BattleState = {
    rng,
    round: 1,
    phase: 'supply',
    balance: opts.encounter.modifier === 'popular-support' ? 1 : 0,
    budget: 0,
    playerLine: [null, null, null, null],
    crisisLine: [null, null, null, null],
    queue: [null, null, null, null],
    plannedWave: [null, null, null, null],
    remainingWaves: opts.encounter.waves.map((w) => [...w]),
    drawPile: shuffled,
    hand: [],
    discardPile: [],
    supplyOptions: [],
    darkLanes: [],
    forecastRevealed: false,
    bossPhase2Rounds: 0,
    kind: opts.encounter.kind,
    act: opts.encounter.act,
    nextUid: 1,
    overflow: 0,
  };
  if (opts.encounter.modifier) state.modifier = opts.encounter.modifier;
  if (opts.encounter.bossId) {
    state.bossId = opts.encounter.bossId;
    state.bossPhase = 1;
  }

  if (opts.encounter.bossId) {
    state.crisisLine[1] = makeBossInstance(state, opts.encounter.bossId);
  }
  for (const f of opts.encounter.openingFront) {
    if (!state.crisisLine[f.lane]) {
      state.crisisLine[f.lane] = makeCrisisInstance(state, f.defId);
    }
  }
  for (const q of opts.encounter.openingQueue) {
    if (!state.queue[q.lane] && !(q.lane === 1 && state.crisisLine[1]?.isBoss)) {
      state.queue[q.lane] = makeCrisisInstance(state, q.defId);
    }
  }

  for (let i = 0; i < 3; i++) {
    const drawn = state.drawPile.shift();
    if (drawn) state.hand.push(drawn);
  }
  state.hand.push(makeVolunteerToken(state));

  prepareNextForecast(state);
  startRound(state, []);
  return state;
}

export function getLegalActions(state: BattleState): PlayerAction[] {
  if (state.phase === 'ended') return [];
  if (state.phase === 'supply') {
    return state.supplyOptions.map((_, index) => ({ type: 'chooseSupply', index }));
  }

  const actions: PlayerAction[] = [];
  for (const card of state.hand) {
    const def = getCardDef(card.defId);
    if (!def.playable) continue;
    const cost = getEffectiveCardCost(state, card);
    if (cost > state.budget) continue;

    if (def.kind === 'unit') {
      for (const lane of LANES) {
        if (state.playerLine[lane] === null) {
          actions.push({ type: 'playUnit', handUid: card.uid, lane });
        }
      }
    } else {
      const target = def.target ?? 'none';
      if (target === 'none') {
        actions.push({ type: 'playAction', handUid: card.uid });
      } else if (target === 'ally') {
        for (const lane of LANES) {
          if (state.playerLine[lane] !== null) {
            actions.push({ type: 'playAction', handUid: card.uid, lane });
          }
        }
      } else if (target === 'damaged-ally') {
        for (const lane of LANES) {
          const u = state.playerLine[lane];
          if (u && u.health < u.maxHealth) {
            actions.push({ type: 'playAction', handUid: card.uid, lane });
          }
        }
      } else if (target === 'redeploy') {
        for (const fromLane of LANES) {
          if (state.playerLine[fromLane] === null) continue;
          for (const toLane of LANES) {
            if (toLane !== fromLane) {
              actions.push({ type: 'playAction', handUid: card.uid, lane: fromLane, toLane });
            }
          }
        }
      } else if (target === 'queue') {
        for (const lane of LANES) {
          if (state.queue[lane] !== null) {
            actions.push({ type: 'playAction', handUid: card.uid, lane });
          }
        }
      } else if (target === 'delay-crisis') {
        for (const lane of LANES) {
          const c = state.crisisLine[lane];
          if (c && !c.isBoss && state.queue[lane] === null) {
            actions.push({ type: 'playAction', handUid: card.uid, lane });
          }
        }
      }
    }
  }

  for (const lane of LANES) {
    const u = state.playerLine[lane];
    if (!u) continue;
    if (u.traits.includes('mobile') && !u.movedThisRound) {
      for (const adj of [lane - 1, lane + 1]) {
        if (adj >= 0 && adj <= 3 && state.playerLine[adj] === null) {
          actions.push({ type: 'moveUnit', fromLane: lane, toLane: adj as LaneIndex });
        }
      }
    }
    actions.push({ type: 'withdrawUnit', lane });
  }

  actions.push({ type: 'endRound' });
  return actions;
}

function isSameAction(a: PlayerAction, b: PlayerAction): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'chooseSupply':
      return b.type === 'chooseSupply' && a.index === b.index;
    case 'playUnit':
      return b.type === 'playUnit' && a.handUid === b.handUid && a.lane === b.lane;
    case 'playAction':
      return b.type === 'playAction' && a.handUid === b.handUid && a.lane === b.lane && a.toLane === b.toLane;
    case 'moveUnit':
      return b.type === 'moveUnit' && a.fromLane === b.fromLane && a.toLane === b.toLane;
    case 'withdrawUnit':
      return b.type === 'withdrawUnit' && a.lane === b.lane;
    case 'endRound':
      return true;
  }
}

export function applyAction(
  inputState: BattleState,
  action: PlayerAction,
): { state: BattleState; events: BattleEvent[] } {
  const legal = getLegalActions(inputState);
  if (!legal.some((l) => isSameAction(l, action))) {
    throw new Error(`Illegal battle action: ${JSON.stringify(action)}`);
  }
  if (action.type === 'endRound') {
    return endRound(inputState);
  }

  const state = structuredClone(inputState);
  const events: BattleEvent[] = [];

  if (action.type === 'chooseSupply') {
    const picked = state.supplyOptions[action.index];
    for (let i = 0; i < state.supplyOptions.length; i++) {
      const opt = state.supplyOptions[i];
      if (i === action.index) {
        if (state.hand.length < 14) {
          state.hand.push(opt);
        } else if (!opt.isToken) {
          state.discardPile.push(opt);
        }
      } else if (!opt.isToken && opt.defId !== 'volunteers') {
        state.discardPile.push(opt);
      }
    }
    state.supplyOptions = [];
    state.phase = 'play';
    events.push({ t: 'supplyPicked', card: { ...picked } });
    return { state, events };
  }

  if (action.type === 'playUnit') {
    const idx = state.hand.findIndex((c) => c.uid === action.handUid);
    const [card] = state.hand.splice(idx, 1);
    const cost = getEffectiveCardCost(state, card);
    state.budget -= cost;
    state.playerLine[action.lane] = makeUnitInstance(state, card);
    events.push({ t: 'cardPlayed', card: { ...card }, lane: action.lane, cost });
    return { state, events };
  }

  if (action.type === 'playAction') {
    const idx = state.hand.findIndex((c) => c.uid === action.handUid);
    const [card] = state.hand.splice(idx, 1);
    const cost = getEffectiveCardCost(state, card);
    state.budget -= cost;
    events.push({ t: 'cardPlayed', card: { ...card }, lane: action.lane, toLane: action.toLane, cost });

    switch (card.defId) {
      case 'boost': {
        const u = state.playerLine[action.lane!]!;
        u.tempPower += 2;
        break;
      }
      case 'evacuate': {
        const u = state.playerLine[action.lane!]!;
        state.playerLine[action.lane!] = null;
        if (state.hand.length < 14) state.hand.push({ ...u.sourceCard });
        events.push({ t: 'unitWithdrawn', lane: action.lane!, uid: u.uid });
        break;
      }
      case 'repair': {
        const u = state.playerLine[action.lane!]!;
        const amt = u.maxHealth - u.health;
        u.health = u.maxHealth;
        events.push({ t: 'heal', side: 'player', lane: action.lane!, amount: amt, hp: u.health });
        break;
      }
      case 'redeploy': {
        const from = action.lane!;
        const to = action.toLane!;
        const temp = state.playerLine[to];
        state.playerLine[to] = state.playerLine[from];
        state.playerLine[from] = temp;
        events.push({ t: 'unitMoved', fromLane: from, toLane: to, swapped: temp !== null });
        break;
      }
      case 'early-warning': {
        state.forecastRevealed = true;
        const drawn = drawFromDeck(state);
        if (drawn && state.hand.length < 14) state.hand.push(drawn);
        break;
      }
      case 'emergency-funds': {
        state.budget = Math.min(9, state.budget + 2);
        events.push({ t: 'income', amount: 2, budget: state.budget });
        break;
      }
      case 'ban': {
        const q = state.queue[action.lane!]!;
        state.queue[action.lane!] = null;
        events.push({ t: 'destroyed', side: 'crisis', lane: 'queue', cardId: q.defId, uid: q.uid });
        break;
      }
      case 'delay': {
        const c = state.crisisLine[action.lane!]!;
        state.crisisLine[action.lane!] = null;
        state.queue[action.lane!] = c;
        events.push({ t: 'delayed', lane: action.lane!, cardId: c.defId, uid: c.uid });
        break;
      }
      case 'mobilize': {
        for (let i = 0; i < 2; i++) {
          if (state.hand.length < 14) state.hand.push(makeVolunteerToken(state));
        }
        break;
      }
      case 'red-tape':
      default:
        break;
    }
    if (!card.isToken) state.discardPile.push(card);
    return { state, events };
  }

  if (action.type === 'moveUnit') {
    const u = state.playerLine[action.fromLane]!;
    u.movedThisRound = true;
    state.playerLine[action.toLane] = u;
    state.playerLine[action.fromLane] = null;
    events.push({ t: 'unitMoved', fromLane: action.fromLane, toLane: action.toLane });
    return { state, events };
  }

  if (action.type === 'withdrawUnit') {
    const u = state.playerLine[action.lane]!;
    state.playerLine[action.lane] = null;
    if (!u.sourceCard.isToken && u.defId !== 'volunteers') {
      state.discardPile.push({ ...u.sourceCard });
    }
    events.push({ t: 'unitWithdrawn', lane: action.lane, uid: u.uid });
    return { state, events };
  }

  return { state, events };
}

export function endRound(inputState: BattleState): { state: BattleState; events: BattleEvent[] } {
  if (inputState.phase !== 'play') {
    throw new Error(`Cannot endRound while in phase '${inputState.phase}'`);
  }
  const state = structuredClone(inputState);
  const events: BattleEvent[] = [];
  resolveRoundCore(state, events);

  if (state.phase !== 'ended') {
    state.round += 1;
    events.push({ t: 'phase', phase: 'newRound' });
    prepareNextForecast(state);
    startRound(state, events);
  }
  return { state, events };
}

export function isForecastRevealed(state: BattleState): boolean {
  return state.forecastRevealed || state.playerLine.some((u) => u !== null && u.traits.includes('warn'));
}

export function getQueueView(state: BattleState): [QueueSlotView, QueueSlotView, QueueSlotView, QueueSlotView] {
  return LANES.map((lane): QueueSlotView => {
    const laneDark = state.darkLanes.includes(lane);
    const c = state.queue[lane];
    if (!c) return { status: 'empty', laneDark };
    if (laneDark) return { status: 'hidden', laneDark: true };
    return { status: 'visible', laneDark: false, crisis: c };
  }) as [QueueSlotView, QueueSlotView, QueueSlotView, QueueSlotView];
}

export function getForecastView(state: BattleState): [ForecastSlotView, ForecastSlotView, ForecastSlotView, ForecastSlotView] {
  const revealed = isForecastRevealed(state);
  return LANES.map((lane): ForecastSlotView => {
    const defId = state.plannedWave[lane];
    if (!defId) return { status: 'empty' };
    if (state.darkLanes.includes(lane) && !revealed) return { status: 'hidden' };
    const def = getCrisisDef(defId);
    if (revealed) {
      return {
        status: 'revealed',
        defId: def.id,
        name: def.name,
        glyph: def.glyph,
        category: def.category,
        power: def.power,
        health: def.health,
        traits: [...def.traits],
      };
    }
    return {
      status: 'silhouette',
      category: def.category,
      glyph: CATEGORIES[def.category].glyph,
    };
  }) as [ForecastSlotView, ForecastSlotView, ForecastSlotView, ForecastSlotView];
}

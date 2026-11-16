import { BOSSES, CATEGORIES, getCardDef, getCrisisDef, getDeckCardStats } from './content';
import { findFallbackQueueLane } from './ai';
import type {
  BattleEvent,
  BattleState,
  BossId,
  CrisisInstance,
  DeckCard,
  LaneIndex,
  RoundPreview,
  SlotPreview,
  UnitGlyphKey,
  UnitInstance,
} from './types';

const LANES: LaneIndex[] = [0, 1, 2, 3];

export function allocUid(state: BattleState, prefix: string): string {
  const id = `${prefix}-${state.nextUid}`;
  state.nextUid += 1;
  return id;
}

export function makeUnitInstance(state: BattleState, card: DeckCard): UnitInstance {
  const { def, power, health, traits } = getDeckCardStats(card);
  return {
    uid: allocUid(state, 'u'),
    defId: def.id,
    name: def.name,
    glyph: def.glyph as UnitGlyphKey,
    category: def.category,
    power,
    tempPower: 0,
    health,
    maxHealth: health,
    traits,
    shieldUsedThisRound: false,
    movedThisRound: false,
    promoted: false,
    sourceCard: { ...card },
  };
}

export function makeCrisisInstance(state: BattleState, defId: string): CrisisInstance {
  const def = getCrisisDef(defId);
  return {
    uid: allocUid(state, 'c'),
    defId: def.id,
    name: def.name,
    glyph: def.glyph,
    category: def.category,
    power: def.power,
    health: def.health,
    maxHealth: def.health,
    traits: [...def.traits],
    hardenUsedThisRound: false,
  };
}

export function makeBossInstance(state: BattleState, bossId: BossId): CrisisInstance {
  const def = BOSSES[bossId];
  return {
    uid: allocUid(state, 'boss'),
    defId: def.id,
    name: def.name,
    glyph: def.glyph,
    category: def.category,
    power: def.phase1.power,
    health: def.phase1.health,
    maxHealth: def.phase1.health,
    traits: [],
    hardenUsedThisRound: false,
    isBoss: true,
    bossPhase: 1,
  };
}

export function isBossAlive(state: BattleState, bossId?: BossId): boolean {
  return state.crisisLine.some((c) => c !== null && c.isBoss && (!bossId || c.defId === bossId));
}

export function getEffectiveCardCost(state: BattleState, card: DeckCard): number {
  const def = getCardDef(card.defId);
  const profiteerTax = isBossAlive(state, 'profiteer') && !card.isToken && def.cost >= 2 ? 1 : 0;
  return def.cost + profiteerTax;
}

export function getUnitEffectivePower(state: BattleState, lane: LaneIndex): number {
  const unit = state.playerLine[lane];
  if (!unit) return 0;
  let p = unit.power + unit.tempPower;
  for (const adj of [lane - 1, lane + 1]) {
    if (adj >= 0 && adj <= 3) {
      const ally = state.playerLine[adj];
      if (ally && ally.traits.includes('inspire')) p += 1;
    }
  }
  if (unit.traits.includes('solidarity')) {
    for (let i = 0; i < 4; i++) {
      if (i !== lane && state.playerLine[i]?.category === unit.category) p += 1;
    }
  }
  if (isBossAlive(state, 'blackout') && state.darkLanes.includes(lane)) {
    p -= 1;
  }
  return Math.max(0, p);
}

export function getCrisisEffectivePower(state: BattleState, lane: LaneIndex): number {
  const crisis = state.crisisLine[lane];
  if (!crisis) return 0;
  let p = crisis.power;
  for (const adj of [lane - 1, lane + 1]) {
    if (adj >= 0 && adj <= 3) {
      const neighbour = state.crisisLine[adj];
      if (neighbour && neighbour.traits.includes('rally')) p += 1;
    }
  }
  return Math.max(0, p);
}

export function hasExpertise(unit: UnitInstance, crisis: CrisisInstance): boolean {
  return unit.category !== 'society' && unit.category === crisis.category && Boolean(CATEGORIES[unit.category]);
}

function sendDestroyedUnitCard(state: BattleState, unit: UnitInstance): boolean {
  if (unit.sourceCard.isToken || unit.defId === 'volunteers') return false;
  if (unit.traits.includes('return') && state.hand.length < 12) {
    state.hand.push({ ...unit.sourceCard });
    return true;
  }
  state.discardPile.push({ ...unit.sourceCard });
  return false;
}

function pushGauge(
  state: BattleState,
  delta: number,
  events: BattleEvent[],
  onBossPhase2: () => void,
): boolean {
  if (delta === 0) return false;
  const from = state.balance;
  const raw = from + delta;

  if (raw >= 5) {
    if (state.bossId && state.bossPhase === 1 && isBossAlive(state)) {
      events.push({ t: 'gauge', from, to: 0, delta: -from });
      state.balance = 0;
      onBossPhase2();
      return false;
    }
    const overflow = raw - 5;
    state.balance = 5;
    state.phase = 'ended';
    state.result = 'win';
    state.overflow = overflow;
    events.push({ t: 'gauge', from, to: 5, delta: 5 - from });
    events.push({ t: 'battleEnd', result: 'win', overflow });
    return true;
  }

  if (raw <= -5) {
    state.balance = -5;
    state.phase = 'ended';
    state.result = 'loss';
    state.overflow = 0;
    events.push({ t: 'gauge', from, to: -5, delta: -5 - from });
    events.push({ t: 'battleEnd', result: 'loss', overflow: 0 });
    return true;
  }

  state.balance = raw;
  events.push({ t: 'gauge', from, to: raw, delta });
  return false;
}

function transitionBossToPhase2(state: BattleState, events: BattleEvent[]): void {
  if (!state.bossId) return;
  const def = BOSSES[state.bossId];
  state.bossPhase = 2;
  state.bossPhase2Rounds = 0;
  for (const lane of LANES) {
    const c = state.crisisLine[lane];
    if (c && c.isBoss) {
      c.bossPhase = 2;
      c.power = def.phase2.power;
      c.health = def.phase2.health;
      c.maxHealth = def.phase2.health;
      c.hardenUsedThisRound = false;
    } else if (c) {
      state.crisisLine[lane] = null;
      events.push({ t: 'destroyed', side: 'crisis', lane, cardId: c.defId, uid: c.uid });
    }
    const q = state.queue[lane];
    if (q) {
      state.queue[lane] = null;
      events.push({ t: 'destroyed', side: 'crisis', lane: 'queue', cardId: q.defId, uid: q.uid });
    }
  }
  events.push({ t: 'bossPhase', bossId: state.bossId, phase: 2 });
}

export function resolveRoundCore(state: BattleState, events: BattleEvent[]): RoundPreview {
  const startPlayerUids = state.playerLine.map((u) => u?.uid ?? null);
  const startCrisisUids = state.crisisLine.map((c) => c?.uid ?? null);
  const playerSlots: [SlotPreview, SlotPreview, SlotPreview, SlotPreview] = [0, 1, 2, 3].map((i) => {
    const l = i as LaneIndex;
    const u = state.playerLine[l];
    const c = state.crisisLine[l];
    return {
      damageTaken: 0,
      destroyed: false,
      effectivePower: getUnitEffectivePower(state, l),
      expertiseActive: Boolean(u && c && hasExpertise(u, c)),
    };
  }) as [SlotPreview, SlotPreview, SlotPreview, SlotPreview];

  const crisisSlots: [SlotPreview, SlotPreview, SlotPreview, SlotPreview] = [0, 1, 2, 3].map((i) => ({
    damageTaken: 0,
    destroyed: false,
    effectivePower: getCrisisEffectivePower(state, i as LaneIndex),
    expertiseActive: false,
  })) as [SlotPreview, SlotPreview, SlotPreview, SlotPreview];

  const lanePlayerGaugeHits: [number, number, number, number] = [0, 0, 0, 0];
  const laneCrisisGaugeHits: [number, number, number, number] = [0, 0, 0, 0];
  let triggeredBossPhase2 = false;
  const onBoss2 = () => {
    triggeredBossPhase2 = true;
    transitionBossToPhase2(state, events);
  };

  if (state.phase === 'ended') {
    return {
      projectedBalance: state.balance,
      playerSlots,
      crisisSlots,
      lanePlayerGaugeHits,
      laneCrisisGaugeHits,
      wouldEnd: true,
      wouldResult: state.result,
      wouldTriggerBossPhase2: false,
    };
  }

  // 1. Player attacks (lane 0 -> 3)
  events.push({ t: 'phase', phase: 'playerAttacks' });
  for (const lane of LANES) {
    const unit = state.playerLine[lane];
    if (!unit) continue;
    const basePower = getUnitEffectivePower(state, lane);
    if (basePower <= 0) continue;

    const targets: LaneIndex[] = unit.traits.includes('split')
      ? ([lane - 1, lane + 1].filter((x) => x >= 0 && x <= 3) as LaneIndex[])
      : [lane];

    for (const tLane of targets) {
      const crisis = state.crisisLine[tLane];
      if (!crisis) {
        events.push({ t: 'attack', side: 'player', lane, targetLane: tLane, target: 'gauge', dmg: basePower });
        lanePlayerGaugeHits[tLane] += basePower;
        if (pushGauge(state, basePower, events, onBoss2)) return finishPreview();
      } else {
        const exp = hasExpertise(unit, crisis);
        const dmg = basePower + (exp ? 1 : 0);
        events.push({ t: 'attack', side: 'player', lane, targetLane: tLane, target: 'unit', dmg, expertise: exp });
        if (crisis.traits.includes('harden') && !crisis.hardenUsedThisRound) {
          crisis.hardenUsedThisRound = true;
          events.push({ t: 'trait', side: 'crisis', lane: tLane, trait: 'harden' });
        } else {
          const dealt = unit.traits.includes('decisive') && !crisis.isBoss ? Math.max(dmg, crisis.health) : dmg;
          if (unit.traits.includes('decisive') && !crisis.isBoss) {
            events.push({ t: 'trait', side: 'player', lane, trait: 'decisive' });
          }
          crisis.health = Math.max(0, crisis.health - dealt);
          if (startCrisisUids[tLane] === crisis.uid) crisisSlots[tLane].damageTaken += dealt;
          events.push({ t: 'damage', side: 'crisis', lane: tLane, dmg: dealt, hp: crisis.health });
          if (crisis.health <= 0) {
            const wasBoss = Boolean(crisis.isBoss);
            if (startCrisisUids[tLane] === crisis.uid) crisisSlots[tLane].destroyed = true;
            state.crisisLine[tLane] = null;
            events.push({ t: 'destroyed', side: 'crisis', lane: tLane, cardId: crisis.defId, uid: crisis.uid });
            if (wasBoss) {
              state.phase = 'ended';
              state.result = 'win';
              state.overflow = 0;
              events.push({ t: 'battleEnd', result: 'win', overflow: 0 });
              return finishPreview();
            }
          }
        }
      }
    }
  }

  // 2. Crisis attacks (lane 0 -> 3)
  events.push({ t: 'phase', phase: 'crisisAttacks' });
  for (const lane of LANES) {
    const crisis = state.crisisLine[lane];
    if (!crisis) continue;
    const dmg = getCrisisEffectivePower(state, lane);
    if (dmg <= 0) continue;

    const unit = state.playerLine[lane];
    const bypassesUnit = crisis.traits.includes('sneak') && (!unit || !unit.traits.includes('watch'));
    if (!unit || bypassesUnit) {
      if (bypassesUnit && unit) events.push({ t: 'trait', side: 'crisis', lane, trait: 'sneak' });
      events.push({ t: 'attack', side: 'crisis', lane, targetLane: lane, target: 'gauge', dmg });
      laneCrisisGaugeHits[lane] += dmg;
      if (pushGauge(state, -dmg, events, onBoss2)) return finishPreview();
    } else {
      if (crisis.traits.includes('sneak') && unit.traits.includes('watch')) {
        events.push({ t: 'trait', side: 'player', lane, trait: 'watch' });
      }
      events.push({ t: 'attack', side: 'crisis', lane, targetLane: lane, target: 'unit', dmg });
      let actualDmg = dmg;
      if (unit.traits.includes('shield') && !unit.shieldUsedThisRound) {
        unit.shieldUsedThisRound = true;
        actualDmg = 0;
        events.push({ t: 'trait', side: 'player', lane, trait: 'shield' });
      }
      if (actualDmg > 0) {
        unit.health = Math.max(0, unit.health - actualDmg);
        if (startPlayerUids[lane] === unit.uid) playerSlots[lane].damageTaken += actualDmg;
        events.push({ t: 'damage', side: 'player', lane, dmg: actualDmg, hp: unit.health });
        if (crisis.traits.includes('erode') && unit.power > 0) {
          unit.power = Math.max(0, unit.power - 1);
          events.push({ t: 'trait', side: 'crisis', lane, trait: 'erode' });
        }
      }
      if (unit.traits.includes('thorns')) {
        events.push({ t: 'trait', side: 'player', lane, trait: 'thorns' });
        if (crisis.traits.includes('harden') && !crisis.hardenUsedThisRound) {
          crisis.hardenUsedThisRound = true;
          events.push({ t: 'trait', side: 'crisis', lane, trait: 'harden' });
        } else {
          crisis.health = Math.max(0, crisis.health - 1);
          if (startCrisisUids[lane] === crisis.uid) crisisSlots[lane].damageTaken += 1;
          events.push({ t: 'damage', side: 'crisis', lane, dmg: 1, hp: crisis.health });
        }
      }
      if (unit.health <= 0) {
        if (startPlayerUids[lane] === unit.uid) playerSlots[lane].destroyed = true;
        state.playerLine[lane] = null;
        const returned = sendDestroyedUnitCard(state, unit);
        events.push({ t: 'destroyed', side: 'player', lane, cardId: unit.defId, uid: unit.uid, returnedToHand: returned });
      }
      if (crisis.health <= 0) {
        const wasBoss = Boolean(crisis.isBoss);
        if (startCrisisUids[lane] === crisis.uid) crisisSlots[lane].destroyed = true;
        state.crisisLine[lane] = null;
        events.push({ t: 'destroyed', side: 'crisis', lane, cardId: crisis.defId, uid: crisis.uid });
        if (wasBoss) {
          state.phase = 'ended';
          state.result = 'win';
          state.overflow = 0;
          events.push({ t: 'battleEnd', result: 'win', overflow: 0 });
          return finishPreview();
        }
      }
    }
  }

  // Promote trigger after surviving crisis attacks
  for (const lane of LANES) {
    const unit = state.playerLine[lane];
    if (unit && unit.traits.includes('promote') && !unit.promoted) {
      unit.promoted = true;
      unit.power += 1;
      unit.health += 1;
      unit.maxHealth += 1;
      events.push({ t: 'trait', side: 'player', lane, trait: 'promote' });
    }
  }

  // 3. Advance
  events.push({ t: 'phase', phase: 'advance' });
  for (const lane of LANES) {
    const q = state.queue[lane];
    if (q && state.crisisLine[lane] === null) {
      state.crisisLine[lane] = q;
      state.queue[lane] = null;
      events.push({ t: 'advance', lane, cardId: q.defId, uid: q.uid });
    }
  }

  // 4. Plan (place plannedWave into empty queue slots)
  events.push({ t: 'phase', phase: 'plan' });
  for (const lane of LANES) {
    const defId = state.plannedWave[lane];
    if (!defId) continue;
    const bossBlocks = lane === 1 && isBossAlive(state);
    const targetLane = !bossBlocks && state.queue[lane] === null ? lane : findFallbackQueueLane(state);
    if (targetLane !== null) {
      const inst = makeCrisisInstance(state, defId);
      state.queue[targetLane] = inst;
      events.push({ t: 'queue', lane: targetLane, cardId: defId, uid: inst.uid, hidden: state.darkLanes.includes(targetLane) });
    }
  }
  state.plannedWave = [null, null, null, null];

  // 5. End-of-round triggers
  events.push({ t: 'phase', phase: 'endOfRound' });
  for (const lane of LANES) {
    const unit = state.playerLine[lane];
    if (unit && unit.traits.includes('aid')) {
      for (const adj of [lane - 1, lane + 1]) {
        if (adj >= 0 && adj <= 3) {
          const ally = state.playerLine[adj];
          if (ally && ally.health < ally.maxHealth) {
            ally.health = Math.min(ally.maxHealth, ally.health + 1);
            events.push({ t: 'trait', side: 'player', lane, trait: 'aid' });
            events.push({ t: 'heal', side: 'player', lane: adj as LaneIndex, amount: 1, hp: ally.health });
          }
        }
      }
    }
  }

  const smuggled = new Set<string>();
  for (const lane of LANES) {
    const crisis = state.crisisLine[lane];
    if (!crisis) continue;
    if (crisis.traits.includes('grow') && crisis.power < 6) {
      crisis.power = Math.min(6, crisis.power + 1);
      events.push({ t: 'trait', side: 'crisis', lane, trait: 'grow' });
    }
    if (
      crisis.traits.includes('spread') &&
      (crisis.lastSpreadRound === undefined || state.round - crisis.lastSpreadRound >= 2)
    ) {
      for (const adj of [lane - 1, lane + 1]) {
        if (adj >= 0 && adj <= 3 && !(adj === 1 && isBossAlive(state)) && state.queue[adj] === null) {
          const spot = makeCrisisInstance(state, 'hotspot');
          state.queue[adj] = spot;
          crisis.lastSpreadRound = state.round;
          events.push({ t: 'trait', side: 'crisis', lane, trait: 'spread' });
          events.push({ t: 'queue', lane: adj as LaneIndex, cardId: 'hotspot', uid: spot.uid, hidden: state.darkLanes.includes(adj as LaneIndex) });
          break;
        }
      }
    }
    if (crisis.traits.includes('smuggle') && !smuggled.has(crisis.uid)) {
      for (const adj of [lane - 1, lane + 1]) {
        if (adj >= 0 && adj <= 3 && state.crisisLine[adj] === null) {
          state.crisisLine[adj] = crisis;
          state.crisisLine[lane] = null;
          smuggled.add(crisis.uid);
          events.push({ t: 'trait', side: 'crisis', lane, trait: 'smuggle' });
          break;
        }
      }
    }
  }

  // Boss end-of-round rules
  if (isBossAlive(state)) {
    if (state.bossId === 'blackout' && state.bossPhase === 2) {
      state.bossPhase2Rounds += 1;
      if (state.bossPhase2Rounds % 2 === 0) {
        for (const lane of LANES) {
          if (lane !== 1 && state.queue[lane] === null) {
            const f = makeCrisisInstance(state, 'fault');
            state.queue[lane] = f;
            events.push({ t: 'queue', lane, cardId: 'fault', uid: f.uid, hidden: state.darkLanes.includes(lane) });
          }
        }
      }
    } else if (state.bossId === 'profiteer' && state.bossPhase === 2) {
      state.bossPhase2Rounds += 1;
      state.budget = Math.max(0, state.budget - 1);
      if (state.bossPhase2Rounds % 2 === 1) {
        const qLane = findFallbackQueueLane(state);
        if (qLane !== null) {
          const bm = makeCrisisInstance(state, 'black-market');
          state.queue[qLane] = bm;
          events.push({ t: 'queue', lane: qLane, cardId: 'black-market', uid: bm.uid, hidden: state.darkLanes.includes(qLane) });
        }
      }
    } else if (state.bossId === 'spiral') {
      for (const lane of LANES) {
        const c = state.crisisLine[lane];
        if (c && !c.isBoss && c.power < 6) {
          c.power = Math.min(6, c.power + 1);
        }
      }
      if (state.bossPhase === 2) {
        const moneyCount = state.playerLine.filter((u) => u?.category === 'money').length;
        if (moneyCount < 2) {
          if (pushGauge(state, -1, events, onBoss2)) return finishPreview();
        }
      }
    }
  }

  // Hard 30-round stalemate guard so no battle ever exceeds 30 rounds
  if (state.round >= 25) {
    const penalty = state.round >= 30 ? -10 : state.round >= 28 ? -2 : -1;
    if (pushGauge(state, penalty, events, onBoss2)) return finishPreview();
  }

  return finishPreview();

  function finishPreview(): RoundPreview {
    return {
      projectedBalance: state.balance,
      playerSlots,
      crisisSlots,
      lanePlayerGaugeHits,
      laneCrisisGaugeHits,
      wouldEnd: state.phase === 'ended',
      wouldResult: state.result,
      wouldTriggerBossPhase2: triggeredBossPhase2,
    };
  }
}

export function previewRound(state: BattleState): RoundPreview {
  const sim = structuredClone(state);
  const scratchEvents: BattleEvent[] = [];
  return resolveRoundCore(sim, scratchEvents);
}

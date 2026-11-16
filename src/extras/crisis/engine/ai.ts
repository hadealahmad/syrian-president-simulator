import { nextFloat, nextInt, pick, shuffle, type RngState } from '../../shared/rng';
import { ACTS, ALL_CRISES } from './content';
import type {
  ActNumber,
  BattleState,
  CrisisDef,
  EncounterSpec,
  LaneIndex,
  ModifierId,
} from './types';

const ALL_LANES: LaneIndex[] = [0, 1, 2, 3];

export function getCrisisPoolForAct(act: ActNumber, includeElite = false): CrisisDef[] {
  return ALL_CRISES.filter(
    (c) => !c.isToken && c.acts.includes(act) && (includeElite ? Boolean(c.isElite) : !c.isElite),
  );
}

function pickWaveFromBudget(
  rng: RngState,
  pool: CrisisDef[],
  budget: number,
  maxCount: number,
): string[] {
  const wave: string[] = [];
  let remaining = budget;
  for (let i = 0; i < maxCount; i++) {
    const affordable = pool.filter((c) => c.threat <= remaining);
    if (affordable.length === 0) break;
    const chosen = pick(rng, affordable);
    wave.push(chosen.id);
    remaining -= chosen.threat;
    if (remaining <= 0) break;
  }
  if (wave.length === 0 && pool.length > 0) {
    const cheapest = [...pool].sort((a, b) => a.threat - b.threat)[0];
    wave.push(cheapest.id);
  }
  return wave;
}

export function generateEncounter(
  rng: RngState,
  act: ActNumber,
  kind: 'battle' | 'elite' | 'boss',
  modifier?: ModifierId,
): EncounterSpec {
  const pool = getCrisisPoolForAct(act, false);
  const openerPool = pool.filter((c) => c.power <= 1 && c.threat <= 3);
  const safeOpener = openerPool.length > 0 ? openerPool : pool;

  if (kind === 'boss') {
    const bossId = ACTS[act].bossId;
    const nonBossLanes: LaneIndex[] = shuffle(rng, [0, 2, 3]);
    const openingFront: Array<{ lane: LaneIndex; defId: string }> = [];
    const openingQueue = [{ lane: nonBossLanes[0], defId: pick(rng, safeOpener).id }];
    const waveCount = 7;
    const baseThreat = bossId === 'profiteer' ? 2.8 : act === 1 ? 3.1 : 3.45;
    const waves: string[][] = [];
    for (let w = 0; w < waveCount; w++) {
      if (bossId === 'profiteer' && w % 3 === 2) {
        waves.push([]);
        continue;
      }
      const threat = Math.round(baseThreat + w * 0.45);
      const maxCards = bossId === 'profiteer' ? 1 : nextFloat(rng) < 0.52 ? 2 : 1;
      waves.push(pickWaveFromBudget(rng, pool, threat, maxCards));
    }
    const spec: EncounterSpec = {
      act,
      kind: 'boss',
      bossId,
      openingFront,
      openingQueue,
      waves,
    };
    if (modifier) spec.modifier = modifier;
    return spec;
  }

  const isElite = kind === 'elite';
  const waveCount = 6 + nextInt(rng, 2); // 6..7 rounds of waves
  const mult = isElite ? 1.28 : 1.0;
  const baseActThreat = act === 1 ? 2.6 : act === 2 ? 3.4 : 4.55;

  const lanes = shuffle(rng, ALL_LANES);
  const openingFront: Array<{ lane: LaneIndex; defId: string }> = [
    { lane: lanes[0], defId: pick(rng, safeOpener).id },
  ];

  const openingQueue: Array<{ lane: LaneIndex; defId: string }> = [
    { lane: lanes[2], defId: pick(rng, safeOpener).id },
  ];
  if (act >= 2 || isElite || nextFloat(rng) < 0.65) {
    openingQueue.push({ lane: lanes[3], defId: pick(rng, safeOpener).id });
  }

  const twoCardChance = act === 1 ? 0.45 : act === 2 ? 0.54 : 0.70;
  const waves: string[][] = [];
  for (let w = 0; w < waveCount; w++) {
    const rawThreat = (baseActThreat + w * 0.5) * mult;
    const budget = Math.max(2, Math.round(rawThreat));
    const maxCards = nextFloat(rng) < (isElite ? Math.min(0.85, twoCardChance + 0.15) : twoCardChance) ? 2 : 1;
    waves.push(pickWaveFromBudget(rng, pool, budget, maxCards));
  }

  if (isElite) {
    const elitePool = getCrisisPoolForAct(act, true);
    if (elitePool.length > 0) {
      const eliteCrisis = pick(rng, elitePool);
      const targetWaveIdx = Math.min(waves.length - 1, 2 + nextInt(rng, 2));
      waves[targetWaveIdx] = [eliteCrisis.id];
    }
  }

  if (modifier === 'surge' && waves.length >= 2) {
    const extra = pick(rng, pool);
    waves[1] = [...waves[1], extra.id].slice(0, 3);
  }

  const spec: EncounterSpec = {
    act,
    kind,
    openingFront,
    openingQueue,
    waves,
  };
  if (modifier) spec.modifier = modifier;
  return spec;
}

/**
 * Placement AI (section 2.6):
 * Prefer lanes where playerLine is empty 50% of the time (pressure),
 * otherwise prefer lanes facing the weakest player unit.
 */
export function chooseWaveLanes(
  rng: RngState,
  state: Pick<BattleState, 'playerLine' | 'crisisLine' | 'queue'>,
  cardIds: string[],
): Array<string | null> {
  const planned: Array<string | null> = [null, null, null, null];
  const bossInLane1 = Boolean(state.crisisLine[1]?.isBoss);
  let candidates = shuffle(
    rng,
    ALL_LANES.filter((l) => !(bossInLane1 && l === 1)),
  );

  for (const defId of cardIds) {
    if (candidates.length === 0) break;
    const pressureMode = nextFloat(rng) < 0.5;
    candidates.sort((a, b) => scoreLaneForAi(state, a, pressureMode) - scoreLaneForAi(state, b, pressureMode));
    const chosen = candidates.shift()!;
    planned[chosen] = defId;
  }
  return planned;
}

function scoreLaneForAi(
  state: Pick<BattleState, 'playerLine' | 'crisisLine' | 'queue'>,
  lane: LaneIndex,
  pressureMode: boolean,
): number {
  const unit = state.playerLine[lane];
  const queueBusyPenalty = state.queue[lane] ? 20 : 0;
  const frontBusyPenalty = state.crisisLine[lane] ? 5 : 0;
  if (pressureMode) {
    const emptyBonus = unit === null ? 0 : 50 + unit.health * 2;
    return emptyBonus + queueBusyPenalty + frontBusyPenalty;
  }
  if (unit !== null) {
    return unit.health * 3 + unit.power + queueBusyPenalty + frontBusyPenalty;
  }
  return 40 + queueBusyPenalty + frontBusyPenalty;
}

/** Deterministic fallback when a planned forecast lane's queue slot is still occupied. */
export function findFallbackQueueLane(
  state: Pick<BattleState, 'playerLine' | 'crisisLine' | 'queue'>,
): LaneIndex | null {
  const bossInLane1 = Boolean(state.crisisLine[1]?.isBoss);
  const open = ALL_LANES.filter((l) => !(bossInLane1 && l === 1) && state.queue[l] === null);
  if (open.length === 0) return null;
  open.sort((a, b) => {
    const ua = state.playerLine[a];
    const ub = state.playerLine[b];
    if (ua === null && ub !== null) return -1;
    if (ua !== null && ub === null) return 1;
    if (ua && ub && ua.health !== ub.health) return ua.health - ub.health;
    return a - b;
  });
  return open[0];
}

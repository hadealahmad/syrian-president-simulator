import { nextInt, pick } from '../../shared/rng';
import { generateEncounter } from './ai';
import { applyAction, createBattle } from './battle';
import { EVENTS, TEAMS, TUTORIAL_ENCOUNTER } from './content';
import { generateActMap } from './map';
import {
  CRISIS_META_STORAGE_KEY,
  CRISIS_RUN_STORAGE_KEY,
  allocRunCard,
  applyEventOutcomes,
  buildBattleRewardCards,
  buildMarketItems,
  buildRecruitUnits,
  buildRunSummary,
  buildTrainOffers,
  createDefaultMeta,
  isTeamUnlocked,
  recordRunOnMeta,
} from './run-helpers';
import type {
  ActNumber,
  BattleEvent,
  MapNode,
  PlayerAction,
  RunState,
  TeamId,
} from './types';

export {
  CRISIS_META_STORAGE_KEY,
  CRISIS_RUN_STORAGE_KEY,
  createDefaultMeta,
  generateActMap,
  isTeamUnlocked,
  recordRunOnMeta,
};

export interface CreateRunOptions {
  tutorial?: boolean;
}

export function createRun(teamId: TeamId, seed: number, opts?: CreateRunOptions): RunState {
  const rng = { seed: seed | 0 };
  const isTutorialRun = Boolean(opts?.tutorial);
  const run: RunState = {
    rng,
    teamId,
    act: 1,
    lives: 3,
    maxLives: 3,
    grants: 0,
    totalGrantsEarned: 0,
    battlesWon: 0,
    actsCleared: 0,
    deck: [],
    nextCardUid: 1,
    map: generateActMap(rng, 1, isTutorialRun),
    currentNodeId: null,
    activeNodeId: null,
    screen: 'map',
    isTutorialRun,
    tutorialCompleted: false,
    seenEventIds: [],
    marketLifeBought: false,
  };

  for (const defId of TEAMS[teamId].starterCardIds) {
    run.deck.push(allocRunCard(run, defId));
  }
  return run;
}

export function getReachableNodes(run: RunState): MapNode[] {
  if (run.screen !== 'map') return [];
  if (run.currentNodeId === null) {
    return run.map.rows[0].slice();
  }
  const curr = run.map.nodes[run.currentNodeId];
  if (!curr) return [];
  return curr.nextIds.map((id) => run.map.nodes[id]).filter(Boolean);
}

export function enterNode(inputRun: RunState, nodeId: string): RunState {
  const reachable = getReachableNodes(inputRun);
  if (!reachable.some((n) => n.id === nodeId)) {
    throw new Error(`Node '${nodeId}' is not reachable in current state`);
  }

  const run = structuredClone(inputRun);
  const node = run.map.nodes[nodeId];
  run.activeNodeId = nodeId;
  delete run.lastEventResult;

  if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
    const useTutorial = run.isTutorialRun && !run.tutorialCompleted && run.act === 1 && node.row === 0;
    const encounter = useTutorial
      ? TUTORIAL_ENCOUNTER
      : generateEncounter(run.rng, run.act, node.type, node.modifier);
    const battleSeed = nextInt(run.rng, 0x7fffffff);
    run.battle = createBattle({ deck: run.deck, encounter, seed: battleSeed });
    run.screen = 'battle';
    return run;
  }

  if (node.type === 'recruit') {
    run.recruit = { units: buildRecruitUnits(run) };
    run.screen = 'recruit';
    return run;
  }

  if (node.type === 'train') {
    run.train = { offers: buildTrainOffers(run) };
    run.screen = 'train';
    return run;
  }

  if (node.type === 'rest') {
    run.screen = 'rest';
    return run;
  }

  if (node.type === 'market') {
    run.market = {
      items: buildMarketItems(run),
      removePrice: 5,
      removeUsed: false,
      lifePrice: 8,
      lifeAvailable: !run.marketLifeBought && run.lives < run.maxLives,
    };
    run.screen = 'market';
    return run;
  }

  if (node.type === 'event') {
    const unseen = EVENTS.filter((e) => !run.seenEventIds.includes(e.id));
    const chosen = pick(run.rng, unseen.length > 0 ? unseen : EVENTS);
    run.seenEventIds.push(chosen.id);
    run.activeEvent = { eventId: chosen.id };
    run.screen = 'event';
    return run;
  }

  return run;
}

export function applyRunBattleAction(
  inputRun: RunState,
  action: PlayerAction,
): { run: RunState; events: BattleEvent[] } {
  if (inputRun.screen !== 'battle' || !inputRun.battle) {
    throw new Error('Run has no active battle');
  }
  const run = structuredClone(inputRun);
  const { state, events } = applyAction(run.battle!, action);
  run.battle = state;
  return { run, events };
}

function markActiveNodeCompleted(run: RunState): MapNode {
  const node = run.map.nodes[run.activeNodeId!];
  node.visited = true;
  const rowNode = run.map.rows[node.row]?.[node.col];
  if (rowNode && rowNode.id === node.id) {
    rowNode.visited = true;
  }
  run.currentNodeId = node.id;
  run.activeNodeId = null;
  return node;
}

export function finishBattle(inputRun: RunState): RunState {
  if (inputRun.screen !== 'battle' || !inputRun.battle || inputRun.battle.phase !== 'ended') {
    throw new Error('Battle is not finished yet');
  }
  const run = structuredClone(inputRun);
  const battle = run.battle!;
  const node = run.map.nodes[run.activeNodeId!];

  if (run.isTutorialRun && node.row === 0 && run.act === 1) {
    run.tutorialCompleted = true;
  }

  delete run.battle;

  if (battle.result === 'win') {
    markActiveNodeCompleted(run);
    run.battlesWon += 1;
    const baseGrants = node.type === 'boss' ? 10 : node.type === 'elite' ? 6 : 3;
    const earned = baseGrants + battle.overflow;
    run.grants += earned;
    run.totalGrantsEarned += earned;
    if (node.type === 'boss' && run.act === 3) {
      run.actsCleared += 1;
      run.screen = 'ended';
      run.summary = buildRunSummary(run, true);
      return run;
    }
    const kind = node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'battle';
    run.reward = {
      grantsEarned: earned,
      overflowGrants: battle.overflow,
      cards: buildBattleRewardCards(run, kind),
      isBossReward: node.type === 'boss',
    };
    run.screen = 'reward';
    return run;
  }

  // Battle lost
  run.lives = Math.max(0, run.lives - 1);
  if (run.lives <= 0) {
    run.activeNodeId = null;
    run.screen = 'ended';
    run.summary = buildRunSummary(run, false);
    return run;
  }

  if (node.type === 'boss') {
    // Boss retry: keep currentNodeId before the boss so boss remains the sole reachable node
    run.activeNodeId = null;
    run.screen = 'map';
    return run;
  }

  markActiveNodeCompleted(run);
  run.screen = 'map';
  return run;
}

export function chooseReward(inputRun: RunState, cardUid: string | null): RunState {
  if (inputRun.screen !== 'reward' || !inputRun.reward) {
    throw new Error('Not on reward screen');
  }
  const run = structuredClone(inputRun);
  const reward = run.reward!;
  if (cardUid !== null) {
    const picked = reward.cards.find((c) => c.uid === cardUid);
    if (!picked) throw new Error(`Unknown reward card uid: ${cardUid}`);
    run.deck.push(picked);
  }
  const wasBoss = reward.isBossReward;
  delete run.reward;

  if (wasBoss) {
    run.actsCleared += 1;
    if (run.act < 3) {
      run.act = (run.act + 1) as ActNumber;
      run.map = generateActMap(run.rng, run.act, false);
      run.currentNodeId = null;
      run.screen = 'map';
    } else {
      run.screen = 'ended';
      run.summary = buildRunSummary(run, true);
    }
  } else {
    run.screen = 'map';
  }
  return run;
}

export function chooseRecruit(inputRun: RunState, cardUid: string | null): RunState {
  if (inputRun.screen !== 'recruit' || !inputRun.recruit) {
    throw new Error('Not on recruit screen');
  }
  const run = structuredClone(inputRun);
  if (cardUid !== null) {
    const picked = run.recruit!.units.find((u) => u.uid === cardUid);
    if (!picked) throw new Error(`Unknown recruit card uid: ${cardUid}`);
    run.deck.push(picked);
  }
  delete run.recruit;
  markActiveNodeCompleted(run);
  run.screen = 'map';
  return run;
}

export function chooseTrain(
  inputRun: RunState,
  cardUid: string | null,
  upgradeIndex: 0 | 1 = 0,
): RunState {
  if (inputRun.screen !== 'train' || !inputRun.train) {
    throw new Error('Not on train screen');
  }
  const run = structuredClone(inputRun);
  if (cardUid !== null) {
    const pair = run.train!.offers[cardUid];
    const card = run.deck.find((c) => c.uid === cardUid);
    if (!pair || !card) throw new Error(`Invalid train card uid: ${cardUid}`);
    const up = pair[upgradeIndex];
    if (up.kind === 'power') card.powerBonus += up.amount;
    else if (up.kind === 'health') card.healthBonus += up.amount;
    else if (up.kind === 'trait') card.addedTrait = up.trait;
  }
  delete run.train;
  markActiveNodeCompleted(run);
  run.screen = 'map';
  return run;
}

export function chooseRest(
  inputRun: RunState,
  choice: { kind: 'heal' } | { kind: 'remove'; cardUid: string },
): RunState {
  if (inputRun.screen !== 'rest') {
    throw new Error('Not on rest screen');
  }
  const run = structuredClone(inputRun);
  if (choice.kind === 'heal') {
    run.lives = Math.min(run.maxLives, run.lives + 1);
  } else {
    if (run.deck.length <= 4) throw new Error('Deck is at minimum size');
    const idx = run.deck.findIndex((c) => c.uid === choice.cardUid);
    if (idx < 0) throw new Error(`Card not found: ${choice.cardUid}`);
    run.deck.splice(idx, 1);
  }
  markActiveNodeCompleted(run);
  run.screen = 'map';
  return run;
}

export function buyMarketCard(inputRun: RunState, slotId: string): RunState {
  if (inputRun.screen !== 'market' || !inputRun.market) throw new Error('Not in market');
  const run = structuredClone(inputRun);
  const item = run.market!.items.find((i) => i.slotId === slotId);
  if (!item || item.sold || run.grants < item.price) {
    throw new Error(`Cannot buy market slot: ${slotId}`);
  }
  run.grants -= item.price;
  item.sold = true;
  run.deck.push({ ...item.card });
  return run;
}

export function buyMarketRemove(inputRun: RunState, cardUid: string): RunState {
  if (inputRun.screen !== 'market' || !inputRun.market) throw new Error('Not in market');
  const run = structuredClone(inputRun);
  const m = run.market!;
  if (m.removeUsed || run.grants < m.removePrice || run.deck.length <= 4) {
    throw new Error('Cannot remove card at market');
  }
  const idx = run.deck.findIndex((c) => c.uid === cardUid);
  if (idx < 0) throw new Error(`Card not found: ${cardUid}`);
  run.grants -= m.removePrice;
  m.removeUsed = true;
  run.deck.splice(idx, 1);
  return run;
}

export function buyMarketLife(inputRun: RunState): RunState {
  if (inputRun.screen !== 'market' || !inputRun.market) throw new Error('Not in market');
  const run = structuredClone(inputRun);
  const m = run.market!;
  if (!m.lifeAvailable || run.grants < m.lifePrice || run.lives >= run.maxLives) {
    throw new Error('Cannot buy life at market');
  }
  run.grants -= m.lifePrice;
  m.lifeAvailable = false;
  run.marketLifeBought = true;
  run.lives = Math.min(run.maxLives, run.lives + 1);
  return run;
}

export function leaveMarket(inputRun: RunState): RunState {
  if (inputRun.screen !== 'market') throw new Error('Not in market');
  const run = structuredClone(inputRun);
  delete run.market;
  markActiveNodeCompleted(run);
  run.screen = 'map';
  return run;
}

export function getLegalEventChoices(run: RunState): Array<0 | 1> {
  if (run.screen !== 'event' || !run.activeEvent) return [];
  const ev = EVENTS.find((e) => e.id === run.activeEvent!.eventId);
  if (!ev) return [];
  const out: Array<0 | 1> = [];
  if ((ev.choices[0].requireGrants ?? 0) <= run.grants) out.push(0);
  if ((ev.choices[1].requireGrants ?? 0) <= run.grants) out.push(1);
  return out;
}

export function chooseEventOption(inputRun: RunState, choiceIndex: 0 | 1): RunState {
  if (inputRun.screen !== 'event' || !inputRun.activeEvent) throw new Error('Not on event screen');
  const legal = getLegalEventChoices(inputRun);
  if (!legal.includes(choiceIndex)) throw new Error(`Illegal event choice: ${choiceIndex}`);

  const run = structuredClone(inputRun);
  const ev = EVENTS.find((e) => e.id === run.activeEvent!.eventId)!;
  applyEventOutcomes(run, ev.choices[choiceIndex]);
  delete run.activeEvent;
  markActiveNodeCompleted(run);

  if (run.lives <= 0) {
    run.screen = 'ended';
    run.summary = buildRunSummary(run, false);
    return run;
  }
  run.screen = 'map';
  return run;
}

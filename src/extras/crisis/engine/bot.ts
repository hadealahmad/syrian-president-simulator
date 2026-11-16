import { nextFloat, nextInt, pick, type RngState } from '../../shared/rng';
import {
  applyAction,
  getLegalActions,
  getQueueView,
  previewRound,
} from './battle';
import { ACTS, COLLECTABLE_CARDS, getCardDef, getDeckCardStats } from './content';
import {
  applyRunBattleAction,
  buyMarketCard,
  buyMarketLife,
  buyMarketRemove,
  chooseEventOption,
  chooseRecruit,
  chooseRest,
  chooseReward,
  chooseTrain,
  enterNode,
  finishBattle,
  getLegalEventChoices,
  getReachableNodes,
  leaveMarket,
} from './run';
import type {
  ActNumber,
  BattleState,
  DeckCard,
  LaneIndex,
  MapNode,
  PlayerAction,
  RoundPreview,
  RunState,
} from './types';

function scoreBoardAndPreview(state: BattleState, prev: RoundPreview): number {
  if (prev.wouldEnd) {
    return prev.wouldResult === 'win' ? 10000 + state.overflow * 50 : -10000;
  }

  let score = prev.projectedBalance * 30;
  if (prev.wouldTriggerBossPhase2) score += 420;

  const qView = getQueueView(state);

  for (let i = 0; i < 4; i++) {
    const lane = i as LaneIndex;
    const u = state.playerLine[lane];
    const c = state.crisisLine[lane];
    const ps = prev.playerSlots[lane];
    const cs = prev.crisisSlots[lane];

    if (c) {
      score += cs.damageTaken * (c.isBoss ? 8.5 : 3.5);
      if (cs.destroyed) score += c.isBoss ? 5000 : 16 + c.power * 3;
    }

    if (u) {
      const isToken = Boolean(u.sourceCard.isToken || u.defId === 'volunteers');
      if (ps.destroyed) {
        score -= isToken ? 1.5 : u.traits.includes('return') ? 2 : 11 + u.maxHealth;
      } else {
        const remHp = Math.max(0, u.health - ps.damageTaken);
        score += ps.effectivePower * 3.5 + remHp * 2.2;
        if (u.traits.includes('income')) score += 8.5;
        if (u.traits.includes('inspire')) score += 5;
        if (u.traits.includes('aid')) score += 4.5;
        if (u.traits.includes('promote') && !u.promoted) score += 5;
        if (u.traits.includes('watch')) score += 3;
        if (u.traits.includes('warn') && !state.forecastRevealed) score += 2.5;
        if (qView[lane].status !== 'empty') score += 4.5;
        if (state.bossId === 'spiral' && state.bossPhase === 2 && u.category === 'money') {
          score += 12;
        }
      }
    }
  }

  score += state.budget * 1.6;
  score += state.hand.filter((h) => !h.isToken && h.defId !== 'old-debt' && h.defId !== 'red-tape').length * 2.2;
  score -= state.hand.filter((h) => h.defId === 'red-tape').length * 3.5;
  if (state.forecastRevealed) score += 3;

  return score;
}

export function scoreCardForDeck(
  card: DeckCard,
  deck: DeckCard[],
  act: ActNumber,
  botRng?: RngState,
): number {
  const { def, power, health, traits } = getDeckCardStats(card);
  if (def.kind === 'curse') return -50;

  let score = 0;
  if (def.rarity === 'rare') score += 8.0;
  else if (def.rarity === 'uncommon') score += 6.2;
  else score += 3.8;

  if (def.kind === 'unit') {
    score += power * 1.9 + health * 1.2 - def.cost * 1.3;
    score += traits.length * 2.8;
  } else {
    score += 6.8 - def.cost * 0.8;
  }

  const nextAct = (deck.length >= 12 && act < 3 ? act + 1 : act) as ActNumber;
  const targetFlavour = ACTS[nextAct].flavour;
  if (def.category === targetFlavour) score += 2.2;
  if (act >= 2 && def.category === 'money') score += 1.5;

  const sameCatCount = deck.filter((c) => getCardDef(c.defId).category === def.category).length;
  if (traits.includes('solidarity')) score += Math.min(3.5, sameCatCount * 0.8);

  const copiesOwned = deck.filter((c) => c.defId === def.id).length;
  score -= copiesOwned * 8.5;

  if (botRng) {
    score += (nextFloat(botRng) - 0.5) * 8.5;
  }
  return score;
}

export function chooseGreedyBattleAction(state: BattleState, botRng?: RngState): PlayerAction {
  const legal = getLegalActions(state);
  if (legal.length === 0) throw new Error('No legal actions in battle');

  if (state.phase === 'supply') {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < state.supplyOptions.length; i++) {
      const opt = state.supplyOptions[i];
      const def = getCardDef(opt.defId);
      let val = 0;
      if (opt.isToken) {
        const unblockedThreats = state.crisisLine.filter(
          (c, l) => c !== null && state.playerLine[l] === null,
        ).length;
        val = state.budget <= 1 && unblockedThreats >= 2 ? 7 : 2.5;
      } else if (def.kind === 'curse') {
        val = -20;
      } else {
        const { power, health, traits } = getDeckCardStats(opt);
        val = (def.kind === 'unit' ? power * 2.5 + health * 1.8 : 7.5) + traits.length * 2.5;
        if (def.cost <= state.budget) val += 4;
        else if (def.cost > state.budget + 2) val -= 4;
      }
      if (botRng) val += nextFloat(botRng) * 0.5;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
    return { type: 'chooseSupply', index: bestIdx };
  }

  const basePrev = previewRound(state);
  if (basePrev.wouldEnd && basePrev.wouldResult === 'win') {
    return { type: 'endRound' };
  }
  const baseScore = scoreBoardAndPreview(state, basePrev);

  let bestAction: PlayerAction = { type: 'endRound' };
  let bestScore = baseScore + 0.6;

  for (const act of legal) {
    if (act.type === 'endRound') continue;
    if (act.type === 'withdrawUnit') {
      const u = state.playerLine[act.lane];
      const boardFull = state.playerLine.every((slot) => slot !== null);
      if (!boardFull || !u || (!u.sourceCard.isToken && u.health > 1)) continue;
    }
    if (act.type === 'playAction' && state.hand.find((h) => h.uid === act.handUid)?.defId === 'evacuate') {
      const u = state.playerLine[act.lane!];
      if (!u || basePrev.playerSlots[act.lane!].damageTaken < u.health) continue;
    }

    const next = applyAction(state, act).state;
    const nextPrev = previewRound(next);
    const s = scoreBoardAndPreview(next, nextPrev);
    if (s > bestScore) {
      bestScore = s;
      bestAction = act;
    }
  }

  return bestAction;
}

export function playBattleWithGreedyBot(initial: BattleState, botRng?: RngState): BattleState {
  let state = initial;
  let safety = 0;
  let actionsInRound = 0;
  let lastRound = state.round;

  while (state.phase !== 'ended') {
    safety += 1;
    if (safety > 600) throw new Error('Greedy bot exceeded safety step limit');
    if (state.round !== lastRound) {
      lastRound = state.round;
      actionsInRound = 0;
    }
    const chosen =
      state.phase === 'play' && actionsInRound >= 10
        ? ({ type: 'endRound' } as PlayerAction)
        : chooseGreedyBattleAction(state, botRng);
    state = applyAction(state, chosen).state;
    actionsInRound += 1;
  }
  return state;
}

export function playBattleWithRandomBot(initial: BattleState, botRng: RngState): BattleState {
  let state = initial;
  let safety = 0;
  let actionsInRound = 0;
  let lastRound = state.round;

  while (state.phase !== 'ended') {
    safety += 1;
    if (safety > 800) throw new Error('Random bot exceeded safety step limit');
    if (state.round !== lastRound) {
      lastRound = state.round;
      actionsInRound = 0;
    }
    const legal = getLegalActions(state);
    const chosen =
      state.phase === 'play' && actionsInRound >= 8
        ? ({ type: 'endRound' } as PlayerAction)
        : pick(botRng, legal);
    state = applyAction(state, chosen).state;
    actionsInRound += 1;
  }
  return state;
}

function chooseCardToRemove(deck: DeckCard[]): DeckCard | null {
  if (deck.length <= 5) return null;
  const curses = deck.filter((c) => getCardDef(c.defId).kind === 'curse');
  if (curses.length > 0) return curses[0];
  const unupgradedCommons = deck.filter((c) => {
    const def = getCardDef(c.defId);
    return def.rarity === 'common' && def.cost <= 1 && c.powerBonus === 0 && c.healthBonus === 0 && !c.addedTrait;
  });
  return unupgradedCommons[0] ?? null;
}

function scoreNodeHeuristic(run: RunState, node: MapNode): number {
  switch (node.type) {
    case 'rest':
      return run.lives < run.maxLives ? 20 : 8;
    case 'market':
      return run.grants >= 6 ? 15 : 4;
    case 'train':
      return 13;
    case 'recruit':
      return run.deck.length < 15 ? 12 : 6;
    case 'elite':
      return run.lives >= 2 && run.deck.length >= 11 ? 11 : 3;
    case 'battle':
      return node.modifier === 'popular-support' ? 11 : node.modifier ? 7 : 9;
    case 'event':
      return 8;
    case 'boss':
      return 10;
  }
}

export function stepRunGreedy(
  run: RunState,
  botRng: RngState,
  onCardPicked?: (defId: string) => void,
): RunState {
  if (run.screen === 'map') {
    const nodes = getReachableNodes(run);
    const best = [...nodes].sort((a, b) => scoreNodeHeuristic(run, b) - scoreNodeHeuristic(run, a))[0];
    return enterNode(run, best.id);
  }

  if (run.screen === 'battle') {
    let cur = run;
    let roundActions = 0;
    let lastRound = cur.battle!.round;
    while (cur.battle && cur.battle.phase !== 'ended') {
      if (cur.battle.round !== lastRound) {
        lastRound = cur.battle.round;
        roundActions = 0;
      }
      const act =
        cur.battle.phase === 'play' && roundActions >= 10
          ? ({ type: 'endRound' } as PlayerAction)
          : chooseGreedyBattleAction(cur.battle, botRng);
      cur = applyRunBattleAction(cur, act).run;
      roundActions += 1;
    }
    return finishBattle(cur);
  }

  if (run.screen === 'reward') {
    const scored = run.reward!.cards
      .map((c) => ({ c, s: scoreCardForDeck(c, run.deck, run.act, botRng) }))
      .sort((a, b) => b.s - a.s);
    const pickCard = run.deck.length >= 18 && scored[0].s < 6 ? null : scored[0].c;
    if (pickCard && onCardPicked) onCardPicked(pickCard.defId);
    return chooseReward(run, pickCard ? pickCard.uid : null);
  }

  if (run.screen === 'recruit') {
    const scored = run.recruit!.units
      .map((c) => ({ c, s: scoreCardForDeck(c, run.deck, run.act, botRng) }))
      .sort((a, b) => b.s - a.s);
    const pickCard = run.deck.length >= 18 && scored[0].s < 5 ? null : scored[0].c;
    if (pickCard && onCardPicked) onCardPicked(pickCard.defId);
    return chooseRecruit(run, pickCard ? pickCard.uid : null);
  }

  if (run.screen === 'train') {
    const uids = Object.keys(run.train!.offers);
    if (uids.length === 0) return chooseTrain(run, null);
    const sorted = uids
      .map((uid) => ({ uid, card: run.deck.find((c) => c.uid === uid)! }))
      .sort((a, b) => getCardDef(b.card.defId).cost - getCardDef(a.card.defId).cost);
    const targetUid = sorted[0].uid;
    const pair = run.train!.offers[targetUid];
    const upIdx: 0 | 1 = pair[0].kind === 'trait' || pair[0].kind === 'power' ? 0 : 1;
    return chooseTrain(run, targetUid, upIdx);
  }

  if (run.screen === 'rest') {
    if (run.lives < run.maxLives) return chooseRest(run, { kind: 'heal' });
    const rem = chooseCardToRemove(run.deck);
    if (rem) return chooseRest(run, { kind: 'remove', cardUid: rem.uid });
    return chooseRest(run, { kind: 'heal' });
  }

  if (run.screen === 'market') {
    let cur = run;
    if (cur.market!.lifeAvailable && cur.lives < cur.maxLives && cur.grants >= cur.market!.lifePrice) {
      cur = buyMarketLife(cur);
    }
    const candidates = cur.market!.items
      .filter((i) => !i.sold && cur.grants >= i.price)
      .map((i) => ({ i, s: scoreCardForDeck(i.card, cur.deck, cur.act, botRng) - i.price * 0.5 }))
      .sort((a, b) => b.s - a.s);
    if (candidates.length > 0 && candidates[0].s > 2.5 && cur.deck.length < 18) {
      if (onCardPicked) onCardPicked(candidates[0].i.card.defId);
      cur = buyMarketCard(cur, candidates[0].i.slotId);
    }
    const rem = chooseCardToRemove(cur.deck);
    if (rem && !cur.market!.removeUsed && cur.grants >= cur.market!.removePrice) {
      cur = buyMarketRemove(cur, rem.uid);
    }
    return leaveMarket(cur);
  }

  if (run.screen === 'event') {
    const legal = getLegalEventChoices(run);
    // Prefer choice 0 when affordable unless low on deck space for curses
    const idx = legal.includes(0) && nextFloat(botRng) < 0.7 ? 0 : legal[legal.length - 1];
    return chooseEventOption(run, idx);
  }

  return run;
}

export function stepRunRandom(run: RunState, botRng: RngState): RunState {
  if (run.screen === 'map') {
    const nodes = getReachableNodes(run);
    return enterNode(run, pick(botRng, nodes).id);
  }
  if (run.screen === 'battle') {
    let cur = run;
    let roundActions = 0;
    let lastRound = cur.battle!.round;
    while (cur.battle && cur.battle.phase !== 'ended') {
      if (cur.battle.round !== lastRound) {
        lastRound = cur.battle.round;
        roundActions = 0;
      }
      const legal = getLegalActions(cur.battle);
      const act =
        cur.battle.phase === 'play' && roundActions >= 8
          ? ({ type: 'endRound' } as PlayerAction)
          : pick(botRng, legal);
      cur = applyRunBattleAction(cur, act).run;
      roundActions += 1;
    }
    return finishBattle(cur);
  }
  if (run.screen === 'reward') {
    const opts = [...run.reward!.cards.map((c) => c.uid), null];
    return chooseReward(run, pick(botRng, opts));
  }
  if (run.screen === 'recruit') {
    const opts = [...run.recruit!.units.map((u) => u.uid), null];
    return chooseRecruit(run, pick(botRng, opts));
  }
  if (run.screen === 'train') {
    const uids = Object.keys(run.train!.offers);
    if (uids.length === 0) return chooseTrain(run, null);
    return chooseTrain(run, pick(botRng, uids), nextInt(botRng, 2) as 0 | 1);
  }
  if (run.screen === 'rest') {
    if (run.deck.length > 4 && nextInt(botRng, 2) === 0) {
      return chooseRest(run, { kind: 'remove', cardUid: pick(botRng, run.deck).uid });
    }
    return chooseRest(run, { kind: 'heal' });
  }
  if (run.screen === 'market') {
    const affordable = run.market!.items.filter((i) => !i.sold && run.grants >= i.price);
    let cur = run;
    if (affordable.length > 0 && nextInt(botRng, 2) === 0) {
      cur = buyMarketCard(cur, pick(botRng, affordable).slotId);
    }
    return leaveMarket(cur);
  }
  if (run.screen === 'event') {
    const legal = getLegalEventChoices(run);
    return chooseEventOption(run, pick(botRng, legal));
  }
  return run;
}

export const ALL_COLLECTABLE_CARD_IDS = COLLECTABLE_CARDS.map((c) => c.id);

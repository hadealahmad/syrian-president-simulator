import { nextInt, pick, pickWeighted, shuffle, type RngState } from '../../shared/rng';
import {
  COLLECTABLE_ACTIONS,
  COLLECTABLE_CARDS,
  COLLECTABLE_UNITS,
  PLAYER_TRAITS,
  createDeckCard,
  getCardDef,
  getDeckCardStats,
} from './content';
import type {
  ActNumber,
  CrisisMetaState,
  DeckCard,
  EventChoiceDef,
  MarketItem,
  PlayerCardDef,
  PlayerTraitId,
  RunState,
  RunSummary,
  TeamId,
  TrainUpgrade,
} from './types';

export const CRISIS_RUN_STORAGE_KEY = 'extras-crisis-v1';
export const CRISIS_META_STORAGE_KEY = 'extras-crisis-meta-v1';

const TRAINABLE_TRAITS: PlayerTraitId[] = [
  'watch',
  'shield',
  'inspire',
  'income',
  'promote',
  'mobile',
  'solidarity',
  'thorns',
  'aid',
  'warn',
];

export function allocRunCard(run: RunState, defId: string): DeckCard {
  const uid = `card-${run.nextCardUid}`;
  run.nextCardUid += 1;
  return createDeckCard(defId, uid, false);
}

export function pickCardsByRarity(
  rng: RngState,
  pool: PlayerCardDef[],
  count: number,
  weights: { common: number; uncommon: number; rare: number },
  excludeIds: Set<string> = new Set(),
): PlayerCardDef[] {
  const result: PlayerCardDef[] = [];
  for (let i = 0; i < count; i++) {
    const candidates = pool.filter((c) => !excludeIds.has(c.id));
    if (candidates.length === 0) break;
    const chosen = pickWeighted(rng, candidates, (c) => {
      if (c.rarity === 'common') return weights.common;
      if (c.rarity === 'uncommon') return weights.uncommon;
      if (c.rarity === 'rare') return weights.rare;
      return 0;
    });
    result.push(chosen);
    excludeIds.add(chosen.id);
  }
  return result;
}

export function buildBattleRewardCards(
  run: RunState,
  kind: 'battle' | 'elite' | 'boss',
): DeckCard[] {
  const used = new Set<string>();
  const defs: PlayerCardDef[] = [];
  if (kind === 'boss') {
    const rares = COLLECTABLE_CARDS.filter((c) => c.rarity === 'rare');
    defs.push(...shuffle(run.rng, rares).slice(0, 3));
  } else if (kind === 'elite') {
    const rares = COLLECTABLE_CARDS.filter((c) => c.rarity === 'rare');
    const rPick = pick(run.rng, rares);
    used.add(rPick.id);
    defs.push(rPick);
    defs.push(
      ...pickCardsByRarity(run.rng, COLLECTABLE_CARDS, 2, { common: 55, uncommon: 45, rare: 0 }, used),
    );
  } else {
    const rareW = run.act === 1 ? 5 : run.act === 2 ? 10 : 15;
    defs.push(
      ...pickCardsByRarity(run.rng, COLLECTABLE_CARDS, 3, { common: 65, uncommon: 35 - rareW, rare: rareW }, used),
    );
  }
  return shuffle(run.rng, defs).map((d) => allocRunCard(run, d.id));
}

export function buildRecruitUnits(run: RunState): DeckCard[] {
  const defs = pickCardsByRarity(run.rng, COLLECTABLE_UNITS, 3, {
    common: 60,
    uncommon: 32,
    rare: 8,
  });
  return defs.map((d) => allocRunCard(run, d.id));
}

export function buildTrainOffers(run: RunState): Record<string, [TrainUpgrade, TrainUpgrade]> {
  const offers: Record<string, [TrainUpgrade, TrainUpgrade]> = {};
  for (const card of run.deck) {
    const { def, traits } = getDeckCardStats(card);
    if (def.kind !== 'unit') continue;
    const upPower: TrainUpgrade = { kind: 'power', label: 'ارفع القوة +1', amount: 1 };
    const upHealth: TrainUpgrade = { kind: 'health', label: 'ارفع الصمود +2', amount: 2 };
    if (traits.length === 0) {
      const traitPool = TRAINABLE_TRAITS.filter((t) => !(t === 'split' && (def.power ?? 0) === 0));
      const chosenTrait = pick(run.rng, traitPool);
      const upTrait: TrainUpgrade = {
        kind: 'trait',
        label: `أضف سمة ${PLAYER_TRAITS[chosenTrait].name}`,
        trait: chosenTrait,
      };
      const pair = shuffle(run.rng, [upPower, upHealth, upTrait]).slice(0, 2) as [TrainUpgrade, TrainUpgrade];
      offers[card.uid] = pair;
    } else {
      offers[card.uid] = [upPower, upHealth];
    }
  }
  return offers;
}

export function buildMarketItems(run: RunState): MarketItem[] {
  const used = new Set<string>();
  const commonU = pickCardsByRarity(run.rng, COLLECTABLE_UNITS, 1, { common: 1, uncommon: 0, rare: 0 }, used)[0];
  const uncommonU = pickCardsByRarity(run.rng, COLLECTABLE_UNITS, 1, { common: 0, uncommon: 1, rare: 0 }, used)[0];
  const rareU = pickCardsByRarity(run.rng, COLLECTABLE_UNITS, 1, { common: 0, uncommon: 0, rare: 1 }, used)[0];
  const actionDef = pick(run.rng, COLLECTABLE_ACTIONS);

  return [
    { slotId: 'u-common', card: allocRunCard(run, commonU.id), price: 4, sold: false },
    { slotId: 'u-uncommon', card: allocRunCard(run, uncommonU.id), price: 6, sold: false },
    { slotId: 'u-rare', card: allocRunCard(run, rareU.id), price: 9, sold: false },
    { slotId: 'action', card: allocRunCard(run, actionDef.id), price: 3, sold: false },
  ];
}

export function applyEventOutcomes(run: RunState, choice: EventChoiceDef): void {
  for (const out of choice.outcomes) {
    if (out.kind === 'grants') {
      if (out.delta > 0) run.totalGrantsEarned += out.delta;
      run.grants = Math.max(0, run.grants + out.delta);
    } else if (out.kind === 'life') {
      run.lives = Math.max(0, Math.min(run.maxLives, run.lives + out.delta));
    } else if (out.kind === 'addCards') {
      for (const defId of out.defIds) {
        run.deck.push(allocRunCard(run, defId));
      }
    } else if (out.kind === 'addRandomRareUnit') {
      const rares = COLLECTABLE_UNITS.filter((u) => u.rarity === 'rare');
      const r = pick(run.rng, rares);
      run.deck.push(allocRunCard(run, r.id));
    } else if (out.kind === 'upgradeRandomUnit') {
      const units = run.deck.filter((c) => getCardDef(c.defId).kind === 'unit');
      if (units.length > 0) {
        const target = units[nextInt(run.rng, units.length)];
        if (nextInt(run.rng, 2) === 0) target.powerBonus += 1;
        else target.healthBonus += 2;
      }
    } else if (out.kind === 'removeRandomCurseOrCard') {
      const curses = run.deck.filter((c) => getCardDef(c.defId).kind === 'curse');
      if (curses.length > 0) {
        const victim = pick(run.rng, curses);
        run.deck = run.deck.filter((c) => c.uid !== victim.uid);
      } else if (run.deck.length > 5) {
        const commons = run.deck.filter((c) => getCardDef(c.defId).rarity === 'common');
        const pool = commons.length > 0 ? commons : run.deck;
        const victim = pick(run.rng, pool);
        run.deck = run.deck.filter((c) => c.uid !== victim.uid);
      }
    }
  }
}

export function buildRunSummary(run: RunState, won: boolean): RunSummary {
  return {
    won,
    kicker: won ? 'نهاية العام الطارئ' : 'انفلات الأزمات',
    title: won ? 'عبرت البلاد عام الأزمات' : 'سقطت الحكومة',
    paragraph: won
      ? 'صمدت فرقك في وجه الشتاء والرغيف والليرة، وخرجت البلاد بمؤسسات متماسكة وثقة متجددة.'
      : 'تراكمت الضغوط على الجبهات الأربع ونفدت ثقة الشارع قبل استعادة التوازن.',
    actsCleared: run.actsCleared,
    battlesWon: run.battlesWon,
    deckSize: run.deck.length,
    grantsEarned: run.totalGrantsEarned,
  };
}

export function createDefaultMeta(): CrisisMetaState {
  return {
    version: 1,
    unlockedTeams: ['rescue'],
    tutorialSeen: false,
    runsPlayed: 0,
    runsWon: 0,
    highestActReached: 1,
    speed: 'normal',
    sound: true,
    haptics: true,
  };
}

export function isTeamUnlocked(meta: CrisisMetaState, teamId: TeamId): boolean {
  return meta.unlockedTeams.includes(teamId);
}

export function recordRunOnMeta(meta: CrisisMetaState, run: RunState): CrisisMetaState {
  const next = structuredClone(meta);
  next.runsPlayed += 1;
  if (run.tutorialCompleted) next.tutorialSeen = true;
  if (run.act > next.highestActReached) {
    next.highestActReached = run.act as ActNumber;
  }
  if (run.act >= 2 && !next.unlockedTeams.includes('development')) {
    next.unlockedTeams.push('development');
  }
  if (run.summary?.won) {
    next.runsWon += 1;
    if (!next.unlockedTeams.includes('development')) next.unlockedTeams.push('development');
    if (!next.unlockedTeams.includes('resolve')) next.unlockedTeams.push('resolve');
  }
  return next;
}

import { get, writable } from 'svelte/store';
import { fx, fxSettings } from '../../lib/ui/fx/feedback';
import { loadJSON, removeKey, saveJSON } from '../shared/storage';
import {
  buildInitialBattleLogLines,
  formatBattleLogLines,
  replayBattleResolution,
  skipBattleAnimation,
  triggerQuickSlotPopup,
} from './animate';
import {
  CRISIS_META_STORAGE_KEY,
  CRISIS_RUN_STORAGE_KEY,
  applyRunBattleAction,
  buyMarketCard,
  buyMarketLife,
  buyMarketRemove,
  chooseEventOption,
  chooseRecruit,
  chooseRest,
  chooseReward,
  chooseTrain,
  createDefaultMeta,
  createRun,
  enterNode,
  finishBattle,
  isTeamUnlocked,
  leaveMarket,
  recordRunOnMeta,
  type BattleState,
  type CrisisInstance,
  type CrisisMetaState,
  type DeckCard,
  type ForecastSlotView,
  type LaneIndex,
  type PlayerAction,
  type RunState,
  type TeamId,
  type UnitInstance,
} from './engine';

export type TopView = 'title' | 'team-select' | 'game';
export type DeckSheetMode = 'deck' | 'draw' | 'discard' | null;

export type CardDetailTarget =
  | {
      kind: 'playerBoard';
      unit: UnitInstance;
      lane: LaneIndex;
      effectivePower: number;
      expertiseActive: boolean;
    }
  | {
      kind: 'crisisBoard';
      crisis: CrisisInstance;
      lane: LaneIndex;
      effectivePower: number;
      zone: 'crisis' | 'queue';
    }
  | { kind: 'deckCard'; card: DeckCard }
  | { kind: 'forecastRevealed'; slot: Extract<ForecastSlotView, { status: 'revealed' }> };

function loadInitialMeta(): CrisisMetaState {
  const base = createDefaultMeta();
  const saved = loadJSON<Partial<CrisisMetaState>>(CRISIS_META_STORAGE_KEY);
  if (!saved || typeof saved !== 'object') return base;
  return {
    version: 1,
    unlockedTeams: Array.isArray(saved.unlockedTeams) && saved.unlockedTeams.length > 0
      ? saved.unlockedTeams
      : base.unlockedTeams,
    tutorialSeen: typeof saved.tutorialSeen === 'boolean' ? saved.tutorialSeen : base.tutorialSeen,
    runsPlayed: typeof saved.runsPlayed === 'number' ? saved.runsPlayed : base.runsPlayed,
    runsWon: typeof saved.runsWon === 'number' ? saved.runsWon : base.runsWon,
    highestActReached:
      saved.highestActReached === 1 || saved.highestActReached === 2 || saved.highestActReached === 3
        ? saved.highestActReached
        : base.highestActReached,
    speed: saved.speed === 'fast' ? 'fast' : 'normal',
    sound: typeof saved.sound === 'boolean' ? saved.sound : base.sound,
    haptics: typeof saved.haptics === 'boolean' ? saved.haptics : base.haptics,
  };
}

function loadInitialRun(): RunState | null {
  const saved = loadJSON<RunState>(CRISIS_RUN_STORAGE_KEY);
  if (!saved || typeof saved !== 'object' || !saved.screen || !saved.map) return null;
  return saved;
}

const initialMeta = loadInitialMeta();
fxSettings.set({ sound: initialMeta.sound, haptics: initialMeta.haptics });

const initialRun = loadInitialRun();

export const metaStore = writable<CrisisMetaState>(initialMeta);
export const runStore = writable<RunState | null>(initialRun);
export const viewStore = writable<TopView>(initialRun?.screen === 'ended' ? 'game' : 'title');
export const howToOpen = writable<boolean>(false);
export const settingsOpen = writable<boolean>(false);
export const mapLegendOpen = writable<boolean>(false);
export const deckSheetMode = writable<DeckSheetMode>(null);
export const cardDetailTarget = writable<CardDetailTarget | null>(null);
export const roundLogStore = writable<string[]>(
  initialRun?.screen === 'battle' && initialRun.battle
    ? buildInitialBattleLogLines(initialRun.battle)
    : [],
);
export const coachStepStore = writable<number | null>(null);

function persistMeta(next: CrisisMetaState): void {
  metaStore.set(next);
  saveJSON(CRISIS_META_STORAGE_KEY, next);
  fxSettings.set({ sound: next.sound, haptics: next.haptics });
}

function finalizeEndedRunIfNeeded(nextRun: RunState): void {
  if (nextRun.screen === 'ended') {
    const updatedMeta = recordRunOnMeta(get(metaStore), nextRun);
    persistMeta(updatedMeta);
    removeKey(CRISIS_RUN_STORAGE_KEY);
  } else {
    saveJSON(CRISIS_RUN_STORAGE_KEY, nextRun);
  }
}

function commitRun(nextRun: RunState): void {
  runStore.set(nextRun);
  finalizeEndedRunIfNeeded(nextRun);
}

function syncCoachOnBattleStart(run: RunState): void {
  const meta = get(metaStore);
  if (run.screen === 'battle' && run.isTutorialRun && !run.tutorialCompleted && !meta.tutorialSeen) {
    coachStepStore.set(run.battle?.phase === 'supply' ? 0 : 1);
  } else {
    coachStepStore.set(null);
  }
}

export function openTitleScreen(): void {
  skipBattleAnimation();
  cardDetailTarget.set(null);
  deckSheetMode.set(null);
  mapLegendOpen.set(false);
  viewStore.set('title');
}

export function openTeamSelect(): void {
  fx('tap');
  viewStore.set('team-select');
}

export function continueSavedRun(): void {
  const run = get(runStore);
  if (!run) return;
  fx('confirm');
  if (run.screen === 'battle' && run.battle?.phase === 'ended') {
    const after = finishBattle(run);
    commitRun(after);
  } else {
    if (run.screen === 'battle' && run.battle && get(roundLogStore).length === 0) {
      roundLogStore.set(buildInitialBattleLogLines(run.battle));
    }
    syncCoachOnBattleStart(run);
  }
  viewStore.set('game');
}

export function startNewRun(teamId: TeamId): void {
  const meta = get(metaStore);
  if (!isTeamUnlocked(meta, teamId)) {
    fx('error');
    return;
  }
  skipBattleAnimation();
  fx('confirm');
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0;
  const run = createRun(teamId, seed || 12345, { tutorial: !meta.tutorialSeen });
  roundLogStore.set([]);
  coachStepStore.set(null);
  cardDetailTarget.set(null);
  deckSheetMode.set(null);
  mapLegendOpen.set(false);
  commitRun(run);
  viewStore.set('game');
}

export function abandonAndRestart(): void {
  skipBattleAnimation();
  fx('confirm');
  removeKey(CRISIS_RUN_STORAGE_KEY);
  runStore.set(null);
  roundLogStore.set([]);
  coachStepStore.set(null);
  cardDetailTarget.set(null);
  deckSheetMode.set(null);
  mapLegendOpen.set(false);
  settingsOpen.set(false);
  viewStore.set('team-select');
}

export function dismissCoachStep(): void {
  fx('tap');
  const cur = get(coachStepStore);
  if (cur === null) return;
  if (cur >= 4) {
    coachStepStore.set(null);
    const m = get(metaStore);
    if (!m.tutorialSeen) persistMeta({ ...m, tutorialSeen: true });
  } else {
    coachStepStore.set(cur + 1);
  }
}

export function updateMetaSettings(patch: Partial<Pick<CrisisMetaState, 'speed' | 'sound' | 'haptics'>>): void {
  const m = get(metaStore);
  persistMeta({ ...m, ...patch });
  fx('select');
}

export function launchMapNode(nodeId: string): void {
  const run = get(runStore);
  if (!run || run.screen !== 'map') return;
  fx('confirm');
  mapLegendOpen.set(false);
  const next = enterNode(run, nodeId);
  if (next.screen === 'battle' && next.battle) {
    roundLogStore.set(buildInitialBattleLogLines(next.battle));
  }
  commitRun(next);
  syncCoachOnBattleStart(next);
}

export function performBattleAction(action: PlayerAction): void {
  const run = get(runStore);
  if (!run || run.screen !== 'battle' || !run.battle) return;

  const beforeBattle: BattleState = structuredClone(run.battle);
  const { run: nextRun, events } = applyRunBattleAction(run, action);

  const newLogs = formatBattleLogLines(beforeBattle, events);
  if (newLogs.length > 0) {
    roundLogStore.update((prev) => [...newLogs.reverse(), ...prev].slice(0, 40));
  }

  // Advance tutorial coach automatically when matching actions occur
  const coach = get(coachStepStore);
  if (coach === 0 && action.type === 'chooseSupply') {
    coachStepStore.set(1);
  } else if (coach === 1 && (action.type === 'playUnit' || action.type === 'playAction')) {
    coachStepStore.set(2);
  } else if (coach !== null && action.type === 'endRound') {
    coachStepStore.set(null);
    const m = get(metaStore);
    if (!m.tutorialSeen) persistMeta({ ...m, tutorialSeen: true });
  }

  if (action.type === 'endRound') {
    fx('endTurn');
    commitRun(nextRun);
    const speed = get(metaStore).speed;
    void replayBattleResolution(beforeBattle, events, speed, () => {
      const latest = get(runStore);
      if (latest && latest.screen === 'battle' && latest.battle?.phase === 'ended') {
        const finished = finishBattle(latest);
        commitRun(finished);
      }
    });
    return;
  }

  if (action.type === 'chooseSupply') {
    fx('select');
  } else if (action.type === 'withdrawUnit') {
    fx('tap');
  } else if (action.type === 'moveUnit') {
    fx('select');
  } else {
    fx('confirm');
    if (action.lane !== undefined) {
      for (const ev of events) {
        if (ev.t === 'heal') triggerQuickSlotPopup('player', ev.lane, `+${ev.amount}`, 'pos');
        if (ev.t === 'destroyed' && ev.lane === 'queue') {
          triggerQuickSlotPopup('queue', action.lane, 'حظر', 'accent');
        }
      }
    }
  }

  commitRun(nextRun);
}

export function pickBattleReward(cardUid: string | null): void {
  const run = get(runStore);
  if (!run || run.screen !== 'reward') return;
  fx(cardUid ? 'confirm' : 'tap');
  commitRun(chooseReward(run, cardUid));
}

export function pickRecruitUnit(cardUid: string | null): void {
  const run = get(runStore);
  if (!run || run.screen !== 'recruit') return;
  fx(cardUid ? 'confirm' : 'tap');
  commitRun(chooseRecruit(run, cardUid));
}

export function applyTrainChoice(cardUid: string | null, upgradeIndex: 0 | 1 = 0): void {
  const run = get(runStore);
  if (!run || run.screen !== 'train') return;
  fx(cardUid ? 'good' : 'tap');
  commitRun(chooseTrain(run, cardUid, upgradeIndex));
}

export function applyRestChoice(choice: { kind: 'heal' } | { kind: 'remove'; cardUid: string }): void {
  const run = get(runStore);
  if (!run || run.screen !== 'rest') return;
  fx('good');
  commitRun(chooseRest(run, choice));
}

export function purchaseMarketSlot(slotId: string): void {
  const run = get(runStore);
  if (!run || run.screen !== 'market') return;
  fx('good');
  commitRun(buyMarketCard(run, slotId));
}

export function purchaseMarketRemove(cardUid: string): void {
  const run = get(runStore);
  if (!run || run.screen !== 'market') return;
  fx('confirm');
  commitRun(buyMarketRemove(run, cardUid));
}

export function purchaseMarketLife(): void {
  const run = get(runStore);
  if (!run || run.screen !== 'market') return;
  fx('good');
  commitRun(buyMarketLife(run));
}

export function exitMarketNode(): void {
  const run = get(runStore);
  if (!run || run.screen !== 'market') return;
  fx('tap');
  commitRun(leaveMarket(run));
}

export function pickEventChoice(choiceIndex: 0 | 1): void {
  const run = get(runStore);
  if (!run || run.screen !== 'event') return;
  fx('confirm');
  commitRun(chooseEventOption(run, choiceIndex));
}

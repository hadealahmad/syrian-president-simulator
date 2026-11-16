import type {
  ActNumber,
  BattleState,
  BossId,
  CategoryGlyphKey,
  CategoryId,
  CrisisTraitId,
  DeckCard,
  GlyphKey,
  ModifierId,
  PlayerTraitId,
  TeamId,
  UiGlyphKey,
} from './types';
import type { RngState } from '../../shared/rng';

export type NodeType =
  | 'battle'
  | 'elite'
  | 'recruit'
  | 'train'
  | 'rest'
  | 'market'
  | 'event'
  | 'boss';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  name: string;
  glyph: UiGlyphKey;
  modifier?: ModifierId;
  nextIds: string[];
  visited: boolean;
}

export interface ActMap {
  act: ActNumber;
  name: string;
  bossId: BossId;
  rows: MapNode[][];
  nodes: Record<string, MapNode>;
  bossNodeId: string;
}

export type TrainUpgrade =
  | { kind: 'power'; label: string; amount: 1 }
  | { kind: 'health'; label: string; amount: 2 }
  | { kind: 'trait'; label: string; trait: PlayerTraitId };

export interface MarketItem {
  slotId: string;
  card: DeckCard;
  price: number;
  sold: boolean;
}

export interface MarketState {
  items: MarketItem[];
  removePrice: number;
  removeUsed: boolean;
  lifePrice: number;
  lifeAvailable: boolean;
}

export interface RewardState {
  grantsEarned: number;
  overflowGrants: number;
  cards: DeckCard[];
  isBossReward: boolean;
}

export interface RecruitState {
  units: DeckCard[];
}

export interface TrainState {
  offers: Record<string, [TrainUpgrade, TrainUpgrade]>;
}

export interface ActiveEventState {
  eventId: string;
}

export type EventOutcome =
  | { kind: 'grants'; delta: number }
  | { kind: 'life'; delta: number }
  | { kind: 'addCards'; defIds: string[] }
  | { kind: 'addRandomRareUnit' }
  | { kind: 'upgradeRandomUnit' }
  | { kind: 'removeRandomCurseOrCard' };

export interface EventChoiceDef {
  label: string;
  outcomes: EventOutcome[];
  requireGrants?: number;
}

export interface EventDef {
  id: string;
  name: string;
  glyph: GlyphKey;
  text: string;
  choices: [EventChoiceDef, EventChoiceDef];
}

export interface ModifierDef {
  id: ModifierId;
  name: string;
  glyph: GlyphKey;
  description: string;
}

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  glyph: CategoryGlyphKey;
}

export interface TraitMeta {
  id: PlayerTraitId | CrisisTraitId;
  side: 'player' | 'crisis';
  name: string;
  glyph: PlayerTraitId | CrisisTraitId;
  description: string;
}

export interface ActMeta {
  act: ActNumber;
  name: string;
  flavour: CategoryId;
  bossId: BossId;
}

export interface TeamDef {
  id: TeamId;
  name: string;
  glyph: GlyphKey;
  unlockRule: string;
  description: string;
  starterCardIds: string[];
}

export type CoachMoment = 'supply' | 'playCard' | 'queueRow' | 'preview' | 'endRound';

export interface TutorialStep {
  id: string;
  moment: CoachMoment;
  targetElement: 'supply-sheet' | 'hand-and-player-line' | 'queue-row' | 'gauge-preview' | 'end-round-btn';
  glyph: GlyphKey;
  text: string;
}

export interface RunSummary {
  won: boolean;
  kicker: string;
  title: string;
  paragraph: string;
  actsCleared: number;
  battlesWon: number;
  deckSize: number;
  grantsEarned: number;
}

export type RunScreen =
  | 'map'
  | 'battle'
  | 'reward'
  | 'recruit'
  | 'train'
  | 'rest'
  | 'market'
  | 'event'
  | 'ended';

export interface RunState {
  rng: RngState;
  teamId: TeamId;
  act: ActNumber;
  lives: number;
  maxLives: number;
  grants: number;
  totalGrantsEarned: number;
  battlesWon: number;
  actsCleared: number;
  deck: DeckCard[];
  nextCardUid: number;
  map: ActMap;
  currentNodeId: string | null;
  activeNodeId: string | null;
  screen: RunScreen;
  isTutorialRun: boolean;
  tutorialCompleted: boolean;
  seenEventIds: string[];
  marketLifeBought: boolean;
  battle?: BattleState;
  reward?: RewardState;
  recruit?: RecruitState;
  train?: TrainState;
  market?: MarketState;
  activeEvent?: ActiveEventState;
  lastEventResult?: string;
  summary?: RunSummary;
}

export interface CrisisMetaState {
  version: 1;
  unlockedTeams: TeamId[];
  tutorialSeen: boolean;
  runsPlayed: number;
  runsWon: number;
  highestActReached: ActNumber;
  speed: 'normal' | 'fast';
  sound: boolean;
  haptics: boolean;
}

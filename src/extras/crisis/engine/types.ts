import type { RngState } from '../../shared/rng';

export type UnitGlyphKey =
  | 'volunteers'
  | 'committee'
  | 'medic'
  | 'teacher'
  | 'radio'
  | 'returnee'
  | 'union'
  | 'technician'
  | 'generator'
  | 'grid-engineer'
  | 'solar'
  | 'substation'
  | 'emergency-crew'
  | 'baker'
  | 'farmer'
  | 'flour-convoy'
  | 'silo'
  | 'cooperative'
  | 'mill'
  | 'watchtower'
  | 'patrol'
  | 'community-police'
  | 'border-unit'
  | 'investigator'
  | 'containment'
  | 'money-changer'
  | 'auditor'
  | 'tax-collector'
  | 'dev-fund'
  | 'credit-bank'
  | 'central-bank';

export type ActionGlyphKey =
  | 'boost'
  | 'evacuate'
  | 'repair'
  | 'redeploy'
  | 'early-warning'
  | 'emergency-funds'
  | 'ban'
  | 'delay'
  | 'mobilize';

export type CurseGlyphKey = 'red-tape' | 'old-debt';

export type CrisisGlyphKey =
  | 'rumor'
  | 'crowding'
  | 'strike'
  | 'hotspot'
  | 'fault'
  | 'outage'
  | 'overload'
  | 'cable-theft'
  | 'snowstorm'
  | 'fuel-shortage'
  | 'bread-queue'
  | 'locusts'
  | 'flour-monopoly'
  | 'drought'
  | 'flour-smuggling'
  | 'black-market'
  | 'speculation'
  | 'market-panic'
  | 'corruption'
  | 'capital-flight'
  | 'debt-due'
  | 'hyperinflation'
  | 'smuggling-ring'
  | 'unrest';

export type BossGlyphKey = 'blackout' | 'profiteer' | 'spiral';

export type PlayerTraitId =
  | 'watch'
  | 'split'
  | 'shield'
  | 'inspire'
  | 'income'
  | 'promote'
  | 'decisive'
  | 'mobile'
  | 'return'
  | 'solidarity'
  | 'warn'
  | 'thorns'
  | 'aid';

export type CrisisTraitId =
  | 'sneak'
  | 'grow'
  | 'spread'
  | 'harden'
  | 'smuggle'
  | 'erode'
  | 'rally';

export type UiGlyphKey =
  | 'power'
  | 'health'
  | 'cost'
  | 'gauge'
  | 'life'
  | 'grants'
  | 'deck'
  | 'discard'
  | 'node-battle'
  | 'node-elite'
  | 'node-recruit'
  | 'node-train'
  | 'node-rest'
  | 'node-market'
  | 'node-event'
  | 'node-boss'
  | 'node-start';

export type CategoryGlyphKey =
  | 'cat-energy'
  | 'cat-food'
  | 'cat-security'
  | 'cat-money'
  | 'cat-society';

export type GlyphKey =
  | UnitGlyphKey
  | ActionGlyphKey
  | CurseGlyphKey
  | CrisisGlyphKey
  | BossGlyphKey
  | PlayerTraitId
  | CrisisTraitId
  | UiGlyphKey
  | CategoryGlyphKey;

export type CategoryId = 'energy' | 'food' | 'security' | 'money' | 'society';
export type Rarity = 'token' | 'common' | 'uncommon' | 'rare' | 'curse';
export type CardKind = 'unit' | 'action' | 'curse';
export type LaneIndex = 0 | 1 | 2 | 3;
export type ActNumber = 1 | 2 | 3;
export type ModifierId = 'fog' | 'tight-budget' | 'popular-support' | 'surge' | 'shortage';
export type BossId = 'blackout' | 'profiteer' | 'spiral';
export type TeamId = 'rescue' | 'development' | 'resolve';

export type ActionTargetKind = 'none' | 'ally' | 'damaged-ally' | 'redeploy' | 'queue' | 'delay-crisis';

export interface PlayerCardDef {
  id: string;
  kind: CardKind;
  name: string;
  glyph: UnitGlyphKey | ActionGlyphKey | CurseGlyphKey;
  category: CategoryId;
  rarity: Rarity;
  cost: number;
  power?: number;
  health?: number;
  traits?: PlayerTraitId[];
  target?: ActionTargetKind;
  playable: boolean;
  description: string;
}

export interface CrisisDef {
  id: string;
  name: string;
  glyph: CrisisGlyphKey;
  category: CategoryId;
  acts: ActNumber[];
  power: number;
  health: number;
  traits: CrisisTraitId[];
  threat: number;
  isToken?: boolean;
  isElite?: boolean;
  description: string;
}

export interface BossDef {
  id: BossId;
  act: ActNumber;
  name: string;
  glyph: BossGlyphKey;
  category: CategoryId;
  phase1: { power: number; health: number; rule: string };
  phase2: { power: number; health: number; rule: string };
}

export interface DeckCard {
  uid: string;
  defId: string;
  powerBonus: number;
  healthBonus: number;
  addedTrait?: PlayerTraitId;
  isToken?: boolean;
}

export interface UnitInstance {
  uid: string;
  defId: string;
  name: string;
  glyph: UnitGlyphKey;
  category: CategoryId;
  power: number;
  tempPower: number;
  health: number;
  maxHealth: number;
  traits: PlayerTraitId[];
  shieldUsedThisRound: boolean;
  movedThisRound: boolean;
  promoted: boolean;
  sourceCard: DeckCard;
}

export interface CrisisInstance {
  uid: string;
  defId: string;
  name: string;
  glyph: CrisisGlyphKey | BossGlyphKey;
  category: CategoryId;
  power: number;
  health: number;
  maxHealth: number;
  traits: CrisisTraitId[];
  hardenUsedThisRound: boolean;
  lastSpreadRound?: number;
  isBoss?: boolean;
  bossPhase?: 1 | 2;
}

export interface WaveEntry {
  defId: string;
  preferredLane?: LaneIndex;
}

export interface EncounterSpec {
  act: ActNumber;
  kind: 'tutorial' | 'battle' | 'elite' | 'boss';
  modifier?: ModifierId;
  bossId?: BossId;
  openingFront: Array<{ lane: LaneIndex; defId: string }>;
  openingQueue: Array<{ lane: LaneIndex; defId: string }>;
  waves: string[][];
}

export type BattlePhase = 'supply' | 'play' | 'ended';
export type BattleResult = 'win' | 'loss';

export interface BattleState {
  rng: RngState;
  round: number;
  phase: BattlePhase;
  balance: number;
  budget: number;
  playerLine: Array<UnitInstance | null>;
  crisisLine: Array<CrisisInstance | null>;
  queue: Array<CrisisInstance | null>;
  plannedWave: Array<string | null>;
  remainingWaves: string[][];
  drawPile: DeckCard[];
  hand: DeckCard[];
  discardPile: DeckCard[];
  supplyOptions: DeckCard[];
  darkLanes: LaneIndex[];
  forecastRevealed: boolean;
  modifier?: ModifierId;
  bossId?: BossId;
  bossPhase?: 1 | 2;
  bossPhase2Rounds: number;
  kind: EncounterSpec['kind'];
  act: ActNumber;
  nextUid: number;
  result?: BattleResult;
  overflow: number;
}

export type PlayerAction =
  | { type: 'chooseSupply'; index: number }
  | { type: 'playUnit'; handUid: string; lane: LaneIndex }
  | { type: 'playAction'; handUid: string; lane?: LaneIndex; toLane?: LaneIndex }
  | { type: 'moveUnit'; fromLane: LaneIndex; toLane: LaneIndex }
  | { type: 'withdrawUnit'; lane: LaneIndex }
  | { type: 'endRound' };

export type BattleEvent =
  | { t: 'phase'; phase: 'playerAttacks' | 'crisisAttacks' | 'advance' | 'plan' | 'endOfRound' | 'newRound' }
  | { t: 'income'; amount: number; budget: number }
  | { t: 'supply'; options: DeckCard[] }
  | { t: 'supplyPicked'; card: DeckCard }
  | { t: 'cardPlayed'; card: DeckCard; lane?: LaneIndex; toLane?: LaneIndex; cost: number }
  | { t: 'unitMoved'; fromLane: LaneIndex; toLane: LaneIndex; swapped?: boolean }
  | { t: 'unitWithdrawn'; lane: LaneIndex; uid: string }
  | { t: 'attack'; side: 'player' | 'crisis'; lane: LaneIndex; targetLane: LaneIndex; target: 'unit' | 'gauge'; dmg: number; expertise?: boolean }
  | { t: 'damage'; side: 'player' | 'crisis'; lane: LaneIndex; dmg: number; hp: number }
  | { t: 'heal'; side: 'player' | 'crisis'; lane: LaneIndex; amount: number; hp: number }
  | { t: 'destroyed'; side: 'player' | 'crisis'; lane: LaneIndex | 'queue'; cardId: string; uid: string; returnedToHand?: boolean }
  | { t: 'gauge'; from: number; to: number; delta: number }
  | { t: 'advance'; lane: LaneIndex; cardId: string; uid: string }
  | { t: 'queue'; lane: LaneIndex; cardId: string; uid: string; hidden: boolean }
  | { t: 'delayed'; lane: LaneIndex; cardId: string; uid: string }
  | { t: 'trait'; side: 'player' | 'crisis'; lane: LaneIndex; trait: PlayerTraitId | CrisisTraitId }
  | { t: 'bossPhase'; bossId: BossId; phase: 2 }
  | { t: 'stalemate'; round: number }
  | { t: 'battleEnd'; result: BattleResult; overflow: number };

export interface SlotPreview {
  damageTaken: number;
  destroyed: boolean;
  effectivePower: number;
  expertiseActive: boolean;
}

export interface RoundPreview {
  projectedBalance: number;
  playerSlots: [SlotPreview, SlotPreview, SlotPreview, SlotPreview];
  crisisSlots: [SlotPreview, SlotPreview, SlotPreview, SlotPreview];
  lanePlayerGaugeHits: [number, number, number, number];
  laneCrisisGaugeHits: [number, number, number, number];
  wouldEnd: boolean;
  wouldResult?: BattleResult;
  wouldTriggerBossPhase2: boolean;
}

export type QueueSlotView =
  | { status: 'empty'; laneDark: boolean }
  | { status: 'hidden'; laneDark: true }
  | { status: 'visible'; laneDark: false; crisis: CrisisInstance };

export type ForecastSlotView =
  | { status: 'empty' }
  | { status: 'hidden' }
  | { status: 'silhouette'; category: CategoryId; glyph: CategoryGlyphKey }
  | { status: 'revealed'; defId: string; name: string; glyph: CrisisGlyphKey; category: CategoryId; power: number; health: number; traits: CrisisTraitId[] };

export * from './run-types';

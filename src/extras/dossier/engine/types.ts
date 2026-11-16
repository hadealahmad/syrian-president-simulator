import type { RngState } from '../../shared/rng';

export type MeterId = 'treasury' | 'trust' | 'security' | 'sovereignty';

export const METER_IDS: readonly MeterId[] = [
  'treasury',
  'trust',
  'security',
  'sovereignty',
] as const;

export const METER_LABELS: Record<MeterId, string> = {
  treasury: 'الخزينة',
  trust: 'الثقة',
  security: 'الأمن',
  sovereignty: 'السيادة',
};

export type SeasonId = 'H1_HARVEST' | 'H2_WINTER';

export interface Condition {
  minTurn?: number;
  maxTurn?: number;
  season?: SeasonId;
  requireFlags?: string[];
  forbidFlags?: string[];
  requireDecrees?: string[];
  forbidDecrees?: string[];
  minMeter?: Partial<Record<MeterId, number>>;
  maxMeter?: Partial<Record<MeterId, number>>;
  anyMeterAtLeast?: number;
}

export interface Answer {
  label: string;      // imperative verb + object, ≤ 34 characters
  result: string;     // past-tense headline, ≤ 80 characters
  effects: Partial<Record<MeterId, number>>;
  decree?: string;    // starts a standing decree
  endDecree?: string; // ends a standing decree
  setFlags?: string[];
  followUp?: { id: string; delay: number };
}

export interface DossierCard {
  id: string;
  kind: 'deck' | 'followup' | 'overreach';
  from: string;       // in-world sender, ≤ 26 characters
  title: string;      // ≤ 46 characters, no final punctuation
  text: string;       // 1–2 sentences, ≤ 150 characters
  tags: string[];
  weight: number;
  when?: Condition;
  right: Answer;      // drag right
  left: Answer;       // drag left
}

export interface StandingDecree {
  id: string;
  name: string;       // ≤ 20 characters
  drift: Partial<Record<MeterId, number>>;
}

export type EndingKind = 'collapse' | 'term';

export type EndingId =
  | 'collapse_paralysis'
  | 'collapse_treasury'
  | 'collapse_trust'
  | 'collapse_security'
  | 'collapse_sovereignty'
  | 'term_phoenix'
  | 'term_mortgaged'
  | 'term_garrison'
  | 'term_desert'
  | 'term_hollow';

export interface EndingDef {
  id: EndingId;
  kind: EndingKind;
  title: string;
  subtitle: string;
  narrative: string;
}

export interface MeterSnapshot {
  turn: number;
  year: number;
  treasury: number;
  trust: number;
  security: number;
  sovereignty: number;
}

export interface QueuedFollowUp {
  id: string;
  dueAtFile: number;
}

export interface LastOutcome {
  cardId: string;
  side: 'right' | 'left';
  headline: string;
  deltas: Record<MeterId, number>;
}

export interface DossierRunMeta {
  runId: string;
  startedAt: number;
  minMeterEver: number;
  overreachAnswered: number;
  everHadDecree: boolean;
  recorded: boolean;
}

export interface DossierState {
  version: 1;
  rng: RngState;
  turn: number;
  maxTurns: number;
  fileInTurn: 1 | 2;
  filesResolved: number;
  year: number;
  season: SeasonId;
  meters: Record<MeterId, number>;
  postponesLeft: number;
  decrees: string[];
  flags: Record<string, boolean>;
  followUps: QueuedFollowUp[];
  drawnIds: string[];
  postponedId: string | null;
  lastTag: string | null;
  lastOutcome: LastOutcome | null;
  history: MeterSnapshot[];
  currentCardId: string | null;
  isGameOver: boolean;
  endingId: EndingId | null;
  runMeta?: DossierRunMeta;
}


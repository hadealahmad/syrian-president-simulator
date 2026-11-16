import type { Readable } from 'svelte/store';

export type AchievementGroup = 'ending' | 'turns' | 'special';
export type AchievementDifficulty = 1 | 2 | 3;

/** Known GameIcon glyph names, with open string fallback for forward compatibility. */
export type RecordGlyphName =
  | 'hourglass'
  | 'crown-coin'
  | 'money-stack'
  | 'coins'
  | 'wallet'
  | 'banknote'
  | 'trade'
  | 'meeple-group'
  | 'scales'
  | 'abacus'
  | 'blindfold'
  | 'crowned-heart'
  | 'stone-throne'
  | 'flame'
  | 'expand'
  | 'contract'
  | 'plain-arrow'
  | 'return-arrow'
  | 'cycle'
  | 'help'
  | 'cross-mark'
  | 'check-mark'
  | 'power-button'
  | 'checked-shield'
  | 'minefield'
  | 'damaged-house'
  | 'broken-wall'
  | 'stone-wall'
  | 'brick-wall'
  | 'power-generator'
  | 'siren'
  | 'scroll-quill'
  | 'open-treasure-chest'
  | 'vote'
  | 'chart'
  | 'castle'
  | 'gavel'
  | 'gear'
  | 'key'
  | 'barrier'
  | 'camping-tent'
  | 'megaphone'
  | 'podium'
  | 'emotion-happy-fill'
  | 'emotion-normal-fill'
  | 'emotion-sad-fill'
  | 'palette'
  | 'download'
  | 'arrow-right'
  | 'brand-github'
  | 'brand-x'
  | 'brand-youtube'
  | 'bell'
  | 'more'
  | 'lock'
  | 'filter'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | (string & {});

export interface AchievementDef {
  id: string;
  group: AchievementGroup;
  title: string;
  description: string;
  glyph: RecordGlyphName;
  /** Show «إنجاز مخفي» and «؟» until unlocked. */
  hidden?: boolean;
  difficulty: AchievementDifficulty;
}

export interface UnlockedEntry {
  /** Epoch milliseconds when first unlocked. */
  at: number;
  runId?: string;
}

export type UnlockedMap = Record<string, UnlockedEntry>;

export type RunOutcome = 'collapse' | 'complete';

export interface RunRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  turns: number;
  maxTurns: number;
  resultId: string;
  resultTitle: string;
  outcome: RunOutcome;
  score: number;
  details?: Record<string, number | string>;
}

export type RecordsTab = 'achievements' | 'runs';

export type RecordsStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface CreateRecordsStoreOptions {
  /** Optional injected storage for tests; defaults to window.localStorage when available. */
  storage?: RecordsStorageLike | null;
  /** Optional clock override for deterministic tests; defaults to Date.now. */
  now?: () => number;
}

export interface RecordsStore {
  readonly namespace: string;
  readonly unlocked: Readable<UnlockedMap>;
  readonly runs: Readable<RunRecord[]>;
  readonly counters: Readable<Record<string, number>>;
  /** Newly unlocked achievement ids queued for toast presentation. */
  readonly toastQueue: Readable<string[]>;
  /** Unlock an achievement; returns true only on first unlock. */
  unlock: (id: string, runId?: string) => boolean;
  isUnlocked: (id: string) => boolean;
  getUnlockedSnapshot: () => UnlockedMap;
  /** Append or deduplicate a finished run, retaining the latest 100 runs. Returns true if added. */
  addRun: (run: RunRecord) => boolean;
  getRunsSnapshot: () => RunRecord[];
  /** Return up to n runs sorted by score desc, then endedAt desc. */
  topRuns: (n?: number) => RunRecord[];
  /** Return 1-based rank if runId is within topRuns(limit), otherwise null. */
  getRunRank: (runId: string, limit?: number) => number | null;
  /** Read a persisted lifetime counter (defaults to 0). */
  getCounter: (key: string) => number;
  /** Add delta to a persisted lifetime counter and return the new value. */
  incrementCounter: (key: string, delta?: number) => number;
  /** Remove the first occurrence (or matching id) from toastQueue. */
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  /** Re-read state from underlying storage. */
  reload: () => void;
}

import { writable } from 'svelte/store';
import type {
  CreateRecordsStoreOptions,
  RecordsStorageLike,
  RecordsStore,
  RunRecord,
  UnlockedEntry,
  UnlockedMap,
} from './types';

const MAX_STORED_RUNS = 100;

export function getAchievementsStorageKey(namespace: string): string {
  return `records-${namespace}-achievements-v1`;
}

export function getRunsStorageKey(namespace: string): string {
  return `records-${namespace}-runs-v1`;
}

export function getCountersStorageKey(namespace: string): string {
  return `records-${namespace}-counters-v1`;
}

function resolveStorage(explicit?: RecordsStorageLike | null): RecordsStorageLike | null {
  if (explicit !== undefined) return explicit;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage ?? null;
    }
  } catch {
    // Accessing localStorage can throw SecurityError in restricted contexts.
  }
  return null;
}

function safeReadJson(storage: RecordsStorageLike | null, key: string): unknown {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWriteJson(storage: RecordsStorageLike | null, key: string, value: unknown): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Never throw on quota exceeded or disabled storage.
  }
}

function sanitizeUnlockedMap(raw: unknown): UnlockedMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: UnlockedMap = {};
  for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !val || typeof val !== 'object' || Array.isArray(val)) continue;
    const entry = val as Record<string, unknown>;
    const at = typeof entry.at === 'number' && Number.isFinite(entry.at) ? entry.at : 0;
    const clean: UnlockedEntry = { at };
    if (typeof entry.runId === 'string' && entry.runId.length > 0) {
      clean.runId = entry.runId;
    }
    result[id] = clean;
  }
  return result;
}

function sanitizeRunRecord(raw: unknown): RunRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  if (typeof r.resultId !== 'string' || typeof r.resultTitle !== 'string') return null;
  if (r.outcome !== 'collapse' && r.outcome !== 'complete') return null;

  const num = (v: unknown, fallback = 0): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  let details: Record<string, number | string> | undefined;
  if (r.details && typeof r.details === 'object' && !Array.isArray(r.details)) {
    const cleanDetails: Record<string, number | string> = {};
    for (const [k, dv] of Object.entries(r.details as Record<string, unknown>)) {
      if (typeof dv === 'string') cleanDetails[k] = dv;
      else if (typeof dv === 'number' && Number.isFinite(dv)) cleanDetails[k] = dv;
    }
    details = cleanDetails;
  }

  return {
    id: r.id,
    startedAt: num(r.startedAt, 0),
    endedAt: num(r.endedAt, 0),
    turns: Math.max(0, Math.floor(num(r.turns, 0))),
    maxTurns: Math.max(1, Math.floor(num(r.maxTurns, 1))),
    resultId: r.resultId,
    resultTitle: r.resultTitle,
    outcome: r.outcome,
    score: num(r.score, 0),
    ...(details ? { details } : {}),
  };
}

function sanitizeRunsList(raw: unknown): RunRecord[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const valid: RunRecord[] = [];
  for (const item of raw) {
    const rec = sanitizeRunRecord(item);
    if (!rec || seen.has(rec.id)) continue;
    seen.add(rec.id);
    valid.push(rec);
  }
  return trimLatestRuns(valid);
}

function sanitizeCounters(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k] = v;
    }
  }
  return out;
}

/** Keep at most MAX_STORED_RUNS runs, preferring the most recently ended runs. */
function trimLatestRuns(list: RunRecord[]): RunRecord[] {
  return [...list]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => b.item.endedAt - a.item.endedAt || a.idx - b.idx)
    .slice(0, MAX_STORED_RUNS)
    .map((entry) => entry.item);
}

/** Sort runs by score desc, then endedAt desc. */
export function sortTopRuns(list: readonly RunRecord[], n = 10): RunRecord[] {
  const limit = Math.max(0, Math.floor(n));
  if (limit === 0) return [];
  return [...list]
    .sort((a, b) => b.score - a.score || b.endedAt - a.endedAt)
    .slice(0, limit);
}

export function createRecordsStore(
  namespace: string,
  options?: CreateRecordsStoreOptions
): RecordsStore {
  const achKey = getAchievementsStorageKey(namespace);
  const runsKey = getRunsStorageKey(namespace);
  const countersKey = getCountersStorageKey(namespace);
  const clock = options?.now ?? (() => Date.now());
  const getStore = () => resolveStorage(options?.storage);

  let unlockedState: UnlockedMap = sanitizeUnlockedMap(safeReadJson(getStore(), achKey));
  let runsState: RunRecord[] = sanitizeRunsList(safeReadJson(getStore(), runsKey));
  let countersState: Record<string, number> = sanitizeCounters(
    safeReadJson(getStore(), countersKey)
  );
  let queueState: string[] = [];

  const unlockedStore = writable<UnlockedMap>(unlockedState);
  const runsStore = writable<RunRecord[]>(runsState);
  const countersStore = writable<Record<string, number>>(countersState);
  const toastQueueStore = writable<string[]>(queueState);

  function reload(): void {
    const st = getStore();
    unlockedState = sanitizeUnlockedMap(safeReadJson(st, achKey));
    runsState = sanitizeRunsList(safeReadJson(st, runsKey));
    countersState = sanitizeCounters(safeReadJson(st, countersKey));
    unlockedStore.set(unlockedState);
    runsStore.set(runsState);
    countersStore.set(countersState);
  }

  function unlock(id: string, runId?: string): boolean {
    if (!id || unlockedState[id]) return false;
    const entry: UnlockedEntry = {
      at: clock(),
      ...(runId ? { runId } : {}),
    };
    unlockedState = { ...unlockedState, [id]: entry };
    unlockedStore.set(unlockedState);
    safeWriteJson(getStore(), achKey, unlockedState);

    if (!queueState.includes(id)) {
      queueState = [...queueState, id];
      toastQueueStore.set(queueState);
    }
    return true;
  }

  function isUnlocked(id: string): boolean {
    return Boolean(unlockedState[id]);
  }

  function addRun(run: RunRecord): boolean {
    const clean = sanitizeRunRecord(run);
    if (!clean) return false;
    if (runsState.some((existing) => existing.id === clean.id)) {
      return false;
    }
    runsState = trimLatestRuns([clean, ...runsState]);
    runsStore.set(runsState);
    safeWriteJson(getStore(), runsKey, runsState);
    return true;
  }

  function topRuns(n = 10): RunRecord[] {
    return sortTopRuns(runsState, n);
  }

  function getRunRank(runId: string, limit = 10): number | null {
    if (!runId) return null;
    const ranked = topRuns(limit);
    const idx = ranked.findIndex((r) => r.id === runId);
    return idx >= 0 ? idx + 1 : null;
  }

  function getCounter(key: string): number {
    return countersState[key] ?? 0;
  }

  function incrementCounter(key: string, delta = 1): number {
    if (!key || !Number.isFinite(delta) || delta === 0) {
      return getCounter(key);
    }
    const nextVal = Math.max(0, (countersState[key] ?? 0) + delta);
    countersState = { ...countersState, [key]: nextVal };
    countersStore.set(countersState);
    safeWriteJson(getStore(), countersKey, countersState);
    return nextVal;
  }

  function dismissToast(id: string): void {
    const idx = queueState.indexOf(id);
    if (idx < 0) return;
    queueState = [...queueState.slice(0, idx), ...queueState.slice(idx + 1)];
    toastQueueStore.set(queueState);
  }

  function clearToasts(): void {
    if (queueState.length === 0) return;
    queueState = [];
    toastQueueStore.set(queueState);
  }

  return {
    namespace,
    unlocked: { subscribe: unlockedStore.subscribe },
    runs: { subscribe: runsStore.subscribe },
    counters: { subscribe: countersStore.subscribe },
    toastQueue: { subscribe: toastQueueStore.subscribe },
    unlock,
    isUnlocked,
    getUnlockedSnapshot: () => ({ ...unlockedState }),
    addRun,
    getRunsSnapshot: () => [...runsState],
    topRuns,
    getRunRank,
    getCounter,
    incrementCounter,
    dismissToast,
    clearToasts,
    reload,
  };
}

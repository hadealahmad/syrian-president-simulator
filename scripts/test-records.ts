import assert from 'node:assert/strict';
import { get } from 'svelte/store';
import {
  createRecordsStore,
  formatDateAr,
  formatDurationAr,
  formatRunTimelineAr,
  formatTimeAr,
  getAchievementsStorageKey,
  getCountersStorageKey,
  getRunsStorageKey,
  type RecordsStorageLike,
  type RunRecord,
} from '../src/lib/records';

class FakeStorage implements RecordsStorageLike {
  public readonly map = new Map<string, string>();
  public throwOnWrite = false;
  public throwOnRead = false;

  getItem(key: string): string | null {
    if (this.throwOnRead) throw new Error('Simulated read failure');
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnWrite) throw new Error('QuotaExceededError');
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function makeRun(overrides: Partial<RunRecord> & { id: string }): RunRecord {
  return {
    startedAt: 1_763_316_240_000,
    endedAt: 1_763_318_820_000,
    turns: 20,
    maxTurns: 40,
    resultId: 'SOVEREIGN_INSOLVENCY',
    resultTitle: 'الإفلاس السيادي',
    outcome: 'collapse',
    score: 400,
    ...overrides,
  };
}

// 1. Unlock dedupe, toast queue, and persistence
{
  const storage = new FakeStorage();
  let fakeNow = 1_763_316_000_000;
  const store = createRecordsStore('unit', { storage, now: () => fakeNow });

  assert.equal(store.unlock('ach_1', 'run_a'), true, 'First unlock returns true');
  fakeNow += 50_000;
  assert.equal(store.unlock('ach_1', 'run_b'), false, 'Duplicate unlock returns false');
  assert.equal(store.unlock('ach_2'), true, 'Second distinct unlock returns true');

  assert.deepEqual(get(store.toastQueue), ['ach_1', 'ach_2'], 'Toast queue dedupes ids');
  store.dismissToast('ach_1');
  assert.deepEqual(get(store.toastQueue), ['ach_2'], 'dismissToast removes matching id');
  store.clearToasts();
  assert.deepEqual(get(store.toastQueue), [], 'clearToasts empties queue');

  // Verify raw localStorage keys and re-hydration
  assert.ok(storage.map.has(getAchievementsStorageKey('unit')));
  const reloaded = createRecordsStore('unit', { storage });
  const unlocked = get(reloaded.unlocked);
  assert.equal(unlocked.ach_1?.at, 1_763_316_000_000, 'Original unlock timestamp preserved');
  assert.equal(unlocked.ach_1?.runId, 'run_a', 'Original runId preserved');
  assert.equal(unlocked.ach_2?.at, 1_763_316_050_000);
  assert.equal(reloaded.unlock('ach_1'), false, 'Persisted unlock stays deduped after reload');
}

// 2. Run ranking (score desc, then endedAt desc), dedupe, and 100-run cap
{
  const storage = new FakeStorage();
  const store = createRecordsStore('runs-ns', { storage });

  const r1 = makeRun({ id: 'r1', score: 600, endedAt: 1000 });
  const r2 = makeRun({ id: 'r2', score: 1750, outcome: 'complete', turns: 40, endedAt: 900 });
  const r3 = makeRun({ id: 'r3', score: 600, endedAt: 2500 }); // tie score with r1, newer endedAt

  assert.equal(store.addRun(r1), true);
  assert.equal(store.addRun(r1), false, 'Duplicate run id is ignored');
  assert.equal(store.addRun(r2), true);
  assert.equal(store.addRun(r3), true);

  const top = store.topRuns(10);
  assert.deepEqual(
    top.map((r) => r.id),
    ['r2', 'r3', 'r1'],
    'topRuns sorts by score desc then endedAt desc'
  );
  assert.equal(store.getRunRank('r2'), 1);
  assert.equal(store.getRunRank('r3'), 2);
  assert.equal(store.getRunRank('r1'), 3);
  assert.equal(store.getRunRank('missing'), null);

  // Add 105 more runs -> total 108, capped to latest 100
  for (let i = 0; i < 105; i++) {
    store.addRun(
      makeRun({
        id: `bulk_${i}`,
        score: 100 + i,
        endedAt: 10_000 + i * 1000,
      })
    );
  }
  assert.equal(get(store.runs).length, 100, 'Stored runs capped at 100');
  assert.ok(storage.map.has(getRunsStorageKey('runs-ns')));

  const rehydrated = createRecordsStore('runs-ns', { storage });
  assert.equal(get(rehydrated.runs).length, 100, 'Rehydrated runs keep 100 cap');
  assert.equal(
    rehydrated.getRunsSnapshot().some((r) => r.id === 'bulk_104'),
    true,
    'Newest run kept'
  );
  assert.equal(
    rehydrated.getRunsSnapshot().some((r) => r.id === 'r2'),
    false,
    'Oldest runs trimmed past 100'
  );
}

// 3. Lifetime counters & storage error resilience
{
  const storage = new FakeStorage();
  const store = createRecordsStore('cnt', { storage });
  assert.equal(store.getCounter('lifetimeTurns'), 0);
  assert.equal(store.incrementCounter('lifetimeTurns', 10), 10);
  assert.equal(store.incrementCounter('lifetimeTurns', 15), 25);
  assert.ok(storage.map.has(getCountersStorageKey('cnt')));

  const reloaded = createRecordsStore('cnt', { storage });
  assert.equal(reloaded.getCounter('lifetimeTurns'), 25);

  // Corrupt JSON and throwing storage must never throw
  storage.map.set(getAchievementsStorageKey('corrupt'), '{bad json');
  storage.map.set(getRunsStorageKey('corrupt'), '{"not":"an array"}');
  const corruptStore = createRecordsStore('corrupt', { storage });
  assert.deepEqual(get(corruptStore.unlocked), {});
  assert.deepEqual(get(corruptStore.runs), []);

  storage.throwOnWrite = true;
  assert.doesNotThrow(() => {
    corruptStore.unlock('safe_ach');
    corruptStore.addRun(makeRun({ id: 'safe_run' }));
  });
}

// 4. Levantine Arabic date, time, and duration formatting
{
  const start = new Date(2026, 10, 16, 21, 4, 0).getTime(); // 16 Nov 2026, 21:04 local
  const endSameDay = new Date(2026, 10, 16, 21, 47, 0).getTime(); // 21:47 local (43m)
  const endNextDay = new Date(2026, 10, 17, 0, 19, 0).getTime(); // 17 Nov 2026, 00:19 (3h 15m)

  assert.equal(formatDateAr(start), '16 تشرين الثاني 2026');
  assert.equal(formatTimeAr(start), '21:04');
  assert.equal(formatDurationAr(35_000), '35 ثانية');
  assert.equal(formatDurationAr(43 * 60_000), '43 دقيقة');
  assert.equal(formatDurationAr(60 * 60_000), 'ساعة واحدة');
  assert.equal(formatDurationAr((3 * 60 + 15) * 60_000), '3 ساعات و15 دقيقة');

  assert.equal(
    formatRunTimelineAr(start, endSameDay),
    'بدأت 16 تشرين الثاني 2026 · 21:04 — انتهت 21:47 (43 دقيقة)'
  );
  assert.equal(
    formatRunTimelineAr(start, endNextDay),
    'بدأت 16 تشرين الثاني 2026 · 21:04 — انتهت 17 تشرين الثاني 2026 · 00:19 (3 ساعات و15 دقيقة)'
  );
}

console.log('✓ test-records: all store, dedupe, ranking, and formatting assertions passed.');

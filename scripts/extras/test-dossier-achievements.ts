import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { get } from 'svelte/store';
import { createRecordsStore, type RecordsStorageLike } from '../../src/lib/records';
import { ENDING_IDS } from '../../src/extras/dossier/content/endings';
import { DOSSIER_DECK } from '../../src/extras/dossier/content/index';
import {
  chooseAnswer,
  createGame,
  getCurrentCard,
  pickCarefulSide,
  postponeCard,
} from '../../src/extras/dossier/engine/engine';
import {
  METER_IDS,
  type DossierCard,
  type DossierState,
} from '../../src/extras/dossier/engine/types';
import { DOSSIER_ACHIEVEMENTS } from '../../src/extras/dossier/records/defs';
import {
  advanceDossierRunMeta,
  buildDossierRunRecord,
  computeDossierRunScore,
  createInitialDossierRunMeta,
  didCompleteDossierTurn,
  evaluateDossierAchievements,
  toDossierRunStats,
} from '../../src/extras/dossier/records/evaluate';
import {
  DOSSIER_TURNS_COUNTER_KEY,
  applyDossierRecordsTransition,
  attachFreshDossierRunMeta,
  hydrateLoadedDossierRunMeta,
} from '../../src/extras/dossier/records/store';

class MemoryStorage implements RecordsStorageLike {
  public readonly map = new Map<string, string>();
  getItem(k: string): string | null { return this.map.get(k) ?? null; }
  setItem(k: string, v: string): void { this.map.set(k, v); }
  removeItem(k: string): void { this.map.delete(k); }
}

const FORBIDDEN_PATTERNS: RegExp[] = [
  /اً/u, /(^|\s)تمّ?\s/u, /(^|\s)(قام|قامت|يقوم|تقوم)\s+ب/u, /تواجد/u,
  /أثّ?ر\s+على/u, /أجاب\s+على/u, /حيث\s+أن/u, /لعب\s+دور/u,
  /بالنسبة\s+ل/u, /ناهيك\s+عن/u, /(العام|الدور|الشهر|الأسبوع|الموسم|الفصل|القرن|العقد)\s+القادم/u,
];

// ─── 1. Static Definition & Arabic Style Validation ─────────────────────────
const gameIconSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/ui/GameIcon.svelte'), 'utf8');
const validGlyphs = new Set<string>();
for (const m of gameIconSrc.matchAll(/'([a-z0-9-]+)':\s*\{\s*body:/g)) validGlyphs.add(m[1]);

assert.equal(DOSSIER_ACHIEVEMENTS.length, 28, 'Expected 28 total dossier achievements');
const seenIds = new Set<string>();
let hiddenCount = 0;

for (const def of DOSSIER_ACHIEVEMENTS) {
  assert.ok(!seenIds.has(def.id), `Duplicate achievement id: ${def.id}`);
  seenIds.add(def.id);
  assert.ok(validGlyphs.has(def.glyph), `Unknown glyph "${def.glyph}" on ${def.id}`);
  assert.ok([1, 2, 3].includes(def.difficulty), `Invalid difficulty on ${def.id}`);
  assert.ok(!/[.!؟?،؛:…]\s*$/u.test(def.title), `Final punctuation on title: ${def.title}`);
  assert.ok(!/[.!؟?،؛:…]\s*$/u.test(def.description), `Final punctuation on desc: ${def.description}`);
  for (const re of FORBIDDEN_PATTERNS) {
    assert.ok(!re.test(def.title), `Arabic rule violation in title "${def.title}"`);
    assert.ok(!re.test(def.description), `Arabic rule violation in description "${def.description}"`);
  }
  if (def.hidden) hiddenCount += 1;
}
assert.equal(hiddenCount, 2, 'Expected 2 hidden special achievements');
console.log(`✓ Validated ${DOSSIER_ACHIEVEMENTS.length} DOSSIER_ACHIEVEMENTS definitions, glyphs, and Arabic rules.`);

// ─── 2. Unit-Check Evaluator for Every ID + Score & Dedupe Rules ────────────
{
  const base = createGame(DOSSIER_DECK, 42);
  const baseStats = { minMeterEver: 50, overreachAnswered: 0, everHadDecree: false, lifetimeTurns: 0 };

  for (const endId of ENDING_IDS) {
    const s = JSON.parse(JSON.stringify(base)) as DossierState;
    s.isGameOver = true;
    s.endingId = endId;
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes(`end_${endId}`));
  }

  for (const [turn, id] of [[10, 'turns_run_10'], [20, 'turns_run_20'], [30, 'turns_run_30']] as const) {
    const s = JSON.parse(JSON.stringify(base)) as DossierState;
    s.turn = turn;
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes(id), `Missing ${id}`);
  }
  {
    const s = JSON.parse(JSON.stringify(base)) as DossierState;
    s.turn = 40;
    s.isGameOver = true;
    s.endingId = 'term_hollow';
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes('turns_run_40'));
  }
  for (const [life, id] of [[100, 'turns_life_100'], [250, 'turns_life_250'], [500, 'turns_life_500']] as const) {
    assert.ok(evaluateDossierAchievements(base, base, { ...baseStats, lifetimeTurns: life }).includes(id));
  }

  {
    const s = JSON.parse(JSON.stringify(base)) as DossierState;
    s.meters = { treasury: 80, trust: 82, security: 85, sovereignty: 90 };
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes('spec_all_80'));
    s.meters.trust = 100;
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes('spec_any_100'));
    s.decrees = ['IMF_PROGRAM', 'MONEY_PRINTING', 'AUSTERITY_PACT', 'SOLAR_FUND'];
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes('spec_decrees_4'));
    s.decrees = [
      'IMF_PROGRAM', 'MONEY_PRINTING', 'AUSTERITY_PACT', 'MILITIA_INTEGRATION',
      'LOCAL_COUNCILS', 'FOREIGN_CONCESSION', 'SOLAR_FUND',
    ];
    assert.ok(evaluateDossierAchievements(base, s, baseStats).includes('spec_decrees_7'));
  }
  {
    const s = JSON.parse(JSON.stringify(base)) as DossierState;
    s.turn = 40;
    s.isGameOver = true;
    s.endingId = 'term_phoenix';
    s.meters = { treasury: 76, trust: 78, security: 80, sovereignty: 82 };
    s.postponesLeft = 3;
    s.decrees = [];
    const earned = evaluateDossierAchievements(base, s, {
      minMeterEver: 30, overreachAnswered: 3, everHadDecree: false, lifetimeTurns: 40,
    });
    for (const reqId of [
      'spec_no_postpone', 'spec_never_below_25', 'spec_balanced_10',
      'spec_overreach_3', 'spec_phoenix_75', 'spec_clean_desk',
    ]) {
      assert.ok(earned.includes(reqId), `Unit check failed for ${reqId}`);
    }
    assert.ok(evaluateDossierAchievements(base, s, { ...baseStats, minMeterEver: 9 }).includes('spec_cliffhanger_10'));
  }

  // Score calculation & no-double-recording rule
  const storage = new MemoryStorage();
  const store = createRecordsStore('dossier-test', { storage, now: () => 1_763_316_000_000 });
  const game = attachFreshDossierRunMeta(createGame(DOSSIER_DECK, 777), 1_763_315_000_000);
  const prev = JSON.parse(JSON.stringify(game)) as DossierState;
  prev.turn = 40;
  prev.fileInTurn = 2;
  const next = JSON.parse(JSON.stringify(prev)) as DossierState;
  next.isGameOver = true;
  next.endingId = 'term_phoenix';
  next.meters = { treasury: 70, trust: 74, security: 66, sovereignty: 70 }; // avg=70 -> score=1700
  assert.equal(computeDossierRunScore(next), 1700);
  assert.equal(didCompleteDossierTurn(prev, next), true);

  applyDossierRecordsTransition(prev, next, getCurrentCard(prev, DOSSIER_DECK), store, 1_763_316_000_000);
  assert.equal(get(store.runs).length, 1, 'Finished term recorded once');
  assert.equal(store.getCounter(DOSSIER_TURNS_COUNTER_KEY), 1, 'Turn counter incremented by 1');

  applyDossierRecordsTransition(prev, next, null, store, 1_763_316_050_000);
  assert.equal(get(store.runs).length, 1, 'No duplicate run on repeated transition');

  const legacyEnded = createGame(DOSSIER_DECK, 888);
  legacyEnded.turn = 14;
  legacyEnded.isGameOver = true;
  legacyEnded.endingId = 'collapse_treasury';
  assert.equal(computeDossierRunScore(legacyEnded), 280);
  hydrateLoadedDossierRunMeta(legacyEnded, DOSSIER_DECK, 1_763_316_000_000);
  assert.equal(legacyEnded.runMeta?.recorded, true, 'Legacy ended save marked recorded');
  applyDossierRecordsTransition(legacyEnded, legacyEnded, null, store, 1_763_316_100_000);
  assert.equal(get(store.runs).length, 1, 'Reloaded ended save does not add duplicate run');
  assert.equal(buildDossierRunRecord(legacyEnded)?.score, 280);
}
console.log('✓ Unit-checked evaluator for all 28 achievement IDs, score formulas, and no-double-recording.');

// ─── 3. Multi-Bot Seeded Reachability Proof for All 11 Special Achievements ─
type BotDecision = 'right' | 'left' | 'postpone';
type BotPolicy = (state: DossierState, card: DossierCard) => BotDecision;

const carefulNoPostponeBot: BotPolicy = (st, card) => pickCarefulSide(st, card);

const cleanDeskBot: BotPolicy = (st, card) => {
  if (card.right.decree && card.left.decree && st.postponesLeft > 0) return 'postpone';
  const rMin = Math.min(...METER_IDS.map((k) => st.meters[k] + (card.right.effects[k] ?? 0)));
  const lMin = Math.min(...METER_IDS.map((k) => st.meters[k] + (card.left.effects[k] ?? 0)));
  if (card.right.decree && !card.left.decree) {
    if (lMin > 0) return 'left';
    if (st.postponesLeft > 0) return 'postpone';
  }
  if (card.left.decree && !card.right.decree) {
    if (rMin > 0) return 'right';
    if (st.postponesLeft > 0) return 'postpone';
  }
  return pickCarefulSide(st, card);
};

const decreeCollectorBot: BotPolicy = (st, card) => {
  const rMin = Math.min(...METER_IDS.map((k) => st.meters[k] + (card.right.effects[k] ?? 0)));
  const lMin = Math.min(...METER_IDS.map((k) => st.meters[k] + (card.left.effects[k] ?? 0)));
  if (card.right.decree && !st.decrees.includes(card.right.decree) && rMin > 10) return 'right';
  if (card.left.decree && !st.decrees.includes(card.left.decree) && lMin > 10) return 'left';
  if (card.right.endDecree && st.decrees.includes(card.right.endDecree) && lMin > 10) return 'left';
  if (card.left.endDecree && st.decrees.includes(card.left.endDecree) && rMin > 10) return 'right';
  return pickCarefulSide(st, card);
};

const cliffhangerBot: BotPolicy = (st, card) => {
  const minEver = st.runMeta?.minMeterEver ?? 50;
  if (minEver > 10 && st.turn <= 14) {
    const rMin = Math.min(...METER_IDS.map((k) => st.meters[k] + (card.right.effects[k] ?? 0)));
    const lMin = Math.min(...METER_IDS.map((k) => st.meters[k] + (card.left.effects[k] ?? 0)));
    if (rMin >= 3 && rMin <= 10) return 'right';
    if (lMin >= 3 && lMin <= 10) return 'left';
    if (rMin > 10 && lMin > 10) return rMin < lMin ? 'right' : 'left';
  }
  const side = pickCarefulSide(st, card);
  const chosenEff = card[side].effects;
  if (METER_IDS.some((k) => st.meters[k] + (chosenEff[k] ?? 0) <= 0) && st.postponesLeft > 0) {
    return 'postpone';
  }
  return side;
};

const BOTS: { name: string; policy: BotPolicy }[] = [
  { name: 'carefulNoPostponeBot', policy: carefulNoPostponeBot },
  { name: 'cleanDeskBot', policy: cleanDeskBot },
  { name: 'decreeCollectorBot', policy: decreeCollectorBot },
  { name: 'cliffhangerBot', policy: cliffhangerBot },
];

const NUM_SEEDS = 600;
const SPECIAL_IDS = DOSSIER_ACHIEVEMENTS.filter((a) => a.group === 'special').map((a) => a.id);
const reachStats = new Map<string, { bot: string; hits: number; sampleSeed: number; turn: number; detail: string }>();

for (const bot of BOTS) {
  const counts = new Map<string, { hits: number; sampleSeed: number; turn: number; detail: string }>();
  for (let i = 0; i < NUM_SEEDS; i++) {
    const seed = 10_000 + i * 109;
    const st = createGame(DOSSIER_DECK, seed);
    st.runMeta = createInitialDossierRunMeta(st, 1_763_316_000_000);
    const unlockedInRun = new Set<string>();
    let steps = 0;

    while (!st.isGameOver && steps < 120) {
      steps++;
      const card = getCurrentCard(st, DOSSIER_DECK)!;
      const act = bot.policy(st, card);
      if (act === 'postpone' && st.postponesLeft > 0) {
        postponeCard(st, DOSSIER_DECK);
        continue;
      }
      const side = act === 'postpone' ? 'right' : act;
      const prev = JSON.parse(JSON.stringify(st)) as DossierState;
      chooseAnswer(st, side, DOSSIER_DECK);
      st.runMeta = advanceDossierRunMeta(prev, st, card);
      const stats = toDossierRunStats(st.runMeta, st.turn, st);
      for (const id of evaluateDossierAchievements(prev, st, stats)) {
        if (!unlockedInRun.has(id)) {
          unlockedInRun.add(id);
          const cur = counts.get(id);
          const detail = `meters=[${st.meters.treasury},${st.meters.trust},${st.meters.security},${st.meters.sovereignty}] minEver=${st.runMeta.minMeterEver} dec=${st.decrees.length} ov=${st.runMeta.overreachAnswered}`;
          if (!cur) counts.set(id, { hits: 1, sampleSeed: seed, turn: st.turn, detail });
          else cur.hits += 1;
        }
      }
    }
  }
  for (const id of SPECIAL_IDS) {
    const c = counts.get(id);
    if (!c) continue;
    const prev = reachStats.get(id);
    if (!prev || c.hits > prev.hits) reachStats.set(id, { bot: bot.name, ...c });
  }
}

console.log(`\n─── Dossier Special Achievements Reachability (${NUM_SEEDS} seeds/bot) ───`);
const unreached: string[] = [];
for (const id of SPECIAL_IDS) {
  const r = reachStats.get(id);
  if (!r) {
    unreached.push(id);
    console.error(`✗ UNREACHED: ${id}`);
  } else {
    console.log(
      `✓ ${id.padEnd(20)} | ${String(r.hits).padStart(3)}/${NUM_SEEDS} seeds | bot=${r.bot.padEnd(20)} | seed=${r.sampleSeed} T${r.turn} | ${r.detail}`
    );
  }
}
assert.equal(unreached.length, 0, `Unreached special achievements: ${unreached.join(', ')}`);
console.log(`\n✓ All ${SPECIAL_IDS.length} special achievements proven reachable in seeded runs.`);

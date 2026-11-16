import { nextFloat } from '../../src/extras/shared/rng';
import { DECREE_LIST, STANDING_DECREES } from '../../src/extras/dossier/content/decrees';
import { ENDING_IDS, ENDINGS } from '../../src/extras/dossier/content/endings';
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
  type DossierState,
  type EndingId,
} from '../../src/extras/dossier/engine/types';

const isPartial = process.argv.includes('--partial');

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
}

const FORBIDDEN_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /اً/u, reason: 'Put tanween before alif (ًا instead of اً)' },
  { re: /(^|\s)تمّ?\s/u, reason: 'Avoid passive تم + مصدر; use active voice' },
  { re: /(^|\s)(قام|قامت|يقوم|تقوم)\s+ب/u, reason: 'Avoid قام بـ; use direct verb' },
  { re: /تواجد/u, reason: 'Avoid تواجد; use وجود/حضور/انتشار' },
  { re: /أثّ?ر\s+على/u, reason: 'Use أثّر في instead of أثّر على' },
  { re: /أجاب\s+على/u, reason: 'Use أجاب عن instead of أجاب على' },
  { re: /حيث\s+أن/u, reason: 'Avoid حيث أن; use إذ إن or rewrite' },
  { re: /لعب\s+دور/u, reason: 'Avoid لعب دورًا' },
  { re: /بالنسبة\s+ل/u, reason: 'Avoid بالنسبة لـ' },
  { re: /ناهيك\s+عن/u, reason: 'Use فضلًا عن instead of ناهيك عن' },
  { re: /(العام|الدور|الشهر|الأسبوع|الموسم|الفصل|القرن|العقد)\s+القادم/u, reason: 'Use المقبل for time' },
];

function checkArabicStyle(text: string, ctx: string): void {
  for (const { re, reason } of FORBIDDEN_PATTERNS) {
    assert(!re.test(text), `Arabic style [${ctx}]: ${reason} -> "${text}"`);
  }
}

function checkNoFinalPunct(text: string, ctx: string): void {
  assert(!/[.!؟?،؛:…]\s*$/u.test(text), `Final punctuation forbidden on ${ctx}: "${text}"`);
}

// 1. Validate standing decrees
for (const dec of DECREE_LIST) {
  assert(dec.name.length > 0 && dec.name.length <= 20, `Decree ${dec.id} name length ${dec.name.length} > 20`);
  checkNoFinalPunct(dec.name, `decree ${dec.id}`);
  checkArabicStyle(dec.name, `decree ${dec.id}`);
}

// 2. Validate endings (exact titles from spec 3.3)
const EXPECTED_TITLES: Record<EndingId, string> = {
  collapse_paralysis: 'سقوط الدولة: الشلل الحكومي وفقدان السيطرة المركزية',
  collapse_treasury: 'سقوط الدولة: الإفلاس السيادي الشامل',
  collapse_trust: 'سقوط الدولة: العصيان المدني العام',
  collapse_security: 'سقوط الدولة: الانقلاب العسكري وتمرد الحاميات',
  collapse_sovereignty: 'سقوط الدولة: التفكك المناطقي الشامل',
  term_phoenix: 'العنقاء السيادية: النهضة السورية الكبرى',
  term_mortgaged: 'الإمارة المرهونة للشركات الأجنبية',
  term_garrison: 'حصن الحامية العسكرية الدائمة',
  term_desert: 'صحراء العطش والتصحر المناخي',
  term_hollow: 'الجمهورية المفرغة من كفاءاتها',
};

for (const id of ENDING_IDS) {
  const e = ENDINGS[id];
  assert(e, `Missing ending ${id}`);
  assert(e.title === EXPECTED_TITLES[id], `Ending ${id} title mismatch: "${e.title}"`);
  assert(e.subtitle.length > 0 && e.subtitle.length <= 80, `Ending ${id} subtitle invalid length`);
  checkNoFinalPunct(e.subtitle, `ending ${id} subtitle`);
  assert(e.narrative.length >= 60 && e.narrative.length <= 420, `Ending ${id} narrative length invalid`);
  checkArabicStyle(e.subtitle, `ending ${id} subtitle`);
  checkArabicStyle(e.narrative, `ending ${id} narrative`);
}

// 3. Validate cards
const cards = DOSSIER_DECK;
const idSet = new Set<string>();
const allSetFlags = new Set<string>();
const kindCounts = { deck: 0, followup: 0, overreach: 0 };

for (const c of cards) {
  assert(c.id && !idSet.has(c.id), `Duplicate or empty card id: ${c.id}`);
  idSet.add(c.id);
  kindCounts[c.kind]++;

  assert(c.from.length > 0 && c.from.length <= 26, `${c.id} from length ${c.from.length} > 26: "${c.from}"`);
  assert(c.title.length > 0 && c.title.length <= 46, `${c.id} title length ${c.title.length} > 46: "${c.title}"`);
  assert(c.text.length > 0 && c.text.length <= 150, `${c.id} text length ${c.text.length} > 150: "${c.text}"`);
  assert(c.tags.length >= 1, `${c.id} must have at least one tag`);
  assert(c.weight > 0, `${c.id} must have positive weight`);

  checkNoFinalPunct(c.from, `${c.id}.from`);
  checkNoFinalPunct(c.title, `${c.id}.title`);
  checkArabicStyle(c.from, `${c.id}.from`);
  checkArabicStyle(c.title, `${c.id}.title`);
  checkArabicStyle(c.text, `${c.id}.text`);

  for (const side of ['right', 'left'] as const) {
    const ans = c[side];
    assert(
      ans.label.length > 0 && ans.label.length <= 34,
      `${c.id}.${side}.label length ${ans.label.length} > 34: "${ans.label}"`,
    );
    assert(
      ans.result.length > 0 && ans.result.length <= 80,
      `${c.id}.${side}.result length ${ans.result.length} > 80: "${ans.result}"`,
    );
    checkNoFinalPunct(ans.label, `${c.id}.${side}.label`);
    checkArabicStyle(ans.label, `${c.id}.${side}.label`);
    checkArabicStyle(ans.result, `${c.id}.${side}.result`);

    const entries = Object.entries(ans.effects).filter(([, v]) => v !== undefined && v !== 0);
    assert(
      entries.length >= 1 && entries.length <= 3,
      `${c.id}.${side} must affect 1..3 meters, got ${entries.length}`,
    );
    let hasPos = false;
    let hasNeg = false;
    for (const [k, v] of entries) {
      assert(METER_IDS.includes(k as any), `${c.id}.${side} invalid meter ${k}`);
      assert(
        typeof v === 'number' && Number.isInteger(v) && Math.abs(v) >= 3 && Math.abs(v) <= 15,
        `${c.id}.${side}.${k} magnitude must be integer in 3..15, got ${v}`,
      );
      assert(Math.abs(v) <= 20, `${c.id}.${side}.${k} > 20`);
      if (v > 0) hasPos = true;
      if (v < 0) hasNeg = true;
    }
    assert(hasPos && hasNeg, `${c.id}.${side} must be a genuine dilemma (both + and - effects)`);

    if (ans.decree) {
      assert(Boolean(STANDING_DECREES[ans.decree]), `${c.id}.${side} unknown decree "${ans.decree}"`);
    }
    if (ans.endDecree) {
      assert(Boolean(STANDING_DECREES[ans.endDecree]), `${c.id}.${side} unknown endDecree "${ans.endDecree}"`);
    }
    if (ans.setFlags) {
      for (const f of ans.setFlags) allSetFlags.add(f);
    }
  }
}

for (const c of cards) {
  for (const side of ['right', 'left'] as const) {
    const fu = c[side].followUp;
    if (fu) {
      assert(idSet.has(fu.id), `${c.id}.${side} dangling followUp "${fu.id}"`);
      assert(fu.delay >= 1 && fu.delay <= 10, `${c.id}.${side} invalid followUp delay ${fu.delay}`);
    }
  }
  if (c.when) {
    for (const d of [...(c.when.requireDecrees ?? []), ...(c.when.forbidDecrees ?? [])]) {
      assert(Boolean(STANDING_DECREES[d]), `${c.id}.when unknown decree "${d}"`);
    }
    if (!isPartial) {
      for (const f of [...(c.when.requireFlags ?? []), ...(c.when.forbidFlags ?? [])]) {
        assert(allSetFlags.has(f), `${c.id}.when flag "${f}" is never set by any card`);
      }
    }
  }
}

console.log(`Validated ${cards.length} cards:`, kindCounts);

// 4. Deterministic save/replay check
{
  const g1 = createGame(cards, 424242);
  chooseAnswer(g1, 'right', cards);
  chooseAnswer(g1, 'left', cards);
  const savedJson = JSON.stringify(g1);
  const g2 = JSON.parse(savedJson) as DossierState;
  chooseAnswer(g1, 'right', cards);
  chooseAnswer(g2, 'right', cards);
  assert(JSON.stringify(g1) === JSON.stringify(g2), 'Saved game state must replay identically');
}

// 5. Simulations
const NUM_RANDOM = 1000;
const NUM_CAREFUL = 1000;
const drawnCounts: Record<string, number> = {};
for (const c of cards) drawnCounts[c.id] = 0;

const randomEndings: Record<string, number> = {};
const carefulEndings: Record<string, number> = {};
for (const id of ENDING_IDS) {
  randomEndings[id] = 0;
  carefulEndings[id] = 0;
}

const collapseHistogram = {
  '01-07': 0,
  '08-15': 0,
  '16-25': 0,
  '26-35': 0,
  '36-40': 0,
  TERM: 0,
};

let randomTermCount = 0;
let randomTurnSum = 0;

for (let i = 0; i < NUM_RANDOM; i++) {
  const state = createGame(cards, 100_000 + i * 7919);
  const botRng = { seed: 500_000 + i * 3571 };
  if (state.currentCardId) drawnCounts[state.currentCardId]++;

  let steps = 0;
  while (!state.isGameOver && steps < 120) {
    steps++;
    assert(state.currentCardId !== null, 'Active random game missing currentCardId');
    if (state.postponesLeft > 0 && nextFloat(botRng) < 0.04) {
      postponeCard(state, cards);
      if (state.currentCardId) drawnCounts[state.currentCardId]++;
      continue;
    }
    const side = nextFloat(botRng) < 0.5 ? 'right' : 'left';
    chooseAnswer(state, side, cards);
    if (state.currentCardId) drawnCounts[state.currentCardId]++;

    for (const k of METER_IDS) {
      const v = state.meters[k];
      assert(Number.isFinite(v) && v >= 0 && v <= 100, `Invalid meter ${k}=${v}`);
    }
  }

  assert(state.isGameOver && state.endingId, 'Random game failed to terminate');
  randomEndings[state.endingId]++;
  randomTurnSum += state.turn;

  if (ENDINGS[state.endingId].kind === 'term') {
    randomTermCount++;
    collapseHistogram.TERM++;
  } else {
    const t = state.turn;
    if (t <= 7) collapseHistogram['01-07']++;
    else if (t <= 15) collapseHistogram['08-15']++;
    else if (t <= 25) collapseHistogram['16-25']++;
    else if (t <= 35) collapseHistogram['26-35']++;
    else collapseHistogram['36-40']++;
  }
}

let carefulTermCount = 0;
for (let i = 0; i < NUM_CAREFUL; i++) {
  const state = createGame(cards, 900_000 + i * 6151);
  if (state.currentCardId) drawnCounts[state.currentCardId]++;

  let steps = 0;
  while (!state.isGameOver && steps < 120) {
    steps++;
    const card = getCurrentCard(state, cards);
    assert(card !== null, 'Active careful game missing card');
    const side = pickCarefulSide(state, card);
    const chosenEff = card[side].effects;
    const wouldCollapse = METER_IDS.some((k) => state.meters[k] + (chosenEff[k] ?? 0) <= 0);
    if (wouldCollapse && state.postponesLeft > 0) {
      postponeCard(state, cards);
      if (state.currentCardId) drawnCounts[state.currentCardId]++;
      continue;
    }
    chooseAnswer(state, side, cards);
    if (state.currentCardId) drawnCounts[state.currentCardId]++;

    for (const k of METER_IDS) {
      const v = state.meters[k];
      assert(Number.isFinite(v) && v >= 0 && v <= 100, `Invalid meter ${k}=${v}`);
    }
  }

  assert(state.isGameOver && state.endingId, 'Careful game failed to terminate');
  carefulEndings[state.endingId]++;
  if (ENDINGS[state.endingId].kind === 'term') {
    carefulTermCount++;
  }
}

const randomTermPct = (randomTermCount / NUM_RANDOM) * 100;
const carefulTermPct = (carefulTermCount / NUM_CAREFUL) * 100;

console.log(`\n--- Random Play (${NUM_RANDOM} games) ---`);
console.log(`Avg turn reached: ${(randomTurnSum / NUM_RANDOM).toFixed(1)}`);
console.log(`Term completion: ${randomTermPct.toFixed(1)}%`);
console.log('Collapse turn histogram:', collapseHistogram);
console.log('Random endings:', randomEndings);

console.log(`\n--- Careful Bot (${NUM_CAREFUL} games) ---`);
console.log(`Term completion: ${carefulTermPct.toFixed(1)}%`);
console.log('Careful endings:', carefulEndings);

if (!isPartial) {
  assert(cards.length >= 80, `Expected >= 80 total cards, got ${cards.length}`);
  assert(kindCounts.deck >= 60, `Expected >= 60 deck cards, got ${kindCounts.deck}`);
  assert(kindCounts.followup >= 12, `Expected >= 12 followup cards, got ${kindCounts.followup}`);
  assert(kindCounts.overreach >= 6, `Expected >= 6 overreach cards, got ${kindCounts.overreach}`);

  const undrawn = cards.filter((c) => drawnCounts[c.id] === 0).map((c) => c.id);
  assert(undrawn.length === 0, `Cards never drawn: ${undrawn.join(', ')}`);

  for (const id of ENDING_IDS) {
    const total = randomEndings[id] + carefulEndings[id];
    assert(total > 0, `Ending "${id}" was never reached across ${NUM_RANDOM + NUM_CAREFUL} games`);
  }

  const randomCollapses = NUM_RANDOM - randomTermCount;
  const midCollapses = collapseHistogram['08-15'] + collapseHistogram['16-25'];
  assert(
    randomCollapses > 0 && midCollapses / randomCollapses >= 0.5,
    `Random collapses should mostly fall in turns 8-25, got ${midCollapses}/${randomCollapses}`,
  );
  assert(
    carefulTermPct >= 35 && carefulTermPct <= 65,
    `Careful bot term completion should be ~50% (35-65%), got ${carefulTermPct.toFixed(1)}%`,
  );

  console.log(`\nALL CHECKS PASSED (${cards.length} cards, all 10 endings reached, zero undrawn cards).`);
} else {
  console.log(`\nPARTIAL CHECK PASSED (${cards.length} cards).`);
}

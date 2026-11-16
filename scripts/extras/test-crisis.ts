import { nextFloat } from '../../src/extras/shared/rng';
import {
  ALL_COLLECTABLE_CARD_IDS,
  ALL_CRISES,
  ALL_PLAYER_CARDS,
  BOSSES,
  CATEGORIES,
  COLLECTABLE_CARDS,
  CRISIS_TRAITS,
  EVENTS,
  MODIFIERS,
  NODE_META,
  PLAYER_TRAITS,
  TEAMS,
  TUTORIAL_STEPS,
  applyAction,
  applyRunBattleAction,
  chooseGreedyBattleAction,
  createDefaultMeta,
  createRun,
  endRound,
  finishBattle,
  generateActMap,
  getForecastView,
  getLegalActions,
  getQueueView,
  previewRound,
  recordRunOnMeta,
  stepRunGreedy,
  stepRunRandom,
  type ActMap,
  type RunState,
  type TeamId,
} from '../../src/extras/crisis/engine';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const ALLOWED_GLYPHS = new Set<string>([
  'volunteers', 'committee', 'medic', 'teacher', 'radio', 'returnee', 'union',
  'technician', 'generator', 'grid-engineer', 'solar', 'substation', 'emergency-crew',
  'baker', 'farmer', 'flour-convoy', 'silo', 'cooperative', 'mill',
  'watchtower', 'patrol', 'community-police', 'border-unit', 'investigator', 'containment',
  'money-changer', 'auditor', 'tax-collector', 'dev-fund', 'credit-bank', 'central-bank',
  'boost', 'evacuate', 'repair', 'redeploy', 'early-warning', 'emergency-funds', 'ban', 'delay', 'mobilize',
  'red-tape', 'old-debt',
  'rumor', 'crowding', 'strike', 'hotspot', 'fault', 'outage', 'overload', 'cable-theft',
  'snowstorm', 'fuel-shortage', 'bread-queue', 'locusts', 'flour-monopoly', 'drought',
  'flour-smuggling', 'black-market', 'speculation', 'market-panic', 'corruption',
  'capital-flight', 'debt-due', 'hyperinflation', 'smuggling-ring', 'unrest',
  'blackout', 'profiteer', 'spiral',
  'watch', 'split', 'shield', 'inspire', 'income', 'promote', 'decisive', 'mobile',
  'return', 'solidarity', 'warn', 'thorns', 'aid',
  'sneak', 'grow', 'spread', 'harden', 'smuggle', 'erode', 'rally',
  'power', 'health', 'cost', 'gauge', 'life', 'grants', 'deck', 'discard',
  'node-battle', 'node-elite', 'node-recruit', 'node-train', 'node-rest',
  'node-market', 'node-event', 'node-boss', 'node-start',
  'cat-energy', 'cat-food', 'cat-security', 'cat-money', 'cat-society',
]);

function assertNoBadValues(val: unknown, path = 'root'): void {
  if (val === undefined) throw new Error(`Found undefined at ${path}`);
  if (typeof val === 'number' && (!Number.isFinite(val) || Number.isNaN(val))) {
    throw new Error(`Found non-finite number (${val}) at ${path}`);
  }
  if (typeof val === 'function') throw new Error(`Found function at ${path}`);
  if (val instanceof Map || val instanceof Set) throw new Error(`Found Map/Set at ${path}`);
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) assertNoBadValues(val[i], `${path}[${i}]`);
  } else if (val && typeof val === 'object') {
    for (const [k, v] of Object.entries(val)) {
      assertNoBadValues(v, `${path}.${k}`);
    }
  }
}

function verifyStaticContent(): void {
  for (const c of ALL_PLAYER_CARDS) {
    assert(ALLOWED_GLYPHS.has(c.glyph), `Invalid glyph '${c.glyph}' on card ${c.id}`);
    assert(!/[.!؟،]$/.test(c.name), `Card name ends with punctuation: ${c.name}`);
  }
  for (const c of ALL_CRISES) {
    assert(ALLOWED_GLYPHS.has(c.glyph), `Invalid glyph '${c.glyph}' on crisis ${c.id}`);
  }
  for (const b of Object.values(BOSSES)) {
    assert(ALLOWED_GLYPHS.has(b.glyph), `Invalid glyph '${b.glyph}' on boss ${b.id}`);
  }
  for (const m of Object.values(MODIFIERS)) {
    assert(ALLOWED_GLYPHS.has(m.glyph), `Invalid glyph '${m.glyph}' on modifier ${m.id}`);
  }
  for (const t of [...Object.values(PLAYER_TRAITS), ...Object.values(CRISIS_TRAITS)]) {
    assert(ALLOWED_GLYPHS.has(t.glyph), `Invalid glyph '${t.glyph}' on trait ${t.id}`);
  }
  for (const cat of Object.values(CATEGORIES)) {
    assert(ALLOWED_GLYPHS.has(cat.glyph), `Invalid glyph '${cat.glyph}' on category ${cat.id}`);
  }
  for (const n of Object.values(NODE_META)) {
    assert(ALLOWED_GLYPHS.has(n.glyph), `Invalid glyph '${n.glyph}' on node ${n.name}`);
  }
  for (const tm of Object.values(TEAMS)) {
    assert(ALLOWED_GLYPHS.has(tm.glyph), `Invalid glyph '${tm.glyph}' on team ${tm.id}`);
    assert(tm.starterCardIds.length === 10, `Team ${tm.id} must have 10 starter cards`);
  }
  for (const st of TUTORIAL_STEPS) {
    assert(ALLOWED_GLYPHS.has(st.glyph), `Invalid glyph '${st.glyph}' on tutorial step ${st.id}`);
  }
  assert(EVENTS.length >= 10, 'Must have >= 10 events');
  for (const ev of EVENTS) {
    assert(ALLOWED_GLYPHS.has(ev.glyph), `Invalid glyph '${ev.glyph}' on event ${ev.id}`);
    assert(!/[.!؟،]$/.test(ev.name), `Event title ends with punctuation: ${ev.name}`);
    assert(ev.text.length <= 90, `Event ${ev.id} text > 90 chars (${ev.text.length})`);
    for (const ch of ev.choices) {
      assert(ch.label.length <= 30, `Event ${ev.id} choice '${ch.label}' > 30 chars (${ch.label.length})`);
    }
  }
}

function verifyMapInvariants(map: ActMap): void {
  assert(map.rows.length === 7, 'Map must have 6 rows + boss row');
  for (let r = 0; r < 6; r++) {
    const row = map.rows[r];
    assert(row.length >= 2 && row.length <= 4, `Row ${r} must have 2-4 nodes`);
    if (r === 0) {
      assert(row.every((n) => n.type !== 'elite'), 'No elite allowed in row 0');
    }
    if (r === 5) {
      assert(row.some((n) => n.type === 'rest'), 'Row before boss must contain a rest');
    }
  }
  for (let r = 0; r < 5; r++) {
    const lower = map.rows[r];
    const edges: Array<[number, number]> = [];
    for (const n of lower) {
      assert(n.nextIds.length >= 1, `Node ${n.id} has no outgoing edges`);
      for (const nxtId of n.nextIds) {
        const nxt = map.nodes[nxtId];
        edges.push([n.col, nxt.col]);
      }
    }
    for (let a = 0; a < edges.length; a++) {
      for (let b = a + 1; b < edges.length; b++) {
        const [i1, j1] = edges[a];
        const [i2, j2] = edges[b];
        if (i1 < i2) assert(j1 <= j2, `Crossing edges in row ${r}: (${i1}->${j1}) vs (${i2}->${j2})`);
        if (i2 < i1) assert(j2 <= j1, `Crossing edges in row ${r}: (${i2}->${j2}) vs (${i1}->${j1})`);
      }
    }
    for (const u of map.rows[r + 1]) {
      assert(lower.some((l) => l.nextIds.includes(u.id)), `Node ${u.id} has no incoming edges`);
    }
  }

  // DFS all paths to boss: verify 3-4 fights per path
  function dfs(nodeId: string, fights: number): void {
    const n = map.nodes[nodeId];
    const nextFights = fights + (n.type === 'battle' || n.type === 'elite' ? 1 : 0);
    if (n.type === 'boss') {
      assert(nextFights >= 3 && nextFights <= 4, `Path reached boss with ${nextFights} fights (expected 3-4)`);
      return;
    }
    for (const nxt of n.nextIds) dfs(nxt, nextFights);
  }
  for (const startNode of map.rows[0]) dfs(startNode.id, 0);
}

verifyStaticContent();
for (let i = 0; i < 60; i++) {
  verifyMapInvariants(generateActMap({ seed: 1000 + i }, ((i % 3) + 1) as 1 | 2 | 3));
}

const TEAM_IDS: TeamId[] = ['rescue', 'development', 'resolve'];
const GREEDY_RUNS_PER_TEAM = 150; // 450 total greedy runs
const RANDOM_RUNS_PER_TEAM = 80;  // 240 total random runs

const battleLengths: number[] = [];
const actBattleStats: Record<1 | 2 | 3, { wins: number; total: number }> = {
  1: { wins: 0, total: 0 },
  2: { wins: 0, total: 0 },
  3: { wins: 0, total: 0 },
};
const eliteStats = { wins: 0, total: 0 };
const bossStats: Record<string, { wins: number; total: number }> = {
  blackout: { wins: 0, total: 0 },
  profiteer: { wins: 0, total: 0 },
  spiral: { wins: 0, total: 0 },
};
const cardPickCounts: Record<string, number> = Object.fromEntries(ALL_COLLECTABLE_CARD_IDS.map((id) => [id, 0]));
const winningDeckCardPresence: Record<string, number> = Object.fromEntries(ALL_COLLECTABLE_CARD_IDS.map((id) => [id, 0]));

let greedyWins = 0;
const greedyWinsByTeam: Record<TeamId, number> = { rescue: 0, development: 0, resolve: 0 };
let previewAssertions = 0;
let legalActionAssertions = 0;
let jsonRoundTripAssertions = 0;
let meta = createDefaultMeta();

for (const teamId of TEAM_IDS) {
  for (let r = 0; r < GREEDY_RUNS_PER_TEAM; r++) {
    const seed = 10000 + TEAM_IDS.indexOf(teamId) * 5000 + r * 17;
    const botRng = { seed: seed ^ 0x5a5a5a5a };
    let run = createRun(teamId, seed, { tutorial: r === 0 && teamId === 'rescue' });
    verifyMapInvariants(run.map);
    assertNoBadValues(run);

    let stepCount = 0;
    let didJsonCheck = false;

    while (run.screen !== 'ended') {
      stepCount += 1;
      assert(stepCount < 400, 'Run exceeded max node steps');

      if (!didJsonCheck && stepCount === 5 && r < 25) {
        didJsonCheck = true;
        const clonedRun = JSON.parse(JSON.stringify(run)) as RunState;
        const cloneBotRng = { seed: botRng.seed };
        let a = run;
        let b = clonedRun;
        const rngA = { seed: botRng.seed };
        while (a.screen !== 'ended') a = stepRunGreedy(a, rngA);
        while (b.screen !== 'ended') b = stepRunGreedy(b, cloneBotRng);
        assert(JSON.stringify(a) === JSON.stringify(b), 'JSON round-trip continuation diverged!');
        jsonRoundTripAssertions += 1;
      }

      if (run.screen === 'battle' && run.battle) {
        const node = run.map.nodes[run.activeNodeId!];
        let cur = run;
        let roundActs = 0;
        let lastRound = cur.battle!.round;

        while (cur.battle && cur.battle.phase !== 'ended') {
          assert(cur.battle.round <= 30, `Battle exceeded 30 rounds (round ${cur.battle.round})`);
          if (cur.battle.round !== lastRound) {
            lastRound = cur.battle.round;
            roundActs = 0;
          }

          if (r < 12 && cur.battle.phase === 'play' && roundActs === 1) {
            const snapshot = JSON.stringify(cur.battle);
            const legals = getLegalActions(cur.battle);
            for (const la of legals) {
              const res = applyAction(cur.battle, la);
              assertNoBadValues(res.state);
              legalActionAssertions += 1;
            }
            assert(JSON.stringify(cur.battle) === snapshot, 'applyAction/getLegalActions mutated input state');
            const qv = getQueueView(cur.battle);
            const fv = getForecastView(cur.battle);
            for (const slot of qv) {
              if (slot.status === 'hidden') assert(!('crisis' in slot), 'Hidden queue slot leaked crisis');
            }
            for (const slot of fv) {
              if (slot.status === 'silhouette') assert(!('defId' in slot), 'Unrevealed forecast leaked defId');
            }
          }

          const act =
            cur.battle.phase === 'play' && roundActs >= 10
              ? ({ type: 'endRound' } as const)
              : chooseGreedyBattleAction(cur.battle, botRng);

          if (act.type === 'endRound' && previewAssertions < 1500) {
            const prev = previewRound(cur.battle);
            const real = endRound(cur.battle);
            assert(
              prev.projectedBalance === real.state.balance,
              `previewRound (${prev.projectedBalance}) != endRound (${real.state.balance})`,
            );
            assert(prev.wouldEnd === (real.state.phase === 'ended'), 'previewRound wouldEnd mismatch');
            previewAssertions += 1;
          }

          cur = applyRunBattleAction(cur, act).run;
          roundActs += 1;
        }

        const endedBattle = cur.battle!;
        assert(endedBattle.round <= 30, `Battle ended after round 30 (${endedBattle.round})`);
        battleLengths.push(endedBattle.round);
        const wonBattle = endedBattle.result === 'win';
        if (node.type === 'battle') {
          actBattleStats[cur.act].total += 1;
          if (wonBattle) actBattleStats[cur.act].wins += 1;
        } else if (node.type === 'elite') {
          eliteStats.total += 1;
          if (wonBattle) eliteStats.wins += 1;
        } else if (node.type === 'boss' && endedBattle.bossId) {
          bossStats[endedBattle.bossId].total += 1;
          if (wonBattle) bossStats[endedBattle.bossId].wins += 1;
        }

        run = finishBattle(cur);
        assertNoBadValues(run);
      } else {
        const prevAct = run.act;
        run = stepRunGreedy(run, botRng, (defId) => {
          if (cardPickCounts[defId] !== undefined) cardPickCounts[defId] += 1;
        });
        if (run.act !== prevAct && run.screen === 'map') {
          verifyMapInvariants(run.map);
        }
        assertNoBadValues(run);
      }
    }

    meta = recordRunOnMeta(meta, run);
    if (run.summary?.won) {
      greedyWins += 1;
      greedyWinsByTeam[teamId] += 1;
      const uniqueIds = new Set(run.deck.map((c) => c.defId));
      for (const id of uniqueIds) {
        if (winningDeckCardPresence[id] !== undefined) winningDeckCardPresence[id] += 1;
      }
    }
  }
}

let randomWins = 0;
for (const teamId of TEAM_IDS) {
  for (let r = 0; r < RANDOM_RUNS_PER_TEAM; r++) {
    const seed = 90000 + TEAM_IDS.indexOf(teamId) * 5000 + r * 23;
    const botRng = { seed: seed ^ 0x3c3c3c3c };
    let run = createRun(teamId, seed);
    let steps = 0;
    while (run.screen !== 'ended') {
      steps += 1;
      assert(steps < 400, 'Random run exceeded max node steps');
      if (run.screen === 'battle' && run.battle) {
        let cur = run;
        let roundActs = 0;
        let lastRound = cur.battle!.round;
        while (cur.battle && cur.battle.phase !== 'ended') {
          assert(cur.battle.round <= 30, `Random battle exceeded 30 rounds (${cur.battle.round})`);
          if (cur.battle.round !== lastRound) {
            lastRound = cur.battle.round;
            roundActs = 0;
          }
          const legal = getLegalActions(cur.battle);
          const idx = Math.floor(nextFloat(botRng) * legal.length);
          const act = cur.battle.phase === 'play' && roundActs >= 8 ? ({ type: 'endRound' } as const) : legal[idx];
          cur = applyRunBattleAction(cur, act).run;
          roundActs += 1;
        }
        assert(cur.battle!.round <= 30, `Random battle ended > 30 rounds`);
        run = finishBattle(cur);
      } else {
        run = stepRunRandom(run, botRng);
      }
      assertNoBadValues(run);
    }
    if (run.summary?.won) randomWins += 1;
  }
}

const totalGreedy = TEAM_IDS.length * GREEDY_RUNS_PER_TEAM;
const totalRandom = TEAM_IDS.length * RANDOM_RUNS_PER_TEAM;
battleLengths.sort((a, b) => a - b);
const pct = (n: number, d: number) => (d === 0 ? '0.0%' : `${((n / d) * 100).toFixed(1)}%`);
const quantile = (arr: number[], q: number) => arr[Math.floor((arr.length - 1) * q)];

const totalBossWins = Object.values(bossStats).reduce((s, x) => s + x.wins, 0);
const totalBossFights = Object.values(bossStats).reduce((s, x) => s + x.total, 0);

console.log('=== غرفة الأزمات — Simulation Report ===');
console.log(`Assertions verified: previewRound=${previewAssertions}, legalActions=${legalActionAssertions}, jsonRoundTrip=${jsonRoundTripAssertions}`);
console.log(`Meta unlocks reached: ${meta.unlockedTeams.join(', ')}`);
console.log(
  `Battle length (${battleLengths.length} battles): min=${battleLengths[0]}, p25=${quantile(battleLengths, 0.25)}, median=${quantile(battleLengths, 0.5)}, p75=${quantile(battleLengths, 0.75)}, max=${battleLengths[battleLengths.length - 1]}`,
);
const hist: Record<string, number> = { '1-4': 0, '5-8': 0, '9-12': 0, '13-20': 0, '21-30': 0 };
for (const len of battleLengths) {
  if (len <= 4) hist['1-4'] += 1;
  else if (len <= 8) hist['5-8'] += 1;
  else if (len <= 12) hist['9-12'] += 1;
  else if (len <= 20) hist['13-20'] += 1;
  else hist['21-30'] += 1;
}
console.log('Battle length histogram:', hist);
console.log(
  `Greedy battle win rates: Act1=${pct(actBattleStats[1].wins, actBattleStats[1].total)} (${actBattleStats[1].wins}/${actBattleStats[1].total}), Act2=${pct(actBattleStats[2].wins, actBattleStats[2].total)} (${actBattleStats[2].wins}/${actBattleStats[2].total}), Act3=${pct(actBattleStats[3].wins, actBattleStats[3].total)} (${actBattleStats[3].wins}/${actBattleStats[3].total})`,
);
console.log(`Greedy elite win rate: ${pct(eliteStats.wins, eliteStats.total)} (${eliteStats.wins}/${eliteStats.total})`);
console.log(
  `Greedy boss win rates: Overall=${pct(totalBossWins, totalBossFights)} | blackout=${pct(bossStats.blackout.wins, bossStats.blackout.total)} | profiteer=${pct(bossStats.profiteer.wins, bossStats.profiteer.total)} | spiral=${pct(bossStats.spiral.wins, bossStats.spiral.total)}`,
);
console.log(
  `Full-run win rate (Greedy): ${pct(greedyWins, totalGreedy)} (${greedyWins}/${totalGreedy}) [rescue=${pct(greedyWinsByTeam.rescue, GREEDY_RUNS_PER_TEAM)}, development=${pct(greedyWinsByTeam.development, GREEDY_RUNS_PER_TEAM)}, resolve=${pct(greedyWinsByTeam.resolve, GREEDY_RUNS_PER_TEAM)}]`,
);
console.log(`Full-run win rate (Random): ${pct(randomWins, totalRandom)} (${randomWins}/${totalRandom})`);

const sortedPicks = COLLECTABLE_CARDS.map((c) => ({
  id: c.id,
  name: c.name,
  picks: cardPickCounts[c.id],
  winShare: greedyWins > 0 ? winningDeckCardPresence[c.id] / greedyWins : 0,
})).sort((a, b) => b.winShare - a.winShare);

const zeroPicked = sortedPicks.filter((x) => x.picks === 0);
console.log(`Zero-picked cards: ${zeroPicked.length === 0 ? 'NONE' : zeroPicked.map((z) => z.id).join(', ')}`);
console.log('Card pick frequency & winning-deck presence (all collectable cards):');
for (const c of sortedPicks) {
  console.log(`  ${c.id.padEnd(18)} picks=${String(c.picks).padStart(3)}  winDeckShare=${(c.winShare * 100).toFixed(1)}%`);
}

const medianLen = quantile(battleLengths, 0.5);
const act1Rate = actBattleStats[1].wins / actBattleStats[1].total;
const act2Rate = actBattleStats[2].wins / actBattleStats[2].total;
const act3Rate = actBattleStats[3].wins / actBattleStats[3].total;
const bossRate = totalBossWins / totalBossFights;
const greedyRunRate = greedyWins / totalGreedy;
const randomRunRate = randomWins / totalRandom;
const maxWinShare = sortedPicks[0].winShare;

assert(medianLen >= 5 && medianLen <= 8, `Median battle length ${medianLen} outside 5..8`);
assert(act1Rate >= 0.85, `Act 1 win rate ${(act1Rate * 100).toFixed(1)}% < 85%`);
assert(act2Rate >= 0.68 && act2Rate <= 0.82, `Act 2 win rate ${(act2Rate * 100).toFixed(1)}% far from ~75%`);
assert(act3Rate >= 0.57 && act3Rate <= 0.73, `Act 3 win rate ${(act3Rate * 100).toFixed(1)}% far from ~65%`);
assert(bossRate >= 0.45 && bossRate <= 0.65, `Boss win rate ${(bossRate * 100).toFixed(1)}% outside 45..65%`);
assert(greedyRunRate >= 0.25 && greedyRunRate <= 0.45, `Greedy run win rate ${(greedyRunRate * 100).toFixed(1)}% outside 25..45%`);
assert(randomRunRate < 0.05, `Random run win rate ${(randomRunRate * 100).toFixed(1)}% >= 5%`);
assert(zeroPicked.length === 0, 'Some collectable cards were never picked');
assert(maxWinShare <= 0.70, `Card ${sortedPicks[0].id} appeared in > 70% of winning decks (${(maxWinShare * 100).toFixed(1)}%)`);
console.log('ALL INVARIANTS AND BALANCE TARGETS PASSED.');

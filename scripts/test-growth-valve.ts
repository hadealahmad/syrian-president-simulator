import { createInitialGameState } from '../src/lib/engine/baseline';
import {
  getDefaultTurnDirectives,
  simulateTurnTransitions,
  evaluateRehearsalDirectives,
} from '../src/lib/engine/turn-manager';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) console.log(`  ok: ${name}${extra ? ' — ' + extra : ''}`);
  else {
    failures++;
    console.log(`  FAIL: ${name}${extra ? ' — ' + extra : ''}`);
  }
}

console.log('=== TEST 1: investment accrues capacity + revenue ===');
{
  let s = createInitialGameState(101);
  for (let t = 0; t < 5; t++) {
    const d = {
      ...getDefaultTurnDirectives(),
      gridCapExUSD: 35_000_000,
      provincialProjects: t === 0 ? ['proj_daraa_nassib_border'] : [],
    };
    s = simulateTurnTransitions(s, structuredClone(d));
  }
  check('capacity rose from 20', (s.macro.productiveCapacityPct ?? 0) > 20, `got ${s.macro.productiveCapacityPct}`);
  check('project revenue flows', (s.lastTurnAudit!.projectRevenueSYP ?? 0) > 0);
  check('capacity bonus flows', (s.lastTurnAudit!.capacityRevenueBonusSYP ?? 0) > 0);
}

console.log('=== TEST 2: zero CapEx erodes capacity ===');
{
  let s = createInitialGameState(102);
  s.macro.productiveCapacityPct = 30;
  const d = { ...getDefaultTurnDirectives(), gridCapExUSD: 0 };
  s = simulateTurnTransitions(s, structuredClone(d));
  check('capacity fell', (s.macro.productiveCapacityPct ?? 30) < 30, `got ${s.macro.productiveCapacityPct}`);
}

console.log('=== TEST 3: revolt erodes capacity ===');
{
  let s = createInitialGameState(103);
  s.macro.productiveCapacityPct = 40;
  for (const g of Object.values(s.governorates)) {
    g.prri = 90;
    g.tier = 'REVOLT';
  }
  const d = { ...getDefaultTurnDirectives(), gridCapExUSD: 35_000_000 };
  s = simulateTurnTransitions(s, structuredClone(d));
  // 14 revolts x 2.0 erosion overwhelms +1 capex gain
  check('revolts destroy capacity', (s.macro.productiveCapacityPct ?? 40) < 40, `got ${s.macro.productiveCapacityPct}`);
}

console.log('=== TEST 4: militia absorption ramps and decays ===');
{
  let s = createInitialGameState(104);
  for (let t = 0; t < 4; t++) {
    const d = { ...getDefaultTurnDirectives(), workforceStrategy: 'ABSORB_MILITIAS' as const };
    s = simulateTurnTransitions(s, structuredClone(d));
  }
  check('bonus ramps to cap', Math.abs((s.macro.militiaAbsorptionBonus ?? 0) - 0.04) < 1e-9, `got ${s.macro.militiaAbsorptionBonus}`);
  const d2 = { ...getDefaultTurnDirectives(), workforceStrategy: 'MAINTAIN' as const };
  s = simulateTurnTransitions(s, structuredClone(d2));
  check('bonus decays when dropped', Math.abs((s.macro.militiaAbsorptionBonus ?? 0) - 0.03) < 1e-9, `got ${s.macro.militiaAbsorptionBonus}`);
}

console.log('=== TEST 5: wheat savings from farmland projects ===');
{
  let s = createInitialGameState(105);
  const base = { ...getDefaultTurnDirectives(), provincialProjects: ['proj_hasakeh_wheat_suwaydiya'] };
  s = simulateTurnTransitions(s, structuredClone(base));
  check('hasakeh project executed', s.governorates['hasakeh'].strategicProject.isExecuted);
  // Next turn's wheat bill should reflect the $15M saving vs an identical fresh state
  const d = { ...getDefaultTurnDirectives() };
  const withSaving = simulateTurnTransitions(s, structuredClone(d));
  const fresh = simulateTurnTransitions(createInitialGameState(105), structuredClone(d));
  const wWith = withSaving.lastTurnAudit!.expendedUSD;
  const wFresh = fresh.lastTurnAudit!.expendedUSD;
  check('wheat bill lower with executed farmland project', wWith < wFresh, `saved $${((wFresh - wWith) / 1e6).toFixed(1)}M`);
}

console.log('=== TEST 6: preview == commit on capacity lines ===');
{
  const s = createInitialGameState(106);
  s.macro.productiveCapacityPct = 50;
  const d = { ...getDefaultTurnDirectives() };
  const pre = evaluateRehearsalDirectives(structuredClone(s), structuredClone(d));
  const n = simulateTurnTransitions(s, structuredClone(d));
  // Preview deficit must reflect the same capacity bonus as commit
  // (within the small pre-existing southern-front revenue drift).
  const commitBonus = n.lastTurnAudit!.capacityRevenueBonusSYP;
  check('capacity bonus material', commitBonus > 0, `+${(commitBonus / 1e9).toFixed(2)}B`);
  const commitDef = Math.max(0, n.lastTurnAudit!.expendedSYP - n.lastTurnAudit!.grossCapturedSYP);
  const drift = Math.abs(pre.deficitSYP - commitDef) / Math.max(1, commitDef);
  check('preview deficit matches commit deficit (<5%)', drift < 0.05, `${(drift * 100).toFixed(1)}%`);
}

console.log(failures === 0 ? 'ALL GROWTH-VALVE TESTS PASSED!' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

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

console.log('=== TEST 1: operating + investment == expended (3 mixes) ===');
const mixes = [
  { ...getDefaultTurnDirectives() },
  {
    ...getDefaultTurnDirectives(),
    foodSubsidyLevel: 'AUSTERE' as const,
    workforceStrategy: 'PRUNE_CIVIL_SERVICE' as const,
    provincialProjects: ['proj_daraa_nassib_border'],
    gridCapExUSD: 80_000_000,
  },
  {
    ...getDefaultTurnDirectives(),
    foodSubsidyLevel: 'GENEROUS' as const,
    wheatProcurement: 'PREMIUM_INCENTIVE' as const,
    deminingPriorityId: 'aleppo',
    gridCapExUSD: 0,
  },
];
mixes.forEach((d, i) => {
  const n = simulateTurnTransitions(createInitialGameState(100 + i), structuredClone(d));
  const a = n.lastTurnAudit!;
  check(
    `mix ${i} split exact`,
    a.operatingExpendedSYP + a.investmentExpendedSYP === a.expendedSYP,
    `op ${(a.operatingExpendedSYP / 1e9).toFixed(1)}B + inv ${(a.investmentExpendedSYP / 1e9).toFixed(1)}B = ${(a.expendedSYP / 1e9).toFixed(1)}B`
  );
  check(`mix ${i} burden sane`, a.interestBurdenPct >= 0 && a.interestBurdenPct < 100);
});

console.log('=== TEST 2: runway turns ===');
{
  const n = simulateTurnTransitions(createInitialGameState(200), structuredClone(getDefaultTurnDirectives()));
  const a = n.lastTurnAudit!;
  // Default turn has positive USD delta -> runway capped at 99
  check('positive USD burn gives 99-turn runway', a.runwayTurnsEstimate === 99, `got ${a.runwayTurnsEstimate}`);
}
{
  // Force a USD drain: massive dollar auction + max capex
  const d = { ...getDefaultTurnDirectives(), dollarAuctionUSD: 300_000_000, gridCapExUSD: 80_000_000 };
  const n = simulateTurnTransitions(createInitialGameState(201), structuredClone(d));
  const a = n.lastTurnAudit!;
  check('USD drain gives finite runway', a.runwayTurnsEstimate < 99 && a.runwayTurnsEstimate >= 0, `got ${a.runwayTurnsEstimate}`);
}

console.log('=== TEST 3: preview == commit on split fields ===');
{
  const s = createInitialGameState(300);
  const d = { ...mixes[1] };
  const pre = evaluateRehearsalDirectives(structuredClone(s), structuredClone(d));
  const n = simulateTurnTransitions(s, structuredClone(d));
  const a = n.lastTurnAudit!;
  const commitOpDeficit = Math.max(0, a.expendedSYP - a.grossCapturedSYP);
  // Exact on every line this project owns (split, investment, project costs).
  check('investment preview==commit', pre.investmentSYP === a.investmentExpendedSYP);
  // Total deficit has a pre-existing revenue drift (grid-CapEx power hours
  // and southern-front nassib apply before the commit audit but not the
  // rehearsal preview), so assert a bound rather than equality here.
  const drift = Math.abs(pre.operatingDeficitSYP - commitOpDeficit) / Math.max(1, commitOpDeficit);
  check('operating deficit preview≈commit (<10% pre-existing drift)', drift < 0.1, `${(drift * 100).toFixed(1)}%`);
}

console.log(failures === 0 ? 'ALL AUDIT-SPLIT TESTS PASSED!' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

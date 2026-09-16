import { createInitialGameState } from '../src/lib/engine/baseline';
import {
  getDefaultTurnDirectives,
  simulateTurnTransitions,
  evaluateRehearsalDirectives,
} from '../src/lib/engine/turn-manager';
import { canSignFacility } from '../src/lib/engine/facilities';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) console.log(`  ok: ${name}${extra ? ' — ' + extra : ''}`);
  else {
    failures++;
    console.log(`  FAIL: ${name}${extra ? ' — ' + extra : ''}`);
  }
}

console.log('=== TEST 1: IMF full tranche lifecycle ===');
{
  let s = createInitialGameState(201);
  const d = { ...getDefaultTurnDirectives(), dieselSmuggling: 'CRACKDOWN' as const, signedFacilityIds: ['facility_imf_stabilization'] };
  check('can sign with PC', canSignFacility(s, 'facility_imf_stabilization', 50).ok);
  s = simulateTurnTransitions(s, structuredClone(d));
  let fs = s.facilities.find((f) => f.id === 'facility_imf_stabilization')!;
  check('ACTIVE after signing', fs.status === 'ACTIVE', fs.status);
  check('tranche 1 drawn ($200M)', s.lastTurnAudit!.facilityInflowUSD === 200_000_000);
  check('condition timer set', fs.conditionTurnsLeft === 3, `got ${fs.conditionTurnsLeft}`);
  // Two more compliant turns draw tranches 2-3 and complete; a fourth
  // ticks the 4-turn conditionality timer to zero.
  for (let t = 0; t < 3; t++) {
    const dd = { ...getDefaultTurnDirectives(), dieselSmuggling: 'CRACKDOWN' as const };
    s = simulateTurnTransitions(s, structuredClone(dd));
  }
  fs = s.facilities.find((f) => f.id === 'facility_imf_stabilization')!;
  check('COMPLETED after 3 tranches', fs.status === 'COMPLETED', `${fs.status} drawn=${fs.tranchesDrawn}`);
  check('timer expired', fs.conditionTurnsLeft === 0);
}

console.log('=== TEST 2: breach freezes tranches + trust penalty ===');
{
  let s = createInitialGameState(202);
  const trustBefore = s.macro.civicTrust;
  const d = { ...getDefaultTurnDirectives(), dieselSmuggling: 'CRACKDOWN' as const, signedFacilityIds: ['facility_imf_stabilization'] };
  s = simulateTurnTransitions(s, structuredClone(d));
  const bad = { ...getDefaultTurnDirectives(), dieselSmuggling: 'PERMISSIVE' as const };
  s = simulateTurnTransitions(s, structuredClone(bad));
  const fs = s.facilities.find((f) => f.id === 'facility_imf_stabilization')!;
  check('BREACHED on reversal', fs.status === 'BREACHED', fs.status);
  check('no further inflow', s.lastTurnAudit!.facilityInflowUSD === 0);
  check('trust penalty applied', s.macro.civicTrust === Math.max(0, trustBefore - 4), `${trustBefore} -> ${s.macro.civicTrust}`);
}

console.log('=== TEST 3: signing refused when condition unmet ===');
{
  const s = createInitialGameState(203);
  const d = { ...getDefaultTurnDirectives(), signedFacilityIds: ['facility_imf_stabilization'] };
  const n = simulateTurnTransitions(s, structuredClone(d));
  const fs = n.facilities.find((f) => f.id === 'facility_imf_stabilization');
  check('stays AVAILABLE', !fs || fs.status === 'AVAILABLE');
  check('no inflow, no PC charge', n.lastTurnAudit!.facilityInflowUSD === 0 && n.macro.politicalCapital === s.macro.politicalCapital);
}

console.log('=== TEST 4: grant gate + ring-fenced project cover ===');
{
  const s = createInitialGameState(204);
  check('grant refused at high corruption', !canSignFacility(s, 'facility_gulf_reconstruction_grant', 50).ok);
  s.macro.systemicCorruption = 30;
  check('grant signable below 50', canSignFacility(s, 'facility_gulf_reconstruction_grant', 50).ok);
  const d = { ...getDefaultTurnDirectives(), signedFacilityIds: ['facility_gulf_reconstruction_grant'] };
  let n = simulateTurnTransitions(s, structuredClone(d));
  check('bucket topped $100M', n.macro.grantBucketUSD === 100_000_000);
  const resBefore = n.macro.reservesUSD;
  const d2 = { ...getDefaultTurnDirectives(), provincialProjects: ['proj_daraa_nassib_border'] };
  n = simulateTurnTransitions(n, structuredClone(d2));
  check('project executed', n.governorates['daraa'].strategicProject.isExecuted);
  check('bucket paid the $20M USD cost', n.macro.grantBucketUSD === 180_000_000, `bucket=${n.macro.grantBucketUSD}`);
  // Reserves must NOT have paid the covered $20M: delta vs a no-bucket control
  check('reserves preserved the covered share', n.macro.reservesUSD > resBefore - 25_000_000, `Δ=${((n.macro.reservesUSD - resBefore) / 1e6).toFixed(1)}M`);
}

console.log('=== TEST 5: Iran reschedule one-shot ===');
{
  const s = createInitialGameState(205);
  const d = { ...getDefaultTurnDirectives(), signedFacilityIds: ['facility_iran_reschedule'] };
  const pre = evaluateRehearsalDirectives(structuredClone(s), structuredClone(d));
  const n = simulateTurnTransitions(s, structuredClone(d));
  check('preview coupon $10M', pre.iranOilCouponUSD === 10_000_000);
  check('commit coupon $10M', n.lastTurnAudit!.iranOilCouponUSD === 10_000_000);
  check('COMPLETED immediately', n.facilities.find((f) => f.id === 'facility_iran_reschedule')?.status === 'COMPLETED');
  check('leverage cost applied', n.macro.sovereignLeverage === 65 - 8, `got ${n.macro.sovereignLeverage}`);
  // Coupon stays low next turn without re-signing
  const n2 = simulateTurnTransitions(n, structuredClone(getDefaultTurnDirectives()));
  check('coupon persists', n2.lastTurnAudit!.iranOilCouponUSD === 10_000_000);
}

console.log('=== TEST 6: facility PC cost gating ===');
{
  const s = createInitialGameState(206);
  check('refused when PC short', !canSignFacility(s, 'facility_imf_stabilization', 5).ok);
}

console.log(failures === 0 ? 'ALL FACILITY TESTS PASSED!' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

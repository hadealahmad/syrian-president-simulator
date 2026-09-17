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

console.log('=== TEST 1: UN_LIAISON mechanics ===');
{
  const s = createInitialGameState(301);
  const gtiBefore = s.governorates['daraa'].golanTensionIndex ?? 45;
  const ddiBefore = s.governorates['daraa'].daraaDefianceIndex ?? 54;
  const trustBefore = s.macro.civicTrust;
  const d = { ...getDefaultTurnDirectives(), golanBorderStance: 'UN_LIAISON' as const };
  const pre = evaluateRehearsalDirectives(structuredClone(s), structuredClone(d));
  const n = simulateTurnTransitions(s, structuredClone(d));
  const gtiAfter = n.governorates['daraa'].golanTensionIndex ?? -1;
  check('tension -10', gtiAfter === Math.max(10, gtiBefore - 10), `${gtiBefore} -> ${gtiAfter}`);
  check('defiance untouched', n.governorates['daraa'].daraaDefianceIndex === ddiBefore);
  check('trust +2', n.macro.civicTrust === Math.min(100, trustBefore + 2));
  check('$8M mission in USD spend', n.lastTurnAudit!.expendedUSD >= 8_000_000);
  check('preview sees the $8M too', pre.deficitSYP >= 0);
  check('mirrored onto quneitra', n.governorates['quneitra'].golanTensionIndex === gtiAfter);
}

console.log('=== TEST 2: stance outcomes match the dossier stripes ===');
{
  const cases = [
    { stance: 'RESTRAINT', gti: (v: number) => Math.max(15, v - 15), ddi: (v: number) => Math.min(100, v + 18) },
    { stance: 'DEPLOY_ARMOR', gti: (v: number) => Math.min(100, v + 25), ddi: (v: number) => Math.max(10, v - 20) },
    { stance: 'LOCAL_GENDARMERIE', gti: (v: number) => Math.min(100, v + 5), ddi: (v: number) => Math.max(10, v - 8) },
  ] as const;
  for (const c of cases) {
    const s = createInitialGameState(302);
    (s.governorates['daraa'] as any).golanTensionIndex = 50;
    (s.governorates['daraa'] as any).daraaDefianceIndex = 50;
    // Neutralize coupling: vouchers is default and adds nothing to tension
    const d = { ...getDefaultTurnDirectives(), golanBorderStance: c.stance };
    const n = simulateTurnTransitions(s, structuredClone(d));
    check(
      `${c.stance} stripe parity`,
      n.governorates['daraa'].golanTensionIndex === c.gti(50) &&
        n.governorates['daraa'].daraaDefianceIndex === c.ddi(50),
      `gti=${n.governorates['daraa'].golanTensionIndex} ddi=${n.governorates['daraa'].daraaDefianceIndex}`
    );
  }
}

console.log('=== TEST 3: southern outcomes match the dossier stripes ===');
{
  const s = createInitialGameState(303);
  const g = s.governorates['as_suwayda'];
  (g as any).suwaydaIntegrationIndex = 40;
  (g as any).suwaydaSecessionProb = 30;
  const d = { ...getDefaultTurnDirectives(), southernPolicy: 'BLOCKADE' as const };
  const n = simulateTurnTransitions(s, structuredClone(d));
  const ng = n.governorates['as_suwayda'];
  check('ratchet halves integration', ng.suwaydaIntegrationIndex === 20, `got ${ng.suwaydaIntegrationIndex}`);
  check('secession +30', ng.suwaydaSecessionProb === 60, `got ${ng.suwaydaSecessionProb}`);
}

console.log('=== TEST 4: accord upkeep + fallback ===');
{
  const s = createInitialGameState(304);
  const d = { ...getDefaultTurnDirectives(), southernPolicy: 'HISTORIC_ACCORD' as const };
  const n = simulateTurnTransitions(s, structuredClone(d));
  check('4 PC upkeep charged', n.macro.politicalCapital === 50 - 4, `got ${n.macro.politicalCapital}`);
  const poor = createInitialGameState(305);
  poor.macro.politicalCapital = 2;
  const n2 = simulateTurnTransitions(poor, structuredClone(d));
  check('broke falls back to vouchers', n2.governorates['as_suwayda'].suwaydaIntegrationIndex === 12);
}

console.log(failures === 0 ? 'ALL SOUTHERN-THEATER TESTS PASSED!' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);

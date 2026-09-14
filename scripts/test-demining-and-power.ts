import { createInitialGameState } from '../src/lib/engine/baseline';
import { executeTurnLifecycle, getDefaultTurnDirectives } from '../src/lib/engine/turn-manager';
import { auditSemiannualBudget } from '../src/lib/engine/revenues';

console.log('=== TEST 1: Demining <= 8% Threshold Enforcement ===');
const state1 = createInitialGameState(100);

// Damascus starts at 5% mine saturation
console.log(`Damascus initial mine saturation: ${state1.governorates['damascus'].mineSaturationPct}%`);
const directivesInvalidDemining = getDefaultTurnDirectives();
directivesInvalidDemining.deminingPriorityId = 'damascus';

const afterState1 = executeTurnLifecycle(state1, directivesInvalidDemining);

console.log(`Damascus after invalid demining directive: ${afterState1.governorates['damascus'].mineSaturationPct}% (Expected: 5%)`);
if (afterState1.governorates['damascus'].mineSaturationPct === 5) {
  console.log('PASS: Mine saturation below 8% was NOT demined.');
} else {
  console.error('FAIL: Damascus was demined despite <= 8%');
  process.exit(1);
}

console.log(`\n=== TEST 2: Demining > 8% Valid Execution ===`);
const initHomsMines = state1.governorates['homs'].mineSaturationPct;
console.log(`Homs initial mine saturation: ${initHomsMines}%`);
const directivesValidDemining = getDefaultTurnDirectives();
directivesValidDemining.deminingPriorityId = 'homs';

const afterState2 = executeTurnLifecycle(state1, directivesValidDemining);
const homsAfterMines = afterState2.governorates['homs'].mineSaturationPct;
console.log(`Homs after valid demining: ${homsAfterMines}% (Expected: ${initHomsMines - 8}%)`);
if (homsAfterMines === initHomsMines - 8) {
  console.log('PASS: Homs demining reduced mines by 8%.');
} else {
  console.error('FAIL: Homs demining did not reduce by 8%');
  process.exit(1);
}

console.log(`\n=== TEST 3: Power Supply Boost on Single Governorate ===`);
const baseDir = getDefaultTurnDirectives();
const stateWithoutBoost = executeTurnLifecycle(state1, baseDir);

const boostDir = getDefaultTurnDirectives();
boostDir.powerBoostGovId = 'damascus';
const stateWithBoost = executeTurnLifecycle(state1, boostDir);

const govWithout = stateWithoutBoost.governorates['damascus'];
const govWith = stateWithBoost.governorates['damascus'];

console.log(`Blackout: without=${govWithout.dailyBlackoutHours}h, with=${govWith.dailyBlackoutHours}h (diff=${govWithout.dailyBlackoutHours - govWith.dailyBlackoutHours})`);
console.log(`PRRI: without=${govWithout.prri}, with=${govWith.prri} (diff=${govWithout.prri - govWith.prri})`);
console.log(`Reconstruction: without=${govWithout.reconstructionScore}, with=${govWith.reconstructionScore} (diff=${(govWith.reconstructionScore - govWithout.reconstructionScore).toFixed(2)})`);
console.log(`Trust: without=${stateWithoutBoost.macro.civicTrust}, with=${stateWithBoost.macro.civicTrust} (diff=${stateWithBoost.macro.civicTrust - stateWithoutBoost.macro.civicTrust})`);

if (
  govWithout.dailyBlackoutHours - govWith.dailyBlackoutHours === 4 &&
  govWithout.prri - govWith.prri === 6 &&
  Math.abs(govWith.reconstructionScore - govWithout.reconstructionScore - 0.03) < 0.001 &&
  stateWithBoost.macro.civicTrust - stateWithoutBoost.macro.civicTrust === 1
) {
  console.log('PASS: Power supply boost net effects applied accurately!');
} else {
  console.error('FAIL: Net power boost effects mismatch');
  process.exit(1);
}

console.log(`\n=== TEST 4: Full 40-Turn Campaign With Both Power Boosts and Demining ===`);
let runState = createInitialGameState(777);
for (let turn = 1; turn <= 40; turn++) {
  const dir = getDefaultTurnDirectives();
  dir.wageBumpPercent = 5;
  dir.gridCapExUSD = 25_000_000;
  dir.southernPolicy = 'HISTORIC_ACCORD';

  // Find a governorate with > 8% mines to demine
  const mineCandidate = Object.values(runState.governorates).find((g) => g.mineSaturationPct > 8);
  if (mineCandidate) {
    dir.deminingPriorityId = mineCandidate.id;
  }

  // Boost power in Aleppo or Damascus
  dir.powerBoostGovId = turn % 2 === 1 ? 'aleppo' : 'damascus';

  runState = executeTurnLifecycle(runState, dir);
  if (runState.isGameOver) {
    break;
  }
}

console.log(`Completed campaign result: turnNumber = ${runState.turnNumber}, isGameOver = ${runState.isGameOver}`);
if (runState.centuryEnding) {
  console.log(`SUCCESS! Reached century ending: ${runState.centuryEnding.titleAr}`);
  console.log(`Score: ${runState.centuryEnding.finalScore}/100`);
} else if (runState.failState) {
  console.error(`FAIL: Game ended unexpectedly in fail state: ${runState.failState.titleAr}`);
  process.exit(1);
}

console.log('\nALL VERIFICATION TESTS PASSED!');

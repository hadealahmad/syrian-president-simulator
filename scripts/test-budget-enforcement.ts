import { createInitialGameState } from '../src/lib/engine/baseline';
import { getDefaultTurnDirectives, executeTurnLifecycle } from '../src/lib/engine/turn-manager';
import { calculateTurnBudget } from '../src/lib/stores/draft-store';

function runBudgetTests() {
  console.log('=== TEST 1: Initial Turn Budget Calculation ===');
  const state = createInitialGameState(100);
  const draft = getDefaultTurnDirectives();

  let budget = calculateTurnBudget(state, draft);
  console.log('Initial PC:', budget.initialPC, 'Remaining PC:', budget.remainingPC);
  console.log('Initial USD ($M):', budget.initialUSD / 1_000_000, 'Remaining USD:', budget.remainingUSD / 1_000_000);
  console.log('Initial SYP (T):', budget.initialSYP / 1_000_000_000_000, 'Remaining SYP:', budget.remainingSYP / 1_000_000_000_000);

  if (budget.committedPC !== 0) throw new Error('Expected 0 initial committed PC');
  if (budget.committedUSD !== 35_000_000) throw new Error('Expected 35M initial committed USD for default gridCapExUSD');

  console.log('=== TEST 2: Political Capital Tracking & Remaining Balance ===');
  draft.activePoliticalActions = ['ANTI_CORRUPTION_COMMISSION', 'PROPERTY_RESTITUTION_PORTAL']; // 15 + 10 = 25 PC
  budget = calculateTurnBudget(state, draft);
  console.log('Committed PC with 2 decrees:', budget.committedPC);
  if (budget.committedPC !== 25) throw new Error(`Expected 25 committed PC, got ${budget.committedPC}`);
  if (budget.remainingPC !== state.macro.politicalCapital - 25) throw new Error('Remaining PC mismatch');

  console.log('=== TEST 3: Restoring Budget Upon Toggling Off Decrees ===');
  draft.activePoliticalActions = ['ANTI_CORRUPTION_COMMISSION']; // 15 PC
  budget = calculateTurnBudget(state, draft);
  console.log('Committed PC after removing 1 decree:', budget.committedPC);
  if (budget.committedPC !== 15) throw new Error(`Expected 15 committed PC, got ${budget.committedPC}`);

  console.log('=== TEST 4: Demining & Power Boost Budget Deductions ===');
  draft.deminingPriorityId = 'homs'; // costs 20M USD + 800B SYP
  draft.powerBoostGovId = 'damascus'; // costs 10M USD + 300B SYP
  budget = calculateTurnBudget(state, draft);
  console.log('Committed USD ($M):', budget.committedUSD / 1_000_000);
  console.log('Committed SYP (T):', budget.committedSYP / 1_000_000_000_000);
  if (budget.committedUSD !== 35_000_000 + 20_000_000 + 10_000_000) {
    throw new Error(`Expected 65M committed USD, got ${budget.committedUSD}`);
  }
  if (budget.committedSYP !== 1_100_000_000_000) {
    throw new Error(`Expected 1.1T committed SYP, got ${budget.committedSYP}`);
  }

  console.log('=== TEST 5: Engine-Level Safeguard When PC Is Insufficient ===');
  const poorPCState = createInitialGameState(100);
  poorPCState.macro.politicalCapital = 5; // only 5 PC available
  const directivesWithExpensiveDecree = getDefaultTurnDirectives();
  directivesWithExpensiveDecree.propertyRestitution = 'MONETIZE_AS_STATE_LAND'; // doesn't cost PC
  directivesWithExpensiveDecree.activePoliticalActions = ['ANTI_CORRUPTION_COMMISSION']; // costs 15 PC
  const stateAfterTurn = executeTurnLifecycle(poorPCState, directivesWithExpensiveDecree);
  // Decree should NOT have been executed
  console.log('Poor PC state political capital after attempt:', stateAfterTurn.macro.politicalCapital);
  if (stateAfterTurn.macro.politicalCapital < 0) throw new Error('Political capital fell below zero');
  if (stateAfterTurn.macro.politicalCapital !== 5) {
    throw new Error(`Expected 5 PC to remain untouched, got ${stateAfterTurn.macro.politicalCapital}`);
  }

  console.log('=== TEST 6: Engine-Level Safeguard When Reserves/Treasury Are Insufficient ===');
  const bankruptState = createInitialGameState(100);
  bankruptState.macro.reservesUSD = 5_000_000; // only $5M
  bankruptState.macro.treasurySYP = 100_000_000_000; // only 0.1T
  const deminingDirectives = getDefaultTurnDirectives();
  deminingDirectives.deminingPriorityId = 'homs'; // requires 20M USD and 800B SYP
  const stateAfterBankruptTurn = executeTurnLifecycle(bankruptState, deminingDirectives);
  console.log('Homs mine saturation on bankrupt state:', stateAfterBankruptTurn.governorates['homs'].mineSaturationPct);
  // Homs had 40%, should remain 40% because country couldn't afford demining
  if (stateAfterBankruptTurn.governorates['homs'].mineSaturationPct !== 40) {
    throw new Error('Demining should not have executed on bankrupt state');
  }

  console.log('ALL BUDGET ENFORCEMENT TESTS PASSED!');
}

runBudgetTests();

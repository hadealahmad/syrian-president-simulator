import { createInitialGameState } from '../src/lib/engine/baseline';
import { getDefaultTurnDirectives, executeTurnLifecycle } from '../src/lib/engine/turn-manager';
import { auditSemiannualBudget } from '../src/lib/engine/revenues';
import { calculateTurnBudget } from '../src/lib/stores/draft-store';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAILED: ${msg}`);
  console.log('  ok:', msg);
}

function runPatronageTests() {
  console.log('=== TEST 1: Populist grant (750B SYP -> +8 PC) ===');
  {
    const state = createInitialGameState(7);
    const pc0 = state.macro.politicalCapital;
    const trust0 = state.macro.civicTrust;
    const draft = getDefaultTurnDirectives();
    draft.populistGrant = true;
    const budget = calculateTurnBudget(state, draft);
    assert(budget.committedSYP === 750_000_000_000, `preview commits 0.75T SYP (got ${budget.committedSYP})`);
    assert(budget.committedPC === -8, `preview earns 8 PC (got ${budget.committedPC})`);
    const after = executeTurnLifecycle(state, draft);
    assert(after.macro.politicalCapital === Math.min(200, pc0 + 8), `PC ${pc0} -> ${after.macro.politicalCapital}`);
    assert(after.macro.civicTrust >= trust0, 'trust did not fall');
    // Audit must carry the same SYP expenditure so rehearsal previews match
    const audit = auditSemiannualBudget(state, draft);
    assert(audit.expendedSYP - auditSemiannualBudget(state, getDefaultTurnDirectives()).expendedSYP === 750_000_000_000, 'audit carries 0.75T grant cost');
  }

  console.log('=== TEST 2: Charity fund (+3 PC/turn, persistent cost) ===');
  {
    const state = createInitialGameState(7);
    const pc0 = state.macro.politicalCapital;
    const draft = getDefaultTurnDirectives();
    draft.charityFundActive = true;
    const budget = calculateTurnBudget(state, draft);
    assert(budget.committedSYP === 250_000_000_000, 'preview commits 0.25T SYP');
    assert(budget.committedPC === -3, 'preview earns 3 PC');
    const after = executeTurnLifecycle(state, draft);
    assert(after.macro.politicalCapital === Math.min(200, pc0 + 3), `PC ${pc0} -> ${after.macro.politicalCapital}`);
  }

  console.log('=== TEST 3: Import surge ($40M -> +6 PC, blackout relief) ===');
  {
    const state = createInitialGameState(7);
    const pc0 = state.macro.politicalCapital;
    const blackout0 = state.governorates['homs'].dailyBlackoutHours;
    const draft = getDefaultTurnDirectives();
    draft.importSurge = true;
    const budget = calculateTurnBudget(state, draft);
    assert(budget.committedUSD === 35_000_000 + 40_000_000, `preview commits grid 35M + surge 40M (got ${budget.committedUSD})`);
    const after = executeTurnLifecycle(state, draft);
    assert(after.macro.politicalCapital === Math.min(200, pc0 + 6), `PC ${pc0} -> ${after.macro.politicalCapital}`);
    assert(after.governorates['homs'].dailyBlackoutHours <= blackout0, 'blackout did not worsen');
    const audit = auditSemiannualBudget(state, draft);
    assert(audit.expendedUSD - auditSemiannualBudget(state, getDefaultTurnDirectives()).expendedUSD === 40_000_000, 'audit carries $40M surge cost');
  }

  console.log('=== TEST 4: Unaffordable patronage is skipped safely ===');
  {
    const state = createInitialGameState(7);
    state.macro.treasurySYP = 0;
    state.macro.reservesUSD = 1_000_000; // cannot cover 750B SYP via FX either
    const pc0 = state.macro.politicalCapital;
    const draft = getDefaultTurnDirectives();
    draft.populistGrant = true;
    draft.charityFundActive = true;
    draft.importSurge = true;
    const after = executeTurnLifecycle(state, draft);
    assert(after.macro.politicalCapital === pc0, `PC untouched at ${after.macro.politicalCapital}`);
  }

  console.log('=== TEST 5: Loan termination (buyback -> +6 PC, +4 leverage) ===');
  {
    const state = createInitialGameState(7);
    const loan = state.foreignLoans.find((l) => !l.isSigned)!;
    // Sign it first via a draft, then terminate next turn
    const signDraft = getDefaultTurnDirectives();
    signDraft.signedLoanIds = [loan.id];
    const signed = executeTurnLifecycle(state, signDraft);
    const signedLoan = signed.foreignLoans.find((l) => l.id === loan.id)!;
    assert(signedLoan.isSigned, 'loan signed');
    const remaining = signedLoan.remainingPrincipalUSD ?? signedLoan.disbursementUSD;
    signed.macro.reservesUSD = remaining + 50_000_000; // ensure full affordability
    const pc0 = signed.macro.politicalCapital;
    const lev0 = signed.macro.sovereignLeverage ?? 65;
    const debt0 = signed.macro.sovereignDebtUSD ?? 0;
    const termDraft = getDefaultTurnDirectives();
    termDraft.terminatedLoanIds = [loan.id];
    const budget = calculateTurnBudget(signed, termDraft);
    assert(budget.committedUSD === 35_000_000 + remaining, `preview commits grid + full principal (got ${budget.committedUSD})`);
    const after = executeTurnLifecycle(signed, termDraft);
    const done = after.foreignLoans.find((l) => l.id === loan.id)!;
    assert((done.remainingPrincipalUSD ?? -1) === 0, 'principal fully extinguished');
    assert(after.macro.politicalCapital === Math.min(200, pc0 + 6), `PC ${pc0} -> ${after.macro.politicalCapital}`);
    assert((after.macro.sovereignLeverage ?? 0) === Math.min(65, lev0 + 4), `leverage ${lev0} -> ${after.macro.sovereignLeverage}`);
    assert((after.macro.sovereignDebtUSD ?? -1) === Math.max(0, debt0 - remaining), 'debt reduced by principal');
  }

  console.log('=== TEST 6: Partial-funding termination is all-or-nothing ===');
  {
    const state = createInitialGameState(7);
    const loan = state.foreignLoans.find((l) => !l.isSigned)!;
    const signDraft = getDefaultTurnDirectives();
    signDraft.signedLoanIds = [loan.id];
    const signed = executeTurnLifecycle(state, signDraft);
    const remaining = signed.foreignLoans.find((l) => l.id === loan.id)!.remainingPrincipalUSD ?? 0;
    signed.macro.reservesUSD = Math.max(0, remaining - 1); // $1 short
    const termDraft = getDefaultTurnDirectives();
    termDraft.terminatedLoanIds = [loan.id];
    const after = executeTurnLifecycle(signed, termDraft);
    const kept = after.foreignLoans.find((l) => l.id === loan.id)!;
    assert((kept.remainingPrincipalUSD ?? 0) === remaining, 'loan untouched when reserves fall short');
  }

  console.log('=== TEST 7: PC cap holds at 200 under stacked gains ===');
  {
    const state = createInitialGameState(7);
    state.macro.politicalCapital = 197;
    const draft = getDefaultTurnDirectives();
    draft.populistGrant = true;
    draft.charityFundActive = true;
    draft.importSurge = true;
    draft.activePoliticalActions = ['CABINET_HEARING', 'UNITY_SPEECH', 'OPPOSITION_SEATS'];
    const after = executeTurnLifecycle(state, draft);
    assert(after.macro.politicalCapital <= 200, `PC capped at ${after.macro.politicalCapital}`);
    const budget = calculateTurnBudget(state, draft);
    assert(budget.remainingPC <= 200, `preview capped at ${budget.remainingPC}`);
  }

  console.log('ALL PC PATRONAGE TESTS PASSED!');
}

runPatronageTests();

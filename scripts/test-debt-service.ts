import { createInitialGameState } from '../src/lib/engine/baseline';
import { executeTurnLifecycle, getDefaultTurnDirectives } from '../src/lib/engine/turn-manager';
import { auditSemiannualBudget } from '../src/lib/engine/revenues';

let failures = 0;
function check(name: string, cond: boolean, detail: string = '') {
  if (cond) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name} ${detail}`);
    failures++;
  }
}

console.log('=== TEST 1: Baseline service is the flat legacy coupon ===');
{
  const s = createInitialGameState(100);
  const audit = auditSemiannualBudget(s, getDefaultTurnDirectives());
  check('legacy coupon $45M', audit.debtServiceUSD === 45_000_000, `got ${audit.debtServiceUSD}`);
  check('no mortgage drain', audit.mortgageDrainUSD === 0, `got ${audit.mortgageDrainUSD}`);
  check('no repayment', audit.debtRepaymentPaidUSD === 0, `got ${audit.debtRepaymentPaidUSD}`);
}

console.log('\n=== TEST 2: Signing initializes principal + tracking ===');
{
  const s = createInitialGameState(100);
  const dir = getDefaultTurnDirectives();
  dir.signedLoanIds = ['loan_imf_wb'];
  const after = executeTurnLifecycle(s, dir);
  const loan = after.foreignLoans.find((l) => l.id === 'loan_imf_wb')!;
  check('signed flag', loan.isSigned === true);
  check('remaining = disbursement', loan.remainingPrincipalUSD === 500_000_000, `got ${loan.remainingPrincipalUSD}`);
  check('signedTurn stamped', loan.signedTurn === s.turnNumber, `got ${loan.signedTurn}`);
  check('debt stock +500M', after.macro.sovereignDebtUSD === 6_100_000_000 + 500_000_000, `got ${after.macro.sovereignDebtUSD}`);
  check('leverage -8', after.macro.sovereignLeverage === 65 - 8, `got ${after.macro.sovereignLeverage}`);
}

console.log('\n=== TEST 3: Per-loan interest starts the following turn ===');
{
  const s = createInitialGameState(100);
  const dir = getDefaultTurnDirectives();
  dir.signedLoanIds = ['loan_imf_wb']; // 2.5%
  const afterSign = executeTurnLifecycle(s, dir);
  check('no service in signing turn', afterSign.lastTurnAudit!.debtServiceUSD === 45_000_000, `got ${afterSign.lastTurnAudit!.debtServiceUSD}`);
  const afterNext = executeTurnLifecycle(afterSign, getDefaultTurnDirectives());
  // 45M + 500M * 2.5% / 2 = 51.25M
  check('IMF service $51.25M next turn', afterNext.lastTurnAudit!.debtServiceUSD === 51_250_000, `got ${afterNext.lastTurnAudit!.debtServiceUSD}`);
}

console.log('\n=== TEST 4: Mortgage revenue drain ===');
{
  const s = createInitialGameState(100);
  const dir = getDefaultTurnDirectives();
  dir.executedMortgageIds = ['mortgage_tartus_port']; // -$40M/turn
  const after = executeTurnLifecycle(s, dir);
  check('tartus drain $40M', after.lastTurnAudit!.mortgageDrainUSD === 40_000_000, `got ${after.lastTurnAudit!.mortgageDrainUSD}`);
  const plain = executeTurnLifecycle(createInitialGameState(100), getDefaultTurnDirectives());
  const diff = plain.lastTurnAudit!.netUSDDelta - after.lastTurnAudit!.netUSDDelta;
  // Pre-existing port concession cut ($24M->$6M = -$18M at source) PLUS new
  // $40M/turn drain: net delta is -$58M vs plain. The +$450M disbursement lands
  // directly in reserves (turn-manager), not through the audit.
  check('net reflects -18M port cut -40M drain', diff === 58_000_000, `got ${diff}`);
  check('reserves +450M -58M', after.macro.reservesUSD - plain.macro.reservesUSD === 392_000_000,
    `got ${after.macro.reservesUSD - plain.macro.reservesUSD}`);
}

console.log('\n=== TEST 5: Early repayment, highest-rate-first ===');
{
  const s = createInitialGameState(100);
  s.macro.reservesUSD = 2_000_000_000;
  const dir = getDefaultTurnDirectives();
  dir.signedLoanIds = ['loan_imf_wb', 'loan_gulf_swf', 'loan_eastern_credit']; // 500+400+350, PC 45/50
  const signed = executeTurnLifecycle(s, dir);
  check('debt stock 8.05B', signed.macro.sovereignDebtUSD === 7_350_000_000, `got ${signed.macro.sovereignDebtUSD}`);
  const repay = getDefaultTurnDirectives();
  repay.extraDebtRepaymentUSD = 200_000_000;
  const after = executeTurnLifecycle(signed, repay);
  const eastern = after.foreignLoans.find((l) => l.id === 'loan_eastern_credit')!;
  const gulf = after.foreignLoans.find((l) => l.id === 'loan_gulf_swf')!;
  const imf = after.foreignLoans.find((l) => l.id === 'loan_imf_wb')!;
  check('eastern (4%) paid first: 150M left', eastern.remainingPrincipalUSD === 150_000_000, `got ${eastern.remainingPrincipalUSD}`);
  check('gulf untouched', gulf.remainingPrincipalUSD === 400_000_000, `got ${gulf.remainingPrincipalUSD}`);
  check('imf untouched', imf.remainingPrincipalUSD === 500_000_000, `got ${imf.remainingPrincipalUSD}`);
  check('stock -200M', after.macro.sovereignDebtUSD === 7_350_000_000 - 200_000_000, `got ${after.macro.sovereignDebtUSD}`);
  check('audit paid 200M', after.lastTurnAudit!.debtRepaymentPaidUSD === 200_000_000, `got ${after.lastTurnAudit!.debtRepaymentPaidUSD}`);
  // leverage: 65 -8*3 = 41, +4 recovery = 45
  check('leverage 41+4=45', after.macro.sovereignLeverage === 45, `got ${after.macro.sovereignLeverage}`);
}

console.log('\n=== TEST 6: Repayment clamps (reserves + remaining) ===');
{
  const s = createInitialGameState(100);
  const dir = getDefaultTurnDirectives();
  dir.signedLoanIds = ['loan_gulf_swf'];
  const signed = executeTurnLifecycle(s, dir);
  const repay = getDefaultTurnDirectives();
  repay.extraDebtRepaymentUSD = 900_000_000; // more than the 400M owed
  const after = executeTurnLifecycle(signed, repay);
  const gulf = after.foreignLoans.find((l) => l.id === 'loan_gulf_swf')!;
  check('clamped to remaining 400M', gulf.remainingPrincipalUSD === 0, `got ${gulf.remainingPrincipalUSD}`);
  check('audit paid 400M', after.lastTurnAudit!.debtRepaymentPaidUSD === 400_000_000, `got ${after.lastTurnAudit!.debtRepaymentPaidUSD}`);
}

console.log('\n=== TEST 7: Pre-feature save compat (no tracking fields) ===');
{
  const s = createInitialGameState(100);
  const loan = s.foreignLoans.find((l) => l.id === 'loan_imf_wb')!;
  loan.isSigned = true; // as if signed before tracking existed
  delete (loan as any).remainingPrincipalUSD;
  delete (loan as any).signedTurn;
  const audit = auditSemiannualBudget(s, getDefaultTurnDirectives());
  check('legacy-signed loan serviced at full principal', audit.debtServiceUSD === 51_250_000, `got ${audit.debtServiceUSD}`);
}

if (failures > 0) {
  console.error(`\n${failures} DEBT TEST(S) FAILED`);
  process.exit(1);
}
console.log('\nALL DEBT SERVICE TESTS PASSED!');

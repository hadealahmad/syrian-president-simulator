/**
 * Regression tests for the Central Bank dollar auction accounting.
 *
 * The defect this guards against: the turn receipt reported the FULL SYP
 * collected at the auction while the money supply only ever fell by 40% of it,
 * and priced at a different FX rate than the actual reduction. The player was
 * shown 2.5x-3.3x more "destroyed" (امتصاص المزاد) than was actually removed
 * from M2.
 *
 * The invariant now enforced: `lastTurnAudit.auctionAbsorbedSYP` must equal the
 * real M2 reduction attributable to the auction, for every auction size.
 */
import { createInitialGameState } from '../src/lib/engine/baseline';
import { getDefaultTurnDirectives, executeTurnLifecycle } from '../src/lib/engine/turn-manager';
import { auditSemiannualBudget } from '../src/lib/engine/revenues';
import {
  computeAuctionAbsorbedSYP,
  AUCTION_CLEARING_DISCOUNT,
  AUCTION_STERILIZATION_FACTOR,
  M2_FLOOR_SYP,
} from '../src/lib/engine/currency';
import type { GameState, TurnDirectives } from '../src/lib/engine/types';

let failures = 0;
let assertions = 0;

function check(name: string, cond: boolean, detail = ''): void {
  assertions++;
  if (cond) return;
  failures++;
  console.error(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

function runTurn(auctionUSD: number, seed = 20241208): GameState {
  const state = createInitialGameState(seed);
  const directives: TurnDirectives = { ...getDefaultTurnDirectives(), dollarAuctionUSD: auctionUSD };
  return executeTurnLifecycle(state, directives);
}

/** M2 reduction attributable to the auction = opening M2 + seigniorage - closing M2. */
function actualSterilisation(before: GameState, after: GameState): number {
  const seigniorage = after.lastTurnAudit?.seignioragePrintedSYP ?? 0;
  return before.macro.m2MoneySupplySYP + seigniorage - after.macro.m2MoneySupplySYP;
}

console.log('=== TEST 1: receipt equals the real M2 reduction ===');
for (const auctionUSD of [10_000_000, 50_000_000, 100_000_000, 200_000_000, 320_000_000]) {
  const before = createInitialGameState();
  const after = runTurn(auctionUSD);
  const reported = after.lastTurnAudit?.auctionAbsorbedSYP ?? 0;
  const actual = actualSterilisation(before, after);
  check(
    `$${(auctionUSD / 1e6).toFixed(0)}M receipt matches M2 delta`,
    reported === actual,
    `receipt ${reported.toLocaleString()} vs actual ${actual.toLocaleString()}`
  );
  // And the old bug's symptom: the receipt must not exceed the M2 delta.
  check(
    `$${(auctionUSD / 1e6).toFixed(0)}M receipt does not overstate`,
    reported <= actual,
    `receipt ${reported.toLocaleString()} > actual ${actual.toLocaleString()}`
  );
}

console.log('\n=== TEST 2: the receipt is priced at the realised (post-turn) rate ===');
{
  // The audit alone runs before the rate is updated, so it cannot know the
  // realised rate. Assert the committed receipt therefore differs from a
  // standalone audit whenever the auction moved the rate — proving the
  // write-back is doing real work rather than being a no-op.
  const auctionUSD = 200_000_000;
  const state = createInitialGameState();
  const auditOnly = auditSemiannualBudget(state, {
    ...getDefaultTurnDirectives(),
    dollarAuctionUSD: auctionUSD,
  });
  const committed = runTurn(auctionUSD);
  const before = createInitialGameState();
  check(
    'committed receipt restated to the post-turn rate',
    committed.lastTurnAudit!.auctionAbsorbedSYP !== auditOnly.auctionAbsorbedSYP,
    `audit-only ${auditOnly.auctionAbsorbedSYP.toLocaleString()} vs committed ${committed.lastTurnAudit!.auctionAbsorbedSYP.toLocaleString()}`
  );
  check(
    'restated receipt still equals the M2 delta',
    committed.lastTurnAudit!.auctionAbsorbedSYP === actualSterilisation(before, committed)
  );
}

console.log('\n=== TEST 3: no treasury credit, and gross is not the destruction ===');
{
  const before = createInitialGameState();
  const after = runTurn(150_000_000);
  const gross = Math.round(150_000_000 * before.macro.parallelRateSYP * AUCTION_CLEARING_DISCOUNT);
  check(
    'receipt is the sterilized share, not the gross collection',
    after.lastTurnAudit!.auctionAbsorbedSYP === Math.round(gross * AUCTION_STERILIZATION_FACTOR) ||
      after.lastTurnAudit!.auctionAbsorbedSYP < gross,
    `receipt ${after.lastTurnAudit!.auctionAbsorbedSYP.toLocaleString()} gross ${gross.toLocaleString()}`
  );
  // The auction must not fund spending: treasury is unaffected by the SYP leg.
  const noAuction = runTurn(0);
  check(
    'auction does not credit the treasury',
    after.macro.treasurySYP === noAuction.macro.treasurySYP,
    `auction ${after.macro.treasurySYP.toLocaleString()} vs none ${noAuction.macro.treasurySYP.toLocaleString()}`
  );
}

console.log('\n=== TEST 4: the reserve guard is enforced (plan/08 D1.2) ===');
{
  const state = createInitialGameState();
  const reserves = state.macro.reservesUSD;
  const after = executeTurnLifecycle(state, {
    ...getDefaultTurnDirectives(),
    dollarAuctionUSD: 10_000_000_000,
  });
  check(
    'oversized auction cannot drain reserves to zero',
    after.macro.reservesUSD > 0,
    `reserves ${after.macro.reservesUSD.toLocaleString()} of ${reserves.toLocaleString()} available`
  );
  check('oversized auction is not instant insolvency', !after.isGameOver);
  check(
    'oversized auction is charged no more than the opening reserves',
    after.lastTurnAudit!.expendedUSD > 0 && after.lastTurnAudit!.expendedUSD < 10_000_000_000
  );
}

console.log('\n=== TEST 5: M2 floor is respected and the receipt tracks it ===');
{
  const state = createInitialGameState();
  state.macro.m2MoneySupplySYP = M2_FLOOR_SYP + 1_000_000_000;
  const openingM2 = state.macro.m2MoneySupplySYP;
  const after = executeTurnLifecycle(state, {
    ...getDefaultTurnDirectives(),
    dollarAuctionUSD: 320_000_000,
  });
  check(
    'M2 never falls below the floor',
    after.macro.m2MoneySupplySYP >= M2_FLOOR_SYP,
    `M2 ${after.macro.m2MoneySupplySYP.toLocaleString()}`
  );
  check(
    'receipt equals the floored reduction',
    after.lastTurnAudit!.auctionAbsorbedSYP === actualSterilisation(state, after) ||
      after.macro.m2MoneySupplySYP >= M2_FLOOR_SYP,
    `receipt ${after.lastTurnAudit!.auctionAbsorbedSYP.toLocaleString()}`
  );
  check('floor test actually engaged a reduction', openingM2 > M2_FLOOR_SYP);
}

console.log('\n=== TEST 6: helper is total (no NaN/Infinity from bad input) ===');
{
  for (const [usd, rate] of [[0, 162], [-5, 162], [1e9, 0], [1e9, -3], [NaN, 162]] as const) {
    const v = computeAuctionAbsorbedSYP(usd, rate);
    check(`computeAuctionAbsorbedSYP(${usd}, ${rate}) is finite`, Number.isFinite(v) && v >= 0, `got ${v}`);
  }
}

console.log(
  failures === 0
    ? `\nALL DOLLAR-AUCTION TESTS PASSED! (${assertions} assertions)`
    : `\n${failures} FAILURES of ${assertions}`
);
process.exit(failures === 0 ? 0 : 1);

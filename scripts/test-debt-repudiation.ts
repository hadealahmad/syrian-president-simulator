import { createInitialGameState } from '../src/lib/engine/baseline';
import { getDefaultTurnDirectives } from '../src/lib/engine/turn-manager';
import { executeTurnLifecycle } from '../src/lib/engine/turn-manager';
import { drawEventsForTurn } from '../src/lib/engine/events';
import { PRNG } from '../src/lib/engine/prng';

const assert = (c: boolean, m: string) => { if (!c) { console.error('FAIL:', m); process.exit(1); } console.log('ok:', m); };

// 1. baseline ledgers
let s = createInitialGameState(1);
assert(s.macro.sovereignDebtUSD === 6_100_000_000, `recognized start $6.1B (got ${s.macro.sovereignDebtUSD})`);
assert(s.macro.iranOilDebtUSD === 7_000_000_000, 'iran ledger $7B');

// 2. coupon collected turn 1
let d = getDefaultTurnDirectives();
let s1 = executeTurnLifecycle(createInitialGameState(1), d);
assert(s1.lastTurnAudit!.iranOilCouponUSD === 25_000_000, `coupon $25M (got ${s1.lastTurnAudit!.iranOilCouponUSD})`);

// 3. informal = free ticket
s = createInitialGameState(1);
d = getDefaultTurnDirectives(); d.activePoliticalActions = ['REPUDIATE_IRAN_INFORMAL'];
const pc0 = s.macro.politicalCapital;
s = executeTurnLifecycle(s, d);
assert(s.macro.politicalCapital === Math.min(200, pc0 + 6), 'informal +6 PC');
assert(s.flags.Debt_Repudiated_Iran_Informal === 1, 'informal flag set');
assert(s.macro.iranOilDebtUSD === 7_000_000_000, 'informal voids nothing');

// 4. formal voids coupon + unrest
s = createInitialGameState(1);
d = getDefaultTurnDirectives(); d.activePoliticalActions = ['REPUDIATE_IRAN_FORMAL'];
s = executeTurnLifecycle(s, d);
assert(s.macro.iranOilDebtUSD === 0, 'formal voids ledger');
assert(s.lastTurnAudit!.iranOilCouponUSD === 0, 'coupon zero after repudiation');
assert(s.governorates['as_suwayda'].prri >= 6, 'suwayda unrest applied');
assert(s.governorates['hasakeh'].prri >= 6, 'hasakah unrest applied');

// 5. russia voids recognized + coast
s = createInitialGameState(1);
d = getDefaultTurnDirectives(); d.activePoliticalActions = ['REPUDIATE_RUSSIA'];
s = executeTurnLifecycle(s, d);
assert(s.macro.sovereignDebtUSD === 6_100_000_000 - 1_500_000_000, `russia voids $1.5B (got ${s.macro.sovereignDebtUSD})`);
assert(s.governorates['latakia'].prri >= 6 && s.governorates['tartus'].prri >= 6, 'coast unrest applied');

// 6. paris: trust hit + leverage + loan gate
s = createInitialGameState(1);
const trust0 = s.macro.civicTrust;
d = getDefaultTurnDirectives(); d.activePoliticalActions = ['REPUDIATE_PARIS']; d.signedLoanIds = ['loan_imf_wb', 'loan_gulf_swf', 'loan_eastern_credit'];
s = executeTurnLifecycle(s, d);
assert(s.macro.sovereignDebtUSD === 6_100_000_000 - 4_600_000_000 + 350_000_000, `paris voids $4.6B, eastern loan +$350M nets (got ${s.macro.sovereignDebtUSD})`);
assert(s.macro.civicTrust === trust0 - 4, 'paris -4 trust');
assert(s.macro.sovereignLeverage === 65 - 8 - 8, `leverage 65-8(paris)-8(eastern loan) = ${s.macro.sovereignLeverage}`);
const imf = s.foreignLoans.find(l => l.id === 'loan_imf_wb')!;
const gulf = s.foreignLoans.find(l => l.id === 'loan_gulf_swf')!;
const east = s.foreignLoans.find(l => l.id === 'loan_eastern_credit')!;
assert(!imf.isSigned && !gulf.isSigned && east.isSigned, 'IFI+Gulf blocked, Eastern open');

// 7. disruption events gated on flags
s = createInitialGameState(1);
s.turnNumber = 6; s.flags.Debt_Repudiated_Russia = 1;
const prng = new PRNG(7);
let seen = new Set<string>();
for (let i = 0; i < 400; i++) for (const e of drawEventsForTurn(s, prng)) seen.add(e.id);
assert(seen.has('event_debt_coast_fuel_sabotage'), 'coast sabotage event drawable');
s.flags.Debt_Repudiated_Iran_Formal = 1;
seen = new Set();
for (let i = 0; i < 400; i++) for (const e of drawEventsForTurn(s, prng)) seen.add(e.id);
assert(seen.has('event_debt_suwayda_contraband_surge'), 'suwayda event drawable');
assert(seen.has('event_debt_hasakah_oil_wheat_squeeze'), 'hasakah event drawable');
console.log('ALL DEBT MECHANIC CHECKS PASSED');

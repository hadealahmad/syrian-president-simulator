/**
 * Regression tests for the audit's event findings (DECK#1-DECK#17 and the
 * duplicate ENGINE#7/8, STORES#1/2, UI#1/2 reports).
 *
 * The soft-lock and the repeatable crisis penalty are the two critical bugs:
 * the modal must use the engine's own affordability verdict, and the penalty
 * path must remove the card and be idempotent.
 */
import { createInitialGameState } from '../src/lib/engine/baseline';
import {
  ALL_EVENTS,
  MONETARY_EVENTS,
  ENERGY_EVENTS,
  SERVICES_EVENTS,
  SOVEREIGNTY_EVENTS,
} from '../src/lib/engine/deck';
import {
  applyUnresolvedCrisisPenalty,
  canAffordEventOption,
  drawEventsForTurn,
  resolveEventOption,
  validateOptionAvailability,
} from '../src/lib/engine/events';
import { PRNG } from '../src/lib/engine/prng';
import type { EventCard, EventOption, GameState } from '../src/lib/engine/types';

let failures = 0;
let assertions = 0;

function check(name: string, cond: boolean, detail = ''): void {
  assertions++;
  if (cond) return;
  failures++;
  console.error(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

function option(cardId: string, optionId: string): { card: EventCard; opt: EventOption } {
  const card = ALL_EVENTS.find((c) => c.id === cardId)!;
  const opt = card.options.find((o) => o.id === optionId)!;
  if (!card || !opt) throw new Error(`Missing fixture ${cardId}/${optionId}`);
  return { card, opt };
}

function richState(): GameState {
  const state = createInitialGameState(4242);
  state.macro.reservesUSD = 1_000_000_000;
  state.macro.treasurySYP = 1_000_000_000_000;
  state.macro.politicalCapital = 200;
  state.turnNumber = 30;
  return state;
}

// ---------------------------------------------------------------------------
// DECK#1 / ENGINE#8 / STORES#1 / UI#1 — the modal's affordability gate must be
// the engine's gate, including the SYP leg and its FX cover.
// ---------------------------------------------------------------------------
console.log('=== DECK#1: SYP-only options are blocked by the shared affordability gate ===');
{
  const state = createInitialGameState(1);
  state.macro.treasurySYP = 2_000_000_000;
  state.macro.reservesUSD = 10_000_000;
  state.macro.politicalCapital = 0;

  const { opt } = option('event_11_poultry_feed_shock', 'opt_subsidize_feed');
  const verdict = canAffordEventOption(state, opt);
  check('35B SYP option is not offered against 2B treasury + $10M', !verdict.ok);
  check('the deficit reason names the treasury liquidity gap', !!verdict.reasonAr?.includes('الخزينة'), verdict.reasonAr);
  check('boolean wrapper agrees with the verdict', validateOptionAvailability(state, opt) === false);

  // No option on the card is affordable: the modal must fall through to the
  // incapacity-penalty path instead of enabling a dead option.
  const card = ALL_EVENTS.find((c) => c.id === 'event_11_poultry_feed_shock')!;
  const anyAffordable = card.options.some((o) => canAffordEventOption(state, o).ok);
  check('event_11 exposes no selectable option at this balance', !anyAffordable);

  // The old modal only checked PC and USD, so this exact option was enabled.
  const oldStyleAffordable = opt.costPC <= 0 && opt.costUSD <= 0;
  check('old PC+USD-only check would have enabled the dead option', oldStyleAffordable);
}

console.log('=== DECK#1: an affordable SYP option is still offered and resolves ===');
{
  const state = createInitialGameState(2);
  state.macro.treasurySYP = 40_000_000_000;
  state.macro.reservesUSD = 320_000_000;
  state.macro.politicalCapital = 10;
  const { opt } = option('event_11_poultry_feed_shock', 'opt_subsidize_feed');
  check('SYP option is affordable with a funded treasury', canAffordEventOption(state, opt).ok);
  const before = state.macro.treasurySYP;
  resolveEventOption(state, 'event_11_poultry_feed_shock', 'opt_subsidize_feed');
  check('the funded option actually charges the treasury', state.macro.treasurySYP === before - 35_000_000_000);
}

// ---------------------------------------------------------------------------
// DECK#2 / ENGINE#7 / STORES#2 / UI#2 — the penalty must clear the event, be
// idempotent, recompute tiers, and block a later "benefit" resolution.
// ---------------------------------------------------------------------------
console.log('=== DECK#2: unresolved-crisis penalty ===');
{
  const state = createInitialGameState(3);
  state.macro.civicTrust = 50;
  state.macro.politicalCapital = 50;
  state.macro.nationalRRI = 40;
  state.activeEvents = [ALL_EVENTS.find((c) => c.id === 'event_10_medical_resignation')!];
  const gov = state.governorates['damascus'];
  gov.prri = 72;
  gov.tier = 'RIOT'; // 72 is RIOT; +15 → 87 must become REVOLT

  applyUnresolvedCrisisPenalty(state, 'event_10_medical_resignation');
  check('penalty removes the active card', state.activeEvents.length === 0);
  check('penalty sets the failed flag', state.flags['event_failed_event_10_medical_resignation'] === 1);
  check('penalty recomputes the governorate tier', gov.tier === 'REVOLT', `got ${gov.tier}`);

  const trustAfter = state.macro.civicTrust;
  const pcAfter = state.macro.politicalCapital;
  const rriAfter = state.macro.nationalRRI;
  const prriAfter = gov.prri;

  applyUnresolvedCrisisPenalty(state, 'event_10_medical_resignation');
  check('second penalty call does not stack trust loss', state.macro.civicTrust === trustAfter);
  check('second penalty call does not stack PC loss', state.macro.politicalCapital === pcAfter);
  check('second penalty call does not stack RRI', state.macro.nationalRRI === rriAfter);
  check('second penalty call does not stack governorate PRRI', gov.prri === prriAfter);

  // The failed event must not pay out its benefits afterwards.
  state.macro.reservesUSD = 1_000_000_000;
  state.macro.politicalCapital = 200;
  const trustBeforeResolve = state.macro.civicTrust;
  resolveEventOption(state, 'event_10_medical_resignation', 'opt_dollar_stipend');
  check('failed event cannot be resolved for its benefits', state.macro.civicTrust === trustBeforeResolve);
}

// ---------------------------------------------------------------------------
// DECK#3 — the FX cover used by the affordability check is actually debited.
// ---------------------------------------------------------------------------
console.log('=== DECK#3: SYP shortfall is charged to FX reserves ===');
{
  const state = createInitialGameState(4);
  state.macro.treasurySYP = 0;
  state.macro.reservesUSD = 300_000_000;
  state.macro.politicalCapital = 200;
  const rate = state.macro.parallelRateSYP;
  const costSYP = 22_000_000_000;
  const expectedReserveDebit = costSYP / Math.max(1, rate);

  resolveEventOption(state, 'event_s01_lajat_siege', 'opt_historic_accord');
  check('treasury is not pushed into a new overdraft', state.macro.treasurySYP === 0);
  check(
    'reserves pay the SYP shortfall at the parallel rate',
    Math.abs(state.macro.reservesUSD - (300_000_000 - expectedReserveDebit)) < 1,
    `got $${state.macro.reservesUSD}`
  );
}

console.log('=== DECK#3: a partly funded treasury only draws FX for the remainder ===');
{
  const state = createInitialGameState(5);
  state.macro.treasurySYP = 10_000_000_000;
  state.macro.reservesUSD = 300_000_000;
  state.macro.politicalCapital = 200;
  const rate = state.macro.parallelRateSYP;
  const expectedReserveDebit = 12_000_000_000 / Math.max(1, rate);

  resolveEventOption(state, 'event_s01_lajat_siege', 'opt_historic_accord');
  check('treasury is drained to zero, not below', state.macro.treasurySYP === 0);
  check(
    'only the uncovered remainder comes from reserves',
    Math.abs(state.macro.reservesUSD - (300_000_000 - expectedReserveDebit)) < 1,
    `got $${state.macro.reservesUSD}`
  );
}

// ---------------------------------------------------------------------------
// DECK#4 — debt-repudiation prices are new lira, not old lira (×100).
// ---------------------------------------------------------------------------
console.log('=== DECK#4: debt-event prices are new-lira values ===');
{
  const cases: Array<[string, string, number]> = [
    ['event_debt_coast_fuel_sabotage', 'opt_coast_security_sweep', 4_000_000_000],
    ['event_debt_suwayda_contraband_surge', 'opt_suwayda_border_crackdown', 3_000_000_000],
    ['event_debt_hasakah_oil_wheat_squeeze', 'opt_hasakah_tribal_pact', 2_000_000_000],
  ];
  for (const [cardId, optId, expected] of cases) {
    const { opt } = option(cardId, optId);
    check(`${optId} is ${expected} new SYP`, opt.costSYP === expected, `got ${opt.costSYP}`);
  }

  // No card may be priced on the old-lira scale: the baseline treasury is 42B.
  const implausible = ALL_EVENTS.flatMap((c) =>
    c.options.filter((o) => o.costSYP > 40_000_000_000).map((o) => `${c.id}/${o.id}=${o.costSYP}`)
  );
  check('every costSYP is within the new-lira scale', implausible.length === 0, implausible.join(', '));
}

// ---------------------------------------------------------------------------
// DECK#5 — scripted/quest cards never enter the uniform random pool.
// ---------------------------------------------------------------------------
console.log('=== DECK#5: scripted cards are excluded from random draws ===');
{
  const SCRIPTED = [
    'event_01_grain_corridor',
    'event_02_tanker_interdiction',
    'event_05_bab_el_mandeb',
    'event_s01_lajat_siege',
    'event_d02_golan_incursion',
  ];
  const state = createInitialGameState(6);
  state.turnNumber = 3;
  const prng = new PRNG(777);
  const seen = new Set<string>();
  for (let i = 0; i < 600; i++) {
    for (const card of drawEventsForTurn(state, prng)) seen.add(card.id);
  }
  const leaked = SCRIPTED.filter((id) => seen.has(id));
  check('no scripted card leaks into the random pool', leaked.length === 0, leaked.join(', '));
  check('the random pool still draws non-scripted cards', seen.size > 5, `only ${seen.size} distinct`);

  // Each card must still arrive on its own scheduled turn.
  const scheduled: Array<[number, string]> = [
    [2, 'event_01_grain_corridor'],
    [4, 'event_02_tanker_interdiction'],
    [5, 'event_05_bab_el_mandeb'],
    [7, 'event_s01_lajat_siege'],
    [10, 'event_d02_golan_incursion'],
  ];
  for (const [turn, id] of scheduled) {
    const s = createInitialGameState(7);
    s.turnNumber = turn;
    const drawn = drawEventsForTurn(s, new PRNG(99));
    check(`scripted ${id} fires on turn ${turn}`, drawn.some((c) => c.id === id));
  }
}

// ---------------------------------------------------------------------------
// DECK#6 — exchange-rate options move the official peg.
// ---------------------------------------------------------------------------
console.log('=== DECK#6: rate options call adjustOfficialPeg ===');
{
  const state = richState();
  state.macro.officialRateSYP = 135;
  state.macro.parallelRateSYP = 162;
  resolveEventOption(state, 'event_03_beirut_banking', 'opt_align_rate');
  check('opt_align_rate closes the official/parallel gap', state.macro.officialRateSYP === 162, `got ${state.macro.officialRateSYP}`);
}
{
  const state = richState();
  state.macro.officialRateSYP = 135;
  state.macro.parallelRateSYP = 300;
  resolveEventOption(state, 'event_08_central_bank_float', 'opt_managed_float');
  check('opt_managed_float unifies the official rate with the market', state.macro.officialRateSYP === 300, `got ${state.macro.officialRateSYP}`);
}

// ---------------------------------------------------------------------------
// DECK#7 — debt/asset options touch the sovereign-debt ledgers.
// ---------------------------------------------------------------------------
console.log('=== DECK#7: sovereign debt, leverage and mortgages ===');
{
  const state = richState();
  const debt0 = state.macro.sovereignDebtUSD;
  const lev0 = state.macro.sovereignLeverage;
  resolveEventOption(state, 'event_01_grain_corridor', 'opt_swap');
  check('opt_swap adds the promised $290M external debt', state.macro.sovereignDebtUSD === debt0 + 290_000_000, `got ${state.macro.sovereignDebtUSD}`);
  check('opt_swap drops the sovereignty index by 15', state.macro.sovereignLeverage === lev0 - 15, `got ${state.macro.sovereignLeverage}`);
}
{
  const state = richState();
  const debt0 = state.macro.sovereignDebtUSD;
  resolveEventOption(state, 'event_04_creditor_ultimatum', 'opt_token_payment');
  check('opt_token_payment retires the paid $90M', state.macro.sovereignDebtUSD === debt0 - 90_000_000, `got ${state.macro.sovereignDebtUSD}`);
}
{
  const state = richState();
  const debt0 = state.macro.sovereignDebtUSD;
  const phosphate = state.sovereignMortgages.find((m) => m.id === 'mortgage_khneifis_phosphate')!;
  resolveEventOption(state, 'event_04_creditor_ultimatum', 'opt_asset_mortgage');
  check('opt_asset_mortgage pledges the concession asset', phosphate.isMortgaged === true);
  check(
    'opt_asset_mortgage extinguishes debt worth the concession',
    state.macro.sovereignDebtUSD === debt0 - phosphate.immediateCashUSD,
    `got ${state.macro.sovereignDebtUSD}`
  );
}

// ---------------------------------------------------------------------------
// DECK#8 — reconstructionScore is on the 0-1 scale.
// ---------------------------------------------------------------------------
console.log('=== DECK#8: Deir ez-Zor reconstruction trigger scale ===');
{
  const card = ENERGY_EVENTS.find((c) => c.id === 'event_15_deir_ez_zor_pipeline_leak')!;
  const low = createInitialGameState(8);
  low.governorates['deir_ez_zor'].reconstructionScore = 0.48;
  const high = createInitialGameState(8);
  high.governorates['deir_ez_zor'].reconstructionScore = 0.8;
  check('trigger fires below 0.65', card.triggerCondition!(low) === true);
  check('trigger is suppressed at 0.8', card.triggerCondition!(high) === false);
}

// ---------------------------------------------------------------------------
// DECK#9 — authored non-currency requirements are enforced.
// ---------------------------------------------------------------------------
console.log('=== DECK#9: non-currency requirements are real gates ===');
{
  const state = richState();
  const { opt } = option('event_01_grain_corridor', 'opt_swap');
  state.macro.sovereignLeverage = 20;
  const blocked = canAffordEventOption(state, opt);
  check('opt_swap is blocked below sovereignty 30', !blocked.ok);
  check('the reason names the failing sovereignty gate', !!blocked.reasonAr?.includes('السيادة'), blocked.reasonAr);
  state.macro.sovereignLeverage = 65;
  check('opt_swap is available at sovereignty 65', canAffordEventOption(state, opt).ok);
}
{
  const state = richState();
  const { opt } = option('event_03_beirut_banking', 'opt_decree_54');
  state.ministries.finance.competence = 40;
  check('opt_decree_54 is blocked below finance competence 45', !canAffordEventOption(state, opt).ok);
  state.ministries.finance.competence = 58;
  check('opt_decree_54 is available at finance competence 58', canAffordEventOption(state, opt).ok);
}
{
  const state = richState();
  const { opt } = option('event_05_bab_el_mandeb', 'opt_freight_overland');
  state.ministries.economy.competence = 35;
  check('opt_freight_overland is blocked below economy competence 40', !canAffordEventOption(state, opt).ok);
  state.ministries.economy.competence = 52;
  check('opt_freight_overland is available at economy competence 52', canAffordEventOption(state, opt).ok);
}

// ---------------------------------------------------------------------------
// DECK#10 — tiers are recomputed immediately after event effects.
// ---------------------------------------------------------------------------
console.log('=== DECK#10: event effects keep governorate tiers in sync ===');
{
  const state = richState();
  const gov = state.governorates['latakia'];
  gov.prri = 80;
  gov.tier = 'RIOT';
  resolveEventOption(state, 'event_debt_coast_fuel_sabotage', 'opt_coast_endure_blackout');
  check('PRRI 80 + 10 becomes REVOLT immediately', gov.tier === 'REVOLT', `got ${gov.tier} at PRRI ${gov.prri}`);
}
{
  const state = richState();
  const gov = state.governorates['latakia'];
  gov.prri = 42;
  gov.tier = 'TENSE';
  resolveEventOption(state, 'event_debt_coast_fuel_sabotage', 'opt_coast_security_sweep');
  check('PRRI 42 - 10 becomes CALM immediately', gov.tier === 'CALM', `got ${gov.tier} at PRRI ${gov.prri}`);
}

// ---------------------------------------------------------------------------
// DECK#11 — event_08's trigger uses a reachable relative spread.
// ---------------------------------------------------------------------------
console.log('=== DECK#11: central-bank float trigger ===');
{
  const card = MONETARY_EVENTS.find((c) => c.id === 'event_08_central_bank_float')!;
  const normal = createInitialGameState(9);
  check('baseline 162/135 does not trigger the float event', card.triggerCondition!(normal) === false);
  const wide = createInitialGameState(9);
  wide.macro.parallelRateSYP = 200;
  wide.macro.officialRateSYP = 135;
  check('a >35% gap triggers the float event', card.triggerCondition!(wide) === true);
}

// ---------------------------------------------------------------------------
// DECK#12 — emergency printing reaches M2 and the parallel rate.
// ---------------------------------------------------------------------------
console.log('=== DECK#12: emergency printing has a money-supply cost ===');
{
  const state = richState();
  const m20 = state.macro.m2MoneySupplySYP;
  const rate0 = state.macro.parallelRateSYP;
  const treasury0 = state.macro.treasurySYP;
  resolveEventOption(state, 'event_01_banknote_liquidity', 'opt_emergency_print');
  check('treasury receives the 12B issue', state.macro.treasurySYP === treasury0 + 12_000_000_000);
  check('M2 rises by the printed amount', state.macro.m2MoneySupplySYP === m20 + 12_000_000_000);
  check('the parallel rate weakens on the print', state.macro.parallelRateSYP > rate0, `${rate0} -> ${state.macro.parallelRateSYP}`);
}

// ---------------------------------------------------------------------------
// DECK#13 / DECK#17 — the spoiler is gated on the signed accord flags.
// ---------------------------------------------------------------------------
console.log('=== DECK#13/#17: accord spoiler gates and flag reads ===');
{
  const card = SOVEREIGNTY_EVENTS.find((c) => c.id === 'event_suwayda_accord_spoiler')!;
  const state = createInitialGameState(10);
  state.governorates['as_suwayda'].suwaydaIntegrationIndex = 48;
  state.governorates['as_suwayda'].suwaydaSecessionProb = 30;
  check('the power-project integration bump alone does not unlock the spoiler', card.triggerCondition!(state) === false);

  state.flags['Flag_Southern_Accord_Progress'] = 100;
  check('accord progress without restitution still does not unlock it', card.triggerCondition!(state) === false);

  state.flags['Flag_Bedouin_Restitution_Paid'] = 1;
  check('both accord flags unlock the spoiler', card.triggerCondition!(state) === true);

  state.governorates['as_suwayda'].suwaydaSecessionProb = 70;
  check('high secession probability still suppresses the spoiler', card.triggerCondition!(state) === false);
}

// ---------------------------------------------------------------------------
// DECK#14 — wage triggers compare a real wage, not a nominal SYP figure.
// ---------------------------------------------------------------------------
console.log('=== DECK#14: service-crisis wage triggers ===');
{
  const doctors = SERVICES_EVENTS.find((c) => c.id === 'event_40_medical_staff_brain_drain')!;
  const teachers = SERVICES_EVENTS.find((c) => c.id === 'event_41_aleppo_teachers_walkout')!;

  const baseline = createInitialGameState(11);
  baseline.macro.annualInflationPct = 5; // isolate the wage leg from the inflation leg
  baseline.macro.parallelRateSYP = 162;
  baseline.macro.civilServiceWageSYP = 4_050; // $25.00
  check('doctors crisis is suppressed at the $25 baseline wage', doctors.triggerCondition!(baseline) === false);

  const collapsed = createInitialGameState(11);
  collapsed.macro.annualInflationPct = 5;
  collapsed.macro.parallelRateSYP = 162;
  collapsed.macro.civilServiceWageSYP = 2_430; // $15.00
  check('doctors crisis fires at a $15 real wage', doctors.triggerCondition!(collapsed) === true);

  const teachersHigh = createInitialGameState(11);
  teachersHigh.macro.parallelRateSYP = 162;
  teachersHigh.macro.civilServiceWageSYP = 5_000; // $30.86
  check('teachers walkout is suppressed at a $30.86 real wage', teachers.triggerCondition!(teachersHigh) === false);
  check('teachers walkout is suppressed at the $25 baseline wage', teachers.triggerCondition!(baseline) === false);

  const teachersLow = createInitialGameState(11);
  teachersLow.macro.parallelRateSYP = 162;
  teachersLow.macro.civilServiceWageSYP = 3_500; // $21.60
  check('teachers walkout fires at a $21.60 real wage', teachers.triggerCondition!(teachersLow) === true);
}

// ---------------------------------------------------------------------------
// DECK#15 / DECK#16 — text matches the actual effect.
// ---------------------------------------------------------------------------
console.log('=== DECK#15/#16: event text matches the mechanic ===');
{
  const { opt } = option('event_39_espionage_cell_bust', 'opt_espionage_public_trial');
  check('public-trial text shows a PC cost, not a gain', opt.customEffectAr?.includes('-16 رصيد سياسي') === true, opt.customEffectAr);
  check('public-trial actually charges 16 PC', opt.costPC === 16);
}
{
  const { opt } = option('event_31_tartus_port_logjam', 'opt_terminal_concession_lease');
  check('terminal-concession text matches the $30M credit', opt.descriptionAr.includes('$30M') && !opt.descriptionAr.includes('$60M'));
  check('terminal concession credits exactly $30M', opt.costUSD === -30_000_000);
}

// ---------------------------------------------------------------------------
// Consistency sweep: the modal's helper and the engine must never disagree.
// ---------------------------------------------------------------------------
console.log('=== consistency sweep across every authored option ===');
{
  let mismatches = 0;
  const states = [createInitialGameState(12), richState()];
  for (const state of states) {
    for (const card of ALL_EVENTS) {
      for (const opt of card.options) {
        if (canAffordEventOption(state, opt).ok !== validateOptionAvailability(state, opt)) mismatches++;
      }
    }
  }
  check('canAffordEventOption matches validateOptionAvailability on every option', mismatches === 0, `${mismatches} mismatches`);
}

console.log(
  failures === 0
    ? `\nALL EVENT REGRESSION TESTS PASSED! (${assertions} assertions)`
    : `\n${failures} FAILURES of ${assertions} assertions`
);
process.exit(failures === 0 ? 0 : 1);

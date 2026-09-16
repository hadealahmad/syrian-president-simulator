import { ALL_EVENTS } from '../src/lib/engine/deck';
import { drawEventsForTurn, resolveEventOption, validateOptionAvailability } from '../src/lib/engine/events';
import { createInitialGameState } from '../src/lib/engine/baseline';
import { PRNG } from '../src/lib/engine/prng';
import type { GameState } from '../src/lib/engine/types';

console.log('=== VERIFYING ALL EVENT DECKS ===');
console.log(`Total events loaded in master deck: ${ALL_EVENTS.length}`);

if (ALL_EVENTS.length !== 64) {
  throw new Error(`Expected 64 events (14 original + 50 new), got ${ALL_EVENTS.length}`);
}

const VALID_GOVS = new Set([
  'damascus',
  'rif_dimashq',
  'aleppo',
  'homs',
  'hama',
  'latakia',
  'tartus',
  'idlib',
  'deir_ez_zor',
  'raqqa',
  'hasakeh',
  'daraa',
  'as_suwayda',
  'quneitra',
]);

let eventsWithGovEffectsCount = 0;
let totalGovEffectsCount = 0;

for (const event of ALL_EVENTS) {
  if (!event.id || !event.titleAr || !event.descriptionAr || !event.options || event.options.length === 0) {
    throw new Error(`Event ${event.id} is missing required fields!`);
  }
  if (event.targetGovernorateId && !VALID_GOVS.has(event.targetGovernorateId)) {
    throw new Error(`Event ${event.id} has invalid targetGovernorateId: ${event.targetGovernorateId}`);
  }

  let hasGovEffect = false;
  for (const opt of event.options) {
    if (!opt.id || !opt.labelAr || !opt.customEffectAr) {
      throw new Error(`Option in event ${event.id} is missing required fields!`);
    }
    if (opt.governorateEffects && opt.governorateEffects.length > 0) {
      hasGovEffect = true;
      for (const eff of opt.governorateEffects) {
        totalGovEffectsCount++;
        if (!VALID_GOVS.has(eff.governorateId)) {
          throw new Error(`Event ${event.id} option ${opt.id} references invalid governorate: ${eff.governorateId}`);
        }
      }
    }
  }
  if (hasGovEffect) eventsWithGovEffectsCount++;
}

console.log(`Events with governorate-specific stat effects: ${eventsWithGovEffectsCount}`);
console.log(`Total individual governorate stat mutations across all options: ${totalGovEffectsCount}`);

// Test Precondition logic
console.log('\n=== TESTING PRECONDITION FILTERING ===');
const prng = new PRNG(12345);

// 1. Player with excellent finances ($800M reserves, 10T treasury, 5% inflation)
const richState: GameState = createInitialGameState();
richState.macro.reservesUSD = 800_000_000;
richState.macro.treasurySYP = 1_000_000_000;
richState.macro.annualInflationPct = 5;
richState.macro.civicTrust = 85;
richState.governorates['as_suwayda'].prri = 15;
richState.governorates['as_suwayda'].suwaydaSecessionProb = 0;
richState.governorates['aleppo'].dailyBlackoutHours = 4;
richState.macro.dailyPowerHours = 20;

// Test that liquidity crisis and suwayda disobedience do NOT trigger when conditions are false
const evLiquidity = ALL_EVENTS.find(e => e.id === 'event_01_banknote_liquidity')!;
const evSuwayda = ALL_EVENTS.find(e => e.id === 'event_34_suwayda_civil_disobedience')!;
const evAleppoAmperat = ALL_EVENTS.find(e => e.id === 'event_09_aleppo_amperat')!;

if (evLiquidity.triggerCondition && evLiquidity.triggerCondition(richState)) {
  throw new Error('Liquidity crisis triggered despite rich state!');
}
console.log('PASS: Banknote liquidity crisis correctly suppressed when finances are strong');

if (evSuwayda.triggerCondition && evSuwayda.triggerCondition(richState)) {
  throw new Error('Suwayda disobedience triggered despite calm state!');
}
console.log('PASS: Suwayda civil disobedience correctly suppressed when Suwayda is stable');

if (evAleppoAmperat.triggerCondition && evAleppoAmperat.triggerCondition(richState)) {
  throw new Error('Aleppo amperat strike triggered despite 20h power!');
}
console.log('PASS: Aleppo amperat strike correctly suppressed when power is plentiful');

// 2. Player with distressed state
const poorState: GameState = createInitialGameState();
poorState.macro.reservesUSD = 200_000_000;
poorState.macro.treasurySYP = 200_000_000;
poorState.macro.annualInflationPct = 35;
poorState.macro.civicTrust = 40;
poorState.governorates['as_suwayda'].prri = 45;
poorState.governorates['as_suwayda'].suwaydaSecessionProb = 30;
poorState.governorates['aleppo'].dailyBlackoutHours = 16;
poorState.macro.dailyPowerHours = 6;

if (evLiquidity.triggerCondition && !evLiquidity.triggerCondition(poorState)) {
  throw new Error('Liquidity crisis did NOT trigger when finances are strained!');
}
console.log('PASS: Banknote liquidity crisis correctly triggers when finances are strained');

if (evSuwayda.triggerCondition && !evSuwayda.triggerCondition(poorState)) {
  throw new Error('Suwayda disobedience did NOT trigger when Suwayda is in unrest!');
}
console.log('PASS: Suwayda civil disobedience correctly triggers when Suwayda is in unrest');

if (evAleppoAmperat.triggerCondition && !evAleppoAmperat.triggerCondition(poorState)) {
  throw new Error('Aleppo amperat strike did NOT trigger when blackout is 16h!');
}
console.log('PASS: Aleppo amperat strike correctly triggers when blackouts are severe');

// Test Governorates resolution mutation
console.log('\n=== TESTING RESOLVE EVENT OPTION WITH GOVERNORATE STATS ===');
const simState: GameState = createInitialGameState();
simState.turnNumber = 8;
simState.macro.reservesUSD = 250_000_000;
simState.macro.politicalCapital = 50;
simState.governorates['aleppo'].prri = 40;
simState.governorates['aleppo'].dailyBlackoutHours = 14;

// Draw an event
const drawn = drawEventsForTurn(simState, prng);
console.log(`Drawn event for turn 8: ${drawn[0]?.titleAr} (${drawn[0]?.id})`);

// Resolve event_09_aleppo_amperat with opt_amperat_emergency_seizure
simState.activeEvents = [ALL_EVENTS.find(e => e.id === 'event_09_aleppo_amperat')!];
const prevAleppoPrri = simState.governorates['aleppo'].prri;
const prevAleppoBlackout = simState.governorates['aleppo'].dailyBlackoutHours;

resolveEventOption(simState, 'event_09_aleppo_amperat', 'opt_amperat_emergency_seizure');

console.log(`Aleppo PRRI before: ${prevAleppoPrri}, after: ${simState.governorates['aleppo'].prri}`);
console.log(`Aleppo Blackout before: ${prevAleppoBlackout}, after: ${simState.governorates['aleppo'].dailyBlackoutHours}`);

if (simState.governorates['aleppo'].prri >= prevAleppoPrri) {
  throw new Error('Aleppo PRRI did not decrease!');
}
if (simState.governorates['aleppo'].dailyBlackoutHours >= prevAleppoBlackout) {
  throw new Error('Aleppo Blackout hours did not decrease!');
}
if (!simState.flags['event_resolved_event_09_aleppo_amperat']) {
  throw new Error('Event resolved flag was not set!');
}
if (simState.activeEvents.length !== 0) {
  throw new Error('Active events list not cleared!');
}

console.log('\n ALL TESTS PASSED SUCCESSFULLY! Master deck of 64 events verified.');

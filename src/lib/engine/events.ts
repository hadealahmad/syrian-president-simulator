import type { GameState, EventCard, EventOption } from './types';
import { MASTER_EVENTS } from './deck/master-events';
import { SOUTHERN_EVENTS } from './deck/southern-events';
import { PRNG } from './prng';

/**
 * Validates whether the player meets requirements to select an option.
 */
export function validateOptionAvailability(state: GameState, option: EventOption): boolean {
  if (option.costUSD > 0 && state.macro.reservesUSD < option.costUSD) {
    return false;
  }
  if (option.costPC > 0 && state.macro.politicalCapital < option.costPC) {
    return false;
  }
  return true;
}

/**
 * Draws active events for the current turn based on triggers and seeded randomness.
 */
export function drawEventsForTurn(state: GameState, prng: PRNG): EventCard[] {
  const drawn: EventCard[] = [];
  const allEvents = [...MASTER_EVENTS, ...SOUTHERN_EVENTS];

  // Specific turn scripted triggers
  if (state.turnNumber === 2) {
    const ev1 = MASTER_EVENTS.find((e) => e.id === 'event_01_grain_corridor');
    if (ev1) drawn.push(ev1);
  } else if (state.turnNumber === 4) {
    const ev2 = MASTER_EVENTS.find((e) => e.id === 'event_02_tanker_interdiction');
    if (ev2) drawn.push(ev2);
  } else if (state.turnNumber === 5) {
    const ev5 = MASTER_EVENTS.find((e) => e.id === 'event_05_bab_el_mandeb');
    if (ev5) drawn.push(ev5);
  } else if (state.turnNumber === 7) {
    const s01 = SOUTHERN_EVENTS.find((e) => e.id === 'event_s01_lajat_siege');
    if (s01) drawn.push(s01);
  } else if (state.turnNumber === 10) {
    const d02 = SOUTHERN_EVENTS.find((e) => e.id === 'event_d02_golan_incursion');
    if (d02) drawn.push(d02);
  } else {
    // Dynamic random draw from unplayed events
    const pool = allEvents.filter(
      (e) => !state.flags[`event_resolved_${e.id}`] && !drawn.some((d) => d.id === e.id)
    );
    if (pool.length > 0) {
      const idx = prng.nextInt(0, pool.length - 1);
      drawn.push(pool[idx]);
    }
  }

  return drawn;
}

/**
 * Resolves an event option, applying economic, political, and provincial impacts.
 */
export function resolveEventOption(
  state: GameState,
  eventId: string,
  optionId: string
): void {
  const allEvents = [...MASTER_EVENTS, ...SOUTHERN_EVENTS];
  const card = allEvents.find((e) => e.id === eventId);
  if (!card) return;

  const option = card.options.find((o) => o.id === optionId);
  if (!option) return;

  // Apply hard currency and political costs
  state.macro.reservesUSD = Math.max(0, state.macro.reservesUSD - option.costUSD);
  state.macro.politicalCapital = Math.max(0, Math.min(100, state.macro.politicalCapital - option.costPC));

  // Domestic SYP financing: deduct from treasury or finance via emergency sovereign monetization
  if (option.costSYP > 0) {
    if (state.macro.treasurySYP >= option.costSYP) {
      state.macro.treasurySYP -= option.costSYP;
    } else {
      const remainingSYP = option.costSYP - state.macro.treasurySYP;
      state.macro.treasurySYP = 0;
      state.macro.m2MoneySupplySYP += remainingSYP;
      // Linear depreciation impact of emergency crisis money creation
      const moneyFactor = state.macro.m2MoneySupplySYP > 0 ? (remainingSYP / state.macro.m2MoneySupplySYP) : 0.05;
      state.macro.parallelRateSYP = Math.round(state.macro.parallelRateSYP * (1 + Math.min(0.25, moneyFactor * 0.5)));
    }
  }

  // Apply governance deltas
  state.macro.civicTrust = Math.max(0, Math.min(100, state.macro.civicTrust + option.effectTrust));
  state.macro.nationalRRI = Math.max(0, Math.min(100, state.macro.nationalRRI + option.effectRRI));
  state.macro.systemicCorruption = Math.max(0, Math.min(100, state.macro.systemicCorruption + option.effectCorruption));

  // Handle specific historic flags
  if (optionId === 'opt_historic_accord') {
    state.flags['Flag_Southern_Accord_Progress'] = 100;
    state.flags['Flag_Bedouin_Restitution_Paid'] = 1;
    if (state.governorates['as_suwayda']) {
      state.governorates['as_suwayda'].suwaydaIntegrationIndex = 100;
      state.governorates['as_suwayda'].suwaydaSecessionProb = 0;
      state.governorates['as_suwayda'].tribalRageIndex = 0;
      state.governorates['as_suwayda'].prri = 15;
    }
  }

  // Mark event as resolved
  state.flags[`event_resolved_${eventId}`] = 1;
  state.activeEvents = state.activeEvents.filter((e) => e.id !== eventId);
}

/**
 * Executes a severe sovereign default penalty when the player cannot afford
 * or execute ANY of the options to deal with an active crisis.
 */
export function applyUnresolvedCrisisPenalty(state: GameState, eventId: string): void {
  // 1. Severe loss of Civic Trust (-25 points)
  state.macro.civicTrust = Math.max(0, state.macro.civicTrust - 25);

  // 2. Loss of Executive Political Capital (-30 points)
  state.macro.politicalCapital = Math.max(0, state.macro.politicalCapital - 30);

  // 3. Surge in systemic corruption and opportunism (+15 points)
  state.macro.systemicCorruption = Math.min(100, state.macro.systemicCorruption + 15);

  // 4. Currency confidence crash (+15% parallel street rate depreciation)
  state.macro.parallelRateSYP = Math.round(state.macro.parallelRateSYP * 1.15);

  // 5. Direct provincial unrest surge across all governorates (+25 PRRI)
  let totalPRRI = 0;
  for (const gov of Object.values(state.governorates)) {
    gov.prri = Math.min(100, gov.prri + 25);
    if (gov.prri >= 85) {
      gov.tier = 'REVOLT';
    } else if (gov.prri >= 65) {
      gov.tier = 'RIOT';
    } else if (gov.prri >= 45) {
      gov.tier = 'TENSE';
    } else {
      gov.tier = 'CALM';
    }
    totalPRRI += gov.prri;
  }

  // 6. National RRI reflects provincial surge + crisis default shock (+20)
  const averageProvPRRI = Math.round(totalPRRI / Object.keys(state.governorates).length);
  state.macro.nationalRRI = Math.min(100, Math.max(state.macro.nationalRRI + 20, averageProvPRRI + 10));

  // 7. Mark crisis as failed under default penalty
  state.flags[`event_resolved_${eventId}`] = -1;
  state.flags['last_crisis_defaulted'] = 1;
  state.activeEvents = state.activeEvents.filter((e) => e.id !== eventId);
}

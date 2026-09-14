import type { GameState, EventCard, EventOption } from './types';
import { MASTER_EVENTS } from './deck/master-events';
import { SOUTHERN_EVENTS } from './deck/southern-events';
import { PRNG } from './prng';

/**
 * Validates whether the player meets requirements to select an option.
 * Strictly prevents choosing options when political credit or foreign reserves are insufficient.
 */
export function validateOptionAvailability(state: GameState, option: EventOption): boolean {
  if (option.costPC > 0 && state.macro.politicalCapital < option.costPC) {
    return false;
  }
  if (option.costUSD > 0 && state.macro.reservesUSD < option.costUSD) {
    return false;
  }
  return true;
}

/**
 * Draws active events for the current turn based on triggers and seeded randomness.
 */
export function drawEventsForTurn(state: GameState, prng: PRNG): EventCard[] {
  const drawnRaw: EventCard[] = [];
  const allEvents = [...MASTER_EVENTS, ...SOUTHERN_EVENTS];

  // Specific turn scripted triggers
  if (state.turnNumber === 2) {
    const ev1 = MASTER_EVENTS.find((e) => e.id === 'event_01_grain_corridor');
    if (ev1) drawnRaw.push(ev1);
  } else if (state.turnNumber === 4) {
    const ev2 = MASTER_EVENTS.find((e) => e.id === 'event_02_tanker_interdiction');
    if (ev2) drawnRaw.push(ev2);
  } else if (state.turnNumber === 5) {
    const ev5 = MASTER_EVENTS.find((e) => e.id === 'event_05_bab_el_mandeb');
    if (ev5) drawnRaw.push(ev5);
  } else if (state.turnNumber === 7) {
    const s01 = SOUTHERN_EVENTS.find((e) => e.id === 'event_s01_lajat_siege');
    if (s01) drawnRaw.push(s01);
  } else if (state.turnNumber === 10) {
    const d02 = SOUTHERN_EVENTS.find((e) => e.id === 'event_d02_golan_incursion');
    if (d02) drawnRaw.push(d02);
  } else {
    // Dynamic random draw from unplayed events
    const pool = allEvents.filter(
      (e) => !state.flags[`event_resolved_${e.id}`] && !drawnRaw.some((d) => d.id === e.id)
    );
    if (pool.length > 0) {
      const idx = prng.nextInt(0, pool.length - 1);
      drawnRaw.push(pool[idx]);
    }
  }

  // Deep clone events and evaluate option availability dynamically against current state
  return drawnRaw.map((card) => {
    const clonedCard: EventCard = structuredClone(card);
    clonedCard.options = clonedCard.options.map((opt) => ({
      ...opt,
      canChoose: validateOptionAvailability(state, opt),
    }));
    return clonedCard;
  });
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

  // STRICT ENFORCEMENT: Never allow spending political capital or FX reserves if player does not have enough
  if (!validateOptionAvailability(state, option)) {
    console.warn(
      `Blocked attempt to select event option "${optionId}": requires ${option.costPC} PC (has ${state.macro.politicalCapital} PC) or $${option.costUSD} USD (has $${state.macro.reservesUSD} USD).`
    );
    return;
  }

  // Apply hard currency and political costs
  state.macro.reservesUSD = Math.max(0, state.macro.reservesUSD - option.costUSD);
  state.macro.politicalCapital = Math.max(0, Math.min(100, state.macro.politicalCapital - option.costPC));

  // Domestic SYP financing: deduct directly from public treasury balance (allowing sovereign overdraft/deficit)
  if (option.costSYP > 0) {
    state.macro.treasurySYP -= option.costSYP;
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

  // 3. Spreading provincial unrest (+25 national RRI)
  state.macro.nationalRRI = Math.min(100, state.macro.nationalRRI + 25);

  // 4. Increase unrest across all key governorates
  for (const gov of Object.values(state.governorates)) {
    gov.prri = Math.min(100, gov.prri + 15);
  }

  // Mark event as resolved through sovereign failure
  state.flags[`event_failed_${eventId}`] = 1;
  state.flags[`event_resolved_${eventId}`] = 1;
  state.activeEvents = state.activeEvents.filter((e) => e.id !== eventId);
}

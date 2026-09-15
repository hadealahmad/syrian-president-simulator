import type { GameState, EventCard, EventOption } from './types';
import { ALL_EVENTS, MASTER_EVENTS, SOUTHERN_EVENTS } from './deck';
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

  // Specific turn scripted triggers
  if (state.turnNumber === 2) {
    const ev1 = MASTER_EVENTS.find((e) => e.id === 'event_01_grain_corridor');
    if (ev1 && !state.flags[`event_resolved_${ev1.id}`]) drawnRaw.push(ev1);
  } else if (state.turnNumber === 4) {
    const ev2 = MASTER_EVENTS.find((e) => e.id === 'event_02_tanker_interdiction');
    if (ev2 && !state.flags[`event_resolved_${ev2.id}`]) drawnRaw.push(ev2);
  } else if (state.turnNumber === 5) {
    const ev5 = MASTER_EVENTS.find((e) => e.id === 'event_05_bab_el_mandeb');
    if (ev5 && !state.flags[`event_resolved_${ev5.id}`]) drawnRaw.push(ev5);
  } else if (state.turnNumber === 7) {
    const s01 = SOUTHERN_EVENTS.find((e) => e.id === 'event_s01_lajat_siege');
    if (s01 && !state.flags[`event_resolved_${s01.id}`]) drawnRaw.push(s01);
  } else if (state.turnNumber === 10) {
    const d02 = SOUTHERN_EVENTS.find((e) => e.id === 'event_d02_golan_incursion');
    if (d02 && !state.flags[`event_resolved_${d02.id}`]) drawnRaw.push(d02);
  }

  // Dynamic random draw if no scripted event or pool fallback
  if (drawnRaw.length === 0) {
    const pool = ALL_EVENTS.filter(
      (e) =>
        !state.flags[`event_resolved_${e.id}`] &&
        !drawnRaw.some((d) => d.id === e.id) &&
        (!e.triggerCondition || e.triggerCondition(state))
    );
    if (pool.length > 0) {
      const idx = prng.nextInt(0, pool.length - 1);
      drawnRaw.push(pool[idx]);
    }
  }

  // Clone events safely and evaluate option availability dynamically against current state
  return drawnRaw.map((card) => {
    return {
      ...card,
      options: card.options.map((opt) => ({
        ...opt,
        canChoose: validateOptionAvailability(state, opt),
        governorateEffects: opt.governorateEffects ? opt.governorateEffects.map((g) => ({ ...g })) : undefined,
      })),
    };
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
  const card = ALL_EVENTS.find((e) => e.id === eventId);
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

  // Apply hard currency costs / gains
  if (option.costUSD > 0) {
    state.macro.reservesUSD = Math.max(0, state.macro.reservesUSD - option.costUSD);
  } else if (option.costUSD < 0) {
    state.macro.reservesUSD += -option.costUSD;
  }

  // Apply political capital
  state.macro.politicalCapital = Math.max(0, Math.min(100, state.macro.politicalCapital - option.costPC));

  // Domestic SYP financing: deduct or credit treasury balance
  if (option.costSYP > 0) {
    state.macro.treasurySYP -= option.costSYP;
  } else if (option.costSYP < 0) {
    state.macro.treasurySYP += -option.costSYP;
  }

  // Apply governance deltas
  state.macro.civicTrust = Math.max(0, Math.min(100, state.macro.civicTrust + option.effectTrust));
  state.macro.nationalRRI = Math.max(0, Math.min(100, state.macro.nationalRRI + option.effectRRI));
  state.macro.systemicCorruption = Math.max(0, Math.min(100, state.macro.systemicCorruption + option.effectCorruption));

  // Apply governorate-specific stat effects
  if (option.governorateEffects && option.governorateEffects.length > 0) {
    for (const eff of option.governorateEffects) {
      const gov = state.governorates[eff.governorateId];
      if (!gov) continue;

      if (eff.prri !== undefined) {
        gov.prri = Math.max(0, Math.min(100, gov.prri + eff.prri));
      }
      if (eff.dailyBlackoutHours !== undefined) {
        gov.dailyBlackoutHours = Math.max(0, Math.min(24, gov.dailyBlackoutHours + eff.dailyBlackoutHours));
      }
      if (eff.sectarianAnxiety !== undefined) {
        gov.sectarianAnxiety = Math.max(0, Math.min(100, gov.sectarianAnxiety + eff.sectarianAnxiety));
      }
      if (eff.securityEfficacy !== undefined) {
        gov.securityEfficacy = Math.max(0, Math.min(100, gov.securityEfficacy + eff.securityEfficacy));
      }
      if (eff.activeHospitalsPct !== undefined) {
        gov.activeHospitalsPct = Math.max(0, Math.min(100, gov.activeHospitalsPct + eff.activeHospitalsPct));
      }
      if (eff.reconstructionScore !== undefined) {
        const delta = Math.abs(eff.reconstructionScore) > 1 ? eff.reconstructionScore / 100 : eff.reconstructionScore;
        gov.reconstructionScore = Math.max(0, Math.min(1.0, gov.reconstructionScore + delta));
      }
      if (eff.suwaydaIntegrationIndex !== undefined && gov.suwaydaIntegrationIndex !== undefined) {
        gov.suwaydaIntegrationIndex = Math.max(0, Math.min(100, gov.suwaydaIntegrationIndex + eff.suwaydaIntegrationIndex));
      }
      if (eff.suwaydaSecessionProb !== undefined && gov.suwaydaSecessionProb !== undefined) {
        gov.suwaydaSecessionProb = Math.max(0, Math.min(100, gov.suwaydaSecessionProb + eff.suwaydaSecessionProb));
      }
      if (eff.tribalRageIndex !== undefined && gov.tribalRageIndex !== undefined) {
        gov.tribalRageIndex = Math.max(0, Math.min(100, gov.tribalRageIndex + eff.tribalRageIndex));
      }
      if (eff.golanTensionIndex !== undefined && gov.golanTensionIndex !== undefined) {
        gov.golanTensionIndex = Math.max(0, Math.min(100, gov.golanTensionIndex + eff.golanTensionIndex));
      }
      if (eff.daraaDefianceIndex !== undefined && gov.daraaDefianceIndex !== undefined) {
        gov.daraaDefianceIndex = Math.max(0, Math.min(100, gov.daraaDefianceIndex + eff.daraaDefianceIndex));
      }
      if (eff.nassibRevenueCapturePct !== undefined && gov.nassibRevenueCapturePct !== undefined) {
        gov.nassibRevenueCapturePct = Math.max(0, Math.min(100, gov.nassibRevenueCapturePct + eff.nassibRevenueCapturePct));
      }
      if (eff.skilledLaborCount !== undefined && gov.skilledLaborCount !== undefined) {
        gov.skilledLaborCount = Math.max(0, gov.skilledLaborCount + eff.skilledLaborCount);
      }
    }
  }

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

  if (optionId === 'opt_disarm_suwayda') {
    if (state.governorates['as_suwayda']) {
      state.governorates['as_suwayda'].suwaydaSecessionProb = 95;
      state.governorates['as_suwayda'].suwaydaIntegrationIndex = 0;
      state.governorates['as_suwayda'].prri = 85;
      state.governorates['as_suwayda'].tier = 'REVOLT';
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
}

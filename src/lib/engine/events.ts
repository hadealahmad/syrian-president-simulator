import type { GameState, EventCard, EventOption } from './types';
import { ALL_EVENTS, MASTER_EVENTS, SOUTHERN_EVENTS } from './deck';
import { PRNG } from './prng';
import { adjustOfficialPeg, calculateParallelRate, canAffordDirectiveCost } from './currency';
import { getUnrestTier } from './spatial';

/**
 * Cards that `drawEventsForTurn` schedules itself — the fixed-turn scripted
 * cards and the quest spoiler (which gets its own priority roll). They must
 * never be reachable through the uniform random lottery: a quest card drawn
 * early can be resolved before its scripted turn, and the scripted branch then
 * skips it because it is already resolved, losing its outcome forever.
 */
const SCRIPTED_EVENT_IDS = new Set([
  'event_01_grain_corridor',
  'event_02_tanker_interdiction',
  'event_05_bab_el_mandeb',
  'event_s01_lajat_siege',
  'event_d02_golan_incursion',
  'event_suwayda_accord_spoiler',
]);

/**
 * Authored non-currency gates. `EventOption` only carries a human-readable
 * `requirementsDescriptionAr`, so without a predicate the gates that name an
 * index or a ministry are decorative. Keyed by option id because the option
 * has no machine-readable requirement field.
 */
const OPTION_REQUIREMENTS: Record<
  string,
  { isMet: (state: GameState) => boolean; describeAr: (state: GameState) => string }
> = {
  opt_swap: {
    isMet: (state) => (state.macro.sovereignLeverage ?? 0) >= 30,
    describeAr: (state) =>
      `مؤشر السيادة والاستقلال يجب أن يكون 30 أو أكثر بينما الحالي ${Math.round(state.macro.sovereignLeverage ?? 0)}`,
  },
  opt_decree_54: {
    isMet: (state) => (state.ministries?.finance?.competence ?? 0) >= 45,
    describeAr: (state) =>
      `كفاءة وزارة المالية يجب أن تكون 45 أو أكثر بينما الحالية ${Math.round(state.ministries?.finance?.competence ?? 0)}`,
  },
  opt_freight_overland: {
    isMet: (state) => (state.ministries?.economy?.competence ?? 0) >= 40,
    describeAr: (state) =>
      `كفاءة وزارة الاقتصاد يجب أن تكون 40 أو أكثر بينما الحالية ${Math.round(state.ministries?.economy?.competence ?? 0)}`,
  },
};

export interface EventOptionAffordability {
  ok: boolean;
  reasonAr?: string;
}

function formatBillionSYPAr(value: number): string {
  return (value / 1_000_000_000).toFixed(2);
}

function formatMillionUSDAr(value: number): string {
  return (value / 1_000_000).toFixed(1);
}

/**
 * The single source of truth for "can this event option be chosen".
 *
 * Checks the same three legs as `resolveEventOption` — political capital, the
 * USD cost, and the SYP cost with its FX cover — plus the authored
 * non-currency gates, and returns an Arabic reason when the option is blocked.
 * The event modal renders this verdict, so an option the engine will reject can
 * never be shown as selectable (which used to leave the player with no way to
 * close the card).
 */
export function canAffordEventOption(state: GameState, option: EventOption): EventOptionAffordability {
  const { macro } = state;

  const requirement = OPTION_REQUIREMENTS[option.id];
  if (requirement && !requirement.isMet(state)) {
    return { ok: false, reasonAr: requirement.describeAr(state) };
  }

  if (option.costPC > 0 && macro.politicalCapital < option.costPC) {
    return {
      ok: false,
      reasonAr: `عجز في الرصيد السياسي: يتطلب ${option.costPC} نقطة رصيد سياسي بينما المتاح لديك فقط ${Math.floor(macro.politicalCapital)} نقطة`,
    };
  }

  if (option.costUSD > 0 && macro.reservesUSD < option.costUSD) {
    return {
      ok: false,
      reasonAr: `نقص في احتياطي النقد الأجنبي: يتطلب $${formatMillionUSDAr(option.costUSD)}M بينما المتاح $${formatMillionUSDAr(macro.reservesUSD)}M`,
    };
  }

  if (option.costSYP > 0) {
    const usableTreasury = Math.max(0, macro.treasurySYP);
    if (usableTreasury < option.costSYP) {
      const shortfall = option.costSYP - usableTreasury;
      const usdNeeded = shortfall / Math.max(1, macro.parallelRateSYP);
      const usableReserves = macro.reservesUSD - Math.max(0, option.costUSD);
      if (usableReserves < usdNeeded) {
        return {
          ok: false,
          reasonAr: `عجز في سيولة الخزينة: يتطلب ${formatBillionSYPAr(option.costSYP)}B SP بينما المتاح ${formatBillionSYPAr(usableTreasury)}B SP، وفارق ${formatBillionSYPAr(shortfall)}B SP يحتاج إلى $${formatMillionUSDAr(usdNeeded)}M من الاحتياطي الأجنبي بينما المتاح $${formatMillionUSDAr(macro.reservesUSD)}M`,
        };
      }
    }
  }

  // Final authority: the exact dual-currency test the engine has always used.
  if (
    !canAffordDirectiveCost(
      macro.reservesUSD,
      macro.treasurySYP,
      option.costUSD,
      option.costSYP,
      macro.parallelRateSYP
    )
  ) {
    return { ok: false, reasonAr: 'لا تكفي الموارد السيادية لتغطية كلفة هذا الخيار' };
  }

  return { ok: true };
}

/**
 * Validates whether the player meets requirements to select an option.
 * Boolean wrapper around `canAffordEventOption`, kept for existing callers.
 */
export function validateOptionAvailability(state: GameState, option: EventOption): boolean {
  return canAffordEventOption(state, option).ok;
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
        !SCRIPTED_EVENT_IDS.has(e.id) &&
        !state.flags[`event_resolved_${e.id}`] &&
        !drawnRaw.some((d) => d.id === e.id) &&
        (!e.triggerCondition || e.triggerCondition(state))
    );
    if (pool.length > 0) {
      const idx = prng.nextInt(0, pool.length - 1);
      drawnRaw.push(pool[idx]);
    }
  }

  // Quest spoiler priority: the Suwayda accord setback must reliably fire
  // while the signed accord is still fragile, which the uniform lottery would
  // usually miss. 50%/turn while eligible, alongside any drawn event.
  const spoiler = ALL_EVENTS.find((e) => e.id === 'event_suwayda_accord_spoiler');
  if (
    spoiler &&
    !state.flags[`event_resolved_${spoiler.id}`] &&
    !drawnRaw.some((d) => d.id === spoiler.id) &&
    (!spoiler.triggerCondition || spoiler.triggerCondition(state)) &&
    prng.chance(0.5)
  ) {
    drawnRaw.push(spoiler);
  }

  // Clone events safely and evaluate option availability dynamically against current state.
  // NOTE: triggerCondition is a function and must NEVER enter GameState:
  // state is structuredClone()d on every event choice and JSON-persisted on
  // every tick — a live function throws DataCloneError (frozen event modal
  // until refresh) and is silently dropped by JSON (save/load drift).
  return drawnRaw.map((card) => {
    const { triggerCondition: _drop, ...plain } = card;
    return {
      ...plain,
      options: plain.options.map((opt) => ({
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

  // A crisis that already took the unresolved-crisis penalty cannot later be
  // resolved for its benefits. Retire any stale copy still sitting in
  // activeEvents (old saves predating the penalty fix) so it cannot soft-lock.
  if (state.flags[`event_failed_${eventId}`]) {
    state.activeEvents = state.activeEvents.filter((e) => e.id !== eventId);
    return;
  }

  const option = card.options.find((o) => o.id === optionId);
  if (!option) return;

  // STRICT ENFORCEMENT: Never allow spending political capital or treasury
  // liquidity (SYP, with FX coverage) / FX reserves if the player lacks them.
  if (!validateOptionAvailability(state, option)) {
    console.warn(
      `Blocked attempt to select event option "${optionId}": requires ${option.costPC} PC (has ${state.macro.politicalCapital} PC), $${option.costUSD} USD (has $${state.macro.reservesUSD} USD) or ${option.costSYP} SYP (has ${state.macro.treasurySYP} SYP).`
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
  state.macro.politicalCapital = Math.max(0, Math.min(200, state.macro.politicalCapital - option.costPC));

  // Domestic SYP financing: the treasury pays what it can, and the shortfall
  // is converted at the parallel rate and debited from FX reserves — exactly
  // the cover `canAffordDirectiveCost` required before allowing the choice.
  // Previously the whole cost was pushed onto the treasury (which went
  // negative) and the reserves that justified affordability were never charged.
  if (option.costSYP > 0) {
    const usableTreasury = Math.max(0, state.macro.treasurySYP);
    const fromTreasury = Math.min(option.costSYP, usableTreasury);
    const sypShortfall = option.costSYP - fromTreasury;
    state.macro.treasurySYP -= fromTreasury;
    if (sypShortfall > 0) {
      const usdFromReserves = sypShortfall / Math.max(1, state.macro.parallelRateSYP);
      state.macro.reservesUSD = Math.max(0, state.macro.reservesUSD - usdFromReserves);
    }
  } else if (option.costSYP < 0) {
    state.macro.treasurySYP += -option.costSYP;
  }

  // Apply governance deltas
  state.macro.civicTrust = Math.max(0, Math.min(100, state.macro.civicTrust + option.effectTrust));
  state.macro.nationalRRI = Math.max(0, Math.min(100, state.macro.nationalRRI + option.effectRRI));
  state.macro.systemicCorruption = Math.max(0, Math.min(100, state.macro.systemicCorruption + option.effectCorruption));

  // Apply administrative-capacity delta. effectCompetence is authored on every
  // option but was never read, so all 194 of those effects were inert. It is
  // unscoped (no ministry is named), so it is defined against the national
  // average — the figure the fiscal engine reads for tax compliance. Each
  // ministry therefore takes the FULL delta, which moves the average by exactly
  // `effectCompetence`; dividing it by the ministry count would move the average
  // by delta/N instead. Clamped per ministry.
  if (option.effectCompetence !== 0) {
    for (const ministry of Object.values(state.ministries)) {
      ministry.competence = Math.max(0, Math.min(100, ministry.competence + option.effectCompetence));
    }
  }

  // Apply governorate-specific stat effects
  if (option.governorateEffects && option.governorateEffects.length > 0) {
    for (const eff of option.governorateEffects) {
      const gov = state.governorates[eff.governorateId];
      if (!gov) continue;

      if (eff.prri !== undefined) {
        gov.prri = Math.max(0, Math.min(100, gov.prri + eff.prri));
        // Keep the tier in sync immediately: game-store runs checkFailStates()
        // right after this call and counts REVOLT tiers, so a stale tier makes
        // the fail check disagree with the PRRI the engine just wrote.
        gov.tier = getUnrestTier(gov.prri);
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
      if (eff.suwaydaIntegrationIndex !== undefined) {
        gov.suwaydaIntegrationIndex = Math.max(0, Math.min(100, (gov.suwaydaIntegrationIndex ?? 0) + eff.suwaydaIntegrationIndex));
      }
      if (eff.suwaydaSecessionProb !== undefined) {
        gov.suwaydaSecessionProb = Math.max(0, Math.min(100, (gov.suwaydaSecessionProb ?? 0) + eff.suwaydaSecessionProb));
      }
      // Southern/specialised indices default to 0 rather than being skipped when
      // the governorate lacks the field. Skipping silently discarded authored
      // effects (12 of them targeted deir_ez_zor / hasakeh / homs) and made them
      // conditional on whether an unrelated decree had seeded the field first.
      if (eff.tribalRageIndex !== undefined) {
        gov.tribalRageIndex = Math.max(0, Math.min(100, (gov.tribalRageIndex ?? 0) + eff.tribalRageIndex));
      }
      if (eff.golanTensionIndex !== undefined) {
        gov.golanTensionIndex = Math.max(0, Math.min(100, (gov.golanTensionIndex ?? 0) + eff.golanTensionIndex));
      }
      if (eff.daraaDefianceIndex !== undefined) {
        gov.daraaDefianceIndex = Math.max(0, Math.min(100, (gov.daraaDefianceIndex ?? 0) + eff.daraaDefianceIndex));
      }
      if (eff.nassibRevenueCapturePct !== undefined) {
        gov.nassibRevenueCapturePct = Math.max(0, Math.min(100, (gov.nassibRevenueCapturePct ?? 0) + eff.nassibRevenueCapturePct));
      }
      if (eff.skilledLaborCount !== undefined && gov.skilledLaborCount !== undefined) {
        gov.skilledLaborCount = Math.max(0, gov.skilledLaborCount + eff.skilledLaborCount);
      }
    }
  }

  // Exchange-rate options: move the official peg toward the parallel rate.
  // `adjustOfficialPeg()` was exported but never called, so these options only
  // changed unrelated stats and left the gap that triggered the event intact.
  if (optionId === 'opt_align_rate' || optionId === 'opt_managed_float') {
    const peg = adjustOfficialPeg(state.macro, state.macro.parallelRateSYP);
    state.macro.officialRateSYP = peg.officialRateSYP;
    if (peg.civicTrustDelta !== 0) {
      state.macro.civicTrust = Math.max(0, Math.min(100, state.macro.civicTrust + peg.civicTrustDelta));
    }
  }

  // Sovereign-debt options: apply the debt / leverage / mortgage effects their
  // descriptions promise. Previously these were pure stat modifiers.
  if (optionId === 'opt_swap') {
    state.macro.sovereignDebtUSD += 290_000_000;
    state.macro.sovereignLeverage = Math.max(0, (state.macro.sovereignLeverage ?? 0) - 15);
  }
  if (optionId === 'opt_token_payment') {
    state.macro.sovereignDebtUSD = Math.max(0, state.macro.sovereignDebtUSD - 90_000_000);
  }
  if (optionId === 'opt_asset_mortgage') {
    // The concession replaces a cash repayment: pledge the phosphate mines
    // (the asset named by the option's own Homs governorate effect) and
    // extinguish debt worth the concession's own valuation. The recurring
    // revenue loss is already applied by the mortgage ledger in revenues.ts.
    const mortgage =
      state.sovereignMortgages?.find((m) => m.id === 'mortgage_khneifis_phosphate' && !m.isMortgaged) ??
      state.sovereignMortgages?.find((m) => !m.isMortgaged);
    if (mortgage) {
      mortgage.isMortgaged = true;
      state.macro.sovereignDebtUSD = Math.max(0, state.macro.sovereignDebtUSD - mortgage.immediateCashUSD);
    }
  }

  // Emergency banknote issue: the printed amount enters the money supply, so
  // the inflation cost the option promises actually exists. Its treasury credit
  // is the negative costSYP handled above.
  if (optionId === 'opt_emergency_print' && option.costSYP < 0) {
    const printedSYP = -option.costSYP;
    state.macro.m2MoneySupplySYP += printedSYP;
    // Apply the same money-printing term the turn engine uses (m2Delta / post-
    // print M2), so the option's promised inflation cost actually reaches the
    // parallel rate instead of only inflating the stock.
    state.macro.parallelRateSYP = calculateParallelRate(
      state.macro.parallelRateSYP,
      state.macro.m2MoneySupplySYP,
      printedSYP,
      0,
      state.macro.reservesUSD,
      0,
      0
    );
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
      state.governorates['as_suwayda'].tier = getUnrestTier(15);
    }
  }

  if (optionId === 'opt_disarm_suwayda') {
    if (state.governorates['as_suwayda']) {
      state.governorates['as_suwayda'].suwaydaSecessionProb = 95;
      state.governorates['as_suwayda'].suwaydaIntegrationIndex = 0;
      state.governorates['as_suwayda'].prri = 85;
      state.governorates['as_suwayda'].tier = getUnrestTier(85);
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
  // Idempotent: an event can only be punished once. Without this guard a
  // repeated click on the penalty button stacked the full penalty and could
  // drive the state into CRISIS_DEFAULT_COLLAPSE. Still retire the card so a
  // stale save that kept a resolved event active can always be closed.
  if (state.flags[`event_failed_${eventId}`] || state.flags[`event_resolved_${eventId}`]) {
    state.activeEvents = state.activeEvents.filter((e) => e.id !== eventId);
    return;
  }

  // 1. Severe loss of Civic Trust (-25 points)
  state.macro.civicTrust = Math.max(0, state.macro.civicTrust - 25);

  // 2. Loss of Executive Political Capital (-30 points)
  state.macro.politicalCapital = Math.max(0, state.macro.politicalCapital - 30);

  // 3. Spreading provincial unrest (+25 national RRI)
  state.macro.nationalRRI = Math.min(100, state.macro.nationalRRI + 25);

  // 4. Increase unrest across all key governorates, keeping the tier in sync
  // for the immediate fail-state check that game-store runs next.
  for (const gov of Object.values(state.governorates)) {
    gov.prri = Math.min(100, gov.prri + 15);
    gov.tier = getUnrestTier(gov.prri);
  }

  // Mark event as resolved through sovereign failure and remove the card, the
  // same way resolveEventOption does — otherwise it stays activeEvents[0] and
  // the player can never get past it.
  state.flags[`event_failed_${eventId}`] = 1;
  state.flags[`event_resolved_${eventId}`] = 1;
  state.activeEvents = state.activeEvents.filter((e) => e.id !== eventId);
}

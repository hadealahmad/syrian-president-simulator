/**
 * Player-Legal Play Driver & UI Limits Validator for Endings Regression Tests
 *
 * What "player-legal" means here:
 *   1. No direct mutation of GameState anywhere (including test setup).
 *   2. Every turn's TurnDirectives starts from getDefaultTurnDirectives() (or
 *      draft-store's advanceDraftLikeStore carryover) and passes through
 *      validatePlayerLegalDirectives(), which THROWS on any lever, stance,
 *      lock, grant/project FX-coverage gate, loan/facility/mortgage rule, or
 *      end-turn budget guard violation that the live Svelte UI prevents.
 *   3. Turns commit strictly through executeTurnLifecycle(state, directives)
 *      (the exact engine entry point gameStore.commitTurn uses).
 *   4. Active crisis events are resolved strictly through options allowed by
 *      canAffordEventOption(state, option).ok; when no option is affordable,
 *      applyUnresolvedCrisisPenalty + checkFailStates runs on a cloned state,
 *      matching EventModal.svelte and game-store.ts line-for-line.
 *
 * How to update UI_LIMITS_TABLE when the UI changes:
 *   Locate the cited Svelte component / store helper in UI_LIMITS_TABLE below,
 *   update the min/max/step, option set, or helper call to match the new UI
 *   code and line citation, and re-run `npm run test:endings`.
 */

import { calculateTurnBudget } from '../src/lib/stores/draft-store';
import { BASELINE_GOVERNORATES } from '../src/lib/engine/constants';
import { createInitialGameState } from '../src/lib/engine/baseline';
import {
  getDefaultTurnDirectives,
  executeTurnLifecycle,
  calculateProjectedTurnSummary,
} from '../src/lib/engine/turn-manager';
import {
  canAffordEventOption,
  resolveEventOption,
  applyUnresolvedCrisisPenalty,
} from '../src/lib/engine/events';
import { checkFailStates } from '../src/lib/engine/fail-states';
import { cloneGameState } from '../src/lib/engine/state-clone';
import {
  activeFacilityLocks,
  canSignFacility,
  facilityBreached,
} from '../src/lib/engine/facilities';
import {
  CHARITY_FUND_COST_SYP,
  POPULIST_GRANT_COST_SYP,
  IMPORT_SURGE_COST_USD,
} from '../src/lib/engine/revenues';
import { DECREES } from '../src/lib/ui/panels/shared';
import type {
  EventOption,
  EventCard,
  GameState,
  TurnDirectives,
} from '../src/lib/engine/types';

/**
 * Single source of truth for UI-enforced input limits and gates.
 * Every entry cites the live UI or store source file it mirrors.
 * Dynamic limits and affordability helpers are imported and called directly
 * inside validatePlayerLegalDirectives() rather than duplicating formulas.
 */
export const UI_LIMITS_TABLE = {
  sliders: {
    corporateTaxRate: {
      min: 10,
      max: 35,
      step: 1,
      default: 22,
      source: 'src/lib/ui/sections/treasury/RevenueTab.svelte:81-84',
    },
    telecomExciseRate: {
      min: 5,
      max: 30,
      step: 1,
      default: 15,
      source: 'src/lib/ui/sections/treasury/RevenueTab.svelte:111-114',
    },
    nassibTransitFeeUSD: {
      min: 200,
      max: 800,
      step: 50,
      default: 450,
      source: 'src/lib/ui/sections/treasury/RevenueTab.svelte:140-143',
    },
    remittanceCaptureSpread: {
      min: 5,
      max: 25,
      step: 1,
      default: 10,
      source: 'src/lib/ui/sections/treasury/RevenueTab.svelte:169-172',
    },
    wageBumpPercent: {
      min: 0,
      max: 400,
      step: 5,
      default: 0,
      source: 'src/lib/ui/sections/treasury/SpendingTab.svelte:381-384',
    },
    gridCapExUSD: {
      min: 0,
      max: 80_000_000,
      step: 5_000_000,
      default: 35_000_000,
      source: 'src/lib/ui/sections/treasury/SpendingTab.svelte:29,464-467,471',
    },
    moneyPrintingSYP: {
      min: 0,
      dynamicMaxFormula:
        'Math.max(50_000_000_000, Math.ceil((projected.deficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000) via calculateProjectedTurnSummary',
      step: 1_000_000_000,
      default: 0,
      source: 'src/lib/ui/sections/treasury/CurrencyTab.svelte:32,38-43,109-111',
    },
    dollarAuctionUSD: {
      min: 0,
      dynamicMaxFormula:
        'Math.floor(Math.max(0, Math.floor((state.macro.reservesUSD ?? 320_000_000) / 1_000_000)) / 5) * 5 * 1_000_000 (step-aligned reserves cap)',
      step: 5_000_000,
      default: 0,
      source: 'src/lib/ui/sections/treasury/CurrencyTab.svelte:69-71,203-205,212',
    },
    extraDebtRepaymentUSD: {
      min: 0,
      dynamicMaxFormula:
        'Math.max(0, Math.floor((budget.maxDebtRepaymentUSD ?? 0) / 1_000_000 / 5) * 5) * 1_000_000 via calculateTurnBudget',
      step: 5_000_000,
      disabledWhen: 'signedPrincipal === 0 || maxRepayM === 0',
      source: 'src/lib/ui/panels/EmergencyPanel.svelte:95-104,689-692,701',
    },
  },
  legacyNoUiFields: {
    officialRateAdjustment: {
      requiredValue: 0,
      source: 'src/lib/engine/turn-manager.ts (no active control in src/lib/ui/**)',
    },
    antiSpeculationRaids: {
      requiredValue: false,
      source: 'src/lib/engine/turn-manager.ts (no active control in src/lib/ui/**)',
    },
  },
  stances: {
    foodSubsidyLevel: {
      allowed: ['AUSTERE', 'STANDARD', 'GENEROUS'] as const,
      source: 'src/lib/ui/sections/treasury/SpendingTab.svelte:43-71',
    },
    wheatProcurement: {
      allowed: ['SUBSIDIZED_LOW', 'MARKET_PARITY', 'PREMIUM_INCENTIVE'] as const,
      source: 'src/lib/ui/sections/treasury/SpendingTab.svelte:73-101',
    },
    workforceStrategy: {
      allowed: ['MAINTAIN', 'PRUNE_CIVIL_SERVICE', 'ABSORB_MILITIAS'] as const,
      source: 'src/lib/ui/sections/governance/StancesTab.svelte:46-76',
    },
    dieselSmuggling: {
      allowed: ['CRACKDOWN', 'STANDARD', 'PERMISSIVE'] as const,
      source: 'src/lib/ui/sections/governance/StancesTab.svelte:94-124',
    },
    golanBorderStance: {
      allowed: ['RESTRAINT', 'LOCAL_GENDARMERIE', 'DEPLOY_ARMOR', 'UN_LIAISON'] as const,
      source: 'src/lib/ui/sections/governance/StancesTab.svelte:127-168',
    },
    southernPolicy: {
      allowed: ['HISTORIC_ACCORD', 'LOCAL_VOUCHERS', 'UNCONDITIONAL_AID', 'BLOCKADE'] as const,
      source: 'src/lib/ui/panels/ProvincialPanel.svelte:305-351',
    },
    propertyRestitution: {
      allowed: ['RESTITUTE_TO_REFUGEES', 'MONETIZE_AS_STATE_LAND'] as const,
      source: 'src/lib/engine/types.ts:237 (upcoming UI control; routes use RESTITUTE_TO_REFUGEES)',
    },
  },
  locksAndGates: {
    oligarchTurnLock: {
      minTurn: 3,
      allowedActions: ['SETTLEMENT_80_20', 'NATIONALIZE_SOE', 'FOREIGN_LIQUIDATION'] as const,
      source: 'src/lib/ui/sections/governance/AssetsTab.svelte:28-49',
    },
    imfDieselLock: {
      helper: 'activeFacilityLocks(state).dieselLocked || signedFacilityIds.includes("facility_imf_stabilization")',
      requiredDieselSmuggling: 'CRACKDOWN',
      source:
        'src/lib/ui/sections/governance/StancesTab.svelte:86-92; src/lib/stores/draft-store.ts:417-426; src/lib/ui/panels/EmergencyPanel.svelte:492-494',
    },
    decreesAndActions: {
      validIds: DECREES.map((d) => d.id),
      oneTimeEnactedGate: '!(state.enactedDecrees?.includes(id))',
      source:
        'src/lib/ui/panels/shared.ts:35-168; src/lib/ui/sections/governance/DecreesTab.svelte:83-85,137; src/lib/ui/panels/EmergencyPanel.svelte:139-141,503',
    },
    programsAndGrants: {
      expatriateBrainGainIncentive: 'budgetWithout.canAffordWithFxCoverage(20_000_000, 3_500_000_000)',
      charityFundActive: 'budgetWithout.canAffordWithFxCoverage(0, CHARITY_FUND_COST_SYP)',
      populistGrant: 'budgetWithout.canAffordWithFxCoverage(0, POPULIST_GRANT_COST_SYP)',
      importSurge: '(state.macro.reservesUSD ?? 0) >= IMPORT_SURGE_COST_USD',
      source: 'src/lib/ui/sections/treasury/SpendingTab.svelte:126-153',
    },
    provincialActions: {
      deminingPriorityId:
        'BASELINE_GOVERNORATES[id].mineSaturationPct > 8 && gov.mineSaturationPct > 8 && budgetWithout.canAffordWithFxCoverage(20_000_000, 8_000_000_000)',
      powerBoostGovId:
        'gov.dailyBlackoutHours > 2 && budgetWithout.canAffordWithFxCoverage(10_000_000, 3_000_000_000)',
      provincialProjects:
        '!proj.isExecuted && proj.costPoliticalCapital <= budgetWithout.remainingPC && netUSD <= budgetWithout.remainingUSD && budgetWithout.canAffordWithFxCoverage(netUSD, proj.costSYP)',
      source: 'src/lib/ui/panels/ProvincialPanel.svelte:42-44,193-208,236-270',
    },
    loansAndFacilities: {
      signedLoanIds:
        '!loan.isSigned && remainingPCWithout >= loan.politicalCapitalCost && !(parisRepudiated && (id === "loan_imf_wb" || id === "loan_gulf_swf"))',
      signedFacilityIds: 'canSignFacility(state, id, remainingPCWithout).ok && !facilityBreached(state, directives, id)',
      executedMortgageIds: 'mort && !mort.isMortgaged',
      terminatedLoanIds: 'loan.isSigned && remaining > 0 && remainingUSDWithout >= remaining',
      source:
        'src/lib/ui/panels/EmergencyPanel.svelte:59-132,404-496,720; src/lib/stores/draft-store.ts:69-79,180-191; src/lib/engine/turn-manager.ts:552-558',
    },
    endTurnBudgetGuard: {
      condition: 'budget.remainingPC >= 0 && budget.remainingUSD >= 0 via calculateTurnBudget',
      source: 'src/lib/ui/TurnReviewModal.svelte:49,101-105',
    },
  },
} as const;

const PERSISTENT_POLITICAL_ACTIONS = [
  'MARTIAL_LAW',
  'SMUGGLING_BORDER_SWEEP',
  'CABINET_HEARING',
];

const VALID_DECREE_IDS = new Set(DECREES.map((d) => d.id));

function hasDuplicates(items: readonly string[]): boolean {
  return new Set(items).size !== items.length;
}

function isStepAligned(value: number, min: number, max: number, step: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (value - min) % step === 0
  );
}

/**
 * Mirrors draftStore.advanceToNextTurn() in src/lib/stores/draft-store.ts:433-463.
 */
export function advanceDraftLikeStore(d: TurnDirectives): TurnDirectives {
  return {
    ...d,
    signedLoanIds: [],
    executedMortgageIds: [],
    signedFacilityIds: [],
    oligarchDecisions: {},
    provincialProjects: [],
    extraDebtRepaymentUSD: 0,
    populistGrant: false,
    importSurge: false,
    terminatedLoanIds: [],
    dollarAuctionUSD: 0,
    deminingPriorityId: null,
    powerBoostGovId: null,
    moneyPrintingSYP: 0,
    activePoliticalActions: (d.activePoliticalActions || []).filter((a) =>
      PERSISTENT_POLITICAL_ACTIONS.includes(a)
    ),
  };
}

/**
 * Validates that a TurnDirectives object is 100% reachable through the live UI
 * for the given GameState. THROWS with a clear diagnostic message on any
 * violation so no route can silently bypass UI constraints.
 */
export function validatePlayerLegalDirectives(state: GameState, d: TurnDirectives): void {
  const errors: string[] = [];
  const L = UI_LIMITS_TABLE;

  // 1. Legacy / non-UI fields
  if (d.officialRateAdjustment !== L.legacyNoUiFields.officialRateAdjustment.requiredValue) {
    errors.push(`officialRateAdjustment=${d.officialRateAdjustment} (no UI control; must be 0)`);
  }
  if (d.antiSpeculationRaids !== L.legacyNoUiFields.antiSpeculationRaids.requiredValue) {
    errors.push(`antiSpeculationRaids=${d.antiSpeculationRaids} (no UI control; must be false)`);
  }

  // 2. Fixed-bounds sliders
  const s = L.sliders;
  if (!isStepAligned(d.corporateTaxRate, s.corporateTaxRate.min, s.corporateTaxRate.max, s.corporateTaxRate.step)) {
    errors.push(`corporateTaxRate=${d.corporateTaxRate} outside [${s.corporateTaxRate.min}, ${s.corporateTaxRate.max}] step ${s.corporateTaxRate.step}`);
  }
  if (!isStepAligned(d.telecomExciseRate, s.telecomExciseRate.min, s.telecomExciseRate.max, s.telecomExciseRate.step)) {
    errors.push(`telecomExciseRate=${d.telecomExciseRate} outside [${s.telecomExciseRate.min}, ${s.telecomExciseRate.max}] step ${s.telecomExciseRate.step}`);
  }
  if (!isStepAligned(d.nassibTransitFeeUSD, s.nassibTransitFeeUSD.min, s.nassibTransitFeeUSD.max, s.nassibTransitFeeUSD.step)) {
    errors.push(`nassibTransitFeeUSD=${d.nassibTransitFeeUSD} outside [${s.nassibTransitFeeUSD.min}, ${s.nassibTransitFeeUSD.max}] step ${s.nassibTransitFeeUSD.step}`);
  }
  if (!isStepAligned(d.remittanceCaptureSpread, s.remittanceCaptureSpread.min, s.remittanceCaptureSpread.max, s.remittanceCaptureSpread.step)) {
    errors.push(`remittanceCaptureSpread=${d.remittanceCaptureSpread} outside [${s.remittanceCaptureSpread.min}, ${s.remittanceCaptureSpread.max}] step ${s.remittanceCaptureSpread.step}`);
  }
  if (!isStepAligned(d.wageBumpPercent, s.wageBumpPercent.min, s.wageBumpPercent.max, s.wageBumpPercent.step)) {
    errors.push(`wageBumpPercent=${d.wageBumpPercent} outside [${s.wageBumpPercent.min}, ${s.wageBumpPercent.max}] step ${s.wageBumpPercent.step}`);
  }
  if (!isStepAligned(d.gridCapExUSD, s.gridCapExUSD.min, s.gridCapExUSD.max, s.gridCapExUSD.step)) {
    errors.push(`gridCapExUSD=${d.gridCapExUSD} outside [${s.gridCapExUSD.min}, ${s.gridCapExUSD.max}] step ${s.gridCapExUSD.step}`);
  }

  // 3. Dynamic currency sliders
  const maxAuctionM = Math.max(0, Math.floor((state.macro.reservesUSD ?? 320_000_000) / 1_000_000));
  const maxAuctionSliderM = Math.floor(maxAuctionM / 5) * 5;
  const maxAuctionUSD = maxAuctionSliderM * 1_000_000;
  if (!isStepAligned(d.dollarAuctionUSD, s.dollarAuctionUSD.min, maxAuctionUSD, s.dollarAuctionUSD.step)) {
    errors.push(`dollarAuctionUSD=${d.dollarAuctionUSD} outside [0, ${maxAuctionUSD}] step ${s.dollarAuctionUSD.step} (reserves=${state.macro.reservesUSD})`);
  }

  const safeForProj =
    d.dollarAuctionUSD > (state.macro.reservesUSD ?? 0)
      ? { ...d, dollarAuctionUSD: Math.max(0, state.macro.reservesUSD ?? 0) }
      : d;
  const projected = calculateProjectedTurnSummary(state, safeForProj);
  const printingMaxSYP = Math.max(
    50_000_000_000,
    Math.ceil((projected.deficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000
  );
  if (!isStepAligned(d.moneyPrintingSYP, s.moneyPrintingSYP.min, printingMaxSYP, s.moneyPrintingSYP.step)) {
    errors.push(`moneyPrintingSYP=${d.moneyPrintingSYP} outside [0, ${printingMaxSYP}] step ${s.moneyPrintingSYP.step}`);
  }

  // 4. Stances & option sets
  if (d.foodSubsidyLevel === null || !(L.stances.foodSubsidyLevel.allowed as readonly string[]).includes(d.foodSubsidyLevel)) {
    errors.push(`foodSubsidyLevel=${String(d.foodSubsidyLevel)} invalid`);
  }
  if (d.wheatProcurement === null || !(L.stances.wheatProcurement.allowed as readonly string[]).includes(d.wheatProcurement)) {
    errors.push(`wheatProcurement=${String(d.wheatProcurement)} invalid`);
  }
  if (d.workforceStrategy === null || !(L.stances.workforceStrategy.allowed as readonly string[]).includes(d.workforceStrategy)) {
    errors.push(`workforceStrategy=${String(d.workforceStrategy)} invalid`);
  }
  if (d.dieselSmuggling === null || !(L.stances.dieselSmuggling.allowed as readonly string[]).includes(d.dieselSmuggling)) {
    errors.push(`dieselSmuggling=${String(d.dieselSmuggling)} invalid`);
  }
  if (!(L.stances.golanBorderStance.allowed as readonly string[]).includes(d.golanBorderStance)) {
    errors.push(`golanBorderStance=${String(d.golanBorderStance)} invalid`);
  }
  if (!(L.stances.southernPolicy.allowed as readonly string[]).includes(d.southernPolicy)) {
    errors.push(`southernPolicy=${String(d.southernPolicy)} invalid`);
  }
  if (!(L.stances.propertyRestitution.allowed as readonly string[]).includes(d.propertyRestitution)) {
    errors.push(`propertyRestitution=${String(d.propertyRestitution)} invalid`);
  }

  // 5. IMF diesel conditionality lock
  const imfSigningNow = (d.signedFacilityIds ?? []).includes('facility_imf_stabilization');
  if ((activeFacilityLocks(state).dieselLocked || imfSigningNow) && d.dieselSmuggling !== 'CRACKDOWN') {
    errors.push(`dieselSmuggling=${String(d.dieselSmuggling)} violates IMF CRACKDOWN lock`);
  }

  // 6. Confiscated-asset decisions (turn-3 lock + asset pending + allowed action)
  const oligarchEntries = Object.entries(d.oligarchDecisions || {});
  if ((state.turnNumber ?? 1) < L.locksAndGates.oligarchTurnLock.minTurn && oligarchEntries.length > 0) {
    errors.push(`oligarchDecisions non-empty on turn ${state.turnNumber} (locked until turn 3)`);
  }
  for (const [assetId, action] of oligarchEntries) {
    const asset = state.confiscatedAssets.find((a) => a.id === assetId);
    if (!asset) {
      errors.push(`oligarchDecisions references unknown asset ${assetId}`);
    } else if (asset.status !== 'PENDING') {
      errors.push(`oligarchDecisions[${assetId}] already processed (${asset.status})`);
    }
    if (!(L.locksAndGates.oligarchTurnLock.allowedActions as readonly string[]).includes(action)) {
      errors.push(`oligarchDecisions[${assetId}]=${String(action)} invalid`);
    }
  }

  // 7. Political actions & decrees
  const actions = d.activePoliticalActions ?? [];
  if (hasDuplicates(actions)) {
    errors.push(`activePoliticalActions contains duplicates: ${actions.join(',')}`);
  }
  for (const actId of actions) {
    if (!VALID_DECREE_IDS.has(actId)) {
      errors.push(`activePoliticalActions contains unknown decree ${actId}`);
    } else if (state.enactedDecrees?.includes(actId)) {
      errors.push(`activePoliticalActions re-enacts already-enacted decree ${actId}`);
    }
  }

  // 8. Programs & grants (FX-coverage / reserves gates from SpendingTab.svelte)
  if (d.expatriateBrainGainIncentive) {
    const bWithout = calculateTurnBudget(state, { ...d, expatriateBrainGainIncentive: false });
    if (!bWithout.canAffordWithFxCoverage(20_000_000, 3_500_000_000)) {
      errors.push('expatriateBrainGainIncentive fails SpendingTab canAffordWithFxCoverage($20M, 3.5B SYP)');
    }
  }
  if (d.charityFundActive) {
    const bWithout = calculateTurnBudget(state, { ...d, charityFundActive: false });
    if (!bWithout.canAffordWithFxCoverage(0, CHARITY_FUND_COST_SYP)) {
      errors.push('charityFundActive fails SpendingTab canAffordWithFxCoverage(0, CHARITY_FUND_COST_SYP)');
    }
  }
  if (d.populistGrant) {
    const bWithout = calculateTurnBudget(state, { ...d, populistGrant: false });
    if (!bWithout.canAffordWithFxCoverage(0, POPULIST_GRANT_COST_SYP)) {
      errors.push('populistGrant fails SpendingTab canAffordWithFxCoverage(0, POPULIST_GRANT_COST_SYP)');
    }
  }
  if (d.importSurge) {
    if ((state.macro.reservesUSD ?? 0) < IMPORT_SURGE_COST_USD) {
      errors.push(`importSurge requires reservesUSD >= ${IMPORT_SURGE_COST_USD} (got ${state.macro.reservesUSD})`);
    }
  }

  // 9. Provincial actions & projects (ProvincialPanel.svelte)
  if (d.deminingPriorityId) {
    const gov = state.governorates[d.deminingPriorityId];
    const basePct = Number(BASELINE_GOVERNORATES[d.deminingPriorityId]?.mineSaturationPct ?? 0);
    if (!gov) {
      errors.push(`deminingPriorityId=${d.deminingPriorityId} unknown governorate`);
    } else {
      if (basePct <= 8 || gov.mineSaturationPct <= 8) {
        errors.push(`deminingPriorityId=${d.deminingPriorityId} ineligible (base=${basePct}, cur=${gov.mineSaturationPct})`);
      }
      const bWithout = calculateTurnBudget(state, { ...d, deminingPriorityId: null });
      if (!bWithout.canAffordWithFxCoverage(20_000_000, 8_000_000_000)) {
        errors.push(`deminingPriorityId=${d.deminingPriorityId} fails FX coverage ($20M, 8B SYP)`);
      }
    }
  }

  if (d.powerBoostGovId) {
    const gov = state.governorates[d.powerBoostGovId];
    if (!gov) {
      errors.push(`powerBoostGovId=${d.powerBoostGovId} unknown governorate`);
    } else {
      if (gov.dailyBlackoutHours <= 2) {
        errors.push(`powerBoostGovId=${d.powerBoostGovId} ineligible (blackout=${gov.dailyBlackoutHours} <= 2)`);
      }
      const bWithout = calculateTurnBudget(state, { ...d, powerBoostGovId: null });
      if (!bWithout.canAffordWithFxCoverage(10_000_000, 3_000_000_000)) {
        errors.push(`powerBoostGovId=${d.powerBoostGovId} fails FX coverage ($10M, 3B SYP)`);
      }
    }
  }

  const projects = d.provincialProjects ?? [];
  if (hasDuplicates(projects)) {
    errors.push(`provincialProjects contains duplicates: ${projects.join(',')}`);
  }
  for (const projId of projects) {
    const gov = Object.values(state.governorates).find((g) => g.strategicProject?.id === projId);
    if (!gov || !gov.strategicProject) {
      errors.push(`provincialProjects references unknown project ${projId}`);
      continue;
    }
    const proj = gov.strategicProject;
    if (proj.isExecuted) {
      errors.push(`provincialProjects[${projId}] already executed`);
      continue;
    }
    const bWithout = calculateTurnBudget(state, {
      ...d,
      provincialProjects: projects.filter((id) => id !== projId),
    });
    const netUSD = Math.max(0, proj.costUSD - bWithout.grantAvailableUSD);
    if (proj.costPoliticalCapital > bWithout.remainingPC) {
      errors.push(`provincialProjects[${projId}] PC cost ${proj.costPoliticalCapital} > remainingPC ${bWithout.remainingPC}`);
    }
    if (netUSD > bWithout.remainingUSD) {
      errors.push(`provincialProjects[${projId}] netUSD ${netUSD} > remainingUSD ${bWithout.remainingUSD}`);
    }
    if (!bWithout.canAffordWithFxCoverage(netUSD, proj.costSYP)) {
      errors.push(`provincialProjects[${projId}] fails FX coverage`);
    }
  }

  // 10. Loans, facilities, mortgages, early terminations (EmergencyPanel.svelte)
  const signedLoans = d.signedLoanIds ?? [];
  if (hasDuplicates(signedLoans)) {
    errors.push(`signedLoanIds contains duplicates: ${signedLoans.join(',')}`);
  }
  const parisRepudiated =
    state.flags?.Debt_Repudiated_Paris === 1 || actions.includes('REPUDIATE_PARIS');
  for (const loanId of signedLoans) {
    const loan = state.foreignLoans.find((l) => l.id === loanId);
    if (!loan) {
      errors.push(`signedLoanIds references unknown loan ${loanId}`);
      continue;
    }
    if (loan.isSigned) {
      errors.push(`signedLoanIds[${loanId}] already signed`);
      continue;
    }
    if (parisRepudiated && (loanId === 'loan_imf_wb' || loanId === 'loan_gulf_swf')) {
      errors.push(`signedLoanIds[${loanId}] unavailable after Paris Club repudiation`);
      continue;
    }
    const bWithout = calculateTurnBudget(state, {
      ...d,
      signedLoanIds: signedLoans.filter((id) => id !== loanId),
    });
    if (bWithout.remainingPC < loan.politicalCapitalCost) {
      errors.push(`signedLoanIds[${loanId}] requires ${loan.politicalCapitalCost} PC (available ${bWithout.remainingPC})`);
    }
  }

  const signedFacs = d.signedFacilityIds ?? [];
  if (hasDuplicates(signedFacs)) {
    errors.push(`signedFacilityIds contains duplicates: ${signedFacs.join(',')}`);
  }
  for (const facId of signedFacs) {
    const bWithout = calculateTurnBudget(state, {
      ...d,
      signedFacilityIds: signedFacs.filter((id) => id !== facId),
    });
    const check = canSignFacility(state, facId, bWithout.remainingPC);
    if (!check.ok) {
      errors.push(`signedFacilityIds[${facId}] blocked: ${check.reasonAr}`);
    } else if (facilityBreached(state, d, facId)) {
      errors.push(`signedFacilityIds[${facId}] breached on signing turn`);
    }
  }

  const mortgages = d.executedMortgageIds ?? [];
  if (hasDuplicates(mortgages)) {
    errors.push(`executedMortgageIds contains duplicates: ${mortgages.join(',')}`);
  }
  for (const mortId of mortgages) {
    const mort = state.sovereignMortgages?.find((m) => m.id === mortId);
    if (!mort) {
      errors.push(`executedMortgageIds references unknown mortgage ${mortId}`);
    } else if (mort.isMortgaged) {
      errors.push(`executedMortgageIds[${mortId}] already mortgaged`);
    }
  }

  const termLoans = d.terminatedLoanIds ?? [];
  if (hasDuplicates(termLoans)) {
    errors.push(`terminatedLoanIds contains duplicates: ${termLoans.join(',')}`);
  }
  for (const loanId of termLoans) {
    const loan = state.foreignLoans.find((l) => l.id === loanId);
    if (!loan || !loan.isSigned) {
      errors.push(`terminatedLoanIds[${loanId}] is not an active signed loan`);
      continue;
    }
    const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
    const bWithout = calculateTurnBudget(state, {
      ...d,
      terminatedLoanIds: termLoans.filter((id) => id !== loanId),
    });
    if (remaining <= 0 || bWithout.remainingUSD < remaining) {
      errors.push(`terminatedLoanIds[${loanId}] unaffordable (remaining=${remaining}, available=${bWithout.remainingUSD})`);
    }
  }

  // 11. End-turn budget guard & early debt repayment slider (TurnReviewModal & EmergencyPanel)
  const budget = calculateTurnBudget(state, d);
  if (budget.remainingPC < 0 || budget.remainingUSD < 0) {
    errors.push(
      `TurnReview over-budget guard failed (remainingPC=${budget.remainingPC}, remainingUSD=$${(budget.remainingUSD / 1e6).toFixed(1)}M)`
    );
  }

  const signedPrincipalUSD = state.foreignLoans
    .filter((l) => l.isSigned)
    .reduce((acc, l) => acc + (l.remainingPrincipalUSD ?? l.disbursementUSD), 0);
  const maxRepayM = Math.max(
    0,
    Math.floor((budget.maxDebtRepaymentUSD ?? 0) / 1_000_000 / 5) * 5
  );
  const maxRepayUSD = signedPrincipalUSD === 0 ? 0 : maxRepayM * 1_000_000;
  const repayUSD = d.extraDebtRepaymentUSD ?? 0;
  if (!isStepAligned(repayUSD, s.extraDebtRepaymentUSD.min, maxRepayUSD, s.extraDebtRepaymentUSD.step)) {
    errors.push(`extraDebtRepaymentUSD=${repayUSD} outside [0, ${maxRepayUSD}] step ${s.extraDebtRepaymentUSD.step}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Illegal player directives on Turn ${state.turnNumber ?? 1}: ${errors.join('; ')}`
    );
  }
}

export type PolicyFn = (state: GameState, prevDraft: TurnDirectives) => TurnDirectives;
export type EventPickerFn = (
  state: GameState,
  event: EventCard,
  affordableOptions: EventOption[]
) => EventOption | null;

export interface LegalRunResult {
  state: GameState;
  violations: number;
  violationMessages: string[];
  resolvedEvents: number;
  unresolvedPenalties: number;
}

/**
 * Mirrors gameStore.chooseEventOption & gameStore.triggerUnresolvedCrisisPenalty
 * in src/lib/stores/game-store.ts:168-191 using cloneGameState (no direct state mutation).
 */
function resolveEventsLegally(
  currentState: GameState,
  picker: EventPickerFn
): { state: GameState; resolved: number; penalties: number } {
  let state = currentState;
  let resolved = 0;
  let penalties = 0;

  while (!state.isGameOver && state.activeEvents && state.activeEvents.length > 0) {
    const ev = state.activeEvents[0];
    const affordable = ev.options.filter((o) => canAffordEventOption(state, o).ok);
    const cloned = cloneGameState(state);

    if (affordable.length === 0) {
      applyUnresolvedCrisisPenalty(cloned, ev.id);
      penalties++;
    } else {
      const pick = picker(state, ev, affordable) ?? affordable[0];
      resolveEventOption(cloned, ev.id, pick.id);
      resolved++;
    }

    const fail = checkFailStates(cloned);
    if (fail.isFailed) {
      cloned.isGameOver = true;
      cloned.failState = fail;
    }
    state = cloned;
  }

  return { state, resolved, penalties };
}

/**
 * Plays a full game (up to maxTurns = 40) strictly through player-legal inputs.
 */
export function runLegalGame(
  seed: number,
  policyFn: PolicyFn,
  eventPicker: EventPickerFn,
  maxTurns = 40
): LegalRunResult {
  let state = createInitialGameState(seed);
  let draft = getDefaultTurnDirectives();
  const violationMessages: string[] = [];
  let unresolvedPenalties = 0;
  let resolvedEvents = 0;

  for (let t = 1; t <= maxTurns && !state.isGameOver; t++) {
    const nextDraft = policyFn(state, draft);
    try {
      validatePlayerLegalDirectives(state, nextDraft);
    } catch (err) {
      violationMessages.push(err instanceof Error ? err.message : String(err));
    }
    state = executeTurnLifecycle(state, nextDraft);
    draft = advanceDraftLikeStore(nextDraft);

    if (!state.isGameOver && state.activeEvents && state.activeEvents.length > 0) {
      const res = resolveEventsLegally(state, eventPicker);
      state = res.state;
      unresolvedPenalties += res.penalties;
      resolvedEvents += res.resolved;
    }
  }

  return {
    state,
    violations: violationMessages.length,
    violationMessages,
    resolvedEvents,
    unresolvedPenalties,
  };
}

// ---------------------------------------------------------------------------
// Reusable UI-legal strategy helpers shared by ending routes & winnability
// ---------------------------------------------------------------------------

export function fitGridCapEx(
  state: GameState,
  d: TurnDirectives,
  desiredM: number,
  reserveBufferUSD = 0
): void {
  d.gridCapExUSD = 0;
  const b = calculateTurnBudget(state, d);
  const availM = Math.floor(Math.max(0, b.remainingUSD - reserveBufferUSD) / 5_000_000) * 5;
  d.gridCapExUSD = Math.min(80, Math.min(desiredM, availM)) * 1_000_000;
}

export function cheapestEventOption(opts: EventOption[]): EventOption {
  return [...opts].sort((a, b) => a.costUSD + a.costSYP / 162 - (b.costUSD + b.costSYP / 162))[0];
}

export function survivalEventPicker(
  opts: EventOption[],
  state: GameState,
  target: 'phoenix' | 'garrison' | 'hollowed' | 'mortgaged' | 'dust' | 'cantons' | 'frozen'
): EventOption {
  const scored = opts.map((o) => {
    let score = 0;
    if (state.macro.reservesUSD - o.costUSD < 40_000_000) score -= 500;
    if (state.macro.reservesUSD - o.costUSD < 80_000_000) score -= 80;
    score -= o.costUSD / 1_000_000;
    score -= Math.max(0, o.costPC) * 1.5;

    if (state.macro.nationalRRI > 50) score -= o.effectRRI * 14;
    else score -= o.effectRRI * 8;
    if (state.macro.civicTrust < 35) score += o.effectTrust * 14;
    else score += o.effectTrust * 8;

    if (target === 'phoenix') {
      score -= o.effectCorruption * 6;
      score += o.effectCompetence * 4;
      if (o.id === 'opt_historic_accord') score += 50;
    } else if (target === 'garrison') {
      score += o.effectCorruption * 15;
    } else if (target === 'hollowed') {
      const nextCorr = state.macro.systemicCorruption + o.effectCorruption;
      score -= Math.abs(nextCorr - 52) * 4;
    } else if (target === 'cantons' || target === 'frozen') {
      if (o.id === 'opt_historic_accord') score -= 1000;
    }
    return { o, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].o;
}

export function phoenixPolicy(state: GameState): TurnDirectives {
  const d = getDefaultTurnDirectives();
  d.wageBumpPercent = state.macro.nationalRRI > 55 ? 10 : 5;
  d.foodSubsidyLevel = state.macro.nationalRRI > 35 ? 'GENEROUS' : 'STANDARD';
  d.wheatProcurement = 'MARKET_PARITY';
  d.nassibTransitFeeUSD = 700;
  d.remittanceCaptureSpread = 15;
  d.corporateTaxRate = 22;
  d.telecomExciseRate = 15;
  d.southernPolicy = 'HISTORIC_ACCORD';
  d.activePoliticalActions = ['CABINET_HEARING'];

  if (!state.enactedDecrees?.includes('OPPOSITION_SEATS')) {
    d.activePoliticalActions.push('OPPOSITION_SEATS');
  }
  if (!state.enactedDecrees?.includes('UNITY_SPEECH')) {
    d.activePoliticalActions.push('UNITY_SPEECH');
  }
  if (!state.enactedDecrees?.includes('REPUDIATE_IRAN_INFORMAL')) {
    d.activePoliticalActions.push('REPUDIATE_IRAN_INFORMAL');
  }
  if (!state.enactedDecrees?.includes('REPUDIATE_IRAN_FORMAL') && state.turnNumber === 1) {
    d.activePoliticalActions.push('REPUDIATE_IRAN_FORMAL');
  }
  if (
    !state.enactedDecrees?.includes('ANTI_CORRUPTION_COMMISSION') &&
    calculateTurnBudget(state, d).remainingPC >= 25
  ) {
    d.activePoliticalActions.push('ANTI_CORRUPTION_COMMISSION');
  } else if (
    state.macro.systemicCorruption >= 20 &&
    calculateTurnBudget(state, d).remainingPC >= 28
  ) {
    d.activePoliticalActions.push('SMUGGLING_BORDER_SWEEP');
  }

  if (state.turnNumber > 2) {
    const pending = state.confiscatedAssets.filter((a) => a.status === 'PENDING');
    if (pending.length > 0 && calculateTurnBudget(state, d).remainingPC >= 25) {
      d.oligarchDecisions = { [pending[0].id]: 'SETTLEMENT_80_20' };
    }
  }

  fitGridCapEx(state, d, state.macro.dailyPowerHours < 16 ? 35 : 25, 50_000_000);

  const lowestBlackout = Object.values(state.governorates)
    .filter((g) => g.dailyBlackoutHours > 2)
    .sort((a, b) => a.reconstructionScore - b.reconstructionScore)[0];
  if (lowestBlackout) {
    const b = calculateTurnBudget(state, d);
    if (b.canAffordWithFxCoverage(10_000_000, 3_000_000_000) && b.remainingUSD > 50_000_000) {
      d.powerBoostGovId = lowestBlackout.id;
    }
  }

  const unexecuted = Object.values(state.governorates)
    .filter((g) => g.strategicProject && !g.strategicProject.isExecuted)
    .sort((a, b) => a.strategicProject!.costUSD - b.strategicProject!.costUSD);
  for (const g of unexecuted) {
    const p = g.strategicProject!;
    const b = calculateTurnBudget(state, d);
    const netUSD = Math.max(0, p.costUSD - b.grantAvailableUSD);
    if (
      b.remainingPC - p.costPoliticalCapital >= 10 &&
      b.canAffordWithFxCoverage(netUSD, p.costSYP) &&
      b.remainingUSD - netUSD >= 35_000_000
    ) {
      d.provincialProjects = [p.id];
      break;
    }
  }

  if (calculateTurnBudget(state, d).remainingPC < 0) {
    d.southernPolicy = 'LOCAL_VOUCHERS';
  }
  return d;
}

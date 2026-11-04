import type {
  GameState,
  TurnDirectives,
  RevenueAudit,
  TurnExecutionPlan,
  OligarchExecution,
  ProvincialExecution,
  PatronageExecution,
} from './types';
import { IRAN_OIL_COUPON_USD, GROWTH_TUNING, BASELINE_CIVIL_SERVICE_HEADCOUNT } from './constants';
import { computeFacilityTurn, getFacilityDef, facilityBreached } from './facilities';
import { computeAuctionAbsorbedSYP, canAffordDirectiveCost } from './currency';
import {
  getOligarchTerms,
  getOligarchSettlementPCCost,
  getOligarchLiquidationPCCost,
  getOligarchNationalizePCEarned,
} from './oligarch-helpers';

// Patronage economics: cash/FX spent to buy political capital.
export const POPULIST_GRANT_COST_SYP = 7_500_000_000;
export const CHARITY_FUND_COST_SYP = 2_500_000_000;
export const IMPORT_SURGE_COST_USD = 40_000_000;
export const LOAN_TERMINATION_PC_EARNED = 6;
export const LOAN_TERMINATION_LEVERAGE_EARNED = 4;

/**
 * Full early termination (sovereign buyback) of signed loans, all-or-nothing
 * per loan in listed order, clamped by available FX reserves. Pure function:
 * the turn manager replays the same allocation when mutating state, so the
 * audit preview and the committed turn always agree.
 */
export function allocateLoanTermination(
  state: GameState,
  directives: TurnDirectives
): { paidByLoan: Record<string, number>; totalPaidUSD: number; terminatedIds: string[] } {
  const paidByLoan: Record<string, number> = {};
  const terminatedIds: string[] = [];
  let avail = Math.max(0, state.macro.reservesUSD);
  for (const id of directives.terminatedLoanIds ?? []) {
    if (paidByLoan[id] !== undefined) continue;
    const loan = state.foreignLoans?.find((l) => l.id === id);
    if (!loan || !loan.isSigned) continue;
    const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
    if (remaining <= 0) continue;
    if (avail < remaining) continue; // all-or-nothing: skip when unaffordable
    paidByLoan[id] = remaining;
    terminatedIds.push(id);
    avail -= remaining;
  }
  return { paidByLoan, totalPaidUSD: Math.max(0, state.macro.reservesUSD - avail), terminatedIds };
}

/**
 * Resolves which oligarch decisions Phase 1 will actually settle, replaying its
 * PC gates in the same order. Pure: the commit applies this plan, the rehearsal
 * preview audits it, and the audit books its cash — one decision, one charge.
 */
export function resolveOligarchExecution(
  state: GameState,
  directives: TurnDirectives
): OligarchExecution[] {
  const executed: OligarchExecution[] = [];
  let pc = state.macro.politicalCapital;
  for (const [assetId, action] of Object.entries(directives.oligarchDecisions ?? {})) {
    const asset = state.confiscatedAssets?.find((a) => a.id === assetId);
    if (!asset || asset.status !== 'PENDING') continue;
    const terms = getOligarchTerms(asset);
    if (action === 'SETTLEMENT_80_20') {
      const costPC = getOligarchSettlementPCCost(asset.valuationUSD);
      if (pc < costPC) continue;
      pc -= costPC;
      executed.push({
        assetId,
        action,
        costPC,
        earnedPC: 0,
        settlementUSD: terms.settlementUSD,
        settlementSYP: terms.settlementSYP,
        liquidationUSD: 0,
      });
    } else if (action === 'FOREIGN_LIQUIDATION') {
      const costPC = getOligarchLiquidationPCCost(asset.valuationUSD);
      if (pc < costPC) continue;
      pc -= costPC;
      executed.push({
        assetId,
        action,
        costPC,
        earnedPC: 0,
        settlementUSD: 0,
        settlementSYP: 0,
        liquidationUSD: terms.liquidationUSD,
      });
    } else if (action === 'NATIONALIZE_SOE') {
      const earnedPC = getOligarchNationalizePCEarned(asset.valuationUSD);
      pc = Math.min(200, pc + earnedPC);
      executed.push({
        assetId,
        action,
        costPC: 0,
        earnedPC,
        settlementUSD: 0,
        settlementSYP: 0,
        liquidationUSD: 0,
      });
    }
  }
  return executed;
}

/**
 * Resolves which provincial projects / demining / power-boost will execute,
 * replaying Phase 4's PC and dual-currency gates. Eligibility is read from the
 * state handed in, so the caller must pass the pre-Phase-4 state: the audit
 * then bills exactly what ran instead of every listed directive (and matches
 * the pre-action mine-saturation / blackout thresholds).
 */
export function resolveProvincialExecution(
  state: GameState,
  directives: TurnDirectives
): ProvincialExecution {
  const plan: ProvincialExecution = {
    projectIds: [],
    projectCostUSD: 0,
    projectCostSYP: 0,
    projectPoliticalCapital: 0,
    demining: false,
    powerBoost: false,
  };

  let pc = state.macro.politicalCapital;
  let grantBucket = state.macro.grantBucketUSD ?? 0;
  const seen = new Set<string>();
  for (const projId of directives.provincialProjects ?? []) {
    for (const gov of Object.values(state.governorates)) {
      const proj = gov.strategicProject;
      if (!proj || proj.id !== projId || proj.isExecuted || seen.has(proj.id)) continue;
      const effectiveReserves = state.macro.reservesUSD + grantBucket;
      if (
        pc < proj.costPoliticalCapital ||
        !canAffordDirectiveCost(
          effectiveReserves,
          state.macro.treasurySYP,
          proj.costUSD,
          proj.costSYP,
          state.macro.parallelRateSYP
        )
      ) {
        continue;
      }
      pc -= proj.costPoliticalCapital;
      grantBucket = Math.max(0, grantBucket - Math.min(grantBucket, proj.costUSD));
      seen.add(proj.id);
      plan.projectIds.push(proj.id);
      plan.projectCostUSD += proj.costUSD;
      plan.projectCostSYP += proj.costSYP;
      plan.projectPoliticalCapital += proj.costPoliticalCapital;
    }
  }

  const deminingGov = directives.deminingPriorityId
    ? state.governorates[directives.deminingPriorityId]
    : undefined;
  plan.demining = Boolean(
    deminingGov &&
      deminingGov.mineSaturationPct > 8 &&
      canAffordDirectiveCost(
        state.macro.reservesUSD,
        state.macro.treasurySYP,
        20_000_000,
        8_000_000_000,
        state.macro.parallelRateSYP
      )
  );

  const boostGov = directives.powerBoostGovId
    ? state.governorates[directives.powerBoostGovId]
    : undefined;
  plan.powerBoost = Boolean(
    boostGov &&
      boostGov.dailyBlackoutHours > 2 &&
      canAffordDirectiveCost(
        state.macro.reservesUSD,
        state.macro.treasurySYP,
        10_000_000,
        3_000_000_000,
        state.macro.parallelRateSYP
      )
  );

  return plan;
}

/**
 * Resolves which patronage / brain-gain actions are affordable, so the audit
 * charges exactly the ones the turn will apply (an unaffordable grant used to
 * be charged without ever granting its political capital).
 */
export function resolvePatronageExecution(
  state: GameState,
  directives: TurnDirectives
): PatronageExecution {
  const reserves = state.macro.reservesUSD;
  const treasury = state.macro.treasurySYP;
  const rate = state.macro.parallelRateSYP;
  return {
    populistGrant: Boolean(
      directives.populistGrant &&
        canAffordDirectiveCost(reserves, treasury, 0, POPULIST_GRANT_COST_SYP, rate)
    ),
    charityFund: Boolean(
      directives.charityFundActive &&
        canAffordDirectiveCost(reserves, treasury, 0, CHARITY_FUND_COST_SYP, rate)
    ),
    importSurge: Boolean(directives.importSurge && reserves >= IMPORT_SURGE_COST_USD),
    brainGain: Boolean(
      directives.expatriateBrainGainIncentive &&
        canAffordDirectiveCost(reserves, treasury, 20_000_000, 3_500_000_000, rate)
    ),
  };
}

/**
 * The single auction clamp used by both paths: the state can never sell more
 * hard currency than it holds when the auction is priced.
 */
export function resolveEffectiveAuctionUSD(
  directives: TurnDirectives,
  reservesUSD: number
): number {
  const requested = Math.max(0, directives.dollarAuctionUSD || 0);
  return Math.min(requested, Math.max(0, reservesUSD));
}

/**
 * Executes the Comprehensive Semiannual Revenue & Expenditure Audit
 * implementing the multi-currency macroeconomic engine from Syria Post-War Simulation Design.
 */
export function auditSemiannualBudget(
  state: GameState,
  directives: TurnDirectives,
  plan?: TurnExecutionPlan
): RevenueAudit {
  const { macro, governorates, ministries } = state;

  // What the turn actually executed. The commit passes the plan resolved from
  // the pre-mutation state; the rehearsal preview resolves it from its clone.
  // Defaulting here keeps direct callers (tests, tools) working on an
  // un-mutated state.
  const execution: TurnExecutionPlan = plan ?? {
    oligarch: resolveOligarchExecution(state, directives),
    provincial: resolveProvincialExecution(state, directives),
    patronage: resolvePatronageExecution(state, directives),
  };

  // Compute average ministerial competence
  const ministryList = Object.values(ministries);
  const avgMinistryCompetence =
    ministryList.length > 0
      ? ministryList.reduce((acc, m) => acc + m.competence, 0) / ministryList.length
      : 50;

  // Compute average provincial PRRI
  const govList = Object.values(governorates);
  const avgPRRI =
    govList.length > 0
      ? govList.reduce((acc, g) => acc + g.prri, 0) / govList.length
      : 45;

  // ---------------------------------------------------------
  // 1. DYNAMIC TAX COMPLIANCE RATE FORMULATION
  // Compliance Rate = Base (30%) + (PowerHours/24 * 0.25) + (Competence/100 * 0.25)
  //                   - (Corruption/100 * 0.30) - (PRRI/100 * 0.25)
  // ---------------------------------------------------------
  const baseCompliance = 0.47;
  const powerFactor = (macro.dailyPowerHours / 24) * 0.25;
  const competenceFactor = (avgMinistryCompetence / 100) * 0.25;
  const corruptionDrag = (macro.systemicCorruption / 100) * 0.30;
  const unrestDrag = (avgPRRI / 100) * 0.25;

  const rawCompliance = baseCompliance + powerFactor + competenceFactor - corruptionDrag - unrestDrag + (macro.militiaAbsorptionBonus ?? 0);
  const complianceRate = Math.max(0.12, Math.min(0.88, rawCompliance));
  macro.taxCompliancePct = Math.round(complianceRate * 100);

  // ---------------------------------------------------------
  // 2. HARD CURRENCY INFLOWS (USD)
  // ---------------------------------------------------------
  // Baseline natural resources
  const phosphateUSD = 67_500_000;
  const oilGrossUSD = 140_000_000;
  const tribalShare = oilGrossUSD * 0.30; // 30% tribal share
  const oilCapturedUSD = oilGrossUSD - tribalShare;
  const airspaceUSD = 22_000_000;

  // Nassib border customs with player tariff knob ($200 - $800/truck, baseline $450)
  const truckVolume = 75_000; // Semiannual freight volume
  const nassibFee = directives.nassibTransitFeeUSD || 450;
  // A project executed this turn raises the capture rate in Phase 4 before the
  // committed audit runs, so add its authored boost when it is still in the
  // plan and un-executed on the audited state (i.e. the rehearsal preview).
  const daraaProject = governorates['daraa']?.strategicProject;
  const plannedDaraaCaptureBoost =
    daraaProject &&
    !daraaProject.isExecuted &&
    execution.provincial.projectIds.includes(daraaProject.id)
      ? (daraaProject.revenueCaptureBoost ?? 0)
      : 0;
  const daraaNRC = Math.min(
    1,
    ((governorates['daraa']?.nassibRevenueCapturePct ?? 32) + plannedDaraaCaptureBoost) / 100
  );
  const nassibUSD = Math.round(truckVolume * (nassibFee / 1_000_000) * 1_000_000 * daraaNRC * complianceRate * 0.85);

  // Maritime ports. The revenue a mortgage concession forfeits is booked once,
  // below, as `mortgageDrainUSD` (the authored `turnRevenueLossUSD`, which the
  // emergency panel also shows). Reducing these lines as well charged the same
  // forfeiture twice.
  const portUSD = 24_000_000;

  // Remittance Skimming & Dual Exchange Rate Mechanism
  //
  // Period matters here. The sourced figure is ~$1.0bn per YEAR (World Bank
  // "Personal remittances, received", Syria). A turn is six months, so the
  // per-turn pool is ~$500M. This constant previously held the full $1.0bn and
  // was applied per turn, booking $2bn/yr — double the real flow.
  //
  // The emergency branch below is unaffected: it is an absolute surge in USD,
  // not a percentage of the pool, so it is deliberately not scaled by the pool.
  const totalRemittancesUSD = 500_000_000; // $1.0bn/yr ÷ 2 turns
  const spreadPct = directives.remittanceCaptureSpread ?? 10;
  let remittanceCapturedUSD = 0;
  if (spreadPct <= 15) {
    // Standard safe capture without informal flight ($50M to $75M per turn)
    remittanceCapturedUSD = Math.round(totalRemittancesUSD * (spreadPct / 100));
  } else {
    // Emergency Predatory Haircut (Dire situations):
    // The state aggressively captures hard currency via mandatory bank deductions.
    // Provides immediate liquidity surge (up to $235M at 25%) to avert sovereign bankruptcy
    const emergencySurgeM = 150 + (spreadPct - 15) * 8.5; // 16% -> $158.5M ... 25% -> $235M
    remittanceCapturedUSD = Math.round(emergencySurgeM * 1_000_000);
  }

  // Oligarch Confiscated Wealth Inflows (USD)
  let oligarchCashInflowUSD = 0;
  let oligarchCashInflowSYP = 0;
  let recurringSOEProfitSYP = 31_000_000_000; // Base SOE dividends

  // One-off settlement / fire-sale cash, from what Phase 1 actually executed.
  for (const entry of execution.oligarch) {
    oligarchCashInflowUSD += entry.settlementUSD + entry.liquidationUSD;
    oligarchCashInflowSYP += entry.settlementSYP;
  }

  // Recurring state-enterprise profit. Read from status, not from the directive
  // list: Phase 1 flips the asset to NATIONALIZED before this audit runs on the
  // committed turn, so a PENDING-only test would book the yield on the preview
  // and never on the real turn. Includes this turn's nationalisations (whose
  // status flip also happened before the commit audit).
  const nationalizedNow = new Set(
    execution.oligarch.filter((e) => e.action === 'NATIONALIZE_SOE').map((e) => e.assetId)
  );
  for (const asset of state.confiscatedAssets ?? []) {
    if (asset.status === 'NATIONALIZED' || nationalizedNow.has(asset.id)) {
      recurringSOEProfitSYP += getOligarchTerms(asset).nationalizedSYPPerTurn;
    }
  }

  // Decree 16 Property Restitution vs Monetization. This is the ONLY credit
  // for MONETIZE_AS_STATE_LAND: Phase 1 applies the political cost (trust and
  // PRRI) but no longer touches the treasury, so the policy pays its single
  // explicit per-turn yield here — receipted, and identical in preview/commit.
  if (directives.propertyRestitution === 'MONETIZE_AS_STATE_LAND') {
    oligarchCashInflowUSD += 120_000_000;
    oligarchCashInflowSYP += 8_000_000_000;
  }

  // Foreign Loan Disbursements
  let foreignLoanDisbursementUSD = 0;
  if (directives.signedLoanIds && state.foreignLoans) {
    for (const loan of state.foreignLoans) {
      if (directives.signedLoanIds.includes(loan.id) && !loan.isSigned) {
        foreignLoanDisbursementUSD += loan.disbursementUSD;
      }
    }
  }

  // Emergency Sovereign Mortgage Cash Injections
  let mortgageCashInjectionUSD = 0;
  if (directives.executedMortgageIds && state.sovereignMortgages) {
    for (const mort of state.sovereignMortgages) {
      if (directives.executedMortgageIds.includes(mort.id) && !mort.isMortgaged) {
        mortgageCashInjectionUSD += mort.immediateCashUSD;
      }
    }
  }

  // Tied humanitarian food aid (strictly for grain/flour, non-discretionary)
  const tiedAidUSD = 160_000_000;

  const discretionaryCapturedUSD =
    phosphateUSD +
    oilCapturedUSD +
    airspaceUSD +
    nassibUSD +
    portUSD +
    remittanceCapturedUSD +
    oligarchCashInflowUSD +
    foreignLoanDisbursementUSD +
    mortgageCashInjectionUSD;

  const grossCapturedUSD = discretionaryCapturedUSD + tiedAidUSD;

  // Concessional facilities: general tranches join discretionary USD here
  // (ring-fenced grant money bypasses reserves into the project bucket and
  // is excluded, so the audit never double-counts it).
  const facilityTurn = computeFacilityTurn(state, directives);
  const facilityGeneralUSD = Math.max(0, facilityTurn.inflowUSD - facilityTurn.ringFencedUSD);
  const discretionaryWithFacilitiesUSD = discretionaryCapturedUSD + facilityGeneralUSD;

  // ---------------------------------------------------------
  // 3. HARD CURRENCY EXPENDITURES (USD)
  // ---------------------------------------------------------
  // Wheat Import Bill governed by Wheat Procurement Strategy
  let baseWheatImportUSD = 180_000_000;
  let wheatDomesticProcurementSYP = 0;
  if (directives.wheatProcurement === 'PREMIUM_INCENTIVE') {
    // Attractive domestic price secures harvest; slashes import requirement
    baseWheatImportUSD = 60_000_000;
    wheatDomesticProcurementSYP = 4_500_000_000;
  } else if (directives.wheatProcurement === 'SUBSIDIZED_LOW') {
    // Farmers smuggle harvest across border; import bill explodes
    baseWheatImportUSD = 240_000_000;
  }

  // Executed farmland projects permanently shrink the wheat import bill.
  let projectWheatSavingsUSD = 0;
  for (const gov of Object.values(governorates)) {
    const proj = gov.strategicProject;
    if (proj && proj.isExecuted) {
      projectWheatSavingsUSD += proj.wheatImportSavingsUSD ?? 0;
    }
  }

  const netWheatImportUSD = Math.max(
    15_000_000,
    baseWheatImportUSD - tiedAidUSD - projectWheatSavingsUSD
  );

  // Fuel Import Bill governed by Season and Diesel Smuggling Strategy
  const isWinter = state.season === 'H2_WINTER';
  let fuelImportUSD = isWinter ? 160_000_000 : 110_000_000;
  if (directives.dieselSmuggling === 'PERMISSIVE') {
    // 30% fuel siphoned across border into Lebanon/Jordan
    fuelImportUSD += 35_000_000;
  } else if (directives.dieselSmuggling === 'CRACKDOWN') {
    // Border interdiction saves fuel imports
    fuelImportUSD = Math.max(70_000_000, fuelImportUSD - 25_000_000);
  }

  // Grid CapEx is paid in USD; it is not part of the SYP expenditure base.
  // Coalesced: a malformed draft (missing/NaN gridCapExUSD) previously produced
  // NaN capacity, NaN investment spend and — via the operating/investment split
  // at the end of this function — NaN operating spend. Matches the `?? 0` guard
  // the growth-valve capacity code already used.
  const gridCapExUSD = Number.isFinite(directives.gridCapExUSD) ? directives.gridCapExUSD : 0;

  // NOTE: the audit never touches grid capacity. Phase 4 owns that mutation
  // (MW gain, cap, and the power-hour conversion); adding the audit's own
  // procurement figure here double-counted the same CapEx every turn and could
  // push the grid past its 6000 MW ceiling.

  // Sovereign debt service: flat legacy coupon on the recognized $6.1B stock
  // + semiannual interest on each signed loan at its own rate. Service on a
  // loan starts the turn AFTER signing.
  //
  // The legacy coupon is scaled by the share of the original $6.1B Paris/Russia
  // stock still recognised, so repudiating that debt stops the coupon instead
  // of leaving the state servicing debt it has formally voided. Signed loans
  // raise the stock above $6.1B but must not raise the legacy coupon, hence the
  // cap at 1.
  const LEGACY_DEBT_STOCK_USD = 6_100_000_000;
  const LEGACY_DEBT_COUPON_USD = 45_000_000;
  const recognisedStockUSD = Math.max(0, state.macro.sovereignDebtUSD ?? LEGACY_DEBT_STOCK_USD);
  const legacyStockShare = Math.min(1, recognisedStockUSD / LEGACY_DEBT_STOCK_USD);
  const legacyCouponUSD = Math.round(LEGACY_DEBT_COUPON_USD * legacyStockShare);
  let signedLoanServiceUSD = 0;
  if (state.foreignLoans) {
    for (const loan of state.foreignLoans) {
      if (loan.isSigned && (loan.signedTurn === undefined || loan.signedTurn < state.turnNumber)) {
        const principal = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
        signedLoanServiceUSD += Math.floor(((principal * loan.interestRatePct) / 100 / 2));
      }
    }
  }
  const debtServiceUSD = legacyCouponUSD + signedLoanServiceUSD;

  // Iranian oil-credit coupon: flat $25M/turn while the side ledger carries a
  // balance (voided permanently by formal repudiation, reschedulable once
  // via the Tehran facility to a lower overridden coupon). The directive
  // check keeps the rehearsal preview identical to the committed turn,
  // where applyFacilityTurn persists the same override before this audit.
  // It must also honour the facility's PC gate: a drafted reschedule that
  // Phase 5 will refuse must not discount the coupon here.
  let iranOilCouponUSD =
    (macro.iranOilDebtUSD ?? 0) > 0
      ? (macro.iranCouponOverrideUSD ?? IRAN_OIL_COUPON_USD)
      : 0;
  const rescheduleDef = getFacilityDef('facility_iran_reschedule');
  const rescheduleState = state.facilities?.find((f) => f.id === 'facility_iran_reschedule');
  const rescheduleWillSign =
    rescheduleState?.status === 'ACTIVE' ||
    rescheduleState?.status === 'COMPLETED' ||
    Boolean(
      rescheduleDef &&
        (directives.signedFacilityIds ?? []).includes('facility_iran_reschedule') &&
        (rescheduleState === undefined || rescheduleState.status === 'AVAILABLE') &&
        !facilityBreached(state, directives, 'facility_iran_reschedule') &&
        state.macro.politicalCapital >= rescheduleDef.politicalCapitalCost
    );
  if ((macro.iranOilDebtUSD ?? 0) > 0 && rescheduleDef && rescheduleWillSign) {
    const rescheduleCoupon = rescheduleDef.onSign?.iranCouponUSD;
    if (rescheduleCoupon !== undefined) iranOilCouponUSD = rescheduleCoupon;
  }

  // FX revenue forfeited to active sovereign mortgage concessions. This is the
  // single charge for a mortgaged asset: `turnRevenueLossUSD` is the authored
  // per-turn forfeiture (and the figure the emergency panel advertises). The
  // phosphate/port revenue lines are deliberately NOT reduced as well.
  //
  // A mortgage signed this turn is mortgaged by Phase 2 before the committed
  // audit runs but is still PENDING on the rehearsal clone, so the directive
  // list has to count here too — otherwise the preview omitted the drain while
  // the commit charged it.
  const mortgagesSignedThisTurn = new Set(directives.executedMortgageIds ?? []);
  let mortgageDrainUSD = 0;
  if (state.sovereignMortgages) {
    for (const mort of state.sovereignMortgages) {
      if (mort.isMortgaged || mortgagesSignedThisTurn.has(mort.id)) {
        mortgageDrainUSD += mort.turnRevenueLossUSD;
      }
    }
  }

  // Voluntary early principal repayment (allocated highest-rate-first in the
  // turn manager; recomputed here without mutation so rehearsal previews match).
  // Runs on reserves left over AFTER full loan terminations, and only against
  // loans that survive termination.
  const termination = allocateLoanTermination(state, directives);
  const reservesAfterTermination = Math.max(0, macro.reservesUSD - termination.totalPaidUSD);
  let totalRemainingPrincipalUSD = 0;
  if (state.foreignLoans) {
    for (const loan of state.foreignLoans) {
      if (loan.isSigned && termination.paidByLoan[loan.id] === undefined) {
        totalRemainingPrincipalUSD += loan.remainingPrincipalUSD ?? loan.disbursementUSD;
      }
    }
  }
  const debtRepaymentPaidUSD = Math.max(
    0,
    Math.min(directives.extraDebtRepaymentUSD ?? 0, reservesAfterTermination, totalRemainingPrincipalUSD)
  );

  // Demining priority expenditure: billed only when Phase 4 actually cleared
  // the target. Eligibility is resolved from the pre-Phase-4 state, so a target
  // sitting at 9-16% (reduced below the 8% threshold by the action itself) is
  // still charged instead of becoming free.
  const emergencyDeminingUSD = execution.provincial.demining ? 20_000_000 : 0;
  const deminingSYP = execution.provincial.demining ? 8_000_000_000 : 0;

  // Power supply boost expenditure: same rule, one targeted governorate.
  const powerBoostUSD = execution.provincial.powerBoost ? 10_000_000 : 0;
  const powerBoostSYP = execution.provincial.powerBoost ? 3_000_000_000 : 0;

  // Provincial Strategic Projects: billed from what Phase 4 executed. A project
  // rejected for lack of political capital or funding is neither applied nor
  // charged.
  const provincialProjectsCostUSD = execution.provincial.projectCostUSD;
  const provincialProjectsCostSYP = execution.provincial.projectCostSYP;

  // Emergency food/fuel import surge: populist market-flooding paid in hard currency
  const importSurgeUSD = execution.patronage.importSurge ? IMPORT_SURGE_COST_USD : 0;

  // UNDOF liaison mission (Quneitra dossier): $8M/turn observer presence
  const liaisonMissionUSD = directives.golanBorderStance === 'UN_LIAISON' ? 8_000_000 : 0;

  const expendedUSD =
    netWheatImportUSD +
    fuelImportUSD +
    gridCapExUSD +
    debtServiceUSD +
    iranOilCouponUSD +
    mortgageDrainUSD +
    termination.totalPaidUSD +
    debtRepaymentPaidUSD +
    emergencyDeminingUSD +
    powerBoostUSD +
    importSurgeUSD +
    liaisonMissionUSD +
    directives.dollarAuctionUSD +
    provincialProjectsCostUSD;

  const netUSDDelta = discretionaryWithFacilitiesUSD - expendedUSD;

  // ---------------------------------------------------------
  // 4. DOMESTIC CURRENCY INFLOWS (SYP)
  // ---------------------------------------------------------
  // Corporate Profit Tax (adjusted by player statutory rate slider 15% - 30%, baseline 22%)
  const corpRate = (directives.corporateTaxRate ?? 22) / 22;
  const corporateTaxSYP = Math.round(24_000_000_000 * corpRate * complianceRate);

  // Telecom Airtime Excise (adjusted by player excise slider 10% - 25%, baseline 15%)
  const telecomRate = (directives.telecomExciseRate ?? 15) / 15;
  const telecomExciseSYP = Math.round(16_500_000_000 * telecomRate);

  // Fuel Surcharge
  const fuelSurchargeSYP = 10_500_000_000;

  // Utility Bills
  const utilityBillsSYP = Math.round(11_000_000_000 * (macro.dailyPowerHours / 12) * complianceRate);

  // Central Bank Dollar Auction. The SYP collected at the auction never reaches
  // the treasury — it is withdrawn from the money supply (see
  // computeAuctionAbsorbedSYP). Only the *sterilized* share is a real M2
  // reduction, so that is what this receipt reports; it previously reported the
  // full gross collection, overstating the destruction by 2.5x-3.3x.
  const auctionAbsorbedSYP = computeAuctionAbsorbedSYP(
    directives.dollarAuctionUSD ?? 0,
    macro.parallelRateSYP
  );

  // Growth valve: productive capacity scales the domestic revenue base.
  // Multiplier is zero at the starting baseline (20) by tuning design.
  const capacityPct = macro.productiveCapacityPct ?? GROWTH_TUNING.capacityBaseline;
  const capacityMult =
    1 + Math.max(0, capacityPct - GROWTH_TUNING.capacityBaseline) * GROWTH_TUNING.capacityRate;
  const capacityRevenueBonusSYP = Math.round(
    (corporateTaxSYP + telecomExciseSYP + fuelSurchargeSYP + utilityBillsSYP + recurringSOEProfitSYP) *
      (capacityMult - 1)
  );

  // Executed strategic projects pay recurring SYP revenue from this turn on.
  // A project in the execution plan counts too: the committed audit runs after
  // Phase 4 flips `isExecuted`, while the preview audits it un-mutated. Without
  // this the preview charged the project cost but omitted its first yield.
  const projectsExecutingThisTurn = new Set(execution.provincial.projectIds);
  let projectRevenueSYP = 0;
  for (const gov of Object.values(governorates)) {
    const proj = gov.strategicProject;
    if (proj && (proj.isExecuted || projectsExecutingThisTurn.has(proj.id))) {
      projectRevenueSYP += proj.recurringRevenueSYPPerTurn ?? 0;
    }
  }
  const grossCapturedSYP =
    corporateTaxSYP +
    telecomExciseSYP +
    fuelSurchargeSYP +
    utilityBillsSYP +
    recurringSOEProfitSYP +
    capacityRevenueBonusSYP +
    projectRevenueSYP +
    oligarchCashInflowSYP;

  // ---------------------------------------------------------
  // 5. DOMESTIC CURRENCY EXPENDITURES (SYP)
  // ---------------------------------------------------------
  // Public Workforce Headcount & Payroll Strategy.
  // The multiplier applies to the CURRENT headcount, not to a hard-coded 1.4M
  // baseline: nationalisation bonuses (+8 000) and previous ABSORB/PRUNE turns
  // used to be wiped the moment either strategy was re-selected, making PRUNE
  // non-cumulative (always 1.05M).
  let activeHeadcount = macro.civilServiceHeadcount ?? BASELINE_CIVIL_SERVICE_HEADCOUNT;
  if (directives.workforceStrategy === 'ABSORB_MILITIAS') {
    activeHeadcount = Math.round(activeHeadcount * 1.20); // Absorbed into state payroll
  } else if (directives.workforceStrategy === 'PRUNE_CIVIL_SERVICE') {
    activeHeadcount = Math.round(activeHeadcount * 0.75); // 25% ghost workers pruned
  }
  macro.civilServiceHeadcount = activeHeadcount;

  const baseWage = macro.civilServiceWageSYP * (1 + directives.wageBumpPercent / 100);
  const civilPayrollSYP = Math.round(activeHeadcount * baseWage * 6); // 6-month cycle

  const militaryPayrollSYP = 28_000_000_000;

  // Food Subsidies
  let subsidyCostSYP = 18_000_000_000;
  if (directives.foodSubsidyLevel === 'GENEROUS') subsidyCostSYP = 26_000_000_000;
  if (directives.foodSubsidyLevel === 'AUSTERE') subsidyCostSYP = 9_000_000_000;

  // Ministry operational budgets
  let totalMinistryOpExSYP = 0;
  for (const m of Object.values(ministries)) {
    const multiplier = m.isOpposition ? 1.15 : 1.0;
    totalMinistryOpExSYP += m.allocatedBudgetSYP * multiplier;
  }

  // Expatriate Brain Gain Contracts
  const brainGainCostSYP = execution.patronage.brainGain ? 3_500_000_000 : 0;

  // Populist patronage: one-shot grant + recurring charity fund, both SYP-funded
  const populistGrantSYP = execution.patronage.populistGrant ? POPULIST_GRANT_COST_SYP : 0;
  const charityFundSYP = execution.patronage.charityFund ? CHARITY_FUND_COST_SYP : 0;

  const golanDrainSYP = directives.golanBorderStance === 'DEPLOY_ARMOR' ? 9_000_000_000 : 0;

  // Overdraft interest: an overdrawn opening treasury pays 5%/turn on the
  // negative balance. The overdraft stays legal (no forced printing), but the
  // hole now digs itself deeper instead of sitting free.
  const overdraftInterestSYP = Math.round(Math.max(0, -macro.treasurySYP) * 0.05);

  const expendedSYP =
    civilPayrollSYP +
    militaryPayrollSYP +
    subsidyCostSYP +
    totalMinistryOpExSYP +
    deminingSYP +
    powerBoostSYP +
    golanDrainSYP +
    overdraftInterestSYP +
    wheatDomesticProcurementSYP +
    brainGainCostSYP +
    populistGrantSYP +
    charityFundSYP +
    provincialProjectsCostSYP;

  // Honest-deficit split: investment builds future revenue (projects, demining,
  // power, domestic wheat procurement); everything else is consumed this turn.
  // Both sides stay in SYP — Grid CapEx is paid in USD and is not part of
  // `expendedSYP`, so converting it to SYP and subtracting it here understated
  // operating spend by the CapEx equivalent. The two sum to `expendedSYP` exactly.
  const investmentExpendedSYP =
    deminingSYP +
    powerBoostSYP +
    wheatDomesticProcurementSYP +
    provincialProjectsCostSYP;
  const operatingExpendedSYP = expendedSYP - investmentExpendedSYP;

  // Seigniorage & Domestic Fiscal Balance (SYP)
  // Unfunded domestic spending draws down the public treasury directly into an overdraft / deficit.
  const rawSYPDeficit = expendedSYP - grossCapturedSYP;
  const seignioragePrintedSYP = directives.moneyPrintingSYP ?? 0;

  const netSYPDelta = grossCapturedSYP + seignioragePrintedSYP - expendedSYP;

  // Runway in turns (sibling of the month-based runway below, for the treasury card).
  // Both runway metrics measure the balance the state will actually hold AFTER
  // this turn's netUSDDelta is applied (turn-manager applies the delta once the
  // audit returns), so they must read reserves + netUSDDelta, not the opening
  // balance — otherwise the tier is derived from a figure the player never sees
  // and a near-insolvent turn reports STABLE.
  const reservesAfterTurnUSD = Math.max(0, macro.reservesUSD + netUSDDelta);

  let runwayTurnsEstimate = 99;
  if (netUSDDelta < 0) {
    const drainPerTurn = Math.abs(netUSDDelta);
    if (drainPerTurn > 0) {
      runwayTurnsEstimate = Math.max(0, Math.min(99, Math.floor(reservesAfterTurnUSD / drainPerTurn)));
    } else {
      runwayTurnsEstimate = 0;
    }
  }

  const interestBurdenPct =
    grossCapturedSYP > 0 ? Number(((overdraftInterestSYP / grossCapturedSYP) * 100).toFixed(1)) : 0;

  // ---------------------------------------------------------
  // 6. FISCAL RUNWAY CALCULATION (in months)
  // ---------------------------------------------------------
  let runwayMonths = 99;
  if (netUSDDelta < 0) {
    const drainPerTurn = Math.abs(netUSDDelta);
    const turnsRemaining = reservesAfterTurnUSD / drainPerTurn;
    // Capped at 99 like its siblings; without the cap a shallow drain rendered
    // an absurd month count straight into the projected-turn summary.
    runwayMonths = Math.max(0.1, Math.min(99, Number((turnsRemaining * 6).toFixed(1))));
  }

  let runwayAlertTier: 'STABLE' | 'WARNING' | 'CRITICAL' = 'STABLE';
  if (runwayMonths <= 3.0) {
    runwayAlertTier = 'CRITICAL';
  } else if (runwayMonths <= 6.0) {
    runwayAlertTier = 'WARNING';
  }

  return {
    grossCapturedUSD,
    discretionaryCapturedUSD,
    expendedUSD,
    netUSDDelta,
    runwayMonths,
    runwayAlertTier,
    grossCapturedSYP,
    expendedSYP,
    netSYPDelta,
    seignioragePrintedSYP,
    debtServiceUSD,
    iranOilCouponUSD,
    mortgageDrainUSD,
    debtRepaymentPaidUSD,
    auctionAbsorbedSYP,
    overdraftInterestSYP,
    operatingExpendedSYP,
    investmentExpendedSYP,
    runwayTurnsEstimate,
    capacityRevenueBonusSYP,
    projectRevenueSYP,
    facilityInflowUSD: facilityTurn.inflowUSD,
    facilityLinesAr: facilityTurn.linesAr,
    interestBurdenPct,
  };
}

/**
 * Restates a COMMITTED receipt so `netUSDDelta` is the real change in reserves
 * for the turn (closing − opening), and recomputes the runways from it.
 *
 * The audit only ever sees the flows it books itself, so cash credited before it
 * runs — loan disbursements, mortgage injections, oligarch settlements — was
 * missing from the receipt while it was present in the balance. The rehearsal
 * preview audits an un-mutated clone where those flows ARE booked, so restating
 * the committed receipt also brings the two paths into agreement.
 *
 * Called after every reserve mutation of the turn has landed; it only reports.
 */
export function restateAuditReservesDelta(
  audit: RevenueAudit,
  openingReservesUSD: number,
  closingReservesUSD: number
): void {
  const delta = closingReservesUSD - openingReservesUSD;
  audit.netUSDDelta = delta;

  const reservesAfterTurnUSD = Math.max(0, closingReservesUSD);
  let runwayTurnsEstimate = 99;
  let runwayMonths = 99;
  if (delta < 0) {
    const drainPerTurn = Math.abs(delta);
    if (drainPerTurn > 0) {
      runwayTurnsEstimate = Math.max(
        0,
        Math.min(99, Math.floor(reservesAfterTurnUSD / drainPerTurn))
      );
      runwayMonths = Math.max(
        0.1,
        Math.min(99, Number(((reservesAfterTurnUSD / drainPerTurn) * 6).toFixed(1)))
      );
    } else {
      runwayTurnsEstimate = 0;
      runwayMonths = 0.1;
    }
  }

  audit.runwayTurnsEstimate = runwayTurnsEstimate;
  audit.runwayMonths = runwayMonths;
  audit.runwayAlertTier = runwayMonths <= 3.0 ? 'CRITICAL' : runwayMonths <= 6.0 ? 'WARNING' : 'STABLE';
}

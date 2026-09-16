import type { GameState, TurnDirectives, RevenueAudit } from './types';
import { IRAN_OIL_COUPON_USD, GROWTH_TUNING } from './constants';
import { computeFacilityTurn, getFacilityDef } from './facilities';

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
 * Executes the Comprehensive Semiannual Revenue & Expenditure Audit
 * implementing the multi-currency macroeconomic engine from Syria Post-War Simulation Design.
 */
export function auditSemiannualBudget(
  state: GameState,
  directives: TurnDirectives
): RevenueAudit {
  const { macro, governorates, ministries } = state;

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
  let phosphateUSD = 67_500_000;
  const oilGrossUSD = 140_000_000;
  const tribalShare = oilGrossUSD * 0.30; // 30% tribal share
  const oilCapturedUSD = oilGrossUSD - tribalShare;
  const airspaceUSD = 22_000_000;

  // Check if Khneifis phosphate was mortgaged
  const hasMortgagedPhosphate =
    directives.executedMortgageIds?.includes('mortgage_khneifis_phosphate') ||
    state.sovereignMortgages?.some(m => m.id === 'mortgage_khneifis_phosphate' && m.isMortgaged);
  if (hasMortgagedPhosphate) {
    phosphateUSD = 15_000_000; // Concession holder claims bulk of export revenue
  }

  // Nassib border customs with player tariff knob ($200 - $800/truck, baseline $450)
  const truckVolume = 75_000; // Semiannual freight volume
  const nassibFee = directives.nassibTransitFeeUSD || 450;
  const daraaNRC = (governorates['daraa']?.nassibRevenueCapturePct ?? 32) / 100;
  const nassibUSD = Math.round(truckVolume * (nassibFee / 1_000_000) * 1_000_000 * daraaNRC * complianceRate * 0.85);

  // Maritime ports with Tartus mortgage check
  let portUSD = 24_000_000;
  const hasMortgagedTartus =
    directives.executedMortgageIds?.includes('mortgage_tartus_port') ||
    state.sovereignMortgages?.some(m => m.id === 'mortgage_tartus_port' && m.isMortgaged);
  if (hasMortgagedTartus) {
    portUSD = 6_000_000; // Private consortium retains terminal revenues
  }

  // Remittance Skimming & Dual Exchange Rate Mechanism
  // Expatriates remit ~$1.0B USD per 6-month turn
  const totalRemittancesUSD = 1_000_000_000;
  const spreadPct = directives.remittanceCaptureSpread ?? 10;
  let remittanceCapturedUSD = 0;
  if (spreadPct <= 15) {
    // Standard safe capture without informal flight ($50M to $150M)
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

  if (directives.oligarchDecisions && state.confiscatedAssets) {
    for (const asset of state.confiscatedAssets) {
      const decision = directives.oligarchDecisions[asset.id];
      if (decision && asset.status === 'PENDING') {
        if (decision === 'SETTLEMENT_80_20') {
          oligarchCashInflowUSD += asset.settlementYieldUSD;
          oligarchCashInflowSYP += asset.settlementYieldSYP;
        } else if (decision === 'FOREIGN_LIQUIDATION') {
          oligarchCashInflowUSD += asset.liquidationYieldUSD;
        } else if (decision === 'NATIONALIZE_SOE') {
          recurringSOEProfitSYP += asset.soeVenueSYPPerTurn;
        }
      }
    }
  }

  // Decree 16 Property Restitution vs Monetization
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

  // Grid CapEx adjusted for ministry procurement competence
  const competenceWaste = avgMinistryCompetence < 40 ? 0.25 : 0.05;
  const gridCapExUSD = directives.gridCapExUSD;
  const effectiveGridCapExUSD = gridCapExUSD * (1 - competenceWaste);
  macro.gridCapacityMW += Math.round((effectiveGridCapExUSD / 1_000_000) * 12);

  // Sovereign debt service: flat legacy coupon on the recognized $6.1B stock
  // (kept flat to preserve turn-1 balance) + semiannual interest on each signed
  // loan at its own rate. Service on a loan starts the turn AFTER signing.
  const LEGACY_DEBT_COUPON_USD = 45_000_000;
  let signedLoanServiceUSD = 0;
  if (state.foreignLoans) {
    for (const loan of state.foreignLoans) {
      if (loan.isSigned && (loan.signedTurn === undefined || loan.signedTurn < state.turnNumber)) {
        const principal = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
        signedLoanServiceUSD += Math.floor(((principal * loan.interestRatePct) / 100 / 2));
      }
    }
  }
  const debtServiceUSD = LEGACY_DEBT_COUPON_USD + signedLoanServiceUSD;

  // Iranian oil-credit coupon: flat $25M/turn while the side ledger carries a
  // balance (voided permanently by formal repudiation, reschedulable once
  // via the Tehran facility to a lower overridden coupon). The directive
  // check keeps the rehearsal preview identical to the committed turn,
  // where applyFacilityTurn persists the same override before this audit.
  let iranOilCouponUSD =
    (macro.iranOilDebtUSD ?? 0) > 0
      ? (macro.iranCouponOverrideUSD ?? IRAN_OIL_COUPON_USD)
      : 0;
  if (
    (macro.iranOilDebtUSD ?? 0) > 0 &&
    (directives.signedFacilityIds ?? []).includes('facility_iran_reschedule')
  ) {
    const rescheduleCoupon = getFacilityDef('facility_iran_reschedule')?.onSign?.iranCouponUSD;
    if (rescheduleCoupon !== undefined) iranOilCouponUSD = rescheduleCoupon;
  }

  // FX revenue forfeited to active sovereign mortgage concessions.
  let mortgageDrainUSD = 0;
  if (state.sovereignMortgages) {
    for (const mort of state.sovereignMortgages) {
      if (mort.isMortgaged) mortgageDrainUSD += mort.turnRevenueLossUSD;
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

  // Demining priority expenditure (strictly when target governorate mine saturation > 8%)
  const isDeminingActive = Boolean(
    directives.deminingPriorityId &&
    governorates[directives.deminingPriorityId] &&
    governorates[directives.deminingPriorityId].mineSaturationPct > 8
  );
  const emergencyDeminingUSD = isDeminingActive ? 20_000_000 : 0;
  const deminingSYP = isDeminingActive ? 8_000_000_000 : 0;

  // Power supply boost expenditure for a single targeted governorate
  const isPowerBoostActive = Boolean(
    directives.powerBoostGovId &&
    governorates[directives.powerBoostGovId] &&
    governorates[directives.powerBoostGovId].dailyBlackoutHours > 2
  );
  const powerBoostUSD = isPowerBoostActive ? 10_000_000 : 0;
  const powerBoostSYP = isPowerBoostActive ? 3_000_000_000 : 0;

  // Provincial Strategic Projects. Charges EVERY directive-listed project:
  // execution runs before this audit and flips isExecuted, so filtering on
  // !isExecuted would make executed projects free and bill only blocked ones.
  // (The UI never lets an executed project be re-listed, so no double-billing.)
  let provincialProjectsCostUSD = 0;
  let provincialProjectsCostSYP = 0;
  if (directives.provincialProjects && directives.provincialProjects.length > 0) {
    for (const projId of directives.provincialProjects) {
      for (const gov of Object.values(governorates)) {
        if (gov.strategicProject && gov.strategicProject.id === projId) {
          provincialProjectsCostUSD += gov.strategicProject.costUSD;
          provincialProjectsCostSYP += gov.strategicProject.costSYP;
        }
      }
    }
  }

  // Emergency food/fuel import surge: populist market-flooding paid in hard currency
  const importSurgeUSD = directives.importSurge ? IMPORT_SURGE_COST_USD : 0;

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

  // Central Bank Dollar Auction: TRUE ABSORPTION. The SYP collected from the
  // street is destroyed (M2 falls in the turn manager), never credited to the
  // treasury — killing the old double-benefit where it funded spending too.
  const auctionAbsorbedSYP = Math.round(
    (directives.dollarAuctionUSD ?? 0) * (macro.parallelRateSYP * 0.95)
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
  let projectRevenueSYP = 0;
  for (const gov of Object.values(governorates)) {
    const proj = gov.strategicProject;
    if (proj && proj.isExecuted) {
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
  // Public Workforce Headcount & Payroll Strategy
  let activeHeadcount = macro.civilServiceHeadcount ?? 1_400_000;
  if (directives.workforceStrategy === 'ABSORB_MILITIAS') {
    activeHeadcount = Math.round(1_400_000 * 1.20); // Absorbed into state payroll
  } else if (directives.workforceStrategy === 'PRUNE_CIVIL_SERVICE') {
    activeHeadcount = Math.round(1_400_000 * 0.75); // 25% ghost workers pruned
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
  const brainGainCostSYP = directives.expatriateBrainGainIncentive ? 3_500_000_000 : 0;

  // Populist patronage: one-shot grant + recurring charity fund, both SYP-funded
  const populistGrantSYP = directives.populistGrant ? POPULIST_GRANT_COST_SYP : 0;
  const charityFundSYP = directives.charityFundActive ? CHARITY_FUND_COST_SYP : 0;

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

  // Honest-deficit split: investment builds future revenue (projects,
  // demining, power, CapEx at SYP-equivalent, domestic wheat procurement);
  // everything else is consumed this turn. The two sum to expendedSYP exactly.
  const gridCapExSYPEquiv = Math.round(gridCapExUSD * Math.max(1, macro.parallelRateSYP));
  const investmentExpendedSYP =
    deminingSYP +
    powerBoostSYP +
    wheatDomesticProcurementSYP +
    provincialProjectsCostSYP +
    gridCapExSYPEquiv;
  const operatingExpendedSYP = expendedSYP - investmentExpendedSYP;

  // Seigniorage & Domestic Fiscal Balance (SYP)
  // Unfunded domestic spending draws down the public treasury directly into an overdraft / deficit.
  const rawSYPDeficit = expendedSYP - grossCapturedSYP;
  const seignioragePrintedSYP = directives.moneyPrintingSYP ?? 0;

  const netSYPDelta = grossCapturedSYP + seignioragePrintedSYP - expendedSYP;

  // Runway in turns (sibling of the month-based runway above, for the treasury card).
  let runwayTurnsEstimate = 99;
  if (netUSDDelta < 0) {
    const drainPerTurn = Math.abs(netUSDDelta);
    if (drainPerTurn > 0 && macro.reservesUSD > 0) {
      runwayTurnsEstimate = Math.max(0, Math.min(99, Math.floor(macro.reservesUSD / drainPerTurn)));
    } else if (macro.reservesUSD <= 0) {
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
    const turnsRemaining = macro.reservesUSD / drainPerTurn;
    runwayMonths = Math.max(0.1, Number((turnsRemaining * 6).toFixed(1)));
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

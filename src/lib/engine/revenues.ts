import type { GameState, TurnDirectives, RevenueAudit } from './types';

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

  const rawCompliance = baseCompliance + powerFactor + competenceFactor - corruptionDrag - unrestDrag;
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
  let recurringSOEProfitSYP = 3_100_000_000_000; // Base SOE dividends

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
    oligarchCashInflowSYP += 800_000_000_000;
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

  // ---------------------------------------------------------
  // 3. HARD CURRENCY EXPENDITURES (USD)
  // ---------------------------------------------------------
  // Wheat Import Bill governed by Wheat Procurement Strategy
  let baseWheatImportUSD = 180_000_000;
  let wheatDomesticProcurementSYP = 0;
  if (directives.wheatProcurement === 'PREMIUM_INCENTIVE') {
    // Attractive domestic price secures harvest; slashes import requirement
    baseWheatImportUSD = 60_000_000;
    wheatDomesticProcurementSYP = 450_000_000_000;
  } else if (directives.wheatProcurement === 'SUBSIDIZED_LOW') {
    // Farmers smuggle harvest across border; import bill explodes
    baseWheatImportUSD = 240_000_000;
  }

  const netWheatImportUSD = Math.max(15_000_000, baseWheatImportUSD - tiedAidUSD);

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

  // Sovereign debt service: flat legacy coupon on the pre-existing $6.8B stock
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

  // FX revenue forfeited to active sovereign mortgage concessions.
  let mortgageDrainUSD = 0;
  if (state.sovereignMortgages) {
    for (const mort of state.sovereignMortgages) {
      if (mort.isMortgaged) mortgageDrainUSD += mort.turnRevenueLossUSD;
    }
  }

  // Voluntary early principal repayment (allocated highest-rate-first in the
  // turn manager; recomputed here without mutation so rehearsal previews match).
  let totalRemainingPrincipalUSD = 0;
  if (state.foreignLoans) {
    for (const loan of state.foreignLoans) {
      if (loan.isSigned) {
        totalRemainingPrincipalUSD += loan.remainingPrincipalUSD ?? loan.disbursementUSD;
      }
    }
  }
  const debtRepaymentPaidUSD = Math.max(
    0,
    Math.min(directives.extraDebtRepaymentUSD ?? 0, macro.reservesUSD, totalRemainingPrincipalUSD)
  );

  // Demining priority expenditure (strictly when target governorate mine saturation > 8%)
  const isDeminingActive = Boolean(
    directives.deminingPriorityId &&
    governorates[directives.deminingPriorityId] &&
    governorates[directives.deminingPriorityId].mineSaturationPct > 8
  );
  const emergencyDeminingUSD = isDeminingActive ? 20_000_000 : 0;
  const deminingSYP = isDeminingActive ? 800_000_000_000 : 0;

  // Power supply boost expenditure for a single targeted governorate
  const isPowerBoostActive = Boolean(
    directives.powerBoostGovId &&
    governorates[directives.powerBoostGovId] &&
    governorates[directives.powerBoostGovId].dailyBlackoutHours > 2
  );
  const powerBoostUSD = isPowerBoostActive ? 10_000_000 : 0;
  const powerBoostSYP = isPowerBoostActive ? 300_000_000_000 : 0;

  // Provincial Strategic Projects
  let provincialProjectsCostUSD = 0;
  let provincialProjectsCostSYP = 0;
  if (directives.provincialProjects && directives.provincialProjects.length > 0) {
    for (const projId of directives.provincialProjects) {
      for (const gov of Object.values(governorates)) {
        if (gov.strategicProject && gov.strategicProject.id === projId && !gov.strategicProject.isExecuted) {
          provincialProjectsCostUSD += gov.strategicProject.costUSD;
          provincialProjectsCostSYP += gov.strategicProject.costSYP;
        }
      }
    }
  }

  const expendedUSD =
    netWheatImportUSD +
    fuelImportUSD +
    gridCapExUSD +
    debtServiceUSD +
    mortgageDrainUSD +
    debtRepaymentPaidUSD +
    emergencyDeminingUSD +
    powerBoostUSD +
    directives.dollarAuctionUSD +
    provincialProjectsCostUSD;

  const netUSDDelta = discretionaryCapturedUSD - expendedUSD;

  // ---------------------------------------------------------
  // 4. DOMESTIC CURRENCY INFLOWS (SYP)
  // ---------------------------------------------------------
  // Corporate Profit Tax (adjusted by player statutory rate slider 15% - 30%, baseline 22%)
  const corpRate = (directives.corporateTaxRate ?? 22) / 22;
  const corporateTaxSYP = Math.round(2_400_000_000_000 * corpRate * complianceRate);

  // Telecom Airtime Excise (adjusted by player excise slider 10% - 25%, baseline 15%)
  const telecomRate = (directives.telecomExciseRate ?? 15) / 15;
  const telecomExciseSYP = Math.round(1_650_000_000_000 * telecomRate);

  // Fuel Surcharge
  const fuelSurchargeSYP = 1_050_000_000_000;

  // Utility Bills
  const utilityBillsSYP = Math.round(1_100_000_000_000 * (macro.dailyPowerHours / 12) * complianceRate);

  // Central Bank Dollar Auction SYP proceeds (absorbing domestic currency from street)
  const dollarAuctionProceedsSYP = Math.round(
    (directives.dollarAuctionUSD ?? 0) * (macro.parallelRateSYP * 0.95)
  );

  const grossCapturedSYP =
    corporateTaxSYP +
    telecomExciseSYP +
    fuelSurchargeSYP +
    utilityBillsSYP +
    recurringSOEProfitSYP +
    dollarAuctionProceedsSYP +
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

  const militaryPayrollSYP = 2_800_000_000_000;

  // Food Subsidies
  let subsidyCostSYP = 1_800_000_000_000;
  if (directives.foodSubsidyLevel === 'GENEROUS') subsidyCostSYP = 2_600_000_000_000;
  if (directives.foodSubsidyLevel === 'AUSTERE') subsidyCostSYP = 900_000_000_000;

  // Ministry operational budgets
  let totalMinistryOpExSYP = 0;
  for (const m of Object.values(ministries)) {
    const multiplier = m.isOpposition ? 1.15 : 1.0;
    totalMinistryOpExSYP += m.allocatedBudgetSYP * multiplier;
  }

  // Expatriate Brain Gain Contracts
  const brainGainCostSYP = directives.expatriateBrainGainIncentive ? 350_000_000_000 : 0;

  const golanDrainSYP = directives.golanBorderStance === 'DEPLOY_ARMOR' ? 900_000_000_000 : 0;

  const expendedSYP =
    civilPayrollSYP +
    militaryPayrollSYP +
    subsidyCostSYP +
    totalMinistryOpExSYP +
    deminingSYP +
    powerBoostSYP +
    golanDrainSYP +
    wheatDomesticProcurementSYP +
    brainGainCostSYP +
    provincialProjectsCostSYP;

  // Seigniorage & Domestic Fiscal Balance (SYP)
  // Unfunded domestic spending draws down the public treasury directly into an overdraft / deficit.
  const rawSYPDeficit = expendedSYP - grossCapturedSYP;
  const seignioragePrintedSYP = directives.moneyPrintingSYP ?? 0;

  const netSYPDelta = grossCapturedSYP + seignioragePrintedSYP - expendedSYP;

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
    mortgageDrainUSD,
    debtRepaymentPaidUSD,
  };
}

import type {
  GameState,
  TurnDirectives,
  PredictivePreviewRanges,
} from './types';
import { auditSemiannualBudget } from './revenues';
import { calculateParallelRate, calculateRealWageUSD } from './currency';
import { drawEventsForTurn } from './events';
import { checkFailStates } from './fail-states';
import { projectCenturyOutcome } from './century-engine';
import { PRNG } from './prng';

export function getDefaultTurnDirectives(): TurnDirectives {
  return {
    wageBumpPercent: 0,
    foodSubsidyLevel: 'STANDARD',
    officialRateAdjustment: 0,
    dollarAuctionUSD: 0,
    antiSpeculationRaids: false,
    moneyPrintingSYP: 0,
    deminingPriorityId: null,
    powerBoostGovId: null,
    gridCapExUSD: 35_000_000,
    southernPolicy: 'LOCAL_VOUCHERS',
    golanBorderStance: 'RESTRAINT',
    activePoliticalActions: [],
    provincialProjects: [],
    workforceStrategy: 'MAINTAIN',
    wheatProcurement: 'MARKET_PARITY',
    dieselSmuggling: 'STANDARD',
    remittanceCaptureSpread: 10,
    corporateTaxRate: 22,
    telecomExciseRate: 15,
    nassibTransitFeeUSD: 450,
    oligarchDecisions: {},
    propertyRestitution: 'RESTITUTE_TO_REFUGEES',
    signedLoanIds: [],
    executedMortgageIds: [],
    expatriateBrainGainIncentive: false,
  };
}

export function evaluateRehearsalDirectives(
  state: GameState,
  directives: TurnDirectives
): PredictivePreviewRanges {
  const audit = auditSemiannualBudget(state, directives);

  const deficitSYP = Math.max(0, audit.expendedSYP - audit.grossCapturedSYP);
  const seigniorageNeeded = Math.max(0, deficitSYP - state.macro.treasurySYP);
  const netUSDDelta = audit.netUSDDelta;
  const fxDrainUSD = Math.max(0, -netUSDDelta);

  const estParallelRate = calculateParallelRate(
    state.macro.parallelRateSYP,
    state.macro.m2MoneySupplySYP,
    seigniorageNeeded,
    fxDrainUSD,
    Math.max(0, state.macro.reservesUSD + netUSDDelta)
  );

  const fxRateMin = Math.round(estParallelRate * 0.96);
  const fxRateMax = Math.round(estParallelRate * 1.04);

  const projectedCivilWageSYP =
    state.macro.civilServiceWageSYP * (1 + directives.wageBumpPercent / 100);
  const realWageMin = Math.round(
    calculateRealWageUSD(projectedCivilWageSYP, fxRateMax)
  );
  const realWageMax = Math.round(
    calculateRealWageUSD(projectedCivilWageSYP, fxRateMin)
  );

  // Accurate Fiscal Runway:
  // When netUSDDelta >= 0, foreign reserves are not running out (reserves are growing or stable) -> 99 months
  // When netUSDDelta < 0, drain per turn depletes estReserves -> (estReserves / drainPerTurn) * 6 months
  let runwayMonthsEstimated = 99;
  if (netUSDDelta < 0) {
    const drainPerTurn = Math.abs(netUSDDelta);
    const estReserves = Math.max(0, state.macro.reservesUSD + netUSDDelta);
    if (drainPerTurn > 0) {
      const turnsRemaining = estReserves / drainPerTurn;
      runwayMonthsEstimated = Math.max(0.1, Math.min(99, Number((turnsRemaining * 6).toFixed(1))));
    }
  }

  return {
    deficitSYP,
    runwayMonthsEstimated,
    fxRateMin,
    fxRateMax,
    realWageMin,
    realWageMax,
    rriChangeMin: -5,
    rriChangeMax: +8,
    requiresPrintingSYP: seigniorageNeeded,
  };
}

export function executeTurnLifecycle(
  currentState: GameState,
  directives: TurnDirectives
): GameState {
  const next: GameState = JSON.parse(JSON.stringify(currentState));

  // =========================================================================
  // PHASE 0: SPECIAL DECREES & POLITICAL ACTIONS
  // =========================================================================
  for (const actId of directives.activePoliticalActions || []) {
    if (actId === 'ANTI_CORRUPTION_COMMISSION') {
      if (next.macro.politicalCapital >= 15) {
        next.macro.systemicCorruption = Math.max(0, next.macro.systemicCorruption - 8);
        next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 15);
        next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 5);
      }
    } else if (actId === 'PROPERTY_RESTITUTION_PORTAL') {
      if (next.macro.politicalCapital >= 10) {
        next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 10);
        next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 4);
        if (next.governorates['homs']) next.governorates['homs'].prri = Math.max(0, next.governorates['homs'].prri - 8);
        if (next.governorates['rif_dimashq']) next.governorates['rif_dimashq'].prri = Math.max(0, next.governorates['rif_dimashq'].prri - 6);
      }
    } else if (actId === 'SMUGGLING_BORDER_SWEEP') {
      if (next.macro.politicalCapital >= 12) {
        next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 12);
        next.macro.systemicCorruption = Math.max(0, next.macro.systemicCorruption - 4);
        next.macro.reservesUSD += 15_000_000;
      }
    } else if (actId === 'TRIBAL_CUSTOMS_COUNCIL') {
      if (next.macro.politicalCapital >= 8) {
        next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 8);
        if (next.governorates['deir_ez_zor']) {
          next.governorates['deir_ez_zor'].tribalRageIndex = Math.max(0, (next.governorates['deir_ez_zor'].tribalRageIndex || 50) - 25);
          next.governorates['deir_ez_zor'].prri = Math.max(0, next.governorates['deir_ez_zor'].prri - 10);
        }
      }
    } else if (actId === 'CABINET_HEARING') {
      next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 8);
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 3);
      Object.values(next.ministries).forEach((m) => {
        m.competence = Math.min(100, m.competence + 2);
      });
    } else if (actId === 'UNITY_SPEECH') {
      next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 4);
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 2);
      next.macro.nationalRRI = Math.max(0, next.macro.nationalRRI - 3);
    } else if (actId === 'OPPOSITION_SEATS') {
      next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 18);
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 4);
      const minKeys = Object.keys(next.ministries);
      if (minKeys.length > 0) {
        next.ministries[minKeys[0]].isOpposition = true;
      }
    } else if (actId === 'MARTIAL_LAW') {
      next.macro.nationalRRI = Math.max(0, next.macro.nationalRRI - 15);
      next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 12);
      Object.values(next.governorates).forEach((g) => {
        g.prri = Math.max(0, g.prri - 12);
      });
    }
  }

  // =========================================================================
  // PHASE 1: OLIGARCH ASSET DECISIONS & PROPERTY RESTITUTION
  // =========================================================================
  if (directives.oligarchDecisions) {
    for (const [assetId, action] of Object.entries(directives.oligarchDecisions)) {
      const asset = next.confiscatedAssets.find((a) => a.id === assetId);
      if (asset && asset.status === 'PENDING') {
        if (action === 'SETTLEMENT_80_20') {
          if (next.macro.politicalCapital >= 8) {
            asset.status = 'SETTLED';
            const cashUSD = asset.valuationUSD * 0.8;
            next.macro.reservesUSD += cashUSD;
            next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 8);
            next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 2);
          }
        } else if (action === 'NATIONALIZE_SOE') {
          asset.status = 'NATIONALIZED';
          next.macro.civilServiceHeadcount = (next.macro.civilServiceHeadcount ?? 850_000) + 8000;
          next.macro.systemicCorruption = Math.min(100, next.macro.systemicCorruption + 5);
          next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 5);
        } else if (action === 'FOREIGN_LIQUIDATION') {
          if (next.macro.politicalCapital >= 10) {
            asset.status = 'LIQUIDATED';
            const cashUSD = asset.valuationUSD * 0.6;
            next.macro.reservesUSD += cashUSD;
            next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 4);
            next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 10);
          }
        }
      }
    }
  }

  if (directives.propertyRestitution === 'RESTITUTE_TO_REFUGEES') {
    next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 5);
    next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 5);
  } else if (directives.propertyRestitution === 'MONETIZE_AS_STATE_LAND') {
    next.macro.treasurySYP += 1_200_000_000_000;
    next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 8);
    next.macro.nationalRRI = Math.min(100, next.macro.nationalRRI + 6);
  }

  // =========================================================================
  // PHASE 2: FOREIGN DEBT, SOVEREIGN LOANS & EMERGENCY MORTGAGES
  // =========================================================================
  if (directives.signedLoanIds && directives.signedLoanIds.length > 0) {
    for (const loanId of directives.signedLoanIds) {
      const loan = next.foreignLoans.find((l) => l.id === loanId);
      if (loan && !loan.isSigned) {
        if (next.macro.politicalCapital >= loan.politicalCapitalCost) {
          loan.isSigned = true;
          next.macro.reservesUSD += loan.disbursementUSD;
          next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - loan.politicalCapitalCost);
        }
      }
    }
  }

  if (directives.executedMortgageIds && directives.executedMortgageIds.length > 0) {
    for (const mortgageId of directives.executedMortgageIds) {
      const mort = next.sovereignMortgages.find((m) => m.id === mortgageId);
      if (mort && !mort.isMortgaged) {
        mort.isMortgaged = true;
        next.macro.reservesUSD += mort.immediateCashUSD;
        next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 5);
      }
    }
  }

  // Expatriate Brain-Gain Initiative
  if (directives.expatriateBrainGainIncentive) {
    if (next.macro.reservesUSD >= 20_000_000 && next.macro.treasurySYP >= 350_000_000_000) {
      Object.values(next.ministries).forEach((m) => {
        m.competence = Math.min(100, m.competence + 8);
      });
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 4);
    }
  }

  // =========================================================================
  // PHASE 3: GEOPOLITICAL & SOUTHERN THEATER DYNAMICS
  // =========================================================================
  if (directives.southernPolicy === 'HISTORIC_ACCORD') {
    if (next.governorates['as_suwayda']) {
      next.governorates['as_suwayda'].prri = Math.max(0, next.governorates['as_suwayda'].prri - 20);
      next.governorates['as_suwayda'].tier = 'CALM';
    }
    if (next.governorates['daraa']) {
      next.governorates['daraa'].prri = Math.max(0, next.governorates['daraa'].prri - 15);
      next.governorates['daraa'].tier = 'CALM';
    }
    next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 6);
  } else if (directives.southernPolicy === 'BLOCKADE') {
    if (next.governorates['as_suwayda']) {
      next.governorates['as_suwayda'].prri = Math.min(100, next.governorates['as_suwayda'].prri + 25);
      next.governorates['as_suwayda'].tier = 'REVOLT';
    }
    next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 10);
  }

  if (directives.golanBorderStance === 'DEPLOY_ARMOR') {
    if (next.governorates['quneitra']) {
      next.governorates['quneitra'].prri = Math.max(0, next.governorates['quneitra'].prri - 10);
    }
  }

  // =========================================================================
  // PHASE 4: PROVINCIAL STRATEGIC PROJECTS, DEMINING & POWER BOOST
  // =========================================================================
  for (const projId of directives.provincialProjects || []) {
    for (const gov of Object.values(next.governorates)) {
      if (gov.strategicProject && gov.strategicProject.id === projId && !gov.strategicProject.isExecuted) {
        if (
          next.macro.politicalCapital >= gov.strategicProject.costPoliticalCapital &&
          next.macro.reservesUSD >= gov.strategicProject.costUSD &&
          next.macro.treasurySYP >= gov.strategicProject.costSYP
        ) {
          gov.strategicProject.isExecuted = true;
          next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - gov.strategicProject.costPoliticalCapital);

          const repairRatio = gov.unrepairedDamageUSD > 0
            ? (gov.strategicProject.damageRepairedUSD / gov.unrepairedDamageUSD)
            : (gov.strategicProject.damageRepairedUSD / 1_000_000_000);
          gov.reconstructionScore = Math.min(1.0, gov.reconstructionScore + repairRatio);
          gov.prri = Math.max(0, gov.prri + gov.strategicProject.prriDelta);
          gov.dailyBlackoutHours = Math.max(2, gov.dailyBlackoutHours + gov.strategicProject.blackoutHoursDelta);

          if (gov.id === 'latakia' || gov.id === 'tartus') {
            next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 3);
          }
        }
      }
    }
  }

  // Demining priority (only deployable where mine contamination is > 8% and affordable)
  if (directives.deminingPriorityId && next.governorates[directives.deminingPriorityId]) {
    const dGov = next.governorates[directives.deminingPriorityId];
    if (dGov.mineSaturationPct > 8 && next.macro.reservesUSD >= 20_000_000 && next.macro.treasurySYP >= 800_000_000_000) {
      dGov.mineSaturationPct = Math.max(0, dGov.mineSaturationPct - 8);
      dGov.prri = Math.max(0, dGov.prri - 5);
      if (next.commissions && next.commissions['demining']) {
        next.commissions['demining'].progress = Math.min(100, next.commissions['demining'].progress + 8);
      }
    }
  }

  // Power supply boost priority for a single governorate (only if blackout > 2 and affordable)
  if (directives.powerBoostGovId && next.governorates[directives.powerBoostGovId]) {
    const pGov = next.governorates[directives.powerBoostGovId];
    if (pGov.dailyBlackoutHours > 2 && next.macro.reservesUSD >= 10_000_000 && next.macro.treasurySYP >= 300_000_000_000) {
      pGov.dailyBlackoutHours = Math.max(2, pGov.dailyBlackoutHours - 4);
      pGov.prri = Math.max(0, pGov.prri - 6);
      pGov.reconstructionScore = Math.min(1.0, Number((pGov.reconstructionScore + 0.03).toFixed(2)));
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 1);
    }
  }

  // Electrical Grid CapEx investment & power hours dynamic conversion
  if (directives.gridCapExUSD > 0) {
    const competenceWaste = next.macro.systemicCorruption > 65 ? 0.20 : 0.05;
    const effectiveGridCapExUSD = directives.gridCapExUSD * (1 - competenceWaste);
    next.macro.gridCapacityMW = Math.min(6000, next.macro.gridCapacityMW + Math.round((effectiveGridCapExUSD / 1_000_000) * 12));
    next.macro.dailyPowerHours = Math.min(24, Number(((next.macro.gridCapacityMW / 6000) * 24).toFixed(1)));
  }

  // =========================================================================
  // PHASE 5: FINANCIAL AUDIT & COMMODITY FLOWS
  // =========================================================================
  const audit = auditSemiannualBudget(next, directives);
  next.lastTurnAudit = audit;

  next.macro.reservesUSD = Math.max(0, next.macro.reservesUSD + audit.netUSDDelta);
  next.macro.treasurySYP = Math.max(0, next.macro.treasurySYP + audit.netSYPDelta);
  next.macro.m2MoneySupplySYP += audit.seignioragePrintedSYP;

  // Update civil service wage
  next.macro.civilServiceWageSYP = Math.round(
    next.macro.civilServiceWageSYP * (1 + directives.wageBumpPercent / 100)
  );

  // Update parallel exchange rate
  const fxDrainUSD = Math.max(0, -audit.netUSDDelta);
  next.macro.parallelRateSYP = calculateParallelRate(
    next.macro.parallelRateSYP,
    next.macro.m2MoneySupplySYP,
    audit.seignioragePrintedSYP,
    fxDrainUSD,
    next.macro.reservesUSD
  );

  // =========================================================================
  // PHASE 6: MIGRATION, POPULATION & LOCAL PRRI DYNAMICS
  // =========================================================================
  const nationalPRRISum = Object.values(next.governorates).reduce((sum, g) => sum + g.prri, 0);
  next.macro.nationalRRI = Math.round(nationalPRRISum / Object.keys(next.governorates).length);

  for (const gov of Object.values(next.governorates)) {
    if (gov.prri < 40) gov.tier = 'CALM';
    else if (gov.prri < 65) gov.tier = 'TENSE';
    else if (gov.prri < 85) gov.tier = 'RIOT';
    else gov.tier = 'REVOLT';
  }

  // =========================================================================
  // PHASE 7: ADVANCE CALENDAR & GENERATE EVENTS
  // =========================================================================
  next.turnNumber += 1;
  if (next.season === 'H1_HARVEST') {
    next.season = 'H2_WINTER';
  } else {
    next.season = 'H1_HARVEST';
    next.calendarYear += 1;
  }

  // Check Game Fail States using fail-states engine
  const failCheck = checkFailStates(next);
  if (failCheck.isFailed) {
    next.isGameOver = true;
    next.failState = failCheck;
  } else if (next.turnNumber > 40) {
    // Generational Projection Engine triggers upon successful 40 turns completion
    next.isGameOver = true;
    next.centuryEnding = projectCenturyOutcome(next);
  }

  // Generate Crisis Events for the new turn if still alive
  if (!next.isGameOver) {
    const prng = new PRNG(next.seed + next.turnNumber);
    next.activeEvents = drawEventsForTurn(next, prng);
  }

  return next;
}

import type {
  GameState,
  TurnDirectives,
  PredictivePreviewRanges,
  ProjectedStat,
  ProjectedTurnSummary,
} from './types';
import { auditSemiannualBudget } from './revenues';
import { calculateParallelRate, calculateRealWageUSD } from './currency';
import { drawEventsForTurn } from './events';
import { checkFailStates } from './fail-states';
import { projectCenturyOutcome } from './century-engine';
import { PRNG } from './prng';
import {
  getOligarchSettlementIncome,
  getOligarchLiquidationIncome,
  getOligarchSettlementPCCost,
  getOligarchLiquidationPCCost,
  getOligarchNationalizePCEarned,
} from './oligarch-helpers';

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


export function canAffordDirectiveCost(
  reservesUSD: number,
  treasurySYP: number,
  costUSD: number,
  costSYP: number,
  parallelRate: number
): boolean {
  if (costUSD > reservesUSD) return false;
  if (treasurySYP >= costSYP) return true;
  const sypShortfall = costSYP - treasurySYP;
  const usdNeededForSYP = sypShortfall / Math.max(1, parallelRate);
  return reservesUSD >= costUSD + usdNeededForSYP;
}

export function hasDraftSelections(directives: TurnDirectives): boolean {
  if (!directives) return false;
  const def = getDefaultTurnDirectives();
  return (
    directives.wageBumpPercent !== def.wageBumpPercent ||
    (directives.foodSubsidyLevel != null && directives.foodSubsidyLevel !== def.foodSubsidyLevel) ||
    (directives.workforceStrategy != null && directives.workforceStrategy !== def.workforceStrategy) ||
    (directives.wheatProcurement != null && directives.wheatProcurement !== def.wheatProcurement) ||
    (directives.dieselSmuggling != null && directives.dieselSmuggling !== def.dieselSmuggling) ||
    directives.remittanceCaptureSpread !== def.remittanceCaptureSpread ||
    directives.corporateTaxRate !== def.corporateTaxRate ||
    directives.telecomExciseRate !== def.telecomExciseRate ||
    directives.nassibTransitFeeUSD !== def.nassibTransitFeeUSD ||
    directives.gridCapExUSD !== def.gridCapExUSD ||
    directives.dollarAuctionUSD !== def.dollarAuctionUSD ||
    directives.deminingPriorityId !== def.deminingPriorityId ||
    directives.powerBoostGovId !== def.powerBoostGovId ||
    directives.expatriateBrainGainIncentive !== def.expatriateBrainGainIncentive ||
    directives.propertyRestitution !== def.propertyRestitution ||
    (directives.activePoliticalActions && directives.activePoliticalActions.length > 0) ||
    (directives.provincialProjects && directives.provincialProjects.length > 0) ||
    (directives.signedLoanIds && directives.signedLoanIds.length > 0) ||
    (directives.executedMortgageIds && directives.executedMortgageIds.length > 0) ||
    Object.keys(directives.oligarchDecisions || {}).length > 0 ||
    directives.southernPolicy !== def.southernPolicy ||
    directives.golanBorderStance !== def.golanBorderStance
  );
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
    Math.max(0, state.macro.reservesUSD + netUSDDelta),
    2.5,
    directives.dollarAuctionUSD || 0
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

export function simulateTurnTransitions(
  currentState: GameState,
  directives: TurnDirectives
): GameState {
  const next: GameState = JSON.parse(JSON.stringify(currentState));

  // =========================================================================
  // PHASE 0: SPECIAL DECREES & POLITICAL ACTIONS
  // =========================================================================
  next.enactedDecrees = next.enactedDecrees ? [...next.enactedDecrees] : [];
  const ONE_TIME_DECREES = [
    'ANTI_CORRUPTION_COMMISSION',
    'PROPERTY_RESTITUTION_PORTAL',
    'TRIBAL_CUSTOMS_COUNCIL',
    'UNITY_SPEECH',
    'OPPOSITION_SEATS',
  ];

  for (const actId of directives.activePoliticalActions || []) {
    // If it is a one-time decree and already enacted, skip it
    if (ONE_TIME_DECREES.includes(actId) && next.enactedDecrees.includes(actId)) {
      continue;
    }

    if (actId === 'ANTI_CORRUPTION_COMMISSION') {
      if (next.macro.politicalCapital >= 15) {
        next.macro.systemicCorruption = Math.max(0, next.macro.systemicCorruption - 8);
        next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 15);
        next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 5);
        Object.values(next.governorates).forEach((g) => {
          g.prri = Math.max(0, g.prri - 3);
        });
        next.enactedDecrees.push('ANTI_CORRUPTION_COMMISSION');
      }
    } else if (actId === 'PROPERTY_RESTITUTION_PORTAL') {
      if (next.macro.politicalCapital >= 10) {
        next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - 10);
        next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 4);
        if (next.governorates['homs']) next.governorates['homs'].prri = Math.max(0, next.governorates['homs'].prri - 8);
        if (next.governorates['rif_dimashq']) next.governorates['rif_dimashq'].prri = Math.max(0, next.governorates['rif_dimashq'].prri - 6);
        next.enactedDecrees.push('PROPERTY_RESTITUTION_PORTAL');
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
        next.enactedDecrees.push('TRIBAL_CUSTOMS_COUNCIL');
      }
    } else if (actId === 'CABINET_HEARING') {
      next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 8);
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 3);
      Object.values(next.ministries).forEach((m) => {
        m.competence = Math.min(100, m.competence + 2);
      });
      Object.values(next.governorates).forEach((g) => {
        g.prri = Math.max(0, g.prri - 2);
      });
    } else if (actId === 'UNITY_SPEECH') {
      next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 4);
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 2);
      Object.values(next.governorates).forEach((g) => {
        g.prri = Math.max(0, g.prri - 4);
      });
      next.enactedDecrees.push('UNITY_SPEECH');
    } else if (actId === 'OPPOSITION_SEATS') {
      next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + 18);
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 4);
      const minKeys = Object.keys(next.ministries);
      if (minKeys.length > 0) {
        next.ministries[minKeys[0]].isOpposition = true;
      }
      next.enactedDecrees.push('OPPOSITION_SEATS');
    } else if (actId === 'MARTIAL_LAW') {
      const wasActive = currentState.flags?.Martial_Law_Active === 1;
      if (!wasActive) {
        next.macro.nationalRRI = Math.max(0, next.macro.nationalRRI - 15);
        next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 12);
        Object.values(next.governorates).forEach((g) => {
          g.prri = Math.max(0, g.prri - 12);
        });
      } else {
        // Continuous martial law debuff: -4% civic trust per turn while suppressing unrest
        next.macro.nationalRRI = Math.max(0, next.macro.nationalRRI - 8);
        next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 4);
        Object.values(next.governorates).forEach((g) => {
          g.prri = Math.max(0, g.prri - 6);
        });
      }
      next.flags.Martial_Law_Active = 1;
    }
  }

  // If Martial Law was lifted this turn
  if (currentState.flags?.Martial_Law_Active === 1 && !directives.activePoliticalActions?.includes('MARTIAL_LAW')) {
    next.flags.Martial_Law_Active = 0;
    next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 2);
  }

  // =========================================================================
  // PHASE 1: OLIGARCH ASSET DECISIONS & PROPERTY RESTITUTION
  // =========================================================================
  if (directives.oligarchDecisions) {
    for (const [assetId, action] of Object.entries(directives.oligarchDecisions)) {
      const asset = next.confiscatedAssets.find((a) => a.id === assetId);
      if (asset && asset.status === 'PENDING') {
        if (action === 'SETTLEMENT_80_20') {
          const costPC = getOligarchSettlementPCCost(asset.valuationUSD);
          if (next.macro.politicalCapital >= costPC) {
            asset.status = 'SETTLED';
            const cashUSD = getOligarchSettlementIncome(asset.valuationUSD);
            next.macro.reservesUSD += cashUSD;
            next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - costPC);
            next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 2);
          }
        } else if (action === 'NATIONALIZE_SOE') {
          asset.status = 'NATIONALIZED';
          const earnedPC = getOligarchNationalizePCEarned(asset.valuationUSD);
          next.macro.civilServiceHeadcount = (next.macro.civilServiceHeadcount ?? 850_000) + 8000;
          next.macro.systemicCorruption = Math.min(100, next.macro.systemicCorruption + 5);
          next.macro.politicalCapital = Math.min(100, next.macro.politicalCapital + earnedPC);
        } else if (action === 'FOREIGN_LIQUIDATION') {
          const costPC = getOligarchLiquidationPCCost(asset.valuationUSD);
          if (next.macro.politicalCapital >= costPC) {
            asset.status = 'LIQUIDATED';
            const cashUSD = getOligarchLiquidationIncome(asset.valuationUSD);
            next.macro.reservesUSD += cashUSD;
            next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 4);
            next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - costPC);
          }
        }
      }
    }
  }

  if (directives.propertyRestitution === 'MONETIZE_AS_STATE_LAND') {
    next.macro.treasurySYP += 1_200_000_000_000;
    next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 8);
    Object.values(next.governorates).forEach((g) => {
      g.prri = Math.min(100, g.prri + 5);
    });
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
          next.macro.sovereignDebtUSD = (next.macro.sovereignDebtUSD ?? 6_800_000_000) + loan.disbursementUSD;
          next.macro.sovereignLeverage = Math.max(0, (next.macro.sovereignLeverage ?? 65) - 8);
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
        next.macro.sovereignLeverage = Math.max(0, (next.macro.sovereignLeverage ?? 65) - 14);
        next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 5);
      }
    }
  }

  // Expatriate Brain-Gain Initiative
  if (directives.expatriateBrainGainIncentive) {
    if (canAffordDirectiveCost(next.macro.reservesUSD, next.macro.treasurySYP, 20_000_000, 350_000_000_000, next.macro.parallelRateSYP)) {
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
      next.governorates['as_suwayda'].prri = Math.min(100, next.governorates['as_suwayda'].prri + 30);
      next.governorates['as_suwayda'].tier = 'REVOLT';
    }
    if (next.governorates['daraa']) {
      next.governorates['daraa'].prri = Math.min(100, next.governorates['daraa'].prri + 20);
      next.governorates['daraa'].tier = 'REVOLT';
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
          canAffordDirectiveCost(next.macro.reservesUSD, next.macro.treasurySYP, gov.strategicProject.costUSD, gov.strategicProject.costSYP, next.macro.parallelRateSYP)
        ) {
          gov.strategicProject.isExecuted = true;
          next.macro.politicalCapital = Math.max(0, next.macro.politicalCapital - gov.strategicProject.costPoliticalCapital);

          const repairRatio = gov.unrepairedDamageUSD > 0
            ? (gov.strategicProject.damageRepairedUSD / gov.unrepairedDamageUSD)
            : (gov.strategicProject.damageRepairedUSD / 1_000_000_000);
          gov.reconstructionScore = Math.min(1.0, gov.reconstructionScore + repairRatio);
          gov.prri = Math.max(0, gov.prri + gov.strategicProject.prriDelta);
          gov.dailyBlackoutHours = Math.max(2, gov.dailyBlackoutHours + gov.strategicProject.blackoutHoursDelta);

          if (gov.strategicProject.mineClearancePct) {
            gov.mineSaturationPct = Math.max(0, gov.mineSaturationPct - gov.strategicProject.mineClearancePct);
          }
          if (gov.strategicProject.golanTensionDelta) {
            if (gov.golanTensionIndex !== undefined) {
              gov.golanTensionIndex = Math.max(0, Math.min(100, gov.golanTensionIndex + gov.strategicProject.golanTensionDelta));
            }
            if (next.governorates['daraa']?.golanTensionIndex !== undefined) {
              next.governorates['daraa'].golanTensionIndex = Math.max(0, Math.min(100, next.governorates['daraa'].golanTensionIndex + gov.strategicProject.golanTensionDelta));
            }
            if (next.governorates['quneitra']?.golanTensionIndex !== undefined) {
              next.governorates['quneitra'].golanTensionIndex = Math.max(0, Math.min(100, next.governorates['quneitra'].golanTensionIndex + gov.strategicProject.golanTensionDelta));
            }
          }
          if (gov.strategicProject.suwaydaIntegrationBonus) {
            if (gov.suwaydaIntegrationIndex !== undefined) {
              gov.suwaydaIntegrationIndex = Math.min(100, gov.suwaydaIntegrationIndex + gov.strategicProject.suwaydaIntegrationBonus);
            }
            if (gov.suwaydaSecessionProb !== undefined) {
              gov.suwaydaSecessionProb = Math.max(0, Math.min(100, gov.suwaydaSecessionProb - 20));
            }
          }
          if (gov.strategicProject.tribalRageDelta) {
            if (gov.tribalRageIndex !== undefined) {
              gov.tribalRageIndex = Math.max(0, gov.tribalRageIndex + gov.strategicProject.tribalRageDelta);
            }
          }

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
    if (dGov.mineSaturationPct > 8 && canAffordDirectiveCost(next.macro.reservesUSD, next.macro.treasurySYP, 20_000_000, 800_000_000_000, next.macro.parallelRateSYP)) {
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
    if (pGov.dailyBlackoutHours > 2 && canAffordDirectiveCost(next.macro.reservesUSD, next.macro.treasurySYP, 10_000_000, 300_000_000_000, next.macro.parallelRateSYP)) {
      pGov.dailyBlackoutHours = Math.max(2, pGov.dailyBlackoutHours - 4);
      pGov.prri = Math.max(0, pGov.prri - 6);
      pGov.reconstructionScore = Math.min(1.0, Number((pGov.reconstructionScore + 0.03).toFixed(2)));
      next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 1);
    }
  }

  // Electrical Grid CapEx investment & power hours dynamic conversion
  // Plan section 3.3 formula: Effective CapEx = Allocated CapEx * (Competence / 100) * (1 - Corruption / 100)
  const energyMin = next.ministries['energy'];
  const compFactor = (energyMin?.competence ?? 45) / 100;
  const corrupFactor = 1 - ((next.macro.systemicCorruption ?? 58) / 100) * 0.40;

  if (directives.gridCapExUSD > 0) {
    const effectiveCapExUSD = directives.gridCapExUSD * Math.max(0.6, compFactor * 1.5) * corrupFactor;
    const mwGained = Math.round((effectiveCapExUSD / 1_000_000) * 15);
    next.macro.gridCapacityMW = Math.min(6000, next.macro.gridCapacityMW + mwGained);
    const hoursGained = Number((mwGained / 250).toFixed(1));
    next.macro.dailyPowerHours = Math.min(24, Number((next.macro.dailyPowerHours + hoursGained).toFixed(1)));
    if (hoursGained > 0) {
      for (const gov of Object.values(next.governorates)) {
        gov.dailyBlackoutHours = Math.max(1, Number((gov.dailyBlackoutHours - hoursGained).toFixed(1)));
      }
    }
  } else {
    // Zero CapEx: Grid degradation due to lack of maintenance and wear & tear
    next.macro.gridCapacityMW = Math.max(1000, next.macro.gridCapacityMW - 120);
    const hoursLost = 0.5;
    next.macro.dailyPowerHours = Math.max(1, Number((next.macro.dailyPowerHours - hoursLost).toFixed(1)));
    for (const gov of Object.values(next.governorates)) {
      gov.dailyBlackoutHours = Math.min(23, Number((gov.dailyBlackoutHours + hoursLost).toFixed(1)));
      gov.prri = Math.min(100, gov.prri + 2);
    }
  }

  // =========================================================================
  // PHASE 5: FINANCIAL AUDIT & COMMODITY FLOWS
  // =========================================================================
  const audit = auditSemiannualBudget(next, directives);
  next.lastTurnAudit = audit;

  next.macro.reservesUSD = Math.max(0, next.macro.reservesUSD + audit.netUSDDelta);
  next.macro.treasurySYP = next.macro.treasurySYP + audit.netSYPDelta;
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
    next.macro.reservesUSD,
    2.5,
    directives.dollarAuctionUSD || 0
  );

  // Central bank dollar auction M2 absorption and market stabilization
  if (directives.dollarAuctionUSD && directives.dollarAuctionUSD > 0) {
    const absorbedSYP = Math.round(directives.dollarAuctionUSD * (next.macro.parallelRateSYP * 0.95));
    next.macro.m2MoneySupplySYP = Math.max(1_000_000_000_000, next.macro.m2MoneySupplySYP - Math.round(absorbedSYP * 0.40));
  }

  // Remittance Policy side-effects (Plan section 7.2)
  const skimSpreadVal = directives.remittanceCaptureSpread ?? 10;
  if (skimSpreadVal > 15) {
    // Hawala flight & black market penalty
    next.macro.civicTrust = Math.max(0, next.macro.civicTrust - 3);
    // Black market diversion drives parallel rate up
    next.macro.parallelRateSYP = Math.round(next.macro.parallelRateSYP * 1.03);
    // Provincial unrest rises in remittance-dependent urban centres
    for (const govId of ['damascus', 'rif_dimashq', 'homs', 'latakia', 'tartus', 'as_suwayda']) {
      if (next.governorates[govId]) {
        next.governorates[govId].prri = Math.min(100, next.governorates[govId].prri + 2);
      }
    }
  } else if (skimSpreadVal <= 7) {
    // Attractive diaspora incentive builds civic trust
    next.macro.civicTrust = Math.min(100, next.macro.civicTrust + 2);
  }

  // =========================================================================
  // PHASE 6: MIGRATION, POPULATION & LOCAL PRRI DYNAMICS
  // =========================================================================
  // Socio-economic and policy impacts on provincial living conditions & unrest
  // 1. Civil service wage bump alleviates household hardship nationwide
  const wageRelief = Math.round((directives.wageBumpPercent / 25) * 3); // +25% -> -3, +50% -> -6, +75% -> -9, +100% -> -12

  // 2. Food subsidies directly govern bread availability and bakery panic (matching UI descriptors)
  let foodSubsidyDelta = 0;
  if (directives.foodSubsidyLevel === 'GENEROUS') foodSubsidyDelta = -12;
  else if (directives.foodSubsidyLevel === 'AUSTERE') foodSubsidyDelta = +15;

  // 3. Public employment restructuring & militia integration
  let workforceDelta = 0;
  if (directives.workforceStrategy === 'ABSORB_MILITIAS') workforceDelta = -4;
  else if (directives.workforceStrategy === 'PRUNE_CIVIL_SERVICE') workforceDelta = +7;

  // 4. Wheat procurement price for farmers in breadbasket provinces
  const breadbasketGovs = ['hasakeh', 'raqqa', 'deir_ez_zor', 'hama', 'aleppo', 'daraa'];
  let wheatDelta = 0;
  if (directives.wheatProcurement === 'PREMIUM_INCENTIVE') wheatDelta = -4;
  else if (directives.wheatProcurement === 'SUBSIDIZED_LOW') wheatDelta = +6;

  // 5. Diesel anti-smuggling enforcement clashes along borders
  const borderCorridorGovs = ['deir_ez_zor', 'homs', 'rif_dimashq', 'daraa'];
  let dieselDelta = 0;
  if (directives.dieselSmuggling === 'CRACKDOWN') dieselDelta = +4;
  else if (directives.dieselSmuggling === 'PERMISSIVE') dieselDelta = -2;

  // 6. Grid CapEx delta compared to baseline $35M
  const capExDelta = directives.gridCapExUSD - 35_000_000;
  const powerRelief = Math.round((capExDelta / 35_000_000) * 2);

  // 7. Real purchasing power shock (beyond normal wage relief)
  const prevRealWage = currentState.macro.civilServiceWageSYP / Math.max(1, currentState.macro.parallelRateSYP);
  const nextRealWage = next.macro.civilServiceWageSYP / Math.max(1, next.macro.parallelRateSYP);
  const realWageDiff = nextRealWage - prevRealWage;
  // If purchasing power drops by more than $5 without wage relief, frustration rises
  let purchasingPowerDelta = 0;
  if (realWageDiff < -8) purchasingPowerDelta = +3;
  else if (realWageDiff > 12) purchasingPowerDelta = -3;

  for (const gov of Object.values(next.governorates)) {
    let delta = -wageRelief + foodSubsidyDelta + workforceDelta - powerRelief + purchasingPowerDelta;
    if (breadbasketGovs.includes(gov.id)) {
      delta += wheatDelta;
    }
    if (borderCorridorGovs.includes(gov.id)) {
      delta += dieselDelta;
    }
    gov.prri = Math.max(5, Math.min(100, gov.prri + delta));
  }

  const nationalPRRISum = Object.values(next.governorates).reduce((sum, g) => sum + g.prri, 0);
  next.macro.nationalRRI = Math.round(nationalPRRISum / Object.keys(next.governorates).length);

  for (const gov of Object.values(next.governorates)) {
    if (gov.prri < 40) gov.tier = 'CALM';
    else if (gov.prri < 65) gov.tier = 'TENSE';
    else if (gov.prri < 85) gov.tier = 'RIOT';
    else gov.tier = 'REVOLT';
  }

  return next;
}

export function calculateProjectedTurnSummary(
  currentState: GameState,
  directives: TurnDirectives
): ProjectedTurnSummary {
  const projected = simulateTurnTransitions(currentState, directives);

  function makeStat(
    current: number,
    nextVal: number,
    positiveIsBeneficial: boolean,
    threshold = 0.01
  ): ProjectedStat {
    const delta = nextVal - current;
    const pctChange = current !== 0 ? (delta / Math.abs(current)) * 100 : 0;
    const isChanged = Math.abs(delta) >= threshold;
    const isBeneficial = positiveIsBeneficial ? delta > 0 : delta < 0;
    const isHarmful = positiveIsBeneficial ? delta < 0 : delta > 0;
    return {
      current,
      projected: nextVal,
      delta,
      pctChange,
      isBeneficial: isChanged && isBeneficial,
      isHarmful: isChanged && isHarmful,
      isChanged,
    };
  }

  const currentRealWageUSD = Math.round(
    currentState.macro.civilServiceWageSYP / currentState.macro.parallelRateSYP
  );
  const projectedRealWageUSD = Math.round(
    projected.macro.civilServiceWageSYP / projected.macro.parallelRateSYP
  );

  const deficitSYP = Math.max(
    0,
    (projected.lastTurnAudit?.expendedSYP ?? 0) -
      (projected.lastTurnAudit?.grossCapturedSYP ?? 0)
  );

  return {
    treasurySYP: makeStat(
      currentState.macro.treasurySYP,
      projected.macro.treasurySYP,
      true,
      10_000_000
    ),
    reservesUSD: makeStat(
      currentState.macro.reservesUSD,
      projected.macro.reservesUSD,
      true,
      100_000
    ),
    parallelRateSYP: makeStat(
      currentState.macro.parallelRateSYP,
      projected.macro.parallelRateSYP,
      false,
      5
    ), // Lower parallel rate is beneficial
    realWageUSD: makeStat(currentRealWageUSD, projectedRealWageUSD, true, 0.5),
    politicalCapital: makeStat(
      currentState.macro.politicalCapital,
      projected.macro.politicalCapital,
      true,
      0.5
    ),
    nationalRRI: makeStat(
      currentState.macro.nationalRRI,
      projected.macro.nationalRRI,
      false,
      0.5
    ), // Lower RRI (unrest) is beneficial
    dailyPowerHours: makeStat(
      currentState.macro.dailyPowerHours,
      projected.macro.dailyPowerHours,
      true,
      0.1
    ),
    civicTrust: makeStat(
      currentState.macro.civicTrust,
      projected.macro.civicTrust,
      true,
      0.5
    ),
    sovereignDebtUSD: makeStat(
      currentState.macro.sovereignDebtUSD ?? 6_800_000_000,
      projected.macro.sovereignDebtUSD ?? 6_800_000_000,
      false, // Lower debt is beneficial
      1_000_000
    ),
    m2MoneySupplySYP: makeStat(
      currentState.macro.m2MoneySupplySYP ?? 18_500_000_000_000,
      projected.macro.m2MoneySupplySYP ?? 18_500_000_000_000,
      false, // Lower money printing inflation is beneficial
      10_000_000_000
    ),
    taxCompliancePct: makeStat(
      currentState.macro.taxCompliancePct ?? 35,
      projected.macro.taxCompliancePct ?? 35,
      true, // Higher tax compliance is beneficial
      0.5
    ),
    systemicCorruption: makeStat(
      currentState.macro.systemicCorruption ?? 58,
      projected.macro.systemicCorruption ?? 58,
      false, // Lower systemic corruption is beneficial
      0.5
    ),
    sovereignLeverage: makeStat(
      currentState.macro.sovereignLeverage ?? 65,
      projected.macro.sovereignLeverage ?? 65,
      true, // Higher sovereign autonomy is beneficial
      0.5
    ),
    civilServiceHeadcount: makeStat(
      currentState.macro.civilServiceHeadcount ?? 1_400_000,
      projected.macro.civilServiceHeadcount ?? 1_400_000,
      true,
      100
    ),
    civilPayrollSYP: makeStat(
      Math.round((currentState.macro.civilServiceHeadcount ?? 1_400_000) * currentState.macro.civilServiceWageSYP * 6),
      Math.round((projected.macro.civilServiceHeadcount ?? 1_400_000) * projected.macro.civilServiceWageSYP * 6),
      false, // Lower payroll expenditure is beneficial fiscally
      10_000_000_000
    ),
    runwayMonths: projected.lastTurnAudit?.runwayMonths ?? 99,
    deficitSYP,
    hasSelections: hasDraftSelections(directives),
  };
}

export function executeTurnLifecycle(
  currentState: GameState,
  directives: TurnDirectives
): GameState {
  const next: GameState = simulateTurnTransitions(currentState, directives);

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

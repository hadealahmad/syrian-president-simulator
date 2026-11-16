import { MAX_TURNS } from '../engine/constants';
import { calculateRealWageUSD } from '../engine/currency';
import type { GameState, MainRunMeta } from '../engine/types';
import { MAIN_ACHIEVEMENTS } from './main-achievements-defs';
import type { RunRecord } from './types';

export { MAIN_ACHIEVEMENTS };

const QUAD_REPUDIATION_IDS = [
  'REPUDIATE_PARIS',
  'REPUDIATE_RUSSIA',
  'REPUDIATE_IRAN_FORMAL',
  'REPUDIATE_IRAN_INFORMAL',
] as const;

export interface MainRunStats {
  avgRealWageUSD: number;
  minCivicTrust: number;
  totalPrintedSYP: number;
  quadRepudiationInOneTurn: boolean;
  lifetimeTurns: number;
}

export function createInitialRunMeta(state: GameState, startedAt = Date.now()): MainRunMeta {
  return {
    runId: `main-${state.seed}-${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt,
    realWageSumUSD: 0,
    realWageSamples: 0,
    minCivicTrust: state.macro.civicTrust,
    totalPrintedSYP: 0,
    quadRepudiationInOneTurn: false,
    recorded: false,
  };
}

export function ensureRunMeta(state: GameState, fallbackStartedAt = Date.now()): MainRunMeta {
  if (state.runMeta && state.runMeta.runId && Number.isFinite(state.runMeta.startedAt)) {
    return { ...state.runMeta };
  }
  const initial = createInitialRunMeta(state, fallbackStartedAt);
  if (state.turnNumber > 1) {
    const currentWage = calculateRealWageUSD(
      state.macro.civilServiceWageSYP,
      state.macro.parallelRateSYP
    );
    initial.realWageSumUSD = currentWage;
    initial.realWageSamples = 1;
  }
  return initial;
}

export function advanceRunMetaOnTransition(
  prevState: GameState | null,
  nextState: GameState,
  turnCommitted: boolean,
  now = Date.now()
): MainRunMeta {
  const base = ensureRunMeta(prevState ?? nextState, now);
  let realWageSumUSD = base.realWageSumUSD;
  let realWageSamples = base.realWageSamples;
  let totalPrintedSYP = base.totalPrintedSYP;
  let quadRepudiationInOneTurn = Boolean(base.quadRepudiationInOneTurn);

  if (turnCommitted) {
    const wage = calculateRealWageUSD(
      nextState.macro.civilServiceWageSYP,
      nextState.macro.parallelRateSYP
    );
    realWageSumUSD += wage;
    realWageSamples += 1;
    totalPrintedSYP += Math.max(0, nextState.lastTurnAudit?.seignioragePrintedSYP ?? 0);

    const prevDecrees = new Set(prevState?.enactedDecrees ?? []);
    const nextDecrees = new Set(nextState.enactedDecrees ?? []);
    const enactedAllFourThisTurn = QUAD_REPUDIATION_IDS.every(
      (id) => !prevDecrees.has(id) && nextDecrees.has(id)
    );
    if (enactedAllFourThisTurn) {
      quadRepudiationInOneTurn = true;
    }
  }

  return {
    ...base,
    realWageSumUSD,
    realWageSamples,
    minCivicTrust: Math.min(base.minCivicTrust, nextState.macro.civicTrust),
    totalPrintedSYP,
    quadRepudiationInOneTurn,
  };
}

export function toMainRunStats(
  meta: MainRunMeta,
  lifetimeTurns: number,
  currentState: GameState
): MainRunStats {
  const fallbackWage = calculateRealWageUSD(
    currentState.macro.civilServiceWageSYP,
    currentState.macro.parallelRateSYP
  );
  const avgRealWageUSD =
    meta.realWageSamples > 0 ? meta.realWageSumUSD / meta.realWageSamples : fallbackWage;

  return {
    avgRealWageUSD,
    minCivicTrust: Math.min(meta.minCivicTrust, currentState.macro.civicTrust),
    totalPrintedSYP: meta.totalPrintedSYP,
    quadRepudiationInOneTurn: Boolean(meta.quadRepudiationInOneTurn),
    lifetimeTurns,
  };
}

function hasAnySignedForeignDeal(state: GameState): boolean {
  const signedLoan = state.foreignLoans.some((l) => l.isSigned);
  const signedMortgage = state.sovereignMortgages.some((m) => m.isMortgaged);
  return signedLoan || signedMortgage;
}

/**
 * Pure achievement evaluator called after every turn and at game end.
 * Returns all achievement IDs whose condition is satisfied on `nextState`.
 */
export function evaluateMainAchievements(
  _prevState: GameState | null,
  nextState: GameState,
  runStats: MainRunStats
): string[] {
  const out: string[] = [];
  const { macro, governorates } = nextState;
  const govList = Object.values(governorates);
  const isComplete = Boolean(nextState.isGameOver && nextState.centuryEnding);
  const isFailed = Boolean(nextState.isGameOver && nextState.failState?.isFailed);

  // 1. Endings
  if (isFailed && nextState.failState?.type) {
    const failMap: Record<string, string> = {
      SOVEREIGN_INSOLVENCY: 'end_sovereign_insolvency',
      URBAN_INSURRECTION: 'end_urban_insurrection',
      SECURITY_MUTINY: 'end_security_mutiny',
      BALKANIZATION_CASCADE: 'end_balkanization_cascade',
      CRISIS_DEFAULT_COLLAPSE: 'end_crisis_default_collapse',
    };
    const id = failMap[nextState.failState.type];
    if (id) out.push(id);
  }
  if (isComplete && nextState.centuryEnding?.id) {
    const centuryMap: Record<string, string> = {
      hollowed_republic: 'end_hollowed_republic',
      mortgaged_enclave: 'end_mortgaged_enclave',
      ecological_dust_bowl: 'end_ecological_dust_bowl',
      garrison_bastion: 'end_garrison_bastion',
      sovereign_phoenix: 'end_sovereign_phoenix',
    };
    const id = centuryMap[nextState.centuryEnding.id];
    if (id) out.push(id);
  }

  // 2. Single-run & lifetime turns
  const aliveOrCompletedTurn = isComplete ? MAX_TURNS : !isFailed ? nextState.turnNumber : 0;
  if (aliveOrCompletedTurn >= 10) out.push('turns_run_10');
  if (aliveOrCompletedTurn >= 20) out.push('turns_run_20');
  if (aliveOrCompletedTurn >= 30) out.push('turns_run_30');
  if (isComplete) out.push('turns_run_40');

  if (runStats.lifetimeTurns >= 100) out.push('turns_life_100');
  if (runStats.lifetimeTurns >= 250) out.push('turns_life_250');
  if (runStats.lifetimeTurns >= 500) out.push('turns_life_500');

  // 3. Special achievements
  if (isComplete && runStats.avgRealWageUSD > 10_000) out.push('spec_wage_10k');
  if (macro.reservesUSD >= 2_500_000_000) out.push('spec_reserves_2500m');
  if (macro.civicTrust >= 100) out.push('spec_trust_100');
  if (macro.systemicCorruption <= 0) out.push('spec_corruption_zero');
  if (macro.dailyPowerHours >= 24 && macro.gridCapacityMW >= 6_000) out.push('spec_power_24h');
  if (!isFailed && govList.length > 0 && govList.every((g) => g.tier === 'CALM') && macro.nationalRRI <= 15) {
    out.push('spec_all_calm');
  }
  if (isComplete && macro.sovereignDebtUSD <= 0 && (macro.iranOilDebtUSD ?? 0) <= 0) {
    out.push('spec_debt_zero');
  }
  if (macro.politicalCapital >= 200) out.push('spec_pc_max');
  if (govList.length > 0 && govList.every((g) => Boolean(g.strategicProject?.isExecuted))) {
    out.push('spec_all_projects');
  }
  if (isComplete && runStats.minCivicTrust >= 42) out.push('spec_trust_unbroken');
  if (
    isComplete &&
    nextState.centuryEnding?.id === 'sovereign_phoenix' &&
    nextState.centuryEnding.finalScore >= 90 &&
    (governorates['as_suwayda']?.suwaydaIntegrationIndex ?? 0) >= 80 &&
    !hasAnySignedForeignDeal(nextState)
  ) {
    out.push('spec_perfect_phoenix');
  }
  if (isComplete && (macro.civilServiceHeadcount ?? 1_400_000) <= 25_000) {
    out.push('spec_ghost_state');
  }
  if (isComplete && runStats.totalPrintedSYP >= 1_000_000_000_000) {
    out.push('spec_money_printer');
  }
  if (isComplete && runStats.quadRepudiationInOneTurn) {
    out.push('spec_quad_repudiation');
  }

  return out;
}

export function computeMainRunScore(state: GameState): number {
  if (state.centuryEnding) {
    return 1000 + state.centuryEnding.finalScore * 10;
  }
  return Math.min(state.turnNumber, MAX_TURNS) * 20;
}

export function buildMainRunRecord(state: GameState, endedAt = Date.now()): RunRecord | null {
  if (!state.isGameOver) return null;
  const meta = ensureRunMeta(state, endedAt);
  const stats = toMainRunStats(meta, 0, state);

  if (state.centuryEnding) {
    return {
      id: meta.runId,
      startedAt: meta.startedAt,
      endedAt: Math.max(meta.startedAt, endedAt),
      turns: MAX_TURNS,
      maxTurns: MAX_TURNS,
      resultId: state.centuryEnding.id,
      resultTitle: state.centuryEnding.titleAr,
      outcome: 'complete',
      score: computeMainRunScore(state),
      details: {
        finalScore: state.centuryEnding.finalScore,
        civicTrust: Math.round(state.macro.civicTrust),
        reservesUSD: Math.round(state.macro.reservesUSD),
        avgRealWageUSD: Math.round(stats.avgRealWageUSD),
      },
    };
  }

  if (state.failState?.isFailed) {
    const turnsReached = Math.min(state.turnNumber, MAX_TURNS);
    return {
      id: meta.runId,
      startedAt: meta.startedAt,
      endedAt: Math.max(meta.startedAt, endedAt),
      turns: turnsReached,
      maxTurns: MAX_TURNS,
      resultId: state.failState.type ?? 'COLLAPSE',
      resultTitle: state.failState.titleAr ?? 'سقوط الدولة',
      outcome: 'collapse',
      score: computeMainRunScore(state),
      details: {
        civicTrust: Math.round(state.macro.civicTrust),
        reservesUSD: Math.round(state.macro.reservesUSD),
        avgRealWageUSD: Math.round(stats.avgRealWageUSD),
      },
    };
  }

  return null;
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialGameState } from '../src/lib/engine/baseline';
import { calculateRealWageUSD, canAffordDirectiveCost } from '../src/lib/engine/currency';
import {
  applyUnresolvedCrisisPenalty,
  canAffordEventOption,
  resolveEventOption,
} from '../src/lib/engine/events';
import { canSignFacility } from '../src/lib/engine/facilities';
import { checkFailStates } from '../src/lib/engine/fail-states';
import { cloneGameState } from '../src/lib/engine/state-clone';
import {
  calculateProjectedTurnSummary,
  executeTurnLifecycle,
  getDefaultTurnDirectives,
} from '../src/lib/engine/turn-manager';
import type { EventOption, GameState, TurnDirectives } from '../src/lib/engine/types';
import { calculateTurnBudget } from '../src/lib/stores/draft-store';
import {
  MAIN_ACHIEVEMENTS,
  advanceRunMetaOnTransition,
  createInitialRunMeta,
  evaluateMainAchievements,
  toMainRunStats,
} from '../src/lib/records/main-achievements';
import { advanceDraftLikeStore, validatePlayerLegalDirectives } from './endings-legal-play';

// ─── 1. Static Definition Checks ───────────────────────────────────────────
const gameIconSrc = fs.readFileSync(
  path.resolve(process.cwd(), 'src/lib/ui/GameIcon.svelte'),
  'utf8'
);
const validGlyphs = new Set<string>();
for (const m of gameIconSrc.matchAll(/'([a-z0-9-]+)':\s*\{\s*body:/g)) {
  validGlyphs.add(m[1]);
}

const seenIds = new Set<string>();
for (const def of MAIN_ACHIEVEMENTS) {
  assert.ok(!seenIds.has(def.id), `Duplicate achievement id: ${def.id}`);
  seenIds.add(def.id);
  assert.ok(validGlyphs.has(def.glyph), `Unknown glyph "${def.glyph}" on ${def.id}`);
  assert.ok(![`.`, `!`, `؟`, `:`].some((p) => def.title.endsWith(p)), `Trailing punctuation on title: ${def.title}`);
  assert.ok([1, 2, 3].includes(def.difficulty), `Invalid difficulty on ${def.id}`);
}
console.log(`✓ Validated ${MAIN_ACHIEVEMENTS.length} MAIN_ACHIEVEMENTS definitions and glyphs.`);

// ─── 2. Player-Legal Simulation Harness ─────────────────────────────────────
type OptionScorer = (state: GameState, opt: EventOption) => number;
type TurnPolicy = (state: GameState, draft: TurnDirectives) => TurnDirectives;

interface SimTrace {
  seed: number;
  finalState: GameState;
  unlocked: Set<string>;
  unlockTurn: Record<string, number>;
  avgRealWageUSD: number;
  minCivicTrust: number;
  totalPrintedSYP: number;
  maxReservesUSD: number;
  maxTrust: number;
  minCorruption: number;
  maxPC: number;
}

const SEEDS = [20241208, 1001, 2002, 3003, 4004, 5005, 6006, 7007];

function defaultSafeOptionScorer(state: GameState, opt: EventOption): number {
  const fxCost = opt.costUSD ?? 0;
  if (state.macro.reservesUSD - fxCost < 90_000_000) return -10_000 - fxCost;
  return (
    (opt.effectTrust ?? 0) * 8 +
    (opt.effectPoliticalCapital ?? 0) * 2 -
    (opt.effectCorruption ?? 0) * 6 -
    (opt.effectRRI ?? 0) * 5 -
    fxCost / 8_000_000 -
    (opt.costPoliticalCapital ?? 0) * 1.5
  );
}

function runLegalBot(
  seed: number,
  policy: TurnPolicy,
  optionScorer: OptionScorer = defaultSafeOptionScorer
): SimTrace {
  let state = createInitialGameState(seed);
  state.runMeta = createInitialRunMeta(state, 1_763_316_000_000);
  let draft = getDefaultTurnDirectives();
  let lifetimeTurns = 0;

  const unlocked = new Set<string>();
  const unlockTurn: Record<string, number> = {};
  let maxReservesUSD = state.macro.reservesUSD;
  let maxTrust = state.macro.civicTrust;
  let minCorruption = state.macro.systemicCorruption;
  let maxPC = state.macro.politicalCapital;

  const recordEval = (prev: GameState | null, next: GameState) => {
    maxReservesUSD = Math.max(maxReservesUSD, next.macro.reservesUSD);
    maxTrust = Math.max(maxTrust, next.macro.civicTrust);
    minCorruption = Math.min(minCorruption, next.macro.systemicCorruption);
    maxPC = Math.max(maxPC, next.macro.politicalCapital);

    const stats = toMainRunStats(next.runMeta!, lifetimeTurns, next);
    for (const id of evaluateMainAchievements(prev, next, stats)) {
      if (!unlocked.has(id)) {
        unlocked.add(id);
        unlockTurn[id] = Math.min(next.turnNumber, 40);
      }
    }
  };

  while (!state.isGameOver) {
    // Resolve active crisis events legally first (same order as UI / gameStore)
    while (state.activeEvents.length > 0 && !state.isGameOver) {
      const ev = state.activeEvents[0];
      const affordable = ev.options.filter((o) => canAffordEventOption(state, o).ok);
      const prev = state;
      const next = cloneGameState(state);
      if (affordable.length > 0) {
        affordable.sort((a, b) => optionScorer(state, b) - optionScorer(state, a));
        resolveEventOption(next, ev.id, affordable[0].id);
      } else {
        applyUnresolvedCrisisPenalty(next, ev.id);
      }
      const fc = checkFailStates(next);
      if (fc.isFailed) {
        next.isGameOver = true;
        next.failState = fc;
      }
      state = next;
      state.runMeta = advanceRunMetaOnTransition(prev, state, false);
      recordEval(prev, state);
    }
    if (state.isGameOver) break;

    const chosen = policy(state, advanceDraftLikeStore(draft));
    validatePlayerLegalDirectives(state, chosen);

    const prev = state;
    const next = executeTurnLifecycle(state, chosen);
    lifetimeTurns += 1;
    next.runMeta = advanceRunMetaOnTransition(prev, next, true);
    state = next;
    draft = chosen;
    recordEval(prev, state);
  }

  const finalStats = toMainRunStats(state.runMeta!, lifetimeTurns, state);
  return {
    seed,
    finalState: state,
    unlocked,
    unlockTurn,
    avgRealWageUSD: finalStats.avgRealWageUSD,
    minCivicTrust: finalStats.minCivicTrust,
    totalPrintedSYP: finalStats.totalPrintedSYP,
    maxReservesUSD,
    maxTrust,
    minCorruption,
    maxPC,
  };
}

// Helper: add one-time or periodic decrees while respecting PC budget
function tryAddAction(state: GameState, d: TurnDirectives, id: string, oneTime = true): void {
  if (d.activePoliticalActions.includes(id)) return;
  if (oneTime && state.enactedDecrees?.includes(id)) return;
  const candidate = { ...d, activePoliticalActions: [...d.activePoliticalActions, id] };
  const b = calculateTurnBudget(state, candidate);
  if (b.remainingPC >= 0 && b.remainingUSD >= 0) {
    d.activePoliticalActions = candidate.activePoliticalActions;
  }
}

// Helper: base thriving reform directives
function buildReformBase(state: GameState, baseDraft: TurnDirectives, capex = 50_000_000): TurnDirectives {
  const d: TurnDirectives = {
    ...baseDraft,
    corporateTaxRate: 24,
    telecomExciseRate: 18,
    nassibTransitFeeUSD: 650,
    remittanceCaptureSpread: 7,
    foodSubsidyLevel: 'STANDARD',
    wheatProcurement: 'PREMIUM_INCENTIVE',
    workforceStrategy: 'MAINTAIN',
    dieselSmuggling: 'CRACKDOWN',
    golanBorderStance: 'UN_LIAISON',
    southernPolicy:
      (state.governorates['as_suwayda']?.suwaydaIntegrationIndex ?? 0) < 85
        ? 'HISTORIC_ACCORD'
        : 'LOCAL_VOUCHERS',
    propertyRestitution: 'RESTITUTE_TO_REFUGEES',
    gridCapExUSD: state.macro.reservesUSD > 300_000_000 ? capex : 20_000_000,
    wageBumpPercent: 0,
    moneyPrintingSYP: 0,
    dollarAuctionUSD: 0,
    activePoliticalActions: [],
  };

  tryAddAction(state, d, 'CABINET_HEARING', false);
  tryAddAction(state, d, 'UNITY_SPEECH', true);
  tryAddAction(state, d, 'OPPOSITION_SEATS', true);
  tryAddAction(state, d, 'REPUDIATE_IRAN_INFORMAL', true);
  tryAddAction(state, d, 'ANTI_CORRUPTION_COMMISSION', true);
  tryAddAction(state, d, 'PROPERTY_RESTITUTION_PORTAL', true);
  tryAddAction(state, d, 'TRIBAL_CUSTOMS_COUNCIL', true);
  if (state.macro.systemicCorruption > 0) {
    tryAddAction(state, d, 'SMUGGLING_BORDER_SWEEP', false);
  }

  // Settle confiscated assets from Turn 3 onward for clean FX + PC
  if (state.turnNumber >= 3) {
    for (const asset of state.confiscatedAssets) {
      if (asset.status === 'PENDING') {
        const nextDecisions = { ...d.oligarchDecisions, [asset.id]: 'SETTLEMENT_80_20' as const };
        const cand = { ...d, oligarchDecisions: nextDecisions };
        const b = calculateTurnBudget(state, cand);
        if (b.remainingPC >= 0 && b.remainingUSD >= 0) {
          d.oligarchDecisions = nextDecisions;
          break;
        }
      }
    }
  }

  // Pick a province needing power boost or demining if affordable
  const boostCand = Object.values(state.governorates)
    .filter((g) => g.dailyBlackoutHours > 2)
    .sort((a, b) => a.reconstructionScore - b.reconstructionScore)[0];
  if (boostCand && state.macro.reservesUSD > 260_000_000) {
    const cand = { ...d, powerBoostGovId: boostCand.id };
    if (calculateTurnBudget(state, cand).remainingUSD >= 120_000_000) {
      d.powerBoostGovId = boostCand.id;
    }
  }

  const demineCand = Object.values(state.governorates)
    .filter((g) => g.mineSaturationPct > 5)
    .sort((a, b) => b.mineSaturationPct - a.mineSaturationPct)[0];
  if (demineCand && state.macro.reservesUSD > 280_000_000) {
    const cand = { ...d, deminingPriorityId: demineCand.id };
    if (calculateTurnBudget(state, cand).remainingUSD >= 120_000_000) {
      d.deminingPriorityId = demineCand.id;
    }
  }

  return d;
}

// Helper: queue affordable strategic projects
function queueAffordableProjects(state: GameState, d: TurnDirectives, maxCount = 2): void {
  const unexecuted = Object.values(state.governorates)
    .map((g) => g.strategicProject)
    .filter((p): p is NonNullable<typeof p> => Boolean(p && !p.isExecuted))
    .sort((a, b) => a.costUSD - b.costUSD);

  for (const proj of unexecuted) {
    if (d.provincialProjects.length >= maxCount) break;
    const grantAvail = state.macro.grantBucketUSD ?? 0;
    const fxNeeded = Math.max(0, proj.costUSD - grantAvail);
    if (
      !canAffordDirectiveCost(
        state.macro.reservesUSD,
        state.macro.treasurySYP,
        fxNeeded,
        proj.costSYP,
        state.macro.parallelRateSYP
      )
    ) {
      continue;
    }
    const cand = { ...d, provincialProjects: [...d.provincialProjects, proj.id] };
    const b = calculateTurnBudget(state, cand);
    if (b.remainingPC >= 0 && b.remainingUSD >= 120_000_000) {
      try {
        validatePlayerLegalDirectives(state, cand);
        d.provincialProjects = cand.provincialProjects;
      } catch {
        // Skip if combined grant/SYP coverage gate blocks stacking this turn
      }
    }
  }
}

// ─── 3. Dedicated Greedy Policy Bots for All 14 Special Achievements ────────

// Bot A: Golden Sovereign Phoenix + Unbroken Trust + Power 24h + Corruption 0 + Trust 100 + All Calm
function goldenPhoenixPolicy(state: GameState, baseDraft: TurnDirectives): TurnDirectives {
  const d = buildReformBase(state, baseDraft, 80_000_000);
  const b0 = calculateTurnBudget(state, d);
  if (canSignFacility(state, 'facility_gulf_grant', b0.remainingPC).ok && state.macro.reservesUSD > 250_000_000) {
    const cand = { ...d, signedFacilityIds: ['facility_gulf_grant'] };
    if (calculateTurnBudget(state, cand).remainingPC >= 0) {
      d.signedFacilityIds = ['facility_gulf_grant'];
    }
  }
  if (state.macro.civicTrust >= 52) {
    tryAddAction(state, d, 'REPUDIATE_IRAN_FORMAL', true);
  }
  queueAffordableProjects(state, d, 2);
  if (calculateTurnBudget(state, d).remainingUSD < 100_000_000) {
    d.gridCapExUSD = 20_000_000;
  }
  return d;
}

// Bot B: Swiss Wages (> $10,000 average real monthly wage over completed 40-turn run)
function swissWagePolicy(state: GameState, baseDraft: TurnDirectives): TurnDirectives {
  const d = buildReformBase(state, baseDraft, 35_000_000);
  if (state.macro.civicTrust >= 50) {
    tryAddAction(state, d, 'REPUDIATE_IRAN_FORMAL', true);
  }
  const currentRealWage = calculateRealWageUSD(
    state.macro.civilServiceWageSYP,
    state.macro.parallelRateSYP
  );
  d.wageBumpPercent = currentRealWage < 28_000 ? 40 : 0;
  return d;
}

// Bot C: $2.5B Reserves Hoarder + Max Political Capital (200)
function reservesAndMaxPcPolicy(state: GameState, baseDraft: TurnDirectives): TurnDirectives {
  const suwaydaDone = (state.governorates['as_suwayda']?.suwaydaIntegrationIndex ?? 0) >= 85;
  const d: TurnDirectives = {
    ...baseDraft,
    corporateTaxRate: 25,
    telecomExciseRate: 18,
    nassibTransitFeeUSD: 800,
    remittanceCaptureSpread: 5,
    foodSubsidyLevel: 'STANDARD',
    wheatProcurement: 'PREMIUM_INCENTIVE',
    workforceStrategy: 'MAINTAIN',
    dieselSmuggling: state.turnNumber <= 6 ? 'CRACKDOWN' : 'STANDARD',
    golanBorderStance: 'RESTRAINT',
    southernPolicy: suwaydaDone ? 'LOCAL_VOUCHERS' : 'HISTORIC_ACCORD',
    propertyRestitution: 'RESTITUTE_TO_REFUGEES',
    gridCapExUSD: 35_000_000,
    wageBumpPercent: 0,
    moneyPrintingSYP: 0,
    dollarAuctionUSD: 0,
    activePoliticalActions: ['CABINET_HEARING'],
  };

  if (state.turnNumber === 1) {
    for (const facId of ['facility_imf_stabilization', 'facility_gulf_grant']) {
      const b = calculateTurnBudget(state, d);
      if (canSignFacility(state, facId, b.remainingPC).ok) {
        const cand = { ...d, signedFacilityIds: [...d.signedFacilityIds, facId] };
        if (calculateTurnBudget(state, cand).remainingPC >= 0) {
          d.signedFacilityIds = cand.signedFacilityIds;
        }
      }
    }
  }
  if (state.turnNumber === 2) {
    for (const id of ['UNITY_SPEECH', 'OPPOSITION_SEATS', 'REPUDIATE_IRAN_INFORMAL']) {
      tryAddAction(state, d, id, true);
    }
  }
  if (state.turnNumber === 5) {
    tryAddAction(state, d, 'REPUDIATE_IRAN_FORMAL', true);
    tryAddAction(state, d, 'REPUDIATE_RUSSIA', true);
    tryAddAction(state, d, 'REPUDIATE_PARIS', true);
  }
  if (state.turnNumber >= 3) {
    const pending = state.confiscatedAssets.find((a) => a.status === 'PENDING');
    if (pending) {
      d.oligarchDecisions = { [pending.id]: 'NATIONALIZE_SOE' };
    }
  }
  if (state.macro.politicalCapital < 200) {
    for (const key of ['charityFund', 'populistGrant'] as const) {
      const cand = { ...d, [key]: true };
      try {
        validatePlayerLegalDirectives(state, cand);
        d[key] = true;
      } catch {
        // Skip if SYP/FX backing insufficient this turn
      }
    }
  }
  return d;
}

// Bot D: All 14 Strategic Projects Master Builder
function allProjectsPolicy(state: GameState, baseDraft: TurnDirectives): TurnDirectives {
  const suwaydaDone = (state.governorates['as_suwayda']?.suwaydaIntegrationIndex ?? 0) >= 85;
  const d: TurnDirectives = {
    ...baseDraft,
    corporateTaxRate: 24,
    telecomExciseRate: 18,
    nassibTransitFeeUSD: 750,
    remittanceCaptureSpread: 6,
    foodSubsidyLevel: 'STANDARD',
    wheatProcurement: 'PREMIUM_INCENTIVE',
    workforceStrategy: 'MAINTAIN',
    dieselSmuggling: state.turnNumber <= 6 ? 'CRACKDOWN' : 'STANDARD',
    golanBorderStance: 'RESTRAINT',
    southernPolicy: suwaydaDone ? 'LOCAL_VOUCHERS' : 'HISTORIC_ACCORD',
    propertyRestitution: 'RESTITUTE_TO_REFUGEES',
    gridCapExUSD: 20_000_000,
    wageBumpPercent: 0,
    moneyPrintingSYP: 0,
    dollarAuctionUSD: 0,
    activePoliticalActions: ['CABINET_HEARING'],
  };

  if (state.turnNumber === 1) {
    for (const facId of ['facility_imf_stabilization', 'facility_gulf_grant']) {
      const b = calculateTurnBudget(state, d);
      if (canSignFacility(state, facId, b.remainingPC).ok) {
        const cand = { ...d, signedFacilityIds: [...d.signedFacilityIds, facId] };
        if (calculateTurnBudget(state, cand).remainingPC >= 0) {
          d.signedFacilityIds = cand.signedFacilityIds;
        }
      }
    }
  }
  for (const id of ['UNITY_SPEECH', 'OPPOSITION_SEATS', 'REPUDIATE_IRAN_INFORMAL']) {
    tryAddAction(state, d, id, true);
  }
  if (state.turnNumber >= 3) {
    tryAddAction(state, d, 'REPUDIATE_IRAN_FORMAL', true);
    const pending = state.confiscatedAssets.find((a) => a.status === 'PENDING');
    if (pending) {
      d.oligarchDecisions = { [pending.id]: 'NATIONALIZE_SOE' };
    }
  }
  // Aggressively fund every remaining strategic project
  const unexecuted = Object.values(state.governorates)
    .map((g) => g.strategicProject)
    .filter((p): p is NonNullable<typeof p> => Boolean(p && !p.isExecuted))
    .sort((a, b) => a.costUSD - b.costUSD);
  for (const proj of unexecuted) {
    const cand = { ...d, provincialProjects: [...d.provincialProjects, proj.id] };
    const b = calculateTurnBudget(state, cand);
    if (b.remainingPC >= 0 && b.remainingUSD >= 60_000_000) {
      try {
        validatePlayerLegalDirectives(state, cand);
        d.provincialProjects = cand.provincialProjects;
      } catch {
        // Wait until treasury/FX covers SYP+USD cost
      }
    }
  }
  return d;
}

// Bot E: Ghost State (Headcount <= 25,000) + Zero Debt + Quad Repudiation Blitz on Turn 1
function ghostAndQuadRepudiationPolicy(state: GameState, baseDraft: TurnDirectives): TurnDirectives {
  const d: TurnDirectives = {
    ...baseDraft,
    corporateTaxRate: 22,
    telecomExciseRate: 15,
    nassibTransitFeeUSD: 650,
    remittanceCaptureSpread: 7,
    foodSubsidyLevel: 'STANDARD',
    wheatProcurement: 'PREMIUM_INCENTIVE',
    workforceStrategy:
      (state.macro.civilServiceHeadcount ?? 1_400_000) > 15_000 ? 'PRUNE_CIVIL_SERVICE' : 'MAINTAIN',
    dieselSmuggling: 'CRACKDOWN',
    golanBorderStance: 'UN_LIAISON',
    southernPolicy: 'HISTORIC_ACCORD',
    propertyRestitution: 'RESTITUTE_TO_REFUGEES',
    gridCapExUSD: 35_000_000,
    wageBumpPercent: 0,
    moneyPrintingSYP: 0,
    dollarAuctionUSD: 0,
    activePoliticalActions: ['CABINET_HEARING'],
  };

  if (state.turnNumber === 1) {
    d.activePoliticalActions = [
      'REPUDIATE_PARIS',
      'REPUDIATE_RUSSIA',
      'REPUDIATE_IRAN_FORMAL',
      'REPUDIATE_IRAN_INFORMAL',
      'CABINET_HEARING',
      'UNITY_SPEECH',
      'OPPOSITION_SEATS',
    ];
  } else if (state.turnNumber === 2) {
    for (const id of [
      'ANTI_CORRUPTION_COMMISSION',
      'PROPERTY_RESTITUTION_PORTAL',
      'TRIBAL_CUSTOMS_COUNCIL',
    ]) {
      tryAddAction(state, d, id, true);
    }
  }
  if (state.turnNumber >= 3) {
    const pending = state.confiscatedAssets.find((a) => a.status === 'PENDING');
    if (pending) {
      const cand = { ...d, oligarchDecisions: { [pending.id]: 'SETTLEMENT_80_20' as const } };
      if (calculateTurnBudget(state, cand).remainingPC >= 0) {
        d.oligarchDecisions = cand.oligarchDecisions;
      }
    }
  }
  return d;
}

// Bot F: Money Printer Survivor (>= 1,000,000,000,000 SYP printed across completed 40-turn run)
function moneyPrinterPolicy(state: GameState, baseDraft: TurnDirectives): TurnDirectives {
  const d = buildReformBase(state, baseDraft, 35_000_000);
  tryAddAction(state, d, 'REPUDIATE_IRAN_FORMAL', true);
  const realWage = calculateRealWageUSD(state.macro.civilServiceWageSYP, state.macro.parallelRateSYP);
  if (realWage < 35) {
    d.wageBumpPercent = 25;
  }
  const proj = calculateProjectedTurnSummary(state, d);
  const maxPrint = Math.max(
    50_000_000_000,
    Math.ceil((proj.deficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000
  );
  d.moneyPrintingSYP = Math.min(35_000_000_000, maxPrint);
  return d;
}

// ─── 4. Execute Across Seeds & Collect Reachability Proof ───────────────────
const SPECIAL_IDS = MAIN_ACHIEVEMENTS.filter((a) => a.group === 'special').map((a) => a.id);
const evidence = new Map<
  string,
  { bot: string; seedsPassed: number; sampleSeed: number; turn: number; detail: string }
>();

const BOTS: { name: string; fn: TurnPolicy; scorer?: OptionScorer }[] = [
  {
    name: 'goldenPhoenixPolicy',
    fn: goldenPhoenixPolicy,
    scorer: (st, opt) => {
      if (st.macro.civicTrust + (opt.effectTrust ?? 0) < 42) return -100_000;
      return defaultSafeOptionScorer(st, opt);
    },
  },
  { name: 'swissWagePolicy', fn: swissWagePolicy },
  {
    name: 'reservesAndMaxPcPolicy',
    fn: reservesAndMaxPcPolicy,
    scorer: (st, opt) => {
      if (st.macro.reservesUSD - (opt.costUSD ?? 0) < 90_000_000) return -10_000;
      return (
        (opt.effectPoliticalCapital ?? 0) * 12 -
        (opt.costPoliticalCapital ?? 0) * 12 +
        (st.macro.civicTrust < 65 ? (opt.effectTrust ?? 0) * 4 : 0) -
        (opt.effectRRI ?? 0) * 3
      );
    },
  },
  { name: 'allProjectsPolicy', fn: allProjectsPolicy },
  { name: 'ghostAndQuadRepudiationPolicy', fn: ghostAndQuadRepudiationPolicy },
  { name: 'moneyPrinterPolicy', fn: moneyPrinterPolicy },
];

for (const bot of BOTS) {
  const traces = SEEDS.map((seed) => runLegalBot(seed, bot.fn, bot.scorer));
  for (const id of SPECIAL_IDS) {
    const hits = traces.filter((t) => t.unlocked.has(id));
    if (hits.length === 0) continue;
    const prev = evidence.get(id);
    if (!prev || hits.length > prev.seedsPassed) {
      const sample = hits[0];
      const st = sample.finalState;
      let detail = '';
      switch (id) {
        case 'spec_wage_10k':
          detail = `avgRealWageUSD=$${Math.round(sample.avgRealWageUSD).toLocaleString('en-US')}`;
          break;
        case 'spec_reserves_2500m':
          detail = `maxReservesUSD=$${(sample.maxReservesUSD / 1e9).toFixed(2)}B`;
          break;
        case 'spec_trust_100':
          detail = `maxTrust=${sample.maxTrust}`;
          break;
        case 'spec_corruption_zero':
          detail = `minCorruption=${sample.minCorruption}`;
          break;
        case 'spec_power_24h':
          detail = `power=${st.macro.dailyPowerHours}h, grid=${st.macro.gridCapacityMW}MW`;
          break;
        case 'spec_all_calm':
          detail = `allCalm=true, finalRRI=${st.macro.nationalRRI}`;
          break;
        case 'spec_debt_zero':
          detail = `sovereignDebt=$${st.macro.sovereignDebtUSD}, iranOilDebt=$${st.macro.iranOilDebtUSD ?? 0}`;
          break;
        case 'spec_pc_max':
          detail = `maxPC=${sample.maxPC}`;
          break;
        case 'spec_all_projects':
          detail = `projects=${Object.values(st.governorates).filter((g) => g.strategicProject?.isExecuted).length}/14`;
          break;
        case 'spec_trust_unbroken':
          detail = `minCivicTrust=${sample.minCivicTrust}`;
          break;
        case 'spec_perfect_phoenix':
          detail = `ending=${st.centuryEnding?.id}, finalScore=${st.centuryEnding?.finalScore}, suwaydaInt=${st.governorates['as_suwayda']?.suwaydaIntegrationIndex}`;
          break;
        case 'spec_ghost_state':
          detail = `headcount=${st.macro.civilServiceHeadcount}`;
          break;
        case 'spec_money_printer':
          detail = `totalPrintedSYP=${(sample.totalPrintedSYP / 1e12).toFixed(2)}T`;
          break;
        case 'spec_quad_repudiation':
          detail = `quadRepudiationInOneTurn=true, completed=${Boolean(st.centuryEnding)}`;
          break;
      }
      evidence.set(id, {
        bot: bot.name,
        seedsPassed: hits.length,
        sampleSeed: sample.seed,
        turn: sample.unlockTurn[id] ?? 40,
        detail,
      });
    }
  }
}

console.log('\n─── Special Achievements Player-Legal Reachability Summary ───');
const missing: string[] = [];
for (const id of SPECIAL_IDS) {
  const ev = evidence.get(id);
  if (!ev) {
    missing.push(id);
    console.error(`✗ UNREACHED: ${id}`);
  } else {
    console.log(
      `✓ ${id.padEnd(24)} | ${ev.seedsPassed}/${SEEDS.length} seeds | bot=${ev.bot} | seed=${ev.sampleSeed} T${ev.turn} | ${ev.detail}`
    );
  }
}

assert.equal(
  missing.length,
  0,
  `Every special achievement must be reachable under player-legal rules; missing: ${missing.join(', ')}`
);
console.log(`\n✓ All ${SPECIAL_IDS.length} special achievements proven reachable under strict UI-legal play.`);

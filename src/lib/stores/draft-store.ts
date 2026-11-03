import { writable, derived } from 'svelte/store';
import type { TurnDirectives, OligarchPolicyAction, GameState, ProjectedTurnSummary } from '../engine/types';
import {
  getDefaultTurnDirectives,
  evaluateRehearsalDirectives,
  calculateProjectedTurnSummary,
} from '../engine/turn-manager';
import { gameStore } from './game-store';
import {
  getOligarchSettlementIncome,
  getOligarchLiquidationIncome,
  getOligarchSettlementPCCost,
  getOligarchLiquidationPCCost,
  getOligarchNationalizePCEarned,
} from '../engine/oligarch-helpers';
import {
  POPULIST_GRANT_COST_SYP,
  CHARITY_FUND_COST_SYP,
  IMPORT_SURGE_COST_USD,
  LOAN_TERMINATION_PC_EARNED,
} from '../engine/revenues';
import {
  getFacilityDef,
  activeFacilityLocks,
  computeFacilityTurn,
  facilityBreached,
} from '../engine/facilities';
import { BASELINE_MACRO } from '../engine/constants';

export interface TurnBudget {
  initialPC: number;
  initialUSD: number;
  initialSYP: number;

  committedPC: number;
  committedUSD: number;
  committedSYP: number;

  remainingPC: number;
  /** Signed: negative means the draft over-commits reserves (over-budget). */
  remainingUSD: number;
  remainingSYP: number;

  /** Largest voluntary early repayment the engine can actually pay this turn. */
  maxDebtRepaymentUSD: number;
  /** Ring-fenced grant dollars still available for further project USD costs. */
  grantAvailableUSD: number;

  usdNeededToCoverSYP: (costSYP: number) => number;
  canAffordWithFxCoverage: (costUSD: number, costSYP: number) => boolean;
  isCoveredByFX: (costUSD: number, costSYP: number) => boolean;
}

export function calculateTurnBudget(gameState: GameState, draft: TurnDirectives): TurnBudget {
  const initialPC = gameState.macro.politicalCapital;
  const initialSYP = gameState.macro.treasurySYP;

  // Same-turn hard-currency inflows the engine credits BEFORE it spends
  // (Phase 2 loan/mortgage/oligarch cash, plus general facility tranches that
  // reach reserves through the audit). Without these the UI blocked perfectly
  // affordable plans — e.g. signing the IMF loan and then funding a project.
  let sameTurnInflowUSD = 0;

  // Loans that will actually be signed this turn (Paris repudiation shuts the
  // western/Gulf windows in PHASE 2 — mirror that gate or the preview promises
  // money the commit never disburses).
  for (const loanId of draft.signedLoanIds ?? []) {
    const loan = gameState.foreignLoans.find((l) => l.id === loanId);
    if (!loan || loan.isSigned) continue;
    if (
      gameState.flags?.Debt_Repudiated_Paris === 1 &&
      (loanId === 'loan_imf_wb' || loanId === 'loan_gulf_swf')
    ) {
      continue;
    }
    sameTurnInflowUSD += loan.disbursementUSD;
  }

  // Emergency mortgages not yet executed.
  for (const mortgageId of draft.executedMortgageIds ?? []) {
    const mort = gameState.sovereignMortgages?.find((m) => m.id === mortgageId);
    if (mort && !mort.isMortgaged) sameTurnInflowUSD += mort.immediateCashUSD;
  }

  // Oligarch settlements / liquidations credit reserves in PHASE 1.
  if (draft.oligarchDecisions) {
    for (const [assetId, action] of Object.entries(draft.oligarchDecisions)) {
      const asset = gameState.confiscatedAssets.find((a) => a.id === assetId);
      if (!asset || asset.status !== 'PENDING') continue;
      if (action === 'SETTLEMENT_80_20') sameTurnInflowUSD += getOligarchSettlementIncome(asset.valuationUSD);
      else if (action === 'FOREIGN_LIQUIDATION') sameTurnInflowUSD += getOligarchLiquidationIncome(asset.valuationUSD);
    }
  }

  // Concessional facilities: general tranches reach reserves; the ring-fenced
  // share is project-only money and does not inflate cash. New ring-fenced
  // tranches land AFTER project execution (applyFacilityTurn runs post-audit),
  // so only the already-banked bucket can fund projects this turn.
  const facilityTurn = computeFacilityTurn(gameState, draft);
  sameTurnInflowUSD += Math.max(0, facilityTurn.inflowUSD - facilityTurn.ringFencedUSD);
  let grantAvailableUSD = gameState.macro.grantBucketUSD ?? 0;

  const initialUSD = gameState.macro.reservesUSD + sameTurnInflowUSD;

  let committedPC = 0;
  let committedUSD = 0;
  let committedSYP = 0;

  // 1. Provincial Projects (ring-fenced grant dollars pay the USD leg first)
  for (const projId of draft.provincialProjects || []) {
    for (const gov of Object.values(gameState.governorates)) {
      if (gov.strategicProject && gov.strategicProject.id === projId) {
        committedPC += gov.strategicProject.costPoliticalCapital;
        const grantCover = Math.min(grantAvailableUSD, gov.strategicProject.costUSD);
        grantAvailableUSD -= grantCover;
        committedUSD += gov.strategicProject.costUSD - grantCover;
        committedSYP += gov.strategicProject.costSYP;
        break;
      }
    }
  }

  // 2. Demining Priority
  if (draft.deminingPriorityId) {
    const gov = gameState.governorates[draft.deminingPriorityId];
    if (gov && gov.mineSaturationPct > 8) {
      committedUSD += 20_000_000;
      committedSYP += 8_000_000_000;
    }
  }

  // 3. Power Supply Boost
  if (draft.powerBoostGovId) {
    const gov = gameState.governorates[draft.powerBoostGovId];
    if (gov && gov.dailyBlackoutHours > 2) {
      committedUSD += 10_000_000;
      committedSYP += 3_000_000_000;
    }
  }

  // 4. Decrees and Political Actions
  for (const actId of draft.activePoliticalActions || []) {
    if (gameState.enactedDecrees?.includes(actId)) continue;
    if (actId === 'ANTI_CORRUPTION_COMMISSION') committedPC += 15;
    else if (actId === 'PROPERTY_RESTITUTION_PORTAL') committedPC += 10;
    else if (actId === 'SMUGGLING_BORDER_SWEEP') committedPC += 12;
    else if (actId === 'TRIBAL_CUSTOMS_COUNCIL') committedPC += 8;
    else if (actId === 'CABINET_HEARING') committedPC -= 8;
    else if (actId === 'UNITY_SPEECH') committedPC -= 4;
    else if (actId === 'OPPOSITION_SEATS') committedPC -= 18;
    else if (actId === 'REPUDIATE_IRAN_INFORMAL') committedPC -= 6;
    else if (actId === 'REPUDIATE_IRAN_FORMAL') committedPC -= 12;
    else if (actId === 'REPUDIATE_RUSSIA') committedPC -= 10;
    else if (actId === 'REPUDIATE_PARIS') committedPC -= 8;
  }

  // 4b. Historic Accord upkeep (shuttle diplomacy; falls back to vouchers if broke)
  if (draft.southernPolicy === 'HISTORIC_ACCORD') {
    committedPC += 4;
  }

  // 5. Oligarch Decisions
  if (draft.oligarchDecisions) {
    for (const [assetId, action] of Object.entries(draft.oligarchDecisions)) {
      const asset = gameState.confiscatedAssets.find((a) => a.id === assetId);
      if (asset && asset.status === 'PENDING') {
        if (action === 'SETTLEMENT_80_20') committedPC += getOligarchSettlementPCCost(asset.valuationUSD);
        else if (action === 'FOREIGN_LIQUIDATION') committedPC += getOligarchLiquidationPCCost(asset.valuationUSD);
        else if (action === 'NATIONALIZE_SOE') committedPC -= getOligarchNationalizePCEarned(asset.valuationUSD);
      }
    }
  }

  // 6. Foreign Loans (Political Capital commitments)
  // Mirrors PHASE 2: Paris repudiation shuts the IMF/World Bank and Gulf
  // windows entirely, so no PC is ever charged for them.
  if (draft.signedLoanIds && draft.signedLoanIds.length > 0) {
    for (const loanId of draft.signedLoanIds) {
      const loan = gameState.foreignLoans.find((l) => l.id === loanId);
      if (!loan || loan.isSigned) continue;
      if (
        gameState.flags?.Debt_Repudiated_Paris === 1 &&
        (loanId === 'loan_imf_wb' || loanId === 'loan_gulf_swf')
      ) {
        continue;
      }
      committedPC += loan.politicalCapitalCost;
    }
  }

  // 6b. Concessional facilities (Political Capital commitments)
  // A facility whose condition is already breached this turn is refused by
  // applyFacilityTurn, so it must not reserve PC in the budget either.
  if (draft.signedFacilityIds && draft.signedFacilityIds.length > 0) {
    for (const facilityId of draft.signedFacilityIds) {
      const def = getFacilityDef(facilityId);
      const existing = gameState.facilities?.find((f) => f.id === facilityId);
      if (def && (!existing || existing.status === 'AVAILABLE')) {
        if (facilityBreached(gameState, draft, facilityId)) continue;
        committedPC += def.politicalCapitalCost;
      }
    }
  }

  // 7. Expatriate Brain-Gain
  if (draft.expatriateBrainGainIncentive) {
    committedUSD += 20_000_000;
    committedSYP += 3_500_000_000;
  }

  // 7b. Populist patronage (SYP/FX spent to buy political capital)
  if (draft.populistGrant) {
    committedSYP += POPULIST_GRANT_COST_SYP;
    committedPC -= 8;
  }
  if (draft.charityFundActive) {
    committedSYP += CHARITY_FUND_COST_SYP;
    committedPC -= 3;
  }
  if (draft.importSurge) {
    committedUSD += IMPORT_SURGE_COST_USD;
    committedPC -= 6;
  }
  if (draft.terminatedLoanIds && draft.terminatedLoanIds.length > 0) {
    let availUSD = Math.max(0, initialUSD);
    for (const id of draft.terminatedLoanIds) {
      const loan = gameState.foreignLoans.find((l) => l.id === id);
      if (!loan || !loan.isSigned) continue;
      const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
      if (remaining <= 0 || availUSD < remaining) continue;
      committedUSD += remaining;
      committedPC -= LOAN_TERMINATION_PC_EARNED;
      availUSD -= remaining;
    }
  }

  // 8. Grid CapEx
  committedUSD += draft.gridCapExUSD || 0;

  // 8b. UNDOF liaison mission
  if (draft.golanBorderStance === 'UN_LIAISON') {
    committedUSD += 8_000_000;
  }

  // 8c. Golan armored deployment (audit's golanDrainSYP)
  if (draft.golanBorderStance === 'DEPLOY_ARMOR') {
    committedSYP += 9_000_000_000;
  }

  // 9. Central Bank Dollar Auction
  committedUSD += draft.dollarAuctionUSD || 0;

  // 9b. Voluntary early debt repayment. The engine pays it from reserves left
  // after terminations and other outlays, so clamp the commitment to the same
  // envelope; the panel reads maxDebtRepaymentUSD back for its slider.
  const signedPrincipalUSD = gameState.foreignLoans
    .filter((l) => l.isSigned)
    .reduce((sum, l) => sum + (l.remainingPrincipalUSD ?? l.disbursementUSD), 0);
  const maxDebtRepaymentUSD = Math.max(
    0,
    Math.min(signedPrincipalUSD, initialUSD - committedUSD)
  );
  committedUSD += Math.min(Math.max(0, draft.extraDebtRepaymentUSD ?? 0), maxDebtRepaymentUSD);

  // Kept signed for validation (over-budget must be detectable); only the
  // display layer clamps these to zero.
  const remainingPC = Math.min(200, initialPC - committedPC);
  const remainingUSD = initialUSD - committedUSD;
  const remainingSYP = initialSYP - committedSYP;

  const parallelRate = Math.max(
    1,
    gameState.macro.parallelRateSYP || BASELINE_MACRO.parallelRateSYP
  );

  const usdNeededToCoverSYP = (costSYP: number): number => {
    // Mirrors canAffordDirectiveCost: only the new cost needs FX backing,
    // not the accumulated overdraft.
    const sypShortfall = Math.max(0, costSYP - Math.max(0, remainingSYP));
    return sypShortfall / parallelRate;
  };

  const canAffordWithFxCoverage = (costUSD: number, costSYP: number): boolean => {
    const extraUSD = usdNeededToCoverSYP(costSYP);
    return remainingUSD >= (costUSD + extraUSD);
  };

  const isCoveredByFX = (costUSD: number, costSYP: number): boolean => {
    return costSYP > remainingSYP && canAffordWithFxCoverage(costUSD, costSYP);
  };

  return {
    initialPC,
    initialUSD,
    initialSYP,
    committedPC,
    committedUSD,
    committedSYP,
    remainingPC,
    remainingUSD,
    remainingSYP,
    maxDebtRepaymentUSD,
    grantAvailableUSD,
    usdNeededToCoverSYP,
    canAffordWithFxCoverage,
    isCoveredByFX,
  };
}

const DRAFT_STORAGE_KEY = 'syria_president_draft_v1';

/**
 * Decrees whose effect is a standing state (continuous toggle) or a per-turn
 * action the player can re-issue each turn. Everything else is a one-time
 * intent that must not survive a reload or a committed turn looking pre-set.
 * Engine mirror: `ONE_TIME_DECREES` in turn-manager PHASE 0.
 */
const PERSISTENT_POLITICAL_ACTIONS = [
  'MARTIAL_LAW',
  'SMUGGLING_BORDER_SWEEP',
  'CABINET_HEARING',
];

/**
 * Normalise a parsed draft payload: backfill new fields, then drop every
 * one-shot intent that must not survive a reload looking pre-selected while
 * keeping continuous/periodic decisions. Exported for the regression script.
 */
export function normalizeStoredDraft(parsed: Partial<TurnDirectives>): TurnDirectives {
  const normalized = { ...getDefaultTurnDirectives(), ...parsed } as TurnDirectives;
  normalized.activePoliticalActions = (normalized.activePoliticalActions || []).filter((a) =>
    PERSISTENT_POLITICAL_ACTIONS.includes(a)
  );
  normalized.populistGrant = false;
  normalized.importSurge = false;
  normalized.terminatedLoanIds = [];
  normalized.extraDebtRepaymentUSD = 0;
  normalized.dollarAuctionUSD = 0;
  normalized.deminingPriorityId = null;
  normalized.powerBoostGovId = null;
  return normalized;
}

function loadStoredDraft(): TurnDirectives {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return normalizeStoredDraft(JSON.parse(saved));
      }
    }
  } catch (e) {
    // Corrupt JSON, a partial write, or blocked storage (SecurityError in
    // sandboxed/private contexts) must fall back to a fresh draft, never
    // abort store initialisation.
    console.error('Failed to load saved draft:', e);
  }
  return getDefaultTurnDirectives();
}

function persistDraft(draft: TurnDirectives): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
}

function createDraftStore() {
  const initial = loadStoredDraft();
  const { subscribe, set, update } = writable<TurnDirectives>(initial);

  if (typeof window !== 'undefined') {
    subscribe((draft) => {
      persistDraft(draft);
    });
  }

  return {
    subscribe,
    setField: <K extends keyof TurnDirectives>(field: K, value: TurnDirectives[K]) => {
      update((d) => ({ ...d, [field]: value }));
    },
    /**
     * Facility-conditionality locks live here (not just in the UI) so no
     * panel can silently break a signed condition: while the IMF diesel
     * lock is active, dieselSmuggling is forced to CRACKDOWN.
     */
    setFieldGuarded: <K extends keyof TurnDirectives>(
      game: GameState | null,
      field: K,
      value: TurnDirectives[K]
    ): { applied: boolean; blockedAr?: string } => {
      if (field === 'dieselSmuggling' && value !== 'CRACKDOWN' && game) {
        const locks = activeFacilityLocks(game);
        if (locks.dieselLocked) {
          update((d) => ({ ...d, dieselSmuggling: 'CRACKDOWN' }));
          return {
            applied: false,
            blockedAr: `مقفل بشرط التسهيل — ${locks.dieselTurnsLeft} دورات متبقية`,
          };
        }
      }
      update((d) => ({ ...d, [field]: value }));
      return { applied: true };
    },
    reset: () => {
      set(getDefaultTurnDirectives());
    },
    advanceToNextTurn: () => {
      update((d) => ({
        ...d,
        // Reset one-time executed financial asset transactions that already modified GameState:
        signedLoanIds: [],
        executedMortgageIds: [],
        signedFacilityIds: [],
        oligarchDecisions: {},
        provincialProjects: [],
        extraDebtRepaymentUSD: 0,
        populistGrant: false,
        importSurge: false,
        terminatedLoanIds: [],
        // One-shot per-turn FX/operational directives: a dollar auction, a
        // demining priority and a power-boost target are sized against THIS
        // turn's reserves and must never be charged again silently.
        dollarAuctionUSD: 0,
        deminingPriorityId: null,
        powerBoostGovId: null,
        // Retain continuous states (MARTIAL_LAW) and per-turn decisions the
        // player can re-issue (border sweep, cabinet hearing); strip one-time
        // decree intents that are now enacted law.
        activePoliticalActions: (d.activePoliticalActions || []).filter((a) =>
          PERSISTENT_POLITICAL_ACTIONS.includes(a)
        ),
        // Selected ongoing policies (subsidies, wages, tax rates, diesel smuggling, brain gain, charity fund) are preserved!
      }));
    },
    togglePoliticalAction: (action: string) => {
      update((d) => {
        const exists = d.activePoliticalActions.includes(action);
        const nextActions = exists
          ? d.activePoliticalActions.filter((a) => a !== action)
          : [...d.activePoliticalActions, action];
        return { ...d, activePoliticalActions: nextActions };
      });
    },
    toggleProvincialProject: (projectId: string) => {
      update((d) => {
        const current = d.provincialProjects || [];
        const exists = current.includes(projectId);
        const next = exists
          ? current.filter((id) => id !== projectId)
          : [...current, projectId];
        return { ...d, provincialProjects: next };
      });
    },
    setOligarchDecision: (assetId: string, action: OligarchPolicyAction) => {
      update((d) => ({
        ...d,
        oligarchDecisions: {
          ...d.oligarchDecisions,
          [assetId]: action,
        },
      }));
    },
    removeOligarchDecision: (assetId: string) => {
      update((d) => {
        const nextDecisions = { ...d.oligarchDecisions };
        delete nextDecisions[assetId];
        return {
          ...d,
          oligarchDecisions: nextDecisions,
        };
      });
    },
    toggleLoan: (loanId: string) => {
      update((d) => {
        const current = d.signedLoanIds || [];
        const exists = current.includes(loanId);
        const next = exists
          ? current.filter((id) => id !== loanId)
          : [...current, loanId];
        return { ...d, signedLoanIds: next };
      });
    },
    toggleLoanTermination: (loanId: string) => {
      update((d) => {
        const current = d.terminatedLoanIds || [];
        const exists = current.includes(loanId);
        const next = exists
          ? current.filter((id) => id !== loanId)
          : [...current, loanId];
        return { ...d, terminatedLoanIds: next };
      });
    },
    toggleMortgage: (mortgageId: string) => {
      update((d) => {
        const current = d.executedMortgageIds || [];
        const exists = current.includes(mortgageId);
        const next = exists
          ? current.filter((id) => id !== mortgageId)
          : [...current, mortgageId];
        return { ...d, executedMortgageIds: next };
      });
    },
    toggleFacility: (facilityId: string) => {
      update((d) => {
        const current = d.signedFacilityIds || [];
        const exists = current.includes(facilityId);
        const next = exists
          ? current.filter((id) => id !== facilityId)
          : [...current, facilityId];
        return { ...d, signedFacilityIds: next };
      });
    },
  };
}

export const draftStore = createDraftStore();

export const budgetStore = derived(
  [gameStore, draftStore],
  ([$game, $draft]) => calculateTurnBudget($game, $draft)
);

export const previewRangesStore = derived(
  [gameStore, draftStore],
  ([$game, $draft]) => evaluateRehearsalDirectives($game, $draft)
);

export const projectedTurnStore = derived(
  [gameStore, draftStore],
  ([$game, $draft]) => calculateProjectedTurnSummary($game, $draft)
);

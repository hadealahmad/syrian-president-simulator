import { writable, derived } from 'svelte/store';
import type { TurnDirectives, OligarchPolicyAction, GameState, ProjectedTurnSummary } from '../engine/types';
import {
  getDefaultTurnDirectives,
  evaluateRehearsalDirectives,
  calculateProjectedTurnSummary,
} from '../engine/turn-manager';
import { gameStore } from './game-store';
import {
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
import { getFacilityDef, activeFacilityLocks } from '../engine/facilities';

export interface TurnBudget {
  initialPC: number;
  initialUSD: number;
  initialSYP: number;

  committedPC: number;
  committedUSD: number;
  committedSYP: number;

  remainingPC: number;
  remainingUSD: number;
  remainingSYP: number;

  usdNeededToCoverSYP: (costSYP: number) => number;
  canAffordWithFxCoverage: (costUSD: number, costSYP: number) => boolean;
  isCoveredByFX: (costUSD: number, costSYP: number) => boolean;
}

export function calculateTurnBudget(gameState: GameState, draft: TurnDirectives): TurnBudget {
  const initialPC = gameState.macro.politicalCapital;
  const initialUSD = gameState.macro.reservesUSD;
  const initialSYP = gameState.macro.treasurySYP;

  let committedPC = 0;
  let committedUSD = 0;
  let committedSYP = 0;

  // 1. Provincial Projects
  for (const projId of draft.provincialProjects || []) {
    for (const gov of Object.values(gameState.governorates)) {
      if (gov.strategicProject && gov.strategicProject.id === projId) {
        committedPC += gov.strategicProject.costPoliticalCapital;
        committedUSD += gov.strategicProject.costUSD;
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
  if (draft.signedLoanIds && draft.signedLoanIds.length > 0) {
    for (const loanId of draft.signedLoanIds) {
      const loan = gameState.foreignLoans.find((l) => l.id === loanId);
      if (loan && !loan.isSigned) {
        committedPC += loan.politicalCapitalCost;
      }
    }
  }

  // 6b. Concessional facilities (Political Capital commitments)
  if (draft.signedFacilityIds && draft.signedFacilityIds.length > 0) {
    for (const facilityId of draft.signedFacilityIds) {
      const def = getFacilityDef(facilityId);
      const existing = gameState.facilities?.find((f) => f.id === facilityId);
      if (def && (!existing || existing.status === 'AVAILABLE')) {
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

  // 9. Central Bank Dollar Auction
  committedUSD += draft.dollarAuctionUSD || 0;

  const remainingPC = Math.max(0, Math.min(200, initialPC - committedPC));
  const remainingUSD = Math.max(0, initialUSD - committedUSD);
  const remainingSYP = initialSYP - committedSYP;

  const parallelRate = Math.max(1, gameState.macro.parallelRateSYP || 14000);

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
    usdNeededToCoverSYP,
    canAffordWithFxCoverage,
    isCoveredByFX,
  };
}

const DRAFT_STORAGE_KEY = 'syria_president_draft_v1';

function loadStoredDraft(): TurnDirectives {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Backfill fields added after the save was written so old drafts
        // never carry undefined directive keys into the engine or budget.
        const normalized = { ...getDefaultTurnDirectives(), ...parsed };
        // One-time decree intents must not survive a reload looking
        // pre-toggled; only the continuous martial-law state carries over.
        normalized.activePoliticalActions = (normalized.activePoliticalActions || []).filter(
          (a: string) => a === 'MARTIAL_LAW'
        );
        // One-shot patronage intents never survive a reload either.
        normalized.populistGrant = false;
        normalized.importSurge = false;
        normalized.terminatedLoanIds = [];
        return normalized;
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }
  }
  return getDefaultTurnDirectives();
}

function persistDraft(draft: TurnDirectives): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
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
        // Retain continuous states (MARTIAL_LAW) until lifted, reset one-time and periodic decrees:
        activePoliticalActions: (d.activePoliticalActions || []).filter((a) => a === 'MARTIAL_LAW'),
        // Selected ongoing policies (subsidies, wages, tax rates, diesel smuggling, demining, brain gain, charity fund) are preserved!
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

import { writable, derived } from 'svelte/store';
import type { TurnDirectives, OligarchPolicyAction, GameState, ProjectedTurnSummary } from '../engine/types';
import {
  getDefaultTurnDirectives,
  evaluateRehearsalDirectives,
  calculateProjectedTurnSummary,
} from '../engine/turn-manager';
import { gameStore } from './game-store';

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
      committedSYP += 800_000_000_000;
    }
  }

  // 3. Power Supply Boost
  if (draft.powerBoostGovId) {
    const gov = gameState.governorates[draft.powerBoostGovId];
    if (gov && gov.dailyBlackoutHours > 2) {
      committedUSD += 10_000_000;
      committedSYP += 300_000_000_000;
    }
  }

  // 4. Decrees and Political Actions
  for (const actId of draft.activePoliticalActions || []) {
    if (actId === 'ANTI_CORRUPTION_COMMISSION') committedPC += 15;
    else if (actId === 'PROPERTY_RESTITUTION_PORTAL') committedPC += 10;
    else if (actId === 'SMUGGLING_BORDER_SWEEP') committedPC += 12;
    else if (actId === 'TRIBAL_CUSTOMS_COUNCIL') committedPC += 8;
    else if (actId === 'CABINET_HEARING') committedPC -= 8;
    else if (actId === 'UNITY_SPEECH') committedPC -= 4;
    else if (actId === 'OPPOSITION_SEATS') committedPC -= 18;
  }

  // 5. Oligarch Decisions
  if (draft.oligarchDecisions) {
    for (const [assetId, action] of Object.entries(draft.oligarchDecisions)) {
      const asset = gameState.confiscatedAssets.find((a) => a.id === assetId);
      if (asset && asset.status === 'PENDING') {
        if (action === 'SETTLEMENT_80_20') committedPC += 8;
        else if (action === 'FOREIGN_LIQUIDATION') committedPC += 10;
        else if (action === 'NATIONALIZE_SOE') committedPC -= 5;
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

  // 7. Expatriate Brain-Gain
  if (draft.expatriateBrainGainIncentive) {
    committedUSD += 20_000_000;
    committedSYP += 350_000_000_000;
  }

  // 8. Grid CapEx
  committedUSD += draft.gridCapExUSD || 0;

  // 9. Central Bank Dollar Auction
  committedUSD += draft.dollarAuctionUSD || 0;

  const remainingPC = Math.max(0, initialPC - committedPC);
  const remainingUSD = Math.max(0, initialUSD - committedUSD);
  const remainingSYP = initialSYP - committedSYP;

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
  };
}

function createDraftStore() {
  const { subscribe, set, update } = writable<TurnDirectives>(getDefaultTurnDirectives());

  return {
    subscribe,
    setField: <K extends keyof TurnDirectives>(field: K, value: TurnDirectives[K]) => {
      update((d) => ({ ...d, [field]: value }));
    },
    reset: () => {
      set(getDefaultTurnDirectives());
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

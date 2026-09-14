import type { GameState } from './types';
import {
  BASELINE_MACRO,
  BASELINE_GOVERNORATES,
  BASELINE_MINISTRIES,
  BASELINE_COMMISSIONS,
  BASELINE_CONFISCATED_ASSETS,
  BASELINE_FOREIGN_LOANS,
  BASELINE_SOVEREIGN_MORTGAGES,
  INITIAL_YEAR,
} from './constants';

export function createInitialGameState(seed: number = 20241208): GameState {
  return {
    turnNumber: 1,
    calendarYear: INITIAL_YEAR,
    season: 'H1_HARVEST',
    seed,
    isGameOver: false,
    failState: null,
    centuryEnding: null,
    macro: { ...BASELINE_MACRO },
    governorates: JSON.parse(JSON.stringify(BASELINE_GOVERNORATES)),
    ministries: JSON.parse(JSON.stringify(BASELINE_MINISTRIES)),
    commissions: JSON.parse(JSON.stringify(BASELINE_COMMISSIONS)),
    confiscatedAssets: JSON.parse(JSON.stringify(BASELINE_CONFISCATED_ASSETS)),
    foreignLoans: JSON.parse(JSON.stringify(BASELINE_FOREIGN_LOANS)),
    sovereignMortgages: JSON.parse(JSON.stringify(BASELINE_SOVEREIGN_MORTGAGES)),
    flags: {
      Flag_Southern_Accord_Progress: 0,
      Flag_Bedouin_Restitution_Paid: 0,
      Flag_Port_Graft_Active: 1,
      Flag_Golan_Tension_Escalation: 0,
    },
    activeEvents: [],
    lastTurnAudit: null,
  };
}

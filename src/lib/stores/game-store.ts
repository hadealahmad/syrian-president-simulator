import { writable } from 'svelte/store';
import type { GameState, TurnDirectives } from '../engine/types';
import { createInitialGameState } from '../engine/baseline';
import { BASELINE_GOVERNORATES } from '../engine/constants';
import { executeTurnLifecycle } from '../engine/turn-manager';
import { resolveEventOption, applyUnresolvedCrisisPenalty } from '../engine/events';
import { checkFailStates } from '../engine/fail-states';

const STORAGE_KEY = 'president_game_state_v1';

function loadStoredGameState(): GameState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.turnNumber === 'number' &&
          parsed.macro &&
          parsed.governorates &&
          typeof parsed.isGameOver === 'boolean'
        ) {
          // Always ensure hex coordinates match the current baseline layout
          parsed.enactedDecrees = parsed.enactedDecrees || [];
          Object.keys(parsed.governorates).forEach((id) => {
            if (BASELINE_GOVERNORATES[id]) {
              parsed.governorates[id].hexQ = BASELINE_GOVERNORATES[id].hexQ;
              parsed.governorates[id].hexR = BASELINE_GOVERNORATES[id].hexR;
            }
          });
          return parsed as GameState;
        }
      }
    } catch (err) {
      console.warn('Could not load saved game state from localStorage:', err);
    }
  }
  return createInitialGameState();
}

function persistGameState(state: GameState): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save game state to localStorage:', err);
    }
  }
}

function createGameStore() {
  const initial = loadStoredGameState();
  const { subscribe, set, update } = writable<GameState>(initial);

  if (typeof window !== 'undefined') {
    subscribe((state) => {
      persistGameState(state);
    });
  }

  return {
    subscribe,
    commitTurn: (directives: TurnDirectives) => {
      update((current) => executeTurnLifecycle(current, directives));
    },
    chooseEventOption: (eventId: string, optionId: string) => {
      update((current) => {
        const cloned = structuredClone(current);
        resolveEventOption(cloned, eventId, optionId);
        const failCheck = checkFailStates(cloned);
        if (failCheck.isFailed) {
          cloned.isGameOver = true;
          cloned.failState = failCheck;
        }
        return cloned;
      });
    },
    triggerUnresolvedCrisisPenalty: (eventId: string) => {
      update((current) => {
        const cloned = structuredClone(current);
        applyUnresolvedCrisisPenalty(cloned, eventId);
        const failCheck = checkFailStates(cloned);
        if (failCheck.isFailed) {
          cloned.isGameOver = true;
          cloned.failState = failCheck;
        }
        return cloned;
      });
    },
    restart: (seed?: number) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.warn('Could not clear saved game from localStorage:', err);
        }
      }
      const fresh = createInitialGameState(seed);
      set(fresh);
    },
  };
}

export const gameStore = createGameStore();

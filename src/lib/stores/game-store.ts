import { writable } from 'svelte/store';
import type { GameState, TurnDirectives } from '../engine/types';
import { createInitialGameState } from '../engine/baseline';
import { BASELINE_GOVERNORATES } from '../engine/constants';
import { executeTurnLifecycle } from '../engine/turn-manager';
import { resolveEventOption, applyUnresolvedCrisisPenalty } from '../engine/events';
import { checkFailStates } from '../engine/fail-states';
import { cloneGameState } from '../engine/state-clone';

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
          // Backfill post-launch economy fields so old saves migrate cleanly
          parsed.facilities = parsed.facilities || [];
          parsed.macro.productiveCapacityPct = parsed.macro.productiveCapacityPct ?? 20;
          parsed.macro.grantBucketUSD = parsed.macro.grantBucketUSD ?? 0;
          parsed.macro.militiaAbsorptionBonus = parsed.macro.militiaAbsorptionBonus ?? 0;
          Object.keys(parsed.governorates).forEach((id) => {
            if (BASELINE_GOVERNORATES[id]) {
              parsed.governorates[id].hexQ = BASELINE_GOVERNORATES[id].hexQ;
              parsed.governorates[id].hexR = BASELINE_GOVERNORATES[id].hexR;
              // Backfill the optional indices the event decks apply. Saves
              // written before these fields existed left them undefined, which
              // made the corresponding authored effects no-ops.
              for (const key of [
                'tribalRageIndex',
                'golanTensionIndex',
                'daraaDefianceIndex',
                'nassibRevenueCapturePct',
                'suwaydaIntegrationIndex',
                'suwaydaSecessionProb',
              ] as const) {
                const baseline = (BASELINE_GOVERNORATES[id] as unknown as Record<string, unknown>)[key];
                if (baseline !== undefined) {
                  parsed.governorates[id][key] = parsed.governorates[id][key] ?? baseline;
                }
              }
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

/**
 * structuredClone() throws DataCloneError on functions, and JSON cloning
 * silently turns a NaN into null. cloneGameState() handles both: it drops the
 * `triggerCondition` predicate that a card can still carry (drawn before the
 * strip in drawEventsForTurn, or restored from a stale session — resolution
 * re-resolves the canonical card from ALL_EVENTS by id and never needs it) and
 * coalesces non-finite numbers so they cannot propagate into a saved game.
 */
function clonePlayableState(current: GameState): GameState {
  return cloneGameState(current);
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
        const cloned = clonePlayableState(current);
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
        const cloned = clonePlayableState(current);
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

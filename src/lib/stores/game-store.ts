import { writable } from 'svelte/store';
import type { GameState, TurnDirectives } from '../engine/types';
import { createInitialGameState } from '../engine/baseline';
import { BASELINE_GOVERNORATES, BASELINE_MACRO } from '../engine/constants';
import { executeTurnLifecycle } from '../engine/turn-manager';
import { resolveEventOption, applyUnresolvedCrisisPenalty } from '../engine/events';
import { checkFailStates } from '../engine/fail-states';
import { cloneGameState } from '../engine/state-clone';
import { trackGameEventResolved, trackTurnCommitted } from './analytics-store';

const STORAGE_KEY = 'president_game_state_v1';

function loadStoredGameState(): GameState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.turnNumber === 'number' &&
          Number.isFinite(parsed.turnNumber) &&
          parsed.macro &&
          typeof parsed.macro === 'object' &&
          parsed.governorates &&
          typeof parsed.governorates === 'object' &&
          Object.keys(parsed.governorates).length > 0 &&
          typeof parsed.isGameOver === 'boolean'
        ) {
          // A save can be a partial/older payload: backfill every collection
          // and macro field the HUD dereferences, so a missing array can never
          // throw during render. A template state supplies the canonical
          // baseline for anything absent.
          const template = createInitialGameState();
          for (const [key, fallback] of Object.entries(BASELINE_MACRO)) {
            const macroKey = key as keyof typeof BASELINE_MACRO;
            const value = (parsed.macro as Record<string, unknown>)[macroKey];
            if (typeof value !== 'number' || !Number.isFinite(value)) {
              (parsed.macro as Record<string, number>)[macroKey] = fallback;
            }
          }
          parsed.enactedDecrees = Array.isArray(parsed.enactedDecrees) ? parsed.enactedDecrees : [];
          parsed.facilities = Array.isArray(parsed.facilities) ? parsed.facilities : [];
          parsed.activeEvents = Array.isArray(parsed.activeEvents) ? parsed.activeEvents : [];
          parsed.confiscatedAssets = Array.isArray(parsed.confiscatedAssets)
            ? parsed.confiscatedAssets
            : template.confiscatedAssets;
          parsed.foreignLoans = Array.isArray(parsed.foreignLoans)
            ? parsed.foreignLoans
            : template.foreignLoans;
          parsed.sovereignMortgages = Array.isArray(parsed.sovereignMortgages)
            ? parsed.sovereignMortgages
            : template.sovereignMortgages;
          parsed.commissions =
            parsed.commissions && typeof parsed.commissions === 'object'
              ? parsed.commissions
              : template.commissions;
          parsed.ministries =
            parsed.ministries && typeof parsed.ministries === 'object'
              ? parsed.ministries
              : template.ministries;
          parsed.flags =
            parsed.flags && typeof parsed.flags === 'object' ? parsed.flags : template.flags;
          parsed.migrationLedger =
            parsed.migrationLedger && typeof parsed.migrationLedger === 'object'
              ? parsed.migrationLedger
              : template.migrationLedger;
          parsed.failState = parsed.failState ?? null;
          parsed.centuryEnding = parsed.centuryEnding ?? null;
          if (typeof parsed.calendarYear !== 'number' || !Number.isFinite(parsed.calendarYear)) {
            parsed.calendarYear = template.calendarYear;
          }
          if (typeof parsed.seed !== 'number' || !Number.isFinite(parsed.seed)) {
            parsed.seed = template.seed;
          }
          // Always ensure hex coordinates match the current baseline layout
          // and restore any governorate the save is missing.
          for (const [id, baselineGov] of Object.entries(BASELINE_GOVERNORATES)) {
            if (
              !parsed.governorates[id] ||
              typeof parsed.governorates[id] !== 'object' ||
              parsed.governorates[id] === null
            ) {
              parsed.governorates[id] = JSON.parse(JSON.stringify(baselineGov));
              continue;
            }
            parsed.governorates[id].hexQ = baselineGov.hexQ;
            parsed.governorates[id].hexR = baselineGov.hexR;
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
              const baseline = (baselineGov as unknown as Record<string, unknown>)[key];
              if (baseline !== undefined) {
                parsed.governorates[id][key] = parsed.governorates[id][key] ?? baseline;
              }
            }
          }
          return parsed as GameState;
        }
      }
    }
  } catch (err) {
    // Corrupt JSON, a partial write, or blocked storage (SecurityError in
    // sandboxed/private contexts) must fall back to a fresh game instead of
    // aborting store initialisation.
    console.warn('Could not load saved game state from localStorage:', err);
  }
  return createInitialGameState();
}

/** Fresh PRNG seed for a new run (crypto when available, Math.random otherwise). */
function generateSeed(): number {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      return crypto.getRandomValues(new Uint32Array(1))[0] % 2_147_483_647;
    }
  } catch {
    /* fall through to Math.random */
  }
  return Math.floor(Math.random() * 2_147_483_647);
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
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.warn('Could not save game state to localStorage:', err);
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
      let prevState: GameState | null = null;
      let nextState: GameState | null = null;
      update((current) => {
        prevState = current;
        nextState = executeTurnLifecycle(current, directives);
        return nextState;
      });
      if (prevState && nextState) {
        trackTurnCommitted(prevState, directives, nextState);
      }
    },
    chooseEventOption: (eventId: string, optionId: string) => {
      let prevState: GameState | null = null;
      let nextState: GameState | null = null;
      update((current) => {
        prevState = current;
        const cloned = clonePlayableState(current);
        resolveEventOption(cloned, eventId, optionId);
        const failCheck = checkFailStates(cloned);
        if (failCheck.isFailed) {
          cloned.isGameOver = true;
          cloned.failState = failCheck;
        }
        nextState = cloned;
        return cloned;
      });
      if (prevState && nextState) {
        trackGameEventResolved({
          prevState,
          nextState,
          eventId,
          optionId,
          resolution: 'option_selected',
        });
      }
    },
    triggerUnresolvedCrisisPenalty: (eventId: string) => {
      let prevState: GameState | null = null;
      let nextState: GameState | null = null;
      update((current) => {
        prevState = current;
        const cloned = clonePlayableState(current);
        applyUnresolvedCrisisPenalty(cloned, eventId);
        const failCheck = checkFailStates(cloned);
        if (failCheck.isFailed) {
          cloned.isGameOver = true;
          cloned.failState = failCheck;
        }
        nextState = cloned;
        return cloned;
      });
      if (prevState && nextState) {
        trackGameEventResolved({
          prevState,
          nextState,
          eventId,
          resolution: 'unresolved_penalty',
        });
      }
    },
    restart: (seed?: number) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('Could not clear saved game from localStorage:', err);
      }
      // Every caller passes no seed: without a fresh one every replay drew the
      // same event deck and stochastic outcomes. An explicit seed is still
      // honoured (tests and share codes depend on it).
      const fresh = createInitialGameState(seed ?? generateSeed());
      set(fresh);
    },
  };
}

export const gameStore = createGameStore();

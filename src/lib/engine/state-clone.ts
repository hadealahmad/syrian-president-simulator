import type { GameState } from './types';

/**
 * Single canonical deep-clone for GameState.
 *
 * Two hazards this replaces:
 *
 * 1. `JSON.parse(JSON.stringify(x))` silently maps `NaN` and `Infinity` to
 *    `null`. A single non-finite number therefore becomes a silent value reset
 *    (`null + 5` coerces to 5, `Math.min(100, null + x)` reads as 0) that then
 *    persists into the committed turn. Non-finite numbers are coerced to 0 here
 *    and reported, so a corrupted value can never quietly propagate.
 *
 * 2. `structuredClone(x)` throws DataCloneError on functions. Event cards can
 *    still carry `triggerCondition` (drawn before the strip in
 *    `drawEventsForTurn`, or restored from a stale session), so functions are
 *    dropped — resolution re-resolves the canonical card from ALL_EVENTS by id
 *    and never needs the predicate.
 */
export function cloneGameState(state: GameState): GameState {
  const nonFinite: string[] = [];

  const coerce = (value: unknown, path: string): unknown => {
    if (typeof value === 'function') return undefined;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        nonFinite.push(path);
        return 0;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => coerce(item, `${path}[${index}]`));
    }
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        const coerced = coerce(item, `${path}.${key}`);
        if (coerced !== undefined) out[key] = coerced;
      }
      return out;
    }
    return value;
  };

  const cloned = coerce(state, 'state') as GameState;

  if (nonFinite.length > 0) {
    console.warn(
      `[state-clone] Replaced ${nonFinite.length} non-finite value(s) with 0 — this indicates a numeric bug upstream: ${nonFinite
        .slice(0, 10)
        .join(', ')}${nonFinite.length > 10 ? ', …' : ''}`
    );
  }

  return cloned;
}

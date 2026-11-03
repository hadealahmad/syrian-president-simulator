import { gameStore } from './game-store';
import { draftStore } from './draft-store';
import { uiStore } from './ui-store';

/**
 * The single entry point for starting a new presidential term. Every restart
 * affordance (fail screen, century report, settings menu) must go through
 * here so the game state, the draft directives and the per-game UI selections
 * are reset together — a stale draft survived into a "new" game otherwise,
 * silently carrying martial law, auctions and signed loans into turn 1.
 *
 * An explicit seed is honoured; omitting it lets gameStore.restart() draw a
 * fresh random seed for this run.
 */
export function startNewGame(seed?: number): void {
  gameStore.restart(seed);
  draftStore.reset();
  uiStore.resetGameUi();
}

import { get } from 'svelte/store';
import type { GameState, TurnDirectives } from '../../engine/types';
import { gameStore } from '../../stores/game-store';
import { buildReviewGroups } from '../flow/review-items';

/**
 * Number of pending decisions in the current draft, shown on the End-Turn seal.
 * Derived directly from `buildReviewGroups` so the badge count always matches
 * the exact items listed inside TurnReviewModal.
 */
export function countPendingDraftActions(
  draft: TurnDirectives,
  game: GameState = get(gameStore),
): number {
  if (!draft || !game) return 0;
  return buildReviewGroups(game, draft).reduce((sum, group) => sum + group.items.length, 0);
}

export function hasPendingDraftActions(
  draft: TurnDirectives,
  game: GameState = get(gameStore),
): boolean {
  return countPendingDraftActions(draft, game) > 0;
}

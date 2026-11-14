/**
 * Helpers for stat-filter reordering, availability tier ordering, and
 * reduced-motion-safe FLIP transition duration (<= 180ms).
 */

export type AvailabilityTier = 0 | 1 | 2;

export const UNRELATED_DIVIDER_KEY = '__unrelated_divider__';

export type FilterDisplayRow<T> =
  | { kind: 'item'; key: string; item: T; related: boolean }
  | { kind: 'divider'; key: string; count: number };

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function flipDuration(): number {
  return prefersReducedMotion() ? 0 : 160;
}

/**
 * Orders options while preserving relative source order within each tier:
 * - Without filter: available (0) -> locked (1) -> not-yet-available (2)
 * - With filter: related [0 -> 1 -> 2], then unrelated divider (if any unrelated),
 *   then unrelated [0 -> 1 -> 2].
 */
export function buildFilteredDisplayRows<T>(
  items: readonly T[],
  selectedStat: string | null,
  getKey: (item: T) => string,
  isRelatedFn: (item: T) => boolean,
  getTier: (item: T) => AvailabilityTier = () => 0,
): FilterDisplayRow<T>[] {
  const byTier = (a: T, b: T): number => getTier(a) - getTier(b);

  if (!selectedStat) {
    return [...items]
      .sort(byTier)
      .map((item) => ({
        kind: 'item',
        key: getKey(item),
        item,
        related: true,
      }));
  }

  const related: T[] = [];
  const unrelated: T[] = [];
  for (const item of items) {
    if (isRelatedFn(item)) related.push(item);
    else unrelated.push(item);
  }

  related.sort(byTier);
  unrelated.sort(byTier);

  const rows: FilterDisplayRow<T>[] = related.map((item) => ({
    kind: 'item',
    key: getKey(item),
    item,
    related: true,
  }));

  if (unrelated.length > 0) {
    rows.push({
      kind: 'divider',
      key: UNRELATED_DIVIDER_KEY,
      count: unrelated.length,
    });
    for (const item of unrelated) {
      rows.push({
        kind: 'item',
        key: getKey(item),
        item,
        related: false,
      });
    }
  }

  return rows;
}

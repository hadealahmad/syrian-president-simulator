/**
 * Seeded PRNG (mulberry32). Game logic draws every random number through an
 * Rng whose state lives in the saved game, so a run replays identically.
 */
export interface RngState {
  seed: number;
}

export function nextFloat(r: RngState): number {
  r.seed = (r.seed + 0x6d2b79f5) | 0;
  let t = r.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [0, n). */
export function nextInt(r: RngState, n: number): number {
  return Math.floor(nextFloat(r) * n);
}

export function pick<T>(r: RngState, items: readonly T[]): T {
  return items[nextInt(r, items.length)];
}

export function shuffle<T>(r: RngState, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextInt(r, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Weighted pick; weights must be >= 0 and not all zero. */
export function pickWeighted<T>(r: RngState, items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((s, it) => s + Math.max(0, weight(it)), 0);
  let roll = nextFloat(r) * total;
  for (const it of items) {
    roll -= Math.max(0, weight(it));
    if (roll < 0) return it;
  }
  return items[items.length - 1];
}

export function newSeed(): number {
  return (Math.random() * 2 ** 31) | 0;
}

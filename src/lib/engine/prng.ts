/**
 * Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% deterministic, reproducible simulation runs.
 */
export class PRNG {
  private state: number;

  constructor(seed: number = 19741208) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer between min and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns true with a given probability (0.0 to 1.0)
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }
}

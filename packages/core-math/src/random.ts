/**
 * Seeded pseudo-random number generator using Mulberry32 algorithm.
 * Deterministic: same seed always produces same sequence.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0; // Ensure unsigned 32-bit
  }

  /**
   * Returns a random number in [0, 1)
   */
  random(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] inclusive
   */
  randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Returns a random element from an array
   */
  choice<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  /**
   * Returns the current seed state (for cloning/checkpointing)
   */
  getState(): number {
    return this.state;
  }

  /**
   * Sets the internal state (for restoring from checkpoint)
   */
  setState(state: number): void {
    this.state = state >>> 0;
  }

  /**
   * Creates a clone with the same state
   */
  clone(): SeededRandom {
    const copy = new SeededRandom(0);
    copy.state = this.state;
    return copy;
  }
}

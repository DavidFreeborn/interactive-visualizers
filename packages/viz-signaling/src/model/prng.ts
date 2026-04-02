/**
 * Deterministic pseudo-random number generator based on Mulberry32.
 */
export class SeededPrng {
  private state: number;

  /**
   * Creates a generator from an unsigned 32-bit seed.
   */
  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns the next pseudo-random number in the half-open interval [0, 1).
   */
  nextFloat(): number {
    let working = (this.state += 0x6d2b79f5);
    working = Math.imul(working ^ (working >>> 15), working | 1);
    working ^= working + Math.imul(working ^ (working >>> 7), working | 61);
    return ((working ^ (working >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in the range [0, exclusiveUpperBound).
   */
  nextInt(exclusiveUpperBound: number): number {
    if (!Number.isInteger(exclusiveUpperBound) || exclusiveUpperBound <= 0) {
      throw new Error('exclusiveUpperBound must be a positive integer.');
    }
    return Math.floor(this.nextFloat() * exclusiveUpperBound);
  }

  /**
   * Returns the current internal state for reproducibility diagnostics.
   */
  getState(): number {
    return this.state >>> 0;
  }

  /**
   * Returns a generator with the same internal state.
   */
  clone(): SeededPrng {
    const clone = new SeededPrng(0);
    clone.state = this.state >>> 0;
    return clone;
  }
}

const MAX_UINT32_PLUS_ONE = 0x1_0000_0000;

/**
 * Generates a fresh unsigned 32-bit seed for a new public run.
 */
export function createRandomSeed(): number {
  return Math.floor(Math.random() * MAX_UINT32_PLUS_ONE) >>> 0;
}

import { SeededRandom } from './random';

/**
 * Normalizes an array of non-negative numbers to sum to 1.
 * Returns uniform distribution if all values are zero.
 */
export function normalize(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return values.map(() => 1 / values.length);
  }
  return values.map((v) => v / sum);
}

/**
 * Applies softmax with temperature parameter.
 * Lower temperature = sharper distribution.
 */
export function softmax(values: number[], temperature: number): number[] {
  // Subtract max for numerical stability
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp((v - max) / temperature));
  return normalize(exps);
}

/**
 * Samples an index from a probability distribution.
 */
export function sampleFromDistribution(
  probs: number[],
  rng: SeededRandom
): number {
  const r = rng.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) {
      return i;
    }
  }
  return probs.length - 1; // Fallback for floating-point edge cases
}

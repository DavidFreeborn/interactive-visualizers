import type { Matrix } from './types';
import { SeededPrng } from './prng';

/**
 * Creates a matrix filled with the supplied value.
 */
export function createFilledMatrix(rows: number, columns: number, value: number): Matrix {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => value));
}

/**
 * Returns a deep clone of a numeric matrix.
 */
export function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => [...row]);
}

/**
 * Row-normalizes non-negative weights. Zero rows fall back to a uniform distribution.
 */
export function normalizeRow(weights: readonly number[]): number[] {
  if (weights.length === 0) {
    throw new Error('Cannot normalize an empty row.');
  }

  let sum = 0;
  for (let index = 0; index < weights.length; index += 1) {
    const weight = weights[index];
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(`weights[${index}] must be a finite non-negative number.`);
    }
    sum += weight;
  }

  if (sum <= 0) {
    const uniformValue = 1 / weights.length;
    return Array.from({ length: weights.length }, () => uniformValue);
  }

  return weights.map((weight) => weight / sum);
}

/**
 * Samples an index in proportion to the provided non-negative weights.
 */
export function sampleCategorical(weights: readonly number[], prng: SeededPrng): number {
  if (weights.length === 0) {
    throw new Error('Cannot sample from an empty weight vector.');
  }

  let total = 0;
  for (let index = 0; index < weights.length; index += 1) {
    const weight = weights[index];
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(`weights[${index}] must be a finite non-negative number.`);
    }
    total += weight;
  }

  if (total <= 0) {
    return prng.nextInt(weights.length);
  }

  const threshold = prng.nextFloat() * total;
  let cumulative = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index];
    if (threshold < cumulative) {
      return index;
    }
  }

  return weights.length - 1;
}

/**
 * Returns the index of the first maximal value.
 */
export function argMaxIndex(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot compute an argmax over an empty list.');
  }

  let bestIndex = 0;
  let bestValue = values[0];
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > bestValue) {
      bestValue = values[index];
      bestIndex = index;
    }
  }
  return bestIndex;
}

/**
 * Computes base-2 logarithms while rejecting non-positive inputs.
 */
export function log2Strict(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('log2Strict expects a finite positive value.');
  }
  return Math.log2(value);
}

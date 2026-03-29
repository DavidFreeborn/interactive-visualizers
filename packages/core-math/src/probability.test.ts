/**
 * Tests for probability utilities.
 */

import { describe, it, expect } from 'vitest';
import { normalize, softmax, sampleFromDistribution } from './probability';
import { SeededRandom } from './random';

describe('normalize', () => {
  it('normalizes to sum to 1', () => {
    const result = normalize([1, 2, 3, 4]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('preserves proportions', () => {
    const result = normalize([1, 2, 3, 4]);
    expect(result[0]).toBeCloseTo(0.1, 10);
    expect(result[1]).toBeCloseTo(0.2, 10);
    expect(result[2]).toBeCloseTo(0.3, 10);
    expect(result[3]).toBeCloseTo(0.4, 10);
  });

  it('handles all zeros with uniform distribution', () => {
    const result = normalize([0, 0, 0, 0]);
    expect(result).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it('handles single element', () => {
    const result = normalize([5]);
    expect(result).toEqual([1]);
  });
});

describe('softmax', () => {
  it('produces valid probability distribution', () => {
    const result = softmax([1, 2, 3], 1);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
    result.forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  it('higher values get higher probabilities', () => {
    const result = softmax([1, 2, 3], 1);
    expect(result[2]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[0]);
  });

  it('lower temperature makes distribution sharper', () => {
    const soft = softmax([1, 2, 3], 10);
    const sharp = softmax([1, 2, 3], 0.1);

    // Sharp distribution should have higher max
    expect(Math.max(...sharp)).toBeGreaterThan(Math.max(...soft));
  });

  it('high temperature approaches uniform', () => {
    const result = softmax([1, 2, 3], 1000);
    // Should be close to uniform
    result.forEach((p) => {
      expect(p).toBeGreaterThan(0.3);
      expect(p).toBeLessThan(0.36);
    });
  });
});

describe('sampleFromDistribution', () => {
  it('returns valid indices', () => {
    const probs = [0.25, 0.25, 0.25, 0.25];
    const rng = new SeededRandom(42);

    for (let i = 0; i < 100; i++) {
      const idx = sampleFromDistribution(probs, rng);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(probs.length);
    }
  });

  it('samples proportionally to probabilities', () => {
    const probs = [0.1, 0.2, 0.3, 0.4];
    const rng = new SeededRandom(42);
    const counts = [0, 0, 0, 0];

    const trials = 10000;
    for (let i = 0; i < trials; i++) {
      const idx = sampleFromDistribution(probs, rng);
      counts[idx]++;
    }

    // Check that proportions are roughly correct
    for (let i = 0; i < 4; i++) {
      const actual = counts[i] / trials;
      expect(actual).toBeGreaterThan(probs[i] - 0.05);
      expect(actual).toBeLessThan(probs[i] + 0.05);
    }
  });

  it('handles edge case of single element', () => {
    const probs = [1];
    const rng = new SeededRandom(42);
    expect(sampleFromDistribution(probs, rng)).toBe(0);
  });

  it('handles edge case of zero probability', () => {
    const probs = [0, 0, 1, 0];
    const rng = new SeededRandom(42);

    for (let i = 0; i < 100; i++) {
      expect(sampleFromDistribution(probs, rng)).toBe(2);
    }
  });
});

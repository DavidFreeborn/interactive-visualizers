import { describe, expect, it } from 'vitest';
import { SeededPrng } from './prng';
import { normalizeRow, sampleCategorical } from './numeric';

describe('normalizeRow', () => {
  it('returns rows that sum to 1', () => {
    const normalized = normalizeRow([1, 2, 3]);
    const total = normalized.reduce((sum, value) => sum + value, 0);

    expect(total).toBeCloseTo(1, 12);
  });

  it('returns a uniform distribution for symmetric initial rows', () => {
    expect(normalizeRow([1, 1, 1, 1])).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it('falls back to a uniform distribution for zero rows', () => {
    expect(normalizeRow([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });
});

describe('sampleCategorical', () => {
  it('is deterministic under a fixed seed', () => {
    const first = new SeededPrng(99);
    const second = new SeededPrng(99);

    const firstSamples = Array.from({ length: 10 }, () => sampleCategorical([1, 3, 2], first));
    const secondSamples = Array.from({ length: 10 }, () =>
      sampleCategorical([1, 3, 2], second)
    );

    expect(firstSamples).toEqual(secondSamples);
  });

  it('samples only valid indices', () => {
    const prng = new SeededPrng(22);
    const samples = Array.from({ length: 100 }, () => sampleCategorical([1, 0, 0, 5], prng));

    expect(samples.every((sample) => sample >= 0 && sample < 4)).toBe(true);
  });

  it('reflects skewed weights over repeated draws', () => {
    const prng = new SeededPrng(17);
    const counts = [0, 0];

    for (let index = 0; index < 2000; index += 1) {
      counts[sampleCategorical([1, 9], prng)] += 1;
    }

    expect(counts[1]).toBeGreaterThan(counts[0]);
  });
});

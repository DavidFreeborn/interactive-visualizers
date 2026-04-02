import { describe, expect, it } from 'vitest';
import { SeededPrng } from './prng';

describe('SeededPrng', () => {
  it('produces identical sequences for identical seeds', () => {
    const first = new SeededPrng(12345);
    const second = new SeededPrng(12345);

    const firstSequence = Array.from({ length: 5 }, () => first.nextFloat());
    const secondSequence = Array.from({ length: 5 }, () => second.nextFloat());

    expect(firstSequence).toEqual(secondSequence);
  });

  it('supports cloning the current state', () => {
    const prng = new SeededPrng(8);
    prng.nextFloat();
    prng.nextFloat();

    const clone = prng.clone();

    expect(prng.nextFloat()).toBe(clone.nextFloat());
    expect(prng.nextFloat()).toBe(clone.nextFloat());
  });
});

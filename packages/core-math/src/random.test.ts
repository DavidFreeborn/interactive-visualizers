/**
 * Tests for the SeededRandom class.
 */

import { describe, it, expect } from 'vitest';
import { SeededRandom } from './random';

describe('SeededRandom', () => {
  it('produces deterministic sequences', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const seq1 = Array.from({ length: 100 }, () => rng1.random());
    const seq2 = Array.from({ length: 100 }, () => rng2.random());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1.random());
    const seq2 = Array.from({ length: 10 }, () => rng2.random());

    expect(seq1).not.toEqual(seq2);
  });

  it('random() returns values in [0, 1)', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('randInt() returns values in [min, max] inclusive', () => {
    const rng = new SeededRandom(42);
    const counts = new Map<number, number>();

    for (let i = 0; i < 1000; i++) {
      const v = rng.randInt(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      counts.set(v, (counts.get(v) || 0) + 1);
    }

    // All values should appear at least once
    for (let i = 1; i <= 6; i++) {
      expect(counts.get(i)).toBeGreaterThan(0);
    }
  });

  it('choice() returns elements from array', () => {
    const rng = new SeededRandom(42);
    const arr = ['a', 'b', 'c', 'd'];
    const counts = new Map<string, number>();

    for (let i = 0; i < 1000; i++) {
      const v = rng.choice(arr);
      expect(arr).toContain(v);
      counts.set(v, (counts.get(v) || 0) + 1);
    }

    // All values should appear at least once
    for (const v of arr) {
      expect(counts.get(v)).toBeGreaterThan(0);
    }
  });

  it('clone() creates independent copy with same state', () => {
    const rng1 = new SeededRandom(42);
    // Advance the state
    for (let i = 0; i < 50; i++) {
      rng1.random();
    }

    const rng2 = rng1.clone();

    // They should produce the same values now
    const v1 = rng1.random();
    const v2 = rng2.random();
    expect(v1).toBe(v2);

    // They should continue to produce the same values
    for (let i = 0; i < 10; i++) {
      expect(rng1.random()).toBe(rng2.random());
    }
  });

  it('getState/setState allows checkpointing', () => {
    const rng = new SeededRandom(42);

    // Advance the state
    for (let i = 0; i < 50; i++) {
      rng.random();
    }

    const checkpoint = rng.getState();
    const nextValues = Array.from({ length: 10 }, () => rng.random());

    // Restore and replay
    rng.setState(checkpoint);
    const replayedValues = Array.from({ length: 10 }, () => rng.random());

    expect(replayedValues).toEqual(nextValues);
  });
});

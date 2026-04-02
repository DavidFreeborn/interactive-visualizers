import { describe, expect, it } from 'vitest';
import { CompositionalTraditionalRunner } from './CompositionalTraditionalRunner';

describe('CompositionalTraditionalRunner', () => {
  it('updates counters and history when stepping once', () => {
    const runner = new CompositionalTraditionalRunner({ seed: 5 });
    const snapshot = runner.step();

    expect(snapshot.metrics.round).toBe(1);
    expect(snapshot.history).toHaveLength(2);
    expect(snapshot.lastRoundEvent?.round).toBe(1);
  });

  it('matches repeated single stepping exactly when stepping in a batch', () => {
    const batchRunner = new CompositionalTraditionalRunner({ seed: 19 });
    const singleRunner = new CompositionalTraditionalRunner({ seed: 19 });

    const batchSnapshot = batchRunner.stepMany(25);
    for (let index = 0; index < 25; index += 1) {
      singleRunner.step();
    }
    const singleSnapshot = singleRunner.getSnapshot();

    expect(batchSnapshot.state).toEqual(singleSnapshot.state);
    expect(batchSnapshot.metrics).toEqual(singleSnapshot.metrics);
    expect(batchSnapshot.history).toEqual(singleSnapshot.history);
  });

  it('reset reproduces the exact initial trajectory for the same seed', () => {
    const runner = new CompositionalTraditionalRunner({ seed: 31 });
    runner.stepMany(8);
    runner.reset();

    const afterReset = runner.stepMany(12);
    const fresh = new CompositionalTraditionalRunner({ seed: 31 }).stepMany(12);

    expect(afterReset.state).toEqual(fresh.state);
    expect(afterReset.metrics).toEqual(fresh.metrics);
    expect(afterReset.history).toEqual(fresh.history);
  });

  it('same seed produces the same trajectory', () => {
    const first = new CompositionalTraditionalRunner({ seed: 77 }).stepMany(20);
    const second = new CompositionalTraditionalRunner({ seed: 77 }).stepMany(20);

    expect(first.state).toEqual(second.state);
    expect(first.metrics).toEqual(second.metrics);
    expect(first.history).toEqual(second.history);
  });
});

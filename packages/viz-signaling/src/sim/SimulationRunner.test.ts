import { describe, expect, it } from 'vitest';
import { SimulationRunner } from './SimulationRunner';

describe('SimulationRunner', () => {
  it('updates history and counters when stepping one round', () => {
    const runner = new SimulationRunner();
    const snapshot = runner.step();

    expect(snapshot.metrics.round).toBe(1);
    expect(snapshot.history).toHaveLength(2);
    expect(snapshot.lastRoundEvent).not.toBeNull();
  });

  it('produces the same result for stepMany and repeated single steps', () => {
    const batchRunner = new SimulationRunner({ seed: 77 });
    const singleRunner = new SimulationRunner({ seed: 77 });

    batchRunner.stepMany(250);
    for (let index = 0; index < 250; index += 1) {
      singleRunner.step();
    }

    expect(batchRunner.getSnapshot()).toEqual(singleRunner.getSnapshot());
  });

  it('reset restores the exact initial state and history', () => {
    const runner = new SimulationRunner({ seed: 13 });
    runner.stepMany(50);

    const resetSnapshot = runner.reset();
    const freshSnapshot = new SimulationRunner({ seed: 13 }).getSnapshot();

    expect(resetSnapshot).toEqual(freshSnapshot);
  });

  it('changing config rebuilds the state with the new dimensions', () => {
    const runner = new SimulationRunner();
    const snapshot = runner.updateConfig({
      numStates: 4,
      numMessages: 4,
      numActions: 4,
      prior: [0.25, 0.25, 0.25, 0.25],
      correctActions: [0, 1, 2, 3],
    });

    expect(snapshot.state.senderWeights).toHaveLength(4);
    expect(snapshot.state.senderWeights[0]).toHaveLength(4);
    expect(snapshot.state.receiverWeights).toHaveLength(4);
    expect(snapshot.state.receiverWeights[0]).toHaveLength(4);
    expect(snapshot.metrics.round).toBe(0);
  });

  it('is deterministic for the same seed and step sequence', () => {
    const first = new SimulationRunner({ seed: 5 });
    const second = new SimulationRunner({ seed: 5 });

    first.stepMany(400);
    second.stepMany(400);

    expect(first.getSnapshot()).toEqual(second.getSnapshot());
  });
});

import { describe, expect, it } from 'vitest';
import { SeededPrng } from './prng';
import { createInitialSignalingGameState, playRound } from './signalingGame';
import { resolveSignalingGameConfig } from './validation';

describe('createInitialSignalingGameState', () => {
  it('creates matrices with the configured shapes and initial values', () => {
    const config = resolveSignalingGameConfig({
      numStates: 3,
      numMessages: 4,
      numActions: 5,
      prior: [0.2, 0.3, 0.5],
      correctActions: [0, 1, 2],
      initialReinforcement: 7,
    });

    const state = createInitialSignalingGameState(config);

    expect(state.senderWeights).toEqual([
      [7, 7, 7, 7],
      [7, 7, 7, 7],
      [7, 7, 7, 7],
    ]);
    expect(state.receiverWeights).toEqual([
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7],
      [7, 7, 7, 7, 7],
    ]);
  });
});

describe('playRound', () => {
  it('reinforces only the sampled sender and receiver cells on success', () => {
    const config = resolveSignalingGameConfig({
      prior: [1, 0],
      correctActions: [0, 1],
      seed: 1,
    });
    const prng = new SeededPrng(1);
    const state = {
      senderWeights: [
        [1, 0],
        [1, 1],
      ],
      receiverWeights: [
        [1, 0],
        [1, 1],
      ],
    };

    const { nextState, event } = playRound(state, config, prng, 1);

    expect(event).toEqual({
      round: 1,
      stateIndex: 0,
      messageIndex: 0,
      actionIndex: 0,
      reward: 1,
      success: true,
    });
    expect(nextState.senderWeights).toEqual([
      [2, 0],
      [1, 1],
    ]);
    expect(nextState.receiverWeights).toEqual([
      [2, 0],
      [1, 1],
    ]);
  });

  it('does not reinforce anything on failure', () => {
    const config = resolveSignalingGameConfig({
      prior: [1, 0],
      correctActions: [1, 0],
      seed: 2,
    });
    const prng = new SeededPrng(2);
    const state = {
      senderWeights: [
        [1, 0],
        [1, 1],
      ],
      receiverWeights: [
        [1, 0],
        [1, 1],
      ],
    };

    const { nextState, event } = playRound(state, config, prng, 1);

    expect(event.success).toBe(false);
    expect(nextState).toEqual(state);
  });
});

import { describe, expect, it } from 'vitest';
import {
  calculateJointMutualInformationBits,
  calculateSenderAMutualInformationBits,
  calculateSenderBMutualInformationBits,
  calculateStableTraditionalSignalingSystem,
  calculateTraditionalApproximateRegime,
  calculateTraditionalExpectedSuccessRate,
} from './metrics';
import { resolveCompositionalTraditionalConfig } from './validation';

describe('traditional compositional metrics', () => {
  it('returns 0.25 expected success for the uniform traditional game', () => {
    const config = resolveCompositionalTraditionalConfig();
    const state = {
      senderAWeights: Array.from({ length: 4 }, () => [1, 1]),
      senderBWeights: Array.from({ length: 4 }, () => [1, 1]),
      receiverPairWeights: Array.from({ length: 2 }, () =>
        Array.from({ length: 2 }, () => [1, 1, 1, 1])
      ),
    };

    expect(calculateTraditionalExpectedSuccessRate(state, config)).toBeCloseTo(0.25, 12);
  });

  it('returns 1.0 expected success for a perfect traditional signaling system', () => {
    const config = resolveCompositionalTraditionalConfig();
    const state = {
      senderAWeights: [
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
      ],
      senderBWeights: [
        [10, 0],
        [0, 10],
        [10, 0],
        [0, 10],
      ],
      receiverPairWeights: [
        [
          [10, 0, 0, 0],
          [0, 10, 0, 0],
        ],
        [
          [0, 0, 10, 0],
          [0, 0, 0, 10],
        ],
      ],
    };

    expect(calculateTraditionalExpectedSuccessRate(state, config)).toBe(1);
    expect(calculateSenderAMutualInformationBits(state, config)).toBeCloseTo(1, 12);
    expect(calculateSenderBMutualInformationBits(state, config)).toBeCloseTo(1, 12);
    expect(calculateJointMutualInformationBits(state, config)).toBeCloseTo(2, 12);
    expect(calculateJointMutualInformationBits(state, config)).toBeGreaterThan(
      calculateSenderAMutualInformationBits(state, config)
    );
  });

  it('identifies the strict canonical traditional signaling system exactly', () => {
    const config = resolveCompositionalTraditionalConfig();
    const perfectCanonicalState = {
      senderAWeights: [
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
      ],
      senderBWeights: [
        [10, 0],
        [0, 10],
        [10, 0],
        [0, 10],
      ],
      receiverPairWeights: [
        [
          [10, 0, 0, 0],
          [0, 10, 0, 0],
        ],
        [
          [0, 0, 10, 0],
          [0, 0, 0, 10],
        ],
      ],
    };
    const nonCanonicalButSuccessfulState = {
      senderAWeights: [
        [10, 0],
        [0, 10],
        [10, 0],
        [0, 10],
      ],
      senderBWeights: [
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
      ],
      receiverPairWeights: [
        [
          [10, 0, 0, 0],
          [0, 0, 10, 0],
        ],
        [
          [0, 10, 0, 0],
          [0, 0, 0, 10],
        ],
      ],
    };

    expect(calculateStableTraditionalSignalingSystem(perfectCanonicalState, config)).toBe(true);
    expect(calculateStableTraditionalSignalingSystem(nonCanonicalButSuccessfulState, config)).toBe(
      false
    );
  });

  it('distinguishes the approximate regime label from the strict exact flag', () => {
    const config = resolveCompositionalTraditionalConfig();
    const nonCanonicalButSuccessfulState = {
      senderAWeights: [
        [10, 0],
        [0, 10],
        [10, 0],
        [0, 10],
      ],
      senderBWeights: [
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
      ],
      receiverPairWeights: [
        [
          [10, 0, 0, 0],
          [0, 0, 10, 0],
        ],
        [
          [0, 10, 0, 0],
          [0, 0, 0, 10],
        ],
      ],
    };

    expect(calculateTraditionalApproximateRegime(nonCanonicalButSuccessfulState, config).kind).toBe(
      'signalling-equilibrium'
    );
    expect(calculateStableTraditionalSignalingSystem(nonCanonicalButSuccessfulState, config)).toBe(
      false
    );
  });
});

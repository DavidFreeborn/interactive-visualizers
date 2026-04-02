import { describe, expect, it } from 'vitest';
import {
  calculateEquilibriumDiagnostic,
  calculateExpectedSuccessRate,
  calculateMaximumMutualInformationBits,
  calculateMutualInformationBits,
  calculateStableSignalingSystem,
} from './metrics';
import { resolveSignalingGameConfig } from './validation';

describe('calculateExpectedSuccessRate', () => {
  it('returns 0.5 for the uniform 2x2 game', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 1],
        [1, 1],
      ],
      receiverWeights: [
        [1, 1],
        [1, 1],
      ],
    };

    expect(calculateExpectedSuccessRate(state, config)).toBeCloseTo(0.5, 12);
  });

  it('returns 1.0 for a perfect 2x2 signaling system', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 0],
        [0, 1],
      ],
      receiverWeights: [
        [1, 0],
        [0, 1],
      ],
    };

    expect(calculateExpectedSuccessRate(state, config)).toBe(1);
  });

  it('returns 1.0 for a perfect 4x4 signaling system', () => {
    const config = resolveSignalingGameConfig({
      numStates: 4,
      numMessages: 4,
      numActions: 4,
      prior: [0.25, 0.25, 0.25, 0.25],
      correctActions: [0, 1, 2, 3],
    });
    const identityRow = (rowIndex: number) =>
      Array.from({ length: 4 }, (_, columnIndex) => (columnIndex === rowIndex ? 1 : 0));
    const state = {
      senderWeights: [identityRow(0), identityRow(1), identityRow(2), identityRow(3)],
      receiverWeights: [identityRow(0), identityRow(1), identityRow(2), identityRow(3)],
    };

    expect(calculateExpectedSuccessRate(state, config)).toBe(1);
  });
});

describe('calculateMutualInformationBits', () => {
  it('returns 0 for the uniform uninformative 2x2 channel', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 1],
        [1, 1],
      ],
      receiverWeights: [
        [1, 1],
        [1, 1],
      ],
    };

    expect(calculateMutualInformationBits(state, config)).toBeCloseTo(0, 12);
  });

  it('returns 1 for a perfect one-to-one 2x2 channel', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 0],
        [0, 1],
      ],
      receiverWeights: [
        [1, 1],
        [1, 1],
      ],
    };

    expect(calculateMutualInformationBits(state, config)).toBeCloseTo(1, 12);
  });

  it('returns 2 for a perfect one-to-one 4x4 channel', () => {
    const config = resolveSignalingGameConfig({
      numStates: 4,
      numMessages: 4,
      numActions: 4,
      prior: [0.25, 0.25, 0.25, 0.25],
      correctActions: [0, 1, 2, 3],
    });
    const state = {
      senderWeights: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ],
      receiverWeights: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
    };

    expect(calculateMutualInformationBits(state, config)).toBeCloseTo(2, 12);
    expect(calculateMaximumMutualInformationBits(config)).toBeCloseTo(2, 12);
  });

  it('matches a hand-computed partially informative 2x2 channel', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 0],
        [1, 1],
      ],
      receiverWeights: [
        [1, 1],
        [1, 1],
      ],
    };

    expect(calculateMutualInformationBits(state, config)).toBeCloseTo(0.311278124459, 12);
  });
});

describe('calculateEquilibriumDiagnostic', () => {
  it('classifies a perfect 2x2 signaling system as an approximate signalling equilibrium', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [100, 0],
        [0, 100],
      ],
      receiverWeights: [
        [100, 0],
        [0, 100],
      ],
    };

    expect(calculateEquilibriumDiagnostic(state, config).kind).toBe('signalling-equilibrium');
  });

  it('classifies a 2x6x2 system with redundant messages as a signalling equilibrium', () => {
    const config = resolveSignalingGameConfig({
      numStates: 2,
      numMessages: 6,
      numActions: 2,
      prior: [0.5, 0.5],
      correctActions: [0, 1],
    });
    const state = {
      senderWeights: [
        [10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10],
      ],
      receiverWeights: [
        [10, 0],
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
        [0, 10],
      ],
    };

    expect(calculateEquilibriumDiagnostic(state, config).kind).toBe('signalling-equilibrium');
    expect(calculateStableSignalingSystem(state, config)).toBe(false);
  });

  it('classifies near-uniform unlearned play as not in a signalling system', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 1],
        [1, 1],
      ],
      receiverWeights: [
        [1, 1],
        [1, 1],
      ],
    };

    expect(calculateEquilibriumDiagnostic(state, config).kind).toBe('none');
  });

  it('classifies strong one-message use as an approximate pooling equilibrium', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [100, 1],
        [100, 1],
      ],
      receiverWeights: [
        [100, 1],
        [1, 1],
      ],
    };

    expect(calculateEquilibriumDiagnostic(state, config).kind).toBe('pooling-equilibrium');
  });

  it('classifies state-independent mixed sender behavior as a pooling equilibrium', () => {
    const config = resolveSignalingGameConfig({
      numStates: 2,
      numMessages: 3,
      numActions: 2,
      prior: [0.5, 0.5],
      correctActions: [0, 1],
    });
    const state = {
      senderWeights: [
        [6, 3, 1],
        [6, 3, 1],
      ],
      receiverWeights: [
        [10, 0],
        [10, 0],
        [10, 0],
      ],
    };

    expect(calculateEquilibriumDiagnostic(state, config).kind).toBe('pooling-equilibrium');
  });
});

describe('calculateStableSignalingSystem', () => {
  it('returns true for a strict perfect 2x2 signaling system', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [100, 0],
        [0, 100],
      ],
      receiverWeights: [
        [100, 0],
        [0, 100],
      ],
    };

    expect(calculateStableSignalingSystem(state, config)).toBe(true);
  });

  it('returns false for an unlearned uniform state', () => {
    const config = resolveSignalingGameConfig();
    const state = {
      senderWeights: [
        [1, 1],
        [1, 1],
      ],
      receiverWeights: [
        [1, 1],
        [1, 1],
      ],
    };

    expect(calculateStableSignalingSystem(state, config)).toBe(false);
  });
});

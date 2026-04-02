import { createFilledMatrix, normalizeRow } from '../numeric';
import type { CompositionalConfig, Matrix, PairTensor } from './types';

export function createFilledPairTensor(
  rowsA: number,
  rowsB: number,
  depth: number,
  value: number
): PairTensor {
  return Array.from({ length: rowsA }, () =>
    Array.from({ length: rowsB }, () => Array.from({ length: depth }, () => value))
  );
}

export function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => [...row]);
}

export function clonePairTensor(tensor: PairTensor): PairTensor {
  return tensor.map((row) => row.map((cell) => [...cell]));
}

export function cloneCompositionalConfig(
  config: CompositionalConfig
): CompositionalConfig {
  return {
    ...config,
    prior: [...config.prior] as CompositionalConfig['prior'],
    correctActions: [...config.correctActions] as CompositionalConfig['correctActions'],
  };
}

export function getSignalingBiasFloorValue(
  config: Pick<CompositionalConfig, 'initialReinforcement'>
): number {
  // Keep the decay floor at the model's baseline reinforcement so the bias
  // only weakens already-learned competitors above the uninformed starting
  // point; it never introduces a directional starting asymmetry.
  return config.initialReinforcement;
}

export function createInitialSenderWeights(config: CompositionalConfig): {
  senderAWeights: Matrix;
  senderBWeights: Matrix;
} {
  return {
    senderAWeights: createFilledMatrix(
      config.numStates,
      config.numMessagesA,
      config.initialReinforcement
    ),
    senderBWeights: createFilledMatrix(
      config.numStates,
      config.numMessagesB,
      config.initialReinforcement
    ),
  };
}

export function deriveSenderPolicies(weights: {
  senderAWeights: Matrix;
  senderBWeights: Matrix;
}): {
  senderAPolicy: Matrix;
  senderBPolicy: Matrix;
} {
  return {
    senderAPolicy: weights.senderAWeights.map((row) => normalizeRow(row)),
    senderBPolicy: weights.senderBWeights.map((row) => normalizeRow(row)),
  };
}

export function reinforceSenderWeights<State extends {
  senderAWeights: Matrix;
  senderBWeights: Matrix;
}>(
  state: State,
  update: {
    stateIndex: number;
    messageAIndex: number;
    messageBIndex: number;
  }
): Pick<State, 'senderAWeights' | 'senderBWeights'> {
  const senderAWeights = state.senderAWeights.map((row, rowIndex) =>
    rowIndex === update.stateIndex
      ? row.map((value, columnIndex) =>
          columnIndex === update.messageAIndex ? value + 1 : value
        )
      : [...row]
  );

  const senderBWeights = state.senderBWeights.map((row, rowIndex) =>
    rowIndex === update.stateIndex
      ? row.map((value, columnIndex) =>
          columnIndex === update.messageBIndex ? value + 1 : value
        )
      : [...row]
  );

  return {
    senderAWeights,
    senderBWeights,
  };
}

export function applyContrastiveSignalingBiasToRow(
  row: readonly number[],
  chosenIndex: number,
  config: Pick<
    CompositionalConfig,
    'initialReinforcement' | 'signalingBiasStrength'
  >
): number[] {
  const floorValue = getSignalingBiasFloorValue(config);
  const decayFactor = 1 - config.signalingBiasStrength;

  return row.map((value, index) => {
    if (index === chosenIndex) {
      return value;
    }

    return Math.max(floorValue, value * decayFactor);
  });
}

export function temperedSoftmax(values: readonly number[], temperature: number): number[] {
  const maxValue = Math.max(...values);
  const exponentials = values.map((value) => Math.exp((value - maxValue) / temperature));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

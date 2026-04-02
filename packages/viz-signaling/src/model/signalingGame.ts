import type {
  SignalingGameConfig,
  SignalingGameState,
  SignalingPolicies,
  SignalingRoundEvent,
} from './types';
import { cloneMatrix, createFilledMatrix, normalizeRow, sampleCategorical } from './numeric';
import { SeededPrng } from './prng';

/**
 * Creates the initial learned weight state for a signaling game.
 */
export function createInitialSignalingGameState(
  config: SignalingGameConfig
): SignalingGameState {
  return {
    senderWeights: createFilledMatrix(
      config.numStates,
      config.numMessages,
      config.initialReinforcement
    ),
    receiverWeights: createFilledMatrix(
      config.numMessages,
      config.numActions,
      config.initialReinforcement
    ),
  };
}

/**
 * Derives the current sender and receiver policies by row-normalization.
 */
export function derivePolicies(state: SignalingGameState): SignalingPolicies {
  return {
    senderPolicy: state.senderWeights.map((row) => normalizeRow(row)),
    receiverPolicy: state.receiverWeights.map((row) => normalizeRow(row)),
  };
}

/**
 * Returns a new state in which only the addressed sender and receiver cells are incremented.
 */
export function reinforceSuccessfulRound(
  state: SignalingGameState,
  stateIndex: number,
  messageIndex: number,
  actionIndex: number
): SignalingGameState {
  const senderWeights = cloneMatrix(state.senderWeights);
  const receiverWeights = cloneMatrix(state.receiverWeights);

  senderWeights[stateIndex][messageIndex] += 1;
  receiverWeights[messageIndex][actionIndex] += 1;

  return {
    senderWeights,
    receiverWeights,
  };
}

/**
 * Simulates one signaling-game round using the exact proportional-sampling update rule.
 */
export function playRound(
  state: SignalingGameState,
  config: SignalingGameConfig,
  prng: SeededPrng,
  round: number
): { nextState: SignalingGameState; event: SignalingRoundEvent } {
  const stateIndex = sampleCategorical(config.prior, prng);
  const messageIndex = sampleCategorical(state.senderWeights[stateIndex], prng);
  const actionIndex = sampleCategorical(state.receiverWeights[messageIndex], prng);
  const reward = actionIndex === config.correctActions[stateIndex] ? 1 : 0;

  const nextState =
    reward === 1
      ? reinforceSuccessfulRound(state, stateIndex, messageIndex, actionIndex)
      : state;

  return {
    nextState,
    event: {
      round,
      stateIndex,
      messageIndex,
      actionIndex,
      reward,
      success: reward === 1,
    },
  };
}

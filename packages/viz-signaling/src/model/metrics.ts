import type {
  EquilibriumDiagnostic,
  GreedyDiagnostic,
  SignalingGameConfig,
  SignalingGameState,
  SignalingMetrics,
} from './types';
import { argMaxIndex, log2Strict } from './numeric';
import { derivePolicies } from './signalingGame';

const APPROXIMATE_SIGNALING_SUCCESS_THRESHOLD = 0.9;
const APPROXIMATE_SIGNALING_STATE_SUCCESS_THRESHOLD = 0.85;
const APPROXIMATE_POOLING_TOTAL_VARIATION_THRESHOLD = 0.15;
const APPROXIMATE_POOLING_INFORMATION_THRESHOLD = 0.1;
const APPROXIMATE_POOLING_ACTION_THRESHOLD = 0.7;
const STABLE_SIGNALING_EXPECTED_SUCCESS_THRESHOLD = 0.99;

/**
 * Computes the exact expected success rate under the current sender and receiver policies.
 */
export function calculateExpectedSuccessRate(
  state: SignalingGameState,
  config: SignalingGameConfig
): number {
  const policies = derivePolicies(state);
  let expectedSuccess = 0;

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    const correctAction = config.correctActions[stateIndex];
    let successGivenState = 0;

    for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
      successGivenState +=
        policies.senderPolicy[stateIndex][messageIndex] *
        policies.receiverPolicy[messageIndex][correctAction];
    }

    expectedSuccess += config.prior[stateIndex] * successGivenState;
  }

  return expectedSuccess;
}

/**
 * Computes exact mutual information I(S;M) in bits from the sender policy and state prior.
 */
export function calculateMutualInformationBits(
  state: SignalingGameState,
  config: SignalingGameConfig
): number {
  const { senderPolicy } = derivePolicies(state);
  const messageMarginals = Array.from({ length: config.numMessages }, () => 0);

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
      messageMarginals[messageIndex] +=
        config.prior[stateIndex] * senderPolicy[stateIndex][messageIndex];
    }
  }

  let mutualInformation = 0;
  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
      const conditionalProbability = senderPolicy[stateIndex][messageIndex];
      const jointProbability = config.prior[stateIndex] * conditionalProbability;
      const messageProbability = messageMarginals[messageIndex];

      if (jointProbability === 0 || conditionalProbability === 0 || messageProbability === 0) {
        continue;
      }

      mutualInformation +=
        jointProbability * log2Strict(conditionalProbability / messageProbability);
    }
  }

  return mutualInformation < 0 && mutualInformation > -1e-12 ? 0 : mutualInformation;
}

/**
 * Computes the maximum mutual information available for the current dimensions.
 */
export function calculateMaximumMutualInformationBits(config: SignalingGameConfig): number {
  return Math.log2(Math.min(config.numStates, config.numMessages));
}

/**
 * Returns the normalized mutual information when the maximum is positive.
 */
export function calculateNormalizedMutualInformation(
  state: SignalingGameState,
  config: SignalingGameConfig
): number | null {
  const maximum = calculateMaximumMutualInformationBits(config);
  if (maximum <= 0) {
    return null;
  }
  return calculateMutualInformationBits(state, config) / maximum;
}

/**
 * Computes the optional greedy sender/receiver diagnostic.
 */
export function calculateGreedyDiagnostic(
  state: SignalingGameState,
  config: SignalingGameConfig
): GreedyDiagnostic {
  const policies = derivePolicies(state);
  const senderMessageByState = policies.senderPolicy.map((row) => argMaxIndex(row));
  const receiverActionByMessage = policies.receiverPolicy.map((row) => argMaxIndex(row));
  const composedActionByState = senderMessageByState.map(
    (messageIndex) => receiverActionByMessage[messageIndex]
  );

  const eachStateHasUniqueMessage =
    new Set(senderMessageByState).size === config.numStates && config.numStates <= config.numMessages;
  const receiverMatchesCorrectAction = composedActionByState.every(
    (actionIndex, stateIndex) => actionIndex === config.correctActions[stateIndex]
  );

  return {
    senderMessageByState,
    receiverActionByMessage,
    composedActionByState,
    eachStateHasUniqueMessage,
    receiverMatchesCorrectAction,
  };
}

function calculateStateConditionalSuccesses(
  state: SignalingGameState,
  config: SignalingGameConfig
): number[] {
  const policies = derivePolicies(state);

  return Array.from({ length: config.numStates }, (_, stateIndex) => {
    const correctAction = config.correctActions[stateIndex];
    let successGivenState = 0;

    for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
      successGivenState +=
        policies.senderPolicy[stateIndex][messageIndex] *
        policies.receiverPolicy[messageIndex][correctAction];
    }

    return successGivenState;
  });
}

function calculateGreedyActByState(
  state: SignalingGameState,
  config: SignalingGameConfig
): number[] {
  const policies = derivePolicies(state);

  return Array.from({ length: config.numStates }, (_, stateIndex) => {
    const actionSupport = Array.from({ length: config.numActions }, () => 0);

    for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
      for (let actionIndex = 0; actionIndex < config.numActions; actionIndex += 1) {
        actionSupport[actionIndex] +=
          policies.senderPolicy[stateIndex][messageIndex] *
          policies.receiverPolicy[messageIndex][actionIndex];
      }
    }

    return argMaxIndex(actionSupport);
  });
}

function calculateAverageSenderDistribution(
  state: SignalingGameState,
  config: SignalingGameConfig
): number[] {
  const { senderPolicy } = derivePolicies(state);
  const messageAverages = Array.from({ length: config.numMessages }, () => 0);

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
      messageAverages[messageIndex] +=
        config.prior[stateIndex] * senderPolicy[stateIndex][messageIndex];
    }
  }

  return messageAverages;
}

function totalVariationDistance(left: readonly number[], right: readonly number[]): number {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    distance += Math.abs(left[index] - right[index]);
  }
  return distance / 2;
}

/**
 * Classifies the current policies into a coarse equilibrium-style regime for display.
 */
export function calculateEquilibriumDiagnostic(
  state: SignalingGameState,
  config: SignalingGameConfig
): EquilibriumDiagnostic {
  const policies = derivePolicies(state);
  const expectedSuccessRate = calculateExpectedSuccessRate(state, config);
  const stateConditionalSuccesses = calculateStateConditionalSuccesses(state, config);
  const greedyActByState = calculateGreedyActByState(state, config);
  const normalizedMutualInformation = calculateNormalizedMutualInformation(state, config) ?? 0;

  const looksLikeSignallingEquilibrium =
    expectedSuccessRate >= APPROXIMATE_SIGNALING_SUCCESS_THRESHOLD &&
    stateConditionalSuccesses.every(
      (successGivenState) => successGivenState >= APPROXIMATE_SIGNALING_STATE_SUCCESS_THRESHOLD
    ) &&
    greedyActByState.every(
      (actionIndex, stateIndex) => actionIndex === config.correctActions[stateIndex]
    );

  if (looksLikeSignallingEquilibrium) {
    return {
      kind: 'signalling-equilibrium',
      label: 'Signalling Equilibrium',
      detail:
        'The sender and receiver have approximately coordinated on a signalling system: each state tends to lead the receiver to the act that is correct for that state, even if some messages are redundant or synonymous.',
    };
  }

  const averageSenderDistribution = calculateAverageSenderDistribution(state, config);
  const maxSenderTotalVariation = Math.max(
    ...policies.senderPolicy.map((row) => totalVariationDistance(row, averageSenderDistribution))
  );
  const pooledActionDistribution = Array.from({ length: config.numActions }, () => 0);

  for (let messageIndex = 0; messageIndex < config.numMessages; messageIndex += 1) {
    for (let actionIndex = 0; actionIndex < config.numActions; actionIndex += 1) {
      pooledActionDistribution[actionIndex] +=
        averageSenderDistribution[messageIndex] * policies.receiverPolicy[messageIndex][actionIndex];
    }
  }

  const pooledActionIndex = argMaxIndex(pooledActionDistribution);
  const pooledActionSupport = pooledActionDistribution[pooledActionIndex];

  const looksLikePoolingEquilibrium =
    maxSenderTotalVariation <= APPROXIMATE_POOLING_TOTAL_VARIATION_THRESHOLD &&
    normalizedMutualInformation <= APPROXIMATE_POOLING_INFORMATION_THRESHOLD &&
    pooledActionSupport >= APPROXIMATE_POOLING_ACTION_THRESHOLD;

  if (looksLikePoolingEquilibrium) {
    return {
      kind: 'pooling-equilibrium',
      label: 'Pooling Equilibrium',
      detail:
        `The sender is using roughly the same message distribution in each state, so the message carries very little information about the state, and the receiver is tending toward A${pooledActionIndex}.`,
    };
  }

  return {
    kind: 'none',
    label: 'Not in a Signalling System',
    detail:
      'The sender and receiver have not yet coordinated on either a signalling system or a pooling equilibrium.',
  };
}

/**
 * Returns the stricter stable-signalling-system flag used for exact diagnostics.
 */
export function calculateStableSignalingSystem(
  state: SignalingGameState,
  config: SignalingGameConfig
): boolean {
  const greedyDiagnostic = calculateGreedyDiagnostic(state, config);
  const expectedSuccessRate = calculateExpectedSuccessRate(state, config);

  return (
    config.numStates === config.numMessages &&
    config.numStates === config.numActions &&
    greedyDiagnostic.eachStateHasUniqueMessage &&
    greedyDiagnostic.receiverMatchesCorrectAction &&
    expectedSuccessRate > STABLE_SIGNALING_EXPECTED_SUCCESS_THRESHOLD
  );
}

/**
 * Builds the exact metric bundle shown in the UI and stored in history.
 */
export function buildSignalingMetrics(options: {
  state: SignalingGameState;
  config: SignalingGameConfig;
  round: number;
  totalSuccesses: number;
  rollingSuccessRate: number;
}): SignalingMetrics {
  const expectedSuccessRate = calculateExpectedSuccessRate(options.state, options.config);
  const mutualInformationBits = calculateMutualInformationBits(options.state, options.config);
  const maxMutualInformationBits = calculateMaximumMutualInformationBits(options.config);
  const normalizedMutualInformation =
    maxMutualInformationBits > 0 ? mutualInformationBits / maxMutualInformationBits : null;
  const greedyDiagnostic = calculateGreedyDiagnostic(options.state, options.config);
  const equilibriumDiagnostic = calculateEquilibriumDiagnostic(options.state, options.config);
  const stableSignalingSystem = calculateStableSignalingSystem(options.state, options.config);
  const cumulativeSuccessRate =
    options.round === 0 ? 0 : options.totalSuccesses / options.round;

  return {
    round: options.round,
    seed: options.config.seed,
    cumulativeSuccessRate,
    rollingSuccessRate: options.round === 0 ? 0 : options.rollingSuccessRate,
    expectedSuccessRate,
    mutualInformationBits,
    maxMutualInformationBits,
    normalizedMutualInformation,
    totalSuccesses: options.totalSuccesses,
    greedyDiagnostic,
    equilibriumDiagnostic,
    stableSignalingSystem,
  };
}

import { argMaxIndex, log2Strict } from "../numeric";
import type {
  CompositionalApproximateRegime,
  CompositionalConfig,
  CompositionalGreedyDiagnostic,
  CompositionalMetrics,
  CompositionalPolicies,
  CompositionalTraditionalStructuralDiagnostic,
} from "./types";

const APPROXIMATE_SIGNALING_EXPECTED_SUCCESS_THRESHOLD = 0.85;
const APPROXIMATE_SIGNALING_STATE_SUCCESS_THRESHOLD = 0.7;
const APPROXIMATE_POOLING_TOTAL_VARIATION_THRESHOLD = 0.18;
const APPROXIMATE_POOLING_JOINT_INFORMATION_THRESHOLD = 0.2;
const APPROXIMATE_POOLING_ACTION_THRESHOLD = 0.65;
const STABLE_TRADITIONAL_EXPECTED_SUCCESS_THRESHOLD = 0.99;

function totalVariationDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    distance += Math.abs(left[index] - right[index]);
  }
  return distance / 2;
}

export function calculateCompositionalExpectedSuccessRate(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): number {
  let expectedSuccess = 0;

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    const correctAction = config.correctActions[stateIndex];
    let successGivenState = 0;

    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      for (
        let messageBIndex = 0;
        messageBIndex < config.numMessagesB;
        messageBIndex += 1
      ) {
        successGivenState +=
          policies.senderAPolicy[stateIndex][messageAIndex] *
          policies.senderBPolicy[stateIndex][messageBIndex] *
          policies.receiverPairPolicy[messageAIndex][messageBIndex][
            correctAction
          ];
      }
    }

    expectedSuccess += config.prior[stateIndex] * successGivenState;
  }

  return expectedSuccess;
}

export function calculateCompositionalSenderAMutualInformationBits(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): number {
  const messageMarginals = Array.from({ length: config.numMessagesA }, () => 0);

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      messageMarginals[messageAIndex] +=
        config.prior[stateIndex] *
        policies.senderAPolicy[stateIndex][messageAIndex];
    }
  }

  let mutualInformation = 0;
  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      const conditionalProbability =
        policies.senderAPolicy[stateIndex][messageAIndex];
      const jointProbability =
        config.prior[stateIndex] * conditionalProbability;
      const marginalProbability = messageMarginals[messageAIndex];

      if (
        jointProbability === 0 ||
        conditionalProbability === 0 ||
        marginalProbability === 0
      ) {
        continue;
      }

      mutualInformation +=
        jointProbability *
        log2Strict(conditionalProbability / marginalProbability);
    }
  }

  return mutualInformation < 0 && mutualInformation > -1e-12
    ? 0
    : mutualInformation;
}

export function calculateCompositionalSenderBMutualInformationBits(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): number {
  const messageMarginals = Array.from({ length: config.numMessagesB }, () => 0);

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      messageMarginals[messageBIndex] +=
        config.prior[stateIndex] *
        policies.senderBPolicy[stateIndex][messageBIndex];
    }
  }

  let mutualInformation = 0;
  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      const conditionalProbability =
        policies.senderBPolicy[stateIndex][messageBIndex];
      const jointProbability =
        config.prior[stateIndex] * conditionalProbability;
      const marginalProbability = messageMarginals[messageBIndex];

      if (
        jointProbability === 0 ||
        conditionalProbability === 0 ||
        marginalProbability === 0
      ) {
        continue;
      }

      mutualInformation +=
        jointProbability *
        log2Strict(conditionalProbability / marginalProbability);
    }
  }

  return mutualInformation < 0 && mutualInformation > -1e-12
    ? 0
    : mutualInformation;
}

export function calculateCompositionalJointMutualInformationBits(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): number {
  const pairMarginals = Array.from({ length: config.numMessagesA }, () =>
    Array.from({ length: config.numMessagesB }, () => 0),
  );

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      for (
        let messageBIndex = 0;
        messageBIndex < config.numMessagesB;
        messageBIndex += 1
      ) {
        pairMarginals[messageAIndex][messageBIndex] +=
          config.prior[stateIndex] *
          policies.senderAPolicy[stateIndex][messageAIndex] *
          policies.senderBPolicy[stateIndex][messageBIndex];
      }
    }
  }

  let mutualInformation = 0;
  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      for (
        let messageBIndex = 0;
        messageBIndex < config.numMessagesB;
        messageBIndex += 1
      ) {
        const conditionalProbability =
          policies.senderAPolicy[stateIndex][messageAIndex] *
          policies.senderBPolicy[stateIndex][messageBIndex];
        const jointProbability =
          config.prior[stateIndex] * conditionalProbability;
        const marginalProbability = pairMarginals[messageAIndex][messageBIndex];

        if (
          jointProbability === 0 ||
          conditionalProbability === 0 ||
          marginalProbability === 0
        ) {
          continue;
        }

        mutualInformation +=
          jointProbability *
          log2Strict(conditionalProbability / marginalProbability);
      }
    }
  }

  return mutualInformation < 0 && mutualInformation > -1e-12
    ? 0
    : mutualInformation;
}

export function calculateCompositionalSignalActionMutualInformationBits(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): number {
  const signalMarginals = Array.from({ length: config.numMessagesA }, () =>
    Array.from({ length: config.numMessagesB }, () => 0),
  );

  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      for (
        let messageBIndex = 0;
        messageBIndex < config.numMessagesB;
        messageBIndex += 1
      ) {
        signalMarginals[messageAIndex][messageBIndex] +=
          config.prior[stateIndex] *
          policies.senderAPolicy[stateIndex][messageAIndex] *
          policies.senderBPolicy[stateIndex][messageBIndex];
      }
    }
  }

  const actionMarginals = Array.from({ length: config.numActions }, () => 0);
  for (
    let messageAIndex = 0;
    messageAIndex < config.numMessagesA;
    messageAIndex += 1
  ) {
    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      const signalProbability = signalMarginals[messageAIndex][messageBIndex];
      if (signalProbability === 0) {
        continue;
      }

      for (
        let actionIndex = 0;
        actionIndex < config.numActions;
        actionIndex += 1
      ) {
        actionMarginals[actionIndex] +=
          signalProbability *
          policies.receiverPairPolicy[messageAIndex][messageBIndex][
            actionIndex
          ];
      }
    }
  }

  let mutualInformation = 0;
  for (
    let messageAIndex = 0;
    messageAIndex < config.numMessagesA;
    messageAIndex += 1
  ) {
    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      const signalProbability = signalMarginals[messageAIndex][messageBIndex];
      if (signalProbability === 0) {
        continue;
      }

      for (
        let actionIndex = 0;
        actionIndex < config.numActions;
        actionIndex += 1
      ) {
        const conditionalProbability =
          policies.receiverPairPolicy[messageAIndex][messageBIndex][
            actionIndex
          ];
        const jointProbability = signalProbability * conditionalProbability;
        const actionProbability = actionMarginals[actionIndex];

        if (
          jointProbability === 0 ||
          conditionalProbability === 0 ||
          actionProbability === 0
        ) {
          continue;
        }

        mutualInformation +=
          jointProbability *
          log2Strict(conditionalProbability / actionProbability);
      }
    }
  }

  return mutualInformation < 0 && mutualInformation > -1e-12
    ? 0
    : mutualInformation;
}

function calculateStateConditionalSuccesses(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): number[] {
  return Array.from({ length: config.numStates }, (_, stateIndex) => {
    const correctAction = config.correctActions[stateIndex];
    let successGivenState = 0;

    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      for (
        let messageBIndex = 0;
        messageBIndex < config.numMessagesB;
        messageBIndex += 1
      ) {
        successGivenState +=
          policies.senderAPolicy[stateIndex][messageAIndex] *
          policies.senderBPolicy[stateIndex][messageBIndex] *
          policies.receiverPairPolicy[messageAIndex][messageBIndex][
            correctAction
          ];
      }
    }

    return successGivenState;
  });
}

export function calculateCompositionalGreedyDiagnostic(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): CompositionalGreedyDiagnostic {
  const senderAMessageByState = policies.senderAPolicy.map((row) =>
    argMaxIndex(row),
  );
  const senderBMessageByState = policies.senderBPolicy.map((row) =>
    argMaxIndex(row),
  );
  const actionByPair = policies.receiverPairPolicy.map((rowA) =>
    rowA.map((rowB) => argMaxIndex(rowB)),
  );
  const greedyPairByState = senderAMessageByState.map(
    (messageAIndex, stateIndex) =>
      [messageAIndex, senderBMessageByState[stateIndex]] as const,
  );
  const composedActionByState = greedyPairByState.map(
    ([messageAIndex, messageBIndex]) =>
      actionByPair[messageAIndex][messageBIndex],
  );
  return {
    senderAMessageByState,
    senderBMessageByState,
    actionByPair,
    composedActionByState,
    greedyPairByState,
  };
}

export function calculateCompositionalTraditionalStructuralDiagnostic(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): CompositionalTraditionalStructuralDiagnostic {
  const greedyDiagnostic = calculateCompositionalGreedyDiagnostic(
    policies,
    config,
  );
  const expectedSuccessRate = calculateCompositionalExpectedSuccessRate(
    policies,
    config,
  );
  const senderAPartitionsByGarment =
    greedyDiagnostic.senderAMessageByState[0] ===
      greedyDiagnostic.senderAMessageByState[1] &&
    greedyDiagnostic.senderAMessageByState[2] ===
      greedyDiagnostic.senderAMessageByState[3] &&
    greedyDiagnostic.senderAMessageByState[0] !==
      greedyDiagnostic.senderAMessageByState[2];
  const senderBPartitionsByColour =
    greedyDiagnostic.senderBMessageByState[0] ===
      greedyDiagnostic.senderBMessageByState[2] &&
    greedyDiagnostic.senderBMessageByState[1] ===
      greedyDiagnostic.senderBMessageByState[3] &&
    greedyDiagnostic.senderBMessageByState[0] !==
      greedyDiagnostic.senderBMessageByState[1];

  return {
    stableTraditionalSignalingSystem:
      config.numStates === 4 &&
      config.numMessagesA === 2 &&
      config.numMessagesB === 2 &&
      config.numActions === 4 &&
      greedyDiagnostic.composedActionByState.every(
        (actionIndex, stateIndex) =>
          actionIndex === config.correctActions[stateIndex],
      ) &&
      senderAPartitionsByGarment &&
      senderBPartitionsByColour &&
      expectedSuccessRate > STABLE_TRADITIONAL_EXPECTED_SUCCESS_THRESHOLD,
    senderAPartitionsByGarment,
    senderBPartitionsByColour,
  };
}

export function calculateCompositionalStableTraditionalSignalingSystem(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): boolean {
  return calculateCompositionalTraditionalStructuralDiagnostic(policies, config)
    .stableTraditionalSignalingSystem;
}

export function calculateCompositionalApproximateRegime(
  policies: CompositionalPolicies,
  config: CompositionalConfig,
): CompositionalApproximateRegime {
  const expectedSuccessRate = calculateCompositionalExpectedSuccessRate(
    policies,
    config,
  );
  const stateConditionalSuccesses = calculateStateConditionalSuccesses(
    policies,
    config,
  );
  const greedyDiagnostic = calculateCompositionalGreedyDiagnostic(
    policies,
    config,
  );
  const jointMutualInformationBits =
    calculateCompositionalJointMutualInformationBits(policies, config);

  const looksLikeSignallingEquilibrium =
    expectedSuccessRate >= APPROXIMATE_SIGNALING_EXPECTED_SUCCESS_THRESHOLD &&
    stateConditionalSuccesses.every(
      (successGivenState) =>
        successGivenState >= APPROXIMATE_SIGNALING_STATE_SUCCESS_THRESHOLD,
    ) &&
    greedyDiagnostic.composedActionByState.every(
      (actionIndex, stateIndex) =>
        actionIndex === config.correctActions[stateIndex],
    );

  if (looksLikeSignallingEquilibrium) {
    return {
      kind: "signalling-equilibrium",
      label: "Signalling equilibrium",
      detail:
        "The senders are largely separating the states, and the receiver is largely matching each message pair with the corresponding act.",
    };
  }

  const averageSenderADistribution = Array.from(
    { length: config.numMessagesA },
    () => 0,
  );
  const averageSenderBDistribution = Array.from(
    { length: config.numMessagesB },
    () => 0,
  );
  for (let stateIndex = 0; stateIndex < config.numStates; stateIndex += 1) {
    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      averageSenderADistribution[messageAIndex] +=
        config.prior[stateIndex] *
        policies.senderAPolicy[stateIndex][messageAIndex];
    }
    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      averageSenderBDistribution[messageBIndex] +=
        config.prior[stateIndex] *
        policies.senderBPolicy[stateIndex][messageBIndex];
    }
  }

  const senderATotalVariation = Math.max(
    ...policies.senderAPolicy.map((row) =>
      totalVariationDistance(row, averageSenderADistribution),
    ),
  );
  const senderBTotalVariation = Math.max(
    ...policies.senderBPolicy.map((row) =>
      totalVariationDistance(row, averageSenderBDistribution),
    ),
  );

  const inducedActionDistribution = Array.from(
    { length: config.numActions },
    () => 0,
  );
  for (
    let messageAIndex = 0;
    messageAIndex < config.numMessagesA;
    messageAIndex += 1
  ) {
    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      const pairProbability =
        averageSenderADistribution[messageAIndex] *
        averageSenderBDistribution[messageBIndex];
      for (
        let actionIndex = 0;
        actionIndex < config.numActions;
        actionIndex += 1
      ) {
        inducedActionDistribution[actionIndex] +=
          pairProbability *
          policies.receiverPairPolicy[messageAIndex][messageBIndex][
            actionIndex
          ];
      }
    }
  }

  const pooledActionIndex = argMaxIndex(inducedActionDistribution);
  const pooledActionSupport = inducedActionDistribution[pooledActionIndex];

  if (
    senderATotalVariation <= APPROXIMATE_POOLING_TOTAL_VARIATION_THRESHOLD &&
    senderBTotalVariation <= APPROXIMATE_POOLING_TOTAL_VARIATION_THRESHOLD &&
    jointMutualInformationBits <=
      APPROXIMATE_POOLING_JOINT_INFORMATION_THRESHOLD &&
    pooledActionSupport >= APPROXIMATE_POOLING_ACTION_THRESHOLD
  ) {
    return {
      kind: "pooling-equilibrium",
      label: "Pooling equilibrium",
      detail: `Both senders are using roughly the same messages across states, so the message pair carries little state information and the receiver is tending toward act ${pooledActionIndex}.`,
    };
  }

  return {
    kind: "not-yet-coordinated",
    label: "Not yet coordinated",
    detail:
      "The population has not yet coordinated on either a signalling equilibrium or a pooling equilibrium.",
  };
}

export function buildCompositionalMetrics(options: {
  policies: CompositionalPolicies;
  config: CompositionalConfig;
  round: number;
  totalSuccesses: number;
  rollingSuccessRate: number;
}): CompositionalMetrics {
  const expectedSuccessRate = calculateCompositionalExpectedSuccessRate(
    options.policies,
    options.config,
  );
  const senderAMutualInformationBits =
    calculateCompositionalSenderAMutualInformationBits(
      options.policies,
      options.config,
    );
  const senderBMutualInformationBits =
    calculateCompositionalSenderBMutualInformationBits(
      options.policies,
      options.config,
    );
  const jointMutualInformationBits =
    calculateCompositionalJointMutualInformationBits(
      options.policies,
      options.config,
    );
  const greedyDiagnostic = calculateCompositionalGreedyDiagnostic(
    options.policies,
    options.config,
  );
  const traditionalStructuralDiagnostic =
    calculateCompositionalTraditionalStructuralDiagnostic(
      options.policies,
      options.config,
    );
  const approximateRegime = calculateCompositionalApproximateRegime(
    options.policies,
    options.config,
  );
  const cumulativeSuccessRate =
    options.round === 0 ? 0 : options.totalSuccesses / options.round;

  return {
    round: options.round,
    seed: options.config.seed,
    cumulativeSuccessRate,
    rollingSuccessRate: options.round === 0 ? 0 : options.rollingSuccessRate,
    expectedSuccessRate,
    senderAMutualInformationBits,
    senderBMutualInformationBits,
    jointMutualInformationBits,
    greedyDiagnostic,
    approximateRegime,
    traditionalStructuralDiagnostic,
    totalSuccesses: options.totalSuccesses,
  };
}

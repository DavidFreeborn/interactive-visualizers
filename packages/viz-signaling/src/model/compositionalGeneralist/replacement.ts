import { calculateCompositionalGreedyDiagnostic } from "../compositionalShared/metrics";
import type { CompositionalConfig } from "../compositionalShared/types";
import {
  deriveCompositionalGeneralistPolicies,
  cloneCompositionalGeneralistState,
} from "./compositionalGame";
import type {
  CompositionalGeneralistReplacementExperimentResult,
  CompositionalGeneralistReplacementSpec,
  CompositionalGeneralistState,
} from "./types";

/**
 * Explicit replacement harness for the two Generalist variants in this fixed
 * 4x(2+2)x4 app. Ordinary play does not call these helpers, so the two
 * Generalist variants remain identical until an explicit replacement
 * experiment is invoked.
 *
 * The preserving path below is an app-level operationalization of the paper's
 * independence-style idea: the novel message starts from flat ignorance, while
 * affected pair rows preserve only the surviving component's contribution.
 *
 * In this fixed 4x(2+2)x4 app, the preserving initializer does that by reading
 * the surviving component's learned pair rows to infer which action family the
 * surviving component currently supports, even when the run has settled on a
 * symmetric relabeling or a sender-role swap. It then preserves that family
 * with the stronger of the surviving pair-family evidence and the surviving
 * atomic family evidence. Within-family distinctions that depended on the
 * forgotten component are discarded. This is still an app-level
 * operationalization, not a claim to implement the paper's most general
 * probabilistic formulation.
 */

function createFlatNovelMessageActionWeights(
  config: CompositionalConfig,
): number[] {
  return Array.from(
    { length: config.numActions },
    () => config.initialReinforcement,
  );
}

function createFlatNovelPairObservationWeight(
  config: CompositionalConfig,
): number {
  return config.initialReinforcement;
}

function createFlatNovelPairActionWeights(
  config: CompositionalConfig,
): number[] {
  return createFlatNovelMessageActionWeights(config);
}

function deriveActionIndicesForAFeature(
  actionAFeatureIndex: number,
  config: CompositionalConfig,
): number[] {
  return Array.from({ length: config.numActions }, (_, actionIndex) =>
    Math.floor(actionIndex / config.numMessagesB) === actionAFeatureIndex
      ? actionIndex
      : -1,
  ).filter((actionIndex) => actionIndex >= 0);
}

function deriveActionIndicesForBFeature(
  actionBFeatureIndex: number,
  config: CompositionalConfig,
): number[] {
  return Array.from({ length: config.numActions }, (_, actionIndex) =>
    actionIndex % config.numMessagesB === actionBFeatureIndex
      ? actionIndex
      : -1,
  ).filter((actionIndex) => actionIndex >= 0);
}

function calculateCompatibleFamilyEvidence(options: {
  rows: ReadonlyArray<readonly number[]>;
  compatibleActionIndices: readonly number[];
  config: CompositionalConfig;
}): number {
  return options.rows.reduce(
    (sum, row) =>
      sum +
      options.compatibleActionIndices.reduce(
        (candidateSum, actionIndex) =>
          candidateSum +
          Math.max(0, row[actionIndex] - options.config.initialReinforcement),
        0,
      ),
    0,
  );
}

function deriveConsistentActionFamiliesForSurvivingSenderA(options: {
  state: CompositionalGeneralistState;
  replacedMessageIndex: number;
  config: CompositionalConfig;
}): number[][] {
  const survivingRowsByMessageA = Array.from(
    { length: options.config.numMessagesA },
    (_, messageAIndex) =>
      Array.from({ length: options.config.numMessagesB }, (_, messageBIndex) => ({
        messageAIndex,
        messageBIndex,
      }))
        .filter(
          ({ messageBIndex }) => messageBIndex !== options.replacedMessageIndex,
        )
        .map(
          ({ messageAIndex, messageBIndex }) =>
            options.state.receiverPairActionWeights[messageAIndex][messageBIndex],
        ),
  );
  const candidateDimensions = [
    Array.from({ length: options.config.numMessagesA }, (_, featureIndex) =>
      deriveActionIndicesForAFeature(featureIndex, options.config),
    ),
    Array.from({ length: options.config.numMessagesB }, (_, featureIndex) =>
      deriveActionIndicesForBFeature(featureIndex, options.config),
    ),
  ];
  let bestAssignment = candidateDimensions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidateFamilies of candidateDimensions) {
    const identityScore =
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageA[0],
        compatibleActionIndices: candidateFamilies[0],
        config: options.config,
      }) +
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageA[1],
        compatibleActionIndices: candidateFamilies[1],
        config: options.config,
      });
    const swappedScore =
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageA[0],
        compatibleActionIndices: candidateFamilies[1],
        config: options.config,
      }) +
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageA[1],
        compatibleActionIndices: candidateFamilies[0],
        config: options.config,
      });
    const assignment =
      swappedScore > identityScore
        ? [candidateFamilies[1], candidateFamilies[0]]
        : [candidateFamilies[0], candidateFamilies[1]];
    const score = Math.max(identityScore, swappedScore);

    if (score > bestScore) {
      bestScore = score;
      bestAssignment = assignment;
    }
  }

  return bestAssignment;
}

function deriveConsistentActionFamiliesForSurvivingSenderB(options: {
  state: CompositionalGeneralistState;
  replacedMessageIndex: number;
  config: CompositionalConfig;
}): number[][] {
  const survivingRowsByMessageB = Array.from(
    { length: options.config.numMessagesB },
    (_, messageBIndex) =>
      Array.from({ length: options.config.numMessagesA }, (_, messageAIndex) => ({
        messageAIndex,
        messageBIndex,
      }))
        .filter(
          ({ messageAIndex }) => messageAIndex !== options.replacedMessageIndex,
        )
        .map(
          ({ messageAIndex, messageBIndex }) =>
            options.state.receiverPairActionWeights[messageAIndex][messageBIndex],
        ),
  );
  const candidateDimensions = [
    Array.from({ length: options.config.numMessagesA }, (_, featureIndex) =>
      deriveActionIndicesForAFeature(featureIndex, options.config),
    ),
    Array.from({ length: options.config.numMessagesB }, (_, featureIndex) =>
      deriveActionIndicesForBFeature(featureIndex, options.config),
    ),
  ];
  let bestAssignment = candidateDimensions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidateFamilies of candidateDimensions) {
    const identityScore =
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageB[0],
        compatibleActionIndices: candidateFamilies[0],
        config: options.config,
      }) +
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageB[1],
        compatibleActionIndices: candidateFamilies[1],
        config: options.config,
      });
    const swappedScore =
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageB[0],
        compatibleActionIndices: candidateFamilies[1],
        config: options.config,
      }) +
      calculateCompatibleFamilyEvidence({
        rows: survivingRowsByMessageB[1],
        compatibleActionIndices: candidateFamilies[0],
        config: options.config,
      });
    const assignment =
      swappedScore > identityScore
        ? [candidateFamilies[1], candidateFamilies[0]]
        : [candidateFamilies[0], candidateFamilies[1]];
    const score = Math.max(identityScore, swappedScore);

    if (score > bestScore) {
      bestScore = score;
      bestAssignment = assignment;
    }
  }

  return bestAssignment;
}

function derivePreservedPairObservationWeightFromPairEvidence(
  survivingPairObservationWeights: readonly number[],
  config: CompositionalConfig,
): number {
  if (survivingPairObservationWeights.length === 0) {
    return createFlatNovelPairObservationWeight(config);
  }

  const averageObservationWeight =
    survivingPairObservationWeights.reduce((sum, weight) => sum + weight, 0) /
    survivingPairObservationWeights.length;

  return Math.max(
    createFlatNovelPairObservationWeight(config),
    averageObservationWeight,
  );
}

function operationalizePreservedNovelPairActionWeightsFromPairEvidence(options: {
  survivingPairActionWeights: ReadonlyArray<readonly number[]>;
  survivingAtomicActionWeights: readonly number[];
  compatibleActionIndices: readonly number[];
  config: CompositionalConfig;
}): number[] {
  if (
    options.survivingPairActionWeights.length === 0 ||
    options.compatibleActionIndices.length === 0
  ) {
    return createFlatNovelPairActionWeights(options.config);
  }

  const averageCompatibleSurplusEvidenceFromPairRows =
    options.survivingPairActionWeights.reduce((sum, row) => {
      const compatibleSurplusForRow = options.compatibleActionIndices.reduce(
        (compatibleSum, actionIndex) =>
          compatibleSum +
          Math.max(0, row[actionIndex] - options.config.initialReinforcement),
        0,
      );

      return sum + compatibleSurplusForRow;
    }, 0) / options.survivingPairActionWeights.length;
  const averageCompatibleSurplusEvidenceFromAtomicRow =
    options.compatibleActionIndices.reduce(
      (sum, actionIndex) =>
        sum +
        Math.max(
          0,
          options.survivingAtomicActionWeights[actionIndex] -
            options.config.initialReinforcement,
        ),
      0,
    ) / options.compatibleActionIndices.length;
  const preservedCompatibleActionSurplus = Math.max(
    averageCompatibleSurplusEvidenceFromPairRows,
    averageCompatibleSurplusEvidenceFromAtomicRow,
  );

  return Array.from({ length: options.config.numActions }, (_, actionIndex) =>
    options.compatibleActionIndices.includes(actionIndex)
      ? options.config.initialReinforcement + preservedCompatibleActionSurplus
      : options.config.initialReinforcement,
  );
}

function derivePreservedPairActionProfileFromSurvivingAComponent(options: {
  state: CompositionalGeneralistState;
  pair: {
    messageAIndex: number;
    messageBIndex: number;
  };
  compatibleActionIndices: readonly number[];
  replacedMessageIndex: number;
  config: CompositionalConfig;
}): {
  preservedObservationWeight: number;
  preservedPairActionWeights: number[];
} {
  const survivingMessageBIndices = Array.from(
    { length: options.config.numMessagesB },
    (_, messageBIndex) => messageBIndex,
  ).filter((messageBIndex) => messageBIndex !== options.replacedMessageIndex);
  const survivingPairActionWeights = survivingMessageBIndices.map(
    (messageBIndex) =>
      options.state.receiverPairActionWeights[options.pair.messageAIndex][
        messageBIndex
      ],
  );

  return {
    preservedObservationWeight: derivePreservedPairObservationWeightFromPairEvidence(
      survivingMessageBIndices.map(
        (messageBIndex) =>
          options.state.receiverPairObservationWeights[options.pair.messageAIndex][
            messageBIndex
          ],
      ),
      options.config,
    ),
    preservedPairActionWeights:
      operationalizePreservedNovelPairActionWeightsFromPairEvidence({
        survivingPairActionWeights,
        survivingAtomicActionWeights:
          options.state.receiverAtomicAActionWeights[options.pair.messageAIndex],
        compatibleActionIndices: options.compatibleActionIndices,
        config: options.config,
      }),
  };
}

function derivePreservedPairActionProfileFromSurvivingBComponent(options: {
  state: CompositionalGeneralistState;
  pair: {
    messageAIndex: number;
    messageBIndex: number;
  };
  compatibleActionIndices: readonly number[];
  replacedMessageIndex: number;
  config: CompositionalConfig;
}): {
  preservedObservationWeight: number;
  preservedPairActionWeights: number[];
} {
  const survivingMessageAIndices = Array.from(
    { length: options.config.numMessagesA },
    (_, messageAIndex) => messageAIndex,
  ).filter((messageAIndex) => messageAIndex !== options.replacedMessageIndex);
  const survivingPairActionWeights = survivingMessageAIndices.map(
    (messageAIndex) =>
      options.state.receiverPairActionWeights[messageAIndex][
        options.pair.messageBIndex
      ],
  );

  return {
    preservedObservationWeight: derivePreservedPairObservationWeightFromPairEvidence(
      survivingMessageAIndices.map(
        (messageAIndex) =>
          options.state.receiverPairObservationWeights[messageAIndex][
            options.pair.messageBIndex
          ],
      ),
      options.config,
    ),
    preservedPairActionWeights:
      operationalizePreservedNovelPairActionWeightsFromPairEvidence({
        survivingPairActionWeights,
        survivingAtomicActionWeights:
          options.state.receiverAtomicBActionWeights[options.pair.messageBIndex],
        compatibleActionIndices: options.compatibleActionIndices,
        config: options.config,
      }),
  };
}

function initializeAffectedPairByPreservingSurvivingAComponentPairEvidence(
  options: {
    nextState: CompositionalGeneralistState;
    state: CompositionalGeneralistState;
    config: CompositionalConfig;
    pair: {
      messageAIndex: number;
      messageBIndex: number;
    };
    compatibleActionIndices: readonly number[];
    replacedMessageIndex: number;
  },
): void {
  const preservedPairProfile = derivePreservedPairActionProfileFromSurvivingAComponent(
    {
      state: options.state,
      pair: options.pair,
      compatibleActionIndices: options.compatibleActionIndices,
      replacedMessageIndex: options.replacedMessageIndex,
      config: options.config,
    },
  );

  options.nextState.receiverPairObservationWeights[options.pair.messageAIndex][
    options.pair.messageBIndex
  ] = preservedPairProfile.preservedObservationWeight;
  options.nextState.receiverPairActionWeights[options.pair.messageAIndex][
    options.pair.messageBIndex
  ] = preservedPairProfile.preservedPairActionWeights;
}

function initializeAffectedPairByPreservingSurvivingBComponentPairEvidence(
  options: {
    nextState: CompositionalGeneralistState;
    state: CompositionalGeneralistState;
    config: CompositionalConfig;
    pair: {
      messageAIndex: number;
      messageBIndex: number;
    };
    compatibleActionIndices: readonly number[];
    replacedMessageIndex: number;
  },
): void {
  const preservedPairProfile = derivePreservedPairActionProfileFromSurvivingBComponent(
    {
      state: options.state,
      pair: options.pair,
      compatibleActionIndices: options.compatibleActionIndices,
      replacedMessageIndex: options.replacedMessageIndex,
      config: options.config,
    },
  );

  options.nextState.receiverPairObservationWeights[options.pair.messageAIndex][
    options.pair.messageBIndex
  ] = preservedPairProfile.preservedObservationWeight;
  options.nextState.receiverPairActionWeights[options.pair.messageAIndex][
    options.pair.messageBIndex
  ] = preservedPairProfile.preservedPairActionWeights;
}

function resetReplacedMessageStructuresToFlatIgnorance(
  nextState: CompositionalGeneralistState,
  config: CompositionalConfig,
  spec: CompositionalGeneralistReplacementSpec,
): void {
  if (spec.replacedSender === "a") {
    nextState.senderAWeights.forEach((row) => {
      row[spec.replacedMessageIndex] = config.initialReinforcement;
    });
    nextState.receiverAObservationWeights[spec.replacedMessageIndex] =
      config.initialReinforcement;
    nextState.receiverAtomicAActionWeights[spec.replacedMessageIndex] =
      createFlatNovelMessageActionWeights(config);
    return;
  }

  nextState.senderBWeights.forEach((row) => {
    row[spec.replacedMessageIndex] = config.initialReinforcement;
  });
  nextState.receiverBObservationWeights[spec.replacedMessageIndex] =
    config.initialReinforcement;
  nextState.receiverAtomicBActionWeights[spec.replacedMessageIndex] =
    createFlatNovelMessageActionWeights(config);
}

function initializeAffectedPairWithFlatIgnorance(
  nextState: CompositionalGeneralistState,
  config: CompositionalConfig,
  pair: {
    messageAIndex: number;
    messageBIndex: number;
  },
): void {
  nextState.receiverPairObservationWeights[pair.messageAIndex][
    pair.messageBIndex
  ] = createFlatNovelPairObservationWeight(config);
  nextState.receiverPairActionWeights[pair.messageAIndex][pair.messageBIndex] =
    createFlatNovelPairActionWeights(config);
}

export function applyCompositionalGeneralistMessageReplacement(
  state: CompositionalGeneralistState,
  config: CompositionalConfig,
  spec: CompositionalGeneralistReplacementSpec,
): CompositionalGeneralistState {
  const nextState = cloneCompositionalGeneralistState(state);
  resetReplacedMessageStructuresToFlatIgnorance(nextState, config, spec);

  if (spec.replacedSender === "a") {
    const compatibleActionFamiliesByMessageB =
      deriveConsistentActionFamiliesForSurvivingSenderB({
        state,
        replacedMessageIndex: spec.replacedMessageIndex,
        config,
      });

    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      if (spec.variant === "information-preserving") {
        initializeAffectedPairByPreservingSurvivingBComponentPairEvidence({
          nextState,
          state,
          config,
          pair: {
            messageAIndex: spec.replacedMessageIndex,
            messageBIndex,
          },
          compatibleActionIndices:
            compatibleActionFamiliesByMessageB[messageBIndex],
          replacedMessageIndex: spec.replacedMessageIndex,
        });
      } else {
        initializeAffectedPairWithFlatIgnorance(nextState, config, {
          messageAIndex: spec.replacedMessageIndex,
          messageBIndex,
        });
      }
    }

    return nextState;
  }

  const compatibleActionFamiliesByMessageA =
    deriveConsistentActionFamiliesForSurvivingSenderA({
      state,
      replacedMessageIndex: spec.replacedMessageIndex,
      config,
    });

  for (
    let messageAIndex = 0;
    messageAIndex < config.numMessagesA;
    messageAIndex += 1
  ) {
    if (spec.variant === "information-preserving") {
      initializeAffectedPairByPreservingSurvivingAComponentPairEvidence({
        nextState,
        state,
        config,
        pair: {
          messageAIndex,
          messageBIndex: spec.replacedMessageIndex,
        },
        compatibleActionIndices:
          compatibleActionFamiliesByMessageA[messageAIndex],
        replacedMessageIndex: spec.replacedMessageIndex,
      });
    } else {
      initializeAffectedPairWithFlatIgnorance(nextState, config, {
        messageAIndex,
        messageBIndex: spec.replacedMessageIndex,
      });
    }
  }

  return nextState;
}

export function runCompositionalGeneralistReplacementExperiment(options: {
  state: CompositionalGeneralistState;
  config: CompositionalConfig;
  spec: CompositionalGeneralistReplacementSpec;
}): CompositionalGeneralistReplacementExperimentResult {
  const preReplacementPolicies = deriveCompositionalGeneralistPolicies(
    options.state,
  );
  const postReplacementState = applyCompositionalGeneralistMessageReplacement(
    options.state,
    options.config,
    options.spec,
  );
  const postReplacementPolicies =
    deriveCompositionalGeneralistPolicies(postReplacementState);
  const preReplacementGreedyDiagnostic = calculateCompositionalGreedyDiagnostic(
    preReplacementPolicies,
    options.config,
  );
  const affectedStates = preReplacementGreedyDiagnostic.greedyPairByState
    .map(([messageAIndex, messageBIndex], stateIndex) => {
      const matchesReplacedMessage =
        options.spec.replacedSender === "a"
          ? messageAIndex === options.spec.replacedMessageIndex
          : messageBIndex === options.spec.replacedMessageIndex;

      return matchesReplacedMessage ? stateIndex : -1;
    })
    .filter((stateIndex) => stateIndex >= 0);
  const affectedPairs = affectedStates.map(
    (stateIndex) =>
      preReplacementGreedyDiagnostic.greedyPairByState[stateIndex] as readonly [
        number,
        number,
      ],
  );
  const affectedCorrectActionProbability =
    affectedStates.length === 0
      ? 0
      : affectedStates.reduce((sum, stateIndex) => {
          const [messageAIndex, messageBIndex] =
            preReplacementGreedyDiagnostic.greedyPairByState[stateIndex];

          return (
            sum +
            postReplacementPolicies.receiverPairPolicy[messageAIndex][
              messageBIndex
            ][options.config.correctActions[stateIndex]]
          );
        }, 0) / affectedStates.length;

  return {
    preReplacementPolicies,
    postReplacementState,
    postReplacementPolicies,
    affectedStates,
    affectedPairs,
    affectedCorrectActionProbability,
  };
}

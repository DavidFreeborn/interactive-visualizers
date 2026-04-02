import { SeededPrng } from "../prng";
import { normalizeRow, sampleCategorical } from "../numeric";
import {
  applyContrastiveSignalingBiasToRow,
  cloneMatrix,
  clonePairTensor,
  createFilledPairTensor,
  createInitialSenderWeights,
  deriveSenderPolicies,
  reinforceSenderWeights,
} from "../compositionalShared/modelUtils";
import type { CompositionalModelDefinition } from "../compositionalShared";
import type {
  CompositionalTraditionalConfig,
  CompositionalTraditionalPolicies,
  CompositionalTraditionalRoundEvent,
  CompositionalTraditionalState,
} from "./types";
import { applyCompositionalTraditionalMessageReplacement } from "./forgetting";

export const COMPOSITIONAL_TRADITIONAL_REFERENCE =
  "Barrett JA, Cochran C, Skyrms B. On the Evolution of Compositional Language. Philosophy of Science. 2020;87(5):910-920. doi:10.1086/710367";

export const COMPOSITIONAL_TRADITIONAL_REFERENCE_URL =
  "https://www.cambridge.org/core/journals/philosophy-of-science/article/abs/on-the-evolution-of-compositional-language/E65AF2A9D2DB2B8E3C8B4AA0C7273592";

/**
 * Creates the initial learned weight state for the traditional compositional game.
 */
export function createInitialCompositionalTraditionalState(
  config: CompositionalTraditionalConfig,
): CompositionalTraditionalState {
  return {
    ...createInitialSenderWeights(config),
    receiverPairWeights: createFilledPairTensor(
      config.numMessagesA,
      config.numMessagesB,
      config.numActions,
      config.initialReinforcement,
    ),
  };
}

/**
 * Returns normalized sender and receiver policies derived from the current weights.
 */
export function deriveCompositionalTraditionalPolicies(
  state: CompositionalTraditionalState,
): CompositionalTraditionalPolicies {
  return {
    ...deriveSenderPolicies(state),
    receiverPairPolicy: state.receiverPairWeights.map((rowA) =>
      rowA.map((rowB) => normalizeRow(rowB)),
    ),
  };
}

/**
 * Reinforces only the sampled successful choices from the current round.
 */
export function reinforceSuccessfulTraditionalRound(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig,
  update: {
    stateIndex: number;
    messageAIndex: number;
    messageBIndex: number;
    actionIndex: number;
  },
): CompositionalTraditionalState {
  const { senderAWeights, senderBWeights } = reinforceSenderWeights(
    state,
    update,
  );
  const receiverPairWeights = clonePairTensor(state.receiverPairWeights);
  receiverPairWeights[update.messageAIndex][update.messageBIndex][
    update.actionIndex
  ] += 1;

  if (config.signalingBiasEnabled) {
    senderAWeights[update.stateIndex] = applyContrastiveSignalingBiasToRow(
      senderAWeights[update.stateIndex],
      update.messageAIndex,
      config,
    );
    senderBWeights[update.stateIndex] = applyContrastiveSignalingBiasToRow(
      senderBWeights[update.stateIndex],
      update.messageBIndex,
      config,
    );
    receiverPairWeights[update.messageAIndex][update.messageBIndex] =
      applyContrastiveSignalingBiasToRow(
        receiverPairWeights[update.messageAIndex][update.messageBIndex],
        update.actionIndex,
        config,
      );
  }

  return {
    senderAWeights,
    senderBWeights,
    receiverPairWeights,
  };
}

/**
 * Plays exactly one traditional compositional signaling round.
 */
export function playCompositionalTraditionalRound(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig,
  prng: SeededPrng,
  round: number,
): {
  nextState: CompositionalTraditionalState;
  event: CompositionalTraditionalRoundEvent;
} {
  const stateIndex = sampleCategorical(config.prior, prng);
  const messageAIndex = sampleCategorical(
    state.senderAWeights[stateIndex],
    prng,
  );
  const messageBIndex = sampleCategorical(
    state.senderBWeights[stateIndex],
    prng,
  );
  const actionIndex = sampleCategorical(
    state.receiverPairWeights[messageAIndex][messageBIndex],
    prng,
  );
  const success = actionIndex === config.correctActions[stateIndex];
  const reward: 0 | 1 = success ? 1 : 0;

  return {
    nextState: success
      ? reinforceSuccessfulTraditionalRound(
          state,
          config,
          {
            stateIndex,
            messageAIndex,
            messageBIndex,
            actionIndex,
          },
        )
      : state,
    event: {
      round,
      stateIndex,
      messageAIndex,
      messageBIndex,
      actionIndex,
      reward,
      success,
    },
  };
}

export const compositionalTraditionalModel: CompositionalModelDefinition<CompositionalTraditionalState> =
  {
    type: "traditional",
    label: "Traditional",
    description: "Barrett-style receiver that learns message pairs atomically.",
    reference: COMPOSITIONAL_TRADITIONAL_REFERENCE,
    referenceUrl: COMPOSITIONAL_TRADITIONAL_REFERENCE_URL,
    showsTraditionalStructureDiagnostics: true,
    createInitialState: createInitialCompositionalTraditionalState,
    cloneState(state) {
      return {
        senderAWeights: cloneMatrix(state.senderAWeights),
        senderBWeights: cloneMatrix(state.senderBWeights),
        receiverPairWeights: clonePairTensor(state.receiverPairWeights),
      };
    },
    derivePolicies: deriveCompositionalTraditionalPolicies,
    playRound: playCompositionalTraditionalRound,
    applyMessageReplacement: applyCompositionalTraditionalMessageReplacement,
  };

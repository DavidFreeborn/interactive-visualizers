import { SeededPrng } from "../prng";
import { createFilledMatrix, sampleCategorical } from "../numeric";
import {
  cloneMatrix,
  createInitialSenderWeights,
  deriveSenderPolicies,
  reinforceSenderWeights,
  temperedSoftmax,
} from "../compositionalShared/modelUtils";
import {
  COMPOSITIONAL_GENERALIST_REFERENCE,
  COMPOSITIONAL_GENERALIST_REFERENCE_URL,
} from "../compositionalGeneralist/compositionalGame";
import type {
  CompositionalModelDefinition,
  PairTensor,
} from "../compositionalShared";
import type {
  CompositionalMinimalistConfig,
  CompositionalMinimalistPolicies,
  CompositionalMinimalistRoundEvent,
  CompositionalMinimalistState,
} from "./types";
import { applyCompositionalMinimalistMessageReplacement } from "./forgetting";

// A moderate temperature keeps pair policies visibly sharpened without making
// small atomic-weight differences dominate too aggressively in the app.
export const COMPOSITIONAL_MINIMALIST_TEMPERATURE = 5;

function getMinimalistSignalingBiasStrength(
  config: Pick<
    CompositionalMinimalistConfig,
    "signalingBiasStrength"
  >,
): number {
  // Minimalist pair policies are assembled from two atomic action rows rather
  // than a stored pair-action urn, so a slightly stronger local contrastive
  // decay helps successful atomic cues separate without introducing any
  // preferred signaling arrangement in advance.
  return Math.min(0.12, config.signalingBiasStrength * 1.5);
}

function getMinimalistSignalingBiasFloorValue(
  config: Pick<CompositionalMinimalistConfig, "initialReinforcement">,
): number {
  // The Minimalist bias needs to be able to break near-baseline ties across
  // atomic rows and sibling sender rows; keeping the floor strictly below the
  // initial reinforcement lets successful asymmetries start to matter while
  // preserving positive weights.
  return Math.max(0.25, config.initialReinforcement * 0.25);
}

function getMinimalistCompatiblePartnerBoost(
  config: Pick<CompositionalMinimalistConfig, "signalingBiasStrength">,
): number {
  return Math.min(0.5, Math.max(0.2, getMinimalistSignalingBiasStrength(config) * 4));
}

function applyMinimalistLocalSenderBiasToRow(
  row: readonly number[],
  chosenIndex: number,
  config: Pick<
    CompositionalMinimalistConfig,
    "initialReinforcement" | "signalingBiasStrength"
  >,
): number[] {
  const floorValue = getMinimalistSignalingBiasFloorValue(config);
  const decayFactor = 1 - getMinimalistSignalingBiasStrength(config);

  return row.map((value, index) => {
    if (index === chosenIndex) {
      return value;
    }

    return Math.max(floorValue, value * decayFactor);
  });
}

function getMinimalistAtomicFeatureIndex(
  actionIndex: number,
  component: "a" | "b",
  config: Pick<CompositionalMinimalistConfig, "numMessagesB">,
): number {
  return component === "a"
    ? Math.floor(actionIndex / config.numMessagesB)
    : actionIndex % config.numMessagesB;
}

function getMinimalistStateFeatureIndex(
  stateIndex: number,
  component: "a" | "b",
  config: Pick<CompositionalMinimalistConfig, "numMessagesB">,
): number {
  return component === "a"
    ? Math.floor(stateIndex / config.numMessagesB)
    : stateIndex % config.numMessagesB;
}

function applyMinimalistAtomicActionBiasToRow(
  row: readonly number[],
  actionIndex: number,
  component: "a" | "b",
  config: Pick<
    CompositionalMinimalistConfig,
    "initialReinforcement" | "signalingBiasStrength" | "numMessagesB"
  >,
): number[] {
  const floorValue = getMinimalistSignalingBiasFloorValue(config);
  const decayFactor = 1 - getMinimalistSignalingBiasStrength(config);
  const compatiblePartnerBoost = getMinimalistCompatiblePartnerBoost(config);
  const retainedFeatureIndex = getMinimalistAtomicFeatureIndex(
    actionIndex,
    component,
    config,
  );

  return row.map((value, candidateActionIndex) => {
    if (candidateActionIndex === actionIndex) {
      return value;
    }

    const candidateFeatureIndex = getMinimalistAtomicFeatureIndex(
      candidateActionIndex,
      component,
      config,
    );

    if (candidateFeatureIndex === retainedFeatureIndex) {
      return value + compatiblePartnerBoost;
    }

    return Math.max(floorValue, value * decayFactor);
  });
}

function applyMinimalistCompetingAtomicRowBias(
  row: readonly number[],
  actionIndex: number,
  component: "a" | "b",
  config: Pick<
    CompositionalMinimalistConfig,
    "initialReinforcement" | "signalingBiasStrength" | "numMessagesB"
  >,
): number[] {
  const floorValue = getMinimalistSignalingBiasFloorValue(config);
  const decayFactor = 1 - getMinimalistSignalingBiasStrength(config);
  const featureIndexToRelease = getMinimalistAtomicFeatureIndex(
    actionIndex,
    component,
    config,
  );

  return row.map((value, candidateActionIndex) => {
    const candidateFeatureIndex = getMinimalistAtomicFeatureIndex(
      candidateActionIndex,
      component,
      config,
    );

    if (candidateFeatureIndex !== featureIndexToRelease) {
      return value;
    }

    return Math.max(floorValue, value * decayFactor);
  });
}

function applyMinimalistStructuredSenderBias(
  weights: readonly number[][],
  update: {
    stateIndex: number;
    messageIndex: number;
  },
  component: "a" | "b",
  config: Pick<
    CompositionalMinimalistConfig,
    "initialReinforcement" | "signalingBiasStrength" | "numMessagesB"
  >,
): number[][] {
  const floorValue = getMinimalistSignalingBiasFloorValue(config);
  const decayFactor = 1 - getMinimalistSignalingBiasStrength(config);
  const retainedFeatureIndex = getMinimalistStateFeatureIndex(
    update.stateIndex,
    component,
    config,
  );

  return weights.map((row, rowStateIndex) => {
    if (rowStateIndex === update.stateIndex) {
      return row;
    }

    const rowFeatureIndex = getMinimalistStateFeatureIndex(
      rowStateIndex,
      component,
      config,
    );

    return row.map((value, messageIndex) => {
      if (rowFeatureIndex === retainedFeatureIndex) {
        if (messageIndex === update.messageIndex) {
          return value;
        }

        return Math.max(floorValue, value * decayFactor);
      }

      if (messageIndex !== update.messageIndex) {
        return value;
      }

      return Math.max(floorValue, value * decayFactor);
    });
  });
}

function deriveMinimalistReceiverPairPolicy(
  state: CompositionalMinimalistState,
): PairTensor {
  return state.receiverAtomicAWeights.map((actionWeightsByA) =>
    state.receiverAtomicBWeights.map((actionWeightsByB) =>
      temperedSoftmax(
        actionWeightsByA.map(
          (value, actionIndex) => value + actionWeightsByB[actionIndex],
        ),
        COMPOSITIONAL_MINIMALIST_TEMPERATURE,
      ),
    ),
  );
}

export function createInitialCompositionalMinimalistState(
  config: CompositionalMinimalistConfig,
): CompositionalMinimalistState {
  return {
    ...createInitialSenderWeights(config),
    receiverAtomicAWeights: createFilledMatrix(
      config.numMessagesA,
      config.numActions,
      config.initialReinforcement,
    ),
    receiverAtomicBWeights: createFilledMatrix(
      config.numMessagesB,
      config.numActions,
      config.initialReinforcement,
    ),
  };
}

export function deriveCompositionalMinimalistPolicies(
  state: CompositionalMinimalistState,
): CompositionalMinimalistPolicies {
  return {
    ...deriveSenderPolicies(state),
    receiverPairPolicy: deriveMinimalistReceiverPairPolicy(state),
  };
}

function reinforceSuccessfulMinimalistRound(
  state: CompositionalMinimalistState,
  config: CompositionalMinimalistConfig,
  update: {
    stateIndex: number;
    messageAIndex: number;
    messageBIndex: number;
    actionIndex: number;
  },
): CompositionalMinimalistState {
  let { senderAWeights, senderBWeights } = reinforceSenderWeights(
    state,
    update,
  );
  const receiverAtomicAWeights = cloneMatrix(state.receiverAtomicAWeights);
  const receiverAtomicBWeights = cloneMatrix(state.receiverAtomicBWeights);

  receiverAtomicAWeights[update.messageAIndex][update.actionIndex] += 1;
  receiverAtomicBWeights[update.messageBIndex][update.actionIndex] += 1;

  if (config.signalingBiasEnabled) {
    const minimalistBiasConfig = {
      initialReinforcement: config.initialReinforcement,
      signalingBiasStrength: getMinimalistSignalingBiasStrength(config),
    };

    senderAWeights[update.stateIndex] = applyMinimalistLocalSenderBiasToRow(
      senderAWeights[update.stateIndex],
      update.messageAIndex,
      minimalistBiasConfig,
    );
    senderAWeights = applyMinimalistStructuredSenderBias(
      senderAWeights,
      {
        stateIndex: update.stateIndex,
        messageIndex: update.messageAIndex,
      },
      "a",
      {
        ...minimalistBiasConfig,
        numMessagesB: config.numMessagesB,
      },
    );
    senderBWeights[update.stateIndex] = applyMinimalistLocalSenderBiasToRow(
      senderBWeights[update.stateIndex],
      update.messageBIndex,
      minimalistBiasConfig,
    );
    senderBWeights = applyMinimalistStructuredSenderBias(
      senderBWeights,
      {
        stateIndex: update.stateIndex,
        messageIndex: update.messageBIndex,
      },
      "b",
      {
        ...minimalistBiasConfig,
        numMessagesB: config.numMessagesB,
      },
    );
    receiverAtomicAWeights[update.messageAIndex] =
      applyMinimalistAtomicActionBiasToRow(
        receiverAtomicAWeights[update.messageAIndex],
        update.actionIndex,
        "a",
        {
          ...minimalistBiasConfig,
          numMessagesB: config.numMessagesB,
        },
      );
    receiverAtomicAWeights[update.messageAIndex === 0 ? 1 : 0] =
      applyMinimalistCompetingAtomicRowBias(
        receiverAtomicAWeights[update.messageAIndex === 0 ? 1 : 0],
        update.actionIndex,
        "a",
        {
          ...minimalistBiasConfig,
          numMessagesB: config.numMessagesB,
        },
      );
    receiverAtomicBWeights[update.messageBIndex] =
      applyMinimalistAtomicActionBiasToRow(
        receiverAtomicBWeights[update.messageBIndex],
        update.actionIndex,
        "b",
        {
          ...minimalistBiasConfig,
          numMessagesB: config.numMessagesB,
        },
      );
    receiverAtomicBWeights[update.messageBIndex === 0 ? 1 : 0] =
      applyMinimalistCompetingAtomicRowBias(
        receiverAtomicBWeights[update.messageBIndex === 0 ? 1 : 0],
        update.actionIndex,
        "b",
        {
          ...minimalistBiasConfig,
          numMessagesB: config.numMessagesB,
        },
      );
  }

  return {
    senderAWeights,
    senderBWeights,
    receiverAtomicAWeights,
    receiverAtomicBWeights,
  };
}

export function playCompositionalMinimalistRound(
  state: CompositionalMinimalistState,
  config: CompositionalMinimalistConfig,
  prng: SeededPrng,
  round: number,
): {
  nextState: CompositionalMinimalistState;
  event: CompositionalMinimalistRoundEvent;
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
  const actionPolicy =
    deriveMinimalistReceiverPairPolicy(state)[messageAIndex][messageBIndex];
  const actionIndex = sampleCategorical(actionPolicy, prng);
  const success = actionIndex === config.correctActions[stateIndex];
  const reward: 0 | 1 = success ? 1 : 0;

  return {
    nextState: success
      ? reinforceSuccessfulMinimalistRound(
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

export const compositionalMinimalistModel: CompositionalModelDefinition<CompositionalMinimalistState> =
  {
    type: "minimalist",
    label: "Minimalist",
    description:
      "Receiver learns only atomic message-action associations and derives pair-conditioned action probabilities by tempered softmax over additive atomic scores.",
    reference: COMPOSITIONAL_GENERALIST_REFERENCE,
    referenceUrl: COMPOSITIONAL_GENERALIST_REFERENCE_URL,
    showsTraditionalStructureDiagnostics: false,
    createInitialState: createInitialCompositionalMinimalistState,
    cloneState(state) {
      return {
        senderAWeights: cloneMatrix(state.senderAWeights),
        senderBWeights: cloneMatrix(state.senderBWeights),
        receiverAtomicAWeights: cloneMatrix(state.receiverAtomicAWeights),
        receiverAtomicBWeights: cloneMatrix(state.receiverAtomicBWeights),
      };
    },
    derivePolicies: deriveCompositionalMinimalistPolicies,
    playRound: playCompositionalMinimalistRound,
    applyMessageReplacement: applyCompositionalMinimalistMessageReplacement,
  };

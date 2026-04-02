import { SeededPrng } from "../prng";
import {
  createFilledMatrix,
  normalizeRow,
  sampleCategorical,
} from "../numeric";
import {
  applyContrastiveSignalingBiasToRow,
  cloneMatrix,
  clonePairTensor,
  createFilledPairTensor,
  createInitialSenderWeights,
  deriveSenderPolicies,
  reinforceSenderWeights,
} from "../compositionalShared/modelUtils";
import type {
  CompositionalModelDefinition,
  CompositionalModelType,
} from "../compositionalShared/types";
import type {
  CompositionalGeneralistConfig,
  CompositionalGeneralistPolicies,
  CompositionalGeneralistRoundEvent,
  CompositionalGeneralistState,
} from "./types";

export const COMPOSITIONAL_GENERALIST_REFERENCE =
  "David Peter Wallis Freeborn (2025), Compositional Understanding in Signaling Games, Synthese.";

export const COMPOSITIONAL_GENERALIST_REFERENCE_URL =
  "https://link.springer.com/article/10.1007/s11229-025-05184-3";

export function createInitialCompositionalGeneralistState(
  config: CompositionalGeneralistConfig,
): CompositionalGeneralistState {
  return {
    ...createInitialSenderWeights(config),
    receiverAObservationWeights: Array.from(
      { length: config.numMessagesA },
      () => config.initialReinforcement,
    ),
    receiverBObservationWeights: Array.from(
      { length: config.numMessagesB },
      () => config.initialReinforcement,
    ),
    receiverPairObservationWeights: Array.from(
      { length: config.numMessagesA },
      () =>
        Array.from(
          { length: config.numMessagesB },
          () => config.initialReinforcement,
        ),
    ),
    receiverAtomicAActionWeights: createFilledMatrix(
      config.numMessagesA,
      config.numActions,
      config.initialReinforcement,
    ),
    receiverAtomicBActionWeights: createFilledMatrix(
      config.numMessagesB,
      config.numActions,
      config.initialReinforcement,
    ),
    receiverPairActionWeights: createFilledPairTensor(
      config.numMessagesA,
      config.numMessagesB,
      config.numActions,
      config.initialReinforcement,
    ),
  };
}

export function cloneCompositionalGeneralistState(
  state: CompositionalGeneralistState,
): CompositionalGeneralistState {
  return {
    senderAWeights: cloneMatrix(state.senderAWeights),
    senderBWeights: cloneMatrix(state.senderBWeights),
    receiverAObservationWeights: [...state.receiverAObservationWeights],
    receiverBObservationWeights: [...state.receiverBObservationWeights],
    receiverPairObservationWeights: state.receiverPairObservationWeights.map(
      (row) => [...row],
    ),
    receiverAtomicAActionWeights: cloneMatrix(
      state.receiverAtomicAActionWeights,
    ),
    receiverAtomicBActionWeights: cloneMatrix(
      state.receiverAtomicBActionWeights,
    ),
    receiverPairActionWeights: clonePairTensor(state.receiverPairActionWeights),
  };
}

export function deriveCompositionalGeneralistPolicies(
  state: CompositionalGeneralistState,
): CompositionalGeneralistPolicies {
  return {
    ...deriveSenderPolicies(state),
    receiverPairPolicy: state.receiverPairActionWeights.map((rowA) =>
      rowA.map((rowB) => normalizeRow(rowB)),
    ),
  };
}

function applyObservationUpdates(
  state: CompositionalGeneralistState,
  observation: {
    messageAIndex: number;
    messageBIndex: number;
  },
): CompositionalGeneralistState {
  const receiverAObservationWeights = [...state.receiverAObservationWeights];
  const receiverBObservationWeights = [...state.receiverBObservationWeights];
  const receiverPairObservationWeights =
    state.receiverPairObservationWeights.map((row) => [...row]);

  receiverAObservationWeights[observation.messageAIndex] += 1;
  receiverBObservationWeights[observation.messageBIndex] += 1;
  receiverPairObservationWeights[observation.messageAIndex][
    observation.messageBIndex
  ] += 1;

  return {
    senderAWeights: state.senderAWeights,
    senderBWeights: state.senderBWeights,
    receiverAObservationWeights,
    receiverBObservationWeights,
    receiverPairObservationWeights,
    receiverAtomicAActionWeights: state.receiverAtomicAActionWeights,
    receiverAtomicBActionWeights: state.receiverAtomicBActionWeights,
    receiverPairActionWeights: state.receiverPairActionWeights,
  };
}

function reinforceSuccessfulGeneralistRound(
  state: CompositionalGeneralistState,
  config: CompositionalGeneralistConfig,
  update: {
    stateIndex: number;
    messageAIndex: number;
    messageBIndex: number;
    actionIndex: number;
  },
): CompositionalGeneralistState {
  const { senderAWeights, senderBWeights } = reinforceSenderWeights(
    state,
    update,
  );
  const receiverAtomicAActionWeights = cloneMatrix(
    state.receiverAtomicAActionWeights,
  );
  const receiverAtomicBActionWeights = cloneMatrix(
    state.receiverAtomicBActionWeights,
  );
  const receiverPairActionWeights = clonePairTensor(
    state.receiverPairActionWeights,
  );

  receiverAtomicAActionWeights[update.messageAIndex][update.actionIndex] += 1;
  receiverAtomicBActionWeights[update.messageBIndex][update.actionIndex] += 1;
  receiverPairActionWeights[update.messageAIndex][update.messageBIndex][
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
    receiverAtomicAActionWeights[update.messageAIndex] =
      applyContrastiveSignalingBiasToRow(
        receiverAtomicAActionWeights[update.messageAIndex],
        update.actionIndex,
        config,
      );
    receiverAtomicBActionWeights[update.messageBIndex] =
      applyContrastiveSignalingBiasToRow(
        receiverAtomicBActionWeights[update.messageBIndex],
        update.actionIndex,
        config,
      );
    receiverPairActionWeights[update.messageAIndex][update.messageBIndex] =
      applyContrastiveSignalingBiasToRow(
        receiverPairActionWeights[update.messageAIndex][update.messageBIndex],
        update.actionIndex,
        config,
      );
  }

  return {
    senderAWeights,
    senderBWeights,
    receiverAObservationWeights: [...state.receiverAObservationWeights],
    receiverBObservationWeights: [...state.receiverBObservationWeights],
    receiverPairObservationWeights: state.receiverPairObservationWeights.map(
      (row) => [...row],
    ),
    receiverAtomicAActionWeights,
    receiverAtomicBActionWeights,
    receiverPairActionWeights,
  };
}

export function playCompositionalGeneralistRound(
  state: CompositionalGeneralistState,
  config: CompositionalGeneralistConfig,
  prng: SeededPrng,
  round: number,
): {
  nextState: CompositionalGeneralistState;
  event: CompositionalGeneralistRoundEvent;
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
    state.receiverPairActionWeights[messageAIndex][messageBIndex],
    prng,
  );
  const success = actionIndex === config.correctActions[stateIndex];
  const reward: 0 | 1 = success ? 1 : 0;
  const observedState = applyObservationUpdates(state, {
    messageAIndex,
    messageBIndex,
  });

  return {
    nextState: success
      ? reinforceSuccessfulGeneralistRound(
          observedState,
          config,
          {
            stateIndex,
            messageAIndex,
            messageBIndex,
            actionIndex,
          },
        )
      : observedState,
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

export function createCompositionalGeneralistModelDefinition(options: {
  type: Extract<
    CompositionalModelType,
    "information-erasing-generalist" | "information-preserving-generalist"
  >;
  label: string;
  description: string;
  applyMessageReplacement: CompositionalModelDefinition<CompositionalGeneralistState>["applyMessageReplacement"];
}): CompositionalModelDefinition<CompositionalGeneralistState> {
  return {
    type: options.type,
    label: options.label,
    description: options.description,
    reference: COMPOSITIONAL_GENERALIST_REFERENCE,
    referenceUrl: COMPOSITIONAL_GENERALIST_REFERENCE_URL,
    showsTraditionalStructureDiagnostics: false,
    createInitialState: createInitialCompositionalGeneralistState,
    cloneState: cloneCompositionalGeneralistState,
    derivePolicies: deriveCompositionalGeneralistPolicies,
    playRound: playCompositionalGeneralistRound,
    applyMessageReplacement: options.applyMessageReplacement,
  };
}

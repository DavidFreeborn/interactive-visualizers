import { cloneMatrix, clonePairTensor } from "../compositionalShared/modelUtils";
import type {
  CompositionalMessageReplacementSpec,
} from "../compositionalShared";
import type {
  CompositionalTraditionalConfig,
  CompositionalTraditionalState,
} from "./types";

/**
 * Public forgetting event for the Traditional receiver. Because the receiver
 * stores only pair-conditioned action learning, replacing one message resets
 * all affected pair rows to flat novelty without preserving the unreplaced
 * component's contribution.
 */
export function applyCompositionalTraditionalMessageReplacement(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig,
  spec: CompositionalMessageReplacementSpec,
): CompositionalTraditionalState {
  const senderAWeights = cloneMatrix(state.senderAWeights);
  const senderBWeights = cloneMatrix(state.senderBWeights);
  const receiverPairWeights = clonePairTensor(state.receiverPairWeights);

  if (spec.replacedSender === "a") {
    senderAWeights.forEach((row) => {
      row[spec.replacedMessageIndex] = config.initialReinforcement;
    });

    for (
      let messageBIndex = 0;
      messageBIndex < config.numMessagesB;
      messageBIndex += 1
    ) {
      receiverPairWeights[spec.replacedMessageIndex][messageBIndex] =
        Array.from(
          { length: config.numActions },
          () => config.initialReinforcement,
        );
    }
  } else {
    senderBWeights.forEach((row) => {
      row[spec.replacedMessageIndex] = config.initialReinforcement;
    });

    for (
      let messageAIndex = 0;
      messageAIndex < config.numMessagesA;
      messageAIndex += 1
    ) {
      receiverPairWeights[messageAIndex][spec.replacedMessageIndex] =
        Array.from(
          { length: config.numActions },
          () => config.initialReinforcement,
        );
    }
  }

  return {
    senderAWeights,
    senderBWeights,
    receiverPairWeights,
  };
}

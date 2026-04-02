import { cloneMatrix } from "../compositionalShared/modelUtils";
import type { CompositionalMessageReplacementSpec } from "../compositionalShared";
import type {
  CompositionalMinimalistConfig,
  CompositionalMinimalistState,
} from "./types";

/**
 * Public forgetting event for the Minimalist receiver. Replacing one message
 * resets the sender reinforcement on that side and only the forgotten atomic
 * receiver row. The unreplaced atomic row remains intact, so derived pair
 * policies can still reflect partial information from the surviving component.
 */
export function applyCompositionalMinimalistMessageReplacement(
  state: CompositionalMinimalistState,
  config: CompositionalMinimalistConfig,
  spec: CompositionalMessageReplacementSpec,
): CompositionalMinimalistState {
  const senderAWeights = cloneMatrix(state.senderAWeights);
  const senderBWeights = cloneMatrix(state.senderBWeights);
  const receiverAtomicAWeights = cloneMatrix(state.receiverAtomicAWeights);
  const receiverAtomicBWeights = cloneMatrix(state.receiverAtomicBWeights);

  if (spec.replacedSender === "a") {
    senderAWeights.forEach((row) => {
      row[spec.replacedMessageIndex] = config.initialReinforcement;
    });
    receiverAtomicAWeights[spec.replacedMessageIndex] = Array.from(
      { length: config.numActions },
      () => config.initialReinforcement,
    );
  } else {
    senderBWeights.forEach((row) => {
      row[spec.replacedMessageIndex] = config.initialReinforcement;
    });
    receiverAtomicBWeights[spec.replacedMessageIndex] = Array.from(
      { length: config.numActions },
      () => config.initialReinforcement,
    );
  }

  return {
    senderAWeights,
    senderBWeights,
    receiverAtomicAWeights,
    receiverAtomicBWeights,
  };
}

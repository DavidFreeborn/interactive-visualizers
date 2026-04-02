import type {
  CompositionalConfig,
  CompositionalForgettingConfig,
  CompositionalForgettingConfigInput,
  CompositionalForgettingDiagnostics,
  CompositionalForgettingPairReference,
  CompositionalForgettingSnapshot,
  CompositionalMessageReplacementSpec,
} from "../model/compositionalShared";

export const DEFAULT_COMPOSITIONAL_FORGETTING_CONFIG: CompositionalForgettingConfig =
  {
    enabled: false,
    triggerMode: "manual",
    triggerRound: 50000,
    replacedSender: "b",
    replacedMessageIndex: 0,
  };

function assertInteger(value: number, label: string, minimum: number): void {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(
      `${label} must be an integer greater than or equal to ${minimum}.`,
    );
  }
}

export function resolveCompositionalForgettingConfig(
  input: CompositionalForgettingConfigInput = {},
  config: Pick<CompositionalConfig, "numMessagesA" | "numMessagesB">,
): CompositionalForgettingConfig {
  const enabled =
    input.enabled ?? DEFAULT_COMPOSITIONAL_FORGETTING_CONFIG.enabled;
  const triggerMode =
    input.triggerMode ?? DEFAULT_COMPOSITIONAL_FORGETTING_CONFIG.triggerMode;
  const replacedSender =
    input.replacedSender ?? DEFAULT_COMPOSITIONAL_FORGETTING_CONFIG.replacedSender;
  const replacedMessageIndex =
    input.replacedMessageIndex ??
    DEFAULT_COMPOSITIONAL_FORGETTING_CONFIG.replacedMessageIndex;

  if (typeof enabled !== "boolean") {
    throw new Error("forgetting.enabled must be a boolean.");
  }
  if (triggerMode !== "manual" && triggerMode !== "scheduled") {
    throw new Error('forgetting.triggerMode must be "manual" or "scheduled".');
  }
  if (replacedSender !== "a" && replacedSender !== "b") {
    throw new Error('forgetting.replacedSender must be "a" or "b".');
  }

  const maxMessageIndex =
    replacedSender === "a" ? config.numMessagesA - 1 : config.numMessagesB - 1;
  assertInteger(replacedMessageIndex, "forgetting.replacedMessageIndex", 0);
  if (replacedMessageIndex > maxMessageIndex) {
    throw new Error(
      `forgetting.replacedMessageIndex must be less than or equal to ${maxMessageIndex} for sender ${replacedSender.toUpperCase()}.`,
    );
  }

  let triggerRound: number | null;
  if (triggerMode === "scheduled") {
    triggerRound =
      input.triggerRound ?? DEFAULT_COMPOSITIONAL_FORGETTING_CONFIG.triggerRound;
    if (triggerRound === null) {
      throw new Error(
        "forgetting.triggerRound must be provided in scheduled mode.",
      );
    }
    assertInteger(triggerRound, "forgetting.triggerRound", 1);
  } else {
    triggerRound = null;
  }

  return {
    enabled,
    triggerMode,
    triggerRound,
    replacedSender,
    replacedMessageIndex,
  };
}

export function buildCompositionalForgettingAffectedPairs(
  config: Pick<CompositionalConfig, "numMessagesA" | "numMessagesB">,
  spec: Pick<
    CompositionalMessageReplacementSpec,
    "replacedSender" | "replacedMessageIndex"
  >,
): CompositionalForgettingPairReference[] {
  const pairs: CompositionalForgettingPairReference[] = [];

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
      const matchesReplacedMessage =
        spec.replacedSender === "a"
          ? messageAIndex === spec.replacedMessageIndex
          : messageBIndex === spec.replacedMessageIndex;

      if (matchesReplacedMessage) {
        pairs.push({ messageAIndex, messageBIndex });
      }
    }
  }

  return pairs;
}

export function buildCompositionalForgettingUnaffectedPairs(
  config: Pick<CompositionalConfig, "numMessagesA" | "numMessagesB">,
  spec: Pick<
    CompositionalMessageReplacementSpec,
    "replacedSender" | "replacedMessageIndex"
  >,
): CompositionalForgettingPairReference[] {
  const affectedPairKeys = new Set(
    buildCompositionalForgettingAffectedPairs(config, spec).map(
      ({ messageAIndex, messageBIndex }) => `${messageAIndex}-${messageBIndex}`,
    ),
  );
  const pairs: CompositionalForgettingPairReference[] = [];

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
      const key = `${messageAIndex}-${messageBIndex}`;
      if (!affectedPairKeys.has(key)) {
        pairs.push({ messageAIndex, messageBIndex });
      }
    }
  }

  return pairs;
}

export function createEmptyCompositionalForgettingDiagnostics(
  config: Pick<CompositionalConfig, "numMessagesA" | "numMessagesB">,
  spec: Pick<
    CompositionalMessageReplacementSpec,
    "replacedSender" | "replacedMessageIndex"
  >,
): CompositionalForgettingDiagnostics {
  return {
    affectedPairs: buildCompositionalForgettingAffectedPairs(config, spec),
    unaffectedPairs: buildCompositionalForgettingUnaffectedPairs(config, spec),
    preForgettingPeakSignalActionMutualInformationBits: null,
    immediatePostForgettingSignalActionMutualInformationBits: null,
    currentSignalActionMutualInformationBits: null,
    informationLostBits: null,
    peakInformationLostBits: null,
    preForgettingAffectedCorrectActionProbability: null,
    immediatePostForgettingAffectedCorrectActionProbability: null,
    immediatePostForgettingUnaffectedCorrectActionProbability: null,
    currentAffectedCorrectActionProbability: null,
    currentUnaffectedCorrectActionProbability: null,
  };
}

export function cloneCompositionalForgettingSnapshot(
  snapshot: CompositionalForgettingSnapshot,
): CompositionalForgettingSnapshot {
  return {
    ...snapshot,
    diagnostics: {
      ...snapshot.diagnostics,
      affectedPairs: snapshot.diagnostics.affectedPairs.map((pair) => ({
        ...pair,
      })),
      unaffectedPairs: snapshot.diagnostics.unaffectedPairs.map((pair) => ({
        ...pair,
      })),
    },
  };
}

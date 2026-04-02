import { describe, expect, it } from "vitest";
import { SeededPrng } from "../prng";
import { resolveCompositionalConfig } from "../compositionalShared";
import {
  createInitialCompositionalTraditionalState,
  deriveCompositionalTraditionalPolicies,
  playCompositionalTraditionalRound,
} from "../compositionalTraditional";
import {
  createInitialCompositionalGeneralistState,
  deriveCompositionalGeneralistPolicies,
  playCompositionalGeneralistRound,
} from "./compositionalGame";
import {
  applyCompositionalGeneralistMessageReplacement,
  runCompositionalGeneralistReplacementExperiment,
} from "./replacement";
import type { CompositionalGeneralistState } from "./types";

function createCanonicalGeneralistState(): CompositionalGeneralistState {
  return {
    senderAWeights: [
      [10, 0],
      [10, 0],
      [0, 10],
      [0, 10],
    ],
    senderBWeights: [
      [10, 0],
      [0, 10],
      [10, 0],
      [0, 10],
    ],
    receiverAObservationWeights: [15, 15],
    receiverBObservationWeights: [15, 15],
    receiverPairObservationWeights: [
      [12, 12],
      [12, 12],
    ],
    receiverAtomicAActionWeights: [
      [12, 12, 1, 1],
      [1, 1, 12, 12],
    ],
    receiverAtomicBActionWeights: [
      [12, 1, 12, 1],
      [1, 12, 1, 12],
    ],
    receiverPairActionWeights: [
      [
        [10, 0, 0, 0],
        [0, 10, 0, 0],
      ],
      [
        [0, 0, 10, 0],
        [0, 0, 0, 10],
      ],
    ],
  };
}

function createPairDominantGeneralistState(): CompositionalGeneralistState {
  return {
    senderAWeights: [
      [100, 1],
      [100, 1],
      [1, 100],
      [1, 100],
    ],
    senderBWeights: [
      [100, 1],
      [1, 100],
      [100, 1],
      [1, 100],
    ],
    receiverAObservationWeights: [101, 101],
    receiverBObservationWeights: [101, 101],
    receiverPairObservationWeights: [
      [101, 101],
      [101, 101],
    ],
    receiverAtomicAActionWeights: [
      [12, 12, 1, 1],
      [1, 1, 12, 12],
    ],
    receiverAtomicBActionWeights: [
      [12, 1, 12, 1],
      [1, 12, 1, 12],
    ],
    receiverPairActionWeights: [
      [
        [101, 1, 1, 1],
        [1, 101, 1, 1],
      ],
      [
        [1, 1, 101, 1],
        [1, 1, 1, 101],
      ],
    ],
  };
}

function createSwappedPairDominantGeneralistState(): CompositionalGeneralistState {
  return {
    senderAWeights: [
      [1, 100],
      [1, 100],
      [100, 1],
      [100, 1],
    ],
    senderBWeights: [
      [100, 1],
      [1, 100],
      [100, 1],
      [1, 100],
    ],
    receiverAObservationWeights: [101, 101],
    receiverBObservationWeights: [101, 101],
    receiverPairObservationWeights: [
      [101, 101],
      [101, 101],
    ],
    receiverAtomicAActionWeights: [
      [12, 12, 1, 1],
      [1, 1, 12, 12],
    ],
    receiverAtomicBActionWeights: [
      [12, 1, 12, 1],
      [1, 12, 1, 12],
    ],
    receiverPairActionWeights: [
      [
        [1, 1, 101, 1],
        [1, 1, 1, 101],
      ],
      [
        [101, 1, 1, 1],
        [1, 101, 1, 1],
      ],
    ],
  };
}

function createRoleSwappedPairDominantGeneralistState(): CompositionalGeneralistState {
  return {
    senderAWeights: [
      [1, 100],
      [100, 1],
      [1, 100],
      [100, 1],
    ],
    senderBWeights: [
      [1, 100],
      [1, 100],
      [100, 1],
      [100, 1],
    ],
    receiverAObservationWeights: [101, 101],
    receiverBObservationWeights: [101, 101],
    receiverPairObservationWeights: [
      [101, 101],
      [101, 101],
    ],
    receiverAtomicAActionWeights: [
      [1, 12, 1, 12],
      [12, 1, 12, 1],
    ],
    receiverAtomicBActionWeights: [
      [12, 12, 1, 1],
      [1, 1, 12, 12],
    ],
    receiverPairActionWeights: [
      [
        [1, 1, 1, 101],
        [1, 101, 1, 1],
      ],
      [
        [1, 101, 1, 1],
        [101, 1, 1, 1],
      ],
    ],
  };
}

function createBiasSensitiveGeneralistState(): CompositionalGeneralistState {
  return {
    senderAWeights: [
      [10, 4],
      [10, 4],
      [4, 10],
      [4, 10],
    ],
    senderBWeights: [
      [10, 4],
      [4, 10],
      [10, 4],
      [4, 10],
    ],
    receiverAObservationWeights: [15, 15],
    receiverBObservationWeights: [15, 15],
    receiverPairObservationWeights: [
      [12, 12],
      [12, 12],
    ],
    receiverAtomicAActionWeights: [
      [100, 4, 4, 4],
      [4, 4, 12, 12],
    ],
    receiverAtomicBActionWeights: [
      [12, 4, 12, 4],
      [100, 4, 4, 4],
    ],
    receiverPairActionWeights: [
      [
        [10, 4, 4, 4],
        [100, 4, 4, 4],
      ],
      [
        [4, 4, 10, 4],
        [4, 4, 4, 10],
      ],
    ],
  };
}

function totalVariationDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  return (
    left.reduce(
      (sum, value, index) => sum + Math.abs(value - right[index]),
      0,
    ) / 2
  );
}

function legacyAtomicOnlyPreservedPairActionWeights(
  unreplacedAtomicActionWeights: readonly number[],
  initialReinforcement: number,
): number[] {
  const surplusByAction = unreplacedAtomicActionWeights.map((weight) =>
    Math.max(0, weight - initialReinforcement),
  );
  const totalSurplus = surplusByAction.reduce((sum, weight) => sum + weight, 0);

  if (totalSurplus === 0) {
    return Array.from(
      { length: unreplacedAtomicActionWeights.length },
      () => initialReinforcement,
    );
  }

  return surplusByAction.map(
    (surplus) => initialReinforcement + (surplus / totalSurplus) * totalSurplus,
  );
}

function compatibleActionMass(
  row: readonly number[],
  compatibleActionIndices: readonly number[],
): number {
  const total = row.reduce((sum, value) => sum + value, 0);

  return (
    compatibleActionIndices.reduce(
      (sum, actionIndex) => sum + row[actionIndex],
      0,
    ) / total
  );
}

describe("createInitialCompositionalGeneralistState", () => {
  it("creates observation, atomic-action, and pair-action structures", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 2 });
    const state = createInitialCompositionalGeneralistState(config);

    expect(state.receiverAObservationWeights).toEqual([2, 2]);
    expect(state.receiverBObservationWeights).toEqual([2, 2]);
    expect(state.receiverPairObservationWeights).toEqual([
      [2, 2],
      [2, 2],
    ]);
    expect(state.receiverAtomicAActionWeights[0]).toEqual([2, 2, 2, 2]);
    expect(state.receiverAtomicBActionWeights[0]).toEqual([2, 2, 2, 2]);
    expect(state.receiverPairActionWeights[0][0]).toEqual([2, 2, 2, 2]);
  });
});

describe("playCompositionalGeneralistRound", () => {
  it("chooses actions in ordinary play from the pair-conditioned action weights", () => {
    const config = resolveCompositionalConfig({ seed: 7 });
    const state: CompositionalGeneralistState = {
      senderAWeights: [
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
      ],
      senderBWeights: [
        [10, 0],
        [10, 0],
        [10, 0],
        [10, 0],
      ],
      receiverAObservationWeights: [1, 1],
      receiverBObservationWeights: [1, 1],
      receiverPairObservationWeights: [
        [1, 1],
        [1, 1],
      ],
      receiverAtomicAActionWeights: [
        [0, 100, 0, 0],
        [0, 0, 0, 100],
      ],
      receiverAtomicBActionWeights: [
        [0, 0, 100, 0],
        [100, 0, 0, 0],
      ],
      receiverPairActionWeights: [
        [
          [0, 0, 0, 10],
          [0, 10, 0, 0],
        ],
        [
          [0, 0, 0, 10],
          [10, 0, 0, 0],
        ],
      ],
    };

    const { event } = playCompositionalGeneralistRound(
      state,
      config,
      new SeededPrng(7),
      1,
    );

    expect(event.messageAIndex).toBe(0);
    expect(event.messageBIndex).toBe(0);
    expect(event.actionIndex).toBe(3);
  });

  it("updates observation counts on every round, including failed rounds", () => {
    const config = resolveCompositionalConfig({
      seed: 11,
      signalingBiasEnabled: true,
    });
    const state: CompositionalGeneralistState = {
      senderAWeights: [
        [10, 0],
        [10, 0],
        [0, 10],
        [0, 10],
      ],
      senderBWeights: [
        [10, 0],
        [0, 10],
        [10, 0],
        [0, 10],
      ],
      receiverAObservationWeights: [1, 1],
      receiverBObservationWeights: [1, 1],
      receiverPairObservationWeights: [
        [1, 1],
        [1, 1],
      ],
      receiverAtomicAActionWeights: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      receiverAtomicBActionWeights: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      receiverPairActionWeights: [
        [
          [0, 10, 0, 0],
          [0, 0, 10, 0],
        ],
        [
          [0, 0, 0, 10],
          [10, 0, 0, 0],
        ],
      ],
    };

    const { nextState, event } = playCompositionalGeneralistRound(
      state,
      config,
      new SeededPrng(11),
      1,
    );

    expect(event.success).toBe(false);
    expect(nextState.receiverAObservationWeights[event.messageAIndex]).toBe(2);
    expect(nextState.receiverBObservationWeights[event.messageBIndex]).toBe(2);
    expect(
      nextState.receiverPairObservationWeights[event.messageAIndex][
        event.messageBIndex
      ],
    ).toBe(2);
    expect(nextState.receiverPairActionWeights).toEqual(
      state.receiverPairActionWeights,
    );
    expect(nextState.receiverAtomicAActionWeights).toEqual(
      state.receiverAtomicAActionWeights,
    );
    expect(nextState.receiverAtomicBActionWeights).toEqual(
      state.receiverAtomicBActionWeights,
    );
  });

  it("matches the baseline successful update semantics exactly when signaling bias is disabled", () => {
    const config = resolveCompositionalConfig({
      seed: 7,
      signalingBiasEnabled: false,
    });
    const state = createCanonicalGeneralistState();

    const { nextState, event } = playCompositionalGeneralistRound(
      state,
      config,
      new SeededPrng(7),
      1,
    );

    expect(event.success).toBe(true);
    expect(
      nextState.senderAWeights[event.stateIndex][event.messageAIndex],
    ).toBe(state.senderAWeights[event.stateIndex][event.messageAIndex] + 1);
    expect(
      nextState.senderBWeights[event.stateIndex][event.messageBIndex],
    ).toBe(state.senderBWeights[event.stateIndex][event.messageBIndex] + 1);
    expect(
      nextState.receiverPairActionWeights[event.messageAIndex][
        event.messageBIndex
      ][event.actionIndex],
    ).toBe(
      state.receiverPairActionWeights[event.messageAIndex][event.messageBIndex][
        event.actionIndex
      ] + 1,
    );
    expect(
      nextState.receiverAtomicAActionWeights[event.messageAIndex][
        event.actionIndex
      ],
    ).toBe(
      state.receiverAtomicAActionWeights[event.messageAIndex][
        event.actionIndex
      ] + 1,
    );
    expect(
      nextState.receiverAtomicBActionWeights[event.messageBIndex][
        event.actionIndex
      ],
    ).toBe(
      state.receiverAtomicBActionWeights[event.messageBIndex][
        event.actionIndex
      ] + 1,
    );
  });

  it("sharpens sender, atomic-action, and pair-action rows after success without distorting observation counts", () => {
    const state = createBiasSensitiveGeneralistState();
    const biasOff = playCompositionalGeneralistRound(
      state,
      resolveCompositionalConfig({
        seed: 7,
        signalingBiasEnabled: false,
      }),
      new SeededPrng(7),
      1,
    );
    const biasOn = playCompositionalGeneralistRound(
      state,
      resolveCompositionalConfig({
        seed: 7,
        signalingBiasEnabled: true,
        signalingBiasStrength: 0.05,
      }),
      new SeededPrng(7),
      1,
    );

    expect(biasOn.event).toEqual(biasOff.event);
    expect(biasOn.event.success).toBe(true);
    expect(biasOn.nextState.receiverAObservationWeights).toEqual(
      biasOff.nextState.receiverAObservationWeights,
    );
    expect(biasOn.nextState.receiverBObservationWeights).toEqual(
      biasOff.nextState.receiverBObservationWeights,
    );
    expect(biasOn.nextState.receiverPairObservationWeights).toEqual(
      biasOff.nextState.receiverPairObservationWeights,
    );

    const competingSenderAIndex = biasOn.event.messageAIndex === 0 ? 1 : 0;
    const competingSenderBIndex = biasOn.event.messageBIndex === 0 ? 1 : 0;
    const competingActionIndex = biasOn.event.actionIndex === 0 ? 1 : 0;

    expect(
      biasOn.nextState.senderAWeights[biasOn.event.stateIndex][
        biasOn.event.messageAIndex
      ],
    ).toBe(
      biasOff.nextState.senderAWeights[biasOn.event.stateIndex][
        biasOn.event.messageAIndex
      ],
    );
    expect(
      biasOn.nextState.senderBWeights[biasOn.event.stateIndex][
        biasOn.event.messageBIndex
      ],
    ).toBe(
      biasOff.nextState.senderBWeights[biasOn.event.stateIndex][
        biasOn.event.messageBIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAActionWeights[biasOn.event.messageAIndex][
        biasOn.event.actionIndex
      ],
    ).toBe(
      biasOff.nextState.receiverAtomicAActionWeights[biasOn.event.messageAIndex][
        biasOn.event.actionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBActionWeights[biasOn.event.messageBIndex][
        biasOn.event.actionIndex
      ],
    ).toBe(
      biasOff.nextState.receiverAtomicBActionWeights[biasOn.event.messageBIndex][
        biasOn.event.actionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverPairActionWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][biasOn.event.actionIndex],
    ).toBe(
      biasOff.nextState.receiverPairActionWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][biasOn.event.actionIndex],
    );

    expect(
      biasOn.nextState.senderAWeights[biasOn.event.stateIndex][
        competingSenderAIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.senderAWeights[biasOn.event.stateIndex][
        competingSenderAIndex
      ],
    );
    expect(
      biasOn.nextState.senderBWeights[biasOn.event.stateIndex][
        competingSenderBIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.senderBWeights[biasOn.event.stateIndex][
        competingSenderBIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAActionWeights[biasOn.event.messageAIndex][
        competingActionIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.receiverAtomicAActionWeights[biasOn.event.messageAIndex][
        competingActionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBActionWeights[biasOn.event.messageBIndex][
        competingActionIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.receiverAtomicBActionWeights[biasOn.event.messageBIndex][
        competingActionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverPairActionWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][competingActionIndex],
    ).toBeLessThan(
      biasOff.nextState.receiverPairActionWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][competingActionIndex],
    );
  });

  it("matches the Traditional model trajectory in ordinary no-replacement play", () => {
    const config = resolveCompositionalConfig({ seed: 23 });
    let traditionalState = createInitialCompositionalTraditionalState(config);
    let generalistState = createInitialCompositionalGeneralistState(config);
    const traditionalPrng = new SeededPrng(23);
    const generalistPrng = new SeededPrng(23);

    for (let round = 1; round <= 40; round += 1) {
      const traditionalStep = playCompositionalTraditionalRound(
        traditionalState,
        config,
        traditionalPrng,
        round,
      );
      const generalistStep = playCompositionalGeneralistRound(
        generalistState,
        config,
        generalistPrng,
        round,
      );

      expect(generalistStep.event).toEqual(traditionalStep.event);

      traditionalState = traditionalStep.nextState;
      generalistState = generalistStep.nextState;
    }

    expect(
      deriveCompositionalGeneralistPolicies(generalistState).receiverPairPolicy,
    ).toEqual(
      deriveCompositionalTraditionalPolicies(traditionalState)
        .receiverPairPolicy,
    );
  });
});

describe("runCompositionalGeneralistReplacementExperiment", () => {
  it("initializes affected pair rows flat in the information-erasing replacement harness", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = createCanonicalGeneralistState();

    const erasedState = applyCompositionalGeneralistMessageReplacement(
      state,
      config,
      {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-erasing",
      },
    );

    expect(erasedState.receiverBObservationWeights[0]).toBe(1);
    expect(erasedState.senderBWeights.map((row) => row[0])).toEqual([1, 1, 1, 1]);
    expect(erasedState.receiverAtomicBActionWeights[0]).toEqual([1, 1, 1, 1]);
    expect(erasedState.receiverPairObservationWeights[0][0]).toBe(1);
    expect(erasedState.receiverPairObservationWeights[1][0]).toBe(1);
    expect(erasedState.receiverPairActionWeights[0][0]).toEqual([1, 1, 1, 1]);
    expect(erasedState.receiverPairActionWeights[1][0]).toEqual([1, 1, 1, 1]);
    expect(erasedState.receiverPairActionWeights[0][1]).toEqual(
      state.receiverPairActionWeights[0][1],
    );
    expect(erasedState.receiverPairActionWeights[1][1]).toEqual(
      state.receiverPairActionWeights[1][1],
    );
  });

  it("retains the unreplaced component's action contribution in the preserving replacement harness", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = createCanonicalGeneralistState();

    const preservedState = applyCompositionalGeneralistMessageReplacement(
      state,
      config,
      {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-preserving",
      },
    );

    expect(preservedState.receiverBObservationWeights[0]).toBe(1);
    expect(preservedState.senderBWeights.map((row) => row[0])).toEqual([1, 1, 1, 1]);
    expect(preservedState.receiverAtomicBActionWeights[0]).toEqual([
      1, 1, 1, 1,
    ]);
    expect(preservedState.receiverPairObservationWeights[0][0]).toBe(
      state.receiverPairObservationWeights[0][1],
    );
    expect(preservedState.receiverPairObservationWeights[1][0]).toBe(
      state.receiverPairObservationWeights[1][1],
    );
    expect(preservedState.receiverPairActionWeights[0][0][0]).toBeCloseTo(12);
    expect(preservedState.receiverPairActionWeights[0][0][1]).toBeCloseTo(12);
    expect(preservedState.receiverPairActionWeights[0][0][2]).toBeCloseTo(1);
    expect(preservedState.receiverPairActionWeights[0][0][3]).toBeCloseTo(1);
    expect(preservedState.receiverPairActionWeights[1][0][0]).toBeCloseTo(1);
    expect(preservedState.receiverPairActionWeights[1][0][1]).toBeCloseTo(1);
    expect(preservedState.receiverPairActionWeights[1][0][2]).toBeCloseTo(12);
    expect(preservedState.receiverPairActionWeights[1][0][3]).toBeCloseTo(12);
    expect(preservedState.receiverPairActionWeights[0][1]).toEqual(
      state.receiverPairActionWeights[0][1],
    );
    expect(preservedState.receiverPairActionWeights[1][1]).toEqual(
      state.receiverPairActionWeights[1][1],
    );
  });

  it("produces measurably different post-replacement receiver policies for erasing and preserving variants", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = createCanonicalGeneralistState();

    const erasing = runCompositionalGeneralistReplacementExperiment({
      state,
      config,
      spec: {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-erasing",
      },
    });
    const preserving = runCompositionalGeneralistReplacementExperiment({
      state,
      config,
      spec: {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-preserving",
      },
    });

    expect(erasing.affectedStates).toEqual([0, 2]);
    expect(erasing.affectedPairs).toEqual([
      [0, 0],
      [1, 0],
    ]);
    expect(erasing.postReplacementPolicies.receiverPairPolicy[0][0]).toEqual([
      0.25, 0.25, 0.25, 0.25,
    ]);
    expect(erasing.postReplacementPolicies.receiverPairPolicy[1][0]).toEqual([
      0.25, 0.25, 0.25, 0.25,
    ]);
    expect(
      erasing.postReplacementState.receiverPairObservationWeights[0][0],
    ).toBe(1);
    expect(
      preserving.postReplacementState.receiverPairObservationWeights[0][0],
    ).toBe(state.receiverPairObservationWeights[0][1]);
    expect(
      preserving.postReplacementPolicies.receiverPairPolicy[0][0][0],
    ).toBeGreaterThan(0.4);
    expect(
      preserving.postReplacementPolicies.receiverPairPolicy[0][0][1],
    ).toBeGreaterThan(0.4);
    expect(
      preserving.postReplacementPolicies.receiverPairPolicy[0][0][2],
    ).toBeLessThan(0.1);
    expect(
      preserving.postReplacementPolicies.receiverPairPolicy[1][0][2],
    ).toBeGreaterThan(0.4);
    expect(
      preserving.postReplacementPolicies.receiverPairPolicy[1][0][0],
    ).toBeLessThan(0.1);
    expect(
      totalVariationDistance(
        erasing.postReplacementPolicies.receiverPairPolicy[0][0],
        preserving.postReplacementPolicies.receiverPairPolicy[0][0],
      ),
    ).toBeGreaterThan(0.34);
    expect(
      totalVariationDistance(
        erasing.postReplacementPolicies.receiverPairPolicy[1][0],
        preserving.postReplacementPolicies.receiverPairPolicy[1][0],
      ),
    ).toBeGreaterThan(0.34);
    expect(
      preserving.postReplacementPolicies.receiverPairPolicy[0][0],
    ).not.toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(preserving.affectedCorrectActionProbability).toBeGreaterThan(
      erasing.affectedCorrectActionProbability + 0.15,
    );
  });

  it("operationalizes preservation from surviving pair evidence rather than the old atomic-only rows", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = createPairDominantGeneralistState();

    const preservedState = applyCompositionalGeneralistMessageReplacement(
      state,
      config,
      {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-preserving",
      },
    );
    const legacyAtomicOnlyRow = legacyAtomicOnlyPreservedPairActionWeights(
      state.receiverAtomicAActionWeights[0],
      config.initialReinforcement,
    );

    expect(preservedState.receiverPairActionWeights[0][0]).not.toEqual(
      legacyAtomicOnlyRow,
    );
    expect(preservedState.receiverPairObservationWeights[0][0]).toBe(
      state.receiverPairObservationWeights[0][1],
    );
    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[0][0], [0, 1]),
    ).toBeGreaterThan(compatibleActionMass(legacyAtomicOnlyRow, [0, 1]) + 0.04);
    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[1][0], [2, 3]),
    ).toBeGreaterThan(
      compatibleActionMass(
        legacyAtomicOnlyPreservedPairActionWeights(
          state.receiverAtomicAActionWeights[1],
          config.initialReinforcement,
        ),
        [2, 3],
      ) + 0.04,
    );
    expect(preservedState.receiverPairActionWeights[0][1]).toEqual(
      state.receiverPairActionWeights[0][1],
    );
    expect(preservedState.receiverPairActionWeights[1][1]).toEqual(
      state.receiverPairActionWeights[1][1],
    );
  });

  it("infers the surviving component's action family from learned pair evidence rather than raw message-index labels", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = createSwappedPairDominantGeneralistState();

    const preservedState = applyCompositionalGeneralistMessageReplacement(
      state,
      config,
      {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-preserving",
      },
    );

    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[0][0], [2, 3]),
    ).toBeGreaterThan(0.97);
    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[1][0], [0, 1]),
    ).toBeGreaterThan(0.97);
    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[0][0], [0, 1]),
    ).toBeLessThan(0.1);
  });

  it("preserves the learned action family even when the two senders have swapped semantic roles", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = createRoleSwappedPairDominantGeneralistState();

    const preservedState = applyCompositionalGeneralistMessageReplacement(
      state,
      config,
      {
        replacedSender: "b",
        replacedMessageIndex: 0,
        variant: "information-preserving",
      },
    );

    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[0][0], [1, 3]),
    ).toBeGreaterThan(0.97);
    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[1][0], [0, 2]),
    ).toBeGreaterThan(0.97);
    expect(
      compatibleActionMass(preservedState.receiverPairActionWeights[0][0], [0, 1]),
    ).toBeLessThan(0.6);
  });
});

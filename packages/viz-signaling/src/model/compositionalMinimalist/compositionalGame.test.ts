import { describe, expect, it } from "vitest";
import { SeededPrng } from "../prng";
import { resolveCompositionalConfig } from "../compositionalShared";
import { CompositionalRunner } from "../../sim/CompositionalRunner";
import {
  COMPOSITIONAL_MINIMALIST_TEMPERATURE,
  createInitialCompositionalMinimalistState,
  deriveCompositionalMinimalistPolicies,
  playCompositionalMinimalistRound,
} from "./compositionalGame";
import { applyCompositionalMinimalistMessageReplacement } from "./forgetting";

function manualTemperedSoftmax(
  values: readonly number[],
  temperature: number,
): number[] {
  const maxValue = Math.max(...values);
  const exponentials = values.map((value) =>
    Math.exp((value - maxValue) / temperature),
  );
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function naiveNormalizedScores(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function sameAFeatureState(stateIndex: number): number {
  return stateIndex % 2 === 0 ? stateIndex + 1 : stateIndex - 1;
}

function oppositeAFeatureState(stateIndex: number): number {
  return stateIndex < 2 ? stateIndex + 2 : stateIndex - 2;
}

function sameBFeatureState(stateIndex: number): number {
  return stateIndex < 2 ? stateIndex + 2 : stateIndex - 2;
}

function oppositeBFeatureState(stateIndex: number): number {
  return stateIndex % 2 === 0 ? stateIndex + 1 : stateIndex - 1;
}

function sameAFeatureAction(actionIndex: number): number {
  return actionIndex % 2 === 0 ? actionIndex + 1 : actionIndex - 1;
}

function sameBFeatureAction(actionIndex: number): number {
  return actionIndex < 2 ? actionIndex + 2 : actionIndex - 2;
}

describe("createInitialCompositionalMinimalistState", () => {
  it("creates only atomic receiver-action weights alongside the shared sender matrices", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 3 });
    const state = createInitialCompositionalMinimalistState(config);

    expect(state.senderAWeights).toHaveLength(4);
    expect(state.senderBWeights).toHaveLength(4);
    expect("receiverPairWeights" in state).toBe(false);
    expect(state.receiverAtomicAWeights).toEqual([
      [3, 3, 3, 3],
      [3, 3, 3, 3],
    ]);
    expect(state.receiverAtomicBWeights).toEqual([
      [3, 3, 3, 3],
      [3, 3, 3, 3],
    ]);
  });
});

describe("deriveCompositionalMinimalistPolicies", () => {
  it("derives each pair policy from additive atomic scores and tempered softmax", () => {
    const policies = deriveCompositionalMinimalistPolicies({
      senderAWeights: [
        [1, 3],
        [2, 2],
        [4, 0],
        [0, 4],
      ],
      senderBWeights: [
        [1, 1],
        [3, 1],
        [1, 3],
        [2, 2],
      ],
      receiverAtomicAWeights: [
        [10, 0, 0, 0],
        [0, 0, 5, 5],
      ],
      receiverAtomicBWeights: [
        [10, 0, 0, 0],
        [0, 10, 0, 0],
      ],
    });
    const expectedPair00 = manualTemperedSoftmax(
      [20, 0, 0, 0],
      COMPOSITIONAL_MINIMALIST_TEMPERATURE,
    );
    const expectedPair11 = manualTemperedSoftmax(
      [0, 10, 5, 5],
      COMPOSITIONAL_MINIMALIST_TEMPERATURE,
    );

    expect(policies.senderAPolicy[0]).toEqual([0.25, 0.75]);
    expect(policies.senderBPolicy[1]).toEqual([0.75, 0.25]);
    expect(policies.receiverPairPolicy[0][0]).toEqual(expectedPair00);
    expect(policies.receiverPairPolicy[1][1]).toEqual(expectedPair11);
  });

  it("uses a sharpening transformation rather than naive linear score normalization", () => {
    const policies = deriveCompositionalMinimalistPolicies({
      senderAWeights: [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
      ],
      senderBWeights: [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
      ],
      receiverAtomicAWeights: [
        [3, 1, 1, 1],
        [1, 1, 1, 1],
      ],
      receiverAtomicBWeights: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
      ],
    });

    const combinedScores = [4, 2, 2, 2];
    expect(policies.receiverPairPolicy[0][0]).toEqual(
      manualTemperedSoftmax(
        combinedScores,
        COMPOSITIONAL_MINIMALIST_TEMPERATURE,
      ),
    );
    expect(policies.receiverPairPolicy[0][0]).not.toEqual(
      naiveNormalizedScores(combinedScores),
    );
  });
});

describe("playCompositionalMinimalistRound", () => {
  it("matches the baseline successful update semantics exactly when signaling bias is disabled", () => {
    const config = resolveCompositionalConfig({
      seed: 7,
      signalingBiasEnabled: false,
    });
    const state = {
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
      receiverAtomicAWeights: [
        [100, 4, 4, 4],
        [4, 4, 1000, 1000],
      ],
      receiverAtomicBWeights: [
        [1000, 4, 1000, 4],
        [100, 4, 4, 4],
      ],
    };

    const { nextState, event } = playCompositionalMinimalistRound(
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
      nextState.receiverAtomicAWeights[event.messageAIndex][event.actionIndex],
    ).toBe(
      state.receiverAtomicAWeights[event.messageAIndex][event.actionIndex] + 1,
    );
    expect(
      nextState.receiverAtomicBWeights[event.messageBIndex][event.actionIndex],
    ).toBe(
      state.receiverAtomicBWeights[event.messageBIndex][event.actionIndex] + 1,
    );
    const untouchedStateIndex = event.stateIndex === 0 ? 1 : 0;
    const untouchedMessageAIndex = event.messageAIndex === 0 ? 1 : 0;
    const untouchedMessageBIndex = event.messageBIndex === 0 ? 1 : 0;

    expect(nextState.senderAWeights[untouchedStateIndex]).toEqual(
      state.senderAWeights[untouchedStateIndex],
    );
    expect(nextState.senderBWeights[untouchedStateIndex]).toEqual(
      state.senderBWeights[untouchedStateIndex],
    );
    expect(nextState.receiverAtomicAWeights[untouchedMessageAIndex]).toEqual(
      state.receiverAtomicAWeights[untouchedMessageAIndex],
    );
    expect(nextState.receiverAtomicBWeights[untouchedMessageBIndex]).toEqual(
      state.receiverAtomicBWeights[untouchedMessageBIndex],
    );
  });

  it("adds feature-consistent sharpening and anti-double-booking after a successful round when bias is enabled", () => {
    const state = {
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
      receiverAtomicAWeights: [
        [100, 4, 4, 4],
        [4, 4, 1000, 1000],
      ],
      receiverAtomicBWeights: [
        [1000, 4, 1000, 4],
        [100, 4, 4, 4],
      ],
    };
    const biasOff = playCompositionalMinimalistRound(
      state,
      resolveCompositionalConfig({
        seed: 7,
        signalingBiasEnabled: false,
      }),
      new SeededPrng(7),
      1,
    );
    const biasOn = playCompositionalMinimalistRound(
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
    expect("receiverPairWeights" in biasOn.nextState).toBe(false);

    const competingSenderAIndex = biasOn.event.messageAIndex === 0 ? 1 : 0;
    const competingSenderBIndex = biasOn.event.messageBIndex === 0 ? 1 : 0;
    const sameAFeaturePartnerAction = sameAFeatureAction(biasOn.event.actionIndex);
    const sameBFeaturePartnerAction = sameBFeatureAction(biasOn.event.actionIndex);
    const incompatibleAAction =
      biasOn.event.actionIndex < 2 ? 2 : 0;
    const incompatibleBAction =
      biasOn.event.actionIndex % 2 === 0 ? 1 : 0;
    const competingAtomicAIndex = biasOn.event.messageAIndex === 0 ? 1 : 0;
    const competingAtomicBIndex = biasOn.event.messageBIndex === 0 ? 1 : 0;
    const sameFeatureAState = sameAFeatureState(biasOn.event.stateIndex);
    const oppositeFeatureAState = oppositeAFeatureState(biasOn.event.stateIndex);
    const sameFeatureBState = sameBFeatureState(biasOn.event.stateIndex);
    const oppositeFeatureBState = oppositeBFeatureState(biasOn.event.stateIndex);

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
      biasOn.nextState.senderAWeights[sameFeatureAState][competingSenderAIndex],
    ).toBeLessThan(
      biasOff.nextState.senderAWeights[sameFeatureAState][competingSenderAIndex],
    );
    expect(
      biasOn.nextState.senderAWeights[oppositeFeatureAState][
        biasOn.event.messageAIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.senderAWeights[oppositeFeatureAState][
        biasOn.event.messageAIndex
      ],
    );
    expect(
      biasOn.nextState.senderBWeights[sameFeatureBState][competingSenderBIndex],
    ).toBeLessThan(
      biasOff.nextState.senderBWeights[sameFeatureBState][competingSenderBIndex],
    );
    expect(
      biasOn.nextState.senderBWeights[oppositeFeatureBState][
        biasOn.event.messageBIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.senderBWeights[oppositeFeatureBState][
        biasOn.event.messageBIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAWeights[biasOn.event.messageAIndex][
        biasOn.event.actionIndex
      ],
    ).toBe(
      biasOff.nextState.receiverAtomicAWeights[biasOn.event.messageAIndex][
        biasOn.event.actionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBWeights[biasOn.event.messageBIndex][
        biasOn.event.actionIndex
      ],
    ).toBe(
      biasOff.nextState.receiverAtomicBWeights[biasOn.event.messageBIndex][
        biasOn.event.actionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAWeights[biasOn.event.messageAIndex][
        sameAFeaturePartnerAction
      ],
    ).toBeGreaterThan(
      biasOff.nextState.receiverAtomicAWeights[biasOn.event.messageAIndex][
        sameAFeaturePartnerAction
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBWeights[biasOn.event.messageBIndex][
        sameBFeaturePartnerAction
      ],
    ).toBeGreaterThan(
      biasOff.nextState.receiverAtomicBWeights[biasOn.event.messageBIndex][
        sameBFeaturePartnerAction
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAWeights[biasOn.event.messageAIndex][
        incompatibleAAction
      ],
    ).toBeLessThan(
      biasOff.nextState.receiverAtomicAWeights[biasOn.event.messageAIndex][
        incompatibleAAction
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBWeights[biasOn.event.messageBIndex][
        incompatibleBAction
      ],
    ).toBeLessThan(
      biasOff.nextState.receiverAtomicBWeights[biasOn.event.messageBIndex][
        incompatibleBAction
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAWeights[competingAtomicAIndex][
        biasOn.event.actionIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.receiverAtomicAWeights[competingAtomicAIndex][
        biasOn.event.actionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicAWeights[competingAtomicAIndex][
        incompatibleAAction
      ],
    ).toBe(
      biasOff.nextState.receiverAtomicAWeights[competingAtomicAIndex][
        incompatibleAAction
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBWeights[competingAtomicBIndex][
        biasOn.event.actionIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.receiverAtomicBWeights[competingAtomicBIndex][
        biasOn.event.actionIndex
      ],
    );
    expect(
      biasOn.nextState.receiverAtomicBWeights[competingAtomicBIndex][
        incompatibleBAction
      ],
    ).toBe(
      biasOff.nextState.receiverAtomicBWeights[competingAtomicBIndex][
        incompatibleBAction
      ],
    );
  });

  it("does not reinforce any sender or receiver-action structure on failure", () => {
    const config = resolveCompositionalConfig({
      seed: 11,
      signalingBiasEnabled: true,
    });
    const state = {
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
      receiverAtomicAWeights: [
        [4, 1000, 4, 4],
        [4, 4, 4, 1000],
      ],
      receiverAtomicBWeights: [
        [4, 1000, 4, 4],
        [4, 1000, 4, 4],
      ],
    };

    const { nextState, event } = playCompositionalMinimalistRound(
      state,
      config,
      new SeededPrng(11),
      1,
    );

    expect(event.success).toBe(false);
    expect(nextState).toBe(state);
  });

  it("usually reaches a signaling equilibrium over an honest seed bank when the bias is enabled", () => {
    const expectedSuccessRates: number[] = [];
    let signallingCount = 0;

    for (let seed = 0; seed < 32; seed += 1) {
      const snapshot = new CompositionalRunner({
        modelType: "minimalist",
        seed,
        signalingBiasEnabled: true,
      }).stepMany(500);

      expectedSuccessRates.push(snapshot.metrics.expectedSuccessRate);
      if (snapshot.metrics.approximateRegime.kind === "signalling-equilibrium") {
        signallingCount += 1;
      }
    }

    expect(median(expectedSuccessRates)).toBeGreaterThan(0.95);
    expect(signallingCount).toBeGreaterThanOrEqual(24);
  });
});

describe("applyCompositionalMinimalistMessageReplacement", () => {
  it("resets only the forgotten atomic row and preserves partial information from the unreplaced component", () => {
    const config = resolveCompositionalConfig({ initialReinforcement: 1 });
    const state = {
      senderAWeights: [
        [8, 2],
        [8, 2],
        [2, 8],
        [2, 8],
      ],
      senderBWeights: [
        [9, 3],
        [3, 9],
        [9, 3],
        [3, 9],
      ],
      receiverAtomicAWeights: [
        [9, 1, 1, 1],
        [1, 1, 9, 1],
      ],
      receiverAtomicBWeights: [
        [9, 9, 1, 1],
        [1, 1, 9, 9],
      ],
    };

    const replaced = applyCompositionalMinimalistMessageReplacement(
      state,
      config,
      {
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    );
    const policies = deriveCompositionalMinimalistPolicies(replaced);

    expect("receiverPairWeights" in replaced).toBe(false);
    expect(replaced.senderBWeights.map((row) => row[0])).toEqual([1, 1, 1, 1]);
    expect(replaced.senderBWeights.map((row) => row[1])).toEqual([3, 9, 3, 9]);
    expect(replaced.receiverAtomicBWeights[0]).toEqual([1, 1, 1, 1]);
    expect(replaced.receiverAtomicBWeights[1]).toEqual(state.receiverAtomicBWeights[1]);
    expect(replaced.receiverAtomicAWeights).toEqual(state.receiverAtomicAWeights);
    expect(policies.receiverPairPolicy[0][0][0]).toBeGreaterThan(0.6);
    expect(policies.receiverPairPolicy[0][0]).not.toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(policies.receiverPairPolicy[1][0][2]).toBeGreaterThan(0.6);
  });
});

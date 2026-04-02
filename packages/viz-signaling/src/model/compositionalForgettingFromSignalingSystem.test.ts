import { describe, expect, it } from "vitest";
import {
  buildCompositionalMetrics,
  calculateCompositionalJointMutualInformationBits,
  calculateCompositionalSignalActionMutualInformationBits,
  resolveCompositionalConfig,
  type CompositionalPolicies,
} from "./compositionalShared";
import { deriveCompositionalTraditionalPolicies } from "./compositionalTraditional";
import { applyCompositionalTraditionalMessageReplacement } from "./compositionalTraditional/forgetting";
import { deriveCompositionalMinimalistPolicies } from "./compositionalMinimalist/compositionalGame";
import { applyCompositionalMinimalistMessageReplacement } from "./compositionalMinimalist/forgetting";
import {
  cloneCompositionalGeneralistState,
  deriveCompositionalGeneralistPolicies,
} from "./compositionalGeneralist/compositionalGame";
import { applyCompositionalGeneralistMessageReplacement } from "./compositionalGeneralist/replacement";

const SIGNALING_CONFIG = resolveCompositionalConfig({
  initialReinforcement: 1,
});

function createStrongSignalingSenderAWeights(): number[][] {
  return [
    [101, 1],
    [101, 1],
    [1, 101],
    [1, 101],
  ];
}

function createStrongSignalingSenderBWeights(): number[][] {
  return [
    [101, 1],
    [1, 101],
    [101, 1],
    [1, 101],
  ];
}

function createStrongTraditionalState() {
  return {
    senderAWeights: createStrongSignalingSenderAWeights(),
    senderBWeights: createStrongSignalingSenderBWeights(),
    receiverPairWeights: [
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

function createStrongMinimalistState() {
  return {
    senderAWeights: createStrongSignalingSenderAWeights(),
    senderBWeights: createStrongSignalingSenderBWeights(),
    receiverAtomicAWeights: [
      [101, 101, 1, 1],
      [1, 1, 101, 101],
    ],
    receiverAtomicBWeights: [
      [101, 1, 101, 1],
      [1, 101, 1, 101],
    ],
  };
}

function createStrongGeneralistState() {
  return {
    senderAWeights: createStrongSignalingSenderAWeights(),
    senderBWeights: createStrongSignalingSenderBWeights(),
    receiverAObservationWeights: [101, 101],
    receiverBObservationWeights: [101, 101],
    receiverPairObservationWeights: [
      [101, 101],
      [101, 101],
    ],
    receiverAtomicAActionWeights: [
      [101, 101, 1, 1],
      [1, 1, 101, 101],
    ],
    receiverAtomicBActionWeights: [
      [101, 1, 101, 1],
      [1, 101, 1, 101],
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

function createPairDominantGeneralistState() {
  return {
    senderAWeights: createStrongSignalingSenderAWeights(),
    senderBWeights: createStrongSignalingSenderBWeights(),
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

function applyLegacyAtomicOnlyPreservingReplacement() {
  const state = cloneCompositionalGeneralistState(createPairDominantGeneralistState());

  state.senderBWeights.forEach((row) => {
    row[0] = SIGNALING_CONFIG.initialReinforcement;
  });
  state.receiverBObservationWeights[0] = SIGNALING_CONFIG.initialReinforcement;
  state.receiverAtomicBActionWeights[0] = [1, 1, 1, 1];
  state.receiverPairObservationWeights[0][0] = state.receiverAObservationWeights[0];
  state.receiverPairObservationWeights[1][0] = state.receiverAObservationWeights[1];
  state.receiverPairActionWeights[0][0] = [12, 12, 1, 1];
  state.receiverPairActionWeights[1][0] = [1, 1, 12, 12];

  return state;
}

function measurePolicies(policies: CompositionalPolicies): {
  regimeKind: string;
  jointMutualInformationBits: number;
  signalActionMutualInformationBits: number;
  affectedCorrectActionProbability: number;
  unaffectedCorrectActionProbability: number;
} {
  const metrics = buildCompositionalMetrics({
    policies,
    config: SIGNALING_CONFIG,
    round: 0,
    totalSuccesses: 0,
    rollingSuccessRate: 0,
  });

  return {
    regimeKind: metrics.approximateRegime.kind,
    jointMutualInformationBits: calculateCompositionalJointMutualInformationBits(
      policies,
      SIGNALING_CONFIG,
    ),
    signalActionMutualInformationBits:
      calculateCompositionalSignalActionMutualInformationBits(
        policies,
        SIGNALING_CONFIG,
      ),
    affectedCorrectActionProbability:
      (policies.receiverPairPolicy[0][0][0] +
        policies.receiverPairPolicy[1][0][2]) /
      2,
    unaffectedCorrectActionProbability:
      (policies.receiverPairPolicy[0][1][1] +
        policies.receiverPairPolicy[1][1][3]) /
      2,
  };
}

describe("forgetting from a strong signaling-system state", () => {
  it("measures signal-to-action information from receiver uncertainty rather than signal structure alone", () => {
    const senderPolicies = {
      senderAPolicy: [
        [1, 0],
        [1, 0],
        [0, 1],
        [0, 1],
      ],
      senderBPolicy: [
        [1, 0],
        [0, 1],
        [1, 0],
        [0, 1],
      ],
    };

    const uniformReceiverPolicies: CompositionalPolicies = {
      ...senderPolicies,
      receiverPairPolicy: [
        [
          [0.25, 0.25, 0.25, 0.25],
          [0.25, 0.25, 0.25, 0.25],
        ],
        [
          [0.25, 0.25, 0.25, 0.25],
          [0.25, 0.25, 0.25, 0.25],
        ],
      ],
    };
    const deterministicReceiverPolicies: CompositionalPolicies = {
      ...senderPolicies,
      receiverPairPolicy: [
        [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
        ],
        [
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ],
      ],
    };

    expect(
      calculateCompositionalSignalActionMutualInformationBits(
        uniformReceiverPolicies,
        SIGNALING_CONFIG,
      ),
    ).toBeCloseTo(0, 12);
    expect(
      calculateCompositionalSignalActionMutualInformationBits(
        deterministicReceiverPolicies,
        SIGNALING_CONFIG,
      ),
    ).toBeGreaterThan(1.99);
  });

  it("keeps all four calibrated pre-forgetting states in the signaling-equilibrium regime", () => {
    const traditional = measurePolicies(
      deriveCompositionalTraditionalPolicies(createStrongTraditionalState()),
    );
    const minimalist = measurePolicies(
      deriveCompositionalMinimalistPolicies(createStrongMinimalistState()),
    );
    const erasingGeneralist = measurePolicies(
      deriveCompositionalGeneralistPolicies(createStrongGeneralistState()),
    );
    const preservingGeneralist = measurePolicies(
      deriveCompositionalGeneralistPolicies(createStrongGeneralistState()),
    );

    expect(traditional.regimeKind).toBe("signalling-equilibrium");
    expect(minimalist.regimeKind).toBe("signalling-equilibrium");
    expect(erasingGeneralist.regimeKind).toBe("signalling-equilibrium");
    expect(preservingGeneralist.regimeKind).toBe("signalling-equilibrium");
    expect(traditional.jointMutualInformationBits).toBeGreaterThan(1.8);
    expect(minimalist.jointMutualInformationBits).toBeGreaterThan(1.8);
    expect(erasingGeneralist.jointMutualInformationBits).toBeGreaterThan(1.8);
    expect(preservingGeneralist.jointMutualInformationBits).toBeGreaterThan(1.8);
    expect(traditional.signalActionMutualInformationBits).toBeGreaterThan(1.7);
    expect(minimalist.signalActionMutualInformationBits).toBeGreaterThan(1.7);
    expect(erasingGeneralist.signalActionMutualInformationBits).toBeGreaterThan(
      1.7,
    );
    expect(
      preservingGeneralist.signalActionMutualInformationBits,
    ).toBeGreaterThan(1.7);
  });

  it("shows the expected ordering in information loss once forgetting uses signal-to-action mutual information", () => {
    const traditionalBefore = measurePolicies(
      deriveCompositionalTraditionalPolicies(createStrongTraditionalState()),
    );
    const traditionalAfter = measurePolicies(
      deriveCompositionalTraditionalPolicies(
        applyCompositionalTraditionalMessageReplacement(
          createStrongTraditionalState(),
          SIGNALING_CONFIG,
          {
            replacedSender: "b",
            replacedMessageIndex: 0,
          },
        ),
      ),
    );
    const minimalistBefore = measurePolicies(
      deriveCompositionalMinimalistPolicies(createStrongMinimalistState()),
    );
    const minimalistAfter = measurePolicies(
      deriveCompositionalMinimalistPolicies(
        applyCompositionalMinimalistMessageReplacement(
          createStrongMinimalistState(),
          SIGNALING_CONFIG,
          {
            replacedSender: "b",
            replacedMessageIndex: 0,
          },
        ),
      ),
    );
    const erasingBefore = measurePolicies(
      deriveCompositionalGeneralistPolicies(createStrongGeneralistState()),
    );
    const erasingAfter = measurePolicies(
      deriveCompositionalGeneralistPolicies(
        applyCompositionalGeneralistMessageReplacement(
          createStrongGeneralistState(),
          SIGNALING_CONFIG,
          {
            replacedSender: "b",
            replacedMessageIndex: 0,
            variant: "information-erasing",
          },
        ),
      ),
    );
    const preservingBefore = measurePolicies(
      deriveCompositionalGeneralistPolicies(createStrongGeneralistState()),
    );
    const preservingAfter = measurePolicies(
      deriveCompositionalGeneralistPolicies(
        applyCompositionalGeneralistMessageReplacement(
          createStrongGeneralistState(),
          SIGNALING_CONFIG,
          {
            replacedSender: "b",
            replacedMessageIndex: 0,
            variant: "information-preserving",
          },
        ),
      ),
    );

    const traditionalLoss =
      traditionalBefore.signalActionMutualInformationBits -
      traditionalAfter.signalActionMutualInformationBits;
    const minimalistLoss =
      minimalistBefore.signalActionMutualInformationBits -
      minimalistAfter.signalActionMutualInformationBits;
    const erasingLoss =
      erasingBefore.signalActionMutualInformationBits -
      erasingAfter.signalActionMutualInformationBits;
    const preservingLoss =
      preservingBefore.signalActionMutualInformationBits -
      preservingAfter.signalActionMutualInformationBits;

    expect(traditionalLoss).toBeGreaterThan(minimalistLoss);
    expect(erasingLoss).toBeGreaterThan(preservingLoss);
    expect(traditionalLoss).toBeCloseTo(erasingLoss, 12);
    expect(minimalistLoss).toBeLessThan(traditionalLoss - 0.1);
    expect(preservingLoss).toBeLessThan(erasingLoss - 0.2);

    expect(traditionalAfter.affectedCorrectActionProbability).toBeCloseTo(
      0.25,
      12,
    );
    expect(erasingAfter.affectedCorrectActionProbability).toBeCloseTo(
      0.25,
      12,
    );
    expect(minimalistAfter.affectedCorrectActionProbability).toBeGreaterThan(
      0.49,
    );
    expect(minimalistAfter.affectedCorrectActionProbability).toBeLessThan(0.51);
    expect(preservingAfter.affectedCorrectActionProbability).toBeGreaterThan(
      0.49,
    );
    expect(preservingAfter.affectedCorrectActionProbability).toBeLessThan(0.5);

    expect(minimalistAfter.affectedCorrectActionProbability).toBeGreaterThan(
      traditionalAfter.affectedCorrectActionProbability + 0.2,
    );
    expect(preservingAfter.affectedCorrectActionProbability).toBeGreaterThan(
      erasingAfter.affectedCorrectActionProbability + 0.2,
    );

    expect(traditionalAfter.unaffectedCorrectActionProbability).toBeGreaterThan(
      0.97,
    );
    expect(minimalistAfter.unaffectedCorrectActionProbability).toBeGreaterThan(
      0.97,
    );
    expect(erasingAfter.unaffectedCorrectActionProbability).toBeGreaterThan(
      0.97,
    );
    expect(preservingAfter.unaffectedCorrectActionProbability).toBeGreaterThan(
      0.97,
    );
  });

  it("retains more signal-to-action information than the old atomic-only preserving proxy on a pair-dominant generalist state", () => {
    const preReplacementPolicies = deriveCompositionalGeneralistPolicies(
      createPairDominantGeneralistState(),
    );
    const newPreservingPolicies = deriveCompositionalGeneralistPolicies(
      applyCompositionalGeneralistMessageReplacement(
        createPairDominantGeneralistState(),
        SIGNALING_CONFIG,
        {
          replacedSender: "b",
          replacedMessageIndex: 0,
          variant: "information-preserving",
        },
      ),
    );
    const legacyPreservingPolicies = deriveCompositionalGeneralistPolicies(
      applyLegacyAtomicOnlyPreservingReplacement(),
    );
    const erasingPolicies = deriveCompositionalGeneralistPolicies(
      applyCompositionalGeneralistMessageReplacement(
        createPairDominantGeneralistState(),
        SIGNALING_CONFIG,
        {
          replacedSender: "b",
          replacedMessageIndex: 0,
          variant: "information-erasing",
        },
      ),
    );

    const preInformation = calculateCompositionalSignalActionMutualInformationBits(
      preReplacementPolicies,
      SIGNALING_CONFIG,
    );
    const newPreservingInformation =
      calculateCompositionalSignalActionMutualInformationBits(
        newPreservingPolicies,
        SIGNALING_CONFIG,
      );
    const legacyPreservingInformation =
      calculateCompositionalSignalActionMutualInformationBits(
        legacyPreservingPolicies,
        SIGNALING_CONFIG,
      );
    const erasingInformation = calculateCompositionalSignalActionMutualInformationBits(
      erasingPolicies,
      SIGNALING_CONFIG,
    );

    expect(newPreservingInformation).toBeGreaterThan(legacyPreservingInformation + 0.05);
    expect(newPreservingInformation).toBeGreaterThan(erasingInformation + 0.2);
    expect(preInformation - newPreservingInformation).toBeLessThan(
      preInformation - legacyPreservingInformation - 0.05,
    );
  });
});

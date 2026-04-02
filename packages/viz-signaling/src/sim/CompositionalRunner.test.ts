import { describe, expect, it } from "vitest";
import { CompositionalTraditionalRunner } from "./CompositionalTraditionalRunner";
import { CompositionalRunner } from "./CompositionalRunner";
import type { CompositionalModelType } from "../model/compositionalShared";

const MODEL_TYPES: CompositionalModelType[] = [
  "traditional",
  "minimalist",
  "information-erasing-generalist",
  "information-preserving-generalist",
];

function rowPeak(row: readonly number[]): number {
  return Math.max(...row);
}

function historyPointAtRound(
  rounds: ReturnType<CompositionalRunner["getSnapshot"]>["history"],
  round: number,
) {
  return rounds.find((point) => point.round === round) ?? null;
}

function calculateAveragePolicyPeakness(rounds: number, enabled: boolean): number {
  const seeds = [3, 5, 7, 11, 13, 17];
  let totalPeakness = 0;

  for (const seed of seeds) {
    const snapshot = new CompositionalRunner({
      seed,
      modelType: "traditional",
      signalingBiasEnabled: enabled,
    }).stepMany(rounds);
    const senderAPeakness =
      snapshot.policies.senderAPolicy.reduce(
        (sum, row) => sum + rowPeak(row),
        0,
      ) / snapshot.policies.senderAPolicy.length;
    const senderBPeakness =
      snapshot.policies.senderBPolicy.reduce(
        (sum, row) => sum + rowPeak(row),
        0,
      ) / snapshot.policies.senderBPolicy.length;
    const receiverPeakness =
      snapshot.policies.receiverPairPolicy.reduce(
        (sumA, rowA) =>
          sumA +
          rowA.reduce((sumB, rowB) => sumB + rowPeak(rowB), 0) / rowA.length,
        0,
      ) / snapshot.policies.receiverPairPolicy.length;

    totalPeakness +=
      (senderAPeakness + senderBPeakness + receiverPeakness) / 3;
  }

  return totalPeakness / seeds.length;
}

describe("CompositionalRunner", () => {
  it.each(MODEL_TYPES)(
    "replays the exact same trajectory for %s with the same seed",
    (modelType) => {
      const first = new CompositionalRunner({ seed: 23, modelType }).stepMany(
        20,
      );
      const second = new CompositionalRunner({ seed: 23, modelType }).stepMany(
        20,
      );

      expect(first.state).toEqual(second.state);
      expect(first.metrics).toEqual(second.metrics);
      expect(first.history).toEqual(second.history);
    },
  );

  it("switches models and resets the run state", () => {
    const runner = new CompositionalRunner({
      seed: 5,
      modelType: "traditional",
    });
    runner.stepMany(5);

    const snapshot = runner.updateConfig({ modelType: "minimalist" });

    expect(snapshot.modelType).toBe("minimalist");
    expect(snapshot.metrics.round).toBe(0);
    expect(snapshot.history).toHaveLength(1);
    expect(snapshot.lastRoundEvent).toBeNull();
  });

  it("matches the backward-compatible traditional runner exactly", () => {
    const generic = new CompositionalRunner({
      seed: 19,
      modelType: "traditional",
    }).stepMany(25);
    const traditional = new CompositionalTraditionalRunner({
      seed: 19,
    }).stepMany(25);

    expect(generic.state).toEqual(traditional.state);
    expect(generic.metrics).toEqual(traditional.metrics);
    expect(generic.history).toEqual(traditional.history);
    expect(generic.lastRoundEvent).toEqual(traditional.lastRoundEvent);
  });

  it("keeps the two generalist variants identical in ordinary no-replacement play", () => {
    const erasing = new CompositionalRunner({
      seed: 31,
      modelType: "information-erasing-generalist",
    }).stepMany(40);
    const preserving = new CompositionalRunner({
      seed: 31,
      modelType: "information-preserving-generalist",
    }).stepMany(40);

    expect(erasing.lastRoundEvent).toEqual(preserving.lastRoundEvent);
    expect(erasing.state).toEqual(preserving.state);
    expect(erasing.policies).toEqual(preserving.policies);
    expect(erasing.metrics).toEqual(preserving.metrics);
    expect(erasing.history).toEqual(preserving.history);
  });

  it("gently increases aggregate local peakedness without privileging one fixed signaling arrangement", () => {
    const peaknessWithoutBias = calculateAveragePolicyPeakness(250, false);
    const peaknessWithBias = calculateAveragePolicyPeakness(250, true);

    expect(peaknessWithBias).toBeGreaterThan(peaknessWithoutBias + 0.03);
  });

  it("triggers manual forgetting immediately and exactly once", () => {
    const runner = new CompositionalRunner({
      seed: 17,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "manual",
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    });
    runner.stepMany(5);

    const triggered = runner.applyForgettingNow();
    const triggeredAgain = runner.applyForgettingNow();

    expect(triggered.forgetting.hasTriggered).toBe(true);
    expect(triggered.forgetting.triggeredRound).toBe(5);
    expect(triggeredAgain.forgetting).toEqual(triggered.forgetting);
    expect(triggeredAgain.state).toEqual(triggered.state);
    expect(triggeredAgain.history).toEqual(triggered.history);
  });

  it("triggers scheduled forgetting at the exact specified round even when stepMany crosses it", () => {
    const snapshot = new CompositionalRunner({
      seed: 17,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 10,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    }).stepMany(25);

    const roundNine = historyPointAtRound(snapshot.history, 9);
    const roundTen = historyPointAtRound(snapshot.history, 10);

    expect(snapshot.forgetting.hasTriggered).toBe(true);
    expect(snapshot.forgetting.triggeredRound).toBe(10);
    expect(
      snapshot.forgetting.diagnostics.currentSignalActionMutualInformationBits,
    ).not.toBeNull();
    expect(roundNine?.informationLostBits).toBeNull();
    expect(roundTen?.informationLostBits).not.toBeNull();
    expect(roundTen?.signalActionMutualInformationBits).not.toBeNull();
    expect(roundTen?.affectedCorrectActionProbability).not.toBeNull();
  });

  it("reset clears forgetting state and returns to the clean pre-forgetting run", () => {
    const runner = new CompositionalRunner({
      seed: 17,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "manual",
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    });
    runner.stepMany(4);
    runner.applyForgettingNow();

    const reset = runner.reset();

    expect(reset.metrics.round).toBe(0);
    expect(reset.forgetting.hasTriggered).toBe(false);
    expect(reset.forgetting.triggeredRound).toBeNull();
    expect(reset.history).toHaveLength(1);
    expect(reset.history[0].informationLostBits).toBeNull();
    expect(reset.history[0].affectedCorrectActionProbability).toBeNull();
  });

  it("replays the same post-forgetting trajectory with the same seed and forgetting spec", () => {
    const first = new CompositionalRunner({
      seed: 29,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 12,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    }).stepMany(30);
    const second = new CompositionalRunner({
      seed: 29,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 12,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    }).stepMany(30);

    expect(first.state).toEqual(second.state);
    expect(first.forgetting).toEqual(second.forgetting);
    expect(first.metrics).toEqual(second.metrics);
    expect(first.history).toEqual(second.history);
  });

  it("changes the trajectory when the forgetting spec changes", () => {
    const redReplacement = new CompositionalRunner({
      seed: 29,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 12,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    }).stepMany(30);
    const blueReplacement = new CompositionalRunner({
      seed: 29,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 12,
        replacedSender: "b",
        replacedMessageIndex: 1,
      },
    }).stepMany(30);

    expect(redReplacement.forgetting.diagnostics.affectedPairs).not.toEqual(
      blueReplacement.forgetting.diagnostics.affectedPairs,
    );
    expect(redReplacement.state).not.toEqual(blueReplacement.state);
  });

  it("matches manual and scheduled forgetting when applied at the same round boundary", () => {
    const manualRunner = new CompositionalRunner({
      seed: 23,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "manual",
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    });
    const scheduledRunner = new CompositionalRunner({
      seed: 23,
      modelType: "traditional",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 10,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    });

    manualRunner.stepMany(10);
    manualRunner.applyForgettingNow();
    const manual = manualRunner.stepMany(15);
    const scheduled = scheduledRunner.stepMany(25);

    expect(manual.forgetting.hasTriggered).toBe(true);
    expect(manual.forgetting.triggeredRound).toBe(10);
    expect(manual.forgetting.replacedSender).toBe("b");
    expect(manual.forgetting.replacedMessageIndex).toBe(0);
    expect(manual.forgetting.diagnostics).toEqual(scheduled.forgetting.diagnostics);
    expect(manual.state).toEqual(scheduled.state);
    expect(manual.metrics).toEqual(scheduled.metrics);
    expect(manual.history).toEqual(scheduled.history);
  });

  it("distinguishes the two Generalist variants only once forgetting is triggered", () => {
    const erasing = new CompositionalRunner({
      seed: 31,
      modelType: "information-erasing-generalist",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 40,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    }).stepMany(40);
    const preserving = new CompositionalRunner({
      seed: 31,
      modelType: "information-preserving-generalist",
      forgetting: {
        enabled: true,
        triggerMode: "scheduled",
        triggerRound: 40,
        replacedSender: "b",
        replacedMessageIndex: 0,
      },
    }).stepMany(40);

    expect(erasing.forgetting.triggeredRound).toBe(40);
    expect(preserving.forgetting.triggeredRound).toBe(40);
    expect(erasing.state).not.toEqual(preserving.state);
    expect(erasing.policies.receiverPairPolicy[0][0]).toEqual([
      0.25, 0.25, 0.25, 0.25,
    ]);
    expect(preserving.policies.receiverPairPolicy[0][0]).not.toEqual([
      0.25, 0.25, 0.25, 0.25,
    ]);
    expect(preserving.policies.receiverPairPolicy[0][0][1]).toBeGreaterThan(
      erasing.policies.receiverPairPolicy[0][0][1],
    );
  });
});

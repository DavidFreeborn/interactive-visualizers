import { SeededPrng } from "../model/prng";
import {
  buildCompositionalMetrics,
  calculateCompositionalSignalActionMutualInformationBits,
  calculateCompositionalGreedyDiagnostic,
  getCompositionalModelDefinition,
  resolveCompositionalConfig,
} from "../model/compositionalShared";
import { cloneCompositionalConfig } from "../model/compositionalShared/modelUtils";
import type {
  CompositionalConfig,
  CompositionalConfigInput,
  CompositionalForgettingConfig,
  CompositionalForgettingConfigInput,
  CompositionalForgettingPairReference,
  CompositionalForgettingSnapshot,
  CompositionalHistoryPoint,
  CompositionalMetrics,
  CompositionalModelDefinition,
  CompositionalModelType,
  CompositionalPolicies,
  CompositionalRoundEvent,
} from "../model/compositionalShared";
import type { CompositionalTraditionalState } from "../model/compositionalTraditional";
import type { CompositionalMinimalistState } from "../model/compositionalMinimalist";
import type { CompositionalGeneralistState } from "../model/compositionalGeneralist";
import {
  cloneCompositionalForgettingSnapshot,
  createEmptyCompositionalForgettingDiagnostics,
  resolveCompositionalForgettingConfig,
} from "./compositionalForgetting";

export interface CompositionalRunnerInput extends CompositionalConfigInput {
  modelType?: CompositionalModelType;
  forgetting?: CompositionalForgettingConfigInput;
}

export type CompositionalModelState =
  | CompositionalTraditionalState
  | CompositionalMinimalistState
  | CompositionalGeneralistState;

export interface CompositionalSnapshot {
  modelType: CompositionalModelType;
  config: CompositionalConfig;
  forgetting: CompositionalForgettingSnapshot;
  state: CompositionalModelState;
  policies: CompositionalPolicies;
  metrics: CompositionalMetrics;
  history: CompositionalHistoryPoint[];
  lastRoundEvent: CompositionalRoundEvent | null;
}

type InternalModelDefinition = CompositionalModelDefinition<any>;

interface InternalCompositionalForgettingState {
  config: CompositionalForgettingConfig;
  hasTriggered: boolean;
  triggeredRound: number | null;
  preForgettingPeakSignalActionMutualInformationBits: number | null;
  referenceGreedyPairByState: Array<readonly [number, number]> | null;
  affectedStateIndices: number[] | null;
  unaffectedStateIndices: number[] | null;
  preForgettingAffectedCorrectActionProbability: number | null;
  immediatePostForgettingSignalActionMutualInformationBits: number | null;
  immediatePostForgettingAffectedCorrectActionProbability: number | null;
  immediatePostForgettingUnaffectedCorrectActionProbability: number | null;
}

function clonePairReferences(
  pairs: readonly CompositionalForgettingPairReference[],
): CompositionalForgettingPairReference[] {
  return pairs.map((pair) => ({ ...pair }));
}

function clampInformationLoss(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return Math.max(0, value);
}

/**
 * Immutable deterministic runner for the supported compositional signaling models.
 */
export class CompositionalRunner {
  private modelType: CompositionalModelType;
  private model: InternalModelDefinition;
  private config: CompositionalConfig;
  private forgetting: InternalCompositionalForgettingState;
  private prng: SeededPrng;
  private state: CompositionalModelState;
  private round: number;
  private totalSuccesses: number;
  private recentOutcomes: number[];
  private rollingSuccesses: number;
  private history: CompositionalHistoryPoint[];
  private lastRoundEvent: CompositionalRoundEvent | null;

  constructor(input: CompositionalRunnerInput = {}) {
    this.modelType = input.modelType ?? "traditional";
    this.model = getCompositionalModelDefinition(
      this.modelType,
    ) as InternalModelDefinition;
    this.config = resolveCompositionalConfig(input);
    this.forgetting = this.createInitialForgettingState(input.forgetting);
    this.prng = new SeededPrng(this.config.seed);
    this.state = this.model.createInitialState(
      this.config,
    ) as CompositionalModelState;
    this.round = 0;
    this.totalSuccesses = 0;
    this.recentOutcomes = [];
    this.rollingSuccesses = 0;
    this.lastRoundEvent = null;

    const initialPolicies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;
    const initialMetrics = this.createMetrics(initialPolicies);
    this.initializeForgettingPeak(
      calculateCompositionalSignalActionMutualInformationBits(
        initialPolicies,
        this.config,
      ),
    );
    this.history = [this.createHistoryPoint(initialPolicies, initialMetrics)];
  }

  getModelType(): CompositionalModelType {
    return this.modelType;
  }

  getConfig(): CompositionalConfig {
    return cloneCompositionalConfig(this.config);
  }

  getSnapshot(): CompositionalSnapshot {
    const policies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;

    return {
      modelType: this.modelType,
      config: this.getConfig(),
      forgetting: this.createForgettingSnapshot(policies),
      state: this.model.cloneState(this.state) as CompositionalModelState,
      policies,
      metrics: this.createMetrics(policies),
      history: this.history.map((point) => ({ ...point })),
      lastRoundEvent: this.lastRoundEvent ? { ...this.lastRoundEvent } : null,
    };
  }

  step(): CompositionalSnapshot {
    this.runOneRound();
    return this.getSnapshot();
  }

  stepMany(rounds: number): CompositionalSnapshot {
    if (!Number.isInteger(rounds) || rounds < 0) {
      throw new Error("rounds must be a non-negative integer.");
    }

    for (let index = 0; index < rounds; index += 1) {
      this.runOneRound();
    }

    return this.getSnapshot();
  }

  applyForgettingNow(): CompositionalSnapshot {
    if (
      !this.forgetting.config.enabled ||
      this.forgetting.hasTriggered ||
      this.forgetting.config.triggerMode !== "manual"
    ) {
      return this.getSnapshot();
    }

    const prePolicies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;
    this.applyMessageReplacement(this.round, prePolicies);
    const postPolicies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;
    const postMetrics = this.createMetrics(postPolicies);
    this.replaceLatestHistoryPoint(postPolicies, postMetrics);

    return this.getSnapshot();
  }

  reset(): CompositionalSnapshot {
    this.prng = new SeededPrng(this.config.seed);
    this.state = this.model.createInitialState(
      this.config,
    ) as CompositionalModelState;
    this.round = 0;
    this.totalSuccesses = 0;
    this.recentOutcomes = [];
    this.rollingSuccesses = 0;
    this.lastRoundEvent = null;
    this.forgetting = this.createInitialForgettingState(this.forgetting.config);

    const initialPolicies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;
    const initialMetrics = this.createMetrics(initialPolicies);
    this.initializeForgettingPeak(
      calculateCompositionalSignalActionMutualInformationBits(
        initialPolicies,
        this.config,
      ),
    );
    this.history = [this.createHistoryPoint(initialPolicies, initialMetrics)];

    return this.getSnapshot();
  }

  updateConfig(input: CompositionalRunnerInput): CompositionalSnapshot {
    const nextModelType = input.modelType ?? this.modelType;
    const { modelType: _ignoredModelType, forgetting, ...configInput } = input;

    this.modelType = nextModelType;
    this.model = getCompositionalModelDefinition(
      this.modelType,
    ) as InternalModelDefinition;
    this.config = resolveCompositionalConfig({
      ...this.config,
      ...configInput,
    });
    this.forgetting = this.createInitialForgettingState({
      ...this.forgetting.config,
      ...forgetting,
    });

    return this.reset();
  }

  private createInitialForgettingState(
    input?: CompositionalForgettingConfigInput | CompositionalForgettingConfig,
  ): InternalCompositionalForgettingState {
    const config = resolveCompositionalForgettingConfig(input, this.config);

    return {
      config,
      hasTriggered: false,
      triggeredRound: null,
      preForgettingPeakSignalActionMutualInformationBits: null,
      referenceGreedyPairByState: null,
      affectedStateIndices: null,
      unaffectedStateIndices: null,
      preForgettingAffectedCorrectActionProbability: null,
      immediatePostForgettingSignalActionMutualInformationBits: null,
      immediatePostForgettingAffectedCorrectActionProbability: null,
      immediatePostForgettingUnaffectedCorrectActionProbability: null,
    };
  }

  private initializeForgettingPeak(
    signalActionMutualInformationBits: number,
  ): void {
    if (!this.forgetting.config.enabled) {
      return;
    }

    this.forgetting.preForgettingPeakSignalActionMutualInformationBits =
      signalActionMutualInformationBits;
  }

  private runOneRound(): void {
    const { nextState, event } = this.model.playRound(
      this.state,
      this.config,
      this.prng,
      this.round + 1,
    ) as {
      nextState: CompositionalModelState;
      event: CompositionalRoundEvent;
    };

    this.state = nextState;
    this.round = event.round;
    this.lastRoundEvent = event;

    if (event.success) {
      this.totalSuccesses += 1;
    }

    this.recentOutcomes.push(event.reward);
    this.rollingSuccesses += event.reward;

    if (this.recentOutcomes.length > this.config.rollingWindowSize) {
      const droppedOutcome = this.recentOutcomes.shift();
      if (droppedOutcome !== undefined) {
        this.rollingSuccesses -= droppedOutcome;
      }
    }

    let policies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;
    let metrics = this.createMetrics(policies);

    this.updatePreForgettingPeak(
      calculateCompositionalSignalActionMutualInformationBits(
        policies,
        this.config,
      ),
    );

    if (this.shouldApplyScheduledForgetting(event.round)) {
      this.applyMessageReplacement(event.round, policies);
      policies = this.model.derivePolicies(
        this.state,
        this.config,
      ) as CompositionalPolicies;
      metrics = this.createMetrics(policies);
    }

    this.history.push(this.createHistoryPoint(policies, metrics));
  }

  private shouldApplyScheduledForgetting(round: number): boolean {
    return (
      this.forgetting.config.enabled &&
      !this.forgetting.hasTriggered &&
      this.forgetting.config.triggerMode === "scheduled" &&
      this.forgetting.config.triggerRound === round
    );
  }

  private updatePreForgettingPeak(
    signalActionMutualInformationBits: number,
  ): void {
    if (!this.forgetting.config.enabled || this.forgetting.hasTriggered) {
      return;
    }

    this.forgetting.preForgettingPeakSignalActionMutualInformationBits =
      Math.max(
        this.forgetting.preForgettingPeakSignalActionMutualInformationBits ??
          signalActionMutualInformationBits,
        signalActionMutualInformationBits,
      );
  }

  private applyMessageReplacement(
    triggeredRound: number,
    prePolicies: CompositionalPolicies,
  ): void {
    const preSignalActionMutualInformationBits =
      calculateCompositionalSignalActionMutualInformationBits(
        prePolicies,
        this.config,
      );
    this.updatePreForgettingPeak(preSignalActionMutualInformationBits);

    const preForgettingGreedyDiagnostic = calculateCompositionalGreedyDiagnostic(
      prePolicies,
      this.config,
    );
    const referenceGreedyPairByState =
      preForgettingGreedyDiagnostic.greedyPairByState.map(
        ([messageAIndex, messageBIndex]) =>
          [messageAIndex, messageBIndex] as const,
      );
    const affectedStateIndices = referenceGreedyPairByState
      .map(([messageAIndex, messageBIndex], stateIndex) => {
        const isAffected =
          this.forgetting.config.replacedSender === "a"
            ? messageAIndex === this.forgetting.config.replacedMessageIndex
            : messageBIndex === this.forgetting.config.replacedMessageIndex;

        return isAffected ? stateIndex : -1;
      })
      .filter((stateIndex) => stateIndex >= 0);
    const unaffectedStateIndices = referenceGreedyPairByState
      .map((_pair, stateIndex) => stateIndex)
      .filter((stateIndex) => !affectedStateIndices.includes(stateIndex));

    this.state = this.model.applyMessageReplacement(
      this.state,
      this.config,
      this.forgetting.config,
    ) as CompositionalModelState;
    this.forgetting.hasTriggered = true;
    this.forgetting.triggeredRound = triggeredRound;
    this.forgetting.referenceGreedyPairByState = referenceGreedyPairByState;
    this.forgetting.affectedStateIndices = affectedStateIndices;
    this.forgetting.unaffectedStateIndices = unaffectedStateIndices;
    this.forgetting.preForgettingAffectedCorrectActionProbability =
      this.calculateReferenceCorrectActionProbability(
        affectedStateIndices,
        referenceGreedyPairByState,
        prePolicies,
      );

    const postPolicies = this.model.derivePolicies(
      this.state,
      this.config,
    ) as CompositionalPolicies;
    const postSignalActionMutualInformationBits =
      calculateCompositionalSignalActionMutualInformationBits(
        postPolicies,
        this.config,
      );

    this.forgetting.immediatePostForgettingSignalActionMutualInformationBits =
      postSignalActionMutualInformationBits;
    this.forgetting.immediatePostForgettingAffectedCorrectActionProbability =
      this.calculateReferenceCorrectActionProbability(
        affectedStateIndices,
        referenceGreedyPairByState,
        postPolicies,
      );
    this.forgetting.immediatePostForgettingUnaffectedCorrectActionProbability =
      this.calculateReferenceCorrectActionProbability(
        unaffectedStateIndices,
        referenceGreedyPairByState,
        postPolicies,
      );
  }

  private calculateReferenceCorrectActionProbability(
    stateIndices: readonly number[] | null,
    referenceGreedyPairByState:
      | ReadonlyArray<readonly [number, number]>
      | null,
    policies: CompositionalPolicies,
  ): number | null {
    if (
      stateIndices === null ||
      referenceGreedyPairByState === null ||
      stateIndices.length === 0
    ) {
      return null;
    }

    return (
      stateIndices.reduce((sum, stateIndex) => {
        const [messageAIndex, messageBIndex] =
          referenceGreedyPairByState[stateIndex];

        return (
          sum +
          policies.receiverPairPolicy[messageAIndex][messageBIndex][
            this.config.correctActions[stateIndex]
          ]
        );
      }, 0) / stateIndices.length
    );
  }

  private createMetrics(
    policies?: CompositionalPolicies,
  ): CompositionalMetrics {
    const resolvedPolicies =
      policies ??
      (this.model.derivePolicies(
        this.state,
        this.config,
      ) as CompositionalPolicies);
    const rollingSuccessRate =
      this.recentOutcomes.length === 0
        ? 0
        : this.rollingSuccesses / this.recentOutcomes.length;

    return buildCompositionalMetrics({
      policies: resolvedPolicies,
      config: this.config,
      round: this.round,
      totalSuccesses: this.totalSuccesses,
      rollingSuccessRate,
    });
  }

  private createForgettingSnapshot(
    policies: CompositionalPolicies,
  ): CompositionalForgettingSnapshot {
    const diagnostics = createEmptyCompositionalForgettingDiagnostics(
      this.config,
      this.forgetting.config,
    );
    const currentAffectedCorrectActionProbability =
      this.calculateReferenceCorrectActionProbability(
        this.forgetting.affectedStateIndices,
        this.forgetting.referenceGreedyPairByState,
        policies,
      );
    const currentUnaffectedCorrectActionProbability =
      this.calculateReferenceCorrectActionProbability(
        this.forgetting.unaffectedStateIndices,
        this.forgetting.referenceGreedyPairByState,
        policies,
      );
    const currentSignalActionMutualInformationBits =
      calculateCompositionalSignalActionMutualInformationBits(
        policies,
        this.config,
      );

    diagnostics.preForgettingPeakSignalActionMutualInformationBits =
      this.forgetting.preForgettingPeakSignalActionMutualInformationBits;
    diagnostics.immediatePostForgettingSignalActionMutualInformationBits =
      this.forgetting.immediatePostForgettingSignalActionMutualInformationBits;
    diagnostics.currentSignalActionMutualInformationBits =
      this.forgetting.hasTriggered || this.forgetting.config.enabled
        ? currentSignalActionMutualInformationBits
        : null;
    diagnostics.peakInformationLostBits = clampInformationLoss(
      this.forgetting.preForgettingPeakSignalActionMutualInformationBits ===
        null ||
        this.forgetting.immediatePostForgettingSignalActionMutualInformationBits ===
          null
        ? null
        : this.forgetting.preForgettingPeakSignalActionMutualInformationBits -
            this.forgetting
              .immediatePostForgettingSignalActionMutualInformationBits,
    );
    diagnostics.informationLostBits = clampInformationLoss(
      this.forgetting.preForgettingPeakSignalActionMutualInformationBits ===
        null ||
        !this.forgetting.hasTriggered
        ? null
        : this.forgetting.preForgettingPeakSignalActionMutualInformationBits -
            currentSignalActionMutualInformationBits,
    );
    diagnostics.preForgettingAffectedCorrectActionProbability =
      this.forgetting.preForgettingAffectedCorrectActionProbability;
    diagnostics.immediatePostForgettingAffectedCorrectActionProbability =
      this.forgetting.immediatePostForgettingAffectedCorrectActionProbability;
    diagnostics.immediatePostForgettingUnaffectedCorrectActionProbability =
      this.forgetting.immediatePostForgettingUnaffectedCorrectActionProbability;
    diagnostics.currentAffectedCorrectActionProbability =
      currentAffectedCorrectActionProbability;
    diagnostics.currentUnaffectedCorrectActionProbability =
      currentUnaffectedCorrectActionProbability;

    return cloneCompositionalForgettingSnapshot({
      ...this.forgetting.config,
      hasTriggered: this.forgetting.hasTriggered,
      triggeredRound: this.forgetting.triggeredRound,
      diagnostics: {
        ...diagnostics,
        affectedPairs: clonePairReferences(diagnostics.affectedPairs),
        unaffectedPairs: clonePairReferences(diagnostics.unaffectedPairs),
      },
    });
  }

  private createHistoryPoint(
    policies?: CompositionalPolicies,
    metrics?: CompositionalMetrics,
  ): CompositionalHistoryPoint {
    const resolvedPolicies =
      policies ??
      (this.model.derivePolicies(
        this.state,
        this.config,
      ) as CompositionalPolicies);
    const resolvedMetrics = metrics ?? this.createMetrics(resolvedPolicies);
    const forgettingSnapshot = this.createForgettingSnapshot(resolvedPolicies);

    return {
      round: resolvedMetrics.round,
      cumulativeSuccessRate: resolvedMetrics.cumulativeSuccessRate,
      rollingSuccessRate: resolvedMetrics.rollingSuccessRate,
      expectedSuccessRate: resolvedMetrics.expectedSuccessRate,
      senderAMutualInformationBits: resolvedMetrics.senderAMutualInformationBits,
      senderBMutualInformationBits: resolvedMetrics.senderBMutualInformationBits,
      jointMutualInformationBits: resolvedMetrics.jointMutualInformationBits,
      signalActionMutualInformationBits:
        forgettingSnapshot.diagnostics.currentSignalActionMutualInformationBits,
      affectedCorrectActionProbability:
        forgettingSnapshot.diagnostics.currentAffectedCorrectActionProbability,
      unaffectedCorrectActionProbability:
        forgettingSnapshot.diagnostics.currentUnaffectedCorrectActionProbability,
      informationLostBits: forgettingSnapshot.diagnostics.informationLostBits,
    };
  }

  private replaceLatestHistoryPoint(
    policies: CompositionalPolicies,
    metrics: CompositionalMetrics,
  ): void {
    if (this.history.length === 0) {
      this.history.push(this.createHistoryPoint(policies, metrics));
      return;
    }

    this.history[this.history.length - 1] = this.createHistoryPoint(
      policies,
      metrics,
    );
  }
}

import {
  buildSignalingMetrics,
  createInitialSignalingGameState,
  derivePolicies,
  playRound,
} from '../model';
import { SeededPrng } from '../model/prng';
import { resolveSignalingGameConfig } from '../model/validation';
import type {
  SignalingGameConfig,
  SignalingGameConfigInput,
  SignalingGameState,
  SimulationHistoryPoint,
  SimulationSnapshot,
  SignalingRoundEvent,
} from '../model/types';

/**
 * Immutable baseline simulation runner with deterministic stepping and full history.
 */
export class SimulationRunner {
  private config: SignalingGameConfig;
  private prng: SeededPrng;
  private state: SignalingGameState;
  private round: number;
  private totalSuccesses: number;
  private recentOutcomes: number[];
  private rollingSuccesses: number;
  private history: SimulationHistoryPoint[];
  private lastRoundEvent: SignalingRoundEvent | null;

  /**
   * Creates a runner using a validated configuration and initial state.
   */
  constructor(input: SignalingGameConfigInput = {}) {
    this.config = resolveSignalingGameConfig(input);
    this.prng = new SeededPrng(this.config.seed);
    this.state = createInitialSignalingGameState(this.config);
    this.round = 0;
    this.totalSuccesses = 0;
    this.recentOutcomes = [];
    this.rollingSuccesses = 0;
    this.lastRoundEvent = null;
    this.history = [this.createHistoryPoint()];
  }

  /**
   * Returns the current resolved configuration.
   */
  getConfig(): SignalingGameConfig {
    return {
      ...this.config,
      prior: [...this.config.prior],
      correctActions: [...this.config.correctActions],
    };
  }

  /**
   * Returns a deep snapshot of the current simulation state.
   */
  getSnapshot(): SimulationSnapshot {
    return {
      config: this.getConfig(),
      state: {
        senderWeights: this.state.senderWeights.map((row) => [...row]),
        receiverWeights: this.state.receiverWeights.map((row) => [...row]),
      },
      policies: derivePolicies(this.state),
      metrics: this.createMetrics(),
      history: this.history.map((point) => ({ ...point })),
      lastRoundEvent: this.lastRoundEvent ? { ...this.lastRoundEvent } : null,
    };
  }

  /**
   * Steps the simulation exactly one round.
   */
  step(): SimulationSnapshot {
    this.runOneRound();
    return this.getSnapshot();
  }

  /**
   * Steps the simulation repeatedly and returns the final snapshot.
   */
  stepMany(rounds: number): SimulationSnapshot {
    if (!Number.isInteger(rounds) || rounds < 0) {
      throw new Error('rounds must be a non-negative integer.');
    }

    for (let index = 0; index < rounds; index += 1) {
      this.runOneRound();
    }

    return this.getSnapshot();
  }

  /**
   * Resets the runner to the exact initial state for the current configuration and seed.
   */
  reset(): SimulationSnapshot {
    this.prng = new SeededPrng(this.config.seed);
    this.state = createInitialSignalingGameState(this.config);
    this.round = 0;
    this.totalSuccesses = 0;
    this.recentOutcomes = [];
    this.rollingSuccesses = 0;
    this.lastRoundEvent = null;
    this.history = [this.createHistoryPoint()];
    return this.getSnapshot();
  }

  /**
   * Rebuilds the runner around a new configuration and returns the reset snapshot.
   */
  updateConfig(input: SignalingGameConfigInput): SimulationSnapshot {
    this.config = resolveSignalingGameConfig({
      ...this.config,
      ...input,
    });
    return this.reset();
  }

  private runOneRound(): void {
    const { nextState, event } = playRound(this.state, this.config, this.prng, this.round + 1);
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

    this.history.push(this.createHistoryPoint());
  }

  private createMetrics() {
    const rollingSuccessRate =
      this.recentOutcomes.length === 0 ? 0 : this.rollingSuccesses / this.recentOutcomes.length;

    return buildSignalingMetrics({
      state: this.state,
      config: this.config,
      round: this.round,
      totalSuccesses: this.totalSuccesses,
      rollingSuccessRate,
    });
  }

  private createHistoryPoint(): SimulationHistoryPoint {
    const metrics = this.createMetrics();
    return {
      round: metrics.round,
      cumulativeSuccessRate: metrics.cumulativeSuccessRate,
      rollingSuccessRate: metrics.rollingSuccessRate,
      expectedSuccessRate: metrics.expectedSuccessRate,
      mutualInformationBits: metrics.mutualInformationBits,
      normalizedMutualInformation: metrics.normalizedMutualInformation,
    };
  }
}

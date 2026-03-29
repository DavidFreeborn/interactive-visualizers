/**
 * Simulation wrapper for the Signaling Games model.
 *
 * Handles stepping, history tracking, and provides a clean interface
 * for the UI to interact with.
 */

import { SeededRandom } from '@viz/core-math';
import {
  SignalingGameModel,
  DEFAULT_CONFIG,
  computeMetrics,
} from '../model/SignalingGameModel';
import type {
  SignalingGameConfig,
  SignalingGameState,
  SignalingMetrics,
} from '../model/types';

/**
 * History sampling rate: record metrics every N turns.
 */
const HISTORY_SAMPLE_RATE = 100;

/**
 * The SignalingSimulation class wraps the model with simulation state
 * management, including RNG and history tracking.
 */
export class SignalingSimulation {
  private model: SignalingGameModel;
  private state: SignalingGameState;
  private rng: SeededRandom;
  private initialRngState: number;

  constructor(config: Partial<SignalingGameConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    this.model = new SignalingGameModel(fullConfig);
    this.rng = new SeededRandom(fullConfig.seed);
    this.initialRngState = this.rng.getState();
    this.state = this.model.createInitialState();
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): SignalingGameConfig {
    return this.model.config;
  }

  /**
   * Gets the current state (read-only snapshot).
   */
  getState(): Readonly<SignalingGameState> {
    return this.state;
  }

  /**
   * Gets the current metrics.
   */
  getMetrics(): SignalingMetrics {
    return this.model.computeMetrics(this.state);
  }

  /**
   * Gets the sender urn probabilities for visualization.
   * Returns: senderProbs[senderId][stateId] = probability distribution over messages
   */
  getSenderProbabilities(): number[][][] {
    const probs: number[][][] = [];
    for (let s = 0; s < this.model.config.numSenders; s++) {
      const senderProbs: number[][] = [];
      for (let state = 0; state < this.model.config.numStates; state++) {
        const urn = this.state.senderUrns[s][state];
        const sum = urn.reduce((a, b) => a + b, 0);
        senderProbs.push(urn.map((v) => v / sum));
      }
      probs.push(senderProbs);
    }
    return probs;
  }

  /**
   * Gets the receiver urn probabilities for visualization.
   * Returns: receiverProbs[messagePairIndex] = probability distribution over actions
   */
  getReceiverProbabilities(): number[][] {
    return this.state.receiverUrns.map((urn) => {
      const sum = urn.reduce((a, b) => a + b, 0);
      return urn.map((v) => v / sum);
    });
  }

  /**
   * Steps the simulation forward by one round.
   */
  step(): void {
    // Check for replacement
    if (this.model.shouldReplace(this.state)) {
      this.model.performReplacement(this.state);
    }

    // Run one round
    const result = this.model.runRound(this.state, this.rng);

    // Update urns if successful
    this.model.updateUrns(this.state, result);

    // Update counters
    this.state.turn += 1;
    this.state.totalRounds += 1;
    if (result.success) {
      this.state.successCount += 1;
    }

    // Sample history
    if (this.state.turn % HISTORY_SAMPLE_RATE === 0) {
      const metrics = this.model.computeMetrics(this.state);
      this.state.infoHistory.push(metrics.avgInformationContent);
      this.state.successHistory.push(metrics.successRate);
    }
  }

  /**
   * Steps the simulation forward by N rounds.
   */
  stepN(n: number): void {
    for (let i = 0; i < n; i++) {
      this.step();
    }
  }

  /**
   * Resets the simulation to initial state with the same seed.
   */
  reset(): void {
    this.rng = new SeededRandom(this.model.config.seed);
    this.initialRngState = this.rng.getState();
    this.state = this.model.createInitialState();
  }

  /**
   * Resets with a new seed.
   */
  resetWithSeed(seed: number): void {
    const newConfig = { ...this.model.config, seed };
    this.model = new SignalingGameModel(newConfig);
    this.rng = new SeededRandom(seed);
    this.initialRngState = this.rng.getState();
    this.state = this.model.createInitialState();
  }

  /**
   * Returns whether the simulation has reached a stable signaling system.
   */
  hasConverged(): boolean {
    return this.getMetrics().hasSignalingSystem;
  }

  /**
   * Returns whether replacement has occurred.
   */
  hasReplaced(): boolean {
    return this.state.replacementOccurred;
  }

  /**
   * Gets the history data for timeline visualization.
   */
  getHistory(): {
    turns: number[];
    infoContent: number[];
    successRate: number[];
    replacementTurn: number | null;
  } {
    const turns = this.state.infoHistory.map(
      (_, i) => (i + 1) * HISTORY_SAMPLE_RATE
    );
    return {
      turns,
      infoContent: [...this.state.infoHistory],
      successRate: [...this.state.successHistory],
      replacementTurn: this.state.replacementAtTurn,
    };
  }
}

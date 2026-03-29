/**
 * Simulation wrapper for manifold learning.
 */

import { SeededRandom } from '@viz/core-math';
import {
  ManifoldModel,
  DEFAULT_CONFIG,
} from '../model/ManifoldModel';
import type {
  ManifoldConfig,
  ManifoldState,
  ManifoldMetrics,
} from '../model/types';

/**
 * The ManifoldSimulation class manages state and provides a clean interface
 * for the UI.
 */
export class ManifoldSimulation {
  private model: ManifoldModel;
  private state: ManifoldState;
  private rng: SeededRandom;

  constructor(config: Partial<ManifoldConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    this.model = new ManifoldModel(fullConfig);
    this.rng = new SeededRandom(fullConfig.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): ManifoldConfig {
    return this.model.config;
  }

  /**
   * Gets the current state.
   */
  getState(): Readonly<ManifoldState> {
    return this.state;
  }

  /**
   * Runs the embedding algorithm.
   */
  runEmbedding(): void {
    this.state = this.model.runEmbedding(this.state);
  }

  /**
   * Checks if embedding has been computed.
   */
  isEmbedded(): boolean {
    return this.state.isEmbedded;
  }

  /**
   * Gets current metrics.
   */
  getMetrics(): ManifoldMetrics {
    return this.model.computeMetrics(this.state);
  }

  /**
   * Resets the simulation with the same seed.
   */
  reset(): void {
    this.rng = new SeededRandom(this.model.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Resets with a new seed.
   */
  resetWithSeed(seed: number): void {
    const newConfig = { ...this.model.config, seed };
    this.model = new ManifoldModel(newConfig);
    this.rng = new SeededRandom(seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Resets with a new configuration.
   */
  resetWithConfig(config: Partial<ManifoldConfig>): void {
    const newConfig = { ...this.model.config, ...config };
    this.model = new ManifoldModel(newConfig);
    this.rng = new SeededRandom(newConfig.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Gets data for visualization.
   */
  getVisualizationData(): {
    originals: number[][];
    embedded: number[][];
    params: number[];
    neighborGraph: number[][];
  } {
    return {
      originals: this.state.points.map((p) => p.original),
      embedded: this.state.points.map((p) => p.embedded),
      params: this.state.points.map((p) => p.param),
      neighborGraph: this.state.neighborGraph,
    };
  }
}

/**
 * Simulation wrapper for the Factionalization & Polarization visualizer.
 */

import { SeededRandom } from '@viz/core-math';
import {
  PolarizationModel,
  DEFAULT_CONFIG,
} from '../model/PolarizationModel';
import type {
  PolarizationConfig,
  PolarizationState,
  PolarizationMetrics,
  AgentBeliefs,
} from '../model/types';
import { getNetwork } from '../model/networks';

/**
 * The PolarizationSimulation class manages state and provides UI interface.
 */
export class PolarizationSimulation {
  private model: PolarizationModel;
  private state: PolarizationState;
  private rng: SeededRandom;

  constructor(config: Partial<PolarizationConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    this.model = new PolarizationModel(fullConfig);
    this.rng = new SeededRandom(fullConfig.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  getConfig(): PolarizationConfig {
    return this.model.config;
  }

  getState(): Readonly<PolarizationState> {
    return this.state;
  }

  getNetwork() {
    return getNetwork(this.model.config.networkType);
  }

  getMetrics(): PolarizationMetrics {
    return this.model.computeMetrics(this.state);
  }

  /**
   * Gets belief trajectories for visualization.
   */
  getTrajectories(): { agent: number; h: number; timestep: number }[] {
    const trajectories: { agent: number; h: number; timestep: number }[] = [];
    this.state.history.forEach((agents, t) => {
      agents.forEach((agent, i) => {
        trajectories.push({ agent: i, h: agent.h, timestep: t });
      });
    });
    return trajectories;
  }

  /**
   * Steps simulation forward by one timestep.
   */
  step(): void {
    if (this.state.timestep < this.model.config.numTimesteps) {
      this.state = this.model.step(this.state, this.rng);
    }
  }

  /**
   * Runs simulation to completion.
   */
  runToEnd(): void {
    while (this.state.timestep < this.model.config.numTimesteps) {
      this.step();
    }
  }

  /**
   * Checks if simulation is complete.
   */
  isComplete(): boolean {
    return this.state.timestep >= this.model.config.numTimesteps;
  }

  /**
   * Resets simulation with same seed.
   */
  reset(): void {
    this.rng = new SeededRandom(this.model.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Resets with new seed.
   */
  resetWithSeed(seed: number): void {
    const newConfig = { ...this.model.config, seed };
    this.model = new PolarizationModel(newConfig);
    this.rng = new SeededRandom(seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Resets with new configuration.
   */
  resetWithConfig(config: Partial<PolarizationConfig>): void {
    const newConfig = { ...this.model.config, ...config };
    this.model = new PolarizationModel(newConfig);
    this.rng = new SeededRandom(newConfig.seed);
    this.state = this.model.createInitialState(this.rng);
  }
}

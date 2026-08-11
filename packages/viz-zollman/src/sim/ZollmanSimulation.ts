/**
 * Simulation wrapper for the Zollman Effect visualizer.
 */

import { SeededRandom } from '@viz/core-math';
import { ZollmanModel, DEFAULT_CONFIG } from '../model/ZollmanModel';
import type { ZollmanConfig, ZollmanState, ZollmanMetrics } from '../model/types';

export class ZollmanSimulation {
  private model: ZollmanModel;
  private state: ZollmanState;
  private rng: SeededRandom;

  constructor(config: Partial<ZollmanConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    this.model = new ZollmanModel(fullConfig);
    this.rng = new SeededRandom(fullConfig.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  getConfig(): ZollmanConfig {
    return this.model.config;
  }

  getState(): Readonly<ZollmanState> {
    return this.state;
  }

  getMetrics(): ZollmanMetrics {
    return this.model.computeMetrics(this.state);
  }

  step(): void {
    this.state = this.model.step(this.state, this.rng);
  }

  stepN(n: number): void {
    for (let i = 0; i < n; i++) {
      this.step();
    }
  }

  reset(): void {
    this.rng = new SeededRandom(this.model.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  resetWithSeed(seed: number): void {
    const newConfig = { ...this.model.config, seed };
    this.model = new ZollmanModel(newConfig);
    this.rng = new SeededRandom(seed);
    this.state = this.model.createInitialState(this.rng);
  }

  resetWithConfig(config: Partial<ZollmanConfig>): void {
    const newConfig = { ...this.model.config, ...config };
    this.model = new ZollmanModel(newConfig);
    this.rng = new SeededRandom(newConfig.seed);
    this.state = this.model.createInitialState(this.rng);
  }
}

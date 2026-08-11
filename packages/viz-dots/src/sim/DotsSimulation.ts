/**
 * Simulation wrapper for the Swarm Dynamics visualizer.
 *
 * Manages state, RNG, and provides step/reset interface
 * following the pattern of other visualizers in this project.
 */

import { SeededRandom } from '@viz/core-math';
import type {
  DotsConfig,
  DotsState,
  DotsMetrics,
  Interaction,
  RenderOptions,
} from '../model/types';
import { DEFAULT_CONFIG, DEFAULT_RENDER_OPTIONS } from '../model/types';
import { DotsModel } from '../model/DotsModel';

export class DotsSimulation {
  private config: DotsConfig;
  private renderOptions: RenderOptions;
  private model: DotsModel;
  private rng: SeededRandom;
  private state: DotsState;
  private interaction: Interaction | null = null;

  constructor(
    config: Partial<DotsConfig> = {},
    renderOptions: Partial<RenderOptions> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.renderOptions = { ...DEFAULT_RENDER_OPTIONS, ...renderOptions };
    this.model = new DotsModel(this.config);
    this.rng = new SeededRandom(this.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Get the current simulation state.
   */
  getState(): DotsState {
    return this.state;
  }

  /**
   * Get current metrics.
   */
  getMetrics(): DotsMetrics {
    return this.model.computeMetrics(this.state);
  }

  /**
   * Get current configuration.
   */
  getConfig(): DotsConfig {
    return this.config;
  }

  /**
   * Get render options.
   */
  getRenderOptions(): RenderOptions {
    return this.renderOptions;
  }

  /**
   * Advance simulation by one step.
   */
  step(): void {
    this.state = this.model.step(
      this.state,
      this.rng,
      this.interaction,
      this.renderOptions
    );
  }

  /**
   * Reset to initial state with current seed.
   */
  reset(): void {
    this.rng = new SeededRandom(this.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Reset with a new seed.
   */
  resetWithSeed(seed: number): void {
    this.config = { ...this.config, seed };
    this.model.updateConfig({ seed });
    this.rng = new SeededRandom(seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Reset with new configuration.
   */
  resetWithConfig(config: Partial<DotsConfig>): void {
    this.config = { ...this.config, ...config };
    this.model = new DotsModel(this.config);
    this.rng = new SeededRandom(this.config.seed);
    this.state = this.model.createInitialState(this.rng);
  }

  /**
   * Update configuration without full reset.
   * Some parameters can be changed live, others require reset.
   */
  updateConfig(config: Partial<DotsConfig>): void {
    // Check if numTypes changed for Particle Life (causes freeze with stale particle types)
    const numTypesChanged =
      config.behaviorParams?.type === 'particle-life' &&
      this.config.behaviorParams.type === 'particle-life' &&
      (config.behaviorParams as { numTypes?: number }).numTypes !== undefined &&
      (config.behaviorParams as { numTypes?: number }).numTypes !==
        (this.config.behaviorParams as { numTypes: number }).numTypes;

    const requiresReset =
      config.numParticles !== undefined ||
      config.behavior !== undefined ||
      numTypesChanged ||
      (config.behaviorParams?.type !== undefined &&
        config.behaviorParams.type !== this.config.behaviorParams.type);

    if (requiresReset) {
      this.resetWithConfig(config);
    } else {
      this.config = { ...this.config, ...config };
      this.model.updateConfig(config);
    }
  }

  /**
   * Update render options.
   */
  updateRenderOptions(options: Partial<RenderOptions>): void {
    this.renderOptions = { ...this.renderOptions, ...options };
  }

  /**
   * Set user interaction state.
   */
  setInteraction(interaction: Interaction | null): void {
    this.interaction = interaction;
  }

  /**
   * Get the underlying model (for advanced use).
   */
  getModel(): DotsModel {
    return this.model;
  }
}

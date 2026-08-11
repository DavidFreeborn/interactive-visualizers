/**
 * Abstract base class for particle behaviors.
 *
 * Each behavior implements:
 * 1. initialize() - set up particle-specific state
 * 2. computeForces() - return acceleration for each particle
 * 3. postStep() - any per-frame cleanup (rewiring, phase updates)
 * 4. computeMetrics() - behavior-specific metrics
 */

import type { SeededRandom } from '@viz/core-math';
import type { Particle, DotsConfig, BehaviorParams, DotsMetrics, Interaction } from '../types';
import type { SpatialHash } from '../spatial';

export abstract class Behavior<P extends BehaviorParams = BehaviorParams> {
  protected params: P;
  protected config: DotsConfig;

  constructor(params: P, config: DotsConfig) {
    this.params = params;
    this.config = config;
  }

  /**
   * Initialize behavior-specific particle state.
   * Called when simulation is reset.
   */
  abstract initialize(particles: Particle[], rng: SeededRandom): void;

  /**
   * Compute acceleration for each particle.
   * Returns array of { ax, ay } in the same order as particles.
   */
  abstract computeForces(
    particles: Particle[],
    spatialIndex: SpatialHash,
    interaction: Interaction | null,
    rng: SeededRandom
  ): Array<{ ax: number; ay: number }>;

  /**
   * Post-step updates (rewiring, phase evolution, etc.)
   * Called after positions and velocities are updated.
   */
  postStep(particles: Particle[], rng: SeededRandom): void {
    // Default: no-op
  }

  /**
   * Compute behavior-specific metrics.
   */
  abstract computeMetrics(particles: Particle[]): Partial<DotsMetrics>;

  /**
   * Update parameters (for live tweaking).
   */
  setParams(params: P): void {
    this.params = params;
  }
}

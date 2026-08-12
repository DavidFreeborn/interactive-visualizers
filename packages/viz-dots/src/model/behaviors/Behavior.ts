import type { SeededRandom } from '@viz/core-math';
import type {
  Particle,
  DotsConfig,
  BehaviorParams,
  DotsMetrics,
  Interaction,
} from '../types';
import type { SpatialHash } from '../spatial';

export type IntegrationMode = 'acceleration' | 'first-order';
export interface MotionVector { ax: number; ay: number }

/**
 * Common interface for all particle behaviours.
 *
 * acceleration: output is dv for this frame (Boids, Particle Life)
 * first-order: output is the direct dx/dy displacement for this frame
 *              (Friends & Enemies, Swarmalators)
 */
export abstract class Behavior<P extends BehaviorParams = BehaviorParams> {
  protected params: P;
  protected config: DotsConfig;

  readonly integrationMode: IntegrationMode = 'acceleration';

  constructor(params: P, config: DotsConfig) {
    this.params = params;
    this.config = config;
  }

  abstract initialize(particles: Particle[], rng: SeededRandom): void;

  abstract computeForces(
    particles: Particle[],
    spatialIndex: SpatialHash,
    interaction: Interaction | null,
    rng: SeededRandom
  ): MotionVector[];

  postStep(_particles: Particle[], _rng: SeededRandom): void {
    // default: no-op
  }

  abstract computeMetrics(particles: Particle[]): Partial<DotsMetrics>;

  setParams(params: P): void {
    this.params = params;
  }
}

/**
 * Core model for the Swarm Dynamics visualizer.
 *
 * Pure functions for:
 * - Creating initial particle state
 * - Stepping the simulation
 * - Computing metrics
 *
 * Uses velocity-Verlet integration for smooth, stable motion.
 */

import { SeededRandom } from '@viz/core-math';
import type {
  Particle,
  DotsConfig,
  DotsState,
  DotsMetrics,
  Interaction,
  RenderOptions,
} from './types';
import { SpatialHash } from './spatial';
import { createBehavior, Behavior, BehaviorParams } from './behaviors';

export class DotsModel {
  private config: DotsConfig;
  private behavior: Behavior<BehaviorParams>;
  private spatialHash: SpatialHash;

  constructor(config: DotsConfig) {
    this.config = config;
    this.behavior = createBehavior(config);

    // Cell size should be at least as large as the largest interaction radius
    const cellSize = this.estimateCellSize(config);
    const wraps = config.topology === 'torus' ||
                  config.topology === 'cylinder-x' ||
                  config.topology === 'cylinder-y' ||
                  config.topology === 'mobius-x' ||
                  config.topology === 'mobius-y';
    this.spatialHash = new SpatialHash(
      config.width,
      config.height,
      cellSize,
      wraps
    );
  }

  private estimateCellSize(config: DotsConfig): number {
    const params = config.behaviorParams;
    switch (params.type) {
      case 'boids':
        return Math.max(
          params.separationRadius,
          params.alignmentRadius,
          params.cohesionRadius
        );
      case 'particle-life':
        return params.interactionRadius;
      case 'friends-enemies':
        return Math.max(config.width, config.height) / 10;
      case 'swarmalators':
        return Math.max(config.width, config.height) / 5;
      default:
        return 50;
    }
  }

  /**
   * Create initial state with particles distributed across the world.
   */
  createInitialState(rng: SeededRandom): DotsState {
    const particles: Particle[] = [];

    for (let i = 0; i < this.config.numParticles; i++) {
      // Random position with some margin from edges
      const margin = 0.1;
      const x =
        this.config.width * (margin + rng.random() * (1 - 2 * margin));
      const y =
        this.config.height * (margin + rng.random() * (1 - 2 * margin));

      particles.push({
        id: i,
        x,
        y,
        vx: 0,
        vy: 0,
        type: 0,
      });
    }

    // Let behavior initialize particle-specific state
    this.behavior.initialize(particles, rng);

    return {
      frame: 0,
      particles,
      trails: particles.map(() => []),
    };
  }

  /**
   * Advance the simulation by one step.
   */
  step(
    state: DotsState,
    rng: SeededRandom,
    interaction: Interaction | null = null,
    renderOptions?: RenderOptions
  ): DotsState {
    const particles = state.particles;
    const trails = state.trails || particles.map(() => []);

    // Rebuild spatial hash
    this.spatialHash.rebuild(particles);

    // Compute forces from behavior
    const forces = this.behavior.computeForces(
      particles,
      this.spatialHash,
      interaction,
      rng
    );

    // Update velocities and positions (velocity-Verlet integration)
    const newParticles: Particle[] = [];
    const newTrails: Array<Array<{ x: number; y: number }>> = [];

    // Get max speed: from BoidsParams for boids, internal cap for others
    const isBoids = this.config.behaviorParams.type === 'boids';
    const maxSpeed = isBoids
      ? (this.config.behaviorParams as import('./types').BoidsParams).maxSpeed
      : 50; // Internal safety cap for non-boids behaviors

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const f = forces[i];

      // Update velocity
      let vx = p.vx + f.ax;
      let vy = p.vy + f.ay;

      // Clamp speed (max and min for boids)
      const speed = Math.sqrt(vx * vx + vy * vy);
      const minSpeed = isBoids ? maxSpeed * 0.5 : 0;

      if (speed > maxSpeed) {
        vx = (vx / speed) * maxSpeed;
        vy = (vy / speed) * maxSpeed;
      } else if (speed < minSpeed && speed > 0.01) {
        // Maintain minimum speed for boids
        vx = (vx / speed) * minSpeed;
        vy = (vy / speed) * minSpeed;
      }

      // Update position
      let x = p.x + vx;
      let y = p.y + vy;

      // Handle boundaries based on topology
      const topology = this.config.topology;
      const w = this.config.width;
      const h = this.config.height;

      if (topology === 'torus') {
        // Wrap both axes
        x = ((x % w) + w) % w;
        y = ((y % h) + h) % h;
      } else if (topology === 'cylinder-x') {
        // Wrap horizontally, bounce vertically
        x = ((x % w) + w) % w;
        if (y < 0) { y = -y; vy = Math.abs(vy); }
        if (y > h) { y = 2 * h - y; vy = -Math.abs(vy); }
        // Clamp to be safe
        y = Math.max(0, Math.min(h, y));
      } else if (topology === 'cylinder-y') {
        // Bounce horizontally, wrap vertically
        if (x < 0) { x = -x; vx = Math.abs(vx); }
        if (x > w) { x = 2 * w - x; vx = -Math.abs(vx); }
        x = Math.max(0, Math.min(w, x));
        y = ((y % h) + h) % h;
      } else if (topology === 'mobius-x') {
        // Möbius strip around Y axis: wrap X with Y flip
        while (x < 0) {
          x += w;
          y = h - y;
          vy = -vy;
        }
        while (x > w) {
          x -= w;
          y = h - y;
          vy = -vy;
        }
        // Bounce vertically (top/bottom are edges)
        if (y < 0) { y = -y; vy = Math.abs(vy); }
        if (y > h) { y = 2 * h - y; vy = -Math.abs(vy); }
        y = Math.max(0, Math.min(h, y));
      } else if (topology === 'mobius-y') {
        // Möbius strip around X axis: wrap Y with X flip
        while (y < 0) {
          y += h;
          x = w - x;
          vx = -vx;
        }
        while (y > h) {
          y -= h;
          x = w - x;
          vx = -vx;
        }
        // Bounce horizontally (left/right are edges)
        if (x < 0) { x = -x; vx = Math.abs(vx); }
        if (x > w) { x = 2 * w - x; vx = -Math.abs(vx); }
        x = Math.max(0, Math.min(w, x));
      } else if (topology === 'plane') {
        // Unbounded plane: no wrapping, no bouncing. The behavior's own dynamics
        // (contraction / global attraction) keep the swarm in view. Off-canvas
        // excursions are momentary and correct.
      } else {
        // 'bounded' - bounce off all walls with reflection
        if (x < 0) { x = -x; vx = Math.abs(vx); }
        if (x > w) { x = 2 * w - x; vx = -Math.abs(vx); }
        if (y < 0) { y = -y; vy = Math.abs(vy); }
        if (y > h) { y = 2 * h - y; vy = -Math.abs(vy); }
        // Clamp to be safe
        x = Math.max(0, Math.min(w, x));
        y = Math.max(0, Math.min(h, y));
      }

      // Create new particle (immutable update)
      const newParticle: Particle = {
        ...p,
        x,
        y,
        vx,
        vy,
      };
      newParticles.push(newParticle);

      // Update trails
      const trail = [...trails[i]];
      trail.push({ x: p.x, y: p.y });

      // Limit trail length
      const maxTrailLength = renderOptions?.showTrails
        ? renderOptions.trailLength
        : 1;
      while (trail.length > maxTrailLength) {
        trail.shift();
      }
      newTrails.push(trail);
    }

    // Post-step behavior updates (rewiring, phase updates, etc.)
    this.behavior.postStep(newParticles, rng);

    return {
      frame: state.frame + 1,
      particles: newParticles,
      trails: newTrails,
    };
  }

  /**
   * Compute metrics from current state.
   */
  computeMetrics(state: DotsState): DotsMetrics {
    const behaviorMetrics = this.behavior.computeMetrics(state.particles);

    return {
      frame: state.frame,
      avgSpeed: behaviorMetrics.avgSpeed ?? 0,
      ...behaviorMetrics,
    };
  }

  /**
   * Update configuration (for live parameter changes).
   */
  updateConfig(config: Partial<DotsConfig>): void {
    // Check if behavior type changed
    const newConfig = { ...this.config, ...config };

    if (config.behaviorParams && config.behaviorParams.type !== this.config.behaviorParams.type) {
      // Behavior type changed - need new behavior instance
      this.behavior = createBehavior(newConfig);
    } else if (config.behaviorParams) {
      // Same type - just update params
      this.behavior.setParams(config.behaviorParams);
    }

    this.config = newConfig;

    // Rebuild spatial hash if dimensions or topology changed
    if (config.width || config.height || config.topology !== undefined) {
      const cellSize = this.estimateCellSize(this.config);
      const wraps = this.config.topology === 'torus' ||
                    this.config.topology === 'cylinder-x' ||
                    this.config.topology === 'cylinder-y' ||
                    this.config.topology === 'mobius-x' ||
                    this.config.topology === 'mobius-y';
      this.spatialHash = new SpatialHash(
        this.config.width,
        this.config.height,
        cellSize,
        wraps
      );
    }
  }

  /**
   * Get the current behavior instance.
   */
  getBehavior(): Behavior<BehaviorParams> {
    return this.behavior;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): DotsConfig {
    return this.config;
  }
}

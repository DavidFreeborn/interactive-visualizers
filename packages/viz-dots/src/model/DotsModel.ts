import { SeededRandom } from '@viz/core-math';
import type {
  Particle,
  DotsConfig,
  DotsState,
  DotsMetrics,
  Interaction,
  RenderOptions,
  BoidsParams,
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
    this.spatialHash = this.createSpatialHash(config);
  }

  private createSpatialHash(config: DotsConfig): SpatialHash {
    return new SpatialHash(
      config.width,
      config.height,
      this.estimateCellSize(config),
      config.topology
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
      // These are global all-to-all models and do not use the spatial hash for physics.
      case 'friends-enemies':
      case 'swarmalators':
        return Math.max(config.width, config.height);
    }
  }

  createInitialState(rng: SeededRandom): DotsState {
    const particles: Particle[] = [];
    for (let i = 0; i < this.config.numParticles; i++) {
      const margin = 0.1;
      particles.push({
        id: i,
        x: this.config.width * (margin + rng.random() * (1 - 2 * margin)),
        y: this.config.height * (margin + rng.random() * (1 - 2 * margin)),
        vx: 0,
        vy: 0,
        type: 0,
      });
    }

    this.behavior.initialize(particles, rng);
    return { frame: 0, particles, trails: particles.map(() => []) };
  }

  step(
    state: DotsState,
    rng: SeededRandom,
    interaction: Interaction | null = null,
    renderOptions?: RenderOptions
  ): DotsState {
    const particles = state.particles;
    const trails = state.trails || particles.map(() => []);
    this.spatialHash.rebuild(particles);

    const motion = this.behavior.computeForces(
      particles,
      this.spatialHash,
      interaction,
      rng
    );

    const firstOrder = this.behavior.integrationMode === 'first-order';
    const boids = this.config.behaviorParams.type === 'boids'
      ? this.config.behaviorParams as BoidsParams
      : null;
    const maxTrailLength = renderOptions?.showTrails ? renderOptions.trailLength : 1;
    const scratch = this.boundaryScratch;

    // Particles and trail arrays are updated in place: all forces above were
    // computed from the pre-step state, so mutating here cannot leak the new
    // positions into this step's dynamics. A fresh state wrapper is still
    // returned each frame so reference-equality consumers see the change.
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const m = motion[i];

      // Record the pre-step position on the trail before moving.
      const trail = trails[i];
      if (maxTrailLength === 1 && trail.length === 1) {
        trail[0].x = p.x;
        trail[0].y = p.y;
      } else {
        trail.push({ x: p.x, y: p.y });
        if (trail.length > maxTrailLength) trail.splice(0, trail.length - maxTrailLength);
      }

      // First-order published maps/ODEs specify position velocity directly.
      // Acceleration models instead update persistent velocity.
      let vx = firstOrder ? m.ax : p.vx + m.ax;
      let vy = firstOrder ? m.ay : p.vy + m.ay;

      // Speed constraints are part of this Boids implementation only. Applying
      // a generic clamp to other models silently changes their equations.
      if (boids) {
        const speed = Math.hypot(vx, vy);
        const minSpeed = boids.maxSpeed * 0.5;
        if (speed > boids.maxSpeed) {
          vx = vx / speed * boids.maxSpeed;
          vy = vy / speed * boids.maxSpeed;
        } else if (speed < minSpeed && speed > 0.01) {
          vx = vx / speed * minSpeed;
          vy = vy / speed * minSpeed;
        }
      }

      scratch.x = p.x + vx;
      scratch.y = p.y + vy;
      scratch.vx = vx;
      scratch.vy = vy;
      this.applyBoundary(scratch);

      p.x = scratch.x;
      p.y = scratch.y;
      p.vx = scratch.vx;
      p.vy = scratch.vy;
    }

    this.behavior.postStep(particles, rng);
    return { frame: state.frame + 1, particles, trails };
  }

  // Reused per-particle by step() to avoid allocating a boundary result object.
  private boundaryScratch = { x: 0, y: 0, vx: 0, vy: 0 };

  private applyBoundary(s: { x: number; y: number; vx: number; vy: number }): void {
    const topology = this.config.topology;
    const w = this.config.width;
    const h = this.config.height;
    let { x, y, vx, vy } = s;

    if (topology === 'plane') return;

    if (topology === 'torus') {
      s.x = ((x % w) + w) % w;
      s.y = ((y % h) + h) % h;
      return;
    }

    if (topology === 'cylinder-x') {
      x = ((x % w) + w) % w;
      ({ value: y, velocity: vy } = reflect(y, vy, h));
    } else if (topology === 'cylinder-y') {
      ({ value: x, velocity: vx } = reflect(x, vx, w));
      y = ((y % h) + h) % h;
    } else if (topology === 'mobius-x') {
      while (x < 0 || x >= w) {
        if (x < 0) x += w;
        else x -= w;
        y = h - y;
        vy = -vy;
      }
      ({ value: y, velocity: vy } = reflect(y, vy, h));
    } else if (topology === 'mobius-y') {
      while (y < 0 || y >= h) {
        if (y < 0) y += h;
        else y -= h;
        x = w - x;
        vx = -vx;
      }
      ({ value: x, velocity: vx } = reflect(x, vx, w));
    } else {
      ({ value: x, velocity: vx } = reflect(x, vx, w));
      ({ value: y, velocity: vy } = reflect(y, vy, h));
    }

    s.x = x;
    s.y = y;
    s.vx = vx;
    s.vy = vy;
  }

  computeMetrics(state: DotsState): DotsMetrics {
    const metrics = this.behavior.computeMetrics(state.particles);
    return { frame: state.frame, avgSpeed: metrics.avgSpeed ?? 0, ...metrics };
  }

  updateConfig(config: Partial<DotsConfig>): void {
    const newConfig = { ...this.config, ...config };

    if (config.behaviorParams && config.behaviorParams.type !== this.config.behaviorParams.type) {
      this.behavior = createBehavior(newConfig);
    } else if (config.behaviorParams) {
      this.behavior.setParams(config.behaviorParams);
    }

    this.config = newConfig;

    // Cell size can change with live radius edits, so rebuild for any physics config edit.
    if (config.width !== undefined || config.height !== undefined ||
        config.topology !== undefined || config.behaviorParams !== undefined) {
      this.spatialHash = this.createSpatialHash(this.config);
    }
  }

  getBehavior(): Behavior<BehaviorParams> { return this.behavior; }
  getConfig(): DotsConfig { return this.config; }
}

function reflect(value: number, velocity: number, limit: number) {
  while (value < 0 || value > limit) {
    if (value < 0) {
      value = -value;
      velocity = Math.abs(velocity);
    } else {
      value = 2 * limit - value;
      velocity = -Math.abs(velocity);
    }
  }
  return { value, velocity };
}

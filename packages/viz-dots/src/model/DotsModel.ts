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

    const newParticles: Particle[] = [];
    const newTrails: Array<Array<{ x: number; y: number }>> = [];
    const firstOrder = this.behavior.integrationMode === 'first-order';
    const boids = this.config.behaviorParams.type === 'boids'
      ? this.config.behaviorParams as BoidsParams
      : null;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const m = motion[i];

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

      let x = p.x + vx;
      let y = p.y + vy;
      ({ x, y, vx, vy } = this.applyBoundary(x, y, vx, vy));

      newParticles.push({ ...p, x, y, vx, vy });

      const trail = [...trails[i], { x: p.x, y: p.y }];
      const maxTrailLength = renderOptions?.showTrails ? renderOptions.trailLength : 1;
      if (trail.length > maxTrailLength) trail.splice(0, trail.length - maxTrailLength);
      newTrails.push(trail);
    }

    this.behavior.postStep(newParticles, rng);
    return { frame: state.frame + 1, particles: newParticles, trails: newTrails };
  }

  private applyBoundary(x: number, y: number, vx: number, vy: number) {
    const topology = this.config.topology;
    const w = this.config.width;
    const h = this.config.height;

    if (topology === 'plane') return { x, y, vx, vy };

    if (topology === 'torus') {
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
      return { x, y, vx, vy };
    }

    if (topology === 'cylinder-x') {
      x = ((x % w) + w) % w;
      ({ value: y, velocity: vy } = reflect(y, vy, h));
      return { x, y, vx, vy };
    }

    if (topology === 'cylinder-y') {
      ({ value: x, velocity: vx } = reflect(x, vx, w));
      y = ((y % h) + h) % h;
      return { x, y, vx, vy };
    }

    if (topology === 'mobius-x') {
      while (x < 0 || x >= w) {
        if (x < 0) x += w;
        else x -= w;
        y = h - y;
        vy = -vy;
      }
      ({ value: y, velocity: vy } = reflect(y, vy, h));
      return { x, y, vx, vy };
    }

    if (topology === 'mobius-y') {
      while (y < 0 || y >= h) {
        if (y < 0) y += h;
        else y -= h;
        x = w - x;
        vx = -vx;
      }
      ({ value: x, velocity: vx } = reflect(x, vx, w));
      return { x, y, vx, vy };
    }

    ({ value: x, velocity: vx } = reflect(x, vx, w));
    ({ value: y, velocity: vy } = reflect(y, vy, h));
    return { x, y, vx, vy };
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

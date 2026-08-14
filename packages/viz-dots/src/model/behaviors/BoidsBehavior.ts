/**
 * Boids Behavior - Craig Reynolds (1987 SIGGRAPH)
 *
 * "Flocks, Herds, and Schools: A Distributed Behavioral Model"
 *
 * ALGORITHM: For each boid, compute steering forces from neighbors:
 *
 * 1. SEPARATION: Steer away from nearby boids
 *    Uses linear falloff (not inverse square) for more consistent avoidance
 *
 * 2. ALIGNMENT: Steer toward average heading of neighbors
 *    Creates coordinated movement direction
 *
 * 3. COHESION: Steer toward center of mass of neighbors
 *    Keeps the flock together but with distance-based strength
 *
 * Key insight: The balance between these forces determines flock behavior.
 * Too much cohesion = single dense cluster
 * Too much separation = dispersed cloud
 * Good balance = dynamic, splitting/merging flocks
 */

import type { SeededRandom } from '@viz/core-math';
import type { Particle, DotsConfig, BoidsParams, DotsMetrics, Interaction } from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

export class BoidsBehavior extends Behavior<BoidsParams> {
  constructor(params: BoidsParams, config: DotsConfig) {
    super(params, config);
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    // Scatter particles and give random velocities
    for (const p of particles) {
      const angle = rng.random() * Math.PI * 2;
      const speed = this.params.maxSpeed * (0.5 + rng.random() * 0.5);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.type = 0;
    }
  }

  computeForces(
    particles: Particle[],
    spatialIndex: SpatialHash,
    interaction: Interaction | null,
    rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const forces: Array<{ ax: number; ay: number }> = [];
    // Query radius must be the max of all three to ensure all relevant neighbors are found
    const maxRadius = Math.max(
      this.params.separationRadius,
      this.params.alignmentRadius,
      this.params.cohesionRadius
    );

    for (const p of particles) {
      const neighbors = spatialIndex.queryRadius(p.x, p.y, maxRadius);

      // Separation: steer away from close neighbors
      let sepX = 0;
      let sepY = 0;
      let sepCount = 0;

      // Alignment: steer toward average heading
      let alignX = 0;
      let alignY = 0;
      let alignCount = 0;

      // Cohesion: steer toward center of mass
      let cohX = 0;
      let cohY = 0;
      let cohCount = 0;

      // Current heading for field of view check
      const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const headingX = currentSpeed > 0.1 ? p.vx / currentSpeed : 1;
      const headingY = currentSpeed > 0.1 ? p.vy / currentSpeed : 0;

      // queryRadius already computed the shortest quotient offset to each
      // neighbor; the parallel arrays avoid recomputing wrapped distances.
      const nDx = spatialIndex.neighborDx;
      const nDy = spatialIndex.neighborDy;
      const nDist = spatialIndex.neighborDist;

      for (let k = 0; k < neighbors.length; k++) {
        const n = neighbors[k];
        if (n.id === p.id) continue;

        const dist = nDist[k];
        if (dist < 0.1) continue;

        // Field of view check (~270 degrees, exclude directly behind)
        const dirX = nDx[k] / dist;
        const dirY = nDy[k] / dist;
        const dot = headingX * dirX + headingY * dirY;
        if (dot < -0.5) continue; // Behind us

        // SEPARATION: Linear falloff for more consistent avoidance
        if (dist < this.params.separationRadius) {
          // Strength increases as distance decreases (linear, not inverse square)
          const strength = 1 - (dist / this.params.separationRadius);
          sepX -= dirX * strength;
          sepY -= dirY * strength;
          sepCount++;
        }

        // ALIGNMENT: accumulate neighbor velocities
        if (dist < this.params.alignmentRadius) {
          alignX += n.vx;
          alignY += n.vy;
          alignCount++;
        }

        // COHESION: accumulate neighbor positions
        if (dist < this.params.cohesionRadius) {
          cohX += nDx[k];
          cohY += nDy[k];
          cohCount++;
        }
      }

      let ax = 0;
      let ay = 0;

      // Apply SEPARATION - normalize and scale
      if (sepCount > 0) {
        // Average the separation vectors
        sepX /= sepCount;
        sepY /= sepCount;
        ax += sepX * this.params.separationWeight * 2;
        ay += sepY * this.params.separationWeight * 2;
      }

      // Apply ALIGNMENT - steer toward average velocity
      if (alignCount > 0) {
        const avgVx = alignX / alignCount;
        const avgVy = alignY / alignCount;
        // Steering = desired - current, scaled down
        ax += (avgVx - p.vx) * this.params.alignmentWeight * 0.05;
        ay += (avgVy - p.vy) * this.params.alignmentWeight * 0.05;
      }

      // Apply COHESION - steer toward center, scaled by distance
      if (cohCount > 0) {
        const centerX = cohX / cohCount;
        const centerY = cohY / cohCount;
        const centerDist = Math.sqrt(centerX * centerX + centerY * centerY);
        if (centerDist > 1) {
          // Scale cohesion by distance - further = stronger pull
          // This prevents over-clustering while maintaining group cohesion
          const cohesionStrength = Math.min(1, centerDist / this.params.cohesionRadius);
          ax += (centerX / centerDist) * this.params.cohesionWeight * cohesionStrength * 0.5;
          ay += (centerY / centerDist) * this.params.cohesionWeight * cohesionStrength * 0.5;
        }
      }

      // Add RANDOMNESS for natural movement (more than before)
      ax += (rng.random() - 0.5) * 0.3;
      ay += (rng.random() - 0.5) * 0.3;

      // Light DRAG to prevent runaway speeds
      ax -= p.vx * 0.01;
      ay -= p.vy * 0.01;

      // EDGE behavior for bounded topologies
      const topology = this.config.topology;
      if (topology === 'bounded' || topology === 'cylinder-x' ||
          topology === 'cylinder-y') {
        const margin = Math.min(this.config.width, this.config.height) * 0.1;
        const turnStrength = this.params.turnFactor;

        if (topology !== 'cylinder-x') {
          if (p.x < margin) {
            const urgency = (margin - p.x) / margin;
            ax += turnStrength * urgency * urgency;
          }
          if (p.x > this.config.width - margin) {
            const urgency = (p.x - (this.config.width - margin)) / margin;
            ax -= turnStrength * urgency * urgency;
          }
        }
        if (topology !== 'cylinder-y') {
          if (p.y < margin) {
            const urgency = (margin - p.y) / margin;
            ay += turnStrength * urgency * urgency;
          }
          if (p.y > this.config.height - margin) {
            const urgency = (p.y - (this.config.height - margin)) / margin;
            ay -= turnStrength * urgency * urgency;
          }
        }
      }

      // User INTERACTION
      if (interaction?.active) {
        const info = spatialIndex.wrappedDistance(p.x, p.y, interaction.x, interaction.y);
        if (info.dist > 0 && info.dist < 150) {
          const strength = interaction.strength * (1 - info.dist / 150) * 3;
          const dirX = info.dx / info.dist;
          const dirY = info.dy / info.dist;
          if (interaction.type === 'attract') {
            ax += dirX * strength;
            ay += dirY * strength;
          } else if (interaction.type === 'repel') {
            ax -= dirX * strength;
            ay -= dirY * strength;
          }
        }
      }

      forces.push({ ax, ay });
    }

    return forces;
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) {
      return { avgSpeed: 0, orderParameter: 0 };
    }

    let vxSum = 0;
    let vySum = 0;
    let speedSum = 0;

    for (const p of particles) {
      vxSum += p.vx;
      vySum += p.vy;
      speedSum += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    }

    const n = particles.length;
    const avgVx = vxSum / n;
    const avgVy = vySum / n;
    const avgSpeed = speedSum / n;

    const orderParameter = avgSpeed > 0
      ? Math.sqrt(avgVx * avgVx + avgVy * avgVy) / avgSpeed
      : 0;

    return {
      avgSpeed,
      orderParameter: Math.min(1, orderParameter),
    };
  }
}

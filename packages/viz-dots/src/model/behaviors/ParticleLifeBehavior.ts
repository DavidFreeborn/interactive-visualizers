/**
 * Particle Life Behavior
 *
 * Multiple particle types with an attraction/repulsion matrix.
 * Type A might be attracted to type B but repelled by type C.
 * Creates surprisingly lifelike emergent "creatures" - self-organizing
 * structures that move, spin, and interact.
 *
 * Inspired by:
 * - Jeffrey Ventrella's "Clusters" (1995)
 * - Tom Mohr's "Particle Life" web implementation
 * - Numerous YouTube demonstrations showing emergent behaviors
 *
 * The simplicity of the rule (attraction matrix + friction) belies
 * the complexity of the emergent structures.
 */

import type { SeededRandom } from '@viz/core-math';
import type { Particle, DotsConfig, ParticleLifeParams, DotsMetrics, Interaction } from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

export class ParticleLifeBehavior extends Behavior<ParticleLifeParams> {
  constructor(params: ParticleLifeParams, config: DotsConfig) {
    super(params, config);
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    // Assign random types and velocities
    for (const p of particles) {
      p.type = rng.randInt(0, this.params.numTypes - 1);
      const angle = rng.random() * Math.PI * 2;
      const speed = 0.5 * rng.random(); // Small initial speed
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    }
  }

  computeForces(
    particles: Particle[],
    spatialIndex: SpatialHash,
    interaction: Interaction | null,
    _rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const forces: Array<{ ax: number; ay: number }> = [];
    const radius = this.params.interactionRadius;

    for (const p of particles) {
      const neighbors = spatialIndex.queryRadius(p.x, p.y, radius);

      let ax = 0;
      let ay = 0;

      for (const n of neighbors) {
        if (n.id === p.id) continue;

        const info = spatialIndex.wrappedDistance(p.x, p.y, n.x, n.y);
        const dist = info.dist;

        if (dist > 0 && dist < radius) {
          // Get attraction value from matrix with defensive bounds checking
          // (protects against stale particle types if numTypes was reduced)
          const row = this.params.attractionMatrix[p.type % this.params.numTypes];
          const attraction = row ? (row[n.type % this.params.numTypes] ?? 0) : 0;

          // Force magnitude: attraction * distance function
          // Close particles repel (to prevent collapse), far particles follow matrix
          const minDist = radius * 0.2;
          let force: number;

          if (dist < minDist) {
            // Repulsion zone: always push away when too close
            force = (dist / minDist - 1) * 2;
          } else {
            // Attraction zone: follows the matrix
            const normalizedDist = (dist - minDist) / (radius - minDist);
            force = attraction * (1 - normalizedDist);
          }

          // Apply force in direction of neighbor
          ax += (info.dx / dist) * force * 0.5;
          ay += (info.dy / dist) * force * 0.5;
        }
      }

      // Apply friction (velocity decay)
      ax -= p.vx * this.params.friction;
      ay -= p.vy * this.params.friction;

      // User interaction
      if (interaction?.active) {
        const info = spatialIndex.wrappedDistance(p.x, p.y, interaction.x, interaction.y);
        if (info.dist > 0 && info.dist < 150) {
          const strength = interaction.strength * (1 - info.dist / 150) * 2;
          if (interaction.type === 'attract') {
            ax += (info.dx / info.dist) * strength;
            ay += (info.dy / info.dist) * strength;
          } else if (interaction.type === 'repel') {
            ax -= (info.dx / info.dist) * strength;
            ay -= (info.dy / info.dist) * strength;
          }
        }
      }

      forces.push({ ax, ay });
    }

    return forces;
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) {
      return { avgSpeed: 0, clusterCount: 0 };
    }

    // Compute average speed
    let speedSum = 0;
    for (const p of particles) {
      speedSum += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    }

    // Simple cluster estimation: count distinct spatial regions
    // (This is a rough heuristic, not a precise algorithm)
    const clusterCount = this.estimateClusters(particles);

    return {
      avgSpeed: speedSum / particles.length,
      clusterCount,
    };
  }

  private estimateClusters(particles: Particle[]): number {
    // Very rough heuristic: divide space into grid and count occupied cells
    const gridSize = Math.max(this.config.width, this.config.height) / 10;
    const occupied = new Set<string>();

    for (const p of particles) {
      const gx = Math.floor(p.x / gridSize);
      const gy = Math.floor(p.y / gridSize);
      occupied.add(`${gx},${gy}`);
    }

    // Rough estimate: number of connected regions
    // For simplicity, just return fraction of grid that's sparse
    const totalCells = Math.ceil(this.config.width / gridSize) *
                       Math.ceil(this.config.height / gridSize);
    const density = occupied.size / totalCells;

    // Lower density suggests more distinct clusters
    return Math.max(1, Math.round(occupied.size * (1 - density) / 3));
  }
}

/**
 * Generate a random attraction matrix with interesting dynamics.
 */
export function generateAttractionMatrix(
  numTypes: number,
  rng: SeededRandom,
  options: {
    symmetry?: boolean;
    bias?: number; // positive = more attraction, negative = more repulsion
  } = {}
): number[][] {
  const { symmetry = false, bias = 0 } = options;
  const matrix: number[][] = [];

  for (let i = 0; i < numTypes; i++) {
    matrix[i] = [];
    for (let j = 0; j < numTypes; j++) {
      if (i === j) {
        // Self-interaction: usually slight repulsion or neutral
        matrix[i][j] = (rng.random() * 0.4 - 0.2) + bias * 0.3;
      } else if (symmetry && j < i) {
        // Copy from symmetric position
        matrix[i][j] = matrix[j][i];
      } else {
        // Random interaction in [-1, 1]
        matrix[i][j] = (rng.random() * 2 - 1) + bias * 0.3;
        matrix[i][j] = Math.max(-1, Math.min(1, matrix[i][j]));
      }
    }
  }

  return matrix;
}

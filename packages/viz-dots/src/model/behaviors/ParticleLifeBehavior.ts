/**
 * Particle Life using Tom Mohr's canonical dimensionless force profile.
 *
 * For normalized distance r in [0,1] and rMin=0.3:
 *   r < rMin: f = r/rMin - 1
 *   otherwise: f = a * (1 - |1+rMin-2r|/(1-rMin))
 *
 * The first region is universal short-range repulsion. The second is a
 * triangular attraction/repulsion band controlled by the directed type matrix.
 */
import type { SeededRandom } from '@viz/core-math';
import type {
  Particle,
  DotsConfig,
  ParticleLifeParams,
  DotsMetrics,
  Interaction,
} from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

const R_MIN = 0.3;
const FORCE_SCALE = 0.5;

export function particleLifeForce(attraction: number, normalizedDistance: number): number {
  if (normalizedDistance <= 0 || normalizedDistance >= 1) return 0;
  if (normalizedDistance < R_MIN) {
    return normalizedDistance / R_MIN - 1;
  }
  return attraction * (
    1 - Math.abs(1 + R_MIN - 2 * normalizedDistance) / (1 - R_MIN)
  );
}

export class ParticleLifeBehavior extends Behavior<ParticleLifeParams> {
  constructor(params: ParticleLifeParams, config: DotsConfig) {
    super(params, config);
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    for (const p of particles) {
      p.type = rng.randInt(0, this.params.numTypes - 1);
      const angle = rng.random() * Math.PI * 2;
      const speed = 0.5 * rng.random();
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    }
  }

  private attraction(fromType: number, toType: number): number {
    const value = this.params.attractionMatrix[fromType]?.[toType];
    return Number.isFinite(value) ? value : 0;
  }

  computeForces(
    particles: Particle[],
    spatialIndex: SpatialHash,
    interaction: Interaction | null,
    _rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const radius = this.params.interactionRadius;
    const forces = particles.map(() => ({ ax: 0, ay: 0 }));

    // Dense sanitized copy of the attraction matrix, so the inner pair loop
    // does a plain array lookup instead of optional chaining + isFinite.
    const numTypes = this.params.numTypes;
    const matrix: number[][] = [];
    for (let i = 0; i < numTypes; i++) {
      const row: number[] = [];
      for (let j = 0; j < numTypes; j++) row.push(this.attraction(i, j));
      matrix.push(row);
    }

    // Evaluate each geometric pair once. The interaction matrix is directed,
    // so the two force magnitudes can differ even though the geometry is shared.
    for (const p of particles) {
      const neighbors = spatialIndex.queryRadius(p.x, p.y, radius);
      // Shortest quotient offsets already computed by queryRadius.
      const nDx = spatialIndex.neighborDx;
      const nDy = spatialIndex.neighborDy;
      const nDist = spatialIndex.neighborDist;
      for (let k = 0; k < neighbors.length; k++) {
        const q = neighbors[k];
        if (q.id <= p.id) continue;
        const dist = nDist[k];
        if (dist <= 0 || dist >= radius) continue;

        const r = dist / radius;
        const ux = nDx[k] / dist;
        const uy = nDy[k] / dist;
        const fp = FORCE_SCALE * particleLifeForce(matrix[p.type][q.type], r);
        const fq = FORCE_SCALE * particleLifeForce(matrix[q.type][p.type], r);

        forces[p.id].ax += ux * fp;
        forces[p.id].ay += uy * fp;
        forces[q.id].ax -= ux * fq;
        forces[q.id].ay -= uy * fq;
      }
    }

    for (const p of particles) {
      const f = forces[p.id];
      f.ax -= p.vx * this.params.friction;
      f.ay -= p.vy * this.params.friction;

      if (interaction?.active) {
        const info = spatialIndex.wrappedDistance(p.x, p.y, interaction.x, interaction.y);
        if (info.dist > 0 && info.dist < 150) {
          const strength = interaction.strength * (1 - info.dist / 150) * 2;
          const sign = interaction.type === 'attract' ? 1 : -1;
          f.ax += sign * info.dx / info.dist * strength;
          f.ay += sign * info.dy / info.dist * strength;
        }
      }
    }

    return forces;
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) return { avgSpeed: 0 };
    let speed = 0;
    for (const p of particles) speed += Math.hypot(p.vx, p.vy);
    return { avgSpeed: speed / particles.length };
  }
}

export function generateAttractionMatrix(
  numTypes: number,
  rng: SeededRandom,
  options: { symmetry?: boolean; bias?: number } = {}
): number[][] {
  const { symmetry = false, bias = 0 } = options;
  const matrix: number[][] = Array.from({ length: numTypes }, () => Array(numTypes).fill(0));

  for (let i = 0; i < numTypes; i++) {
    for (let j = 0; j < numTypes; j++) {
      if (symmetry && j < i) {
        matrix[i][j] = matrix[j][i];
        continue;
      }
      const raw = rng.random() * 2 - 1 + bias * 0.3;
      matrix[i][j] = Math.max(-1, Math.min(1, raw));
    }
  }
  return matrix;
}

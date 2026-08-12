/**
 * Swarmalators.
 *
 * model='classic-2017' implements O'Keeffe, Hong & Strogatz (2017).
 * model='diverse-2023' implements Ceron, O'Keeffe & Petersen (2023),
 * including F1-F4 natural frequencies, optional chirality, frequency-coupling
 * phase offsets, and finite-range coupling sigma.
 */
import type { SeededRandom } from '@viz/core-math';
import type {
  Particle,
  DotsConfig,
  SwarmalatorsParams,
  DotsMetrics,
  Interaction,
  NaturalFrequencyMode,
} from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

const DT = 0.1;
const R_MIN_UNITS = 0.02;

export class SwarmalatorsBehavior extends Behavior<SwarmalatorsParams> {
  readonly integrationMode = 'first-order' as const;
  private phaseDelta: number[] = [];

  constructor(params: SwarmalatorsParams, config: DotsConfig) {
    super(params, config);
  }

  private unit(): number {
    return Math.min(this.config.width, this.config.height) / 4;
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    const U = this.unit();
    const cx = this.config.width / 2;
    const cy = this.config.height / 2;
    const model = this.params.model ?? 'classic-2017';
    const box = this.params.initialBoxSize ?? (model === 'diverse-2023' ? 4 : 2);
    const halfBox = box / 2;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (this.params.initMode === 'rainbow_ring') {
        const angle = i / particles.length * Math.PI * 2;
        const r = U * (1.05 + 0.1 * (rng.random() - 0.5));
        p.x = cx + Math.cos(angle) * r;
        p.y = cy + Math.sin(angle) * r;
        p.phase = wrapPhase(angle - Math.PI);
      } else {
        p.x = cx + (2 * rng.random() - 1) * halfBox * U;
        p.y = cy + (2 * rng.random() - 1) * halfBox * U;
        p.phase = (2 * rng.random() - 1) * Math.PI;
      }

      p.vx = 0;
      p.vy = 0;
      p.type = 0;
      p.omega = model === 'diverse-2023'
        ? this.sample2023Omega(i, particles.length, rng)
        : (2 * rng.random() - 1) * this.params.omegaVariance;
    }
  }

  private sample2023Omega(index: number, n: number, rng: SeededRandom): number {
    const mode: NaturalFrequencyMode = this.params.frequencyMode ?? 'F2';
    const omegaMax = Math.max(1, this.params.omegaMax ?? 3);
    switch (mode) {
      case 'F1':
        return 1;
      case 'F2':
        return index < Math.floor(n / 2) ? 1 : -1;
      case 'F3':
        return 1 + rng.random() * (omegaMax - 1);
      case 'F4': {
        const mag = 1 + rng.random() * (omegaMax - 1);
        return index < Math.floor(n / 2) ? mag : -mag;
      }
    }
  }

  computeForces(
    particles: Particle[],
    _spatialIndex: SpatialHash,
    interaction: Interaction | null,
    _rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const n = particles.length;
    const U = this.unit();
    const model = this.params.model ?? 'classic-2017';
    const J = this.params.J;
    const K = this.params.K;
    const sigma = model === 'diverse-2023' ? this.params.couplingRadius : null;

    const xdot = particles.map(() => ({ x: 0, y: 0 }));
    const thetaDot = particles.map((p) => p.omega ?? 0);

    // Share pair geometry while retaining the direction-dependent 2023
    // frequency-offset terms. Every derivative is evaluated from the same state.
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      for (let j = i + 1; j < n; j++) {
        const q = particles[j];
        const dxPx = q.x - p.x;
        const dyPx = q.y - p.y;
        const rawPx = Math.hypot(dxPx, dyPx);
        const r = Math.max(rawPx / U, R_MIN_UNITS);
        if (sigma != null && sigma > 0 && r >= sigma) continue;

        let ux: number;
        let uy: number;
        if (rawPx < 1e-9) {
          const angle = deterministicPairAngle(i, j);
          ux = Math.cos(angle);
          uy = Math.sin(angle);
        } else {
          ux = dxPx / rawPx;
          uy = dyPx / rawPx;
        }

        const dtheta = q.phase! - p.phase!;
        let qx = 0;
        let qtheta = 0;
        if (model === 'diverse-2023' && this.params.frequencyCoupling) {
          const signDifference = Math.abs(Math.sign(q.omega ?? 0) - Math.sign(p.omega ?? 0));
          qx = Math.PI / 2 * signDifference;
          qtheta = Math.PI / 4 * signDifference;
        }

        const pairI = 1 + J * Math.cos(dtheta - qx) - 1 / r;
        const pairJ = 1 + J * Math.cos(-dtheta - qx) - 1 / r;
        xdot[i].x += ux * pairI / n;
        xdot[i].y += uy * pairI / n;
        xdot[j].x -= ux * pairJ / n;
        xdot[j].y -= uy * pairJ / n;

        thetaDot[i] += K / n * Math.sin(dtheta - qtheta) / r;
        thetaDot[j] += K / n * Math.sin(-dtheta - qtheta) / r;
      }
    }

    if (model === 'diverse-2023' && this.params.chiral) {
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        // Ceron et al. choose c_i in {-1, +1} (or 0 for non-chiral cases).
        // This is equivalent to R_i = 1/|omega_i| in c_i = omega_i R_i.
        const c = Math.sign(p.omega ?? 0);
        const heading = p.phase! + Math.PI / 2;
        xdot[i].x += c * Math.cos(heading);
        xdot[i].y += c * Math.sin(heading);
      }
    }

    this.phaseDelta = thetaDot.map((rate) => DT * rate);

    return particles.map((p, i) => {
      let dx = DT * U * xdot[i].x;
      let dy = DT * U * xdot[i].y;

      if (interaction?.active) {
        const ix = interaction.x - p.x;
        const iy = interaction.y - p.y;
        const d = Math.hypot(ix, iy);
        if (d > 1 && d < 150) {
          const s = interaction.strength * (1 - d / 150) * 4;
          const sign = interaction.type === 'attract' ? 1 : -1;
          dx += sign * ix / d * s;
          dy += sign * iy / d * s;
        }
      }

      return { ax: dx, ay: dy };
    });
  }

  postStep(particles: Particle[], _rng: SeededRandom): void {
    for (let i = 0; i < particles.length; i++) {
      particles[i].phase = wrapPhase(particles[i].phase! + (this.phaseDelta[i] ?? 0));
    }
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) {
      return { avgSpeed: 0, phaseSynchronization: 0, spacePhaseOrder: 0 };
    }

    let speed = 0;
    let zRe = 0;
    let zIm = 0;
    let cx = 0;
    let cy = 0;
    for (const p of particles) {
      speed += Math.hypot(p.vx, p.vy);
      zRe += Math.cos(p.phase!);
      zIm += Math.sin(p.phase!);
      cx += p.x;
      cy += p.y;
    }
    cx /= particles.length;
    cy /= particles.length;

    let plusRe = 0, plusIm = 0, minusRe = 0, minusIm = 0;
    for (const p of particles) {
      const phi = Math.atan2(p.y - cy, p.x - cx);
      const plus = phi + p.phase!;
      const minus = phi - p.phase!;
      plusRe += Math.cos(plus);
      plusIm += Math.sin(plus);
      minusRe += Math.cos(minus);
      minusIm += Math.sin(minus);
    }

    const n = particles.length;
    const z = Math.hypot(zRe, zIm) / n;
    const sPlus = Math.hypot(plusRe, plusIm) / n;
    const sMinus = Math.hypot(minusRe, minusIm) / n;

    return {
      avgSpeed: speed / n,
      phaseSynchronization: z,
      spacePhaseOrder: Math.max(sPlus, sMinus),
    };
  }
}

function wrapPhase(value: number): number {
  let phase = value;
  while (phase > Math.PI) phase -= 2 * Math.PI;
  while (phase < -Math.PI) phase += 2 * Math.PI;
  return phase;
}

function deterministicPairAngle(i: number, j: number): number {
  const hash = ((i + 1) * 2654435761 + (j + 1) * 2246822519) >>> 0;
  return hash / 0xffffffff * Math.PI * 2;
}

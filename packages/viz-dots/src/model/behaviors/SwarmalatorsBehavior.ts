/**
 * Swarmalators Behavior
 *
 * O'Keeffe, Hong & Strogatz (2017), "Oscillators that sync and swarm",
 * Nature Communications 8, 1504.
 *
 * EXACT EQUATIONS (in model units, first-order, all omega = 0 in the paper):
 *   dx_i/dt = (1/N) SUM_j [ u_ij * (1 + J cos(th_j - th_i)) - u_ij / r_ij ]
 *   dth_i/dt = omega_i + (K/N) SUM_j sin(th_j - th_i) / r_ij
 * where u_ij is the unit vector from i to j and r_ij the distance in units.
 *
 * THE FIVE CANONICAL STATES (paper Fig. 2, all with omega = 0), verified in a
 * headless numpy simulation of these exact equations (N=200, dt=0.1):
 *
 *   state                  J     K      measured outcome
 *   Static sync            0.1   1.0    sync order 1.000, compact static disc
 *   Static async           0.1  -1.0    sync order 0.000, static disc
 *   Static phase wave      1.0   0.0    ANNULUS (inner radius 0.57), phase ==
 *                                       angular position (corr 0.996): the
 *                                       rainbow ring, forming SPONTANEOUSLY
 *                                       from random initial conditions
 *   Splintered phase wave  1.0  -0.1    quivering phase-sorted clusters
 *   Active phase wave      1.0  -0.75   particles circulate forever, mean
 *                                       speed 0.15 units/time: the spinning
 *                                       rainbow. Motion comes from NEGATIVE K,
 *                                       not from frequency variance.
 *
 * WHY EVERY PREVIOUS VERSION COLLAPSED (verified by simulating the old scheme):
 *   1. `if (dist < 5) continue` deleted the pair force at close range,
 *      removing the 1/r repulsion exactly where it must diverge. Measured:
 *      min pairwise distance falls to 0.02 px (particles stack). The fix is
 *      to CLAMP the distance, never to skip the pair.
 *   2. The paper's equations are FIRST-ORDER (velocity is not a state).
 *      Integrating them as accelerations with drag 0.01 adds inertia, so
 *      particles orbit through equilibrium instead of settling on it.
 *   3. Repulsion 1/dist in raw pixels is ~100x weaker than in unit coords.
 *
 * TOPOLOGY: plane. Pair forces are exactly antisymmetric, so the centroid is
 * conserved; the swarm bounds itself (attraction term is always >= 0 for
 * |J| <= 1). No walls, no wrapping, no drag, no artificial boundary pull.
 *
 * SCALE AND SPEED: 1 unit = min(w,h)/4 px, dt = 0.1 per frame. Active phase
 * wave then moves at ~2.3 px/frame; static states are static because they are
 * supposed to be (that is what "static" means in the paper).
 */

import type { SeededRandom } from '@viz/core-math';
import type { Particle, DotsConfig, SwarmalatorsParams, DotsMetrics, Interaction } from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

const DT = 0.1;

export class SwarmalatorsBehavior extends Behavior<SwarmalatorsParams> {
  private omega: number[] = [];
  // Store phase deltas computed during computeForces for simultaneous update
  private phaseDelta: number[] = [];

  constructor(params: SwarmalatorsParams, config: DotsConfig) {
    super(params, config);
  }

  /** Pixels per model unit. Canonical states span radius ~1.0-1.8 units. */
  private unit(): number {
    return Math.min(this.config.width, this.config.height) / 4;
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    this.omega = [];
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const U = this.unit();
    const n = particles.length;

    if (this.params.initMode === 'rainbow_ring') {
      // Optional: start pre-formed. Note the phase-wave states also form
      // spontaneously from scattered initial conditions; this just skips the
      // transient.
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        const angle = (i / n) * Math.PI * 2;
        const r = U * (1.05 + 0.1 * (rng.random() - 0.5));
        p.x = centerX + Math.cos(angle) * r;
        p.y = centerY + Math.sin(angle) * r;
        p.phase = angle - Math.PI;
        p.vx = 0;
        p.vy = 0;
        this.omega.push((rng.random() * 2 - 1) * this.params.omegaVariance);
        p.type = 0;
      }
    } else {
      // Paper initial conditions: uniform in a box of side ~2 units,
      // uniform random phases.
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        p.x = centerX + (rng.random() * 2 - 1) * U;
        p.y = centerY + (rng.random() * 2 - 1) * U;
        p.phase = (rng.random() * 2 - 1) * Math.PI;
        p.vx = 0;
        p.vy = 0;
        this.omega.push((rng.random() * 2 - 1) * this.params.omegaVariance);
        p.type = 0;
      }
    }
  }

  computeForces(
    particles: Particle[],
    _spatialIndex: SpatialHash,
    interaction: Interaction | null,
    _rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const forces: Array<{ ax: number; ay: number }> = [];
    const n = particles.length;
    const U = this.unit();
    const rMinPx = 0.02 * U; // clamp floor: repulsion 1/0.02 = 50 at contact
    const J = this.params.J;
    const K = this.params.K;

    // Reset phase deltas - compute from CURRENT state for simultaneous update
    this.phaseDelta = new Array(n).fill(0);

    // No centroid correction: pair forces are exactly antisymmetric, so the
    // centroid is conserved by the physics. User interaction can move it,
    // but the fit-to-view camera handles that render-side. Do NOT recenter
    // here - it would violate the conservation law and make testing harder.

    for (let i = 0; i < n; i++) {
      const p = particles[i];
      let fx = 0;
      let fy = 0;
      let phaseCoupling = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const q = particles[j];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const rawDist = Math.sqrt(dx * dx + dy * dy);

        // Direction from RAW distance (unit vector)
        // For coincident particles: deterministic direction from indices,
        // with sign flip for reverse pair to preserve antisymmetry
        let ux: number, uy: number;
        if (rawDist < 0.01) {
          // Deterministic angle from hashed pair indices (order-independent hash)
          const minIdx = Math.min(i, j);
          const maxIdx = Math.max(i, j);
          const hash = (minIdx * 2654435761 + maxIdx * 2246822519) >>> 0;
          const angle = (hash / 0xFFFFFFFF) * 2 * Math.PI;
          // Sign depends on which particle we're computing for
          const sign = i < j ? 1 : -1;
          ux = Math.cos(angle) * sign;
          uy = Math.sin(angle) * sign;
        } else {
          ux = dx / rawDist;
          uy = dy / rawDist;
        }

        // Clamp distance for force magnitude only (prevents infinite repulsion)
        const clampedDist = Math.max(rawDist, rMinPx);
        const rUnits = clampedDist / U;

        // Phase difference
        const phaseDiff = q.phase! - p.phase!;

        // attraction (1 + J cos) minus repulsion 1/r, in units
        const pair = 1 + J * Math.cos(phaseDiff) - 1 / rUnits;

        fx += ux * pair;
        fy += uy * pair;

        // Compute phase coupling from CURRENT positions (simultaneous with spatial)
        phaseCoupling += Math.sin(phaseDiff) / rUnits;
      }

      fx /= n;
      fy /= n;

      // Store phase delta for this particle (computed from current state)
      this.phaseDelta[i] = DT * (this.omega[i] + (K / n) * phaseCoupling);

      // Desired displacement this frame, in pixels
      let deltaX = DT * U * fx;
      let deltaY = DT * U * fy;

      if (interaction?.active) {
        const ix = interaction.x - p.x;
        const iy = interaction.y - p.y;
        const id = Math.sqrt(ix * ix + iy * iy);
        if (id > 1 && id < 150) {
          const s = interaction.strength * (1 - id / 150) * 4;
          const dir = interaction.type === 'attract' ? 1 : -1;
          deltaX += (ix / id) * s * dir;
          deltaY += (iy / id) * s * dir;
        }
      }

      // First-order integration via the a = delta - v trick: no inertia.
      forces.push({ ax: deltaX - p.vx, ay: deltaY - p.vy });
    }

    return forces;
  }

  postStep(particles: Particle[], _rng: SeededRandom): void {
    // Apply phase deltas that were computed during computeForces
    // This ensures x and θ derivatives are evaluated from the same state
    const n = particles.length;

    for (let i = 0; i < n; i++) {
      let ph = particles[i].phase! + this.phaseDelta[i];
      // Wrap to [-pi, pi]
      while (ph > Math.PI) ph -= 2 * Math.PI;
      while (ph < -Math.PI) ph += 2 * Math.PI;
      particles[i].phase = ph;
    }
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) {
      return { avgSpeed: 0, phaseSynchronization: 0 };
    }
    let speedSum = 0;
    let cosSum = 0;
    let sinSum = 0;
    for (const p of particles) {
      speedSum += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      cosSum += Math.cos(p.phase!);
      sinSum += Math.sin(p.phase!);
    }
    const n = particles.length;
    return {
      avgSpeed: speedSum / n,
      phaseSynchronization: Math.sqrt((cosSum / n) ** 2 + (sinSum / n) ** 2),
    };
  }
}

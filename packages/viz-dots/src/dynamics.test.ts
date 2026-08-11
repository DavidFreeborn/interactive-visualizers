/**
 * PHYSICS regression tests for Swarm Dynamics.
 *
 * The existing test suite verifies that the code runs; it never verified that
 * the dynamics are correct, which is why every collapse bug shipped with
 * "248/248 tests passing". These tests assert on measured behavior:
 * swarm size bands, collapse detectors, and the signature observables of the
 * known collective states, with thresholds calibrated against headless
 * simulations of the exact reference equations:
 *
 *   Friends & Enemies (unit coords, ground truth):
 *     n=400, 3000 steps: cycle mode R_rms 0.85, R_max 1.17-1.35,
 *     nearest-neighbor 0.019-0.022 units, never collapses.
 *   Swarmalators (paper equations, N=120, 2000 steps, dt=0.1):
 *     J=1, K=0:  annulus inner radius 0.57-0.73 units, angle-phase
 *                correlation 0.99+ across seeds
 *     J=0.1, K=1: sync order 1.000
 *     J=1, K=-0.75: sustained mean speed ~0.15 units/time
 *
 * Place alongside model.test.ts. Requires the 'plane' topology patch.
 * Allow ~30s: the swarmalator tests are O(n^2) per step by design.
 */

import { describe, it, expect } from 'vitest';
import { DotsSimulation } from './sim/DotsSimulation';
import type { DotsConfig, Particle } from './model/types';

const W = 800;
const H = 600;
const U = Math.min(W, H) / 4; // must match the unit() in both behaviors

function radialStats(particles: Particle[]) {
  let cx = 0;
  let cy = 0;
  for (const p of particles) {
    cx += p.x;
    cy += p.y;
  }
  cx /= particles.length;
  cy /= particles.length;
  let sum2 = 0;
  let rMin = Infinity;
  let rMax = 0;
  for (const p of particles) {
    const r = Math.hypot(p.x - cx, p.y - cy);
    sum2 += r * r;
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
  }
  return { cx, cy, rms: Math.sqrt(sum2 / particles.length), rMin, rMax };
}

/** Mean nearest-neighbor distance: the collapse detector. */
function meanNearestNeighbor(particles: Particle[], sample = 150): number {
  const n = Math.min(sample, particles.length);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const p = particles[i];
    let best = Infinity;
    for (let j = 0; j < particles.length; j++) {
      if (j === i) continue;
      const d = Math.hypot(particles[j].x - p.x, particles[j].y - p.y);
      if (d < best) best = d;
    }
    total += best;
  }
  return total / n;
}

/** |<e^{i(spatial angle - phase)}>|: 1 means phase == position angle (rainbow). */
function anglePhaseCorrelation(particles: Particle[]): number {
  const { cx, cy } = radialStats(particles);
  let c1 = 0, s1 = 0, c2 = 0, s2 = 0;
  for (const p of particles) {
    const ang = Math.atan2(p.y - cy, p.x - cx);
    c1 += Math.cos(ang - p.phase!);
    s1 += Math.sin(ang - p.phase!);
    c2 += Math.cos(ang + p.phase!);
    s2 += Math.sin(ang + p.phase!);
  }
  const n = particles.length;
  return Math.max(Math.hypot(c1, s1) / n, Math.hypot(c2, s2) / n);
}

function assertAllFinite(particles: Particle[]) {
  for (const p of particles) {
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
  }
}

function run(config: Partial<DotsConfig>, steps: number): DotsSimulation {
  const sim = new DotsSimulation({ width: W, height: H, topology: 'plane', ...config });
  for (let i = 0; i < steps; i++) sim.step();
  return sim;
}

describe('Friends & Enemies dynamics', () => {
  it('does not collapse and holds the calibrated swarm size (cycle mode)', () => {
    const sim = run({
      numParticles: 300,
      behavior: 'friends-enemies',
      seed: 5,
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.995,
        friendWeight: 0.02,
        enemyWeight: 0.01,
        rewireRate: 0.1,
        friendMode: 'cycle',
      },
    }, 3000);
    const ps = sim.getState().particles;
    assertAllFinite(ps);
    const { rms } = radialStats(ps);
    // Ground truth: R_rms ~ 0.85 units. Band [0.4, 1.6] units.
    expect(rms).toBeGreaterThan(0.4 * U);
    expect(rms).toBeLessThan(1.6 * U);
    // Collapse detector: ground-truth nn ~ 0.02 units; collapse -> near 0.
    expect(meanNearestNeighbor(ps)).toBeGreaterThan(0.004 * U);
    // Motion never dies: ground-truth speed ~ 0.009 units/step.
    expect(sim.getMetrics().avgSpeed).toBeGreaterThan(0.002 * U);
  }, 30000);

  it('does not collapse in random-friend mode (Woods original)', () => {
    const sim = run({
      numParticles: 300,
      behavior: 'friends-enemies',
      seed: 7,
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.995,
        friendWeight: 0.02,
        enemyWeight: 0.01,
        rewireRate: 0,
        friendMode: 'random',
      },
    }, 3000);
    const ps = sim.getState().particles;
    assertAllFinite(ps);
    const { rms } = radialStats(ps);
    expect(rms).toBeGreaterThan(0.15 * U); // clique blobs are tighter than the ribbon
    expect(rms).toBeLessThan(1.8 * U);
    expect(meanNearestNeighbor(ps)).toBeGreaterThan(0.002 * U);
  }, 30000);
});

describe('Swarmalator collective states (paper, omega = 0)', () => {
  it('J=1, K=0 forms the static phase wave: an annulus with phase == angle', () => {
    const sim = run({
      numParticles: 120,
      behavior: 'swarmalators',
      seed: 7,
      behaviorParams: { type: 'swarmalators', J: 1.0, K: 0.0, omegaVariance: 0 },
    }, 2000);
    const ps = sim.getState().particles;
    assertAllFinite(ps);
    const { rMin, rMax } = radialStats(ps);
    // Ground truth: inner radius 0.57-0.73 units across seeds. The hole in the
    // middle is the state's signature; a filled disc means the physics broke.
    expect(rMin).toBeGreaterThan(0.3 * U);
    expect(rMax).toBeLessThan(2.2 * U);
    // Ground truth: correlation 0.99+.
    expect(anglePhaseCorrelation(ps)).toBeGreaterThan(0.9);
  }, 30000);

  it('J=0.1, K=1 fully synchronizes (static sync)', () => {
    const sim = run({
      numParticles: 120,
      behavior: 'swarmalators',
      seed: 2,
      behaviorParams: { type: 'swarmalators', J: 0.1, K: 1.0, omegaVariance: 0 },
    }, 2000);
    assertAllFinite(sim.getState().particles);
    expect(sim.getMetrics().phaseSynchronization).toBeGreaterThan(0.95);
  }, 30000);

  it('J=1, K=-0.75 keeps circulating (active phase wave)', () => {
    const sim = run({
      numParticles: 120,
      behavior: 'swarmalators',
      seed: 2,
      behaviorParams: { type: 'swarmalators', J: 1.0, K: -0.75, omegaVariance: 0 },
    }, 2500);
    const ps = sim.getState().particles;
    assertAllFinite(ps);
    // Ground truth: 0.15 units/time = 0.015 units/frame ~ 2.3 px/frame at U=150.
    expect(sim.getMetrics().avgSpeed).toBeGreaterThan(0.5);
    // And it must not have collapsed while moving.
    expect(meanNearestNeighbor(ps)).toBeGreaterThan(0.5);
  }, 30000);

  it('conserves centroid (no artificial recentering)', () => {
    // Pair forces are exactly antisymmetric, so centroid is conserved.
    // This test verifies we haven't re-introduced artificial recentering.
    const sim = run({
      numParticles: 100,
      behavior: 'swarmalators',
      seed: 42,
      behaviorParams: { type: 'swarmalators', J: 1.0, K: 0.0, omegaVariance: 0 },
    }, 10);  // Just 10 steps to get initial centroid

    const getCentroid = () => {
      const ps = sim.getState().particles;
      let cx = 0, cy = 0;
      for (const p of ps) { cx += p.x; cy += p.y; }
      return { x: cx / ps.length, y: cy / ps.length };
    };

    const initial = getCentroid();

    // Run 500 more steps without interaction
    for (let i = 0; i < 500; i++) {
      sim.step();
    }

    const final = getCentroid();

    // Centroid should not have drifted significantly
    // Allow small numerical error (< 1 pixel drift over 500 frames)
    expect(Math.abs(final.x - initial.x)).toBeLessThan(1);
    expect(Math.abs(final.y - initial.y)).toBeLessThan(1);
  }, 30000);
});

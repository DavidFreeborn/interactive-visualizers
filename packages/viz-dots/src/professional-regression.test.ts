import { describe, it, expect } from 'vitest';
import { DotsSimulation } from './sim/DotsSimulation';
import { SpatialHash } from './model/spatial';
import { particleLifeForce } from './model/behaviors/ParticleLifeBehavior';

describe('topology-aware spatial geometry', () => {
  it('cylinder-x wraps x but not y', () => {
    const hash = new SpatialHash(100, 100, 20, 'cylinder-x');
    hash.insert({ id: 0, x: 5, y: 5, vx: 0, vy: 0, type: 0 });
    expect(hash.queryRadius(95, 5, 15).map(p => p.id)).toContain(0);
    expect(hash.queryRadius(95, 95, 15).map(p => p.id)).not.toContain(0);
  });

  it('mobius-x reflects y across the x seam', () => {
    const hash = new SpatialHash(100, 100, 20, 'mobius-x');
    hash.insert({ id: 0, x: 5, y: 10, vx: 0, vy: 0, type: 0 });
    const d = hash.wrappedDistance(95, 90, 5, 10);
    expect(d.dist).toBeCloseTo(10, 6);
    expect(hash.queryRadius(95, 90, 12).map(p => p.id)).toContain(0);
  });
});

describe('canonical Particle Life force profile', () => {
  it('has repulsive core, matrix peak, and zero at cutoff', () => {
    expect(particleLifeForce(0.8, 0.15)).toBeCloseTo(-0.5, 10);
    expect(particleLifeForce(0.8, 0.3)).toBeCloseTo(0, 10);
    expect(particleLifeForce(0.8, 0.65)).toBeCloseTo(0.8, 10);
    expect(particleLifeForce(0.8, 1)).toBe(0);
  });
});

describe('Friends & Enemies reference semantics', () => {
  it('Woods initialization is a square, not a disk', () => {
    const sim = new DotsSimulation({
      width: 800, height: 600, numParticles: 1000,
      behavior: 'friends-enemies', topology: 'plane', seed: 17,
      behaviorParams: {
        type: 'friends-enemies', friction: 0.995,
        friendWeight: 0.02, enemyWeight: 0.01,
        rewireRate: 0.099, friendMode: 'random',
      },
    });
    const U = 150;
    let outsideInscribedDisk = 0;
    for (const p of sim.getState().particles) {
      const x = (p.x - 400) / U;
      const y = (p.y - 300) / U;
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(1);
      if (x * x + y * y > 1) outsideInscribedDisk++;
    }
    expect(outsideInscribedDisk).toBeGreaterThan(0);
  });

  it('first-order map is not clipped by the old generic 50 px speed cap', () => {
    const sim = new DotsSimulation({
      width: 800, height: 600, numParticles: 100,
      behavior: 'friends-enemies', topology: 'plane', seed: 4,
      behaviorParams: {
        type: 'friends-enemies', friction: 1,
        friendWeight: 1, enemyWeight: 0,
        rewireRate: 0, friendMode: 'random',
      },
    });
    sim.step();
    const max = Math.max(...sim.getState().particles.map(p => Math.hypot(p.vx, p.vy)));
    expect(max).toBeGreaterThan(50);
  });
});

describe('2023 swarmalators', () => {
  it('F2 creates exactly two equal and opposite frequency groups for even N', () => {
    const sim = new DotsSimulation({
      width: 800, height: 600, numParticles: 400,
      behavior: 'swarmalators', topology: 'plane', seed: 1,
      behaviorParams: {
        type: 'swarmalators', model: 'diverse-2023',
        J: 1, K: 0, omegaVariance: 0,
        frequencyMode: 'F2', omegaMax: 3,
        chiral: true, frequencyCoupling: true,
        couplingRadius: 1.2, initialBoxSize: 4,
      },
    });
    const omegas = sim.getState().particles.map(p => p.omega);
    expect(omegas.filter(x => x === 1)).toHaveLength(200);
    expect(omegas.filter(x => x === -1)).toHaveLength(200);
  });

  it('reports the published space-phase order parameter S', () => {
    const sim = new DotsSimulation({
      width: 800, height: 600, numParticles: 100,
      behavior: 'swarmalators', topology: 'plane', seed: 2,
      behaviorParams: {
        type: 'swarmalators', model: 'classic-2017',
        J: 1, K: 0, omegaVariance: 0,
      },
    });
    const s = sim.getMetrics().spacePhaseOrder;
    expect(s).toBeDefined();
    expect(s!).toBeGreaterThanOrEqual(0);
    expect(s!).toBeLessThanOrEqual(1);
  });
});

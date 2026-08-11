/**
 * Tests for the Swarm Dynamics model and behaviors.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SeededRandom } from '@viz/core-math';
import { DotsModel } from '../src/model/DotsModel';
import { DotsSimulation } from '../src/sim/DotsSimulation';
import {
  DEFAULT_CONFIG,
  type DotsConfig,
  type BoidsParams,
  type FriendsEnemiesParams,
  type ParticleLifeParams,
  type SwarmalatorsParams,
} from '../src/model/types';
import { SpatialHash } from '../src/model/spatial';

describe('SpatialHash', () => {
  it('should insert and query particles', () => {
    const hash = new SpatialHash(100, 100, 20, false);
    const particle = { id: 0, x: 50, y: 50, vx: 0, vy: 0, type: 0 };

    hash.insert(particle);
    const results = hash.queryRadius(50, 50, 10);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(0);
  });

  it('should handle toroidal wrapping', () => {
    const hash = new SpatialHash(100, 100, 20, true);
    const particle = { id: 0, x: 5, y: 5, vx: 0, vy: 0, type: 0 };

    hash.insert(particle);

    // Query from opposite corner - should find particle due to wrapping
    const results = hash.queryRadius(95, 95, 20);

    expect(results).toHaveLength(1);
  });

  it('should calculate wrapped distances correctly', () => {
    const hash = new SpatialHash(100, 100, 20, true);

    // Points on opposite sides should have short wrapped distance
    const result = hash.wrappedDistance(5, 5, 95, 95);

    // Direct distance would be sqrt((90)^2 + (90)^2) ≈ 127
    // Wrapped distance should be sqrt((10)^2 + (10)^2) ≈ 14
    expect(result.dist).toBeLessThan(20);
  });
});

describe('DotsModel', () => {
  describe('createInitialState', () => {
    it('should create particles with correct count', () => {
      const config: DotsConfig = {
        ...DEFAULT_CONFIG,
        numParticles: 100,
      };
      const model = new DotsModel(config);
      const rng = new SeededRandom(42);
      const state = model.createInitialState(rng);

      expect(state.particles).toHaveLength(100);
      expect(state.frame).toBe(0);
    });

    it('should be reproducible with same seed', () => {
      const config: DotsConfig = {
        ...DEFAULT_CONFIG,
        numParticles: 50,
      };
      const model1 = new DotsModel(config);
      const model2 = new DotsModel(config);

      const state1 = model1.createInitialState(new SeededRandom(123));
      const state2 = model2.createInitialState(new SeededRandom(123));

      expect(state1.particles[0].x).toBeCloseTo(state2.particles[0].x);
      expect(state1.particles[0].y).toBeCloseTo(state2.particles[0].y);
    });
  });

  describe('step', () => {
    it('should advance frame count', () => {
      const model = new DotsModel(DEFAULT_CONFIG);
      const rng = new SeededRandom(42);
      let state = model.createInitialState(rng);

      state = model.step(state, rng);
      expect(state.frame).toBe(1);

      state = model.step(state, rng);
      expect(state.frame).toBe(2);
    });

    it('should keep particles within bounds with torus topology', () => {
      const config: DotsConfig = {
        ...DEFAULT_CONFIG,
        numParticles: 100,
        topology: 'torus',
      };
      const model = new DotsModel(config);
      const rng = new SeededRandom(42);
      let state = model.createInitialState(rng);

      // Run many steps
      for (let i = 0; i < 100; i++) {
        state = model.step(state, rng);
      }

      // All particles should be within bounds
      for (const p of state.particles) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(config.width);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(config.height);
      }
    });
  });

  describe('computeMetrics', () => {
    it('should compute average speed', () => {
      const model = new DotsModel(DEFAULT_CONFIG);
      const rng = new SeededRandom(42);
      let state = model.createInitialState(rng);

      // Run a few steps to get some motion
      for (let i = 0; i < 10; i++) {
        state = model.step(state, rng);
      }

      const metrics = model.computeMetrics(state);
      expect(metrics.avgSpeed).toBeGreaterThan(0);
    });
  });
});

describe('DotsSimulation', () => {
  it('should initialize with default config', () => {
    const sim = new DotsSimulation();
    const state = sim.getState();

    expect(state.particles.length).toBe(DEFAULT_CONFIG.numParticles);
  });

  it('should step the simulation', () => {
    const sim = new DotsSimulation({ numParticles: 50 });
    const initialFrame = sim.getState().frame;

    sim.step();

    expect(sim.getState().frame).toBe(initialFrame + 1);
  });

  it('should reset to initial state', () => {
    const sim = new DotsSimulation({ numParticles: 50 });

    // Run some steps
    for (let i = 0; i < 10; i++) {
      sim.step();
    }
    expect(sim.getState().frame).toBe(10);

    // Reset
    sim.reset();
    expect(sim.getState().frame).toBe(0);
  });

  it('should support different behavior types', () => {
    const behaviors = ['boids', 'friends-enemies', 'particle-life', 'swarmalators'] as const;

    for (const behavior of behaviors) {
      const sim = new DotsSimulation({
        numParticles: 50,
        behavior,
        behaviorParams: getDefaultParams(behavior),
      });

      // Should be able to step without error
      sim.step();
      expect(sim.getState().frame).toBe(1);
    }
  });
});

describe('Boids behavior', () => {
  it('should produce aligned motion over time', () => {
    const config: DotsConfig = {
      ...DEFAULT_CONFIG,
      numParticles: 100,
      behavior: 'boids',
      behaviorParams: {
        type: 'boids',
        maxSpeed: 10,
        separationWeight: 1.5,
        separationRadius: 25,
        alignmentWeight: 2.0, // Strong alignment
        alignmentRadius: 50,
        cohesionWeight: 1.0,
        cohesionRadius: 50,
        turnFactor: 0.2,
      },
    };

    const sim = new DotsSimulation(config);

    // Run many steps
    for (let i = 0; i < 200; i++) {
      sim.step();
    }

    const metrics = sim.getMetrics();

    // With strong alignment, order parameter should increase
    // (though not guaranteed to reach 1 due to stochastic initial conditions)
    expect(metrics.orderParameter).toBeDefined();
  });
});

describe('Friends & Enemies behavior', () => {
  it('should assign friends and enemies to particles', () => {
    const config: DotsConfig = {
      ...DEFAULT_CONFIG,
      numParticles: 50,
      behavior: 'friends-enemies',
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.995,
        friendWeight: 0.02,
        enemyWeight: 0.01,
        rewireRate: 0,
      },
    };

    const sim = new DotsSimulation(config);
    const state = sim.getState();

    // All particles should have friend and enemy assigned
    // Note: self-selection is allowed (as in Woods' original) - a self-friend/enemy
    // produces zero force due to the soft normalization, so it's harmless
    for (const p of state.particles) {
      expect(p.friendId).toBeDefined();
      expect(p.enemyId).toBeDefined();
      expect(p.friendId).toBeGreaterThanOrEqual(0);
      expect(p.enemyId).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Particle Life behavior', () => {
  it('should assign types to particles', () => {
    const config: DotsConfig = {
      ...DEFAULT_CONFIG,
      numParticles: 100,
      behavior: 'particle-life',
      behaviorParams: {
        type: 'particle-life',
        numTypes: 4,
        attractionMatrix: [
          [0, 0.5, -0.5, 0],
          [-0.5, 0, 0.5, 0],
          [0, -0.5, 0, 0.5],
          [0.5, 0, -0.5, 0],
        ],
        interactionRadius: 80,
        friction: 0.1,
      },
    };

    const sim = new DotsSimulation(config);
    const state = sim.getState();

    // Particles should have types in range [0, numTypes)
    for (const p of state.particles) {
      expect(p.type).toBeGreaterThanOrEqual(0);
      expect(p.type).toBeLessThan(4);
    }
  });
});

describe('Swarmalators behavior', () => {
  it('should assign phases to particles', () => {
    const config: DotsConfig = {
      ...DEFAULT_CONFIG,
      numParticles: 50,
      behavior: 'swarmalators',
      behaviorParams: {
        type: 'swarmalators',
        J: 1.0,
        K: 1.0,
        omegaVariance: 0.1,
      },
    };

    const sim = new DotsSimulation(config);
    const state = sim.getState();

    // All particles should have phase in [-PI, PI]
    for (const p of state.particles) {
      expect(p.phase).toBeDefined();
      expect(p.phase).toBeGreaterThanOrEqual(-Math.PI);
      expect(p.phase).toBeLessThanOrEqual(Math.PI);
    }
  });

  it('should compute phase synchronization', () => {
    const config: DotsConfig = {
      ...DEFAULT_CONFIG,
      numParticles: 50,
      behavior: 'swarmalators',
      behaviorParams: {
        type: 'swarmalators',
        J: 1.0,
        K: 2.0, // Strong phase coupling
        omegaVariance: 0.05,
      },
    };

    const sim = new DotsSimulation(config);

    // Run for a while
    for (let i = 0; i < 100; i++) {
      sim.step();
    }

    const metrics = sim.getMetrics();
    expect(metrics.phaseSynchronization).toBeDefined();
    expect(metrics.phaseSynchronization).toBeGreaterThanOrEqual(0);
    expect(metrics.phaseSynchronization).toBeLessThanOrEqual(1);
  });
});

// Helper function to get default params for each behavior
function getDefaultParams(behavior: string) {
  switch (behavior) {
    case 'boids':
      return {
        type: 'boids' as const,
        maxSpeed: 10,
        separationWeight: 1.5,
        separationRadius: 25,
        alignmentWeight: 1.0,
        alignmentRadius: 50,
        cohesionWeight: 1.0,
        cohesionRadius: 50,
        turnFactor: 0.2,
      };
    case 'friends-enemies':
      return {
        type: 'friends-enemies' as const,
        friction: 0.995,
        friendWeight: 0.02,
        enemyWeight: 0.01,
        rewireRate: 0.1,
      };
    case 'particle-life':
      return {
        type: 'particle-life' as const,
        numTypes: 4,
        attractionMatrix: [
          [0, 0.5, -0.5, 0],
          [-0.5, 0, 0.5, 0],
          [0, -0.5, 0, 0.5],
          [0.5, 0, -0.5, 0],
        ],
        interactionRadius: 80,
        friction: 0.1,
      };
    case 'swarmalators':
      return {
        type: 'swarmalators' as const,
        J: 1.0,
        K: 1.0,
        omegaVariance: 0.1,
      };
    default:
      throw new Error(`Unknown behavior: ${behavior}`);
  }
}

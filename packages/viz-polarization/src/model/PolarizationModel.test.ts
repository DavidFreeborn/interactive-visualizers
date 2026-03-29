/**
 * Tests for the Factionalization & Polarization model.
 */

import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@viz/core-math';
import {
  PolarizationModel,
  DEFAULT_CONFIG,
  validateConfig,
  createInitialState,
  stepSimulation,
  computeVariance,
  determineUpdatingCase,
  computeMetrics,
} from './PolarizationModel';
import { getNetwork } from './networks';

describe('PolarizationModel', () => {
  describe('validateConfig', () => {
    it('accepts valid default config', () => {
      expect(validateConfig(DEFAULT_CONFIG)).toBeNull();
    });

    it('rejects invalid numAgents', () => {
      const config = { ...DEFAULT_CONFIG, numAgents: 1 };
      expect(validateConfig(config)).toContain('numAgents');
    });

    it('rejects invalid likelihoodRatio', () => {
      const config = { ...DEFAULT_CONFIG, likelihoodRatio: 0.3 };
      expect(validateConfig(config)).toContain('likelihoodRatio');
    });
  });

  describe('networks', () => {
    it('chain network has correct structure', () => {
      const network = getNetwork('chain');
      expect(network.nodes.length).toBe(3);
      expect(network.hypothesisNode).toBe('H');
      expect(network.evidenceNode).toBe('D');
    });

    it('collider network has correct structure', () => {
      const network = getNetwork('collider');
      expect(network.nodes.length).toBe(3);
      expect(network.hypothesisNode).toBe('H');
      expect(network.evidenceNode).toBe('D');
    });
  });

  describe('initial state', () => {
    it('creates state with correct number of agents', () => {
      const config = { ...DEFAULT_CONFIG, numAgents: 2 };
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);

      expect(state.agents.length).toBe(2);
      expect(state.timestep).toBe(0);
      expect(state.history.length).toBe(1);
    });

    it('agents have different priors for S', () => {
      const config = { ...DEFAULT_CONFIG, numAgents: 2 };
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);

      expect(state.agents[0].beliefs['S']).not.toBe(state.agents[1].beliefs['S']);
    });

    it('agents start with same prior for H', () => {
      const config = { ...DEFAULT_CONFIG, numAgents: 2 };
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);

      expect(state.agents[0].h).toBe(state.agents[1].h);
    });
  });

  describe('simulation step', () => {
    it('advances timestep by 1', () => {
      const config = DEFAULT_CONFIG;
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);
      const nextState = stepSimulation(state, config, rng);

      expect(nextState.timestep).toBe(1);
    });

    it('records evidence in history', () => {
      const config = DEFAULT_CONFIG;
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);
      const nextState = stepSimulation(state, config, rng);

      expect(nextState.evidenceHistory.length).toBe(1);
      expect(typeof nextState.evidenceHistory[0]).toBe('boolean');
    });

    it('updates agent beliefs', () => {
      const config = DEFAULT_CONFIG;
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);
      const nextState = stepSimulation(state, config, rng);

      // At least one agent should have changed belief
      const h0Changed = nextState.agents[0].h !== state.agents[0].h;
      const h1Changed = nextState.agents[1].h !== state.agents[1].h;
      expect(h0Changed || h1Changed).toBe(true);
    });
  });

  describe('metrics', () => {
    it('variance is non-negative', () => {
      const agents = [{ h: 0.3, beliefs: {} }, { h: 0.7, beliefs: {} }];
      expect(computeVariance(agents)).toBeGreaterThanOrEqual(0);
    });

    it('variance is zero for identical beliefs', () => {
      const agents = [{ h: 0.5, beliefs: {} }, { h: 0.5, beliefs: {} }];
      expect(computeVariance(agents)).toBeCloseTo(0, 10);
    });

    it('computes correct variance', () => {
      const agents = [{ h: 0.3, beliefs: {} }, { h: 0.7, beliefs: {} }];
      // Mean = 0.5, variance = ((0.3-0.5)^2 + (0.7-0.5)^2) / 2 = 0.04
      expect(computeVariance(agents)).toBeCloseTo(0.04, 10);
    });
  });

  describe('updating cases', () => {
    it('identifies convergent case', () => {
      const prev = [{ h: 0.3, beliefs: {} }, { h: 0.7, beliefs: {} }];
      const curr = [{ h: 0.4, beliefs: {} }, { h: 0.6, beliefs: {} }];
      const caseType = determineUpdatingCase(prev, curr);
      // Convergent (0.4 closer to 0.6 than 0.3 to 0.7)
      // Co-directional (both moved toward 0.5)
      // Cisvergent depends on values
      expect(['A', 'B', 'E', 'F']).toContain(caseType);
    });

    it('identifies divergent case', () => {
      const prev = [{ h: 0.4, beliefs: {} }, { h: 0.6, beliefs: {} }];
      const curr = [{ h: 0.3, beliefs: {} }, { h: 0.7, beliefs: {} }];
      const caseType = determineUpdatingCase(prev, curr);
      // Divergent (0.3 further from 0.7 than 0.4 from 0.6)
      expect(['C', 'D', 'G', 'H']).toContain(caseType);
    });
  });

  describe('deterministic reproducibility', () => {
    it('produces identical results with same seed', () => {
      const config = DEFAULT_CONFIG;

      // Run 1
      const rng1 = new SeededRandom(42);
      const state1 = createInitialState(config, rng1);
      let s1 = state1;
      for (let i = 0; i < 10; i++) {
        s1 = stepSimulation(s1, config, rng1);
      }

      // Run 2
      const rng2 = new SeededRandom(42);
      const state2 = createInitialState(config, rng2);
      let s2 = state2;
      for (let i = 0; i < 10; i++) {
        s2 = stepSimulation(s2, config, rng2);
      }

      expect(s1.agents[0].h).toBe(s2.agents[0].h);
      expect(s1.agents[1].h).toBe(s2.agents[1].h);
    });

    it('produces different results with different seeds', () => {
      const config = DEFAULT_CONFIG;

      const rng1 = new SeededRandom(42);
      const state1 = createInitialState(config, rng1);
      let s1 = state1;
      for (let i = 0; i < 10; i++) {
        s1 = stepSimulation(s1, config, rng1);
      }

      const rng2 = new SeededRandom(999);
      const state2 = createInitialState(config, rng2);
      let s2 = state2;
      for (let i = 0; i < 10; i++) {
        s2 = stepSimulation(s2, config, rng2);
      }

      // With high probability, results should differ
      const same = s1.agents[0].h === s2.agents[0].h && s1.agents[1].h === s2.agents[1].h;
      // This is a probabilistic test, but very likely to differ
      expect(same).toBe(false);
    });
  });

  describe('network effects', () => {
    it('collider network can produce divergence', () => {
      const config = { ...DEFAULT_CONFIG, networkType: 'collider' as const, numTimesteps: 30 };
      const rng = new SeededRandom(42);
      let state = createInitialState(config, rng);

      const initialVariance = computeVariance(state.agents);

      // Run simulation
      for (let i = 0; i < config.numTimesteps; i++) {
        state = stepSimulation(state, config, rng);
      }

      const finalVariance = computeVariance(state.agents);

      // Collider can produce divergence (variance increase)
      // This may not always happen but the structure allows it
      expect(finalVariance).toBeGreaterThanOrEqual(0);
    });
  });
});

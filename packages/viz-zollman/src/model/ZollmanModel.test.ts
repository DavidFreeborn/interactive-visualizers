/**
 * Tests for the Zollman Effect model.
 */

import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@viz/core-math';
import {
  ZollmanModel,
  DEFAULT_CONFIG,
  validateConfig,
  createInitialState,
  stepSimulation,
  computeMetrics,
} from './ZollmanModel';
import { createCycleNetwork, createCompleteNetwork } from './networks';

describe('ZollmanModel', () => {
  describe('validateConfig', () => {
    it('accepts valid default config', () => {
      expect(validateConfig(DEFAULT_CONFIG)).toBeNull();
    });

    it('rejects invalid numAgents', () => {
      const config = { ...DEFAULT_CONFIG, numAgents: 2 };
      expect(validateConfig(config)).toContain('numAgents');
    });

    it('rejects invalid epsilon', () => {
      const config = { ...DEFAULT_CONFIG, epsilon: 0.5 };
      expect(validateConfig(config)).toContain('epsilon');
    });
  });

  describe('networks', () => {
    it('cycle network has correct degree', () => {
      const network = createCycleNetwork(6);
      expect(network.length).toBe(6);
      network.forEach((neighbors) => {
        expect(neighbors.length).toBe(2);
      });
    });

    it('complete network has correct degree', () => {
      const network = createCompleteNetwork(6);
      expect(network.length).toBe(6);
      network.forEach((neighbors) => {
        expect(neighbors.length).toBe(5); // n-1 connections
      });
    });

    it('cycle network connects neighbors correctly', () => {
      const network = createCycleNetwork(4);
      expect(network[0]).toContain(3); // 0 connects to 3 (wrap)
      expect(network[0]).toContain(1);
      expect(network[1]).toContain(0);
      expect(network[1]).toContain(2);
    });
  });

  describe('initial state', () => {
    it('creates correct number of agents', () => {
      const state = createInitialState(DEFAULT_CONFIG);
      expect(state.agents.length).toBe(DEFAULT_CONFIG.numAgents);
    });

    it('all agents start with prior belief', () => {
      const state = createInitialState(DEFAULT_CONFIG);
      state.agents.forEach((agent) => {
        expect(agent.belief).toBe(DEFAULT_CONFIG.priorBelief);
      });
    });

    it('all agents start testing arm B', () => {
      const state = createInitialState(DEFAULT_CONFIG);
      state.agents.forEach((agent) => {
        expect(agent.testingArm).toBe('B');
      });
    });
  });

  describe('simulation step', () => {
    it('advances round', () => {
      const rng = new SeededRandom(42);
      const state = createInitialState(DEFAULT_CONFIG);
      const nextState = stepSimulation(state, DEFAULT_CONFIG, rng);

      expect(nextState.round).toBe(1);
    });

    it('updates beliefs', () => {
      const rng = new SeededRandom(42);
      let state = createInitialState(DEFAULT_CONFIG);

      // Run several rounds
      for (let i = 0; i < 10; i++) {
        state = stepSimulation(state, DEFAULT_CONFIG, rng);
      }

      // Beliefs should have changed from prior
      const changed = state.agents.some((a) => a.belief !== DEFAULT_CONFIG.priorBelief);
      expect(changed).toBe(true);
    });

    it('accumulates trial data', () => {
      const rng = new SeededRandom(42);
      let state = createInitialState(DEFAULT_CONFIG);

      state = stepSimulation(state, DEFAULT_CONFIG, rng);

      // Agents should have accumulated data (own + neighbors)
      state.agents.forEach((agent) => {
        const totalTrials = agent.trialsA + agent.trialsB;
        expect(totalTrials).toBeGreaterThan(0);
      });
    });
  });

  describe('metrics', () => {
    it('mean belief is in [0, 1]', () => {
      const state = createInitialState(DEFAULT_CONFIG);
      const metrics = computeMetrics(state, DEFAULT_CONFIG);

      expect(metrics.meanBelief).toBeGreaterThanOrEqual(0);
      expect(metrics.meanBelief).toBeLessThanOrEqual(1);
    });

    it('exploration rate is in [0, 1]', () => {
      const rng = new SeededRandom(42);
      let state = createInitialState(DEFAULT_CONFIG);

      for (let i = 0; i < 20; i++) {
        state = stepSimulation(state, DEFAULT_CONFIG, rng);
      }

      const metrics = computeMetrics(state, DEFAULT_CONFIG);
      expect(metrics.explorationRate).toBeGreaterThanOrEqual(0);
      expect(metrics.explorationRate).toBeLessThanOrEqual(1);
    });
  });

  describe('deterministic reproducibility', () => {
    it('produces identical results with same seed', () => {
      const config = DEFAULT_CONFIG;

      // Run 1
      const rng1 = new SeededRandom(42);
      let state1 = createInitialState(config);
      for (let i = 0; i < 20; i++) {
        state1 = stepSimulation(state1, config, rng1);
      }

      // Run 2
      const rng2 = new SeededRandom(42);
      let state2 = createInitialState(config);
      for (let i = 0; i < 20; i++) {
        state2 = stepSimulation(state2, config, rng2);
      }

      expect(state1.agents[0].belief).toBe(state2.agents[0].belief);
    });

    it('produces different results with different seeds', () => {
      const config = DEFAULT_CONFIG;

      const rng1 = new SeededRandom(42);
      let state1 = createInitialState(config);
      for (let i = 0; i < 20; i++) {
        state1 = stepSimulation(state1, config, rng1);
      }

      const rng2 = new SeededRandom(999);
      let state2 = createInitialState(config);
      for (let i = 0; i < 20; i++) {
        state2 = stepSimulation(state2, config, rng2);
      }

      // With high probability, results differ
      const same = state1.agents.every(
        (a, i) => a.belief === state2.agents[i].belief
      );
      expect(same).toBe(false);
    });
  });

  describe('arm switching behavior', () => {
    it('agents switch from B to A when belief drops below 0.5', () => {
      // Create an agent with belief below 0.5
      const config = { ...DEFAULT_CONFIG, priorBelief: 0.3 };
      const state = createInitialState(config);

      // All agents start testing B because that's the default
      expect(state.agents[0].testingArm).toBe('B');

      // After first step, agents with belief < 0.5 should switch to A
      const rng = new SeededRandom(42);
      const newState = stepSimulation(state, config, rng);

      // With priorBelief = 0.3, after Bayesian update, some agents may still be below 0.5
      // The key is that testingArm is set based on belief
      for (const agent of newState.agents) {
        if (agent.belief <= 0.5) {
          expect(agent.testingArm).toBe('A');
        } else {
          expect(agent.testingArm).toBe('B');
        }
      }
    });

    it('agents testing arm B accumulate B trials, not A trials', () => {
      const config = { ...DEFAULT_CONFIG, priorBelief: 0.6 };
      const state = createInitialState(config);
      const rng = new SeededRandom(42);

      const newState = stepSimulation(state, config, rng);

      for (const agent of newState.agents) {
        if (agent.belief > 0.5) {
          // Agent is testing B, so should have B trials from this round
          expect(agent.trialsB).toBeGreaterThanOrEqual(config.testsPerRound);
        }
      }
    });
  });

  describe('convergence behavior', () => {
    it('complete network has more consensus (lower belief variance)', () => {
      const cycleConfig = { ...DEFAULT_CONFIG, topology: 'cycle' as const };
      const completeConfig = { ...DEFAULT_CONFIG, topology: 'complete' as const };

      // Run both for same number of rounds with same seed
      const rng1 = new SeededRandom(42);
      let cycleState = createInitialState(cycleConfig);
      for (let i = 0; i < 50; i++) {
        cycleState = stepSimulation(cycleState, cycleConfig, rng1);
      }

      const rng2 = new SeededRandom(42);
      let completeState = createInitialState(completeConfig);
      for (let i = 0; i < 50; i++) {
        completeState = stepSimulation(completeState, completeConfig, rng2);
      }

      // Complete networks share all data, so agents should have more similar beliefs
      // (lower variance among agents)
      const cycleBeliefVariance =
        cycleState.agents.reduce((sum, a) => {
          const mean =
            cycleState.agents.reduce((s, ag) => s + ag.belief, 0) /
            cycleState.agents.length;
          return sum + (a.belief - mean) ** 2;
        }, 0) / cycleState.agents.length;

      const completeBeliefVariance =
        completeState.agents.reduce((sum, a) => {
          const mean =
            completeState.agents.reduce((s, ag) => s + ag.belief, 0) /
            completeState.agents.length;
          return sum + (a.belief - mean) ** 2;
        }, 0) / completeState.agents.length;

      // Complete network should have lower variance (more consensus)
      expect(completeBeliefVariance).toBeLessThanOrEqual(cycleBeliefVariance + 0.01);
    });

    it('different topologies produce different dynamics', () => {
      const cycleConfig = { ...DEFAULT_CONFIG, topology: 'cycle' as const, seed: 99 };
      const completeConfig = { ...DEFAULT_CONFIG, topology: 'complete' as const, seed: 99 };

      const rng1 = new SeededRandom(99);
      let cycleState = createInitialState(cycleConfig);
      for (let i = 0; i < 30; i++) {
        cycleState = stepSimulation(cycleState, cycleConfig, rng1);
      }

      const rng2 = new SeededRandom(99);
      let completeState = createInitialState(completeConfig);
      for (let i = 0; i < 30; i++) {
        completeState = stepSimulation(completeState, completeConfig, rng2);
      }

      // The belief histories should differ due to different information sharing
      const cycleFinal = cycleState.beliefHistory[cycleState.beliefHistory.length - 1];
      const completeFinal = completeState.beliefHistory[completeState.beliefHistory.length - 1];

      // They should be different (different dynamics)
      expect(Math.abs(cycleFinal - completeFinal)).toBeGreaterThan(0);
    });
  });
});

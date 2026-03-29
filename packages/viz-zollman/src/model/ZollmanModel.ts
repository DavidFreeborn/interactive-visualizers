/**
 * Core model logic for the Zollman Effect visualizer.
 *
 * Scientific Status: Standard toy model
 */

import { SeededRandom } from '@viz/core-math';
import type {
  ZollmanConfig,
  ZollmanState,
  ZollmanMetrics,
  ZollmanAgent,
} from './types';
import { createNetwork } from './networks';

/**
 * Default configuration.
 */
export const DEFAULT_CONFIG: ZollmanConfig = {
  topology: 'cycle',
  numAgents: 6,
  epsilon: 0.05,
  testsPerRound: 10,
  priorBelief: 0.5,
  seed: 12345,
};

/**
 * Validates configuration.
 */
export function validateConfig(config: ZollmanConfig): string | null {
  if (config.numAgents < 3 || config.numAgents > 20) {
    return 'numAgents must be between 3 and 20';
  }
  if (config.epsilon < 0.01 || config.epsilon > 0.2) {
    return 'epsilon must be between 0.01 and 0.2';
  }
  if (config.testsPerRound < 1 || config.testsPerRound > 50) {
    return 'testsPerRound must be between 1 and 50';
  }
  if (config.priorBelief < 0.1 || config.priorBelief > 0.9) {
    return 'priorBelief must be between 0.1 and 0.9';
  }
  return null;
}

/**
 * Creates initial agents.
 */
export function createInitialAgents(config: ZollmanConfig): ZollmanAgent[] {
  const agents: ZollmanAgent[] = [];
  for (let i = 0; i < config.numAgents; i++) {
    agents.push({
      id: i,
      belief: config.priorBelief,
      testingArm: 'B', // All start exploring arm B
      successA: 0,
      trialsA: 0,
      successB: 0,
      trialsB: 0,
    });
  }
  return agents;
}

/**
 * Creates initial state.
 */
export function createInitialState(config: ZollmanConfig): ZollmanState {
  return {
    round: 0,
    agents: createInitialAgents(config),
    beliefHistory: [config.priorBelief],
    neighbors: createNetwork(config.topology, config.numAgents),
  };
}

/**
 * Simulates binomial trials for an arm.
 *
 * @param n Number of trials
 * @param p Success probability
 * @param rng Random number generator
 * @returns Number of successes
 */
function sampleBinomial(n: number, p: number, rng: SeededRandom): number {
  let successes = 0;
  for (let i = 0; i < n; i++) {
    if (rng.random() < p) successes++;
  }
  return successes;
}

/**
 * Updates an agent's belief using Bayes' rule.
 *
 * Uses beta distribution update:
 * P(B better | data) proportional to P(data | B better) * P(B better)
 */
function updateBelief(
  agent: ZollmanAgent,
  successA: number,
  trialsA: number,
  successB: number,
  trialsB: number,
  epsilon: number
): number {
  // Likelihood of data under each hypothesis
  // H1: Arm B is better (p_B = 0.5 + epsilon, p_A = 0.5)
  // H0: Arm A is better (p_B = 0.5, p_A = 0.5 + epsilon)

  // Actually in standard Zollman model, arm A always has p=0.5
  // and arm B has p = 0.5 + epsilon
  // The hypothesis is: "arm B is better than arm A"

  const pA = 0.5;
  const pB = 0.5 + epsilon;

  // Compute log likelihoods to avoid numerical issues
  // log P(data | H) = successes * log(p) + failures * log(1-p)

  // Under H1 (B is better): use pA for A, pB for B
  const logLikH1 =
    successA * Math.log(pA) +
    (trialsA - successA) * Math.log(1 - pA) +
    successB * Math.log(pB) +
    (trialsB - successB) * Math.log(1 - pB);

  // Under H0 (A is better or same): use pA for A, pA for B (both 0.5)
  const logLikH0 =
    successA * Math.log(pA) +
    (trialsA - successA) * Math.log(1 - pA) +
    successB * Math.log(pA) +
    (trialsB - successB) * Math.log(1 - pA);

  // Bayesian update: P(H1|D) = P(D|H1) * P(H1) / P(D)
  // Using log-sum-exp for numerical stability
  const logPriorH1 = Math.log(agent.belief);
  const logPriorH0 = Math.log(1 - agent.belief);

  const logPostH1 = logLikH1 + logPriorH1;
  const logPostH0 = logLikH0 + logPriorH0;

  const maxLogPost = Math.max(logPostH1, logPostH0);
  const logSum =
    maxLogPost +
    Math.log(Math.exp(logPostH1 - maxLogPost) + Math.exp(logPostH0 - maxLogPost));

  const posteriorH1 = Math.exp(logPostH1 - logSum);

  // Clamp to avoid extremes
  return Math.max(0.001, Math.min(0.999, posteriorH1));
}

/**
 * Runs one round of simulation.
 */
export function stepSimulation(
  state: ZollmanState,
  config: ZollmanConfig,
  rng: SeededRandom
): ZollmanState {
  const newAgents: ZollmanAgent[] = state.agents.map((agent) => ({
    ...agent,
  }));

  // 1. Each agent tests their preferred arm and accumulates data
  const roundData: { successA: number; trialsA: number; successB: number; trialsB: number }[] =
    [];

  for (let i = 0; i < newAgents.length; i++) {
    const agent = newAgents[i];

    // Choose which arm to test based on current belief
    agent.testingArm = agent.belief > 0.5 ? 'B' : 'A';

    let sA = 0,
      tA = 0,
      sB = 0,
      tB = 0;

    if (agent.testingArm === 'B') {
      // Test arm B
      sB = sampleBinomial(config.testsPerRound, 0.5 + config.epsilon, rng);
      tB = config.testsPerRound;
    } else {
      // Test arm A
      sA = sampleBinomial(config.testsPerRound, 0.5, rng);
      tA = config.testsPerRound;
    }

    roundData.push({ successA: sA, trialsA: tA, successB: sB, trialsB: tB });

    // Accumulate own data
    agent.successA += sA;
    agent.trialsA += tA;
    agent.successB += sB;
    agent.trialsB += tB;
  }

  // 2. Share data with neighbors
  for (let i = 0; i < newAgents.length; i++) {
    for (const j of state.neighbors[i]) {
      // Agent i observes agent j's round data
      const jData = roundData[j];
      newAgents[i].successA += jData.successA;
      newAgents[i].trialsA += jData.trialsA;
      newAgents[i].successB += jData.successB;
      newAgents[i].trialsB += jData.trialsB;
    }
  }

  // 3. Update beliefs
  for (const agent of newAgents) {
    agent.belief = updateBelief(
      agent,
      agent.successA,
      agent.trialsA,
      agent.successB,
      agent.trialsB,
      config.epsilon
    );
  }

  // Compute mean belief
  const meanBelief =
    newAgents.reduce((sum, a) => sum + a.belief, 0) / newAgents.length;

  return {
    round: state.round + 1,
    agents: newAgents,
    beliefHistory: [...state.beliefHistory, meanBelief],
    neighbors: state.neighbors,
  };
}

/**
 * Computes metrics.
 */
export function computeMetrics(
  state: ZollmanState,
  config: ZollmanConfig
): ZollmanMetrics {
  const meanBelief =
    state.agents.reduce((sum, a) => sum + a.belief, 0) / state.agents.length;

  // Check convergence: all agents agree (beliefs all > 0.9 or all < 0.1)
  const allHigh = state.agents.every((a) => a.belief > 0.9);
  const allLow = state.agents.every((a) => a.belief < 0.1);
  const converged = allHigh || allLow;

  // Truth is that arm B is better
  const convergedToTruth = allHigh;

  // Exploration rate: proportion testing arm B
  const explorationRate =
    state.agents.filter((a) => a.testingArm === 'B').length / state.agents.length;

  return {
    round: state.round,
    meanBelief,
    converged,
    convergedToTruth,
    explorationRate,
  };
}

/**
 * The ZollmanModel class.
 */
export class ZollmanModel {
  public readonly config: ZollmanConfig;

  constructor(config: Partial<ZollmanConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const error = validateConfig(this.config);
    if (error) {
      throw new Error(`Invalid config: ${error}`);
    }
  }

  createInitialState(): ZollmanState {
    return createInitialState(this.config);
  }

  step(state: ZollmanState, rng: SeededRandom): ZollmanState {
    return stepSimulation(state, this.config, rng);
  }

  computeMetrics(state: ZollmanState): ZollmanMetrics {
    return computeMetrics(state, this.config);
  }
}

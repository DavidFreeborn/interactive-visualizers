/**
 * Core model logic for the Factionalization & Polarization visualizer.
 *
 * Scientific Status: Standard toy model
 */

import { SeededRandom } from '@viz/core-math';
import type {
  PolarizationConfig,
  PolarizationState,
  PolarizationMetrics,
  AgentBeliefs,
  UpdatingCase,
} from './types';
import { getNetwork } from './networks';
import { bayesianUpdate, updateBeliefInS } from './bayesian';

/**
 * Default configuration.
 */
export const DEFAULT_CONFIG: PolarizationConfig = {
  networkType: 'collider',
  numAgents: 2,
  numTimesteps: 20,
  likelihoodRatio: 0.65,
  seed: 12345,
};

/**
 * Validates configuration.
 */
export function validateConfig(config: PolarizationConfig): string | null {
  if (config.numAgents < 2 || config.numAgents > 50) {
    return 'numAgents must be between 2 and 50';
  }
  if (config.numTimesteps < 1 || config.numTimesteps > 100) {
    return 'numTimesteps must be between 1 and 100';
  }
  if (config.likelihoodRatio < 0.5 || config.likelihoodRatio > 0.99) {
    return 'likelihoodRatio must be between 0.5 and 0.99';
  }
  return null;
}

/**
 * Creates initial agent beliefs.
 * Agents differ in their prior on exogenous variables (S for collider, nothing for chain).
 */
export function createInitialAgents(
  config: PolarizationConfig,
  rng: SeededRandom
): AgentBeliefs[] {
  const agents: AgentBeliefs[] = [];

  for (let i = 0; i < config.numAgents; i++) {
    // For MVP with 2 agents, give them opposing priors
    const priorH = 0.5; // Same prior on H
    const priorS = config.numAgents === 2
      ? (i === 0 ? 0.7 : 0.3) // Agent 1 high S, Agent 2 low S
      : 0.3 + 0.4 * rng.random(); // Random for more agents

    agents.push({
      h: priorH,
      beliefs: {
        H: priorH,
        S: priorS,
      },
    });
  }

  return agents;
}

/**
 * Creates initial state.
 */
export function createInitialState(
  config: PolarizationConfig,
  rng: SeededRandom
): PolarizationState {
  const agents = createInitialAgents(config, rng);

  return {
    timestep: 0,
    agents,
    history: [agents.map((a) => ({ ...a, beliefs: { ...a.beliefs } }))],
    evidenceHistory: [],
  };
}

/**
 * Runs one timestep: generate evidence and update all agents.
 */
export function stepSimulation(
  state: PolarizationState,
  config: PolarizationConfig,
  rng: SeededRandom
): PolarizationState {
  // Generate evidence (D)
  // For simplicity, evidence is positive with probability = average H belief
  const avgH = state.agents.reduce((sum, a) => sum + a.h, 0) / state.agents.length;
  const evidence = rng.random() < avgH;

  // Update all agents
  const newAgents = state.agents.map((agent) => {
    // Update H belief
    let updated = bayesianUpdate(agent, evidence, config.networkType, config.likelihoodRatio);
    // Update S belief (for collider)
    updated = updateBeliefInS(updated, evidence, config.networkType, config.likelihoodRatio);
    return updated;
  });

  // Record history
  const newHistory = [
    ...state.history,
    newAgents.map((a) => ({ ...a, beliefs: { ...a.beliefs } })),
  ];

  return {
    timestep: state.timestep + 1,
    agents: newAgents,
    history: newHistory,
    evidenceHistory: [...state.evidenceHistory, evidence],
  };
}

/**
 * Computes the variance of H beliefs across agents.
 */
export function computeVariance(agents: AgentBeliefs[]): number {
  if (agents.length === 0) return 0;
  const mean = agents.reduce((sum, a) => sum + a.h, 0) / agents.length;
  const variance =
    agents.reduce((sum, a) => sum + (a.h - mean) ** 2, 0) / agents.length;
  return variance;
}

/**
 * Determines the updating case for 2 agents.
 *
 * Convergent: agents moved toward each other
 * Co-directional: agents moved in the same direction
 * Cisvergent: beliefs have the same parity (both > or both < 0.5)
 */
export function determineUpdatingCase(
  prevAgents: AgentBeliefs[],
  currentAgents: AgentBeliefs[]
): UpdatingCase {
  if (prevAgents.length !== 2 || currentAgents.length !== 2) {
    return 'A'; // Default for non-2-agent cases
  }

  const prev0 = prevAgents[0].h;
  const prev1 = prevAgents[1].h;
  const curr0 = currentAgents[0].h;
  const curr1 = currentAgents[1].h;

  const delta0 = curr0 - prev0;
  const delta1 = curr1 - prev1;

  const prevDiff = Math.abs(prev0 - prev1);
  const currDiff = Math.abs(curr0 - curr1);

  const convergent = currDiff < prevDiff;
  const codirectional = (delta0 > 0 && delta1 > 0) || (delta0 < 0 && delta1 < 0);
  const cisvergent =
    (curr0 > 0.5 && curr1 > 0.5) || (curr0 < 0.5 && curr1 < 0.5);

  // Map to case letter
  if (convergent && codirectional && cisvergent) return 'A';
  if (convergent && codirectional && !cisvergent) return 'B';
  if (!convergent && codirectional && cisvergent) return 'C';
  if (!convergent && codirectional && !cisvergent) return 'D';
  if (convergent && !codirectional && cisvergent) return 'E';
  if (convergent && !codirectional && !cisvergent) return 'F';
  if (!convergent && !codirectional && cisvergent) return 'G';
  return 'H';
}

/**
 * Computes metrics for the current state.
 */
export function computeMetrics(
  state: PolarizationState,
  config: PolarizationConfig
): PolarizationMetrics {
  const variance = computeVariance(state.agents);
  const meanBelief =
    state.agents.reduce((sum, a) => sum + a.h, 0) / state.agents.length;

  // Get previous step for updating case
  const prevAgents =
    state.history.length >= 2
      ? state.history[state.history.length - 2]
      : state.history[0];
  const updatingCase = determineUpdatingCase(prevAgents, state.agents);

  // Simple convergence check: variance decreased
  const isConvergent =
    state.history.length >= 2
      ? computeVariance(prevAgents) > variance
      : true;

  // Co-directional check
  const isCodirectional =
    state.history.length >= 2
      ? (() => {
          const delta0 = state.agents[0].h - prevAgents[0].h;
          const delta1 = state.agents[1].h - prevAgents[1].h;
          return (delta0 > 0 && delta1 > 0) || (delta0 < 0 && delta1 < 0);
        })()
      : true;

  return {
    timestep: state.timestep,
    variance,
    isConvergent,
    isCodirectional,
    updatingCase,
    meanBelief,
  };
}

/**
 * The PolarizationModel class wraps pure functions.
 */
export class PolarizationModel {
  public readonly config: PolarizationConfig;

  constructor(config: Partial<PolarizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const error = validateConfig(this.config);
    if (error) {
      throw new Error(`Invalid config: ${error}`);
    }
  }

  createInitialState(rng: SeededRandom): PolarizationState {
    return createInitialState(this.config, rng);
  }

  step(state: PolarizationState, rng: SeededRandom): PolarizationState {
    return stepSimulation(state, this.config, rng);
  }

  computeMetrics(state: PolarizationState): PolarizationMetrics {
    return computeMetrics(state, this.config);
  }
}

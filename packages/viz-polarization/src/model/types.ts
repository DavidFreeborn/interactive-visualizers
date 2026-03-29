/**
 * Type definitions for the Factionalization & Polarization visualizer.
 *
 * Scientific Status: Standard toy model
 */

/**
 * Network structure types.
 */
export type NetworkType = 'chain' | 'collider';

/**
 * Configuration for the polarization visualizer.
 */
export interface PolarizationConfig {
  /** Network structure type */
  networkType: NetworkType;

  /** Number of agents (MVP: 2) */
  numAgents: number;

  /** Number of timesteps */
  numTimesteps: number;

  /** Likelihood ratio for evidence */
  likelihoodRatio: number;

  /** Random seed */
  seed: number;
}

/**
 * A node in the Bayesian network.
 */
export interface BayesNode {
  id: string;
  label: string;
  parents: string[];
}

/**
 * A Bayesian network structure.
 */
export interface BayesNetwork {
  nodes: BayesNode[];
  edges: [string, string][]; // [from, to]
  hypothesisNode: string;
  evidenceNode: string;
}

/**
 * An agent's beliefs.
 */
export interface AgentBeliefs {
  /** Belief in hypothesis H (probability) */
  h: number;
  /** Joint beliefs for all nodes (keyed by node id) */
  beliefs: Record<string, number>;
}

/**
 * State of the polarization simulation.
 */
export interface PolarizationState {
  /** Current timestep */
  timestep: number;

  /** Agent beliefs at current timestep */
  agents: AgentBeliefs[];

  /** History of agent beliefs over time */
  history: AgentBeliefs[][];

  /** Evidence observed so far */
  evidenceHistory: boolean[];
}

/**
 * Eight updating cases.
 */
export type UpdatingCase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/**
 * Computed metrics for display.
 */
export interface PolarizationMetrics {
  /** Current timestep */
  timestep: number;

  /** Variance in H beliefs */
  variance: number;

  /** Whether agents converged */
  isConvergent: boolean;

  /** Whether agents moved same direction */
  isCodirectional: boolean;

  /** Updating case (for 2 agents) */
  updatingCase: UpdatingCase;

  /** Mean belief */
  meanBelief: number;
}

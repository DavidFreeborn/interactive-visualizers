/**
 * Type definitions for the Zollman Effect visualizer.
 *
 * Scientific Status: Standard toy model
 */

/**
 * Network topology types.
 */
export type TopologyType = 'cycle' | 'complete';

/**
 * Configuration for the Zollman simulation.
 */
export interface ZollmanConfig {
  /** Network topology */
  topology: TopologyType;

  /** Number of agents */
  numAgents: number;

  /** Epsilon: difference in arm success probabilities */
  epsilon: number;

  /** Tests per round per agent */
  testsPerRound: number;

  /** Prior belief in arm B */
  priorBelief: number;

  /** Random seed */
  seed: number;
}

/**
 * An agent in the network.
 */
export interface ZollmanAgent {
  id: number;
  /** Belief that arm B is better (probability) */
  belief: number;
  /** Which arm the agent currently prefers (tests) */
  testingArm: 'A' | 'B';
  /** Successes observed for arm A */
  successA: number;
  /** Trials for arm A */
  trialsA: number;
  /** Successes observed for arm B */
  successB: number;
  /** Trials for arm B */
  trialsB: number;
}

/**
 * State of the Zollman simulation.
 */
export interface ZollmanState {
  /** Current round */
  round: number;

  /** Agent states */
  agents: ZollmanAgent[];

  /** History of mean beliefs */
  beliefHistory: number[];

  /** Adjacency list for network */
  neighbors: number[][];
}

/**
 * Computed metrics.
 */
export interface ZollmanMetrics {
  /** Current round */
  round: number;

  /** Mean belief across agents */
  meanBelief: number;

  /** Whether all agents agree */
  converged: boolean;

  /** Whether converged to truth (arm B) */
  convergedToTruth: boolean;

  /** Proportion testing arm B */
  explorationRate: number;
}

/**
 * Shared types for the baseline single-sender signaling game.
 */

export type Matrix = number[][];

/**
 * User-provided configuration values before defaults are resolved.
 */
export interface SignalingGameConfigInput {
  numStates?: number;
  numMessages?: number;
  numActions?: number;
  prior?: number[];
  correctActions?: number[];
  initialReinforcement?: number;
  seed?: number;
  rollingWindowSize?: number;
}

/**
 * Fully resolved and validated signaling-game configuration.
 */
export interface SignalingGameConfig {
  numStates: number;
  numMessages: number;
  numActions: number;
  prior: number[];
  correctActions: number[];
  initialReinforcement: number;
  seed: number;
  rollingWindowSize: number;
}

/**
 * Learned weight state for the baseline signaling game.
 */
export interface SignalingGameState {
  senderWeights: Matrix;
  receiverWeights: Matrix;
}

/**
 * Policies derived by row-normalizing the learned weights.
 */
export interface SignalingPolicies {
  senderPolicy: Matrix;
  receiverPolicy: Matrix;
}

/**
 * Exact details of a single simulated round.
 */
export interface SignalingRoundEvent {
  round: number;
  stateIndex: number;
  messageIndex: number;
  actionIndex: number;
  reward: 0 | 1;
  success: boolean;
}

/**
 * Greedy diagnostic derived from the current policies.
 */
export interface GreedyDiagnostic {
  senderMessageByState: number[];
  receiverActionByMessage: number[];
  composedActionByState: number[];
  eachStateHasUniqueMessage: boolean;
  receiverMatchesCorrectAction: boolean;
}

/**
 * Approximate equilibrium-regime diagnostic derived from the current policies.
 */
export interface EquilibriumDiagnostic {
  kind: 'signalling-equilibrium' | 'pooling-equilibrium' | 'none';
  label: string;
  detail: string;
}

/**
 * Exact metrics derived from the current state and simulation history.
 */
export interface SignalingMetrics {
  round: number;
  seed: number;
  cumulativeSuccessRate: number;
  rollingSuccessRate: number;
  expectedSuccessRate: number;
  mutualInformationBits: number;
  maxMutualInformationBits: number;
  normalizedMutualInformation: number | null;
  totalSuccesses: number;
  greedyDiagnostic: GreedyDiagnostic;
  equilibriumDiagnostic: EquilibriumDiagnostic;
  stableSignalingSystem: boolean;
}

/**
 * One point in the simulation history for charts and diagnostics.
 */
export interface SimulationHistoryPoint {
  round: number;
  cumulativeSuccessRate: number;
  rollingSuccessRate: number;
  expectedSuccessRate: number;
  mutualInformationBits: number;
  normalizedMutualInformation: number | null;
}

/**
 * Immutable snapshot exposed by the simulation runner.
 */
export interface SimulationSnapshot {
  config: SignalingGameConfig;
  state: SignalingGameState;
  policies: SignalingPolicies;
  metrics: SignalingMetrics;
  history: SimulationHistoryPoint[];
  lastRoundEvent: SignalingRoundEvent | null;
}

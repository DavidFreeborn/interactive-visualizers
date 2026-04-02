import type {
  CompositionalApproximateRegime,
  CompositionalConfig,
  CompositionalConfigInput,
  CompositionalForgettingSnapshot,
  CompositionalGreedyDiagnostic,
  CompositionalHistoryPoint,
  CompositionalMetrics,
  CompositionalPolicies,
  CompositionalRoundEvent,
  Matrix as SharedMatrix,
  PairTensor as SharedPairTensor,
} from '../compositionalShared';

/**
 * Shared types for the traditional two-sender compositional signaling game.
 */
export type Matrix = SharedMatrix;
export type PairTensor = SharedPairTensor;

/**
 * User-provided configuration values before defaults are resolved.
 */
export type CompositionalTraditionalConfigInput = CompositionalConfigInput;

/**
 * Fully resolved fixed configuration for the traditional compositional game.
 */
export type CompositionalTraditionalConfig = CompositionalConfig;

/**
 * Learned weight state for the traditional compositional game.
 */
export interface CompositionalTraditionalState {
  senderAWeights: Matrix;
  senderBWeights: Matrix;
  receiverPairWeights: PairTensor;
}

/**
 * Policies derived by normalizing the learned weights.
 */
export type CompositionalTraditionalPolicies = CompositionalPolicies;

/**
 * Exact details of a single simulated round.
 */
export type CompositionalTraditionalRoundEvent = CompositionalRoundEvent;

/**
 * Greedy diagnostic for sender partitions and pair decoding.
 */
export type TraditionalGreedyDiagnostic = CompositionalGreedyDiagnostic;

/**
 * Approximate public-facing regime label.
 */
export type TraditionalApproximateRegime = CompositionalApproximateRegime;

/**
 * Exact metric bundle for the traditional compositional game.
 */
export type CompositionalTraditionalMetrics = CompositionalMetrics;

/**
 * History point stored for charts.
 */
export type CompositionalTraditionalHistoryPoint = CompositionalHistoryPoint;

/**
 * Immutable snapshot exposed by the runner.
 */
export interface CompositionalTraditionalSnapshot {
  config: CompositionalTraditionalConfig;
  forgetting: CompositionalForgettingSnapshot;
  state: CompositionalTraditionalState;
  policies: CompositionalTraditionalPolicies;
  metrics: CompositionalTraditionalMetrics;
  history: CompositionalTraditionalHistoryPoint[];
  lastRoundEvent: CompositionalTraditionalRoundEvent | null;
}

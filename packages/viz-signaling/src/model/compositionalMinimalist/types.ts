import type {
  CompositionalConfig,
  CompositionalConfigInput,
  CompositionalHistoryPoint,
  CompositionalMetrics,
  CompositionalPolicies,
  CompositionalRoundEvent,
  Matrix,
} from '../compositionalShared';

export type CompositionalMinimalistConfigInput = CompositionalConfigInput;
export type CompositionalMinimalistConfig = CompositionalConfig;
export type CompositionalMinimalistPolicies = CompositionalPolicies;
export type CompositionalMinimalistRoundEvent = CompositionalRoundEvent;
export type CompositionalMinimalistMetrics = CompositionalMetrics;
export type CompositionalMinimalistHistoryPoint = CompositionalHistoryPoint;

export interface CompositionalMinimalistState {
  senderAWeights: Matrix;
  senderBWeights: Matrix;
  receiverAtomicAWeights: Matrix;
  receiverAtomicBWeights: Matrix;
}

import type {
  CompositionalConfig,
  CompositionalConfigInput,
  CompositionalHistoryPoint,
  CompositionalMetrics,
  CompositionalPolicies,
  CompositionalRoundEvent,
  Matrix,
  PairTensor,
} from "../compositionalShared";

export type CompositionalGeneralistConfigInput = CompositionalConfigInput;
export type CompositionalGeneralistConfig = CompositionalConfig;
export type CompositionalGeneralistPolicies = CompositionalPolicies;
export type CompositionalGeneralistRoundEvent = CompositionalRoundEvent;
export type CompositionalGeneralistMetrics = CompositionalMetrics;
export type CompositionalGeneralistHistoryPoint = CompositionalHistoryPoint;

export interface CompositionalGeneralistState {
  senderAWeights: Matrix;
  senderBWeights: Matrix;
  receiverAObservationWeights: number[];
  receiverBObservationWeights: number[];
  receiverPairObservationWeights: number[][];
  receiverAtomicAActionWeights: Matrix;
  receiverAtomicBActionWeights: Matrix;
  receiverPairActionWeights: PairTensor;
}

export type CompositionalGeneralistReplacementVariant =
  | "information-erasing"
  | "information-preserving";

export interface CompositionalGeneralistReplacementSpec {
  replacedSender: "a" | "b";
  replacedMessageIndex: number;
  variant: CompositionalGeneralistReplacementVariant;
}

export interface CompositionalGeneralistReplacementExperimentResult {
  preReplacementPolicies: CompositionalGeneralistPolicies;
  postReplacementState: CompositionalGeneralistState;
  postReplacementPolicies: CompositionalGeneralistPolicies;
  affectedStates: number[];
  affectedPairs: Array<readonly [number, number]>;
  affectedCorrectActionProbability: number;
}

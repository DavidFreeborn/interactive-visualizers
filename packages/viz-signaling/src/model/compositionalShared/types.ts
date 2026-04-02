export type Matrix = number[][];
export type PairTensor = number[][][];

export type CompositionalModelType =
  | "traditional"
  | "minimalist"
  | "information-erasing-generalist"
  | "information-preserving-generalist";

export interface CompositionalConfigInput {
  seed?: number;
  initialReinforcement?: number;
  rollingWindowSize?: number;
  signalingBiasEnabled?: boolean;
  signalingBiasStrength?: number;
}

export interface CompositionalConfig {
  numStates: 4;
  numMessagesA: 2;
  numMessagesB: 2;
  numActions: 4;
  prior: [0.25, 0.25, 0.25, 0.25];
  correctActions: [0, 1, 2, 3];
  initialReinforcement: number;
  seed: number;
  rollingWindowSize: number;
  signalingBiasEnabled: boolean;
  signalingBiasStrength: number;
}

export type CompositionalForgettingTriggerMode = "manual" | "scheduled";

export interface CompositionalMessageReplacementSpec {
  replacedSender: "a" | "b";
  replacedMessageIndex: number;
}

export interface CompositionalForgettingConfigInput
  extends Partial<CompositionalMessageReplacementSpec> {
  enabled?: boolean;
  triggerMode?: CompositionalForgettingTriggerMode;
  triggerRound?: number | null;
}

export interface CompositionalForgettingConfig
  extends CompositionalMessageReplacementSpec {
  enabled: boolean;
  triggerMode: CompositionalForgettingTriggerMode;
  triggerRound: number | null;
}

export interface CompositionalForgettingPairReference {
  messageAIndex: number;
  messageBIndex: number;
}

export interface CompositionalForgettingDiagnostics {
  affectedPairs: CompositionalForgettingPairReference[];
  unaffectedPairs: CompositionalForgettingPairReference[];
  preForgettingPeakSignalActionMutualInformationBits: number | null;
  immediatePostForgettingSignalActionMutualInformationBits: number | null;
  currentSignalActionMutualInformationBits: number | null;
  informationLostBits: number | null;
  peakInformationLostBits: number | null;
  preForgettingAffectedCorrectActionProbability: number | null;
  immediatePostForgettingAffectedCorrectActionProbability: number | null;
  immediatePostForgettingUnaffectedCorrectActionProbability: number | null;
  currentAffectedCorrectActionProbability: number | null;
  currentUnaffectedCorrectActionProbability: number | null;
}

export interface CompositionalForgettingSnapshot
  extends CompositionalForgettingConfig {
  hasTriggered: boolean;
  triggeredRound: number | null;
  diagnostics: CompositionalForgettingDiagnostics;
}

export interface CompositionalPolicies {
  senderAPolicy: Matrix;
  senderBPolicy: Matrix;
  receiverPairPolicy: PairTensor;
}

export interface CompositionalRoundEvent {
  round: number;
  stateIndex: number;
  messageAIndex: number;
  messageBIndex: number;
  actionIndex: number;
  reward: 0 | 1;
  success: boolean;
}

export interface CompositionalGreedyDiagnostic {
  senderAMessageByState: number[];
  senderBMessageByState: number[];
  actionByPair: number[][];
  composedActionByState: number[];
  greedyPairByState: Array<readonly [number, number]>;
}

export interface CompositionalTraditionalStructuralDiagnostic {
  stableTraditionalSignalingSystem: boolean;
  senderAPartitionsByGarment: boolean;
  senderBPartitionsByColour: boolean;
}

export interface CompositionalApproximateRegime {
  kind:
    | "signalling-equilibrium"
    | "pooling-equilibrium"
    | "not-yet-coordinated";
  label: string;
  detail: string;
}

export interface CompositionalMetrics {
  round: number;
  seed: number;
  cumulativeSuccessRate: number;
  rollingSuccessRate: number;
  expectedSuccessRate: number;
  senderAMutualInformationBits: number;
  senderBMutualInformationBits: number;
  jointMutualInformationBits: number;
  greedyDiagnostic: CompositionalGreedyDiagnostic;
  approximateRegime: CompositionalApproximateRegime;
  traditionalStructuralDiagnostic: CompositionalTraditionalStructuralDiagnostic;
  totalSuccesses: number;
}

export interface CompositionalHistoryPoint {
  round: number;
  cumulativeSuccessRate: number;
  rollingSuccessRate: number;
  expectedSuccessRate: number;
  senderAMutualInformationBits: number;
  senderBMutualInformationBits: number;
  jointMutualInformationBits: number;
  signalActionMutualInformationBits: number | null;
  affectedCorrectActionProbability: number | null;
  unaffectedCorrectActionProbability: number | null;
  informationLostBits: number | null;
}

export interface CompositionalModelDefinition<State> {
  type: CompositionalModelType;
  label: string;
  description: string;
  reference: string;
  referenceUrl: string;
  showsTraditionalStructureDiagnostics: boolean;
  createInitialState: (config: CompositionalConfig) => State;
  cloneState: (state: State) => State;
  derivePolicies: (
    state: State,
    config: CompositionalConfig,
  ) => CompositionalPolicies;
  playRound: (
    state: State,
    config: CompositionalConfig,
    prng: import("../prng").SeededPrng,
    round: number,
  ) => {
    nextState: State;
    event: CompositionalRoundEvent;
  };
  applyMessageReplacement: (
    state: State,
    config: CompositionalConfig,
    spec: CompositionalMessageReplacementSpec,
  ) => State;
}

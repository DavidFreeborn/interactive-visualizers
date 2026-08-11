export {
  DEFAULT_SIGNALING_GAME_CONFIG,
  createIdentityMapping,
  createUniformPrior,
  resolveSignalingGameConfig,
} from "./model/validation";
export {
  COMPOSITIONAL_MODEL_OPTIONS,
  DEFAULT_COMPOSITIONAL_CONFIG,
  buildCompositionalMetrics,
  calculateCompositionalApproximateRegime,
  calculateCompositionalExpectedSuccessRate,
  calculateCompositionalGreedyDiagnostic,
  calculateCompositionalJointMutualInformationBits,
  calculateCompositionalSignalActionMutualInformationBits,
  calculateCompositionalSenderAMutualInformationBits,
  calculateCompositionalSenderBMutualInformationBits,
  calculateCompositionalStableTraditionalSignalingSystem,
  calculateCompositionalTraditionalStructuralDiagnostic,
  resolveCompositionalConfig,
} from "./model/compositionalShared";
export {
  DEFAULT_COMPOSITIONAL_TRADITIONAL_CONFIG,
  buildCompositionalTraditionalMetrics,
  calculateJointMutualInformationBits,
  calculateSenderAMutualInformationBits,
  calculateSenderBMutualInformationBits,
  calculateStableTraditionalSignalingSystem,
  calculateTraditionalApproximateRegime,
  calculateTraditionalExpectedSuccessRate,
  calculateTraditionalGreedyDiagnostic,
  createInitialCompositionalTraditionalState,
  deriveCompositionalTraditionalPolicies,
  playCompositionalTraditionalRound,
  reinforceSuccessfulTraditionalRound,
  resolveCompositionalTraditionalConfig,
} from "./model/compositionalTraditional";
export {
  COMPOSITIONAL_MINIMALIST_TEMPERATURE,
  createInitialCompositionalMinimalistState,
  deriveCompositionalMinimalistPolicies,
  playCompositionalMinimalistRound,
} from "./model/compositionalMinimalist";
export {
  applyCompositionalGeneralistMessageReplacement,
  COMPOSITIONAL_GENERALIST_REFERENCE,
  createInitialCompositionalGeneralistState,
  deriveCompositionalGeneralistPolicies,
  playCompositionalGeneralistRound,
  runCompositionalGeneralistReplacementExperiment,
} from "./model/compositionalGeneralist";
export {
  createInitialCompositionalInformationErasingGeneralistState,
  deriveCompositionalInformationErasingGeneralistPolicies,
  playCompositionalInformationErasingGeneralistRound,
} from "./model/compositionalInformationErasingGeneralist";
export {
  createInitialCompositionalInformationPreservingGeneralistState,
  deriveCompositionalInformationPreservingGeneralistPolicies,
  playCompositionalInformationPreservingGeneralistRound,
} from "./model/compositionalInformationPreservingGeneralist";
export { SimulationRunner } from "./sim/SimulationRunner";
export { ClassicSimulationRunner } from "./sim/ClassicSimulationRunner";
export { CompositionalRunner } from "./sim/CompositionalRunner";
export { CompositionalTraditionalRunner } from "./sim/CompositionalTraditionalRunner";
export { SeededPrng } from "./model/prng";
export { SignalingGameView } from "./ui/components/SignalingGameView";
export { CompositionalTraditionalView } from "./ui/compositionalTraditional/CompositionalTraditionalView";
export { ClassicSignalingGamesApp } from "./apps/ClassicSignalingGamesApp";
export { CompositionalSignalingGamesApp } from "./apps/CompositionalSignalingGamesApp";
export {
  createInitialSignalingGameState,
  derivePolicies,
  playRound,
  reinforceSuccessfulRound,
} from "./model/signalingGame";
export {
  buildSignalingMetrics,
  calculateExpectedSuccessRate,
  calculateGreedyDiagnostic,
  calculateMaximumMutualInformationBits,
  calculateMutualInformationBits,
  calculateNormalizedMutualInformation,
} from "./model/metrics";
export { normalizeRow, sampleCategorical } from "./model/numeric";
export type {
  GreedyDiagnostic,
  Matrix,
  SignalingGameConfig,
  SignalingGameConfigInput,
  SignalingGameState,
  SignalingMetrics,
  SignalingPolicies,
  SignalingRoundEvent,
  SimulationHistoryPoint,
  SimulationSnapshot,
} from "./model/types";
export type {
  CompositionalApproximateRegime,
  CompositionalConfig,
  CompositionalConfigInput,
  CompositionalForgettingConfig,
  CompositionalForgettingConfigInput,
  CompositionalForgettingDiagnostics,
  CompositionalForgettingPairReference,
  CompositionalForgettingSnapshot,
  CompositionalForgettingTriggerMode,
  CompositionalGreedyDiagnostic,
  CompositionalHistoryPoint,
  CompositionalMessageReplacementSpec,
  CompositionalMetrics,
  CompositionalModelDefinition,
  CompositionalModelType,
  CompositionalPolicies,
  CompositionalRoundEvent,
  CompositionalTraditionalStructuralDiagnostic,
  PairTensor,
} from "./model/compositionalShared";
export type {
  CompositionalTraditionalConfig,
  CompositionalTraditionalConfigInput,
  CompositionalTraditionalHistoryPoint,
  CompositionalTraditionalMetrics,
  CompositionalTraditionalPolicies,
  CompositionalTraditionalRoundEvent,
  CompositionalTraditionalSnapshot,
  CompositionalTraditionalState,
  TraditionalApproximateRegime,
  TraditionalGreedyDiagnostic,
} from "./model/compositionalTraditional";
export type {
  CompositionalMinimalistConfig,
  CompositionalMinimalistConfigInput,
  CompositionalMinimalistHistoryPoint,
  CompositionalMinimalistMetrics,
  CompositionalMinimalistPolicies,
  CompositionalMinimalistRoundEvent,
  CompositionalMinimalistState,
} from "./model/compositionalMinimalist";
export type {
  CompositionalGeneralistConfig,
  CompositionalGeneralistConfigInput,
  CompositionalGeneralistHistoryPoint,
  CompositionalGeneralistMetrics,
  CompositionalGeneralistPolicies,
  CompositionalGeneralistReplacementExperimentResult,
  CompositionalGeneralistReplacementSpec,
  CompositionalGeneralistReplacementVariant,
  CompositionalGeneralistRoundEvent,
  CompositionalGeneralistState,
} from "./model/compositionalGeneralist";
export type {
  CompositionalInformationErasingGeneralistConfig,
  CompositionalInformationErasingGeneralistConfigInput,
  CompositionalInformationErasingGeneralistHistoryPoint,
  CompositionalInformationErasingGeneralistMetrics,
  CompositionalInformationErasingGeneralistPolicies,
  CompositionalInformationErasingGeneralistRoundEvent,
  CompositionalInformationErasingGeneralistState,
} from "./model/compositionalInformationErasingGeneralist";
export type {
  CompositionalInformationPreservingGeneralistConfig,
  CompositionalInformationPreservingGeneralistConfigInput,
  CompositionalInformationPreservingGeneralistHistoryPoint,
  CompositionalInformationPreservingGeneralistMetrics,
  CompositionalInformationPreservingGeneralistPolicies,
  CompositionalInformationPreservingGeneralistRoundEvent,
  CompositionalInformationPreservingGeneralistState,
} from "./model/compositionalInformationPreservingGeneralist";
export type { SignalingGameViewProps } from "./ui/components/SignalingGameView";
export type { CompositionalTraditionalViewProps } from "./ui/compositionalTraditional/CompositionalTraditionalView";
export { EnglishTownGeneratorApp } from './town/ui/EnglishTownGeneratorApp';
export type { EnglishTownGeneratorAppProps } from './town/ui/EnglishTownGeneratorApp';
export { generateEnglishTownRegion, TOWN_MODEL_VERSION } from './town/generateTown';
export {
  DEFAULT_TOWN_GENERATOR_CONFIG,
  resolveTownGeneratorConfig,
  validateTownGeneratorConfig,
} from './town/config';
export { ENGLISH_REGION_OPTIONS, REGION_PROFILES } from './town/regionalProfiles';
export type {
  BoundaryConditions,
  Composition,
  EdgeCharacter,
  EnglishRegion,
  EstimateInterval,
  Facility,
  GenerationDiagnostics,
  GeologyUnit,
  GeneratedTownRegion,
  HistoricalEvent,
  LocalStreet,
  LocalStreetPattern,
  MapLens,
  ModelSource,
  PopulationBand,
  RailLine,
  RegionSummary,
  RiverSpecification,
  RoadLink,
  Settlement,
  TerrainCell,
  TownCell,
  TownGeneratorConfig,
  TownGeneratorConfigInput,
  Ward,
  WardMetrics,
} from './town/types';

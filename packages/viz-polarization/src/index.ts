/**
 * @package viz-polarization
 * Factionalization & Polarization Visualizer
 *
 * Scientific Status: Standard toy model
 */

// Model
export { PolarizationModel, DEFAULT_CONFIG } from './model/PolarizationModel';
export { PolarizationSimulation } from './sim/PolarizationSimulation';
export type {
  PolarizationConfig,
  PolarizationState,
  PolarizationMetrics,
  AgentBeliefs,
  NetworkType,
  UpdatingCase,
  BayesNetwork,
  BayesNode,
} from './model/types';

// Networks
export { getNetwork, CHAIN_NETWORK, COLLIDER_NETWORK } from './model/networks';

// Views
export { PolarizationView, BeliefSpace, NetworkDiagram } from './views';
export type {
  PolarizationViewProps,
  BeliefSpaceProps,
  NetworkDiagramProps,
} from './views';

// Content and presets
export { PRESETS } from './presets';
export { CONTENT } from './content';

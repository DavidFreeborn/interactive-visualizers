/**
 * @package viz-zollman
 * Zollman Effect / Network Epistemology Visualizer
 *
 * Scientific Status: Standard toy model
 * Source: Zollman (2007) "The Communication Structure of Epistemic Communities"
 * Tier: 2 (With caution - partial source support)
 *
 * Shows how network structure affects collective learning in scientific communities.
 * Demonstrates the trade-off between connectivity and epistemic diversity.
 */

// Model exports
export type {
  TopologyType,
  ZollmanAgent,
  ZollmanState,
  ZollmanConfig,
  ZollmanMetrics,
} from './model/types';

export {
  DEFAULT_CONFIG,
  validateConfig,
  createInitialState,
  computeMetrics,
  stepSimulation,
} from './model/ZollmanModel';

export { createCycleNetwork, createCompleteNetwork } from './model/networks';

// Simulation exports
export { ZollmanSimulation } from './sim/ZollmanSimulation';

// View exports
export { ZollmanView } from './views';
export type { ZollmanViewProps } from './views';
export { NetworkView } from './views';
export type { NetworkViewProps } from './views';
export { BeliefTimeline } from './views';
export type { BeliefTimelineProps } from './views';

// Content exports
export { CONTENT } from './content';

// Preset exports
export { PRESETS, getPreset, getDefaultPreset } from './presets';
export type { Preset as ZollmanPreset } from './presets';

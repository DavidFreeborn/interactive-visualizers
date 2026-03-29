/**
 * @package viz-signaling
 * Signaling Games & Compositionality Visualizer
 *
 * Scientific Status: Standard toy model
 * Source: CompositionalSignal paper (Freeborn)
 */

// Model
export { SignalingGameModel, DEFAULT_CONFIG } from './model/SignalingGameModel';
export { SignalingSimulation } from './sim/SignalingSimulation';
export type {
  SignalingGameConfig,
  SignalingGameState,
  ReceiverType,
  SignalingMetrics,
} from './model/types';

// Views
export {
  SignalingGameView,
  SignalingDiagram,
  Timeline,
  UrnMatrix,
  ParameterControls,
  WhatThisShowsPanel,
  WhatThisDoesNotShowPanel,
} from './views';
export type {
  SignalingGameViewProps,
  SignalingDiagramProps,
  TimelineProps,
  TimelineData,
  UrnMatrixProps,
  ParameterControlsProps,
} from './views';

// Content and presets
export { PRESETS } from './presets';
export { CONTENT } from './content';

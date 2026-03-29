/**
 * @package viz-manifold
 * Manifold Learning Visualizer
 *
 * Scientific Status: Standard toy model
 */

// Model
export { ManifoldModel, DEFAULT_CONFIG } from './model/ManifoldModel';
export { ManifoldSimulation } from './sim/ManifoldSimulation';
export type {
  ManifoldConfig,
  ManifoldState,
  ManifoldMetrics,
  DatasetType,
  AlgorithmType,
  DataPoint,
} from './model/types';

// Datasets
export {
  generateSwissRoll,
  generateSCurve,
  generateCircles,
  generateDataset,
} from './model/datasets';

// Algorithms
export { pca, isomap, runAlgorithm } from './model/algorithms';

// Views
export {
  ManifoldView,
  ScatterPlot3D,
  ScatterPlot2D,
  ManifoldControls,
} from './views';
export type {
  ManifoldViewProps,
  ScatterPlot3DProps,
  ScatterPlot2DProps,
  ManifoldControlsProps,
} from './views';

// Content and presets
export { PRESETS } from './presets';
export { CONTENT } from './content';

/**
 * Core model logic for manifold learning visualization.
 *
 * Scientific Status: Standard toy model
 */

import { SeededRandom } from '@viz/core-math';
import type {
  ManifoldConfig,
  ManifoldState,
  ManifoldMetrics,
  DataPoint,
} from './types';
import { generateDataset } from './datasets';
import { runAlgorithm, type EmbeddingResult } from './algorithms';
import { computeMetrics } from './metrics';

/**
 * Default configuration.
 */
export const DEFAULT_CONFIG: ManifoldConfig = {
  dataset: 'swiss-roll',
  numSamples: 300,
  noise: 0.5,
  algorithm: 'isomap',
  numNeighbors: 12,
  targetDim: 2,
  perplexity: 30,
  seed: 12345,
};

/**
 * Validates configuration.
 */
export function validateConfig(config: ManifoldConfig): string | null {
  if (config.numSamples < 10 || config.numSamples > 5000) {
    return 'numSamples must be between 10 and 5000';
  }
  if (config.noise < 0 || config.noise > 2) {
    return 'noise must be between 0 and 2';
  }
  if (config.numNeighbors < 2 || config.numNeighbors > 100) {
    return 'numNeighbors must be between 2 and 100';
  }
  if (config.numNeighbors >= config.numSamples) {
    return 'numNeighbors must be less than numSamples';
  }
  if (config.targetDim < 1 || config.targetDim > 3) {
    return 'targetDim must be 1, 2, or 3';
  }
  return null;
}

/**
 * Creates initial state with generated dataset.
 */
export function createInitialState(
  config: ManifoldConfig,
  rng: SeededRandom
): ManifoldState {
  const points = generateDataset(
    config.dataset,
    config.numSamples,
    config.noise,
    rng
  );

  return {
    points,
    isEmbedded: false,
    neighborGraph: [],
    geodesicDistances: null,
  };
}

/**
 * Runs the embedding algorithm and updates state.
 */
export function runEmbedding(
  state: ManifoldState,
  config: ManifoldConfig
): ManifoldState {
  const result = runAlgorithm(
    config.algorithm,
    state.points,
    config.targetDim,
    config.numNeighbors,
    config.perplexity
  );

  // Update points with embedded coordinates
  const newPoints: DataPoint[] = state.points.map((p, i) => ({
    ...p,
    embedded: result.embedded[i] || [0, 0],
  }));

  return {
    ...state,
    points: newPoints,
    isEmbedded: true,
    neighborGraph: result.neighborGraph,
    geodesicDistances: result.geodesicDistances,
  };
}

/**
 * The ManifoldModel class wraps the pure functions with configuration.
 */
export class ManifoldModel {
  public readonly config: ManifoldConfig;

  constructor(config: Partial<ManifoldConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const error = validateConfig(this.config);
    if (error) {
      throw new Error(`Invalid config: ${error}`);
    }
  }

  createInitialState(rng: SeededRandom): ManifoldState {
    return createInitialState(this.config, rng);
  }

  runEmbedding(state: ManifoldState): ManifoldState {
    return runEmbedding(state, this.config);
  }

  computeMetrics(state: ManifoldState): ManifoldMetrics {
    if (!state.isEmbedded) {
      return {
        trustworthiness: 0,
        continuity: 0,
        explainedVariance: 0,
        meanLocalDistortion: 0,
      };
    }

    // For metrics, we need to get explained variance from a fresh run
    // or store it in state. For simplicity, we compute it here.
    const result = runAlgorithm(
      this.config.algorithm,
      state.points,
      this.config.targetDim,
      this.config.numNeighbors,
      this.config.perplexity
    );

    return computeMetrics(
      state.points,
      result.explainedVariance,
      this.config.numNeighbors
    );
  }
}

/**
 * Type definitions for the Manifold Learning visualizer.
 *
 * Scientific Status: Standard toy model
 */

/**
 * Available dataset types.
 */
export type DatasetType = 'swiss-roll' | 's-curve' | 'circles';

/**
 * Available dimensionality reduction algorithms.
 */
export type AlgorithmType = 'pca' | 'isomap';

/**
 * Configuration for the manifold learning visualizer.
 */
export interface ManifoldConfig {
  /** Dataset to generate */
  dataset: DatasetType;

  /** Number of samples */
  numSamples: number;

  /** Noise level (standard deviation) */
  noise: number;

  /** Algorithm to use for dimensionality reduction */
  algorithm: AlgorithmType;

  /** Number of nearest neighbors for Isomap */
  numNeighbors: number;

  /** Target embedding dimension (2 or 3) */
  targetDim: number;

  /** Random seed for reproducibility */
  seed: number;
}

/**
 * A single data point in the dataset.
 */
export interface DataPoint {
  /** Original coordinates in high-dimensional space */
  original: number[];

  /** Embedded coordinates in low-dimensional space */
  embedded: number[];

  /** Parameter value along the manifold (for coloring) */
  param: number;
}

/**
 * State of the manifold learning simulation.
 */
export interface ManifoldState {
  /** Dataset points */
  points: DataPoint[];

  /** Whether embedding has been computed */
  isEmbedded: boolean;

  /** k-nearest neighbor graph (adjacency list) */
  neighborGraph: number[][];

  /** Geodesic distance matrix (for Isomap) */
  geodesicDistances: number[][] | null;
}

/**
 * Computed metrics for the embedding.
 */
export interface ManifoldMetrics {
  /** Trustworthiness: proportion of k-neighbors preserved */
  trustworthiness: number;

  /** Continuity: inverse false neighbor proportion */
  continuity: number;

  /** Explained variance ratio (for PCA) */
  explainedVariance: number;

  /** Mean local distortion */
  meanLocalDistortion: number;
}

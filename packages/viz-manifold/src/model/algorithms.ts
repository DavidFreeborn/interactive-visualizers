/**
 * Dimensionality reduction algorithms.
 *
 * Scientific Status: Standard toy model
 * These are simplified implementations for educational purposes.
 */

import type { DataPoint, AlgorithmType } from './types';
import {
  centerMatrix,
  covarianceMatrix,
  eigenDecomposition,
  distanceMatrix,
  doubleCenterDistanceMatrix,
  euclideanDistance,
} from './linalg';

/**
 * Result of dimensionality reduction.
 */
export interface EmbeddingResult {
  /** Embedded coordinates for each point */
  embedded: number[][];

  /** Explained variance ratios (for PCA) */
  explainedVariance: number[];

  /** k-nearest neighbor graph */
  neighborGraph: number[][];

  /** Geodesic distance matrix (for Isomap) */
  geodesicDistances: number[][] | null;
}

/**
 * Principal Component Analysis (PCA).
 *
 * Linear projection onto the top principal components.
 * Preserves global variance structure.
 *
 * @param points Data points (original coordinates)
 * @param targetDim Target dimension
 * @returns Embedding result
 */
export function pca(points: DataPoint[], targetDim: number): EmbeddingResult {
  const originals = points.map((p) => p.original);
  const n = originals.length;

  // Center the data
  const centered = centerMatrix(originals);

  // Compute covariance matrix
  const cov = covarianceMatrix(centered);

  // Compute top eigenvectors
  const { values, vectors } = eigenDecomposition(cov, targetDim);

  // Project onto principal components
  const embedded: number[][] = [];
  for (let i = 0; i < n; i++) {
    const proj: number[] = [];
    for (let k = 0; k < targetDim; k++) {
      let dot = 0;
      for (let j = 0; j < centered[i].length; j++) {
        dot += centered[i][j] * vectors[k][j];
      }
      proj.push(dot);
    }
    embedded.push(proj);
  }

  // Compute explained variance ratios
  const totalVar = values.reduce((a, b) => a + Math.abs(b), 0);
  const explainedVariance = values.map((v) =>
    totalVar > 0 ? Math.abs(v) / totalVar : 0
  );

  return {
    embedded,
    explainedVariance,
    neighborGraph: buildKNNGraph(originals, 10),
    geodesicDistances: null,
  };
}

/**
 * Builds k-nearest neighbor graph.
 */
function buildKNNGraph(points: number[][], k: number): number[][] {
  const n = points.length;
  const graph: number[][] = [];

  for (let i = 0; i < n; i++) {
    // Compute distances to all other points
    const distances: { idx: number; dist: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distances.push({ idx: j, dist: euclideanDistance(points[i], points[j]) });
      }
    }

    // Sort by distance and take k nearest
    distances.sort((a, b) => a.dist - b.dist);
    graph[i] = distances.slice(0, k).map((d) => d.idx);
  }

  return graph;
}

/**
 * Computes shortest paths using Floyd-Warshall algorithm.
 * Used to compute geodesic distances from the k-NN graph.
 */
function floydWarshall(D: number[][]): number[][] {
  const n = D.length;
  const dist = D.map((row) => [...row]);

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
}

/**
 * Isomap algorithm.
 *
 * Computes geodesic distances via k-NN graph, then applies MDS.
 * Preserves global geodesic structure of the manifold.
 *
 * @param points Data points (original coordinates)
 * @param targetDim Target dimension
 * @param k Number of nearest neighbors
 * @returns Embedding result
 */
export function isomap(
  points: DataPoint[],
  targetDim: number,
  k: number
): EmbeddingResult {
  const originals = points.map((p) => p.original);
  const n = originals.length;

  // Build k-NN graph
  const neighborGraph = buildKNNGraph(originals, k);

  // Initialize distance matrix with infinity
  const D: number[][] = [];
  for (let i = 0; i < n; i++) {
    D[i] = new Array(n).fill(Infinity);
    D[i][i] = 0;
  }

  // Fill in Euclidean distances for neighbors
  for (let i = 0; i < n; i++) {
    for (const j of neighborGraph[i]) {
      const dist = euclideanDistance(originals[i], originals[j]);
      D[i][j] = dist;
      D[j][i] = dist; // Symmetric
    }
  }

  // Compute geodesic distances using Floyd-Warshall
  const geodesic = floydWarshall(D);

  // Replace infinities with large finite values to prevent MDS issues
  const maxDist = Math.max(
    ...geodesic.flat().filter((d) => d < Infinity)
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (geodesic[i][j] === Infinity) {
        geodesic[i][j] = maxDist * 2;
      }
    }
  }

  // Apply classical MDS to geodesic distance matrix
  const B = doubleCenterDistanceMatrix(geodesic);

  // Eigendecomposition of B
  const { values, vectors } = eigenDecomposition(B, targetDim);

  // Compute embedding: X = V * Lambda^(1/2)
  const embedded: number[][] = [];
  for (let i = 0; i < n; i++) {
    const coords: number[] = [];
    for (let k = 0; k < targetDim; k++) {
      const lambda = Math.max(0, values[k]); // Eigenvalue may be negative due to numerical issues
      coords.push(vectors[k][i] * Math.sqrt(lambda));
    }
    embedded.push(coords);
  }

  // Compute explained variance (based on eigenvalues)
  const totalVar = values.reduce((a, b) => a + Math.max(0, b), 0);
  const explainedVariance = values.map((v) =>
    totalVar > 0 ? Math.max(0, v) / totalVar : 0
  );

  return {
    embedded,
    explainedVariance,
    neighborGraph,
    geodesicDistances: geodesic,
  };
}

/**
 * Runs the specified algorithm.
 */
export function runAlgorithm(
  algorithm: AlgorithmType,
  points: DataPoint[],
  targetDim: number,
  k: number
): EmbeddingResult {
  switch (algorithm) {
    case 'pca':
      return pca(points, targetDim);
    case 'isomap':
      return isomap(points, targetDim, k);
    default:
      return pca(points, targetDim);
  }
}

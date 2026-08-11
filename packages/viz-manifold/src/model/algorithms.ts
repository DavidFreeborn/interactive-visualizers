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
 * t-SNE (t-distributed Stochastic Neighbor Embedding).
 *
 * Simplified educational implementation.
 * Preserves local neighborhood structure using probabilistic similarities.
 *
 * @param points Data points (original coordinates)
 * @param targetDim Target dimension
 * @param perplexity Effective number of neighbors (typical: 5-50)
 * @returns Embedding result
 */
export function tsne(
  points: DataPoint[],
  targetDim: number,
  perplexity: number
): EmbeddingResult {
  const originals = points.map((p) => p.original);
  const n = originals.length;

  if (n === 0) {
    return {
      embedded: [],
      explainedVariance: [],
      neighborGraph: [],
      geodesicDistances: null,
    };
  }

  // Compute pairwise distances
  const D: number[][] = [];
  for (let i = 0; i < n; i++) {
    D[i] = [];
    for (let j = 0; j < n; j++) {
      D[i][j] = euclideanDistance(originals[i], originals[j]);
    }
  }

  // Compute affinities with binary search for sigma
  const P = computeAffinities(D, perplexity);

  // Initialize embedding with PCA
  const pcaResult = pca(points, targetDim);
  const Y = pcaResult.embedded.map((row) => [...row]);

  // Gradient descent optimization (simplified)
  const learningRate = 100;
  const momentum = 0.5;
  const iterations = 300;

  // Velocity for momentum
  const dY: number[][] = Y.map(() => new Array(targetDim).fill(0));

  for (let iter = 0; iter < iterations; iter++) {
    // Compute Q (low-dimensional affinities using t-distribution)
    const Q = computeStudentT(Y);

    // Compute gradients
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < targetDim; d++) {
        let grad = 0;
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            const pij = P[i][j];
            const qij = Q[i][j];
            const diff = Y[i][d] - Y[j][d];
            const dist = euclideanDistance(Y[i], Y[j]);
            const factor = 1 / (1 + dist * dist);
            grad += 4 * (pij - qij) * diff * factor;
          }
        }
        dY[i][d] = momentum * dY[i][d] - learningRate * grad;
        Y[i][d] += dY[i][d];
      }
    }

    // Center the solution
    for (let d = 0; d < targetDim; d++) {
      let mean = 0;
      for (let i = 0; i < n; i++) {
        mean += Y[i][d];
      }
      mean /= n;
      for (let i = 0; i < n; i++) {
        Y[i][d] -= mean;
      }
    }
  }

  return {
    embedded: Y,
    explainedVariance: [],
    neighborGraph: buildKNNGraph(originals, Math.round(perplexity)),
    geodesicDistances: null,
  };
}

/**
 * Compute affinities P with binary search for sigma to match perplexity.
 */
function computeAffinities(D: number[][], perplexity: number): number[][] {
  const n = D.length;
  const P: number[][] = [];

  for (let i = 0; i < n; i++) {
    P[i] = new Array(n).fill(0);

    // Binary search for sigma
    let sigma = 1;
    let sigmaLow = 0;
    let sigmaHigh = Infinity;
    const targetEntropy = Math.log(perplexity);

    for (let iter = 0; iter < 50; iter++) {
      // Compute probabilities
      let sumP = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          P[i][j] = Math.exp((-D[i][j] * D[i][j]) / (2 * sigma * sigma));
          sumP += P[i][j];
        }
      }

      // Normalize
      if (sumP > 0) {
        for (let j = 0; j < n; j++) {
          P[i][j] /= sumP;
        }
      }

      // Compute entropy
      let entropy = 0;
      for (let j = 0; j < n; j++) {
        if (P[i][j] > 1e-10) {
          entropy -= P[i][j] * Math.log(P[i][j]);
        }
      }

      // Adjust sigma
      if (Math.abs(entropy - targetEntropy) < 0.01) {
        break;
      }
      if (entropy > targetEntropy) {
        sigmaHigh = sigma;
        sigma = (sigma + sigmaLow) / 2;
      } else {
        sigmaLow = sigma;
        if (sigmaHigh === Infinity) {
          sigma *= 2;
        } else {
          sigma = (sigma + sigmaHigh) / 2;
        }
      }
    }
  }

  // Symmetrize
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const pij = (P[i][j] + P[j][i]) / (2 * n);
      P[i][j] = pij;
      P[j][i] = pij;
    }
  }

  return P;
}

/**
 * Compute Q using Student-t distribution (1 degree of freedom).
 */
function computeStudentT(Y: number[][]): number[][] {
  const n = Y.length;
  const Q: number[][] = [];
  let sumQ = 0;

  // Compute unnormalized Q
  for (let i = 0; i < n; i++) {
    Q[i] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const dist = euclideanDistance(Y[i], Y[j]);
        Q[i][j] = 1 / (1 + dist * dist);
        sumQ += Q[i][j];
      } else {
        Q[i][j] = 0;
      }
    }
  }

  // Normalize
  if (sumQ > 0) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Q[i][j] /= sumQ;
      }
    }
  }

  return Q;
}

/**
 * Runs the specified algorithm.
 */
export function runAlgorithm(
  algorithm: AlgorithmType,
  points: DataPoint[],
  targetDim: number,
  k: number,
  perplexity: number = 30
): EmbeddingResult {
  switch (algorithm) {
    case 'pca':
      return pca(points, targetDim);
    case 'isomap':
      return isomap(points, targetDim, k);
    case 'tsne':
      return tsne(points, targetDim, perplexity);
    default:
      return pca(points, targetDim);
  }
}

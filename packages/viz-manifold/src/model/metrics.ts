/**
 * Embedding quality metrics.
 *
 * Scientific Status: Standard toy model
 */

import type { DataPoint, ManifoldMetrics } from './types';
import { euclideanDistance } from './linalg';

/**
 * Computes k-nearest neighbors in a space.
 */
function getKNearest(
  points: number[][],
  idx: number,
  k: number
): number[] {
  const distances: { idx: number; dist: number }[] = [];
  for (let j = 0; j < points.length; j++) {
    if (j !== idx) {
      distances.push({ idx: j, dist: euclideanDistance(points[idx], points[j]) });
    }
  }
  distances.sort((a, b) => a.dist - b.dist);
  return distances.slice(0, k).map((d) => d.idx);
}

/**
 * Computes trustworthiness metric.
 *
 * Trustworthiness measures how many of the k-nearest neighbors in the
 * embedded space were also among the k-nearest in the original space.
 * High trustworthiness = few "false" neighbors added.
 *
 * T(k) = 1 - (2 / (n * k * (2n - 3k - 1))) * sum of rank errors
 *
 * @param originals Original high-dimensional coordinates
 * @param embedded Embedded low-dimensional coordinates
 * @param k Number of neighbors
 * @returns Trustworthiness score [0, 1]
 */
export function computeTrustworthiness(
  originals: number[][],
  embedded: number[][],
  k: number
): number {
  const n = originals.length;
  if (n <= k) return 1;

  // For each point, get k-nearest in both spaces
  let errorSum = 0;

  for (let i = 0; i < n; i++) {
    const origNeighbors = new Set(getKNearest(originals, i, k));
    const embNeighbors = getKNearest(embedded, i, k);

    // For each embedded neighbor not in original neighbors, compute rank error
    for (let j = 0; j < embNeighbors.length; j++) {
      const neighborIdx = embNeighbors[j];
      if (!origNeighbors.has(neighborIdx)) {
        // This is a "false" neighbor - compute its rank in original space
        const origDistances: { idx: number; dist: number }[] = [];
        for (let m = 0; m < n; m++) {
          if (m !== i) {
            origDistances.push({
              idx: m,
              dist: euclideanDistance(originals[i], originals[m]),
            });
          }
        }
        origDistances.sort((a, b) => a.dist - b.dist);
        const rank =
          origDistances.findIndex((d) => d.idx === neighborIdx) + 1;
        errorSum += Math.max(0, rank - k);
      }
    }
  }

  const normalizer = (2 * n * k * (2 * n - 3 * k - 1)) / 2;
  if (normalizer <= 0) return 1;

  return 1 - errorSum / normalizer;
}

/**
 * Computes continuity metric.
 *
 * Continuity measures how many of the k-nearest neighbors in the
 * original space are also among the k-nearest in the embedded space.
 * High continuity = few original neighbors "lost".
 *
 * @param originals Original high-dimensional coordinates
 * @param embedded Embedded low-dimensional coordinates
 * @param k Number of neighbors
 * @returns Continuity score [0, 1]
 */
export function computeContinuity(
  originals: number[][],
  embedded: number[][],
  k: number
): number {
  const n = originals.length;
  if (n <= k) return 1;

  let errorSum = 0;

  for (let i = 0; i < n; i++) {
    const embNeighbors = new Set(getKNearest(embedded, i, k));
    const origNeighbors = getKNearest(originals, i, k);

    // For each original neighbor not in embedded neighbors, compute rank error
    for (let j = 0; j < origNeighbors.length; j++) {
      const neighborIdx = origNeighbors[j];
      if (!embNeighbors.has(neighborIdx)) {
        // This neighbor was "lost" - compute its rank in embedded space
        const embDistances: { idx: number; dist: number }[] = [];
        for (let m = 0; m < n; m++) {
          if (m !== i) {
            embDistances.push({
              idx: m,
              dist: euclideanDistance(embedded[i], embedded[m]),
            });
          }
        }
        embDistances.sort((a, b) => a.dist - b.dist);
        const rank = embDistances.findIndex((d) => d.idx === neighborIdx) + 1;
        errorSum += Math.max(0, rank - k);
      }
    }
  }

  const normalizer = (2 * n * k * (2 * n - 3 * k - 1)) / 2;
  if (normalizer <= 0) return 1;

  return 1 - errorSum / normalizer;
}

/**
 * Computes mean local distortion.
 *
 * Measures how much local distances are distorted on average.
 */
export function computeMeanLocalDistortion(
  originals: number[][],
  embedded: number[][],
  k: number
): number {
  const n = originals.length;
  let totalDistortion = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    const neighbors = getKNearest(originals, i, k);

    for (const j of neighbors) {
      const origDist = euclideanDistance(originals[i], originals[j]);
      const embDist = euclideanDistance(embedded[i], embedded[j]);

      if (origDist > 0) {
        // Relative distortion
        totalDistortion += Math.abs(embDist - origDist) / origDist;
        count++;
      }
    }
  }

  return count > 0 ? totalDistortion / count : 0;
}

/**
 * Computes all embedding metrics.
 */
export function computeMetrics(
  points: DataPoint[],
  explainedVariance: number[],
  k: number
): ManifoldMetrics {
  const originals = points.map((p) => p.original);
  const embedded = points.map((p) => p.embedded);

  // Use smaller k for metric computation to avoid issues with small datasets
  const effectiveK = Math.min(k, Math.floor(points.length / 4), 10);

  return {
    trustworthiness: computeTrustworthiness(originals, embedded, effectiveK),
    continuity: computeContinuity(originals, embedded, effectiveK),
    explainedVariance: explainedVariance.reduce((a, b) => a + b, 0),
    meanLocalDistortion: computeMeanLocalDistortion(originals, embedded, effectiveK),
  };
}

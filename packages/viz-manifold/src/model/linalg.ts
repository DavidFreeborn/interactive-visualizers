/**
 * Linear algebra utilities for manifold learning.
 *
 * Simplified implementations for educational visualization.
 * For production use, a proper linear algebra library would be preferred.
 */

/**
 * Computes the mean of each column in a matrix.
 */
export function columnMeans(matrix: number[][]): number[] {
  const n = matrix.length;
  if (n === 0) return [];
  const d = matrix[0].length;

  const means = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      means[j] += matrix[i][j];
    }
  }
  return means.map((m) => m / n);
}

/**
 * Centers a matrix by subtracting column means.
 */
export function centerMatrix(matrix: number[][]): number[][] {
  const means = columnMeans(matrix);
  return matrix.map((row) => row.map((val, j) => val - means[j]));
}

/**
 * Computes the covariance matrix of a centered data matrix.
 */
export function covarianceMatrix(centered: number[][]): number[][] {
  const n = centered.length;
  const d = centered[0]?.length ?? 0;

  const cov: number[][] = [];
  for (let i = 0; i < d; i++) {
    cov[i] = [];
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      cov[i][j] = sum / (n - 1);
    }
  }
  return cov;
}

/**
 * Computes eigenvalues and eigenvectors using power iteration.
 * This is a simplified implementation; for large matrices, use a proper library.
 *
 * @param matrix Symmetric matrix
 * @param numEigs Number of eigenvalues/vectors to compute
 * @param maxIter Maximum iterations per eigenvalue
 * @returns Object with eigenvalues and eigenvectors
 */
export function eigenDecomposition(
  matrix: number[][],
  numEigs: number,
  maxIter: number = 100
): { values: number[]; vectors: number[][] } {
  const n = matrix.length;
  const values: number[] = [];
  const vectors: number[][] = [];

  // Work with a copy to deflate
  const A = matrix.map((row) => [...row]);

  for (let e = 0; e < numEigs; e++) {
    // Random initial vector
    let v = new Array(n).fill(0).map(() => Math.random() - 0.5);
    let eigenvalue = 0;

    // Power iteration
    for (let iter = 0; iter < maxIter; iter++) {
      // Multiply: Av
      const Av = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          Av[i] += A[i][j] * v[j];
        }
      }

      // Compute eigenvalue (Rayleigh quotient)
      let vAv = 0;
      let vv = 0;
      for (let i = 0; i < n; i++) {
        vAv += v[i] * Av[i];
        vv += v[i] * v[i];
      }
      eigenvalue = vAv / vv;

      // Normalize Av
      let norm = 0;
      for (let i = 0; i < n; i++) {
        norm += Av[i] * Av[i];
      }
      norm = Math.sqrt(norm);
      if (norm < 1e-10) break;

      v = Av.map((x) => x / norm);
    }

    values.push(eigenvalue);
    vectors.push(v);

    // Deflate: A = A - eigenvalue * v * v^T
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        A[i][j] -= eigenvalue * v[i] * v[j];
      }
    }
  }

  return { values, vectors };
}

/**
 * Matrix multiplication.
 */
export function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B[0]?.length ?? 0;
  const k = A[0]?.length ?? 0;

  const result: number[][] = [];
  for (let i = 0; i < m; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let l = 0; l < k; l++) {
        sum += A[i][l] * B[l][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Transpose a matrix.
 */
export function transpose(matrix: number[][]): number[][] {
  const m = matrix.length;
  const n = matrix[0]?.length ?? 0;
  const result: number[][] = [];
  for (let j = 0; j < n; j++) {
    result[j] = [];
    for (let i = 0; i < m; i++) {
      result[j][i] = matrix[i][j];
    }
  }
  return result;
}

/**
 * Computes Euclidean distance between two points.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Computes the distance matrix for a set of points.
 */
export function distanceMatrix(points: number[][]): number[][] {
  const n = points.length;
  const D: number[][] = [];
  for (let i = 0; i < n; i++) {
    D[i] = [];
    for (let j = 0; j < n; j++) {
      D[i][j] = euclideanDistance(points[i], points[j]);
    }
  }
  return D;
}

/**
 * Double-centers a distance matrix for MDS.
 * B = -0.5 * J * D^2 * J where J = I - (1/n)*1*1^T
 */
export function doubleCenterDistanceMatrix(D: number[][]): number[][] {
  const n = D.length;
  const D2: number[][] = D.map((row) => row.map((d) => d * d));

  // Row and column means
  const rowMeans: number[] = D2.map((row) =>
    row.reduce((a, b) => a + b, 0) / n
  );
  const colMeans: number[] = [];
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += D2[i][j];
    }
    colMeans.push(sum / n);
  }
  const grandMean = rowMeans.reduce((a, b) => a + b, 0) / n;

  // Double centering
  const B: number[][] = [];
  for (let i = 0; i < n; i++) {
    B[i] = [];
    for (let j = 0; j < n; j++) {
      B[i][j] = -0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + grandMean);
    }
  }
  return B;
}

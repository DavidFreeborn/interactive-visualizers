/**
 * Dataset generators for manifold learning visualization.
 *
 * Scientific Status: Standard toy model
 * These are standard synthetic datasets used in dimensionality reduction literature.
 */

import { SeededRandom } from '@viz/core-math';
import type { DataPoint, DatasetType } from './types';

/**
 * Generates a Swiss roll dataset.
 *
 * The Swiss roll is a classic test case for nonlinear dimensionality reduction.
 * Points lie on a 2D manifold embedded in 3D by "rolling" it up.
 *
 * @param n Number of points
 * @param noise Standard deviation of Gaussian noise
 * @param rng Seeded random number generator
 * @returns Array of data points
 */
export function generateSwissRoll(
  n: number,
  noise: number,
  rng: SeededRandom
): DataPoint[] {
  const points: DataPoint[] = [];

  for (let i = 0; i < n; i++) {
    // Parameter t controls position along the spiral (1.5pi to 4.5pi)
    const t = 1.5 * Math.PI + 3 * Math.PI * rng.random();
    // Height along the roll
    const h = 21 * rng.random();

    // Swiss roll coordinates
    const x = t * Math.cos(t) + noise * (rng.random() - 0.5);
    const y = h + noise * (rng.random() - 0.5);
    const z = t * Math.sin(t) + noise * (rng.random() - 0.5);

    // Normalize parameter to [0, 1] for coloring
    const param = (t - 1.5 * Math.PI) / (3 * Math.PI);

    points.push({
      original: [x, y, z],
      embedded: [0, 0], // Will be filled by embedding algorithm
      param,
    });
  }

  return points;
}

/**
 * Generates an S-curve dataset.
 *
 * The S-curve is another classic 2D manifold in 3D, shaped like the letter S.
 *
 * @param n Number of points
 * @param noise Standard deviation of Gaussian noise
 * @param rng Seeded random number generator
 * @returns Array of data points
 */
export function generateSCurve(
  n: number,
  noise: number,
  rng: SeededRandom
): DataPoint[] {
  const points: DataPoint[] = [];

  for (let i = 0; i < n; i++) {
    // Parameter t controls position along the S (-pi to pi)
    const t = 3 * Math.PI * (rng.random() - 0.5);
    // Height along the curve
    const h = 2 * rng.random();

    // S-curve coordinates
    const x = Math.sin(t) + noise * (rng.random() - 0.5);
    const y = h + noise * (rng.random() - 0.5);
    const z = Math.sign(t) * (Math.cos(t) - 1) + noise * (rng.random() - 0.5);

    // Normalize parameter to [0, 1] for coloring
    const param = (t + 1.5 * Math.PI) / (3 * Math.PI);

    points.push({
      original: [x, y, z],
      embedded: [0, 0],
      param,
    });
  }

  return points;
}

/**
 * Generates concentric circles dataset.
 *
 * Two concentric circles in 2D embedded in 3D.
 * Tests whether algorithms can separate distinct manifold components.
 *
 * @param n Number of points
 * @param noise Standard deviation of Gaussian noise
 * @param rng Seeded random number generator
 * @returns Array of data points
 */
export function generateCircles(
  n: number,
  noise: number,
  rng: SeededRandom
): DataPoint[] {
  const points: DataPoint[] = [];
  const innerRadius = 1;
  const outerRadius = 2;

  for (let i = 0; i < n; i++) {
    const isOuter = i < n / 2;
    const radius = isOuter ? outerRadius : innerRadius;
    const theta = 2 * Math.PI * rng.random();

    const x = radius * Math.cos(theta) + noise * (rng.random() - 0.5);
    const y = radius * Math.sin(theta) + noise * (rng.random() - 0.5);
    const z = 0.1 * (rng.random() - 0.5); // Small Z variation

    // Param encodes circle membership and position
    const param = isOuter ? 0.75 : 0.25;

    points.push({
      original: [x, y, z],
      embedded: [0, 0],
      param,
    });
  }

  return points;
}

/**
 * Generates a dataset of the specified type.
 */
export function generateDataset(
  type: DatasetType,
  n: number,
  noise: number,
  rng: SeededRandom
): DataPoint[] {
  switch (type) {
    case 'swiss-roll':
      return generateSwissRoll(n, noise, rng);
    case 's-curve':
      return generateSCurve(n, noise, rng);
    case 'circles':
      return generateCircles(n, noise, rng);
    default:
      return generateSwissRoll(n, noise, rng);
  }
}

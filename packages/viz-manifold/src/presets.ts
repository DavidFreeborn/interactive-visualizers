/**
 * Curated presets for the Manifold Learning visualizer.
 */

import type { ManifoldConfig } from './model/types';

export interface Preset {
  name: string;
  description: string;
  config: Partial<ManifoldConfig>;
}

export const PRESETS: Preset[] = [
  {
    name: 'Swiss Roll - Isomap',
    description:
      'Classic Swiss roll dataset with Isomap. Shows successful unfolding of nonlinear manifold.',
    config: {
      dataset: 'swiss-roll',
      numSamples: 500,
      noise: 0.5,
      algorithm: 'isomap',
      numNeighbors: 12,
      targetDim: 2,
      seed: 12345,
    },
  },
  {
    name: 'Swiss Roll - PCA',
    description:
      'Swiss roll with PCA. Demonstrates failure of linear methods on nonlinear data.',
    config: {
      dataset: 'swiss-roll',
      numSamples: 500,
      noise: 0.5,
      algorithm: 'pca',
      numNeighbors: 12,
      targetDim: 2,
      seed: 12345,
    },
  },
  {
    name: 'S-Curve - Isomap',
    description:
      'S-curve dataset with Isomap. Another nonlinear manifold test.',
    config: {
      dataset: 's-curve',
      numSamples: 500,
      noise: 0.5,
      algorithm: 'isomap',
      numNeighbors: 10,
      targetDim: 2,
      seed: 42,
    },
  },
  {
    name: 'Circles - PCA',
    description:
      'Concentric circles with PCA. Works well since circles are approximately linear in 2D.',
    config: {
      dataset: 'circles',
      numSamples: 300,
      noise: 0.1,
      algorithm: 'pca',
      numNeighbors: 8,
      targetDim: 2,
      seed: 99,
    },
  },
];

/**
 * Gets a preset by name.
 */
export function getPreset(name: string): Preset | undefined {
  return PRESETS.find((p) => p.name === name);
}

/**
 * Gets the default preset.
 */
export function getDefaultPreset(): Preset {
  return PRESETS[0];
}

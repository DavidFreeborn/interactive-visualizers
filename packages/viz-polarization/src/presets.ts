/**
 * Curated presets for the Factionalization & Polarization visualizer.
 */

import type { PolarizationConfig } from './model/types';

export interface Preset {
  name: string;
  description: string;
  config: Partial<PolarizationConfig>;
}

export const PRESETS: Preset[] = [
  {
    name: 'Collider - Divergence',
    description:
      'Classic collider network where agents diverge due to explaining away.',
    config: {
      networkType: 'collider',
      numAgents: 2,
      numTimesteps: 20,
      likelihoodRatio: 0.65,
      seed: 12345,
    },
  },
  {
    name: 'Chain - Convergence',
    description:
      'Chain network where agents typically converge over time.',
    config: {
      networkType: 'chain',
      numAgents: 2,
      numTimesteps: 20,
      likelihoodRatio: 0.65,
      seed: 12345,
    },
  },
  {
    name: 'Strong Evidence',
    description:
      'Collider with high likelihood ratio for stronger updates.',
    config: {
      networkType: 'collider',
      numAgents: 2,
      numTimesteps: 20,
      likelihoodRatio: 0.85,
      seed: 42,
    },
  },
  {
    name: 'Extended Run',
    description:
      'Longer simulation to observe equilibrium behavior.',
    config: {
      networkType: 'collider',
      numAgents: 2,
      numTimesteps: 50,
      likelihoodRatio: 0.65,
      seed: 99,
    },
  },
];

export function getPreset(name: string): Preset | undefined {
  return PRESETS.find((p) => p.name === name);
}

export function getDefaultPreset(): Preset {
  return PRESETS[0];
}

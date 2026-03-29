/**
 * Presets for the Zollman Effect visualizer.
 */

import type { ZollmanConfig } from './model/types';

export interface Preset {
  name: string;
  description: string;
  config: Partial<ZollmanConfig>;
}

export const PRESETS: Preset[] = [
  {
    name: 'Cycle - Standard',
    description: 'Cycle network with 6 agents. Shows slower but more reliable convergence.',
    config: {
      topology: 'cycle',
      numAgents: 6,
      epsilon: 0.05,
      testsPerRound: 10,
      priorBelief: 0.5,
      seed: 12345,
    },
  },
  {
    name: 'Complete - Fast',
    description: 'Complete network with 6 agents. Fast convergence, risk of lock-in.',
    config: {
      topology: 'complete',
      numAgents: 6,
      epsilon: 0.05,
      testsPerRound: 10,
      priorBelief: 0.5,
      seed: 12345,
    },
  },
  {
    name: 'Large Epsilon',
    description: 'Larger arm difference makes truth easier to find.',
    config: {
      topology: 'cycle',
      numAgents: 6,
      epsilon: 0.15,
      testsPerRound: 10,
      priorBelief: 0.5,
      seed: 42,
    },
  },
  {
    name: 'Lock-in Demo',
    description: 'Complete network with parameters tuned to show lock-in risk.',
    config: {
      topology: 'complete',
      numAgents: 6,
      epsilon: 0.03,
      testsPerRound: 5,
      priorBelief: 0.5,
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

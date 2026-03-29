/**
 * Curated presets for the Signaling Games visualizer.
 */

import type { SignalingGameConfig } from './model/types';

export interface Preset {
  name: string;
  description: string;
  config: Partial<SignalingGameConfig>;
}

export const PRESETS: Preset[] = [
  {
    name: 'Standard 4x4x4',
    description:
      'The standard two-sender game with 4 states, 4 acts, and 2 messages per sender. Signal replacement at turn 50,000.',
    config: {
      numStates: 4,
      numSenders: 2,
      messagesPerSender: 2,
      initialReinforcement: 1,
      replacementTurn: 50000,
      receiverType: 'traditional',
      seed: 12345,
    },
  },
  {
    name: 'Quick Demo',
    description:
      'Faster convergence for demonstration. Replacement at turn 5,000.',
    config: {
      numStates: 4,
      numSenders: 2,
      messagesPerSender: 2,
      initialReinforcement: 1,
      replacementTurn: 5000,
      receiverType: 'traditional',
      seed: 42,
    },
  },
  {
    name: 'No Replacement',
    description:
      'Standard game without signal replacement. Shows pure learning dynamics.',
    config: {
      numStates: 4,
      numSenders: 2,
      messagesPerSender: 2,
      initialReinforcement: 1,
      replacementTurn: 0,
      receiverType: 'traditional',
      seed: 12345,
    },
  },
  {
    name: 'Alternate Seed',
    description:
      'Standard 4x4x4 game with a different random seed for comparison.',
    config: {
      numStates: 4,
      numSenders: 2,
      messagesPerSender: 2,
      initialReinforcement: 1,
      replacementTurn: 10000,
      receiverType: 'traditional',
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

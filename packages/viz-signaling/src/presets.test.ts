/**
 * Tests for presets.
 */

import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset, getDefaultPreset } from './presets';
import { validateConfig, createInitialState } from './model/SignalingGameModel';
import type { SignalingGameConfig } from './model/types';

describe('presets', () => {
  it('has at least one preset', () => {
    expect(PRESETS.length).toBeGreaterThan(0);
  });

  it('all presets have valid configs', () => {
    const defaultConfig: SignalingGameConfig = {
      numStates: 4,
      numSenders: 2,
      messagesPerSender: 2,
      initialReinforcement: 1,
      replacementTurn: 0,
      receiverType: 'traditional',
      seed: 12345,
    };

    for (const preset of PRESETS) {
      const fullConfig = { ...defaultConfig, ...preset.config };
      const error = validateConfig(fullConfig);
      expect(error, `Preset "${preset.name}" has invalid config: ${error}`).toBeNull();
    }
  });

  it('all presets can initialize valid states', () => {
    const defaultConfig: SignalingGameConfig = {
      numStates: 4,
      numSenders: 2,
      messagesPerSender: 2,
      initialReinforcement: 1,
      replacementTurn: 0,
      receiverType: 'traditional',
      seed: 12345,
    };

    for (const preset of PRESETS) {
      const fullConfig = { ...defaultConfig, ...preset.config };
      const state = createInitialState(fullConfig);

      expect(state.turn).toBe(0);
      expect(state.senderUrns.length).toBe(fullConfig.numSenders);
      expect(state.receiverUrns.length).toBe(
        fullConfig.messagesPerSender ** fullConfig.numSenders
      );
    }
  });

  it('getPreset returns preset by name', () => {
    const preset = getPreset('Standard 4x4x4');
    expect(preset).toBeDefined();
    expect(preset?.name).toBe('Standard 4x4x4');
  });

  it('getPreset returns undefined for non-existent name', () => {
    const preset = getPreset('Non-Existent Preset');
    expect(preset).toBeUndefined();
  });

  it('getDefaultPreset returns first preset', () => {
    const defaultPreset = getDefaultPreset();
    expect(defaultPreset).toBe(PRESETS[0]);
  });

  it('all presets have required fields', () => {
    for (const preset of PRESETS) {
      expect(preset.name).toBeDefined();
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description).toBeDefined();
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.config).toBeDefined();
    }
  });

  it('preset names are unique', () => {
    const names = PRESETS.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

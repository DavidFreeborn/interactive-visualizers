/**
 * Tests for presets.
 */

import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@viz/core-math';
import { PRESETS, getPreset, getDefaultPreset } from './presets';
import { validateConfig, createInitialState, DEFAULT_CONFIG } from './model/PolarizationModel';

describe('presets', () => {
  it('has at least one preset', () => {
    expect(PRESETS.length).toBeGreaterThan(0);
  });

  it('all presets have valid configs', () => {
    for (const preset of PRESETS) {
      const fullConfig = { ...DEFAULT_CONFIG, ...preset.config };
      const error = validateConfig(fullConfig);
      expect(error, `Preset "${preset.name}" has invalid config: ${error}`).toBeNull();
    }
  });

  it('all presets can initialize valid states', () => {
    for (const preset of PRESETS) {
      const fullConfig = { ...DEFAULT_CONFIG, ...preset.config };
      const rng = new SeededRandom(fullConfig.seed);
      const state = createInitialState(fullConfig, rng);

      expect(state.agents.length).toBe(fullConfig.numAgents);
      expect(state.timestep).toBe(0);
    }
  });

  it('getPreset returns preset by name', () => {
    const preset = getPreset('Collider - Divergence');
    expect(preset).toBeDefined();
    expect(preset?.name).toBe('Collider - Divergence');
  });

  it('getPreset returns undefined for non-existent name', () => {
    const preset = getPreset('Non-Existent Preset');
    expect(preset).toBeUndefined();
  });

  it('getDefaultPreset returns first preset', () => {
    const defaultPreset = getDefaultPreset();
    expect(defaultPreset).toBe(PRESETS[0]);
  });

  it('preset names are unique', () => {
    const names = PRESETS.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

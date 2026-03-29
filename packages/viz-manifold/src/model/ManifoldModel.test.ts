/**
 * Tests for the Manifold Learning model.
 */

import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@viz/core-math';
import {
  ManifoldModel,
  DEFAULT_CONFIG,
  validateConfig,
  createInitialState,
  runEmbedding,
} from './ManifoldModel';
import { generateSwissRoll, generateSCurve, generateCircles } from './datasets';
import { pca, isomap } from './algorithms';
import {
  computeTrustworthiness,
  computeContinuity,
  computeMeanLocalDistortion,
} from './metrics';

describe('ManifoldModel', () => {
  describe('validateConfig', () => {
    it('accepts valid default config', () => {
      expect(validateConfig(DEFAULT_CONFIG)).toBeNull();
    });

    it('rejects invalid numSamples', () => {
      const config = { ...DEFAULT_CONFIG, numSamples: 5 };
      expect(validateConfig(config)).toContain('numSamples');
    });

    it('rejects numNeighbors >= numSamples', () => {
      const config = { ...DEFAULT_CONFIG, numSamples: 10, numNeighbors: 15 };
      expect(validateConfig(config)).toContain('numNeighbors');
    });

    it('rejects invalid targetDim', () => {
      const config = { ...DEFAULT_CONFIG, targetDim: 5 };
      expect(validateConfig(config)).toContain('targetDim');
    });
  });

  describe('datasets', () => {
    it('generates swiss roll with correct number of points', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(100, 0.1, rng);
      expect(points.length).toBe(100);
    });

    it('swiss roll points have 3D coordinates', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(100, 0.1, rng);
      points.forEach((p) => {
        expect(p.original.length).toBe(3);
      });
    });

    it('swiss roll params are in [0, 1]', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(100, 0.1, rng);
      points.forEach((p) => {
        expect(p.param).toBeGreaterThanOrEqual(0);
        expect(p.param).toBeLessThanOrEqual(1);
      });
    });

    it('generates s-curve correctly', () => {
      const rng = new SeededRandom(42);
      const points = generateSCurve(100, 0.1, rng);
      expect(points.length).toBe(100);
      points.forEach((p) => {
        expect(p.original.length).toBe(3);
      });
    });

    it('generates circles correctly', () => {
      const rng = new SeededRandom(42);
      const points = generateCircles(100, 0.1, rng);
      expect(points.length).toBe(100);
    });
  });

  describe('PCA', () => {
    it('projects to correct dimension', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(50, 0.1, rng);
      const result = pca(points, 2);
      expect(result.embedded.length).toBe(50);
      result.embedded.forEach((e) => {
        expect(e.length).toBe(2);
      });
    });

    it('explained variance ratios sum to <= 1', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(50, 0.1, rng);
      const result = pca(points, 2);
      const sum = result.explainedVariance.reduce((a, b) => a + b, 0);
      expect(sum).toBeLessThanOrEqual(1.01); // Allow small numerical error
    });
  });

  describe('Isomap', () => {
    it('projects to correct dimension', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(50, 0.1, rng);
      const result = isomap(points, 2, 8);
      expect(result.embedded.length).toBe(50);
      result.embedded.forEach((e) => {
        expect(e.length).toBe(2);
      });
    });

    it('builds neighbor graph', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(50, 0.1, rng);
      const result = isomap(points, 2, 8);
      expect(result.neighborGraph.length).toBe(50);
      result.neighborGraph.forEach((neighbors) => {
        expect(neighbors.length).toBe(8);
      });
    });

    it('computes geodesic distances', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(30, 0.1, rng);
      const result = isomap(points, 2, 6);
      expect(result.geodesicDistances).not.toBeNull();
      expect(result.geodesicDistances!.length).toBe(30);
    });
  });

  describe('metrics', () => {
    it('trustworthiness is in [0, 1]', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(30, 0.1, rng);
      const result = isomap(points, 2, 6);
      const originals = points.map((p) => p.original);
      const trust = computeTrustworthiness(originals, result.embedded, 5);
      expect(trust).toBeGreaterThanOrEqual(0);
      expect(trust).toBeLessThanOrEqual(1);
    });

    it('continuity is in [0, 1]', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(30, 0.1, rng);
      const result = isomap(points, 2, 6);
      const originals = points.map((p) => p.original);
      const cont = computeContinuity(originals, result.embedded, 5);
      expect(cont).toBeGreaterThanOrEqual(0);
      expect(cont).toBeLessThanOrEqual(1);
    });

    it('local distortion is non-negative', () => {
      const rng = new SeededRandom(42);
      const points = generateSwissRoll(30, 0.1, rng);
      const result = isomap(points, 2, 6);
      const originals = points.map((p) => p.original);
      const distortion = computeMeanLocalDistortion(originals, result.embedded, 5);
      expect(distortion).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deterministic reproducibility', () => {
    it('produces identical results with same seed', () => {
      const config = DEFAULT_CONFIG;

      // Run 1
      const rng1 = new SeededRandom(42);
      const state1 = createInitialState(config, rng1);
      const embedded1 = runEmbedding(state1, config);

      // Run 2
      const rng2 = new SeededRandom(42);
      const state2 = createInitialState(config, rng2);
      const embedded2 = runEmbedding(state2, config);

      // Original points should match
      expect(state1.points.length).toBe(state2.points.length);
      for (let i = 0; i < state1.points.length; i++) {
        expect(state1.points[i].original).toEqual(state2.points[i].original);
      }
    });

    it('produces different results with different seeds', () => {
      const config = DEFAULT_CONFIG;

      const rng1 = new SeededRandom(42);
      const state1 = createInitialState(config, rng1);

      const rng2 = new SeededRandom(999);
      const state2 = createInitialState(config, rng2);

      // At least some coordinates should differ
      let allMatch = true;
      for (let i = 0; i < Math.min(10, state1.points.length); i++) {
        if (state1.points[i].original[0] !== state2.points[i].original[0]) {
          allMatch = false;
          break;
        }
      }
      expect(allMatch).toBe(false);
    });
  });

  describe('initial state', () => {
    it('creates state with correct structure', () => {
      const config = DEFAULT_CONFIG;
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);

      expect(state.points.length).toBe(config.numSamples);
      expect(state.isEmbedded).toBe(false);
      expect(state.neighborGraph).toEqual([]);
      expect(state.geodesicDistances).toBeNull();
    });

    it('embedding updates state correctly', () => {
      const config = DEFAULT_CONFIG;
      const rng = new SeededRandom(42);
      const state = createInitialState(config, rng);
      const embedded = runEmbedding(state, config);

      expect(embedded.isEmbedded).toBe(true);
      expect(embedded.neighborGraph.length).toBe(config.numSamples);
      embedded.points.forEach((p) => {
        expect(p.embedded.length).toBe(config.targetDim);
      });
    });
  });
});

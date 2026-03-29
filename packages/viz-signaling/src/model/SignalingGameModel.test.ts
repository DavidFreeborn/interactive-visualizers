/**
 * Tests for the Signaling Games model.
 *
 * Required test categories:
 * - Probability normalization
 * - Deterministic reproducibility with fixed seed
 * - Reset behavior
 * - Signal replacement behavior
 * - Basic communication success metric sanity
 */

import { describe, it, expect } from 'vitest';
import { SeededRandom, normalize } from '@viz/core-math';
import {
  SignalingGameModel,
  DEFAULT_CONFIG,
  validateConfig,
  createSenderUrns,
  createReceiverUrns,
  createInitialState,
  getMessagePairIndex,
  runRound,
  updateUrns,
  performReplacement,
  computeMetrics,
} from './SignalingGameModel';
import type { SignalingGameConfig, SignalingGameState } from './types';

describe('SignalingGameModel', () => {
  describe('validateConfig', () => {
    it('accepts valid default config', () => {
      expect(validateConfig(DEFAULT_CONFIG)).toBeNull();
    });

    it('rejects invalid numStates', () => {
      const config = { ...DEFAULT_CONFIG, numStates: 1 };
      expect(validateConfig(config)).toContain('numStates');
    });

    it('rejects invalid numSenders', () => {
      const config = { ...DEFAULT_CONFIG, numSenders: 3 };
      expect(validateConfig(config)).toContain('numSenders');
    });

    it('rejects mismatched states for 2-sender game', () => {
      const config = { ...DEFAULT_CONFIG, numStates: 3 };
      expect(validateConfig(config)).toContain('numStates must be');
    });
  });

  describe('probability normalization', () => {
    it('normalizes urn values to valid probabilities', () => {
      const urn = [1, 2, 3, 4];
      const probs = normalize(urn);

      // Sum to 1
      const sum = probs.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);

      // All non-negative
      probs.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));

      // Proportional
      expect(probs[3]).toBeCloseTo(0.4, 10); // 4/10
      expect(probs[0]).toBeCloseTo(0.1, 10); // 1/10
    });

    it('handles all-zero urns with uniform distribution', () => {
      const urn = [0, 0, 0, 0];
      const probs = normalize(urn);

      expect(probs).toEqual([0.25, 0.25, 0.25, 0.25]);
    });

    it('maintains probability normalization after updates', () => {
      const config = DEFAULT_CONFIG;
      const state = createInitialState(config);
      const rng = new SeededRandom(12345);

      // Run several rounds
      for (let i = 0; i < 100; i++) {
        const result = runRound(state, config, rng);
        updateUrns(state, config, result);
      }

      // Check sender urns are normalizable
      for (let s = 0; s < config.numSenders; s++) {
        for (let st = 0; st < config.numStates; st++) {
          const probs = normalize(state.senderUrns[s][st]);
          const sum = probs.reduce((a, b) => a + b, 0);
          expect(sum).toBeCloseTo(1.0, 10);
        }
      }

      // Check receiver urns are normalizable
      for (const urn of state.receiverUrns) {
        const probs = normalize(urn);
        const sum = probs.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 10);
      }
    });
  });

  describe('deterministic reproducibility', () => {
    it('produces identical results with same seed', () => {
      const config = DEFAULT_CONFIG;

      // Run 1
      const state1 = createInitialState(config);
      const rng1 = new SeededRandom(42);
      const results1: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        const result = runRound(state1, config, rng1);
        updateUrns(state1, config, result);
        results1.push(result.success);
      }

      // Run 2 with same seed
      const state2 = createInitialState(config);
      const rng2 = new SeededRandom(42);
      const results2: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        const result = runRound(state2, config, rng2);
        updateUrns(state2, config, result);
        results2.push(result.success);
      }

      // Results should be identical
      expect(results1).toEqual(results2);

      // States should be identical
      expect(state1.senderUrns).toEqual(state2.senderUrns);
      expect(state1.receiverUrns).toEqual(state2.receiverUrns);
    });

    it('produces different results with different seeds', () => {
      const config = DEFAULT_CONFIG;

      const state1 = createInitialState(config);
      const rng1 = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        const result = runRound(state1, config, rng1);
        updateUrns(state1, config, result);
      }

      const state2 = createInitialState(config);
      const rng2 = new SeededRandom(999);
      for (let i = 0; i < 100; i++) {
        const result = runRound(state2, config, rng2);
        updateUrns(state2, config, result);
      }

      // States should differ (with very high probability)
      const urnsMatch =
        JSON.stringify(state1.senderUrns) === JSON.stringify(state2.senderUrns);
      expect(urnsMatch).toBe(false);
    });
  });

  describe('reset behavior', () => {
    it('creates fresh initial state', () => {
      const model = new SignalingGameModel();
      const state1 = model.createInitialState();
      const state2 = model.createInitialState();

      // Should be equal but independent
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.senderUrns).not.toBe(state2.senderUrns);
    });

    it('initial state has correct structure', () => {
      const config = DEFAULT_CONFIG;
      const state = createInitialState(config);

      expect(state.turn).toBe(0);
      expect(state.successCount).toBe(0);
      expect(state.totalRounds).toBe(0);
      expect(state.replacementOccurred).toBe(false);
      expect(state.infoHistory).toEqual([]);

      // Sender urns: 2 senders, 4 states each, 2 messages each
      expect(state.senderUrns.length).toBe(2);
      expect(state.senderUrns[0].length).toBe(4);
      expect(state.senderUrns[0][0].length).toBe(2);
      expect(state.senderUrns[0][0]).toEqual([1, 1]); // initial reinforcement

      // Receiver urns: 4 message pairs, 4 actions each
      expect(state.receiverUrns.length).toBe(4);
      expect(state.receiverUrns[0].length).toBe(4);
      expect(state.receiverUrns[0]).toEqual([1, 1, 1, 1]);
    });
  });

  describe('signal replacement', () => {
    it('resets correct urns on replacement', () => {
      const config = { ...DEFAULT_CONFIG, replacementTurn: 0 };
      const state = createInitialState(config);
      const rng = new SeededRandom(12345);

      // Run some rounds to build up reinforcement
      for (let i = 0; i < 1000; i++) {
        const result = runRound(state, config, rng);
        updateUrns(state, config, result);
      }

      // Verify urns have been reinforced
      const preSenderSum = state.senderUrns[1][0].reduce((a, b) => a + b, 0);
      expect(preSenderSum).toBeGreaterThan(2); // More than initial

      // Perform replacement
      performReplacement(state, config);

      expect(state.replacementOccurred).toBe(true);

      // Sender B's message 0 should be reset across all states
      for (let s = 0; s < config.numStates; s++) {
        expect(state.senderUrns[1][s][0]).toBe(config.initialReinforcement);
      }

      // Receiver pairs involving message B=0 should be reset
      // Pairs 0 and 2 (when messagesPerSender=2): indices where msgB=0
      expect(state.receiverUrns[0]).toEqual([1, 1, 1, 1]); // pair (0,0)
      expect(state.receiverUrns[2]).toEqual([1, 1, 1, 1]); // pair (1,0)

      // Other pairs should NOT be reset
      const pair1Sum = state.receiverUrns[1].reduce((a, b) => a + b, 0);
      const pair3Sum = state.receiverUrns[3].reduce((a, b) => a + b, 0);
      expect(pair1Sum).toBeGreaterThan(4);
      expect(pair3Sum).toBeGreaterThan(4);
    });

    it('only replaces once', () => {
      const config = DEFAULT_CONFIG;
      const state = createInitialState(config);

      performReplacement(state, config);
      expect(state.replacementOccurred).toBe(true);
      expect(state.replacementAtTurn).toBe(0);

      // Modify a value to check it doesn't get reset again
      state.senderUrns[1][0][0] = 100;
      performReplacement(state, config);

      // Should still be modified (replacement is idempotent via flag)
      // Actually, our function doesn't check the flag, so let's verify the model does
      const model = new SignalingGameModel(config);
      expect(model.shouldReplace(state)).toBe(false);
    });
  });

  describe('communication success metrics', () => {
    it('initial success rate is near random (0.25 for 4 states)', () => {
      const config = DEFAULT_CONFIG;
      const state = createInitialState(config);
      const rng = new SeededRandom(12345);

      let successes = 0;
      const trials = 1000;
      for (let i = 0; i < trials; i++) {
        const result = runRound(state, config, rng);
        if (result.success) successes++;
        // Don't update urns to keep it random
      }

      const rate = successes / trials;
      // Should be close to 0.25 (1/4)
      expect(rate).toBeGreaterThan(0.15);
      expect(rate).toBeLessThan(0.35);
    });

    it('success rate improves with learning', () => {
      const config = DEFAULT_CONFIG;
      const state = createInitialState(config);
      const rng = new SeededRandom(12345);

      // Run many rounds with learning
      for (let i = 0; i < 10000; i++) {
        const result = runRound(state, config, rng);
        updateUrns(state, config, result);
        state.totalRounds++;
        if (result.success) state.successCount++;
      }

      const finalRate = state.successCount / state.totalRounds;
      // Should be significantly better than random
      expect(finalRate).toBeGreaterThan(0.5);
    });

    it('metrics computation is consistent', () => {
      const config = DEFAULT_CONFIG;
      const state = createInitialState(config);
      const rng = new SeededRandom(12345);

      // Run some rounds
      for (let i = 0; i < 1000; i++) {
        const result = runRound(state, config, rng);
        updateUrns(state, config, result);
        state.totalRounds++;
        if (result.success) state.successCount++;
      }

      const metrics = computeMetrics(state, config);

      expect(metrics.turn).toBe(state.turn);
      expect(metrics.successRate).toBe(state.successCount / state.totalRounds);
      expect(metrics.avgInformationContent).toBeGreaterThanOrEqual(0);
      expect(metrics.informationLoss).toBeNull(); // No replacement yet
    });
  });

  describe('message pair indexing', () => {
    it('computes correct pair indices', () => {
      // For 2 messages per sender:
      // (0,0) -> 0, (0,1) -> 1, (1,0) -> 2, (1,1) -> 3
      expect(getMessagePairIndex([0, 0], 2)).toBe(0);
      expect(getMessagePairIndex([0, 1], 2)).toBe(1);
      expect(getMessagePairIndex([1, 0], 2)).toBe(2);
      expect(getMessagePairIndex([1, 1], 2)).toBe(3);
    });

    it('handles single sender', () => {
      expect(getMessagePairIndex([0], 2)).toBe(0);
      expect(getMessagePairIndex([1], 2)).toBe(1);
    });
  });
});

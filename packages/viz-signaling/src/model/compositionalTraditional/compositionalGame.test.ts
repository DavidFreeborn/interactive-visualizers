import { describe, expect, it } from 'vitest';
import { SeededPrng } from '../prng';
import {
  createInitialCompositionalTraditionalState,
  deriveCompositionalTraditionalPolicies,
  playCompositionalTraditionalRound,
} from './compositionalGame';
import { applyCompositionalTraditionalMessageReplacement } from './forgetting';
import { resolveCompositionalTraditionalConfig } from './validation';

describe('createInitialCompositionalTraditionalState', () => {
  it('creates the expected fixed matrix shapes with uniform initial reinforcement', () => {
    const config = resolveCompositionalTraditionalConfig({ initialReinforcement: 3 });
    const state = createInitialCompositionalTraditionalState(config);

    expect(state.senderAWeights).toHaveLength(4);
    expect(state.senderAWeights.every((row) => row.length === 2 && row.every((value) => value === 3))).toBe(
      true
    );
    expect(state.senderBWeights).toHaveLength(4);
    expect(state.senderBWeights.every((row) => row.length === 2 && row.every((value) => value === 3))).toBe(
      true
    );
    expect(state.receiverPairWeights).toHaveLength(2);
    expect(
      state.receiverPairWeights.every((rowA) =>
        rowA.length === 2 && rowA.every((rowB) => rowB.length === 4 && rowB.every((value) => value === 3))
      )
    ).toBe(true);
  });
});

describe('deriveCompositionalTraditionalPolicies', () => {
  it('normalizes all sender and receiver rows exactly', () => {
    const policies = deriveCompositionalTraditionalPolicies({
      senderAWeights: [
        [1, 3],
        [2, 2],
        [4, 0],
        [0, 4],
      ],
      senderBWeights: [
        [1, 1],
        [3, 1],
        [1, 3],
        [2, 2],
      ],
      receiverPairWeights: [
        [
          [1, 1, 1, 1],
          [4, 0, 0, 0],
        ],
        [
          [0, 4, 0, 0],
          [0, 0, 2, 2],
        ],
      ],
    });

    expect(policies.senderAPolicy[0]).toEqual([0.25, 0.75]);
    expect(policies.senderBPolicy[1]).toEqual([0.75, 0.25]);
    expect(policies.receiverPairPolicy[0][1]).toEqual([1, 0, 0, 0]);
  });
});

describe('playCompositionalTraditionalRound', () => {
  it('matches the baseline successful update semantics exactly when signaling bias is disabled', () => {
    const config = resolveCompositionalTraditionalConfig({
      seed: 7,
      signalingBiasEnabled: false,
    });
    const state = {
      senderAWeights: [
        [10, 4],
        [10, 4],
        [4, 10],
        [4, 10],
      ],
      senderBWeights: [
        [10, 4],
        [4, 10],
        [10, 4],
        [4, 10],
      ],
      receiverPairWeights: [
        [
          [10, 4, 4, 4],
          [100, 4, 4, 4],
        ],
        [
          [4, 4, 10, 4],
          [4, 4, 4, 10],
        ],
      ],
    };

    const { nextState, event } = playCompositionalTraditionalRound(state, config, new SeededPrng(7), 1);

    expect(event.success).toBe(true);
    expect(nextState.senderAWeights[event.stateIndex][event.messageAIndex]).toBe(
      state.senderAWeights[event.stateIndex][event.messageAIndex] + 1
    );
    expect(nextState.senderBWeights[event.stateIndex][event.messageBIndex]).toBe(
      state.senderBWeights[event.stateIndex][event.messageBIndex] + 1
    );
    expect(
      nextState.receiverPairWeights[event.messageAIndex][event.messageBIndex][event.actionIndex]
    ).toBe(state.receiverPairWeights[event.messageAIndex][event.messageBIndex][event.actionIndex] + 1);

    let senderAChanges = 0;
    let senderBChanges = 0;
    let receiverChanges = 0;

    for (let stateIndex = 0; stateIndex < 4; stateIndex += 1) {
      for (let messageIndex = 0; messageIndex < 2; messageIndex += 1) {
        if (nextState.senderAWeights[stateIndex][messageIndex] !== state.senderAWeights[stateIndex][messageIndex]) {
          senderAChanges += 1;
        }
        if (nextState.senderBWeights[stateIndex][messageIndex] !== state.senderBWeights[stateIndex][messageIndex]) {
          senderBChanges += 1;
        }
      }
    }

    for (let messageAIndex = 0; messageAIndex < 2; messageAIndex += 1) {
      for (let messageBIndex = 0; messageBIndex < 2; messageBIndex += 1) {
        for (let actionIndex = 0; actionIndex < 4; actionIndex += 1) {
          if (
            nextState.receiverPairWeights[messageAIndex][messageBIndex][actionIndex] !==
            state.receiverPairWeights[messageAIndex][messageBIndex][actionIndex]
          ) {
            receiverChanges += 1;
          }
        }
      }
    }

    expect(senderAChanges).toBe(1);
    expect(senderBChanges).toBe(1);
    expect(receiverChanges).toBe(1);
  });

  it('sharpens only the realized sender rows and realized pair-action row after a successful round when bias is enabled', () => {
    const state = {
      senderAWeights: [
        [10, 4],
        [10, 4],
        [4, 10],
        [4, 10],
      ],
      senderBWeights: [
        [10, 4],
        [4, 10],
        [10, 4],
        [4, 10],
      ],
      receiverPairWeights: [
        [
          [10, 4, 4, 4],
          [100, 4, 4, 4],
        ],
        [
          [4, 4, 10, 4],
          [4, 4, 4, 10],
        ],
      ],
    };
    const biasOff = playCompositionalTraditionalRound(
      state,
      resolveCompositionalTraditionalConfig({
        seed: 7,
        signalingBiasEnabled: false,
      }),
      new SeededPrng(7),
      1,
    );
    const biasOn = playCompositionalTraditionalRound(
      state,
      resolveCompositionalTraditionalConfig({
        seed: 7,
        signalingBiasEnabled: true,
        signalingBiasStrength: 0.05,
      }),
      new SeededPrng(7),
      1,
    );

    expect(biasOn.event).toEqual(biasOff.event);
    expect(biasOn.event.success).toBe(true);
    expect(
      biasOn.nextState.senderAWeights[biasOn.event.stateIndex][
        biasOn.event.messageAIndex
      ],
    ).toBe(
      biasOff.nextState.senderAWeights[biasOn.event.stateIndex][
        biasOn.event.messageAIndex
      ],
    );
    expect(
      biasOn.nextState.senderBWeights[biasOn.event.stateIndex][
        biasOn.event.messageBIndex
      ],
    ).toBe(
      biasOff.nextState.senderBWeights[biasOn.event.stateIndex][
        biasOn.event.messageBIndex
      ],
    );
    expect(
      biasOn.nextState.receiverPairWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][biasOn.event.actionIndex],
    ).toBe(
      biasOff.nextState.receiverPairWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][biasOn.event.actionIndex],
    );

    const competingSenderAIndex = biasOn.event.messageAIndex === 0 ? 1 : 0;
    const competingSenderBIndex = biasOn.event.messageBIndex === 0 ? 1 : 0;
    const competingActionIndex = biasOn.event.actionIndex === 0 ? 1 : 0;

    expect(
      biasOn.nextState.senderAWeights[biasOn.event.stateIndex][
        competingSenderAIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.senderAWeights[biasOn.event.stateIndex][
        competingSenderAIndex
      ],
    );
    expect(
      biasOn.nextState.senderBWeights[biasOn.event.stateIndex][
        competingSenderBIndex
      ],
    ).toBeLessThan(
      biasOff.nextState.senderBWeights[biasOn.event.stateIndex][
        competingSenderBIndex
      ],
    );
    expect(
      biasOn.nextState.receiverPairWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][competingActionIndex],
    ).toBeLessThan(
      biasOff.nextState.receiverPairWeights[biasOn.event.messageAIndex][
        biasOn.event.messageBIndex
      ][competingActionIndex],
    );
  });

  it('does not reinforce any cell on failure', () => {
    const config = resolveCompositionalTraditionalConfig({
      seed: 11,
      signalingBiasEnabled: true,
    });
    const state = {
      senderAWeights: [
        [10, 4],
        [10, 4],
        [4, 10],
        [4, 10],
      ],
      senderBWeights: [
        [10, 4],
        [4, 10],
        [10, 4],
        [4, 10],
      ],
      receiverPairWeights: [
        [
          [4, 10, 4, 4],
          [4, 4, 10, 4],
        ],
        [
          [4, 4, 4, 10],
          [10, 4, 4, 4],
        ],
      ],
    };

    const { nextState, event } = playCompositionalTraditionalRound(state, config, new SeededPrng(11), 1);

    expect(event.success).toBe(false);
    expect(nextState).toBe(state);
  });
});

describe('applyCompositionalTraditionalMessageReplacement', () => {
  it('resets the affected sender weights and affected pair rows without preserving the unreplaced component', () => {
    const config = resolveCompositionalTraditionalConfig({
      initialReinforcement: 1,
    });
    const state = {
      senderAWeights: [
        [8, 2],
        [8, 2],
        [2, 8],
        [2, 8],
      ],
      senderBWeights: [
        [9, 3],
        [3, 9],
        [9, 3],
        [3, 9],
      ],
      receiverPairWeights: [
        [
          [9, 1, 1, 1],
          [1, 9, 1, 1],
        ],
        [
          [1, 1, 9, 1],
          [1, 1, 1, 9],
        ],
      ],
    };

    const replaced = applyCompositionalTraditionalMessageReplacement(
      state,
      config,
      {
        replacedSender: 'b',
        replacedMessageIndex: 0,
      },
    );
    const policies = deriveCompositionalTraditionalPolicies(replaced);

    expect(replaced.senderBWeights.map((row) => row[0])).toEqual([1, 1, 1, 1]);
    expect(replaced.senderBWeights.map((row) => row[1])).toEqual([3, 9, 3, 9]);
    expect(replaced.receiverPairWeights[0][0]).toEqual([1, 1, 1, 1]);
    expect(replaced.receiverPairWeights[1][0]).toEqual([1, 1, 1, 1]);
    expect(replaced.receiverPairWeights[0][1]).toEqual(state.receiverPairWeights[0][1]);
    expect(replaced.receiverPairWeights[1][1]).toEqual(state.receiverPairWeights[1][1]);
    expect(policies.receiverPairPolicy[0][0]).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(policies.receiverPairPolicy[1][0]).toEqual([0.25, 0.25, 0.25, 0.25]);
  });
});

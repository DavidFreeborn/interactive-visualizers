import type { SignalingGameConfig, SignalingGameConfigInput } from './types';

/**
 * Default configuration for the baseline signaling game.
 */
export const DEFAULT_SIGNALING_GAME_CONFIG: SignalingGameConfig = {
  numStates: 2,
  numMessages: 2,
  numActions: 2,
  prior: [0.5, 0.5],
  correctActions: [0, 1],
  initialReinforcement: 1,
  seed: 42,
  rollingWindowSize: 200,
};

const MAX_UINT32 = 4294967295;

/**
 * Returns an identity action mapping of length {@link size}.
 */
export function createIdentityMapping(size: number): number[] {
  return Array.from({ length: size }, (_, index) => index);
}

/**
 * Returns a uniform prior over {@link size} states.
 */
export function createUniformPrior(size: number): number[] {
  const probability = 1 / size;
  return Array.from({ length: size }, () => probability);
}

function assertInteger(value: number, label: string, minimum: number): void {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${label} must be an integer greater than or equal to ${minimum}.`);
  }
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number greater than 0.`);
  }
}

function assertProbabilityVector(probabilities: readonly number[], expectedLength: number): void {
  if (probabilities.length !== expectedLength) {
    throw new Error(`prior must contain exactly ${expectedLength} entries.`);
  }

  let sum = 0;
  for (let index = 0; index < probabilities.length; index += 1) {
    const value = probabilities[index];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`prior[${index}] must be a finite non-negative number.`);
    }
    sum += value;
  }

  if (sum <= 0) {
    throw new Error('prior must contain at least one positive probability.');
  }

  const tolerance = 1e-9;
  if (Math.abs(sum - 1) > tolerance) {
    throw new Error(`prior must sum to 1. Received ${sum}.`);
  }
}

function assertCorrectActions(correctActions: readonly number[], numStates: number, numActions: number): void {
  if (correctActions.length !== numStates) {
    throw new Error(`correctActions must contain exactly ${numStates} entries.`);
  }

  for (let index = 0; index < correctActions.length; index += 1) {
    const action = correctActions[index];
    if (!Number.isInteger(action) || action < 0 || action >= numActions) {
      throw new Error(
        `correctActions[${index}] must be an integer between 0 and ${numActions - 1}.`
      );
    }
  }
}

/**
 * Resolves user input to a validated signaling-game configuration.
 */
export function resolveSignalingGameConfig(
  input: SignalingGameConfigInput = {}
): SignalingGameConfig {
  const numStates = input.numStates ?? DEFAULT_SIGNALING_GAME_CONFIG.numStates;
  const numMessages = input.numMessages ?? input.numStates ?? DEFAULT_SIGNALING_GAME_CONFIG.numMessages;
  const numActions = input.numActions ?? input.numStates ?? DEFAULT_SIGNALING_GAME_CONFIG.numActions;

  assertInteger(numStates, 'numStates', 2);
  assertInteger(numMessages, 'numMessages', 2);
  assertInteger(numActions, 'numActions', 2);

  const prior = input.prior ? [...input.prior] : createUniformPrior(numStates);
  const correctActions = input.correctActions
    ? [...input.correctActions]
    : createIdentityMapping(numStates).map((action) => {
        if (action >= numActions) {
          throw new Error(
            'The default identity correct-action mapping requires numActions to be at least numStates.'
          );
        }
        return action;
      });
  const initialReinforcement =
    input.initialReinforcement ?? DEFAULT_SIGNALING_GAME_CONFIG.initialReinforcement;
  const seed = input.seed ?? DEFAULT_SIGNALING_GAME_CONFIG.seed;
  const rollingWindowSize =
    input.rollingWindowSize ?? DEFAULT_SIGNALING_GAME_CONFIG.rollingWindowSize;

  assertProbabilityVector(prior, numStates);
  assertCorrectActions(correctActions, numStates, numActions);
  assertFinitePositive(initialReinforcement, 'initialReinforcement');
  assertInteger(seed, 'seed', 0);
  if (seed > MAX_UINT32) {
    throw new Error(`seed must be less than or equal to ${MAX_UINT32}.`);
  }
  assertInteger(rollingWindowSize, 'rollingWindowSize', 1);

  return {
    numStates,
    numMessages,
    numActions,
    prior,
    correctActions,
    initialReinforcement,
    seed,
    rollingWindowSize,
  };
}

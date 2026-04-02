import type { CompositionalConfig, CompositionalConfigInput } from './types';

const MAX_UINT32 = 4294967295;

export const DEFAULT_COMPOSITIONAL_CONFIG: CompositionalConfig = {
  numStates: 4,
  numMessagesA: 2,
  numMessagesB: 2,
  numActions: 4,
  prior: [0.25, 0.25, 0.25, 0.25],
  correctActions: [0, 1, 2, 3],
  initialReinforcement: 1,
  seed: 42,
  rollingWindowSize: 200,
  signalingBiasEnabled: true,
  // A 5% decay is strong enough to sharpen genuinely learned competitors
  // while remaining a gentle app-level inductive bias rather than a forced
  // collapse toward any specific signaling arrangement.
  signalingBiasStrength: 0.05,
};

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

function assertFiniteBiasStrength(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error(`${label} must be a finite number greater than or equal to 0 and less than 1.`);
  }
}

export function resolveCompositionalConfig(
  input: CompositionalConfigInput = {}
): CompositionalConfig {
  const seed = input.seed ?? DEFAULT_COMPOSITIONAL_CONFIG.seed;
  const initialReinforcement =
    input.initialReinforcement ?? DEFAULT_COMPOSITIONAL_CONFIG.initialReinforcement;
  const rollingWindowSize =
    input.rollingWindowSize ?? DEFAULT_COMPOSITIONAL_CONFIG.rollingWindowSize;
  const signalingBiasEnabled =
    input.signalingBiasEnabled ?? DEFAULT_COMPOSITIONAL_CONFIG.signalingBiasEnabled;
  const signalingBiasStrength =
    input.signalingBiasStrength ?? DEFAULT_COMPOSITIONAL_CONFIG.signalingBiasStrength;

  assertInteger(seed, 'seed', 0);
  if (seed > MAX_UINT32) {
    throw new Error(`seed must be less than or equal to ${MAX_UINT32}.`);
  }
  assertFinitePositive(initialReinforcement, 'initialReinforcement');
  assertInteger(rollingWindowSize, 'rollingWindowSize', 1);
  if (typeof signalingBiasEnabled !== 'boolean') {
    throw new Error('signalingBiasEnabled must be a boolean.');
  }
  assertFiniteBiasStrength(signalingBiasStrength, 'signalingBiasStrength');

  return {
    ...DEFAULT_COMPOSITIONAL_CONFIG,
    seed,
    initialReinforcement,
    rollingWindowSize,
    signalingBiasEnabled,
    signalingBiasStrength,
  };
}

import {
  buildCompositionalMetrics,
  calculateCompositionalApproximateRegime,
  calculateCompositionalExpectedSuccessRate,
  calculateCompositionalGreedyDiagnostic,
  calculateCompositionalJointMutualInformationBits,
  calculateCompositionalSenderAMutualInformationBits,
  calculateCompositionalSenderBMutualInformationBits,
  calculateCompositionalStableTraditionalSignalingSystem,
} from '../compositionalShared';
import type {
  CompositionalTraditionalConfig,
  CompositionalTraditionalMetrics,
  CompositionalTraditionalState,
  TraditionalApproximateRegime,
  TraditionalGreedyDiagnostic,
} from './types';
import { deriveCompositionalTraditionalPolicies } from './compositionalGame';

/**
 * Computes exact expected success under the current sender and receiver policies.
 */
export function calculateTraditionalExpectedSuccessRate(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): number {
  return calculateCompositionalExpectedSuccessRate(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Computes exact atomic mutual information I(S ; M_A) in bits.
 */
export function calculateSenderAMutualInformationBits(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): number {
  return calculateCompositionalSenderAMutualInformationBits(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Computes exact atomic mutual information I(S ; M_B) in bits.
 */
export function calculateSenderBMutualInformationBits(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): number {
  return calculateCompositionalSenderBMutualInformationBits(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Computes exact joint mutual information I(S ; (M_A, M_B)) in bits.
 */
export function calculateJointMutualInformationBits(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): number {
  return calculateCompositionalJointMutualInformationBits(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Computes the greedy diagnostic for sender partitions and pair decoding.
 */
export function calculateTraditionalGreedyDiagnostic(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): TraditionalGreedyDiagnostic {
  return calculateCompositionalGreedyDiagnostic(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Computes the exact stable traditional signalling-system flag.
 */
export function calculateStableTraditionalSignalingSystem(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): boolean {
  return calculateCompositionalStableTraditionalSignalingSystem(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Computes the approximate public-facing regime label.
 */
export function calculateTraditionalApproximateRegime(
  state: CompositionalTraditionalState,
  config: CompositionalTraditionalConfig
): TraditionalApproximateRegime {
  return calculateCompositionalApproximateRegime(
    deriveCompositionalTraditionalPolicies(state),
    config
  );
}

/**
 * Builds the full exact metric bundle for the traditional compositional game.
 */
export function buildCompositionalTraditionalMetrics(options: {
  state: CompositionalTraditionalState;
  config: CompositionalTraditionalConfig;
  round: number;
  totalSuccesses: number;
  rollingSuccessRate: number;
}): CompositionalTraditionalMetrics {
  return buildCompositionalMetrics({
    policies: deriveCompositionalTraditionalPolicies(options.state),
    config: options.config,
    round: options.round,
    totalSuccesses: options.totalSuccesses,
    rollingSuccessRate: options.rollingSuccessRate,
  });
}

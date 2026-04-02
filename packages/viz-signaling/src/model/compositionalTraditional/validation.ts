import {
  DEFAULT_COMPOSITIONAL_CONFIG,
  resolveCompositionalConfig,
} from '../compositionalShared';
import type {
  CompositionalTraditionalConfig,
  CompositionalTraditionalConfigInput,
} from './types';

/**
 * Fixed default configuration for the traditional compositional game.
 */
export const DEFAULT_COMPOSITIONAL_TRADITIONAL_CONFIG: CompositionalTraditionalConfig =
  DEFAULT_COMPOSITIONAL_CONFIG;

/**
 * Resolves user input to the fixed traditional compositional configuration.
 */
export function resolveCompositionalTraditionalConfig(
  input: CompositionalTraditionalConfigInput = {}
): CompositionalTraditionalConfig {
  return resolveCompositionalConfig(input);
}

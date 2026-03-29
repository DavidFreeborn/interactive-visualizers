/**
 * Pre-defined Bayesian network structures.
 *
 * Scientific Status: Standard toy model
 */

import type { BayesNetwork, NetworkType } from './types';

/**
 * Chain network: H -> S -> D
 *
 * Evidence D screens off hypothesis H from any other evidence.
 * This typically leads to convergence.
 */
export const CHAIN_NETWORK: BayesNetwork = {
  nodes: [
    { id: 'H', label: 'Hypothesis', parents: [] },
    { id: 'S', label: 'Intermediate', parents: ['H'] },
    { id: 'D', label: 'Data', parents: ['S'] },
  ],
  edges: [
    ['H', 'S'],
    ['S', 'D'],
  ],
  hypothesisNode: 'H',
  evidenceNode: 'D',
};

/**
 * Collider network: H -> D <- S
 *
 * Both H and S independently cause D.
 * This can lead to divergence (explaining away effect).
 */
export const COLLIDER_NETWORK: BayesNetwork = {
  nodes: [
    { id: 'H', label: 'Hypothesis', parents: [] },
    { id: 'S', label: 'Alternative', parents: [] },
    { id: 'D', label: 'Data', parents: ['H', 'S'] },
  ],
  edges: [
    ['H', 'D'],
    ['S', 'D'],
  ],
  hypothesisNode: 'H',
  evidenceNode: 'D',
};

/**
 * Gets the network structure for a given type.
 */
export function getNetwork(type: NetworkType): BayesNetwork {
  switch (type) {
    case 'chain':
      return CHAIN_NETWORK;
    case 'collider':
      return COLLIDER_NETWORK;
    default:
      return CHAIN_NETWORK;
  }
}

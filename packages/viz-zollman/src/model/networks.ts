/**
 * Network topology generators for Zollman effect.
 */

import type { TopologyType } from './types';

/**
 * Creates adjacency list for a cycle network.
 * Each agent is connected to immediate neighbors.
 */
export function createCycleNetwork(n: number): number[][] {
  const neighbors: number[][] = [];
  for (let i = 0; i < n; i++) {
    const prev = (i - 1 + n) % n;
    const next = (i + 1) % n;
    neighbors[i] = [prev, next];
  }
  return neighbors;
}

/**
 * Creates adjacency list for a complete network.
 * Every agent is connected to every other agent.
 */
export function createCompleteNetwork(n: number): number[][] {
  const neighbors: number[][] = [];
  for (let i = 0; i < n; i++) {
    neighbors[i] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        neighbors[i].push(j);
      }
    }
  }
  return neighbors;
}

/**
 * Creates the appropriate network for a topology type.
 */
export function createNetwork(topology: TopologyType, n: number): number[][] {
  switch (topology) {
    case 'cycle':
      return createCycleNetwork(n);
    case 'complete':
      return createCompleteNetwork(n);
    default:
      return createCycleNetwork(n);
  }
}

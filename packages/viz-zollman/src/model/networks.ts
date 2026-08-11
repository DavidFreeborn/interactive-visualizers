/**
 * Network topology generators for Zollman effect.
 */

import { SeededRandom } from '@viz/core-math';
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
 * Creates a star network.
 * One central hub connected to all other nodes.
 */
export function createStarNetwork(n: number): number[][] {
  if (n < 2) return [[]];

  const neighbors: number[][] = [];
  // Hub is node 0
  neighbors[0] = [];
  for (let i = 1; i < n; i++) {
    neighbors[0].push(i);
    neighbors[i] = [0]; // Only connected to hub
  }
  return neighbors;
}

/**
 * Creates an Erdős-Rényi random network.
 * Each edge exists with probability p.
 */
export function createERRandomNetwork(
  n: number,
  p: number,
  rng: SeededRandom
): number[][] {
  const neighbors: number[][] = [];
  for (let i = 0; i < n; i++) {
    neighbors[i] = [];
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rng.random() < p) {
        neighbors[i].push(j);
        neighbors[j].push(i);
      }
    }
  }

  // Ensure connected: add edges if isolated nodes exist
  for (let i = 0; i < n; i++) {
    if (neighbors[i].length === 0 && n > 1) {
      // Connect to a random other node
      let j = rng.randInt(0, n - 1);
      if (j === i) j = (j + 1) % n;
      neighbors[i].push(j);
      neighbors[j].push(i);
    }
  }

  return neighbors;
}

/**
 * Creates a Barabási-Albert scale-free network.
 * New nodes attach preferentially to high-degree nodes.
 */
export function createBAScaleFreeNetwork(
  n: number,
  m: number, // edges per new node
  rng: SeededRandom
): number[][] {
  if (n < 2) return [[]];

  const neighbors: number[][] = [];
  const degrees: number[] = [];

  // Start with a small complete graph
  const initialNodes = Math.max(m + 1, 2);
  for (let i = 0; i < initialNodes; i++) {
    neighbors[i] = [];
    degrees[i] = 0;
  }
  for (let i = 0; i < initialNodes; i++) {
    for (let j = i + 1; j < initialNodes; j++) {
      neighbors[i].push(j);
      neighbors[j].push(i);
      degrees[i]++;
      degrees[j]++;
    }
  }

  // Add remaining nodes with preferential attachment
  for (let newNode = initialNodes; newNode < n; newNode++) {
    neighbors[newNode] = [];
    degrees[newNode] = 0;

    // Select m nodes to connect to (preferential attachment)
    const targets = new Set<number>();
    const totalDegree = degrees.reduce((a, b) => a + b, 0);

    while (targets.size < Math.min(m, newNode)) {
      let r = rng.random() * totalDegree;
      for (let i = 0; i < newNode; i++) {
        r -= degrees[i];
        if (r <= 0 && !targets.has(i)) {
          targets.add(i);
          break;
        }
      }
      // Fallback: just pick randomly
      if (r > 0) {
        for (let i = 0; i < newNode; i++) {
          if (!targets.has(i)) {
            targets.add(i);
            break;
          }
        }
      }
    }

    for (const target of targets) {
      neighbors[newNode].push(target);
      neighbors[target].push(newNode);
      degrees[newNode]++;
      degrees[target]++;
    }
  }

  return neighbors;
}

/**
 * Creates a Watts-Strogatz small-world network.
 * Start with ring lattice, rewire edges with probability p.
 */
export function createWSSmallWorldNetwork(
  n: number,
  k: number, // each node connected to k nearest neighbors (k/2 on each side)
  p: number, // rewiring probability
  rng: SeededRandom
): number[][] {
  if (n < 3) return createCompleteNetwork(n);

  // Start with ring lattice
  const neighbors: number[][] = [];
  const edgeSet = new Set<string>();

  const addEdge = (i: number, j: number) => {
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (!edgeSet.has(key) && i !== j) {
      edgeSet.add(key);
    }
  };

  // Create ring lattice
  const halfK = Math.floor(k / 2);
  for (let i = 0; i < n; i++) {
    for (let offset = 1; offset <= halfK; offset++) {
      addEdge(i, (i + offset) % n);
    }
  }

  // Rewire edges
  const edges = Array.from(edgeSet);
  for (const edge of edges) {
    if (rng.random() < p) {
      const [iStr, jStr] = edge.split('-');
      const i = parseInt(iStr);
      // Remove old edge
      edgeSet.delete(edge);
      // Add new random edge from i
      let newTarget = rng.randInt(0, n - 1);
      let attempts = 0;
      while (
        (newTarget === i ||
          edgeSet.has(i < newTarget ? `${i}-${newTarget}` : `${newTarget}-${i}`)) &&
        attempts < n
      ) {
        newTarget = rng.randInt(0, n - 1);
        attempts++;
      }
      if (newTarget !== i) {
        addEdge(i, newTarget);
      }
    }
  }

  // Convert edge set to adjacency list
  for (let i = 0; i < n; i++) {
    neighbors[i] = [];
  }
  for (const edge of edgeSet) {
    const [iStr, jStr] = edge.split('-');
    const i = parseInt(iStr);
    const j = parseInt(jStr);
    neighbors[i].push(j);
    neighbors[j].push(i);
  }

  // Ensure connected
  for (let i = 0; i < n; i++) {
    if (neighbors[i].length === 0 && n > 1) {
      let j = rng.randInt(0, n - 1);
      if (j === i) j = (j + 1) % n;
      neighbors[i].push(j);
      neighbors[j].push(i);
    }
  }

  return neighbors;
}

/**
 * Creates the appropriate network for a topology type.
 */
export function createNetwork(
  topology: TopologyType,
  n: number,
  rng?: SeededRandom
): number[][] {
  switch (topology) {
    case 'cycle':
      return createCycleNetwork(n);
    case 'complete':
      return createCompleteNetwork(n);
    case 'star':
      return createStarNetwork(n);
    case 'er-random':
      // p = 0.3 gives reasonable connectivity
      return createERRandomNetwork(n, 0.3, rng ?? new SeededRandom(12345));
    case 'ba-scale-free':
      // m = 2 gives degree distribution with power law
      return createBAScaleFreeNetwork(n, 2, rng ?? new SeededRandom(12345));
    case 'ws-small-world':
      // k = 4 (connect to 4 nearest), p = 0.1 (10% rewiring)
      return createWSSmallWorldNetwork(n, 4, 0.1, rng ?? new SeededRandom(12345));
    default:
      return createCycleNetwork(n);
  }
}

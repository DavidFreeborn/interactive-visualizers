/**
 * Preset configurations for the Swarm Dynamics visualizer.
 *
 * Each preset provides a named configuration that demonstrates
 * a particular emergent behavior or visual effect.
 *
 * Credits:
 * - Boids: Craig Reynolds (1987 SIGGRAPH)
 * - Friends & Enemies: Simon Woods (Wolfram Community)
 * - Particle Life: Jeffrey Ventrella, Tom Mohr
 * - Swarmalators: O'Keeffe, Hong & Strogatz (2017)
 */

import type { DotsConfig } from './model/types';

export interface Preset {
  name: string;
  description: string;
  config: DotsConfig;
  credit?: string;
}

/**
 * Generate a seeded random matrix for Particle Life.
 */
function generateMatrix(size: number, seed: number): number[][] {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return (state / 0x7fffffff) * 2 - 1;
  };

  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = next() * 0.3;
      } else {
        matrix[i][j] = next();
      }
    }
  }
  return matrix;
}

export const PRESETS: Preset[] = [
  // ============================================================
  // BOIDS / FLOCKING (Craig Reynolds, 1987)
  // ============================================================
  {
    name: 'Classic Flock',
    description: 'Balanced flocking with coordinated motion (default).',
    config: {
      numParticles: 600,
      behavior: 'boids',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 42,
      behaviorParams: {
        type: 'boids',
        maxSpeed: 10,
        separationWeight: 1.5,
        separationRadius: 30,
        alignmentWeight: 1.0,
        alignmentRadius: 60,
        cohesionWeight: 0.5,
        cohesionRadius: 100,
        turnFactor: 1.0,
      },
    },
  },
  {
    name: 'Murmuration',
    description: 'Large flock with swirling, starling-like motion.',
    config: {
      numParticles: 800,
      behavior: 'boids',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 42,
      behaviorParams: {
        type: 'boids',
        maxSpeed: 12,
        separationWeight: 1.8,
        separationRadius: 25,
        alignmentWeight: 1.5,
        alignmentRadius: 70,
        cohesionWeight: 0.6,
        cohesionRadius: 90,
        turnFactor: 1.0,
      },
    },
  },
  {
    name: 'Tight Flock',
    description: 'Dense, fast-moving flock that stays together.',
    config: {
      numParticles: 500,
      behavior: 'boids',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 123,
      behaviorParams: {
        type: 'boids',
        maxSpeed: 14,
        separationWeight: 1.5,
        separationRadius: 20,
        alignmentWeight: 2.0,
        alignmentRadius: 60,
        cohesionWeight: 1.5,
        cohesionRadius: 100,
        turnFactor: 1.5,
      },
    },
  },
  {
    name: 'Diffuse Cloud',
    description: 'Loosely aligned, spread-out formation.',
    config: {
      numParticles: 600,
      behavior: 'boids',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 77,
      behaviorParams: {
        type: 'boids',
        maxSpeed: 6,
        separationWeight: 2.0,
        separationRadius: 50,
        alignmentWeight: 0.8,
        alignmentRadius: 80,
        cohesionWeight: 0.2,
        cohesionRadius: 120,
        turnFactor: 0.5,
      },
    },
  },
  {
    name: 'Turbulent',
    description: 'High separation creates chaotic, swirling motion.',
    config: {
      numParticles: 500,
      behavior: 'boids',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 99,
      behaviorParams: {
        type: 'boids',
        maxSpeed: 14,
        separationWeight: 2.5,
        separationRadius: 40,
        alignmentWeight: 0.5,
        alignmentRadius: 50,
        cohesionWeight: 0.6,
        cohesionRadius: 80,
        turnFactor: 0.8,
      },
    },
  },

  // ============================================================
  // SOCIAL DYNAMICS (Simon Woods, Wolfram Community)
  // TOPOLOGY: plane (self-bounding, no wrap/bounce)
  // Friend mode determines aesthetics:
  //   cycle -> flowing ribbon (dots.morgaes.is default)
  //   random -> orbiting cliques
  // ============================================================
  {
    name: 'Classic',
    description: 'Woods original: 1000 dancers, random friends, orbiting cliques.',
    credit: 'Simon Woods (Wolfram Community)',
    config: {
      numParticles: 1000,
      behavior: 'friends-enemies',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 17,
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.995,
        friendWeight: 0.02,
        enemyWeight: 0.01,
        rewireRate: 0.1,
        friendMode: 'random',
      },
    },
  },
  {
    name: 'Ribbon Dance',
    description: 'Flowing rotating ribbon - cycle friends chase each other.',
    credit: 'Simon Woods (Wolfram Community)',
    config: {
      numParticles: 800,
      behavior: 'friends-enemies',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 42,
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.995,
        friendWeight: 0.02,
        enemyWeight: 0.01,
        rewireRate: 0.1,
        friendMode: 'cycle',
      },
    },
  },
  {
    name: 'Energetic',
    description: 'Higher rewiring keeps structures open and dynamic.',
    credit: 'Simon Woods (Wolfram Community)',
    config: {
      numParticles: 700,
      behavior: 'friends-enemies',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 99,
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.993,
        friendWeight: 0.025,
        enemyWeight: 0.012,
        rewireRate: 0.3,
        friendMode: 'random',
      },
    },
  },
  {
    name: 'Slow Waltz',
    description: 'Higher friction creates slower, graceful motion.',
    credit: 'Simon Woods (Wolfram Community)',
    config: {
      numParticles: 600,
      behavior: 'friends-enemies',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 55,
      behaviorParams: {
        type: 'friends-enemies',
        friction: 0.997,
        friendWeight: 0.018,
        enemyWeight: 0.009,
        rewireRate: 0.05,
        friendMode: 'cycle',
      },
    },
  },

  // ============================================================
  // PARTICLE LIFE (Ventrella, Mohr)
  // ============================================================
  {
    name: 'Primordial Soup',
    description: 'Random attractions create emergent structures.',
    config: {
      numParticles: 1500,
      behavior: 'particle-life',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 42,
      behaviorParams: {
        type: 'particle-life',
        numTypes: 6,
        attractionMatrix: generateMatrix(6, 42),
        interactionRadius: 80,
        friction: 0.15,
      },
    },
  },
  {
    name: 'Cells',
    description: 'Self-organizing cell-like structures.',
    config: {
      numParticles: 1200,
      behavior: 'particle-life',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 7777,
      behaviorParams: {
        type: 'particle-life',
        numTypes: 4,
        attractionMatrix: [
          [0.3, 0.5, -0.3, 0.1],
          [-0.2, 0.4, 0.6, -0.4],
          [0.4, -0.5, 0.3, 0.5],
          [-0.3, 0.2, -0.4, 0.4],
        ],
        interactionRadius: 100,
        friction: 0.18,
      },
    },
  },
  {
    name: 'Predator-Prey',
    description: 'Rock-paper-scissors: each type chases one, flees another.',
    config: {
      numParticles: 1200,
      behavior: 'particle-life',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 123,
      behaviorParams: {
        type: 'particle-life',
        numTypes: 3,
        attractionMatrix: [
          [0, 0.8, -0.8],
          [-0.8, 0, 0.8],
          [0.8, -0.8, 0],
        ],
        interactionRadius: 100,
        friction: 0.18,
      },
    },
  },
  {
    name: 'Symbiosis',
    description: 'Mutual attraction forms stable mixed clusters.',
    config: {
      numParticles: 1400,
      behavior: 'particle-life',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 77,
      behaviorParams: {
        type: 'particle-life',
        numTypes: 4,
        attractionMatrix: [
          [-0.1, 0.7, 0.5, -0.3],
          [0.7, -0.1, -0.3, 0.5],
          [0.5, -0.3, -0.1, 0.7],
          [-0.3, 0.5, 0.7, -0.1],
        ],
        interactionRadius: 90,
        friction: 0.15,
      },
    },
  },
  {
    name: 'Tribes',
    description: 'Strong self-attraction creates distinct tribal groups.',
    config: {
      numParticles: 1200,
      behavior: 'particle-life',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 33,
      behaviorParams: {
        type: 'particle-life',
        numTypes: 4,
        attractionMatrix: [
          [0.8, -0.2, -0.3, -0.2],
          [-0.2, 0.8, -0.2, -0.3],
          [-0.3, -0.2, 0.8, -0.2],
          [-0.2, -0.3, -0.2, 0.8],
        ],
        interactionRadius: 70,
        friction: 0.12,
      },
    },
  },
  {
    name: 'Galaxies',
    description: 'Spinning galaxy-like formations with orbital dynamics.',
    config: {
      numParticles: 1200,
      behavior: 'particle-life',
      width: 800,
      height: 600,
      topology: 'torus',
      seed: 555,
      behaviorParams: {
        type: 'particle-life',
        numTypes: 3,
        attractionMatrix: [
          [0.5, 0.3, -0.2],
          [-0.2, 0.5, 0.3],
          [0.3, -0.2, 0.5],
        ],
        interactionRadius: 100,
        friction: 0.15,
      },
    },
  },

  // ============================================================
  // SWARMALATORS (O'Keeffe, Hong & Strogatz, 2017)
  // THE FIVE CANONICAL PAPER STATES (all omega = 0)
  // TOPOLOGY: plane (self-bounding via pair forces)
  // Motion comes from NEGATIVE K, not omegaVariance
  // ============================================================
  {
    name: 'Default',
    description: 'Balanced parameters showing phase-space coupling.',
    config: {
      numParticles: 350,
      behavior: 'swarmalators',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 42,
      behaviorParams: {
        type: 'swarmalators',
        J: 1.0,
        K: 0.5,
        omegaVariance: 0,
      },
    },
  },
  {
    name: 'Spinning Rainbow',
    description: 'Perpetual circulation - the mesmerizing one. (J=1, K=-0.75)',
    config: {
      numParticles: 350,
      behavior: 'swarmalators',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 123,
      behaviorParams: {
        type: 'swarmalators',
        J: 1.0,
        K: -0.75,
        omegaVariance: 0,
      },
    },
  },
  {
    name: 'Rainbow Ring',
    description: 'Annulus with phase = angle, forms spontaneously. (J=1, K=0)',
    config: {
      numParticles: 350,
      behavior: 'swarmalators',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 99,
      behaviorParams: {
        type: 'swarmalators',
        J: 1.0,
        K: 0.0,
        omegaVariance: 0,
      },
    },
  },
  {
    name: 'Splintered Wave',
    description: 'Phase-sorted clusters, quivering. (J=1, K=-0.1)',
    config: {
      numParticles: 350,
      behavior: 'swarmalators',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 55,
      behaviorParams: {
        type: 'swarmalators',
        J: 1.0,
        K: -0.1,
        omegaVariance: 0,
      },
    },
  },
  {
    name: 'Sync',
    description: 'Phases converge to one color, static disc. (J=0.1, K=1)',
    config: {
      numParticles: 350,
      behavior: 'swarmalators',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 42,
      behaviorParams: {
        type: 'swarmalators',
        J: 0.1,
        K: 1.0,
        omegaVariance: 0,
      },
    },
  },
  {
    name: 'Async',
    description: 'Static disc, permanently mixed colors. (J=0.1, K=-1)',
    config: {
      numParticles: 350,
      behavior: 'swarmalators',
      width: 800,
      height: 600,
      topology: 'plane',
      seed: 77,
      behaviorParams: {
        type: 'swarmalators',
        J: 0.1,
        K: -1.0,
        omegaVariance: 0,
      },
    },
  },
];

export default PRESETS;

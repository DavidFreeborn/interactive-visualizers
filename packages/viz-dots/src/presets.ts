import type { DotsConfig, SwarmalatorsParams } from './model/types';

export interface Preset {
  name: string;
  description: string;
  config: DotsConfig;
  credit?: string;
}

function generateMatrix(size: number, seed: number): number[][] {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff * 2 - 1;
  };
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => next())
  );
}

const classicSwarm = (overrides: Partial<SwarmalatorsParams>): SwarmalatorsParams => ({
  type: 'swarmalators',
  model: 'classic-2017',
  J: 1,
  K: 0,
  omegaVariance: 0,
  initMode: 'scattered',
  initialBoxSize: 2,
  frequencyMode: 'F2',
  omegaMax: 3,
  chiral: false,
  frequencyCoupling: false,
  couplingRadius: null,
  ...overrides,
});

const diverseSwarm = (overrides: Partial<SwarmalatorsParams>): SwarmalatorsParams => ({
  type: 'swarmalators',
  model: 'diverse-2023',
  J: 1,
  K: 0,
  omegaVariance: 0,
  initMode: 'scattered',
  initialBoxSize: 4,
  frequencyMode: 'F2',
  omegaMax: 3,
  chiral: false,
  frequencyCoupling: false,
  couplingRadius: null,
  ...overrides,
});

export const PRESETS: Preset[] = [
  // BOIDS
  {
    name: 'Classic Flock',
    description: 'Balanced flocking with coordinated motion.',
    config: {
      numParticles: 600, behavior: 'boids', width: 800, height: 600,
      topology: 'torus', seed: 42,
      behaviorParams: {
        type: 'boids', maxSpeed: 10,
        separationWeight: 1.5, separationRadius: 30,
        alignmentWeight: 1, alignmentRadius: 60,
        cohesionWeight: 0.5, cohesionRadius: 100, turnFactor: 1,
      },
    },
    credit: 'Craig Reynolds (1987)',
  },
  {
    name: 'Murmuration',
    description: 'Large, strongly aligned flock with turbulent local motion.',
    config: {
      numParticles: 800, behavior: 'boids', width: 800, height: 600,
      topology: 'torus', seed: 42,
      behaviorParams: {
        type: 'boids', maxSpeed: 12,
        separationWeight: 1.8, separationRadius: 25,
        alignmentWeight: 1.5, alignmentRadius: 70,
        cohesionWeight: 0.6, cohesionRadius: 90, turnFactor: 1,
      },
    },
  },
  {
    name: 'Diffuse Cloud',
    description: 'High separation and weak cohesion produce a loose flock.',
    config: {
      numParticles: 600, behavior: 'boids', width: 800, height: 600,
      topology: 'torus', seed: 77,
      behaviorParams: {
        type: 'boids', maxSpeed: 6,
        separationWeight: 2, separationRadius: 50,
        alignmentWeight: 0.8, alignmentRadius: 80,
        cohesionWeight: 0.2, cohesionRadius: 120, turnFactor: 0.5,
      },
    },
  },

  // FRIENDS & ENEMIES
  {
    name: 'Default',
    description: 'Literal 1000-dancer random-friend configuration from Simon Woods.',
    credit: 'Simon Woods, Wolfram Community',
    config: {
      numParticles: 1000, behavior: 'friends-enemies', width: 800, height: 600,
      topology: 'plane', seed: 17,
      behaviorParams: {
        type: 'friends-enemies', friction: 0.995,
        friendWeight: 0.02, enemyWeight: 0.01,
        rewireRate: 0.099, friendMode: 'random',
      },
    },
  },
  {
    name: 'Ribbon Dance',
    description: 'Jari Kirma chained-friend variant: one 2000-dancer pursuit cycle, fixed random enemies.',
    credit: 'Jari Kirma / Simon Woods, Wolfram Community',
    config: {
      numParticles: 2000, behavior: 'friends-enemies', width: 800, height: 600,
      topology: 'plane', seed: 42,
      behaviorParams: {
        type: 'friends-enemies', friction: 0.995,
        friendWeight: 0.02, enemyWeight: 0.01,
        rewireRate: 0, friendMode: 'cycle',
      },
    },
  },
  {
    name: 'Energetic Random',
    description: 'Exploratory variant with more frequent relationship changes.',
    config: {
      numParticles: 900, behavior: 'friends-enemies', width: 800, height: 600,
      topology: 'plane', seed: 99,
      behaviorParams: {
        type: 'friends-enemies', friction: 0.995,
        friendWeight: 0.02, enemyWeight: 0.01,
        rewireRate: 0.3, friendMode: 'random',
      },
    },
  },

  // PARTICLE LIFE
  {
    name: 'Primordial Soup',
    description: 'Seeded directed attraction matrix using the canonical Particle Life force curve.',
    credit: 'Particle Life / Tom Mohr',
    config: {
      numParticles: 800, behavior: 'particle-life', width: 800, height: 600,
      topology: 'torus', seed: 42,
      behaviorParams: {
        type: 'particle-life', numTypes: 6,
        attractionMatrix: generateMatrix(6, 42), interactionRadius: 80, friction: 0.15,
      },
    },
  },
  {
    name: 'Predator-Prey',
    description: 'Directed rock-paper-scissors chase/flee interactions.',
    config: {
      numParticles: 800, behavior: 'particle-life', width: 800, height: 600,
      topology: 'torus', seed: 123,
      behaviorParams: {
        type: 'particle-life', numTypes: 3,
        attractionMatrix: [[0,0.8,-0.8],[-0.8,0,0.8],[0.8,-0.8,0]],
        interactionRadius: 100, friction: 0.18,
      },
    },
  },
  {
    name: 'Symbiosis',
    description: 'Mutual attractions produce mixed clusters.',
    config: {
      numParticles: 850, behavior: 'particle-life', width: 800, height: 600,
      topology: 'torus', seed: 77,
      behaviorParams: {
        type: 'particle-life', numTypes: 4,
        attractionMatrix: [
          [-0.1,0.7,0.5,-0.3], [0.7,-0.1,-0.3,0.5],
          [0.5,-0.3,-0.1,0.7], [-0.3,0.5,0.7,-0.1],
        ],
        interactionRadius: 90, friction: 0.15,
      },
    },
  },
  {
    name: 'Tribes',
    description: 'Strong same-type attraction separates the population into groups.',
    config: {
      numParticles: 800, behavior: 'particle-life', width: 800, height: 600,
      topology: 'torus', seed: 33,
      behaviorParams: {
        type: 'particle-life', numTypes: 4,
        attractionMatrix: [
          [0.8,-0.2,-0.3,-0.2], [-0.2,0.8,-0.2,-0.3],
          [-0.3,-0.2,0.8,-0.2], [-0.2,-0.3,-0.2,0.8],
        ],
        interactionRadius: 70, friction: 0.12,
      },
    },
  },

  // CLASSIC SWARMALATORS (2017)
  {
    name: '2017: Spinning Rainbow',
    description: 'Active phase wave: persistent circulation (J=1, K=-0.75).',
    credit: "O'Keeffe, Hong & Strogatz (2017)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 123,
      behaviorParams: classicSwarm({ J: 1, K: -0.75 }) },
  },
  {
    name: '2017: Rainbow Ring',
    description: 'Static phase wave: annulus with phase correlated with spatial angle.',
    credit: "O'Keeffe, Hong & Strogatz (2017)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 99,
      behaviorParams: classicSwarm({ J: 1, K: 0 }) },
  },
  {
    name: '2017: Splintered Wave',
    description: 'Splintered phase wave (J=1, K=-0.1).',
    credit: "O'Keeffe, Hong & Strogatz (2017)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 55,
      behaviorParams: classicSwarm({ J: 1, K: -0.1 }) },
  },
  {
    name: '2017: Static Sync',
    description: 'Canonical synchronized static disc (J=0.1, K=1).',
    credit: "O'Keeffe, Hong & Strogatz (2017)",
    config: { numParticles: 350, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 42,
      behaviorParams: classicSwarm({ J: 0.1, K: 1 }) },
  },
  {
    name: '2017: Static Async',
    description: 'Canonical asynchronous static disc (J=0.1, K=-1).',
    credit: "O'Keeffe, Hong & Strogatz (2017)",
    config: { numParticles: 350, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 77,
      behaviorParams: classicSwarm({ J: 0.1, K: -1 }) },
  },

  // DIVERSE / CHIRAL SWARMALATORS (2023), EXPLICIT PAPER PARAMETERS
  {
    name: '2023: Sperm Vortex Array',
    description: 'Frequency-coupled chiral vortex array: F2, J=1, K=0, sigma=1.2 (Fig. 9e).',
    credit: "Ceron, O'Keeffe & Petersen (2023)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 91,
      behaviorParams: diverseSwarm({ J: 1, K: 0, frequencyMode: 'F2', chiral: true, frequencyCoupling: true, couplingRadius: 1.2 }) },
  },
  {
    name: '2023: Multiple Vortices',
    description: 'FCCS multiple-vortex state: F4, J=1, K=0, sigma=1.6 (Fig. 8i).',
    credit: "Ceron, O'Keeffe & Petersen (2023)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 27,
      behaviorParams: diverseSwarm({ J: 1, K: 0, frequencyMode: 'F4', chiral: true, frequencyCoupling: true, couplingRadius: 1.6 }) },
  },
  {
    name: '2023: Flocking Vortices',
    description: 'FCCS flocking-vortex state: F2, J=1, K=1, sigma=0.8 (Fig. 8j).',
    credit: "Ceron, O'Keeffe & Petersen (2023)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 31,
      behaviorParams: diverseSwarm({ J: 1, K: 1, frequencyMode: 'F2', chiral: true, frequencyCoupling: true, couplingRadius: 0.8 }) },
  },
  {
    name: '2023: Gas-like FCCS',
    description: 'FCCS gas-like state: F4, J=-1, K=-1, sigma=0.8 (Fig. 8h).',
    credit: "Ceron, O'Keeffe & Petersen (2023)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 44,
      behaviorParams: diverseSwarm({ J: -1, K: -1, frequencyMode: 'F4', chiral: true, frequencyCoupling: true, couplingRadius: 0.8 }) },
  },
  {
    name: '2023: Slime-Mold Clusters',
    description: 'Locally coupled non-chiral F2 clusters: J=1, K=1, sigma=1.4 (Fig. 8b).',
    credit: "Ceron, O'Keeffe & Petersen (2023)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 62,
      behaviorParams: diverseSwarm({ J: 1, K: 1, frequencyMode: 'F2', chiral: false, frequencyCoupling: false, couplingRadius: 1.4 }) },
  },
  {
    name: '2023: Phase-Wave Ribbons',
    description: 'Locally coupled non-chiral F2 ribbons: J=1, K=0, sigma=1.4 (Fig. 8b slug stage).',
    credit: "Ceron, O'Keeffe & Petersen (2023)",
    config: { numParticles: 400, behavior: 'swarmalators', width: 800, height: 600, topology: 'plane', seed: 64,
      behaviorParams: diverseSwarm({ J: 1, K: 0, frequencyMode: 'F2', chiral: false, frequencyCoupling: false, couplingRadius: 1.4 }) },
  },
];

export default PRESETS;

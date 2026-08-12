/**
 * Type definitions for the Swarm Dynamics visualizer.
 */

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
  phase?: number;
  omega?: number;
  friendId?: number;
  enemyId?: number;
}

export type BehaviorType =
  | 'boids'
  | 'friends-enemies'
  | 'particle-life'
  | 'swarmalators';

export type TopologyType =
  | 'bounded'
  | 'plane'
  | 'torus'
  | 'cylinder-x'
  | 'cylinder-y'
  | 'mobius-x'
  | 'mobius-y';

export interface DotsConfig {
  numParticles: number;
  behavior: BehaviorType;
  width: number;
  height: number;
  topology: TopologyType;
  /** @deprecated Use topology instead. */
  wrap?: boolean;
  seed: number;
  behaviorParams: BehaviorParams;
}

export interface BoidsParams {
  type: 'boids';
  maxSpeed: number;
  separationWeight: number;
  separationRadius: number;
  alignmentWeight: number;
  alignmentRadius: number;
  cohesionWeight: number;
  cohesionRadius: number;
  turnFactor: number;
}

export interface FriendsEnemiesParams {
  type: 'friends-enemies';
  /** Woods' contraction coefficient, 0.995 in the original. */
  friction: number;
  /** Friend attraction coefficient, 0.02 in the original. */
  friendWeight: number;
  /** Enemy repulsion coefficient, 0.01 in the original. */
  enemyWeight: number;
  /** Expected global rewiring events per frame. Woods original at n=1000: 99/1000 = 0.099. */
  rewireRate: number;
  /** Random functional graph (Woods) or one directed cycle (Kirma ribbon variant). */
  friendMode?: 'random' | 'cycle';
}

export interface ParticleLifeParams {
  type: 'particle-life';
  numTypes: number;
  attractionMatrix: number[][];
  interactionRadius: number;
  friction: number;
}

export type SwarmalatorModel = 'classic-2017' | 'diverse-2023';
export type NaturalFrequencyMode = 'F1' | 'F2' | 'F3' | 'F4';

export interface SwarmalatorsParams {
  type: 'swarmalators';
  /** Which published swarmalator model to use. */
  model?: SwarmalatorModel;
  /** Spatial phase-coupling coefficient J. */
  J: number;
  /** Phase coupling coefficient K. */
  K: number;
  /** 2017-only optional uniform frequency half-width; canonical states use 0. */
  omegaVariance: number;
  initMode?: 'scattered' | 'rainbow_ring';
  /** Side length of the initial square in model units. */
  initialBoxSize?: number;
  /** 2023 natural-frequency distribution. */
  frequencyMode?: NaturalFrequencyMode;
  /** Upper magnitude Omega for F3/F4 (3 in most of the 2023 study). */
  omegaMax?: number;
  /** Enable inherent clockwise/counter-clockwise motion c_i n_i. */
  chiral?: boolean;
  /** Enable Q_xdot and Q_thetadot frequency-coupling offsets. */
  frequencyCoupling?: boolean;
  /** Finite interaction range sigma in model units; null/undefined means global coupling. */
  couplingRadius?: number | null;
}

export type BehaviorParams =
  | BoidsParams
  | FriendsEnemiesParams
  | ParticleLifeParams
  | SwarmalatorsParams;

export interface DotsState {
  frame: number;
  particles: Particle[];
  trails?: Array<Array<{ x: number; y: number }>>;
}

export interface DotsMetrics {
  frame: number;
  avgSpeed: number;
  orderParameter?: number;
  phaseSynchronization?: number;
  /** max(|S+|, |S-|), the circumferential space-phase order parameter. */
  spacePhaseOrder?: number;
}

export interface Interaction {
  type: 'attract' | 'repel' | 'none';
  x: number;
  y: number;
  strength: number;
  active: boolean;
}

export interface RenderOptions {
  showTrails: boolean;
  trailLength: number;
  trailOpacity: number;
  colorScheme: 'type' | 'speed' | 'phase' | 'monochrome';
  particleRadius: number;
  backgroundColor: string;
  particleColor: string;
  showArrows: boolean;
}

export const DEFAULT_BOIDS_PARAMS: BoidsParams = {
  type: 'boids',
  maxSpeed: 10,
  separationWeight: 1.5,
  separationRadius: 30,
  alignmentWeight: 1.0,
  alignmentRadius: 60,
  cohesionWeight: 0.5,
  cohesionRadius: 100,
  turnFactor: 1.0,
};

export const DEFAULT_FRIENDS_ENEMIES_PARAMS: FriendsEnemiesParams = {
  type: 'friends-enemies',
  friction: 0.995,
  friendWeight: 0.02,
  enemyWeight: 0.01,
  rewireRate: 0.099,
  friendMode: 'random',
};

export const DEFAULT_PARTICLE_LIFE_PARAMS: ParticleLifeParams = {
  type: 'particle-life',
  numTypes: 6,
  attractionMatrix: makeDefaultMatrix(6, 42),
  interactionRadius: 80,
  friction: 0.15,
};

export const DEFAULT_SWARMALATOR_PARAMS: SwarmalatorsParams = {
  type: 'swarmalators',
  model: 'classic-2017',
  J: 1.0,
  K: 0.0,
  omegaVariance: 0,
  initMode: 'scattered',
  initialBoxSize: 2,
  frequencyMode: 'F2',
  omegaMax: 3,
  chiral: false,
  frequencyCoupling: false,
  couplingRadius: null,
};

export const DEFAULT_CONFIG: DotsConfig = {
  numParticles: 1000,
  behavior: 'boids',
  width: 800,
  height: 600,
  topology: 'torus',
  seed: Math.floor(Math.random() * 1_000_000),
  behaviorParams: { ...DEFAULT_BOIDS_PARAMS },
};

/** Browser-facing ceilings. Scientific source counts may be lower or higher. */
export const MAX_PARTICLES: Record<BehaviorType, number> = {
  boids: 5000,
  'friends-enemies': 5000,
  'particle-life': 5000,
  swarmalators: 5000,
};

/** Starting particle count applied when switching to a behavior. */
export const DEFAULT_PARTICLE_COUNTS: Record<BehaviorType, number> = {
  boids: 1000,
  'friends-enemies': 1000,
  'particle-life': 800,
  swarmalators: 400,
};

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showTrails: false,
  trailLength: 20,
  trailOpacity: 0.3,
  colorScheme: 'monochrome',
  particleRadius: 2,
  backgroundColor: '#ffffff',
  particleColor: '#000000',
  showArrows: false,
};

function makeDefaultMatrix(size: number, seed: number): number[][] {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff * 2 - 1;
  };
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => next())
  );
}

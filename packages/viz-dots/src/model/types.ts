/**
 * Type definitions for Swarm Dynamics visualizer.
 *
 * Scientific Status: Conceptual analogy / Standard toy model
 *
 * These are simplified agent-based models demonstrating emergence from
 * simple local rules. They are not faithful simulations of biological systems.
 *
 * Credits:
 * - Boids: Craig Reynolds (1987 SIGGRAPH)
 * - Friends & Enemies: Simon Woods (Wolfram Community)
 * - Particle Life: Inspired by Jeffrey Ventrella's Clusters and Tom Mohr's work
 * - Swarmalators: O'Keeffe, Hong & Strogatz (2017)
 */

import type { SeededRandom } from '@viz/core-math';

/**
 * A single particle in the simulation.
 */
export interface Particle {
  /** Unique identifier */
  id: number;
  /** Position x */
  x: number;
  /** Position y */
  y: number;
  /** Velocity x */
  vx: number;
  /** Velocity y */
  vy: number;
  /** Particle type (for multi-type behaviors like Particle Life) */
  type: number;
  /** Phase angle for swarmalators (-PI to PI) */
  phase?: number;
  /** Friend particle index (for friends/enemies) */
  friendId?: number;
  /** Enemy particle index (for friends/enemies) */
  enemyId?: number;
}

/**
 * Behavior types supported by the visualizer.
 */
export type BehaviorType =
  | 'boids'
  | 'friends-enemies'
  | 'particle-life'
  | 'swarmalators';

/**
 * Topology types for boundary handling.
 *
 * Named by which axes wrap:
 * - bounded: No wrapping, hard walls on all edges
 * - torus: Wrap both X and Y axes
 * - cylinder-x: Wrap X axis only (cylinder around Y)
 * - cylinder-y: Wrap Y axis only (cylinder around X)
 * - mobius-x: Wrap X axis with Y flip (twist around Y)
 * - mobius-y: Wrap Y axis with X flip (twist around X)
 */
export type TopologyType =
  | 'bounded'      // Hard walls, particles bounce
  | 'plane'        // No wrap, no bounce: for self-bounding models (F&E, swarmalators)
  | 'torus'        // Wrap both axes
  | 'cylinder-x'   // Wrap X axis only (horizontal cylinder)
  | 'cylinder-y'   // Wrap Y axis only (vertical cylinder)
  | 'mobius-x'     // Wrap X axis with Y flip
  | 'mobius-y';    // Wrap Y axis with X flip

/**
 * Common configuration shared across all behaviors.
 */
export interface DotsConfig {
  /** Number of particles */
  numParticles: number;
  /** Behavior type */
  behavior: BehaviorType;
  /** World width in pixels */
  width: number;
  /** World height in pixels */
  height: number;
  /** Boundary topology */
  topology: TopologyType;
  /** @deprecated Use topology instead */
  wrap?: boolean;
  /** Random seed for reproducibility */
  seed: number;
  /** Behavior-specific parameters */
  behaviorParams: BehaviorParams;
}

/**
 * Boids parameters (Craig Reynolds, 1987).
 *
 * Three simple rules create realistic flocking:
 * - Separation: avoid crowding neighbors
 * - Alignment: steer toward average heading of neighbors
 * - Cohesion: steer toward center of mass of neighbors
 */
export interface BoidsParams {
  type: 'boids';
  /** Maximum particle speed (pixels per frame) */
  maxSpeed: number;
  /** Weight for separation force */
  separationWeight: number;
  /** Radius for separation detection */
  separationRadius: number;
  /** Weight for alignment force */
  alignmentWeight: number;
  /** Radius for alignment detection */
  alignmentRadius: number;
  /** Weight for cohesion force */
  cohesionWeight: number;
  /** Radius for cohesion detection */
  cohesionRadius: number;
  /** Turn factor at edges (when not wrapping) */
  turnFactor: number;
}

/**
 * Friends & Enemies parameters (Simon Woods, Wolfram Community).
 *
 * Each particle picks one friend and one enemy randomly.
 * Update rule: x' = friction * x + friendWeight * f - enemyWeight * e
 *
 * Despite this trivial rule, beautiful structures emerge:
 * rings, cliques, and chaotic dances.
 */
export interface FriendsEnemiesParams {
  type: 'friends-enemies';
  /** Friction/decay factor (0.995 in original) */
  friction: number;
  /** Friend attraction weight (0.02 in original) */
  friendWeight: number;
  /** Enemy avoidance weight (0.01 in original) */
  enemyWeight: number;
  /**
   * Expected rewiring events per frame (~0.1 in Woods original).
   * Each event picks ONE dancer and reassigns both friend and enemy.
   * This is NOT per-particle probability - it's a global event rate.
   */
  rewireRate: number;
  /**
   * Friend-graph topology.
   * 'random': random functional graph -> many small cycles -> orbiting cliques
   * 'cycle': friend of i is (i+1) mod n -> one giant pursuit loop -> the
   *          flowing rotating ribbon (dots.morgaes.is default)
   */
  friendMode?: 'random' | 'cycle';
}

/**
 * Particle Life parameters.
 *
 * Multiple particle types with attraction/repulsion matrix.
 * Type A might be attracted to B but repelled by C.
 * Creates surprisingly lifelike emergent "creatures".
 *
 * Inspired by Jeffrey Ventrella's Clusters and Tom Mohr's work.
 */
export interface ParticleLifeParams {
  type: 'particle-life';
  /** Number of distinct particle types */
  numTypes: number;
  /** Attraction matrix [i][j] = force of type j on type i, in [-1, 1] */
  attractionMatrix: number[][];
  /** Interaction radius */
  interactionRadius: number;
  /** Friction coefficient (velocity decay) */
  friction: number;
}

/**
 * Swarmalators parameters (O'Keeffe, Hong & Strogatz, 2017).
 *
 * Oscillators that sync and swarm: spatial aggregation is coupled
 * to phase. Particles in-phase attract; out-of-phase repel.
 * Creates beautiful wave structures and synchronized rings.
 */
export interface SwarmalatorsParams {
  type: 'swarmalators';
  /** Spatial attraction/repulsion strength */
  J: number;
  /** Phase coupling strength */
  K: number;
  /** Natural frequency variance */
  omegaVariance: number;
  /**
   * Initialization mode:
   * - 'scattered': Random positions and phases (default)
   * - 'rainbow_ring': Ring formation with phases matching angular position
   */
  initMode?: 'scattered' | 'rainbow_ring';
}

export type BehaviorParams =
  | BoidsParams
  | FriendsEnemiesParams
  | ParticleLifeParams
  | SwarmalatorsParams;

/**
 * Complete simulation state.
 */
export interface DotsState {
  /** Current simulation frame */
  frame: number;
  /** All particles */
  particles: Particle[];
  /** Trail history for each particle (for rendering trails) */
  trails?: Array<Array<{ x: number; y: number }>>;
}

/**
 * Computed metrics for display.
 */
export interface DotsMetrics {
  /** Current frame number */
  frame: number;
  /** Average speed of all particles */
  avgSpeed: number;
  /** Order parameter (alignment) for boids: 0 = chaos, 1 = aligned */
  orderParameter?: number;
  /** Approximate number of clusters */
  clusterCount?: number;
  /** Phase synchronization for swarmalators: 0 = async, 1 = sync */
  phaseSynchronization?: number;
}

/**
 * User interaction state.
 */
export interface Interaction {
  /** Type of interaction */
  type: 'attract' | 'repel' | 'none';
  /** Interaction center x */
  x: number;
  /** Interaction center y */
  y: number;
  /** Interaction strength */
  strength: number;
  /** Whether interaction is currently active */
  active: boolean;
}

/**
 * Rendering options.
 */
export interface RenderOptions {
  /** Show particle trails */
  showTrails: boolean;
  /** Trail length in frames */
  trailLength: number;
  /** Trail opacity (0-1) */
  trailOpacity: number;
  /** How to color particles */
  colorScheme: 'type' | 'speed' | 'phase' | 'monochrome';
  /** Particle radius in pixels */
  particleRadius: number;
  /** Background color */
  backgroundColor: string;
  /** Particle color (for monochrome) */
  particleColor: string;
  /** Render as arrows (triangles pointing in velocity direction) */
  showArrows: boolean;
}

/**
 * Default configuration values.
 * Note: seed should be randomized on first load in the view.
 */
export const DEFAULT_CONFIG: DotsConfig = {
  numParticles: 600,
  behavior: 'boids',
  width: 800,
  height: 600,
  topology: 'torus',
  seed: Math.floor(Math.random() * 1000000), // Random seed by default
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
};

/**
 * Maximum particle counts per behavior to maintain performance.
 */
export const MAX_PARTICLES: Record<string, number> = {
  'boids': 1000,
  'friends-enemies': 1000,
  'particle-life': 2000,
  'swarmalators': 500,
};

/**
 * Default behavior parameters.
 * These are the canonical defaults - used by dropdown switching, Default presets,
 * and reset. Tests should reference these rather than duplicating values.
 */
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
  rewireRate: 0.1,
  friendMode: 'random',  // Woods original: random friends
};

export const DEFAULT_PARTICLE_LIFE_PARAMS: ParticleLifeParams = {
  type: 'particle-life',
  numTypes: 6,
  attractionMatrix: [], // Generated on use - see generateRandomMatrix
  interactionRadius: 80,
  friction: 0.15,
};

export const DEFAULT_SWARMALATOR_PARAMS: SwarmalatorsParams = {
  type: 'swarmalators',
  J: 1.0,
  K: 0.5,
  omegaVariance: 0,
};

/**
 * Default rendering options: white background, black dots.
 * Arrows only enabled for boids.
 */
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

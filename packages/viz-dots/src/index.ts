/**
 * Swarm Dynamics Visualizer
 *
 * Published/toy-model implementations:
 * - Boids (Reynolds, 1987)
 * - Friends & Enemies (Woods; Kirma ribbon variant)
 * - Particle Life (Tom Mohr force profile)
 * - Swarmalators (O'Keeffe, Hong & Strogatz 2017;
 *   Ceron, O'Keeffe & Petersen 2023)
 */
export type {
  Particle,
  BehaviorType,
  TopologyType,
  DotsConfig,
  DotsState,
  DotsMetrics,
  Interaction,
  RenderOptions,
  BoidsParams,
  FriendsEnemiesParams,
  ParticleLifeParams,
  SwarmalatorsParams,
  SwarmalatorModel,
  NaturalFrequencyMode,
  BehaviorParams,
} from './model/types';

export {
  DEFAULT_CONFIG,
  DEFAULT_RENDER_OPTIONS,
  DEFAULT_BOIDS_PARAMS,
  DEFAULT_FRIENDS_ENEMIES_PARAMS,
  DEFAULT_PARTICLE_LIFE_PARAMS,
  DEFAULT_SWARMALATOR_PARAMS,
  MAX_PARTICLES,
} from './model/types';

export { DotsModel } from './model/DotsModel';
export { SpatialHash } from './model/spatial';

export {
  Behavior,
  BoidsBehavior,
  FriendsEnemiesBehavior,
  ParticleLifeBehavior,
  SwarmalatorsBehavior,
  createBehavior,
  generateAttractionMatrix,
} from './model/behaviors';
export { particleLifeForce } from './model/behaviors/ParticleLifeBehavior';

export { DotsSimulation } from './sim/DotsSimulation';
export { DotsView, DotsCanvas, DotsControls } from './views';
export { CONTENT } from './content';
export { PRESETS, type Preset } from './presets';
export { DotsView as default } from './views';

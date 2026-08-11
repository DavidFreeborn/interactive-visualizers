/**
 * Swarm Dynamics Visualizer
 *
 * Interactive visualization of emergent behavior from simple rules.
 *
 * Scientific Status: Conceptual analogy / Standard toy model
 *
 * Behaviors:
 * - Boids (Craig Reynolds, 1987) - flocking/murmuration
 * - Friends & Enemies (Simon Woods, Wolfram Community) - social dynamics
 * - Particle Life (Ventrella, Mohr) - multi-type interactions
 * - Swarmalators (O'Keeffe, Hong & Strogatz, 2017) - phase-coupled swarms
 *
 * @packageDocumentation
 */

// Types
export type {
  Particle,
  BehaviorType,
  DotsConfig,
  DotsState,
  DotsMetrics,
  Interaction,
  RenderOptions,
  BoidsParams,
  FriendsEnemiesParams,
  ParticleLifeParams,
  SwarmalatorsParams,
  BehaviorParams,
} from './model/types';

export {
  DEFAULT_CONFIG,
  DEFAULT_RENDER_OPTIONS,
} from './model/types';

// Model
export { DotsModel } from './model/DotsModel';
export { SpatialHash } from './model/spatial';

// Behaviors
export {
  Behavior,
  BoidsBehavior,
  FriendsEnemiesBehavior,
  ParticleLifeBehavior,
  SwarmalatorsBehavior,
  createBehavior,
  generateAttractionMatrix,
} from './model/behaviors';

// Simulation
export { DotsSimulation } from './sim/DotsSimulation';

// Views
export { DotsView, DotsCanvas, DotsControls } from './views';

// Content
export { CONTENT } from './content';

// Presets
export { PRESETS, type Preset } from './presets';

// Default export
export { DotsView as default } from './views';

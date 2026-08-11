/**
 * Behavior registry and factory.
 *
 * Credits:
 * - Boids: Craig Reynolds (1987 SIGGRAPH)
 * - Friends & Enemies: Simon Woods (Wolfram Community)
 * - Particle Life: Jeffrey Ventrella, Tom Mohr
 * - Swarmalators: O'Keeffe, Hong & Strogatz (2017)
 */

export { Behavior } from './Behavior';
export { BoidsBehavior } from './BoidsBehavior';
export { FriendsEnemiesBehavior } from './FriendsEnemiesBehavior';
export { ParticleLifeBehavior, generateAttractionMatrix } from './ParticleLifeBehavior';
export { SwarmalatorsBehavior } from './SwarmalatorsBehavior';

import type { DotsConfig, BehaviorParams } from '../types';
export type { BehaviorParams } from '../types';
import { Behavior } from './Behavior';
import { BoidsBehavior } from './BoidsBehavior';
import { FriendsEnemiesBehavior } from './FriendsEnemiesBehavior';
import { ParticleLifeBehavior } from './ParticleLifeBehavior';
import { SwarmalatorsBehavior } from './SwarmalatorsBehavior';

/**
 * Create a behavior instance from configuration.
 */
export function createBehavior(config: DotsConfig): Behavior<BehaviorParams> {
  const params = config.behaviorParams;

  switch (params.type) {
    case 'boids':
      return new BoidsBehavior(params, config);
    case 'friends-enemies':
      return new FriendsEnemiesBehavior(params, config);
    case 'particle-life':
      return new ParticleLifeBehavior(params, config);
    case 'swarmalators':
      return new SwarmalatorsBehavior(params, config);
    default:
      throw new Error(`Unknown behavior type: ${(params as BehaviorParams).type}`);
  }
}

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

export function createBehavior(config: DotsConfig): Behavior<BehaviorParams> {
  const params = config.behaviorParams;
  switch (params.type) {
    case 'boids': return new BoidsBehavior(params, config);
    case 'friends-enemies': return new FriendsEnemiesBehavior(params, config);
    case 'particle-life': return new ParticleLifeBehavior(params, config);
    case 'swarmalators': return new SwarmalatorsBehavior(params, config);
  }
}

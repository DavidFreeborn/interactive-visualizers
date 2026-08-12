/**
 * Simon Woods' Friends & Enemies map.
 *
 * In model coordinates:
 *   x' = 0.995 x + 0.02 f(friend) - 0.01 f(enemy)
 *   f(a) = (a - x) / (0.01 + |a - x|)
 *
 * The implementation translates the origin to canvas centre and uses
 * U=min(width,height)/4 pixels per model unit. It is a first-order map,
 * not an acceleration model.
 */
import type { SeededRandom } from '@viz/core-math';
import type {
  Particle,
  DotsConfig,
  FriendsEnemiesParams,
  DotsMetrics,
  Interaction,
} from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

export class FriendsEnemiesBehavior extends Behavior<FriendsEnemiesParams> {
  readonly integrationMode = 'first-order' as const;

  constructor(params: FriendsEnemiesParams, config: DotsConfig) {
    super(params, config);
  }

  private unit(): number {
    return Math.min(this.config.width, this.config.height) / 4;
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    const n = particles.length;
    const cx = this.config.width / 2;
    const cy = this.config.height / 2;
    const U = this.unit();
    const mode = this.params.friendMode ?? 'random';

    for (let i = 0; i < n; i++) {
      const p = particles[i];
      // Both Woods' original and Kirma's chained-friend variant start from
      // independent uniform coordinates in [-1,1]^2.
      p.x = cx + U * (2 * rng.random() - 1);
      p.y = cy + U * (2 * rng.random() - 1);
      p.vx = 0;
      p.vy = 0;
      p.type = 0;
      p.friendId = mode === 'cycle' ? (i + 1) % n : rng.randInt(0, n - 1);
      p.enemyId = rng.randInt(0, n - 1);
    }
  }

  computeForces(
    particles: Particle[],
    _spatialIndex: SpatialHash,
    interaction: Interaction | null,
    _rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const U = this.unit();
    const cx = this.config.width / 2;
    const cy = this.config.height / 2;
    const eps = 0.01 * U;
    const friendStep = this.params.friendWeight * U;
    const enemyStep = this.params.enemyWeight * U;
    const contraction = this.params.friction - 1;

    return particles.map((p) => {
      const friend = particles[p.friendId!];
      const enemy = particles[p.enemyId!];

      const fdx = friend.x - p.x;
      const fdy = friend.y - p.y;
      const fd = Math.hypot(fdx, fdy);
      const edx = enemy.x - p.x;
      const edy = enemy.y - p.y;
      const ed = Math.hypot(edx, edy);

      let dx = contraction * (p.x - cx)
        + friendStep * fdx / (eps + fd)
        - enemyStep * edx / (eps + ed);
      let dy = contraction * (p.y - cy)
        + friendStep * fdy / (eps + fd)
        - enemyStep * edy / (eps + ed);

      if (interaction?.active) {
        const ix = interaction.x - p.x;
        const iy = interaction.y - p.y;
        const d = Math.hypot(ix, iy);
        if (d > 1 && d < 150) {
          const s = interaction.strength * (1 - d / 150) * 5;
          const sign = interaction.type === 'attract' ? 1 : -1;
          dx += sign * ix / d * s;
          dy += sign * iy / d * s;
        }
      }

      return { ax: dx, ay: dy };
    });
  }

  postStep(particles: Particle[], rng: SeededRandom): void {
    const n = particles.length;
    if (n === 0) return;
    const mode = this.params.friendMode ?? 'random';
    const rate = Math.max(0, this.params.rewireRate);

    let events = Math.floor(rate);
    if (rng.random() < rate - events) events++;

    for (let e = 0; e < events; e++) {
      const p = particles[rng.randInt(0, n - 1)];
      if (mode === 'random') p.friendId = rng.randInt(0, n - 1);
      p.enemyId = rng.randInt(0, n - 1);
    }
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) return { avgSpeed: 0 };
    let sum = 0;
    for (const p of particles) sum += Math.hypot(p.vx, p.vy);
    return { avgSpeed: sum / particles.length };
  }
}

/**
 * Friends & Enemies Behavior
 *
 * Original concept by Simon Woods (Wolfram Community, 2014)
 * https://community.wolfram.com/groups/-/m/t/122095
 *
 * EXACT ALGORITHM (in model units):
 *   x' = 0.995 * x + 0.02 * f(friend) - 0.01 * f(enemy)
 *   f(a) = (a - x) / (0.01 + |a - x|)
 *
 * VERIFIED GROUND TRUTH (headless numpy simulation of these exact equations,
 * n=1000, 8000 steps):
 *   - Never collapses. Swarm equilibrates at R_rms ~ 1.0, R_max ~ 1.6 units.
 *   - Step size (0.02) is ~2% of swarm radius. THE SCALE RELATIONSHIP IS THE
 *     WHOLE GAME: previous implementations used unit = min(w,h) = 600 px,
 *     giving 12 px steps against a ~200 px swarm (6x too coarse), so the
 *     delicate pursuit structures were destroyed every frame.
 *   - Friend-graph topology decides the aesthetics:
 *       random friends -> random functional graph -> many small cycles ->
 *         tight orbiting cliques near the center (|L| ~ 0.002, blobby)
 *       cycle friends (friend of i = i+1 mod n) -> one giant pursuit loop ->
 *         the flowing rotating ribbon (|L| ~ 0.007, 3-4x rotation, more open
 *         structure). This is what dots.morgaes.is uses by default
 *         (friendDraft = "(i + 1) % n" in its URL).
 *   - Enemy rewiring (morgaes rewire=0.1) adds energy: mean speed +40%,
 *     structures stay open. Friend rewiring in cycle mode would destroy the
 *     cycle, so cycle mode rewires enemies only.
 *
 * TOPOLOGY: this is a self-bounding PLANE model. The 0.995 contraction toward
 * a fixed origin is the container. It must NOT be combined with torus wrapping
 * (wrapping makes the contraction direction discontinuous at the seam and the
 * friend vectors are unwrapped, so followers teleport) and must NOT be
 * combined with wall bouncing (the equilibrium fights the walls and particles
 * pin in corners). Use topology 'plane' (no wrap, no bounce).
 *
 * SCALE: 1 model unit = min(width, height) / 4 pixels. With a 600 px canvas:
 * friendStep = 3 px, enemyStep = 1.5 px, epsilon = 1.5 px, ring radius
 * ~130-240 px. Occasional outliers (R_max ~ 2.9 at small n in random mode)
 * may briefly clip the canvas edge and contract back; this is correct.
 */

import type { SeededRandom } from '@viz/core-math';
import type { Particle, DotsConfig, FriendsEnemiesParams, DotsMetrics, Interaction } from '../types';
import type { SpatialHash } from '../spatial';
import { Behavior } from './Behavior';

export class FriendsEnemiesBehavior extends Behavior<FriendsEnemiesParams> {
  constructor(params: FriendsEnemiesParams, config: DotsConfig) {
    super(params, config);
  }

  /** Pixels per model unit. Calibrated so R_max (~1.6 units) fits the canvas. */
  private unit(): number {
    return Math.min(this.config.width, this.config.height) / 4;
  }

  initialize(particles: Particle[], rng: SeededRandom): void {
    const n = particles.length;
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const U = this.unit();
    const mode = this.params.friendMode ?? 'random';

    for (let i = 0; i < n; i++) {
      const p = particles[i];

      if (mode === 'cycle') {
        // Cycle/Ribbon mode: disk initialization for aesthetic reasons
        const angle = rng.random() * Math.PI * 2;
        const r = U * Math.sqrt(rng.random());
        p.x = centerX + Math.cos(angle) * r;
        p.y = centerY + Math.sin(angle) * r;
        // One giant pursuit cycle: the "ribbon" configuration
        p.friendId = (i + 1) % n;
      } else {
        // Random/Classic mode: Woods-exact square initialization [-1,1]^2
        p.x = centerX + U * (2 * rng.random() - 1);
        p.y = centerY + U * (2 * rng.random() - 1);
        // Self-selection allowed, as in Woods' original. A self-friend produces
        // a zero-length vector; the soft normalization maps it to zero force.
        p.friendId = rng.randInt(0, n - 1);
      }

      p.vx = 0;
      p.vy = 0;
      p.type = 0;

      // Self-selection allowed for enemy too (harmless, same reasoning)
      p.enemyId = rng.randInt(0, n - 1);
    }
  }

  computeForces(
    particles: Particle[],
    _spatialIndex: SpatialHash,
    interaction: Interaction | null,
    _rng: SeededRandom
  ): Array<{ ax: number; ay: number }> {
    const forces: Array<{ ax: number; ay: number }> = [];
    const originX = this.config.width / 2;
    const originY = this.config.height / 2;

    const U = this.unit();
    const friendStep = this.params.friendWeight * U; // 0.02 * 150 = 3 px
    const enemyStep = this.params.enemyWeight * U;   // 0.01 * 150 = 1.5 px
    const epsilon = 0.01 * U;                        // soft-normalization, 1.5 px
    const friction = this.params.friction;           // 0.995

    for (const p of particles) {
      const friend = particles[p.friendId!];
      const enemy = particles[p.enemyId!];

      // f(a) = (a - x) / (epsilon + |a - x|): a SOFT direction, magnitude < 1,
      // vanishing smoothly at zero distance. Do not replace with a unit vector.
      const tfx = friend.x - p.x;
      const tfy = friend.y - p.y;
      const tfd = Math.sqrt(tfx * tfx + tfy * tfy);
      const ffx = tfx / (epsilon + tfd);
      const ffy = tfy / (epsilon + tfd);

      const tex = enemy.x - p.x;
      const tey = enemy.y - p.y;
      const ted = Math.sqrt(tex * tex + tey * tey);
      const efx = tex / (epsilon + ted);
      const efy = tey / (epsilon + ted);

      // x' = friction*(x - origin) + origin + friendStep*f - enemyStep*e
      // As a position delta:
      let deltaX = (friction - 1) * (p.x - originX) + friendStep * ffx - enemyStep * efx;
      let deltaY = (friction - 1) * (p.y - originY) + friendStep * ffy - enemyStep * efy;

      // User interaction (added as a displacement, same first-order semantics)
      if (interaction?.active) {
        const ix = interaction.x - p.x;
        const iy = interaction.y - p.y;
        const id = Math.sqrt(ix * ix + iy * iy);
        if (id > 1 && id < 150) {
          const s = interaction.strength * (1 - id / 150) * 5;
          const dir = interaction.type === 'attract' ? 1 : -1;
          deltaX += (ix / id) * s * dir;
          deltaY += (iy / id) * s * dir;
        }
      }

      // First-order dynamics: velocity IS the delta. a = delta - v makes the
      // integrator (v += a; x += v) apply exactly x += delta with no inertia.
      forces.push({ ax: deltaX - p.vx, ay: deltaY - p.vy });
    }

    return forces;
  }

  postStep(particles: Particle[], rng: SeededRandom): void {
    const n = particles.length;
    const mode = this.params.friendMode ?? 'random';
    const rewireRate = this.params.rewireRate ?? 0.1;

    // Woods' rewiring: expected `rewireRate` events per frame.
    // Each event picks ONE dancer and reassigns both friend and enemy together.
    // This is ~100x less frequent than per-particle Bernoulli at similar nominal rates.

    // Use Poisson-ish process: for small rates, prob of at least one event ≈ rate
    // For rates > 1, do floor(rate) guaranteed plus fractional chance of one more
    let numEvents = Math.floor(rewireRate);
    if (rng.random() < (rewireRate - numEvents)) {
      numEvents++;
    }

    for (let e = 0; e < numEvents; e++) {
      const i = rng.randInt(0, n - 1);
      const p = particles[i];

      // In cycle mode, the friend cycle IS the structure; only rewire enemy
      if (mode !== 'cycle') {
        // Self-selection allowed, as in Woods' original. A self-friend produces
        // a zero-length vector; the soft normalization f(a) = (a-x)/(ε+|a-x|)
        // maps it to zero force, so it's harmless.
        p.friendId = rng.randInt(0, n - 1);
      }
      p.enemyId = rng.randInt(0, n - 1);
    }
  }

  computeMetrics(particles: Particle[]): Partial<DotsMetrics> {
    if (particles.length === 0) return { avgSpeed: 0 };
    let speedSum = 0;
    for (const p of particles) {
      speedSum += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    }
    return { avgSpeed: speedSum / particles.length };
  }
}

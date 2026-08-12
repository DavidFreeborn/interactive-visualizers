export const CONTENT = {
  title: 'Swarm Dynamics',
  behaviors: {
    boids: {
      name: 'Boids',
      description: `Each frame, a boid combines three steering rules over nearby visible neighbours:

1. Separation: steer away from neighbours within the separation radius. Repulsion is strongest at close range and fades linearly to zero at that radius.
   contribution ∝ -direction_to_neighbour × (1 - distance / separation_radius)

2. Alignment: steer toward the average velocity of neighbours within the alignment radius.
   contribution ∝ average_neighbour_velocity - own_velocity

3. Cohesion: steer toward the local centre of mass of neighbours within the cohesion radius, more strongly when farther from it.
   contribution ∝ direction_to_local_centre × distance_to_local_centre

A roughly 270° field of view excludes neighbours directly behind. The summed contributions get a small random perturbation, light drag, and a constrained cruising speed range. "Vision radius" sets the overall interaction scale.

On a torus, neighbours interact across wrapped edges; with bounded or cylindrical boundaries, boids also steer away from non-wrapping edges.

No boid knows the shape or direction of the whole flock: flocking, splitting, merging and collective turns emerge entirely from repeated local interactions.`,
      credit: 'Craig Reynolds (1987)',
    },
    'friends-enemies': {
      name: 'Friends & Enemies',
      description: `Simon Woods map (first-order):

x' = 0.995 x + 0.02 f(friend) - 0.01 f(enemy)
f(a) = (a - x)/(0.01 + |a - x|)

The canvas implementation translates the origin to the centre and uses one model unit = min(width,height)/4 pixels.

Default (Woods original configuration):
• 1000 dancers
• independent uniform initial x,y in [-1,1]
• random friend and enemy, self-selection allowed
• event probability 99/1000 per frame
• one event rewires both relationships of one dancer

Ribbon Dance is the separate chained-friend variant: friend[i]=i+1 mod n, with fixed random enemies.

The topology is fixed to the plane; the 0.995 contraction is the bounding mechanism.`,
      credit: 'Simon Woods; ribbon variant by Jari Kirma (Wolfram Community)',
    },
    'particle-life': {
      name: 'Particle Life',
      description: `Tom Mohr force profile:

Let r = distance / interaction radius and r_min = 0.3.

if r < r_min:
  force = r/r_min - 1
else:
  force = A[i,j] * (1 - |1+r_min-2r|/(1-r_min))

The close-range core always repels. Outside it, the directed attraction matrix A[i,j] controls a triangular attraction/repulsion band that returns to zero at the interaction cutoff.

The matrix is asymmetric: type i can attract j while j repels i. Changing the number of types regenerates the matrix deterministically from the displayed seed.`,
      credit: 'Particle Life / Tom Mohr',
    },
    swarmalators: {
      name: 'Swarmalators',
      description: `Two published models

Classic (2017): O'Keeffe, Hong & Strogatz
  xdot_i = (1/N) Σ[u_ij(1 + J cos Δθ) - u_ij/r_ij]
  θdot_i = ω_i + (K/N) Σ[sin Δθ/r_ij]

Canonical identical-agent states use ω=0. Rainbow Ring, Splintered Wave and Spinning Rainbow are the phase-wave states; Static Sync and Static Async are intentionally static.

Diverse / chiral (2023): Ceron, O'Keeffe & Petersen
Adds:
• F1-F4 natural-frequency distributions
• inherent circular motion c_i n_i
• optional frequency-coupling offsets Q_xdot and Q_thetadot
• finite-range coupling σ

The 2023 presets here use parameter combinations explicitly stated in the paper for vortex arrays, locally coupled slime-mold-like states, and gas/multiple/flocking vortices.

Metrics:
Z = ordinary Kuramoto phase synchrony
S = max(|S+|,|S-|), circumferential space-phase order

The topology is fixed to the plane.`,
      credit: "O'Keeffe, Hong & Strogatz (2017); Ceron, O'Keeffe & Petersen (2023)",
    },
  },
};

export default CONTENT;

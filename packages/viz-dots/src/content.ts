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

The "Separation", "Alignment" and "Cohesion" sliders scale the corresponding contributions. "Vision radius" sets the cohesion radius; the alignment and separation radii are locked to 0.75 and 0.25 times it. A roughly 270° field of view excludes neighbours directly behind.

The summed contributions receive a small random perturbation and light drag, and speed is kept in a cruising range between half of "Max speed" and "Max speed".

On a torus, neighbours interact across wrapped edges; with bounded or cylindrical boundaries, boids also steer away from non-wrapping edges.

No boid knows the shape or direction of the whole flock: flocking, splitting, merging and collective turns emerge entirely from repeated local interactions.`,
      credit: 'Craig Reynolds (1987)',
    },
    'friends-enemies': {
      name: 'Friends & Enemies',
      description: `Simon Woods map (first-order). Each dancer has one friend and one enemy:

x' = c x + w_f f(friend) - w_e f(enemy)
f(a) = (a - x)/(0.01 + |a - x|)

"Friend pull" sets w_f and "Enemy push" sets w_e; Woods' original values are 0.02 and 0.01. The contraction c = 0.995 is fixed rather than adjustable. The canvas implementation translates the origin to the centre and uses one model unit = min(width,height)/4 pixels.

"Friend graph" chooses who follows whom: random assignment (Woods) or a single chained pursuit cycle with friend[i] = i+1 mod n (the ribbon variant). "Rewire rate" is the expected number of rewiring events per frame. Each event picks one dancer and reassigns both relationships; in cycle mode only the enemy is reassigned, so the pursuit cycle survives.

Default (Woods original configuration):
• 1000 dancers
• independent uniform initial x,y in [-1,1]
• random friend and enemy, self-selection allowed
• rewire rate 0.099

Ribbon Dance is the chained-friend variant: 2000 dancers, fixed random enemies, no rewiring.

The topology is fixed to the plane; the contraction is the bounding mechanism.`,
      credit: 'Simon Woods; ribbon variant by Jari Kirma (Wolfram Community)',
    },
    'particle-life': {
      name: 'Particle Life',
      description: `Each particle carries one of N types, shown as its colour; "Types" sets N. Interactions are governed by an N × N matrix A with one entry per ordered pair of types, drawn uniformly from [-1, 1]: A[i,j] sets how type i responds to type j, with positive values attracting and negative values repelling. Because A[i,j] and A[j,i] are independent, one type can chase another that flees it; these asymmetries produce the lifelike moving structures.

Tom Mohr force profile, with r = distance / "Radius" and r_min = 0.3:

if r < r_min:
  force ∝ r/r_min - 1
else:
  force ∝ A[i,j] * (1 - |1+r_min-2r|/(1-r_min))

The close-range core always repels, whatever the matrix says. Outside it, A[i,j] scales a triangular attraction/repulsion band that returns to zero at the cutoff.

"Friction" damps every velocity each frame: higher values give slow, overdamped motion; lower values give livelier, more inertial structures.

Changing "Types" regenerates the matrix deterministically from the displayed seed.`,
      credit: 'Particle Life / Tom Mohr',
    },
    swarmalators: {
      name: 'Swarmalators',
      description: `Each dot carries a phase θ alongside its position; colour shows the phase. "Model" switches between two published models.

Classic (2017): O'Keeffe, Hong & Strogatz
  xdot_i = (1/N) Σ[u_ij(1 + J cos Δθ) - u_ij/r_ij]
  θdot_i = ω_i + (K/N) Σ[sin Δθ/r_ij]

"Spatial J" and "Phase K" are the J and K above. "Freq variance" draws each natural frequency ω_i uniformly from [-variance, +variance]; the canonical states use ω = 0. Rainbow Ring, Splintered Wave and Spinning Rainbow are the phase-wave states; Static Sync and Static Async are intentionally static.

Diverse / chiral (2023): Ceron, O'Keeffe & Petersen adds:
• "Frequencies": F1 gives every agent ω = +1; F2 splits the population between +1 and -1; F3 draws ω uniformly from [1, Ω]; F4 draws a magnitude from [1, Ω] with random sign. "Omega max" sets Ω.
• "Chiral inherent motion": each agent also travels around its own circle, in the direction given by the sign of its ω.
• "Frequency-coupling offsets": fixed phase offsets (the paper's Q terms) shift the coupling between counter-rotating pairs; this drives the vortex-array states.
• "Local coupling": only pairs closer than σ model units interact, with σ set by "Sigma". Unchecked, coupling is global.

The 2023 presets use parameter combinations explicitly stated in the paper for vortex arrays, locally coupled slime-mold-like states, and gas/multiple/flocking vortices.

Metrics:
Z = ordinary Kuramoto phase synchrony
S = max(|S+|,|S-|), circumferential space-phase order

The topology is fixed to the plane.`,
      credit: "O'Keeffe, Hong & Strogatz (2017); Ceron, O'Keeffe & Petersen (2023)",
    },
  },
};

export default CONTENT;

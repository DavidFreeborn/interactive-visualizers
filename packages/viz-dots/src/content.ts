/**
 * Content for the Swarm Dynamics visualizer.
 */

export const CONTENT = {
  title: 'Swarm Dynamics',

  behaviors: {
    boids: {
      name: 'Boids',
      description: `ALGORITHM: For each boid, sum three steering forces from visible neighbors:

1. SEPARATION (avoid crowding)
   force = sum of (self - neighbor) / distance^2
   Strength controlled by "Separation" slider

2. ALIGNMENT (match neighbor direction)
   force = (average_neighbor_velocity - self_velocity)
   Strength controlled by "Alignment" slider

3. COHESION (move toward neighbor center)
   force = direction toward center of neighbors
   Strength controlled by "Cohesion" slider

PARAMETERS:
  "Vision radius" sets how far each boid can see
  "Max Speed" limits velocity magnitude`,
      credit: 'Craig Reynolds (1987)',
    },

    'friends-enemies': {
      name: 'Friends & Enemies',
      description: `ALGORITHM: Each particle has one friend and one enemy.

POSITION UPDATE (first-order, per frame):
  x' = 0.995 * (x - origin) + origin
       + 0.02 * f(friend) - 0.01 * f(enemy)
  where f(a) = (a - x) / (epsilon + |a - x|)

The 0.995 contraction toward origin bounds the swarm.
f() is a soft direction that vanishes at zero distance.

FRIEND MODE (key to visual structure):
  "Cycle": friend[i] = i+1 mod n -> flowing ribbon
  "Random": random friends -> orbiting cliques

PARAMETERS:
  "Friend pull" (0.02): step fraction toward friend
  "Enemy push" (0.01): step fraction away from enemy
  "Rewire rate": expected rewiring events per frame (~0.1)
    Each event picks ONE dancer and reassigns relationships
  (In cycle mode, only enemies rewire to preserve structure)

TOPOLOGY: plane (self-bounding via contraction)`,
      credit: 'Simon Woods (Wolfram Community, 2014)',
    },

    'particle-life': {
      name: 'Particle Life',
      description: `ALGORITHM: Multiple particle types with attraction matrix A[i,j].

FOR each particle p of type i:
  FOR each neighbor q of type j within "Radius":
    IF too close: repel (prevents collapse)
    ELSE: force = A[i,j] * (1 - distance/radius)

ATTRACTION MATRIX (randomly generated):
  A[i,j] > 0: type i attracted to type j
  A[i,j] < 0: type i repelled by type j

PARAMETERS:
  "Types": number of particle types (colors)
  "Radius": interaction range
  "Friction": velocity decay (higher = more damping)

Different matrices produce different emergent ecosystems.`,
      credit: 'Jeffrey Ventrella, Tom Mohr',
    },

    swarmalators: {
      name: 'Swarmalators',
      description: `EQUATIONS (O'Keeffe, Hong & Strogatz 2017):

SPATIAL VELOCITY:
  dx/dt = (1/N) * sum[ u_ij * (1 + J*cos(th_j - th_i)) - u_ij / r_ij ]

  Three terms per pair:
    +1: baseline attraction (always pulls together)
    +J*cos(phase diff): phase-modulated attraction
    -1/r: short-range repulsion (prevents collapse)

PHASE EVOLUTION:
  dth/dt = omega + (K/N) * sum[ sin(th_j - th_i) / r_ij ]
  Distance-weighted Kuramoto coupling

THE FIVE CANONICAL STATES (all with omega = 0):
  Sync:           J=0.1, K=1    -> phases converge, static disc
  Async:          J=0.1, K=-1   -> phases diverge, static disc
  Rainbow Ring:   J=1,   K=0    -> annulus, phase = angle
  Splintered:     J=1,   K=-0.1 -> quivering clusters
  Spinning:       J=1,   K=-0.75-> perpetual circulation

Motion comes from NEGATIVE K, not frequency variance.
Static states are supposed to be static.

TOPOLOGY: plane (centroid conserved by antisymmetric forces)`,
      credit: "O'Keeffe, Hong & Strogatz (2017)",
    },
  },
};

export default CONTENT;

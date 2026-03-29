# Paper Note: Polarization and Factionalization for Agents with Many, Probabilistically Related Beliefs

**Author:** David Freeborn
**Format:** Slide deck (176 slides)
**Status:** Primary source (author's own presentation)

---

## Overview

Comprehensive treatment of belief polarization and factionalization for Bayesian agents with multiple beliefs represented as Bayesian networks. Covers definitions, structural conditions, propensity analysis via simulation, and factionalization as clustering.

## Model Type

**Standard toy model** - Uses standard Bayesian network formalism with well-defined updating rules. Provides both analytical conditions and Monte Carlo simulation results.

---

## Key Definitions

### Eight Cases of Belief Updating (2 agents)

Three binary dimensions yield 8 cases (A-H):

| Dimension | Condition | Formula |
|-----------|-----------|---------|
| Convergent | beliefs get closer | \|post_2 - post_1\| <= \|prior_2 - prior_1\| |
| Divergent | beliefs grow apart | \|post_2 - post_1\| > \|prior_2 - prior_1\| |
| Co-directional | both shift same way | (post_2 - prior_2) x (post_1 - prior_1) >= 0 |
| Contra-directional | shift opposite ways | (post_2 - prior_2) x (post_1 - prior_1) < 0 |
| Cisvergent | beliefs don't cross | (post_2 - post_1) x (prior_2 - prior_1) >= 0 |
| Transvergent | beliefs cross over | (post_2 - post_1) x (prior_2 - prior_1) < 0 |

### Polarization Criteria (ordered by strength)

1. **Belief divergence** (C, D, G, H) - dispersion increases
2. **Contra-directional updating** (E, F, G, H) - opposite directions
3. **Diverging contra-directional** (G, H) - both conditions
4. **Radicalization** (G only) - case G plus cisvergent (Jern et al. definition)

---

## Structural Conditions for Polarization

### Independence Condition

Using virtual node **beta** encoding agent differences:

**Contra-directional and transvergent updating require:**
1. D and beta are conditionally dependent given H
2. D and H are conditionally dependent given beta

### Structural Condition (d-separation based)

Both must hold:
1. D and beta are d-connected given H
2. D and H are d-connected given beta

**Key constraint:** Graphs with < 3 nodes NEVER satisfy this.

---

## d-Separation Algorithm

1. Construct ancestral graph of relevant variables
2. "Moralize" by marrying parents (undirected edges between co-parents)
3. "Disorient" by replacing directed with undirected edges
4. Remove given/conditioned variables
5. If variables still connected -> d-connected; otherwise -> d-separated

---

## Simulation Results: Propensity

### Node Number Effects (100,000 simulations per n=2..10)

- Belief divergence: ~40% even for 2-node graphs, increases with n
- Contra-directional: 0% for n<3, increases to ~20% at n=10
- Transvergent: similar pattern to contra-directional
- **Radicalization is ~50% of contra-directional cases** (constant across n)

### Graph Density Effects

- Belief divergence increases with density
- Contra-directional/transvergent peak at **intermediate density**
- Dense graphs have fewer exogenous nodes -> beta more easily screened off

---

## Factionalization

### Definition

**k-factionalization:** Population splits into k distinct belief clusters (beliefs become correlated across multiple propositions).

### k-means Clustering Approach

**k-distortion:** Sum of squared Euclidean distances from points to cluster centroids

**Classification:**
- **Convergence:** 1-distortion decreases
- **General divergence:** 1-distortion increases, k-distortions also increase
- **k-factionalization:** 1-distortion increases, but k-distortion decreases

### Population Simulation (1000 populations, 20 agents each)

- Most populations converge (decrease in all k-distortions)
- Among polarizing populations: most show k-factionalization, NOT general divergence
- Maximum factions bounded by 2^(n-1) where n = number of nodes

---

## Key Result: No General Divergence

When agents with shared conditional probabilities update on the same evidence:
- **Joint distributions must converge** (Freeborn 2024)
- If marginals diverge -> beliefs become correlated -> **factionalization, not general divergence**

---

## Visualizer Design Implications

### Strong candidate for polarization/factionalization visualizer family

**Required Views:**

1. **Bayesian Network Structure** - DAG with nodes H, D, S, etc.
2. **Agent Belief Scatter** - 2D/3D projection of agent beliefs (as in figures)
3. **Belief Trajectories** - animated evolution over timesteps
4. **Updating Case Indicator** - show which of 8 cases is occurring
5. **Clustering/Voronoi View** - k-means centroids and cells
6. **Metrics Panel** - k-distortions over time, variance, covariance
7. **d-Separation Walkthrough** - step-by-step visualization of algorithm

**Controls:**
- Network structure (chain/collider/custom)
- Number of agents
- Number of timesteps
- Evidence strength/schedule
- Which node receives evidence
- Initial belief distribution
- Number of clusters k for display
- Random seed
- Play/pause/step

**Outputs:**
- Classification (convergence / k-factionalization / divergence)
- Which updating cases occurred
- Distortion trajectories
- Structural condition satisfied (yes/no)

---

## Cautions for Visualization

1. **Idealized agents:** All share conditional probabilities, receive identical evidence
2. **k-means limitations:** Assumes roughly spherical clusters
3. **Small networks:** Simulations use n <= 10 nodes; real belief systems more complex
4. **One mechanism:** This shows structure-driven factionalization, not trust-based or information-access-based
5. **Correlation vs causation:** Factionalization shown is logical/probabilistic, not social

---

## Scientific Status Label

**Standard toy model** - Formal Bayesian network model with Monte Carlo validation. The d-separation analysis is exact. The simulation parameters (Ide-Cozman generation, uniform priors) are standard but not unique.

---

## Source Connections

- Extends: Jern et al. (2014) polarization conditions
- Related: Freeborn (2024) "Rational Factionalization" (joint convergence result)
- Related: DAGs_And_Polarization.pdf (structural condition focus)
- Background: Blackwell-Dubins theorem, Nielsen & Stewart (2021), Dorst (2022)
- Complements: O'Connor & Weatherall (2018) on non-rational polarization

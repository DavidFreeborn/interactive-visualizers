# Visualizer Specification: Factionalization & Polarization

---

## Overview

| Field | Value |
|-------|-------|
| **Family** | Factionalization & Polarization |
| **Scientific Status** | Standard toy model |
| **Source Basis** | Factionalization, DAGs_And_Polarization, Polarization_Factionalization |
| **Source Gaps** | None |
| **Implementation Priority** | Tier 1 |

---

## Purpose

Demonstrate how rational Bayesian agents with multiple probabilistically related beliefs can polarize and factionalize when updating on the same evidence. Show that factionalization (correlated beliefs across a population) arises naturally from network structure, not irrationality.

---

## Model Description

### Bayesian Network

```
G = (V, D)  where V = vertices (nodes), D = directed edges
```

Joint probability factorizes:
```
P(X_1,...,X_n) = product_i P(X_i | parents(X_i))
```

### Agent Agreement

Agents share:
- Set of propositions X
- Network structure G
- Conditional probability distributions

Agents differ only in:
- Probabilities assigned to exogenous variables

### Eight Updating Cases

| Case | Convergent | Co-directional | Cisvergent |
|------|------------|----------------|------------|
| A | yes | yes | yes |
| B | yes | yes | no |
| C | no | yes | yes |
| D | no | yes | no |
| E | yes | no | yes |
| F | yes | no | no |
| G | no | no | yes |
| H | no | no | no |

### Structural Condition for Polarization

Using virtual node beta:
1. D and beta are d-connected given H
2. D and H are d-connected given beta

---

## What Is Represented

- How network structure determines polarization possibility
- Belief trajectory evolution under Bayesian updating
- Factionalization as clustering phenomenon
- Distinction between polarization and factionalization

## What Is Omitted

- Trust dynamics
- Differential evidence access
- Cognitive biases
- Continuous beliefs (uses binary)
- Real-world complexity

## Risks of Misleading Representation

- Implying all polarization is rational
- Overgeneralizing from simple network structures
- Conflating toy model with complete explanation

---

## Controls

| Control | Type | Range | Default |
|---------|------|-------|---------|
| Network structure | Dropdown | Chain / Collider / Diamond / Custom | Collider |
| Number of agents | Slider | 2 - 50 | 20 |
| Number of timesteps | Slider | 1 - 100 | 20 |
| Likelihood ratio | Slider | 0.5 - 0.99 | 0.65 |
| Evidence node | Dropdown | [nodes in network] | D |
| Hypothesis node | Dropdown | [nodes in network] | H |
| Initial belief distribution | Dropdown | Uniform / Clustered / Bimodal | Uniform |
| Number of clusters (k) | Slider | 1 - 5 | 3 |
| Random seed | Number | any | random |
| Play/pause | Button | - | paused |
| Speed | Slider | 1x - 100x | 10x |

---

## Views

### 1. Bayesian Network Diagram

Graph showing:
- Nodes (H, S, D, etc.)
- Directed edges
- Conditional probability tables (expandable)

### 2. Agent Belief Space

2D/3D scatter plot:
- Axes: beliefs about different hypotheses
- Points: agents
- Color: cluster assignment
- Animated trajectories over time

### 3. Belief Trajectories

Animated arrows showing:
- Starting positions
- Evolution path
- Current positions
- Cluster formation

### 4. Clustering View

Voronoi cells showing:
- k-means cluster boundaries
- Centroids
- Agent assignments

### 5. Metrics Timeline

Line charts over time:
- 1-distortion (convergence/divergence)
- k-distortion for k = 2, 3, ...
- Variance / absolute covariance
- JS divergences (marginal vs joint)

### 6. d-Separation Walkthrough

Step-by-step visualization:
- Ancestral graph
- Moralized graph
- Disoriented graph
- After conditioning
- d-connection result

---

## Metrics / Outputs

| Metric | Description |
|--------|-------------|
| 1-distortion | Overall spread (convergence indicator) |
| k-distortion | Fit to k clusters |
| Classification | Convergence / k-factionalization / divergence |
| Variance | Belief spread on single hypothesis |
| Absolute covariance | Cross-hypothesis correlation |
| Updating case | Which of 8 cases (for 2 agents) |

---

## Likely UI Structure

```
+-----------------------------------------------------+
|  Factionalization & Polarization                    |
|  [Standard Toy Model]                               |
+---------------------------------+-------------------+
|  [Network] [Beliefs] [Cluster]  |  Controls         |
|                                 |  - Network type   |
|  [Main Visualization Area]      |  - # agents       |
|                                 |  - # timesteps    |
|                                 |  - Likelihood     |
|                                 |  --------------   |
|                                 |  [> Play] [||]    |
+---------------------------------+-------------------+
|  Metrics: Step 15/20 | 1-dist: 1.32 | Case: G       |
+-----------------------------------------------------+
|  [What This Shows v] [What This Does NOT Show v]    |
+-----------------------------------------------------+
```

---

## Testing Requirements

### Model Tests

- Bayesian update correctness
- d-separation algorithm
- k-means clustering
- Metric calculations

### Simulation Tests

- Reproducibility
- Convergence in chain networks
- Factionalization in collider networks
- Reset behavior

### Statistical Tests

- Convergence rate matches paper results
- Factionalization prevalence matches paper

---

## Minimum Viable Version

- Fixed network structures (chain, collider)
- 2 agents
- Belief space visualization
- Trajectory animation
- Basic metrics (variance)
- Updating case indicator

---

## Stretch Version

- Population (20+ agents)
- k-means clustering view
- Multiple k values
- Custom network editor
- d-separation walkthrough
- Full metric suite
- Comparison mode (different structures)

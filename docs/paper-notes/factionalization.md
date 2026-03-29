# Paper Note: Rational Factionalization for Agents with Probabilistically Related Beliefs

**Author:** David Peter Wallis Freeborn
**Status:** Primary source (author's own paper)

---

## Core Question

How does epistemic **factionalization** (multiple beliefs becoming correlated across a population) arise for rational Bayesian agents who share the same evidence but differ in initial beliefs?

## Model Type

**Standard toy model** - Bayesian network model of agents with multiple probabilistically related beliefs. Demonstrates that factionalization arises naturally from rational updating, not irrationality.

---

## Key Distinctions

| Phenomenon | Definition |
|------------|------------|
| **Polarization** | Increase in statistical dispersion of beliefs about ONE proposition |
| **Factionalization** | Multiple DIFFERENT beliefs become correlated across a population |
| **General Divergence** | Beliefs grow apart in all directions without correlations forming |
| **Convergence** | Beliefs grow closer together |

**Central Result:** General divergence NEVER arises for rational agents updating on the same evidence. When polarization occurs, it must lead to factionalization, not general divergence.

---

## Key Formal Structures

### Bayesian Network

```
G = (V, D)  where V = vertices (nodes), D = directed edges
```

Joint probability distribution factorizes:
```
P(X_1,...,X_n) = product_i P(X_i | parents(X_i))
```

### Agent Agreement

Agents agree on:
- Set of propositions X
- Network structure G
- Conditional probability distributions

Agents differ only in:
- Probabilities assigned to exogenous variables (those with no parents)

### Evidence Specification

Likelihood ratio evidence:
```
L(H=h_1) : ... : L(H=h_n) = P(eta | H=h_1) : ... : P(eta | H=h_n)
```

All agents receive identical likelihood evidence at each timestep.

---

## Variance-Based Explication

**Variance:**
```
sigma^2_X = (1/N) sum_i (x_i - mu_X)^2
```

**Absolute Covariance:**
```
|sigma_X,Y| = (1/N) sum_i |(x_i - mu_X)(y_i - mu_Y)|
```

| Outcome | Variance | Absolute Covariance |
|---------|----------|---------------------|
| Convergence | decreases | - |
| General Divergence | increases | increases or same |
| Factionalization | increases | decreases |

---

## Information-Theoretic Explication

**Kullback-Leibler divergence:**
```
D_KL(P | Q) = -sum P(x_1,...,x_n) log[P(x_1,...,x_n) / Q(x_1,...,x_n)]
```

**Jensen-Shannon divergence:**
```
D_JS(P | Q) = (1/2) D_KL(P || (P+Q)/2) + (1/2) D_KL(Q || (P+Q)/2)
```

**Key measures:**
- **<D^marginal_JS>**: Average JS divergence between marginal distributions (ignoring correlations)
- **<D^joint_JS>**: Average JS divergence between full joint distributions

| Outcome | <D^marginal_JS> | <D^joint_JS> |
|---------|-----------------|--------------|
| Convergence | decreases | - |
| General Divergence | increases | increases or same |
| Factionalization | increases | **decreases** |

**Key insight:** Factionalization is divergence in marginals but convergence in joints. Beliefs about individual hypotheses grow apart, but overall probability distributions grow closer (via correlations).

---

## No General Divergence Condition

For rational agents sharing conditional probabilities:
```
D_JS(P(X,Y,...,Z,D | D) | Q(X,Y,...,Z,D | D)) < D_JS(P(X,Y,...,Z,D) | Q(X,Y,...,Z,D))
```

**Implication:** Joint distributions must grow closer upon learning D. If marginals diverge, factionalization (not general divergence) must occur.

---

## Independence Conditions for Polarization

From Jern et al. (2014), contra-directional updating requires:
1. D and beta are conditionally dependent given H
2. D and H are conditionally dependent given beta

Where beta is a virtual node encoding differences between agents' exogenous beliefs.

**Structural interpretation:** Polarization requires independent sources of information about how to update, given the evidence.

---

## Key Examples

### Example 1: Convergence (Chain Network)

```
H_1 -> H_2
```

| H_1 | P(H_2 = true) |
|-----|---------------|
| True | 0.9 |
| False | 0.1 |

Evidence about H_2 drives all agents to update H_1 in same direction -> convergence.

### Example 2: Factionalization (Collider Network)

```
H_1    H_3
  \    /
   v  v
    H_2
```

**Barometer example:**
- H_1 = "barometer says low pressure"
- H_2 = "it will rain"
- H_3 = "barometer is reliable"

| H_1 | H_2 | P(H_3 = true) |
|-----|-----|---------------|
| False | False | 0.9 |
| False | True | 0.1 |
| True | False | 0.1 |
| True | True | 0.9 |

Evidence about H_2 drives different agents in different directions based on their beliefs about H_3 -> polarization in H_1 and H_3 -> beliefs become correlated -> **2 clusters form**.

### Example 3: Multiple Factions (Extended Network)

```
H_4    H_5
  \    /
   v  v
    H_3    H_1
      \    /
       v  v
        H_2
```

Two colliders in sequence -> **4 distinct factions form**.

---

## Clustering Analysis

### k-means Distortion

```
k-distortion = sum_j sum_i ||a^i_j * x_i - mu_j||^2
```

**Relative change:**
```
r^t_k = (k-distortion at timestep t) / (k-distortion at timestep 0)
```

**Classification:**
- If r^t_1 < 1 - eta: 1-clustering (convergence)
- If r^t_1 > 1 + eta: 1-divergence
- If r^t_k < 1 - eta but r^t_i >= 1 - eta for all i < k: k-clustering

---

## Simulation Parameters

| Parameter | Value |
|-----------|-------|
| Number of agents | 20 |
| Number of nodes | 2-8 (uniform) |
| Timesteps | 20 |
| Likelihood ratio | 0.65 |
| Initial beliefs | Uniform [0,1] |
| Clustering threshold eta | 0.05 |
| Network generation | Ide-Cozman algorithm |

---

## Simulation Results

**All simulations:**
- Most lead to 1-clustering (convergence)
- Significant proportion lead to multi-cluster factionalization
- Fewer than 5% lead to 1-divergence

**Factionalizing cases only:**
- Majority lead to clustering
- Confirms connection between information-theoretic factionalization and cluster formation

---

## Visualizer Design Implications

### Strong candidate for factionalization/polarization visualizer family

**Required Views:**

1. **Bayesian Network Diagram** - Show belief structure with nodes and directed edges
2. **Agent Belief Space** - 2D/3D scatter plot of agent beliefs (like Figures 1, 3, 5, 7)
3. **Belief Trajectories** - Animated arrows showing evolution over timesteps
4. **Clustering View** - k-means clusters, possibly with Voronoi cells
5. **Metrics Panel** - Variance, covariance, JS divergences over time
6. **Distribution Histograms** - Marginal distributions of beliefs

**Controls:**
- Network structure: chain / collider / extended / custom
- Number of agents
- Number of timesteps
- Likelihood ratio per step
- Which node receives evidence
- Initial belief distribution
- Random seed
- Play / pause / step / speed

**Key Outputs:**
- Whether convergence, factionalization, or divergence occurred
- Number of clusters formed
- Average marginal and joint JS divergences
- Variance and covariance trajectories

---

## Cautions for Visualization

1. **One type of factionalization:** This model shows factionalization driven by belief network structure. Real-world factionalization involves many other factors (trust dynamics, differential information access, cognitive biases).

2. **Idealized agents:** All agents share conditional probabilities and receive identical evidence. Real populations have heterogeneous evidence and conditional beliefs.

3. **k-means limitations:** Assumes spherical/convex clusters; may not capture more complex cluster geometries.

4. **Network structure drives outcome:** The structure of the Bayesian network (chain vs collider) determines whether convergence or factionalization occurs. This should be made explicit.

5. **Don't overstate:** This shows factionalization CAN arise rationally, not that all real-world factionalization is rational.

---

## Scientific Status Label

**Standard toy model** - Demonstrates a mechanism by which factionalization can arise rationally. Not intended as a complete model of real-world political/social factionalization. The Bayesian network formalism is standard, but the specific networks used are illustrative examples.

---

## Source Connections

- Related to **Polarization_Factionalization.pdf** and **DAGs_And_Polarization.pdf** (same research program)
- Builds on Jern et al. (2014) polarization conditions
- Complements Weatherall & O'Connor (2021) trust-based factionalization model

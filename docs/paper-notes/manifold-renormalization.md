# Paper Note: Effective Theory Building and Manifold Learning

**Author:** David Peter Wallis Freeborn
**Date:** November 2024
**Status:** Primary source (author's own paper)

---

## Core Thesis

Manifold learning (ML), sloppy model reduction (MBAM), and effective field theory (EFT) construction can be understood as instances of the same underlying principle: high-dimensional systems often contain redundancies that allow lower-dimensional representations to capture their essential structure.

## Model Type

**Conceptual analogy / philosophical analysis** - Draws formal analogies between techniques in ML, computational science, and physics. Not itself a simulation model, but provides conceptual framework for understanding dimensional reduction.

---

## Key Concepts

### Dimensional Reduction

General task: Find function m: R^N -> R^K (K < N) that preserves salient properties of data.

- **Feature space:** High-dimensional data space (R^N)
- **Latent space:** Lower-dimensional representation (R^K)
- **Cost function:** Measures preservation of geometric/topological features

### Manifold Learning

Family of algorithms assuming data lies near a lower-dimensional manifold embedded in feature space.

**General scheme:**
1. Data points x_i in R^N
2. Posit manifold M of dimension K < N
3. Find embedding m that projects data onto latent space R^K
4. Minimize cost function measuring structure preservation
5. Produce reduced representations y_i = m(x_i)

**Key algorithms mentioned:** LLE (Locally Linear Embedding), Isomap, t-SNE, UMAP

### The Manifold Hypothesis

**Local:** For specific dataset, data can be well-represented by points on a lower-dimensional manifold with bounded volume and reach.

**Global:** This property holds for many real-world datasets.

**Formal statement:** For suitable K, V, tau, there exists M in G_X(K, V, tau) such that:
L(M, {x_i}) < epsilon

Where L measures average distance from data to manifold.

---

## Sloppy Models in Computational Science

### Definition

A model f': R^M' -> R^N' is **sloppy** if:
- Predictions highly insensitive to most parameter combinations (sloppy)
- Predictions highly sensitive to few parameter combinations (stiff)

### Fisher Information Matrix

Measures sensitivity of predictions to parameters:
- Eigenvectors = "renormalized" eigenparameters
- Large eigenvalues -> stiff directions
- Small eigenvalues -> sloppy directions

### Manifold Boundary Approximation Method (MBAM)

Procedure to find effective models:
1. Fit model to data
2. Compute FIM, identify sloppiest direction
3. Trace geodesic along sloppy direction to manifold boundary
4. At boundary: fix/eliminate redundant parameter
5. Refit effective model
6. Iterate

**Key insight:** MBAM can be viewed as a special case of manifold learning where:
- Prior model f' identifies stiff vs sloppy parameters
- Reduced manifold uses only stiff parameters
- Inherits structural constraints preventing overfitting

---

## Effective Field Theories (EFT)

### Renormalization Group (RG) Flow

- Parameters "flow" through parameter space as energy scale changes
- Flow leads to fixed points/surfaces
- Near fixed points: approximate scale invariance
- Many theories flow to same fixed surface -> universality classes

### Relevant vs Irrelevant Parameters

- **Relevant/marginal:** Small changes cause large prediction changes (unstable RG directions)
- **Irrelevant:** Small changes cause small prediction changes (stable RG directions)

### EFT Construction

Eliminate irrelevant parameters to get low-dimensional effective theory valid at specific energy scales.

---

## Central Analogy

| ML Context | Sloppy Models | EFT |
|------------|---------------|-----|
| Feature space R^N | Prediction space R^N' | Observable space |
| Latent space R^K | Effective parameter space R^K' | Effective coupling space |
| Embedding m | Effective model m' | Effective Lagrangian |
| Manifold hypothesis | Sloppiness | Universality/decoupling |

**Shared principle:** Algorithmic compressibility due to regularities/redundancies in real-world systems.

---

## Visualizer Design Implications

### Strong candidate for manifold learning visualizer family

**Potential Views:**

1. **High-dimensional data scatter** (projected to 2D/3D)
2. **Manifold embedding** - show transformation to latent space
3. **Neighborhood graph** - local connectivity structure
4. **Distortion metrics** - local/global preservation measures
5. **Cost function optimization** - iterative improvement visualization
6. **Algorithm comparison** - PCA vs Isomap vs LLE etc.

**Controls:**
- Dataset selection (Swiss roll, S-curve, MNIST subset, etc.)
- Algorithm choice
- Number of neighbors (k)
- Target dimension
- Regularization/smoothness parameters
- Noise level

**Outputs:**
- Embedding quality metrics (trustworthiness, continuity)
- Residual variance
- Local vs global distortion measures
- Computational cost

### Pedagogical Goals

1. Show that high-dimensional data often has low intrinsic dimension
2. Illustrate trade-off between local and global structure preservation
3. Compare linear (PCA) vs nonlinear (Isomap, LLE) methods
4. Build intuition for "unfolding" and "flattening" operations

---

## Cautions for Visualization

1. **Conceptual paper:** The analogies are philosophical arguments, not empirical claims
2. **EFT section:** Highly technical physics - may not be appropriate for general audience
3. **MBAM specificity:** Algorithm details may be too specialized for introductory visualizer
4. **Overfitting risk:** Must explain why manifold learning without constraints can overfit
5. **Curse of dimensionality:** Hard to truly visualize high-dimensional effects

---

## Scientific Status Label

**Conceptual analogy** - The paper draws formal parallels between different dimensional reduction techniques. The individual techniques (manifold learning, MBAM, EFT) are well-established; the analogy itself is a philosophical contribution.

---

## Source Connections

- Background: Tenenbaum et al. (2000) Isomap, Roweis & Saul (2000) LLE
- Sloppy models: Transtrum et al. (2015), Gutenkunst et al. (2007)
- EFT: Wilson & Kogut (1974), Butterfield (2014)
- Philosophical: Freeborn (2024) on sloppiness

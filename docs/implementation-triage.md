# Implementation Triage

This document classifies visualizer families by implementation readiness.

---

## Triage Criteria

Each family is evaluated on:

1. **Source support** - Do primary sources exist?
2. **Formal specification** - Is the model well-defined?
3. **Implementation complexity** - How difficult to build?
4. **Pedagogical value** - How useful for teaching?
5. **Risk level** - Chance of misleading users?

---

## Tier 1: Strong Implementation Candidates

Ready for full implementation in Checkpoint 2.

### 1. Signaling Games & Compositionality

| Criterion | Assessment |
|-----------|------------|
| Source support | **Strong** - Full paper, code repo exists |
| Formal specification | **Complete** - Game structure, learning rules defined |
| Complexity | **Moderate** - Multiple receiver architectures |
| Pedagogical value | **High** - Clear learning objectives |
| Risk level | **Low** - Well-understood toy model |

**Recommendation:** First implementation candidate.

**Minimum Viable Version:**
- 4×4×4 two-sender game
- Traditional receiver only
- Information content visualization
- Signal replacement event

**Stretch Version:**
- All three receiver architectures
- Perceptron diagram
- Temperature control
- Comparison mode

---

### 2. Factionalization & Polarization

| Criterion | Assessment |
|-----------|------------|
| Source support | **Strong** - Three related papers |
| Formal specification | **Complete** - Bayesian networks, metrics defined |
| Complexity | **Moderate-High** - Multiple views, clustering |
| Pedagogical value | **High** - Timely, intuitive |
| Risk level | **Low** - Clear model scope |

**Recommendation:** Strong candidate, implement after signaling.

**Minimum Viable Version:**
- Fixed network structures (chain, collider)
- Two agents
- Belief trajectory visualization
- Basic metrics (variance)

**Stretch Version:**
- Population of agents
- k-means clustering view
- Multiple network types
- Factionalization metrics

---

### 3. Manifold Learning

| Criterion | Assessment |
|-----------|------------|
| Source support | **Strong** - Framework paper |
| Formal specification | **Standard algorithms** - PCA, Isomap |
| Complexity | **Moderate** - Algorithm implementation |
| Pedagogical value | **High** - Foundational ML concept |
| Risk level | **Low** - Well-established methods |

**Recommendation:** Strong candidate.

**Minimum Viable Version:**
- Swiss roll dataset
- PCA and Isomap
- 2D embedding view
- Basic distortion metrics

**Stretch Version:**
- Multiple synthetic datasets
- Additional algorithms (LLE, t-SNE)
- Neighborhood preservation visualization
- Interactive dimensionality selection

---

## Tier 2: Partial Implementation Candidates

Implement with care; some features need cautious handling.

### 4. Zollman Effect

| Criterion | Assessment |
|-----------|------------|
| Source support | **Partial** - Extension paper, not original |
| Formal specification | **Sufficient** - Bandit framework clear |
| Complexity | **Moderate** - Network simulation |
| Pedagogical value | **High** - Important epistemic concept |
| Risk level | **Low-Moderate** - Stay close to sources |

**Recommendation:** Implement basic version; mark extensions carefully.

**Minimum Viable Version:**
- Two-armed bandit
- Cycle and complete networks
- Convergence visualization
- Basic Model 1 (no meta-belief)

**Stretch Version:**
- Model 2 with meta-beliefs
- Propaganda manipulation
- Custom network topologies

---

### 5. Deep Learning Intuition Suite

| Criterion | Assessment |
|-----------|------------|
| Source support | **Partial** - Framework paper, not implementation spec |
| Formal specification | **Variable** - Some submodules better than others |
| Complexity | **High** - Multiple distinct submodules |
| Pedagogical value | **High** - Important AI literacy |
| Risk level | **Moderate** - Risk of overclaiming |

**Recommendation:** Implement only justified submodules.

**Justified Submodules:**
- Spline/decision boundary (directly supported)
- Double descent demonstration
- Latent manifold structure

**Avoid:**
- Claims about "how DL thinks"
- Fake mechanism visualizations
- Unsupported generalizations

---

## Tier 3: Conservative/Limited Implementation

Implement with significant constraints or defer.

### 6. LLM Visualizers

| Criterion | Assessment |
|-----------|------------|
| Source support | **Limited** - Paper avoids LLMs |
| Formal specification | **Insufficient** |
| Complexity | **Variable** |
| Pedagogical value | **High** - Popular interest |
| Risk level | **High** - Easy to overclaim |

**Recommendation:** Very limited scope.

**Acceptable:**
- Token probability / sampling explorer
- Embedding neighborhood (toy)

**Not Acceptable:**
- "How LLMs think" claims
- Fake attention visualizations
- Mechanistic interpretability claims without basis

---

## Tier 4: Specification Only

Do not implement without additional source development.

### 7. QFT Particles (Degrees of Freedom)

| Criterion | Assessment |
|-----------|------------|
| Source support | **Gap** - No author paper |
| Formal specification | **Missing** |
| Complexity | **High** - Subtle physics |
| Pedagogical value | **High** - Fascinating topic |
| Risk level | **Very High** - Ontology minefields |

**Recommendation:** Conceptual spec only. Do not implement.

---

### 8. Norton's Dome

| Criterion | Assessment |
|-----------|------------|
| Source support | **Gap** - No author paper |
| Formal specification | **Available externally** |
| Complexity | **Moderate** |
| Pedagogical value | **High** - Classic example |
| Risk level | **High** - Numerical artifact danger |

**Recommendation:** Spec only; at most simple toy comparison.

---

### 9. Maxwell's Demon (Phase-Space)

| Criterion | Assessment |
|-----------|------------|
| Source support | **Gap** - No author paper |
| Formal specification | **Missing** |
| Complexity | **High** - Phase-space, information theory |
| Pedagogical value | **High** |
| Risk level | **Very High** - Subtle thermodynamics |

**Recommendation:** Spec only. Do not implement.

---

## Implementation Order

**Checkpoint 2:**
1. Signaling Games & Compositionality (flagship)

**Checkpoint 3:**
2. Factionalization & Polarization
3. Manifold Learning

**Future:**
4. Zollman Effect
5. Deep Learning (selected submodules)
6. LLM (very limited)

**Deferred:**
7-9. Spec development before any implementation

---

## Risk Mitigation

For all implementations:

1. **Scientific status label required** before coding
2. **"What This Doesn't Show" panel** mandatory
3. **Source citation** in visualizer
4. **Scientific audit** before release
5. **Test coverage** for model logic

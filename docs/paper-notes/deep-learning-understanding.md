# Paper Note: A Model of Understanding in Deep Learning Systems

**Author:** David Peter Wallis Freeborn
**Institution:** Northeastern University London
**Status:** Primary source (author's own paper)
**Code:** github.com/DavidFreeborn/Model_of_Understanding_Deep_Learning

---

## Core Thesis

Deep learning systems can and do exhibit genuine **systematic understanding** of their target domains, but this understanding is typically **fractured**: fragmented, non-reductive, and distributed across locally reliable fragments rather than unified into globally coherent structures.

## Model Type

**Conceptual/philosophical analysis** with computational examples. Proposes a formal framework for evaluating machine understanding, then applies it diagnostically to deep learning.

---

## The Dialectic

### Two Contradictory Intuitions

1. How could models achieve X unless they possess genuine understanding?
2. How could models fail at Y if they possess any genuine understanding?

### Proxy Battles

**Memorization vs Generalization:**
- Early theory predicted high-capacity models should memorize
- Double descent phenomenon shows generalization can coexist with capacity
- Grokking: sudden transition from memorization to generalization
- Consensus: modern DL mostly generalizes, with pockets of memorization

**Interpolation vs Extrapolation:**
- Folk theory: DL good at interpolation, poor at extrapolation
- Balestriero et al.: In high dimensions, almost all predictions are extrapolative (outside convex hull)
- Chollet: Relevant criterion is interpolation on latent manifold
- Resolution: Both right - interpolative on manifold, extrapolative in ambient space

---

## Systematic Understanding (Formal Definition)

An agent S systematically understands property p of target T iff:

1. **Model:** S contains subsystem M that functions as adequate model of T
2. **Tracking:** M systematically tracks p without memorizing
3. **Bridge Principles:** Stable mappings connect terms of M to T
4. **Derivation:** S can use M to approximately derive properties of p

### Key Concepts

**Non-memorization:** Not just compression, but compression capturing stable regularities that persist across datasets from same target system. MDL framework: L(H) + L(D|H) < L(D)

**Bridge Principles:** Fixed mappings/interfaces coupling internal model to target system. In ML: preprocessing, tokenization, decoding rules, evaluation protocols. Must be:
- Fixed at deployment (not post-hoc)
- Executed automatically
- Part of system's competence
- Functionally integrated

**Derivation:** Agent-available procedure mapping situations to outputs. Forward pass + encoding/decoding conventions.

---

## Types of Systematic Understanding

### Structural Understanding

Model represents right patterns/relations in target system. Homomorphism or structure-preserving map from M to relevant features of T.

### Reductive Understanding

Model represents higher-level approximation derivable from lower-level structure. Effective theory relationship.

---

## Deep Learning Systems as Agents

### Spline Theory of Neural Networks

With ReLU activations, neural network partitions input space into convex polytope regions:
```
f_theta(x) = A_k * x + b_k for x in P_k
```

Each region has locally linear behavior. Network is continuous piecewise-linear function (multivariate spline).

**Key insight:** All network knowledge is encoded in how these linear patches are assembled.

### Bridge Principles for DL

1. **Tokenization/encoding:** How target states become input vectors
2. **Architecture:** How inputs are transformed
3. **Decoding:** How outputs become predictions about target
4. **Evaluation:** How predictions are compared to ground truth

---

## Fractured Understanding Hypothesis

Deep learning systems often achieve systematic understanding, but it is:

1. **Fragmented:** Distributed across locally reliable regions
2. **Non-reductive:** Not unified into small stock of principles
3. **Misaligned:** Learned representations often misaligned with target's natural variables
4. **Jagged:** Uneven competence across task space

### Implications

- Success and failure coexist in same system
- Understanding is real but limited
- Different from traditional scientific understanding ideal
- Explains "jagged frontier" phenomenon

---

## Visualizer Design Implications

### Relevant to Deep Learning Intuition Visualizer Family

**Potential Submodules (from paper):**

1. **Spline/decision boundary visualizer**
   - Show piecewise-linear regions
   - Illustrate how patches assemble
   - Compare learned vs ground truth surfaces

2. **Representation alignment visualizer**
   - Show learned features vs "natural" features
   - Illustrate misalignment/fragmentation
   - Compare different layer representations

3. **Generalization vs memorization visualizer**
   - Double descent phenomenon
   - Grokking dynamics
   - Training vs test error trajectories

4. **Latent manifold visualizer**
   - Show data manifold structure
   - Illustrate interpolation on manifold vs extrapolation in ambient space
   - Connect to manifold learning visualizer

**Controls:**
- Model architecture (layers, width)
- Training data characteristics
- Training duration
- Task type

**Outputs:**
- Decision boundary geometry
- Compression ratio / MDL metrics
- Generalization gap
- Representation similarity metrics

---

## Cautions for Visualization

1. **Philosophical paper:** Many claims are conceptual proposals, not empirical results
2. **LLMs avoided:** Paper explicitly avoids natural language processing
3. **Thin notion:** "Systematic understanding" is deliberately minimal - stronger claims need more
4. **Bridge principles crucial:** Understanding is system-relative, includes preprocessing etc.
5. **Fragmentation hard to visualize:** Core thesis is about distributed, partial competence

---

## Scientific Status Label

**Conceptual analysis with theorem intuition examples** - Proposes framework for thinking about machine understanding. The formal definitions are stipulative; the diagnostic claims about current DL systems are empirical hypotheses supported by case studies in accompanying code.

---

## Source Connections

- Background: de Regt (2017) on understanding, Pearl (2018) on causation
- Manifold hypothesis: Freeborn (2025b) philosophical overview
- Double descent: Belkin et al. (2019), Nakkiran et al. (2021)
- Spline theory: Balestriero & Baraniuk (2018)
- Real patterns: Dennett (1991a)
- MDL: Grunwald (2007), Rissanen (1978)

# Scientific Integrity Standards

This document defines the scientific and philosophical standards for all visualizers.

---

## Core Principle

**Honesty and clarity over spectacle.**

If there is ever a conflict between making something look impressive and representing it accurately, choose accuracy.

---

## Scientific Status Labels

Every visualizer and submodule MUST be labeled as one of:

### Exact Model

The visualization faithfully represents a well-defined mathematical or physical system.

**Requirements:**
- Equations are implemented correctly
- Numerical methods are appropriate
- Error bounds are documented
- No hidden approximations

**Example:** Bifurcation diagram of logistic map

### Standard Toy Model

A simplified model using established formalisms from the literature.

**Requirements:**
- Cite source for model
- Document idealizations explicitly
- Note what is omitted
- Explain relationship to "real" systems

**Example:** Lewis-Skyrms signaling game with finite states

### Conceptual Analogy

An illustrative comparison that helps build intuition but is not a literal model.

**Requirements:**
- Explicit "This is an analogy" labeling
- State what the analogy illuminates
- State where the analogy breaks down
- No claims of scientific precision

**Example:** Visualizing QFT particles as coupled oscillator modes

### Theorem Intuition Builder

Helps build intuition for formal mathematical results.

**Requirements:**
- Cannot substitute for proof
- State the theorem being illustrated
- Explain what visualization shows about the theorem
- Note limitations of visual intuition

**Example:** Visualizing d-separation in DAGs

---

## Mandatory Visualizer Elements

### "What This Shows" Panel

Every visualizer MUST include a clear statement of:
- What the model represents
- What scientific questions it addresses
- What can be learned from interacting with it

### "What This Does Not Show" Panel

Every visualizer MUST include a clear statement of:
- Idealizations made
- Real-world complexities omitted
- Claims that should NOT be inferred

### Source Attribution

Every visualizer MUST cite:
- Primary source paper(s)
- Key references from literature
- Inspiration sources (if applicable)

---

## Special Caution Areas

The following topics require extreme care:

### QFT and Particle Ontology

- DO NOT claim visualizations show "what particles really are"
- DO NOT conflate finite-mode models with full QFT
- DO NOT imply definitive answers to QFT ontology debates
- DO clearly distinguish visual metaphor from physics

### Norton's Dome and Determinism

- DO NOT let numerical artifacts masquerade as philosophical conclusions
- DO NOT claim to "demonstrate" non-determinism
- DO compare idealized vs regularized versions
- DO explain limitations of numerical simulation

### Maxwell's Demon and Entropy

- DO NOT oversimplify information-thermodynamics connection
- DO NOT claim to "resolve" the demon paradox
- DO clearly distinguish fine-grained and coarse-grained entropy
- DO get expert review for phase-space claims

### Polarization and Factionalization

- DO distinguish polarization from factionalization
- DO cite specific definitions used
- DO note that different metrics give different results
- DO NOT collapse distinct concepts

### Signaling and Compositionality

- DO distinguish syntactic from semantic compositionality
- DO note this is about model learners, not human language
- DO NOT overclaim about natural language

### Deep Learning "Understanding"

- DO NOT claim visualizations show "how AI thinks"
- DO distinguish measurable quantities from interpretations
- DO clearly label what is speculation vs established

---

## Numerical Standards

### Reproducibility

- All random processes must be seedable
- Same seed = same results
- Document RNG used

### Precision

- Use appropriate numerical precision
- Document floating-point limitations where relevant
- Avoid catastrophic cancellation

### Validation

- Compare to known analytical solutions where available
- Document numerical method convergence
- Test edge cases

---

## Review Process

Before implementation, each visualizer specification should be reviewed for:

1. **Scientific accuracy** - Is the model correctly specified?
2. **Appropriate scope** - Is the claimed generality justified?
3. **Honest labeling** - Is the scientific status label correct?
4. **Risk identification** - Are misleading interpretations flagged?

---

## Forbidden Practices

1. **Claiming precision not present** - Don't imply exact results from approximate methods
2. **Hiding assumptions** - All idealizations must be documented
3. **Overclaiming generality** - Toy models are not universal truths
4. **Visual deception** - Don't use visual tricks that mislead
5. **Authority laundering** - Don't cite sources for claims they don't support
6. **Fake mechanisms** - Don't visualize internal processes without basis

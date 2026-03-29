# Source Classification

This document classifies all sources by authority level and scientific status.

---

## Authority Hierarchy

**Order of priority (highest to lowest):**

1. `source_materials/notes_from_you/` - Project goals, constraints, standards
2. `source_materials/paper_text/` - Primary working text extractions
3. `source_materials/papers/` - Original PDFs (for spot-checking)
4. `source_materials/inspiration_links/` - Secondary inspiration only

**Conflict resolution:** If any conflict exists between inspiration sources and papers/notes, the papers and notes take priority.

---

## Scientific Status Labels

Every visualizer family and module must be labeled as one of:

| Label | Meaning | Visualization Implications |
|-------|---------|---------------------------|
| **Exact model** | Faithful representation of mathematical/physical system | Can claim precision |
| **Standard toy model** | Simplified model using established formalisms | Must note idealizations |
| **Conceptual analogy** | Illustrative comparison, not literal model | Must disclaim literal interpretation |
| **Theorem intuition builder** | Helps build intuition for formal results | Cannot substitute for proof |

---

## Source Classification by Paper

### CompositionalSignal
- **Scientific status:** Standard toy model
- **Authority:** Primary (author's own paper)
- **Formalisms:** Lewis-Skyrms signaling games, reinforcement learning, information theory
- **Idealizations:** Binary choices, perfect communication channel, specific game structure

### Factionalization
- **Scientific status:** Standard toy model
- **Authority:** Primary (published, Synthese)
- **Formalisms:** Bayesian networks, d-separation, k-means clustering
- **Idealizations:** Shared conditional probabilities, identical evidence, binary beliefs

### DAGs_And_Polarization
- **Scientific status:** Standard toy model
- **Authority:** Primary (working paper)
- **Formalisms:** Bayesian networks, d-separation, virtual beta node
- **Idealizations:** Binary variables, single update, specific network structures

### Polarization_Factionalization (Slides)
- **Scientific status:** Standard toy model
- **Authority:** Primary (presentation)
- **Formalisms:** Same as Factionalization paper
- **Note:** Comprehensive treatment with simulation results

### Bayesian_Networks (2)
- **Scientific status:** Standard toy model
- **Authority:** Primary (draft, co-authored)
- **Formalisms:** Multi-armed bandits, Bayesian belief networks
- **Idealizations:** Two-armed bandit, simple topologies, binary beliefs

### Manifold_Renormalization
- **Scientific status:** Conceptual analogy
- **Authority:** Primary (philosophical analysis)
- **Formalisms:** Manifold learning algorithms, MBAM, EFT
- **Note:** Draws analogies between different dimensional reduction techniques

### Deep_Learning_World_Models
- **Scientific status:** Conceptual analysis with theorem intuition examples
- **Authority:** Primary (philosophical analysis)
- **Formalisms:** Spline theory, MDL, systematic understanding framework
- **Note:** Framework for evaluating machine understanding

---

## Visualizer Family Classifications

### Well-Supported (Strong Source Basis)

| Family | Status | Primary Sources |
|--------|--------|-----------------|
| Signaling games | Standard toy model | CompositionalSignal |
| Factionalization/polarization | Standard toy model | Factionalization, DAGs, Pol_Fact |
| Manifold learning | Standard toy model | Manifold_Renormalization |

### Partially Supported

| Family | Status | Sources | Gaps |
|--------|--------|---------|------|
| Zollman effect | Standard toy model | Bayesian_Networks | Full Zollman paper not included |
| Deep learning | Conceptual/toy mix | Deep_Learning_Understanding | Which submodules are justified? |
| LLM visualizers | Toy/conceptual | Deep_Learning (partial) | Limited formal basis |

### Source-Gap-Limited (Caution Required)

| Family | Proposed Status | Issue |
|--------|-----------------|-------|
| QFT particles | Conceptual analogy only | No author paper, high philosophical risk |
| Norton's dome | Conceptual / toy only | No author paper, numerical artifact risks |
| Maxwell's demon | Conceptual only | No author paper, Liouville/entropy complexity |

---

## Caution Areas

Per project brief, be extremely careful with:

1. **QFT ontology** - Visual metaphor vs actual physics
2. **Particle concepts in QFT** - Degrees of freedom vs particles
3. **Continuum/field limits** - Finite modes vs true QFT
4. **Norton's dome** - Numerical artifacts vs philosophical conclusions
5. **Maxwell's demon** - Phase-space reasoning, Liouville's theorem
6. **Signaling compositionality claims** - Syntactic vs semantic
7. **Polarization metrics** - Different definitions, careful labeling needed
8. **Factionalization metrics** - Distinct from polarization

---

## Classification Workflow

For each implemented visualizer:

1. Identify primary source(s)
2. Determine scientific status label
3. Document idealizations and limitations
4. Create explicit "What This Shows / Does Not Show" panel
5. Review for overreach claims

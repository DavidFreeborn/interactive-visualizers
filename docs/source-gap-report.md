# Source Gap Report

This document identifies gaps in source support for each visualizer family.

---

## Critical Gaps (No Author Paper)

### 1. QFT Particles as Degrees of Freedom Increase

**Status:** No primary source available

**Gap Description:**
- No author paper on QFT particle emergence or degrees of freedom
- Inspiration link exists (YouTube video) but is secondary only
- High risk of smuggling unjustified ontological claims

**Risks:**
- Confusing visualization with physical reality
- Implying particles "are" excitations without nuance
- Misrepresenting relationship between finite modes and continuum limit
- Over-claiming what coupled oscillator models show about QFT

**Recommendation:**
- Classify as **conceptual analogy** only
- Or defer until author develops proper source material
- If implemented: extremely conservative labeling, explicit disclaimers

**Minimum Required for Implementation:**
- Clear statement this is NOT a model of real QFT
- Explicit finite-mode / toy model label
- No claims about particle ontology
- Focus on degrees-of-freedom intuition only

---

### 2. Norton's Dome

**Status:** No primary source available

**Gap Description:**
- No author paper on Norton's dome
- Well-known philosophical example but no project-specific treatment
- Significant risk of numerical artifacts masquerading as philosophy

**Risks:**
- Numerical integration artifacts appearing as non-determinism
- Finite precision creating spurious branching
- Misleading students about actual indeterminism argument

**Recommendation:**
- Classify as **conceptual spec only** or **clearly labeled toy model**
- Focus on comparing idealized vs regularized versions
- Explicit discussion of what numerical simulation cannot show

**Minimum Required for Implementation:**
- Side-by-side idealized vs regularized comparison
- Clear disclaimer about numerical limitations
- No claim to "demonstrate" indeterminism
- Pedagogical focus on the mathematical structure, not computed trajectories

---

### 3. Maxwell's Demon with Hamiltonian/Phase-Space View

**Status:** No primary source available

**Gap Description:**
- No author paper on Maxwell's demon
- No author paper on Hamiltonian mechanics or phase-space reasoning
- Liouville's theorem and entropy connections are subtle

**Risks:**
- Incorrect phase-space visualizations
- Misrepresenting Liouville's theorem
- Conflating fine-grained and coarse-grained entropy
- Oversimplifying information-thermodynamics connection

**Recommendation:**
- Classify as **conceptual spec only** for now
- Do NOT substantially implement without source development
- If implemented: very simple toy model only

**Minimum Required for Implementation:**
- Expert review of any phase-space claims
- Clear labeling as pedagogical illustration only
- No claims about resolving the demon paradox
- Focus on coarse-graining intuition, not complete treatment

---

## Partial Gaps

### 4. Zollman Effect

**Current Sources:**
- Bayesian_Networks paper (extends Zollman framework)
- Polygraphs inspiration link

**Gaps:**
- Original Zollman papers not in source materials
- Full exploration/exploitation trade-off not detailed in available sources
- Network topology effects only partially covered

**Risks:**
- Incomplete parameter space
- Missing key Zollman phenomena

**Recommendation:**
- Implement basic version from available sources
- Note which features are directly source-supported
- Mark extended features as "consistent with literature"

---

### 5. LLM Visualizers

**Current Sources:**
- Deep_Learning_Understanding paper (avoids LLMs explicitly)
- Inspiration link (Twitter thread)

**Gaps:**
- Paper explicitly avoids NLP/LLM treatment
- No author paper on attention, token probabilities, etc.
- Inspiration link is secondary only

**Risks:**
- Building "fake mechanistic introspection"
- Over-claiming what visualizations show about LLM internals

**Recommendation:**
- Very conservative scope
- Focus on clearly measurable quantities:
  - Token probability / sampling
  - Embedding neighborhoods
- Avoid claiming to show "how LLMs think"
- Explicit labels distinguishing measurement from interpretation

---

### 6. Deep Learning Visualizers (Submodule Selection)

**Current Source:**
- Deep_Learning_Understanding paper provides framework

**Gaps:**
- Which specific submodules are warranted unclear
- Paper provides diagnostic framework, not implementation spec

**Risks:**
- Building generic AI-edutainment
- Drifting from source grounding

**Recommendation:**
- Use paper framework to select justified submodules:
  - Spline/decision boundary (directly supported)
  - Representation alignment (partially supported)
  - Generalization dynamics (supported)
- Avoid submodules without clear source basis

---

## No Gaps (Strong Source Support)

### Signaling Games and Compositionality
- Full formal specification in CompositionalSignal paper
- Code repository exists
- No additional sources needed

### Factionalization and Polarization
- Three related papers provide comprehensive coverage
- Simulation parameters documented
- k-means clustering methodology specified

### Manifold Learning
- Manifold_Renormalization paper provides framework
- Standard algorithms well-documented
- Clear pedagogical goals

---

## Gap Resolution Strategies

1. **Defer:** Do not implement until source material developed
2. **Spec-only:** Write detailed specification without implementation
3. **Toy-only:** Implement clearly labeled simplified version
4. **Conservative:** Implement with aggressive labeling and disclaimers
5. **Source-extend:** Request author develop additional source material

---

## Gap Resolution for Checkpoint 2

| Family | Strategy | Notes |
|--------|----------|-------|
| QFT particles | Spec-only or Defer | High risk |
| Norton's dome | Spec-only or Toy-only | Numerical issues |
| Maxwell's demon | Spec-only | Phase-space complexity |
| Zollman effect | Conservative | Partial sources available |
| LLM visualizers | Conservative + scope limit | Avoid overclaiming |
| Deep learning | Implement justified submodules | Use paper framework |

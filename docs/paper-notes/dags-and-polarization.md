# Paper Note: DAGs, Belief Polarization and Bayesian Updating Phenomena

**Author:** David Peter Wallis Freeborn
**Date:** January 2024
**Status:** Primary source (author's own working paper)

---

## Core Question

Under what structural conditions on a Bayesian network can two rational agents, who share the same network structure and conditional probabilities, update on the same evidence and yet have their beliefs polarize (diverge in opposite directions)?

## Model Type

**Standard toy model** - Formal analysis of Bayesian network structure and d-separation conditions. Extends Jern et al. (2014) results.

---

## Eight Updating Phenomena

The paper classifies belief updating between two agents along three binary dimensions:

| Dimension | Options | Definition |
|-----------|---------|------------|
| **Direction** | Convergent / Divergent | Do beliefs get closer or further apart? |
| **Co-/Contra-directional** | Co / Contra | Do both agents update in the same direction? |
| **Crossing** | Cisvergent / Transvergent | Do beliefs cross over (agent with higher prior ends lower)? |

This yields 8 cases (A-H), schematized in Figure 3.

**Key phenomena of interest:**
- **Case G:** Contra-directional, divergent, cisvergent - classic polarization (Jern et al. definition)
- **Case H:** Contra-directional, divergent, transvergent - beliefs polarize AND cross over

---

## Independence Condition (Necessary for Polarization)

For two agents with identical Bayesian network G, identical conditional probabilities, differing only in priors of exogenous nodes:

Let **beta** be a virtual node encoding the difference between agents (parent of all exogenous nodes).

**Contra-directional and transvergent updating require BOTH:**
1. D and beta are conditionally dependent given H
2. D and H are conditionally dependent given beta

---

## Structural Condition (Graph-Based Test)

Translating to d-separation:

**Both conditions must hold for polarization to be possible:**
1. D and beta are d-connected given H
2. D and H are d-connected given beta

**Implication:** Graphs with fewer than 3 nodes NEVER satisfy this condition.

---

## Key Example: Collider Structure

```
H    S
 \  /
  v
  D
```

Where:
- H = hypothesis (e.g., "vaccines are effective")
- S = switch node (e.g., "scientists are reliable")
- D = data node (e.g., "paper claims vaccines work")

With appropriate CPD, agent trusting scientists (high S) updates H upward; agent distrusting scientists (low S) updates H downward. Same evidence, opposite updates.

---

## Classification of Small DAGs

The paper provides a complete classification of all 2-3 node DAGs:
- **Polarization-permitting:** Collider structures (H, S both parents of D)
- **Non-polarizing:** Chain structures (H -> D or H -> S -> D)

(See Figure 5 in original)

---

## Open Questions (From Paper)

1. Can we replace the beta-augmentation procedure with a direct graph-structural test?
2. Is every polarization-permitting graph a supergraph of one of the minimal cases?
3. Computationally efficient classification algorithm for larger DAGs?

---

## Visualizer Design Implications

### Supports polarization/factionalization visualizer family

**Potential views:**
1. **DAG structure diagram** - Show H, S, D nodes with directed edges
2. **Beta-augmented view** - Show virtual node and d-connection paths
3. **Belief trajectory diagram** - Two agents' beliefs diverging after update
4. **DAG gallery** - Interactive classification of DAG structures as polarizing/non-polarizing

**Controls:**
- Select/construct DAG structure
- Set prior beliefs for two agents
- Choose data node D and hypothesis node H
- Show d-separation paths
- Trigger evidence update

**Key pedagogical goal:** Show that network STRUCTURE determines whether rational agents CAN polarize, not just the specific beliefs.

---

## Cautions for Visualization

1. **Necessary, not sufficient:** The condition shows when polarization CAN occur, not that it WILL
2. **Idealized setting:** Both agents share conditional probabilities; real disagreements often involve different conditionals
3. **Binary variables only:** Proofs assume H, D are binary; extension to continuous/multi-valued needs care
4. **Virtual node beta:** This is a mathematical device, not a real belief

---

## Scientific Status Label

**Standard toy model** - Formal characterization of structural preconditions for rational polarization. The d-separation analysis is exact; the examples are illustrative.

---

## Source Connections

- Builds on: Jern et al. (2014) polarization analysis
- Related to: Freeborn (2024) "Rational Factionalization" paper (joint distributions still converge)
- Related to: Polarization_Factionalization.pdf (metrics and clustering)

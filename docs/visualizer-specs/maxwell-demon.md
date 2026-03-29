# Visualizer Specification: Maxwell's Demon (Phase-Space View)

---

## Overview

| Field | Value |
|-------|-------|
| **Family** | Maxwell's Demon with Hamiltonian/Phase-Space View |
| **Scientific Status** | Conceptual only |
| **Source Basis** | None - no author paper |
| **Source Gaps** | Critical - no primary source |
| **Implementation Priority** | Tier 4 - Spec only |

---

## Purpose

If implemented, would build intuition for the relationship between information, entropy, and phase-space reasoning. Would focus on coarse-graining intuition, NOT claim to "resolve" the demon paradox.

---

## CRITICAL WARNINGS

1. **Subtle thermodynamics** - Easy to misrepresent entropy
2. **Liouville's theorem often misunderstood** - Phase-space volume preservation ≠ entropy conservation
3. **Information-entropy connection complex** - Landauer's principle, etc.
4. **No author paper** - Cannot ground claims in primary source

---

## Conceptual Model (If Developed)

### Phase-Space View

- Microstate: point in 6N-dimensional phase space
- Macrostate: coarse-grained region
- Liouville: fine-grained volume preserved
- Entropy increase: spreading into larger coarse-grained region

### The Demon's Operation

- Demon "measures" particle velocities
- Uses information to sort particles
- Apparent entropy decrease
- Resolution: demon's memory/erasure

---

## What Could Be Shown

- Phase-space coarse-graining intuition
- Filamentation and volume preservation
- Coarse vs fine-grained entropy distinction
- Information-theoretic perspective (simplified)

## What Cannot Be Shown

- Full resolution of paradox
- Proper quantum treatment
- Complete information-thermodynamics

---

## Hypothetical Approach

### Toy Phase-Space View

Very simplified:
- 2D phase space (1 particle, 1D motion)
- Show region evolution
- Demonstrate filamentation
- Illustrate coarse-graining

### Do NOT

- Claim to resolve the paradox
- Misrepresent Liouville's theorem
- Conflate fine-grained and coarse-grained entropy

---

## Hypothetical Controls

| Control | Type | Range | Notes |
|---------|------|-------|-------|
| Number of particles | Slider | 1 - 10 | Toy only |
| Coarse-graining resolution | Slider | 4 - 32 | Grid cells |
| Show filamentation | Toggle | on/off | - |
| Demon action | Button | Sort | Illustrative |

---

## Hypothetical Views

1. **Particle view** - Physical space positions
2. **Phase-space view** - Position-momentum plot
3. **Coarse-grained cells** - Entropy proxy
4. **Information panel** - Bits of information

---

## Required Disclaimers (If Implemented)

**Mandatory display text:**

> "This is a SIMPLIFIED TOY MODEL for building intuition about
> phase-space reasoning and coarse-graining.
> It does NOT fully capture the thermodynamics of Maxwell's demon.
> The relationship between information and entropy involves
> subtleties (Landauer's principle, quantum mechanics, etc.)
> that are not represented here."

---

## Recommendation

**DO NOT IMPLEMENT** without:
1. Author paper providing rigorous treatment
2. Expert physics review
3. Very careful phase-space presentation
4. Multiple disclaimers

The topic is subtle enough that a misleading visualization could be worse than no visualization.

---

## Implementation Status

**DEFERRED** - Spec only. No implementation planned.

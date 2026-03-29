# Visualizer Specification: Norton's Dome

---

## Overview

| Field | Value |
|-------|-------|
| **Family** | Norton's Dome |
| **Scientific Status** | Conceptual toy (with caveats) |
| **Source Basis** | None - no author paper |
| **Source Gaps** | Critical - no primary source |
| **Implementation Priority** | Tier 4 - Spec only |

---

## Purpose

If implemented, would illustrate Norton's dome as a thought experiment about determinism in Newtonian mechanics. Would focus on the mathematical structure, NOT claim to "demonstrate" indeterminism computationally.

---

## CRITICAL WARNINGS

1. **Numerical artifacts are the main danger** - Finite precision creates spurious branching
2. **Cannot computationally prove non-uniqueness** - The indeterminism is mathematical, not numerical
3. **Philosophical subtlety** - Norton's argument is about idealized mathematics
4. **Easy to mislead** - Students may confuse numerical noise with philosophical argument

---

## Model Description (Conceptual)

### Norton's Dome Shape

Surface: h(r) = (2/3g) r^(3/2)

At apex (r=0), equation of motion has non-unique solutions:
- Ball can remain at rest indefinitely
- Ball can spontaneously roll down at any time T

### The Philosophical Point

This is a mathematical example showing that Newtonian mechanics, under certain conditions, does not uniquely determine the future from the past.

---

## What Could Be Shown

- Dome geometry
- Family of possible trajectories
- Comparison with regularized (smooth) dome
- Mathematical conditions for non-uniqueness

## What Cannot Be Shown

- Actual indeterminism (numerical simulation is deterministic)
- "Proof" via computation
- Physical reality (idealization)

---

## Recommended Approach

### Comparison View

Show two domes side-by-side:
1. **Idealized Norton's dome** (h ∝ r^(3/2))
2. **Regularized dome** (smooth at apex)

Show how the regularized dome has unique solutions while the idealized dome (mathematically) does not.

### Do NOT

- Animate "spontaneous" rolling as if demonstrating indeterminism
- Use numerical integration to "show" branching
- Claim the visualization proves anything about determinism

---

## Hypothetical Controls

| Control | Type | Range | Notes |
|---------|------|-------|-------|
| Dome type | Toggle | Idealized / Regularized | Comparison |
| Regularization parameter | Slider | 0 - 1 | Smooth transition |
| Branch time T | Slider | 0 - 10 | For illustration only |
| View | Dropdown | 3D / Position-time / Phase | - |

---

## Hypothetical Views

1. **Dome geometry** - 3D surface view
2. **Position-time** - r(t) trajectory families
3. **Comparison** - Idealized vs regularized side-by-side

---

## Required Disclaimers (If Implemented)

**Mandatory display text:**

> "Norton's dome is a MATHEMATICAL THOUGHT EXPERIMENT.
> The indeterminism is a property of the idealized equations,
> NOT something that can be demonstrated computationally.
> Numerical simulation uses finite precision and deterministic
> algorithms - any 'branching' you see is numerical artifact,
> NOT the philosophical point Norton is making."

---

## Recommendation

If implemented at all:
1. Focus on geometry and equation comparison
2. Show regularized vs idealized comparison
3. Heavy disclaimer text
4. Avoid animating "indeterminism"

Consider whether static diagrams with explanatory text would be more appropriate than interactive simulation.

---

## Implementation Status

**DEFERRED** - Spec only. At most, a very simple geometric comparison.

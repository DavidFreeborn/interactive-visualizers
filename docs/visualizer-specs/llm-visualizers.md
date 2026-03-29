# Visualizer Specification: LLM Visualizers

---

## Overview

| Field | Value |
|-------|-------|
| **Family** | LLM Visualizers |
| **Scientific Status** | Conceptual / Toy (conservative) |
| **Source Basis** | Limited - paper avoids LLMs |
| **Source Gaps** | Significant |
| **Implementation Priority** | Tier 3 (very limited) |

---

## Purpose

Provide basic intuition for measurable LLM properties without overclaiming about internal mechanisms. Focus on observable quantities, not fake "inside the model" visualizations.

---

## Scope Constraints

### Acceptable

1. Token probability / sampling exploration
2. Embedding space neighborhoods (toy scale)
3. Temperature effects on sampling

### Not Acceptable

1. "How LLMs think"
2. Attention pattern interpretations (without basis)
3. "Reasoning" visualizations
4. Claims about understanding

---

## Submodule 1: Token Probability Explorer

**Scientific Status:** Conceptual / educational

**Purpose:** Show that LLMs output probability distributions over tokens, not deterministic text. Demonstrate sampling effects.

**Model:**
- Given partial text, show next-token distribution
- Demonstrate different sampling strategies

**Controls:**
- Input text
- Temperature
- Top-k / Top-p
- Number of samples

**Views:**
- Bar chart of top-N token probabilities
- Sampled completions
- Temperature effect comparison

**Note:** This requires API access or pre-computed examples.

---

## Submodule 2: Embedding Neighborhood Explorer

**Scientific Status:** Conceptual toy

**Purpose:** Show that similar words/concepts cluster in embedding space.

**Model:**
- Pre-computed embeddings for vocabulary subset
- Project to 2D/3D

**Controls:**
- Query word
- Neighborhood size
- Similarity metric

**Views:**
- 2D scatter of word embeddings
- Nearest neighbors highlighted
- Similarity scores

**Note:** Uses static, pre-computed embeddings, not live model.

---

## What Is Represented

- LLMs output probability distributions
- Temperature affects sampling diversity
- Embeddings capture semantic similarity

## What Is Omitted

- How LLMs "understand"
- Internal mechanisms
- Attention patterns
- Reasoning processes

## Risks of Misleading Representation

- Implying visualizations show "how LLMs work"
- Overclaiming about semantic understanding
- Confusing output probabilities with beliefs

---

## Explicit Disclaimers (Required)

Each submodule MUST include:

1. "This shows output behavior, not internal mechanism"
2. "Embeddings reflect statistical patterns, not semantic understanding"
3. "This is a simplified demonstration, not model introspection"

---

## Testing Requirements

- Token probability normalization
- Sampling implementation correctness
- Embedding distance calculations

---

## Minimum Viable Version

- Token probability explorer with pre-computed examples
- Static embedding visualization for ~100 words

---

## Stretch Version

- Live API integration (if available)
- Larger embedding spaces
- Temperature comparison mode

# Visualizer Specification: Signaling Games & Compositionality

---

## Overview

| Field | Value |
|-------|-------|
| **Family** | Signaling Games & Compositionality |
| **Scientific Status** | Standard toy model |
| **Source Basis** | CompositionalSignal paper (Freeborn) |
| **Code Repository** | github.com/DavidFreeborn/compositional-signals (cited in paper; NOT inspected for this spec) |
| **Source Gaps** | None |
| **Implementation Priority** | Tier 1 - First candidate |

**Note on Code Repository:** The paper references a code repository for simulation results. This specification is derived from the paper text and formal definitions therein. The repository has NOT been inspected to verify implementation details. Before implementation, the repository should be examined to confirm algorithm details and potentially reuse tested logic.

---

## Purpose

Demonstrate how compositional understanding emerges (or fails to emerge) in signaling games. Show that standard Lewis-Skyrms receivers interpret signals atomically, while alternative architectures (minimalist, generalist) can achieve genuine compositional interpretation.

---

## Model Description

### Signaling Game Structure

```
Sigma = <S, M, A, P, sigma, rho, u>
```

- **S** = {s_0, ..., s_k} states of the world
- **M** = {m_0, ..., m_l} messages
- **A** = {a_0, ..., a_n} acts
- **P** in Delta(S) probability over states
- **sigma**: S -> Delta(M) sender strategy
- **rho**: M -> Delta(A) receiver strategy
- **u**: S x A -> R utility function

### Reinforcement Learning (Urn Model)

Sender: sigma_t(m_y | s_x) = R_t(m_y | s_x) / sum_i R(m_i | s_x)

Receiver: rho_t(a_u | m_y) = R_t(a_u | m_y) / sum_i R(a_i | m_y)

### Key Example: 4x4x4 Two-Sender Game

- 4 states, 4 acts
- 2 senders, each with 2 messages
- Compositional structure: sender A encodes dimension 1, sender B encodes dimension 2

---

## Receiver Architectures (Exact Definitions)

### Traditional Receiver

The standard Lewis-Skyrms receiver learns from complete message pairs.

**Urn structure:** One urn per message pair (m^A_x, m^B_y), each containing balls for each action.

**Update rule:** On successful communication with message pair (m^A_x, m^B_y) and action a_u:
```
R_{t+1}(a_u | m^A_x, m^B_y) = R_t(a_u | m^A_x, m^B_y) + 1
```

**Action selection:**
```
rho(a_u | m^A_x, m^B_y) = R_t(a_u | m^A_x, m^B_y) / sum_i R_t(a_i | m^A_x, m^B_y)
```

**Key limitation:** Treats message pairs atomically. When one message is replaced, ALL information associated with pairs containing that message is lost, including information from the unaffected message.

### Minimalist Receiver

Learns from atomic (individual) messages, not pairs.

**Urn structure:** One urn per atomic message (m^A_0, m^A_1, m^B_0, m^B_1), each containing balls for each action.

**Naive combination (insufficient alone):**
```
rho_naive(a_u | m^A_x & m^B_y) = [R_t(a_u|m^A_x) + R_t(a_u|m^B_y)] / [sum_i R_t(a_i|m^A_x) + R_t(a_i|m^B_y)]
```

**Problem:** Naive combination does not converge to a signaling system (~50% correct action rate).

**Solution - Tempered softmax activation:**
```
rho_minimalist(a_u | m^A_x & m^B_y) = exp(rho_naive(a_u)/T) / sum_i exp(rho_naive(a_i)/T)
```

Where T is the temperature parameter (lower T = sharper selection).

**Neural network interpretation:** Equivalent to a simple feed-forward perceptron:
- Input layer: 4 atomic message units (one-hot encoding)
- Output layer: 4 action units
- Weights: rho_naive values
- Activation: tempered softmax

**Key advantage:** When one message is replaced, information from the unaffected atomic message is preserved.

### Generalist Receiver

Learns the full joint distribution over all message components and combinations.

**Urn structure:** Urns for:
- One-variable distributions: P(m^A_x), P(m^B_y), P(a_u)
- Two-variable: P(m^A_x, m^B_y), P(m^A_x, a_u), P(m^B_y, a_u)
- Three-variable: P(m^A_x, m^B_y, a_u)

**Learned distributions:**
```
rho_generalist(M^n_x) = R_t(M^n_x) / sum_i R_t(M^n_i)
rho_generalist(a_y, M^n_x) = R_t(a_y, M^n_x) / sum_i sum_j R_t(a_j, M^n_i)
```

**Action selection:** Uses conditional probability on the full message.

**Two variants for new message introduction:**

1. **Information-erasing:** New message m^B_? starts with R=1 for all combinations.
   - Effect: Erases information from other signals (same as traditional receiver)

2. **Information-preserving:** New message assumed independent of existing messages.
   ```
   rho^{info-preserving}(M^n_i | m^B_?) = rho(M^n_i)
   ```
   - Effect: Preserves information from unaffected signals (truly compositional)

---

## Information Metrics (Exact Definitions)

### Pointwise Mutual Information (PMI)

For a signal m_j and state s_i:
```
PMI(m_j, s_i) = log_2[P(s_i | m_j) / P(s_i)]
```

Interpretation: How much observing signal m_j changes belief about state s_i (in bits).

### Information Content Vector

For signal m_j across all states:
```
I(m_j) = <PMI(m_j, s_0), PMI(m_j, s_1), ..., PMI(m_j, s_{k-1})>
```

This vector represents the "semantic profile" of the signal.

### Average Information Content

Mean information across all signal-state pairs:
```
AvgInfo = (1/|M||S|) * sum_j sum_i |PMI(m_j, s_i)|
```

This is the primary metric shown in the timeline view.

### Information Loss After Replacement

When message m^B_0 is replaced with unknown m^B_?:

**Traditional receiver:** Information loss from ALL pairs containing m^B_0
```
Loss_traditional = sum_{pairs with m^B_0} |I(pair)|
```
Approximately 1 bit in 4x4x4 game.

**Minimalist/Info-preserving generalist:** Information loss only from the replaced message
```
Loss_compositional = |I(m^B_0)|
```
Approximately 0.5 bits in 4x4x4 game.

### Communication Success Rate

Proportion of rounds where receiver selects correct action:
```
SuccessRate = (# correct actions) / (# total rounds)
```

---

## What This Shows

- How signaling systems emerge through reinforcement learning in a simple game
- How different receiver architectures (traditional, minimalist, generalist) interpret messages differently
- How information content changes as learning progresses
- The effect of signal replacement on information preservation
- Why "compositional" message structure does not guarantee compositional interpretation

## What This Does NOT Show (Mandatory UI Panel)

This section MUST appear in the final visualizer UI, prominently displayed and expandable.

### This is NOT a model of human language

- **Model learners vs humans:** The reinforcement learning agents in this model learn very differently from human language acquisition. Humans demonstrably DO interpret messages compositionally even in novel contexts (Kirby et al. 2008).
- **The puzzle addressed:** This model explains why certain simple artificial learners fail at compositionality, not why humans succeed.

### This is purely syntactic, not semantic

- **No meaning:** The "compositional structure" is purely formal/syntactic. There is no semantic content, reference, or truth conditions.
- **No grounding:** Signals are arbitrary labels with no connection to external referents beyond the game payoffs.

### Major omissions from real communication

- **No errors or noise:** All messages transmit perfectly; real communication involves misunderstanding, ambiguity, and noise.
- **No pragmatics:** No implicature, context-dependence, or speaker intentions beyond payoffs.
- **No recursion:** Real compositional semantics involves recursive structure; this model has only conjunction.
- **No multi-step reasoning:** Receivers make single-step decisions, not chains of inference.

### Limitations of the formal model

- **Finite, small state spaces:** The 4x4x4 game is a minimal tractable example, not representative of linguistic scale.
- **Uniform priors:** The model assumes uniform probability over states; real priors are highly structured.
- **Binary success:** Communication either succeeds or fails; no partial credit or gradations of understanding.
- **Fixed game structure:** The game topology is fixed; real languages evolve their structure.

### Do NOT infer

- That this explains natural language compositionality
- That human learners are "like" traditional receivers
- That the activation function choice is principled (it is pragmatic for convergence)
- That the neural network analogy extends to deep learning architectures

---

## Controls

| Control | Type | Range | Default |
|---------|------|-------|---------|
| Receiver type | Dropdown | Traditional / Minimalist / Generalist | Traditional |
| Generalist variant | Dropdown | Info-erasing / Info-preserving | Info-preserving |
| Temperature (T) | Slider | 100 - 10000 | 2000 |
| Replacement turn | Number | 1 - 100000 | 50000 |
| Number of senders | Dropdown | 1 / 2 | 2 |
| States per dimension | Dropdown | 2 / 4 | 2 |
| Initial reinforcement | Number | 1 - 10 | 1 |
| Random seed | Number | any | random |
| Play/pause | Button | - | paused |
| Speed | Slider | 1x - 100x | 10x |
| Step | Button | - | - |
| Reset | Button | - | - |

---

## Views

### 1. State-Signal-Action Diagram

Visual representation of current signaling system:
- Nodes for states, signals, actions
- Edges showing learned mappings
- Edge thickness = probability

### 2. Information Content Tables

Heat maps showing I(m) for each signal:
- Rows: signals
- Columns: states or actions
- Color: pointwise mutual information

### 3. Learning Dynamics Timeline

Line chart of average information content over turns.
Mark signal replacement event.

### 4. Signal Replacement Comparison

Before/after comparison:
- Information content vectors before replacement
- Information content vectors after replacement
- Highlight preserved vs lost information

### 5. Receiver Architecture Diagram

For minimalist receiver: perceptron-style diagram showing:
- Input layer (atomic messages)
- Weights (rho_naive)
- Activation function
- Output layer (actions)

---

## Metrics / Outputs

| Metric | Description |
|--------|-------------|
| Average information content | Bits of information in signals |
| Communication success rate | Proportion of successful interactions |
| Time to signaling system | Turns to reach stable signaling |
| Information loss | Bits lost after signal replacement |
| Partial preservation | Information retained from unaffected signals |

---

## Likely UI Structure

```
+-----------------------------------------------------+
|  Signaling Games & Compositionality                 |
|  [Standard Toy Model]                               |
+---------------------------------+-------------------+
|                                 |  Controls         |
|  [View Selector Tabs]           |  - Receiver type  |
|                                 |  - Temperature    |
|  [Main Visualization Area]      |  - Replace turn   |
|                                 |  - Seed           |
|                                 |  --------------   |
|                                 |  [> Play] [||]    |
|                                 |  Speed: [====]    |
+---------------------------------+-------------------+
|  Metrics: Info: 1.92 bits | Success: 98% | Turn: 50k|
+-----------------------------------------------------+
|  [What This Shows v]                                |
|  [What This Does NOT Show v]                        |
|  [Sources v]                                        |
+-----------------------------------------------------+
```

---

## Testing Requirements

### Model Tests

- Urn update correctness
- Probability normalization
- Information content calculation
- Activation function correctness

### Simulation Tests

- Reproducibility (same seed = same trajectory)
- Convergence detection
- Reset behavior

### Behavioral Tests

- Signaling system emerges (high success rate over many runs)
- Signal replacement causes information loss for traditional receiver
- Minimalist/generalist preserve partial information

---

## Minimum Viable Version

- 4x4x4 two-sender game
- Traditional receiver only
- State-signal-action diagram
- Information content timeline
- Signal replacement event
- Basic controls (speed, seed, reset)

---

## Stretch Version

- All three receiver architectures
- Side-by-side comparison mode
- Temperature adjustment
- Perceptron diagram for minimalist
- Information content tables
- Custom game configurations

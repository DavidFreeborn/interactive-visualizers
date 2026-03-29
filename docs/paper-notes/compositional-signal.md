# Paper Note: Compositional Understanding in Signaling Games

**Author:** David Peter Wallis Freeborn
**Status:** Primary source (author's own paper)
**Code:** github.com/DavidFreeborn/compositional-signals

---

## Core Question

Can signaling game models explain the emergence of **genuine compositional communication**? The paper addresses the "puzzle of compositional understanding" - why standard Lewis-Skyrms receivers fail to interpret signals compositionally even when senders transmit compositional messages.

## Model Type

**Standard toy model** with formal game-theoretic and information-theoretic analysis. Proposes two new receiver architectures that achieve genuine compositional interpretation.

---

## Key Formal Structures

### Signaling Game Definition

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

Sender probability of message given state:
```
sigma_t(m_y | s_x) = R_t(m_y | s_x) / sum_i R(m_i | s_x)
```

Receiver probability of action given message:
```
rho_t(a_u | m_y) = R_t(a_u | m_y) / sum_i R(a_i | m_y)
```

### Information Content

Entropy: `H(X) = -sum P(x)log P(x)`

Pointwise mutual information: `PMI(m_j, s_i) = log[P(s_i | m_j) / P(s_i)]`

Information content vector:
```
I(m_j) = <log[P(s_0|m_j)/P(s_0)], ..., log[P(s_{k-1}|m_j)/P(s_{k-1})]>
```

---

## Key Example: 4x4x4 Two-Sender Game

**Setup:**
- 4 states: s_0, s_1, s_2, s_3
- 4 acts: a_0, a_1, a_2, a_3
- 2 senders (A and B), each with 2 messages

**Concrete interpretation (professorial attire):**
- s_0 = red dress, s_1 = blue dress, s_2 = red suit, s_3 = blue suit
- m^A_0 = dress, m^A_1 = suit
- m^B_0 = red, m^B_1 = blue

**Signaling system:** Each sender's message specifies one dimension; conjunction fully determines state.

---

## The Problem (LaCroix/Franke Challenge)

When message m^B_0 (red) is replaced with unknown m^B_? (rouge):

**Standard receiver:** ALL information is lost from signals containing m^B_?
- Information about m^A_0 (dress) is also erased
- ~1 bit of information lost

**Compositional expectation:** Only information about color should be lost
- Information about garment type should be preserved
- ~0.5 bits of information lost

**Diagnosis:** Standard receivers reinforce only on complete message pairs, treating each pair atomically rather than compositionally.

---

## Solution 1: Minimalist Receiver

**Architecture:** Reinforces on atomic messages, not pairs.

Four urns: m^A_0, m^A_1, m^B_0, m^B_1 (not four pair-urns)

**Naive combination:**
```
rho_naive(a_u | m^A_x & m^B_y) = [R_t(a_u|m^A_x) + R_t(a_u|m^B_y)] / [sum_i R_t(a_i|m^A_x) + R_t(a_i|m^B_y)]
```

**Problem:** Naive approach doesn't converge to signaling system (wrong action chosen ~50% of time).

**Solution:** Use activation function to sharpen selection:
```
rho_minimalist(a_u | m^A_x & m^B_y) = f(rho_naive(a_u | m^A_x & m^B_y))
```

**Tempered softmax:**
```
f_TSM(x_j) = exp(x_j/T) / sum_i exp(x_i/T)
```

Temperature T controls steepness.

**Interpretation:** Simple feed-forward perceptron neural network
- Input layer: 4 atomic messages
- Output layer: 4 acts
- Weights: rho_naive
- Activation: f

---

## Solution 2: Generalist Receiver

**Architecture:** Learns full joint probability distribution over all message components and combinations.

**Urns:** One-variable (m^A_0, a_0, etc.), two-variable (m^A_0 & m^B_0, m^A_0 & a_0, etc.), up to max variables.

**Learned distributions:**
```
rho_generalist(M^n_x) = R_t(M^n_x) / sum_i R_t(M^n_i)
rho_generalist(a_y, M^n_x) = R_t(a_y, M^n_x) / sum_i sum_j R_t(a_j, M^n_i)
```

Action selection uses conditional probability on full message.

**Two variants for new message introduction:**

1. **Information-erasing:** New message starts with R=1 for all combinations
   - Erases information from other signals (same as standard)

2. **Information-preserving:** New message assumed independent of existing messages
   ```
   rho^{info-preserving}(M^n_i | m^B_?) = rho(M^n_i)
   ```
   - Preserves information from other signals (truly compositional)

---

## Parameters

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| \|S\| | Number of states | 2, 4, ... |
| \|M\| | Number of messages per sender | 2, 4, ... |
| \|A\| | Number of acts | 2, 4, ... |
| T | Temperature (softmax) | 2000 (for visibility) |
| Replacement turn | When signal is replaced | 50,000 |
| Initial reinforcement | Starting urn balls | 1 |

---

## Observables / Metrics

1. **Receiver's average information content** (bits) over time
2. **Information loss** after signal replacement (bits)
3. **Convergence to signaling system** (success rate, time)
4. **Partial information retention** after replacement
5. **Information content tables** (signal x state/act matrices)

---

## Visualizer Design Implications

### Strong candidate for flagship visualizer

**Views needed:**
1. **State-signal-action diagram** (like Figure 2) - shows signaling system structure
2. **Information content tables** - heat maps showing I(m) for states/acts
3. **Learning dynamics timeline** - average information over turns
4. **Signal replacement event** - before/after comparison
5. **Receiver architecture comparison** - traditional vs minimalist vs generalist
6. **Perceptron diagram** - for minimalist receiver interpretation
7. **Urn visualization** - optional, for pedagogical clarity

**Controls:**
- Receiver type: traditional / minimalist / generalist
- Generalist variant: information-erasing / information-preserving
- Temperature T
- Replacement turn
- Random seed
- Play/pause/step
- Speed control

**Key pedagogical goal:** Show that compositional interpretation requires receivers that learn from atomic message components, not just complete signals.

---

## Cautions for Visualization

1. **Model learners vs human learners:** Human learners DO interpret compositionally (Kirby et al. 2008); this is about why model learners fail
2. **Syntactic model:** Still purely syntactic, not semantic interpretation
3. **Conjunction is simple compositionality:** Not the full richness of natural language
4. **Activation function matters:** Choice affects convergence; must explain this is not ad hoc
5. **Neural network interpretation:** Minimalist = simple perceptron (not deep learning)

---

## Scientific Status Label

**Standard toy model** - The 4x4x4 game is a minimal example chosen for tractability. Real language has far more complexity, but the core insight about compositional learning requirements is general.

---

## Source Gaps

None for this paper - full formal specification available, code repository exists.

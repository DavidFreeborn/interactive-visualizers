# Paper Note: Multiple Beliefs in Epistemic Networks

**Authors:** David Freeborn, Cailin O'Connor, Jim Weatherall
**Status:** Primary source (co-authored paper, draft stage)

---

## Core Question

How do background beliefs about evidence quality (meta-beliefs) interact with social network dynamics to shape group learning? Specifically, how does doubt about the trustworthiness of evidence disrupt collective convergence to truth?

## Model Type

**Standard toy model** - Extends classic bandit-on-networks framework (Bala & Goyal, Zollman) with Bayesian belief networks to model multiple related beliefs.

---

## Framework: Multi-Belief Networks

### Basic Structure

- Agents arranged on a social network (cycle or complete)
- Each agent has a Bayesian belief network representing multiple related beliefs
- Agents gather data, share with neighbors, update via Bayes' rule
- Beliefs propagate through the network over discrete rounds

### Bandit Problem Setup

Two-armed bandit:
- Arm A: payoff probability = 0.5
- Arm B: payoff probability = 0.5 + epsilon (epsilon in {0.05, 0.1})

Agents must discover which arm is better by testing and sharing evidence.

---

## Two Models

### Model 1: Simple Belief Network (Baseline)

```
H
|
v
D
```

- H = hypothesis "arm B is better"
- D = data node (test outcomes)
- Standard updating: evidence about D propagates to H

### Model 2: Meta-Belief Network

```
H    S
 \  /
  v
  D
```

- H = hypothesis "arm B is better"
- S = meta-belief "evidence is trustworthy"
- D = data node

**Key innovation:** When S=0 (distrust evidence), data becomes less informative about H.

**Conditional probabilities:**
- H=1, S=1: P(D=1) = 0.5 + epsilon (informative)
- H=0, S=1: P(D=1) = 0.5 - epsilon (informative)
- H=1, S=0: P(D=1) = 0.5 + epsilon_tilde (less informative)
- H=0, S=0: P(D=1) = 0.5 - epsilon_tilde (less informative)

Where 0 <= epsilon_tilde <= epsilon (typically epsilon_tilde = epsilon/2)

---

## Key Results (Preliminary)

### Baseline (Model 1)
- Groups converge quickly
- Almost always reach true consensus
- Occasional errors from early lock-in

### With Meta-Belief (Model 2)
- **Slower convergence**
- **Lower success rates**
- Lower trust in S reduces expected value of testing
- Fewer tests -> less data -> early stochastic variation persists
- Complete networks partially compensate through broader sharing

### Propaganda on Meta-Beliefs
- Random messages pushing S toward distrust
- Even small persistent nudges keep S uncertain enough to slow updates on H
- **Targeting background trust more effective than targeting first-order beliefs**

---

## Connection to Zollman Effect

This paper extends the Zollman framework in a direction relevant to our visualizer:

1. **Standard Zollman:** Network structure affects consensus speed/accuracy
2. **This extension:** Meta-beliefs about evidence quality add another dimension

The meta-belief mechanism could explain:
- Why communities with equivalent evidence converge differently
- How propaganda targeting trust (rather than facts) disrupts learning
- Interaction between network structure and evidence interpretation

---

## Visualizer Design Implications

### Strong candidate for Zollman effect visualizer extension

**Potential Views:**
1. **Social network diagram** - agents connected in cycle/complete/custom topology
2. **Agent belief panels** - H and S values for each agent
3. **Evidence flow** - arrows showing data sharing
4. **Convergence timeline** - group belief trajectory
5. **Bayesian network inset** - showing H/S/D structure per agent

**Controls:**
- Network topology
- Epsilon (arm difference)
- Epsilon_tilde (informativeness when doubting)
- Number of agents
- Tests per round
- Propaganda rate (for S-targeting variant)
- Random seed

**Outputs:**
- Time to convergence
- Success rate (correct consensus)
- Final S distribution
- Data gathered before lock-in

---

## Cautions for Visualization

1. **Draft paper:** Results labeled "tentative" - verify before implementation
2. **Binary beliefs:** Model uses H, S in {0,1}; real beliefs are continuous
3. **Identical networks:** All agents share same Bayesian network structure
4. **Simple topology:** Only cycle and complete tested so far
5. **One meta-belief:** Real epistemic scenarios have many layers of meta-belief

---

## Scientific Status Label

**Standard toy model** - Extends established Zollman/Bala-Goyal framework with Bayesian network structure. The Bayesian updating is exact; the multi-armed bandit setup is standard.

---

## Source Connections

- Extends: Zollman (2007), Bala & Goyal (1998) bandit networks
- Related to: Freeborn (2024) factionalization (same belief network formalism)
- Related to: Jern et al. (2014) polarization in belief networks
- Related to: O'Connor & Weatherall (2018) scientific polarization

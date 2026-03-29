# Visualizer Specification: Zollman Effect

---

## Overview

| Field | Value |
|-------|-------|
| **Family** | Zollman Effect |
| **Scientific Status** | Standard toy model |
| **Source Basis** | Bayesian_Networks paper (partial) |
| **Source Gaps** | Original Zollman papers not in sources |
| **Implementation Priority** | Tier 2 |

---

## Purpose

Demonstrate the exploration-exploitation trade-off in epistemic networks. Show how network structure affects whether groups converge to truth or lock into false beliefs. Illustrate how sparse networks can sometimes be epistemically beneficial despite slower information spread.

---

## Model Description

### Multi-Armed Bandit Framework

- Agents face a two-armed bandit problem
- Arm A: probability of success = 0.5
- Arm B: probability of success = 0.5 + ε (ε ∈ {0.05, 0.1})
- Agents must discover which arm is better

### Network Structure

- Agents arranged on social network (cycle, complete, etc.)
- Each round: agents test, observe, share results
- Agents update beliefs using Bayes' rule

### Belief Update

Agents maintain belief H about which arm is better.
Update based on own data and neighbor data.

---

## What Is Represented

- Network structure effects on convergence
- Exploration vs exploitation dynamics
- Lock-in to suboptimal beliefs
- Information spread patterns

## What Is Omitted

- Complex network topologies
- Heterogeneous agents
- Strategic behavior
- Communication costs

## Risks of Misleading Representation

- Overgeneralizing from simple networks
- Implying network sparsity is always good
- Conflating model with real scientific communities

---

## Controls

| Control | Type | Range | Default |
|---------|------|-------|---------|
| Network topology | Dropdown | Cycle / Complete / Star / Custom | Cycle |
| Number of agents | Slider | 3 - 20 | 6 |
| Epsilon (arm difference) | Slider | 0.01 - 0.2 | 0.05 |
| Tests per round | Slider | 1 - 20 | 10 |
| Prior belief | Slider | 0.1 - 0.9 | 0.5 |
| Random seed | Number | any | random |
| Play/pause | Button | - | paused |
| Speed | Slider | 1x - 100x | 10x |

---

## Views

### 1. Network Diagram

Social network showing:
- Agent nodes
- Communication edges
- Node color = belief about H
- Node size = confidence (optional)

### 2. Agent Beliefs Panel

Grid of agent belief bars:
- Each row = one agent
- Bar shows P(H=1) over time
- Color gradient: wrong → uncertain → correct

### 3. Convergence Timeline

Line chart showing:
- Group average belief over time
- Individual agent beliefs (faded)
- True value marker
- Convergence threshold markers

### 4. Evidence Flow

Animated view showing:
- Data generation (which arm tested)
- Data sharing (messages between agents)
- Belief updates

---

## Metrics / Outputs

| Metric | Description |
|--------|-------------|
| Converged | Yes/No - all agents agree |
| Converged to truth | Yes/No - agreement is correct |
| Time to convergence | Rounds until convergence |
| Lock-in occurred | Premature convergence to wrong belief |
| Exploration rate | Proportion still testing arm B |

---

## Likely UI Structure

```
┌─────────────────────────────────────────────────────┐
│  Zollman Effect                                     │
│  [Standard Toy Model]                               │
├─────────────────────────────────┬───────────────────┤
│  [Network] [Beliefs] [Timeline] │  Controls         │
│                                 │  - Topology       │
│  [Main Visualization Area]      │  - # agents       │
│                                 │  - Epsilon        │
│                                 │  - Tests/round    │
│                                 │  ──────────────   │
│                                 │  [▶ Play] [⏸]     │
├─────────────────────────────────┴───────────────────┤
│  Round: 42 | Avg belief: 0.78 | Status: Exploring   │
├─────────────────────────────────────────────────────┤
│  [What This Shows ▼] [What This Does NOT Show ▼]    │
└─────────────────────────────────────────────────────┘
```

---

## Testing Requirements

### Model Tests

- Bayesian update correctness
- Binomial sampling
- Network message passing

### Simulation Tests

- Reproducibility
- Complete network converges faster than cycle
- Lock-in can occur
- Truth typically wins over many runs

### Statistical Tests

- Convergence rates match expected behavior

---

## Minimum Viable Version

- Cycle and complete networks
- 6 agents
- Network diagram with belief colors
- Convergence timeline
- Basic play/pause/reset

---

## Stretch Version

- Additional topologies (star, random)
- Meta-belief extension (from paper)
- Propaganda manipulation
- Batch mode for statistics
- Network comparison mode

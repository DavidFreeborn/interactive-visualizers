/**
 * Content for the Zollman Effect visualizer.
 * Refined for clarity and pedagogical effectiveness.
 */

export const CONTENT = {
  title: 'The Zollman Effect',
  subtitle: 'When too much communication hurts the search for truth',

  /**
   * Intuitive explainer sections
   */
  explainer: {
    whatIsThis: {
      heading: 'What is this?',
      text: `Imagine a group of scientists testing two drugs: A (the standard) and B (new and actually better, but by a small margin). Each scientist runs experiments, updates beliefs, and shares results with colleagues.

Surprisingly, fully connected networks where everyone shares everything can fail—they lock into believing A is better. But sparse networks where scientists only talk to neighbors often find the truth. Why? Because isolation gives B more chances to prove itself before premature consensus kills exploration.`,
    },

    coreIdea: {
      heading: 'The core idea',
      text: `This is the exploration-exploitation trade-off applied to group learning. If scientists share results too quickly, early noise can create consensus before enough evidence accumulates. Once everyone believes A is better, no one tests B anymore.

In sparse networks, some scientists keep testing B even while others abandon it. If B really is better, eventually its superiority becomes clear—and then spreads through the network. Slower communication preserves diversity of inquiry.`,
    },

    whyMatters: {
      heading: 'Why does this matter?',
      text: `This challenges the assumption that more information sharing is always better for science. The structure of how scientists communicate affects what they discover.

It has implications for open science, replication crises, and how research communities should be organized. Sometimes productive isolation—letting different groups pursue different approaches—leads to better collective outcomes.`,
    },

    howToRead: {
      heading: 'How to read this visualization',
      text: `• **Network** (left): Each node is a scientist. Color shows belief in B (blue = low, green = high). Lines show who shares with whom.
• **Timeline** (right): Mean belief in B over time. Green line rising = converging to truth. Dropping toward 0 = lock-in on A.
• **Epsilon**: How much better B really is. Small epsilon = harder to detect.
• **Watch for**: Lock-in (flatlines near 0) vs. success (rises toward 1).`,
    },
  },

  /**
   * Key concepts
   */
  keyConcepts: {
    exploration: {
      term: 'Exploration',
      short: 'Testing uncertain options',
      detail: 'Continuing to test arm B even when uncertain.',
    },
    exploitation: {
      term: 'Exploitation',
      short: 'Using best known option',
      detail: 'Switching to arm A because it currently looks better.',
    },
    lockIn: {
      term: 'Lock-in',
      short: 'False consensus',
      detail: 'Everyone agrees on the wrong answer, so exploration stops.',
    },
  },

  /**
   * Network topology descriptions
   */
  topologies: {
    cycle: {
      name: 'Cycle',
      description: 'Each agent connected to two neighbors only.',
      structure: 'Ring: 1-2-3-4-5-1',
      tradeoff: 'Slow information spread → more exploration → higher chance of finding truth',
    },
    complete: {
      name: 'Complete',
      description: 'Everyone connected to everyone.',
      structure: 'All pairs connected',
      tradeoff: 'Fast consensus → less exploration → higher risk of lock-in',
    },
    star: {
      name: 'Star',
      description: 'One hub connected to all others.',
      structure: 'Hub-and-spoke',
      tradeoff: 'Central hub dominates; peripheral agents isolated from each other',
    },
    'er-random': {
      name: 'ER Random',
      description: 'Erdős-Rényi: each edge exists with probability p.',
      structure: 'Random connections',
      tradeoff: 'Variable connectivity; may have clusters or bridges',
    },
    'ba-scale-free': {
      name: 'BA Scale-Free',
      description: 'Barabási-Albert: preferential attachment creates hubs.',
      structure: 'Few hubs, many low-degree nodes',
      tradeoff: 'Hubs spread information fast; periphery retains diversity',
    },
    'ws-small-world': {
      name: 'WS Small-World',
      description: 'Watts-Strogatz: ring lattice with some random rewiring.',
      structure: 'Mostly local, some shortcuts',
      tradeoff: 'Short paths + high clustering; intermediate exploration',
    },
  },

  /**
   * Scenarios for guided exploration
   */
  scenarios: [
    {
      id: 'cycle-success',
      name: 'Cycle finds truth',
      description: 'Sparse network succeeds where complete might fail.',
      config: {
        topology: 'cycle' as const,
        numAgents: 6,
        epsilon: 0.05,
        testsPerRound: 10,
        seed: 42,
      },
    },
    {
      id: 'complete-lockin',
      name: 'Complete lock-in',
      description: 'Fast communication leads to false consensus.',
      config: {
        topology: 'complete' as const,
        numAgents: 6,
        epsilon: 0.05,
        testsPerRound: 10,
        seed: 17,
      },
    },
    {
      id: 'large-epsilon',
      name: 'Easy detection',
      description: 'Large advantage makes B obvious to all networks.',
      config: {
        topology: 'complete' as const,
        numAgents: 6,
        epsilon: 0.15,
        testsPerRound: 20,
        seed: 42,
      },
    },
  ],

  /**
   * Metric explanations
   */
  metrics: {
    meanBelief: {
      name: 'Mean P(B)',
      short: 'Average belief B is better',
      detail: 'Should rise toward 1 if B is found to be better.',
    },
    converged: {
      name: 'Converged',
      short: 'All agree?',
      detail: 'Whether all agents have high or low belief in B.',
    },
    status: {
      name: 'Status',
      short: 'Current outcome',
      detail: 'Exploring, Correct (found B), or Lock-in (stuck on A).',
    },
  },

  /**
   * Source reference
   */
  source: {
    paper: 'The Communication Structure of Epistemic Communities',
    author: 'Kevin Zollman (2007)',
  },

  /**
   * Scientific caution
   */
  caution: `This is a toy model with identical Bayesian agents and simple two-armed bandits. Real science has strategic behavior, publication bias, and complex incentive structures. The model illustrates one mechanism—not a complete theory of scientific communication.`,
};

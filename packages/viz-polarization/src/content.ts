/**
 * Content for the Factionalization & Polarization visualizer.
 * Refined for clarity and pedagogical effectiveness.
 */

export const CONTENT = {
  title: 'When Rationality Divides',
  subtitle: 'How perfectly rational agents can disagree more after seeing the same evidence',

  /**
   * Intuitive explainer sections
   */
  explainer: {
    whatIsThis: {
      heading: 'What is this?',
      text: `Imagine two doctors examining the same patient symptoms. One suspects Disease H, the other thinks it might be Condition S. After running a test, they disagree more than before—even though they both updated their beliefs rationally.

This visualizer shows how the structure of causal relationships can make rational agents polarize. When two causes both explain the same effect ("explaining away"), agents with different background beliefs can reach opposite conclusions from identical evidence.`,
    },

    coreIdea: {
      heading: 'The core idea',
      text: `In a "collider" network (H → D ← S), evidence D could be caused by either H or S. If you already believe S is likely, observing D doesn't increase your belief in H much—you "explain away" D using S. But someone who doubts S will attribute D to H instead.

Same evidence. Same Bayesian reasoning. Opposite conclusions. This isn't irrationality—it's rational updating from different starting points in a world with multiple possible causes.`,
    },

    whyMatters: {
      heading: 'Why does this matter?',
      text: `This challenges the naive view that sharing more information leads to consensus. If people have different background beliefs about alternative explanations, showing them the same evidence can make them diverge further.

Understanding this mechanism helps explain why debates (climate, vaccines, politics) sometimes become more polarized despite more data being available—and why "just show them the facts" often fails.`,
    },

    howToRead: {
      heading: 'How to read this visualization',
      text: `• **Belief space** (large): Each dot is an agent. Position shows belief in H (horizontal) and S (vertical). Watch trajectories as evidence is observed.
• **Network diagram** (small): Shows causal structure. Arrows indicate causation. D is the observed evidence.
• **Variance**: Higher = more disagreement. Watch it increase (polarization) or decrease (convergence).
• **Case labels**: Convergent (beliefs approach), Divergent (beliefs separate), Co-directional (both move same way).`,
    },
  },

  /**
   * Key concepts for reference
   */
  keyConcepts: {
    polarization: {
      term: 'Polarization',
      short: 'Beliefs move further apart',
      detail: 'Variance in beliefs increases. Agents disagree more after evidence.',
    },
    factionalization: {
      term: 'Factionalization',
      short: 'Clusters form with correlated beliefs',
      detail: 'Groups emerge where believing H correlates with believing S.',
    },
    explainingAway: {
      term: 'Explaining Away',
      short: 'One cause reduces belief in another',
      detail: 'If D could be caused by H or S, evidence for S makes H seem less necessary.',
    },
  },

  /**
   * Network type descriptions
   */
  networks: {
    chain: {
      name: 'Chain',
      structure: 'H → S → D',
      description: 'H causes S, which causes D. Evidence about D updates belief in S, then in H. Typically leads to convergence.',
      expectation: 'Agents tend to agree more after evidence.',
    },
    collider: {
      name: 'Collider',
      structure: 'H → D ← S',
      description: 'Both H and S cause D. Observing D creates conditional dependence between H and S. Enables explaining away.',
      expectation: 'Agents can diverge—explaining away creates polarization.',
    },
  },

  /**
   * Scenarios for guided exploration
   */
  scenarios: [
    {
      id: 'collider-polarization',
      name: 'Classic polarization',
      description: 'Two agents with different S beliefs diverge on H after seeing D.',
      config: {
        networkType: 'collider' as const,
        numAgents: 2,
        seed: 42,
      },
    },
    {
      id: 'chain-convergence',
      name: 'Chain convergence',
      description: 'Same agents in a chain network converge instead.',
      config: {
        networkType: 'chain' as const,
        numAgents: 2,
        seed: 42,
      },
    },
    {
      id: 'multiple-agents',
      name: 'Population dynamics',
      description: 'Watch 8 agents form factions over time.',
      config: {
        networkType: 'collider' as const,
        numAgents: 8,
        numTimesteps: 20,
        seed: 123,
      },
    },
  ],

  /**
   * Metric explanations
   */
  metrics: {
    variance: {
      name: 'Variance',
      short: 'How spread out are beliefs?',
      detail: 'Standard deviation of H beliefs. Higher = more polarization.',
    },
    meanBelief: {
      name: 'Mean P(H)',
      short: 'Average belief in H',
      detail: 'Where the population stands on average.',
    },
    updatingCase: {
      name: 'Case',
      short: 'Type of belief dynamics',
      detail: 'Convergent, Divergent, Co-directional, or Cisvergent.',
    },
  },

  /**
   * Source reference
   */
  source: {
    paper: 'Polarization and Factionalization in Bayesian Networks',
    author: 'Jern, Chang & Kemp (2014); Bovens & Hartmann',
  },

  /**
   * Scientific caution
   */
  caution: `This is a toy model with 2-3 node networks and perfect Bayesian agents. Real polarization involves trust, motivated reasoning, social influence, and complex belief systems. The model shows one mechanism—network structure—not a complete theory of disagreement.`,
};

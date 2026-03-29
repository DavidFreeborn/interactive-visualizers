/**
 * Content and explanatory text for the Factionalization & Polarization visualizer.
 *
 * Scientific Status: Standard toy model
 */

export const CONTENT = {
  scientificStatus: 'Standard toy model',

  title: 'Factionalization & Polarization',

  description:
    'Demonstrates how rational Bayesian agents can polarize and factionalize when updating on the same evidence, due to network structure.',

  /**
   * Key Concepts Section - Explaining the distinction between polarization and factionalization
   */
  keyConcepts: {
    polarization: {
      term: 'Polarization',
      definition:
        'Increase in belief dispersion on a single proposition. Agents move further apart in their beliefs about H (the hypothesis). Measured by variance in beliefs.',
      example: 'Agent A becomes more confident H is true, while Agent B becomes more confident H is false.',
    },
    factionalization: {
      term: 'Factionalization',
      definition:
        'Formation of distinct clusters where beliefs across multiple propositions become correlated. Groups emerge with internally consistent belief packages.',
      example: 'Agents split into two groups: one believing both H and S, another believing neither.',
    },
    explainingAway: {
      term: 'Explaining Away Effect',
      definition:
        'When two causes (H and S) both explain an effect (D), evidence for one cause reduces belief in the other. In a collider network (H -> D <- S), observing D makes H and S conditionally dependent, so an agent who believes S is high will attribute less of D to H.',
      example:
        'If a patient has symptoms (D) that could be caused by disease H or condition S, learning the patient has S reduces belief in H.',
    },
    whyDivergence: {
      term: 'Why Divergence Occurs',
      definition:
        'Agents with different prior beliefs about the exogenous cause (S) will update differently on the same evidence (D). One agent explains away H using S; another does not. Same evidence, rational updating, opposite conclusions.',
    },
  },

  whatThisShows: [
    'How Bayesian agents with different priors can diverge when updating on shared evidence',
    'The difference between chain and collider network structures',
    'The "explaining away" effect in collider networks',
    'That polarization can arise from rationality, not irrationality',
    'The eight updating cases (convergent/divergent, co-directional, cisvergent)',
    'The distinction between polarization (belief dispersion) and factionalization (cluster formation)',
  ],

  whatThisDoesNotShow: {
    notRealWorld: {
      title: 'This is a highly simplified model',
      points: [
        'Real social networks have thousands of nodes and complex structures.',
        'Real beliefs are not binary or simple probabilities.',
        'Real evidence is not cleanly observed by all agents.',
      ],
    },
    noIrrationality: {
      title: 'Irrationality is not modeled',
      points: [
        'No confirmation bias or motivated reasoning.',
        'No trust dynamics or source credibility.',
        'No memory limitations or bounded rationality.',
        'Agents are perfect Bayesian updaters.',
      ],
    },
    simplifiedNetwork: {
      title: 'Networks are highly simplified',
      points: [
        'Only 2-3 node networks are shown.',
        'No complex conditional dependencies.',
        'No latent variables or unobserved causes.',
      ],
    },
    doNotInfer: {
      title: 'Do NOT infer',
      points: [
        'That all real-world polarization is "rational" in this sense.',
        'That network structure is the only cause of polarization.',
        'That these toy models explain actual political polarization.',
        'That Bayesian updating describes actual human reasoning.',
      ],
    },
  },

  source: {
    paper: 'Factionalization, Polarization, and Bayesian Networks',
    author: 'Various (based on Jern et al., Bovens & Hartmann)',
    note: 'Standard toy model demonstrating structural conditions for belief divergence.',
  },

  metrics: {
    variance: {
      name: 'Variance',
      description: 'Spread of H beliefs across agents. Higher = more polarized.',
      unit: '',
    },
    updatingCase: {
      name: 'Updating Case',
      description:
        'One of 8 cases based on convergent/divergent, co-directional, cisvergent.',
      unit: '',
    },
    meanBelief: {
      name: 'Mean Belief',
      description: 'Average belief in H across all agents.',
      unit: '',
    },
  },

  networks: {
    chain: {
      name: 'Chain (H -> S -> D)',
      description:
        'Evidence screens off hypothesis. Typically leads to convergence.',
    },
    collider: {
      name: 'Collider (H -> D <- S)',
      description:
        'Both causes affect evidence. Can lead to "explaining away" and divergence.',
    },
  },
};

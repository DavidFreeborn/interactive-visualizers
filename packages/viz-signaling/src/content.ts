/**
 * Content and explanatory text for the Signaling Games visualizer.
 *
 * This content is derived from the CompositionalSignal paper (Freeborn)
 * and the visualizer specification.
 */

export const CONTENT = {
  /**
   * Scientific status label (MUST be visible in UI)
   */
  scientificStatus: 'Standard toy model',

  /**
   * Title
   */
  title: 'Signaling Games & Compositionality',

  /**
   * Brief description
   */
  description:
    'Demonstrates how compositional understanding emerges (or fails to emerge) in Lewis-Skyrms signaling games with reinforcement learning.',

  /**
   * What This Shows panel
   */
  whatThisShows: [
    'How signaling systems emerge through reinforcement learning in a simple game',
    'How traditional receivers learn to map message pairs to actions',
    'How information content increases as the signaling system develops',
    'The effect of signal replacement on information preservation',
    'Why "compositional" message structure does not guarantee compositional interpretation for traditional receivers',
  ],

  /**
   * What This Does NOT Show panel (MANDATORY)
   */
  whatThisDoesNotShow: {
    notHumanLanguage: {
      title: 'This is NOT a model of human language',
      points: [
        'The reinforcement learning agents learn very differently from human language acquisition.',
        'Humans demonstrably DO interpret messages compositionally even in novel contexts (Kirby et al. 2008).',
        'This model explains why certain simple artificial learners fail at compositionality, not why humans succeed.',
      ],
    },
    purelySyntactic: {
      title: 'This is purely syntactic, not semantic',
      points: [
        'The "compositional structure" is purely formal/syntactic.',
        'There is no semantic content, reference, or truth conditions.',
        'Signals are arbitrary labels with no connection to external referents beyond game payoffs.',
      ],
    },
    majorOmissions: {
      title: 'Major omissions from real communication',
      points: [
        'No errors or noise: all messages transmit perfectly.',
        'No pragmatics: no implicature or context-dependence.',
        'No recursion: real compositional semantics involves recursive structure; this model has only conjunction.',
        'No multi-step reasoning: receivers make single-step decisions.',
      ],
    },
    formalLimitations: {
      title: 'Limitations of the formal model',
      points: [
        'Finite, small state spaces (4x4x4 is minimal tractable example).',
        'Uniform priors over states; real priors are highly structured.',
        'Binary success: communication either succeeds or fails completely.',
        'Fixed game structure: real languages evolve their structure.',
      ],
    },
    doNotInfer: {
      title: 'Do NOT infer',
      points: [
        'That this explains natural language compositionality.',
        'That human learners are "like" traditional receivers.',
        'That the activation function choice (for minimalist receiver) is principled.',
        'That the neural network analogy extends to deep learning architectures.',
      ],
    },
  },

  /**
   * Source reference
   */
  source: {
    paper: 'Compositional Understanding in Signaling Games',
    author: 'David Peter Wallis Freeborn',
    note: 'Standard toy model based on Lewis-Skyrms signaling game framework.',
  },

  /**
   * Metric explanations
   */
  metrics: {
    avgInformationContent: {
      name: 'Average Information Content',
      description:
        'Measures how much the signals reduce uncertainty about the state, in bits. Higher values indicate more informative signaling.',
      unit: 'bits',
    },
    successRate: {
      name: 'Success Rate',
      description:
        'Proportion of rounds where the receiver selected the correct action matching the state.',
      unit: '%',
    },
    turn: {
      name: 'Turn',
      description: 'Current simulation round.',
      unit: '',
    },
  },

  /**
   * Control explanations
   */
  controls: {
    replacementTurn: {
      name: 'Replacement Turn',
      description:
        'Turn at which one message is replaced with an unknown signal. Set to 0 to disable replacement.',
    },
    seed: {
      name: 'Random Seed',
      description:
        'Seed for the random number generator. Same seed produces identical simulation trajectories.',
    },
  },
};

/**
 * Content for the Zollman Effect visualizer.
 *
 * Scientific Status: Standard toy model
 */

export const CONTENT = {
  scientificStatus: 'Standard toy model',

  title: 'Zollman Effect',

  description:
    'Demonstrates the exploration-exploitation trade-off in epistemic networks and how network structure affects convergence to truth.',

  whatThisShows: [
    'How network structure affects whether groups converge to truth or lock into false beliefs',
    'The exploration-exploitation trade-off in collective inquiry',
    'Why sparse networks can sometimes be epistemically beneficial',
    'How premature consensus can lead to lock-in on suboptimal beliefs',
  ],

  whatThisDoesNotShow: {
    simplifiedModel: {
      title: 'This is a highly simplified model',
      points: [
        'Real scientific communities have complex social structures.',
        'Evidence quality varies; this model uses simple binomial sampling.',
        'Agents in this model are identical Bayesian reasoners.',
      ],
    },
    noStrategicBehavior: {
      title: 'Strategic behavior is not modeled',
      points: [
        'Agents do not consider career incentives.',
        'No publication bias or selective reporting.',
        'No competition for priority or funding.',
      ],
    },
    twoArms: {
      title: 'Only two options',
      points: [
        'Real scientific questions have many possible theories.',
        'Evidence can be ambiguous between multiple hypotheses.',
        'This binary setup is a pedagogical simplification.',
      ],
    },
    doNotInfer: {
      title: 'Do NOT infer',
      points: [
        'That sparse networks are always better for science.',
        'That this model explains actual scientific communities.',
        'That network manipulation is a simple policy lever.',
      ],
    },
  },

  source: {
    paper: 'The Communication Structure of Epistemic Communities',
    author: 'Kevin Zollman (2007)',
    note: 'Standard toy model based on multi-armed bandit framework.',
  },

  metrics: {
    meanBelief: {
      name: 'Mean Belief',
      description: 'Average belief that arm B is better across all agents.',
      unit: '',
    },
    converged: {
      name: 'Converged',
      description: 'Whether all agents agree on which arm is better.',
      unit: '',
    },
    explorationRate: {
      name: 'Exploration Rate',
      description: 'Proportion of agents still testing arm B.',
      unit: '',
    },
  },

  topologies: {
    cycle: {
      name: 'Cycle',
      description: 'Each agent connected only to two neighbors. Slower information spread.',
    },
    complete: {
      name: 'Complete',
      description: 'Every agent connected to every other. Fast information spread.',
    },
  },
};

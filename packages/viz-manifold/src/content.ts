/**
 * Content and explanatory text for the Manifold Learning visualizer.
 *
 * Scientific Status: Standard toy model
 */

export const CONTENT = {
  /**
   * Scientific status label (MUST be visible in UI)
   */
  scientificStatus: 'Standard toy model',

  /**
   * Title
   */
  title: 'Manifold Learning',

  /**
   * Brief description
   */
  description:
    'Demonstrates how dimensionality reduction algorithms unfold high-dimensional data lying on low-dimensional manifolds.',

  /**
   * What This Shows panel
   */
  whatThisShows: [
    'How data can lie on a low-dimensional surface embedded in higher dimensions',
    'How PCA preserves global variance but fails on nonlinear manifolds',
    'How Isomap uses geodesic distances to preserve manifold structure',
    'The difference between linear and nonlinear dimensionality reduction',
    'Quality metrics for evaluating embedding fidelity',
  ],

  /**
   * What This Does NOT Show panel (MANDATORY)
   */
  whatThisDoesNotShow: {
    notRealData: {
      title: 'This uses synthetic data only',
      points: [
        'Real-world data rarely lies on such clean manifolds.',
        'Noise, outliers, and missing data complicate real applications.',
        'The manifold hypothesis may not hold for arbitrary datasets.',
      ],
    },
    simplifiedAlgorithms: {
      title: 'Algorithms are simplified',
      points: [
        'These are educational implementations, not production-grade.',
        'Numerical stability issues may occur with certain inputs.',
        'Computational complexity is not optimized.',
      ],
    },
    theoreticalGuarantees: {
      title: 'Theoretical guarantees omitted',
      points: [
        'Conditions for successful embedding (e.g., manifold reach, sampling density) are not discussed.',
        'Error bounds and convergence properties are not shown.',
        'Parameter sensitivity is only partially demonstrated.',
      ],
    },
    alternativeApproaches: {
      title: 'Many techniques not shown',
      points: [
        't-SNE, UMAP, and other popular methods are not included.',
        'Kernel PCA and other nonlinear variants are omitted.',
        'Deep learning approaches (autoencoders) are not represented.',
      ],
    },
    doNotInfer: {
      title: 'Do NOT infer',
      points: [
        'That any algorithm is "best" for all data.',
        'That visualization quality reflects reconstruction ability.',
        'That 2D embeddings preserve all meaningful structure.',
      ],
    },
  },

  /**
   * Source reference
   */
  source: {
    paper: 'Manifold Learning',
    author: 'Various (Tenenbaum et al. 2000, Roweis & Saul 2000)',
    note: 'Standard toy model demonstrating fundamental dimensionality reduction concepts.',
  },

  /**
   * Metric explanations
   */
  metrics: {
    trustworthiness: {
      name: 'Trustworthiness',
      description:
        'Proportion of embedded neighbors that were true neighbors. High = few false neighbors.',
      unit: '',
    },
    continuity: {
      name: 'Continuity',
      description:
        'Proportion of true neighbors preserved in embedding. High = few lost neighbors.',
      unit: '',
    },
    explainedVariance: {
      name: 'Explained Variance',
      description:
        'Proportion of total variance captured by the embedding (for PCA).',
      unit: '%',
    },
    meanLocalDistortion: {
      name: 'Mean Local Distortion',
      description:
        'Average relative change in local distances. Lower is better.',
      unit: '',
    },
  },

  /**
   * Dataset descriptions
   */
  datasets: {
    'swiss-roll': {
      name: 'Swiss Roll',
      description:
        'A 2D surface rolled up in 3D like a Swiss roll cake. Classic nonlinear test case.',
    },
    's-curve': {
      name: 'S-Curve',
      description:
        'A 2D surface curved into an S shape in 3D. Tests handling of self-proximity.',
    },
    circles: {
      name: 'Concentric Circles',
      description:
        'Two circles of different radii. Tests separation of disconnected components.',
    },
  },

  /**
   * Algorithm descriptions
   */
  algorithms: {
    pca: {
      name: 'PCA (Principal Component Analysis)',
      description:
        'Linear projection onto directions of maximum variance. Fast and interpretable, but cannot unfold nonlinear manifolds.',
    },
    isomap: {
      name: 'Isomap',
      description:
        'Computes geodesic distances along the manifold using a k-nearest-neighbor graph, then applies MDS. Preserves global manifold structure.',
    },
  },
};

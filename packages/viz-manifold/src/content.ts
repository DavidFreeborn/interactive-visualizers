/**
 * Content for the Manifold Learning visualizer.
 * Refined for clarity and pedagogical effectiveness.
 */

export const CONTENT = {
  title: 'Unfolding the Swiss Roll',
  subtitle: 'How algorithms reveal hidden structure in high-dimensional data',

  /**
   * Intuitive explainer sections
   */
  explainer: {
    whatIsThis: {
      heading: 'What is this?',
      text: `Imagine a piece of paper rolled up like a Swiss roll cake. The paper is intrinsically flat (2D), but it exists in 3D space. If you only measure 3D distances, two points that are close in space might actually be far apart on the paper—they're on different "layers" of the roll.

Manifold learning algorithms try to unroll this structure, revealing the true 2D shape. The key insight is that traveling along the surface (geodesic distance) better reflects the data's real structure than flying through space (Euclidean distance).`,
    },

    coreIdea: {
      heading: 'The core idea',
      text: `Data often lies on a lower-dimensional surface (manifold) embedded in higher dimensions. A photo is millions of pixels, but the "space of faces" is much smaller. PCA finds the directions of maximum variance—great for linear data, but it can't unfold curved manifolds. It would squash a Swiss roll flat, mixing the layers.

Isomap first builds a graph connecting nearby points, then measures distances along this graph. These "geodesic" distances respect the manifold's shape, allowing Isomap to unfold the roll correctly.`,
    },

    whyMatters: {
      heading: 'Why does this matter?',
      text: `Dimensionality reduction is fundamental to modern data analysis and machine learning. High-dimensional data is hard to visualize, expensive to store, and prone to overfitting. Good embeddings preserve meaningful structure while discarding noise.

This has practical applications in image recognition, genomics, natural language processing, and anywhere data has hidden low-dimensional structure.`,
    },

    howToRead: {
      heading: 'How to read this visualization',
      text: `• **Color gradient** (red → blue): Shows position along the manifold. A successful embedding preserves this gradient smoothly.
• **3D view** (left): Drag to rotate! Lines show the neighbor graph used by Isomap/t-SNE.
• **2D view** (right): The embedding result. If colors scramble or fold, the algorithm failed.
• **Trustworthiness**: Did the embedding introduce false neighbors? High is good.
• **Continuity**: Were true neighbors preserved? High is good.`,
    },
  },

  /**
   * Metric explanations (concise)
   */
  metrics: {
    trustworthiness: {
      name: 'Trustworthiness',
      short: 'Did the embedding introduce false neighbors?',
      detail: 'Points that look close in 2D but were far in 3D. High is good.',
    },
    continuity: {
      name: 'Continuity',
      short: 'Were true neighbors preserved?',
      detail: 'Points that were close in 3D but ended up far in 2D. High is good.',
    },
    explainedVariance: {
      name: 'Explained Variance',
      short: 'How much variance is captured (PCA)',
      detail: 'Percentage of total variance in the 2D projection.',
    },
  },

  /**
   * Dataset descriptions with concrete examples
   */
  datasets: {
    'swiss-roll': {
      name: 'Swiss Roll',
      description: 'A 2D surface rolled up in 3D. Classic test case—PCA fails because it cannot distinguish layers.',
      analogy: 'Like a rolled-up piece of paper or a cinnamon roll.',
    },
    's-curve': {
      name: 'S-Curve',
      description: 'A 2D surface curved into an S shape. Tests whether the algorithm can handle self-proximity.',
      analogy: 'Like a winding mountain road seen from above.',
    },
    circles: {
      name: 'Concentric Circles',
      description: 'Two circles of different radii. Tests separation of disconnected components.',
      analogy: 'Like ripples in a pond—close in space but topologically separate.',
    },
  },

  /**
   * Algorithm descriptions
   */
  algorithms: {
    pca: {
      name: 'PCA',
      fullName: 'Principal Component Analysis',
      description: 'Projects data onto directions of maximum variance. Fast and interpretable, but linear—cannot unfold curved manifolds.',
      strength: 'Fast, simple, works well on linear data.',
      weakness: 'Squashes Swiss roll, mixing layers together.',
    },
    isomap: {
      name: 'Isomap',
      fullName: 'Isometric Mapping',
      description: 'Builds a neighbor graph, computes geodesic distances along it, then applies classical MDS.',
      strength: 'Correctly unfolds smooth manifolds like the Swiss roll.',
      weakness: 'Sensitive to noise, holes in the manifold, and choice of k.',
    },
    tsne: {
      name: 't-SNE',
      fullName: 't-Distributed Stochastic Neighbor Embedding',
      description: 'Converts similarities into probabilities and minimizes divergence. Excellent at preserving local clusters.',
      strength: 'Great for visualizing clusters and local structure.',
      weakness: 'Does not preserve global distances; perplexity-sensitive.',
    },
  },

  /**
   * Scenarios for guided exploration
   */
  scenarios: [
    {
      id: 'swiss-pca',
      name: 'Swiss Roll + PCA',
      description: 'See how PCA fails on nonlinear manifolds.',
      config: {
        dataset: 'swiss-roll' as const,
        algorithm: 'pca' as const,
        numSamples: 200,
        seed: 42,
      },
    },
    {
      id: 'swiss-isomap',
      name: 'Swiss Roll + Isomap',
      description: 'Watch Isomap correctly unfold the manifold.',
      config: {
        dataset: 'swiss-roll' as const,
        algorithm: 'isomap' as const,
        numSamples: 200,
        numNeighbors: 10,
        seed: 42,
      },
    },
    {
      id: 'swiss-tsne',
      name: 'Swiss Roll + t-SNE',
      description: 't-SNE preserves local clusters but distorts global shape.',
      config: {
        dataset: 'swiss-roll' as const,
        algorithm: 'tsne' as const,
        numSamples: 200,
        perplexity: 30,
        seed: 42,
      },
    },
    {
      id: 'circles-comparison',
      name: 'Circles comparison',
      description: 'Both algorithms separate circles—different mechanisms.',
      config: {
        dataset: 'circles' as const,
        algorithm: 'pca' as const,
        numSamples: 150,
        seed: 42,
      },
    },
  ],

  /**
   * Source reference
   */
  source: {
    paper: 'A Global Geometric Framework for Nonlinear Dimensionality Reduction',
    author: 'Tenenbaum, de Silva & Langford (2000)',
  },

  /**
   * Scientific caution (elegant, not clunky)
   */
  caution: `This uses clean synthetic data. Real-world manifolds are noisier, may have holes, and require careful parameter tuning. The visualizer shows why these algorithms work in ideal conditions—not how they perform on messy real data.`,
};

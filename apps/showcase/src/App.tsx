/**
 * Showcase App - Interactive Visualizers Demo
 */

import React, { useEffect, useState } from 'react';
import {
  ClassicSignalingGamesApp,
  CompositionalSignalingGamesApp,
  EnglishTownGeneratorApp,
} from '@viz/signaling';
import { ManifoldView } from '@viz/manifold';
import { PolarizationView } from '@viz/polarization';
import { ZollmanView } from '@viz/zollman';
import { DotsView } from '@viz/dots';

type VisualizerKey =
  | 'classic-signaling'
  | 'compositional-signaling'
  | 'english-town-generator'
  | 'manifold'
  | 'polarization'
  | 'zollman'
  | 'moving-dots';

interface VisualizerInfo {
  key: VisualizerKey;
  name: string;
  description: string;
  status: string;
}

function isVisualizerKey(value: string): value is VisualizerKey {
  return (
    value === 'classic-signaling' ||
    value === 'compositional-signaling' ||
    value === 'english-town-generator' ||
    value === 'manifold' ||
    value === 'polarization' ||
    value === 'zollman' ||
    value === 'moving-dots'
  );
}

function parseActiveVisualizerFromHash(hash: string): VisualizerKey | null {
  const normalized = hash.replace(/^#\/?/, '').trim();
  return isVisualizerKey(normalized) ? normalized : null;
}

function setHashForVisualizer(nextVisualizer: VisualizerKey | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (nextVisualizer === null) {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    return;
  }

  window.location.hash = nextVisualizer;
}

const VISUALIZERS: VisualizerInfo[] = [
  {
    key: 'classic-signaling',
    name: 'Classic signaling games',
    description: 'Ordinary Lewis-Skyrms sender-receiver signaling game',
    status: 'Phase 1',
  },
  {
    key: 'compositional-signaling',
    name: 'Compositional signaling games',
    description: 'Traditional, Minimalist, and Generalist compositional signaling games',
    status: 'Phase 2',
  },
  {
    key: 'english-town-generator',
    name: 'Synthetic English town-region',
    description: 'Research-grounded physical geography, settlement history, transport, urban form and analytical wards',
    status: 'Standard toy model',
  },
  {
    key: 'manifold',
    name: 'Manifold Learning',
    description: 'Dimensionality reduction with PCA and Isomap',
    status: 'Standard toy model',
  },
  {
    key: 'polarization',
    name: 'Factionalization & Polarization',
    description: 'Bayesian belief updating and explaining away',
    status: 'Standard toy model',
  },
  {
    key: 'zollman',
    name: 'Zollman Effect',
    description: 'Network epistemology and convergence dynamics',
    status: 'Standard toy model',
  },
  {
    key: 'moving-dots',
    name: 'Moving Dots',
    description: 'Emergent behavior: Boids, Friends & Enemies, Particle Life, Swarmalators',
    status: 'Conceptual analogy',
  },
];

export const App: React.FC = () => {
  const [activeViz, setActiveViz] = useState<VisualizerKey | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return parseActiveVisualizerFromHash(window.location.hash);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncFromLocation = () => {
      setActiveViz(parseActiveVisualizerFromHash(window.location.hash));
    };

    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  function navigateToVisualizer(nextVisualizer: VisualizerKey | null): void {
    setActiveViz(nextVisualizer);
    setHashForVisualizer(nextVisualizer);
  }

  if (activeViz === null) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Interactive Visualizers</h1>
          <p style={styles.subtitle}>
            Research-grade scientific visualizers for teaching and exploration
          </p>
        </header>

        <div style={styles.grid}>
          {VISUALIZERS.map((viz) => (
            <button
              key={viz.key}
              onClick={() => navigateToVisualizer(viz.key)}
              style={styles.card}
            >
              <h2 style={styles.cardTitle}>{viz.name}</h2>
              <p style={styles.cardDesc}>{viz.description}</p>
              <span style={styles.badge}>{viz.status}</span>
            </button>
          ))}
        </div>

        <footer style={styles.footer}>
          <p>7 visualizers implemented. Select one above to begin.</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={styles.vizContainer}>
      <nav style={styles.nav}>
        <button onClick={() => navigateToVisualizer(null)} style={styles.backButton}>
          &larr; Back to Index
        </button>
        <span style={styles.navTitle}>
          {VISUALIZERS.find((v) => v.key === activeViz)?.name}
        </span>
      </nav>

      <div style={styles.vizWrapper}>
        {activeViz === 'classic-signaling' && <ClassicSignalingGamesApp />}
        {activeViz === 'compositional-signaling' && <CompositionalSignalingGamesApp />}
        {activeViz === 'english-town-generator' && <EnglishTownGeneratorApp />}
        {activeViz === 'manifold' && <ManifoldView />}
        {activeViz === 'polarization' && <PolarizationView />}
        {activeViz === 'zollman' && <ZollmanView />}
        {activeViz === 'moving-dots' && <DotsView />}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: 1.4,
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#1976d2',
    background: '#e3f2fd',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  footer: {
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },
  vizContainer: {
    minHeight: '100vh',
    background: '#fff',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    borderBottom: '1px solid #e0e0e0',
    background: '#fafafa',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
  },
  navTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#333',
  },
  vizWrapper: {
    padding: '20px',
  },
};

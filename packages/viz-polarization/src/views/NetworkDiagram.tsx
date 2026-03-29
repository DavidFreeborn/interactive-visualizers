/**
 * Bayesian network diagram visualization.
 */

import React from 'react';
import type { BayesNetwork } from '../model/types';

export interface NetworkDiagramProps {
  network: BayesNetwork;
  width?: number;
  height?: number;
}

const NODE_RADIUS = 24;

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  network,
  width = 250,
  height = 200,
}) => {
  // Position nodes based on their role
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const cx = width / 2;
  const cy = height / 2;

  network.nodes.forEach((node, i) => {
    // Simple layout based on node id
    if (node.id === 'H') {
      nodePositions['H'] = { x: cx - 60, y: cy - 40 };
    } else if (node.id === 'S') {
      nodePositions['S'] = { x: cx + 60, y: cy - 40 };
    } else if (node.id === 'D') {
      nodePositions['D'] = { x: cx, y: cy + 40 };
    } else {
      // Fallback for unknown nodes
      nodePositions[node.id] = {
        x: cx + Math.cos((i * 2 * Math.PI) / network.nodes.length) * 50,
        y: cy + Math.sin((i * 2 * Math.PI) / network.nodes.length) * 50,
      };
    }
  });

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Network Structure</h4>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label={`Bayesian network diagram with ${network.nodes.length} nodes`}
      >
        <title>Bayesian Network</title>
        <desc>
          A directed graph showing causal relationships between variables.
          H = Hypothesis, S = Alternative cause, D = Data/Evidence.
        </desc>

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>

        {/* Edges */}
        {network.edges.map(([from, to], i) => {
          const fromPos = nodePositions[from];
          const toPos = nodePositions[to];
          if (!fromPos || !toPos) return null;

          // Compute edge endpoints (offset by node radius)
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (dx / dist) * NODE_RADIUS;
          const offsetY = (dy / dist) * NODE_RADIUS;

          return (
            <line
              key={`edge-${i}`}
              x1={fromPos.x + offsetX}
              y1={fromPos.y + offsetY}
              x2={toPos.x - offsetX}
              y2={toPos.y - offsetY}
              stroke="#666"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {network.nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const isHypothesis = node.id === network.hypothesisNode;
          const isEvidence = node.id === network.evidenceNode;

          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={isHypothesis ? '#e3f2fd' : isEvidence ? '#fff3e0' : '#f5f5f5'}
                stroke={isHypothesis ? '#1565c0' : isEvidence ? '#ef6c00' : '#666'}
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={16}
                fontWeight="bold"
                fill="#333"
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#e3f2fd', borderColor: '#1565c0' }} />
          Hypothesis
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#fff3e0', borderColor: '#ef6c00' }} />
          Evidence
        </span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 500,
  },
  svg: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
    fontSize: '12px',
    color: '#666',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid',
  },
};

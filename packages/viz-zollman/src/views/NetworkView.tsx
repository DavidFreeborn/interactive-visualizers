/**
 * Network diagram visualization for Zollman effect.
 */

import React, { useMemo } from 'react';
import type { ZollmanAgent } from '../model/types';

export interface NetworkViewProps {
  agents: ZollmanAgent[];
  neighbors: number[][];
  width?: number;
  height?: number;
}

function beliefToColor(belief: number): string {
  // Wrong (low belief) = red, Uncertain = gray, Correct (high belief) = green
  if (belief < 0.4) {
    return '#f44336'; // Red
  } else if (belief > 0.6) {
    return '#4caf50'; // Green
  }
  return '#9e9e9e'; // Gray
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  agents,
  neighbors,
  width = 300,
  height = 300,
}) => {
  const n = agents.length;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const nodeRadius = 20;

  // Position nodes in a circle
  const positions = useMemo(() => {
    return agents.map((_, i) => ({
      x: cx + radius * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
      y: cy + radius * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
    }));
  }, [n, cx, cy, radius]);

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Network</h4>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label="Social network diagram showing agent beliefs"
      >
        <title>Agent Network</title>
        <desc>
          A network graph with {n} agents arranged in a circle. Node color
          indicates belief: green = believes B is better, red = believes A is
          better.
        </desc>

        {/* Edges */}
        {neighbors.map((neighborList, i) =>
          neighborList
            .filter((j) => j > i) // Avoid duplicate edges
            .map((j) => (
              <line
                key={`edge-${i}-${j}`}
                x1={positions[i].x}
                y1={positions[i].y}
                x2={positions[j].x}
                y2={positions[j].y}
                stroke="#ccc"
                strokeWidth={2}
              />
            ))
        )}

        {/* Nodes */}
        {agents.map((agent, i) => (
          <g key={agent.id}>
            <circle
              cx={positions[i].x}
              cy={positions[i].y}
              r={nodeRadius}
              fill={beliefToColor(agent.belief)}
              stroke="#333"
              strokeWidth={2}
            />
            <text
              x={positions[i].x}
              y={positions[i].y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight="bold"
              fill="#fff"
            >
              {agent.id + 1}
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(10, ${height - 60})`}>
          <circle cx={8} cy={8} r={6} fill="#4caf50" />
          <text x={20} y={12} fontSize={10} fill="#595959">
            High P(B)
          </text>
          <circle cx={8} cy={28} r={6} fill="#f44336" />
          <text x={20} y={32} fontSize={10} fill="#595959">
            Low P(B)
          </text>
        </g>
      </svg>
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
};

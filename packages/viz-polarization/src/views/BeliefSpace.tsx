/**
 * Belief space visualization showing agent positions over time.
 */

import React, { useMemo } from 'react';
import type { AgentBeliefs } from '../model/types';

export interface BeliefSpaceProps {
  /** Agent beliefs at current timestep */
  currentBeliefs: AgentBeliefs[];
  /** History of beliefs for trajectory visualization */
  history: AgentBeliefs[][];
  /** Show trajectories */
  showTrajectories?: boolean;
  /** Width */
  width?: number;
  /** Height */
  height?: number;
}

const AGENT_COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0'];

export const BeliefSpace: React.FC<BeliefSpaceProps> = ({
  currentBeliefs,
  history,
  showTrajectories = true,
  width = 400,
  height = 400,
}) => {
  const padding = 40;
  const chartSize = Math.min(width, height) - 2 * padding;

  // Scale H belief [0,1] to pixel coordinates
  const scaleX = (h: number) => padding + h * chartSize;
  const scaleY = (s: number) => padding + chartSize - s * chartSize;

  // Build trajectory paths
  const trajectories = useMemo(() => {
    if (!showTrajectories || history.length < 2) return [];

    return currentBeliefs.map((_, agentIdx) => {
      const points = history.map((step) => {
        const agent = step[agentIdx];
        return {
          x: scaleX(agent.h),
          y: scaleY(agent.beliefs['S'] ?? 0.5),
        };
      });

      const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

      return { agentIdx, pathData };
    });
  }, [history, showTrajectories, currentBeliefs.length, scaleX, scaleY]);

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Belief Space</h4>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label="2D belief space showing agent positions with H on x-axis and S on y-axis"
      >
        <title>Agent Belief Space</title>
        <desc>
          A 2D plot showing agent beliefs. X-axis represents belief in hypothesis H,
          Y-axis represents belief in alternative S. Each dot is an agent.
        </desc>

        {/* Axes */}
        <line
          x1={padding}
          y1={padding + chartSize}
          x2={padding + chartSize}
          y2={padding + chartSize}
          stroke="#595959"
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartSize}
          stroke="#595959"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text
          x={padding + chartSize / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize={12}
          fill="#595959"
        >
          P(H)
        </text>
        <text
          x={10}
          y={padding + chartSize / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#595959"
          transform={`rotate(-90, 10, ${padding + chartSize / 2})`}
        >
          P(S)
        </text>

        {/* Grid lines at 0.5 */}
        <line
          x1={scaleX(0.5)}
          y1={padding}
          x2={scaleX(0.5)}
          y2={padding + chartSize}
          stroke="#e0e0e0"
          strokeDasharray="4,4"
        />
        <line
          x1={padding}
          y1={scaleY(0.5)}
          x2={padding + chartSize}
          y2={scaleY(0.5)}
          stroke="#e0e0e0"
          strokeDasharray="4,4"
        />

        {/* Tick labels */}
        {[0, 0.5, 1].map((v) => (
          <g key={`tick-${v}`}>
            <text
              x={scaleX(v)}
              y={padding + chartSize + 15}
              textAnchor="middle"
              fontSize={10}
              fill="#595959"
            >
              {v}
            </text>
            <text
              x={padding - 8}
              y={scaleY(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#595959"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Trajectories */}
        {trajectories.map(({ agentIdx, pathData }) => (
          <path
            key={`traj-${agentIdx}`}
            d={pathData}
            fill="none"
            stroke={AGENT_COLORS[agentIdx % AGENT_COLORS.length]}
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
        ))}

        {/* Current agent positions */}
        {currentBeliefs.map((agent, i) => (
          <g key={`agent-${i}`}>
            <circle
              cx={scaleX(agent.h)}
              cy={scaleY(agent.beliefs['S'] ?? 0.5)}
              r={8}
              fill={AGENT_COLORS[i % AGENT_COLORS.length]}
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={scaleX(agent.h)}
              y={scaleY(agent.beliefs['S'] ?? 0.5)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="#fff"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          </g>
        ))}
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

/**
 * Belief timeline visualization for Zollman effect.
 */

import React from 'react';

export interface BeliefTimelineProps {
  beliefHistory: number[];
  width?: number;
  height?: number;
}

export const BeliefTimeline: React.FC<BeliefTimelineProps> = ({
  beliefHistory,
  width = 400,
  height = 200,
}) => {
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (i: number) =>
    padding.left + (i / Math.max(beliefHistory.length - 1, 1)) * chartWidth;
  const yScale = (v: number) =>
    padding.top + chartHeight - v * chartHeight;

  // Build path
  const pathData = beliefHistory
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`)
    .join(' ');

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Mean Belief Over Time</h4>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label="Timeline chart showing mean belief over simulation rounds"
      >
        <title>Belief Timeline</title>

        {/* Y axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#ccc"
        />

        {/* X axis */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#ccc"
        />

        {/* Grid lines at 0.5 */}
        <line
          x1={padding.left}
          y1={yScale(0.5)}
          x2={padding.left + chartWidth}
          y2={yScale(0.5)}
          stroke="#e0e0e0"
          strokeDasharray="4,4"
        />

        {/* Y axis labels */}
        {[0, 0.5, 1].map((v) => (
          <text
            key={v}
            x={padding.left - 8}
            y={yScale(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="#595959"
          >
            {v}
          </text>
        ))}

        {/* Truth marker (1.0) */}
        <line
          x1={padding.left}
          y1={yScale(1)}
          x2={padding.left + chartWidth}
          y2={yScale(1)}
          stroke="#4caf50"
          strokeDasharray="2,2"
          strokeOpacity={0.5}
        />
        <text
          x={padding.left + chartWidth + 5}
          y={yScale(1)}
          dominantBaseline="middle"
          fontSize={9}
          fill="#4caf50"
        >
          Truth
        </text>

        {/* Data line */}
        {beliefHistory.length > 1 && (
          <path d={pathData} fill="none" stroke="#2196f3" strokeWidth={2} />
        )}

        {/* Current point */}
        {beliefHistory.length > 0 && (
          <circle
            cx={xScale(beliefHistory.length - 1)}
            cy={yScale(beliefHistory[beliefHistory.length - 1])}
            r={4}
            fill="#2196f3"
          />
        )}

        {/* X axis label */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize={11}
          fill="#595959"
        >
          Round
        </text>

        {/* Y axis label */}
        <text
          x={10}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#595959"
          transform={`rotate(-90, 10, ${padding.top + chartHeight / 2})`}
        >
          P(B better)
        </text>
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

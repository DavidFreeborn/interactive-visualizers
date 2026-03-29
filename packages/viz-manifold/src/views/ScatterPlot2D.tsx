/**
 * 2D scatter plot visualization for embedding results.
 */

import React, { useMemo } from 'react';

export interface ScatterPlot2DProps {
  /** 2D coordinates for each point */
  points: number[][];
  /** Color parameter [0,1] for each point */
  params: number[];
  /** Width */
  width?: number;
  /** Height */
  height?: number;
  /** Title */
  title?: string;
}

/**
 * Maps parameter [0,1] to a color (same as 3D plot for consistency).
 */
function paramToColor(param: number): string {
  const h = (1 - param) * 240;
  return `hsl(${h}, 70%, 50%)`;
}

export const ScatterPlot2D: React.FC<ScatterPlot2DProps> = ({
  points,
  params,
  width = 300,
  height = 300,
  title,
}) => {
  // Compute bounds
  const bounds = useMemo(() => {
    if (points.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of points) {
      const x = p[0] ?? 0;
      const y = p[1] ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Add padding
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padX = rangeX * 0.1;
    const padY = rangeY * 0.1;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [points]);

  const padding = 30;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const scaleX = (x: number) =>
    padding +
    ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * chartWidth;
  const scaleY = (y: number) =>
    padding +
    chartHeight -
    ((y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * chartHeight;

  return (
    <div style={styles.container}>
      {title && <h4 style={styles.title}>{title}</h4>}
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label={`2D scatter plot: ${title || 'embedded data'}`}
      >
        <title>{title || '2D Embedding'}</title>
        <desc>
          A 2D scatter plot showing {points.length} embedded data points
          colored by their position on the original manifold.
        </desc>

        {/* Points */}
        {points.map((p, i) => {
          const x = p[0] ?? 0;
          const y = p[1] ?? 0;
          return (
            <circle
              key={i}
              cx={scaleX(x)}
              cy={scaleY(y)}
              r={3}
              fill={paramToColor(params[i] ?? 0.5)}
              stroke="none"
            />
          );
        })}

        {/* Axis labels */}
        <text
          x={padding + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize={10}
          fill="#595959"
        >
          Dimension 1
        </text>
        <text
          x={10}
          y={padding + chartHeight / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#595959"
          transform={`rotate(-90, 10, ${padding + chartHeight / 2})`}
        >
          Dimension 2
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

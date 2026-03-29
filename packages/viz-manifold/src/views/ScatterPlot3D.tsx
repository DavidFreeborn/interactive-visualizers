/**
 * 3D scatter plot visualization (projected to 2D).
 *
 * Uses simple isometric projection for display.
 */

import React, { useMemo } from 'react';

export interface ScatterPlot3DProps {
  /** 3D coordinates for each point */
  points: number[][];
  /** Color parameter [0,1] for each point */
  params: number[];
  /** Optional neighbor edges to draw */
  neighborGraph?: number[][];
  /** Show neighbor edges */
  showEdges?: boolean;
  /** Width */
  width?: number;
  /** Height */
  height?: number;
  /** Title */
  title?: string;
}

/**
 * Maps parameter [0,1] to a color (viridis-like).
 */
function paramToColor(param: number): string {
  // Simple rainbow gradient
  const h = (1 - param) * 240; // Blue to red
  return `hsl(${h}, 70%, 50%)`;
}

/**
 * Simple isometric projection from 3D to 2D.
 */
function project3Dto2D(
  point: number[],
  rotationY: number = 0.5
): [number, number] {
  const [x, y, z] = point;
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);

  // Rotate around Y axis
  const x1 = x * cosR + z * sinR;
  const z1 = -x * sinR + z * cosR;

  // Isometric projection
  const px = x1 * 0.866 - z1 * 0.866;
  const py = -y + x1 * 0.5 + z1 * 0.5;

  return [px, py];
}

export const ScatterPlot3D: React.FC<ScatterPlot3DProps> = ({
  points,
  params,
  neighborGraph = [],
  showEdges = false,
  width = 300,
  height = 300,
  title,
}) => {
  // Project all points
  const projected = useMemo(() => {
    if (points.length === 0) return [];
    return points.map((p) => project3Dto2D(p));
  }, [points]);

  // Compute bounds for scaling
  const bounds = useMemo(() => {
    if (projected.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const [x, y] of projected) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Add padding
    const padX = (maxX - minX) * 0.1 || 1;
    const padY = (maxY - minY) * 0.1 || 1;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [projected]);

  // Scale coordinates to SVG space
  const padding = 30;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const scaleX = (x: number) =>
    padding +
    ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * chartWidth;
  const scaleY = (y: number) =>
    padding +
    ((y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * chartHeight;

  return (
    <div style={styles.container}>
      {title && <h4 style={styles.title}>{title}</h4>}
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label={`3D scatter plot: ${title || 'data visualization'}`}
      >
        <title>{title || '3D Scatter Plot'}</title>
        <desc>
          A 3D scatter plot projected to 2D showing {points.length} data points
          colored by their position on the manifold.
        </desc>

        {/* Edges */}
        {showEdges &&
          neighborGraph.map((neighbors, i) =>
            neighbors.map((j) => {
              if (j <= i) return null; // Avoid duplicate edges
              const [x1, y1] = projected[i] || [0, 0];
              const [x2, y2] = projected[j] || [0, 0];
              return (
                <line
                  key={`edge-${i}-${j}`}
                  x1={scaleX(x1)}
                  y1={scaleY(y1)}
                  x2={scaleX(x2)}
                  y2={scaleY(y2)}
                  stroke="#ccc"
                  strokeWidth={0.5}
                  strokeOpacity={0.3}
                />
              );
            })
          )}

        {/* Points */}
        {projected.map(([x, y], i) => (
          <circle
            key={i}
            cx={scaleX(x)}
            cy={scaleY(y)}
            r={3}
            fill={paramToColor(params[i] ?? 0.5)}
            stroke="none"
          />
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

/**
 * Interactive 3D scatter plot with mouse rotation.
 *
 * Click and drag to rotate the view.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';

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
 * Maps parameter [0,1] to a color (blue to red gradient).
 */
function paramToColor(param: number): string {
  const h = (1 - param) * 240; // Blue to red
  return `hsl(${h}, 70%, 50%)`;
}

/**
 * 3D rotation and projection.
 */
function project3Dto2D(
  point: number[],
  rotationY: number,
  rotationX: number
): [number, number, number] {
  const [x, y, z] = point;

  // Rotate around Y axis
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  // Rotate around X axis
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  // Perspective projection (simple orthographic for clarity)
  const scale = 1;
  const px = x1 * scale;
  const py = -y1 * scale;

  return [px, py, z2];
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
  const [rotationY, setRotationY] = useState(0.5);
  const [rotationX, setRotationX] = useState(0.3);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;

      setRotationY((r) => r + dx * 0.01);
      setRotationX((r) => Math.max(-1.5, Math.min(1.5, r + dy * 0.01)));

      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Project all points with depth
  const projected = useMemo(() => {
    if (points.length === 0) return [];
    return points.map((p) => project3Dto2D(p, rotationY, rotationX));
  }, [points, rotationY, rotationX]);

  // Sort by depth for proper rendering
  const sortedIndices = useMemo(() => {
    return projected
      .map((_, i) => i)
      .sort((a, b) => (projected[a]?.[2] ?? 0) - (projected[b]?.[2] ?? 0));
  }, [projected]);

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

    const padX = (maxX - minX) * 0.1 || 1;
    const padY = (maxY - minY) * 0.1 || 1;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [projected]);

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
        ref={svgRef}
        width={width}
        height={height}
        style={{
          ...styles.svg,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        role="img"
        aria-label={`Interactive 3D scatter plot: ${title || 'data visualization'}. Drag to rotate.`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <title>{title || '3D Scatter Plot'}</title>
        <desc>
          An interactive 3D scatter plot showing {points.length} data points.
          Drag to rotate the view. Points are colored by their position on the
          manifold (blue to red gradient).
        </desc>

        {/* Edges (rendered first, before points) */}
        {showEdges &&
          neighborGraph.map((neighbors, i) =>
            neighbors.map((j) => {
              if (j <= i) return null;
              const pi = projected[i];
              const pj = projected[j];
              if (!pi || !pj) return null;
              return (
                <line
                  key={`edge-${i}-${j}`}
                  x1={scaleX(pi[0])}
                  y1={scaleY(pi[1])}
                  x2={scaleX(pj[0])}
                  y2={scaleY(pj[1])}
                  stroke="#ccc"
                  strokeWidth={0.5}
                  strokeOpacity={0.3}
                />
              );
            })
          )}

        {/* Points (sorted by depth for proper occlusion) */}
        {sortedIndices.map((i) => {
          const proj = projected[i];
          if (!proj) return null;
          const [x, y, z] = proj;

          // Size and opacity based on depth (further = smaller/fainter)
          const depthFactor = 0.7 + 0.3 * ((z + 5) / 10);
          const radius = Math.max(2, 4 * depthFactor);

          return (
            <circle
              key={i}
              cx={scaleX(x)}
              cy={scaleY(y)}
              r={radius}
              fill={paramToColor(params[i] ?? 0.5)}
              stroke="none"
              opacity={Math.max(0.4, depthFactor)}
            />
          );
        })}

        {/* Rotation hint */}
        <text
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize={10}
          fill="#94a3b8"
        >
          Drag to rotate
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
    userSelect: 'none',
  },
};

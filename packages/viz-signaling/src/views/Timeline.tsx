/**
 * Timeline chart showing metrics over simulation turns.
 */

import React from 'react';

export interface TimelineData {
  turns: number[];
  series: {
    label: string;
    values: number[];
    color: string;
  }[];
  markers?: {
    turn: number;
    label: string;
    color: string;
  }[];
}

export interface TimelineProps {
  data: TimelineData;
  width?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  data,
  width = 600,
  height = 200,
  yMin = 0,
  yMax = 2,
}) => {
  const padding = { top: 20, right: 80, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xMin = data.turns[0] ?? 0;
  const xMax = data.turns[data.turns.length - 1] ?? 1;
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const scaleX = (x: number) =>
    padding.left + ((x - xMin) / xRange) * chartWidth;
  const scaleY = (y: number) =>
    padding.top + chartHeight - ((y - yMin) / yRange) * chartHeight;

  // Build path for each series
  const paths = data.series.map((series) => {
    if (series.values.length === 0) return null;

    const points = series.values.map((v, i) => {
      const x = scaleX(data.turns[i] ?? i);
      const y = scaleY(Math.max(yMin, Math.min(yMax, v)));
      return `${x},${y}`;
    });

    return (
      <g key={series.label}>
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={series.color}
          strokeWidth={2}
        />
      </g>
    );
  });

  // Y-axis ticks
  const yTicks = [0, 0.5, 1, 1.5, 2].filter((v) => v >= yMin && v <= yMax);

  // X-axis ticks
  const numXTicks = 5;
  const xTicks = Array.from(
    { length: numXTicks },
    (_, i) => xMin + (xRange * i) / (numXTicks - 1)
  );

  return (
    <div style={styles.container}>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        role="img"
        aria-label="Timeline chart showing information content and success rate over simulation turns"
      >
        <title>Metrics Over Time</title>
        <desc>
          A line chart plotting information content (bits) and success rate
          against simulation turn number. Vertical markers indicate significant events
          such as signal replacement.
        </desc>
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#ccc"
        />

        {/* Y-axis ticks */}
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={padding.left - 5}
              y1={scaleY(tick)}
              x2={padding.left}
              y2={scaleY(tick)}
              stroke="#666"
            />
            <text
              x={padding.left - 8}
              y={scaleY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#595959"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#ccc"
        />

        {/* X-axis ticks */}
        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              x1={scaleX(tick)}
              y1={padding.top + chartHeight}
              x2={scaleX(tick)}
              y2={padding.top + chartHeight + 5}
              stroke="#666"
            />
            <text
              x={scaleX(tick)}
              y={padding.top + chartHeight + 15}
              textAnchor="middle"
              fontSize={10}
              fill="#595959"
            >
              {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={`grid-${tick}`}
            x1={padding.left}
            y1={scaleY(tick)}
            x2={padding.left + chartWidth}
            y2={scaleY(tick)}
            stroke="#f0f0f0"
          />
        ))}

        {/* Markers (e.g., replacement turn) */}
        {data.markers?.map((marker, i) => (
          <g key={`marker-${i}`}>
            <line
              x1={scaleX(marker.turn)}
              y1={padding.top}
              x2={scaleX(marker.turn)}
              y2={padding.top + chartHeight}
              stroke={marker.color}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={scaleX(marker.turn) + 4}
              y={padding.top + 12}
              fontSize={10}
              fill={marker.color}
            >
              {marker.label}
            </text>
          </g>
        ))}

        {/* Data series */}
        {paths}

        {/* Legend */}
        {data.series.map((series, i) => (
          <g key={`legend-${i}`}>
            <line
              x1={padding.left + chartWidth + 10}
              y1={padding.top + 10 + i * 20}
              x2={padding.left + chartWidth + 30}
              y2={padding.top + 10 + i * 20}
              stroke={series.color}
              strokeWidth={2}
            />
            <text
              x={padding.left + chartWidth + 35}
              y={padding.top + 10 + i * 20}
              dominantBaseline="middle"
              fontSize={11}
              fill="#333"
            >
              {series.label}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize={11}
          fill="#595959"
        >
          Turn
        </text>

        {/* Y-axis label */}
        <text
          x={15}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#595959"
          transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
        >
          Value
        </text>
      </svg>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {},
  svg: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
};

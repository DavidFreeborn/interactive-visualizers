import React from 'react';

export interface LineSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
}

export interface LineChartVerticalMarker {
  id: string;
  round: number;
  label: string;
  color?: string;
  opacity?: number;
  dashed?: boolean;
}

export interface LineChartProps {
  title: string;
  rounds: number[];
  series: LineSeries[];
  yMin: number;
  yMax: number;
  formatTick?: (value: number) => string;
  dataTestId?: string;
  verticalMarkers?: LineChartVerticalMarker[];
}

/**
 * Compact SVG line chart for metric histories.
 */
export function LineChart({
  title,
  rounds,
  series,
  yMin,
  yMax,
  formatTick = (value) => value.toFixed(2),
  dataTestId,
  verticalMarkers = [],
}: LineChartProps): React.ReactElement {
  const width = 420;
  const height = 180;
  const padding = { top: 18, right: 20, bottom: 24, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const visibleRounds = rounds.length > 0 ? rounds : [0];
  const xMin = visibleRounds[0];
  const xMax = visibleRounds[visibleRounds.length - 1] || 1;
  const xRange = Math.max(1, xMax - xMin);
  const yRange = Math.max(1e-9, yMax - yMin);

  const scaleX = (round: number) => padding.left + ((round - xMin) / xRange) * innerWidth;
  const scaleY = (value: number) =>
    padding.top + innerHeight - ((value - yMin) / yRange) * innerHeight;

  const gridTicks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`${title} line chart`}
      data-testid={dataTestId}
      data-point-count={rounds.length}
      style={styles.svg}
    >
      <title>{title}</title>
      {gridTicks.map((tickValue) => (
        <g key={tickValue}>
          <line
            x1={padding.left}
            x2={padding.left + innerWidth}
            y1={scaleY(tickValue)}
            y2={scaleY(tickValue)}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth={1}
          />
          <text
            x={padding.left - 8}
            y={scaleY(tickValue)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="#6b7280"
          >
            {formatTick(tickValue)}
          </text>
        </g>
      ))}
      {verticalMarkers
        .filter((marker) => marker.round >= xMin && marker.round <= xMax)
        .map((marker) => {
          const x = scaleX(marker.round);

          return (
            <g key={marker.id}>
              <line
                x1={x}
                x2={x}
                y1={padding.top}
                y2={padding.top + innerHeight}
                stroke={marker.color ?? "#374151"}
                strokeWidth={1.5}
                strokeOpacity={marker.opacity ?? 0.85}
                strokeDasharray={marker.dashed === false ? undefined : "6 6"}
                data-testid={`line-chart-marker-${marker.id}`}
              />
              <text
                x={x + 6}
                y={padding.top + 12}
                fontSize={10}
                fontWeight={700}
                fill={marker.color ?? "#374151"}
              >
                {marker.label}
              </text>
            </g>
          );
        })}
      {series.map((entry) => {
        if (entry.values.length === 0 || rounds.length === 0) {
          return null;
        }

        const path = entry.values
          .map((value, index) => {
            const x = scaleX(rounds[index]);
            const y = scaleY(value);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          })
          .join(' ');

        const lastRound = rounds[rounds.length - 1];
        const lastValue = entry.values[entry.values.length - 1];

        return (
          <g key={entry.id}>
            <path d={path} fill="none" stroke={entry.color} strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={scaleX(lastRound)} cy={scaleY(lastValue)} r={3.5} fill={entry.color} />
          </g>
        );
      })}
      <text x={padding.left} y={height - 6} fontSize={10} fill="#6b7280">
        {xMin.toLocaleString()}
      </text>
      <text
        x={padding.left + innerWidth}
        y={height - 6}
        textAnchor="end"
        fontSize={10}
        fill="#6b7280"
      >
        {xMax.toLocaleString()}
      </text>
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  svg: {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
  },
};

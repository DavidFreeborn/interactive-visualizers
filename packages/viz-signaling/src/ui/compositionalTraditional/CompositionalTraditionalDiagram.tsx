import React, { useMemo, useState } from "react";
import type {
  CompositionalConfig,
  CompositionalPolicies,
} from "../../model/compositionalShared";
import type { TraditionalRoundAnimationState } from "./types";

export interface CompositionalTraditionalDiagramProps {
  config: CompositionalConfig;
  policies: CompositionalPolicies;
  animation: TraditionalRoundAnimationState;
  showProbabilityLabels: boolean;
  stateLabels?: string[];
  actionLabels?: string[];
}

interface HoveredEdge {
  description: string;
  probability: number;
}

interface Point {
  x: number;
  y: number;
}

interface NodeGeometry extends Point {
  radius: number;
}

interface CurveGeometry {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
  midpoint: Point;
  path: string;
}

interface Palette {
  fill: string;
  stroke: string;
}

const STATE_LABELS = ["red dress", "blue dress", "red suit", "blue suit"];
const ACTION_LABELS = ["red dress", "blue dress", "red suit", "blue suit"];
const DRESS_EDGE_STROKE = "#6b7280";
const SUIT_EDGE_STROKE = "#1f2937";
const RED_EDGE_STROKE = "#dc2626";
const BLUE_EDGE_STROKE = "#2563eb";

function createPalette(index: number): Palette {
  const palettes: Palette[] = [
    { fill: "#fee2e2", stroke: "#dc2626" },
    { fill: "#dbeafe", stroke: "#2563eb" },
    { fill: "#fecaca", stroke: "#991b1b" },
    { fill: "#bfdbfe", stroke: "#1d4ed8" },
  ];
  return palettes[index] ?? { fill: "#f3f4f6", stroke: "#374151" };
}

function formatProbability(value: number): string {
  return value.toFixed(3);
}

function visualStrength(probability: number, optionCount: number): number {
  const uniform = 1 / optionCount;
  const baselineAdjusted = Math.max(0, (probability - uniform) / (1 - uniform));
  if (baselineAdjusted <= 0) {
    return 0;
  }
  return 1 - Math.pow(1 - baselineAdjusted, 2.8);
}

function cubicBezierPoint(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  progress: number,
): Point {
  const inverse = 1 - progress;
  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * progress * control1.x +
      3 * inverse * progress ** 2 * control2.x +
      progress ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * progress * control1.y +
      3 * inverse * progress ** 2 * control2.y +
      progress ** 3 * end.y,
  };
}

function buildCurve(start: Point, end: Point): CurveGeometry {
  const horizontalSpan = end.x - start.x;
  const controlOffset = Math.max(56, Math.abs(horizontalSpan) * 0.34);
  const control1 = { x: start.x + controlOffset, y: start.y };
  const control2 = { x: end.x - controlOffset, y: end.y };
  const midpoint = cubicBezierPoint(start, control1, control2, end, 0.5);

  return {
    start,
    control1,
    control2,
    end,
    midpoint,
    path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`,
  };
}

function buildSenderFamilyToActionCurve(
  start: Point,
  end: Point,
  pairOffset: number,
  family: "a" | "b",
): CurveGeometry {
  const control1 = {
    x: start.x + 106,
    y: start.y + (family === "a" ? -18 : 18) + pairOffset * 0.35,
  };
  const control2 = {
    x: end.x - 132,
    y: end.y + (family === "a" ? -16 : 16) + pairOffset,
  };
  const midpoint = cubicBezierPoint(start, control1, control2, end, 0.5);

  return {
    start,
    control1,
    control2,
    end,
    midpoint,
    path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`,
  };
}

function senderAEdgeStroke(stateIndex: number): string {
  return stateIndex < 2 ? DRESS_EDGE_STROKE : SUIT_EDGE_STROKE;
}

function senderBEdgeStroke(stateIndex: number): string {
  return stateIndex === 0 || stateIndex === 2
    ? RED_EDGE_STROKE
    : BLUE_EDGE_STROKE;
}

function senderAToActionStroke(actionIndex: number): string {
  return actionIndex < 2 ? DRESS_EDGE_STROKE : SUIT_EDGE_STROKE;
}

function senderBToActionStroke(actionIndex: number): string {
  return actionIndex === 0 || actionIndex === 2
    ? RED_EDGE_STROKE
    : BLUE_EDGE_STROKE;
}

function CenteredSvgText({
  x,
  y,
  style,
  children,
}: {
  x: number;
  y: number;
  style: React.CSSProperties;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      alignmentBaseline="middle"
      style={style}
    >
      {children}
    </text>
  );
}

function aggregateSenderANodeActionSupport(
  policies: CompositionalPolicies,
  messageAIndex: number,
  actionIndex: number,
): number {
  let support = 0;
  const row = policies.receiverPairPolicy[messageAIndex] ?? [];
  for (let messageBIndex = 0; messageBIndex < row.length; messageBIndex += 1) {
    support += row[messageBIndex][actionIndex];
  }
  return row.length > 0 ? support / row.length : 0;
}

function aggregateSenderBNodeActionSupport(
  policies: CompositionalPolicies,
  messageBIndex: number,
  actionIndex: number,
): number {
  const numMessagesA = policies.receiverPairPolicy.length;
  if (numMessagesA === 0) {
    return 0;
  }

  let support = 0;
  for (
    let messageAIndex = 0;
    messageAIndex < numMessagesA;
    messageAIndex += 1
  ) {
    support +=
      policies.receiverPairPolicy[messageAIndex][messageBIndex][actionIndex];
  }
  return support / numMessagesA;
}

/**
 * Main node-level diagram for the compositional signaling game.
 */
export function CompositionalTraditionalDiagram({
  config,
  policies,
  animation,
  showProbabilityLabels,
  stateLabels = STATE_LABELS,
  actionLabels = ACTION_LABELS,
}: CompositionalTraditionalDiagramProps): React.ReactElement {
  const [hoveredEdge, setHoveredEdge] = useState<HoveredEdge | null>(null);
  const width = 760;
  const height = 450;
  const natureFrame = { x: 36, y: 30, width: 184, height: 344 };
  const sendersFrame = { x: 248, y: 30, width: 252, height: 344 };
  const senderAFrame = { x: 268, y: 102, width: 212, height: 92 };
  const senderBFrame = { x: 268, y: 216, width: 212, height: 92 };
  const receiverFrame = { x: 528, y: 30, width: 184, height: 344 };
  const stateX = 132;
  const senderX = 374;
  const actionX = 620;
  const stateYPositions = [112, 184, 256, 328];
  const senderAYPositions = [130, 166];
  const senderBYPositions = [244, 280];
  const actionYPositions = [112, 184, 256, 328];
  const stateNodes = useMemo(
    () =>
      Array.from({ length: config.numStates }, (_, index) => ({
        x: stateX,
        y: stateYPositions[index],
        radius: 20,
      })),
    [config.numStates],
  );
  const senderANodes = useMemo(
    () =>
      [0, 1].map((index) => ({
        x: senderX,
        y: senderAYPositions[index],
        radius: 18,
      })),
    [],
  );
  const senderBNodes = useMemo(
    () =>
      [0, 1].map((index) => ({
        x: senderX,
        y: senderBYPositions[index],
        radius: 18,
      })),
    [],
  );
  const actionNodes = useMemo(
    () =>
      Array.from({ length: config.numActions }, (_, index) => ({
        x: actionX,
        y: actionYPositions[index],
        radius: 20,
      })),
    [config.numActions],
  );

  const statePalettes = useMemo(
    () =>
      Array.from({ length: config.numStates }, (_, index) =>
        createPalette(index),
      ),
    [config.numStates],
  );
  const actionPalettes = statePalettes;
  const activeEvent = animation.event;

  function pairIndex(messageAIndex: number, messageBIndex: number): number {
    return messageAIndex * config.numMessagesB + messageBIndex;
  }

  const pairLaneOffsets = [-28, -10, 10, 28];

  return (
    <div style={styles.wrapper}>
      {hoveredEdge ? (
        <div style={styles.tooltip} data-testid="compositional-edge-tooltip">
          {`${hoveredEdge.description} = ${formatProbability(hoveredEdge.probability)}`}
        </div>
      ) : null}
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Compositional signaling game diagram"
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={22}
          fill="#ffffff"
        />
        <rect
          x={natureFrame.x}
          y={natureFrame.y}
          width={natureFrame.width}
          height={natureFrame.height}
          rx={20}
          fill="#fcfcfd"
          stroke="#e5e7eb"
          strokeWidth={1.5}
        />
        <rect
          x={sendersFrame.x}
          y={sendersFrame.y}
          width={sendersFrame.width}
          height={sendersFrame.height}
          rx={20}
          fill="#fafbfc"
          stroke="#dbe4ee"
          strokeWidth={1.5}
        />
        <rect
          x={senderAFrame.x}
          y={senderAFrame.y}
          width={senderAFrame.width}
          height={senderAFrame.height}
          rx={16}
          fill="#ffffff"
          stroke="#e5e7eb"
          strokeWidth={1.25}
        />
        <rect
          x={senderBFrame.x}
          y={senderBFrame.y}
          width={senderBFrame.width}
          height={senderBFrame.height}
          rx={16}
          fill="#ffffff"
          stroke="#e5e7eb"
          strokeWidth={1.25}
        />
        <rect
          x={receiverFrame.x}
          y={receiverFrame.y}
          width={receiverFrame.width}
          height={receiverFrame.height}
          rx={20}
          fill="#fafbfc"
          stroke="#dbe4ee"
          strokeWidth={1.5}
        />
        <CenteredSvgText
          x={natureFrame.x + natureFrame.width / 2}
          y={60}
          style={styles.headerText}
        >
          Nature
        </CenteredSvgText>
        <CenteredSvgText
          x={sendersFrame.x + sendersFrame.width / 2}
          y={60}
          style={styles.headerText}
        >
          Senders
        </CenteredSvgText>
        <CenteredSvgText
          x={receiverFrame.x + receiverFrame.width / 2}
          y={60}
          style={styles.headerText}
        >
          Receiver
        </CenteredSvgText>
        <CenteredSvgText
          x={senderAFrame.x + senderAFrame.width / 2}
          y={94}
          style={styles.sectionText}
        >
          Sender A
        </CenteredSvgText>
        <CenteredSvgText
          x={senderBFrame.x + senderBFrame.width / 2}
          y={208}
          style={styles.sectionText}
        >
          Sender B
        </CenteredSvgText>

        {policies.senderAPolicy.map((row, stateIndex) =>
          row.map((probability, messageAIndex) => {
            const curve = buildCurve(
              stateNodes[stateIndex],
              senderANodes[messageAIndex],
            );
            const strength = visualStrength(probability, config.numMessagesA);
            const active =
              activeEvent !== null &&
              activeEvent.stateIndex === stateIndex &&
              activeEvent.messageAIndex === messageAIndex &&
              ["senders", "pair", "action", "result"].includes(animation.phase);

            return (
              <g key={`state-a-${stateIndex}-${messageAIndex}`}>
                <path
                  d={curve.path}
                  fill="none"
                  stroke={active ? "#d97706" : senderAEdgeStroke(stateIndex)}
                  strokeOpacity={
                    active ? 1 : 0.16 + probability * 0.18 + strength * 0.42
                  }
                  strokeWidth={
                    active ? 5 : 1.1 + probability * 1.2 + strength * 3.1
                  }
                  strokeLinecap="round"
                  onMouseEnter={() =>
                    setHoveredEdge({
                      description: `P_A(A${messageAIndex} | S${stateIndex})`,
                      probability,
                    })
                  }
                  onMouseLeave={() => setHoveredEdge(null)}
                  data-testid={`edge-state-${stateIndex}-a-${messageAIndex}`}
                />
                {showProbabilityLabels ? (
                  <text
                    x={curve.midpoint.x}
                    y={curve.midpoint.y - 8}
                    textAnchor="middle"
                    style={styles.edgeLabel}
                  >
                    {formatProbability(probability)}
                  </text>
                ) : null}
              </g>
            );
          }),
        )}

        {policies.senderBPolicy.map((row, stateIndex) =>
          row.map((probability, messageBIndex) => {
            const curve = buildCurve(
              stateNodes[stateIndex],
              senderBNodes[messageBIndex],
            );
            const strength = visualStrength(probability, config.numMessagesB);
            const active =
              activeEvent !== null &&
              activeEvent.stateIndex === stateIndex &&
              activeEvent.messageBIndex === messageBIndex &&
              ["senders", "pair", "action", "result"].includes(animation.phase);

            return (
              <g key={`state-b-${stateIndex}-${messageBIndex}`}>
                <path
                  d={curve.path}
                  fill="none"
                  stroke={active ? "#d97706" : senderBEdgeStroke(stateIndex)}
                  strokeOpacity={
                    active ? 1 : 0.16 + probability * 0.18 + strength * 0.42
                  }
                  strokeWidth={
                    active ? 5 : 1.1 + probability * 1.2 + strength * 3.1
                  }
                  strokeLinecap="round"
                  onMouseEnter={() =>
                    setHoveredEdge({
                      description: `P_B(B${messageBIndex} | S${stateIndex})`,
                      probability,
                    })
                  }
                  onMouseLeave={() => setHoveredEdge(null)}
                  data-testid={`edge-state-${stateIndex}-b-${messageBIndex}`}
                />
                {showProbabilityLabels ? (
                  <text
                    x={curve.midpoint.x}
                    y={curve.midpoint.y + 12}
                    textAnchor="middle"
                    style={styles.edgeLabel}
                  >
                    {formatProbability(probability)}
                  </text>
                ) : null}
              </g>
            );
          }),
        )}

        {senderANodes.map((senderNode, messageAIndex) =>
          actionNodes.map((actionNode, actionIndex) => {
            const support = aggregateSenderANodeActionSupport(
              policies,
              messageAIndex,
              actionIndex,
            );
            const strength = visualStrength(support, config.numActions);
            const curve = buildSenderFamilyToActionCurve(
              senderNode,
              actionNode,
              (messageAIndex === 0 ? -10 : 10) + (actionIndex - 1.5) * 4,
              "a",
            );
            const active =
              activeEvent !== null &&
              activeEvent.messageAIndex === messageAIndex &&
              activeEvent.actionIndex === actionIndex &&
              ["pair", "action", "result"].includes(animation.phase);

            return (
              <path
                key={`visible-sender-a-${messageAIndex}-action-${actionIndex}`}
                d={curve.path}
                fill="none"
                stroke={active ? "#d97706" : senderAToActionStroke(actionIndex)}
                strokeOpacity={
                  active ? 1 : 0.12 + support * 0.12 + strength * 0.6
                }
                strokeWidth={
                  active ? 4.8 : 0.95 + support * 0.9 + strength * 4.2
                }
                strokeLinecap="round"
                pointerEvents="none"
                data-testid={`edge-sender-a-${messageAIndex}-to-action-${actionIndex}`}
              />
            );
          }),
        )}

        {senderBNodes.map((senderNode, messageBIndex) =>
          actionNodes.map((actionNode, actionIndex) => {
            const support = aggregateSenderBNodeActionSupport(
              policies,
              messageBIndex,
              actionIndex,
            );
            const strength = visualStrength(support, config.numActions);
            const curve = buildSenderFamilyToActionCurve(
              senderNode,
              actionNode,
              (messageBIndex === 0 ? -10 : 10) + (actionIndex - 1.5) * 4,
              "b",
            );
            const active =
              activeEvent !== null &&
              activeEvent.messageBIndex === messageBIndex &&
              activeEvent.actionIndex === actionIndex &&
              ["pair", "action", "result"].includes(animation.phase);

            return (
              <path
                key={`visible-sender-b-${messageBIndex}-action-${actionIndex}`}
                d={curve.path}
                fill="none"
                stroke={active ? "#d97706" : senderBToActionStroke(actionIndex)}
                strokeOpacity={
                  active ? 1 : 0.12 + support * 0.12 + strength * 0.6
                }
                strokeWidth={
                  active ? 4.8 : 0.95 + support * 0.9 + strength * 4.2
                }
                strokeLinecap="round"
                pointerEvents="none"
                data-testid={`edge-sender-b-${messageBIndex}-to-action-${actionIndex}`}
              />
            );
          }),
        )}

        {policies.receiverPairPolicy.map((rowA, messageAIndex) =>
          rowA.map((rowB, messageBIndex) =>
            rowB.map((probability, actionIndex) => {
              const pairOffset =
                pairLaneOffsets[pairIndex(messageAIndex, messageBIndex)];
              const aCurve = buildSenderFamilyToActionCurve(
                senderANodes[messageAIndex],
                actionNodes[actionIndex],
                pairOffset,
                "a",
              );
              const bCurve = buildSenderFamilyToActionCurve(
                senderBNodes[messageBIndex],
                actionNodes[actionIndex],
                pairOffset,
                "b",
              );
              const strength = visualStrength(probability, config.numActions);
              const active =
                activeEvent !== null &&
                activeEvent.messageAIndex === messageAIndex &&
                activeEvent.messageBIndex === messageBIndex &&
                activeEvent.actionIndex === actionIndex &&
                ["pair", "action", "result"].includes(animation.phase);

              return (
                <g
                  key={`pair-action-${messageAIndex}-${messageBIndex}-${actionIndex}`}
                >
                  <path
                    d={aCurve.path}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.001)"
                    strokeOpacity={1}
                    strokeWidth={12}
                    strokeLinecap="round"
                    pointerEvents="stroke"
                    onMouseEnter={() =>
                      setHoveredEdge({
                        description: `P_R(a${actionIndex} | A${messageAIndex}, B${messageBIndex})`,
                        probability,
                      })
                    }
                    onMouseLeave={() => setHoveredEdge(null)}
                    data-testid={`edge-pair-a-${messageAIndex}-b-${messageBIndex}-to-action-${actionIndex}`}
                  />
                  <path
                    d={bCurve.path}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.001)"
                    strokeOpacity={1}
                    strokeWidth={12}
                    strokeLinecap="round"
                    pointerEvents="stroke"
                    onMouseEnter={() =>
                      setHoveredEdge({
                        description: `P_R(a${actionIndex} | A${messageAIndex}, B${messageBIndex})`,
                        probability,
                      })
                    }
                    onMouseLeave={() => setHoveredEdge(null)}
                    data-testid={`edge-pair-b-${messageBIndex}-a-${messageAIndex}-to-action-${actionIndex}`}
                  />
                  {showProbabilityLabels ? (
                    <>
                      <text
                        x={aCurve.midpoint.x}
                        y={aCurve.midpoint.y - 8}
                        textAnchor="middle"
                        style={styles.edgeLabel}
                      >
                        {formatProbability(probability)}
                      </text>
                      <text
                        x={bCurve.midpoint.x}
                        y={bCurve.midpoint.y + 10}
                        textAnchor="middle"
                        style={styles.edgeLabel}
                      >
                        {formatProbability(probability)}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            }),
          ),
        )}

        {stateNodes.map((node, stateIndex) => (
          <g key={`state-${stateIndex}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={statePalettes[stateIndex].fill}
              stroke={statePalettes[stateIndex].stroke}
              strokeWidth={2}
            />
            <CenteredSvgText x={node.x} y={node.y} style={styles.nodeCode}>
              {`S${stateIndex}`}
            </CenteredSvgText>
            <text
              x={node.x - 34}
              y={node.y}
              textAnchor="end"
              dominantBaseline="middle"
              alignmentBaseline="middle"
              style={styles.nodeLabel}
            >
              {stateLabels[stateIndex]}
            </text>
          </g>
        ))}

        {senderANodes.map((node, messageAIndex) => (
          <g key={`sender-a-${messageAIndex}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill="#ffffff"
              stroke="#6b7280"
              strokeWidth={2}
            />
            <CenteredSvgText x={node.x} y={node.y} style={styles.nodeCode}>
              {`A${messageAIndex}`}
            </CenteredSvgText>
          </g>
        ))}

        {senderBNodes.map((node, messageBIndex) => (
          <g key={`sender-b-${messageBIndex}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill="#ffffff"
              stroke="#6b7280"
              strokeWidth={2}
            />
            <CenteredSvgText x={node.x} y={node.y} style={styles.nodeCode}>
              {`B${messageBIndex}`}
            </CenteredSvgText>
          </g>
        ))}

        {actionNodes.map((node, actionIndex) => (
          <g key={`action-${actionIndex}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={actionPalettes[actionIndex].fill}
              stroke={actionPalettes[actionIndex].stroke}
              strokeWidth={2}
            />
            <CenteredSvgText x={node.x} y={node.y} style={styles.nodeCode}>
              {`a${actionIndex}`}
            </CenteredSvgText>
            <text
              x={node.x + 30}
              y={node.y}
              textAnchor="start"
              dominantBaseline="middle"
              alignmentBaseline="middle"
              style={styles.nodeLabel}
            >
              {actionLabels[actionIndex]}
            </text>
          </g>
        ))}

        {animation.phase === "state" && activeEvent !== null ? (
          <circle
            cx={stateNodes[activeEvent.stateIndex].x}
            cy={stateNodes[activeEvent.stateIndex].y}
            r={30 + animation.progress * 6}
            fill="none"
            stroke="#d97706"
            strokeWidth={3.5}
            strokeOpacity={0.88 - animation.progress * 0.3}
          />
        ) : null}

        {animation.phase === "senders" && activeEvent !== null ? (
          <g>
            <AnimatedToken
              curve={buildCurve(
                stateNodes[activeEvent.stateIndex],
                senderANodes[activeEvent.messageAIndex],
              )}
              progress={animation.progress}
            />
            <AnimatedToken
              curve={buildCurve(
                stateNodes[activeEvent.stateIndex],
                senderBNodes[activeEvent.messageBIndex],
              )}
              progress={animation.progress}
            />
          </g>
        ) : null}

        {animation.phase === "pair" && activeEvent !== null ? (
          <g>
            <AnimatedToken
              curve={buildSenderFamilyToActionCurve(
                senderANodes[activeEvent.messageAIndex],
                actionNodes[activeEvent.actionIndex],
                pairLaneOffsets[
                  pairIndex(
                    activeEvent.messageAIndex,
                    activeEvent.messageBIndex,
                  )
                ],
                "a",
              )}
              progress={animation.progress}
            />
            <AnimatedToken
              curve={buildSenderFamilyToActionCurve(
                senderBNodes[activeEvent.messageBIndex],
                actionNodes[activeEvent.actionIndex],
                pairLaneOffsets[
                  pairIndex(
                    activeEvent.messageAIndex,
                    activeEvent.messageBIndex,
                  )
                ],
                "b",
              )}
              progress={animation.progress}
            />
          </g>
        ) : null}

        {animation.phase === "action" && activeEvent !== null ? (
          <circle
            cx={actionNodes[activeEvent.actionIndex].x}
            cy={actionNodes[activeEvent.actionIndex].y}
            r={30 + animation.progress * 6}
            fill="none"
            stroke="#d97706"
            strokeWidth={3.25}
            strokeOpacity={0.9 - animation.progress * 0.25}
          />
        ) : null}

        {animation.phase === "result" && activeEvent !== null ? (
          <g>
            <circle
              cx={actionNodes[activeEvent.actionIndex].x}
              cy={actionNodes[activeEvent.actionIndex].y}
              r={31}
              fill="none"
              stroke={activeEvent.success ? "#15803d" : "#b91c1c"}
              strokeWidth={4.5}
            />
            <text
              x={width / 2}
              y={height - 14}
              textAnchor="middle"
              style={{
                ...styles.resultText,
                fill: activeEvent.success ? "#166534" : "#b91c1c",
              }}
            >
              {activeEvent.success
                ? `Success: pair (A${activeEvent.messageAIndex}, B${activeEvent.messageBIndex}) led to the correct action.`
                : `Failure: pair (A${activeEvent.messageAIndex}, B${activeEvent.messageBIndex}) led to the wrong action.`}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function AnimatedToken({
  curve,
  progress,
}: {
  curve: CurveGeometry;
  progress: number;
}): React.ReactElement {
  const point = cubicBezierPoint(
    curve.start,
    curve.control1,
    curve.control2,
    curve.end,
    progress,
  );
  return (
    <g>
      <circle cx={point.x} cy={point.y} r={11} fill="rgba(217, 119, 6, 0.18)" />
      <circle
        cx={point.x}
        cy={point.y}
        r={5.5}
        fill="#d97706"
        stroke="#ffffff"
        strokeWidth={1.75}
      />
    </g>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid #d6dce5",
    background: "#ffffff",
  },
  tooltip: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    maxWidth: 280,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.98)",
    color: "#111111",
    border: "1px solid #d6dce5",
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 11,
    lineHeight: 1.35,
  },
  headerText: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fill: "#111111",
  },
  sectionText: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fill: "#5b6470",
  },
  nodeCode: {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 11,
    fontWeight: 700,
    fill: "#111111",
  },
  nodeLabel: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 600,
    fill: "#111111",
  },
  edgeLabel: {
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: 9,
    fill: "#111111",
  },
  resultText: {
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif',
    fontSize: 12,
    fontWeight: 700,
  },
};

/**
 * Canvas renderer for the Swarm Dynamics visualizer.
 *
 * Uses HTML5 Canvas for efficient rendering of thousands of particles.
 * Supports trails, color schemes, user interaction, and manual zoom.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { DotsState, RenderOptions, Interaction, Particle } from '../model/types';

/**
 * Camera state for fit-to-view rendering.
 * All values are in screen (pixel) coordinates.
 */
interface Camera {
  /** Center X in screen coords */
  centerX: number;
  /** Center Y in screen coords */
  centerY: number;
  /** Scale factor: world pixels -> screen pixels */
  scale: number;
}

/**
 * Transform screen coordinates to world coordinates.
 */
function screenToWorld(
  sx: number,
  sy: number,
  camera: Camera,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;
  return {
    x: camera.centerX + (sx - screenCenterX) / camera.scale,
    y: camera.centerY + (sy - screenCenterY) / camera.scale,
  };
}

// Vibrant colors for Particle Life types (distinct and visually pleasing)
const TYPE_COLORS = [
  '#e63946', // red
  '#2a9d8f', // teal
  '#e9c46a', // yellow
  '#264653', // dark blue
  '#f4a261', // orange
  '#9b5de5', // purple
  '#00bbf9', // cyan
  '#00f5d4', // mint
];

interface DotsCanvasProps {
  state: DotsState;
  options: RenderOptions;
  width: number;
  height: number;
  zoom: number;  // Manual zoom level, 1 = default
  onInteraction: (interaction: Interaction) => void;
}

export const DotsCanvas: React.FC<DotsCanvasProps> = ({
  state,
  options,
  width,
  height,
  zoom,
  onInteraction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const interactionRef = useRef<Interaction>({
    type: 'none',
    x: 0,
    y: 0,
    strength: 0.5,
    active: false,
  });

  // Camera state for manual zoom (controlled by zoom prop)
  const cameraRef = useRef<Camera>({
    centerX: width / 2,
    centerY: height / 2,
    scale: 1,
  });

  // Resize the backing buffer only when dimensions change. Setting
  // canvas.width reallocates the buffer and resets all context state, so
  // doing it every frame is one of the most expensive per-frame costs.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, [width, height, dpr]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // High DPI transform (idempotent, unlike ctx.scale)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear with background
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Manual zoom camera - center on canvas, scale by zoom prop
    const camera: Camera = {
      centerX: width / 2,
      centerY: height / 2,
      scale: zoom,
    };
    cameraRef.current = camera;

    // World-to-screen transform, inlined in the loops below to avoid
    // allocating a point object per particle per frame:
    //   sx = offsetX + wx * scale;  sy = offsetY + wy * scale
    const scale = camera.scale;
    const offsetX = width / 2 - camera.centerX * scale;
    const offsetY = height / 2 - camera.centerY * scale;

    // Draw trails (if enabled)
    if (options.showTrails && state.trails) {
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      // Threshold for detecting wrap-around (in world coordinates)
      const wrapThresholdX = width * 0.4;
      const wrapThresholdY = height * 0.4;

      for (let i = 0; i < state.particles.length; i++) {
        const trail = state.trails[i];
        if (!trail || trail.length < 2) continue;

        const particle = state.particles[i];
        const baseColor = getColor(particle, options);

        ctx.strokeStyle = colorWithAlpha(baseColor, options.trailOpacity);
        ctx.beginPath();
        ctx.moveTo(offsetX + trail[0].x * scale, offsetY + trail[0].y * scale);

        for (let j = 1; j < trail.length; j++) {
          const prev = trail[j - 1];
          const curr = trail[j];

          // Detect wrap-around: if distance is too large, it wrapped
          const dx = Math.abs(curr.x - prev.x);
          const dy = Math.abs(curr.y - prev.y);

          const sx = offsetX + curr.x * scale;
          const sy = offsetY + curr.y * scale;

          if (dx > wrapThresholdX || dy > wrapThresholdY) {
            // Wrapped around - end current path and start new one
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        }

        ctx.stroke();
      }
    }

    // Draw particles, batched by fill color: one path + one fill per color
    // instead of per particle. getColor quantizes dynamic hues so the number
    // of distinct colors stays small.
    // Dot size is independent of zoom - controlled by separate Dot Size slider
    const scaledRadius = options.particleRadius;
    const colorGroups = new Map<string, Particle[]>();
    for (const p of state.particles) {
      const color = getColor(p, options);
      const group = colorGroups.get(color);
      if (group) group.push(p);
      else colorGroups.set(color, [p]);
    }

    if (options.showArrows) {
      // Draw arrows (triangles pointing in velocity direction)
      const arrowLength = scaledRadius * 2.5;
      const arrowWidth = scaledRadius * 1.5;

      for (const [color, particles] of colorGroups) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (const p of particles) {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const sx = offsetX + p.x * scale;
          const sy = offsetY + p.y * scale;

          if (speed > 0.01) {
            // Normalize velocity for direction
            const dx = p.vx / speed;
            const dy = p.vy / speed;

            // Arrow tip (in screen coords)
            const tipX = sx + dx * arrowLength;
            const tipY = sy + dy * arrowLength;

            // Arrow base corners (perpendicular to direction)
            const perpX = -dy;
            const perpY = dx;
            const baseX = sx - dx * arrowLength * 0.5;
            const baseY = sy - dy * arrowLength * 0.5;

            ctx.moveTo(tipX, tipY);
            ctx.lineTo(baseX + perpX * arrowWidth, baseY + perpY * arrowWidth);
            ctx.lineTo(baseX - perpX * arrowWidth, baseY - perpY * arrowWidth);
            ctx.closePath();
          } else {
            // Stationary: draw circle
            ctx.moveTo(sx + scaledRadius, sy);
            ctx.arc(sx, sy, scaledRadius, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
    } else {
      for (const [color, particles] of colorGroups) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (const p of particles) {
          const sx = offsetX + p.x * scale;
          const sy = offsetY + p.y * scale;
          ctx.moveTo(sx + scaledRadius, sy);
          ctx.arc(sx, sy, scaledRadius, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    // Draw interaction indicator - transform world coords back to screen
    if (interactionRef.current.active) {
      const { x, y, type } = interactionRef.current;
      // x,y are in world coords, transform to screen for drawing
      ctx.strokeStyle = type === 'attract' ? '#00aa00' : '#aa0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(offsetX + x * scale, offsetY + y * scale, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [state, options, width, height, dpr, zoom]);

  // Interaction handlers - transform screen to world coords for physics
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Transform to world coordinates for physics
      const world = screenToWorld(screenX, screenY, cameraRef.current, width, height);

      interactionRef.current = {
        type: e.button === 0 ? 'attract' : 'repel',
        x: world.x,
        y: world.y,
        strength: 0.5,
        active: true,
      };
      onInteraction(interactionRef.current);
    },
    [onInteraction, width, height]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!interactionRef.current.active) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Transform to world coordinates for physics
      const world = screenToWorld(screenX, screenY, cameraRef.current, width, height);

      interactionRef.current = {
        ...interactionRef.current,
        x: world.x,
        y: world.y,
      };
      onInteraction(interactionRef.current);
    },
    [onInteraction, width, height]
  );

  const handleMouseUp = useCallback(() => {
    interactionRef.current = {
      ...interactionRef.current,
      active: false,
    };
    onInteraction(interactionRef.current);
  }, [onInteraction]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: 'crosshair',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

// Lazily-built lookup tables of quantized hue strings, so the hot render path
// does not build a new color string per particle per frame.
const SPEED_HUE_CACHE: string[] = [];
const PHASE_HUE_CACHE: string[] = [];

/**
 * Get color for a particle based on render options.
 */
function getColor(particle: Particle, options: RenderOptions): string {
  switch (options.colorScheme) {
    case 'type':
      // Vibrant distinct colors for particle types
      return TYPE_COLORS[particle.type % TYPE_COLORS.length];

    case 'speed': {
      const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
      // Map speed to hue (slow=blue, fast=red). Hue is rounded to a whole
      // degree (imperceptible) so particles share color strings and the
      // renderer can batch fills by color.
      const normalized = Math.min(1, speed / 5);
      const hue = Math.round(240 - normalized * 240); // 240 (blue) to 0 (red)
      return SPEED_HUE_CACHE[hue] ?? (SPEED_HUE_CACHE[hue] = `hsl(${hue}, 70%, 50%)`);
    }

    case 'phase': {
      if (particle.phase !== undefined) {
        // Map phase [-π, π] to hue [0, 360] for rainbow colors, rounded to a
        // whole degree so fills can be batched by color.
        const hue = Math.round(((particle.phase + Math.PI) / (Math.PI * 2)) * 360) % 360;
        return PHASE_HUE_CACHE[hue] ?? (PHASE_HUE_CACHE[hue] = `hsl(${hue}, 80%, 55%)`);
      }
      return '#666';
    }

    case 'monochrome':
    default:
      return options.particleColor;
  }
}

/**
 * Convert color to rgba with alpha.
 */
function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  }
  return color;
}

export default DotsCanvas;

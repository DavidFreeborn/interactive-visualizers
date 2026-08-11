import { SeededPrng } from '../model/prng';
import type { Point } from './types';

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function smoothstep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function distance(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function weightedChoice<T>(
  prng: SeededPrng,
  choices: readonly { value: T; weight: number }[],
): T {
  const total = choices.reduce((sum, choice) => sum + Math.max(0, choice.weight), 0);
  if (!(total > 0)) {
    throw new Error('weightedChoice requires at least one positive weight.');
  }

  let draw = prng.nextFloat() * total;
  for (const choice of choices) {
    draw -= Math.max(0, choice.weight);
    if (draw <= 0) {
      return choice.value;
    }
  }
  return choices[choices.length - 1].value;
}

export function randomNormal(prng: SeededPrng, mean = 0, standardDeviation = 1): number {
  const first = Math.max(Number.EPSILON, prng.nextFloat());
  const second = prng.nextFloat();
  return mean + standardDeviation * Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function hash2d(seed: number, x: number, y: number): number {
  let value = Math.imul(x + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(y + seed, 0xc2b2ae35);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  return (value >>> 0) / 4294967295;
}

/** Coherent residual field. Structural relief is generated separately. */
export function valueNoise(seed: number, x: number, y: number, frequency: number): number {
  const scaledX = x * frequency;
  const scaledY = y * frequency;
  const x0 = Math.floor(scaledX);
  const y0 = Math.floor(scaledY);
  const tx = smoothstep(scaledX - x0);
  const ty = smoothstep(scaledY - y0);
  const north = lerp(hash2d(seed, x0, y0), hash2d(seed, x0 + 1, y0), tx);
  const south = lerp(hash2d(seed, x0, y0 + 1), hash2d(seed, x0 + 1, y0 + 1), tx);
  return lerp(north, south, ty) * 2 - 1;
}

export function distanceToSegment(point: Point, start: Point, end: Point): { distance: number; t: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return { distance: distance(point, start), t: 0 };
  }
  const projection = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  const nearest = { x: start.x + projection * dx, y: start.y + projection * dy };
  return { distance: distance(point, nearest), t: projection };
}

export function distanceToPolyline(point: Point, path: readonly Point[]): { distance: number; progress: number } {
  if (path.length < 2) {
    return { distance: Number.POSITIVE_INFINITY, progress: 0 };
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestProgress = 0;
  for (let index = 1; index < path.length; index += 1) {
    const result = distanceToSegment(point, path[index - 1], path[index]);
    if (result.distance < bestDistance) {
      bestDistance = result.distance;
      bestProgress = (index - 1 + result.t) / (path.length - 1);
    }
  }
  return { distance: bestDistance, progress: bestProgress };
}

export function polylineLength(path: readonly Point[], sizeKm: number): number {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    total += distance(path[index - 1], path[index]) * sizeKm;
  }
  return total;
}

export function normalizeComposition(values: Record<string, number>): Record<string, number> {
  const entries = Object.entries(values);
  const total = entries.reduce((sum, [, value]) => sum + Math.max(0, value), 0);
  if (!(total > 0)) {
    throw new Error('A composition must contain positive mass.');
  }
  const normalized: Record<string, number> = {};
  for (const [key, value] of entries) {
    normalized[key] = Math.max(0, value) / total;
  }
  return normalized;
}

export function roundComposition(values: Record<string, number>, digits = 4): Record<string, number> {
  const normalized = normalizeComposition(values);
  const factor = 10 ** digits;
  const entries = Object.entries(normalized);
  const rounded: Record<string, number> = {};
  let running = 0;
  entries.forEach(([key, value], index) => {
    const next = index === entries.length - 1 ? 1 - running : Math.round(value * factor) / factor;
    rounded[key] = next;
    running += next;
  });
  return rounded;
}

export function mode<T extends string>(values: readonly T[], fallback: T): T {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let selected = fallback;
  let selectedCount = -1;
  for (const [value, count] of counts) {
    if (count > selectedCount) {
      selected = value;
      selectedCount = count;
    }
  }
  return selected;
}

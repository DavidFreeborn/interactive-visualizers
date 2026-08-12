import type { Particle, TopologyType } from './types';

interface Point { x: number; y: number }

/**
 * Spatial hash with topology-aware neighbour geometry.
 *
 * The previous implementation reduced every wrapped topology to one boolean,
 * which incorrectly made cylinders wrap both axes and could not represent a
 * Möbius reflection. This version keeps the quotient geometry explicit.
 */
export class SpatialHash {
  private readonly invCellSize: number;
  private readonly topology: TopologyType;
  private readonly grid = new Map<number, Particle[]>();
  private readonly cellPool: Particle[][] = [];
  private readonly maxCellX: number;
  private readonly maxCellY: number;

  constructor(
    private readonly width: number,
    private readonly height: number,
    cellSize: number,
    topology: TopologyType | boolean
  ) {
    // Boolean form is retained for backwards-compatible tests/API callers:
    // true means torus, false means bounded. New code should pass TopologyType.
    this.topology = typeof topology === 'boolean' ? (topology ? 'torus' : 'bounded') : topology;
    this.invCellSize = 1 / cellSize;
    this.maxCellX = Math.max(1, Math.ceil(width / cellSize));
    this.maxCellY = Math.max(1, Math.ceil(height / cellSize));
  }

  private key(cx: number, cy: number): number {
    return cy * this.maxCellX + cx;
  }

  clear(): void {
    for (const cell of this.grid.values()) {
      cell.length = 0;
      this.cellPool.push(cell);
    }
    this.grid.clear();
  }

  private getCell(): Particle[] {
    return this.cellPool.pop() || [];
  }

  insert(particle: Particle): void {
    const cx = Math.floor(particle.x * this.invCellSize);
    const cy = Math.floor(particle.y * this.invCellSize);
    const k = this.key(cx, cy);
    let cell = this.grid.get(k);
    if (!cell) {
      cell = this.getCell();
      this.grid.set(k, cell);
    }
    cell.push(particle);
  }

  rebuild(particles: Particle[]): void {
    this.clear();
    for (const p of particles) this.insert(p);
  }

  /** Equivalent images of a point sufficient to find the shortest quotient distance. */
  private images(p: Point): Point[] {
    switch (this.topology) {
      case 'torus': {
        const out: Point[] = [];
        for (const sx of [-this.width, 0, this.width]) {
          for (const sy of [-this.height, 0, this.height]) {
            out.push({ x: p.x + sx, y: p.y + sy });
          }
        }
        return out;
      }
      case 'cylinder-x':
        return [
          p,
          { x: p.x - this.width, y: p.y },
          { x: p.x + this.width, y: p.y },
        ];
      case 'cylinder-y':
        return [
          p,
          { x: p.x, y: p.y - this.height },
          { x: p.x, y: p.y + this.height },
        ];
      case 'mobius-x':
        return [
          p,
          { x: p.x - this.width, y: this.height - p.y },
          { x: p.x + this.width, y: this.height - p.y },
        ];
      case 'mobius-y':
        return [
          p,
          { x: this.width - p.x, y: p.y - this.height },
          { x: this.width - p.x, y: p.y + this.height },
        ];
      default:
        return [p];
    }
  }

  queryRadius(x: number, y: number, radius: number): Particle[] {
    const results: Particle[] = [];
    const seen = new Set<number>();
    const cellRadius = Math.ceil(radius * this.invCellSize);
    const r2 = radius * radius;

    // Search cells around every equivalent image of the query point, then use
    // wrappedDistance as the final authority. This makes cylinder and Möbius
    // seams correct without embedding topology-specific logic in behaviours.
    for (const image of this.images({ x, y })) {
      const cx = Math.floor(image.x * this.invCellSize);
      const cy = Math.floor(image.y * this.invCellSize);

      for (let ox = -cellRadius; ox <= cellRadius; ox++) {
        for (let oy = -cellRadius; oy <= cellRadius; oy++) {
          const ncx = cx + ox;
          const ncy = cy + oy;
          if (ncx < 0 || ncx >= this.maxCellX || ncy < 0 || ncy >= this.maxCellY) continue;
          const cell = this.grid.get(this.key(ncx, ncy));
          if (!cell) continue;

          for (const p of cell) {
            if (seen.has(p.id)) continue;
            const d = this.wrappedDistance(x, y, p.x, p.y);
            if (d.dx * d.dx + d.dy * d.dy <= r2) {
              seen.add(p.id);
              results.push(p);
            }
          }
        }
      }
    }

    return results;
  }

  wrappedDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { dx: number; dy: number; dist: number } {
    let bestDx = x2 - x1;
    let bestDy = y2 - y1;
    let best2 = bestDx * bestDx + bestDy * bestDy;

    for (const image of this.images({ x: x2, y: y2 })) {
      const dx = image.x - x1;
      const dy = image.y - y1;
      const d2 = dx * dx + dy * dy;
      if (d2 < best2) {
        best2 = d2;
        bestDx = dx;
        bestDy = dy;
      }
    }

    return { dx: bestDx, dy: bestDy, dist: Math.sqrt(best2) };
  }
}

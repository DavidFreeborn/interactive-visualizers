import type { Particle, TopologyType } from './types';

/**
 * Affine image transform for quotient topologies: maps a point (x, y) to an
 * equivalent representative (fx * x + tx, fy * y + ty). Torus and cylinder
 * images are pure translations; Möbius images also reflect one axis.
 */
interface ImageTransform {
  fx: number;
  tx: number;
  fy: number;
  ty: number;
}

/**
 * Spatial hash with topology-aware neighbour geometry.
 *
 * The previous implementation reduced every wrapped topology to one boolean,
 * which incorrectly made cylinders wrap both axes and could not represent a
 * Möbius reflection. This version keeps the quotient geometry explicit.
 *
 * PERFORMANCE CONTRACT: queryRadius returns an internal array that is reused
 * (and overwritten) by the next queryRadius call, together with the parallel
 * neighborDx/neighborDy/neighborDist arrays holding the shortest quotient
 * offset from the query point to each returned particle. Callers must consume
 * results before issuing another query and must not retain the arrays.
 */
export class SpatialHash {
  private readonly invCellSize: number;
  private readonly topology: TopologyType;
  private readonly grid = new Map<number, Particle[]>();
  private readonly cellPool: Particle[][] = [];
  private readonly maxCellX: number;
  private readonly maxCellY: number;
  private readonly transforms: ImageTransform[];

  private readonly queryResults: Particle[] = [];
  private readonly visitedCells = new Set<number>();

  // Fast minimal-image path: torus and cylinders are pure per-axis wraps, so
  // the shortest offset needs two comparisons per axis instead of a loop over
  // image transforms. Möbius reflections still use the transform loop.
  private readonly wrapX: boolean;
  private readonly wrapY: boolean;
  private readonly useFastWrap: boolean;

  /** Parallel outputs of the most recent queryRadius call (dx, dy from query point). */
  readonly neighborDx: number[] = [];
  readonly neighborDy: number[] = [];
  readonly neighborDist: number[] = [];

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
    this.transforms = this.buildTransforms();
    this.wrapX = this.topology === 'torus' || this.topology === 'cylinder-x';
    this.wrapY = this.topology === 'torus' || this.topology === 'cylinder-y';
    this.useFastWrap = this.topology !== 'mobius-x' && this.topology !== 'mobius-y';
  }

  /** Equivalent-image transforms sufficient to find the shortest quotient distance. */
  private buildTransforms(): ImageTransform[] {
    const w = this.width;
    const h = this.height;
    switch (this.topology) {
      case 'torus': {
        // The identity transform must come first: distance loops start from
        // the untransformed offset and iterate the remaining images from index 1.
        const out: ImageTransform[] = [{ fx: 1, tx: 0, fy: 1, ty: 0 }];
        for (const sx of [-w, 0, w]) {
          for (const sy of [-h, 0, h]) {
            if (sx === 0 && sy === 0) continue;
            out.push({ fx: 1, tx: sx, fy: 1, ty: sy });
          }
        }
        return out;
      }
      case 'cylinder-x':
        return [
          { fx: 1, tx: 0, fy: 1, ty: 0 },
          { fx: 1, tx: -w, fy: 1, ty: 0 },
          { fx: 1, tx: w, fy: 1, ty: 0 },
        ];
      case 'cylinder-y':
        return [
          { fx: 1, tx: 0, fy: 1, ty: 0 },
          { fx: 1, tx: 0, fy: 1, ty: -h },
          { fx: 1, tx: 0, fy: 1, ty: h },
        ];
      case 'mobius-x':
        return [
          { fx: 1, tx: 0, fy: 1, ty: 0 },
          { fx: 1, tx: -w, fy: -1, ty: h },
          { fx: 1, tx: w, fy: -1, ty: h },
        ];
      case 'mobius-y':
        return [
          { fx: 1, tx: 0, fy: 1, ty: 0 },
          { fx: -1, tx: w, fy: 1, ty: -h },
          { fx: -1, tx: w, fy: 1, ty: h },
        ];
      default:
        return [{ fx: 1, tx: 0, fy: 1, ty: 0 }];
    }
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

  /**
   * Find all particles within radius of (x, y) under the quotient metric.
   * See the performance contract in the class docblock: the returned array and
   * the neighborDx/neighborDy/neighborDist companions are reused per call.
   */
  queryRadius(x: number, y: number, radius: number): Particle[] {
    const results = this.queryResults;
    results.length = 0;
    this.neighborDx.length = 0;
    this.neighborDy.length = 0;
    this.neighborDist.length = 0;

    const cellRadius = Math.ceil(radius * this.invCellSize);
    const r2 = radius * radius;
    const transforms = this.transforms;
    const multiImage = transforms.length > 1;
    const visited = this.visitedCells;
    if (multiImage) visited.clear();

    // Search cells around every equivalent image of the query point, then use
    // the wrapped offset as the final authority. This makes cylinder and Möbius
    // seams correct without embedding topology-specific logic in behaviours.
    // Each particle lives in exactly one cell, so deduplicating visited cells
    // guarantees each particle is tested once.
    for (let t = 0; t < transforms.length; t++) {
      const tr = transforms[t];
      const imgX = tr.fx * x + tr.tx;
      const imgY = tr.fy * y + tr.ty;
      const cx = Math.floor(imgX * this.invCellSize);
      const cy = Math.floor(imgY * this.invCellSize);

      for (let ox = -cellRadius; ox <= cellRadius; ox++) {
        const ncx = cx + ox;
        if (ncx < 0 || ncx >= this.maxCellX) continue;
        for (let oy = -cellRadius; oy <= cellRadius; oy++) {
          const ncy = cy + oy;
          if (ncy < 0 || ncy >= this.maxCellY) continue;
          const k = this.key(ncx, ncy);
          if (multiImage) {
            if (visited.has(k)) continue;
            visited.add(k);
          }
          const cell = this.grid.get(k);
          if (!cell) continue;

          for (let c = 0; c < cell.length; c++) {
            const p = cell[c];
            // Shortest quotient offset from (x, y) to p, inlined to avoid
            // allocating a result object per candidate.
            let bestDx = p.x - x;
            let bestDy = p.y - y;
            let best2: number;
            if (this.useFastWrap) {
              if (this.wrapX) {
                if (bestDx > this.width * 0.5) bestDx -= this.width;
                else if (bestDx < this.width * -0.5) bestDx += this.width;
              }
              if (this.wrapY) {
                if (bestDy > this.height * 0.5) bestDy -= this.height;
                else if (bestDy < this.height * -0.5) bestDy += this.height;
              }
              best2 = bestDx * bestDx + bestDy * bestDy;
            } else {
              best2 = bestDx * bestDx + bestDy * bestDy;
              for (let u = 1; u < transforms.length; u++) {
                const tu = transforms[u];
                const dx = tu.fx * p.x + tu.tx - x;
                const dy = tu.fy * p.y + tu.ty - y;
                const d2 = dx * dx + dy * dy;
                if (d2 < best2) {
                  best2 = d2;
                  bestDx = dx;
                  bestDy = dy;
                }
              }
            }
            if (best2 <= r2) {
              results.push(p);
              this.neighborDx.push(bestDx);
              this.neighborDy.push(bestDy);
              this.neighborDist.push(Math.sqrt(best2));
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

    if (this.useFastWrap) {
      if (this.wrapX) {
        if (bestDx > this.width * 0.5) bestDx -= this.width;
        else if (bestDx < this.width * -0.5) bestDx += this.width;
      }
      if (this.wrapY) {
        if (bestDy > this.height * 0.5) bestDy -= this.height;
        else if (bestDy < this.height * -0.5) bestDy += this.height;
      }
      return { dx: bestDx, dy: bestDy, dist: Math.sqrt(bestDx * bestDx + bestDy * bestDy) };
    }

    let best2 = bestDx * bestDx + bestDy * bestDy;

    const transforms = this.transforms;
    for (let t = 1; t < transforms.length; t++) {
      const tr = transforms[t];
      const dx = tr.fx * x2 + tr.tx - x1;
      const dy = tr.fy * y2 + tr.ty - y1;
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

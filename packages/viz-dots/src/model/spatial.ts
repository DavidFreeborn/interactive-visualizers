/**
 * Spatial hash grid for efficient neighbor queries.
 *
 * Critical for O(n) performance instead of O(n^2) when checking
 * particle interactions. Each particle is hashed into a grid cell,
 * and neighbor queries only check nearby cells.
 *
 * Optimizations:
 * - Numeric keys for faster hashing
 * - Pre-allocated cell arrays
 * - Reused result arrays to reduce GC pressure
 */

import type { Particle } from './types';

/**
 * Spatial hash grid for fast neighbor lookups.
 */
export class SpatialHash {
  private cellSize: number;
  private invCellSize: number; // Precomputed for faster division
  private grid: Map<number, Particle[]>;
  private cellPool: Particle[][]; // Pool of reusable cell arrays
  private width: number;
  private height: number;
  private wrap: boolean;
  private maxCellX: number;
  private maxCellY: number;
  private halfWidth: number;
  private halfHeight: number;

  constructor(width: number, height: number, cellSize: number, wrap: boolean) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.wrap = wrap;
    this.grid = new Map();
    this.cellPool = [];
    this.maxCellX = Math.ceil(width / cellSize);
    this.maxCellY = Math.ceil(height / cellSize);
    this.halfWidth = width / 2;
    this.halfHeight = height / 2;
  }

  // Numeric key is much faster than string key
  private key(cx: number, cy: number): number {
    return cy * this.maxCellX + cx;
  }

  /**
   * Clear all particles from the grid.
   */
  clear(): void {
    // Return cell arrays to pool for reuse
    for (const cell of this.grid.values()) {
      cell.length = 0;
      this.cellPool.push(cell);
    }
    this.grid.clear();
  }

  /**
   * Get or create a cell array.
   */
  private getCell(): Particle[] {
    return this.cellPool.pop() || [];
  }

  /**
   * Insert a single particle into the grid.
   */
  insert(particle: Particle): void {
    const cx = (particle.x * this.invCellSize) | 0;
    const cy = (particle.y * this.invCellSize) | 0;
    const k = this.key(cx, cy);

    let cell = this.grid.get(k);
    if (!cell) {
      cell = this.getCell();
      this.grid.set(k, cell);
    }
    cell.push(particle);
  }

  /**
   * Rebuild the grid from a list of particles.
   */
  rebuild(particles: Particle[]): void {
    this.clear();
    for (let i = 0; i < particles.length; i++) {
      this.insert(particles[i]);
    }
  }

  /**
   * Query all particles within a radius of a point.
   * Handles toroidal wrapping if enabled.
   */
  queryRadius(x: number, y: number, radius: number): Particle[] {
    const results: Particle[] = [];
    const cellRadius = Math.ceil(radius * this.invCellSize);
    const cx = (x * this.invCellSize) | 0;
    const cy = (y * this.invCellSize) | 0;
    const r2 = radius * radius;

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        let ncx = cx + dx;
        let ncy = cy + dy;

        // Handle wrapping
        if (this.wrap) {
          ncx = ((ncx % this.maxCellX) + this.maxCellX) % this.maxCellX;
          ncy = ((ncy % this.maxCellY) + this.maxCellY) % this.maxCellY;
        } else if (ncx < 0 || ncx >= this.maxCellX || ncy < 0 || ncy >= this.maxCellY) {
          continue;
        }

        const cell = this.grid.get(this.key(ncx, ncy));
        if (!cell) continue;

        const cellLen = cell.length;
        for (let i = 0; i < cellLen; i++) {
          const p = cell[i];
          let px = p.x;
          let py = p.y;

          // Adjust for wrapping distance
          if (this.wrap) {
            let ddx = px - x;
            let ddy = py - y;
            if (ddx > this.halfWidth) px -= this.width;
            else if (ddx < -this.halfWidth) px += this.width;
            if (ddy > this.halfHeight) py -= this.height;
            else if (ddy < -this.halfHeight) py += this.height;
          }

          const distX = px - x;
          const distY = py - y;
          const dist2 = distX * distX + distY * distY;
          if (dist2 <= r2) {
            results.push(p);
          }
        }
      }
    }

    return results;
  }

  /**
   * Calculate wrapped distance between two points.
   */
  wrappedDistance(x1: number, y1: number, x2: number, y2: number): { dx: number; dy: number; dist: number } {
    let dx = x2 - x1;
    let dy = y2 - y1;

    if (this.wrap) {
      if (dx > this.halfWidth) dx -= this.width;
      else if (dx < -this.halfWidth) dx += this.width;
      if (dy > this.halfHeight) dy -= this.height;
      else if (dy < -this.halfHeight) dy += this.height;
    }

    return {
      dx,
      dy,
      dist: Math.sqrt(dx * dx + dy * dy),
    };
  }
}

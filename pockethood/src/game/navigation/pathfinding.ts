// Grid A* for residents and pets. Paths are preferred, the road is avoided but
// crossable, and buildings/decorations are solid — characters never walk through them.
import { BUILDINGS } from '../../data/buildings';
import { WORLD_CELLS } from '../../data/progression';
import type { GameState } from '../core/types';
import { cellsOf, isRoad, plotOf } from '../world/grid';

export interface NavGrid {
  size: number;
  /** Movement cost per cell; Infinity = blocked. */
  cost: Float32Array;
}

export function buildNavGrid(state: Pick<GameState, 'buildings' | 'plots'>): NavGrid {
  const size = WORLD_CELLS;
  const cost = new Float32Array(size * size).fill(Infinity);
  for (let z = 0; z < size; z++)
    for (let x = 0; x < size; x++) {
      if (isRoad(x, z)) cost[z * size + x] = 3;
      else if (state.plots.includes(plotOf(x, z))) cost[z * size + x] = 2;
    }
  for (const b of state.buildings) {
    const walkable = BUILDINGS[b.type]?.walkable;
    for (const [cx, cz] of cellsOf(b.type, b.x, b.z, b.rot)) {
      if (cx < 0 || cz < 0 || cx >= size || cz >= size) continue;
      cost[cz * size + cx] = walkable ? 1 : Infinity;
    }
  }
  return { size, cost };
}

export const walkable = (g: NavGrid, x: number, z: number) => x >= 0 && z >= 0 && x < g.size && z < g.size && g.cost[z * g.size + x] < Infinity;

/** A* with 8-way movement (no corner cutting). Returns cell path including start and goal. */
export function findPath(g: NavGrid, sx: number, sz: number, gx: number, gz: number, maxNodes = 4000): [number, number][] | null {
  if (!walkable(g, gx, gz)) return null;
  const n = g.size;
  const start = sz * n + sx;
  const goal = gz * n + gx;
  const gScore = new Float32Array(n * n).fill(Infinity);
  const came = new Int32Array(n * n).fill(-1);
  const closed = new Uint8Array(n * n);
  const open: number[] = [start];
  const f = new Float32Array(n * n).fill(Infinity);
  gScore[start] = 0;
  const h = (i: number) => {
    const dx = Math.abs((i % n) - gx);
    const dz = Math.abs(Math.floor(i / n) - gz);
    return Math.max(dx, dz) + 0.41 * Math.min(dx, dz);
  };
  f[start] = h(start);
  let expanded = 0;
  while (open.length && expanded++ < maxNodes) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open[bi];
    open.splice(bi, 1);
    if (cur === goal) {
      const path: [number, number][] = [];
      for (let c = cur; c !== -1; c = came[c]) path.push([c % n, Math.floor(c / n)]);
      return path.reverse();
    }
    closed[cur] = 1;
    const cx = cur % n;
    const cz = Math.floor(cur / n);
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const x = cx + dx;
        const z = cz + dz;
        if (!walkable(g, x, z) && !(x === sx && z === sz)) continue;
        if (dx && dz && (!walkable(g, cx + dx, cz) || !walkable(g, cx, cz + dz))) continue;
        const ni = z * n + x;
        if (closed[ni]) continue;
        const step = (dx && dz ? 1.414 : 1) * g.cost[ni];
        const tentative = gScore[cur] + step;
        if (tentative < gScore[ni]) {
          came[ni] = cur;
          gScore[ni] = tentative;
          f[ni] = tentative + h(ni);
          if (!open.includes(ni)) open.push(ni);
        }
      }
  }
  return null;
}

/** Nearest walkable cell to (x, z) — used when a target door is blocked. */
export function nearestWalkable(g: NavGrid, x: number, z: number): [number, number] | null {
  for (let r = 0; r < 6; r++)
    for (let dz = -r; dz <= r; dz++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (walkable(g, x + dx, z + dz)) return [x + dx, z + dz];
      }
  return null;
}

// World grid: placement validity, occupancy, collision and door cells.
// Cell (x, z) covers world space [x, x+1) × [z, z+1); see rendering/scene/coords.ts.
import { BUILDINGS } from '../../data/buildings';
import { PLOT_SIZE, WORLD_CELLS } from '../../data/progression';
import type { BuildingInstance, GameState, Rotation } from '../core/types';

export const ROAD_ROWS = [18, 19];
export const isRoad = (x: number, z: number) => ROAD_ROWS.includes(z) && x >= 0 && x < WORLD_CELLS;
export const inBounds = (x: number, z: number) => x >= 0 && z >= 0 && x < WORLD_CELLS && z < WORLD_CELLS;
export const plotOf = (x: number, z: number) => `p${Math.floor(x / PLOT_SIZE)}${Math.floor(z / PLOT_SIZE)}`;
export const key = (x: number, z: number) => `${x},${z}`;

/** Footprint dimensions after rotation (odd quarter turns swap width/depth). */
export function footprint(type: string, rot: Rotation): [number, number] {
  const [w, d] = BUILDINGS[type].footprint;
  return rot % 2 === 1 ? [d, w] : [w, d];
}

export function cellsOf(type: string, x: number, z: number, rot: Rotation): [number, number][] {
  const [w, d] = footprint(type, rot);
  const out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([x + i, z + j]);
  return out;
}

export function occupancy(buildings: BuildingInstance[], ignoreUid?: string): Map<string, string> {
  const occ = new Map<string, string>();
  for (const b of buildings) {
    if (b.uid === ignoreUid) continue;
    for (const [cx, cz] of cellsOf(b.type, b.x, b.z, b.rot)) occ.set(key(cx, cz), b.uid);
  }
  return occ;
}

export type PlacementProblem = 'out_of_bounds' | 'locked_land' | 'road' | 'occupied' | null;

export function placementProblem(
  state: Pick<GameState, 'buildings' | 'plots'>,
  type: string,
  x: number,
  z: number,
  rot: Rotation,
  ignoreUid?: string,
  occ: Map<string, string> = occupancy(state.buildings, ignoreUid),
): PlacementProblem {
  for (const [cx, cz] of cellsOf(type, x, z, rot)) {
    if (!inBounds(cx, cz)) return 'out_of_bounds';
    if (isRoad(cx, cz)) return 'road';
    if (!state.plots.includes(plotOf(cx, cz))) return 'locked_land';
    if (occ.has(key(cx, cz))) return 'occupied';
  }
  return null;
}

export const canPlace = (...args: Parameters<typeof placementProblem>) => placementProblem(...args) === null;

/** The cell directly in front of a building's door (where residents stand). */
export function doorCell(b: Pick<BuildingInstance, 'type' | 'x' | 'z' | 'rot'>): [number, number] {
  const [w, d] = footprint(b.type, b.rot);
  switch (b.rot) {
    case 0:
      return [b.x + Math.floor(w / 2), b.z + d];
    case 1:
      return [b.x + w, b.z + Math.floor(d / 2)];
    case 2:
      return [b.x + Math.floor(w / 2), b.z - 1];
    default:
      return [b.x - 1, b.z + Math.floor(d / 2)];
  }
}

/** Find the nearest valid placement spot to (x, z), used to suggest a location. */
export function findSpot(state: Pick<GameState, 'buildings' | 'plots'>, type: string, x: number, z: number, rot: Rotation = 0) {
  const occ = occupancy(state.buildings);
  for (let r = 0; r < WORLD_CELLS; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (placementProblem(state, type, x + dx, z + dz, rot, undefined, occ) === null) return { x: x + dx, z: z + dz };
      }
  return null;
}

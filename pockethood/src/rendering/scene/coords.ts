import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import type { BuildingInstance, Rotation } from '../../game/core/types';
import { footprint } from '../../game/world/grid';

export const HALF = 12;

/** World position of a cell centre. */
export const cellCenter = (x: number, z: number): [number, number, number] => [x - HALF + 0.5, 0, z - HALF + 0.5];

export function buildingCenter(b: Pick<BuildingInstance, 'type' | 'x' | 'z' | 'rot'> & { fp?: [number, number] }): [number, number, number] {
  const [w, d] = footprint(b.type, b.rot, b.fp);
  return [b.x - HALF + w / 2, 0, b.z - HALF + d / 2];
}

export const rotY = (rot: Rotation) => rot * (Math.PI / 2);

export const worldToCell = (x: number, z: number): [number, number] => [Math.floor(x + HALF), Math.floor(z + HALF)];

export const buildingHeight = (type: string) => {
  const c = BUILDINGS[type]?.category;
  if (c === 'decoration' || c === 'path') return 0.9;
  if (type === 'town_hall') return 3.2;
  if (type === 'townhouse') return 2.5;
  return 2.0;
};

/** Live weather for rendering and audio (0..1 rain), updated by the Rain effect. */
export const weatherState: { rain: number; force: number | null } = { rain: 0, force: null };

/** Shared, mutable world clock for rendering (updated each frame). */
export const worldClock = { hour: 9, night: 0, t: 0 };

/** Camera + viewport handle used by the UI to project world points to screen. */
export const projector: { camera: THREE.Camera | null; width: number; height: number } = { camera: null, width: 1, height: 1 };

export function project(p: [number, number, number]): [number, number] | null {
  if (!projector.camera) return null;
  const v = new THREE.Vector3(...p).project(projector.camera);
  return [((v.x + 1) / 2) * projector.width, ((1 - v.y) / 2) * projector.height];
}

/** True while the player drags the placement ghost (suspends camera panning). */
export const placementDrag = { active: false };

/** Stable DOM container for in-world HTML overlays (status bubbles, markers). */
export const htmlPortal: { current: HTMLElement } = { current: null as unknown as HTMLElement };

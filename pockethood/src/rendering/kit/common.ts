// Shared building blocks for the architecture kits (core and country kits).
import * as THREE from 'three';
import { model, tint } from '../models/assets';
import { glass, mat, P, TEX } from './materials';
import { box, put, rboxGeo } from './parts';

export interface ArchCtx {
  level: number;
  flags: Record<string, boolean>;
  hoodName: string;
  /** Community project stage (fountain / wakaf). */
  stage?: number;
  /** Module dressing for template buildings: palette + sign + props. */
  module?: { id: string; prefab: string; palette: { primary: string; secondary: string; accent: string }; sign: string; props: string[] };
  biome?: 'temperate' | 'tropical';
  /** Localised short texts painted in the world (signs). */
  text?: Record<string, string>;
  /** The building's display name (for shop signs). */
  name?: string;
}

export const FLOWERS = ['#ff6f91', '#ffd34d', '#ffffff', '#c084fc', '#ff8a5b'];
export const ROCK = { dirt: '#a9a49a', grass: '#7fae5a', _defaultMat: '#8f8a80' };

/** A wall face group: local +Z is the outward normal, origin at the wall's base centre. */
export function face(g: THREE.Object3D, side: 'front' | 'back' | 'left' | 'right', w: number, d: number, z0 = 0) {
  const f = new THREE.Group();
  if (side === 'front') f.position.set(0, 0, z0 + d / 2);
  if (side === 'back') {
    f.position.set(0, 0, z0 - d / 2);
    f.rotation.y = Math.PI;
  }
  if (side === 'right') {
    f.position.set(w / 2, 0, z0);
    f.rotation.y = Math.PI / 2;
  }
  if (side === 'left') {
    f.position.set(-w / 2, 0, z0);
    f.rotation.y = -Math.PI / 2;
  }
  g.add(f);
  return f;
}

/** Place a CC0 model; it is merged into the building's baked meshes by material. */
export function prop(g: THREE.Object3D, name: string, h: number, x: number, y: number, z: number, ry = 0, colors?: Record<string, string>) {
  const m = model(name, h);
  if (colors) tint(m, colors);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  g.add(m);
  return m;
}

export function body(g: THREE.Object3D, w: number, h: number, d: number, z0: number, wall: THREE.Material, base = P.stoneDark) {
  box(g, w + 0.08, 0.09, d + 0.08, mat(base, { map: TEX.cobbles(), repeat: [3, 1] }), 0, 0, z0, 0.025);
  box(g, w, h, d, wall, 0, 0.06, z0, 0.03);
  // Corner trim boards make the volume read crisply.
  const trim = mat(P.trim);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, h, 0.06, trim, (sx * w) / 2, 0.06, z0 + (sz * d) / 2, 0.02);
}

export function shopWindow(f: THREE.Object3D, x: number, w: number, h: number, displays: string[] = []) {
  const trim = mat(P.trim);
  box(f, w + 0.1, h + 0.1, 0.06, trim, x, 0.2, 0, 0.02);
  put(f, rboxGeo(w, h, 0.03, 0.01), glass, [x, 0.25 + h / 2, 0.025]);
  box(f, 0.025, h, 0.02, trim, x, 0.25, 0.05, 0.005);
  box(f, w + 0.18, 0.05, 0.12, trim, x, 0.17, 0.05, 0.015);
  // Display shelf inside the window with real food-kit props
  displays.forEach((name, i) => prop(f, name, 0.1, x - w / 2 + 0.12 + (i * (w - 0.24)) / Math.max(1, displays.length - 1), 0.25, 0.08));
}


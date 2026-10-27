// Shared neighbourhood spots, drawn at every stage of their transformation:
//   0 untouched (overgrown, bare — but with a hopeful "coming soon" sign), 1 cleared,
//   2 planted / built, 3 furnished, 4 finished and lively (bunting, lights, picnic things).
// Plus the keepsake decorations a finished spot unlocks. Origin = footprint centre.
import * as THREE from 'three';
import { FLOWERS, prop, type ArchCtx } from './common';
import { bulb, mat, P, TEX } from './materials';
import { bench, box, bush, cone, cyl, lampPost, put, rboxGeo, signBoard, sphere } from './parts';

const SOIL = '#b08a5e';
/** Seasonal refreshes of a finished spot rotate its colour scheme (bunting, flowers, canopies). */
const SEASONS = [FLOWERS, ['#ffd34d', '#ff8a5b', '#e0413a', '#fffaf0', '#f2a93b'], ['#7fd0e6', '#c084fc', '#ffffff', '#9be38b', '#3f8fd1'], ['#ff6f91', '#ffffff', '#e85d75', '#ffd9e0', '#c084fc']];
let palette = FLOWERS;
const LAWN = '#79c25a';
const WEED = ['#5f8f3a', '#6fa043', '#7aa84a'];

function ground(g: THREE.Group, w: number, d: number, color: string, map?: THREE.Texture, repeat?: [number, number]) {
  box(g, w - 0.08, 0.04, d - 0.08, mat(color, { roughness: 1, map, repeat }), 0, 0, 0, 0.02);
}

/** Tall grass tufts and a few stones: overgrown, not sad. */
function overgrown(g: THREE.Group, w: number, d: number, seed: number) {
  let r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < Math.round(w * d * 3.2); i++) {
    const x = (rnd() - 0.5) * (w - 0.3);
    const z = (rnd() - 0.5) * (d - 0.3);
    cone(g, 0.05 + rnd() * 0.05, 0.16 + rnd() * 0.22, mat(WEED[i % 3], { roughness: 1 }), x, 0.04, z, 5);
  }
  for (let i = 0; i < 3; i++) prop(g, 'rock_small', 0.14, (rnd() - 0.5) * (w - 0.6), 0.03, (rnd() - 0.5) * (d - 0.6), rnd() * 6);
}

function soonSign(g: THREE.Group, text: string, x: number, z: number) {
  for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.36, mat(P.wood), x + sx * 0.24, 0, z, 5);
  signBoard(g, text, x, 0.32, z, { w: 0.62, h: 0.16, bg: '#fffaf0', fg: '#2f6b45' });
}

function bunting(g: THREE.Group, x0: number, x1: number, y: number, z: number) {
  const n = Math.round(Math.abs(x1 - x0) / 0.2);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    box(g, 0.07, 0.08, 0.005, mat(palette[i % 5], { side: THREE.DoubleSide }), x0 + (x1 - x0) * t, y - Math.sin(t * Math.PI) * 0.12, z, 0.002);
  }
  for (const x of [x0, x1]) cyl(g, 0.015, 0.015, y + 0.05, mat(P.wood), x, 0, z, 5);
}

function flowerPatch(g: THREE.Group, x: number, z: number, w: number, d: number, seed: number) {
  box(g, w, 0.06, d, mat(SOIL, { roughness: 1 }), x, 0.03, z, 0.015);
  let k = seed;
  const nx = Math.max(2, Math.round(w / 0.11));
  const nz = Math.max(2, Math.round(d / 0.11));
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      k = (k * 7 + 3) % 97;
      const fx = x - w / 2 + 0.06 + (i / (nx - 1)) * (w - 0.12) + ((k % 5) - 2) * 0.008;
      const fz = z - d / 2 + 0.06 + (j / (nz - 1)) * (d - 0.12);
      sphere(g, 0.045, mat(palette[k % 5]), fx, 0.11 + (k % 3) * 0.015, fz, 6);
    }
}

function tree(g: THREE.Group, ctx: ArchCtx, x: number, z: number, s: number, i: number) {
  if (ctx.biome === 'tropical') prop(g, i % 2 ? 'tree_palm' : 'tree_fat', 1.1 * s, x, 0.03, z, i * 1.7);
  else prop(g, i % 2 ? 'tree_oak' : 'tree_fat', 1.1 * s, x, 0.03, z, i * 1.7);
}

function stringLights(g: THREE.Group, x0: number, z0: number, x1: number, z1: number, y: number) {
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    put(g, rboxGeo(0.04, 0.05, 0.04, 0.015), bulb, [x0 + (x1 - x0) * t, y - Math.sin(t * Math.PI) * 0.1, z0 + (z1 - z0) * t]);
  }
}

// ─── Pocket park (3×3) ───────────────────────────────────────────────────────

function park(ctx: ArchCtx, stage: number) {
  const g = new THREE.Group();
  ground(g, 3, 3, stage === 0 ? '#93a35a' : stage === 1 ? '#a8b86a' : LAWN);
  if (stage === 0) {
    overgrown(g, 3, 3, 11);
    prop(g, 'log', 0.22, 0.7, 0.03, -0.6, 0.6);
    prop(g, 'stump', 0.2, -0.8, 0.03, 0.5);
    soonSign(g, ctx.text?.soon ?? '', 0, 1.25);
    return g;
  }
  // Stepping-stone path from the front
  for (let i = 0; i < 5; i++) cyl(g, 0.12, 0.13, 0.03, mat('#d9cdb8', { map: TEX.cobbles() }), Math.sin(i * 0.9) * 0.15, 0.04, 1.2 - i * 0.45, 9);
  if (stage === 1) {
    for (const [x, z] of [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.6]]) cyl(g, 0.012, 0.015, 0.3, mat(P.wood), x, 0.04, z, 5), sphere(g, 0.09, mat('#7fbf5a'), x, 0.32, z, 7);
    box(g, 0.5, 0.08, 0.3, mat(SOIL), 0.8, 0.04, 0.5, 0.02);
    return g;
  }
  flowerPatch(g, -0.85, 0.75, 0.7, 0.45, 3);
  flowerPatch(g, 0.85, 0.75, 0.7, 0.45, 7);
  tree(g, ctx, -0.9, -0.85, stage >= 3 ? 1.1 : 0.75, 0);
  tree(g, ctx, 0.95, -0.8, stage >= 3 ? 1 : 0.7, 1);
  bush(g, 0, -1.1, 1.2, '#4f9a3f');
  if (stage >= 3) {
    bench(g, -0.45, -0.15, 0.5);
    bench(g, 0.5, -0.1, -0.5);
    lampPost(g, 0.35, 0.95, 0.75);
    cyl(g, 0.16, 0.12, 0.2, mat('#d9cdb8'), -0.2, 0.04, 0.2, 12); // bird bath
    cyl(g, 0.17, 0.17, 0.02, mat('#7fd0e6', { roughness: 0.2 }), -0.2, 0.24, 0.2, 12);
  }
  if (stage >= 4) {
    bunting(g, -1.35, 1.35, 1.05, -1.35);
    box(g, 0.6, 0.012, 0.45, mat('#e85d75'), 0.25, 0.045, -0.55, 0.004); // picnic blanket
    for (let i = 0; i < 4; i++) box(g, 0.08, 0.012, 0.45, mat('#fffaf0'), 0.25 - 0.22 + i * 0.15, 0.05, -0.55, 0.002);
    prop(g, 'apple', 0.08, 0.15, 0.06, -0.5);
    prop(g, 'cake', 0.12, 0.38, 0.06, -0.6);
    stringLights(g, -1.2, 1.2, 1.2, 1.2, 0.95);
  }
  return g;
}

// ─── Community plaza (3×3) ───────────────────────────────────────────────────

function plaza(ctx: ArchCtx, stage: number) {
  const g = new THREE.Group();
  if (stage === 0) {
    ground(g, 3, 3, '#c9bfa8');
    for (let i = 0; i < 9; i++) box(g, 0.5, 0.03, 0.5, mat(i % 2 ? '#bdb29a' : '#cfc5ad'), -1 + (i % 3), 0.04, -1 + Math.floor(i / 3), 0.01);
    overgrown(g, 3, 3, 29);
    prop(g, 'crate', 0.22, 0.9, 0.04, -0.9, 0.3);
    soonSign(g, ctx.text?.soon ?? '', 0, 1.25);
    return g;
  }
  ground(g, 3, 3, '#e6d8bd', TEX.cobbles(), [5, 5]);
  if (stage === 1) {
    prop(g, 'barrels', 0.3, -1.05, 0.04, -1.05);
    for (const x of [-0.6, 0, 0.6]) box(g, 0.4, 0.05, 0.4, mat('#c4553e', { map: TEX.tiles() }), x, 0.04, 1.0, 0.01);
    return g;
  }
  // Central planter with a small tree
  cyl(g, 0.42, 0.46, 0.22, mat('#f3e7d0', { map: TEX.plaster() }), 0, 0.04, 0, 18);
  cyl(g, 0.38, 0.38, 0.03, mat(SOIL), 0, 0.25, 0, 18);
  tree(g, ctx, 0, 0, 0.8, 0);
  for (let i = 0; i < 8; i++) sphere(g, 0.04, mat(FLOWERS[i % 5]), Math.cos(i * 0.8) * 0.32, 0.3, Math.sin(i * 0.8) * 0.32, 6);
  if (stage >= 3) {
    // Market stalls with striped canopies
    for (const [x, z, c] of [[-1.0, -0.95, '#e0413a'], [1.0, -0.95, '#2f8fbf'], [-1.05, 0.9, '#f2a93b']] as [number, number, string][]) {
      box(g, 0.6, 0.28, 0.35, mat(P.wood, { map: TEX.planks() }), x, 0.04, z, 0.02);
      for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.6, mat(P.trim), x + sx * 0.28, 0.04, z + 0.15, 5);
      for (let k = 0; k < 4; k++) box(g, 0.16, 0.02, 0.45, mat(k % 2 ? '#fffaf0' : c), x - 0.24 + k * 0.16, 0.66, z, 0.005, [0.25, 0, 0]);
      prop(g, k2(x) ? 'watermelon' : 'banana', 0.1, x, 0.33, z);
    }
    bench(g, 0.95, 0.85, Math.PI);
    lampPost(g, 1.25, 0.2, 0.85);
    lampPost(g, -1.25, 0.1, 0.85);
  }
  if (stage >= 4) {
    stringLights(g, -1.3, -1.3, 1.3, 1.3, 1.1);
    stringLights(g, -1.3, 1.3, 1.3, -1.3, 1.1);
    bunting(g, -1.3, 1.3, 1.1, 1.3);
  }
  return g;
}
const k2 = (x: number) => x > 0;

// ─── Playground (3×2) ────────────────────────────────────────────────────────

function playground(ctx: ArchCtx, stage: number) {
  const g = new THREE.Group();
  if (stage === 0) {
    ground(g, 3, 2, '#a7a15f');
    overgrown(g, 3, 2, 47);
    for (let i = 0; i < 6; i++) cyl(g, 0.02, 0.02, 0.28, mat(P.wood), -1.3 + i * 0.52, 0.04, 0.85, 5);
    soonSign(g, ctx.text?.soon ?? '', 0.9, 0.8);
    return g;
  }
  ground(g, 3, 2, LAWN);
  // Soft safety surface and a sandpit
  box(g, 1.7, 0.03, 1.5, mat('#e8836b', { roughness: 1 }), -0.55, 0.04, 0, 0.01);
  box(g, 0.8, 0.06, 0.8, mat('#c9a96e', { roughness: 0.6 }), 0.95, 0.04, 0.2, 0.03);
  box(g, 0.86, 0.1, 0.06, mat(P.wood), 0.95, 0.04, -0.23, 0.02);
  if (stage >= 2) {
    // Slide
    box(g, 0.3, 0.55, 0.3, mat('#3f8fd1'), -1.05, 0.07, -0.35, 0.03);
    const slide = box(g, 0.24, 0.04, 0.8, mat('#ffd34d', { roughness: 0.35 }), -1.05, 0.33, 0.15, 0.02);
    slide.rotation.x = 0.55;
    // Swing frame
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.02, 0.02, 0.75, mat('#e0413a'), -0.25 + sx * 0.4, 0.07, sz * 0.18, 6, [sz * 0.25, 0, 0]);
    box(g, 0.9, 0.04, 0.04, mat('#e0413a'), -0.25, 0.78, 0, 0.01);
    for (const sx of [-0.45, -0.05]) {
      box(g, 0.005, 0.5, 0.005, mat('#4a4f5a'), sx, 0.3, 0, 0.001);
      box(g, 0.16, 0.025, 0.08, mat('#3f8fd1'), sx, 0.28, 0, 0.01);
    }
  }
  if (stage >= 3) {
    // Seesaw and a climbing dome
    box(g, 0.7, 0.03, 0.08, mat('#7bc96f'), 0.5, 0.2, -0.65, 0.01, [0, 0, 0.15]);
    cone(g, 0.05, 0.14, mat('#4a4f5a'), 0.5, 0.07, -0.65, 6);
    const dome = put(g, new THREE.SphereGeometry(0.32, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f2a93b', wireframe: true }), [1.0, 0.07, 0.25]);
    dome.castShadow = false;
    bench(g, 1.1, -0.75, Math.PI, 0.5);
  }
  if (stage >= 4) {
    bunting(g, -1.4, 1.4, 1.0, -0.95);
    for (const [x, c] of [[0.2, '#ff6f91'], [0.35, '#ffd34d'], [0.5, '#7fd0e6']] as [number, string][]) {
      sphere(g, 0.07, mat(c), x, 1.1 + x * 0.3, 0.8, 8); // balloons
      box(g, 0.004, 0.5, 0.004, mat('#ffffff'), x, 0.6 + x * 0.3, 0.8, 0.001);
    }
  }
  return g;
}

// ─── Sunset lookout (3×2) ────────────────────────────────────────────────────

function lookout(ctx: ArchCtx, stage: number) {
  const g = new THREE.Group();
  if (stage === 0) {
    ground(g, 3, 2, '#b9a36f');
    overgrown(g, 3, 2, 83);
    prop(g, 'rock_large', 0.4, -0.9, 0.03, -0.3, 0.4);
    soonSign(g, ctx.text?.soon ?? '', 0.6, 0.8);
    return g;
  }
  ground(g, 3, 2, '#d9c3a0', TEX.cobbles(), [5, 3]);
  if (stage >= 2) {
    // Timber deck with a rail
    box(g, 2.4, 0.12, 1.2, mat(P.wood, { map: TEX.planks(), repeat: [6, 2] }), 0, 0.04, -0.2, 0.02);
    for (let i = 0; i < 7; i++) cyl(g, 0.02, 0.02, 0.28, mat(P.wood), -1.15 + i * 0.38, 0.16, -0.78, 5);
    box(g, 2.35, 0.03, 0.04, mat(P.wood), 0, 0.44, -0.78, 0.01);
  }
  if (stage >= 3) {
    bench(g, -0.6, -0.25, 0, 0.6);
    bench(g, 0.6, -0.25, 0, 0.6);
    lampPost(g, -1.25, 0.6, 0.8);
    lampPost(g, 1.25, 0.6, 0.8);
    flowerPatch(g, 0, 0.7, 1.4, 0.3, 13);
  }
  if (stage >= 4) {
    // Lanterns along the rail and a little screen for outdoor movie nights
    for (let i = 0; i < 6; i++) put(g, rboxGeo(0.06, 0.08, 0.06, 0.02), bulb, [-1.0 + i * 0.4, 0.55, -0.78]);
    box(g, 0.9, 0.5, 0.03, mat('#fffaf0'), 0.95, 0.5, 0.75, 0.01);
    for (const sx of [-1, 1]) cyl(g, 0.02, 0.02, 1.0, mat('#4a4f5a'), 0.95 + sx * 0.46, 0.04, 0.75, 5);
  }
  return g;
}

export function spotArchetype(id: string, ctx: ArchCtx): THREE.Group | null {
  const raw = Math.max(0, ctx.stage ?? 0);
  const stage = Math.min(4, raw);
  palette = SEASONS[Math.max(0, raw - 4) % SEASONS.length];
  switch (id) {
    case 'spot:park':
      return park(ctx, stage);
    case 'spot:plaza':
      return plaza(ctx, stage);
    case 'spot:playground':
      return playground(ctx, stage);
    case 'spot:lookout':
      return lookout(ctx, stage);
  }
  return null;
}

/** Keepsakes unlocked by finishing a spot. */
export function communityDecoration(kind: string): THREE.Group | null {
  const g = new THREE.Group();
  switch (kind) {
    case 'picnic_set':
      box(g, 0.7, 0.012, 0.55, mat('#e85d75'), 0, 0, 0, 0.004);
      for (let i = 0; i < 4; i++) box(g, 0.08, 0.012, 0.55, mat('#fffaf0'), -0.24 + i * 0.16, 0.004, 0, 0.002);
      box(g, 0.2, 0.14, 0.14, mat('#c08a57', { map: TEX.planks() }), 0.15, 0.015, 0.05, 0.02);
      prop(g, 'apple', 0.08, -0.15, 0.02, -0.1);
      return g;
    case 'market_stall':
      box(g, 0.7, 0.3, 0.4, mat(P.wood, { map: TEX.planks() }), 0, 0, 0, 0.02);
      for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.65, mat(P.trim), sx * 0.32, 0, 0.17, 5);
      for (let k = 0; k < 4; k++) box(g, 0.18, 0.02, 0.5, mat(k % 2 ? '#fffaf0' : '#2f8fbf'), -0.27 + k * 0.18, 0.64, 0, 0.005, [0.25, 0, 0]);
      prop(g, 'watermelon', 0.12, -0.1, 0.3, 0);
      prop(g, 'banana', 0.1, 0.15, 0.3, 0.05);
      return g;
    case 'kite_post':
      cyl(g, 0.02, 0.025, 1.0, mat(P.wood), 0, 0, 0, 6);
      put(g, new THREE.OctahedronGeometry(0.16, 0), mat('#ff6f91'), [0.25, 1.15, 0], [0, 0, 0.3], [1, 1.4, 0.15]);
      for (let i = 0; i < 4; i++) box(g, 0.05, 0.03, 0.005, mat(FLOWERS[i % 5]), 0.2 - i * 0.03, 0.9 - i * 0.1, 0, 0.002);
      return g;
    case 'telescope':
      cyl(g, 0.02, 0.02, 0.45, mat('#4a4f5a'), -0.08, 0, 0, 5, [0, 0, 0.2]);
      cyl(g, 0.02, 0.02, 0.45, mat('#4a4f5a'), 0.08, 0, 0, 5, [0, 0, -0.2]);
      cyl(g, 0.05, 0.07, 0.4, mat('#2f6fa8', { metalness: 0.4 }), 0, 0.42, 0, 12, [0, 0, 1.1]);
      return g;
  }
  return null;
}

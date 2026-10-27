// POCKETHOOD signature architecture. Each archetype is an original, parametric
// building dressed with CC0 props; higher levels and story flags add visible detail.
import * as THREE from 'three';
import { bulb, mat, P, TEX } from './materials';
import {
  awning,
  bake,
  bench,
  box,
  bush,
  cafeTable,
  chimney,
  cone,
  cyl,
  doorAt,
  flowerBox,
  gableRoof,
  hipRoof,
  lampPost,
  picketFence,
  put,
  rboxGeo,
  shadeHex,
  signBoard,
  sphere,
  windowAt,
} from './parts';

import { FLOWERS, ROCK, body, face, prop, shopWindow, type ArchCtx } from './common';
import { malaysianArchetype, tropicalDecoration } from './malaysia';
import { communityDecoration, spotArchetype } from './community';
export type { ArchCtx } from './common';
export { prop } from './common';

// ─── Residential ──────────────────────────────────────────────────────────────

function starterHouse(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.45;
  const d = 1.25;
  const z0 = -0.1;
  const h = 0.95;
  const wall = mat(P.cream, { map: TEX.siding(), repeat: [2, 3] });
  body(g, w, h, d, z0, wall);
  const top = gableRoof(g, { w, d, y: h + 0.06, rise: 0.55, color: P.terracotta, wall });
  chimney(g, 0.42, h + 0.25, z0 - 0.2, 0.55);
  const f = face(g, 'front', w, d, z0);
  doorAt(f, -0.32, 0, { color: P.sky, glassTop: true });
  windowAt(f, 0.32, 0.42, 0, { shutters: '#7aa874', flowerBox: c.level >= 2 ? FLOWERS : undefined, w: 0.34 });
  const r = face(g, 'right', w, d, z0);
  windowAt(r, 0, 0.42, 0, { shutters: '#7aa874' });
  const l = face(g, 'left', w, d, z0);
  windowAt(l, 0, 0.42, 0, { shutters: '#7aa874' });
  // Mailbox — where rent is "collected"
  cyl(g, 0.02, 0.02, 0.32, mat(P.woodDark), 0.68, 0, 0.82, 6);
  box(g, 0.16, 0.12, 0.22, mat(P.berry), 0.68, 0.32, 0.82, 0.05);
  box(g, 0.02, 0.08, 0.05, mat(P.gold), 0.77, 0.4, 0.86, 0.005);
  bush(g, -0.72, 0.72, 0.8);
  if (c.level >= 2) {
    // Front porch
    box(g, 0.75, 0.07, 0.34, mat(P.wood, { map: TEX.planks(), repeat: [3, 1] }), -0.32, 0, z0 + d / 2 + 0.17, 0.015);
    for (const sx of [-1, 1]) cyl(g, 0.025, 0.025, 0.62, mat(P.trim), -0.32 + sx * 0.33, 0.07, z0 + d / 2 + 0.3, 8);
    box(g, 0.86, 0.05, 0.42, mat(P.terracotta, { map: TEX.shingles(), repeat: [2, 1] }), -0.32, 0.69, z0 + d / 2 + 0.18, 0.015, [0.25, 0, 0]);
    flowerBox(g, 0.32, 0.03, z0 + d / 2 + 0.12, 0.4, FLOWERS);
  }
  if (c.level >= 3) {
    // Dormer on the front roof slope + garden lanterns
    const dz = z0 + 0.32;
    box(g, 0.36, 0.3, 0.3, wall, 0, h + 0.2, dz, 0.02);
    windowAt(g, 0, h + 0.26, dz + 0.16, { w: 0.2, h: 0.18 });
    hipRoof(g, { w: 0.36, d: 0.3, y: h + 0.5, rise: 0.16, color: P.terracotta, overhang: 0.05 });
    lampPost(g, -0.85, 0.85, 0.5);
    lampPost(g, 0.1, 0.9, 0.5);
  }
  void top;
  return g;
}

function cottage(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.3;
  const d = 1.2;
  const z0 = -0.12;
  const h = 0.78;
  const wall = mat(P.peach, { map: TEX.plaster(), repeat: [2, 2] });
  body(g, w, h, d, z0, wall);
  gableRoof(g, { w, d, y: h + 0.06, rise: 0.6, color: P.slate, wall, ridgeAlongZ: true });
  chimney(g, -0.32, h + 0.2, z0, 0.55, P.stoneDark);
  const f = face(g, 'front', w, d, z0);
  doorAt(f, 0, 0, { color: '#6f9f5c', h: 0.5 });
  windowAt(f, -0.4, 0.36, 0, { shutters: P.trim, flowerBox: FLOWERS, w: 0.24 });
  windowAt(f, 0.4, 0.36, 0, { shutters: P.trim, flowerBox: FLOWERS, w: 0.24 });
  windowAt(f, 0, h + 0.18, 0, { w: 0.18, h: 0.2, arch: true });
  for (const side of ['left', 'right'] as const) windowAt(face(g, side, w, d, z0), 0, 0.36, 0, { w: 0.26 });
  bush(g, 0.7, 0.7, 0.75, P.leaf);
  if (c.level >= 2) {
    picketFence(g, -0.95, 0.95, -0.25, 0.95);
    picketFence(g, 0.25, 0.95, 0.95, 0.95);
    picketFence(g, -0.95, 0.95, -0.95, 0.3);
    picketFence(g, 0.95, 0.95, 0.95, 0.3);
    bush(g, -0.7, 0.72, 0.7, '#7cc35a');
    for (let i = 0; i < 5; i++) sphere(g, 0.04, mat(FLOWERS[i]), -0.85 + i * 0.12, 0.08, 0.8, 6);
  }
  return g;
}

function townhouse(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.3;
  const d = 1.2;
  const z0 = -0.1;
  const h = 1.6;
  const wall = mat(P.blush, { map: TEX.brick(), repeat: [3, 5] });
  body(g, w, h, d, z0, wall);
  box(g, w + 0.1, 0.06, d + 0.1, mat(P.trim), 0, 0.86, z0, 0.02);
  box(g, w + 0.14, 0.08, d + 0.14, mat(P.trim), 0, h + 0.04, z0, 0.02);
  hipRoof(g, { w, d, y: h + 0.1, rise: 0.4, color: P.burgundy, top: 0.25 });
  chimney(g, 0.4, h + 0.2, z0 - 0.3, 0.5);
  const f = face(g, 'front', w, d, z0);
  doorAt(f, 0, 0, { color: P.slate, glassTop: true });
  for (const x of [-0.4, 0.4]) windowAt(f, x, 0.36, 0, { w: 0.26, flowerBox: FLOWERS });
  for (const x of [-0.4, 0, 0.4]) windowAt(f, x, 1.08, 0, { w: 0.24, h: 0.34, shutters: '#56708f' });
  for (const side of ['left', 'right'] as const) {
    const s = face(g, side, w, d, z0);
    windowAt(s, 0, 0.36, 0, { w: 0.26 });
    windowAt(s, 0, 1.08, 0, { w: 0.24, h: 0.34 });
  }
  if (c.level >= 2) {
    // Balcony with railing and planters
    box(g, 0.7, 0.05, 0.22, mat(P.trim), 0, 0.92, z0 + d / 2 + 0.1, 0.015);
    for (let i = 0; i <= 8; i++) cyl(g, 0.01, 0.01, 0.16, mat('#3b4250'), -0.33 + i * 0.0825, 0.97, z0 + d / 2 + 0.2, 4);
    box(g, 0.7, 0.025, 0.025, mat('#3b4250'), 0, 1.13, z0 + d / 2 + 0.2, 0.005);
    flowerBox(g, 0, h + 0.12, z0 + 0.1, 0.6, FLOWERS);
    bush(g, -0.35, z0 - 0.2, 0.4);
  }
  return g;
}

// ─── Shops ────────────────────────────────────────────────────────────────────

function shopShell(g: THREE.Group, o: { w: number; d: number; h: number; wall: THREE.Material; roof: string; z0?: number; rise?: number }) {
  const z0 = o.z0 ?? -0.1;
  body(g, o.w, o.h, o.d, z0, o.wall);
  box(g, o.w + 0.08, 0.07, o.d + 0.08, mat(P.trim), 0, o.h, z0, 0.02);
  gableRoof(g, { w: o.w, d: o.d, y: o.h + 0.07, rise: o.rise ?? 0.42, color: o.roof, wall: o.wall });
  return { f: face(g, 'front', o.w, o.d, z0), z0 };
}

function cafe(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.5;
  const d = 1.2;
  const h = 1.0;
  const wall = mat(P.mint, { map: TEX.plaster(), repeat: [2, 2] });
  const { f, z0 } = shopShell(g, { w, d, h, wall, roof: P.coral });
  doorAt(f, -0.45, 0, { color: P.teal, glassTop: true, lamp: false });
  shopWindow(f, 0.25, 0.68, 0.4, ['cupcake', 'donut', 'cookie', 'cake']);
  const awn = c.level >= 3 ? [P.teal, P.trim] : [P.coral, P.trim];
  awning(f, 0, 0.78, 0.03, 1.36, awn[0], awn[1]);
  signBoard(f, c.name ?? '', 0, 0.8, 0.04, { w: 0.9, h: 0.17, bg: P.ivory, fg: '#c4553e', glyph: 'cup' });
  windowAt(face(g, 'right', w, d, z0), 0, 0.45, 0, { w: 0.3, flowerBox: FLOWERS });
  windowAt(face(g, 'left', w, d, z0), 0, 0.45, 0, { w: 0.3 });
  chimney(g, -0.45, h + 0.15, z0 - 0.25, 0.45, P.stoneDark);
  if (c.level === 1) cafeTable(g, 0.62, 0.72);
  if (c.level >= 2) {
    box(g, 1.7, 0.04, 0.42, mat(P.wood, { map: TEX.planks(), repeat: [6, 1] }), 0, 0, 0.73, 0.012);
    cafeTable(g, 0.52, 0.76, [P.coral, P.trim]);
    cafeTable(g, -0.05, 0.8, [P.teal, P.trim]);
    for (const x of [-0.84, 0.84]) {
      cyl(g, 0.06, 0.05, 0.14, mat(P.terracotta), x, 0, 0.82, 10);
      bush(g, x, 0.82, 0.5);
    }
  }
  if (c.level >= 3) {
    for (const x of [-0.84, 0.84]) cyl(g, 0.012, 0.012, 1.0, mat('#3b4250'), x, 0, 0.95, 5);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      sphere(g, 0.025, bulb, -0.84 + t * 1.68, 0.96 - Math.sin(t * Math.PI) * 0.1, 0.95, 6);
    }
  }
  if (c.flags.cafe_chalkboard) {
    const holder = new THREE.Group();
    holder.position.set(-0.78, 0, 0.62);
    holder.rotation.y = 0.4;
    g.add(holder);
    box(holder, 0.22, 0.3, 0.03, mat(P.woodDark), 0, 0, 0, 0.01, [-0.15, 0, 0]);
    box(holder, 0.17, 0.22, 0.02, mat('#2f3a33'), 0, 0.04, 0.025, 0.005, [-0.15, 0, 0]);
  }
  if (c.flags.cafe_brunch) {
    cafeTable(g, -0.6, 0.8);
    for (let i = 0; i < 3; i++) sphere(g, 0.035, mat(FLOWERS[i]), -0.6 + (i - 1) * 0.04, 0.33, 0.8, 6);
  }
  return g;
}

function bakery(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.5;
  const d = 1.2;
  const h = 1.0;
  const wall = mat(P.butter, { map: TEX.siding(), repeat: [2, 3] });
  const { f, z0 } = shopShell(g, { w, d, h, wall, roof: P.burgundy });
  doorAt(f, 0.45, 0, { color: P.woodDark, glassTop: true, lamp: false });
  shopWindow(f, -0.22, 0.7, 0.4, ['cake', 'cupcake', 'donut', 'cookie']);
  awning(f, 0, 0.78, 0.03, 1.36, P.burgundy, P.cream);
  signBoard(f, c.name ?? '', 0, 0.8, 0.04, { w: 0.8, h: 0.17, bg: P.cream, fg: '#8a3b2f', glyph: c.flags.bakery_pie_sign ? 'pie' : 'bread' });
  windowAt(face(g, 'right', w, d, z0), 0, 0.45, 0, { w: 0.3, shutters: P.burgundy });
  windowAt(face(g, 'left', w, d, z0), 0, 0.45, 0, { w: 0.3, shutters: P.burgundy });
  chimney(g, 0.45, h + 0.15, z0 - 0.25, c.level >= 3 ? 0.8 : 0.45);
  prop(g, 'barrel', 0.24, -0.82, 0, 0.5);
  if (c.level >= 2) {
    // Pastry cart
    box(g, 0.42, 0.06, 0.24, mat(P.wood, { map: TEX.planks() }), 0.66, 0.2, 0.72, 0.02);
    for (const sx of [-1, 1]) cyl(g, 0.08, 0.08, 0.03, mat(P.woodDark), 0.66 + sx * 0.18, 0.08, 0.86, 12, [Math.PI / 2, 0, 0]);
    prop(g, 'cupcake', 0.09, 0.56, 0.26, 0.72);
    prop(g, 'donut', 0.06, 0.76, 0.26, 0.72);
  }
  if (c.level >= 3) {
    box(g, 0.5, 0.4, 0.35, mat(P.barn, { map: TEX.brick(), repeat: [2, 2] }), -0.95, 0, -0.3, 0.05);
    put(g, new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(P.barn, { map: TEX.brick(), repeat: [2, 1] }), [-0.95, 0.4, -0.3]);
  }
  return g;
}

function flowerShop(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.45;
  const d = 1.2;
  const h = 1.0;
  const wall = mat(P.blush, { map: TEX.plaster(), repeat: [2, 2] });
  const { f, z0 } = shopShell(g, { w, d, h, wall, roof: P.moss });
  doorAt(f, -0.42, 0, { color: P.trim, glassTop: true, lamp: false });
  shopWindow(f, 0.25, 0.66, 0.4);
  awning(f, 0, 0.78, 0.03, 1.32, '#5f9e5a', P.trim);
  signBoard(f, c.name ?? '', 0, 0.8, 0.04, { w: 0.9, h: 0.17, bg: P.ivory, fg: '#b0477a', glyph: 'flower' });
  windowAt(face(g, 'right', w, d, z0), 0, 0.45, 0, { w: 0.3, flowerBox: FLOWERS });
  // Stepped flower stand with real nature-kit blooms
  box(g, 0.6, 0.1, 0.22, mat(P.wood, { map: TEX.planks() }), 0.3, 0, 0.66, 0.015);
  box(g, 0.6, 0.1, 0.12, mat(P.wood, { map: TEX.planks() }), 0.3, 0.1, 0.61, 0.015);
  for (let i = 0; i < 4; i++) {
    cyl(g, 0.055, 0.045, 0.1, mat(i % 2 ? P.sky : P.terracotta), 0.08 + i * 0.15, 0.1, 0.72, 10);
    prop(g, 'flower_red', 0.2, 0.08 + i * 0.15, 0.18, 0.72, i, { colorRed: FLOWERS[i] });
  }
  if (c.level >= 2) {
    box(g, 0.4, 0.2, 0.25, mat(P.sky), -0.7, 0.12, 0.72, 0.04);
    for (const sx of [-1, 1]) cyl(g, 0.08, 0.08, 0.03, mat(P.woodDark), -0.7 + sx * 0.18, 0.08, 0.86, 12, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 6; i++) sphere(g, 0.045, mat(FLOWERS[i % 5]), -0.82 + (i % 3) * 0.12, 0.36, 0.66 + Math.floor(i / 3) * 0.1, 6);
  }
  return g;
}

function grocery(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 2.45;
  const d = 1.2;
  const h = 1.0;
  const wall = mat(P.powder, { map: TEX.siding(), repeat: [3, 3] });
  const { f, z0 } = shopShell(g, { w, d, h, wall, roof: P.slate });
  doorAt(f, 0, 0, { color: P.trim, glassTop: true, w: 0.36, lamp: false });
  shopWindow(f, -0.72, 0.7, 0.4, ['apple', 'banana', 'cheese']);
  shopWindow(f, 0.72, 0.7, 0.4, ['carrot', 'pumpkin', 'watermelon']);
  awning(f, 0, 0.78, 0.03, 2.3, P.sky, P.trim, 0.36);
  signBoard(f, c.name ?? '', 0, 0.8, 0.04, { w: 0.8, h: 0.17, bg: P.ivory, fg: '#2f6fa8', glyph: 'basket' });
  windowAt(face(g, 'right', w, d, z0), 0, 0.45, 0, { w: 0.3 });
  const crate = mat(P.wood, { map: TEX.planks() });
  const crates: [number, string][] = [[-0.9, 'apple'], [-0.55, 'carrot'], [0.55, 'pumpkin'], [0.9, 'watermelon']];
  for (const [x, food] of crates) {
    box(g, 0.28, 0.14, 0.22, crate, x, 0, 0.7, 0.015);
    for (let i = 0; i < 3; i++) prop(g, food, food === 'watermelon' || food === 'pumpkin' ? 0.11 : 0.08, x - 0.08 + i * 0.08, 0.14, 0.7, i);
  }
  if (c.level >= 2) {
    for (const x of [-1.15, 1.15]) {
      box(g, 0.2, 0.32, 0.2, crate, x, 0, 0.45, 0.015);
      prop(g, 'banana', 0.08, x, 0.32, 0.45);
    }
  }
  return g;
}

// ─── Production & community ───────────────────────────────────────────────────

function garden(c: ArchCtx) {
  const g = new THREE.Group();
  const soil = mat('#7a5233', { roughness: 1 });
  const plank = mat(P.wood, { map: TEX.planks(), repeat: [3, 1] });
  // Gravel ground
  box(g, 1.85, 0.03, 1.85, mat(P.stone, { map: TEX.cobbles(), repeat: [4, 4] }), 0, 0, 0, 0.02);
  const rows = [-0.45, 0.05, 0.55];
  rows.forEach((z, ri) => {
    box(g, 1.3, 0.14, 0.32, plank, -0.12, 0.03, z, 0.02);
    box(g, 1.22, 0.04, 0.26, soil, -0.12, 0.14, z, 0.01);
    for (let i = 0; i < 6; i++) {
      const x = -0.68 + i * 0.22;
      if (ri === 0) prop(g, 'flower_red', 0.24, x, 0.16, z, i, { colorRed: FLOWERS[i % 5] });
      else if (ri === 1) {
        bush(g, x, z, 0.45, '#4f9a45');
        sphere(g, 0.025, mat('#c0304d'), x + 0.04, 0.18, z + 0.04, 6);
        sphere(g, 0.025, mat('#7b3fa0'), x - 0.03, 0.2, z + 0.02, 6);
      } else if (c.level >= 2) {
        cone(g, 0.05, 0.16, mat('#f07a2a'), x, 0.17, z, 6);
        sphere(g, 0.06, mat(P.leaf), x, 0.33, z, 6);
      } else bush(g, x, z, 0.3, '#8bcf6a');
    }
  });
  // Tool shed or greenhouse at the back-right
  if (c.level >= 2) {
    const gx = 0.72;
    box(g, 0.42, 0.04, 0.9, mat(P.stoneDark), gx, 0.03, -0.1, 0.01);
    const frame = mat(P.trim);
    for (const sx of [-1, 1]) for (const sz of [-1, 0, 1]) cyl(g, 0.015, 0.015, 0.5, frame, gx + sx * 0.18, 0.05, -0.1 + sz * 0.4, 5);
    const pane = new THREE.MeshStandardMaterial({ color: '#cdeff5', transparent: true, opacity: 0.45, roughness: 0.1 });
    put(g, rboxGeo(0.36, 0.48, 0.82, 0.01), pane, [gx, 0.3, -0.1]);
    put(g, rboxGeo(0.44, 0.02, 0.9, 0.005), pane, [gx, 0.62, -0.1], [0, 0, 0]);
  } else {
    box(g, 0.36, 0.42, 0.38, mat(P.wood, { map: TEX.planks() }), 0.72, 0.03, -0.45, 0.02);
    gableRoof(g, { w: 0.36, d: 0.38, y: 0.45, rise: 0.18, color: P.moss, wall: mat(P.wood, { map: TEX.planks() }), overhang: 0.05 });
    box(g, 0.16, 0.28, 0.02, mat(P.woodDark), 0.72, 0.03, -0.25, 0.01);
  }
  // Watering can
  cyl(g, 0.05, 0.05, 0.09, mat(P.sky, { metalness: 0.3 }), 0.72, 0.03, 0.6, 10);
  if (c.level >= 3) {
    for (let i = 0; i < 3; i++) {
      cyl(g, 0.012, 0.012, 0.6, mat('#4f8a3a'), 0.6 + i * 0.13, 0.03, 0.75, 5);
      cyl(g, 0.08, 0.08, 0.02, mat('#ffcc33'), 0.6 + i * 0.13, 0.63, 0.77, 12, [Math.PI / 2.3, 0, 0]);
      sphere(g, 0.035, mat('#6b4a2b'), 0.6 + i * 0.13, 0.635, 0.785, 6);
    }
    // Scarecrow
    cyl(g, 0.015, 0.015, 0.6, mat(P.woodDark), -0.85, 0, -0.75, 5);
    box(g, 0.36, 0.03, 0.03, mat(P.woodDark), -0.85, 0.45, -0.75, 0.01);
    box(g, 0.16, 0.2, 0.08, mat(P.berry), -0.85, 0.3, -0.75, 0.03);
    sphere(g, 0.07, mat(P.butter), -0.85, 0.6, -0.75, 8);
    cone(g, 0.11, 0.08, mat('#e0b85a'), -0.85, 0.64, -0.75, 10);
  }
  return g;
}

function workshop(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 2.3;
  const d = 1.25;
  const h = 1.05;
  const z0 = -0.12;
  const wall = mat(P.barn, { map: TEX.siding(), repeat: [3, 3] });
  body(g, w, h, d, z0, wall);
  gableRoof(g, { w, d, y: h + 0.06, rise: 0.5, color: P.slate, wall: mat(P.barn, { map: TEX.siding(), repeat: [2, 2] }) });
  const f = face(g, 'front', w, d, z0);
  // Barn door with X-brace
  box(f, 0.64, 0.66, 0.05, mat(P.trim), -0.2, 0.06, 0, 0.02);
  box(f, 0.56, 0.6, 0.04, mat(shadeHex(P.barn, -0.1), { map: TEX.planks(), repeat: [2, 1] }), -0.2, 0.08, 0.02, 0.015);
  for (const a of [0.82, -0.82]) box(f, 0.05, 0.78, 0.02, mat(P.trim), -0.2, 0.0, 0.05, 0.005, [0, 0, a]);
  windowAt(f, 0.6, 0.44, 0, { w: 0.32, shutters: P.trim });
  signBoard(f, c.name ?? '', -0.1, 0.84, 0.04, { w: 1.0, h: 0.15, bg: P.cream, fg: '#7a3b2a', glyph: 'hammer' });
  windowAt(face(g, 'right', w, d, z0), 0, 0.44, 0, { w: 0.3 });
  chimney(g, 0.7, h + 0.15, z0 - 0.2, 0.5, P.stoneDark);
  // Log pile and plank stack
  prop(g, 'log', 0.16, -1.0, 0, 0.62, 0.1);
  prop(g, 'log', 0.16, -0.95, 0.12, 0.6, -0.2);
  const plank = mat(P.wood, { map: TEX.planks() });
  for (let i = 0; i < 4; i++) box(g, 0.5, 0.035, 0.12, plank, 0.75, i * 0.037, 0.65, 0.008, [0, (i % 2) * 0.08, 0]);
  // Sawhorse
  box(g, 0.32, 0.04, 0.05, mat(P.woodDark), 0.25, 0.22, 0.72, 0.01);
  for (const sx of [-1, 1]) for (const a of [-0.3, 0.3]) box(g, 0.03, 0.24, 0.03, mat(P.woodDark), 0.25 + sx * 0.12, 0, 0.72, 0.005, [a, 0, 0]);
  if (c.level >= 2) {
    for (let i = 0; i < 6; i++) box(g, 0.6, 0.035, 0.14, plank, 1.0, i * 0.037, -0.3, 0.008, [0, Math.PI / 2 + (i % 2) * 0.05, 0]);
    prop(g, 'barrels', 0.3, -1.1, 0, -0.35);
  }
  if (c.level >= 3) {
    const iron = mat(P.gold, { metalness: 0.3 });
    box(g, 0.08, 1.9, 0.08, iron, -1.05, 0, -0.55, 0.01);
    box(g, 0.9, 0.06, 0.06, iron, -0.7, 1.86, -0.55, 0.01);
    cyl(g, 0.006, 0.006, 0.5, mat('#333'), -0.32, 1.38, -0.55, 4);
    box(g, 0.14, 0.1, 0.14, mat(P.wood, { map: TEX.planks() }), -0.32, 1.28, -0.55, 0.01);
  }
  return g;
}

function park(c: ArchCtx) {
  const g = new THREE.Group();
  box(g, 2.85, 0.04, 2.85, mat(P.grassDark), 0, 0, 0, 0.04);
  const path = mat(P.stone, { map: TEX.cobbles(), repeat: [5, 1] });
  box(g, 2.8, 0.03, 0.36, path, 0, 0.03, 0.4, 0.01);
  box(g, 0.36, 0.03, 2.4, path, 0, 0.03, -0.15, 0.01);
  prop(g, 'tree_fat', 1.3, -0.95, 0.03, -0.9, 0.3);
  prop(g, 'tree_fat', 1.1, 0.95, 0.03, -0.95, 1.2);
  prop(g, 'tree_pine', 1.3, 1.05, 0.03, 1.05, 0.5);
  bench(g, -0.75, 0.8, Math.PI);
  bench(g, 0.6, -0.05, -Math.PI / 2);
  lampPost(g, -0.35, 0.8, 0.75);
  lampPost(g, 0.35, -0.9, 0.75);
  for (let i = 0; i < 8; i++) sphere(g, 0.05, mat(FLOWERS[i % 5]), -1.15 + (i % 4) * 0.12, 0.1, 1.0 + Math.floor(i / 4) * 0.12, 6);
  bush(g, -1.1, 0.1, 0.8);
  if (c.level >= 2) {
    const wood = mat(P.trim);
    const gx = -0.6;
    const gz = -0.4;
    cyl(g, 0.42, 0.42, 0.06, mat(P.wood, { map: TEX.planks() }), gx, 0.03, gz, 8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      cyl(g, 0.02, 0.02, 0.5, wood, gx + Math.cos(a) * 0.36, 0.09, gz + Math.sin(a) * 0.36, 6);
    }
    cone(g, 0.5, 0.28, mat(P.coral, { map: TEX.shingles(), repeat: [3, 1] }), gx, 0.58, gz, 6);
    sphere(g, 0.04, mat(P.gold), gx, 0.88, gz, 8);
  }
  if (c.flags.park_bunting) {
    const cols = [P.coral, P.butter, P.sky, P.mint, P.berry];
    for (const [x0, z0, x1, z1] of [[-1.3, 1.3, 1.3, 1.3], [-1.3, -1.3, -1.3, 1.3]] as const) {
      for (const [px, pz] of [[x0, z0], [x1, z1]]) cyl(g, 0.015, 0.015, 0.9, mat(P.trim), px, 0, pz, 5);
      for (let i = 1; i < 10; i++) {
        const t = i / 10;
        const tri = cone(g, 0.04, 0.07, mat(cols[i % 5]), x0 + (x1 - x0) * t, 0.78 - Math.sin(t * Math.PI) * 0.12, z0 + (z1 - z0) * t, 3);
        tri.rotation.x = Math.PI;
      }
    }
  }
  return g;
}

function townHall(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 2.4;
  const d = 1.7;
  const h = 1.25;
  const z0 = -0.3;
  const wall = mat(P.cream, { map: TEX.brick(), repeat: [4, 3] });
  body(g, w, h, d, z0, wall);
  box(g, w + 0.12, 0.1, d + 0.12, mat(P.trim), 0, h, z0, 0.03);
  hipRoof(g, { w, d, y: h + 0.1, rise: 0.35, color: P.slate, top: 0.4 });
  // Portico with columns and pediment
  const stone = mat(P.stone, { map: TEX.cobbles(), repeat: [3, 1] });
  box(g, 1.4, 0.08, 0.5, stone, 0, 0, z0 + d / 2 + 0.25, 0.02);
  box(g, 1.2, 0.08, 0.4, stone, 0, 0.08, z0 + d / 2 + 0.2, 0.02);
  for (let i = 0; i < 4; i++) cyl(g, 0.05, 0.06, 0.9, mat(P.trim), -0.48 + i * 0.32, 0.16, z0 + d / 2 + 0.3, 12);
  box(g, 1.25, 0.08, 0.42, mat(P.trim), 0, 1.06, z0 + d / 2 + 0.2, 0.02);
  const ped = new THREE.Shape();
  ped.moveTo(-0.64, 0);
  ped.lineTo(0.64, 0);
  ped.lineTo(0, 0.3);
  ped.closePath();
  put(g, new THREE.ExtrudeGeometry(ped, { depth: 0.38, bevelEnabled: false }), mat(P.trim), [0, 1.14, z0 + d / 2 + 0.01]);
  const f = face(g, 'front', w, d, z0);
  doorAt(f, 0, 0.0, { color: P.burgundy, w: 0.4, h: 0.62, glassTop: true, lamp: false });
  for (const x of [-0.9, 0.9]) {
    windowAt(f, x, 0.3, 0, { w: 0.28, h: 0.4, shutters: P.slate });
    windowAt(f, x, 0.85, 0, { w: 0.28, h: 0.26 });
  }
  signBoard(g, c.name ?? '', 0, 1.18, z0 + d / 2 + 0.4, { w: 0.6, h: 0.13, bg: P.ivory, fg: P.ink, glyph: 'star' });
  // Clock tower
  const towerH = c.level >= 2 ? 0.95 : 0.65;
  box(g, 0.5, towerH, 0.5, wall, 0, h + 0.2, z0, 0.02);
  cyl(g, 0.15, 0.15, 0.03, mat(P.ivory), 0, h + 0.2 + towerH * 0.55, z0 + 0.25, 20, [Math.PI / 2, 0, 0]);
  box(g, 0.012, 0.11, 0.01, mat(P.ink), 0, h + 0.2 + towerH * 0.55 + 0.17, z0 + 0.285, 0.003);
  box(g, 0.08, 0.012, 0.01, mat(P.ink), 0.03, h + 0.2 + towerH * 0.55 + 0.15, z0 + 0.285, 0.003);
  hipRoof(g, { w: 0.5, d: 0.5, y: h + 0.2 + towerH, rise: 0.42, color: P.burgundy, overhang: 0.06, top: 0.02 });
  cyl(g, 0.012, 0.012, 0.5, mat('#888'), 0, h + 0.62 + towerH, z0, 4);
  box(g, 0.24, 0.14, 0.01, mat(P.coral), 0.13, h + 0.95 + towerH, z0, 0.003);
  for (const x of [-1.05, 1.05]) bush(g, x, 0.75, 0.9);
  if (c.level >= 2) {
    const cols = [P.coral, P.butter, P.sky, P.mint, P.berry];
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const tri = cone(g, 0.04, 0.07, mat(cols[i % 5]), -1.2 + t * 2.4, h - 0.08 - Math.sin(t * Math.PI) * 0.1, z0 + d / 2 + 0.06, 3);
      tri.rotation.x = Math.PI;
    }
  }
  return g;
}

// ─── Landmarks & scenery ──────────────────────────────────────────────────────

function fountain(c: ArchCtx) {
  const g = new THREE.Group();
  const stage = c.stage ?? 0;
  const stone = mat(P.stone, { map: TEX.cobbles(), repeat: [4, 1] });
  box(g, 1.8, 0.03, 1.8, mat(P.stone, { map: TEX.cobbles(), repeat: [4, 4] }), 0, 0, 0, 0.02);
  if (stage === 0) {
    // Surveyor stakes and a project sign
    for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
      cyl(g, 0.015, 0.015, 0.3, mat(P.wood), x, 0, z, 5);
      box(g, 0.05, 0.03, 0.01, mat(P.coral), x, 0.26, z, 0.003);
    }
    for (const [x0, z0, x1, z1] of [[-0.6, -0.6, 0.6, -0.6], [0.6, -0.6, 0.6, 0.6], [0.6, 0.6, -0.6, 0.6], [-0.6, 0.6, -0.6, -0.6]]) {
      const len = Math.hypot(x1 - x0, z1 - z0);
      box(g, len, 0.006, 0.006, mat('#ffffff'), (x0 + x1) / 2, 0.22, (z0 + z1) / 2, 0.002, [0, -Math.atan2(z1 - z0, x1 - x0), 0]);
    }
    signBoard(g, c.text?.projectSign ?? '', 0, 0.28, 0.75, { w: 0.6, h: 0.14, bg: P.ivory, fg: '#2f6fa8' });
    cyl(g, 0.015, 0.015, 0.28, mat(P.woodDark), -0.25, 0, 0.73, 5);
    cyl(g, 0.015, 0.015, 0.28, mat(P.woodDark), 0.25, 0, 0.73, 5);
    return g;
  }
  cyl(g, 0.78, 0.82, 0.08, stone, 0, 0.02, 0, 16);
  if (stage >= 2) {
    const ring = put(g, new THREE.TorusGeometry(0.66, 0.08, 8, 24), stone, [0, 0.22, 0], [Math.PI / 2, 0, 0]);
    ring.scale.set(1, 1, 1.8);
    cyl(g, 0.68, 0.7, 0.18, stone, 0, 0.06, 0, 16);
  }
  if (stage >= 3) {
    cyl(g, 0.12, 0.16, 0.5, stone, 0, 0.1, 0, 10);
    cyl(g, 0.3, 0.22, 0.07, stone, 0, 0.58, 0, 14);
    sphere(g, 0.1, mat(P.gold, { metalness: 0.5, roughness: 0.35 }), 0, 0.75, 0, 12);
  }
  if (stage >= 4) {
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.02, 24), new THREE.MeshStandardMaterial({ color: P.water, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 }));
    water.position.set(0, 0.26, 0);
    water.name = 'water';
    water.userData.keep = true;
    g.add(water);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      sphere(g, 0.06, mat(i % 2 ? P.leaf : FLOWERS[i % 5]), Math.cos(a) * 0.86, 0.08, Math.sin(a) * 0.86, 6);
    }
    const spout = new THREE.Object3D();
    spout.name = 'spout';
    spout.position.set(0, 0.86, 0);
    g.add(spout);
  }
  if (stage === 1 || stage === 2) {
    // Building materials while under construction
    for (let i = 0; i < 3; i++) box(g, 0.3, 0.035, 0.1, mat(P.wood, { map: TEX.planks() }), 0.75, i * 0.036, -0.75, 0.008);
    box(g, 0.16, 0.12, 0.16, mat(P.stoneDark), -0.75, 0, -0.75, 0.02);
  }
  return g;
}

function pond() {
  const g = new THREE.Group();
  const rim = mat(P.stoneDark, { roughness: 0.95 });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = 1.2 + Math.sin(a * 3) * 0.12;
    sphere(g, 0.13 + (i % 3) * 0.03, rim, Math.cos(a) * r, 0.04, Math.sin(a) * r, 7, [1, 0.55, 1]);
  }
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.22, 32), new THREE.MeshStandardMaterial({ color: P.water, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.035;
  water.name = 'water';
  water.userData.keep = true;
  water.receiveShadow = true;
  g.add(water);
  put(g, new THREE.CircleGeometry(1.3, 32), mat('#4a8f9c'), [0, 0.01, 0], [-Math.PI / 2, 0, 0]);
  const pad = mat('#5aa84a', { side: THREE.DoubleSide });
  for (const [x, z, s] of [[-0.4, 0.3, 1], [0.35, -0.4, 0.8], [0.5, 0.45, 1.1], [-0.2, -0.55, 0.7]]) {
    put(g, new THREE.CircleGeometry(0.13 * s, 12, 0.4, Math.PI * 1.8), pad, [x, 0.045, z], [-Math.PI / 2, 0, x * 3]);
  }
  sphere(g, 0.04, mat('#ffb6d0'), 0.5, 0.07, 0.45, 8);
  sphere(g, 0.035, mat('#ffffff'), -0.4, 0.07, 0.3, 8);
  for (let i = 0; i < 7; i++) cyl(g, 0.01, 0.012, 0.35 + (i % 3) * 0.08, mat('#5f8f3a'), 0.9 + (i % 3) * 0.06, 0.02, -0.6 + i * 0.05, 4);
  prop(g, 'frog', 0.12, -0.4, 0.05, 0.3, 0.6).userData.keep = true;
  prop(g, 'rock_small', 0.15, 1.0, 0.0, 0.6, 0, ROCK);
  return g;
}

function requestBoard() {
  const g = new THREE.Group();
  const wood = mat(P.woodDark);
  for (const sx of [-1, 1]) cyl(g, 0.03, 0.035, 0.85, wood, sx * 0.3, 0, 0, 6);
  box(g, 0.66, 0.42, 0.05, mat(P.wood, { map: TEX.planks(), repeat: [3, 1] }), 0, 0.32, 0, 0.02);
  const notes = ['#fffaf0', '#fff1b8', '#ffd9e0', '#d9f1ff', '#e3f7d4'];
  for (let i = 0; i < 5; i++) {
    const x = -0.22 + (i % 3) * 0.22;
    const y = 0.38 + Math.floor(i / 3) * 0.17;
    box(g, 0.14, 0.13, 0.01, mat(notes[i]), x, y, 0.03, 0.004, [0, 0, (i - 2) * 0.08]);
    sphere(g, 0.012, mat(P.coral), x, y + 0.12, 0.04, 6);
  }
  gableRoof(g, { w: 0.76, d: 0.16, y: 0.8, rise: 0.12, color: P.terracotta, wall: wood, overhang: 0.04 });
  return g;
}

function welcomeSign(c: ArchCtx) {
  const g = new THREE.Group();
  const wood = mat(P.woodDark);
  for (const sx of [-1, 1]) cyl(g, 0.04, 0.05, 0.72, wood, sx * 0.62, 0, 0, 6);
  signBoard(g, c.text?.welcome ?? c.hoodName, 0, 0.34, 0, { w: 1.2, h: 0.26, bg: P.ivory, fg: '#3f7d4f', frame: P.woodDark });
  box(g, 1.5, 0.06, 0.06, wood, 0, 0.68, 0, 0.015);
  for (let i = 0; i < 9; i++) {
    bush(g, -0.7 + i * 0.175, 0.12, 0.42, i % 2 ? '#6cc04a' : '#5aa548');
    sphere(g, 0.035, mat(FLOWERS[i % 5]), -0.7 + i * 0.175, 0.13, 0.2, 6);
  }
  return g;
}

/** Wooden scaffolding shown while a building is under construction. */
export function constructionSite(w: number, d: number) {
  const g = new THREE.Group();
  box(g, w - 0.3, 0.1, d - 0.4, mat(P.stoneDark, { map: TEX.cobbles(), repeat: [3, 2] }), 0, 0, -0.05, 0.02);
  const pole = mat(P.wood);
  const hx = (w - 0.4) / 2;
  const hz = (d - 0.5) / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.025, 0.025, 1.0, pole, sx * hx, 0.1, -0.05 + sz * hz, 6);
  for (const y of [0.45, 0.9]) {
    box(g, w - 0.36, 0.04, 0.1, mat(P.wood, { map: TEX.planks() }), 0, y, -0.05 + hz, 0.01);
    box(g, w - 0.36, 0.04, 0.1, mat(P.wood, { map: TEX.planks() }), 0, y, -0.05 - hz, 0.01);
  }
  for (let i = 0; i < 3; i++) box(g, 0.4, 0.035, 0.1, mat(P.wood, { map: TEX.planks() }), hx - 0.1, 0.1 + i * 0.036, d / 2 - 0.2, 0.008);
  // Striped barrier
  for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.25, mat(P.trim), sx * 0.3, 0, d / 2 - 0.08, 5);
  box(g, 0.7, 0.07, 0.02, mat('#ffffff', { map: TEX.awning('#f2b632', '#3d3226'), repeat: [3, 1] }), 0, 0.17, d / 2 - 0.08, 0.01);
  return g;
}

// ─── Decorations ──────────────────────────────────────────────────────────────

function decoration(kind: string): THREE.Group {
  const g = new THREE.Group();
  switch (kind) {
    case 'tree_round':
      prop(g, 'tree_fat', 1.25, 0, 0, 0, Math.random() * 6);
      break;
    case 'tree_pine':
      prop(g, 'tree_pine', 1.45, 0, 0, 0, Math.random() * 6);
      break;
    case 'tree_autumn':
      prop(g, 'tree_autumn', 1.4, 0, 0, 0, Math.random() * 6);
      break;
    case 'bush':
      bush(g, 0, 0, 1.4);
      break;
    case 'flower_bed': {
      box(g, 0.82, 0.08, 0.82, mat(P.wood, { map: TEX.planks(), repeat: [3, 1] }), 0, 0, 0, 0.02);
      box(g, 0.74, 0.04, 0.74, mat('#7a5233', { roughness: 1 }), 0, 0.06, 0, 0.01);
      for (let i = 0; i < 9; i++) prop(g, 'flower_red', 0.24, -0.24 + (i % 3) * 0.24, 0.08, -0.24 + Math.floor(i / 3) * 0.24, i, { colorRed: FLOWERS[(i * 2) % 5] });
      break;
    }
    case 'bench':
      bench(g, 0, -0.05, 0);
      break;
    case 'lamp':
      lampPost(g, 0, 0);
      break;
    case 'fence':
      prop(g, 'fence', 0.35, 0, 0, 0);
      break;
    case 'planter':
      box(g, 0.6, 0.2, 0.36, mat(P.wood, { map: TEX.planks(), repeat: [2, 1] }), 0, 0, 0, 0.03);
      for (let i = 0; i < 4; i++) bush(g, -0.2 + i * 0.135, 0, 0.42, i % 2 ? '#5aa548' : '#7cc35a');
      g.children.slice(-12).forEach((m) => (m.position.y += 0.18));
      break;
    case 'rock':
      prop(g, 'rock_tall', 0.42, -0.05, 0, 0, Math.random() * 6, ROCK);
      prop(g, 'rock_small', 0.18, 0.25, 0, 0.2, 1, ROCK);
      break;
    case 'mushroom':
      prop(g, 'mushroom_red', 0.3, -0.1, 0, 0);
      prop(g, 'mushroom_red', 0.2, 0.15, 0, 0.12, 1);
      prop(g, 'mushroom_red', 0.14, 0.05, 0, -0.18, 2);
      break;
    case 'barrels':
      prop(g, 'barrels', 0.4, 0, 0, 0);
      break;
    case 'crate':
      prop(g, 'crate', 0.32, 0, 0, 0, 0.3);
      break;
    case 'mailbox':
      cyl(g, 0.025, 0.025, 0.4, mat(P.woodDark), 0, 0, 0, 6);
      box(g, 0.2, 0.15, 0.3, mat(P.sky), 0, 0.4, 0, 0.07);
      box(g, 0.02, 0.1, 0.06, mat(P.coral), 0.11, 0.5, 0.05, 0.005);
      break;
    case 'parasol':
      cafeTable(g, 0, 0, [P.coral, P.trim]);
      break;
    case 'birdbath': {
      const stone = mat(P.stone);
      cyl(g, 0.12, 0.16, 0.06, stone, 0, 0, 0, 10);
      cyl(g, 0.05, 0.07, 0.36, stone, 0, 0.06, 0, 10);
      cyl(g, 0.24, 0.16, 0.08, stone, 0, 0.42, 0, 14);
      cyl(g, 0.2, 0.2, 0.01, mat(P.water, { roughness: 0.1 }), 0, 0.495, 0, 14);
      sphere(g, 0.045, mat('#5b8fd9'), 0.15, 0.53, 0, 8);
      cone(g, 0.015, 0.04, mat(P.amber), 0.2, 0.53, 0, 5).rotation.z = -Math.PI / 2;
      break;
    }
    case 'pie_stand':
      box(g, 0.62, 0.3, 0.38, mat('#fff4f0'), 0, 0, 0, 0.02);
      box(g, 0.66, 0.04, 0.42, mat(P.berry), 0, 0.3, 0, 0.01);
      prop(g, 'cake', 0.12, -0.15, 0.34, 0);
      prop(g, 'cupcake', 0.09, 0.08, 0.34, 0.05);
      prop(g, 'cookie', 0.04, 0.2, 0.34, -0.06);
      break;
    case 'festival_arch': {
      for (const sx of [-1, 1]) cyl(g, 0.035, 0.04, 0.8, mat(P.trim), sx * 0.38, 0, 0, 6);
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI;
        sphere(g, 0.06, mat(i % 2 ? P.leaf : FLOWERS[i % 5]), -Math.cos(a) * 0.38, 0.8 + Math.sin(a) * 0.28, 0, 6);
      }
      break;
    }
    case 'lantern_string': {
      cyl(g, 0.03, 0.035, 1.0, mat(P.woodDark), 0, 0, 0, 6);
      box(g, 0.5, 0.03, 0.03, mat(P.woodDark), 0.2, 0.92, 0, 0.01);
      for (let i = 0; i < 3; i++) {
        cyl(g, 0.004, 0.004, 0.12, mat('#333'), 0.06 + i * 0.16, 0.8, 0, 3);
        put(g, rboxGeo(0.07, 0.1, 0.07, 0.025), bulb, [0.06 + i * 0.16, 0.76, 0]);
      }
      break;
    }
    case 'statue': {
      const stone = mat(P.stone, { map: TEX.cobbles() });
      box(g, 0.5, 0.25, 0.5, stone, 0, 0, 0, 0.03);
      box(g, 0.4, 0.06, 0.4, mat(P.stoneDark), 0, 0.25, 0, 0.02);
      const goldM = mat(P.gold, { metalness: 0.55, roughness: 0.35 });
      cone(g, 0.14, 0.4, goldM, 0, 0.31, 0, 10);
      sphere(g, 0.09, goldM, 0, 0.78, 0, 12);
      cyl(g, 0.02, 0.02, 0.3, goldM, 0.12, 0.55, 0, 6).rotation.z = -0.8;
      break;
    }
    default:
      bush(g, 0, 0, 1);
  }
  return g;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const templateCache = new Map<string, THREE.Group>();

/** Build (and cache) a baked template; callers clone it for each instance. */
export function archetype(arch: string, ctx: ArchCtx): THREE.Group {
  const flagKey = Object.keys(ctx.flags).filter((k) => ctx.flags[k]).sort().join(',');
  const m = ctx.module;
  const modKey = m ? `${m.id}:${m.prefab}:${m.sign}:${m.palette.primary}${m.palette.secondary}${m.palette.accent}` : '';
  const key = `${arch}|${ctx.level}|${flagKey}|${ctx.hoodName}|${ctx.stage ?? ''}|${ctx.biome ?? ''}|${ctx.name ?? ''}|${modKey}|${JSON.stringify(ctx.text ?? {})}`;
  const hit = templateCache.get(key);
  if (hit) return hit.clone();
  let g: THREE.Group;
  const regional = arch.startsWith('spot:')
    ? spotArchetype(arch, ctx)
    : arch.startsWith('deco:')
      ? (communityDecoration(arch.slice(5)) ?? (ctx.biome === 'tropical' ? tropicalDecoration(arch.slice(5)) : null))
      : malaysianArchetype(arch, ctx);
  if (regional) g = regional;
  else if (arch.startsWith('deco:')) g = decoration(arch.slice(5));
  else
    switch (arch) {
      case 'starter_house': g = starterHouse(ctx); break;
      case 'cottage': g = cottage(ctx); break;
      case 'townhouse': g = townhouse(ctx); break;
      case 'cafe': g = cafe(ctx); break;
      case 'bakery': g = bakery(ctx); break;
      case 'flower_shop': g = flowerShop(ctx); break;
      case 'grocery': g = grocery(ctx); break;
      case 'garden': g = garden(ctx); break;
      case 'workshop': g = workshop(ctx); break;
      case 'park': g = park(ctx); break;
      case 'town_hall': g = townHall(ctx); break;
      case 'fountain': g = fountain(ctx); break;
      case 'pond': g = pond(); break;
      case 'request_board': g = requestBoard(); break;
      case 'welcome_sign': g = welcomeSign(ctx); break;
      default: g = decoration('bush');
    }
  // Trees keep their random rotation per instance, so don't cache them (the rain tree is symmetric).
  const baked = bake(g);
  if (!arch.startsWith('deco:tree') || (ctx.biome === 'tropical' && arch === 'deco:tree_round')) templateCache.set(key, baked);
  return baked.clone();
}

export function clearArchetypeCache() {
  templateCache.clear();
}

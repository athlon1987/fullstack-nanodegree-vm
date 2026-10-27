// Malaysian architecture kit (original, parametric): rumah kampung on stilts, pre-war style
// shoplots with a five-foot way, kopitiam, glass showroom, learning centre, community garden,
// balai raya, lakeside pavilion, lake & jetty, kampung gateway and tropical planting. Module prefabs take
// the module's palette and sign; nothing here depicts a real business or brand.
import * as THREE from 'three';
import { FLOWERS, ROCK, face, prop, type ArchCtx } from './common';
import { bulb, glass, mat, P, TEX } from './materials';
import { awning, box, bush, cone, cyl, gableRoof, hipRoof, lampPost, put, rboxGeo, shadeHex, signBoard, sphere } from './parts';

const C = {
  timber: '#8a5a37',
  timberLight: '#c08a57',
  stilt: '#6b4a30',
  zincRed: '#b5523b',
  zincGrey: '#a3abb0',
  zincGreen: '#4f7d5a',
  tile: '#c4553e',
  plaster: '#f7ecd8',
  shutter: '#2f7d6b',
  marble: '#f2efe8',
  laterite: '#c0643c',
  leaf: '#4f9a3f',
  leafDark: '#3c7f32',
  bamboo: '#c9b45a',
  clay: '#a65a35',
};

/** Shophouse facade colourways (pastel plaster + shutter colour). */
const SHOPLOT_TONES: Record<string, { wall: string; trim: string; shutter: string; roof: string }> = {
  cream: { wall: '#f7ecd8', trim: '#fffaf0', shutter: '#2f7d6b', roof: C.tile },
  mint: { wall: '#bfe3d6', trim: '#fffaf0', shutter: '#c4553e', roof: C.tile },
  butter: { wall: '#f5dd84', trim: '#fffaf0', shutter: '#3f6fa8', roof: C.tile },
  blush: { wall: '#f4bdb5', trim: '#fffaf0', shutter: '#2f7d6b', roof: C.tile },
  sky: { wall: '#bcd8f2', trim: '#fffaf0', shutter: '#b5523b', roof: C.tile },
  lilac: { wall: '#d9c8ee', trim: '#fffaf0', shutter: '#4f7d5a', roof: C.tile },
};

const anchor = (g: THREE.Object3D, name: string, x: number, y: number, z: number) => {
  const a = new THREE.Object3D();
  a.name = `anchor:${name}`;
  a.position.set(x, y, z);
  g.add(a);
};

/** Shift a sub-assembly (roofs are built around their own origin). */
const at = (g: THREE.Object3D, x: number, y: number, z: number) => {
  const h = new THREE.Group();
  h.position.set(x, y, z);
  g.add(h);
  return h;
};

function louvreWindow(f: THREE.Object3D, x: number, y: number, w: number, h: number, frame: string, open = true) {
  const fm = mat(frame);
  box(f, w + 0.06, h + 0.06, 0.04, mat(P.trim), x, y - 0.03, 0, 0.01);
  put(f, rboxGeo(w, h, 0.02, 0.006), glass, [x, y + h / 2, 0.02]);
  // Open shutters: two louvred leaves folded out to the sides
  const lv = mat(frame, { map: TEX.louvre(), repeat: [1, 2] });
  for (const s of [-1, 1]) {
    if (open) box(f, w * 0.5, h, 0.025, lv, x + s * (w * 0.75 + 0.03), y, 0.03, 0.006);
    else box(f, w * 0.5 - 0.005, h, 0.025, lv, x + s * w * 0.25, y, 0.03, 0.006);
  }
  box(f, w + 0.12, 0.03, 0.08, fm, x, y + h + 0.02, 0.03, 0.008);
}

function pottedPlant(g: THREE.Object3D, x: number, y: number, z: number, s = 1, flower?: string) {
  cyl(g, 0.06 * s, 0.045 * s, 0.1 * s, mat(C.clay), x, y, z, 10);
  bush(g, x, z, 0.45 * s, C.leaf);
  g.children.slice(-3).forEach((m) => (m.position.y += y + 0.08 * s));
  if (flower) sphere(g, 0.03 * s, mat(flower), x + 0.03, y + 0.2 * s, z + 0.02, 6);
}

function tempayan(g: THREE.Object3D, x: number, z: number, s = 1) {
  const m = mat('#7a4a2c', { roughness: 0.35 });
  sphere(g, 0.13 * s, m, x, 0.13 * s, z, 12, [1, 1.1, 1]);
  cyl(g, 0.07 * s, 0.08 * s, 0.06 * s, m, x, 0.26 * s, z, 12);
  cyl(g, 0.085 * s, 0.085 * s, 0.015 * s, mat('#5e3a22'), x, 0.32 * s, z, 12);
}

function marbleTable(g: THREE.Object3D, x: number, z: number) {
  const iron = mat('#3b4250', { metalness: 0.3, roughness: 0.6 });
  cyl(g, 0.13, 0.13, 0.025, mat(C.marble, { roughness: 0.3 }), x, 0.27, z, 16);
  cyl(g, 0.015, 0.02, 0.27, iron, x, 0, z, 6);
  cyl(g, 0.07, 0.08, 0.02, iron, x, 0, z, 10);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const sx = x + Math.cos(a) * 0.2;
    const sz = z + Math.sin(a) * 0.2;
    cyl(g, 0.05, 0.05, 0.02, mat(i % 2 ? '#d64f3a' : '#2f7d9b'), sx, 0.15, sz, 10); // round stools
    cyl(g, 0.012, 0.016, 0.15, iron, sx, 0, sz, 5);
  }
}

function rattanChair(g: THREE.Object3D, x: number, z: number, ry = 0) {
  const h = at(g, x, 0, z);
  h.rotation.y = ry;
  const r = mat('#c9a063', { roughness: 0.9 });
  box(h, 0.2, 0.04, 0.2, r, 0, 0.14, 0, 0.03);
  box(h, 0.2, 0.18, 0.03, r, 0, 0.16, -0.09, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(h, 0.012, 0.012, 0.14, r, sx * 0.08, 0, sz * 0.08, 5);
}

function bicycle(g: THREE.Object3D, x: number, z: number, color: string, ry = 0) {
  const h = at(g, x, 0, z);
  h.rotation.y = ry;
  const tyre = mat('#2b2b33');
  for (const sx of [-1, 1]) put(h, new THREE.TorusGeometry(0.08, 0.012, 6, 16), tyre, [sx * 0.12, 0.09, 0]);
  const fm = mat(color, { metalness: 0.3, roughness: 0.5 });
  box(h, 0.22, 0.015, 0.015, fm, 0, 0.14, 0, 0.004, [0, 0, 0.2]);
  box(h, 0.015, 0.12, 0.015, fm, -0.04, 0.1, 0, 0.004);
  box(h, 0.06, 0.012, 0.03, mat('#2b2b33'), -0.04, 0.22, 0, 0.004);
  box(h, 0.012, 0.012, 0.1, fm, 0.11, 0.24, 0, 0.004);
}

/** A pole with a little two-tone festival pennant (deliberately not a flag: no flags of any kind). */
const PENNANT = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.lineTo(0.26, -0.065);
  sh.lineTo(0, -0.13);
  sh.closePath();
  return new THREE.ShapeGeometry(sh);
})();
function flagPole(g: THREE.Object3D, x: number, z: number, color: string, h = 1.2) {
  cyl(g, 0.012, 0.016, h, mat('#d9d6cf', { metalness: 0.5, roughness: 0.4 }), x, 0, z, 6);
  const p = new THREE.Mesh(PENNANT, mat(color, { side: THREE.DoubleSide }));
  p.position.set(x + 0.01, h - 0.04, z);
  p.castShadow = true;
  g.add(p);
  const q = new THREE.Mesh(PENNANT, mat('#fffaf0', { side: THREE.DoubleSide }));
  q.scale.set(0.55, 0.45, 1);
  q.position.set(x + 0.012, h - 0.075, z + 0.002);
  g.add(q);
}

// ─── Homes ───────────────────────────────────────────────────────────────────

/** Timber house on stilts, gable to the front, serambi verandah and stairs. */
function rumahKampung(c: ArchCtx, o: { wall: string; roof: string; w?: number; d?: number; stilt?: number } = { wall: C.timberLight, roof: C.zincRed }) {
  const g = new THREE.Group();
  const w = o.w ?? 1.3;
  const d = o.d ?? 1.05;
  const z0 = -0.28;
  const fh = o.stilt ?? 0.34; // floor height
  const wh = 0.62;
  const wood = mat(o.wall, { map: TEX.planks(), repeat: [3, 2] });
  const dark = mat(C.timber);
  const stiltM = mat(C.stilt);
  // Stilts on stone footings
  for (const sx of [-1, 0, 1])
    for (const sz of [-1, 0, 1]) {
      const px = (sx * (w - 0.08)) / 2;
      const pz = z0 + (sz * (d - 0.08)) / 2;
      box(g, 0.09, 0.05, 0.09, mat(P.stoneDark), px, 0, pz, 0.01);
      box(g, 0.06, fh, 0.06, stiltM, px, 0.04, pz, 0.01);
    }
  box(g, w + 0.08, 0.05, d + 0.08, dark, 0, fh, z0, 0.01);
  box(g, w, wh, d, wood, 0, fh + 0.05, z0, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, wh, 0.05, dark, (sx * w) / 2, fh + 0.05, z0 + (sz * d) / 2, 0.01);
  // Steep gable roof, ridge running front-to-back so the decorated gable faces the street
  const roofY = fh + 0.05 + wh;
  gableRoof(at(g, 0, 0, z0), { w, d, y: roofY, rise: 0.62, color: o.roof, wall: wood, ridgeAlongZ: true, map: 'zinc', overhang: 0.16 });
  // Gable fretwork (ventilation panel) and crossed ridge boards
  const gf = at(g, 0, roofY + 0.06, z0 + d / 2 + 0.03);
  const fret = mat('#f3e2c0');
  for (let i = 0; i < 5; i++) box(gf, 0.5 - i * 0.09, 0.025, 0.012, fret, 0, i * 0.08, 0, 0.004);
  for (const s of [-1, 1]) box(gf, 0.03, 0.42, 0.02, dark, s * 0.07, 0.48, 0.12, 0.005, [0, 0, s * 0.5]);
  // Front wall: door + louvred windows
  const f = face(g, 'front', w, d, z0);
  box(f, 0.32, 0.5, 0.03, mat(C.shutter, { map: TEX.planks() }), -0.3, fh + 0.06, 0.01, 0.01);
  const fw = at(f, 0, fh + 0.2, 0);
  louvreWindow(fw, 0.3, 0, 0.26, 0.32, C.shutter);
  for (const side of ['left', 'right'] as const) louvreWindow(at(face(g, side, w, d, z0), 0, fh + 0.2, 0), 0, 0, 0.26, 0.32, C.shutter);
  // Serambi verandah with railing and a lean-to roof
  const vz = z0 + d / 2 + 0.2;
  box(g, w * 0.9, 0.05, 0.4, mat(C.timberLight, { map: TEX.planks(), repeat: [4, 1] }), 0.05, fh - 0.05, vz, 0.01);
  for (const sx of [-1, 1]) box(g, 0.05, fh, 0.05, stiltM, sx * (w * 0.43), 0, vz + 0.17, 0.01);
  for (let i = 0; i < 9; i++) box(g, 0.02, 0.2, 0.02, dark, -w * 0.4 + 0.4 + i * 0.08, fh, vz + 0.18, 0.004);
  box(g, w * 0.55, 0.025, 0.03, dark, 0.2, fh + 0.2, vz + 0.18, 0.006);
  for (const sx of [-1, 1]) box(g, 0.04, 0.5, 0.04, dark, sx * (w * 0.43), fh, vz + 0.17, 0.008);
  box(g, w * 0.95, 0.03, 0.5, mat(o.roof, { map: TEX.zinc(), repeat: [4, 1] }), 0.05, fh + 0.52, vz + 0.02, 0.008, [0.32, 0, 0]);
  // Stairs (tangga) down to the yard
  for (let i = 0; i < 4; i++) box(g, 0.26, 0.04, 0.1, mat(C.timberLight), -0.42, fh - 0.08 - i * 0.075, vz + 0.24 + i * 0.09, 0.006);
  // Letterbox where rent is "collected"
  cyl(g, 0.02, 0.02, 0.3, dark, 0.78, 0, 0.84, 6);
  box(g, 0.14, 0.12, 0.18, mat('#d64f3a'), 0.78, 0.3, 0.84, 0.04);
  bush(g, -0.82, 0.78, 0.7, C.leaf);
  sphere(g, 0.035, mat('#e0413a'), -0.78, 0.2, 0.84, 6);
  if (c.level >= 2) {
    pottedPlant(g, 0.5, fh, vz + 0.1, 0.9, '#e0413a');
    pottedPlant(g, -0.05, fh, vz + 0.1, 0.8);
    tempayan(g, -0.75, 0.25, 0.9);
  }
  if (c.level >= 3) {
    for (const x of [-0.7, 0.6]) {
      cyl(g, 0.012, 0.014, 0.42, mat(C.bamboo), x, 0, 0.92, 5);
      put(g, rboxGeo(0.06, 0.07, 0.06, 0.02), bulb, [x, 0.46, 0.92]);
    }
    box(g, 0.5, 0.03, 0.34, mat(C.timberLight, { map: TEX.planks() }), 0.45, 0.04, 0.6, 0.008);
  }
  return g;
}

function rumahTeres(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 1.45;
  const d = 1.1;
  const z0 = -0.25;
  const wall = mat('#f3e7d0', { map: TEX.plaster(), repeat: [2, 2] });
  box(g, w + 0.1, 0.08, d + 0.5, mat(P.stone, { map: TEX.cobbles(), repeat: [3, 2] }), 0, 0, z0 + 0.2, 0.02);
  box(g, w, 0.62, d, wall, 0, 0.08, z0, 0.02);
  box(g, w + 0.06, 0.06, d + 0.06, mat(P.trim), 0, 0.7, z0, 0.01);
  box(g, w, 0.58, d, mat('#d9ecf3', { map: TEX.plaster(), repeat: [2, 2] }), 0, 0.76, z0, 0.02);
  hipRoof(at(g, 0, 0, z0), { w, d, y: 1.34, rise: 0.42, color: C.tile, map: 'tiles', overhang: 0.14 });
  const f = face(g, 'front', w, d, z0);
  // Ground floor: grille door + window; upper floor: two louvred windows and a little balcony
  box(f, 0.36, 0.5, 0.02, mat('#f1efe8'), -0.38, 0.1, 0.02, 0.005);
  for (let i = 0; i < 5; i++) box(f, 0.012, 0.48, 0.015, mat('#3b4250'), -0.52 + i * 0.07, 0.11, 0.04, 0.003);
  louvreWindow(at(f, 0.3, 0.3, 0), 0, 0, 0.36, 0.3, C.shutter);
  louvreWindow(at(f, -0.36, 0.92, 0), 0, 0, 0.3, 0.3, C.shutter);
  louvreWindow(at(f, 0.36, 0.92, 0), 0, 0, 0.3, 0.3, C.shutter);
  box(f, 0.6, 0.04, 0.16, mat(P.trim), -0.36, 0.86, 0.08, 0.01);
  for (let i = 0; i < 6; i++) box(f, 0.012, 0.16, 0.012, mat('#3b4250'), -0.62 + i * 0.1, 0.9, 0.15, 0.003);
  // Car porch with a flat canopy
  for (const sx of [-1, 1]) cyl(g, 0.025, 0.025, 0.62, mat(P.trim), sx * 0.55, 0.08, 0.72, 8);
  box(g, 1.3, 0.04, 0.56, mat(C.zincGrey, { map: TEX.zinc(), repeat: [4, 1] }), 0, 0.68, 0.5, 0.01, [0.06, 0, 0]);
  pottedPlant(g, 0.62, 0.08, 0.32, 1, '#ff7aa8');
  if (c.level >= 2) {
    for (let i = 0; i < 4; i++) bush(g, -0.6 + i * 0.4, 0.95, 0.45, i % 2 ? C.leaf : '#7cc35a');
    pottedPlant(g, -0.62, 0.08, 0.32, 1, '#ffd34d');
  }
  return g;
}

// ─── Shoplots ────────────────────────────────────────────────────────────────

interface ShoplotOpts {
  w: number;
  tone: { wall: string; trim: string; shutter: string; roof: string };
  sign: string;
  signBg?: string;
  signFg?: string;
  /** Contents of the five-foot way / shop front. */
  dress?: (front: THREE.Group, w: number) => void;
  awning?: [string, string];
}

/** Two-storey shophouse: arcaded five-foot way below, louvred windows and a parapet above. */
function shoplot(o: ShoplotOpts) {
  const g = new THREE.Group();
  const w = o.w;
  const d = 1.25;
  const z0 = -0.3;
  const h1 = 0.66;
  const h2 = 0.6;
  const recess = 0.32;
  const wall = mat(o.tone.wall, { map: TEX.plaster(), repeat: [Math.round(w * 1.5), 2] });
  const trim = mat(o.tone.trim);
  // Plinth and five-foot way floor tiles
  box(g, w + 0.06, 0.06, d + 0.08, mat(P.stoneDark), 0, 0, z0, 0.01);
  box(g, w, 0.02, recess + 0.02, mat('#e8d9bf', { map: TEX.floorTiles(), repeat: [Math.round(w * 4), 1] }), 0, 0.06, z0 + d / 2 - recess / 2, 0.005);
  // Ground floor (set back) and the upper floor (projecting over the walkway)
  box(g, w, h1, d - recess, wall, 0, 0.06, z0 - recess / 2, 0.02);
  box(g, w + 0.04, 0.07, d + 0.02, trim, 0, 0.06 + h1, z0, 0.01);
  box(g, w, h2, d, wall, 0, 0.13 + h1, z0, 0.02);
  // Parapet with a moulded cornice and a raised centre gable
  const py = 0.13 + h1 + h2;
  box(g, w + 0.06, 0.05, d + 0.06, trim, 0, py, z0, 0.01);
  box(g, w, 0.16, 0.06, wall, 0, py + 0.05, z0 + d / 2 - 0.03, 0.01);
  box(g, w * 0.4, 0.1, 0.06, wall, 0, py + 0.2, z0 + d / 2 - 0.03, 0.02);
  box(g, w * 0.44, 0.03, 0.08, trim, 0, py + 0.3, z0 + d / 2 - 0.03, 0.01);
  hipRoof(at(g, 0, 0, z0 - 0.05), { w: w - 0.1, d: d - 0.2, y: py + 0.02, rise: 0.25, color: o.tone.roof, map: 'tiles', overhang: 0.02 });
  // Arcade columns along the street edge
  const colZ = z0 + d / 2 - 0.05;
  const cols = Math.round(w / 0.75) + 1;
  for (let i = 0; i < cols; i++) {
    const x = -w / 2 + 0.06 + (i * (w - 0.12)) / (cols - 1);
    box(g, 0.1, h1, 0.1, trim, x, 0.06, colZ, 0.015);
    box(g, 0.14, 0.05, 0.14, trim, x, 0.06 + h1 - 0.05, colZ, 0.01);
  }
  // Upper storey: louvred windows
  const f = at(g, 0, 0.13 + h1 + 0.1, z0 + d / 2);
  const nWin = Math.max(2, Math.round(w / 0.55));
  for (let i = 0; i < nWin; i++) louvreWindow(f, -w / 2 + (w / nWin) * (i + 0.5), 0, 0.22, 0.34, o.tone.shutter);
  // Shop sign over the five-foot way
  signBoard(g, o.sign, 0, 0.06 + h1 - 0.24, colZ + 0.06, { w: Math.min(w - 0.3, 1.6), h: 0.16, bg: o.signBg ?? '#fffaf0', fg: o.signFg ?? '#2f4f3a', frame: o.tone.shutter });
  // Shop front: folding shutter boxes and open doorway
  const sf = at(g, 0, 0, z0 + d / 2 - recess);
  put(sf, rboxGeo(w * 0.62, h1 - 0.16, 0.02, 0.006), glass, [0, 0.06 + (h1 - 0.16) / 2 + 0.02, 0.012]);
  for (const sx of [-1, 1]) box(sf, w * 0.18, h1 - 0.1, 0.04, mat('#9aa3a8', { map: TEX.zinc(), repeat: [1, 2] }), sx * (w * 0.41), 0.06, 0.02, 0.006);
  if (o.awning) awning(g, 0, 0.06 + h1 - 0.04, colZ + 0.04, w - 0.1, o.awning[0], o.awning[1], 0.24);
  const front = at(g, 0, 0.06, z0 + d / 2 - recess / 2);
  o.dress?.(front, w);
  return g;
}

function shopTone(name: string) {
  return SHOPLOT_TONES[name] ?? SHOPLOT_TONES.cream;
}

function kopitiam(c: ArchCtx, pal?: { primary: string; secondary: string; accent: string }, sign?: string) {
  const tone = pal ? { wall: pal.secondary, trim: '#fffaf0', shutter: pal.primary, roof: C.tile } : shopTone('cream');
  const g = shoplot({
    w: 1.75,
    tone,
    sign: sign ?? c.name ?? '',
    signBg: pal?.secondary,
    signFg: pal?.primary ?? '#2f4f3a',
    awning: c.level >= 3 ? [pal?.primary ?? C.shutter, '#fffaf0'] : undefined,
    dress: (f) => {
      marbleTable(f, -0.42, 0.02);
      marbleTable(f, 0.35, 0.02);
      // Drinks counter with a big kettle
      box(f, 0.3, 0.26, 0.12, mat(C.timber, { map: TEX.planks() }), -0.7, 0, -0.08, 0.01);
      cyl(f, 0.04, 0.05, 0.08, mat('#c7c9cc', { metalness: 0.6, roughness: 0.3 }), -0.72, 0.26, -0.08, 10);
    },
  });
  // Tables spill onto the street with each upgrade
  if (c.level >= 2) {
    marbleTable(g, -0.55, 0.78);
    marbleTable(g, 0.45, 0.8);
  }
  if (c.level >= 3) {
    for (const x of [-0.85, 0.85]) cyl(g, 0.012, 0.012, 0.95, mat('#3b4250'), x, 0, 0.95, 5);
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      put(g, rboxGeo(0.06, 0.08, 0.06, 0.02), bulb, [-0.85 + t * 1.7, 0.92 - Math.sin(t * Math.PI) * 0.08, 0.95]);
    }
  }
  if (c.flags.cafe_chalkboard) {
    const h = at(g, 0.82, 0, 0.62);
    h.rotation.y = -0.4;
    box(h, 0.2, 0.3, 0.03, mat(C.timber), 0, 0, 0, 0.01, [-0.15, 0, 0]);
    box(h, 0.15, 0.22, 0.02, mat('#2f3a33'), 0, 0.04, 0.025, 0.005, [-0.15, 0, 0]);
  }
  if (c.flags.cafe_brunch) marbleTable(g, 0, 0.85);
  return g;
}

function kedaiRoti(c: ArchCtx) {
  return shoplot({
    w: 1.6,
    tone: shopTone('blush'),
    sign: c.name ?? '',
    signFg: '#a8434d',
    awning: c.level >= 2 ? ['#f4bdb5', '#fffaf0'] : undefined,
    dress: (f) => {
      box(f, 0.7, 0.3, 0.16, mat('#fffaf0'), 0, 0, -0.04, 0.01);
      put(f, rboxGeo(0.66, 0.14, 0.12, 0.01), glass, [0, 0.38, -0.04]);
      const items = c.flags.bakery_pie_sign ? ['cake', 'cupcake', 'donut', 'cookie'] : ['cupcake', 'donut', 'cookie'];
      items.forEach((n, i) => prop(f, n, 0.08, -0.25 + i * 0.17, 0.3, -0.04));
      if (c.level >= 3) {
        box(f, 0.14, 0.4, 0.14, mat(P.barn, { map: TEX.brick() }), 0.62, 0, -0.06, 0.01);
      }
    },
  });
}

function kedaiBunga(c: ArchCtx) {
  return shoplot({
    w: 1.6,
    tone: shopTone('lilac'),
    sign: c.name ?? '',
    signFg: '#6b4fa8',
    dress: (f) => {
      for (let i = 0; i < 5; i++) {
        const x = -0.5 + i * 0.25;
        cyl(f, 0.06, 0.05, 0.12, mat('#9aa3a8', { metalness: 0.4 }), x, 0, 0.02, 10);
        for (let k = 0; k < 3; k++) sphere(f, 0.04, mat(FLOWERS[(i + k) % 5]), x + (k - 1) * 0.03, 0.17 + (k % 2) * 0.03, 0.02, 6);
      }
      if (c.level >= 2) {
        const cart = at(f, 0.62, 0, 0.25);
        box(cart, 0.3, 0.12, 0.18, mat(C.timberLight, { map: TEX.planks() }), 0, 0.08, 0, 0.01);
        put(cart, new THREE.TorusGeometry(0.06, 0.012, 6, 14), mat('#3b3631'), [0.12, 0.06, 0.1]);
        for (let k = 0; k < 4; k++) sphere(cart, 0.04, mat(FLOWERS[k]), -0.1 + k * 0.07, 0.24, 0, 6);
      }
    },
  });
}

function kedaiRuncit(c: ArchCtx) {
  return shoplot({
    w: 2.6,
    tone: shopTone('butter'),
    sign: c.name ?? '',
    signFg: '#3f6fa8',
    awning: ['#3f6fa8', '#fffaf0'],
    dress: (f) => {
      for (let i = 0; i < 4; i++) {
        const x = -0.9 + i * 0.55;
        prop(f, 'crate', 0.2, x, 0, 0.02, 0.1);
        prop(f, ['banana', 'watermelon', 'apple', 'carrot'][i], 0.1, x, 0.2, 0.02);
      }
      // Hanging goods inside the doorway
      for (let i = 0; i < 6; i++) box(f, 0.06, 0.08, 0.03, mat(FLOWERS[i % 5]), -0.3 + i * 0.12, 0.42, -0.12, 0.01);
      if (c.level >= 2) {
        for (const x of [-1.15, 1.15]) {
          box(f, 0.3, 0.22, 0.2, mat(C.timberLight, { map: TEX.planks() }), x, 0, 0.35, 0.01);
          prop(f, 'apple', 0.08, x - 0.05, 0.22, 0.35);
          prop(f, 'banana', 0.08, x + 0.07, 0.22, 0.35);
        }
      }
    },
  });
}

// ─── Workshop, park, hall ────────────────────────────────────────────────────

function bengkel(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 2.5;
  const d = 1.4;
  const z0 = -0.2;
  box(g, w + 0.1, 0.06, d + 0.1, mat('#bdb6a8', { map: TEX.plaster(), repeat: [3, 2] }), 0, 0, z0, 0.01);
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) box(g, 0.08, 0.85, 0.08, mat(C.timber), (sx * (w - 0.1)) / 2, 0.06, z0 + (sz * (d - 0.1)) / 2, 0.01);
  // Back wall of planks (open front)
  box(g, w, 0.7, 0.05, mat(C.timberLight, { map: TEX.planks(), repeat: [6, 2] }), 0, 0.06, z0 - d / 2 + 0.03, 0.01);
  gableRoof(at(g, 0, 0, z0), { w, d, y: 0.91, rise: 0.4, color: C.zincGrey, wall: mat(C.timberLight, { map: TEX.planks() }), map: 'zinc', overhang: 0.14 });
  // Workbench, saw horse and rattan chairs in progress
  box(g, 0.8, 0.28, 0.3, mat(C.timber, { map: TEX.planks() }), -0.4, 0.06, z0 - 0.3, 0.01);
  for (let i = 0; i < 3; i++) box(g, 0.5, 0.035, 0.09, mat(C.timberLight), 0.55, 0.06 + i * 0.036, z0 - 0.35, 0.006);
  rattanChair(g, 0.15, 0.3, 0.3);
  rattanChair(g, -0.25, 0.4, -0.5);
  signBoard(g, c.name ?? '', 0, 0.68, z0 + d / 2 + 0.05, { w: 1.1, h: 0.15, bg: '#fffaf0', fg: '#8a5a37', frame: C.timber });
  prop(g, 'log', 0.16, -1.05, 0, 0.62, 0.1);
  prop(g, 'log', 0.16, -0.98, 0.12, 0.6, -0.2);
  if (c.level >= 2) {
    for (let i = 0; i < 4; i++) box(g, 0.08, 0.5 - i * 0.05, 0.6, mat(C.timberLight, { map: TEX.planks() }), 1.0 + i * 0.09, 0.06, 0.45, 0.006);
  }
  if (c.level >= 3) {
    // Rattan drying rack
    for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.6, mat(C.bamboo), -1.0 + sx * 0.25, 0, -0.75, 5);
    for (let i = 0; i < 3; i++) box(g, 0.55, 0.012, 0.012, mat('#c9a063'), -1.0, 0.25 + i * 0.12, -0.75, 0.003);
  }
  return g;
}

/** Wide-canopied rain tree (procedural so it reads tropical at a glance). */
export function rainTree(g: THREE.Object3D, x: number, z: number, s = 1) {
  const bark = mat('#6b5440');
  cyl(g, 0.05 * s, 0.08 * s, 0.6 * s, bark, x, 0, z, 7);
  for (const a of [0.6, 2.4, 4.2]) box(g, 0.03 * s, 0.3 * s, 0.03 * s, bark, x + Math.cos(a) * 0.1 * s, 0.45 * s, z + Math.sin(a) * 0.1 * s, 0.01, [Math.sin(a) * 0.6, 0, Math.cos(a) * 0.6]);
  const leaf = mat(C.leafDark, { roughness: 0.9 });
  const leaf2 = mat(C.leaf, { roughness: 0.9 });
  const blobs: [number, number, number, number][] = [
    [0, 0.82, 0, 0.42],
    [0.32, 0.76, 0.1, 0.3],
    [-0.3, 0.78, -0.08, 0.32],
    [0.05, 0.78, 0.3, 0.3],
    [-0.08, 0.8, -0.32, 0.3],
  ];
  blobs.forEach(([bx, by, bz, r], i) => sphere(g, r * s, i % 2 ? leaf2 : leaf, x + bx * s, by * s, z + bz * s, 10, [1.25, 0.5, 1.25]));
}

function taman(c: ArchCtx) {
  const g = new THREE.Group();
  box(g, 2.9, 0.04, 2.9, mat('#79c25a', { roughness: 1 }), 0, 0, 0, 0.02);
  const path = mat('#d9c3a0', { map: TEX.cobbles(), repeat: [2, 2] });
  put(g, new THREE.RingGeometry(0.7, 0.92, 28), path, [0, 0.045, 0], [-Math.PI / 2, 0, 0]);
  box(g, 0.26, 0.02, 1.0, path, 0, 0.04, 0.95, 0.005);
  rainTree(g, -0.95, -0.9, 1.25);
  rainTree(g, 0.98, -0.95, 1.05);
  prop(g, 'tree_palm', 1.4, 1.1, 0.04, 1.0, 0.4);
  for (const [x, z, r] of [[-0.95, 0.35, Math.PI / 2], [0.95, 0.3, -Math.PI / 2]] as const) {
    const h = at(g, x, 0.04, z);
    h.rotation.y = r;
    box(h, 0.5, 0.04, 0.16, mat(C.timberLight, { map: TEX.planks() }), 0, 0.16, 0, 0.01);
    for (const sx of [-1, 1]) box(h, 0.04, 0.16, 0.14, mat('#9aa3a8'), sx * 0.2, 0, 0, 0.01);
  }
  // Outdoor exercise bars, a kampung favourite
  for (const sx of [-1, 1]) cyl(g, 0.018, 0.018, 0.5, mat('#e9b23c'), -0.3 + sx * 0.18, 0.04, -1.15, 6);
  box(g, 0.4, 0.025, 0.025, mat('#c7c9cc', { metalness: 0.5 }), -0.3, 0.52, -1.15, 0.008);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    sphere(g, 0.05, mat(i % 2 ? '#e0413a' : '#ffd34d'), Math.cos(a) * 0.55, 0.09, Math.sin(a) * 0.55, 6);
  }
  bush(g, 0, 0, 0.9, C.leaf);
  if (c.level >= 2) pavilionShelter(at(g, 0.05, 0.04, -0.1), 0.62, 4, C.zincGreen);
  if (c.flags.park_bunting) {
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      box(g, 0.07, 0.08, 0.005, mat(FLOWERS[i % 5], { side: THREE.DoubleSide }), -1.3 + t * 2.6, 1.0 - Math.sin(t * Math.PI) * 0.15, 1.3, 0.002);
    }
    for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 1.05, mat(C.timber), sx * 1.32, 0, 1.3, 5);
  }
  return g;
}

function balaiRaya(c: ArchCtx) {
  const g = new THREE.Group();
  const w = 2.5;
  const d = 1.9;
  const z0 = -0.25;
  box(g, w + 0.16, 0.16, d + 0.16, mat('#d8cdb8', { map: TEX.plaster() }), 0, 0, z0, 0.02);
  box(g, w, 0.04, d, mat('#e8d9bf', { map: TEX.floorTiles(), repeat: [6, 4] }), 0, 0.16, z0, 0.005);
  const post = mat('#f3e7d0');
  for (let i = 0; i < 5; i++)
    for (const sz of [-1, 1]) box(g, 0.08, 0.85, 0.08, post, -w / 2 + 0.05 + (i * (w - 0.1)) / 4, 0.18, z0 + (sz * (d - 0.1)) / 2, 0.01);
  for (const sx of [-1, 1]) box(g, 0.08, 0.85, 0.08, post, (sx * (w - 0.1)) / 2, 0.18, z0, 0.01);
  // Half walls with ventilation blocks
  const half = mat('#f3e7d0', { map: TEX.plaster() });
  for (const sx of [-1, 1]) box(g, 0.05, 0.3, d, half, (sx * w) / 2, 0.18, z0, 0.01);
  box(g, w, 0.3, 0.05, half, 0, 0.18, z0 - d / 2, 0.01);
  for (const sx of [-1, 1]) box(g, w * 0.36, 0.3, 0.05, half, sx * w * 0.32, 0.18, z0 + d / 2, 0.01);
  gableRoof(at(g, 0, 0, z0), { w, d, y: 1.03, rise: 0.8, color: C.zincGreen, wall: half, ridgeAlongZ: true, map: 'zinc', overhang: 0.2 });
  // Entrance porch with its own small gable
  for (let i = 0; i < 3; i++) box(g, 0.8 - i * 0.1, 0.05, 0.12, mat('#d8cdb8'), 0, 0.16 - i * 0.055, z0 + d / 2 + 0.12 + i * 0.1, 0.01);
  signBoard(g, `Balai Raya ${c.hoodName}`, 0, 0.66, z0 + d / 2 + 0.08, { w: 1.3, h: 0.16, bg: '#fffaf0', fg: '#2f6b45', frame: C.zincGreen });
  // Badminton court lines on the floor
  const line = mat('#ffffff');
  box(g, 1.6, 0.005, 0.02, line, 0, 0.2, z0 - 0.5, 0.002);
  box(g, 1.6, 0.005, 0.02, line, 0, 0.2, z0 + 0.4, 0.002);
  box(g, 0.02, 0.005, 0.9, line, 0, 0.2, z0 - 0.05, 0.002);
  flagPole(g, 1.35, 0.95, '#f2a93b', 1.3);
  if (c.level >= 2) {
    cyl(g, 0.16, 0.16, 0.04, mat('#fffaf0'), 0, 1.45, z0 + d / 2 + 0.12, 16, [Math.PI / 2, 0, 0]);
    box(g, 0.012, 0.1, 0.01, mat('#3d3226'), 0, 1.42, z0 + d / 2 + 0.15, 0.002);
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      box(g, 0.08, 0.09, 0.005, mat(FLOWERS[i % 5], { side: THREE.DoubleSide }), -1.2 + t * 2.4, 1.08 - Math.sin(t * Math.PI) * 0.12, z0 + d / 2 + 0.22, 0.002);
    }
  }
  return g;
}

/** A pondok: open-sided rest pavilion with a pyramid roof. */
function pavilionShelter(g: THREE.Object3D, s: number, stage: number, roof: string) {
  const timber = mat(C.timber);
  if (stage >= 1) for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.07 * s, 0.95 * s, 0.07 * s, timber, sx * 0.55 * s, 0, sz * 0.55 * s, 0.01);
  if (stage >= 2) {
    box(g, 1.25 * s, 0.06 * s, 1.25 * s, mat(C.timberLight, { map: TEX.planks(), repeat: [4, 1] }), 0, 0.28 * s, 0, 0.01);
    for (let i = 0; i < 3; i++) box(g, 0.4 * s, 0.04 * s, 0.12 * s, mat(C.timberLight), 0, (0.2 - i * 0.07) * s, (0.7 + i * 0.08) * s, 0.005);
  }
  if (stage >= 3) hipRoof(at(g, 0, 0, 0), { w: 1.3 * s, d: 1.3 * s, y: 0.95 * s, rise: 0.5 * s, color: roof, map: 'zinc', overhang: 0.12 * s });
}

function pondok(c: ArchCtx) {
  const g = new THREE.Group();
  const stage = c.stage ?? 0;
  box(g, 1.8, 0.03, 1.8, mat('#d9c3a0', { map: TEX.cobbles(), repeat: [4, 4] }), 0, 0, 0, 0.02);
  if (stage === 0) {
    for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
      cyl(g, 0.015, 0.015, 0.3, mat(C.timberLight), x, 0, z, 5);
      box(g, 0.05, 0.03, 0.01, mat('#d64f3a'), x, 0.26, z, 0.003);
    }
    signBoard(g, c.text?.projectSign ?? 'Projek Pondok', 0, 0.28, 0.75, { w: 0.6, h: 0.14, bg: '#fffaf0', fg: '#2f6b45' });
    for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.28, mat(C.timber), sx * 0.25, 0, 0.73, 5);
    return g;
  }
  pavilionShelter(at(g, 0, 0.03, 0), 1, stage, C.zincRed);
  if (stage <= 2) {
    for (let i = 0; i < 3; i++) box(g, 0.3, 0.035, 0.1, mat(C.timberLight, { map: TEX.planks() }), 0.72, 0.03 + i * 0.036, -0.75, 0.008);
  }
  if (stage >= 4) {
    for (const [x, z] of [[-0.8, 0.8], [0.8, 0.8]]) pottedPlant(g, x, 0.03, z, 1.2, '#e0413a');
    put(g, rboxGeo(0.07, 0.09, 0.07, 0.02), bulb, [0, 0.9, 0]);
    const a = new THREE.Object3D();
    a.name = 'light';
    a.position.set(0, 0.86, 0);
    g.add(a);
  }
  return g;
}

function tasik() {
  const g = new THREE.Group();
  const bank = mat('#8a6a48', { roughness: 0.95 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 1.28 + Math.sin(a * 3) * 0.1;
    sphere(g, 0.12 + (i % 3) * 0.03, i % 4 ? bank : mat('#6f9f4a'), Math.cos(a) * r, 0.03, Math.sin(a) * r, 7, [1, 0.45, 1]);
  }
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.3, 36), new THREE.MeshStandardMaterial({ color: '#4fae9f', roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.035;
  water.name = 'water';
  water.userData.keep = true;
  water.receiveShadow = true;
  g.add(water);
  put(g, new THREE.CircleGeometry(1.36, 36), mat('#3d7f78'), [0, 0.01, 0], [-Math.PI / 2, 0, 0]);
  // Lotus pads and blooms
  const pad = mat('#4f9a3f', { side: THREE.DoubleSide });
  for (const [x, z, s] of [[-0.45, 0.25, 1], [-0.65, -0.1, 0.8], [0.2, -0.5, 1.1], [-0.2, -0.65, 0.7], [0.55, -0.15, 0.9]]) {
    put(g, new THREE.CircleGeometry(0.13 * s, 12, 0.4, Math.PI * 1.8), pad, [x, 0.045, z], [-Math.PI / 2, 0, x * 3]);
  }
  for (const [x, z] of [[-0.45, 0.25], [0.2, -0.5]]) {
    for (let k = 0; k < 5; k++) cone(g, 0.02, 0.06, mat('#f6a5c0'), x + Math.cos(k * 1.26) * 0.02, 0.05, z + Math.sin(k * 1.26) * 0.02, 4);
  }
  // Jetty reaching into the lake
  const deck = mat(C.timberLight, { map: TEX.planks(), repeat: [1, 4] });
  box(g, 0.32, 0.04, 1.0, deck, 0.65, 0.09, 0.55, 0.006, [0, -0.6, 0]);
  for (const [x, z] of [[0.48, 0.25], [0.66, 0.2], [0.87, 0.88], [1.05, 0.77]]) cyl(g, 0.025, 0.025, 0.14, mat(C.stilt), x, 0, z, 6);
  // A little sampan tied to the jetty
  const boat = at(g, 0.1, 0.04, 0.55);
  boat.rotation.y = 0.4;
  box(boat, 0.42, 0.06, 0.14, mat('#2f7d9b'), 0, 0, 0, 0.03);
  for (const sx of [-1, 1]) cone(boat, 0.07, 0.12, mat('#2f7d9b'), sx * 0.24, 0.0, 0, 4).rotation.z = (sx * Math.PI) / 2;
  for (let i = 0; i < 7; i++) cyl(g, 0.01, 0.012, 0.32 + (i % 3) * 0.08, mat('#5f8f3a'), -1.0 + (i % 3) * 0.06, 0.02, 0.5 + i * 0.05, 4);
  prop(g, 'frog', 0.12, -0.45, 0.05, 0.25, 0.6).userData.keep = true;
  prop(g, 'rock_small', 0.15, -1.0, 0.0, -0.6, 0, ROCK);
  anchor(g, 'fishing', 0.95, 0.12, 0.9);
  return g;
}

// ─── Templates dressed by modules ───────────────────────────────────────────

export function showroomGlass(c: ArchCtx, pal = { primary: '#2f6fb3', secondary: '#eef3f7', accent: '#e9b23c' }, sign?: string) {
  const g = new THREE.Group();
  const w = 2.6;
  const d = 0.85;
  const z0 = -0.52;
  const h = 0.9;
  // Glass sales gallery at the back; the display forecourt in front stays open to the sky.
  box(g, w + 0.12, 0.05, 2.0, mat(P.stoneDark), 0, 0, 0, 0.01);
  box(g, w, 0.02, d, mat('#f1efe8', { map: TEX.floorTiles(), repeat: [8, 3] }), 0, 0.05, z0, 0.003);
  const glassWall = new THREE.MeshStandardMaterial({ color: '#cfe8f2', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35 });
  put(g, rboxGeo(w, h, 0.02, 0.004), glassWall, [0, 0.07 + h / 2, z0 + d / 2]);
  for (const sx of [-1, 1]) put(g, rboxGeo(0.02, h, d, 0.004), glassWall, [(sx * w) / 2, 0.07 + h / 2, z0]);
  box(g, w, h, 0.05, mat(pal.secondary, { map: TEX.plaster() }), 0, 0.07, z0 - d / 2, 0.01);
  const mull = mat(pal.primary, { metalness: 0.3, roughness: 0.4 });
  for (let i = 0; i <= 6; i++) box(g, 0.03, h, 0.03, mull, -w / 2 + (i * w) / 6, 0.07, z0 + d / 2, 0.005);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, h, 0.05, mull, (sx * w) / 2, 0.07, z0 + (sz * d) / 2, 0.008);
  // Desk and a waiting sofa inside
  box(g, 0.4, 0.22, 0.18, mat('#fffaf0'), -0.6, 0.07, z0 - 0.1, 0.02);
  box(g, 0.5, 0.14, 0.18, mat(pal.primary), 0.6, 0.07, z0 - 0.15, 0.04);
  box(g, w + 0.2, 0.08, d + 0.2, mat('#fffaf0'), 0, 0.07 + h, z0, 0.02);
  box(g, w + 0.22, 0.17, 0.04, mat(pal.primary), 0, 0.1 + h, z0 + d / 2 + 0.1, 0.01);
  signBoard(g, sign ?? c.name ?? '', 0, 0.1 + h, z0 + d / 2 + 0.13, { w: 1.4, h: 0.13, bg: pal.primary, fg: '#ffffff', frame: pal.primary });
  // Display forecourt: three turntable bays (cars are drawn live from the player's arrangement)
  box(g, w, 0.02, 1.0, mat('#e3e0d8', { map: TEX.floorTiles(), repeat: [10, 4] }), 0, 0.05, 0.42, 0.003);
  for (let i = 0; i < 3; i++) {
    const x = -0.85 + i * 0.85;
    cyl(g, 0.34, 0.36, 0.04, mat(pal.secondary, { roughness: 0.35 }), x, 0.05, 0.42, 28);
    cyl(g, 0.36, 0.36, 0.012, mat(pal.accent), x, 0.05, 0.42, 28);
    anchor(g, `bay${i}`, x, 0.1, 0.42);
  }
  for (const x of [-1.25, 1.25]) {
    put(g, rboxGeo(0.12, 0.24, 0.12, 0.03), mat('#3b4250'), [x, 0.17, 0.92]);
    sphere(g, 0.07, mat(C.leaf), x, 0.33, 0.92, 8);
  }
  flagPole(g, -1.25, -0.02, pal.accent, 1.1);
  if (c.level >= 2) {
    flagPole(g, 1.25, -0.02, pal.primary, 1.1);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      box(g, 0.07, 0.08, 0.005, mat(i % 2 ? pal.primary : pal.accent, { side: THREE.DoubleSide }), -1.25 + t * 2.5, 1.0 - Math.sin(t * Math.PI) * 0.14, -0.02, 0.002);
    }
  }
  return g;
}

function learningHouse(c: ArchCtx, pal = { primary: '#8a6fd1', secondary: '#fbf3e4', accent: '#f6c343' }, sign?: string) {
  const g = new THREE.Group();
  const w = 1.5;
  const d = 1.15;
  const z0 = -0.25;
  const wall = mat(pal.secondary, { map: TEX.plaster(), repeat: [2, 2] });
  box(g, w + 0.1, 0.1, d + 0.1, mat(P.stoneDark), 0, 0, z0, 0.01);
  box(g, w, 0.7, d, wall, 0, 0.1, z0, 0.02);
  hipRoof(at(g, 0, 0, z0), { w, d, y: 0.8, rise: 0.45, color: C.tile, map: 'tiles', overhang: 0.16 });
  const f = face(g, 'front', w, d, z0);
  // Big classroom windows with a bookshelf behind the glass
  for (const x of [-0.42, 0.42]) {
    box(f, 0.44, 0.38, 0.03, mat(pal.primary), x, 0.28, 0, 0.01);
    put(f, rboxGeo(0.4, 0.34, 0.02, 0.005), glass, [x, 0.47, 0.02]);
    for (let k = 0; k < 4; k++) box(f, 0.07, 0.1, 0.02, mat(FLOWERS[(k + (x > 0 ? 2 : 0)) % 5]), x - 0.12 + k * 0.08, 0.3, -0.02, 0.004);
  }
  box(f, 0.26, 0.52, 0.03, mat(pal.primary, { map: TEX.planks() }), 0, 0.1, 0.01, 0.01);
  signBoard(g, sign ?? c.name ?? '', 0, 0.78, z0 + d / 2 + 0.06, { w: 1.0, h: 0.15, bg: '#fffaf0', fg: pal.primary, frame: pal.primary });
  // Covered walkway to the gate
  for (const sx of [-1, 1]) cyl(g, 0.02, 0.02, 0.55, mat(P.trim), sx * 0.22, 0.1, 0.75, 6);
  box(g, 0.56, 0.03, 0.5, mat(C.zincGrey, { map: TEX.zinc() }), 0, 0.64, 0.55, 0.008, [0.08, 0, 0]);
  bicycle(g, 0.62, 0.72, pal.accent, 0.3);
  flagPole(g, -0.75, 0.8, pal.accent, 1.0);
  pottedPlant(g, 0.3, 0.1, 0.42, 0.9, '#ffd34d');
  if (c.level >= 2) {
    rainTree(g, -0.78, 0.25, 0.75);
    box(g, 0.4, 0.04, 0.14, mat(C.timberLight, { map: TEX.planks() }), -0.45, 0.16, 0.7, 0.008);
  }
  return g;
}

export function communityGarden(c: ArchCtx, pal = { primary: '#4f9a52', secondary: '#f3e6c8', accent: '#e05a3a' }, sign?: string) {
  const g = new THREE.Group();
  box(g, 1.9, 0.03, 1.9, mat('#8a6a48', { roughness: 1 }), 0, 0, 0, 0.01);
  const plank = mat(C.timberLight, { map: TEX.planks(), repeat: [2, 1] });
  const soil = mat('#5e4027', { roughness: 1 });
  // Four raised plots (2 × 2); crops are drawn live from the garden's state
  for (let i = 0; i < 4; i++) {
    const x = (i % 2 ? 1 : -1) * 0.42;
    const z = (i < 2 ? -1 : 1) * 0.38 - 0.08;
    box(g, 0.66, 0.1, 0.56, plank, x, 0.03, z, 0.01);
    box(g, 0.6, 0.04, 0.5, soil, x, 0.1, z, 0.006);
    anchor(g, `plot${i}`, x, 0.14, z);
  }
  // Bamboo fence, water tank, trellis and the garden sign
  const bamboo = mat(C.bamboo);
  for (let i = 0; i < 12; i++) cyl(g, 0.012, 0.012, 0.28, bamboo, -0.92 + i * 0.167, 0, -0.9, 5);
  box(g, 1.86, 0.02, 0.02, bamboo, 0, 0.2, -0.9, 0.004);
  cyl(g, 0.13, 0.13, 0.36, mat('#2f6fb3'), 0.82, 0.03, -0.72, 14);
  cyl(g, 0.135, 0.135, 0.03, mat('#245a92'), 0.82, 0.39, -0.72, 14);
  for (const sx of [-1, 1]) cyl(g, 0.012, 0.012, 0.6, bamboo, -0.82 + sx * 0.12, 0.03, -0.7, 5);
  for (let i = 0; i < 6; i++) sphere(g, 0.05, mat(i % 2 ? C.leaf : C.leafDark), -0.82 + ((i % 3) - 1) * 0.08, 0.3 + Math.floor(i / 3) * 0.18, -0.7, 6);
  signBoard(g, sign ?? c.name ?? '', 0, 0.22, 0.86, { w: 0.9, h: 0.14, bg: pal.secondary, fg: pal.primary, frame: C.timber });
  for (const sx of [-1, 1]) cyl(g, 0.015, 0.015, 0.24, mat(C.timber), sx * 0.4, 0, 0.84, 5);
  if (c.level >= 2) {
    // Shade net over the beds
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.012, 0.012, 0.7, mat('#9aa3a8'), sx * 0.85, 0.03, sz * 0.7 - 0.08, 5);
    put(g, rboxGeo(1.7, 0.01, 1.4, 0.003), new THREE.MeshStandardMaterial({ color: '#2f5a3a', transparent: true, opacity: 0.35, roughness: 1 }), [0, 0.74, -0.08]);
  }
  if (c.level >= 3) tempayan(g, -0.82, 0.72, 0.8);
  return g;
}

/** Hoarding around a building whose content is temporarily unavailable. */
export function dormant(w: number, d: number, label: string) {
  const g = new THREE.Group();
  const ply = mat('#d8c7a4', { map: TEX.planks(), repeat: [3, 1] });
  box(g, w - 0.1, 0.04, d - 0.1, mat(P.stoneDark), 0, 0, 0, 0.01);
  box(g, w - 0.16, 0.5, 0.04, ply, 0, 0.04, d / 2 - 0.1, 0.01);
  box(g, w - 0.16, 0.5, 0.04, ply, 0, 0.04, -d / 2 + 0.1, 0.01);
  for (const sx of [-1, 1]) box(g, 0.04, 0.5, d - 0.2, ply, sx * (w / 2 - 0.1), 0.04, 0, 0.01);
  signBoard(g, label, 0, 0.18, d / 2 - 0.07, { w: Math.min(w - 0.4, 1.0), h: 0.16, bg: '#fffaf0', fg: '#7a6a58' });
  return g;
}

// ─── Tropical planting & small decor ────────────────────────────────────────

function bananaPlant(g: THREE.Object3D, x: number, z: number, s = 1) {
  cyl(g, 0.04 * s, 0.06 * s, 0.45 * s, mat('#7f9a4a'), x, 0, z, 7);
  const leaf = mat('#5aa23e', { side: THREE.DoubleSide, roughness: 0.85 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const h = at(g, x, 0.42 * s, z);
    h.rotation.y = a;
    box(h, 0.08 * s, 0.01, 0.42 * s, leaf, 0, 0, 0.2 * s, 0.003, [-0.5 - (i % 2) * 0.25, 0, 0]);
  }
}

export function tropicalDecoration(kind: string): THREE.Group | null {
  const g = new THREE.Group();
  switch (kind) {
    case 'tree_round':
      rainTree(g, 0, 0, 1.15);
      return g;
    case 'tree_pine':
      prop(g, 'tree_palm', 1.55, 0, 0, 0, Math.random() * 6);
      return g;
    case 'tree_autumn':
      // Bougainvillea on a small frame
      for (const sx of [-1, 1]) cyl(g, 0.012, 0.012, 0.6, mat(C.timber), sx * 0.2, 0, 0, 5);
      for (let i = 0; i < 14; i++) sphere(g, 0.09 + (i % 3) * 0.02, mat(i % 3 ? '#e0569a' : '#c93f86'), Math.sin(i * 2.1) * 0.25, 0.25 + (i % 5) * 0.09, Math.cos(i * 1.7) * 0.15, 7);
      bush(g, 0, 0, 0.8, C.leaf);
      return g;
    case 'bush':
      bush(g, 0, 0, 1.3, C.leaf);
      for (let i = 0; i < 6; i++) sphere(g, 0.045, mat('#e0413a'), Math.cos(i) * 0.16, 0.2 + (i % 2) * 0.08, Math.sin(i * 1.3) * 0.14, 6);
      return g;
    case 'flower_bed': {
      box(g, 0.82, 0.08, 0.82, mat(C.laterite, { map: TEX.brick(), repeat: [3, 1] }), 0, 0, 0, 0.02);
      box(g, 0.74, 0.04, 0.74, mat('#6b4528', { roughness: 1 }), 0, 0.06, 0, 0.01);
      const orchid = ['#b05cc8', '#ffffff', '#f6a5c0', '#ffb347', '#ffd34d'];
      for (let i = 0; i < 9; i++) prop(g, 'flower_red', 0.24, -0.24 + (i % 3) * 0.24, 0.08, -0.24 + Math.floor(i / 3) * 0.24, i, { colorRed: orchid[(i * 2) % 5] });
      return g;
    }
    case 'fence': {
      const bamboo = mat(C.bamboo);
      for (let i = 0; i < 7; i++) cyl(g, 0.018, 0.018, 0.34 + (i % 2) * 0.04, bamboo, -0.42 + i * 0.14, 0, 0, 6);
      for (const y of [0.1, 0.26]) box(g, 0.92, 0.025, 0.025, mat('#a8913f'), 0, y, 0.02, 0.006);
      return g;
    }
    case 'planter':
      for (let i = 0; i < 3; i++) {
        const x = -0.22 + i * 0.22;
        cyl(g, 0.09, 0.07, 0.14, mat(C.clay), x, 0, 0, 10);
        if (i === 0) for (let k = 0; k < 6; k++) cone(g, 0.012, 0.3, mat('#9fcf5a'), x + Math.cos(k) * 0.03, 0.12, Math.sin(k) * 0.03, 4);
        else bush(g, x, 0, 0.5, i === 1 ? '#3f9a4a' : C.leaf);
        if (i > 0) g.children.slice(-3).forEach((m) => (m.position.y += 0.12));
        if (i === 2) for (let k = 0; k < 4; k++) sphere(g, 0.02, mat('#d8432f'), x + Math.cos(k * 1.6) * 0.07, 0.24, Math.sin(k * 1.6) * 0.07, 5);
      }
      return g;
    case 'mushroom':
      bananaPlant(g, 0, 0, 1.2);
      return g;
    case 'barrels':
      tempayan(g, -0.12, 0, 1.1);
      tempayan(g, 0.18, 0.1, 0.8);
      return g;
    case 'crate':
      prop(g, 'crate', 0.28, 0, 0, 0, 0.3);
      prop(g, 'banana', 0.1, -0.05, 0.28, 0);
      prop(g, 'watermelon', 0.1, 0.08, 0.28, 0.04);
      return g;
    case 'statue': {
      // Village marker stone (no figurative statue)
      const stone = mat('#b8b0a2', { map: TEX.cobbles() });
      box(g, 0.56, 0.08, 0.4, mat(P.stoneDark), 0, 0, 0, 0.02);
      box(g, 0.42, 0.55, 0.16, stone, 0, 0.08, 0, 0.05);
      box(g, 0.28, 0.18, 0.02, mat('#c9a14a', { metalness: 0.5, roughness: 0.35 }), 0, 0.32, 0.09, 0.01);
      bush(g, -0.3, 0.12, 0.45, C.leaf);
      bush(g, 0.3, 0.12, 0.45, C.leaf);
      return g;
    }
    case 'lamp':
      lampPost(g, 0, 0);
      return g;
    default:
      return null;
  }
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export function malaysianArchetype(arch: string, c: ArchCtx): THREE.Group | null {
  const mod = c.module;
  switch (arch) {
    case 'my:rumah_kampung':
      return rumahKampung(c);
    case 'my:rumah_papan':
      return rumahKampung(c, { wall: '#9fc7d6', roof: C.zincGrey, w: 1.2, d: 0.95, stilt: 0.24 });
    case 'my:rumah_teres':
      return rumahTeres(c);
    case 'my:shoplot':
      return kopitiam(c);
    case 'my:kedai_roti':
      return kedaiRoti(c);
    case 'my:kedai_bunga':
      return kedaiBunga(c);
    case 'my:kedai_runcit':
      return kedaiRuncit(c);
    case 'my:bengkel':
      return bengkel(c);
    case 'my:taman':
      return taman(c);
    case 'my:balai_raya':
      return balaiRaya(c);
    case 'my:papan_kenyataan': {
      const g = new THREE.Group();
      for (const sx of [-1, 1]) cyl(g, 0.03, 0.035, 0.85, mat(C.timber), sx * 0.3, 0, 0, 6);
      box(g, 0.66, 0.42, 0.05, mat('#7a9a6a'), 0, 0.32, 0, 0.02);
      const notes = ['#fffaf0', '#fff1b8', '#ffd9e0', '#d9f1ff', '#e3f7d4'];
      for (let i = 0; i < 5; i++) box(g, 0.14, 0.13, 0.01, mat(notes[i]), -0.22 + (i % 3) * 0.22, 0.38 + Math.floor(i / 3) * 0.17, 0.03, 0.004, [0, 0, (i - 2) * 0.08]);
      gableRoof(g, { w: 0.78, d: 0.18, y: 0.8, rise: 0.14, color: C.zincRed, wall: mat(C.timber), overhang: 0.05, map: 'zinc' });
      return g;
    }
    case 'my:gerbang': {
      const g = new THREE.Group();
      const pillar = mat('#fffaf0', { map: TEX.plaster() });
      for (const sx of [-1, 1]) {
        box(g, 0.18, 0.95, 0.18, pillar, sx * 0.72, 0, 0, 0.02);
        box(g, 0.24, 0.06, 0.24, mat(C.tile, { map: TEX.tiles() }), sx * 0.72, 0.95, 0, 0.01);
        cone(g, 0.12, 0.14, mat(C.tile), sx * 0.72, 1.01, 0, 4);
      }
      signBoard(g, `Selamat Datang ke ${c.hoodName}`, 0, 0.62, 0.02, { w: 1.3, h: 0.22, bg: '#fffaf0', fg: '#2f6b45', frame: '#2f6b45' });
      for (let i = 0; i < 7; i++) bush(g, -0.6 + i * 0.2, 0.18, 0.4, i % 2 ? C.leaf : '#6cc04a');
      for (let i = 0; i < 4; i++) sphere(g, 0.04, mat('#e0413a'), -0.45 + i * 0.3, 0.14, 0.26, 6);
      return g;
    }
    case 'my:tasik':
      return tasik();
    case 'my:pondok':
      return pondok(c);
    case 'my:showroom':
    case 'showroom':
      return showroomGlass(c, mod?.palette, mod?.sign);
    case 'my:pusat_belajar':
    case 'learning_centre':
      return learningHouse(c, mod?.palette, mod?.sign);
    case 'my:kebun':
      return communityGarden(c, mod?.palette, mod?.sign);
    // Module prefabs
    case 'prefab:kopitiam':
    case 'prefab:shoplot':
    case 'prefab:hawker_stall':
    case 'prefab:cafe_cottage':
      return kopitiam(c, mod?.palette, mod?.sign);
    case 'prefab:showroom_glass':
      return showroomGlass(c, mod?.palette, mod?.sign);
    case 'prefab:learning_house':
      return learningHouse(c, mod?.palette, mod?.sign);
    case 'prefab:community_garden':
      return communityGarden(c, mod?.palette, mod?.sign);
  }
  return null;
}

/** Shade helper re-exported for overlays (paint swatches). */
export { shadeHex };

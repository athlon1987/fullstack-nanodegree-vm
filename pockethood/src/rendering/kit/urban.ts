// Modern Klang Valley architecture kit (original, parametric): terrace houses and semi-Ds in a
// gated neighbourhood, a condominium, sleek shoplots (kopitiam, dessert café, florist, mamak,
// tuition centre, mini mart, co-working), a makerspace, an EV showroom, a lake park with a
// boardwalk, a neighbourhood park with a jogging track, a community centre, a fountain plaza,
// and city landmarks (lifestyle mall, primary school, shoplot row, fuel & EV station).
// Clean whites, warm timber, glass and bright accent colours. Nothing depicts a real business,
// brand, landmark or place of worship; signs show the game's own fictional names.
import * as THREE from 'three';
import { FLOWERS, prop, type ArchCtx } from './common';
import { bulb, glass, mat, TEX } from './materials';
import { bench, box, bush, cone, cyl, gableRoof, put, rboxGeo, signBoard, sphere } from './parts';
import { communityGarden, rainTree, showroomGlass } from './malaysia';

export const U = {
  white: '#f8f7f2',
  warm: '#fbf3e6',
  concrete: '#dcd8cf',
  paving: '#eee8dc',
  asphalt: '#4d535c',
  kerb: '#cfcac0',
  alu: '#cfd6dd',
  charcoal: '#3a4049',
  timber: '#c48a57',
  timberDark: '#8f5d38',
  roof: '#75818f',
  roofWarm: '#b0614a',
  leaf: '#4caf50',
  leafDark: '#2f8a3e',
  lawn: '#72cf55',
  teal: '#22b3a6',
  coral: '#ff7b67',
  sky: '#4fb0f0',
  mint: '#a6e8cf',
  butter: '#ffd166',
  lilac: '#c9b5f5',
  pink: '#ff9ec4',
  navy: '#2e4a7d',
};

const at = (g: THREE.Object3D, x: number, y: number, z: number, ry = 0) => {
  const h = new THREE.Group();
  h.position.set(x, y, z);
  h.rotation.y = ry;
  g.add(h);
  return h;
};


const render = (c = U.white) => mat(c, { map: TEX.panels(), repeat: [2, 2], roughness: 0.7 });
const metal = (c = U.alu) => mat(c, { metalness: 0.55, roughness: 0.35 });

/** Pavement plate the building sits on (concrete pavers with a kerb). */
function plate(g: THREE.Object3D, w: number, d: number, color = U.paving) {
  box(g, w - 0.04, 0.05, d - 0.04, mat(color, { map: TEX.paving(), repeat: [w * 2, d * 2], roughness: 0.9 }), 0, 0, 0, 0.015);
}

/** A run of glazing with slim aluminium mullions, on a +Z-facing plane at z. */
function glazing(g: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, panes = 3, frame = U.charcoal) {
  put(g, rboxGeo(w, h, 0.03, 0.004), glass, [x, y + h / 2, z]);
  const fm = metal(frame);
  for (let i = 0; i <= panes; i++) box(g, 0.022, h, 0.04, fm, x - w / 2 + (i * w) / panes, y, z + 0.005, 0.003);
  box(g, w, 0.025, 0.045, fm, x, y, z + 0.005, 0.003);
  box(g, w, 0.025, 0.045, fm, x, y + h - 0.025, z + 0.005, 0.003);
}

/** Glass balustrade balcony slab on a +Z facade. */
function balcony(g: THREE.Object3D, x: number, y: number, z: number, w: number, depth = 0.16) {
  box(g, w, 0.035, depth, render(U.white), x, y, z + depth / 2, 0.008);
  const rail = new THREE.MeshStandardMaterial({ color: '#cfe8f3', transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1 });
  put(g, rboxGeo(w, 0.12, 0.012, 0.003), rail, [x, y + 0.095, z + depth - 0.006]);
  box(g, w, 0.012, 0.02, metal(), x, y + 0.155, z + depth - 0.006, 0.003);
}

/** Vertical sunshade fins across a facade. */
function fins(g: THREE.Object3D, x0: number, x1: number, y: number, h: number, z: number, n: number, color = U.timber) {
  const m = mat(color, { roughness: 0.6 });
  for (let i = 0; i < n; i++) box(g, 0.03, h, 0.08, m, x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y, z, 0.006);
}

/** Planter strip with shrubs and flowers. */
function planterStrip(g: THREE.Object3D, x: number, z: number, w: number, y = 0.05) {
  box(g, w, 0.12, 0.14, render(U.concrete), x, y, z, 0.02);
  for (let i = 0; i < Math.max(1, Math.round(w / 0.16)); i++) {
    const px = x - w / 2 + 0.08 + i * 0.16;
    sphere(g, 0.065, mat(i % 2 ? U.leaf : U.leafDark, { roughness: 0.9 }), px, y + 0.16, z, 8);
    if (i % 2 === 0) sphere(g, 0.025, mat(FLOWERS[i % 5]), px + 0.03, y + 0.21, z + 0.04, 6);
  }
}

/** Painted parking bays on a strip of asphalt in front of a building. */
function parking(g: THREE.Object3D, x: number, z: number, w: number, bays: number, cars: string[] = []) {
  box(g, w, 0.02, 0.5, mat(U.asphalt, { map: TEX.asphalt(), repeat: [w, 1] }), x, 0.04, z, 0.004);
  const line = mat('#ffffff');
  for (let i = 0; i <= bays; i++) box(g, 0.015, 0.006, 0.42, line, x - w / 2 + (i * w) / bays, 0.06, z - 0.02, 0.002);
  cars.forEach((m, i) => m && prop(g, m, 0.22, x - w / 2 + (w / bays) * (i + 0.5), 0.06, z, Math.PI / 2));
}

/** A slim modern street lamp. */
export function ledLamp(g: THREE.Object3D, x: number, z: number, h = 0.95, ry = 0) {
  const pole = metal(U.charcoal);
  cyl(g, 0.018, 0.024, h, pole, x, 0, z, 8);
  const arm = at(g, x, h, z, ry);
  box(arm, 0.04, 0.025, 0.2, pole, 0, -0.01, 0.09, 0.006);
  put(arm, rboxGeo(0.07, 0.02, 0.1, 0.008), bulb, [0, -0.02, 0.17]);
  const a = new THREE.Object3D();
  a.position.set(x, h - 0.03, z);
  a.name = 'light';
  g.add(a);
}

function sedanOr(g: THREE.Object3D, model: string, x: number, z: number, ry: number) {
  prop(g, model, 0.22, x, 0.06, z, ry);
}

// ─── Homes ───────────────────────────────────────────────────────────────────

/** Double-storey terrace house: car porch with a car, sliding gate, balcony, hip roof. */
function terrace(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  const wall = render(U.white);
  const accent = [U.teal, U.coral, U.sky][Math.abs(c.hoodName.length) % 3];
  // Party walls hint at neighbours on both sides (it's a terrace).
  for (const sx of [-1, 1]) box(g, 0.04, 0.95, 1.3, render(U.concrete), sx * 0.96, 0.05, -0.28, 0.006);
  // Ground floor: living room (right) behind glass, porch (left) under the upper floor.
  box(g, 0.95, 0.5, 1.15, wall, 0.42, 0.05, -0.3, 0.02);
  glazing(g, 0.42, 0.08, 0.28, 0.8, 0.38, 3);
  // Upper floor overhangs the porch.
  box(g, 1.86, 0.48, 1.25, wall, 0, 0.55, -0.28, 0.02);
  box(g, 1.9, 0.04, 1.3, render(U.concrete), 0, 0.53, -0.27, 0.008);
  glazing(g, -0.4, 0.62, 0.35, 0.7, 0.32, 2);
  glazing(g, 0.48, 0.62, 0.35, 0.5, 0.32, 2);
  balcony(g, -0.4, 0.58, 0.36, 0.78);
  box(g, 0.04, 0.48, 0.02, mat(accent), 0.09, 0.55, 0.37, 0.004);
  // Porch columns and a parked car.
  for (const x of [-0.92, 0.0]) box(g, 0.06, 0.48, 0.06, wall, x, 0.05, 0.3, 0.01);
  sedanOr(g, c.level >= 2 ? 'suv' : 'hatchback_sports', -0.45, 0.2, 0);
  // Low hip roof in dark grey tiles.
  const roof = mat(U.roof, { map: TEX.tiles(), repeat: [3, 2] });
  const r = put(g, new THREE.ConeGeometry(1.35, 0.42, 4, 1), roof, [0, 1.24, -0.28], [0, Math.PI / 4, 0], [1.02, 1, 0.68]);
  r.castShadow = true;
  // Front fence and sliding gate.
  box(g, 1.9, 0.12, 0.05, render(U.white), 0, 0.05, 0.93, 0.01);
  const rail = metal(U.charcoal);
  for (let i = 0; i < 13; i++) box(g, 0.012, 0.22, 0.012, rail, -0.92 + i * 0.077, 0.17, 0.93, 0.002);
  box(g, 0.95, 0.02, 0.02, rail, -0.45, 0.38, 0.93, 0.003);
  // Letterbox and a garden strip.
  box(g, 0.1, 0.12, 0.06, mat(accent), 0.75, 0.3, 0.95, 0.01);
  planterStrip(g, 0.45, 0.72, 0.8);
  if (c.level >= 2) for (const x of [-0.85, 0.85]) cyl(g, 0.07, 0.05, 0.14, mat(U.concrete), x, 0.05, 0.7, 10), bush(g, x, 0.7, 0.55, U.leaf);
  if (c.level >= 3) {
    // Solar panels on the roof and garden lights.
    for (let i = 0; i < 3; i++) box(g, 0.32, 0.02, 0.22, mat('#2c4a7a', { metalness: 0.5, roughness: 0.2 }), -0.45 + i * 0.4, 1.2, 0.02, 0.004, [-0.45, 0, 0]);
    ledLamp(g, 0.92, 0.75, 0.45);
  }
  return g;
}

/** Semi-detached home: wider garden, pitched roof, a feature timber wall. */
function semid(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  box(g, 1.9, 0.03, 0.8, mat(U.lawn, { roughness: 1 }), 0, 0.05, 0.5, 0.01);
  const wall = render(U.warm);
  box(g, 1.3, 0.55, 1.0, wall, -0.25, 0.06, -0.42, 0.02);
  box(g, 1.3, 0.5, 1.0, wall, -0.25, 0.61, -0.42, 0.02);
  box(g, 0.5, 1.06, 0.06, mat(U.timber, { map: TEX.planks(), repeat: [1, 4] }), 0.12, 0.06, 0.1, 0.008);
  glazing(g, -0.45, 0.1, 0.09, 0.6, 0.4, 3);
  glazing(g, -0.45, 0.68, 0.09, 0.6, 0.32, 2);
  balcony(g, -0.45, 0.62, 0.09, 0.66);
  gableRoof(at(g, -0.25, 0, -0.42), { w: 1.3, d: 1.0, y: 1.11, rise: 0.4, color: U.roofWarm, wall, map: 'tiles', overhang: 0.1 });
  // Carport with a car
  box(g, 0.7, 0.03, 0.75, mat(U.charcoal), 0.6, 0.62, 0.0, 0.006);
  for (const z of [-0.3, 0.32]) cyl(g, 0.02, 0.02, 0.58, metal(U.charcoal), 0.92, 0.05, z, 6);
  sedanOr(g, 'sedan', 0.6, 0.05, 0);
  // Garden: a frangipani-ish tree and a bench
  rainTree(g, -0.75, 0.6, 0.55);
  if (c.level >= 2) bench(g, -0.25, 0.75, Math.PI, 0.45);
  box(g, 1.9, 0.1, 0.05, render(U.white), 0, 0.05, 0.94, 0.01);
  return g;
}

/** A slender condominium tower on a landscaped podium; rooftop pool at level 2. */
function condo(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  const floors = 9;
  const fh = 0.27;
  const wall = render(U.white);
  const accent = mat(U.sky, { roughness: 0.5 });
  box(g, 1.7, 0.32, 1.6, render(U.concrete), 0, 0.05, -0.1, 0.02); // podium
  glazing(g, 0, 0.08, 0.71, 1.2, 0.24, 6);
  box(g, 0.8, 0.03, 0.3, metal(U.charcoal), 0, 0.36, 0.82, 0.006); // lobby canopy
  for (let f = 0; f < floors; f++) {
    const y = 0.37 + f * fh;
    box(g, 1.2, fh - 0.02, 1.05, wall, 0, y, -0.2, 0.01);
    glazing(g, 0, y + 0.03, 0.33, 1.1, fh - 0.08, 4);
    balcony(g, f % 2 ? 0.3 : -0.3, y, 0.33, 0.5, 0.14);
    box(g, 0.05, fh - 0.02, 0.05, accent, 0.62, y, 0.33, 0.006);
  }
  const top = 0.37 + floors * fh;
  box(g, 1.24, 0.08, 1.09, render(U.concrete), 0, top, -0.2, 0.01);
  if (c.level >= 2) {
    box(g, 0.7, 0.05, 0.4, mat('#4fc3f7', { roughness: 0.1, metalness: 0.2 }), 0, top + 0.08, -0.05, 0.01);
    for (const x of [-0.5, 0.5]) bush(g, x, -0.5, 0.6, U.leaf), (g.children.slice(-3).forEach((m) => (m.position.y += top + 0.08)));
  }
  // Landscaping
  planterStrip(g, -0.55, 0.85, 0.6);
  planterStrip(g, 0.55, 0.85, 0.6);
  rainTree(g, -0.85, 0.55, 0.5);
  return g;
}

// ─── Shoplots ────────────────────────────────────────────────────────────────

interface UnitOpts {
  w: number;
  floors: number;
  wall: string;
  accent: string;
  sign: string;
  signBg?: string;
  signFg?: string;
  /** Ground-floor interior and frontage, drawn in the unit's local frame (front at z ≈ 0.55). */
  dress?: (g: THREE.Group) => void;
  canopy?: boolean;
  /** Awning colour over the five-foot way (defaults to the accent). */
  awning?: string;
}

/** A modern shoplot unit: glass shopfront, a sign band, a covered walkway and upper floors with fins. */
function shopUnit(o: UnitOpts): THREE.Group {
  const g = new THREE.Group();
  const d = 1.25;
  const z0 = -0.3;
  const front = z0 + d / 2;
  const wall = render(o.wall);
  box(g, o.w, 0.55, d, wall, 0, 0.05, z0, 0.02);
  // Shopfront glazing (doors in the middle)
  glazing(g, 0, 0.08, front + 0.01, o.w - 0.2, 0.42, 4);
  // Sign band, above the walkway awning so it reads from the street (and the camera)
  box(g, o.w, 0.16, 0.06, mat(o.accent), 0, 0.55, front + 0.03, 0.01);
  signBoard(g, o.sign, 0, 0.565, front + 0.07, { w: Math.min(o.w - 0.2, 1.5), h: 0.12, bg: o.signBg ?? '#ffffff', fg: o.signFg ?? o.accent });
  // Upper floors
  for (let f = 1; f < o.floors; f++) {
    const y = 0.05 + f * 0.5;
    box(g, o.w, 0.5, d, wall, 0, y + 0.05, z0, 0.02);
    glazing(g, 0, y + 0.14, front + 0.01, o.w - 0.3, 0.32, 3);
    fins(g, -o.w / 2 + 0.12, o.w / 2 - 0.12, y + 0.17, 0.33, front + 0.06, Math.round(o.w / 0.18), U.timber);
  }
  const top = 0.1 + o.floors * 0.5;
  box(g, o.w + 0.04, 0.06, d + 0.04, render(U.concrete), 0, top, z0, 0.01);
  // Painted corner pilasters give each unit its own colour from across the street
  for (const sx of [-1, 1]) box(g, 0.07, top - 0.05, 0.05, mat(o.accent), sx * (o.w / 2 - 0.035), 0.05, front + 0.02, 0.01);
  // Covered walkway (five-foot way): a bright awning on slim columns, below the sign band
  if (o.canopy !== false) {
    box(g, o.w, 0.035, 0.4, mat(o.awning ?? o.accent, { roughness: 0.6 }), 0, 0.5, front + 0.21, 0.006);
    box(g, o.w, 0.05, 0.012, mat('#ffffff'), 0, 0.485, front + 0.41, 0.003);
    for (const sx of [-1, 1]) cyl(g, 0.018, 0.018, 0.45, metal(U.charcoal), sx * (o.w / 2 - 0.05), 0.05, front + 0.38, 6);
  }
  o.dress?.(g);
  return g;
}

function shoplotCafe(c: ArchCtx, pal?: { primary: string; secondary: string; accent: string }, sign?: string) {
  const primary = pal?.primary ?? U.teal;
  const g = new THREE.Group();
  plate(g, 2, 2);
  const unit = shopUnit({
    w: 1.8,
    floors: 3,
    wall: pal?.secondary ?? U.white,
    accent: primary,
    sign: sign ?? c.name ?? '',
    signFg: primary,
    dress: (u) => {
      // Marble tables and a drinks counter inside
      for (const x of [-0.45, 0.35]) marble(u, x, 0.05);
      box(u, 0.3, 0.26, 0.12, mat(U.timber), -0.7, 0.05, -0.2, 0.01);
      cyl(u, 0.04, 0.05, 0.08, metal('#c7c9cc'), -0.72, 0.31, -0.2, 10);
    },
  });
  g.add(unit);
  if (c.level >= 2) for (const x of [-0.55, 0.45]) marble(g, x, 0.62);
  if (c.level >= 3) for (let i = 0; i < 7; i++) put(g, rboxGeo(0.05, 0.07, 0.05, 0.02), bulb, [-0.8 + (i * 1.6) / 6, 0.68, 0.72]);
  if (c.flags.cafe_chalkboard) {
    const h = at(g, 0.8, 0.05, 0.85, -0.4);
    box(h, 0.18, 0.28, 0.03, mat(U.timber), 0, 0, 0, 0.01, [-0.15, 0, 0]);
    box(h, 0.14, 0.2, 0.02, mat('#2f3a33'), 0, 0.04, 0.025, 0.005, [-0.15, 0, 0]);
  }
  if (c.flags.cafe_brunch) marble(g, -0.05, 0.85);
  return g;
}

function marble(g: THREE.Object3D, x: number, z: number) {
  const iron = metal(U.charcoal);
  cyl(g, 0.12, 0.12, 0.022, mat('#f4f1ea', { roughness: 0.25 }), x, 0.3, z, 16);
  cyl(g, 0.014, 0.018, 0.27, iron, x, 0.04, z, 6);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    cyl(g, 0.045, 0.045, 0.02, mat([U.coral, U.teal, U.butter][i]), x + Math.cos(a) * 0.19, 0.18, z + Math.sin(a) * 0.19, 10);
    cyl(g, 0.01, 0.014, 0.15, iron, x + Math.cos(a) * 0.19, 0.04, z + Math.sin(a) * 0.19, 5);
  }
}

function dessert(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  g.add(
    shopUnit({
      w: 1.8,
      floors: 2,
      wall: '#ffe3ec',
      accent: '#e2557f',
      sign: c.name ?? '',
      dress: (u) => {
        box(u, 0.8, 0.28, 0.16, mat('#ffffff'), 0, 0.05, -0.15, 0.01);
        put(u, rboxGeo(0.76, 0.14, 0.12, 0.01), glass, [0, 0.42, -0.15]);
        (c.flags.bakery_pie_sign ? ['cake', 'cupcake', 'donut', 'cookie'] : ['cupcake', 'donut', 'cookie']).forEach((n, i) => prop(u, n, 0.08, -0.28 + i * 0.18, 0.34, -0.15));
      },
    }),
  );
  // Pastel umbrellas outside
  if (c.level >= 2)
    for (const [x, col] of [[-0.55, '#ffb3c7'], [0.5, U.mint]] as [number, string][]) {
      cyl(g, 0.012, 0.012, 0.5, metal(), x, 0.05, 0.62, 5);
      cone(g, 0.28, 0.12, mat(col), x, 0.5, 0.62, 10);
      cyl(g, 0.1, 0.1, 0.02, mat('#ffffff'), x, 0.27, 0.62, 12);
    }
  if (c.level >= 3) planterStrip(g, 0, 0.92, 1.4);
  return g;
}

function florist(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  g.add(
    shopUnit({
      w: 1.8,
      floors: 2,
      wall: '#efe7ff',
      accent: '#7a55c9',
      sign: c.name ?? '',
      dress: (u) => {
        for (let i = 0; i < 6; i++) {
          const x = -0.62 + i * 0.25;
          cyl(u, 0.06, 0.05, 0.12, metal('#9aa3a8'), x, 0.05, 0.42, 10);
          for (let k = 0; k < 3; k++) sphere(u, 0.04, mat(FLOWERS[(i + k) % 5]), x + (k - 1) * 0.03, 0.22 + (k % 2) * 0.03, 0.42, 6);
        }
      },
    }),
  );
  if (c.level >= 2) planterStrip(g, 0, 0.88, 1.5);
  return g;
}

function mamak(c: ArchCtx, pal?: { primary: string; secondary: string; accent: string }, sign?: string) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  const primary = pal?.primary ?? '#e8812c';
  const unit = shopUnit({
    w: 1.8,
    floors: 2,
    wall: pal?.secondary ?? '#fff6e5',
    accent: primary,
    sign: sign ?? c.name ?? '',
    canopy: false,
    dress: (u) => {
      // Open front: roller shutters up, griddle station, a TV on the wall
      box(u, 0.5, 0.26, 0.2, metal('#c9cdd2'), -0.55, 0.05, 0.2, 0.01);
      cyl(u, 0.16, 0.16, 0.02, mat('#2b2b2b', { metalness: 0.4 }), -0.55, 0.31, 0.2, 18);
      box(u, 0.3, 0.18, 0.02, mat('#1d2633'), 0.5, 0.33, -0.9, 0.004);
    },
  });
  g.add(unit);
  // Plastic tables and stools spilling out under a canopy
  const canopy = c.level >= 2;
  if (canopy) {
    box(g, 1.9, 0.03, 0.75, mat(primary), 0, 0.68, 0.55, 0.006);
    for (const sx of [-1, 1]) cyl(g, 0.02, 0.02, 0.63, metal(U.charcoal), sx * 0.9, 0.05, 0.88, 6);
  }
  const tables: [number, number][] = canopy ? [[-0.55, 0.5], [0.0, 0.62], [0.55, 0.5], [-0.3, 0.88], [0.35, 0.88]] : [[-0.45, 0.55], [0.45, 0.55]];
  for (const [x, z] of tables) {
    box(g, 0.22, 0.02, 0.22, mat('#e9eef2'), x, 0.25, z, 0.01);
    cyl(g, 0.012, 0.012, 0.2, metal(), x, 0.05, z, 5);
    for (const [dx, dz] of [[-0.16, 0], [0.16, 0], [0, 0.16]]) cyl(g, 0.045, 0.04, 0.13, mat(['#e04848', '#2e6fd8', '#f5c542'][Math.abs(Math.round((x + dx) * 10)) % 3]), x + dx, 0.05, z + dz, 10);
  }
  return g;
}

function learning(c: ArchCtx, pal?: { primary: string; secondary: string; accent: string }, sign?: string) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  const primary = pal?.primary ?? '#6b5bd2';
  g.add(
    shopUnit({
      w: 1.8,
      floors: 3,
      wall: pal?.secondary ?? '#f4f1ff',
      accent: primary,
      sign: sign ?? c.name ?? '',
      dress: (u) => {
        for (let i = 0; i < 3; i++) {
          box(u, 0.3, 0.03, 0.16, mat(U.timber), -0.55 + i * 0.55, 0.25, -0.1, 0.006);
          cyl(u, 0.04, 0.04, 0.16, mat(pal?.accent ?? U.butter), -0.55 + i * 0.55, 0.05, 0.05, 8);
        }
        box(u, 1.0, 0.3, 0.02, mat('#2f4a3a'), 0, 0.15, -0.88, 0.004); // whiteboard wall (green board)
      },
    }),
  );
  if (c.level >= 2) {
    for (let i = 0; i < 3; i++) box(g, 0.18, 0.4, 0.1, mat([U.coral, U.butter, U.teal][i]), -0.75 + i * 0.2, 0.05, 0.85, 0.01);
    planterStrip(g, 0.45, 0.9, 0.8);
  }
  return g;
}

function minimart(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 3, 2);
  g.add(
    shopUnit({
      w: 2.8,
      floors: 2,
      wall: U.white,
      accent: '#ff5a4f',
      sign: c.name ?? '',
      dress: (u) => {
        for (let i = 0; i < 4; i++) {
          box(u, 0.12, 0.3, 0.6, metal('#e5e9ee'), -1.0 + i * 0.6, 0.05, -0.35, 0.01);
          for (let k = 0; k < 3; k++) box(u, 0.1, 0.05, 0.55, mat([U.butter, U.sky, U.coral][k]), -1.0 + i * 0.6, 0.1 + k * 0.08, -0.35, 0.005);
        }
      },
    }),
  );
  parking(g, 0, 0.72, 2.6, 4, c.level >= 2 ? ['', 'taxi', '', 'van'] : ['', 'sedan', '', '']);
  return g;
}

function coworking(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 2, 2);
  const wall = render(U.white);
  box(g, 1.7, 1.35, 1.3, wall, 0, 0.05, -0.3, 0.02);
  for (let f = 0; f < 3; f++) glazing(g, 0, 0.12 + f * 0.43, 0.36, 1.55, 0.36, 5, U.charcoal);
  fins(g, -0.8, 0.8, 0.06, 1.3, 0.42, 9, U.timber);
  signBoard(g, c.name ?? '', 0, 1.42, 0.37, { w: 1.1, h: 0.12, bg: '#ffffff', fg: U.navy });
  box(g, 1.74, 0.06, 1.34, render(U.concrete), 0, 1.4, -0.3, 0.01);
  for (const x of [-0.6, 0.6]) bush(g, x, 0.7, 0.6, U.leaf);
  if (c.level >= 2) {
    // Rooftop terrace with a pergola and plants
    for (const x of [-0.7, 0.7]) for (const z of [-0.8, 0.2]) cyl(g, 0.015, 0.015, 0.3, mat(U.timber), x, 1.46, z, 5);
    for (let i = 0; i < 6; i++) box(g, 0.04, 0.03, 1.0, mat(U.timber), -0.6 + i * 0.24, 1.76, -0.3, 0.004);
    for (const x of [-0.4, 0.4]) bush(g, x, -0.3, 0.5, U.leafDark), (g.children.slice(-3).forEach((m) => (m.position.y += 1.46)));
  }
  return g;
}

function makerspace(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 3, 2);
  const wall = mat('#e9edf1', { map: TEX.panels(), repeat: [3, 2] });
  box(g, 2.6, 0.9, 1.3, wall, 0, 0.05, -0.3, 0.02);
  // Sawtooth roof
  for (let i = 0; i < 4; i++) {
    const r = put(g, new THREE.BoxGeometry(0.65, 0.04, 1.32), mat(U.roof), [-0.98 + i * 0.65, 1.02, -0.3], [0, 0, 0.25]);
    r.castShadow = true;
  }
  // Big roll-up door (open) and a glass side office
  box(g, 1.0, 0.7, 0.03, mat('#22252a'), -0.55, 0.05, 0.36, 0.006);
  for (let i = 0; i < 6; i++) box(g, 1.02, 0.02, 0.04, metal(U.alu), -0.55, 0.62 + i * 0.022, 0.36, 0.003);
  glazing(g, 0.75, 0.1, 0.36, 0.9, 0.6, 3);
  signBoard(g, c.name ?? '', 0.75, 0.75, 0.38, { w: 0.9, h: 0.12, bg: U.butter, fg: '#2b2b2b' });
  // Timber stack, a workbench and a finished chair outside
  for (let i = 0; i < 4; i++) box(g, 0.5, 0.04, 0.1, mat(U.timber, { map: TEX.planks() }), -1.0, 0.05 + i * 0.045, 0.7, 0.008);
  box(g, 0.5, 0.04, 0.22, mat(U.timberDark), -0.4, 0.28, 0.65, 0.006);
  for (const sx of [-1, 1]) box(g, 0.03, 0.24, 0.18, metal(U.charcoal), -0.4 + sx * 0.22, 0.05, 0.65, 0.004);
  if (c.level >= 2) {
    box(g, 0.2, 0.04, 0.2, mat(U.coral), 0.6, 0.18, 0.75, 0.01);
    box(g, 0.2, 0.18, 0.03, mat(U.coral), 0.6, 0.2, 0.66, 0.008);
  }
  if (c.level >= 3) for (let i = 0; i < 4; i++) box(g, 0.4, 0.02, 0.26, mat('#2c4a7a', { metalness: 0.5, roughness: 0.2 }), -0.98 + i * 0.65, 1.08, -0.3, 0.004, [0, 0, 0.25]);
  return g;
}

function evShowroom(c: ArchCtx, pal?: { primary: string; secondary: string; accent: string }, sign?: string) {
  const g = showroomGlass(c, pal ?? { primary: '#1f8ad1', secondary: '#f4f8fb', accent: '#2ec4a3' }, sign);
  // EV chargers along the front
  for (const x of [-1.2, 1.2]) {
    box(g, 0.1, 0.36, 0.08, mat('#f5f7fa'), x, 0.04, 0.88, 0.02);
    put(g, rboxGeo(0.06, 0.04, 0.01, 0.005), mat('#2ec4a3', { emissive: '#2ec4a3', emissiveIntensity: 0.6 }), [x, 0.33, 0.93]);
  }
  return g;
}

// ─── Outdoors & civic ────────────────────────────────────────────────────────

function park(c: ArchCtx) {
  const g = new THREE.Group();
  box(g, 2.94, 0.04, 2.94, mat(U.lawn, { roughness: 1 }), 0, 0, 0, 0.02);
  // Jogging track loop (rubberised red) around the edge
  const track = mat('#d9654b', { roughness: 0.95 });
  const ring = put(g, new THREE.RingGeometry(1.05, 1.27, 40), track, [0, 0.045, 0], [-Math.PI / 2, 0, 0], [1, 1, 1]);
  ring.receiveShadow = true;
  put(g, new THREE.RingGeometry(1.15, 1.165, 40), mat('#ffffff'), [0, 0.047, 0], [-Math.PI / 2, 0, 0]);
  rainTree(g, -0.45, -0.4, 0.75);
  rainTree(g, 0.5, 0.3, 0.6);
  // Exercise station
  for (const x of [-0.2, 0.2]) cyl(g, 0.02, 0.02, 0.4, metal(U.teal), x + 0.25, 0.04, -0.55, 6);
  box(g, 0.44, 0.02, 0.02, metal(U.teal), 0.25, 0.44, -0.55, 0.004);
  bench(g, -0.55, 0.55, Math.PI * 0.75, 0.5);
  ledLamp(g, 0.7, -0.7, 0.8);
  for (let i = 0; i < 6; i++) sphere(g, 0.045, mat(FLOWERS[i % 5]), -0.9 + i * 0.12, 0.09, 0.85, 6);
  if (c.level >= 2) {
    // A modern shade pavilion for gatherings
    for (const [x, z] of [[-0.85, -0.85], [-0.35, -0.85], [-0.85, -0.35], [-0.35, -0.35]]) cyl(g, 0.02, 0.02, 0.55, metal(U.charcoal), x, 0.04, z, 6);
    box(g, 0.7, 0.05, 0.7, mat(U.white), -0.6, 0.59, -0.6, 0.02);
  }
  if (c.flags.park_bunting) for (let i = 0; i < 12; i++) box(g, 0.07, 0.08, 0.005, mat(FLOWERS[i % 5], { side: THREE.DoubleSide }), -1.3 + (i * 2.6) / 11, 0.95 - Math.sin((i / 11) * Math.PI) * 0.15, 1.3, 0.002);
  return g;
}

function communityCentre(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 3, 3);
  const wall = render(U.white);
  box(g, 2.5, 0.75, 1.8, wall, 0, 0.05, -0.4, 0.02);
  glazing(g, 0, 0.1, 0.51, 2.2, 0.6, 7);
  // Big floating roof canopy
  box(g, 2.9, 0.07, 2.4, mat('#f2efe8'), 0, 0.85, -0.15, 0.02);
  box(g, 2.9, 0.08, 0.04, mat(U.timber), 0, 0.85, 1.05, 0.01);
  for (const x of [-1.3, 1.3]) cyl(g, 0.035, 0.035, 0.8, metal(U.charcoal), x, 0.05, 0.95, 8);
  signBoard(g, c.name ?? '', 0, 0.94, 1.08, { w: 1.6, h: 0.14, bg: '#ffffff', fg: U.teal });
  planterStrip(g, -0.8, 1.2, 0.9);
  planterStrip(g, 0.8, 1.2, 0.9);
  if (c.level >= 2) {
    cyl(g, 0.16, 0.16, 0.04, mat('#ffffff'), 0, 1.25, 1.07, 16, [Math.PI / 2, 0, 0]);
    box(g, 0.012, 0.1, 0.01, mat(U.charcoal), 0, 1.2, 1.1, 0.002);
    for (let i = 0; i < 12; i++) box(g, 0.07, 0.08, 0.005, mat(FLOWERS[i % 5], { side: THREE.DoubleSide }), -1.3 + (i * 2.6) / 11, 0.82 - Math.sin((i / 11) * Math.PI) * 0.1, 1.25, 0.002);
  }
  return g;
}

function notice(c: ArchCtx) {
  const g = new THREE.Group();
  box(g, 0.08, 0.7, 0.08, metal(U.charcoal), -0.28, 0, 0, 0.01);
  box(g, 0.08, 0.7, 0.08, metal(U.charcoal), 0.28, 0, 0, 0.01);
  box(g, 0.66, 0.46, 0.06, mat('#ffffff'), 0, 0.3, 0, 0.02);
  const notes = ['#fff1b8', '#ffd9e0', '#d9f1ff', '#e3f7d4', '#ffe1c4'];
  for (let i = 0; i < 5; i++) box(g, 0.13, 0.12, 0.01, mat(notes[i]), -0.2 + (i % 3) * 0.2, 0.38 + Math.floor(i / 3) * 0.17, 0.035, 0.004, [0, 0, (i - 2) * 0.07]);
  box(g, 0.74, 0.05, 0.14, mat(U.teal), 0, 0.78, 0, 0.01);
  void c;
  return g;
}

function gateway(c: ArchCtx) {
  const g = new THREE.Group();
  // Guardhouse, boom gate and a feature wall with the neighbourhood's name
  box(g, 0.42, 0.42, 0.38, render(U.white), -0.72, 0, -0.05, 0.02);
  glazing(g, -0.72, 0.12, 0.15, 0.32, 0.22, 2);
  box(g, 0.5, 0.04, 0.46, mat(U.charcoal), -0.72, 0.42, -0.05, 0.01);
  box(g, 0.08, 0.28, 0.08, mat(U.coral), -0.45, 0, 0.25, 0.01);
  const arm = box(g, 0.9, 0.035, 0.035, mat('#ffffff'), 0.02, 0.24, 0.25, 0.008);
  arm.rotation.z = 0.0;
  for (let i = 0; i < 4; i++) box(g, 0.1, 0.037, 0.037, mat('#e04848'), -0.3 + i * 0.22, 0.24, 0.25, 0.004);
  box(g, 0.7, 0.42, 0.1, mat(U.concrete, { map: TEX.panels() }), 0.6, 0, -0.25, 0.02);
  signBoard(g, c.text?.welcome ?? c.hoodName, 0.6, 0.15, -0.19, { w: 0.62, h: 0.16, bg: '#ffffff', fg: U.teal });
  planterStrip(g, 0.6, -0.05, 0.6, 0);
  return g;
}

function lake() {
  const g = new THREE.Group();
  box(g, 2.94, 0.04, 2.94, mat(U.lawn, { roughness: 1 }), 0, 0, 0, 0.02);
  const water = new THREE.MeshStandardMaterial({ color: '#36b8d6', roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.92 });
  put(g, new THREE.CylinderGeometry(1.15, 1.15, 0.03, 40), water, [0, 0.045, 0.05], [0, 0, 0], [1, 1, 0.85]);
  put(g, new THREE.TorusGeometry(1.15, 0.05, 6, 40), mat('#e3dccd', { map: TEX.paving() }), [0, 0.05, 0.05], [Math.PI / 2, 0, 0], [1, 0.85, 1]);
  // Boardwalk across one corner, lily pads, a fountain jet
  box(g, 0.25, 0.05, 1.3, mat(U.timber, { map: TEX.planks(), repeat: [1, 6] }), 0.75, 0.07, 0.35, 0.008, [0, 0.5, 0]);
  for (let i = 0; i < 5; i++) cyl(g, 0.08, 0.08, 0.008, mat('#5bb85b'), -0.6 + i * 0.22, 0.065, -0.3 + (i % 2) * 0.25, 10);
  cyl(g, 0.06, 0.09, 0.05, mat('#e3dccd'), -0.15, 0.05, 0.15, 12);
  rainTree(g, -1.15, -1.1, 0.6);
  ledLamp(g, 1.25, -1.2, 0.8);
  return g;
}

function fountain(c: ArchCtx) {
  const g = new THREE.Group();
  const stage = c.stage ?? 0;
  box(g, 1.9, 0.04, 1.9, mat(U.paving, { map: TEX.paving(), repeat: [4, 4] }), 0, 0, 0, 0.02);
  if (stage === 0) {
    // Hoarding with a cheerful "coming soon" board
    for (let i = 0; i < 4; i++) box(g, 1.6, 0.3, 0.03, mat(i % 2 ? U.teal : '#ffffff'), 0, 0.04, -0.8 + i * 0.53, 0.004, [0, i % 2 ? Math.PI / 2 : 0, 0]);
    signBoard(g, c.text?.projectSign ?? '', 0, 0.38, 0.82, { w: 0.9, h: 0.16, bg: '#ffffff', fg: U.teal });
    return g;
  }
  cyl(g, 0.78, 0.82, 0.08, render(U.concrete), 0, 0.04, 0, 28);
  if (stage >= 2) cyl(g, 0.72, 0.72, 0.02, new THREE.MeshStandardMaterial({ color: '#4cc9e8', roughness: 0.05, metalness: 0.2 }), 0, 0.11, 0, 28);
  if (stage >= 3) {
    cyl(g, 0.12, 0.16, 0.35, render(U.white), 0, 0.12, 0, 16);
    cyl(g, 0.3, 0.3, 0.04, render(U.white), 0, 0.46, 0, 20);
  }
  if (stage >= 4) {
    for (const [x, z] of [[-0.85, 0.85], [0.85, 0.85], [-0.85, -0.85], [0.85, -0.85]]) bush(g, x, z, 0.7, U.leaf);
    bench(g, 0, 0.92, Math.PI, 0.5);
    ledLamp(g, 0.9, 0.2, 0.75);
  }
  return g;
}

// ─── City landmarks (scenery) ────────────────────────────────────────────────

function mall(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 4, 3);
  const wall = render(U.white);
  box(g, 3.7, 1.1, 2.3, wall, 0, 0.05, -0.25, 0.03);
  // Glass atrium and entrance canopy
  glazing(g, 0, 0.1, 0.91, 1.6, 0.95, 8, '#5b6672');
  box(g, 1.9, 0.05, 0.45, mat(U.charcoal), 0, 0.7, 1.1, 0.01);
  // Colourful facade panels and a sign band
  ['#ff7b67', '#ffd166', '#4fb0f0', '#22b3a6'].forEach((col, i) => box(g, 0.42, 0.85, 0.04, mat(col), -1.55 + i * 0.25 + (i > 1 ? 2.35 : 0), 0.15, 0.92, 0.008));
  signBoard(g, c.name ?? '', 0, 1.0, 0.94, { w: 1.6, h: 0.14, bg: '#ffffff', fg: U.navy });
  // Cinema block and rooftop garden
  box(g, 1.1, 0.45, 1.0, render('#eef1f6'), -1.15, 1.15, -0.6, 0.02);
  for (let i = 0; i < 6; i++) bush(g, 0.2 + (i % 3) * 0.45, -0.8 + Math.floor(i / 3) * 0.5, 0.6, i % 2 ? U.leaf : U.leafDark), (g.children.slice(-3).forEach((m) => (m.position.y += 1.15)));
  parking(g, 0, 1.25, 3.6, 7, ['sedan', '', 'suv', 'hatchback_sports', '', 'taxi', '']);
  return g;
}

function school(c: ArchCtx) {
  const g = new THREE.Group();
  box(g, 2.94, 0.04, 2.94, mat(U.lawn, { roughness: 1 }), 0, 0, 0, 0.02);
  const wall = render(U.white);
  const blue = mat('#3d7fd6');
  box(g, 2.6, 0.95, 0.75, wall, 0, 0.04, -0.95, 0.02);
  for (let f = 0; f < 2; f++) {
    box(g, 2.6, 0.04, 0.22, blue, 0, 0.46 + f * 0.46, -0.48, 0.006); // corridors
    for (let i = 0; i < 6; i++) put(g, rboxGeo(0.26, 0.24, 0.02, 0.004), glass, [-1.1 + i * 0.44, 0.17 + f * 0.47, -0.57]);
  }
  box(g, 2.66, 0.07, 0.8, mat('#2f63b0'), 0, 0.99, -0.95, 0.01);
  signBoard(g, c.name ?? '', 0, 0.82, -0.36, { w: 1.4, h: 0.12, bg: '#ffffff', fg: '#2f63b0' });
  // Covered drop-off walkway, field with goals, a fence
  box(g, 0.4, 0.03, 1.2, metal(U.charcoal), 1.15, 0.5, 0.3, 0.006);
  for (const z of [-0.2, 0.4, 0.85]) cyl(g, 0.015, 0.015, 0.46, metal(U.charcoal), 1.3, 0.04, z, 5);
  for (const x of [-1.1, 0.5]) {
    for (const sz of [-1, 1]) cyl(g, 0.012, 0.012, 0.22, mat('#ffffff'), x, 0.04, 0.45 + sz * 0.15, 5);
    box(g, 0.02, 0.02, 0.32, mat('#ffffff'), x, 0.26, 0.45, 0.003);
  }
  put(g, new THREE.RingGeometry(0.18, 0.2, 24), mat('#ffffff'), [-0.3, 0.045, 0.45], [-Math.PI / 2, 0, 0]);
  for (let i = 0; i < 14; i++) cyl(g, 0.01, 0.01, 0.2, metal('#7fb37f'), -1.4 + i * 0.215, 0.04, 1.43, 4);
  return g;
}

function clinicRow(c: ArchCtx) {
  const g = new THREE.Group();
  plate(g, 3, 2);
  const units: [string, string, string][] = [
    [c.text?.unit1 ?? 'Klinik Keluarga', '#2fa38f', '#eefaf6'],
    [c.text?.unit2 ?? 'Kedai Serbaneka', '#e85c4a', U.white],
    [c.text?.unit3 ?? 'Kopi & Co', '#8a5a37', U.warm],
  ];
  units.forEach(([sign, accent, wall], i) => {
    const u = shopUnit({ w: 0.98, floors: 3, wall, accent, sign });
    u.position.x = -0.98 + i * 0.98;
    g.add(u);
  });
  parking(g, 0, 0.72, 2.8, 5, ['', 'sedan', '', 'hatchback_sports', '']);
  return g;
}

function petrol(c: ArchCtx) {
  const g = new THREE.Group();
  box(g, 2.94, 0.03, 1.94, mat(U.asphalt, { map: TEX.asphalt(), repeat: [3, 2] }), 0, 0, 0, 0.01);
  // Canopy over two pump islands and two EV bays
  box(g, 2.2, 0.08, 1.0, mat('#ffffff'), -0.2, 0.75, 0.15, 0.02);
  box(g, 2.2, 0.06, 0.04, mat(U.teal), -0.2, 0.77, 0.66, 0.006);
  for (const x of [-1.2, 0.8]) for (const z of [-0.25, 0.55]) cyl(g, 0.04, 0.04, 0.72, mat('#e8ecf0'), x, 0.03, z, 8);
  for (const x of [-0.75, -0.05]) {
    box(g, 0.32, 0.06, 0.14, mat(U.concrete), x, 0.03, 0.15, 0.01);
    for (const sx of [-1, 1]) box(g, 0.1, 0.3, 0.08, mat('#f5f7fa'), x + sx * 0.08, 0.09, 0.15, 0.015);
  }
  for (const x of [0.55, 0.85]) {
    box(g, 0.1, 0.34, 0.08, mat('#f5f7fa'), x, 0.03, -0.55, 0.02);
    put(g, rboxGeo(0.06, 0.04, 0.01, 0.005), mat('#2ec4a3', { emissive: '#2ec4a3', emissiveIntensity: 0.6 }), [x, 0.3, -0.5]);
    box(g, 0.25, 0.005, 0.5, mat('#2ec4a3'), x, 0.035, -0.3, 0.002);
  }
  prop(g, 'sedan', 0.22, -0.4, 0.04, -0.15, Math.PI / 2);
  // Little shop at the back
  box(g, 0.9, 0.5, 0.5, render(U.white), 1.0, 0.03, -0.62, 0.02);
  glazing(g, 1.0, 0.06, -0.36, 0.7, 0.35, 3);
  signBoard(g, c.name ?? '', 1.0, 0.56, -0.35, { w: 0.85, h: 0.1, bg: U.teal, fg: '#ffffff' });
  return g;
}

// ─── Street furniture & planting (urban decorations) ────────────────────────

export function urbanDecoration(kind: string): THREE.Group | null {
  const g = new THREE.Group();
  switch (kind) {
    case 'lamp':
      ledLamp(g, 0, 0, 1.0);
      return g;
    case 'bench':
      box(g, 0.6, 0.04, 0.2, mat(U.timber, { map: TEX.planks(), repeat: [2, 1] }), 0, 0.2, 0, 0.01);
      box(g, 0.6, 0.12, 0.03, mat(U.timber), 0, 0.26, -0.09, 0.008);
      for (const sx of [-1, 1]) box(g, 0.04, 0.2, 0.18, render(U.concrete), sx * 0.25, 0, 0, 0.01);
      return g;
    case 'fence':
      for (const sx of [-0.45, 0.45]) cyl(g, 0.018, 0.018, 0.3, metal(U.charcoal), sx, 0, 0, 6);
      for (const y of [0.12, 0.28]) box(g, 0.92, 0.02, 0.02, metal(U.charcoal), 0, y, 0, 0.003);
      return g;
    case 'planter':
      box(g, 0.6, 0.22, 0.6, render(U.concrete), 0, 0, 0, 0.03);
      bush(g, 0, 0, 1.0, U.leaf);
      g.children.slice(-3).forEach((m) => (m.position.y += 0.2));
      for (let i = 0; i < 4; i++) sphere(g, 0.03, mat(FLOWERS[i]), -0.15 + i * 0.1, 0.36, 0.18, 6);
      return g;
    case 'rock':
      put(g, new THREE.DodecahedronGeometry(0.22, 0), mat('#c9c3b8', { roughness: 0.6 }), [0, 0.14, 0], [0.2, 0.4, 0], [1.4, 0.6, 1]);
      return g;
    case 'barrels':
      ['#2f7de0', '#f2a93b', '#3fae5a'].forEach((col, i) => {
        box(g, 0.2, 0.32, 0.2, mat(col), -0.24 + i * 0.24, 0, 0, 0.03);
        box(g, 0.21, 0.03, 0.21, mat(col), -0.24 + i * 0.24, 0.32, 0, 0.01);
      });
      return g;
    case 'crate':
      box(g, 0.62, 0.62, 0.3, mat('#f0f2f5'), 0, 0, 0, 0.02);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) box(g, 0.17, 0.17, 0.01, mat(i === 1 && j === 1 ? U.teal : '#d9dee4'), -0.19 + i * 0.19, 0.04 + j * 0.19, 0.155, 0.004);
      return g;
    case 'mailbox':
      cyl(g, 0.02, 0.02, 0.3, metal(U.charcoal), 0, 0, 0, 6);
      box(g, 0.2, 0.16, 0.12, mat(U.coral), 0, 0.3, 0, 0.02);
      return g;
  }
  return null;
}

/** Urban versions of module prefabs: same modules, a modern Klang Valley storefront. */
export function urbanPrefab(arch: string, c: ArchCtx): THREE.Group | null {
  const m = c.module;
  switch (arch) {
    case 'prefab:kopitiam':
    case 'prefab:shoplot':
    case 'prefab:cafe_cottage':
      return shoplotCafe(c, m?.palette, m?.sign);
    case 'prefab:hawker_stall':
      return mamak(c, m?.palette, m?.sign);
    case 'prefab:learning_house':
      return learning(c, m?.palette, m?.sign);
    case 'prefab:showroom_glass':
      return evShowroom(c, m?.palette, m?.sign);
    case 'prefab:community_garden':
      return communityGarden(c, m?.palette, m?.sign);
  }
  return null;
}

export function urbanArchetype(arch: string, c: ArchCtx): THREE.Group | null {
  switch (arch) {
    case 'kl:terrace':
      return terrace(c);
    case 'kl:semid':
      return semid(c);
    case 'kl:condo':
      return condo(c);
    case 'kl:shoplot_cafe':
      return shoplotCafe(c);
    case 'kl:dessert':
      return dessert(c);
    case 'kl:urban_garden':
      return communityGarden(c, { primary: '#3fae5a', secondary: '#eef5e6', accent: '#ff7b67' });
    case 'kl:florist':
      return florist(c);
    case 'kl:makerspace':
      return makerspace(c);
    case 'kl:minimart':
      return minimart(c);
    case 'kl:ev_showroom':
      return evShowroom(c);
    case 'kl:learning':
      return learning(c);
    case 'kl:park':
      return park(c);
    case 'kl:community_centre':
      return communityCentre(c);
    case 'kl:notice':
      return notice(c);
    case 'kl:gateway':
      return gateway(c);
    case 'kl:lake':
      return lake();
    case 'kl:fountain':
      return fountain(c);
    case 'kl:mamak':
      return mamak(c);
    case 'kl:coworking':
      return coworking(c);
    case 'kl:mall':
      return mall(c);
    case 'kl:school':
      return school(c);
    case 'kl:clinic_row':
      return clinicRow(c);
    case 'kl:petrol':
      return petrol(c);
  }
  return null;
}

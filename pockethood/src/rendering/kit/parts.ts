// Geometry helpers and reusable architectural parts for the POCKETHOOD kit.
// Local space convention: origin at footprint centre, y = 0 at ground, door faces +Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bulb, glass, mat, P, TEX } from './materials';

type V3 = [number, number, number];
const geoCache = new Map<string, THREE.BufferGeometry>();

function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

export const rboxGeo = (w: number, h: number, d: number, r = 0.03) => {
  const rr = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const seg = Math.min(w, h, d) > 0.25 && rr > 0.02 ? 2 : 1;
  return cached(`rb:${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${rr.toFixed(3)}`, () => new RoundedBoxGeometry(w, h, d, seg, rr));
};

export function put(g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, pos: V3, rot: V3 = [0, 0, 0], scale?: V3) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

/** Rounded box with its *bottom* at y. */
export const box = (g: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, r = 0.03, rot: V3 = [0, 0, 0]) =>
  put(g, rboxGeo(w, h, d, r), m, [x, y + h / 2, z], rot);

export const cyl = (g: THREE.Object3D, rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 12, rot: V3 = [0, 0, 0]) =>
  put(g, cached(`cy:${rt}:${rb}:${h}:${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m, [x, y + h / 2, z], rot);

export const sphere = (g: THREE.Object3D, r: number, m: THREE.Material, x: number, y: number, z: number, seg = 10, scale?: V3) =>
  put(g, cached(`sp:${r}:${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7)))), m, [x, y, z], [0, 0, 0], scale);

export const cone = (g: THREE.Object3D, r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 10) =>
  put(g, cached(`co:${r}:${h}:${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m, [x, y + h / 2, z]);

// ─── Roofs ──────────────────────────────────────────────────────────────────

/** Gable roof with shingle texture; ridge runs along X (or Z). Returns the ridge height. */
export function gableRoof(
  g: THREE.Object3D,
  o: { w: number; d: number; y: number; rise: number; overhang?: number; color: string; wall: THREE.Material; ridgeAlongZ?: boolean },
) {
  const ov = o.overhang ?? 0.12;
  const holder = new THREE.Group();
  if (o.ridgeAlongZ) holder.rotation.y = Math.PI / 2;
  g.add(holder);
  // Work in a frame where the ridge runs along local X.
  const W = o.ridgeAlongZ ? o.d : o.w;
  const D = o.ridgeAlongZ ? o.w : o.d;
  const theta = Math.atan2(o.rise, D / 2);
  const run = D / 2 + ov;
  const len = run / Math.cos(theta) + 0.04;
  const t = 0.07;
  const roofMat = mat(o.color, { map: TEX.shingles(), repeat: [Math.max(1, Math.round(W * 1.6)), Math.max(1, Math.round(len * 2))], roughness: 0.75 });
  for (const side of [1, -1]) {
    const nx = Math.sin(theta) * (t / 2);
    put(
      holder,
      rboxGeo(W + ov * 2, t, len, 0.025),
      roofMat,
      [0, o.y + o.rise - (run / 2) * Math.tan(theta) + Math.cos(theta) * (t / 2), side * (run / 2 + nx * 0)],
      [side * theta, 0, 0],
    );
  }
  // Ridge cap
  put(holder, cached(`ridge:${W}:${ov}`, () => new THREE.CylinderGeometry(0.055, 0.055, W + ov * 2 + 0.02, 8)), mat(shadeHex(o.color, -0.15)), [0, o.y + o.rise + 0.06, 0], [0, 0, Math.PI / 2]);
  // Gable end walls (triangles), flush with the wall faces
  const shape = new THREE.Shape();
  shape.moveTo(-D / 2, 0);
  shape.lineTo(D / 2, 0);
  shape.lineTo(0, o.rise);
  shape.closePath();
  const gableGeo = cached(`gable:${D}:${o.rise}`, () => new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }));
  put(holder, gableGeo, o.wall, [W / 2 - 0.04, o.y, 0], [0, Math.PI / 2, 0]);
  put(holder, gableGeo, o.wall, [-W / 2, o.y, 0], [0, Math.PI / 2, 0]);
  return o.y + o.rise;
}

/** Simple hip roof: a 4-sided pyramid frustum with shingles. */
export function hipRoof(g: THREE.Object3D, o: { w: number; d: number; y: number; rise: number; color: string; overhang?: number; top?: number }) {
  const ov = o.overhang ?? 0.12;
  const geo = cached(`hip:${o.w}:${o.d}:${o.rise}:${ov}:${o.top ?? 0}`, () => {
    const gg = new THREE.CylinderGeometry(Math.SQRT1_2 * (o.top ?? 0.05), Math.SQRT1_2, o.rise, 4, 1);
    gg.rotateY(Math.PI / 4);
    gg.scale(o.w + ov * 2, 1, o.d + ov * 2);
    return gg;
  });
  put(g, geo, mat(o.color, { map: TEX.shingles(), repeat: [3, 2], roughness: 0.75 }), [0, o.y + o.rise / 2, 0]);
  return o.y + o.rise;
}

// ─── Openings ───────────────────────────────────────────────────────────────

export interface WindowOpts {
  w?: number;
  h?: number;
  shutters?: string;
  flowerBox?: string[];
  trim?: string;
  arch?: boolean;
}

/** A framed window on a +Z-facing wall plane at z. */
export function windowAt(g: THREE.Object3D, x: number, y: number, z: number, o: WindowOpts = {}) {
  const w = o.w ?? 0.3;
  const h = o.h ?? 0.36;
  const trim = mat(o.trim ?? P.trim);
  box(g, w + 0.08, h + 0.08, 0.05, trim, x, y - 0.04, z, 0.015);
  put(g, rboxGeo(w, h, 0.03, 0.01), glass, [x, y + h / 2, z + 0.02]);
  // Muntins
  box(g, 0.025, h, 0.02, trim, x, y, z + 0.04, 0.005);
  box(g, w, 0.025, 0.02, trim, x, y + h / 2 - 0.012, z + 0.04, 0.005);
  // Sill
  box(g, w + 0.14, 0.04, 0.1, trim, x, y - 0.06, z + 0.04, 0.012);
  if (o.shutters) {
    const sm = mat(o.shutters);
    for (const s of [-1, 1]) {
      box(g, w * 0.45, h + 0.02, 0.03, sm, x + s * (w / 2 + w * 0.27), y - 0.01, z + 0.01, 0.01);
      box(g, w * 0.32, 0.015, 0.012, mat(shadeHex(o.shutters, -0.2)), x + s * (w / 2 + w * 0.27), y + h * 0.33, z + 0.03, 0.004);
      box(g, w * 0.32, 0.015, 0.012, mat(shadeHex(o.shutters, -0.2)), x + s * (w / 2 + w * 0.27), y + h * 0.66, z + 0.03, 0.004);
    }
  }
  if (o.flowerBox) flowerBox(g, x, y - 0.17, z + 0.08, w + 0.08, o.flowerBox);
}

/** Planter box under a window, overflowing with blooms. */
export function flowerBox(g: THREE.Object3D, x: number, y: number, z: number, w: number, colors: string[]) {
  box(g, w, 0.1, 0.12, mat(P.woodDark, { map: TEX.planks(), repeat: [2, 1] }), x, y, z, 0.015);
  const n = Math.max(3, Math.round(w / 0.07));
  for (let i = 0; i < n; i++) {
    const fx = x - w / 2 + 0.04 + (i * (w - 0.08)) / (n - 1);
    sphere(g, 0.045, mat(P.leaf), fx, y + 0.12, z, 6);
    sphere(g, 0.032, mat(colors[i % colors.length]), fx + 0.01, y + 0.16, z + 0.02, 6);
  }
}

export function doorAt(g: THREE.Object3D, x: number, z: number, o: { color: string; w?: number; h?: number; trim?: string; lamp?: boolean; glassTop?: boolean }) {
  const w = o.w ?? 0.3;
  const h = o.h ?? 0.52;
  const trim = mat(o.trim ?? P.trim);
  box(g, w + 0.1, h + 0.06, 0.05, trim, x, 0.06, z, 0.015);
  box(g, w, h, 0.04, mat(o.color, { map: TEX.planks(), repeat: [1, 1] }), x, 0.08, z + 0.02, 0.012);
  if (o.glassTop) put(g, rboxGeo(w * 0.6, h * 0.28, 0.02, 0.008), glass, [x, 0.08 + h * 0.72, z + 0.045]);
  sphere(g, 0.022, mat(P.gold, { metalness: 0.6, roughness: 0.3 }), x + w * 0.32, 0.08 + h * 0.48, z + 0.05, 8);
  // Step
  box(g, w + 0.2, 0.06, 0.16, mat(P.stone, { map: TEX.cobbles(), repeat: [1, 1] }), x, 0, z + 0.08, 0.02);
  if (o.lamp !== false) {
    box(g, 0.05, 0.04, 0.06, mat('#3b3631'), x + w / 2 + 0.1, h * 0.85, z + 0.02, 0.01);
    sphere(g, 0.035, bulb, x + w / 2 + 0.1, h * 0.85 - 0.02, z + 0.07, 8);
  }
}

/** Striped shop awning projecting from a +Z wall. */
export function awning(g: THREE.Object3D, x: number, y: number, z: number, w: number, a: string, b: string, depth = 0.32) {
  const m = mat('#ffffff', { map: TEX.awning(a, b), repeat: [Math.max(1, Math.round(w * 2)), 1], roughness: 0.9 });
  const tilt = 0.5;
  put(g, rboxGeo(w, 0.03, depth, 0.01), m, [x, y - Math.sin(tilt) * depth * 0.5, z + Math.cos(tilt) * depth * 0.5], [tilt, 0, 0]);
  // Scalloped valance
  const n = Math.max(4, Math.round(w / 0.1));
  const drop = y - Math.sin(tilt) * depth;
  for (let i = 0; i < n; i++) {
    const vx = x - w / 2 + (w / n) * (i + 0.5);
    put(g, cached('valance', () => new THREE.CylinderGeometry(w / n / 2, w / n / 2, 0.02, 10, 1, false, 0, Math.PI)), mat(i % 2 ? b : a), [vx, drop - 0.005, z + Math.cos(tilt) * depth + 0.005], [Math.PI / 2, 0, 0], [1, 1, 1]);
  }
}

const signCache = new Map<string, THREE.Material>();

/** A painted wooden sign board with text and an optional emoji-free glyph. */
export function signBoard(g: THREE.Object3D, text: string, x: number, y: number, z: number, o: { w?: number; h?: number; bg?: string; fg?: string; frame?: string; glyph?: string } = {}) {
  const w = o.w ?? 0.9;
  const h = o.h ?? 0.22;
  const key = `${text}|${o.bg}|${o.fg}|${o.glyph}|${w}|${h}`;
  let face = signCache.get(key);
  if (!face) {
    const cw = 512;
    const ch = Math.round((cw * h) / w);
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = o.bg ?? P.cream;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, cw - 20, ch - 20);
    ctx.fillStyle = o.fg ?? P.ink;
    let size = ch * 0.62;
    ctx.font = `700 ${size}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
    const glyphW = o.glyph ? ch * 0.7 : 0;
    while (ctx.measureText(text).width > cw - 50 - glyphW && size > 10) {
      size -= 2;
      ctx.font = `700 ${size}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2 + glyphW / 2, ch / 2 + size * 0.05);
    if (o.glyph) drawGlyph(ctx, o.glyph, cw / 2 - ctx.measureText(text).width / 2 - glyphW * 0.35, ch / 2, ch * 0.5, o.fg ?? P.ink);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    signCache.set(key, face);
  }
  box(g, w + 0.06, h + 0.06, 0.05, mat(o.frame ?? P.woodDark), x, y - 0.03, z, 0.02);
  put(g, cached(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h)), face, [x, y + h / 2, z + 0.03]);
}

/** Tiny vector glyphs painted on signs (cup, bread, flower, hammer, basket, pie). */
function drawGlyph(ctx: CanvasRenderingContext2D, glyph: string, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = 'round';
  switch (glyph) {
    case 'cup':
      ctx.beginPath();
      ctx.roundRect(-s * 0.4, -s * 0.2, s * 0.6, s * 0.55, s * 0.12);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.25, s * 0.05, s * 0.15, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      for (const dx of [-0.25, -0.05]) {
        ctx.beginPath();
        ctx.moveTo(s * dx, -s * 0.3);
        ctx.quadraticCurveTo(s * (dx + 0.1), -s * 0.45, s * dx, -s * 0.6);
        ctx.stroke();
      }
      break;
    case 'bread':
    case 'pie':
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.5, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff8';
      for (const dx of [-0.2, 0, 0.2]) {
        ctx.beginPath();
        ctx.moveTo(s * (dx - 0.06), -s * 0.15);
        ctx.lineTo(s * (dx + 0.06), s * 0.12);
        ctx.stroke();
      }
      if (glyph === 'pie') {
        ctx.fillStyle = '#c03a5a';
        ctx.beginPath();
        ctx.arc(0, -s * 0.05, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.25, Math.sin(a) * s * 0.25, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'hammer':
      ctx.rotate(-0.6);
      ctx.fillRect(-s * 0.06, -s * 0.2, s * 0.12, s * 0.7);
      ctx.fillRect(-s * 0.3, -s * 0.4, s * 0.6, s * 0.22);
      break;
    case 'basket':
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, -s * 0.05);
      ctx.lineTo(s * 0.45, -s * 0.05);
      ctx.lineTo(s * 0.32, s * 0.4);
      ctx.lineTo(-s * 0.32, s * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.32, Math.PI, 0);
      ctx.stroke();
      break;
    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.2 : s * 0.45;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.fill();
      break;
  }
  ctx.restore();
}

export function chimney(g: THREE.Object3D, x: number, y: number, z: number, h = 0.45, color: string = P.barn) {
  box(g, 0.18, h, 0.18, mat(color, { map: TEX.brick(), repeat: [1, 2] }), x, y, z, 0.015);
  box(g, 0.24, 0.05, 0.24, mat(P.stoneDark), x, y + h, z, 0.015);
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y + h + 0.08, z);
  anchor.name = 'smoke';
  g.add(anchor);
}

export function lampPost(g: THREE.Object3D, x: number, z: number, h = 0.9) {
  const iron = mat('#3b4250', { metalness: 0.4, roughness: 0.5 });
  cyl(g, 0.07, 0.09, 0.06, iron, x, 0, z, 10);
  cyl(g, 0.025, 0.03, h, iron, x, 0.06, z, 8);
  box(g, 0.13, 0.03, 0.13, iron, x, h + 0.06, z, 0.01);
  put(g, rboxGeo(0.1, 0.12, 0.1, 0.02), bulb, [x, h + 0.15, z]);
  cone(g, 0.1, 0.07, iron, x, h + 0.21, z, 4);
  const anchor = new THREE.Object3D();
  anchor.position.set(x, h + 0.15, z);
  anchor.name = 'light';
  g.add(anchor);
}

export function bench(g: THREE.Object3D, x: number, z: number, rotY = 0, w = 0.6) {
  const holder = new THREE.Group();
  holder.position.set(x, 0, z);
  holder.rotation.y = rotY;
  g.add(holder);
  const wood = mat(P.wood, { map: TEX.planks(), repeat: [2, 1] });
  const iron = mat('#4a4f5a', { metalness: 0.3, roughness: 0.6 });
  for (const s of [-1, 1]) {
    box(holder, 0.04, 0.2, 0.2, iron, (s * w) / 2.4, 0, 0, 0.01);
    box(holder, 0.04, 0.22, 0.04, iron, (s * w) / 2.4, 0.2, -0.09, 0.01);
  }
  box(holder, w, 0.04, 0.2, wood, 0, 0.18, 0, 0.012);
  box(holder, w, 0.12, 0.03, wood, 0, 0.26, -0.1, 0.012);
}

export function cafeTable(g: THREE.Object3D, x: number, z: number, parasol?: [string, string]) {
  const iron = mat('#4a4f5a', { metalness: 0.3, roughness: 0.6 });
  cyl(g, 0.14, 0.14, 0.03, mat(P.trim), x, 0.28, z, 14);
  cyl(g, 0.015, 0.02, 0.28, iron, x, 0, z, 6);
  for (const a of [0, Math.PI]) {
    const cx = x + Math.cos(a) * 0.2;
    const cz = z + Math.sin(a) * 0.2;
    box(g, 0.12, 0.03, 0.12, mat(P.wood), cx, 0.16, cz, 0.01);
    box(g, 0.12, 0.13, 0.025, mat(P.wood), cx + Math.cos(a) * 0.05, 0.17, cz, 0.008, [0, a + Math.PI / 2, 0]);
    cyl(g, 0.012, 0.012, 0.16, iron, cx, 0, cz, 5);
  }
  if (parasol) {
    cyl(g, 0.012, 0.012, 0.62, mat(P.trim), x, 0.3, z, 6);
    const segs = 8;
    for (let i = 0; i < segs; i++) {
      const geo = cached('parasolSeg', () => new THREE.ConeGeometry(0.34, 0.16, 8, 1, true, 0, (Math.PI * 2) / 8));
      put(g, geo, mat(i % 2 ? parasol[0] : parasol[1], { side: THREE.DoubleSide }), [x, 0.92, z], [0, (i * Math.PI * 2) / segs, 0]);
    }
  }
}

export function picketFence(g: THREE.Object3D, x0: number, z0: number, x1: number, z1: number, color: string = P.trim) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(2, Math.round(len / 0.09));
  const ang = Math.atan2(z1 - z0, x1 - x0);
  const m = mat(color);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    box(g, 0.035, 0.22, 0.02, m, x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, 0.008, [0, -ang, 0]);
  }
  box(g, len, 0.025, 0.015, m, (x0 + x1) / 2, 0.15, (z0 + z1) / 2, 0.005, [0, -ang, 0]);
  box(g, len, 0.025, 0.015, m, (x0 + x1) / 2, 0.06, (z0 + z1) / 2, 0.005, [0, -ang, 0]);
}

export function bush(g: THREE.Object3D, x: number, z: number, s = 1, color: string = P.leaf) {
  const m = mat(color, { roughness: 0.9 });
  sphere(g, 0.16 * s, m, x, 0.12 * s, z, 9);
  sphere(g, 0.12 * s, m, x + 0.1 * s, 0.1 * s, z + 0.05 * s, 8);
  sphere(g, 0.11 * s, mat(shadeHex(color, 0.08)), x - 0.08 * s, 0.14 * s, z + 0.06 * s, 8);
}

export function shadeHex(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return `#${c.getHexString()}`;
}

/**
 * Bake: merge every static mesh in a group into one mesh per material
 * (draw-call reduction). Named anchors and `userData.keep` children survive.
 */
export function bake(src: THREE.Group): THREE.Group {
  src.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const out = new THREE.Group();
  const keep: THREE.Object3D[] = [];
  src.traverse((o) => {
    if (o === src) return;
    if (o.userData.keep) {
      keep.push(o);
      return;
    }
    if (hasKeptAncestor(o, src)) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && !(m as THREE.SkinnedMesh).isSkinnedMesh && !Array.isArray(m.material)) {
      let geo = toFloat(m.geometry).applyMatrix4(m.matrixWorld);
      if (geo.index) geo = geo.toNonIndexed();
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((geo.attributes.position.count) * 2), 2));
      const list = byMat.get(m.material) ?? [];
      list.push(geo);
      byMat.set(m.material, list);
    } else if (o.name === 'smoke' || o.name === 'light' || o.name === 'bubble') {
      const a = new THREE.Object3D();
      a.name = o.name;
      a.position.setFromMatrixPosition(o.matrixWorld);
      out.add(a);
    }
  });
  for (const [m, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    out.add(mesh);
  }
  for (const k of keep) {
    const c = k.clone();
    k.matrixWorld.decompose(c.position, c.quaternion, c.scale);
    out.add(c);
  }
  return out;
}

/** Copy a geometry with every attribute as Float32 (glTF quantised/normalised ints → floats). */
function toFloat(src: THREE.BufferGeometry) {
  const g = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(src.attributes)) {
    const attr = a as THREE.BufferAttribute;
    if (attr.array instanceof Float32Array && !(attr as unknown as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute) {
      g.setAttribute(name, attr.clone());
      continue;
    }
    const out = new Float32Array(attr.count * attr.itemSize);
    for (let i = 0; i < attr.count; i++)
      for (let k = 0; k < attr.itemSize; k++) out[i * attr.itemSize + k] = attr.getComponent(i, k);
    g.setAttribute(name, new THREE.BufferAttribute(out, attr.itemSize));
  }
  if (src.index) g.setIndex(src.index.clone());
  return g;
}

function hasKeptAncestor(o: THREE.Object3D, root: THREE.Object3D) {
  let p = o.parent;
  while (p && p !== root) {
    if (p.userData.keep) return true;
    p = p.parent;
  }
  return false;
}

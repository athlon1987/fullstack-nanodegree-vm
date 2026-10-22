// Procedural "ink doodle" enemies drawn in the same line-art style as the
// heroes: dark ink outlines on paper, with marker-coloured hatching.
import { clamp, hash } from '../core/math';
import type { Enemy } from '../game/enemy';

export const INK = '#23202e';
const PAPER = '#fffbf2';

let SEED = 0;
let BOIL = 0;
let FLASH = false;

const j = (n: number, amp = 1.6): number => (hash(SEED * 13.1 + n * 7.7 + BOIL * 3.3) - 0.5) * 2 * amp;

function inkStyle(g: CanvasRenderingContext2D, w = 3.2): void {
  g.strokeStyle = INK;
  g.lineWidth = w;
  g.lineJoin = 'round';
  g.lineCap = 'round';
}

function fill(c: string): string {
  return FLASH ? '#ffffff' : c;
}

function blobPath(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, n = 12, wob = 0.06): void {
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (hash(SEED + i * 3.7) - 0.5) * wob * 2;
    const x = cx + Math.cos(a) * rx * k + j(i, 0.8);
    const y = cy + Math.sin(a) * ry * k + j(i + 50, 0.8);
    if (i === 0) g.moveTo(x, y);
    else {
      const pa = ((i - 0.5) / n) * Math.PI * 2;
      g.quadraticCurveTo(cx + Math.cos(pa) * rx * 1.04, cy + Math.sin(pa) * ry * 1.04, x, y);
    }
  }
  g.closePath();
}

function hatch(g: CanvasRenderingContext2D, color: string, x0: number, y0: number, x1: number, y1: number, gap = 7): void {
  if (FLASH) return;
  g.save();
  g.clip();
  g.strokeStyle = color;
  g.globalAlpha = 0.85;
  g.lineWidth = 3.4;
  g.lineCap = 'round';
  // a separate Path2D keeps the outline as the current path for the ink stroke that follows
  const lines = new Path2D();
  for (let x = x0 - (y1 - y0); x < x1; x += gap) {
    lines.moveTo(x + j(x, 1.2), y1);
    lines.lineTo(x + (y1 - y0) + j(x + 9, 1.2), y0);
  }
  g.stroke(lines);
  g.restore();
}

function shape(g: CanvasRenderingContext2D, color: string | null, bounds: [number, number, number, number], gap = 7, base = PAPER): void {
  g.fillStyle = fill(base);
  g.fill();
  if (color) hatch(g, color, ...bounds, gap);
  inkStyle(g);
  g.stroke();
}

function line(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w = 3.2): void {
  inkStyle(g, w);
  g.beginPath();
  g.moveTo(x0, y0);
  g.quadraticCurveTo((x0 + x1) / 2 + j(x0 + y1, 2), (y0 + y1) / 2 + j(x1 + y0, 2), x1, y1);
  g.stroke();
}

function dot(g: CanvasRenderingContext2D, x: number, y: number, r: number, color = INK): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function eye(g: CanvasRenderingContext2D, x: number, y: number, r: number, angry: boolean, look = 1): void {
  g.fillStyle = fill(PAPER);
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  inkStyle(g, 2.4);
  g.stroke();
  dot(g, x + look * r * 0.35, y + r * 0.1, r * 0.45);
  if (angry) line(g, x - r * 1.1, y - r * 1.5, x + r * 1.1, y - r * 0.9, 2.6);
}

function fist(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  blobPath(g, x, y, r, r * 0.9, 8);
  shape(g, color, [x - r, y - r, x + r, y + r], 6);
}

function limbsWalk(e: Enemy): number {
  return e.state === 'move' ? Math.sin(e.animT * 0.3) : 0;
}

/** Attack pose progress: -1..0 windup, 0..1 strike, 1 recovery. */
function swing(e: Enemy): { wind: number; hit: number } {
  const a = e.attack;
  if (!a) return { wind: 0, hit: 0 };
  const d = a.def;
  if (a.t <= d.startup) return { wind: a.t / Math.max(1, d.startup), hit: 0 };
  const r = (a.t - d.startup - d.active) / Math.max(1, d.recovery);
  return { wind: 0, hit: r <= 0 ? 1 : clamp(1 - r, 0, 1) };
}

export function drawEnemyArt(g: CanvasRenderingContext2D, e: Enemy, frame: number, reduced: boolean): void {
  SEED = e.id * 1.37;
  BOIL = reduced ? 0 : Math.floor(frame / 8) % 3;
  FLASH = e.flash > 0 && frame % 4 < 2;
  if (e.telegraphing && frame % 8 < 3 && !FLASH) FLASH = true;
  const walk = limbsWalk(e);
  const { wind, hit } = swing(e);
  switch (e.kind) {
    case 'scribbler':
    case 'bigScribbler':
      scribbler(g, e, walk, wind, hit);
      break;
    case 'dart':
      dart(g, e, walk, wind, hit);
      break;
    case 'brute':
      brute(g, e, walk, wind, hit);
      break;
    case 'slinger':
      slinger(g, e, walk, wind, hit);
      break;
    case 'knight':
      knight(g, e, walk, wind, hit, '#495057', '#adb5bd');
      break;
    case 'highlighter':
      knight(g, e, walk, wind, hit, '#f9c80e', '#fff3b0');
      break;
    case 'bomb':
      bomb(g, e, walk, frame);
      break;
    case 'thornback':
      rhino(g, e, walk, wind, hit);
      break;
    case 'golem':
      golem(g, e, walk, wind, hit, frame);
      break;
    case 'smudgeKing':
    case 'smudgeTwin':
      smudge(g, e, frame, wind, hit);
      break;
  }
  FLASH = false;
}

function scribbler(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number): void {
  const big = e.kind === 'bigScribbler';
  const c = e.def.color;
  // legs
  line(g, -8, -30, -12 - walk * 10, 0);
  line(g, 8, -30, 12 + walk * 10, 0);
  line(g, -12 - walk * 10, 0, -2 - walk * 10, 0);
  line(g, 12 + walk * 10, 0, 22 + walk * 10, 0);
  // back arm
  line(g, -18, -58, -36, -44 + walk * 4);
  fist(g, -38, -42 + walk * 4, 7, c);
  // body
  const squash = e.state === 'hitstun' ? 0.92 : 1;
  blobPath(g, 0, -62, 30, 34 * squash, 12, 0.08);
  shape(g, c, [-32, -98, 32, -26]);
  // scribble "hair"
  inkStyle(g, 2.6);
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = -14 + i * 6;
    g.moveTo(x, -94);
    g.quadraticCurveTo(x + 6, -110 + j(i, 3), x + 3, -100);
  }
  g.stroke();
  // face
  eye(g, 9, -70, 6, true);
  eye(g, 22, -70, 5, true);
  line(g, 8, -52, 22, -54, 2.6);
  if (big) {
    // paper crown
    g.beginPath();
    g.moveTo(-18, -96);
    g.lineTo(-14, -116);
    g.lineTo(-5, -102);
    g.lineTo(3, -120);
    g.lineTo(10, -102);
    g.lineTo(18, -116);
    g.lineTo(20, -96);
    g.closePath();
    shape(g, '#ffd23f', [-20, -122, 22, -94], 5);
  }
  // front arm: wind back, then punch forward
  const ax = 34 - wind * 22 + hit * 26;
  const ay = -46 - wind * 10 - hit * 8;
  if (e.attack?.def.id === 'b_pound') {
    const up = wind > 0 ? wind : 1 - hit;
    line(g, 18, -60, 20, -60 - up * 50);
    fist(g, 22, -64 - up * 52, 11, c);
    line(g, -18, -60, -16, -60 - up * 46);
    fist(g, -14, -62 - up * 48, 11, c);
    return;
  }
  line(g, 20, -58, ax, ay);
  fist(g, ax + 4, ay, big ? 10 : 8, c);
}

function dart(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number): void {
  const c = e.def.color;
  const lean = hit * 0.25 - wind * 0.15;
  g.save();
  g.rotate(lean);
  for (let i = 0; i < 2; i++) {
    const ph = i === 0 ? walk : -walk;
    line(g, -6 + i * 12, -16, -10 + i * 12 + ph * 12, 0);
  }
  // tail
  line(g, -26, -30, -46, -40 + walk * 5);
  g.beginPath();
  g.moveTo(-30, -18);
  g.quadraticCurveTo(-28, -46, 4, -50);
  g.quadraticCurveTo(34, -46, 36, -30);
  g.quadraticCurveTo(30, -14, 0, -14);
  g.closePath();
  shape(g, c, [-32, -52, 38, -12], 6);
  // beak
  g.beginPath();
  g.moveTo(32, -36);
  g.lineTo(52 + hit * 8, -30);
  g.lineTo(32, -26);
  g.closePath();
  shape(g, '#ffd23f', [30, -38, 56, -24], 5);
  eye(g, 18, -38, 7, true);
  g.restore();
}

function brute(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number): void {
  const c = e.def.color;
  line(g, -22, -40, -26 - walk * 8, 0, 6);
  line(g, 22, -40, 26 + walk * 8, 0, 6);
  // body
  g.beginPath();
  g.moveTo(-46, -50);
  g.quadraticCurveTo(-52, -120, -30, -136);
  g.quadraticCurveTo(0, -146, 30, -136);
  g.quadraticCurveTo(52, -120, 46, -50);
  g.quadraticCurveTo(0, -30, -46, -50);
  g.closePath();
  shape(g, c, [-52, -146, 52, -32], 8);
  // armour plate
  if (e.armorPts > 0) {
    const k = e.armorPts / Math.max(1, e.maxArmor);
    g.beginPath();
    g.moveTo(-28, -116);
    g.lineTo(28, -116);
    g.lineTo(24, -66);
    g.lineTo(0, -56);
    g.lineTo(-24, -66);
    g.closePath();
    shape(g, null, [0, 0, 0, 0], 8, '#ced4da');
    if (k < 0.7) line(g, -12, -110, 4, -88, 2.4);
    if (k < 0.4) line(g, 10, -112, -2, -70, 2.4);
  }
  // head
  blobPath(g, 4, -144, 20, 16, 10);
  shape(g, c, [-16, -160, 24, -128], 6);
  eye(g, 10, -146, 5, true);
  // arms
  const slam = e.attack?.def.id === 'e_slam';
  if (slam) {
    const up = wind > 0 ? wind : 1 - hit;
    line(g, 30, -120, 26, -120 - up * 40, 7);
    line(g, -30, -120, -22, -120 - up * 40, 7);
    fist(g, 20 + (1 - up) * 30, -128 - up * 40 + (1 - up) * 100, 18, c);
    fist(g, -16 + (1 - up) * 30, -128 - up * 40 + (1 - up) * 100, 18, c);
  } else {
    const ax = 50 - wind * 20 + hit * 34;
    line(g, -40, -112, -56, -70 + walk * 6, 7);
    fist(g, -58, -66 + walk * 6, 16, c);
    line(g, 40, -112, ax, -80, 7);
    fist(g, ax + 6, -78, 17, c);
  }
}

function slinger(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number): void {
  const c = e.def.color;
  line(g, -8, -26, -10 - walk * 8, 0);
  line(g, 8, -26, 10 + walk * 8, 0);
  // ink bottle body
  g.beginPath();
  g.moveTo(-22, -26);
  g.lineTo(-24, -66);
  g.quadraticCurveTo(-22, -74, -10, -76);
  g.lineTo(-10, -86);
  g.lineTo(10, -86);
  g.lineTo(10, -76);
  g.quadraticCurveTo(22, -74, 24, -66);
  g.lineTo(22, -26);
  g.closePath();
  shape(g, c, [-26, -88, 26, -24], 7);
  // label + nib hat
  g.beginPath();
  g.rect(-14, -58, 28, 16);
  shape(g, null, [0, 0, 0, 0], 7);
  g.beginPath();
  g.moveTo(-12, -86);
  g.lineTo(0, -108);
  g.lineTo(12, -86);
  g.closePath();
  shape(g, null, [0, 0, 0, 0], 7, '#adb5bd');
  eye(g, 6, -68, 4.5, false, 1);
  // throwing arm with an ink blob
  const ang = wind > 0 ? -2.2 * wind : -2.2 + hit * 2.6;
  const ax = 18 + Math.cos(ang) * 26;
  const ay = -62 + Math.sin(ang) * 26;
  line(g, 16, -62, ax, ay);
  if (wind > 0) {
    blobPath(g, ax, ay - 4, 9, 8, 8);
    shape(g, null, [0, 0, 0, 0], 7, INK);
  }
  line(g, -16, -62, -30, -44 + walk * 4);
}

function knight(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number, color: string, light: string): void {
  const tall = e.kind === 'highlighter';
  const H = tall ? 150 : 124;
  line(g, -10, -30, -12 - walk * 8, 0, 4);
  line(g, 10, -30, 12 + walk * 8, 0, 4);
  // marker body: capsule
  g.beginPath();
  g.moveTo(-20, -28);
  g.lineTo(-22, -H + 30);
  g.quadraticCurveTo(-20, -H + 6, 0, -H + 2);
  g.quadraticCurveTo(20, -H + 6, 22, -H + 30);
  g.lineTo(20, -28);
  g.quadraticCurveTo(0, -20, -20, -28);
  g.closePath();
  shape(g, tall ? null : color, [-24, -H, 24, -20], 6, tall ? color : PAPER);
  // cap band
  g.beginPath();
  g.rect(-22, -H + 26, 44, 12);
  shape(g, null, [0, 0, 0, 0], 6, light);
  // visor eyes
  g.beginPath();
  g.rect(-4, -H + 46, 22, 9);
  shape(g, null, [0, 0, 0, 0], 6, INK);
  dot(g, 10, -H + 50, 2.6, tall ? '#fff3b0' : '#ff595e');
  // lance (marker nib)
  const thrust = hit * 40 - wind * 16;
  line(g, 18, -70, 46 + thrust, -70, 5);
  g.beginPath();
  g.moveTo(46 + thrust, -78);
  g.lineTo(66 + thrust, -70);
  g.lineTo(46 + thrust, -62);
  g.closePath();
  shape(g, null, [0, 0, 0, 0], 6, tall ? '#fff3b0' : color);
  // shield
  if (e.shieldUp) {
    g.beginPath();
    g.moveTo(26, -110);
    g.quadraticCurveTo(46, -112, 44, -86);
    g.quadraticCurveTo(44, -44, 26, -34);
    g.quadraticCurveTo(18, -60, 26, -110);
    g.closePath();
    shape(g, null, [0, 0, 0, 0], 6, light);
    line(g, 33, -98, 33, -48, 2.4);
  } else if (e.guardBreakT > 0) {
    // shield knocked aside
    g.save();
    g.translate(-30, -60);
    g.rotate(-0.8);
    g.beginPath();
    g.ellipse(0, 0, 12, 30, 0, 0, Math.PI * 2);
    shape(g, null, [0, 0, 0, 0], 6, light);
    g.restore();
  }
  if (tall && e.attack?.def.id === 'b_beam' && e.attackPhase === 'startup') {
    g.fillStyle = 'rgba(249,248,113,0.6)';
    g.beginPath();
    g.arc(66, -70, 6 + wind * 10, 0, Math.PI * 2);
    g.fill();
  }
}

function bomb(g: CanvasRenderingContext2D, e: Enemy, walk: number, frame: number): void {
  line(g, -8, -10, -10 - walk * 6, 0);
  line(g, 8, -10, 10 + walk * 6, 0);
  const lit = e.fuse >= 0;
  const col = lit && frame % 8 < 4 ? '#ff595e' : e.def.color;
  const swell = lit ? 1 + (1 - e.fuse / 70) * 0.25 : 1;
  blobPath(g, 0, -28, 24 * swell, 24 * swell, 10, 0.04);
  shape(g, col, [-30, -56, 30, 0], 6);
  line(g, 4, -52, 12, -66);
  dot(g, 13, -68, 4 + (frame % 6 < 3 ? 2 : 0), '#ffd23f');
  eye(g, 8, -32, 5, false, 1);
  eye(g, -4, -32, 4, false, 1);
  if (lit) line(g, -2, -18, 12, -18, 2.4);
}

function rhino(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number): void {
  const c = e.def.color;
  const charging = e.attack?.def.id === 'b_charge' && e.attackPhase === 'active';
  const gait = charging ? Math.sin(e.animT * 0.8) : walk;
  for (const [x, ph] of [[-44, 1], [-20, -1], [26, 1], [48, -1]] as const) line(g, x, -40, x + gait * ph * 10, 0, 7);
  // quills
  inkStyle(g, 3);
  g.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = -50 + i * 14;
    g.moveTo(x, -104);
    g.lineTo(x - 8, -130 - (i % 2) * 8);
  }
  g.stroke();
  blobPath(g, -4, -72, 70, 42, 12, 0.05);
  shape(g, c, [-76, -116, 68, -28], 8);
  // head
  const hx = 62 + hit * 6 - wind * 6;
  blobPath(g, hx, -74, 30, 24, 10);
  shape(g, c, [hx - 32, -100, hx + 32, -48], 7);
  g.beginPath();
  g.moveTo(hx + 18, -86);
  g.quadraticCurveTo(hx + 40, -100, hx + 38, -124);
  g.quadraticCurveTo(hx + 30, -96, hx + 24, -78);
  g.closePath();
  shape(g, null, [0, 0, 0, 0], 6, '#fff3b0');
  eye(g, hx + 6, -82, 6, true);
  if (e.stunT > 0) line(g, hx - 4, -64, hx + 16, -62, 2.4);
}

function golem(g: CanvasRenderingContext2D, e: Enemy, walk: number, wind: number, hit: number, frame: number): void {
  const c = e.def.color;
  line(g, -40, -60, -46 - walk * 8, 0, 9);
  line(g, 40, -60, 46 + walk * 8, 0, 9);
  // base
  g.beginPath();
  g.moveTo(-90, -60);
  g.lineTo(96, -60);
  g.quadraticCurveTo(104, -40, 90, -36);
  g.lineTo(-86, -36);
  g.quadraticCurveTo(-98, -46, -90, -60);
  g.closePath();
  shape(g, c, [-100, -64, 106, -32], 8);
  // jaw opening
  let open = 0.05;
  const id = e.attack?.def.id;
  if (id === 'b_chomp') open = wind > 0 ? 0.55 * wind : 0.55 * (1 - hit);
  if (id === 'b_volley') open = wind > 0 ? 0.25 * wind : 0.25;
  if (e.stunT > 0 && e.openT > 0) open = 0.5 + Math.sin(frame * 0.5) * 0.03;
  g.save();
  g.translate(-84, -70);
  g.rotate(-open);
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, -60);
  g.quadraticCurveTo(10, -88, 60, -86);
  g.lineTo(176, -60);
  g.quadraticCurveTo(190, -40, 178, -14);
  g.lineTo(10, 6);
  g.closePath();
  shape(g, c, [0, -92, 192, 8], 9, '#dee2e6');
  eye(g, 120, -50, 11, true);
  eye(g, 150, -44, 9, true);
  // staple teeth
  inkStyle(g, 3);
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    g.moveTo(100 + i * 14, -8);
    g.lineTo(100 + i * 14, 2);
  }
  g.stroke();
  g.restore();
  // hinge
  dot(g, -84, -70, 9, INK);
}

function smudge(g: CanvasRenderingContext2D, e: Enemy, frame: number, wind: number, hit: number): void {
  const twin = e.kind === 'smudgeTwin';
  const rx = twin ? 42 : 78 * (e.phase === 3 ? 1.12 : 1);
  const ry = twin ? 66 : 112 * (e.phase === 3 ? 1.12 : 1);
  const cy = -ry - 6;
  // drips
  g.fillStyle = fill('#1b1730');
  for (let i = 0; i < 5; i++) {
    const x = -rx * 0.7 + i * rx * 0.35;
    const len = 10 + ((frame * 0.3 + i * 17) % 18);
    g.beginPath();
    g.ellipse(x, -4 + len * 0.3, 6, len * 0.5, 0, 0, Math.PI * 2);
    g.fill();
  }
  blobPath(g, 0, cy, rx, ry, 14, 0.09);
  g.fillStyle = fill(twin ? '#3c096c' : '#1b1730');
  g.fill();
  inkStyle(g, 4);
  g.stroke();
  // glowing core when open
  if (e.openT > 0 && !twin) {
    g.fillStyle = `rgba(255, 210, 63, ${0.5 + Math.sin(frame * 0.4) * 0.3})`;
    g.beginPath();
    g.arc(0, cy + 20, 26, 0, Math.PI * 2);
    g.fill();
    line(g, -20, cy + 6, 4, cy + 34, 2.4);
    line(g, 18, cy, 2, cy + 30, 2.4);
  }
  // eyes
  const ey = cy - ry * 0.25;
  for (const ex of [rx * 0.15, rx * 0.5]) {
    g.fillStyle = '#fff3b0';
    g.beginPath();
    g.ellipse(ex, ey, twin ? 6 : 10, twin ? 8 : 13, 0, 0, Math.PI * 2);
    g.fill();
    dot(g, ex + 3, ey + 2, twin ? 3 : 5);
  }
  // crown
  const crownW = twin ? 22 : 40;
  g.beginPath();
  g.moveTo(-crownW, cy - ry + 10);
  g.lineTo(-crownW + 4, cy - ry - 22);
  g.lineTo(-crownW * 0.4, cy - ry - 4);
  g.lineTo(0, cy - ry - 30);
  if (!twin) {
    g.lineTo(crownW * 0.4, cy - ry - 4);
    g.lineTo(crownW - 4, cy - ry - 22);
    g.lineTo(crownW, cy - ry + 10);
  } else g.lineTo(4, cy - ry + 10);
  g.closePath();
  shape(g, '#f9c80e', [-crownW, cy - ry - 32, crownW, cy - ry + 12], 5, '#fff3b0');
  // hands
  const reach = hit * 40 - wind * 20;
  const hy = cy + ry * 0.35 + Math.sin(frame * 0.08) * 6;
  for (const side of [-1, 1]) {
    const hx = side * (rx + 26) + (side > 0 ? reach : 0);
    blobPath(g, hx, hy, twin ? 14 : 22, twin ? 12 : 18, 8);
    shape(g, null, [0, 0, 0, 0], 6, twin ? '#3c096c' : '#1b1730');
  }
}

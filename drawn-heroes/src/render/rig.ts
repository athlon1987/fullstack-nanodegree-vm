// Image-based animation for the hand-drawn heroes: each drawing is cut into a
// few layers (head, arms, tail, body) that rotate around hand-picked pivots,
// combined with squash/stretch, lean, paper-flip spins and motion trails.
import { clamp } from '../core/math';
import type { HeroDef } from '../data/heroes';
import type { Hero } from '../game/hero';
import type { CharSprite } from './sprites';

export interface Pose {
  offX: number;
  offY: number;
  lean: number; // shear
  sx: number;
  sy: number;
  rot: number; // whole-body rotation around the body centre
  flip: number; // horizontal paper-flip factor (-1..1), used for spins
  head: number;
  armL: number; // front arm (Momo)
  armR: number; // back arm (Momo)
  armDX: number; // front arm push
  tail: number;
}

export const restPose = (): Pose => ({ offX: 0, offY: 0, lean: 0, sx: 1, sy: 1, rot: 0, flip: 1, head: 0, armL: 0, armR: 0, armDX: 0, tail: 0 });

/** Phase of the current attack: 0..1 through startup, then 1..2 through active+recovery. */
function attackK(h: Hero): { s: number; a: number; r: number } {
  const at = h.attack;
  if (!at) return { s: 1, a: 1, r: 1 };
  const d = at.def;
  const s = clamp(at.t / Math.max(1, d.startup), 0, 1);
  const a = clamp((at.t - d.startup) / Math.max(1, d.active), 0, 1);
  const r = clamp((at.t - d.startup - d.active) / Math.max(1, d.recovery), 0, 1);
  return { s, a, r };
}

export function heroPose(h: Hero, frame: number): Pose {
  const p = restPose();
  const t = h.animT;
  const momo = h.heroId === 'momo';
  const wag = Math.sin(frame * (momo ? 0.08 : 0.35));
  p.tail = wag * (momo ? 0.12 : 0.28);
  // squash on landing
  if (h.squash > 0) {
    p.sy = 1 - h.squash * 0.22;
    p.sx = 1 + h.squash * 0.18;
  }
  switch (h.state) {
    case 'idle':
      p.offY = -Math.abs(Math.sin(t * 0.06)) * 2;
      p.sy *= 1 + Math.sin(t * 0.06) * 0.015;
      p.head = Math.sin(t * 0.04) * 0.04;
      p.armL = Math.sin(t * 0.07) * 0.08;
      p.armR = -Math.sin(t * 0.07) * 0.08;
      break;
    case 'move': {
      const c = t * (momo ? 0.32 : 0.28);
      p.offY = -Math.abs(Math.sin(c)) * (momo ? 9 : 6);
      p.lean = -0.1;
      p.rot = Math.sin(c) * 0.05;
      p.armL = Math.sin(c) * 0.45;
      p.armR = -Math.sin(c) * 0.45;
      p.head = Math.sin(c * 2) * 0.03;
      p.tail = Math.sin(c * 2) * (momo ? 0.25 : 0.45);
      if (Math.sin(c) > 0.95) {
        p.sy *= 0.96;
        p.sx *= 1.03;
      }
      break;
    }
    case 'air':
      if (h.vy > 2) {
        p.sy *= 1.08;
        p.sx *= 0.93;
        p.armL = 0.7;
        p.armR = -0.7;
      } else {
        p.armL = -0.3;
        p.armR = 0.3;
        p.rot = h.airJumps < h.def.airJumps ? ((t * 0.35) % (Math.PI * 2)) * -1 : 0; // double-jump somersault
      }
      p.tail = 0.4;
      break;
    case 'dodge': {
      const k = clamp(h.stateT / 18, 0, 1);
      p.rot = -k * Math.PI * 2;
      p.sy *= 0.85;
      p.offY = -Math.sin(k * Math.PI) * 18;
      break;
    }
    case 'block':
      p.sy *= 0.93;
      p.sx *= 1.03;
      p.lean = 0.05;
      p.armL = -0.5;
      p.armR = -1.1;
      p.head = 0.08;
      break;
    case 'hitstun':
      p.rot = 0.18;
      p.lean = 0.12;
      p.armL = 0.9;
      p.armR = -0.9;
      p.head = 0.15;
      p.offX = Math.sin(t * 2.2) * 2;
      break;
    case 'launched':
      p.rot = 0.3 + clamp(-h.vy * 0.04, -0.4, 0.6);
      p.armL = 1.1;
      p.armR = -1.1;
      p.tail = 0.6;
      break;
    case 'knockdown':
    case 'downed':
    case 'out':
      // flattened like a dropped sheet of paper
      p.sy = 0.32;
      p.sx = 1.22;
      p.rot = 0.05;
      p.armL = 1.2;
      p.armR = -1.2;
      break;
    case 'getup': {
      const k = clamp(h.stateT / 18, 0, 1);
      const spring = k < 0.6 ? 0.32 + (k / 0.6) * 0.85 : 1.17 - ((k - 0.6) / 0.4) * 0.17;
      p.sy = spring;
      p.sx = 1 + (1 - spring) * 0.4;
      break;
    }
    case 'attack':
      attackPose(h, p, momo);
      break;
    case 'script':
      scriptPose(h, p, frame);
      break;
  }
  if (h.reviving) {
    p.sy *= 0.9;
    p.armL = -0.9;
    p.head = 0.2;
  }
  return p;
}

function attackPose(h: Hero, p: Pose, momo: boolean): void {
  const at = h.attack!;
  const { s, a, r } = attackK(h);
  const id = at.def.id;
  const strike = s >= 1 ? 1 - r * 0.8 : 0; // 1 during active, fades in recovery
  const wind = s < 1 ? s : 0;
  if (momo) {
    switch (id) {
      case 'm_l1':
        p.armL = 0.25 * wind - 0.95 * strike;
        p.armDX = -18 * strike;
        p.lean = -0.08 * strike;
        p.head = -0.05 * strike;
        break;
      case 'm_l2':
        p.armL = 0.5 * strike;
        p.armR = -0.8 * strike;
        p.rot = -0.1 * strike;
        p.armDX = -10 * strike;
        p.lean = -0.06;
        break;
      case 'm_l3':
        p.flip = Math.cos((s * 0.4 + a * 0.6) * Math.PI * 2);
        p.tail = -1.2 * strike + 0.5 * wind;
        p.lean = -0.08;
        break;
      case 'm_l4':
        p.flip = Math.cos(Math.min(1, s * 0.3 + a * 0.7) * Math.PI * 2);
        p.armL = -0.6 * strike;
        p.armR = 0.6 * strike;
        p.offY = -12 * strike;
        break;
      case 'm_l5':
        p.rot = -Math.min(1, s * 0.2 + a * 0.8) * Math.PI * 2;
        p.offY = -18 * Math.sin(Math.min(1, a + s * 0.2) * Math.PI);
        break;
      case 'm_heavy': {
        const charge = at.def.charge ? at.charge / at.def.charge.max : 0;
        if (s < 1) {
          p.armL = 1.0 * s;
          p.armR = -1.0 * s;
          p.lean = 0.1 * s;
          p.sy *= 1 + 0.06 * s;
          p.offX = charge * Math.sin(at.t * 3) * 2;
        } else {
          p.armL = -0.8 * strike;
          p.armR = 0.4 * strike;
          p.armDX = -14 * strike;
          p.lean = -0.14 * strike;
          p.sy *= 1 - 0.14 * strike;
          p.sx *= 1 + 0.12 * strike;
        }
        break;
      }
      case 'm_air':
        p.rot = -0.7;
        p.armL = -0.6;
        p.tail = 0.8;
        break;
      case 'm_special':
        p.armL = s < 1 ? 1.1 * s : -0.9 * strike;
        p.armDX = -12 * strike;
        p.head = -0.06 * strike;
        break;
      default:
        p.armL = -0.6 * strike;
    }
  } else {
    switch (id) {
      case 's_l1':
      case 's_l2':
        p.offX = -(id === 's_l1' ? 14 : 18) * strike + 4 * wind;
        p.rot = (id === 's_l1' ? -0.12 : -0.18) * strike + 0.05 * wind;
        p.head = -0.08 * strike;
        p.sy *= 1 - 0.05 * strike;
        break;
      case 's_l3':
        p.head = 0.2 * wind - 0.4 * strike;
        p.offX = -20 * strike;
        p.lean = -0.18 * strike;
        p.rot = -0.08 * strike;
        break;
      case 's_heavy':
      case 's_heavy2': {
        const charge = at.def.charge ? at.charge / at.def.charge.max : 0;
        if (s < 1) {
          p.sy *= 1 - 0.14 * s;
          p.sx *= 1 + 0.08 * s;
          p.offX = charge * Math.sin(at.t * 3) * 2;
          p.head = 0.06;
        } else {
          p.sx *= 1 + 0.16 * strike;
          p.sy *= 1 - 0.08 * strike;
          p.rot = -0.25 * strike;
          p.offY = -Math.sin(a * Math.PI) * 26;
          p.tail = 0.8;
        }
        break;
      }
      case 's_air':
        p.rot = -0.12;
        p.sy *= 1.08;
        p.sx *= 0.94;
        break;
      case 's_bark':
      case 's_bark_echo':
        p.head = s < 1 ? 0.15 * s : -0.25 * strike;
        p.sx *= 1 + 0.08 * strike;
        p.lean = -0.12 * strike;
        break;
      default:
        p.offX = -10 * strike;
    }
  }
}

function scriptPose(h: Hero, p: Pose, frame: number): void {
  const t = h.scriptT;
  switch (h.script) {
    case 'ult':
      if (h.heroId === 'momo') {
        p.flip = Math.cos(t * 0.8);
        p.armL = -0.8;
        p.armR = 0.8;
      } else {
        p.head = t < 14 ? (t / 14) * 0.5 : 0.5 + Math.sin(frame * 0.6) * 0.04;
        p.sy *= t < 14 ? 1 - t * 0.006 : 1.06;
      }
      break;
    case 'coopBall':
      p.rot = -t * 0.55;
      p.sx *= 0.82;
      p.sy *= 0.82;
      break;
    case 'coopBrace':
      p.sy *= 0.82;
      p.sx *= 1.1;
      p.head = 0.15;
      break;
    case 'coopBoost':
      p.sy *= 0.86;
      p.armL = 1.1;
      p.armR = -1.1;
      break;
    case 'coopVault':
      p.rot = h.onGround ? 0 : -0.25;
      p.sy *= h.vy > 0 ? 1.1 : 1;
      break;
    case 'team':
      p.flip = Math.cos(frame * 0.25);
      p.armL = 1.0;
      p.armR = -1.0;
      p.head = Math.sin(frame * 0.3) * 0.1;
      break;
  }
}

/**
 * Draw a hero with feet at (sx, sy). `facing` is +1 for right. The drawings face
 * left naturally, so facing right mirrors them.
 */
export function drawHero(
  g: CanvasRenderingContext2D,
  spr: CharSprite,
  def: HeroDef,
  pose: Pose,
  sx: number,
  sy: number,
  scale: number,
  facing: number,
  flashA: number,
  alpha: number,
): void {
  const s = scale * def.drawScale;
  const ax = def.anchorX;
  const ay = def.anchorY;
  const cy = spr.height * 0.45; // rotation centre height above feet
  g.save();
  g.globalAlpha = alpha;
  g.translate(sx, sy);
  g.scale(s * (facing > 0 ? -1 : 1), s);
  g.translate(pose.offX, pose.offY);
  if (pose.lean) g.transform(1, 0, pose.lean, 1, 0, 0);
  g.scale(pose.sx * pose.flip, pose.sy);
  if (pose.rot) {
    g.translate(0, -cy);
    g.rotate(pose.rot);
    g.translate(0, cy);
  }
  for (const name of spr.order) {
    const part = spr.parts[name];
    if (!part) continue;
    const rot = name === 'head' ? pose.head : name === 'armL' ? pose.armL : name === 'armR' ? pose.armR : name === 'tail' ? pose.tail : 0;
    const dx = name === 'armL' ? pose.armDX : 0;
    const x = part.x - ax;
    const y = part.y - ay;
    if (rot || dx) {
      g.save();
      const px = part.px - ax + dx;
      const py = part.py - ay;
      g.translate(px, py);
      g.rotate(rot);
      g.translate(-px + dx, -py);
      g.drawImage(part.img, x, y);
      if (flashA > 0) {
        g.globalAlpha = alpha * flashA;
        g.drawImage(part.flash, x, y);
        g.globalAlpha = alpha;
      }
      g.restore();
    } else {
      g.drawImage(part.img, x, y);
      if (flashA > 0) {
        g.globalAlpha = alpha * flashA;
        g.drawImage(part.flash, x, y);
        g.globalAlpha = alpha;
      }
    }
  }
  g.restore();
}

/** Static full drawing (afterimages, menus). */
export function drawHeroStatic(g: CanvasRenderingContext2D, spr: CharSprite, def: HeroDef, sx: number, sy: number, scale: number, facing: number, alpha: number, flash = false): void {
  const s = scale * def.drawScale;
  g.save();
  g.globalAlpha = alpha;
  g.translate(sx, sy);
  g.scale(s * (facing > 0 ? -1 : 1), s);
  g.drawImage(flash ? spr.fullFlash : spr.full, -def.anchorX, -def.anchorY);
  g.restore();
}

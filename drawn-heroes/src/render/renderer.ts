import { FLOOR_BACK_Y, FLOOR_FRONT_Y, SCALE_BACK, SCALE_FRONT, VIEW_H, VIEW_W_MAX, VIEW_W_MIN, Z_MAX } from '../config';
import { clamp, hash } from '../core/math';
import { HEROES } from '../data/heroes';
import type { HeroId, ThemeId } from '../data/types';
import type { Enemy } from '../game/enemy';
import type { Hero } from '../game/hero';
import type { Projectile } from '../game/projectile';
import { CAR_WARN, HAND_WARN, PRESS_WARN, ROLLER_WARN, VENT_WARN, type Crate, type Pickup, type Platform } from '../game/stageObjects';
import type { World } from '../game/world';
import { THEMES, TILE_W, buildGrain, buildTiles, type ThemeTiles } from './backgrounds';
import { drawEnemyArt, INK } from './enemyArt';
import { drawHero, drawHeroStatic, heroPose } from './rig';
import type { CharSprite } from './sprites';

export interface RenderOptions {
  reduced: boolean;
  quality: 'high' | 'low';
}

type Drawable = { z: number; draw: () => void };

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly g: CanvasRenderingContext2D;
  viewW = 960;
  pxScale = 1; // device pixels per logical unit
  sprites: Record<HeroId, CharSprite>;
  private tiles = new Map<ThemeId, ThemeTiles>();
  private grain: HTMLCanvasElement;
  private grainPattern: CanvasPattern | null = null;
  private camX = 0;
  dprCap = 2;

  constructor(canvas: HTMLCanvasElement, sprites: Record<HeroId, CharSprite>) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d', { alpha: false })!;
    this.g.imageSmoothingQuality = 'high';
    this.sprites = sprites;
    this.grain = buildGrain();
  }

  /** Fit the logical view into the available CSS box. Returns the CSS size used. */
  resize(availW: number, availH: number, dpr: number): { w: number; h: number } {
    const aspect = availW / Math.max(1, availH);
    this.viewW = clamp(Math.round(VIEW_H * aspect), VIEW_W_MIN, VIEW_W_MAX);
    let cssW = availW;
    let cssH = (availW / this.viewW) * VIEW_H;
    if (cssH > availH) {
      cssH = availH;
      cssW = (availH / VIEW_H) * this.viewW;
    }
    const ratio = Math.min(dpr, this.dprCap);
    this.canvas.width = Math.max(1, Math.round(cssW * ratio));
    this.canvas.height = Math.max(1, Math.round(cssH * ratio));
    this.canvas.style.width = `${Math.round(cssW)}px`;
    this.canvas.style.height = `${Math.round(cssH)}px`;
    const newScale = this.canvas.height / VIEW_H;
    if (Math.abs(newScale - this.pxScale) > 0.15) this.tiles.clear();
    this.pxScale = newScale;
    this.grainPattern = null;
    this.g.imageSmoothingEnabled = true;
    this.g.imageSmoothingQuality = 'high';
    return { w: cssW, h: cssH };
  }

  private tilesFor(theme: ThemeId): ThemeTiles {
    let t = this.tiles.get(theme);
    if (!t) {
      t = buildTiles(theme, this.pxScale);
      this.tiles.set(theme, t);
    }
    return t;
  }

  prewarm(theme: ThemeId): void {
    this.tilesFor(theme);
  }

  // ------------------------------------------------------------------ projection
  private depthT(z: number): number {
    return z / Z_MAX;
  }
  sAt(z: number): number {
    return SCALE_BACK + (SCALE_FRONT - SCALE_BACK) * this.depthT(z);
  }
  px(x: number, z: number): number {
    return this.viewW / 2 + (x - this.camX) * this.sAt(z);
  }
  py(y: number, z: number): number {
    return FLOOR_BACK_Y + this.depthT(z) * (FLOOR_FRONT_Y - FLOOR_BACK_Y) - y * this.sAt(z);
  }

  // ------------------------------------------------------------------ backdrop
  private drawSky(theme: ThemeId): void {
    const g = this.g;
    const st = THEMES[theme];
    const grad = g.createLinearGradient(0, 0, 0, FLOOR_BACK_Y);
    grad.addColorStop(0, st.skyTop);
    grad.addColorStop(1, st.skyBottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, this.viewW, FLOOR_BACK_Y + 2);
  }

  private drawLayer(img: HTMLCanvasElement, scale: number, offset: number, y: number, h: number): void {
    const g = this.g;
    const tw = TILE_W;
    let x = -(((offset % tw) + tw) % tw);
    while (x < this.viewW) {
      g.drawImage(img, x, y, tw, h);
      x += tw;
    }
    void scale;
  }

  private drawBackground(theme: ThemeId, camX: number): void {
    const t = this.tilesFor(theme);
    this.drawSky(theme);
    const farH = FLOOR_BACK_Y - 20;
    const midH = FLOOR_BACK_Y - 30;
    this.drawLayer(t.far, t.scale, camX * 0.12, 0, farH);
    this.drawLayer(t.mid, t.scale, camX * 0.38, 30, midH);
    this.drawLayer(t.wall, t.scale, camX * SCALE_BACK - this.viewW / 2 + (this.viewW / 2) * (1 - SCALE_BACK) * 0, FLOOR_BACK_Y - 138, 140);
  }

  /** Animated menu backdrop. */
  renderBackdrop(theme: ThemeId, frame: number, heroes: boolean): void {
    const g = this.g;
    g.setTransform(this.pxScale, 0, 0, this.pxScale, 0, 0);
    this.camX = frame * 0.6;
    this.drawBackground(theme, this.camX);
    this.drawFloor(theme, null);
    if (heroes) {
      const bob = (k: number) => Math.abs(Math.sin(frame * 0.05 + k)) * 6;
      drawHeroStatic(g, this.sprites.momo, HEROES.momo, this.viewW * 0.36, 470 - bob(0), 1.05, 1, 1);
      drawHeroStatic(g, this.sprites.scout, HEROES.scout, this.viewW * 0.64, 470 - bob(1.3), 1.05, -1, 1);
    }
    this.drawGrain();
  }

  private drawFloor(theme: ThemeId, world: World | null): void {
    const g = this.g;
    const st = THEMES[theme];
    const grad = g.createLinearGradient(0, FLOOR_BACK_Y, 0, VIEW_H);
    grad.addColorStop(0, st.floorBack);
    grad.addColorStop(1, st.floorFront);
    g.fillStyle = grad;
    g.fillRect(0, FLOOR_BACK_Y, this.viewW, VIEW_H - FLOOR_BACK_Y);
    // perspective grid
    g.strokeStyle = st.floorLine;
    g.lineWidth = 1.5;
    g.beginPath();
    const step = theme === 'city' ? 160 : theme === 'factory' ? 80 : 120;
    const leftWorld = this.camX - (this.viewW / 2) / SCALE_BACK - step;
    const rightWorld = this.camX + (this.viewW / 2) / SCALE_BACK + step;
    for (let x = Math.floor(leftWorld / step) * step; x < rightWorld; x += step) {
      g.moveTo(this.px(x, 0), this.py(0, 0));
      g.lineTo(this.px(x, Z_MAX * 1.2), this.py(0, Z_MAX * 1.2));
    }
    for (let z = 0; z <= Z_MAX; z += 50) {
      g.moveTo(0, this.py(0, z));
      g.lineTo(this.viewW, this.py(0, z));
    }
    g.stroke();
    // back edge ink line
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(0, FLOOR_BACK_Y);
    g.lineTo(this.viewW, FLOOR_BACK_Y);
    g.stroke();
    // theme details scattered on the floor
    for (let x = Math.floor(leftWorld / 90) * 90; x < rightWorld; x += 90) {
      const hx = hash(x * 0.37);
      const z = hash(x * 1.91) * Z_MAX;
      const sx = this.px(x + hx * 60, z);
      const sy = this.py(0, z);
      const s = this.sAt(z);
      g.strokeStyle = st.floorLine.replace(/[\d.]+\)$/, '0.45)');
      g.lineWidth = 2;
      g.beginPath();
      if (theme === 'meadow') {
        g.moveTo(sx - 6 * s, sy);
        g.lineTo(sx - 9 * s, sy - 9 * s);
        g.moveTo(sx, sy);
        g.lineTo(sx, sy - 12 * s);
        g.moveTo(sx + 6 * s, sy);
        g.lineTo(sx + 9 * s, sy - 9 * s);
        g.stroke();
        if (hx > 0.7) {
          g.fillStyle = hx > 0.85 ? '#ff70a6' : '#ffd23f';
          g.beginPath();
          g.arc(sx + 14 * s, sy - 10 * s, 4 * s, 0, Math.PI * 2);
          g.fill();
        }
      } else if (theme === 'canyon') {
        g.moveTo(sx - 14 * s, sy);
        g.lineTo(sx - 2 * s, sy - 3 * s);
        g.lineTo(sx + 10 * s, sy + 2 * s);
        g.stroke();
      } else if (theme === 'city') {
        if (z > 80 && z < 120) continue;
        g.moveTo(sx - 10 * s, sy);
        g.lineTo(sx + 10 * s, sy);
        g.stroke();
      } else if (theme === 'factory') {
        g.fillStyle = 'rgba(30,30,40,0.35)';
        g.beginPath();
        g.arc(sx, sy, 2.5 * s, 0, Math.PI * 2);
        g.fill();
      } else {
        g.moveTo(sx - 12 * s, sy);
        g.lineTo(sx + 12 * s, sy);
        g.stroke();
      }
    }
    if (theme === 'city') {
      // lane markings
      g.strokeStyle = 'rgba(255,224,102,0.7)';
      g.lineWidth = 4;
      g.setLineDash([30, 26]);
      g.lineDashOffset = this.camX;
      g.beginPath();
      g.moveTo(0, this.py(0, 100));
      g.lineTo(this.viewW, this.py(0, 100));
      g.stroke();
      g.setLineDash([]);
    }
    if (!world) return;
    // pits
    for (const [a, b] of world.stage.pits) {
      if (this.px(b, Z_MAX) < -50 || this.px(a, 0) > this.viewW + 50) continue;
      g.beginPath();
      g.moveTo(this.px(a, 0), this.py(0, 0));
      g.lineTo(this.px(b, 0), this.py(0, 0));
      g.lineTo(this.px(b, Z_MAX), this.py(0, Z_MAX));
      g.lineTo(this.px(b, Z_MAX), VIEW_H);
      g.lineTo(this.px(a, Z_MAX), VIEW_H);
      g.lineTo(this.px(a, Z_MAX), this.py(0, Z_MAX));
      g.closePath();
      const pg = g.createLinearGradient(0, FLOOR_BACK_Y, 0, VIEW_H);
      pg.addColorStop(0, st.pit);
      pg.addColorStop(1, '#000000');
      g.fillStyle = pg;
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 2.5;
      g.stroke();
      // far wall of the pit to sell the depth
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.beginPath();
      g.moveTo(this.px(a, 0), this.py(0, 0));
      g.lineTo(this.px(b, 0), this.py(0, 0));
      g.lineTo(this.px(b, 0), this.py(0, 0) + 30);
      g.lineTo(this.px(a, 0), this.py(0, 0) + 30);
      g.fill();
    }
  }

  private floorQuad(x0: number, x1: number, z0: number, z1: number): void {
    const g = this.g;
    g.beginPath();
    g.moveTo(this.px(x0, z0), this.py(0, z0));
    g.lineTo(this.px(x1, z0), this.py(0, z0));
    g.lineTo(this.px(x1, z1), this.py(0, z1));
    g.lineTo(this.px(x0, z1), this.py(0, z1));
    g.closePath();
  }

  private floorEllipse(x: number, z: number, rx: number, rz: number): void {
    const s = this.sAt(z);
    const k = (FLOOR_FRONT_Y - FLOOR_BACK_Y) / Z_MAX;
    this.g.beginPath();
    this.g.ellipse(this.px(x, z), this.py(0, z), Math.max(1, rx * s), Math.max(1, rz * k), 0, 0, Math.PI * 2);
  }

  private drawFloorObjects(world: World, frame: number): void {
    const g = this.g;
    // conveyors, spikes, vents (floor parts)
    for (const h of world.hazards) {
      const d = h.def;
      if (d.type === 'conveyor') {
        this.floorQuad(d.x, d.x + d.w, d.z, d.z + d.d);
        g.fillStyle = '#3d4246';
        g.fill();
        g.strokeStyle = INK;
        g.lineWidth = 2;
        g.stroke();
        g.strokeStyle = '#f4d35e';
        g.lineWidth = 3;
        g.beginPath();
        const off = ((frame * d.speed) % 40 + 40) % 40;
        for (let x = d.x + off; x < d.x + d.w; x += 40) {
          const zc = d.z + d.d / 2;
          const dir = Math.sign(d.speed);
          g.moveTo(this.px(x, zc - 14), this.py(0, zc - 14));
          g.lineTo(this.px(x + dir * 12, zc), this.py(0, zc));
          g.lineTo(this.px(x, zc + 14), this.py(0, zc + 14));
        }
        g.stroke();
      } else if (d.type === 'spikes') {
        this.floorQuad(d.x, d.x + d.w, d.z, d.z + d.d);
        g.fillStyle = 'rgba(80,20,20,0.25)';
        g.fill();
      } else if (d.type === 'vent') {
        this.floorEllipse(d.x, d.z, 40, 20);
        g.fillStyle = h.phase === 'warn' && frame % 8 < 4 ? '#ffb347' : '#2f3437';
        g.fill();
        g.strokeStyle = INK;
        g.lineWidth = 2;
        g.stroke();
      } else if (d.type === 'press' && h.phase === 'warn') {
        const k = clamp(((h.t % 1000) - 0) / PRESS_WARN, 0, 1);
        this.floorQuad(d.x, d.x + d.w, d.z, d.z + d.d);
        g.fillStyle = `rgba(230,57,70,${0.15 + 0.25 * (frame % 10 < 5 ? 1 : 0.5)})`;
        g.fill();
        void k;
      } else if (d.type === 'roller' && h.phase === 'warn') {
        // rumble line marks the lane
        g.strokeStyle = frame % 10 < 5 ? 'rgba(230,57,70,0.8)' : 'rgba(255,255,255,0.6)';
        g.lineWidth = 4;
        g.setLineDash([12, 10]);
        g.beginPath();
        g.moveTo(this.px(h.px, 0), this.py(0, 0));
        g.lineTo(this.px(h.px, Z_MAX), this.py(0, Z_MAX));
        g.stroke();
        g.setLineDash([]);
        void ROLLER_WARN;
      } else if (d.type === 'car' && h.phase === 'warn') {
        this.floorQuad(world.camera.left - 200, world.camera.right + 200, d.z - d.d, d.z + d.d);
        g.fillStyle = frame % 14 < 7 ? 'rgba(230,57,70,0.28)' : 'rgba(255,224,102,0.22)';
        g.fill();
        void CAR_WARN;
      }
    }
    // gate plates
    for (const gt of world.gates) {
      if (gt.open) continue;
      for (const p of gt.plates) {
        this.floorEllipse(p.x, p.z, 34, 22);
        g.fillStyle = p.pressed ? '#7bf1a8' : frame % 40 < 20 ? '#ffd23f' : '#ffe680';
        g.fill();
        g.strokeStyle = INK;
        g.lineWidth = 2.5;
        g.stroke();
      }
    }
    // hand slam / ink drop warnings
    for (const s of world.handSlams) {
      const k = clamp(s.t / HAND_WARN, 0, 1);
      this.floorEllipse(s.x, s.z, 70 * (0.4 + 0.6 * k), 36 * (0.4 + 0.6 * k));
      g.fillStyle = `rgba(60,9,108,${0.25 + 0.35 * k})`;
      g.fill();
      g.strokeStyle = '#e63946';
      g.lineWidth = 2;
      g.stroke();
    }
    for (const p of world.projectiles.items) {
      if (!p.active) continue;
      if (p.def.art === 'inkdrop' || p.def.art === 'inkblob') {
        const k = p.def.art === 'inkdrop' ? clamp(1 - p.y / 420, 0.2, 1) : 0.6;
        this.floorEllipse(p.x, p.z, 24 * k + 8, 12 * k + 4);
        g.fillStyle = p.def.art === 'inkdrop' ? 'rgba(27,23,48,0.45)' : 'rgba(27,23,48,0.25)';
        g.fill();
      }
    }
    // enemy ground telegraphs
    for (const e of world.enemies) {
      if (!e.telegraphing || !e.attack) continue;
      const d = e.attack.def;
      const k = clamp(e.attack.t / d.startup, 0, 1);
      if (d.id === 'e_slam' || d.id === 'b_pound' || d.id === 'b_chomp') {
        const cx = e.x + e.facing * d.hitbox.fx;
        this.floorEllipse(cx, e.z, (d.hitbox.w / 2) * k, d.hitbox.d * k);
        g.fillStyle = 'rgba(230,57,70,0.3)';
        g.fill();
        g.strokeStyle = 'rgba(230,57,70,0.9)';
        g.lineWidth = 2;
        g.stroke();
      } else if (d.id === 'b_charge') {
        const len = 1200;
        this.floorQuad(Math.min(e.x, e.x + e.facing * len), Math.max(e.x, e.x + e.facing * len), e.z - 30, e.z + 30);
        g.fillStyle = `rgba(230,57,70,${0.12 + 0.25 * k})`;
        g.fill();
      } else if (d.id === 'b_beam') {
        this.floorQuad(Math.min(e.x, e.x + e.facing * 1100), Math.max(e.x, e.x + e.facing * 1100), e.z - 20, e.z + 20);
        g.fillStyle = `rgba(249,248,113,${0.15 + 0.3 * k})`;
        g.fill();
      }
    }
    // floor rings
    for (const p of world.fx.particles) {
      if (!p.active || p.kind !== 'floorRing') continue;
      const k = 1 - p.life / p.max;
      this.floorEllipse(p.x, p.z, (p.size / 2) * k, (p.size / 4) * k);
      g.strokeStyle = p.color;
      g.globalAlpha = 1 - k;
      g.lineWidth = 4;
      g.stroke();
      g.globalAlpha = 1;
    }
  }

  private shadow(x: number, z: number, groundY: number, h: number, w: number): void {
    const g = this.g;
    const s = this.sAt(z);
    const lift = clamp(h / 200, 0, 0.6);
    g.fillStyle = 'rgba(30,20,40,0.28)';
    g.beginPath();
    g.ellipse(this.px(x, z), this.py(groundY, z), (w * 0.5 * (1 - lift)) * s, 9 * s * (1 - lift), 0, 0, Math.PI * 2);
    g.fill();
  }

  // ------------------------------------------------------------------ world
  render(world: World, frame: number, opts: RenderOptions): void {
    const g = this.g;
    const theme = world.stage.theme;
    g.setTransform(this.pxScale, 0, 0, this.pxScale, 0, 0);
    this.camX = world.camera.x;
    world.camera.viewW = this.viewW;
    const fx = world.fx;
    g.save();
    g.translate(Math.round(fx.shakeX), Math.round(fx.shakeY));
    this.drawBackground(theme, this.camX);
    this.drawFloor(theme, world);
    this.drawFloorObjects(world, frame);

    // shadows
    for (const h of world.heroes) {
      if (h.state === 'out') continue;
      const gy = world.supportAt(h.x, h.z, h.y + 1) ?? -999;
      if (gy > -100) this.shadow(h.x, h.z, gy, h.y - gy, h.w * 1.3);
    }
    for (const e of world.enemies) {
      if (e.mem.hidden) continue;
      const gy = world.supportAt(e.x, e.z, e.y + 1) ?? -999;
      if (gy > -100) this.shadow(e.x, e.z, gy, e.y - gy, e.w * 1.2);
    }

    const list: Drawable[] = [];
    for (const p of world.platforms) if (this.visible(p.x, p.x + p.w)) list.push({ z: p.z + p.d, draw: () => this.drawPlatform(p, theme) });
    for (const c of world.crates) if (!c.broken && this.visible(c.x - 30, c.x + 30)) list.push({ z: c.z, draw: () => this.drawCrate(c) });
    for (const pk of world.pickups) if (pk.active && this.visible(pk.x - 20, pk.x + 20)) list.push({ z: pk.z, draw: () => this.drawPickup(pk, frame) });
    for (const gt of world.gates) if (!gt.open || gt.openT < 30) if (this.visible(gt.x - 40, gt.x + 40)) list.push({ z: -1, draw: () => this.drawGate(gt.x, gt.open ? gt.openT / 30 : 0) });
    for (const h of world.hazards) this.hazardDrawables(world, h, frame, list);
    for (const h of world.heroes) list.push({ z: this.sortZ(world, h.x, h.z, h.y), draw: () => this.drawHeroEntity(world, h, frame, opts) });
    for (const e of world.enemies) if (!e.mem.hidden && this.visible(e.x - 200, e.x + 200)) list.push({ z: this.sortZ(world, e.x, e.z, e.y), draw: () => this.drawEnemy(e, frame, opts) });
    for (const p of world.projectiles.items) if (p.active) list.push({ z: p.z, draw: () => this.drawProjectile(p, frame) });
    for (const s of world.handSlams) list.push({ z: s.z, draw: () => this.drawHand(s.x, s.z, s.t) });
    list.sort((a, b) => a.z - b.z);
    for (const d of list) d.draw();

    // King waiting in the background during the twins phase
    const king = world.enemies.find((e) => e.kind === 'smudgeKing' && e.mem.hidden);
    if (king) {
      g.save();
      g.globalAlpha = 0.35;
      g.translate(this.px(king.x, 0), this.py(60, 0));
      g.scale(0.8, 0.8);
      drawEnemyArt(g, king, frame, opts.reduced);
      g.restore();
    }

    this.drawParticles(world, frame);
    this.drawTexts(world);
    if (world.cinematic) this.drawFinisher(world.cinematic.t);
    g.restore();

    this.drawLighting(world, frame, opts);
    if (fx.flashA > 0) {
      g.fillStyle = fx.flashColor;
      g.globalAlpha = fx.flashA;
      g.fillRect(0, 0, this.viewW, VIEW_H);
      g.globalAlpha = 1;
    }
    if (opts.quality === 'high') this.drawGrain();
  }

  private visible(x0: number, x1: number): boolean {
    return this.px(x1, Z_MAX) > -80 && this.px(x0, 0) < this.viewW + 80;
  }

  /** Characters standing on a platform sort in front of it. */
  private sortZ(world: World, x: number, z: number, y: number): number {
    let k = z;
    for (const p of world.platforms) {
      if (y >= p.h - 6 && x >= p.x - 10 && x <= p.x + p.w + 10 && z >= p.z - 10 && z <= p.z + p.d + 10) k = Math.max(k, p.z + p.d + 0.5);
    }
    return k;
  }

  private drawPlatform(p: Platform, theme: ThemeId): void {
    const g = this.g;
    const colors: Record<string, [string, string]> = {
      rock: ['#b5a58f', '#8f7f6a'],
      crate: ['#d9a066', '#b07a45'],
      ledge: ['#c9b79c', '#a08b6e'],
      pipe: ['#9aa5a8', '#6f7a7d'],
      block: theme === 'tower' ? ['#6b5a80', '#4b3d5e'] : theme === 'city' ? ['#8e94ab', '#666b80'] : ['#a3a3a3', '#7d7d7d'],
    };
    const [top, front] = colors[p.kind ?? 'block'] ?? colors.block;
    const x0 = p.x;
    const x1 = p.x + p.w;
    const z0 = p.z;
    const z1 = p.z + p.d;
    // front face
    g.beginPath();
    g.moveTo(this.px(x0, z1), this.py(p.h, z1));
    g.lineTo(this.px(x1, z1), this.py(p.h, z1));
    g.lineTo(this.px(x1, z1), this.py(0, z1));
    g.lineTo(this.px(x0, z1), this.py(0, z1));
    g.closePath();
    g.fillStyle = front;
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.stroke();
    // side face (toward screen centre)
    const sideX = this.px(x0, z1) > this.viewW / 2 ? x0 : x1;
    g.beginPath();
    g.moveTo(this.px(sideX, z0), this.py(p.h, z0));
    g.lineTo(this.px(sideX, z1), this.py(p.h, z1));
    g.lineTo(this.px(sideX, z1), this.py(0, z1));
    g.lineTo(this.px(sideX, z0), this.py(0, z0));
    g.closePath();
    g.fillStyle = front;
    g.fill();
    g.stroke();
    // top
    g.beginPath();
    g.moveTo(this.px(x0, z0), this.py(p.h, z0));
    g.lineTo(this.px(x1, z0), this.py(p.h, z0));
    g.lineTo(this.px(x1, z1), this.py(p.h, z1));
    g.lineTo(this.px(x0, z1), this.py(p.h, z1));
    g.closePath();
    g.fillStyle = top;
    g.fill();
    g.stroke();
    if (p.kind === 'crate') {
      g.beginPath();
      g.moveTo(this.px(x0, z1), this.py(p.h, z1));
      g.lineTo(this.px(x1, z1), this.py(0, z1));
      g.stroke();
    }
  }

  private drawCrate(c: Crate): void {
    const g = this.g;
    const s = this.sAt(c.z);
    const x = this.px(c.x, c.z) + (c.shakeT > 0 ? Math.sin(c.shakeT * 2) * 3 : 0);
    const y = this.py(c.y, c.z);
    const w = 52 * s;
    const h = 46 * s;
    g.fillStyle = c.drop === 'pencil' ? '#e9c46a' : '#d9a066';
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.beginPath();
    g.rect(x - w / 2, y - h, w, h);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(x - w / 2, y - h);
    g.lineTo(x - w / 2 + 10 * s, y - h - 8 * s);
    g.lineTo(x + w / 2 + 10 * s, y - h - 8 * s);
    g.lineTo(x + w / 2, y - h);
    g.closePath();
    g.fillStyle = '#e8b97f';
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(x - w / 2, y - h);
    g.lineTo(x + w / 2, y);
    g.moveTo(x + w / 2, y - h);
    g.lineTo(x - w / 2, y);
    g.lineWidth = 2;
    g.stroke();
    if (c.drop === 'pencil') {
      g.fillStyle = INK;
      g.font = `bold ${Math.round(16 * s)}px Lilita One, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.fillText('?', x, y - h * 0.35);
    }
  }

  private drawPickup(pk: Pickup, frame: number): void {
    const g = this.g;
    const s = this.sAt(pk.z);
    const bob = pk.kind === 'pencil' && pk.vy === 0 ? Math.sin(frame * 0.08 + pk.x) * 5 : 0;
    const x = this.px(pk.x, pk.z);
    const y = this.py(pk.y, pk.z) - 14 * s + bob;
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    switch (pk.kind) {
      case 'ink':
        g.fillStyle = '#3a86ff';
        g.beginPath();
        g.moveTo(0, -10);
        g.quadraticCurveTo(9, 2, 0, 8);
        g.quadraticCurveTo(-9, 2, 0, -10);
        g.fill();
        g.stroke();
        break;
      case 'health':
        // doodle apple/heart
        g.fillStyle = '#ff595e';
        g.beginPath();
        g.moveTo(0, 12);
        g.bezierCurveTo(-18, 0, -12, -16, 0, -6);
        g.bezierCurveTo(12, -16, 18, 0, 0, 12);
        g.fill();
        g.stroke();
        g.fillStyle = '#ffffff';
        g.fillRect(-2, -3, 4, 10);
        g.fillRect(-5, 0, 10, 4);
        break;
      case 'meter':
        g.fillStyle = '#ffd23f';
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 ? 6 : 13;
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
        g.fill();
        g.stroke();
        break;
      case 'pencil':
        g.globalAlpha = pk.ghost ? 0.5 : 1;
        g.rotate(-0.6 + Math.sin(frame * 0.05) * 0.1);
        if (!pk.ghost) {
          g.fillStyle = 'rgba(255,210,63,0.35)';
          g.beginPath();
          g.arc(0, 0, 24 + Math.sin(frame * 0.15) * 3, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#ffd23f';
        g.beginPath();
        g.rect(-6, -22, 12, 34);
        g.fill();
        g.stroke();
        g.fillStyle = '#ffb3c1';
        g.beginPath();
        g.rect(-6, -28, 12, 7);
        g.fill();
        g.stroke();
        g.fillStyle = '#f1dcb8';
        g.beginPath();
        g.moveTo(-6, 12);
        g.lineTo(0, 24);
        g.lineTo(6, 12);
        g.closePath();
        g.fill();
        g.stroke();
        break;
    }
    g.restore();
  }

  private drawGate(x: number, open: number): void {
    const g = this.g;
    const h = 150 * (1 - open);
    if (h <= 2) return;
    g.strokeStyle = INK;
    g.lineWidth = 3;
    for (let z = 0; z <= Z_MAX; z += 25) {
      g.fillStyle = '#c9a26b';
      const sx = this.px(x, z);
      const sy = this.py(0, z);
      const s = this.sAt(z);
      g.beginPath();
      g.rect(sx - 6 * s, sy - h * s, 12 * s, h * s);
      g.fill();
      g.stroke();
    }
    g.lineWidth = 6;
    g.strokeStyle = '#8c6239';
    for (const yy of [0.35, 0.75]) {
      g.beginPath();
      g.moveTo(this.px(x, 0), this.py(h * yy, 0));
      g.lineTo(this.px(x, Z_MAX), this.py(h * yy, Z_MAX));
      g.stroke();
    }
  }

  private hazardDrawables(world: World, h: World['hazards'][number], frame: number, list: Drawable[]): void {
    const d = h.def;
    const g = this.g;
    if (d.type === 'spikes') {
      if (!this.visible(d.x, d.x + d.w)) return;
      list.push({
        z: d.z + d.d * 0.5,
        draw: () => {
          g.strokeStyle = INK;
          g.lineWidth = 2;
          g.fillStyle = world.stage.theme === 'canyon' ? '#5c9e5a' : '#3c096c';
          for (let z = d.z + 8; z < d.z + d.d; z += 16)
            for (let x = d.x + 8; x < d.x + d.w; x += 22) {
              const sx = this.px(x, z);
              const sy = this.py(0, z);
              const s = this.sAt(z);
              g.beginPath();
              g.moveTo(sx - 8 * s, sy);
              g.lineTo(sx, sy - 22 * s);
              g.lineTo(sx + 8 * s, sy);
              g.closePath();
              g.fill();
              g.stroke();
            }
        },
      });
    } else if (d.type === 'vent' && h.phase === 'active') {
      list.push({
        z: d.z,
        draw: () => {
          const sx = this.px(d.x, d.z);
          const sy = this.py(0, d.z);
          const s = this.sAt(d.z);
          for (let i = 0; i < 6; i++) {
            g.fillStyle = `rgba(255,255,255,${0.75 - i * 0.1})`;
            g.beginPath();
            g.arc(sx + Math.sin(frame * 0.3 + i) * 8 * s, sy - (i * 24 + 14) * s, (16 + i * 4) * s, 0, Math.PI * 2);
            g.fill();
          }
        },
      });
      void VENT_WARN;
    } else if (d.type === 'press') {
      if (!this.visible(d.x, d.x + d.w)) return;
      const cyc = d.period + PRESS_WARN + 10 + 30;
      const t = ((h.t % cyc) + cyc) % cyc;
      let headY: number;
      if (t < d.period) headY = 230;
      else if (t < d.period + PRESS_WARN) headY = 230 - ((t - d.period) / PRESS_WARN) * 20 + (frame % 4 < 2 ? 2 : 0);
      else if (t < d.period + PRESS_WARN + 10) headY = 0;
      else headY = ((t - d.period - PRESS_WARN - 10) / 30) * 230;
      list.push({ z: d.z + d.d, draw: () => this.drawPress(d.x, d.z, d.w, d.d, headY) });
    } else if (d.type === 'roller' && h.phase === 'active') {
      list.push({ z: h.pz, draw: () => this.drawRoller(h.px, h.pz, frame) });
    } else if (d.type === 'car' && h.phase === 'active') {
      list.push({ z: d.z, draw: () => this.drawCar(h.px, d.z) });
    }
  }

  private drawPress(x: number, z: number, w: number, d: number, headY: number): void {
    const g = this.g;
    const zc = z + d;
    const top = 330;
    // shaft
    g.fillStyle = '#6c757d';
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    const cx = x + w / 2;
    g.beginPath();
    g.rect(this.px(cx, zc) - 10, this.py(top, zc), 20, this.py(headY + 40, zc) - this.py(top, zc));
    g.fill();
    g.stroke();
    // head block
    g.beginPath();
    g.moveTo(this.px(x, zc), this.py(headY + 40, zc));
    g.lineTo(this.px(x + w, zc), this.py(headY + 40, zc));
    g.lineTo(this.px(x + w, zc), this.py(headY, zc));
    g.lineTo(this.px(x, zc), this.py(headY, zc));
    g.closePath();
    g.fillStyle = '#495057';
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(this.px(x, z), this.py(headY + 40, z));
    g.lineTo(this.px(x + w, z), this.py(headY + 40, z));
    g.lineTo(this.px(x + w, zc), this.py(headY + 40, zc));
    g.lineTo(this.px(x, zc), this.py(headY + 40, zc));
    g.closePath();
    g.fillStyle = '#6c757d';
    g.fill();
    g.stroke();
    // hazard stripes
    g.fillStyle = '#f4d35e';
    for (let i = 0; i < 4; i++) {
      const xx = x + (i + 0.2) * (w / 4);
      g.fillRect(this.px(xx, zc), this.py(headY + 12, zc), (w / 8) * this.sAt(zc), 8);
    }
  }

  private drawRoller(x: number, z: number, frame: number): void {
    const g = this.g;
    if (z < -50 || z > Z_MAX + 80) return;
    const s = this.sAt(clamp(z, 0, Z_MAX));
    const sx = this.px(x, z);
    const sy = this.py(0, z);
    const r = 34 * s;
    g.save();
    g.translate(sx, sy - r);
    g.fillStyle = '#e63946';
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.beginPath();
    g.rect(-60 * s, -r, 100 * s, r * 2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(40 * s, -r);
    g.lineTo(70 * s, 0);
    g.lineTo(40 * s, r);
    g.closePath();
    g.fillStyle = '#f1dcb8';
    g.fill();
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    const off = (frame * 4) % 20;
    for (let k = -r + off; k < r; k += 20) {
      g.beginPath();
      g.moveTo(-58 * s, k);
      g.lineTo(38 * s, k);
      g.stroke();
    }
    g.restore();
  }

  private drawCar(x: number, z: number): void {
    const g = this.g;
    const s = this.sAt(z);
    const sx = this.px(x, z);
    const sy = this.py(0, z);
    g.save();
    g.translate(sx, sy);
    g.scale(s, s);
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.fillStyle = '#ff70a6';
    g.beginPath();
    g.moveTo(-90, -20);
    g.lineTo(-80, -50);
    g.lineTo(-30, -52);
    g.lineTo(-10, -80);
    g.lineTo(50, -80);
    g.lineTo(70, -50);
    g.lineTo(96, -44);
    g.lineTo(100, -20);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#bde0fe';
    g.beginPath();
    g.rect(-2, -74, 46, 20);
    g.fill();
    g.stroke();
    g.fillStyle = '#23202e';
    for (const wx of [-56, 64]) {
      g.beginPath();
      g.arc(wx, -18, 17, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#ffe066';
    g.beginPath();
    g.arc(96, -38, 6, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  private drawHand(x: number, z: number, t: number): void {
    const g = this.g;
    const k = clamp(t / HAND_WARN, 0, 1);
    const y = t < HAND_WARN ? 420 - k * k * 420 : 0;
    const s = this.sAt(z);
    g.save();
    g.translate(this.px(x, z), this.py(y, z));
    g.scale(s, s);
    g.fillStyle = '#1b1730';
    g.strokeStyle = '#c77dff';
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(0, -30, 46, 30, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.ellipse(-30 + i * 20, -62, 8, 16, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.restore();
  }

  private drawHeroEntity(world: World, h: Hero, frame: number, opts: RenderOptions): void {
    const g = this.g;
    const spr = this.sprites[h.heroId];
    const s = this.sAt(h.z);
    const sx = this.px(h.x, h.z);
    const sy = this.py(h.y, h.z);
    let alpha = 1;
    if (h.state === 'out') alpha = 0.25;
    else if (h.invuln > 0 && h.invuln < 900 && h.state !== 'dodge' && frame % 6 < 2) alpha = 0.55;
    // smear arc for melee attacks
    if (h.state === 'attack' && h.attack && h.attackPhase === 'active' && h.attack.def.hitbox.w > 0 && !h.attack.def.aerial) this.drawSmear(h, s, h.def.color);
    if (h.state === 'block') this.drawShieldArc(sx, sy, s, h.facing, h.blockT <= h.def.parryWindow + h.mods.parryBonus);
    const pose = heroPose(h, frame);
    const flashA = h.flash > 0 ? 0.75 : 0;
    drawHero(g, spr, h.def, pose, sx, sy, s, h.facing, flashA, alpha);
    if (h.state === 'downed' || h.state === 'out') {
      g.fillStyle = 'rgba(120,120,140,0.35)';
      g.globalAlpha = 1;
    }
    // charge glow
    if (h.attack?.def.charge && h.attack.charge > 0 && h.attackPhase === 'startup') {
      const k = h.attack.charge / h.attack.def.charge.max;
      g.strokeStyle = k >= 1 ? '#ffd23f' : 'rgba(255,255,255,0.8)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(sx, sy - h.h * 0.5 * s, (40 + k * 20) * s, 0, Math.PI * 2 * k);
      g.stroke();
    }
    if (h.shield > 0) {
      g.strokeStyle = 'rgba(123,241,168,0.8)';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(sx, sy - h.h * 0.5 * s, 50 * s, 70 * s, 0, 0, Math.PI * 2);
      g.stroke();
    }
    // player tag
    const tag = world.mode === 'coop' ? (h.controller === 'p1' ? '1P' : '2P') : h.controller === 'p1' ? 'YOU' : 'CPU';
    const tagCol = h.playerSlot === 0 ? '#ff8c42' : '#3a86ff';
    if (h.state !== 'out') {
      const ty = sy - (h.h + 30) * s + (h.state === 'downed' ? 70 * s : 0);
      g.font = `${Math.round(13 * s + 2)}px Lilita One, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.lineWidth = 4;
      g.strokeStyle = '#fffbf2';
      g.strokeText(tag, sx, ty);
      g.fillStyle = tagCol;
      g.fillText(tag, sx, ty);
      g.beginPath();
      g.moveTo(sx - 5, ty + 4);
      g.lineTo(sx + 5, ty + 4);
      g.lineTo(sx, ty + 10);
      g.closePath();
      g.fill();
    }
    // revive ring
    if (h.state === 'downed') {
      const cy = sy - 70 * s;
      const left = h.downedT / h.downedMax;
      g.lineWidth = 6;
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.arc(sx, cy, 26, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = left < 0.3 && frame % 10 < 5 ? '#ff595e' : '#ffd23f';
      g.beginPath();
      g.arc(sx, cy, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
      g.stroke();
      if (h.reviveProgress > 0) {
        g.strokeStyle = '#7bf1a8';
        g.lineWidth = 8;
        g.beginPath();
        g.arc(sx, cy, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (h.reviveProgress / 80));
        g.stroke();
      }
      g.font = '14px Lilita One, system-ui, sans-serif';
      g.fillStyle = '#ffffff';
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.strokeText('HELP!', sx, cy + 5);
      g.fillText('HELP!', sx, cy + 5);
    }
    void opts;
  }

  private drawSmear(f: Hero | Enemy, s: number, color: string): void {
    const g = this.g;
    const a = f.attack!;
    const d = a.def;
    const k = clamp((a.t - d.startup) / Math.max(1, d.active), 0, 1);
    const cx = this.px(f.x + f.facing * d.hitbox.fx * 0.8, f.z);
    const cy = this.py(f.y + d.hitbox.y + d.hitbox.h * 0.5, f.z);
    const r = (d.hitbox.w * 0.55) * s;
    g.save();
    g.translate(cx, cy);
    g.scale(f.facing, 1);
    g.globalAlpha = 0.85 * (1 - k * 0.6);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 12 * s;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(-r * 0.4, 0, r, -1.1 + k * 0.4, 0.9 + k * 0.4);
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = 5 * s;
    g.stroke();
    g.restore();
  }

  private drawShieldArc(sx: number, sy: number, s: number, facing: number, parry: boolean): void {
    const g = this.g;
    g.save();
    g.translate(sx + facing * 34 * s, sy - 60 * s);
    g.scale(facing, 1);
    g.strokeStyle = parry ? '#7bf1a8' : 'rgba(76,201,240,0.9)';
    g.lineWidth = 6 * s;
    g.beginPath();
    g.arc(-30 * s, 0, 56 * s, -0.9, 0.9);
    g.stroke();
    g.restore();
  }

  private drawEnemy(e: Enemy, frame: number, opts: RenderOptions): void {
    const g = this.g;
    const s = this.sAt(e.z);
    const sx = this.px(e.x, e.z);
    const sy = this.py(e.y, e.z);
    const bossScale = e.kind === 'bigScribbler' ? 1.85 : 1;
    let alpha = 1;
    if (e.state === 'dead') alpha = clamp(1 - e.deathT / 55, 0, 1);
    if (e.state === 'spawn' && e.y > 300) alpha = 0.7;
    if (e.attack && e.attackPhase === 'active' && e.attack.def.hitbox.w > 0 && e.attack.def.hitbox.w < 300) this.drawSmear(e, s * bossScale, '#e63946');
    g.save();
    g.globalAlpha = alpha;
    g.translate(sx, sy);
    let sqx = 1;
    let sqy = 1;
    let rot = 0;
    if (e.state === 'knockdown' || e.state === 'dead') {
      sqy = 0.4;
      sqx = 1.25;
    } else if (e.state === 'getup') {
      const k = clamp(e.stateT / 18, 0, 1);
      sqy = 0.4 + 0.6 * k;
      sqx = 1.25 - 0.25 * k;
    } else if (e.state === 'launched') rot = -0.4 * e.hurtDir;
    else if (e.state === 'hitstun') rot = -0.12 * e.hurtDir;
    g.scale(s * bossScale * sqx * e.facing, s * bossScale * sqy);
    if (rot) {
      g.translate(0, -e.h * 0.5);
      g.rotate(rot * e.facing);
      g.translate(0, e.h * 0.5);
    }
    drawEnemyArt(g, e, frame, opts.reduced);
    g.restore();
    // telegraph mark
    if (e.telegraphing && e.attack) {
      const d = e.attack.def;
      const danger = d.unblockable || d.armor || d.damage >= 14;
      const ty = sy - (e.h * bossScale + 26) * s;
      g.font = `${Math.round(26 * s)}px Lilita One, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.lineWidth = 5;
      g.strokeStyle = INK;
      const txt = danger ? '!!' : '!';
      g.strokeText(txt, sx, ty);
      g.fillStyle = danger ? '#ff595e' : '#ffd23f';
      g.fillText(txt, sx, ty);
    }
    // stun stars
    if (e.stunT > 0 && e.state !== 'dead') {
      const ty = sy - (e.h * bossScale + 10) * s;
      for (let i = 0; i < 3; i++) {
        const a = frame * 0.12 + (i * Math.PI * 2) / 3;
        this.star(sx + Math.cos(a) * 24 * s, ty + Math.sin(a) * 8 * s, 6 * s, '#ffd23f');
      }
    }
    // small health bar for regular enemies once damaged
    if (!e.isBoss && e.hp < e.maxHp && e.state !== 'dead') {
      const w = 44 * s;
      const by = sy - (e.h + 12) * s;
      g.fillStyle = 'rgba(35,32,46,0.7)';
      g.fillRect(sx - w / 2 - 1, by - 1, w + 2, 6);
      g.fillStyle = '#ff595e';
      g.fillRect(sx - w / 2, by, w * (e.hp / e.maxHp), 4);
      if (e.armorPts > 0) {
        g.fillStyle = '#ced4da';
        g.fillRect(sx - w / 2, by - 5, w * (e.armorPts / e.maxArmor), 3);
      }
    }
  }

  private star(x: number, y: number, r: number, color: string): void {
    const g = this.g;
    g.fillStyle = color;
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.stroke();
  }

  private drawProjectile(p: Projectile, frame: number): void {
    const g = this.g;
    const z = clamp(p.z, 0, Z_MAX);
    const s = this.sAt(z);
    const sx = this.px(p.x, z);
    const sy = this.py(p.y, z);
    g.save();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    switch (p.def.art) {
      case 'banana':
        g.translate(sx, sy);
        g.rotate(p.rot);
        g.scale(s, s);
        g.fillStyle = '#ffe066';
        g.beginPath();
        g.moveTo(-18, -4);
        g.quadraticCurveTo(0, 22, 18, -4);
        g.quadraticCurveTo(0, 8, -18, -4);
        g.fill();
        g.stroke();
        break;
      case 'inkblob':
      case 'inkdrop':
        g.translate(sx, sy);
        g.scale(s, s);
        g.fillStyle = p.team === 'hero' ? '#7bf1a8' : '#1b1730';
        g.beginPath();
        g.arc(0, 0, 13, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(-4, -4, 4, Math.PI, Math.PI * 1.6);
        g.stroke();
        break;
      case 'staple':
      case 'quill':
        g.translate(sx, sy);
        g.scale(s * Math.sign(p.vx || 1), s);
        g.strokeStyle = p.team === 'hero' ? '#7bf1a8' : p.def.art === 'staple' ? '#adb5bd' : '#5c9e5a';
        g.lineWidth = 5;
        g.beginPath();
        if (p.def.art === 'staple') {
          g.moveTo(-14, 6);
          g.lineTo(-14, -6);
          g.lineTo(14, -6);
          g.lineTo(14, 6);
        } else {
          g.moveTo(-16, 0);
          g.lineTo(16, 0);
        }
        g.stroke();
        g.strokeStyle = INK;
        g.lineWidth = 1.5;
        g.stroke();
        break;
      case 'shockwave': {
        // an ink wave rolling across every depth lane: jump it!
        g.fillStyle = 'rgba(27,23,48,0.85)';
        g.strokeStyle = '#c77dff';
        g.lineWidth = 3;
        g.beginPath();
        for (let zz = 0; zz <= Z_MAX; zz += 20) {
          const wob = Math.sin(frame * 0.4 + zz * 0.1) * 6;
          g.lineTo(this.px(p.x + wob, zz), this.py(46, zz));
        }
        for (let zz = Z_MAX; zz >= 0; zz -= 20) g.lineTo(this.px(p.x - p.facing * 30, zz), this.py(0, zz));
        g.closePath();
        g.fill();
        g.stroke();
        break;
      }
      default:
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(sx, sy, 8 * s, 0, Math.PI * 2);
        g.fill();
    }
    g.restore();
  }

  private drawParticles(world: World, frame: number): void {
    const g = this.g;
    for (const p of world.fx.particles) {
      if (!p.active || p.kind === 'floorRing') continue;
      const z = clamp(p.z, 0, Z_MAX);
      const s = this.sAt(z);
      const sx = this.px(p.x, z);
      const sy = this.py(p.y, z);
      const k = p.life / p.max;
      switch (p.kind) {
        case 'spark':
          g.strokeStyle = p.color;
          g.lineWidth = p.size;
          g.beginPath();
          g.moveTo(sx, sy);
          g.lineTo(sx - p.vx * 3, sy + p.vy * 3);
          g.stroke();
          break;
        case 'ink':
          g.fillStyle = p.color;
          g.beginPath();
          g.arc(sx, sy, p.size * s * (0.5 + k * 0.5), 0, Math.PI * 2);
          g.fill();
          break;
        case 'dust':
          g.fillStyle = p.color;
          g.globalAlpha = k;
          g.beginPath();
          g.arc(sx, sy, p.size * s * (1.4 - k * 0.6), 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
          break;
        case 'ring':
          g.strokeStyle = p.color;
          g.globalAlpha = k;
          g.lineWidth = 4 * k + 1;
          g.beginPath();
          g.arc(sx, sy, p.size * s * (1.2 - k * 0.7), 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
          break;
        case 'line':
          g.strokeStyle = p.color;
          g.globalAlpha = k;
          g.lineWidth = 5;
          g.beginPath();
          g.arc(sx - p.facing * p.size * 0.6, sy, p.size * s, -0.7, 0.7);
          if (p.facing < 0) {
            g.beginPath();
            g.arc(sx - p.facing * p.size * 0.6, sy, p.size * s, Math.PI - 0.7, Math.PI + 0.7);
          }
          g.stroke();
          g.globalAlpha = 1;
          break;
        case 'star':
          this.star(sx, sy, p.size * s, p.color);
          break;
        case 'confetti':
          g.save();
          g.translate(sx, sy);
          g.rotate(p.rot);
          g.fillStyle = p.color;
          g.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
          g.restore();
          break;
        case 'after':
          if (p.ref && p.ref.team === 'hero') {
            const h = p.ref as Hero;
            drawHeroStatic(g, this.sprites[h.heroId], h.def, sx, sy, s, p.facing, k * 0.4, true);
          }
          break;
      }
    }
    void frame;
  }

  private drawTexts(world: World): void {
    const g = this.g;
    g.textAlign = 'center';
    for (const t of world.fx.texts) {
      const z = clamp(t.z, 0, Z_MAX);
      const sx = this.px(t.x, z);
      const sy = this.py(t.y, z);
      const k = t.life / t.max;
      const pop = k > 0.85 ? 1 + (k - 0.85) * 3 : 1;
      g.font = `${Math.round(20 * t.scale * pop)}px Lilita One, system-ui, sans-serif`;
      g.globalAlpha = Math.min(1, k * 2.5);
      g.lineWidth = 5;
      g.strokeStyle = INK;
      g.strokeText(t.text, sx, sy);
      g.fillStyle = t.color;
      g.fillText(t.text, sx, sy);
    }
    g.globalAlpha = 1;
  }

  private drawFinisher(t: number): void {
    const g = this.g;
    const k = clamp(t / 20, 0, 1) * clamp((100 - t) / 15, 0, 1);
    g.fillStyle = `rgba(20,10,40,${0.45 * k})`;
    g.fillRect(-20, -20, this.viewW + 40, VIEW_H + 40);
    if (t > 22 && t < 90) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const y = 120 + ((t * 9 + i * 97) % 300);
        g.strokeStyle = i % 2 ? 'rgba(255,140,66,0.8)' : 'rgba(58,134,255,0.8)';
        g.lineWidth = 10;
        g.beginPath();
        g.moveTo(-20, y + 60);
        g.lineTo(this.viewW + 20, y - 60);
        g.stroke();
      }
      g.restore();
    }
    if (t > 20 && t < 95) {
      g.font = '54px Lilita One, system-ui, sans-serif';
      g.textAlign = 'center';
      g.lineWidth = 8;
      g.strokeStyle = INK;
      const txt = 'TEAM FINISHER!';
      g.strokeText(txt, this.viewW / 2, 110);
      g.fillStyle = '#ffd23f';
      g.fillText(txt, this.viewW / 2, 110);
    }
  }

  private drawLighting(world: World, frame: number, opts: RenderOptions): void {
    const g = this.g;
    const st = THEMES[world.stage.theme];
    if (st.night > 0) {
      g.fillStyle = `rgba(10,8,40,${st.night})`;
      g.fillRect(0, 0, this.viewW, VIEW_H);
      if (opts.quality === 'high') {
        g.save();
        g.globalCompositeOperation = 'lighter';
        const step = 300;
        for (let x = Math.floor((this.camX - this.viewW) / step) * step + 84; x < this.camX + this.viewW; x += step) {
          const sx = this.px(x, 0);
          if (sx < -200 || sx > this.viewW + 200) continue;
          const rg = g.createRadialGradient(sx, FLOOR_BACK_Y - 60, 10, sx, FLOOR_BACK_Y + 40, 220);
          rg.addColorStop(0, hexA(st.glow, 0.28 + Math.sin(frame * 0.05 + x) * 0.03));
          rg.addColorStop(1, hexA(st.glow, 0));
          g.fillStyle = rg;
          g.fillRect(sx - 240, FLOOR_BACK_Y - 200, 480, 460);
        }
        g.restore();
      }
    }
    // vignette (red pulse on low health)
    const low = world.heroes.some((h) => h.controller !== 'ai' && h.active && h.hp / h.maxHp < 0.25);
    const vg = g.createRadialGradient(this.viewW / 2, VIEW_H / 2, VIEW_H * 0.45, this.viewW / 2, VIEW_H / 2, this.viewW * 0.65);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, low ? `rgba(200,20,40,${0.35 + Math.sin(frame * 0.15) * 0.12})` : 'rgba(20,10,30,0.28)');
    g.fillStyle = vg;
    g.fillRect(0, 0, this.viewW, VIEW_H);
  }

  private drawGrain(): void {
    const g = this.g;
    if (!this.grainPattern) this.grainPattern = g.createPattern(this.grain, 'repeat');
    if (!this.grainPattern) return;
    g.save();
    g.fillStyle = this.grainPattern;
    g.fillRect(0, 0, this.viewW, VIEW_H);
    g.restore();
  }
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1).toFixed(3)})`;
}

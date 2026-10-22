import type { Fighter } from './fighter';

export type ParticleKind = 'spark' | 'ink' | 'dust' | 'ring' | 'floorRing' | 'after' | 'star' | 'line' | 'confetti';

export interface Particle {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  ref: Fighter | null;
  facing: number;
}

export interface FloatText {
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
  max: number;
  scale: number;
}

const POOL = 420;

/** Pooled particles, floating text, screen shake and flashes. Pure data: the renderer draws it. */
export class Effects {
  particles: Particle[] = [];
  texts: FloatText[] = [];
  shakeMag = 0;
  shakeX = 0;
  shakeY = 0;
  flashColor = '#ffffff';
  flashA = 0;
  budget = 1; // 0..1, lowered by the performance governor
  shakeEnabled = true;
  reduced = false;
  private cursor = 0;

  constructor() {
    for (let i = 0; i < POOL; i++) {
      this.particles.push({ active: false, kind: 'spark', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1, color: '#fff', rot: 0, ref: null, facing: 1 });
    }
  }

  private spawn(kind: ParticleKind, x: number, y: number, z: number, life: number): Particle | null {
    const limit = Math.floor(POOL * this.budget);
    for (let n = 0; n < limit; n++) {
      const i = (this.cursor + n) % limit;
      const p = this.particles[i];
      if (!p.active) {
        this.cursor = (i + 1) % limit;
        p.active = true;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = p.vy = p.vz = 0;
        p.life = life;
        p.max = life;
        p.size = 1;
        p.rot = 0;
        p.ref = null;
        p.facing = 1;
        p.color = '#ffffff';
        return p;
      }
    }
    return null;
  }

  private count(n: number): number {
    return Math.max(1, Math.round(n * this.budget));
  }

  hitSpark(x: number, y: number, z: number, heavy: boolean, color = '#ffffff'): void {
    const n = this.count(heavy ? 9 : 5);
    for (let i = 0; i < n; i++) {
      const p = this.spawn('spark', x, y, z, heavy ? 14 : 10);
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      const s = (heavy ? 7 : 5) * (0.5 + Math.random());
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.rot = a;
      p.size = heavy ? 3.5 : 2.5;
      p.color = color;
    }
    const r = this.spawn('ring', x, y, z, heavy ? 12 : 8);
    if (r) {
      r.size = heavy ? 46 : 28;
      r.color = color;
    }
  }

  ink(x: number, y: number, z: number, n: number, color = '#1b1730'): void {
    for (let i = 0; i < this.count(n); i++) {
      const p = this.spawn('ink', x, y, z, 30 + Math.random() * 20);
      if (!p) return;
      p.vx = (Math.random() - 0.5) * 6;
      p.vy = 2 + Math.random() * 6;
      p.vz = (Math.random() - 0.5) * 3;
      p.size = 3 + Math.random() * 5;
      p.color = color;
    }
  }

  inkSplash(x: number, z: number, n: number): void {
    this.ink(x, 60, z, n);
    this.floorRing(x, z, 140, '#1b1730', 30);
  }

  dust(x: number, z: number, n: number): void {
    for (let i = 0; i < this.count(n); i++) {
      const p = this.spawn('dust', x + (Math.random() - 0.5) * 30, 2, z + (Math.random() - 0.5) * 10, 22 + Math.random() * 12);
      if (!p) return;
      p.vx = (Math.random() - 0.5) * 2.5;
      p.vy = 0.6 + Math.random() * 1.2;
      p.size = 6 + Math.random() * 8;
      p.color = 'rgba(120,110,100,0.5)';
    }
  }

  ring(x: number, y: number, z: number, size: number, color: string): void {
    const p = this.spawn('ring', x, y, z, 16);
    if (p) {
      p.size = size;
      p.color = color;
    }
  }

  floorRing(x: number, z: number, size: number, color: string, life = 22): void {
    const p = this.spawn('floorRing', x, 0, z, life);
    if (p) {
      p.size = size;
      p.color = color;
    }
  }

  afterimage(f: Fighter): void {
    const p = this.spawn('after', f.x, f.y, f.z, 14);
    if (p) {
      p.ref = f;
      p.facing = f.facing;
    }
  }

  chargeSpark(f: Fighter, k: number): void {
    const p = this.spawn('ring', f.x, f.y + f.h * 0.5, f.z, 10);
    if (p) {
      p.size = 30 + k * 40;
      p.color = k >= 1 ? '#ffd23f' : '#ffffff';
    }
  }

  barkWave(f: Fighter, echo: boolean): void {
    for (let i = 0; i < 3; i++) {
      const p = this.spawn('line', f.x + f.facing * (40 + i * 30), f.y + f.h * 0.7, f.z, 18 + i * 4);
      if (!p) return;
      p.vx = f.facing * 9;
      p.size = 30 + i * 18;
      p.facing = f.facing;
      p.color = '#4cc9f0';
      if (echo) {
        const q = this.spawn('line', f.x - f.facing * (40 + i * 30), f.y + f.h * 0.7, f.z, 18 + i * 4);
        if (q) {
          q.vx = -f.facing * 9;
          q.size = 30 + i * 18;
          q.facing = -f.facing;
          q.color = '#4cc9f0';
        }
      }
    }
  }

  sirenWave(f: Fighter): void {
    for (let i = 0; i < 4; i++) {
      const p = this.spawn('floorRing', f.x, 0, f.z, 30 + i * 8);
      if (p) {
        p.size = 500 + i * 160;
        p.color = i % 2 ? '#ff595e' : '#3a86ff';
      }
    }
  }

  crater(x: number, z: number, r: number): void {
    this.floorRing(x, z, r * 2, '#ffffff', 24);
    this.floorRing(x, z, r * 1.3, '#4cc9f0', 18);
    this.dust(x, z, 14);
  }

  stars(x: number, y: number, z: number): void {
    for (let i = 0; i < this.count(6); i++) {
      const p = this.spawn('star', x, y, z, 40);
      if (!p) return;
      const a = (i / 6) * Math.PI * 2;
      p.vx = Math.cos(a) * 3;
      p.vy = Math.sin(a) * 3 + 2;
      p.size = 7;
      p.color = '#ffd23f';
    }
  }

  confetti(x: number, y: number, z: number, n: number): void {
    const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    for (let i = 0; i < this.count(n); i++) {
      const p = this.spawn('confetti', x, y, z, 60 + Math.random() * 30);
      if (!p) return;
      p.vx = (Math.random() - 0.5) * 8;
      p.vy = 4 + Math.random() * 7;
      p.vz = (Math.random() - 0.5) * 4;
      p.size = 5;
      p.rot = Math.random() * 6;
      p.color = colors[i % colors.length];
    }
  }

  text(x: number, y: number, z: number, text: string, color: string, scale = 1): void {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({ x, y, z, text, color, life: 55, max: 55, scale });
  }

  shake(mag: number): void {
    if (!this.shakeEnabled) return;
    this.shakeMag = Math.min(14, Math.max(this.shakeMag, this.reduced ? mag * 0.3 : mag));
  }

  flashScreen(color: string, a: number): void {
    this.flashColor = color;
    this.flashA = this.reduced ? Math.min(a, 0.15) : a;
  }

  update(): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      if (--p.life <= 0) {
        p.active = false;
        p.ref = null;
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      switch (p.kind) {
        case 'ink':
          p.vy -= 0.45;
          if (p.y < 0) {
            p.y = 0;
            p.vy = 0;
            p.vx *= 0.5;
            p.vz *= 0.5;
          }
          break;
        case 'spark':
          p.vx *= 0.85;
          p.vy *= 0.85;
          break;
        case 'star':
          p.vx *= 0.92;
          p.vy *= 0.92;
          break;
        case 'confetti':
          p.vy -= 0.25;
          p.vx *= 0.98;
          p.rot += 0.2;
          if (p.y < 0) {
            p.y = 0;
            p.vy = 0;
            p.vx = 0;
          }
          break;
        case 'line':
          p.size += 3;
          break;
      }
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += 0.9 * (t.life / t.max);
      if (--t.life <= 0) this.texts.splice(i, 1);
    }
    if (this.shakeMag > 0.1) {
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeMag;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeMag;
      this.shakeMag *= 0.85;
    } else {
      this.shakeMag = this.shakeX = this.shakeY = 0;
    }
    if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - 0.03);
  }

  clear(): void {
    for (const p of this.particles) {
      p.active = false;
      p.ref = null;
    }
    this.texts.length = 0;
    this.shakeMag = 0;
    this.flashA = 0;
  }
}

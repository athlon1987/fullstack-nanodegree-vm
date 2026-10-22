// Sketchbook-style parallax backdrops. Each theme paints three repeating
// layers once (far, mid, back wall) into offscreen tiles; the floor is drawn
// live in perspective so depth movement reads as real 3D space.
import { FLOOR_BACK_Y } from '../config';
import { Rng } from '../core/math';
import type { ThemeId } from '../data/types';

export const TILE_W = 1200;
const INK = '#2b2638';

export interface ThemeStyle {
  skyTop: string;
  skyBottom: string;
  floorBack: string;
  floorFront: string;
  floorLine: string;
  pit: string;
  night: number; // 0..1 darkness overlay
  glow: string;
  paper: string;
}

export const THEMES: Record<ThemeId, ThemeStyle> = {
  meadow: { skyTop: '#9fd8f5', skyBottom: '#e8f6ff', floorBack: '#a7d676', floorFront: '#7fbf52', floorLine: 'rgba(43,38,56,0.18)', pit: '#3b2a1e', night: 0, glow: '#fff3b0', paper: '#fffbf2' },
  canyon: { skyTop: '#ffb36b', skyBottom: '#ffe3b3', floorBack: '#e9b872', floorFront: '#d39a52', floorLine: 'rgba(80,40,10,0.22)', pit: '#3a1f12', night: 0, glow: '#ffe066', paper: '#fff6e8' },
  city: { skyTop: '#151a3d', skyBottom: '#40407a', floorBack: '#5a5f73', floorFront: '#3e4252', floorLine: 'rgba(255,255,255,0.12)', pit: '#0b0b14', night: 0.25, glow: '#ff70a6', paper: '#e9e7ff' },
  factory: { skyTop: '#3d4a4f', skyBottom: '#7c8c8f', floorBack: '#8d9599', floorFront: '#6c7478', floorLine: 'rgba(20,20,30,0.25)', pit: '#14110f', night: 0.12, glow: '#ffb347', paper: '#f1efe9' },
  tower: { skyTop: '#170a2b', skyBottom: '#4a2a6b', floorBack: '#6b5a80', floorFront: '#4b3d5e', floorLine: 'rgba(255,255,255,0.1)', pit: '#07040c', night: 0.2, glow: '#c77dff', paper: '#efe6ff' },
};

function inkLine(g: CanvasRenderingContext2D, w = 2.5): void {
  g.strokeStyle = INK;
  g.lineWidth = w;
  g.lineJoin = 'round';
  g.lineCap = 'round';
}

function wobblyRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Rng): void {
  const k = () => r.range(-1.5, 1.5);
  g.beginPath();
  g.moveTo(x + k(), y + k());
  g.lineTo(x + w + k(), y + k());
  g.lineTo(x + w + k(), y + h + k());
  g.lineTo(x + k(), y + h + k());
  g.closePath();
}

function hill(g: CanvasRenderingContext2D, x: number, base: number, w: number, h: number): void {
  g.beginPath();
  g.moveTo(x - w / 2, base);
  g.bezierCurveTo(x - w / 3, base - h, x + w / 3, base - h, x + w / 2, base);
  g.closePath();
}

function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath();
  g.arc(x, y, 18 * s, Math.PI * 0.5, Math.PI * 1.5);
  g.arc(x + 20 * s, y - 14 * s, 20 * s, Math.PI, Math.PI * 1.9);
  g.arc(x + 46 * s, y - 6 * s, 16 * s, Math.PI * 1.2, Math.PI * 0.4);
  g.closePath();
  g.fillStyle = '#ffffff';
  g.fill();
  inkLine(g, 2);
  g.stroke();
}

function tree(g: CanvasRenderingContext2D, x: number, base: number, s: number, r: Rng): void {
  g.fillStyle = '#9c6b3f';
  wobblyRect(g, x - 6 * s, base - 50 * s, 12 * s, 50 * s, r);
  g.fill();
  inkLine(g, 2);
  g.stroke();
  g.beginPath();
  g.arc(x, base - 70 * s, 32 * s, 0, Math.PI * 2);
  g.arc(x - 24 * s, base - 56 * s, 22 * s, 0, Math.PI * 2);
  g.arc(x + 24 * s, base - 58 * s, 24 * s, 0, Math.PI * 2);
  g.fillStyle = '#5fb04a';
  g.fill();
  inkLine(g, 2);
  g.beginPath();
  g.arc(x, base - 70 * s, 32 * s, Math.PI * 0.9, Math.PI * 2.1);
  g.stroke();
  g.beginPath();
  g.arc(x - 24 * s, base - 56 * s, 22 * s, Math.PI * 0.6, Math.PI * 1.6);
  g.stroke();
  g.beginPath();
  g.arc(x + 24 * s, base - 58 * s, 24 * s, Math.PI * 1.5, Math.PI * 2.5);
  g.stroke();
}

type Painter = (g: CanvasRenderingContext2D, w: number, h: number, r: Rng) => void;

const FAR: Record<ThemeId, Painter> = {
  meadow(g, w, h, r) {
    g.fillStyle = '#fff3b0';
    g.beginPath();
    g.arc(w * 0.78, 70, 34, 0, Math.PI * 2);
    g.fill();
    inkLine(g);
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(w * 0.78 + Math.cos(a) * 44, 70 + Math.sin(a) * 44);
      g.lineTo(w * 0.78 + Math.cos(a) * 56, 70 + Math.sin(a) * 56);
      g.stroke();
    }
    for (let i = 0; i < 5; i++) cloud(g, r.range(0, w - 80), r.range(40, 130), r.range(0.7, 1.2));
    g.fillStyle = '#b9e29a';
    for (let i = 0; i < 6; i++) {
      hill(g, i * (w / 5), h, r.range(260, 380), r.range(70, 120));
      g.fill();
      inkLine(g, 2);
      g.stroke();
    }
  },
  canyon(g, w, h, r) {
    g.fillStyle = '#fff1c1';
    g.beginPath();
    g.arc(w * 0.25, 90, 46, 0, Math.PI * 2);
    g.fill();
    inkLine(g);
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const x = r.range(0, w);
      const mw = r.range(120, 220);
      const mh = r.range(90, 160);
      g.beginPath();
      g.moveTo(x - mw / 2 - 20, h);
      g.lineTo(x - mw / 2, h - mh);
      g.lineTo(x + mw / 2, h - mh - r.range(-10, 10));
      g.lineTo(x + mw / 2 + 20, h);
      g.closePath();
      g.fillStyle = '#f4a261';
      g.fill();
      inkLine(g, 2);
      g.stroke();
      g.strokeStyle = 'rgba(200,90,40,0.5)';
      g.lineWidth = 6;
      for (let k = 1; k < 4; k++) {
        g.beginPath();
        g.moveTo(x - mw / 2 + 4, h - mh + k * (mh / 4));
        g.lineTo(x + mw / 2 + 4, h - mh + k * (mh / 4) + r.range(-4, 4));
        g.stroke();
      }
    }
  },
  city(g, w, h, r) {
    for (let i = 0; i < 70; i++) {
      g.fillStyle = 'rgba(255,255,255,' + r.range(0.3, 0.9).toFixed(2) + ')';
      g.fillRect(r.range(0, w), r.range(0, h * 0.6), 2, 2);
    }
    g.fillStyle = '#fef9c3';
    g.beginPath();
    g.arc(w * 0.7, 80, 30, 0, Math.PI * 2);
    g.fill();
    let x = 0;
    while (x < w) {
      const bw = r.range(60, 120);
      const bh = r.range(110, 220);
      g.fillStyle = '#262a50';
      wobblyRect(g, x, h - bh, bw, bh + 4, r);
      g.fill();
      inkLine(g, 2);
      g.strokeStyle = '#11132a';
      g.stroke();
      g.fillStyle = r.pick(['#ffd166', '#ff70a6', '#70d6ff', '#ffd166']);
      for (let wy = h - bh + 14; wy < h - 20; wy += 22) for (let wx = x + 10; wx < x + bw - 14; wx += 18) if (r.chance(0.45)) g.fillRect(wx, wy, 8, 10);
      x += bw + r.range(4, 20);
    }
  },
  factory(g, w, h, r) {
    for (let i = 0; i < 6; i++) {
      const x = r.range(0, w);
      const ch = r.range(140, 230);
      g.fillStyle = '#56656a';
      wobblyRect(g, x, h - ch, 34, ch + 4, r);
      g.fill();
      inkLine(g, 2);
      g.stroke();
      g.fillStyle = 'rgba(230,230,230,0.6)';
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(x + 17 + k * 10, h - ch - 16 - k * 18, 12 + k * 5, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = '#4b5a5f';
    let x = 0;
    while (x < w) {
      const bw = r.range(140, 240);
      const bh = r.range(80, 130);
      wobblyRect(g, x, h - bh, bw, bh + 4, r);
      g.fill();
      inkLine(g, 2);
      g.stroke();
      x += bw;
    }
  },
  tower(g, w, h, r) {
    g.fillStyle = '#e0c3fc';
    g.beginPath();
    g.arc(w * 0.2, 90, 40, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#170a2b';
    g.beginPath();
    g.arc(w * 0.2 + 16, 82, 34, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(224,195,252,' + r.range(0.3, 0.8).toFixed(2) + ')';
      g.fillRect(r.range(0, w), r.range(0, h * 0.7), 2, 2);
    }
    for (let i = 0; i < 4; i++) {
      const x = r.range(100, w - 100);
      const th = r.range(150, 240);
      g.fillStyle = '#2d1b4e';
      wobblyRect(g, x - 26, h - th, 52, th + 4, r);
      g.fill();
      inkLine(g, 2);
      g.strokeStyle = '#0f0820';
      g.stroke();
      g.beginPath();
      g.moveTo(x - 34, h - th);
      g.lineTo(x, h - th - 50);
      g.lineTo(x + 34, h - th);
      g.closePath();
      g.fillStyle = '#3c096c';
      g.fill();
      g.stroke();
      g.fillStyle = '#c77dff';
      g.fillRect(x - 6, h - th + 30, 12, 18);
    }
  },
};

const MID: Record<ThemeId, Painter> = {
  meadow(g, w, h, r) {
    for (let i = 0; i < 7; i++) tree(g, r.range(20, w - 20), h - r.range(0, 10), r.range(0.8, 1.25), r);
    for (let i = 0; i < 4; i++) {
      // little bushes
      const x = r.range(0, w);
      g.fillStyle = '#6cbf4f';
      g.beginPath();
      g.arc(x, h - 8, 22, Math.PI, 0);
      g.arc(x + 26, h - 8, 18, Math.PI, 0);
      g.fill();
      inkLine(g, 2);
      g.stroke();
    }
  },
  canyon(g, w, h, r) {
    for (let i = 0; i < 6; i++) {
      const x = r.range(0, w);
      const ch = r.range(40, 80);
      g.fillStyle = '#5c9e5a';
      wobblyRect(g, x - 8, h - ch, 16, ch, r);
      g.fill();
      inkLine(g, 2);
      g.stroke();
      wobblyRect(g, x - 26, h - ch * 0.7, 12, ch * 0.3, r);
      g.fill();
      g.stroke();
      wobblyRect(g, x + 14, h - ch * 0.8, 12, ch * 0.35, r);
      g.fill();
      g.stroke();
    }
    for (let i = 0; i < 5; i++) {
      // giant crayon stubs on the ridge
      const x = r.range(0, w);
      g.save();
      g.translate(x, h - 30);
      g.rotate(r.range(-0.4, 0.4));
      g.fillStyle = r.pick(['#e63946', '#3a86ff', '#8ac926', '#ffca3a']);
      wobblyRect(g, -10, -60, 20, 60, r);
      g.fill();
      inkLine(g, 2);
      g.stroke();
      g.beginPath();
      g.moveTo(-10, -60);
      g.lineTo(0, -80);
      g.lineTo(10, -60);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }
  },
  city(g, w, h, r) {
    let x = 0;
    while (x < w) {
      const bw = r.range(110, 190);
      const bh = r.range(120, 200);
      g.fillStyle = r.pick(['#3d3b6e', '#4a3f7a', '#2f3b6d']);
      wobblyRect(g, x, h - bh, bw, bh + 4, r);
      g.fill();
      inkLine(g, 2.5);
      g.stroke();
      for (let wy = h - bh + 16; wy < h - 30; wy += 28)
        for (let wx = x + 14; wx < x + bw - 22; wx += 26) {
          g.fillStyle = r.chance(0.5) ? '#ffe066' : '#262450';
          wobblyRect(g, wx, wy, 14, 16, r);
          g.fill();
          g.stroke();
        }
      if (r.chance(0.5)) {
        // neon sign
        g.strokeStyle = r.pick(['#ff70a6', '#70d6ff', '#e9ff70']);
        g.lineWidth = 4;
        g.strokeRect(x + 20, h - bh - 26, bw - 40, 18);
      }
      x += bw + r.range(10, 40);
    }
  },
  factory(g, w, h, r) {
    // pipes and gears
    g.fillStyle = '#7d8a8e';
    for (let i = 0; i < 3; i++) {
      const y = h - r.range(60, 180);
      wobblyRect(g, 0, y, w, 16, r);
      g.fill();
      inkLine(g, 2);
      g.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const x = r.range(0, w);
      const y = h - r.range(60, 160);
      const rad = r.range(22, 40);
      g.fillStyle = '#b08968';
      g.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const rr = k % 2 ? rad : rad * 1.25;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
      inkLine(g, 2);
      g.stroke();
      g.fillStyle = '#5b4636';
      g.beginPath();
      g.arc(x, y, rad * 0.35, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  },
  tower(g, w, h, r) {
    for (let i = 0; i < 8; i++) {
      // floating torn paper scraps
      const x = r.range(0, w);
      const y = r.range(60, h - 60);
      g.save();
      g.translate(x, y);
      g.rotate(r.range(-0.6, 0.6));
      g.fillStyle = 'rgba(239,230,255,0.85)';
      wobblyRect(g, -16, -12, 32, 24, r);
      g.fill();
      inkLine(g, 1.5);
      g.stroke();
      g.restore();
    }
    for (let i = 0; i < 6; i++) {
      // ink drips from above
      const x = r.range(0, w);
      const len = r.range(40, 140);
      g.fillStyle = '#1b1730';
      g.beginPath();
      g.moveTo(x - 8, 0);
      g.lineTo(x - 4, len);
      g.arc(x, len, 6, Math.PI, 0, true);
      g.lineTo(x + 8, 0);
      g.fill();
    }
  },
};

const WALL: Record<ThemeId, Painter> = {
  meadow(g, w, h, r) {
    // picket fence
    g.fillStyle = '#fffbf2';
    for (let x = 0; x < w; x += 34) {
      g.beginPath();
      g.moveTo(x + 4, h);
      g.lineTo(x + 4, h - 46 + r.range(-3, 3));
      g.lineTo(x + 14, h - 56);
      g.lineTo(x + 24, h - 46);
      g.lineTo(x + 24, h);
      g.closePath();
      g.fill();
      inkLine(g, 2);
      g.stroke();
    }
    wobblyRect(g, 0, h - 36, w, 8, r);
    g.fill();
    g.stroke();
  },
  canyon(g, w, h, r) {
    g.fillStyle = '#c97c3d';
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, h - 50 - r.range(0, 30));
    g.lineTo(w, h);
    g.closePath();
    g.fill();
    inkLine(g, 2);
    g.stroke();
  },
  city(g, w, h, r) {
    g.fillStyle = '#7a7f93';
    wobblyRect(g, 0, h - 20, w, 20, r);
    g.fill();
    inkLine(g, 2);
    g.stroke();
    for (let x = 60; x < w; x += 300) {
      // street lamps
      g.strokeStyle = INK;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x, h - 18);
      g.lineTo(x, h - 120);
      g.quadraticCurveTo(x, h - 134, x + 20, h - 134);
      g.stroke();
      g.fillStyle = '#ffe066';
      g.beginPath();
      g.arc(x + 24, h - 128, 9, 0, Math.PI * 2);
      g.fill();
      inkLine(g, 2);
      g.stroke();
    }
  },
  factory(g, w, h, r) {
    g.fillStyle = '#5f6b6f';
    wobblyRect(g, 0, h - 70, w, 70, r);
    g.fill();
    inkLine(g, 2);
    g.stroke();
    g.fillStyle = '#f4d35e';
    for (let x = 0; x < w; x += 60) {
      g.beginPath();
      g.moveTo(x, h - 70);
      g.lineTo(x + 30, h - 70);
      g.lineTo(x + 10, h - 58);
      g.lineTo(x - 20, h - 58);
      g.closePath();
      g.fill();
    }
    for (let x = 80; x < w; x += 240) {
      g.fillStyle = '#ffb347';
      wobblyRect(g, x, h - 54, 60, 28, r);
      g.fill();
      inkLine(g, 2);
      g.stroke();
    }
  },
  tower(g, w, h, r) {
    g.fillStyle = '#3b2d52';
    for (let y = h - 80; y < h; y += 20)
      for (let x = (y / 20) % 2 ? 0 : -20; x < w; x += 40) {
        wobblyRect(g, x, y, 40, 20, r);
        g.fill();
        inkLine(g, 1.5);
        g.strokeStyle = '#1d1430';
        g.stroke();
      }
  },
};

export interface ThemeTiles {
  far: HTMLCanvasElement;
  mid: HTMLCanvasElement;
  wall: HTMLCanvasElement;
  scale: number;
}

function paint(theme: ThemeId, which: 'far' | 'mid' | 'wall', h: number, scale: number, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.ceil(TILE_W * scale);
  c.height = Math.ceil(h * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  const r = new Rng(seed);
  const painter = which === 'far' ? FAR[theme] : which === 'mid' ? MID[theme] : WALL[theme];
  // paint twice, shifted by the tile width, so the tile wraps seamlessly
  g.save();
  painter(g, TILE_W, h, r);
  g.restore();
  g.save();
  g.translate(-TILE_W, 0);
  painter(g, TILE_W, h, new Rng(seed));
  g.restore();
  g.save();
  g.translate(TILE_W, 0);
  painter(g, TILE_W, h, new Rng(seed));
  g.restore();
  return c;
}

export function buildTiles(theme: ThemeId, scale: number): ThemeTiles {
  const s = Math.min(scale, 1.6);
  return {
    far: paint(theme, 'far', FLOOR_BACK_Y - 20, s, 11),
    mid: paint(theme, 'mid', FLOOR_BACK_Y - 30, s, 23),
    wall: paint(theme, 'wall', 140, s, 37),
    scale: s,
  };
}

/** Repeating paper grain used as a subtle overlay. */
export function buildGrain(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d')!;
  const r = new Rng(99);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r.chance(0.5) ? 'rgba(80,60,40,0.08)' : 'rgba(255,255,255,0.08)';
    g.fillRect(r.range(0, 160), r.range(0, 160), r.range(1, 3), 1);
  }
  g.strokeStyle = 'rgba(80,60,40,0.05)';
  for (let i = 0; i < 30; i++) {
    g.beginPath();
    const x = r.range(0, 160);
    const y = r.range(0, 160);
    g.moveTo(x, y);
    g.lineTo(x + r.range(-20, 20), y + r.range(-4, 4));
    g.stroke();
  }
  return c;
}

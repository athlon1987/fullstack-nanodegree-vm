// Palette-driven shared materials and procedural tileable textures for the
// POCKETHOOD architecture kit. Textures are grayscale detail maps tinted by the
// material colour, so one texture serves every colourway (fewer GPU uploads).
import * as THREE from 'three';
import { PALETTE } from '../../ui/tokens';

const texCache = new Map<string, THREE.CanvasTexture>();

function canvasTex(key: string, size: number, draw: (c: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

const shade = (v: number) => `rgb(${v},${v},${v})`;

export const TEX = {
  /** Scalloped roof shingles. */
  shingles: () =>
    canvasTex('shingles', 256, (c, s) => {
      c.fillStyle = shade(225);
      c.fillRect(0, 0, s, s);
      const rows = 8;
      const cols = 6;
      const rh = s / rows;
      const cw = s / cols;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (cw / 2);
        for (let i = -1; i <= cols; i++) {
          const x = i * cw + off;
          const y = r * rh;
          const g = c.createLinearGradient(0, y, 0, y + rh);
          g.addColorStop(0, shade(255));
          g.addColorStop(1, shade(200));
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(x + 2, y);
          c.lineTo(x + cw - 2, y);
          c.lineTo(x + cw - 2, y + rh * 0.55);
          c.quadraticCurveTo(x + cw / 2, y + rh * 1.25, x + 2, y + rh * 0.55);
          c.closePath();
          c.fill();
          c.strokeStyle = shade(165);
          c.lineWidth = 2;
          c.stroke();
        }
      }
    }),
  /** Horizontal clapboard siding. */
  siding: () =>
    canvasTex('siding', 128, (c, s) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const y = (i * s) / n;
        const g = c.createLinearGradient(0, y, 0, y + s / n);
        g.addColorStop(0, shade(255));
        g.addColorStop(0.85, shade(236));
        g.addColorStop(1, shade(205));
        c.fillStyle = g;
        c.fillRect(0, y, s, s / n);
      }
    }),
  /** Soft plaster with subtle mottling. */
  plaster: () =>
    canvasTex('plaster', 128, (c, s) => {
      c.fillStyle = shade(246);
      c.fillRect(0, 0, s, s);
      for (let i = 0; i < 220; i++) {
        const v = 232 + Math.floor(Math.random() * 22);
        c.fillStyle = `rgba(${v},${v},${v},0.5)`;
        c.beginPath();
        c.arc(Math.random() * s, Math.random() * s, 2 + Math.random() * 6, 0, Math.PI * 2);
        c.fill();
      }
    }),
  brick: () =>
    canvasTex('brick', 128, (c, s) => {
      c.fillStyle = shade(190);
      c.fillRect(0, 0, s, s);
      const rows = 8;
      const rh = s / rows;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * 16;
        for (let x = -32; x < s + 32; x += 32) {
          const v = 228 + Math.floor(Math.random() * 27);
          c.fillStyle = shade(v);
          c.fillRect(x + off + 1.5, r * rh + 1.5, 29, rh - 3);
        }
      }
    }),
  planks: () =>
    canvasTex('planks', 128, (c, s) => {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const v = 222 + Math.floor(Math.random() * 30);
        c.fillStyle = shade(v);
        c.fillRect((i * s) / n, 0, s / n, s);
        c.fillStyle = shade(170);
        c.fillRect((i * s) / n, 0, 2, s);
        for (let k = 0; k < 4; k++) {
          c.fillStyle = 'rgba(0,0,0,0.05)';
          c.fillRect((i * s) / n + 6 + Math.random() * 14, Math.random() * s, 1.5, 20 + Math.random() * 40);
        }
      }
    }),
  cobbles: () =>
    canvasTex('cobbles', 128, (c, s) => {
      c.fillStyle = shade(170);
      c.fillRect(0, 0, s, s);
      const n = 4;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const v = 215 + Math.floor(Math.random() * 35);
          c.fillStyle = shade(v);
          const off = (j % 2) * (s / n / 2);
          c.beginPath();
          c.roundRect(((i * s) / n + off) % s + 2, (j * s) / n + 2, s / n - 4, s / n - 4, 7);
          c.fill();
        }
    }),
  awning: (a: string, b: string) =>
    canvasTex(`awning:${a}:${b}`, 128, (c, s) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        c.fillStyle = i % 2 ? b : a;
        c.fillRect((i * s) / n, 0, s / n, s);
      }
    }),
  /** Corrugated zinc roofing (vertical ribs). */
  zinc: () =>
    canvasTex('zinc', 128, (c, s) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const g = c.createLinearGradient((i * s) / n, 0, ((i + 1) * s) / n, 0);
        g.addColorStop(0, shade(196));
        g.addColorStop(0.5, shade(255));
        g.addColorStop(1, shade(186));
        c.fillStyle = g;
        c.fillRect((i * s) / n, 0, s / n, s);
      }
      for (let k = 0; k < 6; k++) {
        c.fillStyle = 'rgba(0,0,0,0.06)';
        c.fillRect(0, Math.random() * s, s, 1.5);
      }
    }),
  /** Interlocking clay roof tiles. */
  tiles: () =>
    canvasTex('tiles', 128, (c, s) => {
      c.fillStyle = shade(200);
      c.fillRect(0, 0, s, s);
      const rows = 6;
      const cols = 6;
      for (let r = 0; r < rows; r++)
        for (let i = 0; i < cols; i++) {
          const x = (i * s) / cols;
          const y = (r * s) / rows;
          const g = c.createLinearGradient(x, 0, x + s / cols, 0);
          g.addColorStop(0, shade(215));
          g.addColorStop(0.5, shade(255));
          g.addColorStop(1, shade(205));
          c.fillStyle = g;
          c.fillRect(x + 1, y + 1, s / cols - 2, s / rows - 3);
        }
    }),
  /** Timber louvres / jalousie windows. */
  louvre: () =>
    canvasTex('louvre', 64, (c, s) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const g = c.createLinearGradient(0, (i * s) / n, 0, ((i + 1) * s) / n);
        g.addColorStop(0, shade(255));
        g.addColorStop(1, shade(170));
        c.fillStyle = g;
        c.fillRect(0, (i * s) / n, s, s / n);
      }
    }),
  /** Glazed floor / wall tiles in a simple chequer. */
  floorTiles: () =>
    canvasTex('floorTiles', 64, (c, s) => {
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
          c.fillStyle = shade((i + j) % 2 ? 255 : 222);
          c.fillRect((i * s) / 4, (j * s) / 4, s / 4, s / 4);
        }
    }),
  asphalt: () =>
    canvasTex('asphalt', 128, (c, s) => {
      c.fillStyle = shade(235);
      c.fillRect(0, 0, s, s);
      for (let i = 0; i < 500; i++) {
        const v = 215 + Math.floor(Math.random() * 40);
        c.fillStyle = shade(v);
        c.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
      }
    }),
};

const matCache = new Map<string, THREE.Material>();

export interface MatOpts {
  map?: THREE.Texture;
  repeat?: [number, number];
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

/** Shared MeshStandardMaterial keyed by colour + options. */
export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.map?.uuid ?? ''}|${o.repeat?.join('x') ?? ''}|${o.roughness ?? ''}|${o.metalness ?? ''}|${o.emissive ?? ''}|${o.emissiveIntensity ?? ''}|${o.opacity ?? ''}|${o.side ?? ''}`;
  const hit = matCache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  let map = o.map;
  if (map && o.repeat) {
    map = map.clone();
    map.repeat.set(...o.repeat);
    map.needsUpdate = true;
  }
  const m = new THREE.MeshStandardMaterial({
    color,
    map,
    roughness: o.roughness ?? 0.82,
    metalness: o.metalness ?? 0,
    emissive: o.emissive ? new THREE.Color(o.emissive) : undefined,
    emissiveIntensity: o.emissiveIntensity ?? 1,
    transparent: o.transparent,
    opacity: o.opacity ?? 1,
    side: o.side,
  });
  matCache.set(key, m);
  return m;
}

/** Window glass: one shared material whose glow follows the time of day. */
export const glass = new THREE.MeshStandardMaterial({
  color: '#a9d8e8',
  roughness: 0.15,
  metalness: 0.1,
  emissive: new THREE.Color('#ffc46b'),
  emissiveIntensity: 0,
});

/** Shared emissive bulbs (lamps, string lights) that light up at dusk. */
export const bulb = new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: new THREE.Color('#ffcf73'), emissiveIntensity: 0.2, roughness: 0.4 });

export function setNightAmount(n: number) {
  glass.emissiveIntensity = 0.05 + n * 1.25;
  glass.color.set(n > 0.5 ? '#c9b98f' : '#a9d8e8');
  bulb.emissiveIntensity = 0.2 + n * 2.4;
}

export const P = PALETTE;

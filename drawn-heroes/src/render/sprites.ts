// Loads the two hand-drawn heroes (cut into layers by tools/extract_sprites.py)
// and prepares flash-tinted copies for hit feedback.
import momoMeta from '../../assets/characters/momo.json';
import momoArmL from '../../assets/characters/momo_armL.png';
import momoArmR from '../../assets/characters/momo_armR.png';
import momoBody from '../../assets/characters/momo_body.png';
import momoFull from '../../assets/characters/momo_full.png';
import momoHead from '../../assets/characters/momo_head.png';
import momoTail from '../../assets/characters/momo_tail.png';
import scoutMeta from '../../assets/characters/scout.json';
import scoutBody from '../../assets/characters/scout_body.png';
import scoutFull from '../../assets/characters/scout_full.png';
import scoutHead from '../../assets/characters/scout_head.png';
import scoutTail from '../../assets/characters/scout_tail.png';
import type { HeroId } from '../data/types';

export interface SpritePart {
  img: HTMLImageElement;
  flash: HTMLCanvasElement;
  x: number;
  y: number;
  px: number;
  py: number;
}

export interface CharSprite {
  id: HeroId;
  width: number;
  height: number;
  parts: Record<string, SpritePart>;
  order: string[];
  full: HTMLImageElement;
  fullFlash: HTMLCanvasElement;
  fullUrl: string;
  headUrl: string;
}

interface Meta {
  width: number;
  height: number;
  parts: Record<string, { x: number; y: number; px: number | null; py: number | null }>;
  order: string[];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url.slice(0, 60)}`));
    img.src = url;
  });
}

function tinted(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

async function build(id: HeroId, meta: Meta, urls: Record<string, string>, full: string): Promise<CharSprite> {
  const parts: Record<string, SpritePart> = {};
  const entries = Object.entries(urls);
  const imgs = await Promise.all(entries.map(([, u]) => loadImage(u)));
  entries.forEach(([name], i) => {
    const m = meta.parts[name];
    const img = imgs[i];
    parts[name] = { img, flash: tinted(img, '#ffffff'), x: m.x, y: m.y, px: m.px ?? 0, py: m.py ?? 0 };
  });
  const fullImg = await loadImage(full);
  return {
    id,
    width: meta.width,
    height: meta.height,
    parts,
    order: meta.order,
    full: fullImg,
    fullFlash: tinted(fullImg, '#ffffff'),
    fullUrl: full,
    headUrl: urls.head,
  };
}

export async function loadSprites(): Promise<Record<HeroId, CharSprite>> {
  const [momo, scout] = await Promise.all([
    build('momo', momoMeta as Meta, { body: momoBody, tail: momoTail, armL: momoArmL, armR: momoArmR, head: momoHead }, momoFull),
    build('scout', scoutMeta as Meta, { body: scoutBody, tail: scoutTail, head: scoutHead }, scoutFull),
  ]);
  return { momo, scout };
}

export const ART_URLS = { momoFull, scoutFull, momoHead, scoutHead };

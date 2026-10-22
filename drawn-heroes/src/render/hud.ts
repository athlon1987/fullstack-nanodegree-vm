import { TEAM_METER_MAX } from '../config';
import { clamp } from '../core/math';
import type { Hero } from '../game/hero';
import type { World } from '../game/world';
import { INK } from './enemyArt';
import type { CharSprite } from './sprites';
import type { HeroId } from '../data/types';

const FONT = 'Lilita One, system-ui, sans-serif';

function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = 'rgba(255,251,242,0.92)'): void {
  g.fillStyle = fill;
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(x + 6, y);
  g.lineTo(x + w - 4, y + 2);
  g.lineTo(x + w, y + h - 4);
  g.lineTo(x + 3, y + h);
  g.closePath();
  g.fill();
  g.stroke();
}

function bar(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number, color: string, back = 'rgba(35,32,46,0.25)'): void {
  g.fillStyle = back;
  g.fillRect(x, y, w, h);
  g.fillStyle = color;
  g.fillRect(x, y, w * clamp(k, 0, 1), h);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
}

function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', outline = true): void {
  g.font = `${size}px ${FONT}`;
  g.textAlign = align;
  if (outline) {
    g.lineWidth = 4;
    g.strokeStyle = INK;
    g.strokeText(s, x, y);
  }
  g.fillStyle = color;
  g.fillText(s, x, y);
}

function portrait(g: CanvasRenderingContext2D, spr: CharSprite, cx: number, cy: number, r: number, grey: boolean): void {
  const head = spr.parts.head.img;
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = spr.id === 'momo' ? '#ffd8b5' : '#cfe1ff';
  g.fill();
  g.clip();
  const k = (r * 2.3) / Math.max(head.naturalWidth, head.naturalHeight);
  const w = head.naturalWidth * k;
  const h = head.naturalHeight * k;
  g.globalAlpha = grey ? 0.45 : 1;
  g.drawImage(head, cx - w / 2, cy - h * (spr.id === 'scout' ? 0.58 : 0.5), w, h);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
}

function heroPanel(g: CanvasRenderingContext2D, w: World, h: Hero, spr: CharSprite, x: number, right: boolean, frame: number): void {
  const W = 236;
  const px = right ? x - W : x;
  const y = 10;
  const low = h.active && h.hp / h.maxHp < 0.25;
  panel(g, px, y, W, 62, low && frame % 30 < 15 ? 'rgba(255,200,200,0.95)' : undefined);
  const pcx = right ? px + W - 34 : px + 34;
  portrait(g, spr, pcx, y + 31, 25, !h.active);
  const bx = right ? px + 12 : px + 66;
  const tag = w.mode === 'coop' ? (h.controller === 'p1' ? '1P' : '2P') : h.controller === 'p1' ? 'YOU' : 'CPU';
  text(g, `${h.def.name}`, right ? bx + 158 : bx, y + 19, 17, h.playerSlot === 0 ? '#ff8c42' : '#3a86ff', right ? 'right' : 'left');
  text(g, tag, right ? bx : bx + 158, y + 19, 13, '#fffbf2', right ? 'left' : 'right');
  const hpCol = h.hp / h.maxHp > 0.5 ? '#7bd34f' : h.hp / h.maxHp > 0.25 ? '#ffca3a' : '#ff595e';
  bar(g, bx, y + 26, 158, 14, h.hp / h.maxHp, hpCol);
  if (h.shield > 0) bar(g, bx, y + 26, 158 * (h.shield / 40), 4, 1, '#7bf1a8', 'transparent');
  const status = h.state === 'downed' ? `DOWN ${Math.ceil(h.downedT / 60)}s` : h.state === 'out' ? 'KNOCKED OUT' : low ? 'LOW HP' : `${Math.ceil(h.hp)}/${h.maxHp}`;
  text(g, status, bx + 79, y + 38, 12, '#ffffff', 'center');
  // special cooldown
  const sk = 1 - h.specialCd / h.specialMax;
  bar(g, bx, y + 45, 158, 8, sk, sk >= 1 ? '#ffd23f' : '#adb5bd');
  text(g, sk >= 1 ? (h.heroId === 'momo' ? 'BANANA READY' : 'BARK READY') : 'SPECIAL', bx + 79, y + 54, 10, sk >= 1 ? '#fffbf2' : '#e9ecef', 'center');
}

export function drawHud(g: CanvasRenderingContext2D, w: World, viewW: number, sprites: Record<HeroId, CharSprite>, frame: number): void {
  g.save();
  const [a, b] = w.heroes;
  heroPanel(g, w, a, sprites[a.heroId], 10, false, frame);
  heroPanel(g, w, b, sprites[b.heroId], viewW - 10, true, frame);

  // team meter
  const mw = Math.min(300, viewW - 540);
  const mx = viewW / 2 - mw / 2;
  const k = w.meter / TEAM_METER_MAX;
  panel(g, mx - 8, 8, mw + 16, 50);
  const full = k >= 1;
  bar(g, mx, 28, mw, 14, k, full ? (frame % 20 < 10 ? '#ffd23f' : '#ff8c42') : k >= 0.5 ? '#ffb347' : '#ffd23f');
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  for (const m of [0.25, 0.5]) {
    g.beginPath();
    g.moveTo(mx + mw * m, 26);
    g.lineTo(mx + mw * m, 44);
    g.stroke();
  }
  text(g, full ? 'TEAM FINISHER READY!' : k >= 0.5 ? 'ULTIMATE READY' : 'TEAM METER', viewW / 2, 23, 14, full ? '#ffd23f' : '#fffbf2', 'center');
  const pencils = w.pencilsRun.filter(Boolean).length;
  text(g, `✎ ${pencils}/3   ◆ ${w.stats.inkCollected}   ${w.stats.score.toLocaleString()}`, viewW / 2, 56, 13, '#fffbf2', 'center');

  // boss bar(s)
  const twins = w.twins;
  let objY = 80;
  if (twins.length) {
    const bw = Math.min(200, (viewW - 80) / 2 - 20);
    twins.forEach((t, i) => {
      const x = viewW / 2 + (i === 0 ? -bw - 10 : 10);
      text(g, 'Smudge Twin', x, 78, 13, '#e0c3fc');
      bar(g, x, 83, bw, 10, t.hp / t.maxHp, '#9d4edd');
    });
    objY = 114;
  } else if (w.bossBar) {
    const boss = w.bossBar;
    const bw = Math.min(460, viewW - 120);
    const x = viewW / 2 - bw / 2;
    text(g, boss.def.name, x, 80, 15, '#fffbf2');
    if (boss.openT > 0) text(g, 'OPEN! HIT IT!', x + bw, 80, 13, '#ffd23f', 'right');
    bar(g, x, 85, bw, 12, boss.hp / boss.maxHp, boss.openT > 0 ? '#ffd23f' : '#e63946');
    if (boss.maxArmor > 0) bar(g, x, 98, bw * 0.5, 5, boss.armorPts / boss.maxArmor, '#ced4da');
    objY = 122;
  }
  // current objective
  if (w.objective) {
    g.font = `15px ${FONT}`;
    const tw = Math.min(viewW - 40, g.measureText(w.objective).width + 24);
    g.fillStyle = 'rgba(35,32,46,0.72)';
    g.beginPath();
    g.roundRect ? g.roundRect(viewW / 2 - tw / 2, objY - 15, tw, 22, 11) : g.rect(viewW / 2 - tw / 2, objY - 15, tw, 22);
    g.fill();
    text(g, w.objective, viewW / 2, objY + 1, 15, '#fffbf2', 'center', false);
  }

  // combo
  if (w.combo >= 3) {
    const pop = w.comboT > 110 ? 1.15 : 1;
    g.save();
    g.translate(viewW - 24, 132);
    g.scale(pop, pop);
    text(g, `${w.combo}`, 0, 0, 40, w.combo >= 20 ? '#ff595e' : w.combo >= 10 ? '#ffb347' : '#ffd23f', 'right');
    text(g, 'HITS', 0, 20, 16, '#fffbf2', 'right');
    g.restore();
  }

  // go sign
  if (w.goSign > 0 && frame % 30 < 20 && !w.encounter) {
    g.save();
    g.translate(viewW - 70, 250);
    text(g, 'GO', 0, 0, 44, '#ffd23f', 'center');
    g.fillStyle = '#ffd23f';
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-26, 12);
    g.lineTo(14, 12);
    g.lineTo(14, 4);
    g.lineTo(34, 20);
    g.lineTo(14, 36);
    g.lineTo(14, 28);
    g.lineTo(-26, 28);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }
  g.restore();
}

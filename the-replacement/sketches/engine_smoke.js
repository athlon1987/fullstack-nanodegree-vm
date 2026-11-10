// Smoke test for the engine: exercises camera, glow, fog, text, cache, cues.
import { PW, PH, CX, CY, camera, glow, fog, text, linGrad, cached, key, ease, wobble, FONT, grade, lightCone, rad } from '../src/engine.js';

export const duration = 6;
export const cues = [
  { id: 'c1', at: 0.5, dur: 2, who: 'ADAM', text: 'I promise I’ll try.' },
  { id: 'c2', at: 3, dur: 2.2, who: 'V1', text: 'I’m you. Without the limitations.' },
];

export default function draw(ctx, F) {
  const { t } = F;
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, PH, [[0, '#0a1220'], [1, '#1b2a44']]);
  ctx.fillRect(0, 0, PW, PH);
  const cam = { x: key(t, [[0, 900], [6, 1020, ease.inOutSine]]), y: CY, zoom: key(t, [[0, 1], [6, 1.15]]) };
  camera(ctx, cam, 0.3, () => {
    const bg = cached('smoke-bg', PW, PH, (c) => {
      c.fillStyle = '#16233a';
      for (let i = 0; i < 24; i++) c.fillRect(i * 90, 300 - ((i * 53) % 170), 60, 600);
    });
    ctx.drawImage(bg, 0, 0);
  });
  fog(ctx, t, 420, 200, '#9fb0c8', 0.1, 3);
  camera(ctx, cam, 1, () => {
    ctx.fillStyle = '#05070b'; ctx.fillRect(-200, 700, PW + 400, 300);
    lightCone(ctx, 960, 120, rad(90), rad(50), 620, '#ffb561', 0.35);
    glow(ctx, 960, 120, 120, '#ffb561', 0.9);
    ctx.fillStyle = '#05070b';
    ctx.beginPath(); ctx.arc(960 + wobble(t, 1, 2) * 6, 520, 46, 0, 7); ctx.fill();
    ctx.fillRect(915, 560, 90, 150);
    glow(ctx, 960, 705, 300, '#ffb561', 0.25, 0.18);
  });
  grade(ctx, '#3fc8ff', 0.12);
  text(ctx, 'THE REPLACEMENT', CX, 110, { size: 54, weight: 300, tracking: 26, align: 'center', color: '#e8eef5' });
  text(ctx, 'IDENTITY STATUS: DEPRECATED', CX, 170, { size: 26, family: FONT.mono, tracking: 4, align: 'center', color: '#7fe7ff', alpha: F.cue('c2').active ? 1 : 0.4 });
  text(ctx, 'Daddy, don’t forget me when you’re busy.', CX, 250, { size: 40, family: FONT.hand, align: 'center', color: '#ffe9cc' });
  text(ctx, '“A week later.”', CX, 320, { size: 44, family: FONT.serif, italic: true, align: 'center', color: '#f6ead8' });
}

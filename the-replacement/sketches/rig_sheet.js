// Rig test sheet. panel = floor(t).
import { PW, PH, linGrad, text, camera, glow } from '../src/engine.js';
import { C, LOOK } from '../src/style.js';
import { drawFigure, POSE, drawHand, CAST } from '../src/rig.js';

export const duration = 6;
const bg = (ctx, a, b) => { ctx.fillStyle = linGrad(ctx, 0, 0, 0, PH, [[0, a], [1, b]]); ctx.fillRect(0, 0, PW, PH); };
const floor = (ctx, y, col) => { ctx.fillStyle = col; ctx.fillRect(0, y, PW, PH - y); };
const lbl = (ctx, s, x, y) => text(ctx, s, x, y, { size: 16, color: '#223', align: 'center', weight: 600 });

export default function draw(ctx, F) {
  const panel = Math.floor(F.t), t = F.t;
  const warm = { color: C.honey, from: 1, amount: 0.9 }, cool = { color: '#cfdcee', from: 1, amount: 0.8 };
  if (panel === 0) {
    bg(ctx, '#8a9bb3', '#c3cedd'); floor(ctx, 700, '#55647a');
    const names = ['adam', 'v1', 'wife', 'maya', 'manager', 'guard', 'clerk', 'rep', 'officer', 'extraM', 'extraF'];
    names.forEach((n, i) => { const x = 130 + i * 165; drawFigure(ctx, n, { x, y: 700, ...POSE.stand }, { light: cool, ink: LOOK.greyMorning.ink }); lbl(ctx, n, x, 740); });
  } else if (panel === 1) {
    bg(ctx, '#ffd9a0', '#fff1d6'); floor(ctx, 760, '#b8763a');
    drawFigure(ctx, 'adam', { x: 620, y: 760, s: 1.55, ...POSE.stand }, { light: { color: '#fff', from: 1, amount: 0.5 }, ink: LOOK.warmDay.ink });
    drawFigure(ctx, 'v1', { x: 1300, y: 760, s: 1.55, facing: -1, ...POSE.stand }, { light: { color: '#fff', from: -1, amount: 0.5 }, ink: LOOK.warmDay.ink, glint: 1 });
  } else if (panel === 2) {
    bg(ctx, '#9fb0c8', '#d5deea'); floor(ctx, 700, '#62738c');
    const A = (pose, x, o = {}) => drawFigure(ctx, 'adam', { x, y: 700, ...pose }, { light: cool, ...o });
    A(POSE.stand, 90); A(POSE.walk(0.05), 240); A(POSE.walk(0.3), 390); A(POSE.walk(0.55), 540); A(POSE.run(0.1), 720); A(POSE.run(0.45), 930);
    ctx.fillStyle = '#44546b'; ctx.fillRect(1090, 590, 110, 12); ctx.fillRect(1180, 515, 150, 12);
    A(POSE.sitForward, 1140); A({ ...POSE.sitBed, ...POSE.handOnBack, seat: 120 }, 1400); ctx.fillStyle = '#44546b'; ctx.fillRect(1330, 580, 160, 120);
    A(POSE.kneelOne, 1590); A(POSE.handsOnHead, 1760);
    ctx.save(); ctx.translate(0, -330); ctx.scale(0.62, 0.62); ctx.translate(0, 560);
    A(POSE.point, 200); A(POSE.holdPhone, 480); A(POSE.headBowed, 760); A(POSE.sitHunched, 1040); A(POSE.foreheadOnDoor, 1320); A(POSE.wipeEyes, 1600); A(POSE.leanBack, 1880); A(POSE.kneelWork, 2200); A(POSE.crouch, 2500); A(POSE.sleepSit, 2800);
    ctx.restore();
  } else if (panel === 3) {
    bg(ctx, '#17110b', '#0a0705'); glow(ctx, 520, 250, 620, C.honey, 0.55); glow(ctx, 1420, 300, 560, C.honey, 0.5);
    floor(ctx, 700, '#0a0705');
    const L = { color: C.honey, from: 1, amount: 1 }, Lr = { color: C.honey, from: -1, amount: 1 }, ink = LOOK.lampNight.ink;
    // two men at a table
    drawFigure(ctx, 'adam', { x: 330, y: 700, ...POSE.sitForward }, { light: L, ink });
    drawFigure(ctx, 'v1', { x: 710, y: 700, facing: -1, ...POSE.sit, armF: [44, 70], armB: [40, 72] }, { light: Lr, ink, glint: 0.9 });
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(400, 515, 240, 12); ctx.fillRect(420, 527, 10, 173); ctx.fillRect(610, 527, 10, 173);
    // hug: seated adam + maya
    const ad = drawFigure(ctx, 'adam', { x: 1150, y: 700, ...POSE.hugSeated }, { light: L, ink });
    drawFigure(ctx, 'maya', { x: 1262, y: 700, facing: -1, ...POSE.childHug, handF: { x: ad.neck.x - 6, y: ad.neck.y + 6 }, handB: { x: ad.neck.x + 16, y: ad.neck.y - 4 }, lean: 14 }, { light: Lr, ink, wear: { pyjamas: true } });
    // kneeling adam and maya standing
    drawFigure(ctx, 'adam', { x: 1560, y: 700, ...POSE.kneelOne, armF: [58, 30] }, { light: L, ink });
    drawFigure(ctx, 'maya', { x: 1760, y: 700, facing: -1, ...POSE.stand, head: 10 }, { light: Lr, ink, wear: { starHeadband: true, backpack: true } });
  } else if (panel === 4) {
    bg(ctx, '#0b1526', '#1c2e4d'); glow(ctx, 1500, 200, 900, '#5f7fb0', 0.5); glow(ctx, 500, 300, 700, '#5f7fb0', 0.35);
    const L = { color: C.honey, from: 1, amount: 1 };
    camera(ctx, { x: 960, y: 335, zoom: 2.55 }, 1, () => {
      drawFigure(ctx, 'adam', { x: 640, y: 700, ...POSE.stand }, { light: L, catch: 1 });
      drawFigure(ctx, 'adam', { x: 770, y: 700, ...POSE.headBowed }, { light: L, tear: 0.6 });
      drawFigure(ctx, 'v1', { x: 900, y: 700, ...POSE.stand }, { light: L, glint: 1 });
      drawFigure(ctx, 'wife', { x: 1020, y: 690, ...POSE.stand }, { light: L });
      drawFigure(ctx, 'maya', { x: 1135, y: 580, ...POSE.stand }, { light: L });
      drawFigure(ctx, 'rep', { x: 1250, y: 705, ...POSE.stand }, { light: L });
    });
  } else {
    bg(ctx, '#9fb0c8', '#d5deea'); floor(ctx, 420, '#62738c');
    for (let i = 0; i < 8; i++) { drawFigure(ctx, 'adam', { x: 130 + i * 230, y: 420, s: 0.8, ...POSE.walk(i / 8) }, { light: cool }); drawFigure(ctx, 'maya', { x: 130 + i * 230 + 100, y: 420, s: 0.8, ...POSE.run(i / 8) }, { light: cool }); }
    const hp = ['flat', 'open', 'point', 'grip', 'pinch'];
    hp.forEach((h, i) => { drawHand(ctx, { x: 240 + i * 360, y: 620, size: 150, pose: h, rot: -8 }); lbl(ctx, h, 300 + i * 360, 770); });
  }
}

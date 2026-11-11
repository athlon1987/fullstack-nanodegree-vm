// Shots: a5_01_arrive, a5_02_table, a5_03_lunchbox, a5_05_note, a5_06_noanswer, a5_07_letdown
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease } from '../engine.js';
import { LOOK } from '../style.js';
import { drawFigure, POSE } from '../rig.js';
import { kitchen } from '../sets/kitchen.js';
import { talk, breath, drift } from '../stage.js';

const K = kitchen.anchors;

export const shots = {
  // ── WORKED EXAMPLE ── the two men at the table under the lamp: exact mirror symmetry, slow push-in.
  a5_02_table(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const cam = drift(F, { x: 800, y: 425, zoom: 1.5 }, { x: 800, y: 436, zoom: 1.82 });
    const o = { look, cam, lampSway: Math.sin(t * 0.5) * 0.05 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam (left, faces right): slumped on his forearms; raises his eyes to V1 to ask.
      const up = key(t, [[0, 0], [1.6, 0], [2.3, 1], [20, 1]]);
      drawFigure(ctx, 'adam', {
        x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, head: 14 - up * 12, lean: 18 - up * 3,
        handF: { x: 690, y: 506 }, handB: { x: 668, y: 508 },
      }, { ink, light: kitchen.lightAt(look, K.seatL.x, o), talk: talk(F, 'a5_love', 'a5_howmuch'), breath: breath(t) });
      // V1 (right, faces left): plumb upright, hands folded on the table, answers instantly, never moves.
      drawFigure(ctx, 'v1', {
        x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3,
        handF: { x: 946, y: 506 }, handB: { x: 958, y: 507 },
      }, { ink, light: kitchen.lightAt(look, K.seatR.x, o), talk: talk(F, 'a5_ofcourse', 'a5_more'), breath: breath(t, 2) * 0.4, glint: 0.75, aura: 0.45 });
    });
    kitchen.front(ctx, F, o);
  },
};

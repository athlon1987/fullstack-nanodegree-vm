// Shots: a1_07_boss, a1_08_car, a1_09_auditorium, a1_10_outside
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp, rgba, rr, text, measure, FONT, glow } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase } from '../rig.js';
import { lunchbox, phoneSmall, backpack } from '../props.js';
import { managerOffice } from '../sets/office.js';
import { roadside } from '../sets/street.js';
import { auditorium, steps } from '../sets/school.js';
import { talk, breath, drift, ramp } from '../stage.js';

const RED = (lum, tint, light) => ({ lum, tint, light });
/** Sets describe lights as {key, from, amount}; the rig wants {color, from, amount}. */
const LT = (l) => ({ color: l.color || l.key, from: l.from, amount: l.amount });

/** Inside a held() callback: rotate the local frame so that +y points straight down on screen (a prop hanging from a grip). */
function hangDown(c, swing = 0) {
  const m = c.getTransform();
  let th = Math.atan2(m.c, m.a);
  if (m.d * Math.cos(th) - m.b * Math.sin(th) < 0) th += Math.PI;
  c.rotate(th + swing);
}

export const shots = {
  // ── a1_07 ── the manager's verdict. Adam small and low at left, manager towering behind the desk at right.
  a1_07_boss(ctx, F) {
    const { t } = F, look = 'officeDay', ink = LOOK[look].ink, MO = managerOffice.anchors, L = LT(managerOffice.lights.officeDay);
    const cam = drift(F, { x: 1000, y: 402, zoom: 1.0 }, { x: 830, y: 436, zoom: 1.16 });
    const o = { look, cam, chart: ease.inOutSine(clamp(t / 1.5)) };
    const boss = F.cue('a1_boss'), sorry = F.cue('a1_sorry1');
    const rap = boss.at + 1.4;                                   // on "below"
    managerOffice.back(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Manager (right, faces left): knuckles on the desk, gestures up, raps once, then leans on the desk; straightens, unmoved.
      const mHand = key(t, [[0, { x: 1372, y: 502 }], [boss.at, { x: 1372, y: 502 }], [rap - 0.55, { x: 1342, y: 452 }, ease.inOutCubic],
        [rap - 0.04, { x: 1344, y: 448 }], [rap, { x: 1350, y: 503 }, ease.inCubic], [boss.end + 0.6, { x: 1352, y: 503 }],
        [sorry.end + 0.4, { x: 1376, y: 470 }, ease.inOutCubic]]);
      const mLean = key(t, [[0, 4], [boss.at, 4], [rap, 13], [boss.end, 15], [sorry.end + 0.6, 3]]);
      const mHead = key(t, [[0, 6], [rap, 10], [boss.end, 8], [sorry.at + 0.2, 4], [sorry.end + 0.6, -3]]);
      drawFigure(ctx, 'manager', {
        x: MO.managerStand.x, y: 700, facing: -1, ...POSE.stand, lean: mLean, head: mHead, curl: 2,
        handF: mHand, armB: [-4, 14],
      }, { ink, light: L, talk: talk(F, 'a1_boss'), breath: breath(t, 1.3) });

      // Adam (left, faces right) in the low chair, the red lunchbox on his knees, hands on it.
      const flinch = clamp(1 - Math.abs(t - rap - 0.12) / 0.35) * ease.outQuad(clamp((t - rap) / 0.1));
      const sink = ramp(t, sorry.at - 0.1, 1.3, ease.inOutSine);
      const lower = ramp(t, rap + 0.4, 2.2, ease.inOutSine);
      const head = -6 + lower * 9 + flinch * 7 + sink * 26;
      const lap = { x: 662, y: 601 };
      const a = drawFigure(ctx, 'adam', {
        x: MO.visitorSeat.x, y: 700, facing: 1, ...POSE.sit, seat: 90,
        lean: 4 + lower * 3 - flinch * 3 + sink * 9, curl: 2 + sink * 10, head, neck: sink * 6,
        handF: { x: lap.x + 14, y: lap.y - 12 + sink * 2 }, handB: { x: lap.x - 12, y: lap.y - 14 + sink * 2 },
      }, { ink, light: L, talk: talk(F, 'a1_sorry1'), breath: breath(t, 0.4) });
      lunchbox(ctx, { x: lap.x, y: lap.y, size: 46, ...RED(0.95, LOOK.officeDay.fill, { color: L.color, from: -1, amount: 0.45 }) });
      void a;
    });
    managerOffice.front(ctx, F, o);
  },

  // ── a1_08 ── the car dies at dusk; the reminder; he grabs the lunchbox and runs out RIGHT.
  a1_08_car(ctx, F) {
    const { t } = F, look = 'dusk', ink = LOOK[look].ink, RA = roadside.anchors, L = LT(roadside.lights.dusk);
    const cam = drift(F, { x: 990, y: 412, zoom: 1.0 }, { x: 1010, y: 420, zoom: 1.06 });
    const sp = F.ev('sputter'), rem = F.ev('reminder'), run = F.ev('run');
    const shake = key(t, [[0, 0], [sp, 1, ease.outQuad], [sp + 0.35, 0.8], [sp + 1.1, 0, ease.inOutSine]]);
    const o = { look, cam, smoke: 1, shake };
    roadside.back(ctx, F, o);
    roadside.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      const lb = { size: 46, ...RED(0.85, LOOK.dusk.fill, { color: L.color, from: 1, amount: 0.7 }) };
      // the lunchbox on the roof, shuddering with the car; its handle lifts as he reaches for it
      let grip = { x: RA.roof.x, y: RA.roof.y - 42 };
      if (t < run) {
        const cp = roadside.carPose(o, t);
        ctx.save();
        ctx.translate(cp.px, cp.py); ctx.rotate(cp.rot); ctx.translate(-cp.px + cp.dx, -cp.py + cp.dy);
        const an = lunchbox(ctx, { ...lb, x: RA.roof.x, y: RA.roof.y, handleUp: ramp(t, run - 0.3, 0.25), wobble: shake * Math.sin(t * 40) * 0.4 });
        ctx.restore();
        if (an && an.handle) grip = an.handle;
      }
      // Adam: hands on head → phone → reads → looks up → reaches back for the box → runs.
      const u = t - run - 0.05;
      const runD = u <= 0 ? 0 : (u < 0.4 ? 1500 * u * u : 240 + 1200 * (u - 0.4));
      const x = key(t, [[0, RA.adam.x], [run - 0.4, RA.adam.x], [run, RA.adam.x - 36, ease.inOutCubic]]) + runD;
      const rub = Math.sin(t * 1.3) * 3;
      const onHead = { ...POSE.handsOnHead, head: -8 + rub + 6 * ramp(t, sp, 0.3) * (1 - ramp(t, sp + 0.4, 0.8)) };
      const phone = { ...POSE.holdPhone, head: 22 };
      const lookUp = { ...POSE.holdPhone, head: -4, lean: -3 };
      const reach = { ...POSE.stand, lean: -6, head: -6, handF: grip };
      let pose = mixPose(onHead, phone, ramp(t, rem, 0.5));
      pose = mixPose(pose, lookUp, ramp(t, rem + 1.0, 0.35, ease.outCubic));
      const kReach = ramp(t, run - 0.38, 0.38);
      if (kReach > 0) {
        const base = { ...pose, handF: undefined };
        const fromHand = { x: x + 40, y: 470 };
        pose = { ...mixPose(base, reach, kReach), handF: { x: lerp(fromHand.x, grip.x, kReach), y: lerp(fromHand.y, grip.y, kReach) } };
      }
      const kRun = ramp(t, run + 0.05, 0.3);
      if (kRun > 0) {
        const r = POSE.run(runD / 730 + 0.15);
        const hf = pose.handF;
        pose = mixPose({ ...pose, handF: undefined }, r, kRun);
        if (kRun < 1 && hf) pose.handF = { x: lerp(hf.x, x + 62, kRun), y: lerp(hf.y, 440, kRun) };
      }
      const showPhone = t >= rem && t < run - 0.3;
      const held = {};
      if (showPhone) {
        held.front = (c) => phoneSmall(c, { x: 0, y: 0, size: 37, rot: -78, glow: '#e2e8f1', turn: 0.3, bloom: 0.5,
          alpha: ramp(t, rem, 0.25) * (1 - ramp(t, run - 0.6, 0.25)) });
      } else if (t >= run) {
        held.front = (c) => { hangDown(c, Math.sin(t * 9) * 0.12 * kRun); lunchbox(c, { ...lb, x: 0, y: 0, anchor: 'handle' }); };
      }
      drawFigure(ctx, 'adam', { x, y: 700, facing: 1, ...pose },
        { ink, light: L, breath: breath(t, 0, 2.4) * (1 - kRun), held });
    });
    roadside.front(ctx, F, o);
    // the notification chip, beside him in the calm sky, held to the end
    const k = ramp(t, rem + 0.05, 0.4, ease.outCubic);
    if (k > 0) {
      camera(ctx, cam, 1, () => {
        const l1 = 'REMINDER — Maya\'s school performance · 5:30 PM', l2 = 'Now 6:12 PM';
        const f1 = { size: 31, weight: 500, family: FONT.sans }, f2 = { size: 31, weight: 400, family: FONT.mono };
        const w = Math.max(measure(ctx, l1, f1), measure(ctx, l2, f2)) + 64, h = 122;
        const cx = RA.chip.x + 30 + (1 - k) * 60, cy = RA.chip.y - 18;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
        ctx.fillStyle = 'rgba(16,18,30,0.9)';
        rr(ctx, cx - w / 2, cy - h / 2, w, h, 22); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(220,228,245,0.16)'; ctx.lineWidth = 1.5; ctx.stroke();
        text(ctx, l1, cx - w / 2 + 32, cy - 10, { ...f1, color: '#eef2f8' });
        text(ctx, l2, cx - w / 2 + 32, cy + 38, { ...f2, color: '#a9b3c6' });
        ctx.restore();
      });
    }
  },

  // ── a1_09 ── the empty hall. The door opens; Adam, small and out of breath, too late. The camera leaves him for the stage.
  a1_09_auditorium(ctx, F) {
    const { t } = F, look = 'nightDark', ink = LOOK[look].ink, A = auditorium.anchors;
    const cam = drift(F, { x: 960, y: 402, zoom: 1.0 }, { x: 960, y: 330, zoom: 1.07 });
    const door = F.ev('door'), doorOpen = ramp(t, door, 0.5, ease.inOutSine);
    const o = { look, cam, doorOpen, shadow: doorOpen };
    auditorium.back(ctx, F, o);
    auditorium.mid && auditorium.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      if (doorOpen <= 0) return;
      const heave = Math.sin(t * 4.6);
      const up = ramp(t, door + 1.2, 0.9, ease.inOutSine);         // straightens to look for her
      const drop = ramp(t, door + 2.6, 0.8, ease.inOutSine);       // nobody here
      const L = { ...LT(auditorium.lights.nightDark), amount: 0.55 * doorOpen };
      drawFigure(ctx, 'adam', {
        x: A.door.x, y: A.door.y, s: A.door.scale, facing: 1, ...POSE.stand,
        lean: 20 - up * 12 + drop * 6 + heave * 2.5, curl: 6 + drop * 6, head: 8 - up * 12 + drop * 16 + heave * 2,
        armF: [8 - up * 4, 10], armB: [26 - up * 16, 18], footF: [0.06, 0], footB: [-0.05, 0],
      }, { ink, light: L, breath: heave * 3, held: { front: (c) => { hangDown(c); lunchbox(c, { x: 0, y: 0, size: 46, anchor: 'handle', lum: 0.55, tint: LOOK.nightDark.fill, light: { color: '#d8cfbe', from: -1, amount: 0.6 * doorOpen } }); } } });
    });
    auditorium.front(ctx, F, o);
  },

  // ── a1_10 ── the wound. Maya on the steps; he kneels; she will not be reached; she leaves him there.
  a1_10_outside(ctx, F) {
    const { t } = F, look = 'blueHour', ink = LOOK[look].ink, S = steps.anchors;
    const arrive = F.ev('arrive'), kneel = F.ev('kneel'), walk = F.ev('walk');
    const said = F.cue('a1_said'), sorry = F.cue('a1_sorry2'), always = F.cue('a1_always');
    const cam = key(t, [[0, { x: 1150, y: 486, zoom: 1.5 }], [walk - 0.2, { x: 1128, y: 494, zoom: 1.78 }, ease.inOutSine],
      [F.T, { x: 1030, y: 512, zoom: 1.95 }, ease.inOutSine], [F.T + 1, { x: 1022, y: 514, zoom: 2.0 }, ease.linear]]);
    const o = { look, cam };
    steps.back(ctx, F, o);
    steps.mid && steps.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // ── Maya ──
      const MSIT = { ...POSE.sitSteps, seat: undefined, hip: 0.414 };
      const away = ramp(t, said.at - 0.3, 0.8, ease.inOutSine);
      const lean = ramp(t, sorry.at + 0.35, 0.9, ease.inOutSine);
      const look2 = ramp(t, always.at - 0.15, 0.7, ease.inOutSine);
      let mp = { ...MSIT, head: 10 + away * 8 + lean * 2 - look2 * 22, lean: 20 - lean * 24 + look2 * 8, curl: 12 - lean * 6, hipX: lean * 0.03, armF: [44 - lean * 30, 70 + lean * 60], armB: [40 - lean * 28, 72 + lean * 55], neck: away * 4 - look2 * 6 };
      let mx = S.mayaSit.x, my = S.mayaSit.y, wearPack = false;
      const rise = ramp(t, walk, 0.45, ease.inOutSine);
      const grab = ramp(t, walk, 0.3) * (1 - ramp(t, walk + 0.3, 0.2));
      if (t >= walk) {
        mp = mixPose(mp, { ...POSE.stand, head: 4, lean: 3 }, rise);
        mx = lerp(S.mayaSit.x, S.mayaStand.x, rise);
        if (grab > 0) mp.handB = { x: S.backpack.x - 8, y: S.backpack.y - 66 };
        wearPack = t >= walk + 0.32;
      }
      const u = t - (walk + 0.3), v = 480;
      const md = u <= 0 ? 0 : (u < 0.3 ? v * u * u / 0.6 : v * (u - 0.15));
      if (md > 0) {
        mx = S.mayaStand.x - md;
        mp = mixPose(mp, POSE.walk(walkPhase(md, 'maya')), clamp(md / 40));
        mp.head = 6;
      }
      // y follows the step plants as she comes down
      const plants = [[S.mayaStand.x, S.mayaStand.y], ...S.mayaDown.map((p) => [p.x, p.y])];
      if (md > 0) {
        my = 700;
        for (let i = 0; i < plants.length - 1; i++) {
          const [x0, y0] = plants[i], [x1, y1] = plants[i + 1];
          if (mx <= x0 && mx >= x1) my = lerp(y0, y1, ease.inOutSine((x0 - mx) / (x0 - x1)));
        }
        if (mx > plants[0][0]) my = plants[0][1];
      }
      const mOpts = { ink, light: LT(steps.lightAt(look, mx, o)), talk: talk(F, 'a1_said', 'a1_always'), breath: breath(t, 2.1),
        wear: { starHeadband: true, backpack: wearPack } };
      if (!wearPack) backpack(ctx, { x: S.backpack.x, y: S.backpack.y, size: 80, slump: 0.6, flip: -1, lum: 0.35, tint: LOOK.blueHour.fill,
        light: { color: '#ffb561', from: 1, amount: 0.6 }, shadow: 0.5 });
      const mayaPose = { x: mx, y: my, s: 1, facing: -1, ...mp };
      const behind = md > 0;
      let maya = null;
      if (behind) maya = drawFigure(ctx, 'maya', mayaPose, mOpts);
      else {
        // draw once to learn where her shoulder is (she is in front of the wall; Adam is drawn after her anyway)
        maya = drawFigure(ctx, 'maya', mayaPose, mOpts);
      }

      // ── Adam ──
      const ax = key(t, [[0, S.adamEnter.x + 240], [arrive, S.adamEnter.x + 690, ease.linear], [kneel + 0.45, S.adamKneel.x, ease.outQuad]]);
      const wd = ax - (S.adamEnter.x + 240);
      const KNEEL = { ...POSE.kneelOne, legB: undefined, footRotB: 60, footB: [-0.3, -0.012], footF: [0.205, -0.1023], lean: 8, head: -2 };
      const kk = ramp(t, kneel, 1.1, ease.inOutSine);
      const stop = ramp(t, kneel - 0.4, 0.8);
      let ap = mixPose(POSE.walk(walkPhase(wd, 'adam'), { stride: 0.17 }), { ...POSE.stand, head: 0 }, stop);
      ap = mixPose(ap, KNEEL, kk);
      ap.lean += Math.sin(t * 2.6) * 1.2 * (1 - kk);                // still winded
      // set the lunchbox down beside him while kneeling
      const boxGround = { x: 1004, y: 700 };
      const setK = ramp(t, kneel + 0.5, 0.8, ease.inOutSine), letGo = t >= kneel + 1.35;
      const handUp = ramp(t, kneel + 1.4, 0.6, ease.inOutSine);
      const restHand = { x: 1046, y: 594 };
      // reach toward her shoulder on a1_sorry2, stop short as she leans away, sink to half raised
      const reachK = ramp(t, sorry.at + 0.1, 1.0, ease.inOutSine);
      const backK = ramp(t, sorry.at + 1.0, 0.9, ease.inOutSine);
      const halfK = ramp(t, always.end, 1.2, ease.inOutSine);
      const sh = maya.shoulder;
      const reachPt = { x: sh.x - 100, y: sh.y + 10 };
      const halfPt = { x: 1092, y: 500 };
      let hand = null;
      if (setK > 0) hand = { x: lerp(1018, boxGround.x + 2, setK), y: lerp(610, 664, setK) };
      if (letGo) hand = { x: lerp(boxGround.x + 2, restHand.x, handUp), y: lerp(664, restHand.y, handUp) };
      if (reachK > 0) {
        const pr = { x: lerp(restHand.x, reachPt.x, reachK), y: lerp(restHand.y, reachPt.y, reachK) };
        const pb = { x: lerp(pr.x, reachPt.x - 22, backK), y: lerp(pr.y, reachPt.y + 6, backK) };
        hand = { x: lerp(pb.x, halfPt.x, halfK), y: lerp(pb.y, halfPt.y, halfK) };
      }
      if (hand) ap.handF = hand;
      ap.lean += setK * (1 - handUp) * 16 + reachK * 6 - halfK * 3;
      // head: level with hers; small recoil when she looks at him; follows her as she rises and goes, then drops
      const follow = ramp(t, walk + 0.1, 0.5, ease.inOutSine), follow2 = ramp(t, walk + 0.6, 0.6, ease.inOutSine);
      const dropK = ramp(t, walk + 1.0, 0.9, ease.inOutSine);
      ap.head = (ap.head || 0) - 2 + setK * (1 - handUp) * 14 + look2 * 4 - follow * 12 + follow2 * 26 + dropK * 16;
      ap.curl = (ap.curl || 0) + look2 * 4 + dropK * 8;
      const aOpts = { ink, light: LT(steps.lightAt(look, ax, o)), talk: talk(F, 'a1_sorry2'), breath: breath(t, 0.7, lerp(2.6, 1.5, kk)) };
      const lb = { size: 46, lum: 0.7, tint: LOOK.blueHour.fill, light: { color: '#ffb561', from: 1, amount: 0.65 } };
      if (!letGo) aOpts.held = { front: (c) => { hangDown(c, Math.sin(t * 7) * 0.05 * (1 - kk)); lunchbox(c, { ...lb, x: 0, y: 0, anchor: 'handle' }); } };
      drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...ap }, aOpts);
      if (letGo) lunchbox(ctx, { ...lb, x: boxGround.x, y: boxGround.y, handleUp: 1 - ramp(t, kneel + 1.35, 0.5), shadow: 0.6 });
    });
    steps.front(ctx, F, o);
  },
};

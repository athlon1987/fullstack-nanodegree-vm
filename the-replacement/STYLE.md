# THE REPLACEMENT — production guide

A 7-minute animated short, drawn entirely in code on a 2D canvas, rendered frame by frame in
headless Chromium and encoded with ffmpeg. This guide is the house style. Everyone who draws a
frame of this film follows it.

Read `src/timeline.js` for the story: every shot, its duration, its direction notes, its sync
events and its dialogue. Read `src/engine.js` for the toolkit.

## 1. The look: silhouette cinema

**People are silhouettes.** Every character is a near-black shape seen in clean profile, read by
outline, posture and movement — never by facial features. No drawn eyes, noses or mouths inside
the shape; the profile *outline* carries the face. Think shadow theatre and graphic-novel
frames, not explainer-video cartoons. Proportions are natural and elegant (an adult is about
7 heads tall), never bobble-headed or cute.

**Light is the paint.** Silhouettes only work against light. Stage every character in front of
the brightest part of the set (a window, a lit wall, fog, a pool of lamplight) and give them a
thin rim of the key-light colour on the side the light comes from. Backgrounds are layered flat
shapes with atmospheric depth: far layers are paler and bluer, near layers darker. Use glow,
light cones, haze and soft gradients generously; avoid outlines and avoid flat, evenly lit
frames. Dark frames still need a readable brightest point.

**Three colours mean something.**

| Meaning | Colour | Rule |
|---|---|---|
| Home, love, the human | amber / honey (`#ffb561`, `#ffd08a`) | Warm light appears only where there is love: the kitchen with the family in it, the lamp over the table, the last scene. |
| The Program, the replacement | cyan (`#7fe7ff`) | Cyan is never natural light. It is phone glow, HUD, the glint in V1's eye, the faint edge on V1's body. Adam's world before the twist contains no cyan except what the Program puts there. |
| The lunchbox | red (`#d8432a`) | The lunchbox is the only saturated warm *object* in the film. Nothing else is red except alerts on screens. |

Everything else lives in a restrained range of blue-greys (`src/style.js` → `C`, `LOOK`).
Adam's failing life is cold and desaturated; the replaced home is honey-warm (and he is shut
out of it); the struggle is navy night and rain; the ending is gold.

**The two Adams.** Adam and the replacement (V1) are the same silhouette. They differ only in:
posture (Adam's shoulders round forward, head ahead of his chest, a slight belly, weight
settled; V1 stands plumb, chest open, chin level), grooming (Adam: a tuft of hair standing up
at the crown, shirt untucked at the back, tie loose and swinging; V1: sleek hair, tucked shirt,
tie straight), and light (V1 carries a faint cyan edge and, when it matters, a pin-point cyan
glint where his eye is). In two-shots Adam is on the LEFT facing right, V1 on the RIGHT facing
left, mirrored.

**Composition.** 2.39:1. Put the subject on a third; give loneliness lots of empty frame; use
dead-centre symmetry for the two men facing each other. Keep the lower ~60 px of the picture
free of anything important.

**Movement.** Slow and deliberate. Ease everything (`ease.inOutCubic`, `inOutSine`); hold
poses; let stillness play. No bounces, no squash-and-stretch, no overshoot. The camera is
never completely static: a slow push-in or drift on every shot (zoom 1.00 → 1.04–1.10 over the
shot), plus a hair of `handheld()` on tense moments. People breathe (1–2 px chest/shoulder
rise at ~0.25 Hz) even when still.

**Type.** Screens and system text: IBM Plex Mono (`FONT.mono`), often cyan, upper-case, tracked.
App UI: Inter (`FONT.sans`). Titles and the tagline: Inter light capitals with very wide
tracking; Cormorant Garamond italic (`FONT.serif`) for human, literary lines. A child's
handwriting: `FONT.hand`. Any text the audience must read is at least 30 px tall at final size
and stays on screen for at least 1.5 s plus 0.25 s per word.

## 2. Space and scale

- Full frame is 1920×1080. Shots draw into **picture space: 1920 × 804** (origin top-left of
  the picture; the engine adds the letterbox bars, vignette, grain and subtitles). Centre is
  (960, 402).
- World scale: **1 cm = 2.46 px** at camera zoom 1. An adult stands **430 px** tall; Maya (8)
  stands **285 px**. Chair seat 110 px above the floor, table top 185 px, kitchen counter
  220 px, door 490 px tall, ceiling ~615 px above the floor.
- In a wide master the floor line sits near **y = 700**.
- Use `camera(ctx, cam, depth, fn)` for framing and parallax. Draw sets and characters in world
  coordinates and move the camera — do not hand-scale things for close-ups. Everything must stay
  crisp up to zoom 3 (so do not `cached()` anything you will zoom into at 1× resolution).
- Subtitles are drawn by the engine in the bottom bar from the dialogue cues. Never draw
  dialogue text yourself.

## 3. Code rules

- A shot is a pure function of time: `(ctx, F) => void`, where `F.t` is seconds since the shot
  started, `F.T` its duration, `F.ev('name')` the time of a sync event, `F.cue('id')` the
  timing of a dialogue line and `F.voice('id')` the loudness (0–1) of that line right now.
  See `Film.frameCtx` in `src/engine.js`.
- **Deterministic.** No `Math.random()`, no `Date`. Use `rng(seed)`, `hash(n)`, `noise1`,
  `wobble` from the engine. The same `t` must always produce the same pixels, and frames may be
  rendered in any order (no state carried between frames, except pure caches).
- Hit the sync events. If the timeline says the toast pops at `pop`, it pops at
  `F.ev('pop')` — the sound department is cutting to the same number.
- A shot must also render sensibly for `t` up to 1 s past its duration (dissolves use that).
- Balance every `ctx.save()` with a `ctx.restore()`; never leave `globalAlpha`,
  `globalCompositeOperation`, `filter` or a clip set on exit.
- Performance budget: keep a shot under ~200 ms per frame as measured by `tools/bench.mjs` (that figure includes ~50 ms of image encoding). `ctx.filter = 'blur(...)'` on large areas is
  expensive — blur once into `cached()` layers instead.
- No external assets, images or network. Everything is drawn with canvas calls.
- Only edit the files you own. Shared modules (`engine.js`, `style.js`, `timeline.js`) are
  changed by the director only — if you need something from them, say so in your report.

## 4. Looking at your work

You cannot judge a frame you have not looked at. Render stills and open the PNGs.

```bash
cd the-replacement
node tools/still.mjs --list                                         # shot list with timings
node tools/still.mjs --shot a1_05_ask --at 0.1,0.5,0.9 --out build/review/x/   # frames of a shot
node tools/still.mjs --sheet --shot a1_05_ask --n 8 --out build/review/x/a1_05.png   # contact sheet
node tools/still.mjs --sheet --act 1 --step 2 --out build/review/x/act1.png
node tools/still.mjs --sketch /sketches/my_test.js --t 0,1,2 --out build/review/x/   # a sketch module
node tools/render.mjs --from 12 --to 20 --scale 0.5 --audio none --out build/review/x/p.mp4   # motion preview
```

A sketch is a module in `sketches/` exporting `default (ctx, F) => {...}` and optionally
`duration`; it is rendered through the same engine (letterbox, grain) so what you see is what
the film gets. The tools print any exception thrown by a shot — fix every one.

Look for: Is the subject readable in half a second? Is there a clear brightest point? Do the
silhouettes separate from the background everywhere along their outline? Is anything floating,
clipped, mis-scaled, or sliding on the floor? Does it look like a frame from a film?

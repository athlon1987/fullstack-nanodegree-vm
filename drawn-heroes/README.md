# Momo & Scout: Ink Rush

A 2.5D co-op beat-'em-up starring two hand-drawn heroes: **Momo** the monkey and **Scout** the patrol pup. It runs in any modern browser on PC, Android and iPhone. No install, account or server.

The two heroes are cut straight from the original drawings (`source-art/`). They are not redrawn: `tools/extract_sprites.py` removes the paper and lighting from the photos, cleans the ink, and splits each drawing into layers (head, arms, tail, body) so they can be animated.

## Quick start

```bash
npm install
npm run build        # dist/web (static site), dist/single + dist/artifact (one-file builds)
npx http-server dist/web -p 8123   # then open http://localhost:8123
```

Development with rebuild on save: `npm run dev` (serves `dist/web` on port 8080).

Checks: `npm run typecheck`, `npm test` (44 tests: combat maths, saving, progression, stage data, and AI playthroughs of all five stages), or `npm run check` for all three plus a build.

Browser QA scripts (start the server above first):

```bash
node tools/qa-smoke.mjs  http://localhost:8123/ ./shots   # desktop menus + play, console errors
node tools/qa-mobile.mjs http://localhost:8123/ ./shots   # iPhone / Pixel / iPad: multi-touch, rotation, pause on blur
node tools/qa-coop.mjs   http://localhost:8123/           # two players on one keyboard
node tools/qa-bosses.mjs http://localhost:8123/ ./shots   # AI demo screenshots of every stage and boss
```

## Deploying

`dist/web` is a plain static site: upload the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, Vercel, S3 + CloudFront). HTTPS is recommended so phones treat it as a normal web app. Examples:

- **Netlify**: drag `dist/web` onto app.netlify.com/drop.
- **GitHub Pages**: push `dist/web` to a `gh-pages` branch, or use a Pages workflow that runs `npm ci && npm run build` and uploads `drawn-heroes/dist/web`.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist/web`.

`dist/single/ink-rush.html` is a fully self-contained file (images inlined) that can be opened directly or hosted anywhere. `dist/artifact/ink-rush.html` is the same game as a page fragment for claude.ai Artifacts.

The only external request is Google Fonts; if it is blocked the game falls back to system fonts.

## Controls

| Action | Keyboard (solo) | 2P keyboard: P1 / P2 | Gamepad | Touch |
| --- | --- | --- | --- | --- |
| Move (left/right + depth) | W A S D or arrows | W A S D / arrows | Left stick, D-pad | Drag left side |
| Jump (Momo double-jumps) | Space | Space / U | A | JUMP |
| Light attack (combo) | J | C / J | X | HIT |
| Heavy attack (hold to charge) | K | V / K | Y | !! HEAVY |
| Special | L | B / L | B | ★ SPECIAL |
| Dodge (with direction) / Block (hold still) | Shift | L-Shift / O | RB | DODGE |
| Ultimate / Team Finisher | I | Q / I | RT | TEAM |
| Interact / Revive / Co-op combo | E | E / P | LB | + HELP |
| Pause | Esc, P | Esc | Start | ❚❚ button |
| Switch hero (solo) | Tab | | Select | SWAP |

Keys can be remapped in Settings for solo, P1 and P2. Number-pad keys also work for P2. Blocking right as a hit lands is a **parry**.

## What's in the game

- **Story campaign**: illustrated intro, five playable pages (Doodle Meadow, Crayon Canyon, Marker City, The Inkworks, Smudge Tower), dialogue that shows the heroes' personalities, five bosses, illustrated ending and credits.
- **Solo with an AI partner** (follows, fights, revives, dodges telegraphs, stands on team plates, catches up if stuck) or **local 2P** (shared keyboard, two gamepads, or a split touch layout on tablets). You can swap heroes in solo at any time.
- **Combat**: input buffering, startup/active/recovery frames, 3D hitboxes (depth-aware), hit-stop, screen shake, knockback/stagger/launch/knockdown, i-frames, parry and block, chargeable heavies, aerials, cooldown specials, super armour, anti-stun-lock for heroes, juggle limits, combo damage scaling, telegraphs (`!` and `!!`) before every enemy attack.
- **Two distinct heroes**: Momo is a fast combo striker (4-hit chain, launcher, Banana Boomerang, mid-air dodge, Jungle Frenzy ultimate). Scout is a tanky crowd-controller (armoured Patrol Pounce, Big Bark shockwave that deletes projectiles, wide parry window, Patrol Siren stun).
- **Teamwork**: TEAM bonus damage when you follow up your partner's hit, RELAY bonus on enemies the other hero launched, two co-op combos (Pup Cannon, Monkey Vault), a shared Team meter and a full-screen Team Finisher, revives with a 10 s timer, team pressure plates.
- **Enemies**: Scribbler, Dart (flanks), Brute (armour, telegraphed slam), Inkslinger (lobbed ink), Marker Knight (frontal shield: flank it or guard-break it), Smudgebomb (explodes on everyone). Attack tokens stop crowds from all attacking at once; enemies never attack from off screen.
- **Bosses**: Big Scribbler (shockwaves, summons), Thornback (charges into walls, quills), Captain Highlighter (shield, beam lanes, overheats), Stapler Golem (staple volleys, chomp that jams its jaw), and the three-phase Smudge King (ink waves and rain; splits into twins that must fall within 8 s of each other; hand slams and an exposed core; finished with the Team Finisher).
- **Stages**: pits, platforms, rolling crayons, marker-cars, conveyors, steam vents, ink presses, ink rain, spikes, breakable crates, checkpoints, three hidden golden pencils per page and a per-page challenge.
- **Progression**: ink currency, team XP levels, 13 upgrades (stats, cooldowns, and five skills unlocked with golden pencils), S–D stage ratings, best scores, challenge bonuses. Saved in `localStorage` with validation, corrupt-data recovery and graceful fallback when storage is blocked. New Game asks before overwriting a save.
- **Presentation**: parallax sketchbook backdrops per page, perspective floor, depth sorting (including standing on platforms), shadows, night lighting, paper grain, procedural ink-doodle enemies, synthesized sound effects and music per stage.
- **Mobile**: automatic touch controls with a floating joystick and multi-touch buttons, safe-area aware layout, portrait and landscape (rotation tip in portrait), adjustable button size and opacity, no page scroll or zoom during play, auto-pause when the app is backgrounded, automatic quality reduction when frame rate drops.
- **Accessibility**: volume sliders, screen shake toggle, reduced motion (follows the OS setting by default), hint toggle, keyboard/gamepad navigation of every menu, text and shape cues in addition to colour (`!`/`!!`, LOW HP, OPEN!, DAZED!).

## Project layout

```
assets/characters/   layered sprites + pivots extracted from the drawings
source-art/          the two original photos
tools/               sprite extraction (Python/OpenCV) and browser QA scripts
src/config.ts        world/projection constants
src/core/            loop-independent services: input, audio, save, math
src/data/            data-driven attacks, heroes, enemies, stages, upgrades, story
src/game/            simulation: world, fighter/hero/enemy state machines, bosses, companion AI, combat maths, progression
src/render/          canvas renderer, hero rig animation, enemy doodles, backgrounds, HUD
src/ui/              DOM menus/overlays and touch controls
src/main.ts          app flow: menus, campaign, fixed-timestep loop, persistence
tests/               vitest suites and the headless stage simulator
```

The simulation runs at a fixed 60 Hz step and is independent of rendering, so the tests can play whole stages without a browser.

## Known limitations

- The drawings are single poses, so animation is layer-based (rotating head/arms/tail, squash and stretch, paper-flip spins, trails). There are no hand-drawn in-between frames.
- Enemies, bosses and backgrounds are drawn procedurally in a matching ink style; they are original designs, not from the drawings.
- Local co-op only (no online play). Two-player touch needs a tablet or a wide phone in landscape; otherwise use a keyboard or gamepads.
- Checkpoints are kept for the current session; the saved campaign records completed pages, upgrades and collectibles, not mid-page position.
- Tested in Chromium with emulated iPhone, Pixel and iPad viewports and real multi-touch events. Real-device testing on Safari/iOS is still recommended.

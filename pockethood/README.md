# POCKETHOOD

> *Build your little world. Watch it come alive.*

A cozy, social neighborhood-building game for the browser: a miniature diorama town you grow from one little house into a street of shops, gardens and friends — whose stories change the world around them.

Built with TypeScript, React, three.js (React Three Fiber), zustand and Vite. Local-first (IndexedDB saves), architected for a future server-authoritative online mode.

## Run it

Requires Node 20+.

```bash
cd pockethood
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Simulation tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright; starts its own dev server on :5199) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run economy:sim` | 30-day bot-player simulation → `docs/ECONOMY_SIMULATION.md` |
| `npm run assets:import` | Verify (sha256) + harmonise + write runtime models from `asset-sources/` |
| `npm run assets:validate` | Model budgets, required animation clips, references |
| `npm run assets:manifest` | Regenerate `docs/ASSET_MANIFEST.md` |

Dev extras: **Settings → Developer tools** (time skip, resources, local analytics inspector) and the asset viewer at `/viewer.html?base=assets/models/characters/&m=mini_female_b,mini_male_e`.

## How to play
Tap bubbles to collect · **Build** to place shops, homes and decorations (drag, rotate with ↻ or `R`, confirm ✓) · tap a shop to produce goods · deliver neighbors' requests on the **Request Board** · upgrade buildings to unlock recipes and see them change · tap residents to chat, gift and help with their stories · check the **Neighborhood Pulse** for three optional ideas a day · capture your town in **photo mode**. A guided tutorial covers the first 3–5 minutes.

## What's inside
- **12 functional buildings**, 14 recipes with production chains, upgrades that visibly transform buildings, 21 decorations & keepsakes, land expansion.
- **8 residents** (Kenney CC0 rigged characters) with daily routines, A* pathfinding, animation state machine, friendships, persistent memories and 10 story chapters; **3 pets** (Quaternius CC0).
- **Engagement flywheel:** quests, Neighborhood Pulse, community fountain project, Spring Blossom Festival, achievements, neighborhood history, welcome-back summaries.
- Original **POCKETHOOD architecture kit**, icon family and soundtrack; day/night lighting; ambient life.

## Docs
| | |
|---|---|
| [DEVELOPMENT_STATUS](docs/DEVELOPMENT_STATUS.md) | What works, test results, known defects |
| [GAME_DESIGN](docs/GAME_DESIGN.md) · [ENGAGEMENT_FLYWHEEL](docs/ENGAGEMENT_FLYWHEEL.md) · [ECONOMY_DESIGN](docs/ECONOMY_DESIGN.md) | Design |
| [TECHNICAL_ARCHITECTURE](docs/TECHNICAL_ARCHITECTURE.md) · [PERFORMANCE_BUDGET](docs/PERFORMANCE_BUDGET.md) · [QA_CHECKLIST](docs/QA_CHECKLIST.md) | Engineering |
| [ART_DIRECTION](docs/ART_DIRECTION.md) · [ASSET_MANIFEST](docs/ASSET_MANIFEST.md) · [ASSET_GAPS](docs/ASSET_GAPS.md) · [ASSET_LICENSES](docs/ASSET_LICENSES.md) · [CHARACTER_PIPELINE](docs/CHARACTER_PIPELINE.md) | Art & assets |
| [BUILD_ROADMAP](docs/BUILD_ROADMAP.md) | Phases and the road to mobile launch |

## Credits
3D models and sound effects by **Kenney** (kenney.nl) and **Quaternius** (quaternius.com), CC0. Fonts: Fredoka & Nunito (SIL OFL). Everything else is original to this project.

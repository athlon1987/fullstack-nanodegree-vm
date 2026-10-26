# Development Status

_Last updated 2026-10-26. Status keys: **Completed and tested** · **Implemented but not tested** (verified by hand/screenshot only) · **Partially implemented** · **Blocked** · **Not started**._

## Milestone: First Playable — reached
The browser build is a functioning game end-to-end: a guided first session, the full core loop, a living neighborhood, persistence and one complete engagement flywheel. It is **not** the complete long-term vision (online social, districts, monetisation, mobile store builds are future phases).

### Test results (this build)
| Suite | Result |
|---|---|
| `npm test` (Vitest) | **31 / 31 passed** — engine, economy, grid, orders, flywheel E2E (simulation level), relationships & stories, Pulse, community idempotency, expansion, persistence & recovery, pathfinding |
| `npm run test:e2e` (Playwright, Chromium/SwiftShader) | **6 / 6 passed** — load, full guided tutorial through the café upgrade, reload persistence, panels, placement validation, mobile layout |
| `npm run typecheck` / `npm run build` | Pass |
| `npm run assets:validate` | Pass — 69 models, 3.7 MiB, required clips present |
| `npm run economy:sim` | Runs; findings in ECONOMY_SIMULATION.md (one open content-depth issue, below) |

### Feature status
| Area | Status | Files |
|---|---|---|
| CC0 asset acquisition with sha256 provenance, palette harmonisation, budgets | Completed and tested | `scripts/asset-pipeline/*`, `scripts/validation/validate-assets.mjs`, `asset-sources/` |
| Diorama terrain, sea, road + traffic, paths, grass/flowers, wooded locked plots | Implemented but not tested (screenshot-reviewed) | `src/rendering/scene/Terrain.tsx` |
| Architecture kit: 12 buildings + landmarks + 21 decorations, per-level & story-flag variations | Implemented (screenshot-reviewed) | `src/rendering/kit/*` |
| Lighting, day/night, night glow, contact shadows | Implemented (screenshot-reviewed) | `src/rendering/lighting/Lighting.tsx` |
| Camera: pan + inertia, wheel & pinch zoom, bounds, focus | Implemented; pinch untested on a real device | `src/rendering/camera/CameraRig.tsx` |
| Placement: grid, ghost, validity with reasons, rotate, move, sell, paint-mode decor | Completed and tested | `Placement.tsx`, `BuildPanels.tsx`, `grid.ts` |
| Production queues, recipe chains, ingredient costs, passive income caps | Completed and tested | `actions.ts`, `economy.ts`, `data/items.ts` |
| Upgrades with functional + visible changes | Completed and tested (function); visuals screenshot-reviewed | |
| Request board (state-aware, never impossible) | Completed and tested | `game/quests/orders.ts` |
| Levels, XP, 18 quests, guided 6-step tutorial | Completed and tested | `data/progression.ts`, `ui/tutorial/Coach.tsx` |
| Residents: 8 with schedules, A*, animation state machine, chats, arrivals | Implemented (pathfinding tested) | `rendering/characters/*`, `game/navigation/*` |
| Relationships, memories, gifts, 10 story chapters with world changes | Completed and tested (Mia, Felix, Luna paths) | `relationships.ts`, `EngagementDirector.ts` |
| Pets (cat, shiba follows Felix, pug) | Implemented | `Characters.tsx` |
| Ambient life (birds, butterflies, clouds, smoke, sway, fireflies, fountain spray) | Implemented | `effects/Ambient.tsx`, `Buildings.tsx` |
| Neighborhood Pulse, next goal, welcome-back | Completed and tested | `engagement/*` |
| Community fountain project (local, idempotent) | Completed and tested | `actions.ts` (`contribute`) |
| Spring Blossom Festival, achievements, history, keepsakes, expansion | Completed and tested (logic) | |
| Photo mode (capture, save, native share) | Implemented; share depends on browser | `ui/modals/Modals.tsx` |
| HUD, 14 panels, dialogue with 3D portraits, toasts, fly-ups, level-up | Implemented; key flows covered by e2e | `src/ui/*` |
| Audio (Kenney SFX + original procedural music) with volumes/mute | Implemented; not audible in headless tests | `src/audio/AudioManager.ts` |
| Persistence (IndexedDB, versioned, migrations, repair, synchronous unload snapshot) | Completed and tested | `services/persistence.ts` |
| Local analytics + dev inspector | Implemented | `services/analytics.ts`, Dev tools panel |
| Accessibility: reduced motion, text size, keyboard, non-colour cues | Implemented; no screen-reader audit yet | |
| Social online (friends, visits, Hoods, trading) | **Blocked** — no backend/credentials in this environment. Contract defined; UI says "coming later" | `game/social/SocialService.ts` |
| Monetisation | Not started (architecture notes only) | GAME_DESIGN.md |
| Native mobile builds | Not started | BUILD_ROADMAP.md |

### Models actually integrated
12 Kenney Mini Characters (8 residents + 4 avatars), 5 Quaternius animals (3 pets + pond frog; fox unused), 19 Kenney Nature Kit models, 6 Kenney props, 18 Kenney Food Kit items, 9 Kenney Car Kit vehicles — see ASSET_MANIFEST.md. Plus the original architecture kit.

### Pending / missing assets
Cozy professional building pack (Kenney Suburban / Quaternius / Synty), road kit, bespoke talk/wave clips, rabbit/duck pets, modular avatar parts, soundtrack. See ASSET_GAPS.md.

## Known defects & limitations
1. **Performance unmeasured on real GPUs.** This sandbox renders WebGL in software (well under 1 FPS); budgets were enforced by counting draw calls (737 → ~430) and triangles. Real-device profiling is the first next step.
2. **Late-game coin accumulation** for engaged players once all buildings exist (~day 10–15). Content-depth issue; see ECONOMY_DESIGN.md.
3. Resident walking uses grid paths with slight jitter; residents may briefly overlap each other (no local avoidance).
4. Character "talk"/"wave" use substitute clips; no facial animation.
5. Pinch-zoom and touch-drag placement are implemented but untested on physical devices.
6. One early screenshot showed a duplicated bottom bar during capture; the DOM contains a single instance and it hasn't reproduced in later captures — likely a software-renderer capture artifact, still worth watching.
7. Story chapters for Oliver/Ruby and later chapters aren't individually unit-tested (shared engine path is).
8. Analytics are local-only; no consent banner is needed until a transport exists.

## Remaining tasks (prioritised)
1. Real-device performance pass + static decoration batching.
2. Acquire a professional cozy building pack and swap residential/shop shells.
3. Backend: auth, cloud save, server-side `applyAction`.
4. Content: second district, more residents & chapters, more upgrade tiers (fixes inflation).
5. Visual regression baselines in CI; screen-reader audit.

## Screenshots
See `docs/screenshots/` (captured with Playwright under software rendering): a mid-game town staged through engine actions with dev resources (01–02), mobile (05–06), and the real first-session flow (10–13). Night lighting was reviewed during QA but no clean night capture is included.

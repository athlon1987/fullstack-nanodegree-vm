# Technical Architecture

## Stack
| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript 5.9 (strict) | Shared types across simulation, rendering, UI and future server |
| UI | React 19 + hand-written CSS design tokens | Game-styled components; no generic widget library look |
| 3D | three.js 0.186 via React Three Fiber 9 + drei 10 | Declarative scene composition; imperative escape hatches for hot paths |
| State | zustand 5 | Tiny store wrapping a pure engine |
| Persistence | IndexedDB (idb-keyval) → localStorage fallback | Local-first, survives restarts |
| Build | Vite 7 | Fast dev server, code-split production build |
| Tests | Vitest 3 (simulation), Playwright 1.63 (browser) | Deterministic logic tests + real-browser flows |
| Asset tooling | glTF Transform 4, meshoptimizer (source decoding only) | Provenance-checked import, palette harmonisation, budgets |

## Layering
```
src/
  data/            content as data: buildings, items/recipes, residents, quests, stories, levels, events, achievements
    spots.ts       shared neighbourhood spots: steps, needs, keepsakes, celebrations, seasonal refreshes
  game/            ── no React, no three.js; pure & deterministic ──
    core/          types, engine (dispatch), actions (rules), new-game layout, rng/day keys
    economy/       costs, rewards, XP/levels, production timing, passive income
    world/         grid placement, collision, door cells, deterministic weather (weatherAt)
    navigation/    A* pathfinding, nav grid
    quests/        request-board generation
    characters/    relationships, dialogue selection, story eligibility
    engagement/    Engagement Director, Neighborhood Pulse, objectives, welcome-back / next goal
      events.ts    rotating community celebrations (one at a time, a day's rest between)
    social/        SocialService contract (+ honest local implementation)
    sim/
      firstSession.ts  first-session pacing model (a guided bot playing the real engine)
  platform/
    content/       world packs & partner modules: schema, loader, install, templates, catalog
      policy.ts    content-policy screen (topic terms, CONTENT_TAGS, MODULE_MAX_REPEATS)
    i18n/          locales (en, ms) and content-text lookup
    security/      content integrity (SHA-256, signed index) and a local audit log
  services/        persistence (versioned + migrations), clock (dev time offset, day/night), analytics (local)
  state/           zustand store: engine wrapper, event → feedback routing, autosave
  rendering/       R3F scene: camera, lighting, terrain, buildings, characters, effects, placement
    kit/           original parametric architecture kit (parts, materials, archetypes, bake)
      community.ts shared spots at every stage (0–4), seasonal colour schemes, spot keepsakes
    models/        GLB registry + normalisation (catalog.generated.json is produced by the pipeline)
  ui/              HUD, panels, modals, tutorial coach, icon family, design tokens
  audio/           adaptive music engine (music/), synthesised SFX (sfx.ts), procedural ambience
  app/             boot, loading screen
scripts/
  asset-pipeline/  import (sha256-verified), inspect, extract textures, write manifest
  validation/      asset budgets & clip requirements
  economy/         bot-player simulator
```

**Rule:** gameplay rules live only in `src/game`. Rendering and UI read state and dispatch actions; they never mutate state.

## The engine
- `applyAction(state, action, now)` → `{ state, events, error? }` — copies state, applies rules, emits typed `GameEvent`s. `now` is always passed in: the engine never reads the clock, so it's deterministic and testable, and the **same code can run on a server** to validate client actions.
- `dispatch()` = action → follow-up tick (arrivals, order refills) → **Engagement Director** (stats, quests, stories, Pulse, achievements, events, history) run to a fixed point.
- Idle ticks are free: `tickNeeded()` checks cheaply whether anything would change and returns the *same* state object otherwise, so React selectors don't re-render once a second.
- All time-based systems (construction, production queues, passive income, order cooldowns) use absolute timestamps. Offline progression is simply catching up on load. Passive income is capped by storage.

## Persistence
`SaveService` (services/persistence.ts): JSON in IndexedDB under `pockethood.save`, schema-versioned (`SAVE_VERSION = 5`) with ordered migrations. On load: migrate → `sanitize` (repairs NaN/negative balances, unknown building types, clamps timers far in the future as a clock-skew guard). Corrupt saves are backed up and a fresh game starts with a visible notice. Autosave is debounced (600 ms) after every state-changing action and on `visibilitychange`/`pagehide`.

## Rendering
- Orthographic isometric camera (custom rig: pan with inertia, wheel/pinch zoom, bounds = owned land, eased focus).
- Buildings: archetype groups are **baked** (all meshes merged per material, CC0 prop geometry dequantised so it merges too) and cached as templates; instances are cheap clones. Typical building = 3–8 draw calls.
- Locked-land forest baked per plot; road markings merged; grass tufts/wildflowers/path tiles instanced.
- Characters: one `AnimationMixer` per actor; brains update in `useFrame`, A* re-plans when the grid changes.
- In-world HTML (status bubbles, story markers, tutorial arrow) uses drei `<Html>` pinned to a stable portal container.
- Shadows: one directional shadow map (2048 on High, 1024 otherwise), updated every frame on High and every 2nd/3rd frame on Medium/Low; small decorations don't cast.

## Online future (designed, not built)
| Concern | Plan |
|---|---|
| Accounts & cloud save | Supabase Auth + Postgres row per player; local save becomes a cache |
| Server authority | Run `applyAction` server-side (it's pure TS with injected `now`); the client sends actions, not balances; server time is authoritative for timers |
| Idempotency | Every mutating request carries an op id (already modelled in community contributions) |
| Trading / gifts | Server-validated, atomic transfers with rate limits and ownership checks (`SocialService.sendGift` contract) |
| Hoods & shared landmarks | Community project state moves to a shared row; contributions recorded per member |
| Purchases | Platform receipts validated server-side; no client-trusted currency |
| AI dialogue (phase 2) | Server proxy with cost caps, moderation and a minimal context (profession, friendship level, recent shared memories). No keys in the client. Authored dialogue remains the fallback. |

## Testing
- `npm test` — 27+ Vitest tests: grid/collision, costs, production timing & queues, input consumption, upgrades, XP/levels, order generation invariants (property test), single-payout guarantees, the full first flywheel end-to-end, relationships/memories/stories, Pulse never-impossible (200 seeds), community idempotency, expansion rules, migrations, corruption recovery, clock-skew clamp, content integrity, honest offline social service, solo progression without tutorial.
- `npm run test:e2e` — Playwright browser flows (see `e2e/`).
- `npm run economy:sim` — 30-day bot simulations → `docs/ECONOMY_SIMULATION.md`.
- `npm run assets:validate` — model budgets, required clips, references.

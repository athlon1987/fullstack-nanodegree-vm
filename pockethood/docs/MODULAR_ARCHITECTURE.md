# Modular Architecture — "The Living World"

POCKETHOOD is split into three layers so new countries, districts and businesses arrive as **data**, while the rules that run them stay in reviewed code.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Layer C — Content (data only, downloadable)                               │
│   content/countries/*.json   content/worlds/*.json   content/modules/*.json │
│   validated · hashed · versioned · kill-switchable · never executable      │
└───────────────▲──────────────────────────────────────────────────────────┘
                │ compile + install (src/platform/content/install.ts)
┌───────────────┴──────────────────────────────────────────────────────────┐
│ Layer B — Gameplay template library (code)                                │
│   templates.ts: restaurant · cafe · retail · residential · learning ·      │
│   showroom · park · hotel · farm · community — allowed behaviours,        │
│   prefabs and economic limits; approved behaviour implementations          │
│   (hand_prepare, quiz, showroom, garden_plots, visitors, ambient_sound)    │
└───────────────▲──────────────────────────────────────────────────────────┘
                │ reads registries (BUILDINGS, ITEMS, RECIPES, RESIDENTS, …)
┌───────────────┴──────────────────────────────────────────────────────────┐
│ Layer A — Core engine (code, brand- and country-neutral)                  │
│   deterministic engine (src/game), persistence, renderer, UI, i18n        │
│   neutral core world "Maple Hollow" as the always-available fallback      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Layer A — core engine

- `src/game/core/actions.ts` — every player action as a pure function `applyAction(state, action, now)`; `engine.ts` composes it with the Engagement Director. No clock reads, no randomness outside seeded RNG, no network. Designed to run unchanged on a server (see SECURITY_ARCHITECTURE.md).
- The engine reads content from **registries** (`src/data/*`): `BUILDINGS`, `ITEMS`, `RECIPES`, `RESIDENTS`, `QUESTS`, `STORIES`, `EVENTS`, `COMMUNITY_PROJECTS`, `ACHIEVEMENTS`, `LEVELS`, `EXPANSIONS`, `WORLD`. These start as the neutral core world and are rebuilt by the installer.
- Nothing in core names a brand, a person or a country. Building ids (`cafe`, `garden`, `showroom`…) are template *slots*, not businesses.
- Content safety in the engine: unknown building types resolve to a closed stand-in (`bdef()`), production jobs carry an output snapshot, orders for withdrawn goods retire, quests/stories whose content is missing pause instead of crashing, residents without content are kept but not drawn.

## Layer B — templates and behaviours

`src/platform/content/templates.ts` defines what each kind of place may do. Behaviours are implemented once, in code, and take data:

| Behaviour | Engine action(s) | What the data controls |
|---|---|---|
| `hand_prepare` | `handPrepare` | which recipe, the step sequence (from an approved vocabulary), rest time, tip text |
| `quiz` | `quizAnswer` | topic, daily limit, questions/choices/answers/explanations |
| `showroom` | `showroomSet` | number of bays, which approved vehicle models, paint palette |
| `garden_plots` | `plant`, `water`, `harvest` | number of plots, plants, grow times, yields |
| `visitors` | (rendering) | visitor rate |
| `ambient_sound` | (audio) | which procedural sound bed |

Unknown behaviour types fail schema validation; behaviours a template doesn't allow fail compilation. Templates without a module run **neutral defaults** (a general-knowledge quiz, a default showroom), so every building works with no module at all.

## Layer C — content

See CONTENT_SCHEMA.md for formats and rules. Summary:

- **Country records** — locales, currency, time zone, compliance switches, which worlds exist. MY is active; SG/ID/TH/JP/KR are registered as `planned`, which proves the registry isn't Malaysia-specific without shipping unreviewed content.
- **World packs** — a district: residents, quests, stories, events, community project, building/item dressing, starting layout, environment. Kampung Seri is the first.
- **Modules** — a business or community place dressing one template slot: brand, prefab, palette, goods, recipes, behaviour data, quests, real-world info, sponsor/approval/activation/licensing.

## Loading pipeline

`src/platform/content/loader.ts` + `service.ts`:

1. Fetch `content/index.json` from the content origin (same-origin today; `CONTENT_HOST_ALLOWLIST` for a CDN later). Optional detached ECDSA P-256 signature (`index.json.sig`) — implemented and tested, **not enforced in this build** (no production key yet).
2. Validate the index; for each listed file: fetch, check byte size and **sha256 against the index**, parse with prototype-pollution protection, schema-validate. A bad file only affects itself.
3. If the remote content is unusable → last-known-good copy (IndexedDB) → the copy bundled with the app. Only a fully clean remote set replaces last-known-good, so a partial outage can't overwrite good content. Rollbacks are just publishing an index that points at older files.
4. `activate(worldId, lang)`: evaluate each module's lifecycle (kill switch, approval, country, version, dates, flags, staged rollout), then `installContent()` rebuilds every registry: core → core Malay overlay (if Malay) → world pack → modules. Each step is checked; a broken world falls back to core, a broken module is quarantined.
5. The content revision (`useContent.rev` / store `contentRev`) bumps so UI and 3D re-read names, prefabs and behaviours.

Language changes re-run step 4 (text is resolved at install), so a switch between English and Bahasa Melayu is instant and needs no reload.

## Saves and worlds

Saves carry `world: { id, country }` (save v4). On load the save's world is installed **before** the save is repaired, so its content resolves correctly. A save from a world that isn't available loads into the core world with nothing deleted (unknown buildings render as "closed for now"); it heals when the world returns. Module-specific player state lives in `ext` keyed by building uid (`gardens`, `showrooms`, `prep`, `learning`) and is never discarded because a module is off.

## Data updates vs code updates (app stores)

| Change | Kind | Can ship without an app update? |
|---|---|---|
| New/edited module JSON (names, menus, recipes within limits, quiz questions, palettes) | data | yes — validated, hashed, kill-switchable |
| New world pack for an existing biome | data | yes |
| Kill switch, feature flags, staged rollout | data | yes |
| New behaviour, template, prefab, icon, model or biome | code | **no** — needs a reviewed binary |

No JavaScript, HTML, WebAssembly or remote code is ever loaded from content; this keeps remote updates within App Store Review Guideline 2.5.2 / 4.7-style rules (see MONETIZATION_COMPLIANCE.md).

## Feature flags

`src/platform/content/flags.ts`: code defaults ← content index (`flags`) ← local Studio overrides. Flags in use: `modules`, `zen_mode`, `sponsor_labels`, `real_world_menus`, `visit_links`, `weather`, `pwa`, `studio`.

## Studio (internal tooling)

Settings → Studio: status, module registry inspector (switch modules off locally, see issues/warnings), module editor (validate with the production schema and compiler, preview live), menu editor (applies the player-facing price policy as you type), sponsor preview, approvals (local prototype), country registry, NPC inspector, economy table (value/min vs template ceilings), asset previewer, flags, audit log. Studio acts on this device only and is English-only staff tooling.

## Directory map

| Path | Role |
|---|---|
| `src/platform/validate.ts` | dependency-free strict validator (no eval) |
| `src/platform/content/{schema,catalog,templates,install,registry,loader,service,flags}.ts` | the content platform |
| `src/platform/security/{integrity,audit}.ts` | sha256 / signatures, local audit log |
| `src/platform/i18n/` | translator, en/ms dictionaries, content-aware `tc()` |
| `content/` | country, world and module data (source of truth) |
| `scripts/content/build-index.ts` | validation + index generation (`npm run content:build`) |
| `scripts/content/schema-doc.ts` | regenerates the CONTENT_SCHEMA.md reference |
| `src/rendering/kit/malaysia.ts` | Malaysian architecture kit and module prefabs |
| `src/ui/panels/ModulePanels.tsx` | module behaviour UIs, lake, Zen |
| `src/ui/studio/Studio.tsx` | Studio |
| `backend/` | server design (not deployed) |

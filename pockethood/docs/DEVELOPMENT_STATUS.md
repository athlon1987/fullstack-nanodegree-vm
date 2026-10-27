# Development Status

_Last updated 2026-10-27. Status keys: **Completed and tested** · **Implemented** (verified by hand/screenshot, no automated test) · **Partially implemented** · **Designed, not built** · **Not started**._

## Milestone: The Living World — first milestone reached
A Malaysia-first district (Kampung Seri) running on a modular content platform, with four demo modules loaded through the same pipeline, English + Bahasa Melayu, Zen Mode, sharing and a PWA. This is a playable single-player build. **It is not a production release**: there is no backend, no accounts, no signed content enforcement and no real partners; automated tests passing does not make it secure for launch (see SECURITY_ARCHITECTURE.md §10).

### Test results (this build)
| Suite | Result |
|---|---|
| `npm test` (Vitest) | **64 / 64 passed** — engine & core loop, flywheel E2E (classic world), persistence & migration v3→v4, pathfinding; **platform**: hostile-content rejection (markup, script URLs, unknown fields/behaviours, prototype pollution, path traversal, oversize), integrity (tampered bytes, signed/tampered/missing-signature index), lifecycle (kill switch, disabled, quarantine, unapproved, country, version, scheduled, expired, flags, rollout), template & economic limits, sponsor-label and halal/price/link policies, slot conflicts, Malaysian world install, language switch, MY tutorial end to end, hand-prepare, quiz, showroom, garden, Zen activities, module isolation (kill → neutral → back, nothing lost), unavailable-world fallback, en/ms key and placeholder parity, literal-key coverage scan, weather model, visit-link privacy and hostile codes, bundled-content hashes, icon catalogue |
| `npm run test:e2e` (Playwright, Chromium/SwiftShader) | **11 / 11 passed** — boot into Kampung Seri, full guided tutorial, reload persistence, panels, placement validation, mobile layout, switch to Bahasa Melayu, hand-prepare teh tarik in the UI, Zen Mode hides currencies/objectives, switching a module off in Studio falls back to the neutral shop with the queued job intact, shared snapshot link is read-only and leaves the visitor's save untouched |
| `npm run content:build` | Pass — 6 countries, 1 world, 4 modules; schema + semantic + economic checks in en and ms |
| `npm run typecheck` / `npm run build` | Pass |
| `npm run economy:sim` | Runs on Kampung Seri with modules; findings below |

### Feature status
| Area | Status | Where |
|---|---|---|
| Strict content validator (no eval), text screening, safe JSON parsing | Completed and tested | `src/platform/validate.ts`, `loader.ts` |
| Content schemas: index, country, world pack, module | Completed and tested | `src/platform/content/schema.ts`, CONTENT_SCHEMA.md |
| Gameplay template library (10 templates; hotel is template-only) with economic ceilings | Completed and tested | `templates.ts` |
| Approved behaviours: hand_prepare, quiz, showroom, garden_plots | Completed and tested | `actions.ts`, `install.ts` |
| Behaviours `visitors`, module `presentation.props` | **Partially implemented** — validated and stored, not yet rendered (no visitor NPCs, props not placed) | — |
| Module greeting line in the building card | Implemented | `BuildPanels.tsx` |
| Ambient sound beds per module | Implemented (procedural; not audible in headless tests) | `AudioManager.ts` |
| Module lifecycle, kill switch, staged rollout, feature flags | Completed and tested | `registry.ts`, `flags.ts` |
| sha256 integrity, remote → last-known-good → bundled fallback | Completed and tested | `loader.ts`, `service.ts` |
| Signed content index (ECDSA P-256) | Implemented and tested; **not enforced** (no production key) | `security/integrity.ts` |
| Module isolation & neutral fallback, dormant buildings, job output snapshots | Completed and tested | `install.ts`, `actions.ts`, `buildings.ts` |
| UI error boundaries (world / HUD / panels) | Implemented | `ErrorBoundary.tsx` |
| Country registry (MY active; SG, ID, TH, JP, KR planned) | Completed and tested | `content/countries/` |
| Kampung Seri world pack (8 residents, 6-step tutorial + 13 quests, 12 stories, event, wakaf project) | Completed and tested (tutorial path, install); later chapters covered by the shared engine path | `content/worlds/my.kampung_seri.json` |
| Four demo modules (kopitiam, showroom, learning centre, community garden) | Completed and tested | `content/modules/` |
| Malaysian architecture kit (17 archetypes + 4 module prefabs), tropical planting, laterite terrain | Implemented (screenshot-reviewed) | `kit/malaysia.ts`, `Terrain.tsx` |
| Live showroom cars and garden crops | Implemented (screenshot-reviewed) | `BehaviorOverlay.tsx` |
| Deterministic rain showers, rainy lighting | Weather model tested; visuals screenshot-reviewed | `weather.ts`, `Rain.tsx`, `Lighting.tsx` |
| Localisation en + ms: UI, engine errors, history, Pulse, goals, content | Completed and tested (key parity, coverage scan, e2e switch) — **Malay needs native-speaker review** | `src/platform/i18n/` |
| Data-driven tutorial guide (works for any world) | Completed and tested (e2e) | `Coach.tsx` |
| Zen Mode (hides currencies, objectives, notifications, promotions, world bubbles; calmer music, slower camera, fewer rain particles) | Implemented; hiding covered by e2e | `ModulePanels.tsx`, `Hud.tsx`, `CameraRig.tsx` |
| Gentle activities: fishing journal, pets, sunset & lake moments, flower arranging, gardening | Engine completed and tested; UI implemented | `actions.ts`, `ModulePanels.tsx` |
| Four audio channels (music, ambience, interface, character voices) + procedural soundscape | Implemented; not audible in headless tests | `AudioManager.ts` |
| Sharing: WhatsApp, system share, copy link, photo | Implemented (WhatsApp/share need a real device to verify) | `SharePanel.tsx` |
| Read-only visit snapshot links | Completed and tested (unit + e2e) | `services/visit.ts` |
| PWA: manifest, icons, offline service worker, update notice | Implemented; service worker not exercised in tests (skipped in iframes and dev) | `public/sw.js`, `services/pwa.ts` |
| Studio (12 internal tools) | Implemented; module switch-off covered by e2e | `src/ui/studio/Studio.tsx` |
| Save v4 (world, module state, Zen journal) with migration from v3 | Completed and tested | `persistence.ts` |
| Backend (auth, cloud saves, server-side engine, partner workflow, RLS) | **Designed, not built** | `backend/` |
| Monetisation | Not started (rules documented) | MONETIZATION_COMPLIANCE.md |
| Native apps (Capacitor) | Not started (readiness documented) | DEVELOPMENT_ROADMAP.md |

## Known defects & limitations
1. **Coin inflation for engaged players.** The economy sim (Kampung Seri, 30 days) shows Regular players banking ~48k and Enthusiasts ~117k coins by day 30; the showroom and learning centre add passive income. Needs coin sinks (more upgrade tiers, decorations, a second district). Casual and returning players progress steadily and never stall.
2. **Performance unmeasured on real GPUs** (this sandbox renders WebGL in software). Real-device profiling is the first next step.
3. **Malay translations and cultural content are unreviewed** by native speakers / a cultural panel (see MALAYSIA_WORLD_DESIGN.md open items).
4. `visitors` behaviour and module props aren't rendered yet; residents don't react to rain.
5. Some keepsakes (kuih table, festival arch, pelita post, bird bath, parasol) use the core art in the tropical world.
6. The kopitiam story flag that "changes the sign" adds a display item rather than repainting the sign.
7. Ogg sound effects don't play on older iOS Safari; character "talk"/"wave" use substitute clips.
8. Studio is English-only staff tooling and is reachable from Settings in this prototype (switch off with the `studio` flag for production).
9. Visit links are long URLs (layout encoded in the link); short server codes need the backend.

## Remaining tasks (prioritised)
1. Real-device performance pass; add coin sinks; native-speaker and cultural review.
2. Render module visitors and props; tropical keepsake art; rain-aware residents.
3. Backend (Stage 3 in DEVELOPMENT_ROADMAP.md), then enforce signed content.
4. Capacitor wrappers and store compliance review.

## Screenshots
`docs/screenshots/20–34` (Playwright, software rendering): Kampung Seri overview, showroom forecourt, rain, mobile in Bahasa Melayu, kopitiam card, hand-prepare, About this place (illustrative menu), quiz, garden plots, lake, Zen, share, Studio, Malay settings and kopitiam card. `01–13` show the classic world from the first-playable milestone.

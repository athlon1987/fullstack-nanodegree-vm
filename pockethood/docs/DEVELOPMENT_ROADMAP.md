# Development Roadmap

Where POCKETHOOD is, and the staged path to a store launch. "Done" means built and tested (see DEVELOPMENT_STATUS.md for the evidence); everything else is a plan.

## Stage 0 — First Playable (done)
Core loop, guided tutorial, residents and stories, Pulse, community project, events, persistence, original architecture kit, CC0 characters, procedural music.

## Stage 1 — The Living World, first milestone (done in this build)
- Modular platform: strict content schemas, gameplay template library, data-only modules, country registry, world packs, lifecycle (approval, dates, versions, flags, rollout, kill switch), integrity hashes, last-known-good + bundled fallback, quarantine and neutral fallback, Studio tooling.
- Malaysia-first district **Kampung Seri**: 8 residents, a 6-step tutorial + 13 main quests (+ 4 module quests), 12 story chapters, Pesta Bunga Kampung, the wakaf community project, Malaysian architecture kit, tropical biome, rain.
- Four demo modules through the shared pipeline: Kopitiam Lim (hand-pulled teh tarik), Galeri Seri Auto (showroom arranging), Pusat Belajar Cahaya (daily quiz), Kebun Komuniti Seri (garden plots).
- English + Bahasa Melayu for all UI and content; instant switching.
- Zen Mode and gentle activities; four-channel audio with procedural soundscapes.
- Sharing (WhatsApp, copy link, photo) and read-only visit snapshot links.
- PWA (manifest, icons, offline service worker, update notice).

## Stage 2 — Hardening & real devices (next)
1. Real-device performance pass (mid-range Android, older iPhones): draw calls, shadow cost, instancing of repeated kit parts, texture budget; target 60 fps on mid-range, 30 fps floor.
2. Native-speaker review of all Malay text; cultural review panel for Kampung Seri (see MALAYSIA_WORLD_DESIGN.md).
3. Audio: replace Ogg SFX with AAC/MP3 fallbacks for iOS Safari; recorded ambience beds to complement the procedural ones.
4. Accessibility audit (screen reader labels in the 3D overlays, colour contrast, reduced motion coverage), larger touch targets on small phones.
5. Visual regression baselines in CI.

## Stage 3 — Online foundations
1. Deploy `backend/` (auth, cloud saves, server-side `applyAction`, idempotency, rate limits, audit).
2. Content signing key in a KMS; turn on `REQUIRE_SIGNED_CONTENT`; CDN for `content/`.
3. Partner workflow behind staff accounts (no public portal): drafts, review, signed releases, analytics aggregates.
4. Friends and visits backed by short server codes (replacing long snapshot links), with child-safe defaults (friends-only, preset phrases, report/block).

## Stage 4 — Mobile apps (Capacitor)
The web build is already structured for wrapping:

| Need | Approach | Status |
|---|---|---|
| App shell | Capacitor 6 iOS/Android projects pointing `webDir` at `dist/` | not started |
| Relative asset paths | Vite `base: './'` | ready |
| Offline | bundled content + models in the app package; service worker not needed in the native shell | ready (bundled fallback exists) |
| Storage | IndexedDB works in WKWebView/WebView; move saves to `@capacitor/preferences` or SQLite for durability | planned |
| Safe areas / notches | CSS `env(safe-area-inset-*)` already used | ready |
| Haptics, share sheet | `@capacitor/haptics`, `@capacitor/share` behind the existing share UI | planned |
| Store billing | only if monetisation is enabled — native IAP plugins; see MONETIZATION_COMPLIANCE.md | not planned now |
| Remote content | data-only JSON; no code download (store rule) | ready |
| Deep links | `pockethood://visit/<code>` + universal/app links mapped to the existing `?visit=` handler | planned |

## Stage 5 — More of the world
- Second Malaysian district (e.g. a coastal fishing village or a Penang-style shophouse street) as a world pack.
- New templates as code releases: hotel (defined, no building yet), hawker centre, clinic-free "community services" (no medical content), transport stop.
- Country activation one at a time (SG → ID → TH → JP → KR), each with local language, cultural review, legal/privacy review and its own world pack.

## Risks to watch
- Performance on low-end Android (WebGL in WebView).
- Translation quality and cultural accuracy as content grows — keep the review step mandatory.
- Partner pressure to add promotional surfaces — the rules in SPONSOR_PLATFORM.md are product rules, not suggestions.

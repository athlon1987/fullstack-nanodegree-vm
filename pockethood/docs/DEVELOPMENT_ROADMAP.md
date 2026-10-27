# Development Roadmap

Where POCKETHOOD is, and the staged path to a store launch. "Done" means built and tested (see DEVELOPMENT_STATUS.md for the evidence); everything else is a plan.

## Stage 0 — First Playable (done)
Core loop, guided tutorial, residents and stories, Pulse, community project, events, persistence, original architecture kit, CC0 characters, procedural music.

## Stage 1 — The Living World, first milestone (done)
Modular content platform (schemas, templates, data-only modules, country registry, world packs, lifecycle, integrity, fallbacks, Studio), Malaysia-first **Kampung Seri** with four demo modules, English + Bahasa Melayu, Zen Mode, sharing, PWA.

## Stage 1.5 — Brand identity enhancement (done in this build)
The enhancement brief's priorities, in its order:

| Priority | What was done | Evidence |
|---|---|---|
| 1 · Musical identity | Original adaptive lo-fi score: one theme, 8 arrangements, bar-synced transitions, in-key stingers and feedback sounds, mixer with voice limits and a limiter; music brief and production plan | AUDIO_ASSET_MANIFEST.md; unit tests; offline renders measured; e2e |
| 2 · Fast, satisfying play | First-session audit and pacing model; faster early requests; always-available activities; reward feedback already in place | `pacing.test.ts` (both worlds) |
| 3 · Positive community | Four shared spots with visible stages and seasonal refreshes; eight rotating celebrations; resident social life; six new light-hearted stories | `community.test.ts`; screenshots; e2e |
| 4 · Meditative environment | Golden hour, brighter nights, clouds, breeze, morning mist, post-rain sunshine with a rainbow; Zen arrangement; battery saver | screenshots |
| 5 · Content standards | Content policy, automatic screen in every language, content tags, scrubbed Kampung Seri, name screening, save migration | `policy.test.ts`; CONTENT_POLICY.md |
| 6 · Audio & visual QA | Offline audio analysis, spot and atmosphere contact sheets, 14 browser tests | DEVELOPMENT_STATUS.md |

## Stage 1.6 — Modern Klang Valley world (done in this build)
The revised brief moves the default setting from a rural kampung to modern KL / Klang Valley.

| What was done | Evidence |
|---|---|
| **Seri Bayu** world pack (default for Malaysia): 51 building overrides, 9 residents, 23 quests (incl. new mamak and co-working quests), 18 stories, 8 celebrations, Fountain Plaza project; all text in English and Malay | `urban.test.ts` (valid, default, bilingual, policy-clean, same tutorial and rewards as Kampung Seri); `pacing.test.ts` now covers three worlds |
| Modern KL architecture kit (23 `kl:*` archetypes) and urban prefabs for the four demo modules | kit contact sheets; screenshots |
| New buildings: Mamak Corner (`restaurant` template: roti canai, nasi lemak) and Co-working Hub (`retail`, passive income); four fixed city landmarks | unit tests; content build |
| Cityscape: LRT viaduct, station and trains, covered walkway, ring road with lamps, trees and traffic, skyline and flyover; urban terrain; neutral tone mapping and environment reflections | screenshots (day, golden hour, night) |
| Kampung Seri kept as an optional cultural world | world list; e2e still runs its module flows |

## Stage 2 — Hardening, real devices and real ears (next)
1. **Listening tests** for the soundtrack (team + 10–20 players; phone speakers and headphones): is the theme catchy and pleasant on repeat? Iterate the theme and instruments; brief a composer (AUDIO_ASSET_MANIFEST.md §6).
2. **Playtests** of the first session (5 + 5 players per language): confirm the pacing model, watch for confusion and waiting.
3. **Real-device performance pass** (mid-range Android, older iPhones): draw calls, shadows, instancing of repeated kit parts, texture budget, audio synthesis CPU, battery saver; target 60 fps mid-range, 30 fps floor.
4. **Native-speaker and cultural review** of all Malay text and the Seri Bayu and Kampung Seri content, against CONTENT_POLICY.md; a place-name/trademark search for "Seri Bayu" and its fictional landmarks.
5. **Economy:** engaged players still bank too many coins by day 30 (ECONOMY_SIMULATION.md). Add more creative sinks (a second district, more shared spots, decoration sets), and revisit passive income at high levels.
6. Accessibility audit (screen reader labels in 3D overlays, contrast, reduced-motion coverage), larger touch targets on small phones; visual regression baselines in CI.

## Stage 3 — Online foundations
1. Deploy `backend/` (auth, cloud saves, server-side `applyAction`, idempotency, rate limits, audit).
2. Content signing key in a KMS; turn on `REQUIRE_SIGNED_CONTENT`; CDN for `content/`.
3. Partner workflow behind staff accounts (no public portal): drafts, review (including the content-policy checklist), signed releases, analytics aggregates.
4. Friends and visits backed by short server codes, with child-safe defaults (friends-only, preset phrases, report/block, policy screen on any text).
5. Optional shared contributions to spots between friends (never required for progress).

## Stage 4 — Mobile apps (Capacitor)
The web build is already structured for wrapping:

| Need | Approach | Status |
|---|---|---|
| App shell | Capacitor iOS/Android projects pointing `webDir` at `dist/` | not started |
| Relative asset paths | Vite `base: './'` | ready |
| Offline | bundled content + models in the app package; no audio files needed (all synthesised) | ready |
| Storage | IndexedDB works in WKWebView/WebView; move saves to `@capacitor/preferences` or SQLite for durability | planned |
| Safe areas / notches | CSS `env(safe-area-inset-*)` already used | ready |
| Haptics, share sheet | `@capacitor/haptics`, `@capacitor/share` behind the existing share UI | planned |
| Audio session | respect the silent switch / other apps' audio (iOS `ambient` category) | planned |
| Store billing | only if monetisation is enabled — native IAP plugins; see MONETIZATION_COMPLIANCE.md | not planned now |
| Remote content | data-only JSON; no code download (store rule) | ready |
| Deep links | `pockethood://visit/<code>` + universal/app links mapped to the existing `?visit=` handler | planned |

## Stage 5 — More of the world
- Second Malaysian district (coastal fishing village or Penang-style shophouse street) as a world pack, with its own shared spots and celebrations.
- New templates as code releases: hotel (defined, no building yet), hawker centre, community services, transport stop.
- Country activation one at a time (SG → ID → TH → JP → KR), each with local language, cultural review, the same content policy, legal/privacy review and its own world pack.

## Risks to watch
- The soundtrack's appeal is unproven until people listen to it.
- Performance and battery on low-end Android (WebGL in WebView, synthesised audio).
- Translation quality and cultural accuracy as content grows — keep the review step mandatory.
- Partner pressure to add promotional surfaces or audio — SPONSOR_PLATFORM.md rules are product rules, not suggestions.
- Economy drift for very engaged players.

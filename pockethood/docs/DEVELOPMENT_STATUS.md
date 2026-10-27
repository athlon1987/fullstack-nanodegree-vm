# Development Status

_Last updated 2026-10-27. Status keys: **Completed and tested** · **Implemented** (verified by hand/screenshot/measurement, no automated test) · **Partially implemented** · **Designed, not built** · **Not started**._

## Milestone: Brand identity enhancement — peaceful world, signature soundtrack, fast play, community

Built on top of the Living World milestone (Kampung Seri, modular platform, four demo modules, English + Bahasa Melayu, Zen Mode, sharing, PWA). This is a playable single-player build. **It is not a production release**: there is no backend, no accounts, no signed content enforcement and no real partners; passing tests does not make it secure or ready for launch (SECURITY_ARCHITECTURE.md §10).

### Test results (this build)
| Suite | Result |
|---|---|
| `npm test` (Vitest) | **91 / 91 passed** — engine and core loop, persistence and migrations (v3→v4→v5), pathfinding, platform security and lifecycle (see previous milestone), plus new: **content policy** (religion/politics/hostility/restricted-product/claim screen in English and Malay, no false positives on everyday words, names or any identity; all authored content and all interface text pass; hostile modules refused; content tags; grinding quests refused; player names; visit links; save rename migration), **shared spots** (placement, partial gifts, step completion, friendship with every resident, no coins back, idempotency, level gates, flags, keepsakes, seasonal refresh, old saves gain spots), **celebration rotation**, **first-session pacing** in both worlds, **soundtrack score** (key, theme shape, tempo ranges, Zen rules) and **adaptive mood selection** |
| `npm run test:e2e` (Playwright, Chromium/SwiftShader) | **14 / 14 passed** — the previous 11 plus: the soundtrack starts on the first tap, moves to the construction arrangement at a bar line without restarting, and to the Zen arrangement; giving to the pocket park through the Together screen completes a step; a neighbourhood name outside the policy is refused politely and an everyday name is accepted |
| Soundtrack offline renders (`scripts/audio/render-previews.mjs` + `analyze.py`) | 8 arrangements + 150 s adaptive tour + effects sheet: no clipping, arrangements within ±1.5 dB (Zen ≈ 3 dB quieter by design), all tour transitions on bar lines (AUDIO_ASSET_MANIFEST.md §4) |
| `npm run content:build` | Pass — 6 countries, 1 world, 4 modules; schema, semantic, economic **and content-policy** checks in en and ms |
| `npm run typecheck` / `npm run build` | Pass |
| `npm run economy:sim` | Runs on Kampung Seri; findings below |

### Enhancement acceptance criteria (honest)
| # | Criterion | Status |
|---|---|---|
| 1 | Warm, cheerful, welcoming environment | Implemented (screenshots); taste needs playtests |
| 2 | No authored political or religious content | **Completed and tested** (automatic screen over all content and UI text in both languages; Kampung Seri scrubbed). Human review still required for art and subtext |
| 3 | Memorable, catchy, original soundtrack | **Original and integrated, measured — not yet listened to by people.** Catchiness is unverified |
| 4 | Responsive, rewarding active play | Implemented; pacing model tested |
| 5 | Meaningful short sessions | Tested in the pacing model (8 goals in the first ~6 minutes); needs playtests |
| 6 | World feels alive | Implemented (resident social life, ambient life, weather); not unit-tested |
| 7 | Community actions visibly change the world | **Completed and tested** (spots engine) + screenshot-reviewed visuals |
| 8 | Zen Mode genuinely calmer | Implemented (Zen arrangement, hidden UI/emotes, slower camera); e2e covers hiding and music |
| 9 | Enjoyable without spending money | Yes — nothing is sold |
| 10 | Sponsored content doesn't break immersion | Completed and tested (policy screen, no audio/UI fields, tags, repetition cap) |
| 11 | Accessible to casual players | Partially — casual bots progress steadily; no accessibility audit yet |
| 12 | Mobile performance on representative devices | **Not verified** — no real-device testing in this sandbox |
| 13 | Progression meaningful beyond the tutorial | Implemented (spots, celebrations, stories, refreshes); economy still inflates for enthusiasts |
| 14 | Art, music and gameplay cohesive | Implemented; subjective — needs playtests |

### Feature status (new and changed in this milestone)
| Area | Status | Where |
|---|---|---|
| Content policy + automatic screen (en/ms), content tags, claim protection, name screening, visit-link screening | Completed and tested | `src/platform/content/policy.ts`, CONTENT_POLICY.md |
| Kampung Seri scrub (pavilion, greetings, lanterns, community dinners; pennants instead of flags) + save v5 migration | Completed and tested | world pack, `persistence.ts`, `malaysia.ts` |
| Adaptive soundtrack: theme, 8 arrangements, bar-synced transitions, tempo easing, stingers | Completed and tested (score + mood rules unit-tested, transitions e2e, mix measured) | `src/audio/music/`, `src/audio/mood.ts` |
| Synthesised feedback sounds with voice limit, spacing, coin combo, master limiter; Kenney Oggs retired | Implemented (levels measured) | `src/audio/sfx.ts` |
| Audio previews & analysis tools; Studio → Audio tab | Implemented | `scripts/audio/`, `tools/audio/`, `Studio.tsx` |
| First-session pacing model and faster early requests | Completed and tested | `src/game/sim/firstSession.ts`, `pacing.test.ts` |
| Shared spots (4 × 4 steps, seasonal refresh), Together screen, quests | Completed and tested (engine, UI e2e); visuals screenshot-reviewed | `src/data/spots.ts`, `kit/community.ts`, `SpotsPanel.tsx` |
| Rotating celebrations (8, some need a finished spot) | Completed and tested | `game/engagement/events.ts` |
| Six new light-hearted Kampung Seri stories | Implemented (content validated; not individually play-tested) | world pack |
| Resident social life: waving, café gatherings, shops, relaxing in spots, helping at spots, admiring decorations, celebrating; emote bubbles | Implemented (screenshot-reviewed) | `Characters.tsx` |
| Atmosphere: golden hour, brighter nights, clouds, breeze, morning mist, post-rain sunshine with rainbow | Implemented (contact sheets reviewed); weather model pure and deterministic | `weather.ts`, `Lighting.tsx`, `Ambient.tsx`, `GameCanvas.tsx` |
| Battery saver (30 fps), audio suspended in background | Implemented | `GameCanvas.tsx`, `AudioManager.ts` |

Everything listed in the previous milestone remains as described there (platform, modules, i18n, Zen activities, sharing, PWA, Studio, backend design).

## Known defects & limitations
1. **Soundtrack not yet heard by people.** It is original, integrated and measured clean; whether it is *catchy* needs listening tests, and a composer pass is recommended (AUDIO_ASSET_MANIFEST.md §5–6).
2. **Coin inflation is reduced, not solved.** 30-day simulation: Regular players bank ~13.6k coins (was ~48k), Enthusiasts ~62k (was ~117k). Shared spots and seasonal refreshes absorb coins, but late spots are gated by goods and passive income keeps growing. Next: more creative sinks (second district, more spots, decoration sets) and a look at high-level passive income.
3. **Performance and battery unmeasured on real devices** (software WebGL here). The synthesised audio's CPU cost on low-end Android is unknown.
4. **Malay text and cultural content are unreviewed** by native speakers / a cultural panel, including the new stories, celebrations (kompang, wau, wayang pacak, pasar malam) and greetings.
5. The pacing figures come from a bot model, not playtests.
6. Resident social behaviours and emotes have no automated tests; the core world's celebrations and spot names have no Malay translation of event text (core world is the fallback; Kampung Seri is fully bilingual).
7. Module `visitors` behaviour and props still aren't rendered; residents don't react to rain.
8. Some keepsakes use core art in the tropical world; the rainbow is a screen-space overlay, not a 3D object.
9. Studio is English-only staff tooling and reachable from Settings in this prototype.
10. Visit links are long URLs; short codes need the backend.

## Remaining tasks (prioritised)
See DEVELOPMENT_ROADMAP.md Stage 2: listening tests and composer brief → first-session playtests → real-device performance → native-speaker and cultural review → economy sinks → accessibility.

## Screenshots
`docs/screenshots/35–39`: the four shared spots at stages 0, 2 and 4; atmosphere states (sunrise mist, morning, afternoon clouds, golden hour, evening, rain, after rain); the whole neighbourhood after rain with its rainbow; the Together screen. `20–34` show the Living World milestone, `01–13` the first-playable classic world.

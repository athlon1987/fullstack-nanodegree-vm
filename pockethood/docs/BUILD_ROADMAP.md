# Build Roadmap

Status keys: ✅ completed & tested · 🟢 implemented (visually/manually verified) · 🟡 partial · ⛔ blocked · ⬜ not started

## Phase 0 — Audit & plan ✅
Repository audit (existing unrelated learning app left untouched; game lives in `pockethood/`), asset research under network restrictions, stack selection, docs.

## Phase 1 — Art-first playable scene 🟢
Diorama island, terrain, road with traffic, architecture kit, CC0 nature/props/vehicles, lighting with day/night, camera, animated resident, HUD. Screenshot-reviewed (see DEVELOPMENT_STATUS.md).

## Phase 2 — Core loop ✅
Collection, placement, upgrades, production queues & chains, inventory, levels, XP, quests, request board, offline progression, save/load with migrations.

## Phase 3 — Living world 🟢
8 residents with schedules, A* pathfinding, crossfaded animation states, neighbour chats, arrivals, 3 pets, ambient birds/butterflies/clouds/smoke/fireflies, story chapters, memories.

## Phase 4 — UI/UX polish 🟢
Custom HUD and panels, catalog with real 3D thumbnails, dialogue with 3D portraits, guided tutorial coach, reward fly-ups, toasts, level-up/welcome-back modals, responsive mobile layout, sound, accessibility settings (reduced motion, text size, mute, non-colour cues).

## Phase 5 — Social foundation 🟡
✅ Local community project with idempotent contributions · ✅ `SocialService` contract · ✅ honest "coming later" Friends UI · ⛔ backend/auth/cloud save (no service or credentials in this environment).

## Phase 6 — Events & content 🟡
✅ Spring Blossom Festival · ✅ achievements · ✅ keepsakes · ✅ land expansion · ⬜ second district · ⬜ more residents (8 of 20 planned) · ⬜ more decorations/seasonal sets.

## Phase 7 — Quality & performance 🟡
✅ unit/integration tests · ✅ economy simulation & rebalance · ✅ asset validation · 🟢 Playwright flows & screenshot QA · 🟡 performance measured only under software GL (no GPU hardware here) · ⬜ real mobile device testing · ⬜ visual regression baselines in CI.

## Next 90 days (proposal)
| Weeks | Focus | Outcomes |
|---|---|---|
| 1–2 | Real-device perf pass | Profile on 2–3 mid-range Android/iOS devices; static decoration batching; LOD for distant trees; set final budgets |
| 2–4 | Art upgrade | Acquire Kenney Suburban / Quaternius building packs (or Synty); swap residential shells; bespoke talk/wave clips; rabbit & duck pets |
| 3–6 | Backend | Supabase auth + cloud save; server-side `applyAction`; anti-tamper for timers & currency |
| 5–8 | Social v1 | Friends list, read-only visits, kind notes, optional gifts; Hoods with a shared landmark |
| 6–10 | Content | Riverside Village district, 6 more residents and 15 story chapters, seasonal decoration sets, 2nd event |
| 8–12 | Mobile shells | Capacitor wrapper, push notifications (opt-in, capped), store builds, analytics backend with consent |
| 10–12 | Soft launch prep | KPI dashboards (D1/D7/D30, tutorial completion, progression funnels), A/B framework, moderation tooling |

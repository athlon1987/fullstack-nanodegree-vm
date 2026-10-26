# Engagement Flywheel

POCKETHOOD's retention design rests on one principle: **every meaningful action should make the world more valuable, expressive or connected, creating a genuine reason to come back.** It's built from five interlocking flywheels. This document maps each one to the code that implements it, what is live today, and the product hypotheses we will test once real players exist.

Guardrails we hold to everywhere: no punitive streaks, no expiring progress, no guilt messaging, no fake social proof, no paywalls on solo progression, and optional events whose rewards are kept forever.

## How it's wired

```
player action ──► engine (src/game/core/actions.ts)  ── pure, deterministic
                     │ emits GameEvents
                     ▼
              Engagement Director (src/game/engagement/EngagementDirector.ts)
                 ├─ stats counters           (what happened)
                 ├─ quests                    (main progression)
                 ├─ resident stories + memory (emotional attachment)
                 ├─ Neighborhood Pulse        (daily layer)
                 ├─ achievements              (milestones)
                 ├─ seasonal event tiers      (content & discovery)
                 └─ neighborhood history      (the world remembers)
                     │ follow-up events
                     ▼
              store (src/state/store.ts) ──► toasts · fly-ups · sounds · dialogue · analytics · save
```

The Director runs to a fixed point after every action, so a single delivery can complete an order → level up → activate a quest → unlock a story → tick a Pulse goal, all in one consistent state. Everything is persisted (IndexedDB, versioned) and covered by tests in `src/game/core/engine.test.ts`.

## Flywheel A — Economic progression
`Play → Produce → Earn → Build → Unlock → Expand → Play`

| Piece | Where | Status |
|---|---|---|
| Timestamp production queues, passive income with storage caps | `actions.ts` (`produce`, `collect`), `economy.ts` | Completed and tested |
| 12 buildings, 14 recipes incl. 2-step chains (bread+berries → pie) | `src/data/buildings.ts`, `src/data/items.ts` | Completed and tested |
| Upgrades that add recipes, slots, speed **and visible changes** | `BuildingLevelDef.perks`, `rendering/kit/archetypes.ts` | Implemented; visuals verified in screenshots |
| Request board that only asks for producible goods | `game/quests/orders.ts` | Completed and tested (200-seed property test) |
| Land expansion with escalating cost; wooded plots clear on purchase | `data/progression.ts` (`EXPANSIONS`), `Terrain.tsx` | Implemented and tested |
| Materials (planks, bricks) as the upgrade sink | Workshop recipes, upgrade costs | Implemented |

## Flywheel B — Emotional attachment
`Interact → Friendship → Stories → Change the world → Attachment`

| Piece | Where | Status |
|---|---|---|
| 8 residents with personality, profession, favourites, schedule, dialogue | `data/residents.ts` | Implemented |
| Friendship (talk once/day, gifts once/day, orders, stories) with 6 named tiers | `relationships.ts`, `economy.ts` | Completed and tested |
| **Persistent memories** that change dialogue (e.g. Mia remembers you opened her café) | `ResidentState.memories`, `chooseLine()` | Completed and tested |
| 10 story chapters across 5 residents; each sets a memory, most change the world (chalkboard, brunch tables, pie sign, butterflies, bunting) | `data/progression.ts` (`STORIES`) | Implemented; Mia/Felix chapters tested |
| Arrivals: residents move in when their workplace is built and walk in from the street | `actions.ts` tick, `Characters.tsx` | Implemented |

Characters never claim to be conscious or to depend on the player; dialogue is warm but not needy.

## Flywheel C — Social network effects
`Build → Invite → Collaborate → Improve shared spaces → Memories → Invite`

| Piece | Where | Status |
|---|---|---|
| Community project (Neighborhood Fountain) with 4 visible build stages | `actions.ts` (`contribute`), `archetypes.ts` (`fountain`) | Completed and tested (local) |
| Idempotent contributions (op ids) — the same contract a server must enforce | `contribute` | Completed and tested |
| Contribution log & landmark history entry; all residents remember it | `CommunityState.log`, Director | Implemented |
| Social service contract (friends, visits, gifts, Hoods) with server-authoritative notes | `game/social/SocialService.ts` | Interface only |
| Online play | — | **Not started** (no backend in this environment). The Friends panel says so plainly; no simulated players are shown as real. |

## Flywheel D — Creative identity
`Customize → Create → Share → Inspire → Customize`

| Piece | Where | Status |
|---|---|---|
| Free placement, rotation, move, sell; paint-mode for decorations | `PlaceBar`, `Placement.tsx` | Implemented |
| 21 decorations incl. 6 keepsakes earned from stories/events/projects | `data/buildings.ts` | Implemented |
| Rename your neighborhood (shown on the welcome sign) & choose an avatar | `ProfilePanel` | Implemented |
| Photo mode: HUD hidden, framed capture, save or native share, optional name watermark | `PhotoMode` | Implemented (share depends on browser support) |
| Showcases & shareable blueprints | — | Not started (needs backend + moderation) |

## Flywheel E — Content & discovery
`Explore → Discover → Complete → Unlock → New content`

| Piece | Where | Status |
|---|---|---|
| Level unlocks (10 designed levels, 30 total) | `LEVELS` | Implemented |
| Residents locked as "???" with arrival hints | `ResidentsPanel` | Implemented |
| Spring Blossom Festival: optional, 7 days, 4 objectives, 4 reward tiers, reruns | `EVENTS`, Director `eventStep` | Implemented |
| 12 achievements | `ACHIEVEMENTS` | Implemented |
| Neighborhood history log | `history`, `ProfilePanel → History` | Implemented |
| Districts beyond the first island | `EXPANSIONS` structure only | Not started |

## Daily engagement layers

| Layer | Target | What the player can do | Status |
|---|---|---|---|
| Quick satisfaction | 1–3 min | Collect rent & goods, deliver a waiting order, chat with a neighbor | Implemented |
| Meaningful progression | 5–15 min | Upgrade, chain production, a story chapter, contribute to the fountain | Implemented |
| Deep engagement | 20+ min | Redesign & decorate, expand land, festival goals, photo mode | Implemented (smaller scope) |

**The Neighborhood Pulse** (`engagement/NeighborhoodPulse.ts`) generates three goals per local day — one practical, one resident-related, one creative/social — from the player's *actual* capabilities, seeded by (seed, date) so it's deterministic. Each pays a small reward on completion; finishing all three unlocks a 2-gem bonus. Missing a day costs nothing. Property-tested against 200 seeds/days to never produce impossible goals.

**Next-goal visibility** (`PlayerReturnManager.nextGoal`) always derives one concrete next step from world state (collect, deliver, story, affordable upgrade, quest, idle production).

**Welcome back** (`welcomeSummary`) after 15+ minutes away: what's ready, what finished, who has a story, and the next goal. No shaming, nothing decays.

## First seven days (design beats, not time gates)

| Day | Beat | Built so far |
|---|---|---|
| 1 Ownership | First collection, Mia's café, first order, first upgrade (terrace appears) | ✔ guided tutorial (6 steps, 3–5 min) |
| 2 Growth | Garden (Luna), bakery (Felix), new recipes | ✔ |
| 3 Personality | Mia/Felix/Luna story chapters change the world | ✔ |
| 4 Creativity | Decor quest, keepsakes, photo mode | ✔ |
| 5 Community | Fountain community project | ✔ local; online visits ✘ |
| 6 Discovery | Workshop, flower shop, cottage (Noah) | ✔ |
| 7 Achievement | Fountain landmark completes; park & expansion as next aspiration | ✔ (pace depends on play style — see ECONOMY_SIMULATION.md) |

## Measurable hypotheses (to test with real players — not established facts)

| # | Hypothesis | Metric | Instrumented event(s) |
|---|---|---|---|
| H1 | Completing the café upgrade in session 1 raises D1 return | D1 retention split by `building_upgraded{cafe,2}` in session 1 | `building_upgraded`, `session_start` |
| H2 | A first decoration (creative customisation) predicts D7 return | D7 retention by `creative_customization` count in week 1 | `creative_customization` |
| H3 | Reaching "Friend" with any resident increases voluntary session frequency | Sessions/week before vs after first friendship-up | `story_milestone`, `resident_interacted` |
| H4 | Community contributions increase week-2 activity | Week-2 sessions by `community_contribution` in week 1 | `community_contribution` |
| H5 | The Pulse improves short-session satisfaction without lengthening sessions | Pulse completion vs session length & self-reported satisfaction | `pulse_task_done` |
| H6 | Photo mode use correlates with organic invites (once sharing is online) | Shares per photo | `photo_taken` |

Analytics today are **local-only** (`services/analytics.ts`, inspectable in Settings → Developer tools) and respect the consent toggle. No metrics in this repo are real-player data.

## Implementation dependencies

1. **Backend** (accounts, cloud save, server-authoritative economy) before any online social feature, trading or purchases.
2. **Moderation** (reporting, name filters) before public showcases or shared blueprints.
3. **Push notifications** only with explicit opt-in, frequency caps and no guilt copy.
4. **More resident content** (writer time) — the story system is data-driven; each chapter is ~15 lines of data.

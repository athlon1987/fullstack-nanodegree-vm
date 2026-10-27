# POCKETHOOD — Game Design

> *Build your little world. Watch it come alive.*

A cozy social neighbourhood-building game. You start with one little house on a diorama island, help your first neighbour open their dream café, and grow a street of shops, gardens and friends whose stories change the world around them.

**Audience:** 13–45, broad and international. Accessible in five minutes, meaningful over months. **Pillars:** ownership, creativity, progression, discovery, social connection, character attachment, satisfaction. **Anti-pillars:** punishing breaks, artificial scarcity, pay-to-progress.

**Worlds.** The default world is **Kampung Seri**, a fictional Malaysian kampung (see MALAYSIA_WORLD_DESIGN.md). **Maple Hollow** is the built-in classic, neutral core world. It always works offline and can be chosen in **Settings → Neighbourhoods**. Both run the same rules and economy. They differ in names, residents, dialogue, art, layout and environment.

## Brand identity

> *A happy little world, full of life, where there's always something wonderful to create.*
> *Life is better when we build something beautiful together.*

Four things define POCKETHOOD and apply everywhere — authored content, partner modules, audio and UI:

1. **A peaceful world.** Warm, cheerful, welcoming. Themes: friendship, kindness, cooperation, creativity, nature, everyday accomplishments, helping others. No religion, politics, conflict or divisive messaging in any language or country; cultural diversity shows through food, architecture, art, music, landscapes and everyday community life (CONTENT_POLICY.md). Characters have personalities and gentle humour; disagreements are light and end happily.
2. **Calm atmosphere, fast feedback.** The world is relaxing; the play is responsive and full of small, meaningful choices (§Pacing). Engagement comes from fun and mastery, never pressure.
3. **Community first.** Helping the neighbourhood is the most rewarding thing you can do, and it visibly changes the world (§Community).
4. **A signature soundtrack.** An original, catchy lo-fi theme that adapts to what you're doing (§Music, AUDIO_ASSET_MANIFEST.md).

**Play styles.** *Standard* is the default: upbeat music, fairly fast progression, quick rewards, construction, production, quests, social activities. *Zen Mode* is the meditative alternative on the same world and save (§Zen Mode). Switching never loses progress or resources.

**Wording rule.** Describe the game as cosy, relaxing, cheerful, calm. Never claim it treats or reduces stress, anxiety or any medical condition.

## Core loop
`COLLECT → PRODUCE → BUILD → UPGRADE → UNLOCK → CONNECT → REPEAT`

The **social happiness flywheel** wraps it: *Play → Improve your world → Help others → Build community → Unlock shared experiences → Discover new goals → Play.* A good action should pay off beyond coins: a park attracts residents, a café becomes a meeting place, finishing a shared spot unlocks a celebration, helping a neighbour deepens a friendship.

**Action chain example (Kampung Seri):** brew kopi → serve the first request → earn coins → upgrade the kopitiam (marble tables appear) → unlock the breakfast set → fulfil Uncle Lim's story → earn the kopitiam parasol keepsake → help clear Taman Poket → open it with a picnic → the Garden Party celebration begins there.

## Pacing

Targets from the design brief, validated by the first-session model (`src/game/sim/firstSession.ts`, `src/game/pacing.test.ts`): a human-paced new player (1.5 s per tap, 4 s per placement, 2.5 s per dialogue line) following the guide, on the real engine and content.

| Milestone | Target | Kampung Seri (model) | Maple Hollow (model) |
|---|---|---|---|
| Meet a resident | at once | 0 s | 0 s |
| First resources collected | ≤ 20 s | 5 s | 5 s |
| First reward | ≤ 60 s | 5 s | 5 s |
| A business constructed | ≤ 60 s | 20 s | 20 s |
| First product made | ≤ 90 s | 47 s | 44 s |
| First customer request completed | ≤ 150 s | 65 s | 64 s |
| First upgrade / decoration | ≤ 5 min | ≈ 2.5 min | ≈ 2.3 min |
| Next objective visible | always | ✓ | ✓ |
| Longest stretch with nothing useful to do (first 15 min) | ≤ 20 s | ≤ 15 s | ≤ 20 s |

These are model results, not playtests; they show the design allows the pace. Real playtests must confirm the feel.

What keeps it moving without timers walls: early requests arrive every 30 s (levels 1–2) and 60 s (3–4) before settling at 2 minutes; basic recipes take 15–40 s; small buildings construct in 5–20 s; and there is always something else to do — hand-made specials, garden plots, fishing, pets, chatting, decorating, giving to a shared spot. Longer chains (pies, furniture, the lookout) are optional and never block the rest of the world.

## Community

**Shared spots** (`src/data/spots.ts`): four places just beyond your land that the whole neighbourhood transforms together — an overgrown corner → **pocket park** (L2), an empty square → **community plaza** (L3), a bare lot → **playground** (L5), a dusty rise → **sunset lookout** (L7). Each has four steps with visible changes (cleared → planted → furnished → finished with bunting, lights and residents gathering). Give coins and goods in any amounts; each finished step brings XP and friendship with *every* neighbour, never coins. A finished spot unlocks a keepsake and a celebration, and can optionally be refreshed each season for a fresh colour scheme (needs grow each time). Spots are the economy's main coin sink and the clearest link between generosity and a more beautiful world.

**Celebrations** rotate with a day's rest in between: Flower Festival, Street Food Day, Music Night, Garden Party (needs the park), Community Market (plaza), Pet Parade (playground), Outdoor Movie Night (lookout), Town Anniversary. Small, optional, about togetherness; never tied to a religious or political date.

**Residents' social life:** neighbours wave when they pass, stop to chat, gather at the café, visit shops, relax in finished spots, lend a hand at spots in progress, come to admire a new decoration, and gather to cheer when a step is finished or a celebration starts — with small emote bubbles (hidden in Zen Mode). The neighbourhood is alive even when you're just watching.

**Solo by design.** Everything works with NPC neighbours; online social play is optional and never a progression gate.

## Music

An original adaptive score (AUDIO_ASSET_MANIFEST.md): one 8-bar theme in F major arranged eight ways — town (piano, 92 BPM), building (marimba, 104), café (jazzy Rhodes and walking bass, 96), garden (plucked guitar, 95), night (mellow keys, 84), celebration (brighter, claps, 112), mini-games (marimba, 108) and Zen (the hook alone on vibraphone, 72, no drums). The music changes at bar lines without restarting; milestones get short, in-key flourishes; every feedback sound is tuned to the same key.

| Verb | What the player does | Feedback |
|---|---|---|
| Collect | Tap a building's bubble | Coin/item fly-up to the HUD, counter bump, sound, XP |
| Produce | Queue recipes in shops (2–4 slots) | In-world progress bubble; finished items wait — offline too |
| Build | Pick from the catalog, drag the ghost, confirm | Green/red footprint + text, construction scaffold, settle-bounce, "open!" toast |
| Upgrade | Spend coins + materials | New recipes/slots/speed and a **visible** change (terrace, awning lights, greenhouse, clock tower…) |
| Deliver | Fulfil requests on the Request Board | Coins, XP, friendship, a thank-you line |
| Connect | Chat, gift, help with stories | Hearts, memories, world changes, keepsakes |

Alongside the loop there are **gentle activities** (hand preparation, quiz, showroom, garden plots, lake, pets, flower arranging). They are short, optional and low-stakes. See below.

## World
- 24×24 cell island = 16 plots of 6×6. The central 4 plots (12×12) start owned; the main street runs along z = 18–19.
- The starting scene comes from the active world's layout: `CORE_LAYOUT` in `src/data/world.ts` for Maple Hollow, and the `layout` in the world JSON for Kampung Seri. Both share the same skeleton: starter house, pond or lake, a community-project site in a paved ring, request board, welcome sign or gateway, lamps, a front flower garden, trees, shrubs, fences, a bench and small props. An empty lot next to the house invites the café.
- Locked plots are wooded with "FOR SALE" signs once affordable; buying one clears the trees. Each world names its 12 expansion plots.
- Kampung Seri is tropical: laterite earth, palms, and rain showers (about 30% of 6-minute spells). Maple Hollow is temperate and has no rain.

## Buildings (14 functional + landmarks)
Names show Maple Hollow / Kampung Seri. Where a module dresses a slot in Kampung Seri, the module's name is the one players see.

| Building | Unlock | Template | Role | Levels |
|---|---|---|---|---|
| Starter House / Rumah Kampung | start | residential | Rent | 3 |
| Mia's Café / Kopitiam Lim | 1 | cafe | Coffee, Breakfast Set (+ module drinks & food) | 3 |
| Community Garden / Kebun Komuniti Seri | 2 | farm | Flowers, Berries/Kelapa, Vegetables; garden plots (module) | 3 |
| Bakery / Mei's Bakery | 2 | restaurant | Bread, Berry Pie / Kuih Kelapa | 3 |
| Workshop / Bengkel Kayu | 3 | — | Planks, Bricks, Furniture / Rattan Chair | 3 |
| Flower Shop / Kedai Bunga | 3 | retail | Bouquet, Flower Crown / Garland | 2 |
| Cottage / Rumah Papan | 3 | residential | Rent (Noah moves in, Maple Hollow only) | 2 |
| Learning Centre / Pusat Belajar Cahaya | 3 | learning | Daily quiz (3 → 5 questions), small income, +6 charm | 2 |
| Pocket Park / Taman Rekreasi | 4 | park | Tips, residents relax | 2 |
| Car Showroom / Galeri Seri Auto | 4 | showroom | Arrange display bays (2 → 3), visitor income | 2 |
| Grocery Shop / Kedai Runcit | 5 | retail | Veggie Basket, Jam / Kaya, shop income | 2 |
| Townhouse / Rumah Teres | 6 | residential | Rent; Zara / Joanna moves in | 2 |
| Town Hall / Balai Raya | 7 | community | +1 order slot, civic income | 2 |
| Fountain / Lakeside Wakaf | community project | — | Landmark, 4 visible build stages | — |

Plus 15 catalog decorations and 6 earnable keepsakes. Kampung Seri renames them (e.g. Rain Tree, Coconut Palm, Bamboo Fence, Tempayan; the keepsake statue becomes a Kampung Marker Stone).

## Residents
Each world has 8 residents. Each has traits, favourites, an arrival rule, a workplace behaviour, phase-aware greetings, friendship-gated small talk, memory lines and gift reactions.

| World | Residents | Story chapters |
|---|---|---|
| Maple Hollow | Mia (café owner), Felix (baker), Luna (florist), Oliver (builder), Noah (delivery rider), Ruby (event organiser), Theo (architect), Zara (photographer) | 10 (Mia ×3, Felix ×2, Luna ×3, Oliver ×1, Ruby ×1) |
| Kampung Seri | Uncle Lim (kopitiam owner), Mei (baker), Mak Cik Zainab (retired teacher & gardener), Arjun (carpenter), Cikgu Kavitha (learning centre teacher), Aisyah (community organiser), Farid (showroom keeper), Joanna (photographer) | 12 (Lim ×3, Mei ×2, Zainab ×3, Arjun, Aisyah, Kavitha, Farid ×1 each) |

Completing chapters changes the world through flags: chalkboard menu, brunch tables, bakery display, butterflies, bunting.

## Progression
- **Levels:** 10 designed levels of unlocks (30 total). XP from building, upgrading, production, orders, quests, stories and small amounts from activities.
- **Quests:** Maple Hollow 18 main quests; Kampung Seri 19, plus 4 module quests. In both worlds the first six are the guided tutorial.
- **Pulse:** three daily goals (see ENGAGEMENT_FLYWHEEL.md).
- **Achievements:** 12. **Celebrations:** 8 rotating, optional (2–4 days each, 3–4 objectives, reward tiers); four need a finished shared spot. **Shared spots:** 4 × 4 steps + seasonal refreshes. **Expansion:** 12 plots.
- **Beyond the tutorial:** progression adds creative freedom and choice, not just bigger numbers — new places to build together, new celebrations, new stories, keepsakes, seasonal looks.

## Tutorial (first 3–5 minutes)
Shown here for Kampung Seri; Maple Hollow follows the same beats with Mia and Luna.

1. Uncle Lim introduces himself → **collect rent** (the coin bubble is ringed, a hand points at it).
2. Open **Build** → pick the **coffee shop** → drag & confirm (spot pre-suggested) → construction.
3. Tap the kopitiam → **brew Kopi** ×3 → collect.
4. Open **Orders** → **deliver** the first request from the Papan Kenyataan. *(Level 2 happens around here.)*
5. **Upgrade the kopitiam** → marble tables appear on the five-foot way; Lim remembers it.
6. Build the **Kebun Komuniti** → Mak Cik Zainab moves in. Free play begins; the Pulse appears.

Every step is ringed in the UI or marked with a bouncing arrow over the right building. The camera focuses on it, and the coach card explains *why*. Hints wait for real completion, and can be hidden, skipped, or replayed from Settings.

## Worlds, world packs and modules (design view)
Content is layered so that new places can be added as data without changing the rules. The technical detail lives in MODULAR_ARCHITECTURE.md, CONTENT_SCHEMA.md and SPONSOR_PLATFORM.md.

| Layer | What it is | Who changes it | Example |
|---|---|---|---|
| A · Core | Engine, economy, building slots, the neutral Maple Hollow world | Code release | `cafe` slot, recipes, orders |
| B · Templates | Reviewed rule sets for a kind of place: which behaviours it may run, which prefabs may dress it, economic limits | Code release | `cafe`, `learning`, `showroom`, `farm` |
| World pack | A country district: names, residents, dialogue, quests, stories, event, community project, layout, environment, art archetypes | Content (JSON) | `my.kampung_seri` |
| C · Modules | One place's identity and activities on one slot: name, sign, palette, prefab, items, recipes, quests, behaviours, real-world notice | Content (JSON) | `my.food.kopitiam_lim` |

Design rules:

- **One slot, one module.** A module dresses a core building whose template matches its own (e.g. a `cafe` module on the café). It must belong to the active world's country. The first module to claim a slot wins.
- **Modules cannot buy an edge.** Templates cap item values, recipe times, coin costs, XP, quest coins (≤ 200) and *net value created per minute* (food 24, retail/farm 18). This roughly matches the best core recipe. Content outside the limits is refused.
- **Behaviours are rules in code, parameters in data.** Modules choose from `hand_prepare`, `quiz`, `showroom`, `garden_plots`, `visitors` and `ambient_sound`, as allowed by their template. `visitors` is accepted but has no in-game effect yet (**not built yet**).
- **Graceful fallback.** A world pack with broken references is refused and Maple Hollow stays. A module that fails checks, is not approved, is outside its activation window, or is hit by the index kill switch is quarantined. Its building then reverts to the template's neutral presentation: a neutral "Curious Minds" quiz for the learning centre and a neutral showroom. Player state is never changed by installation.
- **Honest real-world info.** Each module has an "About this place" card that shows whether the place is fictional or licensed, plus its notice. Menus show prices only when they are partner-supplied and verified. Halal status appears only with a certificate record. Outbound links must be on an allowlist (currently empty) and are hidden in Zen Mode. Sponsor labels ("Sponsored experience" / "Official partner") are shown when used. None of the four demo modules is sponsored.
- **Countries.** `content/countries/` defines locales, currency, timezone and compliance notes. Malaysia is **active**; Singapore, Indonesia, Thailand, Japan and South Korea are **planned** (no worlds yet).

The four demo modules in Kampung Seri:

| Module | Template / slot | Activity |
|---|---|---|
| Kopitiam Lim | cafe / `cafe` | Hand-prepare teh tarik; Kopi-O, Teh Tarik, Roti Bakar, Nasi Lemak recipes |
| Galeri Seri Auto | showroom / `showroom` | Arrange 5 unbranded car models × 6 paints |
| Pusat Belajar Cahaya | learning / `learning_centre` | Daily "Malaysia & Nature" quiz (16 questions) |
| Kebun Komuniti Seri | farm / `garden` | 4 garden plots, 5 plants |

## Gentle activities
Short, optional and never punishing. Rules live in `src/game/core/actions.ts`; UI lives in `src/ui/panels/ModulePanels.tsx`.

| Activity | How it plays | Limits | Reward |
|---|---|---|---|
| **Hand preparation** (teh tarik at Kopitiam Lim) | Tap the steps in order: pour → pull → pull → serve. The pads are in a stable shuffled order. A wrong tap simply restarts the sequence, with no penalty. | 90 s rest per building; needs the recipe's inputs (teh tarik: 2 coins) and building level | 1 teh tarik, recipe XP + 1, +1 friendship with the staff resident. Counts as production. |
| **Daily quiz** (learning centre) | Pick one of three answers. Every answer, right or wrong, shows a short **explanation**. Questions come in a stable daily order and each appears once per day. | **Daily limit:** 3, +2 per learning-centre level (5 at L2) | Right: 3 XP + 4 coins. Wrong: 1 XP. Running tally of correct/answered. |
| **Showroom arranging** | For each display bay, choose a model and a paint; the car appears on the turntable. | 2 bays at L1, 3 at L2 | 2 XP the first time a bay is filled; every change counts for "arrange" goals |
| **Garden plots** | Plant any of five crops (Bunga Raya 4 min, Lemongrass 5, Chilli 7, Pandan 10, Coconut sapling 15). **Water** to speed growth, then harvest. | Up to 3 waterings per crop, at least 5 min apart; each cuts 15% of grow time | Crop items (2–3), 2 XP; harvests count as production |
| **Fishing journal** (lake) | Cast a line; a fish (or prawn, or a shy turtle) visits. It is **always released**, and the journal records each species and how often it was seen. Rarer species are less common. | 40 s between casts | Journal entries only, no coins or items |
| **Pets** | Feed Mochi (cat), Biscuit (needs the bakery) and Pudding (needs the café) | Once per pet per day | None (a quiet moment) |
| **Sunset / lake moments** | "Sit by the lake" any time; "Watch the sunset" at dusk on the game clock | 3 min rest shared by all moments | Journal count only |
| **Flower arranging** | Arrange 2 flowers (Flowers / Bunga Raya) into a display | Shares the 3-min moment rest; uses 2 flowers | Journal count only |

Activity counters feed quests and stories, e.g. "Make 3 teh tarik by hand", "Answer 5 quiz questions" and "Plant 2 plots, harvest 1".

## Zen Mode
A calmer way to spend time in the neighbourhood. Turn it on in **Settings** or the **Zen** panel (always reachable from the side rail).

**What it hides or softens:**
- Coin and gem counters (replaced by a "Zen" button), navigation badges, building status bubbles, story "!" markers, and the quest tracker and Pulse.
- Toasts (errors still show), coin and item fly-ups, the level-up card, and dialogue the player didn't start.
- Sponsor labels, real-world menus and outbound links.
- Music switches to the Zen arrangement (the theme's hook on vibraphone at 72 BPM, pads, no drums). Rain is lighter (half the drops). Resident emote bubbles are hidden. The camera eases more slowly and, after 20 s idle, drifts gently (unless Reduced motion is on).

**What it offers:** a hub for the lake (fishing, lake moment, sunset), tending the garden, flower arranging, decorating, feeding pets, and a journal of quiet moments.

**No medical or therapeutic claims.** Zen Mode is described only as a calmer way to play. The panel says: "It isn't a treatment or a substitute for care." Store copy, marketing and future content must not describe it as reducing stress or anxiety, improving mental health, or as therapy or mindfulness treatment.

## Sharing
From the **Share** button (`src/ui/panels/SharePanel.tsx`):

| Option | What it sends |
|---|---|
| **Share on WhatsApp** | Opens `wa.me` with a short message and the link |
| **Share…** | The browser's native share sheet (when supported) |
| **Copy link** | Copies the link; falls back to a copy prompt |
| **Take a photo to share** | Opens photo mode (HUD hidden, framed capture, save or native share) |

By default, the link only opens the game and **carries nothing from the save**.

**Read-only visit snapshots** (optional toggle in the Share panel; flag `visit_links`):
- The link encodes a small snapshot of the **layout** (building types, positions, rotations and levels), the **neighbourhood name** and the **player level**. It also carries the world id and the list of resident ids, so the right world and neighbours can be drawn.
- It never contains coins, inventory, player name, avatar, stats, history, timestamps, settings or device identifiers (`src/services/visit.ts`).
- Opening one shows a "Visiting {neighbourhood}" banner over a throwaway, read-only state that is never saved, with a button back to your own neighbourhood.
- Incoming codes are treated as untrusted: size-capped, schema-validated and bounds-checked.
- A snapshot is a picture in time. Live visits, gifting and co-op are **not built yet** (they need a backend).

## Language
- **English** and **Bahasa Melayu**, switchable any time in **Settings → Language**. On first run the game picks Malay if the device language starts with "ms", otherwise English, and then remembers the choice.
- Switching re-installs the content in the new language straight away: building names, dialogue, quests and signs repaint, and progress is unaffected.
- UI strings live in typed dictionaries, so a missing Malay key fails the build. Content text resolves in this order: the chosen language, then English, then the first available. Maple Hollow's core names have a Malay overlay. Kampung Seri content is bilingual, except the learning-centre quiz module, which is English-only for now.
- Malay text needs native-speaker review before release.

## Economy
See ECONOMY_DESIGN.md. Currencies: **coins** (soft), **gems** (premium-reserved; earnable from achievements, Pulse bonus, stories, the community project; spent only on optional timer skips), **XP**, **materials** (planks/papan, bricks/bata). Module recipes stay inside template value ceilings. Gentle activities give little or nothing in currency by design.

## Monetisation (architecture only — nothing is sold)
Cosmetic building skins, decoration collections, outfits, pets, seasonal passes, optional rewarded ads, convenience. Sponsored or partner modules would be labelled and kept inside the same economic limits as any other content. Never: unavoidable ads, paywalled solo progress, manipulative scarcity, promotions in Zen Mode. Purchases would be server-validated with age-appropriate safeguards.

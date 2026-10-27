# Kampung Seri — Malaysia World Design

> *A fictional Malaysian kampung of shoplots, timber houses and a quiet lake.* (world tagline)

Kampung Seri is POCKETHOOD's default world: the first country world pack (`content/worlds/my.kampung_seri.json`, id `my.kampung_seri`, v1.0.0) plus four demo modules (`content/modules/*.json`). It reuses the core rules and economy. Only names, dialogue, art, layout, environment and module behaviours change. Everything in this document can be checked against those files and the code paths named.

## 1. Premise

You move into a **rumah kampung** (timber house on stilts) in a small fictional district. **Uncle Lim** wants to reopen his late father's corner kopitiam, which closed when he retired. Helping him is the first thread. After that the kampung grows: a bakery, a community garden, a carpentry bengkel, a learning centre, a park, a car showroom, a kedai runcit, a terrace house and finally a balai raya. Neighbours build a **pondok** (open-sided rest pavilion) by the lake together through gotong-royong, and turn four neglected corners just past the kampung into a pocket park, a plaza, a playground and a sunset lookout.

Tone: warm, everyday and unhurried. The kampung is shown through its routines: morning kopi, rain under the five-foot way, gardening, homework and sunsets by the tasik. Set-piece "culture" is not the focus, and celebrations are everyday community ones (a flower festival, a pasar malam, a movie night), never religious holidays or political dates. Everything follows CONTENT_POLICY.md.

## 2. Name check

| Item | Finding |
|---|---|
| Status | **Provisional.** "Kampung Seri" is used as the district name, neighbourhood name, gateway sign text and in the Balai Raya sign. |
| Search result | A web search found no prominent place called exactly "Kampung Seri". |
| Caveat | "Seri …" place names are very common in Malaysia, e.g. **Kampung Seri Menanti** (Negeri Sembilan) and **Kampung Seri Delima** (Kuala Lumpur). Players may read it as a generic or composite name. |
| Recommendation | Run a trademark and name clearance before launch. Changing the name only requires editing `name`, `hoodName`, `tagline`, the gateway description and dialogue mentions in the world JSON. The gateway and Balai Raya signs are painted from the neighbourhood name at runtime. |

All businesses are fictional and say so in-game. Kopitiam Lim, Galeri Seri Auto, Pusat Belajar Cahaya and Kebun Komuniti Seri each carry a `realWorld.notice`, and Kopitiam Lim and Galeri Seri Auto show a "fictional" badge.

## 3. Residents

Eight residents replace the core cast when the world is installed (`applyWorld` in `src/platform/content/install.ts`). Bodies are Kenney Mini Characters (CC0), and each resident has an accent colour.

| Resident (EN / BM) | Profession | Background (from bio) | Lives / works at | Arrives when |
|---|---|---|---|---|
| Uncle Lim / Pak Cik Lim | Kopitiam owner | Ran his father's corner kopitiam for thirty years before it closed. Remembers every regular's order and grows orchids on the back steps. | Coffee shop (Kopitiam Lim) | Start |
| Mei | Baker | Trained in a big hotel kitchen, came home to bake for people she actually knows. Experiments with pandan and gula melaka. | Mei's Bakery | Bakery built |
| Mak Cik Zainab | Retired teacher & gardener | Taught primary science for 34 years. Knows the name of every plant in the kampung and most of the birds. | Kebun Komuniti | Garden built |
| Arjun | Carpenter | Makes rattan chairs the way his grandfather taught him; coaches the kampung kids' football on Saturdays. | Bengkel Kayu | Workshop built |
| Cikgu Kavitha | Learning centre teacher | Runs after-school lessons with endless patience and a cupboard of puzzle books. Former pupil of Zainab. | Learning Centre (Pusat Belajar Cahaya) | Learning centre built |
| Aisyah | Community organiser | A clipboard for every occasion; organises gotong-royong and the night-market stalls. | Taman Rekreasi | Park built |
| Farid | Showroom keeper | Restores old cars on weekends and explains engines simply. Described as honest to a fault. | Car Showroom (Galeri Seri Auto) | Showroom built |
| Joanna | Photographer | Grew up in Sabah with Mount Kinabalu outside her window; photographs sunsets, shopfronts and people. Favourite place: the lake. | Rumah Teres | Terrace house built |

Each resident has traits, favourite gifts, phase-aware greetings, friendship-gated small talk, memory lines (for example Lim remembers the reopening, and Zainab and Lim remember the pavilion) and gift reactions, all in en-MY and ms-MY.

### How representation was approached

- **A mixed kampung, not a single-group one.** The cast is Malay (Zainab, Aisyah, Farid), Chinese (Lim, Mei), Indian (Arjun, Kavitha) and Sabahan (Joanna). Ethnicity is never stated as a label. It shows only through names, honorifics (*Uncle*, *Pak Cik*, *Mak Cik*, *Cikgu*) and personal history.
- **People are defined by craft and relationships.** Each person has a job, a skill handed down or learned, and ties to other residents: Kavitha was Zainab's pupil, Mei teases Lim about kaya, and Arjun introduces Farid. None of them is defined by festivals, food stereotypes or costume.
- **No caricature in dialogue.** English lines are standard Malaysian English. There are no exaggerated accents, no phonetic spelling and no "lah"-style particles (checked across the world and module JSON). Light interjections: Uncle Lim says "Wah, this is my favourite!" and "Thank you, ah.", and Mak Cik Zainab says "Wah, cantiknya!". They are flagged for the review panel in §11.
- **No religious or political content.** Following CONTENT_POLICY.md, no resident uses religious greetings or expressions, no character's faith or politics is mentioned, and no festival tied to a religion appears. Everyday warmth comes from food, place, family and nature instead: Zainab greets with "Selamat pagi! Come, look at the bunga raya today." and reacts to a loved gift with "Wah, cantiknya!". Identity is never hidden: names, honorifics, languages and home towns stay as they are.
- **No figurative statue.** The community-project keepsake is shown as a **Kampung Marker Stone** (stone block with a brass plaque, flanked by shrubs) instead of the core world's figurative "Founder Statue" (`tropicalDecoration('statue')` in `src/rendering/kit/malaysia.ts`).
- **Food without claims.** See §8.

## 4. Places

Kampung Seri does not add new building types. It reskins the core slots, and four of them are additionally dressed by modules. Templates are defined in `src/platform/content/templates.ts`. Archetypes are drawn by `src/rendering/kit/malaysia.ts`.

| Core slot | Kampung Seri name (EN / BM) | Art (archetype / prefab) | Template | Module | Staff / resident | Unlock |
|---|---|---|---|---|---|---|
| `starter_house` | Rumah Kampung | `my:rumah_kampung`: stilts, serambi, zinc gable roof, letterbox | residential | — | (player) | start |
| `cafe` | Coffee Shop → **Kopitiam Lim** | `prefab:kopitiam` (shoplot with five-foot way, marble tables) | cafe | `my.food.kopitiam_lim` | Lim | L1 |
| `bakery` | Mei's Bakery / Kedai Roti Mei | `my:kedai_roti` (blush shoplot, glass cabinet) | restaurant | — | Mei | L2 |
| `garden` | Kebun Komuniti → **Kebun Komuniti Seri** | `prefab:community_garden` (4 raised plots, bamboo fence, water tank) | farm | `my.community.kebun_seri` | Zainab | L2 |
| `workshop` | Bengkel Kayu | `my:bengkel` (open timber shed, rattan chairs) | — | — | Arjun | L3 |
| `flower_shop` | Kedai Bunga | `my:kedai_bunga` (lilac shoplot, flower buckets) | retail | — | — | L3 |
| `learning_centre` | Learning Centre → **Pusat Belajar Cahaya** | `prefab:learning_house` | learning | `my.edu.pusat_cahaya` | Kavitha | L3 |
| `cottage` | Rumah Papan | `my:rumah_papan` (smaller stilt house, grey zinc) | residential | — | — (no resident in this world) | L3 |
| `park` | Taman Rekreasi | `my:taman` (rain trees, exercise bars; L2 shelter) | park | — | Aisyah | L4 |
| `showroom` | Car Showroom → **Galeri Seri Auto** | `prefab:showroom_glass` (glass gallery + 3-bay forecourt) | showroom | `my.auto.galeri_seri` | Farid | L4 |
| `grocery` | Kedai Runcit | `my:kedai_runcit` (wide butter-yellow shoplot, fruit crates) | retail | — | — | L5 |
| `townhouse` | Rumah Teres | `my:rumah_teres` (two storeys, car porch, balcony) | residential | — | Joanna | L6 |
| `town_hall` | Balai Raya | `my:balai_raya` (half walls, badminton lines, green zinc roof) | community | — | — | L7 |
| `request_board` | Papan Kenyataan | `my:papan_kenyataan` | — | — | — | start |
| `welcome_sign` | Kampung Gateway / Gerbang Kampung | `my:gerbang` ("Selamat Datang ke …" sign) | — | — | — | start |
| `pond` | Tasik Seri | `my:tasik` (lotus, jetty, sampan, reeds, frog) | — | — | — | start |
| `fountain` | Lakeside Pavilion / Pondok Tepi Tasik | `my:pondok` (built in stages) | — | — | — | community project, L3 |
| `spot_park` | Taman Poket | `spot:park` (5 stages, `src/rendering/kit/community.ts`) | — | — | — | shared spot, L2 |
| `spot_plaza` | Dataran Seri | `spot:plaza` (5 stages) | — | — | — | shared spot, L3 |
| `spot_playground` | Taman Permainan | `spot:playground` (5 stages) | — | — | — | shared spot, L5 |
| `spot_lookout` | Bukit Senja | `spot:lookout` (5 stages) | — | — | — | shared spot, L7 |

When a module is active, its name replaces the building name and its tagline replaces the description. Players therefore see "Kopitiam Lim", not "Coffee Shop". A module that fails checks or is switched off falls back to the template's neutral presentation (see *Worlds, world packs and modules* in GAME_DESIGN.md).

Decorations are renamed too: Rain Tree, Coconut Palm, Bougainvillea, Hibiscus Bush, Bamboo Fence, Herb Pots (lemongrass, pandan, chilli), Banana Plant, Water Jars (tempayan), Fruit Basket, River Stone, Letterbox, and others. The 12 expansion plots get kampung names such as Tepi Sawah, Dusun Durian, Simpang Tiga and Lorong Lampu.

**Starting layout** (55 placements): rumah kampung, Tasik Seri, pavilion site in a paved ring, Papan Kenyataan, gateway, two street lamps, a street-side path, a front flower garden (3 beds and a hibiscus bush), rain trees and coconut palms, banana plants, a bamboo fence, a bench by the lake, a river stone and tempayan. The four shared spots are not part of the world layout: the engine places them on shared land just past the starting area (`SPOT_PLACES` in `src/data/spots.ts`).

## 5. Tutorial and quest arc

21 world quests, plus 4 module quests. The first six are the guided tutorial (`tutorial: true`).

| # | Quest | Giver | Goal | Notes |
|---|---|---|---|---|
| 1 | Selamat Datang | Lim | Collect rent | Tutorial |
| 2 | Open the Shutters | Lim | Build the coffee shop | Tutorial |
| 3 | First Kopi | Lim | Brew and collect 3 Kopi | Tutorial |
| 4 | Our First Regular | Lim | Complete an order | Tutorial |
| 5 | Tables on the Five-Foot Way | Lim | Upgrade the kopitiam to L2 | Tutorial |
| 6 | Something Green | Lim | Build Kebun Komuniti (L2) | Tutorial; Zainab moves in |
| 7 | Fresh Roti | Lim | Build Mei's bakery | |
| 8 | Make It Ours | Zainab | Place 5 decorations | |
| 9 | The Overgrown Corner (`spruce_park`) | Zainab | Help clear Taman Poket: finish its first step (L2) | Points the player to the Together screen |
| 10 | A Park for Everyone (`park_done`) | Zainab | Finish Taman Poket (L2) | 40 XP, no coins |
| 11 | Good Neighbours | Mei | Complete 5 orders | |
| 12 | Tools of the Trade | Mei | Build Bengkel Kayu (L3) | |
| 13 | A Place for Questions | Zainab | Build Pusat Belajar (L3) | |
| 14 | Say It With Flowers | Zainab | Build Kedai Bunga (L3) | |
| 15 | Gotong-Royong (`pavilion`) | Zainab | Contribute to the pavilion project 3 times (L3) | |
| 16 | A Place to Gather | Zainab | Build Taman Rekreasi (L4) | |
| 17 | Beyond the Kampung | Arjun | Unlock a new plot (L4) | |
| 18 | A Shiny Window | Arjun | Build the showroom (L4) | |
| 19 | Market Day | Mei | Build Kedai Runcit (L5) | |
| 20 | Room With a View | Aisyah | Build a Rumah Teres (L6) | Joanna moves in |
| 21 | Heart of the Kampung | Aisyah | Build the Balai Raya (L7) | 300 coins, 5 gems |

Module quests unlock beside the world quests:

| Quest | Module | Giver | After | Goal |
|---|---|---|---|---|
| Pull It High | Kopitiam Lim | Lim | Tables on the Five-Foot Way (min L2) | Make 3 teh tarik by hand |
| Put Down Roots | Kebun Komuniti Seri | Zainab | Something Green | Plant 2 plots, harvest 1 |
| Curious Minds | Pusat Belajar Cahaya | Kavitha | A Place for Questions | 3 correct quiz answers |
| Open House | Galeri Seri Auto | Farid | A Shiny Window | Arrange 2 display bays |

Level unlock text for levels 1–10 is localised in the world file. For example, level 4 lists Taman Rekreasi, Car Showroom, New land and the Pesta Bunga Kampung.

## 6. Stories and world changes

18 story chapters across all 8 residents. Chapters set memories that change later dialogue, and some set world **flags** that the art kit reads.

| Chapter | Resident | Ask | Reward highlights | World change (flag) |
|---|---|---|---|---|
| A Cup for Everyone | Lim | 4 Kopi | coins, friendship | Chalkboard menu outside the kopitiam (`cafe_chalkboard`) |
| Breakfast Like Before | Lim | 2 Breakfast Sets | **Kopitiam Parasol** keepsake | Extra breakfast table on the five-foot way (`cafe_brunch`) |
| Thank You, Kampung | Lim | Kuih Kelapa + Jambangan | 5 gems, **Lantern Post** (*Tiang Lampu Taman*) keepsake | Lantern posts become available (no flag) |
| Version Twelve | Mei | 2 Kelapa | coins | Mei's kuih appears in the bakery (`bakery_pie_sign`) |
| Kuih Sale | Mei | 5 Roti + 3 Kopi (for the school library fund) | **Kuih Table** keepsake | — |
| First Shoots | Zainab | Harvest 6 Bunga Raya | coins | — |
| A Blooming Lane | Zainab | Place 3 flower beds | **Bird Bath** keepsake | Butterflies gather at flower beds (`butterflies`) |
| For Uncle Lim | Zainab | 2 Jambangan (needs Kedai Bunga) | 3 gems | — |
| Sawdust & Sunshine | Arjun | Produce 4 Papan | coins | — |
| Taman Opening | Aisyah | Jambangan + 3 Kopi | coins | Bunting across the taman (`park_bunting`) |
| Ten Good Questions | Kavitha | Answer 3 quiz questions (right or wrong) | coins | — |
| Colour Garden | Farid | Arrange the showroom 3 times | coins | — |
| Happy Birthday, Uncle Lim | Mei | 2 Kuih Kelapa + Jambangan | XP, friendship with **Lim** | — |
| Version Thirteen | Mei | 2 Kaya + 2 Kelapa | XP, 2 gems | — |
| The Great Escape | Zainab | 2 Roti | XP | — |
| New in the Kampung | Joanna | Chat with 4 neighbours (after Rumah Teres) | XP | — |
| Playground Dreams | Arjun | Help at Taman Permainan twice (L5) | XP | — |
| Picnic Planning | Aisyah | Finish Taman Poket | XP, 2 gems | — |

### New chapters (this release)

Six chapters add small, happy-ending stories. Each sets a memory; none changes the world art.

| Chapter (id) | Unlocks after | Story |
|---|---|---|
| Happy Birthday, Uncle Lim (`mei_3`) | Kuih Sale | Mei plans a surprise for Lim, who "keeps pretending he forgot" his birthday. He laughs so hard he nearly drops his cup, then makes everyone kopi. |
| Version Thirteen (`mei_4`) | Happy Birthday, Uncle Lim | Kaya with a gula melaka swirl. Lim says "no need to change perfection", then has four slices "for science". |
| The Great Escape (`zainab_4`) | For Uncle Lim | Biscuit the dog has escaped into Zainab's flower beds again and only comes out for roti. Found asleep under the hibiscus with a petal on her nose. |
| New in the Kampung (`joanna_1`) | Rumah Teres built | Joanna knows the light better than the people; the player introduces her around. Aisyah puts her on three committees. |
| Playground Dreams (`arjun_2`) | Sawdust & Sunshine, level 5 | The football kids want a playground; Arjun builds the slide himself. "They tested the slide forty-seven times." |
| Picnic Planning (`aisyah_2`) | Taman Opening | Aisyah's long list for the pocket park's opening picnic. "I didn't even need the clipboard. (I used it anyway.)" |

Note: the daily quiz limit is 3 at learning-centre level 1, so *Ten Good Questions* fits in one day.

Art note: `bakery_pie_sign` adds a cake prop to the bakery's display cabinet. It does not repaint the sign, although the chapter text says "The bakery sign now shows Mei's kuih".

## 7. Celebrations, shared spots and the community project

### Celebrations (rotating)

Kampung Seri's eight celebrations **take turns** (`src/game/engagement/events.ts`): when one ends and a day of rest has passed, the next one in the list that the kampung is ready for begins. A celebration is ready at its level and, if it names a shared spot, once that spot is finished (its `requires` flag). Joining in is optional, progress is counted from a baseline taken at the start, and tier rewards are kept. None is tied to a religious or political date.

| Celebration (EN / BM) | Core equivalent | From | Days | Needs | Goals |
|---|---|---|---|---|---|
| Kampung Flower Festival / Pesta Bunga Kampung | Flower Festival | L4 | 4 | — | Bunga Raya, flower beds, Jambangan, orders (below) |
| Street Food Day / Hari Makanan Jalanan | Street Food Day | L3 | 3 | — | Brew 10 Kopi, bake 8 Roti, serve 6 orders |
| Kampung Music Night / Malam Muzik Kampung | Music Night | L4 | 2 | — | Chat 5 times, place 2 street lamps, 4 orders (Arjun's guitar, Aisyah's kompang) |
| Garden Party at Taman Poket / Parti Taman di Taman Poket | Garden Party | L2 | 2 | Taman Poket finished | Grow 12 Bunga Raya, give 3 gifts, take a party photo |
| Pasar Malam at Dataran Seri / Pasar Malam Dataran Seri | Community Market | L3 | 3 | Dataran Seri finished | 8 orders, make 3 Kaya, help a shared spot 3 times |
| Pet Parade / Perarakan Haiwan Peliharaan | Pet Parade | L5 | 2 | Taman Permainan finished | Treat pets 3 times, 2 photos, cheer with 4 neighbours |
| Wayang Pacak Night / Malam Wayang Pacak | Outdoor Movie Night | L7 | 2 | Bukit Senja finished | Brew 6 Kopi, make 2 Kuih Kelapa, invite 5 neighbours |
| Kampung Seri Day / Hari Kampung Seri | Town Anniversary | L6 | 3 | — | 10 orders, help shared spots 5 times, give 4 gifts, upgrade a building |

Each has three or four reward tiers: mostly XP and a few gems; Street Food Day and the flower festival also give coins, and the flower festival gives two keepsakes. Residents gather to cheer when a celebration starts.

### Pesta Bunga Kampung (Kampung Flower Festival)

Organised by Aisyah and Mak Cik Zainab. First in the rotation; unlocks at level 4; runs 4 days.

| Objectives | Tiers (by objectives done) |
|---|---|
| Harvest 20 Bunga Raya | 1 · Petal Prize: 60 coins, 10 XP |
| Plant 4 Flower Beds | 2 · Lantern Post: 100 coins + Lantern Post keepsake |
| Tie 3 Jambangan | 3 · Gem Bouquet: 5 gems, 25 XP |
| Complete 8 Orders | 4 · Festival Arch: keepsake, 40 XP |

### Shared spots (community beautification)

Four places on shared land just past the starting area that the whole kampung improves together (`src/data/spots.ts`; art in `src/rendering/kit/community.ts`; the **Together** screen in the bottom nav, `src/ui/panels/SpotsPanel.tsx`). Each has **4 steps** and is drawn at **5 stages** (0 untouched with a "Coming soon!" sign → 1 cleared → 2 built/planted → 3 furnished → 4 finished and lively). Gifts can be partial; a repeated request (same op id) counts once.

Spots are a place to **give**: each step takes coins and goods and pays **XP and friendship with every resident, never coins** (the economy's main coin sink). Finishing a spot sets its flag, unlocks a keepsake and lets its celebration join the rotation. Quests *The Overgrown Corner* and *A Park for Everyone* introduce Taman Poket.

| Spot (BM name; core name) | From | Step needs (coins + goods) | XP per step | Friendship per step | Keepsake | Opens |
|---|---|---|---|---|---|---|
| **Taman Poket** — overgrown corner by the rain trees → pocket park with a picnic lawn (Pocket Park) | L2 | 60 · 100 + 6 Bunga Raya · 220 + 4 Papan · 350 + 4 Kopi + 4 Roti | 10 / 15 / 25 / 40 | 1 / 2 / 2 / 3 | Picnic Set | Garden Party at Taman Poket |
| **Dataran Seri** — empty square → the kampung's night-market square (Community Plaza) | L3 | 250 + 3 Papan · 450 + 6 Bata · 800 + 10 Bunga Raya + 2 Rattan Chair · 1,400 + 3 Jambangan + 4 Breakfast Set | 20 / 30 / 45 / 70 | 1 / 2 / 2 / 3 | Market Stall | Pasar Malam at Dataran Seri |
| **Taman Permainan** — bare lot → swings, slide, sandpit and climbing dome (Playground) | L5 | 700 + 8 Papan · 1,300 + 10 Bata · 2,400 + 3 Rattan Chair · 4,000 + 3 Kuih Kelapa + 2 Produce Basket | 40 / 55 / 75 / 110 | 1 / 2 / 2 / 3 | **Wau Post** / *Tiang Wau* (Kite Post) | Pet Parade |
| **Bukit Senja** — gentle rise with the best sunset view → timber deck with lanterns and a screen (Sunset Lookout) | L7 | 2,500 + 10 Papan · 4,500 + 12 Bata · 7,000 + 4 Rattan Chair + 16 Bunga Raya · 11,000 + 4 Jambangan + 6 Breakfast Set + 4 Kaya | 70 / 90 / 120 / 180 | 1 / 2 / 2 / 3 | Telescope | Wayang Pacak Night |

Step names (UI text, same in every world): park — clear the long grass, plant flower beds, benches/lamps/bird bath, opening picnic; plaza — lift the old paving, new tiles and a planter, market stalls and benches, string lights for the first market night; playground — level the ground and add a sandpit, slide and swings, seesaw/climbing dome/bench, balloons and bunting; lookout — clear a path, timber deck, benches/lamps/flowers, lanterns and a movie screen.

**Keep it lovely.** A finished spot offers an optional, repeating seasonal refresh. Its needs grow each season (coins: base × (1 + 0.5 × season), rounded to 50; goods: base × (1 + ⌊season ÷ 2⌋)); bases are Taman Poket 1,200 + 10 Bunga Raya + 6 Kopi, Dataran Seri 2,500 + 3 Jambangan + 3 Kaya, Taman Permainan 4,000 + 2 Rattan Chair + 2 Kuih Kelapa, Bukit Senja 6,000 + 3 Jambangan + 4 Breakfast Set. Each refresh gives 30 + 10 × season XP and +2 friendship with every resident, and rotates the spot's colour scheme (see ART_DIRECTION.md).

Residents relax in finished spots, help at spots in progress, and gather to cheer when a step is finished.

### Lakeside Pavilion / Pondok Tepi Tasik (community project)

This replaces the core world's fountain project in the same slot (`fountain`). The player contributes coins and goods; contributions are idempotent per op id.

| Requirement | Stage art (`pondok()` in `malaysia.ts`) |
|---|---|
| 300 coins, 5 Papan, 8 Bunga Raya, 6 Roti; unlocks at L3 | 0 · Staked site with a "Projek Pondok" sign |
| | 25% · Posts raised (with a plank pile) |
| | 50% · Floor and steps laid |
| | 75% · Pyramid zinc roof on |
| | 100% · Ready to rest: potted hibiscus and a lamp |

Reward: 150 coins, 5 gems, 40 XP and the **Kampung Marker Stone** keepsake. Completion sets `fountain_complete`, and the achievement is renamed **Gotong-Royong**. The project text says "Every contribution brings it a step closer". Today only the local player contributes; shared online contributions are **not built yet**.

## 8. Food culture notes

Only food that exists in the content files is shown. Core items are renamed by the world, and the kopitiam module adds its own items.

| Source | Item (EN / BM) | Description in game |
|---|---|---|
| World | Kopi | Strong, sweet, brewed through a cloth sock |
| World | Roti | A soft white loaf |
| World | Kelapa | A fresh coconut (replaces core "berries") |
| World | Sayur | Kangkung, long beans and chillies |
| World | Breakfast Set / Set Sarapan | Kopi and roti bakar |
| World | Kuih Kelapa | Mei's coconut kuih, "version twelve" (replaces core berry pie) |
| World | Kaya | Coconut jam, slow-stirred (replaces core jam) |
| World | Produce Basket / Bakul Sayur | A market basket |
| Kopitiam Lim | Kopi-O | Black coffee with sugar, kopitiam style |
| Kopitiam Lim | Teh Tarik | Milky tea "pulled" between two cups until it foams |
| Kopitiam Lim | Roti Bakar (needs Roti, kopitiam L2) | Charcoal-toasted bread with butter |
| Kopitiam Lim | Nasi Lemak (needs Kelapa, kopitiam L3) | Coconut rice with sambal, peanuts, egg and cucumber, wrapped in banana leaf |
| Kebun Seri | Pandan, Chillies, Lemongrass | Garden produce |

Safeguards:

- **The kopitiam menu is illustrative.** `realWorld.menu.source` is `"illustrative"`, and the menu lists Kopi-O, Teh Tarik, Roti Bakar with kaya & butter, Nasi Lemak and half-boiled eggs. **No prices** are shown. The install step strips prices unless they are partner-supplied and verified.
- **No halal claims.** `halal.status` is `"not_stated"`. The "About this place" card shows a halal line only for `certified` status with a certificate record. The MY country file records the rule: halal claims require a verified certificate (issuing body, reference, expiry).
- In-game values are coin values for play balance. They are not prices.
- The bakery display uses generic Kenney food props (cakes, cupcakes, donuts, cookies), not modelled kuih. This is an open art item (§11).

## 9. Environment

| Aspect | What's built | Where |
|---|---|---|
| Biome | `environment.biome: "tropical"` switches the ground palette, forests and decorations | `Terrain.tsx`, `archetypes.ts` |
| Ground | Lush grass (`#7ccb4c` / `#55a83a`), lighter locked land, sand-toned cobble paths, sea `#3cbfc4` | `Terrain.tsx` `ground()` |
| Island edge | **Laterite** red-earth strata (`#c0643c`, `#a9532f` …) under a green lip | `Terrain.tsx` `Island` |
| Wild land | Locked plots are forested with palms and broadleaf trees (no pines) | `Terrain.tsx` |
| Wildflowers | White, yellow, hibiscus red, pink | `Terrain.tsx` |
| Rain | `rainChance: 0.3`: each **6-minute** real-time spell rains with ~30% probability, at strength 0.55–1, fading in and out unless the next spell is also wet. The pattern is deterministic: every player sees the same weather at the same moment. | `src/game/world/weather.ts` |
| Rain visuals | Falling streaks (250/500/900 by graphics preset, halved in Zen), dimmer and greyer sun and sky; slower in Reduced motion. "Weather (rain showers)" can be switched off in Settings. | `src/rendering/effects/Rain.tsx`, `Lighting.tsx` |
| Sky and weather | `weatherAt()` adds cloud cover that builds around showers, a breeze (trees sway, rain slants), morning mist on about 2 mornings in 5, and bright post-rain sunshine with a soft rainbow. Weather never affects gameplay. | `src/game/world/weather.ts`, `Ambient.tsx`, `GameCanvas.tsx` |
| Time of day | Dawn 5:30, morning 7:30, noon, afternoon 16:30, **golden hour 18:00**, sunset 19:00, dusk 21:00, a soft readable night | `src/rendering/lighting/Lighting.tsx` |
| Soundscape | Rain noise follows intensity; tropical birds by day (koel-like calls, bulbul chirps); stronger cicada-like insects at dusk | `src/audio/AudioManager.ts` |
| Music and sounds | An original adaptive lo-fi soundtrack and synthesised sound effects (no recorded samples). See AUDIO_ASSET_MANIFEST.md. | `src/audio/music/`, `src/audio/sfx.ts` |

The core Maple Hollow world has `rainChance: 0` and keeps the temperate palette.

## 10. Localisation

- **Languages:** English (`en-MY`) and Bahasa Melayu (`ms-MY`). The country file lists both; `en-MY` is the default.
- **World text:** every player-facing string in the world JSON has both languages. Some names stay Malay in both (Rumah Kampung, Kebun Komuniti, Balai Raya, Kopi, Kaya), as a Malaysian English speaker would say them.
- **Modules:** Kopitiam Lim, Galeri Seri Auto and Kebun Komuniti Seri are fully bilingual. **Pusat Belajar Cahaya is English-only**: its name, tagline, quiz topic, all 16 questions and explanations, and its quest are plain strings. In Malay it currently shows English. It needs a Malay pass.
- **Signs:** the gateway sign always reads "Selamat Datang ke {neighbourhood}" and the hall sign "Balai Raya {neighbourhood}", in both languages.
- **Review:** **The Malay translations need native-speaker review before release.** This covers register (formal vs. friendly *awak*/*saya*), idioms (for example Zainab's "Tangan awak sejuk"), and consistency of item names between the world and the modules (e.g. "Pandan" vs "Daun Pandan").

## 11. Open items for a cultural review panel

The demo modules carry `approval.reviewedBy: "POCKETHOOD content review (demo)"`. This is a placeholder: **no external cultural review has happened yet.** Suggested agenda:

1. **Name clearance** for "Kampung Seri" and the business names (Kopitiam Lim, Galeri Seri Auto, Pusat Belajar Cahaya, Kebun Komuniti Seri).
2. **Dialogue particles:** "Thank you, ah" appears only on Uncle Lim, and "Wah" on Lim and Zainab. Should they be kept, removed, or used across the cast?
3. **Policy wording check (native reviewers):** confirm that the new everyday greetings and expressions ("Selamat pagi!", "Wah, cantiknya!", "Pondok Tepi Tasik", "Tiang Lampu Taman", "Lorong Lampu", "community dinners" / "makan malam bersama") read naturally, and that no remaining word, prop or symbol reads as religious or political, in either language. Examples to look at: the *kompang* in Music Night, the *wau* (Wau Post), "gotong-royong", the Balai Raya's two-tone pennant and the bunting colours.
4. **Character appearance:** residents use generic Kenney Mini Character bodies with no culturally specific clothing (e.g. no tudung, songkok or saree). Decide whether this neutrality is right, or whether respectful, optional attire is needed.
5. **Pets:** the shared pets include two dogs (Biscuit, a shiba who follows the baker; Pudding, a pug at the coffee shop) and a cat (Mochi at the player's house). Biscuit also stars in Zainab's chapter *The Great Escape*. Review placement and whether a cat-forward or player-chosen arrangement suits the setting better.
6. **Food art:** kuih and kopitiam food are drawn with generic Western bakery props, and there is no nasi lemak model. Commission or model local items.
7. **Keepsake reskins:** in the tropical biome, the Kuih Table, Festival Arch, Lantern Post, Bird Bath and Kopitiam Parasol still render with core-world art. The spot keepsakes (Picnic Set, Market Stall, Wau Post, Telescope) use one shared design; the Wau Post is a generic diamond kite, not a traditional wau shape.
8. **Quiz content:** fact-check all 16 questions (dates, figures such as Kinabalu ≈ 4,095 m and the Rajang ≈ 560 km) and add the Malay versions.
9. **Malay translation** review across world, modules and UI (§10).
10. **Representation beyond the peninsula:** Joanna (Sabah) is the only East Malaysian resident, and her Sabahan identity is limited to her bio. Consider Sarawak and other communities, and how they appear in future content.

## 12. Not built yet

- Shared or online contributions to the pavilion or the shared spots (today only the local player gives), and visiting friends live. Only read-only snapshot links exist (see GAME_DESIGN.md).
- Module `visitors` behaviour (parsed, nothing rendered), module `props` lists (validated but not placed), and module `presentation.greeting` (stored, not shown).
- Residents reacting to rain (sheltering under the five-foot way is dialogue flavour only).
- A Malay version of the learning-centre quiz.
- Worlds for SG, ID, TH, JP and KR. Their country files exist with `status: "planned"` and no worlds.

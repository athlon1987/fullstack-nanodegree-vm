# Art Direction

## The look in one line
**A hand-built miniature diorama of a cosy neighborhood**: chunky, softly-bevelled stylised 3D, viewed through an orthographic isometric camera, lit like a sunny model village.

## Why this style (and not another)
The style was chosen to be *achievable with assets we can legally obtain and extend*:

- The richest CC0 character set reachable from this environment is **Kenney Mini Characters** — chunky, big-headed, readable at small sizes, with 32 animation clips. Their proportions (≈2.5 heads tall) set the scale and "softness" of everything else.
- Kenney's **Car, Nature and Food kits** share the same flat-colour palette-texture approach, so they sit naturally beside the characters.
- No cozy residential/shop building pack was reachable (Kenney City Kit Commercial is modern grey blocks — evaluated and rejected; see ASSET_GAPS.md). Buildings are therefore authored as an **original parametric architecture kit** that matches the Kenney silhouette language: rounded boxes, chunky trim, exaggerated roofs.
- The kit has two regional families. The **core kit** (`src/rendering/kit/archetypes.ts`) is the temperate cottage village of Maple Hollow. The **Malaysian kit** (`src/rendering/kit/malaysia.ts`) draws Kampung Seri, the default world. A world pack picks the family per building through its `archetype` field. Both share the same parts, materials and scale.

## Shape language
- Rounded, bevelled volumes (`RoundedBoxGeometry`, 1–2 segment bevels) — nothing razor-sharp.
- Exaggerated, steep roofs (40–50°) with deep overhangs and a ridge cap; roofs carry the silhouette.
- Every building has: a stone plinth, corner trim boards, framed windows with sills (most with shutters or flower boxes), a door with a step and porch light, and at least one prop that tells you what happens inside (food in shop windows, logs at the workshop, a mailbox at home).
- Scale: 1 grid cell = 1 world unit. Residents are 0.62 units tall; a 2×2 house is ~2 units tall to the ridge. Characters are deliberately large relative to buildings (cozy-game convention) so they stay readable.

## Colour
Palette tokens live in `src/ui/tokens.ts` (mirrored in `src/ui/styles.css`) and are used by both 3D and UI.

| Role | Tokens |
|---|---|
| Sky & water | `skyTop #7ec8e3`, `skyBottom #d6f0ef`, `water #5bbfd1` |
| Ground | `grass #8fd16a`, `grassDark #6fb54f`, locked land `#b8c58f` |
| Walls | `cream`, `peach`, `butter`, `powder`, `mint`, `blush`, `barn` |
| Roofs | `terracotta #d9673f`, `coral`, `burgundy`, `slate`, `moss` |
| Wood & trim | `wood #b67b4c`, `woodDark`, `trim #fffaf0` |
| Accents | `gold #f2b632`, `amber`, `teal #2fa59b`, `berry`, `sky` |
| UI | `ivory #fffaf0`, `paper`, `ink #3d3226` |

Rules: walls are light and warm; roofs carry saturation; greens stay fresh but slightly desaturated so UI accents and interactive bubbles pop. Imported nature models are **palette-harmonised at import** (material colour overrides in `scripts/asset-pipeline/selection.mjs`).

The tables above are the core (temperate) palette. The tropical biome swaps the ground palette; see *Tropical biome* below.

## Materials & texture
- One shared `MeshStandardMaterial` per (colour, texture) pair; roughness ~0.8, no metalness except lamp iron and gold accents.
- Detail comes from small, **procedural greyscale textures tinted by material colour**: scalloped shingles, clapboard siding, plaster mottle, brick, planks, cobbles, striped awnings. One texture serves every colourway.
- Signs are painted at runtime onto canvas textures in the game font (Fredoka) with small vector glyphs (cup, bread, flower, hammer, basket, pie, star).

## Lighting
- One warm directional sun with soft PCF shadows (bias tuned to remove acne), a hemisphere sky/ground fill, and a small ambient term. ACES filmic tone mapping, exposure 1.05.
- A day/night cycle (24-minute visual day by default; "My clock" and "Always day" options) lerps sun colour/intensity, sky gradient and fill. Night is compressed so the world is bright most of the time.
- At dusk: window glass and lamp bulbs glow (shared emissive materials), warm additive light pools appear under lamps, fireflies drift.
- Cheap fake ambient occlusion: a soft radial contact-shadow blob under every building. No bloom, no SSAO — the default scene must look good without post-processing.
- **Rain** (tropical worlds) lerps the sun towards grey and dims it by up to 55%, and greys the sky gradient and hemisphere fill in proportion to rain intensity (`src/rendering/lighting/Lighting.tsx`).

## Atmosphere
Time of day and weather are **atmosphere only**: they never slow production, block actions or cost the player anything.

**Time-of-day keys** (`KEYS` in `src/rendering/lighting/Lighting.tsx`). Sun colour and intensity, sky gradient and hemisphere fill are interpolated between these keys:

| Key | Hour | Look |
|---|---|---|
| Night | 0:00 / 24:00 | Cool blue-violet, kept bright enough that the scene stays readable |
| Dawn | 5:30 | Lavender light, peach horizon |
| Morning | 7:30 | Warm apricot sun, pale blue sky |
| Noon | 12:00 | Brightest, near-white sun |
| Afternoon | 16:30 | Soft, warm daylight |
| Golden hour | 18:00 | Amber sun, peach horizon |
| Sunset | 19:00 | Orange sun, rose sky |
| Dusk | 21:00 | Deep blue; windows and lamps glowing |

**Weather states** come from the deterministic model `weatherAt()` in `src/game/world/weather.ts` (every player sees the same sky at the same moment; nothing is saved or synced). Each value is 0..1 and they blend:

| State | Visual | Where |
|---|---|---|
| Clear | Light, varying cloud cover over the far sea | `Ambient.tsx` `Clouds` |
| Clouds | Fuller, greyer clouds build before a shower and linger after it | `Ambient.tsx`, `Lighting.tsx` |
| Breeze | Trees sway more, clouds drift faster, rain slants | `Buildings.tsx`, `Ambient.tsx`, `Rain.tsx` |
| Light tropical rain | Falling streaks, greyer and dimmer sun and sky (tropical worlds only) | `Rain.tsx`, `Lighting.tsx` |
| Morning mist | A soft, light haze on about 2 mornings in 5, burning off by mid-morning; never dark, never hides anything | `Lighting.tsx` (fog) |
| Post-rain sunshine | Brighter, warmer sun and a soft rainbow overlay for a short while after a shower (daytime only) | `Lighting.tsx`, `GameCanvas.tsx` `Rainbow` |

The **Battery saver** setting caps rendering at 30 fps (`GameCanvas.tsx`).

## Life & motion
Trees sway gently (per-instance phase), chimneys puff, cars drive the main street, birds cross the sky, butterflies circle flower beds, residents walk their routines and stop to chat, and pets wander and react when tapped. The community landmark grows in visible stages: the fountain sprays once built in Maple Hollow, and the lakeside pavilion (*pondok*) gains posts, floor and roof in Kampung Seri. Shared spots change at every finished step (see *Shared spots*). Residents wave when they pass each other and show small emote bubbles (♥ ♪ ☺ ★ …), hidden in Zen Mode. Showroom cars turn slowly on their turntables. All of this honours the **Reduced motion** setting; rain also falls more slowly under it.

## Shared spots
Four places on shared land just past the starting area (`src/rendering/kit/community.ts`; data in `src/data/spots.ts`). Each is drawn at **5 stages**, one per finished step, so every contribution changes the place visibly:

| Stage | Look |
|---|---|
| 0 Untouched | Overgrown or bare ground with weeds, a log or crate, and a hopeful "Coming soon!" sign |
| 1 Cleared | Clean ground, a first path, paving or sandpit, materials waiting |
| 2 Built / planted | The main structure: flower beds and young trees, tiles and a central planter, slide and swings, a timber deck |
| 3 Furnished | Benches, lamps and the details: a bird bath, striped market stalls, a seesaw and climbing dome, flowers along the deck |
| 4 Finished and lively | Bunting, string lights, a picnic blanket, balloons, lanterns and a small outdoor-movie screen |

| Spot (core / Kampung Seri) | Footprint | Finished look | Keepsake |
|---|---|---|---|
| Pocket Park / Taman Poket | 3×3 | Lawn, flower patches, two trees, benches, bird bath, picnic | Picnic Set |
| Community Plaza / Dataran Seri | 3×3 | Cobbled square, planter tree, three striped market stalls | Market Stall |
| Playground / Taman Permainan | 3×2 | Safety surface, sandpit, slide, swings, seesaw, climbing dome | Kite Post (Wau Post) |
| Sunset Lookout / Bukit Senja | 3×2 | Timber deck with rail, benches, lamps, lanterns, movie screen | Telescope |

**Seasonal colour variants.** A finished spot can be refreshed each season ("Keep it lovely"). Every refresh rotates the colours of its bunting and flower patches through four palettes (`SEASONS`): the default flower colours, sunny yellows and oranges, cool blues and lilacs, and pinks with white. The structure stays the same. The keepsakes use the same art in both biomes.

## Malaysian kit (Kampung Seri)
An original, parametric kit in `src/rendering/kit/malaysia.ts`. It uses the same rounded parts, procedural textures (planks, plaster, zinc, tiles, cobbles, floor tiles, brick) and anchors as the core kit. Nothing in it depicts a real business, brand or building.

**Local palette** (`C` in `malaysia.ts`): timber `#8a5a37` / `#c08a57`, stilts `#6b4a30`, zinc red `#b5523b` / grey `#a3abb0` / green `#4f7d5a`, clay tile `#c4553e`, plaster `#f7ecd8`, shutter green `#2f7d6b`, marble `#f2efe8`, laterite `#c0643c`, leaf `#4f9a3f` / `#3c7f32`, bamboo `#c9b45a`, clay `#a65a35`. Shoplots use six pastel colourways (cream, mint, butter, blush, sky, lilac), each with a contrasting shutter colour.

| Archetype | What it is | Level / story detail |
|---|---|---|
| `my:rumah_kampung` | Timber house on **stilts** with stone footings, steep zinc gable facing the street, gable fretwork and crossed ridge boards, louvred windows, **serambi** verandah with railing and lean-to roof, stairs, red letterbox | L2 potted plants + tempayan; L3 bamboo lamp posts + timber deck |
| `my:rumah_papan` | Smaller, lower variant of the stilt house (blue-grey walls, grey zinc) | — |
| `my:rumah_teres` | Two-storey terrace: plaster, tiled hip roof, grille door, louvred windows, balcony, **car porch** | L2 hedges and pots |
| `my:shoplot` (and module prefab `kopitiam`) | Two-storey **shoplot**: arcaded **five-foot way** with floor tiles and columns, louvred upper windows, parapet with a raised centre, folding shutters, sign over the walkway; marble tables and a drinks counter with kettle | L2 tables spill onto the street; L3 striped awning + bulb string; `cafe_chalkboard` A-board; `cafe_brunch` extra table |
| `my:kedai_roti` | Blush shoplot with a glass display cabinet | L2 awning; L3 brick oven chimney; `bakery_pie_sign` adds a cake to the cabinet |
| `my:kedai_bunga` | Lilac shoplot with flower buckets | L2 flower cart |
| `my:kedai_runcit` | Wide butter-yellow shoplot, blue awning, fruit crates, hanging goods | L2 fruit stands |
| `my:bengkel` | Open-fronted timber **bengkel** with zinc roof, workbench, planks, rattan chairs in progress, logs | L2 timber stack; L3 rattan drying rack |
| `my:taman` | Park: two **rain trees**, a coconut palm, benches, outdoor exercise bars, flower ring | L2 pavilion-style shelter; `park_bunting` |
| `my:balai_raya` | **Balai raya**: raised floor, half walls, steep green zinc roof, entrance steps, badminton court lines, pole with a two-tone festival pennant (not a flag), sign "Balai Raya {neighbourhood}" | L2 clock + bunting |
| `my:pondok` | **Lakeside pavilion** (*pondok*) built in stages: staked site with a "Projek Pondok" sign → posts → floor & steps → pyramid zinc roof → finished with potted hibiscus and a lamp | Stage = community-project progress |
| `my:tasik` | **Tasik** with laterite-brown banks, lotus pads and blooms, reeds, a **jetty** and a moored **sampan**, a frog; a `fishing` anchor marks the spot | — |
| `my:gerbang` | **Kampung gateway**: two plaster pillars with tiled caps, "Selamat Datang ke {neighbourhood}" sign, hedge with red flowers | — |
| `my:papan_kenyataan` | Notice board with pastel notes under a small zinc gable | — |
| `my:showroom`, `my:pusat_belajar`, `my:kebun` | Base art for the showroom, learning centre and community garden; these take module palettes (below) | see *Module dressing* |

**Tropical planting and small decor.** In a tropical world, core decorations are redrawn by `tropicalDecoration()`:

| Core decoration | Tropical art |
|---|---|
| Round tree | **Rain tree** (wide, flattened canopy) |
| Pine tree | **Coconut palm** (Kenney palm model) |
| Maple tree | **Bougainvillea** on a timber frame, pink/magenta blooms |
| Hedge bush | **Hibiscus** bush with red flowers |
| Flower bed | Laterite-brick bed with orchid-coloured flowers |
| Picket fence | **Bamboo fence** |
| Planter box | Three clay pots: lemongrass, pandan, chilli |
| Toadstool | **Banana plant** |
| Barrels | **Tempayan** (clay water jars) |
| Produce crate | Fruit crate with bananas and watermelon |
| Founder statue | **Marker stone** with a brass plaque (no figurative statue) |
| Street lamp | Core lamp post |

Bench, rock, path, mailbox and the keepsakes (parasol, bird bath, pie stand, festival arch, lantern post) still use core art in the tropical world. Tropical versions are **not built yet**.

## Tropical biome
A world's `environment.biome` (`"temperate"` or `"tropical"`) selects the ground palette in `src/rendering/scene/Terrain.tsx`:

| Element | Temperate (core) | Tropical |
|---|---|---|
| Grass / dark grass | `P.grass` / `P.grassDark` | `#7ccb4c` / `#55a83a` (lusher) |
| Locked land | `P.grassLocked` | `#a8bf78` |
| Island edge strata | Brown soil bands | **Laterite** reds and oranges (`#c0643c`, `#a9532f`, `#c8724a`, `#8f4426` …) |
| Sea | `P.water` | `#3cbfc4` (brighter turquoise) |
| Paths | Stone | Sand `#dcb894` over the cobble texture |
| Wildflowers | White, yellow, pink, lilac | White, yellow, hibiscus red, pink |
| Locked-plot forest | Pines and dark broadleaf | Palms and broadleaf |

**Rain** (`src/rendering/effects/Rain.tsx`) draws thin pale streaks (250 / 500 / 900 by graphics preset, halved in Zen Mode) and fades with intensity from the deterministic weather model (`src/game/world/weather.ts`, ~30% of 6-minute spells in Kampung Seri). It can be switched off in Settings.

## Module dressing: prefabs, palettes and signs
Modules (sponsored, partner or community content) **cannot ship geometry, textures or code**. They choose from reviewed vocabularies in `src/platform/content/catalog.ts`. Each module template allows only some prefabs (`src/platform/content/templates.ts`):

| Template | Approved prefabs |
|---|---|
| cafe | kopitiam, shoplot, cafe_cottage, hawker_stall |
| restaurant | shoplot, hawker_stall, kopitiam |
| retail | shoplot |
| learning | learning_house, shoplot |
| showroom | showroom_glass |
| farm | community_garden |
| hotel (template only) | shoplot |
| park, community, residential | none |

What a module may supply:

- **Prefab:** one of `PREFABS` that its template approves. A mismatch quarantines the module.
- **Palette:** three hex colours (`primary`, `secondary`, `accent`). Prefabs apply them to fixed roles:

| Prefab | primary | secondary | accent |
|---|---|---|---|
| kopitiam (also shoplot, hawker_stall, cafe_cottage) | Shutters, sign text and frame, L3 awning | Facade plaster, sign background | — |
| showroom_glass | Mullions, sofa, fascia band, sign background, L2 pennant and bunting | Back wall, turntables | Turntable rings, pennant, bunting |
| learning_house | Window frames, door, sign text and frame | Walls | Bicycle, pennant |
| community_garden | Sign text | Sign background | — |

- **Sign text:** up to 22 characters. It is painted at runtime onto the prefab's sign board in the game font.
- **Props:** up to 6 names from `PROPS` (marble_table, round_stool, menu_stand, potted_plant, bicycle, banner, bookshelf, flag, trellis, water_tank, tyre_stack, lantern). They are validated but **not yet placed**; prefabs currently use their own fixed dressing.
- **Icons** for module items and plants come from `ICONS` (drawn by `src/ui/components/Icon.tsx`). They include local goods such as teh, kopi, nasi_lemak, roti_bakar, kelapa, kaya, kuih, hibiscus, herbs, chili and sapling.
- **Vehicles** for showrooms come from `VEHICLE_MODELS` (unbranded Kenney Car Kit: sedan, SUV, hatchback, van, taxi, delivery van, truck). **Characters** come from `CHARACTER_MODELS` (Kenney Mini Characters).

`hawker_stall` and `cafe_cottage` are approved names, but they currently render with the kopitiam shoplot geometry; distinct models are **not built yet**. A building whose content is temporarily unavailable is shown behind plywood **hoarding** with a sign (`dormant()`).

Current demo palettes:

| Module | Prefab | primary / secondary / accent | Sign |
|---|---|---|---|
| Kopitiam Lim | kopitiam | `#2f7d6b` / `#f3e6c8` / `#d9673f` | Kopitiam Lim |
| Galeri Seri Auto | showroom_glass | `#2f6fb3` / `#eef3f7` / `#e9b23c` | Galeri Seri Auto |
| Pusat Belajar Cahaya | learning_house | `#8a6fd1` / `#fbf3e4` / `#f6c343` | Pusat Cahaya |
| Kebun Komuniti Seri | community_garden | `#4f9a52` / `#f3e6c8` / `#e05a3a` | Kebun Seri |

## Live overlays (showroom cars, garden crops)
Some buildings show the player's own choices. Prefabs bake named **anchors** (`anchor:bay0..2`, `anchor:plot0..3`). `src/rendering/scene/BehaviorOverlay.tsx` draws live objects at those anchors, inside the building's rotated frame:

- **Showroom cars:** one car per unlocked bay (2 at showroom level 1, 3 at level 2). The model and paint are the ones the player picked. Paint is tinted 35% towards white so tyres and glass keep their own colour. Cars cast shadows and sway gently on their turntables, unless Reduced motion is on.
- **Garden crops:** each planted plot shows three plants. They grow through four stages computed from planting time and watering: a soil mound, a small sprout (45% scale), a growing plant (75%), then a full-size plant with coloured fruit when ready to harvest. Saplings and herbs are drawn tall and leafy; other crops are round bushes. The fruit colour comes from the module's plant `color`. Stages refresh every 4 seconds.

## No flags, no symbols
Art follows CONTENT_POLICY.md as strictly as text:

- **No flags of any kind.** Where a pole needs something on top, it carries a small two-tone triangular festival **pennant** (`flagPole()` in `malaysia.ts` now draws a pennant; the Balai Raya, showroom and learning centre use it). Bunting is fine.
- **No religious buildings or symbols**, and no props that read as religious (e.g. festival lamps tied to one faith).
- **No campaign colours, party symbols or slogans** on signs, bunting, pennants or palettes. Module palettes are reviewed with this in mind.
- `flag` is still an approved module prop *name* in `PROPS`, but props are not placed today; if props are ever placed, it must render as a pennant.

## UI
Warm ivory panels, chunky rounded buttons with a pressed-down state, a 3-px white outline and soft warm shadows. Display type: **Fredoka**; body: **Nunito** (both bundled locally via Fontsource — OFL). Icons are an original "sticker" family (`src/ui/components/Icon.tsx`): filled shapes, warm ink outline, soft highlight. Catalog cards and dialogue portraits are **real renders of the game's own models**, not separate illustrations.

## Do / Don't
- ✔ Add props that explain function. ✔ Keep silhouettes readable at the farthest zoom. ✔ Harmonise any new asset to the palette before use.
- ✘ Don't mix in realistic or thin-limbed character styles. ✘ Don't ship a building that is an undecorated box. ✘ Don't rely on colour alone for state (bubbles carry icons; placement shows text).
- ✔ Draw regional architecture from everyday buildings (shoplots, stilt houses, a balai raya), not from monuments or religious buildings. ✔ Keep businesses fictional and signs free of real logos.
- ✘ Don't add figurative statues of people to regional kits (Kampung Seri uses a marker stone). ✘ Don't let module palettes or signs bypass review: new prefabs, props or icons are code changes.

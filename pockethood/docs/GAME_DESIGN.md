# POCKETHOOD — Game Design

> *Build your little world. Watch it come alive.*

A cozy social neighborhood-building game. You start with one little house on a diorama island, help your first neighbor open her dream café, and grow a street of shops, gardens and friends whose stories change the world around them.

**Audience:** 13–45, broad and international. Accessible in five minutes, meaningful over months. **Pillars:** ownership, creativity, progression, discovery, social connection, character attachment, satisfaction. **Anti-pillars:** punishing breaks, artificial scarcity, pay-to-progress.

## Core loop
`COLLECT → PRODUCE → BUILD → UPGRADE → UNLOCK → CONNECT → REPEAT`

| Verb | What the player does | Feedback |
|---|---|---|
| Collect | Tap a building's bubble | Coin/item fly-up to the HUD, counter bump, sound, XP |
| Produce | Queue recipes in shops (2–4 slots) | In-world progress bubble; finished items wait — offline too |
| Build | Pick from the catalog, drag the ghost, confirm | Green/red footprint + text, construction scaffold, settle-bounce, "open!" toast |
| Upgrade | Spend coins + materials | New recipes/slots/speed and a **visible** change (terrace, awning lights, greenhouse, clock tower…) |
| Deliver | Fulfil requests on the Request Board | Coins, XP, friendship, a thank-you line |
| Connect | Chat, gift, help with stories | Hearts, memories, world changes, keepsakes |

## World
- 24×24 cell island = 16 plots of 6×6. The central 4 plots (12×12) start owned; the main street runs along z = 18–19.
- Starting scene (handcrafted, `newGame.ts`): Starter House, lily pond with frog and reeds, fountain-project site in a cobbled plaza, request board, welcome sign, lamps, a front flower garden, trees, hedges, fences, a bench, rocks, mushrooms. An empty lot next to the house invites the café.
- Locked plots are wooded with "FOR SALE" signs once affordable; buying one clears the trees.

## Buildings (12 functional + landmarks)
| Building | Unlock | Role | Levels |
|---|---|---|---|
| Starter House | start | Rent | 3 (porch → dormer & lanterns) |
| Mia's Café | 1 | Coffee, Breakfast Set | 3 (terrace & parasols → teal awning & string lights) |
| Community Garden | 2 | Flowers, Berries, Vegetables | 3 (greenhouse → sunflowers & scarecrow) |
| Bakery | 2 | Bread, Berry Pie | 3 (pastry cart → brick oven) |
| Workshop | 3 | Planks, Bricks, Furniture | 3 (timber yard → crane) |
| Flower Shop | 3 | Bouquet, Flower Crown | 2 (flower cart) |
| Cottage | 3 | Rent; Noah moves in | 2 (picket-fence garden) |
| Pocket Park | 4 | Tips, residents relax; Ruby moves in | 2 (gazebo) |
| Grocery Shop | 5 | Veggie Basket, Jam, shop income | 2 (fruit stands) |
| Townhouse | 6 | Rent; Zara moves in | 2 (balcony & roof planters) |
| Town Hall | 7 | +1 order slot, civic income | 2 (taller clock tower & bunting) |
| Fountain | community project | Landmark, 4 visible build stages | — |

Plus 15 catalog decorations and 6 earnable keepsakes.

## Residents
Mia (café owner), Felix (baker), Luna (florist), Oliver (builder), Noah (delivery rider), Ruby (event organiser), Theo (architect), Zara (photographer). Each has traits, favourites, an arrival rule, a workplace behaviour, phase-aware greetings, friendship-gated small talk, memory lines and gift reactions. Ten story chapters (Mia ×3, Felix ×2, Luna ×3, Oliver ×1, Ruby ×1) change the world when completed.

## Progression
- **Levels:** 10 designed levels of unlocks (30 total). XP from building, upgrading, production, orders, quests, stories.
- **Quests:** 18 main quests; the first six are the guided tutorial.
- **Pulse:** three daily goals (see ENGAGEMENT_FLYWHEEL.md).
- **Achievements:** 12. **Event:** Spring Blossom Festival. **Expansion:** 12 plots.

## Tutorial (first 3–5 minutes)
1. Mia introduces herself → **collect rent** (the coin bubble is ringed, a hand points at it).
2. Open **Build** → pick **Mia's Café** → drag & confirm (spot pre-suggested) → construction (5 s).
3. Tap the café → **Make coffee** ×3 → collect.
4. Open **Orders** → **Deliver** Mia's first request. *(Level 2 happens around here.)*
5. **Upgrade the café** → the terrace with parasols appears; Mia remembers it.
6. Build the **Community Garden** → Luna moves in. Free play begins; the Pulse appears.

Every step is ringed in the UI or marked with a bouncing arrow over the right building, the camera focuses on it, and the coach card explains *why*. Hints wait for real completion, and can be hidden, skipped, or replayed from Settings.

## Economy
See ECONOMY_DESIGN.md. Currencies: **coins** (soft), **gems** (premium-reserved; earnable from achievements, Pulse bonus, stories, the fountain; spent only on optional timer skips), **XP**, **materials** (planks, bricks).

## Monetisation (architecture only — nothing is sold)
Cosmetic building skins, decoration collections, outfits, pets, seasonal passes, optional rewarded ads, convenience. Never: unavoidable ads, paywalled solo progress, manipulative scarcity. Purchases would be server-validated with age-appropriate safeguards.

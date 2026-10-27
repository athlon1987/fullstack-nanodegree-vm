# Seri Bayu — Modern Klang Valley World Design

**Status:** playable, the **default world for Malaysia** (English and Bahasa Melayu). Kampung Seri remains available as an optional cultural world, and Maple Hollow as the neutral classic world (Settings → World).

## 1. Premise

A cheerful, polished, contemporary neighbourhood in a fictional Klang Valley township. You start in a terrace house beside an elevated LRT line, and grow the street into shoplots, a mamak corner, a dessert café, a co-working hub, condominiums, a lake park and a fountain plaza. The city around you (a mall, a primary school, a row of shoplots with a family clinic, a petrol and EV station, the skyline across the lake and a highway flyover) is already there and alive.

The mood is the same as every POCKETHOOD world: peace, kindness and neighbourliness, with no religion, no politics and no conflict (CONTENT_POLICY.md). The aim is a calm, happy break: bright and welcoming, never stressful. It makes no health claims.

**Name check.** "Seri Bayu" ("graceful breeze") is invented for the game. It is not modelled on a real township, and every business, school and landmark in it is fictional. The skyline's tallest tower is an invented spire design, not a real building. Before launch, a trademark and place-name search is still needed, just as for Kampung Seri.

## 2. What changed from Kampung Seri

| | Kampung Seri (optional cultural world) | Seri Bayu (default) |
|---|---|---|
| Homes | Kampung houses on stilts, timber houses | Terrace house with car porch and gate, semi-D, 9-storey condominium (rooftop pool at level 2) |
| Shops | Old shoplots, timber stalls | Modern shoplots: glass fronts, bright awnings over the five-foot way, sign bands, timber fins; dessert café, florist, 24/7 mini mart, mamak corner, EV showroom, co-working hub, makerspace (sawtooth roof), tuition centre |
| Civic | Balai raya, pavilion | Community centre with a floating roof, notice board, guard-house gateway, fountain plaza |
| Streets | Village road, laterite earth | Dual carriageway under an elevated LRT with station and covered walkway; ring road with LED street lamps, palms and rain trees; paving, kerbs and parking bays |
| Ground | Lush grass on red earth | Manicured lawns on a stone podium; tidy hoarded lots instead of overgrown patches |
| Water | Kampung lake | Teal lake with a boardwalk; skyline and flyover across the water |
| Lighting | ACES tone mapping | Neutral tone mapping (true, saturated paint and signage), a soft studio environment map for glass and metal, a clearer, bluer sky |

The rules, economy, tutorial, quest order, rewards and timers are **identical** to Kampung Seri (`src/platform/urban.test.ts` checks this). That keeps first-session pacing proven: the pacing model passes in all three worlds.

## 3. Residents

The same eight neighbours, rewritten for city life, plus Shah, who runs the mamak corner (he arrives once it is built). Uncle Lim still runs the kopitiam, now on a shoplot corner by the station. Mei bakes for the dessert café. Mak Cik Zainab is a retired teacher who gardens. Joanna's intro foreshadows her moving into the condominium at level 6.

## 4. Places

| Building | Archetype | Notes |
|---|---|---|
| Terrace House (starter) | `kl:terrace` | Car porch, sliding gate, hip roof; solar panels at level 3 |
| Semi-D Home | `kl:semid` | Gable roof, timber screen, garden |
| Condominium | `kl:condo` | 9 floors, balconies; rooftop pool at level 2 |
| Corner Kopitiam | `kl:shoplot_cafe` | Marble tables; the Kopitiam Lim demo module dresses this slot |
| Dessert Café & Bakery, Florist | `kl:dessert`, `kl:florist` | Pastel shoplots |
| Mamak Corner (new) | `kl:mamak` | Open-front restaurant with plastic tables; roti canai (L1) and nasi lemak (L2). Uses the `restaurant` template, so a partner restaurant module can slot in |
| Co-working Hub (new) | `kl:coworking` | Passive income building; rooftop pergola at level 2. Uses the `retail` template |
| 24/7 Mini Mart, Makerspace, EV Showroom, Learning Centre | `kl:minimart`, `kl:makerspace`, `kl:ev_showroom`, `kl:learning` | |
| Neighbourhood Park | `kl:park` | Red jogging track, exercise bars; pavilion at level 2 |
| Community Centre, Community Board, Gateway | `kl:community_centre`, `kl:notice`, `kl:gateway` | |
| Tasik Seri Bayu, Fountain Plaza | `kl:lake`, `kl:fountain` | The fountain is the community project (hoarding → basin → water feature → fountain on) |
| Mall, Primary School, Jalan Bayu Shoplots (family clinic, convenience store, café), Fuel & EV Station | `kl:mall`, `kl:school`, `kl:clinic_row`, `kl:petrol` | **Fixed landmarks** placed by the world; scenery, not built by the player. Hidden in other worlds |
| Shared spots | `spot:*` | Pocket Park, Bayu Plaza, Playground, Skyline Deck. In the city, an untouched spot is a vacant lot behind painted hoarding; it transforms in four steps as before |

The four demo modules (kopitiam, showroom, learning centre, community garden) dress their slots here too, using the urban prefabs (`urbanPrefab`): their palettes and signs, on modern shoplot shapes.

## 5. Cityscape (`src/rendering/scene/City.tsx`)

- **LRT:** an elevated viaduct over the main road, with pillars, a teal stripe and a station (glass box, curved roof, stairs to the pavement). Two three-car trains run each way. There is also a covered walkway along the kerb and a planted median.
- **Ring road:** asphalt, lane markings, inner and outer pavements, LED lamps with warm light pools at night, palms and rain trees, and cars circling.
- **Skyline:** fictional towers across the lake, with window bands that light up at night, a spire tower, and a curved highway flyover with traffic.
- **Cost:** shared materials, merged geometry and one baked group for street props. The moving parts are 2 trains and about 12 cars.

## 6. Businesses in the world

Seri Bayu has natural homes for partner businesses: shoplot units, the mamak corner, the dessert café, the mini mart, the EV showroom, the co-working hub and the mall. A business can appear with its palette, sign, menu items or products, and a small hands-on activity, through a reviewed, data-only module on an existing template (SPONSOR_PLATFORM.md). Businesses are guests: no scripts, no audio, no pop-ups, and no claims (halal, prices, offers) without verification. Unlicensed real brands are never shown. The mall and shoplot landmarks carry fictional names until a real, contracted partner module replaces them.

## 7. Localisation

Every player-facing string is in English and Bahasa Melayu (tested). The Malay text has not yet been reviewed by native speakers. That review, and a cultural read of the city setting, are on the roadmap.

## 8. Not built yet / honest limits

- Kampung houses are no longer the main environment. Kampung Seri is kept, complete, as the optional cultural world.
- The LRT, mall, school and clinic are scenery: you can't ride or enter them yet.
- Residents don't use the LRT, and cars don't stop at junctions.
- There is no real-device performance measurement. On the starting scene the city costs ~505 draw calls and ~181k triangles (Kampung Seri: ~410 and ~113k), about 5 % over the desktop draw-call target. Real low-end Android testing is still needed (PERFORMANCE_BUDGET.md).
- Icon gaps: mango uses the berries icon, the orchid arrangement uses the garland icon, and mango cake uses the pie icon.

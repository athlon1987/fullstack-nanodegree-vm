# Asset Gaps

What the game would ideally use but doesn't have yet, what stands in for it, and the path to close each gap.

| Gap | Current stand-in | Quality today | Path to close |
|---|---|---|---|
| **Cozy residential & shop buildings from a professional pack** | Original parametric architecture kit (`src/rendering/kit/`) dressed with Kenney props | Good: textured roofs/walls, windows, doors, awnings, signage, per-level variations. Less hand-modelled detail than a premium pack. | Option A (free): import Kenney City Kit Suburban and Quaternius building packs once downloadable — place them in `asset-import/` and map archetypes to models. Option B (paid): Synty POLYGON Town Pack for a fully unified premium look (requires purchase and a style re-harmonisation pass). |
| Kenney City Kit Commercial buildings | Evaluated and **rejected**: modern grey high-rises clash with the cozy direction | — | Could be recoloured for a future "Downtown" district. |
| Road kit | In-house asphalt strip, curbs, lane dashes, crosswalk | Clean and readable | Kenney City Kit (Roads) for junctions & curves once roads become player-placeable. |
| Talking / waving humanoid clips | Kenney minis' `emote-yes` (talk/happy), `interact-right` (wave/work), `jump` (celebrate), `pick-up`, `crouch`, `sit` | Readable but not bespoke | Quaternius Universal Animation Library or Mixamo (retarget onto the Kenney humanoid rig; untested). |
| Rabbit, duck, bird pets | Cat, shiba, pug only | Good | Quaternius Ultimate Animated Animal Pack. |
| Pug walk cycle | Pug rests and hops (Idle/Jump only) | Acceptable — it's a lazy café dog | Another pug model or a custom walk. |
| Player customisation (hair, outfits, accessories) | Choice of 4 complete character variants | Honest but limited | Modular character pack (e.g. Quaternius Universal Base Characters) — only offer what real meshes support. |
| Interiors | None (residents enter buildings and disappear at night) | — | Quaternius Ultimate House Interior Pack for a future "peek inside" mode. |
| Seasonal decoration variants | Festival arch, lantern post | Small set | Seasonal recolour pass + new props. |
| Hand-painted key art / store screenshots | Loading-screen SVG illustration, in-game photo mode | Fine for prototype | Commission marketing art once the visual identity is locked. |
| Music | Original procedural WebAudio loop + birdsong | Pleasant, simple | Commission or license a cozy soundtrack (2–3 tracks + seasonal variants). |

## Why some gaps exist
This build environment's network policy blocks the asset hosts (kenney.nl, quaternius.com, poly.pizza, itch.io, sketchfab, fab, mixamo). The only reachable source of professional CC0 models was an npm redistribution (see ASSET_MANIFEST.md). Paid packs were not purchased. Nothing was downloaded by bypassing authentication or payment.

## Drop-in import path
`asset-import/` is git-ignored and reserved for manually acquired packs. To add a pack:
1. Unzip it into `asset-import/<pack-name>/` and keep its `License.txt`.
2. Add entries to `scripts/asset-pipeline/selection.mjs` (category + palette overrides).
3. Extend the import script's source map (currently `import-netforge.mjs`) to read that folder; run `npm run assets:import`, `npm run assets:validate`, `npm run assets:manifest`.
4. Map archetypes or decorations to the new model names in `src/rendering/kit/archetypes.ts` and check them in the asset viewer (`/viewer.html?base=assets/models/<category>/&m=name1,name2`).

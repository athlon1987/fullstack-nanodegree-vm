# Art Direction

## The look in one line
**A hand-built miniature diorama of a cosy neighborhood**: chunky, softly-bevelled stylised 3D, viewed through an orthographic isometric camera, lit like a sunny model village.

## Why this style (and not another)
The style was chosen to be *achievable with assets we can legally obtain and extend*:

- The richest CC0 character set reachable from this environment is **Kenney Mini Characters** — chunky, big-headed, readable at small sizes, with 32 animation clips. Their proportions (≈2.5 heads tall) set the scale and "softness" of everything else.
- Kenney's **Car, Nature and Food kits** share the same flat-colour palette-texture approach, so they sit naturally beside the characters.
- No cozy residential/shop building pack was reachable (Kenney City Kit Commercial is modern grey blocks — evaluated and rejected; see ASSET_GAPS.md). Buildings are therefore authored as an **original parametric architecture kit** that matches the Kenney silhouette language: rounded boxes, chunky trim, exaggerated roofs.

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

## Materials & texture
- One shared `MeshStandardMaterial` per (colour, texture) pair; roughness ~0.8, no metalness except lamp iron and gold accents.
- Detail comes from small, **procedural greyscale textures tinted by material colour**: scalloped shingles, clapboard siding, plaster mottle, brick, planks, cobbles, striped awnings. One texture serves every colourway.
- Signs are painted at runtime onto canvas textures in the game font (Fredoka) with small vector glyphs (cup, bread, flower, hammer, basket, pie, star).

## Lighting
- One warm directional sun with soft PCF shadows (bias tuned to remove acne), a hemisphere sky/ground fill, and a small ambient term. ACES filmic tone mapping, exposure 1.05.
- A day/night cycle (24-minute visual day by default; "My clock" and "Always day" options) lerps sun colour/intensity, sky gradient and fill. Night is compressed so the world is bright most of the time.
- At dusk: window glass and lamp bulbs glow (shared emissive materials), warm additive light pools appear under lamps, fireflies drift.
- Cheap fake ambient occlusion: a soft radial contact-shadow blob under every building. No bloom, no SSAO — the default scene must look good without post-processing.

## Life & motion
Trees sway gently (per-instance phase), chimneys puff, cars drive the main street, birds cross the sky, butterflies circle flower beds, the fountain sprays once built, residents walk their routines and stop to chat, pets wander and react when tapped. All honour the **Reduced motion** setting.

## UI
Warm ivory panels, chunky rounded buttons with a pressed-down state, a 3-px white outline and soft warm shadows. Display type: **Fredoka**; body: **Nunito** (both bundled locally via Fontsource — OFL). Icons are an original "sticker" family (`src/ui/components/Icon.tsx`): filled shapes, warm ink outline, soft highlight. Catalog cards and dialogue portraits are **real renders of the game's own models**, not separate illustrations.

## Do / Don't
- ✔ Add props that explain function. ✔ Keep silhouettes readable at the farthest zoom. ✔ Harmonise any new asset to the palette before use.
- ✘ Don't mix in realistic or thin-limbed character styles. ✘ Don't ship a building that is an undecorated box. ✘ Don't rely on colour alone for state (bubbles carry icons; placement shows text).

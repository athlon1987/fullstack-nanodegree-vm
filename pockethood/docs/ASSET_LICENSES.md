# Asset Licenses

Every third-party asset shipped in this repository, its licence, and the evidence kept.

| Source | What we use | Licence | Evidence in repo | Attribution required? |
|---|---|---|---|---|
| **Kenney** (kenney.nl) — Mini Characters 1.0, Nature Kit, Food Kit, Car Kit, City Kit (Commercial) 2.1*; Interface/Impact/Digital Audio SFX | 12 characters, nature props, food props, 9 vehicles, 8 sound effects | **CC0 1.0** (public domain dedication) | `asset-sources/netforge/NOTICE`, `asset-sources/netforge/CC0-1.0.txt` | No (credited anyway) |
| **Quaternius** (quaternius.com, via poly.pizza uploads by Quaternius) | Cat, pug, shiba, fox, frog (animated) | **CC0 1.0** | `asset-sources/netforge/manifest-lowpoly.json` (per-model Poly Pizza page), `NOTICE` | No (credited anyway) |
| **@netforge/asset-library-files 0.2.0** (npm) | The redistribution these files were obtained from (optimised copies, sha256 index) | Package: MIT; art: CC0 1.0 | `asset-sources/netforge/LICENSE`, `index.json` | MIT notice retained |
| **Fredoka** (Fontsource `@fontsource-variable/fredoka`) | UI display font, sign lettering | SIL Open Font License 1.1 | `node_modules/@fontsource-variable/fredoka/LICENSE` | OFL terms (no selling the font alone) |
| **Nunito** (Fontsource `@fontsource-variable/nunito`) | UI body font | SIL Open Font License 1.1 | `node_modules/@fontsource-variable/nunito/LICENSE` | OFL terms |
| three.js, React Three Fiber, drei, React, zustand, idb-keyval | Engine & app code | MIT | `node_modules/*/LICENSE` | Keep notices |

\* City Kit Commercial models were evaluated but are not used in the shipped scene.

## Project-owned (original) assets
The POCKETHOOD architecture kit (core and the Malaysian kit in `src/rendering/kit/malaysia.ts`), procedural textures (including zinc, clay tile, louvre and floor-tile maps), the icon family (including the kampung goods, Zen and sharing icons), logo, app icons (`public/icons/`, rendered from `icon.svg` by `scripts/pwa/make-icons.mjs`), loading illustration, favicon, the procedural soundtrack and soundscape, all writing (dialogue, quests, stories, quiz questions, module texts — English and Bahasa Melayu) and code are original work for this project.

## Content modules
The four demo modules (`content/modules/*.json`) are **fictional** businesses and places written for this game; any resemblance to real businesses is unintended. Each module declares its own `licensing` block (content: original; assets: the original architecture kit and CC0 Kenney characters). Real partner modules must carry a `brand.licence` record and are refused once it expires.

## Rules
1. No asset enters `public/` without passing `npm run assets:import` (sha256 provenance check) and `npm run assets:validate`.
2. Original source files stay untouched in `asset-sources/` alongside their licence files.
3. Paid or account-gated assets (Synty, Mixamo, Fab, CGTrader) are never committed unless the licence permits redistribution in a source repo — most don't; use a private asset store instead.
4. "Free to download" ≠ "free to use commercially": record the licence page and verification date in ASSET_MANIFEST.md before integrating.

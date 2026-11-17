# Hand-off: terminal map, wayfinding and facilities directory

Owner: map. Status (17 Nov 2026): `npx tsc --noEmit` clean for my files, `npx eslint` on my paths clean,
`npx vitest run src/components/map` 17 of 17, `e2e/map.spec.ts` 12 of 12 on desktop and phone against the
dev server (24 of 24 with `--repeat-each=2`), axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) zero violations on
`/en/kul/map` (with a route drawn), `/en/pen/map` and `/en/kul/facilities` (filtered). No sideways scroll at
360 px with 125% text. `next build` not run (shared folder rule).

## Routes

| Route | What it is |
|---|---|
| `/[lang]/[airport]/map` | Schematic map from the content layer's `MapModel` (KLIA T1 today). Prerendered for airports with a map **or** a facilities directory; the latter get an honest "no map yet" page |
| `/[lang]/[airport]/facilities` | Directory of every published facility with filters; prerendered for `sectionStaticParams('facilities')` (KUL, PEN, BKI) |

Deep links (all shareable; the URL is the state, written with `history.replaceState`):
`?poi=<id>` select and centre a place, `?from=<id>&to=<id>` route, `?sf=1` step-free, `?level=<id>`,
`?cat=gates,prayer` filters, `?t=T1|T2` terminal (the shell's terminal chips). Facilities:
`?cat=lounge,calm-room&t=T2&area=airside&access=1`, and `#<facility-id>` scrolls to (and outlines) an item.

## What the map does

- SVG drawing in the map's own 1000 x 600 space: zones (public, passenger-only with a hatch, kerbs and links
  dashed), walk corridors, markers with category icons (dashed ring = illustrative `demo` position), labels
  placed greedily without collisions, the route with a halo and dotted ride legs, and "To Level 3" buttons
  where the route changes level. The permanent pill "Schematic demonstration map, not a floor plan" sits on
  the canvas; the map's own note and sources are under "About this map".
- Zoom and pan: buttons (left, up, down, right, zoom out, zoom in, reset) under the canvas; keyboard on the
  focused map (arrows, Shift+arrows, `+`, `-`, `0`, `Escape`); mouse drag, double-click and Ctrl/Cmd+wheel are
  extras. Animations use rAF and are skipped for reduced motion (in-app setting or system).
- Level switcher (`SegmentedControl`, route levels get a route icon); search with synonyms (loo, surau,
  aerotrain, lift…); 13 category filters with counts (zero-count categories are listed as "Not on this map
  yet" with a link to the directory); details panel (type, level, area, hours and accessibility from the
  linked facility, provenance of the place and of its position, sources, route here / start here, copy link).
- Directions: From and To selects grouped by level, step-free switch, both walking paces (70 and 48 m/min,
  tagged Estimated), distance, step-free or not, levels crossed, and the **written steps** (walks merged per
  level with "Passing…", lift runs merged, the Aerotrain ride with its published note). Each step is a button
  that highlights its part of the line and switches level.
- "All places on this map": the list view with the same filters, grouped by level; "Show on map" moves focus
  to the marker. Without JavaScript the static HTML shows the map, filter counts and the full list.

## Files

`src/app/[lang]/[airport]/map/page.tsx`, `src/app/[lang]/[airport]/facilities/page.tsx`;
`src/components/map/`: `map-logic.ts` (pure: view model, filters, search, view maths, label placement,
`buildRouteSteps`, `routeMinutes`, URL parsing), `map-view.server.ts` (server-only builders: localised
`MapView`, `FacilityView`, `sourceLookup`, `officialPages`), `map-explorer.tsx`, `map-canvas.tsx`,
`place-details.tsx`, `route-planner.tsx`, `place-list.tsx`, `map-legend.tsx`, `map-unavailable.tsx`,
`use-reduced-motion.ts`, `map-logic.test.ts`; `src/components/facilities/`: `facility-view.ts` (types and
filter logic), `facility-values.tsx` (`FactList`, `HoursValue`, `AsOf`…), `facility-card.tsx`,
`facilities-directory.tsx`; copy in `src/lib/i18n/features/map.ts`; `e2e/map.spec.ts`.

Client components receive localised, serialisable props only; nothing imports `@/content` on the client.

## How to test

- `/en/kul/map`, search "surau", open it, "Route here", toggle "Step-free route only" on
  `?from=l5-row-b&to=l3-toilets` (escalator becomes a lift), `?from=l5-kerb&to=g-gates-c` (Aerotrain step).
- Keyboard only: Tab to the map, arrows and `+`/`-`/`0`; Tab through markers, Enter selects.
- `/en/kul/map?t=T2` (no Terminal 2 map: honest state with links), `/en/pen/map`, `/ms/kul/map`.
- `/en/kul/facilities`: filters, "Show on map" on the Calm Room, phone filter toggle.
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/map.spec.ts`.

## Known gaps

- Only KLIA T1 has a map model; most points are `demo` (illustrative positions) and say so. Food, shops,
  nursing rooms and accessible toilets have no mapped points, so those filters are listed as not mapped.
- No facility record sets `accessible`, so "Accessibility" reads "Not published" everywhere; the directory's
  accessibility filter therefore keeps assistance services and calm rooms.
- Native selects shorten very long option labels on narrow phones (browser behaviour); options use the short
  name plus level to keep this rare.
- Typing in the map search before hydration is ignored (React controlled input); typing again works.
- Touch pinch on the canvas is not implemented (single-finger scroll stays with the page); buttons cover it.
- Malay copy is a draft pending native review.

## Requests to other teams

- Domain/content: add `accessible: true|false` where a source says so; add map points for toilets, nursing
  rooms and accessible toilets when an official map is captured; a Terminal 2 `MapModel`.
- Shell: the section registry hides "Terminal map" for airports without a map; `/[airport]/map` still exists
  for them (empty state). Nothing to change unless you want to link it.
- Dev server: edits to an existing feature dictionary file were not picked up until the file was touched again.

## Architecture note: indoor positioning and turn-by-turn later

- **Data model.** Keep `MapModel` as the contract but georeference it: add a per-level affine transform (map
  units to WGS84 or a local metric frame), real `metres` on edges, door and portal nodes, one-way and timed
  edges (security lanes, opening hours), and per-edge attributes (`stepFree`, `widthCm`, `slope`). Import from
  IMDF or OSM indoor (`level`, `door`, `room`) so authoring is not hand-drawn. `shortestPath` stays; add edge
  costs for queues (live `WaitTime`, labelled demo until real) and closures from notices.
- **Positioning providers.** A `PositionProvider` interface like `FlightDataProvider`:
  `watch(callback) -> { levelId, x, y, accuracyM, source, at }` with implementations for BLE beacons or Wi-Fi
  RTT (needs an airport SDK or native app), visual positioning from signage, and a manual one ("I am at
  Gate C") that already works with today's model. Snap readings to the walk graph, re-route when off path by
  more than the accuracy radius, and show accuracy and source as provenance (`estimated`).
- **Turn-by-turn.** `buildRouteSteps` already yields instruction steps with node runs; add bearings from
  node geometry for "turn left" and announce steps through a polite live region and optional speech.
- **Privacy.** Positioning runs on the device; nothing is sent to the server. Explicit opt-in per session with
  a visible "using your location" indicator and one-tap stop; no history kept beyond the active route; no
  analytics on position. If a provider needs the network, document it in the privacy page first.

# Hand-off: integration and release

Owner: integration. Date: 17 November 2026. Scope: make the eight feature teams' work build, pass its tests
and hang together, against a production build (`next build` + `next start -p 3100`), as the Next.js notes
require (sections 2, 16).

## 1. Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx eslint .` | 0 problems (`docs/**` scratch scripts are already ignored) |
| `npx vitest run` | 29 files, **363 passed**, 0 failed (was 362 with 1 failing; +1 new test) |
| `npx next build` | Succeeds; 380 static pages generated (about 45 s cold). It failed at first (section 2, item 1) |
| `npx playwright test --trace off` (production, port 3100, both projects) | **176 passed, 0 failed, 2 skipped** of 178 (3.0 min). First run: 167 passed, 9 failed |
| Axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) | **0 violations**: 41 scan points across all 9 specs, run on desktop (1440 x 900) and phone (Pixel 7, 390 x 844) |
| Internal link crawl, static HTML | 240 sitemap URLs (120 per language) and `/en`, `/ms` as seeds: **380 pages, 978 unique links, 0 broken, 0 missing anchors, 0 links through redirects** |
| Internal link crawl, rendered (after hydration) | 249 pages (sitemap plus 9 client-heavy pages: My journey filled, flight pages, board, search results, offline): **1,312 unique links, 910 targets, 155 fragment links, 0 broken, 0 missing anchors** (6 were found and fixed, section 2) |
| Search index links | Every document in `/en` and `/ms/search/index.json` (330): **212 pages, 166 anchors, 0 broken, 0 missing** |

The two skipped tests are deliberate: the calendar download check on the phone project (flights) and the
1280 x 720 first-screen check on the phone project (shell). Builds used
`NEXT_PUBLIC_SITE_URL=http://localhost:3100 APP_VERSION=integration-N`; set both in production (platform request).

Build output worth knowing (flights asked): `/[lang]/[airport]/flights` is `○` (fully static) for all 21 demo
airports in both languages (42 pages). `/[lang]/[airport]/flights/[flightId]` builds as `◐` (static shell,
streamed per request), and `generateMetadata` reading `params` there passes the build. The three API routes are `ƒ`.
`sitemap.xml`, `robots.txt` and the manifest are `○`. The 16 outlet pages are prerendered.

## 2. Fixes (product code)

1. **Build failure (platform).** Turbopack panicked on `/sitemap.xml/route` → `service_worker_chunk`: the
   worker read `process.env.NEXT_PUBLIC_APP_VERSION`, and the worker's chunking context cannot polyfill
   `node:process`. The worker now reads a compile-time constant `__MA_BUILD__` (`compiler.define` in
   `next.config.ts`, guarded by `typeof`); the emitted `sw.js` contains the build version. Also set
   `turbopack.root` to this folder: the parent folder is an unrelated app with its own lockfile, and Turbopack
   had picked it as the root.
2. **Global 404 never shown (platform).** `[lang]` is a root segment, so it matches any first segment
   (`/api/nope`, `/x.txt`). Such URLs reached the root layout with an invalid locale, and the root layout's
   `notFound()` has no boundary above it, so the result was the framework's bare "404" (empty server HTML).
   An array `rewrites()` entry in `next.config.ts` (runs after static routes and files, before dynamic routes)
   sends every non-locale path to `/_not-found`. That is the prerendered designed, bilingual page, with status 404, and it
   now works without JavaScript. Checked by hand: API handlers, `robots.txt`, `sitemap.xml`, the manifest, all
   icons, `/-/opengraph-image.png`, `knowledge.json` and `index.json` still answer 200.
3. **Typing before hydration was lost (design system, affects home).** React 19.3 leaves text typed into a
   controlled input alone while hydrating but erases it on the next render, so on a slow phone "MH 2626" typed
   into the home search vanished and the search ran on nothing (the intermittent smoke failure the flights team
   saw). `SearchField` now hands pre-hydration text to its parent once, on mount. Reproduced with
   delayed chunks before the fix, and verified fixed after it.
4. **Phone filter toggles inert at first (commerce, map).** The shop and dine and facilities directories read
   `useSearchParams` inside `<Suspense>`. Their fallback HTML is replaced by a client render, never hydrated, so
   a tap on "Filters" before that render did nothing (3 of 10 repeated runs failed). The fallback now renders the
   toggle `disabled` until the live directory takes over: the user sees a disabled control, not a dead one.
   The same tests then passed 16 of 16 runs under parallel load.
5. **Corporate About page.** The Board of Directors "Not published" block linked as "Open the official site".
   `MissingFact` takes an optional `actionLabel`, and the page passes the existing key: "Board of Directors on the
   official site".
6. **Search anchors (domain, transport).** Search linked `/kul/transport#<id>` and `/kul/parking#<id>`, but the cards
   render `transport-<id>` and `car-park-<id>`. The search builder now uses the cards' ids. Options in the
   planner's "Not listed for <place>" list got the same anchor, because a search result can point at them.

## 3. Cross-team changes (every file touched outside integration's own doc)

| Team | File | Change |
|---|---|---|
| platform | `next.config.ts` | `turbopack.root`; `compiler.define.__MA_BUILD__`; `rewrites()` to the global 404 (section 2) |
| platform | `src/components/platform/service-worker.ts` | `BUILD` from `__MA_BUILD__` instead of `process.env` |
| platform | `src/app/favicon.ico` | Was the Next.js "N" logo; regenerated (16, 32, 48 px) from the platform's own `icon1.png` |
| platform | `e2e/platform.spec.ts` | og:image: Next 16.4 serves the static image under `[lang]` once, at `/-/opengraph-image.png?<hash>`. The test now checks for an absolute URL **and that the image loads as `image/png`** (it previously expected `/en/…`) |
| foundation-ui | `src/app/[lang]/page.tsx`, `src/app/[lang]/[airport]/page.tsx` | JSON-LD adopted: `websiteJsonLd` + `organizationJsonLd` on the home page, `airportJsonLd` on the airport overview (platform request) |
| foundation-ui | `src/app/[lang]/layout.tsx` | `robots` follows `SITE_INDEXABLE` (same switch as `X-Robots-Tag`) (platform request) |
| foundation-ui | `src/components/shell/site-header.tsx` | "Corporate site" link uses an internal arrow, not the external-link arrow (corporate request) |
| foundation-ui | `src/lib/i18n/en.ts`, `ms.ts` | Home shop strip lead and the airport-overview shop-and-dine line say "a named source", not "an official source", because some outlets rest on press reports (commerce request) |
| corporate | `src/app/[lang]/corporate/page.tsx` | `organizationJsonLd` (platform request) |
| corporate | `src/components/corporate/missing-fact.tsx`, `src/app/[lang]/corporate/about/page.tsx` | Optional `actionLabel`; descriptive board link |
| design-system | `src/components/ui/table.tsx` | `TableScroll` is `relative`, so `sr-only` text stays inside the scroll region (transport request) |
| design-system | `src/components/ui/search-field.tsx` | Adopts pre-hydration text (section 2, item 3) |
| domain | `src/content/content.test.ts` | Outlets assertion: KLIA lists exactly the 8 "publishable" rows of the commerce supplement, each with sources that resolve (commerce request) |
| domain | `src/content/index.ts` | `CORPORATE_SOURCES` added to `ALL_SOURCES` and to `validateAllContent()` (no id clashes; validation passes) (corporate request) |
| domain | `src/content/types.ts` | `z.config({ jitless: true })`: no `new Function` probe, so no CSP `script-src` report (platform request) |
| domain | `src/lib/search/documents.ts` | Rest and shower facilities link to `/<airport>/lounges#<id>` (commerce request); `MEDIA_ITEMS` and the corporate section pages are indexed (corporate request; this imports `CORPORATE_SECTIONS` from `@/components/corporate`, a data-only module); transport and parking anchors fixed |
| flights | `src/app/[lang]/journey/page.tsx`, `src/components/flights/parked-car-card.tsx` | A saved note in a car park of type `preferred` repeats the airport's premium-parking warning (warning callout plus provenance tag) (transport request) |
| map | `src/components/map/map-logic.ts`, `map-explorer.tsx`, `map-logic.test.ts` | The journey timeline links `/<airport>/map?gate=C12&t=T1`, but the map ignored `gate`. It now resolves the gate to its gate area (same rule as `poiForGate`) and rewrites the URL to `poi` plus the route's `to`, so the gate is shown and "Directions" opens with the destination filled in. Unit test added |
| map | `src/components/facilities/facility-card.tsx`, `facilities-directory.tsx`, `src/app/[lang]/[airport]/facilities/page.tsx` | Bookmark toggle on each facility card (`savePlace`, type `facility`): facilities now appear under My journey's "Saved places" (flights request). Fallback filter toggle disabled (section 2, item 4) |
| map | `e2e/map.spec.ts` | Counts updated to the integrated content: KLIA has 20 facilities, not 17, and 6 lounges, not 5, after commerce added Travel Club Lounge, Kepler and DaySleeper. The assertions are otherwise unchanged |
| commerce | `src/components/commerce/outlet-directory.tsx` | Fallback filter toggle disabled (section 2, item 4) |
| transport | `src/components/transport/transport-planner.tsx` | Anchors on "Not listed" items |

No test was skipped, deleted or loosened. The two e2e expectations that changed now match the integrated content
and the framework's real behaviour, and the og:image test now also checks that the image loads.

## 4. Requests: status

| From → to | Request | Status |
|---|---|---|
| platform → foundation-ui, corporate | Adopt `JsonLd` builders | Done (home, airport overview, corporate home) |
| platform → domain | zod `jitless` | Done |
| platform → foundation-ui | Robots from `SITE_INDEXABLE`; replace default favicon | Done. The `apple-mobile-web-app-title` meta is not added (optional) |
| platform → integration | Set `NEXT_PUBLIC_SITE_URL`, `APP_VERSION`; run production e2e | Done locally; set both in the deployment pipeline |
| commerce → domain | Fix the outlets assertion | Done. Not done: refreshing the `kul.ts` header and the `kul-content-gaps` note; `Outlet.provenance` and a dated `promotion` field (content model) |
| commerce → search | Rest and shower facilities link to lounges | Done |
| commerce → foundation-ui | "a named source" wording | Done (both languages) |
| corporate → domain | Register `CORPORATE_SOURCES`; index `MEDIA_ITEMS` and corporate pages | Done |
| corporate → foundation-ui | Corporate link arrow | Done |
| transport → design-system | `TableScroll` relative | Done. Not done: the `Th` row-header variant (optional) |
| transport → flights | Premium warning in the parked-car note | Done |
| transport → domain | `validFrom` / `validUntil` on `TransportDestination` | Not done: a content model change across the content files and the transport logic. Fare periods still come from destination names |
| flights → map, facilities, commerce, transport | `savePlace` buttons | Outlets (commerce) and facilities (now) save. Not yet: car parks, transport options, map points |
| flights → shell | Terminal chips keep other query parameters | Already true (`hrefFor` copies the params); the board e2e passes |
| flights → guides | Keep `/help/flights`, `/help` | Both 200 in both crawls |
| flights → integration | Build kinds for the board and the flight page | Confirmed (section 1) |
| map → shell | Optionally link `/map` for airports without a map | Left as is (the section registry hides it, and the page exists as an honest empty state) |
| map, commerce, guides → dev server | Stale dictionary chunks in `next dev` | Not reproducible in production builds; nothing to change |
| concierge → platform | Cache `knowledge.json` in the worker | Already true (`sw-routes.ts`, data files stale-while-revalidate) |
| guides, shell | Move focus to the `h1` after a client navigation | Not done (see remaining issues) |
| map, content | `Facility.accessible`, map points for toilets and nursing rooms, KLIA T2 `MapModel`, parking rate cards, outlet hours, Penang lounge hours, KLIA T2 directory URL | Not done: content work that needs sources |

## 5. Walkthrough (production build, browser clock fixed at 18 Nov 2026 09:40 MYT)

Home → choose KLIA Terminal 1 (header switcher) → search "MH 2626" (demo-labelled inline result, delayed) →
flight page (hero, timeline with provenance, delay help; links to map, facilities, transport, parking, shop
and dine, lounges, transit, help) → `map?gate=C12` (Gates level, C gates selected, Directions "To" filled) →
route from the departures kerb to Gates C (written steps, Aerotrain step) → transport (KLIA Ekspres RM 55
"until 31 December 2026" with the change to RM 65) → parking → shop and dine (partial-directory note) →
transit planner → concierge ("Terminal 1 to Terminal 2", answered with sources) → corporate home → Bahasa
Malaysia through the language switch → dark mode through Display settings → My journey with a saved flight, a
saved facility and a Preferred Parking note (warning shown) → 390 px phone: home, KLIA, board, flight, map
route, facilities, My journey, Malay transport. Results: one `h1` on every page, no sideways scroll, no console
errors. Screenshots were reviewed for the joins: navigation, empty states, demo labels, the saved-count badge in
the header, and the terminal chips.

## 6. Remaining issues, by severity

**Medium**

1. **Suspense fallbacks are inert until the client render.** Every directory that reads `useSearchParams`
   (shop and dine, facilities, map, transport planner, parking list, board) serves fallback HTML that React
   replaces rather than hydrates. Taps and typing in that window are lost. Phone filter toggles are now
   disabled meanwhile, but the search fields and desktop filter chips inside these fallbacks still drop early
   input (the map team's "typing before hydration" gap is this). Proper fix: read URL state with
   `useSyncExternalStore` (server snapshot = defaults) so these trees hydrate instead of client-render.
2. **Focus stays put after client navigation** (shell and guides gap). The route announcer reads the title,
   but keyboard and screen-reader users start at the previous focus position on long pages. Add a shell
   effect that focuses the visible `main h1` on pathname change (not on query-only changes), and test it.
3. **Content gaps limit the features.** KLIA parking rates are not verified (so the calculator never runs
   with real data). No outlet has hours, a price band or a cuisine. No facility states `accessible`. There is
   no Terminal 2 map. Most map points are illustrative (`demo`). These are labelled honestly everywhere.
4. **Malay copy and Malay content are drafts** pending native review (all teams).

**Low**

5. Unknown or malformed flight ids answer 200 with `noindex` and the not-found content (render per request;
   Next.js notes section 5). Use a proxy check if a real 404 matters.
6. Fare periods for KLIA Ekspres are parsed from destination names until `validFrom` and `validUntil` exist.
7. Saved places: car parks, transport options and map points have no save button yet.
8. Turbopack also emits a raw copy of `service-worker.ts` under `/_next/static/media/` (unused, harmless; the
   registered worker is the compiled `/_next/static/service-worker/sw.js`).
9. The Open Graph image URL is `/-/opengraph-image.png?<hash>` for both languages (framework behaviour with a
   static image under the root `[lang]` segment). It loads correctly.
10. `src/lib/search/documents.ts` imports `CORPORATE_SECTIONS` from `src/components/corporate` (data only).
    Move that list into `src/content` if the layering matters.
11. `next build` prints no warnings now. `vitest` still prints the ESM-config notice (domain gap, harmless).

## 7. How to reproduce

```bash
npx tsc --noEmit && npx eslint . && npx vitest run
NEXT_PUBLIC_SITE_URL=http://localhost:3100 APP_VERSION=$(git rev-parse --short HEAD) npx next build
npx next start -p 3100 &      # stop it by its PID afterwards
npx playwright test --trace off   # reuses the server on 3100
```

The crawl scripts were run from a scratch folder outside the repository. They seed from `/sitemap.xml`, follow
every internal `<a href>` in the server HTML, check status and `#fragment` ids, and then repeat the same checks in
Chromium after hydration with a saved journey. A version kept in `scripts/` would make a good CI step.

# Fix log: round three, performance (round-two open issues 1, 3, 11 and 14, then 2)

Round three, 21 November 2026. Items, in the order given: the pages still revealed by `$RC` after a
page-level Suspense fallback (round-two issue 1; E-02, E-01), the demo flight generator in the
browser (issue 3; E-03, B-09), the Arrivals wording and the home layout shift (issues 14 and 11),
then TBT on `/en` and `/ms` if cheap (issue 2). One engineer; no git commands were run.

**Result:** 3 fixed, 1 partially fixed (TBT), 0 not fixed.

| # | Item | Backlog | Status |
|---|---|---|---|
| 1 | `h1` revealed by `$RC` on 116 of 276 sitemap pages; transport LCP 4.27 s | E-02, E-01 (P0) | **Fixed**: **0 of 276** (was 116); transport 79 → **95**, LCP 4.27 → **1.09 s**; parking 79 → **94**, LCP 4.13 → **1.11 s**; unknown slugs still a real 404 with the site shell |
| 2 | Demo generator in the first load of all 39 page routes | E-03, B-09 (P0) | **Fixed**: in the first load of **0** routes (was 39); every route 3.9 to 13.0 KB gzip lighter; journey 256.7 → **243.6**, flight page 252.0 → **246.7** (none over 250; was 2) |
| 3a | Arrivals tab says completed arrivals "have already left" | low | **Fixed** in both languages |
| 3b | Home layout shift from the status row and notice strip | low (A-10, E-02) | **Fixed**: CLS **0** on `/en` and `/ms`, phone and desktop (was 0.018 / 0.023 desktop, 0.029 Malay phone) |
| 4 | TBT on `/en` and `/ms` (target 200 ms) | A-09, E-01 | **Partial**: interleaved medians of 5 runs `/en` 269 → **235 ms**, `/ms` 351 → **262 ms**; not at 200. Nothing cheap left (see item 4) |

## How it was measured

Own production builds, never the default `.next`:

- **Before**: the tree as found, `NEXT_DIST_DIR=.next-r3before NEXT_PUBLIC_SITE_URL=http://localhost:3222 npx next build`
  (0 warnings), served with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip NEXT_DIST_DIR=.next-r3before npx next start -p 3222`
  (later on 3223 for the interleaved runs). Its numbers reproduce round two's verification exactly (116 hidden
  `h1`; transport 79 with LCP 4.27 s; first-load JS `/en` 232.6, journey 256.7, flight page 252.0 KB).
- **After**: the same commands with `NEXT_DIST_DIR=.next-r3prod`, port 3222. The final build (0 warnings) is the
  one the end-to-end suite, the `$RC` scan, the 404 checks and the route JavaScript were measured on. The
  Lighthouse rows for the seven content pages and the journey are from the build before the last two changes
  (the home preview's next-day request and `ensureStatic` on outlet pages), which do not touch those pages;
  `/en`, `/ms`, `/en/kul` and parking were measured on the final build.
- Lighthouse 13.6 through the session's `tools/lh.js` (mobile: Moto G Power, simulated slow 4G, 4x CPU), 3 runs,
  median; shared 4-vCPU container, TBT varies by ±60 ms or more between runs, so `/en` and `/ms` were also run
  5 times interleaved (before, after, before, after) on the two servers side by side.
- Scripts (session scratch folder `r3/`, not in the repository): `rc.py` (round two's scan of all 276 sitemap
  URLs, now also saving the list), `segs.py` (what each hidden segment holds), `routejs.js` (round two's
  first-load JavaScript per route from the build manifests), `shift.cjs` (CLS and its sources on `/en` and
  `/ms`, 390x844, 412x839 and 1440x900, optionally at 4x CPU with a slow network), `graph.js` (static import
  chains to a module), `check.cjs`, `shots*.cjs` (screenshots), `scripts.cjs` (scripts loaded by the home).

## 1. Pages revealed by `$RC` after a page-level fallback (E-02, E-01). Fixed

**Cause.** Ten page modules still wrapped their whole body in `<Suspense fallback={<Skeleton …/>}>` around the
child that awaits `params`. React sends that body as a hidden segment after about 12.8 KB of shell and reveals it
with its throttled `$RC` script, so the heading and the first content (on transport, the touts warning, the LCP
element) painted only after the scripts. The scan found it on guide topics (22), help topics (22), corporate news
stories (28; these are the "corporate sub-pages"), shop and dine and its outlets (18), facilities, transport,
parking and lounges (6 each) and transit (2).

**Change.** Round two's static shell on all ten: no page-level `<Suspense>`; the child awaits `params`, checks the
param against the page's own `generateStaticParams()` and returns `<MissingPage />` for anything else (the same
deliberate exception to Do/Don't 1 as the overview, board and map, documented in each page). Every one of these
routes already had `ensureStatic = 'navigation'` except outlets, which now have it too, so an unknown outlet is a
404 on the first request as well (it was a 200 with the not-found text, then 404). `MissingAirportPage` became
the generic `MissingPage` (`src/components/common/missing-page.tsx`), since guides, help and news use it too; the
three round-two pages import the new name. `notFound()` calls inside these bodies became `return <MissingPage />`
so none can be thrown outside a boundary.

Files: `src/app/[lang]/[airport]/{transport,parking,facilities,lounges,shop-dine,transit}/page.tsx`,
`src/app/[lang]/[airport]/shop-dine/[outlet]/page.tsx`, `src/app/[lang]/guides/[topic]/page.tsx`,
`src/app/[lang]/help/[topic]/page.tsx`, `src/app/[lang]/corporate/news/[slug]/page.tsx`,
`src/components/common/missing-page.tsx` (new, replaces `src/components/airport/missing-airport-page.tsx`),
`src/app/[lang]/[airport]/{page,map/page,flights/page}.tsx` (import renamed). Touched pages were formatted with
Prettier at the codebase's width (`--print-width 160 --single-quote`), which also rewrapped a few long lines in
transit and outlets.

**Verified.**

- `rc.py` over all 276 sitemap URLs: `h1` inside a hidden segment **116 → 0**. Every page still has 3 small
  `$RC` reveals (1,380 → 1,264 in all): the language switch, the menu and, on airport section pages, the compact
  airport header and its section links, all at the end of the document (`segs.py`). The `h1` and the content
  under it are inline on every page (transport: `<h1>` at byte 21,424, touts warning at 24,761, first hidden
  segment at 154,075).
- 404s on the production build, first and repeat request (`curl`): `/en/guides/zzz`, `/en/help/zzz`,
  `/en/corporate/news/zzz`, `/en/pen/shop-dine`, `/en/lgk/transport`, `/en/zzz/parking`, `/ms/lgk/lounges`,
  `/en/kul/shop-dine/<unknown>`, `/en/<unknown>/shop-dine/7-eleven-cafe`: **404** both times with the site shell
  and "Page not found" / "Halaman tidak ditemui"; listed pages 200 with their `h1`. The C-06 e2e test (every
  airport and section pair, first and repeat request, title) passes on both projects.
- Build route table unchanged except outlets: the 16 listed outlet pages are now `○` (fully static) instead of `◐`.

Lighthouse mobile, 3 runs, median (runs in brackets):

| Page | Performance before → after | LCP before → after | TBT before → after | CLS before → after | KB | Requests |
|---|---|---|---|---|---|---|
| `/en/kul/transport` | 79 (79/80/79) → **95** (96/92/95) | **4.27 → 1.09 s** (4.28/4.27/4.22 → 1.09/1.06/1.09) | 291 → 251 ms | 0.003 → 0 | 626 → 624 | 43 → 43 |
| `/en/kul/parking` | 79 (79/78/92) → **94** (91/98/94) | **4.13 → 1.11 s** (4.21/4.13/1.13 → 1.07/1.12/1.11) | 355 → 299 ms | 0 → 0.003 | 616 → 617 | 44 → 44 |
| `/en/kul/shop-dine` | 92 (89/92/95) → **94** (94/91/94) | 1.07 → 1.06 s | 344 → 288 ms | 0.003 → 0.003 | 614 → 606 | 42 → 41 |
| `/en/guides` (hub; was not affected) | 95 (95/95/95) → **99** (99/99/99) | 1.07 → 1.07 s | 253 → **139 ms** | 0 → 0 | 561 → 556 | 38 → 38 |
| `/en/guides/departing` | 98 (94/99/98) → **99** (96/99/99) | 1.07 → 1.07 s | 173 → **139 ms** | 0 → 0 | 567 → 564 | 38 → 38 |
| `/en/help/baggage` | 98 (97/100/98) → **98** (96/98/98) | 1.07 → 1.07 s | 162 → 175 ms | 0 → 0 | 540 → 536 | 37 → 37 |
| `/en/corporate/news/klia-skytrax-2025` | 99 (**65**/99/99) → **97** (94/97/97) | 0.92 → 0.92 s (one run **4.40 s**, CLS 0.293 → none) | 120 → 199 ms | 0 (one run **0.293**) → 0 | 553 → 549 | 38 → 38 |

Accessibility 100 on every run. The guide, help and news medians were already fast because the reveal usually
ran before Lighthouse's LCP cut-off; the worst runs show what the change removes (news: one run at 65 with LCP
4.4 s and CLS 0.293 before, none after). TBT on these pages moves within the run-to-run noise.

## 2. The demo generator in the browser (E-03, B-09). Fixed

**Cause.** Traced with `graph.js` and the chunk contents: the generator (`demo-flights.ts`, the airline and route
tables of `demo-routes.ts`) reached every page through the client barrel `@/lib/hooks`, which re-exported
`useFlightProvider` (Turbopack does not drop unused re-exports of a `'use client'` barrel; the phone bar imports
the barrel, so all 39 routes had it). Separately, `identify-flight.ts` put it in the journey and flight pages
(they import only `flightTitle` from it), and `car-park-list.tsx` imported the provider registry, which imports
the generator.

**Change.**

- The five browser users of the generator read the server flight feed instead, through the existing
  `useFlightFeed` (`src/lib/providers/use-flight-feed.ts`) and its batched `/[lang]/flights/feed` route. The data
  depends on the clock, so it cannot be static for the build; the feed is the server-side source already used
  by the board, flight page, journey and home search, with its stale and failed states:
  - **Home and overview board preview** (`board-preview.tsx`): today's boards of the airports shown, one batched
    request (6 airports); the next day's only when today has fewer flights left than the preview shows (late
    evening). Nothing loaded: the board shows `FeedNotice` (error, "Try again"); last-known rows: `FeedNotice`
    with the age above the rows.
  - **Journey teaser** (`journey-teaser.tsx`): the sample airport's board for today (shared with the preview's
    request), the next day's only when today has no flight left to sample.
  - **Saved-flight card on the home** (`home/saved-flight-card.tsx`): one board per saved airport, date and
    direction; `FeedNotice` if nothing could be loaded; nothing when only past flights are saved (as before).
  - **Commerce gate panel** (`gate-panel.tsx`): only when a departing flight is saved for that airport.
  - **Site search** (`site-search.ts`, palette and search page): today's boards, both directions, of the chosen
    airport or the six featured airports (what the generator searched), fetched only while a query of two or
    more characters is typed. `SnapshotFlightProvider` gained `searchSync` for this.
- `useFlightProvider` is removed (no user left) and with it the barrel export; `flightTitle` moved to
  `flight-title.ts` and `identify-flight.ts` is now `server-only`; the queue and car-park provider factories
  moved to `src/lib/providers/operations.ts` (re-exported by the registry).
- The client no longer needs the demo route table to know which airports have a board: the flights section in
  the server-computed section list (`useSectionAvailability()`) says the same, and a new unit test checks that
  the two lists are identical (21 airports). Used by the preview, teaser, search box ("across 21 airports") and
  site search.
- `/en/journey` was still 1.3 KB over 250 after this, so its "Clear my journey" confirmation (Radix Dialog with
  its scroll lock, 7.6 KB gzip) now loads when there is something to clear (`lazy`, with the same button as the
  fallback), not with the page.
- The demo labels are unchanged: every board still carries the demonstration banner, the teaser its demo tag,
  the saved-flight card its `DemoTag`, search results their demo label. The feed answers carry `mode: 'demo'`.

Files: `src/components/home/board-preview.tsx`, `journey-teaser.tsx`, `saved-flight-card.tsx`;
`src/components/commerce/gate-panel.tsx`; `src/components/search/site-search.ts`;
`src/components/flights/flight-search-box.tsx`, `identify-flight.ts`, `flight-title.ts` (new), `my-journey.tsx`,
`saved-flight-card.tsx`, `flight-board.tsx` (doc comment); `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`
(import); `src/components/parking/car-park-list.tsx`; `src/lib/hooks/index.ts`, `use-flight-provider.ts`
(deleted); `src/lib/providers/index.ts`, `operations.ts` (new), `snapshot.ts`, `demo-flights.ts` (doc comment);
`src/components/design-system/board-sample.tsx` (doc comment); `src/components/shell/sections.test.ts` (new
test); `docs/engineering/architecture.md`, `docs/engineering/handoffs/domain.md` (the hook they described).

**Verified.**

- The demo airline table (searched for its `"Boeing 737-800"` entry) is in the first load of **0** routes (was 1
  chunk on 39 routes). The generator now loads in the browser in one place only: the concierge panel imports it
  on first use (`use-concierge.ts`), which was not part of this item.
- First-load JavaScript, gzip KB (build manifests, `routejs.js`; framework 128.6 to 128.7 of every row):

| Route | Before | After |
|---|---|---|
| `/en/journey` | **256.7** | **243.6** |
| flight page | **252.0** | **246.7** |
| `/en` | 232.6 | 228.7 |
| `/en/kul` | 233.4 | 229.4 |
| board | 235.9 | 228.7 |
| map | 236.6 | 227.4 |
| parking | 229.4 | 222.2 |
| transport | 225.4 | 216.2 |
| shop and dine | 226.9 | 222.5 |
| search | 225.1 | 219.6 |
| concierge | 223.3 | 216.1 |
| guides hub / guide topic | 213.1 / 213.0 | 202.4 / 203.8 |
| help topic | 217.7 | 208.5 |
| corporate news story | 211.5 | 202.3 |
| smallest (catch-all) | 209.3 | 198.6 |
| over 250, of 39 | **2** | **0** |

  Every route is 3.9 to 13.0 KB lighter (mean 8.6). The saving is less than the 17.1 KB chunk because that chunk
  also held shared modules the pages still need (the airport registry, for one).
- Home feed requests (Playwright, phone and desktop): **1** batched request,
  `/en/flights/feed?date=…&dir=d&airports=kul,pen,bki,kch,lgk,szb` (about 16 KB gzip, 211 KB of JSON).
- End-to-end: the B-09 test, the search palette, "one exact flight number opens that flight", the commerce
  "near your gate" test, the journey and the A-08 saved-flight checks pass on both projects.
- Screenshots: home board preview at 1440x900 and in Malay at 390x844 (rows from the feed, demonstration banner,
  "Updated" time).

**Test updated (intended behaviour changed).** `e2e/handoffs.spec.ts`, B-09: the test blocks every feed request
and looked for *the* failure notice on the page. The board preview now reads the same feed and shows its own
notice, so the locator matched two. The test now finds the search's notice in the results the search box
controls (`aria-controls`) and additionally checks that both notices are shown; the rest is unchanged.

## 3a. Arrivals wording. Fixed

The default board sets aside finished flights: departed departures, and **completed** arrivals (landed and bags
delivered). Both used `flightPages.rows.departedHidden` ("N flights have already left"). New key
`flightPages.rows.arrivedHidden`: "{count} flight has already arrived. Use Earlier to see it." / "… flights have
already arrived. Use Earlier to see them."; Malay "{count} penerbangan telah tiba. Gunakan Lebih awal untuk
melihatnya." (`telah tiba`, as `Ketibaan` names the tab; the departures sentence keeps `telah berlepas`). The
explorer picks the key by direction. Files: `src/lib/i18n/features/flights.ts`,
`src/components/flights/flight-board-explorer.tsx`.

Verified: in the demo the state is rare at KLIA (domestic arrivals complete 45 minutes after arriving, at the
edge of the 45-minute window; none at 39 sampled times of day), so two arrivals in the window were marked
completed in the feed answer in the browser (Playwright route): "2 flights have already arrived. Use Earlier to
see them." and "2 penerbangan telah tiba. Gunakan Lebih awal untuk melihatnya."; Departures still says "1 flight
has already left." Screenshot at 1440x900 looked at. Phones still leave the sentence to screen readers (round 2).

## 3b. Home layout shift (status row and notice strip). Fixed

Reproduced with `shift.cjs` at 4x CPU and a slow network (3 loads each), sources from the Layout Instability API:

- **Desktop** (`/en` 0.0178, `/ms` 0.0145 to 0.023): the headline notice card grew from 66 to 86 px after
  hydration, because its "From 28 Nov 2026" line appeared only once the clock said the notice was upcoming; the
  status row, the board and the strip links moved with it. Now the start date shows whenever the notice has one
  ("From …" is true of an upcoming and of a current notice), so the server HTML already has the line
  (`notice-strip.tsx`).
- **Malay phone** (0.028 to 0.029): the status summary ("1 perkhidmatan ada notis") arrives after hydration and
  wrapped the row to a second line (21 → 42 px). Now every summary the row can show (clear, or 1 to 3 services
  with a notice at KLIA) sits in one grid cell, only the current one visible, so the row is as tall as the
  longest from the first paint (`home-ops-status.tsx`; hidden variants use `visibility: hidden`, so they are not
  read or announced).

| `shift.cjs`, 3 loads | Before | After |
|---|---|---|
| `/en` 390x844 / 412x839 / 1440x900, 4x CPU + slow network | 0.0028 / 0.0026 / **0.0178** | **0 / 0 / 0** |
| `/ms` 390x844 / 412x839 / 1440x900, 4x CPU + slow network | **0.0289** / **0.0282** / **0.0145** | **0 / 0 / 0** (one desktop load 0.0049: the header's airport button as the Fraunces/Hanken fonts swap, not the strip) |
| Same, no throttling | `/en` desktop 0.0178, `/ms` desktop 0.023, phones 0 | **0 everywhere** |

Lighthouse CLS on `/en` and `/ms`: 0 in all 16 runs on the final build (before: 0.003 in 2 of 3 `/en` runs and 3
of 5 interleaved ones, 0.025 in one `/ms` run). Cost: on phones the status row now always has two lines (title, then summary) in English too, where a
short summary used to fit beside the title: 21 px more height, constant, in exchange for no shift. Screenshots at
390x844 (en and ms) and 1440x900 looked at.

## 4. TBT on `/en` and `/ms`. Partial

Lighthouse mobile medians:

| Page | Before | After (final build) |
|---|---|---|
| `/en`, 3 runs | 96, TBT 229 ms (229/259/197), 590 KB, 40 requests | 92, TBT 346 ms (462/294/346), 622 KB, 42 requests |
| `/ms`, 3 runs | 94, TBT 299 ms (240/299/326), 592 KB, 40 requests | 95, TBT 261 ms (232/282/261), 624 KB, 42 requests |
| `/en/kul`, 3 runs | 92, TBT 351 ms (386/338/351), 644 KB, 46 requests | 94, TBT 290 ms (282/335/290), 649 KB, 47 requests |
| `/en/journey`, 3 runs | 96, TBT 230 ms, 539 KB | 98, TBT 178 ms, 534 KB |
| `/en`, 5 runs interleaved with before | 95, TBT **269 ms** (269/216/391/402/260) | 96, TBT **235 ms** (235/223/335/287/201) |
| `/ms`, 5 runs interleaved with before | 92, TBT **351 ms** (342/242/–/390/351; one run failed) | 95, TBT **262 ms** (270/230/246/300/262) |

The 3-run `/en` set on the final build had one 462 ms run and reads worse than before; run side by side, `/en`
was lower in 4 of 5 pairs and `/ms` in 4 of 4. Main-thread work on `/en` (Lighthouse diagnostics, one run each):
script evaluation 1,091 → 1,026 ms, style and layout 484 → 364 ms. Remaining long tasks are the same as round
two found: the HTML document (parse, style and layout of a 308 KB page, 148 to 222 ms at 4x), React hydration
(166 to 183 ms) and a few 50 to 70 ms renders after it. None of these has a cheap fix, so no further change was
made for this item.

Bytes on the home went **up** by 32 KB (590 → 622): the feed answer (16 to 18 KB; it was 2 requests and 30 KB
before the next-day change) and the prefetched `/journey` chunks, which the home no longer shares (13 KB). `/en/kul` +5
KB, one more request.

## Checks before finishing

- `npx tsc --noEmit`: 0 errors. `npx eslint .`: 0 problems (run after deleting the build folders).
  `npx vitest run`: 32 files, **504 passed** (503 + the new section test).
- Playwright on the final production build (`PLAYWRIGHT_BASE_URL=http://localhost:3222 E2E_STATUS_CODES=1`,
  `--trace off`, desktop and phone): **348 passed, 0 failed, 6 skipped** (the deliberate project-specific skips), C-06 included. The first full run on an earlier build of this round failed
  only B-09 (2 of 348), fixed as described in item 2.
- Screenshots looked at (5 of 10): home board preview 1440x900, home 390x844 (en), home 390x844 (ms), transport
  390x844, board Arrivals 1440x900 with the new sentence.
- Clean-up: servers stopped by PID; `.next-r3before` and `.next-r3prod` deleted; the `.next-r3*` lines Next added
  to `tsconfig.json` removed (it and `next-env.d.ts` match their state before the round); the default `.next` was
  not touched.

## What is left

- **TBT** on `/en` (235 ms) and `/ms` (262 ms) is above 200: the HTML document task and hydration, as above. The
  next candidates remain round two's: fewer hydrated Client Components on the home first screen and the icon
  registry (22.8 KB gzip on all 39 routes).
- **Home bytes** went up by 32 KB. Whole feed days (about 200 KB of JSON for six airports) are more than an
  eight-row preview needs; a preview-sized answer from the feed route would cut it, at the cost of a new route.
- **The concierge** still loads the generator in the browser on first use (lazy, not in any first load).
- **Section pages keep three small `$RC` reveals**, including the compact airport header from
  `src/app/[lang]/[airport]/layout.tsx`, which stays behind Suspense because flight pages under that layout are
  rendered per request. It sits above the `h1` with a same-height skeleton (transport CLS 0 to 0.003).
- One `/ms` run in each build had an LCP of 3.3 to 3.5 s (before and after alike); not investigated here.
- On phones the home status row is now two lines in English as well (see 3b).

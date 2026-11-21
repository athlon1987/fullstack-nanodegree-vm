# Fix log: round five, flight page, board and airport sections

Round five, 21 November 2026 (measurements 00:35 to 01:45 Kuala Lumpur time, 22 November). Package: flight (the
flight page, the board, the airport section pages and My journey). Items from `docs/qa/verification.md`, round four,
F8 items 2, 4, 5 and 10. Owned paths only (below); nothing outside them was changed.

| # | Item | Status |
|---|---|---|
| 1 | Flight page LCP (F8 item 2; E-01, E-02; P0) | **Fixed**: LCP 5.32 s → **1.22 s**, performance 65 → **95** (median of 3, performance-only Lighthouse); `h1` at byte 218,424 inside a hidden segment → **19,517, inline**; CLS 0.207 → 0.003. With `scripts/qa/lighthouse.mjs` (all four categories) the median was 86 to 87 (LCP 1.25 s, TBT 381 to 521 ms, CLS 0.065 in 5 of 9 runs): see "Open" |
| 2 | Board LCP at night (F8 item 2) | **Fixed**: at 23:30 LCP 4.84 s → **0.93 s**, performance 74 → **93** (English), Malay 0.92 s and 90 |
| 3 | Flight page first-load JavaScript (F8 item 4) | **Fixed**: 249.1 → **198.1 KB** gzip (target 230). The flight page's own share over the board: 19.9 → **0.7 KB**; the rest of the drop is the speed package's shared-shell work in the same tree |
| 4 | Density on the flight page and My journey (F8 item 5; A-14, 6.1.7) | **Fixed** on the counts asked for: one source list per section, at most **1** Demo label per view (was 2 to 3), type sizes 9 → **8** on the flight page and the overview. **Partly** on "fewer chips": provenance tags 21 → 17 or 18, the 5 "My needs" toggles stay (they are the control) |
| 5 | Desktop CLS on airport section pages (F8 item 10) | **Fixed**: 0.0257 to 0.0265 → **0.0004 to 0.0005** (seven section pages); flight page 0.0968 → 0.0045; board 0.0445 → 0.0157; transport 0.0453 → 0.0197 (the rest is its fare row, another package) |
| 6 | e2e A-03 and rate limits (F8 item 10) | **Fixed**: its own client address per test and a hydration wait instead of network idle; **30 of 30** passes with `--repeat-each=5` on both projects |

## Method

- **Builds.** Four production builds into `.next-r5flight-prod` (`NEXT_PUBLIC_SITE_URL=http://localhost:3252`), served by
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3252`: build 1 the baseline (the tree as I found it,
  with the other two packages' work in progress), builds 2 and 3 intermediate, build 4 final. All "before" numbers
  are my own on build 1, measured on this machine in this session, not round four's. The other two engineers built,
  served and ran Lighthouse and Playwright on the same 4-vCPU container: load averages during my runs were 0.6 to 3.7,
  once 10 to 12 (those runs were repeated); Lighthouse benchmark indexes 1,734 to 3,018. TBT is the number most
  affected; LCP and CLS much less.
- **Lighthouse.** Lighthouse 13.6 (the installation in the scratchpad's `tools/`), mobile defaults (Moto G Power,
  simulated slow 4G, 4x CPU), headless Playwright Chromium. Two drivers: (a) a small Node driver around Lighthouse's
  API, performance only, each run with its own `x-e2e-client-ip`, and a fixed browser clock where asked
  (`Date` shifted to the instant on every document); (b) `scripts/qa/lighthouse.mjs` (all four categories, no
  client header) and the Lighthouse CLI directly. Medians of 3 runs unless stated.
- **Clock.** The board "at night" was measured with the browser clock at **2026-11-22 23:30 Kuala Lumpur time**, as
  round four's 23:17 run; the window then runs 23:20 to 05:30 and holds no departures. (The real clock was also in the
  empty window, 01:38, for the CLI board runs.)
- **Other measurements.** `scripts/qa/first-load-js.mjs` on the build folder; a Playwright script for layout shift
  (1440 x 900 and Pixel 7, 3 loads, `layout-shift` entries with their sources) and for the A-14 counts (the round-four
  `acceptance-round4.mjs` method at 390 x 844 and 1440 x 900, with the clock at 18 November 09:40 and MH 2626 saved:
  provenance tags, source toggles, `data-demo-marker` labels per 844 or 900 px view, filter chips, distinct font sizes
  of elements with text); `curl` for status codes and HTML.
- One read-only `git diff --stat` was run by mistake at the start; no other git command was used.

## 1. Flight page LCP (E-01, E-02). Fixed

**Cause.** The page wrapped its whole body in a page-level `<Suspense>`. The route renders per request (ids carry a
date), so React streamed the body as a hidden segment at the end of the document (`h1` at byte 218,424 of 431,725)
and revealed it with its throttled `$RC` script. Lighthouse's LCP element was not even the `h1` on this run but the
next-step summary, painted as a new block after the flight feed answered: LCP 5.3 s.

**Change.**
- `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`: no page-level `<Suspense>`; `params` is awaited at the top of
  the page body, which `export const instant = false` allows on this route (Next.js 16.4, `instant`, "Disabling static
  shell validation"; without it the build stops with blocking-prerender-dynamic). It is not one of the forbidden
  segment exports of the Next.js notes (Do/Don't 3) and it is on this page only. Next.js now sends the static start of
  the document at once (site and airport chrome) and the page follows **in document order, not hidden**: the `h1`
  ("AK 6336 to Penang", from the id and the timetable, no clock), the eyebrow, the summary frame and the status card
  with the timetable facts are in the first flush (`h1` at byte 19,517). Considered and not used: `generateStaticParams`
  plus `ensureStatic = 'navigation'` (as the board) would store every flight page a visitor opens on the server's disk
  for good, and any date is a valid id.
- `src/components/flights/flight-identity.ts` (new): the clock-independent fields of a flight (route, scheduled time,
  terminal, flight time, aircraft, codeshares). `flight-identity.test.ts` proves, for every departure and arrival at
  KUL and PEN, that these fields are identical at seven instants from the evening before to the morning after, and
  equal to what the server resolves from the id. The server passes them to `FlightDetail`.
- `flight-status-hero.tsx`: a `pending` mode. Before the feed answers, the card shows those facts and placeholders
  (with "Loading" for screen readers) where the status, expected time, check-in desks, gate or belt will go, and the
  Demo labels those values carry; afterwards the **same elements** are filled in.
- `flight-summary.tsx`: the summary frame ("Your next step" and placeholders) is server-rendered and filled in place.
- `flight-detail.tsx`: one structure for both states, so React keeps the server elements: nothing large is painted
  later as a new block, and nothing above the fold moves when the status arrives. A placeholder holds the room of the
  needs control and timeline, so the footer does not jump up and back. When the feed fails before its first answer,
  only the notice and its retry remain, as before.
- 404s: `src/lib/providers/flight-route.ts` (the proxy) now also answers flight URLs at airports without a board
  (`/en/bbn/flights/…`) with its small 404. The page cannot set a 404 itself any more: the static start of the
  document is sent before it renders, so a `notFound()` there gave a 200 and Next.js's error document (tried on build 3).
  Unknown flights and airports were already answered by the proxy. The page keeps `MissingPage` for anything that
  gets through. Canonical: unchanged (flight pages are `noindex` and carry no canonical, as before).

**Verified.**

| Flight page (mobile, median of 3) | Performance | LCP | TBT | CLS | LCP element |
|---|---|---|---|---|---|
| Before, build 1, `ak6336-20261122-d` | 65 (73/56/65) | 5.32 s | 306 ms | 0.207 | the next-step summary |
| After, build 4, round four's URL `ak6336-20261121-d` | **95** (95/97/92) | **1.22 s** | 257 ms | 0.003 | the `h1` |
| After, `ak6336-20261122-d` | **95** (92/95/95) | 1.21 s | 261 ms | 0.003 | the `h1` |
| After, Malay `/ms/…/ak6336-20261122-d` | **93** (86/94/93) | 1.24 s | 317 ms | 0.005 (one run 0.125, below) | the `h1` |
| After, 5 more runs without a client header | 92 to 95 | 1.21 to 1.23 s | 252 to 351 ms | 0.003 | the `h1` |
| After, Lighthouse CLI directly (perf only x2, all categories x2) | 95, 91, 95, 94 | 1.21 to 1.24 s | 253 to 383 ms | 0.003 | the `h1` |
| After, `scripts/qa/lighthouse.mjs` (3 sets of 3) | 86, 86, 87 | 1.25, 1.27, 1.25 s | 381, 521, 476 ms | 0, 0.065, 0.065 | the `h1` |

- Observed (unthrottled) LCP 249 to 340 ms, the `h1`. First-flush checks on the final build: the `h1`, the summary
  frame and the card with "10:50" (MH 2626's scheduled time) are before the first hidden segment in English and
  Malay, for a departure and an arrival (e2e). Server render 35 to 45 ms per request (`curl`, total time).
- With the feed held back 3 s (e2e), every LCP entry is before the feed, and the summary paragraph and the status
  card are the server's own elements after it answers.
- HTML: 431,725 → 389,875 bytes (88.3 KB gzip; round four measured 96.7 KB).
- 404s on build 4 (proxy rule in the final tree, e2e): `/en/bbn/flights/mh1-…`, `/ms/tod/flights/mh1-…`,
  `/en/kul/flights/zz9999-…`, `/en/zzz/flights/mh1-…` all **404** with "We could not find this flight" / "Kami tidak
  menemui penerbangan ini"; no board search at airports without a board.
- `$RC` rule: the `h1` is never in a hidden segment (e2e reads the server HTML).

## 2. Board at night. Fixed

**Cause.** The board's frame was server-rendered with skeleton rows; at night the feed's answer replaced them with a new
"No departures between …" block, which was the largest text on the screen, so LCP waited for the scripts and the feed.

**Change.** `flight-board.tsx` takes a `loading` message. The explorer passes an `EmptyState` ("Loading the board" /
"Memuatkan papan", and what the board will hold: "Departures and arrivals from the last hour to six hours ahead, in
airport time"; no flight, nothing called live). It is server-rendered in one block of the skeleton's height, and the
empty state at night is rendered in **the same block and the same `EmptyState`**, so it fills what is already painted.
In the day, rows replace it as before. Two shifts this exposed are fixed: the status-filter row keeps a chip's height
when no status has flights (`board-toolbar.tsx`), and the board header keeps placeholders the size of the time window
and the Pause button until the feed answers. The empty state now offers **both** "Show earlier flights" and "Show
later flights", as its sentence says (only Earlier was offered).

| Board at 23:30 (mobile, median of 3) | Performance | LCP | TBT | CLS |
|---|---|---|---|---|
| Before, build 1 (English) | 74 (74/73/77) | 4.84 s | 338 ms | 0.003 |
| Build 2 (block in place; toolbar row still collapsing) | 92 | 0.92 s | 324 ms | 0.071 |
| After, build 4, English | **93** (91/94/93) | **0.93 s** | 328 ms | 0.009 |
| After, build 4, Malay | **90** (89/90/95) | **0.92 s** | 398 ms | 0.026 |
| After, `scripts/qa/lighthouse.mjs`, real clock 01:38 (empty window) | **95** (95/93/98) | 0.92 s | 248 ms | 0.003 |

The remaining Malay CLS is the title growing from one line to two ("Tiada penerbangan berlepas antara 23:20 dan 05:30").
e2e: the server HTML holds the loading block; with the feed held back 3 s at 23:30 the empty state is the server's
block, offers both steps, and every LCP entry comes before the feed.

## 3. Flight page first-load JavaScript. Fixed

**Change.** Below the status card, and the rare states, now load as their own chunks after the first paint: the
journey timeline (and its ops lines), the "My needs" control, the not-found and expired states (with the search box
and a board row), and the journey builder behind the summary (fetched alongside the feed); the calendar file builder
loads at idle with the Follow panel or on first use. `journey-preferences.ts` (new) splits the two helpers the summary
needs from `journey-timeline.tsx`, which re-exports them. The page no longer imports `FlightNotFound` on the server.
The shared shell and the icon registry (the speed package's) were only read.

| Route (gzip KB) | Build 1 | Build 4 |
|---|---|---|
| Flight page | 249.1 | **198.1** |
| Board | 229.2 | 197.4 |
| Flight page minus board (this package's share) | 19.9 | **0.7** |
| My journey | 246.0 | 212.1 |
| Airport overview / home | 230.2 / 229.5 | 196.2 / 195.6 |

The parts below the card are fetched while the feed loads, so they are there when it answers; no budget test was added
(the numbers depend on the build), the e2e paint checks cover the behaviour.

## 4. Density (A-14, 6.1.7). Fixed on the asked counts; chips partly

**Change.**
- `journey-timeline.tsx` (flight page and My journey): **one source list for the timeline** (`SectionSourceList`, each
  source naming the steps and notes it supports) instead of a toggle on every step and note; a run of simulated steps
  shares the Demo tag of its first step, a few lines above in the same view (boarding, then departure); on My journey
  from `lg` up the first simulated step has no tag of its own, since the demonstration banner sits directly above it
  (`leadingDemoTagClassName`); the flight page's timeline heading is `type-title-md` like its other section headings.
- `flight-summary.tsx`: no Demo label of its own; the banner capping the status card below is in the same view.
- `flight-status-hero.tsx`: the per-value Demo labels are hidden where the card is two columns wide (`@3xl`): there the
  banner is directly above the values. Phones keep them.
- `src/app/[lang]/[airport]/page.tsx`: the IATA and ICAO codes at the 20 px data step the page already uses for times,
  not a 24 px step of their own (the shared `KeyFact` unchanged: the value is passed as a span).

| | Provenance tags | Demo labels (max per view) | Source toggles | Filter chips | Type sizes |
|---|---|---|---|---|---|
| Flight page 390 | 21 → **18** | 9 → **6** (2 → **1**) | 7 → **2** (timeline 1, airline 1) | 5 → 5 | 9 → **8** |
| Flight page 1440 | 21 → **17** | 9 → **5** (3 → **1**) | 7 → **2** | 5 → 5 | 9 → **8** |
| My journey 390 | 17 → **15** | 7 → **5** (2 → **1**) | 6 → **1** | 5 → 5 | 8 → 8 |
| My journey 1440 | 17 → **14** | 7 → **4** (3 → **1**) | 6 → **1** | 5 → 5 | 9 → 9 (not in this item) |
| Airport overview 390 / 1440 | 10 / 10 | 3 (2) / 2 (1) | 6 / 6 | 0 | 9 → **8** / 9 → **8** |

Every gate, belt and check-in value still has a Demo label in view (the existing e2e check passes on both projects).
The overview's Demo labels and sources were not in this item.

## 5. Desktop CLS on airport section pages. Fixed

**Cause.** The layout's airport-header skeleton was the size of the compact bar only; from `md` up the real header also
has the section-tab row (48 px), so every section page moved down 48 px when React revealed the header.

**Change.** `src/app/[lang]/[airport]/layout.tsx`: the skeleton includes a 48 px row of tab placeholders from `md` up
(101 px in all, the real header's height, checked without JavaScript and after hydration).

| 1440 x 900, 3 loads | Before (build 1) | After (build 4) |
|---|---|---|
| `/en/kul/parking`, facilities, lounges, shop-dine, map, transit, `/en/pen/parking` | 0.0257 to 0.0265 (transit and PEN parking once 0.0004 / 0.0005) | **0.0004 to 0.0005** |
| `/en/kul/transport` | 0.0453 | 0.0197 (its fare row) |
| Board `/en/kul/flights` | 0.0445 | 0.0157 |
| Flight page | 0.0968 | **0.0045** |
| All the above at Pixel 7 | 0 | 0 |

Build 2 also showed site-header shifts (0.035 to 0.044) and a 44 px shift in the facilities content (0.35 in some
loads) from the other packages' work in progress; both were gone in build 4. e2e: on parking, map, transit and PEN
parking, layout shift inside `<main>` is at most 0.01 (round four: 0.025 to 0.026, all of it in `<main>`).

## 6. e2e A-03. Fixed

`e2e/shell.spec.ts`, the A-03 block only: each test sets its own client address through the trusted header
(`x-e2e-client-ip`, derived from project, title, repeat and retry), and waits for the search field to be hydrated
(React attached to the element) instead of for network idle. The assertions are unchanged. 30 of 30 with
`--repeat-each=5`, desktop and phone, on the final build (18 of 18 with 3 repeats on build 2). The new
`e2e/flight-round5.spec.ts` uses the same per-test addresses, so its requests do not use up the worker's limits (an
earlier version did, and two `flights.spec.ts` tests then got 429s on the phone project).

## Tests and checks

- New: `src/components/flights/flight-identity.test.ts` (3), two cases in `src/lib/providers/providers.test.ts`
  (airports without a board), `e2e/flight-round5.spec.ts` (13 tests per project: first flush, in-place fill and LCP
  before the feed, 404s, board at night, desktop shift on section pages, density counts with budgets: at most 1 Demo
  label per view, 1 timeline source list, at most 8 type sizes).
- Updated: A-03 (above). No test was weakened, skipped or deleted.
- `npx tsc --noEmit`: clean. `npx eslint` on the owned paths and specs: clean. `npx vitest run`: **568 passed** (39 files).
- Playwright on build 4 (`PLAYWRIGHT_BASE_URL=http://localhost:3252`, both projects, `--trace off`): `flight-round5`,
  `flights`, `trust`, `layout-round4`: **143 passed**, 5 skipped (4 are the desktop-only shift checks on the phone);
  `smoke` and `handoffs`: 52 passed, 2 skipped; A-03 x5: 30 passed. On the dev server (port 3242, desktop): the round 5
  spec and A-03, 16 of 16 (the two density tests after the wait described below).
- Screenshots looked at (7): flight page 390 live and without JavaScript, the board at 23:30 at 390 (dev); flight page
  1440, flight page 390 Malay dark, the board at 23:30 390 Malay dark, parking 1440 without JavaScript (final build).

## Changed after the last build (verified on the dev server only)

The fourth build was the last allowed. Two small changes came after it:
- `flight-summary.tsx`: the placeholder's link row is as tall as the "See this step" link on phones (44 px, it was 20)
  and keeps one more line for Malay. On build 4 the summary grew by 24 px (English) or 49 px (Malay) when it was filled,
  which explains the Malay run with CLS 0.125. On the dev server at 412 px with the feed held back, the layout shift on
  the English and Malay flight pages is now 0 apart from 0.0025 to 0.0047 in the site header (another package).
- `e2e/flight-round5.spec.ts`: the density test waits for My journey's source list, which loads after the steps.

## Trade-offs and decisions

- A client navigation to a flight page (a board row) now waits for the page's server render (35 to 45 ms locally)
  instead of showing a skeleton first; repeat visits are not cached on the server (deliberately, see item 1).
- Without JavaScript the flight page now shows the flight's timetable facts with placeholders (it showed a skeleton);
  the placeholders stay. The airport header still needs JavaScript to appear (unchanged).
- At night the board's status-filter row shows its "Status" label with no chips (it kept its height so the board does
  not move).
- Flight URLs at airports without a board get the proxy's small 404 instead of the full not-found page.

## Open

1. **`scripts/qa/lighthouse.mjs` and the flight page**: in its three sets the median performance was 86 to 87 (TBT
   381 to 521 ms; CLS 0.065 to 0.068 in 5 of 9 runs; two runs with LCP 3.6 s), while the same build gave 91 to 97 in
   15 other runs (performance-only driver with and without a client header, and the Lighthouse CLI directly with the
   same flags, all four categories included) with CLS 0.003 and LCP 1.21 to 1.34 s. The LCP element of every median
   run was the `h1`. Not explained here; the post-build summary fix removes the one shift found (24 to 49 px when the
   summary fills). Verification should re-measure on a quiet machine.
2. Night board CLS 0.021 to 0.026 in Malay (the empty-state title wraps to a second line).
3. "Fewer chips": the five "My needs" toggles stay; My journey at 1440 has 9 type sizes (not in this item); the
   overview has 2 Demo labels in one phone view (not in this item).

## Files

`src/app/[lang]/[airport]/flights/[flightId]/page.tsx`, `src/app/[lang]/[airport]/layout.tsx`,
`src/app/[lang]/[airport]/page.tsx`, `src/components/flights/{flight-detail,flight-status-hero,flight-summary,
flight-actions,flight-board,flight-board-explorer,board-toolbar,journey-timeline,my-journey}.tsx`,
`src/components/flights/{flight-identity,journey-preferences}.ts` (new), `src/components/flights/flight-identity.test.ts`
(new), `src/lib/providers/flight-route.ts`, `src/lib/providers/providers.test.ts`, `src/lib/i18n/features/flights.ts`
(two keys, English and Malay), `e2e/shell.spec.ts` (A-03), `e2e/flight-round5.spec.ts` (new), this log.

**Cross-package changes: none.** The shared components (`EmptyState`, `SectionSourceList`, `ProvenanceTag`, `KeyFact`,
`Skeleton`, `DemoDataBanner`) were used as they are. `.next-r5flight` and `.next-r5flight-prod` were deleted and the
four `tsconfig.json` lines Next.js added for them removed; `next-env.d.ts` points at another engineer's build folder
(theirs to restore). Processes started and stopped: builds 4514, 14157, 32698, 3435; servers 6650, 14818, 440, 3633
(with their children) and the dev server 10973.

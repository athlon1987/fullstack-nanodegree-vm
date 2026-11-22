# Fix log: round six, package "access" (resilience, focus and layout)

Scope: review-3 section 9.1 items 1 (pilot condition P8), 2 (congested Wi-Fi LCP, E-02), 3 (focus and the
statement, part of P10), 7 (hierarchy and density), 8 (Malay residuals), 9 (device font scaling) and 10 (low
items), with verification G8 items 2, 7, 8 and 9. Written 22 November 2026.

## How it was measured

- **Builds.** Three production builds in `.next-r6access-prod`, served with
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3271`: build 1 before any change (baseline),
  build 2 with items 1 to 6, build 3 with the fixes found on build 2 and `experimental.inlineCss` for item 7.
  The flag was then removed (item 7), so **the final code is build 3 without `inlineCss`**: that flag changes
  how the stylesheet is delivered, not layout or behaviour. Five small fixes came after build 3 and are checked
  on the dev server only (marked "dev" below; a production confirmation is due in verification).
- **Scripts** (scratch folder, outside the repository; Playwright Chromium 153, a fresh client address per
  context, service workers blocked): the chair's failed-chunk method (with MH 2626 saved, abort each lazy
  chunk one at a time on `/en`, `/en/journey`, `/ms`, `/ms/journey`, measure `<main>`, then unblock, send
  `online` and press "Try again"); page heights at 390 x 844 (100 and 125% text); overview and board
  positions; Demo markers seen per half-screen view of the board (below the stuck header); A-14 type sizes
  (the acceptance scripts' method) with a saved flight; a Malay word-break scan (every word of 4 or more
  letters, and every number range, whose text spans two lines, on 17 Malay pages at 360 and 390 px and 125%
  text, closed `<details>` and clipped text excluded); `html{font-size:200%!important}` at 320, 360, 390 and
  1280 px; the map route; layout-shift sources. Repository scripts: `scripts/qa/acceptance-round5.mjs board`
  (night board CLS), `scripts/qa/lighthouse.mjs` (3 runs, medians), `scripts/qa/first-load-js.mjs`.
- **Tests.** `npx tsc --noEmit` clean; `npx eslint` on every owned path and the specs below clean;
  `npx vitest run` 42 files, 608 tests, all pass (new: 2 in `src/lib/retrying-import.test.ts`, 2 in
  `src/components/common/keep-ranges.test.ts`). E2E against build 3 (`PLAYWRIGHT_BASE_URL=http://localhost:3271
  --trace off`, desktop 1440 x 900 and Pixel 7 390 x 844): the new `e2e/access-round6.spec.ts` plus
  `flights`, `guides`, `shell`, `layout-round4`, `speed-round5`, `map`, `transport`, `platform`, `trust`,
  `smoke` (all passed on build 3), and the other package's `commerce`, `handoffs`, `concierge`, `corporate`,
  `ask-round4`, `ask-round6`, `flight-round5`, `polish-round5` (234 passed, 0 failed) to catch shared-component
  regressions. `access-round6.spec.ts` passed on build 3 except 4 runs, all dealt with after the build: the
  desktop-fold test also ran in the phone project, where touch rows are taller (it now runs on the desktop
  project only); the 200% test at 390 px in the desktop project found the footer wordmark 12 px too wide and the
  Malay night-board test found CLS 0.093 (both fixed, checked on the dev server: items 5 and 6).
- **Screenshots looked at** (12): Malay transit at 360 px and 125% (before), the desktop board before, during
  and after, the home with a failed card script, the phone overview, the Malay desktop board, the map route on a
  phone in dark mode, a Malay transport card, the Malay transit controls at 360 px and 125%, the Malay home at
  200% text, the flight summary with Fast Track.

## 1. Resilience of lazy parts [P8]. **Fixed**

**Before (build 1, the chair's method).** With a saved flight, 2 of 14 lazy chunks on `/en` and 2 of 10 on
`/en/journey` each replaced the whole `<main>` (4,955 to 95 characters, "Something went wrong"); `/ms` and
`/ms/journey` the same (5,752 and 6,358 to 117). After unblocking, the `online` event and "Try again", all
eight still showed the error.

**After (builds 2 and 3).** 0 of 13 chunks on `/en` and `/ms`, 0 of 10 on `/en/journey` and `/ms/journey`.
With the card's script failing, `<main>` keeps 4,886 of 4,955 characters: the card's place says "This part has
not loaded yet because the connection dropped. It loads by itself when the connection is back." with its own
**Try again**, which fetches the script afresh; the `online` event does the same by itself.

What changed:
- `src/lib/retrying-import.ts`: `retryingImport` now records each failed import that is waiting
  (`subscribeWaitingImports`, `getWaitingImports`) and `retryWaitingImports()` fetches them again at once (a new
  `import()`, never the rejected promise); `retryableLazy(load)` is `React.lazy` over `retryingImport` with a
  `renew()` that makes the next render import afresh.
- `src/components/common/part-boundary.tsx` (new): `PartBoundary`, an error boundary the size of a card or
  control ("This part of the page could not be shown. The rest of the page still works." + Try again, which
  calls `renew` and remounts), and `PartLoading`, the Suspense fallback that shows the waiting message and Try
  again once a fetch has failed. Copy in `platformPages.part` (en and ms).
- Every `React.lazy` that renders on load or on use now goes through `retryableLazy` (or `retryingImport`) inside
  a scoped boundary: the home saved-flight card (`home/saved-flight-slot.tsx`), My journey's clear control
  (`flights/my-journey.tsx`), the follow panel and the calendar builder (`flights/flight-actions.tsx`; a failed
  calendar fetch now says "We could not load this" instead of an unhandled rejection), the search box's site
  results and topic line (`flights/flight-search-box.tsx`), the flight page's timeline, needs control and
  not-found state (`flights/flight-detail.tsx`; the needs anchor stays on the failure message), and the global
  overlays (`shell/global-overlays.tsx`: retrying imports, a `.catch` on the idle preload, a silent boundary).
- The offline toast no longer waits for the runtime (G8 item 8, gallery note 3): the connection and worker state
  moved to `platform/connectivity.ts` (re-exported by `sw-client.ts`), `ConnectionNotice` to
  `platform/connection-notice.tsx`, rendered by `PlatformRuntimeLazy` in the first load; the lazy runtime keeps
  the update prompt. Before the worker is registered, a page the worker already controls counts as saved.

Tests: `e2e/access-round6.spec.ts` item 1 (home and My journey, English and Malay, every lazy chunk failing:
the page keeps its `h1` and text, no "Something went wrong"; on the home "Try again" brings the saved card; on
My journey the `online` event brings the real clear control, which opens its dialog; "You are offline" appears
with the runtime's script failing). The existing round-five tests in `e2e/speed-round5.spec.ts` still pass.

Not changed (another package): `src/components/concierge/concierge-panel.tsx` loads `ConciergeChat` with a plain
`React.lazy`. It now sits inside the overlays' silent boundary, so a failed fetch closes the panel instead of
the page, but it should use `retryingImport` too (recommendation to the ask package).

## 2. Focus and the accessibility statement [part of P10]. **Fixed** (statement: one sentence needs the ask package's fix confirmed)

- `InPageFocus` (`shell/route-focus.tsx`, mounted once by `GlobalOverlays`): after a click or Enter on a link to
  another part of the same page, once the browser has scrolled, focus moves to the target (`tabindex="-1"` where
  it is not focusable, no second scroll). When the target is a placeholder that a lazy part replaces under the
  same id (the flight page's needs control), focus follows to the part. Links handled by a script
  (`preventDefault`) are left alone. It covers every in-page link in the site, including those in pages I do not
  own (parking's "calculator" link, corporate jump navigation), without touching their files. Checked: "My
  needs" on the flight page (focus inside `#needs-control`), the hub's contents in both languages (focus on
  `#statement`, `#not-published`), all owned links found by `grep href="#` (map "Skip to the list of places",
  transport and transit anchors, facilities placeholders, guides, the footer's back-to-top).
- Statement (`src/lib/i18n/features/guides.ts`, en and ms), every sentence checked against the build:
  "Last reviewed 22 November 2026, after the sixth round of fixes"; "A link to another part of the same page,
  such as "My needs" on a flight page or the list at the top of this page, moves focus to that part"; the
  magnification sentence now describes what the code does: the page leaves room for the header and, on the
  concierge page, for the question box when it scrolls to the focused item, including at 125% browser zoom on a
  laptop or desktop screen; in short windows (200 and 400% zoom) and at the site's larger text sizes the header
  and the phone's bottom bar slide away and the question box stays in the page. "Automated checks ... on every
  page we build" was not true (axe runs on each kind of page, not all 280): now "on each kind of page in the
  site, in English and Bahasa Malaysia, at desktop and phone sizes". The Malay text is written for a Malay
  reader, not translated word for word.
- **Verification must confirm** the concierge half of the magnification sentence at 125% zoom of 1280 x 720 and
  1440 x 900 (the ask package's composer fix, `scroll-padding-bottom` in `concierge-chat.tsx`); the header half
  holds through the existing `scroll-padding-top`.
- Tests: `e2e/access-round6.spec.ts` item 2; `e2e/layout-round4.spec.ts` statement test updated for the new
  date and sentences (an intended change).

## 3. Hierarchy and density. **Fixed**, except the English home `h1` (left for the brand owner, OOS-08)

| Measure (390 x 844 unless stated) | Before (build 1) | After (build 3) |
|---|---|---|
| Overview: "Find a flight at KLIA" (en / ms, 100% text) | 2,236 / 2,388 px | 406 / 406 px |
| Same at 125% text | 3,362 / 3,707 px | 570 / 648 px |
| Overview notices heading (still in the first phone screen) | 435 px | 677 px |
| Board 1440 x 900, bottoms of the first five rows (en and ms) | 850, 902, 954, 1,039, 1,091 | 650, 702, 754, 837, 889 |
| Rows above the 900 px fold | 1 | 5 |
| Demo markers seen per view, board 390 (all / "penang") | up to 3 / 7 | 1 / 1 |
| Same at 1440 | up to 6 / 18 | 1 / 1 (and never 0 on the board) |
| Type sizes, home with a saved flight, 390 / 1440 (en and ms) | 9 / 10 | 7 / 8 |
| Type sizes, My journey with a saved flight, 1440 | 9 | 8 |
| Facilities height, en / ms (125% text) | 15,451 / 16,039 (21,242 / 22,656) | 13,368 / 13,808 (19,047 / 20,083) |
| Accessibility hub, en / ms | 12,273 / 13,162 (17,614 / 19,186) | 10,636 / 11,459 (15,582 / 16,969) |
| Transport, en / ms | 11,952 / 12,734 (16,938 / 18,735) | 7,961 / 8,455 (11,532 / 12,629) |
| Map after choosing a route (390): drawing in view | 0 of 495 px | all of it (pointer); 389 to 407 of 555 px when a keyboard user's field must stay in view |
| Route chip over a place label (8 phone, 4 desktop cases) | 6 and 2 | 0 and 0 |

- **Overview** (`app/[lang]/[airport]/page.tsx`, `airport/airport-flight-tools.tsx`): the flight search is its own
  section before the notices (`AirportFlightSearch`); journey modes and the board preview stay below.
- **Board fold** (`app/[lang]/[airport]/flights/page.tsx`, `common/page-header.tsx` new `compactOnDesktop`,
  `flights/flight-board.tsx`, `flight-board-explorer.tsx`): from `lg` the lead sits beside a smaller title and the
  breadcrumb is left out (the airport bar above names the airport and marks Flights); the demonstration banner
  is one line on this board (title, "Do not use this data to plan travel", the link; the full sentence stays for
  assistive technology); the board header is one row at every width (its heading is read out; the selected tab
  names the direction); tighter tabs and gaps. The toolbar's row breakpoint is now a container query in rem.
- **One Demo marker per view** (`flight-board.tsx`): the hour headers no longer carry a label each. One label
  floats over whichever hour header is stuck at the top (a sticky layer the height of a header) and shows only
  once the banner has scrolled away, so every view of the board has exactly one.
- **Type sizes**: `DemoTag` small uses the caption size (13 px) like `ProvenanceTag` (its own 12 px was the ninth
  size); board and large network card titles use the card title size (22 px was the tenth at 1440); My journey's
  "Saved flights" uses its section title size.
- **Shorter pages** (`common/more-on-phones.tsx`, new; `globals.css`): a native `<details>` disclosure, open in
  the server HTML (so all content shows without JavaScript and nothing in the first screen moves), with its
  summary hidden from `md` (or in a wide card) and closed after loading on phones when it is below the window and
  not the target of the link. Used for a transport card's hours, boarding points, payment and accessibility
  (`transport/transport-option-card.tsx`), a facility's access, area and operator when there are two or more or
  the access text is long (`facilities/facility-card.tsx`; location, level, hours and accessibility stay
  visible), the fourth and later cards of a long facility group when no filter is chosen
  (`facilities/facilities-directory.tsx`; a link to a card inside opens it), and on the hub the Calm Room places
  and the statement's tests and limitations (`app/[lang]/accessibility/page.tsx`).
- **Map** (`map/map-canvas.tsx`, `map/map-explorer.tsx`): the level-change buttons ("To Gates") are in a strip
  above the drawing, "The route continues:", so nothing floats over a place or its label; on phones a completed
  route scrolls the drawing up under the header (for a keyboard user only as far as keeps the focused field in
  view; focus never moves).
- **"Saved" state label** (`flights/flight-actions.tsx`): the pressed save button reads "Saved" / "Disimpan"
  (still `aria-pressed="true"`, as the commerce "Saved to my journey" button). `e2e/flights.spec.ts` updated
  (intended change).
- **Overflow cue** (`flights/board-toolbar.tsx`): an edge fade on each side of the phone filter strip that has
  more chips (`data-overflow-start` / `-end`), as on the section tabs.
- **Fast Track in the international flight summary** (`flights/flight-summary.tsx`): for a departure with a Fast
  Track record (both KLIA terminals), a line "Optional: Fast Track · See Fast Track · Booking site ↗", the
  booking link carrying `data-handoff="fast-track-booking"` like the overview's and the timeline's; no price or
  hours (not published).

Tests: `e2e/access-round6.spec.ts` item 3 (overview order, five rows above the fold on the desktop project, one
Demo marker in every view at 390 and 1440, the strip's overflow attributes, Fast Track hand-off, the map
drawing in view with no floating chip, disclosures closed on a phone and open without a summary on a desktop,
at most 8 type sizes at 390 and 1440).

## 4. Malay residuals. **Fixed** in owned components (one string is the ask package's)

- Word-break scan, 17 Malay pages at 360 and 390 px and 125% text: **30 before** (360: transit 11 — "Antarab /
  angsa", "Domesti / k", "Terminal", "tempahan", "berasingan", "penerbangan" —, transport 2, facilities 2,
  map 1, the hub's theme control 4, board 1, flight page 1; 390: transit 3, hub 3, flight page "737-800" and
  "4-12") **to 0 on build 3**. `SegmentedControl` wraps whole options to a new row when their words do not fit,
  and every option is at least as wide as its longest word (`ui/segmented-control.tsx`); the facility card title
  is never narrower than its longest word (`facility-card.tsx`); the transit estimate pair stacks when narrow
  (`guides/transit-planner.tsx`); the board's compact header column keeps its words (`flight-board.tsx`).
- Non-breaking ranges: `keepRanges` (`common/keep-ranges.tsx`, unit-tested) keeps "kaunter 2-7", "1–18",
  "07:05–08:00" and "737-800" on one line, in the summary, the status card, the step lines and the timeline.
- One name for Pulau Pinang: flight titles use the city in the page language (`flights/flight-title.ts`), so the
  `h1` reads "AK 6336 ke Pulau Pinang" as the board does (and "MH 2626 ke Singapura"; `e2e/flights.spec.ts`
  updated, intended change).
- "penerbangan yang disimpan": My journey's heading and count (`features/flights.ts`). The concierge's privacy
  row "Susunan kata AI dan penerbangan simpanan" is in `features/concierge.ts` (ask package): **not changed**,
  recommended to that package.

## 5. Device font scaling (root font size 200%). **Fixed**

Before (build 1): at 390 px the bottom bar's labels overlapped (1 pair in English, 3 in Malay) and its Menu item
was off screen; at 1280 px the page scrolled 44 px sideways (the footer's phone number and e-mail); on a
non-touch browser at 390 px the header ran 33 px off screen. After (build 3, plus two dev-checked fixes): 0 px
sideways scroll, 0 overlaps and nothing off screen at 320, 360, 390 and 1280 px on `/en`, `/ms`, `/en/kul`,
`/ms/kul/flights`. Changes: `ScrollChrome` compacts the chrome (icon-only bottom bar, labels kept for
assistive technology, slide-away while scrolling) when the root font size is 18 px or more, whatever set it
(`shell/scroll-chrome.tsx`); bar items have no 44 px minimum width of their own (`mobile-bar.tsx`); the header
name gives way to the mark when the header is under 14 rem (`site-header.tsx`); footer columns fit the text size
and addresses break where they must (`site-footer.tsx`, dev); the footer wordmark may take two lines (dev); the
search box's "Search arrivals instead" link wraps instead of being cut by its card at 200% (dev). Tests:
`e2e/access-round6.spec.ts` items 8 and 9 (390 and 1280).

## 6. Low items. **Partly fixed**

- **Night board CLS at 1440 px** (`acceptance-round5.mjs board`): en **0.0226 → 0.0096** (build 3). Causes found:
  the status strip shrank to its label when every count was 0 and the search grew; the centred loading title was
  replaced by a longer one; the freshness line was right-aligned and grew leftwards. Fixes: at night the chips
  keep their room, invisible (`board-toolbar.tsx`); the loading and empty states start at the left from `sm`
  (`flight-board-explorer.tsx`); the freshness line starts after the time window, Pause at the right edge.
  Malay measured **0.093 on build 3** (worse than 0.041): with counts, the invisible chips grew wider and wrapped
  the strip. Fixed after the build (the invisible chips keep their pre-feed width): **0.0064 on the dev server**
  (en 0.0055). **Needs a production confirmation**; `e2e/access-round6.spec.ts` item 10 asserts 0.01 or less.
- **Header airport switcher shift after hydration: not fixed.** Unchanged at 0.0004 (en, 1440) and 0.0012 (ms).
  Cause: the server HTML says "Choose airport" (170 px en, 214 ms) because the remembered airport is in this
  device's storage; after hydration "KUL KLIA" is 75 to 112 px, and the right-aligned group moves. A fixed width
  would leave a wide empty button; the clean fix is an early inline script (like `EARLY_MODE_SCRIPT` in
  `src/lib/inline-scripts.ts`, not in this package) that marks the stored choice before first paint so the
  placeholder can take the chosen layout. Recommended to the platform owner.
- **Rate-limit-sensitive test** (`e2e/flights.spec.ts` "announces a change to a saved flight once"): its own
  client address (`ownClientAddress`, as A-03), assertions unchanged. Passed on builds 2 and 3; not repeated with
  `--repeat-each=10` (no server left within the build budget), so the 14-of-20 repeat case is fixed by
  mechanism, not yet by measurement.
- Also seen: the overview at 1440 px now measures CLS 0.0013 (0.0105 before; the notices no longer move under
  the search).

## 7. Congested Wi-Fi LCP (E-02): `experimental.inlineCss`. **Not kept** (numbers recorded)

`experimental.inlineCss` exists in Next.js 16.4.6 (`config-shared.d.ts`; docs `05-config/01-next-config-js/
inlineCss.md`). Lighthouse 13.6 with `scripts/qa/lighthouse.mjs`, 3 runs each, medians (per run in brackets),
same session, build 2 (without) against build 3 (with):

| Page, profile | LCP without | LCP with | Performance | TBT |
|---|---|---|---|---|
| `/en`, airport-wifi (250 ms, 1.5 Mbit/s, 4x CPU) | 2,606 ms (2,640, 2,537, 2,606) | **1,624** (1,736, 1,567, 1,624) | 82 → 93 | 451 → 276 |
| Board, airport-wifi | 2,665 (2,746, 2,665, 2,652) | **1,544** (1,545, 1,544, 1,503) | 83 → 92 | 330 → 328 |
| `/en`, mobile default (slow 4G, 4x CPU) | 1,074 (1,074, 1,078, 1,068) | **1,287** (1,317, 1,153, 1,287) | 96 → 94 | 213 → 271 |
| Board, mobile default | 913 (913, 911, 916) | **1,223** (1,197, 1,251, 1,223) | 96 → 95 | 216 → 259 |

CLS stayed 0 to 0.005. It cuts the congested Wi-Fi LCP below 2.5 s on both pages, but it slows the normal mobile
profile by 213 and 310 ms on every run: Next.js sends the styles twice, in a `<style>` in the head and again
in the RSC payload, so `/en`'s HTML is 98.8 KB gzip with inlining (53.5 KB without, verification G2) and the
stylesheet is no longer cached between pages. By the brief's rule (keep it only if it does not harm the normal
profile) it is **not kept**; `next.config.ts` records the result. The `$RC` rule was not re-checked because the
flag is off. Remaining options, not tried: a smaller critical stylesheet for the first paint, or the CDN's
early hints / `103` for the stylesheet (deployment).

## Cross-package changes

None in another package's files. Shared components that other packages' pages use, changed here and checked with
their specs on build 3 (234 passed): `SegmentedControl` (options wrap), `DemoTag` small (13 px), `FlightBoard`
(heading size, compact header, one Demo marker), `PageHeader` (an opt-in prop), `InPageFocus` (every page),
`MoreOnPhones` (new). The concierge `React.lazy`, the concierge's "penerbangan simpanan" string and the
switcher's early script are recommendations above, not changes.

**First-load JavaScript** (`first-load-js.mjs` on build 3): the shell grew by about 2 KB gzip (the connection
notice now in the first load, the scoped boundaries, in-page focus); with the other package's changes, routes over
170 KB went from 21 (verification G2.5) to 35 of 39 (smallest 167.2 KB). After build 3 the
overlays use a small local boundary instead of `PartBoundary`, so the shell does not carry its message (not
measured). E-03 was already failing; this round makes it slightly worse in exchange for P8.

## Clean-up

Servers stopped by PID (builds 1 to 3 on port 3271, the dev server on 3261). `.next-r6access` and
`.next-r6access-prod` deleted, their lines removed from `tsconfig.json`, `next-env.d.ts` pointed back at `.next`,
Playwright's `test-results/` removed. Scripts and screenshots stayed in the scratch folder.

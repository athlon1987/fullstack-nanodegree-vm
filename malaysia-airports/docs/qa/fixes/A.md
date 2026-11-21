# Fix log: package A (shell, home, search and design system)

Round: fix round after the QA and panel evaluation, resumed on 20 and 21 November 2026 after the
first attempt stopped on a usage limit (its file list: `docs/qa/fixes/_interrupted-attempt.md`).
The resumed round reviewed every file that attempt changed against the backlog, kept what met the
acceptance criteria, fixed what it got wrong, and finished the rest.

**Result:** 25 fixed, 6 partially fixed, 0 not fixed. No file outside package A's owned paths
was changed in either attempt.

## How it was verified

- Own dev server: `NEXT_DIST_DIR=.next-A npx next dev -p 3201` (stopped by PID; `.next-A` deleted).
  No `next build` was run, so numbers that only exist in a production build (Lighthouse TBT, CLS
  from Lighthouse, RSC prefetch counts) are left for the verification engineer and marked below.
- `npx tsc --noEmit`: clean in package A. One error at the time of the last run is in
  `src/components/map/route-planner.tsx` (package C, being edited in parallel).
- `npx eslint` on every package A path: clean.
- `npx vitest run`: 31 files, 442 tests, all passing (420 before this round; new tests in
  `sections.test.ts` and `search.test.ts`).
- Playwright against the dev server, `e2e/shell.spec.ts` and `e2e/smoke.spec.ts`, desktop and
  phone projects: 82 passed, 6 skipped (desktop-only or phone-only tests, and the first-board-row
  test kept as `fixme` for package B), 4 failed. The 4 failures are not package A defects:
  - A-16 reflow, `/en/kul/parking` (both projects): package C's new
    `src/components/parking/parking-price-matrix.tsx` (changed at 00:31 during this round) makes
    the page 439 px wide at 320 px and 125% text. It passed earlier in the round. Hand-off below.
  - Smoke "unknown pages answer 404" (both projects): `next dev` answers 200 for an unknown path;
    the test is written for `next build && next start` (Next.js notes, section 5). Expected in dev.
- Measurement scripts (Playwright, run against port 3201) for positions, hit areas, contrast,
  layout shift, font bytes and sideways scrolling; 8 screenshots looked at (390x844 parking and
  saved-flight home, 360x800 Malay flights at 125% text twice, 1440x900 home, 1440x900 KLIA dark,
  360x800 Malay home, 320x640 journey at 125% text).

## Bugs found and fixed during verification (not in the backlog wording)

These came out of re-testing the first attempt's work and are part of A-09, A-16 and A-01:

1. **A query typed before hydration stayed on "Loading" forever.** The flight pool was only built
   on the form's focus or input handler, which is not attached yet. The pool is now also wanted
   whenever the (deferred) query has two characters (`flight-search-box.tsx`).
2. **A journey mode tapped before hydration was silently undone** (React resets a controlled radio
   when it hydrates; this is the evaluator's "3 of 6 early taps did not change the radio"). A tiny
   inline listener records the tap during HTML parsing and `JourneyModes` applies and announces
   it once hydrated (`journey-modes.tsx`).
3. **Overlays opened early were closed again.** `CloseOnNavigation` ran its effect on mount and
   closed a switcher or menu opened by an early tap. It now closes only on a real change of path
   (`global-overlays.tsx`). Early taps on the header switcher, search and menu buttons (desktop
   and bottom bar) are now also recorded before hydration and replayed (`data-early-overlay`).
4. **"KLIA" broke one letter per line** in the compact airport bar at 360 px and 125% text, and
   **"Choose airport" broke letter by letter** in the header at 320 px and 125% text (the first
   attempt's `overflow-wrap: anywhere`). The bar is now a size container that drops the boxed code
   and shows "Sections" as an icon when narrow; the header hides the wordmark's name visually (the
   link keeps its accessible name) when no airport is chosen and space is short.
5. **Quick-action tiles' accessible name started with "Start here"**, not with the destination.
   The badge is now `aria-hidden` and announced after the title.

## Findings

### A-01. Airport chrome pushes answers below the first phone screen (P0). Partially fixed

- **Changed:** first attempt built the one-row `AirportBar` (code, terminal, clock, Sections
  control) and `AirportChrome` (full banner on the overview only) in
  `src/components/airport/airport-bar.tsx`, `airport-chrome.tsx`, `airport-header.tsx`,
  `section-nav.tsx`, `src/app/[lang]/[airport]/layout.tsx`, `src/components/common/breadcrumbs.tsx`,
  `page-header.tsx`. This round: the bar no longer squeezes the airport name at 125% text
  (container queries in `airport-bar.tsx`).
- **Verified:** `e2e/shell.spec.ts` "A-01": h1 top at or above 200 px and bar at most 56 px on 8
  section pages x English and Malay x 360x800, 390x664, 390x844 (pass); full banner only on the
  overview (pass); new test: the h1 is never under the fixed bottom bar at 125% text at 360x800 and
  390x664 (pass). Screenshots 390x844 and 360x800 Malay at 125%.
- **Open:** "first board row inside the first 664 px" fails: the first row is at 881 px (English)
  and 902 px (Malay) at 390x664 because of the board's own tabs, search, status filters and demo
  banner, which belong to package B (B-03, B-16). The test stays `test.fixme` with that note.

### A-02. Header airport switcher fails Label in Name (P0). Fixed

- **Changed (first attempt, kept):** the switcher's name is the visible text plus a visually hidden
  ", change airport (currently …)" (`airport-switcher.tsx`, `shellExtras.switcher.changeSuffix`
  in `en.ts` and `ms.ts`).
- **Verified:** axe with wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa plus
  `label-content-name-mismatch` reports 0 violations on `/en/kul`, `/en/kul/flights`, `/ms/kul/map`
  and `/en/concierge` with an airport chosen (desktop and phone).
- **Dependency:** `e2e/support/axe.ts` (E-06) does not exist yet, so `shell.spec.ts` keeps the same
  tag list locally, with a comment to switch to the shared import when E lands it.

### A-03. Home search is flights-only; Enter does nothing (P0). Fixed

- **Changed:** first attempt: inline site results after flights, "See all results for …", Enter
  opens one exact flight or `/search?q=` (`flight-search-box.tsx`,
  `src/components/search/inline-site-results.tsx`, `src/lib/search/*`). This round: the pool is
  built for any typed query (bug 1 above).
- **Verified:** `shell.spec.ts` "A-03": "parking" and "arrival card" in English and Malay show site
  results and the "See all results" link, and Enter opens `/<lang>/search?q=`; "KUL-PEN" opens the
  site search and one exact flight number opens that flight, now in English and Malay. The demo
  board changes daily, so the flight number is taken from KLIA's own examples rather than a fixed
  "MH2072". The live-region count is kept ("1 flight found").

### A-04. Demo label out of view on phone previews; banner crowds flight pages (P0). Fixed

- **Changed (first attempt, kept):** `src/components/common/demo-tag.tsx` (one-line "Demo" tag,
  name "Demonstration data", and a sticky marker for preview lists), compact one-line banner in
  `demo-data-banner.tsx` at narrow widths, used in `board-preview.tsx`, `home-sections.tsx`,
  `search-results.tsx` and the search box.
- **Verified:** in-view check (each row scrolled to the centre, visible demo markers counted):
  100% of rows on `/en`, `/ms`, `/en/kul`, `/en/search?q=MH` at 390x844; narrow banner at most
  48 px with the name "Demonstration data" on `/en/kul/flights`. Runs in both Playwright projects.

### A-05. Focus falls to body after an in-page link (P0). Fixed

- **Changed (first attempt, kept):** `src/components/shell/route-focus.tsx` moves focus to the new
  h1 (or main) after a pathname change, never on load, never out of a dialog or a field.
- **Verified:** `shell.spec.ts` "A-05": after Enter on a link in main (`/en/kul` to the map, `/en`
  to "Shops and food", `/en/guides` to My journey) focus is in main and the next Tab stays in main.

### A-06. Search palette: active option and field focus (P0). Fixed

- **Changed (first attempt, kept):** focus-colour outline plus inset bar on the active option and
  the standard ring on the field wrapper (`command-palette.tsx`).
- **Verified:** script in light, dark, light high contrast and dark high contrast: the outline and
  the field ring are solid in the focus colour, 6.92:1, 7.95:1, 9.47:1 and 11.06:1 against the
  palette surface (neighbouring options are transparent on that surface). `shell.spec.ts` "A-06".

### A-07. Tiles and navigation fall back to the overview (P0). Fixed

- **Changed (first attempt, kept):** `sectionHref` and `primaryNavHref` lead to
  `/airports/not-published?airport=…&section=…` (new `src/app/[lang]/airports/not-published/page.tsx`
  and `not-published-section.tsx`, with the official site and phone), tiles say
  "<section>: not published for <airport>".
- **Verified:** `sections.test.ts`: 39 airports x 9 sections, no section link lands on the
  overview; primary navigation at every airport. `shell.spec.ts` "A-07": Subang parking tile.

### A-08. The home ignores the saved flight (P0). Fixed

- **Changed (first attempt, kept):** `saved-flight-slot.tsx` and `saved-flight-card.tsx` above the
  journey modes, with a parse-time flag script so the server HTML reserves the height.
- **Verified:** `shell.spec.ts` "A-08" (saved from the board, card above the modes). Screenshot
  390x844: status, terminal, gate, "Be at the airport by" and the next step in the first screen.
  CLS with a saved flight was not re-measured on a production build (left for verification).

### A-09. Home hydration blocks the main thread; early taps lost (P0). Partially fixed

- **Changed:** first attempt: no flight pool during render (built on focus, keystroke or idle in
  `startTransition`), board preview follows the direction at low priority, search engine and
  palette loaded on demand. This round: the pool follows the direction switch through
  `useDeferredValue`; per-overlay subscriptions (`useOverlayOpen`, a selective `useOverlayDialog`
  in `overlay-store.ts`) so opening the switcher no longer re-renders every panel and trigger
  (`header-tools.tsx`, `mobile-bar.tsx`, `airport-switcher.tsx`, `global-overlays.tsx`); early taps
  on journey modes, the switcher, search and menu are kept (bugs 2 and 3 above).
- **Verified:** new `shell.spec.ts` "A-09 early taps" holds the JavaScript back 1.5 s and taps
  before hydration: the Arriving mode stays chosen and drives arrivals; the switcher opens; a query
  typed early gets results. All pass.
- **Open:** TBT at or under 200 ms (Lighthouse, 4x CPU) and the 200 ms Event Timing targets need a
  production build; not measured in this round.

### A-10. Display font not preloaded; Malay h1 rewraps (P0). Fixed (production numbers pending)

- **Changed (first attempt, kept):** `src/fonts/index.ts`: Fraunces upright preloaded with
  `display: 'optional'` (no late swap, so no rewrap), italic file no longer loaded, Geist Mono not
  preloaded; the home headline uses the upright face in colour (`home-sections.tsx`).
- **Verified (dev server):** layout shift on `/en` and `/ms` at 390x844: 0.000 with fonts normal and
  with Fraunces blocked. At 1440x900 the only large shift (0.29) is the dev-only `loading.tsx`
  fallback being replaced by the streamed page (the footer moves); the shifts from the page itself
  total 0.001. Fonts downloaded on `/en`: 125 KB (Fraunces 67, Hanken Grotesk 35, Geist Mono 23).
  Lighthouse CLS on the production build is left for verification.

### A-11. Fixed chrome covers content at large text (P0). Fixed

- **Changed (first attempt, kept):** `scroll-chrome.tsx` hides the header on scroll down and
  collapses the bottom bar below 640 px height or at 112-125% text; the search button sits inside
  the bar; padding and scroll padding match (`globals.css`, `mobile-bar.tsx`, `site-header.tsx`).
- **Verified:** `shell.spec.ts` "A-11": at 320x568 and 125% text, fixed chrome takes at most 15% of
  the viewport while scrolling. Screenshots at 390x844 (tile labels clear of the bar).

### A-12. Search vocabulary and ranking (P0). Fixed

- **Changed:** first attempt: bilingual synonym table, facility-intent weights that demote news,
  map places and airline records indexed, "not published" results for accessible parking, hearing
  loops, money changers and trolleys (`src/lib/search/engine.ts`, `documents.ts`). This round:
  a "Fast track: not published yet" result that steps aside once a real Fast Track record is
  indexed (D-02), so "fast track" and "laluan pantas" no longer return 0 or a Labuan airport hit;
  a "not published" result only leads when the visitor typed its topic, not through a synonym
  ("wheelchair" and "buggy" now lead with the reduced-mobility guide in Malay too). Strings:
  `shellExtras.searchGaps.fastTrack` in `en.ts` and `ms.ts` (it states no fact about the airports).
- **Verified:** `search.test.ts`: first result asserted for 18 queries in English and 7 on the Malay
  index; fast track (record or honest gap, both languages); synonym-only gaps never lead.

### A-13. Section tabs clipped; Malay bar labels crowd (P0). Fixed

- **Changed (first attempt, kept):** tabs without icons, edge fades and scroll buttons when they
  overflow, active tab scrolled into view (`section-nav.tsx`); shorter Malay bar labels
  (`mobile-bar.tsx`, `ms.ts`).
- **Verified:** `shell.spec.ts` "A-13": all tabs fit at 1280 and 1440 in both languages on four
  pages; Malay bottom-bar labels one line at 360 px. Screenshots: 1440 dark KLIA tabs, 360 Malay home.

### A-14. Provenance chips and micro-labels compete with answers (P0). Partially fixed

- **Changed:** first attempt: one tag set ("Official", "Estimated", "Suggestion", "Demo"/
  "Demonstration data", "Not published"); sources behind a small marker (icon and count, a native
  disclosure, works without JavaScript) in `source-note.tsx`; `NotPublishedList` in
  `not-published.tsx` for one muted line per card. This round: mono capitals removed from prose
  micro-labels on the home and in shared primitives (`journey-modes.tsx`, `notice-strip.tsx`,
  `common/quick-action.tsx`, `ui/segmented-control.tsx` now use `type-caption`).
- **Verified:** DOM count at 390 px: Facilities 21 tags, 21 source markers, 20 "not published"
  items, 8 type sizes; Transport 8 tags, 8 markers, 14 "not published", 9 type sizes; Map 9 sizes.
- **Open:** the 40% reduction on Facilities and Transport needs package C to adopt
  `NotPublishedList` in facility, lounge, outlet and car-park cards, and package D to retag records
  that use "instruction" for facts (hand-offs in the backlog). Transport and Map exceed 8 type sizes
  through their own components (package C).

### A-15. Assistance not in the desktop header (P1). Fixed

- **Changed (first attempt, kept):** "Assistance" in the utility bar beside the language switch and
  Display settings (`site-header.tsx`), in the primary navigation registry (`sections.ts`) and in
  the first group of the phone Menu (`panels.tsx`), both languages ("Bantuan khas").
- **Verified:** `shell.spec.ts` "A-15" at 1280 (English and Malay) and 390 (Menu). The phone test
  now waits for hydration before tapping Menu.

### A-16. Large text clips content and scrolls sideways at 320 px (P1). Partially fixed

- **Changed:** first attempt: provenance tags wrap, home network cards wrap. This round: `Button`
  labels wrap with minimum heights instead of fixed heights (one-line buttons keep their exact
  size; `ui/button.tsx`, and `design-system/interactive.tsx` which overrode the height); long
  unbroken words (an e-mail address) break at the edge inside main (`globals.css`); `Skeleton` never
  exceeds its container (`ui/skeleton.tsx`); the header no longer spills "Choose airport"
  (`site-header.tsx`, `art/wordmark.tsx`, `airport-switcher.tsx`).
- **Verified:** script on 16 pages (home EN and MS, KLIA overview, flights, transport, parking,
  facilities, map, shop and dine, lounges, help, journey, guides, concierge, search, airports) at
  320x640 and 125% text, light and dark high contrast: no sideways scrolling (before this round:
  `/en/help` 335 px, `/en/journey` 355 px). The e2e reflow check now covers 15 of those pages.
- **Open:** at the last run `/en/kul/parking` is 439 px wide because of package C's new
  `parking-price-matrix.tsx` table (hand-off below). Every other page passes.

### A-17. Overlapping controls on the home first screen (P1). Fixed

- **Changed (first attempt, kept):** the journey mode sets the direction with one small
  "Search arrivals instead" / "Search departures instead" link (`flight-search-box.tsx`); the
  airport is chosen once, in the header; tiles use section nouns ("Transport") and the strip card
  says "Getting to the airport".
- **Verified:** smoke test "a journey mode switches the board direction" and screenshots at 1440
  and 390.

### A-18. Arriving mode lacks the entry checklist (P1). Fixed

- **Changed (first attempt, kept):** `arrival-checklist.tsx` shows the Arriving guide's
  "Before you land" MDAC step from the content record with its tag, sources, as-of date and a link
  to the guide (`home-sections.tsx`); no fact in interface strings.
- **Verified:** rendered in Arriving mode only (code review and smoke run); text comes from
  `GUIDES` via `pick()`.

### A-19. Viewport prefetching costs 40-235 KB (P1). Partially fixed

- **Changed:** first attempt: `LocaleLink` prefetches on hover, focus or touch instead of on entering
  the viewport, never with Data Saver or on 2G/3G; only the bottom bar's Flights and Journey are
  prefetched up front. This round: the airport section tabs and the phone Sections panel use
  `LocaleLink` (they were plain `next/link` with viewport prefetching: nine per airport page), and
  the terminal chips (same page, another query) never prefetch.
- **Open:** prefetch counts and bytes only exist in a production build; not measured in this round.

### A-20. KLIA overview buries the notice; preview leads with gate-closed flights (P1). Fixed

- **Changed (first attempt, kept):** notices directly under the airport header
  (`src/app/[lang]/[airport]/page.tsx`); `preview-filter.ts` keeps departures from now + 15 minutes
  and drops gate-closed, departed and cancelled flights.
- **Verified:** at 390x844 the notices heading is at 435 px and the first notice at 487 px, in
  English and Malay; `preview-filter.test.ts`.

### A-21. One destination, many labels (P1). Partially fixed

- **Changed:** first attempt: one noun per section in tiles, tabs and navigation (`en.ts`, `ms.ts`).
  This round: `sections.test.ts` also checks that each section page's h1 uses the tab's noun.
- **Verified:** the test passes for map, facilities, parking, shop and dine and lounges in both
  languages, and for tabs, tiles and navigation.
- **Open:** three page titles in other packages' dictionaries still use another noun and are listed
  in the test with their owner: flights "Departures and arrivals" (B), transport "Getting to and
  from {airport}" (C), transit "Connecting at {airport}" (D). Delete an entry when aligned.

### A-22. Focus ring invisible on the demo banner in dark themes (P1). Fixed

- **Changed (first attempt, kept):** the focus colour is redefined inside the banner to its own ink.
- **Verified:** script: the focused banner link's outline is 11.10:1 against the banner in light,
  dark, light high contrast and dark high contrast.

### A-23. Single-key "/" shortcut (P1). Fixed

- **Changed (first attempt, kept):** "/" removed; Ctrl or Cmd + K remains (`global-overlays.tsx`).
- **Verified:** `shell.spec.ts`: "/" does not open search; the palette test opens it with Ctrl+K.

### A-24. English citations on Malay pages lack lang="en" (P1). Fixed

- **Changed:** first attempt: on Malay pages titles and publishers carry `lang="en"` and an "EN"
  marker. This round: our own pages cited as sources (for example "How this concept prototype
  estimates and labels guidance") were missed; they now get the same treatment (`source-note.tsx`).
- **Verified:** new `shell.spec.ts` "A-24": every citation on `/ms/kul/parking` is inside
  `lang="en"`. Code search: `SourceNote` is the only component that renders source titles; package
  C's `outlet-card.tsx` renders a publisher name inside a Malay sentence ("via …"), hand-off below.

### A-25. Malay wording (P1). Fixed

- **Changed (first attempt, kept):** "penerbangan berlepas" instead of "pelepasan", "Ruang menunggu
  (lounge)", one concierge term "Concierge" in `ms.ts`.
- **Verified:** `sections.test.ts` "Malay wording". Package B's `features/concierge.ts` uses the same
  term ("Tanya concierge"). Native sign-off remains OOS-14.

### A-26. The 39-airport chooser does not pin KLIA (P1). Fixed

- **Changed (first attempt, kept):** `airport-directory.tsx` pins the last-used airport, KLIA
  Terminal 1 and Terminal 2 as large buttons above the filters.
- **Verified:** at 390x844 with Penang remembered: Penang at 372 px, KLIA T1 at 438 px, KLIA T2 at
  502 px (all at least 56 px tall).

### A-27. Home flight-preview links are 26 px tall (P1). Fixed

- **Changed:** the preview rows are stretched links (the whole row is the target); this round the
  journey teaser's flight link is 44 px (`journey-teaser.tsx`).
- **Verified:** new `shell.spec.ts` "A-27": every preview row's hit area is at least 44 px at 360 px
  and 125% text. Scan of `/en` and `/en/kul` at 360 px and 125% text: no target under 44 px in the
  preview, the teaser or the terminal shortcuts (one inline link inside a sentence on `/en/kul` is
  exempt).

### A-28. Grammar in demo copy (P1). Fixed (A's strings)

- **Changed:** "These flights are simulated. Do not use them to plan travel." (first attempt). This
  round: the banner's "Do not use it to plan travel." had no antecedent and now reads "Do not use
  this data to plan travel."; Malay "Jangan gunakannya" replaced by "Jangan gunakan penerbangan ini
  …" and "… data ini …" (`en.ts`, `ms.ts`).
- **Open (hand-offs):** concierge transfer template (B), parking calculator "Entry"/"Exit" (C),
  "Calm Room (Terminal 1)" (D).

### A-29. Home shop and dine filters lost (P1). Fixed

- **Changed (first attempt, kept):** filters travel as `?filters=` through the switcher
  (`shop-dine-strip.tsx`, `overlay-store.ts` `thenQuery`); only filters that can return an outlet
  are offered. Package C's `commerce-view.ts` parses `?filters=` (its unit test covers it).

### A-30. Breadcrumb structured data unused (P1). Fixed

- **Changed (first attempt, kept):** `breadcrumbs.tsx` emits a matching `BreadcrumbList`.
- **Verified:** new `shell.spec.ts` "A-30": `/en/kul/parking` has exactly one `BreadcrumbList`
  whose names and positions match the visible trail, with absolute URLs for linked items.

### A-31. The lang cookie lacks Secure (P1). Fixed

- **Changed (first attempt, kept):** `Secure` on https (`language-switch.tsx`). The `__Host-` prefix
  was not adopted, because `src/proxy.ts` (package E) reads `lang`.

## Hand-offs raised in this round

- **C:** `src/components/parking/parking-price-matrix.tsx` makes `/en/kul/parking` 439 px wide at
  320 px and 125% text (the row header "Terminal 2 car park (gateway@klia2)" and the rate columns do
  not wrap): wrap it in `TableScroll` or let the cells wrap. Adopt `NotPublishedList` (A-14). Align
  the transport page title (A-21). `outlet-card.tsx`: wrap the publisher in `lang="en"` on Malay
  pages (A-24).
- **B:** the flight board's toolbar and banner keep the first row below 664 px (A-01); flights page
  title "Departures and arrivals" (A-21).
- **D:** transit page title (A-21); retag "instruction" on facts (A-14); Fast Track record (D-02)
  will replace the honest gap result automatically (A-12).
- **E:** publish `e2e/support/axe.ts` (E-06); `shell.spec.ts` then imports it instead of its local
  copy.
- **Verification engineer:** production-only numbers for A-08 (CLS with a saved flight), A-09 (TBT,
  Event Timing), A-10 (Lighthouse CLS) and A-19 (prefetch count and bytes).

## Files changed in the resumed round

`src/components/shell/overlay-store.ts`, `global-overlays.tsx`, `header-tools.tsx`,
`mobile-bar.tsx`, `airport-switcher.tsx`, `site-header.tsx`, `sections.test.ts`;
`src/components/flights/flight-search-box.tsx`; `src/components/home/journey-modes.tsx`,
`journey-teaser.tsx`, `mode-quick-actions.tsx`, `notice-strip.tsx`;
`src/components/common/source-note.tsx`, `quick-action.tsx`, `demo-data-banner.tsx` (comment);
`src/components/ui/button.tsx`, `skeleton.tsx`, `segmented-control.tsx`;
`src/components/art/wordmark.tsx`; `src/components/design-system/interactive.tsx`;
`src/components/airport/airport-bar.tsx`, `section-nav.tsx`; `src/app/globals.css`;
`src/lib/search/documents.ts`, `engine.ts`, `search.test.ts`; `src/lib/i18n/en.ts`, `ms.ts`
(appended `shellExtras.searchGaps.fastTrack`; reworded `demo.doNotPlan` and the Malay
`shellExtras.homeSearch.doNotPlan`); `e2e/shell.spec.ts`.

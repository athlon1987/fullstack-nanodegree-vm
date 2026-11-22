# Redesign round one: airport frame, overview, flight board, flight page, My journey, airports

Date: 22 November 2026. Package: flights (the airport pages' frame, the airport overview, the
departures and arrivals board, the flight page, My journey and the airports directory) in Direction
v2 (`docs/design/direction.md`, `docs/design/design-system.md`). Owned paths only; the one change
outside them is listed under "Outside my paths".

The client's verdict was "basic": beige, text-heavy, icon-and-outline cards, no pictures, little
hierarchy. This round replaces the look of these pages and keeps every feature, route, piece of
content, data source, honesty label, accessible name and test hook.

## What changed

| Area | Before | Now |
|---|---|---|
| Airport frame (every page under `/[lang]/[airport]`) | A pale grey bar with a boxed code, plain text tabs with an underline | **Overview:** a cinematic midnight header: the airport's photograph (`heroForAirport`, preloaded) or, while the library is empty, a branded midnight with a warm gold light, a field of songket stars and the airport's **own** line drawing (never another airport's picture); a gold kicker, the name in display type, and the code, local time and terminal choice as refined pills. **Section pages:** a slim midnight band (same picture behind a veil, or the pattern): a gold code pill, the short name, the time pill and the terminal pills; at most 55 px on phones as before. **Section tabs:** an app-like pill bar (the current section an ink pill), **sticky** under the site header from `md` up, horizontally scrollable with edge fades and round scroll buttons where more tabs wait |
| Airport overview | Banner, search, eight long notice cards in two columns, a long "services" panel, icon tiles | The flight search sits **on the hero** (first phone screen); **At a glance** tiles (Flights "Demonstration board, not live", Getting here "9 ways", Parking "4 car parks", each with its honest note); **Services now** as tiles (Aerotrain, inter-terminal train, shuttle, immigration with the demo queue estimates and their Demo label); notices as an **elegant one-line list** (severity badge, title, state chip; body, period, provenance and sources behind a disclosure); explore sections as **large visual cards** (tinted art header, big icon, count; two to a row on
phones, title only there); Fast Track as midnight cards; facts and contacts restyled |
| Flight board | Table and stacked rows on the board surface, shape-coded v1 chips | Table: **airline code badge** with the flight number, the place in **large type**, the gate in large mono with its terminal badge, a **colour `StatusPill`** (icon and words). Phones: **one card per flight** (place and status on the first line, airline badge and number, terminal and gate). Gold sticky hour headings; banner and board one rounded, lifted panel; on wide screens "Show earlier flights" moved into the board's header row (more rows above the fold) |
| Flight page | Page title, a long "next step" frame, a dark status panel | A **midnight header band** (the airport's picture or pattern) with the breadcrumbs, a gold eyebrow and the `h1`; the next step as **smoky glass** on the band; a **boarding-pass card** rising into the band's edge: status pill (40 px), airline badge, **From/To codes as large as the heading**, the times in a raised well, and a perforated **stub** with terminal, the **gate in display type**, check-in, boarding and gate-close times |
| Day-of-travel timeline | The generic timeline primitive | A **polished vertical journey** (its own item in `journey-timeline.tsx`): a time rail, a node on a thread, states by shape and words: done (filled check), past (muted open circle, solid thread), **now** (gold-ringed node with a breathing dot, a raised card and a gold "Now" pill; `aria-current="step"`), **next** (ink ring, a card and a "Next" pill), upcoming (open circle, dotted thread) |
| My journey | Plain white cards | **Ticket cards**: a midnight top (airline badge, day and airport in gold, the flight as a link, the time large in the board's gold, status pill, terminal and gate) and the **next step on a warm gold band** (the deadline in large mono, then "Now"/"Next"); the selected card lifts. **Empty state:** a midnight panel with the line drawing of the remembered airport (or the generic terminal), three steps as glass cards with gold numbers, one gold call to action, then the flight search |
| Airports directory | 39 equal outline cards and a pale map | **Photo-led cards** for airports with their own photograph and, while the library is empty, for the airports with a full guide (their own line drawing on midnight); a **refined list** for the rest (midnight code tile, name, place, depth chip); quick links as cards; the network map as a **night chart** on midnight (land in the fill tone, international airports in gold, legend to match) |

New pieces (all in owned paths): `src/components/airport/airport-backdrop.tsx` (the picture or
pattern behind the airport header, a Server Component), `src/components/flights/flight-status-pill.tsx`
(`FlightStatusPill`: the v2 `StatusPill` from the status model, with `data-status`; `AirlineBadge`),
a `tiles` variant of `OpsStatus` (and `OpsStatusSection`), a `compact` mode of `NoticeList`, an
`onMedia` prop on `AirportFlightSearch`, a `band` prop on `FlightDetail`, a `beforeClassName` prop on
`FlightBoard`, a `photos` prop on the airports directory. Copy appended to
`src/lib/i18n/features/flights.ts` as `flightPages.look.*` in English and Malay. The board, the
flight card, My journey and the flight search now use `StatusPill` (through `FlightStatusPill`);
`FlightStatusChip` stays in `src/components/common` for other pages.

## Photography

The photo library is empty (Wikimedia refused the research requests; see the photo library's own
report). Every surface is built for both cases and was looked at only in the "no photograph" case:

- `heroForAirport(slug)` (the airport's own photograph, else the Malaysia fallback, never another
  airport's) feeds the overview hero (preloaded, `fetchPriority="high"`, decorative because the name is
  the heading, a short credit in the corner), the section band and the flight page band (not preloaded,
  behind a 72 % veil). Words over a photograph sit on `scrim-behind`; pills on `glass-dark`.
- The directory's photo-led cards take only an airport's **own** photograph (`AIRPORT_HERO_IMAGES`),
  resolved on the server and passed as plain props, so `images.ts` stays out of the browser bundle.
- Without a photograph the same boxes show the branded pattern and the airport's own line drawing
  (`AirportVignette`), so there are no empty or broken frames and nothing shifts when photos arrive.

## Keep list (checked)

- **Texts, names and hooks** the e2e suite queries are unchanged: `data-airport-chrome` (`full` and
  `compact`, now `display: contents` so the pill bar can stick; Playwright treats them as visible
  through their children), `#airport-search-title`, `#airport-notices-title`, the "Services now"
  region and its lines and `data-ops-*`, `li#<notice> article[data-severity]` with the state chip
  visible while collapsed, `data-status` on every status, `data-demo-marker`, `data-board-state`,
  `data-flight-hero`, `data-flight-summary`, `#flight-status-title` ("Flight status"),
  `data-step`/`data-step-warning`, `data-deadline`/`data-next-step`, `data-airport`/`data-depth`,
  the "Show earlier flights" name (one visible at any width), "View flight …" link names, the
  `MH 2626 to Singapore</span></h1>` markup.
- **Honesty labels:** the demonstration banner caps the board and the flight card; one Demo label per
  view (the floating label on the hour headings is unchanged); the Flights tile says "Demonstration
  board, not live"; the queue estimates keep their Demo label; notices keep only demo or official
  tags (no "Estimated" chip); provenance tags on every timeline step, note and place.
- **Static shell:** no clock or random values in render, no page-level Suspense. The flight page's
  `h1` is in the band, server HTML, inline (`instant = false` unchanged); the overview stays fully
  static. The layout's header skeleton matches the new band and pill bar (same heights).
- **Sticky offsets:** from `md` up the airport layout sets `--spacing-sticky` to the site header plus
  the 48 px pill bar inside `[data-airport-page]` (and 48 px while the header is slid away), so the
  board's hour headings, the facility filters and the map stick **below** the bar instead of under it.
- **Motion:** every transform is `motion-ok:` (hover lifts, the arrow nudge, the breathing "Now"
  dot), every duration a token, so the system and the site's reduced-motion settings stop them.

## Measurements (dev server, `NEXT_DIST_DIR=.next-flights`, port 3283)

- **Five rows above a 900 px fold** (`/kul/flights`, 1440 × 900, clock 2026-11-18 09:40): fifth row
  bottom **861 px** in English (was 899 before moving "Show earlier flights" into the header row) and
  **882 px** in Malay (its header wraps to two lines). First board link on a 390 × 664 phone: **633 px**
  (limit 664).
- **Type sizes** (A-14, at most 8): overview **8** at 390 and 1440 px (one 12 px kicker found and
  moved to the 13 px caption step); flight page **7** at both widths; My journey 9 → **8** (the saved
  card's time moved from 24 to 20 px). **Demo labels per view:** 1 on the flight page and on My
  journey at both widths; one timeline source list.
- **axe** (WCAG 2.0 to 2.2 A and AA tags): **0 violations** on `/en/kul`, `/en/kul/flights`, the flight
  page, `/en/journey` (with a saved flight), `/en/airports`, `/en/kul/parking` and `/ms/kul`, in light
  and dark, at 1440 × 900 and 390 × 844 (28 runs).
- **Layout shift inside `<main>`** (desktop, the flight-round5 method): `/en/kul/parking`,
  `/en/kul/map`, `/en/kul/transit`, `/en/pen/parking` **0.0000**. The board measures 0.030 in dev; the
  same 0.030 with the header's "Show earlier flights" disabled, so it is not from this change (the
  window placeholder and the status chips gaining their counts when the feed answers).
- **Checks:** `npx tsc --noEmit` clean (final run; an earlier run showed two errors in
  `src/components/home/home-sections.tsx`, another package mid-way); `npx eslint` on my paths clean;
  `npx vitest run` 614 passed, 1 skipped (one concierge property test timed out under load in the full
  run and passes alone).
- **e2e against my dev server** (`PLAYWRIGHT_BASE_URL=http://localhost:3283`): desktop
  `access-round6`, `flight-round5`, `trust`: 54 of 55 passed, the one failure (the flight page's
  summary within 10 s) passes alone; phone `shell`, `access-round6`, `flight-round5`: 52 passed,
  8 failed under load (page-load timeouts at two workers), of which the A-01 headings on phones, the
  flight page heading and A-16 reflow pass when re-run alone; the others are the home search (A-03)
  and the map route, not in this package. Desktop `flights`, `ask-round6`, `smoke`, `handoffs`
  (filtered to boards, flights, journey, notices, directory and airports; 62 tests): 61 passed; the
  one failure was real and is fixed: axe found the search count inside the **selected**
  Departures/Arrivals tab in `ink-2` on the v2 ink pill (the count now takes the tab's own colour;
  the test passes). Midway, my dev server's `prerender-manifest.json` was corrupted by concurrent
  writes (every page 500); the server was restarted on a clean `.next-flights` and the runs above
  are from after that.

## Outside my paths

None. (`globals.css`, the shell, `common/` components and the UI primitives were not edited; the
sticky offset is set on the airport layout's own wrapper.)

## Open

- **Photographs.** Nothing was seen with a real photograph. When the library has entries, look at
  the overview hero (scrim over the title block, credit), the section and flight bands (veil) and the
  directory cards, light and dark, in both languages.
- **Board CLS 0.03 in dev** when the feed answers (pre-existing sources, above): worth a measurement
  on a production build.
- **`FlightStatusChip`** remains in `common/` for pages outside this package (home board preview uses
  `FlightBoard`, so it already shows the new pills).
- The board's page heading is still the shared `PageHeader`; if that component grows, re-measure the
  five-row fold (21 px of margin in Malay).

# Fix log: round four, layout, density, accessibility and measurement

Package: layout (re-review `docs/qa/panel/re-review.md` 6.1.6, 6.1.7, 6.1.9 and 6.1.10, with the evidence in
`re-review-design.md`, `re-review-inclusion.md` and `re-review-business.md`, and gallery note 1 in
`docs/prototype/README.md`). Worked in parallel with the trust and ask packages in the same folder, on a private dev
server (`NEXT_DIST_DIR=.next-r4layout next dev -p 3233`, with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip` and
`METRICS_STORE_FILE` in the session scratch folder), stopped by PID and removed at the end. No build was run, `.next`
was not touched and no git command was run.

## Summary

| # | Item | Status |
|---|---|---|
| 1 | Answer-first and placement (6.1.6) | **Fixed** (transport fare, transit verdict, map controls and disclaimer, sticky offsets at 400%, clipped chips, Malay mid-word breaks). One residual: at 125% text in Malay the fare sits at 881 px, just under a 844 px phone screen |
| 2 | Density (6.1.7, A-14) | **Fixed** on the pages this package owns: source toggles −48% (facilities), −56% (transport), −63% (transit); at most 8 type sizes; map tags −55%. **Not changed on parking** (owned by the ask package; only the shared type step applies there): recommendation below |
| 3 | Measurement (6.1.9, E-17) | **Fixed**: Fast Track on facilities, lounge operators' pages and rail tickets are measured hand-offs with campaign parameters; durable aggregate store (file or KV adapter behind one interface), documented |
| 4 | Accessibility statement (6.1.10) | **Fixed** in English and Malay. The accessibility contact and response time **need MAHB data**: MAHB publishes neither in our sources, so the statement says so and gives the official general feedback contacts |
| 5 | Gallery: React #419 on three 404s | **Fixed in the code, verified on the dev server's HTML; the production status code needs a production run** (see the item: the mechanism is the one round 3 verified on a build) |

Checks: `npx tsc --noEmit` **0 errors**; `npx eslint` on every path below **0 problems**; `npx vitest run` **554 of
554** (36 files; a first run had one failure in the concierge engine's property test, which passed alone, 58 of 58,
and in the full rerun: the intermittent failure the trust log also saw, in the ask package's area). New unit tests: 8 for the metric
store, 2 for `sectionSources`; one existing test updated (below). e2e on the desktop project against this package's
dev server: `e2e/layout-round4.spec.ts` (new) **16 of 16**; `map`, `transport`, `guides`, `commerce`, `handoffs`
**56 passed, 2 skipped**; `shell`, `smoke`, `platform`, `concierge`, `trust`, `flights`, `ask-round4` **126 passed,
4 skipped, 2 failed** (the two dev-server-only 404 checks the trust log records; see "Verification").
Screenshots looked at: 12 (listed under each item).

Before and after figures are this package's own measurements on the dev server with Playwright's Chromium
(`getBoundingClientRect` plus the scroll offset, 390 x 844 unless stated), so they differ by a few pixels from the
panel's.

---

## 1. Answer-first and placement (6.1.6). Fixed

### 1.1 Transport fare above the warning

**Before.** The KLIA Ekspres fare was at **1,658 px** (English) and **1,846 px** (Malay), after the lead, two stacked
buttons, the 400 px touting warning and the planner's controls (panel: 1,821 and 1,955 px).

**After.** A fare row, "Published fares to KL Sentral", sits under the page heading: the cheapest published
*scheduled* fares (trains and coaches, at most two rows) to the most widely served place, each with today's fare, the
journey time, the dated change ("RM 65 from 1 Jan 2027") and a link to the option's full card. Taxi and e-hailing are
left out on purpose, so the touting warning still comes before every taxi and e-hailing option (C-02), and the note
says where they are ("Taxis, e-hailing, sources and dates are below"). The two jump links ("Changing terminals",
"Driving? See parking") became one row of links under the answer (they were two stacked 56 px buttons above it).
Before the clock is read the row lists every dated fare, as the cards do; nothing is shown as current that is not.

| Fare top | Before | After |
|---|---|---|
| English, 390 x 844 | 1,658 px | **433 px** |
| Malay, 390 x 844 | 1,846 px | **495 px** |
| Malay, 125% text | (not measured) | 881 px (h1 at 230 px; one residual) |
| English, 1440 x 900 | (not measured) | 554 px |

Files: `src/components/transport/transport-glance.tsx` (new), `src/app/[lang]/[airport]/transport/page.tsx`,
`src/lib/i18n/features/transport.ts` (`glance`, `transport.jumpsLabel`). Screenshots: `t-before-en` (390x844),
`t-after-en` (390x844). Test: `e2e/layout-round4.spec.ts` "transport: the KLIA Ekspres fare…" (English and Malay).

### 1.2 Transit verdict in view

**Before.** The verdict card was under a five-question form (panel 1,186 px; here 1,349 px), so changing an answer
changed something off screen.

**After.** A one-line verdict summary ("Very tight · Our estimate 55 min to 1 h 50 min; your time 45 min · See the
plan") is the first thing in the form on phones. It sticks under the header while the form scrolls past, and does
not stick on short windows (under 40rem, so not at 400% zoom). The form's fields keep clear of it when focus scrolls
them into view (`scroll-margin-top`, WCAG 2.4.11). It is not a live region (the form's status line already announces
changes). Hidden from `lg`, where the full card sits beside the form.

| | Before | After |
|---|---|---|
| Verdict on load (doc top) | 1,349 px | **454 px** (summary) |
| While the layover select is in use | off screen | summary at **64 px** in the viewport, showing the new verdict |

Files: `src/components/guides/transit-planner.tsx` (`VerdictSummary`), `src/lib/i18n/features/guides.ts`
(`time.summary`, `time.summaryLink`). Screenshot: `transit-en` (390x844, layover changed to 45 min). Test: "transit:
the verdict summary stays in view…".

### 1.3 Map: route controls above the map; the disclaimer never covered

**Before.** On a phone From and To were at **1,742 px**, below the map, and the "To Gates" level chip covered the
"Schematic demonstration map, not a floor plan" label: the chip's position was clamped to 44 px from the top of the
drawing, but it hangs above that point (`translate -100%`), so it landed on the label.

**After.**
- The disclaimer is a strip above the drawing (`data-map-disclaimer`), not an overlay inside it, so no chip, pin or
  label can ever cover it; the chip clamp now keeps the chip's top edge inside the drawing.
- `RoutePlanner` has a `part` prop: the controls (From, To, step-free, clear) and the result ("Your route": times,
  step-free answer, written steps) render as two blocks. Phone order, which is also the DOM order at every width:
  search, From and To, the map, the route, the filters. On desktop the map stays sticky in the right column.

| 390 x 844, route KLIA kerb to Gates C | Before | After |
|---|---|---|
| From select | 1,742 px | **544 px** |
| Drawing starts | 935 px (route chosen 800 px below it) | 1,006 px (right under the controls) |
| Elements overlapping the disclaimer | 1 ("To Gates", 192–284 x 948–977) | **0** |

Files: `src/components/map/map-canvas.tsx`, `src/components/map/map-explorer.tsx`, `src/components/map/route-planner.tsx`,
`src/lib/i18n/features/map.ts` (`route.resultTitle`). **Test updated (behaviour changed on purpose):**
`e2e/map.spec.ts` now finds the steps in the "Your route" region and the From/step-free controls in "Directions"
(they were one region). Screenshots: `map-before` (390x844), `map-after2` (390x844, scrolled to the controls),
`map-desk-dark` (1440x900, dark). Test: "map on a phone: From and To come before the drawing…".

### 1.4 Sticky offsets that follow the header at 400% zoom (WCAG 2.4.11)

**Before.** At 320 x 256 the header slides away while scrolling (`ScrollChrome`), but sticky elements kept
`top: var(--spacing-header)`: the board's hour heading floated 56 px down with rows showing above it, and the
concierge's question form stuck at 115 to 184 px, mid-screen, hiding most of a focused suggestion.

**After.**
- New token `--spacing-sticky` (utility `top-sticky`): the header's height while it shows, **0 while it is slid
  away**. Every sticky offset this package owns uses it (facility filters, map, outlet directory and details,
  transit form, guide contents, the Demo marker track), and so do the board's hour headings (cross-package, below).
- New `--spacing-sticky-bottom`: the phone bar's height while it shows (4.5rem; 2.75rem compact; 0 while slid away).
  Anything marked `data-sticky-bottom` stops sticking on windows under 40rem high.

Measured at 320 x 256 after scrolling: header hidden, `--spacing-sticky` **0px**, the stuck hour heading at
**0 px** (was 56 px); the concierge composer `position: static` (was sticky at 115–184 px). Keyboard pass on the
concierge at 320 x 256: 40 Tab stops, the least visible focused element **100%** visible. Screenshot: `zoom-board`
(320x256). Test: "at 400% zoom (320 x 256) sticky content follows the header…".

### 1.5 Chips that wrap instead of clipping (A-16)

**Before.** At 320 x 568 and 125% text, 7 "Estimated" tags on `/en/kul/facilities` were clipped to "Estimatec": the
tag sat in a 98 px column between the card's icon and its save button, and `ProvenanceTag` had `overflow-hidden`.

**After.** The facility card's tags (provenance and terminal) get their own full-width row under the title, and
`ProvenanceTag` no longer clips (the hazard stripe rounds its own corners). Clipped tags: **7 → 0** in English and
Malay; page width 320 px (no sideways scroll). Files: `src/components/facilities/facility-card.tsx`,
`src/components/common/provenance-tag.tsx`. Screenshot: `fac-320` (320x568, 125%). Test: "facilities at 320 px and
125% text…".

### 1.6 No Malay mid-word breaks

**Before** (360 px, 125% text, a word whose letters land on two lines): `/ms` 7 ("Penerbang|an", "Pengangk|utan" in
the mode tiles, "penerba|ngan" in the search helper squeezed to 64 px, "Lapangan antarabangsa" in the network
figures, the footer address `break-all`), `/ms/kul` and every airport page 1 (the footer address).

**After: 0** on `/ms` and `/ms/kul` at 100% and 125%, and on the 10 other Malay pages checked (transport, facilities,
map, transit, shop and dine, lounges, guides, accessibility, parking, flights). Changes: the footer address breaks
only after a dot, `@` or slash (`<wbr>`); the home's mode tiles keep three a row only while each is at least 6.25rem
wide (rem follows the text size), so Malay and 125% text get two a row; the search helper has a 11rem basis and the
link wraps under it; the network figures wrap to two columns when narrow. Screenshots: `home-ms` (before),
`home-ms-after` (360x800, Malay, 125%). Test: "Malay at 360 px and 125% text: no word breaks mid-word…".

---

## 2. Density (6.1.7, A-14). Fixed on owned pages; parking left to its owner

**Changes.**
- **One source list per section.** `SourceNote` takes `label` ("Sources for this section") and `citedBy` (under
  each source, "For: Plaza Premium Lounge, Travel Club Lounge"), so one list replaces a toggle on every card
  without losing which source backs which card. `sectionSources()` (`src/components/common/section-sources.ts`)
  builds it; `SectionSourceList` renders it. Applied to every facilities section, the transport planner (cards and
  table), between and inside the terminals, the transit steps and the transit page's three fact sections. Each card
  keeps its own "As of" date when a section's dates differ.
- **Tags only where they change the decision.** A tag is said once per section where most items share it
  (`ProvenanceDefault`), and items keep one only when they differ: the terminal-transfer note, the transit steps, and
  each map level's place list (where "Demo" marks an illustrative pin: one "Demo unless marked" per level instead of
  one per place). The 7 "Estimated" facility tags stay: each tells the traveller to confirm with the operator.
- **Type scale.** `type-data-md` is 14 px (the body-small size) instead of a 15 px step of its own.

| 390 x 844 | Source toggles | Provenance tags | "Demo" labels | Type sizes |
|---|---|---|---|---|
| Facilities | 21 → **11** (−48%) | 8 → 8 | 0 | 8 → **7** |
| Transport | 9 → **4** (−56%) | 6 → **5** | 0 | 9 → **8** |
| Transit | 16 → **6** (−63%) | 22 → **20** | 1 → 1 | 6 → 6 |
| Map (place list) | 1 → 1 | 42 → **19** | 18 → **4** (one per level) | 7 → 7 |
| Parking (ask package) | 8 → 8 | 8 → 8 | 5 → 5 | 8 → **7** |

A-14's target (40% fewer source toggles; at most 8 type sizes) is met on facilities, transport and transit.
**Parking (not changed, owned by the ask package; recommendation):** pass `groupedSources` to its car-park cards and
add one `SectionSourceList` under the list (8 → 1 toggles), and drop the per-card `ProvenanceTag provenance="demo"`
beside the availability chip, since the compact `DemoDataBanner` above the list already marks it (5 → 1 Demo labels).

Files: `src/components/common/{source-note.tsx,section-sources.ts,section-source-list.tsx,provenance-tag.tsx}`,
`src/components/facilities/{facilities-directory.tsx,facility-card.tsx}`,
`src/components/transport/{transport-planner.tsx,transport-option-card.tsx,transport-table.tsx,terminal-transfers.tsx}`,
`src/components/guides/{transit-planner.tsx,fact-card.tsx}`, `src/app/[lang]/[airport]/transit/page.tsx`,
`src/components/map/place-list.tsx`, `src/app/globals.css`, `src/lib/i18n/{en,ms}.ts` (appended
`shellExtras.sourceLists`). Tests: `src/components/common/section-sources.test.ts` (2), e2e "one source list per
section…" and "the map list states each level's shared tag once…".

---

## 3. Measurement (6.1.9, E-17). Fixed

**Hand-offs.** Marked with `data-handoff` (the analytics script adds `utm_source`, `utm_medium`, `utm_campaign` on
click and sends the aggregate beacon):

| Link | Before | After |
|---|---|---|
| Fast Track "Open the official site" on `/en/kul/facilities` (T1 and T2) | unmarked, no parameter | `fast-track-booking` (as on the overview and the timeline) |
| Lounge operators' pages on `/en/kul/lounges` (3) | unmarked | `lounge-operator` |
| Rail and coach "Tickets on the operator's website" on transport | unmarked | `rail-tickets` / `bus-tickets` |
| Lost & Found and other official pages on facilities | (unmarked) | still unmarked: they sell nothing |

Verified in the browser: each click opened the stubbed host with `utm_campaign=<name>`. Tests: e2e "measurement
hand-offs" (4).

**Durable store.** `src/components/platform/metrics-store.ts` replaces the per-process map with one interface
(`MetricsStore`: `add`, `summary`, `status`, `flush`) and three adapters, chosen by `METRICS_STORE`:
- `file` (default): a JSON file (`METRICS_STORE_FILE`, default `.data/metrics.json`, now git-ignored), loaded once,
  written atomically 2 s after the last count, 400-day retention; falls back to memory (`degraded: true`) when the file
  cannot be written;
- `kv`: a Redis-compatible REST store (Upstash's `/pipeline`), one hash per day, `HINCRBY` plus `EXPIRE`, so
  instances never overwrite each other; `https` only, token from the secret manager, never logged; a `kv` request
  without its settings falls back to the file;
- `memory`: tests.

Aggregates only: the key is `day | event | name | state-or-host | section`, nothing else. Failures are counted in
`status()` and never thrown into a request. `/api/metrics` awaits the store; the authenticated `/api/health` body
adds `measurementStore` (`kind`, `keys`, `errors`, `degraded`). Documented in `docs/engineering/security.md` (section 6,
"Measurement storage") and `docs/engineering/architecture.md` (section 6.9, "Deployment checklist: measurement
storage"). Verified on the dev server: two posted hand-offs and the e2e beacons were in the JSON file 3 s later.
Tests: `src/components/platform/metrics-store.test.ts` (8: memory, file durability across a restart, timed write and
retention, corrupt file, read-only location, KV commands and summary, KV failure without leaking the token, adapter
choice). **Test updated (interface now asynchronous, same counts):** the store case in
`src/components/platform/metrics.test.ts` awaits `add` and `summary`.

---

## 4. Accessibility statement (6.1.10). Fixed; contact and response time need MAHB data

**Before.** "After moving to another page, focus stays where it was" (false since round 2); "Last reviewed 17 November
2026"; no 200% or 400% zoom in the test list; "Report a problem" said only that there is no support desk.

**After** (`/en/accessibility#statement` and `/ms/accessibility#statement`):
- **Review date:** "Last reviewed 21 November 2026, after the fourth round of fixes. Next review: before any public
  launch, and at least every six months."
- **How keyboard focus behaves:** focus moves to the new page's main heading after a link (the title is announced),
  a section link moves focus to the section, focus stays put in a field or an open dialog, and sticky headings and
  bars move out of the way when magnified (matches `src/components/shell/route-focus.tsx` and item 1.4).
- **Test scope:** axe-core (WCAG 2.0 to 2.2, A and AA, both languages); keyboard only; 320 px to desktop in light,
  dark and high contrast at 100, 112 and 125% text; **browser zoom at 200 and 400%** (reflow, nothing clipped, focus
  not hidden); text spacing (1.4.12); reduced motion; "in Chromium, the engine behind Chrome and Edge … Other
  browsers have not been checked."
- **Not tested:** screen reader users and other disabled people, NVDA, JAWS, VoiceOver and TalkBack in a moderated
  session (OOS-15); **Safari on iPhone and iPad (WebKit)** and screen magnifier software.
- **Contact:** "Malaysia Airports does not publish an accessibility contact or a response time in the sources we hold,
  so we cannot promise one", then the official general feedback channels read from the content layer
  (`info@malaysiaairports.com.my`, the group line `+60 3 8777 0000`) with their sources. **Needs MAHB data:** an
  accessibility contact and a response time to replace that sentence.

Files: `src/app/[lang]/accessibility/page.tsx`, `src/lib/i18n/features/guides.ts`. Screenshot: `stmt-en` (390x844).
Test: e2e "describes focus, the test scope, the review date and the contact, in both languages" (with axe on the
statement).

---

## 5. Gallery: React error #419 on `/en/no-such-page`, `/ms/tiada-halaman`, `/en/guides/no-such-guide`. Fixed in the code

**Cause.** These URLs reach a fully static page with an unlisted param (`/en/no-such-page` is the overview of an
airport "no-such-page"), which returns `MissingPage`. Round 3's `MissingPage` threw `notFound()` inside a
`<Suspense>`: React on the server marked that boundary as failed (`<!--$!--><template data-dgst=
"NEXT_HTTP_ERROR_FALLBACK;404">`), Next.js answered 404 and kept the shell, and in the browser React retried the
boundary and reported #419 ("could not finish this Suspense boundary"); the 404 body was rendered on the client, so
crawlers and no-JavaScript visitors had no "Page not found" text. Airport URLs had a second failed boundary: the
airport layout's compact bar also threw `notFound()` inside its own `<Suspense>`. Hence "twice".

**Fix.**
- `MissingPage` renders the 404 body on the server (`NotFoundBody`, shared with `[lang]/not-found.tsx`, including
  `ShortSharedCache` for security-12), and keeps the 404 signal as a `notFound()` inside a `<Suspense>` placed in
  `<noscript data-not-found-signal>`. React still renders that boundary on the server and reports the error, which
  is what makes Next.js answer 404 while keeping everything rendered so far (the mechanism round 3 verified on a
  build). In a browser with JavaScript, `<noscript>` content is never parsed into elements and React does not render a
  `<noscript>`'s children on the client (`shouldSetTextContent` in Next's bundled React DOM), so no boundary is
  retried and nothing is reported.
- The airport layout's bar renders nothing for an unknown airport instead of throwing (cross-package, below).

**Verified** (dev server; `next dev` answers these with 200 by design, see the trust log):

| | Before | After |
|---|---|---|
| Failed boundaries in the HTML outside `<noscript>` | `/en/no-such-page` 2, `/ms/tiada-halaman` 2, `/en/guides/no-such-guide` 1 | **0, 0, 0** |
| "Page not found" `h1` in the server HTML | no (client-rendered) | **yes** |
| `<title>`, site header | yes | yes ("Page not found" / "Halaman tidak ditemui") |
| Browser console errors | (prod: #419 twice) | **none** |

Also checked: `/en/lgk/map` and `/en/lgk/transport` (MissingPage) the same; a minimal React 19.3 experiment
(`renderToPipeableStream` plus `hydrateRoot` in Chromium) showed the server still reporting the error from inside
`<noscript>` while the client reports nothing, where the same boundary in a `<div>` is retried on the client. **Not
verified here: the 404 status on a production server** (no build in this round). Before release, run the C-06 test
and this package's 404 tests with `E2E_STATUS_CODES=1` against `next start`; if the status were ever 200, revert
`missing-page.tsx` to round 3's version (the only file needed). The catch-all (`/en/kul/no-such-section`) was not
changed: it never had #419 (it calls `notFound()` with no boundary).

Files: `src/components/common/missing-page.tsx`, `src/components/platform/not-found-body.tsx` (new),
`src/app/[lang]/not-found.tsx`. Tests: e2e "404s without a client error" (3; they check the status only on a
production server).

---

## Cross-package changes (smallest possible, each commented in place)

| File (owner) | Change | Why |
|---|---|---|
| `src/components/flights/flight-board.tsx` (trust, finished) | `sticky top-header` → `sticky top-sticky` (2 tokens) | The board's hour headings follow the header at 400% zoom (1.4) |
| `src/components/concierge/concierge-chat.tsx` (ask) | Composer: `data-sticky-bottom` and `bottom-[calc(var(--spacing-sticky-bottom)+…)]` instead of a fixed 4.5rem | The composer follows the phone bar and stops sticking on short windows (1.4) |
| `src/app/[lang]/[airport]/layout.tsx` (overview) | `Header` returns `null` for an unknown airport before `loadAirportPage` | The second #419 on airport-slug 404s (5) |
| `src/components/home/mode-quick-actions.tsx`, `src/components/home/home-sections.tsx` (home) | Tile grid and network figures: columns by a rem minimum on phones | Malay mid-word breaks (1.6) |
| `src/components/flights/flight-search-box.tsx` (flights) | Scope sentence `basis-44` | It was squeezed to 64 px beside the arrivals link (1.6) |
| `src/lib/seo/metrics-store.ts` | Now re-exports the new store | Existing imports keep working (3) |
| `src/components/design-system/foundations.tsx`, `docs/design/design-system.md` | `type-data-md` spec 15 → 14 | The type step changed (2) |
| `src/lib/i18n/en.ts`, `ms.ts` | Appended `shellExtras.sourceLists` | Shared copy for `SourceNote` (2) |
| `.gitignore` | Appended `/.data/` | The file store's default location (3) |
| `docs/engineering/security.md`, `architecture.md` | New "Measurement storage" bullet and deployment checklist | As asked (3) |

## Verification

- `npx tsc --noEmit`: 0 errors. `npx eslint` on all touched paths: 0 problems.
- `npx vitest run`: 554 of 554 (one intermittent concierge property-test failure on a first run; see the summary).
- Playwright, desktop project, against this package's dev server (`PLAYWRIGHT_BASE_URL=http://localhost:3233`):
  `e2e/layout-round4.spec.ts` 16 passed; `map`, `transport`, `guides`, `commerce`, `handoffs` 56 passed, 2 skipped.
  `shell`, `smoke`, `platform`, `concierge`, `trust`, `flights`, `ask-round4`: **126 passed, 4 skipped, 2 failed**;
  the two failures are the dev-server-only checks the trust log already records (`smoke` "unknown pages answer 404":
  `next dev` answers `/en/zzz` with 200 because `ensureStatic` is enforced by a build; `platform` "unmatched URLs get
  the designed, bilingual 404": `next dev` renders its default page instead of `global-not-found.tsx`, which this
  package did not change).
- The dev server's persistent cache served a stale `globals.css` and stale dictionaries after edits; it was restarted
  with a clean `.next-r4layout` before every measurement above.
- Screenshots looked at (12): `t-before-en`, `t-after-en`, `map-before`, `map-after2`, `map-desk-dark`, `fac-320`,
  `home-ms`, `home-ms-after`, `zoom-board`, `transit-en`, `stmt-en`, and the Malay transport row (measured, not
  shot).

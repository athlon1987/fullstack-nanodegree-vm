# Redesign round one: polish after the creative director's critique

22 November 2026. One engineer (lead designer-engineer), working from `docs/design/critique-redesign1.md`,
`docs/design/direction.md` (Direction v2), `docs/design/design-system.md`, the photo library
`src/content/images.ts` and the new primitives in `src/components/ui`. The reference captures (Hamad
home desktop, Dubai flight status desktop) and the "before" screens were looked at first. No git
commands were run; the `.next` folder was not touched.

**Result.** Five of the six "must fix" items are done. Photography is still blocked on the owner
(item 2). Of the 25 ranked improvements, 16 are done, 7 are partly done and 2 are not done (2
photography, 19 the phone home's first screen). Each item says why.

On the second production build, every test in the specs named in the brief passed except three:
- one order-dependent flake that passes alone;
- two small layout faults (the night shift in Malay at 0.0109, and the Malay section tabs 13 px too
  wide).

Both faults were fixed afterwards and verified on the dev server (see "Verification").

## Must fix before the client sees it

| # | Item | Status |
|---|---|---|
| 1 | The evening empty board | **Done** (item 1) |
| 2 | Photography | **Not done: blocked.** Tell the client before the meeting (item 2) |
| 3 | The demonstration banner | **Done** (item 3) |
| 4 | Flight page hierarchy | **Done** (item 4) |
| 5 | KLIA "Services now" | **Done** (item 6) |
| 6 | Malay header pill wrap | **Done** (item 12) |

## The 25 ranked improvements

1. **Evening empty board: done.**
   - **Red-eye band.** KLIA now has five long-haul flights each way between 00:00 and 02:30: MH to
     London, EK to Dubai, QR to Doha, TK to Istanbul and MH to Sydney (`RED_EYE` in
     `src/lib/providers/demo-flights.ts`). They are added after the day's flights, so no other
     flight's number or time changes. That keeps the flights the tests name, such as MH 2626, the
     same. The count stays within the unit test's limit of 140 a day (it is now exactly 140), and the
     unit tests pass.
   - **Auto-extend.** When the default window has nothing still to come and no status filter is set,
     the board shows the next 12 flights instead of an empty state (`flight-board-explorer.tsx`). A
     moon line says so ("No departures between 23:20 and 05:30. The next departures:"), and the
     subtitle reads "The next 12 flights, from 06:05". The "From 06:00, Tomorrow" hour dividers come
     from the existing grouping. The feed fetches the next day only once a window turns out empty.
     "Show later flights" then moves past the last flight shown, so the board never shrinks.
     "Show earlier flights" stays in the note's row.
   - **Status row.** There is no orphan "Status" label. Before the feed answers, and when there is no
     status to filter by, the row keeps its height but shows nothing. It is then not a group and not
     a scroll region, so the axe `scrollable-region-focusable` failure is gone. From 70 rem the chip
     row has a fixed width beside the search and scrolls sideways like the phone row. Arriving chips
     therefore never resize the search or wrap the toolbar.
   - **Shift.** Night layout shift at 1440 px dropped from 0.0135 (English) and 0.2465 (Malay), which
     I measured on the first build with the red-eye band, to within the 0.01 limit
     (`access-round6` item 10 passes).
   - Copy keys added: `flightPages.board.nextTitleDepartures`, `nextTitleArrivals` and `nextWindow`
     (EN and MS).

2. **Photography: not done, blocked on the owner.** The library is still empty (Wikimedia refused
   the research requests; see the images hand-off and `docs/design/photography.md`). No stand-in or
   AI image was added. Every photo slot (`HeroMedia`, `MediaCard`, `CardMedia`, the home and KLIA
   backdrops, the destination cards) still switches to a real photo when the library lists one.
   **Before the meeting, tell the client plainly that the photos are waiting on their decision** (a
   contact address in the User-Agent, another network, supplied MAHB or licensed photos, or an API
   token), and that these screens show the designed no-photo state. Do not present this build as the
   agreed photographic direction. The no-photo state was improved instead: hero art (item 14), the
   KLIA Explore cards (items 7 and 8) and the shop cards (item 20).

3. **Demonstration banner: done.** `DemoDataBanner` is now one quiet line built into the top of the
   surface it labels, with no butter-yellow box and no amber rule.
   - **On a board or midnight panel (`attached`):** the board's own midnight, a gold hairline on top
     and a gold-bright flask. Then "**Demonstration data** · Simulated, not live. **Do not use this
     data to plan travel.** About this prototype", in the board's dim ink.
   - **On a page:** the same line on `page-subtle`, with a hairline ring and a `gold-ink` flask.
   - **Narrow containers:** one line of at most 48 px (measured 45): "Demo · Simulated, not live.
     About".
   - **Unchanged:** `role="note"`, the accessible name "Demonstration data", `data-demo-banner`,
     `data-demo-marker`, the link to About this prototype, and the full body (or the `children`
     disclaimer). The body is visible in wide containers and always in the note for assistive
     technology.
   - Dark mode no longer turns it olive. The board keeps exactly one Demo marker per view (round 6
     sticky marker unchanged; `access-round6` item 3 passes).
   - The new home glance panel (item 5) carries one quiet demo line of its own and nothing more.

4. **Flight page hierarchy: done.**
   - **Chrome.** Flight detail pages no longer show the airport strip or the section tabs. Static CSS
     keyed on `[data-flight-page]` in the band's first flush does this, with the same pattern as the
     overview's full banner. That saves 100 px on a desktop and 52 px on a phone. The breadcrumb
     leads back. On phones its "< Flights" link is shown again, and the h1 still starts above 200 px
     (A-01 test passes).
   - **Status card.** It is now a boarding pass: the quiet demo line, a slim "Flight status" header,
     the status pill, airline and flight number, then KUL ✈ SIN with the departure time in display
     size tabular mono under the airport's own code ("On schedule", or the old time struck and
     "25 minutes later than scheduled"), and the flight time on the route line.
   - **Next step.** From 1024 px it sits beside the title, so the card starts higher.
   - **Measured** at 1440 x 900: the time is at y ≈ 595, the status at y ≈ 437 and the gate at
     y ≈ 450 (before: y ≈ 880). At 390 x 844 the time and status are at y ≈ 615 next to each other.
     They were not on the first screen before.
   - **Kept:** the next-step summary stays first on phones. The round-5 "answers first on a 360 px
     phone" test, which requires it, passes. The hero is still filled in place, so the round-5
     first-flush test holds: `data-flight-hero` is pending, then live, on the same element.

5. **Home hero: partly done.**
   - **Done.**
     - From 1440 px a glass "Departing now" panel sits to the right of the headline and search
       (`src/components/home/departing-now.tsx`). It shows three rows of time, city with flight and
       airline, and status pill, plus "Open the full board" and the quiet demo line. It uses the same
       batched feed and cache as the board preview. It has a fixed height with placeholder rows,
       renders no rows and fetches nothing below 1440 px, and follows the remembered airport (or
       KLIA) and the Departures/Arrivals switch.
     - The example chips now appear only when the search has focus (`examplesOnFocus`).
     - The h1 has 1 to 3 rem of space above the search.
     - The notice strip is one alert line from 1024 px. The two link panels keep only their titles
       visibly; their descriptions remain for screen readers.
   - **Not done.** The persona control and the six tiles stay in the hero. The smoke test "first
     screen holds search, modes, airport selector, notice and quick actions" (both projects) is a
     product requirement that they be on the first screen. Moving them under the hero needs that
     requirement changed first. The headline now wraps to two lines at 1440 px beside the panel. All
     first-screen tests still pass, including 1280 x 720.

6. **KLIA "Services now": done.**
   - A service with a notice gets a full-width alert with a toned icon disc, a 3 px left rule, no
     outline, the dated notice, the source and "Read the notice".
   - The queue estimates have a small card of their own, with one Demo tag.
   - The services with no notice share one compact block: "Status not available", their names as
     chips, and where to check with the official contacts.
   - No card is stretched around a single pill.
   - The words the trust and hand-off tests check are unchanged: "Status not available", "Queue
     estimates", the notices date and `[data-ops-where]`.

7. **KLIA Explore repeated: done.** Explore is now four large midnight media cards (Flights,
   Terminal map, Shops and food, Lounges, or the first four available). Each has a deep gradient
   with a faint large line icon, the count in display type, the title link, a description and a gold
   arrow. The other sections are one tap away in the section tabs, the phone Sections sheet and the
   persona module.

8. **Pastel icon tiles: done.** The beige, mint and lilac tops and the `TaburField` stars are gone
   from the overview. `TaburField` is no longer imported there.

9. **Phone board rows: done.**
   - Each row is a fixed two-row grid, about 76 px (was 120 to 150), with the time spanning both rows
     on the left:
     - Row 1: the city and code (the city truncates) with the status pill pinned right.
     - Row 2: the flight number, then the airline (which truncates first), then terminal and gate,
       then the save button.
   - The pill no longer zig-zags.
   - The home preview shows five rows on phones (CSS only; the A-04 and A-27 row tests pass).

10. **My journey: partly done.**
    - **Done.**
      - A compact midnight header (`PageHeader tone="midnight"`, with the lead hidden on phones).
      - The privacy line moved under the list. The flight card now starts at y ≈ 430 on a phone
        instead of 525.
      - The "Be at the airport by" band is a midnight strip with a gold hairline, no longer the
        retired ivory band.
      - The phone timeline gutter went from about 110 px to 38 px, because the time now sits above
        the step on phones.
    - **Not done.** The "Saved flights" heading, count and freshness line, and the page's demo line,
      still sit above the card (`my-journey.tsx` was not restructured). The saved card was not
      redrawn as a boarding pass; it is already a midnight card.

11. **Flight status card balance and phone length: partly done.**
    - **Done.**
      - The stub is a fact grid: 2 x 3 on a desktop, 3 x 2 on phones. It shows Terminal, Gate,
        Boarding from, Gate closes, Check-in (the row letters) and Aircraft; arrivals show Belt and
        Flight time.
      - The counters, often six lines at KLIA, sit in a "Check-in counters" disclosure.
      - The phone page went from 8,984 to 7,749 px.
    - **Not done.** The timeline's "next three steps and Show all 11 steps" control. The timeline is
      a separately loaded chunk with its own tests, and was left for the next round.

12. **Malay header pill: done.** The label stays on one line from 36 rem. Beside the Malay navigation
    (84 to 96 rem) the last word is left to screen readers, so the pill reads "Pilih lapangan" and its
    accessible name is still "Pilih lapangan terbang" (WCAG 2.5.3). English is unchanged ("Choose
    airport", which the smoke tests check).

13. **Too much gold: done.**
    - The unset airport pill is a solid midnight fill with a gold edge and a gold pin. It is still
      the solid unset state of v1 requirement 4, but no longer a gold slab.
    - Section eyebrows and the hero and KLIA kickers are `ink-2`; only their short rule is gold.
    - The notice strip's icons are neutral.
    - Gold stays for the home h1 accent, departure times and the hairlines that mark a demo line.

14. **Home hero art: done.** No stars in the top band (behind the navigation) or in the headline
    column. The large apron lights that formed a row of dots at the bottom edge are gone. The
    clip-art plane is replaced by one fine gold arc. The art is still deterministic (fixed seed, no
    clock).

15. **Search card zig-zag: done.** The pucuk rebung rule is removed from `FlightSearchBox`.

16. **Home board dead space: done.** The heading sits above a board as wide as the container, which
    shows the table layout from 1024 px.

17. **Airport header: done.** On the overview banner the code, name and time are plain text ("KUL ·
    Airport time 23:06"). The terminals are one segmented control (a track with the chosen segment
    filled), also in the compact bar. "All airports" is a text link with an arrow.

18. **Phone chrome: partly done.** On flight pages the airport strip is gone (52 px). On other
    airport pages it stays: merging "KLIA · 23:06" into the header and opening the Sections sheet
    from there is a shell change that the A-01 chrome tests cover, and it was left for the next
    round.

19. **Home on phones: not done.** The smoke test requires the journey modes and all six quick actions
    on a 390 x 844 first screen. Three tiles plus "More" would break it. This needs a product
    decision before the change.

20. **Shop and dine frames: done.** The gradient frames that looked like failed images are now three
    typographic cards, one per airport with the most published outlets. Each shows the count in
    display type, three outlet names and "Browse food and shops at KLIA" as a link, with a faint
    large line icon. They are real content, from published outlets only.

21. **Destination cards: partly done.** The place and code now sit on one line above the city, and
    the city is 22 px (`type-title-lg`, from 20 px). 28 to 32 px would be a ninth type size on the
    home, which the A-14 tests (`speed-round5` and `access-round6`, both in the brief) forbid. The 4:5
    shape is unchanged.

22. **Motion: partly done.**
    - **Already in place and checked:** the 2 px card lift with a deeper shadow (`Card interactive`)
      and the 4% image and vignette ease on destination cards.
    - **Added:** a 1 px lift on phone board rows, a slow ease on the Explore and shop icons, and the
      chevron nudge on board flight numbers. All of it is under `motion-ok:` or reduced-motion
      guards.
    - **Not done:** the 400 ms fade when a row's status changes (it would also fade every row on
      first load) and the 20 s gold sweep across the roof. A perpetual animation on the full-bleed
      SVG costs paint on every frame. Neither was worth the risk this round.

23. **Dark board edge: done.** In the dark theme the board has a `line-strong` ring and
    `shadow-xl`. The demo line on it is the board's own midnight with gold-bright details.

24. **Typography: done.**
    - No 11 px text remains in the owned components:
      - `type-data-xs` codes and the small airline badges are 13 px (the caption size, so the page
        has one size fewer).
      - The SVG map labels, the photo credit chips and the "EN" language marks are 12 or 13 px.
    - The freshness line is sans with a tabular time.
    - Phone rows use mono only for the time, the flight number and the gate.
    - Table flight numbers have no permanent underline: they show an underline on hover and a
      chevron.

25. **Airports directory: partly done.** The type filter uses the short labels "International /
    Domestic / STOLport" ("Antarabangsa / Domestik / STOLport"), so no segment wraps on a phone. The
    legend and group headings keep the full names. Moving the desktop map up beside the h1 was not
    done.

## e2e tests changed (intended appearance changed)

- **`e2e/access-round6.spec.ts`, item 10 (night board CLS).**
  - **Before:** it waited for `[data-board-state="empty"]` at 23:30.
  - **Why it changed:** KLIA's board now has a red-eye band, so at 23:30 the board shows rows.
  - **Now:** it waits for the first flight link on the board. The assertion itself, CLS of 0.01 or
    less at 1440 px in English and Malay, is unchanged.
- **`e2e/flight-round5.spec.ts`, night test.**
  - **Before:** "the empty state fills the block already painted".
  - **Why it changed:** a quiet night no longer opens on an empty state.
  - **Now:** "a quiet night extends the board to the next flights, in the block already painted".
    At 23:30 on Penang's board it asserts the line "No departures between hh:mm and hh:mm. The next
    departures:", flight rows, both "Show earlier flights" and "Show later flights", that the board
    block is in the first paint, and the unchanged round-5 limit that no largest paint comes after
    the feed's delay.
  - This spec was not in the brief's list. It was updated so it states the new behaviour.

No assertion was removed or loosened.

## Changes outside the owned paths (smallest possible, recorded)

- `src/lib/providers/demo-flights.ts`: `RED_EYE` and the loop that adds it (item 1).
- `src/lib/i18n/features/flights.ts`: `flightPages.board.nextTitleDepartures`, `nextTitleArrivals`,
  `nextWindow` and `flightPages.detail.countersTitle` (EN and MS).
- `src/lib/i18n/en.ts` and `ms.ts`: `home.v2.departingNow` and `home.v2.arrivingNow`.

## Verification

**Static checks** (final tree):
- `npx tsc --noEmit` is clean.
- ESLint is clean on the owned paths, `demo-flights.ts`, the i18n files and the two changed specs.
- `npx vitest run` passes 614 tests, with 1 skipped (the photo library's "at least 24 photos" test,
  which waits for photos).

**e2e on a production build.** I used two builds, as allowed: `NEXT_DIST_DIR=.next-polish-prod`,
served by `next start` on port 3295 and run with `PLAYWRIGHT_BASE_URL`. The specs were shell, smoke,
flights, trust, layout-round4, access-round6, speed-round5, handoffs and platform, on the desktop
(1440 x 900) and phone (Pixel 7, 390 x 844) projects.

- **Build 1, 4 workers:** 289 passed, 53 failed and 14 skipped. Most failures were time-outs under
  load. On a 2-worker re-run 16 were real:
  - the night shift (0.0135 en, 0.2465 ms);
  - the narrow banner at 53 px;
  - the home glance panel's hidden flight links, which broke the A-04 and A-27 row tests;
  - `/ms` at 9 type sizes;
  - the section tabs 13 px too wide on `/ms/kul`.

  All were fixed before build 2.
- **Build 2, 2 workers:** 318 passed, 24 failed and 14 skipped (the skips are project-specific by
  design). Re-run with one worker, 21 of the 24 passed. The other 3:
  - **access-round6 item 10, Malay: 0.0109.** The status row grew 4 px and the freshness line slid
    23 px when the times replaced the placeholder. Fixed after build 2: the row has one fixed height
    beside the search, and the compact board header keeps a minimum width for the time window.
  - **shell A-13, `/ms/kul` tabs 1,254 px in 1,241.** Fixed after build 2 by a slightly tighter tab
    padding (`px-3.5`).
  - **speed-round5, "the flight page keeps its answer…".** It failed only inside the long run. It
    passed alone on both builds, and a script that reproduces the blocked chunks clicks
    `[data-needs-link]` without trouble. I count it as order-dependent flakiness, not a regression.
- The two fixes made after build 2 were checked against the dev server, because a third build was
  outside the brief.
  - A-13 passes, and access-round6 item 10 passes in English and Malay.
  - The measured night layout shift at 1440 px is 0.0034 (English) and 0.0050 (Malay), down from
    0.0135 and 0.2465 on build 1.
  - The changed `flight-round5` tests also pass on dev: the night extension, one Demo label per view
    on the flight page and My journey at 390 and 1440 px, and at most 8 type sizes on the overview
    and the flight page (10 passed).
  - **Recommended:** confirm these two on the next production build.

**Looked at** (Playwright, Chromium, deviceScaleFactor 1), 14 result screens: the flight page at 1440
and 390 (light), and in Malay and dark at 1440; the board at 390 (light) and 1440 (dark, at night);
the home at 1440 (light, English), 1440 (dark, Malay) and 390; KLIA "Services now" and the board
preview at 1440; My journey at 390. The before screens were the home and the KLIA overview at 1440,
the board at 390, and the flight page at 1440 and 390.

**Clean-up.** The dev and production servers I started are stopped (only my own process groups).
`.next-polish` and `.next-polish-prod` are deleted. `tsconfig.json` and `next-env.d.ts` are back to
their original content (`next-env.d.ts` points at `.next`). Temporary scripts stayed in the
scratchpad.

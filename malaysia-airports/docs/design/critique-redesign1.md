# Critique: redesign round one

Date: 22 November 2026. Reviewer: executive creative director, before the work goes to the client.
Build reviewed: a production build of the working tree (`next build` then `next start`, port 3294),
captured with Playwright (Chromium, deviceScaleFactor 1) at 1440x900 and 390x844, first screen and
one or two scrolls, light and dark, English and Malay. Server clock 23:05 to 23:10 MYT, so the
flight screens were seen as a client would see them in the evening. References looked at:
`docs/research/screenshots/` (Hamad home desktop and mobile, Dubai home and flight status first
views, Changi home) and the previous build in `docs/prototype/screenshots/`.

## Verdict

**Overall 5.8 / 10. Clearly better than the beige v1 (about 3.5), not yet the "world's best
airport website", and not ready for this client as it stands.**

What works: the midnight and gold palette, the KLIA roof line drawing, the destination vignettes
(the best visuals in the product), the desktop departures table, the glass tiles on the hero, the
phone tab bar and menu sheet, and the refined "Concept prototype" utility bar. Accessibility held
up: axe (WCAG 2.0 to 2.2 A and AA) finds 0 violations on 23 of the 24 captures, one `h1` per
page, no console errors, no horizontal scroll, visible orchid focus.

What fails the brief:

1. **There is not a single photograph.** Every page renders 0 `<img>`. The client asked first for
   "real licensed photography" and "cinematic imagery". The image library is empty because
   Wikimedia blocked the downloads, so every hero is an illustration on a gradient. Hamad, Dubai and
   Changi all lead with one full-bleed photograph. Without photos this cannot be presented as the
   direction the client agreed.
2. **The pages are still crowded and full of labels, only darker.** The home first view stacks
   seven blocks. KLIA repeats the same six destinations three times. The flight page hides its
   answer below the fold.
3. **The honesty labels are the loudest thing on every key screen.** A butter-yellow box with four
   lines of text sits on top of the midnight board.
4. **In the evening the flight board is empty.** At 23:06, `/en/kul/flights` says "No departures
   between 22:56 and 05:06". On a site sold on "live flight status front and centre" this is the
   first thing the client might see.

## Scores by screen

| Screen | Desktop 1440 | Phone 390 | One-line reason |
|---|---|---|---|
| Home (English, light) | 6.5 | 6.0 | Rich midnight hero with good roof art, but seven stacked blocks, no live status in the hero, gold everywhere; on the phone the first screen is a wall of controls. |
| Home (Malay) | 5.5 | 5.5 | Same as above, plus the gold "Pilih lapangan terbang" header pill wraps onto two lines, and tiles are uneven heights ("Ruang menunggu (lounge)" takes three lines). |
| Home (dark) | 6.0 | 6.0 | Consistent, but the board merges into the midnight page and the demo banner turns a muddy olive. |
| KLIA overview | 5.5 | 5.5 | Strong hero, then it falls back to v1: three "Status not available" cards with 200 px of empty white, pastel icon tiles, and the same destinations listed three times. |
| Departures board | 6.5 by day, 3 in the evening | 5.5 by day, 3 in the evening | The desktop table is the best data surface in the product. In the evening the default view is an empty state with an orphan "Status" label, and phone rows are 120 to 150 px tall. |
| Flight page | 5.5 | 5.0 | Four bars of chrome above the title. The time and status only appear at y≈880 on desktop and not at all on the phone's first screen. A 9,019 px phone page. |
| My journey (saved flight) | 5.0 | 4.5 | Reads like a v1 form page: a large `h1`, two paragraphs and a banner before the boarding card (y≈525 on the phone). There is an ivory band inside the card. |
| Airports directory | 6.5 | 5.5 | The map card and the international vignette cards are good. The top-right is empty on desktop, and on the phone the segmented control wraps every label onto two lines. |

## The 25 most valuable improvements, ranked

Each item lists the screen, what is wrong, exactly what to do, and the files. Items 1 to 6 are also
in "Must fix before the client sees it" below.

1. **Departures board: empty by default in the evening (and one serious axe violation).**
   *Wrong:* from about 22:30 to 06:00 the KLIA board opens on "No departures between 22:56 and
   05:06". The demo schedule only generates departures from 06:00 to 22:30 (short-haul) and 08:30
   to 23:50 (long-haul). In that empty state, the toolbar shows the word "Status" with nothing after
   it, and its empty scroll strip fails axe `scrollable-region-focusable` (serious) on the phone.
   *Do:* when the default window has no rows, extend it automatically to the next 12 flights, using
   the "From 07:00, Tomorrow" divider the board already shows after "Show later flights". Hide the
   status label and its scroll region when there are no chips. Add a red-eye band (00:00 to 02:30)
   of long-haul departures and arrivals to the KUL templates: KLIA runs 24 hours, so an empty hub
   board also looks untrue.
   *Files:* `src/components/flights/flight-board-explorer.tsx`, `src/components/flights/board-model.ts`,
   `src/components/flights/board-toolbar.tsx` (status row, around line 82),
   `src/lib/providers/demo-flights.ts` (windows `[360,1350]` and `[510,1430]`),
   `src/lib/providers/demo-routes.ts`.

2. **Every hero: no photography.**
   *Wrong:* 0 images on every page. The illustration fallbacks are good, but they are not what the
   client chose.
   *Do:* the owner picks one of the unblock options in the images hand-off (a contact address in the
   User-Agent, another network, supplied MAHB or licensed stock photos, or an API token), then wires
   real images into `HeroMedia` and `MediaCard` on home, KLIA, the flight page and the destination
   cards. Before the next showing, at minimum: one cinematic KLIA photo for the home and KLIA heroes,
   and one per destination card. Keep the vignettes as the designed no-photo state.
   *Files:* `src/content/images.ts`, `src/components/ui/hero-media.tsx`,
   `src/components/ui/media-card.tsx`, `src/components/home/hero-backdrop.tsx`,
   `src/components/airport/airport-backdrop.tsx`, `src/components/home/destination-card.tsx`.

3. **All data screens: the demonstration banner shouts.**
   *Wrong:* a butter-yellow box with an amber left rule and a two- to four-line paragraph sits on top
   of the midnight board on home, KLIA, the board, the flight page and My journey. In dark mode it
   becomes olive. On the same screen there is often also a "Demo" pill, a sticky "Demo" chip and a
   "Demonstration data" tag, so the label appears up to three times. This is the hazard-stripe feel
   that `direction.md` said to stop.
   *Do:* restyle `DemoDataBanner` as a single quiet line built into the top of the board. On
   midnight: a 1 px gold hairline above, a gold-bright flask icon, then "**Demonstration data** ·
   Simulated, not live. Do not use it to plan travel. About". The text is `on-midnight-dim` at
   14 px. On light pages use the same layout on `page-subtle`. Keep `role="note"`, the accessible
   name "Demonstration data" (e2e checks it) and the words "Do not use this data to plan travel" (or
   an equally explicit version). Show only one demo marker per card: no `DemoTag` inside a card that
   already sits under the banner.
   *Files:* `src/components/common/demo-data-banner.tsx`, `src/components/common/demo-tag.tsx`,
   `src/components/flights/demo-mark.tsx`, `src/components/flights/flight-board.tsx` (sticky mark,
   around line 169), `src/components/home/board-preview.tsx`.

4. **Flight page: the answer is below the fold.**
   *Wrong:* above the breadcrumb sit the utility bar (32 px), the header (68), the airport strip (52)
   and the section tabs (48). The hero then holds only the title and a "next step" card, so the
   departure time first appears at y≈880 on desktop and is not on the phone's first screen at all.
   Dubai and Hamad put time, status and gate at the top.
   *Do:* make the midnight hero a boarding pass. "KUL 10:50 → SIN 11:55" in display-size tabular
   mono, the status pill, then Terminal · Gate · Boarding 10:05 · Gate closes 10:35 on one row, then
   "Your next step". The demo line comes after that. On flight detail pages, drop the airport strip
   and section tabs (the breadcrumb already gives the path), or merge them into one 48 px row.
   *Files:* `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`,
   `src/components/flights/flight-detail.tsx`, `src/components/flights/flight-status-hero.tsx`,
   `src/components/flights/flight-summary.tsx`, `src/components/airport/airport-bar.tsx`,
   `src/components/airport/section-nav.tsx`.

5. **Home: the hero is overloaded and has no live status.**
   *Wrong:* the first 900 px holds the eyebrow, the `h1`, a search card with four example chips, a
   four-way persona control, six tiles, a three-panel notice strip and a services row. The `h1` sits
   about 16 px above the search card. Three things compete to be the primary action: the gold
   "Choose airport", the navy "Search flights" and the white "Flights · Start here" tile. There is
   no flight status in the hero, which the client asked for.
   *Do:* give the hero only the eyebrow, the `h1`, a 64 px glass search pill (examples in the
   dropdown, not as chips) and, from 1024 px up, a glass "Departing now" panel on the right: three
   rows with time, city and status pill, a "Full board" link and the quiet demo line. Leave 48 px
   between the `h1` and the search. Move the persona control and tiles into a band straight under
   the hero on the page surface. Collapse the notice strip into one alert line ("KLIA T1: no
   Aerotrain from midnight to 5 am, 28 Nov to 1 Dec · Details").
   *Files:* `src/components/home/home-sections.tsx`, `src/components/home/hero-backdrop.tsx`,
   `src/components/home/hero-art.tsx`, `src/components/home/journey-modes.tsx`,
   `src/components/home/mode-quick-actions.tsx`, `src/components/home/notice-strip.tsx`,
   `src/components/home/home-ops-status.tsx`, `src/components/home/board-preview.tsx`,
   `src/components/flights/flight-search-box.tsx`.

6. **KLIA overview: "Services now" looks broken.**
   *Wrong:* three of the four cards say only "Status not available". They stretch to the height of
   the Immigration card, so there are about 200 px of empty white in each. The Aerotrain card has an
   unexplained blue outline.
   *Do:* show the notice card at full width with a proper alert treatment (amber icon, 3 px left
   rule, no blue outline). Put services with no notice on one compact line ("No notices for: Train
   between terminals · Shuttle bus"). Give the queue estimates a small card of their own. Never
   stretch a card around a single pill.
   *Files:* `src/components/flights/ops-status-section.tsx`, `src/components/flights/ops-status.tsx`,
   `src/components/flights/topic-status.tsx`.

7. **KLIA overview: the same destinations three times.**
   *Wrong:* the section tabs, "Explore KLIA" (eight cards) and "What do you need at KLIA?" (persona
   control plus six tiles) all list Flights, Map, Transport, Parking, Shops and food, and Lounges.
   *Do:* keep the persona module (it adapts to the visitor) and drop the Explore grid, or turn
   Explore into four large media cards (Flights, Terminal map, Shops and food, Lounges) with vignette
   art and the counts in display type.
   *Files:* `src/app/[lang]/[airport]/page.tsx`, `src/components/airport/airport-flight-tools.tsx`.

8. **KLIA overview: pastel icon tiles left over from v1.**
   *Wrong:* the Explore cards have beige, mint and lilac tops filled with star dots and a white
   circle icon. This is exactly the "icon tile" look the client rejected, and it clashes with
   midnight and gold.
   *Do:* use the destination-card vignette system (deep-colour gradient plus fine line art) or a
   neutral `page-subtle` top with one gold icon. Remove the tabur fields from these cards.
   *Files:* `src/app/[lang]/[airport]/page.tsx` (`TaburField` usage), `src/components/art/patterns.tsx`,
   `src/components/art/airport-vignette.tsx`.

9. **Board on phones: rows too tall and status pills jumping.**
   *Wrong:* each row is 120 to 150 px tall, so only four flights fit on a screen. The status pill
   sits on line 1 for short city names (Penang) and drops to line 2 for long ones (Kuala Lumpur), so
   the column zig-zags. "MH 2807 · Malaysia Airlines" wraps.
   *Do:* use a fixed three-row grid: [time | city + code | status pill pinned top-right], [flight ·
   airline (truncate the airline name first) | gate pinned right], with "Tomorrow" as a 12 px
   caption under the time. Target 88 px or less per row. Cap the home preview at five rows on
   phones.
   *Files:* `src/components/flights/flight-row.tsx`, `src/components/flights/flight-board.tsx`,
   `src/components/home/board-preview.tsx`.

10. **My journey: a form page, not an app.**
    *Wrong:* the page opens with a grey surface, a 72 px `h1`, a lead, a privacy line, a "Saved
    flights" `h2`, a count, a timestamp and then a full banner. The flight only starts at y≈525 on
    the phone. Inside the card, the "Be at the airport by" band is ivory, the beige that v2 retired.
    The phone timeline wastes about 110 px of left gutter, which squeezes step cards to about 210 px.
    *Do:* use a compact midnight header (`h1` plus "1 saved flight"), then the saved flight as a
    full-width boarding-pass card (route in display type, time, status, gate, then "Be at the
    airport by 07:50" on a `midnight-raised` strip with a gold hairline). Move the privacy line under
    the list. On phones, cut the timeline gutter to 32 px.
    *Files:* `src/app/[lang]/journey/page.tsx`, `src/components/flights/my-journey.tsx`,
    `src/components/flights/saved-flight-card.tsx`, `src/components/flights/journey-timeline.tsx`,
    `src/components/common/page-header.tsx`.

11. **Flight page: the status card is unbalanced and the phone page is far too long.**
    *Wrong:* the left half of the midnight card has four items. The right half has a six-line
    check-in paragraph, which leaves a 200 px empty hole bottom-left. On the phone, the timeline
    shows every step in full, so the page is 9,019 px tall.
    *Do:* make the right column a 2x3 fact grid (Terminal, Gate, Check-in row, Boarding, Gate
    closes, Aircraft) and move the counter detail into a "Check-in counters" disclosure. Show the
    next three steps and a "Show all 11 steps" control.
    *Files:* `src/components/flights/flight-status-hero.tsx`, `src/components/flights/flight-detail.tsx`,
    `src/components/flights/journey-timeline.tsx`.

12. **Shell (Malay): the header pill wraps.**
    *Wrong:* at 1440 px, "Pilih lapangan terbang" breaks onto two lines inside the gold pill and
    crowds "Bantuan".
    *Do:* add `whitespace-nowrap` and a short label below 1536 px ("Pilih lapangan" or the airport
    icon plus "Lapangan terbang"), or tighten the nav gap.
    *Files:* `src/components/shell/site-header.tsx`, `src/lib/i18n/ms.ts` and `src/lib/i18n/en.ts`
    (short-label key).

13. **Shell and home: too much gold.**
    *Wrong:* gold is used for the header pill, the `h1` accent, every eyebrow, the board times, the
    hero dots, the plane trail and the hairlines. When everything is gold, nothing feels special, and
    `direction.md` itself says "one gold action per view".
    *Do:* make the airport picker a frosted midnight glass pill with only the pin icon in gold. Keep
    gold for the home `h1` accent and the departure times. Make the eyebrows `on-midnight-dim` with
    only the short rule in gold.
    *Files:* `src/components/shell/site-header.tsx`, `src/app/globals.css` (tokens),
    `src/components/common/section-heading.tsx`.

14. **Home hero art: details that look like mistakes.**
    *Wrong:* star dots run behind the nav labels and the eyebrow (one sits on "Plan your journey",
    another on "TERHUBUNG"). A row of evenly spaced gold dots on the hero's bottom edge looks like a
    rendering error. The clip-art plane with a dotted trail looks cheap next to the fine roof
    drawing.
    *Do:* mask the stars out of the top 120 px and the text column. Remove the bottom-edge dots.
    Remove the plane, or replace it with a single fine gold arc.
    *Files:* `src/components/home/hero-backdrop.tsx`, `src/components/home/hero-art.tsx`.

15. **Search card: the zig-zag edge.**
    *Wrong:* the gold "pucuk rebung" rule along the bottom of every flight search card, at 70 %
    opacity, reads as a torn ticket or a rendering glitch.
    *Do:* remove it from the search card. Keep the motif for one editorial divider per page at most.
    *Files:* `src/components/flights/flight-search-box.tsx` (line 401).

16. **Home: dead space beside the board preview.**
    *Wrong:* the left column holds an `h2` and three lines, then about 550 px of nothing, next to a
    1,000 px board.
    *Do:* put the heading above a full-container board, or make the left column sticky and give it
    the heading, lead, a Departures/Arrivals toggle and the "Full board" call to action.
    *Files:* `src/components/home/home-sections.tsx`, `src/components/home/board-preview.tsx`.

17. **Airport header: identity, data and filters all look like buttons.**
    *Wrong:* KUL, "Airport time 23:06", All terminals, Terminal 1, Terminal 2 and "All airports" are
    identical outline pills. Two of them are not controls.
    *Do:* show the code badge, name and time as plain text, make the terminals a real segmented
    control, and make "All airports" a text link with an arrow.
    *Files:* `src/components/airport/airport-header.tsx`, `src/components/airport/airport-title.tsx`,
    `src/components/airport/airport-bar.tsx`.

18. **Phone chrome takes a quarter of the screen.**
    *Wrong:* on airport and flight pages, 144 px of chrome (concept bar, header, airport strip) plus
    the 60 px tab bar take 24 % of an 844 px screen.
    *Do:* on phones, merge the airport strip into the header: replace the round "KUL" button with a
    "KLIA · 23:06" pill that opens the Sections sheet. Keep the concept bar (non-negotiable) at its
    current refined size.
    *Files:* `src/components/shell/site-header.tsx`, `src/components/airport/airport-bar.tsx`.

19. **Home on phones: the first screen is all controls.**
    *Wrong:* the persona control, six equal tiles and the notice compete. "Meeting someone" wraps.
    *Do:* show search, then the "Departing now" glance (item 5), then three primary tiles (Flights,
    Transport, Terminal map) and a "More" chip. Make the persona control a single-line, horizontally
    scrollable chip row.
    *Files:* `src/components/home/journey-modes.tsx`, `src/components/home/mode-quick-actions.tsx`.

20. **Home "Shop and dine": empty media frames.**
    *Wrong:* gradient tiles with star dots and one small icon look like images that failed to load.
    *Do:* until there are photos, use line-art vignettes (kopi, songket, batik, a lounge chair) in
    the destination-card style, or typographic cards showing outlet names and counts. Never show an
    empty media frame.
    *Files:* `src/components/home/shop-dine-strip.tsx`, `src/components/art/airport-vignette.tsx`.

21. **Destination and gateway cards: the best visuals, under-scaled.**
    *Wrong:* the lower 45 % of each card is an empty dark gradient, and the city name is about
    20 px.
    *Do:* set city names in 28 to 32 px display type with state and code on one line above, and
    tighten the cards from about 4:5 to 3:4. Add the motion described in item 22.
    *Files:* `src/components/home/destination-card.tsx`, `src/components/ui/media-card.tsx`.

22. **Motion: there is effectively none.**
    *Wrong:* there is no hero light, no visible card lift and no board update cue. The client asked
    for "smooth motion".
    *Do (only under `motion-ok:`):* a 700 ms 4 % ease on vignettes and media when hovered, a 2 px
    lift with a deeper shadow on cards, a 400 ms fade on a board row when its status changes, and a
    slow (about 20 s) gold light sweep across the KLIA roof drawing. All durations drop to zero under
    `prefers-reduced-motion` and the site's own reduced-motion setting, and nothing animates the
    `h1` or first content.
    *Files:* `src/app/globals.css` (motion tokens), `src/components/ui/media-card.tsx`,
    `src/components/ui/card.tsx`, `src/components/flights/flight-row.tsx`,
    `src/components/home/hero-art.tsx`.

23. **Dark theme: the board disappears.**
    *Wrong:* the board and the page are both midnight, so the board loses its edge.
    *Do:* in dark, use `board-raised` with a 1 px strong line and `shadow-xl` against the page, and
    use the demo line from item 3 (gold-bright text on transparent).
    *Files:* `src/app/globals.css` (dark tokens), `src/components/flights/flight-board.tsx`,
    `src/components/common/demo-data-banner.tsx`.

24. **Typography: too small and too much mono.**
    *Wrong:* 11 px text appears 15 times on home and 21 times on KLIA (examples: "Tomorrow" under
    times, airline avatars, the board meta line). The board meta line also mixes mono and sans at
    13 px, and underlined mono flight numbers look heavy.
    *Do:* set a floor of 12 px for any text and 13 px for anything a person reads. Use mono only for
    times, codes and figures. Mark flight-number links with a hover underline and a chevron on the
    row, not a permanent underline.
    *Files:* `src/app/globals.css` (type tokens), `src/components/flights/flight-row.tsx`,
    `src/components/home/board-preview.tsx`, `src/components/common/freshness.tsx`.

25. **Airports directory: layout gaps.**
    *Wrong:* on the phone, "International airport / Domestic airport / STOLport" wraps every segment
    onto two lines. On desktop the top-right of the first view is empty while the map starts at
    y≈490.
    *Do:* use the short labels "International", "Domestic" and "STOLport", or a chip row. On desktop,
    move the map card up beside the `h1` and the "Start with" cards.
    *Files:* `src/components/airport/airport-directory.tsx`, `src/components/airport/network-map.tsx`,
    and the label keys in `src/lib/i18n/en.ts` and `src/lib/i18n/ms.ts`.

## Must fix before the client sees it

1. **The evening empty board** (item 1): auto-extend the window, add red-eye flights, and remove the
   orphan "Status" label and the serious axe violation. If the demo happens in Malaysian evening
   hours, this is the first thing the client will see.
2. **Photography** (item 2): show the client at least the hero and destination photos, or tell them
   before the meeting, plainly, that the photos are blocked on their decision and that these
   screens show the designed no-photo state. Do not present a photo-less build as the agreed
   direction.
3. **The demonstration banner** (item 3): the loudest element on five key screens. Restyle it to
   be quiet without losing a word of its meaning or its `role="note"`.
4. **The flight page hierarchy** (item 4): time, status and gate in the first view on both sizes.
5. **KLIA "Services now"** (item 6): the empty "Status not available" cards look unfinished.
6. **The Malay header pill wrap** (item 12): a visible bug on the first screen in Malay.

## Accessibility and contrast notes

- axe-core with WCAG 2.0 to 2.2 A and AA tags: 0 violations on home (EN, MS, dark), KLIA, flight,
  journey and airports at both sizes. 1 serious violation: `scrollable-region-focusable` on the
  phone board in the empty state (the status chip strip with no chips; see item 1).
- axe could not judge 101 (home desktop) to 172 (home phone) text nodes over the hero art. I sampled
  the real pixels behind the hero tile descriptions, persona sub-labels, eyebrow, notice text and
  the board footer link: the lowest ratio was 8.3:1, most were 11 to 15:1. This passes today
  because the art is dark. **Risk:** once photographs arrive, the glass tiles and the gold eyebrow
  sit over bright areas. The 4.5:1 rule in `docs/design/photography.md` must be re-measured on each
  real photo, not assumed from the fill.
- Focus is visible (orchid ring on header links, seen after 14 tabs). Phone targets look at least
  44 px. In "My journey", the toggles' off state (navy knob on a pale track) is a weak signal;
  check 3:1 for the track boundary.
- Small text: see item 24. Nothing is below 11 px, but 11 px is too small for times' "Tomorrow"
  labels that people need.
- Motion: no auto-playing motion was found, so reduced motion is honoured by default. Any motion
  added under item 22 must follow the `motion-ok:` rule and the static-shell rules (no animated or
  `$RC`-revealed `h1`).

## How the references compare

- **Hamad:** one full-bleed photograph, then a solid white search and one row of tiles. Our hero
  has more tools and no photograph. Copy their restraint: picture, search, one row.
- **Dubai flight status:** a very large "Find your flight status" heading, one search, two
  tabs, airy rows with right-aligned status chips. Our desktop board is as good on data and better
  on honesty. Our phone rows and the evening empty state are worse.
- **Changi:** a photograph with a frosted search, and cards with real thumbnails. Our destination
  vignettes are a credible stand-in, but the "Shop and dine" frames and the KLIA Explore tiles are
  not.

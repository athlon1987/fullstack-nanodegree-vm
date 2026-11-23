# Closing fix: the home on a slow CPU, the map's From field and controls, the concierge title, the facilities band, B-09

23 November 2026, one engineer. Scope: the open issues of `docs/qa/verification.md`, "Round eight, addendum:
closing polish", VA6 items 1 (the home moves on a slower CPU), 3 (the map's From field grows after hydration),
5 (the map's zoom and pan bar half under the phone bar), 6 (the concierge `h1` after its tile) and 7 (B-09's
retry race), and the carried-over facilities band (VA6 item 8, the phone log's open item 4). Inputs read:
that addendum, `docs/qa/fixes/redesign3-phone.md`, `docs/qa/fixes/redesign3-perf.md` and the static-shell rules
in `docs/engineering/next16-notes.md` (sections 2 and 4). Every feature, honesty label and official contact
stays; the `h1` stays in the static HTML on every page touched.

**Result.** With a 4x slower CPU and the browser clock fixed, the home now scores **CLS 0 in 12 of 12 loads at
1440 px and 12 of 12 at 390 px** (day and night, English and Malay; the tree as found: 11 of 12 over 0.01 at
1440, up to 0.67), and **0.006 at most in a second set of 24** (evening and night). The map with a route moves
**0.0004 to 0.0009 at 1440** (was 0.0436 English, 0.0525 Malay): the full names are written into From and To
before the first paint. On the 390 x 844 phone the seven pan and zoom buttons sit at **y 715 to 759**, clear of
the phone bar (y 785), with or without a route; no control is cut by the bar on that screen and keyboard focus
never leaves one hidden. The concierge `h1` starts at **x 148 / 16**, like every other page. The facilities band
shows the Terminal 1 canopies, not sky. B-09 passed **100 of 100**. Nine tests were added (layout-shift tests
for the home and the map, a phone-bar test, a title test); one test was changed because the test itself was
wrong (B-09, below).
Open: the home's notice strip still moves on a slow CPU at 1024 to 1280 px (up to 0.022), and one change made
after the last build (a module move, no behaviour change) is not measured on a production build.

## How it was checked

- **Production builds** (the limit of three): `NEXT_DIST_DIR=.next-close-prod NEXT_PUBLIC_SITE_URL=http://localhost:3391
  npx next build`, served by `NEXT_DIST_DIR=.next-close-prod TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start
  -p 3391`, each in its own process group. **Build 1** `Yi8sshWZYS3JXYtTL5UbO`: the tree as found (the baseline
  below). **Build 2** `PTjnF1TbjWQVE0Fk8DpWG`: items 1 to 6, first pass. **Build 3** `0DNssBn2_PWS7mvxrJo7d`: the
  final code (build 2 plus the panel footer, section 1, and the strip's placeholder, section 2). Each build: 0
  warnings, 366 static pages. After build 3, one change only: the two map scripts moved to a module of their own
  (section 7); checked with types, lint, unit tests and the dev server, not on a production build.
- **Dev server** `NEXT_DIST_DIR=.next-close npx next dev -p 3381`, for hydration warnings and the inline scripts'
  decisions before hydration (it reports React mismatches that a production build does not).
- **Scripts** (session scratch, `close-fix/scripts/`): `home-cls.mjs` (the layout-shift method of
  `scripts/qa/layout-shift.mjs`: every shift without input from the start of the load until 4 s after `load`,
  CDP CPU throttling 4x, Playwright's Desktop Chrome at 1440 x 900 and Pixel 7 at 390 x 844, the browser clock
  fixed at 12:00 (day), 21:30 (evening) or 23:40 (night) Kuala Lumpur time on 24 November 2026, a fresh client
  address per load), `home-geom.mjs` (the hero's boxes), `probe.mjs` (the map's CLS with a route, its controls
  against the phone bar, page tops), `focus-obscured.mjs` (Tab through the map and report any focused control
  under the phone bar), `strip-check.mjs` (what the map's inline scripts decide before hydration, with the
  framework's chunks blocked), `panel-frames.mjs` and `strip-frames.mjs` (frame-by-frame traces), `band.mjs`,
  `shots.mjs`; round eight's `photo-contrast-v2.mjs` and `axe-sweep.mjs`. Raw outputs in `close-fix/out/`.
- The machine was otherwise idle (load average 1 to 3, other than during the 4-worker Playwright runs).

## 1. The home moves on a slower CPU (VA6 item 1)

**Cause, measured on build 1.** With the CPU slowed 4x the first paint comes while the hero's HTML is still being
parsed (FCP 228 to 684 ms). The hero is a fixed-height box (`min-h`) whose content was anchored to its foot
(`justify-end`), so with only the headline parsed the headline sat near the bottom of the screen and rose as the
search, the "Departing now" panel, the journey switch, the quick actions and the notice strip arrived: in one
Malay load the content box went from y 740 (160 px tall) to y 33 (867 px). Inside it the grid aligned the
headline column to the foot of the panel's row (`items-end`), a second, smaller dependency on parse order. Late
at night "Departing now" shows today's last flights while it asks for tomorrow's board: with fewer than three
rows the panel fell to its 19rem minimum, 37 px shorter, and grew back about 150 ms later (0.021 + 0.021 at
1440, both directions, in every night load).

**Change.**

- `src/components/home/home-sections.tsx` (`HomeHero`): the content is **top-anchored** (no `justify-end`). The
  hero keeps its height from 768 px: `--hero-min` is `calc(100svh - 2rem)`, from 1024 px `min(62rem, 100svh -
  2rem)`, exactly as before, so whatever is parsed later only adds below what is on screen. The leftover room
  (up to 61 px, as measured; none in Malay at 1440) now lies under the notice strip, over the photograph, instead
  of above the headline.
- From 1440 px the headline and panel row is **reserved at 21.5rem** before either column is parsed
  (`grid-rows-[minmax(21.5rem,auto)]`); the headline column starts at the row's top; the panel comes after it
  in the HTML, so the row's height is final when the panel is placed, and it sits at the row's foot
  (`self-end`) with a **fixed minimum of 21.5rem** (its three rows, title and footer take 21.3rem). A search that
  grows on focus (examples, results) pushes down, never up.
- `src/components/home/hero-backdrop.tsx`: from 768 px the lower scrim starts two thirds down `--hero-min`, not a
  third of the hero's final height, so it does not move when late content makes the hero taller (Malay at
  1440 px: the hero is 886 px, its minimum 868).
- `src/components/home/departing-now.tsx`: the list keeps **three rows' height whatever it holds** (`min-h` of 3 x
  4rem + 2 px); while a board the panel needs is not held yet (tomorrow's, late in the day) the missing rows are
  the same **placeholder rows** as on first load, and "No flights" is said only when nothing more can come; the
  footer follows the list directly (no `mt-auto`: at the panel's foot it rose by 45 px when its link, parsed
  last, wrapped to a second line, a 0.0005 shift on build 2).

**Before and after** (`home-cls.mjs`, 4x CPU; build 1 is the tree as found):

| Width | Clock | Build 1 (12 loads) | Build 2 (12) | Build 3, set 1 (12) | Build 3, set 2 (12) |
|---|---|---|---|---|---|
| 1440 x 900 | day / night | **11 of 12 over 0.01, 7 over 0.1, max 0.670** (day 0.0065 to 0.440, night 0.029 to 0.670) | max 0.0012 | **12 of 12 at 0** | evening / night: max **0.006** (one load) |
| 390 x 844 | day / night | 0 in 12 | 0 | **12 of 12 at 0** | max 0.0001 |

Each 12 is English and Malay, day and night, three loads each (set 2: evening and night). Other widths on build 3
(4x CPU, both languages and clocks): 1920 x 900 max 0.0011 (4 loads), 768 x 900 max 0.0051 (4; the demo strip at
the top), **1280 x 900: 2 of 12 over 0.01 (0.0109, 0.0111)** and **1024 x 900: 3 of 12 over 0.01 (0.021 to
0.022)**, all English: the notice strip, open item 1. Unthrottled the home is 0 (V2.7: 0.042 / 0.029 at this
hour).

**What it looks like** (`home-geom.mjs`, build 1 → build 3, `h1` top): 1440 x 900 English 221 → **163** (Malay 177
→ 163), 1920 x 1080 230 → 169, 1280 x 720 185 → 126, 1024 x 768 202 → 158, 768 x 1024 184 → 167; phones
unchanged (no minimum height there). At 1440 the headline's top now lines up with the panel's top, and the
search's foot is 18 px above the panel's foot (they were level); that is the cost of not anchoring the search to
the foot, where it would jump up when it grows on focus. Every first-screen check of the smoke and shell specs
holds (1280 x 720 and 1440 x 900, both languages).

**Test added** (`e2e/shell.spec.ts`, "home layout shift on a slower CPU (VA6 item 1)"): CLS 0.01 or less with a
4x slower CPU, English and Malay, day (12:00) and night (23:40), in both projects (1440 x 900 and the 390 x 844
phone), measured from the start of the load until the page settles; at 1440 it first waits for the panel's three
flights (tomorrow's, at night). Chromium only (CPU throttling is a DevTools setting) and production only (as
`polish-round5`'s CLS test). Build 3: 8 of 8 in the run of the specs and **24 of 24** with `--repeat-each=3` (12
loads per project). It was written after build 1 and not run against it; the same measurement by script failed
there in 11 of 12 loads at 1440.

## 2. The map's From field (VA6 item 3)

**Cause.** The map page is static, so its HTML says "Choose a place"; the route in the address is applied after
hydration, when "Departures drop-off · Level 5" (two lines at 1440) and "Kawasan menurunkan penumpang berlepas ·
Aras 5" (three lines) moved To and the step-free switch down 24 and 48 px.

**Change.** The names are in the fields before the first paint, without making the page dynamic:

- `src/lib/inline-scripts-map.ts`, `MAP_ROUTE_NAMES_SCRIPT`, run during HTML parsing right after the From and To
  well (`RouteNamesScript` in `src/components/map/route-planner.tsx`, rendered as the home's saved-flight flag is:
  `text/javascript` in the server HTML, `text/plain` on the client, so React never creates a script). It reads
  `from` and `to` from the address and writes the text of the matching `<option>` (which the server HTML already
  holds, so no data is added) into the field's drawn name, drops the "empty" ink and sets the transparent
  `<select>`. It does nothing for an unknown place, or for a `t=` terminal other than the one drawn.
- `PlaceSelect`: `data-place-select` and `data-place-shown` hooks, and `suppressHydrationWarning` on the field and
  on its drawn name only (React hydrates with an empty query and keeps the written text and class, then renders
  the same name right after hydration). The dev server shows no hydration warning.
- `next.config.ts` hashes the new strings for the report-only CSP, like the four earlier inline scripts
  (`docs/engineering/security.md` updated).

**Found on build 2 and fixed in build 3: the "route continues" strip.** Item 3 below makes the map card 96 px
shorter on a phone (it ended at y 868, now 772), which brought the legend under it to y 784, inside the phone screen (behind the bar). The
strip that closes the card appears after hydration with the route and pushed the legend down: CLS **0.0107 to
0.0138** at 390 with 4x CPU on build 2, and the new map test failed in the phone project (2 of the 284 tests
run on build 2). So the strip's room is now held from the first paint when it will appear:
`src/components/map/map-canvas.tsx` renders, while not hydrated, a hidden placeholder with the strip's own
classes and one invisible button (exactly its height in every layout), followed by `MAP_ROUTE_STRIP_SCRIPT`, which
shows it when both ends are in the address and on different levels and the level the page will show (the
address's `level`, else the chosen place's, else the start's) is the start's or the end's; it carries each
place's level as `data-levels` (1.7 KB of HTML on KLIA's map). After hydration React puts the strip in its place
(`useHydrated`). Checked before hydration on the dev server: shown for L5 → C gates, L3 kerb → C gates and the
step-free Row B → Level 3 toilets; hidden for a same-level route, a `level` off the route, a `gate` link, an
unknown place and no route; each matched the strip after hydration (92 px on a phone, or none).

**Result** (`probe.mjs`, `/{en,ms}/kul/map?from=l5-kerb&to=g-gates-c`, build 3):

| | Build 1 | Build 3 |
|---|---|---|
| 1440, unthrottled (3 loads each) | en **0.0436**, ms **0.0525** (2 loads each) | en **0.0004 to 0.0006**, ms **0.0009** (the site header's airport pill only) |
| 390, unthrottled | 0 | 0 to 0.0036 (the pill) |
| 4x CPU, 1440 / 390 (3 each) | 390: 0.0036 in V2.7 | 1440 **0.0006 to 0.0037**, 390 en 0.0036, ms 0.0067 (the pill: 0.0036 English, 0.0067 Malay) |

Three more routes with 4x CPU (L3 kerb → C gates, Row B → Level 3 toilets step-free, L5 kerb → prayer room), 12
loads: **max 0.0071**; at 1440 the two routes that start away from Level 5 or change the step-free path add 0.005
to 0.006 when "Your route" arrives under the planner and moves the places heading at y 877 (the route's result is
client-only, as before; under 0.01). From and To in the HTML before hydration: the full names (two lines English,
three Malay); after: the same, `select` values `l5-kerb` and `g-gates-c`.

**Tests added** (`e2e/map.spec.ts`, "terminal map: closing fix"): a route in the address moves nothing when it is
applied (CLS 0.01 or less, English and Malay, both projects, production only; it also checks the name is in the
field and the select holds the place). Build 3: 4 of 4, and 12 of 12 with `--repeat-each=3`.

## 3. The map's controls and the phone bar (VA6 item 5)

**Cause.** Under the drawing the bar held "Skip to the list of places" and the seven pan and zoom buttons, which
wrapped to a second row on a phone: buttons at y 765 to 809 ("Reset view" 811 to 855) on a 390 x 844 screen whose
fixed bar starts at y 785, so six of them were half covered (a 20 px sliver above the bar, under the 24 px target
minimum while at rest there).

**Change** (`src/components/map/map-canvas.tsx`):

- The pan and zoom buttons are the bar's only row. On a phone they share the card's width (seven 44 px buttons,
  `justify-between`, the divider hidden below 640 px): **y 715 to 759** at 390 x 844, 26 px clear of the bar. From
  640 px they sit at the bar's right as before.
- The skip link moved **before the drawing**, where it skips what it should: each place on the drawing is a
  button, and the link came after all of them. It is a skip link like the site's own: hidden until it has focus,
  then shown over the drawing's top-left corner (`absolute`, so nothing moves); its key presses do not reach the
  map's keyboard handler. Tab order: the level tabs, the skip link, the map, its places, the controls; Enter moves
  focus to `#map-places` (checked at 390 and 1440).
- The "route continues" strip puts its words on a line of their own on a phone, so at 390 x 844 (where the strip
  now starts at y 771) its button begins under the bar, whole, rather than as a sliver above it.

**Result** (build 3). At 390 x 844, English and Malay, with and without a route: **no control partly covered**
by the bar at load (`focus-obscured.mjs`; build 1: the six buttons), and **no focused control obscured** in 107
to 118 Tab stops per page (390 x 844, 360 x 740, 412 x 915; the page's `scroll-padding-bottom` brings each one
clear). At 360 x 640 the bar is below the first screen and wraps to two rows (the buttons need 308 px); at 125%
text it is below the first screen (y 838, under the bar's top). At 412 x 915 with a route the strip's "To Gates"
button (y 826 to 870) is cut by the bar (y 856) at load: open item 4. Screens: section 8.

**Test added** (`e2e/map.spec.ts`): on the first 390 x 844 phone screen no map control is cut by the phone bar
(three addresses, with and without a route, both languages), and every pan and zoom button is wholly in view.
Phone project; 1 of 1, and 3 of 3 repeated.

## 4. The concierge's title (VA6 item 6)

`src/app/[lang]/concierge/page.tsx`: the `h1` comes first and the sparkle tile follows it as the concierge's
mark (decorative, `aria-hidden`), in the same row of the same height. The `h1` starts at **x 148 at 1440 and x
16 at 390** (build 1: 220 and 72), where the breadcrumbs start, in both languages; its top is unchanged (y 187 /
169), and so is everything under it: the question field at y 533 (English, 390), page length 3,654 px (Malay
3,898), as in VA2.7. **Test added** (`e2e/concierge.spec.ts`, "closing fix: concierge page top"): the title starts
where the breadcrumbs start, English and Malay, both projects (4 of 4).

## 5. The facilities band (VA6 item 8, the phone log's open item 4)

`src/content/images.ts`: `SERVICE_IMAGES` entries may carry their own focal point (`ServiceImage`), and the KLIA
facilities band uses the Terminal 1 roof photograph at **`{ x: 0.35, y: 0.8 }`** (the photograph's own is 0.5).
The band is always much wider than this 4:3 photograph (390 x 140 on a phone, 1440 x 220 on a desktop), so only
the height matters: at 0.5 a phone showed the underside of one canopy and a column top beside sky; at 0.8 it shows
the main column and the row of canopies on their tapered columns receding to the trees, and at 1440 the column
with four canopies (crops compared at 0.5, 0.65, 0.72 and 0.8 before choosing). Only the band changes: the
corporate About and Departing guide heroes keep `35% 50%` (checked), because their words sit over the photograph
and their contrast was measured at that crop. The credit pill over the band: **8.03:1** at 390 and **8.99:1** at
1440 in all four themes (VA2.3: 8.02). `transport-data.server.ts` reads the band's `id` as before.

## 6. B-09's retry step (VA6 item 7): a test change

**Why the test was wrong.** It made every flight-feed request fail, waited for the two error notices, then
removed its failing route and clicked "Try again" in the search's notice. A refresh landing between the removal
and the click (the 30-second one; 1 run in 100 in VA3) loaded the flights first, so the notice it was about to
click had already become a stale-data notice. The product behaved correctly; the test let the feed come back
before the step it was testing.

**Change** (`e2e/handoffs.spec.ts`): the feed comes back when "Try again" is pressed. The route handler fails every
request until a capture listener on the document (added just before the click, so it runs before the page's own
click handler) records that the button was pressed; from then on requests go through. No refresh can change the
notices under the test. Every assertion is unchanged: the search's error notice is visible with "We could not
load flight information.", there are two error notices on the page, and after "Try again" the flights are found.
**Build 3: 100 of 100** (`--repeat-each=50`, both projects, 4 workers; VA3: 99 of 100).

## 7. Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | 0 errors (after each change and at the end) |
| `npx eslint` on every changed path, `next.config.ts` and `e2e/` | 0 problems |
| `npx vitest run` | 44 files, **626 passed** (as VA2.1), before build 2, before build 3 and at the end |
| Builds 1 to 3 | 0 warnings, 366 static pages each |
| Playwright on build 2: shell, smoke, map, concierge, services-redesign2, flights, speed-round5, verify-round7, handoffs | 286 tests: 273 passed, **2 failed** (the new map CLS test in the phone project: the strip, section 2), 11 skipped |
| Playwright on build 3, 4 workers: the nine above plus layout-round4, guides, access-round6, ask-round4, ask-round6, verify-round6, polish-round5 (map.spec covers the facilities directory) | 554 tests: **527 passed, 0 failed, 27 skipped** (9.6 min). Every skip is a test written for the other project (for example the A-06 palette tests on the phone, B-15 and the new phone-bar test on the desktop) |
| New tests repeated on build 3 (`--repeat-each=3`) | 39 passed, 3 skipped (the phone-only test on the desktop) |
| B-09 on build 3 (`--repeat-each=50`) | **100 of 100** |
| axe (`axe-sweep.mjs`): home, map with a route, map, concierge, facilities x English and Malay x light and dark x 390 and 1440 | **40 loads, 0 violations**, one `h1` each, no sideways scroll, no console error, all 200 |
| Text over photographs (`photo-contrast-v2.mjs`): home and facilities, both languages, four themes, 390 and 1440 | 32 loads, **1,188 runs, 0 under the minimum**; lowest **5.29:1**, the home headline's gold words at 1440 in light (large text; VA2.3 5.36, the hero's words now sit 58 px higher over the photograph); facilities 8.03 and more; axe 0 |
| First-load JavaScript (`scripts/qa/first-load-js.mjs`, build 3, gzip) | home 196.6 → 197.2, map 198.3 → 199.1, concierge 185.0 → 185.5 (VA2.6 → build 3). **Every route +0.4 KB**: the two map scripts were in `src/lib/inline-scripts.ts`, which the shell imports, so they shipped in the chunk all 40 routes load; help (170.2) and credits (170.3) crossed 170 (**15 of 40** at 170 or less on build 3, VA2.6: 17). Fixed after build 3 by moving them to `src/lib/inline-scripts-map.ts`, which only the map's components and `next.config.ts` import; not measured on a production build (open item 2) |
| Report-only CSP | both new script hashes present in the header (dev server, after the move) |
| Map page HTML | + the two scripts (672 and 621 bytes) and `data-levels` (1,667 bytes) |

## 8. Screens looked at (10, build 3, device scale 1, first screen)

Home 1440 English at night (light), 1440 Malay by day (dark), 390 English (light), 1280 x 720 English; the map
with a route at 390 English (light) and 1440 Malay (dark); the concierge at 1440 English (light) and 390 Malay
(dark); facilities at 390 English (light) and 1440 English (dark). Each had one `h1`, no sideways scroll, every
photograph in view loaded and no console error. Seen:

- **Home.** At 1440 the eyebrow and headline start under the header, level with the top of "Departing now",
  which shows tomorrow's three flights at 23:40 (London 00:05, Dubai 00:35, Doha 01:25, each "Tomorrow" with its
  status) and its Demo line; the strip closes the content with about 70 px of photograph under it before the credit
  pill. In Malay the strip ends at the fold as before. At 1280 x 720 the headline sits about 25 px under the
  header with about 80 px of photograph under the strip: tighter at the top than before, open item 6. The phone is
  as before.
- **Map.** At 390 the seven buttons form one even row under the drawing, Zoom out disabled at the first view,
  the phone bar under them with room to spare; the drawing and its route are unchanged. At 1440 in Malay "Kawasan
  menurunkan penumpang berlepas · Aras 5" fills three lines of From from the first paint; the bar under the drawing
  holds only the controls, on the right.
- **Concierge.** "Ask the concierge" and "Tanya Kami" start at the breadcrumbs' edge with the midnight sparkle
  tile after them; the short line, the disclosure and the conversation are where they were.
- **Facilities.** At 390 the band shows the main column, the canopies receding and the trees; at 1440 the column
  and four canopies above the "Most looked for" panel. The credit pill is in its corner.

## Tests changed, and why

- `e2e/handoffs.spec.ts`, B-09: the test itself was wrong (a race of its own making between removing its failing
  route and clicking); section 6. No assertion was removed or weakened.
- Added: `e2e/shell.spec.ts` (4 tests x 2 projects), `e2e/map.spec.ts` (2 CLS tests x 2 projects, 1 phone test),
  `e2e/concierge.spec.ts` (2 tests x 2 projects). No other test was changed, skipped or deleted.

## Open

1. **The home's notice strip moves on a slow CPU from 1024 to 1439 px** (1280: 2 of 12 loads over 0.01, max 0.011;
   1024: 3 of 12, max 0.022; English; 1440 itself 0 to 0.006). Another parse-order dependency: from 1024 px the
   strip is a grid of the notice and two `auto` columns of links parsed after it, so at the first paint the notice
   has the whole width on one line and wraps to two when the links arrive (its row centres its content, which
   moves too). Fix: fixed widths for the two link columns and the notice's content at the top of its row. Not
   made: the three builds were used.
2. **First-load JavaScript after the module move is not measured** on a production build. Expected: the 0.4 KB
   back off every route except the map's, so help and credits under 170 again (17 of 40, as VA2.6).
3. **Both skip links lose their padding when shown**: `focus:not-sr-only` resets `padding`, so the site's "Skip to
   main content" shows at 149 x 25 px and the map's at 151 x 21 (pre-existing in the site's link; the map's copies
   it). Add `focus:px-4 focus:py-2.5` to both.
4. **Phone heights other than 844**: at 412 x 915 with a route the strip's button (y 826 to 870) is cut by the
   phone bar (y 856) at load. Keyboard focus is never obscured (the page's scroll padding); a fixed bar crosses
   something below the fold at some height.
5. On the map, routes that start away from the level drawn in the HTML add 0.005 to 0.006 at 1440 when "Your route"
   arrives (client-only, as before); the site header's airport pill adds 0.0004 to 0.0067 on every airport page
   (VA2.7).
6. **The hero's leftover room moved below the strip** (up to 61 px from 768 px up): the headline now starts at the
   top of the hero's content box, at 1280 x 720 about 25 px under the header. A design check is due; a larger top
   padding would push the Malay strip below the 1440 x 900 fold.
7. Not in this assignment and unchanged: VA6 items 2 (LCP on photo-led pages), 4 (TBT) and 8 (the other carried-over
   items).

## Files

`src/components/home/home-sections.tsx`, `hero-backdrop.tsx`, `departing-now.tsx`;
`src/components/map/route-planner.tsx`, `map-canvas.tsx`; `src/lib/inline-scripts-map.ts` (new);
`src/app/[lang]/concierge/page.tsx`; `src/content/images.ts`; `next.config.ts`; `docs/engineering/security.md`;
`e2e/shell.spec.ts`, `e2e/map.spec.ts`, `e2e/concierge.spec.ts`, `e2e/handoffs.spec.ts`; this log.
`src/lib/inline-scripts.ts` is as it was.

## Clean-up

- Every server was stopped by its own process group: production 3391 (builds 1, 2 and 3), dev 3381 (three runs).
  No listener is left on 3381 or 3391.
- `.next-close` and `.next-close-prod` deleted; `tsconfig.json` (four `include` lines added by the builds and the
  dev server) and `next-env.d.ts` (pointed at `.next-close/dev`) restored from the copies taken before the first
  build: SHA-256 `bd034e40…` and `1862ac4b…`, as V1. `.next` (round eight's build) was not touched;
  `tsconfig.tsbuildinfo` was not rewritten.
- `.data/metrics.json` (created by this session's servers; git-ignored) removed with its folder. Playwright wrote
  to the session scratch folder; no `test-results/` in the project.
- No git command was run. One command included a `git status` by mistake; the permission system refused it before
  it ran.

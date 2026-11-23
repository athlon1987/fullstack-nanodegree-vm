# Redesign stage 1c: cinematic heroes, one graded library, a photo-led directory

Owner: senior designer-engineer (premium travel). Date: 23 November 2026. Input: the open issues of
`docs/qa/verification.md`, "Round seven, addendum: photographs" (SA5 items 1, 4, 5 and 6) and item 3 of
`docs/design/critique-redesign1b.md` (choose and grade the heroes), on Direction v2 (`docs/design/direction.md`).

Measured on production builds of my own, before and after, on the same machine:
`NEXT_DIST_DIR=.next-rd1c NEXT_PUBLIC_SITE_URL=http://localhost:3296 npx next build`, served by
`NEXT_DIST_DIR=.next-rd1c TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3296`. Three builds, each from a
clean folder, each 0 warnings and 366 static pages: **build 1** `uNAzN2vp3_jcY_oyCVAtI` (the tree as I found it: the
"before" numbers), **build 2** `8kMG5dj8bZwinEKKbSz5v` (all six items; used for the first end-to-end run, which found
two regressions, fixed below), **build 3** `RYWntfobJaVoCVuqAAcUd` (final: every "after" number). Iteration on the hero
shade, the hero choice and the directory ran on a development server (`.next-rd1c-dev`, port 3297).

## Result

| Check | Before (build 1, or as stated) | After (build 3) |
|---|---|---|
| Airport hero shade at 1440 px: steepest change of the darkening over 60 px (1.0 = black to bare) | 0.21 on KLIA, Subang and Penang, at x = 1,045 to 1,131 px (the "panel edge") | **0.06 to 0.10** on KLIA, Penang, Kota Kinabalu and Subang at 1280, 1440 and 1920 px (Kuching 0.10 to 0.14; see item 1) |
| Text over photographs under 4.5:1 (every run, brightest 1 % of pixels; large text held to 4.5:1 too) | 0 of 2,388, lowest 4.93 (SA2.3) | **0 of 3,559** (120 page loads), lowest **5.36**; axe 0 violations |
| Home hero | `klia-t1-roof`, overcast | **`mount-kinabalu`** at sunset (judged in place against five others) |
| KLIA hero | `klia-t1-airfield` (at 1440 px mostly sky) | **`klia-t1-aerial`** (the terminal and pier from the air, 2026) |
| Library | 30 files as downloaded, 11,765,206 bytes | 30 files **colour-graded as one set**, 12,004,275 bytes (limit 14 MB); every credit says "colour-graded" |
| Lighthouse mobile LCP, median of 3: `/en` | 3.77 s (performance 85) | **3.03 s (90)** |
| `/en/kul` | 3.52 s (87) | **3.48 s (89)**, with a heavier hero (the aerial) |
| `/en/pen` | 3.67 s (88) | **3.35 s (90)** |
| `/ms` | 3.53 s (89) | **3.34 s (91)** |
| Target: LCP 2.5 s or less with performance 90 or more | missed | **missed on all three**; not reachable with a photograph as the first screen's largest element (item 3) |
| CLS (Lighthouse, 3 runs) | 0 on `/en`, `/ms`, `/en/pen`; 0.004 on `/en/kul` | **0** on all five pages measured |
| Bytes before the first paint that Lighthouse charges to the hero (`/en`, Lantern's graph) | 421.8 KB (fonts 130 KB) | **368.5 KB** (fonts 55 KB) |
| First-load JavaScript, gzip (`scripts/qa/first-load-js.mjs`) | home 209.6, overview 209.7, directory 184.0 KB (SA2.6) | home **201.7**, overview **200.5**, directory 183.4 KB |
| Directory first view at 1440 x 900 | no photograph | **five airport photographs** (a mosaic) above the search and filters; a row of tall cards on phones |
| `platform.spec.ts` offline indicator | reads the card and the toast at two moments (flaky, SA5 item 5) | **one snapshot**; both assertions kept |
| `tsc`, `eslint`, `vitest` | 0, 0, 616 / 616 | **0, 0, 616 / 616** |
| End to end, the nine specs touched (both projects) | | TBD-E2E |

## 1. Airport hero scrim (SA5 item 4): a cinematic full-bleed shade

**Before.** At 1440 px the words sat on `scrim-feather`: a 70 % panel behind the words' 56rem block, feathered over
12rem. On a bright sky it read as a soft-edged dark panel ending at about x = 1,050 px, with the photograph bright and
washed out to its right. Measured on build 1 (`edge.mjs`: every word and control hidden, the band captured with and
without the scrims, the darkening per column as the ratio of the two): the darkening jumps by **0.21 within 60 px** at
x = 1,060 (KLIA), 1,131 (Subang) and 1,045 (Penang): from about 0.32 of the photograph's light to all of it.

**After.** From 1024 px the photograph carries one shade, `hero-shade` (`src/app/globals.css`), drawn by
`AirportBackdrop`; the words have no scrim of their own there:

- **Left to right**: dark under the words' column, which is now `min(56rem, 60vw)` from the page's text edge (the
  banner sets the same width on the words, so the shade follows the layout at every width); from 6rem before that
  column's end an eased fall (a smoothstep in eight stops) to the right edge, where the photograph keeps about 90 % of
  its light. The words' left part gets up to 0.12 more.
- **Bottom**: the photograph sinks into the band's midnight under the search (0.85 at the foot, nothing above 45 %).
- **Top**: a light veil (0.3, fading over 8rem) where a bright sky meets the header.
- **Per photograph** (`HERO_FRAMING` in `src/components/airport/airport-backdrop.tsx`): the wide-screen framing puts
  the subject in the open right half (the aerial's terminal and pier; Kota Kinabalu's name board; Langkawi's
  entrance), and `shade` sets the strength where the fall starts: 0.66 by default, 0.7 for the bright skies of
  `klia-t1-airfield` and the fallback `wing-window`. High contrast raises it to 0.86 (0.55 at the right edge);
  forced colours drop it.
- **Below 1024 px** (where the words span the band) the words keep the feathered scrim, and phones keep the polish
  pass's photo band above the words, unchanged.
- "All airports" stays at the end of the identity line (`ml-auto`), so it does not move when the clock fills in;
  build 2 had moved it beside the clock and measured CLS 0.0032 on `/en/kul` at 1440 from that, so it went back.

Measured on build 3 at 1280, 1440 and 1920 px, the steepest change of darkening over 60 px:

| Airport (photograph) | 1280 | 1440 | 1920 |
|---|---|---|---|
| KLIA (`klia-t1-aerial`) | 0.08 | 0.09 | 0.06 |
| Penang (`pen-terminal`) | 0.08 | 0.08 | 0.07 |
| Kota Kinabalu (`bki-terminal`) | 0.11 | 0.10 | 0.08 |
| Subang, the fallback (`wing-window`) | 0.09 | 0.10 | 0.07 |
| Kuching (`kch-terminal`) | 0.14 | 0.14 | 0.10 |

The ratio is unreliable where the bare photograph is nearly black (it divides by small numbers): Kuching's dark
canopy undersides raise its figure, and Langkawi's entrance (`lgk-terminal`, columns at 8 to 10 of 255 at the left
and right edges) gives nonsense there (0.47 to 2.54 at x = 37 to 69, inside the darkest part of the shade); both were
judged by eye on the screens below instead, where the fall reads as light falling off, not as a panel. At the right
edge the photographs keep 85 to 90 % of their light (KLIA at 1440: 132 of 153 at x = 1,411 px; build 1: 183 of 189 but
behind a panel edge).

**Text over the photographs** (`photo-contrast.mjs`, the verification's script and method: every visible text run
that overlaps a photograph, the page's text made transparent, the text colour blended over each pixel behind the run,
the 1st percentile of the per-pixel ratios; pass 4.5:1, applied to large text too). Build 3: the home, the six airport
heroes (KLIA, Penang, Kota Kinabalu, Langkawi, Kuching, Subang for the fallback) and the directory in English at
390, 1280, 1440 and 1920 px in light, dark and high-contrast dark (96 loads), and the home, KLIA, Penang, Subang, the
directory and the credits page in Malay at 390 and 1440 px in light and high-contrast light (24 loads): **3,559 runs,
0 under 4.5:1, lowest 5.36:1** (the home's gold line "rancang perjalanan anda.", large, 1440, light; SA2.3's lowest
was 4.93). Over the airport heroes: every `h1` **7.01:1 or more**, "All airports" 6.29 or more (Langkawi at 1920, at
the column's end), the clock's "MYT (UTC+8)" 6.54 or more, "Find a flight at …" 9.47 or more; the lowest run on
those pages is the search box's placeholder on its own panel, 6.15. axe (WCAG 2.0 to 2.2 A and AA) on all 120 loads:
**0 violations**, 0 console errors.

Files: `src/app/globals.css` (`hero-shade`), `src/components/airport/airport-backdrop.tsx`,
`src/components/airport/airport-header.tsx`.

## 2. Hero choice and grading (critique item 3)

**Choice, judged in place.** `hero-cands.mjs` (session scratch folder) loads the real page, swaps the hero for each
candidate through the image optimiser, frames it on its focal point and captures the first screen at 1440 x 900 and
390 x 844, behind the real headline, search panel, "Departing now", journey modes and tiles.

- **Home**: `klia-t1-roof` (then the hero), `klia-t1-aerial`, `klia-t1-airfield`, `mount-kinabalu`, `kl-petronas`,
  `apron-night`. The roof read as overcast grey under the veil; the aerial and the airfield turned into grey texture;
  the Petronas Towers stood right behind the headline; the apron at night is moody but makes an AirAsia aircraft the
  subject of the operator's home. **Mount Kinabalu at sunset** is the one picture that still says "travel" through the
  scrims: the warm, sunlit summit beside the headline at 1440, and on a phone the peak fills the band under the
  header. `HOME_HERO_IMAGES` = `mount-kinabalu`, `klia-t1-aerial`, `klia-t1-roof`. The Kota Kinabalu place card,
  which used to take the mountain, now takes `bki-airfield` (`PLACE_PREFERENCE`), so the home never repeats its hero.
- **KLIA** (judged with the new shade): `klia-t1-airfield` (then the hero: at 1440 mostly sky, the domes hidden
  behind the search), `klia-t1-aerial`, `klia-t1-roof`, `klia-t1-canopy` (dark on a phone) and `aircraft-terminal-1`
  (two airlines' liveries as the subject). **The 2026 aerial** gives the terminal roof, the pier and the aircraft
  alongside in the open right half, and on a phone the terminal fills the band. `AIRPORT_HERO_IMAGES.kul` =
  `klia-t1-aerial`, `klia-t1-airfield`, `klia-t1-canopy`; KLIA's Terminal map card moved from the aerial to
  `klia-tower`, so the overview does not repeat its hero.
- Both new heroes are 2,560 px files (the roof and the airfield were 1,920 px: SA5 item 7's upscaling on a 1440 px
  window at device scale 2 no longer applies to the home and KLIA).

**Grade.** One subtle grade for the whole set (`grade.mjs`, session scratch folder; method in
`docs/design/photography.md`, "Colour grade"), re-exported from the downloaded Commons files with the original crops,
sizes and JPEG settings, so nothing is compressed twice: adaptive levels limited to 12/255 a side (hazy files gain
depth: the aerial's black point 24 → 14, the airfields and the wing 35 → 23), contrast pulled a third of the way to a
common spread (×0.94 to ×1.10), a highlight shoulder from 0.72 so white maps to 0.96, slight warmth weighted to the
light tones (red ×1.018, blue ×0.968), vibrance +6 %. Looked at before and after on a contact sheet of 14 files: the
set is warmer and more even, the flat aerials and bridge gain depth, the skies keep their clouds; no file looks
filtered. New blur placeholders from the graded files. **Credits**: every `modified` is now "resized and
colour-graded" or "cropped, resized and colour-graded" (type, data and `images.test.ts`, which now also requires the
word); the credits page shows "Resized, colour-graded and compressed" / "Saiz diubah, warna dilaraskan dan
dimampatkan" and its note on changes describes the grade. Licences, authors and sources unchanged. `public/images`:
11,765,206 → 12,004,275 bytes (30 files, limit 14 MB).

Files: `public/images/**` (30 files), `src/content/images.ts`, `src/content/images.test.ts`,
`src/components/home/hero-backdrop.tsx`, `src/components/home/destination-card.tsx`,
`src/app/[lang]/credits/page.tsx`, `src/lib/i18n/features/credits.ts`.

## 3. Hero load time (SA5 item 1)

**What Lighthouse charges, measured.** I re-ran Lighthouse's Lantern model on saved traces (`lantern.mjs`, session
scratch folder). For an image LCP, Lantern's graph holds every request that finished before the observed paint
(except low-priority images) and every script whose evaluation started before it, and the simulated LCP is when the
last of them would finish on slow 4G. On build 1 (`/en`): **421.8 KB** in the graph, with Fraunces 67 KB, Hanken
36 KB, Geist Mono 24 KB, 15 scripts, the icon sprite, the manifest, the 62 KB document and 35 KB of CSS; 494 KB had
finished before the observed paint at 251 ms. Fonts and scripts finish at 45 to 190 ms on the local server, the
paint comes at 230 to 310 ms (style 31 ms and layout 28 ms unthrottled, then raster and the image decode), so they
are all charged.

**Done.**

- **Fonts.** The wordmark no longer needs Fraunces: `fraunces-wordmark-520.woff2` is a static instance (opsz 144,
  weight 520, the wordmark's setting) holding only the letters of "Malaysia Airports", **2 KB** (fontTools 4.68:
  `varLib.instancer` then `subset`), preloaded as `--font-wordmark` (`font-wordmark`). The full Fraunces (67 KB) is
  **no longer preloaded** and loads only where text is set in it (the design-system page and the 404 page's Malay
  line). Geist Mono is cut to Basic Latin plus the punctuation the site uses (23 → **14 KB**). Fonts before the first
  paint: 130 → **55 KB**. Hanken (35 KB, every heading) stays whole and preloaded.
- **Below-the-fold client components deferred.** The home's board preview, journey teaser, concierge questions and
  shop and dine filters (`src/components/home/lazy-sections.tsx`) and the overview's journey modes, quick actions
  and board preview (`airport-flight-tools-lazy.tsx`; the hero's search moved to its own module,
  `airport-flight-search.tsx`) are code-split with `React.lazy`. Their HTML is still rendered on the server and is in
  the static HTML; their scripts (about 30 KB gzip on `/en`) now load during hydration, after the paint. The imports
  go through the project's `retryingImport`, so a chunk that cannot be fetched waits and retries and the section
  keeps its server HTML (build 2 imported them plainly, and with every lazy chunk failing the phone home showed
  "Something went wrong": `access-round6` P8, two failures, fixed in build 3). "Departing now" is in the desktop
  first screen, and code-split in build 2 it arrived late and moved the hero by 14 px (CLS 0.008 at 1440), so it
  stays in the first load.
- **Selectors.** The high-contrast token rule's `html[data-contrast] :is(.surface-board, .on-media)` is now four
  plain selectors, so the browser files it under the two classes instead of trying it on every element in every
  style recalculation (it survives minification as a plain list). The same change to the two
  `main:has(…) :is(…)` rules was reverted: the minifier merged them back into one `:is()` list. Measured with the
  browser's selector statistics, selector matching is about 2 ms of a full 9 ms style recalculation on the home
  (unthrottled), so this is housekeeping, not a speed change; the first recalculation's cost is the size of the
  document (1,470 elements) and of the stylesheet (198 KB), which this pass did not change.

**After (build 3, `docs/qa/lighthouse-redesign1c/`, before in `before/`).** Lighthouse 13.6, mobile defaults, 3 runs,
median; the image optimiser warmed first, as in SA2.5.

| Page | LCP before → after (runs) | Performance before → after | TBT after | CLS after | Requests, KB after |
|---|---|---|---|---|---|
| `/en` | 3.77 → **3.03 s** (3.03 / 2.73 / 3.06) | 85 → **90** | 222 ms | 0 | 55, 599 |
| `/ms` | 3.53 → **3.34 s** (3.35 / 3.04 / 3.34) | 89 → **91** | 125 ms | 0 | 55, 601 |
| `/en/kul` | 3.52 → **3.48 s** (3.65 / 3.48 / 3.34) | 87 → **89** | 164 ms | 0 | 51, 628 |
| `/en/pen` | 3.67 → **3.35 s** (3.35 / 3.04 / 3.49) | 88 → **90** | 187 ms | 0 | 48, 616 |

(`/en/pen`'s first set had one run fail with `NO_NAVSTART` and two at 3.04 s; the table gives the full second set.
Both sets' `_summary-*.json` files are in the folder.)
In Lantern's graph `/en` now holds **368.5 KB** (fonts 55 KB, scripts 189 KB including React DOM's 72 KB, document
62 KB, CSS 35 KB, the hero 15 KB, the sprite 9 KB). KLIA's new hero is a more detailed photograph (the aerial), which
offsets part of the saving there.

**Target not met, and why it cannot be with the photograph.** LCP 2.5 s or less with performance 90 or more is
**missed on `/en` (3.03 s, 90), `/en/kul` (3.48 s, 89) and `/en/pen` (3.35 s, 90)**. Two simulated paints of the same
frame show the cause: the same runs give **FCP 1.36 to 1.37 s** for the frame that also paints the photograph
(observed FCP = LCP at 217 to 315 ms), because Lantern charges a text paint only for the HTML and CSS and an image
paint for everything that arrived before it; round seven, before the photographs, measured LCP 1.37 s on `/en`,
`/ms` and `/en/kul`, and the directory moved from 1.37 s to 3.73 s this round when its first screen became
photographs (item 4). On this build the two data points of the model (421.8 KB → 3.53 s, 368.5 KB → 3.35 s) give
about 3.5 ms per KB; reaching 2.5 s would take the graph to about 125 KB, less than the document, the stylesheet and
Hanken alone (133 KB) before any script or the photograph itself. Removing the photograph from the first screen is
the only change that would meet it, and it is not done, as the brief says. With applied (real) slow-4G throttling
these heroes painted at 2.11 to 2.15 s in SA2.5.

Files: `src/fonts/index.ts`, `src/fonts/fraunces-wordmark-520.woff2`, `src/fonts/geist-mono-basic-wght-normal.woff2`
(new; the latin files they were cut from stay beside them), `src/components/art/wordmark.tsx`, `src/app/globals.css`
(`--font-wordmark`, the selector), `src/components/home/lazy-sections.tsx` (new), `src/components/home/home-sections.tsx`,
`src/components/airport/airport-flight-search.tsx` (new), `src/components/airport/airport-flight-tools.tsx`,
`src/components/airport/airport-flight-tools-lazy.tsx` (new), `src/app/[lang]/[airport]/page.tsx`.

## 4. Airports directory: a photo-led first view

**Before.** At 1440 x 900 the first screen held the page header, the "Start with" shortcuts, the search, the state
and type filters and the map; the five photo cards began below the fold.

**After.** The international group, whose five airports all have photographs of their own (KLIA, Penang, Langkawi,
Kota Kinabalu, Kuching), opens the page, directly under the page header and above the shortcuts, the search and the
filters: from 1280 px a mosaic with KLIA as the large card (two columns, two rows) and the other four around it; from
640 px two columns with KLIA across the top; on a phone a row of tall cards (82 % of the width, 21rem) that scrolls
sideways with snap, edge to edge. Each card keeps everything it had: the code, the airport's name as the link, the
place, the "selected" chip, the depth label and the KLIA terminal links, on a scrim only under the words. The domestic
and STOLport groups follow the filters as before. The search, the state and type filters and "Clear filters" act on
every group, this one included (a search for "Ipoh" empties the mosaic and the group disappears, as groups always
did); `?then=` still shows its banner first and sends every card to that section. The group's heading and count are
unchanged, and no airport appears twice, so every existing locator and test still finds one card per airport.

Lighthouse: the directory's first screen is now photographs, so its LCP is a card image, and Lantern charges it as it
charges the heroes: `/en/airports` **1.37 s (SA2.5, the verification build) → 3.73 s** (3.74 / 3.73 / 3.73),
performance 96 → **86**, CLS 0 (it was not measured on build 1). This is
the same accounting as item 3, a cost of the photo-led first view the brief asked for; it is recorded here as a
wrong-way number.

Files: `src/components/airport/airport-directory.tsx`.

## 5. The offline indicator test (SA5 item 5)

`platform.spec.ts`, "the indicator appears when the connection drops, and agrees with the status card", now reads
the status card's `data-saving`, its text and every visible status message in **one `page.evaluate`** (one snapshot
of the page), polls that snapshot until the offline toast is there, and judges that same snapshot: saving "on" → the
toast says "showing saved information"; otherwise the toast says "nothing is saved on this device yet", no status says
"showing saved information", and the card does not say "not switched on". Both branches and all four assertions are
kept, and the axe scan and "Back online" check after them are unchanged. A worker that takes control between two
reads can no longer split them. TBD-PLATFORM.

Files: `e2e/platform.spec.ts`.

## 6. `docs/design/photography.md` matches the code

Rewritten: the status (graded set, bytes), every list as the code has it (home hero order and why, airport heroes
with KLIA's new lead, home place cards and `PLACE_PREFERENCE`, destinations, discover, `DIRECTORY_IMAGES`,
`EXPLORE_IMAGES`, the one unused photograph), a "Colour grade" section, the hero shade in "Text over the photos"
(the old section listed failures the polish pass had fixed), the grade in the procedure, file sizes after the grade,
and the notes for the team brought up to date (stale items removed: the footer link and AVIF are done).

Files: `docs/design/photography.md`.

## End to end, static checks and screens

TBD-E2E-DETAIL

TBD-SCREENS

## Clean-up and how to reproduce

TBD-CLEANUP

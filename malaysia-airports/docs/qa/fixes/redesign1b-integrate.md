# Redesign stage 1b: putting the photographs to work (visual layer)

Owner: visual layer of the redesigned pages. Date: 23 November 2026 (measurements 00:14 to 02:30 UTC, 08:14 to
10:30 Kuala Lumpur time). Input: the photo library as delivered (30 licensed photographs, `src/content/images.ts`,
`docs/design/photography.md`). Scope: every photo slot, the hero's loading speed, text contrast over photographs, and
the end-to-end specs for these pages.

Measured on production builds of my own: `NEXT_DIST_DIR=.next-integrate-prod NEXT_PUBLIC_SITE_URL=http://localhost:3297
npx next build`, served by `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3297`. Three builds, all
0 warnings and 366 static pages: build 1 is the photo library as delivered (the "before"), build 2 the main changes,
build 3 the final tree (`_4-8CDbVqbBJ1xlzS6e_u`). Lighthouse is `scripts/qa/lighthouse.mjs` (Lighthouse 13.6, mobile
defaults: Moto G Power, simulated slow 4G, 4x CPU), 3 runs, median, with nothing else running.

## Result

| Item | Before (build 1) | After (build 3) |
|---|---|---|
| Photo slots | Hero, airport headers and destination cards showed photographs, but every heading block sat on a hard-edged dark box; the section bands, shop cards and My journey had none | Every slot art-directed (section 1); no box behind any words |
| `/en` LCP, performance | **3.91 s**, 85 (the hero photograph) | **3.52 s**, **90** (the hero photograph) |
| `/en/kul` LCP, performance | **3.80 s**, 86 | **3.53 s**, 89 |
| Flight page LCP, performance | **4.38 s**, 78 (the band's photograph) | **1.51 s**, **96** (the `h1`) |
| `/en/journey`, `/en/airports` | not measured with photographs | 1.22 s and 100; 1.37 s and 96 (text; no regression) |
| CLS | 0, 0, 0.004 | 0, 0, 0.004 (unchanged; 0 on journey and directory) |
| Hero photograph on a phone | 55.2 KB (WebP, quality 75, 750 px) | **15.5 KB** (AVIF, quality 65) |
| Text over photographs under 4.5:1 (3:1 large) | 3 named failures (verification and photo log) | **0 of 3,189 text runs** in light, dark and both high-contrast themes at 390 and 1440 px (lowest 5.06:1) |
| E2E (9 specs, 332 tests) | 2 failures on build 2 (one test, both projects) | 317 passed, 1 intermittent under load (passes 30 of 30 on repeat), 14 deliberate skips |

**The 2.5 s target is met on the flight page and missed on `/en` and `/en/kul` (3.52 and 3.53 s).** In Lighthouse's
own simulated timeline the hero photograph is now finished at **1.67 s**; the rest of the 3.5 s is how the simulation
counts the JavaScript and fonts that the browser had already downloaded before it painted the hero (section 2.3). With
real (applied) slow-4G throttling instead of the simulation, the hero photograph paints at **2.07 s** on `/en` and
**2.14 s** on `/en/kul`, in the same frame as the first text. Closing the simulated gap needs changes outside the
visual layer (section 2.4).

## 1. Photo slots

All photographs come from the library; none is used for a place it does not show.

- **Home hero.** The KLIA Terminal 1 canopy (white branching columns under the timber roof), the library's first
  `HOME_HERO_IMAGES` entry. Art-directed per breakpoint (`artDirection` in `src/components/ui/media.ts`, CSS variables
  read by `ART_DIRECTED_POSITION`): on a phone the hero is a slice about a fifth of the photograph's width, framed on
  the main white branch (x 0.6); from 768 px it is framed right (x 0.8), so the fan of columns sits beside the words and
  the "Departing now" panel, never behind the headline. The boxy `scrim-behind` behind the headline is replaced by a
  feathered scrim (below); the header veil is lighter on phones (52 %, where the header holds only the logo and the
  airport pill on its own ground) and the text alpha from 768 px (white navigation links).
- **Phone first screen.** Same content and order as before (the smoke test requires search, modes, the airport pill,
  the notice link and the six quick actions on a 390 x 844 screen), now with the photograph showing at the top under
  the header and through the glass panels, and no hard edges anywhere. The airport overview on a phone now opens like
  a travel app's image header: the photograph has the top 9rem of the banner to itself and fades under the name, the
  search heading stays at y < 844 (access-round6 item 3 passes).
- **Airport headers.** `heroForAirport`: each airport's own terminal for KLIA, Penang, Kota Kinabalu, Langkawi and
  Kuching; the wing above the islands (shows no airport) for the other 34. The words and the "Find a flight at …"
  heading share one feathered scrim; the photograph keeps only a soft top veil and depth at the foot (the old overall
  35 % veil is gone, so the photographs read brighter). Per-photo framing on wide screens: Kota Kinabalu keeps its name
  board in the band; Langkawi is framed low on the entrance doors.
- **Section bands** (every airport page below the overview, including the flight page). The band used to load a
  750 px photograph at 55 % opacity under a 72 % veil and was the flight page's LCP (4.4 s). It is now a blurred wash of
  the airport's own photograph made from its blur placeholder, already in the HTML: no request, never the largest paint.
- **Destination cards.** Penang Bridge, Mount Kinabalu, Pantai Cenang, the Kuching waterfront; the KLIA Terminal 1
  gateway now shows the terminal from the air instead of repeating the hero's canopy (`placePhoto` skips the hero's
  photograph); KLIA Terminal 2 its own tower. Quality 60. Loaded by `DeferredImage` (section 2.2).
- **Discover cards** (the home's shop-and-dine cards). The library's discover photographs of nasi lemak, satay and a
  George Town street stall behind the cards, decorative (alt `''`; they set the mood and claim no outlet), words on a
  card-wide scrim that is the text block's own background (so the card-wide link and its focus ring are unchanged).
- **Airports directory.** The five photo-led cards show each airport's own terminal (quality 60). No photograph was
  added to the page header: it would become the page's LCP (section 2.3).
- **My journey, empty state.** The wing above the islands in an aircraft-window frame (bezel, rounded pane, inner
  shadow) beside the words, floated on phones. Deliberately smaller than the paragraph beside it, so the page's LCP
  stays its text in the first frame (1.22 s, performance 100); a photograph filling the panel would have been painted
  after the page's scripts and land near 3.5 s like the heroes. The photograph is prepared on the journey page and
  passed down (`emptyPhoto`), so the photo library stays out of the client bundle.
- **Style guide.** Its hero is the canopy framed by width, so the column node shows at the bottom right; `HeroMedia`
  `scrim="left"` now uses the feathered scrim, and the hero clips it (`overflow-hidden`; a 2rem shadow band used to
  show under the hero). Its cards use the library.
- **Photo credits.** The credit pill on the home, airport and style-guide heroes now uses the caption size (13 px):
  at 12 px it was a ninth type size on the home and failed access-round6 "at most 8 type sizes" on both projects (the
  only e2e regression on build 2, caused by the credit appearing now that there are photographs).

## 2. Hero loading speed

### 2.1 What the photo probe's 3.5 to 4.4 s was

Not any of the usual causes, checked on build 1: the hero `<img>` is in the static HTML (Server Component), preloaded
from the `<head>` with `fetchPriority="high"` and `imageSizes="100vw"`, not lazy, no opacity or transform entrance, no
scroll-driven effect on it, `sizes` picks the 750 px file on the Moto G profile (412 px x 1.75), and the observed
(unthrottled) trace paints it in the same frame as the first text (FCP = LCP = 241 to 403 ms; image requested at 44 ms,
finished at 85 ms; LCP phases 15 / 35 / 48 / 202 ms). The 202 ms "render delay" is the first frame waiting for the
style recalculation and layout of the whole page (49 + 28 ms in one task) after the stylesheets.

The time comes from how Lighthouse's simulation (Lantern, `@paulirish/trace_engine/.../LargestContentfulPaint.js`)
builds the graph for an **image** LCP, which differs from a text LCP:

- For a text LCP painted at FCP it simulates only the render-blocking requests (HTML and CSS): 1.2 to 1.5 s, which is
  why every page measured 1.2 to 1.5 s while the library was empty.
- For an image LCP it simulates **every request that finished before the observed paint** except low-priority images,
  and takes the latest end. Async scripts count too, unless their evaluation task was long enough (10 ms) to survive
  graph pruning and ran after the paint. On this app the 16 to 17 JavaScript chunks (about 280 KB) finish 25 to 60 ms
  before the first frame is presented (their responses are processed right after the long first-frame task), so they
  all count, plus the three fonts (127 KB) and the icon sprite.
- The pessimistic half of the estimate also counted the home's below-the-fold destination photographs (five, 124 KB):
  Chrome's own `loading="lazy"` requests images within 1,250 to 2,500 px of the fold during the first layout, and the
  cards sit at 2,070 to 2,800 px on a phone.

Recomputing Lantern from a saved build-1 trace (`lantern.mjs` in the session scratch folder): optimistic 4.11 s,
pessimistic 4.41 s; the hero image itself ended at 3.17 s in the simulation, and the last nodes were the fonts
(Fraunces 3.47 s) and the framework chunk (4.11 s). Removing every script from the HTML (a test variant served
through a proxy) still gave 2.97 s; removing the scripts and the card images 2.58 s: the hero, HTML, CSS and fonts
alone sat at the 2.5 s line with the old 57 KB image.

### 2.2 What changed

1. **AVIF and quality.** `next.config.ts` `images.formats: ['image/avif', 'image/webp']`, `images.qualities: [60, 65,
   75]`; heroes quality 65 (`HeroBackdrop`, `AirportBackdrop`, `HeroMedia`), cards 60. Hero on a phone 55.2 KB WebP →
   **15.5 KB AVIF** (11.9 KB at 640 px; 74 KB at 1,920 px for desktops). In the simulation the hero now finishes at
   1.67 s instead of 3.17 s.
2. **Below-the-fold photographs wait.** `src/components/ui/deferred-image.tsx` (`DeferredImage`, client): a `fill`
   photograph requested only when its box comes within one viewport, after hydration, with the blur placeholder until
   then (no layout shift; without JavaScript the placeholder stays). Used for the home's destination and discover cards.
   On the home the first load is 52 requests and 665 KB instead of 55 and 828 KB, and the pessimistic estimate no
   longer includes the cards.
3. **The flight page's band** is no longer a photograph (section 1): its LCP is now the `h1` in the first frame.
4. Kept: `preload`, `fetchPriority="high"`, `sizes="100vw"`, no animation, Server Component, static HTML.

### 2.3 Numbers (median of 3; runs in brackets)

| Page | Performance | LCP | LCP element | TBT | CLS | KB / requests |
|---|---|---|---|---|---|---|
| `/en` before | 85 | 3.91 s (4.78 / 3.91 / 3.89) | hero photograph | 176 | 0 | 828 / 55 |
| `/en` after | **90** | **3.52 s** (3.55 / 3.52 / 3.52) | hero photograph | 108 | 0 | 665 / 52 |
| `/en/kul` before | 86 | 3.80 s (4.11 / 3.78 / 3.80) | hero photograph | 160 | 0 | 715 / 46 |
| `/en/kul` after | 89 | **3.53 s** (3.53 / 3.78 / 3.52) | hero photograph | 119 | 0 | 681 / 46 |
| Flight page (AK 6336, 23 Nov) before | 78 | 4.38 s (4.38 / 4.41 / 4.19) | the band's photograph | 291 | 0.004 | 783 / 52 |
| Flight page after | **96** | **1.51 s** (1.52 / 1.51 / 1.51) | the `h1` | 204 | 0.004 | 731 / 51 |
| `/en/journey` after | 100 | 1.22 s | the empty state's paragraph | 69 | 0 | 562 / 39 |
| `/en/airports` after | 96 | 1.37 s | the lead | 204 | 0 | 653 / 45 |
| `/en`, applied slow-4G throttling | 81 | **2.07 s** (2.06 / 2.07 / 2.08) | hero photograph, = FCP | 616 | 0 | |
| `/en/kul`, applied slow-4G throttling | 80 | **2.14 s** (2.14 / 2.15 / 2.12) | hero photograph | 703 | 0.004 | |

Summaries: `docs/qa/lighthouse-redesign1b/before/`, `after/` and `after-applied-throttling/` (port 3297). Applied
throttling = `--profile=slow4g-applied,150,1638,750,4` (Lighthouse's mobile slow 4G and 4x CPU, applied by DevTools
instead of simulated; its TBT is higher because the CPU slowdown is real). The image optimizer's cache was warmed
before measuring (a first AVIF encode takes 0.3 to 2.7 s per size; see section 6).

Where the remaining simulated time goes on `/en` after (Lantern recomputed from a saved trace, both estimates 4.08 s
in that run): document 61 KB ends at 0.91 s, the hero at **1.67 s**, the main stylesheet 2.27 s, Hanken 2.42 s,
Fraunces (67 KB) 3.47 s, the icon sprite 3.81 s and the 72 KB framework chunk 4.08 s; 16 script chunks are in the graph.

### 2.4 What would bring the simulated LCP under 2.5 s (outside the visual layer)

- **JavaScript that finishes before the first frame** (about 280 KB, 16 chunks): fewer or later chunks on the home and
  overview (the shell team: `docs/qa/verification.md` S5 item 4 already lists first-load JS +8 to +13 KB).
- **Fonts:** Fraunces (67 KB) is preloaded mainly for the header wordmark; an outlined SVG wordmark would let it load
  late (fonts and `src/components/art/wordmark.tsx` owners). Geist Mono (24 KB) is discovered by the CSS.
- **First-frame cost:** 49 ms of style recalculation for about 1,000 elements on a fast machine points at the 181 KB
  stylesheet's selectors (`:where(.on-media, .on-media *)` scopes, `has-[…]` variants).
- Or a product decision: a phone hero whose largest element stays text (verification S5 item 1), which conflicts with
  the brief for a photographic first screen. Not done.

No measure was taken that only moves the metric: no tiny low-resolution placeholder made large enough to count as
the LCP, no hiding the photograph from the LCP algorithm, no delaying it behind JavaScript.

## 3. Contrast over photographs

**Method** (`photo-contrast.mjs` in the session scratch folder): load the page with the theme preference set (light,
dark, each with high contrast on and off), scroll through so every deferred photograph loads, wait for every image to
decode; collect each visible text node whose line boxes overlap a photograph or the band's wash (line boxes clipped by
overflow ancestors, so truncated text ends at its ellipsis; the fixed phone tab bar hidden); make all text transparent;
take a full-page screenshot and compare each run's colour with the **brightest 1 %** of the pixels under its line boxes
(the darkest 1 % for dark text). Pass: 4.5:1, or 3:1 for large text. 13 pages (`/en`, `/ms`, `/en/kul`, `/ms/kul`,
`/en/pen`, `/en/bki`, `/en/lgk`, `/en/kch`, `/en/szb`, `/en/airports`, `/en/journey`, `/en/design-system`, the flight
page), 390 and 1440 px.

**Fix.** A new `scrim-feather` utility (`globals.css`): one layer behind a block of words that runs off the left edge,
holds `--scrim-feather-alpha` (70 %; 92 % in high contrast; none in forced colours) under the whole block however it
wraps, and feathers out 12rem to the right, 7rem above and 2rem below (mask gradients), so there is no visible box.
At 70 % over pure white, white text is at 6.7:1, the secondary ink at 6.5:1 and the gold accent at 4.6:1. Used on the
home headline, the airport banner (words and the search heading together) and `HeroMedia`. `scrim-header` (the veil
under the header) replaces the inline gradient.

| Text | Before | After (all themes, both widths) |
|---|---|---|
| Home `h1` gold line "beautifully connected." | 1.27 to 1.38:1 (verification probe, white photograph) | **5.21 to 19.76:1** (with the Malay line) |
| "Find a flight at KLIA" (and every airport) | 2.58 to 2.65:1 (probe); 2.37 to 4.26:1 (real photographs, photo log) | **8.33 to 19.31:1** |
| Airport code (KUL, PEN, BKI …) at 1440 px | 2.73 to 3.73:1 (photo log: at the box's rounded corner) | **7.79 to 20.36:1** |
| Section band text (flight page, `/ms/pen/flights`, `/en/kul/transport`) | | lowest 8.4:1 |

Build 2: 3,060 text runs over photographs, 0 under the minimum. **Final build: 3,192 text runs (eight theme and width
cases x 13 pages), 0 under the minimum, lowest 5.06:1** (the style guide's gold eyebrow "Design system · Direction v2",
1440 px, dark); the home's accent line 5.21 to 19.76:1 (Malay "rancang perjalanan anda." lowest), every "Find a flight
at …" 8.33 to 19.31:1, every airport code 7.79 to 20.36:1. Three runs had no visible pixels (airline names in the home's
"Departing now" panel in Malay, truncated to nothing by their row) and are not counted. Results:
`contrast/b3-*.json` in the session scratch folder. axe ran in the e2e specs below (no violation in any passing scan).

## 4. End-to-end on the production build

`PLAYWRIGHT_BASE_URL=http://localhost:3297 npx playwright test e2e/{shell,smoke,flights,trust,layout-round4,
access-round6,speed-round5,verify-round7,handoffs}.spec.ts --trace off --workers 3`, desktop and phone projects.

| Build | Tests | Passed | Failed | Skipped |
|---|---|---|---|---|
| 2 | 332 | 316 | 2 | 14 (deliberate, project-specific) |
| 3 (final) | 332 | 317 | 1 | 14 |
| 3, the failed test `--repeat-each=5`, both projects | 30 | 30 | 0 | 0 |

- Build 2's failure: access-round6 "at most 8 type sizes on the home with a saved flight", both projects: 9 sizes, the
  ninth the photo credit at 12 px. Fixed (section 1); passes on build 3.
- Build 3's failure: shell A-05 "focus lands on the new heading after /en" (desktop), during a run that shared the
  machine with the contrast checker; 30 of 30 on repeat, and it passed on build 2. Recorded as intermittent under load.
- No test was changed, skipped or deleted.

## 5. Files changed

- `src/components/ui/media.ts`: `artDirection`, `ART_DIRECTED_POSITION`, `Focal`.
- `src/components/ui/deferred-image.tsx` (new): `DeferredImage`.
- `src/components/ui/hero-media.tsx`: quality 65, feathered scrim for `left`, clips its scrim, credit size.
- `src/components/ui/media-card.tsx`, `src/components/ui/card.tsx`: quality 60.
- `src/components/home/hero-backdrop.tsx`: art direction, quality 65, `scrim-header`.
- `src/components/home/home-sections.tsx`: feathered headline scrim, `overflow-x-clip` hero, credit size, discover
  photographs on the shop-and-dine cards.
- `src/components/home/destination-card.tsx`: `DeferredImage`, quality 60, no repeat of the hero's photograph.
- `src/components/airport/airport-backdrop.tsx`: hero art direction and quality, no overall veil; the band's wash.
- `src/components/airport/airport-header.tsx`: one feathered scrim for the words and the search heading; phone image
  header; credit size.
- `src/components/airport/airport-directory.tsx`: quality 60.
- `src/components/flights/journey-empty.tsx`, `src/components/flights/my-journey.tsx`: the aircraft window.
- `src/app/globals.css`: `scrim-feather`, `scrim-header`, `--scrim-feather-alpha`, `--scrim-header-alpha`.
- Outside the listed files, the minimum the assignment needs: `next.config.ts` (`images.formats`, `images.qualities`:
  AVIF and quality 60 to 70 cannot be served without them) and `src/app/[lang]/journey/page.tsx` (passes the empty
  state's photograph down: one prop).
- `docs/qa/lighthouse-redesign1b/` (new) and this log.

Checks on the final tree: `tsc --noEmit` 0 errors, `eslint` 0 problems, `vitest run` 615 of 615.

## 6. Open items

1. **Simulated LCP on the photographic heroes: 3.5 s against 2.5 s** (section 2.4). Team (shell, fonts) or owner
   (a text-led phone hero).
2. **First AVIF encode is slow** (0.3 s at 750 px, 2.7 s at 3,840 px on this machine). In production the optimized
   images must be cached at the edge or warmed after each deployment, or the first visitor of each size waits.
   Platform.
3. **Section-band wash**: built from the 16 x 8 blur placeholder, so it is a colour field, not a picture; if the band
   should show the photograph, it must stay out of the LCP (for example a small image under the `h1`'s size). Design.
4. Langkawi's band on wide screens: the large "Departure" sign stays beside the heading at 1440 px whatever the frame
   (the banner shows 83 % of the photograph's height). It is the airport's own entrance; acceptable, but a tighter
   photograph would be better. Photo library.
5. Shop-and-dine shows one card today (only KLIA has published outlets); the second and third discover photographs
   appear when more airports publish outlets.

## 7. Clean-up and how to reproduce

- My processes: the production server (process group 16337 for build 2, 3813 for build 3, 8816 for build 1) and a
  variant proxy (process groups 11295, 11817 and later) on 3298, each stopped by its process group. Playwright output
  went to the session scratch folder (`--output`), not `test-results/`.
- `.next-integrate-prod` deleted at the end, and the lines Next.js added for it removed from `tsconfig.json` and
  `next-env.d.ts` (restored from copies taken at the start; SHA-256 identical). The servers also wrote the demo
  metrics file `.data/metrics.json` (git-ignored), left in place. One `git --version` ran by mistake at the very end (it prints the program's version and does not
  read the repository); no other git command was run.
- Scripts in the session scratch folder (`rd1b-integrate/scripts/`): `trace.mjs` (unthrottled trace), `lhrun.sh` and
  `lantern.mjs` (full Lighthouse run and the Lantern graph behind its LCP), `variant-proxy.mjs` (serves edited HTML for
  experiments), `photo-contrast.mjs` and `contrast-matrix.sh`, `shots.mjs` and `fullshot.mjs`.

```bash
NEXT_DIST_DIR=.next-integrate-prod NEXT_PUBLIC_SITE_URL=http://localhost:3297 npx next build
NEXT_DIST_DIR=.next-integrate-prod TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3297 &   # stop by process group
B=http://localhost:3297; LIGHTHOUSE_CLI=<lighthouse>/cli/index.js node scripts/qa/lighthouse.mjs out 3 --diagnostics \
  en=$B/en en-kul=$B/en/kul flight-page=$B/en/kul/flights/<id> en-journey=$B/en/journey en-airports=$B/en/airports
PLAYWRIGHT_BASE_URL=$B npx playwright test e2e/{shell,smoke,flights,trust,layout-round4,access-round6,speed-round5,verify-round7,handoffs}.spec.ts --trace off
```

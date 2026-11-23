# Redesign stage 1b: polish before the client sees it

Owner: lead designer-engineer (everything the integrate engineer owned, `src/components/common/**`, and the choice
and framing of photographs in `src/content/images.ts`). Date: 23 November 2026, 01:50 to 03:05 UTC (09:50 to
11:05 Kuala Lumpur time). Input: `docs/design/critique-redesign1b.md` (6.4 / 10, six must-fix items, 22 ranked
improvements). Baseline for speed and contrast: `docs/qa/fixes/redesign1b-integrate.md`.

Measured on production builds of my own: `NEXT_DIST_DIR=.next-polish2-prod NEXT_PUBLIC_SITE_URL=http://localhost:3299
npx next build`, served by `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3299`. Two builds, both
0 warnings and 366 static pages; build 2 (`w7MECbpPrQ_qvvKfdk1Dz`) is the tree below except one CSS value changed
after it (`--scrim-header-alpha`, section 3), which was checked on a dev server. Iteration ran on a dev server
(`.next-polish2-dev`, port 3290). Screens were looked at in 8 captures (contact sheets).

## Result

| Check | Integrate (before) | This pass (build 2) |
|---|---|---|
| Flight page CLS, delayed flight with check-in closed (`cx767-20261123-d`, clock 09:44) | 0.106 at 1440, 0.084 at 390 (reproduced) | **0.004 at 1440, 0.005 at 390** (0.0036 of it is the site header's airport pill, not this package) |
| My journey CLS, that flight saved, 390 | 0.055 | **0.0005** (0.0001 at 1440) |
| CLS, load and one scroll: `/en`, `/ms`, `/en/kul`, board, `/en/airports`, `/en/pen`, `/en/credits` | at most 0.005 | **0 to 0.0046** |
| `/en` LCP, performance (Lighthouse mobile, median of 3) | 3.52 s, 90 | **3.50 s** (3.47 / 3.51 / 3.50), **90**, the hero photograph |
| `/en/kul` | 3.53 s, 89 | **3.49 s** (3.77 / 3.49 / 3.31), 88 (TBT 177 ms against 119) |
| Flight page (AK 6336) | 1.51 s, 96 | **1.52 s**, 94 (TBT 287 ms against 204), the `h1` |
| `/en/journey`, `/en/airports` | 1.22 s, 100; 1.37 s, 96 | **1.21 s, 100; 1.37 s, 96** |
| Text over photographs under 4.5:1 (3:1 large) | 0 of 3,192 runs, lowest 5.06 | build 2: 8 of 2,844 (the wordmark on the phone home, 4.02:1, one cause), **fixed: 0**, lowest 5.06 (section 3) |
| axe (WCAG 2.0 to 2.2 A and AA), 9 pages x 2 sizes, delayed-flight clock | phone board: 1 serious (`target-size`) | **0 violations on all 18 scans** |
| E2E, the integrate engineer's 9 specs + `flight-round5` (with the 4 new CLS tests) | 317 passed, 1 intermittent | **348 passed, 0 failed, 18 deliberate skips** (366) |
| `tsc`, `eslint`, `vitest` | 0, 0, 615 / 615 | **0, 0, 616 / 616** (one new journey test) |

Lighthouse summaries: `docs/qa/lighthouse-redesign1b/polish/`. The scores moved only with total blocking time,
which varies run to run on this machine; every LCP is within 0.04 s of the integrate result.

## Must fix before the client sees it

1. **Flight page layout shift (item 1): done.** Cause, measured: the "Your next step" panel held two skeleton lines
   and grew to three lines plus the Fast Track row when the feed answered; inside the status card the phone caption
   "95 minutes later than scheduled" pushed the time onto a line of its own (+48 px) and two skeletons were 4 px
   taller than their values. Fix (`flight-summary.tsx`, `flight-detail.tsx`, `flight-status-hero.tsx`): every row of
   the panel has a fixed height before and after the feed: the sentence is exactly three lines on phones and two from
   640 px (`line-clamp` with `h-[3lh]` / `h-[2lh]`; the "See this step" link leads to the whole step), the link row is
   as tall as the link, and the Fast Track row comes from the timetable and the content (`fastTrackFor`: route,
   terminal, airport record; never the clock), so it is in the frame from the first paint (kept invisible, with its
   room, for a departed or cancelled flight). The phone status caption is short ("95 min late", "Lewat 95 min"; the
   full sentence stays in the screen-reader line); the gate and time skeletons now match their values.
   **My journey (0.055): done, different cause.** "My needs" did not collapse: the saved-flight card above it grew from
   112 to 257 px when the feed answered and pushed it down (the observer reported the visible part shrinking).
   The loading card now has the loaded card's three parts at their sizes (`saved-flight-card.tsx`), and the next-step
   strip keeps the room of two lines. **E2E:** four new tests in `e2e/flight-round5.spec.ts` (flight page and My
   journey, 390 and 1440, clock fixed at 09:44 on 23 November, shifts inside `<main>` at most 0.01).
2. **A photograph on the phone's first screen (items 2 and 11): done.** Home: the photograph is a band of its own
   (`--hero-band`: the header and 14.5rem, about 39 % of a 390 x 844 screen) instead of a slice behind every control;
   the `h1` stands at its foot on a scrim that rises only 4rem above the words (`--scrim-feather-top`), the search card
   overlaps the photograph's lower edge by 2rem, and the controls below sit on midnight. The six quick actions are one
   row of compact pills that scrolls sideways (snap, edge to edge, about 56 px instead of two rows of 76 px tiles). Not
   done as the critique wrote it: the notice strip stays in the first screen and "Search arrivals instead" stays on
   phones, because `smoke.spec.ts` requires the notice's Details link in the first screen and that button visible; the
   strip's "Services at KLIA now" row also has to stay above the tab bar for the hand-off test (build 1 put it at
   817 px, axe then flagged the search button half under the sticky header after the test scrolled; the band was cut
   from 17 to 14.5rem and the tiles became pills, row now at 737 px). Airport headers: on a phone the photograph is a
   19rem band at the top with no veil (the site header has its own ground), fading into midnight under the words; KLIA
   now leads with the Terminal 1 roofline across the airfield (`klia-t1-airfield`), so the phone shows sky and the
   row of domes instead of 140 px of dark timber. Penang shows hills, towers and the terminal in full.
3. **"Departing now" truncation (item 4): done.** The destination has the row's width and is never ellipsized (it may
   wrap); line 2 holds the flight number and the status pill; the airline name is gone (the number says it). Checked
   with the longest Malay labels in view ("Pulau Pinang", "Daftar masuk ditutup", "Panggilan terakhir"). Rows are a
   fixed 64 px, so the panel does not move when the feed answers.
4. **Phone board destinations and `target-size` (item 5): done.** The city and code keep their whole width (no
   `truncate`, wrap allowed); the status pill moves under them, right-aligned, only when both do not fit; the airline
   name is visually hidden below 640 px (kept for screen readers; badge and number stay). The link is the whole city
   name, so its own target is never squeezed: axe finds 0 violations on the phone board.
5. **Timeline's wrong time (item 6): done.** `buildJourney` sets a closed check-in step's `time` to its closing time
   (`src/lib/journey/index.ts`); new unit test for a delayed flight whose check-in has closed (`journey.test.ts`).
6. **Signage crops on the directory (item 7): done.** Focal points cannot help: a card about 1.3:1 always shows the
   photograph's full height and two thirds of its width, so both signs are cut whatever the focus. New
   `DIRECTORY_IMAGES` in `images.ts` (one line in `src/app/[lang]/airports/page.tsx`): Kota Kinabalu shows its
   terminal across the airfield (the critique's alternative), Langkawi shows Pantai Cenang by its runway (its only
   airport photograph has "Perlepasan / Departure" across the top third). Every directory card now has a scrim only
   under the words, fading 3rem above them (`--scrim-behind-fade`), and is 1 to 2rem taller, so most of each photograph
   is untinted.

## Ranked improvements

| # | Item | Status | Notes |
|---|---|---|---|
| 3 | Desktop hero graded into mud | **Done, except the grading** | `HOME_HERO_IMAGES` leads with the Terminal 1 roof canopies against the sky (`klia-t1-roof`), the timber ceiling second. `scrim-bottom` cut to the bottom third (behind the glass tiles); the words keep their own feathered scrim. Not done: grading the 30 library files (it changes licensed files and the photography pipeline, outside my ownership; proposed for the photo library owner). |
| 8 | Home first view crowding | **Part** | The active tile is a gold outline, not a white fill, so there is one "selected" state (`common/quick-action.tsx`). Tiles straddling the hero edge and moving the notice strip out of the hero: not done (the smoke test keeps the notice in the first screen; a structural change to the hero for a second build was not safe). |
| 9 | Place photographs below airport heroes | **Done for Explore** | `EXPLORE_IMAGES`: KLIA Flights = apron at night, Terminal map = the aerial, Shops and food = nasi lemak, Lounges = the canopy; Penang Flights = its terminal, Shops = a George Town stall; Kota Kinabalu and Kuching Flights = their terminals. Only that airport's photographs (or a Malaysian dish), loaded near the viewport only (`DeferredImage`), words on a scrim. "Beyond the airport" strip: not done. |
| 10 | "Status not available" above queue estimates | **Part** | The caption reads "Status not available · demo estimates below" (Malay too). The equal-height layout and footnote line: not done. The words "Status not available" stay because `trust.spec.ts` checks them. |
| 11 | Airport heroes on phones | **Done** | See must-fix 2. |
| 12 | Flight band and My journey imagery | **Not done** | A 240 to 280 px photograph would become the flight page's LCP again (integrate: 4.38 s when the band was a photograph, 1.51 s as a wash). Needs a design that keeps the `h1` the largest paint. |
| 13 | Board chips and sticky headers | **Part** | The status chip strip is wider beside the search (`min(56rem, 64%)`, was `min(40rem, 50%)`). Stacked sticky group headers and the floating Demo pill: not done (the pill is the A-14 "one Demo marker per view" mechanism that tests rely on). |
| 14 | Destination and gateway cards | **Part** | Langkawi focal x 0.35 (beach, not rocks); scrim only under the words (3rem fade) instead of a whole-card tint; the KLIA Terminal 1 gateway prefers the aerial over the ceiling. Not done: leading with Mount Kinabalu (the order comes from the network list, not the library) and a smaller Subang card. |
| 15 | Hero load speed | **Not done** | Pre-generated AVIF outside next/image needs a build step and `next.config.ts`; LCP held at 3.50 / 3.49 s. Warm every hero URL before a client demo (integrate open item 2 stands). |
| 16 | Third copy of the tiles on KLIA | **Not done** | The mode switch with its guidance is a feature of the overview and is covered by tests; folding it into "At a glance" needs the overview owner's call. |
| 17 | Dark mode board | **Done** | In dark mode the board surface is one step above the page (`#0c1430` against `#060a18`) with a 1 px top highlight (`flight-board.tsx`). |
| 18 | Malay labels that wrap | **Part** | "Menjemput seseorang" is now "Menjemput" in the mode switch (the description keeps the full words); strip links use `text-balance`. "Ruang menunggu (lounge)" kept: the glossary test (A-21, one noun per section) requires the tile to match the section tab, nav and page title; the tiles are now one row of equal-height pills, so it no longer makes the row uneven. |
| 19 | My journey card as hero | **Not done** | Copy "Gate closed 09:40 · departs 09:55" comes from the journey builder and its tests; layout change left for the next pass. |
| 20 | Flight page rhythm | **Part** | Save is the one filled button; Follow, Share, Add to calendar and My needs are quiet icon-and-label buttons. Gap: unchanged. |
| 21 | Credits on phones | **Not done** | A disclosure would hide licence details that the honesty brief wants visible; needs a decision. |
| 22 | Older airport photographs | **Noted** | Langkawi (2014) and Kota Kinabalu (2015) stay for the showing; the directory no longer uses either. |

## 3. Contrast over photographs

Method and script as in the integrate log (`photo-contrast.mjs`: every text run over a photograph, brightest 1 % of
the pixels under it, light, dark and both high-contrast themes, 390 and 1440 px, the same 13 pages). Build 2:
2,844 runs (fewer than 3,192 because the phone home's controls now sit on midnight, not on the photograph), 8 under
the minimum, all one cause: the header wordmark "Malaysia Airports" on `/en` and `/ms` at 390 px, 4.02:1, over the
canopy rims the new home photograph puts under the header. Fix: `--scrim-header-alpha` 52 % to 60 % on phones
(`globals.css`; 5.2:1 over pure white). Re-run on the dev server for `/en` and `/ms` at 390 px in all four themes:
61 runs each, 0 under, the wordmark at 5.29:1, lowest 5.13:1. Every other run passed on build 2: lowest 5.06:1 (the
"Departing now" times over glass at 1440, as before), "beautifully connected." 5.13:1 on the phone band.

## Files changed

- Flight pages: `src/components/flights/flight-summary.tsx`, `flight-detail.tsx`, `flight-status-hero.tsx`,
  `saved-flight-card.tsx`, `flight-row.tsx`, `flight-board.tsx`, `board-toolbar.tsx`, `ops-status.tsx`,
  `flight-actions.tsx`; `src/lib/journey/index.ts` and `journey.test.ts`; `src/lib/i18n/features/flights.ts`
  (`minutesLateShort`, `demoEstimates`), `src/lib/i18n/ms.ts` ("Menjemput").
- Home: `src/components/home/hero-backdrop.tsx`, `home-sections.tsx`, `departing-now.tsx`, `mode-quick-actions.tsx`,
  `destination-card.tsx`, `notice-strip.tsx`; `src/components/common/quick-action.tsx`.
- Airports: `src/components/airport/airport-header.tsx`, `airport-backdrop.tsx`, `airport-directory.tsx`;
  `src/app/[lang]/airports/page.tsx` (one line), `src/app/[lang]/[airport]/page.tsx` (Explore photographs).
- `src/app/globals.css` (`--scrim-feather-top`, `--scrim-behind-fade`, `--scrim-header-alpha` 60 %);
  `src/content/images.ts` (hero order, KLIA hero, Langkawi focal, `DIRECTORY_IMAGES`, `EXPLORE_IMAGES`).
- `e2e/flight-round5.spec.ts` (four tests added; none changed, skipped or deleted).
- `docs/qa/lighthouse-redesign1b/polish/` and this log. `docs/design/photography.md` does not yet name the new hero
  order and directory choices (for the photo library owner).

## Clean-up and how to reproduce

- My processes, each stopped by its process group: dev servers 26239, 10443, 24211 (port 3290); production servers
  672 (build 1) and 11269 (build 2) on port 3299. Playwright output went to the session scratch folder.
- `.next-polish2-dev` and `.next-polish2-prod` deleted; `tsconfig.json` and `next-env.d.ts` restored from copies taken
  at the start (SHA-256 identical). `.data/metrics.json` and `tsconfig.tsbuildinfo` (both git-ignored) were written
  by the servers and `tsc`. No git command was run; `.next` was not touched.
- Scripts in the session scratch folder (`rd1b-polish2/scripts/`): `probe.mjs` (CLS sources, fixed clock, held feed,
  saved flight, screenshots), `axe.mjs`, `ts.mjs` (the target-size diagnosis), `warm.mjs`, `photo-contrast.mjs`;
  results in `rd1b-polish2/contrast/`.

```bash
NEXT_DIST_DIR=.next-polish2-prod NEXT_PUBLIC_SITE_URL=http://localhost:3299 npx next build
NEXT_DIST_DIR=.next-polish2-prod TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3299 &   # stop by process group
PLAYWRIGHT_BASE_URL=http://localhost:3299 npx playwright test e2e/{shell,smoke,flights,trust,layout-round4,access-round6,speed-round5,verify-round7,handoffs,flight-round5}.spec.ts --trace off --workers 3
B=http://localhost:3299; LIGHTHOUSE_CLI=<lighthouse>/cli/index.js node scripts/qa/lighthouse.mjs out 3 --diagnostics \
  en=$B/en en-kul=$B/en/kul flight-page=$B/en/kul/flights/ak6336-20261123-d en-journey=$B/en/journey en-airports=$B/en/airports
```

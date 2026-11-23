# Redesign 3: performance (first-load JavaScript, photo-led LCP, the board's Demo label)

Fix log for the three performance items left open by verification round eight (`docs/qa/verification.md`, V6
items 1 to 3). 23 November 2026, one engineer, in parallel with another engineer in the same folder.

**Result in one line:** first-load JavaScript is back to **17 of 40 routes at 170 KB gzip or less** (round eight:
4; none over 250), the board's floating Demo label is now decided by CSS and its test passed **300 of 300**
(both projects, three boards, `--repeat-each=50`, 4 workers), and **LCP in Lighthouse's simulation did not move**
on the five photo-led pages (about 3.0 s; 1.9 to 2.1 s with applied slow-4G throttling). Section 2 shows why,
with the trace, and what would move it.

## How it was measured

- Builds: `NEXT_DIST_DIR=.next-perf-prod NEXT_PUBLIC_SITE_URL=http://localhost:3372 npx next build`, served with
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3372`. Three builds: **build 1** the baseline (the
  tree as found, including the other engineer's work at that moment), **build 2** a mid-point, **build 3** the
  final code (every "after" number below; build 3 differs from build 2 only in the board label's script and CSS).
  The other engineer's concurrent edits are in both builds (for example the transport place band now shows the
  KLIA Ekspres photograph, and the transport route gained 1.7 KB in its own components, where this round only
  removed code); they are called out where they move a number.
- First-load JavaScript: `node scripts/qa/first-load-js.mjs .next-perf-prod <out>` (gzip KB, framework 128.7).
- Lighthouse: `scripts/qa/lighthouse.mjs`, Lighthouse 13.6.0, mobile defaults (simulated slow 4G, 4x CPU), **3
  runs, median**, `--diagnostics`; and the same pages with applied throttling (`--profile=slow4g-applied,150,1638,750,4`).
  Images were requested once before each batch (the optimizer's first AVIF encode is not what is measured). The
  machine is shared: during the baseline and build 2 runs the other engineer's test runs pushed the load average
  to 10 to 19, which inflates TBT and adds LCP noise; the final runs were made at a load average of 1 to 2.
- Raw outputs (session scratch folder, not in `docs/`): `rd3-perf/lh-before*`, `rd3-perf/lh-after*`,
  `rd3-perf/fljs-*.txt`, the trace of a transport run (`rd3-perf/trace/`).

## 1. First-load JavaScript (V6 item 3)

**Cause.** `PageHero` imports `HeroMedia`, which rendered `next/image`. `next/image` is a Client Component, so every
route that imported `PageHero` shipped its client code (about 5.7 KB gzip, `data-nimg` in the route chunk), also
terms, privacy, notices, search, help, concierge and offline, which show no photograph. The same held for
`MediaCard` (the guides' Client Component cards), `CardMedia`, the home and airport heroes and the home's
deferred cards.

**Change.** A server-rendered photograph, `Photo` (`src/components/ui/photo.tsx`):

- It writes the same `<img>` as `next/image` (`/_next/image?url=…&w=…&q=…`, a `srcSet` of the widths the `sizes`
  can use, the blurred placeholder behind it, the fill styles) with no state and no effects, so a Server
  Component ships no script for it and a Client Component adds a few hundred bytes. Every photograph on the site
  fills a box its parent reserves, never changes after it is drawn and needs no load handler, so nothing of
  `next/image`'s client behaviour was in use. The placeholder stays under the opaque photograph after it loads
  (`next/image` removed it with script); nothing shows through a cover-fitted photograph.
- The optimizer's widths and qualities moved to `src/components/ui/image-config.ts`, which `next.config.ts` passes
  to `images` and `Photo` reads, so `Photo` only writes URLs the optimizer accepts. `photo.test.ts` checks that the
  widths are still Next.js 16's defaults and that `Photo`'s `src`, `srcSet` and `sizes` equal `getImageProps`'s
  for four `sizes` shapes (8 tests).
- Loading is explicit: lazy by default; `priority` (the page's largest paint: eager, `fetchPriority` high) or
  `eager`. React's server renderer preloads any `<img>` that is not lazy, in the head, before the stylesheets.
- Used by `HeroMedia` (so `PageHero`), `MediaCard`, `CardMedia`, `DeferredImage`, the home and airport heroes
  (`hero-backdrop.tsx`, `airport-backdrop.tsx`), the airports directory, the empty My journey window and the place
  band (outside my paths, below). No component in my paths imports `next/image` now; the credits page, the
  design-system showcase, the lounges glance panel and the transport option card still do (not mine).

**Result** (gzip KB; build 1 → build 3; 40 page routes):

| Routes | Before | After |
|---|---|---|
| At 170 KB or less | **4** (credits, terms, not-published, catch-all) | **17** |
| Over 250 KB | 0 | 0 |

| Route | Before | After | Route | Before | After |
|---|---|---|---|---|---|
| corporate hub and 7 more corporate routes | 173.1 | **167.9** | home | 202.4 | 196.5 |
| corporate/about | 173.1 | **168.3** | KLIA overview | 200.5 | 196.4 |
| corporate/business | 173.7 | **168.1** | board / flight page | 207.2 / 208.1 | 202.1 / 202.9 |
| about this prototype | 173.6 | **168.1** | map | 202.9 | 198.3 |
| guides hub | 173.7 | **169.4** | parking | 195.9 | 190.7 |
| help | 175.5 | **169.8** | transport | 190.3 | 192.0 (+1.7: the route's own components changed meanwhile) |
| terms | 169.9 | **164.6** | search / concierge / privacy | 196.8 / 190.9 / 193.5 | 192.0 / 185.0 / 188.7 |
| credits, not-published, catch-all | 169.9 / 167.5 / 163.6 | unchanged | guide pages | 176.1 | 171.2 |
| | | | offline / notices / help topic | 177.6 / 178.3 / 184.1 | 172.0 / 172.5 / 178.4 |
| | | | My journey | 228.6 | 223.9 |

Every route that used one of the converted components lost 4.1 to 5.9 KB; lounges and shop-dine (the glance panel,
not mine) did not. Lighthouse's page weight fell with it, also through the prefetched chunks of linked routes:
home 619 → 591 KB, KLIA 618 → 601, transport 618 → 593, parking 602 → 587, guides 576 → 555, concierge 538 → 514.

**Margins and what is left.** Help (169.8) and the guides hub (169.4) are within 0.6 KB of the line. The next
routes (guide pages 171.2, offline 172.0, notices 172.5) need 1.2 to 2.5 KB from the shared layout chunks, and the
two largest pieces there are outside my paths: the whole airports registry with the group contacts (4.5 KB gzip,
`@/content/airports`, in every route through `src/lib/hooks/use-airport-context.ts`; the shell needs only slugs and
short names) and tailwind-merge (8.4 KB, `src/lib/cn.ts`, in every route). The icon registry's name list (1.5 KB)
is mine but its circle fallback is a tested behaviour, so it was left.

**CSS** in the first load: 33.9 → **34.1 KB** gzip (+0.2 KB, about the size of the board label's new rules). Not
reduced: one Tailwind sheet serves every route (216 KB raw, 184 KB of it utilities that
are in use; scanning only `src/` instead of the whole project would save 0.3 KB gzip), so splitting it per route is
a project of its own.

## 2. LCP on photo-led pages (V6 item 1)

**Changes.**

- The place band (the largest paint on every service page that has one, at every width: 412 x 140 px on a
  phone, 57,600 px² against 4,700 to 17,500 px² for the title) is now the page's priority image. It was already preloaded (React preloads
  any image that is not lazy), but at low priority. It is drawn by `Photo`, and a phone's renditions (828 px wide
  and narrower) ask for **quality 50** (60 before; the strip is 140 px tall).
- The heroes' phone renditions ask for **quality 55** (65 before): the home and airport bands sit above their
  words, and `PageHero`'s words cover most of the photograph on their scrim. Wide screens keep 65.
  The 750 px AVIF that Lighthouse's phone picks (bytes from the optimizer, KB = 1,024): home hero 13.9 → 10.2 KB,
  KLIA hero 18.8 → 14.3, guides hero 15.0 → 11.6, parking band 16.4 → 12.4, transport band 19.1 → 14.6 (the KLIA
  Ekspres photograph since the other engineer's change): 22 to 27 % less.
- No page preloads an image that is not its largest paint on a phone (checked on the home, KLIA, transport,
  parking, the guides hub, a guide and the corporate hub: one preload each, of the LCP image, `fetchpriority=high`).
- The not-found page's "KLIA at dusk" drawing is in every page's payload (the not-found boundary is part of the
  layout): its coordinates are rounded to a tenth (`-5.5200000000000005` was printed in full), 0.5 KB less HTML
  on every page.

**Before → after** (median of 3; before = build 1, after = build 3; round eight's medians in brackets):

| Page | LCP, simulated | Performance | LCP, applied slow-4G | Page weight |
|---|---|---|---|---|
| `/en` | (3.62) 3.54 → **3.04 s** | 79 → 93 | 1.89 → 1.96 s | 619 → 591 KB |
| `/en/kul` | (3.33) 3.06 → **3.03 s** | 91 → 89 | 2.11 → 2.03 s | 618 → 601 KB |
| `/en/kul/transport` | (3.25) 3.04 → **3.07 s** | 90 → 93 | 1.95 → 1.95 s | 618 → 593 KB |
| `/en/kul/parking` | (3.05) 3.08 → **3.04 s** | 90 → 93 | 2.00 → 2.09 s | 602 → 587 KB |
| `/en/guides` | (3.18) 2.89 → **2.97 s** | 94 → 94 | 1.99 → 1.91 s | 576 → 555 KB |
| `/en/concierge` (text LCP, control) | 1.38 → 1.37 s | 99 → 97 | | 538 → 514 KB |

Runs, simulated LCP: home 3.71/3.50/3.54 → 3.04/3.04/2.76 (the before runs had TBT 769/323/457 ms from other
work on the machine; the home's 0.5 s is mostly that), KLIA 3.09/3.06/3.04 → 3.03/3.03/3.04, transport
3.07/3.04/3.04 → 3.05/3.07/3.07, parking 3.06/3.08/3.26 → 3.06/3.04/3.04, guides 3.70/2.88/2.89 → 2.97/2.81/3.19.
FCP 1.37 s everywhere, CLS 0 to 0.004, accessibility 100 in every run. **The changes are within the run spread:
the 2.5 s target is not reached on any of the five pages.**

**Why the simulation stays at about 3 s** (Lighthouse 13's Lantern, `LargestContentfulPaint.js`, and a transport
trace):

1. When the largest paint is text and paints with the first paint, Lantern reuses the FCP estimate, which counts
   only render-blocking requests (HTML, CSS, fonts): 1.37 s. That is why the concierge, help, map and board pages
   score 1.2 to 1.4 s.
2. When it is an image, Lantern simulates every request that **finished before the observed paint** in the
   unthrottled trace (the pessimistic graph includes all of them; the optimistic graph all but low-priority images
   and scripts evaluated after the paint). On localhost the stylesheet arrives at about 75 ms, the first layout
   of the page takes about 77 ms (style 16 ms, layout 61 ms in the trace), and by the first paint (195 to 400 ms)
   **all 14 first-load scripts have arrived and run**. The transport run had 438,923 bytes on the wire before its
   first paint (KB = 1,024): HTML 64, CSS 38, fonts 55, images 38, the icon sprite 9, the manifest 2 and **222 KB
   of script**. At the simulated 1.6 Mbps that is the 1.7 s between FCP and LCP. The photograph is 16 to 21 KB of
   it.
3. So the simulated LCP of a photo-led page is roughly "every byte of the first load", and the 10 to 15 KB this
   round removed before the paint (script and the photograph) is under 0.1 s of it, inside the 0.3 s run spread. Applied throttling, where the photograph really
   competes with the scripts for a slow link, paints these pages at **1.9 to 2.1 s**, before and after, under the
   2.5 s target.

**What would move it, and what is not achievable here.** Making text the largest paint would give the FCP figure
(about 1.4 s), but that means a band smaller than the title block on a phone (the band is 57,600 px² there; the
title 4,700 to 17,500 px², so a band of about 40 px), or removing the hero photographs: neither is acceptable to
the design or the brief, and lazy-loading the band only moves the image paint later. Otherwise the first-load
bytes before the paint must fall by about 100 KB on these pages: the framework and shared chunks are 120 KB of
script, the layout's own chunks 36 KB (with the 4.5 KB airports registry and 8.4 KB tailwind-merge above), the
one stylesheet 38 KB and Hanken Grotesk 36 KB. That is a larger project than this round (splitting the stylesheet
per route, moving the shell's airport data to the server, dropping tailwind-merge from client code, a narrower
Hanken weight range), and it should be judged with the applied-throttling figures, which are already under 2.5 s.

## 3. The board's floating Demo label (V6 item 2)

**Before.** The label floating over the stuck hour header was hidden while the banner above the board was in view,
by a React state set in an animation frame after the scroll event. After a jump scroll on a busy phone the state
could be a render late, and "every board row has a demo label in view" failed about 1 in 20 to 30 runs with 4
workers.

**Change** (`flights/flight-board.tsx`, `globals.css`):

- **CSS decides.** The banner carries a view timeline (`view-timeline: --board-banner`, inset by the sticky edge
  plus 4 px, exactly what the script measured); the board's wrapper shares it (`timeline-scope`); the floating
  label runs an animation on it that holds `visibility: hidden` while the banner is in view and has no effect
  before or after that range. No React render is involved. The label's text, role and accessible name are
  unchanged (the same `DemoMark`: visible "Demo", "Demonstration data" for assistive technology). Under reduced
  motion the global 0.01ms duration still fills the range (checked with `reducedMotion: 'reduce'`). The board
  without a banner never hides its label.
- **A flag from the scroll event.** `useBannerOutFlag` writes `data-banner-out` on the labels directly in the
  scroll event (no React state) and again after every render. It overrides a timeline that is a frame late, and it
  is the whole mechanism in browsers without scroll-driven animations (then the label stays hidden until the
  script says the banner has gone, as before).

**What the investigation found.** With CSS alone the test failed 2 and then 3 times in 150 runs (phone, 4
workers), always on the **first** jump after load (the first row of the Penang and Malay KLIA boards) and with the
browser's clock pinned as the spec pins it. Logging in the page showed why: in those runs **no `scroll` event had
been dispatched and the view timeline had not advanced two frames after `scrollIntoView`**, while layout already
reported the new position (banner bottom at -39 px, label at its natural place at y 97, `visibility: hidden`); one
frame later both caught up. The script's flag, driven by the same scroll event, could not help either (1 in 150
with it). Chrome had not yet delivered the jump to anything scroll-linked, so the screen had not moved either.

**Test change (recorded; `e2e/flights.spec.ts`, `unlabelledInView`).** After each jump the helper now waits for
the page's `scroll` event (with a 500 ms cap, and only when the position changed), then two frames as before. This
is the option V6 named. The assertion is unchanged (every row has a label in view; banner or a visible, on-screen
`[data-provenance="demo"]`), and nothing on the page waits for script any more. A repro outside the suite (the
same steps and pinned clock on the Penang board, 6 pages in parallel): **11 failures in 390 loads** over five
batches without the wait (builds 2 and 3), **0 in 150** with it.

**Result on build 3:** `npx playwright test e2e/flights.spec.ts --grep "every board row has a demo label in view"
--repeat-each=50 --workers=4`: **300 passed, 0 failed** (desktop and phone, the three boards, 50 each), at a load
average of 15 to 19 from the other engineer's runs. Before the test change the same command on the phone project
gave 149/150. The A-14 test ("one Demo marker in every view of a filtered board", 390 and 1440 px) passes in the
full suite. Checked by hand: the label shows at banner bottom 40 px and 0 px and hides at 62, 66, 80 and 120 px
(sticky edge 56 px); screens of a Malay KLIA board at the top (banner only) and a scrolled Penang board (the
floating label over the stuck "From 20:00" header).

## Changes outside my paths (recorded)

- `src/components/facilities/service-frame.tsx` (the place band, `PlaceBand`): `next/image` → `Photo` with
  `priority` and `phoneQuality={50}`; its comment ("Not preloaded") corrected. Unavoidable: item 2 asks to size the
  band for phones, and the band is the transport and parking pages' LCP image. No layout, text or class change.
- `src/components/guides/page-hero.tsx` was **not** changed: `PageHero` keeps its static import of `HeroMedia`,
  which no longer carries client code.

## Checks (build 3 unless stated)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (`--incremental false`) | 0 errors |
| `npx eslint` on the changed paths and `next.config.ts` | 0 problems (the CSS file is not linted) |
| `npx vitest run` | 44 files, **626 passed** (round eight: 43 files, 616; `photo.test.ts` adds 8) |
| Full e2e suite, `--workers=4`, both projects | 706 tests: **673 passed, 1 failed, 32 skipped** (11.6 min). The failure, desktop `handoffs.spec` B-09 (the home board preview's feed-error state counted once instead of twice within 10 s, under a load average near 15), passed **10 of 10** when repeated; it reads the feed state, not a photograph or the board label |
| Board label test, 50 per board, 4 workers | **300 / 300** (above) |
| Text over photographs, pixel check (round eight's `photo-contrast-v2.mjs`), 390 px, light, dark, high-contrast light and dark: home, KLIA (ms), guides hub, departing guide (ms), corporate hub (ms), transport, parking (ms) | 28 loads, **348 text runs, 0 under the minimum**; lowest 4.85:1 (the guides hub's "Start here" pill, high-contrast light, as in round eight); home 6.72 (round eight 6.74), KLIA 7.75, guides hub 7.07 (light), the transport band's credit 8.03; **axe 0 violations, 0 console errors** |
| Every `<img>` loads, no console errors (dev server, 390 and 1440 px: home, KLIA, transport, guides hub, departing guide, corporate hub, airports, My journey, terms) | 0 broken, no `data-nimg` left on these pages; one image preload per photo-led page, `fetchpriority=high` |
| Screens looked at (10 of 14 allowed) | phone: home (light), KLIA (ms, dark), transport (light), guides hub, corporate hub (ms, dark), My journey (dark), the Malay KLIA board at the top (dark) and a scrolled Penang board; desktop: parking (ms, dark), the airports directory. Photographs at the phone qualities show no visible banding or softness at device scale; layout, credits and scrims as before |

## Clean-up

The dev server (3362) and the production server (3372) were stopped by their own process groups; `.next-perf`
and `.next-perf-prod` were deleted, the four `include` lines `next build` and `next dev` added to `tsconfig.json`
(`.next-perf-prod/…` and `.next-perf/…`) were removed and `next-env.d.ts` points at `.next` again: both files match
the copies taken before
the first build (SHA-256 `bd034e40…` and `1862ac4b…`). The other engineer's server on port 3371 was not touched.
`.data/metrics.json` (the metrics store, written by whichever local server runs; git-ignored) was left in place
because both engineers' servers write it. One read-only `git status` was run by mistake (its output discarded); no
other git command was run.

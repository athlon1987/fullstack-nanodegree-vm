# Fix log: round five, package "speed" (speed and shared JavaScript)

Round five, 21 November 2026. Items from round four's open issues (`docs/qa/verification.md`, F8), in the order
given: TBT (F8 item 1), first-load JavaScript (item 4), the concierge's on-device flights (item 9), bytes, HTML and
the service worker (item 6) and the home's type sizes (part of item 5). One engineer, working in the same folder as
the "flight" and "polish" packages at the same time. No git commands were run.

**Result:** 2 fixed (3, 5), 3 partially fixed (1, 2, 4), 0 not fixed.

| # | Item | Backlog | Status |
|---|---|---|---|
| 1 | TBT over 200 ms; performance under 95 on `/en`, `/en/kul`, the concierge; the concierge's round-four rise | A-09, E-01 (P0) | **Partially fixed.** Interleaved medians of 5, before → after: `/en` 296 → **228 ms** (perf 94 → **96**), `/ms` 319 → **254 ms** (93 → **95**), `/en/kul` 314 → **257 ms** (93 → 92), concierge 222 → **157 ms** (96 → **98**). TBT 200 ms or less on the concierge only; performance 95 or more on 3 of the 4. The concierge's rise is found and removed |
| 2 | First-load JavaScript 198.8 to 227.9 KB on content pages (target 170) | E-03 (P0) | **Partially fixed.** Shared shell 70.1 → **32.9 KB**; every route 19.6 to 51.0 KB lighter; **18 of 37** non-home routes at 170 or less (were 0); largest 212.0 (journey), none over 250 |
| 3 | The concierge generates demonstration flights on the device | B-09 (P0) | **Fixed.** On-device and server answers read the flight feed; offline or when the feed fails the answer says flight information could not be loaded (en and ms) |
| 4 | Guidance pages 548 to 609 KB, HTML 38 to 64 KB gzip, worker first visit 62 requests / 691 KB | E-01, E-11, E-12 | **Partially fixed.** HTML 7 to 16 % smaller (for example guides 45.8 → **38.1 KB**, `/en/kul` 58.8 → **49.4 KB**); worker first visit **61 requests / 643 KB** (Cache Storage 1,588 → 1,376 KB); guidance pages 539 and 548 KB (target 512 not met; what is left is listed) |
| 5 | 9 type sizes on the home and `/ms` | A-14 (P0) | **Fixed.** **8** at 390 px in both languages (A-14's count); 12 → 9 at 1440 px |

## How it was measured

- **Builds (four, the limit).** 1: the tree as found, into `.next-r5speed-prod` (the baseline, kept serving on port
  3251 for paired runs to the end). 2, 3 and 4: into `.next-r5speed-prod2` (a second folder of my own, so the
  baseline could keep running), served on 3252 (build 2) and 3259 (builds 3 and 4: the flight package also serves on
  3252). All with `NEXT_PUBLIC_SITE_URL` set and `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip`. Build 4 is final.
- **Lighthouse** 13.6 through `scripts/qa/lighthouse.mjs` (mobile defaults: Moto G Power, simulated slow 4G, 4x CPU).
  The machine was shared with two other engineers' dev servers, builds and Lighthouse runs, and Lighthouse's CPU
  benchmark index moved from 1,636 to 3,097 within the session. So the TBT targets were measured **interleaved**: five
  rounds, each page once on the final build and then at once on the baseline build (`lh-inter`, 40 runs). The three
  guidance and concierge pages also have a paired 3-run set (`lh-final`). The first set of the session (baseline, 3
  runs, quiet machine) is given for reference. Differences under about 60 ms are within this container's noise.
- **Main-thread profiles** (CDP, Pixel 7, 4x CPU throttling, Turbopack chunks mapped to modules by their strings) to
  find causes; `first-load-js.mjs` on both build folders; `rc-scan.py` (276 sitemap pages); `layout-shift.mjs`;
  `interaction-latency.mjs`; round four's `sw.cjs` (first visit with the worker, clock 18:00); an A-14 type-size count
  (`main`, visible elements with their own text, distinct computed font sizes, as `acceptance-round4.mjs` counts it).
- **Concurrent work.** Other packages changed their own pages while this was measured. The shared-shell numbers below
  are this package's; route-specific changes on the flight page, board and journey include the flight package's work.

## 1. TBT and performance (A-09, E-01). Partially fixed

**Causes found** (profiles of the baseline build):

- **The concierge's rise (round four, about +80 to 100 ms).** The concierge page loaded the on-device engine at the
  first idle moment of every visit: the knowledge pack (`knowledge.json`, **96 KB** transferred, parsed on the main
  thread), the engine chunk (28.5 KB), the provider registry and the demonstration generator. Their parsing and module
  instantiation was the page's longest task (300 ms in the Next.js runtime chunk under Lighthouse), inside the TBT
  window. Round four's larger engine and knowledge pack made it longer.
- **Every icon was a Client Component.** lucide-react 1.x renders icons through its own `'use client'` component, so
  every `Icon` in a Server Component (80 to 150 per page) was a hydration island whose geometry was also sent in the
  RSC payload; the registry and tailwind-merge (22.8 KB) were evaluated on all 39 routes, and `cn()` ran on every icon.
- **Radix Tooltip in the header** (two tooltips): its positioning engine (13 KB) was in every page's first load and
  hydrated on every page.
- Smaller: the phone bar prefetched the journey route's scripts (about 55 KB) during start-up (A-19); the service-worker
  client, install prompt and measurement script were in every first load.

**Changes** (build 4):

- **Icons as one sprite** (`src/components/ui/icon.tsx`, `icons.svg`, `icon-names.ts`, `icon-data.generate.mjs`):
  `Icon` renders `<svg …><use href="/_next/static/media/icons.<hash>.svg#name"/></svg>`, with no `'use client'` and
  no hooks. Icons in Server Components are plain HTML (no client reference, no geometry in the RSC payload, nothing to
  hydrate); no script carries icon geometry. The sprite (144 symbols, 7.8 KB gzip) is generated from lucide-react's
  own data, content-hashed and cached (and by the worker). Same attributes, stroke width, labels, aliases and fallback
  as before; the class list is built without tailwind-merge (`iconClassName`, same result, tested). lucide-react stays
  a dependency only for the generator and its test. The icons render in light, dark, high contrast and forced colours
  as before (`currentColor`), and work without JavaScript.
- **Tooltip without Radix** (`src/components/ui/tooltip.tsx`, same API): renders nothing until it opens; opens after
  350 ms of hover or on keyboard focus, never on touch; stays open while the pointer is on the trigger or the tooltip;
  closes with Escape; describes the trigger while open; positioned fixed beside the trigger, 8 px inside the window
  (WCAG 1.4.13).
- **Concierge engine on intent** (`src/components/concierge/concierge-chat.tsx`): the engine and the knowledge pack
  load when the visitor points at or focuses the concierge, asks, or 8 seconds after the page loaded (then at idle);
  the panel, opened on purpose, loads them at once. Answers on the device work as before; a question asked before
  they arrive waits for them (as it did when the idle load had not finished).
- **Platform runtime as its own script** (`src/components/platform/platform-runtime-lazy.tsx`): the worker client,
  install prompt and measurement leave the first load; the (empty) live region is still in the server HTML; it
  hydrates in an Activity boundary when its script arrives.
- **Phone bar prefetch after load** (`src/components/shell/mobile-bar.tsx`): the two A-19 links (Flights, Journey)
  prefetch once the page has loaded and the browser is idle, instead of during start-up; before that, on intent like
  every other link. A-19 is kept: they are still prefetched before a normal tap.
- **Concierge copy out of every page** (item 4 below) and a `SourceNote` that renders its list in a sub-component.

**Tried and reverted (recorded so the team does not repeat them):**

- **Suspense boundaries as hydration boundaries** (build 2). Around server-rendered content they become streaming
  boundaries: the static shell sent them as hidden segments revealed by `$RC` (pending boundaries 3 → 23 to 26 per
  page), which shifted the page (**CLS 0.293** on `/en` and the guides) and delayed LCP (3.9 s on a guide). Reverted.
- **Activity boundaries** (build 3; written in place, no `$RC`). Next.js already hydrates the root inside
  `startTransition`, so it is already time-sliced; deferring regions gained no slicing and committed them in one
  larger task later. `/en/kul` got worse (4x-throttled long-task overage 374 and 413 ms against 248 and 297 ms; Lighthouse
  855 to 1,750 ms). Removed everywhere in build 4 except around the lazy platform runtime (a tiny region).

**Results**, Lighthouse mobile. Interleaved, 5 rounds, medians (runs in brackets):

| Page | Performance before → after | TBT before → after (ms) | LCP after | CLS | Bytes before → after | Requests |
|---|---|---|---|---|---|---|
| `/en` | 94 → **96** | 296 (237/303/258/387/296) → **228** (215/245/161/228/288) | 1.07 to 1.16 s | 0 | 628 → 623 KB | 43 → 43 |
| `/ms` | 93 → **95** | 319 (429/303/346/278/319) → **254** (173/254/184/255/307) | 1.07 to 1.17 s | 0 | 629 → 625 KB | 43 → 43 |
| `/en/kul` | 93 → 92 | 314 (408/241/263/669/314) → **257** (249/257/342/957/219) | 1.06 to 1.20 s, one run 3.78 s | 0 to 0.007 | 650 → 621 KB | 48 → **44** |
| `/en/concierge` | 96 → **98** | 222 (200/250/222/429/155) → **157** (104/93/162/205/157) | 0.92 s | 0 | **705 → 558 KB** | 45 → **39** |

Paired 3-run set, same session: `/en/guides` 99 → **99**, TBT 123 → 113 ms, LCP 1.07 → 0.92 s, 548 → 539 KB;
`/en/guides/departing` 94 → **99**, TBT 292 → **106 ms**, 556 → 548 KB. Reference, first set of the session on the
baseline (quiet machine): `/en` 93 / 322 ms, `/ms` 94 / 275, `/en/kul` 94 / 294, concierge 93 / 302, guides 94 / 286,
guide 98 / 179. Accessibility 100 in every run. The one 3.78 s LCP on `/en/kul` (after) is one run of five, on a page
the airport package was changing during the session; the other four are 1.06 to 1.20 s.

Against the brief: TBT 200 ms or less on **1 of 4** (concierge); performance 95 or more on **3 of 4** (`/en/kul` 92).
The concierge is now below round three's 186 ms. Main-thread profiles of the final build: what remains is React DOM's
compile and hydration of the pages' own Client Components (on `/en/kul` mostly the airport package's), the HTML
document task (parse, style and layout of 280 to 300 KB of HTML) and Turbopack's module instantiation.

Interaction latency (4x CPU, 3 runs, worst per run; round four in brackets): board typing 56/64/48 (48/96/104),
direction 88/88/80 (88/96/72), home mode 88/136/88 (104/144/112), home switcher 80/144/184 (136/152/160), `/en/kul`
switcher 160/144/176 (176/128/144). All under 200 ms. Home CLS (`layout-shift.mjs`, 3 loads × 3 viewports × 2 languages):
**0 in all 18**.

## 2. First-load JavaScript (E-03). Partially fixed

The shared shell (on all 39 routes, measured on the catch-all route, which has nothing else): **70.1 → 32.9 KB gzip**.
Gone from it: lucide-react and its registry, Radix Tooltip with its positioning engine and Radix's context helpers,
the platform runtime (worker client, install, measurement). Left: tailwind-merge with clsx (8.5 KB; `src/lib/cn.ts`,
another package), the airports registry used by the switcher and the airport-context hook (10.5 KB), the shell's
islands and `content/values` (about 14 KB). No dictionary or content data was found in the shell's script beyond the
airports registry (the dictionary travels in the HTML; see item 4).

`scripts/qa/first-load-js.mjs`, gzip KB, framework 128.7 in every row. Bold: 170 or less.

| Route | Before | After | Change |
|---|---|---|---|
| `/[lang]/journey` | 246.0 | 212.0 | -34.0 |
| `/[lang]/design-system` | 229.5 | 209.9 | -19.6 |
| `/[lang]/[airport]/flights/[flightId]` | 249.1 | 198.1 | -51.0 (includes the flight package's work) |
| `/[lang]/[airport]/flights` | 229.2 | 197.4 | -31.8 |
| `/[lang]/[airport]` | 230.2 | 196.1 | -34.1 |
| `/[lang]` (home, budget 250) | 229.5 | 195.5 | -34.0 |
| `/[lang]/[airport]/map` | 227.9 | 194.5 | -33.4 |
| `/[lang]/[airport]/shop-dine` | 221.6 | 188.4 | -33.2 |
| `/[lang]/[airport]/parking` | 223.2 | 187.6 | -35.5 |
| `/[lang]/privacy` | 214.1 | 186.4 | -27.7 |
| `/[lang]/search` | 220.3 | 186.0 | -34.2 |
| `/[lang]/concierge` | 217.1 | 181.8 | -35.3 |
| `/[lang]/[airport]/facilities` | 213.3 | 180.7 | -32.6 |
| `/[lang]/[airport]/transit` | 217.3 | 180.1 | -37.3 |
| `/[lang]/[airport]/transport` | 217.1 | 179.9 | -37.2 |
| `/[lang]/[airport]/shop-dine/[outlet]` | 212.4 | 177.0 | -35.4 |
| `/[lang]/help/[topic]` | 209.2 | 176.3 | -33.0 |
| `/[lang]/accessibility` | 207.1 | 174.2 | -32.9 |
| `/[lang]/[airport]/lounges` | 210.4 | 173.2 | -37.2 |
| `/[lang]/airports` | 206.0 | 170.6 | -35.5 |
| `/[lang]/offline` | 204.1 | 170.1 | -34.0 |
| `/[lang]/notices` | 206.5 | **169.3** | -37.2 |
| `/[lang]/help` | 204.9 | **167.7** | -37.2 |
| `/[lang]/guides/[topic]` | 204.5 | **167.4** | -37.2 |
| `/[lang]/about-this-prototype`, `/[lang]/corporate/business` | 203.2, 203.3 | **166.1** | -37.2 |
| the 9 other corporate routes | 203.0 | **165.9** | -37.2 |
| `/[lang]/guides` | 202.6 | **165.4** | -37.2 |
| `/[lang]/airports/not-published` | 200.5 | **165.2** | -35.3 |
| `/[lang]/terms` | 199.7 | **162.5** | -37.2 |
| `/[lang]/[...rest]` | 198.8 | **161.6** | -37.2 |
| over 250, of 39 | 0 | **0** | |

Routes over 170 are over because of their own page code (5 to 66 KB); the shell is 32.9 KB of the 41.3 KB the
target leaves after the framework. The concierge's own code (the conversation, answers, cards and ask flow, 20 KB)
is the reason it is at 181.8; making the conversation lazy would leave the page's server-rendered form without
handlers for a moment, so it was not done.

## 3. The concierge's flights from the flight feed (B-09). Fixed

- **One source.** New `src/lib/concierge/flights.ts`: `flightBoardsFor()` works out which boards a question can need,
  exactly as the engine resolves the airport (a flight number: today's departures and arrivals at the named or
  context airport and the six featured airports, the generator's old search; the saved flight: its own board from its
  id and the journey's airport; nothing for a question that names no flight); `flightSourceFromDays()` gives the engine
  its lookups over `SnapshotFlightProvider`, the same class the board, flight pages and My journey use.
- **Browser** (`use-concierge.ts`): on-device answers fetch those boards from the batched `/[lang]/flights/feed` route
  with the existing `fetchFeedDays()` (one request per date and direction; the feed's contract is unchanged). Airports
  with a board come from the shell's section list. The demonstration generator is no longer loaded in the browser at
  all (it was the last place, round three's note).
- **Server** (`src/app/api/concierge/route.ts`, new `src/lib/concierge/flights.server.ts`): the boards are served
  in-process by `serveFlightFeed()`, the function the feed route calls (its cache, timeout and last-known fallback),
  instead of a separate generator instance. So the concierge, the board and the flight pages give the same flight.
- **Honest when it cannot load.** Offline or when the feed fails, the engine gets `unavailableFlightSource()` and says
  "Flight information could not be loaded just now, so I cannot check MH 785. If you are offline, try again when you
  are back online, or check with your airline." / "Maklumat penerbangan tidak dapat dimuatkan sekarang, jadi saya tidak
  dapat menyemak MH 785. …" (new engine phrase `flightUnavailable`, both languages), instead of "I could not find MH 785
  on the demonstration boards". A saved flight whose board could not be loaded is named the same way. Everything
  else keeps answering on the device. Demo labels are unchanged: flight answers carry the demonstration banner and the
  feed's `generatedAt`.
- **Tests:** `src/lib/concierge/flights.test.ts` (which boards are fetched; the answer is the board's flight with
  the demo label; the server source reads the feed; the unavailable message in both languages, and "not found" only
  when the boards were searched); `e2e/speed-round5.spec.ts` (the on-device answer requests `/en/flights/feed` and
  keeps the demo label; with the feed blocked the answer says it could not be loaded, en and ms; the API route
  answers a flight from the feed). `engine.test.ts` is unchanged (it keeps `flightSourceFromProvider`, now for tests).
- Screens looked at: the English answer with the connection off at 1440 × 900 (message, official contacts, the
  offline toast) and the Malay page at 390 × 844.

## 4. Bytes, HTML and the service worker (E-01, E-11, E-12). Partially fixed

- **HTML.** No icon geometry in the HTML or the RSC payload, and the **concierge's copy left the root dictionary**:
  the root provider keeps three keys of `conciergePage` (the panel frame's title, description and "Open full page";
  `PARTIAL_NAMESPACES` in `src/lib/i18n/index.ts`); the concierge page sends the rest with `I18nPageScope`, and the
  panel loads it with its conversation when first opened (`concierge-panel.tsx`). About 17 KB of copy left every
  other page's HTML. `i18n.test.ts` fails if any other Client Component reads the rest.

  | Page | HTML gzip before → after | HTML raw | RSC payload in it |
  |---|---|---|---|
  | `/en` | 61.6 → **53.5 KB** | 307 → 282 KB | 149 → 134 KB |
  | `/ms` | 63.1 → **54.8 KB** | 318 → 292 KB | 158 → 141 KB |
  | `/en/kul` | 58.8 → **49.4 KB** | 331 → 304 KB | 140 → 126 KB |
  | `/en/kul/transport` | 60.6 → **51.7 KB** | 341 → 308 KB | 141 → 126 KB |
  | `/en/guides` | 45.8 → **38.1 KB** | 203 → 181 KB | 117 → 102 KB |
  | `/en/guides/departing` | 51.9 → **44.8 KB** | 287 → 260 KB | 144 → 128 KB |
  | `/en/help/baggage` | 44.5 → **38.4 KB** | 194 → 175 KB | 123 → 108 KB |
  | `/en/concierge` | 38.5 → **36.9 KB** | 180 → 175 KB | 98 → 99 KB |

  The guidance pages are not part of a duplicated RSC payload beyond what React needs to hydrate them; the root
  dictionary is still about 45 KB per page (`flightPages` 15 KB is the largest part; it is read by Client Components
  of four other packages, so scoping it needs `I18nPageScope` on their pages).
- **Service worker** (`src/components/platform/sw-routes.ts`): the worker stored the legacy polyfill bundle (`<script
  noModule>`, 38.5 KB gzip, never run by a browser that can run the worker) as an asset of every saved page; it no
  longer does, and it stores the icon sprite once (URL fragments ignored). First visit to `/en`, clock 18:00:

  | | Before | After |
  |---|---|---|
  | Requests (page and worker) | 62 | **61** |
  | Transferred | 691 KB | **643 KB** |
  | Cache Storage after install | 1,588 KB (24 entries) | **1,376 KB** (23) |

  The worker still registers after the page's network is idle (unchanged); the precache is still the start page and
  the offline page of the visitor's language, the offline promise (performance-11). Its other 20 requests are the
  page's own bundles answered from the HTTP cache (0 bytes).
- **Guidance pages, Lighthouse total bytes:** `/en/guides` 548 → **539 KB**, `/en/guides/departing` 556 → **548 KB**
  (target 512, not met). An 8-second load of the guide on a Pixel 7 profile (536 KB, 34 requests): fonts 127 KB,
  React and Next.js 118 KB, the HTML 47 KB, CSS 23 KB, the page's own first-load scripts 46 KB, the icon sprite 9 KB,
  the platform runtime 7 KB, then the routes prefetched for the phone bar's Journey and Flights links (A-19: scripts
  and route data of `/journey` and `/airports`) **about 85 KB**, and the overlays loaded at idle (switcher, menu and
  display settings, concierge panel, Radix Dialog) **about 45 KB**. Without those two, the page is about 405 KB. Both
  are deliberate (A-19; the overlays open at once, round two) and now start after the page has loaded; loading them
  only on intent would meet the budget at the cost of a slower first tap on slow connections. That is a product
  decision, not taken here.

## 5. Type sizes on the home and `/ms` (A-14). Fixed

A-14's count (visible elements in `main` with their own text, distinct computed sizes):

| | Before | After |
|---|---|---|
| `/en`, 390 × 844 | 9 (11 13 14 16 18 20 22 24 26) | **8** (11 13 14 16 18 20 22 26) |
| `/ms`, 390 × 844 | 9 | **8** |
| `/en` and `/ms`, 1440 × 900 | 12 (… 15 22 24 26 36 52) | **9** (11 13 14 16 18 20 22 36 52) |

Changes, all to the design system's scale: the network band's figures `type-data-xl` → `type-data-lg`; the two
KLIA terminal cards' titles `type-display-sm` → `type-title-lg` (the board's heading size); the notice strip's three
`sm:text-[0.9375rem]` overrides removed (`type-body-sm`). Files: `src/components/home/home-sections.tsx`,
`notice-strip.tsx`. The remaining 11 px (board table headings, terminal badges) and 22 px (the board heading) belong to
the flight board. Screens looked at: the network section at 1440 × 900; the home at 390 × 844 (en) and 1440 × 900
(ms, dark). Budget test: `e2e/speed-round5.spec.ts` (at most 8 on a phone, both languages).

## Tests and checks

- New: `src/components/ui/icon-data.test.ts` (the sprite and names are in sync with lucide-react and the generator;
  each symbol is lucide's geometry; attributes, labels, aliases, the fallback, `iconClassName` against `cn()`),
  `src/lib/concierge/flights.test.ts` (4), two tests in `src/lib/i18n/i18n.test.ts` (partial namespace), two
  assertions in `src/components/platform/sw-routes.test.ts`, and `e2e/speed-round5.spec.ts` (10 tests: concierge
  flights ×4, icons, concierge copy, panel copy, tooltip, type sizes ×2). No test was weakened, skipped or deleted.
- `npx tsc --noEmit`: 0 errors. `npx eslint` on this package's paths and the new spec: 0 problems.
  `npx vitest run`: **40 files, 576 passed**.
- Playwright on the final production build (`PLAYWRIGHT_BASE_URL=http://localhost:3259`, desktop and phone,
  `--trace off`): `speed-round5`, `smoke`, `shell`, `concierge`, `guides`, `platform`, `handoffs`, `ask-round4`:
  **235 passed, 2 failed, 9 skipped** (the projects' deliberate skips). The two: my new icon test picked an icon
  hidden on phones (locator fixed to a visible one; passes), and `platform.spec.ts` "the indicator appears when the
  connection drops", which reads the saving state and the toast at two moments while the worker may finish
  installing in between; it passed 6 of 6 on repeat (`--repeat-each=3`, both projects). It is timing-sensitive, and
  the worker now installs faster (no 40 KB polyfill to store). The final run of `speed-round5`: 16 passed, 4 skipped.
- `rc-scan.py`: **`h1` inside a hidden segment: 0 of 276**; 1,264 reveals, the same distribution as round four.
- Screens looked at (8 of 10): header tooltip 1440, home 390 (en), home 1440 dark (ms), home network band 1440,
  guide 390 dark, concierge 1440 offline answer (en), concierge 390 (ms).

## Cross-package changes

- **Every package's icons** now render as `<svg><use href="…icons.<hash>.svg#name"/></svg>` (the `Icon` API, names
  and aliases are unchanged). An icon that is not in the registry still falls back to a circle. To add an icon, add it
  to `GLYPHS` in `src/components/ui/icon-data.generate.mjs` and run `node src/components/ui/icon-data.generate.mjs`;
  `icon-data.test.ts` fails otherwise. lucide-react is no longer imported by application code (`package.json` unchanged).
- **The Tooltip** used by the design-system showcase (`src/components/design-system/interactive.tsx`) is the new
  implementation (same API; not edited).
- **Root dictionary:** Client Components outside `src/components/concierge/` must not read `conciergePage.*` beyond
  `title`, `panelDescription` and `openFullPage` (guarded by `i18n.test.ts`).
- **Read-only use of the providers package:** `src/lib/concierge/flights.server.ts` calls `serveFlightFeed` and
  `hasDemoRoutes`, and `flights.ts` uses `SnapshotFlightProvider`; the browser uses `fetchFeedDays` from
  `use-flight-feed.ts`. None of them was changed, nor the feed routes' contract.
- No other package's file was edited. `next.config.ts`, `globals.css` and `package.json` were not changed.

## Clean-up

My processes, stopped by PID only: dev server 13206 (and children; stopped before the final measurements to reduce
noise), the baseline server 1463/1483/1484, the build-2 server 20509, build-3 server 12943, build-4 server 13929 (and
children); builds 1138, 19936, 12367, 13635 finished on their own. `.next-r5speed`, `.next-r5speed-prod` and
`.next-r5speed-prod2` deleted; the six `.next-r5speed*` lines Next added to `tsconfig.json` removed (other packages'
lines left). `next-env.d.ts` was pointing at another package's build folder at the end; it was left for its owner.
The default `.next` was not touched.

## What is left

- **TBT** on `/en` (228 ms), `/ms` (254 ms) and `/en/kul` (257 ms) is above 200. What remains is the pages' own
  hydration (on the overview mostly the airport package's components), the HTML document task and module
  instantiation. Next candidates: fewer Client Components on the home's first screen and the overview (several only
  read the clock or local storage to adjust a label), scoping `flightPages` (15 KB of every page's HTML), and fonts
  (127 KB, Fraunces alone 67 KB; `src/fonts`). Do not use Suspense or Activity boundaries as hydration boundaries
  here (see "tried and reverted").
- **First-load JavaScript**: 19 non-home routes are over 170 KB because of their own page code; tailwind-merge (8.5 KB
  in the shell) could be replaced by a smaller `cn` with the design system's class groups.
- **Guidance page bytes**: the A-19 prefetch and the idle overlays (about 130 KB together) decide the 512 KB budget;
  see item 4.
- `platform.spec.ts` "the indicator appears…" can race with the worker's installation; reading both states in one
  step would make it stable (platform package).

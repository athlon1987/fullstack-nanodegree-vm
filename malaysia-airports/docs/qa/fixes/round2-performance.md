# Fix log: round two, performance (verification open issues 1 to 4)

Round two, 21 November 2026. Items: verification section 4 issues 1 to 4, with their backlog ids
(E-01, E-02, E-03, A-09, B-06, A-01). A first attempt at these items was interrupted by a container
restart before it wrote a log; its changes were committed as they stood
(`docs/qa/fixes/_round2-interrupted.md` lists the 92 files). This log covers that work, which was
reviewed and kept, and what this session added.

**Result:** 5 fixed, 1 partially fixed (TBT), 0 not fixed.

| # | Item | Backlog | Status |
|---|---|---|---|
| 1 | Input before hydration lost on airport pages | A-09 (verification issue 3) | **Fixed**: 0 of 10 lost in every case (was 10 of 10 for typing) |
| 2 | LCP 4.4 to 4.6 s on `/en/kul` and the map | E-02, E-01 | **Fixed**: LCP 1.06 to 1.07 s, every run |
| 3 | Interaction latency at 4x CPU | A-09, B-06 | **Fixed**: worst run 184 ms (switcher), board direction 104 to 120 ms |
| 4 | First-load JavaScript | E-03 | **Fixed** for the budget it names: `/en` 275.0 → 228.8 KB gzip; zod out of every client chunk. `/en/journey` 254.8 KB is still 4.8 KB over 250 |
| 5 | TBT on every page | E-01, A-09 | **Partial**: 127 to 266 ms median (was 273 to 443); 2 of 5 pages at 200 ms or less |
| 6 | First board row and flight h1 on a phone | A-01 | **Fixed**: row at 614 px at 390x664 in English and Malay (target 664); flight h1 at 184 px; the e2e check is a normal test again |

## Review of the interrupted attempt

The rule for this round was not to run git, so the review could not diff against commit 25e9e9d.
Instead: every module the list names that carries a "round 2" comment was read (46 places, listed
by `grep -rn "round 2" src e2e`), the whole unit and e2e suites were run on a production build of
the tree as found, and the before numbers the attempt had already measured on the pre-round build
(same port, same scripts, its scratch folder `r2/`) were used as the baseline. What it did, and what
was kept:

- **URL state that hydrates** (`src/lib/hooks/use-url.ts`, new): `useUrlSearchParams` and
  `useUrlPathname` read `window.location` through `useSyncExternalStore` with a fixed server
  snapshot; `UrlSync` in the root layout (inside `<Suspense fallback={null}>`) tells them about
  client navigations. Used by `AirportFlightTools`, `useTerminalParam`, the board explorer, the map
  explorer and the phone bar, which no longer sit in Suspense fallbacks. Kept.
- **Static shell instead of a page-level Suspense reveal**: the airport overview, the board and the
  map await `params` without a page-level `<Suspense>` (`ensureStatic = 'navigation'`; every
  served airport is listed by `generateStaticParams`). This is a deliberate exception to
  Do/Don't 1 of `docs/engineering/next16-notes.md`, documented in each page. The overview renders
  its own full banner (`AirportBanner`), and `globals.css` hides the layout's compact bar there
  instead of choosing it with a router hook. Kept, with one regression fixed (below).
- **Smaller shell script**: zod and the content schemas left the client (hand-written `check`
  validators in `src/lib/storage.ts` for every store; `src/content/values.ts` holds the enums and
  labels client code needs); the switcher, menu, display settings and concierge panel load at idle
  or on first open (`global-overlays.tsx`); five more dictionary sections are scoped to the pages
  that use them (`I18nPageScope`, `src/lib/i18n/page-scope.tsx`); `Intl` formatters are cached
  (`time.ts`, `format.ts`, `translate.ts`). Kept.
- **Interaction cost**: `body { pointer-events: auto !important }` and
  `@property --removed-body-scroll-bar-size { inherits: false }` in `globals.css` stop Radix's body
  styles from restyling the whole page on every dialog open and close (every dialog here has a
  full-screen overlay, checked: `dialog.tsx` and `command-palette.tsx`; Popover is non-modal);
  the board renders one panel that follows the chosen tab. Kept.
- **A-01**: board lead `max-sm:sr-only`, tighter gaps, one-row board header on phones, flight-page
  eyebrow tightened. Kept and extended (below).
- **The failing unit test** (`src/lib/seo/seo.test.ts`, sitemap vs `generateStaticParams`): page
  modules now import `I18nPageScope`, which imports `next/root-params`, a module the Next.js
  compiler replaces and that throws anywhere else. Fixed legitimately with a test stand-in, exactly
  like the existing `server-only` one: `src/lib/testing/root-params.ts` and an alias in
  `vitest.config.ts`. The test itself is unchanged and now passes (496 of 496).
- **Left behind by the attempt and cleaned up**: `next-env.d.ts` pointed at `.next-r2prod/types`
  (restored to `.next/types`); `.next-r2prod` deleted; no `.next-r2*` lines in `tsconfig.json`.

## Changes in this session

| File | Change | Item |
|---|---|---|
| `src/lib/testing/root-params.ts` (new), `vitest.config.ts` | `next/root-params` stand-in for unit tests | test fix |
| `src/lib/hooks/use-flight-provider.ts` | Returns the provider as `useDeferredValue` | 5 (TBT) |
| `src/lib/providers/use-flight-feed.ts` | Memoised state object returned as `useDeferredValue` | 5 (TBT), 3 |
| `src/components/shell/airport-switcher-dialog.tsx` | `OptionGroups`: opening renders "last choice" and the main airports (9 options); the other 33 follow in a background render (`useDeferredValue(true, false)`) | 3 |
| `src/components/concierge/use-concierge.ts`, `src/lib/storage.ts` | Concierge stores validated with `check` (new `check.custom`); zod no longer in any client chunk; `check.record` refuses a `__proto__` key | 4 |
| `src/components/flights/follow-state.ts` (new), `flight-actions.tsx`, `flight-alerts-panel.tsx` | The "Follow this flight" panel loads at idle or when opened (`lazy`), not with the flight page | 4 |
| `src/components/airport/missing-airport-page.tsx` (new); `src/app/[lang]/[airport]/page.tsx`, `map/page.tsx`, `flights/page.tsx` | An airport the page does not list gets `notFound()` from inside a Suspense boundary | regression fix (C-06) |
| `src/components/flights/flight-board-explorer.tsx` | "N flights have already left" note `max-sm:sr-only` (phones keep "Show earlier flights"); file reformatted (the attempt left JSX unindented) | 6 |
| `e2e/shell.spec.ts` | Comment on the A-01 board-row test updated with the new positions (the test body is unchanged) | 6 |

Touched files were formatted with Prettier at the width the codebase uses (`--print-width 160
--single-quote`; the repository has no Prettier config).

**Regression found and fixed (C-06).** The first full e2e run on this round's build failed the C-06
test on both projects: `/en/lgk/map` and 35 other airports without a map answered 404 but with an
empty document (no site shell, no `<title>Page not found`), because `notFound()` was thrown outside
any boundary once the map page lost its page-level Suspense. `/en/zzz` and `/en/zzz/flights` had
the same empty 404. With `MissingAirportPage` all of them answer 404 with the site shell and the
"Page not found" title, first and repeat request; listed airports are unaffected (their `<h1>` is
still in the static HTML, not in a hidden streamed segment). C-06 passes.

## How it was verified

Own production build: `NEXT_DIST_DIR=.next-r2prod NEXT_PUBLIC_SITE_URL=http://localhost:3212 npx next
build` (0 warnings), `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip NEXT_DIST_DIR=.next-r2prod npx next
start -p 3212`, stopped by PID; `.next-r2prod` deleted afterwards; the default `.next` was not
touched. "Before" is the pre-round build measured by the interrupted attempt with the same scripts
on the same port; "after" is this session's final build. Shared 4-vCPU container: TBT varies by
about ±60 ms between runs.

- `npx tsc --noEmit`: 0 errors. `npx eslint .`: 0 problems (run after deleting the build folder,
  which ESLint would otherwise lint). `npx vitest run`: 32 files, **496 passed**.
- Playwright, production build, desktop and phone projects (`PLAYWRIGHT_BASE_URL=http://localhost:3212
  E2E_STATUS_CODES=1`): **323 passed, 0 failed, 5 skipped** (was 321 and 7 skipped: the two A-01
  board-row checks now run; the 5 skips are the deliberate project-specific ones).
- Screenshots looked at (production build): board 390x664 (Malay, before the note change), board
  390x844 and 1440x900, switcher open 390x844 and 1440x900, flight page with the follow panel open
  390x844, `/en/zzz` 404 390x844. The desktop board still shows the note; the phone board shows
  "Show earlier flights" directly under the board header.

### Lighthouse mobile (3 runs, median; `tools/lh.js`, Lighthouse 13.6, Moto G Power, slow 4G, 4x CPU)

| Page | Performance before → after (runs) | LCP before → after (runs) | TBT before → after (runs) | CLS before → after | KB | Requests |
|---|---|---|---|---|---|---|
| `/en` | 89 → **95** (95/95/96) | 1.24 → 1.08 s | 443 → **244 ms** (244/273/230) | 0 → 0 | 606 → 571 | 38 → 39 |
| `/en/kul` | 79 → **95** (90/95/95) | **4.40 → 1.07 s** (1.07/1.06/1.09) | 275 → **266 ms** (399/266/254) | 0.003 → 0 | 618 → 598 | 38 → 42 |
| `/en/kul/flights` | 76 → **96** (96/98/94) | **4.39 → 0.92 s** (0.93/0.92/0.92) | 376 → **227 ms** (227/159/280) | 0.09 → 0.003 | 599 → 556 | 35 → 35 |
| `/en/kul/map` | 91 → **97** (97/95/98) | 1.23 s, one run 4.59 → **1.06 s** (1.07/1.06/1.06) | 378 → **195 ms** (195/258/180) | 0.003 → 0.003 | 629 → 605 | 37 → 40 |
| `/en/journey` | 95 → **99** (99/99/100) | 1.07 → 0.91 s | 273 → **127 ms** (127/140/82) | 0 → 0 | 555 → 517 | 33 → 34 |

Accessibility 100 on every run. The map's first after-run returned no result and was repeated as a
separate 3-run set (shown). Performance 95 or more on 5 of 5 medians (was 1 of 5).

### Interaction latency (Event Timing, Pixel 7, 4x CPU after load, worst entry per run; `r2/inp.cjs`, the method of `docs/qa/performance.md` section 7)

| Interaction | Before (runs) | After (runs) |
|---|---|---|
| Board: type "MH" | 56 / 56 / 64 | 160 / 48 / 56 (median 56) |
| Board: Departures to Arrivals | 328 / 360 / 288 | **112 / 104 / 120** |
| Home: journey mode | 104 / 120 / 96 | 120 / 112 / 152 |
| Home: airport switcher open and close | 248 / 248 / 312 | **160 / 184 / 128** |
| `/en/kul`: airport switcher open and close | 224 / 264 / 264 | **152 / 144 / 136** |

Every interaction is under 200 ms in every run. Switcher open, traced: before this session 184 to
248 ms (170 ms of click handling: React creating about 600 elements for 42 options, Radix Presence
forcing style and layout on them). Now the first frame holds 9 options, then 42 (checked: option
count 9, then 42, on each opening).

### Input before hydration (item 1; `r2/early.cjs`)

Pixel 7, 4x CPU, scripts delayed 2.5 s (a slow network: the HTML paints, React starts later); 10
fresh loads per case; on `/en/kul` the flight search and on the board the board search are tapped
and "MH 26" typed, or the phone bar's Menu is tapped; then the page hydrates and the result is read.

| Case | Before: lost | After: lost | After: first input, ms after DOMContentLoaded | Before hydration |
|---|---|---|---|---|
| `/en/kul` type | **10 of 10** | **0 of 10** (text kept and focused) | 155 to 308 (9 of 10 under 300) | 10 of 10 |
| `/en/kul` tap Menu | 0 of 10 | 0 of 10 | 166 to 266 | 10 of 10 |
| Board type | **10 of 10** | **0 of 10** | 138 to 195 | 10 of 10 |
| Board tap Menu | 0 of 10 | 0 of 10 | 127 to 205 | 10 of 10 |

### First-load JavaScript per route (gzip KB, from the build manifests; `r2/routejs.js`)

| Route | Before | After |
|---|---|---|
| `/en` (budget 250) | 275.0 | **228.8** |
| `/en/kul` | 275.9 | 230.0 |
| `/en/kul/flights` | 281.9 | 234.5 |
| `/en/kul/map` | 281.2 | 236.7 |
| `/en/kul/parking` | 276.0 | 229.3 |
| `/en/kul/transport` | 272.0 | 225.3 |
| flight page | 294.9 | 249.7 |
| `/en/journey` | 291.3 | **254.8** |
| `/en/concierge` | 270.4 | 223.3 |
| `/en/guides` | 260.3 | 213.2 |
| `/en/corporate` | 258.7 | 211.5 |
| largest of 41 routes | 294.9 | 254.8 (journey; the only one over 250) |

Framework (React DOM, Next.js runtime) is 128.6 KB of every row. zod: in a shell chunk on all 39
routes before; in no client chunk after (searched for `ZodError` and `_zod` in every chunk).
Measured on the build before the last two changes (`MissingAirportPage`, a Server Component, and
one class name), which add no client code. HTML gzip, measured on an earlier build of this session
(before the deferral and switcher changes, which do not change the HTML): `/en` 59 KB (verification
71), board 38 (55), journey 37.5 (50), overview 55, map 57.

### A-01 positions (Pixel 7 emulation, production build)

| Viewport | Board h1 | First board row, en / ms | Flight page h1 |
|---|---|---|---|
| 360x800 | 156 | 614 / 662 | 184 |
| 390x664 | 156 | **614 / 614** (was 864; 643 / 664 before the note change) | **184** (was 201) |
| 390x844 | 156 | 614 / 614 | 184 |

## What is left

- **TBT (item 5) is not at 200 ms everywhere**: medians 244 (`/en`), 266 (`/en/kul`), 227 (board),
  195 (map), 127 (journey). What remains, from Lighthouse's long tasks and CPU profiles at 4x: the
  HTML document task (parse, style and layout of 1,400 to 3,000 elements, 120 to 175 ms simulated),
  start-up module evaluation (Turbopack instantiating the shell's modules, 140 to 180 ms), and
  hydration commits of 60 to 100 ms. The synchronous re-render after hydration (the clock and the
  held boards arriving through external stores: 123 ms on `/en`, 147 ms on the board) is gone: those
  updates now reach the flight lists as deferred values. Next candidates: fewer hydrated Client
  Components on the home and overview first screens, and the icon registry (22.8 KB gzip of lucide
  icons evaluated on all 39 routes, mostly from 79 Client Components that pick icons by name).
  `content-visibility` on below-the-fold sections was tried by injection and gave no measurable gain.
- **`/en/journey` first-load JS 254.8 KB**, 4.8 KB over 250: its timeline and saved-item cards
  render in the first screen, so they were not made lazy (that would move content after load).
- The root dictionary still sends `conciergePage` (15 KB raw) and `flightPages` (12 KB raw) to every
  page; scoping them needs the lazily loaded concierge panel to bring its own copy in both languages,
  which would add bytes at idle on every page. Not done.
- Phones no longer show the "N flights have already left" sentence above the board (screen readers
  still read it). Pre-existing wording issue seen on the way: on the Arrivals tab the same sentence
  says flights "have already left" for landed flights (B's string `flightPages.rows.departedHidden`).
- The 404 for an unknown airport or section has the site shell and title, but, like every 404 in this
  build (also the catch-all `/en/no-such-page`, unchanged this round), its body is rendered on the
  client; crawlers and no-JS visitors see the shell without the "Page not found" text.
- `docs/qa/fixes/_round2-interrupted.md` is superseded by this log.

Scripts (session scratch folder `r2/`, not in the repository): `early.cjs`, `inp.cjs`, `trace.cjs`,
`clickprof.cjs`, `loadprof.cjs`, `loadself.cjs`, `routejs.js`, `a01.cjs`, `swcount.cjs`, `shots2.cjs`,
`rebuild.sh`, `restart.sh`; Lighthouse summaries `lh-before/`, `lh-m/`, `lh-m-map/`.

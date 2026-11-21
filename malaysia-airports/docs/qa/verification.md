# Verification of the fix round

Owner: release and verification. Date: 21 November 2026. Scope: the five fix packages (A to E, logs in
`docs/qa/fixes/`) checked together against a production build (`next build` + `next start -p 3100`), and every P0
and P1 item of `docs/qa/fix-backlog.md` checked against its acceptance criterion.

**Result:** the build, the types, lint, 495 unit tests, 321 end-to-end tests, the axe scans and the link checks all
pass on the final build. Of the 101 P0 and P1 items, **73 are verified**, **27 are not verified** (most are partial
fixes waiting on another package's hand-off, MAHB data, or a performance target), and **1 has regressed**
(E-03, first-load JavaScript). Six product regressions from this round were found and fixed (section 3). The
mobile performance target (Lighthouse 95, TBT 200 ms) is still not met (section 2.4).

## 1. Clean-up before the checks

- Package D's dev server (`next dev -p 3204`, `NEXT_DIST_DIR=.next-D`, PIDs 22217 and 4233) was still running from
  this checkout. It was stopped by PID and `.next-D` was deleted. No other server was listening on ports 3201 to 3210.
- `tsconfig.json` still listed the `.next-A` to `.next-E` type folders that the engineers' dev servers had added
  (10 lines). They were removed; the file is valid JSON and `tsc` is clean.
- The production server used for every check below was started as
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100` (section 3, item 7) and stopped by PID at the end.

## 2. Results

### 2.1 Static checks, unit tests and build

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx eslint .` | 0 problems |
| `npx vitest run` | 32 files, **495 passed**, 0 failed (one assertion added, section 3) |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build` | Succeeds in about 43 s; 371 static pages. First build: **4 Turbopack warnings** (sitemap traced the whole project); fixed, final build **0 warnings** |
| `npm audit --omit=dev` / `npm audit` | 0 vulnerabilities / 0 vulnerabilities |

### 2.2 End-to-end and accessibility (production build, desktop 1440x900 and phone Pixel 7 390x844)

| Run | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|
| 1 (as delivered by the packages) | 301 | **22** | 5 | 8 from the shared rate-limit bucket, 2 axe Level A failures, 4 parking-page defects or races, 4 out-of-date expectations, 2 board-row checks (newly enabled), 2 early-focus losses (A-03 on the phone, en and ms) |
| 5 (final build, final specs) | **321** | **0** | 7 | 328 tests, 5.6 min |

The 7 skips: the A-01 "first board row inside 664 px" check, kept as `fixme` on both projects because it still
fails (section 4, item 4), and 5 deliberate project-specific skips (calendar download on the phone, desktop-only
keyboard and width checks, the 1280x720 home check). No test was deleted, skipped or loosened to get green;
section 3 lists every spec change.

**Axe: 0 violations.** 49 scan call sites in the 10 specs (several loop over pages), on both projects. Every spec
now uses the shared tag list of `e2e/support/axe.ts` (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa). Before this
round five specs left out `wcag21a`, and the shell spec's `withRules()` call replaced its tag set, so it ran one
rule only. The full list found one real Level A failure (section 3, item 1), now fixed.

Scripted accessibility checks on top of axe: reflow at 320 px with 112% and 125% text in light, dark and light
high contrast on 18 pages (108 loads, 0 sideways scroll); focus indicators measured in four themes (A-06, A-22).

### 2.3 Links (same approach as `docs/engineering/handoffs/integration.md`)

| Crawl | Result |
|---|---|
| Static HTML: seeds = every `<loc>` in `/sitemap.xml` (276, both languages) | **378 pages, 1,002 unique links, 0 broken, 0 missing anchors, 0 links through redirects** |
| Rendered in Chromium after hydration (sitemap plus 9 client-heavy pages: My journey with a saved flight, place and parked car; flight pages; board with `?dir=a`; search results; offline) | **285 pages, 1,547 unique links, 1,071 targets, 194 fragment links, 0 broken, 0 missing anchors, 0 redirected** |
| Search index: every document in `/en` and `/ms/search/index.json` | **434 documents, 308 pages, 170 anchors, 0 broken, 0 missing** |
| Canonical and hreflang (E-14) on every sitemap URL | 276 of 276 name themselves canonical with `en` and `ms` alternates (through the `Link` header; see E-14) |

Crawlers send a fresh `x-e2e-client-ip` per request so the per-route rate limits cannot show up as broken links.
Scripts: the integration round's `crawl.py` and `crawl-rendered.cjs`, plus a search-index check, run from the
session scratch folder (not in the repository).

### 2.4 Lighthouse mobile (3 runs each, median; before = `docs/qa/performance.md`, 18 November)

Same tool and settings as the baseline (`tools/lh.js`: Lighthouse 13.6, Moto G Power emulation, simulated slow 4G,
4x CPU), on a shared 4-vCPU container with nothing else running. Raw summaries: `docs/qa/lighthouse-after/`.

| Page | Performance before → after (runs) | LCP before → after | TBT before → after | CLS before → after | KB before → after | Requests before → after |
|---|---|---|---|---|---|---|
| `/en` | 56 → **90** (89/90/90) | 4.8 s → **1.2 s** | 1,391 → **421 ms** | 0 → 0 | 701 → 607 | 45 → 38 |
| `/ms` | 65 → **91** (90/91/91) | 1.3 → 1.2 s | 1,978 → **385 ms** | 0.161 → **0** | 703 → 609 | 45 → 38 |
| `/en/kul` | 78 → 80 (78/81/80) | 1.1 → **4.4 s** (1.1/4.4/4.4) | 992 → 272 ms | 0 → 0.003 (0.234 in run 1) | 768 → 619 | 64 → 38 |
| `/en/kul/flights` | 81 → 91 (91/93/74) | 1.1 → 1.1 s (4.4 in run 3) | 790 → 360 ms | 0 → 0.003 | 676 → 600 | 51 → 35 |
| `/en/kul/map` | 68 → 74 (76/74/74) | 4.4 → **4.6 s** | 679 → 393 ms | 0.003 → 0.003 | 686 → 630 | 51 → 37 |
| `/en/kul/transport` | 89 → 93 (76/93/93) | 1.3 → 1.2 s | 429 → 324 ms | 0 → 0.003 | 720 → 622 | 56 → 36 |
| `/en/guides` | 91 → 94 (94/96/93) | 1.1 → 1.1 s | 391 → 293 ms | 0 → 0 | 606 → 571 | 43 → 35 |
| `/en/concierge` | 91 → 93 (93/95/93) | 1.1 → 1.1 s | 612 → 311 ms | 0 → 0 | 597 → 717 | 40 → 42 |
| `/en/journey` | 64 → **96** (96/96/96) | 4.5 → **1.1 s** | 845 → 233 ms | 0 → 0 | 577 → 556 | 38 → 33 |

Accessibility is 100 on all nine pages in every run. SEO is 66 by design (the prototype sends `noindex`).

Against the brief: performance 95 or more on **1 of 9** pages (`/en/journey`); TBT 200 ms or less on **0 of 9**
(233 to 421 ms, 2 to 5 times lower than before); LCP 2.5 s or less on 7 of 9 (not `/en/kul` and the map, where the
prerendered body is still revealed by React's `$RC` script after the fallback); CLS 0.1 or less on 9 of 9 medians
(one `/en/kul` run 0.234). Budgets: first-load JavaScript for `/en` 274.8 KB gzip against 250 (fail, and up from
263.0); guidance pages 571 and 622 KB against 500 (fail); 40 requests or fewer on 8 of 9 (`/en/concierge` 42).

Other production measurements (Playwright, Pixel 7 unless stated):

| Measure | Result |
|---|---|
| Interaction latency at 4x CPU, worst per run (3 runs) | Board typing "MH" **56/64/64 ms**; home journey mode **136/136/120 ms**; board Departures/Arrivals **360/320/440 ms**; home airport switcher open and close **296/280/328 ms**; `/en/kul` switcher **320/320/288 ms** (target 200) |
| First-load JavaScript, gzip (build manifests, same script as performance-08) | `/en` 274.8 KB (was 263.0); flight page 294.7 (275.3); board 281.7 (267.4); corporate 258.5 (250.3); zod and the content schemas still in a 35.4 KB shell chunk on all 39 routes |
| HTML, gzip | `/en` 71 KB (was 78); board 55 (60); journey 50 (68); concierge 52 (57); content pages 52 to 75 (target 40) |
| Fonts on the home page | 122 KB: Hanken Grotesk 34.7, Fraunces 67.3 (preloaded, `font-display: optional`), Geist Mono 23.1; italic dropped (was 206 KB) |
| RSC prefetches per mobile load, 15 pages | 2 to 5 (was 8 to 24); desktop board 3 prefetches, 44 KB (was 39, 235 KB) |
| Service worker, first visit to `/en` | 61 requests, 710 KB, `/en` fetched twice, Cache Storage 1.8 MB (was 138 requests, 1.07 MB, `/en` three times, 2.5 MB) |
| Desktop CLS (2 loads each) | `/en` 0.002, `/ms` 0.001, `/en/kul` 0.01 (0.30 to 0.37 before the fix in section 3), `/en/concierge` 0 |

## 3. Regressions and defects found, and what was changed

Product code (each the smallest change that fixes it; every edited line carries a "verification round" comment):

1. **Phone bar "Journey" link failed WCAG 2.5.3 (Level A) once anything was saved.** The visible text read "1Journey"
   (badge before label, no space) and the name was "My journey: 1 saved item". Found only once the phone specs used
   the full tag list. `src/components/shell/mobile-bar.tsx`: label first in the DOM (the icon keeps its place with
   `order-first`), a space between them, and a new `shell.bottomBar.journeyCount` string in `src/lib/i18n/en.ts`
   and `ms.ts` ("Journey: 1 saved item" / "Perjalanan: 1 item disimpan"). Axe clean in both languages; screenshots
   show the bar unchanged.
2. **`/en/kul/parking` scrolled sideways (439 px at 320 px, 125% text) and clipped the 7-day column** (C's new price
   matrix, as A reported). `src/components/parking/parking-price-matrix.tsx`: the `overflow-hidden` card is now the
   existing `TableScroll` region. 108 reflow loads at 320 px: 0 sideways scroll.
3. **The home page shifted by CLS 0.16 (en) and 0.18 (ms) when a flight was saved** (A-08). The flag script and the
   `saved-flight-size` class existed, but no CSS used either, so nothing was reserved. `src/app/globals.css`: the
   reserved height by breakpoint, language and text size, measured on this build. Now CLS 0 in both languages, card
   at 273 to 478 px at 390x844, above the journey modes.
4. **The concierge tagged outlet facts "Official" from a magazine report** (the new duty-free answer, B-08), against
   D-01's rule. `src/lib/concierge/engine.ts`: outlet statements take Official only when an authoritative source
   backs them (`isAuthoritativeSource`). `engine.test.ts` asserts it (failed before the fix).
5. **Build warnings: the sitemap's route-folder walk traced the whole project** (1,187 files, 1,081 outside
   `node_modules`) into the server output (E-15). `src/lib/seo/site-routes.ts`: `turbopackIgnore` on the four
   file-system calls (the sitemap is prerendered). 0 warnings; sitemap byte-identical (276 URLs); 168 files traced.
6. **Desktop `/en/kul` CLS 0.30 to 0.37** (E-02 not met for the overview): its own Suspense fallback painted the
   footer in view, then the prerendered body pushed it off. `src/app/[lang]/[airport]/page.tsx`: the fallback is
   `min-h-dvh`. Now 0.01.

Test and CI harness (no test removed, skipped or made weaker):

7. **Rate limits locked parallel tests out** (8 failures: flight pages and the codeshare check answered 429). With no
   trusted client address configured, every visitor shares one bucket (60 in a burst, then 1 a second, for flight
   pages and the board feed), as `docs/engineering/handoffs/platform.md` documents. The e2e server is now configured
   like production: `playwright.config.ts` sends a per-worker `x-e2e-client-ip`, the managed `webServer` sets
   `TRUSTED_CLIENT_IP_HEADER`, and so does the CI e2e step
   (`.github/workflows/malaysia-airports-ci.yml`). Section 4 lists the deployment risk.
8. **CI would have skipped the C-06 status-code test** (it skips when `PLAYWRIGHT_BASE_URL` is set without
   `E2E_STATUS_CODES`). The CI e2e step now sets `E2E_STATUS_CODES: '1'`.
9. **Axe tag lists**: 7 specs now import the shared list; the shell spec no longer overrides it with `withRules()`.
10. **Expectations that predated other packages' content changes:** 22 facilities, not 20 (D-02 added two Fast Track
    records); the Long Term Car Park row locator anchored and the warning text updated to D-06's rule wording; the
    A-24 test now fails only when a citation title reads the same on the English page and is not marked `lang="en"`
    (D-03 translated this prototype's own source titles, which must not be marked English).
11. **Timing races in tests**: A-24 and A-30 read with non-waiting calls (`count()`, `allTextContents()`) while React
    still holds the page body in its hidden segment; both now wait for the element first (A-30 failed 4 of 8 phone
    repeats before, 16 of 16 passed after). The A-03 test waits for the overview to load before using its search, as
    its first half already did; the early-input loss it hit is a product issue (section 4, item 3).
12. **A-01 board-row test**: enabled, then returned to `fixme` with the measured values (864 px on the phone
    project, 893 px on the desktop project, at 390x664) because the criterion is not met.

## 4. Open issues, ranked

1. **Mobile performance target not met** (E-01, E-02, E-03, A-09). Lighthouse 74 to 96 (1 of 9 pages at 95), TBT
   233 to 421 ms everywhere; LCP 4.4 to 4.6 s on `/en/kul` and the map because their prerendered body is revealed
   by `$RC` after a page-level Suspense fallback; first-load JavaScript grew to 274.8 KB on `/en` (zod, the content
   schemas and the demo generator are still in the shell: hand-offs from E to A, B and D). As configured, the CI
   Lighthouse step (`lighthouserc.json`) will fail.
2. **Interactions over 200 ms at 4x CPU** (A-09, B-06): airport switcher open and close 280 to 328 ms, board direction
   switch 320 to 440 ms. Board typing (56 to 64 ms) and the journey modes (120 to 136 ms) are within target.
3. **Input before hydration is lost on airport pages.** `AirportFlightTools` and the bottom bar render inside Suspense
   fallbacks that React replaces instead of hydrating (they read `useSearchParams` and `usePathname`). On `/en/kul` at
   4x CPU, text typed right after DOMContentLoaded was lost in 5 of 6 runs and focus dropped (on `/en`, 6 of 6
   kept). A Menu tap on the phone bar was lost once in 8 repeats under load, because the early-tap recorder stops
   at hydration while the bar's buttons are swapped in later. Fix as recommended at integration: read URL state with
   `useSyncExternalStore` so these trees hydrate.
4. **A-01 not complete**: the first board row is at 864 px at 390x664 (target 664), under the lead, direction tabs,
   search, status chips, demo banner and table heading (B's board toolbar). The English flight-page h1 is at 201 px
   (target 200).
5. **Rate limiting depends on deployment configuration.** Without `TRUSTED_CLIENT_IP_HEADER` or `TRUSTED_PROXY_HOPS`,
   all visitors share one bucket: about 60 flight-page or board-feed requests in a burst, then one a second, for the
   whole site. Make the server log a warning or refuse to start in production without it, and add both variables to
   the deployment checklist.
6. **Hand-offs between packages not done** (these keep 14 items partial): B-01 status lines and queue estimates on the
   home notice strip and KLIA overview (A); B-09 home search still on the browser generator (A); B-15 concierge entry
   in the phone Search sheet (A); C-05 home shop strip still offers "Open now" (A); C-06 `ensureStatic` on the
   flights page (B); D-02 Fast Track on the KLIA overview (A); D-05 the full "not verified" block still on parking,
   facilities and transport (C); D-08 transit steps reading the Aerotrain notice (C); D-09 Malay airport names:
   the `<title>` and h1 of every Malay airport overview are English, and English place names remain on `/ms`,
   `/ms/airports` and `/ms/notices` (A); D-13 the home arrival rule (A); A-21 page titles still differ from the
   section nouns ("Departures and arrivals", "Getting to and from KLIA"); E-11, E-14 and E-17 adoption by page
   owners.
7. **Density and weight**: A-14 chips not reduced (Facilities 23 provenance tags, 23 source toggles, 36 "not
   published" mentions at 390 px, against about 21, 21 and 27 before; 8 to 9 type sizes); E-12 service-worker first
   visit 61 requests and 710 KB, `/en` downloaded twice, Cache Storage 1.8 MB; E-11 HTML 50 to 75 KB gzip.
8. **Low**: E-09 the enforced CSP still allows inline script (report-only policy in place); flight-route 404s send
   `public, max-age=300` (page 404s are within E-22's 60 s); every page's `Link` header lists the canonical URL three
   times; D-14 reading level about grade 9.5 and ease 50.5 by a scripted estimate, with several notes over 25 words;
   the saved-flight card and flight summary repeat the boarding time ("Board from 10:50 10:50"); Geist Mono still
   loads on the home page (23 KB); the WebKit phone project and the CI workflow have not run (E-06).
9. **Needs MAHB or partner data (out of scope)**: airline assistance rules (D-04), the Immigration Department's
   wording for departing citizens (D-07), taxi counter, rail entrance and e-hailing places on the map (C-08), the
   Fast Track price, hours and seller (D-02), parking tariff and dated booking link (C-01), and the rest of the
   backlog's OOS list.

## 5. Acceptance, per P0 and P1 item

Status: **V** verified on the production build, **NV** not verified (criterion not fully met or not observable here),
**R** regressed. "e2e" means a named Playwright test passed in the final run on both projects unless stated.

| Count | P0 (48) | P1 (53) | All (101) |
|---|---|---|---|
| Verified | 33 | 40 | 73 |
| Not verified | 14 | 13 | 27 |
| Regressed | 1 | 0 | 1 |

### Package A

| ID | P | Status | Evidence (production build) |
|---|---|---|---|
| A-01 | P0 | NV | Compact bar 56 px and no full banner on 9 sub-pages x 3 viewports x 2 languages (54); h1 at 184 px, except the English flight page at 201 px; at 125% text the h1 is clear of the bar on 18 of 18; banner kept on the overview. First board row 864 px at 390x664 (target 664). e2e first-screen tests run; board-row test is `fixme` |
| A-02 | P0 | V | e2e "A-02" with the full tag list (includes label-content-name-mismatch) on `/en/kul`, `/en/kul/flights`, `/ms/kul/map`, `/en/concierge`; shared tags now in every spec |
| A-03 | P0 | V | e2e "A-03" (topic shows site results and "See all"; Enter opens search; route opens search; one exact flight number opens the flight; en and ms) |
| A-04 | P0 | V | e2e "A-04" (every phone preview row has a demo marker in view; narrow banner one line, at most 48 px) |
| A-05 | P0 | V | e2e "A-05" (focus on the new h1 after 3 client navigations) |
| A-06 | P0 | V | Active option: 2 px focus-colour outline at 6.92, 7.95, 9.47 and 11.06:1 against the list and 5.68 to 9.68:1 against the option (light, dark, light HC, dark HC); field ring in e2e and in a dark-theme screenshot |
| A-07 | P0 | V | e2e "A-07" (Subang tiles say not published and lead to an honest state); `sections.test.ts` |
| A-08 | P0 | V | After fix 3: CLS 0 in en and ms (was 0.16 and 0.18); card at 273 to 478 px above the modes at 390x844 with status, terminal, gate, arrive-by and next step (screenshot); e2e "A-08" |
| A-09 | P0 | NV | TBT `/en` 421 ms, `/ms` 385 ms (target 200); switcher open and close 280 to 328 ms; journey mode 120 to 136 ms; early taps on the home kept (e2e, 6 of 6 typing runs); overview early input lost (section 4, item 3) |
| A-10 | P0 | V | CLS 0 (mobile) and 0.001 to 0.002 (desktop) on `/en` and `/ms`, 3 runs each, with and without Fraunces; Fraunces preloaded; italic removed; home fonts 122 KB. Geist Mono still loads on the home page |
| A-11 | P0 | V | e2e "A-11" (320x568 at 125%: header and bar give way); h1 clear of the bar at 125% on 18 of 18 |
| A-12 | P0 | V | `search.test.ts` first results for the listed queries, including "fast track" and "laluan pantas" to the Fast Track record; "Accessible parking: not published yet" result seen in the palette |
| A-13 | P0 | V | 9 section tabs fit with none clipped at 1280, 1440 and 1920 in en and ms; e2e Malay bottom-bar labels on one line at 360 px |
| A-14 | P0 | NV | At 390 px: Facilities 23 provenance tags, 23 source toggles, 36 not-published mentions; Transport 10, 10 and 26 (evidence before: about 21, 21, 27 and 22). Target 40% fewer. 8 to 9 type sizes |
| A-15 | P1 | V | e2e "A-15" (desktop header and phone menu); seen in the desktop screenshot |
| A-16 | P1 | V | After fix 2: 18 pages at 320 px, 112% and 125%, 3 themes (108 loads), 0 sideways scroll; e2e "A-16" |
| A-17 | P1 | V | One airport chooser in the home first screen; Arriving switches the search to arrivals with "Search departures instead" (screenshot) |
| A-18 | P1 | V | Arriving shows "Before you land": MDAC within three days, free on the official portal, Official tag (screenshot); Malay "Sebelum mendarat" |
| A-19 | P1 | V | 2 to 5 RSC prefetches per mobile load on 15 pages; desktop board 3 prefetches, 44 KB; no prefetch on save-data, 2g or 3g (`locale-link.tsx`) |
| A-20 | P1 | V | First notice at 374 px at 390x664 on `/en/kul`; `preview-filter.test.ts` |
| A-21 | P1 | NV | `sections.test.ts` passes for nav and tabs, but page titles still differ from the section nouns ("Departures and arrivals", "Getting to and from KLIA"); B, C and D hand-offs open |
| A-22 | P1 | V | Banner link focus ring 3 px at 11.1:1 in all four themes |
| A-23 | P1 | V | e2e "A-23" ("/" alone does nothing; Ctrl+K opens) |
| A-24 | P1 | V | 138 Malay pages: 0 English citation titles without `lang="en"`; e2e "A-24" (updated for translated titles) |
| A-25 | P1 | V | One term ("Concierge") in `ms.ts` and the concierge dictionary; native sign-off is OOS-14 |
| A-26 | P1 | V | `/en/airports` at 390x844: last used (Penang) at 372 px, KLIA T1 at 438, T2 at 502, 56 to 58 px tall, above the first filter (618 px) |
| A-27 | P1 | V | e2e "A-27" (each preview row one link, at least 44 px, at 360 px and 125%) |
| A-28 | P1 | V | Demo note "These flights are simulated. Do not use them to plan travel." in both dictionaries |
| A-29 | P1 | V | e2e commerce "honours the home page filters" |
| A-30 | P1 | V | e2e "A-30" (BreadcrumbList matches the visible trail on `/en/kul/parking`) |
| A-31 | P1 | V | Code: `secure` added on https (`language-switch.tsx`); not observable over local http |

### Package B

| ID | P | Status | Evidence |
|---|---|---|---|
| B-01 | P0 | NV | Status lines with "No disruption reported in our sources" on the flight page and transit, demo queue estimates on the flight page; not on the home notice strip or the KLIA overview (A hand-off) |
| B-02 | P0 | V | `journey.test.ts` (check-in close + 1 min, boarding, departure + 1 min, landed, cancelled) |
| B-03 | P0 | V | e2e "answers first on a 360 px phone" (en and ms, 100% and 125%); screenshot: next step and gate in the first screen |
| B-04 | P0 | V | e2e Follow with e-mail and the no-notifications alternatives; delivery to a closed browser is OOS-10 |
| B-05 | P0 | V | e2e board rows labelled in view on `/en/kul`, `/ms/kul`, `/en/pen` boards, and the flight values |
| B-06 | P0 | NV | Board keystrokes 56 to 64 ms at 4x CPU; board direction switch 320 to 440 ms (target 200); row cap e2e |
| B-07 | P0 | V | Empty state in server HTML (e2e); with a saved flight CLS 0.036 (mobile) and 0.007 (desktop), 2 loads each; Lighthouse `/en/journey` LCP 1.1 s |
| B-08 | P0 | V | API: fare (KLIA Ekspres RM 55 until 31 December, Estimated), AirAsia to Terminal 2, Fast Track (en and ms), duty free, Aerotrain status, how early, departing immigration and step-free each lead with a direct statement; outlet tag fixed (section 3, item 4) |
| B-09 | P0 | NV | Board and flight page keep last-known data and fail clearly (e2e); home search and previews still use the browser generator (A hand-off); official feed is OOS-01 |
| B-10 | P0 | V | e2e "says when the scheduled time has changed, in words" |
| B-11 | P0 | V | e2e "My needs adds the assistance step and step-free map links"; control also on `/accessibility` |
| B-12 | P0 | V | `journey.test.ts` card and timeline agree |
| B-13 | P0 | V | Flight page links `shop-dine?gate=T1-G10&t=T1`, `parking?t=T1&from=…`, `transport?t=T1`; hand-luggage and lounge toggles present; optional Fast Track step |
| B-14 | P0 | V | Codeshare 308 to the operating flight; malformed, oversized and unknown ids 404 in 1.3 KB; valid page `s-maxage=60` |
| B-15 | P1 | NV | Privacy line and field in server HTML and CLS at most 0.05 (e2e); concierge entry in the phone Search sheet not added (A hand-off) |
| B-16 | P1 | V | e2e "leads with flights still to leave" |
| B-17 | P1 | V | `journey.test.ts` meeting kind; pick-up point and fee need MAHB data |
| B-18 | P1 | V | e2e pause and resume, announced |
| B-19 | P1 | V | e2e "announces a change to a saved flight once" (passes once the rate-limit harness is fixed) |
| B-20 | P1 | V | e2e question field in view after answers at 1280x800 and 390x844 |
| B-21 | P1 | V | Flight number in lining figures; route stated once above the status card (screenshot). The h1 is not set to tabular figures |

### Package C

| ID | P | Status | Evidence |
|---|---|---|---|
| C-01 | P0 | V | e2e matrix first, warning in its row, dates beside the booking link, matrix in the first phone screen; reflow fixed (section 3, item 2). Tariff and deep link are OOS-03 |
| C-02 | P0 | V | Coupon-counter warning under the lead and beside taxi and e-hailing (screenshot, en and ms); coupon taxi listed; ticket link to kliaekspres.com; e2e "C-02" |
| C-03 | P0 | V | e2e verdict card under the form, within one phone screen, announced |
| C-04 | P0 | V | e2e "C-04" and `map-logic.test.ts` |
| C-05 | P0 | NV | Shop and dine page drops filters that cannot match (e2e); the home strip still offers "Open now" (A hand-off) |
| C-06 | P1 | NV | e2e on `next start`: 39 airports x 7 sections plus overview, 200 or 404 on the first and repeat request with a "Page not found" title. Flights left out until B adds `ensureStatic` |
| C-07 | P1 | V | e2e nursing room placeholder reached in two interactions |
| C-08 | P1 | NV | Named level change, immigration and customs (e2e); route cannot end at the taxi counter, rail entrance or e-hailing pick-up (map places need sources) |
| C-09 | P1 | V | e2e and `map-logic.test.ts` unique option labels |
| C-10 | P1 | V | e2e heading order |

### Package D

| ID | P | Status | Evidence |
|---|---|---|---|
| D-01 | P0 | V | `content.test.ts` source policy and `validateAllContent()`; the concierge outlet tag now follows the same rule (section 3, item 4) |
| D-02 | P0 | NV | Records per terminal with "Not published" fields; search, concierge (en and ms), flight step and legacy 308s to `#kul-t1-fast-track` and `#kul-t2-fast-track` all work; not shown in the KLIA overview services area (A hand-off); price, hours and seller need MAHB data |
| D-03 | P0 | V | 138 Malay pages: none of the audited English strings in the main content |
| D-04 | P0 | NV | Hub lists missing facts with request channels (e2e); airline assistance rules not added (need airline data) |
| D-05 | P0 | NV | About this prototype lists gaps once per airport (e2e); the full block is still on parking, facilities and transport (C hand-off) |
| D-06 | P0 | V | Preferred Parking warning stated as a rule ("Staying more than a day? Use the Long Term Car Park"); source policy in `content.test.ts`. Brand and legal review OOS-08 and OOS-14 |
| D-07 | P0 | NV | A departing note for citizens is in the guide, timeline and concierge, but it says the rules are not published: the Immigration Department's own wording is missing |
| D-08 | P1 | NV | Title without "Planned:", accessible alternative stated, clock tests pass; transit steps do not yet read the notice (C hand-off) |
| D-09 | P1 | NV | Malay airport overview titles and h1 English on all 39 (`/ms/pen`: "Penang International Airport"); English place names on `/ms`, `/ms/airports`, `/ms/notices` (A hand-off) |
| D-10 | P1 | V | Clock tests at 2026-12-31T23:00, 2027-01-01T00:10 and 2027-01-15 in `content.test.ts` |
| D-11 | P1 | V | e2e "no map link while toilets are unpublished" |
| D-12 | P1 | V | `content.test.ts` (ISO dates or undated, flags records older than 12 months) |
| D-13 | P1 | NV | Transit planner reads `TRANSIT_ASSUMPTIONS`; the home "be at the airport by" line does not read `ARRIVAL_TIME_RULE` (A hand-off) |
| D-14 | P1 | NV | Scripted estimate on `/en/guides/immigration-customs`: grade 9.5, reading ease 50.5 (targets 9 and 55); several per-airport notes over 25 words |
| D-15 | P1 | V | e2e "Help puts a tappable Malaysia Airports number in the first phone screen" |

### Package E

| ID | P | Status | Evidence |
|---|---|---|---|
| E-01 | P0 | NV | Lighthouse 74 to 96 (section 2.4); budgets enforced in `lighthouserc.json` and CI, which would fail today |
| E-02 | P0 | NV | Root `loading.tsx` removed; desktop CLS at most 0.01 on the four pages (after fix 6); LCP 4.4 s on `/en/kul` and 4.6 s on the map; `$RC` reveals remain on static pages |
| E-03 | P0 | R | First-load JS `/en` 274.8 KB gzip (was 263.0, target 250); content pages 257 to 282 (target 170); zod and content schemas still in the shell |
| E-04 | P0 | V | Declared 5,000 bytes: 413; 50 MB chunked stream: 413, server RSS unchanged (749 MB before and after) |
| E-05 | P0 | V | One trusted address with rotating `X-Forwarded-For`: 200 x 10, then 429 |
| E-06 | P0 | NV | Workflow, Dependabot, shared axe tags and audit gate exist; two CI gaps fixed (section 3, items 7 and 8); not run in CI here, WebKit project not run locally |
| E-07 | P0 | V | `text/plain` 415, look-alike JSON type 415, `Sec-Fetch-Site: cross-site` 403, other origin 403, same origin 200 |
| E-08 | P0 | V | Per client: `/api/flights` 429 from request 61 of 300, `/api/health` from 11, flight pages from 61; edge rules in `docs/engineering/edge/` (deployment OOS-11) |
| E-09 | P1 | NV | Report-only policy with the script hash and `require-trusted-types-for 'script'` reporting to `/api/csp-report` (204); enforced policy still allows `'unsafe-inline'` |
| E-10 | P1 | V | `max_tokens` 240, question redacted in its own block with tags escaped, spend caps and breaker in `rate-limit.ts`; red-team cases in `server.test.ts` |
| E-11 | P1 | NV | No corporate dictionary keys on passenger pages; HTML 50 to 75 KB gzip (target 40) |
| E-12 | P1 | NV | First visit 61 requests, 710 KB, `/en` fetched twice, Cache Storage 1.8 MB (targets 60, 600 KB, once, 1 MB) |
| E-13 | P1 | V | `security.md` sections carry "Verified against the code on 21 November 2026"; cache names `ma-v1-pages`, `ma-v1-static` as documented |
| E-14 | P1 | NV | 276 of 276 sitemap URLs carry canonical and both alternates, but only in the `Link` header (canonical repeated); `pageMetadata` not adopted by pages |
| E-15 | P1 | V | Sitemap 276 URLs (was 240); `seo.test.ts` compares it with the routes |
| E-16 | P1 | V | Fast Track 308s to the record anchors (present on the page); Wi-Fi and KLIA car rental 307; Penang car rental 308 to `#transport-pen-car-rental` (present) |
| E-17 | P1 | NV | `/api/metrics` and the store exist; pages have not adopted the measurement attributes and the privacy text (hand-offs) |
| E-18 | P1 | V | `storage.test.ts` and `locale.test.ts` (tampered `href` dropped; only https, mailto and tel pass) |
| E-19 | P1 | V | Out-of-range date 400; repeated `airport` or `dir` 400; unknown `/api/*` JSON 404; HEAD 200 |
| E-20 | P1 | V | `npm audit --omit=dev` and `npm audit`: 0 |
| E-21 | P1 | V | `/api/health` returns `{"status":"ok","build":"…"}` only |
| E-22 | P1 | V | `/en/no-such-page`, `/no-such-file.txt`, `/en/zzz`: 404 with `s-maxage=60`. Flight-route 404s use `public, max-age=300` (section 4, item 8) |
| E-23 | P1 | V | `import 'server-only'` in `rephrase.server.ts` and `knowledge.server.ts` |
| E-24 | P1 | V | One `Intl.NumberFormat` per language cached in `translate.ts` |

## 6. Files changed in this round

`src/lib/seo/site-routes.ts`, `src/components/shell/mobile-bar.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`,
`src/components/parking/parking-price-matrix.tsx`, `src/app/globals.css`, `src/app/[lang]/[airport]/page.tsx`,
`src/lib/concierge/engine.ts`, `src/lib/concierge/engine.test.ts`; `e2e/shell.spec.ts`, `smoke.spec.ts`,
`commerce.spec.ts`, `concierge.spec.ts`, `flights.spec.ts`, `map.spec.ts`, `transport.spec.ts`;
`playwright.config.ts`; `tsconfig.json`; `../.github/workflows/malaysia-airports-ci.yml`; new:
`docs/qa/lighthouse-after/` and this file.

## 7. How to reproduce

```bash
npx tsc --noEmit && npx eslint . && npx vitest run
NEXT_PUBLIC_SITE_URL=http://localhost:3100 APP_VERSION=$(git rev-parse --short HEAD) npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off                                     # reuses the server on 3100
```

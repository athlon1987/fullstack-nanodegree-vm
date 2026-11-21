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

---

# Round two

Owner: release and verification. Date: 21 November 2026. Scope: the second fix round
(`docs/qa/fixes/round2-performance.md`, `docs/qa/fixes/round2-handoffs.md`) checked together on a production build
(`NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build`, served by
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100`), every P0 and P1 item that round one left
not verified or regressed re-checked against its acceptance criterion, and every item the two round-two logs
claim checked again. Round one above is unchanged.

**Result:** types, lint, 503 unit tests, the build (0 warnings), `npm audit`, **348 end-to-end tests (0 failed)**,
the axe scans (0 violations) and the link crawls (0 broken links, 0 missing anchors) all pass on the final build.
Of the 101 P0 and P1 items, **85 are verified** (was 73), **16 are not verified** (was 27) and **none has
regressed** (E-03 moved from regressed to not verified). Three product defects were found and fixed (section
R3): one from before this round that round two's log described as intended (canonical `Link` headers copied
between pages and growing with every regeneration), one regression from round two (flight-page heading pushed to
244 px on phones) and one gap in a claimed hand-off (D-09, the airport overview board in English on `/ms`). Mobile
Lighthouse is 95 or more on 8 of 9 pages (was 1 of 9); TBT is 200 ms or less on 2 of 9; `/en/kul/transport`
has an LCP of 4.3 s because its body is still revealed by `$RC` (section R5, issue 1).

## R1. Clean-up before the checks

- No server was listening on ports 3211 or 3212 and no process from this checkout was running; no `.next-r2*`
  folder existed and `tsconfig.json` and `next-env.d.ts` named only `.next` (the round-two engineers had cleaned up).
- For one before-and-after check (section R3, fix 1) a second build was made in `.next-v2check` and served on port
  3213, then stopped by PID; the folder was deleted and the two `.next-v2check` lines that build added to
  `tsconfig.json`, and its paths in `next-env.d.ts`, were restored. A server started without trust settings on
  port 3213 (rate limits, section R2.5) was also stopped by PID. Final state: only `.next`, nothing listening.
- Every check below ran on port 3100 with the trusted client header, stopped by PID at the end.

## R2. Results

### R2.1 Static checks, unit tests and build

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (also after every change below) |
| `npx eslint .` | 0 problems |
| `npx vitest run` | 32 files, **503 passed**, 0 failed (round one 495) |
| `npm audit --omit=dev` / `npm audit` | 0 vulnerabilities / 0 vulnerabilities |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build` | Succeeds, 369 static pages, **0 warnings**; 43 s from cold, 18 to 22 s for the three rebuilds after the fixes |

### R2.2 End-to-end and accessibility (production build, desktop 1440x900 and phone Pixel 7 390x844, `--trace off`)

| Run | Build | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|---|
| 1 | As delivered by round two | 344 | 0 | 6 | 350 tests, 5.9 min |
| 2 | After fixes 1 and 2, two tests added | 348 | 0 | 6 | 354 tests, 6.1 min |
| 3 | After fix 3, one assertion added | 346 | **2** | 6 | My new D-09 assertion was too broad: it also matched a cited English source title ("AIP Malaysia: Aerodrome WMKP Penang International Airport", correctly marked English). Narrowed to the board's subtitle line, the line the defect was in; no existing assertion was changed |
| 4 (final) | Final build, final specs | **348** | **0** | 6 | 354 tests, 6.1 min |

The 6 skips are deliberate and project-specific: 5 as in round one (calendar download on the phone, two
keyboard-only and one wide-screen check on the phone, the 1280x720 home check on the phone) and the round-two
B-15 check on desktop (the Search sheet is a phone control). The A-01 board-row test, `fixme` after round one, runs
and passes on both projects. No test was deleted, skipped or loosened (section R3 lists the spec changes).

**Axe: 0 violations.** 50 scan call sites in 11 specs (several loop over pages), all with the shared tag list of
`e2e/support/axe.ts` (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa), on both projects. Lighthouse accessibility is
100 on every one of the 27 runs. Scripted checks repeated on the final build: reflow at 320 px with 112% and 125%
text in three themes on 18 pages (108 loads, 0 sideways scroll); focus outline of the active search option 6.92 to
11.06:1 and the banner link ring 3 px at 11.1:1 in four themes (unchanged).

### R2.3 Links (same scripts as section 2.3; fresh client address per request)

| Crawl | Result (final build) |
|---|---|
| Static HTML from the 276 sitemap URLs | **438 pages, 1,154 unique links, 0 broken, 0 missing anchors, 0 links through redirects** (round one 378 pages, 1,002 links) |
| Rendered in Chromium after hydration (sitemap plus the 9 client-heavy pages) | **285 pages, 1,559 unique links, 1,071 targets, 206 fragment links, 0 broken, 0 missing anchors, 0 redirected** |
| Search index, `/en` and `/ms` | **434 documents, 308 pages, 170 anchors, 0 broken, 0 missing** |
| Canonical and hreflang on every sitemap URL | 276 of 276 name themselves canonical with `en` and `ms` alternates; **exactly one canonical per response on 276 of 276** after fix 1 (before it: 6 to 11 per page, growing); in the HTML `<head>` on 152 of 276 (home, airport overviews and sections), by the `Link` header only on the other 124 |

Both crawls were run twice, on the build as delivered and on the final build, with the same counts.

### R2.4 Lighthouse mobile (3 runs, median; `tools/lh.js`, Lighthouse 13.6, Moto G Power, simulated slow 4G, 4x CPU)

Before = round one (`docs/qa/lighthouse-after/`); after = this round, measured on the build with fixes 1 and 2
(fix 3 changes only the airport name text on Malay pages). Raw summaries: `docs/qa/lighthouse-round2/`. Shared
4-vCPU container with nothing else running.

| Page | Performance before → after (runs) | LCP before → after | TBT before → after (runs) | CLS before → after | KB before → after | Requests |
|---|---|---|---|---|---|---|
| `/en` | 90 → **97** (99/97/96) | 1.23 → 1.08 s | 421 → **204 ms** (116/204/221) | 0 → 0.003 | 607 → 576 | 38 → 40 |
| `/ms` | 91 → **96** (94/98/96) | 1.23 → 1.09 s | 385 → **227 ms** (297/177/227) | 0 → 0.025 | 609 → 578 | 38 → 40 |
| `/en/kul` | 80 → **96** (94/96/96) | **4.38 → 1.07 s** | 272 → 233 ms (283/233/231) | 0.003 → 0.003 | 619 → 626 | 38 → 45 |
| `/en/kul/flights` | 91 → **95** (95/95/95) | 1.07 → 0.92 s | 360 → 257 ms (257/272/249) | 0.003 → 0.003 | 600 → 571 | 35 → 39 |
| `/en/kul/map` | 74 → **97** (97/94/97) | **4.57 → 1.07 s** | 393 → 201 ms (201/285/194) | 0.003 → 0.003 | 630 → 606 | 37 → 41 |
| `/en/kul/transport` | 93 → **81** (81/94/79) | 1.22 → **4.27 s** (4.27/1.07/4.38) | 324 → 291 ms (248/291/294) | 0.003 → 0.003 | 622 → 597 | 36 → 40 |
| `/en/guides` | 94 → **97** (97/98/96) | 1.07 → 1.07 s | 293 → **192 ms** (192/159/237) | 0 → 0 | 571 → 548 | 35 → 38 |
| `/en/concierge` | 93 → **95** (93/96/95) | 1.07 → 0.92 s | 311 → 268 ms (310/213/268) | 0 → 0 | 717 → 690 | 42 → 45 |
| `/en/journey` | 96 → **98** (97/98/98) | 1.06 → 0.92 s | 233 → **171 ms** (196/166/171) | 0 → 0 | 556 → 527 | 33 → 36 |

Against the brief: performance 95 or more on **8 of 9** medians (was 1 of 9; not `/en/kul/transport`); TBT 200 ms
or less on **2 of 9** (guides 192, journey 171; `/en` 204 and the map 201 just over; was 0 of 9); LCP 2.5 s or
less on 8 of 9 (not transport); CLS 0.1 or less on 9 of 9. Budgets: first-load JavaScript for `/en` 232.6 KB gzip
against 250 (**pass**, was 274.8); guidance pages 548 to 597 KB against 500 (fail); 40 requests or fewer on 5 of 9
(`/en/kul` and `/en/concierge` 45, the map 41). The CI Lighthouse step (`lighthouserc.json`) would still fail on
TBT, on the transport LCP and on bytes.

Transport, diagnosed with `docs/qa/lighthouse/scripts/lhx.js` (summary in
`docs/qa/lighthouse-round2/diagnostics/`): the LCP element is the touts warning, which sits in a hidden segment
(`<div hidden id="S:5">`) revealed by React's `$RC` script; in the slow runs it painted about 300 ms after first
paint and after DOMContentLoaded, so the simulation places LCP after the scripts. Round two removed this pattern
from the overview, the board and the map only. A scan of all 276 sitemap URLs finds the `h1` inside such a
segment on **116**: guide topics (22) and help topics (22), corporate sub-pages (28), and shop and dine (18),
facilities, transport, parking and lounges (6 each) and transit (2). See section R5, issue 1.

Congested airport Wi-Fi profile (E-02; `lhx.js --profile=airport-wifi,250,1500,500,4`, 3 runs, summaries in
`docs/qa/lighthouse-round2/airport-wifi/`): `/en` LCP **2.55 s** (2.63/2.55/2.54; baseline 2.90), performance 82,
TBT 447 ms; board LCP **2.69 s** (2.69/2.69/2.66; baseline 2.76), performance 82. Target 2.5 s: not met (first
paint alone is 2.55 s on this profile).

### R2.5 Other production measurements (Playwright, Pixel 7 unless stated)

| Measure | Round one | Round two (final build) |
|---|---|---|
| Interaction latency at 4x CPU, worst per run (3 runs; `r2/inp.cjs` method) | Board typing 56/64/64; board Departures/Arrivals 360/320/440; home journey mode 136/136/120; home switcher 296/280/328; `/en/kul` switcher 320/320/288 ms | Board typing **40/80/40**; board direction **88/128/144**; home journey mode **152/104/104**; home switcher **136/144/160**; `/en/kul` switcher **168/192/128** ms: **every run under 200 ms** |
| Input before hydration (scripts delayed 2.5 s, 4x CPU, 6 loads per case) | `/en/kul` typing lost in 5 of 6 | `/en/kul` typing **0 of 6 lost**, Menu tap 0 of 6; board typing 0 of 6, Menu tap 0 of 6; every input landed before hydration, 141 to 363 ms after DOMContentLoaded |
| First-load JavaScript, gzip (build manifests, 41 routes) | `/en` 274.8; flight page 294.7; board 281.7; corporate 258.5 | `/en` **232.6**; `/en/kul` 233.4; board 235.9; map 236.6; transport 225.4; parking 229.4; concierge 223.3; guides 213.1; guide topic 213.0; corporate 211.5; **flight page 252.0** and **`/en/journey` 256.7** (the two over 250); framework 128.6 of every row |
| zod and the demo generator in client chunks | zod and content schemas in a 35.4 KB shell chunk on all 39 routes | zod in **0** client chunks; the demo flight generator (airline and route tables, 17.1 KB gzip chunk) still in the first load of **all 39** page routes |
| HTML, gzip | `/en` 71; board 55; journey 50; concierge 52; content pages 52 to 75 KB | `/en` 60.0, `/ms` 61.5, `/en/kul` 56.4, board 37.5, journey 37.2, concierge 37.2, airports 37.5; section pages 48.7 to 62.3; guides 43.7 to 54.4; help 54.9; corporate 45.7; **flight page 93.7** (target 40 for content pages) |
| Service worker, first visit to `/en` (E-12) | 61 requests, 710 KB, `/en` twice, Cache Storage 1.8 MB | 60 requests, **652 KB**, `/en` **twice**, Cache Storage **1,580 KB** (24 entries) |
| RSC prefetches per mobile load, 15 pages | 2 to 5; desktop board 3, 44 KB | **2 to 4**; desktop board 2, 26 KB; desktop home 2, 39 KB |
| Fonts on the home page | 122 KB | 122 KB (Hanken Grotesk 34.7, Fraunces 67.3, Geist Mono 23.1). Since fix 1 the two preloads are `<link rel="preload">` tags in the `<head>` instead of a `Link` header |
| CLS, home with and without Fraunces (A-10; 3 loads each) | 0 (mobile), 0.001 to 0.002 (desktop) | `/en` 0.003 and `/ms` **0.029** (mobile); `/en` **0.018** and `/ms` 0.015 to **0.023** (desktop). Cause, traced: the round-two status row's summary text arrives after hydration and wraps to two lines in Malay on a phone; on desktop a notice card in the strip grows by 20 px after hydration. Within every target (0.05 and 0.1); section R5, issue 11 |
| Desktop CLS (E-02, 2 loads each) | `/en` 0.002, `/ms` 0.001, `/en/kul` 0.01, concierge 0 | `/en` 0.018, `/ms` 0.023, `/en/kul` 0.011, concierge 0 |
| Saved flight on the home (A-08) / My journey (B-07) | CLS 0 / 0.036 mobile, 0.007 desktop | CLS **0** in en and ms, card 273 to 477 px (en) and 313 to 585 px (ms) / 0.036 mobile, 0.007 desktop |
| A-01 positions (9 sub-pages including the flight page x 3 viewports x 2 languages, after fix 2) | h1 184 px except the English flight page at 201; board row 864 px | **54 of 54**: compact bar at most 56 px, h1 at most **184 px**; at 125% text 18 of 18 headings clear of the bar; full banner on the overview only; first board row **614 px** (en) and 614 to 662 px (ms) at 360x800, 390x664 and 390x844 |
| Density at 390 px (A-14) | Facilities 23 tags, 23 source toggles, 36 "not published"; Transport 10, 10, 26; 8 to 9 type sizes | Facilities **8** tags, 21 toggles, 29 "not published", 8 type sizes; Transport **6**, 9, 17, **9** type sizes |
| Reading level, immigration and customs guide (D-14) | Grade 9.5, ease 50.5 | Grade 9.5, ease 50.5; 6 sentences over 25 words (targets 9, 55, none) |
| Rate limits without trust settings (server on port 3213 started without either variable) | All visitors in one bucket | One `[rate-limit]` warning in the start-up log (none on the configured server); one address: 200 x 60, then 429 from request 61; a second address straight after: 200; rotating forged addresses: 429 from request 551 of the rotation, about 600 in all (the site-wide ceiling, 10 x 60) |
| 404 caching (E-22) | Flight-route 404s `public, max-age=300` | Flight-route 404s `public, max-age=0, s-maxage=60`; page 404s `s-maxage=60` (`/en/no-such-page`, `/no-such-file.txt`, `/en/zzz`, `/en/lgk/map`) |
| CSP | Report-only with one hash | Report-only with **4** script hashes and `require-trusted-types-for 'script'`; enforced policy still `script-src 'self' 'unsafe-inline'` |

## R3. Defects found and fixed in this round

Each is the smallest change that fixes it, marked "verification round two" in the code, with a test that fails
without it.

1. **Canonical `Link` headers were copied between pages and grew without limit (pre-existing; round two's log
   called the header intended).** Every page answered with two `Link` headers: the canonical and hreflang set from
   `next.config.ts`, and a second one holding the same set **6 to 8 more times** plus the font preloads. Watched
   for 2.5 minutes, `/en/privacy` went from 8 to 9, 10 and 11 canonicals, one more each time the page was
   regenerated (`s-maxage=60`): the header grows by about 250 bytes a minute per busy page, without limit, until a
   CDN or proxy header limit rejects the response. Flight pages, which share one regenerated shell, named **other
   visitors' flights** as canonical (a request for `ak6336-20261121-d` answered with canonicals for
   `mh2626-20261118-d`, `mh184-20261121-d` and `mh2626-20261121-d`), which also discloses which flight pages others
   looked at. Cause, in Next.js 16.4: when React adds its own `Link` preload header (the fonts), the prerender stores
   the response's whole `Link` value, including the configured rules, in the regenerated page, and serving it adds
   the configured value again. Fix: `reactMaxHeadersLength: 0` in `next.config.ts`; React then puts the two font
   preloads in the HTML `<head>` and only the configured rules set `Link`. After: exactly one canonical on every
   page through three regeneration windows (3.7 minutes) and on 7 flight pages in a row; the e14 crawl finds 0
   pages with a repeated canonical (was 276); fonts still preloaded, home CLS within target (R2.5). Test:
   `platform.spec.ts` "a flight page names only itself as canonical, whichever flight pages were served before"
   (no preload entries in `Link`, one self-canonical per flight and section page). Run against a build without the
   fix (`.next-v2check`, port 3213) it failed on both projects; with it, it passes.
2. **The flight page's heading was at 244 px on phones (regression from round two).** The hand-offs engineer's
   outlet change (`globals.css` keeps four-item breadcrumb trails on phones so outlets keep "< Shops and food") also
   showed "< Flights" above the flight page's heading (Home, airport, Flights, flight is also four items), moving
   the `h1` from 184 px (the performance engineer's measurement) to 244 px in both languages and at all three
   viewports. A-01 requires 200 px or less; the A-01 e2e loop covers the section pages but not the flight page, so
   it was not caught. Fix: `src/app/[lang]/[airport]/flights/[flightId]/page.tsx` hides the trail on phones for
   this page only (`max-sm:[&_[data-page-breadcrumbs]]:hidden`); outlets keep their back link (screenshot checked).
   After: 184 px on 6 of 6. Test: `shell.spec.ts` "a flight page starts with its own heading on a phone" (3
   viewports x 2 languages).
3. **D-09 incomplete: the airport overview's board named the airport in English on Malay pages.** `/ms/kul` and
   `/ms/pen` showed "Kuala Lumpur International Airport" and "Penang International Airport" under "Berlepas", also
   in the board's accessible name ("Berlepas: Penang International Airport. Data demonstrasi."); the full board
   sent the English name in its server HTML on `/ms/*/flights` until hydration. `board-preview.tsx` and
   `flight-board-explorer.tsx` now pass the airport through `localizeAirport`. After: the Malay crawl (138 pages)
   finds none of the checked English names (Federal Territory, Penang, Malacca, Singapore, Kuala Lumpur
   International Airport) outside `lang="en"` (was 2 pages). Test: the `handoffs.spec.ts`
   D-09 test also checks the overview board's subtitle line on `/ms/pen`.

Corrections to the round-two logs, from these checks: the hand-offs log's statement that the `Link` header has "no
duplicate header" (item 8) was not true on any build checked here (fix 1); the performance log's flight-page `h1`
at 184 px did not survive the hand-offs round (fix 2); D-09 "done for the places listed" missed the overview board
(fix 3); "performance 95 or more on 5 of 5" holds for those five pages, but the brief's nine pages give 8 of 9.

Files changed: `next.config.ts`, `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`,
`src/components/home/board-preview.tsx`, `src/components/flights/flight-board-explorer.tsx`; tests
`e2e/platform.spec.ts`, `e2e/shell.spec.ts`, `e2e/handoffs.spec.ts` (one test added to each of the first two, one
assertion block added to the D-09 test; nothing removed or relaxed); new `docs/qa/lighthouse-round2/` and this
section.

## R4. Acceptance, all 101 P0 and P1 items

| Count | P0 (48) | P1 (53) | All (101) |
|---|---|---|---|
| Verified | 39 (was 33) | 46 (was 40) | **85** (was 73) |
| Not verified | 9 (was 14) | 7 (was 13) | **16** (was 27) |
| Regressed | 0 (was 1) | 0 | **0** (was 1) |

The 73 items verified in round one stay verified: their named e2e and unit tests pass in the final run, and the
scripted checks above were repeated for those a round-two change could touch (A-06, A-08, A-10, A-13, A-16, A-17,
A-18, A-19, A-20 first notice at 374 px, A-22, A-26, B-07, B-21, C-02, E-05, E-08, E-22). Changes and
re-checks:

| ID | P | Round one → two | Evidence (final production build) |
|---|---|---|---|
| A-01 | P0 | NV → **V** | 54 of 54 combinations (R2.5), board row 614 px; e2e A-01 tests including the board row and the new flight-page test pass on both projects (after fix 2) |
| A-09 | P0 | NV → NV | Interactions all under 200 ms in 3 of 3 runs; 0 of 6 early inputs lost; early-tap e2e pass. **TBT `/en` 204 ms and `/ms` 227 ms** (target 200) |
| A-14 | P0 | NV → NV | Provenance tags −65% (Facilities) and −40% (Transport) meet the 40%; source toggles −9% and −10% do not; Transport shows 9 type sizes (at most 8) |
| A-21 | P1 | NV → **V** | Titles and h1 use the section nouns in both languages ("Flights" / "Penerbangan", "Transport to and from KLIA", "Transit and connections at KLIA", "Terminal map", "Shops and food"); `sections.test.ts` guards all eight sections |
| B-01 | P0 | NV → **V** | Overview: Aerotrain, train and shuttle, immigration lines with "No disruption reported in our sources as of 15:06; check the signs" and demo queue estimates (T1 5 and 12 min, T2 7 and 8 min); home strip row "Services at KLIA now"; flight page C30: "Aerotrain to the C gates: Planned from 28 Nov" in the gate step and immigration line with demo queue estimates; transit step; e2e B-01 |
| B-06 | P0 | NV → **V** | Board keystrokes 40 to 80 ms and direction switch 88 to 144 ms at 4x CPU, 3 runs; row cap e2e; cache tests in `providers.test.ts` and `time.test.ts` |
| B-09 | P0 | NV → NV | Board, flight page and home search show last-known data or an error with retry (e2e, including the new failing-feed test for the home search); but the generator is still in every route's client bundle and the home previews still compute flights in the browser, against "flights are served from the server ... (which also removes the generator from client bundles)"; chaos and contract tests not run in CI; official feed OOS-01 |
| B-15 | P1 | NV → **V** | Concierge in the phone Search sheet (e2e, phone); concierge CLS 0 (Lighthouse, 3 runs); rest as round one |
| C-05 | P0 | NV → **V** | Home shop strip offers only filters KLIA can serve (no "Open now"), e2e C-05; shop and dine page as round one |
| C-06 | P1 | NV → **V** | e2e on `next start` now includes `flights`: every airport and section pair 200 or 404 on first and repeat request with a matching title; unknown airports get the site shell and "Page not found" title |
| C-08 | P1 | NV → NV | Unchanged: the route cannot end at the taxi counter, rail entrance or e-hailing pick-up (map places need MAHB data) |
| D-02 | P0 | NV → **V** | KLIA overview "Services you can book": one Fast Track card per terminal with what is not published and the booking site (e2e D-02); search, concierge, optional timeline step per terminal (`journey.test.ts`) and legacy redirects as round one. Price, hours and seller are "Not published", as the criterion allows |
| D-04 | P0 | NV → NV | Unchanged: airline assistance rules not added |
| D-05 | P0 | NV → **V** | Parking, facilities and transport carry one short line (heading, one sentence, "See the gaps at KLIA") linking to `/about-this-prototype#gaps-kul`; no block on map, shop and dine, transit, lounges or the flight page; e2e D-05 |
| D-07 | P0 | NV → NV | Unchanged: the Immigration Department's wording is missing; no traveller option |
| D-08 | P1 | NV → **V** | The transit gate step and the flight page's C-gate step read the Aerotrain notice (e2e D-08; flight page above); clock tests pass |
| D-09 | P1 | NV → **V** | After fix 3: 138 Malay pages, none with the checked English state, place or airport names outside `lang="en"`; Malay h1 and `<title>` on all airport pages (`/ms/pen` "Lapangan Terbang Antarabangsa Pulau Pinang"); e2e D-09. Native review remains OOS-14 |
| D-13 | P1 | NV → **V** | `JourneyTeaser` reads `ARRIVAL_TIME_RULE` from the server with its sources; e2e D-13 |
| D-14 | P1 | NV → NV | Grade 9.5, ease 50.5, 6 sentences over 25 words |
| E-01 | P0 | NV → NV | 8 of 9 pages at 95 or more, but TBT over 200 ms on 7 of 9, transport at 81; the CI budget step has not run and would fail |
| E-02 | P0 | NV → NV | Desktop CLS at most 0.023 on the four pages; LCP fixed on `/en/kul` and the map; but 116 sitemap pages still reveal the h1 through `$RC`, transport LCP 4.27 s, Wi-Fi profile LCP 2.55 s and 2.69 s |
| E-03 | P0 | **R → NV** | `/en` 232.6 KB (target 250, pass); zod out of all client chunks; dialogs load on first open; content and guidance pages 209 to 236 KB (target 170); generator in the shell chunk set; icon registry not tree-shaken |
| E-06 | P0 | NV → NV | Unchanged: the CI workflow and the WebKit project have not run |
| E-09 | P1 | NV → NV | Four hashes in the report-only policy; the enforced policy keeps `'unsafe-inline'` |
| E-11 | P1 | NV → NV | Content pages 44 to 62 KB gzip, flight page 93.7 KB (target 40) |
| E-12 | P1 | NV → NV | 60 requests (target 60, pass), 652 KB (600), `/en` twice (once), Cache Storage 1,580 KB (1 MB) |
| E-14 | P1 | NV → NV | Canonical and both alternates on 276 of 276 (one per response after fix 1), but `pageMetadata` is used by the home, airport overviews and sections only (152 of 276 in the HTML) |
| E-17 | P1 | NV → NV | Privacy section and switch (e2e E-17), campaign parameters on `data-handoff` links (parking, transport tickets, lounges, Fast Track); answer state declared for three tasks only (flight board, flight page, parking prices), not for transport fares, Fast Track, lounges, arrive-by time or MDAC |
| E-05, E-08 | P0 | V → V | Configured: `server.test.ts` (rotating `X-Forwarded-For` gets 429 after 10 behind a trusted proxy; a 300-request burst to `/api/flights` gets 429 after 60) passes; unconfigured: per-address buckets, site-wide ceiling at about 600 and the start-up warning, measured on a live server (R2.5) |
| E-22 | P1 | V → V | Flight-route 404 now `max-age=0, s-maxage=60` as well (R2.5) |

The 16 not verified: P0 A-09, A-14, B-09, D-04, D-07, E-01, E-02, E-03, E-06; P1 C-08, D-14, E-09, E-11, E-12, E-14,
E-17.

## R5. Open issues, ranked

"Team" = fixable by the delivery team. "MAHB" = depends on MAHB data, systems or partners.

1. **Pages still revealed by `$RC` after a fallback; transport LCP 4.3 s** (E-02, E-01; P0). Team. 116 of 276
   sitemap URLs hold the `h1` in a hidden segment (guide and help topics, corporate sub-pages, shop and dine,
   facilities, transport, parking, lounges, transit); `/en/kul/transport` scores 81 with LCP 4.27 s in 2 of 3 runs.
   Apply round two's static shell (no page-level Suspense, URL state through `use-url.ts`) to these routes.
2. **TBT over 200 ms on 7 of 9 pages** (A-09, E-01; P0). Team. Medians 201 to 291 ms; `/en` 204, `/ms` 227. With
   issue 1 and the byte budgets (548 to 597 KB on guidance pages, 41 to 45 requests on the map, overview and
   concierge), the CI Lighthouse step would fail.
3. **First-load JavaScript and the browser flight generator** (E-03, B-09; P0). Team. Content and guidance pages
   209 to 236 KB gzip (target 170); `/en/journey` 256.7 and the flight page 252.0 over 250; the generator chunk
   (17.1 KB gzip) loads on all 39 page routes because the home board preview, journey teaser, saved-flight card,
   site search and commerce gate still generate flights in the browser; icon registry. Connecting the official
   feed is MAHB (OOS-01).
4. **CI and WebKit never run** (E-06; P0). Team: run the workflow on a CI runner with WebKit installed.
5. **Service worker first visit** (E-12; P1). Team. 652 KB, `/en` downloaded twice, 1.58 MB cached.
6. **HTML weight** (E-11; P1). Team. Content pages 44 to 62 KB gzip, flight page 93.7 KB (target 40).
7. **Density** (A-14; P0). Team (design owner's call on per-section source lists). Source toggles −9% and −10%;
   Transport 9 type sizes.
8. **Canonical in the HTML on 124 more routes** (E-14; P1). Team. Guides, help, airports directory, notices,
   corporate and the rest rely on the `Link` header (correct since fix 1).
9. **Answer states for the other top tasks** (E-17; P1). Team. Transport fares, Fast Track, lounges, arrive-by,
   MDAC. Partner-confirmed bookings are MAHB and partners (OOS-13).
10. **Enforced CSP keeps `'unsafe-inline'`** (E-09; P1). Team (platform decision): per-page framework scripts
    cannot be hashed in Next.js 16.4 and nonces need per-request rendering.
11. **Home layout shift from the round-two status row and notice strip** (low; within targets). Team. Desktop
    0.018 to 0.023, `/ms` phone 0.029 (round one at most 0.002): reserve the summary line, render the notice card's
    final text on the server.
12. **Congested Wi-Fi LCP 2.55 and 2.69 s** (E-02; low). Team: first paint itself is 2.55 s on that profile, so
    fewer render-blocking bytes before first paint.
13. **Reading level** (D-14; P1). Team (content editor, both languages); Malay sign-off is MAHB (OOS-14).
14. **Low, from the round-two logs, still open**: 404 bodies render on the client (crawlers and visitors without
    JavaScript see the shell and the title but not the "Page not found" text); the Arrivals tab says landed flights
    "have already left"; phones no longer show that sentence. Team.
15. **Rate limits behind an undeclared CDN** (deployment). MAHB: set `TRUSTED_CLIENT_IP_HEADER` or
    `TRUSTED_PROXY_HOPS` on the hosting platform (the server now warns at start-up) and deploy the edge rules
    (OOS-11).
16. **Facts only MAHB or partners can supply**: airline assistance rules for AirAsia, AirAsia X, Batik Air and the
    top carriers (D-04; airlines) and the located accessibility facts (OOS-07); the Immigration Department's wording
    for departing citizens and a traveller option (D-07); taxi counter, rail entrance and e-hailing places on the
    map (C-08); Fast Track price, hours and seller (D-02, shown as not published); parking tariff and dated booking
    link (C-01); pick-up point and fee (B-17); native Malay review (OOS-14). MAHB.

## R6. How to reproduce

```bash
npx tsc --noEmit && npx eslint . && npx vitest run && npm audit --omit=dev
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off                                     # reuses the server on 3100
node tools/lh.js docs/qa/lighthouse-round2 3 en=http://localhost:3100/en ...   # session scratch tools folder
```

The crawls, interaction, early-input, layout and density scripts are the round-one and round-two scripts
(`crawl.py`, `crawl-rendered.cjs`, `search-index.cjs`, `e14.py`, `ms-crawl.py`, `inp.cjs`, `early.cjs`,
`routejs.js`, `acc-layout.cjs`, `acc-perf.cjs`, `a14-d14.cjs`, `count.cjs`), run from the session scratch folder
(not in the repository), plus `rc.py` (which sitemap pages hold the `h1` in a hidden segment) and `ratelimit.cjs`.

---

# Round three

Owner: release and verification. Date: 21 November 2026. Scope: the third fix round
(`docs/qa/fixes/round3-performance.md`) checked on a production build (`.next` deleted first, then
`NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build`, served by
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100`), every P0 and P1 item that round two left not
verified re-checked against its acceptance criterion, every item the round-three log claims checked again, and the
round-two re-checks repeated where a round-three change could touch them. Rounds one and two above are unchanged.

**Result:** types, lint, 504 unit tests, `npm audit`, the build (0 warnings), **348 end-to-end tests (0 failed)**,
the axe scans (0 violations), the link crawls (0 broken links, 0 missing anchors) and the canonical check (one per
response on 276 of 276) all pass on the final build. **No product regression needed a fix and no code or test was
changed in this round.** Every round-three claim that can be measured here holds: **0 of 276** sitemap pages hold
the `h1` in a `$RC`-revealed segment (was 116), transport LCP **1.10 s** (was 4.27 s), parking **1.11 s**, the demo
generator is in the first load of **0** routes (was 39), no route is over 250 KB of first-load JavaScript (was 2),
home CLS is **0** everywhere, and Arrivals says "already arrived". Lighthouse mobile is 95 or more on **7 of 10**
pages, LCP 2.5 s or less on **10 of 10** (round two 8 of 9) and TBT 200 ms or less on **3 of 10**; `/en` 257 ms and
`/ms` 245 ms. The acceptance count does not move: **85 verified, 16 not verified, 0 regressed** of 101, because
each remaining item still misses at least one part of its criterion (section T4). Two numbers moved the wrong way,
both in items that were already not verified (section T3).

## T1. Clean-up before the checks

- No process from this checkout was running and nothing listened on ports 3100 to 3299 (round three's servers on
  3221 to 3223 had been stopped); there was no `.next-r3*` folder, and `tsconfig.json` and `next-env.d.ts` named
  only `.next` and matched the copies the round-three engineer saved before the round. Nothing to remove.
- The default `.next` (from round two) was deleted and rebuilt from clean. The only server used, on port 3100 with
  the trusted client header, was stopped by PID at the end; its log has no warning or error. The final build is left
  in `.next` for the next team, to be served with `next start` (build ID `MtgRkGApHKutmCFmH-yix`).
- One read-only `git status` was run at the start by mistake (this round's brief says not to run git); it changed
  nothing. No other git command was run.

## T2. Results

### T2.1 Static checks, unit tests and build

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (before the build and again after it, with the new route types) |
| `npx eslint .` | 0 problems |
| `npx vitest run` | 32 files, **504 passed**, 0 failed (round two 503; round three added the section-list test) |
| `npm audit --omit=dev` / `npm audit` | 0 vulnerabilities / 0 vulnerabilities |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build` | Succeeds from clean in 37 s, **0 warnings**, 365 static pages (round two 369: the four outlet fallback shells are no longer generated, because the 16 listed outlet pages are now fully static, `○`; every other row of the route table is as in round two) |

### T2.2 End-to-end and accessibility (production build, desktop 1440x900 and phone Pixel 7 390x844, `--trace off`)

| Run | Build | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|---|
| 1 (final) | As delivered by round three | **348** | **0** | 6 | 354 tests, 6.1 min, 2 workers |

One run was enough: nothing failed, so nothing was changed. The 6 skips are round two's deliberate project-specific
ones (calendar download, two keyboard-only checks and the wide-screen tab check on the phone; the 1280x720 home check
on the phone; B-15 on desktop). C-06 ran (status codes on `next start`). The round-three log's one spec change (B-09
in `e2e/handoffs.spec.ts`) was read: the test still blocks every feed request, still requires the search's own
notice with "We could not load flight information." and a working "Try again", and now also requires the board
preview's notice (two in all). It is narrower in where it looks, not weaker in what it asserts.

**Axe: 0 violations.** 50 scan call sites in 11 specs, all with the shared tag list (wcag2a, wcag2aa, wcag21a,
wcag21aa, wcag22aa), on both projects. Lighthouse accessibility is 100 on all 42 runs of this round (30 main, 6 on
the Wi-Fi profile, 6 diagnostic). Reflow at 320 px with 112% and 125% text in three themes on 18 pages: 108 loads,
0 sideways scroll.

### T2.3 Links (same scripts as round two; fresh client address per request)

| Crawl | Result (final build) |
|---|---|
| Static HTML from the 276 sitemap URLs | **438 pages, 1,154 unique links, 0 broken, 0 missing anchors, 0 links through redirects** (identical to round two) |
| Rendered in Chromium after hydration (sitemap plus the 9 client-heavy pages) | **285 pages, 1,516 unique links, 1,028 targets, 206 fragment links, 0 broken, 0 missing anchors, 0 redirected**; repeat run 1,503 links, 1,015 targets, the same zeros |
| Search index, `/en` and `/ms` | **434 documents, 308 pages, 170 anchors, 0 broken, 0 missing** |
| Canonical and hreflang on every sitemap URL | 276 of 276 name themselves canonical with `en` and `ms` alternates; **exactly one canonical per response on 276 of 276** (one `Link` header with one canonical; where the `<head>` also has one, on 152, it is the same URL; no preload entries in `Link`). Same on four flight pages and a 404, and again 40 minutes later, after many regeneration windows |

The rendered totals differ from round two (1,559 links, 1,071 targets) and between the two runs. The part that
varies is most likely the flight-page links: the crawl fixes the browser clock at 18 November 09:40, and the home
previews, teaser and search now take their rows from the server feed (at the server's time) instead of generating
them in the browser at that clock. In the second run, whose list was saved, 306 targets are flight pages and 709
are other pages; round two's lists were not kept, so the split cannot be compared directly.

### T2.4 Lighthouse mobile (3 runs, median; `tools/lh.js`, Lighthouse 13.6, Moto G Power, simulated slow 4G, 4x CPU)

Before = round two (`docs/qa/lighthouse-round2/`); for parking, which round two did not measure, before = the
round-three engineer's run on the unchanged round-two build (`round3-performance.md`, item 1). After = this round's
final build. Raw summaries: `docs/qa/lighthouse-round3/`. KB = 1,024 bytes, as in round two's table (the round-three
log divides by 1,000, so its `/en` "622 KB" is 607 here). Shared 4-vCPU container with nothing else running.

| Page | Performance before → after (runs) | LCP before → after | TBT before → after (runs) | CLS before → after | KB before → after | Requests |
|---|---|---|---|---|---|---|
| `/en` | 97 → **95** (95/95/96) | 1.08 → 1.11 s | 204 → **257 ms** (257/265/230) | 0.003 → **0** | 576 → 607 | 40 → 42 |
| `/ms` | 96 → **95** (94/95/98) | 1.09 → 1.10 s | 227 → **245 ms** (288/245/146) | 0.025 → **0** | 578 → 609 | 40 → 42 |
| `/en/kul` | 96 → **92** (92/92/93) | 1.07 → 1.08 s | 233 → **353 ms** (353/356/312) | 0.003 → 0 | 626 → 634 | 45 → 47 |
| `/en/kul/flights` | 95 → **93** (93/93/97) | 0.92 → 0.92 s | 257 → 304 ms (304/333/198) | 0.003 → 0.003 | 571 → 584 | 39 → 42 |
| `/en/kul/map` | 97 → **97** (92/98/97) | 1.07 → 1.07 s | 201 → 207 ms (344/142/207) | 0.003 → 0 | 606 → 604 | 41 → 41 |
| `/en/kul/transport` | 81 → **93** (89/95/93) | **4.27 → 1.10 s** (1.10/1.11/1.09) | 291 → 301 ms (434/266/301) | 0.003 → 0.003 | 597 → 607 | 40 → 42 |
| `/en/kul/parking` | 79 → **95** (95/98/94) | **4.13 → 1.11 s** (1.11/1.07/1.13) | 355 → 255 ms (255/140/293) | 0 → 0 | 602 → 602 | 44 → 44 |
| `/en/guides` | 97 → **99** (96/99/99) | 1.07 → 1.06 s | 192 → **103 ms** (217/103/95) | 0 → 0 | 548 → 543 | 38 → 38 |
| `/en/concierge` | 95 → **97** (97/99/96) | 0.92 → 0.92 s | 268 → **186 ms** (186/140/220) | 0 → 0 | 690 → 696 | 45 → 45 |
| `/en/journey` | 98 → **98** (96/98/98) | 0.92 → 0.92 s | 171 → **179 ms** (212/154/179) | 0 → 0 | 527 → 521 | 36 → 36 |

Against the brief: performance 95 or more on **7 of 10** medians (not `/en/kul` 92, the board 93, transport 93;
round two 8 of 9); LCP 2.5 s or less on **10 of 10** (round two 8 of 9: transport is fixed); CLS 0.1 or less on 10
of 10 (largest 0.003); TBT 200 ms or less on **3 of 10** (guides 103, journey 179, concierge 186; round two 2 of 9),
INP's lab proxy still over target on `/en` (257), `/ms` (245), the overview (353), the board (304), transport (301),
parking (255) and the map (207). Budgets: first-load JavaScript for `/en` 228.7 KB gzip against 250 (pass);
guidance pages 543 to 607 KB against 500 (fail on all four measured) and 38 to 44 requests against 40 (fail on
transport, parking and the map). The CI Lighthouse step (`lighthouserc.json`) would still fail: TBT on `/en`, `/ms`,
the board and parking, performance on the board, bytes and requests on parking.

**How much of the drop on `/en/kul`, the board and `/en` is real.** None of the three pages lost anything in its
first paint or layout (LCP, CLS, requests and bytes within a few percent); the difference is TBT, which this
container moves by ±60 to 100 ms between sessions. Evidence: (1) the round-three engineer measured the *unchanged
round-two build* at `/en/kul` 92 with TBT 351 ms (386/338/351), against round two's 96 and 233 ms on that same build;
(2) a second set of 3 runs here, with diagnostics (`docs/qa/lighthouse-round3/diagnostics/`), gave `/en/kul` **94**
(TBT 279/250/346) and `/en` 222/643/345 ms (the 643 run includes a 436 ms task from Lighthouse's own evaluation
script); Lighthouse's CPU benchmark index varied from 2,234 to 2,861 across those runs. The long tasks are the ones
round three named: the HTML document (150 to 190 ms at 4x), React DOM's chunk (`01t2i9pe5vz2-`, tasks of 113 to 220
ms) and the Next.js runtime chunk (147 to 228 ms); none is attributable to the new feed request. Pooled over the six
runs, `/en/kul` TBT has a median of 329 ms and `/en` of 261 ms: above 200 either way, so A-09 and E-01 are not met
regardless of the noise.

Congested airport Wi-Fi profile (E-02; `lhx.js --profile=airport-wifi,250,1500,500,4`, 3 runs, summaries in
`docs/qa/lighthouse-round3/airport-wifi/`): `/en` LCP **2.57 s** (2.57/2.61/2.57; round two 2.55), performance 79,
TBT 558 ms; board LCP **2.68 s** (2.69/2.65/2.68; round two 2.69), performance 79. LCP equals first paint on both:
not met (target 2.5 s).

### T2.5 First-load JavaScript and `$RC` reveals

First-load JavaScript, gzip KB (build manifests, `routejs.js`; 39 page routes; framework 128.7 in every row). The
numbers are **identical to the round-three log's final build** on every route.

| Route | Round two | Round three |
|---|---|---|
| `/en/journey` | **256.7** | **243.6** |
| flight page | **252.0** | **246.7** |
| `/en` | 232.6 | 228.7 |
| `/en/kul` | 233.4 | 229.4 |
| board / map | 235.9 / 236.6 | 228.7 / 227.4 |
| parking / transport | 229.4 / 225.4 | 222.2 / 216.2 |
| concierge | 223.3 | 216.1 |
| guides hub / guide topic | 213.1 / 213.0 | 202.4 / 203.8 |
| corporate news story | 211.5 | 202.3 |
| over 250 KB, of 39 | **2** | **0** |
| content and guidance pages (target 170) | 209 to 236 | **198.6 to 227.4** |

- The demo generator (searched for its `"Boeing 737-800"` airline-table entry) is in one client chunk of 8.8 KB gzip
  that is in the first load of **0** routes. It is loaded only by the concierge: on idle once the chat is shown,
  for answers built on the device (before consent, nothing is sent to the server). zod is in 0 client chunks. The
  icon registry chunk (22.8 KB gzip) is still in the first load of all 39 routes.
- **`h1` in a hidden segment revealed by `$RC`: 0 of 276 sitemap pages** (round two 116; `rc.py`). On 276 of 276 the
  `h1` comes before the first hidden segment (transport: `<h1>` at byte 21,424, first hidden segment at 154,075).
  Reveals left: 1,264 in all, 3 on 110 pages (language switch, menu) and 4 to 10 on airport pages (also the compact
  airport header, its terminal chooser and section links, phone and desktop copies), all after the main content.
  The round-three log's "every page still has 3" is true of non-airport pages only. Flight pages, which are rendered
  per request, still stream their `h1` in a hidden segment; E-02 allows that on dynamic segments.

### T2.6 Other production measurements (Playwright, Pixel 7 unless stated)

| Measure | Round two | Round three (final build) |
|---|---|---|
| Interaction latency at 4x CPU, worst per run (`inp.cjs`, 3 runs) | Board typing 40/80/40; board direction 88/128/144; home journey mode 152/104/104; home switcher 136/144/160; `/en/kul` switcher 168/192/128 ms | Board typing **88/64/48**; board direction **160/112/120**; home journey mode **104/120/104**; home switcher **128/120/128** (6 more runs: 120 to 168); `/en/kul` switcher **160/224/160** (6 more runs: 104/136/136/152/144/**224**). 2 of 9 `/en/kul` switcher runs at 224 ms, the pointer-down that opens the dialog; every other interaction under 200 ms |
| Input before hydration (scripts delayed 2.5 s, 4x CPU, 6 loads per case) | 0 of 6 lost in every case | **0 of 6 lost** in every case (`/en/kul` typing and Menu tap, board typing and Menu tap); every input landed before hydration, 137 to 340 ms after DOMContentLoaded |
| Home CLS (A-10; with and without Fraunces, 3 loads each, phone and desktop, en and ms) | `/en` 0.003 and `/ms` 0.029 (phone); `/en` 0.018, `/ms` 0.015 to 0.023 (desktop) | **0 in all 24 loads**; `shift.cjs` 0 in all 36 loads (390x844, 412x839, 1440x900, en and ms, normal and at 4x CPU with a slow network); Lighthouse CLS 0 in all 6 home runs |
| Saved flight on the home (A-08; card now fed by the server feed) | CLS 0, card 273 to 477 px (en) and 313 to 585 px (ms) | **CLS 0** in en and ms, phone and desktop, also at 4x CPU; card 273 to 477 px (en) and 313 to 585 px (ms) at 390x844, 400 to 546 px on desktop, with status, terminal, gate, arrive-by and next step; the placeholder holds the card's height while the feed answers |
| My journey with a saved flight (B-07) | 0.036 mobile, 0.007 desktop | 0.036 mobile, 0.007 desktop (0.034 and 0.006 at 4x CPU) |
| Desktop CLS (E-02, 2 loads each) | `/en` 0.018, `/ms` 0.023, `/en/kul` 0.011, concierge 0 | `/en` **0**, `/ms` **0**, `/en/kul` 0.011, concierge 0 |
| Fonts on the home page | 122 KB | 122 KB (Hanken Grotesk 34.7, Fraunces 67.3, Geist Mono 23.1) |
| Flight feed requests | Home search only | Home: **1** batched request (`/en/flights/feed?…&airports=kul,pen,bki,kch,lgk,szb`, 16 KB), the same in Malay; `/en/kul`: 1 (9 KB); phone and desktop alike. After a service-worker install and an offline reload the home preview still shows its 16 rows |
| A-01 positions (9 sub-pages including the flight page x 3 viewports x 2 languages) | 54 of 54, h1 at most 184 px | **54 of 54**: compact bar at most 56 px, h1 at most **184 px**; 18 of 18 headings clear of the bar at 125% text; full banner on the overview only |
| Other placement checks (`acc-layout.cjs`: A-13, A-16, A-17, A-18, A-20, A-26, B-21, C-02, D-05) | Round two's run of the same script | **Identical values** on every block (for example the first notice at 374 px on `/en/kul`, the touts warning at 570 px in English and 654 px in Malay, 9 section tabs unclipped at 1280 to 1920 px) |
| B-01 status lines | Overview, home strip row, flight page | Overview: three "No disruption reported in our sources" lines and demo queue estimates (security / immigration T1 13 and 18 min, T2 16 and 20 min), the same in Malay; home "Services at KLIA now"; flight page: status line and queue estimates (security 13, immigration 18 min) |
| Arrivals set-aside sentence (two arrivals marked completed in the feed answer, 1440x900) | "have already left" | "2 flights have already arrived. Use Earlier to see them." / "2 penerbangan telah tiba. Gunakan Lebih awal untuk melihatnya."; Departures: "1 flight has already left." |
| HTML, gzip | `/en` 60.0, `/ms` 61.5, `/en/kul` 56.4, board 37.5, journey 37.2, concierge 37.2; section pages 48.7 to 62.3; guides 43.7 to 54.4; flight page 93.7 KB | `/en` 60.1, `/ms` 61.6, `/en/kul` 56.4, board 37.5, journey 37.1, concierge 37.2, airports 37.6; section pages 48.2 to 61.5; guides 43.8 to 54.7; help 54.9; notices 40.8; privacy 44.5; corporate 45.7; **flight page 93.8** |
| Service worker, first visit to `/en` (E-12) | 60 requests, 652 KB, `/en` twice, Cache Storage 1,580 KB (24 entries) | **62** requests, **685 KB**, `/en` twice (the page's 63 KB download and the worker's 2 KB revalidation), Cache Storage 1,571 KB (24 entries). The home's feed answer (18 KB) is one of the new requests; the round-three log attributes the rest of the increase to the `/journey` chunks the home no longer shares |
| RSC prefetches per mobile load, 15 pages | 2 to 4; desktop board 2 (26 KB), home 2 (39 KB) | Identical |
| 404s (12 paths, first and repeat request: unknown guide, help topic, news story, outlet, airport, airport and section pairs) | — | **404** both times with the site shell and "Page not found" / "Halaman tidak ditemui" as the title; `s-maxage=60`; flight-route 404 `max-age=0, s-maxage=60`. The `<main>` of the server HTML is empty: the "Page not found" text is rendered in the browser (round two's issue 14, still open) |
| Density at 390 px (A-14, `a14-d14.cjs`) and reading level (D-14) | Facilities 8 tags, 21 toggles, 8 type sizes; Transport 6, 9, 9 type sizes; grade 9.5, ease 50.5 | Identical to round two's run of the same script |
| Malay pages (D-03, D-09, A-24; 138 pages) | 0, 0, 1 | D-03 0; airport titles and h1 Malay on all; D-09: one match, "Rapid Penang" on `/ms/pen/transport`, which is the bus operator's name (also used in Malay), not a place name; A-24 1 (`/ms/kul`, a link whose text is its address), as in round two |
| CSP | Report-only with 4 hashes; enforced `'unsafe-inline'` | Unchanged |

## T3. Regressions and defects

No product regression was found that needed a fix, so no product code, test or configuration was changed in this
round. What moved the wrong way, both in items that were already not verified:

1. **Service-worker first visit: 62 requests and 685 KB** (round two 60 and 652 KB; E-12 targets 60 and 600 KB). The
   home now fetches its board preview from the server feed (one 18 KB request) and, by the round-three log's account
   ("home bytes +32 KB"), loads `/journey` chunks it no longer shares. This is the intended cost of taking the generator
   out of the browser (B-09, E-03); a preview-sized feed answer would recover most of it (T5, issue 5).
2. **`/en/kul` airport switcher: 2 of 9 runs at 224 ms at 4x CPU** (round two at most 192 in 3 runs). The other 7
   runs are 104 to 160 ms and the home switcher stays at 120 to 168 ms. Borderline, not reproducible on demand.

Not regressions: the lower Lighthouse medians on `/en/kul`, the board and `/en` (T2.4: TBT only, within the
container's session-to-session spread, and the same build measured 92 at `/en/kul` in round three's own before
runs); the lower rendered-crawl link totals (T2.3: most likely the flight-page links, all of which answer 200).

Corrections to the round-three log: transport's median here is 93 (89/95/93), not 95, though its LCP fix holds
(1.10 s in 3 of 3 runs); "every page still has 3 small `$RC` reveals" holds for non-airport pages only (airport
pages have 4 to 10, T2.5). Every other number in the log that was re-measured here matched (first-load JavaScript
to the 0.1 KB, the 0 of 276 scan, the 404s, home CLS, the single batched feed request, the Arrivals sentence).

Files changed in this round: this section of `docs/qa/verification.md` and the new `docs/qa/lighthouse-round3/`
(ten page summaries, `airport-wifi/`, `diagnostics/`). No product or test file was changed.

## T4. Acceptance, all 101 P0 and P1 items

| Count | P0 (48) | P1 (53) | All (101) |
|---|---|---|---|
| Verified | 39 (round two 39) | 46 (46) | **85** (85) |
| Not verified | 9 (9) | 7 (7) | **16** (16) |
| Regressed | 0 | 0 | **0** |

The 85 items verified in round two stay verified: their named e2e and unit tests pass in the final run, and the
scripted checks were repeated for those a round-three change could touch (A-01, A-04 and A-27 by e2e, A-08, A-10,
A-13, A-16, A-17, A-18, A-19, A-20, A-26, B-01, B-07, B-21, C-02, C-06 by e2e, D-05, D-09, D-13 by e2e, E-22). Every
item round two left not verified, re-checked against its criterion:

| ID | P | Round two → three | Evidence (final production build) |
|---|---|---|---|
| A-09 | P0 | NV → NV | No flight pool built in the browser (the home reads the feed); 0 of 6 early inputs lost in each case; mode switch 104 to 120 ms, home switcher 120 to 168 ms, board direction 112 to 160 ms; but **TBT `/en` 257 ms and `/ms` 245 ms** (target 200, median of 3) and 2 of 9 `/en/kul` switcher runs at 224 ms |
| A-14 | P0 | NV → NV | Unchanged: provenance tags −65% and −40% meet the 40%; source toggles do not; Transport 9 type sizes (at most 8) |
| B-09 | P0 | NV → NV | Now met: the home previews, teaser, saved-flight card, gate panel, site search, board and flight page all take flights from the server feed; the generator is in no route's first load; board, flight page and home search show last-known data or an error with retry (e2e). Not met: the concierge still generates flights in the browser for its on-device answers (a lazy 8.8 KB chunk), and the chaos and contract tests (`providers.test.ts`) have not run in CI (E-06). Official feed OOS-01 |
| D-04 | P0 | NV → NV | Unchanged: airline assistance rules not added (airline data) |
| D-07 | P0 | NV → NV | Unchanged: the Immigration Department's wording for departing citizens is missing |
| E-01 | P0 | NV → NV | 7 of 10 pages at 95 or more (overview 92, board 93, transport 93); TBT over 200 ms on 7 of 10; guidance pages over 500 KB; the CI budget step has not run and would fail |
| E-02 | P0 | NV → NV | Now met: the `h1` and lead in the first flush on 276 of 276 static pages (0 revealed by `$RC`, was 116); desktop CLS at most 0.011 on the four pages; Lighthouse LCP 0.92 to 1.11 s on all ten pages (transport 1.10, parking 1.11). Not met: congested Wi-Fi LCP **2.57 s** on `/en` and **2.68 s** on the board (target 2.5 s; first paint is the LCP) |
| E-03 | P0 | NV → NV | `/en` 228.7 KB (pass); 0 routes over 250 (was 2); zod and the generator out of the shell; dialogs on first open; but content and guidance pages **198.6 to 227.4 KB** (target 170) and the icon registry (22.8 KB) on all 39 routes |
| E-06 | P0 | NV → NV | Unchanged: the CI workflow and the WebKit project have not run |
| C-08 | P1 | NV → NV | Unchanged: the route cannot end at the taxi counter, rail entrance or e-hailing pick-up (MAHB places) |
| D-14 | P1 | NV → NV | Grade 9.5, ease 50.5, 6 sentences over 25 words |
| E-09 | P1 | NV → NV | Unchanged: four hashes report-only; enforced policy keeps `'unsafe-inline'` |
| E-11 | P1 | NV → NV | Content pages 40.8 (notices) to 61.5 KB (transit) gzip, flight page 93.8 KB (target 40) |
| E-12 | P1 | NV → NV | 62 requests (target 60; was 60), 685 KB (600), `/en` twice (once), Cache Storage 1,571 KB (1 MB) |
| E-14 | P1 | NV → NV | One self-canonical with both alternates on 276 of 276 responses, but `pageMetadata` (canonical in the HTML) on 152 of 276 |
| E-17 | P1 | NV → NV | Unchanged: answer state declared for the board, flight page and parking prices only |

The 16 not verified: P0 A-09, A-14, B-09, D-04, D-07, E-01, E-02, E-03, E-06; P1 C-08, D-14, E-09, E-11, E-12, E-14,
E-17. Of these, B-09 and E-02 are now each one part short (the concierge's on-device flights and CI; the congested
Wi-Fi first paint).

## T5. Open issues, ranked

"Team" = fixable by the delivery team. "MAHB" = depends on MAHB data, systems or partners.

1. **TBT over 200 ms on 7 of 10 pages; performance under 95 on the overview, board and transport** (A-09, E-01; P0).
   Team. Medians 207 to 353 ms (`/en` 257, `/ms` 245); the long tasks are the 300 KB HTML document (150 to 190 ms at
   4x), React hydration and the Next.js runtime. Candidates as before: fewer hydrated Client Components on the first
   screens, the icon registry, smaller documents (issue 6).
2. **First-load JavaScript on content and guidance pages** (E-03; P0). Team. 198.6 to 227.4 KB gzip against 170;
   128.7 KB of every route is the framework, so the target needs the icon registry (22.8 KB on all 39 routes) and the
   shell's client islands cut, or the target revisited with the design owner.
3. **CI and WebKit never run** (E-06; P0). Team: run the workflow on a CI runner with WebKit. It also closes the last
   part of B-09 that is not code (the chaos and contract tests running in CI).
4. **Congested Wi-Fi LCP 2.57 and 2.68 s** (E-02; P0; the last part of E-02). Team: first paint is the LCP on that
   profile, so fewer render-blocking bytes before it (20 KB of CSS, two preloaded fonts, 38 to 60 KB of HTML).
5. **Byte and request budgets** (E-01, E-12). Team. Guidance pages 543 to 607 KB and up to 44 requests; the home is
   31 KB heavier than in round two (the feed answer and, per the round-three log, `/journey` chunks) and the first visit
   with the service worker is 62 requests and 685 KB. A preview-sized feed answer (8 rows, not whole days for six
   airports, about 200 KB of JSON) and fewer precached pages would cover most of it. The CI Lighthouse step would fail as configured.
6. **HTML weight** (E-11; P1). Team. Content pages 41 to 62 KB gzip, flight page 93.8 KB (target 40).
7. **The concierge's on-device flights** (B-09; P0). Team: answer flight questions from the feed (a GET that carries
   no question, so no consent issue), which also drops the last client chunk with the generator. Connecting the
   official feed is MAHB (OOS-01).
8. **Density** (A-14; P0). Team (design owner's call on per-section source lists). Source toggles −9% and −10%;
   Transport 9 type sizes.
9. **Canonical in the HTML on 124 more routes** (E-14; P1). Team. The `Link` header is correct on every route.
10. **Answer states for the other top tasks** (E-17; P1). Team. Partner-confirmed bookings are MAHB (OOS-13).
11. **Enforced CSP keeps `'unsafe-inline'`** (E-09; P1). Team (platform decision; nonces need per-request rendering).
12. **Reading level** (D-14; P1). Team (content editor, both languages); Malay sign-off is MAHB (OOS-14).
13. **Low**: 404 bodies render in the browser (the server HTML has the shell and the "Page not found" title but an
    empty `<main>`); the `/en/kul` switcher at 224 ms in 2 of 9 throttled runs; a 404 response names itself as
    canonical in its `Link` header; on phones the home status row is now two lines in English too and the board's
    set-aside sentence is left to screen readers (both deliberate). Team.
14. **Rate limits behind an undeclared CDN** (deployment). MAHB: set `TRUSTED_CLIENT_IP_HEADER` or
    `TRUSTED_PROXY_HOPS` on the hosting platform (the server warns at start-up when neither is set) and deploy the
    edge rules (OOS-11).
15. **Facts only MAHB or partners can supply**: airline assistance rules (D-04; airlines) and located accessibility
    facts (OOS-07); the Immigration Department's wording for departing citizens (D-07); taxi counter, rail entrance and
    e-hailing places on the map (C-08); Fast Track price, hours and seller (D-02, shown as not published); parking
    tariff and dated booking link (C-01); pick-up point and fee (B-17); native Malay review (OOS-14). MAHB.

## T6. How to reproduce

```bash
npx tsc --noEmit && npx eslint . && npx vitest run && npm audit --omit=dev
rm -rf .next && NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off                                     # reuses the server on 3100
node tools/lh.js docs/qa/lighthouse-round3 3 en=http://localhost:3100/en ...   # session scratch tools folder
```

The crawls and checks are round two's scripts (`crawl.py`, `crawl-rendered.cjs`, `search-index.cjs`, `ms-crawl.py`,
`htmlsize.py`, `inp.cjs`, `early.cjs`, `acc-layout.cjs`, `acc-perf.cjs`, `a14-d14.cjs`, `lhx.js`) and round three's
(`rc.py`, `segs.py`, `routejs.js`, `shift.cjs`), plus `e14b.py` (canonical count per response), `a08.cjs` (saved
flight on the home, phone and desktop), `b01.cjs`, `arrivals.cjs`, `feedreq.cjs` and `offline.cjs`, run from the
session scratch folder (not in the repository).

---

# Round four

Owner: release and verification. Date: 21 November 2026 (measurements 21:45 to 23:45 Kuala Lumpur time). Scope:
the three round-four packages (`docs/qa/fixes/round4-trust.md`, `round4-ask.md`, `round4-layout.md`), checked on a
production build (`.next` deleted, then `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build`, served by
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100`); every claim in the three logs, each of the
re-review's items 6.1.1 to 6.1.10 (`docs/qa/panel/re-review.md`) and the four gallery defects
(`docs/prototype/README.md`, "Observations made while capturing", notes 1 to 4) checked against that build; the
round-three re-checks repeated where a round-four change could touch them; the measurement scripts moved into the
repository (`scripts/qa/`); and the CI workflow's jobs run locally as far as this container allows. Rounds one to
three above are unchanged.

**Result.** Types, lint, **554 unit tests** (7 of 7 runs), `npm audit` (0 and 0), the build (0 warnings, 365 static
pages), **434 end-to-end tests: 428 passed, 0 failed, 6 skipped** on the final build (the same 6 skips as round
three), the axe scans (**0 violations**, 59 call sites in 12 specs), the link crawls (**0 broken links, 0 missing
anchors**, 0 redirects), one canonical per response on 276 of 276, and **0 of 276** pages with the `h1` revealed by
`$RC`. The first run on the delivered build had **2 failures** (one new test, both projects): a test that read a
car-park card before React revealed the streamed copy; fixed in the test, which now asserts more, not less. Two
cross-package inconsistencies were fixed (the concierge still said "No disruption … reported" and Malay privacy and
offline copy still said "concierge"), and the CI step that runs Lighthouse budgets was broken by its configuration
(`Cannot use assertMatrix with other options`) and is fixed. Two board tests failed in CI-mode runs at night (the
board's window has no demonstration departures from about 22:55 to 05:05) and now pin the clock, as the flight specs
do. **Acceptance of re-review 6.1 items 1 to 10: 9 verified, 1 partly (6.1.7 density), 0 not verified, 0 regressed;
gallery notes 1 to 4 verified.** The backlog count does not move: **85 verified, 16 not verified, 0 regressed** of 101 (F5).
Lighthouse: performance 95 or more on **7 of 10** pages, LCP 2.5 s or less on 10 of 10, TBT 200 ms or less on 3 of
10, as in round three; transport (93 → 96) and parking (95 → 97) improved, and the concierge fell (97 → 93, TBT 186 →
311 ms; a second set gave 95 and 262 ms).

## F1. Clean-up before the checks

- Nothing from this checkout was running and nothing listened on ports 3231 to 3233 (or 3100): the three
  round-four dev servers had been stopped by their engineers. There was no `.next-r4*` folder, and `tsconfig.json` and
  `next-env.d.ts` named only `.next` and were identical to the copies saved before round three. Nothing to remove.
- `.next` (round three's build, `MtgRkGApHKutmCFmH-yix`) was deleted and rebuilt from clean twice: once as
  delivered, and once after this round's changes (F3). The final build, `ygqxXIFcmSWq51rkxYSGE`, is left in `.next`.
- Every server was stopped by its PID. The CI-style build (`.next-ci`), its two lines in `tsconfig.json` and
  `next-env.d.ts`, the Lighthouse CI reports (`.lighthouseci`, moved to the session scratch folder; a summary is in
  `docs/qa/lighthouse-round4/ci-budgets/`), `playwright-report/` and the metric file the servers wrote (`.data/`,
  git-ignored) were removed at the end; `tsconfig.json` and `next-env.d.ts` match round three's copies again.
- One read-only `git status --porcelain` was run by mistake (inside a command that listed files); it changed
  nothing. No other git command was run.

## F2. Results

### F2.1 Static checks, unit tests and build

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (before and after each build, and after this round's changes) |
| `npx eslint .` | 0 problems (includes the new `scripts/qa/`) |
| `npx vitest run` | 36 files, **554 passed**, 0 failed, in **7 of 7** runs (round three 504). The intermittent failure two engineers saw (one in four runs) did not occur here |
| `npm audit --omit=dev` / `npm audit` | 0 vulnerabilities / 0 vulnerabilities |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build` | Succeeds from clean in 41 to 42 s, **0 warnings**, 365 static pages; the route table is identical to round three's |

### F2.2 End-to-end and accessibility (production build, desktop 1440x900 and phone Pixel 7 390x844, `--trace off`)

| Run | Build | Tests | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|---|---|
| 1 | As delivered by round four | 434 | 426 | **2** | 6 | `ask-round4.spec.ts` "the parking page, the concierge and the help FAQ say the same …", desktop and phone (F3, item 1) |
| 2 | Final build, after F3 items 1 to 3 | 434 | **428** | **0** | 6 | 7.3 min, 2 workers, 22:33 to 22:40 |
| 3 | CI mode (`CI=true`, retries 1), CI-style build | 434 | 426 | **2** | 6 | About 23:00 to 23:08: two board tests on the phone, failed and failed on retry (F3, item 4) |
| 4 | CI mode, after F3 item 4 | 434 | **428** | **0** | 6 | 23:08 to 23:15, inside the window that failed in run 3; 0 flaky |
| 5 (final) | Final build, final tests | 434 | **428** | **0** | 6 | 23:36 to 23:43 |

The 6 skips are round two's project-specific ones, as in round three. 80 tests are new in round four
(`trust.spec.ts` 15, `ask-round4.spec.ts` 9 and `layout-round4.spec.ts` 16, on both projects). The spec changes the
round-four logs declare were read: each changes an expectation to the new intended behaviour (status `unknown`
instead of `clear`, `past` instead of `done`, the Malay `h1`, "Tanya Kami", the Terminal 1 parking note, the map's
two regions, the offline toast that must agree with the status card) and none removes an assertion.

**Axe: 0 violations.** 59 scan call sites in 12 specs (round three 50 in 11), all with the shared tag list (wcag2a,
wcag2aa, wcag21a, wcag21aa, wcag22aa), on both projects. Lighthouse accessibility is **100 on all 39 runs** of this
round. Reflow at 320 px with 112% and 125% text in three themes on 18 pages: 108 loads, 0 sideways scroll.

### F2.3 Links (`scripts/qa/`; a fresh client address per request)

| Crawl | Result (final build) |
|---|---|
| Static HTML, 276 sitemap URLs (`crawl-static.py`) | **438 pages, 1,170 unique links, 0 broken, 0 missing anchors, 0 links through redirects** (round three 1,154 links: the new contacts anchors and section links) |
| Rendered in Chromium after hydration (`crawl-rendered.mjs`, round three's settings: clock 18 November 09:40, MH 2626 saved) | **285 pages, 1,535 unique links, 1,027 targets, 226 fragment links, 0 broken, 0 missing anchors, 0 redirected** (round three 1,516, 1,028, 206). With the real clock (21 November, 22:00): 1,312 links, 804 targets, 226 fragments, the same zeros |
| Search index, `/en` and `/ms` (`search-index.mjs`) | **446 documents** (434; the three honest "not published" results and the parking pages, in both languages), 308 pages, 172 anchors, **0 broken, 0 missing** |
| Canonical and hreflang (`canonical.py`) | 276 of 276 name themselves canonical with `en` and `ms` alternates; **exactly one canonical per response on 276 of 276** (one `Link` header; where the `<head>` also has one, on 152, it is the same URL); flight pages and 404s one each |

### F2.4 Lighthouse mobile (3 runs, median; `scripts/qa/lighthouse.mjs`, Lighthouse 13.6, Moto G Power, simulated slow 4G, 4x CPU)

Before = round three (`docs/qa/lighthouse-round3/`); after = this round, on the build as delivered (the final build
differs only in two concierge sentences and ten Malay strings; its first-load JavaScript is the same to 0.1 KB).
Raw summaries: `docs/qa/lighthouse-round4/`. KB = 1,024 bytes. Shared 4-vCPU container, nothing else running;
Lighthouse's CPU benchmark index ranged from 1,499 to 2,715 across this round's runs.

| Page | Performance before → after (runs) | LCP before → after | TBT before → after (runs) | CLS | KB before → after | Requests |
|---|---|---|---|---|---|---|
| `/en` | 95 → **94** (90/94/96) | 1.11 → 1.11 s | 257 → **295 ms** (398/295/233) | 0 → 0 | 607 → 628 | 42 → 43 |
| `/ms` | 95 → **95** (89/95/96) | 1.10 → 1.08 s | 245 → **268 ms** (462/268/242) | 0 → 0 | 609 → 630 | 42 → 43 |
| `/en/kul` | 92 → **94** (95/94/87) | 1.08 → 1.09 s | 353 → **281 ms** (263/281/503) | 0 → 0 | 634 → 650 | 47 → 48 |
| `/en/kul/flights` | 93 → **95** (97/95/93) | 0.92 → 0.91 s | 304 → 263 ms (207/263/303) | 0.003 → 0.003 | 584 → 592 | 42 → 42 |
| `/en/kul/map` | 97 → **97** (95/98/97) | 1.07 → 1.08 s | 207 → 205 ms (240/162/205) | 0 → 0.003 | 604 → 609 | 41 → 41 |
| `/en/kul/transport` | 93 → **96** (96/96/96) | 1.10 → 1.07 s | 301 → **219 ms** (219/245/218) | 0.003 → 0.003 | 607 → 600 | 42 → **40** |
| `/en/kul/parking` | 95 → **97** (93/97/98) | 1.11 → 1.12 s | 255 → **188 ms** (304/188/144) | 0 → 0.003 | 602 → 608 | 44 → 44 |
| `/en/guides` | 99 → **98** (95/98/99) | 1.06 → 1.07 s | 103 → 175 ms (254/175/119) | 0 → 0 | 543 → 548 | 38 → 38 |
| `/en/concierge` | 97 → **93** (93/91/95) | 0.92 → 0.92 s | 186 → **311 ms** (311/375/264) | 0 → 0 | 696 → 705 | 45 → 45 |
| `/en/journey` | 98 → **98** (97/98/99) | 0.92 → 0.92 s | 179 → 179 ms (182/179/135) | 0 → 0 | 521 → 526 | 36 → 36 |

Against the brief: performance 95 or more on **7 of 10** medians (not `/en` 94, `/en/kul` 94, concierge 93; round
three 7 of 10, a different three); LCP 2.5 s or less on **10 of 10**; CLS 0.1 or less on 10 of 10 (largest 0.003);
TBT 200 ms or less on **3 of 10** (parking 188, guides 175, journey 179). Budgets: every guidance page measured is
over 500 KB (548 to 609); requests at most 40 now pass on transport (40) and fail on the map (41) and parking (44).

A second set with diagnostics on the final build (`docs/qa/lighthouse-round4/diagnostics/`): concierge **95** (TBT
207/262/353), `/en` **96** (224/231/334), `/en/kul` **93** (325/229/309). Pooled over the six runs, `/en` TBT has a
median of 264 ms (round three 261) and `/en/kul` 295 ms (round three 329): no change beyond the container's spread.
The concierge's six runs (207 to 375, median 287 ms) are all above round three's median (186) and five of the six
above its highest run (its three were 140 to 220), so its rise is probably real, by roughly 80 to 100 ms; its
first-load JavaScript grew 1.0 KB and its longest tasks are React DOM's chunk (201 ms) and the HTML document (139 ms). It is recorded as a wrong-way number (F3) and in open issue 1.

The CI budget step, run locally (F7), also measured two pages this table does not: **a flight page (performance 68 to
75, LCP 4.2 to 4.9 s, its streamed `h1`)** and the board **at 23:17, when its window held no departures (76 to 78, LCP
4.7 s: the empty-state message, painted after the feed answers)**. The flight page measured 64 and LCP 4.4 s in the
original QA (`docs/qa/lighthouse/mobile/flight-detail.json`), so that is not new, but no round since has measured it.

### F2.5 First-load JavaScript and `$RC` reveals

First-load JavaScript, gzip KB (`scripts/qa/first-load-js.mjs`; 39 page routes; framework 128.7 in every row).

| Route | Round three | Round four (final build) |
|---|---|---|
| flight page | 246.7 | **249.1** (0.9 under the 250 budget) |
| `/en/journey` | 243.6 | 246.0 |
| `/en` | 228.7 | 229.5 |
| `/en/kul` | 229.4 | 230.2 |
| board / map | 228.7 / 227.4 | 229.2 / 227.9 |
| parking / transport | 222.2 / 216.2 | 223.2 / 217.1 |
| concierge | 216.1 | 217.1 |
| guides hub / guide topic | 202.4 / 203.8 | 202.6 / 204.5 |
| corporate news story | 202.3 | 203.0 |
| over 250 KB, of 39 | 0 | **0** |
| content and guidance pages (target 170) | 198.6 to 227.4 | **198.8 to 227.9** |

- The trust log's "the home's first JavaScript is unchanged" holds for `TopicStatus` itself (its chunk is in the
  first load of 0 routes); the home grew 0.8 KB from other round-four code in its shared chunks.
- The demo generator is in one 8.9 KB chunk in the first load of **0** routes; zod in 0 client chunks; the icon
  registry (22.8 KB) still in all 39.
- **`h1` in a hidden segment revealed by `$RC`: 0 of 276 sitemap pages** (`rc-scan.py`); 1,264 reveals in all, the
  same distribution as round three (3 on 110 pages, up to 10 on airport pages), all after the `h1`.

### F2.6 Other production measurements (Playwright, Pixel 7 unless stated)

| Measure | Round three | Round four (final build) |
|---|---|---|
| Interaction latency at 4x CPU, worst per run (`interaction-latency.mjs`, 3 runs) | Board typing 88/64/48; direction 160/112/120; home mode 104/120/104; home switcher 128/120/128; `/en/kul` switcher 160/224/160 | Board typing **48/96/104**; direction **88/96/72**; home mode **104/144/112**; home switcher **136/152/160**; `/en/kul` switcher **176/128/144**. All under 200 ms |
| Input before hydration (round three's `early.cjs`, scripts delayed 2.5 s, 4x CPU) | 0 of 6 lost per case | **0 of 10 lost** in each of the four cases; every input landed before hydration |
| Home CLS (`layout-shift.mjs`, `/en` and `/ms`, three viewports, 3 loads) | 0 in all loads | **0 in all 36 loads** (18 normal, 18 at 4x CPU with a slow network); Lighthouse CLS 0 in all 9 home runs |
| Saved flight on the home (MH 2626 at 09:40, delayed; round three's `a08.cjs` with a fixed clock) | CLS 0; card 273 to 477 px (en), 313 to 585 px (ms) | **CLS 0** in en and ms, phone and desktop, also at 4x CPU; card 295 to 499 px (en) and 325 to 597 px (ms) at 390x844 (the same heights as round three, 22 and 12 px lower), 400 to 546 and 454 to 600 px on desktop |
| My journey with a saved flight (B-07) | 0.036 mobile, 0.007 desktop | 0.040 mobile, 0.008 desktop |
| Desktop CLS, 1440x900, 3 loads (E-02's four pages) | `/en` 0, `/ms` 0, `/en/kul` 0.011, concierge 0 | **The same**. Newly measured: airport section pages 0.025 to 0.026 (the section-tab row arrives after a skeleton sized for the compact bar and pushes the page down 48 px; the code is unchanged this round), the board 0.039, transport **0.045 to 0.049** (that shift plus the new fare row settling to today's fare). All phones 0 |
| Flight feed requests | Home 1 batched request (16 KB); `/en/kul` 1 (9 KB) | **The same** with the clock at 18:00. At 22:30 the home and overview make 2 (today and tomorrow: 16 + 13 KB; 8 + 7 KB): the previews take the next morning's flights late in the evening |
| Service worker, first visit to `/en` (E-12; round three's `sw.cjs`) | 62 requests, 685 KB, Cache Storage 1,571 KB | At an 18:00 clock **62 requests, 691 KB**, `/en` twice, Cache Storage 1,588 KB (24 entries); at 22:30, 63 and 706 KB (the next-day feed) |
| HTML, gzip KB | `/en` 60.1, `/ms` 61.6, `/en/kul` 56.4, board 37.5, flight page 93.8; sections 48.2 to 61.5; guides 43.8 to 54.7; concierge 37.2 | `/en` 61.6, `/ms` 63.1, `/en/kul` 58.8, board 38.9, **flight page 96.7**; sections 49.5 to 63.7; guides 45.8 to 56.6; help 56.9; concierge 38.5; journey 38.5; airports 39.8; notices 42.1; corporate 47.0; privacy 45.9 |
| Placement script (round three's `acc-layout.cjs`) | A-01 54 of 54, A-20 first notice 374 px, touts warning 570 / 654 px | A-01 **54 of 54** (bar at most 56 px, `h1` at most 184 px; 18 of 18 clear at 125%); A-13 9 tabs unclipped at 1280 to 1920 px in both languages (one Malay load was read before React revealed the streamed header: 2 of 16 loads at the `load` event, 0 of 16 0.8 s later); A-16, A-17, A-18, A-20 (374 px), A-26 (first filter 618 px) and D-05 **identical**; C-02 warning at **777 px (en) / 860 px (ms)**, moved down by the new fare row and still before every taxi and e-hailing option (first taxi option 2,766 px) |
| Malay pages (138; D-03, D-09, A-24) | 0, 1 (Rapid Penang), 1 | **Identical** |
| Density and reading level (round three's `a14-d14.cjs`) | Facilities 8 tags, 21 toggles, 8 sizes; Transport 6, 9, 9; grade 9.5, ease 50.5 | Facilities 8, **11**, **7**; Transport **5**, **4**, **8**; grade 9.5, ease 50.5 |
| Arrivals set-aside sentence | "2 flights have already arrived …" | Identical, both languages |
| 404s | 12 paths 404 with shell and title; `<main>` empty in the server HTML | Every `MissingPage` 404 (unknown airport, airport section, guide, help topic, news story, outlet; `/en/no-such-page`, `/ms/tiada-halaman`) and the global 404: **404 with the site shell, the title and the "Page not found" `h1` in the server HTML**, 0 failed boundaries, 0 console errors. The `[lang]/[...rest]` catch-all (`/en/nothing/here`, `/en/kul/zzz`, `/en/a/b/c`) still answers 404 with Next's empty error document (`<html id="__next_error__">`, no shell or title until the browser renders it, with the site's default title): unchanged code, open issue 7 |
| Durable metric store (6.1.9) | In memory | The servers wrote `.data/metrics.json` (10 keys, 127 counts from the e2e beacons); after a restart the authenticated `/api/health` listed the same keys with the stored counts |

## F3. Regressions, defects and changes in this round

Changed in this round (each run through `tsc`, `eslint`, the unit tests and the e2e suite afterwards):

1. **Test defect, `e2e/ask-round4.spec.ts`** (run 1, both projects). On a production build the parking page's car
   park list is in the static shell as the Suspense fallback and streams again with the URL's state, so until React
   reveals the streamed copy, `#car-park-kul-long-term-car-park` exists twice (one in a hidden segment) and the
   test's strict locator found two rate lines. The test was written against `next dev`, which does not prerender a
   shell. Fixed in the test: it first asserts that the card exists **once** (waiting for the reveal), then the same
   equality as before. Stricter, not looser; product unchanged.
2. **Cross-package inconsistency, 6.1.1.** The concierge (ask package) still answered a status question with "No
   disruption to the {service} is reported in our sources" while the status lines (trust package) say "Status not
   available"; the trust log left it to the concierge's owner and nobody changed it. Now "Status not available for
   the {service}: our sources have no notice about it, and no live operations feed is connected. Check the signs at
   the airport or ask at an information counter." and the Malay equivalent
   (`src/lib/i18n/features/concierge.ts`, `serviceStatusClear`, en and ms). Two expectations in
   `src/lib/concierge/engine.test.ts` changed to the new sentence (intended, commented). The grounding property test
   passes (the phrasebook is read from the same dictionary).
3. **Cross-package inconsistency, 6.1.10.** Malay copy outside the ask package's areas still called the concierge
   "concierge" while the navigation, the page and the panel say "Tanya Kami": 9 strings in the Malay privacy (7),
   terms (1) and about-this-prototype (1) copy (`features/corporate.ts`) and 1 on the offline page
   (`features/platform.ts`) now say "Tanya Kami".
   Only storage key names (`ma:concierge-…`) still contain the word on Malay pages.
4. **Test defect, `e2e/shell.spec.ts`** (run 3, CI mode, phone). "The first board row is inside the first 664 px"
   and "a flight saved from the board appears above the journey modes" used the real clock; from about 22:55 to
   05:05 Kuala Lumpur time (14:55 to 21:05 UTC, a quarter of a CI runner's day) the KLIA board's window holds no
   demonstration departures, so both failed, with their retry. They now fix the browser clock to the busy morning the
   flight specs use (the feed answers for that instant); the assertions are unchanged. Pre-existing; first seen
   because this round ran late.
5. **Workflow error, `lighthouserc.json`** (the CI step "Lighthouse budgets"). Lighthouse CI 0.16 refuses
   `aggregationMethod` beside `assertMatrix` ("Cannot use assertMatrix with other options") and exits 1 before any
   assertion is evaluated, so the step could never report a budget. `aggregationMethod: "median-run"` moved into each
   of the three matrix entries; the assertions are unchanged and now evaluate (F7).

Wrong-way numbers, not fixed (none crosses a target that was met in round three):

- Concierge Lighthouse 97 → 93 and 95, TBT about +80 to 100 ms (F2.4).
- Transport desktop CLS 0.045 to 0.049 from the new fare row and the late section tabs (target 0.1).
- HTML +1.3 to 2.9 KB gzip on every page and first-load JavaScript +0.2 to +2.4 KB per route (the flight page is
  0.9 KB under 250); service-worker first visit +6 KB; My journey mobile CLS 0.036 → 0.040.
- `e2e/shell.spec.ts` A-03 ("one exact flight number opens that flight") can time out waiting for network idle on
  `/en/kul` when its worker's single client address has been rate-limited (429 on the board feed): 0 failures in
  four full-suite runs, but 1 in 2 isolated runs of `shell.spec.ts` and 6 of 46 when repeated. A test-harness
  interaction (one address per worker, twice the feed requests late at night), not a product change; open issue 10.

## F4. Acceptance: re-review 6.1 and the gallery notes

Evidence from the final build: the e2e assertions plus `scripts/qa/acceptance-round4.mjs` (numbers, clock fixed at
18 November 09:40 where flights matter) and 15 screenshots looked at (`/en/kul` status card 1440; home saved-flight
card 390; flight summary and delay step 390; board 1440; transport 390; map 390; concierge parking answer 390;
`/en/airports` 1440; Lawas 390; `/ms` 390; accessibility statement 390; `/en/no-such-page` 1440 dark; Ipoh preview
390; offline page 390 after an early disconnect).

| 6.1 item | Verdict | Evidence (final production build) |
|---|---|---|
| 1 Status-line semantics | **Verified** (concierge part after F3 item 2) | `/en/kul` and `/ms/kul`: 0 "Checked hh:mm", 0 "No disruption", 3 lines "Status not available" / "Status tidak tersedia", the Aerotrain line "Notice dated 7 Oct 2026", lead "From notices published up to 7 Oct 2026. No live operations feed is connected yet.", where to check with a link to the official contacts; flight page and transit (en, ms): 0 and 0, "From notices published up to 7 Oct 2026; no live feed."; home strip "status not available (no live feed)" or, with the planned Aerotrain notice, "1 service has a notice" (screenshot `/ms`); concierge "Status not available for the train between Terminal 1 and Terminal 2: …" (en, ms). The concierge sentence carries no notices date |
| 2 Day-of-travel residuals | **Verified**; other airlines' notice periods need airline data | MH 2626 at 09:40 (scheduled 10:50, now 12:00): home card "Check-in closes 11:00 · Now: Check in and drop your bags" (no 07:50, no past 09:00); My journey "Check-in closes 11:00", "Now"; flight summary "Delayed: now 12:00 · … · Check-in closes 11:00 · Boarding 11:15"; 12 steps, **0 "Done:"**, 4 "Past:"; delay step "Flight status:" with "The times below follow the new departure time, 12:00"; arrive-by 09:00 on the new basis; "Act now: If nobody has arranged assistance yet, contact Malaysia Airlines now …"; at 18:00 the day before, the sourced 48-hour warning; an AirAsia flight inside two days: "we do not know how much notice AirAsia needs" (no invented hours); "Your needs: wheelchair, older traveller." |
| 3 One fact, one answer | **Verified**; tariff needs MAHB (OOS-03) | Price table: Long Term "Rates not verified: our sources give a daily maximum of RM 32; …" with 3 cells marked not verified, Terminal 1 and Terminal 2 their own sentences, Preferred Parking none; concierge lead "No parking rates at KLIA are verified. The lowest daily maximum in our sources is RM 32, at Long Term Car Park (LTCP)." and the cards' lines equal the page's (e2e); help FAQ contains the line and not the old wording; `content.test.ts` "one fact, one answer" passes |
| 4 Concierge | **Verified** | Weather and durian: "I can’t answer that from our verified content. For a definite answer, contact Malaysia Airports customer support (group line), +60 3 8777 0000.", no cards, contacts shown; wheelchair + AirAsia (en, ms): AirAsia's rules not published, no Calm Room card, no Malaysia Airlines rule; Malaysia Airlines named: its 48-hour rule; "tandas OKU", accessible toilet, smoking: one grammatical "not published" phrase per category; lift: step-free not published, with the map; the 2027 fare change has no "In effect"; collapsed phone heights **788, 968, 1,163, 1,181, 923, 881 px** (identical to the log; round three up to 2,301) with "Show N more items" (`aria-expanded`) |
| 5 Search relevance | **Verified** | "Fast Track (Terminal 1)" and "(Terminal 2)"; "smoking"/"merokok" 1 honest result; "wifi" and "Wi-Fi" 2 results, honest first; "taxi" 1 result, no liquids rule; "accessible toilet" and "tandas OKU" lead with "not published yet"; "surau" prayer rooms only; "parking" leads with "Parking at KLIA: prices and car parks"; home field "No flights match “parking”. Pages that do are listed below, first: Parking at KLIA: prices and car parks.", 0 "0 flights found" |
| 6 Answer-first and placement | **Verified** (one residual noted by its package) | Transport fare at **433 px (en), 495 px (ms)** at 390x844 (was 1,658 / 1,846), above the warning (711 / 774); Malay at 125% text 881 px, still above the warning (1,211); transit summary at 454 px and in view after the layover changes; map From at 544 px, **0** elements over the disclaimer; desktop board first row **798–850 px (en), 819–871 px (ms)**; Follow **1,321** / My needs **1,375** px (ms 1,317 / 1,425), under 1,688; at 320x256 `--spacing-sticky` 0 px and the composer static; facilities at 320 px and 125%: 0 clipped chips (en, ms); Malay mid-word breaks 0 (e2e) |
| 7 Density (A-14) | **Partly** | One source list per section on facilities (21 → 11 toggles), transport (9 → 4), transit (16 → 6); map tags 42 → 19 and Demo 18 → 4 (one per level); type sizes facilities 7, transport 8. Not met: parking unchanged (8 toggles, 4 Demo labels; the layout log's recommendation was not applied); the flight page still has 21 tags, 7 toggles and 8 Demo labels; the home, `/ms`, the KLIA overview and the flight page show **9** type sizes (A-14: at most 8 on any page) |
| 8 Thin and directory-only airports | **Verified** (team part); airline and own contact for 33 airports need MAHB data | Lawas: 0 mode radios, "This airport's own phone number: Not published …", airlines not published; KLIA "Malaysia Airlines, All Nippon Airways (ANA), Batik Air Malaysia and 13 more"; `/en/airports` and `/ms/airports`: 39 depth chips, **3 / 18 / 18**, with the legend (screenshot) |
| 9 Measurement (E-17) | **Verified** | `data-handoff`: parking-booking (2 on parking), fast-track-booking (facilities 2, overview 2, flight timeline 1), lounge-operator (3), rail-tickets (1); e2e confirms `utm_campaign` on click and the beacon; the file store kept its counts across a server restart (F2.6). Answer states for the other top tasks remain E-17's open part |
| 10 Statement and Malay copy | **Verified** (Malay elsewhere after F3 item 3); contact and response time need MAHB | Statement (en, ms): "Last reviewed 21 November 2026, after the fourth round of fixes", focus behaviour, 200 and 400% zoom, WebKit not tested, no "focus stays where it was", the contact sentence and the official channels; Malay `h1` "Semak penerbangan, rancang perjalanan anda."; "Tanya Kami" in title, `h1` and nav; the short placeholder "Penerbangan" fits (screenshot at 390) |

| Gallery note | Verdict | Evidence |
|---|---|---|
| 1 React #419 on three 404s | **Verified** | `/en/no-such-page`, `/ms/tiada-halaman`, `/en/guides/no-such-guide`: **404** on `next start`, the `h1` in the server HTML, 0 failed boundaries outside `<noscript>`, **0 console errors** (screenshot of the first in dark mode) |
| 2 Next-day rows without a date | **Verified** | Ipoh at 11:00 on 18 November: 15:30 (no label), "09:25 Tomorrow", "10:45 Tomorrow" (screenshot) |
| 3 Offline page against its toast | **Verified, on the production worker** (the trust log could not run it) | Offline at DOMContentLoaded, before the worker was ready: card "Nothing is saved on this device yet: the connection dropped before offline saving was ready …" and toast "You are offline: nothing is saved on this device yet" (screenshot); back online, the registration was retried and the worker controls the page; offline after it was ready: card "Pages you open are saved …" and toast "You are offline: showing saved information" |
| 4 "MH 2" | **Verified** | 9 results: demonstration flights and two "Malaysia Airlines (MH)" airline entries (Penang; KLIA Terminal 1); no result on the digit alone (a fact-check re-run with the clock at 09:40 on 18 November and at 00:15 on 22 November gave 10, made up the same way). The KLIA entry's summary reads "KLIA Terminal 1 · [object Object] · …" (found in that fact-check; open issue 10) |

**The round-four logs' own numbers.** Every number re-measured here matched, except: Follow, My needs and the needs
control are 4 px higher than the trust log's (1,321 / 1,375 / 1,871 px against 1,325 / 1,379 / 1,875), and parking
shows 4 Demo labels against the layout log's 5 (a different count of the same page), and the ask log gives
`e2e/ask-round4.spec.ts` 10 tests where the file has 9 (with `concierge.spec.ts`'s 11, its "20 of 20"). "The
home's first JavaScript is unchanged" is true of the lazily loaded `TopicStatus` only (F2.5). The layout log's "the production status code
needs a production run": the three 404s answer 404 on `next start`.

**Round-three items a round-four change could touch**, re-checked: A-01, A-04 and A-27 (e2e), A-08 (CLS 0), A-10
(CLS 0), A-12 and B-08 (search and engine tests, e2e), A-13, A-16, A-17, A-18, A-20, A-26, B-02 and B-07 (journey
states: `past` is not `done`, and no step tells the passenger to go anywhere after departure; e2e and
`journey.test.ts`), B-21, C-02 (warning still before every taxi option), C-06 (404s on `next start`, e2e), D-02 (Fast
Track card and timeline step, now with the booking hand-off), D-05, D-09, D-13, E-22. All still met. **B-01** is met
under the re-review's revised wording: its criterion's "No disruption reported in our sources as of hh:mm" is exactly
what 6.1.1 asked to replace with the notices' date and "Status not available".

## F5. Acceptance, all 101 P0 and P1 items

| Count | P0 (48) | P1 (53) | All (101) |
|---|---|---|---|
| Verified | 39 (round three 39) | 46 (46) | **85** (85) |
| Not verified | 9 (9) | 7 (7) | **16** (16) |
| Regressed | 0 | 0 | **0** |

No item changes state. Movement inside the 16:

| ID | P | Round four evidence |
|---|---|---|
| A-14 | P0 | Closer: source toggles −48% (facilities) and −56% (transport) against round three, type sizes 7 and 8 there. Still not met: 9 type sizes on the home, `/ms`, the overview and the flight page ("at most 8 on any page") |
| D-04 | P0 | Malaysia Airlines' 48-hour rule now drives a warning and the concierge, and other airlines get an honest "not published, ask the airline"; the criterion's AirAsia, AirAsia X, Batik Air and top-carrier rules are still missing (airline data) |
| E-17 | P1 | Every listed commercial hand-off now measured, with campaign parameters, and the counts are durable; answer states still only for the board, flight page and parking prices |
| E-06 | P0 | The workflow's jobs were run locally (F7) and one configuration error fixed; it has still not run on a CI runner, and WebKit has not run |
| A-09, E-01, E-02, E-03 | P0 | As F2.4 and F2.5: TBT `/en` 295 and `/ms` 268 ms; 7 of 10 pages at 95; a flight page at 68 to 75 with LCP 4.2 to 4.9 s; content pages 198.8 to 227.9 KB. Congested Wi-Fi LCP not re-measured (nothing before first paint changed but 1 to 3 KB of HTML) |
| B-09, D-07, C-08, D-14, E-09, E-11, E-12, E-14 | P0/P1 | Unchanged (E-11 and E-12 a few KB heavier, F2.6) |

The 16 not verified: P0 A-09, A-14, B-09, D-04, D-07, E-01, E-02, E-03, E-06; P1 C-08, D-14, E-09, E-11, E-12, E-14,
E-17.

## F6. Measurement scripts, now in the repository

The QA report noted the measurement scripts lived only in session scratch folders. Clean versions are now in
`scripts/qa/` with a README (what each measures, how to run it against a local build, dependencies, how to read the
numbers); every path is an argument or relative, and every one was used for this round:

| Script | Measures | Used for |
|---|---|---|
| `crawl-static.py` | Server-HTML link crawl: status, redirects, anchors | F2.3 |
| `crawl-rendered.mjs` | Link crawl after hydration, with `--clock` and `--flight` | F2.3 |
| `search-index.mjs` | Search-index documents and anchors | F2.3 |
| `canonical.py` | Canonical and `hreflang`, canonicals per response | F2.3 |
| `rc-scan.py` | Pages whose `h1` is revealed by `$RC` | F2.5 |
| `first-load-js.mjs` | First-load JavaScript per route from the build manifests | F2.5 |
| `lighthouse.mjs` | Lighthouse harness (median of N; desktop preset, applied-throttling profiles, diagnostics) | F2.4 |
| `interaction-latency.mjs` | Event Timing at 4x CPU for five interactions | F2.6 |
| `layout-shift.mjs` | Home CLS on three viewports, optional 4x CPU and slow network | F2.6 |
| `acceptance-round4.mjs` | The numbers behind the F4 table | F4 |

No dependency was added to `package.json`: the Node scripts use the project's `@playwright/test`, the Python scripts
the standard library, and Lighthouse is installed in a separate folder and named with `LIGHTHOUSE_CLI` (README). The
older one-off checks (`early.cjs`, `a08.cjs`, `sw.cjs`, `acc-layout.cjs`, `a14-d14.cjs`, `ms-crawl.py`,
`htmlsize.py`, `feedreq.cjs`, `arrivals.cjs`) were run from round three's copies in the session scratch folder, with
a clock argument added to three of them, for comparability; they are not in the repository.

## F7. CI, run locally (`.github/workflows/malaysia-airports-ci.yml`)

| Job / step | Result here |
|---|---|
| verify: checkout, Node 22 | Not applicable / Node 22.23.4 |
| Install (`npm ci`) | **Pass**, run in a scratch copy of `package.json` and the lockfile (the checkout's `node_modules` was not replaced): 486 packages, 0 vulnerabilities, one deprecation warning (`eslint@9.39.5`) |
| Audit production dependencies (gate) / all (report) | **Pass** / **Pass** (0 and 0) |
| Route types, type check, lint, unit tests | **Pass** (`npx next typegen`, `tsc` 0, `npm run lint` 0, `npm test` 554 of 554) |
| Production build (`npm run build`, `APP_VERSION` set, no `NEXT_PUBLIC_SITE_URL`) | **Pass** (into `.next-ci`, so the measured `.next` was kept; 0 warnings) |
| Install browsers | **Not run** (this round's brief: no `playwright install`). Chromium is present; WebKit is not |
| End-to-end (desktop, phone, WebKit phone; `CI=true`, `E2E_STATUS_CODES=1`, trusted client header) | Desktop and phone **pass** (run 4: 428 passed, 0 failed, 0 flaky, 6 skipped) after F3 item 4 (run 3 had 2 failures at night). **WebKit cannot run here**: with `PLAYWRIGHT_WEBKIT=1` the suite has 651 tests and every `webkit-phone` test stops at `browserType.launch: Executable doesn't exist at /opt/pw-browsers/webkit-2359/pw_run.sh` |
| Lighthouse budgets (Lighthouse CI 0.16.0, 7 URLs x 3) | Collected 21 runs (locally with Playwright's Chromium and `--no-sandbox`, as root). **The step was wrong**: assert stopped with "Cannot use assertMatrix with other options" (F3 item 5). After the fix the assertions evaluate and **fail, as the budgets predict: 14 failures** — TBT on `/en` (260), `/ms` (210), the board (332), parking (224) and the flight page (356); script bytes on `/en` and `/ms` (360 KB transferred against 256 KB: Lighthouse counts every script fetched in the load window, not first-load JavaScript); performance and LCP on the board (76, 4.7 s at 23:17 with an empty window) and the flight page (75, 4.7 s); bytes on the baggage guide (566 KB) and parking (623 KB, 41 requests). Journey passes everything. Summary: `docs/qa/lighthouse-round4/ci-budgets/` |
| Keep reports | Not applicable (GitHub artifact upload) |
| CodeQL | **Cannot run here**: a GitHub-hosted action; no CodeQL CLI in the container |
| Secret scan (gitleaks, full history) | **Cannot run here**: no Docker daemon, and the scan reads the git history, which this round's brief does not allow. A pattern scan of the working tree (private keys, AWS, GitHub, Slack, Google and Anthropic-style keys; `node_modules` and build output excluded) found nothing |

So on a runner the workflow would now fail only where the product misses its budgets (the Lighthouse step) and,
until WebKit runs once, nobody knows whether the WebKit project passes. The CI build sets no
`NEXT_PUBLIC_SITE_URL` (canonicals name `http://localhost:3000`); no test depends on it, so this was left as is.

## F8. Open issues, ranked

"Team" = fixable by the delivery team. "MAHB" = depends on MAHB data, systems or partners.

1. **TBT over 200 ms on 7 of 10 pages; performance under 95 on `/en` (94), `/en/kul` (94) and the concierge (93);
   the concierge about 80 to 100 ms slower than in round three** (A-09, E-01; P0). Team. Long tasks are the HTML
   document and React DOM's and the Next.js runtime's chunks; the CI budget step fails on TBT on five URLs.
2. **Flight page LCP 4.2 to 4.9 s, performance 68 to 75; the board 4.7 s when its window is empty at night** (E-01,
   E-02; P0). Team. The flight page streams its `h1` (dynamic segment); the board's empty-state message is painted
   only after the feed answers. Both are in the CI budget set.
3. **CI and WebKit never run on a runner** (E-06; P0). Team. Every step that can run here passes except the budgets;
   run the workflow once with WebKit, and keep the chaos and contract tests in it (the last code part of B-09).
4. **First-load JavaScript on content pages 198.8 to 227.9 KB** (target 170) and the flight page at 249.1 KB, 0.9
   KB under 250 (E-03; P0). Team: the icon registry (22.8 KB on all 39 routes) and the shell's client islands.
5. **Density on the parking and flight pages, and 9 type sizes on the home, `/ms`, the overview and the flight page**
   (A-14, 6.1.7; P0). Team (design owner): apply the layout log's parking recommendation (one source list, one Demo
   marker) and the same to the flight page.
6. **Byte, request and HTML budgets** (E-01, E-11, E-12). Team. Guidance pages 548 to 609 KB; HTML 38 to 64 KB gzip
   (flight page 96.7); service-worker first visit 62 requests and 691 KB.
7. **The `[lang]/[...rest]` catch-all 404s send Next's empty error document** (no shell, no title, no "Page not found"
   in the HTML; the browser renders the body under the site's default title). Team (low): render `MissingPage` there,
   as the other routes now do.
8. **Congested Wi-Fi LCP 2.57 and 2.68 s** (E-02; last measured in round three). Team.
9. **The concierge's on-device flights** (B-09; P0). Team; the official feed is MAHB (OOS-01).
10. **Low, team**: desktop CLS 0.025 on airport section pages (section tabs arrive after a compact-bar skeleton) and
    0.045 to 0.049 on transport; e2e A-03 sensitive to rate limiting of its worker's address (give each test its own
    address, or wait for the field rather than network idle); the Malay transport fare at 881 px at 125% text; the
    "LGK" label clipped at the left edge of the `/en/airports` schematic map at 1440 px; `.lighthouseci/` is not
    git-ignored; two search-index airline summaries show "[object Object]" in both languages (`airline:kul:mh`,
    `airline:pen:cx`: the check-in text is passed unpicked in `src/lib/search/documents.ts`; found in the
    documentation fact-check); no canonical in the HTML on 124 routes (E-14), answer states for the other top
    tasks (E-17), enforced CSP keeps `'unsafe-inline'` (E-09), reading level (D-14).
11. **Rate limits behind an undeclared CDN** (deployment). MAHB: set `TRUSTED_CLIENT_IP_HEADER` or
    `TRUSTED_PROXY_HOPS` and deploy the edge rules (OOS-11).
12. **Facts only MAHB, airlines or partners can supply**: assistance rules and notice periods for AirAsia, AirAsia X,
    Batik Air and the other carriers (D-04); the operating airline and own phone line of the 33 airports without a
    content file (6.1.8); an accessibility contact and response time (6.1.10); a live operations feed and notices CMS
    so status lines can carry a checked time again (OOS-02); the parking tariff (OOS-03); the Immigration
    Department's wording for departing citizens (D-07); taxi, rail and e-hailing places on the map (C-08); Fast Track
    price, hours and seller (D-02); located accessibility facts (OOS-07); native Malay review, including "Tanya Kami"
    and the new `h1` (OOS-14). MAHB.

## F9. How to reproduce

```bash
npx tsc --noEmit && npx eslint . && npx vitest run && npm audit --omit=dev
rm -rf .next && NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off
mkdir -p out   # or any folder outside the repository (scripts/qa/README.md)
python3 scripts/qa/crawl-static.py http://localhost:3100 out/crawl-static.json
node scripts/qa/crawl-rendered.mjs --out=out/crawl-rendered.json --clock=2026-11-18T09:40:00+08:00 --flight=mh2626-20261118-d
node scripts/qa/search-index.mjs && python3 scripts/qa/canonical.py http://localhost:3100 out/canonical.json
python3 scripts/qa/rc-scan.py http://localhost:3100 out/rc-scan.json && node scripts/qa/first-load-js.mjs .next out/fljs.json
LIGHTHOUSE_CLI=<separate install>/node_modules/lighthouse/cli/index.js node scripts/qa/lighthouse.mjs docs/qa/lighthouse-round4 3 en=http://localhost:3100/en ...
node scripts/qa/interaction-latency.mjs && node scripts/qa/layout-shift.mjs && CPU=4 NET=1 node scripts/qa/layout-shift.mjs
node scripts/qa/acceptance-round4.mjs
```

Files changed in this round: `e2e/ask-round4.spec.ts` and `e2e/shell.spec.ts` (F3 items 1 and 4),
`src/lib/i18n/features/concierge.ts` and `src/lib/concierge/engine.test.ts` (item 2),
`src/lib/i18n/features/corporate.ts` and `src/lib/i18n/features/platform.ts` (item 3), `lighthouserc.json` (item
5), the new `scripts/qa/` (11 files) and `docs/qa/lighthouse-round4/`, and this section.

# Round five

Owner: release and verification. Date: 22 November 2026 (measurements 02:37 to 05:50 Kuala Lumpur time). Scope:
the three round-five packages (`docs/qa/fixes/round5-speed.md`, `round5-flight.md`, `round5-polish.md`), checked on
a production build (`.next` deleted, then `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build`, served by
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100`); every claim in the three logs checked against
that build; round four's verified 6.1 items and gallery notes repeated where a round-five change could touch them;
the full suite run three ways (as configured, in CI mode as the workflow runs it, and with the browser clock at
night); and the CI workflow's jobs run locally as far as this container allows. Rounds one to four above are
unchanged.

**Result.** Types, lint, **581 unit tests** (577 as delivered, 7 of 7 runs; 4 added here), `npm audit` (0 and 0),
the build (0 warnings, 363 static pages), **526 end-to-end tests: 512 passed, 0 failed, 14 skipped** on the final
build with the real clock, in CI mode and with the browser clock at night, the axe scans (**0
violations** in 60 call sites in 13 specs, plus 68 scans of the states round five added; one intermittent
`target-size` result in one night run, not reproduced in 236 repeats, G3 item 5), the link crawls (**0 broken
links, 0 missing anchors**, 0 redirects), **exactly one canonical per response and one in the head on 276 of 276**
(152 in round four), and **0 of 276** pages with the `h1` revealed by `$RC`. **One regression was found and fixed**:
when the platform runtime's script (made lazy in this round) could not be fetched, every page, the offline page
included, was replaced by "This page couldn't load"; the flight page's new lazy parts did the same inside the page
(G3 item 1). A related round-five slip, "My needs" tapped before its lazy control arrives jumping to nothing, is
fixed too (item 2). **Acceptance of the 18 round-five claims: 16 verified, 2 partly, 0 not verified, 0 regressed
on the final build** (the delivered build regressed gallery note 3's offline page, G3); of round four's re-checks,
6.1.7 stays partly and gallery note 3 is now partly, the rest verified. The backlog count does not move: **85
verified, 16 not verified, 0 regressed** of 101 (G5); A-14, B-09, E-03, E-11, E-12 and E-14 are closer. Lighthouse:
performance 95 or more on **8 of 10** pages in the first set and 7 of 10 in the second (round four 7 of 10); LCP 2.5
s or less on 10 of 10, and now on **the flight page (1.22 s, performance 94 and 96; round four 68 to 75 and 4.2 to
4.9 s)** and **the empty night board (0.92 s, 95 to 96; round four 76 to 78 and 4.7 s)**; TBT 200 ms or less on 2 and
4 of 10 (round four 3 of 10). The concierge's round-four rise is gone (TBT 311 → 183 ms pooled, performance 97 to
98); on the other pages TBT stays within this container's spread of round four, and the budget step fails 10
assertions (round four 14).

## G1. Clean-up before the checks

- Nothing from this checkout was running and nothing listened on ports 3241 to 3243 or 3251 to 3253 (or 3100): the
  three engineers had stopped their servers. There was no `.next-r5*` folder, and `tsconfig.json` and
  `next-env.d.ts` named only `.next` (the polish engineer had restored `next-env.d.ts`, as the other two logs say
  its owner should). Nothing to remove.
- `.next` (round four's build `ygqxXIFcmSWq51rkxYSGE`) was deleted and rebuilt from clean three times: as delivered
  (`xsWRXXv7gNRBuBLswkjlO`), after G3 item 1 (`o8PZoev6Xy67wES104dOL`) and after G3 item 2. The final build,
  `b4AW-Kxsx1vSRiJq7KWD0`, is left in `.next`.
- Every server was stopped by its process group. The CI-style build (`.next-ci`), the lines Next.js added for it to
  `tsconfig.json` and `next-env.d.ts` (both files restored from copies taken before), the Lighthouse CI reports
  (`.lighthouseci`, moved to the session scratch folder; a summary is in `docs/qa/lighthouse-round5/ci-budgets/`),
  `playwright-report/`, `test-results/` and the metric file the servers wrote (`.data/`, git-ignored) were removed
  at the end.
- One `git --version` ran by mistake inside a longer command line (it prints the program's version and reads no
  repository). No other git command was run.

## G2. Results

### G2.1 Static checks, unit tests and build

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (incremental, then a full `--incremental false` check; again after each change in G3) |
| `npx eslint .` | 0 problems (includes `scripts/qa/`) |
| `npx vitest run` | As delivered: 40 files, **577 passed**, 0 failed, in **7 of 7** runs (round four 554). Final: 41 files, **581 passed** (G3 item 1 adds `src/lib/retrying-import.test.ts`) |
| `npm audit --omit=dev` / `npm audit` | 0 vulnerabilities / 0 vulnerabilities |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build` | Succeeds from clean in 36 to 38 s, **0 warnings**, 363 static pages (round four 365: the catch-all's prerendered fallbacks `◐ /en/[...rest]` and the others became `○ /en/not-found` and `○ /ms/not-found`, the polish package's intended change; the rest of the route table is identical) |

### G2.2 End-to-end and accessibility (production build, desktop 1440x900 and phone Pixel 7 390x844, `--trace off`)

| Run | Build | Clock | Tests | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|---|---|---|
| 1 | As delivered | Real, 02:38 to 02:46 | 522 | **508** | **0** | 14 | See the note on the night window below |
| 2 | After G3 item 1 (+4 tests) | Real, 04:00 to 04:08 | 526 | **512** | **0** | 14 | |
| 3 | CI mode (`CI=true`, retries 1, 2 workers, `E2E_STATUS_CODES=1`), CI-style build | Real, 04:15 to 04:22 | 526 | **512** | **0** | 14 | 0 flaky |
| 4 | After G3 item 1 | Browser 22 Nov 23:30 | 526 | 509 | 3 | 14 | 2 are a harness artefact, 1 intermittent (G3 item 4) |
| 5 | After G3 item 1 | Browser 18 Nov 23:30 | 526 | 511 | 1 | 14 | Intermittent axe `target-size` (G3 item 5) |
| 6 (final) | Final | Real, 04:57 to 05:05 | 526 | **512** | **0** | 14 | |
| 7 (final) | Final | Browser 18 Nov 23:30 | 526 | **512** | **0** | 14 | |

**The night window.** Round four put the board's empty window at about 22:55 to 05:05. On 22 November the first
departure is at 07:00 and the board looks six hours ahead, so with the real clock the window is empty only from
about 22:55 to 01:00: runs 1 to 3 saw a board with rows. The night runs (4, 5 and 7) therefore fix **the browser
clock** at 23:30 Kuala Lumpur time for every page whose test does not pin its own clock: `scripts/qa/night-clock.cjs`
(new, G6) wraps `@playwright/test` so each test context gets an init script that shifts `Date` (time keeps running);
the feed answers for the browser's instant, so the board shows "No departures between 23:20 and 05:30". Tests that
pin a clock keep theirs. Run 4 used 22 November and showed why the date must be the pinned tests' date (18
November): see G3 item 4.

The 14 skips are round four's 6 project-specific ones plus 8 new deliberate ones (the header tooltip and concierge
panel on the phone, the phone type-size budget on desktop, the four desktop section-shift checks on the phone).
92 tests are new in round five: `speed-round5.spec.ts` 24 (4 of them added here, G3), `flight-round5.spec.ts` 26
and `polish-round5.spec.ts` 42, on both projects. The spec changes the logs declare were read: A-03 in
`shell.spec.ts` gets its own client address and waits for hydration (assertions unchanged), and
`transport.spec.ts` expects "Simulated space" where the Preferred Parking card said "Demo" (the intended change).
None removes an assertion. A-03 with `--repeat-each=5`: **30 of 30**, both projects. The two regression tests of G3:
12 of 12 on repeat; 6.1.6's "My needs" test 20 of 20 after G3 item 2.

**Axe: 0 violations** in every run except one intermittent result in run 5 (G3 item 5). 60 scan call sites in 13
specs (round four 59 in 12), all with the shared tag list (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa), on both
projects. The new speed and flight specs scan nothing, so the states round five added were scanned here
(`acceptance-round5.mjs axe`, the same tags): the night board (en, ms), the flight page before the feed answers
and after, the catch-all 404s (en, ms), parking and transport (en, ms), `/en/airports`, `/en`, `/ms`, `/en/kul`,
My journey with a saved flight, the concierge's "could not be loaded" answer, each in light and dark at 390 and
1440 px (66 scans on the final build), and the header tooltip open in light and dark (2 scans): **0 violations**.
Lighthouse accessibility is
**100 in every run** of this round that scores it.

### G2.3 Links, search index and canonicals (`scripts/qa/`; a fresh client address per request)

| Check | Result (final build) |
|---|---|
| Static HTML, 276 sitemap URLs (`crawl-static.py`) | **438 pages, 1,170 unique links, 0 broken, 0 missing anchors, 0 links through redirects** (identical to round four) |
| Rendered in Chromium after hydration (`crawl-rendered.mjs`, round three's settings: clock 18 November 09:40, MH 2626 saved) | **285 pages, 1,541 unique links, 1,033 targets, 226 fragment links, 0 broken, 0 missing anchors, 0 redirected** (round four 1,535, 1,027, 226; the delivered build 1,524, 1,016, 226). The totals move with the demonstration-flight links the thin airports' previews show when they are read (the README's caveat); `/en/btu`, `/en/myy` and `/en/twu` each list 12 flights, all answering 200 |
| Search index, `/en` and `/ms` (`search-index.mjs`) | **446 documents** (223 per language), 308 pages, 172 anchors, **0 broken, 0 missing**; **0 documents with "[object Object]"** (2 per language in round four) |
| Canonical and hreflang (`canonical.py`, stricter this round, G6) | 276 of 276 self-canonical with `en` and `ms` alternates; **exactly one canonical `<link>` in the head on 276 of 276** (round four 152) and none elsewhere in the document; **one canonical per response on 276 of 276** (one `Link` header, the same URL); flight pages (en, ms) and four 404s the same. Hreflang alternates are in the head on 152 and in the `Link` header on 276 |
| `$RC` (`rc-scan.py`) | **`h1` in a hidden segment: 0 of 276**; 1,264 reveals, round four's distribution (3 on 110 pages, up to 10 on airport pages), all after the `h1` |

### G2.4 Lighthouse mobile (`scripts/qa/lighthouse.mjs`, Lighthouse 13.6, Moto G Power, simulated slow 4G, 4x CPU; 3 runs, median)

Before = round four (`docs/qa/lighthouse-round4/`). Set 1 = the build as delivered, 02:48 to 02:55 Kuala Lumpur time
(`docs/qa/lighthouse-round5/`); set 2 = the final build, 05:14 to 05:21, on every page within 2 points or 20 ms of a
target (`docs/qa/lighthouse-round5/second-set/`, with diagnostics). The final build differs from the delivered one
only in the failure paths of G3 (first-load JavaScript +0.1 to 0.2 KB). At both times the board's window held
departures (from 07:00), as in round four's table; the empty night board is measured separately below. KB = 1,024
bytes. Shared 4-vCPU container, nothing else running (set 2 began just after an e2e run, load average 3.6 and
falling); Lighthouse's CPU benchmark index ranged from 1,276 to 2,913.

| Page | Performance before → set 1 → set 2 (runs) | LCP before → after | TBT before → set 1 → set 2 (runs) | CLS | KB before → after | Requests |
|---|---|---|---|---|---|---|
| `/en` | 94 → **95** (95/95/95) → **95** (95/95/93) | 1.11 → 1.09 s | 295 → 257 (251/257/257) → 272 (272/263/311) | 0 | 628 → 624 | 43 → 43 |
| `/ms` | 95 → **94** (94/93/94) → **91** (86/97/91) | 1.08 → 1.12 s | 268 → 293 (293/307/274) → 377 (541/204/377) | 0 | 630 → 625 | 43 → 43 |
| `/en/kul` | 94 → **94** (93/95/94) → **93** (92/93/95) | 1.09 → 1.11 s | 281 → 301 (316/270/301) → 323 (335/323/243) | 0 | 650 → 621 | 48 → **44** |
| `/en/kul/flights` (rows) | 95 → **96** (94/96/97) → **96** (99/94/96) | 0.91 → 0.92 s | 263 → 212 (283/212/200) → 242 (98/292/242) | 0.003 | 592 → 587 | 42 → 41 |
| `/en/kul/map` | 97 → **96** (95/96; one `NO_NAVSTART`) → **94** (94/95/93) | 1.08 → 1.07 s | 205 → 257 (257/242) → 288 (288/259/302) | 0.003 → 0 to 0.003 | 609 → 605 | 41 → **40** |
| `/en/kul/transport` | 96 → **95** (96/95/95) → **97** (93/98/97) | 1.07 → 1.07 s | 219 → 268 (231/268/273) → **183** (332/170/183) | 0.003 | 600 → 594 | 40 → 39 |
| `/en/kul/parking` | 97 → **96** (96/95/98) → **95** (91/97/95) | 1.12 → 1.11 s | 188 → 221 (221/261/170) → 273 (367/199/273) | 0 to 0.003 | 608 → 602 | 44 → 43 |
| `/en/guides` | 98 → **98** (98/99/98) | 1.07 → **0.91 s** | 175 → **162** (162/110/167) | 0 | 548 → 539 | 38 → 37 |
| `/en/concierge` | 93 → **97** (97/96/97) → **98** (97/99/98) | 0.92 → 0.92 s | 311 → 209 (209/239/182) → **169** (183/130/169) | 0 | **705 → 558** | 45 → **39** |
| `/en/journey` | 98 → **99** (99/98/99) | 0.92 → 0.91 s | 179 → **126** (126/170/125) | 0 | 526 → 519 | 36 → 35 |

Against the brief: performance 95 or more on **8 of 10** medians in set 1 (not `/ms` 94, `/en/kul` 94) and 7 of 10
with set 2 (not `/ms` 91, `/en/kul` 93, the map 94); round four 7 of 10. LCP 2.5 s or less on **10 of 10** (largest
1.15 s). CLS 0.1 or less on 10 of 10 (largest median 0.003). TBT 200 ms or less on **2 of 10** in set 1 (guides,
journey) and 4 of 10 with set 2 (concierge 169, transport 183); round four 3 of 10. Bytes: every guidance page
measured is over 500 KB (539 to 605); 40 requests or fewer now on the map (40) and transport (39), not parking (43).

**Pooled over both sets** (six runs), TBT medians: `/en` 260 ms (round four's pooled six 264), `/ms` 300, `/en/kul`
308 (295), concierge **183** (round four's pooled six 287), board 227, map 259, transport 250, parking 241. Across
sessions, only the concierge (about −100 ms) and My journey (−53 ms, three runs) move beyond this container's 60 to
100 ms spread; the map, transport and parking read 30 to 50 ms above round four's three runs, inside it. The speed
log's interleaved comparison (each page on the final and the baseline build in turn, five rounds) is the better test
of the direction and found −58 to −68 ms on `/en`, `/ms` and `/en/kul`; it could not be repeated here (the baseline
build no longer exists). Set 2's longest tasks are React DOM's and the framework's chunk (`01t2i9pe5vz2-.js`, 215 to
233 ms) and the HTML document (156 to 232 ms), as the speed log says.

Pages round four measured separately (in its budget step), now in the table's conditions:

| Page | Round four | Set 1 | Set 2 |
|---|---|---|---|
| Flight page (`/en/kul/flights/ak6336-20261122-d`) | 68 to 75, LCP 4.2 to 4.9 s (budget step) | **94** (93/94/96), **LCP 1.22 s**, TBT 301 (301/301/236), CLS 0.003, 674 KB, 48 requests | **96** (98/93/96), 1.22 s, 218 (159/316/218), 0.003 |
| Empty night board, English (browser clock 23:30; `lh-clock.mjs`, performance only, `board-night-2330/`) | 76 to 78, LCP 4.7 s (23:17) | **96** (95/97/96), **LCP 0.92 s**, TBT 235, CLS 0.012 | **95** (95/95/93), 0.92 s, 272, 0.003 |
| Empty night board, Malay | not measured | **96** (96/98/95), 0.91 s, 246, 0.005 (one run 0.026) | **96** (96/95/97), 0.91 s, 225, 0.005 (one run 0.026) |

The flight package's open question, its `lighthouse.mjs` medians of 86 to 87 on the flight page, did not recur: 94
and 96 here with the same harness, LCP the `h1` at 1.22 s. Accessibility is 100 in every run; best practices 96 and
SEO 66, as in round four.

Congested airport Wi-Fi (`--profile=airport-wifi,250,1500,500,4`, 3 runs, `airport-wifi/`, with diagnostics): `/en`
LCP **2.57 s** (2.570/2.556/2.582; round three 2.57), performance 85, TBT 357 ms; the board **2.65 s**
(2.659/2.642/2.652; round three 2.68), 86. LCP is the first paint on both, behind 23 KB of render-blocking CSS
(about 1.2 s of it on this profile). Not met (2.5 s).

### G2.5 First-load JavaScript (`scripts/qa/first-load-js.mjs`, gzip KB; 39 page routes; framework 128.7 in every row)

| Route | Round four | Round five (final build) |
|---|---|---|
| shared shell (the catch-all route minus the framework) | 70.1 | **33.0** |
| flight page | 249.1 | **198.3** |
| `/en/journey` | 246.0 | 212.2 (the largest) |
| `/en` (budget 250) | 229.5 | **195.7** |
| `/en/kul` | 230.2 | 196.3 |
| board / map | 229.2 / 227.9 | 197.6 / 194.7 |
| parking / transport | 223.2 / 217.1 | 188.1 / 180.8 |
| concierge | 217.1 | 182.0 |
| guides hub / guide topic | 202.6 / 204.5 | **165.5 / 167.5** |
| corporate news story | 203.0 | **166.0** |
| at 170 or less (content and guidance target), of 39 | 0 | **18** |
| over 250, of 39 | 0 | **0** |

- The speed log's numbers hold to 0.1 KB on the delivered build; G3 item 1 adds 0.1 to 0.2 KB per route.
- lucide-react is in **0** client chunks (the icons are one 144-symbol sprite, `icons.<hash>.svg`, 92 to 149
  `<use>` references per page and no icon geometry in the RSC payload); the demonstration generator is in **0**
  client chunks (its constants are only in the server bundle); zod in 0.
- Over 170: 21 routes (the home among them, whose budget is 250), from 170.3 (offline) to 212.2 (journey).

### G2.6 Other production measurements (Playwright, Pixel 7 unless stated)

| Measure | Round four | Round five (final build unless stated) |
|---|---|---|
| Interaction latency at 4x CPU, worst per run (`interaction-latency.mjs`, 2 sets of 3) | Board typing 48/96/104; direction 88/96/72; home mode 104/144/112; home switcher 136/152/160; `/en/kul` switcher 176/128/144 | Board typing 48/88/88 and 40/64/32; direction 120/88/120 and 80/104/128; home mode 120/**232**/112 and 160/112/104; home switcher 176/136/184 and 160/160/152; `/en/kul` switcher **224**/160/152 and 136/176/152. **2 of 30 runs over 200 ms**, both in the first set (round four 0 of 15; round three 2 of 9) |
| Input before hydration (round three's `early.cjs`, scripts delayed 2.5 s, 4x CPU) | 0 of 10 lost per case | **0 of 10 lost** in each of the four cases |
| Home CLS (`layout-shift.mjs`, `/en` and `/ms`, three viewports, 3 loads) | 0 in 36 loads | **0 in all 36 loads** (18 normal, 18 at 4x CPU with a slow network) |
| Desktop CLS, 1440x900, 3 loads (E-02's pages) | `/en` 0, `/ms` 0, `/en/kul` 0.011, concierge 0 | **The same**; My journey 0; all phones 0 |
| Desktop CLS on airport section pages (parking, facilities, lounges, shop-dine, map, transit, PEN parking) | 0.025 to 0.026 | **0.0004 to 0.0005**, 0 inside `<main>` (the rest is the header's airport switcher) |
| Desktop CLS, transport (en / ms) | 0.045 to 0.049 | **0.0004 / 0.0012**, 0 inside `<main>` |
| Desktop CLS, board and flight page (clock 18 November 09:40) | board 0.039 | board **0.008**; flight page **0.009** (0.097 on the flight package's baseline) |
| Night board (clock 23:30), CLS | not measured | 0 on phones (en, ms); **0.023 (en), 0.041 (ms) at 1440**: the board header, the status row and the empty-state title move sideways when the feed answers |
| Service worker, first visit to `/en` at an 18:00 clock (round four's `sw.cjs`) | 62 requests, 691 KB, Cache Storage 1,588 KB (24 entries), `/en` twice | **61 requests, 643 KB, Cache Storage 1,376 KB** (23 entries), `/en` twice |
| HTML, gzip KB (round four's `htmlsize.py`) | `/en` 61.6, `/ms` 63.1, `/en/kul` 58.8, board 38.9, flight page 96.7; sections 49.5 to 63.7; guides 45.8 to 56.6; help 56.9; concierge 38.5; journey 38.5; airports 39.8; notices 42.1; corporate 47.0; privacy 45.9 | `/en` **53.5**, `/ms` 54.8, `/en/kul` 49.4, board 32.1, flight page **85.6**; sections 41.6 to 57.0; guides 38.1 to 48.8; help 48.3; concierge 36.9; journey 32.0; airports 33.3; notices 35.6; corporate 39.3; privacy 38.8 (7 of 22 pages at 40 or less) |
| Placement (`acceptance-round4.mjs placement`) | Transport fare 433 / 495 px (en / ms), warning 711 / 774; Malay at 125% 881 px (warning 1,211); first taxi option 2,766 px | Fare **431 / 493**, warning 736 / 798; **Malay at 125% 717 px** (warning 1,266), English at 125% 616 px; first taxi option 2,791 px (C-02 holds); board first row, Follow, My needs and the needs control **identical** to round four |
| Density at 390 px (`acceptance-round4.mjs density`) | Facilities 8 tags, 11 toggles, 7 sizes; Transport 5, 4, 8; Parking 8 tags, 8 toggles, 4 Demo labels | Facilities and Transport identical; Transit 20, 6, 6; Map 19, 1, 7; **Parking 4 tags, 3 toggles, 0 Demo labels on cards (1 banner), 7 sizes** |
| A-14 type sizes on every sitemap page plus My journey and a flight page, MH 2626 saved (`type-sizes.mjs`, new) | not measured | **390 px: 272 of 280 pages at 8 or fewer**; 9 on `/en` and `/ms` (with a saved flight, its card adds 12 px), the corporate hub, corporate news and about-this-prototype (both languages). 1440 px: 269 of 280; 9 or 10 on the home, My journey, the corporate hub and about, about-this-prototype and the terminal map (its scaled SVG labels) |
| Catch-all 404s (`/en/kul/zzz`, `/en/nothing/here`, `/en/a/b/c`, `/ms/kul/zzz`, `/ms/tiada/halaman`) | 404 with Next.js's empty error document | **404 on the first and repeat request with the shell, the skip link, the title, the `h1`, `noindex` and one canonical** in the server HTML; browser title "Page not found \| …" / "Halaman tidak ditemui \| …"; no React error (the console shows the document's 404 and, at times, the header's language link prefetching the other language's 404, as on every `MissingPage` 404 since round four) |
| Congested airport Wi-Fi (`lighthouse.mjs --profile=airport-wifi,250,1500,500,4`) | Round three: `/en` 2.57 s, board 2.68 s | **`/en` LCP 2.57 s** (2.570/2.556/2.582), performance 85; **board 2.65 s** (2.659/2.642/2.652; rows, 02:55), 86. Still the first paint; 23 KB of render-blocking CSS ahead of it. Not met (2.5 s) |
| A failed lazy script (new check, G3 item 1) | not measured | Delivered build: **24 of 24 page/viewport pairs** replaced by "This page couldn't load". Final build: 0 of 24; the flight page keeps its answer; the runtime's script is fetched again (3 requests) and the worker registers |

## G3. Regressions, defects and changes in this round

Changed in this round (each followed by `tsc`, `eslint`, the unit tests and the e2e runs above):

1. **Regression (speed package), fixed: a script that could not be fetched took the whole page down.** The platform
   runtime became its own script this round (`platform-runtime-lazy.tsx`, `React.lazy` inside an Activity
   boundary, no error boundary). `React.lazy` keeps a rejected import, so when the runtime's chunk could not be
   fetched (the connection dropped while the page was starting: common on airport Wi-Fi), the error reached the
   root boundary and **every page, the offline page included, was replaced by "This page couldn't load"** with no
   site shell, and stayed so after the connection returned (reproduced by failing that one chunk once on `/en` and
   `/en/offline`; with every lazy chunk failing, all 24 page/viewport pairs tested). The flight page's new lazy parts
   (timeline, needs control, not-found states, journey builder) did the same at the page level ("Something went
   wrong"). Found while finding out why gallery note 3's offline check no longer showed its card or toast. Fix: a new
   `src/lib/retrying-import.ts` (an import that never rejects: it tries again when the browser is back online, or
   after a pause doubling from 5 s to a minute), used by `platform-runtime-lazy.tsx` (plus a boundary that renders
   nothing if the runtime itself throws) and `flight-detail.tsx`. Tests: `src/lib/retrying-import.test.ts` (4) and
   two tests in `e2e/speed-round5.spec.ts` ("a script that cannot be fetched does not take the page down": the
   offline page and the flight page keep their content with every lazy chunk failing, and the runtime and the
   timeline arrive when the connection returns), 12 of 12 on repeat. First-load JavaScript +0.1 to 0.2 KB.
   Not changed (pre-existing since rounds two and three, open issue 2): the home's saved-flight card and My
   journey's clear control are also lazy, and with a saved flight a failed fetch of theirs still shows "Something
   went wrong" in the page.
2. **Robustness slip (flight package), fixed: "My needs" tapped before its control arrived jumped to nothing.** The
   needs control became a lazy chunk this round and carried the only `#needs-control` anchor, so a tap in that
   moment left the page where it was and the control appeared off screen (the 6.1.6 test failed once in 25 runs,
   run 4). The placeholder that holds the control's room now carries the anchor (`flight-detail.tsx`); the e2e test
   above taps "My needs" while the chunk is failing and checks the control is in view before and after it arrives.
   6.1.6's own test then passed 20 of 20.
3. **Measurement scripts** (`scripts/qa/`, G6): `acceptance-round4.mjs` read the home status strip's hidden
   width-reserving variants as text ("1 service has a notice 2 services have a notice …"); it now skips
   `visibility: hidden`, and reads "1 service has a notice" (real clock) and "status not available (no live feed)"
   (20 December), as the page shows. `canonical.py` now also fails without exactly one canonical `<link>` in the
   head. `lighthouse.mjs` sends its own client address per run, as the README says every script does.
   `layout-shift.mjs` takes `PATHS` and `VIEWPORTS`.
4. **Night run 4: two failures from the harness, one intermittent.** `flights.spec.ts` "announces a change to a
   saved flight once" pins its clock with `page.clock.install` (fake timers); with the night shift on another date
   (22 November) the shifted date still reached the page in places and its saved 18 November flight was dropped as
   days old (4 of 4 with that date; 2 of 2 with the shift on 18 November at 11:14 or 23:30). `night-clock.cjs`
   therefore defaults to 18 November, the pinned tests' date. The same test also fails when repeated (14 of 20 with
   `--repeat-each=10`): its board refreshes about 18 times from the worker's one client address while the clock runs
   forward, and the fourth repeat meets the feed's rate limit (429), after which the board correctly shows
   "Showing the last flight information we received … Try again"; with a fresh address per repeat, 4 of 4 pass.
   That is round four's A-03 issue (open issue 9), not a product change. The trust.spec 6.1.6 failure is item 2.
5. **Night run 5: one intermittent axe result.** `concierge.spec.ts` "works in Bahasa Malaysia" (desktop) reported
   `target-size` on the privacy row's "Susunan kata AI dan penerbangan simpanan" button (36 px tall, so partly
   covered at that instant, probably mid-scroll under the sticky header). Not reproduced in 236 repeats (8 with the
   real clock, 28 at night, 200 under load at night with `ask-round4.spec.ts`). Recorded, not changed.

The round-five logs' own open questions, answered:

- **Flight log, open 1** (`lighthouse.mjs` medians 86 to 87 on the flight page): on a quiet machine the harness gives
  **94** (93/94/96) and 95 in a probe, LCP 1.21 to 1.22 s, CLS 0 to 0.003, every request 200. The 86 to 87 were
  the shared machine's load; the harness itself is consistent with the other drivers.
- **Flight log, "after the last build"** (the summary placeholder height): on this build the Malay flight page's
  CLS at 390 px is 0 and the Lighthouse runs show 0 to 0.003.
- **Speed log, the platform test that "can race with the worker's installation"**: it passed in all seven full runs.

Wrong-way numbers, not fixed (none crosses a target that was met in round four):

- Lighthouse TBT medians on the map (205 → 257 and 288 ms), transport (219 → 268, then 183) and parking (188 → 221
  and 273), and `/ms` performance 95 → 94 and 91 (one run at 86, TBT 541): within this container's spread (G2.4), not
  attributed to a change.
- Interaction latency: 2 of 30 worst-interaction runs over 200 ms (home mode 232, `/en/kul` switcher 224), both in
  one set; round four had 0 of 15.
- Gallery note 3: with the runtime out of the first load, a connection that drops before its script arrives gets
  the offline page's card but no toast until the script arrives (G4).
- Night board at 1440 px: CLS 0.023 (en) and 0.041 (ms), measured for the first time.

## G4. Acceptance: the round-five claims, re-review 6.1 and the gallery notes

Evidence from the final build: the e2e assertions, `scripts/qa/acceptance-round5.mjs` (new) and
`acceptance-round4.mjs`, the measurements above, and 15 screenshots looked at (flight page before the feed
answers, 390; flight page filled, 1440; night board 390 en and 390 ms dark; `/en/kul/zzz` 1440 dark; parking card
390; Malay transport at 125% text 390; the airports map at 1440 and 320; the concierge with the feed blocked 1440;
the home 390; the header tooltip 1440; `/ms` 1440 dark; My journey's timeline 390; and the "This page couldn't load"
screen of G3 item 1).

| Package, item | Log's claim | Verdict | Evidence (final build unless stated) |
|---|---|---|---|
| Speed 1, TBT and performance (A-09, E-01) | Partly fixed | **Partly**, as claimed (one of its changes regressed; fixed here, G3 item 1) | The concierge's round-four rise is gone: performance 93 → 97 and 98, TBT 311 → 209 and 169 (183 pooled), 705 → 558 KB, 45 → 39 requests. `/en` 95 in both sets (claimed 96); `/ms` 94 and 91 (claimed 95); `/en/kul` 94 and 93 (claimed 92). TBT on `/en`, `/ms` and `/en/kul` 257 to 377 ms, above 200 as the log says, and not measurably lower than round four across sessions (G2.4). Icons render without hydrating (G2.5); header tooltip below; `$RC` 0 of 276; home CLS 0 |
| Speed 2, first-load JavaScript (E-03) | Partly fixed | **Verified** (the numbers; the target still missed, as claimed) | Shell 70.1 → 32.9 KB as delivered (33.0 final), every route 19.6 to 51.0 KB lighter, **18 of 39** at 170 or less, 0 over 250, journey 212.0 the largest; identical to the log to 0.1 KB |
| Speed 3, the concierge's flights from the feed (B-09) | Fixed | **Verified** | On the device the answer requests `/en/flights/feed` (`/ms/…` in Malay) and reads "MH 785 shows as scheduled in the demonstration data. Your airline has the real status. …" with the demonstration banner; no script the page loads contains the generator. `/api/concierge` answers with the feed's own flight (id, status, scheduled and estimated times equal). Feed blocked: "Flight information could not be loaded just now, so I cannot check MH 785. If you are offline, try again …" / "Maklumat penerbangan tidak dapat dimuatkan sekarang, …" (for "delayed?" it follows the delay rights, under "What we do not know"); never "not found" (screenshot) |
| Speed 4, bytes, HTML and the worker (E-01, E-11, E-12) | Partly fixed | **Verified** | HTML gzip as the log (`/en` 53.5, `/en/kul` 49.4, guides 38.1, concierge 36.9); the concierge's copy only on the concierge page (e2e); worker first visit 61 requests, 643 KB, Cache Storage 1,376 KB; guides hub 539 KB, baggage guide 545 KB (512 not met, as claimed) |
| Speed 5, the home's type sizes (A-14) | Fixed | **Partly** | 8 at 390 px on `/en` and `/ms` (11 13 14 16 18 20 22 26) and 9 at 1440, as claimed; but **9 at 390 px when a flight is saved** (the saved-flight card adds 12 px), a state the log did not count |
| Speed, icons as one sprite (cross-package) | — | **Verified** | 0 client chunks with lucide; one 144-symbol sprite; drawn in light, dark and on the phone bar (screenshots); e2e |
| Speed, tooltip without Radix (cross-package) | — | **Verified** | e2e (hover, keyboard focus, Escape, hoverable, inside the window); axe 0 with it open, light and dark; beside its trigger (screenshot) |
| Speed, the platform runtime as its own script | — | **Regressed as delivered, fixed** | G3 item 1 |
| Flight 1, the flight page's LCP (E-01, E-02) | Fixed | **Verified** | `h1` inline at byte 22,540 (en) and 22,668 (ms), before the first hidden segment (46,600); the log's 19,517 grew by the polish package's head canonical. Performance 94 and 96, LCP 1.22 s (the `h1`), CLS 0 to 0.003 with `lighthouse.mjs`; budget step 93 to 95, LCP 1.21 to 1.23 s. Before the feed answers the card shows the timetable facts and placeholders (screenshot). 404 with "We could not find this flight" for `/en/bbn/…`, `/ms/tod/…`, `/en/kul/flights/zz9999-…` and `/en/zzz/…` |
| Flight 2, the board at night | Fixed | **Verified** | Browser clock 23:30: LCP 0.92 s (en) and 0.91 s (ms), performance 95 to 96 (round four 76 to 78, 4.7 s); "Loading the board" in the server HTML; the empty state fills that block and offers both steps, in English and Malay (screenshots). Residual shift: 0 to 0.026 on phones; 0.023 (en) and 0.041 (ms) at 1440 px (G2.6) |
| Flight 3, the flight page's first-load JavaScript | Fixed | **Verified** | 249.1 → 198.1 KB as delivered (198.3 final) |
| Flight 4, density (A-14, 6.1.7) | Fixed on the counts; chips partly | **Verified**, as claimed | Flight page at 390 / 1440: provenance tags 18 / 17, Demo labels 6 / 5 with **at most 1 per view**, source toggles 2, one timeline source list, 5 filter chips, **8 type sizes**; My journey 15 / 14, 5 / 4 (at most 1 per view), 1 toggle, 8 / 9 sizes; overview 8 sizes, 2 Demo labels in one phone view (not in the item). Identical to the log |
| Flight 5, desktop CLS on section pages | Fixed | **Verified** | 0.0004 to 0.0005 on seven section pages, 0 inside `<main>`; flight page 0.009 (log 0.0045), board 0.008 (log 0.0157) |
| Flight 6, e2e A-03 and rate limits | Fixed | **Verified** | 30 of 30 with `--repeat-each=5`, both projects; the same remedy is still missing in another test (G3 item 4) |
| Polish 1, catch-all 404s | Fixed | **Verified** | G2.6; five paths, first and repeat request (screenshot `/en/kul/zzz`, 1440, dark) |
| Polish 2, search index | Fixed | **Verified** | 0 of 223 documents per language with "[object Object]"; both airline summaries plain text in both languages |
| Polish 3, parking density (A-14, 6.1.7) | Fixed | **Verified** | At 390 px, English and Malay: 3 source toggles (1 in the list, 2 section lists), **0 Demo tags on cards**, 1 Demo marker and 1 banner in the list, 4 chips (the simulated space only), 4 provenance tags, 8 rate lines, "Simulated space" / "Ruang simulasi" on 4 of 4 cards, 7 type sizes (8 at 1440), 11.2 / 11.9 screens; the parking-booking hand-off kept (screenshot) |
| Polish 4, the transport fare row | Fixed | **Verified** | Desktop CLS 0.0004 (en) and 0.0012 (ms), 0 inside `<main>`; at 125% on a phone the fare's text is at 717 to 749 px (ms) and 616 to 648 (en), beside the option's name (screenshot), above the warning (1,266 / 1,142); at 1440 and 125% 689 to 721; two dated lines with and without JavaScript ("from RM 55" before the date is read); Lighthouse transport 95 and 97 |
| Polish 5, `/en/airports` map labels | Fixed | **Verified** | 0 of 5 labels outside the drawing at 320, 360, 390, 640, 768, 1024, 1280, 1440 and 1920 px and at 200% zoom (640, 720, 960 px); LGK to the right of its marker (screenshots at 1440 and 320) |
| Polish 6, canonical in the head (E-14) | Fixed | **Verified** | G2.3 |
| Polish 7, `.gitignore` | No change needed | **Verified** | `/.lighthouseci/`, `/test-results/`, `/playwright-report/`, `/.data/` and `/.next-*/` are listed (file read) |

Of the 18 numbered claims: **16 verified, 2 partly (speed 1 and 5), 0 not verified, 0 regressed** on the final build.

**Re-review 6.1 and the gallery notes, re-checked** (`acceptance-round4.mjs`, all blocks, final build):

| Item | Round four | Round five | Evidence |
|---|---|---|---|
| 6.1.1 Status lines | Verified | **Verified** | `/en/kul` and `/ms/kul`: 0 checked times, 0 "No disruption", 4 "Status not available", the Aerotrain notice dated 7 Oct 2026; flight page and transit "From notices published up to 7 Oct 2026; no live feed."; home strip "1 service has a notice" (real clock) and "status not available (no live feed)" (20 December); concierge unchanged |
| 6.1.2 Day of travel | Verified | **Verified** | The same texts on the restructured flight page: summary "Delayed: now 12:00 · … · Check-in closes 11:00 · Boarding 11:15", 12 steps, 0 "Done:", 4 "Past:", the delay step first, "Act now: …", AirAsia's notice period not invented |
| 6.1.3 One fact, one answer | Verified | **Verified** | The parking cards' reworked rate lines equal the price table's and the concierge's ("Rates not verified: our sources give a daily maximum of RM 32; …", 3 unverified cells); 8 rate lines; help FAQ unchanged |
| 6.1.4 Concierge | Verified | **Verified** | Same answers and phone heights (788 to 1,181 px); engine now loaded on intent; flight answers from the feed (B-09) |
| 6.1.5 Search | Verified | **Verified** | Same results; "MH 2" 9 results; the airline summaries now read "KLIA Terminal 1 · Level 5. International Economy: Row H, counters 1 to 18. …" |
| 6.1.6 Answer first, placement | Verified | **Verified** (after G3 item 2) | As G2.6; the Malay fare at 125% now on the first screen |
| 6.1.7 Density | Partly | **Partly** | Parking and the flight page now done (G4 table); type sizes 8 on the home, `/ms`, the overview and the flight page at 390 px, but 9 on the home with a saved flight |
| 6.1.8 Thin airports | Verified | **Verified** | Lawas, KLIA's airlines, 39 depth chips 3 / 18 / 18 unchanged; flight URLs at airports without a board now 404 |
| 6.1.9 Measurement | Verified | **Verified** | `data-handoff`: parking-booking 2 on the reworked parking page, fast-track 2/2/1, lounge 3, rail 1 |
| 6.1.10 Statement and Malay | Verified | **Verified** | Unchanged; "Tanya Kami"; the Malay placeholder fits |
| Gallery 1, React #419 on 404s | Verified | **Verified** | 4 `MissingPage` 404s: 404, `h1` in the HTML, 0 failed boundaries, 0 console errors; the catch-all now the same |
| Gallery 2, next-day rows | Verified | **Verified** | Ipoh at 11:00: "", "Tomorrow", "Tomorrow" |
| Gallery 3, offline page and toast | Verified | **Partly** (regressed as delivered, G3 item 1) | Offline at DOMContentLoaded, before the worker was ready: the card says "Nothing is saved on this device yet: the connection dropped before offline saving was ready …"; back online, the registration is retried and the worker controls the page; the next drop shows "You are offline: showing saved information". Missing against round four: the toast "You are offline: nothing is saved on this device yet", which now needs the runtime's own script and so waits for the connection (open issue 8). In one earlier run the drop came before the first-load scripts had arrived and the page kept its server text ("Checking your connection and what is saved."), a race that round four's run did not meet |
| Gallery 4, "MH 2" | Verified | **Verified** | 9 results; the "[object Object]" in the KLIA entry's summary is gone (polish item 2) |

**The round-five logs' own numbers.** Every number re-measured here matched, within the container's noise for
Lighthouse, except: the speed log's Lighthouse medians (interleaved, `/en` 96 and 228 ms, `/ms` 95 and 254, `/en/kul`
92 and 257,
concierge 98 and 157) read better than this round's sets (95 / 257 and 272, 94 and 91 / 293 and 377, 94 and 93 / 301 and
323, 97 and 98 / 209 and 169); its "8 type sizes on the home" holds without a saved flight only; the flight page's `h1`
is at byte 22,540, not 19,517 (the polish package's head canonical came later), and its desktop CLS is 0.009 against
the flight log's 0.0045 (the board 0.008 against 0.0157); the night board scores 95 to 96 against the flight log's 93
(en) and 90 (ms); and the Malay fare at 125% is at 717 to 749 px (its text) against the polish log's 720 to 770 (its
cell). The flight log's "e2e 143 passed" and the polish log's "144 passed" were partial runs; all three packages'
specs pass together in the full runs above.

## G5. Acceptance, all 101 P0 and P1 items

| Count | P0 (48) | P1 (53) | All (101) |
|---|---|---|---|
| Verified | 39 (round four 39) | 46 (46) | **85** (85) |
| Not verified | 9 (9) | 7 (7) | **16** (16) |
| Regressed | 0 | 0 | **0** (on the final build; the delivered build's G3 item 1 was fixed in this round) |

No item changes state. Movement inside the 16:

| ID | P | Round five evidence |
|---|---|---|
| B-09 | P0 | Now one part short: every flight answer, the concierge's included, comes from the server feed through the provider interface, and the generator is in no client chunk. Left: the chaos and contract tests running in CI (E-06). Official feed OOS-01 |
| A-14 | P0 | Closer: parking and the flight page as the layout log recommended (one source list per section, at most one Demo marker per view); 8 type sizes on the home, `/ms`, the overview and the flight page at 390 px. Not met: "at most 8 on any page": 8 of 280 pages have 9 at 390 px (the home with a saved flight, the corporate hub, corporate news, about-this-prototype) and 11 at 1440 px |
| E-03 | P0 | Closer: shell 70.1 → 33.0 KB; 18 of 39 routes at 170 KB or less (0); still 21 over, from 170.3 to 212.2 KB |
| A-09, E-01 | P0 | Unchanged state. TBT `/en` 257 and 272 ms, `/ms` 293 and 377 (target 200, median of 3); performance 95 or more on 8 and 7 of 10 pages; the concierge now 97 to 98 with TBT 169 to 209; the flight page 94 to 96 with LCP 1.22 s (was 68 to 75 and 4.2 to 4.9 s) and the empty night board LCP 0.92 s (was 4.7); the budget step fails 10 assertions (14); interaction latency 2 of 30 runs over 200 ms |
| E-02 | P0 | Unchanged: congested Wi-Fi LCP 2.57 s (`/en`) and 2.65 s (board), the first paint |
| E-11 | P1 | Closer: HTML 6 to 11 KB smaller per page; 7 of 22 measured pages at 40 KB gzip or less; the root dictionary still carries `flightPages` (15 KB) |
| E-12 | P1 | Closer: 61 requests (target 60), 643 KB (600), Cache Storage 1,376 KB (1 MB), `/en` still downloaded twice |
| E-14 | P1 | Closer: one canonical in the head on 276 of 276; but `pageMetadata` is still not used on 124 routes, whose hreflang alternates are in the `Link` header only |
| E-06, D-04, D-07, C-08, D-14, E-09, E-17 | P0/P1 | Unchanged |

The 16 not verified: P0 A-09, A-14, B-09, D-04, D-07, E-01, E-02, E-03, E-06; P1 C-08, D-14, E-09, E-11, E-12, E-14,
E-17.

## G6. Measurement scripts

Every script in `scripts/qa/` was used. Changes (README updated):

| Script | Change |
|---|---|
| `acceptance-round5.mjs` | **New**: the numbers behind G4 (blocks concierge, html, typesizes, flightpage, notfound404, board, density, parking, search, fare, maplabels, sections, axe) |
| `type-sizes.mjs` | **New**: A-14's type-size count on every sitemap page at 390 and 1440 px, with a saved flight |
| `night-clock.cjs` | **New**: a `--require` preload that runs the unchanged suite with the browser clock at night (G2.2) |
| `acceptance-round4.mjs` | Fixed: the home strip reading skips `visibility: hidden` text (G3 item 3) |
| `canonical.py` | Stricter: exactly one canonical `<link>` in the head and in the document is now part of the pass rule |
| `lighthouse.mjs` | Each run sends its own `x-e2e-client-ip` |
| `layout-shift.mjs` | `PATHS` and `VIEWPORTS` options (used for E-02's pages and the night board) |

One-off helpers run from the session scratch folder, not in the repository: round four's `sw.cjs`, `early.cjs` and
`htmlsize.py` (unchanged, for comparability), the flight package's `lh-clock.mjs` (Lighthouse's API with a shifted
browser clock, for the night board), and probes for the lazy-chunk failure (G3 item 1), the night board's shift
sources and the A-19 prefetch.

## G7. CI, run locally (`.github/workflows/malaysia-airports-ci.yml`)

| Job / step | Result here |
|---|---|
| verify: checkout, Node 22 | Not applicable / Node 22.23.4 |
| Install (`npm ci`) | **Pass**, in a scratch copy of `package.json` and the lockfile (the checkout's `node_modules` was not replaced): 486 packages in 23 s, one deprecation warning (`eslint@9.39.5`); `npm audit --omit=dev` there 0 |
| Audit production dependencies (gate) / all (report) | **Pass** / **Pass** (0 and 0) |
| Route types, type check, lint, unit tests | **Pass** (`npx next typegen`, `tsc` 0, `eslint` 0, 581 of 581) |
| Production build (`npm run build`, `APP_VERSION` set, no `NEXT_PUBLIC_SITE_URL`) | **Pass** (into `.next-ci`, 0 warnings, 363 pages) |
| Install browsers | **Not run** (no `playwright install` in this brief). Chromium is present; WebKit is not |
| End-to-end (desktop, phone, WebKit phone; `CI=true`, `E2E_STATUS_CODES=1`, trusted client header) | Desktop and phone **pass**: 512 passed, 0 failed, 0 flaky, 14 skipped (run 3). **WebKit cannot run here** (no WebKit browser in the container), as in round four |
| Lighthouse budgets (Lighthouse CI 0.16.0, lighthouserc.json's 6 URLs plus a current flight page, x 3) | Collected 21 runs (04:23 to 04:26; the board had rows). **10 assertion failures** (round four 14): script bytes on `/en` and `/ms` (354,754 transferred against 256,000) with TBT 232 and 213 ms; the baggage guide's total bytes (558 KB against 512); parking's performance 92, TBT 338 ms and bytes 617 KB; the flight page's performance 94 and TBT 286 ms. **No longer failing**: the board (95/97/97, LCP 0.92 to 0.94 s), parking's request count (40) and the flight page's LCP (1.22 s, was 4.7). My journey passes everything (99 to 100). Summary: `docs/qa/lighthouse-round5/ci-budgets/` |
| Keep reports | Not applicable (GitHub artifact upload) |
| CodeQL | **Cannot run here** (GitHub-hosted action; no CodeQL CLI) |
| Secret scan (gitleaks, full history) | **Cannot run here** (no Docker daemon; it reads the git history, which this brief does not allow) |

So on a runner the workflow would fail only where the product misses its budgets (the Lighthouse step), and the
WebKit project has still never run.

## G8. Open issues, ranked

"Team" = fixable by the delivery team. "MAHB" = depends on MAHB data, systems or partners.

1. **TBT over 200 ms on most pages; performance under 95 on `/ms` (94, 91) and `/en/kul` (94, 93)** (A-09, E-01;
   P0). Team. Pooled six-run TBT medians: `/en` 260, `/ms` 300, `/en/kul` 308, map 259, transport 250, parking 241,
   board
   227, flight page 268 ms; under 200 only on the concierge (183), the guides hub (162) and My journey (126). The
   longest tasks are React DOM's and the framework's chunk and the HTML document; the budget step fails on TBT on `/en`,
   `/ms`, parking and the flight page, and on script bytes on `/en` and `/ms` (354 KB against 256 KB: Lighthouse
   counts every
   script fetched in its load window, not first-load JavaScript). The speed log's next
   candidates stand: fewer Client Components on the home's first screen and the overview, scoping `flightPages` out of
   the root dictionary, fonts (127 KB).
2. **A script that cannot be fetched still replaces the page's content in two places** (resilience; found this round,
   pre-existing since rounds two and three). Team. With a saved flight, a failed fetch of the home's saved-flight card
   or
   of My journey's clear control shows "Something went wrong" in the page; the overlays' idle preloads leave unhandled
   rejections. Use `retryingImport` (G3 item 1) for every `React.lazy` that renders on page load, and add those pages to
   the e2e test.
3. **CI and WebKit have never run on a runner** (E-06; P0), and with them the chaos and contract tests, the last part of
   B-09. Team. Every step that can run here passes except the budgets.
4. **First-load JavaScript over 170 KB on 21 of 39 routes** (E-03; P0). Team. From 170.3 KB (offline) to 212.2 (My
journey);
   the shell is 33.0 KB, so what is left is each route's own code (tailwind-merge in the
   shell, 8.5 KB, could go too).
5. **Type sizes and density** (A-14, 6.1.7; P0). Team (design owner). At 390 px, 9 sizes on the home with a saved
   flight, the corporate hub, corporate news and about-this-prototype (both languages); at 1440 px, 11 pages over 8,
   including the home and My journey. Parking and the flight page are done.
6. **Byte, request and HTML budgets** (E-01, E-11, E-12). Team. Guidance pages 539 to 605 KB (target 500 to 512),
   parking 43 requests; HTML gzip over 40 KB on 15 of 22 measured pages (`/en` 53.5, flight page 85.6); the worker's
   first visit 61 requests and 643 KB (60, 600), Cache Storage 1,376 KB (1 MB), and `/en` still downloaded twice. The
   A-19
   prefetch and the idle overlays (about 130 KB) are a product decision (speed log).
7. **Congested Wi-Fi LCP 2.57 s (`/en`) and 2.65 s (board)** (E-02; P0; its last part). Team. The first paint is the
   LCP; 23 KB of render-blocking CSS and two preloaded fonts come before it.
8. **The offline toast waits for the runtime's script** (gallery note 3; low to medium). Team. Since the runtime left
   the first load, a connection that drops before its script arrives gets no "You are offline" notice on any page until
   the connection returns (the offline page's card is right). Keep a minimal connectivity listener for the toast in the
   shell, or fetch the runtime with the first load on slow connections.
9. **Low, team**: the night board at 1440 px shifts sideways when the feed answers (CLS 0.023 en, 0.041 ms); 2 of 30
   worst-interaction runs over 200 ms (home mode 232, `/en/kul` switcher 224); `flights.spec.ts` "announces a change to
   a saved flight once" shares its worker's client address and meets the feed's rate limit when repeated (give it its
   own address, as A-03 now has); one intermittent axe `target-size` result on the concierge's privacy-row button in a
   full night run, not reproduced in 236 repeats; hreflang alternates in the head on 152 of 276 pages (`pageMetadata`
   not used on 124 routes; the `Link` header has them on all, E-14); the header's airport switcher shifts 0.0004 to
   0.005
   after hydration; unknown paths' 404 renders are kept in Next.js's route cache (bound it in the deployment); answer
   states for the other top tasks (E-17); the enforced CSP keeps `'unsafe-inline'` (E-09); reading level (D-14).
10. **Rate limits behind an undeclared CDN** (deployment). MAHB: set `TRUSTED_CLIENT_IP_HEADER` or `TRUSTED_PROXY_HOPS`
    and deploy the edge rules (OOS-11).
11. **Facts only MAHB, airlines or partners can supply**: assistance rules and notice periods for AirAsia, AirAsia X,
    Batik Air and the other carriers (D-04); the operating airline and own phone line of the 33 airports without a
    content file (6.1.8); an accessibility contact and response time (6.1.10); a live operations feed and notices CMS
    (OOS-02); the official flight feed (OOS-01); the parking tariff (OOS-03); the Immigration Department's wording for
    departing citizens (D-07); taxi, rail and e-hailing places on the map (C-08); Fast Track price, hours and seller
    (D-02); located accessibility facts (OOS-07); native Malay review (OOS-14). MAHB.

## G9. How to reproduce

```bash
npx tsc --noEmit && npx eslint . && npx vitest run && npm audit --omit=dev
rm -rf .next && NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its process group afterwards
npx playwright test --trace off
NODE_OPTIONS="--require ./scripts/qa/night-clock.cjs" E2E_NIGHT=2026-11-18T23:30:00+08:00 npx playwright test --trace off
mkdir -p out   # or any folder outside the repository (scripts/qa/README.md)
python3 scripts/qa/crawl-static.py http://localhost:3100 out/crawl-static.json
node scripts/qa/crawl-rendered.mjs --out=out/crawl-rendered.json --clock=2026-11-18T09:40:00+08:00 --flight=mh2626-20261118-d
node scripts/qa/search-index.mjs && python3 scripts/qa/canonical.py http://localhost:3100 out/canonical.json /en/kul/flights/<id> /en/kul/zzz
python3 scripts/qa/rc-scan.py http://localhost:3100 out/rc-scan.json && node scripts/qa/first-load-js.mjs .next out/fljs.json
LIGHTHOUSE_CLI=<separate install>/node_modules/lighthouse/cli/index.js node scripts/qa/lighthouse.mjs docs/qa/lighthouse-round5 3 en=http://localhost:3100/en ...
node scripts/qa/interaction-latency.mjs && node scripts/qa/layout-shift.mjs && CPU=4 NET=1 node scripts/qa/layout-shift.mjs
PATHS=/en/kul,/en/concierge,/en/journey VIEWPORTS=desktop,phone node scripts/qa/layout-shift.mjs
node scripts/qa/acceptance-round4.mjs && node scripts/qa/acceptance-round5.mjs && node scripts/qa/type-sizes.mjs http://localhost:3100 out/type-sizes.json
```

Files changed in this round: `src/lib/retrying-import.ts` and `src/lib/retrying-import.test.ts` (new),
`src/components/platform/platform-runtime-lazy.tsx` and `src/components/flights/flight-detail.tsx` (G3 items 1 and
2), `e2e/speed-round5.spec.ts` (two tests added), `scripts/qa/` (three new scripts, four changed, the README),
`docs/qa/lighthouse-round5/`, and this section.

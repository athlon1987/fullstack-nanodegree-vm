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

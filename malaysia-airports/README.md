# Malaysia Airports passenger and corporate platform: concept prototype

A working concept redesign of the Malaysia Airports (MAHB) passenger and corporate websites, built with Next.js
16.4.6, React 19.3 and Tailwind CSS 4.3. This file is the handover README and the index of the project's
deliverables. Handover date: 21 November 2026.

> **Not an official Malaysia Airports website.** This is an independent concept prototype. It is not made, endorsed
> or operated by Malaysia Airports Holdings Berhad. Flight information is simulated, maps are schematic, and the site
> tells search engines not to index it unless its owner switches that off (`SITE_INDEXING`, below). Do not use it to
> plan real travel.

**Status in one line.** The QA report judges it ready for stakeholder demonstrations and a moderated pilot with
recruited participants, and not ready for a public launch or any unmoderated use by real passengers
([`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 1).

Contents: [What this is](#what-this-is) · [Product tour](#product-tour) · [Running it](#running-it) ·
[Environment variables](#environment-variables) · [Project structure](#project-structure) ·
[Content and provenance](#content-and-provenance-model) · [Deliverables index](#deliverables-index) ·
[Key results](#key-results) · [Known limitations](#known-limitations) · [Credits and licences](#credits-and-licences)

---

## What this is

The project ran in phases between 16 and 21 November 2026: research and an audit of the current MAHB sites, a
benchmark of ten airport websites, strategy and information architecture, three homepage concepts and a design
system, the build, five QA evaluations (performance, accessibility, usability, content integrity, security), a review
panel, three fix rounds, each verified on a production build, and a second panel review.

What is real, what is simulated and what does not exist:

| Kind | What it covers | How it is shown |
|---|---|---|
| **Sourced facts** | Airports, terminals, facilities, transport, parking, guides, help, notices and corporate pages | Each record cites its sources (with the date retrieved) and carries a provenance tag. Most facts come from web search results of 16 and 17 November 2026 and have not been confirmed with MAHB ([`docs/research/content-provenance.md`](docs/research/content-provenance.md)). Anything no source gives is shown as "Not published", never guessed |
| **Demonstration data** (prototype-only) | Every flight, gate, time, status, check-in row, queue estimate, car-park space figure and alert; terminal maps; e-mail alerts | "Demonstration data" banners and Demo chips. A demo provider generates flights deterministically from the airport, date and time; the official flight provider is a stub that throws by design |
| **Kept on the device** | My journey (saved flights and places), the parked-car note, display settings, recent searches, saved offline pages, concierge consent and conversation | Browser storage only; nothing personal is stored on the server |
| **Not built** | Accounts, booking, payment, a push server (demonstration flight notifications appear only while a page is open) | Links go to the official or partner sites |

The interface is in English and Bahasa Malaysia (`/en`, `/ms`). The Malay text is a draft: a native-speaker review
and confirmation of official Malay airport names were deferred (backlog item OOS-14).

## Product tour

The [prototype gallery](docs/prototype/README.md) shows 27 critical journeys in 99 screenshots, on desktop and phone,
captured from the production build. Routes below are in English; each also exists under `/ms`.

| Area | Example route | What it does |
|---|---|---|
| Home | `/en` | Flight search with inline results, airport chooser, board preview, saved-flight card |
| Airports | `/en/airports`, `/en/kul` | Directory of 39 airports; per-airport overview with terminal choice |
| Flights | `/en/kul/flights`, `/en/kul/flights/<id>` | Departures and arrivals board; flight page with a journey timeline; save and follow |
| My journey | `/en/journey` | Saved flights, timeline and parked-car note, held in the browser |
| In the terminal | `/en/kul/map`, `/en/kul/facilities`, `/en/kul/lounges`, `/en/kul/shop-dine` | Schematic map with routes to gates; facilities with filters; lounges; shop and dine |
| Getting there | `/en/kul/transport`, `/en/kul/parking`, `/en/kul/transit` | Transport planner, parking calculator, transfer planner between terminals |
| Help | `/en/guides`, `/en/help`, `/en/notices`, `/en/search`, `/en/concierge` | Guides, help centre, travel notices, site search and the concierge |
| Inclusion | `/en/accessibility` | Accessibility hub. Display settings (theme, text size, contrast, motion) are in the site header on every page |
| Corporate | `/en/corporate` | About, business, careers, contact, governance, network, news, sustainability |
| About | `/en/about-this-prototype`, `/en/design-system` | Method and data notes; the living style guide |
| Offline | `/en/offline` | In production builds a service worker keeps guidance pages for offline reading; the offline page lists what is saved |

The concierge answers from the verified content. Until the visitor consents, answers are built in the browser and
nothing is sent; with consent, questions go to `POST /api/concierge`. If the server has `ANTHROPIC_API_KEY`, a model
may reword the grounded answer (see below); otherwise the deterministic wording is used.

## Running it

All commands run from this folder (`malaysia-airports/`). It sits inside a larger repository whose root holds an
unrelated site; the CI workflow for this app is at
[`../.github/workflows/malaysia-airports-ci.yml`](../.github/workflows/malaysia-airports-ci.yml).

**Requirements.** Node.js 22 (the version CI uses; Next.js 16.4.6 itself requires 20.9 or later) and npm. Install
with the lockfile:

```bash
npm ci
```

**Development server** (http://localhost:3000; `/` redirects to `/en` or `/ms` by the `lang` cookie, then
`Accept-Language`):

```bash
npm run dev
```

**Production build and server.** Status codes, prefetching and the proxy only behave as in production here.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
npm start                                   # next start, port 3000; add -- -p <port> to change it
```

`.next` is not in git. This working copy holds the build verified in round three (build ID
`MtgRkGApHKutmCFmH-yix`, built for `http://localhost:3100`), which `npx next start -p 3100` serves as is; a fresh
clone must build first. When presenting, remember that flight statuses follow the server clock and timelines follow
the browser clock: change both or neither ([gallery](docs/prototype/README.md#observations-made-while-capturing),
item 6).

**Checks and tests.**

| Command | What it runs |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (run `npm run typegen` first on a clean checkout for the route types) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`), including `validateAllContent()`: bad content fails the run |
| `npm run check` | `next typegen`, type check, lint and unit tests in one go |
| `npm run e2e` | Playwright on a desktop (1440 x 900) and a phone (Pixel 7, 390 x 844) Chromium project. It builds and serves on port 3100, or reuses a server already there (not on CI). axe-core scans run inside the specs with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` (`e2e/support/axe.ts`) |
| `npm run audit:prod` | `npm audit` of production dependencies at high severity |
| `npm run budgets` | Lighthouse CI against `lighthouserc.json` (starts `next start -p 3100`; the port must be free). It has never been run; on the manual Lighthouse results it would fail as configured (see [Key results](#key-results)) |
| `node scripts/design-tokens.mjs` | Contrast audit of the colour tokens in every theme; rewrites `src/components/design-system/token-data.ts` and exits 1 below threshold or if the no-JavaScript dark fallback has drifted |

To run the end-to-end suite against a server you start yourself, start it with the trusted test header, or every
worker shares one rate-limit bucket and flight pages answer 429:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build    # as in verification; skip if .next is current
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off
PLAYWRIGHT_WEBKIT=1 npx playwright test --project=webkit-phone   # after `npx playwright install webkit`; never run yet
```

The full reproduction recipe used for verification is in [`docs/qa/verification.md`](docs/qa/verification.md),
section T6, and [`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 3.3.

## Environment variables

Checked against the code on 21 November 2026. None is required for local use. "Build" means the value is fixed when
`next build` runs; "server" means `next start` reads it at run time.

| Variable | Read at | Default | Effect |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Build | `http://localhost:3000` | Public origin for canonical, `hreflang`, sitemap and Open Graph URLs, and for the concierge's `Origin` check. An `https:` value adds `upgrade-insecure-requests` to the CSP. Set it to the real origin before building |
| `SITE_INDEXING` | Build | unset | Only the value `allow` lets search engines index the site: it removes the `X-Robots-Tag: noindex, nofollow` header and the `noindex` robots meta. (In the code the resulting constant is `SITE_INDEXABLE`; there is no variable of that name.) |
| `APP_VERSION` | Build | Build time, to the minute | Names the service worker's caches and triggers the "new version" prompt; exposed as `NEXT_PUBLIC_APP_VERSION` and reported by `/api/health`. CI sets it to the commit for repeatable builds |
| `NEXT_DIST_DIR` | Build and dev | `.next` | Output folder, so several dev servers can run in one checkout (`NEXT_DIST_DIR=.next-map npx next dev -p 3201`). Production builds use the default |
| `TRUSTED_CLIENT_IP_HEADER` | Server | unset | A header your CDN overwrites with the client address (for example `cf-connecting-ip`); rate limits key on it. Must match `[a-z0-9-]`, at most 64 characters |
| `TRUSTED_PROXY_HOPS` | Server | unset | Alternative to the header: how many of your own proxies append to `X-Forwarded-For` (a whole number from 1 to 9); the client is that many entries from the right. With neither variable, a production server warns at start-up and falls back to the address nearest the server, which a client can forge, with a site-wide ceiling of 10 times each per-client limit |
| `ANTHROPIC_API_KEY` | Server | unset | Optional. Turns on AI rewording of concierge answers: the server sends the question, the deterministic answer and its source statements (no flight id, no client details) to the Anthropic Messages API. The reply must pass a fact guard (no number or name absent from the context); any failure, refusal or timeout (8 s) keeps the deterministic text. Secret: never commit it |
| `CONCIERGE_MODEL` | Server | `claude-opus-5-5` | Model id for that rewording |
| `CONCIERGE_MAX_CALLS_PER_MINUTE`, `_PER_DAY`, `_PER_MONTH` | Server | 30, 2,000, 40,000 | Site-wide caps on paid model calls (per process); a circuit breaker opens after 5 consecutive failures for 60 s |
| `HEALTH_TOKEN` | Server | unset | Secret of at least 16 characters. A request to `/api/health` with `Authorization: Bearer <token>` gets the detailed body (provider modes, runtime, model-budget, CSP-report and metrics counters); others get `{ status, build }` |
| `GIT_COMMIT`, `VERCEL_GIT_COMMIT_SHA` | Server | unset | Commit shown in the detailed health body |

Test-only: `PLAYWRIGHT_BASE_URL` (run the suite against a running server; no server is started), `PLAYWRIGHT_WEBKIT=1`
(add the WebKit phone project), `E2E_STATUS_CODES=1` (run the status-code test against an external server), `CI`
(retries, two workers, no server reuse).

## Project structure

```text
malaysia-airports/
├── src/
│   ├── app/                  App Router. [lang]/ holds every page in en and ms; [lang]/[airport]/ the airport
│   │                         sections; api/ the flights (demo), concierge, health, csp-report and metrics routes;
│   │                         sitemap.ts, robots.ts, manifest.ts, global-not-found.tsx, globals.css (design tokens)
│   ├── components/           UI by area: shell, home, airport, flights, map, facilities, transport, parking,
│   │                         commerce, guides, help, concierge, search, corporate, platform, design-system, ui, art,
│   │                         common
│   ├── content/              The typed content layer: zod schemas (types.ts), sources, airports/ (one file per
│   │                         airport with content), guides, FAQs, notices, corporate; content.test.ts validates it
│   ├── lib/                  Logic: providers (flight feed, demo and official stub), flights, journey, map, search,
│   │                         concierge (engine, rate limits, fact guard, optional rewording), i18n, seo, storage
│   ├── fonts/                Self-hosted Fraunces, Hanken Grotesk and Geist Mono (woff2) and their definitions
│   ├── proxy.ts              Locale redirects and per-route request limits
│   └── instrumentation.ts    Start-up warning when no trusted client-address source is configured
├── e2e/                      Playwright specs (11) and the shared axe helper (support/axe.ts)
├── scripts/design-tokens.mjs Contrast audit of the colour tokens
├── docs/                     Research, strategy, design, engineering, prototype gallery and QA (indexed below)
├── next.config.ts            Security headers, CSP, indexing switch, build version
├── playwright.config.ts      vitest.config.ts  eslint.config.mjs  lighthouserc.json  tsconfig.json
└── AGENTS.md                 Framework note for coding agents (written by next dev; keep it)
```

Engineering rules for anyone changing the code: [`docs/engineering/build-spec.md`](docs/engineering/build-spec.md)
(the contract), [`docs/engineering/next16-notes.md`](docs/engineering/next16-notes.md) (Next.js 16 rules) and the
per-area hand-off notes in [`docs/engineering/handoffs/`](docs/engineering/handoffs/).

## Content and provenance model

- **Content is code.** Every fact lives in a TypeScript module under `src/content/`, validated by zod schemas and
  cross-reference checks at test time. There is no CMS or database. At handover the registry holds 39 airports (six
  with a content file: KUL, PEN, BKI, KCH, LGK and SZB; the rest have an overview or a directory listing), 254
  sources, 11 guides, 11 help topics and 28 FAQs, and `validateAllContent()` reports 0 issues.
- **Every published item cites at least one source** by id. Each source records its publisher, URL, retrieval date,
  its own date (or `undated`) and its kind: `official`, `government`, `operator`, `news`, `aggregator` or `other`.
- **Every piece of guidance carries one of four provenance tags**, shown on screen: `official` (an authoritative
  source: the airport, an airline or operator, or government), `estimated` (our calculation, a typical value, or a
  fact only third parties report), `suggestion` (optional advice) and `demo` (simulated). Tests enforce that
  "Official" needs an authoritative source and that social-media posts are never Official.
- **Unknown values stay empty** and the interface prints "Not published".
- **Publishing rule for research facts:** only facts from search evidence with high or medium confidence were
  published; background knowledge and low-confidence facts were withheld. Counts per airport are in
  [`docs/research/content-provenance.md`](docs/research/content-provenance.md).
- **Operational data sits behind provider interfaces** (`src/lib/providers/`). Boards, flight pages and My journey
  read a server feed (`/[lang]/[airport]/flights/feed`) with a cache, a timeout and last-known fallback; only demo
  implementations exist. The mapping to a production CMS and to MAHB's systems is in
  [`docs/engineering/architecture.md`](docs/engineering/architecture.md), sections 4 and 5.

## Deliverables index

The brief itself is not among the project files. Deliverables 1, 2, 3, 5 and 8 and Phase 7 are numbered in the
documents themselves; the placement of 4, 6, 7 and Phase 10 follows the project's list of deliverables.

| # | Deliverable | Main document | Supporting material |
|---|---|---|---|
| 1 | Global benchmarking report and audit of the current MAHB sites | [`docs/strategy/benchmark-report.md`](docs/strategy/benchmark-report.md); [`docs/research/audit/mahb-audit.md`](docs/research/audit/mahb-audit.md) | Ten benchmark reports and the scoring matrix in [`docs/research/benchmarks/`](docs/research/benchmarks/) ([`matrix.json`](docs/research/benchmarks/matrix.json)); [`a-passenger-klia.md`](docs/research/audit/a-passenger-klia.md); [`firsthand-observations.md`](docs/research/audit/firsthand-observations.md); raw captures in [`docs/research/direct/`](docs/research/direct/) and [`docs/research/screenshots/`](docs/research/screenshots/) |
| 2 | Product strategy | [`docs/strategy/product-strategy.md`](docs/strategy/product-strategy.md) | |
| 3 | Sitemap and information architecture | [`docs/strategy/sitemap.md`](docs/strategy/sitemap.md) | The generated sitemap, `src/app/sitemap.ts` |
| 4 | Design system, direction and concepts | [`docs/design/design-system.md`](docs/design/design-system.md); [`docs/design/direction.md`](docs/design/direction.md) | The three homepage concepts, each an `index.html` with screenshots: [`a-tenun`](docs/design/concepts/a-tenun/), [`b-rimba`](docs/design/concepts/b-rimba/), [`c-laluan`](docs/design/concepts/c-laluan/); the panel's [`evaluation.md`](docs/design/concepts/evaluation.md); the living style guide at `/en/design-system`; [`handoffs/design-system.md`](docs/engineering/handoffs/design-system.md) |
| 5 | Prototype of the critical journeys | [`docs/prototype/README.md`](docs/prototype/README.md) (27 journeys, 99 screenshots) | [`docs/prototype/screenshots/`](docs/prototype/screenshots/) |
| 6 | Working implementation | This folder: `src/`, `e2e/`, the configuration and this README | [`build-spec.md`](docs/engineering/build-spec.md), [`next16-notes.md`](docs/engineering/next16-notes.md), [`handoffs/`](docs/engineering/handoffs/) (integration log: [`integration.md`](docs/engineering/handoffs/integration.md)) |
| 7 | Quality assurance report | [`docs/qa/qa-report.md`](docs/qa/qa-report.md) | Audits: [`accessibility.md`](docs/qa/accessibility.md), [`performance.md`](docs/qa/performance.md), [`usability.md`](docs/qa/usability.md), [`content-integrity.md`](docs/qa/content-integrity.md), [`security.md`](docs/qa/security.md) (each with a `.json` of findings). Backlog: [`fix-backlog.md`](docs/qa/fix-backlog.md). Fix logs: [`docs/qa/fixes/`](docs/qa/fixes/). Verification, one section per round: [`verification.md`](docs/qa/verification.md). Panel: [`panel-summary.md`](docs/qa/panel/panel-summary.md) (round one), [`re-review.md`](docs/qa/panel/re-review.md) (round two) and the lens reports in [`docs/qa/panel/`](docs/qa/panel/). Lighthouse summaries: [`lighthouse/`](docs/qa/lighthouse/), [`lighthouse-after/`](docs/qa/lighthouse-after/), [`lighthouse-round2/`](docs/qa/lighthouse-round2/), [`lighthouse-round3/`](docs/qa/lighthouse-round3/) |
| 8 | Implementation roadmap | [`docs/strategy/roadmap.md`](docs/strategy/roadmap.md) | |
| Phase 7 | Technical architecture and integration | [`docs/engineering/architecture.md`](docs/engineering/architecture.md) | |
| Phase 10 | Security, privacy and resilience | [`docs/engineering/security.md`](docs/engineering/security.md) | Edge rules in [`docs/engineering/edge/`](docs/engineering/edge/); the independent review [`docs/qa/security.md`](docs/qa/security.md); the [CI workflow](../.github/workflows/malaysia-airports-ci.yml) |

Research inputs behind the content: fact files in [`docs/research/facts/`](docs/research/facts/) and
[`docs/research/content-provenance.md`](docs/research/content-provenance.md).

## Key results

Figures are copied from [`docs/qa/verification.md`](docs/qa/verification.md) (round three, 21 November 2026) and
[`docs/qa/qa-report.md`](docs/qa/qa-report.md); "before" is the QA evaluations of 18 November (tests: integration,
17 November). All browser figures are lab results in Chromium on a production build: no field data, no real devices,
no Safari.

**Measured**

| Check | Before | After (round three) | Target | Met? |
|---|---|---|---|---|
| Types, lint, build | 0 errors, 0 problems | 0 errors, 0 problems, build with 0 warnings | Clean | Yes |
| Unit tests (Vitest) | 363 passed | 504 passed in 32 files, 0 failed | All pass | Yes |
| End-to-end tests (Playwright, desktop and phone) | 178: 176 passed, 2 skipped | 354: 348 passed, 0 failed, 6 deliberate skips | All pass | Yes |
| axe-core | 41 call sites, incomplete tag lists | 0 violations at 50 call sites in 11 specs, both projects | 0 | Yes (automated) |
| WCAG 2.2 A and AA (manual audit) | 8 of 55 criteria failing | All 8 fixed and verified; no known open AA failure in the tested scope | AA | Partly: conformance cannot be claimed without screen-reader and WebKit testing |
| Lighthouse accessibility | 100 | 100 on all 42 runs | 95 or more | Yes |
| Broken internal links | 0 (380 pages) | 0 broken, 0 missing anchors: 438 static pages (1,154 links), 285 rendered pages (1,516 links), 434 search-index documents | None | Yes |
| LCP, Lighthouse mobile, simulated slow 4G | 9 of 15 pages pass; 6 at 4.1 to 4.8 s | 10 of 10 pages at 0.92 to 1.11 s | 2.5 s or less | Yes (lab) on the 10 re-measured; flight page, shop and dine and transit (4.1 to 4.4 s before) not re-measured |
| LCP, congested airport Wi-Fi profile | 2.8 to 2.9 s | 2.57 s (`/en`), 2.68 s (board) | 2.5 s or less | No |
| CLS | Up to 0.29 (desktop) | At most 0.003 (Lighthouse, 10 of 10) | 0.1 or less | Yes (lab) |
| Interaction latency (Pixel 7 profile, 4x CPU) | Worst interaction per page: home 408 ms, board 784 ms; 4 of 6 pages over 200 ms | Every measured interaction under 200 ms except the `/en/kul` airport switcher (224 ms in 2 of 9 runs) | 200 ms or less | Partly (lab) |
| Total blocking time (load-time proxy for INP) | 338 to 1,978 ms; 0 of 15 pages at 200 ms or less | 200 ms or less on 3 of 10 pages (largest 353 ms) | 200 ms or less | No |
| Lighthouse performance (mobile) | 0 of 15 at 95 or more (56 to 92) | 7 of 10 (92 to 99) | 95 or more | No |
| First-load JavaScript (gzip) | 250 to 275 KB on every route | `/en` 228.7 KB (budget 250); content and guidance pages about 199 to 227 KB (budget 170); no route over 250 KB | Budgets | Partly |
| Sideways scroll at 320 px, 112% and 125% text, three themes | Present on two pages | 0 in 108 loads on 18 pages | None | Yes |
| Known vulnerabilities (`npm audit`) | 0 in production dependencies; 16 high in development tooling (one advisory) | 0 in production dependencies, 0 in all | 0 | Yes |
| QA backlog, P0 and P1 items | 101 open | 85 verified, 16 not verified (9 of them P0), 0 regressed | All P0 before any public pilot | No |

The backlog merged 164 findings (86 from QA, 64 from the panels, 14 from a documentation review) into 105 items.

**Judgement**

- The review panel's weighted score rose from 70.8% (round one) to 74.5% (round two), against 42.5% for the
  current MAHB sites, 79.0% for Heathrow and the strategy's target of 90.5%. These are calibrated expert scores on a
  1 to 5 rubric, with about 3 points of uncertainty, not measurements. All three round-two lenses judged it not ready
  for public launch (the business lens in those words, the other two through their launch blockers); the business
  lens supports a closed pilot at KLIA once its conditions are met
  ([`docs/qa/panel/re-review.md`](docs/qa/panel/re-review.md), section 6).
- Task success: a simulated walkthrough by one expert evaluator (no users) gave 78% task completion and 72% unaided
  success before the fixes, against the brief's 95% and 90%. It was not re-measured; only a study with real
  passengers can test those targets ([`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 6).
- Content: the content audit found no fabricated value; every extracted figure traced to a sourced record or to
  labelled demonstration or estimated data.

## Known limitations

Ranked in full, with owners, in [`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 11. In brief:

1. **No live operational data** (prototype-only). There is no flight or operations feed; status lines stamp the
   current time and default to "No disruption reported", which overstates freshness. The concierge still generates
   demonstration flights on the device.
2. **Day-of-travel errors remain**: a past arrive-by time shown as "Next", a delayed flight mixing two time bases,
   and "Done: Arrange assistance" when nothing was arranged.
3. **No evidence from real users, assistive technology, Safari or the field.** No usability study, no physical
   screen reader, no WebKit or iPhone run, no real device, no field Core Web Vitals.
4. **Facts for assisted travellers are missing**: accessible toilets, lifts, step-free routes per mode, airline
   assistance rules. These need MAHB, airlines and government sources.
5. **Performance budgets are not met**: total blocking time, congested Wi-Fi LCP, JavaScript and byte budgets (see
   above). The Lighthouse CI step would fail as configured.
6. **CI has never run**, and the QA crawl and measurement scripts used for verification live outside the
   repository, so another team cannot yet rerun every check in the QA report.
7. **Content depth**: six of 39 airports have a content file; Kuching and Langkawi transport and parking pages
   return 404; terminal car-park rates are unverified; the Malay text is a draft.
8. **Concierge and search** sometimes miss the question, and surfaces can disagree (for example a parking rate
   marked unverified in the concierge but not on the page).
9. **No commerce or accounts**; metrics are held in memory; the enforced CSP still allows `'unsafe-inline'`.
10. **Deployment configuration**: rate limits and the model budget live in one process's memory; production must
    set a trusted client-address source; the edge and WAF rules in `docs/engineering/edge/` are not deployed; there
    is no `security.txt`.
11. **Smaller items seen while capturing the gallery**: React error #419 logged on not-found pages; next-day flights
    in short previews carry no date marker; an offline-status message before the service worker is ready
    ([gallery](docs/prototype/README.md#observations-made-while-capturing)).
12. **Documentation drift**: [`architecture.md`](docs/engineering/architecture.md), section 1.1, still describes
    flight boards generated in the browser; since the fix rounds the board, flight pages and My journey read the
    server feed. The fix logs were more optimistic than verification in every round; treat
    [`verification.md`](docs/qa/verification.md) as the record.

## Credits and licences

Third-party names, including Malaysia Airports, MAHB, KLIA and the benchmarked airports, belong to their owners and
are used only to describe and compare. The brand mark and illustrations are the project's own; no MAHB logo is used.

**Fonts** (self-hosted woff2, latin subsets; copyright and licence read from each file's name table):

| Family | Use | Copyright | Licence |
|---|---|---|---|
| Fraunces | Display headings | 2020 The Fraunces Project Authors (github.com/undercasetype/Fraunces) | SIL Open Font License 1.1 |
| Hanken Grotesk | Interface text | 2021 The Hanken Grotesk Project Authors (github.com/marcologous/hanken-grotesk) | SIL Open Font License 1.1 |
| Geist Mono | Times, gates, codes, tables | 2024 The Geist Project Authors (github.com/vercel/geist-font) | SIL Open Font License 1.1 |
| Bricolage Grotesque | Concept B only (`docs/design/concepts/b-rimba/fonts/`) | 2022 The Bricolage Grotesque Project Authors (github.com/ateliertriay/bricolage) | SIL Open Font License 1.1 |

The Fraunces italic file in `src/fonts/` is used only by the script that renders the icons and Open Graph image.
The repository does not yet include the OFL licence texts next to the font files; add them before redistributing.

**Runtime libraries** (direct dependencies, versions as installed):

| Package | Version | Licence |
|---|---|---|
| next | 16.4.6 | MIT |
| react, react-dom | 19.3.0 | MIT |
| radix-ui | 1.8.1 | MIT |
| lucide-react (icons) | 1.73.0 | ISC |
| minisearch (site search) | 7.2.0 | MIT |
| zod (content schemas) | 4.6.7 | MIT |
| clsx | 2.1.1 | MIT |
| tailwind-merge | 3.7.0 | MIT |
| server-only | 0.0.1 | MIT |

**Build and test tools**: Tailwind CSS and `@tailwindcss/turbopack` 4.3.3 (MIT), TypeScript 5.9.3 (Apache-2.0),
ESLint 9.39.5 and `eslint-config-next` 16.4.6 (MIT), Vitest 5.1.0 (MIT), tsx 4.23.15 (MIT), Playwright
(`@playwright/test` 1.63.0, Apache-2.0), axe-core 4.14.1 with `@axe-core/playwright` 4.14.0 (MPL-2.0). Lighthouse CI
(`@lhci/cli` 0.16.0) is fetched by `npx` when `npm run budgets` runs and is not a project dependency.

A count of the installed production dependency tree (116 packages, from `npm ls --omit=dev`) found MIT, Apache-2.0,
ISC, BSD-3-Clause and 0BSD licences, except for two things Next.js brings in: `caniuse-lite` (CC-BY-4.0) and the
prebuilt libvips binaries of its optional image library `sharp` (LGPL-3.0-or-later, in three platform packages). This
was a count of the `license` fields, not a formal licence audit.

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
panel, three fix rounds, a second panel review, and a fourth fix round on that review's findings. Each fix round
was verified on a production build.

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

`.next` is not in git. This working copy holds the final build verified in round four (build ID
`ygqxXIFcmSWq51rkxYSGE`, built for `http://localhost:3100`), which `npx next start -p 3100` serves as is; a fresh
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
| `npm run budgets` | Lighthouse CI against `lighthouserc.json` (starts `next start -p 3100`; the port must be free). Run locally once, in round four, after a configuration fix: it fails with 14 assertion failures, as the budgets predict (see [Key results](#key-results)). It has not run on a CI runner |
| `node scripts/design-tokens.mjs` | Contrast audit of the colour tokens in every theme; rewrites `src/components/design-system/token-data.ts` and exits 1 below threshold or if the no-JavaScript dark fallback has drifted |

To run the end-to-end suite against a server you start yourself, start it with the trusted test header, or every
worker shares one rate-limit bucket and flight pages answer 429:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build    # as in verification; skip if .next is current
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off
PLAYWRIGHT_WEBKIT=1 npx playwright test --project=webkit-phone   # after `npx playwright install webkit`; never run yet
```

The measurement scripts verification uses (static and rendered link crawls, search-index, canonical and `$RC` checks,
first-load JavaScript, the Lighthouse harness, interaction latency and layout shift) are in `scripts/qa/`; how to run
each against a local build is in [`scripts/qa/README.md`](scripts/qa/README.md). The full reproduction recipe used
for verification is in [`docs/qa/verification.md`](docs/qa/verification.md), section F9, and
[`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 3.3.

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
| `HEALTH_TOKEN` | Server | unset | Secret of at least 16 characters. A request to `/api/health` with `Authorization: Bearer <token>` gets the detailed body (provider modes, runtime, model-budget, CSP-report and metrics counters, and the metric store's state, `measurementStore`); others get `{ status, build }` |
| `METRICS_STORE` | Server | `file` | Where `/api/metrics` keeps its aggregate counts: `file` (one `next start` instance), `kv` (several instances or a serverless host) or `memory` (tests) |
| `METRICS_STORE_FILE` | Server | `.data/metrics.json` | The file store's path (git-ignored). Put it on a persistent volume, or the counts last only as long as the container. If it cannot be written, counting continues in memory and the health body reports `degraded: true` |
| `METRICS_KV_URL`, `METRICS_KV_TOKEN` | Server | unset | With `kv`: a Redis-compatible REST endpoint (https only) and its token. Secret: never commit the token. Without both, the file store is used ([`architecture.md`](docs/engineering/architecture.md), section 6.9) |
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
├── e2e/                      Playwright specs (14) and the shared axe helper (support/axe.ts)
├── scripts/design-tokens.mjs Contrast audit of the colour tokens
├── scripts/qa/               Verification's measurement scripts (crawls, canonical, $RC, first-load JS,
│                             Lighthouse, interaction latency, layout shift) and their README
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
| 7 | Quality assurance report | [`docs/qa/qa-report.md`](docs/qa/qa-report.md) | Audits: [`accessibility.md`](docs/qa/accessibility.md), [`performance.md`](docs/qa/performance.md), [`usability.md`](docs/qa/usability.md), [`content-integrity.md`](docs/qa/content-integrity.md), [`security.md`](docs/qa/security.md) (each with a `.json` of findings). Backlog: [`fix-backlog.md`](docs/qa/fix-backlog.md). Fix logs: [`docs/qa/fixes/`](docs/qa/fixes/). Verification, one section per round (four rounds): [`verification.md`](docs/qa/verification.md). Panel: [`panel-summary.md`](docs/qa/panel/panel-summary.md) (round one), [`re-review.md`](docs/qa/panel/re-review.md) (round two) and the lens reports in [`docs/qa/panel/`](docs/qa/panel/). Moderated usability study plan (re-review 6.1.13, not yet run): [`usability-study-plan.md`](docs/qa/usability-study-plan.md). Lighthouse summaries: [`lighthouse/`](docs/qa/lighthouse/), [`lighthouse-after/`](docs/qa/lighthouse-after/), [`lighthouse-round2/`](docs/qa/lighthouse-round2/), [`lighthouse-round3/`](docs/qa/lighthouse-round3/), [`lighthouse-round4/`](docs/qa/lighthouse-round4/). Measurement scripts: [`scripts/qa/README.md`](scripts/qa/README.md) |
| 8 | Implementation roadmap | [`docs/strategy/roadmap.md`](docs/strategy/roadmap.md) | |
| Phase 7 | Technical architecture and integration | [`docs/engineering/architecture.md`](docs/engineering/architecture.md) | |
| Phase 10 | Security, privacy and resilience | [`docs/engineering/security.md`](docs/engineering/security.md) | Edge rules in [`docs/engineering/edge/`](docs/engineering/edge/); the independent review [`docs/qa/security.md`](docs/qa/security.md); the [CI workflow](../.github/workflows/malaysia-airports-ci.yml) |

Research inputs behind the content: fact files in [`docs/research/facts/`](docs/research/facts/) and
[`docs/research/content-provenance.md`](docs/research/content-provenance.md).

## Key results

Figures are copied from [`docs/qa/verification.md`](docs/qa/verification.md) (round four, 21 November 2026) and
[`docs/qa/qa-report.md`](docs/qa/qa-report.md); "before" is the QA evaluations of 18 November (tests: integration,
17 November). All browser figures are lab results in Chromium on a production build: no field data, no real devices,
no Safari.

**Measured**

| Check | Before | After (round four) | Target | Met? |
|---|---|---|---|---|
| Types, lint, build | 0 errors, 0 problems | 0 errors, 0 problems, build with 0 warnings (365 static pages) | Clean | Yes |
| Unit tests (Vitest) | 363 passed | 554 passed in 36 files, 0 failed, in 7 of 7 runs | All pass | Yes |
| End-to-end tests (Playwright, desktop and phone) | 178: 176 passed, 2 skipped | 434: 428 passed, 0 failed, 6 deliberate skips (final build) | All pass | Yes |
| axe-core | 41 call sites, incomplete tag lists | 0 violations at 59 call sites in 12 specs, both projects | 0 | Yes (automated) |
| WCAG 2.2 A and AA (manual audit) | 8 of 55 criteria failing | All 8 fixed and verified; no known open AA failure in the tested scope | AA | Partly: conformance cannot be claimed without screen-reader and WebKit testing |
| Lighthouse accessibility | 100 | 100 on all 39 runs | 95 or more | Yes |
| Broken internal links | 0 (380 pages) | 0 broken, 0 missing anchors: 438 static pages (1,170 links), 285 rendered pages (1,535 links), 446 search-index documents | None | Yes |
| LCP, Lighthouse mobile, simulated slow 4G | 9 of 15 pages pass; 6 at 4.1 to 4.8 s | 10 of 10 compared pages at 0.91 to 1.12 s. A flight page 4.2 to 4.9 s, and the board 4.7 s at night with an empty window (Lighthouse CI run) | 2.5 s or less | Partly (lab): the flight page fails, as it did before (4.4 s); shop and dine and transit not re-measured |
| LCP, congested airport Wi-Fi profile | 2.8 to 2.9 s | 2.57 s (`/en`), 2.68 s (board), measured in round three; not re-measured | 2.5 s or less | No |
| CLS | Up to 0.29 (desktop) | At most 0.003 (Lighthouse mobile, 10 of 10); desktop at most 0.049 (transport) | 0.1 or less | Yes (lab) |
| Interaction latency (Pixel 7 profile, 4x CPU) | Worst interaction per page: home 408 ms, board 784 ms; 4 of 6 pages over 200 ms | All five measured interactions under 200 ms in 3 runs (worst 176 ms, the `/en/kul` airport switcher) | 200 ms or less | Yes (lab, five interactions) |
| Total blocking time (load-time proxy for INP) | 338 to 1,978 ms; 0 of 15 pages at 200 ms or less | 200 ms or less on 3 of 10 pages (largest 311 ms, the concierge) | 200 ms or less | No |
| Lighthouse performance (mobile) | 0 of 15 at 95 or more (56 to 92) | 7 of 10 (93 to 98); a flight page 68 to 75 | 95 or more | No |
| First-load JavaScript (gzip) | 250 to 275 KB on every route | `/en` 229.5 KB (budget 250); flight page 249.1 KB, 0.9 KB under 250; content and guidance pages 198.8 to 227.9 KB (target 170); no route over 250 KB | Budgets | Partly |
| Lighthouse CI budgets (`npm run budgets`, run locally) | Never run | 14 assertion failures: TBT on five URLs; script bytes on `/en` and `/ms`; performance and LCP on the board and the flight page; bytes or requests on two guidance pages | All pass | No |
| Sideways scroll at 320 px, 112% and 125% text, three themes | Present on two pages | 0 in 108 loads on 18 pages | None | Yes |
| Known vulnerabilities (`npm audit`) | 0 in production dependencies; 16 high in development tooling (one advisory) | 0 in production dependencies, 0 in all | 0 | Yes |
| QA backlog, P0 and P1 items | 101 open | 85 verified, 16 not verified (9 of them P0), 0 regressed; unchanged in round four | All P0 before any public pilot | No |
| Second panel review, team items 6.1.1 to 6.1.10 | Raised by the re-review | 9 verified, 1 partly (6.1.7 density), 0 not verified, 0 regressed; the four gallery defects verified fixed | All | Partly |

The backlog merged 164 findings (86 from QA, 64 from the panels, 14 from a documentation review) into 105 items.

**Judgement**

- The review panel's weighted score rose from 70.8% (round one) to 74.5% (round two), against 42.5% for the
  current MAHB sites, 79.0% for Heathrow and the strategy's target of 90.5%. These are calibrated expert scores on a
  1 to 5 rubric, with about 3 points of uncertainty, not measurements. All three round-two lenses judged it not ready
  for public launch (the business lens in those words, the other two through their launch blockers); the business
  lens supports a closed pilot at KLIA once its conditions are met
  ([`docs/qa/panel/re-review.md`](docs/qa/panel/re-review.md), section 6). The panel has not scored the prototype
  again since the fourth fix round.
- Task success: a simulated walkthrough by one expert evaluator (no users) gave 78% task completion and 72% unaided
  success before the fixes, against the brief's 95% and 90%. It was not re-measured; only a study with real
  passengers can test those targets ([`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 6). The plan for that
  study is in [`docs/qa/usability-study-plan.md`](docs/qa/usability-study-plan.md); it has not been run.
- Content: the content audit found no fabricated value; every extracted figure traced to a sourced record or to
  labelled demonstration or estimated data.

## Known limitations

Ranked in full, with owners, in [`docs/qa/qa-report.md`](docs/qa/qa-report.md), section 11, and as they stand
after round four in [`docs/qa/verification.md`](docs/qa/verification.md), section F8. In brief:

1. **No live operational data** (prototype-only). There is no flight or operations feed. Since round four, status
   lines say "Status not available" and give the date of the latest notice instead of a checked time; they can show
   a current state only once a live operations feed exists (OOS-02). The concierge still generates demonstration
   flights on the device (B-09).
2. **Day of travel**: the errors the second panel review found (a past time shown as "Next", two time bases on a
   delayed flight, "Done" for steps nobody confirmed) were fixed and verified in round four. Only Malaysia Airlines' assistance
   notice period is sourced; for other airlines the timeline says it does not know (D-04, needs airline data).
3. **No evidence from real users, assistive technology, Safari or the field.** No usability study (a plan exists:
   [`docs/qa/usability-study-plan.md`](docs/qa/usability-study-plan.md)), no physical screen reader, no WebKit or
   iPhone run, no real device, no field Core Web Vitals.
4. **Facts for assisted travellers are missing**: accessible toilets, lifts, step-free routes per mode, airline
   assistance rules. These need MAHB, airlines and government sources.
5. **Performance budgets are not met**: total blocking time, congested Wi-Fi LCP, JavaScript and byte budgets (see
   above). A flight page has LCP 4.2 to 4.9 s (its `h1` is streamed), and the concierge's TBT probably rose by about
   80 to 100 ms in round four. The Lighthouse CI step, run locally, fails on 14 assertions.
6. **CI has never run on a runner, and WebKit has never run.** The workflow's jobs were run locally in round four:
   every step a container can run passes except the Lighthouse budgets; CodeQL and the secret scan could not run
   there. The measurement scripts are now in `scripts/qa/`; a few older one-off checks are not
   ([`verification.md`](docs/qa/verification.md), F6 and F7).
7. **Content depth**: six of 39 airports have a content file; Kuching and Langkawi transport and parking pages
   return 404; the operating airline and the airport's own phone line are not published for 33 airports; terminal
   car-park rates are unverified; the Malay text is a draft.
8. **Concierge and search** are rule-based. The disagreements and misses the second panel review found were fixed and
   verified in round four, but neither has been tested with real passengers' questions.
9. **No commerce or accounts**; the enforced CSP still allows `'unsafe-inline'`. Per-route headers for a future checkout
   exist as an unused mechanism; how to use them is a documented plan
   ([`security.md`](docs/engineering/security.md), section 3). Measurement counts are now kept in a file or a
   Redis-compatible store and survive a restart.
10. **Deployment configuration**: rate limits and the model budget live in one process's memory; production must
    set a trusted client-address source and, with more than one instance, `METRICS_STORE=kv`; the edge and WAF rules
    in `docs/engineering/edge/` are not deployed; there is no `security.txt`.
11. **Smaller items**: density on the parking and flight pages, and 9 type sizes on four pages (re-review 6.1.7,
    partly met); the `[lang]/[...rest]` catch-all 404s send Next.js's empty error document without the site shell;
    one end-to-end test can time out when its worker's address is rate-limited (low).
12. **Fix logs and verification**: in rounds one to three the fix logs were more optimistic than verification; in
    round four every re-measured number matched except a 4 px difference and one label count (F4). Treat
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

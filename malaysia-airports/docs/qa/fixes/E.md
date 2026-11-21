# Fix log: package E (platform, performance and security)

Round: fix round after the QA and panel evaluation, resumed on 21 November 2026 after the first
attempt stopped on a usage limit (`docs/qa/fixes/_interrupted-attempt.md`). For package E that
attempt changed one file, `src/proxy.ts`, and the change was package B's (the B-14 flight-route
check and its matcher entry). It was reviewed and kept as it is; everything below was done in the
resumed round.

**Result:** 18 fixed, 6 partially fixed, 0 not fixed, 1 needs MAHB data (E-25, out of scope).

## Cross-package changes (read first)

Each is the smallest change that let a package E fix work; none refactors the owner's code.

| File (owner) | Change | Why |
|---|---|---|
| `src/app/[lang]/privacy/page.tsx` (D) | `<DeviceData />` wrapped in `<I18nScope lang={lang} namespaces={['corporatePages.privacy']}>`; `I18nScope` added to the existing `@/lib/i18n` import | E-11: corporate copy left the root dictionary; DeviceData is the only Client Component that reads it |
| `src/app/[lang]/design-system/page.tsx` (A) | The page's outer fragment became `<I18nScope lang={lang} namespaces={['designSystem']}>`; import added | E-11: same, for the design-system copy |
| `src/lib/concierge/knowledge.server.ts` (B) | `import 'server-only';` at the top, with a comment | E-23 hand-off; the package is now installed |

Each edited line carries a "Package E (fix round …)" comment.

## How it was verified

- Own dev server: `NEXT_DIST_DIR=.next-E npx next dev -p 3205` (restarted once, by its own PIDs;
  stopped by PID at the end; `.next-E` deleted). No `next build` was run, so everything that
  exists only in a production build (Lighthouse scores, first-load JavaScript, prerendered HTML
  size, `Cache-Control` on 404s, the service worker) is marked "needs the verification build".
- `npx tsc --noEmit`: clean (whole project, last run 21 November 2026).
- `npx eslint` on every package E path plus the three cross-package files: clean.
- `npx vitest run`: 32 files, 495 tests, all passing. New or extended: `server.test.ts`,
  `api.test.ts`, `storage.test.ts`, `locale.test.ts`, `i18n.test.ts`, `seo.test.ts`,
  `security-headers.test.ts`, `legacy-redirects.test.ts`, `sw-routes.test.ts`, `metrics.test.ts`.
- Playwright against the dev server: `e2e/platform.spec.ts`, desktop and phone: 28 passed, 8
  skipped (production-only: CSP violations, sitemap 200s, 404 cache headers, service worker), 2
  failed, the same test on both projects:
  the global 404 test, because `next dev` routes `/no-such-file.txt` into `[lang]` and shows the
  framework's 404 (checked with and without this round's changes, and after a restart; the test is
  for `next build && next start`, where the designed page was verified before). `smoke`,
  `concierge` and `corporate` specs (desktop): 37 passed, 1 failed ("unknown pages answer 404":
  `next dev` answers 200, the same expected dev difference package A records).
- curl against the dev server for every API change (results in the items below).
- Screenshots looked at (4): `/en` 390x844 light, `/en` 1440x900 dark, `/en/privacy` 1440x900
  (scoped corporate copy renders), `/en/design-system` 1440x900. A scripted pass over these and
  `/ms/kul/parking` at 390x844 found no console errors and no untranslated dictionary keys.

## Findings

### E-01 (P0, critical) Mobile performance below target; budgets not enforced: partially fixed

- **Changed:** `lighthouserc.json` (new): mobile, simulated throttling, median of 3, fails below
  performance 0.95, above TBT 200 ms, CLS 0.1, LCP 2.5 s; home script bytes 250 KiB; guidance
  pages 500 KiB and 40 requests. `.github/workflows/malaysia-airports-ci.yml` (new, repository
  root) runs it on `/en`, `/ms`, `/en/kul/flights`, one current flight page (id fetched from
  `/api/flights` at run time, since ids carry the date), `/en/journey`, a guide and KLIA parking.
  `package.json`: `budgets`, `check`, `typegen`, `audit:prod` scripts. This package's own
  performance items are done (E-02, E-03 storage part, E-11 partial, E-12, E-24).
- **Not yet:** "all 15 pages reach 95" depends on A-09, A-10, B-06, B-07 and the open hand-offs
  under E-03 and E-11. Needs the verification build and a Lighthouse run.

### E-02 (P0, high) Root loading.tsx streams every page through a fallback: fixed (measurement pending)

- **Changed:** `src/app/[lang]/loading.tsx` deleted. Every dynamic page already awaits its
  `params` inside its own `<Suspense>` (checked for all 41 page files), so no route lost a needed
  boundary; `src/app/[lang]/layout.tsx` needed no change.
- **Verified:** on the dev server the `/en` `<h1>` moved from byte 42,021 to 21,489 of the HTML
  and the `aria-busy` page skeleton is gone from every page; the boundaries left on `/en` are the
  header's `usePathname` leaves (package A), which resolve at build time for static routes.
- **Hand-off to A** (from the backlog): the `[airport]/layout.tsx` header fallback. **Needs the
  verification build:** desktop CLS on `/en`, `/ms`, `/en/kul`, `/en/concierge` and mobile LCP.

### E-03 (P0, high) 250 to 312 KB of first-load JavaScript: partially fixed

- **Changed:** `src/lib/storage.ts` has a small `check` + `validator` toolkit and `createStore`
  accepts any `{ safeParse }` validator (zod schemas still work); `src/lib/stores.ts` and
  `src/lib/preferences.ts` use it and import nothing at runtime from `src/content/types.ts` (the
  terminal list is a compile-checked `Record<TerminalId, true>`); `src/lib/locale.ts` (on every
  link) no longer imports `@/content/types` at runtime either.
- **Verified:** typecheck, `storage.test.ts` (unknown keys dropped, optional keys absent,
  validation without zod).
- **Still open, other packages:** zod classic stays in the client while other client stores use
  it (`use-concierge.ts`, `flight-alerts.ts`, `site-search.ts`, `trip-options.ts`, `needs.ts`,
  `follow.ts`: switch to `validator(check…)`), and many client components import runtime values
  from `src/content/types.ts` (D: a zod-free module). Icon registry and lazy dialogs (A), demo
  generator (B). Bytes need the verification build.

### E-04 (P0, high) Concierge buffers the whole body: fixed

- **Changed:** `src/lib/concierge/request.ts` `readBodyWithLimit`: a declared `Content-Length`
  over 4,096 bytes (or a malformed one) is refused unread; otherwise the body is read as a stream
  with a byte counter and cancelled past 4,096 bytes; bytes are counted, not UTF-16 units; invalid
  UTF-8 is a 400. `src/app/api/concierge/route.ts` uses it.
- **Verified:** `server.test.ts` covers both paths (a 200 MB stream is cut off after one 64 KB
  chunk; a declared 200 MB length pulls at most one chunk; 2,049 two-byte characters are refused).
  curl on the dev server, 200,000,000-byte POSTs with and without `Content-Length`, three rounds:
  413 in 14 ms each; `next-server` RSS moved by +1.9, +3.5 and +10.3 MB per pair (dev-server
  noise of the same size appears without any request); before the fix it rose by 565 MB.

### E-05 (P0, high) Rate limit keyed on a client-supplied X-Forwarded-For: fixed

- **Changed:** `src/lib/concierge/rate-limit.ts`: `clientKey` reads only `TRUSTED_CLIENT_IP_HEADER`
  (a CDN header) or the entry `TRUSTED_PROXY_HOPS` from the right of `X-Forwarded-For`; never the
  first entry; unconfigured, all clients share one bucket (fails safe). Buckets sit behind
  `RateLimitStore` (sync or async). `ModelBudget`: site-wide per-minute, daily and monthly caps
  (env-configurable), a circuit breaker (5 failures, 60 s, one trial call) and counters, shared
  process-wide and reported to authenticated monitoring by `/api/health`. The route counts every
  request that passes the origin and media-type checks, including invalid ones.
- **Verified:** `server.test.ts`: trusted-source key selection; 30 rotating `X-Forwarded-For`
  values behind one trusted hop give exactly 10 allowed; through the real `POST` handler, 12
  invalid requests with rotating values give ten 400s then 429s; budget caps and breaker. curl:
  12 invalid posts with rotating values → 400 ×4 then 429 ×8 (the bucket had been partly used).
  **Deployment note:** production must set one of the two variables (security.md, section 4).

### E-06 (P0, medium) No CI; Chromium only; axe tags incomplete: fixed (first run pending)

- **Changed:** `.github/workflows/malaysia-airports-ci.yml` (paths `malaysia-airports/**`, pull
  requests and manual runs): `npm ci`, `npm audit --omit=dev --audit-level=high` as a gate,
  `next typegen`, `tsc`, lint, unit tests, build, Playwright desktop + phone + `webkit-phone`,
  Lighthouse CI, CodeQL (javascript-typescript), gitleaks over the full history (`fetch-depth: 0`).
  `.github/dependabot.yml` (npm in `/malaysia-airports`, GitHub Actions). `deploy.yml` untouched.
  `e2e/support/axe.ts` exports `AXE_TAGS` (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) and
  `expectNoAxeViolations`; `e2e/platform.spec.ts` uses it. `playwright.config.ts` adds the
  `webkit-phone` project (iPhone 14 at 390x844) when `PLAYWRIGHT_WEBKIT=1`; CI installs WebKit
  and sets it. WebKit is not installed in this environment (only Chromium in
  `/opt/pw-browsers`), so it is off locally, as documented in the config.
- **Verified:** both YAML files parse; every local step of the job passes (audit 0/0, tsc, lint,
  495 unit tests). Not verified: a run on GitHub (no push from this round) and the build step.
- **Hand-off to A, B, C, D:** switch your spec's local `AXE_TAGS` to `e2e/support/axe.ts` (seven
  specs still omit wcag21a; shell and smoke already include it).

### E-07 (P0, medium) Any website can post to the concierge: fixed

- **Changed:** `request.ts` `isJsonMediaType` (exact `application/json`, optional
  `charset=utf-8`), `isSameOriginRequest` (`Sec-Fetch-Site` other than `same-origin`/`none` → 403;
  an `Origin` not among `siteOrigins`: `NEXT_PUBLIC_SITE_URL` and the request's own origin → 403);
  the route checks both before counting.
- **Verified:** unit tests (media types, origins); handler test: a cross-site request gets 403
  with no `X-RateLimit-Remaining`; `text/plain;x=application/json` gets 415. curl: 415, 403, and a
  same-origin request 200. `platform.spec.ts` "the concierge refuses other sites" passes.

### E-08 (P0, medium) No limits on /api/flights, /api/health or dynamic pages; no edge config: fixed (deployment is OOS-11)

- **Changed:** `src/proxy.ts` applies `ROUTE_POLICIES` (flights 60/1 s, health 10/6 s, reports 30,
  other API 60, per-request pages 60) through `createRouteLimiter` (shared-store factory) before
  B's flight-route check; the matcher adds `/api`, `/api/*` except the concierge (whose body the
  proxy must not buffer), and journey content. `next.config.ts`
  `experimental.proxyClientMaxBodySize: '16kb'`. Edge rules as configuration:
  `docs/engineering/edge/rate-limits.nginx.conf` and `edge-rules.yaml` (per-route buckets, bot
  scoring, body limits); `security.md` section 4 rewritten.
- **Verified:** unit test: a 300-request burst to the flights policy gets 429 from request 61.
  curl: 70 requests to `/api/flights` → 61 × 200 (one token refilled), 9 × 429 with `Retry-After`.

### E-09 (P1, medium) CSP allows inline script, no reporting; checkout blocked: partially fixed

- **Changed:** `src/lib/seo/security-headers.ts`: `Content-Security-Policy-Report-Only` with
  `script-src 'self' 'sha256-<preferences script>' 'report-sample'`,
  `require-trusted-types-for 'script'`, `report-uri /api/csp-report`, `report-to csp`, plus
  `Reporting-Endpoints`; the hash is computed in `next.config.ts` from `PREFERENCES_INIT_SCRIPT`.
  `src/app/api/csp-report/route.ts` (new) and `src/lib/seo/csp-reports.ts` aggregate reports
  (directive, blocked kind, page section, 40-character sample; framework scripts labelled).
  `RouteSecurityOverride` + `overrideHeaders`: a route group can allow `payment=(self "<origin>")`
  and partner `frame-src`, `connect-src`, `script-src`, `form-action` (exact https origins only)
  without changing other routes; wired into `next.config.ts`. The enforced policy and the
  production e2e check now count only `disposition === 'enforce'` violations (intended change:
  the report-only policy is expected to report framework scripts).
- **Verified:** `security-headers.test.ts` covers the report-only policy and the override. In
  Chromium, the preferences script's hash matches (not reported); 11 report-only violations on
  `/en` in dev are framework scripts plus package A's three inline scripts. curl: a report → 204.
- **Not yet:** dropping `'unsafe-inline'` from the enforced policy needs the report window first
  (by design), A's inline scripts exported for hashing (hand-off), and nonces on per-request
  routes. `ROUTE_SECURITY_OVERRIDES` stays empty: no partner origin may be named until MAHB and a
  payment partner confirm one (needs partner data).

### E-10 (P1, medium) AI wording: fact guard gaps, injectable tags, no spend cap: fixed

- **Changed:** `fact-guard.ts`: `contactsIn` (URLs, bare domains, e-mails, phones) and
  `sensitiveClaims` (passport, visa, security, immigration, customs, entry, identity, health,
  refunds, with negation) and `checkRewording`, which rejects any of these not supported in the
  same sense by the retrieved statements. `rephrase.server.ts`: the question is no longer part of
  `groundingReference`; it is redacted (`redactQuestion`: e-mail, phone, passport, booking
  reference) and sent as its own text block with `&`, `<`, `>` escaped; `max_tokens` 240 (two
  sentences of at most 480 characters plus brief low-effort thinking, which Claude Opus 5.5
  cannot turn off; a reply cut at the cap keeps the grounded text); the system prompt says the
  question is untrusted; spending through `ModelBudget` (E-05) with outcome recording.
- **Verified:** `server.test.ts`: the four red-team cases are rejected (scam domain, scam e-mail,
  "no passport, just walk through security", a phone typed in the question); the request body has
  two blocks, nothing personal and no unescaped tags; budget refusal and breaker. The key stays
  unset in this prototype.

### E-11 (P1, medium) Whole dictionary inlined on every page: partially fixed

- **Changed:** `src/lib/i18n/index.ts`: `clientDictionary(lang)` (every namespace except
  `SCOPED_NAMESPACES` = `corporatePages`, `designSystem`, about 34 KB raw of 140 KB),
  `pickDictionary`, and the Server Component `I18nScope`; `src/lib/i18n/client.tsx`: the context
  keeps its dictionary and `I18nExtend` merges a scope. The root layout passes `clientDictionary`.
  Cross-package wrappers: privacy page and design-system page (table above).
- **Verified:** `i18n.test.ts` (scoped namespaces absent; a source scan fails if any Client
  Component outside the allowed places reads them); dev HTML of `/en`, `/en/kul/parking` and
  `/en/guides/baggage` contains no corporate or design-system copy; screenshots of both scoped
  pages show translated text.
- **Not yet:** per-feature scoping of `flightPages`, `guidePages`, `transportPages`,
  `commercePages`, `mapPages` (each package wraps its pages in `I18nScope`; then the platform
  drops them from the root), the 40 KB gzip HTML target (needs the verification build), and the
  flight and journey pages' duplicated props (B hand-off from the backlog).

### E-12 (P1, medium) Service-worker install: 94 fetches, /en downloaded three times: fixed (measurement pending)

- **Changed:** `sw-routes.ts` `precachePaths(lang)`: the visitor's language only (`/<lang>`,
  `/<lang>/offline`); `SAVE_FETCH_CACHE = 'no-cache'`. `service-worker.ts`: the language comes
  from the registering window; pages saved one after the other with revalidation (a page the
  browser has just loaded is a 304, not a copy); bundles fetched with `force-cache` and deduped
  through an in-flight map; activate skips the current page when the install saved it.
  `sw-client.ts` `afterNetworkIdle`: registration waits for `load`, 1.5 s without new resource
  entries (10 s at most) and an idle period.
- **Verified:** `sw-routes.test.ts`; the worker only runs in production builds. **Needs the
  verification build:** first visit at or under 600 KB and 60 requests; Cache Storage at or
  under 1 MB; `/en` downloaded once. `platform.spec.ts`' service-worker test still expects `/en`,
  `/en/offline` and the visited page in `ma-v1-pages`, which this design keeps.

### E-13 (P1, medium) security.md and architecture.md differ from the build; cache names: fixed

- **Changed:** `docs/engineering/security.md` sections 1, 2, 3, 4, 6 and 9 rewritten to the
  system as built, each with a "Verified against the code on 21 November 2026" line (5 and 7
  updated too). `docs/engineering/architecture.md` sections 2.2, 2.4, 3.5 and 6.3, and 7.1 and
  7.4 corrected, with verified lines. Cache names: the document now says `v1` and why (saved pages
  must survive a deploy; each page records its build); `sw-routes.ts` comment and a test pin it.
  `docs/engineering/handoffs/platform.md`: a fix-round section for other teams.

### E-14 (P1, medium) Canonical and hreflang only on /offline: partially fixed

- **Changed:** `src/lib/seo/link-headers.ts` (new) and `next.config.ts`: every localised page
  (file-like paths excluded) gets a `Link` header with its canonical URL and en, ms and x-default
  alternates. `pageMetadata` (unchanged) already gives the HTML equivalents.
- **Verified:** curl on `/en`, `/ms/kul/parking`, `/en/kul/shop-dine/x` (values correct; Next.js's
  own font-preload `Link` header is kept beside it); `platform.spec.ts` checks three pages.
- **Not yet:** the HTML `<link>` tags on every route need each page's `generateMetadata` to call
  `pageMetadata` (hand-off to A, B, C, D, in the platform hand-off). A crawl that reads headers
  finds both on 100% of sitemap URLs; one that reads only HTML does not yet.

### E-15 (P1, medium) Sitemap omits six corporate pages and 12 stories: fixed

- **Changed:** `src/lib/seo/site-routes.ts`: static pages come from the `page.tsx` files under
  `src/app/[lang]` (minus a named `SITEMAP_EXCLUDED` list: search, journey, offline, design
  system, airport not-published note); corporate stories from `mediaSlugs()`, the registry the
  news route's `generateStaticParams` reads.
- **Verified:** `seo.test.ts` compares the sitemap with every static route folder and with the
  `generateStaticParams` of the news (at least 14), guide, help and outlet routes.

### E-16 (P1, medium) Legacy Wi-Fi, car-rental and fast-track redirects: fixed

- **Changed:** `legacy-redirects.ts`: Wi-Fi is a 307 everywhere (no airport publishes verified
  Wi-Fi details); topics about one record name it per old airport (`records`): Fast Track →
  308 to `/kul/facilities?t=T1#kul-t1-fast-track` (and T2), car rental → 308 to
  `/pen/transport#transport-pen-car-rental`; airports without the record get a 307 to the
  closest page.
- **Verified:** `legacy-redirects.test.ts` asserts the content anchor of every permanent
  destination against the content layer (facility and transport ids), plus the 307 cases.

### E-17 (P1, medium) No measurement, no attribution: partially fixed

- **Changed:** `src/components/platform/metrics.ts` (contract: answer state per top task,
  hand-off name and host, site section; strict validation; `withCampaign`),
  `src/components/platform/analytics.ts` (no sending under Global Privacy Control, Do Not Track or
  the `ma:measurement:v1` switch; `sendBeacon` to this origin only; reads `data-answer-task` /
  `data-answer-state` and `data-handoff` attributes; adds `utm_*` to marked outbound links),
  `src/app/api/metrics/route.ts` (same-origin, 2 KB, 204) and `src/lib/seo/metrics-store.ts`
  (counts per day; read by authenticated monitoring); started from `platform-runtime.tsx`.
- **Verified:** `metrics.test.ts`; curl: a valid measurement → 204, cross-site → 403.
- **Not yet:** pages must add the attributes (A, B, C, D), the privacy page must describe the
  measurement and offer the switch, and list `ma:measurement:v1` (D). Partner referral codes and
  confirmed bookings: OOS-13.

### E-18 (P1, low) Saved-place links accept any URL; localeHref passes every scheme: fixed

- **Changed:** `stores.ts` `SAME_SITE_PATH` (`^/(?![/\\])[^\s\\]*$`) on `SavedPlace.href`; saved
  flights and places drop invalid entries one by one (the rest of the journey is kept);
  `locale.ts` `localeHref` passes through only `https:`, `mailto:`, `tel:` and `#…`; any other
  scheme, `//host` or `/\host` becomes `#` (`BLOCKED_HREF`).
- **Verified:** `storage.test.ts` (https, `//`, `/\`, `data:` and `javascript:` places dropped,
  the valid place and flight kept) and `locale.test.ts`.

### E-19 (P1, low) API hygiene: fixed

- **Changed:** `api.ts`: `date` limited to yesterday through the day after tomorrow (Malaysian
  time); any repeated parameter is a 400. `src/app/api/[[...rest]]/route.ts` (new): JSON 404 for
  every method on unknown `/api` paths (the optional catch-all also covers `/api`);
  `next.config.ts` keeps `/api` out of the HTML not-found rewrite. Explicit `HEAD` handlers on
  flights and health (same status and headers, no body).
- **Verified:** `api.test.ts`; curl: duplicate and out-of-range queries 400; `/api/nope`, `/api`,
  `/api/nope/deeper` JSON 404 on GET, HEAD and POST. One existing test used `date=2026-12-01`
  with a 17 November clock; it now uses 18 November (intended behaviour changed).

### E-20 (P1, low) Dev-dependency advisories: fixed

- `npm audit` and `npm audit --omit=dev` both report 0 on 21 November 2026; picomatch 4.0.7 is
  still in the tree and no patched release exists, so it is recorded in `security.md` section 9 as
  accepted development-only risk with a review date of 21 February 2027. No downgrades. The
  production audit is a CI gate. `server-only@0.0.1` was the only dependency added.

### E-21 (P1, low) /api/health discloses Node.js version and environment: fixed

- **Changed:** the public body is `{ status, build }` (build id from `NEXT_PUBLIC_APP_VERSION`,
  validated); the detailed body (providers, runtime, model-budget, CSP and measurement counters)
  only with `Authorization: Bearer <HEALTH_TOKEN>` (16+ characters, constant-time compare).
- **Verified:** `api.test.ts`; curl: `{"status":"ok","build":"202611210113"}`; `platform.spec.ts`.

### E-22 (P1, low) 404 responses cached for a year: fixed (curl on production pending)

- **Changed:** `src/components/platform/short-cache.tsx` renders a `'use cache'` marker with
  `cacheLife('minutes')` in `src/app/[lang]/not-found.tsx` and `src/app/global-not-found.tsx`;
  Next.js derives a prerendered page's `s-maxage` from the shortest cache life in it, so 404s get
  `s-maxage=60`. Normal pages never render the not-found boundary.
- **Verified:** the derivation was read in Next.js 16.4.6 (`app-page-runtime.js`,
  `cache-control.js`). `next dev` always sends `no-store`, so the curl check on `/en/nope-xyz` and
  `/xyz.txt` is in `platform.spec.ts` (production only) for the verification engineer.
  **Hand-off to B:** the proxy's flight 404 (`src/lib/providers/flight-route.ts`) sends
  `public, max-age=300`; 60 s or `s-maxage=60` would match this rule.

### E-23 (P1, low) server-only guard missing: fixed

- **Changed:** `server-only` installed; imported at the top of `rephrase.server.ts` and (cross-
  package, table above) `knowledge.server.ts`; `vitest.config.ts` aliases it to an empty module
  (`src/lib/testing/server-only.ts`) because unit tests run server modules directly.
- **Verified:** tests and typecheck pass; the build-time failure on a client import is the
  package's documented behaviour (not exercised: no build in this round).

### E-24 (P1, low) A new Intl.NumberFormat per plural lookup: fixed

- **Changed:** `translate.ts` `numberFormat(lang)`, one formatter per language at module level,
  used by `t.count` on the server and in the client provider.
- **Verified:** `i18n.test.ts` (same instance, `1,234`). The profile figure needs the build.

### E-25 (P2, low) No security.txt: needs MAHB data (out of scope, OOS-12)

- Not published: it needs MAHB's disclosure contact and policy, and a placeholder contact would
  be worse than none. Recorded in `security.md` section 9.

## Hand-offs from this round

- **A:** `[airport]/layout.tsx` fallbacks (E-02); icon registry and lazy dialogs (E-03); export
  `EARLY_TAP_SCRIPT`, `EARLY_MODE_SCRIPT`, `SAVED_FLIGHT_FLAG_SCRIPT` for hashing (E-09); switch
  `site-search.ts`' store to `validator(check…)` (E-03); `pageMetadata` (E-14); measurement
  attributes on home tasks (E-17); axe tags from `e2e/support/axe.ts` (E-06).
- **B:** demo generator out of the shell (E-03); stores in `use-concierge.ts`, `flight-alerts.ts`,
  `trip-options.ts`, `needs.ts`, `follow.ts` to `validator(check…)` (E-03); only needed props on
  the flight and journey pages and `I18nScope` for `flightPages` (E-11); flight 404 cache time
  (E-22); `pageMetadata`, measurement attributes, shared axe tags.
- **C:** `I18nScope` for `transportPages`, `commercePages`, `mapPages` (E-11); `data-handoff` on
  parking, transport and shop-and-dine booking links (E-17); `pageMetadata`; shared axe tags.
- **D:** a zod-free module for runtime values in `src/content/types.ts` (E-03); `I18nScope` for
  `guidePages` (E-11); privacy page: describe the measurement, offer the switch, list
  `ma:measurement:v1` (E-17); `pageMetadata`; shared axe tags.
- **Verification engineer:** `next build && next start`, then Lighthouse (E-01, E-02), first-load
  JavaScript (E-03), HTML size (E-11), service-worker install (E-12), `curl -I` on 404s (E-22),
  the production-only tests in `platform.spec.ts`, and a first CI run (E-06).

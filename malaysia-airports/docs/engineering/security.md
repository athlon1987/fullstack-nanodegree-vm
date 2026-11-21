# Security, privacy and resilience

Owner: platform. Applies to the concept prototype as built (updated 21 Nov 2026 after the QA fix
round) and states what a production deployment by Malaysia Airports would need on top.
Implementation: `next.config.ts`, `src/proxy.ts`, `src/lib/seo/security-headers.ts`,
`src/lib/concierge/{rate-limit,request,fact-guard,rephrase.server}.ts`, `src/app/api/**`,
`src/components/platform/**`, `.github/workflows/malaysia-airports-ci.yml`.

## 1. What we are protecting

| Asset | Where it lives | Why it matters |
|---|---|---|
| Trust in the guidance | Static pages built from the content layer, with sources | A tampered page could send passengers to the wrong terminal, a fake booking site or a tout |
| The brand and domain | DNS, TLS, the web app manifest, icons | Look-alike sites and scam pages already target MAHB customers (help topic "Scam alerts") |
| Passenger data on the device | `localStorage` (saved flights, places, parked-car note, preferences), Cache Storage (saved pages) | Personal travel plans; shared devices (kiosks, family phones) |
| Questions sent to the concierge | `POST /api/concierge`, optionally forwarded to a model provider | Free text can contain names, booking references, health details |
| Availability of the API layer | `/api/flights`, `/api/concierge`, `/api/health`, `/api/csp-report`, `/api/metrics`, the per-request pages | Scraping and bursts; the official MAHB content API was observed blocking a client after about 15 page loads (docs/research/audit/firsthand-observations.md) |
| Secrets | Server environment (`ANTHROPIC_API_KEY`, `HEALTH_TOKEN`, future provider keys) | Spend, data access |

The prototype has no accounts, no payments, no server-side personal store and no third-party
scripts. Content pages are prerendered. Rendered per request: the API routes, flight detail pages
(ids carry a date, so they are not enumerated), the board feed and journey content handlers, and
the first visit to an unlisted parameter of a dynamic route (stored afterwards).

*Verified against the code on 21 November 2026 (fix round, package E).*

## 2. Threat model (STRIDE, prioritised)

*Verified against the code on 21 November 2026 (fix round, package E).*

| Threat | Example | Likelihood / impact | Controls in place | Production additions |
|---|---|---|---|---|
| Cross-site scripting | Unescaped content or a compromised dependency injects script | Low / high | React escaping; content is typed modules reviewed in git; JSON-LD escapes `<`; CSP limits script to this origin; no third-party scripts | Dependency review (section 9); remove `'unsafe-inline'` if Next.js ships hashed inline scripts (`experimental.sri` is unproven) |
| Clickjacking and framing | The site framed by a phishing page | Medium / medium | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | None |
| Spoofing and phishing | Look-alike domain, fake "official" app | High / high | Concept-prototype label in the footer, OG image and manifest description; `noindex`; scam help topic | Brand monitoring, DMARC/SPF/DKIM on the mail domain, HSTS preload, takedown process |
| Tampering in transit | Wi-Fi captive portals injecting content | Medium / high | HSTS (two years, subdomains); `upgrade-insecure-requests` when the site URL is https | HSTS preload list once every subdomain is HTTPS-only |
| Cache poisoning via the service worker | A bad response stored and replayed offline | Low / medium | Worker stores only `200`, same-origin, non-redirected HTML/JSON, honours `no-store`/`private`, keys pages by path only; never stores `/api/*`, RSC requests or search results; cache names carry the storage format (`ma-v1-*`), not the build, so saved pages survive a deploy, and each saved page records its build (`x-ma-build`); bounded caches | Kill switch (section 8) |
| Information disclosure | Referrer leaks, personal data in URLs, runtime fingerprints | Medium / low | `Referrer-Policy: strict-origin-when-cross-origin`; pages are cached by path only, so search queries never reach Cache Storage (the last six search terms are kept in `localStorage` on the device, `ma:search-recent:v1`, and listed on the privacy page); public `/api/health` returns only status and build id; measurement is aggregate and first-party (section 6) | Log scrubbing (section 6) |
| Denial of service and scraping | Bursts against the API or per-request pages | Medium / medium | Pages are static and never depend on the API (build-spec section 3); `/api/*` is `no-store`; per-route token buckets in `src/proxy.ts` and the concierge route (section 4); bodies capped before reading | Edge rate limits and WAF (section 4, `docs/engineering/edge/`) |
| Cross-site request forgery on the concierge | Another site makes visitors' browsers post questions | Medium / low | Exact `application/json` only (a form or no-cors fetch cannot send it without a preflight); `Sec-Fetch-Site` and `Origin` checked before anything is counted | None |
| Abuse of the concierge model | Prompt injection, cost exhaustion, invented contact details | Medium / medium | Grounded retrieval only; deterministic without a key; the question excluded from the grounding reference, redacted and sent in its own escaped block; fact guard rejects new numbers, names, URLs, domains, e-mails, phones and changed document or security claims; `max_tokens` 240; per-minute, daily and monthly call caps with a circuit breaker | Shared stores for the limits and budget, alerts at 50/80/100 % (section 7) |
| Elevation of privilege | Browser features misused by injected code | Low / medium | `Permissions-Policy` denies camera, microphone, geolocation, payment, USB, screen capture; a per-route override can allow payment for a future checkout only | Review when a feature needs one of them |
| Open redirect or script links from storage | A tampered `localStorage` entry turns a saved place into a link to a phishing site | Low / medium | Saved places accept same-site paths only (`^/(?![/\\])`); tampered entries are dropped one by one; `localeHref` passes through only `https:`, `mailto:` and `tel:` | None |
| Misinformation | Demo data mistaken for live | Medium / high | Build-spec rule 1: every demo surface is labelled; provenance tags | Same rule for live data: freshness and source on every value |

## 3. HTTP headers and why

*Verified against the code on 21 November 2026 (fix round, package E).*

Sent on every response by `next.config.ts` `headers()` (static, so every page stays prerendered
and CDN-cacheable; nonces would force per-request rendering: Next.js notes, section 7).

| Header / directive | Value | Reason |
|---|---|---|
| CSP `default-src` | `'self'` | Nothing loads from another origin unless listed below (and nothing is) |
| `script-src` | `'self' 'unsafe-inline'` (+ `'unsafe-eval'` in `next dev` only) | Our bundles, plus the framework's inline flight data and the theme script that runs before first paint. Inline is the documented cost of static CSP |
| `style-src` | `'self' 'unsafe-inline'` | Our stylesheet; React and Radix set inline `style` attributes |
| `img-src` | `'self' data: blob:` | Our images and icons; `data:` for CSS pattern masks; `blob:` for generated files |
| `font-src` | `'self'` (+ `data:` in dev) | Self-hosted fonts via `next/font/local`; no font CDN |
| `connect-src` | `'self'` (+ `ws: wss:` in dev) | `fetch` to our API and static JSON only; hot reload in development |
| `media-src`, `worker-src`, `manifest-src` | `'self'` | Service worker and manifest from this origin |
| `frame-src`, `frame-ancestors`, `object-src` | `'none'` | We embed nothing and nobody embeds us; no plugins |
| `base-uri` | `'none'` | No `<base>` is ever needed, so injected markup cannot re-point relative URLs |
| `form-action` | `'self'` | Search submits to our own page |
| `upgrade-insecure-requests` | when `NEXT_PUBLIC_SITE_URL` is https | Belt and braces behind HSTS; off on plain-http test servers |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Browsers ignore it over http, so it is safe in development. `preload` is a domain-wide, slow-to-undo decision for MAHB |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing of JSON or uploads into script |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Official sites we link to see the origin, never the path |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()` | Unused powerful features are off. Notifications are not policy-controlled; flight alerts ask permission themselves |
| `Cross-Origin-Opener-Policy` | `same-origin` | Windows we open cannot script us (tab-nabbing, XS-leaks) |
| `X-Frame-Options` | `DENY` | Older browsers |
| `Origin-Agent-Cluster` | `?1` | Process isolation hint |
| `Cross-Origin-Resource-Policy` (`/api/*` only) | `same-origin` | Other sites cannot read API responses even as no-cors loads. Not global: it would break link previews of the OG image |
| `X-Robots-Tag` | `noindex, nofollow` unless `SITE_INDEXING=allow` | The prototype must not appear in search results; covers JSON, images and the sitemap |
| `Content-Security-Policy-Report-Only` | The enforced policy with `script-src 'self' 'sha256-<preferences script>' 'report-sample'`, `require-trusted-types-for 'script'`, `report-uri /api/csp-report`, `report-to csp` | Measures what the stricter policy would block (security-07). Reports are aggregated by `/api/csp-report` (directive, blocked kind, page section, 40-character sample; framework flight-data scripts labelled as such) and read by monitoring through `/api/health` |
| `Reporting-Endpoints` | `csp="/api/csp-report"` | The Reporting API endpoint for `report-to` |
| `Link` (pages under `/en` and `/ms`) | canonical, `hreflang` en, ms and x-default | Every page names its canonical URL and both languages even where its `generateMetadata` does not yet call `pageMetadata` (docs-02) |
| (removed) `X-Powered-By` | `poweredByHeader: false` | No framework fingerprint |

Not used, on purpose: COEP (no need for cross-origin isolation, would complicate images),
`Expect-CT` (obsolete), `X-XSS-Protection` (obsolete, harmful in old browsers). The service
worker is served by Next.js with `Cache-Control: public, max-age=0, must-revalidate` and
`Service-Worker-Allowed: /`, and registered with `updateViaCache: 'none'`.

**Path to dropping `'unsafe-inline'`** (security-07, exec-commerce-14). Step 1, now: the report-only
policy above runs everywhere. Step 2: once the report window (at least two weeks of production
traffic) shows only the framework's flight-data and reveal scripts plus our own hashed scripts,
enforce: hashes for the static inline scripts (the preferences script today; the early-tap,
early-mode and saved-flight scripts in package A's home and shell components must first export
their strings so `next.config.ts` can hash them), nonces on the per-request routes, and Trusted
Types. Step 3: per-route overrides (`RouteSecurityOverride` in `security-headers.ts`) let a
checkout route allow `payment=(self "<payment origin>")` and partner `frame-src`, `connect-src`,
`script-src` and `form-action` origins without loosening any other route. The list is empty
until MAHB and a payment partner name the origins (needs partner data).

**Round 2 (21 November 2026, verification issue 8, E-09): why the enforced policy keeps
`'unsafe-inline'`, and what moved.** Verified on a production build that day.
- *Moved:* our four inline scripts (preferences, early tap, early journey mode, saved-flight flag)
  now live as plain strings in `src/lib/inline-scripts.ts` and `src/lib/preferences.ts`, and
  `next.config.ts` puts all four SHA-256 hashes in the report-only policy. Reports now name only
  the framework's scripts.
- *Why not enforce hashes:* every prerendered page also carries the framework's own inline
  scripts: the RSC payload chunks (`self.__next_f.push([...])`, which embed that page's data), the
  bootstrap, and the `$RC`/`$RS` reveal scripts on pages with streamed boundaries. Their text
  differs per page, per language and per build (measured: 57 inline scripts on `/en/kul`, 40 of them payload chunks and 10 reveal scripts; 56 on `/en`). A static,
  nonce-free policy would need a different list of hashes for each of the 276 sitemap URLs (and
  every prefetchable variant), regenerated after each build and content change, sent from
  `headers()` by exact path. Next.js 16.4 has no supported way to emit those hashes
  (`experimental.sri` covers external chunk files only), and nonces need per-request rendering,
  which would end static rendering and CDN caching (Next.js notes, section 7, and Do/Don't 12).
- *So:* `'unsafe-inline'` stays in the enforced `script-src`; everything else stays locked to
  this origin (no third-party script, `object-src 'none'`, `base-uri 'none'`), and the
  report-only policy with Trusted Types keeps measuring. Revisit when Next.js can emit per-route
  inline-script hashes at build time.

Not-found responses carry `s-maxage=60` (round 2: the proxy's flight 404 too, which sent
`public, max-age=300`; it now sends `public, max-age=0, s-maxage=60`) (the not-found pages render a `cacheLife('minutes')`
marker, `src/components/platform/short-cache.tsx`), so a CDN cannot keep a 404 for a year and
arbitrary URLs cannot fill it (security-12). To be confirmed with `curl -I` on a production build.

The zod `new Function` probe noted in the first review no longer applies: zod 4 is configured
jitless where schemas are built, and client storage validation no longer uses zod at all
(`src/lib/storage.ts` `check` toolkit).

## 4. Rate limiting at the API layer

*Verified against the code on 21 November 2026 (fix round, package E).*

**In the application today** (`src/lib/concierge/rate-limit.ts`, used by `src/proxy.ts` and
`src/app/api/concierge/route.ts`):

| Route group | Limit (burst, then refill) | Where |
|---|---|---|
| `POST /api/concierge` | 10, then 1 every 6 s per client | The route (the proxy must not buffer its body) |
| `/api/flights` | 60, then 1 per second | Proxy |
| `/api/health` | 10, then 1 every 6 s | Proxy |
| `/api/csp-report`, `/api/metrics` | 30, then 1 every 2 s | Proxy |
| Any other `/api/*` (they answer a JSON 404) | 60, then 1 per second | Proxy |
| Per-request pages: flight detail, board feed, network feed (round 2), journey content | 60, then 1 per second | Proxy |

- **Client identity (the trust model).** The key is the client address from a trusted source only:
  `TRUSTED_CLIENT_IP_HEADER` (a header the CDN overwrites, such as `cf-connecting-ip`) or
  `TRUSTED_PROXY_HOPS` (how many of our proxies append to `X-Forwarded-For`; the client is that
  many entries from the right). The first `X-Forwarded-For` entry is never used: a visitor sets
  it. **Production must set one of the two.**
- **When neither is set (round 2, 21 November 2026; verified against the code that day).** The
  server still starts, and is safe but visible about it:
  - **Start-up warning.** `src/instrumentation.ts` prints one `[rate-limit] Client address source:
    …` line to the server log when a production server starts without a usable setting (also
    when a value is set but unreadable, such as `TRUSTED_PROXY_HOPS=two`). Not printed during
    `next build` or in development. Treat it as a deployment error.
  - **Fallback key.** `limitKey()` uses the address nearest the server, the last `X-Forwarded-For`
    entry, marked untrusted (`untrusted:<address>`). With nothing in front of the app that is
    the socket address (`next start` adds it when the request has no such header); behind one
    proxy it is the proxy's view of the client. Visitors are therefore no longer throttled
    together, as they were before (one shared bucket for the whole site).
  - **Site-wide ceiling.** A visitor talking to the app directly can send that header and choose
    the value, so every untrusted key also draws on one ceiling per route group: 10 times the
    per-client limit (`UNTRUSTED_CEILING_FACTOR`; for `/api/flights` 600 in a burst, then 10 a
    second; for the concierge 100, then 1 every 0.6 s, under the separate model budget). A client
    inventing addresses is bounded by the ceiling, not by its own limit.
  - **Known limit of the fallback.** Behind a CDN that is not declared, the nearest address is a
    CDN edge, so many visitors share a few keys, and the ceiling applies to all of them. Only the
    configured header or hop count gives one bucket per visitor.
  - Unit tests: `src/lib/concierge/server.test.ts` ("rate limits without a configured client
    address source" and the concierge route tests).
- **Everything counts.** Invalid requests (400, 413) are counted; only requests refused as
  cross-site (403) or with the wrong media type (415) are refused before counting, so another
  site cannot drain a visitor's allowance.
- **Body limits.** The concierge refuses a declared `Content-Length` over 4 KB unread and reads an
  undeclared body as a stream, cancelling past 4 KB (a 200 MB post costs no memory). The proxy's
  body buffer is capped at 16 KB (`experimental.proxyClientMaxBodySize`).
- **Shared store.** Buckets sit behind `RateLimitStore` (`take(key, now)`, sync or async);
  `createRouteLimiter(factory)` takes a factory for a Redis or edge-KV store. The in-memory store
  is per process and resets on restart.
- **Model spend.** `ModelBudget`: site-wide caps per minute, day and month
  (`CONCIERGE_MAX_CALLS_PER_MINUTE`, `_PER_DAY`, `_PER_MONTH`; defaults 30, 2,000 and 40,000), a
  circuit breaker that opens after 5 consecutive failures for 60 s and then allows one trial call,
  and counters (calls, successes, failures, refusals by budget and by circuit) reported to
  authenticated monitoring through `/api/health`.

**At the edge (production).** `docs/engineering/edge/` holds the same limits as configuration:
`rate-limits.nginx.conf` for an nginx tier and `edge-rules.yaml`, a host-neutral rule set (per-
route buckets, bot scoring, body limits) to translate into the chosen CDN's WAF. Deploying them on
MAHB infrastructure is out of scope this round (OOS-11).

**Do not punish shared networks.** Airport Wi-Fi, hotels and mobile carriers put thousands of
travellers behind one address. Prefer generous address limits plus per-session limits, challenge
rather than block, and never let a limit make static guidance disappear (it does not depend on
the API). This is the failure observed on the current MAHB site.

## 5. Secrets

- Server-only environment variables (`ANTHROPIC_API_KEY`, future flight-provider credentials),
  injected by the hosting platform's secret manager at runtime. Never `NEXT_PUBLIC_*`, never in
  the repository, `.env*` git-ignored, never logged.
- Route handlers that use secrets import only server modules. `server-only` is installed and
  imported by `rephrase.server.ts` and `knowledge.server.ts`: importing either from a Client
  Component fails the build (verified 21 November 2026). `HEALTH_TOKEN` (16 characters or more)
  unlocks the detailed health body; without it the details are never served.
- Separate keys per environment (preview, staging, production), least privilege, rotation every
  90 days and immediately after staff changes or suspected exposure; secret scanning on pushes.

## 6. Personal data (PDPA)

Malaysia's Personal Data Protection Act 2010, as amended in 2024 (mandatory breach notification,
data protection officers, data portability, revised cross-border transfer rules). Confirm the
operative obligations and dates with MAHB's counsel; this section is design guidance, not advice.

*Verified against the code on 21 November 2026 (fix round, package E).*

- **Minimise.** No accounts and no server-side store. Saved flights, places, the parked-car note,
  preferences and the last six search terms stay in the browser; saved pages contain no personal
  data and can be removed on the offline page ("Remove saved pages"). Search terms are never
  written to Cache Storage, sent to the server or logged.
- **Measurement** (exec-commerce-12). First-party and aggregate only: `/api/metrics` counts, per
  day, a top task's answer state and which hand-off was followed (name and destination host) per
  site section. No cookie, identifier, address, user agent, query or search term is read or kept.
  Nothing is sent when the browser signals Global Privacy Control or Do Not Track, or when the
  visitor switches measurement off (`ma:measurement:v1`). Outbound links marked as commercial
  hand-offs carry `utm_source`, `utm_medium` and `utm_campaign`. The privacy page must describe it
  and offer the switch (hand-off to package D). Partner referral codes and partner-confirmed
  bookings need partner agreements (OOS-13).
- **Concierge.** The question and minimal context reach our server, and the optional model
  provider (a cross-border transfer). E-mail addresses, phone numbers, passport numbers and
  booking references are redacted before forwarding (`redactQuestion`). Production needs a notice
  at the point of entry, a processor agreement, a retention limit (for example 30 days, then
  aggregate only) and no training use.
- **Logs.** IP addresses are personal data: truncate or hash at ingestion, keep raw logs for
  security only (for example 30 days), document the purpose.
- **Notifications.** Opt-in through the browser prompt; demo only. Real alerts would need consent
  records and an easy opt-out.
- **Rights and breaches.** Privacy notice (corporate-network owns `/privacy`), a DPO contact, an
  access/correction route, and the breach runbook in section 7 with notification to the
  Commissioner and affected people within the statutory deadline.

## 7. Monitoring and incident alerting

- **Signals.** Uptime checks on `/en`, `/ms`, `/api/health` from two regions; synthetic
  Playwright smoke (this repo's `e2e/`) every 15 minutes against production; 5xx and latency
  per route; `429` volume; CSP report-only violations (collected by `/api/csp-report`, read with
  the detailed `/api/health`); model-call counters and circuit state; service-worker version
  adoption.
- **Tooling.** Self-hosted or EU/MY-region services only (no third-party scripts in pages):
  OpenTelemetry from route handlers, server logs to the platform's log store.
- **Alerts.** P1 (site or a primary language down, or wrong guidance published): page on-call
  immediately. P2 (API down, error rate above 2% for 5 minutes, CSP violation spike): page in
  working hours. P3 (budget thresholds, certificate expiry under 21 days): ticket.
- **Response.** Runbook per alert; a network notice through the content layer for passenger-facing
  incidents; post-incident review within five working days; PDPA breach assessment within 24 hours.

## 8. Graceful degradation and disaster recovery

- Pages are static HTML and work without JavaScript; the API is never on the critical path. If
  the flight provider fails, boards say data is unavailable and point to the airline and the
  official site; the concierge falls back to deterministic retrieval.
- Offline: the service worker keeps the shell, the offline page and every guidance page the
  visitor opened (stale-while-revalidate); other pages are network-first with a 3.5 s timeout and
  fall back to the saved copy, with a polite "You are offline: showing saved information" notice.
- **Recovery.** Build artefacts are immutable and versioned; rollback is a redeploy of the
  previous build (RTO 15 minutes). All content is in git (RPO zero for content); there is no
  server state to back up today. DNS and TLS managed with documented owners; multi-region CDN.
- **Service-worker kill switch.** If a bad worker ships, deploy a build whose worker calls
  `self.registration.unregister()` and deletes caches starting with `ma-`; browsers fetch the
  worker script on the next navigation (it is never HTTP-cached), so it propagates within a visit.

## 9. Audit trail and security testing

*Verified against the code on 21 November 2026 (fix round, package E).*

- **Audit trail.** Git history with reviewed pull requests (signed commits recommended); deploy
  logs with build version (`APP_VERSION`, set to the commit in CI); change logs for environment
  variables, WAF rules and DNS; content provenance on every fact (source and retrieval date);
  access reviews quarterly.
- **Automated on every pull request that touches the app** (`.github/workflows/malaysia-airports-ci.yml`,
  repository root; also runnable by hand): `npm ci`; `npm audit --omit=dev --audit-level=high` as a
  gate (all dependencies are audited too, report only); `next typegen` and `tsc`; ESLint; Vitest
  (headers, redirects, sitemap, limits, body reading, origin checks, fact guard, storage
  validation, the worker's caching rules); a production build; Playwright on desktop, phone and a
  WebKit iPhone project, with the shared axe scan (`e2e/support/axe.ts`: wcag2a, wcag2aa,
  wcag21a, wcag21aa, wcag22aa); Lighthouse CI budgets (`lighthouserc.json`); CodeQL
  (javascript-typescript); gitleaks over the full history. Dependabot (`.github/dependabot.yml`)
  opens weekly update pull requests for the app's npm dependencies and the workflow actions.
- **Dependency risk accepted.** `npm audit` on 21 November 2026 reports 0 advisories for production
  and development dependencies. The picomatch ReDoS advisory (GHSA-fc5q-39xc-vjpf, development
  tooling only: Vitest and eslint-config-next, patterns are ours, never user input) reported by
  the first review is no longer returned by the registry; picomatch 4.0.7 is still in the tree and
  no patched release exists. Accepted as development-only risk; review by 21 February 2027 or
  when Dependabot proposes a patched release. No downgrades.
- **Before launch and quarterly:** OWASP ZAP baseline against staging; Mozilla Observatory and
  securityheaders.com grade A or better; an external penetration test including the API, the
  service worker and the concierge (prompt injection, data exfiltration, cost abuse); a restore
  and rollback drill; a kill-switch drill.
- **Disclosure.** `/.well-known/security.txt` (RFC 9116) is not published: it needs MAHB's
  disclosure contact and policy, and a placeholder contact would be worse than none (OOS-12).

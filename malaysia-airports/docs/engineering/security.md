# Security, privacy and resilience

Owner: platform. Applies to the concept prototype as built (17 Nov 2026) and states what a
production deployment by Malaysia Airports would need on top. Implementation:
`next.config.ts`, `src/lib/seo/security-headers.ts`, `src/components/platform/**`.

## 1. What we are protecting

| Asset | Where it lives | Why it matters |
|---|---|---|
| Trust in the guidance | Static pages built from the content layer, with sources | A tampered page could send passengers to the wrong terminal, a fake booking site or a tout |
| The brand and domain | DNS, TLS, the web app manifest, icons | Look-alike sites and scam pages already target MAHB customers (help topic "Scam alerts") |
| Passenger data on the device | `localStorage` (saved flights, places, parked-car note, preferences), Cache Storage (saved pages) | Personal travel plans; shared devices (kiosks, family phones) |
| Questions sent to the concierge | `POST /api/concierge`, optionally forwarded to a model provider | Free text can contain names, booking references, health details |
| Availability of the API layer | `/api/flights`, `/api/concierge`, `/api/health` | Scraping and bursts; the official MAHB content API was observed blocking a client after about 15 page loads (docs/research/audit/firsthand-observations.md) |
| Secrets | Server environment (`ANTHROPIC_API_KEY`, future provider keys) | Spend, data access |

The prototype has no accounts, no payments, no server-side personal store and no third-party
scripts. Every page is prerendered; the server only renders the API routes and the not-found pages.

## 2. Threat model (STRIDE, prioritised)

| Threat | Example | Likelihood / impact | Controls in place | Production additions |
|---|---|---|---|---|
| Cross-site scripting | Unescaped content or a compromised dependency injects script | Low / high | React escaping; content is typed modules reviewed in git; JSON-LD escapes `<`; CSP limits script to this origin; no third-party scripts | Dependency review (section 9); remove `'unsafe-inline'` if Next.js ships hashed inline scripts (`experimental.sri` is unproven) |
| Clickjacking and framing | The site framed by a phishing page | Medium / medium | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | None |
| Spoofing and phishing | Look-alike domain, fake "official" app | High / high | Concept-prototype label in the footer, OG image and manifest description; `noindex`; scam help topic | Brand monitoring, DMARC/SPF/DKIM on the mail domain, HSTS preload, takedown process |
| Tampering in transit | Wi-Fi captive portals injecting content | Medium / high | HSTS (two years, subdomains); `upgrade-insecure-requests` when the site URL is https | HSTS preload list once every subdomain is HTTPS-only |
| Cache poisoning via the service worker | A bad response stored and replayed offline | Low / medium | Worker stores only `200`, same-origin, non-redirected HTML/JSON, honours `no-store`/`private`, keys pages by path only; never stores `/api/*`, RSC requests or search results; per-build cache names; bounded caches | Kill switch (section 8) |
| Information disclosure | Referrer leaks, personal data in URLs | Medium / low | `Referrer-Policy: strict-origin-when-cross-origin`; search terms never cached; no analytics | Log scrubbing (section 6) |
| Denial of service and scraping | Bursts against `/api/flights` or the concierge | Medium / medium | Pages are static and never depend on the API (build-spec section 3); `/api/*` is `no-store` | Edge rate limits and WAF (section 4) |
| Abuse of the concierge model | Prompt injection, cost exhaustion | Medium / medium | Grounded retrieval only, deterministic mode without a key, in-memory request limit (placeholder) | Shared rate limits, spend caps, red-team tests |
| Elevation of privilege | Browser features misused by injected code | Low / medium | `Permissions-Policy` denies camera, microphone, geolocation, payment, USB, screen capture | Review when a feature needs one of them |
| Misinformation | Demo data mistaken for live | Medium / high | Build-spec rule 1: every demo surface is labelled; provenance tags | Same rule for live data: freshness and source on every value |

## 3. HTTP headers and why

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
| (removed) `X-Powered-By` | `poweredByHeader: false` | No framework fingerprint |

Not used, on purpose: COEP (no need for cross-origin isolation, would complicate images),
`Expect-CT` (obsolete), `X-XSS-Protection` (obsolete, harmful in old browsers). The service
worker is served by Next.js with `Cache-Control: public, max-age=0, must-revalidate` and
`Service-Worker-Allowed: /`, and registered with `updateViaCache: 'none'`.

Known gap: zod (client bundle) probes `new Function` once when schemas are built; under this CSP
that throws (caught) and the browser reports a `script-src` eval violation. Fix requested from
the domain owner: `z.config({ jitless: true })` before any schema is created.

## 4. Rate limiting at the API layer

The concierge route has an in-memory placeholder: per-instance, lost on restart, not shared. Production:

1. **Edge first.** CDN/WAF rules before the app: per-IP token bucket on `/api/*` (for example
   60 requests per minute for `/api/flights`, 10 per minute for `/api/concierge`), bot scoring,
   and request size limits (concierge body under 4 KB).
2. **Application second.** A shared store (Redis or the platform's KV) keyed by client IP plus a
   short-lived anonymous session id; sliding window; `429` with `Retry-After` and a JSON body the
   UI turns into a calm message. Same limits across all instances.
3. **Do not punish shared networks.** Airport Wi-Fi, hotels and mobile carriers put thousands of
   travellers behind one address. Prefer generous IP limits plus per-session limits, challenge
   rather than block, and never let a limit make static guidance disappear (it does not depend on
   the API). This is the failure observed on the current MAHB site.
4. **Model spend.** Daily and monthly budget caps for the model provider, a circuit breaker that
   falls back to deterministic retrieval, and alerts at 50/80/100% of budget.

## 5. Secrets

- Server-only environment variables (`ANTHROPIC_API_KEY`, future flight-provider credentials),
  injected by the hosting platform's secret manager at runtime. Never `NEXT_PUBLIC_*`, never in
  the repository, `.env*` git-ignored, never logged.
- Route handlers that use secrets import only server modules; add the `server-only` package guard
  (requested of the domain owner; not installed today).
- Separate keys per environment (preview, staging, production), least privilege, rotation every
  90 days and immediately after staff changes or suspected exposure; secret scanning on pushes.

## 6. Personal data (PDPA)

Malaysia's Personal Data Protection Act 2010, as amended in 2024 (mandatory breach notification,
data protection officers, data portability, revised cross-border transfer rules). Confirm the
operative obligations and dates with MAHB's counsel; this section is design guidance, not advice.

- **Minimise.** No accounts and no server-side store. Saved flights, places, the parked-car note
  and preferences stay in the browser; saved pages contain no personal data and can be removed on
  the offline page ("Remove saved pages"). Search terms are never cached or logged.
- **Concierge.** The question and minimal context reach our server, and the optional model
  provider (a cross-border transfer). Production needs a notice at the point of entry, a
  processor agreement, a retention limit (for example 30 days, then aggregate only), no
  training use, and redaction of obvious identifiers before forwarding.
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
  per route; `429` volume; CSP violation reports (add `Reporting-Endpoints` and `report-to` with a
  collector route); model spend; service-worker version adoption.
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

- **Audit trail.** Git history with reviewed pull requests (signed commits recommended); deploy
  logs with build version (`APP_VERSION`); change logs for environment variables, WAF rules and
  DNS; content provenance on every fact (source and retrieval date); access reviews quarterly.
- **Automated, every change:** unit tests for headers, redirects and the worker's caching rules
  (`src/lib/seo/*.test.ts`, `src/components/platform/sw-routes.test.ts`); Playwright checks for
  headers, CSP violations, redirects, offline behaviour and accessibility (`e2e/platform.spec.ts`);
  `npm audit` and Renovate/Dependabot; CodeQL or equivalent SAST; secret scanning.
- **Before launch and quarterly:** OWASP ZAP baseline against staging; Mozilla Observatory and
  securityheaders.com grade A or better; an external penetration test including the API, the
  service worker and the concierge (prompt injection, data exfiltration, cost abuse); a restore
  and rollback drill; a kill-switch drill.

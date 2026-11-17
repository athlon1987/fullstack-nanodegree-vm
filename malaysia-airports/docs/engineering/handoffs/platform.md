# Hand-off: platform (offline, installability, SEO, security headers, redirects, global 404)

Owner: platform. Status (17 Nov 2026): `npx tsc --noEmit` clean (whole project), `npx eslint` clean on my paths,
`npx vitest run src/lib/seo src/components/platform` 32 of 32. The shared dev server was DOWN for this
whole session (no Next.js process; other sessions were blocked too), so `e2e/platform.spec.ts` has not
run yet and nothing was checked inside Next.js. Visual review used server-rendered previews of these
components with the real compiled stylesheet and fonts (390, 360, 1440 px; light and dark; no overflow).

## 1. What exists

| Area | Files |
|---|---|
| Security headers, legacy redirects, global 404 flag, build version | `next.config.ts` (reads `src/lib/seo/security-headers.ts`, `src/lib/seo/legacy-redirects.ts`) |
| Manifest, icons, Open Graph image | `src/app/manifest.ts`, `src/app/icon.svg`, `icon1.png` (192), `icon2.png` (512), `apple-icon.png` (512, full bleed = maskable), `src/app/[lang]/opengraph-image.png` + `.alt.txt`; generator `src/components/platform/assets/render-brand-assets.mjs`; colours `src/components/platform/brand.ts` |
| Sitemap and robots | `src/app/sitemap.ts`, `src/app/robots.ts`, route registry `src/lib/seo/site-routes.ts` |
| SEO helpers for other teams | `src/lib/seo/index.ts`: `JsonLd`, `airportJsonLd`, `organizationJsonLd`, `websiteJsonLd`, `breadcrumbJsonLd`, `pageMetadata`, `absoluteUrl` |
| Service worker and runtime | `src/components/platform/service-worker.ts` (worker), `sw-routes.ts` (pure strategy rules), `sw-client.ts` (registration, connectivity, update stores), `install-client.ts`, `platform-runtime.tsx` (offline indicator + update prompt, mounted in `src/app/[lang]/layout.tsx`: one import, one element after `<GlobalOverlays />`) |
| Offline page `/[lang]/offline` | `src/app/[lang]/offline/page.tsx`, `offline-status.tsx`, `saved-pages.tsx`, `install-card.tsx` |
| Designed global 404 | `src/app/global-not-found.tsx` (`experimental.globalNotFound`) |
| Copy | `src/lib/i18n/features/platform.ts` (`platformPages.*`, both languages) |
| Tests | `src/lib/seo/{legacy-redirects,security-headers,seo}.test.ts`, `src/components/platform/sw-routes.test.ts`, `e2e/platform.spec.ts` |
| Docs | `docs/engineering/security.md` (threat model, headers, rate limits, secrets, PDPA, monitoring, DR) |

## 2. Offline and installability

- Production builds only (scope `/`, `updateViaCache: 'none'`); development removes stale registrations.
- Install: precaches `/en`, `/ms`, `/en/offline`, `/ms/offline` and the bundles and fonts those pages
  reference. Activate: deletes old `ma-*` caches, claims clients, saves the page the visitor is on.
- Strategies (`sw-routes.ts`): bundles, fonts and icons cache first; manifest, guidance pages (airport
  overview and sections, guides, help, accessibility, airport directory) and the search/concierge
  JSON stale-while-revalidate; other pages network first with a 3.5 s timeout, then the saved copy;
  never `/api/*`, RSC requests, search results, non-GET or other origins. Pages are keyed by path
  (no query), stored only when `200`, same-origin, not redirected and not `no-store`/`private`.
- Offline and not saved: redirect to `/[lang]/offline?from=<path>`. Indicator "You are offline: showing
  saved information" (also when the page came from the saved copy after a network failure), then
  "Back online" for 4 s; polite, above the phone bar. Update prompt: Reload / Later, no auto-reload.

## 3. Search engines

- `sitemap.xml`: every page in both languages with `hreflang` en, ms and `x-default`; airports from
  the registry, sections from `airportSections()`, guides, help topics, outlets. Corporate and legal
  pages appear automatically once their route folders exist. Excludes search, journey, offline,
  design system and flight details.
- `robots.txt`: allows crawling (so `noindex` is seen), disallows `/api/`, search, journey, offline,
  design system and flight details, names the sitemap. The prototype stays out of results through
  the layout's robots meta plus `X-Robots-Tag: noindex` (off with `SITE_INDEXING=allow`).
- Adoption, one line each (foundation-ui and corporate-network, please add):
  - Airport overview (foundation-ui): `<JsonLd data={airportJsonLd(airport, lang)} />` in `Overview`.
  - Corporate home (corporate-network): `<JsonLd data={organizationJsonLd(lang)} />`.
  - Network home (foundation-ui): `<JsonLd data={[websiteJsonLd(lang), organizationJsonLd(lang)]} />`.
  - Any page: `return pageMetadata({ lang, path: '/kul/parking', title, description })` for canonical + hreflang + OG.

## 4. Legacy redirects (`/en/<old>/…`, also `/ms/…`; locale-less old paths get a locale from the proxy first)

Old airports: `klia1` → `kul?t=T1`, `klia2` → `kul?t=T2`, `penang` → `pen`, `kota-kinabalu` → `bki`,
`kuching` → `kch`, `langkawi` → `lgk`. `<a>` below is the new code. 308 = equivalent page; 307 = the
closest page for now (also used when an airport lacks the section: it goes to `/<a>`, or PEN/BKI map
to `/<a>/facilities`). All 276 sitemap URLs are covered; the unit test checks every destination exists.

| Old path under the airport | New path | Code |
|---|---|---|
| (airport home) | `/<a>` | 308 |
| `flight-information`, `…/departures`, `…/arrivals` | `/<a>/flights`, `?dir=d`, `?dir=a` | 308 |
| `parking`, `air-travel/parking` | `/<a>/parking` | 308 |
| `map`, `air-travel/location-map` | `/<a>/map` | 308 |
| `air-travel/facilities`, `air-travel/airport-facilities`, `air-travel/services`, `air-travel/services/wifi`, `shop-dine-services/services` | `/<a>/facilities` | 308 |
| `air-travel/public-transport`, `air-travel/rental-services` (`…/vehicle-access-management-system`: 307) | `/<a>/transport` | 308 |
| `air-travel/flight-transfer`, `air-travel/inter-terminal-transfer`, `transit/flight-transfers`, `transit/inter-terminal-transfer` | `/<a>/transit` | 308 |
| `shop-dine-services`, `…/all`, `…/dine`, `…/shop` (`booking-services/things-to-do`, `transit/things-do`: 307) | `/<a>/shop-dine` | 308 |
| `booking-services` | `/<a>/lounges` | 307 |
| `air-travel/services/fast-track` | `/<a>` | 307 |
| `butterfly-effect`, `booking-services/butterfly-effect`, `air-travel/services/butterfly-effect` | `/guides/neurodivergent` | 308 |
| `air-travel/special-assistance`, `air-travel/services/special-assistance` | `/accessibility` | 308 |
| `air-travel/services/lost-and-found` | `/help/lost-property` | 308 |
| `air-travel/baggage` | `/guides/baggage` | 308 |
| `air-travel/security-screening`, `air-travel/lag-restricted-items` | `/guides/security` | 308 |
| `air-travel/customs-and-immigration`, `air-travel/visa` (`air-travel/facial-recognition`: 307) | `/guides/immigration-customs` | 308 |
| `air-travel` | `/guides` | 308 |
| `help` (`air-travel/services/airport-care-ambassadors`, `air-travel/passenger-services-charges`: 307) | `/help` | 308 |
| `booking-services/film-and-photography`, `booking-services/visitation-kul` | `/help/contact` | 307 |
| `air-travel/travel-health-sops` | `/notices` | 307 |
| `mobile-app`, `myairports` | `/offline` (install and offline access) | 307 |
| anything else under an old airport | `/<a>` | 307 |

## 5. How to test

- `npx vitest run src/lib/seo src/components/platform` (redirects matched with Next's own matcher).
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/platform.spec.ts --project=desktop`
  (dev: production-only tests skip themselves, detected by `'unsafe-eval'` in the CSP).
- Production (`npm run e2e`) adds: CSP violations, every sitemap URL is 200, the worker offline test.
- By hand: DevTools > Application (manifest, worker), Network > Offline then reload a visited guide; `curl -I /en/klia1/parking`.

## 6. Known gaps

- Unverified in a running Next.js (server down): Turbopack compiling the worker from
  `register(new URL('./service-worker.ts', import.meta.url))` with its `./sw-routes` import (notes,
  section 13, verified the serving path only), the global 404, headers and redirects over HTTP. Run
  `npm run e2e` (production) first; the config itself was loaded and checked with Next's own loader.
- The global 404 only shows for paths the proxy lets through (file-like paths, unknown `/api/*`);
  everything else gets a locale and the localised not-found page, as before.
- Production consoles will show one `script-src` eval report until the zod request below lands
  (the e2e CSP test ignores exactly that one and fails on anything else).
- 307 stand-ins should become 308s as content is published; the unit test warns when an old
  airport gains a section. Corporate and legal sitemap URLs assume `/corporate/<slug>` and
  `/corporate/news/<slug>`; the production e2e checks every sitemap URL answers 200.
- Each deployment ships a new worker (build version inside), so visitors see the update prompt once per deploy.
- No manifest screenshots or shortcut icons; the saved-page list shows the current language only.

## 7. Requests to other teams

- domain: call `z.config({ jitless: true })` before any zod schema is built in client code (top of
  `src/content/types.ts` and `src/lib/storage.ts`). Zod otherwise probes `new Function`, which this
  CSP blocks: harmless (caught) but reported as a `script-src` violation in production consoles.
- design-system / foundation-ui: make the layout's `robots: { index: false }` follow
  `SITE_INDEXABLE` from `@/lib/seo` for launch; add `<meta name="apple-mobile-web-app-title">` if a
  shorter home-screen name is wanted on iOS; replace `src/app/favicon.ico` (Next.js default) or delete
  it so `icon.svg` is used everywhere.
- integration: set `NEXT_PUBLIC_SITE_URL` and `APP_VERSION` (commit) for production builds; run `npm run e2e`.

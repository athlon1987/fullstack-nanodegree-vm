# Fix log: round two, hand-offs, density and low items (verification open issues 5 to 8)

Round two, 21 November 2026. Items: verification section 4 issues 5 (rate limiting), 6 (the
cross-package hand-offs), 7 (density, A-14) and 8 (low items). The performance engineer's round-two
work (`docs/qa/fixes/round2-performance.md`) was read first and kept: no page-level Suspense was
reintroduced, URL state still goes through `use-url.ts`, and the deferred and idle-loaded pieces
are unchanged.

**Result:** issue 5 fixed; issue 6: 16 hand-offs completed this round and 2 confirmed already
done, 1 partial (E-14), 2 not done (D-07 traveller filter; the other home previews, by choice),
E-11 unchanged; issue 7 partial (provenance tags 27 to 65% fewer, source toggles and "not
published" lines less so); issue 8: 2 fixed, 1 moved one step and documented (CSP), 2 documented
as deliberate, 2 not done.

| # | Verification issue | Status |
|---|---|---|
| 5 | Rate limiting depends on deployment configuration | **Fixed**: start-up warning in production; untrusted per-address fallback with a site-wide ceiling (no longer one bucket for everyone); documented |
| 6 | Hand-offs between packages | **16 done** (B-01 x2, B-09, B-15, C-05, C-06, D-02 x2, D-05, D-08, D-09, D-13, A-21, outlet back link, E-17, E-09 scripts) and 2 confirmed already done (D-15, B-13); **partial**: E-14 (section pages and home only); **not done**: D-07 traveller filter, other home previews off the generator (by choice); E-11 unchanged |
| 7 | Density (A-14) | **Partial**: provenance tags −65% Facilities, −40% Transport, −27% Parking; source toggles −9% and −10%; "not published" −19% and −35% |
| 8 | Low items | **Fixed**: flight-route 404 cache, repeated boarding time; **moved one step and documented**: our inline scripts hashed in the report-only CSP, the enforced CSP keeps `'unsafe-inline'` (reason recorded); **documented as deliberate**: `Link` relations, Geist Mono on the home; **not done**: D-14 reading level, WebKit and CI runs |

## 5. Rate limiting depends on deployment configuration. **Fixed**

- **Fallback that does not throttle everyone together** (`src/lib/concierge/rate-limit.ts`):
  `limitKey()` returns the trusted client key when `TRUSTED_CLIENT_IP_HEADER` or
  `TRUSTED_PROXY_HOPS` is set (unchanged behaviour). Without either it keys on the address
  nearest the server, the last `X-Forwarded-For` entry (which `next start` fills from the socket
  when no proxy does), marked `untrusted:`. Because a client talking to the app directly can set
  that header, every untrusted key also draws on one site-wide ceiling per route group, 10 times
  the per-client limit (`UNTRUSTED_CEILING_FACTOR`, `ceilingPolicy`). Used by `src/proxy.ts` and
  the concierge route (`src/app/api/concierge/route.ts`).
- **Visible at start-up**: `src/instrumentation.ts` (new) prints one `[rate-limit] Client address
  source: …` warning when a production server starts without a usable setting, including a
  value that is set but unreadable (`TRUSTED_PROXY_HOPS=two`). Not printed by `next build` or in
  development (`trustConfigWarning()`).
- **Documented**: `docs/engineering/security.md` section 4 ("When neither is set", with the known
  limit behind an undeclared CDN), `docs/engineering/architecture.md` section 6.9 (deployment
  checklist table for both variables; section 6 text updated), `docs/engineering/handoffs/platform.md`.
- **Verified** on this round's production build:
  - Started without either variable: the warning appeared once in the log, right after "Ready";
    with `TRUSTED_CLIENT_IP_HEADER` set: no warning (0 lines). `next build`: no warning.
  - Unconfigured, `/api/flights` from one address: 200 x 60, then 429, 429; a second address
    straight after: 200; a request with no forwarding header: 200.
  - Unit tests (`src/lib/concierge/server.test.ts`): keys per case, two visitors get their own
    bucket, rotating forged addresses stop at exactly 600 (10 x 60), the warning text for the
    missing, unreadable and complete configurations; the concierge route stops a rotating client
    after 10 with a trusted proxy and at the ceiling (100) without one.
- **Test changed (intended behaviour changed)**: the concierge route test "rotating
  X-Forwarded-For gets 429 after 10" relied on every unconfigured client sharing one bucket. It
  now configures `TRUSTED_PROXY_HOPS=1` (as production must) and still asserts 429 after 10 with
  rotating client-controlled entries; the unconfigured behaviour has its own new test.
- **Left**: behind a CDN that is not declared, the nearest address is a CDN edge, so visitors
  share a few keys and the ceiling; only the configured header or hop count gives one bucket per
  visitor (said in the warning and in `security.md`).

## 6. Hand-offs between packages

| Hand-off | Backlog | Status | What changed |
|---|---|---|---|
| Status lines on the KLIA overview | B-01 | **Done** | `OpsStatusSection` under the overview's notices (`[airport]/page.tsx`): Aerotrain, train and shuttle between terminals, immigration with demo queue estimates (Demo mark). Other airports with an immigration line get that line; airports with none render nothing |
| Status lines on the home notice strip | B-01 | **Done** | `HomeOpsStatus` (new, `src/components/home/home-ops-status.tsx`): one row at the foot of the strip, "Services at KLIA now: 1 service has a notice", opening to the same lines (`variant="inline"`). Always about KLIA, so it never appears or disappears after hydration (no layout shift); strings in `home.strip` (en, ms) |
| Home search off the browser generator, with stale and failed states | B-09 | **Done** | `FlightSearchBox` reads the server feed (`useFlightFeed`) and shows `FeedNotice` (last-known with age, or error with "Try again"). The network scope (21 airports) asks for its boards only while a query is typed, in **one** request: new route `src/app/[lang]/flights/feed/route.ts` (several boards, same `serveFlightFeed` path, 21 KB gzip for all 21) and batching in `use-flight-feed.ts` (`fetchFeedDays`, 3 or more boards of one date and direction). Rate limited as one request (`policyFor`, proxy matcher) |
| Concierge in the phone Search sheet | B-15 | **Done** (was already in the code: quick link "Ask the concierge" in `command-palette.tsx`; the no-result state opens the panel with the question) | New e2e check on the phone project |
| Home shop strip offers only usable filters | C-05 | **Done** (already in the code: `usableFilters` in `home-sections.tsx`, no KLIA outlet has machine-readable hours, so "Open now" is not offered at KLIA) | New e2e check |
| `ensureStatic` on the flights page | C-06 | **Done** (the performance engineer added it) | C-06 e2e test now checks `flights` too (was left out) |
| Fast Track on the KLIA overview | D-02 | **Done** | "Services you can book" on the overview: one card per terminal record (`kul-t1-fast-track`, `kul-t2-fast-track`) with what is not published, "Fast Track details" to the facilities anchor and the booking site; provenance and sources once for the two (they share both) |
| Fast Track step for the flight's terminal | D-02 (B) | **Done** | `journeyExtras` returns `fastTrackByTerminal`; `buildJourney` picks the flight's terminal; `journey.test.ts` asserts T1 and T2 |
| The full "not verified" block on parking, facilities and transport | D-05 | **Done** | `PrototypeGapsLink` (new, `src/components/common/prototype-gaps-link.tsx`): the section heading, one sentence and "See the gaps at KLIA" to `/about-this-prototype#gaps-<airport>`, plus the official link |
| Transit steps read the Aerotrain notice | D-08 | **Done** | `transitData()` passes KLIA's Aerotrain notices; the planner's "Go to your gate" step for Terminal 1 renders `OpsStatus` for the Aerotrain (planned or in effect, with "Read the notice"; otherwise "No disruption reported in our sources as of hh:mm") |
| Malay airport names | D-09 | **Done** for the places listed | `loadAirportPageFor` and `airportSectionMetadata` localise the airport (every airport page's h1, place line, leads and `<title>`, metadata via `localAirport()`); airport cards on the home, the airport directory (names, places, state filter, search in both languages), the switcher and its button, `useAirportContext`, `terminalLabel`, notice scopes (`/ms/notices`), the parking/transport/transit data models, the search index's airport results, the airport named on network flight rows, in search results and on the saved-flight and parked-car notes (`localName()`), and the Malay airport summaries (they printed the English name and city). Demo destinations: `placeCity()` gives "Singapura", "Pulau Pinang", "Singapura (Seletar)" on flight rows, the flight page, the saved-flight cards and the search palette; search matches both forms. Native review remains OOS-14 |
| Home "be at the airport by" reads the rule | D-13 | **Done** | `JourneyTeaser` takes `ARRIVAL_TIME_RULE` (minutes, text, provenance, sources) from the server; `RECOMMENDED_ARRIVAL_MINUTES` in `lib/journey` is the record's value; the duplicate `home.journey.arriveBody` strings were removed |
| Page titles use the section nouns | A-21 | **Done** | "Flights" / "Penerbangan" (lead keeps "Departures and arrivals at …"), "Transport to and from {airport}" / "Pengangkutan ke dan dari {airport}", "Transit and connections at {airport}" / "Transit dan sambungan di {airport}", metadata titles to match; `sections.test.ts` now guards all eight sections (its open hand-off list is empty) |
| Outlet back link on phones | A-01 side effect (C) | **Done** | `globals.css` hides only one-item trails; an outlet keeps "< Shops and food" on phones; the commerce test checks it on both projects again |
| Measurement adopted by pages, privacy text | E-17 | **Done** for the privacy side and the main tasks | Privacy page section "What we measure, and how to turn it off" with a switch (`measurement-switch.tsx`; Global Privacy Control and Do Not Track always win and the switch says so) and `ma:measurement:v1` in the stored-keys table; `data-answer-task` on the parking price matrix (answered, partial or not-published from the data), the board and the flight page (demo); `data-handoff` on parking booking, transport ticket, lounge booking and Fast Track booking links |
| Canonical and alternates in the HTML | E-14 | **Partial** | `pageMetadata` adopted by `airportSectionMetadata` (overview and all eight sections, 39 airports, both languages) and the home. Guides, help, airports, notices, corporate and the rest still rely on the `Link` header (100% of sitemap URLs already carry canonical and both alternates there) |
| Scoped dictionaries | E-11 | **Not changed** | The performance engineer's `I18nPageScope` covers the section namespaces; `flightPages` and `conciergePage` stay in the root dictionary for the reason in their log |
| Inline scripts exported for hashing | E-09 (A) | **Done** | See item 8 |
| Phone menu call row | D-15 | Already done (`panels.tsx`) | – |
| Parking reads `from` and `to` | B-13 (C) | Already done (`parking-calculator-url.tsx`) | – |
| Departing note for citizens shown to everyone | D-07 (B) | **Not done** | Needs a traveller option (citizen or visitor) in the journey; the note's title says who it is for. D-07 also waits for the Immigration Department's wording (OOS) |
| Other home previews off the generator | B-09 (A) | **Not done, by choice** | Board preview, journey teaser, saved-flight card, site search and the commerce gate panel still use the browser generator: not part of B-09's acceptance, and moving them adds feed requests to the home's first load (performance budget); the generator stays in those bundles |

**Tests updated because intended behaviour changed** (recorded in each file): `flights.spec.ts`,
`transport.spec.ts`, `guides.spec.ts` (A-21 titles); `map.spec.ts` (C-06 now includes flights; the
C-07 placeholder line is said once for the section, A-14); `commerce.spec.ts` (outlet breadcrumb on
phones); `smoke.spec.ts` (the desk now also holds the feed's empty status region, so the results
count is located by its text); `sections.test.ts` (A-21); `i18n.test.ts` (the measurement switch
reads `corporatePages` inside `I18nScope`, like `device-data.tsx`); `platform.spec.ts` (the 404 cache
test now includes the flight 404 and also holds `max-age` to 60 s; stricter). No test was removed
or skipped.

**New tests**: `e2e/handoffs.spec.ts` (B-01, D-02, D-05, D-08, D-09, D-13, B-09 with a failing feed
and retry, B-15 phone, C-05, A-14, E-17); unit tests for the rate-limit fallback, the network feed
client (`providers.test.ts`), Fast Track per terminal (`journey.test.ts`), the network feed policy.

## 7. Density (A-14). **Partial**

What changed:
- **Provenance said once per list where items share it**: `sharedProvenance()` (new,
  `src/components/common/shared-provenance.ts`) finds the provenance at least half of a list
  shares; `ProvenanceDefault` ("[Official] unless marked otherwise") states it once above the list,
  and only the other items keep a tag. Facilities directory, transport planner cards, the
  inter-terminal options and the car-park cards. Estimated, Suggestion and Demo tags are never
  hidden (`demo` is never a default), so demo labels stay wherever demo data is shown.
- **Sources once per section where the items share them** (facilities: a section whose items
  have the same sources and date shows one sources marker and date under the cards).
- **Not published once per section**: the facilities placeholders (nursing room and others) say
  "Not published: location, level and opening hours" and the advice once for the section instead
  of on every card; the long "not verified" note left three pages (D-05).

Counts in `<main>` at 390 x 844 (Pixel 7, visible elements; `[data-provenance]` tags including
the one in each "unless marked" line, `[data-source-marker]` toggles, visible "not published"
mentions). Before = verification (Facilities, Transport); Parking and home before = this round's
start, measured on the dev server before the A-14 changes, plus the one tag and toggle the D-05
block had:

| Page | Provenance tags | Source toggles | "Not published" | Demo markers |
|---|---|---|---|---|
| `/en/kul/facilities` | 23 → **8** (−65%) | 23 → 21 (−9%) | 36 → **29** (−19%) | 0 → 0 |
| `/en/kul/transport` | 10 → **6** (−40%) | 10 → 9 (−10%) | 26 → **17** (−35%) | 0 → 0 |
| `/en/kul/parking` | 11 → **8** (−27%) | 9 → 8 | 4 → 4 (both counted after D-05) | 5 → 5 |
| `/en` | 10 → 10 | 3 → 4 (+1: the arrive-by rule now cites its source, D-13) | 0 → 0 | 4 → 4 |

What is left: source toggles. KLIA's facilities and transport records almost all cite different
sources (15 distinct source sets for 22 facilities; 9 for 9 transport options), so grouping only
"where items share sources" removes few; the A-14 target (40% fewer) is met for tags, not for
toggles. Going further means one sources list per section with the item names inside, which A-14's
own acceptance ("per-fact sources behind a small marker") argues against; left for the design
owner. The home page's tags are the provenance legend and the three-kind teaser, which demonstrate
the system, so they were kept. Type sizes were not changed in this round.

## 8. Low items

| Item | Status | Detail |
|---|---|---|
| Enforced CSP allows inline script (E-09) | **Documented, moved one step** | Our four inline scripts now live as strings (`src/lib/inline-scripts.ts`, `src/lib/preferences.ts`) and `next.config.ts` hashes all four into the report-only policy (4 `sha256-` sources in the header, checked). The enforced policy keeps `'unsafe-inline'`: each prerendered page also carries the framework's inline scripts (measured: 57 on `/en/kul`, 40 RSC payload chunks and 10 reveal scripts; 56 on `/en`), whose text differs per page, language and build; Next.js 16.4 cannot emit per-route hashes and nonces need per-request rendering (notes, section 7 and Do/Don't 12). Recorded in `security.md` section 3 |
| Flight-route 404 cache (E-22) | **Fixed** | `flight-route.ts`: `public, max-age=0, s-maxage=60` (was `public, max-age=300`); `curl -I` on the build: 404 with that header. The platform e2e 404 test now includes this path |
| `Link` header lists the canonical URL three times | **Documented as intended** | For an English page: `rel="canonical"`, the self-referencing `hreflang="en"` and `hreflang="x-default"` are three different relations, each expected by the hreflang rules; a Malay page lists its URL twice. No duplicate header (one `Link` for alternates, one for font preloads) |
| Boarding time repeated ("Board from 10:50 10:50") | **Fixed** | Both saved-flight cards (`components/home/saved-flight-card.tsx`, `components/flights/saved-flight-card.tsx`) add the time only when the step title does not already contain it |
| Geist Mono loads on the home (23 KB) | **Documented as intended** | The home shows board-preview times and codes in the data face (`type-data-*`); the font is not preloaded and swaps in after first paint. Removing it from the home would change the board design |
| D-14 reading level | **Not done** | Scripted estimate on the immigration guide this round: grade 9.2, reading ease 52.8 (targets 9 and 55); the longest sentences are 17 to 19 words. Needs a content editor in both languages |
| WebKit phone project, CI (E-06) | **Not done** | WebKit is not installed here (no browser download) and CI cannot run from this container |

## How it was verified

Own production builds (`NEXT_DIST_DIR=.next-r2prod NEXT_PUBLIC_SITE_URL=http://localhost:3212 npx
next build`, 0 warnings, run four times as changes landed), served with
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip NEXT_DIST_DIR=.next-r2prod npx next start -p 3212` (and once
without either variable, for item 5); stopped by PID; `.next-r2prod` and `.next-r2` deleted, the
`.next-r2*` lines removed from `tsconfig.json` and `next-env.d.ts` pointed back at `.next/types`.
The default `.next` was not touched. Visual checks on `next dev -p 3211` (`NEXT_DIST_DIR=.next-r2`).

- `npx tsc --noEmit`: 0 errors. `npx eslint .`: 0 problems. `npx vitest run`: 32 files, **503
  passed** (was 496).
- Playwright, production build, desktop and phone projects (`PLAYWRIGHT_BASE_URL`,
  `E2E_STATUS_CODES=1`): full suite on the third build **342 passed, 0 failed, 6 skipped** (the 5
  deliberate project skips plus B-15 on desktop, which is a phone-only check). On the final build
  (after the last D-09 strings, the lazy home status lines and the C-05 test) every spec again:
  **344 passed, 0 failed, 6 skipped**.
  - A first full run hit 429s on flight pages. Cause found and fixed before the counted runs: the
    home search, now on the feed, sent one request per airport (21 per query), which used up a
    visitor's allowance; the network feed route answers all of them in one request (21 KB gzip).
    (That run was also, by mistake, against a server started without the client header, so all
    workers shared the fallback key; both were corrected.)
- Lighthouse mobile, 3 runs each, final build (`tools/lh.js`; same method as
  `docs/qa/fixes/round2-performance.md`):

  | Page | Performance (runs) | TBT ms median (runs) | LCP s | CLS | Performance engineer's "after" |
  |---|---|---|---|---|---|
  | `/en` | **95** (95/95/98) | 259 (268/259/151) | 1.07 | 0.003 | 95, TBT 244 |
  | `/en/kul` | **94** (94/95/93) | 280 (280/251/314) | 1.07 | 0 | 95, TBT 266 |
  | `/en/kul/transport` (build 3) | 93 (94/78/93) | 286 (286/282/314) | 1.08 (one run 4.5) | 0.003 | not measured |

  Accessibility 100 on every run. A first set on build 3 had the home at 93 (TBT 320): the home
  status row then rendered the four status lines (hidden in the closed row) at hydration; they now
  render when the row is opened, and the summary computes states without queue estimates.
- First-load JavaScript (gzip, `r2/routejs.js`): `/en` 228.8 → 232.6 KB, `/en/kul` 230.0 → 233.4,
  `/en/kul/flights` 234.5 → 235.9, `/en/journey` 254.8 → 256.7 (still the only route over 250);
  section pages unchanged within 0.2 KB. HTML gzip: `/en` 59 → 62 KB and `/en/kul` 55 → 58 KB (KLIA's
  notices for the status lines and the Fast Track block).
- Rate limits and headers by `curl` on the build: see item 5; flight 404 `cache-control: public,
  max-age=0, s-maxage=60`; report-only CSP with 4 script hashes; network feed 200 for valid
  airports, 400 for `airports=zzz`.
- Density counts: `r2h/count.cjs` (Playwright, Pixel 7 at 390 x 844, dev server), before and after
  the A-14 changes on the same server.
- Screenshots looked at (6, dev server): home 1440 x 900 (status row closed, strip still above the
  fold) and 390 (row opened), `/en/kul` 390 (notices then "Services now" with demo queue
  estimates), the Fast Track block at 1440, facilities 390 ("Official unless marked otherwise"
  next to the count), the parking gaps line at 1440.

Scripts (session scratch folder `r2h/`, not in the repository): `count.cjs`, `np.cjs`, `shots.cjs`,
`fp.cjs`; Lighthouse summaries `lh/`, `lh2/`; e2e logs `e2e-full.log`, `e2e3.log`, `e2e4.log`.

## What is left

- A-14 source toggles (see item 7) and type sizes; D-14 plain-language pass; D-07 needs a
  traveller option and the Immigration Department's wording.
- E-14: guides, help, airports, notices, corporate and the other routes still declare canonical
  and alternates only in the `Link` header.
- The home board preview, journey teaser, saved-flight card, site search and commerce gate panel
  still compute demo flights in the browser (B-09 acceptance is met for the home search).
- `/en/journey` first-load JS 256.7 KB (performance engineer's open item, +1.9 KB here).
- Not run here: WebKit project, CI.
- Rate limits behind an undeclared CDN (item 5, "Left").

## Files changed

New: `src/instrumentation.ts`, `src/app/[lang]/flights/feed/route.ts`,
`src/components/home/home-ops-status.tsx`, `src/components/common/prototype-gaps-link.tsx`,
`src/components/common/shared-provenance.ts`, `src/components/corporate/measurement-switch.tsx`,
`src/lib/inline-scripts.ts`, `e2e/handoffs.spec.ts`, this log.

Changed: `src/lib/concierge/rate-limit.ts`, `src/app/api/concierge/route.ts`, `src/proxy.ts`,
`src/lib/concierge/server.test.ts`; `src/app/[lang]/page.tsx`, `src/app/[lang]/[airport]/page.tsx`,
`.../flights/page.tsx`, `.../flights/[flightId]/page.tsx`, `.../facilities/page.tsx`,
`.../parking/page.tsx`, `.../transport/page.tsx`, `.../transit/page.tsx`, `.../map/page.tsx`,
`.../lounges/page.tsx`, `.../shop-dine/page.tsx`, `src/app/[lang]/privacy/page.tsx`;
`src/components/airport/section-page.ts`, `airport-directory.tsx`, `notice-views.server.ts`,
`notices-browser.tsx`; `src/components/home/home-sections.tsx`, `notice-strip.tsx`,
`journey-teaser.tsx`, `saved-flight-card.tsx`, `saved-flight-slot.tsx`, `journey-modes.tsx`;
`src/components/flights/flight-search-box.tsx`, `flight-row.tsx`, `flight-status-hero.tsx`,
`saved-flight.ts`, `saved-flight-card.tsx`, `flight-board-explorer.tsx`, `flight-detail.tsx`,
`journey-content.ts`; `src/components/guides/transit-data.server.ts`, `transit-planner.tsx`;
`src/components/facilities/facilities-directory.tsx`, `facility-card.tsx`;
`src/components/transport/transport-option-card.tsx`, `transport-planner.tsx`,
`terminal-transfers.tsx`, `transport-data.server.ts`; `src/components/parking/car-park-card.tsx`,
`car-park-list.tsx`, `parking-calculator.tsx`, `parking-price-matrix.tsx`, `parking-data.server.ts`;
`src/components/commerce/lounge-card.tsx`; `src/components/common/provenance-tag.tsx`;
`src/components/corporate/storage-keys.ts`; `src/components/search/command-palette.tsx`;
`src/components/shell/airport-switcher.tsx`, `airport-switcher-dialog.tsx`, `global-overlays.tsx`;
`src/content/airports.ts`; `src/lib/flights/query.ts`; `src/lib/hooks/use-airport-context.ts`;
`src/lib/journey/index.ts`, `journey.test.ts`; `src/lib/providers/use-flight-feed.ts`,
`flight-route.ts`, `providers.test.ts`; `src/lib/search/documents.ts`; `src/lib/i18n/en.ts`, `ms.ts`,
`features/flights.ts`, `features/transport.ts`, `features/guides.ts`, `features/corporate.ts`,
`i18n.test.ts`; `src/components/shell/sections.test.ts`; `src/app/globals.css`; `next.config.ts`;
`e2e/map.spec.ts`, `flights.spec.ts`, `transport.spec.ts`, `guides.spec.ts`, `commerce.spec.ts`,
`smoke.spec.ts`, `platform.spec.ts`; `docs/engineering/security.md`, `architecture.md`,
`handoffs/platform.md`.

# QA measurement scripts

The scripts the verification rounds use to measure a production build (`docs/qa/verification.md`,
round four onwards). They are not part of the app, its build or its test suite, and they add no
dependency to `package.json`: the Node scripts use the project's own `@playwright/test` and its
Chromium, the Python scripts use only the standard library, and Lighthouse is installed separately
(below).

## Run them against a local production build

```bash
cd malaysia-airports
NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
# Trust the e2e client header, so each request below can carry its own client address and the
# per-route rate limits cannot show up as broken links or failed loads.
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &
echo $! > /tmp/next-start.pid          # stop it afterwards: kill $(cat /tmp/next-start.pid)
OUT=/tmp/qa && mkdir -p "$OUT"          # anywhere outside the repository
```

Every script that needs a server takes the base URL as an argument (default `http://localhost:3100`;
`first-load-js.mjs` reads the build folder instead). Pass an output path outside the repository: without
one, `crawl-static.py`, `crawl-rendered.mjs`, `canonical.py`, `rc-scan.py` and `first-load-js.mjs` write
a default `<name>.json` into the current folder, which is inside the repository.

| Script | Measures | Run | Pass |
|---|---|---|---|
| `crawl-static.py` | Links in the **server HTML**: every sitemap page plus every page linked from one; each target's status, redirects, and that each `#fragment` exists as an `id` on the target | `python3 scripts/qa/crawl-static.py http://localhost:3100 $OUT/crawl-static.json` | 0 broken, 0 missing anchors (exit 1 otherwise) |
| `crawl-rendered.mjs` | Links **after hydration** in Chromium (1440 x 900, a saved flight, place and parked car, a fixed browser clock): sitemap pages plus 9 client-heavy pages (My journey, flight pages, search results, Arrivals, an unknown flight, offline); fragments checked in the hydrated target | `node scripts/qa/crawl-rendered.mjs --base=http://localhost:3100 --out=$OUT/crawl-rendered.json [--clock=now\|ISO] [--flight=auto\|id]` | 0 broken, 0 missing anchors |
| `search-index.mjs` | Every document in `/en` and `/ms` `search/index.json` answers 200 and its anchor exists | `node scripts/qa/search-index.mjs http://localhost:3100` | 0 broken, 0 missing |
| `canonical.py` | Canonical and `hreflang` on every sitemap URL, the number of distinct canonicals per response (HTML head plus `Link` header), and canonical `<link>`s in the head and in the whole document | `python3 scripts/qa/canonical.py http://localhost:3100 $OUT/canonical.json /en/kul/flights/<id> /en/zzz` | every sitemap URL self-canonical with `en` and `ms`, exactly 1 canonical per response, and exactly 1 canonical `<link>` in its head (round 5) |
| `rc-scan.py` | Which sitemap pages stream their `h1` inside a hidden segment revealed later by React's `$RC` (heading not in the first flush, E-02), and how many reveals each page has | `python3 scripts/qa/rc-scan.py http://localhost:3100 $OUT/rc-scan.json` | 0 pages |
| `first-load-js.mjs` | First-load JavaScript per route (framework plus the route's page and layout chunks), gzip and brotli, from the build manifests; largest chunks and how many routes load each | `node scripts/qa/first-load-js.mjs .next $OUT/first-load-js.json` (no server needed) | E-03: home 250 KB gzip or less; content and guidance pages 170 KB |
| `lighthouse.mjs` | Lighthouse (mobile defaults: Moto G Power, simulated slow 4G, 4x CPU), N serial runs per URL, median per metric, each run with its own `x-e2e-client-ip` (since round 5); `--preset=desktop`, `--profile=airport-wifi,250,1500,500,4` (applied throttling) and `--diagnostics` (LCP element and phases, long tasks, boot-up, render-blocking requests) | `node scripts/qa/lighthouse.mjs $OUT/lighthouse 3 en=http://localhost:3100/en en-kul=http://localhost:3100/en/kul ...` | brief: performance 95 or more, LCP 2.5 s or less, TBT 200 ms or less, CLS 0.1 or less |
| `interaction-latency.mjs` | Interaction latency at 4x CPU on the Pixel 7 profile (Event Timing, the worst interaction per run, as INP counts it): board typing, board direction, home journey mode, home and overview airport switchers | `node scripts/qa/interaction-latency.mjs http://localhost:3100 3` | 200 ms or less |
| `layout-shift.mjs` | CLS of `/en` and `/ms` (or `PATHS=/en/kul/parking,...`) on a 390 x 844 phone, the Pixel 7 (412 x 839) and 1440 x 900 (or `VIEWPORTS=desktop,phone,pixel7`), with the shifted nodes on `verbose`; `CPU=4` (and `NET=1`) for a slow device | `node scripts/qa/layout-shift.mjs http://localhost:3100 3` | 0.1 or less (the home has measured 0 since round three) |
| `acceptance-round4.mjs` | The numbers behind the round-four acceptance table (re-review 6.1 items 1 to 10 and the gallery notes): status-line texts, the day-of-travel card and timeline, concierge answers and phone heights, search results, positions, density counts, airport depth labels, hand-off attributes, Malay copy, 404s, the offline page with the production service worker. One JSON line per block; the e2e suite holds the pass/fail assertions | `node scripts/qa/acceptance-round4.mjs http://localhost:3100 [status,day,...]` | read against `docs/qa/verification.md`, round four |
| `acceptance-round5.mjs` | The numbers behind the round-five acceptance table: the concierge's flights from the feed (browser and API), HTML sizes and icon references, the flight page's first flush and 404s, the catch-all 404s, the board at night, density on the flight page, My journey and the overview, parking density, the search index, the transport fare row, the airports map labels, desktop shift on the section pages, and axe on the states round five added (light and dark, 390 and 1440). One JSON line per block | `node scripts/qa/acceptance-round5.mjs http://localhost:3100 [concierge,html,...,axe]` | read against `docs/qa/verification.md`, round five |
| `type-sizes.mjs` | A-14's type-size count (distinct computed font sizes of visible text in `<main>`) on every sitemap page plus My journey and a flight page, with a saved flight, at 390 and 1440 px | `node scripts/qa/type-sizes.mjs http://localhost:3100 $OUT/type-sizes.json` | at most 8 on every page (A-14) |
| `night-clock.cjs` | Not a measurement: a `--require` preload that runs the unchanged e2e suite with the browser clock at night (tests that pin their own clock keep it) | `NODE_OPTIONS="--require ./scripts/qa/night-clock.cjs" E2E_NIGHT=2026-11-18T23:30:00+08:00 npx playwright test --trace off` (keep the date of the pinned tests, 18 November) | the suite passes as it does by day |

The ten Lighthouse pages the verification rounds compare (keys as in `docs/qa/lighthouse-round*`):

```bash
B=http://localhost:3100
node scripts/qa/lighthouse.mjs docs/qa/lighthouse-roundN 3 \
  en=$B/en ms=$B/ms en-kul=$B/en/kul en-kul-flights=$B/en/kul/flights en-kul-map=$B/en/kul/map \
  en-kul-transport=$B/en/kul/transport en-kul-parking=$B/en/kul/parking en-guides=$B/en/guides \
  en-concierge=$B/en/concierge en-journey=$B/en/journey
```

## Dependencies

- **Node 22** and the project's dev dependencies (`npm ci`): the Node scripts import `@playwright/test`
  and use its Chromium (`npx playwright install chromium` once, if it is not installed yet). Run them
  from the `malaysia-airports` folder so the import resolves.
- **Python 3.9 or later**, standard library only, for the `.py` scripts.
- **Lighthouse is not a project dependency** and should not be added to `package.json` (it pulls in
  about 300 packages). Install it in a folder of its own and point the harness at it:

  ```bash
  npm install --prefix ~/.cache/qa-lighthouse lighthouse@13.6.0
  export LIGHTHOUSE_CLI=~/.cache/qa-lighthouse/node_modules/lighthouse/cli/index.js
  ```

  The harness runs Lighthouse with Playwright's Chromium unless `CHROME_PATH` names another browser.
  The CI budget step uses Lighthouse CI instead (`npm run budgets`, `lighthouserc.json`), which `npx`
  fetches on demand.

## Reading the numbers

- These are **lab** measurements on whatever machine runs them. Lighthouse TBT moves by 60 to 100 ms
  between sessions on a shared 4-vCPU container, so compare medians of at least 3 runs, measured in
  the same session, and say so when a difference is within that spread.
- Flight pages, the board and the home previews are generated from the server clock, so flight links
  (and the rendered crawl's totals) change from run to run; broken and missing counts must not.
- Every request carries its own `x-e2e-client-ip`. Against a server that does not trust that header,
  rate limits will turn into failures that are not defects.

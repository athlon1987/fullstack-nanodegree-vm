# Performance evaluation (lab)

Independent QA, role: web performance engineer. Measured 18 November 2026, 09:11 to 09:45 UTC, against the existing
production build (`.next/BUILD_ID` `j7VkfkZXItJvC8-BseSYP`, Next.js 16.4.6, React 19.3) served with `next start -p 3101`.
Nothing was rebuilt and nothing under `src/` was changed. Raw summaries: [`docs/qa/lighthouse/`](lighthouse/).
Findings as JSON: [`performance.json`](performance.json).

**Every number here is lab evidence.** The brief's targets (LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less)
are 75th-percentile field values. The prototype has no public traffic and no Chrome UX Report data, so nothing below
can confirm or refute the field targets. It shows how likely they are to be met, and why they would not be.

Labels used: **[measured]** is a number this evaluator observed with the tool named; **[judgement]** is expert
assessment.

## 1. Verdict against the brief

| Target | Lab result | Verdict |
|---|---|---|
| Lighthouse performance at least 95 (mobile) | 56 to 92 on 15 pages, median of 3 runs; none reaches 95. Home `/en` 56, `/ms` 65. Desktop preset: `/en` 92, `/en/kul/flights` 100 [measured] | **Not met** |
| Lighthouse accessibility at least 95 | 100 on all 15 mobile pages and both desktop pages [measured]. Automated checks only | **Met (automated)** |
| LCP 2.5 s or less | Standard Lighthouse mobile (simulated slow 4G): 9 of 15 pages pass (1.1 to 1.3 s); 6 fail at 4.1 to 4.8 s (`/en`, flight detail, `/en/journey`, map, shop and dine, transit). Applied-throttling cross-check: `/en` 1.9 s, map 2.0 s, but `/en/journey` 5.3 to 5.6 s. Malaysian median mobile network: 1.2 s. Congested airport Wi-Fi: 2.8 to 2.9 s [measured] | **At risk**: fails on `/en/journey` with any throttling and on slow networks |
| INP 200 ms or less | Worst interaction per page (Event Timing, 4x CPU, median of 3 runs): board 784 ms, home 408 ms, airport page 248 ms, journey 216 ms, map 112 ms, concierge 96 ms. During hydration: up to 1,472 ms on `/en` [measured] | **Not met** on 4 of 6 pages |
| CLS 0.1 or less | `/ms` 0.16 (3 of 3 Lighthouse runs); desktop footer shift 0.23 to 0.29 on `/en`, `/ms`, `/en/kul`, `/en/concierge` (2 of 2 Playwright loads each, 1 of 3 Lighthouse desktop runs); `/en/journey` 0.11 to 0.23; `/en/concierge` 0.14 on mobile [measured] | **Not met** |
| Page weight budget (product strategy section 7: homes 1,000 KB, JS 250 KB, fonts 150 KB; guidance pages 500 KB; 40 requests) | Homes 701 to 703 KB (pass) but JS 337 KB and fonts 206 KB (fail); guidance pages 582 to 720 KB (fail); 37 to 64 requests, 11 of 15 pages over 40 [measured] | **Partly met** |

The prototype is 47 to 50 times lighter than MAHB's measured homepage (701 KB against 32.7 to 34.3 MB) and
scores far higher (56 against 9 to 19), but it is not yet the fast site the brief asks for. The gap is almost entirely
main-thread work and rendering order, not bytes: demonstration flights are generated in the browser during
hydration and on every keystroke, every page's content streams through a Suspense fallback that shifts the footer
and delays the largest paint, and the shell ships about 120 KB (gzip) of JavaScript to every route. [judgement]

## 2. Method

| Step | Tool and settings |
|---|---|
| Lighthouse mobile | Lighthouse 13.6.0 CLI, headless Chromium 153 (`/opt/pw-browsers/chromium-1243`), default mobile config: Moto G Power emulation, simulated throttling (Lantern) at 150 ms RTT, 1.6 Mbps down, 4x CPU. 3 runs per page, median reported per metric; diagnostics from the run with the median performance score. Wrapper `docs/qa/lighthouse/scripts/lhx.js` (based on the project's `tools/lh.js`). |
| Lighthouse desktop | Same CLI with `--preset=desktop`, 3 runs, `/en` and `/en/kul/flights`. |
| Malaysian network | Applied (DevTools) throttling with Lighthouse's own conversion (request latency = RTT x 3.75, throughput x 0.9), 4x CPU, 3 runs each on `/en` and `/en/kul/flights`. Profiles in section 5. |
| Applied slow-4G cross-check | Same 150 ms / 1.6 Mbps / 4x CPU as the default, but applied instead of simulated, 2 runs on `/en`, `/en/kul/map`, `/en/journey`, to test whether the simulated 4.4 s LCPs were modelling artefacts. |
| Interaction latency | Playwright 1.63 Chromium, Pixel 7 emulation (touch), CDP `Emulation.setCPUThrottlingRate {rate: 4}` for the whole session, no network throttling. `PerformanceObserver({type: 'event', durationThreshold: 16, buffered: true})`; entries grouped by `interactionId`, longest per interaction; plus `long-animation-frame` entries for script attribution. Interactions start 1.5 s after `networkidle` (hydrated); a second script taps during hydration. 3 fresh contexts per page. Script `scripts/inp.js`, `scripts/early.js`. |
| Layout shifts and LCP | Playwright, Pixel 7 and 1440 x 900, `layout-shift` and `largest-contentful-paint` observers with sources, 2 loads per page and viewport; a MutationObserver logged when React revealed each streamed Suspense segment (`scripts/cls.js`, `scripts/reveal.js`); h1 height with and without the display font (`scripts/fontcheck.js`). |
| Main-thread attribution | CDP `Profiler` (200 µs sampling) during a 4x-throttled load; self time by script and by function, callers of the hottest function (`scripts/cpuprof.js`, `scripts/callers.js`). |
| Weight | Per-route first-load JavaScript from `.next/build-manifest.json` (`rootMainFiles`) plus `entryJSFiles` of each `page_client-reference-manifest.js` (page and its layouts), gzip level 9 and brotli of each file (`scripts/routejs.js`). Transfer per page from Lighthouse `resource-summary` and `network-requests`. HTML and inline RSC payload sizes with `curl`. Service worker: a first visit to `/en` with every request recorded (page, prefetch, worker) and Cache Storage summed (`scripts/sw.js`). |

## 3. Environment and caveats

- One shared 4-vCPU cloud container. Other evaluators ran browsers and another `next start` on port 3102 at the same
  time (load average 1 to 4). Lighthouse `benchmarkIndex` ranged 1,318 to 2,511 (median 2,232) over 69 runs. TBT and
  the interaction figures move with that contention: the spread is visible in the per-run columns (for example
  `/en` 54/56/76). The median of three is reported; single runs should not be quoted.
- The server is on `localhost`: no TLS, no CDN, no geographic distance, time to first byte 10 to 135 ms. Simulated
  throttling models the network, so scores are comparable in kind with the benchmark measurements, but the applied
  profiles add latency per request only, not packet loss or radio wake-up.
- `next start` compresses with gzip only. A production CDN serving brotli would cut JavaScript by about 13 percent
  (first-load JS 263 KB gzip against 228 KB brotli on `/en`).
- The prototype has no analytics, tag manager, chat widget, images or video. A production site that adds any of these
  will be slower than measured here.
- Lighthouse SEO is 63 on every page because the prototype sends `noindex, nofollow` by design (and 54 on the flight
  detail page, which also has no `meta description` in the HTML Lighthouse saw); SEO is not assessed here.
- Flight data is the labelled demonstration provider, generated in the browser. A real flight API would change where
  the work happens; section 7 explains why the cost is still an architecture issue.
- Playwright's mobile emulation marks every layout shift `hadRecentInput: true` even with no input; no input was sent
  before the shifts reported, so they are counted.
- Event Timing durations are rounded to 8 ms. With fewer than 50 interactions per page, INP equals the worst
  interaction, which is what is reported.

## 4. Lighthouse results

### 4.1 Mobile, default throttling (15 pages, 3 runs each)

| Page | Perf. (median; runs) | A11y | FCP | LCP (median; runs) | TBT | CLS | Transfer KB (JS / fonts / HTML / prefetch) | Requests | LCP element |
|---|---|---|---|---|---|---|---|---|---|
| `/en` | **56** (54/56/76) | 100 | 1.3 s | **4.8 s** (4.8/5.0/1.3) | 1,391 ms | 0 | 701 (337 / 206 / 79 / 64) | 45 | `h1#home-title` |
| `/ms` | **65** (65/65/66) | 100 | 1.3 s | 1.3 s | 1,978 ms | **0.161** | 703 (337 / 206 / 81 / 60) | 45 | `p.type-body-sm` |
| `/en/kul` | **78** (78/59/80) | 100 | 1.1 s | 1.1 s | 992 ms | 0 (0.246 in run 2) | 768 (426 / 125 / 71 / 125) | 64 | `h1` |
| `/en/kul/flights` | **81** (81/66/84) | 100 | 1.1 s | 1.1 s (1.1/4.1/1.1) | 790 ms | 0 | 676 (381 / 125 / 61 / 88) | 51 | page lead |
| `/en/kul/flights/mh184-20261118-d` | **64** (64/65/64) | 100 | 1.4 s | **4.4 s** | 872 ms | 0 | 762 (407 / 125 / 129 / 80) | 50 | n/a |
| `/en/journey` | **64** (64/64/66) | 100 | 1.1 s | **4.5 s** | 845 ms | 0 | 577 (322 / 125 / 69 / 40) | 38 | empty-state text |
| `/en/kul/map` | **68** (68/68/68) | 100 | 1.2 s | **4.4 s** | 679 ms | 0.003 | 686 (366 / 125 / 78 / 82) | 51 | page lead |
| `/en/kul/transport` | **89** (89/75/89) | 100 | 1.2 s | 1.3 s (1.3/4.3/1.2) | 429 ms | 0 | 720 (397 / 125 / 77 / 98) | 56 | page lead |
| `/en/kul/parking` | **83** (83/84/66) | 100 | 1.1 s | 1.2 s (1.2/1.1/4.1) | 677 ms | 0 | 718 (397 / 125 / 71 / 104) | 58 | page lead |
| `/en/kul/shop-dine` | **67** (88/67/62) | 100 | 1.1 s | **4.1 s** (1.1/4.1/4.2) | 824 ms | 0 | 716 (397 / 125 / 69 / 106) | 56 | page lead |
| `/en/guides` | **91** (92/91/90) | 100 | 1.1 s | 1.1 s | 391 ms | 0 | 606 (330 / 125 / 60 / 70) | 43 | page lead |
| `/en/kul/transit` | **68** (73/68/66) | 100 | 1.2 s | **4.3 s** | 705 ms | 0.003 | 690 (379 / 125 / 74 / 92) | 53 | page lead |
| `/en/concierge` | **91** (85/91; 1 run `NO_NAVSTART`) | 100 | 1.1 s | 1.1 s | 612 ms | 0 | 597 (336 / 125 / 58 / 58) | 40 | page lead |
| `/en/corporate` | **92** (89/92/93) | 100 | 1.1 s | 1.1 s | 338 ms | 0 | 598 (324 / 125 / 69 / 60) | 40 | page lead |
| `/en/airports` | **81** (81/69/91) | 100 | 1.1 s | 1.2 s (1.2/3.8/1.1) | 767 ms | 0 | 582 (322 / 125 / 60 / 55) | 37 | page lead |

"Prefetch" is the Lighthouse `other` type: Next.js RSC prefetches of links in the viewport (8 to 24 requests per page).
Images: none on any page. Third-party requests: none. Time to Interactive (simulated) 4.3 to 6.4 s on every page.
The longest task on `/en` was 1,202 ms (simulated 4x) in the React DOM chunk `01t2i9pe5vz2-.js`, 1,419 ms on `/ms`.

**Why LCP is bimodal (1.1 s or 4.1 to 4.8 s) on the same page.** On every page the main content sits inside the
Suspense boundary created by `src/app/[lang]/loading.tsx`; it is streamed as a hidden segment and revealed by React's
inline `$RC` script, which batches reveals with a 300 ms throttle. On localhost the LCP element painted 350 to 650 ms
after first contentful paint on `/en`, flight detail, journey and map (observed FCP 139 to 294 ms, observed LCP 538 to
665 ms). Lighthouse's simulator then treats every request that started before that paint (all the JavaScript) as a
dependency of LCP, which gives 4.4 s. When FCP and LCP coincide the simulated LCP is 1.1 s. The applied-throttling
cross-check (section 5.3) shows the true slow-4G LCP is 1.9 to 2.0 s on `/en` and the map, so the 4.4 s figures
overstate the field risk on those pages; they still show that the largest paint waits for the reveal. [measured; the
attribution to Lantern's dependency rule is judgement]

### 4.2 Desktop preset (3 runs each)

| Page | Perf. (runs) | A11y | FCP | LCP | TBT | CLS (runs) | Transfer KB (JS / fonts / HTML / prefetch) | Requests |
|---|---|---|---|---|---|---|---|---|
| `/en` | **92** (76/92/94) | 100 | 0.3 s | 0.3 s (0.9/0.3/0.3) | 228 ms | 0.002 (**0.295**/0.002/0.002) | 810 (347 / 206 / 79 / 159) | 63 |
| `/en/kul/flights` | **100** (100/100/100) | 100 | 0.3 s | 0.3 s | 34 ms | 0.002 | 877 (436 / 125 / 61 / 235) | 83 |

Desktop prefetches more because more links are in the viewport: 235 KB over 39 RSC prefetch requests on the board
page (and 35 script files instead of 26), more than its own HTML, CSS and fonts together.

## 5. Malaysian network realism

### 5.1 Profiles

| Profile | Down / up | RTT | CPU | Basis |
|---|---|---|---|---|
| Lighthouse default (simulated) | 1.6 / 0.75 Mbps | 150 ms | 4x | Lighthouse "slow 4G" |
| **Malaysian median mobile** (applied) | 154 / 35 Mbps | 40 ms | 4x | Download: Ookla Speedtest Global Index, Malaysia median mobile download 154.13 Mbps (April 2026, as reported by Technave). Upload: 34.78 Mbps median mobile upload (Ookla data cited by TechWire Asia, July 2026). Latency: no national median was found in two searches; Ookla's H1 2026 connectivity report gives state medians from 25.29 ms (Putrajaya) to 76.30 ms (Sabah), so 40 ms is an assumption towards the populous Klang Valley end. 4x CPU stands for a mid-range Android phone. |
| **Congested airport Wi-Fi** (applied) | 1.5 / 0.5 Mbps | 250 ms | 4x | Defined by this evaluator [judgement]: a free terminal network shared by a full gate area, with a per-device rate cap of a few Mbps and queueing delay under load (bufferbloat) of a few hundred milliseconds; between Lighthouse's slow-4G (150 ms) and "regular 3G" (300 ms) latencies. Packet loss and captive-portal interstitials are not modelled, so real congested Wi-Fi is likely worse. |

### 5.2 Results (3 runs each, median)

| Page | Profile | Perf. (runs) | FCP | LCP (runs) | TBT | CLS |
|---|---|---|---|---|---|---|
| `/en` | Malaysian median | 74 (75/74/73) | 0.5 s | **1.2 s** (1.2/1.2/1.3) | 1,539 ms | 0 |
| `/en/kul/flights` | Malaysian median | 77 (76/77/78) | 0.6 s | **1.2 s** (1.3/1.2/1.1) | 1,091 ms | 0.003 |
| `/en` | Congested Wi-Fi | 63 (62/63/65) | 2.4 s | **2.9 s** (3.1/2.9/2.8) | 1,956 ms | 0 |
| `/en/kul/flights` | Congested Wi-Fi | 69 (68/69/69) | 2.4 s | **2.8 s** (2.8/2.6/2.8) | 1,264 ms | 0.003 |

On a typical Malaysian mobile connection the network is not the bottleneck: LCP is 1.2 s, but performance stays at
74 to 77 because 1.1 to 1.5 s of blocking main-thread work remains. On congested airport Wi-Fi, the context in which
passengers check a gate, LCP misses 2.5 s on both pages: HTML (79 KB, half of it the dictionary, section 6.3), the
render-blocking stylesheet (20 KB) and the display font, which is only discovered after the stylesheet (Fraunces
starts at 2.4 s, its italic at 2.9 s, against 1.0 s for the preloaded interface font). [measured]

### 5.3 Applied slow-4G cross-check (2 runs each)

| Page | Perf. | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| `/en` | 74 (74/73) | 1.9 s | 1.9 s | 1,344 ms | 0 |
| `/en/kul/map` | 78 (75/78) | 2.0 s | 2.0 s | 1,118 ms | 0.003 |
| `/en/journey` | **50** (46/50) | 1.7 s | **5.6 s** (5.6/5.3) | 1,027 ms | **0.211** |

`/en/journey` paints its real content only after hydration: the server sends a skeleton
(`src/components/flights/my-journey.tsx:104`) and the empty state replaces it about 3.5 s later, pushing the footer
(the shifted node) and becoming the LCP element. [measured]

## 6. Weight

### 6.1 First-load JavaScript per route (from the build manifests)

| Route | Chunks | Framework (gzip KB) | Shell layout (gzip KB) | Page-specific (gzip KB) | Total gzip KB | Total brotli KB | Raw KB |
|---|---|---|---|---|---|---|---|
| flight detail | 16 | 128.6 | 120.1 | 26.6 | **275.3** | 238.5 | 896 |
| `/en/journey` | 15 | 128.6 | 120.1 | 25.6 | 274.3 | 237.7 | 895 |
| `/en/kul/map` | 16 | 128.6 | 120.1 | 22.0 | 270.7 | 234.9 | 880 |
| `/en/kul/flights` | 15 | 128.6 | 120.1 | 18.7 | 267.4 | 231.8 | 868 |
| `/en/kul/parking` | 15 | 128.6 | 120.1 | 15.9 | 264.6 | 229.2 | 867 |
| `/en/kul` | 16 | 128.6 | 120.1 | 15.8 | 264.5 | 229.2 | 861 |
| `/en`, `/ms` | 14 | 128.6 | 120.1 | 14.3 | **263.0** | 227.8 | 862 |
| `/en/kul/transport` | 15 | 128.6 | 120.1 | 12.9 | 261.6 | 226.7 | 853 |
| `/en/kul/shop-dine` | 15 | 128.6 | 120.1 | 12.8 | 261.5 | 226.7 | 850 |
| `/en/concierge` | 15 | 128.6 | 120.1 | 12.5 | 261.2 | 226.3 | 853 |
| `/en/kul/transit` | 15 | 128.6 | 120.1 | 9.8 | 258.4 | 223.9 | 842 |
| `/en/airports` | 14 | 128.6 | 120.1 | 5.3 | 254.0 | 219.9 | 825 |
| `/en/guides` | 14 | 128.6 | 120.1 | 3.5 | 252.2 | 218.3 | 820 |
| `/en/corporate` | 14 | 128.6 | 120.1 | 1.6 | **250.3** | 216.6 | 813 |

Framework = `rootMainFiles` (React DOM 69.9 KB, Next.js runtime 45.4 KB, others). The shell layout is the same eight
chunks on every route (`src/app/[lang]/layout.tsx` and its client components). Identified by content:

| Shell chunk | gzip KB | Contents (identified by strings in the chunk) | Source |
|---|---|---|---|
| `3ja1rs91hq4qc.js` | 34.1 | zod 4 (classic API) and the content schemas; Lighthouse: 22 to 24 KB of it unused at load | `src/lib/preferences.ts:16`, `src/lib/stores.ts:7`, `src/content/types.ts:17` |
| `0to19dt37pvik.js` | 22.7 | about 145 lucide icons (341 SVG paths) in the name-keyed registry | `src/components/ui/icon.tsx:1-156` |
| `20zi65_zsmw1-.js` | 19.4 | Radix primitives, `src/lib/time.ts` helpers, i18n provider | |
| `1-bh0-bkmho_q.js` | 13.0 | Radix primitives | |
| `15u7jvsixbpbh.js` | 12.7 | demonstration flight generator, routes and airlines, airport choices | `src/lib/providers/demo-flights.ts`, `demo-routes.ts` |
| `2ig0w-gcw1ov4.js`, `2ocm0rsuz_94i.js`, `3diz016hpphtg.js` | 18.2 | shell overlays, service-worker client, stores | |

Transferred JavaScript per page (Lighthouse) is higher, 322 to 426 KB, because prefetching loads the chunks of linked
routes as well. **No route, not even the static corporate page, gets below the 250 KB budget set for the homes.**
[measured]

### 6.2 Transfer per page against the budget

| Budget (product strategy, metrics table) | Result [measured, Lighthouse mobile median] |
|---|---|
| Homes 1,000 KB or less | `/en` 701 KB, `/ms` 703 KB: **pass** |
| Home JavaScript 250 KB | 337 KB transferred (263 KB first-load): **fail** |
| Home fonts 150 KB | 206 KB (all four files; the Fraunces italic, 80 KB, sets two words of the h1): **fail** |
| Images 300 KB | 0 KB, no images: **pass** |
| Guidance pages 500 KB or less | `/en/airports` 582, `/en/guides` 606, `/en/corporate` 598, `/en/kul/transit` 690, `/en/kul/transport` 720 KB: **fail** |
| 40 requests or fewer | 37 to 64; only `/en/journey`, `/en/airports`, `/en/concierge` and `/en/corporate` within: **fail on 11 of 15** |

### 6.3 HTML and the inline RSC payload

| Page | HTML raw KB | HTML gzip KB | Inline RSC share of the HTML |
|---|---|---|---|
| `/en` | 362 | 78 | 60% |
| `/ms` | 376 | 79 | 61% |
| `/en/kul` | 332 | 70 | 61% |
| `/en/kul/flights` | 255 | 60 | 70% |
| flight detail | **500** | **127** | **85%** |
| `/en/journey` | 272 | 68 | 84% |
| `/en/kul/map` | 427 | 77 | 52% |
| `/en/concierge` | 233 | 57 | 76% |
| `/en/guides` | 255 | 59 | 70% |

The single largest item is the whole interface dictionary, passed as a prop to the client `I18nProvider`
(`src/app/[lang]/layout.tsx:72`): 126.9 KB of JSON (38.9 KB gzip) in every document, including 28.7 KB of corporate
copy on passenger pages. That is about half of the home page's compressed HTML. The flight detail page serialises the
dictionary twice and its `FlightDetail` props twice (each copy carries the whole airport object, 19 KB, from
`src/app/[lang]/[airport]/flights/[flightId]/page.tsx:106`); `/en/journey` passes 33 KB of notes and 19 KB of sources
to `MyJourney` (`src/app/[lang]/journey/page.tsx:73`). [measured]

### 6.4 Fonts

Self-hosted woff2, `font-display: swap`, immutable caching, no font CDN. Hanken Grotesk 34 KB (preloaded by a `Link`
header), Fraunces 66 KB and Fraunces italic 80 KB (`preload: false`), Geist Mono 23 KB (`preload: false`); file sizes,
all woff2 and served without further compression. Pages load
3 fonts (125 KB); the homes load 4 (206 KB). Fraunces sets the home `h1` (the LCP element on `/en`), yet it is not
preloaded (`src/fonts/index.ts:14-25`, comment: "Display type is below the fold on most pages"). [measured]

### 6.5 Service worker and first-visit cost

A first visit to `/en` on a Pixel 7 profile [measured, `browser-lab/sw-results.json`]:

| Phase | Requests | Bytes (compressed) |
|---|---|---|
| Page load (to `load`) | 20 | 486 KB |
| RSC prefetch after load | 15 | 55 KB |
| Other after-load page requests (lazy chunks, two fonts) | 8 | 155 KB |
| Service worker install | **94 fetches for 28 distinct URLs** | 401 KB as reported |
| **Total first visit** | **138** | **1.07 MB** |

The worker precaches `/en`, `/ms`, `/en/offline`, `/ms/offline` with `cache: 'reload'` (so from the network) and then
saves the page the visitor is on: `/en` is downloaded three times on a first visit (78 KB each). The four pages are
saved in parallel and each checks `cache.match` before fetching its assets, so shared chunks are fetched up to four
times (`src/components/platform/service-worker.ts:149-150` and `saveAssets` at line 187). Assets already in the HTTP
cache do not cost network bytes, but the 349 KB of HTML documents do. Cache Storage after install: 2.5 MB
uncompressed (4 pages 1.20 MB, 23 static files 1.27 MB). Registration waits for `load`
(`src/components/platform/sw-client.ts:81`), which is right, but on slow Wi-Fi the install competes with the
passenger's next tap. [measured; the "competes" point is judgement]

## 7. Interaction latency (INP proxy)

Worst interaction per page, 4x CPU, Pixel 7 touch emulation, after hydration, 3 runs [measured, `browser-lab/inp-results.json`]:

| Page | Interaction | Duration per run | Median | Input delay / processing / presentation (run 1) |
|---|---|---|---|---|
| `/en/kul/flights` | **type "MH" in the board filter** | 784 / 832 / 736 | **784 ms** | 0 / 0 / 784 (work in the `input` handler; long animation frame 729 ms, 523 ms of script) |
| | clear the board filter | 328 / 304 / 304 | 304 ms | 31 / 189 / 109 |
| | toggle a status chip; switch to Arrivals | 64, 48 | 56, 48 ms | |
| `/en` | **switch journey mode to Arriving** | 392 / 400 / 520 | **400 ms** | 27 / 302 / 63 |
| | open the airport switcher | 376 / 408 / 320 | 376 ms | 38 / 153 / 185 |
| | close it (Escape) | 240 / 152 / 176 | 176 ms | |
| | switch Departures to Arrivals; Transiting | 104 to 168 | 160, 144 ms | |
| | type "MH184" in the flight search | 88 / 80 / 160 | 88 ms | |
| `/en/kul` | **open the airport switcher** | 224 / 248 / 304 | **248 ms** | 20 / 92 / 112 |
| `/en/journey` | **switch Departures to Arrivals** | 208 / 216 / 216 | **216 ms** | 34 / 137 / 37 |
| `/en/kul/map` | toggle category filters, change level, type "toilet" | 40 to 128 | **112 ms** (worst) | |
| `/en/concierge` | accept consent, type a question, submit | 40 to 96 | **96 ms** (worst) | |

**During hydration** (tap at DOMContentLoaded plus 0, 300 and 600 ms, 4x CPU) [measured, `browser-lab/early-results.json`]:
on `/en` the "Arriving" tap took 1,280 to 1,472 ms; on the board the Arrivals tab took 928 to 968 ms. Three of the six
early taps on `/en` and two of six on the board did not take effect at all (the radio or tab stayed unchanged), which
confirms the known issue in `docs/engineering/handoffs/integration.md` section 6, item 1.

**Where the time goes.** A CDP CPU profile of a 4x-throttled load of `/en` (2.8 s of busy main thread) puts the
largest self time not in React but in `zonedParts` from `src/lib/time.ts:60-62` (653 ms), which calls
`Intl.DateTimeFormat.formatToParts` for each generated flight time. Its callers are `DemoFlightProvider.forDate` and
`listFlightsSync` (`src/lib/providers/demo-flights.ts:451`), called during React render from the home page chunk: the
home flight search box builds a search pool for every demonstration airport at render, before anyone types
(`src/components/flights/flight-search-box.tsx:104-110`). The same generation reruns when the journey mode flips the
direction (`src/components/flights/flight-direction.ts`), which is the 302 ms of processing in the "Arriving" tap, and
when the board switches from the time window to the two-day search window on the second character
(`src/components/flights/flight-board-explorer.tsx:88-104`, `board-model.ts:138-144`), which is the 784 ms keystroke: a
profile of typing "MH" (`scripts/keyprof.js`) shows 1,048 ms of busy main thread at 4x, of which `zonedParts` is the
largest single item (296 ms), and the result renders 262 list rows at once.
None of these updates is deferred (`useDeferredValue` or `startTransition`), and a new provider instance (with an
empty per-instance cache) is created every 30 seconds by `useFlightProvider` (`src/lib/hooks/use-flight-provider.ts:17-19`,
`src/lib/providers/index.ts:36-38`), so the work repeats while the page is open. [measured; the fixes are judgement]

## 8. Layout shifts

| Page and viewport | CLS | Shifted element | Cause | Evidence |
|---|---|---|---|---|
| `/en`, `/ms`, `/en/kul`, `/en/concierge` at 1440 x 900 | **0.23 to 0.29** | `footer` moves from y = 640 out of the viewport | First layout shows the shell, the `loading.tsx` skeleton and the footer; the streamed page content then replaces the skeleton | Playwright 2 of 2 loads per page; Lighthouse desktop `/en` 1 of 3 runs (0.295). Lighthouse mobile `/en/kul` also had 0.246 in 1 of 3 runs, but its shifted element was not kept (diagnostics are saved for the median run only), so that run is not attributed. The MutationObserver log shows the fallback inserted at 57 to 78 ms, the hidden segments revealed at 108 to 137 ms and the shift at 126 to 186 ms |
| `/ms` home, mobile and desktop | **0.158** (mobile), 0.154 (desktop) | the flight search card and everything below move up 27 px (mobile) or 56 px (desktop) | The Malay `h1` "Perjalanan anda, terhubung dengan indah." wraps to 2 lines in the fallback face and 1 line in Fraunces; Fraunces arrives after first paint because it is not preloaded | Lighthouse mobile 3 of 3 runs (0.161); Playwright 2 of 2; with Fraunces blocked the h1 is 54 px tall on mobile, 27 px with it (108 against 54 px on desktop). English is unaffected |
| `/en/journey` | **0.23** (mobile), 0.11 (desktop), 0.21 (applied slow 4G) | `footer` | `MyJourney` renders a skeleton until hydrated, then the empty state, which has a different height | Playwright 2 of 2 per viewport; Lighthouse applied 2 of 2 |
| `/en/concierge`, mobile | **0.14** | the "How answers are put together" aside | `ConciergeChat` renders a skeleton until hydrated (`src/components/concierge/concierge-chat.tsx:229`), then the taller consent panel | Playwright 2 of 2 |
| `/en/kul` and other airport pages | 0.002 to 0.003 | header `div.ml-auto` ("KUL") | small, client-side airport label change | all runs |

The footer shift is reported by the browser's own `layout-shift` entries, which are what field CLS uses, even though
it lands just before first paint in some loads; whether a given load sees it depends on whether a frame is laid out
between the fallback and the reveal, which is why Lighthouse catches it in some runs only. A shift seen in 1 of 3
desktop runs and 2 of 2 Playwright loads makes a p75 desktop CLS above 0.1 plausible. [measured; the field
extrapolation is judgement]

## 9. Comparison with MAHB and the benchmarks

Same tool family (Lighthouse 13, mobile, simulated slow 4G), but the benchmarks were measured over the internet with
third parties blocked, and this prototype on localhost with none to block; treat the scores as order-of-magnitude
evidence. Benchmark figures from `docs/research/direct/lighthouse/README.md` (17 November 2026).

| Site (homepage) | Perf. | A11y | LCP | TBT | CLS | Weight | Requests |
|---|---|---|---|---|---|---|---|
| **This prototype `/en`** | **56** (54 to 76) | **100** | 4.8 s (1.9 s applied) | 1,391 ms | 0 mobile; 0.29 desktop (some loads) | **0.70 MB** | 45 |
| **This prototype `/ms`** | 65 | 100 | 1.3 s | 1,978 ms | 0.161 | 0.70 MB | 45 |
| MAHB KLIA T1 | 9 (19 in an earlier run) | 79 | 6.9 s (5.2 s) | 4,461 ms | 0.621 | 32.7 MB (34.3 MB) | 171 |
| MAHB departures | 17 (earlier run) | 82 | 17.5 s | n/a | 0.453 | 2.3 MB | 114 |
| Dubai | 68 | 100 | 6.1 s | 26 ms | 0 | 4.4 MB | 94 |
| Changi | 58 | 74 | 7.9 s | 379 ms | 0.077 | 21.0 MB | 122 |
| Heathrow | 56 | 92 | 6.3 s | 393 ms | 0.102 | 1.8 MB | 47 |
| Istanbul | 53 | 78 | 16.7 s | 163 ms | 0 | 5.9 MB | 100 |
| Haneda | 49 | 80 | 24.5 s | 732 ms | 0.062 | 13.2 MB | 187 |
| Munich | 47 | 47 | 8.7 s | 389 ms | 0 | 4.6 MB | 63 |
| Hong Kong | 28 | 68 | 8.9 s | 2,454 ms | 0.184 | 2.3 MB | 59 |
| Incheon | 27 | 79 | 25.1 s | 2,403 ms | 0 | 4.5 MB | 215 |

The comparable board page: MAHB departures LCP 17.5 s and CLS 0.453 against `/en/kul/flights` 1.1 s, CLS 0,
performance 81.

Reading: the prototype is 47 times lighter than MAHB's homepage and has the lightest page of the whole set (Heathrow
1.8 MB was the lightest benchmark), the best LCP and the best accessibility score jointly with Dubai. It does **not**
lead on main-thread work: its home TBT (1.4 s) is above every benchmark except Hong Kong, Incheon and MAHB, and Dubai
(26 ms) and Istanbul (163 ms) show that an airport homepage can stay near zero. Its home performance score (56) is
in the middle of the benchmark pack rather than above it, entirely because of TBT. [measured figures; reading is
judgement]

## 10. Causes, in order of impact

1. **Demonstration flights generated on the main thread, at render, synchronously** (`src/lib/providers/demo-flights.ts:406-499`,
   `src/lib/time.ts:60-62`, `src/components/flights/flight-search-box.tsx:104-115`,
   `src/components/flights/flight-board-explorer.tsx:88-110`, `src/lib/hooks/use-flight-provider.ts:17-19`). Drives
   the home TBT, the board keystroke (784 ms), the journey-mode switch (400 ms) and hydration-time taps of 1 to 1.5 s.
   With a real API the board would still filter and render the whole window synchronously on each keystroke.
2. **Every page streams through the `[lang]/loading.tsx` Suspense fallback** (`src/app/[lang]/loading.tsx:8-23`,
   applied to all fully static pages): skeleton first, content revealed by inline script after the whole page body
   and React's 300 ms reveal batching. Causes the desktop footer shift (0.23 to 0.29), the 350 to 650 ms LCP render
   delay and the 4.1 to 4.8 s simulated LCPs (the delay and simulated LCP are attributed with reasonable but not
   complete certainty: the reveal timing was measured, the simulator's dependency rule is inferred).
3. **Hydration-gated skeletons** in `MyJourney` (`src/components/flights/my-journey.tsx:104`) and `ConciergeChat`
   (`src/components/concierge/concierge-chat.tsx:229`): CLS 0.11 to 0.23 and a 5.3 to 5.6 s LCP on `/en/journey`.
4. **Display font not preloaded but used above the fold** (`src/fonts/index.ts:14-25`; `src/components/home/home-sections.tsx:62`):
   the `/ms` CLS of 0.16, late LCP on congested Wi-Fi, and 80 KB of italic for two words.
5. **Shell JavaScript on every route** (120 KB gzip): zod classic, the full icon registry, the demo generator and Radix
   in `[lang]/layout`; every route is 250 to 275 KB gzip before it does anything.
6. **Dictionary in every document** (`src/app/[lang]/layout.tsx:72`, `src/lib/i18n/client.tsx:33`): 39 KB gzip of
   each page's HTML, parsed during hydration; doubled on the flight detail page.
7. **Aggressive prefetch** (Next.js `Link` default): 8 to 24 RSC requests (40 to 125 KB) on every mobile load and up
   to 235 KB on desktop, competing with the page on slow links.
8. **Service-worker install** fetches `/en` again twice, `/ms` and both offline pages, with duplicate asset fetches
   (`src/components/platform/service-worker.ts:149-195`).
9. Smaller items: one render-blocking stylesheet (20 KB gzip, Lighthouse estimates 160 ms); `t.count` creates a new
   `Intl.NumberFormat` per call (`src/lib/i18n/translate.ts:79`, 61 ms self time at 4x on `/en/guides`); gzip only
   from `next start`.

## 11. Findings

| ID | Severity | Title | Page |
|---|---|---|---|
| performance-01 | high | Lighthouse mobile performance below 95 on all 15 pages (56 to 92) | all |
| performance-02 | high | Board filter keystroke takes 736 to 832 ms (INP proxy) | `/en/kul/flights` |
| performance-03 | high | Home hydration blocks the main thread 1.4 to 2.0 s; journey-mode and airport-switcher taps 320 to 520 ms; taps during hydration 1.3 to 1.5 s | `/en`, `/ms` |
| performance-04 | high | Desktop CLS 0.23 to 0.29: footer shift from the `loading.tsx` fallback | `/en`, `/ms`, `/en/kul`, `/en/concierge` |
| performance-05 | high | CLS 0.16 on the Malay home page from the late display font | `/ms` |
| performance-06 | high | My journey: skeleton swapped after hydration, CLS 0.11 to 0.23, LCP 5.3 to 5.6 s on slow 4G | `/en/journey` |
| performance-07 | medium | LCP element waits for the streamed-segment reveal; simulated LCP 4.1 to 4.8 s on 6 pages; 2.8 to 2.9 s on congested Wi-Fi | 6 pages |
| performance-08 | medium | Every route ships 250 to 275 KB gzip of first-load JS; 120 KB of shell code including zod, the full icon registry and the demo generator | all |
| performance-09 | medium | The whole dictionary (39 KB gzip) is inlined in every HTML document; flight detail HTML 127 KB gzip with duplicated payloads | all |
| performance-10 | medium | Fonts 206 KB on the homes (budget 150 KB); display face not preloaded | `/en`, `/ms` |
| performance-11 | medium | Service worker first install: 94 fetches, `/en` downloaded three times, 1.07 MB first visit | `/en` |
| performance-12 | medium | Concierge: chat skeleton until hydration, CLS 0.14 on mobile | `/en/concierge` |
| performance-13 | medium | Viewport prefetch costs 40 to 125 KB per mobile load and 235 KB on the desktop board | all |
| performance-14 | low | Airport switcher open 224 to 304 ms and journey direction switch 208 to 216 ms | `/en/kul`, `/en/journey` |
| performance-15 | low | Page-weight and request budgets exceeded on guidance pages | guidance pages |
| performance-16 | low | `Intl.NumberFormat` constructed on every plural lookup | many |

Full evidence, expected result and suggested fix for each are in [`performance.json`](performance.json).

## 12. What is already good

- Weight: 577 to 768 KB per page (mobile), no images, no third parties, no font CDN, immutable caching on every hashed asset,
  self-hosted fonts with `swap` and metric-adjusted fallbacks for the interface face. [measured]
- Accessibility 100 on every page measured, mobile and desktop (automated). [measured]
- Desktop board 100; map and concierge interactions stay under 130 ms at 4x CPU. [measured]
- On a median Malaysian mobile connection LCP is 1.2 s on the home and board pages. [measured]
- Pages are prerendered (`x-nextjs-prerender: 1`, `s-maxage=31536000`) apart from the flight detail page. [measured]

## 13. Reproduce

```bash
cd malaysia-airports && npx next start -p 3101 &   # stop it by its PID afterwards
# Lighthouse (from the project's tools folder, which holds lighthouse 13.6):
node docs/qa/lighthouse/scripts/lhx.js out 3 home=http://localhost:3101/en
node docs/qa/lighthouse/scripts/lhx.js out 3 --preset=desktop home=http://localhost:3101/en
node docs/qa/lighthouse/scripts/lhx.js out 3 --profile=my-median,40,154000,35000,4 home=http://localhost:3101/en
node docs/qa/lighthouse/scripts/lhx.js out 3 --profile=airport-wifi,250,1500,500,4 home=http://localhost:3101/en
# Browser lab (Playwright; NODE_PATH must point at a playwright install):
node docs/qa/lighthouse/scripts/inp.js 3      # interactions, writes inp-results.json
node docs/qa/lighthouse/scripts/cls.js 2 /en /ms /en/journey /en/concierge
node docs/qa/lighthouse/scripts/sw.js; node docs/qa/lighthouse/scripts/cpuprof.js /en
node docs/qa/lighthouse/scripts/routejs.js    # per-route JS from .next manifests
```

The scripts hold absolute paths to the evaluator's scratch folder (`TOOLS`, `NEXT`); adjust them before reuse. Flight
ids are date-based (`mh184-20261118-d`); take a current one from the board.

Files: `lighthouse/mobile/` (15 pages), `lighthouse/desktop/`, `lighthouse/my-median-mobile/`,
`lighthouse/airport-wifi/`, `lighthouse/slow4g-applied/` (one compact summary per page with per-run rows and the
diagnostics of the median run), `lighthouse/browser-lab/` (interaction, layout-shift, CPU-profile, service-worker and
per-route JS results), `lighthouse/scripts/`.

## Sources for the network profile

- [Technave: Malaysia ranked 25th for mobile internet speed (Ookla Speedtest Global Index, 154.13 Mbps)](https://technave.com/gadget/Malaysia-is-currently-ranked-25th-for-the-best-mobile-internet-speed-in-the-world-46713.html)
- [TechWire Asia: AI workloads and APAC mobile networks (Malaysia median upload 34.78 Mbps, Ookla data)](https://techwireasia.com/2026/07/ai-workloads-apac-mobile-networks/)
- [Business Today: Ookla H1 2026 Malaysia connectivity report (state medians, latency 25.29 ms Putrajaya to 76.30 ms Sabah)](https://www.businesstoday.com.my/2026/09/09/u-mobile-tops-mobile-network-1h-ranking-unifi-best-in-video-while-ipoh-fastest-city-ookla/)
- [SoyaCincau: Ookla Speedtest, U Mobile best mobile network H1 2026](https://soyacincau.com/2026/09/09/ookla-speedtest-u-mobile-malaysia-best-mobile-network-h1-2026/)

The Speedtest Global Index page itself could not be fetched from this environment; the figures are as reported by the
outlets above (search results of 18 November 2026).

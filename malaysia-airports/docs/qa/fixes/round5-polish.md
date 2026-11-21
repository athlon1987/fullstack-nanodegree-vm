# Fix log: round five, polish and small defects

Round five, 21 November 2026 (measurements 17:46 to 18:35 UTC, 01:46 to 02:35 Kuala Lumpur time, 22 November).
Package: polish. Items from `docs/qa/verification.md`, round four, F8 items 5, 7 and 10 (and E-14), in the order
given. Owned paths only, except **one cross-package change of two lines in `src/app/[lang]/layout.tsx`** (item 6,
below) and one updated assertion in `e2e/transport.spec.ts` (item 3, an intended change).

| # | Item | Status |
|---|---|---|
| 1 | `[lang]/[...rest]` 404s (F8 item 7) | **Fixed**: `/en/kul/zzz`, `/en/nothing/here`, `/en/a/b/c`, `/ms/kul/zzz`, `/ms/tiada/halaman` answer **404 with the site shell, the title and the "Page not found" / "Halaman tidak ditemui" `h1` in the server HTML** (was Next.js's empty `__next_error__` document), first and repeat request; 0 console errors besides the document's own 404 line |
| 2 | Search index "[object Object]" (F8 item 10) | **Fixed**: 2 → **0** documents per language (`airline:kul:mh`, `airline:pen:cx`); summaries now carry the check-in text in the page language; a typed `joinParts` makes an unpicked localized field a type error |
| 3 | Density on the parking page (F8 item 5; A-14, 6.1.7) | **Fixed** (layout log recommendation applied): source toggles 8 → **3** (−63%), "Demo" tags 4 → **0** with the list's banner as the **one Demo marker** of the view, chips on the cards 13 → **4**, provenance tags 8 → **4**, type sizes **7 / 8** (390 / 1440 px, unchanged, at most 8); the one-fact-one-answer rate line and its test unchanged |
| 4 | Transport desktop CLS and the Malay fare at 125% (F8 item 10) | **Fixed**: desktop CLS **0.0197 → 0.0004 (en), 0.0224 → 0.0012 (ms)**; the fare row now shifts nothing (0 in every load, desktop and phone, also at 4x CPU); the rest is the shared header's airport switcher (another package). Malay fare at 125% text on a 390 x 844 phone **881–931 px → 720–770 px**, inside the first screen (English 780–830 → 619–669). At 1440 x 900 and 125% the fare was already in the first screen in both languages (692–742 px before and after) |
| 5 | `/en/airports` map labels (F8 item 10) | **Fixed**: "LGK" 2 to 5 px outside the drawing at every width → **0 of 5 labels** outside at 320, 360, 390, 640, 768, 1024, 1280, 1440 and 1920 px and at 200% zoom; LGK also clear of the Alor Setar marker |
| 6 | Canonical in the HTML head (E-14) | **Fixed**: canonical in the head on **152 → 276 of 276** sitemap pages; **1 distinct canonical per response on 276 of 276**, `Link` header unchanged (1 per response, no preload entries); flight pages and 404s also carry it in the head, matching the header |
| 7 | `.gitignore` | **No change needed**: `/.lighthouseci/`, `/test-results/`, `/playwright-report/` and `/.data/` were all already ignored when this package started (F8's note about `.lighthouseci/` is out of date) |

## Method

- **Builds.** Four production builds into `.next-r5polish-prod` (`NEXT_PUBLIC_SITE_URL=http://localhost:3253`),
  served by `NEXT_DIST_DIR=.next-r5polish-prod TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3253`:
  build 1 the baseline (the tree as I found it, with the speed package's work in progress), build 2 with items 1 to 6
  (the "after" Lighthouse and first-load numbers), build 3 the tree after the speed package finished (one refinement:
  the fare figure's box), build 4 final (the figure's amount as its own element, LGK's baseline). All "before" numbers
  are mine on build 1, on this machine, in this session. The dev server (`NEXT_DIST_DIR=.next-r5polish npx next dev -p 3243`) was used for
  quick looks and one Playwright run.
- **Noise.** A 4-vCPU container shared with two other engineers. My baseline Lighthouse ran while the speed package's
  Lighthouse was also running (load average 1.2 to 1.8; benchmark index 2,060 to 2,723); the "after" runs had the
  machine to themselves (2,226 to 2,997). TBT differences below are within the 60 to 100 ms the README warns of.
- **Scripts.** `scripts/qa/lighthouse.mjs` (Lighthouse 13.6 from the scratchpad's `tools/`, mobile defaults, 3 runs,
  median), `first-load-js.mjs` on the build folder, `canonical.py`, `rc-scan.py`; and small Playwright scripts (not
  committed; copied into `scripts/qa/` only while they ran, then removed) for 404 HTML and console, the search index,
  the A-14 counts (round four's `acceptance-round4.mjs` method: visible `[data-provenance]`, `[data-source-marker]`,
  `[data-demo-marker]`, chips, distinct font sizes of elements with their own text), layout shift (round four's
  `layout-shift.mjs` method: the sum of `layout-shift` entries without input for 3.5 s after `load`, 3 loads, with
  the shifted nodes), the fare's position and the map labels' boxes.
- Git: see "Builds and clean-up" (one read-only command by mistake).

## 1. The `[lang]/[...rest]` catch-all. Fixed

**Cause.** `src/app/[lang]/[...rest]/page.tsx` called `notFound()` at the top of the page. For any path it does not
list, Next.js served the route's fallback shell (`◐ /en/[...rest]`) and the throw happened outside every boundary, so
the response was its bare error document (`<html id="__next_error__">`): no site shell, no `<title>`, no body; the
browser then drew "Page not found" under the site's default title.

**Change.** The page renders `MissingPage` (round four's server-rendered 404 body with its signal inside a
`<noscript>` boundary), like every other route for a param it does not list; `generateMetadata` gives the not-found
title and `noindex, nofollow` (as `airportSectionMetadata` does for an unknown airport); `ensureStatic = 'navigation'`
(as on the airport routes), so an unlisted path waits for the full render instead of the fallback shell and the first
response is already the complete 404. Build table: `◐ /en/[...rest]` is gone; `○ /en/not-found` and `○ /ms/not-found`.

| Production, `curl` and Chromium | Before (build 1) | After (builds 2 and 3) |
|---|---|---|
| `/en/kul/zzz`, `/en/nothing/here`, `/en/a/b/c`, `/ms/kul/zzz`, `/ms/tiada/halaman`, first and repeat request | 404, `__next_error__`, no `<title>`, no `h1`, no shell, no skip link | **404**, no `__next_error__`, `<title>Page not found \| Malaysia Airports</title>` (Malay: `Halaman tidak ditemui \| …`), the `h1` in the HTML, site header, skip link, `noindex, nofollow` |
| Browser title, `/en/kul/zzz` | "Malaysia Airports: Your journey, beautifully connected." | **"Page not found \| Malaysia Airports"** |
| Console errors | the 404 resource line | the 404 resource line only; no React error, no failed boundary (`<!--$!-->`) |
| `/en/no-such-page`, `/en/not-found` (other routes) | 404 with shell | unchanged |

Note: like the other `MissingPage` routes, Next.js stores each unknown path's rendered 404 in its route cache (1-minute
revalidation from `ShortSharedCache`); that was already the case for `/en/<anything>` through `[airport]`, and is
now also the case for deeper paths. Bounding that store is a deployment matter (a cache handler with a size limit);
listed under "Open".

Files: `src/app/[lang]/[...rest]/page.tsx`. Tests: `e2e/polish-round5.spec.ts`, "catch-all 404s with the site shell"
(4 addresses, 2 in each language: status on first and repeat request, title, `h1`, header, skip link, `noindex`, no
failed boundary, browser title and console).

## 2. Search index "[object Object]". Fixed

**Cause.** `airline.checkIn` is localized text (`{ en, ms }`) and was joined into the airline summary without `pick`.
TypeScript allowed it because `Array.prototype.join` takes anything.

**Change.** `pick(airline.checkIn, lang)`; the three summary joins go through a new `joinParts(separator, parts)`
typed to `string | undefined`, so passing a localized object is now a type error.

| `/{lang}/search/index.json`, production | Before | After |
|---|---|---|
| Documents containing "[object Object]" (en / ms) | 2 / 2 (`airline:kul:mh`, `airline:pen:cx`) | **0 / 0** |

Files: `src/lib/search/documents.ts`. Tests: `src/lib/search/search.test.ts` (3 new: no document in either language
has "[object Object]" in any field, no field holds an object or an array with a non-string, both airline summaries
are non-empty text in both languages) and the e2e "search index" test on the served JSON.

## 3. Density on the parking page (A-14, 6.1.7). Fixed

Round four's layout log recommendation, applied in full, plus two reductions of the same kind:

- **One source list per section.** The car-park cards take `groupedSources` (no toggle of their own) and the list
  ends with one `SectionSourceList` whose sources name the car parks they support, for the cards and the table view
  alike (the table had no sources before). The price table's three per-row toggles became one list under the table,
  with the same per-row sources (the reported figures' own, else the car park's). The calculator keeps its one.
- **One Demo marker per view.** The "Demo" tag beside each simulated-space chip is gone; the list's demonstration
  banner (with its Freshness row) is the marker. So that the space is never read as live, its label on every card and
  the table's column now say so in words: **"Simulated space" / "Ruang simulasi"** (was "Space now").
- **Fewer chips.** Features are a plain list with check marks (were chips); the rate-status chip beside "Rates"
  repeated the first words of the rate line under it ("Rates not verified: …"), so the line keeps the cue as an icon
  (warning or check glyph) and the words; the table view keeps its status chips.

Counts on `/en/kul/parking` (production; 390 x 844 unless stated):

| | Before | After |
|---|---|---|
| Source toggles | 8 (3 price rows, calculator, 4 cards) | **3** (price table, calculator, car-park list): −63% |
| "Demo" tags | 4 (+ 1 banner) | **0** (+ 1 banner: one marker in the view) |
| Provenance tags (all) | 8 | **4** |
| Chips on the cards | 13 (4 space, 5 features, 4 rate status) | **4** (the simulated space) |
| Type sizes | 7 (11 13 14 16 18 22 32); 8 at 1440 px | **7**; **8** at 1440 px (unchanged; at most 8) |
| Rate lines (`data-rate-line`) | 8 | 8 |
| Page length | 11.3 screens (ms 12.0) | 11.2 (ms 11.9) |

Malay: the same counts. The one-fact-one-answer test (`e2e/ask-round4.spec.ts`) passes unchanged.

Files: `src/components/parking/{car-park-card,car-park-list,car-park-values,parking-price-matrix}.tsx`,
`src/lib/i18n/features/transport.ts` (`availability.simulatedTitle`, en and ms). Tests: `e2e/polish-round5.spec.ts`
"parking density" (budget: 1 toggle in the list, at most 3 on the page, 2 section lists, 1 Demo marker and 1 banner in
the list, only simulated-space chips on cards, at most 4 provenance tags, at most 8 type sizes, "Simulated space" and
one rate line on every card, the list names "Long Term Car Park", axe) and its Malay check. **Updated test (intended
change):** `e2e/transport.spec.ts` asserted that the Preferred Parking card contains "Demo"; it now asserts "Simulated
space" (the banner check before it is unchanged).

## 4. Transport: desktop layout shift and the Malay fare at 125%. Fixed

**Cause of the shift.** The answer-first fare row (round four) rendered, before React knew today's date, every dated
fare in the figure column ("RM 55 until 31 Dec 2026", "RM 65 from 1 Jan 2027") and nothing under the name; after, one
figure ("RM 55") and two dated lines under the name. The row grew by 48 px and pushed the warning, the jump links and
everything under them down (the shifted nodes in every load: `div "Book taxis only…" 733 → 781`, `nav 677 → 725`).

**Change** (`src/components/transport/transport-glance.tsx`): the row has the same shape before and after.
- One figure. Before the clock is read a dated place shows its lowest fare as **"from RM 55"** (true on any date;
  never one period's fare as if it were today's); after, today's fare. The cell reserves the width of the widest
  figure it can show (an invisible pseudo-element, not in the accessibility tree or the text), the figure fills it
  right-aligned, and the amount is its own element, so dropping "from " leaves "RM 55" where it was.
- One line per dated fare in both states. Before: each fare with its dates. After: which applies today, which comes
  next, which has ended ("RM 55 until 31 Dec 2026, ended", new strings in both languages).
- A grid instead of a wrapping flex row, so the figure stays beside the option's name at every width and text size:
  at 125% on a phone it no longer drops below the name, time and dates.

| Production | Before (build 1) | After |
|---|---|---|
| Desktop 1440 x 900, `/en/kul/transport`, 3 loads | 0.0197 / 0.0197 / 0.0197 (fare row 0.0193) | build 2: 0.0006 (figure 0.0002); **final: 0.0004** ×3, all of it the header switcher |
| Desktop 1440 x 900, `/ms/kul/transport`, 3 loads | 0.0224 ×3 (fare row 0.0212) | build 2: 0.0014 (figure 0.0002); **final: 0.0012** ×3, all of it the header switcher |
| Phone 390 x 844, en and ms | 0 | 0 |
| 412 x 823 at 4x CPU (Lighthouse's case), 3 loads | not measured | build 2: 0.0036 (figure 0.0011: its right-aligned box narrowed); build 3: 0.0032 (figure text 0.0007); **final: fare row 0**; header 0.0025 (en), 0.0047 (ms) |
| Fare figure, 390 x 844, 125% text, ms | **881–931 px** (screen 844) | **720–770 px** |
| … en, 125% | 780–830 px | **619–669 px** |
| … en / ms, 100% | 433 / 495 px | 433 / 495 px |
| Fare figure, 1440 x 900, 125%, en and ms | 692–742 px | 692–742 px |
| Touting warning, 390 x 844 (en / ms / ms 125%) | 711 / 774 / 1,211 px | 736 / 798 / 1,266 px; still before every taxi and e-hailing option (C-02) |

The task named 1440 x 900 for the Malay fare; there it was already in the first screen (742 px bottom, the same as
English). Round four's 881 px was measured on a 390 x 844 phone (`verification.md`, F4 item 6), and that is what is
fixed. The remaining shift is the header's airport switcher narrowing after hydration (`div.ml-auto "KLIA, change
airport (currently KLIA)"`, 170 → 75 px wide on a phone), outside this package: 0.0004 (en) and 0.0012 (ms) at
1440 px, 0.0025 and 0.0047 at 412 px with 4x CPU.

Lighthouse mobile, 3 runs, median (runs in brackets):

| `/en/kul/transport` | Before (build 1) | Build 2 | Final (build 4) |
|---|---|---|---|
| Performance | 94 (94/88/95) | 97 (97/98/95) | **97** (96/97/97) |
| LCP | 1.08 s | 1.07 s | 1.07 s |
| TBT | 280 ms (280/484/274) | 188 ms (188/165/256) | 200 ms (219/191/200) |
| CLS | 0 (0/0/0) | 0.004 (0.004/0.004/0.001) | 0.003 (×3): the header switcher only |
| Bytes / requests | 593.0 KB / 39 | 593.9 KB / 39 | 594.0 KB / 39 |

`/ms/kul/transport`, final: performance 96 (96/95/96), LCP 1.07 s, TBT 228 ms, CLS 0.005 (×3, the header switcher's
longer Malay label). Lighthouse's CLS was 0 before and is 0.003 to 0.005 now although the fare row's shift is gone: the old shift
happened only at desktop width, which Lighthouse's mobile run does not use, and the 0.003 to 0.005 now is the header
switcher's (the only shift in my 412 px, 4x CPU loads of the final build). I did not measure that case on build 1, so
whether the header's shift is new this round is not known; it is not in this package's code. The e2e budget and the
layout-shift script are the measures for this item.

First-load JavaScript (gzip): transport 179.9 → **180.6 KB** (final build).

Tests: `e2e/polish-round5.spec.ts` "transport fare row": a CLS budget of **0.01** at 1440 x 900 in both languages
(production only), the same number of dated lines with and without JavaScript, the fare inside the 844 px screen and
above the warning at 125% on a phone in both languages, and inside 900 px at 125% on desktop; the round-four
placement test (`e2e/layout-round4.spec.ts`) passes unchanged. The clock is fixed in November 2026 in these tests.

## 5. The `/en/airports` schematic map. Fixed

**Cause.** Langkawi sits 24 drawing units from the Peninsular panel's west edge and its label was drawn to the left of
the marker, so about 4 units of "LGK" fell outside the SVG and were clipped. The drawing scales as a whole, so this
happened at every width and zoom (−2 to −5 px measured).

**Change** (`src/components/airport/network-map.tsx`, the map only): `labelPlacement()` puts a label on the other side
of its marker when it would cross the panel's edge, and keeps its baseline inside; LGK's baseline is lifted 3 units so
the label also clears the Alor Setar marker it then sits beside.

| Production, `/en/airports`, labels outside their drawing | Before | After |
|---|---|---|
| 320, 360, 390, 640, 768, 1024, 1280, 1440, 1920 px | LGK at every width | **0 of 5** |
| 1280, 1440 and 1920 px at 200% zoom (half the CSS width, 2x pixels) | LGK | **0 of 5** |

Tests: `src/components/airport/network-map.test.ts` (4: every international airport labelled, every label inside its
panel, every label clear of the other markers in its panel, LGK to the right) and e2e "network map labels" (7 widths
and zooms, each label's box inside its SVG's box). Looked at: 1440 px and 320 px.

## 6. Canonical in the HTML head (E-14). Fixed

**Cause.** Only pages whose `generateMetadata` calls `pageMetadata` or `airportSectionMetadata` set `alternates`; 124
of 276 sitemap pages (guides, help, corporate, news, airports, concierge, journey, notices, privacy, terms, and so on,
in both languages) relied on the `Link` header alone.

**Change.** The root layout's metadata now sets `alternates: INHERITED_ALTERNATES` (`{ canonical: './' }`, defined
and documented in `src/lib/seo/metadata.ts`). Next.js resolves `./` against the path being rendered with
`metadataBase`, which is exactly the URL `alternateLinkValue` puts in the `Link` header, so a response still carries
one distinct canonical. Pages that call `pageMetadata` replace the whole `alternates` object (segments merge
shallowly), so no page gets two. Only the canonical is inherited: hreflang needs the other locale's path, which a
relative URL cannot express, and the `Link` header gives it on every page. The `reactMaxHeadersLength: 0` fix is
untouched: no preload entries in `Link`, one `Link` header per response.

| `canonical.py`, production | Before | After |
|---|---|---|
| Canonical in the HTML head | 152 of 276 | **276 of 276** |
| Canonical in the `Link` header | 276 | 276 |
| Distinct canonicals per response | 1 on 276 | **1 on 276** |
| `Link` headers per response; preload entries in `Link` | 1 on 276; 0 | 1 on 276; 0 |
| 404s (`/en/kul/zzz`, `/en/zzz`, `/ms/kul/zzz`, `/en/nothing/here`) | header only | head and header, the same URL |
| A flight page (`/en/kul/flights/ak6336-20261122-d`) | header only | head (byte 2,408, before `</head>`) and header, the same URL; its `h1` still inline (byte 22,538, before the first hidden segment) |

**Cross-package change:** `src/app/[lang]/layout.tsx` (design-system / shell): one import name and one metadata line
(`alternates: INHERITED_ALTERNATES`, with a comment). Nothing else in the file was touched.

Tests: `src/lib/seo/seo.test.ts` (2 new: `./` resolves, with Next.js's own resolver, to the same path and origin as
the `Link` header's canonical for home, guide, help, news, flight and 404 paths in both languages; `pageMetadata`
still gives a complete `alternates`), e2e "canonical in the HTML head" (12 pages that had none: exactly one
`rel="canonical"` in the document, in the head, equal to the header's; 5 pages with their own metadata: exactly one).
The existing canonical tests in `e2e/platform.spec.ts` pass.

## 7. `.gitignore`. No change needed

`malaysia-airports/.gitignore` already has `/test-results/`, `/playwright-report/`, `/.data/` and `/.lighthouseci/`
(and `/.next-*/`, which covers every engineer's build folder). Verified by reading the file (no git command).

## Regression checks (production, final build)

- `$RC`: `rc-scan.py` on builds 2 and 4: **0 of 276** pages with the `h1` in a hidden segment; 1,264 reveals in all,
  the same distribution as round four.
- `canonical.py` on build 4: the same as build 2 (276 of 276 in the head, 1 distinct per response, 0 preload entries).
- First-load JavaScript, gzip KB (build 1 → build 4): catch-all 161.6 → 161.6; parking 187.6 → 187.9; transport
  179.9 → 180.6; airports 170.6 → 170.8; home 195.5, flight page 198.1, search 186.0 unchanged; 0 of 39 routes over
  250 (largest 212.0).
- Lighthouse mobile, 3 runs, median, parking: performance 96 (two valid runs, 96/92; the first failed with
  `NO_NAVSTART`) → **97** on build 2 (97/97/98) and on build 4 (95/99/97); LCP 1.13 → 1.09 s; TBT 360 → 197 and 183
  ms; CLS 0.003 → 0.003 and 0; 601.8 → 602.3 KB; 43 requests. Airports (build 2): 97 (97/99/97) → **99** (99/99/98);
  LCP 0.92 → 0.91 s; TBT 181 → 125 ms; CLS 0 → 0; 519.9 → 520.2 KB.
- Type sizes on parking unchanged (7 at 390 px, 8 at 1440 px); C-06 (every airport and section pair answers 200 or
  404 with a matching title, first and repeat request) passes on build 4 (`E2E_STATUS_CODES=1`).

## Tests and checks

- `npx tsc --noEmit`: clean. `npx eslint` on every owned path, the layout and the two specs: clean.
- `npx vitest run`: **577 passed** (40 files), including the 9 new unit tests (search 3, SEO 2, network map 4).
- Playwright, desktop project, `--trace off`, against the final production build (port 3253): `e2e/polish-round5.spec.ts`
  (new, 21 tests) with `transport`, `layout-round4`, `ask-round4`, `platform`, `shell`, `map`, `commerce` and `smoke`:
  **144 passed, 0 failed, 1 skipped** (C-06 in `map.spec.ts`, skipped whenever `PLAYWRIGHT_BASE_URL` is set; run
  separately with `E2E_STATUS_CODES=1`: **passed**). Build 3 gave the same (144, 0, 1).
- The new spec against the dev server (port 3243): **20 passed, 1 skipped** (the CLS budget, production only), twice.
- Screens looked at (9): the 404 at 1440 px in dark mode (`/en/kul/zzz`) and at 390 px in Malay (`/ms/kul/zzz`); the
  fare row at 1440 px (en), at 390 px with 125% text (ms), and without JavaScript at 1440 px (ms: "dari RM 55", both
  dated lines); a parking card at 390 px (en) and the price table with its one source list at 1440 px (ms, dark); the
  airports map at 1440 px and 320 px.

## Builds and clean-up

Four production builds (the limit), each 0 warnings. PIDs, all mine and all stopped: build 1 22912, server 24098 /
24110 / 24111; build 2 13126, server 13768 / 13780 / 13781; build 3 21423, server 21582 / 21594 / 21595; build 4
25591, server 25765 / 25777 / 25778; dev server 4609 / 4629 / 4630 / 4707; Lighthouse 31767 and 18944 (exited).
`.next-r5polish` and `.next-r5polish-prod` are deleted, and the lines Next.js added for them are removed from
`tsconfig.json` and `next-env.d.ts` (which now points at `.next`, the only build folder left). The measuring scripts
copied into `scripts/qa/` while they ran (`zz-r5polish-*.mjs`) are removed. One read-only `git status` was run by
mistake near the end (to list folders); no other git command was used.

## Open

- **The header's airport switcher shifts after hydration** (0.0004 to 0.0012 at 1440 px, 0.0025 at 412 px with 4x
  CPU): the largest remaining layout shift on transport, in the shared header (not this package).
- **Stored 404 renders.** Each unknown path's 404 is kept in Next.js's route cache, as for `/en/<anything>` before
  this round; a deployment should bound that store (a cache handler with a size limit, or a `proxy.ts` check that
  answers obviously unknown paths before rendering).
- **The fare row is taller on phones** (+25 px at 100%, +55 px in Malay at 125%), because the figure keeps its
  reserved width beside the name and the dated lines run the full width. The fare itself moved up; the warning
  moved down by the same amount and still precedes every taxi option.
- Hreflang alternates stay in the `Link` header only on the 124 pages without their own metadata helper (the head
  has the canonical); adding `pageMetadata` to those pages is for their owners.

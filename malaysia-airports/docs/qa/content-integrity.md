# Content integrity and data provenance audit

Role: content-integrity evaluator. Date: 18 November 2026. Build: the existing production build in `.next`, served with
`next start -p 3104`. Machine-readable findings: [`content-integrity.json`](content-integrity.json).

**The promise under test.** No invented facts, demonstration data always labelled, the kind of guidance always labelled.

**Verdict.**

- **No invented facts.** No fabricated values found. Every money figure, phone number, date, count, route, place
  reference and airline name traced to `src/content`. Values that are not in `src/content` are clock readouts,
  demonstration data, or planning estimates tagged Estimated.
- **Demonstration data always labelled.** Partly kept. Every demo surface has a label. But on long boards and on phone
  layouts, most flight rows, and the gate, belt and counter values on the flight page, are on screen with no label in
  view (4 high-severity findings).
- **Guidance kind always labelled.** Partly kept. Every guidance block has a tag. But 9 records carry "Official" while
  resting only on news reports or travel blogs, including the KLIA Ekspres fare, the Aerotrain closure and the Mavcom
  refund rule. The site's own rule (`sources.ts`) and its on-page legend say these should be "Estimated".

## 1. Method

Measured results and expert judgement are kept apart. Each finding says which it is.

| Step | How it was done |
| --- | --- |
| Crawl | Playwright Chromium rendered every URL in `/sitemap.xml` (240 URLs, 120 per language) plus 8 extra pages (`/en/journey`, `/ms/journey`, four search queries, `/en/offline`, `/en/design-system`). Each page was rendered at 1280x900 and at 390x844 (touch, mobile), with a wait for network idle and hydration. Every visible text block inside `<main>` was recorded, together with whether a visible demonstration marker (`[data-demo-banner]` or `[data-provenance="demo"]`) sits in an enclosing container, the nearest `lang` attribute, and every provenance tag with its context. |
| Value extraction | Regular expressions for 9 value types: money (RM, MYR, sen), phone numbers, times of day, durations, dates, counts (number plus noun), level/door/bay/gate/belt/counter/row references, route numbers, airline names (a list of more than 90 carriers plus every airline in the content). Outlet names were checked separately against the content outlets on the shop-and-dine pages. |
| Tracing | `src/content/index.ts` was dumped with `tsx` (`ALL_SOURCES`, guides, FAQs, notices, corporate content, all six airport modules; `validateAllContent()` returns 0 issues). Each value was looked up in that dump, then in the raw `src/content` text (the grep step). Values not found there were looked up in the interface copy (`src/lib/i18n`), then other code, then the demo providers. Every value left over was reviewed by hand. |
| Sources | Record → source → `kind` (official, government, operator, news, aggregator, other). Two checks: records tagged `official` with no authoritative source, and authoritative-kind sources hosted on third-party domains. |
| Demo labels | For every visible flight-status chip, parking availability value, and gate, belt and counter value, the script scrolled the value to the centre of the viewport and counted demo markers in the viewport. Scripted flows: board → flight detail → save → My journey (en and ms); the concierge (11 questions, en and ms, desktop and phone); the search page; the command palette. |
| Time | `page.clock.install()` at 8 instants (18 Nov, 27 Nov 22:00, 29 Nov 02:00 and 14:00, 1 Dec 06:00, 31 Dec 23:00, 1 Jan 00:10, 15 Jan 2027), Asia/Kuala_Lumpur. Pages: `/en/kul/transport`, `/ms/kul/transport`, `/en/kul`, `/en/notices`, `/ms/notices`, `/en`, `/en/kul/transit`. The concierge reads the server clock (`src/app/api/concierge/route.ts:54`), so its answer engine was also run directly with `tsx` at 3 instants. |
| Malay | 123 Malay pages: English-looking blocks outside `lang="en"`, presence of the translation notice, and the page title, H1 and place names. Wording problems are flagged for native review and not rewritten. |

Limits. The extraction is pattern-based. Bare numbers with no unit, prose claims without numbers, and images were not
traced. The source pages themselves were not re-fetched: this audit checks that each value is recorded and how it is
labelled, not whether the source is right today. 5 screenshot views were checked by eye.

## 2. Coverage

| Measure | Value |
| --- | --- |
| Pages rendered (en / ms) | 248 (125 / 123), each at desktop and phone width = 496 renders |
| HTTP status / page errors | 248 × 200 / 0 uncaught errors |
| Text blocks read in `<main>` | 25,929 |
| Values extracted | 6,835 occurrences, 544 unique |
| Content records with `sources` / sources in registry | 289 / 251 (0 records with an empty `sources` list, 0 unknown source ids) |
| Pages with demo flight status chips | 81 (40 en, 40 ms, plus the design system) |
| Interactive demo surfaces scripted | flight detail (3 flights), My journey (en, ms), concierge (11 questions), search page (4 queries), command palette |
| Clock instants × pages | 8 × 7 = 56 renders, plus 3 engine runs |

## 3. Results

### 3.1 Published values traced to the content layer

| Type | Unique | Occurrences | Found in `src/content` | Demo or clock only | Interface copy or code | Not traced |
| --- | --- | --- | --- | --- | --- | --- |
| Money (RM, MYR) | 37 | 304 | 33 + 3 (by hand) | 1 (by hand: in content) | 0 | 0 |
| Phone numbers | 5 | 102 | 5 | 0 | 0 | 0 |
| Times of day | 126 | 1,384 | 22 | 94 demo board times, 8 "Updated hh:mm" readouts | 2 (demo board times that happen to match code) | 0 |
| Durations | 49 | 368 | 38 | 7 ("Refreshes every 30 seconds", parking-calculator chips) | 4 (transit ranges in `transit-logic.ts`; "2.5 seconds" LCP target in the About page copy) | 0 |
| Dates | 129 | 2,525 | 125 | 1 (board date) | 0 | 3 (news month headings and "Saved 18 Nov", generated) |
| Counts | 115 | 657 | 111 | 4 (demo "about 1,539 bays free") | 0 | 0 |
| Level, door, bay, gate, belt, counter, row | 50 | 341 | 49 | 1 (map filter count "Gates 5") | 0 | 0 |
| Route numbers | 13 | 201 | 13 | 0 | 0 | 0 |
| Airline names | 20 | 953 | 20 | 0 | 0 | 0 |
| Outlet names (shop and dine) | 7 | — | 7 of 7 | 0 | 0 | 0 |

Measured result: **0 fabricated values**. The money values marked "by hand" (RM45.40, RM11.50, RM5.80, RM2.50) are in
`kul.ts`. The script missed them only because of trailing zeros and 400-character block truncation. The two pieces of
planning guidance outside `src/content` are tagged Estimated. They are recorded as drift risk (content-integrity-13).

### 3.2 Provenance and sources

| Check | Result |
| --- | --- |
| Source kinds in registry | official 58, government 14, operator 15, news 81, aggregator 50, other 33 |
| Records tagged `official` whose sources are all news, aggregator or other | **9 distinct (12 with duplicates)**: KLIA Ekspres option, KLIA Ekspres fare notice, Aerotrain closure notice, Mavcom refund FAQ, Penang e-hailing option and guide note, Subang curfew note, plus 3 FAQs about the prototype. All render with "Official" (content-integrity-04, -05) |
| `official` records that cite an aggregator next to an authoritative source | 11, including the KLIA Ekspres journey time of 28 minutes, which comes only from a Wego blog post and renders under "Official" |
| Authoritative-kind sources hosted on third-party domains | 9 (5 Routesonline relays and 1 Edge advertorial registered as official; 1 Routesonline relay and the ANA guide registered as operator; MAHB TikTok, acceptable) (content-integrity-06) |
| Records with no as-of date | FAQs 15/28; guide steps 91 (their guide has one); sources 108/251. Every source has a retrieved date, shown as "Retrieved 16 Nov 2026" |
| Estimated tags on our calculations | Pass: transit ranges ("built from our own planning assumptions"), arrival-time rule, Penang taxi and KLIA buses are all tagged Estimated |

### 3.3 Demonstration labels in the same view

Method: each value was scrolled to the centre of the viewport, then visible demo markers in the viewport were counted.
A row passes when at least one marker is in view.

| Surface | Desktop 1280x900 | Phone 390x844 |
| --- | --- | --- |
| `/en/kul/flights` full board | **6/53 rows labelled in view** | **1/53** |
| `/ms/kul/flights` | **6/53** | **1/53** |
| `/en/pen/flights` | **5/12** | **1/12** |
| Home board preview `/en`, `/ms` | 8/8 | **2/8** |
| Airport overview preview `/en/kul` | 6/6 | **2/6** |
| Search results `/en/search?q=MH` and `?q=AK` | 8/8 | **4/8** |
| Flight detail: check-in counters, gate, belt | 4/4 values | **0/3 values** (counters, gate, belt); boarding times pass |
| My journey with saved flight (en, ms) | 6/6 | 6/6 |
| Concierge flight answers (en, ms) | Pass: banner, "Demo" tags, label in view | Pass |
| Command palette flight result | Pass: "Demo" tag and "Flights are demonstration data" footer | not reached (search button hidden at this width; not retried) |
| Parking availability ("about 1,539 bays free", "% full") | 10/10 values | 10/10 values |
| Wait times | Not shown on any public page. The concierge declines queue questions; wait times appear only in the design system | — |
| Map points | Every illustrative POI carries "Demo" | same |

Across the 81 pages with status chips, every chip sits inside a container that also holds a visible demo marker. The
failures above concern what is in view, not what is on the page. Neither the board banner nor the
"Concept prototype, not official" top strip is sticky.

### 3.4 Time-sensitive notices and fares (client clock overridden)

| Instant (MYT) | KLIA Ekspres fare on transport page | Aerotrain notice | Fare-rise notice |
| --- | --- | --- | --- |
| 18 Nov 10:00 (today) | RM 55 "Applies today · Until 31 December 2026", "Changes to RM 65 on 1 January 2027" | Shown on /en, /en/kul and /en/notices (starts in 10 days) | "In effect now · Until 31 Dec 2026" |
| 27 Nov 22:00 | RM 55 | Shown | In effect |
| 29 Nov 02:00 (closure night) | RM 55 | "In effect now"; title still "Planned:"; transit step still says "Take the Aerotrain" (-08) | In effect |
| 29 Nov 14:00 | RM 55 | In effect | In effect |
| 1 Dec 06:00 | RM 55 | Gone from /en/kul and home strip; "Ended" on /en/notices | In effect |
| 31 Dec 23:00 | RM 55 | Ended | In effect |
| 1 Jan 2027 00:10 | **RM 65**, period lines removed | Ended | **"Ended"**, gone from /en/kul and home strip (-07) |
| 15 Jan 2027 | RM 65; description still says "both fares are listed" (-07) | Ended | "Ended" |

Malay transport and notices pages follow the same states ("Terpakai hari ini", "Tamat").

Concierge engine run directly with `tsx`:

- 15 January 2027: the KLIA Ekspres answer drops RM 55 and keeps RM 65.
- 29 November 02:00: the Aerotrain notice is marked "In effect".
- 5 December: the Aerotrain notice is no longer included.

The concierge on the page uses the server clock, so overriding the browser clock does not change it. That is
consistent with production. Transport cards render on the client, so pages built ahead of time do not go stale.

### 3.5 Malay pages

| Check | Result |
| --- | --- |
| Interface strings (i18n) left in English | None found on the 123 Malay pages. Navigation, labels, states and banners are translated |
| Airport names in H1 and `<title>` | English on all 39 Malay airport overview pages (content-integrity-09) |
| English citation titles outside `lang="en"` | On 77 of 123 Malay pages; only 2 blocks in all Malay pages carry `lang="en"` (content-integrity-10) |
| Translation notice shown | 0 Malay pages |
| Team-written English in Malay pages | Registry annotations on 9 to 22 pages each; free-text as-of values; the Kota Kinabalu bus payment list (content-integrity-11) |
| Terms for native review | "Singapore" (Singapura) on 15 pages, "Penang" (Pulau Pinang) on 17, "Federal Territory of Labuan" (Wilayah Persekutuan Labuan), "Lounge", "Karusel bagasi", "Parkir" versus "tempat letak kereta" |

## 4. Findings

Severity scale from the brief. Detail, expected behaviour and fix for each are in the JSON file.

| ID | Severity | Area | Finding | Basis |
| --- | --- | --- | --- | --- |
| content-integrity-01 | high | flights | Full flight boards: 47/53 (desktop) and 52/53 (phone) KLIA rows have no demo label in view. The banner above the board is not sticky and rows have no per-row marker | Measured, screenshots |
| content-integrity-02 | high | home | Phone: home preview 6/8, KLIA overview 4/6 and search results 4/8 rows with no demo label in view | Measured, screenshot |
| content-integrity-03 | high | flights | Phone flight detail: check-in counters, gate K15 and baggage belt 2 shown with no demo label in view (en and ms) | Measured |
| content-integrity-04 | high | content | "Official" tag on facts resting only on news and blogs: KLIA Ekspres RM 55/65 and 28 min, fare-rise notice, Aerotrain closure notice, Mavcom 5-hour refund FAQ, Penang e-hailing pick-up, Subang curfew. This contradicts `sources.ts` lines 8-10 and the on-page legend | Measured |
| content-integrity-05 | medium | help | FAQ answers about the prototype ("Is this the official Malaysia Airports website? No…", privacy answers) are tagged "Official instruction" | Measured |
| content-integrity-06 | medium | content | 8 sources hosted on Routesonline, The Edge (advertorial) or ANA are registered as official or operator, so the records that use them render as Official | Measured |
| content-integrity-07 | medium | transport | The KLIA Ekspres fare-rise notice reads "Ended" from the day the new fare starts and leaves the KLIA page; the card copy is stale after 1 January | Measured (clock) |
| content-integrity-08 | low | transit | The Aerotrain notice keeps "Planned:" while "In effect now" and after it ends; the transit step at 02:00 on 29 November does not point to it | Measured (clock) |
| content-integrity-09 | medium | content | Malay pages: airport names (39 H1s), state names and destination names stay in English, although a STATE_MS map exists | Measured; wording for native review |
| content-integrity-10 | medium | content | English citation titles on 77/123 Malay pages lack `lang="en"`; the translation notice never shows. Widens accessibility-12 | Measured; severity by judgement |
| content-integrity-11 | medium | content | Team-written English on Malay pages: the "This prototype (not an official source)" source, registry annotations, as-of text, the BKI payment list | Measured |
| content-integrity-12 | low | content | As-of dates missing on 15 FAQs and 108 sources; `asOf` is free text in mixed formats, so staleness cannot be checked by code | Measured |
| content-integrity-13 | low | content | The arrival-time rule (i18n) and the transit ranges (code) are published numbers outside `src/content`. They are tagged Estimated, so the risk is drift | Measured |

Counts: critical 0, high 4, medium 6, low 3.

### What passed

- No fabricated facts in the value types tested. All 5 phone numbers come from official MAHB contact pages. All 13 route
  numbers, 20 airline names and 7 outlet names are content records.
- Demo labels pass in these places: concierge flight answers, My journey, parking availability, map points, the
  command palette, and the board, preview and search surfaces on desktop.
- Fare and notice dates switch correctly on the client clock, in both languages. The concierge engine applies the same
  dates.
- Interface strings are fully translated. The remaining English is content, registry and citation text.

## 5. Reproduce

Scripts are in the session scratch folder `qa-scratch/content-integrity/`:

- `dump.ts`, `dump2.ts`: content dump with `tsx`.
- `crawl.js`: full crawl.
- `analyse.js`: extraction and tracing.
- `inview.js`, `probe4.js`, `probe6.js`: in-view label checks.
- `scenarios.js`, `concierge.js`: interactive flows.
- `timecheck.js`, `probe5.js`, `engine-clock.ts`: clock checks.
- `helpcheck.js`: FAQ tags.

Run any of them with `NODE_PATH=/opt/node-tools/node_modules node <script>` against `next start -p 3104`.

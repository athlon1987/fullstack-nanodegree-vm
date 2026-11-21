# Re-review after three fix rounds: airport digital executive

Reviewer lens: an airport digital executive who has run passenger digital at a major hub. Judged on operational
usefulness, flight information, commercial value, multi-airport coverage and launch risk. One of three independent
re-reviews; the other two were not read.

Date: 21 November 2026, about 18:13 to 18:35 MYT. Product: the existing production build in `.next/`, served by this
reviewer with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3302` and stopped by its own PID afterwards.
Nothing under `src/`, `e2e/` or the configuration was changed; no build, dev server or git command was run.

**Labels.** **[measured]** = observed or measured by this reviewer on the running build, with the method named.
**[verification]** = a number taken from `docs/qa/verification.md` (round three), not re-measured here. **[judgement]**
= expert assessment.

**What is prototype-only.** Every flight, gate, belt, check-in row, queue estimate and car-park space figure is
demonstration data (`/api/flights` answers `"mode":"demo"`). The official flight provider is still a stub whose data
methods throw (`src/lib/providers/official-flights.ts`). Notices live in `src/content/notices.ts`; the "Services now"
status lines are derived from those notices by matching their titles (`src/lib/providers/ops-services.ts`). The
first-party measurement counts are kept in server memory. As in round one, design and flows are judged as if
production flight data were connected; **info** and **commerce** are scored on what is actually there.

---

## 1. Verdict

The three fix rounds have turned a strong concept into a credible product shell. The day-of-travel logic that worried
me most in round one is now right: a flight whose check-in has closed says so, a departed flight shows a terminal
state, check-in rows are per cabin, and the flight page leads with one line that tells the passenger what to do next.
On a phone the answer is now on the first screen of every airport sub-page I opened. When I cut the flight feed, the
page kept the last data with its age and a retry button. Fast Track exists and is offered as an optional step after
security. Flight-page links carry the terminal, the gate and the dates.

What has not moved is everything that depends on MAHB: there is still no live feed, no operations source, no notices
CMS, no verified tariff for the two terminal car parks, only three of 39 airports with more than an overview and a
board, and nothing a passenger can buy. Measurement is now built, but it covers only some of the commercial
links and keeps its counts in memory. My position: **ready for a closed pilot with MAHB data, not for public launch.**
The remaining blockers are mostly integrations and content operations, not design.

**Weighted score: 74.5%** [judgement] (round one, executive and commerce: 72.5%; panel average 70.8%; Heathrow 79.0%,
MAHB today 42.5% in the benchmark matrix). With the MAHB launch gates closed, I project about **80%** [judgement, not a
score]: info 4.0, commerce 3.5, flight 4.5.

---

## 2. Method

- **Crawl [measured].** Playwright (Chromium, `chromium.launch()` with no options), 22 URLs on desktop (1440 x 900)
  and phone (390 x 844, touch, mobile), 44 loads. For each: status, `h1` position, page height, sideways scroll,
  console errors, requests to any host other than localhost; full text saved; viewport screenshot.
  - **Result:** 44 of 44 rendered with 0 console errors, 0 third-party requests and no sideways scroll. Ten loads
    on live pages (board, three flight pages and My journey, on both viewports) did not reach network idle in 30 s
    because they poll every 30 s. Every one had rendered its `h1` and content.
- **Interactions [measured].** On phone:
  - saved a flight (KL 885), then read the home card and My journey;
  - opened Follow;
  - typed "parking", "fast track", "lounge", "KL 885" and "wheelchair" into the home search and pressed Enter;
  - followed the flight page's parking and shop-and-dine links with their parameters;
  - blocked the flight feed after load (`context.route` abort) and waited 36 s.

  On desktop:
  - clicked the parking and Fast Track hand-offs, with external hosts stubbed, and recorded the opened URL and the
    `/api/metrics` beacons;
  - ran 13 site searches.
- **API and HTTP [measured].**
  - Seven concierge questions sent with `POST /api/concierge` (operations and commerce intents).
  - Status codes on missing sections, an unknown flight and the legacy Fast Track path, each on its first request.
  - Response headers of `/en`.
  - Sitemap URLs counted per airport.
- **Screenshots viewed [measured].** 13 of the 15 allowed, kept in the session scratch folder, not in `docs/`. On
  phone: flight page first screen, home with a saved flight, My journey, board, KLIA overview, parking, home, the
  feed-failure state and Lawas. On desktop: flight page, home, airports and corporate.
- **Code read [measured, grep only].**
  - `official-flights.ts` (stub);
  - `ops-services.ts` (status lines from notice titles);
  - `src/content/notices.ts` (exists);
  - `src/components/platform/analytics.ts` and `metrics.ts`, and `src/app/api/metrics/route.ts` (in-memory counts);
  - which links carry `data-handoff`.
- **Performance.** Not measured: other servers share this machine. Figures are from the round-three section of
  `docs/qa/verification.md` and are labelled as such.
- **Limits.** One session of about 20 minutes on demo data. No real passengers, no field performance and no
  assistive-technology test. Accessibility was only seen in passing; it is outside this lens.

### Pages checked (22 URLs x 2 viewports, plus targeted pages)

| Area | Pages |
|---|---|
| Home and network | `/en`; `/en/airports` (the 39-airport model) |
| KLIA | `/en/kul` (overview), `/en/kul/flights` (board), `/en/kul/parking`, `/en/kul/shop-dine`, `/en/kul/lounges`, `/en/kul/transport`, `/en/kul/transit`, `/en/kul/facilities` |
| Flight pages | MH 791 (domestic, check-in open), MH 1960 (check-in closed), MH 1022 (departed), MH 1900 (arriving), KL 885 and CX 771 (international, phone only) |
| Journey | `/en/journey`, empty and with a saved flight |
| Other airports | `/en/pen/parking`; `/en/kch` (international, overview and board only); `/en/lwy` and `/en/lbp` (directory-only STOLports) |
| Corporate | `/en/corporate`; `/en/corporate/business` |
| Notices and Malay | `/en/notices`; `/ms/kul/parking`; `/ms/kul/flights/cx771-…` |
| With parameters | `/en/kul/parking?t=T1&from=…`; `/en/kul/shop-dine?gate=T1-C24&t=T1`; `/en/kul/facilities?t=T1#kul-t1-fast-track` |
| Search | 13 queries on `/en/search` |

---

## 3. Item checks on the running build

Status: **fixed**, **improved** (better but not closed), **unchanged**, **worse**. "Evidence" is what I did and what I
saw.

### 3.1 The round-one panel's ten main weaknesses

| # | Round-one weakness (backlog) | Status | Evidence [measured] |
|---|---|---|---|
| 1 | On a phone the answer is not on the first screen (A-01, B-03, C-01, C-03, A-11) | **Fixed** (first screen); page length unchanged | Phone 390 x 844: `h1` at **184 px** on 12 of 12 airport sub-page and flight-page loads; overview 151, board 156. Board's first row about 640 px, inside the screen (screenshot). Flight page: "Your next step: Check in: Row E, counters 1-6 · Gate C24 · Boarding 18:50" in the first screen (screenshot). Parking matrix's first row on the first screen. Transit: "Looks workable · 55 min to 1 h 50 min" straight after the form. Still long: facilities 15,179 px, transport 11,820, transit 10,595, parking 9,358 |
| 2 | Commercially weaker than the site it replaces (D-02, C-01, B-13, C-05, C-11, E-17) | **Improved**; still hand-off only | **Fast Track:** findable in search ("fast track" and "laluan pantas" both lead with it), in the concierge and on the KLIA overview, and offered on international flight pages as "Optional: Fast Track" after the immigration and security step. **Parking:** price-first. **Context:** flight dates carried into the parking estimate ("Dates filled in from your flight"); gate applied on shop and dine ("Gate C24 (Terminal 1) · Demo", 6 of 8 places). **Still missing:** nothing can be bought, no lounge price or booking, 8 outlets with no hours |
| 3 | No live data path, no operational layer (B-09, B-01) | **Improved** in product; gate open | **Feed cut:** after 36 s the flight page showed "Showing the last flight information we received, from 18:26 (1 min ago)" with "Try again" (screenshot). **Overview:** "Services now" lines (Aerotrain, inter-terminal train, shuttle, immigration) and demo queue estimates (security T1 about 15 min, immigration T1 about 23 min). **Flight page:** the same lines inside the immigration and Aerotrain steps. **Not changed:** the official provider still throws; notices are still a code file; a status line is computed by matching notice titles |
| 4 | Wrong day-of-travel guidance (B-02, B-12) | **Fixed**, one residual | **MH 1960** (check-in closed 18:00, viewed at 18:17): "Check-in closed at 18:00 … check with your airline"; next step "Board from 18:15". **MH 1022** (departed 18:05): one terminal step, "Flight MH 1022 departed at 18:05". **Card:** check-in per cabin ("Economy: Row B, counters 1-18 · Bag drop: F, G"), matching the timeline. **Residual:** at 18:21 the home card for KL 885 still says "Be at the airport by 16:35" and "Next: Check in and drop your bags 16:35"; check-in closes at 18:35, and that time appears on neither the home card nor My journey |
| 5 | Following a flight does not work where it matters (B-04) | **Improved**; delivery open (OOS-10) | "Follow" sits beside Save. Its panel says exactly what is delivered: "only while a page of this site is open. Nothing reaches you when the browser is closed yet". E-mail follow is labelled "Demonstration: nothing is sent". On a phone the control is at 1,197 px, below the first screen |
| 6 | Travellers with access needs cannot plan with confidence (B-11, D-04, …) | **Improved** (outside this lens, seen only in passing) | "My needs" (wheelchair, step-free, older traveller) and trip toggles appear on every flight page and in My journey. Airline assistance rules (D-04) are still not published, as `verification.md` T4 states |
| 7 | Search, concierge and home do not answer the question asked (A-03, A-12, B-08, A-08) | **Fixed**, with relevance gaps | **Home search:** "parking", "fast track" and "lounge" show "No flights match … These pages might help" with three entities and "See all results"; Enter opens the flight for "KL 885" and `/en/search?q=` otherwise. **Concierge:** routed 7 of 7 operations and commerce questions to the right intent ("AirAsia flies from KLIA Terminal 2"; the Aerotrain closure; duty-free chocolate). **Home:** shows the saved flight above the modes. **Gaps:** "wifi" leads with guides (55 results); "taxi" lists the liquids rule in its 6 results; "parking" on the home leads with Preferred Parking, the product the site warns long-stay drivers against |
| 8 | Content is thin and not operator-grade (D-16, D-06, D-05, D-03) | **Unchanged** | **Sitemap:** KUL 17 English URLs, PEN 6, BKI 6; every other airport 1 or 2. Kuching and Langkawi have an overview and a board only (`/en/kch/parking` and `/en/lgk/transport` answer 404). **Parking:** T1 and T2 shown as "≤ RM 52 (not verified)", sourced from klia.info and an undated page. **Directory:** still 8 outlets. **Facilities:** 29 "Not published" markers on the desktop page. **Notice:** the Aerotrain notice still hedges ("we found no confirmation of the final dates"). **Arrival steps:** cite third-party guides for MAHB's own building ("Malaysia Airports' own page was not read: follow the signs") |
| 9 | Noise competes with answers (A-14, D-05, D-06) | **Improved** | No "not verified" block in departing steps: 0 occurrences on the MH 791 page. The parking warning is now a rule in the Preferred Parking row ("Staying more than a day? Use the Long Term Car Park"); the RM2,084 press report appears only as a source link. Demo banners, provenance chips and source counters remain dense; A-14 is still not verified (`verification.md` T4) |
| 10 | Performance misses its own budgets (E-01, A-09, B-06, E-02, E-03) | **Improved**, not met | [verification] Lighthouse mobile 92 to 99 on 10 pages (7 of 10 at 95 or more); LCP 0.92 to 1.11 s on 10 of 10; CLS at most 0.003; TBT over 200 ms on 7 of 10 (`/en` 257 ms, overview 353); congested Wi-Fi LCP 2.57 to 2.68 s; the CI budget step has never run. Not re-measured here |

### 3.2 Round-one executive and commerce findings

| Finding | Status | Evidence [measured] |
|---|---|---|
| exec-commerce-01 Fast Track absent | **Fixed** with the data available | **Search:** 2 results, both Fast Track. **Concierge:** intent `fast-track`. **Overview:** a booking link carrying `utm_campaign=fast-track-booking`. **Flight page:** an optional step after security. **Legacy path:** `/en/klia1/air-travel/services/fast-track` gives 308 to `/en/kul/facilities?t=T1#kul-t1-fast-track`. **Still not published:** price, hours, checkpoints covered and seller ("Not published in our sources … the seller") |
| -02 Parking cannot be priced or booked in context | **Improved** | **Matrix:** a car park x 1, 3 and 7 days matrix in the first screen; only the Long Term Car Park is verified (at most RM 32, 96, 224). **Booking:** "Book parking online" opens the official page with no dates; the page says so: "Your dates: 21 Nov, 16:35 to 22 Nov, 16:35. Enter them on the official site; it does not take them from this page" |
| -03 No failure state, provider a stub | **Improved** (UI fixed; feed is OOS-01) | Last-known data with its age, and a retry, after a forced feed failure (see 3.1, row 3) |
| -04 No status layer or queue times; notices need a deploy | **Improved** (in-product part); publishing unchanged | Status lines and demo queue estimates on the overview, the flight page and the home ("Services at KLIA now: 1 service has a notice"). `src/content/notices.ts` is still the only source of notices |
| -05 Information completeness | **Unchanged** | See 3.1, row 8 |
| -07 Flight-page links lose the flight | **Fixed** | Flight page link targets: `/en/kul/parking?t=T1&from=2026-11-21T16:35+08:00`, `/en/kul/shop-dine?gate=T1-C24&t=T1`, `/en/kul/transport?t=T1`, `/en/kul/map?gate=C24&t=T1`. The "time to spare" step names 2 outlets and the nearest Golden Lounge for gate C24 |
| -08 Phone first screen two-thirds chrome | **Fixed** | Compact bar ("KUL KLIA 18:17 · Sections"); `h1` at 184 px (see 3.1, row 1) |
| -09 Lounges cannot be priced or booked | **Unchanged** (C-11, P2, OOS-04) | Every KLIA lounge card shows "Not published: … who may use it and price". Only the DaySleeper promotion is quoted, as dated text |
| -10 Retail dead-ends | **Improved** (dead ends removed; data unchanged) | **Filters:** "Open now" and price are replaced by "Not offered yet" with the reason. **Directory:** "Partial directory … 8 at KLIA", with links to the official directory. No hours, images, offers or reserve-and-collect |
| -11 Copy and sourcing not operator-grade | **Improved** (warning reworded); sourcing unchanged | See 3.1, rows 8 and 9 |
| -12 No measurement or attribution | **Improved**; incomplete | **Beacons:** first-party only (`/api/metrics`); an `answer` beacon on parking ("parking-price", "partial"); `handoff` beacons, with campaign parameters, on the car-park card link and the overview's Fast Track link. **Not marked:** the main "Book parking online" link below the price matrix and the Fast Track link on the facilities page; both opened with no parameter and sent no hand-off beacon. **Storage:** counts kept in server memory (`sharedMetrics()`), so they are lost on restart and split across instances |
| -13 Alerts only while the page is open | **Improved**; delivery open | See 3.1, row 5 |
| -14 Headers block checkout; CSP `unsafe-inline` | **Unchanged** | `curl -I /en`: `script-src 'self' 'unsafe-inline'`, `Permissions-Policy: … payment=()`, plus a report-only policy with hashes |
| -15 Section tabs clipped on desktop | **Fixed** | 9 tabs unclipped at 1440 px (flight page screenshot) |
| -16 No rail ticket path or anti-touting | **Fixed** | Transport: "Book taxis only at the coupon counters; ignore anyone offering a ride", with an RTD source dated July 2026; "Tickets on the operator's website" links to kliaekspres.com |
| -17 Concierge misses commerce intents | **Fixed**; answer quality uneven | 7 of 7 routed (see 3.1, row 7). Parking answer: "Parking rates are not yet verified in this prototype", with `ratesPublished: false` on all four car parks, while the parking page shows the Long Term Car Park as verified (at most RM 32 a day). Two surfaces give two answers to one fact |
| -18 Missing section 200 then 404 | **Fixed** | First requests to `/en/kch/parking`, `/en/lgk/transport`, `/en/lwy/flights` and an unknown flight id: 404 |
| -19 Mobile lab performance | **Improved** | [verification] see 3.1, row 10 |
| -20 No B2B enquiry path | **Unchanged** (D-17, P2) | `/en/corporate/business`: retail space, advertising, route development, cargo, Aeropolis and consultancy each "Not published"; group contact only |

### 3.3 Critical and P0 backlog items in this lens

| Item | P | Status | Evidence [measured] |
|---|---|---|---|
| A-01 Phone chrome (critical) | P0 | **Fixed** | See 3.1, row 1 |
| A-03 Home search flights-only (critical) | P0 | **Fixed** | See 3.1, row 7 |
| B-01 Status layer and queue times (critical) | P0 | **Improved**; in-round part met | Live feeds and CMS are OOS-02 |
| C-01 Parking price-first (critical) | P0 | **Improved**; in-round part met | Tariff and dated deep link are OOS-03 |
| E-01 Mobile performance (critical) | P0 | **Improved**, not met | [verification] TBT over 200 ms on 7 of 10 pages; CI step never run |
| A-04 Demo label in view | P0 | **Fixed** | "Demo" tag on the board group header ("From 18:00 · 12 flights · Demo") and beside every flight value; one banner per page |
| A-08 Home knows the saved flight | P0 | **Fixed**, residual | Card in the first phone screen (about 275 to 475 px in the screenshot), with status, terminal, gate and arrive-by. Residual: the arrive-by time it shows can be in the past (3.1, row 4) |
| B-02 Timeline "Now" state | P0 | **Fixed** | MH 1960, MH 1022 (3.1, row 4) |
| B-03 Answer first on the flight page | P0 | **Fixed** | Summary line in the first phone screen |
| B-04 Follow | P0 | **Improved** | In-round UI met; OOS-10 open |
| B-09 Feed-failure state | P0 | **Improved** | UI met; the official feed and the CI chaos test have not run |
| B-12 Check-in per cabin | P0 | **Fixed** | 3.1, row 4 |
| B-13 Contextual links | P0 | **Fixed** | 3.2, -07 |
| C-05 Retail filters | P0 | **Fixed** (filters) | 3.2, -10 |
| D-02 Fast Track | P0 | **Fixed** with the data available | 3.2, -01 |
| D-05 Stale gap block | P0 | **Fixed** | 3.1, row 9 |
| D-06 Parking warning and source policy | P0 | **Fixed** (in-round part) | 3.1, row 9; OOS-08 and OOS-14 open |
| E-17 Measurement (P1, included for this lens) | P1 | **Improved**, not met | 3.2, -12 |

No item in this lens is **worse** than in round one.

---

## 4. Scores

Scale 1 to 5 in half points; 3 = competent major airport, 4 = strong with evidence, 5 = best in class with first-hand
evidence. Weighted total = sum of score x weight, as a percentage of 5.

| Key | Weight | Round one (exec-commerce) | **This review** | Confidence | Reason |
|---|---|---|---|---|---|
| ui | 10% | 4.0 | **4.0** | Medium | Refined and consistent on desktop and phone, with a calm, credible look for a national operator. Held back by dense demo banners, provenance chips and source counters, and no sense of place |
| ux | 20% | 4.0 | **4.0** | Medium | Every top task now leads with its answer (next step, parking matrix, transit verdict, saved flight on the home), but commercial tasks end in hand-offs, phone pages run up to 15,179 px, and no usability study has been run |
| info | 15% | 3.0 | **3.0** | High | Scored on what is there. Honest and dated, but no deeper: 3 of 39 airports beyond an overview and a board, 2 of 5 international gateways bare, terminal car-park rates unverified, 8 outlets, and the concierge contradicts the parking page |
| flight | 15% | 4.0 | **4.0** | Medium | Now among the strongest designs in the set: correct timeline states, per-cabin rows, next-step line, last-known data with retry, and status and queue lines in the steps. Not 4.5 while alerts never reach a closed browser and the home card can show a past arrive-by |
| mobile | 10% | 3.5 | **4.0** | Medium | Compact bar with the `h1` at 184 px on every sub-page, and the board, next step and price matrix all in the first screen. No sideways scroll on 22 phone pages. Pages are still very long, Follow sits at 1,197 px, and [verification] lab TBT is 245 to 353 ms on key pages |
| nav | 10% | 4.0 | **4.0** | Medium | One search box that falls through to site results, Fast Track in both languages, a clear 39-airport chooser, and honest "Not published for Lawas" navigation. Relevance is weak for "wifi" and "taxi", and the home's "parking" leads with the premium product |
| ai | 10% | 3.5 | **3.5** | Medium | The concierge routes operations and commerce intents correctly and is grounded with sources, and the home and timelines use the saved flight and needs. But its answers often open with "Here is what our sources say" rather than the answer, and it gives a different answer on parking rates from the parking page |
| commerce | 5% | 2.0 | **2.5** | High | Scored on what is there. Fast Track is findable with an attributed hand-off, parking is price-first with dates carried into the estimate, and near-gate retail and lounges appear on the timeline. Nothing can be bought, lounges have no price, retail has 8 outlets, and attribution is partial: level with MAHB today, not above it |
| perf | 5% | 3.5 | **4.0** | Medium | [verification] LCP at most 1.11 s on 10 pages, CLS at most 0.003, Lighthouse 92 to 99, and [measured] 0 third-party requests on 44 loads. TBT still misses budget on 7 of 10 pages, CI has never run, CSP keeps `unsafe-inline`, and the metric store is in memory |
| **Weighted** | | **72.5%** | **74.5%** | Medium | 372.5 of 500 weighted points |

**Projection** [judgement, not a score]. With the official feed, the notices CMS, the parking tariff and deep link,
lounge rules and the content minimum in place, plus alerts by push and e-mail: info 4.0, commerce 3.5 and flight
4.5 give about **80%**. That is level with Heathrow (79.0%), not clearly ahead of it. A lead needs a capability no
benchmark has, such as a network-wide live status layer fed by operations or one basket from the flight page.

---

## 5. Strengths [measured unless marked]

1. **Day-of-travel logic an operations director could sign off.** Check-in closed, boarding, departed and arriving
   states are all correct on the flights I opened, and the card and the timeline agree on check-in rows.
2. **The flight page leads with the next action** ("Your next step: Check in … · Gate … · Boarding …") on the first
   phone screen, in English and Malay ("Langkah seterusnya").
3. **Failure handling exists and is honest.** On a feed failure the page keeps the last data with its age and offers
   a retry; no spinner was left running.
4. **The status layer is designed correctly.** Each service line has a time and a source, and lines sit inside the
   journey step where they matter (Aerotrain in the C-gate step, immigration queues in the immigration step). It is
   ready for a real operations feed.
5. **Commerce after the answer, with context.** Fast Track is an optional step after security. Parking dates come
   from the flight. The gate drives "near your gate" in shop and dine. The timeline names the nearest lounge and
   outlets. No offer sits above the primary answer.
6. **One network model.** 39 airports in three tiers on one template. Sections appear only when content exists,
   missing sections answer 404 on the first request, and navigation says "Not published for Lawas" instead of
   linking to nothing.
7. **A low-cost, low-risk platform** [measured and verification]: zero third-party requests, small pages, and
   first-party, consent-aware measurement without identifiers.
8. **A governance asset.** Every fact carries a provenance label, a source and an as-of date in both languages. This
   should become the contract for the CMS.

---

## 6. Ten most significant remaining weaknesses (this lens)

1. **No live operational data anywhere.**
   - The official flight provider is a stub.
   - Every flight, gate, belt, check-in row, queue and space figure is demo data.
   - The integration risk named in round one (server-fed live data, new failure modes) is reduced by the feed route
     and the failure state, but has not been proven against a real source.
2. **Operations publishing is not operator-grade.**
   - Notices are a code file, so publishing or withdrawing one needs a build and a deploy.
   - A status line is derived by matching notice titles.
   - When nothing matches, the line says "No disruption reported in our sources as of hh:mm" with a "Checked hh:mm"
     stamp. This is false reassurance on any day when a disruption has not been typed into the code.
3. **Multi-airport depth has not moved since round one.**
   - Only KUL, PEN and BKI go beyond an overview and a board.
   - Kuching and Langkawi, both international gateways, have no transport, parking, facilities or lounges.
   - The 17 STOLports are directory cards. Lawas shows the four journey modes with nothing behind them, and no
     operating airline or airport contact.
4. **Nothing can be bought.**
   - There is no basket, and no lounge price, access rules or booking.
   - There is no day-room booking and no reserve-and-collect.
   - There is no advertising inventory, and no B2B enquiry channel (every one is "Not published").
   - The `payment=()` and CSP settings would block a partner checkout as configured.
5. **The price-first parking page rests on unverified prices.**
   - The T1 and T2 terminal car parks show "≤ RM 52 (not verified)" from klia.info and an undated page.
   - Preferred Parking and Penang standard parking have no price.
   - The booking link cannot carry dates.
6. **Measurement cannot yet support a commercial case.**
   - The main "Book parking online" link and the Fast Track link on the facilities page carry no campaign parameter
     and send no hand-off event.
   - Counts are kept in server memory.
   - No partner referral codes, so no partner can confirm conversions.
7. **The operator's voice and sourcing.**
   - The Aerotrain notice hedges MAHB's own operations.
   - Arrival steps cite third-party guides for MAHB's own building and say "Malaysia Airports' own page was not read".
   - The Malay is unreviewed by a native editor.
   - None of this would pass brand and legal review.
8. **Alerts do not reach a passenger whose browser is closed**, and they do not work on iPhone outside an installed
   web app. E-mail follow is a demo. The Follow control sits below the first phone screen.
9. **Different surfaces give different answers.**
   - The concierge and the help centre say parking rates are "not yet verified", while the parking page shows the
     Long Term Car Park at most RM 32 a day.
   - At 18:21 the home card shows "Be at the airport by 16:35 · Next: Check in 16:35" instead of "check-in closes 18:35".
   - The home's "parking" suggestion leads with Preferred Parking.
10. **Release engineering is unproven.**
    - CI, WebKit and the chaos and contract tests have never run.
    - [verification] TBT misses its 200 ms budget on 7 of 10 pages.
    - The enforced CSP keeps `unsafe-inline`.
    - Rate limiting depends on the host declaring its client-address header.

---

## 7. Launch blockers

### 7.1 Fixable by the delivery team

1. **CI and budgets** (E-06, E-01).
   - Run the CI workflow with WebKit, the chaos and contract tests, and the security and Lighthouse gates.
   - Bring TBT under 200 ms on the home, overview, board and parking pages, or agree revised budgets with the
     design owner.
2. **Complete the attribution and make the counts durable** (E-17).
   - Mark every commercial hand-off with `data-handoff`: the main "Book parking online", Fast Track on the facilities
     page and the flight timeline, the lounge operators' pages and the rail ticket link.
   - Replace the in-memory metric store with a persistent, aggregate store before any pilot, so the north-star metric
     can be reported over time.
3. **One fact, one answer.**
   - The concierge and the help FAQ must read parking rates from the same records as the parking page.
   - A content test should fail when two surfaces disagree.
4. **The home card and My journey show the deadline that still matters.**
   - After the arrive-by time has passed, show "Check-in closes hh:mm" (or the next open step).
   - Never show a past time as "Next".
5. **Status-line semantics until a feed exists.**
   - Drop "Checked hh:mm" for lines computed from static notices, or state "from notices last published hh:mm".
   - Define a staleness rule: a line older than its threshold shows "Status not available" rather than "No disruption".
6. **Directory-only and thin airports.**
   - Hide the journey-mode switcher where no task sits behind it.
   - Show the operating airline and the airport's own contact once sourced.
   - Label depth on `/en/airports` (for example "Flights and guide", "Flights only" and "Directory only") so passengers
     know what to expect before they choose an airport.
7. **Search relevance for facility words.**
   - "wifi" and "taxi" should lead with the facility or transport entity.
   - The home's "parking" should lead with the parking page or the Long Term Car Park.
8. **Phone order on the flight page.**
   - Bring "Follow" into the first two screens.
   - Keep Fast Track where it is (after security), but add it to the summary for international departures as an
     optional link.
9. **Per-route header policy for checkout pages** (E-09). A nonce-based CSP and a payment policy scoped to the
   routes that need it.

### 7.2 Dependent on MAHB data, systems or partners

1. **Official flight feed (OOS-01).** Proven against the failure states, with a contract test against the real
   interface.
2. **Operations status feed and a notices CMS (OOS-02).**
   - Aerotrain, the inter-terminal train and shuttle, immigration and security queues.
   - Bilingual approvals, scheduling and an audit trail.
   - A notice live in under 5 minutes without a deploy, with a named duty owner in the airport operations centre.
3. **Official parking tariff and booking deep link (OOS-03).**
   - The tariff from the barrier system's rate source.
   - A booking API or deep link that accepts product, entry and exit times and a referral code.
4. **Fast Track and lounges (D-02, OOS-04).**
   - Fast Track: seller identity, price, hours and checkpoints covered, then a merchant or referral agreement.
   - Lounges: access rules, prices and booking links from each operator.
5. **Content minimum per airport tier (OOS-06, OOS-05).**
   - Transport, parking, facilities with hours and location, and lounges for every international airport (Kuching
     and Langkawi first).
   - The concessionaire directory feed: names, hours, location, price band, halal and images.
   - The airport classification confirmed: 5 / 17 / 17 here against 16 / 18 in MAHB's 2018 description, a question
     the research files leave open.
6. **Operator-grade sourcing, and brand, legal and native-Malay review (OOS-08, OOS-14).** MAHB becomes the source
   of its own building and service facts. The concept brand line and logo need approval.
7. **Alert delivery (OOS-10).** A web-push service and an e-mail sender, with consent and unsubscribe.
8. **Partner referral codes and confirmed conversions (OOS-13).** Also the B2B channels for retail space,
   advertising and route development (D-17).
9. **Hosting (OOS-11, OOS-12).** Edge limits on the chosen host, the client-address header declared
   (`TRUSTED_CLIENT_IP_HEADER` or `TRUSTED_PROXY_HOPS`), and security.txt.
10. **Prove before launch (OOS-15).** A moderated usability study of the top tasks in both languages on phones, and
    field Core Web Vitals on a mid-range Android over Malaysian networks.

**Position.** A closed pilot at KLIA is reasonable once items 1 to 5 of 7.1 are done and MAHB has connected the flight
feed and a notices owner (7.2, items 1 and 2). Public launch across the network needs all of 7.2 except the B2B
channels.

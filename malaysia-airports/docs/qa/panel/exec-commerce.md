# Review panel: executive and digital commerce

Independent review panel, two members writing in turn:

- **(A) Chief digital officer** of a leading international airport group: strategy, operations, governance, cost to
  run, integration risk, brand.
- **(B) Digital commerce specialist**: ancillary revenue (parking pre-booking, Fast Track, lounges, reserve-and-collect,
  retail and dining discovery, advertising, loyalty), conversion design, partner integration.

Date: 18 November 2026, about 18:20 to 19:00 MYT. Product: the existing production build in `.next/`, served by this
panel with `next start -p 3106` (stopped by its own PID afterwards). Nothing was built, nothing under `src/` or the
configuration was changed, no git command was run. Findings as JSON: [`exec-commerce.json`](exec-commerce.json).
Evidence kept with this report: [`exec-commerce/`](exec-commerce/) (8 screenshots and `measurements.json`).

**Labels.** **[measured]** is something this panel observed or measured, with the tool named. **[judgement]** is expert
assessment. Benchmark facts come from `docs/strategy/benchmark-report.md` and the benchmark screenshots in
`docs/research/screenshots/`; they are cited as such.

**What is prototype-only.** Flight data, gate times, car-park space and wait times are a labelled demonstration
provider (`/api/health` reports `flights`, `waitTimes` and `parkingAvailability` all in `demo` mode). Published facts
come from a sourced content layer that is deliberately partial. As instructed, the design and product are judged as if
production data were connected, but **info** and **commerce** are scored on what is actually there.

---

## 1. Verdict in one paragraph each

**(A) Chief digital officer.** This is the most disciplined airport website concept we have reviewed: one network
model for 39 airports, a flight search that does not make the passenger know the terminal, a journey timeline built on
provenance, zero third-party requests and pages around 720 KB. Strategically it is the right product. Operationally it
is not yet an airport website: there is no live data path (the official flight provider is a stub that throws), no
failure state for when a feed breaks, no status layer for the Aerotrain or immigration, and every notice is a code
change. Content depth sits in three of 39 airports. We would fund it to launch, not launch it as is.

**(B) Digital commerce specialist.** As a revenue channel the prototype is, today, weaker than the site it replaces.
Nothing can be bought, Fast Track (which MAHB sells now) is absent from the whole product, parking cannot be priced, the
booking link drops the dates and carries no attribution, lounges have no price or booking, and the retail directory has
8 outlets with no hours. The underlying design is good for commerce later: the journey timeline is the right place for
offers, the gate-proximity model is genuinely useful, and the "commerce after the answer" principle protects trust.
What is missing is integrations, data and measurement, not the concept.

**Joint score: 72.5% weighted** on the benchmark rubric [judgement], against Heathrow 79.0%, Changi 76.5% and MAHB
today 42.5% in the benchmark matrix. With production data and the launch fixes in section 6 we project about 79 to 80%
[judgement]: level with the best benchmark, not clearly beyond it.

---

## 2. Scorecard (benchmark rubric)

Scale 1 to 5 in half points; anchors 3 = competent major airport, 4 = strong with evidence, 5 = best-in-class
reference with first-hand evidence. Weighted total = sum of score x weight, as a percentage of 5.

| Key | Weight | Score | Confidence | Best benchmark | MAHB today | Why (evidence) |
|---|---|---|---|---|---|---|
| ui | 10% | **4.0** | Medium | 4.0 (Changi, Haneda, Dubai, Hamad) | 2.5 | Refined editorial serif, restrained palette, bespoke line art, consistent tokens and dark mode [measured: screenshots]. Held back by no photography or sense of place, dense provenance chips on every card, section tabs clipped at every desktop width (exec-commerce-15), and heavy chrome on phone |
| ux | 20% | **4.0** | Medium | 4.0 | 2.0 | Flight found from home in one field with terminal shown, 101 to 114 ms to the inline result [measured]; modes (departing, arriving, transiting, meeting), T1 to T2 planner, My journey. Friction: commerce tasks end in hand-offs, parking total unavailable, phone chrome. No usability test yet |
| info | 15% | **3.0** | High | 4.5 (Hong Kong, Incheon) | 2.0 | Scored on what is there. Accuracy and honesty are exemplary (sources, as-of dates, Official / Estimated / Demo labels, "Not published"). Completeness is not: parking rates unverified at all 4 KLIA car parks, 8 outlets, 21 "Not published" on KLIA facilities, only KUL, PEN and BKI beyond overview and flights, a stale gap note (exec-commerce-05, -06) |
| flight | 15% | **4.0** | Medium | 4.5 (five sites) | 2.5 | One search across 21 airports, a page per flight, codeshares, step-by-step timeline with provenance, greeter view, save, share, calendar, "Updated hh:mm" [measured]. Missing for 4.5: alerts only while the page is open, no queue times on the flight page although a provider exists, no feed-failure state (exec-commerce-03, -04, -13). Demo data only |
| mobile | 10% | **3.5** | Medium | 4.0 | 2.0 | Bottom tab bar, search above the fold on home, no sideways scroll on 29 pages, offline page [measured]. But on airport sub-pages the `h1` starts at 440 px of a 664 px viewport, the KLIA board's first flight row is at 1,185 px, pages run 6,300 to 14,800 px (exec-commerce-08); lab TBT up to 1,076 ms |
| nav | 10% | **4.0** | Medium | 4.0 (Hong Kong) | 2.0 | Site search returns entities first (lounges, outlets, flights, facilities, transport) [measured: 10 queries]; Lighthouse accessibility 100 on 4 pages [measured]; legacy redirects 308 or 307. "fast track" returns 0 results; focus not moved after client navigation (integration hand-off, open) |
| ai | 10% | **3.5** | Medium | 4.0 (Heathrow, Istanbul) | 2.0 | Grounded bilingual concierge with sources and flight awareness; remembered airport and modes. Deterministic intents miss commerce questions ("fast track", "duty free chocolate" → unknown) and route "Is the Aerotrain running?" to the gates intent (exec-commerce-17) |
| commerce | 5% | **2.0** | High | 4.5 (Heathrow, Changi) | 2.5 | Scored on what is there: no transaction, no basket, Fast Track absent, parking booking is a generic hand-off without dates or attribution, lounges without price or booking, 8 outlets with hours 0 of 8 (exec-commerce-01, -02, -09, -10). Below MAHB today, which sells Fast Track and has a parking booking form |
| perf | 5% | **3.5** | High | 3.5 (Dubai) | 1.5 | Lighthouse 13 mobile, single run: home 77, flight page 67, parking 89, shop and dine 91; 718 to 779 KB; 45 to 58 requests; CLS 0 to 0.003; zero third-party requests on 58 page loads; HSTS and CSP present [measured]. Misses its own budgets (TBT, LCP 4.8 s on the flight page, `unsafe-inline` in CSP); matches `docs/qa/performance.md` |
| **Total** | | **72.5%** | Medium | 83.0% composite | 42.5% | 362.5 of 500 weighted points |

**Projection with production data connected** [judgement, not a score]: info 4.0 (official tariff, outlet and
facility feeds), commerce 3.5 (contextual deep links with dates and attribution, Fast Track, lounge booking), flight
4.5 (alerts by e-mail and push, queue times, failure states), mobile 4.0 (compact chrome) gives about **79.5%**, level
with Heathrow's 79.0%. A clear lead needs something no benchmark has: a single basket from the flight page (BR-21) or a
live network status layer (BR-08) working across all airports.

---

## 3. The ten questions

### Q1. Is this genuinely easier to use than Changi?

- **(A)** For information tasks on the web, yes [judgement, measured support]. Our phone capture of the home page
  ([`home-phone.jpg`](exec-commerce/home-phone.jpg)) puts the airport picker, departures and arrivals switch and flight
  field in the first screen with no consent wall; typing "MH 939" returned the flight card with terminal T1, time and
  status inline in 101 ms ([`home-search-mh939-phone.jpg`](exec-commerce/home-search-mh939-phone.jpg)). The benchmark
  capture `changi-home-mobile.jpg` shows a cookie overlay covering roughly half the phone screen, and the benchmark
  report records that Changi's flight listing did not load in the project's captures and its homepage scored
  Lighthouse accessibility 74 with no skip link. This product scored 100 on all four pages we ran.
- **(B)** For anything that earns revenue, no. Changi lets a passenger reserve duty-free from 30 days before a flight
  (iShopChangi) and ties Rewards to parking benefits (benchmark report section 4.6). Here a passenger cannot buy
  anything, and the shop directory lists 8 outlets.
- **Joint answer:** easier for finding, planning and transferring; not yet for buying; and neither claim has been tested
  with passengers (strategy section 7 requires moderated studies).

### Q2. Is flight discovery faster and clearer than Heathrow?

- **(A)** Clearer, yes; faster, unproven [judgement]. One field accepts a flight number, city, airline or route across
  21 airports without choosing a terminal first, and the result names the terminal (BR-01). The flight page
  ([`flight-mh939-desktop.jpg`](exec-commerce/flight-mh939-desktop.jpg)) shows status, check-in row and counters, gate,
  boarding and gate-close times, then a dated, sourced timeline. The benchmark capture
  `heathrow-flights-departures-mobile.jpg` shows a full-screen hero and then "Your flight selection cannot be found",
  with no last-known data. But Heathrow's speed comes from live data and wait times everywhere; ours is generated in the
  browser, so "faster" has not been measured against a real feed.
- **(A)** Two clarity defects: on the phone the KLIA board's first flight row is at 1,185 px (1.8 screens down,
  [`kul-board-phone.jpg`](exec-commerce/kul-board-phone.jpg)), and on desktop the flight status card starts at 634 px
  below about 320 px of airport chrome [measured].

### Q3. Is the visual design as refined as the best global consumer products?

- **(A)** Close in typography and restraint; short in emotion and density [judgement]. The editorial serif,
  ivory-and-ink palette, line-art of the KLIA roof and consistent component system
  ([`home-desktop.jpg`](exec-commerce/home-desktop.jpg), [`corporate-desktop.jpg`](exec-commerce/corporate-desktop.jpg))
  are more composed than any benchmark capture we compared (Changi, Heathrow, Hamad). What keeps it below the best
  consumer products: no photography or sense of Malaysia beyond line art; every card carries badges ("Official",
  "Estimated", "2 sources", "Not published"), which reads as an information system rather than a premium brand; the
  section tabs are cut mid-word ("Connections anc", "rview") at 1280, 1440 and 1920 px; and the phone's first screen on
  sub-pages is mostly repeated chrome.
- **(B)** Retail and lounges have no imagery at all. Commercial pages need product photography and offer design to
  convert; the current style has no slot for either.

### Q4. Can passengers complete their most important tasks with minimal friction?

- Flight status, terminal, check-in row, T1 to T2 transfer, transport comparison, assistance: yes, with sources
  [measured walk-through on 29 pages].
- Parking price: no. The calculator returns "At most RM 96" for three days only at the Long Term Car Park (from a daily
  maximum) and declines for the other three car parks because rates are unverified; on the phone the estimate figure is
  at 2,206 px [measured] (exec-commerce-02). BR-10 requires the three-day total for each product without scrolling.
- Buy parking, Fast Track, a lounge, a rail ticket or a duty-free pre-order: not possible in the product (section 5).
- Flight alerts: only "while this page is open" (on-page text, exec-commerce-13).

### Q5. Is the information accurate, complete and trustworthy?

- **Trustworthy:** yes, unusually so. Every changeable fact carries a source and as-of date; demo data is labelled at
  every surface; gaps say "Not published" and link to the official page [measured].
- **Accurate:** largely, with one visible contradiction: the "What this prototype has not verified at KLIA" note on the
  flight and transport pages says shops and restaurants in either terminal and Terminal 2 facilities are unverified,
  while shop and dine lists 8 confirmed outlets (2 in Terminal 2) and lounges lists a Terminal 2 lounge
  (exec-commerce-06).
- **Complete:** no (exec-commerce-05). Counted on the rendered pages: KLIA facilities 21 "Not published", lounges 9,
  transport 14; 7 lounge listings "undated"; 36 of 39 airports have only an overview and (for 18 of them) flights.
- **(A)** For an operator, the sourcing policy itself must change: the prototype cites news sites, travel blogs,
  trip.com, threads.com and x.com. That is honest for a concept; an operator must be the source.

### Q6. Is the mobile experience exceptional?

Good, not exceptional [judgement, measured support]. Strong: bottom navigation with a central search, home search in
the first screen, no sideways scroll on any of 29 pages at 390 px, zero console errors, offline support. Weak: on every
airport sub-page the `h1` sits at 440 px of a 664 px viewport (concept banner, header, airport banner, terminal chips,
section tabs, breadcrumb: [`kul-parking-phone.jpg`](exec-commerce/kul-parking-phone.jpg)); page heights reach
14,786 px (KLIA facilities) and 11,148 px (transport); Lighthouse mobile TBT 1,076 ms on home and LCP 4.8 s on the
flight page in our runs, and `docs/qa/performance.md` measured INP over target on four of six pages.

### Q7. Does it support MAHB's commercial and operational objectives?

- **(A) Operational: the architecture yes, the product not yet.** Provider interfaces, dated notices with validity
  windows, a network model for 39 airports, legacy redirects and an offline-capable static build all serve the
  operator. Missing: live feeds and their failure states, a status layer (Aerotrain, immigration, T1 to T2), queue
  times (a demo provider exists, but no page renders it), and a CMS so operations staff can publish a notice
  in minutes rather than through a build (`docs/engineering/architecture.md` section 1 confirms "no database and no
  CMS").
- **(B) Commercial: not yet.** Zero conversion paths, Fast Track missing, no attribution on outbound links and no
  analytics, so the strategy's commercial metrics (parking pre-booking share, ancillary hand-off rate, Fast Track and
  lounge attach) cannot be measured. The product could reduce contact volume on parking and transport questions, but
  that is also unmeasured.

### Q8. Is it differentiated enough to establish a new international benchmark?

Differentiated, yes; a benchmark, not yet [judgement]. Distinctive and better than any benchmark capture: network-wide
flight search with the terminal resolved, a per-flight journey timeline with provenance, a T1 to T2 self-transfer
planner, a greeter mode, a grounded bilingual concierge, and an explicit provenance layer that turns honesty into a
feature. Against that: 72.5% today and about 79.5% projected, level with Heathrow. To set the benchmark it must do
something the leaders cannot: a single basket from the flight page across parking, Fast Track and lounges, and a live
status layer across the network.

### Q9. Most significant remaining weaknesses (ranked)

1. **No revenue path, and Fast Track is missing entirely** (exec-commerce-01, -02, -09, -10). The product is
   commercially weaker than today's MAHB site.
2. **No live data path or failure handling** (exec-commerce-03). The official flight provider throws; flights are
   generated in the browser; no last-known-data state exists to take over when a feed fails.
3. **No operational status layer, queue times or notice publishing outside code** (exec-commerce-04).
4. **Thin and uneven content** (exec-commerce-05): no verified parking tariff, 8 outlets, 3 of 39 airports with
   transport, parking and facilities.
5. **Phone first screen and page length** (exec-commerce-08).
6. **Copy and sourcing not fit for an operator's brand and legal governance**, plus a stale gap note
   (exec-commerce-06, -11).
7. **Alerts only while the page is open** (exec-commerce-13).
8. **No measurement or attribution** (exec-commerce-12): the north-star metric and every commercial KPI are unmeasurable.
9. **Contextual links lose the flight** (exec-commerce-07): gate, terminal and dates are not passed to shop and dine or
   parking.
10. **Headers will block checkout and partner widgets as configured; CSP keeps `unsafe-inline`** (exec-commerce-14).
11. **Performance below its own budgets on home and flight pages** (exec-commerce-19).

### Q10. What must be improved before public launch?

See section 6 (launch gates). In short: real flight feed with failure states; official parking tariff and booking deep
link with dates; Fast Track restored; status and notice publishing through a CMS with approvals; content to a defined
minimum for every international airport plus Kuching and Kota Kinabalu; brand, legal and native-language review; alerts
that work when the page is closed; first-party analytics with referral codes; compact phone chrome; performance budgets
met.

---

## 4. (A) Chief digital officer: operations, scale, governance

### 4.1 Operational usefulness

| Area | What we observed | Assessment |
|---|---|---|
| Notices | `/en/notices` lists 6 notices with severity, validity window and sources; home and KLIA show the planned Aerotrain closure (28 Nov to 1 Dec) with a "Details" link; the concierge answer to "Is the Aerotrain running?" includes it [measured] | Good model. But notices live in `src/content/notices.ts`, so publishing or withdrawing one needs a developer, a build and a deploy. Unacceptable for disruption |
| Notice wording | "A software update is scheduled ... we found no confirmation of the final dates" [measured, concierge API] | An operator cannot hedge its own operations. In production MAHB is the source and the notice states the fact |
| Disruption on the flight page | "If your flight is delayed or cancelled" sends the passenger to the airline and help centre [measured] | Correct division of responsibility; no rebooking, hotel or lounge help yet |
| Data freshness | Every flight surface shows "Updated hh:mm, refreshes every 30 seconds"; content shows as-of dates [measured] | Meets the stamp part of BR-05; the failure part is absent (exec-commerce-03) |
| Queues and status | Wait-time and car-park-space providers exist in demo mode; car-park space is shown, wait times are shown on no page: only `/api/health` reports the provider (grep of `src/`) | BR-08 and BR-09 not delivered in the passenger UI |

### 4.2 Multi-airport scalability

- **Model: scales.** One template for 39 airports in three tiers (5 international, 17 domestic, 17 STOLports), with
  sections that appear only when content exists, and KLIA as one airport with two terminals [measured: `/en/airports`,
  sitemap].
- **Content: does not yet.** In the sitemap only KUL (17 English URLs), PEN and BKI (6 each) have more than an
  overview and a flight board. Kuching and Langkawi, both international gateways, have no transport, parking or
  facilities pages (`/en/kch/parking`, `/en/lgk/transport` answer 404). Content file sizes tell the same story:
  `kul.ts` 1,946 lines, `pen.ts` 560, `bki.ts` 424, `kch.ts` 148, `lgk.ts` 47 [measured].
- **STOLports** show the mode switcher with no tasks under it ("What do you need at Long Banga?" followed by nothing
  actionable) [measured, `/en/lbp`]. Hide the switcher where there is nothing to switch.
- **Status codes:** a missing section returned 200 with "Page not found" on the first request and 404 on repeats
  (exec-commerce-18).

### 4.3 Governance, cost to run, integration risk, brand

- **Governance.** The provenance model (one fact, one source, one as-of date, shared by both languages) is the best
  governance asset in the product and should be kept as a CMS contract. Gaps: no CMS, approvals or audit trail (planned
  in `architecture.md` section 4); third-party sources; Malay copy still a draft (integration hand-off, item 4); no
  analytics, so no evidence for the north-star metric.
- **Cost to run.** Low on infrastructure: 380 prerendered pages, 718 to 779 KB per page, zero third-party requests,
  no runtime vendors [measured]. High on content operations: KLIA depth was reached by hand-sourcing facts; 39 airports
  at that depth needs feeds (tariffs, outlets, facilities, status) and an editorial team with named owners. Budget the
  operating model, not the hosting.
- **Integration risk.** High. The official flight provider is a documented stub
  (`src/lib/providers/official-flights.ts`: "Every data method throws `ProviderNotConfiguredError`"). Today flights are
  generated in the browser, so moving to a server-fed live source changes the performance profile and introduces
  failure modes the UI has never handled. Parking tariff, queue, Aerotrain and outlet feeds do not exist yet.
- **Brand.** The look is credible for a national operator and calmer than the benchmarks. Two brand risks: MAHB's own
  site would tell passengers to "Avoid Preferred Parking" and quote a press report of an RM2,084 bill on an MAHB
  product (exec-commerce-11); and the concept logo, tagline ("Your journey, beautifully connected") and voice need
  brand approval. The "Concept prototype, not official" banner and `noindex` are correct for now.

---

## 5. (B) Digital commerce specialist: conversion map

Status of every conversion opportunity named in the strategy (section 8), as observed. "Integration needed" names
the kind of agreement, or a party already named in the project's own content; no partner is invented.

| Opportunity | Where it appears now | What happens now [measured] | Where the sale is lost | Integration needed |
|---|---|---|---|---|
| Parking pre-booking | Home tile, KLIA overview, parking page, flight timeline ("See parking"), My journey (where I parked) | "Book parking online" opens `airports.malaysiaairports.com.my/en/klia1/parking` in a new tab; no dates, product or referral; estimate gives only an upper bound for one car park | No price before the hand-off; CTA not paired with the estimate; dates from the flight not carried; phone estimate 3.3 screens down | MAHB car-park operation: tariff feed (the same source as the barrier) and a booking API or deep link accepting product, entry and exit times and a referral code |
| Fast Track | Nowhere | Site search "fast track": 0 results; concierge: "unknown"; legacy `/klia1/air-travel/services/fast-track` 307s to the KLIA overview, which does not mention it | Entirely; a product MAHB sells today is invisible | The operator of `myairportfasttrack.com` (identity to confirm, strategy Q3): deep link with flight date and terminal, then a merchant-of-record share |
| Lounges | Lounges page (6 at KLIA), transit page, search | Cards show location and side of security; "who may use it" Not published for most; operator page links only for Malaysia Airlines lounges; no price, no booking | Pay-in lounges (Plaza Premium, Travel Club as listed) have no booking path; departing timeline never suggests a lounge for a long dwell | Each lounge operator listed on the page: access rules, prices and a booking link or API |
| Day rooms and hotels | Lounges page (Sama-Sama Express, DaySleeper, Kepler), transit page | Dated DaySleeper promotion quoted as text; booking.com appears only as a cited source | No "book a room" action; not offered when a connection is long or a flight is late | The hotel and rest operators already listed (booking deep link with dates) |
| Reserve-and-collect, duty free | Shop and dine (Eraman outlets in both terminals) | Outlet page with location and sources; no pre-order | Entirely | Malaysia Airports (Niaga) Eraman e-commerce, subject to duty-free pre-order rules and the concession review (strategy section 8) |
| Retail and dining discovery | Home strip, shop and dine, outlet pages, flight timeline | 8 outlets (Dine 1, Shop 7); hours 0 of 8, price 0 of 8; home "Open now" filter leads to "0 of 8"; no images | Discovery dead-ends; timeline link does not pass the gate, so "near your gate" is not applied (exec-commerce-07) | Concessionaire directory feed (names, hours, location, price band, cuisine, halal, images); map points |
| Ground transport tickets | Transport comparison | KLIA Ekspres RM55 until 31 Dec 2026 and RM65 from 1 Jan 2027, both dated; "check kliaekspres.com" as plain text | No ticket link | Rail and coach operators named on the page: ticket deep links |
| Advertising and sponsorship | None in the passenger product; corporate "Business with us" | Advertising: "Nothing further is published ... Dedicated channel: Not published" | No inventory and no sales enquiry path | MAHB media sales: first-party, labelled slots (strategy principle 10); an enquiry form on the business page |
| Loyalty and account | None (by design: strategy phase 3) | Saved flights, places and a parking note on the device only | No identity to attach offers to | Defer; the on-device journey is the right seed |
| Car rental | Penang parking links to the official rental page | Plain link | No dates, no attribution | Rental desks at the airport, through MAHB |

**Commerce verdict [judgement].** The product loses every sale at the same three points: no price on the page, no
context passed to the seller, and no attribution back. The fixes are in priority order: (1) contextual deep links
carrying flight date, terminal, gate and a referral code, with no personal data (strategy phase 1); (2) Fast Track
restored on the departing timeline after the security step; (3) official parking tariff and the three-day totals;
(4) lounge access and booking; (5) an outlet feed; only then (6) a single basket (BR-21). Keep the principle that no
offer sits above the primary answer: the flight page's step order already does this well.

**Platform note for checkout.** The live headers send `Permissions-Policy: payment=()` and a CSP with
`connect-src 'self'` and no `frame-src` (`src/lib/seo/security-headers.ts`, `curl -I /en`) [measured]. That is correct
for a site with no checkout, and it will block the Payment Request API and any partner payment frame. Plan a per-route
policy for checkout pages rather than loosening it site-wide.

---

## 6. Launch gates (before public launch)

| # | Gate | Owner (proposed) | Closes |
|---|---|---|---|
| 1 | Official flight feed behind the provider interface, served from the server with cache; last-known data with its age within 2 s and a retry on failure; a chaos test in CI | Platform, flights | exec-commerce-03 |
| 2 | Notices, status items and all facts in a headless CMS with bilingual approvals, scheduling and audit; a notice can go live in under 5 minutes without a deploy | Platform, operations | exec-commerce-04, -11 |
| 3 | Official parking tariff from the barrier's rate source; three-day total per product in the first screen; booking deep link with product, dates and a referral code | Commerce, car-park operation | exec-commerce-02 |
| 4 | Fast Track findable (search, concierge, KLIA overview) and offered after the security step on departing flight pages | Commerce | exec-commerce-01 |
| 5 | Content minimum for every international airport plus KCH and BKI: transport, parking, facilities with hours and location, lounges with access rules; stale gap notes removed | Content | exec-commerce-05, -06, -09 |
| 6 | Source policy: MAHB-owned or contracted sources only for published facts; brand and legal review of warnings; native Malay review of core journeys | Content, brand, legal | exec-commerce-11 |
| 7 | Alerts that reach a passenger when the page is closed (web push and e-mail, BR-04) | Flights | exec-commerce-13 |
| 8 | First-party, consent-aware analytics for the north-star metric; referral codes on every commercial hand-off | Platform, commerce | exec-commerce-12 |
| 9 | Compact airport chrome on phone sub-pages; task content in the first screen | Shell, design system | exec-commerce-08, -15 |
| 10 | Performance budgets met on home and flight pages (TBT, LCP, INP); nonce-based CSP | Platform | exec-commerce-14, -19 |
| 11 | Moderated usability study of the top eight tasks in both languages, including assistive-technology users | Research | Q1, Q4 |

---

## 7. Findings

Twenty findings; details, expected behaviour, fixes and file pointers are in
[`exec-commerce.json`](exec-commerce.json).

| ID | Severity | Area | Title |
|---|---|---|---|
| exec-commerce-01 | high | commerce | Fast Track is absent from the whole product, though MAHB sells it today |
| exec-commerce-02 | high | parking | Parking cannot be priced or booked in context (BR-10 fails) |
| exec-commerce-03 | high | platform | No feed-failure or last-known-data state; the official flight provider is a stub |
| exec-commerce-04 | high | flights | No operational status layer or queue times; notices need a code deploy |
| exec-commerce-05 | high | content | Information completeness well below the benchmark (scored on what is there) |
| exec-commerce-06 | medium | content | A stale "not verified" note contradicts the shop and dine and lounges pages |
| exec-commerce-07 | medium | commerce | Flight-page commerce links drop the flight's gate, terminal and dates |
| exec-commerce-08 | medium | shell | Phone first screen on airport sub-pages is two-thirds repeated chrome |
| exec-commerce-09 | medium | commerce | Lounges and day rooms are listed but cannot be priced or booked |
| exec-commerce-10 | medium | commerce | Retail discovery dead-ends; no reserve-and-collect, imagery or offers |
| exec-commerce-11 | medium | content | Copy and sourcing would not pass an operator's brand and legal governance |
| exec-commerce-12 | medium | platform | Commercial outcomes cannot be measured: no analytics, no attribution |
| exec-commerce-13 | medium | flights | Flight alerts arrive only while the page is open |
| exec-commerce-14 | medium | security | Header policy will block checkout integrations; CSP keeps `unsafe-inline` |
| exec-commerce-15 | low | design-system | Airport section tabs are clipped at every desktop width |
| exec-commerce-16 | low | transport | No rail ticket path; no anti-touting message on the transport comparison |
| exec-commerce-17 | low | concierge | Concierge does not recognise commerce intents |
| exec-commerce-18 | low | platform | Missing airport sections answer 200 on the first request, 404 afterwards |
| exec-commerce-19 | low | performance | Mobile lab performance below target on home and flight pages |
| exec-commerce-20 | low | corporate | Business-to-business revenue channels (advertising, retail space) have no enquiry path |

---

## 8. Method and evidence

- **Pages visited [measured].** 29 URLs on desktop (1440 x 900) and phone (Playwright iPhone 14 emulation, 390 x 664
  CSS viewport), 58 loads: `/en`, `/en/kul`, KLIA board, a departing (MH 939) and an arriving (MH 1663) flight page,
  KLIA parking, transport, shop and dine, an outlet page, lounges, transit, facilities, map, notices, concierge,
  My journey, search, airports, Penang overview and parking, Kota Kinabalu lounges, Langkawi, corporate home, about,
  business and media centre, help contact, accessibility, and `/ms/kul/parking`. Plus text dumps of corporate
  governance, sustainability, careers, network, `/en/lbp`, `/en/lgk/parking`, `/en/pen/shop-dine`, and a gate-assigned
  flight (MH 570). All 58 loads returned 200 with zero console errors, zero third-party requests and no sideways scroll
  on the phone. Compact results: [`exec-commerce/measurements.json`](exec-commerce/measurements.json).
- **Interactions [measured].** Home search "MH 939" on desktop and phone (inline result in 114 and 101 ms); site search
  for 10 queries; parking "3 days" quick stay; home shop strip and `?filters=open-now`; flight-page link targets for a
  flight without and with a gate; 7 concierge questions through `POST /api/concierge`; legacy redirect status codes;
  response headers.
- **Lighthouse [measured].** Lighthouse 13 mobile (project helper `lh.js`), one run per page, shared container with
  other evaluators running: home 77 (LCP 1.27 s, TBT 1,076 ms), flight page 67 (LCP 4.84 s, TBT 621 ms), parking 89,
  shop and dine 91; accessibility 100 and best practices 100 on all four; SEO 54 to 63 because the prototype is
  `noindex` by design. Consistent with the three-run medians in `docs/qa/performance.md`.
- **Screenshots compared [measured, viewed].** Product: home desktop and phone, home search result on phone, KLIA
  board on phone, MH 939 flight page desktop, KLIA parking on phone, shop and dine desktop, corporate desktop (copies in
  [`exec-commerce/`](exec-commerce/)). Benchmarks from `docs/research/screenshots/`: `changi-home-mobile.jpg`,
  `heathrow-flights-departures-mobile.jpg`, `hamad-flightdetail-desktop.jpg`.
- **Code read [measured, grep].** `src/lib/providers/index.ts` and `official-flights.ts`, `src/lib/journey/index.ts`,
  `src/lib/seo/legacy-redirects.ts`, `src/lib/seo/security-headers.ts`, `src/content/airports/kul.ts`,
  `src/content/notices.ts`, `src/content/types.ts`, `src/components/parking/car-park-card.tsx`.
- **Limits.** One evening session (18:20 to 19:00 MYT) on demo data; no live feeds; no usability participants; no
  manual assistive-technology test; lab performance on a shared CPU. Every score is an expert judgement on that
  evidence, with the confidence shown.

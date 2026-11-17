# Benchmark: Tokyo Haneda Airport (tokyo-haneda.com)

- Assessed: 2026-11-17 (captures taken 2026-11-16 23:52 to 2026-11-17 00:20 UTC, about 09:00 Japan time)
- Assessment type: expert assessment, not an instrumented usability test. Scores are a reviewer's judgement against the 1-5 rubric, backed by the observations listed.
- Evidence level: direct (first-hand browser access to tokyo-haneda.com), plus 2 web searches.
- Weighted score: 78.5% (3.93 / 5)

## Summary

Haneda's passenger terminal site is a recently styled, card-based site whose strength is operational usefulness. The homepage carries a flight search widget and a "Real Time Congestion Delay Information" panel (delay and cancellation counts, rail status, car park occupancy, all timestamped). Flight results are clear cards with green status pills, terminal chip, check-in counters, gate and codeshares, and each flight opens a "Sample Plan": a flight-specific timeline from duty-free pre-order through check-in counters, recommended shops and restaurants in that terminal, security, and the gate. Commerce is broad (official online shop, duty-free pre-order, parking reservation, a points programme). Weak points: a 16 MB homepage with a video hero, flight lists that do not refresh on their own, alerts only in the app, a map and a site search that both depend on third-party hosts, no skip link, and no security headers on the HTML response.

## Evidence access

- Direct: 9 pages captured with the capture tool on desktop (1440x900) and mobile (iPhone 14), 11 further pages read with Playwright, 5 interaction scripts (keyboard, flight search by route and by number, flight detail, site search, mobile menu). All responses were HTTP 200; no bot challenge. One 404 was caused by a URL guessed by the reviewer, not by a site link.
- Blocked by this container's network policy (not site defects): `www.googletagmanager.com`, `j.wovn.io` and `data.wovn.io` (WOVN translation layer), `platinumaps.jp` (HANEDA MAP and the floor-guide map iframe), `search-tokyo-haneda.dga.jp` (site-search backend), Zendesk, YouTube, the online shops and reservation sites. Judgements on the interactive map, site-search quality, the chatbot and any strings WOVN would translate are limited accordingly.
- Lighthouse: read from `direct/lighthouse/haneda.json` (run by another process).

## 1. Homepage above the fold

URL: https://tokyo-haneda.com/en/ (redirects to /en/index.html)

- Desktop: a dark notice bar ("Please adhere to the boarding deadline to ensure punctuality. - Total 1 item"), logo, utilities (Customers Who Require Special Assistance, Questions, Language, search), six-item nav, a full-bleed night video of the airport with "HANEDA AIRPORT", and at the very bottom edge the Domestic Flights / International Flights tabs of the flight search.
- Mobile: notice bar, logo, Language and Menu buttons, the video hero, an app banner ("HANEDA Navigator - install for free", dismissible) and the first row of the flight search ("Search by route / Search by flight number").
- Within five seconds a passenger can: read the notice, switch language, open the menu, reach special-assistance information, and begin a flight search (the form starts at the fold). One scroll reveals five tiles (Flights, Restaurants & Shop, Floor Guide, Access, Service Guide) and the real-time panel.

## 2. Navigation, utilities, footer

- Primary nav: Flights, Restaurants & Shops, Floor Guide, Access, Service Guide, Online Shop (dropdowns list each section's pages).
- Utilities: Customers Who Require Special Assistance, Questions (FAQ), Language (5), search. No account or login on the website.
- Footer: a full sitemap by section, Notice from the Airport, Topics, FAQ, Lost and Found, Questions & Comments, Emergency Response, an app block (HANEDA Navigator), social links (X, Facebook, YouTube, Instagram, LINE, WeChat) and operator links.
- Landmarks are clean: one each of `header`, `nav`, `main`, `footer`; one `h1`; breadcrumbs on inner pages.

## 3. Flight information

URLs: https://tokyo-haneda.com/en/flight/index.html, https://tokyo-haneda.com/en/flight/int_search.html, https://tokyo-haneda.com/en/flight/dms_search.html, detail e.g. https://tokyo-haneda.com/en/flight/detail/int_departure.html?searchDt=20261117&flightNumber=JL43, https://tokyo-haneda.com/en/flight/monthlyFlightSchedule.html

- Where: homepage widget and a Flight Search page, split into Domestic and International, each with "Search by route" and "Search by flight number".
- Inputs: origin/destination with a swap button (departures or arrivals), destination picker grouped by region, date, airline, flight status (All, Delayed, Canceled, Divert), or a free-text flight number ("at least one character").
- Fields per flight: date and time, route, status pill, terminal chip (T2, T3), check-in counter letters, gate number, operating airline logo and all codeshare numbers.
- Status vocabulary observed (09:00 Japan time): "Check-in", "Boarding", "Final boarding call", "Gate Closed", each in a green pill. Delay, cancellation and diversion treatments were not live in the sample; the filter chips confirm those states exist.
- Freshness: "2026/11/17 09:07:18 Current (Japan time)" with a result count (161 international departures). The page states the list "will not be updated automatically" and asks users to reload or search again. A separate "Delay and cancellation" counter (Domestic 12, International 10) links to a breakdown by region and city (source `flight_status.json`, field `gettingAt`).
- Detail page: the flight card plus a "Sample Plan" for that flight: Advance preparation (duty-free advance order with 5% discount), Depart for the airport (Google Maps route search), "It is best to arrive three hours before departure", check-in counters F G H I K, "Recommended after check-in" (a named restaurant and shop on Terminal 3/4F), Security Screening, Customs, Departure Procedures, "Recommended before boarding" (airside restaurant, shop, duty-free shop on Terminal 3/3F), boarding gate 113 at 09:50, then arrival.
- Bookmarking and alerts: not on the website. The app page says "Register your flight in My Flights to receive real-time push notifications about delays, cancellations, and gate changes" (https://tokyo-haneda.com/en/other/haneda__navigator_appli.html).
- Interactions from homepage to one flight's status: 4 for an international flight (International Flights tab, Search by flight number, type the number, search); 3 for a domestic flight (default tab). The result card shows status, counters and gate; one more click opens the Sample Plan.

## 4. Journey assistance and personalisation

- The Sample Plan is contextual personalisation without login: it uses the flight's terminal, counters and gate to order tasks and to recommend landside and airside outlets.
- Audience guides: First-time Customers, Customers Coming from Overseas, Customers with Children, Customers Using a Pick-up Service (https://tokyo-haneda.com/en/service/index.html); step-by-step "Use Domestic" and "Use International" procedures.
- Accounts exist only in the app and the online shop (membership, My Page, HANEDA Points).

## 5. Maps and wayfinding

URLs: https://tokyo-haneda.com/en/floor/index.html, https://tokyo-haneda.com/en/floor/floor-guide.html?area=9&tab=terminal3

- The Floor Guide embeds an interactive map from platinumaps.jp (iframe with terminal, floor, bearing and zoom parameters) and links to a full-screen "HANEDA MAP" in five languages. The host is blocked here, so pan/zoom, search, routing and walking times could not be assessed.
- First-party parts observed: terminal tabs (T1, T2, T3) and a legend of 36 facility and category types, including Accessible Facilities, Multipurpose Toilets, Assistance Dog Toilets, "Calm down, cool down" Spaces, Telecommunications Relay Service Booth and accessible pick-up and drop-off points.
- Shop and restaurant listings give terminal, floor and before/after security (for example "Terminal 3/3F (after security check)"). Special-assistance pages deep-link to the map per terminal.

## 6. Ground transport and parking

URLs: https://tokyo-haneda.com/en/access/index.html, https://tokyo-haneda.com/en/access/train/index.html, https://tokyo-haneda.com/en/access/parking/index.html

- Homepage panel: Keikyu Line and Tokyo Monorail service status ("Normal service"), and occupancy for P1 to P5 (Vacant, Congestion, Full), with "As of" time. The parking page says the status is "real-time information updated every 3 minutes".
- Access hub: Train & Monorail, Car & Motorbike, Parking, Express Bus & Route Bus, Taxi, Wharf & Cruise, Travel Between Terminals, From Haneda to Narita. "Route Information" hands off to an external route search (Jorudan "haneda route master", per terminal, five languages; not reachable here). Journey times to ten major stations are tabled on the train page.
- Parking: capacity table per car park (for example P4 3,087 spaces), EV charging, accessible spaces, fees, congestion advice, nearby alternatives; reservations for P2 to P5 on separate operator sites. No single price comparison or unified booking.
- Taxi stands (general and app-dispatched), and video routes from arrival lobbies to each transport mode (YouTube).

## 7. Shopping, dining, e-commerce, loyalty

URLs: https://tokyo-haneda.com/en/shop_and_dine/index.html, https://tokyo-haneda.com/en/shop_and_dine/search_r.html, https://tokyo-haneda.com/en/other/nav_pointprogram.html

- Restaurant search: 171 results; filters for terminal (T1, T2 Domestic, T2 International, T3), "Open" now, "With coupon", "Halal and Vegetarian options available", area and genre. Separate shop and duty-free searches.
- "Online Shop" is a primary nav item: HANEDA Shopping (official online store), Haneda Direct Selection, duty-free advance reservations for Haneda and Narita in five languages. All run on external domains.
- Bookable services: parking reservation, lounge, airport escort service, special assistance reservation, WHILL autonomous wheelchair service.
- Loyalty: HANEDA Points, tied to the app and the online store: 10 points per 500 yen in participating airport stores, 1 point per 100 yen online, redeemable (100 points = 100 yen in stores), valid 3 years, retroactive claims in the app.
- Shop news is often published as PDF ("PDF / 1.2MB") rather than as pages.

## 8. Transit and connections

URLs: https://tokyo-haneda.com/en/flight/transit/index.html, https://tokyo-haneda.com/en/flight/transit/int_int.html, https://tokyo-haneda.com/en/access/travel_between_terminals/index.html

- Four connection types, each with its own page: Domestic to International, International to Domestic, Domestic to Domestic, International to International, with step lists per arrival terminal (for example follow "International Transit", transit counter, transit bus stop for Terminal 3).
- Inter-terminal travel: free shuttle bus with first and last departures and intervals (4 minutes 05:00-20:00, 8 minutes 20:00-24:00), timetables as PDF, rail option, T1-T2 underground passage, wheelchair assistance on the bus without reservation.
- No connection-time calculator or personalised transfer route.

## 9. Accessibility

Content (https://tokyo-haneda.com/en/service/barrier-free_information/index.html): a permanent header link. Pages by need: Mobility-Impaired, Vision-Impaired, Speaking and Hearing-Impaired, and customers with developmental, intellectual or mental disabilities. Services: wheelchair rental, accessible parking spaces and discounts, special assistance reservation, "Calm down, cool down" spaces, telephone relay service, assistance dog toilets, Hidden Disabilities Sunflower, WHILL autonomous wheelchair, an "HND Airport Story" experience support book for Terminal 3 (PDF, 19.6 MB), and airline and rail operator support links. Two accessibility reports are linked with Japanese titles only. Search-level context (not observed here): the operator's March 2026 release reports a first place in the Skytrax category for passengers needing mobility assistance for the eighth consecutive year, and third place overall in the 2026 World Airport Awards.

Site accessibility (axe-core WCAG A/AA, automated only):

| Page | Desktop | Mobile |
|---|---|---|
| Homepage | 4 rules / 6 nodes: critical 2, serious 2 | 5 rules / 11 nodes: critical 2, serious 3 |
| Flight search (international) | 4 rules / 9 nodes: critical 2, serious 2 | 4 rules / 7 nodes: critical 2, serious 2 |
| Special assistance | 1 rule / 1 node: serious 1 | 1 rule / 1 node: serious 1 |

- Rules: `button-name` (1), `label` (1), `list` / `listitem`, `aria-hidden-focus` (mobile homepage), `color-contrast` (6 nodes on the flight search page).
- Unlabelled inputs: none by the capture's label test. The search field carries a Japanese `aria-label` on the English page, and several controls showed Japanese text in this session (for example a "閉じる" close button and car park headings); WOVN was blocked, so this may differ for real users.
- Images without alt: 5 of 238 (desktop homepage), 0 of 218 (mobile).
- Keyboard, first 12 stops on the homepage: notice "View More" button, notice list item, notice link, logo, search field, search button, Flights, Restaurants & Shops, Floor Guide, Access, Service Guide, Online Shop. Order is logical. No skip link. A focus outline was present on 11 of 12 stops (not on the search field).

## 10. AI assistant, chatbot, search

- FAQ (https://tokyo-haneda.com/en/faq/index.html) offers keyword search, popular keywords (#lost item, #Flights, #Parking, #Reservation, #Lounge), categories, and "Ask a question via chatbot", which links to https://tokyo-haneda.com/en/contact/index.html#chatbot ("Chatbots" section). The chatbot itself was not rendered or tested here; it is not a floating widget on other pages.
- Contact by e-mail forms (Zendesk), phone and a survey. A notice on the homepage said e-mail reservations and inquiries were temporarily not accepted (13 November 2026).
- Messaging: LINE and WeChat official accounts are linked in the footer.
- No generative AI assistant was observed on the site.

## 11. Languages, mobile web, app

- Languages: Japanese, English, Korean, Simplified Chinese, Traditional Chinese (separate URL trees: /en/, /ko/, /zh-CHS/, /zh-CHT/).
- Mobile web: no horizontal overflow on any captured page; large form controls and status chips; accordion menu with search at the top and special-assistance and FAQ icons at the bottom; flight cards read well at 390 px. 24 of 71 visible targets on the flight search page were under 24 px. The homepage transfers about 17 MB on mobile.
- App: "HANEDA Navigator" (iOS and Android links on the site) with flight search, My Flights push notifications, facility search, navigation and HANEDA Points; an older "HANEDA AIRPORT" app is also referenced. Search: the US App Store listing shows the app as free with not enough ratings to display a score, and says member registration and login are required to set notifications.

## 12. Performance evidence

Lab, single container, third-party hosts blocked, indicative only.

| Measure | Homepage desktop | Homepage mobile | Flight search (desktop) |
|---|---|---|---|
| TTFB | 524 ms | 602 ms | 825 ms |
| First contentful paint | 1,172 ms | 968 ms | 1,496 ms |
| Load event | 7,459 ms | 2,573 ms | 2,018 ms |
| Requests / transfer | 193 / 16.3 MB | 185 / 17.3 MB | 49 / 0.29 MB |

- Lighthouse (mobile emulation, median of 3): performance 49 (runs 54, 49, 22), accessibility 80, best practices 96, SEO 91; FCP 1.8 s, LCP 24.5 s, TBT 732 ms, CLS 0.062 (one run 0.637), 13.8 MB, 187 requests.
- The homepage weight comes from the video hero and 200-plus images; inner pages are light and fast.
- Hosting: static files from Amazon S3 behind CloudFront. No `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` or Content-Security-Policy header was present on the HTML response checked.
- Reliability: all pages returned 200; the flight API (`/en/app/api/v2/flight/search`) and the live JSON feeds (parking, rail, weather, flight status) returned 200.

## 13. Site search

URL: https://tokyo-haneda.com/en/search/index.html?q=...

- The results page calls a hosted search service (`search-tokyo-haneda.dga.jp`) that is blocked in this container, so every query ("prayer room", "parking", "Kuala Lumpur", "JL43") showed "Failed to retrieve data." Result quality could not be assessed and is not counted against the site.
- What the page itself shows: a search box and "Refine Results" facets: All, Flights, Restaurants & Shops, Floor Guide, Service Guide, Access, Notice from the Airport, Topics.
- Flight numbers are served by the dedicated flight search, which worked ("JL43" returned one exact result).

## Scores table

Expert assessment, 1-5 with half points.

| Dimension | Weight | Score | Evidence level | Confidence |
|---|---|---|---|---|
| ui - UI aesthetics and brand | 10% | 4.0 | direct | high |
| ux - UX and task efficiency | 20% | 4.0 | direct | high |
| info - information depth and accuracy | 15% | 4.0 | direct | high |
| flight - live flight info and journey help | 15% | 4.5 | direct | high |
| mobile - mobile experience | 10% | 4.0 | direct + search | medium |
| nav - navigation, search, accessibility | 10% | 3.5 | direct | medium |
| ai - personalisation and AI | 10% | 3.5 | direct + search | medium |
| commerce - digital commerce | 5% | 4.0 | direct | medium |
| perf - performance, security, reliability | 5% | 3.0 | direct (lab) | medium |
| Weighted | 100% | 78.5% | | |

Evidence bullets per score are in `haneda.json`.

## Standout features MAHB must surpass

1. Flight-specific "Sample Plan" timeline that turns a flight number into an ordered journey with counters, gate and outlet recommendations for that terminal. https://tokyo-haneda.com/en/flight/detail/int_departure.html?searchDt=20261117&flightNumber=JL43
2. Homepage "Real Time Congestion Delay Information" panel: delay and cancellation counts, rail status and car park occupancy with a timestamp. https://tokyo-haneda.com/en/
3. Flight cards with status pill, terminal chip, check-in counters, gate and every codeshare, equally clear on mobile. https://tokyo-haneda.com/en/flight/int_search.html
4. Restaurant and shop search with "Open" now, coupon, halal and vegetarian filters and before/after-security location. https://tokyo-haneda.com/en/shop_and_dine/search_r.html
5. Special-assistance content organised by type of need, with a permanent header link, quiet spaces, relay service and an autonomous wheelchair service. https://tokyo-haneda.com/en/service/barrier-free_information/index.html

## Weaknesses

1. Flight lists do not refresh automatically, and alerts or saved flights need the app and a member login.
2. The homepage is about 16 MB with a video hero; lab LCP is 24.5 s on throttled mobile.
3. The map and the site search depend on third-party hosts, so neither degrades gracefully when those hosts are unreachable.
4. Commerce and reservations are spread over many separate domains (online shop, duty-free, four parking reservation sites) with no shared basket or sign-in on the site.
5. News and timetables are frequently PDFs; no skip link; no security headers on the HTML response.

## Ideas to outperform

1. Build the journey timeline as a live object: it should update with the flight's status, add walking times and security waits, and be shareable with whoever is doing the pick-up.
2. Offer web alerts (push, WhatsApp, e-mail) without requiring an app install or account.
3. Extend the real-time panel to security and immigration waiting times and to rail and bus departures, with history-based "typical now" hints.
4. Keep map and search first-party, with a list fallback, so both work offline-first and under restrictive networks.
5. Use one basket and one identity for parking, lounge, fast-track and pre-order, surfaced inside the flight timeline.
6. Publish notices as accessible HTML with PDF as an optional download.

## Gaps

- Interactive map (platinumaps.jp), site-search results, chatbot behaviour, route search (Jorudan) and the online shops were not observable.
- WOVN was blocked, so residual Japanese strings on the English pages may not reflect what users see.
- Delay, cancellation and diversion status treatments were not live in the sample.
- App quality and ratings rest on one search result; no store score was available.
- Lighthouse and capture timings are lab values from one container with analytics blocked.

## Sources

- Direct captures (JSON and screenshots): `docs/research/direct/raw/bench/haneda-*.json|jpg`
- Lighthouse summary: `docs/research/direct/lighthouse/haneda.json`
- Screenshots: `docs/research/screenshots/haneda-home-desktop.jpg`, `haneda-home-mobile.jpg`, `haneda-congestion-desktop.jpg`, `haneda-flightdetail-desktop.jpg`, `haneda-flights-mobile.jpg`, `haneda-menu-mobile.jpg`
- Pages: https://tokyo-haneda.com/en/ and the URLs cited in each section
- Search (app listing): https://apps.apple.com/app/id6621228101
- Search (2026 Skytrax results, operator release): https://tokyo-haneda.com/site_resource/whats_new/pdf/000017113.pdf and https://skytraxratings.com/2026-world-airport-awards-are-announced

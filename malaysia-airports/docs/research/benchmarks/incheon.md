# Benchmark: Seoul Incheon International Airport (airport.kr)

- Assessed: 2026-11-17 (homepage captured 00:20 UTC, 09:20 Korea time; inner pages and the first interaction script 10:59 to 11:09 UTC, about 20:00 Korea time; flight search, site search and page reads 14:55 to 15:15 UTC, about midnight Korea time)
- Assessment type: expert assessment, not an instrumented usability test. Scores are a reviewer's judgement against the 1-5 rubric, backed by the observations listed.
- Evidence level: direct (first-hand browser access to the English site, www.airport.kr/ap_en/), plus 4 web searches (one shared with the Istanbul report).
- Weighted score: 74.5% (3.73 / 5)

## Summary

Incheon's English site is a dense, data-rich public-service portal. Its flight module is among the most complete benchmarked: a 20-day window with terminal, hour, destination, airline and flight-number filters, a "Last Updated" stamp, an Excel download, and an inline detail that gives the shortest route from car park through tunnel and check-in counters to the gate, the walking time after immigration, the destination's local time and weather, and sharing to KakaoTalk, LINE or e-mail. Around it sit real-time waiting times for each departure area, an hourly passenger forecast for the next two days, live car park availability on the homepage, a flight-based transfer route guide and an integrated search that returns facilities with hours and locations. The weaknesses are technical and editorial: the slowest lab performance in the set (Lighthouse 27, LCP 25.1 s, TBT 2.4 s), no security headers, zoom disabled, no `h1` on any page, Korean strings left on English pages (some read only by screen readers), a homepage clock and a waiting-time stamp that follow the visitor's device rather than Korea time, codeshares listed as separate rows, and no web alerts or chatbot on the English site.

## Evidence access

- Access: https://www.airport.kr/ap_en/index.do returned HTTP 200 on every load in this assessment. An earlier probe in this project had received HTTP 502; the fallback URL was not needed.
- Direct: 6 pages captured with the capture tool on desktop (1440x900) and mobile (iPhone 14): homepage, departures, real-time wait times (Terminal 1), airport map, transfer information, services for the mobility impaired; 7 further pages read with Playwright (expected congestion, duty-free shopping, food and beverage, accessibility statement, departure procedures, sign-up, customer feedback); 3 interaction scripts (headers, skip links and keyboard order, homepage flight search to results and flight detail, integrated search, mobile menu and mobile flight list). No bot challenge.
- Blocked by this container's network policy (not a site defect): `icnmap.airport.kr:28702`, the map engine on a non-standard port, so the Airport Map page rendered blank. One request to www.airport.kr failed on the departures page (cause not identified). No other content host failed.
- External sites not opened: parking.airport.kr (parking reservation), incheonairportdutyfree.com, the transfer route guide's results.
- Lighthouse: read from `direct/lighthouse/incheon.json` (run by another process).

## 1. Homepage above the fold

URL: https://www.airport.kr/ap_en/index.do

- Desktop: logo, five-item nav (Flights, Airport Guide, Transport, At the Airport, Support), language selector (ENG), icon utilities (airport map, accessibility, login, search) and a full-menu button; a full-width hero carousel with slide dots and a pause control; an "Airport Announcements" ticker ("Power Banks Carry-on Rules", 2026-05-18); a "Frequently Sought Information" side tab; at the bottom edge "Search for Departures and Arrivals" with weather and a clock, Departure / Arrival tabs, a date field, an "Enter Flight number / Airline / City" field and a "Flight Search" button. The desktop homepage scrolls in full-screen sections.
- Mobile: menu, logo and search; hero and ticker; then the flight search heading, weather, clock, Departure / Arrival tabs and the date and keyword fields in the first screen.
- Clock: it showed 00:20 when Korea time was 09:20 (capture browser on UTC) and 23:55 when the browser was set to Seoul time. It follows the visitor's device clock while sitting beside Incheon's weather.
- Further sections: Airport Guide tiles for Departure, Arrival and Airport Services (Procedures Overview, Smart Pass, Home to Airport, Restricted Items, Shopping, Airport Map, Arrival Time, Transit Guide, Parking Fees, Duty Free, Shuttle Bus, Services for the Mobility Impaired, Pregnant Women, Infants and Children, Lost and Found); a Traffic Guide with live car park availability by terminal and floor (for example 225, 153 and 458 spots available on three levels); Tips for Visitors; and tabs "Flights info / Immigration Congestion / Airport Map" with a live departures list stamped "2026.11.17 09:20".

## 2. Navigation, utilities, footer

- Primary nav: Flights (Search Flight, Cargo Flight Information, Flight Information, Airport Congestion: Real-time Wait Times and Expected Airport Congestion), Airport Guide (Departure Procedures, Arrival Procedures, Transfer Guide, Custom Services including Autonomous Mobility), Transport (Home to Airport, Parking, Public Transportation, Airport Shuttle Bus routes, Car Rental, Inter-Terminal Transportation), At the Airport (Airport Map, Duty-Free Shopping, General Shopping, Food & Beverage, Convenience & Public Facilities, Exhibitions), Support (Notices, News, Events, FAQ, Phone Numbers, Lost and Found, Voice of Customer). My Page and Others (policies, User Guide for the Visually Impaired, Accessibility Statement, Sitemap) complete the menu.
- Utilities: map, accessibility, login and search icons; popular search terms (transit tour, lounge, luggage storage, hotel, shower). Content pages add Share, Add to favourites, Print and font-size controls, and a per-page satisfaction survey.
- Footer: addresses of Terminal 1, Terminal 2 and the corporation, call centre 1577-2600 (07:00-22:00), social links (Facebook, Instagram, YouTube, Naver Blog), policies, corporate links (Logistics, Complex City Development, MRO, Overseas Business, Aviation Safety Reporting), app links (Google Play, App Store) and about 20 subsidiary and government sites.
- Landmarks: `header`, `nav`, `main` and `footer` present; no `h1` on any captured page. The English homepage's only headings are Korean hidden labels ("비주얼존(0 개)", "롤링 배너존(0 개)", "팝업존(0 개)"). Breadcrumbs with section dropdowns on inner pages.

## 3. Flight information

URLs: https://www.airport.kr/ap_en/1396/subview.do (departures), https://www.airport.kr/ap_en/1399/subview.do (arrivals)

- Where: the homepage search and live list, and the Search Flight pages.
- Filters: terminal (All, T1, T2), date (20 days, 2026.11.04 to 2026.11.23), hour range, destination, airline (about 100) and flight number. "Last Updated : 2026.11.17 (Tue) 19:59" (Korea time), "Refresh" and "download Excel".
- Fields: departure time (estimated in bold, scheduled struck through), destination with code, airline logo and flight number, terminal, check-in counter, gate (link) and "Departure Conditions" as a coloured chip. A note explains the vocabulary ("[Departure] means that the airplane has left the gate for departure").
- Status vocabulary observed (morning, evening and late-night captures): "Departure", "Gate Closing". Other states were not seen.
- Codeshares: each code is its own row; one Tokyo Narita departure at 09:00 (counter G17-J40, gate 278) appeared as six rows (OZ102, NZ4060, NH6972, UA7318, KE5703, EY8453).
- Detail (a row expands in place): a route bar "From South Korea Incheon To Japan TOKYO/NARITA"; "Shortest route": East parking lot, B,C tunnel, G17-J40 check-in counter, gate 278, "after immigration 20 min" and a "See Route" button; "Destination Info." with local date and time, time difference and minimum and maximum temperature; Share (KakaoTalk, LINE, e-mail, copy link).
- Hidden text: the struck-through scheduled time carries a Korean screen-reader label "취소됨" on the English page.
- Bookmarking and alerts: not on the website. Search: the Incheon Airport+ app offers My Flights push notifications.
- Interactions from homepage to one flight's status: 3 (focus the keyword field, type "OZ102", Flight Search), giving a results page with that flight; one more click opens the route detail.

## 4. Journey assistance and personalisation

URLs: https://www.airport.kr/ap_en/6654/subview.do, https://www.airport.kr/ap_en/1410/subview.do, https://www.airport.kr/ap_en/1454/subview.do

- Flight-specific route in the detail (car park zone, tunnel, counters, gate, walking time after immigration).
- Transfer Information: "We provide tailored route guide based on your flight"; the passenger selects the arriving and onward flights by date and hour. The resulting route was not generated in this assessment.
- Real-time wait times per departure area (Terminal 1 areas 1 to 6, east and west; for example area 3 at 17 minutes "Smooth", area 4 at 8 minutes), with a legend (Smooth, Normal, High, Very High), a Refresh button and Terminal 1 and 2 tabs. The "Last updated" stamp read 11:00:20 when Korea time was 20:00, so it also appears to follow the device clock.
- Expected Airport Congestion: predicted passengers per hour for each arrival hall (A,B; C; D; E,F) and departure area (1 to 6), by terminal, for the next one or two days, "updated every day at 17:00".
- Departure procedures step by step (arrival at the terminal, check-in and bag drop, declarations including tax refund and quarantine, pre-departure), plus Smart Pass, Easy Drop and self check-in.
- Accounts: Login, Sign Up and My Page exist for airport tour applications, civil services and business applications, with identity verification by mobile phone and no service under 14. No personal flight list on the website.

## 5. Maps and wayfinding

URL: https://www.airport.kr/geomap/ap_en/view.do?type=2&alertType=0&tmnlId=P01

- The Airport Map (page title in Korean, "인천국제공항 지도") loads its engine from `icnmap.airport.kr:28702`, which was blocked here, so the page was blank. Search, routing and walking times were not assessed.
- Listings give gate, floor and terminal ("Near Gate 25 on 3F Duty-Free Area, Terminal 1") with a Korean-labelled "위치 상세보기" (view location) link; search results offer "View Location"; the flight detail offers "See Route" (not opened).

## 6. Ground transport and parking

- Homepage: live spaces by car park and floor for both terminals, short and long term, with a peak-time note (spelt "peak tiem").
- Parking: Parking Lot Guide, Valet Parking, Parking Lot Congestion, Parking Fees, Electric Vehicle Charging Station Guide, an "Estimated Parking Fee" quick link and Parking Reservation on parking.airport.kr (not opened).
- Public transport: Bus, Train, Taxi/Call Van, Late-night Bus; Airport Shuttle Bus with five route pages and a complete route map; Car Rental; Inter-Terminal Transportation.
- Accessible transport: drop-off zones by exit, and a free wheelchair lift service between the long-term car park and the terminal, about 20 minutes, reservation by phone.

## 7. Shopping, dining, e-commerce, loyalty

URLs: https://www.airport.kr/ap_en/1531/subview.do, https://www.airport.kr/ap_en/1534/subview.do

- Duty-Free Shopping and Food & Beverage directories: filters for Terminal 1, Terminal 2 and Concourse, by operator or cuisine (Korean, Western, Asian, Food Court, Fast Food, Snack / Cafe / Dessert), "24 Hours", "Duty-Free Area" and "Arrival point"; cards give hours, phone, location and "Best" or "24H" tags.
- An "INCHEON AIRPORT DUTYFREE APP" link leads to incheonairportdutyfree.com (separate operator site, not opened). A "Transfer lounge coupon" quick link appears on flight pages.
- No basket, online shop, pre-order or loyalty on the website. Search: the app listing mentions membership benefits for Incheon Airport+ users.

## 8. Transit and connections

URL: https://www.airport.kr/ap_en/1454/subview.do

- Transfer Guide: Transfer Information (the flight-based route guide), Transferring at Terminal 1, at the Concourse and at Terminal 2, Transit Exclusive Domestic Flights, Transfer Security Screening, Transit Tour and K-Stopover.
- Inter-Terminal Transportation and five shuttle route pages cover movement between terminals and car parks.

## 9. Accessibility

Content (https://www.airport.kr/ap_en/1478/subview.do, https://www.airport.kr/ap_en/6644/subview.do): a header accessibility icon on every page; Custom Services for pregnant women, infants and children, travellers with reduced mobility, pets and Autonomous Mobility. The mobility page covers disabled parking, drop-off zones (Terminal 1 exits 3, 7 and 12; Terminal 2 exits 4 and 9), help phones, the wheelchair lift service, valet discounts, and an electric vehicle and wheelchair transport service. An Accessibility Statement makes four commitments, including "Consideration for Invisible Challenges", and a User Guide for the Visually Impaired is linked in the footer. Search context: the 2026 Skytrax World Airport Awards placed Incheon second overall, up from fourth.

Site accessibility (axe-core WCAG A/AA, automated only):

| Page | Desktop | Mobile |
|---|---|---|
| Homepage | 5 rules / 15 nodes: serious 4, moderate 1 | 6 rules / 35 nodes: serious 5, moderate 1 |
| Departures | 5 rules / 138 nodes: serious 4, moderate 1 | 4 rules / 101 nodes: serious 3, moderate 1 |
| Mobility-impaired services | 3 rules / 21 nodes: serious 2, moderate 1 | 3 rules / 21 nodes: serious 2, moderate 1 |

- Rules: `nested-interactive` (78 nodes on departures, links inside the row buttons), `color-contrast` (up to 45 nodes), `link-name`, `label-content-name-mismatch`, `target-size`, `list`, and `meta-viewport` (fixed `width=1800` on desktop and `width=500` on mobile, both with `user-scalable=no`).
- Images without alt: 0 of 189 (desktop homepage).
- Keyboard, first 14 stops on the homepage: three skip links ("Shortcuts to the text", "Shortcuts to the menu", "Shortcuts to the footer"; the footer target was not found), an unnamed link, then Flights and its sub-items. Every stop showed a box-shadow focus indicator. The capture tool's skip-link test looks for the word "skip" and reported none; the links exist under a different label. Lighthouse lists `skip-link` among failed audits.
- Korean strings on English pages (hidden headings, slide controls "이전 슬라이드", "새로고침", "취소됨", "위치 상세보기", the survey heading) are read aloud in Korean by screen readers.
- Lighthouse accessibility 79 (failures: color-contrast, label-content-name-mismatch, link-name, list, meta-viewport, skip-link, target-size).

## 10. AI assistant, chatbot, search

- No chatbot widget or link was observed on the English homepage or the Voice of Customer page, which offers the call centre and forms that require login with mobile-phone identity verification.
- Search: a 24-hour text chatbot "AIRBOT" was launched in 2020 and an airport help page has referred visitors to it; generative-AI guide and patrol robots for spoken conversation in the terminals were announced in May 2026. Neither was observed on the website.
- Integrated search with facility-level answers (section 13).
- No generative AI assistant was observed on the site.

## 11. Languages, mobile web, app

- Languages: English, Korean, Chinese and Japanese (separate sites).
- Mobile web: a separate mobile layout with no horizontal overflow on captured pages; flight cards label every field, strike through the scheduled time and show a status chip; a two-level menu with map, accessibility and login icons. Viewport fixed at 500 px with zoom disabled; 66 of 194 visible targets under 24 px on the homepage; a floating back-to-top button overlaps the cards; mobile homepage FCP 8.5 s in the capture.
- App: Incheon Airport+ (App Store id581487293; Google Play com.ubivelox.icairport; both linked in the footer). Search: indoor maps with indoor and outdoor navigation, My Flights push notifications, an "ICN Planner" for personalised planning, and membership benefits. No store rating was checked.

## 12. Performance evidence

Lab, single container, indicative only.

| Measure | Homepage desktop | Homepage mobile | Departures (desktop) |
|---|---|---|---|
| TTFB | 1,042 ms | 447 ms | 4,782 ms |
| First contentful paint | 5,228 ms | 8,536 ms | 10,972 ms |
| Load event | 12,398 ms | 12,091 ms | 16,376 ms |
| Requests / bytes (content-length) | 214 / 4.3 MB | 216 / 4.3 MB | 172 / 3.7 MB |

- Lighthouse (mobile emulation, median of 3): performance 27 (runs 7, 27, 27), accessibility 79, best practices 73, SEO 100; FCP 12.4 s, LCP 25.1 s, TBT 2,403 ms, CLS 0 (one run 0.4), Speed Index 23.5 s, 4.5 MB, 215 requests.
- The mobility-impaired services page transferred 9.4 MB by content-length.
- No `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` or Content-Security-Policy header on the HTML response checked.
- Reliability: all pages returned 200 in this assessment, and the flight and congestion endpoints (`getDepPasSchList.do`, `passengerNoticeApiData.do`) returned 200; an earlier probe in this project received HTTP 502 from the homepage.

## 13. Site search

URL: https://www.airport.kr/search/ap_en (form POST, opens in a new tab)

- "prayer room" returned 5 results with facets All, Menu, Web Pages, Bulletin Board, Attachment, Airport Facilities and Flights. The facility results gave hours (00:00 to 24:00), phone, location (for example "Near Gate 231 on 3F, Terminal 2", "West Transfer lounge on 4F, Terminal 1"), "View Location" and "Separate Prayer Rooms for Men and Women".
- Popular search terms are ranked with movement labels in Korean ("변동없음"), and "My Recent Search Terms" is kept. Results have no shareable URL because the form posts to a fixed address in a new tab.
- A flight-number query through site search was not completed.

## Scores table

Expert assessment, 1-5 with half points.

| Dimension | Weight | Score | Evidence level | Confidence |
|---|---|---|---|---|
| ui - UI aesthetics and brand | 10% | 3.5 | direct | high |
| ux - UX and task efficiency | 20% | 4.0 | direct | high |
| info - information depth and accuracy | 15% | 4.5 | direct | high |
| flight - live flight info and journey help | 15% | 4.5 | direct | high |
| mobile - mobile experience | 10% | 3.0 | direct + search | medium |
| nav - navigation, search, accessibility | 10% | 3.5 | direct | medium |
| ai - personalisation and AI | 10% | 3.0 | direct + search | medium |
| commerce - digital commerce | 5% | 3.0 | direct + search | medium |
| perf - performance, security, reliability | 5% | 2.5 | direct (lab) | medium |
| Weighted | 100% | 74.5% | | |

Evidence bullets per score are in `incheon.json`.

## Standout features MAHB must surpass

1. Flight detail with the shortest route from car park to gate, walking time after immigration, destination time and weather, and sharing to KakaoTalk, LINE or e-mail. https://www.airport.kr/ap_en/1396/subview.do
2. Expected Airport Congestion: hourly passenger forecasts per arrival hall and departure area for the next two days. https://www.airport.kr/ap_en/1410/subview.do
3. Real-time waiting times for every departure area with a four-level legend. https://www.airport.kr/ap_en/6654/subview.do
4. Flight search with a 20-day window, hour, destination, airline and flight-number filters, a "Last Updated" stamp and Excel download. https://www.airport.kr/ap_en/1396/subview.do
5. Integrated search that answers with facilities (hours, exact location, view on map) rather than pages. https://www.airport.kr/search/ap_en
6. Live car park availability by terminal and floor on the homepage. https://www.airport.kr/ap_en/index.do

## Weaknesses

1. Lab performance is the weakest in the set: Lighthouse 27, LCP 25.1 s, TBT 2.4 s, departures TTFB 4.8 s, more than 200 requests; no security headers.
2. English pages carry Korean strings (some only for screen readers), have no `h1`, disable zoom and fail nested-interactive and contrast checks; 66 of 194 mobile targets are under 24 px.
3. The homepage clock and the waiting-time stamp follow the visitor's device clock, not Korea time.
4. Codeshares appear as separate rows, lengthening the board; saved flights and alerts exist only in the app.
5. The map depends on a non-standard port; site search opens a new tab with no shareable URL; feedback requires login with Korean mobile verification; no chatbot on the English site.

## Ideas to outperform

1. Merge Incheon's route-to-gate detail with live queue times and walking times into one live "time to gate" figure per flight.
2. Turn congestion forecasts into advice ("arrive by 07:10 for a 09:00 departure from Terminal 2").
3. Group codeshares under the operating flight while keeping every number searchable.
4. Always show airport local time with its zone, and timestamp every live figure from the data source.
5. Offer web alerts by WhatsApp or push without an app or account.
6. Set a performance budget (LCP under 2.5 s on mid-range mobile) and serve security headers by default.

## Gaps

- The map engine, parking reservation, duty-free site and the transfer route guide's output were not observed.
- Only "Departure" and "Gate Closing" statuses were live during the captures.
- App features, AIRBOT and the generative-AI robots rest on search results only; app ratings were not checked.
- The waiting-time stamp's dependence on the device clock is inferred from one observation.
- Lighthouse and capture timings are lab values from one container.

## Sources

- Direct captures (JSON and screenshots): `docs/research/direct/raw/bench/incheon-*.json|jpg`
- Lighthouse summary: `docs/research/direct/lighthouse/incheon.json`
- Screenshots: `docs/research/screenshots/incheon-home-desktop.jpg`, `incheon-flightdetail-desktop.jpg`, `incheon-waittimes-desktop.jpg`, `incheon-flights-mobile.jpg`
- Pages: https://www.airport.kr/ap_en/index.do and the URLs cited in each section
- Search (app): https://apps.apple.com/app/id581487293
- Search (chatbot and AI): https://www.asiae.co.kr/en/article/2020060110170710090, https://airport.kr/ap_en/1550/subview.do, https://www.asiae.co.kr/en/article/2026051811105138352
- Search (2026 Skytrax results): https://www.frommers.com/tips/airfare/the-oscars-of-airports-were-handed-out-and-the-u-s-did-about-as-well-as-youd-expect/, https://skytraxratings.com/2026-world-airport-awards-are-announced

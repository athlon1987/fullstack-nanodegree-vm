# Benchmark: Hong Kong International Airport (HKIA)

- Key: `hkia`
- Host assessed: https://www.hongkongairport.com/en/
- Assessed: 2026-11-17 (captures taken 07:57-08:10 HKT)
- Assessment type: **expert assessment**. The scores below are an analyst's judgement supported by first-hand observation. They are not instrumented usability tests, not field performance data and not a formal WCAG audit.

Evidence tags: `[direct]` observed by me in this run with a headless Chromium browser (desktop 1440x900 and iPhone 14 emulation) or a plain HTTP request; `[search]` stated in a web search result obtained in this run (URL cited, page not opened); `[prior]` background knowledge not re-confirmed; `[limited]` judgement constrained by this container's network policy.

---

## Summary

HKIA runs a dense, task-first passenger site whose strength is operational data rather than visual polish. The flight board is the best part: nine fields per departure (time, airline with grouped codeshares, flight, destination, terminal, check-in aisle, transfer desk, gate, status), a visible "Last updated" timestamp with a manual refresh, keyword, date and two-hour time-band filters, and every aisle, transfer desk, gate, arrival hall and baggage belt is a deep link into the airport map. Flights can be bookmarked without an account and the bookmark icon sits in the header of every page. The single site search box is also the flight search: typing "CX 257" offers today's and tomorrow's flight as suggestions and opens a "Live updates" card. Around this sit comprehensive guides (step-by-step departures, arrivals and transfer), a special-needs guide organised by journey stage and by impairment, a deep parking section (availability, booking, online payment, valet, EV, automated car parks), a rewards programme, an e-shop and a services booking platform.

The weaknesses are equally clear: a 2017-era visual design, a homepage whose first mobile screen is used up by an app banner, a notice bar and a hero image, status values shown as plain black text with no colour or icon coding, no shareable flight URL, no web account or personalised dashboard (personal features live in the "My HKG" app), ARIA and landmark defects on every page tested, pinch-zoom disabled on mobile, and a poor mobile lab performance score. Weighted expert score: **77.0%**.

## Evidence access

- Direct browser access: yes. 15 pages captured with the capture tool, plus three Playwright interaction scripts (`direct/raw/bench/hkia-interact.js`, `hkia-interact2.js`, `hkia-chatprobe.js`).
- One page (https://www.hongkongairport.com/en/shop-dine/shopping/index.page) returned a Cloudflare "Just a moment..." challenge (HTTP 403) on first request. I did not try to defeat it; the sibling page https://www.hongkongairport.com/en/shop-dine/dining/ loaded normally a few minutes later, so shop and dine findings rest on the dining directory and the rewards page. The shop directory itself was not seen.
- Blocked by this container (not site defects): `www.googletagmanager.com` (analytics), `hkia-cdn.starbeacon.io` (the map page's data/SDK host, so the interactive map stayed on its loading spinner), `zcarp-blob.hkairport.com` (the live car park availability feed, so the availability table showed dashes and "data is currently unavailable"). The chatbot launcher is present but its window did not open here. The e-shop (hkairportshop.com), the booking platform (hkairportbooking.com) and the rewards site (hkairportrewards.com) are outside the hosts I could reach.
- Web search used for: app store rating, AI assistant procurement, Skytrax 2026 placing.

## 1. Homepage above the fold

Page: https://www.hongkongairport.com/en/ `[direct]`

- Desktop: orange "Important Notice" bar, blue utility bar (Passengers / About Us switch, weather 25°C, HKT clock, notice, social, language, text size, bookmarked flights), six-item primary nav, a full-width hero carousel (three slides, "WHERE AMAZING JOURNEYS BEGIN"), a dark "Flight information at a glance" panel with Arrivals and Departures links overlaid bottom right, a floating "Chat" button, and the site search box just touching the fold.
- Within five seconds on desktop a passenger can: open arrivals or departures (one click), start a search, read the weather and local time, open bookmarked flights, switch language or text size, open the chatbot.
- Mobile: the first viewport is, top to bottom, a "My HKG" smart app banner, the notice bar (the notice is dated 2026-03-30 and still pinned in November), the header (menu, notice, logo, bookmark, search), the hero image, and only at the very bottom edge the Arrivals / Departures tiles. Roughly 45% of the first screen is banner and notice. The task entry points exist but are pushed down.
- Below the fold: "To & from Airport" and "Parking" tiles, a Skytrax voting promo, Airport Services shortcuts (Airline Lounges, Wi-Fi, Baggage Storage, Special Needs Access, Lost & Found), "Discover HKIA" (Free Layover Tour, Crystal Elevator).

## 2. Navigation, utilities and footer

`[direct]` https://www.hongkongairport.com/en/

- Primary nav (6): Flights; Passenger Guide; Transport; Shop & Dine; Relax & Fun; Map. Each opens a mega menu with a promoted tile (for example Flights promotes the My HKG app, Passenger Guide promotes the booking platform).
- Flights: Arrivals, Departures, Airlines Information, "My HKG" Mobile App, Shenzhen Baoan International Airport Flight Schedule (external).
- Passenger Guide: Arrivals, Departures, Transfer / Transit, Airport Security, Airport Facilities & Services, Hotels & Business Services, Flight Token, Latest updates on COVID-19 (still in the menu in November 2026), Overseas Airports Information.
- Transport: To & From Airport, Parking, Chinese Mainland Connection, Useful Contacts.
- Shop & Dine: Highlights & Promotions, Shopping, Dining, HKairport Rewards, HKairportshop.com, Shopping Ambassador.
- Utilities: audience switch (Passengers / About Us), weather and clock, Important Notice, language (EN / 繁 / 简), text size (A / A+ / A++), "View Bookmarked Flights", search, chatbot launcher. No sign-in or account on the website.
- A left-edge floating tool strip appears once the page scrolls (flight info, to and from airport, contact, share, back to top).
- Footer: nine social channels (including WeChat, Weibo, Xiaohongshu), three link columns (Passengers, About Us, Contact Us), and legal links including Sitemap and an Accessibility Statement.

## 3. Flight information

Pages: https://www.hongkongairport.com/en/flights/departures/passenger.page and https://www.hongkongairport.com/en/flights/arrivals/passenger.page `[direct]`

- Location: primary nav "Flights", the homepage hero panel, the floating tool strip, and the site search.
- Inputs: one keyword box "Flight Number / Destination / Airline"; a date picker; a time filter in two-hour bands ("All", "00:00-01:59" ... "22:00-23:59"); Passenger / Cargo tabs; "Load Earlier Flights".
- Fields per departure: TIME, AIRLINE (logo, all codeshare partners grouped in one row), FLIGHT, DESTINATION, TERMINAL, CHECK-IN aisle, TRANSFER DESK, GATE, STATUS. Arrivals: TIME, AIRLINE, FLIGHT, ORIGIN, PARKING STAND, HALL, BELT, STATUS.
- Status vocabulary seen: departures "Boarding Soon", "Boarding", "Final Call", "Gate Closed", "Dep HH:MM", "Est at HH:MM", "-"; arrivals "Est at HH:MM", "Landed HH:MM", "At gate HH:MM", "-". Departures crossing midnight carry the date, for example "Dep 00:27 (17/11/2026)".
- Visual treatment: status is plain black text in the same weight as every other cell. No colour, pill or icon distinguishes "Final Call" from "Boarding Soon". This is the main design gap on an otherwise excellent board.
- Freshness: "Last updated on: 17 Nov 2026, 07:58 HKT" with a refresh icon above the table; the underlying feed (`/flightinfo-rest/rest/flights`) returns a `lastUpdatedTime`.
- Map integration: check-in aisle, transfer desk, gate, arrival hall and belt values link to the map with an anchor, for example `/en/map/index.page#gate_069`, `#checkIn_C`, `#transferDesk_W1`, `#baggage_15`.
- Bookmarking: each row has a "bookmark flight" control. Bookmarks are stored in a cookie (`HKIA.flight-bookmark`), need no account, and a counter appears on the header bookmark icon on every page. No email, SMS or web push alert was offered on the website; boarding alerts are an app feature (https://www.hongkongairport.com/en/flights/MyHKG-mobile-app/).
- Flight detail: there is no flight detail URL. Clicking a table row does nothing. A detail card appears through site search: "Live updates with CX 257" with date, departure time, terminal, check-in, transfer desk, gate, status, origin and destination, then airline phone number and a "Lounge Information" link. The URL stays `https://www.hongkongairport.com/en/#passengerDeparture`, so the card cannot be shared or bookmarked in the browser.
- Mobile: the table becomes one labelled card per flight (TIME, DESTINATION, TERMINAL, CHECK-IN, TRANSFER DESK, GATE, STATUS with map pins), no horizontal scroll. All 364 flights of the day are in one long page, each card about 200 px tall.
- Interactions from homepage to one flight's status: **3** by either route. Route A: click the search box, type "CX 257", pick the suggestion "CX 257 (Depart: 17 Nov 2026)". Route B: click "Departures", type in the filter box, press Enter.

## 4. Journey assistance and personalisation

- On the website, personalisation is limited to bookmarked flights and the remembered text size and notice state (cookies) `[direct]`.
- The guides are stage-based: https://www.hongkongairport.com/en/passenger-guide/departures/ , https://www.hongkongairport.com/en/passenger-guide/arrivals/ and https://www.hongkongairport.com/en/passenger-guide/transfer-transit/ use numbered steps `[direct]`.
- Flight Token (biometric single token from check-in to boarding) is explained as a five-step journey at https://www.hongkongairport.com/en/passenger-guide/flight-token.page `[direct]`.
- The "My HKG" app page lists real-time flight updates, boarding alerts for tracked flights, baggage arrival notice with MyTAG, indoor map directions, augmented reality wayfinding, car park booking, food ordering, baggage service booking and a chatbot (app version 2.2.1) `[direct, described by the site, not tested]`.
- A "One-stop Airport Services Booking Platform" (https://www.hkairportbooking.com/en/) is promoted for meet and assist, VIP lounge and baggage handling "all in one place" `[direct description; platform not visited]`.
- No journey planner, security wait time, walking time or "my flight" dashboard was found on the website.

## 5. Maps and wayfinding

Page: https://www.hongkongairport.com/en/map/ `[direct, limited]`

- An interactive canvas map with a search box ("Facilities/Shops/Restaurants/Entertainment"), a floor selector (default "Floor: L7") and a "Show:" category filter. Deep links from flight rows and facility pages land on a specific gate, aisle or belt.
- The map data host (`hkia-cdn.starbeacon.io`) is blocked in this container, so the map stayed on its spinner. I could not assess routing, walking times or accessible routes on the web map. Null judgement on those points.
- Static alternatives: "Parking & Transport Facilities Map" and "Transport to Downtown Leaflet" documents are linked from transport pages.
- Indoor directions and AR wayfinding are described as app features.

## 6. Ground transport and parking

Pages: https://www.hongkongairport.com/en/transport/to-from-airport/ and https://www.hongkongairport.com/en/transport/parking/space-availability.page `[direct]`

- To & From Airport: mode cards for Airport Express, Public Buses, Taxis, Transport for Special Needs, Residents' Coaches, plus "Traffic Conditions to and from Airport" and a link to the government HKeMobility planner. Fare data for Airport Express, taxi and bus is loaded as JSON on every page for the floating "To & from Airport" tool. There is no door-to-door comparison of time and cost across modes on the page itself.
- Chinese Mainland Connection is a first-level section (ferries, coaches, cross-boundary services).
- Parking has nine sub-pages: Space Availability, Parking Charges, Car Park Booking, Online Payment, Valet Parking, Electric Vehicle Service, HZMB HKP Car Parks, Automated Car Parks. The availability page is designed to show live spaces for Car Parks 1, 3 and 4 by hourly and long-term, plus taxi and goods-vehicle areas, with a "Last updated on" stamp. The feed host was blocked here, so I saw the structure but no numbers `[limited]`.
- Car park booking hands off to hkairportbooking.com and hzmbparking.com.hk.

## 7. Shopping, dining, e-commerce, services, loyalty

- Dining directory https://www.hongkongairport.com/en/shop-dine/dining/ : keyword filter, location filter, category filter; each outlet shows location in passenger terms ("Near Gate 10, Departures Level (L6)", "After Departures (South)") and opening hours with last-order times `[direct]`.
- HKairport Rewards https://www.hongkongairport.com/en/shop-dine/hkairport-rewards.page : points on spend at airport merchants, the online shop, food ordering and automated car parks; "HKIA Dollar" and coupon redemption; four ways to register spend including a membership QR code at checkout; managed in the My HKG app `[direct]`.
- HKairportShop.com (e-commerce) is in the primary menu and footer `[direct link; shop not visited]`.
- Shop directory page: not seen (Cloudflare challenge, see Evidence access).

## 8. Transit and connection guidance

Page: https://www.hongkongairport.com/en/passenger-guide/transfer-transit/ `[direct]`

- Two tabs: "With an Onward Flight Boarding Pass" and "Without an Onward Flight Boarding Pass", each a numbered step sequence with security rules for liquids, plus Related Services (airline lounges, pay-in lounges, shower facilities).
- The departures board gives the transfer desk for every flight and links it to the map.
- "Free Layover Tour" is promoted on the homepage: https://www.hongkongairport.com/en/free-layover-tour.page
- No minimum connection time tool or connection planner on the website.

## 9. Accessibility

Special assistance content: https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/special-needs-access `[direct]`

- States ACI Accessibility Enhancement Accreditation Level 3 since 2023 and membership of the Hidden Disabilities Sunflower programme from 1 September 2026.
- Content is filterable two ways: by journey stage (Arrivals, Departures, Transfer / Transit) and by need (Reduced Mobility, Visual Impairment, Hearing Impairment, Hidden Disabilities), with topics such as Courtesy Channel, Sensory Corner, Caring Corner, Accessible Changing Room. This two-axis structure is a model worth copying.
- "Transport for Special Needs" is a mode in its own right in the transport section.
- Accessibility statement: https://www.hongkongairport.com/en/accessibility-statement.page cites a Triple Gold Award in the Web Accessibility Recognition Scheme 2020, text alternatives, audio captcha, skip links, three font sizes, keyboard access.

Site accessibility, automated checks (axe-core, WCAG A/AA rules) `[direct]`:

| Page | Desktop violations (by impact) | Mobile violations (by impact) |
|---|---|---|
| Home | 8 rules, 15 nodes (4 critical, 3 serious, 1 moderate) | 8 rules, 12 nodes (4 critical, 3 serious, 1 moderate) |
| Departures | 5 rules (3 critical, 1 serious, 1 moderate) | 4 rules (2 critical, 1 serious, 1 moderate); `aria-required-children` on 186 nodes, `target-size` on 19 |
| Transport, parking, transfer, special needs, dining | 5-7 rules each (3 critical on every page) | 5-6 rules each |

- Recurring rules: `aria-required-children`, `aria-required-parent`, `aria-allowed-attr`, `aria-valid-attr-value` (critical), `aria-hidden-focus`, `aria-input-field-name`, `label-content-name-mismatch` (serious), `meta-viewport` (zoom disabled, moderate).
- Landmarks: 1 header, 2 nav, 1 footer, **no `main`**. One `h1` per page. Images missing alt: 0 of 19 on the homepage. Unlabelled inputs: the time-band `select` on the flight board has no label.
- Keyboard test, first 12 stops on the homepage: (1) Skip to Primary navigation, (2) Skip to Content, (3) Skip to Footer, (4) Close Important Notice, (5) the notice link, (6) logo, (7) Open Search bar, (8) View Bookmarked Flights, (9) Flights, (10) Arrivals, (11) Departures, (12) Airlines Information. Three skip links: yes. Visible focus: yes, a browser-default outline (`auto 5px`) on every stop. Order: logical. Two points: stops 4 and 5 had scrolled out of view when focused, and the language and text-size controls were not among the first 12 stops.
- An automated count is not a conformance verdict. The 2020 award and today's ARIA defects are both true; the site has drifted since it was certified.

## 10. AI assistant, chatbot and search

- A "Chat" launcher (`#aahk-chatbot-launcher`, label "Open chatbot") is fixed bottom-right on every page, desktop and mobile `[direct]`. Clicking it opened nothing in this container, so I could not see the conversation, the channels or the answer quality `[limited]`.
- The app page says the app's chatbot "answers enquiries related to flight information, airport facilities and shopping and dining offers through instant messages" `[direct]`.
- A tender for a "Generative AI Virtual Assistant at the Hong Kong International Airport" was awarded on 12 June 2025 according to the airport's tender notice https://www.hongkongairport.com/en/airport-authority/tender-notices/PRO_T292_25_NC_Award `[search]`. Whether the website chatbot is that system is not confirmed.
- Search is covered in section 13.

## 11. Languages, mobile web, app

- Languages: English, Traditional Chinese, Simplified Chinese `[direct]`.
- Mobile web: no horizontal overflow on any of the 13 pages captured. Menu opens to the six sections at 65 px row height. Flight table reflows to cards. Problems: zoom disabled in the viewport meta tag, small touch targets flagged on the flight list, a tall banner stack before content, sub-navigation as a horizontally scrolling strip with small arrows `[direct]`.
- App: "My HKG" (iOS and Android, also a direct Android download for devices without Google Play), promoted by a smart banner on every mobile page `[direct]`. App Store (Hong Kong) rating reported as 3.6 out of 5 from about 1.4K ratings: https://apps.apple.com/hk/app/id1488720261 `[search]`.

## 12. Performance evidence

All figures are **lab, single container, third-party hosts blocked, indicative only**.

- Capture timings, homepage: desktop TTFB 163 ms, DOMContentLoaded 0.68 s, first contentful paint 0.67 s, load 3.75 s, 57 requests, 1.88 MB. Mobile emulation: FCP 0.60 s, load 1.34 s `[direct]`.
- Inner pages: TTFB 1.1-1.7 s, FCP 1.6-2.6 s, load 2.9-5.9 s `[direct]`.
- Lighthouse (mobile emulation, simulated throttling, 3 valid runs, median): performance 28, accessibility 68, best practices 50, SEO 83; FCP 2.9 s, LCP 8.9 s, TBT 2,454 ms, CLS 0.184; 2.38 MB, 59 requests (`direct/lighthouse/hkia.json`).
- Security headers on the homepage: `strict-transport-security: max-age=31536000; includeSubDomains; preload`, `x-content-type-options: nosniff`, `x-frame-options: sameorigin`, `referrer-policy: no-referrer-when-downgrade`. No `content-security-policy` header was returned. Served through Cloudflare with a 5-minute public cache `[direct]`.
- Reliability: one transient Cloudflare challenge in about 30 page loads; everything else returned 200.

## 13. Site search

Tested from the homepage search box `[direct]`.

- "prayer room": 4 results. First is "Prayer Rooms, Airport Facilities & Services" (the right page), then the facilities index, then the app terms and conditions (noise), then Post Office. Results show title, a highlighted snippet and category tabs (ALL, Passenger Guide, Flight Detail). No location, opening hours or map link in the result itself.
- "parking": results across eight categories (The Airport, Careers, Passenger Guide, Media Centre, Transport, Flight Detail, Sustainability); first result is "Space Availability, Parking", which is the best answer.
- "CX 257": as-you-type suggestions "CX 257 (Depart: 17 Nov 2026)" and "CX 257 (Depart: 18 Nov 2026)", announced to screen readers ("2 results are available, use up and down arrow keys to navigate"). Selecting one opens the live flight card.
- "Tokyo": returns arriving and departing flight cards with hall and belt map links, plus airline information.
- Verdict: one box that handles content and flights well. Weak on ranking noise and on facility answers (no direct "nearest prayer room, Level 6, open 24 hours" answer).

## Scores table

Expert assessment, 1-5 scale with half points. Not an instrumented test.

| Dimension | Weight | Score | Evidence level | Confidence |
|---|---|---|---|---|
| ui: UI aesthetics and brand sophistication | 10% | 3.0 | direct | high |
| ux: UX and task completion efficiency | 20% | 4.0 | direct | medium |
| info: Information comprehensiveness and accuracy | 15% | 4.5 | direct | medium |
| flight: Live flight information and journey assistance | 15% | 4.5 | direct | high |
| mobile: Mobile experience | 10% | 3.5 | direct | medium |
| nav: Navigation, search and accessibility | 10% | 4.0 | direct | medium |
| ai: Personalisation and AI | 10% | 3.0 | direct + search | low |
| commerce: Digital commerce and ancillary revenue | 5% | 4.0 | direct (descriptions), flows not tested | medium |
| perf: Performance, security and reliability | 5% | 3.0 | direct (lab) | medium |

Weighted score: (3.0x10 + 4.0x20 + 4.5x15 + 4.5x15 + 3.5x10 + 4.0x10 + 3.0x10 + 4.0x5 + 3.0x5) / 5 = **77.0%**.

Evidence per score:

- **ui 3.0.** Coherent blue/teal system and consistent components across every page captured, but a condensed typeface, angled hero masks and a carousel date the design; status data has no visual hierarchy; the homepage hero carries a slogan rather than a task (https://www.hongkongairport.com/en/). Competent, not a reference.
- **ux 4.0.** Flights one click from home; search doubles as flight search; aisle, gate and belt link straight to the map; bookmarks persist with no login; breadcrumbs and local navigation on every page. Held back by the mobile banner stack, a stale pinned notice, rows that look clickable but are not, and no shareable flight view.
- **info 4.5.** Nine flight fields including transfer desk; arrivals with stand, hall and belt; nine parking sub-pages; transfer guide for both boarding-pass cases; special-needs content by stage and by impairment; dining with gate-relative locations and hours; mainland connections; overseas airport information. Deduction for stale items (COVID-19 page in the main menu, March notice).
- **flight 4.5.** See section 3. Timestamp, filters, codeshare grouping, map links, login-free bookmarks, flight suggestions in search. Not a 5 because status has no visual coding, there is no detail URL, no web alerts, and no wait-time or walking-time context.
- **mobile 3.5.** No overflow on 13 pages, good card reflow, large menu targets; against that zoom is disabled, touch targets are flagged, the first screen is mostly banners, and the mobile Lighthouse lab score is 28.
- **nav 4.0.** Six clear labels, three skip links, visible focus, text-size control, sitemap, accessibility statement, relevant search with categories. Against that: critical ARIA rule failures on every page, no `main` landmark.
- **ai 3.0.** Login-free bookmarks and remembered preferences on the web; a chatbot launcher on every page that I could not open; richer personal features (alerts, baggage notice, rewards, AR wayfinding) exist only in the app; generative AI assistant procurement is a search-level fact. Low confidence because the chatbot could not be exercised.
- **commerce 4.0.** Rewards programme with points, airport currency and coupons; e-shop; one-stop services booking platform; car park booking, online payment and automated car parks; food ordering in the app. Descriptions seen first-hand, transaction flows not tested.
- **perf 3.0.** Fast first paint on desktop in the lab and solid transport security headers; but mobile lab LCP 8.9 s, TBT 2.4 s, CLS 0.18, best-practices 50, no CSP header, and live widgets split across extra hosts.

## Standout features MAHB must surpass

1. **Flight board with operational depth and map deep links.** Check-in aisle, transfer desk, gate, stand, hall and belt per flight, each linked to its map location. https://www.hongkongairport.com/en/flights/departures/passenger.page
2. **Login-free flight bookmarking in the global header.** One tap to save, visible counter on every page. https://www.hongkongairport.com/en/flights/arrivals/passenger.page
3. **One search box for content and flights.** Flight-number suggestions for today and tomorrow, screen-reader announcements, a live flight card. https://www.hongkongairport.com/en/
4. **Special-needs guide on two axes** (journey stage and type of need), backed by ACI Level 3 and Sunflower membership. https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/special-needs-access
5. **Parking as a product family tied to loyalty.** Availability, booking, online payment, valet, EV, automated car parks, with reward points on parking spend. https://www.hongkongairport.com/en/transport/parking/space-availability.page and https://www.hongkongairport.com/en/shop-dine/hkairport-rewards.page

## Weaknesses

1. Status is undifferentiated black text; "Final Call" and "Gate Closed" do not stand out.
2. No flight detail URL: the live card cannot be shared, bookmarked in the browser or indexed.
3. Personal features (alerts, rewards, baggage notice, wayfinding) require the app; the website has no account, and the app is rated about 3.6 on the Hong Kong App Store `[search]`.
4. Accessibility drift: critical ARIA failures on every page, no `main` landmark, zoom disabled on mobile, despite a 2020 gold award.
5. Mobile first screen dominated by app banner, notice and hero; mobile lab performance 28; stale content in prominent places (COVID-19 menu item, a March notice pinned in November).

## Ideas to outperform

1. Give every flight a permanent, shareable page (`/flights/MH123/2026-11-17`) with status colour and icon coding, gate walking time, and "add to calendar / notify me" on the web through web push or WhatsApp, with no app required.
2. Keep HKIA's login-free bookmark, then turn it into a "My journey" strip on the homepage: saved flight, terminal, check-in counter, time to leave, transport options and parking availability for that flight.
3. Answer facility searches directly: "prayer room" should return the nearest rooms by terminal and level with hours and a map link, not only a page title.
4. Compare ground transport modes in one view (time, cost, first and last service, step-free) for KLIA Ekspres, bus, taxi, e-hailing and parking, and deep link into booking.
5. Ship accessibility as a maintained property: `main` landmark, zoom allowed, automated axe checks in the build, and a dated accessibility statement, so the claim and the code do not drift apart.
6. Treat mobile as the primary canvas: no stacked banners, flight search in the first 300 px, and a performance budget (mobile LCP under 2.5 s).

## Gaps

- Interactive map behaviour (routing, walking times, accessible routes) not assessed: map data host blocked.
- Live car park numbers not seen: feed host blocked.
- Chatbot conversation not assessed: window did not open in this container.
- Shop directory not seen: one Cloudflare challenge, not retried beyond the dining alternative.
- E-shop, booking platform and rewards site transaction flows not tested (outside reachable hosts).
- App features are as described by the airport, not tested.
- Skytrax 2026 placing for Hong Kong (reported 4th) comes from a single search source and is not used in scoring.

## Sources

Direct (this run):
- https://www.hongkongairport.com/en/
- https://www.hongkongairport.com/en/flights/departures/passenger.page
- https://www.hongkongairport.com/en/flights/arrivals/passenger.page
- https://www.hongkongairport.com/en/flights/MyHKG-mobile-app/
- https://www.hongkongairport.com/en/map/
- https://www.hongkongairport.com/en/transport/to-from-airport/
- https://www.hongkongairport.com/en/transport/parking/space-availability.page
- https://www.hongkongairport.com/en/transport/parking/car-park-booking.page
- https://www.hongkongairport.com/en/passenger-guide/transfer-transit/
- https://www.hongkongairport.com/en/passenger-guide/flight-token.page
- https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/special-needs-access
- https://www.hongkongairport.com/en/shop-dine/dining/
- https://www.hongkongairport.com/en/shop-dine/hkairport-rewards.page
- https://www.hongkongairport.com/en/accessibility-statement.page
- Raw captures: `docs/research/direct/raw/bench/hkia-*.json`, interaction results `hkia-interact.json`, `hkia-interact2.json`; Lighthouse summary `docs/research/direct/lighthouse/hkia.json`.

Search (not opened):
- https://apps.apple.com/hk/app/id1488720261 (app rating)
- https://www.hongkongairport.com/en/airport-authority/tender-notices/PRO_T292_25_NC_Award (generative AI virtual assistant tender)
- https://aerocorner.com/blog/best-airports-in-the-world-ranked/ (Skytrax 2026 placing, single source)

Screenshots: `docs/research/screenshots/hkia-home-desktop.jpg`, `hkia-home-mobile.jpg`, `hkia-departures-desktop.jpg`, `hkia-departures-mobile.jpg`, `hkia-search-desktop.jpg`.

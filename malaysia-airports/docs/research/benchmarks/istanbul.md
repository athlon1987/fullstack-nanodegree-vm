# Benchmark: iGA Istanbul Airport (istairport.com)

- Assessed: 2026-11-17 (captures and interaction scripts 10:57 to 11:06 UTC, about 14:00 Istanbul time; homepage and departures re-captured 14:51 to 14:53 UTC, about 17:50 Istanbul time)
- Assessment type: expert assessment, not an instrumented usability test. Scores are a reviewer's judgement against the 1-5 rubric, backed by the observations listed.
- Evidence level: direct (first-hand browser access to www.istairport.com/en), plus 4 web searches (one shared with the Incheon report).
- Weighted score: 76.5% (3.83 / 5)

## Summary

Istanbul's English site is a modern, image-led site run by the operator iGA, and it is the most operationally candid of the sites benchmarked so far: live waiting times for the terminal entrance checkpoint, passport control and domestic security (with the busiest entrance named) sit on the homepage and on every flight page. The flight module is quick: typing a flight number into the homepage field shows the matching row inline, with status, check-in counters and gate, in two interactions. Each flight has a detail page that offers flight updates through WhatsApp without an app or an account, followed by a step-by-step journey directory that can be tailored to accessibility, family, age-friendly, sensory and visual-description needs. Shop and restaurant finders carry dietary filters, and 41 dated offers are listed. Weak points: the homepage gives more space to selling premium services (lounge, buggy, iGA Pass) than to passenger tasks, the board shows no "last updated" time and handles codeshares inconsistently, technical accessibility is poor (no skip link, no detectable focus indicator, zoom disabled, critical ARIA errors), nine third-party marketing and analytics hosts load on every page, and both the map and the chatbot depend on third-party hosts that were not reachable here.

## Evidence access

- Direct: 5 pages captured with the capture tool on desktop (1440x900) and mobile (iPhone 14), the homepage and departures twice; 8 further pages read with Playwright; 4 interaction scripts (security headers and keyboard order, homepage flight lookup, departures board filters and search, site search, mobile menu, car park tabs, flight-detail alert opt-in). All responses were HTTP 200; no bot challenge.
- Blocked by this container's network policy (not site defects): `webnav.poilabs.com` and `maps.istairport.com` (airport map and car park map iframes), `igachatbot.etiya.com` (chat widget), `api.igairport.aero` (airline logos on the flight board), `serve.motaword.com` (a third-party script; purpose not verified), and marketing or analytics hosts (`www.googletagmanager.com`, `connect.facebook.net`, `analytics.tiktok.com`, `cdn.taboola.com`, `cdn.cerezgo.com`, `execution-ci360.igapass.com`). The map, the chatbot and airline logos could not be assessed; broken logo images in the screenshots are an artefact of this environment.
- External sites not opened: igapass.com (iGA Pass checkout), istanbulairport360.com (virtual tour), hava.ist, the WhatsApp hand-off.
- Lighthouse: read from `direct/lighthouse/istanbul.json` (run by another process).

## 1. Homepage above the fold

URL: https://www.istairport.com/en

- Desktop: a pale blue page with a menu button, logo, external utilities "iGA" (operator site), "iGA PASS" and "JETEX iGA" (private terminal), a red-dot "Live" link to the airport live stream, search and a language selector. Left, the only `h1`: "Welcome to iGA Istanbul Airport" and "5-star journeys start here."; right, Departure / Arrival tabs over a single "Search for Flight Number / City" field. The lower half of the first screen is taken by "Explore iGA Pass Services" and "Choose the Premium Service That Suits You".
- Mobile: menu, logo and search icon; the welcome text, Departure / Arrival tabs and the flight field all sit in the first screen.
- Within five seconds a passenger can start a flight lookup, search the site, switch language or open the menu. One scroll reveals a purchase widget (iGA Lounge, iGA Buggy, iGA Pass Daily, iGA Pass Daily Domestic; Domestic or International; adults and children; Buy), a carousel of awards and services shown twice in the DOM, twelve service tiles (JETEX-iGA, iGA Pass, Accommodation, Mobile Application, Transportation, Parking and Valet, Food, Shopping, Lost and Found, Wi-Fi, iGA Cares, Tax Refund), Live Waiting Times, announcements and a blog teaser.

## 2. Navigation, utilities, footer

- Primary nav (a mega menu behind the menu button on desktop and mobile; 95 links): FLIGHTS, SERVICES, AIRPORT, COMMERCIAL, CORPORATE, plus Discounts & Offers. Passenger content and business content share one menu: COMMERCIAL covers aviation, cargo, office and retail space, terminal allocation and advertising; CORPORATE covers About Us, brand strategy, policies, charges tariff, VDGS procedures, airport plan, a NOTAM link (to the US FAA search), sustainability and a Green Library. Press releases and certificates link out to igairport.aero.
- Utilities: the three external brand links, Live, search and language. No account or login on the website. Accessibility (iGA Cares) is in the menu, the footer and a homepage tile, not in the header.
- Footer: a sitemap (Flights, Airport Guide, Services, Airport, Blog), 24/7 call centre (444 1 442), WhatsApp Support Line, e-mail, social links (including NSosyal, Weibo and WeChat), an app block, award badges linking to announcements, FAQ, Feedback Form, Customer Satisfaction Survey, Contact and Cookie Preferences.
- Landmarks: `header`, `main` and `footer`, but no `nav` landmark; one `h1`; breadcrumbs on the flight detail page.

## 3. Flight information

URLs: https://www.istairport.com/en/flights/flight-info/departure-flights, https://www.istairport.com/en/flights/flight-info/arriving-flights, detail e.g. https://www.istairport.com/en/flights/flight-info/departure-flights/flight-detail?flight=TK2326&flighttype=1&flightlocationtype=0&id=3914078&date=17.11.2026

- Where: the homepage field and the Departure and Arrival pages. Typing "TK2154" into the homepage field showed the matching row inline (time, flight numbers, destination, counters D-E, gate G10B, "Gate Closed") without leaving the page; pressing Enter did nothing further.
- Board controls: Departure / Arrival tabs, Domestic / International, a "Refresh" button, Yesterday / Today / Tomorrow, "Show Previous Flights" (the list opens at the current time), and a search field that filters by flight number or city ("London" returned Heathrow, Stansted and Gatwick departures). No airline or status filter.
- Columns: Date, Planned / Estimated, Airline (logo), Flight Number, destination, Check-in Counter, Gate, Current Status, and an arrow to the detail page.
- Status vocabulary observed (13:45 to 18:40 local time): "Proceed to Gate", "Boarding", "Last Call", "Gate Closed", "Cancelled"; delays appear as a second, estimated time. "Gate Closed" and "Cancelled" are in red text.
- Codeshares: on desktop the flight-number cell rotates through the codes one at a time (an Ankara departure displayed "JU8180" while its DOM held TP8842, TK2170, AH3956, B66938, JU8180 and NZ4888); on mobile all codes are stacked. The detail page headed "TK2326" shows "Flight Number XY7086", a partner code.
- Freshness: no "last updated" time on the board; a "LIVE" label on the detail page. Automatic refresh was not tested.
- Detail page: the flight card (date, planned and estimated time "2:00 PM / 2:10 PM", counter, gate with a map pin, airline, status), a "Get updates for this flight" toggle that opens "Activate flight updates for TK2326. Stay up to date on your flight status through push notifications." with a WhatsApp button (the hand-off was not completed), then the journey directory described in section 4.
- Interactions from homepage to one flight's status: 2 (focus the field, type the number); one more click opens the detail page.

## 4. Journey assistance and personalisation

- Journey directory on every flight detail page: Get Ready For Your Flight, Transport to Airport, At the Airport - Entrance to the Terminal (with live waiting times), Check-in and Baggage drop, Security Checkpoint, Discover Istanbul Airport, Boarding, Have a Pleasant Flight. Selectable needs: All, Accessibility, Families with Children, Age Friendly, Stimuli ("sound, light, etc. in the terminal"), Description (for visually impaired passengers) and iGA Pass; matching modules are marked "Customized Content". Module headings include Induction Loop Device, Floor Information Board in Braille, Sign Language Virtual Call Center, Very Special Guest Room, Adult Changing Facility, Charging Station for Electric Wheelchairs, Buggy Service, Sensory Stimulation, Fast Track, Self Check-in, repack area and Sunflower Lanyard. Whether ticking a need hides or reorders modules was not verified (the alert dialog blocked the click).
- Live Waiting Times (API `/umbraco/api/Checkpoint/GetWaitingTimes`): Terminal Entrance Checkpoint, Passport Control Waiting Point and Domestic Control Waiting Point, each with the busiest entrance and minutes (for example 1, 7 and 2 minutes at 17:51 local time), on the homepage, flight pages and flight detail.
- Audience guides: Passenger, Arrival, Departing and Transfer guides; Child and Family Friendly, Age Friendly and Pet Friendly airport pages; Business Travel Services.
- Alerts without an account through WhatsApp (above). No website login.
- Copy slip on the detail page: "Description: Detailed recipes for the visually impaired."

## 5. Maps and wayfinding

URLs: https://www.istairport.com/en/airport/maps/airport-map, https://www.istairport.com/en/airport/maps/airport-live-stream/operation-center

- The Airport Map page embeds a third-party map (`webnav.poilabs.com`), blocked here: the page showed only a "Maps" heading and the footer. Search, routing and walking times could not be assessed.
- Related: "Explore the Airport 360" (external virtual tour), "Airport Live Stream" and "iGA Spotter" pages, and a car park map iframe (`maps.istairport.com`, blocked).
- Listings describe locations in words ("Close to F Pier", "G4 Gate", "Domestic Airside", "Departures Floor Landside"); the gate on the flight detail carries a map-pin link (not followed).

## 6. Ground transport and parking

URLs: https://www.istairport.com/en/airport/airport-transportation, https://www.istairport.com/en/airport/airport-transportation/airport-carpark

- Transport hub: Urban and Intercity, Public Transportation (Havaist airport buses, IETT city buses, Metro) and Other. For Havaist: boarding point (Transportation floor -2) and drop-off point (Departures entrance gates 1-4) with map links, a timetable selector of about 50 stops, and accessible Havaist midibuses for wheelchair users. External links to hava.ist, iett.istanbul and TCDD rail; a separate Istanbul Traffic Information page and Car Rental.
- Parking: tabs Parking Fee Calculator, Where is my car?, Car Park Availability, Carpark Map and Valet; text covers subscriptions for stays over 7 and 15 days, daily rates since 01.01.2024, valet at the CIP entrance, HGS toll-tag payment at exit barriers, a "Find My Car" app and a vehicle guidance system. The calculator and availability widgets did not render inputs in this session, so they were not assessed.

## 7. Shopping, dining, e-commerce, loyalty

URLs: https://www.istairport.com/en/services/food-beverage/restaurants-cafes, https://www.istairport.com/en/services/shopping/stores, https://www.istairport.com/en/services/discounts-offers, https://www.istairport.com/en/services/discover/iga-pass-experiences

- Restaurants & Cafes: 114 results; filters by category (Grab & Go, Fast Food, Casual Dining, Fast Casual, Coffee, Bar), by product (Kids Menu, Vegan, Gluten Free, Diabetic, Vegetarian, Lactose Free) and by zone (International Airside, Domestic Airside, Landside); cards show "Open", category, location and tags.
- Stores: 165 results in 15 categories (including Unifree Duty Free), with the same zone filters.
- Discounts & Offers: 41 offers with brand, discount, details and start and end dates (for example "Up to 40% discount on selected products", 10 October to 31 December 2026), plus café set-menu prices in Turkish lira.
- iGA Pass: the homepage purchase widget and an iGA Pass page (Lounge, Buggy, Meet & Greet, Fast Track, Valet) linking to igapass.com for purchase (not opened). Hotels (Istanbul Airport Hotel, Hilton, a Yotel booking teaser) and the JETEX private terminal are promoted.
- Loyalty: none on the website. Search: the app listing describes a "MyIST Loyalty Program" for app members, and iGA PASS membership privileges (private assistant, Fast Track, lounge, buggy).

## 8. Transit and connections

URL: https://www.istairport.com/en/flights/airport-guides/transfer-passenger-guide

- Four transfer types (Domestic to International, International to International, International to Domestic, Domestic to Domestic), each a numbered sequence (for example: Are you ready to enjoy your journey?, Where can I get information from?, Flight Arrivals Gate, Domestic Transfer Point, Flight Departures Gate, Pre-Flight Checklist) with a document checklist (ticket, passport, visa, insurance, travel permit) and the same need-based customisation as the flight detail.
- Advice for unconnected bookings (collect baggage and check in again). No connection-time calculator or flight-based transfer route.

## 9. Accessibility

Content (https://www.istairport.com/en/flights/airport-guides/iga-cares-accessibility): the iGA Cares programme with a statement of co-design with disability organisations, documents and awards, accessible transport and digital information sections, videos (accessible airport tour, "Istanbul Airport My Route", Sunflower Lanyard), a Travel Volunteers Community with an application form, newsletters, and 14 complimentary services: Assistance Service, Accessible Transportation, Tactile Paving, iGA Cares Silent Room, Information Points, Sunflower Lanyard, Accessible Toilets, Sign Language, My Route and Accessible Route, Baggage Waiting Area, Traveling with Pets, Wheelchair Charging Station, Café Yanımda and Therapy Dogs, plus an iGA Cares Dining Cabin.

Site accessibility (axe-core WCAG A/AA, automated only):

| Page | Desktop | Mobile |
|---|---|---|
| Homepage | 8 rules / 31 nodes: critical 4, serious 3, moderate 1 | 5 rules / 17 nodes: critical 2, serious 2, moderate 1 |
| Departures | 3 rules / 12 nodes: serious 2, moderate 1 | 3 rules / 40 nodes: serious 2, moderate 1 |
| Flight detail | 3 rules / 5 nodes: serious 2, moderate 1 | 4 rules / 4 nodes: serious 3, moderate 1 |
| iGA Cares | 2 rules / 2 nodes: serious 1, moderate 1 | 3 rules / 3 nodes: serious 2, moderate 1 |

- Rules: `aria-required-children` and `aria-required-parent` (critical), `image-alt` and `label` (critical, homepage desktop), `color-contrast` (up to 30 nodes on the mobile departures page), `listitem`, `link-name`, `target-size` (6 nodes), and `meta-viewport` on every page (`maximum-scale=1.0, user-scalable=no` disables zoom).
- Inputs: the flight and site search fields rely on placeholders; neither has a label by the capture's test.
- Images without alt: 4 of 73 (desktop homepage).
- Keyboard, first 14 stops on the homepage: an unnamed link, iGA, iGA PASS, JETEX iGA, Live, English, FLIGHTS, SERVICES, AIRPORT, COMMERCIAL, CORPORATE, Arriving Flights, Departure Flights, Airline Companies. No skip link. On all 14 stops the computed `outline-style` was `none` and there was no box-shadow, so no focus indicator was detected (colour or underline changes were not measured).
- Lighthouse accessibility 78; failed audits include `heading-order` besides those above.

## 10. AI assistant, chatbot, search

- A chat widget script from `igachatbot.etiya.com` loads on every page; it was blocked here, so the widget was not rendered or tested.
- Contact: 24/7 call centre, a WhatsApp Support Line, e-mail, a feedback form and a satisfaction survey; flight updates by WhatsApp from the detail page.
- Search (operator and trade sources): a chatbot "available via the mobile app, web, social media and WhatsApp" (ACI blog), a bilingual virtual assistant said to answer over 1,000 questions (vendor case study), and an augmented-reality assistant "CIGA" in the app. These are claims, not observed here.
- No generative AI assistant was observed on the site.

## 11. Languages, mobile web, app

- Languages: Turkish, English, Chinese, Russian, Arabic, German, French and Spanish (8), switched with a `?locale=` parameter on the same paths. The Chinese option is labelled "中国人 / ZH", which reads as "Chinese person" rather than the language name.
- Mobile web: no horizontal overflow on the homepage or departures at 390 px, but overflow on the flight detail, map and iGA Cares pages; 15 of 58 visible targets under 24 px on the homepage; zoom disabled. Flight cards stack every codeshare with the status in red, though a large floating back-to-top button covers part of the list.
- App: "Istanbul Airport" by IGA (App Store id1440706986), promoted in the footer. Search: flight tracking by scanning a boarding pass or searching, flight notifications, "Home to Airport" travel times, a map, iGA Pass by QR code and the MyIST loyalty programme. No store rating was found.

## 12. Performance evidence

Lab, single container, third-party hosts blocked, indicative only.

| Measure | Homepage desktop | Homepage mobile | Departures (desktop) |
|---|---|---|---|
| TTFB | 1,428 ms | 261 ms | 953 ms |
| First contentful paint | 4,908 ms | 2,140 ms | 3,828 ms |
| Load event | 8,605 ms | 8,043 ms | 5,848 ms |
| Requests / bytes (content-length) | 99 / 3.7 MB | 98 / 3.7 MB | 68 / 1.6 MB |

- Lighthouse (mobile emulation, median of 3): performance 53 (runs 51, 53, 53), accessibility 78, best practices 92, SEO 92; FCP 7.8 s, LCP 16.7 s, TBT 163 ms, CLS 0, Speed Index 13.1 s, 5.9 MB, 100 requests.
- Security headers on the HTML response: `Strict-Transport-Security` (one year, include subdomains), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`; no Content-Security-Policy observed.
- Third parties: nine tag hosts on every page (analytics, advertising pixels, a marketing-execution script, the chat widget and others).
- Reliability: all pages returned 200; the flight board API (`/umbraco/api/FlightInfo/GetFlightStatusBoard`), waiting-times API and weather API returned 200. The paths indicate the Umbraco CMS.

## 13. Site search

URL: https://www.istairport.com/en/search?searchKey=prayer%20room

- The header search icon opens a field; results get their own URL. "prayer room" returned 5 results with facets All (5), Announcement (1), Experience (1), Other (3): four entries titled "Prayer Rooms" and one unrelated announcement (a container city built by iGA in Hatay). Results carried titles and "Details" links, no location or opening hours.
- Flights are found through the flight field, not the site search (site search for flight numbers not tested).

## Scores table

Expert assessment, 1-5 with half points.

| Dimension | Weight | Score | Evidence level | Confidence |
|---|---|---|---|---|
| ui - UI aesthetics and brand | 10% | 3.5 | direct | high |
| ux - UX and task efficiency | 20% | 4.0 | direct | high |
| info - information depth and accuracy | 15% | 4.0 | direct | high |
| flight - live flight info and journey help | 15% | 4.5 | direct | high |
| mobile - mobile experience | 10% | 3.5 | direct + search | medium |
| nav - navigation, search, accessibility | 10% | 3.0 | direct | medium |
| ai - personalisation and AI | 10% | 4.0 | direct + search | medium |
| commerce - digital commerce | 5% | 4.0 | direct + search | medium |
| perf - performance, security, reliability | 5% | 3.0 | direct (lab) | medium |
| Weighted | 100% | 76.5% | | |

Evidence bullets per score are in `istanbul.json`.

## Standout features MAHB must surpass

1. Flight updates by WhatsApp from any flight's detail page, with no app install and no account. https://www.istairport.com/en/flights/flight-info/departure-flights/flight-detail?flight=TK2326&flighttype=1&flightlocationtype=0&id=3914078&date=17.11.2026
2. Live waiting times for the terminal entrance checkpoint, passport control and domestic security, naming the busiest entrance, on the homepage and every flight page. https://www.istairport.com/en#waitingpoints
3. A journey directory on each flight that can be tailored to accessibility, family, age-friendly, sensory and visual-description needs. https://www.istairport.com/en/flights/airport-guides/transfer-passenger-guide
4. Inline flight lookup on the homepage: status, counters and gate in two interactions. https://www.istairport.com/en
5. Restaurant and shop finders with vegan, gluten-free, diabetic, lactose-free and kids-menu filters and airside or landside zones, plus 41 dated offers. https://www.istairport.com/en/services/food-beverage/restaurants-cafes

## Weaknesses

1. The homepage gives more of the first two screens to selling premium services and award announcements than to passenger tasks.
2. Technical accessibility: no skip link, no detectable focus indicator, zoom disabled, critical ARIA and label errors, and no accessibility link in the header.
3. The flight board shows no "last updated" time, rotates codeshare numbers in one cell, and the detail page can headline one code and list another.
4. Nine third-party marketing and analytics hosts on every page; lab LCP 16.7 s on throttled mobile; no Content-Security-Policy.
5. Map and chatbot depend on third-party hosts and leave an empty page or no widget when those are unreachable; localisation slips ("recipes" for descriptions, "中国人" for Chinese).

## Ideas to outperform

1. Pair WhatsApp opt-in with a live journey: each alert should carry the next step, the gate's walking time and the current queue time at the relevant checkpoint.
2. Show checkpoint queues with a trend and a short forecast, not only the current minutes.
3. Remember a passenger's chosen needs (accessibility, family, sensory) on the device and apply them across the site without login.
4. Keep the flight and live-status modules ahead of commercial modules; offer services in context (for example a lounge offer when a flight is delayed).
5. Make accessibility a default: skip link, visible focus, zoom allowed, labelled fields, one landmark per region.
6. Keep the map first-party with a text list fallback.

## Gaps

- The map (poilabs), car park map, chatbot (Etiya), airline logos and one third-party script (MotaWord) were not observable.
- The WhatsApp hand-off was not completed, and the effect of the need filters on the detail page was not verified.
- Automatic refresh of the board was not tested; delayed and diverted states were not seen as labels.
- App features, the MyIST programme and the virtual assistant rest on search results only; no store rating was found.
- 2026 Skytrax ranking not confirmed: one secondary source reports eighth place (https://www.listmag.com/en/travel-and-stay/guide/skytrax-world-best-airports) and Time Out lists Istanbul among four European airports in the world ranking; no Skytrax or iGA release was found. The site's own announcements claim a Skytrax 5-star rating and Condé Nast Traveler "World's Best" titles (not independently checked).
- Lighthouse and capture timings are lab values from one container with analytics blocked.

## Sources

- Direct captures (JSON and screenshots): `docs/research/direct/raw/bench/istanbul-*.json|jpg`
- Lighthouse summary: `docs/research/direct/lighthouse/istanbul.json`
- Screenshots: `docs/research/screenshots/istanbul-home-desktop.jpg`, `istanbul-flightdetail-desktop.jpg`, `istanbul-alerts-desktop.jpg`, `istanbul-flights-mobile.jpg`
- Pages: https://www.istairport.com/en and the URLs cited in each section
- Search (app): https://apps.apple.com/app/id1440706986, https://www.istairport.com/en/announcements/introducing-the-istanbul-airport-mobile-application
- Search (chatbot, assistant, loyalty): https://blog.aci.aero/airport-it/istanbul-airport-digital-services-passenger-experience/, https://www.sestek.com/istanbul-grand-airport-enhances-visitor-experience-with-virtual-assistant, https://www.igairport.aero/en/media-center/press-releases/iga-launches-their-special-passenger-program
- Search (2026 awards): https://www.listmag.com/en/travel-and-stay/guide/skytrax-world-best-airports, https://www.timeout.com/news/world-airport-awards-these-are-officially-europes-best-airports-in-2026-032026

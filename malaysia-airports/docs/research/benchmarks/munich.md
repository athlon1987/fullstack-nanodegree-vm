# Benchmark: Munich Airport (www.munich-airport.com)

- Assessed: 2026-11-17 (captures taken 2026-11-16 23:52 to 2026-11-17 00:20 UTC, about 01:00 local time in Munich)
- Assessment type: expert assessment, not an instrumented usability test. Scores are a reviewer's judgement against the 1-5 rubric, backed by the observations listed.
- Evidence level: direct (first-hand browser access to www.munich-airport.com), plus 1 web search.
- Weighted score: 66.5% (3.33 / 5)

## Summary

Munich's English passenger site is a calm, well-organised content site with a distinctive brand ("M" mark, navy and lavender) and an unusually useful flight module: a search form that returns results inline on the homepage, a detail page with gate, check-in area, weather and aircraft facts, and a "Track flight" toggle that pins a flight to a strip under the header on every page without any login. Content depth is strong (accessible travel, connections, public transport, services A-Z). The weak points are technical accessibility (10 to 13 axe rule violations per page, Lighthouse accessibility 47, no visible skip link, pinch-zoom disabled), a status vocabulary rendered as plain lower-case text with no colour, a hero carousel that fills the first screen on mobile, a map that only loads after cookie consent from a second domain, and commerce that stops at parking booking and offline-arranged services.

## Evidence access

- Direct: 9 pages captured with the capture tool on desktop (1440x900) and mobile (iPhone 14), 13 further pages read with Playwright, 4 interaction scripts (keyboard, flight search, site search, tracking, mobile menu). All responses were HTTP 200; no bot challenge.
- Blocked by this container's network policy (not site defects): `code.etracker.com` (analytics), `cdn.eye-able.com` (the "Visual help" assistive toolbar), `www.munich-airport.de` (German site and the host of the embedded digital map), `parken.munich-airport.de` (parking booking engine). Judgements on the map, the Visual help tool, the chatbot widget and the parking checkout are limited accordingly.
- Timing caveat: observations were made around 01:00 local time, so only two flight statuses ("planned", "departed") were live. The full status vocabulary was not observed.
- Lighthouse: read from `direct/lighthouse/munich.json` (run by another process).

## 1. Homepage above the fold

URL: https://www.munich-airport.com/

- Desktop: header (audience switch Passengers & Visitors / Company & Business / Careers, Language, Visual help, search field), four-item primary nav, a full-width photo carousel ("Hello at Munich Airport - Experience the magic of Christmas at the airport"), and the top of a six-icon quick-link band: Departure, Arrival, Parking, Pick-up and drop-off, Experience, Accessible travel.
- Mobile: logo, an always-visible search field, hamburger; the carousel then fills the screen, and the quick-link band shows two icons at a time (Departure, Arrival) in a swipe carousel with dots.
- Within five seconds a passenger can: start a site search, open Departures or Arrivals, or open the menu. The actual flight search form, the parking booking form and "Your way to the airport" sit two to three screens down.
- The homepage has no `h1`; the carousel repeats the same `h2` four times in the DOM.

## 2. Navigation, utilities, footer

- Primary nav: Flights, Transport & Directions, Parking, At the airport. Hovering opens a second row (for "At the airport": Airport map, Shops, Restaurants, Facilities & Services, Experience the airport).
- Utilities: audience switch, Language (one option: German, which leaves for www.munich-airport.de), Visual help (Eye-Able toolbar, blocked here), search with typeahead.
- Footer: Accessible travel, Airport maps, Careers, Facilities & services, FAQs, Important telephone numbers, Newsroom, Media Center, Contact, plus Legal notice, Terms & conditions, Privacy policy, Compliance, Accessibility declaration.
- Breadcrumbs on every inner page. No account or login anywhere on the passenger site.

## 3. Flight information

URLs: https://www.munich-airport.com/flights-240142, https://www.munich-airport.com/all-departures-1450598, https://www.munich-airport.com/all-arrivals-1450715, detail e.g. https://www.munich-airport.com/flight-details-75388?flight_id=10323897.0

- Where: a "Flights" module on the homepage (below the fold), the Flights hub, and dedicated all-arrivals / all-departures pages. Tabs: ARRIVALS, DEPARTURES, FLIGHT PLAN (labelled FLIGHT SEARCH on the hub).
- Inputs: date picker, time range, direction check boxes (from / to Munich), "Connections to/from" (airport autocomplete), Airline (autocomplete), Flight number (autocomplete). Data is offered for "the next four weeks".
- Fields per flight: airline logo, destination or origin with IATA code, flight number with aircraft type (e.g. "LH 2000 (A21N)"), status, scheduled | expected time at MUC, time at the other airport, area (T2, T1A, T1D ...), Track flight toggle.
- Status vocabulary observed: "planned" (112 rows) and "departed" (16 rows) on departures; same two on arrivals. Rendered as plain black lower-case text, no colour, icon or pill. Other statuses were not live at the time of capture.
- Freshness: a refresh button reading "Just updated - Last update 0 min. ago"; "Previous" / "Later" paging; Print; disclaimer "All flight information is subject to change".
- Detail page: airline and flight number as title, departure and arrival cards with date, status, airport, weather icon and temperature at both ends, terminal and gate ("T2 - Gate G38"), scheduled and expected times, "All data in local time", Track flight toggle, the airline's check-in area ("terminal 2 E03, E04"), airline phone and website, and aircraft facts (IATA/ICAO type, length, wing span, engines, maximum take-off weight).
- Bookmarking: switching "Track flight" to ON stores the flight in the browser (`localStorage` key `FlightTracker`) and shows a tracker strip under the header on every page, including the homepage (observed: "LH 773 - departed - Bangkok - Arrival in 04:17"). No login, no e-mail or push alerts.
- Interactions from homepage to one flight's status: 2 (type the flight number, press SEARCH) after scrolling to the module; the result row appears inline on the homepage with status, times and area. One more click opens the detail page with the gate.

## 4. Journey assistance and personalisation

- The flight tracker strip is the only personalisation. No account, no saved trips, no "my journey" timeline.
- Journey guidance is editorial: Departure, Arrival, Transit and Pick-up hubs under Flights; "Well prepared for your journey" teasers (security and passport control, offers).
- No live security waiting times were found on https://www.munich-airport.com/security-screening-and-passport-control-3949908 (the page describes checkpoints, the accessible checkpoint in Terminal 2 and digital lane displays on site).

## 5. Maps and wayfinding

URL: https://www.munich-airport.com/airport-map-261352

- The page embeds an interactive "digital map" as an iframe that is only loaded after consent (`class="cmplazyload"`, source `https://www.munich-airport.de/apple_maps/index.html?lang=en`). In this session the area stayed blank: no consent dialog was rendered and the host is outside the allowed list. Search, routing, walking times and accessible routes could not be assessed.
- Around it: a legend image (PNG) and an FAQ entry "What is hall F and where can I find it?".
- Shops, restaurants and services lists carry location filters (public / secure area), which partly substitutes for map search.

## 6. Ground transport and parking

URLs: https://www.munich-airport.com/transport-directions-260334, https://www.munich-airport.com/public-transport-260822, https://www.munich-airport.com/parking-260363

- Transport hub: dated disruption notices at the top (A99 closure 20 to 23 November 2026; terminal road works to October 2027), then mode tiles: By car, Public transport, Rental cars, Taxi, Car sharing, Transportation service (ride apps), Transfer services.
- Public transport: S1/S8 intervals and journey time (about 40 minutes to the main station), Lufthansa Express Bus, regional rail and coach links. Planning is handed off to external tools (MVV journey planner, S-Bahn operating situation). No on-site door-to-door planner and no mode comparison by time and price.
- Parking: date/time booking widget on the homepage and parking page ("Online bookings starting at EUR 19.00", free cancellation until entry, discount code for the new P8 garage), product tiles (Economy, Terminal, Premium, EV charging, Valet, Discounts, Special options), "Manage my booking", parking FAQ and contact form. Booking continues on parken.munich-airport.de (not reachable here). No live space availability was shown on the site.

## 7. Shopping, dining, services, loyalty

URLs: https://www.munich-airport.com/shops-261891, https://www.munich-airport.com/restaurants-261920, https://www.munich-airport.com/facilities-services-261950, https://www.munich-airport.com/miles-more-25406351, https://www.munich-airport.com/home-delivery-5231263

- Directories: "more than 150" shops and service facilities, "about 60" restaurants, services A-Z; filters for Category, Location, A-Z and Tags.
- Offers band on the homepage: parking discount, new openings, Miles & More, MyDutyFree offers, Home Delivery.
- Loyalty: Miles & More earn and redeem in participating shops (promotion: 5 miles per euro until 31 December 2026). The airport has no programme of its own.
- Home Delivery: arranged in the shop, DHL within Germany, EUR 4.95, free above EUR 200 (duty free area) or EUR 500 (fashion, watches). Not an online shop.
- Bookable services: parking online; VipWing by PDF reservation form (https://www.munich-airport.com/vipwing-719148); lounges are listed, not sold. No reserve-and-collect or online duty-free ordering was found on the site.

## 8. Transit and connections

URL: https://www.munich-airport.com/connecting-flights-260553

- Clear operational detail: free shuttle bus T1 to T2 (5 to 7 minutes; every 10 minutes 07:00-17:00, every 20 minutes 06:00-07:00 and 17:00-23:00); underground shuttle train T2 to Satellite (every 4 minutes, 04:00 to midnight, about 1 minute); guidance on passport control cases. Text and images; no interactive connection planner and no minimum-connection or walking-time calculator.

## 9. Accessibility

Content (https://www.munich-airport.com/accessible-travel-260945): long and practical: 48-hour notification rule, PRM codes (WCHR, WCHS, WCHC, BLND, DEAF, DPNA), Mobility Service (booked through the airline only), service animals, battery wheelchairs, 10% boarding-bridge incline warning, Sunflower programme, Changing Places toilet, accessible security checkpoint in T2. "Accessible travel" is one of six homepage quick links and a footer link. An accessibility declaration is published (https://www.munich-airport.com/accessibility-declaration-37265867).

Site accessibility (axe-core WCAG A/AA, automated only):

| Page | Desktop | Mobile |
|---|---|---|
| Homepage | 10 rules / 25 nodes: critical 4, serious 5, moderate 1 | 13 rules / 44 nodes: critical 6, serious 6, moderate 1 |
| All departures | 9 rules / 59 nodes: critical 4, serious 4, moderate 1 | 12 rules / 114 nodes: critical 5, serious 6, moderate 1 |
| Accessible travel | 6 rules / 7 nodes: critical 1, serious 4, moderate 1 | 7 rules / 18 nodes: critical 2, serious 4, moderate 1 |

- Recurring rules: `aria-roles`, `aria-required-children`, `aria-required-parent`, `label` (4 nodes), `button-name`, `select-name`, `color-contrast` (7 nodes on the homepage), `aria-hidden-focus`, `image-alt` (50 airline logos on the departures page), `link-name` (50 on mobile departures), `target-size` (13 on mobile homepage), `meta-viewport` (`maximum-scale=1` disables pinch zoom).
- Landmarks: one `main`, but 8 `header`, 8 `nav` and 24 `footer` elements on the homepage. Images without alt: 24 of 59 (homepage), 200 of 202 (departures).
- Unlabelled inputs: the header search field (placeholder only) on every page.
- Keyboard, first 12 stops on the homepage: logo, Passengers & Visitors, Company & Business, Careers, Language, German, Visual help, search field, search button, Flights, Transport & Directions, Parking. Order is logical. No skip link received focus (the map page markup contains `#sr-...` jump anchors, but none appeared as a first stop). Focus is shown by underline and colour change only; computed `outline-style` was `none` on 10 of 12 stops.

## 10. AI assistant, chatbot, search

- The contact page (https://www.munich-airport.com/your-contact-to-munich-airport-835056) describes "Chatbot - Your digital assistant ... available 24 hours a day ... click on the dialog icon at the bottom right ... currently still in the learning phase". No dialog icon or chat element was rendered on any page in this session (cause unknown; possibly consent-gated). Its quality could not be tested.
- Contact form with topic selection, GDPR consent for special-category data and Friendly Captcha.
- Search adds real value: typeahead suggestions ("prayer", "prayers"), section labels on results, and parallel flight autocomplete calls (airport, airline, flight number) while typing.

## 11. Languages, mobile web, app

- Languages: English (.com) and German (.de). The language menu offers only "German".
- Mobile web: no horizontal overflow on any captured page; hamburger opens a full-screen menu with drill-down arrows, audience switch, language and Visual help; flight tables reflow into label/value cards with the Track toggle. Issues: pinch zoom disabled, 28 of 92 visible targets under 24 px on the parking page, hero carousel fills the first screen.
- App: no passenger app is promoted on the site. An on-site search for "app" returned an employee "Airport Community App" and ride-app pick-up information. One web search did not confirm a current official passenger app or a store rating.

## 12. Performance evidence

Lab, single container, third-party hosts blocked, indicative only.

| Measure | Homepage desktop | Homepage mobile | All departures (desktop) |
|---|---|---|---|
| TTFB | 1,288 ms | 1,290 ms | 337 ms |
| First contentful paint | 3,548 ms | 2,428 ms | 1,848 ms |
| Load event | 6,471 ms | 5,154 ms | 3,220 ms |
| Requests / transfer | 55 / 3.7 MB | 55 / 4.1 MB | 47 / 1.2 MB |

- Lighthouse (mobile emulation, median of 3): performance 47, accessibility 47, best practices 96, SEO 85; FCP 6.9 s, LCP 8.7 s, TBT 389 ms, CLS 0, 4.8 MB, 63 requests.
- Response headers on the homepage: `Strict-Transport-Security: max-age=31536000`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`; no Content-Security-Policy header seen; the `Server` header discloses `nginx/1.30.2 + Phusion Passenger 5.0.29`.
- Reliability: every page loaded with HTTP 200; flight data XHRs (`/flightsearch/arrivals`, `/flightsearch/departures`) returned 200.

## 13. Site search

URL pattern: https://www.munich-airport.com/search-results-75585?search_form_presenter[search_term]=...

| Query | Result |
|---|---|
| prayer room | 6 results; top five: The Prayer and Meditation Room, Muslim prayer room, Facilities & Services behind security check, Chapel, Chaplaincy. Accurate. |
| parking | 298 results; top: Parking (booking), Contact Parking, Visitors Park. Right first hit, long undifferentiated tail. |
| London | 18 results, led by press releases that mention London. The destination is not treated as flight intent. |
| LH 2000 | Redirected to "Search results flight plan", but the list showed London (LHR) flights (VL 2470, BA 957, LH 2472), not LH 2000. Flight intent is detected, matching is imprecise. |
| wheelchair | 12 results; top: Wheelchairs, Barrier-free travel. Accurate. |

## Scores table

Expert assessment, 1-5 with half points.

| Dimension | Weight | Score | Evidence level | Confidence |
|---|---|---|---|---|
| ui - UI aesthetics and brand | 10% | 3.5 | direct | high |
| ux - UX and task efficiency | 20% | 3.5 | direct | high |
| info - information depth and accuracy | 15% | 4.0 | direct | high |
| flight - live flight info and journey help | 15% | 3.5 | direct | medium |
| mobile - mobile experience | 10% | 3.0 | direct + search | medium |
| nav - navigation, search, accessibility | 10% | 3.0 | direct | high |
| ai - personalisation and AI | 10% | 2.5 | direct | medium |
| commerce - digital commerce | 5% | 3.0 | direct | medium |
| perf - performance, security, reliability | 5% | 3.0 | direct (lab) | medium |
| Weighted | 100% | 66.5% | | |

Evidence bullets per score are in `munich.json`.

## Standout features MAHB must surpass

1. Login-free flight tracking strip: one toggle pins a flight under the header on every page. https://www.munich-airport.com/all-departures-1450598
2. Inline flight search on the homepage with airport, airline and flight-number autocomplete and a four-week schedule. https://www.munich-airport.com/
3. Flight detail page that joins gate, check-in area, weather at both ends, airline contact and aircraft facts. https://www.munich-airport.com/flight-details-75388?flight_id=10323897.0
4. Site search with typeahead, section-labelled results and flight-intent routing; "prayer room" returns the right four facilities first. https://www.munich-airport.com/search-results-75585
5. Accessible-travel content of real operational depth, promoted as a homepage quick link, plus a published accessibility declaration. https://www.munich-airport.com/accessible-travel-260945

## Weaknesses

1. Technical accessibility: 10 to 13 axe rule violations per page with 4 to 6 critical, Lighthouse accessibility 47, pinch zoom disabled, no visible skip link, 200 airline logos without alt text.
2. Flight status is plain lower-case text with no colour or icon; no alerts beyond the on-page strip; no live security waiting times.
3. The map depends on cookie consent and a second domain, and the map page offers no fallback list or downloadable plan when it does not load.
4. Only two languages (English, German) for an intercontinental hub.
5. Commerce stops at parking: no online shop, no reserve-and-collect, lounge and VIP services by PDF or offline.

## Ideas to outperform

1. Keep Munich's login-free "track" idea but add opt-in web push or WhatsApp alerts and a colour-and-icon status system that also works for colour-blind users.
2. Put the flight search field in the first viewport on mobile and desktop, ahead of any campaign imagery.
3. Ship the map as a first-party, consent-free component with step-free routing and walking times, and give every facility page a "show on map" deep link.
4. Make the accessibility statement measurable: zero critical axe findings as a release gate, a visible skip link and a strong focus ring.
5. Recognise destinations and flight numbers in site search and answer with a live flight card, not press releases.
6. Join parking, lounge and fast-track into one basket tied to the tracked flight.

## Gaps

- Digital map, Visual help toolbar, chatbot widget and parking checkout were not observable (blocked hosts or consent gating).
- Only "planned" and "departed" statuses were live; delay, cancellation and boarding treatments are unverified.
- No store data for a passenger app; absence of an app is inferred from the site, not confirmed.
- Lighthouse and capture timings are lab values from one container with analytics blocked.

## Sources

- Direct captures (JSON and screenshots): `docs/research/direct/raw/bench/munich-*.json|jpg`
- Lighthouse summary: `docs/research/direct/lighthouse/munich.json`
- Screenshots: `docs/research/screenshots/munich-home-desktop.jpg`, `munich-home-mobile.jpg`, `munich-departures-desktop.jpg`, `munich-departures-mobile.jpg`, `munich-flightdetail-desktop.jpg`, `munich-menu-mobile.jpg`
- Pages: https://www.munich-airport.com/ and the URLs cited in each section
- Search (1): chatbot wording on the contact page, also seen first-hand: https://www.munich-airport.com/your-contact-to-munich-airport-835056

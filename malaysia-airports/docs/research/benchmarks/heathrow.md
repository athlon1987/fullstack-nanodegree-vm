# Benchmark: London Heathrow Airport (www.heathrow.com)

Assessed: 2026-11-16. Assessment type: expert assessment (not an instrumented usability or performance test).
Client focus for this benchmark: journey planning, terminal guidance, operational information (including Heathrow Boutique / Reserve & Collect, parking booking, Heathrow Rewards and the app).

Evidence tags used throughout:
- **[direct]** = official page fetched by me in this run (HTML, response headers or a rendered mobile page). Where a feature is evidenced by front-end strings or configuration shipped in the page source rather than by seeing it run, it is tagged **[direct, page source]**.
- **[search]** = stated in a search result or search summary obtained in this run (URL cited; snapshot age unknown unless stated).
- **[prior]** = background knowledge, not re-confirmed in this run (lower confidence, approximate as-of date given).
- **[hypothesis]** = inference that needs usability testing or technical access to confirm.

---

## Summary

Heathrow's site is a task-led operational portal rather than a showpiece. The homepage puts a four-tab flight widget (Arrivals, Departures, Connections, Book Parking) directly under the hero, surfaces estimated security and immigration wait times, and routes users into a deep, well-monetised stack: official parking (six products), Fast Track for departures and arrivals, lounges, Heathrow Express, hotel and parking packages, a retail marketplace (Reserve & Collect on boutique.heathrow.com) and a loyalty programme (Heathrow Rewards) under a single "My Heathrow" account. Its strongest differentiators are the flight detail experience (check-in zone and opening time, gate announcement time, belt, codeshares, a "passenger or collecting someone" split, save and share), a flight-to-flight connections planner, a questionnaire-driven "tailored travel guide", step-by-step virtual terminal tours, and "Hallie", an Agentforce AI agent on WhatsApp and (on some pages) web chat.

Its weaknesses are equally concrete: every page ships about 1.1 MB of HTML (about 485 KB compressed) of which about 850 KB is an inline SVG sprite; the flight board is purely client-rendered and shows an error when the data API is unreachable; stale content is live (an Electronic Travel Authorisation notice still says "by the end of 2024"); the homepage has six `<h1>` elements and no `<main>` landmark; the Hallie launcher is a non-focusable `<div>`; only eight languages are offered (no Arabic, Japanese, Korean or Malay); and the ecosystem is split across several hosts and platforms.

Weighted expert score: **79.0%** (3.95 / 5).

---

## Evidence access (direct or search-only)

**Mixed: partial direct access plus search.**

- First attempt at 2026-11-16 ~12:45 UTC: blocked (proxy answered 403 to CONNECT; WebFetch returned `getaddrinfo ENOTFOUND www.heathrow.com`).
- Second attempt at 12:49 UTC: worked. Between 12:49 and 12:51 UTC I fetched 12 distinct HTML documents with curl (homepage, arrivals, departures, flight timetable, connecting flights, passenger updates, airport maps, terminal finder, virtual guide, journey planner, transport hub, parking) plus the homepage response headers, and rendered the homepage and departures page once each in Playwright at 390x844.
- **Limitation 1 (automation filter).** www.heathrow.com answers HTTP 403 to curl's default user agent and `ERR_TOO_MANY_REDIRECTS` to Playwright's default headless Chromium user agent. The pages listed above had been fetched with a browser-style user agent string before I established this. Once it was clear the site filters self-identified automation, I stopped direct fetching, and I did not override the desktop user agent (an attempt to do so was declined by the session's permission system). Consequence: **no desktop 1440x900 screenshots exist**, and no further pages (accessibility statement, Rewards, Fast Track, app page, My Heathrow, flight detail) were read directly. This needs a decision by the project owner (for example manual capture from a normal browser).
- **Limitation 2 (blocked dependencies).** The data API host `api-dp-prod.dp.heathrow.com`, `maps.heathrow.com`, the Salesforce chat host, fonts and tag managers were not reachable from the container. The live flight board, wait-time values, journey planner results, interactive map and Hallie web chat therefore did not run; they are evidenced from page source, configuration and search snapshots.
- **Limitation 3 (search budget).** 16 web searches completed; the shared search budget for the session was then exhausted, so searches on incidents, awards, wait-time coverage and app wayfinding did not run. Those topics rely on direct evidence where available and otherwise on flagged prior knowledge.

Files produced:
- `/home/user/fullstack-nanodegree-vm/malaysia-airports/docs/research/screenshots/heathrow-home-mobile-390x844.png`
- `/home/user/fullstack-nanodegree-vm/malaysia-airports/docs/research/screenshots/heathrow-flights-departures-mobile-390x844.png`
- `/home/user/fullstack-nanodegree-vm/malaysia-airports/docs/research/screenshots/heathrow-timings.json`
- `/home/user/fullstack-nanodegree-vm/malaysia-airports/docs/research/screenshots/heathrow-capture.cjs`

---

## 1. Homepage above the fold

- **[direct]** Mobile (390x844, rendered): header with menu, logo, search, basket and account icons; an auto-rotating six-slide hero carousel with a pause button taking roughly the top half of the first screen; then a flight widget with tabs "Arrivals", "Departures", "Connections" and "Book Parking", a date picker pre-set to today and a field "Search airline, flight no. or city", plus "View all departures"; and a sticky bottom panel "Estimated security wait times" with a link "Estimated immigration wait times". https://www.heathrow.com/ (screenshot `heathrow-home-mobile-390x844.png`)
- **[direct]** Hero slides on the day were editorial or corporate, not operational: "Heathrow expansion consultation is open", "New routes from Heathrow this winter", "Treats for every occasion" (Reserve & Collect), "Explore Heathrow before you travel" (virtual guides), "Bags of ways to get there", "Support Heathrow in the Skytrax Awards". https://www.heathrow.com/
- **[direct]** Six quick-link cards follow: Official Heathrow Parking ("Book parking"), Which terminal? ("Find my terminal"), Terminal Drop-Off, Restaurants at Heathrow, Fast Track ("Book Fast Track"), Shopping at Heathrow; then promos for Reserve & Collect ("Click today and collect when you travel"), Journey planner and Heathrow Express ("Travel from Heathrow to Paddington in 15 minutes"). https://www.heathrow.com/
- **[direct]** A "Travelling soon?" lead-capture form (flight date and flight, first name, last name, email, marketing opt-in) is part of the homepage. https://www.heathrow.com/
- **[direct, page source]** Desktop composition was not rendered (see Evidence access). From the HTML: a utility bar (Assistance and accessibility, Security wait times, Heathrow Blog, Route map, Heathrow expansion, language selector, Sign In/Register), the main navigation, the same hero carousel and flight widget. https://www.heathrow.com/
- **[hypothesis]** On desktop the carousel probably competes with the flight widget for attention; needs a desktop render or usability test.

What a passenger can do within seconds: search a flight for a chosen date by airline, flight number or city; open all arrivals or departures; start a connection plan; get a parking quote; see security wait times; find their terminal; book Fast Track.

## 2. Information architecture

- **[direct]** Primary navigation (7 groups): **Flights** (Arrivals, Departures, Connecting flights, Airline contacts, Security and immigration wait times, Route map, Immigration and passports, UK customs, First time in Britain, Baggage reclaim, Meeting points, Checking-in, Departure lounge and boarding, Flight timetable); **At the airport** (Shopping, Restaurants, Book Fast Track, Lounges and hotels, Services, Facilities, Security and baggage, Travelling with children, Terminal finder, Airport maps, Assistance and accessibility, Changes to Terminal 4, Getting between terminals, Virtual guides, Currency exchange, Meet & Assist, Porters, PLUS, Hotel & Parking packages); **Transport and directions** (Journey planner, Parking with Heathrow, Pre-book Heathrow Express tickets, Airport transfer, Coaches to train stations, By car, Terminal Drop-Off Charge, Pay for Terminal 4 Priority Pick-Up, By taxi or minicab, By train or tube, By bus or coach, Passenger pick-ups, Book/Manage parking, Parking FAQs, Meet & Greet); **Shop and eat** (Shop directory, Reserve & Collect, Personal Shopper, Collect on Return, Home Delivery, Returns Promise, Terminal Shopping Transfer, Kids eat free); **My Heathrow** (What is My Heathrow?, About Heathrow Rewards, Explore offers, Sign in; signed-in: My Flights, My Bookings, Heathrow Rewards, Offers, My Account, Help); **Booking** (Official Heathrow Parking, Airport lounges, Book Fast Track, Book Heathrow Express, Heathrow VIP, PLUS, Manage bookings); **Help** (travel tips, Assistance and accessibility, Facilities, Lost property, Security and baggage, Terminal Drop-Off Charge, wait times, FAQs, Contact us, Manage your parking booking, Airline contacts, Passenger updates). https://www.heathrow.com/
- **[direct]** Utilities: language selector (8 languages), site search with "Popular Searches" (Terminal Drop-Off Charge, Passenger Pick-Up, Official Heathrow Airport Parking, Fast Track, Airport maps), basket, My Heathrow sign in / register, "Skip to Content" link. https://www.heathrow.com/
- **[direct, page source]** Search UI strings include "Did you mean '{0}'?", "Top {0} results for '{1}'" and result filters; search is served by an enterprise search API with separate passenger, corporate and expansion indexes. https://www.heathrow.com/departures
- **[direct]** Footer: Helpful links (Terminal finder, Security and baggage, Plan your journey, Heathrow app, FAQs), Discover Heathrow (Special offers, Where to eat, Where to shop, Heathrow Parking, The Windsor by Heathrow), Our company (About Heathrow, Company, Careers, Our community, Investor information, Heathrow expansion), app store badges, social links (X, Facebook, YouTube, Instagram, TikTok), legal (Privacy, Terms and conditions, Accessibility, Sitemap, Communications, Byelaws, Modern slavery, Health and safety). Corporate content lives under `/company` on the same host. https://www.heathrow.com/
- **[direct]** The same mega-navigation carries passenger and commercial links; "Security wait times" in the utility bar links to `/passenger-updates`. https://www.heathrow.com/

## 3. Flight information

- **[direct]** Arrivals and departures pages promise "the latest status information ... updated minute-by-minute" and carry a liability disclaimer about accuracy. https://www.heathrow.com/arrivals , https://www.heathrow.com/departures
- **[direct]** Search input: one free-text field accepting airline, flight number or city, plus a date picker ("Search airline, flight no. or city"; listing placeholders "Departing Flight no. Airline or City" / "Arriving Flight no. Airline or City"). https://www.heathrow.com/
- **[direct, page source]** Listing columns and controls: Scheduled time, Flight number, Airline, Departing to / Arriving from, Terminal, Status; terminal filter ("All", 2, 3, 4, 5); "Show earlier flights" / "Show later flights"; "Current time"; "Last Updated". Flight search horizon is 365 days. https://www.heathrow.com/departures
- **[direct, page source]** Status vocabulary: On time, Expected, Estimated, Delayed, Gate open, Boarding, Flight closing, Gate closed, Taxied, Departed, Landed, Arrived, Bags arriving on belt, Bags delivered on belt, Cancelled, Flight diverted. https://www.heathrow.com/departures
- **[search]** Flight detail pages have stable URLs by direction, terminal and flight number (for example `/departures/terminal-2/flight-details/AC859`, `/arrivals/terminal-5/flight-details/BA120`) and show status, scheduled and estimated time, check-in time, terminal, check-in zone with open/closed/opening time, gate (a dash until assigned) and, for arrivals, baggage belt. Only some snapshots showed a "Last updated at" stamp. Search snapshots were up to about three months old. https://www.heathrow.com/departures/terminal-2/flight-details/AC859 , https://www.heathrow.com/arrivals/terminal-5/flight-details/BA120
- **[direct, page source]** Detail-page strings: "Check in opens at {0}", "Zone {0}", "Gate will be announced at {0}", "Please proceed directly to {0}", "Your belt number will be available shortly after landing", codeshare disclosure, "Estimated security wait times", "Estimated immigration wait times" (with "Other passports"), "Last updated at", "Share flight", "View flight map", links to lounges and restaurants in the flight's terminal ("Services available after security in Terminal {0}"). https://www.heathrow.com/departures
- **[direct]** A modal asks "Are you a passenger on this flight?" with "Yes, I am a passenger" / "No, I am collecting someone"; a "Save flight" modal stores the flight in the My Heathrow account and requires sign-in. Related strings also provide "I'm meeting a passenger" and "I'm saying goodbye" roles. https://www.heathrow.com/departures
- **[direct]** Flight timetable: "See departure and arrival details for Heathrow flights to and from our destinations"; strings show one-way / round-trip search, aircraft type, duration and a route map link. https://www.heathrow.com/flight-timetable
- **[direct]** Notifications are positioned as an app feature: "Track your flight in real-time. Get live alerts for your departing flight, from check-in and bag drop right to your gate. Download the Heathrow App now." https://www.heathrow.com/departures
- **[direct]** Failure mode observed: with the data API unreachable the departures page showed a red error "Your flight selection cannot be found, please select another date or refresh your browser" and no board; the homepage panel showed "Security wait times are currently unavailable." (screenshot `heathrow-flights-departures-mobile-390x844.png`). This was caused by my container's network policy, but it shows there is no server-rendered or cached fallback. https://www.heathrow.com/departures
- **[search]** App reviews complain that gates are sometimes not shown and that delay updates lag other sources (user reviews, not verified). https://play.google.com/store/apps/details?id=com.baa.heathrow&hl=en

## 4. Journey assistance and personalisation

- **[direct]** "My Heathrow" account: My Flights, My Bookings, Heathrow Rewards, Offers, My Account (My Profile, My Preferences), Help. Sign-in is offered in the header on every page. https://www.heathrow.com/
- **[search]** My Heathrow unified former Heathrow Rewards, parking and Reserve & Collect accounts (details and points balances migrated; users reset their password and choose an authentication method); accounts are protected with multi-factor authentication and work on the website and in the app. https://www.heathrow.com/my-heathrow , https://www.heathrow.com/my-heathrow/help
- **[direct, page source]** Links use `oauthProvider=AzureB2C` and the CSP allows form posts to `login.microsoftonline.com`, indicating Microsoft Azure AD B2C identity; My Heathrow pages live under `/myheathrow/s/`. https://www.heathrow.com/
- **[direct, page source]** "Tailored travel guide" (path `/at-the-airport/assistance-and-accessibility/tailored-travel-guide`): a questionnaire that takes travel dates (up to six months ahead) and flights (departure, arrival, round trip or connection) and builds a "personalized airport guide" with departure and arrival guides, "Your ideal arrival time at Heathrow", check-in zone, security wait time, lounge access, special assistance, live status labels, review / reset, and share by email ("Your Heathrow tailored travel guide") or copied link. I did not run it. https://www.heathrow.com/departures (configuration and strings)
- **[direct, page source]** A personalisation tag (Salesforce Marketing Cloud Personalization, `cdn.evgnet.com/beacon/heathrowairport/...`), Adobe Launch, Tealium (`tags.heathrow.com`) and Contentsquare are loaded on every page. https://www.heathrow.com/
- **[search]** App: add a departing, arriving or connecting flight for live notifications; tailored flight-to-flight itinerary for layovers. https://apps.apple.com/us/app/-/id427951859
- **[hypothesis]** No evidence was found of on-site recommendations that change with a saved flight (for example terminal-specific offers on the homepage); the personalisation tag makes it possible. Needs a logged-in test.

## 5. Maps and wayfinding

- **[direct]** "Interactive maps: From entry roads, car parks and stations to shops, departure gates and lounges"; separate maps for Terminals 2, 3, 4 and 5; PDF transport maps (area bus map, hotel network, rail and underground, road map, free travel map). The interactive map is on a separate host, maps.heathrow.com. https://www.heathrow.com/at-the-airport/airport-maps
- **[direct]** "The Heathrow app's real-time navigation feature gives turn-by-turn directions to wherever you want to go from check-in to your departure gate." https://www.heathrow.com/at-the-airport/airport-maps
- **[search]** The app's wayfinding relies on location and Bluetooth permissions. https://apps.apple.com/us/app/-/id427951859
- **[direct]** Virtual tours: "step-by-step virtual tours of arrivals, departures and connections, plus accessible routes where available" for Terminals 2, 3 and 5 (Terminal 4 not listed), with sub-tours by arrival mode (Heathrow Express, bus, taxi). https://www.heathrow.com/at-the-airport/terminal-guides/terminal-virtual-guide
- **[search]** Walking guidance in FAQs: Terminal 3 main gates about 800 m / roughly 20 minutes from security; Terminal 4 about 200 m / five minutes (some 400 m); Terminal 5 A gates about ten minutes, satellite gates about 15 minutes by transit. Page age unknown. https://www.heathrow.com/customer-support/faq/assistance-faqs
- **[search]** The help pages point users to the interactive map to preview walking distances and link a route planner. https://www.heathrow.com/at-the-airport/assistance-and-accessibility/help-in-the-terminal
- **[direct, page source]** Shop and restaurant listings carry "View on Map" and filters for terminal, before / after security and area within terminal. https://www.heathrow.com/departures
- No evidence of AR wayfinding was found in this run (insufficient evidence, not proof of absence).

## 6. Ground transport planner and parking

- **[direct]** Transport hub offers Train, Car, Bus and coach, Taxi and minicab, Terminal Drop-Off, Cycling, "Find the best route for you with our Journey Planner", Book car parking, Book Heathrow Express, and travel between airports. https://www.heathrow.com/transport-and-directions
- **[direct, page source]** Journey planner: to or from Heathrow, "Enter postcode or station" or use current location, "Depart At" / "Arrive By" / "Leaving now", "Add via destination", modes By Public transport, By Car, By Taxi (black cab, minicab), By Bus/Coach, Cycling and Walking ("Walking directions are in beta"), route preferences (Best route, Fastest route, Fewer transfers, Less walking), "There's a traffic disruption" flag, fares and "Book Tickets", "See on Map", a Heathrow Express timetable ("Next train leaving at", platform), nearby bus stop and rail station timetables and tube disruption feeds. Partners: National Express, megabus, minicabit, We Know (zero-emission transfers), a chauffeur service, CarTrawler car rental. I did not see results because the API was unreachable. https://www.heathrow.com/transport-and-directions/getting-to-central-london/journey-planner
- **[search]** Fare statements on official pages (snapshot dates unknown): Heathrow Express every 15 minutes, about 15 minutes to Paddington, from £10 in advance; Elizabeth line to zone 1 £13.90, under 45 minutes; Piccadilly line from £5.50, under an hour; coaches from £10. https://www.heathrow.com/transport-and-directions/getting-to-central-london , https://www.heathrow.com/transport-and-directions/by-rail-or-train/heathrow-express
- **[direct]** Terminal Drop-Off Charge rose from £6 to £7 per visit from 1 January 2026; payable online. https://www.heathrow.com/passenger-updates
- **[direct]** Official parking: six products (Terminal Parking, Park & Ride, Priority Park & Ride, Meet & Greet, Pod Parking at T5, Valet Parking) across "11 Official Heathrow car parks"; a quote widget with promo code; free cancellation up to two hours before arrival; bookable up to a year ahead; "Compare Heathrow Parking" and per-terminal option lists; a product comparison table (transfer time, type of transfer, on-the-day price). On-the-day prices shown on 2026-11-16: Priority Park & Ride £49.00 for one day; Park & Ride £50.00 for the first day and £40.00 for additional days. https://www.heathrow.com/transport-and-directions/heathrow-parking
- **[direct]** Parking is tied to loyalty: 5% off with My Heathrow and 10% off with Heathrow Rewards Premium for online pre-booking until 1 February 2027. https://www.heathrow.com/transport-and-directions/heathrow-parking
- **[direct]** Operational notices are embedded in the product copy (Terminal 4 Terminal Parking closed for redevelopment; Priority Park & Ride for Terminals 2 and 3 closed). "Heathrow doesn't currently provide EV charging facilities in any of its car parks." https://www.heathrow.com/transport-and-directions/heathrow-parking
- **[search]** Other on-the-day prices on official pages said to be effective 3 November 2026: Meet & Greet and Valet from £145.00 for one day, Pod Parking from £63.00; older cached versions (effective 6 January 2026) show £143.40 and £46.80. Sources conflict by page version; the live quote widget is authoritative. https://www.heathrow.com/transport-and-directions/heathrow-parking/heathrow-meet-and-greet-parking , https://www.heathrow.com/transport-and-directions/heathrow-parking/heathrow-park-and-ride , https://www.heathrow.com/transport-and-directions/heathrow-parking/terminal-5
- No evidence of live car park space availability was found on the parking page or in its strings (insufficient evidence; **[hypothesis]** that it is not offered).

## 7. Shopping, dining, e-commerce, bookings and loyalty

- **[direct]** Reserve & Collect is promoted in the navigation, the hero and a homepage panel ("Browse thousands of products from your favourite brands"; "Reserve & Collect: 10% off Online"), with a basket icon in the global header; supporting services are Personal Shopper, Collect on Return, Home Delivery, Returns Promise and Terminal Shopping Transfer. The shop is a separate host, boutique.heathrow.com. https://www.heathrow.com/
- **[search]** Reserve & Collect is free; pay-in-advance items are collected at a collection point after security and pay-on-collection items at the retailer's store; not every range is online. Lead times conflict: a brand page says reservations must be completed at least 30 minutes before departure, while an unofficial guide in the same result set says 24 hours minimum and 30 days maximum. https://www.heathrow.com/at-the-airport/shopping/reserve-and-collect , https://boutique.heathrow.com/en/FAQ.html , https://boutique.heathrow.com/en/brands/jekyll-and-hide
- **[search]** Reserve & Collect orders earn bonus Rewards points (100 standard, 150 Premium, per the German-language official page). https://www.heathrow.com/de/at-the-airport/shopping/reserve-and-collect
- **[direct, page source]** Shop and restaurant directories filter by terminal, before / after security, category and dietary need; product carousels "Available on Heathrow Reserve & Collect" are embedded in content pages; flight pages link to "restaurants in Terminal {1} to view menus or pre-order". https://www.heathrow.com/departures
- **[search]** Fast Track: departures from £12.99 per person, 06:00 to 21:00, bookable up to six months ahead and until one hour before arrival at security, cancellable up to two hours before; arrivals (passport control) from £25 off-peak and £35 peak; not sold at the airport. An older press release quoted £12.50. https://www.heathrow.com/at-the-airport/airport-services/fast-track , https://mediacentre.heathrow.com/pressrelease/detail/19889
- **[direct, page source]** Fast Track booking configuration: products "Fast Track Arrivals" and "Fast Track Departures" in Terminals 2 to 5, up to 6 passengers, same-day sale enabled, and an "active date" of 2024-06-01 (meaning of that field not confirmed). Lounge quotes: departures in Terminals 2 to 5 and arrivals in Terminals 2 to 4. Hotel and parking packages: up to 3 rooms and 3 vehicles. https://www.heathrow.com/departures
- **[search]** Bookable lounges on the site include No1 Lounge and Plaza Premium (Terminal 2, from about £40 to £44) and My Lounge (Terminal 3, from £42). https://www.heathrow.com/at-the-airport/lounges-hotels-spas
- **[direct]** Other bookable products in the "Booking" menu: Heathrow Express, Heathrow VIP / The Windsor by Heathrow (separate host heathrowvip.com), PLUS, Meet & Assist, porters, currency exchange. https://www.heathrow.com/
- **[search]** Heathrow Rewards: 1 point per £1 at airport shops, restaurants and bars; points also on pre-booked official parking and Heathrow Express; Premium tier after £750 spend with participating partners in a calendar year, with double points for the rest of that year and the next; 500 points = £5 at Heathrow; conversion to airline miles (Avios one-for-one, in blocks of 250); points expire after three years without a transaction. Third-party reviews (Head for Points, July and September 2026) say several older Premium perks have lapsed and off-airport earning partners have been cut. https://www.heathrow.com/my-heathrow/heathrow-rewards/heathrow-rewards-premium , https://shopping.ba.com/en-US/retailers/heathrow-rewards/ , https://www.headforpoints.com/2026/07/30/how-does-heathrow-rewards-work-4/ , https://www.headforpoints.com/2026/09/27/review-heathrow-rewards-premium-tier-benefits/
- **[search]** In the app: digital Rewards card, offers saved to the in-app card, shop browsing and reservations, parking booking, drop-off payment and food pre-ordering. https://apps.apple.com/us/app/-/id427951859 , https://www.heathrow.com/my-heathrow/heathrow-rewards

## 8. Transit and connection guidance

- **[direct]** Connecting flights page: a flight connection planner plus an FAQ in plain language (security, immigration and biometrics for international-to-domestic, baggage, minimum connection time, finding the terminal, travel between terminals, delayed inbound flight, boarding passes, leaving the airport, sleeping). "Follow the purple signs"; free shuttle bus every 10 minutes between terminals; "Large electrical items and liquids, up to 2 litres, can remain in your cabin baggage when connecting." https://www.heathrow.com/connecting-flights
- **[direct, page source]** The planner takes an arriving and a departing flight ("Search Flight number or arriving from" / "departing to") and returns "Your connection timeline", "Total time between flights", a verdict ("This layover allows enough time for your transfer", "This is a short connection", "You need more time to make your connection"), minutes needed within or between terminals, live bus times on the day, and disruption messages (cancelled, diverted, departed). Result pages have their own URL (`/connecting-flights/flight-details`). https://www.heathrow.com/connecting-flights
- **[direct]** Self-connecting passengers are told "The information on this page doesn't apply to you" and are sent to the arrivals and between-terminals pages. https://www.heathrow.com/connecting-flights
- **[search]** Blog guides cover connections and layovers / stopovers. https://www.heathrow.com/heathrow-blog/a-guide-to-connections , https://www.heathrow.com/heathrow-blog/layovers-and-stopovers-at-heathrow
- **[direct]** The app is promoted for "real-time updates and helpful reminders" on connections. https://www.heathrow.com/connecting-flights

## 9. Accessibility and special assistance

- **[direct]** "Assistance and accessibility" is the first item in the utility bar on every page and appears again in At the airport and Help; an "Accessibility" statement link (`/accessibility-statement`) is in the footer (not read in this run). https://www.heathrow.com/
- **[search]** Content covers assistance booking, non-visible disabilities and the Sunflower lanyard (free at assistance desks in every terminal), and help in the terminal. https://www.heathrow.com/at-the-airport/assistance-and-accessibility , https://www.heathrow.com/at-the-airport/assistance-and-accessibility/non-visible-disabilities
- **[direct]** Virtual tours include "accessible routes where available"; the tailored travel guide sits in the assistance section; parking copy states "All car parks are wheelchair accessible with Blue Badge bays available"; taxis "have wheelchair access". https://www.heathrow.com/at-the-airport/terminal-guides/terminal-virtual-guide , https://www.heathrow.com/transport-and-directions/heathrow-parking , https://www.heathrow.com/transport-and-directions/getting-to-central-london/journey-planner
- **[direct, page source]** Site-level positives: `lang="en-GB"`, a skip link, a pause control on the carousel, 206 `aria-label` attributes on the homepage, labelled language selector, 30 of 32 homepage `<img>` tags carry alt text (one has an empty alt, one loader GIF has no alt attribute).
- **[direct, page source]** Site-level defects on the homepage: six `<h1>` elements (one per carousel slide); no `<main>` landmark; heading levels out of order (h6 cards before h2 sections); no `aria-live` region in the delivered HTML for status updates; the Hallie chat launcher is `<div id="hallie-chat-button" onclick=...>` containing an image, so it is not a focusable button. https://www.heathrow.com/ , https://www.heathrow.com/departures
- **[search]** The only WCAG statement surfaced by search was on the boutique sub-site ("priority 1 and 2 guidelines"), which is dated wording; no conformance level for the main site was found. https://boutique.heathrow.com/en/accessibility.html
- No accessibility toolbar (contrast, text size, reader) was present in the page source of the 12 pages fetched.

## 10. AI assistant, chatbot and messaging

- **[search]** "Hallie" is Heathrow's AI agent built on Salesforce Agentforce, announced 11 June 2025, reachable through WhatsApp; Salesforce reports a 90% chat resolution rate without transfer to a human and an expected improvement in digital contact efficiency of up to 40%. Vendor and operator claims, not independently verified. One report dates the debut to March 2025. https://www.salesforce.com/uk/news/press-releases/2025/06/11/heathrow-airport-agentforce-passenger-experience/ , https://blog.tmcnet.com/blog/rich-tehrani/ai/heathrow-launches-hallie-ai-agent-to-streamline-passenger-support.html
- **[search]** Capabilities described: gate, amenity, wayfinding and flight status questions from Heathrow's knowledge base and live data; drafts case summaries for staff; limited to Heathrow's own data; expansion to website, app and kiosks was planned. A later aggregator item says phone calls fell from 70% to 10% of enquiries by March 2026 (unverified). https://app.dealroom.co/news/feed/heathrow-s-ai-assistant-hallie-cuts-phone-inquiries-from-70-to-10-in-one-year
- **[direct]** Hallie is now embedded as web chat ("Heathrow - Hallie AI Chat Assistant", Salesforce embedded messaging deployment `HAL_AgentforceWeb`) on the arrivals, departures, connecting flights and parking pages, with a floating chat button. It was not present on the homepage, flight timetable, maps, journey planner, transport hub, terminal finder, virtual guide or passenger updates pages. https://www.heathrow.com/departures , https://www.heathrow.com/transport-and-directions/heathrow-parking
- **[direct, page source]** The embed sets `language = "en_US"`. No statement of Hallie's supported languages was found in search. https://www.heathrow.com/departures
- **[direct]** Other channels linked from the site: X, Facebook, YouTube, Instagram, TikTok; "Follow Heathrow on Twitter" on passenger updates; share options include WeChat and email. https://www.heathrow.com/ , https://www.heathrow.com/passenger-updates

## 11. Languages, mobile web and app

- **[direct]** Eight site languages with `hreflang` alternates: English, Italiano, Français, Deutsch, Svenska, 中文, Español, हिंदी (`/it`, `/fr`, `/de`, `/sv`, `/zh`, `/es`, `/hi`). No Arabic, Japanese, Korean, Portuguese or Malay. https://www.heathrow.com/
- **[direct]** Mobile web: responsive layout with the flight widget in the first screen, sticky wait-time panel, a service worker and web app manifest registered on every page, and smart app banners for iOS and Android. https://www.heathrow.com/
- **[direct]** App: "LHR London Heathrow Airport" ("Official app: Manage your trip"), iOS app id 427951859, Android package `com.baa.heathrow`, linked in the footer and in app promotions on flight and connection pages. https://www.heathrow.com/
- **[search]** App features: live notifications for departing flights (check-in zone, bag drop, security wait times, gate, boarding status); arrivals (live immigration wait times, baggage reclaim, onward travel); connection itinerary; wayfinding maps; Rewards card and offers; shop browsing and reservations; parking booking; drop-off payment; food pre-ordering. https://apps.apple.com/us/app/-/id427951859 , https://www.heathrow.com/customer-support/mobile-apps
- **[search]** Store ratings (snapshots conflict): Apple App Store 4.7 (one listing shows 644 ratings; a third-party mirror shows 4.66 from about 8,700 ratings as of 17 August 2026); Google Play 4.2 to 4.3 from about 4.45K reviews. Reviews mention missing gates, slow delay updates and one report of the app not starting. https://apps.apple.com/us/app/heathrow-airport-guide/id427951859?ls=1 , https://play.google.com/store/apps/details?id=com.baa.heathrow&hl=en
- **[search]** The separate Heathrow Express site was relaunched with AI-supported translations (item about 21 months old at search time). https://www.heathrowexpress.com/news-blog/news/introducing-the-new-heathrow-express-website

## 12. Performance, security and reliability

Single-run lab observation from a cloud container; third-party asset hosts may be blocked so rendering may be incomplete; not field data.

| Page | Viewport | TTFB | DOMContentLoaded | Load | First contentful paint | Transferred (all finished requests) | Document (transfer / decoded) |
|---|---|---|---|---|---|---|---|
| Homepage | mobile 390x844 | 113 ms | 1,096 ms | 1,102 ms | 580 ms | 1,859,703 bytes (32 requests) | 487,026 / 1,141,283 bytes |
| Departures | mobile 390x844 | 61 ms | 726 ms | 747 ms | 548 ms | 1,172,377 bytes (27 requests) | 485,570 / 1,109,010 bytes |
| Homepage | desktop 1440x900 | not captured (ERR_TOO_MANY_REDIRECTS with default headless user agent) | | | | | |
| Departures | desktop 1440x900 | not captured (same) | | | | | |

- **[direct]** These figures understate real load: requests to fonts (`cdn.fonts.net`), tag managers (`assets.adobedtm.com`, `tags.heathrow.com`), personalisation (`cdn.evgnet.com`), sharing (`static.addtoany.com`), reCAPTCHA, the Salesforce chat host and the data API (`api-dp-prod.dp.heathrow.com`) failed in the container. https://www.heathrow.com/
- **[direct]** curl time-to-first-byte across 13 document fetches (through the container's proxy) ranged from 0.18 s to 1.52 s; every HTML document was 482 to 489 KB compressed (Brotli) and about 1.1 MB decoded. About 851 KB of the homepage HTML is inline SVG (292 symbols, including about 490 KB of base64 image data), repeated on every page. `cache-control: public, max-age=300`. https://www.heathrow.com/
- **[direct]** Stack: Adobe Experience Manager (dispatcher header, `/etc.clientlibs`, experience fragments), React components, HTTP/2, response headers that include a CloudFront `via` header and an Azure reference header (`x-azure-ref`), 13 script files on the homepage. https://www.heathrow.com/
- **[direct]** Security headers: Content-Security-Policy (but allowing `'unsafe-eval'`, inline script elements and any `https:` source), HSTS `max-age=63072000; includeSubdomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera and microphone disabled), `Cross-Origin-Resource-Policy: same-origin`, `frame-ancestors 'self'`. Automation filtering: 403 to curl's default user agent. https://www.heathrow.com/
- **[search]** A My Heathrow help page snapshot says "Due to the global Microsoft outage, registration for My Heathrow is currently unavailable" with no restoration time; the search tool dated it 13 November 2026, which I could not verify. https://www.heathrow.com/my-heathrow/help
- **[prior]** Airport-level resilience events (operational, not website measurements): closure for most of 21 March 2025 after a fire at the North Hyde substation (as of 2025); disruption to check-in and boarding in September 2025 after a cyberattack on Collins Aerospace's shared check-in software (as of 2025); Heathrow's website was reported among sites affected by a Microsoft Azure outage on 29 October 2025 (as of 2025, medium confidence). None re-confirmed in this run.
- No published uptime, Core Web Vitals or availability statistics were found.

## 13. Recent relaunches, awards and initiatives (2024 to 2026)

- **[search]** June 2025: Hallie AI agent on Agentforce (WhatsApp), see section 10. https://www.salesforce.com/uk/news/press-releases/2025/06/11/heathrow-airport-agentforce-passenger-experience/
- **[direct]** By November 2026 Hallie web chat is live on flight and parking pages. https://www.heathrow.com/departures
- **[direct, page source]** Fast Track online sales configuration covers arrivals as well as departures and carries an "active date" of 2024-06-01 (meaning of that field not confirmed). https://www.heathrow.com/departures
- **[search]** My Heathrow single account with multi-factor authentication replacing separate Rewards, parking and Reserve & Collect logins (date not found). https://www.heathrow.com/my-heathrow
- **[direct]** Current campaigns: third-runway expansion consultation, new winter routes, a new traveller blog ("Explore the world from Heathrow with our new blog"), virtual guides, and a request to vote for Heathrow in the Skytrax World Airport Awards. https://www.heathrow.com/
- **[direct]** Terminal 4 redevelopment changes to parking and pick-up; drop-off charge £7 from 1 January 2026. https://www.heathrow.com/passenger-updates , https://www.heathrow.com/transport-and-directions/heathrow-parking
- Awards won in 2024 to 2026 and any website relaunch date: insufficient evidence in this run (the searches did not execute).

---

## Scores table

Expert assessment on a 1 to 5 scale; not an instrumented test.

| Dimension | Weight | Score | Confidence | Evidence level | Evidence |
|---|---|---|---|---|---|
| ui: UI aesthetics and brand sophistication | 10% | 3.5 | medium | direct (mobile render only) | Consistent purple brand, clear type and iconography in the mobile screenshots; hero is a six-slide auto-rotating carousel of campaigns; component look is functional rather than premium. No desktop render. https://www.heathrow.com/ |
| ux: UX and task completion efficiency | 20% | 4.0 | medium | direct + search | Flight search by airline, flight number or city in the first mobile screen; four-tab widget; six task cards; popular searches; quote and booking widgets for parking, Fast Track and lounges; passenger vs collector split. Held back by a very dense mega-menu and hand-offs to other hosts. https://www.heathrow.com/ , https://www.heathrow.com/transport-and-directions/heathrow-parking |
| info: Information comprehensiveness and accuracy | 15% | 4.0 | medium | direct + search | Deep, plain-language content (connections FAQ, parking FAQ with prices and closures, terminal tours, drop-off charge). Accuracy issues: ETA notice still says "by the end of 2024"; parking prices differ between page versions; Reserve & Collect lead times conflict. https://www.heathrow.com/connecting-flights , https://www.heathrow.com/passenger-updates |
| flight: Live flight information and journey assistance | 15% | 4.5 | medium | direct (page source) + search | Minute-by-minute board, 365-day timetable, detail pages with check-in zone, gate announcement time, belt, codeshares and last-updated stamp, security and immigration wait times, connection planner with timeline, save and share, app alerts. Live board not observed running; no fallback when the API fails; web alerts are app-only. https://www.heathrow.com/departures , https://www.heathrow.com/departures/terminal-2/flight-details/AC859 |
| mobile: Mobile experience | 10% | 4.0 | medium | direct + search | Responsive first screen with flight widget and wait times; service worker and manifest; smart app banners; app rated about 4.7 (iOS) and 4.2 to 4.3 (Android) with turn-by-turn navigation and live alerts. Very heavy HTML. https://www.heathrow.com/ , https://apps.apple.com/us/app/-/id427951859 |
| nav: Navigation, search and accessibility | 10% | 3.5 | medium | direct | Seven-group mega-menu, search with popular searches and "did you mean", eight languages with hreflang, skip link, assistance link first in the utility bar. Defects: six h1, no main landmark, non-focusable chat launcher, no accessibility tools, limited languages. https://www.heathrow.com/ |
| ai: Personalisation and AI | 10% | 4.0 | medium | direct + search | Hallie on WhatsApp and web chat (90% resolution claimed by vendor), tailored travel guide, saved flights in My Heathrow, personalisation tag on every page. Hallie is on selected pages only, embed set to en_US, recommendations not evidenced. https://www.salesforce.com/uk/news/press-releases/2025/06/11/heathrow-airport-agentforce-passenger-experience/ , https://www.heathrow.com/departures |
| commerce: Digital commerce and ancillary revenue | 5% | 4.5 | medium | direct + search | Six parking products with loyalty discounts and free cancellation, Fast Track for departures and arrivals, lounges, Heathrow Express, hotel and parking, VIP, car rental, Reserve & Collect marketplace with basket in the header, Rewards with tier and airline-mile conversion. Split across several hosts. https://www.heathrow.com/transport-and-directions/heathrow-parking , https://www.heathrow.com/at-the-airport/shopping/reserve-and-collect |
| perf: Performance, security and reliability | 5% | 3.0 | low | direct (single-run lab) + prior | Fast first byte and paint in the lab with third parties blocked; about 485 KB compressed HTML per page; solid header set but permissive CSP; client-only flight data; reported Microsoft outage affecting registration; no published reliability data. https://www.heathrow.com/ |

Weighted total: (3.5x10 + 4.0x20 + 4.0x15 + 4.5x15 + 4.0x10 + 3.5x10 + 4.0x10 + 4.5x5 + 3.0x5) / 500 = 395 / 500 = **79.0%**.

---

## Standout features (MAHB must surpass)

1. **Flight search and flight detail built around the next decision.** One field for airline, flight number or city on the homepage; detail pages with check-in zone and opening time, when the gate will be announced, belt, codeshares, wait times, a passenger / collector split, save and share. https://www.heathrow.com/departures
2. **Estimated security and immigration wait times as a first-class element.** In the utility bar, the Flights menu, the homepage sticky panel, flight details and the app. https://www.heathrow.com/passenger-updates#wait-times
3. **Guidance tools: connections planner, tailored travel guide and virtual tours.** Flight-pair connection verdict with timeline and transfer minutes; questionnaire-based personal guide with ideal arrival time; step-by-step tours with accessible routes. https://www.heathrow.com/connecting-flights , https://www.heathrow.com/at-the-airport/terminal-guides/terminal-virtual-guide
4. **Hallie, an AI agent on WhatsApp and web chat grounded in airport data.** Vendor-reported 90% resolution without human transfer; embedded where questions arise (flight and parking pages). https://www.salesforce.com/uk/news/press-releases/2025/06/11/heathrow-airport-agentforce-passenger-experience/
5. **Ancillary commerce tied to one account and loyalty.** Parking (six products, comparison, free cancellation, member discounts), Fast Track both directions, lounges, Reserve & Collect marketplace and Rewards under My Heathrow. https://www.heathrow.com/transport-and-directions/heathrow-parking

## Weaknesses (opportunities for MAHB to leapfrog)

1. **Fragmented ecosystem.** Main site (AEM), `/booking`, `/myheathrow` (separate application paths), boutique.heathrow.com, maps.heathrow.com, heathrowexpress.com and heathrowvip.com; the interactive map and shop leave the main site; Hallie is on some pages only. [direct]
2. **Heavy pages and no graceful degradation.** About 1.1 MB of HTML (about 485 KB compressed) on every page, about 850 KB of it an inline SVG sprite; flight data is client-only and fails to an error message with no last-known data. [direct]
3. **Stale and inconsistent content.** ETA notice saying "by the end of 2024" still live in November 2026; parking prices and Reserve & Collect lead times differ between pages; an outage notice on the account help page. [direct + search]
4. **Accessibility and language gaps.** Six h1 and no main landmark on the homepage, non-focusable chat launcher, no site accessibility tools, only eight languages and an English-configured assistant; no modern WCAG conformance statement found. [direct + search]
5. **Best features are app-gated or missing.** Live alerts and turn-by-turn navigation need the app; saving a flight needs an account; no evidence of live parking availability, no EV charging, no AR, no Terminal 4 virtual tour; self-connecting passengers are excluded from the connections tool. [direct + hypothesis]

## Ideas to outperform (not merely copy)

1. **A no-login "My journey" timeline on the web.** Enter a flight number once and get a shareable, server-rendered timeline (leave home, check-in, security, gate, belt) with web push or WhatsApp alerts and role views (passenger, greeter, driver), across KLIA Terminal 1, Terminal 2 and the regional airports. Heathrow keeps alerts in the app and saving behind sign-in.
2. **Operational status with timestamps, trends and forecasts.** Show security, immigration, baggage and airside transit wait times with "updated hh:mm", typical-for-this-hour context and a forecast for the user's departure time, and keep last-known values when a feed fails. Heathrow shows a current estimate or "unavailable".
3. **A connections planner that includes self-transfer.** Cover Terminal 1 to Terminal 2 and low-cost self-connections with honest minimum times, immigration and bag re-check steps, transport between terminals and what to do if it is tight. Heathrow tells self-connecting passengers the page does not apply to them.
4. **A multilingual, transactional, accessible assistant on every page.** Bahasa Malaysia, English, Mandarin, Tamil, Arabic, Japanese, Korean and Bahasa Indonesia from day one; grounded in live flight and facility data; able to complete parking or fast-track bookings; a real button with keyboard and screen-reader support and human handover.
5. **A published performance and accessibility budget.** Server-rendered flight board, small HTML with a cached external sprite, WCAG 2.2 AA with one h1 and proper landmarks, and public Core Web Vitals targets, so the site is fast on mid-range phones and airport Wi-Fi.
6. **One basket and one identity.** A single cart and wallet across parking, fast track, lounge, retail pre-order and rail tickets on the main domain, with loyalty earn and burn shown at each price, live car park and EV charger availability, and local payment methods.

---

## Sources

Direct (fetched 2026-11-16, 12:49 to 12:51 UTC):
- https://www.heathrow.com/ (HTML, response headers, mobile render)
- https://www.heathrow.com/arrivals
- https://www.heathrow.com/departures (HTML, mobile render)
- https://www.heathrow.com/flight-timetable
- https://www.heathrow.com/connecting-flights
- https://www.heathrow.com/passenger-updates
- https://www.heathrow.com/at-the-airport/airport-maps
- https://www.heathrow.com/at-the-airport/terminal-guides/which-terminal
- https://www.heathrow.com/at-the-airport/terminal-guides/terminal-virtual-guide
- https://www.heathrow.com/transport-and-directions/getting-to-central-london/journey-planner
- https://www.heathrow.com/transport-and-directions
- https://www.heathrow.com/transport-and-directions/heathrow-parking

Search (official and operator):
- https://www.heathrow.com/departures/terminal-2/flight-details/AC859
- https://www.heathrow.com/arrivals/terminal-5/flight-details/BA120
- https://www.heathrow.com/customer-support/mobile-apps
- https://www.heathrow.com/my-heathrow , https://www.heathrow.com/my-heathrow/help , https://www.heathrow.com/heathrow-rewards/spend-points
- https://www.heathrow.com/my-heathrow/heathrow-rewards , https://www.heathrow.com/my-heathrow/heathrow-rewards/heathrow-rewards-premium
- https://www.heathrow.com/at-the-airport/shopping/reserve-and-collect , https://www.heathrow.com/de/at-the-airport/shopping/reserve-and-collect
- https://boutique.heathrow.com/en/FAQ.html , https://boutique.heathrow.com/en/brands/jekyll-and-hide , https://boutique.heathrow.com/en/accessibility.html
- https://www.heathrow.com/at-the-airport/airport-services/fast-track , https://www.heathrow.com/at-the-airport/lounges-hotels-spas
- https://mediacentre.heathrow.com/pressrelease/detail/19889
- https://www.heathrow.com/transport-and-directions/heathrow-parking/heathrow-meet-and-greet-parking , https://www.heathrow.com/transport-and-directions/heathrow-parking/heathrow-park-and-ride , https://www.heathrow.com/transport-and-directions/heathrow-parking/terminal-5
- https://www.heathrow.com/transport-and-directions/getting-to-central-london , https://www.heathrow.com/transport-and-directions/by-rail-or-train/heathrow-express
- https://www.heathrow.com/customer-support/faq/assistance-faqs , https://www.heathrow.com/at-the-airport/assistance-and-accessibility , https://www.heathrow.com/at-the-airport/assistance-and-accessibility/non-visible-disabilities , https://www.heathrow.com/at-the-airport/assistance-and-accessibility/help-in-the-terminal
- https://www.heathrow.com/heathrow-blog/a-guide-to-connections , https://www.heathrow.com/heathrow-blog/layovers-and-stopovers-at-heathrow
- https://www.heathrowexpress.com/news-blog/news/introducing-the-new-heathrow-express-website
- https://www.salesforce.com/uk/news/press-releases/2025/06/11/heathrow-airport-agentforce-passenger-experience/ (vendor press release, 11 June 2025)
- https://apps.apple.com/us/app/-/id427951859 , https://apps.apple.com/us/app/heathrow-airport-guide/id427951859?ls=1 , https://play.google.com/store/apps/details?id=com.baa.heathrow&hl=en
- https://shopping.ba.com/en-US/retailers/heathrow-rewards/

Search (blogs, aggregators, trade press; lower reliability):
- https://www.headforpoints.com/2026/07/30/how-does-heathrow-rewards-work-4/ , https://www.headforpoints.com/2026/09/27/review-heathrow-rewards-premium-tier-benefits/ (blog)
- https://blog.tmcnet.com/blog/rich-tehrani/ai/heathrow-launches-hallie-ai-agent-to-streamline-passenger-support.html (blog)
- https://app.dealroom.co/news/feed/heathrow-s-ai-assistant-hallie-cuts-phone-inquiries-from-70-to-10-in-one-year (aggregator)
- https://ezine.moodiedavittreport.com/ezine-338/heathrow-airport (trade press)

Prior knowledge (not re-confirmed): March 2025 substation fire closure; September 2025 Collins Aerospace cyberattack; October 2025 Azure outage.

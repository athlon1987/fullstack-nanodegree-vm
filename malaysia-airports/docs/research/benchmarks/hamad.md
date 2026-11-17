# Benchmark: Hamad International Airport, Doha (DOH)

- Key: `hamad`
- Host assessed: https://dohahamadairport.com/
- Assessed: 2026-11-17 (captures taken about 02:55-03:30 Doha time)
- Assessment type: **expert assessment**. The scores below are an analyst's judgement supported by first-hand observation. They are not instrumented usability tests, not field performance data and not a formal WCAG audit.

Evidence tags: `[direct]` observed by me in this run with a headless Chromium browser (desktop 1440x900 and iPhone 14 emulation) or a plain HTTP request; `[search]` stated in a web search result obtained in this run (URL cited, page not opened); `[prior]` background knowledge not re-confirmed; `[limited]` judgement constrained by this container's network policy.

---

## Summary

Hamad's website pairs the most premium brand expression in this benchmark set with one feature that is best in class: every flight has its own page that turns into a journey timeline. The passenger says where they are ("I'm at": the airport or a named Doha zone), and the page lays out Check-in, Immigration, Security, "Experience HIA", Boarding and Departure with walking times ("13 min walk from the departure hall") and a live "Current waiting status" for the exact check-in rows assigned to that flight. A Transfer tab does the same for connecting passengers with live crowding for Transfers A, B and C. The homepage repeats the crowd indicators (Departure area, Transfer A, Transfer B) and offers a task search with six quick links. Search is a polished overlay that federates pages, facilities, lounges, shops, news, alerts and live flights.

The site is let down by engineering. From this container the homepage did not reach first paint for 20 to 48 seconds, the load event never fired within 60 seconds, all three Lighthouse runs failed with NO_FCP, and the hero is an 87.8 MB video file. The departures board renders the whole day as more than 1,300 rows because every codeshare is its own row, carries no "last updated" stamp, and decides what "Today" means from the visitor's device clock (a browser set to UTC was shown 16/11 as "Today" while the header clock read 02:59 on the 17th in Doha). Accessibility basics are missing: no visible keyboard focus, no `main` landmark, 1,314 airline logos without alt text on the board, unlabelled inputs. There is no account, saved flight, alert or chatbot on the website, and ancillaries are booked on partner sites. Weighted expert score: **69.0%**.

## Evidence access

- Direct browser access: yes, but slow and occasionally failing. 3 pages captured with the full capture tool (home, flight board, map), 13 pages fetched as HTML, and two Playwright interaction scripts (`direct/raw/bench/hamad-interact.js`, `hamad-interact2.js`) covering keyboard, search, the flight filter and the flight detail page.
- No bot challenge or CAPTCHA was met. Two page loads returned a bare "upstream request failed" body and one HTML request was reset; each succeeded on a later attempt. I cannot tell whether the origin or this container's proxy path caused these, so they are reported but weighted lightly.
- Blocked by this container (not site defects): `www.googletagmanager.com` (three tag containers, so any tag-injected widget such as a chat launcher would not appear), `mapserver.visioglobe.com` (the interactive map engine, so the map canvas never rendered), `api.open-meteo.com` (weather).
- Partner sites not reachable: parking booking (mawaqifqatar.com), Al Maha Services booking, Discover Qatar, Qatar Airways baggage tracker and Fast Pass pages.
- Web search used for: app rating, AI assistant, duty free commerce, Skytrax 2026.

## 1. Homepage above the fold

Page: https://dohahamadairport.com/ `[direct]`

- Desktop: a navy strip (Doha time "03:09 AM | Doha-DOH", Alerts, العربية), logo and six dropdown labels laid over a full-bleed looping video of the terminal's Lamp Bear, and at the bottom of the first screen a search field with a rotating prompt ("Search for Flights / Shops / Restaurants / Lounges / Airport Facilities") above six quick links: Flights, Rent a car, Food & Beverages, Lounges, Meet & Greet, Persons With Disability.
- Immediately below: three live crowd indicators, "DEPARTURE AREA Not crowded", "TRANSFER A Not crowded", "TRANSFER B Not crowded".
- Mobile: Alerts strip, logo with Arabic switch and menu icon, the video, the search field and the quick links in a two-column grid. A cookie banner covers roughly the bottom 28% of the first screen (and the bottom strip on desktop, overlapping the quick links at 900 px height) until "I Agree" is pressed.
- Within five seconds, once painted, a passenger can open flights in one click, start a search, jump to disability support, switch to Arabic or read alerts. There is no headline or text in the hero; the video is the message.
- Further down: Experience HIA (Shop, Dine, Relax, Discover), Experience Qatar (Discover Qatar, Visit Qatar, Hayya), "Things to know before travelling" (Visas, To and From airport, Travel Guide, Security & Customs), attractions, Premium Services (Al Maha, car rentals, Oryx Airport Hotel, lounges, parking), a Skytrax 2027 voting promo and a Hidden Disabilities Sunflower notice.

## 2. Navigation, utilities and footer

`[direct]` https://dohahamadairport.com/

- Primary nav (6): Flights; Experience HIA; Guides; What's On; Experience Qatar; Corporate. Top-level items are `#` toggles that open panels; menu items carry a one-line description.
- Flights: Departures, Arrivals, Cargo, Baggage Tracker (Qatar Airways host).
- Experience HIA: Shop, Dine, Relax, Discover.
- Guides: At the airport (Visa & Immigration, Security & Customs, Fast Pass, Transfers, Check-in Info, Baggage Claims, Interactive Map); Traveler guide (Premium Travelers, Special Assistance, Unaccompanied Minors, Al Maha Services, Traveling with Animals, Travel Updates); To/From the airport (Car Rentals, Limousines, Taxi, Parking, Bus, Metro, Park & Fly Promotion, Ride-Hailing Operators); Amenities (Facilities, Prayer Rooms, Oryx Airport Hotel, Connectivity, Medical & Emergencies, FAQ).
- Utilities: Doha clock, Alerts, language switch (English / Arabic). No account, no text-size or contrast tools. On the inner pages I captured (flight board, flight detail) no search control is visible in the header; search is entered from the homepage widget.
- Footer: Flights links, Other Links (About Us, Airline Development, Press Release, Advertising, Careers), six social channels, App Store and Google Play badges ("Track your flights, Explore Real time navigation on Maps and more"), Privacy Notice, Cookie Policy, Contacts. No sitemap link and no accessibility statement link.

## 3. Flight information

Pages: https://dohahamadairport.com/airlines/flight-status?type=departures&day=today and flight pages of the form https://dohahamadairport.com/airlines/flight-details/223809456 `[direct]`

- Location: nav Flights, the first homepage quick link, the footer, and inside site search.
- Inputs: one text box "Search by flight number, airlines, destinations" that filters as you type (one matching row within about 3 seconds of typing "QR203"); a Departures / Arrivals toggle; previous and next day arrows around the date. No time-band, terminal or airline dropdown.
- Board fields (desktop): FLIGHT (with a "+8 Partners" tooltip listing codeshares), AIRLINE, DESTINATION, DATE, TIME, GATE, STATUS. Mobile cards: airline tail logo, destination, airline, flight number, time, status pill, gate and "Check-in: 3 - 6".
- Status vocabulary seen on departures: Scheduled, Check In Open, Boarding, Last Call, Gate Closed, Departed; gate "Not assigned"; a retimed flight shows both times (01:45 then 02:45).
- Visual treatment: coloured pills with white text. Departed and Boarding green, Check In Open and Scheduled light green, Last Call red, Gate Closed grey. Clear at a glance, although white on light green fails contrast (axe flagged 1,333 contrast nodes on the board).
- Freshness: no timestamp on the board. The flight page has "Last updated: 17 November 2026 - 03:16 AM" with a Refresh link and the note "All flight times are shown in Qatar Standard Time (GMT+3)".
- Volume: the whole day is rendered at once and each codeshare is a separate row, so the page held 1,317 to 1,334 rows, 1,348 images and about 109,000 characters of text; on mobile the page is 115,482 px tall. The same physical flight appears up to nine times.
- Date defect: "Today" follows the visitor's device clock. A browser on UTC was shown "16/11/2026 Today" while the site's own header clock showed 02:59 AM in Doha on the 17th; a browser set to Asia/Qatar was shown 17/11. For a transfer hub whose users are mostly abroad when they check, this is a real accuracy problem.
- Flight page (permanent, shareable URL): flight number over a destination photograph, origin, via point, destination, status pill, date, check-in rows, gate, scheduled and estimated times, airline, aircraft type (for example Boeing 787-8), codeshare partners, gate-closure note, airline and airport phone numbers, and the journey timeline described in section 4. One content slip: the country under Athens was shown in Arabic on the English page.
- Bookmarking and alerts: none on the website. Flight tracking is advertised as an app feature.
- Interactions from homepage to one flight's status: **2** (click the "Flights" quick link, type the flight number). A third click opens the flight page.

## 4. Journey assistance and personalisation

`[direct]` https://dohahamadairport.com/airlines/flight-details/223809456

- The flight page has two tabs, Departures and Transfer, each a vertical timeline.
- Departures: "I'm at" selector (Airport, or one of several dozen named Doha zones such as "Al Jasrah (Zone 1)") then Check-in ("2 min walk from the departure hall", "Current waiting status" for Check in row 3, 4, 5 and 6, each "Not crowded", plus links to check-in info, special assistance, premium travellers, unaccompanied minors), Immigration (walk time, e-gate advice), Security & customs, Experience HIA, Boarding ("13 min walk from the departure hall"), Departure 07:20.
- Transfer: "I'm at Transfer gate", Transfer security ("2 - 10 min walk from the arriving gate", live status for Transfers A, B and C), Experience HIA ("2 min walk after Transfer security" with shop suggestions), Boarding.
- I did not test what changes when a city zone is chosen, so I make no claim about door-to-gate travel time.
- Homepage crowd indicators for Departure area, Transfer A and Transfer B `[direct]`.
- Fast Pass, a facial-recognition journey with Qatar Airways covering bag drop, security gates and boarding, is explained at https://dohahamadairport.com/fast-pass with enrolment on the airline's site `[direct]`.
- No account, saved flights, preferences or dashboard on the website.

## 5. Maps and wayfinding

Page: https://dohahamadairport.com/airport-guide/at-the-airport/maps `[direct, limited]`

- An interactive map (Visioglobe engine) with a search box and separate "Please Search Your Starting Point" and "Please Search Your Destination" fields, which indicates point-to-point routing.
- Facility and service pages carry a "Locate on map" link that opens the map on that place, for example https://dohahamadairport.com/airport-guide/at-the-airport/maps?dst=B01-UL001-IDA0212 from the prayer rooms page.
- The map engine host is blocked here, so I could not see the map, its routes, walking times or step-free options. Null judgement on those.
- Walking times do appear on the flight timeline (section 4).
- In-terminal wayfinding QR codes are reported at https://www.passengerterminaltoday.com/news/displays-signage/hamad-international-rolls-out-digital-wayfinding-qr-codes.html `[search]`.

## 6. Ground transport and parking

Pages: https://dohahamadairport.com/airport-guide/to-from-the-airport and https://dohahamadairport.com/airport-guide/to-from-the-airport/parking `[direct]`

- A hub with eight cards: Car Rentals, Limousines, Taxi, Parking, Bus, Metro, Park & Fly Promotion, Ride-Hailing Operators. No comparison of time or cost across modes and no planner on this page.
- Parking page is specific and current: hourly 15 QAR, daily 145 QAR; Premium Parking tiers (30, 20, 10 QR for the first three hours, 200 QR daily from the fourth hour); Short Stay Valet 100 QAR; Premium Valet 275 QAR per day with porterage and a car wash; long-stay promotions (4-7 days 350 QR, 8-14 days 450 QR, weekend 250 QR); "Pre-Book and save 20%"; EV charging on the ground floor of the East Car Park.
- Booking hands off to https://www.mawaqifqatar.com/booking/site/hia . No live space availability is shown.

## 7. Shopping, dining, e-commerce, services, loyalty

- Shop directory https://dohahamadairport.com/shops : keyword search and 11 categories (Duty Free, Fashion and Accessories, Gold, Watches & Jewelry, Electronics and others), brand list from Adidas to Bvlgari `[direct]`. Catalogue only; nothing can be bought or reserved on the site.
- Dine, Relax (lounges, spa, Oryx Airport Hotel, swimming pool, gym) and Discover (art, The Orchard) sections `[direct, from navigation and homepage]`.
- Bookable services, all on partner sites: Al Maha Services meet and greet in Gold and Platinum tiers ("Book Now" to al-mahaservices.com) from https://dohahamadairport.com/airport-guide/traveler-guide/al-maha-services ; parking pre-booking; Discover Qatar transit tours; car rental `[direct]`.
- No loyalty programme on the airport site. Qatar Duty Free offers "Collect on Return" (https://dohahamadairport.com/shop/collect-return) and accepts Avios through Qatar Airways Privilege Club `[search]`. I found no evidence of online pre-order `[search]`.

## 8. Transit and connection guidance

Page: https://dohahamadairport.com/airport-guide/at-the-airport/transfers `[direct]`

- Explains the single-terminal transfer: transfer halls at concourses A, B, C and D, transfer desks for boarding passes and rebooking (with a map link), security screening, no transit visa needed airside, and how to leave the airport on a long stopover.
- Links onward to the hotel, lounges, dining, shopping, children's facilities and Discover Qatar transit tours.
- The Transfer tab of each flight page adds live transfer-security crowding and walking times (section 4). For a hub airport this is the right emphasis and it is well executed.

## 9. Accessibility

Special assistance content: https://dohahamadairport.com/airport-guide/traveler-guide/special-assistance `[direct]`

- Covers reserved parking, barrier-free access (including lifts at A380 upper-deck gates), adapted check-in counters, a dedicated lounge with a map link, wheelchairs, adapted washrooms, and Hidden Disabilities Sunflower membership (also promoted on the homepage).
- "Persons With Disability" is one of the six homepage quick links, which is unusually prominent.
- Gaps: assistance must be arranged through the airline; the page gives no request form, phone number, lead time or opening hours. One link labelled "airport planner" simply opens the flight board.

Site accessibility, automated checks (axe-core, WCAG A/AA rules) `[direct]`:

| Page | Desktop violations (by impact) | Mobile violations (by impact) |
|---|---|---|
| Home | 1 rule, 3 nodes (1 serious: colour contrast) | 3 rules, 5 nodes (2 critical: button without name, 3 images without alt; 1 serious) |
| Flight board | 4 rules, 2,651 nodes (2 critical: image-alt on 1,314 nodes, aria-required-children; 2 serious: colour contrast on 1,333 nodes, listitem) | 5 rules, 1,320 nodes (3 critical, 2 serious) |
| Map | 1 rule (1 critical: aria-allowed-attr) | 2 rules (2 critical) |

- Landmarks: 0 header, 3 nav, **0 main**, 1 footer. The only `h1` on the homepage is "Looking For Something?", the title of the hidden search overlay.
- Unlabelled inputs: the global search field, the flight filter and the three map search fields rely on placeholders; the mobile menu button has no accessible name and measures about 15 x 31 px.
- Keyboard test, first 12 stops on the homepage: (1) Skip to main content, (2) Alerts, (3) العربية, (4) Home (logo), (5) Flights, (6) Experience HIA, (7) Guides, (8) What's On, (9) Experience Qatar, (10) Corporate, (11) Flights quick link, (12) Rent a car quick link. Skip link: yes. Order: logical. Visible focus: **no**. Every stop reported `outline-style: none` with no box shadow, and the screenshot taken with focus on stop 12 shows no indicator. The hero search field was not among the stops even though it sits above the quick links.
- No accessibility statement was found in the footer or navigation.

## 10. AI assistant, chatbot and search

- No chat launcher, chatbot or messaging link was present in the pages I captured, and the contact page (https://dohahamadairport.com/contact_list) lists phone numbers and email addresses only `[direct]`. Because the site's tag manager containers are blocked here, a tag-injected widget cannot be ruled out `[limited]`.
- The operator won "Best AI Solution" at the Qatar Digital Business Awards 2024 for an AI "Digital Human for Customer Service" at the airport: https://dohahamadairport.com/press-releases/news/matar-awarded-best-ai-solution-qatar-digital-business-awards-2024 `[search]`. The results do not say it is available on the website.
- Search is covered in section 13.

## 11. Languages, mobile web, app

- Languages: English and Arabic. The Arabic site is a true right-to-left build (`lang="ar" dir="rtl"`) at https://dohahamadairport.com/ar `[direct]`.
- Mobile web: no horizontal overflow on the pages captured; flight rows become cards; quick links are large. Problems: the cookie banner takes more than a quarter of the screen, the menu button is small and unlabelled, the flight board is extremely long, and first paint was very slow in the lab `[direct]`.
- App: "HIA Qatar" for iOS and Android, linked from the footer `[direct]`. US App Store listing reported as 4.1 from only 27 ratings: https://apps.apple.com/us/app/hia-qatar/id1037983478 `[search]`; too small a sample to mean much.

## 12. Performance evidence

All figures are **lab, single container, third-party hosts blocked, indicative only**. The route from this container to the origin may be unusually slow, so treat absolute times with caution; page weight and structure are properties of the site.

- Capture timings: homepage desktop TTFB 3.0 s, first contentful paint 23.4 s, DOMContentLoaded 33.5 s, load event not reached in 60 s; homepage mobile TTFB 9.4 s, FCP 48.4 s. Flight board desktop TTFB 7.3 s, FCP 40.4 s. Map page TTFB 3.4 s, FCP 20.6 s, load 35.0 s `[direct]`.
- HTML-only requests for 13 pages: time to first byte between 0.85 s and 7.6 s `[direct]`.
- Lighthouse: three runs, all ended with `NO_FCP`; no valid score (`direct/lighthouse/hamad.json`).
- Page weight: the hero video is a single MP4 of 87,805,224 bytes; a second homepage video is 42.8 MB (both `preload="none"`, the hero is started by script). About 190 requests per page, almost all to the origin.
- Delivery: responses come through Varnish with `Cache-Control: must-revalidate, no-cache, private` and `Age: 0`; no CDN was evident from the headers seen.
- Security headers: `Strict-Transport-Security: max-age=18640000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. No `Content-Security-Policy` header.
- Reliability in this run: two "upstream request failed" pages and one connection reset in roughly 40 requests, cause not established.

## 13. Site search

Tested in the "Looking For Something?" overlay opened from the homepage `[direct]`. The overlay shows an example line ("QR1234, Gate A10, Dubai, Starbucks, Prayer room, Restrooms") and quick-search chips (ATM, Coffee, Currency, Food, Hotel, Lamp bear, Lounges, Prayer room). Results appear as you type, as a list with thumbnails and a preview pane, under category tabs.

- "prayer room": tabs ALL, RELAX, PAGE, LOUNGE, FACILITIES. Results include the Prayer Rooms guide page and three facility records (Female Prayer Rooms, Male Prayer Rooms, Public Mosque), but "Lounges" and "Transfers" rank above them. About 6 seconds to appear here.
- "parking": tabs ALL, PAGE, NEWS, FACILITIES, ALERT. To/From The Airport, Special Assistance, Car Park and Ride-Hailing Operators come first, followed by a long tail of press releases and a "Parking Payment Machines" facility.
- "London": tabs DEPARTURES, ARRIVALS, NEWS, SHOP. A table of today's London flights (flight number, destination, date, time) with each row linking to its flight page. Took 24 seconds to return in this container. Status is not shown in the result row.
- "QR1": departures and arrivals whose number begins QR1, with via points shown.
- Verdict: the best-designed search interface of the two sites and it finds facilities as entities, not only pages. Ranking needs work and press releases crowd passenger answers.

## Scores table

Expert assessment, 1-5 scale with half points. Not an instrumented test.

| Dimension | Weight | Score | Evidence level | Confidence |
|---|---|---|---|---|
| ui: UI aesthetics and brand sophistication | 10% | 4.0 | direct | high |
| ux: UX and task completion efficiency | 20% | 3.5 | direct | medium |
| info: Information comprehensiveness and accuracy | 15% | 3.5 | direct | medium |
| flight: Live flight information and journey assistance | 15% | 4.5 | direct | high |
| mobile: Mobile experience | 10% | 3.0 | direct | medium |
| nav: Navigation, search and accessibility | 10% | 3.0 | direct | medium |
| ai: Personalisation and AI | 10% | 3.0 | direct + search | low |
| commerce: Digital commerce and ancillary revenue | 5% | 3.0 | direct + search | medium |
| perf: Performance, security and reliability | 5% | 2.0 | direct (lab) | low |

Weighted score: (4.0x10 + 3.5x20 + 3.5x15 + 4.5x15 + 3.0x10 + 3.0x10 + 3.0x10 + 3.0x5 + 2.0x5) / 5 = **69.0%**.

Evidence per score:

- **ui 4.0.** Full-bleed video hero, restrained navy and magenta palette, generous spacing, a flight card set on destination photography, coloured status pills, a search overlay with thumbnails and a preview pane, and a matching right-to-left Arabic build. Deductions: the hero has no words, the cookie banner is heavy, and guide pages are plain text.
- **ux 3.5.** Two interactions to a flight's status; quick links that match real tasks; "Locate on map" on facility pages; a flight page that answers "what do I do next". Held back by slow loads, a board flooded with codeshare rows, a wrong "Today" for visitors in other time zones, no header search on inner pages and a large cookie banner.
- **info 3.5.** Solid guides for visas, security, transfers, check-in, baggage, every ground mode and detailed parking prices; facility records down to male and female prayer rooms; live crowd levels. Thinner on special assistance (no request channel), no accessibility statement, some dated links.
- **flight 4.5.** Permanent flight pages with scheduled and estimated times, gate, check-in rows, aircraft type, codeshares and a timestamp; a journey timeline with walking times and live queue status for that flight's own check-in rows; a transfer version; crowd indicators on the homepage. Not a 5 because the board has no timestamp, shows every codeshare as a row, mis-dates "Today", and the web offers no saved flights or alerts.
- **mobile 3.0.** Responsive with no overflow and usable cards; against that a 115,000 px flight page, a banner covering a quarter of the screen, a tiny unlabelled menu button and very slow first paint in the lab.
- **nav 3.0.** Clear labels with descriptions, a skip link, logical tab order and a strong federated search; against that no visible focus, no `main` landmark, unlabelled inputs, 1,314 images without alt on the board, no accessibility statement, no search control on inner pages.
- **ai 3.0.** Context-aware journey timeline keyed to flight and location, and live crowding, are real personalisation without login. No account, saved flights, alerts or chatbot on the web; AI "digital human" is a search-level fact about the terminal. Low confidence because tag-injected widgets could not load.
- **commerce 3.0.** Good ancillary range (parking pre-booking with a 20% incentive and promotions, valet, two-tier meet and greet, transit tours, hotel, lounges) but every transaction leaves the site, the shop directory is a catalogue, and there is no airport loyalty scheme online.
- **perf 2.0.** 87.8 MB hero video, about 190 origin requests per page, uncached HTML, no valid Lighthouse run, first paint of 20 to 48 seconds in this lab. HSTS and basic headers are present, CSP is not. Low confidence on the absolute timings because the network path may be a factor.

## Standout features MAHB must surpass

1. **Flight page as a journey timeline.** Check-in, immigration, security, boarding with walking times and live queue status for that flight's assigned check-in rows. https://dohahamadairport.com/airlines/flight-details/223809456 (pattern `/airlines/flight-details/<id>`, reached from https://dohahamadairport.com/airlines/flight-status?type=departures&day=today)
2. **Transfer mode with live transfer-security crowding** (Transfers A, B, C) and walk times from the arriving gate. Same flight page, Transfer tab; guide at https://dohahamadairport.com/airport-guide/at-the-airport/transfers
3. **Homepage crowd indicators plus a task search with six quick links**, including "Persons With Disability". https://dohahamadairport.com/
4. **Federated search overlay**: pages, facilities, lounges, shops, news, alerts and live flights in one master-detail view. https://dohahamadairport.com/
5. **"Locate on map" from every facility page into a routing map**, and a premium bilingual brand expression with a true RTL build. https://dohahamadairport.com/airport-guide/facilities-services/prayer-rooms and https://dohahamadairport.com/ar

## Weaknesses

1. Performance: an 87.8 MB hero video, uncached pages, no valid Lighthouse run and 20 to 48 second first paint in the lab.
2. Flight board: whole day in one page, one row per codeshare (1,300+ rows), no timestamp, and "Today" taken from the visitor's clock rather than Doha time.
3. Accessibility: no visible keyboard focus, no `main` landmark, 1,314 unlabelled airline logos, contrast failures on status pills, unlabelled inputs and menu button, no accessibility statement.
4. No saved flights, alerts, account or chatbot on the website; ancillaries are booked on partner sites and there is no online loyalty link.
5. Mobile friction: cookie banner over a quarter of the screen, a 15 x 31 px menu button, a 115,000 px flight page; special-assistance page has no request channel.

## Ideas to outperform

1. Build the flight-centred timeline, then make it proactive: compute a "leave by" time from the passenger's origin, live queue and walking time, and push changes through web push or WhatsApp without an app or login.
2. Show crowding as a short forecast (now, +1 h, +2 h) per checkpoint for KLIA Terminal 1 and Terminal 2, not only the current state, and state when it was measured.
3. Fix what Hamad gets wrong on the board: airport-local "today", a timestamp on every list, codeshares grouped under the operating flight, a virtualised list and time-band filters.
4. Match the premium look inside a performance budget: poster image first, an adaptive video under 2 MB, mobile LCP under 2.5 s, CDN caching for HTML.
5. Keep ancillaries on-site: one basket for parking, fast track, lounge and meet and greet attached to the saved flight, with loyalty points.
6. Ship accessibility as a brand value: visible focus, labelled controls, alt text on airline logos, and an assistance request form with lead times on the special-assistance page.

## Gaps

- Interactive map (routing, walking times, step-free routes) not assessed: map engine host blocked.
- Effect of choosing a city zone in "I'm at" not tested.
- Presence of a chat widget cannot be ruled out: tag manager blocked.
- Partner booking flows (parking, Al Maha, Discover Qatar, Fast Pass enrolment, baggage tracker) not tested.
- Dine, Relax and Discover sections seen through navigation and the homepage only; the Alerts page request was reset and not retried.
- Absolute load times may reflect this container's network path; no field data.
- Arrivals board not separately captured; assumed to mirror departures (belt field not verified).
- Hamad's reported withdrawal from the Skytrax 2026 awards is a search-level fact and is not used in scoring: https://euronews.com/travel/2026/03/19/revealed-the-worlds-best-airports-and-airlines-for-2026

## Sources

Direct (this run):
- https://dohahamadairport.com/
- https://dohahamadairport.com/ar
- https://dohahamadairport.com/airlines/flight-status?type=departures&day=today
- https://dohahamadairport.com/airlines/flight-details/223809456 and https://dohahamadairport.com/airlines/flight-details/223809188
- https://dohahamadairport.com/airport-guide/at-the-airport/maps
- https://dohahamadairport.com/airport-guide/at-the-airport/transfers
- https://dohahamadairport.com/airport-guide/traveler-guide/special-assistance
- https://dohahamadairport.com/airport-guide/traveler-guide/al-maha-services
- https://dohahamadairport.com/airport-guide/to-from-the-airport
- https://dohahamadairport.com/airport-guide/to-from-the-airport/parking
- https://dohahamadairport.com/airport-guide/facilities-services/prayer-rooms
- https://dohahamadairport.com/shops
- https://dohahamadairport.com/fast-pass
- https://dohahamadairport.com/contact_list
- https://dohahamadairport.com/discover-qatar
- Raw captures: `docs/research/direct/raw/bench/hamad-*.json`, interaction results `hamad-interact.json`, `hamad-interact2.json`; Lighthouse summary `docs/research/direct/lighthouse/hamad.json`.

Search (not opened):
- https://apps.apple.com/us/app/hia-qatar/id1037983478 (app rating)
- https://dohahamadairport.com/press-releases/news/matar-awarded-best-ai-solution-qatar-digital-business-awards-2024 (AI digital human)
- https://www.passengerterminaltoday.com/news/displays-signage/hamad-international-rolls-out-digital-wayfinding-qr-codes.html (wayfinding QR codes)
- https://dohahamadairport.com/shop/collect-return and https://thepeninsulaqatar.com/article/24/08/2025/did-you-know-of-collect-on-return-service-at-hias-qatar-duty-free (Collect on Return)
- https://www.qatarairways.com/en/Privilege-Club/shop-and-pay-with-qmiles.html (loyalty redemption at Qatar Duty Free)
- https://euronews.com/travel/2026/03/19/revealed-the-worlds-best-airports-and-airlines-for-2026 (Skytrax 2026)

Screenshots: `docs/research/screenshots/hamad-home-desktop.jpg`, `hamad-home-mobile.jpg`, `hamad-flights-desktop.jpg`, `hamad-flights-mobile.jpg`, `hamad-flightdetail-desktop.jpg`, `hamad-search-desktop.jpg`.

# Benchmark: Singapore Changi Airport (www.changiairport.com)

- Benchmark key: `changi`
- Operator: Changi Airport Group (CAG)
- Assessed: 2026-11-16
- Assessment type: **expert assessment** (desk research). These scores are expert judgements, not instrumented tests.
- Client focus for this benchmark: passenger-centric UX, airport experiences, commerce, personalisation (iShopChangi, Changi Rewards, Changi App, AI assistant).

Evidence tags used throughout:
`[direct]` = official page fetched by the researcher in this run (none in this file, see "Evidence access");
`[search]` = stated in a search result or search summary obtained in this run, URL cited;
`[prior]` = researcher background knowledge, NOT re-confirmed in this run, approximate as-of date given, lower confidence;
`[hypothesis]` = inference that needs usability testing or technical access to confirm.

---

## Summary

Changi's digital ecosystem is the strongest commerce-and-loyalty benchmark in the airport sector and one of the strongest for flight-day assistance, but most of its best capability sits in the **Changi App**, not on the website. The website (changiairport.com) is a content-rich, task-labelled guide (Fly, At Changi, Dine & Shop, Experience, Happenings, Changi Rewards, App & Help) with live arrival and departure listings, an interactive map covering all terminals and Jewel, detailed transport, parking, transit and special-assistance content, and a logged-in rewards area. The app adds saved flights with push alerts, take-off-to-landing tracking, Live Activities, baggage and gate information, the Changi Pay e-wallet, bookings, a travel eSIM, and FlightSaver Assurance (an automatic e-voucher payout for delays of 180 minutes or more, launched November 2025 as a trial).

Where MAHB can leapfrog: Changi gates its best journey features behind an app and an account; its content is spread over several hosts and shows visible inconsistencies between pages and language versions; staging hosts (beta, preprod) are publicly indexed; and this research found no evidence of a web ground-transport comparison planner, live parking availability on the web, walking-time or step-free routing on the web map, a site-level accessibility statement, or a generative multilingual AI assistant.

Indicative weighted score: **not computed as a full total** because the performance dimension is scored null (insufficient evidence). Across the eight scored dimensions (95% of the weight) the weighted result is **82.6% of the maximum** (3.925 of 4.75). See "Scores table".

Important limitation: this benchmark is **search-only**. Direct access to the official host was blocked on both attempts, and the shared web-search budget for the workflow ran out after 11 successful searches, so several planned checks (AI assistant news 2025-2026, languages, lounge booking, incidents, awards, Google Play rating) could not be run. Those items are tagged `[prior]` or listed under "Gaps in this benchmark".

---

## Evidence access (direct or search-only)

| Item | Result |
|---|---|
| Direct fetch of `https://www.changiairport.com/en.html` at start (curl through the session proxy) | Blocked: `CONNECT tunnel failed, response 403` |
| Direct fetch retry just before finishing | Blocked again (see final note at the end of this section) |
| WebFetch of third-party sources (apps.apple.com, www.ttgasia.com, www.ishopchangi.com) | Blocked: `getaddrinfo ENOTFOUND` (hosts outside the session allowlist) |
| WebSearch | 11 searches completed, then the workflow-wide search budget was exhausted (7 further queries were refused) |
| Playwright screenshots and navigation timings | **Not captured** (requires direct access) |

Consequences:
- There is **no `[direct]` evidence** in this file. Everything is `[search]`, `[prior]` or `[hypothesis]`.
- Search snippets are index snapshots. The search tool reported that the Changi flight pages and homepage snapshots were roughly 51 to 69 days old at the time of the search (that is, captured around September 2026). Details may have changed.
- No visual inspection was possible, so the UI score rests on prior knowledge only and is low confidence.

Final retry note: a second direct fetch of `https://www.changiairport.com/en.html` was made at the end of the work and was blocked again with the same proxy 403. No further retries were made.

---

## 1. Homepage above the fold

- The homepage title is "Welcome To Singapore Changi Airport" and its search description reads "Get flight status, travel guides, shopping and dining tips, and more!" `[search]` https://www.changiairport.com/en.html
- The homepage carries the main navigation groups, including a "Changi Rewards" group (Benefits & Privileges, Rewards Catalogue, Specials, Events, Changi Monarch, Promotions, Help) and an "App & Help" group (Assistance, Changi App, Contact Information). `[search]` https://www.changiairport.com/
- A flight search widget sits in the hero area with an arrivals/departures switch, so a passenger can look up a flight without leaving the homepage. `[prior]` (as of about 2024-2025, not re-confirmed; low confidence because the site has been rebuilt on a new URL structure since).
- Not verified in this run: the exact hero composition, the number of calls to action, whether there are operational alerts or queue-time indicators above the fold, and what a first-time mobile visitor sees. `[hypothesis]` A hero flight search plus journey-stage shortcuts is the likely pattern; this needs a direct visit to confirm.

What a passenger can do within seconds (best available reading): check flight status, enter a journey-stage guide (arrive, depart, transit), jump to dining and shopping, open rewards, or be routed to the app. `[search]` for the destinations existing in the navigation; `[hypothesis]` for the "within seconds" claim.

## 2. Information architecture

Primary navigation groups and their children, as shown in official page text returned by search:

| Group | Children | Evidence |
|---|---|---|
| Fly | Flight Information, Airline Information, Arrival Guide, Departure Guide, Transiting Guide, Lounges | `[search]` https://www.changiairport.com/en/help.html |
| At Changi | Map, Terminal Guides, Facilities and Services Directory, Transport and Directions, Special Assistance | `[search]` (derived from official URL paths) https://www.changiairport.com/en/at-changi.html |
| Dine & Shop | Dining, Shopping, Changi Pay, Rewards, Shopping Concierge, Shop Online | `[search]` https://www.changiairport.com/en/help/changi-app.html |
| Experience | Attractions, Experiences for Kids, Free Tours | `[search]` https://www.changiairport.com/en/help/changi-app.html |
| Happenings | Events, Promotions | `[search]` https://www.changiairport.com/en/help/changi-app.html |
| Changi Rewards | Benefits & Privileges, Rewards Catalogue, Specials, Events, Changi Monarch, Promotions, Help | `[search]` https://www.changiairport.com/ |
| App & Help | Assistance, Changi App, Contact Information | `[search]` https://www.changiairport.com/ |

- The exact top-level order and whether all seven groups appear in one bar were not confirmed; no single search result showed the full menu. `[search]` (limitation stated by the search summary).
- The labels are verb- or place-led and mostly passenger language ("Fly", "At Changi", "Dine & Shop"), with three journey-stage guides (Arrival, Departure, Transiting) under Fly. `[search]` https://www.changiairport.com/en/help.html
- Corporate content lives on the same host under `/en/corporate/` (for example "Our Story", the media hub and the airport-community newsletter), so passenger and corporate audiences share one domain and one design system. `[search]` https://www.changiairport.com/en/corporate/about-us/the-changi-airport-story/our-story.html
- Utilities:
  - Language and market versions exist as URL prefixes: `/en/`, `/zh/`, and country folders such as `/id/id/`, `/id/en/`, `/au/en/`, `/cn/en/`, `/in/en/`. `[search]` https://www.changiairport.com/zh/help/changi-app/flight-saver-assurance.html , https://www.changiairport.com/id/id/help/changi-app/flight-saver-assurance.html , https://www.changiairport.com/au/en/at-changi/facilities-and-services-directory/jetquay-lounge.html , https://www.changiairport.com/in/en/at-changi.html
  - Account: a "My Rewards" link ("See all your current active rewards.") on the rewards pages implies a signed-in state on the website. `[search]` https://www.changiairport.com/en/rewards.html
  - Site search: a header search exists. `[prior]` (about 2024-2025, not re-confirmed). Quality of results not assessed.
- Footer: not verified in this run (no search result exposed footer content). `[prior]` (about 2024) the footer carried corporate, careers, media, legal and social links; low confidence.
- Legacy and parallel URL structures are still live or indexed: `changiairport.com/en/airport-guide/...`, `changiairport.com/en/transport/transfer-between-terminals.html`, `beta.changiairport.com/...`, `nowboarding.changiairport.com/...` and `media.changiairport.com/...`. `[search]` https://changiairport.com/en/airport-guide/hub-and-spoke/getting-there.html , https://beta.changiairport.com/en/fly/flight-information/arrivals.html , https://nowboarding.changiairport.com/content/jca/en/faqs.html

## 3. Flight information

Website:
- Separate live listing pages exist for arrivals and departures, titled "Changi Airport Arrivals: Live Flight Status" and "Changi Airport Departures: Live Flight Status", under a parent "Flight Information: Arrivals & Departures at Changi Airport". `[search]` https://www.changiairport.com/en/fly/flight-information/arrivals.html , https://www.changiairport.com/en/fly/flight-information/departures.html , https://www.changiairport.com/en/fly/flight-information.html
- The arrivals page describes itself as "ARRIVAL FLIGHT LISTING: Keep track of arriving passenger flights with live updates", with a search function and a tab switch between arrivals and departures. `[search]` https://www.changiairport.com/en/fly/flight-information/arrivals.html
- Search inputs: flight number is confirmed. Search by airline or city was **not** confirmed by any result in this run. `[search]` https://www.changiairport.com/en/help/assistance/faq.html . `[prior]` (about 2024) the web flight search accepted flight number, city or airline; treat as unverified.
- An "Airline Information" page exists (airline to terminal reference). `[search]` https://www.changiairport.com/en/fly/airline-information.html
- Fields shown per flight on the web listing, any flight detail page on the web, and any "last updated" timestamp were not verifiable from search. Not verified.

App (documented on the website's help pages):
- Finding a flight: Fly tab, Flights sub-tab, enter flight number, choose Departure or Arrival, pick a date in the calendar, select the flight. `[search]` https://www.changiairport.com/en/help/assistance/faq.html
- Saving a flight: a "save flight" button on the flight details page subscribes the user to updates; saved flights are listed under "Saved" at the top right of the Flights page and can be removed with "Unsave". `[search]` https://www.changiairport.com/en/help/assistance/faq.html
- Real-time alerts require saving the flight and turning on notifications. `[search]` https://www.changiairport.com/en/help/changi-app/key-travel-features.html
- November 2025 upgrade: track a flight from take-off to landing, see gate and baggage information, see local weather at the destination, receive push notifications, and share tracking with family and friends. `[search]` (article dated 2025-11-03) https://www.ttgasia.com/2025/11/03/changi-app-upgrade-offers-real-time-flight-tracking-and-delay-compensation/ and https://www.passengerterminaltoday.com/?p=46354
- Live Activities: flight tracking "at a glance" on iOS, and release notes also mention Live Activities for Android users. `[search]` https://apps.apple.com/sg/app/changi-app/id391730848
- FlightSaver Assurance: opt in at least 12 hours before departure; S$10 in Changi e-vouchers if a departure from Singapore is delayed by 3 hours or more; payout issued automatically into the Changi account once the system confirms a delay of 180 minutes or more; one issuance per user per calendar month. `[search]` https://www.changiairport.com/en/help/changi-app/flight-saver-assurance.html and TTG Asia (2025-11-03) as above.
  - Trial status: reported to run as a trial until September 2026. That date has passed as of this assessment and the current status was not verified. `[search]` https://www.passengerterminaltoday.com/?p=46354
  - **Conflict recorded**: the Indonesian-language version of the official page describes a S$50 voucher set (ten S$5 e-vouchers), not S$10. The English official page and the press coverage say S$10. The English page is treated as current; the conflict itself is evidence of localisation drift. `[search]` https://www.changiairport.com/id/id/help/changi-app/flight-saver-assurance.html
- CAG's own press headline calls the upgrade a "world-first in airport innovation". This is the operator's claim, not independently verified. `[search]` https://ftnnews.com/travel-news/technology/changi-app-sets-a-world-first-in-airport-innovation-with-upgraded-features/

## 4. Journey assistance and personalisation

- Journey-stage guides on the website: Arrival Guide, Departure Guide (with a "Checking In for Your Flight" page), Transiting Guide. `[search]` https://www.changiairport.com/en/help.html , https://www.changiairport.com/en/fly/departure-guide/checking-in.html
- Account model: the app can be used for "basic/informative features" without a Changi account, and logged-in users get more benefits. `[search]` https://www.changiairport.com/en/help/assistance/faq.html
- Personal dashboard: the app's Account screen shows Changi Rewards points and active rewards such as parking rebates. `[search]` (third-party guide site, treat as aggregator) https://changiguide.com/digital/changi-app/ . The website has an equivalent "My Rewards" entry. `[search]` https://www.changiairport.com/en/rewards.html
- Saved flights with alerts, sharing and delay compensation are the "my flight" equivalent, in the app only. `[search]` https://www.changiairport.com/en/help/changi-app/key-travel-features.html
- CAG states it enhanced its chatbot "to offer tailored experiences for customers on the Changi Airport and iShopChangi websites as well as the Changi app" (Annual Report 2022/23). `[search]` https://www.changiairport.com/content/dam/changiairport/common/pdf/publications/2023/cag-ar22-23%20(full).pdf
- One Changi account works across the website, app, iShopChangi and Changi Rewards. `[prior]` (about 2024, not re-confirmed).
- No evidence found of a web journey planner (for example "leave home by" timing, door-to-gate itinerary), or of flight-contextual recommendations on the website. Not found; could not be searched further.

## 5. Maps and wayfinding

- An official interactive map covers all terminals and Jewel and is used to find shops, facilities and services: "Changi Airport Map: All Terminals & Jewel". `[search]` https://www.changiairport.com/en/at-changi/map.html
- Terminal guides exist per terminal (T1, T2 confirmed in results) with map links. `[search]` https://www.changiairport.com/en/at-changi/terminal-guides.html , https://www.changiairport.com/en/at-changi/terminal-guides/terminal-1.html
- Facility pages deep-link into the map with a "View On Map" link and show opening hours (example: JetQuay Lounge). `[search]` https://www.changiairport.com/au/en/at-changi/facilities-and-services-directory/jetquay-lounge.html
- A "Find your way" section links to guides for getting to Changi, to Jewel and to other terminals. `[search]` https://www.changiairport.com/en/at-changi.html
- A Terminal 2 Sensory Map (PDF, April 2025), produced with Rainbow Centre, marks quieter rest areas and accessible facilities. `[search]` https://www.changiairport.com/content/dam/changiairport/sg/airport/evergreen/changi-terminals/special-assistance/terminal-pdf/Changi-Airport-Sensory-Map-Apr2025-T2.pdf
- Transfer times are published as text, not as map routing: T1, T2 and T3 transfers take five to ten minutes by Skytrain or on foot. `[search]` https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html
- Not found in this run: point-to-point routing with walking times on the web map, blue-dot indoor positioning, AR wayfinding, or a step-free routing option. Third-party SEO pages mention AR wayfinding at Terminal 4 without a source; this is treated as unverified and is not relied on.
- The app includes maps. `[search]` (third-party guide title "Changi App: Flights, Maps, Changi Pay, Baggage & FlightSaver Assurance") https://changiguide.com/digital/changi-app/

## 6. Ground transport planner and parking

Transport (website pages "Leaving Changi Airport: Transport Options" and "Getting to Changi Airport: Transport Options & Directions"):
- MRT: from Changi Airport station (CG2) to Tanah Merah (EW4), then the East West Line; the station serves Terminals 2 and 3; first train 5:31 AM on weekdays and Saturdays, last departure 12:06 AM daily. `[search]` (snapshot date not shown; verify before reuse) https://www.changiairport.com/en/at-changi/transport-and-directions/leaving-the-airport.html
- Bus: services 24, 27, 34, 36, 53, 110 and 858 serve Terminals 1 to 3; 24, 34, 36 and 110 also serve Terminal 4. The search summary noted that results disagree on which buses serve T4. `[search]` https://www.changiairport.com/en/at-changi/transport-and-directions/leaving-the-airport.html
- Taxi: about 30 minutes to the city, S$25 to S$45; this figure came from a page snapshot about two years old. `[search]` (older figure, low confidence) same URL.
- Pre-booked taxis are handled by listing operator hotlines (for example Comfort/CityCab +65 6552 1111), not by an integrated booking flow. `[search]` same URL.
- An editorial article helps choose a transfer type ("How to choose the right airport transfer from Changi Airport"). `[search]` https://www.changiairport.com/au/en/experience/travel-inspiration/how-to-choose-the-right-airport-transfer.html
- No evidence of a comparison planner (mode by time, cost and destination) or of bookable transfers on the website. Not found.

Parking (page "Changi Airport Parking: Locations, Rates & EV Charging"):
- Rates: short-term parking at T1/Jewel (B2M and B2) S$0.65 per 15 minutes for the first 90 minutes, then S$5 per 30 minutes; general parking at T1/Jewel (B3 to B5), T2, T3 and T4 S$0.65 per 15 minutes; Hub & Spoke S$0.60 per 15 minutes; motorcycles S$1.40 per day. `[search]` (snapshot date not shown) https://www.changiairport.com/en/at-changi/facilities-and-services-directory/airport-parking.html
- A fees PDF is labelled "updated as of 1 April 2026" and says rates include 9% GST, but the search tool's metadata showed the document as much older; conflict noted, verify before reuse. `[search]` https://www.changiairport.com/content/dam/changiairport/sg/corporate/evergreen/resources/forms-and-manuals/documents/list-of-fees-and-charges.pdf
- Pre-booking: "Park & Fly" for stays of 24 hours or more, one day from S$42, 30 days S$425 (terms updated 5 September 2025). `[search]` https://www.changiairport.com/en/at-changi/facilities-and-services-directory/park-fly-work.html and https://www.changiairport.com/content/dam/changiairport/sg/airport/evergreen/directories/facilities/park-fly-work/Terms-and-Conditions-for-Park-and-Fly.pdf
- Loyalty-linked parking: Gold members get 1 free hour daily, Platinum 2 free hours; spending S$60 in T1 to T4 public areas (S$80 at Jewel) earns 2 free hours. `[search]` https://www.changiairport.com/en/rewards/members-special/parking-benefits.html
- Monarch members have reserved lots. `[search]` https://www.changiairport.com/en/rewards/monarch.html
- EV charging is covered on the parking page (per the page title). `[search]` https://www.changiairport.com/en/at-changi/facilities-and-services-directory/airport-parking.html
- Live lot availability on the website: not found. The app is reported to include car park information. `[search]` (third-party guide) https://changiguide.com/digital/changi-app/

## 7. Shopping, dining, e-commerce, lounges, loyalty

iShopChangi (separate host, www.ishopchangi.com):
- Travellers can order from 30 days in advance up to 12 hours before the flight, and up to 30 days after arriving in Singapore. `[search]` https://www.ishopchangi.com/en/pages/how-to-shop
- Collection is at iShopChangi Collection Points in the four terminals, with order confirmation, boarding pass and passport. `[search]` https://www.ishopchangi.com/en/support/faq/collection-and-delivery
- **Conflict recorded**: one official FAQ entry says to collect at least one hour before departure, another says collection is possible from 2 hours before scheduled departure. `[search]` same URL.
- Home delivery to a Singapore address is available to non-travellers and travellers; traveller delivery is processed after boarding-pass validation; delivery date 3 to 30 days after the arriving flight. `[search]` https://www.ishopchangi.com/en/pages/home-delivery
- Free delivery threshold: the official site cites S$75 on selected products; third-party sources cite S$59. Conflict noted; the official figure is preferred. `[search]` https://www.ishopchangi.com/en/pages/home-delivery
- Non-travellers get GST-absorbed prices on a select range; duty-free alcohol cannot be delivered within Singapore. `[search]` https://www.ishopchangi.com/en/pages/how-to-shop
- A Shopping Concierge service is offered and is linked from the main site's Dine & Shop menu. `[search]` https://www.ishopchangi.com/en/pages/shopping-concierge

Main site and app commerce:
- "Dine & Shop at Changi Airport's Terminals & Jewel" directory. `[search]` https://www.changiairport.com/en/dine-and-shop.html
- Dining reservations, deals and recommendations through the app. `[search]` https://www.changiairport.com/en/help/changi-app.html
- Changi Pay e-wallet: pay by scanning at participating outlets and earn Changi Rewards points in the same step. `[search]` https://www.changiairport.com/en/help/changi-app.html
- Bookings for events, attractions and premiums around Changi and Jewel in one place ("Book, Redeem & Play"). `[search]` https://www.changiairport.com/en/help/changi-app/book-redeem-play.html
- Travel eSIM purchase and bookable Changi experiences inside the app (release notes for version 3.35.0). `[search]` https://apps.apple.com/us/app/changi-app/id391730848

Changi Rewards:
- Four tiers: Member (no minimum), Gold (S$4,000 accumulated nett spend), Platinum (S$8,000), Monarch (S$25,000, by invitation). `[search]` https://www.changiairport.com/en/rewards/faq.html
- Points per S$10 in a single receipt: Member 10, Gold 20, Platinum 60, Monarch 80. `[search]` https://www.changiairport.com/en/rewards/changi-rewards-terms-and-conditions.html
- A Rewards Catalogue for redemption. `[search]` https://www.changiairport.com/en/rewards/catalogue.html
- **Conflict recorded**: GST-absorbed shopping is presented as an all-tier benefit on the FAQ and rewards landing page, but under Gold and Platinum on the benefits page. `[search]` https://www.changiairport.com/en/rewards/benefits-and-privileges.html

Lounges and fast track:
- "Lounges" is a child of Fly, and lounge facility pages exist (JetQuay). `[search]` https://www.changiairport.com/au/en/at-changi/facilities-and-services-directory/jetquay-lounge.html
- Online lounge booking and any paid fast-track product could not be checked (search budget exhausted). `[prior]` (about 2025) Changi lists pay-per-use lounges and the JetQuay CIP service, and did not sell a public paid fast-track security lane; unverified.

## 8. Transit and connection guidance

- A Transiting Guide sits under Fly. `[search]` https://www.changiairport.com/en/help.html
- "Transfer Between Terminals & Jewel": Skytrain runs 5:00 AM to 2:00 AM; T1, T2 and T3 transfers take five to ten minutes by Skytrain or on foot; travellators (transit side) and link bridges (public side) are open 24/7 when the Skytrain is not running. `[search]` https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html
- Terminal 4: free shuttle buses; the transit-side shuttle runs about every 8 minutes and needs a through-checked itinerary; about 12 minutes to T2 or T3 and 18 to 19 minutes to T1 (two sources differ by one minute). `[search]` same URL.
- Jewel: transit passengers must clear arrival immigration to visit, and at least 5 hours of transit time is recommended. `[search]` https://nowboarding.changiairport.com/content/jca/en/faqs.html
- Free Tours appear under Experience; a free Singapore tour for transit passengers is advertised (2.5-hour tours in older schedules). Current availability and booking rules were not confirmed. `[search]` https://www.changiairport.com/en/help/changi-app.html
- **Stale content recorded**: older airport-guide PDFs (2019-2020) still indexed on the official host give a different Skytrain closing time (2:30 AM). `[search]` https://www.changiairport.com/content/dam/cag/airport-guide/airport-guide-download/lowres/marjun2019/CAG%20AG_English_LoRes.pdf
- No evidence of a flight-specific connection tool (enter inbound and outbound flight, get a route and a minimum-time check). Not found.

## 9. Accessibility and special assistance

Service content (strong):
- A "Special Assistance & Traveller Accessibility Support" hub with sub-pages for invisible disability, reduced mobility and travelling with children. `[search]` https://www.changiairport.com/en/at-changi/special-assistance.html , https://www.changiairport.com/en/at-changi/special-assistance/invisible-disability.html , https://www.changiairport.com/en/at-changi/special-assistance/children.html
- Hidden Disabilities Sunflower lanyard and Singapore's LTA lanyard are recognised; the page is explicit that lanyards do not give escort, fast track or priority. `[search]` https://www.changiairport.com/en/at-changi/special-assistance/invisible-disability.html
- Changi Care Ambassadors are trained by Rainbow Centre and wear a gold "Care" badge. `[search]` same URL.
- Free wheelchairs and strollers; Special Assistance Lanes at immigration where up to four travellers can clear together; advice to notify the airline at booking or at least 48 hours before departure. `[search]` https://www.changiairport.com/cn/en/at-changi/special-assistance/reduced-mobility.html
- The Calm Room, a sensory space in the Terminal 2 departure transit area. `[search]` https://nowboarding.changiairport.com/discover-changi/changi-airport-s-first-sensory-space-the-calm-room.html
- Sensory Map for Terminal 2 (April 2025). `[search]` URL in section 5.

Site-level accessibility:
- No accessibility statement, WCAG conformance claim, or on-site accessibility controls (contrast, text size, reader mode) were found in this run. Not found. Conformance could not be tested without direct access. `[hypothesis]` Site-level accessibility is likely average rather than exemplary, because accessible information is delivered partly as PDF (sensory map) rather than as an interactive, screen-reader-friendly layer; needs an audit to confirm.

## 10. AI assistant, chatbot and messaging

- "MAX" virtual assistant: reported in March 2020 as Changi's AI-powered chatbot for real-time assistance, with core functions of flight information and alerts, things to do at Changi, and lost and found. `[search]` https://techwireasia.com/2020/03/changi-airports-virtual-assistant-seeks-to-make-air-travel-stress-free/
- "Changi Max" rewards chat: a dedicated page "Changi Rewards Chat: Get Help with Changi Max" offers quick answers on points, benefits and redemptions. `[search]` https://www.changiairport.com/en/rewards/rewards-chat.html
- Chatbot enhanced to offer "tailored experiences" on the Changi Airport website, iShopChangi and the app (Annual Report 2022/23). `[search]` URL in section 4.
- Languages supported by the chatbot, any generative-AI upgrade, launch dates after 2023, and messaging channels (WhatsApp, WeChat, Telegram, live chat hours) were **not found**; the searches for these were refused when the search budget ran out. Score for the AI dimension may therefore be understated.

## 11. Languages, mobile web and companion app

Languages:
- Confirmed by URL: English (`/en/`), Chinese (`/zh/`), Bahasa Indonesia (`/id/id/`), plus English market editions for Indonesia, Australia, China and India. `[search]` URLs in section 2.
- Other languages (for example Japanese, Korean, Malay, Tamil, Thai): no evidence in this run. Not found.

Mobile web:
- Not assessed (no direct access). `[hypothesis]` The site is responsive, and the app FAQ's reference to a "bottom navigation menu" describes the app, not the mobile site.
- One App Store reviewer says the website works better than the app. `[search]` https://apps.apple.com/sg/app/changi-app/id391730848?see-all=reviews&platform=iphone

Companion app: **Changi App** (formerly iChangi), publisher Changi Airport Group.
- Store listings: iOS id391730848; Android package `com.changiairport.cagapp`. `[search]` https://apps.apple.com/sg/app/changi-app/id391730848 , https://play.google.com/store/apps/details?id=com.changiairport.cagapp
- Apple App Store ratings (snapshots, storefront-specific, capture date not shown): Singapore 4.7 out of 5 from about 35k ratings; United States 4.6 from about 1K; Australia 4.8 from about 1.7K. `[search]` https://apps.apple.com/sg/app/changi-app/id391730848 , https://apps.apple.com/us/app/changi-app/id391730848 , https://apps.apple.com/au/app/changi-app/id391730848
- Google Play rating: not obtained (search refused).
- Version history seen: 3.35.0 (26 October), 3.34.1 (30 September), 3.34.0 (21 September), 3.33.0 (17 August); the year was not shown in the snippet. `[search]` https://apps.apple.com/us/app/changi-app/id391730848
- Review themes: praise for check-in and gate information; complaints about login problems. `[search]` https://apps.apple.com/sg/app/changi-app/id391730848?see-all=reviews&platform=iphone
- An Apple Watch platform listing URL exists for the app. `[search]` (URL only, feature set not verified) https://apps.apple.com/ch/app/changi-app/id391730848?l=en-GB&platform=watch
- Desktop visitors are sent to the app with a QR-code download page. `[search]` https://www.changiairport.com/en/help/changi-app/download-qr.html
- Features (see sections 3, 4 and 7): saved flights and push alerts, take-off-to-landing tracking and sharing, Live Activities, gate and baggage information, FlightSaver Assurance, Changi Pay, rewards, dining reservations, bookings, travel eSIM, maps, car park information.
- Related CAG apps seen in store results: "Changi Go" and "ONE Changi". `[search]` https://apps.apple.com/us/app/changi-go/id1475242538 , https://apps.apple.com/sg/app/one-changi/id6743378535 . `[hypothesis]` ONE Changi is for the airport community rather than passengers (the main site has a "ONE Changi newsletter" under corporate, airport community).

## 12. Performance, security and reliability

- **No measurement was possible.** Both direct fetches were blocked, so there are no lab timings, no page weight, no security-header check and no screenshots.
- No published performance statistics (for example Core Web Vitals field data) were found. Not found.
- Incident search (outages, breaches) could not be run (search refused). **Absence of incidents in this file is not evidence of a clean record.**
- A dedicated maintenance host exists and states "The Changi Airport website is temporarily unavailable due to maintenance", which shows planned-downtime handling with a holding page. `[search]` https://maintenance.changiairport.com/
- Staging hosts are publicly indexed: `beta.changiairport.com` pages appear in search results alongside production, and the search summary also noted pages on a preprod subdomain. This is a hygiene weakness (duplicate content, risk of users landing on non-production pages). `[search]` https://beta.changiairport.com/en/help/changi-app.html , https://beta.changiairport.com/en/at-changi/special-assistance.html
- Asset paths use `/content/dam/...`. `[hypothesis]` This path convention is typical of Adobe Experience Manager, which would suggest an enterprise CMS; not confirmed.
- App reliability signal: store reviews mention login problems. `[search]` https://apps.apple.com/sg/app/changi-app/id391730848?see-all=reviews&platform=iphone

## 13. Recent relaunches, awards and digital initiatives (2024-2026)

- November 2025: Changi App upgrade with the Save Flight suite and FlightSaver Assurance, trial reported to run until September 2026. `[search]` TTG Asia (2025-11-03) and Passenger Terminal Today, URLs in section 3.
- April 2025: Terminal 2 Sensory Map published. `[search]` URL in section 5.
- September 2025: Park & Fly terms updated (pre-booked parking). `[search]` URL in section 6.
- Website rebuild: the production site now uses a new URL structure (`/en/fly/...`, `/en/at-changi/...`, `/en/dine-and-shop.html`) and a `beta.changiairport.com` copy is indexed, while legacy paths (`/en/airport-guide/...`) still exist. `[hypothesis]` This indicates a website relaunch in roughly 2024-2025; no press coverage of a relaunch was found, and the 2023/24 annual report mentions changiairport.com enhancements but the retrieved text was cut off. `[search]` https://www.changiairport.com/content/dam/changiairport/common/pdf/publications/2024/cag-ar-2324(full).pdf
- Earlier: iChangi was revamped and later renamed Changi App, with customised flight information and restaurant bookings. `[search]` https://www.airportsinternational.com/article/changi-launches-revamped-app , https://www.trbusiness.com/regional-news/asia-pacific/changi-app-launches-with-year-long-draw-and-flights-promotion/243846 . `[prior]` The rename to "Changi App" dates from about 2023.
- Awards: `[prior]` Changi was named World's Best Airport in the Skytrax World Airport Awards 2025 (announced April 2025), its 13th such title. This is an airport award, not a website award, and was not re-confirmed in this run. The 2026 result was not checked.

---

## Scores table

Expert assessment, not an instrumented test. Scale 1 to 5 with half points. Weights as given in the benchmark framework.

| Dimension | Weight | Score | Confidence | Evidence level | Evidence |
|---|---|---|---|---|---|
| ui (aesthetics, brand) | 10% | 4.0 | low | prior | No visual inspection possible in this run. Prior knowledge (about 2024-2025): image-led, restrained, consistent brand across site and app. Search shows one design system spanning passenger and corporate sections on one host (https://www.changiairport.com/en/corporate/about-us/the-changi-airport-story/our-story.html). |
| ux (task completion) | 20% | 4.0 | medium | search | Task-led navigation with Arrival, Departure and Transiting guides (https://www.changiairport.com/en/help.html); live flight listings with search and tabs (https://www.changiairport.com/en/fly/flight-information/arrivals.html); facility pages with hours and "View On Map" (https://www.changiairport.com/au/en/at-changi/facilities-and-services-directory/jetquay-lounge.html). Held back by app-gating of key tasks and by fragmentation across hosts. |
| info (comprehensiveness, accuracy) | 15% | 4.0 | medium | search | Very deep content: parking rates and pre-booking (https://www.changiairport.com/en/at-changi/facilities-and-services-directory/airport-parking.html), transfer times and hours (https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html), special assistance, rewards terms. Accuracy marked down for recorded conflicts: S$10 vs S$50 across languages, GST-absorption tiers, collection timing, stale PDFs. |
| flight (live info, journey assistance) | 15% | 4.5 | medium | search | Live arrival and departure pages; app save-flight alerts, take-off-to-landing tracking, sharing, gate and baggage info, Live Activities, and automatic delay payout (https://www.changiairport.com/en/help/changi-app/flight-saver-assurance.html; https://www.ttgasia.com/2025/11/03/changi-app-upgrade-offers-real-time-flight-tracking-and-delay-compensation/). Not 5.0 because the web experience alone is unverified and the strongest features need the app. |
| mobile | 10% | 4.5 | medium | search | Changi App rated 4.7 from about 35k ratings on the Singapore App Store (https://apps.apple.com/sg/app/changi-app/id391730848); frequent releases; Live Activities; Changi Pay. Mobile web itself not assessed; reviews mention login problems. |
| nav (navigation, search, accessibility) | 10% | 3.5 | low | search | Clear labels and journey-stage structure; language and market editions (zh, id, au, cn, in). Marked down: several parallel hosts and legacy URLs, staging hosts indexed (https://beta.changiairport.com/en/fly/flight-information/arrivals.html), no accessibility statement found, sensory map is a PDF, site search quality unverified. |
| ai (personalisation, AI) | 10% | 4.0 | medium | search | Account-based personalisation with tiered rewards and parking benefits (https://www.changiairport.com/en/rewards/members-special/parking-benefits.html); saved flights; Max chatbot since 2020 (https://techwireasia.com/2020/03/changi-airports-virtual-assistant-seeks-to-make-air-travel-stress-free/) and Changi Max rewards chat (https://www.changiairport.com/en/rewards/rewards-chat.html); chatbot "tailored experiences" across three surfaces (AR 2022/23). No evidence of a generative or multilingual assistant; AI news search could not be run, so this may be understated. |
| commerce (digital commerce, ancillary) | 5% | 5.0 | high | search | iShopChangi pre-order from 30 days to 12 hours before the flight and 30 days after arrival, terminal collection and home delivery, non-traveller GST-absorbed shopping (https://www.ishopchangi.com/en/pages/how-to-shop); four-tier Changi Rewards (https://www.changiairport.com/en/rewards/faq.html); Changi Pay; pre-booked parking (https://www.changiairport.com/en/at-changi/facilities-and-services-directory/park-fly-work.html); eSIM and experience bookings in the app. The sector reference. |
| perf (performance, security, reliability) | 5% | null | low | n/a | **Insufficient evidence.** Nothing was measured (direct access blocked), no published statistics were found, and the incident search could not be run. Only indirect hygiene signals exist: staging hosts indexed (negative), a maintenance holding page (neutral), app login complaints (negative). |

Weighted result:
- Full weighted total: **null** (one dimension is null).
- Eight scored dimensions only (95% of weight): 3.925 of a possible 4.75 = **82.6%**. This partial figure is provided for convenience and must be labelled as excluding performance.

---

## Standout features MAHB must surpass

1. **FlightSaver Assurance and the Save Flight suite.** Save a flight, get push alerts for gate and baggage, follow it from take-off to landing, share the tracking, and receive an automatic e-voucher when a departure is 180 minutes or more late. Why it is good: it turns flight status from a table into a personal service, and it converts a delay (the worst moment in the journey) into spend inside the airport. https://www.changiairport.com/en/help/changi-app/flight-saver-assurance.html
2. **iShopChangi omnichannel retail.** Order from 30 days to 12 hours before a flight, or up to 30 days after arrival; collect in any of four terminals or have it delivered; non-travellers can also buy. Why it is good: it extends the airport's retail window far beyond dwell time and serves residents as well as flyers. https://www.ishopchangi.com/en/pages/how-to-shop
3. **Changi Rewards plus Changi Pay as one loop.** Four tiers, points on every S$10, one scan to pay and earn, and benefits that reach into operations (free parking hours by tier). Why it is good: loyalty is tied to everyday airport tasks, not just shopping, which gives residents a reason to hold an account. https://www.changiairport.com/en/rewards/members-special/parking-benefits.html
4. **Journey-stage guides with concrete transfer facts.** Arrival, Departure and Transiting guides, with operating hours, frequencies and minutes between terminals. Why it is good: it answers "what do I do next and how long will it take" in plain numbers. https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html
5. **Inclusive-travel content for invisible disabilities.** Lanyard recognition with honest limits, trained Care Ambassadors, a Calm Room, special assistance lanes and a sensory map. Why it is good: it goes beyond wheelchair logistics, sets expectations clearly, and was co-developed with a specialist organisation. https://www.changiairport.com/en/at-changi/special-assistance/invisible-disability.html

## Weaknesses (opportunities for MAHB to leapfrog)

1. **The best journey features are app-only and account-gated.** Saving a flight, alerts, live tracking, baggage information, delay payout and the eSIM require the app, and the richer benefits require a login. A visitor on the mobile website, which is where most first-time and foreign passengers start, gets a listing and static guides.
2. **Fragmented estate and visible content drift.** Passengers move between changiairport.com, ishopchangi.com, nowboarding.changiairport.com and legacy paths; staging hosts (beta, preprod) are indexed; and official pages contradict each other (S$10 vs S$50 for the same benefit across languages, GST-absorption eligibility, collection timing, Skytrain hours in old PDFs, a FAQ that still says "iChangi").
3. **No ground-transport comparison or door-to-gate planner on the web.** Transport is described mode by mode with hotlines for taxi booking; no evidence of a planner that compares time and cost by destination, of bookable transfers, or of live car-park availability on the website.
4. **Wayfinding and site-level accessibility lag the service content.** No evidence of walking-time routing, step-free routing or indoor positioning on the web map; the sensory map is a PDF; no accessibility statement or conformance claim was found; language coverage evidenced only for English, Chinese and Bahasa Indonesia.
5. **Assistant appears to be a task and FAQ chatbot, split by topic.** "Max" (2020) and a separate "Changi Max" rewards chat were found; no evidence of a generative, multilingual, flight-aware assistant or of messaging-app channels. (Unverified beyond 2023 because the search could not be run; treat as an opportunity to confirm.)

## Ideas to outperform (not merely copy)

1. **Web-first "My Flight" with no app and no login.** Let a passenger follow a flight from the website in one tap and receive updates by web push, WhatsApp or email, with a shareable link for whoever is collecting them. Offer the app as an upgrade, not a gate.
2. **Door-to-gate planner tied to the flight.** From a flight number and a starting point, show "leave by" time, rail, bus, e-hailing and parking options side by side with time and cost, the right terminal and door, and expected queue and walking time. Changi publishes these facts as separate pages; MAHB can assemble them into one answer.
3. **One structured source of truth with a visible "last updated" stamp on every changeable fact.** Model fares, rates, hours and airline-terminal data as structured content shared by every language and every airport page, so translations cannot drift, and show the date on the page. This directly fixes the inconsistencies recorded for Changi.
4. **A multilingual, flight-aware AI concierge grounded in that content.** One assistant for the whole journey (not one per topic), answering in Malay, English, Chinese and other priority languages, citing the page it used, aware of the user's flight, and handing off to a human when needed. Available on the website and in messaging apps.
5. **Accessible wayfinding as a first-class layer.** Step-free routes with walking times, sensory-friendly places and assistance points on the interactive map itself rather than in a PDF, backed by a published WCAG 2.2 AA statement and audit date.
6. **Network-wide by design.** Changi is one airport. MAHB runs a network of airports `[prior]`, so one account, one flight tracker, one assistant and one reserve-and-collect service that works across every airport in the network (including domestic connections) is something Changi structurally cannot offer.

---

## Gaps in this benchmark (to close when access is available)

- No direct inspection: homepage composition, mobile web, footer, site search, flight listing fields, flight detail page, data-freshness indicators.
- No screenshots and no navigation timings.
- Not searched (budget exhausted): AI assistant developments 2024-2026, chatbot languages and channels, lounge and fast-track booking, full language list, Google Play rating, outage and breach history, 2026 awards.
- FlightSaver Assurance status after the reported September 2026 trial end.

Hosts that would need to be allowed for a full pass: www.changiairport.com, www.ishopchangi.com, apps.apple.com, play.google.com.

---

## Sources

Official (Changi Airport Group), all obtained via search in this run:
- https://www.changiairport.com/ and https://www.changiairport.com/en.html
- https://www.changiairport.com/en/help.html
- https://www.changiairport.com/en/help/changi-app.html
- https://www.changiairport.com/en/help/changi-app/key-travel-features.html
- https://www.changiairport.com/en/help/changi-app/book-redeem-play.html
- https://www.changiairport.com/en/help/changi-app/download-qr.html
- https://www.changiairport.com/en/help/changi-app/flight-saver-assurance.html
- https://www.changiairport.com/zh/help/changi-app/flight-saver-assurance.html
- https://www.changiairport.com/id/id/help/changi-app/flight-saver-assurance.html
- https://www.changiairport.com/en/help/assistance/faq.html
- https://www.changiairport.com/en/fly/flight-information.html
- https://www.changiairport.com/en/fly/flight-information/arrivals.html
- https://www.changiairport.com/en/fly/flight-information/departures.html
- https://www.changiairport.com/en/fly/airline-information.html
- https://www.changiairport.com/en/fly/departure-guide/checking-in.html
- https://www.changiairport.com/en/at-changi.html
- https://www.changiairport.com/en/at-changi/map.html
- https://www.changiairport.com/en/at-changi/terminal-guides.html
- https://www.changiairport.com/en/at-changi/terminal-guides/terminal-1.html
- https://www.changiairport.com/en/at-changi/transport-and-directions/leaving-the-airport.html
- https://www.changiairport.com/en/at-changi/transport-and-directions/getting-to-changi-airport.html
- https://www.changiairport.com/en/at-changi/transport-and-directions/transferring-between-terminals-jewel.html
- https://www.changiairport.com/en/at-changi/facilities-and-services-directory/airport-parking.html
- https://www.changiairport.com/en/at-changi/facilities-and-services-directory/park-fly-work.html
- https://www.changiairport.com/content/dam/changiairport/sg/airport/evergreen/directories/facilities/park-fly-work/Terms-and-Conditions-for-Park-and-Fly.pdf (updated 5 Sep 2025)
- https://www.changiairport.com/content/dam/changiairport/sg/corporate/evergreen/resources/forms-and-manuals/documents/list-of-fees-and-charges.pdf
- https://www.changiairport.com/au/en/at-changi/facilities-and-services-directory/jetquay-lounge.html
- https://www.changiairport.com/au/en/experience/travel-inspiration/how-to-choose-the-right-airport-transfer.html
- https://www.changiairport.com/en/at-changi/special-assistance.html
- https://www.changiairport.com/en/at-changi/special-assistance/invisible-disability.html
- https://www.changiairport.com/en/at-changi/special-assistance/children.html
- https://www.changiairport.com/cn/en/at-changi/special-assistance/reduced-mobility.html
- https://www.changiairport.com/content/dam/changiairport/sg/airport/evergreen/changi-terminals/special-assistance/terminal-pdf/Changi-Airport-Sensory-Map-Apr2025-T2.pdf (April 2025)
- https://www.changiairport.com/en/dine-and-shop.html
- https://www.changiairport.com/en/rewards.html
- https://www.changiairport.com/en/rewards/faq.html
- https://www.changiairport.com/en/rewards/benefits-and-privileges.html
- https://www.changiairport.com/en/rewards/changi-rewards-terms-and-conditions.html
- https://www.changiairport.com/en/rewards/catalogue.html
- https://www.changiairport.com/en/rewards/monarch.html
- https://www.changiairport.com/en/rewards/members-special/parking-benefits.html
- https://www.changiairport.com/en/rewards/rewards-chat.html
- https://www.changiairport.com/en/corporate/about-us/the-changi-airport-story/our-story.html
- https://www.changiairport.com/content/dam/changiairport/common/pdf/publications/2023/cag-ar22-23%20(full).pdf (Annual Report 2022/23)
- https://www.changiairport.com/content/dam/changiairport/common/pdf/publications/2024/cag-ar-2324(full).pdf (Annual Report 2023/24)
- https://www.changiairport.com/content/dam/cag/airport-guide/airport-guide-download/lowres/marjun2019/CAG%20AG_English_LoRes.pdf (2019 guide, stale)
- https://changiairport.com/en/airport-guide/hub-and-spoke/getting-there.html (legacy path)
- https://beta.changiairport.com/en/help/changi-app.html , https://beta.changiairport.com/en/fly/flight-information/arrivals.html , https://beta.changiairport.com/en/at-changi/special-assistance.html (staging host, indexed)
- https://maintenance.changiairport.com/
- https://nowboarding.changiairport.com/content/jca/en/faqs.html
- https://nowboarding.changiairport.com/discover-changi/changi-airport-s-first-sensory-space-the-calm-room.html
- https://www.ishopchangi.com/en/pages/how-to-shop
- https://www.ishopchangi.com/en/pages/home-delivery
- https://www.ishopchangi.com/en/pages/shopping-concierge
- https://www.ishopchangi.com/en/support/faq/collection-and-delivery

App stores:
- https://apps.apple.com/sg/app/changi-app/id391730848
- https://apps.apple.com/us/app/changi-app/id391730848
- https://apps.apple.com/au/app/changi-app/id391730848
- https://apps.apple.com/sg/app/changi-app/id391730848?see-all=reviews&platform=iphone
- https://apps.apple.com/ch/app/changi-app/id391730848?l=en-GB&platform=watch
- https://play.google.com/store/apps/details?id=com.changiairport.cagapp
- https://apps.apple.com/us/app/changi-go/id1475242538
- https://apps.apple.com/sg/app/one-changi/id6743378535

Trade and news media:
- TTG Asia, 2025-11-03: https://www.ttgasia.com/2025/11/03/changi-app-upgrade-offers-real-time-flight-tracking-and-delay-compensation/
- Passenger Terminal Today: https://www.passengerterminaltoday.com/?p=46354
- FTN News (carries CAG release): https://ftnnews.com/travel-news/technology/changi-app-sets-a-world-first-in-airport-innovation-with-upgraded-features/
- AeroTime: https://www.aerotime.aero/articles/changi-app-now-gives-instant-benefits-for-flight-delays-over-3-hours/amp
- TechWire Asia, March 2020: https://techwireasia.com/2020/03/changi-airports-virtual-assistant-seeks-to-make-air-travel-stress-free/
- Airports International: https://www.airportsinternational.com/article/changi-launches-revamped-app
- TRBusiness: https://www.trbusiness.com/regional-news/asia-pacific/changi-app-launches-with-year-long-draw-and-flights-promotion/243846
- Marketing-Interactive: https://www.marketing-interactive.com/Changi-Airport-revamps-iChangi-app-with-new-flight-and-payment-services

Third-party guide (aggregator, lower reliability):
- https://changiguide.com/digital/changi-app/

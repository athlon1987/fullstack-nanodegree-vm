# Benchmark: Dubai International Airport (DXB) - Dubai Airports

- Key: `dubai`
- Official host: www.dubaiairports.ae (301-redirects to the apex host `dubaiairports.ae`)
- Assessed: 2026-11-16
- Assessment type: expert assessment (desk research). These scores are NOT instrumented tests.
- Client focus for this benchmark: global passenger experience, multilingual services (DXB services booking, smart gates, AI/chat assistant, the DXB app or its retirement).

Evidence tags used on every claim:
`[direct]` fetched from the official host by me in this run; `[search]` stated in a search result or search summary obtained in this run (URL cited; I did not open the page); `[prior]` background knowledge not re-confirmed in this run (lower confidence, as-of date given); `[hypothesis]` inference that needs usability testing or technical access.

---

## Summary

Dubai Airports runs a task-led, bilingual (English/Arabic) passenger site for DXB with a twin site for DWC, and has moved its mobile strategy away from a native app towards QR-launched mobile web tools: "Pocket Flights" for live flight information, "DXB Express Maps" for wayfinding and, since July 2026, a "Smart Gates PreCheck" that tells a passenger from a phone camera scan of the passport whether they can use biometric immigration gates [search]. Its strongest digital assets are these scan-and-go tools, an always-on contact operation (phone, WhatsApp, live chat, plus a vendor-reported AI chatbot "DXBChat"), a well-documented accessibility programme ("DXB for All"), and a broad catalogue of bookable premium services (Al Majlis, marhaba, Greet & Go, sleep lounges) [search].

Its weaknesses are the ones the client cares about most. The website language selector offers only English and Arabic for one of the most international passenger bases in the world [search]. The ecosystem is fragmented across at least seven hosts and several vendors with separate registrations [search]. I found no evidence of passenger accounts, saved trips, personalisation or an airport loyalty programme on the passenger site [search, absence of evidence]. The official native app (myDXB) appears to have been withdrawn, per a forum report, leaving app stores populated by unofficial look-alikes [search]. Transit guidance is procedural, without a connection planner or published minimum connection times [search].

Weighted expert score: 3.20 / 5 (64.0%). Confidence is LOW overall because the content host was not reachable from this container and the web-search budget for the session ran out after ten successful queries (see next section).

---

## Evidence access (direct or search-only)

**Effectively search-only.**

| Time (UTC, 2026-11-16) | Action | Result | Level |
|---|---|---|---|
| 12:47 | `curl https://www.dubaiairports.ae/` | Blocked by egress proxy (CONNECT 403). WebFetch: `getaddrinfo ENOTFOUND`. | direct |
| 12:49 | Second attempt, same URL | Host now reachable: `HTTP 301` to `https://dubaiairports.ae/` (apex host). | direct |
| 12:49 | Follow the redirect to `dubaiairports.ae` | Apex host blocked by egress proxy (CONNECT 403). No page content obtained. | direct |
| 12:50 | Seven paths on `www.` (`/`, `/flight-status`, `/home`, `/en`, `/robots.txt`, `/sitemap.xml`, a legacy path) | All `301` to the same path on the apex host. `www.` serves no content itself. | direct |

Consequences:
- No official page was read directly. No Playwright screenshots and no page navigation timings (TTFB, DOMContentLoaded, load, bytes) could be captured, because every page lives on the apex host `dubaiairports.ae`, which is not on the allowlist. To fix this, allow `dubaiairports.ae` (apex) and, for the flight tool, `dxb.pocketflights.com`.
- WebSearch: 10 queries returned results; a further 6 planned queries (flight-status detail, Pocket Flights features, maps detail, contact-centre languages, myDXB retirement, Prototype case study) were refused because the session-wide search budget was exhausted. I did not work around that limit. Items that those queries would have covered are listed under "Gaps".
- All `[search]` claims come from search-engine snippets or summaries of the cited pages. Snapshot age is not always known; rates and schedules must be re-verified before reuse.

---

## 1. Homepage above the fold

- The DXB homepage (`/home`, titled "Dubai International (DXB)") presents itself as the place for "flight information, services, facilities, and more" [search] https://dubaiairports.ae/home
- A flight status section sits on the homepage with a day-by-day date picker; in the cached snapshot it showed no departures or arrivals, i.e. the flight list is loaded client-side and is empty to crawlers [search] https://dubaiairports.ae/home
- The homepage menu exposes four task groups (Flights, Transport, Experiences, Information) plus a maps entry promoting DXB Express Maps [search] https://dubaiairports.ae/home , https://dubaiairports.ae/maps-home
- A "What's on at DXB" campaign page exists and is likely promoted from the homepage [search for the page; hypothesis for its homepage placement] https://dubaiairports.ae/campaigns/what-is-on-at-dxb
- What a passenger can do within seconds: check today's arrivals/departures, jump to transport, shops/dining, or key information [search]. Whether the hero accepts a typed flight number/city directly, and how many taps it takes on mobile, could not be verified [hypothesis; needs direct access].
- Not verified: hero imagery, visual hierarchy, banner/alert treatment, cookie consent, chat launcher position [gap].

## 2. Information architecture

Primary navigation labels and children, as reported from the cached homepage [search] https://dubaiairports.ae/home :

| Group | Children |
|---|---|
| Flights | Arrivals, Departures, Airlines |
| Transport | Taxi, Metro, Bus, Car parking, Rent a car |
| Experiences | Shops, Restaurants, Hotels, Relax & refresh, Services |
| Information | Passport control and visas, Security and customs, Baggage, Transfers, Special assistance, Airport maps |

- Utilities: language selector with two options, "EN - English" and "AR - Arabic" [search] https://dubaiairports.ae/ . Site search and account/login utilities were not evidenced in any result [gap]; I found no sign of a passenger account on the main site [search, absence of evidence].
- Other first-level pages evidenced: FAQs, Contact information, Smart gates, DXB Maps, campaign pages [search] https://dubaiairports.ae/faqs , https://dubaiairports.ae/contact-information , https://dubaiairports.ae/smart-gates , https://dubaiairports.ae/maps-home , https://dubaiairports.ae/campaigns/wamtwd
- URL design: flat, readable paths (`/flight-status`, `/transport/car-parking`, `/information/transfers`) [search]. Oddity: lounges, VIP services, meet-and-greet and hotels are all filed under `/experiences/shops/details/...` (for example `/experiences/shops/details/al-majlis`, `/experiences/shops/details/marhaba-lounge`, `/experiences/shops/details/jumeirah`), so the URL taxonomy does not match the menu taxonomy [search] https://dubaiairports.ae/experiences/shops/details/al-majlis
- Multi-site estate [search]:
  - DXB passenger site: `dubaiairports.ae`
  - DWC passenger site with the same structure: `dwc.dubaiairports.ae` (for example https://dwc.dubaiairports.ae/transport/taxi )
  - Media centre: `media.dubaiairports.ae`
  - Al Majlis VIP booking: https://dxbalmajlis.dubaiairports.ae/ and the legacy portal https://servicesedge.dubaiairports.ae/MajlisBooking
  - Live flight platform: `dxb.pocketflights.com`
  - Food ordering: DXBmore.com (see section 7)
- Legacy and non-production URLs are still indexed by search engines: a `www.dubaiairports.ae/gatsby-corporate/public/corporate/...` URL titled "404", an old-IA URL `/before-you-fly/to-from-the-airport/by-bus`, a `dev-dxbalmajlis.dubaiairports.ae` host and a `corporate-auth.dubaiairports.ae` host [search] https://www.dubaiairports.ae/gatsby-corporate/public/corporate/about-us/dubai-international-(dxb)/ , https://dev-dxbalmajlis.dubaiairports.ae/passengers/information/transfers , https://corporate-auth.dubaiairports.ae/transport/bus . The `gatsby-corporate` path suggests a Gatsby static build was used at some point [hypothesis].
- Footer contents: not evidenced [gap].

## 3. Flight information

- Official page "Flight Information" at `/flight-status` offers "real-time information, including arrivals, departures, delays, and more" [search] https://dubaiairports.ae/flight-status
- Menu provides Arrivals, Departures and an Airlines directory [search] https://dubaiairports.ae/home
- Homepage flight module has a day-by-day picker [search] https://dubaiairports.ae/home
- A second, mobile-first flight product exists: "Pocket Flights", described by news media as "DXB's live flight information platform", at `dxb.pocketflights.com`, opened in a phone browser with no app download and reachable by scanning QR codes placed in terminals and at boarding gates [search] https://gulfnews.com/uae/dubai-airport-launches-instant-smart-gates-eligibility-check-for-travellers-1.500618859 , https://www.khaleejtimes.com/uae/dubai-dxb-new-tool-pre-check-smart-gates
- Pocket Flights also hosts the "Smart Gates PreCheck" (section 10/13), so the flight tool doubles as a journey-services shell [search] https://economymiddleeast.com/news/dubai-airports-rolls-out-smart-gates-eligibility-pre-check-tool-to-ease-travel-journey/
- Third-party boards for DXB show Scheduled, Actual, Flight, Destination, Airline, Terminal, Gate and Status columns; the official board's exact columns were not verified [search, aggregator; official fields are a gap] https://www.flightstats.com/v2/flight-tracker/departures/DXB
- NOT verified in this run [gap]: accepted search inputs (flight number / city / airline / route), flight detail page contents, bookmarking or "track my flight", push/WhatsApp/email notifications, "last updated" freshness stamp, codeshare handling, baggage belt and check-in counter fields.
- Relationship between the website board and Pocket Flights (same data source? deep links between them?) is unknown [hypothesis: two front ends on one AODB feed].

## 4. Journey assistance and personalisation

- No evidence of a logged-in "my flight" dashboard, saved trips, or recommendations on `dubaiairports.ae` in any result [search, absence of evidence]. Treat as "not found", not "confirmed absent".
- Journey assistance is delivered as stateless scan-and-go tools instead: Pocket Flights (flight), DXB Express Maps (wayfinding) and Smart Gates PreCheck (immigration eligibility) [search] https://dubaiairports.ae/maps-home , https://www.khaleejtimes.com/uae/dubai-dxb-new-tool-pre-check-smart-gates
- An accessibility "Travel Planner", described as an online visual guide to help guests prepare for their journey, is offered for People of Determination [search; reported in Dubai Airports accessibility press releases, see section 9] https://dubaiairports.ae/campaigns/wamtwd
- An agency lists a "Dubai Airports Flight Planner" project; I have only the title, no description or launch status [search, vendor, title only] https://www.prototype.ae/our-work/dubai-airports-flight-planner
- Accounts exist only inside sub-services: the Al Majlis booking platform requires its own registration, and users of the old portal had to register again after 10 April 2025 [search] https://servicesedge.dubaiairports.ae/MajlisBooking

## 5. Maps and wayfinding

- "DXB Maps" page on the official site promotes DXB Express Maps for finding terminals, gates, lounges and restaurants [search] https://dubaiairports.ae/maps-home
- DXB Express Maps launched around 27 March 2025, ahead of the Eid peak (3.6 million travellers forecast). A passenger scans a QR code shown on any flight information screen and gets real-time navigation on their phone [search] https://dubaipeople.ae/2025/03/28/dxb-express-maps-dubai-airport-launches-smart-navigation-tool/ , https://curlytales.com/what-is-the-dxb-express-map-launched-by-dubai-airport-ahead-of-the-eid-rush/ (blogs/lifestyle media relaying the Dubai Airports announcement)
- Reported coverage: gates, dining and shopping outlets, lounges, restrooms, customer service desks [search] https://dubaipeople.ae/2025/03/28/dxb-express-maps-dubai-airport-launches-smart-navigation-tool/
- Alongside the launch, Dubai Airports "introduced clearly marked routes for passengers with disabilities" [search, same sources]. Whether the digital map computes step-free routes is not stated [gap].
- Not stated in any source: indoor positioning technology (blue-dot vs. "you are here" from the scanned screen), walking-time estimates, AR, offline use, languages [gap]. Because the QR is on a fixed screen, the start point can be known without positioning hardware [hypothesis].
- Walking times are published in static form for car parks (Car Park A about 2-5 minutes, Car Park B about 7-12 minutes to the terminal) [search] https://dubaiairports.ae/transport/car-parking

## 6. Ground transport and parking

Rates below are as shown in search snapshots obtained 2026-11-16; the page's own last-updated date was not visible. Re-verify before quoting.

- Transport section pages: Taxi, Metro, Bus, Car parking, Rent a car [search] https://dubaiairports.ae/home
- Parking [search] https://dubaiairports.ae/transport/car-parking :
  - Premium Car Park A (about 2-5 minutes' walk) and Economy Car Park B (about 7-12 minutes' walk, depending on terminal).
  - Terminal 1 premium: AED 5 for 5 minutes, AED 40 up to 2 hours, AED 125 per day. Terminal 1 economy: AED 25 per hour, AED 85 per day. Terminal 2 and 3 tariffs differ and are tabulated per terminal.
  - Payment by QR code on the ticket or at automatic pay stations; Salik accepted where balance is sufficient.
  - Online pre-booking is via a third party, Mawgif.
  - Two hours' complimentary parking for People of Determination, with accessible bays near entrances (card may need to be shown) [search] https://dubaiairports.ae/faqs
- Taxi [search] https://dubaiairports.ae/transport/taxi : 24/7 ranks at every terminal; AED 25 starting fare; Dubai Taxi Company is the exclusive provider and is booked on its own site; Uber, Careem and Bolt are mentioned; wheelchair-accessible taxis at Terminal 3 Arrivals with pre-booking recommended.
- Metro page exists ("Dubai Metro at DXB") [search] https://dubaiairports.ae/transport/metro ; fares, hours and bus routes for DXB were not captured [gap].
- No evidence of a multi-modal comparison planner (time/cost by mode), live parking availability, or in-site parking checkout [search, absence of evidence].
- Sister site comparison: DWC lists free parking and bus routes F55 (to Expo Metro) and N55 (to Ibn Battuta) [search] https://dwc.dubaiairports.ae/transport/car-parking , https://dwc.dubaiairports.ae/transport/bus

## 7. Shopping, dining, e-commerce, bookings, loyalty

- Shops and Restaurants directories filter by terminal, location or category [search] https://dubaiairports.ae/experiences/shops , https://dubaiairports.ae/experiences/restaurants
- Each outlet has a detail page (for example Dubai Duty Free) [search] https://dubaiairports.ae/experiences/shops/details/dubai-duty-free
- Bookable services reached from the site [search]:
  - Al Majlis VIP service with "BOOK NOW", on a dedicated platform https://dxbalmajlis.dubaiairports.ae/ ; a new reservation system replaced the old e-Services portal on 10 April 2025; old credentials do not work and changes to legacy bookings go through the Al Majlis office by email https://dubaiairports.ae/experiences/shops/details/al-majlis , https://servicesedge.dubaiairports.ae/MajlisBooking
  - marhaba Meet & Greet with fast-track immigration (arrival or departure), optional chauffeur, plus Elite, VIP, Family, Check-in Anywhere and Transfer products, each with "Book now" https://dubaiairports.ae/experiences/shops/details/marhaba-meet-greet
  - marhaba Lounge (Terminals 1 and 3) with booking https://dubaiairports.ae/experiences/shops/details/marhaba-lounge
  - DXB Greet & Go at Terminal 3 Arrivals https://dubaiairports.ae/experiences/shops/details/dxb-greet-go
  - Plaza Premium Lounge, Sleepover lounges, Jumeirah hotel booking https://dubaiairports.ae/experiences/shops/details/plaza-premium-lounge , https://dubaiairports.ae/experiences/shops/details/sleepover , https://dubaiairports.ae/experiences/shops/details/jumeirah
- Food ordering: "DXB&more" with Servy, an order service needing no app, opened from the Wi-Fi landing page, QR codes in the terminal or DXBmore.com; Terminal 3 at launch. Launch date and current status not captured [search, trade press] https://www.airportsinternational.com/article/dubai-airports-and-servy-launch-dxbmore
- Wi-Fi portal as a commerce/engagement surface: an agency reports more than 1 million active users per month on the DXB Wi-Fi portal it designed [search, vendor claim] https://prototype.ae/our-work/dubai-airport-wifi-website
- Reserve-and-collect for duty free: Dubai Duty Free operates its own separate online shop with collect-at-airport [prior, as of about 2024, not re-confirmed].
- Loyalty: no airport-wide loyalty programme was evidenced [search, absence of evidence]; I am not aware of one comparable to Changi Rewards [prior, as of mid-2026, low confidence].
- Bookings hand off to operators (Mawgif, marhaba, Dubai Taxi Company, Jumeirah, Al Majlis platform); there is no evidence of a single basket or single sign-on [search for the handoffs; hypothesis for the absence of a unified basket].

## 8. Transit and connection guidance

- "Transfers at Dubai Airport" page [search] https://dubaiairports.ae/information/transfers :
  - Explains the three terminals; Terminal 3 concourses are described as primarily used by Emirates, flydubai, United and Air Canada (as summarised from the page; verify).
  - Walk between B and C gates; airport train to A gates.
  - Separate-ticket connections: passengers who need no visa or hold one clear passport control, collect bags and check in again; those without a visa get bag-transfer help from marhaba at the transfer desk.
  - DXB to DWC: clear immigration, collect bags, then taxi, or Metro to Ibn Battuta and bus onward; "allow sufficient time".
- No passenger-facing minimum connection time, no connection-time calculator and no gate-to-gate walking estimates were found [search, absence of evidence].
- Press note on DWC-DXB links exists [search] https://media.dubaiairports.ae/full-transport-links-running-between-dwc-and-dxb/
- Paid connection help is routed to marhaba and to lounges/sleep pods (section 7) [search].

## 9. Accessibility and special assistance

Content and programme (strong, mostly self-reported by Dubai Airports) [search]:
- "DXB for All" hub page https://dubaiairports.ae/campaigns/wamtwd and "Special assistance" under Information https://dubaiairports.ae/home
- Attribution note: the facts in the next five bullets were reported in a search summary of Dubai Airports press releases without tying each figure to one release; the releases are listed after the bullets. Verify each figure against its release before quoting.
- Sunflower Lanyard programme for hidden disabilities: priority lanes and an autism-friendly route through check-in, passport control, security and boarding; staff wearing sunflower pins; 36,040 lanyards distributed by end of 2025.
- Hearing loops at more than 520 touchpoints; a quiet, sensory-friendly Assisted Travel Lounge in Terminal 2.
- Strategy pledge: make DXB "the world's most accessible airport by 2035".
- ACI Accessibility Enhancement Accreditation (2022) and an autism-friendly certificate from Dubai Autism Center (November 2022); MoU with Dubai Autism Center.
- "Travel Planner": an online visual guide that helps guests prepare for their journey.
- Press releases behind the five bullets above: https://media.dubaiairports.ae/dxb-marks-a-milestone-in-dubais-accessibility-ambition/ , https://media.dubaiairports.ae/dubai-airports-sets-new-standards-for-accessible-travel-with-dxbs-first-assisted-travel-lounge/ , https://media.dubaiairports.ae/dubai-airports-launches-next-phase-of-accessibility-strategy-pledging-to-make-dxb-the-worlds-most-accessible-airport-by-2035/ , https://media.dubaiairports.ae/dubai-airports-signs-mou-with-dubai-autism-center-to-make-travel-more-inclusive-at-dxb/ , https://media.dubaiairports.ae/dxb-receives-aci-accessibility-accreditation-for-its-commitment-to-inclusive-travel/ . The newest of these was about six weeks old at search time.
- Practical services: two hours' free parking, wheelchair-accessible taxis at T3 Arrivals, wheelchair services, assistance at customs and immigration https://dubaiairports.ae/faqs , https://dubaiairports.ae/transport/taxi

Site-level accessibility:
- No evidence found of a published accessibility statement, WCAG conformance level, or on-site accessibility controls (contrast, text size, reader mode) [gap; could not audit without direct access].
- The flight list rendering empty in a cached snapshot suggests client-side rendering of the core task; screen-reader behaviour of that module needs testing [hypothesis].

## 10. AI assistant, chatbot and messaging channels

- Official contact page lists phone, a WhatsApp support link (`wa.me/97142245555`) and live chat [search] https://dubaiairports.ae/contact-information
- A DXB post on X (ID decodes to 3 March 2026) told passengers to use only the official channels, call +971 4 224 5555, WhatsApp and Live Chat, noting "a high volume of enquiries" [search for the post; date derived from the post ID by me] https://x.com/DXB/status/2028800360798978338
- "Always-on" customer contact centre set up with Teleperformance, with WhatsApp announced as coming soon at the time (report c. 2024; exact date not captured) [search] https://www.khaleejtimes.com/business/aviation/dubai-airports-new-always-on-customer-contact-centre-to-soon-provide-support-through-whatsapp
- AI chatbot: vendor Enterprise Bot published a signing-ceremony video about "DXBChat", an AI-powered chatbot for traveller assistance at DXB, built with AMAN Consultancy and Technology over about seven months. Published roughly January 2025 (derived from the result's age). Single vendor source; no official launch statement, capability list or language list found [search, vendor] https://m.youtube.com/watch?v=fpmZCTSsL_Q
- Whether the live chat and WhatsApp channels are AI-first, human, or hybrid, and which languages they serve, is unknown [gap].
- Smart Gates Eligibility PreCheck (rule/biometric-record check, not conversational AI) was launched with GDRFA in July 2026 on Pocket Flights: open `dxb.pocketflights.com`, choose "Smart Gates PreCheck", scan the passport photo page with the phone camera, get an instant result; also reachable at `dxb.pocketflights.com/scan-passport` and by terminal QR codes [search] https://www.khaleejtimes.com/uae/dubai-dxb-new-tool-pre-check-smart-gates , https://x.com/DubaiAirports/status/2080584593854591439 (post ID decodes to 24 July 2026)
- Smart Gates content page: eligible groups include UAE and GCC nationals, UAE residents, visa-on-arrival passengers and returning tourists with biometric passports; minimum height 1.2 m; no advance registration; registered passengers pass by "simply looking at the green light" [search] https://dubaiairports.ae/smart-gates , https://gulfnews.com/living-in-uae/visa-immigration/how-dubai-airport-travellers-can-check-smart-gates-eligibility-online-before-flying-1.500614012 . GDRFA runs a separate inquiry form https://www.gdrfad.gov.ae/en/smart-gate-inquiry
- Physical AI (context, not website): AI-powered immigration corridor under GDRFA's "Unlimited Smart Travel", August 2025, about 14 seconds per traveller, up to 10 people at once, initially in Terminal 3 First and Business lounges [search] https://idtechwire.com/dubai-international-airport-launches-worlds-first-ai-immigration-corridor/ , https://www.newsonair.gov.in/dubai-launches-ai-powered-passenger-corridor-to-clear-immigration-in-seconds

## 11. Languages, mobile web and the companion app

Languages:
- Website language selector: "EN - English" and "AR - Arabic" only [search] https://dubaiairports.ae/ ; Wikidata likewise records `/en` and `/ar` versions [search] https://www.wikidata.org/wiki/Q193439
- No Chinese, Russian, Hindi/Urdu, French or other versions were evidenced [search, absence of evidence].
- Contrast with the physical airport: automated boarding announcements in up to 25 languages, including English, Arabic, French, Spanish, Russian and Chinese (older report, about 2018 [prior for the year]) [search] https://www.khaleejtimes.com/business/aviation/dubai-airports-to-make-automated-announcements-in-25-languages , https://simpleway.global/our-work/dubai-international-airport
- Languages of Pocket Flights, DXB Express Maps, live chat and WhatsApp: unknown [gap].

Mobile web:
- Agencies describe the current site as a mobile-first redesign with clearer information architecture, aligned with the Al Majlis booking system (Koos, title "Improved Digital Experience by 83%"; the basis of the 83% figure is not explained) [search, vendor claim] https://koos.agency/project/dubai-airports-improved-digital-experience/
- A designer's case study says the previous site suffered from cluttered navigation, inconsistent design and a lack of premium feel; three UI concepts were produced and the client picked a mobile-first one [search, vendor claim] https://irynaux.studio/projects/dxb
- A design system built on atomic design principles underpins the digital channels [search, vendor claim] https://www.prototype.ae/our-work/dxb-design-system , https://prototype.ae/our-work/dubai-airports-website
- The mobile experience is deliberately web-based: Pocket Flights, Express Maps, PreCheck and DXB&more all run in the phone browser from a QR scan, with no install [search] (sources in sections 3, 5, 7, 10).
- No measured mobile quality data (Lighthouse, Core Web Vitals) obtained [gap].

Companion app:
- Dubai Airports launched an official app, "myDXB", for Apple and Android with flight and gate information and wayfinding across three terminals [search] https://moodiedavittreport.com/dubai-airports-launches-mydxb-app-for-apple-and-android-devices/ (launch year about 2013 [prior])
- A Tripadvisor thread from April 2025 asks whether the app was discontinued; a reply says "myDXB" has been removed [search, forum, not official] https://www.tripadvisor.com/ShowTopic-g1-i10702-k15312848-Dubai_Airport_App-Air_Travel.html
- No official retirement announcement and no current official app listing were found; store ratings for an official app are therefore not available [search, absence of evidence].
- App stores carry third-party apps using the DXB name, for example "DXB Dubai Airport" (App Store id6761137667) and "Dubai Airport (DXB) Info" (id603118781; Google Play `com.frugalflyer.airport.dxb`), the latter with a reviewer calling it a fake, ad-driven app [search] https://apps.apple.com/sa/app/dxb-dubai-airport/id6761137667 , https://play.google.com/store/apps/details?id=com.frugalflyer.airport.dxb&hl=en
- Reading: Dubai Airports has substituted QR-launched web apps for a native app [hypothesis, consistent with the evidence above].

## 12. Performance, security and reliability

Measured by me (single-run lab observation from a cloud container; third-party asset hosts may be blocked so rendering may be incomplete; not field data). These relate ONLY to the `www.` redirect, not to any page:
- `https://www.dubaiairports.ae/*` answers `HTTP/2 301` to the same path on `https://dubaiairports.ae/` [direct].
- Response headers on that redirect: `server: cloudflare`, `cf-cache-status: HIT`, `cache-control: public, max-age=0, s-maxage=240`, `alt-svc: h3=":443"` (HTTP/3 advertised) [direct].
- No `Strict-Transport-Security` header was present on that redirect response; the apex host's headers could not be checked [direct for the observation; no conclusion about the apex].
- Time to first byte for the redirect across eight requests: 0.08 s to 0.89 s through the session proxy [direct].
- No page-level timings, transfer sizes or screenshots were possible (apex host blocked).

Other evidence:
- Core flight list was empty in the crawler snapshot of the homepage, implying client-side data loading; fine for users, weak for no-JS resilience and SEO of live data [search for the observation; hypothesis for the implication] https://dubaiairports.ae/home
- Search engines index a "404" legacy URL and non-production hosts (`dev-dxbalmajlis`, `corporate-auth`), a hygiene and information-exposure concern [search] (URLs in section 2).
- Operational disruption handling: in early March 2026 (date derived from the post ID) the airport pushed passengers to phone, WhatsApp and live chat via X because of "a high volume of enquiries" [search] https://x.com/DXB/status/2028800360798978338 . A "Media Advisory - Guidance for customers departing DXB" exists in the media centre (date not captured) [search] https://media.dubaiairports.ae/media-advisory---guidance-for-customers-departing-dxb/ . My background knowledge links this period to regional airspace disruption in the Gulf [prior, as of mid-2026, low confidence, not re-confirmed].
- Record rainfall on 16 April 2024 flooded DXB and disrupted operations for days [prior, as of 2024, not re-confirmed in this run].
- No published uptime, Core Web Vitals or traffic statistics for the website were found [gap].

## 13. Relaunches, awards and digital initiatives (2024-2026)

| When | Initiative | Level and source |
|---|---|---|
| c. 2024 | "Always-on" customer contact centre with Teleperformance; WhatsApp channel announced | [search] https://www.khaleejtimes.com/business/aviation/dubai-airports-new-always-on-customer-contact-centre-to-soon-provide-support-through-whatsapp |
| 2024 | GDRFA "Travel Without Borders" unveiled at GITEX Global 2024 | [search] https://idtechwire.com/dubai-international-airport-launches-unlimited-smart-travel-for-rapid-biometric-immigration/ |
| c. Jan 2025 | Enterprise Bot partnership for the "DXBChat" AI chatbot | [search, vendor; date derived] https://m.youtube.com/watch?v=fpmZCTSsL_Q |
| 27 Mar 2025 | DXB Express Maps (QR wayfinding from flight screens) | [search] https://dubaipeople.ae/2025/03/28/dxb-express-maps-dubai-airport-launches-smart-navigation-tool/ |
| 10 Apr 2025 | New Al Majlis reservation platform | [search] https://servicesedge.dubaiairports.ae/MajlisBooking |
| c. 2025 | Website UX redesign (mobile-first, clearer IA) reported by agencies; no official launch date found | [search, vendor; date approximate] https://koos.agency/project/dubai-airports-improved-digital-experience/ |
| Aug 2025 | AI immigration corridor, Terminal 3 premium lounges | [search] https://www.newsonair.gov.in/dubai-launches-ai-powered-passenger-corridor-to-clear-immigration-in-seconds |
| End 2025 | 36,040 sunflower lanyards distributed; hearing loops at 520+ touchpoints; Assisted Travel Lounge in T2 | [search; Dubai Airports press releases, see section 9] https://media.dubaiairports.ae/dxb-marks-a-milestone-in-dubais-accessibility-ambition/ |
| 2025-2026 | Accessibility strategy next phase: most accessible airport by 2035 (release date not captured) | [search] https://media.dubaiairports.ae/dubai-airports-launches-next-phase-of-accessibility-strategy-pledging-to-make-dxb-the-worlds-most-accessible-airport-by-2035/ |
| 2026 | Khaleej Times headline: new mobile immigration service clears travellers in 12 seconds (details not verified) | [search, headline only] https://www.khaleejtimes.com/uae/dubai-airports-entry-exit-system-mobiles-click-and-travel-seconds |
| Jul 2026 | Smart Gates Eligibility PreCheck on Pocket Flights, with GDRFA | [search] https://gulfnews.com/uae/dubai-airport-launches-instant-smart-gates-eligibility-check-for-travellers-1.500618859 |
| undated | First ESG Impact Report; Serco passenger-experience partnership extended to 2030 | [search] https://media.dubaiairports.ae/dubai-airports-publishes-first-esg-impact-report-outlining-progress-towards-sustainable-growth/ , https://www.plusimpact.serco.com/article/dubai-airports |

- Scale context: the site serves an airport described as handling over 90 million passengers a year [search, vendor page] https://prototype.ae/our-work/dubai-airports-website ; daily guests above 200,000 in summer peaks [search] https://media.dubaiairports.ae/dxb-set-for-a-busy-start-to-summer-as-daily-guest-numbers-top-200000/ ; 92.3 million passengers in 2024 [prior, reported early 2025, not re-confirmed].
- Awards 2024-2026 for the website or digital products: none found in this run [gap]. The accessibility accreditations found date from 2022.
- Strategic context: long-term traffic is planned to move to an expanded DWC, which may limit long-horizon investment in DXB-specific digital products [prior, as of 2024-2026; hypothesis for the investment implication].

---

## Scores table

Expert assessment on a 1-5 scale (half points allowed). Not instrumented tests. Because no official page was read directly, every score is evidence-limited; confidence reflects that.

| Dimension | Weight | Score | Confidence | Evidence level | Evidence |
|---|---|---|---|---|---|
| ui - UI aesthetics and brand | 10% | 3.5 | low | search (vendor claims) | Design system on atomic design after the 2019 rebrand (https://www.prototype.ae/our-work/dxb-design-system); redesign aimed at a luxury brand and global audience, mobile-first (https://koos.agency/project/dubai-airports-improved-digital-experience/); previous site called cluttered and inconsistent (https://irynaux.studio/projects/dxb). No visual inspection possible. |
| ux - task completion efficiency | 20% | 3.0 | low | search | Task-led menu and flight module on the homepage (https://dubaiairports.ae/home); filterable directories (https://dubaiairports.ae/experiences/shops). Offsets: bookings hand off to Mawgif, marhaba, Dubai Taxi, Al Majlis platform with separate registration (https://servicesedge.dubaiairports.ae/MajlisBooking); services filed under `/shops/` URLs; two flight front ends. |
| info - comprehensiveness and accuracy | 15% | 3.5 | medium | search (official page snippets) | Per-terminal parking tariffs with walking times and payment methods (https://dubaiairports.ae/transport/car-parking); taxi fares and accessible taxis (https://dubaiairports.ae/transport/taxi); smart gate eligibility (https://dubaiairports.ae/smart-gates); transfers procedures (https://dubaiairports.ae/information/transfers); FAQs (https://dubaiairports.ae/faqs). Gaps: no MCT, DXB metro/bus detail not confirmed. |
| flight - live flight info and journey assistance | 15% | 3.5 | low | search | Real-time arrivals/departures/delays (https://dubaiairports.ae/flight-status); Pocket Flights mobile platform via QR, no app (https://www.khaleejtimes.com/uae/dubai-dxb-new-tool-pre-check-smart-gates); Express Maps from flight screens (https://dubaiairports.ae/maps-home). Unverified: search inputs, detail page, notifications, freshness stamp. |
| mobile - mobile experience | 10% | 3.5 | low | search | Mobile-first redesign (vendor claims above); QR-launched web apps replace installs (https://gulfnews.com/uae/dubai-airport-launches-instant-smart-gates-eligibility-check-for-travellers-1.500618859). Offsets: official app reportedly removed (https://www.tripadvisor.com/ShowTopic-g1-i10702-k15312848-Dubai_Airport_App-Air_Travel.html); unofficial look-alike apps in stores. Nothing measured. |
| nav - navigation, search, accessibility | 10% | 3.0 | low | search | Clear four-group menu (https://dubaiairports.ae/home); only EN and AR languages (https://dubaiairports.ae/); strong accessibility content (https://dubaiairports.ae/campaigns/wamtwd) but no site accessibility statement or site search evidenced. |
| ai - personalisation and AI | 10% | 2.5 | low | search | DXBChat AI chatbot known only from a vendor video (https://m.youtube.com/watch?v=fpmZCTSsL_Q); live chat and WhatsApp exist (https://dubaiairports.ae/contact-information); Smart Gates PreCheck is a smart self-service but not personalisation; no accounts, saved trips or recommendations evidenced. |
| commerce - digital commerce and ancillaries | 5% | 3.0 | low | search | Bookable Al Majlis, marhaba, Greet & Go, lounges, hotels (https://dubaiairports.ae/experiences/shops/details/marhaba-meet-greet); DXB&more food ordering (https://www.airportsinternational.com/article/dubai-airports-and-servy-launch-dxbmore); parking pre-book via Mawgif. Offsets: fragmented checkouts, no loyalty programme evidenced. |
| perf - performance, security, reliability | 5% | 3.0 | low | direct (redirect only) + search | Cloudflare edge, HTTP/2, HTTP/3 advertised, cached redirect, TTFB 0.08-0.89 s single-run for the `www.` redirect only [direct]. Offsets: no HSTS on that redirect response [direct]; legacy 404 and dev/authoring hosts indexed (section 2). No page-level measurement. |

Weighted total: 3.20 / 5 = 64.0% (0.35 + 0.60 + 0.525 + 0.525 + 0.35 + 0.30 + 0.25 + 0.15 + 0.15).

---

## Standout features MAHB must surpass

1. **Scan-to-phone live flight platform (Pocket Flights), no app required.** QR codes in terminals and at gates open a mobile web flight tool at `dxb.pocketflights.com`. It removes the install barrier for the majority of passengers who will never download an airport app, and it gives the airport a mobile shell for adding services. https://gulfnews.com/uae/dubai-airport-launches-instant-smart-gates-eligibility-check-for-travellers-1.500618859 [search]
2. **Smart Gates Eligibility PreCheck (July 2026, with GDRFA).** Passport photo-page scan with the phone camera returns an instant yes/no on biometric gate eligibility before the passenger joins a queue. It turns an opaque government rule set into a ten-second self-service and reduces wrong-queue failures. https://www.khaleejtimes.com/uae/dubai-dxb-new-tool-pre-check-smart-gates [search]
3. **DXB Express Maps from every flight information screen.** The QR on the screen gives a known start point and opens wayfinding to gates, food, shops, lounges, toilets and service desks, launched for a peak period and paired with marked accessible routes. https://dubaiairports.ae/maps-home [search]
4. **"DXB for All" accessibility programme with numbers behind it.** Sunflower lanyards (36,040 issued by end of 2025), an autism-friendly route, hearing loops at 520+ touchpoints, an Assisted Travel Lounge, a visual Travel Planner and a public 2035 pledge. https://dubaiairports.ae/campaigns/wamtwd [search]
5. **Always-on omnichannel contact, used as the official disruption channel.** Phone, WhatsApp and live chat listed on one contact page, backed by an outsourced always-on centre and a (vendor-reported) AI chatbot; the same channels were promoted on X during a surge in March 2026. https://dubaiairports.ae/contact-information [search]

Honourable mention: terminal-by-terminal parking tariffs with walking times, payment options and a pre-book route on one page. https://dubaiairports.ae/transport/car-parking [search]

## Weaknesses and gaps (leapfrog opportunities)

1. **Bilingual only.** The site offers English and Arabic, while the airport itself announces in up to 25 languages. For a hub whose passengers are overwhelmingly foreign, this is the largest experience gap. https://dubaiairports.ae/ [search]
2. **Fragmented estate and identity.** DXB site, DWC site, Al Majlis platform (with forced re-registration in April 2025), a legacy e-Services portal, Pocket Flights, DXBmore.com, and operator checkouts for parking, taxis, meet-and-greet and hotels. No single account or basket was evidenced; services sit under `/shops/` URLs. https://servicesedge.dubaiairports.ae/MajlisBooking [search]
3. **No personalisation layer and no official app.** No evidence of accounts, saved flights, notifications tied to a profile, recommendations or loyalty; the myDXB app is reportedly gone and unofficial apps occupy the stores. https://www.tripadvisor.com/ShowTopic-g1-i10702-k15312848-Dubai_Airport_App-Air_Travel.html [search, forum]
4. **Thin transit tooling.** Procedural transfer text, no minimum connection times, no connection planner, manual DXB-DWC transfer by taxi or metro plus bus. https://dubaiairports.ae/information/transfers [search]
5. **Opaque AI assistant and web hygiene.** The AI chatbot is documented only by its vendor, with no official statement of capabilities or languages; legacy 404 pages and dev/authoring hosts are indexed; no site accessibility statement was found. https://m.youtube.com/watch?v=fpmZCTSsL_Q , https://dev-dxbalmajlis.dubaiairports.ae/passengers/information/transfers [search]

## Ideas for MAHB to outperform (not merely copy)

1. **One scan, one journey.** Put a QR on every flight screen, kerbside totem and boarding-pass email that opens a single progressive web app already filtered to that passenger's flight: live status, walking time from the scanned location to the gate, queue estimates, immigration lane guidance and transfer steps. Dubai splits this across Pocket Flights, Express Maps and the main site.
2. **Genuinely multilingual, with a transparent assistant.** Bahasa Malaysia and English as full editions, plus human-reviewed core journeys (flight, transfer, transport, immigration, assistance) in the main inbound languages such as Chinese, Arabic, Japanese, Korean, Tamil/Hindi and Bahasa Indonesia. Label machine-translated long-tail pages honestly. Give the site one named assistant on the same content and live data, and publish what it can do, which languages it speaks and when a human takes over. Dubai offers two site languages and documents its chatbot nowhere official.
3. **Immigration lane and autogate eligibility checker without a passport scan.** Ask nationality, pass type and age band, return the correct lane and required pre-arrival forms, and deep-link to the government service. It delivers the PreCheck benefit with less personal data, and works before travel rather than only in the terminal.
4. **A real connection planner.** Publish terminal-to-terminal and gate-area transfer times, minimum connection guidance by ticket type (through-checked versus self-transfer), and a "will I make it?" answer for a pair of flights. Dubai publishes none of this.
5. **Single account, single basket.** Parking, fast track, lounge, meet-and-greet, porter, food order-to-gate and reserve-and-collect in one checkout with one receipt and optional loyalty earning, instead of handoffs to each operator. Guest checkout first; account optional.
6. **Accessibility as a product feature, not only a programme.** Publish a WCAG 2.2 AA conformance statement, offer step-free and low-sensory routing in the map, let passengers pre-request assistance and a sunflower lanyard online, and provide the visual journey planner in every site language.

A site-wide disruption mode (homepage, assistant and notifications switching to incident guidance) belongs inside idea 1 as a standing capability.

---

## Gaps (what this run could not establish)

- No direct reading of any official page: apex host `dubaiairports.ae` and `dxb.pocketflights.com` are not reachable from this container. No screenshots, no page timings.
- Flight search inputs, flight detail page, notifications/bookmarking, freshness indicator.
- Pocket Flights and Express Maps feature detail, technology and languages.
- Site search, account/login utilities, footer contents, chat widget behaviour.
- Official confirmation and date of the myDXB app retirement; any current official app and its ratings.
- AI assistant official name, capabilities, languages; live chat/WhatsApp languages and hours.
- Site accessibility statement and WCAG level.
- Website awards 2024-2026; published performance or uptime data.
- DXB metro/bus detail; loyalty programme status; current status and coverage of DXB&more.

## Sources

Official Dubai Airports (seen as search snippets, not fetched):
- https://dubaiairports.ae/ and https://dubaiairports.ae/home
- https://dubaiairports.ae/flight-status
- https://dubaiairports.ae/maps-home
- https://dubaiairports.ae/smart-gates
- https://dubaiairports.ae/contact-information
- https://dubaiairports.ae/faqs
- https://dubaiairports.ae/information and https://dubaiairports.ae/information/transfers
- https://dubaiairports.ae/transport/car-parking , https://dubaiairports.ae/transport/taxi , https://dubaiairports.ae/transport/metro
- https://dubaiairports.ae/experiences/shops , https://dubaiairports.ae/experiences/restaurants
- https://dubaiairports.ae/experiences/shops/details/dubai-duty-free , /al-majlis , /marhaba-lounge , /marhaba-meet-greet , /dxb-greet-go , /plaza-premium-lounge , /sleepover , /jumeirah
- https://dubaiairports.ae/campaigns/wamtwd , https://dubaiairports.ae/campaigns/what-is-on-at-dxb
- https://dxbalmajlis.dubaiairports.ae/ , https://servicesedge.dubaiairports.ae/MajlisBooking
- https://dwc.dubaiairports.ae/transport/taxi , https://dwc.dubaiairports.ae/transport/bus , https://dwc.dubaiairports.ae/transport/car-parking , https://dwc.dubaiairports.ae/information/transfers
- https://media.dubaiairports.ae/dxb-marks-a-milestone-in-dubais-accessibility-ambition/
- https://media.dubaiairports.ae/dubai-airports-sets-new-standards-for-accessible-travel-with-dxbs-first-assisted-travel-lounge/
- https://media.dubaiairports.ae/dubai-airports-launches-next-phase-of-accessibility-strategy-pledging-to-make-dxb-the-worlds-most-accessible-airport-by-2035/
- https://media.dubaiairports.ae/dubai-airports-signs-mou-with-dubai-autism-center-to-make-travel-more-inclusive-at-dxb/
- https://media.dubaiairports.ae/dxb-receives-aci-accessibility-accreditation-for-its-commitment-to-inclusive-travel/
- https://media.dubaiairports.ae/dubai-airports-publishes-first-esg-impact-report-outlining-progress-towards-sustainable-growth/
- https://media.dubaiairports.ae/dxb-set-for-a-busy-start-to-summer-as-daily-guest-numbers-top-200000/
- https://media.dubaiairports.ae/full-transport-links-running-between-dwc-and-dxb/
- https://media.dubaiairports.ae/media-advisory---guidance-for-customers-departing-dxb/
- https://x.com/DXB/status/2028800360798978338 , https://x.com/DubaiAirports/status/2080584593854591439
- Indexed legacy/non-production URLs: https://www.dubaiairports.ae/gatsby-corporate/public/corporate/about-us/dubai-international-(dxb)/ , https://www.dubaiairports.ae/before-you-fly/to-from-the-airport/by-bus , https://dev-dxbalmajlis.dubaiairports.ae/passengers/information/transfers , https://corporate-auth.dubaiairports.ae/transport/bus

Government:
- https://www.gdrfad.gov.ae/en/smart-gate-inquiry

News and trade press:
- https://gulfnews.com/uae/dubai-airport-launches-instant-smart-gates-eligibility-check-for-travellers-1.500618859
- https://gulfnews.com/living-in-uae/visa-immigration/how-dubai-airport-travellers-can-check-smart-gates-eligibility-online-before-flying-1.500614012
- https://www.khaleejtimes.com/uae/dubai-dxb-new-tool-pre-check-smart-gates
- https://www.khaleejtimes.com/business/aviation/dubai-airports-new-always-on-customer-contact-centre-to-soon-provide-support-through-whatsapp
- https://www.khaleejtimes.com/business/aviation/dubai-airports-to-make-automated-announcements-in-25-languages
- https://www.khaleejtimes.com/uae/dubai-airports-entry-exit-system-mobiles-click-and-travel-seconds
- https://www.khaleejtimes.com/nation/dubai/dubai-airports-launches-blog-to-help-passengers
- https://economymiddleeast.com/news/dubai-airports-rolls-out-smart-gates-eligibility-pre-check-tool-to-ease-travel-journey/
- https://idtechwire.com/dubai-international-airport-launches-worlds-first-ai-immigration-corridor/
- https://idtechwire.com/dubai-international-airport-launches-unlimited-smart-travel-for-rapid-biometric-immigration/
- https://www.newsonair.gov.in/dubai-launches-ai-powered-passenger-corridor-to-clear-immigration-in-seconds
- https://moodiedavittreport.com/dubai-airports-launches-mydxb-app-for-apple-and-android-devices/
- https://www.airportsinternational.com/article/dubai-airports-and-servy-launch-dxbmore

Vendor and agency pages (self-reported claims):
- https://koos.agency/project/dubai-airports-improved-digital-experience/
- https://irynaux.studio/projects/dxb
- https://www.prototype.ae/our-work/dxb-design-system , https://prototype.ae/our-work/dubai-airports-website , https://prototype.ae/our-work/dubai-airport-wifi-website , https://www.prototype.ae/our-work/dubai-airports-flight-planner
- https://m.youtube.com/watch?v=fpmZCTSsL_Q (Enterprise Bot)
- https://simpleway.global/our-work/dubai-international-airport
- https://www.plusimpact.serco.com/article/dubai-airports

Blogs, forums, aggregators and app stores (lower reliability):
- https://dubaipeople.ae/2025/03/28/dxb-express-maps-dubai-airport-launches-smart-navigation-tool/
- https://curlytales.com/what-is-the-dxb-express-map-launched-by-dubai-airport-ahead-of-the-eid-rush/
- https://www.tripadvisor.com/ShowTopic-g1-i10702-k15312848-Dubai_Airport_App-Air_Travel.html
- https://apps.apple.com/sa/app/dxb-dubai-airport/id6761137667 , https://play.google.com/store/apps/details?id=com.frugalflyer.airport.dxb&hl=en
- https://www.flightstats.com/v2/flight-tracker/departures/DXB
- https://www.wikidata.org/wiki/Q193439

Direct observations (this run): HTTP responses from `https://www.dubaiairports.ae/` and seven paths, 2026-11-16 12:47-12:50 UTC, via `curl` through the session proxy.

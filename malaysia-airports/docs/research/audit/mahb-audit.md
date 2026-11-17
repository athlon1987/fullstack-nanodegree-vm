# MAHB digital ecosystem: consolidated audit (Deliverable 1, part A)

Audit of the existing Malaysia Airports Holdings Berhad (MAHB) passenger and corporate websites, the
MYairports app as passengers describe it, and the passenger experience the websites have to support.
Written 17 November 2026 for the board and the design team. It consolidates the first-hand
observations of 16 and 17 November 2026, the lab measurements, the published sitemap, the
search-derived passenger audit, the fact files and 14 new web searches made on 17 November 2026.

## How to read the evidence tags

| Tag | Meaning |
|---|---|
| **[direct]** | Observed first-hand by this project on 16 or 17 November 2026 (browser, curl, published sitemap). Strongest evidence. |
| **[direct, lab]** | Measured first-hand by this project with Lighthouse 13 or axe-core under lab conditions. An independent measurement, not field data and not a publisher's figure. |
| **[search]** | Stated in a web search result or search summary (16 or 17 November 2026), with its URL. The page itself was not opened. |
| **[prior]** | Background knowledge, not re-confirmed in this project. Flagged; do not publish without checking. |
| **[hypothesis]** | An inference that needs usability testing, analytics, MAHB logs or technical access to confirm. |
| **[assessment]** | Expert judgement by the auditor (severity ratings, priorities), built on the tagged evidence. Not a measurement. |

Where one sentence carries two levels, the weaker one governs any decision.

---

## Executive summary: the ten most important findings

1. **The passenger site fails silently when its content API fails.** Pages are client-rendered and
   fetch all text from `api.myairports.com.my` after load. When that API stopped serving this
   project's network (after about 15 page loads at one per second), every page kept returning
   HTTP 200 but showed only navigation, a flight widget stuck on "Loading..." and a weather widget
   reading "0 °C"; of 16 URLs crawled, 6 returned HTTP 502 and 4 showed the raw framework message
   "Application error: a client-side exception has occurred". No page told the visitor what had
   happened or offered a retry. [direct] Whether real visitors on shared addresses (airport Wi-Fi,
   hotels, mobile carrier NAT) hit the same limit is unknown. [hypothesis]
2. **The site is six cloned trees of 46 pages, and covers 5 of MAHB's 39 airports.** The published
   sitemap holds 276 URLs: six airport sections (`klia1`, `klia2`, `penang`, `kota-kinabalu`,
   `kuching`, `langkawi`) with an identical set of 46 paths each, so KLIA-only pages exist under
   Langkawi and Kuching (for example `/en/langkawi/transit/inter-terminal-transfer`). Subang and the
   other 33 airports have no section, and KLIA is modelled as two airports rather than one airport
   with two terminals. [direct]
3. **One topic often has two or three addresses.** In every tree at least 8 of the 46 URLs are a
   second or third address for a topic already covered (Butterfly Effect three times; parking,
   special assistance, facilities, flight transfer, inter-terminal transfer and things to do twice
   each): 48 of 276 sitemap URLs. [direct] Search engines also hold at least 19 malformed path
   prefixes for the same pages (`/nodeundefined/`, `/aba/`, `/index.php/`), legacy query-string
   URLs and a 2018 parking-rate page. [search]
4. **The homepage is very heavy and unstable in the lab.** Lighthouse mobile: performance 9 (19 in
   an earlier run), largest contentful paint 6.9 s, total blocking time 4.5 s, cumulative layout
   shift 0.62, about 34 million bytes over 171 requests, the heaviest of the ten airport homepages
   measured in the same session. The departures page took 17.5 s to its largest paint. [direct, lab] These are
   indicative, single-location lab figures, with third-party hosts blocked.
5. **Basic accessibility failures are machine-detectable.** axe-core found 6 failing rules on 27
   elements (desktop) and 5 rules on 19 elements (mobile) on the homepage; Lighthouse accessibility
   scored 79, failing `button-name`, `link-name`, `label`, `color-contrast`, `aria-hidden-focus` and
   `landmark-one-main`. The homepage has no `h1`, and at least one passenger page is titled
   "Corporate Website". [direct, lab] Automated checks catch only part of WCAG; conformance is
   unknown. [prior]
6. **Flight information is terminal-first and departure-first.** The widget on every page is "Find
   a Departing Flight", preset to Terminal 1; arrivals and the other terminal need separate pages;
   the boards are absent from the sitemap. [direct] No per-flight page, cross-terminal search or
   web alert was found; alerts are an app feature. [search, hypothesis]
7. **Parking prices are not on the parking page, and passengers are being surprised by bills.** The
   KLIA Terminal 1 parking page lists bays, features and a booking form but no rate table. [direct]
   Published rates conflict across sources, the long-term daily maximum rose from RM27 to RM32 on
   1 May 2026, a traveller budgeted RM213 from the online calculator and paid RM384 (May 2026), and
   a long stay in Preferred Parking produced an RM2,084 bill (January 2025). [search]
8. **The biggest passenger pain points of 2025-2026 are operational, and the site has no live status
   layer for them.** Aerotrain breakdowns and closures (July 2025 to December 2026), the Terminal 1
   baggage-system failure of 18 April 2026 (two to four hour waits), autogate and immigration outages
   (July 2025, April 2026), persistent taxi touting and an inter-terminal link promised for mid-2026
   but not confirmed as launched. [search] No service-status component was seen on the site and a
   2021 Aerotrain news item still surfaces in search. [direct for what was seen; absence:
   hypothesis]
9. **The ecosystem is fragmented across at least 13 hostnames and three domains.** Passenger,
   corporate, content API, image API, feedback, chat, careers, vendor management, annual report and
   Fast Track each sit on a separate host; the corporate site is a separate application built on a
   different component library. Naming is inconsistent ("KLIA1", "KLIA T1", "KUL T1", "KLIA
   Terminal 1") and two different general phone numbers appear in structured data. [direct, search]
10. **The homepage leads with retail promotions, while the paid services that drive conversion sit in
    a mixed "Booking Services" menu or on other domains.** Homepage headings are promotional `h3`s
    (Charlotte Tilbury, DaySleeper at MYR135, PAUL halal certification); Fast Track hands off to
    `myairportfasttrack.com`; "Booking Services" mixes Fast Track with an accessibility programme,
    filming permits and school visits. [direct] Management describes a "commercial reset", a ShopLAH
    retail campaign and a review of the duty-free concession model in 2026. [search] There is no
    evidence of a single basket, account or contextual offer on the web. [hypothesis]

---

## Evidence base and its limits

### What was first-hand [direct]

| Window (UTC) | What was done | What it yielded |
|---|---|---|
| 16 Nov, about 12:50 to 23:48 | Headless Chromium and curl on `airports.malaysiaairports.com.my`, `www.malaysiaairports.com.my` and `corporate.malaysiaairports.com.my`, with `api.myairports.com.my` allowed | Rendered navigation, homepage, KLIA Terminal 1 parking page, page titles and headings, raw HTML structure, API endpoint names, third-party hosts, domain routing, the full sitemap (276 URLs) |
| 16 Nov, 23:46 to 23:58 | Lighthouse 13 (mobile emulation, simulated slow 4G), axe-core 4 on the homepage at desktop and iPhone 14 sizes | Lab scores, page weight, layout shift, failing accessibility rules |
| 16 Nov, 23:46 to 23:48 | A 16-URL crawl of KLIA Terminal 1 pages | Status codes, titles and text length at the moment the content API stopped serving |
| 17 Nov, 04:50 and 10:31 | Two single test loads | Confirmed the block persisted; no workaround attempted |

No screenshots of MAHB pages were kept. Visual findings therefore rest on rendered text, headings,
HTML and lab audits, not on images.

### What came from search [search]

- The search-derived passenger audit (`a-passenger-klia.md`, 23 queries on 16 November 2026). It was
  written while the container could not reach MAHB at all; it reports indexed URLs, titles and
  snippets, not rendered pages.
- The fact files (`f-corporate.md`, `f-network.md`, `f-klia-transport.md`, `f-klia-t1.md`,
  `f-supplement-commerce-regional.md`).
- 14 web searches on 17 November 2026 for voice-of-customer, press, rankings, management statements,
  the MYairports app and corporate functions. URLs are given where each claim is used.

### The access block and why it matters

After roughly 15 page loads at about one per second plus three Lighthouse runs, the content API
stopped returning data to this project's network. One load showed a firewall page ("Error 403, Web
Page Blocked, Attack ID 20000051"); later direct requests to the corporate host were reset. [direct]
The behaviour is consistent with rate limiting or bot protection. [hypothesis]

It matters in four ways:

1. **It limits this audit.** Most passenger pages were never read with content. The five friction
   tasks in section 2 are reconstructed from navigation, sitemap, titles and search evidence, not
   performed end to end. Every "cannot be confirmed" in this document traces back to it.
2. **It is itself a finding.** A site whose every page depends on one API, with no server-rendered
   fallback and no error state, turns a protective measure into a blank site. [direct]
3. **It sets a requirement for the redesign.** The new API layer needs the same protection, but
   pages must still render useful content (cached or server-rendered) when the API refuses a
   client. [assessment]
4. **It may affect real passengers.** Many passengers share one public address (airport Wi-Fi,
   hotel networks, carrier-grade NAT). If MAHB's limit is per address, some of them could see the
   empty site. [hypothesis: needs MAHB firewall and API logs]

---

## 1. Existing content, functions and information architecture

### 1.1 The identical 46-page tree [direct]

The sitemap published on `www.malaysiaairports.com.my` (retrieved 16 November 2026) contains 276
URLs, all under `/en/`, in six sections of exactly 46 URLs. Hashing the sorted path lists showed
the six trees are identical. The 46 paths of each tree are:

| Group | Paths (relative to `/en/{airport}`) | Count |
|---|---|---|
| Home | `/` | 1 |
| Air Travel | `/air-travel`, `/airport-facilities`, `/facilities`, `/baggage`, `/customs-and-immigration`, `/facial-recognition`, `/flight-transfer`, `/inter-terminal-transfer`, `/lag-restricted-items`, `/location-map`, `/parking`, `/passenger-services-charges`, `/public-transport`, `/rental-services`, `/security-screening`, `/special-assistance`, `/travel-health-sops`, `/vehicle-access-management-system`, `/visa` (all under `/air-travel`) | 19 |
| Air Travel > Services | `/services`, `/services/airport-care-ambassadors`, `/services/butterfly-effect`, `/services/fast-track`, `/services/lost-and-found`, `/services/special-assistance`, `/services/wifi` (under `/air-travel`) | 7 |
| Booking Services | `/booking-services`, `/butterfly-effect`, `/film-and-photography`, `/things-to-do`, `/visitation-kul` (under `/booking-services`) | 5 |
| Transit | `/transit/flight-transfers`, `/transit/inter-terminal-transfer`, `/transit/things-do` | 3 |
| Shop, Dine & Services | `/shop-dine-services`, `/all`, `/dine`, `/services`, `/shop` | 5 |
| Stand-alone | `/butterfly-effect`, `/parking`, `/help`, `/map`, `/mobile-app`, `/myairports` | 6 |

Observations:

- **Coverage.** Five airports (KLIA as `klia1` and `klia2`, Penang, Kota Kinabalu, Kuching,
  Langkawi). MAHB operates 39 airports in Malaysia [search, `f-network.md`]; Subang, which has
  scheduled jet services again since August 2024 [search, `f-network.md`], has no section. [direct]
- **Template leakage.** KLIA-only topics are present under all four non-KLIA airports:
  `visitation-kul`, both inter-terminal-transfer pages and `vehicle-access-management-system` (16
  URLs in total). Whether their content is airport-specific could not be checked. [direct for the
  URLs; content: hypothesis] Search had already found a KLIA Terminal 1-only app feature described
  on the Langkawi app page and a KLIA e-hailing headline on the Penang home page. [search]
- **Flight boards are missing from the sitemap.** None of the 276 URLs is a `flight-information`
  page, although the boards exist and are in the main navigation. [direct]
- **English only.** No Bahasa Melayu, Chinese or other language URL appears in the sitemap. [direct]
- **Two hosts, one site.** The sitemap lists `www` URLs; `www` redirects to the passenger host,
  which serves the same content. [direct]
- **Likely stale topics.** `/air-travel/travel-health-sops` exists under every airport.
  [direct] It probably dates from the pandemic period. [hypothesis]

### 1.2 Navigation as rendered (KLIA Terminal 1, desktop) [direct]

- **Main menu:** Flight Information (Arrivals, Departures); Parking; Air Travel (13 items, grouped
  as Services, Amenities, Transport); Booking Services (Things To Do, Butterfly Effect, Fast Track,
  Filming and Photography @ KUL, Visit @ KUL); Shop & Dine (Shop, Dine, Services); Mobile App; Map;
  Help (Services, Support, Feedback, Scam Alert).
- **Utility row:** Departures, Arrivals, Contact Us, Mobile App, The Butterfly Effect, the "Find a
  Departing Flight" widget, the airport switcher ("Malaysia Airports Sites", with "Airports" and
  "Corporate" options), local time and temperature.
- **Labels mix passenger tasks and programme names.** "Air Travel" is a catch-all for baggage,
  security, visas, parking, transport, rental, Wi-Fi, lost and found and facilities; "Booking
  Services" files an accessibility programme next to filming permits and school visits; "Services"
  appears under Air Travel, Shop & Dine and Help.

### 1.3 Must-keep inventory

Everything below must survive the redesign, re-homed by passenger task. "Where today" uses KLIA
Terminal 1 paths; the same path exists under every airport unless stated.

**Passenger functions**

| # | Function or content | Where it lives today | Evidence |
|---|---|---|---|
| P1 | Airport and site switcher (airports and corporate) | Utility row, "Malaysia Airports Sites" | direct |
| P2 | Departures board (time, destination, airline, flight, check-in row, gate, status) | `/en/klia1/flight-information/departures` (per terminal) | direct (page); fields: search |
| P3 | Arrivals board (status, expected time, belt, gate) | `/en/klia1/flight-information/arrivals` | direct (nav); fields: search |
| P4 | Flight search widget "Find a Departing Flight" | Every page, utility row | direct |
| P5 | Airline logos on flight rows | `apss-prod-cms.myairports.com.my` | direct |
| P6 | Parking information: Terminal 1 Car Park (5,700+ bays), Long Term Car Park (5,200+ bays, free shuttle every 10 minutes), Preferred Parking (300+ bays) | `/parking`, `/air-travel/parking` | direct |
| P7 | Parking online booking (entry and exit date and time, "Book Now") and parking FAQ | `/parking` | direct |
| P8 | Vehicle Access Management System information | `/air-travel/vehicle-access-management-system` | direct (URL) |
| P9 | Public transport guide (bus tab confirmed; taxi and e-hailing described) | `/air-travel/public-transport?tab=bus` | direct (URL); content: search |
| P10 | Metered taxi page | `/getting-around-transport-car/taxi/metered-taxi` (legacy path) | search |
| P11 | Car and equipment rental, including wheelchairs | `/air-travel/rental-services` | direct (URL); content: search |
| P12 | Inter-terminal transfer guide | `/air-travel/inter-terminal-transfer`, `/transit/inter-terminal-transfer` | direct |
| P13 | Flight transfer (connections) guide | `/air-travel/flight-transfer`, `/transit/flight-transfers` | direct |
| P14 | Baggage rules | `/air-travel/baggage` | direct (title) |
| P15 | Security screening; liquids, aerosols and gels | `/air-travel/security-screening`, `/air-travel/lag-restricted-items` | direct (URLs) |
| P16 | Customs and immigration; visa information | `/air-travel/customs-and-immigration`, `/air-travel/visa` | direct (URLs); content: search |
| P17 | Facial recognition (biometric journey) | `/air-travel/facial-recognition` | direct (URL); content unread |
| P18 | Passenger service charges | `/air-travel/passenger-services-charges` | direct (URL) |
| P19 | Facilities (lounges, prayer rooms, medical, ATMs) | `/air-travel/facilities`, `/air-travel/airport-facilities` | direct (URLs); content: search |
| P20 | Wi-Fi | `/air-travel/services/wifi` | direct (URL) |
| P21 | Lost and found | `/air-travel/services/lost-and-found`; legacy `/airport-amenities/services/lost-found` | direct; legacy: search |
| P22 | Special assistance (reduced mobility) | `/air-travel/special-assistance`, `/air-travel/services/special-assistance` | direct (title "Special Assistance Services at KLIA Terminal 1") |
| P23 | Airport CARE Ambassadors | `/air-travel/services/airport-care-ambassadors` | direct |
| P24 | The Butterfly Effect (hidden disabilities: calm rooms, priority access, assisted travel) | `/butterfly-effect`, `/booking-services/butterfly-effect`, `/air-travel/services/butterfly-effect` | direct; content: search |
| P25 | Fast Track (paid priority lane) | `/air-travel/services/fast-track`, hands off to `myairportfasttrack.com` | direct |
| P26 | Things to do | `/booking-services/things-to-do`, `/transit/things-do` | direct |
| P27 | Filming and photography permits | `/booking-services/film-and-photography` | direct |
| P28 | Visit @ KUL (educational visits) | `/booking-services/visitation-kul` | direct |
| P29 | Shop, dine and services directories | `/shop-dine-services/{all,shop,dine,services}` | direct (URLs) |
| P30 | Terminal map (described as interactive) | `/map`, `/air-travel/location-map` | direct (URLs); "interactive": search |
| P31 | Mobile app promotion | `/mobile-app`, `/myairports` | direct |
| P32 | Help (services, support), Contact Us | `/help`, utility row | direct |
| P33 | Feedback | `feedback.malaysiaairports.com.my` | direct |
| P34 | Web chat | Kommunicate widget requested by the homepage; `care.malaysiaairports.com.my/chat` (human agents, not 24 hours) | direct (widget host); chat service: search |
| P35 | Scam Alert | Utility row and Help | direct |
| P36 | Local time and weather | Utility row (OpenWeatherMap) | direct |
| P37 | Homepage highlights, news, spotlight, banners, YouTube video, useful tips, travel essentials | CMS endpoints on `api.myairports.com.my` | direct (endpoint names) |
| P38 | Organisation and contact structured data | `/help`, `/shop-dine-services/services` | search |

**Corporate sections**

| # | Section or function | Where it lives today | Evidence |
|---|---|---|---|
| C1 | About Us: corporate profile, brand, management team, board of directors | `corporate.malaysiaairports.com.my/en/about-us/...` | search |
| C2 | Sustainability (including the "Memorable Airport Experiences" pillar) | `corporate.malaysiaairports.com.my/en/sustainability/...` | search |
| C3 | Media Centre: news, monthly traffic releases | `corporate.malaysiaairports.com.my/en/media-centre/news/{number}` | search |
| C4 | Annual reports | Separate microsite (`annualreport2023` host) | search |
| C5 | Careers | `careers.malaysiaairports.com.my` | search |
| C6 | Procurement: vendor registration and tender notices | `vms.malaysiaairports.com.my` (Vendor Management System); tender events on the third-party Procurehere portal; older notices name `epro.malaysiaairports.com.my` | search |
| C7 | Corporate contact | `www.malaysiaairports.com.my/contact-us/corporate` | search |
| C8 | Corporate magazine or stories | `convergence.malaysiaairports.com.my` | search |
| C9 | Ownership and governance information (replaces listed-company investor relations after the February 2025 delisting) | Not located | search (delisting); location: gap |
| C10 | Link from corporate to passenger flight boards | Corporate navigation | search |

---

## 2. Navigation complexity and journey friction

Friction log for five tasks. Steps are reconstructed from the rendered navigation, the sitemap,
page titles and search evidence; none of the five could be completed end to end because of the
access block. Step counts are minimums from a KLIA Terminal 1 starting point.

### Task 1: check a flight's status

| Step | What happens | Evidence |
|---|---|---|
| 1 | `www.malaysiaairports.com.my` redirects to `/en/klia1`; Terminal 1 is the implicit default | direct |
| 2 | Utility-row widget "Find a Departing Flight", preset to "TERMINAL 1", columns From, Airline, Flight, Status, Time | direct |
| 3 | For an arrival, or a Terminal 2 flight, the passenger must use Flight Information > Arrivals or switch airport to `klia2` first | direct (nav); switch behaviour: hypothesis |
| 4 | Read the row on the per-terminal board | search (fields) |

Problems: the passenger must know the terminal before searching [direct for the preset; whether a
Terminal 2 flight number returns "no result" on Terminal 1: hypothesis]; the widget is
departures-only and labels a column "From" on a departures list [direct]; when the API is
unavailable the widget shows "Loading..." indefinitely [direct]; the departures page took 17.5 s to
its largest paint in the lab [direct, lab]; no shareable per-flight page or web alert [search,
hypothesis]; alerts need the app [search]. Severity: high [assessment].

### Task 2: find what three days of parking cost (KLIA)

| Step | What happens | Evidence |
|---|---|---|
| 1 | Main menu > Parking (`/en/klia1/parking`; also `/air-travel/parking`) | direct |
| 2 | Page lists three products, bays, features, an FAQ and a booking form | direct |
| 3 | No rate table is visible; a price can only come from the booking form (untested) or elsewhere | direct; booking quote: hypothesis |
| 4 | A search engine returns a 2018 GST-era rate page on the same host and third-party guides with conflicting hourly rates | search |

Problems: the answer to the most common parking question is not on the page [direct]; the three
products are easy to confuse, and long stays in Preferred Parking have produced very large bills
[search, paultan.org 16 Jan 2025]; the long-term daily maximum changed on 1 May 2026 and a press
report says the calculator lagged [search, The Rakyat Post 16 May 2026]; Terminal 2 parking rates
differ by source [search]. A passenger reading third-party sources would estimate about RM96 at the
Long Term Car Park (3 x RM32 daily maximum), but this is a derivation from a search figure, not an
official quote [derived from search]. Severity: high (money, trust, press exposure) [assessment].

### Task 3: find the nearest prayer room

| Step | What happens | Evidence |
|---|---|---|
| 1 | No "prayer room" label in the main menu; nearest candidates are Air Travel > Amenities or Map | direct (menu groups) |
| 2 | Facilities exists at two URLs: `/air-travel/facilities` and `/air-travel/airport-facilities` | direct |
| 3 | The facilities page lists prayer rooms among lounges, medical services and ATMs | search (`f-klia-t1.md`) |
| 4 | For "nearest", the passenger must switch to the map (`/map` or `/air-travel/location-map`) | direct (URLs); "interactive": search |

Problems: two facilities pages with no signal which is current [direct]; in the crawl one returned
502 and the other an unhandled application error [direct, under block conditions]; locations,
levels, airside or landside status and hours were not captured from any source [search gap];
nothing evidences gate-relative "nearest" wayfinding [hypothesis]; an App Store review says the app
map has no search and few labels [search, apps.apple.com/au/app/myairports/id1352952170, undated].
Prayer rooms are a high-frequency need at Malaysian airports [prior]. Severity: medium to high
[assessment].

### Task 4: get from KLIA to KL Sentral

| Step | What happens | Evidence |
|---|---|---|
| 1 | Air Travel > Transport > Public Transport (`/air-travel/public-transport`) | direct (URL, menu group) |
| 2 | Modes are tabs driven by a query string, `?tab=bus` on Terminal 1 and `?tab=Bus` on Terminal 2 | search |
| 3 | Rail, bus, taxi and e-hailing are compared by opening each tab; the metered-taxi page sits on a legacy path | search; tab-hopping: hypothesis |

Problems: on 17 November the page returned the unhandled application error [direct, under block
conditions]; the rail tab and fares were not in indexed text [search]; the KLIA Ekspres adult fare
rises from RM55 to RM65 on 1 January 2027, so static copy will go wrong in six weeks [search, The
Star 1 Oct 2026]; e-hailing pick-up doors and the RM2 entry fee changed during 2026 [search];
touts target arriving passengers at exactly this decision point [search, see Voice of the
passenger]. Severity: high for first-time international visitors [assessment].

### Task 5: get help for a lost item

| Step | What happens | Evidence |
|---|---|---|
| 1 | Help, or Air Travel > Services > Lost and Found (`/air-travel/services/lost-and-found`) | direct |
| 2 | A legacy lost-and-found URL (`/airport-amenities/services/lost-found`) is also indexed | search |
| 3 | Contact details found only on third-party sites (Level 2 counter, a 24-hour phone line, an email), low confidence | search (`f-klia-t1.md`) |
| 4 | Alternatives: Feedback (separate host), web chat (human agents, limited hours) | direct (feedback host, chat widget); hours: search |

Problems: in the crawl the lost-and-found page returned the unhandled application error [direct,
under block conditions]; no online report form was evidenced [hypothesis]; items lost on board, at
security or in the terminal belong to different parties (airline, MAHB, ground handler) and the
page needs to route accordingly [prior]; two different general numbers appear in structured data
[search]. Severity: medium [assessment].

### Cross-task patterns

- Two to four steps to reach the right page is reasonable; the friction lies in having to know the
  terminal, in duplicate destinations and in missing answers on the destination page. [assessment]
- The same transport and transfer content is reachable from Air Travel, Transit and Booking
  Services. [direct]

---

## 3. Visual hierarchy, typography, layout and consistency

Limits: no MAHB screenshots were kept, so colour, type scale, spacing and imagery are not assessed
here. What can be said rests on headings, titles, HTML and lab audits.

- **No page-level hierarchy on the homepage.** There is no `h1`; the first headings are promotional
  `h3`s ("Charlotte Tilbury: Glam Before Take-Off", "DaySleeper Deal: 6 Hours for MYR135", "PAUL Le
  Café at KLIA T1 Is Now HALAL Certified"), then "Services", "Amenities", "Transport". [direct] The
  homepage therefore communicates retail first and tasks second. [assessment]
- **Inconsistent naming.** Titles on one airport use "KLIA Terminal 1", "KLIA1" and "KLIA T1"; the
  switcher uses "KUL T1"; search adds "KUL T2", "klia2" and "KLIA2". [direct, search]
- **Placeholder and empty titles.** "Corporate Website" on a passenger page; empty titles on pages
  that errored; a leaked "Shop and Dine Meta data - KLIA - Malaysia Airports Holdings" title in
  search. [direct, search]
- **Layout instability.** Cumulative layout shift 0.62 on the homepage and 0.45 on departures in the
  lab [direct, lab], against a "good" threshold of 0.1 [prior]. Content and banners arriving after
  hydration move the page while the visitor reads or taps. [hypothesis on cause]
- **Misleading defaults.** "0 °C" in the weather widget and "Loading..." in the flight widget when
  data is missing. [direct] A visible wrong value is worse for trust than an empty slot.
  [assessment]
- **Two visual systems.** The corporate site is a separate Next.js application using the Ant Design
  component library; the passenger site is a different build. [direct] Visible inconsistency
  between them is likely. [hypothesis]
- **Icons fetched at run time.** Icons come from Iconify APIs on three hosts. [direct] Icons can
  pop in late or fail with the network. [hypothesis]

---

## 4. Mobile and accessibility

All figures are automated, lab measurements by this project on 16 November 2026, KLIA Terminal 1
homepage unless stated. They are not field data and not a conformance claim.

| Check | Desktop | Mobile | Evidence |
|---|---|---|---|
| axe-core 4 (WCAG 2.0 to 2.2 A and AA rules) | 6 rules, 27 elements failing | 5 rules, 19 elements failing (iPhone 14 emulation) | direct, lab |
| Lighthouse accessibility score | n/a | 79 (homepage); 82 (departures, earlier run) | direct, lab |
| Lighthouse failing audits | n/a | `aria-hidden-focus`, `button-name`, `color-contrast`, `label`, `landmark-one-main`, `link-name` | direct, lab |
| Horizontal overflow at phone width | n/a | None | direct |

Context from the same lab session (indicative only): Dubai 100, Heathrow 92, Haneda 80, Incheon 79,
Istanbul 78, Changi 74, Hong Kong 68, Munich 47. [direct, lab]

What these failures mean in practice [assessment, on the direct findings]:

- `button-name` and `link-name`: icon-only controls (likely the menu, search, switcher and social
  icons) are announced to screen-reader users without a name.
- `label`: at least one form field (the flight search or parking booking inputs are candidates)
  has no programmatic label. [hypothesis on which field]
- `landmark-one-main`: no `main` landmark, so "skip to content" and landmark navigation fail.
- `aria-hidden-focus`: focusable elements hidden from assistive technology, typically a closed menu
  or carousel that keyboard users can still tab into.
- `color-contrast`: some text does not meet contrast minimums.

Other accessibility observations:

- No `h1` on the homepage; placeholder title on at least one page (WCAG 2.4.2 intent). [direct]
- A special-assistance page exists for reduced mobility [direct], contrary to the earlier
  search-only audit, which could not find one. The hidden-disability programme is reachable from
  three menus but filed under "Booking Services". [direct]
- English only in the sitemap. [direct] Malay, Chinese and other visitor languages are absent.
- No accessibility statement was found. [hypothesis: absence not confirmed]
- Flight tables with five or more columns on narrow screens, keyboard operation of the mega menu,
  focus order and live-region announcements for flight updates were not testable. [hypothesis]
- Total blocking time of 0.9 to 4.5 s on mid-range mobile emulation means taps can go unanswered for
  seconds during load. [direct, lab]

---

## 5. Flight search and real-time data presentation

Confirmed:

- The flight widget on every page is "Find a Departing Flight", preset to Terminal 1, with columns
  From, Airline, Flight, Status, Time; the homepage requests
  `passenger-fids/api/flights/search-flights?code=D&key=all&terminal=KLIA&live=true&limit=5`.
  [direct] The `terminal=KLIA` parameter suggests the API can already answer across both terminals.
  [hypothesis]
- Boards are separate per terminal (`/en/klia1/...`, `/en/klia2/...`). [direct, search]
- Board fields: scheduled time, destination or origin, airline, flight number, check-in row, gate,
  belt, status; a date or "Last Update" stamp. [search]
- Flight rows appeared in indexed text, so search engines hold stale snapshots (an October board
  returned in mid-November). [search]
- Flight pages are not in the sitemap. [direct]
- The MYairports app offers "Track My Flight" with notifications; "Plan My Journey" is KLIA
  Terminal 1 only. [search, MAHB app page and App Store listing]
- Departures page lab result (earlier run): performance 17, largest contentful paint 17.5 s, layout
  shift 0.45, 2.3 MB, 114 requests. [direct, lab]

Not evidenced, and treated as gaps until tested [hypothesis]: a per-flight URL or detail page;
scheduled and estimated times side by side; date selection; search by city or airline; codeshare
grouping; a terminal indicator; a time-of-day "updated at" stamp; web, email or messaging alerts;
an explicit "data unavailable" state (the direct evidence shows the opposite: a permanent
"Loading...").

Implication [assessment]: the flight record is the passenger's real starting point. One KUL search
that tells the passenger the terminal, a stable page per flight, and links from that page to
transport, parking, Fast Track and the map would remove most of the Task 1 friction.

---

## 6. Commercial services and conversion

Confirmed on the site:

- Homepage promotions on 16 November 2026: Charlotte Tilbury, Kapten Batik (and a Kapten Batik x
  Tetris collection), Kepler ("Relax, Refresh, and Recharge"), PAUL Le Café (halal certification),
  Coco Mademoiselle, a DaySleeper offer (6 hours for MYR135), "Celebrating Malaysian Culture and
  Crafts". [direct]
- Parking booking is on the parking page (dates and "Book Now"). [direct]
- Fast Track is sold on a separate domain, `myairportfasttrack.com`. [direct]
- "Booking Services" groups Fast Track with non-commercial items (Butterfly Effect, filming permits,
  Visit @ KUL). [direct]
- Shop, dine and services directories exist per airport. [direct (URLs)]

Management direction (2025-2026):

- A "commercial reset" repositioning airports as lifestyle destinations, a curated,
  experience-led model, with digital and omnichannel engagement described as central. [search,
  Future Travel Experience, May 2026,
  https://www.futuretravelexperience.com/2026/05/how-malaysia-airports-is-blending-digital-innovation-curated-retail-and-personalised-passenger-engagement/]
- ShopLAH, an always-on retail campaign tied to Visit Malaysia 2026, with a digital card offering
  discounts and rewards to international visitors. [search,
  https://www.marketing-interactive.com/malaysia-airports-doubles-down-on-retail-with-shoplah-push-for-vm2026]
- About 44 million sales transactions across the Malaysian network in 2025, up 28.8%, as reported
  in 2026 trade coverage. [search, per search summary of International Airport Review and
  Marketing-Interactive; confirm before use]
- A review of the duty-free concession model, with passenger experience as the main consideration.
  [search, NST Aug 2026,
  https://www.nst.com.my/amp/business/corporate/2026/08/1520652/mahb-reviews-duty-free-concession-model-its-airports]
- Upgraded Eraman duty-free mall at Terminal 2 (July 2026) and a relaunched Terminal 1 mall
  (November 2024). [search, `f-supplement-commerce-regional.md`]

Gaps and hypotheses:

- No prices were seen for Fast Track, and parking prices are not on the page. [direct for parking;
  Fast Track page not read]
- No evidence of a single basket or account across parking, Fast Track, lounges and day rooms, or of
  offers placed in context (for example Fast Track on a departure page). [hypothesis]
- Lounges, porter, buggy, baggage storage, meet-and-greet and hotel booking were not found on the
  site. [search negative; absence not confirmed]
- ShopLAH and the digital card were not seen on the passenger site in the pages that rendered.
  [direct for what was seen; absence: hypothesis]

Implication [assessment]: the commercial strategy is visible on the homepage only as editorial
promotion. Conversion depends on putting priced, bookable services in the passenger's flow (flight
page, transport, arrival) and on a single checkout; that is a hypothesis to test, not a measured
gain.

---

## 7. Search and discoverability

- **On-site search.** The only "SEARCH" control in the rendered text belongs to the flight widget;
  no site-wide search was seen. [direct; an unlabelled search icon could have been missed]
- **Sitemap.** 276 URLs on the `www` host, English only, no flight pages, duplicated topics.
  `robots.txt` allows all. [direct]
- **Lighthouse SEO 100** on the homepage [direct, lab]. This checks page-level basics only and does
  not reflect the URL problems below.
- **Malformed and legacy URLs indexed.** At least 19 junk first segments (`/nodeundefined/`,
  `/sma2012undefinedundefinedundefined/`, `/aba/`, `/$/`, `/index.php/`); unknown airport slugs
  indexed with Terminal 1 content; query-string CMS URLs (`/?c=news&id=261&m=media_centre`);
  Drupal-style `/node/1058` outlet pages; legacy `www` paths such as
  `/passenger-guide/faq-air-travel-requirements-under-new-norms/mobile-app` and
  `/sustainability/malaysia-airports-journey-towards-net-zero-carbon-2050/mobile-app`; a 2019
  systems-disruption notice on the passenger host. [search] Whether these return 200, redirect or
  carry canonicals could not be checked. [hypothesis]
- **Task answers are not indexable.** Parking rates, fares and timetables were absent from indexed
  text, so search engines cannot answer "KLIA parking rate" or "KLIA to KL Sentral" from MAHB.
  [search] Third-party guides fill the gap, with conflicting figures. [search]
- **Domain confusion.** A third-party aggregator lists `www.klia.com.my` as the official site.
  [search, unverified]

---

## 8. Missing, duplicated, outdated or poorly organised information

| Type | Item | Evidence |
|---|---|---|
| Missing | Sections for Subang and 33 other airports | direct |
| Missing | Parking rate table on the parking page | direct |
| Missing | Non-English content | direct (sitemap) |
| Missing | Flight boards in the sitemap | direct |
| Missing | Error, empty and "data unavailable" states | direct |
| Missing | Live operational status (Aerotrain, inter-terminal link, baggage, immigration) | hypothesis (not seen) |
| Missing | Airline directory (airline to terminal) | search negative |
| Missing | Accessibility statement | hypothesis |
| Duplicated | 8 extra URLs per tree (48 site-wide): Butterfly Effect x3; parking, special assistance, facilities, flight transfer, inter-terminal transfer, things to do x2 | direct |
| Duplicated | KLIA split into two trees; terminal-independent rules (visa, customs, liquids) duplicated | direct (trees); drift: hypothesis |
| Duplicated | Likely: `/map` and `/air-travel/location-map`; `/mobile-app` and `/myairports` | direct (URLs); equivalence: hypothesis |
| Duplicated | Management page duplicated under a `/penang/` path on the corporate site, with different content | search |
| Outdated | 2018 GST parking-rate page; 2021 Aerotrain news; 2019 disruption notice; "new norms" FAQ paths | search |
| Outdated | `travel-health-sops` under every airport | direct (URL); staleness: hypothesis |
| Conflicting | General numbers +60 3 8777 7000 and +60 3 8777 0000 in structured data | search |
| Conflicting | Long Term Car Park shuttle "every 10 minutes" (parking page) and inter-terminal shuttle "every 15 minutes" (transfer page, per search); may be different services | direct and search; hypothesis on cause |
| Conflicting | Parking hourly rates across MAHB pages and guides | search |
| Poorly organised | "Air Travel" catch-all of 13 items; accessibility under "Booking Services"; "Services" in three menus | direct |
| Poorly organised | Template content leaking between airports | direct (URLs), search (content) |

---

## 9. Performance, reliability and loading behaviour

### 9.1 Lab measurements [direct, lab]

Lighthouse 13, mobile emulation, simulated slow 4G, shared cloud container, hosts outside the
allowlist (analytics, tag manager, chat) blocked. Indicative only; not comparable with field data.

| Page | Run | Perf. | LCP | TBT | CLS | Weight | Requests |
|---|---|---|---|---|---|---|---|
| Homepage `/en/klia1` | Valid run, 23:46 UTC | 9 | 6.9 s | 4.46 s | 0.621 | 34,276,078 bytes (32.7 MiB) | 171 |
| Homepage `/en/klia1` | Earlier run, heavier CPU contention | 19 | 5.2 s | about 0.9 s (inferred from the reported 0.9 to 4.5 s range) | 0.621 | reported as 34.3 MB | 172 |
| Departures `/en/klia1/flight-information/departures` | Earlier run only | 17 | 17.5 s | n/a | 0.453 | 2.3 MB | 114 |

Homepage first contentful paint 3.1 s and speed index 11.8 s in the valid run. A single desktop
browser load on 16 November gave time to first byte 1.0 s, DOMContentLoaded 2.7 s, first
contentful paint 2.7 s and load event 10.0 s. [direct]

Note on units: the project README gives the homepage weight as both 32.7 MB and 34.3 MB. The raw
byte count of the valid run (34,276,078) is 34.3 MB in decimal units and 32.7 MiB in binary units,
so the two figures may describe the same weight. Use "about 34 million bytes". [direct]

Comparison, same session and method (homepages): Heathrow 1.8 MB, Hong Kong 2.3 MB, Dubai 4.4 MB,
Incheon 4.5 MB, Munich 4.6 MB, Istanbul 5.9 MB, Hamad 11.6 MB (first run only), Haneda 13.2 MB,
Changi 21.0 MB. [direct, lab] MAHB's homepage was the heaviest of the ten measured, roughly 18 times
Heathrow's, and the only one with a layout shift above 0.2.

### 9.2 Reliability under the block [direct]

| Time (UTC) | URLs | Result |
|---|---|---|
| 16 Nov 23:46 to 23:48 | 16 KLIA Terminal 1 pages | 6 x HTTP 502 "upstream request failed"; 4 x HTTP 200 with "Application error: a client-side exception has occurred"; 6 x HTTP 200 with navigation only (103 to 506 characters of text) |
| 17 Nov 10:31 | Public transport page | HTTP 200 with the same application error |
| 16 Nov, one load | Homepage | Firewall page "Error 403, Web Page Blocked" |

### 9.3 Architecture signals [direct]

- Client-rendered content: the parking page's 250 KB of HTML carries 29 React Server Component
  payload chunks and none of the page's text.
- Third parties requested by the homepage: Google Tag Manager, Microsoft Clarity, Kommunicate chat,
  YouTube, OpenWeatherMap, AddToAny, Iconify (three hosts), an Azure blob store for images.
- The content API rejects calls without the site's headers (HTTP 401).

Assessment: the weight is likely driven by unoptimised images and video from the blob store and
third-party scripts [hypothesis: needs a request breakdown]; the blank-page failure mode is an
architecture choice (client-only content, no fallback, no error boundary) and is the single most
important technical lesson for the redesign. [assessment]

---

## 10. Opportunities for a fundamentally superior experience

Each opportunity answers specific findings. Outcomes are hypotheses until tested with passengers.

| # | Opportunity | Answers | Confidence the problem exists |
|---|---|---|---|
| O1 | Content that survives failure: server-rendered pages with cached content, explicit "data unavailable" and retry states, a page-weight budget and stable layout | Findings 1, 4; sections 9.2, 9.3 | High [direct] |
| O2 | One airport model: KUL with two terminals, one canonical URL per topic, airport-specific pages only where content differs, all 39 airports at least at listing level, 301 redirects from every old path | Findings 2, 3; section 1.1 | High [direct] |
| O3 | One KUL flight search that resolves the terminal, a page per flight, scheduled and estimated times, "updated at hh:mm", and web alerts without the app | Finding 6; Task 1 | Medium [direct, search; gaps hypothesis] |
| O4 | Price-first parking: daily cap shown first, three products made unmistakable, a calculator fed by the same rate data as the barrier, a warning before a long stay in Preferred, dated rate changes | Finding 7; Task 2 | High [direct, search] |
| O5 | A live status layer: Aerotrain, inter-terminal link, shuttle, baggage reclaim, known immigration disruption, with times and sources, driven by data rather than news posts | Finding 8; Voice of the passenger | High for need [search]; feasibility hypothesis |
| O6 | A "to and from the airport" planner: rail, bus, official taxi, e-hailing pick-up points and fees, with dated fares (RM65 from 1 January 2027) and an anti-touting message at the decision point | Task 4; touting rows | High [search] |
| O7 | Facilities as data: prayer rooms, toilets, baby care, clinics with level, zone, airside or landside, hours, linked to the map and to gates | Task 3 | Medium [search gap] |
| O8 | A services marketplace and single checkout: Fast Track, parking, day rooms, lounges, offered in context from the flight page | Finding 10; section 6 | Medium [direct, hypothesis] |
| O9 | Accessibility by default: WCAG 2.2 AA target, `h1` and landmarks on every page, named controls, an accessibility statement, assistance as a top-level task, Malay and Chinese alongside English | Finding 5; section 4 | High [direct, lab] |
| O10 | One help centre: lost and found by where the item was lost, one verified contact record, chat hours stated, feedback in the same place | Task 5; section 8 | Medium [direct, search] |
| O11 | One corporate front door: ownership and governance after delisting, sustainability, media, careers and procurement under one design system, with one source for leadership pages | Corporate observations | Medium [search] |

---

## Voice of the passenger

Evidence from press and app-store reviews, 2024 to 2026. Severity is an expert assessment combining
harm, frequency and reputational exposure; "digital remedy" is a hypothesis to test.

| # | Pain point | Evidence, date and URL | Who it affects | Digital remedy (hypothesis) | Severity |
|---|---|---|---|---|---|
| V1 | Bill shock in Preferred Parking: RM2,084 after about two weeks | [search] paultan.org, 16 Jan 2025, https://paultan.org/2025/01/16/rm2084-to-park-at-klia-if-youre-going-to-park-long-term-be-careful-not-to-go-into-preferred-parking/ | Malaysian drivers on long trips | Price-first parking page; daily cap per product; warning before a long Preferred booking | High |
| V2 | Rate rise and calculator lag: RM213 estimated, RM384 charged; MAHB said the lower rate was a promotion that ended 24 Feb 2026 and denied raising rates quietly | [search] The Rakyat Post, 16 May 2026, https://www.therakyatpost.com/news/malaysia/2026/05/16/watch-klia-raised-its-parking-rates-the-calculator-didnt-get-the-memo/ ; Malaysiakini (May 2026), https://www.malaysiakini.com/news/775688 | Drivers; MAHB reputation | One rate source for page, calculator and barrier; dated rate notices; promotion end dates shown | High |
| V3 | Aerotrain disruptions after the July 2025 relaunch: passengers walked the guideway (13 Jul 2025), further stoppages (4 Aug 2025), the minister "embarrassed" and an Apad investigation (Oct 2025), nightly closures from 15 Nov 2025, 24-hour service back on 1 Jun 2026, night closures for software work 8-17 Oct and 28 Nov-1 Dec 2026 | [search] The Star 13 Jul 2025, https://www.thestar.com.my/news/nation/2025/07/13/klia-aerotrain-services-restored-following-recent-breakdown ; The Star 29 Oct 2025, https://www.thestar.com.my/news/nation/2025/10/29/loke-says-embarrassed-by-aerotrain-incident-action-to-be-taken-against-mahb ; The Edge, https://theedgemalaysia.com/node/779715 ; Malay Mail 7 Oct 2026, https://www.malaymail.com/news/malaysia/2026/10/07/flying-in-to-klia-after-midnight-buses-replace-aerotrain-from-12am-to-5am-during-software-works/238049 | Terminal 1 passengers using C gates (satellite), especially late-night flights | Live Aerotrain status with planned closures and the bus alternative, shown on affected flight pages | High |
| V4 | Terminal 1 baggage-system failure on 18 Apr 2026: two to four hour waits; passengers told to leave and return; the minister ordered a review and an overhaul of protocols | [search] The Star 19 Apr 2026, https://www.thestar.com.my/news/nation/2026/04/19/loke-orders-review-after-klia-t1-baggage-system-breakdown-delays-passengers ; FMT 20 Apr 2026, https://www.freemalaysiatoday.com/category/nation/2026/04/20/ministry-orders-overhaul-of-klias-baggage-handling-system | Arriving Terminal 1 passengers and those meeting them | Incident banner and per-flight baggage status; instructions for collecting bags later; contact route | High (rare but severe) |
| V5 | Immigration: autogate outage for foreign visitors at KLIA T1 and T2 (19 Jul 2025); a nationwide immigration-system crash with waits over an hour reported at KLIA (April 2026); the government says over 85% clear in under 25 minutes but acknowledges peak overcrowding | [search] The Star 19 Jul 2025, https://www.thestar.com.my/news/nation/2025/07/19/autogate-glitch-causes-chaos-at-klia-and-johor-checkpoints-m039sian-passport-holders-unaffected ; Dawn (April 2026), https://www.dawn.com/news/1925232 ; theSun, https://thesun.my/malaysia-news/over-85-pct-of-arrivals-at-klia-clear-immigration-process-in-less-than-25-minutes-da13310210/ | Foreign arrivals; transfer passengers changing terminals | Entry checklist (Digital Arrival Card, autogate eligibility) linked to official sources; disruption notices; queue information only if Immigration shares data | Medium (MAHB does not run immigration) |
| V6 | Taxi touting persists despite crackdowns; 54 vehicles seized in a two-week operation (July 2026); e-hailing drivers bypassing apps and charging up to RM800 | [search] carz.com.my, Jun 2025, https://www.carz.com.my/2025/06/taxi-touting-at-klia-still-on-the-rise-despite-crackdowns ; NST Jul 2026, https://www.nst.com.my/amp/news/nation/2026/07/1482006/klia-touts-rtd-seizes-54-vehicles-two-week-crackdown-watch ; Malay Mail 7 Jul 2026, https://www.malaymail.com/amp/news/malaysia/2026/07/07/jpj-cracks-down-on-e-hailing-drivers-at-klia-bypassing-apps-charging-up-to-rm800/226642 | First-time international visitors | Official options, fares and pick-up points on the arrival flight page and transport planner; Scam Alert content placed where the decision is made | High |
| V7 | Changing terminals means leaving, re-clearing and re-checking; a seamless link promised for mid-2026 (Q2-Q3) is not confirmed as launched; late-night shuttle gaps reported | [search] paultan.org, 6 Apr 2026, https://paultan.org/2026/04/06/klia-connectivity-between-terminal-1-and-terminal-2-to-commence-by-third-quarter-of-this-year-loke/ ; Malay Mail 27 Aug 2025 (see `f-klia-transport.md`) | Self-transfer passengers between Terminal 1 and Terminal 2 | A transfer planner by flight pair with minimum time, steps and shuttle status; one page, not four per tree | High |
| V8 | MYairports app: map "useless", no search, few labels; crashes when submitting feedback | [search] App Store reviews (undated, small sample), https://apps.apple.com/au/app/myairports/id1352952170 , https://apps.apple.com/id/app/myairports/id1352952170 | App users | Searchable web map and facility data shared by web and app; feedback that does not depend on the app | Medium |
| V9 | The website goes blank or shows a framework error when its API refuses the client | [direct] this project, 16-17 Nov 2026 | Anyone the API refuses; possibly users on shared networks | Server-rendered fallback, error states, monitoring | High |
| V10 | Conflicting phone numbers and scattered contact routes | [search] `a-passenger-klia.md` | Passengers seeking help | One verified contact record in structured data and on the page | Medium |

Ratings context:

- Skytrax World Airport Awards 2026: KLIA 60th, up from 65th in 2025. [search, The Rakyat Post 26
  Mar 2026,
  https://www.therakyatpost.com/news/malaysia/2026/03/26/klia-breaks-into-worlds-top-60-but-the-gap-with-asias-best-remains-wide/]
- ACI ASQ: KLIA in the global top 10 for airports over 40 million passengers in 2024, score 4.99 of
  5 [search, Malay Mail 17 Mar 2025,
  https://www.malaymail.com/news/malaysia/2025/03/17/klia-makes-worlds-top-10-in-2024-airport-service-quality-survey/169917];
  Langkawi best in Asia-Pacific (2 to 5 million) in the 2025 awards, a fifth consecutive win
  [search, Malay Mail 26 Feb 2026,
  https://www.malaymail.com/news/malaysia/2026/02/26/langkawi-international-airport-named-best-in-asia-pacific-for-fifth-consecutive-year/210536].
  No KLIA result for the 2025 ASQ awards was found. [search negative]
- ASQ surveys departing passengers at the gate [prior], so a high score can coexist with arrival-side
  pain (baggage, immigration, touts) in the press. [hypothesis]
- No overall App Store or Google Play star rating for MYairports was returned by search. [search
  negative] Do not quote one until read from the stores.

Management statements and priorities:

- Commercial reset, ShopLAH and the duty-free concession review (see section 6). [search]
- Network investment in connectivity and capacity. [search, The Star 20 Oct 2026,
  https://www.thestar.com.my/business/business-news/2026/10/20/mahb-focuses-on-air-connectivity-capacity-expansion-to-support-growth]
  2026 coverage also reports AI forecasting of peak arrivals and data-sharing with Customs and
  Immigration. [search; the individual source was not isolated, confirm before use]
- Airports 4.0 and the single-token biometric journey: announced 2018-2019 (RM30 million digital
  initiative, SITA single token), first phase reported in 2021. [search,
  https://www.marketing-interactive.com/mahb-to-invest-rm30m-in-airports-4-0-digital-initiative-unveils-myairports-app ;
  https://www.biometricupdate.com/202101/kuala-lumpur-airport-integrates-over-100-biometric-kiosks-gates-and-counters-and-mobile-app]
  The app page describes "EZPaz" facial registration from home. [search, MAHB app page] No 2025-2026
  management statement on the single-token programme or a "super app" was found. [search negative]
- Ministerial pressure: the Transport Minister ordered reviews after the Aerotrain (October 2025)
  and baggage (April 2026) failures. [search, V3, V4]

---

## Corporate site observations

- **Separate application.** `corporate.malaysiaairports.com.my/en` is a separate Next.js
  application using Ant Design; its 404 page has the placeholder title "Corporate Website" and
  `noindex`. [direct] Later direct requests were reset by the server. [direct]
- **Structure.** About Us (profile, brand, management, board), Sustainability and Media Centre, with
  news at numeric URLs (`/en/media-centre/news/1687`). [search] A management page is duplicated
  under a `/penang/` path with different content. [search]
- **Post-privatisation gap.** MAHB was delisted on 25 February 2025 and is wholly owned by Gateway
  Development Alliance, with a government special share. [search] A listed-company investor
  relations section no longer applies; an ownership and governance page and a reports archive are
  needed. No such page was located. [search for the facts; location: gap]
- **Procurement.** Vendors register on the Vendor Management System (`vms.malaysiaairports.com.my`)
  and tender events run on the third-party Procurehere portal with an annual subscription; older
  notices (2018-2020) name `epro.malaysiaairports.com.my`; tender PDFs also sit under a legacy
  `malaysiaairports.com.my/sites/corporate/files/tender/` path. [search, tender notices 2018-2023,
  for example https://vms.malaysiaairports.com.my/File/Advertisement/MAHB-HQ-T-07-2022.pdf] Current
  steps and fees were not confirmed. [gap]
- **Careers.** `careers.malaysiaairports.com.my`. [search] Its URL pattern resembles a hosted
  recruitment platform. [prior] Named programmes were not researched. [gap]
- **Sustainability content to carry forward.** Net zero by 2050, 20% renewable energy by 2030, KLIA
  at Airport Carbon Accreditation Level 3, the KLIA Aeropolis solar project. [search,
  `f-corporate.md`]
- **Web estate.** At least 13 hostnames across three domains: `www`, `airports`, `corporate`,
  `feedback` (direct); `careers`, `vms`, `epro`, `care`, `convergence`, an `annualreport2023`
  microsite (search), all on `malaysiaairports.com.my`; `api` and `apss-prod-cms` on
  `myairports.com.my` (direct); `myairportfasttrack.com` (direct).
- **Cross-linking.** The `www` contact page carries "Passenger" and "Corporate" tabs and a KLIA
  Terminal 1 passenger block [search]; the passenger switcher offers "Airports" and "Corporate".
  [direct]

---

## Confirmed versus hypotheses

| # | Claim | Level | What would settle it |
|---|---|---|---|
| 1 | Pages are client-rendered and empty without the content API, with no error state | direct | Settled |
| 2 | 6 of 16 URLs returned 502 and 4 showed an unhandled application error under the block | direct | Settled for that window |
| 3 | Real passengers on shared networks hit the API limit | hypothesis | MAHB firewall and API logs |
| 4 | Sitemap: 276 URLs, six identical 46-path trees, English only, no flight pages | direct | Settled |
| 5 | Five of 39 airports covered; no Subang section | direct (site), search (39) | Settled |
| 6 | KLIA-only pages under other airports carry KLIA content | hypothesis | Read the pages |
| 7 | 48 sitemap URLs duplicate a topic | direct | Settled |
| 8 | At least 19 malformed prefixes and legacy pages indexed | search | Status codes and canonicals on a crawl |
| 9 | Homepage performance 9 to 19, CLS 0.62, about 34 million bytes | direct, lab | Field data (Chrome UX Report) |
| 10 | axe 6 rules / 27 elements (desktop), 5 / 19 (mobile); Lighthouse accessibility 79 | direct, lab | Manual WCAG 2.2 AA audit |
| 11 | No `h1` on the homepage; "Corporate Website" title on a passenger page | direct | Settled |
| 12 | Flight widget is departures-only and preset to Terminal 1 | direct | Settled |
| 13 | Cross-terminal flight search fails; no per-flight page; no web alerts | hypothesis | Click-through test |
| 14 | No parking rate table on the KLIA Terminal 1 parking page | direct | Settled (16 Nov) |
| 15 | Parking bill shock and calculator lag | search | MAHB complaint data |
| 16 | Aerotrain, baggage, immigration and touting pain points 2025-2026 | search | MAHB complaint and operational data |
| 17 | No live status layer on the site | hypothesis | Full homepage and notice review |
| 18 | Special-assistance page exists | direct | Settled |
| 19 | Web chat exists (Kommunicate; care chat with limited hours) | direct (widget), search (hours) | Settled for existence |
| 20 | Fast Track sold on a separate domain | direct | Settled |
| 21 | No single basket or contextual offers | hypothesis | Booking-flow test |
| 22 | At least 13 hostnames in the estate | direct (7), search (6) | DNS and link inventory |
| 23 | Two conflicting general phone numbers | search | Read the Contact Us page |
| 24 | Commercial reset, ShopLAH, duty-free review are 2026 priorities | search | MAHB briefing |
| 25 | Single-token programme still active in 2026 | prior / search (2019-2021 only) | MAHB briefing |
| 26 | KLIA 60th in Skytrax 2026; top 10 ASQ (over 40 million) for 2024 | search | Official award pages |
| 27 | MYairports app overall rating | not found | Read the store listings |
| 28 | Procurement via VMS and Procurehere | search (2018-2023 notices) | Read the current portal |
| 29 | Outcomes of opportunities O1 to O11 | hypothesis | Usability testing and analytics after launch |

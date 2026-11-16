# Audit A: MAHB passenger website, KLIA Terminal 1 and KLIA Terminal 2

Site audited: https://airports.malaysiaairports.com.my (passenger site of Malaysia Airports Holdings Berhad)
Scope: KLIA Terminal 1 (`/en/klia1`) and KLIA Terminal 2 (`/en/klia2`) experience
Audit date: 2026-11-16
Status of this document: PARTIAL. Built from search-engine evidence only. The site itself could not be opened from the research container (see "Evidence access"). Every claim carries an evidence tag. Nothing here was observed in a browser.

Evidence tags used throughout:

| Tag | Meaning in this document |
|---|---|
| `direct` | Fetched from the official page in this run. NONE in this document: 0 direct observations. |
| `search` | Stated in a search result (URL, page title, snippet or search summary) obtained on 2026-11-16. Source URL given. |
| `prior` | Background knowledge of the researcher, not re-confirmed in this run. As-of date given. Lower confidence. |
| `hypothesis` | Inference that needs a live crawl, usability testing or technical access to confirm. |

---

## 1. Summary

1. The passenger site is a multi-airport site with one URL namespace per airport: `/{lang}/{airport}/{section}/{page}`. KLIA is split into two "airports": `klia1` and `klia2`. Other slugs seen: `penang`, `kota-kinabalu`, `langkawi`. [search]
2. For each KLIA terminal the indexed sections are: home, Flight Information (arrivals, departures), Air Travel guide (facilities, services, public transport, inter-terminal transfer, rental services, customs and immigration, liquids/restricted items, visa), Parking, Map, Shop/Dine/Services, Booking Services (Fast Track, Butterfly Effect, things to do, film and photography permit, educational tours), Mobile App, Help. [search]
3. The strongest confirmed defect is URL hygiene. In only 23 search queries, at least 19 different junk first path segments were found indexed for the same pages (`/aba/`, `/index/`, `/i/`, `/index.php/`, `/$/`, `/nodeundefined/`, `/sma2012undefinedundefinedundefined/`, `/eraman-partners-alipay-attract-chinese-tourists-its-duty-free-and-travel-retail-stores/` and others). Unknown airport slugs (`/en/klia/…`, `/…/transport/…`, `/…/special-assistance/…`) are indexed with KLIA Terminal 1 content. [search for the URLs and titles; the routing explanation is a hypothesis]
4. Page titles are inconsistent or broken: passenger pages titled "Corporate Website", a leaked CMS placeholder title "Shop and Dine Meta data - KLIA - Malaysia Airports Holdings", bare titles "Dine", "Restaurants", "Cafes", "Airport". Terminal naming is inconsistent across titles: "KLIA1", "KLIA Terminal 1", "KLIA T1", "KLIA2", "KLIA Terminal 2", "KUL T2", "klia2". [search]
5. Legacy pages remain indexed on the same host: a 2018 GST parking-rate notice (`/parking-rates-klia`), a 2021 aerotrain replacement news item and query-string URLs (`/?c=news&id=261&m=media_centre`). [search]
6. Flight information exists as a home-page widget ("Find a Departing Flight", flight-number search) and as arrivals/departures boards per terminal. Fields evidenced: time, origin/destination, airline, flight number, status, check-in counter, boarding gate (departures), belt and gate (arrivals), and a date / "Last Update" stamp. [search] Flight detail pages, dual scheduled/estimated display, date pickers and notifications on the web are NOT evidenced. [gap]
7. Two different phone numbers appear in the site's structured data: +60 3 8777 7000 and +60 3 8777 0000, with one email, info@malaysiaairports.com.my. [search] One of them is likely wrong. [hypothesis]
8. Commercial content evidenced: Fast Track, parking booking with "real-time availability", a "DaySleeper Deal" (6 hours, MYR 135), visitor passes, filming permits, educational tours. [search] Lounge booking, meet-and-greet, porter, buggy, baggage storage and hotel booking were NOT found on the site in this run. [gap]
9. Not assessable without access: visual design, mobile behaviour, accessibility conformance, performance, site search, language switcher, chatbot/WhatsApp, feedback forms, map technology. All statements on these are hypotheses with a test plan (section 9).
10. Research limits: direct access blocked on both attempts; the shared web-search budget for this run was exhausted after 23 successful queries (5 further queries were refused). A follow-up crawl is required before design decisions rely on the gaps listed.

---

## 2. Evidence access

| Item | Result |
|---|---|
| Direct fetch attempt 1 (start of run, 2026-11-16) | BLOCKED. WebFetch: `getaddrinfo ENOTFOUND airports.malaysiaairports.com.my`. curl: `CONNECT tunnel failed, response 403` (container network allowlist). |
| Direct fetch attempt 2 (end of run, 2026-11-16) | BLOCKED. Same error. Details in section 2.1. |
| Playwright / screenshots | Not possible (same network block). No screenshots captured. |
| Web search | 23 successful queries on 2026-11-16, most restricted to `airports.malaysiaairports.com.my`. 5 further queries refused: per-turn shared search budget exhausted. |
| What search evidence gives | Indexed URLs, page titles, meta descriptions, fragments of page text and structured data, as summarised by the search tool. It does NOT give layout, interaction, timings, or full page text. |
| What search evidence cannot give | Whether an indexed URL still returns HTTP 200 today, whether it carries a canonical tag, exact labels, prices, tables, forms, widgets, responsive behaviour. |
| Freshness of search evidence | Snippets carried page dates of 06 Oct 2026 (KLIA1 home) and 07 Oct 2026 (Kota Kinabalu page). Treat the picture as "site as indexed in October–November 2026". |

### 2.1 Second direct fetch attempt

BLOCKED again on 2026-11-16, after all search work was finished. WebFetch of `https://airports.malaysiaairports.com.my/en/klia1` returned `getaddrinfo ENOTFOUND airports.malaysiaairports.com.my`. No retry was made. The host `airports.malaysiaairports.com.my` has to be added to the container's network allowlist before sections 5.3, 5.4 and 5.9 and the gap rows U1–U18 can be closed.

---

## 3. Site map as found

All URLs below were returned by search on 2026-11-16 [search] unless marked otherwise. "Title as indexed" is the page title the search engine returned. Nothing below was opened directly.

### 3.1 URL pattern and airport selection

```
https://airports.malaysiaairports.com.my/{lang}/{airport}/{section}/{page}[?tab=…]
  {lang}    = en                      (only value seen in canonical-looking URLs)
  {airport} = klia1 | klia2 | penang | kota-kinabalu | langkawi | …
```

| Observation | Evidence |
|---|---|
| KLIA Terminal 1 home is `/en/klia1`; KLIA Terminal 2 home is `/en/klia2`. Each terminal is a separate "airport" with its own copy of every section. | search |
| Other airports use the same pattern: `/en/penang` ("PEN - Penang"), `/en/kota-kinabalu`, `/en/langkawi/mobile-app`. | search |
| The corporate site (`www.malaysiaairports.com.my`) navigation has "Passenger" and "Corporate" tabs and a passenger block labelled "KLIA Terminal 1" with Departures, Arrivals and a mobile-app link. | search (https://www.malaysiaairports.com.my/contact-us/corporate) |
| `/myairports` is indexed with the title "KLIA Terminal 1". | search |
| Default airport appears to be KLIA Terminal 1: unknown or missing airport slugs are indexed with KLIA T1 content (`/en/klia/booking-services` → "Booking Services at KLIA Terminal 1"; `/getting-around/transport/parking` → "KLIA Terminal 1 Parking"; `/air-travel/special-assistance/flight-information/arrivals` → "KLIA1 Live Arrival Flights"). | URLs and titles: search. "Fallback to KLIA1" as the mechanism: hypothesis |
| How the airport/terminal switcher looks and behaves (dropdown, modal, remembered choice, geolocation). | NOT OBSERVED. gap |
| Whether choosing T2 while deep in a T1 page keeps the same sub-page. | NOT OBSERVED. gap |

### 3.2 KLIA Terminal 1 tree

```
/en/klia1                                              "KLIA Terminal 1"
├── /flight-information                                "KLIA Terminal 1 Flight Information & Status"
│   ├── /arrivals                                      "KLIA1 Live Arrival Flights"
│   └── /departures                                    "KLIA1 Live Departure Flights"
├── /air-travel                                        "Air Travel Guide at KLIA Terminal 1"
│   │                                                  (also indexed as "Security Screening - KLIA - Malaysia Airports")
│   ├── /facilities                                    "Corporate Website"   <- wrong title
│   ├── /services                                      "Corporate Website"   <- wrong title (lists Fast Track, filming & photography)
│   ├── /public-transport   (?tab=bus)                 "Getting to KLIA Terminal 1 by Public Transport"
│   ├── /inter-terminal-transfer                       "KLIA1 Inter-Terminal Transit & Transfer Guide"
│   ├── /rental-services                               "Car & Equipment Rental Services at KLIA1"
│   ├── /customs-and-immigration                       "Customs & Immigration at KLIA Terminal 1"
│   ├── /lag-restricted-items                          "Liquids, Aerosols & Gels Restrictions at KLIA1"
│   ├── /visa                                          "Visa Information for Travellers at KLIA Terminal 1"
│   └── (check-in / cabin luggage page; URL not captured)
├── /parking                                           "KLIA Terminal 1 Parking"
│                                                      (seen only under variant prefixes: /index.php/klia1/parking, /map/klia1/parking)
├── /map                                               "KLIA Terminal 1 Map"
├── /shop-dine-services                                "Shop, Dine & Services at KLIA Terminal 1"
│   ├── /shop                                          "Shopping at KLIA Terminal 1"
│   ├── /dine
│   │   ├── /restaurants                               "Restaurants"
│   │   └── /cafes                                     "Cafes"
│   └── /services                                      "Services at Kuala Lumpur International Airport (KUL) KLIA Terminal"
├── /booking-services                                  "Booking Services at KLIA Terminal 1"
│   ├── /things-to-do                                  "Things to Do at KLIA Terminal 1"
│   ├── /butterfly-effect                              "The Butterfly Effect KLIA T1"
│   ├── /film-and-photography                          "Film & Photography Permit at KLIA1"
│   └── /visitation-kul                                "KLIA1 Airport Educational Tours for Schools & Institutions"
├── /mobile-app                                        "Mobile App at KLIA Terminal 1"
└── /help                                              "Help & Support at KLIA Terminal 1"
```

### 3.3 KLIA Terminal 2 tree

Only pages actually returned by search are listed as [search]. Pages expected by symmetry with T1 but not returned are marked [hypothesis].

```
/en/klia2                                              "KLIA Terminal 2"  (variant /$/klia2 titled "KL International Airport (KUL) KLIA2")
├── /flight-information                                "KLIA2 Flight Information & Real-Time Status"
│   ├── /arrivals                                      "KLIA Terminal 2 Live Arrival Flights"
│   └── /departures                                    "KLIA2 Live Departure Flights"
├── /air-travel                                        "Complete Air Travel Guide at KLIA2"
│   ├── /public-transport   (?tab=Bus)                 "Getting to KLIA2 by Public Transport"
│   ├── /inter-terminal-transfer                       "KLIA2 Inter-Terminal Transfer Information| Malaysia Airports"
│   └── facilities, services, rental-services, customs-and-immigration, lag-restricted-items, visa   [hypothesis: exist by symmetry]
├── /parking                                           [hypothesis: not returned by search in this run]
├── /map                                               "KLIA2 Terminal Map"
├── /shop-dine-services                                "Shop, Dine & Services at KLIA2"  AND  "Shop and Dine Meta data - KLIA - Malaysia Airports Holdings"
│   └── /dine                                          "Dine" / "Dining at KLIA2"
├── /booking-services                                  "Booking Services at KLIA Terminal 2"
│   └── /butterfly-effect                              "The Butterfly Effect at KLIA2"
├── /mobile-app                                        "Malaysia Airports Mobile App"
└── /help                                              [hypothesis: not returned by search in this run]
```

### 3.4 Legacy and stray URLs still indexed on the same host

| URL | Title as indexed | Note | Evidence |
|---|---|---|---|
| `/parking-rates-klia` | "Parking Rates at KLIA at Kuala Lumpur International Airport (KUL) KLIA Terminal" | Text refers to 0% GST from 1 June 2018, "11,442 parking lots", short-term blocks B, C, D. Content is about 8 years old. | search |
| `/getting-one-terminal-another-easier-ever` | "Getting from One Terminal to Another Is Easier than Ever at Kuala Lumpur International Airport (KUL) KLIA Terminal" | Old article. | search |
| `/?c=news&id=261&m=media_centre` | "KL International Airport (KUL) KLIA and klia2" | Old query-string CMS URL. Search summary links a 27 Dec 2021 item on aerotrain replacement. | search |
| `/?c=detail&id=110&m=relax` | "KL International Airport (KUL) KLIA and klia2" | Old query-string CMS URL. | search |
| `/en/klia1?aid=1&c=info&id=2&m=airport`, `/en/klia1?aid=2&c=in_around&id=9&m=airport` | "KLIA Terminal 1" | Old query strings appended to the new home URL; indexed as separate pages. | search |
| `/getting-around/transport/parking` | "KLIA Terminal 1 Parking" | Old-style path indexed with new parking content. Search metadata dated the listing roughly 3,200 days old (about early 2018). | search |

### 3.5 Variant first-segment prefixes found indexed (same pages, different URLs)

At least 19 distinct values in the `{lang}` position were returned for KLIA pages [search]:

`aba`, `i`, `index`, `index.php`, `$`, `flight-information`, `shop-dine-services`, `air-travel`, `getting-around`, `klia2-getting-around`, `sustainability`, `events`, `map`, `transit`, `passenger-guide`, `malaysia-`, `nodeundefined`, `sma2012undefinedundefinedundefined`, `eraman-partners-alipay-attract-chinese-tourists-its-duty-free-and-travel-retail-stores`

Examples (all [search]):

- https://airports.malaysiaairports.com.my/aba/klia1/flight-information/arrivals ("Arrivals")
- https://airports.malaysiaairports.com.my/i/klia1/flight-information/departures ("Departures - Corporate Website - Malaysia Airports Holdings")
- https://airports.malaysiaairports.com.my/index/klia1/flight-information/departures ("Departures - KLIA - Malaysia Airports Holdings")
- https://airports.malaysiaairports.com.my/$/klia1/booking-services ("Booking Services at KLIA Terminal 1")
- https://airports.malaysiaairports.com.my/nodeundefined/klia1/map ("Corporate Website")
- https://airports.malaysiaairports.com.my/sma2012undefinedundefinedundefined/klia2/flight-information/arrivals ("Arrival - KLIA - Malaysia Airports")
- https://airports.malaysiaairports.com.my/eraman-partners-alipay-attract-chinese-tourists-its-duty-free-and-travel-retail-stores/klia2/air-travel/inter-terminal-transfer
- https://airports.malaysiaairports.com.my/shop-dine-services/terminal-1-floor-map/flight-information/departures ("KLIA1 Live Departure Flights")

Interpretation [hypothesis]: the router accepts any string in the language position (and falls back to KLIA1 for unknown airport slugs), broken relative links on old or current pages generate these paths (`nodeundefined`, `…undefinedundefinedundefined` look like JavaScript string concatenation with undefined values), and there is no redirect or effective canonical to `/en/…`. Needs a live check of status codes and `<link rel="canonical">`.

---

## 4. Must-keep inventory

Every passenger function and content type that this run found evidence for. "Where" is the canonical-looking URL. All rows are [search] unless stated. The redesign must preserve each of these.

### 4.1 Confirmed present (search evidence)

| # | Function / content | Where (T1; T2 equivalent where seen) | Evidence | Notes |
|---|---|---|---|---|
| K1 | Per-airport / per-terminal home page | `/en/klia1`, `/en/klia2` | search | T2 described as home to budget and regional airlines. |
| K2 | Multi-airport coverage in one site | `/en/penang`, `/en/kota-kinabalu`, `/en/langkawi/…` | search | Switcher UI not observed. |
| K3 | Home-page flight search: "Find a Departing Flight" plus flight-number search | `/en/klia1` | search | Home shows a departures/arrivals table with columns origin (or destination), airline, flight, status, time. |
| K4 | Flight information hub with Arrivals / Departures tabs | `/en/klia1/flight-information`, `/en/klia2/flight-information` | search | |
| K5 | Live departures board: scheduled time, destination, airline (code), flight number, check-in counter, boarding gate, status | `/en/klia1/flight-information/departures`, `/en/klia2/flight-information/departures` | search | Check-in counter and boarding gate seen in the indexed home snapshot of 06 Oct 2026. |
| K6 | Live arrivals board: status, expected landing time, baggage belt/carousel, gate | `/en/klia1/flight-information/arrivals`, `/en/klia2/flight-information/arrivals` | search | |
| K7 | Date / "Last Update" stamp on flight data | `/en/klia1` ("06 Oct 2026"), `/en/kota-kinabalu` ("Last Update … 07 Oct 2026") | search | Exact label, granularity (date vs time) not confirmed. |
| K8 | Air travel guide: check-in, security screening, baggage, immigration | `/en/klia1/air-travel`, `/…/klia2/air-travel` | search | |
| K9 | Cabin / check-in luggage rules ("strict single cabin luggage policy") | under `/en/klia1/air-travel` (URL not captured) | search | |
| K10 | Liquids, aerosols and gels / restricted items | `/en/klia1/air-travel/lag-restricted-items` | search | |
| K11 | Customs and immigration (duty-free allowances, prohibited goods, clearance steps) | `/en/klia1/air-travel/customs-and-immigration` | search | Cathay Pacific's KLIA page sends its passengers to this host for customs information. |
| K12 | Visa information (visa on arrival, Malaysia e-Visa, immigration requirements) | `/en/klia1/air-travel/visa` | search | |
| K13 | Terminal facilities page | `/en/klia1/air-travel/facilities` | search | Title is "Corporate Website". Facility list not captured. |
| K14 | Passenger services page | `/en/klia1/air-travel/services` and `/en/klia1/shop-dine-services/services` | search | Two different "services" pages (duplication). |
| K15 | Public transport guide with tabs (bus tab confirmed; taxis and ride-hailing named in description; "routes, fares and schedules") | `/en/klia1/air-travel/public-transport?tab=bus`, `/en/klia2/air-travel/public-transport?tab=Bus` | search | Rail/ERL tab not confirmed. Fares not captured. |
| K16 | Inter-terminal transfer guide (shuttle and train options, transit procedures); "free shuttle service 24/7" | `/en/klia1/air-travel/inter-terminal-transfer`, `/…/klia2/air-travel/inter-terminal-transfer` | search | |
| K17 | Car rental and equipment rental (including wheelchairs) | `/en/klia1/air-travel/rental-services` | search | |
| K18 | Parking page: short-stay, long-stay and premium zones, "real-time availability", rates, parking booking | `/en/klia1/parking` | search | Rate figures not captured. Booking flow not observed. |
| K19 | Terminal map described as interactive (check-in zones, gates, lounges, food courts, retail, facilities) | `/en/klia1/map`, `/en/klia2/map` | search | Technology/format not observed. |
| K20 | Shop, Dine & Services hub | `/en/klia1/shop-dine-services`, `/en/klia2/shop-dine-services` | search | |
| K21 | Shop directory | `/en/klia1/shop-dine-services/shop` | search | Filters and outlet detail pages not observed. |
| K22 | Dine directory with category sub-pages (Restaurants, Cafes; T2 mentions bars) | `/en/klia1/shop-dine-services/dine/restaurants`, `/…/dine/cafes`, `/en/klia2/shop-dine-services/dine` | search | |
| K23 | Booking services hub (grouped as Transport, Services, Amenities) | `/en/klia1/booking-services`, `/…/klia2/booking-services` | search | |
| K24 | Fast Track (paid priority lane) | listed on `/en/klia1/booking-services` and `/en/klia1/air-travel/services` | search | Price and booking flow not captured. |
| K25 | Visitor passes | `/en/klia1/booking-services` | search | |
| K26 | Film and photography permit | `/en/klia1/booking-services/film-and-photography` | search | |
| K27 | Airport educational tours for schools and institutions | `/en/klia1/booking-services/visitation-kul` | search | |
| K28 | "Things to Do" (dining, shopping, lounges, entertainment, wellness) | `/en/klia1/booking-services/things-to-do` | search | |
| K29 | The Butterfly Effect: hidden-disability programme (calm rooms, priority access, sensory facilities, assisted travel, Airport CARE Ambassadors, own FAQ) | `/en/klia1/booking-services/butterfly-effect`, `/…/klia2/booking-services/butterfly-effect` | search | The only accessibility content found. |
| K30 | Help & Support: FAQs, contact details, lost and found, passenger support | `/en/klia1/help` | search | |
| K31 | Contact phone and email in structured data | `/en/klia1/help` (+60 3 8777 0000), `/en/klia1/shop-dine-services/services` (+60 3 8777 7000), info@malaysiaairports.com.my | search | Numbers conflict. Verify before reuse. |
| K32 | Mobile app promotion page (iOS and Android; flight status, maps, promotions, travel services) | `/en/klia1/mobile-app`, `/en/klia2/mobile-app` | search | |
| K33 | App features described on the web: "Track My Flight" (flight number → check-in counter, boarding gate), "Plan My Journey" (KLIA T1 passengers only), AI virtual assistant "24/7" | `/en/langkawi/mobile-app` | search | Template text shared across airports. |
| K34 | News / headlines feed on airport home pages | `/en/klia1`, `/en/penang` | search | Headlines seen: limited KLIA parking ahead of F1 events; August passenger traffic; KLIA fourth globally in a connectivity ranking; "KLIA standardises e-hailing entry fees across both terminals". |
| K35 | "Scam Alert" banner | `/en/klia1` | search | |
| K36 | Featured commercial offer on home ("DaySleeper Deal", 6 hours, MYR 135) | `/en/klia1` | search | Price as indexed around October 2026. Re-verify. |
| K37 | Structured data (organisation / contact schema) in pages | `/en/klia1/help`, `/en/klia1/shop-dine-services/services` | search | Keep and correct. |
| K38 | Cross-link from corporate site to passenger flight boards | `www.malaysiaairports.com.my` navigation | search | |

### 4.2 Expected but NOT confirmed in this run (must be checked on the live site before finalising the inventory)

| # | Function / content | Status | Basis |
|---|---|---|---|
| U1 | Language switcher / Bahasa Melayu or Chinese versions | Not found. A Malay-language query returned only `/en/` pages. | search (negative result) |
| U2 | Site-wide search box | Not observed | gap |
| U3 | Flight detail page per flight | Not found in index | gap |
| U4 | Flight notifications / "track this flight" on the web | Not found; "Track My Flight" is described as an app feature | search + hypothesis |
| U5 | Lounge directory and lounge booking | Lounges only mentioned inside "Things to Do" and on the map | search (partial) |
| U6 | Meet-and-greet, porter, buggy services | Not found | gap |
| U7 | Baggage storage / left luggage, baggage wrapping | Not found | gap |
| U8 | Hotels (Sama-Sama, transit hotel, capsule hotel) pages or booking | Not found, apart from the "DaySleeper Deal" teaser | gap |
| U9 | Dedicated PRM / wheelchair special-assistance page | Not found. Only Butterfly Effect and "wheelchair" under rental services | search (negative result) |
| U10 | Travel advisories / operational notices section | Not found as a section; only home headlines and the Scam Alert banner | search (partial) |
| U11 | Promotions / events listing | No dedicated listing found; promotions are attributed to the mobile app | search (partial) |
| U12 | E-commerce link (shopMYairports) | Not seen in this run | prior (as of about 2024, MAHB operated shopMYairports) |
| U13 | Feedback form, WhatsApp channel, web chatbot | Not found | gap |
| U14 | Lost-and-found procedure detail (form, counter location, hours) | Only the existence of a lost-and-found topic on the help page is evidenced | search (partial) |
| U15 | Airline directory (airline → terminal, check-in rows, contact) | Not found | search (negative result) |
| U16 | KLIA T2 parking page, T2 help page | Not returned by search | gap |
| U17 | Outlet detail pages for shops and restaurants (location, hours, level, airside/landside) | Not found in index | gap |
| U18 | Map format (vendor, PDF fallback, deep links to outlets/gates) | Only "interactive" in the meta description | search (partial) |

---

## 5. Findings by audit point

Each finding is split into CONFIRMED OBSERVATIONS (search-level in this run; none are direct) and HYPOTHESES.

### 5.1 Content, functions and information architecture

Confirmed (search):

- C1.1 IA is airport-first: `/{lang}/{airport}/…`. KLIA T1 and T2 are parallel silos with duplicated section trees. Sources: `/en/klia1`, `/en/klia2`.
- C1.2 Top-level sections per terminal: Flight Information, Air Travel, Parking, Map, Shop-Dine-Services, Booking Services, Mobile App, Help. Source: URL tree in section 3.
- C1.3 "Services" exists twice with different parents: `/en/klia1/air-travel/services` and `/en/klia1/shop-dine-services/services`. Fast Track appears under Air Travel > Services and under Booking Services > Amenities.
- C1.4 Transport content is spread over three places: Air Travel > Public Transport, Air Travel > Inter-Terminal Transfer, Air Travel > Rental Services, plus Parking as its own top-level section, plus a "Transport" group inside Booking Services.
- C1.5 Accessibility content (Butterfly Effect) is filed under Booking Services, next to film permits and school tours.
- C1.6 "Things to Do" is filed under Booking Services although it is described as a discovery page (dining, shopping, lounges, entertainment, wellness).
- C1.7 Content is shared between airports through templates: the Langkawi mobile-app page describes a KLIA T1-only feature; the Penang home page carries a KLIA e-hailing headline.

Hypotheses:

- H1.1 The main navigation labels match the URL slugs (Flight Information, Air Travel, Parking, Map, Shop Dine & Services, Booking Services, Help). Needs live check.
- H1.2 Passengers who do not know their terminal (for example an airline that moved terminals) must pick T1 or T2 before seeing any flight; there is no combined KUL board. Needs live check. If true this is the largest IA problem for KLIA.
- H1.3 Content that is identical for both terminals (visa, customs, LAG rules) is duplicated per terminal and can drift apart. Needs content diff.

### 5.2 Navigation complexity and journey friction

Confirmed (search):

- C2.1 Arrivals and departures sit at depth 3 (`/en/klia1/flight-information/arrivals`); the home page also has its own flight widget.
- C2.2 Public transport modes are tabs driven by a query string, and the parameter is case-inconsistent across terminals: `?tab=bus` (T1) vs `?tab=Bus` (T2).
- C2.3 Old-style paths and unknown slugs do not land on an error page in the index; they are indexed with KLIA T1 pages (section 3.5). A user following an old bookmark or a broken link can land on KLIA T1 content while believing they are on another airport or section.
- C2.4 Dine is split into category pages (Restaurants, Cafes) with bare titles and no terminal name.

Hypotheses:

- H2.1 Switching terminal resets the user to the other terminal's home rather than the equivalent page.
- H2.2 Fast Track, parking booking and other bookable items hand off to separate booking domains with different look and feel. Needs click-through.
- H2.3 The transport page does not answer "how do I get to the city" in one view (rail, bus, taxi, e-hailing comparison of time and price); users must open each tab. Needs live check.

### 5.3 Visual hierarchy, typography, layout and consistency

Confirmed (search):

- C3.1 Naming is inconsistent in page titles: "KLIA1", "KLIA Terminal 1", "KLIA T1", "KUL T2", "KLIA2", "KLIA Terminal 2", "klia2", "Kuala Lumpur International Airport (KUL) KLIA Terminal", "KL International Airport (KUL) KLIA and klia2".
- C3.2 Title patterns are inconsistent: "X at KLIA Terminal 1", "KLIA1 X", "X - KLIA - Malaysia Airports", "X - Corporate Website - Malaysia Airports Holdings", "X| Malaysia Airports" (missing space), and bare "Dine".

Not assessed: actual visual hierarchy, typography, spacing, colour, component consistency, imagery. No page was rendered in this run.

Hypotheses:

- H3.1 The copy inconsistency in titles is mirrored in on-page headings and labels.
- H3.2 Home pages mix operational content (flight search, Scam Alert), corporate news (traffic statistics, rankings) and commercial teasers (DaySleeper Deal) without clear priority. The mix itself is search-evidenced (K34–K36); the priority problem needs visual review.

### 5.4 Mobile responsiveness and accessibility

Confirmed (search):

- C4.1 At least two key pages have a non-descriptive title ("Corporate Website"), and several have generic titles ("Dine", "Cafes", "Airport"). This fails the intent of WCAG 2.4.2 Page Titled for those pages as indexed.
- C4.2 Accessibility-related passenger content found: Butterfly Effect (hidden disabilities) for T1 and T2; wheelchair mentioned under equipment rental. No dedicated reduced-mobility or special-assistance page was returned by a targeted search.

Not assessed: responsive layout, touch targets, flight-table behaviour on small screens, colour contrast, keyboard operation, focus order, ARIA on tabs and tables, screen-reader announcements of live flight updates, language attributes, zoom/reflow, map accessibility.

Hypotheses:

- H4.1 The flight tables (7 or more columns) do not reflow well below 400 px width.
- H4.2 The interactive map has no accessible text alternative (list of facilities by level).
- H4.3 The site has no published accessibility statement. Needs live check.

### 5.5 Flight search and real-time data presentation

Confirmed (search):

- C5.1 Home page widget: "Find a Departing Flight", flight-number search, and a table with origin/destination, airline, flight, status, time.
- C5.2 Departures rows include destination, departure time, check-in counter, boarding gate, airline code, status (indexed snapshot dated 06 Oct 2026).
- C5.3 Arrivals board described with status, expected landing time, belt assignment and gate.
- C5.4 Boards are per terminal (T1 and T2 separate URLs).
- C5.5 A date / "Last Update" stamp is present in indexed page text (06 Oct 2026 on KLIA1; "Last Update" 07 Oct 2026 on Kota Kinabalu).
- C5.6 Flight rows were present in the indexed HTML, so at least part of the board is server-rendered and crawlable. Consequence: search engines hold stale flight rows (an October snapshot was returned in mid-November).
- C5.7 "Track My Flight" (flight number → check-in counter and gate) and "Plan My Journey" are described as mobile-app features; "Plan My Journey" is limited to KLIA T1.

Not evidenced (gaps): separate scheduled vs estimated/actual times side by side; date selector (yesterday/tomorrow); search by city or airline; codeshare grouping; terminal column; flight detail page; share/save; web notifications; auto-refresh interval; behaviour when the data feed fails.

Hypotheses:

- H5.1 There is no flight detail page and no per-flight URL to share.
- H5.2 Proactive flight updates require installing the app; the web offers no email, push or messaging alerts.
- H5.3 A user who searches a T2 flight number on the T1 board gets "no results" rather than a cross-terminal answer.
- H5.4 The "Last Update" stamp shows a date, not a time-of-day with seconds, which is too coarse to build trust in live data.

### 5.6 Commercial services and conversion opportunities

Confirmed (search):

- C6.1 Bookable or paid items evidenced: Fast Track; parking (short-stay, long-stay, premium, "real-time availability", booking); DaySleeper Deal (6 hours, MYR 135); visitor passes; film/photography permits; educational tours; car and equipment rental.
- C6.2 Shop and dine directories exist per terminal with category pages.
- C6.3 Promotions are positioned as an app benefit ("promotions" listed among app features).
- C6.4 Outdated commercial information remains indexed: 2018 parking-rate/GST page.

Not evidenced (gaps): prices for Fast Track and parking; lounge sales; meet-and-greet; porter; buggy; baggage storage; hotel booking; shop e-commerce or click-and-collect links; loyalty programme; outlet detail pages; promotions listing.

Hypotheses:

- H6.1 Commercial services are not surfaced contextually (for example Fast Track or parking offered from a flight result).
- H6.2 No unified basket or account exists across parking, Fast Track and other services.
- H6.3 Third-party lounge and transfer sellers capture demand that the airport site does not serve. Needs market check.

### 5.7 Search and discoverability

Confirmed (search):

- C7.1 Duplicate URLs: at least 19 junk prefixes indexed for KLIA pages (section 3.5).
- C7.2 Soft-fallback URLs: unknown airport slugs indexed with KLIA T1 content (section 3.1).
- C7.3 Weak or wrong titles: "Corporate Website" (facilities, services, some map variants), "Shop and Dine Meta data - KLIA - Malaysia Airports Holdings", "Airport", "Dine", "Restaurants", "Cafes".
- C7.4 Legacy pages with old facts are indexed next to current pages (2018 parking rates, 2021 aerotrain news, query-string CMS URLs).
- C7.5 Search results for task queries are dominated by meta descriptions; fares, rates and schedules were not present in indexed text for parking or public transport, so search engines cannot answer those questions from the site.
- C7.6 A targeted search for lost and found, careline, WhatsApp and chatbot returned only the generic help page.
- C7.7 A third-party aggregator (kupi.com) lists `www.klia.com.my` as the airport's official website. Unverified; shows domain confusion in the ecosystem.

Not assessed: on-site search (existence, quality, zero-result handling), XML sitemap, robots rules, canonical tags, hreflang.

Hypotheses:

- H7.1 No canonical tags or redirects normalise the `{lang}` segment.
- H7.2 There is no on-site search, or it does not search flights, shops and FAQs together.
- H7.3 FAQ content is not marked up for rich results even though organisation schema is present.

### 5.8 Missing, duplicated, outdated or poorly organised information

Confirmed (search):

- C8.1 Conflicting contact numbers in structured data: +60 3 8777 0000 (`/en/klia1/help`, labelled customer support for Malaysia Airports Holdings Berhad) vs +60 3 8777 7000 (`/en/klia1/shop-dine-services/services`, KLIA Terminal 1).
- C8.2 Outdated: `/parking-rates-klia` (2018 GST notice, lot counts and block names of that time).
- C8.3 Outdated: aerotrain replacement news of 27 Dec 2021 still surfaces for an inter-terminal query.
- C8.4 Duplicated: two "services" pages; Fast Track in two sections; identical guides per terminal.
- C8.5 Template leakage across airports: KLIA-only content on Langkawi and Penang pages.
- C8.6 Placeholder metadata published: "Shop and Dine Meta data - KLIA - Malaysia Airports Holdings".
- C8.7 Missing from the index (targeted searches returned nothing): airline directory; dedicated special-assistance page; lounges, hotels, baggage storage; travel-advisory section; promotions/events listing; non-English versions.
- C8.8 KLIA T2 dine page was returned without outlet listings in its indexed text.

Prior knowledge used for context (not re-confirmed):

- P8.1 KLIA's terminals were renamed "KLIA Terminal 1" and "KLIA Terminal 2" in 2023 (as of 2023). Legacy names "klia2" and "KLIA Main Terminal" on old pages predate this. Lower confidence on exact date.
- P8.2 The replacement Aerotrain between the T1 main building and satellite returned to service in mid-2025 (as of July 2025). If so, the 2021 news item is obsolete. Re-verify.
- P8.3 "+603-8777 7000" is the number historically published as MAHB's general line (as of about 2024). This suggests +60 3 8777 0000 on the help page is the erroneous one. Low confidence; verify with MAHB.
- P8.4 KLIA T2 car parking has historically been run by the gateway@klia2 mall operator rather than by MAHB directly (as of about 2024), which may explain why no T2 parking page surfaced. Low confidence; verify.

Hypotheses:

- H8.1 The help page FAQ is one long accordion not specific to T1 vs T2.
- H8.2 Notices (for example the F1 parking advisory) are published as news items with no expiry, so stale advisories linger.

### 5.9 Performance, reliability and loading

Confirmed (search):

- C9.1 None on speed. No performance measurement was possible (no access; no Lighthouse/CrUX data retrieved).
- C9.2 Reliability signal: URLs containing `undefined` (`nodeundefined`, `sma2012undefinedundefinedundefined`) are indexed, which indicates links generated by scripts with missing values at some point in the site's life.
- C9.3 Reliability signal: stale flight rows (06 Oct 2026) are served from search indexes because flight data is embedded in crawlable HTML.

Hypotheses (all need measurement):

- H9.1 Home pages are heavy (hero media, news carousel, flight widget) and slow on mobile networks.
- H9.2 Flight boards refresh by full reload or long polling rather than incremental updates.
- H9.3 Error handling for unknown URLs returns HTTP 200 with fallback content instead of 404, which hides broken links from monitoring.

### 5.10 Opportunities for a fundamentally superior experience

Confirmed basis (search): the defects in 5.1–5.9. Detailed list in section 7.

Hypotheses:

- H10.1 A single KUL view that resolves terminal automatically from the flight number would remove the T1/T2 choice for most users.
- H10.2 A flight-centred journey page (flight status plus terminal, check-in row, gate walking time, transport, parking, Fast Track, shops near gate) would outperform the current section-based IA for both satisfaction and conversion. Needs usability testing.

---

## 6. Friction log

No task could be performed on the live site. "Steps today" are reconstructed from the indexed URL structure [search]; the click paths themselves are [hypothesis] until tested.

| # | Passenger task | Steps today (reconstructed) | Problem | Evidence |
|---|---|---|---|---|
| F1 | "Is my flight on time and which terminal?" | Open site → land on or choose KLIA T1 or T2 → use home flight search or Flight Information → Departures → find row | Terminal must be known before searching; boards are separate per terminal; no combined KUL search evidenced | URL structure: search. Cross-terminal failure: hypothesis |
| F2 | "Pick up a relative: when and where do they come out?" | Terminal home → Flight Information → Arrivals → row shows status, expected time, belt, gate | No evidence of arrival hall/door, meeting point, parking suggestion or alert on landing | Fields: search. Missing guidance: hypothesis |
| F3 | "Get notified if my flight changes" | Web: none found. App: Track My Flight | Requires app install; no web alerts evidenced | search (app page) + hypothesis |
| F4 | "How much is parking for 3 days and can I pre-book?" | Terminal home → Parking → compare zones → book | Rates not in indexed text; an 8-year-old rates page still ranks for "KLIA parking rates"; T2 parking page not found | search |
| F5 | "Cheapest / fastest way to KL Sentral from T2" | Air Travel → Public Transport → switch tabs (Bus, taxi, ride-hailing) | Mode comparison requires tab-hopping; rail not confirmed in page description; fares not indexed; tab parameter inconsistent between terminals | search + hypothesis |
| F6 | "Transfer between T1 and T2" | Air Travel → Inter-Terminal Transfer | Buried under Air Travel; old 2021 aerotrain article and an old "getting from one terminal to another" article compete in search | search |
| F7 | "Book Fast Track" | Booking Services → Amenities → Fast Track (or Air Travel → Services → Fast Track) | Two entry points; price and eligibility not visible in indexed text; hand-off unknown | search + hypothesis |
| F8 | "Find a lounge / shower / place to sleep on a layover" | Booking Services → Things to Do, or Map, or home teaser (DaySleeper) | No lounge or hotel directory found; content scattered | search (negative) |
| F9 | "Where is a specific shop or halal restaurant, and is it before or after security?" | Shop, Dine & Services → Shop or Dine → category page | Outlet detail pages, filters (airside/landside, cuisine, halal, level) not evidenced; T2 dine page indexed without listings | search + hypothesis |
| F10 | "I need wheelchair assistance" | No dedicated page found. Possible paths: Air Travel → Rental Services (wheelchair), Booking Services → Butterfly Effect | Mobility assistance not discoverable; hidden-disability programme filed under bookings | search (negative) |
| F11 | "I lost an item on the plane or in the terminal" | Help → lost and found topic | Procedure, form, location and hours not evidenced; conflicting phone numbers in page data | search |
| F12 | "Call the airport" | Help → contact details | Two different numbers published in structured data | search |
| F13 | "Read the site in Bahasa Melayu or Chinese" | Not possible as far as evidenced | Only `/en/` pages found | search (negative) + hypothesis |
| F14 | "Follow an old link or bookmark" | Old path → resolves to KLIA T1 page or legacy page | User may land on wrong-airport content or outdated facts without warning | search + hypothesis on mechanism |
| F15 | "Which airlines fly from which terminal?" | No airline directory found; user must scan flight boards | Common pre-trip question unanswered | search (negative) |

---

## 7. Top 10 opportunities

Ordered by expected passenger impact. Each opportunity cites the findings it responds to.

| # | Opportunity | Responds to | Confidence that the problem exists |
|---|---|---|---|
| 1 | One KUL flight search across both terminals: search by flight number, city or airline; the result tells the passenger the terminal. Stable per-flight URL and detail page with scheduled, estimated and actual times, check-in row, gate, belt, and a visible "updated hh:mm:ss" stamp. | C5.1–C5.7, H1.2, H5.1–H5.4, F1, F2 | Medium (fields confirmed; cross-terminal gap is a hypothesis) |
| 2 | Flight alerts on the web without app install (web push, email, messaging), plus "add to calendar" and share. | C5.7, H5.2, F3 | Medium |
| 3 | Clean URL contract: one canonical URL per page, 301 redirects from legacy and malformed paths, real 404 for unknown airports, and server-side removal of stale flight rows from crawlable HTML (or `noindex` on live boards with indexable static shells). | C7.1–C7.4, C9.2, C9.3, section 3.5 | High (search-confirmed) |
| 4 | Flight-centred journey page: from a flight, show the right terminal content only: how to get there, parking with live availability and price, Fast Track, check-in zone on map, shops and food near the gate. | H10.2, H6.1, C1.4 | Medium |
| 5 | Unified "To and from the airport" planner: rail, bus, taxi, e-hailing, car rental, inter-terminal transfer and parking in one comparison with time, price and last-updated date. | C1.4, C2.2, F5, F6 | Medium |
| 6 | A real services marketplace: lounges, Fast Track, parking, day rooms/hotels, baggage storage, porter, buggy, meet-and-greet, visitor pass, each with price, eligibility, opening hours, location and one checkout. Confirm first which of these MAHB actually sells. | C6.1, gaps U5–U8, F7, F8 | Medium (absence from index confirmed; absence from site not confirmed) |
| 7 | Accessibility and assistance hub at top level: reduced mobility, wheelchair requests, Butterfly Effect, sensory rooms, accessible routes and toilets on the map, contact options, and a published accessibility statement. Meet WCAG 2.2 AA. | C1.5, C4.1, C4.2, F10 | High for discoverability; unknown for conformance |
| 8 | Structured directories with outlet detail pages: filters for terminal, airside/landside, level, category, cuisine, halal, open now; deep links into the map; promotions attached to outlets. | C2.4, C8.8, U17, F9 | Medium |
| 9 | Single-source content model: shared guides (visa, customs, LAG) written once and reused per terminal; airport-specific facts stored as data; consistent naming ("KLIA Terminal 1", "KLIA Terminal 2"); page-title template; expiry dates on notices and rates; one verified contact record. | C1.3, C1.7, C3.1, C3.2, C8.1–C8.6 | High (search-confirmed) |
| 10 | Multilingual support (at least Bahasa Melayu, English and Chinese, to be validated against passenger mix) plus global site search covering flights, shops, services and FAQs, and a help centre with lost-and-found form, feedback form and live chat. | U1, U2, U13, U14, F11–F13 | Medium (absence from index confirmed; absence from site not confirmed) |

---

## 8. Claim count by evidence level

| Level | Count | Where |
|---|---|---|
| direct | 0 | none |
| search | 82 | K1–K38 (38), C1.1–C9.3 confirmed observations (44; C9.1 is a statement that no speed data exists) |
| prior | 5 | P8.1–P8.4, U12 |
| hypothesis | 28 | H1.1–H10.2 |

Counts exclude the gap rows (U1–U18), which are open questions, not claims.

---

## 9. Verification checklist for the follow-up crawl

When `airports.malaysiaairports.com.my` is reachable, check in this order:

1. HTTP status and `<link rel="canonical">` for `/en/klia1`, `/aba/klia1`, `/$/klia1/booking-services`, `/en/klia/booking-services`, `/en/doesnotexist/parking`, `/nodeundefined/klia1/map`.
2. Airport switcher: control type, default, persistence, deep-link preservation between T1 and T2.
3. Language switcher and `hreflang`; presence of `/bm/` or `/ms/` or `/zh/`.
4. Flight boards: columns, scheduled vs estimated, date selector, search inputs, codeshares, refresh mechanism and interval, "Last Update" label, empty and error states, any flight detail URL, XHR endpoints.
5. Parking: rate tables per car park, booking hand-off domain, live availability widget, T2 parking.
6. Public transport tabs and fares with their last-updated dates; ERL coverage; inter-terminal transfer wording about the Aerotrain and shuttle bus.
7. Booking services: full list, prices, external domains, payment methods.
8. Shop and dine: filters, outlet detail pages, opening hours, map links, promotions, any shopMYairports link.
9. Map: vendor, format, PDF downloads, accessibility alternative.
10. Help: FAQ structure, lost-and-found process, phone numbers on page vs structured data, feedback form, chatbot, WhatsApp.
11. Site search: presence, scope, zero-result handling.
12. Lighthouse (mobile) and axe-core on home, departures, parking, public-transport, shop, map for T1 and T2; screenshots at 360, 768 and 1440 px.

---

## 10. Sources

All retrieved through web search on 2026-11-16. Official MAHB pages unless labelled.

Official passenger site, KLIA Terminal 1:

- https://airports.malaysiaairports.com.my/en/klia1
- https://airports.malaysiaairports.com.my/en/klia1/flight-information
- https://airports.malaysiaairports.com.my/en/klia1/flight-information/arrivals
- https://airports.malaysiaairports.com.my/en/klia1/flight-information/departures
- https://airports.malaysiaairports.com.my/en/klia1/air-travel
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/facilities
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/services
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/public-transport
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/public-transport?tab=bus
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/inter-terminal-transfer
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/rental-services
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/customs-and-immigration
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/lag-restricted-items
- https://airports.malaysiaairports.com.my/en/klia1/air-travel/visa
- https://airports.malaysiaairports.com.my/en/klia1/map
- https://airports.malaysiaairports.com.my/en/klia1/shop-dine-services
- https://airports.malaysiaairports.com.my/en/klia1/shop-dine-services/shop
- https://airports.malaysiaairports.com.my/en/klia1/shop-dine-services/dine/restaurants
- https://airports.malaysiaairports.com.my/en/klia1/shop-dine-services/dine/cafes
- https://airports.malaysiaairports.com.my/en/klia1/shop-dine-services/services
- https://airports.malaysiaairports.com.my/en/klia1/booking-services/things-to-do
- https://airports.malaysiaairports.com.my/en/klia1/booking-services/butterfly-effect
- https://airports.malaysiaairports.com.my/en/klia1/mobile-app
- https://airports.malaysiaairports.com.my/en/klia1/help
- https://airports.malaysiaairports.com.my/en/klia1?aid=1&c=info&id=2&m=airport
- https://airports.malaysiaairports.com.my/en/klia1?aid=2&c=in_around&id=9&m=airport
- https://airports.malaysiaairports.com.my/en/klia/booking-services

Official passenger site, KLIA Terminal 2:

- https://airports.malaysiaairports.com.my/en/klia2
- https://airports.malaysiaairports.com.my/en/klia2/flight-information
- https://airports.malaysiaairports.com.my/en/klia2/flight-information/arrivals
- https://airports.malaysiaairports.com.my/en/klia2/flight-information/departures
- https://airports.malaysiaairports.com.my/en/klia2/air-travel/public-transport?tab=Bus
- https://airports.malaysiaairports.com.my/en/klia2/map
- https://airports.malaysiaairports.com.my/en/klia2/shop-dine-services
- https://airports.malaysiaairports.com.my/en/klia2/shop-dine-services/dine
- https://airports.malaysiaairports.com.my/en/klia2/mobile-app

Official passenger site, variant-prefix and legacy URLs (evidence for sections 3.4 and 3.5):

- https://airports.malaysiaairports.com.my/aba/klia1/flight-information/arrivals
- https://airports.malaysiaairports.com.my/i/klia1/flight-information/departures
- https://airports.malaysiaairports.com.my/i/klia1/booking-services
- https://airports.malaysiaairports.com.my/i/klia1/booking-services/visitation-kul
- https://airports.malaysiaairports.com.my/i/klia1/booking-services/things-to-do
- https://airports.malaysiaairports.com.my/index/klia1/flight-information/departures
- https://airports.malaysiaairports.com.my/index.php/klia1/parking
- https://airports.malaysiaairports.com.my/index.php/klia1/shop-dine-services
- https://airports.malaysiaairports.com.my/index.php/klia1/shop-dine-services/services
- https://airports.malaysiaairports.com.my/index.php/klia1/booking-services/film-and-photography
- https://airports.malaysiaairports.com.my/index.php/klia1/flight-information/arrivals
- https://airports.malaysiaairports.com.my/index.php/klia2/shop-dine-services/dine
- https://airports.malaysiaairports.com.my/$/klia1/booking-services
- https://airports.malaysiaairports.com.my/$/klia1/map
- https://airports.malaysiaairports.com.my/$/klia2
- https://airports.malaysiaairports.com.my/flight-information/klia1/flight-information/arrivals
- https://airports.malaysiaairports.com.my/shop-dine-services/klia2/shop-dine-services
- https://airports.malaysiaairports.com.my/shop-dine-services/klia2/booking-services
- https://airports.malaysiaairports.com.my/shop-dine-services/klia2/booking-services/butterfly-effect
- https://airports.malaysiaairports.com.my/shop-dine-services/klia2/air-travel
- https://airports.malaysiaairports.com.my/shop-dine-services/terminal-1-floor-map/flight-information/departures
- https://airports.malaysiaairports.com.my/air-travel/special-assistance/flight-information/arrivals
- https://airports.malaysiaairports.com.my/sustainability/klia1/air-travel/rental-services
- https://airports.malaysiaairports.com.my/klia2-getting-around/klia1/booking-services/butterfly-effect
- https://airports.malaysiaairports.com.my/events/klia1/flight-information/arrivals
- https://airports.malaysiaairports.com.my/nodeundefined/klia1/map
- https://airports.malaysiaairports.com.my/passenger-guide/klia1/map
- https://airports.malaysiaairports.com.my/transit/klia1/map
- https://airports.malaysiaairports.com.my/map/klia1/parking
- https://airports.malaysiaairports.com.my/malaysia-/klia1/flight-information/departures
- https://airports.malaysiaairports.com.my/sma2012undefinedundefinedundefined/klia2/flight-information/arrivals
- https://airports.malaysiaairports.com.my/eraman-partners-alipay-attract-chinese-tourists-its-duty-free-and-travel-retail-stores/klia2/air-travel/inter-terminal-transfer
- https://airports.malaysiaairports.com.my/getting-around/transport/parking
- https://airports.malaysiaairports.com.my/parking-rates-klia
- https://airports.malaysiaairports.com.my/getting-one-terminal-another-easier-ever
- https://airports.malaysiaairports.com.my/?c=news&id=261&m=media_centre
- https://airports.malaysiaairports.com.my/?c=detail&id=110&m=relax
- https://airports.malaysiaairports.com.my/myairports

Official passenger site, other airports (template and news-feed evidence):

- https://airports.malaysiaairports.com.my/en/penang
- https://airports.malaysiaairports.com.my/en/kota-kinabalu
- https://airports.malaysiaairports.com.my/en/langkawi/mobile-app

Official corporate site:

- https://www.malaysiaairports.com.my/contact-us/corporate

Third-party (not official):

- Cathay Pacific KLIA airport page, refers passengers to the MAHB passenger host for customs information: https://www.cathaypacific.com/cx/th_TH/destinations/airports/kuala-lumpur-international-airport.html (airline site; several locale versions of this page were returned and the search summary did not say which one carried the sentence)
- kupi.com travel guide listing `www.klia.com.my` as official website: https://www.kupi.com/en-ae/explore/malaysia/kuala-lumpur/kuala-lumpur-international-airport (aggregator; unverified)

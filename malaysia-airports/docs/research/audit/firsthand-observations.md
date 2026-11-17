# MAHB websites: first-hand observations (16 and 17 November 2026)

Everything in this file was observed directly by this project from a cloud container with a
headless Chromium browser, curl and Lighthouse. It is the "direct" evidence for the audit; the
search-derived audit (`a-passenger-klia.md`) and the fact files supplement it.

## Access and its limits

- 16 Nov, about 12:50 to 23:48 UTC: `airports.malaysiaairports.com.my` and
  `corporate.malaysiaairports.com.my` were reachable. Pages rendered once the content API host
  `api.myairports.com.my` was allowed.
- 16 Nov, 23:48 UTC onwards: after about 15 page loads at roughly one per second (plus three
  Lighthouse runs), the content API stopped returning data to this network. Pages still returned
  HTTP 200 but rendered only navigation chrome (103 to 506 characters of text; "Loading..." in the
  flight widget, "0 °C" in the weather widget). Six of 16 crawled URLs returned HTTP 502. One
  browser load showed a web application firewall page: "Error 403, Web Page Blocked, Attack ID
  20000051". Later direct requests to the corporate host were reset by the server.
- 17 Nov 04:50 and 10:31 UTC: single test loads still rendered without content. We stopped there
  and did not try to work around the block. This is consistent with rate limiting or bot
  protection on the content API; it means the redesign's own API layer needs the same protection
  and, more importantly, that a human visitor on a shared IP (hotel, airport Wi-Fi, mobile carrier
  NAT) could plausibly hit the same wall (hypothesis, needs MAHB logs to confirm).

## Domains and routing

| Host | Observation |
|---|---|
| `www.malaysiaairports.com.my` | Redirects to the passenger site: `/` lands on `/en/klia1` (KLIA Terminal 1 is the implicit default airport). Hosts the sitemap. |
| `airports.malaysiaairports.com.my` | Passenger site. Same content as www after redirect. `robots.txt`: allow all, sitemap at www. |
| `corporate.malaysiaairports.com.my/en` | Corporate site, a separate Next.js application using the Ant Design component library (seen in the HTML). Its 404 page has the placeholder title "Corporate Website" and `noindex`. |
| `api.myairports.com.my` | Content and flight APIs used by the passenger site (CMS endpoints for highlights, news, spotlight, YouTube, banners, help page, footer, useful tips, travel essentials, page content by page name, weather; flight endpoint `passenger-fids/api/flights/search-flights`). Direct calls without the site's headers return 401. |
| `apss-prod-cms.myairports.com.my` | Airline logo images endpoint. |
| `feedback.malaysiaairports.com.my` | Separate feedback site (linked from Help). |
| `myairportfasttrack.com` | Separate Fast Track booking site (linked from Booking Services). |
| Third parties requested by the homepage | Google Tag Manager, Microsoft Clarity, Kommunicate chat widget, YouTube, OpenWeatherMap, AddToAny, Iconify icon APIs (three hosts), an Azure blob store for images. |

## Information architecture (from the published sitemap, 16 Nov 2026)

- 276 URLs: six airport sections of exactly 46 URLs each: `klia1`, `klia2`, `penang`,
  `kota-kinabalu`, `kuching`, `langkawi`. **Subang and the other 33 MAHB airports have no section.**
- **The six trees are identical** (same 46 paths, verified by hashing the sorted path lists). KLIA
  specific pages therefore exist under every airport, for example
  `/en/langkawi/transit/inter-terminal-transfer`, `/en/kuching/booking-services/visitation-kul`,
  `/en/penang/air-travel/vehicle-access-management-system`. Whether their content is airport
  specific could not be checked after access closed (hypothesis: template content).
- KLIA's two terminals are separate site trees (`klia1`, `klia2`), not one airport with two
  terminals, so terminal-independent information is duplicated.
- Within one airport the same topic appears at several URLs:
  - Butterfly Effect: `/butterfly-effect`, `/booking-services/butterfly-effect`,
    `/air-travel/services/butterfly-effect`
  - Parking: `/parking`, `/air-travel/parking`
  - Special assistance: `/air-travel/special-assistance`, `/air-travel/services/special-assistance`
  - Facilities: `/air-travel/facilities`, `/air-travel/airport-facilities`
  - Flight transfer: `/air-travel/flight-transfer`, `/transit/flight-transfers`
  - Inter-terminal transfer: `/air-travel/inter-terminal-transfer`, `/transit/inter-terminal-transfer`
- Section labels mix passenger tasks and internal programme names: "Air Travel" holds baggage,
  security, visas, parking, public transport, rental, Wi-Fi, lost and found and facilities;
  "Booking Services" holds the Butterfly Effect (an accessibility programme), filming permits and
  terminal visits.
- Primary navigation as rendered (KLIA Terminal 1, desktop): Flight Information (Arrivals,
  Departures), Parking, Air Travel (13 items), Booking Services (Things To Do, Butterfly Effect,
  Fast Track, Filming and Photography @ KUL, Visit @ KUL), Shop & Dine (Shop, Dine, Services),
  Mobile App, Map, Help (Services, Support, Feedback, Scam Alert). Utility row: Departures,
  Arrivals, Contact Us, Mobile App, The Butterfly Effect, a "Find a Departing Flight" widget, the
  airport switcher ("Malaysia Airports Sites"), local time and temperature.

## Page titles and metadata

- Title naming is inconsistent across pages of one airport: "KLIA Terminal 1 – Kuala Lumpur
  International Airport", "KLIA1 Connecting Flights and Transfer Guide", "KLIA1 Inter-Terminal
  Transit & Transfer Guide", "KLIA Terminal 1 Checked-In Luggage Rules & Guidelines".
- At least one passenger page (`/air-travel/services/airport-care-ambassadors`) carries the
  placeholder title "Corporate Website".
- The homepage has no `h1`; its headings are promotional `h3`s ("Charlotte Tilbury: Glam Before
  Take-Off", "DaySleeper Deal: 6 Hours for MYR135", "PAUL Le Café at KLIA T1 Is Now HALAL
  Certified") followed by "Services", "Amenities", "Transport".

## Rendering and performance

- The passenger site is client-rendered: the raw HTML of the parking page (about 250 KB) contains
  29 React Server Component payload chunks but none of the page's text; the content arrives from
  `api.myairports.com.my` after hydration. With the API unavailable, every page is empty apart from
  navigation, and nothing tells the visitor why (no error or retry message).
- Homepage single-load timings (desktop, 16 Nov): TTFB 1.0 s, DOMContentLoaded 2.7 s, first
  contentful paint 2.7 s, load event 10.0 s.
- Lighthouse 13 (mobile emulation, median of valid runs, third parties blocked; see
  `../direct/lighthouse/README.md`): homepage performance 9 to 19, accessibility 79, best practices
  85, SEO 100; LCP 5.2 to 6.9 s; total blocking time 0.9 to 4.5 s; **CLS 0.62**; page weight
  **32.7 to 34.3 MB** over about 171 requests. Departures page: performance 17, LCP 17.5 s, CLS
  0.45, 2.3 MB.
- axe-core 4 (WCAG 2.0 to 2.2 A and AA rules), homepage: 6 rules / 27 elements failing on desktop,
  5 rules / 19 elements on mobile (iPhone 14 emulation). No horizontal overflow on mobile.

## Content observed before access closed

- Parking (KLIA Terminal 1): over 5,700 bays in the Terminal 1 Car Park (Blocks A to D), over
  5,200 in the Long Term Car Park with a free shuttle every 10 minutes, Preferred Parking with over
  300 bays on Level 2, Blocks B and C; features listed; an online booking form (entry and exit date
  and time, "Book Now"); FAQ section. **No rate table was visible on the page.**
- Homepage promotions: Charlotte Tilbury, Kapten Batik (and a Kapten Batik x Tetris collection),
  Kepler, PAUL Le Café (halal certification), Coco Mademoiselle, a DaySleeper offer (6 hours for
  MYR135), "Celebrating Malaysian Culture and Crafts".
- Flight widget on every page: "Find a Departing Flight" with columns From, Airline, Flight,
  Status, Time; the homepage requests `search-flights?code=D&key=all&terminal=KLIA&live=true&limit=5`.

## What this means for the redesign (summary)

1. One airport model (KLIA with two terminals) and airport-specific content only where it exists.
2. One canonical URL per topic, organised by passenger task, with redirects from the old paths.
3. Server-rendered content so the page is useful even if an API is slow or blocked, with explicit
   states for "data unavailable" instead of an empty page.
4. A page-weight budget (the homepage moved 33 MB in a lab run) and layout stability (CLS 0.62).
5. Coverage for all 39 airports, at least at a "listing" level, including Subang.
6. Consistent naming and real titles and headings on every page.

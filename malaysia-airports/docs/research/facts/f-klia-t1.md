# KLIA Terminal 1 (KUL): fact brief for content and design

Generated 2026-11-16. Companion to `f-klia-t1.json`; every statement below cites a fact id from that file in `[brackets]`.

## Read this first: how far these facts can be trusted

- **No official page was read directly.** `airports.malaysiaairports.com.my`, `www.malaysiaairports.com.my` and `www.malaysiaairlines.com` were blocked by the network allowlist at the start and again at the end of the run. The shared web-search budget also ran out after 17 searches.
- The file holds **110 facts: 103 from search results, 7 from background knowledge** (marked PRIOR). None is "direct".
- Confidence: 36 high, 55 medium, 19 low. **Low-confidence and PRIOR facts must not be published** until checked against an official page.
- The Aerotrain section is the strongest (dated news from 2025 and 2026). Facilities, dining and retail are the weakest: only one outlet could be sourced, and it is low confidence.
- Where sources disagree, both values are recorded in the fact's `notes` and repeated here.

## 1. Name and identity

- The official website calls the terminal **KLIA Terminal 1** `[kul-t1-official-name]`. The rename from "KLIA" and "klia2" to KLIA Terminal 1 and KLIA Terminal 2 was announced by Transport Minister Anthony Loke on 9 February 2023 `[kul-t1-rebrand-announced-2023]`.
- The current site still uses "klia1" in URL paths and "KLIA1" in some page titles `[kul-t1-url-slug-klia1]`. The redesign needs one naming rule.
- Terminal 1 opened on 27 June 1998 `[kul-opened-1998]` (encyclopedia source, medium confidence). The airport is in Sepang, Selangor `[kul-location-sepang]`.
- PRIOR, not re-confirmed: IATA code KUL and ICAO code WMKK `[kul-icao-code]`; original design by Kisho Kurokawa around an "airport in the forest, forest in the airport" concept `[kul-architect-kurokawa]`.
- Third-party guides position Terminal 1 as the full-service terminal and Terminal 2 as mainly AirAsia and AirAsia X `[kul-t1-full-service-positioning]` `[t2-airasia]`. Do not publish this as a rule: some low-cost carriers are listed at Terminal 1 `[t1-low-cost-carriers-listed]`.

## 2. Terminal layout

- Three buildings: Main Terminal Building, Contact Pier, Satellite Building `[t1-building-structure]`.
- **Level 5**, Main Terminal Building: departure hall and check-in `[t1-departures-level-5]`.
- **Level 3**, Main Terminal Building: arrival hall `[t1-arrivals-level-3]` (third-party source only). Taxi and rail ticket counters are on the way into the arrival hall `[t1-ground-transport-ticket-counters]` (low confidence).
- **Level 1**: bus terminal `[t1-bus-terminal-level-1]`; PRIOR: KLIA Ekspres and KLIA Transit station `[t1-rail-station-level-1]`.
- Gates:
  - **A and B**: main terminal (Contact Pier), associated with domestic flights `[t1-gates-a-b-main-terminal]` (the "domestic" label is medium confidence).
  - **G and H**: main terminal (Contact Pier), international `[t1-gates-g-h-contact-pier]`.
  - **C**: Satellite Building `[t1-gates-c-satellite]`, reached by Aerotrain `[t1-satellite-reached-by-aerotrain]`.
- PRIOR, low confidence: check-in rows A to M with no row I, about 216 counters `[t1-checkin-rows-a-to-m]`.
- The official site already has an interactive terminal map `[t1-official-interactive-map]` and live departures and arrivals with gates and baggage belts `[t1-official-flight-information]`.

## 3. Aerotrain (Main Terminal Building to Satellite Building)

Current position as of 16 November 2026:

- The Aerotrain runs **24 hours a day**, restored on 1 June 2026 `[aerotrain-24-hour-service-resumed-2026-06-01]`.
- Between 00:00 and 05:00 (engineering hours) a single train serves passengers `[aerotrain-engineering-hours-0000-0500]`; two trains run through the day `[aerotrain-two-trains-daytime]`.
- Journey time is under three minutes `[aerotrain-journey-under-3-min]`.
- **Upcoming closure, time-sensitive:** the permanent software update is scheduled for 28 November to 1 December 2026, subject to an independent safety assessment. The Aerotrain will be unavailable 00:00 to 05:00 and shuttle buses will replace it `[aerotrain-software-update-phase-2-nov-2026]`. Re-check the dates before publishing and remove the notice afterwards.
- During closures passengers follow signage to the bus lounge or ask ground staff `[aerotrain-closure-bus-lounge]`.

The trains:

- Alstom Innovia APM 300R sets `[aerotrain-trainset-innovia-300r]`, three cars and up to 270 passengers per train `[aerotrain-capacity-270]`, maximum speed 56 km/h `[aerotrain-max-speed-56]`.
- Project cost RM456 million `[aerotrain-project-cost-rm456m]` (medium confidence; confirm against an MAHB release).

History, for context pages and FAQs:

- PRIOR: the original Aerotrain was withdrawn in March 2023 and buses took over `[aerotrain-suspended-2023]`.
- The new service started at 10:00 on 1 July 2025 `[aerotrain-resumed-2025-07-01]`.
- From 15 November 2025 it stopped nightly from 21:00 to 07:00 for rectification works, with shuttle buses `[aerotrain-night-halt-nov-2025]`.
- In February 2026 MAHB said the system was operating as intended `[aerotrain-mahb-statement-feb-2026]`.
- First software-update phase: 8 to 17 October 2026, closed 00:00 to 05:00 with buses `[aerotrain-software-update-phase-1-oct-2026]`. KLIA linked the update to 20,000 continuous operational hours `[aerotrain-20000-operational-hours]` and reported 99.9% availability since June 2026 `[aerotrain-availability-99-9]`.

Design note: the Aerotrain's status has changed five times in 18 months. It should be a live status component, not static copy.

## 4. Airlines and check-in

- Confirmed by the airlines themselves: Malaysia Airlines `[t1-malaysia-airlines-home]` and ANA `[t1-ana]` use Terminal 1.
- Third-party lists only (medium or low confidence, do not publish without the official directory): Batik Air Malaysia and Firefly `[t1-batik-air-firefly]`; Air India, British Airways, Cathay Pacific, Emirates, Etihad Airways, KLM, Korean Air, Qatar Airways, Singapore Airlines, Turkish Airlines `[t1-foreign-carriers-third-party-list]`; about 50 airlines in total including Air China, IndiGo, Lion Air and VietJet `[t1-carrier-count-third-party]`.
- Malaysia Airlines check-in, Level 5 (airline's own page, undated):
  - International Economy: Row H, counters 1-18 `[mh-checkin-international-economy-row-h]` (in place since 7 August 2019 `[mh-row-h-since-2019]`).
  - International Business: Row D, counters 4-12; Business Suite: Row D, counters 1-3 `[mh-checkin-international-business-row-d]`.
  - Domestic Economy: Row B, counters 1-18 `[mh-checkin-domestic-row-b]`.
  - Domestic Business: Row D, counters 15-18 `[mh-checkin-domestic-business-row-d]`. Conflict: another edition of the same page says D13-D18.
  - Groups of 10 or more (international): counter C13 `[mh-checkin-groups-c13]`.
  - Self-service bag drop: counters F and G `[mh-self-service-bag-drop-rows-f-g]`.
- Malaysia Airlines states that counters are arranged by the airport authority based on daily conditions `[mh-checkin-counters-vary-daily]`, and MAHB has reassigned rows between airlines before `[mahb-checkin-row-reassignment]`. Check-in rows should come from live data.
- Example of a peak-period advisory: Malaysia Airlines asked passengers to arrive early from 22 May to 7 June 2026 `[mh-arrive-early-advisory-2026]`.

## 5. Immigration and arrival formalities

All from third-party guides; verify with the Immigration Department of Malaysia.

- Autogates: visitors from 63 countries and territories are reported as eligible `[autogate-63-countries]`. Conflict: older pages say 10, and one says 46 from 1 June 2024.
- Requirements: e-passport and a Malaysia Digital Arrival Card submitted within three days before arrival `[autogate-requirements-epassport-mdac]`; passport valid for at least six months `[autogate-passport-validity-six-months]`.
- Reported as departure-only autogate users: travellers from Thailand, Cambodia, Laos, the Philippines, Vietnam, Myanmar, Indonesia and Timor-Leste `[autogate-departure-only-nationalities]` (single source, low confidence).
- Malaysian permanent residents and long-term pass holders are exempt from the arrival card `[mdac-exemption-pr-long-term-pass]`.

## 6. Lounges

An official lounge listing exists but could not be read `[lounge-official-listing-page]`. Found in operator and lounge-network listings:

| Lounge | Location | Fact id |
|---|---|---|
| Plaza Premium Lounge | Airside, Contact Pier, International Departures, Level 2, near Gate G; listed as 24 hours | `[lounge-plaza-premium-contact-pier]` `[lounge-plaza-premium-24h]` |
| Plaza Premium First | Same Contact Pier site | `[lounge-plaza-premium-first]` |
| Malaysia Airlines Satellite Golden Lounge | Satellite Building, mezzanine floor | `[lounge-mh-golden-satellite]` |
| Malaysia Airlines Regional Golden Lounge | Main terminal, Gate H, Level 4 mezzanine | `[lounge-mh-golden-regional]` |
| Malaysia Airlines Domestic Golden Lounge | Gate A, Level 3 | `[lounge-mh-golden-domestic]` |

All five are medium confidence; level wording needs operator confirmation.

## 7. Hotels

- **Sama-Sama Express KLIA Terminal 1 - Airside Transit Hotel** `[hotel-sama-sama-express-name]`: airside, mezzanine level of the Satellite Building near Gate C5 `[hotel-sama-sama-express-location]` (one guide says Level 1).
- No immigration clearance needed `[hotel-sama-sama-express-no-immigration]`; no access to checked-in luggage `[hotel-sama-sama-express-no-checked-bags]`.
- Passengers arriving at G or H gates must travel to the Satellite Building first `[hotel-sama-sama-express-from-g-h-gates]`.
- Low confidence: 80 rooms `[hotel-sama-sama-express-rooms-80]`; sold in short-stay blocks such as 12 hours `[hotel-sama-sama-express-short-stays]`.
- PRIOR: Sama-Sama Hotel KLIA, landside five-star hotel linked by covered walkway `[hotel-sama-sama-klia-landside]`.

## 8. Facilities

- The official facilities page lists lounges, prayer rooms, medical services and ATMs `[t1-official-facilities-page]`. No locations, levels or hours were captured.
- **Lost and found:** an official page exists `[lost-found-official-page]`. Third-party values, low confidence: Level 2 of the Main Terminal Building next to the Food Garden entrance `[lost-found-location-level-2]`; +603 8776 4312, 24 hours, lostandfound@malaysiaairports.com.my `[lost-found-contact]` (an older listing gives a different number). Missing checked bags go to the airline `[lost-baggage-handled-by-airline]`; Malaysia Airlines' baggage office is listed at +603 8777 2288, 07:00 to 23:59 `[mh-mishandled-baggage-office]`.
- **Wi-Fi**, all low confidence: network "FREE_WIFI@KLIA" `[wifi-network-name]`, three-hour sessions `[wifi-session-limit]`, no registration `[wifi-no-registration]`. Sources conflict on both the name and the limit.
- **Jungle Boardwalk:** in the Satellite Building `[jungle-boardwalk-location]`; MAHB announced its reopening in October 2023 `[jungle-boardwalk-reopened-2023]`; hours 07:00 to 19:00 per MAHB's magazine `[jungle-boardwalk-hours]` (a third party says 08:00); free and airside per a 2026 third-party guide `[jungle-boardwalk-free-airside]`. Current 2026 status is not confirmed.

## 9. Accessibility: the Butterfly Effect

- Official page exists `[butterfly-effect-official-page]`. The programme supports passengers with hidden disabilities such as autism, ADHD, global developmental delay and sensory processing disorder `[butterfly-effect-purpose]`, and was introduced in December 2020 `[butterfly-effect-launched-2020]`.
- It offers priority access at major touchpoints, a Calm Room and sensory walls `[butterfly-effect-support-offered]`.
- Terminal 1 Calm Room: Level 5, Main Terminal Building `[calm-room-t1-level-5]`; entry by access code from the Butterfly Kit, children supervised `[calm-room-access-code]`. Six sensory walls in Terminal 1 `[sensory-walls-t1-six]`.
- How to join: register at the information counter in the Departure Hall and collect a Butterfly Kit with a Butterfly lanyard `[butterfly-kit-registration]`. Registration is reported as required on each visit `[butterfly-registration-each-visit]` (low confidence).
- More than 10,000 passengers assisted `[butterfly-10000-passengers]`.
- Terminal 2 gained its own Calm Room in July 2025, Level 3A of the Departure Hall `[calm-room-t2-2025]`.
- PRIOR, low confidence: wheelchair and reduced-mobility assistance is arranged through the airline with 48 hours' notice `[prm-assistance-via-airline]`.

## 10. Contact

- Official Help & Support page for Terminal 1 `[contact-help-page]`.
- Customer support: +603 8777 0000 `[contact-customer-support-number]`. KLIA Terminal 1 and corporate office: +603 8777 7000 `[contact-main-number]`. Both medium confidence, read from search summaries.
- Email info@malaysiaairports.com.my `[contact-email]`; live chat with human agents on a split schedule, not 24 hours `[contact-live-chat]`; MYairports app `[contact-myairports-app]`.

## 11. Dining and retail

Only one outlet could be sourced: **Food Garden**, a food court on Level 2 of the Main Terminal Building `[dining-food-garden-level-2]` (third-party, low confidence). No retail outlet could be sourced. The outlet directory must be built from the official shop and dine listing once access is available.

## 12. Findings about the current website (for IA and SEO)

- The same Terminal 1 pages are indexed on two official hostnames `[site-duplicate-hosts]`.
- Several legacy URL schemes remain indexed `[site-legacy-url-schemes]`; a redirect map is needed.
- Current Terminal 1 section: flight information, map, air travel guide, facilities, services, help `[site-t1-section-structure]`.

## Not verified / gaps

Nothing in this list may be published as fact.

1. **Access.** Official hosts and the Malaysia Airlines site were blocked; search budget ran out after 17 searches. No fact is "direct".
2. **Dining and retail outlets.** No sourced list beyond Food Garden.
3. **Airline list and check-in rows.** No official Terminal 1 airline directory or per-airline row allocation; third-party lists conflict on Scoot, Cebu Pacific, VietJet, Air Arabia, Air France and Lufthansa.
4. **Level-by-level layout.** No official description of Levels 1 to 5, the purpose of Levels 2 and 4, or gate number ranges.
5. **Aerotrain.** Headway between trains; whether the 28 November to 1 December 2026 update went ahead; shuttle-bus journey time and frequency.
6. **Careline.** The widely quoted 03-8776 2000 could not be confirmed; search surfaced +603 8777 0000 and +603 8777 7000. Careline and chat hours not captured.
7. **Lost and found.** Official location, hours, phone and email.
8. **Wi-Fi.** Official network name, session limit and sign-in method.
9. **Prayer rooms, baby care rooms, children's play areas, medical clinic, pharmacy.** Locations, levels and hours.
10. **Baggage services.** Left luggage (operator, location, RM rates), wrapping, porter, buggy.
11. **Other amenities.** Showers, rest zones, charging points, smoking rooms, drinking water, viewing areas, post office, tourist information, SIM counters, money changers; ATM locations.
12. **Other lounges.** Airline and pay-per-use lounges in the Satellite Building.
13. **Hotels.** Sama-Sama Hotel KLIA details; Sama-Sama Express level, room count, rates; any capsule or sleep-pod facility in Terminal 1.
14. **Immigration.** Official autogate nationality list, first-time-visitor rule, autogate locations.
15. **Security screening.** Screening point locations and liquids rules.
16. **Self-service kiosks and common-use bag drop** provided by the airport.
17. **Accessibility.** Reduced-mobility process, wheelchairs, accessible toilets, Airport CARE Ambassadors, any lanyard scheme other than the Butterfly lanyard, Calm Room position and hours.
18. **Jungle Boardwalk.** Current open or closed status and hours.
19. **Capacity and throughput.** Only Wikipedia-derived figures surfaced; not used.

To close these gaps, allow `airports.malaysiaairports.com.my` and `www.malaysiaairports.com.my` in the session's network settings, or raise the web-search budget, and re-run this assignment.

# Kota Kinabalu International Airport (BKI) — fact brief for content and design

Generated: 2026-11-16. Companion data file: `f-kk.json` (83 facts). Every statement below is drawn from a fact in that file; the fact id is given in `[brackets]`.

## How to read this brief

- **Evidence levels.** No fact here is `direct`: the official Malaysia Airports hosts (`airports.malaysiaairports.com.my`, `www.malaysiaairports.com.my`) were blocked from the research container at the start and again at the end of the run. 75 facts are `search` (taken from web-search result summaries; the pages themselves were not opened) and 8 are `prior` (background knowledge, not re-confirmed).
- **Confidence.** 16 high, 48 medium, 19 low. Anything marked **(low)** or **(prior)** below must be checked against the official MAHB page, the operator or the authority before it is published as passenger content.
- **Search limit.** The workflow's shared search budget ran out after 15 queries, so taxi, e-hailing, car rental, accessibility, dining/retail, hotel and helpline searches were never run. Those topics sit in "Not verified / gaps".
- **Conflicts** between sources are called out explicitly; do not resolve them by picking one silently.

---

## 1. Identity and location

| Item | Value | Fact id | Confidence |
|---|---|---|---|
| Official name | Kota Kinabalu International Airport (KKIA) | `bki-official-name` | high |
| IATA | BKI | `bki-iata-code` | high |
| ICAO | WBKK | `bki-icao-code` | high |
| Operator | Malaysia Airports Holdings Berhad network | `bki-operator-mahb` | high |
| Official page | airports.malaysiaairports.com.my (path `/en/kota-kinabalu` as cited by a third party; not fetched) | `bki-official-web-page` | medium |
| Distance to city | about 8 km south-west of the city centre **(prior)** | `bki-distance-to-city` | medium |
| Ranking | Malaysia's second-busiest airport after KLIA (2024) | `bki-second-busiest-malaysia` | medium |
| Reference point | 05°55'55"N 116°03'01"E (airfield point, not the terminal door) | `bki-arp-coordinates` | medium |
| Elevation | 4 m (13 ft) | `bki-elevation` | medium |
| Runway | single runway 02/20, about 3,780 m **(prior)** | `bki-runway` | medium |

Design note: the CAAM reference point is on the airfield between two taxiways `[bki-arp-coordinates]`; geocode the Terminal 1 forecourt separately for maps.

## 2. Terminals

- **One passenger terminal.** All scheduled passenger flights use Terminal 1 `[bki-t1-only-passenger-terminal]` (high).
- **Former Terminal 2.** The low-cost Terminal 2 closed to passengers at midnight on 1 December 2015 when AirAsia moved to Terminal 1 `[bki-t2-closed-2015]` (high). It is now used for cargo, charter and general aviation `[bki-t2-current-use]` (medium). It sits at Tanjung Aru on the far side of the runway and is not connected to Terminal 1 `[bki-t2-opposite-side-of-runway]` **(prior)**. Some third-party guides still describe two passenger terminals; the new site should state clearly that there is only one.
- **Layout.** Terminal 1 is a single building with domestic and international sections `[bki-t1-domestic-international-sections]` (medium). Sources reference services on Levels 1, 2 and 3 `[bki-t1-levels-referenced]` (medium). The recalled layout — arrivals on Level 1, gates on Level 2, check-in on Level 3 — is background knowledge only `[bki-t1-level-layout]` **(prior, low)**; do not write wayfinding copy from it.
- **Capacity.** Reported design capacity is about 9 million passengers a year; one news report implies about 10 million `[bki-t1-capacity]` (medium, conflict).

## 3. Traffic and operations

- More than 7.95 million passengers in 2024 `[bki-passengers-2024]` (medium); 7.04 million in 2023 `[bki-passengers-2023]` (medium).
- MAHB reported about 802,000 passengers in one month around the turn of 2025/2026, up 23.5% year on year; the exact month is ambiguous in the sources `[bki-passengers-monthly-dec-2025]` (low). No full-year 2025 figure was found.
- **Runway incident, 17 September 2026.** The runway was closed for rectification works from 14:45, with the closure extended by NOTAM from 17:00 to 20:00 `[bki-runway-closure-2026-09-17]` (high). Twenty flights were affected and some arrivals diverted to Labuan and Sandakan `[bki-runway-closure-impact]` (high). This was a one-off event, relevant to the design of the disruption/notice component rather than to evergreen content.

## 4. Airlines and destinations

Snapshot date matters: airline lists change by season. Show an "as of" date wherever this content appears.

- As of March 2026, 13 airlines operated 153 scheduled international flights a week `[bki-international-flights-weekly]` (high).
- Named international carriers: AirAsia, Batik Air, Air Busan, Jin Air, Jeju Air, T'way Air, HK Express, China Southern, Shanghai Airlines, Spring Airlines, Xiamen Airlines, Scoot and Royal Brunei `[bki-international-airlines-named]` (medium).
- These carriers are based in South Korea, mainland China, Hong Kong, Singapore and Brunei, alongside Malaysian carriers `[bki-international-markets]` (medium). City-level destinations were not verified.
- Route news in 2026:
  - Chongqing Airlines started Chongqing–Kota Kinabalu in March 2026, three a week (Tue, Thu, Sat) `[bki-route-chongqing]` (high).
  - Spring Airlines resumed daily Shanghai–Kota Kinabalu on 28 January 2026 `[bki-route-shanghai-spring]` (high).
  - Batik Air announced Kota Kinabalu–Singapore for February 2026; launch not verified `[bki-route-singapore-batik]` (medium).
  - A Jeddah route was "under consideration" in March 2026; not confirmed as operating `[bki-route-jeddah-proposed]` (medium).
  - The airport was targeting two new international routes in 2026 `[bki-new-routes-target-2026]` (medium).
  - AirAsia reported to resume Bintulu (1 Nov 2026) and Sibu (2 Nov 2026); conflicting reports `[bki-airasia-sibu-bintulu]` (low).
- Domestic: Malaysia Airlines, AirAsia and Batik Air Malaysia fly Kota Kinabalu–Kuala Lumpur `[bki-domestic-carriers-kuala-lumpur]` **(prior)**. The full domestic list was not verified.

## 5. Sabah immigration — the content passengers most need

This is the single most important piece of airport-specific guidance for BKI. It deserves its own prominent content block, surfaced for anyone arriving from Peninsular Malaysia or Sarawak.

**What is well supported**

1. Sabah keeps its own immigration control, so there is an immigration check even on domestic flights from Peninsular Malaysia `[sabah-immigration-separate-control]` (high).
2. Malaysians from Peninsular Malaysia can enter with a MyKad; a passport is not required `[sabah-entry-mykad-peninsular]` (high). A Malaysian passport is also accepted `[sabah-passport-also-accepted]` (medium).
3. The visit is limited to 90 days `[sabah-entry-90-day-limit]` (high).
4. Immigration issues a printed slip, the Document in Lieu of Internal Travel Document (IMM.114), stating the permitted stay `[sabah-entry-imm114-issued]` (medium).
5. Keep the slip: it is surrendered when leaving Sabah `[sabah-exit-imm114-surrender]` (medium).
6. On departure, travellers show an accepted identity document and their boarding pass `[sabah-domestic-departure-id-and-boarding-pass]` (medium, Immigration Department).
7. Stays of more than three months need a Restricted Travel Document `[sabah-long-stay-restricted-travel-document]` (medium, Immigration Department).
8. Working in Sabah requires a work pass `[sabah-work-requires-pass]` (medium).
9. Malaysia Airlines accepts original documents only, not photocopies `[sabah-original-documents-only]` (medium).

**Needs official confirmation before publishing**

- Children under 12 travel on a birth certificate or MyKid `[sabah-entry-children-under-12]` (low).
- Extensions beyond 90 days go through the Immigration Department in Sabah `[sabah-stay-extension]` (low).
- Travellers from Sarawak also clear Sabah immigration `[sabah-entry-from-sarawak]` **(prior)**.
- Foreign visitors arriving on domestic flights must carry their passport `[sabah-entry-foreign-nationals-passport]` **(prior)**.

Suggested content pattern: a short "Flying in from Peninsular Malaysia or Sarawak?" checklist (bring original MyKad or passport; expect an immigration counter; keep the slip; 90-day limit), with a link out to the Immigration Department for the authoritative rule.

## 6. Lounges

Lounge information is the least reliable area of this brief. Do not publish lounge names until confirmed.

- Malaysia Airlines' own partner-lounge page lists a lounge at Level 2, Domestic Departure, Main Terminal Building, open 04:00–00:00 `[bki-lounge-mas-partner-level2]` (medium). The brand name was not captured.
- Whether Malaysia Airlines still runs its own Golden Lounge is disputed between sources `[bki-golden-lounge-status-conflict]` (low, conflict).
- Plaza Premium Lounge is reported permanently closed by one source while older listings still show it `[bki-plaza-premium-status-conflict]` (low, conflict).

## 7. Facilities

Only three facility facts could be sourced, all weak:

- Left luggage on Level 1 and at International Departures, Level 3 `[bki-left-luggage]` (low).
- Information desk in Departures `[bki-information-desk]` (low).
- Shops and cafeterias exist in the terminal `[bki-shops-and-cafeterias]` (medium); no outlet names were verified.

## 8. Ground transport

**Public bus (best-evidenced option in 2026)**

- BAS.MY routes S07 and S08 serve the airport and link it to KK Sentral `[bki-bus-basmy-routes]` (medium); the city terminus is KK Sentral, not Padang Merdeka `[bki-bus-city-terminus]` (medium).
- S07 loop: KK Sentral – Jalan Kepayan – Aeropod (Tanjung Aru railway station) – KKIA – Jalan Lintas – KK Sentral `[bki-bus-s07-route]` (medium).
- S08 loop: KK Sentral – Jalan Tunku Abdul Rahman – Sembulan railway station – Lido Avenue – KKIA – Jalan Kepayan – KK Sentral `[bki-bus-s08-route]` (medium).
- Fares KK Sentral–KKIA: RM1.40 on S07 `[bki-bus-s07-fare]`, RM2.00 on S08 `[bki-bus-s08-fare]` (medium; fare table checked by a third party on 23 October 2026).
- Hours: first departures about 05:45 (S07) and 05:50 (S08); last about 22:45 and 22:50 `[bki-bus-operating-hours]` (medium).
- Frequency: roughly every 15 minutes at the airport `[bki-bus-frequency]` (low).
- Buses run to timetable rather than leaving when full `[bki-bus-scheduled-departures]` (medium).
- **Cashless only:** ManjaLink/ManjaPay, concession card, Visa/Mastercard, or DuitNow QR `[bki-bus-payment-cashless]` (medium). Flag this clearly for international arrivals.
- Network fares start at RM0.80; a 30-day pass is RM30 for Malaysian citizens `[bki-bus-fare-floor-and-pass]` (low). Operator: Jaguh Bayu `[bki-bus-operator]` (low).

**Legacy "Airport Bus"**

- Older guides describe a RM5 Airport Bus (about 07:30–20:15), but a February 2024 guide said none was running `[bki-legacy-airport-bus-conflict]` (low, conflict). Do not publish it as current.

**Taxi**

- Prepaid coupon system from a counter in the arrival hall `[bki-taxi-coupon-system]` **(prior, low)**. No fare is verified.

**E-hailing and car rental:** nothing sourced — see gaps.

## 9. Parking

Rates below come from two third-party listings that agree with each other; the official MAHB rate table was not seen.

| Period | Rate | Fact id |
|---|---|---|
| Hours 1–3 | RM3.00 per hour | `bki-parking-rate-hours-1-3` |
| Hours 4–12 | RM2.00 per hour | `bki-parking-rate-hours-4-12` |
| Hours 13–20 | RM1.00 per hour | `bki-parking-rate-hours-13-20` |
| Daily maximum | RM35.00 | `bki-parking-daily-max` |

- Open 24 hours, four zones A–D `[bki-parking-24h-zones]` (low).
- Roughly 1,300–1,400 open-air bays; sources differ `[bki-parking-bays]` (low, conflict).
- Open-air lot opposite the terminal `[bki-parking-location]` (low).
- Pay at machines in the terminal before returning to the car; a QR payment option is listed `[bki-parking-payment]` (low). Card and e-wallet acceptance is not confirmed.

Design note: the tiered tariff sums exactly to the RM35 daily cap `[bki-parking-daily-max]`, so a parking-fee calculator is feasible once the official table is confirmed.

## 10. Contact

- Telephone: +60 88 325 555 `[bki-contact-phone]` (medium; from the CAAM aeronautical publication).
- E-mail: masb_bki@malaysiaairports.com.my `[bki-contact-email]` (medium; an operational address — do not present as customer care without checking).

## 11. Expansion and works affecting passengers in 2026

- As of July 2026 the Terminal 1 expansion had **not started**; it awaited resolution of land and site issues with the Sabah government `[bki-expansion-status-2026]` (high). No later report of construction starting was found, so no expansion works are confirmed as affecting passengers in 2026.
- Funding is approved `[bki-expansion-funding-approved]` (medium).
- Cost is reported between about RM400 million and nearly RM500 million depending on the source `[bki-expansion-cost]` (medium, conflict).
- Target capacity: 12 million passengers a year `[bki-expansion-capacity-target]` (high).
- Target completion: 2028 `[bki-expansion-completion-target]` (medium; at risk given the late start).
- Interim works to lift capacity from 9 to 10 million were planned `[bki-expansion-interim-works]` (low).

---

## Not verified / gaps

**Method limits**

- Official MAHB hosts were blocked on both attempts; nothing is `direct` evidence.
- The shared search budget ran out after 15 queries; several topics were never searched.

**Not found or not confirmed**

- Terminal operating hours (24-hour status).
- Distance to the city centre (only recalled: about 8 km).
- Full-year 2025 passenger total.
- Official level directory; counts of check-in counters, gates and aerobridges.
- Current domestic airline list and city-level destination list (domestic and international).
- Whether Batik Air's Singapore route and the Jeddah route launched; true status of AirAsia's Sibu/Bintulu routes.
- Lounge line-up, names, locations, prices and access rules; Golden Lounge and Plaza Premium status conflict.
- **Accessibility services: nothing sourced.** A third-party mention of ramps, lifts and accessible toilets could not be attributed to a URL. Wheelchair assistance, accessible parking and drop-off, and any hidden-disability provision are unverified.
- Facilities: prayer rooms, baby-care rooms, Wi-Fi, ATMs, money changers, clinic, showers; left-luggage prices and hours.
- Dining and retail outlet names: none sourced.
- Hotels at or near the airport: not researched.
- Taxi coupon fares and night surcharge (about RM30 to the city is recalled only).
- E-hailing pick-up point and typical fares.
- Car rental companies at the arrival hall.
- Status of the legacy RM5 Airport Bus; location of the BAS.MY stop at Terminal 1; the official S07/S08 timetable and fare table.
- Official parking rate table, motorcycle rates, lost-ticket fee, accepted cashless methods, covered or premium parking, EV charging.
- Customer-care line, lost and found, airport police, immigration and customs numbers.
- Official Sabah Immigration wording for Sarawakians, children and foreign nationals; whether autogates are available at KKIA.
- Expansion start date; any 2026 works inside Terminal 1; an RM11.8 million amenities upgrade mentioned in a search summary with unclear source and date.
- Cause of the 17 September 2026 runway works.

**Recommended next step:** once `airports.malaysiaairports.com.my` is reachable, re-verify sections 2, 6, 7, 8, 9 and 10 directly against the official Kota Kinabalu pages and upgrade or replace the `search`/`prior` facts.

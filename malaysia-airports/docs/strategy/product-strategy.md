# Product strategy: the Malaysia Airports passenger and corporate platform

Deliverable 2 of the concept redesign. Date: 17 November 2026. Audience: MAHB board, digital, commercial and
operations leadership, and the design and engineering team.

This is an independent concept. It is not an official MAHB document and it has no access to MAHB operational systems,
analytics or contact-centre data. It describes the product we intend to build and the case for it; what the concept
prototype contains at any moment is recorded in `docs/engineering/handoffs/`. Nothing below claims that MAHB
offers a capability unless the evidence says so.

## How to read the evidence

| Tag | Meaning |
|---|---|
| [direct] | Observed first-hand by this project on 16 and 17 November 2026 (browser, curl, sitemap). |
| [direct, lab] | Independently measured by this project with Lighthouse 13 or axe-core 4 in a lab setting. Indicative, single location, third parties blocked; not field data and not a conformance claim. |
| [search] | Stated in a web search result, with the URL given here or in the cited fact file. Not read on the official page. |
| [prior] | Background knowledge, not re-confirmed. Must be checked before it is published to passengers. |
| [hypothesis] | Needs usability testing, analytics or technical access to confirm. |
| [assessment] | Expert judgement by this project. Benchmark scores and the design panel's scores are assessments, not measurements. |

Source shorthand: FO `docs/research/audit/firsthand-observations.md`; AUD `docs/research/audit/mahb-audit.md`
(Tasks 1 to 5, voice-of-passenger rows V1 to V10); LH `docs/research/direct/lighthouse/README.md`; FC
`docs/research/facts/f-corporate.md`; FN `docs/research/facts/f-network.md`; FT
`docs/research/facts/f-klia-transport.md`; FK `docs/research/facts/f-klia-t1.md`; FS
`docs/research/facts/f-supplement-commerce-regional.md`; BM-name `docs/research/benchmarks/<name>.md`; BS
`docs/engineering/build-spec.md`. Fact ids from the fact files are given in brackets where useful.

## Summary for the board

1. MAHB runs a network of 39 Malaysian airports [search, FN `network-total-39`], but its passenger website covers five
   of them, as six cloned 46-page trees, and models KLIA as two airports [direct, FO]. In 2025 about 41 million
   passengers, roughly 39% of the Malaysian total, used airports other than KLIA [derived from search, FC].
2. The current site fails silently when its content API is unavailable, moved about 33 MB on a lab homepage load with
   a layout shift of 0.62, and does not show a parking price on the parking page [direct; direct, lab].
3. The passenger pain that reached the press in 2025 and 2026 is operational: parking bills, Aerotrain stoppages, a
   baggage-system failure, immigration outages, touting and the gap between KLIA Terminal 1 and Terminal 2 [search,
   AUD V1 to V7]. The site has no live status layer for any of them [hypothesis, absence not confirmed].
4. The leading airport sites each excel at one or two things, and almost all of them are single hubs that keep their
   best features in an app or behind a login [assessment, benchmarks]. MAHB can outperform them by being the only
   network-wide, web-first, source-cited and fast airport platform, rather than by copying any one of them.
5. The strategy rests on twelve differentiators (section 5), ten testable principles (section 6) and a measurement plan
   that needs baselines only MAHB holds (section 7). Commercial upside is real but depends on partner agreements that
   do not yet exist (section 8).

## 1. Vision and positioning

**Proposition: Malaysia Airports. Your journey, beautifully connected.**

The product connects three things that are separate today: the 39 airports, the stages of a journey (home, kerb,
terminal, gate, arrival hall, onward transport) and the people involved (the traveller, the person meeting them, the
business partner). "Beautifully" is earned by calm, precise design and by answers that arrive quickly; it is not a
licence for decoration. The proposition is this project's working line. It sits beneath MAHB's published brand promise,
"Hosting Joyful Connections", and its vision, "A Global Airport Group That Champions Connectivity and Sustainability"
[search, FC `brand-promise`, `brand-vision`, corporate.malaysiaairports.com.my/en/about-us/corporate-profile/our-brand].

| Quality | What it means in the product | How we will know [assessment: targets in sections 6 and 7] | What it rules out |
|---|---|---|---|
| Effortless | The top task on every page is answered in the first screen; no airport is assumed and changing it takes one tap; search understands flight numbers, airports and facilities | Target interaction counts in section 4 met in usability tests | Menus organised by internal programme names; "Booking Services" as a home for accessibility |
| Intelligent | Journey mode and a saved flight reorder the product; it calculates parking totals, leave-by times and transfer steps from published data | Mode changes quick actions and boards on every surface; calculations agree with official sources | AI for its own sake; personalisation that needs an account |
| Reassuring | Every fact carries its source and date; simulated data is labelled; unknowns are said plainly; disruption guidance appears where it is needed | 100% of content items carry a source; zero unlabelled demo data | Silent failure, "Loading..." forever, stale notices pinned for months |
| Premium | Quiet, fast, precise: fine rules, editorial type used sparingly, a dark flight board, nothing that moves on its own | Core Web Vitals and page-weight budgets met; design review against `docs/design/direction.md` | Video heroes, carousels, promotional `h3`s in place of a heading |
| Distinctly Malaysian | English and Bahasa Malaysia from day one; halal and prayer facilities as first-class data; songket indigo, pucuk rebung hairlines and bunga tabur as the visual language; the whole network, from KLIA to Bario | Language parity tests; every STOLport present in the directory | Flags, clip-art, a KLIA-only view of Malaysia |

**What it is not.**

- Not a KLIA website with regional pages attached. KLIA is one airport with two terminals; the other 38 airports are
  first-class entries at the depth the content supports.
- Not an app-download funnel or a login wall. Saving a flight, following it and planning a transfer work on the open web
  without an account.
- Not a retail catalogue on the front door. Commerce appears in the journey, in context, after the answer.
- Not an AI chatbot product. The concierge is a retrieval layer over verified content that cites its sources and works
  with no AI service at all.
- Not an operational system, and not a substitute for airlines, Immigration or transport operators. It presents their
  information with attribution and hands off to them. In the concept prototype every live-looking value is
  demonstration data and says so [BS rule 1].
- Not a tracking platform. Personal state stays on the device; the prototype makes no third-party requests [BS §2, §3].

**Positioning statement.** For anyone travelling through, meeting someone at or doing business with a Malaysian
airport, Malaysia Airports is the one place that answers what to do next at any of the 39 airports, with the source of
every answer shown. Unlike single-hub airport sites, it is network-wide, works without an app or account, and stays
useful when live data is unavailable.

## 2. Context

### 2.1 The network

| Item | Value | Evidence |
|---|---|---|
| Airports operated in Malaysia | 39 | [search] FN `network-total-39`, Annual Report 2023 |
| Classification | 5 international, 17 domestic, 17 STOLports | [search] FN `network-split-5-17-17`, Annual Report 2023 |
| Superseded split still indexed | 5 / 16 / 18; the difference is Mukah, which became a domestic airport in June 2021 | [search] FN `network-split-reconciliation-mukah`; that Mukah is the sole cause is an inference |
| Overseas | Istanbul Sabiha Gokcen, outside the Malaysian Operating Agreements | [search] FN `network-plus-isg-40` |
| Airports the platform must not claim | Senai, Kerteh and Tanjung Manis are not MAHB airports | [search] FN §6 (candidates; the source for "39 of 42" does not name them) |
| Covered by today's passenger site | 5 airports (six trees: `klia1`, `klia2`, `penang`, `kota-kinabalu`, `kuching`, `langkawi`); Subang and 33 others absent | [direct] FO |

STOLport codes and three Peninsular island STOLports rest on prior knowledge at low confidence [prior, FN §2.3]. The
platform lists them with that caveat until MAHB supplies an official register (open question Q7). The prototype's
registry holds all 39, with depth tiers: full for the five international airports, essential for the 17 domestic
airports and listing for the 17 STOLports [direct, `src/content/airports.ts`].

### 2.2 Traffic

| Measure | Value | Evidence |
|---|---|---|
| Group passenger movements, 2025 | 153.3 million | [search] FC `traffic-2025-group-total`, corporate.malaysiaairports.com.my/en/media-centre/news/1678 |
| Malaysia (39 airports), 2025 | 104.4 million, up 11.2% | [search] FC `traffic-2025-malaysia`, thestar.com.my 20 Jan 2026 |
| KLIA, 2025 | 63.3 million, up 10.8% (about 61% of Malaysia) | [search] FC `traffic-2025-klia` |
| Other 38 airports, 2025 | about 41.1 million (about 39%) | derived from the two rows above |
| Peak month and hour | December 2025, 10 million in Malaysia; KLIA record 12,437 passengers in one hour, 13 Sep 2025 | [search] FC `traffic-2025-december-peak`, `traffic-klia-hourly-record-2025` |
| January to September 2026, Malaysia | 75.2 million, down 2.4%; international 41.3 million, up 4.5% | [search] FC, thestar.com.my 26 Oct 2026 |
| September 2026, Malaysia | 7.8 million, down 12%, on soft domestic demand | [search] FC `traffic-2026-09-malaysia` |

Implications [assessment]: a product designed around KLIA alone ignores two in five passengers; the international
share is growing while domestic demand softens, which raises the weight of first-time and foreign visitors; and peak
hours set the load profile the platform must survive. Traffic figures change monthly [search, FC
`web-monthly-traffic-releases`], so the corporate site holds them as dated data, not copy.

### 2.3 Visit Malaysia 2026

Visit Malaysia 2026 is the national tourism campaign year [prior; campaign targets not re-confirmed and not quoted
here]. MAHB tied its 2025 traffic release to it ("Strong 2025 passenger growth builds momentum for Visit Malaysia
2026") [search, corporate.malaysiaairports.com.my/en/media-centre/news/1678] and runs ShopLAH, an always-on retail
campaign with a digital card for international visitors, for the same year [search,
marketing-interactive.com/malaysia-airports-doubles-down-on-retail-with-shoplah-push-for-vm2026]. ShopLAH was not
seen on the passenger pages that rendered [direct for what was seen; absence: hypothesis].

The campaign year ends in six weeks. This platform cannot serve it and should not be sold as if it could. Its relevance
is the legacy: a larger base of first-time international visitors, growing international traffic, and campaign
partners who expect the airport to be the first impression of the country [hypothesis]. The design response is
bilingual parity from launch, a planned path to the main inbound visitor languages, and arrival guidance that protects
visitors from touting at the point of decision (AUD V6).

### 2.4 Privatisation and what it implies for digital ambition

Facts [search, FC §2 and §7; The Star, 25 Feb 2025, thestar.com.my/business/business-news/2025/02/25/delisting-a-watershed-moment-for-mahb-privatisation]:
MAHB was delisted from Bursa Malaysia on 25 February 2025 and is wholly owned by Gateway Development Alliance
(Khazanah Nasional, the Employees Provident Fund, the Abu Dhabi Investment Authority and Global Infrastructure
Partners), with the Government holding a special share. The five independent non-executive directors resigned on
delisting. The Operating Agreements signed on 18 March 2024 run to 11 February 2069, cover all 39 airports and
STOLports, allow an investment recovery model and permit partners and investors subject to Government policy.
Management's stated 2026 priorities include a "commercial reset" with digital and omnichannel engagement described as
central [search, futuretravelexperience.com, May 2026], a review of the duty-free concession model [search, nst.com.my,
Aug 2026] and investment in connectivity and capacity [search, thestar.com.my, 20 Oct 2026].

Implications [assessment, to be tested with MAHB]:

1. A 43-year remaining concession makes a durable platform, owned content and owned customer relationships rational
   investments, rather than campaign sites.
2. Owners with infrastructure-investment backgrounds will judge digital by non-aeronautical yield and cost to serve.
   The strategy therefore measures ancillary conversion and contact deflection from the start (section 7).
3. The special share and the public-service nature of the Operating Agreements keep public accountability: accuracy,
   accessibility and the whole network, including rural STOLports, remain duties, not options.
4. The corporate site's audience shifts from shareholders to owners, Government, lenders, airline partners, tenants,
   suppliers, media and job seekers. A listed-company investor relations section no longer applies; an ownership and
   governance page and a reports archive replace it [search, FC §2].

### 2.5 The current estate in one table

| Finding | Evidence |
|---|---|
| Client-rendered pages that are empty when the content API is unavailable; no error or retry message; 6 of 16 crawled URLs returned HTTP 502 under the block | [direct] FO, AUD finding 1 |
| Homepage lab: performance 9 to 19, LCP 5.2 to 6.9 s, TBT 0.9 to 4.5 s, CLS 0.62, 32.7 to 34.3 MB over about 171 requests; departures LCP 17.5 s | [direct, lab] LH |
| axe-core: 6 rules on 27 elements (desktop), 5 on 19 (mobile); no `h1` on the homepage; a passenger page titled "Corporate Website" | [direct, lab; direct] FO |
| 276 sitemap URLs, six identical trees, 48 duplicate-topic URLs, English only, no flight pages | [direct] AUD findings 2 and 3 |
| Flight widget departures-only and preset to Terminal 1 | [direct] AUD Task 1 |
| No rate table on the KLIA Terminal 1 parking page | [direct] FO |
| At least 13 hostnames; Fast Track sold on a separate domain | [direct, search] AUD finding 9 |

## 3. Audiences and personas

Personas are archetypes built from the audit, fact files and press evidence. No passenger interviews have been held;
each persona is a hypothesis to validate in research before launch (open question Q12). P1 to P9 are passengers;
P10 to P13 are corporate-site audiences.

**P1 Frequent international business traveller (KLIA, several trips a month).**
- Goals and context: minimum time at the airport; travels light; often on a phone between meetings; values certainty
  over browsing.
- Top tasks: flight status and gate; leave-by time; parking price and pre-booking; Fast Track; lounge.
- Pain points: flight search departures-only and terminal-first [direct, AUD Task 1]; Fast Track on another domain with
  no price seen [direct]; parking prices absent and conflicting [direct; search, V2].
- Success: follows a flight from the home screen in two interactions; knows when to leave; books parking with the price
  shown first.
- Accessibility needs: one-handed phone use; legible board in bright light; nothing that blocks a tap during load.

**P2 First-time international visitor (arriving KLIA, often Terminal 2).**
- Goals and context: get through entry and into the city safely and at a fair price; unfamiliar with Malaysia; may read
  English as a second language; may be on roaming data or airport Wi-Fi.
- Top tasks: entry requirements (Malaysia Digital Arrival Card); which terminal; official transport options and fares;
  SIM, money, prayer rooms.
- Pain points: touting at the transport decision point [search, V6]; fares that change on 1 January 2027 [search, FT];
  immigration outages [search, V5]; English-only site [direct].
- Success: knows before landing what to submit and where to go; reaches an official option without being approached
  by a tout; every fare shown with its date.
- Accessibility needs: plain language; low data use; icons with words; a language other than English (phase 2).

**P3 Family with an infant (domestic or regional trip).**
- Goals and context: avoid waiting with a tired child; travel with a pram, milk and nappies.
- Top tasks: what liquids and baby food can be carried; nursing rooms and play areas near the gate; family parking bays;
  food that is open now.
- Pain points: facility locations, levels and hours not captured from any source [search gap, AUD Task 3]; two
  facilities pages per airport [direct].
- Success: finds the nearest nursing room on the right side of security with level and hours, or a clear "not
  published" with the official contact.
- Accessibility needs: pram-friendly (step-free) routes; large touch targets for use while carrying a child.

**P4 Wheelchair user.**
- Goals and context: arrange assistance once, with confidence it will be there; know which routes, lifts and toilets
  work.
- Top tasks: how to request assistance and with what notice; accessible toilets and lifts; accessible parking; status
  of the Aerotrain to the Terminal 1 satellite.
- Pain points: a special-assistance page exists [direct] but sits among duplicate URLs; reduced-mobility assistance is
  reportedly arranged through the airline with 48 hours' notice [prior, low, FK]; Aerotrain stoppages and night
  closures [search, V3].
- Success: one assistance hub with the request route, lead time and contacts; a step-free route on the map; a status
  line for the Aerotrain.
- Accessibility needs: WCAG 2.2 AA; step-free routing with button alternatives to any map gesture; accessible-bay
  information.

**P5 Older traveller (domestic or Haj and Umrah-age traveller, often accompanied).**
- Goals and context: reassurance; may prefer Bahasa Malaysia; may phone rather than browse.
- Top tasks: what time to arrive; where to check in; porter or buggy; a working phone number.
- Pain points: two general numbers in structured data [search, AUD §8]; porter and buggy services not found on the site
  [search negative]; taps unanswered during load (TBT up to 4.5 s) [direct, lab].
- Success: reads the answer at 125% text size in Malay; reaches a verified number in one tap.
- Accessibility needs: text size and high-contrast settings that persist; no time limits; plain words.

**P6 Neurodivergent traveller (or a parent travelling with a neurodivergent child).**
- Goals and context: predictability; knowing in advance what each stage looks and sounds like; a quiet place.
- Top tasks: what the Butterfly Effect offers and how to register; Calm Room locations and access; quieter routes and
  times.
- Pain points: the hidden-disability programme is filed under "Booking Services" and appears at three URLs [direct];
  registration is reported as needed on each visit [search, low, FK]; no sensory map found.
- Success: a step-by-step visual guide; Calm Rooms located (Terminal 1 Level 5, Terminal 2 Level 3A [search, FK]); the
  limits of the scheme stated honestly.
- Accessibility needs: reduced motion; no autoplay; predictable layout; clear, literal language.

**P7 Self-transfer passenger between KLIA Terminal 1 and Terminal 2.**
- Goals and context: on separate tickets, for example a full-service long-haul arrival at Terminal 1 and a low-cost
  regional departure from Terminal 2; must not miss the second flight.
- Top tasks: what the transfer involves; how long to allow; train or shuttle; where to re-check bags.
- Pain points: no airside link, so passengers clear immigration, collect bags and re-check [search, FT]; shuttle
  frequency stated as every 10 or every 15 minutes depending on the page [direct and search, AUD §8]; a seamless link
  announced for mid-2026 is not confirmed as launched [search, V7]; transfer pages duplicated under every airport tree
  [direct].
- Success: enters two flights or two times and gets ordered steps, a buffer verdict labelled as an estimate, and what
  to do if it is tight.
- Accessibility needs: works on roaming data; usable while walking; Aerotrain status where relevant.

**P8 Domestic commuter (Kuala Lumpur to Penang, Kuching or Kota Kinabalu; sometimes via Subang).**
- Goals and context: routine trips, often weekly; knows the airport; wants speed and early warning.
- Top tasks: flight status; parking and its daily cap; which airport (KLIA or Subang) and terminal; disruption.
- Pain points: Subang is absent from the site [direct] although it carries scheduled services and has seen airlines
  move jets away in 2025 [search, FN §5]; Penang, Kuching and Kota Kinabalu share KLIA template pages [direct].
  Travellers entering Sabah or Sarawak may face a separate state immigration check [prior; confirm before publishing].
- Success: the saved flight and parked-car note are on the home screen; airport changes in one tap.
- Accessibility needs: fast repeat use; keyboard shortcuts on desktop; low data.

**P9 Someone meeting a passenger.**
- Goals and context: arrive when the traveller exits, not when the plane lands; park briefly or pick up legally.
- Top tasks: arrival status and baggage; where to wait; short-stay parking price; e-hailing and private-car pick-up
  points.
- Pain points: arrivals and the other terminal need separate pages [direct]; the 18 April 2026 baggage failure caused
  two to four hour waits [search, V4]; pick-up points and entry fees changed in 2026 [search, FT].
- Success: a shared link to the traveller's flight with an "I'm meeting someone" view and an estimated exit time,
  labelled as an estimate.
- Accessibility needs: glanceable status while driving is not a use case; the product must not encourage it. Large,
  clear status words for a quick check before setting off.

**Corporate audiences (corporate section, `/corporate/**`).**

| Persona | Goals and context | Top tasks | Pain points (evidence) | Success | Accessibility needs |
|---|---|---|---|---|---|
| P10 Airline partner (network planner, station manager) | Assess routes and incentives; operate at several airports | Airport profiles with facilities and traffic; contacts for aviation development; terminal and airline directory | No airline-to-terminal directory [search negative]; airline incentive programmes not found [gap, FC] | One profile per airport with dated traffic and a named route-development contact | Data tables usable by screen reader; downloadable data |
| P11 Tenant or supplier | Find tenders, register as a vendor, lease space | Procurement process; vendor registration; leasing and advertising contacts | Vendors use a separate VMS and a third-party tender portal; older notices name another host [search, AUD]; leasing contacts not found [gap] | One procurement page explaining each portal and step, with dates | Plain process steps; accessible PDFs or HTML |
| P12 Investor, lender or journalist | Understand ownership, performance and news after delisting | Ownership and governance; traffic releases; media contacts; reports archive | No ownership page located; management page duplicated with different content [search, AUD] | One canonical source for leadership, ownership and dated traffic | Dated, citable pages; accessible charts |
| P13 Job seeker | Find and apply for roles; understand programmes | Vacancies; graduate and technical programmes; working at an airport | Careers on a separate host; programmes not researched [search, gap] | Clear hand-off to the careers portal with context on roles at each airport | Bilingual content; accessible application hand-off |

## 4. Prioritised journeys

### 4.1 The top 15 passenger tasks

Frequency and criticality are expert estimates [assessment] until MAHB supplies analytics and contact-centre reasons
(Q4, Q5). Criticality is high where failure can cause a missed flight, financial loss or harm to wellbeing. An
interaction is a tap, click or submitted entry (typing a query and choosing a suggestion counts as one), counted at
360 px from the network home with nothing saved. Current friction is the audit's minimum path where one exists.

| # | Task | Personas | Frequency | Criticality | Current friction (evidence) | Target interactions |
|---|---|---|---|---|---|---|
| 1 | Check a flight's status, terminal and gate (departure or arrival) | P1 P2 P8 P9 | Very high | High | Departures-only widget preset to Terminal 1; arrivals and Terminal 2 on other pages; "Loading..." when the API fails [direct, Task 1] | 2 |
| 2 | Find which KLIA terminal an airline uses | P2 P8 P9 | High | High | No airline-to-terminal directory found [search negative, AUD §8] | 1 |
| 3 | Plan the trip to the airport and when to leave | P1 P3 P5 P8 | High | High | Modes on separate tabs; no leave-by guidance seen [search; hypothesis] | 3 |
| 4 | Get from KLIA to the city on an official option | P2 P5 | High | High | Rail fares not in indexed text; page errored under the block; touting at the decision point [search, direct, V6] | 2 |
| 5 | Find the parking price for a stay, then pre-book | P1 P8 P9 | High | High | No rate table; conflicting rates; RM2,084 and RM384 bills reported [direct; search, V1, V2] | 3 to a price; 5 to the booking hand-off |
| 6 | Meet an arriving passenger: when to arrive, where to wait, where to pick up | P9 | High | Medium | Arrivals separate; no baggage status layer [direct; search, V4] | 3 |
| 7 | Find a facility near me (prayer room, toilet, nursing room) | P2 P3 P5 P6 | High | Medium | Two facilities pages; levels and hours not captured; app map has no search [direct; search, Task 3, V8] | 2 |
| 8 | See disruption or service status (Aerotrain, baggage, immigration) | All | Medium, spiking | High | No status layer seen; a 2021 Aerotrain item still surfaces in search [direct, search, finding 8] | 0 when active; 1 otherwise |
| 9 | Change terminals at KLIA on a self-transfer | P7 | Medium | High | Duplicate pages; conflicting shuttle frequency; seamless link unconfirmed [direct, search, V7] | 3 |
| 10 | Arrange or understand special assistance | P4 P5 P6 | Medium | High | Hidden-disability programme under "Booking Services" at three URLs [direct] | 2 |
| 11 | Check entry requirements before landing | P2 P7 | Medium | High | Official rules sit with Immigration; autogate list not found [search, FT] | 2, then hand-off |
| 12 | Check what can be carried (liquids, restricted items) | P2 P3 P5 | Medium | Medium | Same rules duplicated under six trees [direct] | 2 |
| 13 | Find food or shops (halal, open now, before or after security) | P1 P2 P3 | Medium | Low | Homepage leads with promotions; outlet directories unread under the block [direct, FS] | 2 |
| 14 | Report lost property or contact help | P5 P9 | Low | Medium | Page errored under the block; contacts only from third parties; two general numbers [direct, search, Task 5] | 2 |
| 15 | Book Fast Track, a lounge or a rest facility | P1 | Low to medium | Low | Fast Track on a separate domain; no price seen [direct] | 3 to the partner hand-off |

### 4.2 Critical journeys in the new product

Each journey describes the intended product. In the concept prototype, flights, gates, belts and notifications come
from the demonstration provider and carry the "Demonstration data" label; maps are schematic and say so [BS §6, §7].

**Departing (P1, KLIA).**
1. The network home opens with no airport assumed and the journey mode on Departing. The search field accepts a flight
   number, airline, city or facility.
2. Typing a flight number returns an inline card with status (icon, shape and word), terminal, scheduled and estimated
   time and an "Updated hh:mm" stamp. The terminal is resolved for the passenger; they never choose it first.
3. The flight page is a timeline: leave by (estimated), check-in (airline rules linked, not restated), security, gate,
   boarding. Each step carries its provenance tag.
4. "Save this flight" stores it on the device; the home screen then leads with it. Notifications are opt-in through the
   browser and, in the prototype, are demonstration notifications.
5. "How will you get there?" opens the transport comparison with the flight's terminal pre-set (see Ground transport).
6. If flight data fails, the page says that flight information is unavailable, shows the last-known values with their
   time and links to the airline; all static guidance still renders.

**Arriving (P2, first visit, KLIA Terminal 2).**
1. Before travel, Arriving mode reorders the home: arrivals board, entry checklist, transport into the city.
2. The entry checklist states the Malaysia Digital Arrival Card rule (submit within three days before arrival, free on
   the official Immigration portal) as official with its source and date [search, FT], and links to Immigration for
   autogate eligibility rather than publishing a list we do not have.
3. On landing, the flight page shows the belt (demo in the prototype) and any active notice, for example a baggage
   incident with instructions and a contact route.
4. The transport step compares official options and states, at the point of decision, that official taxis are booked
   at counters and e-hailing at signed pick-up points, with the scam-alert guidance beside them.

**Transiting (P7, self-transfer from Terminal 1 to Terminal 2).**
1. Transiting mode opens the transfer planner, which asks for the two flights, or two terminals and times, and whether
   bags are checked through.
2. For a self-transfer it lists the steps: immigration, baggage reclaim, landside move, check-in again, security and
   emigration. The train (RM2 adult [search, medium, FT]) and the free shuttle are shown with their sources; where
   sources disagree (shuttle every 10 or 15 minutes) the planner says so.
3. It gives a buffer verdict built from labelled estimates and never invents a number the evidence lacks (the Terminal
   1 to Terminal 2 rail time is unverified and is not shown as a figure [FT]).
4. It states that a seamless inter-terminal link was announced for mid-2026 and is not confirmed as launched, and tells
   the passenger to check with the airline [search, FT]. When MAHB confirms a launch, the planner adds that route.
5. If the connection is tight, it says what to do: contact the departing airline first, then the information counters.

**Meeting (P9, collecting a family member).**
1. Meeting mode switches the board to arrivals and renames actions: "Track an arrival", "Where to wait", "Pick-up and
   parking".
2. The traveller shares their flight link; the greeter's view shows landed, baggage on belt and an estimated exit
   window, each labelled.
3. Short-stay parking prices come from the calculator; e-hailing pick-up points and the vehicle entry fee are shown with
   their dates [search, FT].
4. Active disruption notices appear on the flight page itself, not only on a notices page.

**Accessibility (P4 and P6).**
1. "Assistance" is reachable from the header and Help on every page and leads to one hub organised by need (mobility,
   hidden disability, sight, hearing, older travellers, families) and by journey stage.
2. Mobility: how to request assistance and with what notice, marked official only when confirmed; otherwise "arrange
   through your airline" with the source of that guidance.
3. Hidden disability: the Butterfly Effect, how to register, what the kit includes, Calm Room locations and what the
   scheme does not cover [search, FK].
4. The schematic map offers step-free routes, lifts, accessible toilets and quiet rooms, with list and button
   alternatives for every map action [BS §9].
5. Text size, contrast and motion settings persist on the device. An accessibility statement gives the audit date and
   a contact for reporting barriers.

**Parking (P8, four days at KLIA).**
1. The parking page leads with each product's daily cap and the difference between them, then hourly bands; every rate
   carries its source and date, and conflicting figures are shown as conflicts, not settled [search, FT].
2. The calculator takes entry and exit times and returns a total per product from the same rate data.
3. Choosing Preferred Parking for a long stay triggers a plain warning with the long-term alternative (the RM2,084 case
   [search, V1]).
4. "Book" hands off to the official booking tool with the dates carried over where a partner agreement allows; in the
   prototype it links to the official page.
5. A parked-car note (block, level, bay) is saved on the device and returns on the home screen for the trip back.

**Ground transport (P2, KLIA to the city).**
1. The planner asks for a destination and shows rail, bus, taxi, e-hailing and car hire side by side: time (estimated),
   fare (official, dated), hours, boarding point, payment and step-free access.
2. Fares carry validity dates and switch automatically: the KLIA Ekspres adult fare is RM55 until 31 December 2026 and
   RM65 from 1 January 2027 [search, FT]; the upcoming change shows as a notice.
3. Where sources conflict (first and last train), the planner points to the operator instead of choosing a figure.

**Shop and dine (P3, airside at Terminal 1).**
1. From the flight page, "Before you board" lists outlets in the same terminal and zone, with filters for halal, open
   now (computed from published hours, labelled estimated) and before or after security.
2. Outlet pages show only confirmed facts; unknown fields read "Not published" [BS §6].
3. Offers appear after the answer, labelled, and only where a partner agreement exists (section 8).

## 5. Competitive differentiation

The benchmark set was reviewed at different evidence levels. Lighthouse and axe figures are independent lab
measurements by this project; feature judgements and scores in the benchmark files are expert assessments.

| Benchmark | Our evidence | What it does best (to beat) | Lab weight / accessibility score [direct, lab, LH] |
|---|---|---|---|
| Singapore Changi | Search only | FlightSaver and saved flights, iShopChangi, invisible-disability content | 21.0 MB / 74 |
| Dubai DXB | Search only | Pocket Flights (no app), Smart Gates precheck, "DXB for All" | 4.4 MB / 100 |
| Hamad Doha | Direct | Flight page as a journey timeline with live queue status | 11.6 MB / 82 (one valid run) |
| Tokyo Haneda | Direct | Flight "Sample Plan", timestamped congestion panel | 13.2 MB / 80 |
| London Heathrow | Direct and search | Connections planner, wait times, Hallie assistant, one account | 1.8 MB / 92 |
| Hong Kong | Direct | Board depth with map links, login-free bookmark, one search box | 2.3 MB / 68 |
| Munich | Direct | Login-free track strip, flight-intent site search | 4.6 MB / 47 |
| Amsterdam Schiphol | Search only (bot challenge) | Bookable security slots, per-flight URLs, public Flight API | not measured |
| MAHB today | Direct | | 32.7 MB / 79 |

The common pattern [assessment]: the best journey features are app-only or login-gated (Changi, Haneda, HKIA,
Heathrow, Schiphol), estates are fragmented across hosts (Changi, Dubai, Heathrow, Haneda), content drifts between
pages and languages (Changi, Heathrow, Schiphol), and almost none publishes an accessibility statement. Every benchmark
is a single airport or a two-airport city system. MAHB wins by doing what they structurally cannot, and by refusing
their common failures.

1. **One airport model for the whole network, STOLports included.** All 39 airports in one registry and one URL scheme,
   KLIA as one airport with a terminal filter, depth tiers so a STOLport listing is honest about what it holds.
   Beats: every benchmark (single hubs) and Changi's own "network-wide" idea, which Changi cannot execute
   [BM-changi]. Why it wins: the airports passengers fly between, including domestic connections and rural air
   services in Sabah and Sarawak, are in one product.
2. **Provenance on every piece of guidance.** Each item is tagged official, estimated, suggestion or demo, with its
   source and retrieval date [BS §1]. Beats: Changi (S$10 against S$50 for one benefit across languages), Heathrow
   (a 2024 notice live in 2026, prices differing by page) and Schiphol (superseded prices) [BM files]. Why: trust is
   built where competitors visibly lose it, and MAHB's own parking controversy (V2) was a content-accuracy failure.
3. **Honest live and demo separation, with freshness and failure states.** "Updated hh:mm" on every live list,
   last-known values when a feed fails, airport-local time, and a labelled demo mode. Beats: Hamad (no timestamp,
   "today" from the visitor's clock), Heathrow (client-only data that fails to an error), MAHB today (silent blank
   pages) [direct, BM-hamad, BM-heathrow, FO]. HKIA's timestamp is matched and extended to failure states.
4. **A mode-aware first screen.** Departing, arriving, transiting and meeting reorder the board, actions and guidance
   everywhere [BS §8]. Beats: Heathrow, which offers a passenger or collector split only inside flight details, and
   Hamad's fixed quick links [BM-heathrow, BM-hamad]. Why: the greeter and the transfer passenger are served from the
   first tap.
5. **A self-transfer planner for the Terminal 1 to Terminal 2 gap.** Steps, sourced facts, labelled estimates and a
   "what if it is tight" answer. Beats: Heathrow, which tells self-connecting passengers its planner does not apply,
   and Dubai, which publishes procedural text only [BM-heathrow, BM-dubai]. Why: KLIA's terminal split is the network's
   most distinctive transfer risk (V7).
6. **The flight as a shareable, login-free page.** A permanent URL per flight with timeline, save, share and role
   views; alerts by web push without an app. Beats: Changi, Haneda, HKIA and Heathrow, which gate alerts behind an
   app or account; HKIA, which has no per-flight URL; Munich's track strip, which has no alerts [BM files]. Why: most
   first-time and foreign visitors start on the mobile web.
7. **Price-first parking from one rate source.** Daily caps first, a calculator fed by the same data, a long-stay
   warning, dated rate changes. Beats: Dubai's tariff page, the best seen, by adding calculation and warnings
   [BM-dubai]; fixes V1 and V2. Depends on MAHB's tariff data (Q2).
8. **A door-to-terminal transport comparison with dated fares and anti-touting at the point of decision.** Beats:
   Changi (mode-by-mode pages, hotlines) and Schiphol (hands off to external planners) [BM-changi, BM-schiphol]. Why:
   it answers the visitor's highest-risk decision (V6) and handles the 1 January 2027 fare change automatically.
9. **Published performance and weight budgets, and a site that works without JavaScript.** Static guidance is
   server-rendered and readable with scripts off; a service worker caches the shell and guidance [BS §3, §8]. Budgets
   in section 7. Beats: every measured benchmark on weight, from Heathrow's 1.8 MB (the lightest valid measurement) to
   Changi's 21.0 MB and Hamad's 11.6 MB with an 87.8 MB hero video [direct, lab, LH, BM-hamad]. Why: airport Wi-Fi,
   roaming data and mid-range phones are the real conditions.
10. **Bilingual from day one, with parity enforced in code.** English and Bahasa Malaysia for every interface string,
    a visible notice where Malay content falls back to English, and one structured fact shared by both languages so
    they cannot drift [BS §8]. Matches Dubai, Munich and Schiphol on count and beats them on drift control; beats MAHB
    today (English only [direct]). Next: human-reviewed core journeys in the main inbound languages (Q9).
11. **A concierge that cites its sources and works without AI.** Answers come only from the content layer and the
    flight provider, carry provenance, escalate to official contacts, and run in a deterministic retrieval mode; an
    optional model may rephrase a grounded answer and never receives personal data [BS §8]. Beats: Heathrow's Hallie
    (English-configured, on some pages, resolution figure vendor-reported) and Dubai's DXBChat (documented only by its
    vendor) [BM-heathrow, BM-dubai]. Why: an airport cannot afford an assistant that invents a gate or a fare.
12. **Accessibility as a product layer and a release gate.** WCAG 2.2 AA as the floor, an assistance hub at the top
    level, step-free and sensory routes in the map, persisted preferences and a dated statement. Beats: Munich (lab
    47), HKIA (68), Changi (74, PDF sensory map, no statement found) on the measured basics; to beat Dubai (lab 100
    and a strong programme) it must add map-level routing and a published conformance statement [direct, lab; search].

Where we will not compete yet: loyalty and payment wallets (Changi, Heathrow), lock-screen app surfaces (Schiphol),
bookable security slots (Schiphol) and live queue times (Hamad, Heathrow). Each needs MAHB operational data,
partners or an app strategy (Q1, Q10, Q16).

## 6. Product principles

| # | Principle | Test (pass condition) |
|---|---|---|
| 1 | Answer first. The top task of each page is answered or actionable in the first screen. | For each of the 15 tasks, the answer or its control is visible without scrolling at 360 by 800 and 1280 by 720. |
| 2 | Never present simulated data as live. | End-to-end tests find the demo label on every flight row, card, concierge answer and notification in demo mode: zero exceptions. |
| 3 | Every fact has a source and a date. | A build-time content test fails on any item without a source id and retrieval date: 100% coverage. |
| 4 | Say what we do not know. | Fixtures with missing hours, prices or locations render "Not published" and the official channel; no empty cells. |
| 5 | No airport assumed; changing it takes one tap. | First visit has no airport selected; from any airport page, switching airport is one interaction plus the choice. |
| 6 | One topic, one address. | A crawl finds no duplicate `h1` or title within an airport, one canonical URL per topic, and redirects for legacy paths. |
| 7 | Useful when scripts or data fail. | With JavaScript disabled, guidance, transport, parking and contacts render in full; with `/api/flights` failing, flight surfaces show an explicit unavailable state and a retry. |
| 8 | Accessible by construction. | Zero axe violations on every route in light, dark and high contrast; keyboard-only completion of the eight journeys in 4.2; targets of 44 px on phones. |
| 9 | Light by default. | Page-weight and JavaScript budgets (section 7) enforced in CI; zero third-party requests at runtime. |
| 10 | Commerce serves the journey. | No promotional block above the primary answer on task pages; at most one contextual offer per flight page, labelled, and only from a partner with an agreement. |

## 7. Success metrics

No baselines exist in this project: MAHB's analytics, contact-centre and commercial data were not available. Targets
marked "set after baseline" are set three months after launch. Production measurement needs first-party, aggregate,
consent-aware analytics; the prototype deliberately has none [BS §2], and the choice of tool is a privacy decision for
MAHB under Malaysian data-protection law [prior] (Q15).

**North-star metric: answered journey rate.** The share of sessions that start one of the 15 top tasks and reach that
task's answer state (a flight page viewed, a parking total calculated, a transport option opened, a facility located,
a transfer plan produced). Target: at least 80% twelve months after launch, recalibrated after baseline [assessment].
Guardrails: content accuracy and contact volume, so the metric cannot be met by answering wrongly or by pushing
visitors to call.

| Area | Metric | Target | How measured | Baseline needed from MAHB |
|---|---|---|---|---|
| Task success | Unaided completion in moderated tests, top 8 tasks | At least 90% per task; at least 80% for P2, P4, P5, P6 participants | Task-based usability studies before launch and every six months, both languages, including assistive-technology users | Current-site completion on the same tasks |
| Time on task | Median time: flight status; parking price; T1 to T2 plan; nearest prayer room | 30 s; 60 s; 2 min; 45 s [assessment] | Same studies | Same tasks on the current site |
| Core Web Vitals | LCP, INP, CLS at the 75th percentile, mobile, field data | LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less (the "good" thresholds [prior]; the brief's own figures were not in the project files, so these are the floor) | Field data from real users once live; lab Lighthouse in CI meanwhile | Chrome UX Report history for the current hosts |
| Page weight | First mobile load, transferred | Homes 1,000 KB or less (JavaScript 250 KB, fonts 150 KB, images 300 KB compressed); guidance pages 500 KB or less; 40 requests or fewer [assessment, to verify in QA] | Lighthouse and a CI budget check | Lab: 32.7 to 34.3 MB, 171 requests [direct, lab] |
| Accessibility | Automated and manual conformance | Zero axe violations on all routes and themes; no open WCAG 2.2 AA failures at launch; dated statement published | axe in Playwright on every build; independent manual audit; testing with disabled users | Lab: axe 6 rules / 27 elements, Lighthouse 79 [direct, lab] |
| Search | Zero-result rate; search exit rate; flight-number recognition | Zero-result rate under 5% for the top 200 queries; flight numbers and "klia2" resolved on the first try | Aggregated first-party search logs (queries only, no identifiers) | Search Console queries; no site-wide search exists today [direct] |
| Content accuracy | Items with source and date; items past review date; discrepancies between page, calculator and barrier | 100%; under 2%; zero tariff discrepancies | Content-layer tests; monthly audit; tariff reconciliation | Tariff tables; complaint logs on rates (V2) |
| Commercial | Parking pre-booking share; ancillary hand-off rate from flight pages; Fast Track and lounge attach | Set after baseline | Partner-confirmed bookings with a referral code (no personal data passed) | Parking transactions by channel; Fast Track sales by channel |
| Operational deflection | Contact-centre and chat contacts per 100,000 passengers on covered topics (parking rates, transport, flight status, lost property, assistance) | Set after baseline; hypothesis: a measurable fall on covered topics within 12 months | Contact-reason coding, before and after, by topic | Contact volumes by reason and channel, 12 months |
| Reliability | Availability of static pages; flight-data freshness shown | 99.95% monthly; every live list stamped | Synthetic monitoring; freshness checks | Current uptime and incident history; API rate-limit policy (FO) |

Satisfaction is tracked by a short post-task question, not by internal satisfaction figures: the reported 98.8% and
99.4% for KLIA in September 2026 have no stated method [search, low, FC], and ACI ASQ surveys departing passengers at
the gate [prior], which can miss arrival-side pain.

## 8. Commercial model and ancillary revenue

What exists today [direct unless marked]: a parking booking form on the KLIA Terminal 1 parking page; Fast Track sold
on `myairportfasttrack.com`; a DaySleeper promotion on the homepage (6 hours for MYR135, seen on 16 November 2026);
retail promotions as homepage editorial; Eraman duty-free malls at both terminals [search, FS]; ShopLAH for Visit
Malaysia 2026 [search]; a duty-free concession review [search]. No single basket, account or contextual offer was
evidenced [hypothesis].

Everything below is an opportunity that requires an agreement with MAHB, a MAHB subsidiary or a third party. The
platform states none of it as an existing capability, and the prototype only links to official channels.

| Opportunity | Passenger value | Where it appears | Agreement and data needed | Revenue logic [assessment] | Main risk |
|---|---|---|---|---|---|
| Parking pre-booking | A guaranteed price and space; no bill shock | Parking page, flight page (departing), My journey | MAHB car-park operation: tariff feed and booking API, or a deep link with dates | Shifts drive-up to pre-booked; pre-commitment reduces leakage to e-hailing | Price shown on the site differing from the barrier (V2) |
| Fast Track | Predictable security time | Flight page for departures, after the timeline | Operator of `myairportfasttrack.com` (identity and terms to confirm, Q3) | Referral or merchant-of-record share | Selling speed while queues are not shown |
| Lounges and rest | A place to wait; sleep on long connections | Flight page when the gap is long; transfer planner | Lounge operators; rest providers such as those seen on the homepage | Affiliate commission | Recommending a lounge on the wrong side of security |
| Reserve-and-collect | Buy before travel, collect at the gate or on return | Departing and arriving modes; shop pages | Malaysia Airports (Niaga) (Eraman) e-commerce; customs rules for duty-free pre-order [prior] | Extends the retail window beyond dwell time (Changi model [search, BM-changi]) | Outcome of the duty-free concession review |
| Ground transport tickets | One step from plan to ticket | Transport planner | Rail and coach operators | Affiliate commission | Fare changes (RM65 from 1 Jan 2027) out of sync |
| Hotel and day rooms | Rest near the terminal | Transfer planner; delay notices | K.L. Airport Hotel (Sama-Sama) and other providers [search, FC] | Direct booking share | Over-promotion during disruption |
| Advertising and sponsorship | Relevant offers without tracking | Labelled slots on shop and dine and airport home, never above a task answer | MAHB media sales; first-party placements only, no third-party ad technology | Contextual inventory on a high-intent audience | Performance and trust if budgets or principle 10 are broken |
| Meet-and-greet, porter, buggy | Help for P4, P5 and families | Assistance hub; arriving mode | Providers, if MAHB or concessionaires offer them (not found on the site [search negative]) | Fee or commission | Advertising services that do not exist |

Phasing [assessment]: first, contextual deep links that carry the flight and dates but no personal data, with referral
codes for attribution; second, a single checkout with partners as merchants of record; third, an optional account and
loyalty, only if research shows passengers want it. Rules throughout: prices include all mandatory fees, offers are
labelled, nothing is pre-selected, and no personal data is sold or shared for advertising.

## 9. Risks and open questions

| Risk | Likelihood / impact [assessment] | Mitigation |
|---|---|---|
| No access to MAHB operational data (flights, belts, Aerotrain status, queues) | High / high | Provider interface with demo and official implementations [BS §7]; status layer launched for planned events first |
| Published facts go stale (fares, rates, pick-up points) | High / high | Validity dates on facts, review dates, a named content owner per domain, automated expiry warnings |
| The API layer blocks real visitors on shared addresses, as it blocked this project | Medium / high | Server-rendered fallbacks; rate limits tuned with MAHB logs (FO, hypothesis) |
| Accessibility claims drift from the code | Medium / high | axe in every build; dated statement; annual manual audit |
| Concierge gives a wrong answer | Medium / high | Grounded retrieval only, citations, deterministic mode, escalation, no personal data to the model |
| Partner fragmentation keeps checkout on other domains | High / medium | Phased commercial model; deep links with context first |
| Promotional and media pressure breaks budgets | Medium / medium | Budgets in CI; principle 10; poster images, no video heroes |
| Low-confidence STOLport data published as fact | Medium / medium | Listing tier with caveats until an official register is supplied |
| Malay translation quality and parity | Medium / medium | Typed dictionaries, parity tests, native review of core journeys |
| A concept is mistaken for an official MAHB property | Low / high | "Not an official MAHB property" on the transparency page and in metadata; no official marks without approval |

**Open questions for MAHB.**

1. Q1 Flight data: can the platform use the passenger flight API, under what terms, rate limits and refresh interval?
2. Q2 Parking: who owns the tariff tables, and can the page, calculator and barrier use one source?
3. Q3 Fast Track: who operates `myairportfasttrack.com`, and on what commercial terms could it be offered in context?
4. Q4 Contact centre: volumes by reason and channel for the last 12 months.
5. Q5 Analytics: current traffic, top pages, search queries and device mix; Chrome UX Report access.
6. Q6 Has the seamless Terminal 1 to Terminal 2 link launched, and what are the official transfer times?
7. Q7 An official register of the 39 airports with names, codes and classification.
8. Q8 Assistance: the official reduced-mobility request process and lead time; whether Butterfly registration is
   needed on each visit.
9. Q9 Language priorities beyond English and Bahasa Malaysia, and who reviews translations.
10. Q10 App strategy: the future of MYairports, and whether the web should be the primary channel.
11. Q11 Corporate disclosure after delisting: what ownership, governance and financial information will be published?
12. Q12 Research access: can we recruit passengers, including disabled travellers, for testing at KLIA and a regional
    airport?
13. Q13 Brand: may the platform use MAHB marks, and does the proposition line fit the brand architecture?
14. Q14 Commercial: the timetable and scope of the duty-free concession review, and its effect on reserve-and-collect.
15. Q15 Privacy: the policy for analytics, notifications and messaging channels.
16. Q16 Operations: will Immigration or MAHB share queue data, and can the Aerotrain and shuttle publish a status feed?

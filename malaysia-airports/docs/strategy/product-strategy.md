# Product strategy: the Malaysia Airports passenger and corporate platform

Deliverable 2 of the concept redesign. Date: 17 November 2026. Audience: MAHB board, digital, commercial and
operations leadership, and the design and engineering team.

This is an independent concept. It is not an official MAHB document and has no access to MAHB operational systems,
analytics or contact-centre data. It describes the product we intend to build and the case for it; what the concept
prototype contains at any moment is recorded in `docs/engineering/handoffs/`. Nothing below claims that MAHB offers a
capability unless the evidence says so.

## How to read the evidence

| Tag | Meaning |
|---|---|
| [direct] | Observed first-hand by this project on 16 and 17 November 2026 (browser, curl, sitemap). |
| [direct, lab] | Independently measured by this project with Lighthouse 13 or axe-core 4. Indicative: one location, third parties blocked; not field data and not a conformance claim. |
| [search] | Stated in a web search result, with the URL given here or in the cited fact file. Not read on the official page. |
| [prior] | Background knowledge, not re-confirmed. Must be checked before it reaches passengers. |
| [hypothesis] | Needs usability testing, analytics or technical access to confirm. |
| [assessment] | Expert judgement by this project. Benchmark scores and design-panel scores are assessments, not measurements. |

Source shorthand: FO `docs/research/audit/firsthand-observations.md`; AUD `docs/research/audit/mahb-audit.md` (Tasks
1 to 5, voice-of-passenger rows V1 to V10); LH `docs/research/direct/lighthouse/README.md`; FC
`docs/research/facts/f-corporate.md`; FN `docs/research/facts/f-network.md`; FT `docs/research/facts/f-klia-transport.md`;
FK `docs/research/facts/f-klia-t1.md`; FS `docs/research/facts/f-supplement-commerce-regional.md`; BM-name
`docs/research/benchmarks/<name>.md`; BS `docs/engineering/build-spec.md`. Fact ids are given in backticks.

## Summary for the board

1. MAHB runs 39 Malaysian airports [search, FN `network-total-39`]; its passenger site covers five, as six cloned
   46-page trees [direct, FO]. In 2025 about 39% of Malaysian passengers used airports other than KLIA [derived, FC].
2. The site fails silently when its content API is unavailable, moved about 33 MB on a lab homepage load with a layout
   shift of 0.62, and shows no price on the KLIA Terminal 1 parking page [direct; direct, lab].
3. The pain that reached the press in 2025 and 2026 is operational (parking bills, Aerotrain, baggage, immigration,
   touting, the Terminal 1 to Terminal 2 gap) [search, AUD V1 to V7]; no live status layer was seen [hypothesis].
4. The leading airport sites are single hubs that keep their best features in an app or behind a login [assessment].
   MAHB can outperform them as the only network-wide, web-first, source-cited and fast airport platform.
5. The plan: twelve differentiators (section 5), ten testable principles (section 6), metrics that need MAHB
   baselines (section 7), and commercial upside that depends on partner agreements not yet in place (section 8).

## 1. Vision and positioning

**Proposition: Malaysia Airports. Your journey, beautifully connected.**

The product connects what is separate today: the 39 airports, the stages of a journey (home to onward transport) and
the people involved (traveller, greeter, business partner). "Beautifully" is earned by calm, precise design and fast
answers, not decoration. The line is this project's working proposition, beneath MAHB's brand promise, "Hosting Joyful
Connections", and vision, "A Global Airport Group That Champions Connectivity and Sustainability" [search, FC
`brand-promise`, `brand-vision`, corporate.malaysiaairports.com.my/en/about-us/corporate-profile/our-brand].

| Quality | What it means in the product | How we will know (sections 6 and 7) | What it rules out |
|---|---|---|---|
| Effortless | The top task on every page is answered in the first screen; no airport is assumed and changing it takes one tap; search understands flight numbers, airports and facilities | Interaction targets in section 4 met in usability tests | Menus named after internal programmes; accessibility filed under "Booking Services" |
| Intelligent | Journey mode and a saved flight reorder the product; it calculates parking totals, leave-by times and transfer steps from published data | Mode changes boards and actions on every surface; calculations agree with official sources | AI for its own sake; personalisation that needs an account |
| Reassuring | Every fact carries its source and date; simulated data is labelled; unknowns are said plainly; disruption guidance appears where it is needed | 100% of content items sourced; zero unlabelled demo data | Silent failure, "Loading..." forever, stale notices |
| Premium | Quiet, fast, precise: fine rules, editorial type used sparingly, a dark flight board, nothing that moves on its own | Core Web Vitals and weight budgets met; design review against `docs/design/direction.md` | Video heroes, carousels, promotional `h3`s instead of a heading |
| Distinctly Malaysian | English and Bahasa Malaysia from day one; halal and prayer facilities as first-class data; songket indigo, pucuk rebung hairlines and bunga tabur; the whole network, from KLIA to Bario | Language parity tests; every STOLport in the directory | Flags, clip-art, a KLIA-only view of Malaysia |

**What it is not.**

- Not a KLIA website with regional pages attached. KLIA is one airport with two terminals; the other 38 airports are
  first-class entries at the depth their content supports.
- Not an app-download funnel or a login wall. Saving, following and planning work on the open web without an account.
- Not a retail catalogue on the front door. Commerce appears in the journey, after the answer.
- Not an AI chatbot product. The concierge retrieves verified content, cites it and works with no AI service at all.
- Not an operational system or a substitute for airlines, Immigration or operators: it attributes and hands off. In
  the prototype every live-looking value is labelled demonstration data [BS rule 1].
- Not a tracking platform. Personal state stays on the device; no third-party requests [BS §2, §3].

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
| Superseded split still indexed | 5 / 16 / 18; Mukah became a domestic airport in June 2021 | [search] FN `network-split-reconciliation-mukah` (Mukah as sole cause is an inference) |
| Overseas | Istanbul Sabiha Gokcen, outside the Malaysian Operating Agreements | [search] FN `network-plus-isg-40` |
| Not MAHB airports | Senai, Kerteh and Tanjung Manis | [search] FN §6 (candidates; the "39 of 42" source does not name them) |
| Covered by today's passenger site | 5 airports in six trees (`klia1`, `klia2`, `penang`, `kota-kinabalu`, `kuching`, `langkawi`); Subang and 33 others absent | [direct] FO |

Codes for most STOLports and the three Peninsular island STOLports rest on prior knowledge at low confidence [prior,
FN §2.3]; they are listed with that caveat until MAHB supplies an official register (Q7). The prototype registry holds
all 39 with depth tiers: full for the five international airports, essential for the 17 domestic airports, listing for
the 17 STOLports [direct, `src/content/airports.ts`].

### 2.2 Traffic

| Measure | Value | Evidence |
|---|---|---|
| Group passenger movements, 2025 | 153.3 million | [search] FC `traffic-2025-group-total`, corporate.malaysiaairports.com.my/en/media-centre/news/1678 |
| Malaysia (39 airports), 2025 | 104.4 million, up 11.2% | [search] FC `traffic-2025-malaysia`, thestar.com.my, 20 Jan 2026 |
| KLIA, 2025 | 63.3 million, up 10.8% (about 61% of Malaysia) | [search] FC `traffic-2025-klia` |
| Other 38 airports, 2025 | about 41.1 million (about 39%) | derived from the two rows above |
| Peaks | December 2025: 10 million in Malaysia; KLIA record of 12,437 passengers in one hour, 13 Sep 2025 | [search] FC `traffic-2025-december-peak`, `traffic-klia-hourly-record-2025` |
| January to September 2026, Malaysia | 75.2 million, down 2.4%; international 41.3 million, up 4.5% | [search] FC, thestar.com.my, 26 Oct 2026 |
| September 2026, Malaysia | 7.8 million, down 12%, on soft domestic demand | [search] FC `traffic-2026-09-malaysia` |

Implications [assessment]: a product designed around KLIA alone ignores two in five passengers; international traffic
is growing while domestic demand softens, which raises the weight of first-time and foreign visitors; and peak hours set
the load the platform must survive. Traffic is released monthly [search, FC `web-monthly-traffic-releases`], so the
corporate site holds it as dated data, not copy.

### 2.3 Visit Malaysia 2026

Visit Malaysia 2026 is the national tourism campaign year [prior; campaign targets not re-confirmed and not quoted].
MAHB tied its 2025 traffic release to it ("Strong 2025 passenger growth builds momentum for Visit Malaysia 2026")
[search, corporate.malaysiaairports.com.my/en/media-centre/news/1678] and runs ShopLAH, an always-on retail campaign
with a digital card for international visitors, for the same year [search,
marketing-interactive.com/malaysia-airports-doubles-down-on-retail-with-shoplah-push-for-vm2026]. ShopLAH was not seen
on the passenger pages that rendered [direct for what was seen; absence: hypothesis].

The campaign year ends in six weeks; this platform cannot serve it and should not claim to. Its relevance is the
legacy: more first-time international visitors and partners who expect the airport to be the country's first
impression [hypothesis]. The response: bilingual parity at launch, a path to the main inbound languages, and arrival
guidance that protects visitors from touting where they decide (V6).

### 2.4 Privatisation and what it implies for digital ambition

Facts [search, FC §2 and §7; thestar.com.my/business/business-news/2025/02/25/delisting-a-watershed-moment-for-mahb-privatisation]:
MAHB was delisted from Bursa Malaysia on 25 February 2025 and is wholly owned by Gateway Development Alliance (Khazanah
Nasional, the Employees Provident Fund, the Abu Dhabi Investment Authority and Global Infrastructure Partners), with the
Government holding a special share. The five independent non-executive directors resigned on delisting. The Operating
Agreements signed on 18 March 2024 run to 11 February 2069, cover all 39 airports and STOLports, allow an investment
recovery model and permit partners. 2026 priorities include a "commercial reset" with digital engagement described
as central [search, futuretravelexperience.com, May 2026], a duty-free concession review [search, nst.com.my, Aug 2026]
and connectivity and capacity [search, thestar.com.my, 20 Oct 2026].

Implications [assessment, to test with MAHB]:

1. About 42 years of remaining concession make a durable platform, owned content and owned customer relationships
   rational investments, rather than campaign sites.
2. Infrastructure owners will judge digital by non-aeronautical yield and cost to serve, so ancillary conversion and
   contact deflection are measured from the start (section 7).
3. The special share and the public-service nature of the Operating Agreements keep public accountability: accuracy,
   accessibility and coverage of the whole network, rural STOLports included, are duties, not options.
4. The corporate audience shifts from shareholders to owners, Government, lenders, airlines, tenants, suppliers, media
   and job seekers. An ownership and governance page and a reports archive replace investor relations [search, FC §2].

### 2.5 The current estate in one table

| Finding | Evidence |
|---|---|
| Client-rendered pages that are empty when the content API is unavailable, with no error or retry message; 6 of 16 crawled URLs returned HTTP 502 under the block | [direct] FO, AUD finding 1 |
| Homepage: performance 9 to 19, LCP 5.2 to 6.9 s, TBT 0.9 to 4.5 s, CLS 0.62, 32.7 to 34.3 MB over about 171 requests; departures LCP 17.5 s | [direct, lab] LH |
| axe-core: 6 rules on 27 elements (desktop), 5 on 19 (mobile); no `h1` on the homepage; a passenger page titled "Corporate Website" | [direct, lab; direct] FO |
| 276 sitemap URLs, six identical trees, 48 duplicate-topic URLs, English only, no flight pages | [direct] AUD findings 2 and 3 |
| Flight widget departures-only and preset to Terminal 1 | [direct] AUD Task 1 |
| At least 13 hostnames; Fast Track sold on a separate domain | [direct, search] AUD finding 9 |

## 3. Audiences and personas

Personas are archetypes built from the audit, fact files and press evidence. No passenger interviews have been held;
each persona is a hypothesis to validate before launch (Q12). P1 to P9 are passengers; P10 to P13 are corporate.

**P1 Frequent international business traveller (KLIA, several trips a month).**
- Goals and context: minimum time at the airport; travels light; uses a phone between meetings; values certainty.
- Top tasks: flight status and gate; leave-by time; parking price and pre-booking; Fast Track; lounge.
- Pain points: flight search departures-only and terminal-first [direct, Task 1]; Fast Track on another domain with no
  price seen [direct]; parking prices absent and conflicting [direct; search, V2].
- Success: follows a flight from the home screen in two interactions; books parking with the price shown first.
- Accessibility needs: one-handed use; a board legible in bright light; no taps lost during load.

**P2 First-time international visitor (arriving at KLIA).**
- Goals and context: reach the city safely at a fair price; new to Malaysia; English may be a second language.
- Top tasks: entry requirements (Malaysia Digital Arrival Card); which terminal; official transport and fares; SIM,
  money, prayer rooms.
- Pain points: touting at the transport decision [search, V6]; fares that change on 1 January 2027 [search, FT];
  immigration outages [search, V5]; an English-only site [direct].
- Success: knows before landing what to submit and where to go; reaches an official option with a dated fare.
- Accessibility needs: plain language; low data use; icons with words; further languages in phase 2.

**P3 Family with an infant.**
- Goals and context: avoid waiting with a tired child; travelling with a pram, milk and nappies.
- Top tasks: baby food and liquids rules; nursing rooms and play areas near the gate; family parking; food open now.
- Pain points: facility locations, levels and hours not captured from any source [search gap, Task 3]; two facilities
  pages per airport [direct].
- Success: the nearest nursing room on the correct side of security, or "Not published" with the official contact.
- Accessibility needs: step-free (pram-friendly) routes; large targets for use while carrying a child.

**P4 Wheelchair user.**
- Goals and context: arrange assistance once and trust it will be there; know which routes, lifts and toilets work.
- Top tasks: how and when to request assistance; accessible toilets and lifts; accessible parking; Aerotrain status to
  the Terminal 1 satellite.
- Pain points: a special-assistance page exists [direct] but among duplicate URLs; assistance is reportedly arranged
  through the airline with 48 hours' notice [prior, low, FK]; Aerotrain stoppages and night closures [search, V3].
- Success: one hub with request route, lead time and contacts; a step-free route on the map; an Aerotrain status line.
- Accessibility needs: WCAG 2.2 AA; step-free routing with button alternatives to every map gesture.

**P5 Older traveller (often accompanied by family).**
- Goals and context: reassurance; may prefer Bahasa Malaysia; may phone rather than browse.
- Top tasks: what time to arrive; where to check in; porter or buggy; a working phone number.
- Pain points: two general numbers in structured data [search, AUD §8]; porter and buggy services not found on the site
  [search negative]; taps unanswered during load (TBT up to 4.5 s) [direct, lab].
- Success: reads the answer at 125% text size in Malay; reaches a verified number in one tap.
- Accessibility needs: persistent text-size and contrast settings; no time limits; plain words.

**P6 Neurodivergent traveller, or a parent travelling with a neurodivergent child.**
- Goals and context: predictability; knowing what each stage looks and sounds like; a quiet place.
- Top tasks: what the Butterfly Effect offers and how to register; Calm Room locations and access; quieter routes.
- Pain points: the hidden-disability programme is filed under "Booking Services" at three URLs [direct]; registration is
  reportedly needed on each visit [search, low, FK]; no sensory map found.
- Success: a step-by-step visual guide; Calm Rooms located (Terminal 1 Level 5, Terminal 2 Level 3A [search, FK]); the
  scheme's limits stated honestly.
- Accessibility needs: reduced motion; no autoplay; predictable layout; literal language.

**P7 Self-transfer passenger between KLIA Terminal 1 and Terminal 2.**
- Goals and context: separate tickets, arriving at one terminal and leaving from the other; must not miss flight two.
- Top tasks: what the transfer involves; how long to allow; train or shuttle; where to re-check bags.
- Pain points: no airside link, so immigration, bags and re-check [search, FT]; shuttle every 10 or 15 minutes by page
  [AUD §8]; a seamless link announced for mid-2026 not confirmed as launched [search, V7]; duplicated pages [direct].
- Success: enters two flights or two times and gets ordered steps, an estimated buffer verdict and what to do if tight.
- Accessibility needs: works on roaming data and while walking; Aerotrain status where relevant.

**P8 Domestic commuter (Kuala Lumpur to Penang, Kuching or Kota Kinabalu; sometimes via Subang).**
- Goals and context: routine, often weekly trips; knows the airport; wants speed and early warning.
- Top tasks: flight status; parking and its daily cap; which airport (KLIA or Subang) and terminal; disruption.
- Pain points: Subang is absent from the site [direct] although airlines moved jets away in 2025 [search, FN §5];
  regional trees share KLIA template pages [direct]; Sabah and Sarawak entry checks [prior; confirm before publishing].
- Success: saved flight and parked-car note on the home screen; airport changed in one tap.
- Accessibility needs: fast repeat use; keyboard shortcuts on desktop; low data.

**P9 Someone meeting a passenger.**
- Goals and context: arrive when the traveller exits, not when the aircraft lands; park briefly or pick up legally.
- Top tasks: arrival status and baggage; where to wait; short-stay parking price; pick-up points.
- Pain points: arrivals and the other terminal need separate pages [direct]; the 18 April 2026 baggage failure caused
  two to four hour waits [search, V4]; pick-up points and entry fees changed in 2026 [search, FT].
- Success: a shared link to the traveller's flight with an "I'm meeting someone" view and a labelled exit estimate.
- Accessibility needs: large status words for a quick check before setting off; nothing that invites use while driving.

**Corporate audiences (`/corporate/**`).**

| Persona | Goals and context | Top tasks | Pain points (evidence) | Success | Accessibility needs |
|---|---|---|---|---|---|
| P10 Airline partner (network planner, station manager) | Assess routes and incentives; operates at several airports | Airport profiles with facilities and traffic; route-development contact; airline and terminal directory | No airline-to-terminal directory [search negative]; incentive programmes not found [gap, FC] | One profile per airport with dated traffic and a named contact | Tables usable by screen reader; downloadable data |
| P11 Tenant or supplier | Find tenders, register as a vendor, lease space | Procurement steps; vendor registration; leasing and advertising contacts | A separate VMS and a third-party tender portal; older notices name another host [search, AUD]; leasing contacts not found [gap] | One procurement page explaining each portal and step, with dates | Plain process steps; HTML before PDF |
| P12 Investor, lender or journalist | Understand ownership, performance and news after delisting | Ownership and governance; traffic releases; media contacts; reports archive | No ownership page located; management page duplicated with different content [search, AUD] | One canonical source for leadership, ownership and dated traffic | Dated, citable pages; accessible charts |
| P13 Job seeker | Find and apply for roles; understand programmes | Vacancies; programmes; working at each airport | Careers on a separate host; programmes not researched [search, gap] | A clear hand-off to the careers portal with context on roles | Bilingual content; accessible hand-off |

## 4. Prioritised journeys

### 4.1 The top 15 passenger tasks

Frequency and criticality are expert estimates [assessment] until MAHB supplies analytics and contact reasons (Q4,
Q5). Criticality is high where failure can cause a missed flight, financial loss or harm to wellbeing. An interaction
is a tap, click or submitted entry (typing a query and choosing a suggestion counts as one), counted at 360 px from the
network home with nothing saved. Current friction is the audit's minimum path where one exists.

| # | Task | Personas | Frequency | Criticality | Current friction (evidence) | Target interactions |
|---|---|---|---|---|---|---|
| 1 | Check a flight's status, terminal and gate (departure or arrival) | P1 P2 P8 P9 | Very high | High | Departures-only widget preset to Terminal 1; arrivals and Terminal 2 elsewhere; "Loading..." when the API fails [direct, Task 1] | 2 |
| 2 | Find which KLIA terminal an airline uses | P2 P8 P9 | High | High | No airline-to-terminal directory found [search negative, AUD §8] | 1 |
| 3 | Plan the trip to the airport and when to leave | P1 P3 P5 P8 | High | High | Modes on separate tabs; no leave-by guidance seen [search; hypothesis] | 3 |
| 4 | Get from KLIA to the city on an official option | P2 P5 | High | High | Rail fares not in indexed text; page errored under the block; touting at the decision [search, direct, V6] | 2 |
| 5 | Find the parking price for a stay, then pre-book | P1 P8 P9 | High | High | No rate table; conflicting rates; RM2,084 and RM384 bills reported [direct; search, V1, V2] | 3 to a price; 5 to the booking hand-off |
| 6 | Meet an arriving passenger: when to arrive, where to wait and pick up | P9 | High | Medium | Arrivals separate; no baggage status layer [direct; search, V4] | 3 |
| 7 | Find a facility near me (prayer room, toilet, nursing room) | P2 P3 P5 P6 | High | Medium | Two facilities pages; levels and hours not captured; app map has no search [direct; search, Task 3, V8] | 2 |
| 8 | See disruption or service status (Aerotrain, baggage, immigration) | All | Medium, spiking | High | No status layer seen; a 2021 Aerotrain item still surfaces in search [direct, search, finding 8] | 0 when active; 1 otherwise |
| 9 | Change terminals at KLIA on a self-transfer | P7 | Medium | High | Duplicate pages; conflicting shuttle frequency; seamless link unconfirmed [direct, search, V7] | 3 |
| 10 | Arrange or understand special assistance | P4 P5 P6 | Medium | High | Hidden-disability programme under "Booking Services" at three URLs [direct] | 2 |
| 11 | Check entry requirements before landing | P2 P7 | Medium | High | Rules sit with Immigration; autogate list not found [search, FT] | 2, then hand-off |
| 12 | Check what can be carried (liquids, restricted items) | P2 P3 P5 | Medium | Medium | Same rules duplicated under six trees [direct] | 2 |
| 13 | Find food or shops (halal, open now, before or after security) | P1 P2 P3 | Medium | Low | Homepage leads with promotions; outlet directories unread under the block [direct, FS] | 2 |
| 14 | Report lost property or contact help | P5 P9 | Low | Medium | Page errored under the block; contacts only from third parties; two general numbers [direct, search, Task 5] | 2 |
| 15 | Book Fast Track, a lounge or a rest facility | P1 | Low to medium | Low | Fast Track on a separate domain; no price seen [direct] | 3 to the partner hand-off |

### 4.2 Critical journeys in the new product

These describe the intended product. In the concept prototype, flights, gates, belts and notifications come from the
demonstration provider and carry the "Demonstration data" label; maps are schematic and say so [BS §6, §7].

**Departing (P1, KLIA).**
1. The network home opens with no airport assumed and the journey mode set to Departing. One search field accepts a
   flight number, airline, city or facility.
2. A flight number returns an inline card: status (icon, shape and word), terminal, scheduled and estimated time and
   "Updated hh:mm". The terminal is resolved for the passenger, never asked for first.
3. The flight page is a timeline (leave by, check-in, security, gate, boarding), each step tagged with provenance;
   airline rules are linked, not restated. "Save this flight" keeps it on the device and on the home screen;
   notifications are opt-in (demonstration notifications in the prototype). "How will you get there?" opens transport.
4. If flight data fails, the page says so, shows last-known values with their time and links to the airline; all static
   guidance still renders.

**Arriving (P2, first visit to KLIA).**
1. Before travel, Arriving mode reorders the home: arrivals board, entry checklist, transport into the city.
2. The checklist states the Malaysia Digital Arrival Card rule (submit within three days before arrival, free on the
   official Immigration portal) with source and date [search, FT], and links to Immigration for autogate eligibility
   rather than publishing a list we do not have.
3. On landing, the flight page shows the belt (demo in the prototype) and any active notice, for example a baggage
   incident with instructions and a contact route.
4. At the transport decision, the page states that official taxis are booked at counters and e-hailing at signed
   pick-up points, with the scam-alert guidance beside them.

**Transiting (P7, self-transfer from Terminal 1 to Terminal 2).**
1. Transiting mode opens the transfer planner: two flights, or two terminals and times, and whether bags are checked
   through.
2. For a self-transfer it lists the steps: immigration, baggage reclaim, landside move, check-in again, security and
   emigration. The train (RM2 adult [search, medium, FT]) and the free shuttle are shown with sources; where sources
   disagree (every 10 or 15 minutes) it says so.
3. The buffer verdict is built from labelled estimates and never invents a missing number: the rail time between
   terminals is unverified and is not shown as a figure [FT].
4. It states that a seamless inter-terminal link was announced for mid-2026 and is not confirmed as launched, and tells
   the passenger to check with the airline [search, FT]. If the connection is tight, it says to contact the departing
   airline first, then the information counters.

**Meeting (P9, collecting a family member).**
1. Meeting mode switches the board to arrivals and renames actions: "Track an arrival", "Where to wait", "Pick-up and
   parking".
2. The traveller shares their flight link; the greeter's view shows landed, baggage on belt and an estimated exit
   window, each labelled.
3. Short-stay parking comes from the calculator; pick-up points and the e-hailing entry fee carry their dates [search,
   FT]. Active disruption notices appear on the flight page itself.

**Accessibility (P4 and P6).**
1. "Assistance" is in the header and Help on every page and leads to one hub organised by need (mobility, hidden
   disability, sight, hearing, older travellers, families) and by journey stage.
2. Mobility: how and when to request assistance, official only when confirmed, otherwise "arrange through your
   airline" with its source. Hidden disability: the Butterfly Effect, Calm Rooms and the scheme's limits [search, FK].
3. The schematic map offers step-free routes, lifts, accessible toilets and quiet rooms, with list and button
   alternatives for every map action [BS §9]. Text size, contrast and motion settings persist; an accessibility
   statement gives the audit date and a contact for reporting barriers.

**Parking (P8, four days at KLIA).**
1. The page leads with each product's daily cap and how the products differ, then hourly bands; every rate carries its
   source and date, and conflicting figures are shown as conflicts [search, FT].
2. The calculator returns a total per product for the entry and exit times, from the same rate data.
3. Choosing Preferred Parking for a long stay triggers a plain warning and the long-term alternative (V1).
4. "Book" hands off to the official booking tool, with dates carried over where a partner agreement allows; in the
   prototype it links to the official page. A parked-car note (block, level, bay) returns on the home screen.

**Ground transport (P2, KLIA to the city).**
1. The planner takes a destination and shows rail, bus, taxi, e-hailing and car hire side by side: time (estimated),
   fare (official, dated), hours, boarding point, payment and step-free access.
2. Fares switch on their validity dates (KLIA Ekspres adult RM55 until 31 December 2026, RM65 from 1 January 2027
   [search, FT]); where sources conflict (first and last train), it points to the operator.

**Shop and dine (P3, airside at Terminal 1).**
1. From the flight page, "Before you board" lists outlets in the same terminal and zone, filtered by halal, open now
   (from published hours, labelled estimated) and before or after security.
2. Outlet pages show only confirmed facts; unknown fields read "Not published" [BS §6]. Offers appear after the answer,
   labelled, and only where a partner agreement exists (section 8).

## 5. Competitive differentiation

Lighthouse figures are independent lab measurements; feature judgements are expert assessments at the level shown.

| Benchmark | Our evidence | What it does best (to beat) | Lab weight / accessibility [direct, lab, LH] |
|---|---|---|---|
| Singapore Changi | Search only | Saved flights and FlightSaver, iShopChangi, invisible-disability content | 21.0 MB / 74 |
| Dubai DXB | Search only | Pocket Flights (no app), Smart Gates precheck, "DXB for All" | 4.4 MB / 100 |
| Hamad Doha | Direct | Flight page as a journey timeline with live queue status | 11.6 MB / 82 (earlier run; later runs failed) |
| Tokyo Haneda | Direct | Flight "Sample Plan"; timestamped congestion panel | 13.2 MB / 80 |
| London Heathrow | Direct and search | Connections planner, wait times, Hallie assistant, one account | 1.8 MB / 92 |
| Hong Kong | Direct | Board depth with map links; login-free bookmark; one search box | 2.3 MB / 68 |
| Munich | Direct | Login-free track strip; flight-intent site search | 4.6 MB / 47 |
| Amsterdam Schiphol | Search only (bot challenge) | Bookable security slots; per-flight URLs; public Flight API | not measured |
| MAHB today | Direct | | 32.7 MB / 79 |

The pattern [assessment]: best features app-only or login-gated (Changi, Haneda, HKIA, Heathrow, Schiphol); estates
split across hosts; content drifting between pages and languages (Changi, Heathrow, Schiphol); accessibility statements
rare (only Munich's was found). All are single hubs or two-airport city systems. MAHB wins by doing what they
structurally cannot and refusing their common failures.

1. **One airport model for the whole network, STOLports included.** All 39 airports in one registry and URL scheme,
   KLIA as one airport with a terminal filter, depth tiers that are honest about what a listing holds. Beats every
   benchmark structurally, since none runs a network (BM-changi, idea 6); rural Sabah and Sarawak services included.
2. **Provenance on every piece of guidance.** Each item is tagged official, estimated, suggestion or demo, with source
   and retrieval date [BS §1]. Beats Changi (S$10 against S$50 for one benefit across languages), Heathrow (a 2024
   notice live in 2026) and Schiphol (superseded prices) [BM files]; MAHB's parking controversy (V2) was the same
   failure.
3. **Honest live and demo separation, with freshness and failure states.** "Updated hh:mm" on every live list,
   last-known values when a feed fails, airport-local time and a labelled demo mode. Beats Hamad (no timestamp; "today"
   from the visitor's clock), Heathrow (client-only data failing to an error) and MAHB today (blank pages) [BM-hamad,
   BM-heathrow, FO]; matches HKIA's timestamp and extends it to failure states.
4. **A mode-aware first screen.** Departing, arriving, transiting and meeting reorder the board, actions and guidance
   everywhere [BS §8]. Beats Heathrow, which offers a passenger or collector split only inside flight details, and
   Hamad's fixed quick links [BM-heathrow, BM-hamad]. Why: the greeter and the transfer passenger are served from the
   first tap.
5. **A self-transfer planner for the Terminal 1 to Terminal 2 gap.** Steps, sourced facts, labelled estimates and a
   "what if it is tight" answer. Beats Heathrow, which tells self-connecting passengers its planner does not apply, and
   Dubai, which publishes procedural text only [BM-heathrow, BM-dubai]. Why: it is the network's most distinctive
   transfer risk (V7).
6. **The flight as a shareable, login-free page.** A permanent URL per flight with timeline, save, share, role views and
   web push without an app. Beats Changi, Haneda, HKIA and Heathrow (alerts behind an app or account) and Munich (a
   track strip without alerts) [BM files]; first-time visitors start on the mobile web.
7. **Price-first parking from one rate source.** Daily caps first, a calculator on the same data, a long-stay warning
   and dated rate changes. Beats Dubai's tariff page, the best seen, by adding calculation and warnings [BM-dubai]; fixes
   V1 and V2. Depends on MAHB's tariff data (Q2).
8. **Transport comparison with dated fares and anti-touting at the point of decision.** Beats Changi (mode-by-mode
   pages and hotlines) and Schiphol (hand-off to external planners) [BM-changi, BM-schiphol]. Why: it answers the
   visitor's highest-risk decision (V6) and handles the 1 January 2027 fare change automatically.
9. **Published weight budgets, and a site that works without JavaScript.** Static guidance is server-rendered and
   readable with scripts off; a service worker caches the shell and guidance [BS §3, §8]; budgets in section 7. Beats
   every measured benchmark on weight, from Heathrow's 1.8 MB (lightest valid run) to Changi's 21.0 MB and Hamad's
   87.8 MB hero video [direct, lab, LH, BM-hamad], for airport Wi-Fi, roaming and mid-range phones.
10. **Bilingual from day one, with parity enforced in code.** English and Bahasa Malaysia for every interface string, a
    visible notice where Malay content falls back to English, and one structured fact shared by both languages so they
    cannot drift [BS §8]. Matches Dubai, Munich and Schiphol on count, beats them on drift control, and beats MAHB today
    (English only [direct]). Next: human-reviewed core journeys in the main inbound languages (Q9).
11. **A concierge that cites sources and works without AI.** Answers only from the content layer and flight provider,
    with provenance, escalation to official contacts and a deterministic retrieval mode; an optional model may rephrase
    a grounded answer and never receives personal data [BS §8]. Beats Heathrow's Hallie (English-configured, some pages
    only, vendor-reported resolution) and Dubai's DXBChat (vendor-documented only) [BM-heathrow, BM-dubai].
12. **Accessibility as a product layer and a release gate.** WCAG 2.2 AA as the floor, the assistance hub at the top
    level, step-free and sensory routes in the map, persisted preferences and a dated statement. Beats Munich (lab 47),
    HKIA (68) and Changi (74; PDF sensory map; no statement found) on measured basics; beating Dubai (lab 100 and a
    strong programme) requires map-level routing and a published conformance statement [direct, lab; search].

Not competed on yet: loyalty and payment wallets (Changi, Heathrow), lock-screen app surfaces and bookable security
slots (Schiphol), and live queue times (Hamad, Heathrow). Each needs MAHB data, partners or an app strategy (Q1, Q10,
Q16).

## 6. Product principles

| # | Principle | Test (pass condition) |
|---|---|---|
| 1 | Answer first: the top task of each page is answered or actionable in the first screen. | For each of the 15 tasks, the answer or its control is visible without scrolling at 360 by 800 and 1280 by 720. |
| 2 | Never present simulated data as live. | End-to-end tests find the demo label on every flight row, card, concierge answer and notification in demo mode: zero exceptions. |
| 3 | Every fact has a source and a date. | A build-time content test fails on any item without a source id and retrieval date: 100% coverage. |
| 4 | Say what we do not know. | Fixtures with missing hours, prices or locations render "Not published" and the official channel; no empty cells. |
| 5 | No airport assumed; changing it takes one tap. | First visit has no airport selected; from any airport page, switching is one interaction plus the choice. |
| 6 | One topic, one address. | A crawl finds no duplicate `h1` or title within an airport, one canonical URL per topic and redirects for legacy paths. |
| 7 | Useful when scripts or data fail. | With JavaScript off, guidance, transport, parking and contacts render in full; with `/api/flights` failing, flight surfaces show an unavailable state and a retry. |
| 8 | Accessible by construction. | Zero axe violations on every route in light, dark and high contrast; keyboard-only completion of the eight journeys in 4.2; 44 px targets on phones. |
| 9 | Light by default. | Weight and JavaScript budgets (section 7) enforced in CI; zero third-party requests at runtime. |
| 10 | Commerce serves the journey. | No promotion above the primary answer on task pages; at most one labelled contextual offer per flight page, only from a partner with an agreement. |

## 7. Success metrics

No baselines exist here: MAHB's analytics, contact and commercial data were unavailable. "Set after baseline" targets
are fixed three months after launch. Measurement needs first-party, aggregate, consent-aware analytics; the prototype
has none [BS §2], and the tool is a privacy decision for MAHB under Malaysian data-protection law [prior] (Q15).

**North-star metric: answered journey rate.** The share of sessions that start one of the 15 top tasks and reach that
task's answer state (a flight page viewed, a parking total calculated, a transport option opened, a facility located, a
transfer plan produced). Target: at least 80% twelve months after launch, recalibrated after baseline [assessment].
Guardrails are content accuracy and contact volume, so the metric cannot be met by answering wrongly or by pushing
visitors to call.

| Area | Metric | Target | How measured | Baseline needed from MAHB |
|---|---|---|---|---|
| Task success | Unaided completion, top 8 tasks | At least 90% per task; at least 80% among P2, P4, P5 and P6 participants | Moderated usability studies before launch and every six months, both languages, including assistive-technology users | Current-site completion on the same tasks |
| Time on task | Median: flight status; parking price; T1 to T2 plan; nearest prayer room | 30 s; 60 s; 2 min; 45 s [assessment] | Same studies | Same tasks on the current site |
| Core Web Vitals | LCP, INP, CLS at the 75th percentile, mobile, field | LCP 2.5 s or less; INP 200 ms or less; CLS 0.1 or less. These are the "good" thresholds [prior]; the brief's own figures were not in the project files, so they are the floor | Field data once live; lab Lighthouse in CI meanwhile | Chrome UX Report history for the current hosts |
| Page weight | First mobile load, transferred | Homes 1,000 KB or less (JavaScript 250 KB, fonts 150 KB, images 300 KB compressed); guidance pages 500 KB or less; 40 requests or fewer [assessment, to verify in QA] | Lighthouse and a CI budget check | Lab: 32.7 to 34.3 MB, 171 requests [direct, lab] |
| Accessibility | Automated and manual conformance | Zero axe violations on all routes and themes; no open WCAG 2.2 AA failures at launch; dated statement | axe in Playwright on every build; independent manual audit; testing with disabled users | Lab: axe 6 rules on 27 elements; Lighthouse 79 [direct, lab] |
| Search | Zero-result rate; flight-number and synonym recognition | Under 5% zero results for the top 200 queries; flight numbers and "klia2" resolved first time | Aggregated first-party search logs (queries only, no identifiers) | Search Console queries; no site-wide search today [direct] |
| Content accuracy | Items sourced and dated; items past review date; page, calculator and barrier discrepancies | 100%; under 2%; zero | Content tests; monthly audit; tariff reconciliation | Tariff tables; complaint logs on rates (V2) |
| Commercial | Parking pre-booking share; ancillary hand-off rate from flight pages; Fast Track and lounge attach | Set after baseline | Partner-confirmed bookings with a referral code (no personal data passed) | Parking transactions by channel; Fast Track sales by channel |
| Operational deflection | Contacts per 100,000 passengers on covered topics (parking rates, transport, flight status, lost property, assistance) | Set after baseline; hypothesis: a measurable fall within 12 months | Contact-reason coding before and after, by topic | Contact volumes by reason and channel, 12 months |
| Reliability | Static-page availability; freshness shown on live data | 99.95% monthly; every live list stamped | Synthetic monitoring; freshness checks | Uptime and incident history; API rate-limit policy (FO) |

Satisfaction uses a post-task question, not internal figures: the reported 98.8% and 99.4% (Terminals 1 and 2,
September 2026) have no stated method [search, low, FC], and ACI ASQ surveys departing passengers only [prior].

## 8. Commercial model and ancillary revenue

What exists today [direct unless marked]: a parking booking form on the KLIA Terminal 1 parking page; Fast Track sold
on `myairportfasttrack.com`; a DaySleeper promotion (6 hours for MYR135, seen on 16 November 2026); retail promotions as
homepage editorial; Eraman duty-free malls at both terminals [search, FS]; ShopLAH [search]; a duty-free concession
review [search]. No single basket, account or contextual offer was evidenced [hypothesis].

Each item below is an opportunity requiring an agreement with MAHB, a subsidiary or a third party, never stated as an
existing capability; the prototype only links to official channels.

| Opportunity | Passenger value | Where it appears | Agreement and data needed | Revenue logic [assessment] | Main risk |
|---|---|---|---|---|---|
| Parking pre-booking | A guaranteed price and space; no bill shock | Parking page; departing flight page; My journey | MAHB car-park operation: tariff feed and booking API, or a deep link with dates | Shifts drive-up to pre-booked; reduces leakage to e-hailing | Site price differing from the barrier (V2) |
| Fast Track | Predictable security time | Departing flight page, after the timeline | Operator of `myairportfasttrack.com` (identity and terms to confirm, Q3) | Referral or merchant-of-record share | Selling speed while queues are not shown |
| Lounges and rest | A place to wait or sleep on long connections | Flight page when the gap is long; transfer planner | Lounge and rest operators | Affiliate commission | Recommending a lounge on the wrong side of security |
| Reserve-and-collect | Buy before travel; collect at departure or on return | Departing and arriving modes; shop pages | Malaysia Airports (Niaga) (Eraman) e-commerce; duty-free pre-order rules [prior] | Extends retail beyond dwell time (Changi's model [search, BM-changi]) | Outcome of the concession review |
| Ground transport tickets | One step from plan to ticket | Transport planner | Rail and coach operators | Affiliate commission | Fares out of sync on 1 Jan 2027 |
| Hotel and day rooms | Rest near the terminal | Transfer planner; delay notices | K.L. Airport Hotel (Sama-Sama) [search, FC] and other providers | Direct booking share | Over-promotion during disruption |
| Advertising and sponsorship | Relevant offers without tracking | Labelled slots on shop and dine and airport home, never above a task answer | MAHB media sales; first-party placements only, no third-party ad technology | Contextual inventory on a high-intent audience | Budgets and principle 10 broken |
| Meet-and-greet, porter, buggy | Help for P4, P5 and families | Assistance hub; arriving mode | Providers, if MAHB or concessionaires offer them (not found on the site [search negative]) | Fee or commission | Advertising services that do not exist |

Phasing [assessment]: first, contextual deep links that carry the flight and dates but no personal data, with referral
codes for attribution; second, a single checkout with partners as merchants of record; third, an optional account and
loyalty, only if research shows passengers want them. Throughout: prices include mandatory fees, offers are labelled,
nothing is pre-selected, and no personal data is sold or shared for advertising.

## 9. Risks and open questions

| Risk | Likelihood / impact [assessment] | Mitigation |
|---|---|---|
| No access to MAHB operational data (flights, belts, Aerotrain status, queues) | High / high | Provider interface with demo and official implementations [BS §7]; status layer starts with planned events |
| Published facts go stale (fares, rates, pick-up points) | High / high | Validity and review dates on facts; a named owner per content domain; automated expiry warnings |
| The API layer blocks real visitors on shared addresses, as it blocked this project | Medium / high | Server-rendered fallbacks; rate limits tuned with MAHB logs (FO, hypothesis) |
| Accessibility claims drift from the code | Medium / high | axe in every build; dated statement; annual manual audit |
| The concierge gives a wrong answer | Medium / high | Grounded retrieval only; citations; deterministic mode; escalation; no personal data to the model |
| Partner fragmentation keeps checkout on other domains | High / medium | Phased commercial model; contextual deep links first |
| Promotional pressure breaks budgets | Medium / medium | Budgets in CI; principle 10; poster images, no video heroes |
| Low-confidence STOLport data published as fact | Medium / medium | Listing tier with caveats until an official register is supplied |
| Malay translation quality and parity | Medium / medium | Typed dictionaries; parity tests; native review of core journeys |
| The concept is mistaken for an official MAHB property | Low / high | "Not an official MAHB property" on the transparency page and in metadata; no official marks without approval |

**Open questions for MAHB.**

- **Q1 Flight data.** Can the platform use the passenger flight API, on what terms, rate limits and refresh interval?
- **Q2 Parking.** Who owns the tariff tables, and can page, calculator and barrier use one source?
- **Q3 Fast Track.** Who operates `myairportfasttrack.com`, and on what terms could it be offered in context?
- **Q4 Contact centre.** Volumes by reason and channel for the last 12 months.
- **Q5 Analytics.** Current traffic, top pages, search queries and device mix; Chrome UX Report access.
- **Q6 Inter-terminal link.** Has the seamless Terminal 1 to Terminal 2 link launched; what are the official times?
- **Q7 Network register.** An official list of the 39 airports with names, codes and classification.
- **Q8 Assistance.** The reduced-mobility request process and lead time; is Butterfly registration needed each visit?
- **Q9 Languages.** Priorities beyond English and Bahasa Malaysia, and who reviews translations.
- **Q10 App.** The future of MYairports, and whether the web should be the primary channel.
- **Q11 Corporate disclosure.** What ownership, governance and financial information will be published after delisting?
- **Q12 Research access.** Can we recruit passengers, including disabled travellers, at KLIA and a regional airport?
- **Q13 Brand.** May the platform use MAHB marks, and does the proposition fit the brand architecture?
- **Q14 Duty free.** The timetable and scope of the concession review, and its effect on reserve-and-collect.
- **Q15 Privacy.** The policy for analytics, notifications and messaging channels.
- **Q16 Operations data.** Will Immigration or MAHB share queue data, and can the Aerotrain and shuttle publish status?

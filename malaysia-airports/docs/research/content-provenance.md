# Content provenance: what is published, what was withheld and why

Written 17 November 2026 by the content lead, for the product team. It covers the six airport
content files in `src/content/airports/` (KUL, PEN, BKI, KCH, LGK, SZB).

## How to read this

- **Evidence base.** Only the fact files in `docs/research/facts/` were used: `f-klia-t1.json`,
  `f-klia-transport.md`, `f-penang.json`, `f-kk.json`, `f-kuching.json`, `f-network.json` and
  `f-others.json`. Everything in them is a web search result of 16 or 17 November 2026 (`search`)
  or unconfirmed background knowledge (`prior`). Nothing was read first hand in this pass; the
  only first-hand facts in the content are the KLIA parking bays and features already captured
  on 16 November.
- **Publishing rule.** A fact is published only if its evidence is `search` and its confidence
  is high or medium. `prior` and low-confidence facts are never published as facts.
- **Considered** is every fact in the file. **Meets the rule** is the subset that may be
  published. **Published** is what the content file uses. **Left out although eligible** is split
  into facts the airport registry already carries, facts that are not passenger information
  (corporate, aeronautical, historical, site audit), past events, and a few judgement calls
  listed below. **Withheld by rule** is everything `prior` or low confidence.
- **Provenance tags.** `official`: the airport, an airline or operator about itself, the
  government, or such a statement reported by the press. `estimated`: guides, directories and
  listings only. `suggestion`: the gaps note, which is our own advice.
- **Gaps note.** The content model has no gaps field, so each airport has a guide note with the
  id `<code>-content-gaps` (topic `terminal`, provenance `suggestion`) that tells passengers what
  is not verified and points to the official channel.

## Summary

| Airport | Considered | Meets the rule | Published | Left out although eligible | Withheld by rule |
|---|---|---|---|---|---|
| KUL (`f-klia-t1.json`) | 110 | 86 | 60 | 26 (8 in registry, 15 not passenger information, 3 past) | 24 (7 prior, 17 low) |
| KUL (`f-klia-transport.md`, table rows) | 33 | 29 | 24 | 5 (see below) | 4 |
| PEN (`f-penang.json`) | 103 | 66 | 42 | 24 (5 in registry, 17 not passenger information, 2 judgement) | 37 (8 prior, 29 low) |
| BKI (`f-kk.json`) | 83 | 58 | 34 | 24 (4 in registry, 13 not passenger information, 2 past, 5 judgement) | 25 (8 prior, 17 low) |
| KCH (`f-kuching.json`) | 62 | 20 | 11 | 9 (4 in registry, 3 not passenger information, 2 judgement) | 42 (41 prior, 1 low) |
| LGK (`f-network.json`) | 4 | 3 | 2 | 1 (site URL pattern) | 1 (prior) |
| SZB (`f-network.json`, `f-others.json`) | 13 | 10 | 7 | 3 (not passenger information) | 3 (1 prior, 2 low) |

BKI also uses three eligible route facts from `f-others.json` (Miri, Mulu, Labuan), counted there.

### Published items by type

| Airport | Facilities (of which lounges) | Outlets | Transport options | Car parks (rates published) | Airlines | Notices | Guide notes | Maps | Own sources |
|---|---|---|---|---|---|---|---|---|---|
| KUL | 17 (5, plus 1 hotel) | 0 | 9 | 4 (0) | 16 | 2 | 17 | 1 | 19, plus the core registry |
| PEN | 3 (2) | 0 | 6 | 2 (1) | 5 | 1 | 5 | 0 | 23 |
| BKI | 2 (1) | 0 | 2 | 1 (0) | 4 | 1 | 6 | 0 | 20 |
| KCH | 0 | 0 | 0 | 0 | 2 | 1 | 2 | 0 | 2 |
| LGK | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| SZB | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 0 | 4 |

The source registry now holds 139 sources: 70 core (6 appended in this pass because two airports
share them) and 69 in the airport files. No outlet is published anywhere: the research confirms
no shop or restaurant name at any airport.

Added to KUL in this pass: 1 facility (Terminal 2 sensory walls), 6 transport options (KLIA
Ekspres, KLIA Transit, coupon taxi, e-hailing, inter-terminal train, inter-terminal shuttle) and
fares for the existing coach entry, 1 car park (Terminal 2) and rate notes on the other three, 1
notice (fare rise), 4 guide notes (MDAC, inter-terminal transfer, Preferred Parking warning, gaps)
and one fact added to the autogate note.

## How conflicts and dated fares are modelled

- **Car parks.** `rateStatus: 'published'` only where the operator's own figures are recorded:
  that is Penang Premium Parking alone (Malaysia Airports post of 9 October 2025). Every other
  car park is `not-verified` with `rates: []`, and its description quotes each set of figures
  with who gives it, so the page can say "sources differ: check the official page".
  KLIA Long Term Car Park carries `dailyMax: 32` (from 1 May 2026), its one firm figure.
- **KLIA Ekspres.** The fare model has no validity dates. The RM55 fare (until 31 December 2026)
  and the RM65 fare (from 1 January 2027) are two destination entries with the dates in their
  names, and the notice `kul-klia-ekspres-fare-rise-2027` expires at the change.
- **KLIA Transit.** Only the fares from 1 January 2027 are in the research, so no `fare` is set;
  the 2027 figures are in each stop's note.
- **Indicative fares.** KLIA coaches (from RM12; range RM12 to RM18) and KLIA coupon taxis (from
  RM70; guides quote RM70 to RM100) use `basis: 'from'` on `estimated` items whose notes say
  "indicative only". The research rates both "low to medium"; the brief asked for them to be
  shown as a range and as indicative.
- **Opening hours.** The Penang international lounge has three different sets of hours, so they
  are prose. Kota Kinabalu bus times are prose because they are probably times from the city
  terminus.

## Withheld items that matter to passengers: verify these first hand

### KUL (KLIA Terminal 1 and Terminal 2)

| Item | Reason withheld |
|---|---|
| Official parking rate cards for Terminal 1 Car Park, Preferred Parking, Long Term Car Park and Terminal 2 | Sources conflict or are partial. Figures are quoted as unverified; the calculator stays unavailable |
| KLIA Ekspres first and last trains | Low confidence: sources disagree (last train 00:00 or 01:00) |
| KLIA Ekspres frequency (about every 20 minutes) and child fare (RM25) | Medium confidence, but the research names no source for either |
| Train time between Terminal 1 and Terminal 2 | No source found ("about 3 minutes" is commonly quoted) |
| KLIA Transit fares before 2027 and timetable | Not in the research |
| Rail station level in each terminal | Prior knowledge only |
| Coach boarding bays in both terminals | Not in the research |
| Official coupon taxi fare table | Not captured; only guide estimates |
| Whether the seamless inter-terminal transfer has launched | Announced for mid-2026; no confirmation found. Published as "check with your airline" |
| Late-night gaps in the inter-terminal shuttle | Reported by Focus Malaysia; no link recorded |
| Preferred Parking daily cost ("can reach RM150 a day") | One unnamed report |
| Lost & Found location, phone (+603 8776 4312) and e-mail | Low confidence, one third-party guide |
| Malaysia Airlines mishandled baggage office phone | Low confidence |
| Wheelchair and reduced-mobility assistance (arrange through the airline, 48 hours ahead) | Prior knowledge, low confidence |
| Wi-Fi network name and session limit | Low confidence |
| Food Garden food court and every other outlet | Low confidence; no outlet is confirmed |
| Autogate nationality lists | Low confidence, or not found |
| Full Terminal 1 airline list; VietJet and Air Arabia terminal | Low confidence |
| Terminal 2 facilities, levels and airlines other than AirAsia | Not in the research |
| Careline 03-8776 2000 | Could not be confirmed |

Left out although eligible: the F1 weekend car park warning (past), the vehicle access system at
the kerb (no link recorded, passenger effect unclear), Aerotrain engineering trivia and site
audit facts.

### PEN (Penang)

| Item | Reason withheld |
|---|---|
| Taxi fares (George Town RM38 to RM55, Batu Ferringhi RM55 to RM85, 50 per cent night surcharge) | Low confidence, conflicting guides |
| Grab fare estimates and the walking route to the pick-up zone | Low confidence |
| First and last buses (401E, 306), exact-fare rule, route 401 details, the airport bus stop | Low confidence or not captured |
| Exact bus fare from the airport to Komtar | Not captured; published as "from RM1.40" |
| Official rate card for standard parking | Known only from directories; older directories show RM3 an hour |
| Domestic lounge hours (05:00 to 23:00) and paid lounge passes | Low confidence |
| Prayer rooms, Wi-Fi, ATMs and money changers | Prior knowledge, low confidence |
| Terminal layout (arrivals level, single terminal) and opening hours | Prior knowledge or low confidence |
| Which telephone number answers passengers (+604-252 0252 in the AIP; +604-643 4411 in older directories) | AIP number published with a caveat; the older number is low confidence |
| Full airline and destination list, new routes in 2026 | Low confidence |
| Thai Airways and "several Chinese and Indonesian carriers" | Named by the source, but no airline record: see the note on designators below |
| Distance to George Town | Two figures for different reference points (16 km and 14 km): left out |

### BKI (Kota Kinabalu)

| Item | Reason withheld |
|---|---|
| Taxi coupon system and fares; any e-hailing pick-up point | Prior knowledge, low confidence; nothing on e-hailing |
| Bus frequency, operator name, fare floor and pass, the airport bus stop | Low confidence or not captured |
| Official parking rate board, bays, zones, opening hours, payment | Rates from directories only; the rest low confidence |
| Whether the Golden Lounge and Plaza Premium Lounge are open | Low confidence, sources conflict |
| Left luggage, information desk, level layout | Low confidence or prior knowledge |
| Shop and restaurant names | Only a generic statement that shops and cafeterias exist |
| Documents for children under 12; extending a stay; arrivals from Sarawak; foreign nationals on domestic flights | Low confidence or prior knowledge |
| Airport operator e-mail (masb_bki@...) | Eligible, but an operational address: the research advises against using it for passengers |
| Ten carriers named by the press (Batik Air, Air Busan, Jin Air, Jeju Air, T'way Air, HK Express, China Southern, Shanghai Airlines, Spring Airlines, Xiamen Airlines) and Chongqing Airlines | Named in the gaps note only: see the note on designators below |
| Domestic airlines to Kuala Lumpur | Prior knowledge |

Left out although eligible: the runway closure of 17 September 2026 (past) and the terminal
expansion, which had not started as of July 2026.

### KCH (Kuching)

Almost everything: 41 of 62 facts are prior knowledge.

| Item | Reason withheld |
|---|---|
| Sarawak immigration check on arrival, MyKad entry, 90-day visit, IMM.114 slip, foreign nationals | Prior knowledge only. The notice publishes only what the Immigration Department pages and Malaysia Airlines support |
| Taxis, e-hailing, buses, the absence of a rail link | Prior knowledge |
| Terminal layout and levels, lounges, facilities, visitor information centre, parking | Prior knowledge, mostly low confidence |
| Airlines and routes beyond AirAsia (Miri, Sibu) and AirBorneo (Mulu) | Prior knowledge. A Kuching to Bintulu route is sourced, but not the airline |
| Address of the official Kuching section on the passenger website | Not confirmed |

### LGK (Langkawi) and SZB (Subang)

Neither has a dedicated fact file. Langkawi publishes only its gaps note. Subang publishes
Firefly's routes to Kuala Terengganu and Alor Setar, the night curfew and a note to check which
Kuala Lumpur airport a flight uses. Withheld for Subang: the 2025 passenger count (low
confidence), the announced Batik Air service to Miri (low confidence), other airlines said to
use the airport, and capacity and slot figures (not passenger information). The research infers
the year 2025 for AirAsia's and Firefly's jet withdrawals from article context; the text
attributes both to The Edge.

## Things the product team should know

1. **Publisher-level sources.** `f-klia-transport.md` names some publishers without an article
   link. Seven KLIA sources and one Kota Kinabalu source therefore point at the publisher's site,
   and their titles say "exact link not recorded": `busonlineticket-airport-coach`,
   `klia2commy-inter-terminal-shuttle`, `rakyatpost-ltcp-rate-rise-2026`,
   `tripcom-klia-parking-guide`, `mahb-klia-parking-pages-indexed`, `kliainfo-parking-rates`,
   `kln-mdac-mission-page` and `parkingcommy-kkia-older-listing`. Replace them with article links.
2. **Airline designators.** An airline record needs an IATA designator, and the research gives
   none. Records were created only for airlines whose designator the repository already holds
   (AK, MH, CX, SQ, TR, BI, FY, MY). Other named carriers appear by name in the gaps notes.
   Foreign destinations (Shanghai, Chongqing) are described in words for the same reason.
3. **Airport contacts.** Airport-specific contacts belong in `Airport.contacts` in the registry,
   which this pass could not edit. Penang and Kota Kinabalu carry them as an `information`
   facility (`pen-airport-contact`, `bki-airport-contact`) until the registry is updated.
4. **Entry formalities.** The MDAC rule is the guide note `kul-mdac-before-arrival` (topic
   `landing`, international arrivals), sourced to a Malaysian mission page. Sabah and Sarawak
   document rules are notices plus `immigration` guide notes. The network guides and FAQs were
   not changed: the guides author may want to reuse these.
5. **Malay text** in these files is a draft, like the rest of the Malay copy, and needs review by
   a native-speaking editor.

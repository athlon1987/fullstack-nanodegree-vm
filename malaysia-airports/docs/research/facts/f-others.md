# Other MAHB domestic airports and STOLports: content brief (f-others)

Generated: 2026-11-16. Companion data file: `f-others.json` (116 facts, 12 gaps). Every statement below is built from a fact in that file; fact ids are shown in `[brackets]`.

Scope: MAHB-operated airports in Malaysia other than KUL, PEN, BKI, KCH, LGK and SZB, plus the STOLports and the MASwings-to-AirBorneo transition.

## Read this first: how reliable is this brief

- **No official page could be fetched.** `www.malaysiaairports.com.my`, `airports.malaysiaairports.com.my` and `corporate.malaysiaairports.com.my` all failed to resolve from the research container (outside the network allowlist), at the start and again at the end of the run. There are **zero "direct" facts**.
- **The shared web-search budget ran out after 16 searches.** Sandakan, Tawau airlines, Lahad Datu, the individual STOLports and AirBorneo's own route list were never searched.
- Evidence mix in the JSON: **80 "search" facts** (stated in a search result obtained in this run, URL cited) and **36 "prior" facts** (researcher background knowledge as of roughly early-to-mid 2026, not re-confirmed).
- Confidence: 24 high, 70 medium, 22 low.

Publishing rule for writers:

| Tag in this brief | Meaning | Can it go on the site? |
|---|---|---|
| search / high | Stated by official, government or multiple news sources | Yes, after a normal editorial check |
| search / medium | News single-source, Wikipedia, or consistent aggregator data | Yes for stable facts; re-check anything schedule-related |
| search / low | Aggregator-only or conflicting sources | No, verify first |
| prior | Not confirmed in this run | No, verify first (ICAO codes are low-risk but still need a check against AIP Malaysia) |

Airline and destination lists change monthly. Wherever possible the site should drive them from a live schedule feed, not from this brief.

---

## 1. Network and classification

- Malaysia Airports manages **39 airports in Malaysia: 5 international, 17 domestic and 17 STOLports** `[mahb-network-39-airports]` (search, medium).
- In 2018 the same 39 were described as 5 international, 16 domestic and 18 STOLports `[mahb-network-2018-breakdown]` (search, medium). The likely explanation, Mukah moving from STOLport to domestic airport, is an unconfirmed inference recorded in that fact's notes.
- The five international airports are KLIA, Penang, Kota Kinabalu, Kuching and Langkawi, so every airport in this brief is "domestic" or "STOLport" in MAHB's classification even when it has a few international flights `[mahb-five-international-airports]` (prior, medium). This matters for Melaka "International" Airport and for sites that call Miri "international" `[mkz-identity]` `[myy-identity]`.
- Senai (Johor Bahru) is a common destination from these airports but is not an MAHB airport `[senai-not-mahb]` (prior, medium). Do not link JHB to an MAHB airport page.

## 2. MASwings to AirBorneo (2026)

What is confirmed:

- **AirBorneo, owned by the Sarawak Government, took over MASwings' rural air services in Sabah, Sarawak and Labuan on 1 January 2026** `[airborneo-takeover-1-jan-2026]` (search, high).
- Malaysia Aviation Group completed the ownership transfer under a sale agreement signed with the Sarawak Government in February 2025 `[airborneo-ownership-transfer]` (search, medium).
- AirBorneo operates under AirBorneo Holdings Sdn Bhd and inherited eight ATR 72-500 aircraft `[airborneo-entity-and-inherited-fleet]` (search, medium).
- Flights carry the **MY** flight-number prefix, e.g. MY3631 Mulu-Miri `[airborneo-flight-number-prefix-my]` (search, medium).
- Flights to the Sabah and Sarawak STOLports are rural air services: MASwings to 31 December 2025, AirBorneo from 1 January 2026 `[stolport-air-services-operator]` (search, medium).

What was planned or is uncertain:

- MASwings branding was expected to stay on some aircraft and ground facilities for about six months after the handover `[airborneo-maswings-branding-period]` (search, medium). Completion of the rebrand is not verified.
- Regional jet services were planned for the second half of 2026, subject to a licence variation `[airborneo-jet-expansion-plan]` (search, medium). Whether jets are flying is not verified.
- First flights are reported as 2 January 2026, but another source says operations began 1 January `[airborneo-first-flights-2-jan-2026]` (search, low).
- A firm order for eight new ATRs (five ATR 72-600, three ATR 42-600) plus four purchase rights is reported `[airborneo-atr-order]` (search, low).

Copy guidance: write "AirBorneo (formerly MASwings)" on first mention on any Sabah, Sarawak or Labuan airport page until the rebrand is confirmed complete. Remove every remaining "MASwings" label from airline directories and route maps.

---

## 3. Airport profiles

Legend: (s) = search evidence, (p) = prior knowledge not re-confirmed. Distances are approximate.

### 3.1 Peninsular Malaysia

#### Kota Bharu: Sultan Ismail Petra Airport (KBR)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sultan Ismail Petra Airport, Kota Bharu, Kelantan (s, high) | `[kbr-identity]` |
| Codes | IATA KBR (s); ICAO WMKC (p) | `[kbr-identity]` `[kbr-icao]` |
| Distance | Roughly 8 to 9 km from town, at Pengkalan Chepa (p, low) | `[kbr-distance]` |
| Airlines | AirAsia, Batik Air, Firefly, Malaysia Airlines, Scoot (s, medium, aggregator) | `[kbr-airlines]` |
| Main route | Kuala Lumpur: AirAsia, Batik Air, Firefly, Malaysia Airlines; about 78 weekly departures (s, medium) | `[kbr-kuala-lumpur-route]` |
| International | Scoot to Singapore (s, high, MAHB release); AirAsia to Jakarta planned from June 2026, launch not verified (s, medium) | `[kbr-scoot-singapore]` `[kbr-airasia-jakarta-planned]` |
| Other domestic | AirAsia to Johor Bahru and Kota Kinabalu (s, low) | `[kbr-airasia-domestic]` |

The 2026 story for this airport is the completed expansion:

- Expanded terminal in full operation from **16 March 2026** `[kbr-expansion-full-operation]` (s, high); officially opened **18 April 2026** `[kbr-official-opening]` (s, medium; sources differ on who officiated).
- Capacity up from 1.5 million to **4 million passengers a year** `[kbr-expansion-capacity]` (s, high).
- Terminal tripled from 12,000 to 36,000 sq m; aircraft parking bays up from 5 to 11 `[kbr-expansion-terminal-size]` (s, medium).
- Cost RM440 million `[kbr-expansion-cost]` (s, medium). Phase one opened 1 May 2024 `[kbr-phase-one-2024]` (s, medium).
- More than half a million passengers in January to April 2026 `[kbr-passengers-jan-apr-2026]` (s, high, MAHB release).

Audit note for designers: search engines index the current KBR flight-information pages under KLIA Terminal 1 titles `[mahb-site-kbr-flight-pages-mislabelled]` (s, medium). The new site needs airport-specific titles and descriptions on every templated page.

#### Kuala Terengganu: Sultan Mahmud Airport (TGG)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sultan Mahmud Airport, Kuala Terengganu, Terengganu (s, high) | `[tgg-identity]` |
| Codes | IATA TGG; ICAO WMKN (s, high) | `[tgg-identity]` `[tgg-icao]` |
| Distance | About 8 km from Kuala Terengganu (s, medium) | `[tgg-distance]` |
| Airlines and routes | AirAsia, Firefly, Malaysia Airlines to Kuala Lumpur International; Firefly also to Subang (s, medium) | `[tgg-airlines]` |

#### Ipoh: Sultan Azlan Shah Airport (IPH)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sultan Azlan Shah Airport, Ipoh, Perak (s, high) | `[iph-identity]` |
| Codes | IATA IPH; ICAO WMKI (s, high) | `[iph-identity]` `[iph-icao]` |
| Distance | Roughly 5 to 6 km from the city centre (p, low) | `[iph-distance]` |
| International | Scoot to Singapore, the most frequent route (s, medium) | `[iph-scoot-singapore]` |
| Domestic | AirAsia to Johor Bahru (s, medium) | `[iph-airasia-johor-bahru]` |
| Conflict | AirAsia reportedly suspended Ipoh-Singapore in May 2025; one tracker still lists it (s, low) | `[iph-airasia-singapore-suspended]` |

#### Alor Setar: Sultan Abdul Halim Airport (AOR)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sultan Abdul Halim Airport, Kepala Batas, Alor Setar, Kedah; also the nearest airport for Perlis (s) | `[aor-identity]` `[aor-also-serves-perlis]` |
| Codes | IATA AOR (s); ICAO WMKA (p) | `[aor-identity]` `[aor-icao]` |
| Distance | About 8.5 km from the city centre (s, low, single third-party guide) | `[aor-distance]` |
| Airlines and routes | AirAsia and Malaysia Airlines to Kuala Lumpur International; Firefly to Subang; AirAsia to Johor Bahru (s, medium) | `[aor-airlines]` |
| International | None scheduled (s, medium) | `[aor-no-international-flights]` |

#### Melaka: Melaka International Airport (MKZ)

| Item | Content | Facts |
|---|---|---|
| Name and place | Melaka International Airport, Batu Berendam, Melaka; still widely listed as Batu Berendam Airport (s, medium) | `[mkz-identity]` |
| Codes | IATA MKZ (s); ICAO WMKM (p) | `[mkz-identity]` `[mkz-icao]` |
| Airlines | **Do not publish an airline list yet.** Scoot to Singapore is the only scheduled route reported in 2026 and sources conflict on whether it is operating (s, low) | `[mkz-scheduled-service-uncertain]` |

Design implication: the Melaka page must handle a "no scheduled flights at present" state gracefully.

#### Kuantan: Sultan Haji Ahmad Shah Airport (KUA)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sultan Haji Ahmad Shah Airport, Kuantan, Pahang (s, high) | `[kua-identity]` |
| Codes | IATA KUA; ICAO WMKD (s, high) | `[kua-identity]` `[kua-icao]` |
| Distance | About 15 km from Kuantan city (s, medium) | `[kua-distance]` |
| Domestic | Malaysia Airlines daily to Kuala Lumpur International, about 55 minutes (s, medium) | `[kua-malaysia-airlines-kul]` |
| International | Scoot to Singapore on Wednesday, Friday and Sunday (s, medium; schedule-dependent) | `[kua-scoot-singapore]` |

### 3.2 Sarawak

#### Miri Airport (MYY)

| Item | Content | Facts |
|---|---|---|
| Name and place | Miri Airport, Miri, northern Sarawak (s, high) | `[myy-identity]` |
| Codes | IATA MYY (s); ICAO WBGR (p) | `[myy-identity]` `[myy-icao]` |
| Distance | About 9.5 km south-east of the city centre; another guide says 11 km. Use "about 10 km" (s, medium) | `[myy-distance]` |
| Airlines | AirAsia, AirBorneo, Malaysia Airlines, Scoot (s, medium) | `[myy-airlines]` |
| Trunk routes | Kuala Lumpur (AirAsia, Malaysia Airlines); Kuching and Kota Kinabalu (AirAsia); Singapore (Scoot) (s, medium) | `[myy-trunk-destinations]` |
| Rural hub | AirBorneo to interior and regional points including Sibu, Lawas, Limbang, Labuan and Bario; 13 points per one guide (s, medium) | `[myy-airborneo-rural-hub]` |
| Upcoming | Batik Air Subang-Miri announced from 1 December 2026, unverified (s, low) | `[myy-batik-air-subang-planned]` |

Miri is the natural "hub page" for the Sarawak STOLports in section 4.

#### Sibu Airport (SBW)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sibu Airport, Sibu, central Sarawak (s, high) | `[sbw-identity]` |
| Codes | IATA SBW; ICAO WBGS (s, high) | `[sbw-identity]` `[sbw-icao]` |
| Distance | About 23 km from Sibu town (s, medium) | `[sbw-distance]` |
| Airlines and routes | AirAsia to Kuala Lumpur and Kuching; Malaysia Airlines and Batik Air to Kuala Lumpur; AirBorneo to Miri (s, medium). Scoot listed by one aggregator only | `[sbw-airlines]` |

#### Bintulu Airport (BTU)

| Item | Content | Facts |
|---|---|---|
| Name and place | Bintulu Airport, Bintulu, Sarawak (s, high) | `[btu-identity]` |
| Codes | IATA BTU; ICAO WBGB (s, high) | `[btu-identity]` `[btu-icao]` |
| Airlines | AirAsia, AirBorneo, Batik Air Malaysia, Malaysia Airlines (s, medium) | `[btu-airlines]` |
| Routes | Kuala Lumpur (busiest, about 33 weekly departures) and Kuching; also Miri, Sibu, Mukah and Kota Kinabalu (s, medium) | `[btu-destinations]` |

#### Mulu Airport (MZV)

| Item | Content | Facts |
|---|---|---|
| Name and place | Mulu Airport, Mulu, northern Sarawak (s, high); gateway to Gunung Mulu National Park (p, in notes) | `[mzv-identity]` |
| Codes | IATA MZV (s); ICAO WBMU (p) | `[mzv-identity]` `[mzv-icao]` |
| Airlines and routes | AirBorneo ATR 72 to Miri, Kuching and Kota Kinabalu (s, medium) | `[mzv-airborneo-routes]` |

#### Limbang Airport (LMN)

| Item | Content | Facts |
|---|---|---|
| Name and place | Limbang Airport, Limbang, northern Sarawak (s, high) | `[lmn-identity]` |
| Codes | IATA LMN; ICAO WBGJ (s, high) | `[lmn-identity]` `[lmn-icao]` |
| Airlines and routes | AirBorneo only; Miri non-stop in about 35 minutes (s, medium). Other listed routes unconfirmed | `[lmn-airborneo-miri]` |

#### Mukah Airport (MKM)

| Item | Content | Facts |
|---|---|---|
| Status | New airport opened 17 June 2021, replacing the old Mukah STOLport (s, high) | `[mkm-new-airport-2021]` |
| Operator | Malaysia Airports (s, medium) | `[mkm-operator]` |
| Codes | IATA MKM; ICAO WBGK (p) | `[mkm-codes]` |
| Routes | Twin Otter rural air services to Kuching, Miri, Sibu and Bintulu; route list dates from 2021, AirBorneo listed Bintulu-Mukah in 2026 (s, low) | `[mkm-routes]` |

### 3.3 Sabah and Labuan

#### Labuan Airport (LBU)

| Item | Content | Facts |
|---|---|---|
| Name and place | Labuan Airport, Federal Territory of Labuan (s, high) | `[lbu-identity]` |
| Codes | IATA LBU (s); ICAO WBKL (p) | `[lbu-identity]` `[lbu-icao]` |
| Airlines and routes | Malaysia Airlines to Kuala Lumpur; AirBorneo to Kota Kinabalu and Miri (s, medium). AirAsia uncertain | `[lbu-routes]` |

#### Sandakan Airport (SDK)

| Item | Content | Facts |
|---|---|---|
| Name and place | Sandakan Airport, Sandakan, east coast of Sabah (s, medium) | `[sdk-identity]` |
| Codes | IATA SDK; ICAO WBKS (p) | `[sdk-identity]` `[sdk-icao]` |
| Distance | Roughly 13 to 14 km from town (p, low) | `[sdk-distance]` |
| Airlines | Prior knowledge only: AirAsia and Malaysia Airlines to Kuala Lumpur and Kota Kinabalu; AirBorneo within Sabah (p, low). **Verify before publishing** | `[sdk-airlines]` |

#### Tawau Airport (TWU)

| Item | Content | Facts |
|---|---|---|
| Name and place | Tawau Airport, Tawau, south-east Sabah (s, medium) | `[twu-identity]` |
| Codes | IATA TWU; ICAO WBKW (p) | `[twu-identity]` `[twu-icao]` |
| Distance | Roughly 30 km from Tawau town (p, low) | `[twu-distance]` |
| Traffic | 1.96 million passengers in 2024, eighth busiest in Malaysia (s, medium) | `[twu-passengers-2024]` |
| Airlines | Prior knowledge only: AirAsia and Malaysia Airlines to Kuala Lumpur and Kota Kinabalu; AirBorneo within Sabah (p, low). **Verify before publishing** | `[twu-airlines]` |

Upgrade works (passengers will see construction until 2028):

- RM120.9 million design-and-build contract awarded August 2025 to Pembinaan Azam Jaya; completion expected by August 2028 `[twu-upgrade-contract]` (s, high).
- Scope: larger terminal, more spacious check-in and immigration areas, additional aerobridges, apron enhancements, separate international and domestic facilities `[twu-upgrade-scope]` (s, medium).
- Capacity from 1.5 million to 2.5 million passengers a year; terminal from 15,800 to 23,500 sq m `[twu-upgrade-capacity]` (s, medium; baseline capacity is quoted inconsistently).
- Works are phased so the airport stays open `[twu-upgrade-phased-works]` (s, medium).

This is an expansion of the existing terminal, not a new terminal.

#### Lahad Datu Airport (LDU)

Everything for Lahad Datu is prior knowledge and needs verification.

| Item | Content | Facts |
|---|---|---|
| Name and place | Lahad Datu Airport, Lahad Datu, east coast of Sabah (p, medium) | `[ldu-identity]` |
| Codes | IATA LDU; ICAO WBKD (p) | `[ldu-identity]` `[ldu-icao]` |
| Distance | On the edge of town, roughly 1 km from the centre (p, low) | `[ldu-distance]` |
| Airlines | AirBorneo (formerly MASwings) turboprops to Kota Kinabalu (p, low) | `[ldu-airlines]` |

---

## 4. STOLports

Operator of the airstrips: Malaysia Airports. Operator of the flights in Sabah and Sarawak: AirBorneo since 1 January 2026, MASwings before that `[stolport-air-services-operator]` (s, medium).

Only Bario and Lawas have search evidence of current AirBorneo service. Every other row is prior knowledge: names and IATA codes are stable, but service status must be confirmed with AirBorneo and MAHB before publication.

| STOLport | IATA | State | Air services | Evidence | Fact |
|---|---|---|---|---|---|
| Bario | BBN | Sarawak | AirBorneo from Miri | search, medium | `[bbn-bario]` |
| Lawas | LWY | Sarawak | AirBorneo from Miri | search, medium | `[lwy-lawas]` |
| Ba'kelalan | BKM | Sarawak | AirBorneo (formerly MASwings) network | prior, medium | `[bkm-bakelalan]` |
| Long Akah | LKH | Sarawak | AirBorneo (formerly MASwings) network | prior, medium | `[lkh-long-akah]` |
| Long Banga | LBP | Sarawak | AirBorneo (formerly MASwings) network | prior, low | `[lbp-long-banga]` |
| Long Lellang | LGL | Sarawak | AirBorneo (formerly MASwings) network | prior, medium | `[lgl-long-lellang]` |
| Long Seridan | ODN | Sarawak | AirBorneo (formerly MASwings) network | prior, medium | `[odn-long-seridan]` |
| Marudi | MUR | Sarawak | AirBorneo (formerly MASwings) network | prior, medium | `[mur-marudi]` |
| Kapit | KPI | Sarawak | No scheduled flights in recent years | prior, low | `[kpi-kapit]` |
| Belaga | BLG | Sarawak | No scheduled flights in recent years | prior, low | `[blg-belaga]` |
| Long Semado | LSM | Sarawak | No scheduled flights in recent years | prior, low | `[lsm-long-semado]` |
| Kudat | KUD | Sabah | AirBorneo (formerly MASwings) network | prior, medium | `[kud-kudat]` |
| Long Pasia | GSA | Sabah | No scheduled flights in recent years | prior, low | `[gsa-long-pasia]` |
| Semporna | SMM | Sabah | No scheduled flights in recent years; fly to Tawau instead | prior, low | `[smm-semporna]` |
| Pangkor | PKG | Perak | Not on the AirBorneo network; 2026 airline unverified | prior, medium | `[pkg-pangkor]` |
| Redang | RDN | Terengganu | Not on the AirBorneo network; 2026 airline unverified | prior, medium | `[rdn-redang]` |
| Tioman | TOD | Pahang | Not on the AirBorneo network; 2026 airline unverified | prior, medium | `[tod-tioman]` |

Mukah is no longer a STOLport: its new airport replaced the old STOLport in 2021 `[mkm-new-airport-2021]`. Marudi, Tioman, Pangkor and Redang are treated as STOLports here on prior knowledge.

Design implication: STOLport pages should be short "airstrip cards" (name, code, state, nearest hub airport, airline link) rather than full airport microsites, and should support a "no scheduled flights" state.

---

## 5. Major works and changes, 2025 to 2026

| Airport | Change | Status | Facts |
|---|---|---|---|
| Kota Bharu (KBR) | RM440 million expansion, capacity 1.5 to 4 million | Complete: full operation 16 March 2026, opened 18 April 2026 | `[kbr-expansion-full-operation]` `[kbr-official-opening]` `[kbr-expansion-capacity]` `[kbr-expansion-cost]` |
| Kota Bharu (KBR) | New international routes | Scoot to Singapore operating; AirAsia to Jakarta planned June 2026, unverified | `[kbr-scoot-singapore]` `[kbr-airasia-jakarta-planned]` |
| Tawau (TWU) | RM120.9 million terminal upgrade, capacity 1.5 to 2.5 million | Under construction since late 2025; completion by August 2028 | `[twu-upgrade-contract]` `[twu-upgrade-scope]` `[twu-upgrade-capacity]` `[twu-upgrade-phased-works]` |
| Mukah (MKM) | New airport replaced the STOLport | Open since 17 June 2021 | `[mkm-new-airport-2021]` |
| Sabah, Sarawak, Labuan | MASwings replaced by AirBorneo | In effect since 1 January 2026 | `[airborneo-takeover-1-jan-2026]` |
| Miri (MYY) | Batik Air Subang-Miri | Announced for 1 December 2026, unverified | `[myy-batik-air-subang-planned]` |

---

## 6. Contact and ground transport

- The only contact detail found is the MAHB group line, **+60 3 8777 0000**, and info@malaysiaairports.com.my `[mahb-general-contact]` (s, medium). It is not airport-specific.
- No airport-specific telephone number was confirmed for any airport in this brief.
- No taxi, e-hailing, bus or car-rental information was verified for any airport in this brief.

Until these are supplied by MAHB, the new site should show the group contact line on these airport pages and omit ground-transport fares rather than estimate them.

---

## 7. Not verified / gaps

These items were looked for and could not be confirmed. None of them should appear on the site as fact.

1. **Access.** No official MAHB page could be fetched, and the shared search budget was exhausted after 16 searches. To close the gaps below, allow `www.malaysiaairports.com.my`, `airports.malaysiaairports.com.my` and `corporate.malaysiaairports.com.my` in the session network settings, or raise the search budget.
2. **Airport contact numbers.** None confirmed for KBR, TGG, IPH, AOR, MKZ, KUA, MYY, SBW, BTU, MZV, LMN, LBU, SDK, TWU, LDU or any STOLport.
3. **Ground transport.** No verified taxi fares, e-hailing availability, bus routes or car rental for any airport.
4. **Distances.** Not verified for Melaka, Bintulu, Mulu, Limbang and Labuan. Kota Bharu, Ipoh, Sandakan, Tawau and Lahad Datu figures are prior-knowledge approximations. Alor Setar rests on one third-party guide; Miri has conflicting figures.
5. **Airlines and destinations.** No list here comes from an airline or MAHB source. Sandakan, Tawau and Lahad Datu lists are prior knowledge only. Open conflicts:
   - AirAsia at Labuan
   - AirAsia on Ipoh-Singapore
   - Scoot at Sibu
   - Scoot's Melaka-Singapore route (reported suspended from 14 August 2026 by one guide, still on sale elsewhere)
   - Whether AirAsia's Kota Bharu-Jakarta and Bintulu-Kota Kinabalu routes (both planned for June 2026) launched
   - Whether Batik Air's Subang-Miri route (announced for 1 December 2026) is confirmed
6. **Classification.** No source itemises MAHB's 17 domestic airports and 17 STOLports. Hypothesis to confirm with MAHB: Mukah is now counted as a domestic airport, and Marudi, Tioman, Pangkor and Redang remain STOLports.
7. **AirBorneo in late 2026.** Not verified: rebrand completion, licence variation, jet services (one unconfirmed result claims a Kuching-Kuala Lumpur jet launch on 20 July 2026), the official route list, Twin Otter fleet size, and which STOLports have scheduled flights and how often.
8. **Peninsular STOLports.** Which airline, if any, flies to Pangkor, Redang and Tioman in 2026.
9. **ICAO codes.** KBR, AOR, MKZ, MYY, MZV, LBU, SDK, TWU, LDU, MKM and all STOLport ICAO codes are prior knowledge. Long Banga's ICAO code is omitted.
10. **Works.** Tawau construction progress in 2026; Kota Bharu runway works; the Ipoh "2025 upgrade"; Sandakan runway extension; any Miri, Sibu or Lahad Datu projects; the proposed new Lawas airport; the exact Kota Bharu January to April 2026 passenger figure.
11. **Namesakes.** The rulers after whom KBR, TGG, IPH, AOR and KUA are named appear only in fact notes, from prior knowledge.
12. **Tawau "new terminal".** Not supported: the project is an expansion of the existing terminal.

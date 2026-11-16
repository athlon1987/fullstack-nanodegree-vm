# MAHB airport network: inventory and classification brief

Generated: 2026-11-16. Companion to `f-network.json` (95 facts). Every statement below is built from a fact in that file; fact ids are in `backticks`.

## Read this first: how far to trust this brief

- **No direct evidence.** `www.malaysiaairports.com.my` and `airports.malaysiaairports.com.my` were blocked by the network allowlist at the start and at the end of the run. `caam.gov.my` was also unreachable. Nothing here was read from an official page first-hand.
- **Search budget ran out.** Only 11 web searches completed before the shared search budget was exhausted. Planned confirmation searches (CAAM licence list, Istanbul, privatisation, per-airport codes) could not be run.
- **Evidence mix:** 56 facts are `search` (stated in a search result obtained today, URL cited), 39 are `prior` (background knowledge, not re-confirmed today). Confidence: 10 high, 65 medium, 20 low.
- **What is solid:** the count (39), the split (5 / 17 / 17), the five international and 17 domestic airport names, the KLIA terminal names, the 2024 Operating Agreements dates, and that Senai is not a MAHB airport.
- **What is not solid:** IATA/ICAO codes for most airports (prior knowledge), the full list of 17 STOLports (assembled, not from one official list), the exact KLIA rename date, and everything about 2025-2026 ownership changes.
- **Rule for writers:** anything tagged `prior` or `low` must be checked against an official source before it is published.

## 1. The official count and classification

| Item | Publish this | Fact id | Evidence |
|---|---|---|---|
| Airports operated in Malaysia | 39 | `network-total-39` | search, high |
| Split | 5 international, 17 domestic, 17 STOLports | `network-split-5-17-17` | search, high |
| Portfolio including overseas | 40 (39 in Malaysia + Istanbul Sabiha Gokcen) | `network-plus-isg-40` | search, medium |
| National context | Malaysia has 42 commercial airports (6 international, 19 domestic, 17 STOLports); MAHB manages 39 | `network-national-42` | search, medium |

**Reconciling the conflicting counts.** Two splits are in circulation:

- **5 / 16 / 18** appears in Annual Report 2018 and on legacy corporate pages still indexed by search (`network-split-legacy-16-18`). It is superseded.
- **5 / 17 / 17** appears in Annual Report 2023 (published April 2024) and in coverage of the March 2024 Operating Agreements (`network-split-5-17-17`, `oa-2024-scope`). **This is the one used here**, as the most recent explicit official split found.

The difference is Mukah. The Mukah STOLport was replaced by the new Mukah Airport on 17 June 2021, and Annual Report 2023 lists Mukah as a domestic airport (`network-split-reconciliation-mukah`, `change-mukah-airport-2021`). The total stays 39. That Mukah is the sole cause is an inference from those two facts.

The 5 / 17 / 17 split is also consistent with the 2024 national totals: 42 minus 39 leaves one international and two domestic airports outside MAHB (`network-national-42`, `non-mahb-three-airports`).

The network was still described as 39 airports in the full-year 2025 traffic release (`network-count-unchanged-2024-2026`).

MAHB manages the airports through subsidiaries (`network-operating-subsidiaries`; subsidiary names are prior knowledge).

## 2. Airport inventory

Codes are shown as IATA/ICAO. "Site section" means a section on `airports.malaysiaairports.com.my`.

### 2.1 International airports (5)

List source: `network-international-list` (search, high). Classification and IATA codes are search-confirmed; ICAO codes and localities are prior knowledge.

| Airport | Codes | Town, state | Site section | Fact id |
|---|---|---|---|---|
| KL International Airport (KLIA) | KUL/WMKK | Sepang, Selangor | Yes, site root, "KUL - Terminal 1 & Terminal 2" | `airport-kul` |
| Penang International Airport | PEN/WMKP | Bayan Lepas, Penang | Yes, `/penang` | `airport-pen` |
| Langkawi International Airport | LGK/WMKL | Padang Matsirat, Langkawi, Kedah | Yes, `/en/langkawi` | `airport-lgk` |
| Kota Kinabalu International Airport | BKI/WBKK | Kota Kinabalu, Sabah | Yes, `/kota-kinabalu` | `airport-bki` |
| Kuching International Airport | KCH/WBGG | Kuching, Sarawak | Yes, in navigation (URL not surfaced) | `airport-kch` |

### 2.2 Domestic airports (17)

List source: `network-domestic-list` (search, medium; all 17 names from Annual Report 2023). Codes, full official names and localities are prior knowledge. No site section was found for any of these (absence not confirmed).

| Airport | Codes | Town, state | Fact id |
|---|---|---|---|
| Sultan Abdul Aziz Shah Airport (Subang Airport) | SZB/WMSA | Subang, Selangor | `airport-szb` |
| Sultan Abdul Halim Airport | AOR/WMKA | Alor Setar, Kedah | `airport-aor` |
| Sultan Azlan Shah Airport | IPH/WMKI | Ipoh, Perak | `airport-iph` |
| Sultan Ismail Petra Airport | KBR/WMKC | Kota Bharu, Kelantan | `airport-kbr` |
| Sultan Mahmud Airport | TGG/WMKN | Kuala Terengganu, Terengganu | `airport-tgg` |
| Sultan Haji Ahmad Shah Airport | KUA/WMKD | Kuantan, Pahang | `airport-kua` |
| Melaka Airport | MKZ/WMKM | Batu Berendam, Melaka | `airport-mkz` |
| Labuan Airport | LBU/WBKL | Labuan, Federal Territory of Labuan | `airport-lbu` |
| Lahad Datu Airport | LDU/WBKD | Lahad Datu, Sabah | `airport-ldu` |
| Sandakan Airport | SDK/WBKS | Sandakan, Sabah | `airport-sdk` |
| Tawau Airport | TWU/WBKW | Tawau, Sabah | `airport-twu` |
| Bintulu Airport | BTU/WBGB | Bintulu, Sarawak | `airport-btu` |
| Limbang Airport | LMN/WBGJ | Limbang, Sarawak | `airport-lmn` |
| Miri Airport | MYY/WBGR | Miri, Sarawak | `airport-myy` |
| Mukah Airport | MKM/WBGK | Mukah, Sarawak | `airport-mkm` |
| Mulu Airport | MZV/WBMU | Mulu, Sarawak | `airport-mzv` |
| Sibu Airport | SBW/WBGS | Sibu, Sarawak | `airport-sbw` |

Note on Melaka: Annual Report 2023 lists it as a domestic airport although it is widely known as "Melaka International Airport" (`airport-mkz`). Use MAHB's classification and confirm the official name.

### 2.3 STOLports (17)

List source: `network-stolport-list-17-derived` (prior, medium). The 14 Sabah and Sarawak names are search-confirmed as STOLports by the Civil Aviation Authority of Malaysia (`network-stolport-list-borneo`). The three Peninsular island names are prior knowledge; the only search support is a corporate profile saying "three islands in Peninsular Malaysia" (`network-stolport-peninsular-islands`). The total matches the official 17. No site section was found for any STOLport.

| STOLport | Codes | Town, state | Evidence for codes | Fact id |
|---|---|---|---|---|
| Pangkor Airport | PKG/WMPA | Pangkor Island, Perak | prior, low | `airport-pkg` |
| Redang Airport | RDN/WMPR | Redang Island, Terengganu | prior, low | `airport-rdn` |
| Tioman Airport | TOD/WMBT | Tioman Island, Pahang | prior, low | `airport-tod` |
| Kudat Airport | KUD/WBKT | Kudat, Sabah | prior, low | `airport-kud` |
| Long Pasia Airport | GSA/WBKN | Long Pasia, Sabah | prior, low | `airport-gsa` |
| Semporna Airport | SMM/WBKA | Semporna, Sabah | prior, low | `airport-smm` |
| Ba'kelalan Airport | BKM/WBGQ | Ba'kelalan, Sarawak | search (aggregator), medium | `airport-bkm` |
| Bario Airport | BBN/WBGZ | Bario, Sarawak | search (aggregator), medium | `airport-bbn` |
| Belaga Airport | BLG/WBGC | Belaga, Sarawak | prior, low | `airport-blg` |
| Kapit Airport | KPI/WBGP | Kapit, Sarawak | prior, low | `airport-kpi` |
| Lawas Airport | LWY/WBGW | Lawas, Sarawak | prior, low | `airport-lwy` |
| Long Akah Airport | LKH/WBGL (ICAO disputed) | Long Akah, Sarawak | search, low | `airport-lkh` |
| Long Banga Airport | LBP/ICAO not verified | Long Banga, Sarawak | prior, low | `airport-lbp` |
| Long Lellang Airport | LGL/WBGF | Long Lellang, Sarawak | search (aggregator), medium | `airport-lgl` |
| Long Semado Airport | LSM/WBGD | Long Semado, Sarawak | prior, low | `airport-lsm` |
| Long Seridan Airport | ODN/WBGI | Long Seridan, Sarawak | search (aggregator), medium | `airport-odn` |
| Marudi Airport | MUR/WBGM | Marudi, Sarawak | prior, low | `airport-mur` |

Two code problems to resolve before publishing:

- **Long Akah:** one listing gives ICAO WBGA, others give WBGL (`airport-lkh`).
- **Long Banga:** ICAO code could not be established (`airport-lbp`).

## 3. KLIA terminal naming

- **Current names:** KLIA Terminal 1 (formerly "KLIA") and KLIA Terminal 2 (formerly "klia2") (`klia-terminal-1-name`, `klia-terminal-2-name`).
- **When announced:** 9 February 2023, by Transport Minister Anthony Loke (`klia-rename-announced`).
- **How it came about:** MAHB proposed the rebranding; it was approved with the Cabinet's in-principle approval of the new Operating Agreements on 2 February 2023 (`klia-rename-linked-to-oa`, `oa-2023-cabinet-approval`).
- **Why:** to improve marketability and help the airport compete with other international airports in the region (`klia-rename-reason`).
- **When effective:** June 2023, reported as 8 June 2023. This date rests on one blog, so write "since 2023" unless verified (`klia-rename-effective`).
- **One airport, two terminals:** the passenger site labels Kuala Lumpur as "KUL - Terminal 1 & Terminal 2" in its airport selector (`klia-one-airport-two-terminals`). One IATA code, KUL, covers both (`airport-kul`).
- **Legacy naming still indexed:** old URLs titled "KL International Airport (KUL) KLIA and klia2" still appear in search results (`klia-legacy-klia2-titles-indexed`).

## 4. Passenger site coverage today

- The passenger site lists five airports, exactly the five international ones (`passenger-site-five-airports`).
- Section paths are `/penang`, `/kota-kinabalu`, `/en/langkawi`, with Kuala Lumpur at the root. Duplicate `/en/` and `/index.php/` variants are indexed (`passenger-site-section-urls`).
- MAHB content is spread across at least six hostnames (`web-estate-hostnames`).

## 5. Subang (Sultan Abdul Aziz Shah Airport, SZB)

- **Classification:** domestic airport in Annual Report 2023 (`szb-classification-domestic`, `airport-szb`).
- **Jets returned:** scheduled narrow-body jet services resumed on 1 August 2024 under the Subang Airport Regeneration Plan (`szb-jets-returned-2024`). Sources disagree on whether the gap was 22 or 26 years.
- **Capacity:** doubled to 3 million passengers a year after works from December 2023 to 30 June 2024 (`szb-capacity-3m`).
- **Targets:** 5 million within four to five years, up to 8 million by 2030 (`szb-sarp-targets`).
- **Curfew:** 22:00 to 06:00 (`szb-curfew`).
- **Jet limits:** 15 slot pairs a day, one jet movement an hour, six narrow-body bays (`szb-jet-movement-limits`).
- **Airline changes:** AirAsia moved its jets to KLIA in April 2025 (`szb-airasia-jets-left`). Firefly stopped jet flights from 19 August 2025 and kept turboprops (`szb-firefly-jets-left`). The year 2025 is inferred from article context in both cases.
- **Traffic:** 1,859,173 passengers in 2025 per a third-party guide only (`szb-traffic-2025`, low confidence).

## 6. Airports the new site must NOT claim

Three of Malaysia's 42 commercial airports are not managed by MAHB (`non-mahb-three-airports`).

| Airport | Codes (prior) | Operator | Fact id |
|---|---|---|---|
| Senai International Airport, Johor | JHB/WMKJ | Senai Airport Terminal Services Sdn Bhd, since 2003, 50-year concession | `non-mahb-senai`, `non-mahb-senai-ex-mahb` |
| Kerteh Airport, Terengganu | KTE/WMKE | Owned by Petronas subsidiary Sanzbury Stead Sdn Bhd; managed by Senai Airport Terminal Services (contract reported January 2019) | `non-mahb-kerteh` |
| Tanjung Manis Airport, Sarawak | TGC/WBGT | Tanjung Manis Development Sdn Bhd (CAAM licence holder) | `non-mahb-tanjung-manis` |

The source for "39 of 42" does not name the three; these are the candidates supported by other search results.

## 7. Changes 2024-2026

**Operating Agreements**

- Signed 18 March 2024 (`oa-2024-signed`).
- Term of 45 years, to 11 February 2069 (`oa-2024-term`).
- Cover all 39 airports and STOLports (`oa-2024-scope`).
- Land lease agreements signed alongside (`oa-2024-lease`).
- Introduce an Airport Development Fund (`oa-2024-airport-development-fund`), with 50% of the passenger service charge component of the user fee channelled to it (`oa-2024-psc-share`, single news source).
- Allow an investment recovery model for capacity spending (`oa-2024-investment-recovery`).

**Network**

- No airport added, transferred, closed or renamed was found for 2024-2026; the count stayed at 39 (`network-count-unchanged-2024-2026`). This is absence of evidence, not confirmation.
- The last reclassification found is Mukah in 2021 (`change-mukah-airport-2021`, `change-mukah-airport-details`).

**Ownership**

- MAHB was delisted from Bursa Malaysia after about 25 years, following privatisation (`change-mahb-delisted`; one headline, date from prior knowledge).
- The acquiring consortium is recalled as Gateway Development Alliance (`change-mahb-privatisation-consortium`; prior knowledge, low confidence).

**Regulation**

- CAAM published Safety Instruction SI 02/2026 for STOLport operators in March 2026 (`change-caam-stolport-instruction-2026`; title only).

**Traffic**

- 104.4 million passengers across the 39 Malaysian airports in 2025, up 11.2% (`traffic-2025-malaysia-network`).
- About 135 million across the group in 2024 (`traffic-2024-group`, low confidence).

## 8. Overseas interests

- MAHB manages one airport outside Malaysia: Istanbul Sabiha Gokcen International Airport in Turkiye. Annual Report 2023 describes the portfolio as 39 airports in Malaysia "plus one international airport in Istanbul, Turkiye" (`overseas-isg-description`, `network-plus-isg-40`).
- Codes SAW/LTFJ, on the Asian side of Istanbul (`overseas-isg-codes`, prior).
- Wholly owned since 2014 (`overseas-isg-ownership`, prior, low confidence).
- Istanbul Sabiha Gokcen is outside the Malaysian Operating Agreements (`oa-2024-scope`).

## Not verified / gaps

**Access limits**

- Official MAHB hosts and `caam.gov.my` were blocked all run; no direct evidence.
- Search budget ended after 11 searches.

**Inventory**

- No single official list of all 39 airports with classification was retrieved.
- The split in MAHB's own Annual Report 2024 or 2025 was not retrieved.
- IATA/ICAO codes for 34 of 39 airports are prior knowledge only. Long Akah's ICAO is disputed; Long Banga's is unverified.
- MAHB's official styling of airport names was not confirmed.
- The issuing body of parliamentary paper ST.172/2025 is not confirmed, and it does not name the three non-MAHB airports.
- Conflict unresolved: a June 2021 MAHB release reportedly said "eight other STOLports" in Sarawak; the assembled list has 11.
- Current scheduled-service status of each STOLport was not checked.

**Passenger site**

- Whether any of the 34 domestic airports and STOLports has a site section is unconfirmed. The Kuching section URL was not surfaced.

**KLIA**

- The exact effective date of the terminal names (8 June 2023) rests on one blog.

**Subang**

- Current airline line-up, international routes, 2025 classification, terminal operator, and whether the curfew and slot cap still apply were not verified.

**Changes and ownership**

- No targeted search could be run for state takeover proposals, new STOLports or airports in Sarawak, or developments after early 2026.
- Privatisation details are prior knowledge apart from one headline.
- Contents of CAAM SI 02/2026 were not read.

**Overseas and non-MAHB**

- Istanbul ownership percentage, concession end date and 2025 traffic were not verified. Other overseas interests were not checked.
- Whether Senai Airport Terminal Services still manages Kerteh in 2026 was not verified.

**Hypotheses to test (not facts)**

- Travellers using the 34 airports without a site section probably have no first-party source for airport information.
- Legacy "klia2" titles and duplicate URL variants suggest missing redirects and canonicals; confirm by crawl.
- Users may not know KUL covers both terminals, or may still search "klia2"; test a terminal-first entry and keep "klia2" as a search synonym.

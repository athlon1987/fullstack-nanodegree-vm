/**
 * Source registry: every citable source used by the core content layer.
 *
 * Content refers to sources by id (`sources: ['mahb-klia-t1-parking']`). Per-airport content files
 * may bring their own extra sources (`AirportContentModule.sources`); the merged registry and the
 * lookup helpers (`getSource`, `resolveSources`) are exported from `@/content`.
 *
 * `kind` says who is speaking. Only `official` (Malaysia Airports), `government` and `operator`
 * (the airline or service operator itself) are authoritative; facts that rest on `news`,
 * `aggregator` or `other` sources alone are published with `provenance: 'estimated'`.
 *
 * `retrieved` is the date the research run captured the source (16 November 2026). Most official
 * pages were read through search indexes on that date, not fetched directly; the exception is the
 * KLIA Terminal 1 parking page, which was read first hand.
 */
import type { Source, SourceKind } from './types';

const RETRIEVED = '2026-11-16';

function source(
  id: string,
  kind: SourceKind,
  publisher: string,
  title: string,
  url: string,
  asOf?: string,
): Source {
  return asOf ? { id, kind, publisher, title, url, retrieved: RETRIEVED, asOf } : { id, kind, publisher, title, url, retrieved: RETRIEVED };
}

const MAHB = 'Malaysia Airports Holdings Berhad';
const CAAM = 'Civil Aviation Authority of Malaysia';

/** Core sources, in the order they are grouped below. Add new sources at the end of a group. */
export const CORE_SOURCES: readonly Source[] = [
  /* ---- Network and corporate ---------------------------------------------------------- */
  source(
    'mahb-annual-report-2023',
    'official',
    MAHB,
    'Malaysia Airports Holdings Berhad Annual Report 2023',
    'https://www.malaysiaairports.com.my/sites/corporate/files/2024-05/MAHB%20AR2023%20%5BSingle%5D-compressed.pdf',
    '2024-04-29',
  ),
  source(
    'mahb-annual-report-2023-text',
    'aggregator',
    'MarketScreener',
    'Malaysia Airports: Full Annual Report (text copy of the Annual Report 2023)',
    'https://www.marketscreener.com/quote/stock/MALAYSIA-AIRPORTS-6491319/news/Malaysia-Airports-Full-Annual-Report-75-44-MB-46560038/',
    '2024-04-29',
  ),
  source('mahb-airports-site', 'official', MAHB, 'Malaysia Airports passenger website', 'https://airports.malaysiaairports.com.my/'),
  source('mahb-contact', 'official', MAHB, 'Contact - Malaysia Airports', 'https://www.malaysiaairports.com.my/contact'),
  source('mahb-care-chat', 'official', MAHB, 'Chat with us (Malaysia Airports CARE)', 'https://care.malaysiaairports.com.my/chat'),
  source(
    'mahb-corporate-profile-copy',
    'other',
    'Third-party copy of a Malaysia Airports publication',
    "Malaysia Airports corporate profile 'Connecting You' (undated copy)",
    'https://lvyou168.cn/malaysiaairports/pdf/corporate_profile.pdf',
  ),
  source(
    'caam-ras-destinations',
    'government',
    CAAM,
    'Know your RAS destinations',
    'https://www.caam.gov.my/industry/public-service-obligations/know-your-ras-destinations/?std',
  ),
  source(
    'parlimen-st172-2025',
    'government',
    'Parliament of Malaysia',
    'Statute Paper ST.172/2025 (2024 annual report tabled in Parliament)',
    'https://www.parlimen.gov.my/ipms/eps/2025-11-25/ST.172.2025%20-%20ST172.2025.pdf',
    '2025-11-25',
  ),
  source(
    'wikipedia-airports-malaysia',
    'aggregator',
    'Wikipedia (mirror)',
    'List of airports in Malaysia',
    'https://wikwiand-revamp.pages.dev/en/List_of_airports_in_Malaysia',
  ),
  source(
    'caam-eaip-wmkp',
    'government',
    CAAM,
    'eAIP Malaysia: Aerodrome WMKP Penang International Airport',
    'https://aip.caam.gov.my/aip/eAIP/2026-10-29-AIRAC/html/eAIP/WM-AD-2.WMKP-en-MS.html',
    '2026-10-29',
  ),
  source('mahb-penang-site', 'official', MAHB, 'PEN - Penang (Malaysia Airports airport site)', 'https://airports.malaysiaairports.com.my/en/penang'),
  source(
    'caam-eaip-wbkk',
    'government',
    CAAM,
    'eAIP Malaysia: Aerodrome WBKK Kota Kinabalu International Airport',
    'https://aip.caam.gov.my/aip/eAIP/2026-08-11/html/eAIP/WM-AD-2.WBKK-en-MS.html',
    '2026-08-11',
  ),
  source('fr24-tgg', 'aggregator', 'Flightradar24', 'Kuala Terengganu Sultan Mahmud (TGG) (WMKN)', 'https://www.flightradar24.com/data/airports/tgg'),
  source('fr24-iph', 'aggregator', 'Flightradar24', 'Ipoh Sultan Azlan Shah (IPH) (WMKI)', 'https://www.flightradar24.com/data/airports/iph'),
  source('fr24-kua', 'aggregator', 'Flightradar24', 'Kuantan Sultan Haji Ahmad Shah (KUA) (WMKD)', 'https://www.flightradar24.com/data/airports/kua'),
  source('fr24-sbw', 'aggregator', 'Flightradar24', 'Sibu (SBW) (WBGS)', 'https://www.flightradar24.com/data/airports/sbw'),
  source('fr24-btu', 'aggregator', 'Flightradar24', 'Bintulu (BTU) (WBGB)', 'https://www.flightradar24.com/data/airports/btu'),
  source('fr24-lmn', 'aggregator', 'Flightradar24', 'Limbang (LMN) (WBGJ)', 'https://www.flightradar24.com/data/airports/lmn/arrivals'),
  source(
    'thestar-kbr-full-operation-2026',
    'news',
    'The Star',
    'Sultan Ismail Petra Airport to start full operation tomorrow after expansion works',
    'https://www.thestar.com.my/news/nation/2026/03/15/sultan-ismail-petra-airport-to-start-full-operation-tomorrow-after-expansion-works',
    '2026-03-15',
  ),
  source('wikipedia-aor', 'other', 'Wikipedia', 'Sultan Abdul Halim Airport', 'https://en.wikipedia.org/wiki/Sultan_Abdul_Halim_Airport'),
  source('wikipedia-lbu', 'other', 'Wikipedia', 'Labuan Airport', 'https://en.wikipedia.org/wiki/Labuan_Airport'),
  source('wikipedia-myy', 'other', 'Wikipedia', 'Miri Airport', 'https://en.wikipedia.org/wiki/Miri_Airport'),
  source('wikipedia-sdk', 'other', 'Wikipedia', 'Sandakan Airport', 'https://en.wikipedia.org/wiki/Sandakan_Airport'),
  source('wikipedia-twu', 'other', 'Wikipedia', 'Tawau Airport', 'https://en.wikipedia.org/wiki/Tawau_Airport'),
  source('navitime-mzv', 'aggregator', 'NAVITIME', 'Mulu Airport (MZV) flight schedule', 'https://transit.navitime.com/en/flight/MZV'),
  source(
    'skyscanner-mkz',
    'aggregator',
    'Skyscanner',
    'Melaka International Airport',
    'https://www.skyscanner.ca/airports/mkz/malacca-airport.html',
  ),
  source(
    'klia2info-miri',
    'aggregator',
    'klia2.info (third-party guide)',
    'Miri Airport (MYY): address, airlines and location',
    'https://www.klia2.info/airports/miri-international-airport/',
  ),

  /* ---- KLIA: official pages ----------------------------------------------------------- */
  source('mahb-klia-t1-home', 'official', MAHB, 'KLIA Terminal 1 - Kuala Lumpur International Airport', 'https://airports.malaysiaairports.com.my/en/klia1'),
  source(
    'mahb-klia-t1-parking',
    'official',
    MAHB,
    'KLIA Terminal 1 Parking',
    'https://airports.malaysiaairports.com.my/en/klia1/parking',
    '2026-11-16',
  ),
  source('mahb-klia-t1-map', 'official', MAHB, 'KLIA Terminal 1 interactive map', 'https://www.malaysiaairports.com.my/en/klia1/map'),
  source(
    'mahb-klia-t1-facilities',
    'official',
    MAHB,
    'Airport Facilities at KLIA Terminal 1',
    'https://www.malaysiaairports.com.my/en/klia1/air-travel/airport-facilities',
  ),
  source('mahb-klia-t1-help', 'official', MAHB, 'Help & Support at KLIA Terminal 1', 'https://www.malaysiaairports.com.my/en/klia1/help'),
  source(
    'mahb-klia-t1-departures',
    'official',
    MAHB,
    'KLIA Terminal 1 live departures',
    'https://www.malaysiaairports.com.my/en/klia1/flight-information/departures',
  ),
  source(
    'mahb-lost-found',
    'official',
    MAHB,
    'Lost & Found',
    'https://airports.malaysiaairports.com.my/airport-amenities/services/lost-found',
  ),
  source(
    'mahb-butterfly-effect',
    'official',
    MAHB,
    'What is the Butterfly Effect?',
    'https://airports.malaysiaairports.com.my/airport-amenities/services/butterfly-effect',
  ),
  source(
    'mahb-lounges-listing',
    'official',
    MAHB,
    'Lounges (shop, dine and services directory)',
    'https://airports.malaysiaairports.com.my/shop-dine-services/services/lounges',
  ),
  source(
    'mahb-convergence-touch-of-zen',
    'official',
    MAHB,
    'A Touch of Zen (Convergence magazine)',
    'https://convergence.malaysiaairports.com.my/inside-story/touch-zen',
  ),
  source(
    'mahb-tiktok-jungle-boardwalk',
    'official',
    MAHB,
    'KLIA Jungle Boardwalk is now open again (official TikTok)',
    'https://www.tiktok.com/@malaysiaairports/video/7285278239071767815',
    '2023-10',
  ),

  /* ---- KLIA: airlines and operators ---------------------------------------------------- */
  source(
    'mh-klia-t1-passenger-journey',
    'operator',
    'Malaysia Airlines',
    'KLIA Terminal 1 Passenger Journey',
    'https://www.malaysiaairlines.com/my/en/travel-info/klia-terminal-1-passenger-journey.html',
  ),
  source(
    'ana-kuala-lumpur-guide',
    'operator',
    'All Nippon Airways',
    'Kuala Lumpur International Airport, Terminal 1 (airport guide)',
    'https://www.ana.co.jp/en/kh/travel-information/airport-and-city-info/kuala-lumpur/',
  ),
  source(
    'routesonline-calm-room-t2',
    'operator',
    'Routes (release by Malaysia Airports)',
    'New Calm Room opens at KLIA Terminal 2, enhancing support for passengers with hidden disabilities',
    'https://www.routesonline.com/airports/8/kuala-lumpur-international-airport-klia/news/299664807/new-calm-room-opens-at-klia-terminal-2-enhancing-support-for-passengers-with-hidden-disabilities',
    '2025-07',
  ),

  /* ---- KLIA: news ---------------------------------------------------------------------- */
  source(
    'malaymail-aerotrain-software-oct-2026',
    'news',
    'Malay Mail',
    'Flying in to KLIA after midnight? Buses replace Aerotrain from 12am to 5am during software works',
    'https://www.malaymail.com/news/malaysia/2026/10/07/flying-in-to-klia-after-midnight-buses-replace-aerotrain-from-12am-to-5am-during-software-works/238049',
    '2026-10-07',
  ),
  source(
    'soyacincau-aerotrain-software-oct-2026',
    'news',
    'SoyaCincau',
    'Taking a red-eye flight? KLIA Aerotrain unavailable 12am-5am until 17 October',
    'https://soyacincau.com/2026/10/07/klia-aerotrain-unavailable-12am-5am-software-works/',
    '2026-10-07',
  ),
  source(
    'paultan-aerotrain-resumes-2025',
    'news',
    'paultan.org',
    'KLIA aerotrain resumes service: faster train sets, travel times between terminals now under 3 minutes',
    'https://paultan.org/2025/07/02/klia-aerotrain-resumes-service-faster-train-sets-travel-times-between-terminals-now-under-3-minutes',
    '2025-07-02',
  ),
  source(
    'fmt-aerotrain-24-hour-2026',
    'news',
    'Free Malaysia Today',
    'KLIA aerotrain resumes 24-hour operations from June 1',
    'https://www.freemalaysiatoday.com/category/nation/2026/05/31/klia-aerotrain-resumes-24-hour-operations-from-june-1',
    '2026-05-31',
  ),
  source(
    'thestar-aerotrain-24-hour-2026',
    'news',
    'The Star',
    "KLIA's 24-hour Aerotrain service resumes on June 1",
    'https://www.thestar.com.my/news/nation/2026/05/31/klias-24-hour-aerotrain-service-resumes-on-june-1',
    '2026-05-31',
  ),
  source(
    'ptt-butterfly-effect-2020',
    'news',
    'Passenger Terminal Today',
    'KLIA introduces initiative for passengers with hidden disabilities',
    'https://www.passengerterminaltoday.com/news/passenger-experience/klia-introduces-initiative-for-passengers-with-hidden-disabilities.html',
    '2020-12',
  ),
  source(
    'says-calm-room-sensory-walls',
    'news',
    'SAYS',
    'KLIA shows support for travellers with autism with new Calm Room and sensory walls',
    'https://says.com/my/lifestyle/klia-creates-calm-room-and-sensory-walls-to-support-travellers-with-autism',
  ),
  source(
    'malaymail-klia-rebrand-2023',
    'news',
    'Malay Mail',
    'Anthony Loke: KLIA and klia2 to be rebranded to Terminals 1 and 2',
    'https://www.malaymail.com/news/malaysia/2023/02/09/anthony-loke-klia-and-klia2-to-be-rebranded-to-terminals-1-and-2/54096',
    '2023-02-09',
  ),

  /* ---- KLIA: third-party guides and listings (not authoritative) ----------------------- */
  source('klia2info-airlines', 'aggregator', 'klia2.info (third-party guide)', "KLIA 1 or 2? Find your airline's terminal: full 2026 list", 'https://www.klia2.info/airlines/', '2026'),
  source('klairport-info-klia', 'aggregator', 'klairport.info (third-party guide)', 'KLIA Terminal 1', 'https://klairport.info/klia/', '2026'),
  source(
    'blacklane-klia-guide',
    'aggregator',
    'Blacklane blog',
    'A 2026 guide to Kuala Lumpur International Airport',
    'https://www.blacklane.com/en/blog/travel/airports/a-guide-to-kuala-lumpur-airport-klia/',
    '2026',
  ),
  source(
    'destinationkl-klia-vs-klia2',
    'aggregator',
    'destinationkualalumpur.com (blog)',
    'KLIA vs KLIA2: which terminal is my airline? (2026)',
    'https://destinationkualalumpur.com/klia-vs-klia2/',
    '2026',
  ),
  source('klia2info-level-guide', 'aggregator', 'klia2.info (third-party guide)', 'KLIA Main Terminal Building level guide', 'https://www.klia2.info/?p=1149'),
  source(
    'klia2info-layout-plan',
    'aggregator',
    'klia2.info (third-party guide)',
    'KLIA layout plan: navigate KLIA Terminal 1 with ease',
    'https://www.klia2.info/klia/klia-layout-plan/',
    '2026',
  ),
  source(
    'traveloka-mdac',
    'aggregator',
    'Traveloka',
    "Policies for Malaysia's Digital Arrival Card for foreigners",
    'https://www.traveloka.com/en-my/explore/tips/malaysia-digital-arrival-card/302172',
  ),
  source(
    'dragonpass-plaza-premium-kul',
    'aggregator',
    'DragonPass',
    'Plaza Premium Lounge (International Departures, Contact Pier) listing',
    'https://www.dragonpass.com/explore/lounge/A10023/N03675',
  ),
  source('layoverindex-kul-lounges', 'aggregator', 'layoverindex.com', 'KUL lounges', 'https://layoverindex.com/kul/lounges/'),
  source('loungereview-kul', 'aggregator', 'loungereview.com', 'KUL lounges', 'https://loungereview.com/lounges/airport/kul'),
  source(
    'booking-sama-sama-express',
    'aggregator',
    'Booking.com',
    'Sama-Sama Express KLIA Terminal 1 - Airside Transit Hotel (listing)',
    'https://booking.com/hotel/my/sama-sama-express-klia.en-gb.html',
  ),
  source(
    'kliainfo-sama-sama-express',
    'aggregator',
    'klia.info (third-party guide)',
    'Sama-Sama Express KLIA (Terminal 1)',
    'https://klia.info/accommodations/mid_range_hotels/sama-sama_express_klia.htm',
  ),
  source('kliainfo-lost-found', 'aggregator', 'klia.info (third-party guide)', 'Lost & Found Counter at KLIA Terminal 1', 'https://klia.info/facilities/lost_and_found.htm'),
  source(
    'kliainfo-domestic-departures',
    'aggregator',
    'klia.info (third-party guide)',
    'Domestic departures guide at KLIA',
    'https://klia.info/passenger_guides/domestic_departures.htm',
  ),

  /* ---- This prototype ------------------------------------------------------------------- */
  source(
    'prototype-method',
    'other',
    'This prototype (not an official source)',
    'How this concept prototype estimates and labels guidance',
    '/about-this-prototype',
  ),

  /* ---- Shared by more than one airport content file (appended with PEN, BKI, KCH, LGK, SZB) ---- */
  source(
    'imi-domestic-travel',
    'government',
    'Immigration Department of Malaysia',
    'Domestic travel: documents for travel to and from Sabah and Sarawak (as summarised in search results)',
    'https://www.imi.gov.my/index.php/en/main-services/domestic-travel-domestic/',
  ),
  source(
    'imi-restricted-travel-documents',
    'government',
    'Immigration Department of Malaysia',
    'Restricted travel documents (as summarised in search results)',
    'https://www.imi.gov.my/index.php/en/main-services/travel-documents/restricted-travel-documents/',
  ),
  source(
    'mh-visa-immigration-documents',
    'operator',
    'Malaysia Airlines',
    'Visa and immigration documents',
    'https://www.malaysiaairlines.com/my/en/travel-info/visa-and-immigration-documents.html',
  ),
  source(
    'capa-airborneo-takeover-2026',
    'news',
    'CAPA Centre for Aviation',
    'Malaysia Aviation Group completes ownership transfer of MASwings to AirBorneo',
    'https://centreforaviation.com/news/malaysia-aviation-group-completes-ownership-transfer-of-maswings-to-airborneo-1343251',
    '2026-01',
  ),
  source(
    'fr24-airborneo-9m-mwa',
    'aggregator',
    'Flightradar24',
    '9M-MWA, ATR 72-500, AirBorneo: flight history',
    'https://www.flightradar24.com/data/aircraft/9m-mwa',
    '2026-09 to 2026-10',
  ),
  source(
    'flightconnections-myy',
    'aggregator',
    'FlightConnections',
    'Flights from Miri (MYY)',
    'https://www.flightconnections.com/flights-from-miri-myy',
    '2026-11',
  ),

  /* ---- Guides and help centre (appended by the guides team) ----------------------------------
   * Retrieved 17 November 2026 through web search. Official hosts (airports.malaysiaairports.com.my,
   * caam.gov.my) could not be fetched from the research container, so most entries record what the
   * search summaries quoted from the page; the title says so. The feedback site was observed first
   * hand on 16 November 2026 (docs/research/audit/firsthand-observations.md).
   * ------------------------------------------------------------------------------------------ */
  { id: 'mahb-lags-restricted-items', kind: 'official', publisher: MAHB, title: 'Liquids, aerosols and gels (LAGs) and restricted items (as summarised in search results)', url: 'https://airports.malaysiaairports.com.my/passenger-guide/lags-restricted-items', retrieved: '2026-11-17' },
  { id: 'mahb-customs-immigration-guide', kind: 'official', publisher: MAHB, title: 'Customs and immigration passenger guide (page found in search results; content not read)', url: 'https://airports.malaysiaairports.com.my/passenger-guide/customs-immigration', retrieved: '2026-11-17' },
  { id: 'mahb-flight-transfers', kind: 'official', publisher: MAHB, title: 'Flight transfers (as summarised in search results)', url: 'https://airports.malaysiaairports.com.my/transit/flight-transfers', retrieved: '2026-11-17' },
  { id: 'mahb-special-assistance-klia-t1', kind: 'official', publisher: MAHB, title: 'Special assistance at KLIA Terminal 1 (listed in the official sitemap; content not captured)', url: 'https://www.malaysiaairports.com.my/en/klia1/air-travel/special-assistance', retrieved: '2026-11-16' },
  { id: 'mahb-feedback-site', kind: 'official', publisher: MAHB, title: 'Malaysia Airports feedback site (linked from Help on the official site; observed first hand)', url: 'https://feedback.malaysiaairports.com.my/', retrieved: '2026-11-16' },
  { id: 'mahb-scam-alert', kind: 'official', publisher: MAHB, title: 'Scam alert (as summarised in search results)', url: 'https://www.malaysiaairports.com.my/scam-alert', retrieved: '2026-11-17' },
  { id: 'mahb-corporate-scam-alert', kind: 'official', publisher: MAHB, title: 'Scam alert, corporate site (as summarised in search results)', url: 'https://corporate.malaysiaairports.com.my/en/scam-alert', retrieved: '2026-11-17' },
  { id: 'mahb-privacy-notice', kind: 'official', publisher: MAHB, title: 'Privacy Notice (English version), PDF (as summarised in search results)', url: 'https://www.malaysiaairports.com.my/sites/corporate/files/2024-04/Privacy%20Notice%20%28English%20version%29%20FINAL.pdf', retrieved: '2026-11-17', asOf: '2024-04' },
  { id: 'mh-cabin-baggage', kind: 'operator', publisher: 'Malaysia Airlines', title: 'Cabin baggage rules (as summarised in search results)', url: 'https://www.malaysiaairlines.com/in/en/travel-info/baggage/cabin-baggage.html', retrieved: '2026-11-17' },
  { id: 'mh-power-banks', kind: 'operator', publisher: 'Malaysia Airlines', title: 'Carrying power banks on board (as summarised in search results)', url: 'https://malaysiaairlines.com/kr/ko/mh-media-centre/important-for-you/carrying-power-banks-on-board.html', retrieved: '2026-11-17', asOf: '2025-04-01' },
  { id: 'mh-special-assistance', kind: 'operator', publisher: 'Malaysia Airlines', title: 'MHguardian and special assistance, including wheelchair requests (as summarised in search results)', url: 'https://www.malaysiaairlines.com/uk/en/travel-info/mhguardian.html', retrieved: '2026-11-17' },
  { id: 'malaymail-mh-power-banks-2025', kind: 'news', publisher: 'Malay Mail', title: 'Malaysia Airlines bans power bank use on flights, tightens carry-on rules from April 1', url: 'https://www.malaymail.com/news/malaysia/2025/03/22/malaysia-airlines-bans-power-bank-use-on-flights-tightens-carry-on-rules-from-april-1/170441', retrieved: '2026-11-17', asOf: '2025-03-22' },
  { id: 'thestar-power-banks-caam-2025', kind: 'news', publisher: 'The Star', title: 'No power banks in bags', url: 'https://www.thestar.com.my/news/nation/2025/03/15/no-power-banks-in-bags', retrieved: '2026-11-17', asOf: '2025-03-15' },
  { id: 'caam-sd-01-2026-power-banks', kind: 'government', publisher: CAAM, title: 'SD 01/2026: Safety measures for the carriage of lithium-ion battery power banks for passengers and crew (title seen in search results; content not read)', url: 'https://www.caam.gov.my/wp-content/uploads/2026/04/SD-01_2026-Safety-Measures-for-The-Carriage-of-Lithium-Ion-Battery-Power-Bank-for-Passenger-and-Crew.pdf', retrieved: '2026-11-17', asOf: '2026-04' },
  { id: 'thestar-mavcom-delay-refunds-2025', kind: 'news', publisher: 'The Star', title: 'Mavcom: Airlines must offer passengers refunds for flight delays of five hours or more', url: 'https://www.thestar.com.my/business/business-news/2025/02/19/mavcom-airlines-must-offer-passengers-refunds-for-flight-delays-of-five-hours-or-more', retrieved: '2026-11-17', asOf: '2025-02-19' },
  { id: 'malaymail-delay-refunds-2024', kind: 'news', publisher: 'Malay Mail', title: 'What you should know about getting your money back for AirAsia, MAB, Batik Air flights late five hours or more', url: 'https://www.malaymail.com/news/malaysia/2024/09/05/what-you-should-know-about-getting-your-money-back-for-airasia-mab-batik-air-flights-late-five-hours-or-more/149234', retrieved: '2026-11-17', asOf: '2024-09-05' },
  { id: 'skrine-macpc-2016', kind: 'other', publisher: 'Skrine (law firm)', title: 'Now everyone can fly with less headaches! (Malaysian Aviation Consumer Protection Code 2016)', url: 'https://www.skrine.com/insights/newsletter/september-2016/now-everyone-can-fly-with-less-headaches!', retrieved: '2026-11-17', asOf: '2016-09' },
  { id: 'conventuslaw-mavcom-complaint', kind: 'other', publisher: 'Conventus Law', title: 'Malaysia: a practical guide to file a complaint at MAVCOM', url: 'https://conventuslaw.com/report/malaysia-a-practical-guide-to-file-a-complaint-at-mavcom/', retrieved: '2026-11-17' },
  { id: 'caam-mavcom-consumer-report-2026', kind: 'government', publisher: CAAM, title: "MAVCOM's latest consumer report highlights better consumer protection, improved airline responsiveness (as summarised in search results)", url: 'https://www.caam.gov.my/newsroom/mavcoms-latest-consumer-report-highlights-better-consumer-protection-improved-airline-responsiveness/', retrieved: '2026-11-17', asOf: '2026-03' },
  { id: 'thestar-jpj-touts-2026', kind: 'news', publisher: 'The Star', title: 'JPJ goes after airport touts targeting foreign visitors', url: 'https://www.thestar.com.my/news/nation/2026/07/07/jpj-goes-after-airport-touts-targeting-foreign-visitors', retrieved: '2026-11-17', asOf: '2026-07-07' },
  { id: 'malaymail-ehailing-touts-2026', kind: 'news', publisher: 'Malay Mail', title: 'JPJ cracks down on e-hailing drivers at KLIA bypassing apps, charging up to RM800', url: 'https://www.malaymail.com/amp/news/malaysia/2026/07/07/jpj-cracks-down-on-e-hailing-drivers-at-klia-bypassing-apps-charging-up-to-rm800/226642', retrieved: '2026-11-17', asOf: '2026-07-07' },
  { id: 'imi-mdac-portal', kind: 'government', publisher: 'Immigration Department of Malaysia', title: 'Malaysia Digital Arrival Card (MDAC) portal (address as given in search results)', url: 'https://imigresen-online.imi.gov.my/mdac/main', retrieved: '2026-11-17' },
  { id: 'wikipedia-mdac', kind: 'other', publisher: 'Wikipedia', title: 'Malaysia Digital Arrival Card', url: 'https://en.wikipedia.org/wiki/Malaysia_Digital_Arrival_Card', retrieved: '2026-11-17' },
  { id: 'customs-gov-my', kind: 'government', publisher: 'Royal Malaysian Customs Department', title: 'Royal Malaysian Customs Department official website (named in search results; content not read)', url: 'https://www.customs.gov.my/', retrieved: '2026-11-17' },
  { id: 'hro-customs-declaration-2022', kind: 'news', publisher: 'Human Resources Online', title: 'Customs declaration form must be filled in by all travellers flying to and from Malaysia: what you need to know', url: 'https://www.humanresourcesonline.net/customs-declaration-form-must-be-filled-in-by-all-travellers-flying-to-and-from-malaysia-what-you-need-to-know', retrieved: '2026-11-17', asOf: '2022-10' },
  { id: 'sarawaktribune-mykad-entry-2026', kind: 'news', publisher: 'Sarawak Tribune', title: 'Malaysians from the Peninsula and Sabah can enter Sarawak with MyKad (as summarised in search results)', url: 'https://www.sarawaktribune.com/?p=277989', retrieved: '2026-11-17', asOf: '2026-06-12' },
];

/** Core sources keyed by id. Prefer `getSource` from `@/content`, which also sees per-airport sources. */
export const CORE_SOURCE_MAP: ReadonlyMap<string, Source> = new Map(CORE_SOURCES.map((item) => [item.id, item]));

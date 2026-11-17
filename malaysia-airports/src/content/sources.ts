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
];

/** Core sources keyed by id. Prefer `getSource` from `@/content`, which also sees per-airport sources. */
export const CORE_SOURCE_MAP: ReadonlyMap<string, Source> = new Map(CORE_SOURCES.map((item) => [item.id, item]));

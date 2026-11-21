/**
 * The airport registry: all 39 airports Malaysia Airports operates in Malaysia
 * (5 international, 17 domestic, 17 STOLports), plus lookup helpers.
 *
 * Provenance of this file: `docs/research/facts/f-network.json` and `f-others.json` (with
 * Penang and Kota Kinabalu codes from `f-penang.json` / `f-kk.json`).
 *  - Classification lists come from the Annual Report 2023 text (search-confirmed).
 *  - A record is `verification: 'verified'` only when its IATA code, ICAO code and name are all
 *    backed by search-confirmed facts of high or medium confidence. Otherwise it is `unverified`
 *    and `unverifiedFields` names the fields that rest on prior knowledge or low-confidence
 *    research. Most often that is only the ICAO code: do not present those as confirmed.
 *  - Coordinates are rounded positions for a schematic map of Malaysia (`approximate: true`).
 *    They are not from the research files and must not be used for navigation.
 *  - Senai (Johor), Kerteh and Tanjung Manis are NOT in this registry: Malaysia Airports does not
 *    operate them.
 *
 * This module is small and safe to import from Client Components (the airport switcher does).
 */
import { lt, pick } from './values';
import type { Airport, AirportClassification, AirportDepth, AirportRegion, Contact, Lang, LocalizedText, Terminal, TerminalId } from './types';

type UnverifiedField = Airport['unverifiedFields'][number];

/** The single timezone used by every airport in the network (UTC+8, no daylight saving). */
export const AIRPORT_TIMEZONE = 'Asia/Kuala_Lumpur' as const;

/** The airport list comes from the Annual Report 2023 (published 29 April 2024); codes were checked on 16 November 2026. */
const AS_OF = '2024-04-29';
const AS_OF_NOTE = lt('Annual Report 2023 airport list; codes checked 16 November 2026', 'Senarai lapangan terbang Laporan Tahunan 2023; kod disemak pada 16 November 2026');

/** Group-level contacts published by Malaysia Airports. They are not airport-specific lines. */
export const GROUP_CONTACTS: Contact[] = [
  {
    kind: 'phone',
    label: lt('Malaysia Airports customer support (group line)', 'Khidmat pelanggan Malaysia Airports (talian kumpulan)'),
    value: '+60 3 8777 0000',
    href: 'tel:+60387770000',
    note: lt(
      'This is the group support line, not a number for a specific airport.',
      'Ini talian sokongan kumpulan, bukan nombor khusus bagi sesebuah lapangan terbang.',
    ),
    asOf: '2026-11-16',
    sources: ['mahb-contact', 'mahb-klia-t1-help'],
  },
  {
    kind: 'email',
    label: lt('General enquiries and feedback', 'Pertanyaan am dan maklum balas'),
    value: 'info@malaysiaairports.com.my',
    href: 'mailto:info@malaysiaairports.com.my',
    asOf: '2026-11-16',
    sources: ['mahb-contact', 'mahb-care-chat'],
  },
];

const KUL_CONTACTS: Contact[] = [
  ...GROUP_CONTACTS,
  {
    kind: 'phone',
    label: lt('KLIA Terminal 1 and corporate office', 'KLIA Terminal 1 dan pejabat korporat'),
    value: '+60 3 8777 7000',
    href: 'tel:+60387777000',
    asOf: '2026-11-16',
    sources: ['mahb-klia-t1-help'],
  },
  {
    kind: 'chat',
    label: lt('Live chat with Malaysia Airports', 'Sembang langsung dengan Malaysia Airports'),
    value: 'care.malaysiaairports.com.my/chat',
    href: 'https://care.malaysiaairports.com.my/chat',
    note: lt(
      'Staffed by people on a daily schedule, not around the clock.',
      'Dikendalikan oleh petugas mengikut jadual harian, bukan 24 jam.',
    ),
    asOf: '2026-11-16',
    sources: ['mahb-care-chat'],
  },
  {
    kind: 'app',
    label: lt('MYairports mobile app', 'Aplikasi mudah alih MYairports'),
    value: 'MYairports',
    asOf: '2026-11-16',
    sources: ['mahb-care-chat'],
  },
];

const MAIN_TERMINAL: Terminal = {
  id: 'MAIN',
  name: lt('Main terminal', 'Terminal utama'),
  shortName: lt('Terminal', 'Terminal'),
  levels: [],
};

const KUL_TERMINALS: Terminal[] = [
  {
    id: 'T1',
    name: lt('KLIA Terminal 1', 'KLIA Terminal 1'),
    shortName: lt('Terminal 1', 'Terminal 1'),
    levels: [
      {
        id: 'L1',
        name: lt('Level 1: buses', 'Aras 1: bas'),
        order: 1,
        description: lt('The bus terminal serving Terminal 1.', 'Terminal bas untuk Terminal 1.'),
        provenance: 'estimated',
        sources: ['ana-kuala-lumpur-guide', 'klia2info-level-guide'],
      },
      {
        id: 'L3',
        name: lt('Level 3: arrivals', 'Aras 3: ketibaan'),
        order: 3,
        description: lt('The arrival hall of the Main Terminal Building.', 'Balai ketibaan Bangunan Terminal Utama.'),
        provenance: 'estimated',
        sources: ['klia2info-level-guide'],
      },
      {
        id: 'L5',
        name: lt('Level 5: departures', 'Aras 5: berlepas'),
        order: 5,
        description: lt(
          'The departure hall and check-in counters of the Main Terminal Building.',
          'Balai berlepas dan kaunter daftar masuk Bangunan Terminal Utama.',
        ),
        provenance: 'official',
        sources: ['mh-klia-t1-passenger-journey'],
      },
    ],
    airlines: ['MH', 'OD', 'FY', 'NH', 'AI', 'BA', 'CX', 'EK', 'EY', 'KL', 'KE', 'QR', 'SQ', 'TK'],
  },
  {
    id: 'T2',
    name: lt('KLIA Terminal 2', 'KLIA Terminal 2'),
    shortName: lt('Terminal 2', 'Terminal 2'),
    levels: [],
    airlines: ['AK', 'D7'],
  },
];

interface Row {
  code: string;
  icao?: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  region: AirportRegion;
  lat: number;
  lon: number;
  unverified?: UnverifiedField[];
  note?: string;
  sources: string[];
}

const DEPTH_BY_CODE: Record<string, AirportDepth> = { KUL: 'full', PEN: 'full', BKI: 'full', KCH: 'full', LGK: 'full' };

const STATE_MS: Record<string, string> = {
  'Federal Territory of Labuan': 'Wilayah Persekutuan Labuan',
  Penang: 'Pulau Pinang',
};

/** Malay forms of place names that differ from English (draft, pending native review, OOS-14). */
const PLACE_MS: Record<string, string> = {
  Penang: 'Pulau Pinang',
  'Pangkor Island': 'Pulau Pangkor',
  'Redang Island': 'Pulau Redang',
  'Tioman Island': 'Pulau Tioman',
};

/** "Penang International Airport" → "Lapangan Terbang Antarabangsa Pulau Pinang" (D-09). */
function malayAirportName(name: string): string {
  const international = /^(.*) International Airport$/.exec(name);
  if (international) return `Lapangan Terbang Antarabangsa ${PLACE_MS[international[1]] ?? international[1]}`;
  const plain = /^(.*) Airport$/.exec(name);
  if (plain) return `Lapangan Terbang ${PLACE_MS[plain[1]] ?? plain[1]}`;
  return name;
}

function summaryFor(row: Row, classification: AirportClassification): LocalizedText {
  const stateMs = STATE_MS[row.state] ?? row.state;
  if (classification === 'international') {
    return lt(
      `${row.name} (${row.code}) in ${row.city}, ${row.state}, is one of the five international airports operated by Malaysia Airports.`,
      `${row.name} (${row.code}) di ${row.city}, ${stateMs}, ialah satu daripada lima lapangan terbang antarabangsa kendalian Malaysia Airports.`,
    );
  }
  if (classification === 'domestic') {
    return lt(
      `${row.name} (${row.code}) in ${row.city}, ${row.state}, is one of the 17 airports Malaysia Airports classifies as domestic.`,
      `${row.name} (${row.code}) di ${row.city}, ${stateMs}, ialah satu daripada 17 lapangan terbang yang dikelaskan sebagai domestik oleh Malaysia Airports.`,
    );
  }
  return lt(
    `${row.name} (${row.code}) is a short take-off and landing airport (STOLport) at ${row.city}, ${row.state}.`,
    `${row.name} (${row.code}) ialah lapangan terbang berlepas dan mendarat pendek (STOLport) di ${row.city}, ${stateMs}.`,
  );
}

function build(row: Row, classification: AirportClassification): Airport {
  const unverifiedFields = row.unverified ?? [];
  const depth: AirportDepth =
    DEPTH_BY_CODE[row.code] ?? (classification === 'stolport' ? 'listing' : 'essential');
  const airport: Airport = {
    code: row.code,
    slug: row.code.toLowerCase(),
    name: row.name,
    shortName: row.shortName,
    city: row.city,
    state: row.state,
    localName: lt(row.name, malayAirportName(row.name)),
    localShortName: lt(row.shortName, PLACE_MS[row.shortName] ?? row.shortName),
    localCity: lt(row.city, PLACE_MS[row.city] ?? row.city),
    localState: lt(row.state, STATE_MS[row.state] ?? row.state),
    region: row.region,
    classification,
    depth,
    timezone: AIRPORT_TIMEZONE,
    coordinates: { lat: row.lat, lon: row.lon, approximate: true },
    terminals: row.code === 'KUL' ? KUL_TERMINALS : [MAIN_TERMINAL],
    summary: summaryFor(row, classification),
    contacts: row.code === 'KUL' ? KUL_CONTACTS : GROUP_CONTACTS,
    verification: unverifiedFields.length === 0 ? 'verified' : 'unverified',
    unverifiedFields,
    asOf: AS_OF,
    asOfNote: AS_OF_NOTE,
    sources: row.sources,
  };
  if (row.icao) airport.icao = row.icao;
  if (row.note) airport.verificationNote = row.note;
  return airport;
}

const ICAO_PRIOR = 'The ICAO code comes from prior knowledge and was not re-confirmed in the research run.';
const AR = ['mahb-annual-report-2023', 'mahb-annual-report-2023-text'];
const INTL = [...AR, 'mahb-airports-site'];
const STOL_BORNEO = ['caam-ras-destinations', 'parlimen-st172-2025', 'wikipedia-airports-malaysia'];
const STOL_ISLAND = ['mahb-corporate-profile-copy'];
const STOL_PRIOR =
  'Name and codes come from prior knowledge at low confidence. Membership of the network rests on a derived list of the 17 STOLports.';

const INTERNATIONAL: Row[] = [
  { code: 'KUL', icao: 'WMKK', name: 'Kuala Lumpur International Airport', shortName: 'KLIA', city: 'Sepang', state: 'Selangor', region: 'peninsular', lat: 2.74, lon: 101.71, unverified: ['icao'], note: ICAO_PRIOR, sources: [...INTL, 'mahb-klia-t1-home'] },
  { code: 'PEN', icao: 'WMKP', name: 'Penang International Airport', shortName: 'Penang', city: 'Bayan Lepas', state: 'Penang', region: 'peninsular', lat: 5.3, lon: 100.27, sources: [...INTL, 'caam-eaip-wmkp', 'mahb-penang-site'] },
  { code: 'LGK', icao: 'WMKL', name: 'Langkawi International Airport', shortName: 'Langkawi', city: 'Langkawi', state: 'Kedah', region: 'peninsular', lat: 6.33, lon: 99.73, unverified: ['icao'], note: ICAO_PRIOR, sources: INTL },
  { code: 'BKI', icao: 'WBKK', name: 'Kota Kinabalu International Airport', shortName: 'Kota Kinabalu', city: 'Kota Kinabalu', state: 'Sabah', region: 'sabah', lat: 5.94, lon: 116.05, sources: [...INTL, 'caam-eaip-wbkk'] },
  { code: 'KCH', icao: 'WBGG', name: 'Kuching International Airport', shortName: 'Kuching', city: 'Kuching', state: 'Sarawak', region: 'sarawak', lat: 1.48, lon: 110.35, unverified: ['icao'], note: ICAO_PRIOR, sources: INTL },
];

const DOMESTIC: Row[] = [
  { code: 'SZB', icao: 'WMSA', name: 'Sultan Abdul Aziz Shah Airport', shortName: 'Subang', city: 'Subang', state: 'Selangor', region: 'peninsular', lat: 3.13, lon: 101.55, unverified: ['icao'], note: ICAO_PRIOR, sources: AR },
  { code: 'AOR', icao: 'WMKA', name: 'Sultan Abdul Halim Airport', shortName: 'Alor Setar', city: 'Alor Setar', state: 'Kedah', region: 'peninsular', lat: 6.19, lon: 100.4, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'wikipedia-aor'] },
  { code: 'IPH', icao: 'WMKI', name: 'Sultan Azlan Shah Airport', shortName: 'Ipoh', city: 'Ipoh', state: 'Perak', region: 'peninsular', lat: 4.57, lon: 101.09, sources: [...AR, 'fr24-iph'] },
  { code: 'KBR', icao: 'WMKC', name: 'Sultan Ismail Petra Airport', shortName: 'Kota Bharu', city: 'Kota Bharu', state: 'Kelantan', region: 'peninsular', lat: 6.17, lon: 102.29, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'thestar-kbr-full-operation-2026'] },
  { code: 'TGG', icao: 'WMKN', name: 'Sultan Mahmud Airport', shortName: 'Kuala Terengganu', city: 'Kuala Terengganu', state: 'Terengganu', region: 'peninsular', lat: 5.38, lon: 103.1, sources: [...AR, 'fr24-tgg'] },
  { code: 'KUA', icao: 'WMKD', name: 'Sultan Haji Ahmad Shah Airport', shortName: 'Kuantan', city: 'Kuantan', state: 'Pahang', region: 'peninsular', lat: 3.78, lon: 103.21, sources: [...AR, 'fr24-kua'] },
  { code: 'MKZ', icao: 'WMKM', name: 'Melaka International Airport', shortName: 'Melaka', city: 'Melaka', state: 'Melaka', region: 'peninsular', lat: 2.26, lon: 102.25, unverified: ['icao'], note: `${ICAO_PRIOR} Despite its name, Malaysia Airports classes this airport as domestic.`, sources: [...AR, 'skyscanner-mkz'] },
  { code: 'LBU', icao: 'WBKL', name: 'Labuan Airport', shortName: 'Labuan', city: 'Labuan', state: 'Federal Territory of Labuan', region: 'labuan', lat: 5.3, lon: 115.25, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'wikipedia-lbu'] },
  { code: 'LDU', icao: 'WBKD', name: 'Lahad Datu Airport', shortName: 'Lahad Datu', city: 'Lahad Datu', state: 'Sabah', region: 'sabah', lat: 5.03, lon: 118.32, unverified: ['code', 'icao'], note: 'IATA and ICAO codes come from prior knowledge and were not re-confirmed in the research run.', sources: AR },
  { code: 'SDK', icao: 'WBKS', name: 'Sandakan Airport', shortName: 'Sandakan', city: 'Sandakan', state: 'Sabah', region: 'sabah', lat: 5.9, lon: 118.06, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'wikipedia-sdk'] },
  { code: 'TWU', icao: 'WBKW', name: 'Tawau Airport', shortName: 'Tawau', city: 'Tawau', state: 'Sabah', region: 'sabah', lat: 4.31, lon: 118.12, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'wikipedia-twu'] },
  { code: 'BTU', icao: 'WBGB', name: 'Bintulu Airport', shortName: 'Bintulu', city: 'Bintulu', state: 'Sarawak', region: 'sarawak', lat: 3.12, lon: 113.02, sources: [...AR, 'fr24-btu'] },
  { code: 'LMN', icao: 'WBGJ', name: 'Limbang Airport', shortName: 'Limbang', city: 'Limbang', state: 'Sarawak', region: 'sarawak', lat: 4.81, lon: 115.01, sources: [...AR, 'fr24-lmn'] },
  { code: 'MYY', icao: 'WBGR', name: 'Miri Airport', shortName: 'Miri', city: 'Miri', state: 'Sarawak', region: 'sarawak', lat: 4.32, lon: 113.99, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'wikipedia-myy'] },
  { code: 'MKM', icao: 'WBGK', name: 'Mukah Airport', shortName: 'Mukah', city: 'Mukah', state: 'Sarawak', region: 'sarawak', lat: 2.88, lon: 112.08, unverified: ['code', 'icao'], note: 'IATA and ICAO codes come from prior knowledge and were not re-confirmed in the research run.', sources: AR },
  { code: 'MZV', icao: 'WBMU', name: 'Mulu Airport', shortName: 'Mulu', city: 'Mulu', state: 'Sarawak', region: 'sarawak', lat: 4.05, lon: 114.81, unverified: ['icao'], note: ICAO_PRIOR, sources: [...AR, 'navitime-mzv'] },
  { code: 'SBW', icao: 'WBGS', name: 'Sibu Airport', shortName: 'Sibu', city: 'Sibu', state: 'Sarawak', region: 'sarawak', lat: 2.26, lon: 111.99, sources: [...AR, 'fr24-sbw'] },
];

const STOLPORTS: Row[] = [
  { code: 'PKG', icao: 'WMPA', name: 'Pangkor Airport', shortName: 'Pangkor', city: 'Pangkor Island', state: 'Perak', region: 'peninsular', lat: 4.24, lon: 100.55, unverified: ['code', 'icao', 'name', 'network-membership'], note: STOL_PRIOR, sources: STOL_ISLAND },
  { code: 'RDN', icao: 'WMPR', name: 'Redang Airport', shortName: 'Redang', city: 'Redang Island', state: 'Terengganu', region: 'peninsular', lat: 5.77, lon: 103.01, unverified: ['code', 'icao', 'name', 'network-membership'], note: STOL_PRIOR, sources: STOL_ISLAND },
  { code: 'TOD', icao: 'WMBT', name: 'Tioman Airport', shortName: 'Tioman', city: 'Tioman Island', state: 'Pahang', region: 'peninsular', lat: 2.82, lon: 104.16, unverified: ['code', 'icao', 'name', 'network-membership'], note: STOL_PRIOR, sources: STOL_ISLAND },
  { code: 'KUD', icao: 'WBKT', name: 'Kudat Airport', shortName: 'Kudat', city: 'Kudat', state: 'Sabah', region: 'sabah', lat: 6.92, lon: 116.84, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
  { code: 'GSA', icao: 'WBKN', name: 'Long Pasia Airport', shortName: 'Long Pasia', city: 'Long Pasia', state: 'Sabah', region: 'sabah', lat: 4.4, lon: 115.72, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
  { code: 'SMM', icao: 'WBKA', name: 'Semporna Airport', shortName: 'Semporna', city: 'Semporna', state: 'Sabah', region: 'sabah', lat: 4.45, lon: 118.58, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
  { code: 'BKM', icao: 'WBGQ', name: "Ba'kelalan Airport", shortName: "Ba'kelalan", city: "Ba'kelalan", state: 'Sarawak', region: 'sarawak', lat: 3.97, lon: 115.62, sources: STOL_BORNEO },
  { code: 'BBN', icao: 'WBGZ', name: 'Bario Airport', shortName: 'Bario', city: 'Bario', state: 'Sarawak', region: 'sarawak', lat: 3.73, lon: 115.48, sources: STOL_BORNEO },
  { code: 'BLG', icao: 'WBGC', name: 'Belaga Airport', shortName: 'Belaga', city: 'Belaga', state: 'Sarawak', region: 'sarawak', lat: 2.65, lon: 113.77, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
  { code: 'KPI', icao: 'WBGP', name: 'Kapit Airport', shortName: 'Kapit', city: 'Kapit', state: 'Sarawak', region: 'sarawak', lat: 2.01, lon: 112.93, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
  { code: 'LWY', icao: 'WBGW', name: 'Lawas Airport', shortName: 'Lawas', city: 'Lawas', state: 'Sarawak', region: 'sarawak', lat: 4.85, lon: 115.41, unverified: ['icao'], note: 'The ICAO code comes from prior knowledge at low confidence.', sources: [...STOL_BORNEO, 'klia2info-miri'] },
  { code: 'LKH', name: 'Long Akah Airport', shortName: 'Long Akah', city: 'Long Akah', state: 'Sarawak', region: 'sarawak', lat: 3.3, lon: 114.78, unverified: ['code', 'icao'], note: 'The IATA code is low confidence and listings disagree on the ICAO code (WBGL or WBGA), so no ICAO code is published.', sources: STOL_BORNEO },
  { code: 'LBP', name: 'Long Banga Airport', shortName: 'Long Banga', city: 'Long Banga', state: 'Sarawak', region: 'sarawak', lat: 3.2, lon: 115.4, unverified: ['code', 'icao', 'name'], note: 'The IATA code comes from prior knowledge at low confidence and the ICAO code could not be verified, so no ICAO code is published.', sources: STOL_BORNEO },
  { code: 'LGL', icao: 'WBGF', name: 'Long Lellang Airport', shortName: 'Long Lellang', city: 'Long Lellang', state: 'Sarawak', region: 'sarawak', lat: 3.42, lon: 115.15, sources: STOL_BORNEO },
  { code: 'LSM', icao: 'WBGD', name: 'Long Semado Airport', shortName: 'Long Semado', city: 'Long Semado', state: 'Sarawak', region: 'sarawak', lat: 4.22, lon: 115.6, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
  { code: 'ODN', icao: 'WBGI', name: 'Long Seridan Airport', shortName: 'Long Seridan', city: 'Long Seridan', state: 'Sarawak', region: 'sarawak', lat: 3.97, lon: 115.07, sources: STOL_BORNEO },
  { code: 'MUR', icao: 'WBGM', name: 'Marudi Airport', shortName: 'Marudi', city: 'Marudi', state: 'Sarawak', region: 'sarawak', lat: 4.18, lon: 114.33, unverified: ['code', 'icao', 'name'], note: STOL_PRIOR, sources: STOL_BORNEO },
];

/**
 * All 39 airports: international first, then domestic, then STOLports, each group in the
 * order Malaysia Airports lists them.
 */
export const AIRPORTS: readonly Airport[] = [
  ...INTERNATIONAL.map((row) => build(row, 'international')),
  ...DOMESTIC.map((row) => build(row, 'domestic')),
  ...STOLPORTS.map((row) => build(row, 'stolport')),
];

const BY_SLUG: ReadonlyMap<string, Airport> = new Map(AIRPORTS.map((airport) => [airport.slug, airport]));

/** Slugs of the airports that get the most product depth and lead every chooser. */
export const FEATURED_AIRPORT_SLUGS = ['kul', 'pen', 'bki', 'kch', 'lgk', 'szb'] as const;

/** The six featured airports: KUL, PEN, BKI, KCH, LGK and SZB, in that order. */
export const FEATURED_AIRPORTS: readonly Airport[] = FEATURED_AIRPORT_SLUGS.map((slug) => BY_SLUG.get(slug) as Airport);

/** Look an airport up by slug (`kul`) or IATA code (`KUL`), case-insensitively. */
export function getAirport(slugOrCode: string | null | undefined): Airport | undefined {
  if (!slugOrCode) return undefined;
  return BY_SLUG.get(slugOrCode.trim().toLowerCase());
}

/** True when the string is a registered airport slug or code. */
export function isAirportSlug(value: string | null | undefined): boolean {
  return getAirport(value) !== undefined;
}

/** Airports grouped by Malaysia Airports' classification, in registry order. */
export function airportsByClassification(): Record<AirportClassification, Airport[]> {
  return {
    international: AIRPORTS.filter((airport) => airport.classification === 'international'),
    domestic: AIRPORTS.filter((airport) => airport.classification === 'domestic'),
    stolport: AIRPORTS.filter((airport) => airport.classification === 'stolport'),
  };
}

/** Airports grouped by region (Peninsular Malaysia, Sabah, Sarawak, Labuan). */
export function airportsByRegion(): Record<AirportRegion, Airport[]> {
  return {
    peninsular: AIRPORTS.filter((airport) => airport.region === 'peninsular'),
    sabah: AIRPORTS.filter((airport) => airport.region === 'sabah'),
    sarawak: AIRPORTS.filter((airport) => airport.region === 'sarawak'),
    labuan: AIRPORTS.filter((airport) => airport.region === 'labuan'),
  };
}

/** Labels for regions in both languages. */
export const REGION_LABELS: Record<AirportRegion, LocalizedText> = {
  peninsular: lt('Peninsular Malaysia', 'Semenanjung Malaysia'),
  sabah: lt('Sabah', 'Sabah'),
  sarawak: lt('Sarawak', 'Sarawak'),
  labuan: lt('Labuan', 'Labuan'),
};

/** Labels for classifications in both languages. */
export const CLASSIFICATION_LABELS: Record<AirportClassification, LocalizedText> = {
  international: lt('International airport', 'Lapangan terbang antarabangsa'),
  domestic: lt('Domestic airport', 'Lapangan terbang domestik'),
  stolport: lt('STOLport', 'STOLport'),
};

/**
 * Airport slugs for `generateStaticParams`. Pass depths to narrow the list, for example
 * `airportSlugs(['full', 'essential'])` for routes that STOLports do not get.
 */
export function airportSlugs(depths?: readonly AirportDepth[]): string[] {
  return AIRPORTS.filter((airport) => !depths || depths.includes(airport.depth)).map((airport) => airport.slug);
}

/** True for KLIA, the only airport with more than one terminal. */
export function isMultiTerminal(airport: Airport): boolean {
  return airport.terminals.length > 1;
}

/** A terminal of an airport, or undefined when the airport has no such terminal. */
export function getTerminal(airport: Airport, terminal: TerminalId | undefined): Terminal | undefined {
  return airport.terminals.find((item) => item.id === terminal);
}

/** The terminal assumed when none is chosen: the first one (T1 at KLIA, MAIN elsewhere). */
export function defaultTerminal(airport: Airport): Terminal {
  return airport.terminals[0];
}

/**
 * Human label for a terminal.
 *  - KLIA: "KLIA Terminal 1" (or "Terminal 1" with `short`).
 *  - Single-terminal airports: the airport's short name ("Penang"), because "MAIN" means nothing
 *    to a passenger; with `short` it is "Terminal".
 */
export function terminalLabel(
  airport: Airport | string,
  terminal: TerminalId | undefined,
  lang: Lang,
  options: { short?: boolean } = {},
): string {
  const record = typeof airport === 'string' ? getAirport(airport) : airport;
  if (!record) return '';
  const item = getTerminal(record, terminal) ?? defaultTerminal(record);
  if (!isMultiTerminal(record)) {
    return options.short ? pick(item.shortName, lang) : record.shortName;
  }
  return pick(options.short ? item.shortName : item.name, lang);
}

/** The user's chosen airport and, at KLIA, terminal. Stored by `useAirportContext`. */
export interface AirportSelection {
  /** Airport slug. */
  airport: string;
  /** Only set at KLIA. */
  terminal?: TerminalId;
}

/** One row of the airport switcher. */
export interface AirportChoice extends AirportSelection {
  /** Stable id: `kul-t1`, `kul-t2`, `pen`, ... */
  id: string;
  /** IATA code for the badge. */
  code: string;
  label: LocalizedText;
  /** City and state, for the second line. */
  detail: string;
  classification: AirportClassification;
  featured: boolean;
}

function choiceFor(airport: Airport, terminal?: Terminal): AirportChoice {
  const featured = (FEATURED_AIRPORT_SLUGS as readonly string[]).includes(airport.slug);
  const detail = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
  if (terminal) {
    return {
      id: `${airport.slug}-${terminal.id.toLowerCase()}`,
      airport: airport.slug,
      terminal: terminal.id,
      code: airport.code,
      label: terminal.name,
      detail,
      classification: airport.classification,
      featured,
    };
  }
  return {
    id: airport.slug,
    airport: airport.slug,
    code: airport.code,
    label: lt(airport.shortName),
    detail,
    classification: airport.classification,
    featured,
  };
}

/**
 * Choices for the airport switcher, featured airports first. KLIA Terminal 1 and KLIA Terminal 2
 * are separate choices that map to `{ airport: 'kul', terminal: 'T1' | 'T2' }`; every other
 * airport is one choice with no terminal.
 */
export const AIRPORT_CHOICES: readonly AirportChoice[] = [
  ...FEATURED_AIRPORTS,
  ...AIRPORTS.filter((airport) => !(FEATURED_AIRPORT_SLUGS as readonly string[]).includes(airport.slug)),
].flatMap((airport) =>
  isMultiTerminal(airport) ? airport.terminals.map((terminal) => choiceFor(airport, terminal)) : [choiceFor(airport)],
);

/** The switcher choice that matches a stored selection, if any. */
export function findAirportChoice(selection: AirportSelection | null | undefined): AirportChoice | undefined {
  if (!selection) return undefined;
  const sameAirport = AIRPORT_CHOICES.filter((choice) => choice.airport === selection.airport);
  return sameAirport.find((choice) => choice.terminal === selection.terminal) ?? sameAirport[0];
}

/**
 * The airport with its names, city and state in the reader's language (D-09). Wrap an airport
 * once where a page or component loads it, and everything it prints from these fields follows
 * the page language: `const airport = localizeAirport(getAirport(slug)!, lang)`.
 * Codes, slugs and every other field are unchanged, so lookups keep working.
 */
export function localizeAirport(airport: Airport, lang: Lang): Airport {
  if (lang === 'en') return airport;
  return {
    ...airport,
    ...(airport.localName ? { name: pick(airport.localName, lang) } : {}),
    ...(airport.localShortName ? { shortName: pick(airport.localShortName, lang) } : {}),
    ...(airport.localCity ? { city: pick(airport.localCity, lang) } : {}),
    ...(airport.localState ? { state: pick(airport.localState, lang) } : {}),
  };
}

/**
 * Kuala Lumpur International Airport (KUL): seed content.
 *
 * Where this comes from:
 *  - `docs/research/facts/f-klia-t1.json`: only facts with confidence high or medium AND evidence
 *    `search` or `direct`. Facts tagged `prior` or low confidence were left out (for example the
 *    rail station level, the Lost & Found location and phone, Wi-Fi details, the Food Garden).
 *  - The official parking page, read first hand on 16 November 2026
 *    (https://airports.malaysiaairports.com.my/en/klia1/parking). Parking RATES were not captured,
 *    so every car park has `rates: []` and `rateStatus: 'not-verified'`.
 *
 * Provenance rule used here: `official` when the fact comes from Malaysia Airports, an airline
 * speaking about itself, or an airport statement reported by the press; `estimated` when only
 * third-party guides or listings support it.
 *
 * Known gaps (see the research file): no verified outlets, no rail/taxi/e-hailing details, no
 * Terminal 2 content beyond the Calm Room, no facility locations for prayer rooms, clinics or
 * ATMs. Leave those empty until an official source is captured.
 */
import { createEdgeBuilder } from '@/lib/map/build';
import {
  defineAirportContent,
  lt,
  type AirlineAtAirport,
  type CarPark,
  type Facility,
  type GuideNote,
  type LocalizedText,
  type MapModel,
  type MapNode,
  type MapPoi,
  type Notice,
  type TransportOption,
} from '../types';

const PARKING_AS_OF = '2026-11-16';
const INDEXED = 'As indexed in November 2026';

/* -------------------------------------------------------------------------------------------
 * Facilities
 * ---------------------------------------------------------------------------------------- */

const facilities: Facility[] = [
  {
    id: 'kul-t1-calm-room',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Calm Room', 'Bilik Tenang'),
    category: 'calm-room',
    zone: 'unknown',
    level: 'L5',
    locationNote: lt('Level 5, Main Terminal Building.', 'Aras 5, Bangunan Terminal Utama.'),
    description: lt(
      'A quiet room for passengers with hidden disabilities, part of the Butterfly Effect programme. Parents or carers are asked to stay with and supervise children.',
      'Bilik senyap untuk penumpang dengan ketidakupayaan tersembunyi, sebahagian daripada program Butterfly Effect. Ibu bapa atau penjaga diminta menemani dan mengawasi kanak-kanak.',
    ),
    access: lt(
      'Entry uses an access code supplied in the Butterfly Kit.',
      'Masuk menggunakan kod akses yang diberikan dalam Butterfly Kit.',
    ),
    mapPoint: 'l5-calm-room',
    provenance: 'official',
    asOf: 'Launch coverage, 2020 to 2021',
    sources: ['mahb-butterfly-effect', 'says-calm-room-sensory-walls'],
  },
  {
    id: 'kul-t2-calm-room',
    airport: 'kul',
    terminal: 'T2',
    name: lt('Calm Room (Terminal 2)', 'Bilik Tenang (Terminal 2)'),
    category: 'calm-room',
    zone: 'unknown',
    locationNote: lt(
      'Mezzanine Floor (Level 3A) of the Departure Hall.',
      'Tingkat Mezanin (Aras 3A), Balai Berlepas.',
    ),
    description: lt(
      'A Calm Room for passengers with hidden disabilities opened at Terminal 2 in July 2025.',
      'Bilik Tenang untuk penumpang dengan ketidakupayaan tersembunyi dibuka di Terminal 2 pada Julai 2025.',
    ),
    provenance: 'official',
    asOf: '2025-07',
    sources: ['routesonline-calm-room-t2'],
  },
  {
    id: 'kul-butterfly-effect',
    airport: 'kul',
    terminal: 'T1',
    name: lt('The Butterfly Effect (hidden disabilities assistance)', 'The Butterfly Effect (bantuan ketidakupayaan tersembunyi)'),
    category: 'assistance',
    zone: 'both',
    description: lt(
      "KLIA's assistance programme for passengers with hidden disabilities such as autism, ADHD, global developmental delay and sensory processing disorder. It offers priority access at major airport touchpoints, a Calm Room and sensory walls.",
      'Program bantuan KLIA untuk penumpang dengan ketidakupayaan tersembunyi seperti autisme, ADHD, kelewatan perkembangan global dan gangguan pemprosesan deria. Ia menawarkan laluan keutamaan di titik utama lapangan terbang, Bilik Tenang dan dinding deria.',
    ),
    access: lt(
      'Register at the airport information counter to receive a Butterfly Kit with a Butterfly lanyard and the locations of the Calm Room and sensory walls.',
      'Daftar di kaunter pertanyaan lapangan terbang untuk menerima Butterfly Kit yang mengandungi lanyard Butterfly serta lokasi Bilik Tenang dan dinding deria.',
    ),
    provenance: 'official',
    asOf: '2025',
    sources: ['mahb-butterfly-effect', 'routesonline-calm-room-t2', 'ptt-butterfly-effect-2020'],
  },
  {
    id: 'kul-t1-sensory-walls',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Sensory walls', 'Dinding deria'),
    category: 'assistance',
    zone: 'unknown',
    description: lt(
      'Launch coverage reported six sensory walls in Terminal 1 (and four in Terminal 2). Their locations are given in the Butterfly Kit.',
      'Liputan pelancaran melaporkan enam dinding deria di Terminal 1 (dan empat di Terminal 2). Lokasinya dinyatakan dalam Butterfly Kit.',
    ),
    provenance: 'estimated',
    asOf: 'Launch coverage, 2020 to 2021',
    sources: ['says-calm-room-sensory-walls'],
  },
  {
    id: 'kul-t1-information-counter',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Airport information counter', 'Kaunter pertanyaan lapangan terbang'),
    category: 'information',
    zone: 'unknown',
    description: lt(
      'Staffed counter for questions and for Butterfly Effect registration. Its exact position is not yet verified in this prototype: check the official terminal map.',
      'Kaunter bertugas untuk pertanyaan dan pendaftaran Butterfly Effect. Kedudukan tepatnya belum disahkan dalam prototaip ini: rujuk peta terminal rasmi.',
    ),
    mapPoint: 'l5-information',
    provenance: 'official',
    asOf: '2025',
    sources: ['routesonline-calm-room-t2', 'mahb-klia-t1-map'],
  },
  {
    id: 'kul-t1-lost-and-found',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Lost & Found', 'Barang Hilang & Dijumpai'),
    category: 'lost-property',
    zone: 'unknown',
    description: lt(
      'Malaysia Airports runs a Lost & Found service for items lost in the terminal. Its location, hours and phone number are not yet verified in this prototype: use the official Lost & Found page. Missing checked baggage and items left on an aircraft are handled by your airline or its ground handler.',
      'Malaysia Airports mengendalikan perkhidmatan Barang Hilang & Dijumpai untuk barang yang hilang di terminal. Lokasi, waktu operasi dan nombor telefonnya belum disahkan dalam prototaip ini: gunakan halaman rasmi. Bagasi daftar masuk yang hilang dan barang tertinggal dalam pesawat dikendalikan oleh syarikat penerbangan anda atau pengendali daratnya.',
    ),
    bookingUrl: 'https://airports.malaysiaairports.com.my/airport-amenities/services/lost-found',
    provenance: 'official',
    asOf: INDEXED,
    sources: ['mahb-lost-found', 'mahb-klia-t1-help', 'kliainfo-lost-found'],
  },
  {
    id: 'kul-t1-prayer-rooms',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Prayer rooms (surau)', 'Surau'),
    category: 'prayer-room',
    zone: 'unknown',
    description: lt(
      'The official facilities page lists prayer rooms at Terminal 1. Locations and levels are not yet verified in this prototype: check the official terminal map or ask at an information counter.',
      'Halaman kemudahan rasmi menyenaraikan surau di Terminal 1. Lokasi dan aras belum disahkan dalam prototaip ini: rujuk peta terminal rasmi atau tanya di kaunter pertanyaan.',
    ),
    mapPoint: 'l5-prayer-room',
    provenance: 'official',
    asOf: INDEXED,
    sources: ['mahb-klia-t1-facilities'],
  },
  {
    id: 'kul-t1-medical-services',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Medical services', 'Perkhidmatan perubatan'),
    category: 'clinic',
    zone: 'unknown',
    description: lt(
      'The official facilities page lists medical services at Terminal 1. Location and hours are not yet verified in this prototype. In an emergency, alert any member of airport staff.',
      'Halaman kemudahan rasmi menyenaraikan perkhidmatan perubatan di Terminal 1. Lokasi dan waktu operasi belum disahkan dalam prototaip ini. Jika kecemasan, maklumkan mana-mana petugas lapangan terbang.',
    ),
    provenance: 'official',
    asOf: INDEXED,
    sources: ['mahb-klia-t1-facilities'],
  },
  {
    id: 'kul-t1-atms',
    airport: 'kul',
    terminal: 'T1',
    name: lt('ATMs', 'ATM'),
    category: 'atm',
    zone: 'unknown',
    description: lt(
      'The official facilities page lists ATMs at Terminal 1. Locations and banks are not yet verified in this prototype.',
      'Halaman kemudahan rasmi menyenaraikan ATM di Terminal 1. Lokasi dan bank belum disahkan dalam prototaip ini.',
    ),
    mapPoint: 'l3-atm',
    provenance: 'official',
    asOf: INDEXED,
    sources: ['mahb-klia-t1-facilities'],
  },
  {
    id: 'kul-t1-jungle-boardwalk',
    airport: 'kul',
    terminal: 'T1',
    name: lt('KLIA Jungle Boardwalk', 'KLIA Jungle Boardwalk'),
    category: 'other',
    zone: 'unknown',
    locationNote: lt('Satellite Building.', 'Bangunan Satelit.'),
    hours: {
      kind: 'daily',
      open: '07:00',
      close: '19:00',
      note: lt(
        "Hours from Malaysia Airports' Convergence magazine (undated). Current status not confirmed.",
        'Waktu daripada majalah Convergence Malaysia Airports (tanpa tarikh). Status semasa belum disahkan.',
      ),
    },
    description: lt(
      'A rainforest walk in the middle of the Satellite Building. Malaysia Airports announced in October 2023 that it had reopened after maintenance.',
      'Laluan hutan hujan di tengah Bangunan Satelit. Malaysia Airports mengumumkan pada Oktober 2023 bahawa ia dibuka semula selepas penyelenggaraan.',
    ),
    mapPoint: 'g-jungle-boardwalk',
    provenance: 'official',
    asOf: '2023-10',
    sources: ['mahb-tiktok-jungle-boardwalk', 'mahb-convergence-touch-of-zen'],
  },
  {
    id: 'kul-t1-plaza-premium-lounge',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Plaza Premium Lounge', 'Plaza Premium Lounge'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt(
      'Contact Pier, International Departures, Level 2, near Gate G.',
      'Contact Pier, Berlepas Antarabangsa, Aras 2, berhampiran Pintu G.',
    ),
    hours: {
      kind: '24h',
      note: lt('Listed as open 24 hours by a lounge directory.', 'Disenaraikan sebagai dibuka 24 jam oleh direktori lounge.'),
    },
    description: lt(
      'Pay-per-use lounge listed by lounge directories. Confirm access and opening with the operator before you travel.',
      'Lounge berbayar yang disenaraikan oleh direktori lounge. Sahkan akses dan waktu operasi dengan pengendali sebelum perjalanan.',
    ),
    operator: 'Plaza Premium Group',
    mapPoint: 'g-plaza-premium',
    provenance: 'estimated',
    asOf: 'Listing undated',
    sources: ['dragonpass-plaza-premium-kul', 'mahb-lounges-listing'],
  },
  {
    id: 'kul-t1-plaza-premium-first',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Plaza Premium First', 'Plaza Premium First'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt(
      'Contact Pier, International Departures, Level 2, near Gate G (same location as Plaza Premium Lounge).',
      'Contact Pier, Berlepas Antarabangsa, Aras 2, berhampiran Pintu G (lokasi sama dengan Plaza Premium Lounge).',
    ),
    description: lt(
      'Listed by lounge directories in the same location as Plaza Premium Lounge.',
      'Disenaraikan oleh direktori lounge di lokasi yang sama dengan Plaza Premium Lounge.',
    ),
    operator: 'Plaza Premium Group',
    mapPoint: 'g-plaza-premium-first',
    provenance: 'estimated',
    asOf: 'Listing undated',
    sources: ['layoverindex-kul-lounges', 'dragonpass-plaza-premium-kul'],
  },
  {
    id: 'kul-t1-golden-lounge-satellite',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Malaysia Airlines Golden Lounge (Satellite)', 'Golden Lounge Malaysia Airlines (Satelit)'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt('Satellite Building, mezzanine floor.', 'Bangunan Satelit, tingkat mezanin.'),
    description: lt(
      "Malaysia Airlines' lounge in the Satellite Building. Access rules are set by the airline.",
      'Lounge Malaysia Airlines di Bangunan Satelit. Syarat akses ditetapkan oleh syarikat penerbangan.',
    ),
    operator: 'Malaysia Airlines',
    mapPoint: 'g-golden-lounge-satellite',
    provenance: 'official',
    sources: ['mh-klia-t1-passenger-journey', 'loungereview-kul'],
  },
  {
    id: 'kul-t1-golden-lounge-regional',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Malaysia Airlines Golden Lounge (Regional)', 'Golden Lounge Malaysia Airlines (Serantau)'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt('Main terminal, at Gate H (listed as Level 4, mezzanine floor).', 'Terminal utama, di Pintu H (disenaraikan sebagai Aras 4, tingkat mezanin).'),
    description: lt(
      "Malaysia Airlines' lounge by the H gates. Access rules are set by the airline.",
      'Lounge Malaysia Airlines berhampiran pintu H. Syarat akses ditetapkan oleh syarikat penerbangan.',
    ),
    operator: 'Malaysia Airlines',
    mapPoint: 'g-golden-lounge-regional',
    provenance: 'official',
    sources: ['mh-klia-t1-passenger-journey', 'loungereview-kul'],
  },
  {
    id: 'kul-t1-golden-lounge-domestic',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Malaysia Airlines Golden Lounge (Domestic)', 'Golden Lounge Malaysia Airlines (Domestik)'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt('Gate A, Level 3.', 'Pintu A, Aras 3.'),
    description: lt(
      "Malaysia Airlines' lounge for domestic departures. Access rules are set by the airline.",
      'Lounge Malaysia Airlines untuk penerbangan domestik. Syarat akses ditetapkan oleh syarikat penerbangan.',
    ),
    operator: 'Malaysia Airlines',
    mapPoint: 'g-golden-lounge-domestic',
    provenance: 'official',
    sources: ['mh-klia-t1-passenger-journey', 'loungereview-kul'],
  },
  {
    id: 'kul-t1-sama-sama-express',
    airport: 'kul',
    terminal: 'T1',
    name: lt(
      'Sama-Sama Express KLIA Terminal 1 (airside transit hotel)',
      'Sama-Sama Express KLIA Terminal 1 (hotel transit kawasan udara)',
    ),
    category: 'hotel',
    zone: 'airside',
    locationNote: lt(
      'Satellite Building, mezzanine level, near Gate C5.',
      'Bangunan Satelit, aras mezanin, berhampiran Pintu C5.',
    ),
    description: lt(
      'Airside transit hotel. Listings say guests can reach it without clearing Malaysian immigration and do not have access to checked-in luggage during the stay. If you arrive at the G or H gates, travel to the Satellite Building first.',
      'Hotel transit di kawasan udara. Menurut penyenaraian, tetamu boleh sampai ke hotel tanpa melalui imigresen Malaysia dan tidak dapat mengakses bagasi daftar masuk sepanjang penginapan. Jika tiba di pintu G atau H, pergi ke Bangunan Satelit dahulu.',
    ),
    operator: 'Sama-Sama Hotels',
    mapPoint: 'g-sama-sama-express',
    provenance: 'estimated',
    asOf: 'Booking listings, undated',
    sources: ['booking-sama-sama-express', 'kliainfo-sama-sama-express'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Ground transport and movement inside the terminal
 * ---------------------------------------------------------------------------------------- */

const transport: TransportOption[] = [
  {
    id: 'kul-t1-aerotrain',
    airport: 'kul',
    mode: 'inter-terminal',
    name: lt('Aerotrain (Main Terminal Building to Satellite Building)', 'Aerotrain (Bangunan Terminal Utama ke Bangunan Satelit)'),
    operator: 'Malaysia Airports',
    description: lt(
      'The automated train inside Terminal 1 that links the Main Terminal Building with the Satellite Building, where the C gates are. The new Aerotrain began carrying passengers on 1 July 2025 and each three-car train carries up to 270 passengers.',
      'Tren automatik dalam Terminal 1 yang menghubungkan Bangunan Terminal Utama dengan Bangunan Satelit, lokasi pintu C. Aerotrain baharu mula membawa penumpang pada 1 Julai 2025 dan setiap tren tiga gerabak memuatkan sehingga 270 penumpang.',
    ),
    destinations: [
      {
        name: lt('Satellite Building (C gates)', 'Bangunan Satelit (pintu C)'),
        durationMinutes: 3,
        note: lt('Published as "under three minutes". Waiting time is not included.', 'Diterbitkan sebagai "kurang tiga minit". Tidak termasuk masa menunggu.'),
      },
    ],
    frequency: lt(
      'Two trains run through the day. One train runs between 00:00 and 05:00, the daily engineering hours.',
      'Dua tren beroperasi sepanjang hari. Satu tren beroperasi antara 00:00 dan 05:00, iaitu waktu kejuruteraan harian.',
    ),
    hours: {
      kind: '24h',
      note: lt(
        'Returned to 24-hour service on 1 June 2026. Planned overnight closures are listed under notices.',
        'Kembali beroperasi 24 jam pada 1 Jun 2026. Penutupan lewat malam yang dirancang disenaraikan di bawah notis.',
      ),
    },
    boarding: [
      {
        terminal: 'T1',
        note: lt(
          'Stations at the Main Terminal Building and the Satellite Building. If the Aerotrain is closed, follow the signs to the bus lounge for transfer buses or ask ground staff.',
          'Stesen di Bangunan Terminal Utama dan Bangunan Satelit. Jika Aerotrain ditutup, ikut papan tanda ke ruang menunggu bas untuk bas pemindahan atau tanya petugas.',
        ),
      },
    ],
    provenance: 'official',
    asOf: '2026-10-07',
    sources: [
      'paultan-aerotrain-resumes-2025',
      'fmt-aerotrain-24-hour-2026',
      'thestar-aerotrain-24-hour-2026',
      'malaymail-aerotrain-software-oct-2026',
      'mh-klia-t1-passenger-journey',
    ],
  },
  {
    id: 'kul-ltcp-shuttle',
    airport: 'kul',
    mode: 'shuttle',
    name: lt('Long Term Car Park shuttle', 'Bas ulang-alik Tempat Letak Kereta Jangka Panjang'),
    operator: 'Malaysia Airports',
    description: lt(
      'A complimentary shuttle links the Long Term Car Park (LTCP) with the terminals.',
      'Bas ulang-alik percuma menghubungkan Tempat Letak Kereta Jangka Panjang (LTCP) dengan terminal.',
    ),
    destinations: [
      {
        name: lt('Long Term Car Park to the terminals', 'Tempat Letak Kereta Jangka Panjang ke terminal'),
        fare: { amount: 0, currency: 'MYR', basis: 'per-person' },
        note: lt('Complimentary.', 'Percuma.'),
      },
    ],
    frequency: lt('Every 10 minutes.', 'Setiap 10 minit.'),
    frequencyMinutes: 10,
    boarding: [],
    provenance: 'official',
    asOf: PARKING_AS_OF,
    sources: ['mahb-klia-t1-parking'],
  },
  {
    id: 'kul-t1-buses',
    airport: 'kul',
    mode: 'bus',
    name: lt('Buses and coaches', 'Bas dan bas ekspres'),
    description: lt(
      'The bus terminal serving Terminal 1 is on Level 1. Routes, operators, fares and timetables are not yet verified in this prototype: check the official transport page.',
      'Terminal bas untuk Terminal 1 terletak di Aras 1. Laluan, pengendali, tambang dan jadual belum disahkan dalam prototaip ini: rujuk halaman pengangkutan rasmi.',
    ),
    destinations: [],
    boarding: [{ terminal: 'T1', level: 'L1', note: lt('Bus terminal, Level 1.', 'Terminal bas, Aras 1.') }],
    provenance: 'official',
    sources: ['ana-kuala-lumpur-guide', 'klia2info-level-guide'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Parking (official parking page, read first hand on 2026-11-16; rates not captured)
 * ---------------------------------------------------------------------------------------- */

const PARKING_BOOKING_URL = 'https://airports.malaysiaairports.com.my/en/klia1/parking';

const carParks: CarPark[] = [
  {
    id: 'kul-t1-car-park',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Terminal 1 Car Park', 'Tempat Letak Kereta Terminal 1'),
    type: 'terminal',
    description: lt(
      'Blocks A, B, C and D, connected to the Main Terminal Building. Online booking is offered on the official parking page.',
      'Blok A, B, C dan D, bersambung dengan Bangunan Terminal Utama. Tempahan dalam talian ditawarkan di halaman parkir rasmi.',
    ),
    bays: 5700,
    baysQualifier: 'over',
    walk: { note: lt('Connected to the Main Terminal Building.', 'Bersambung dengan Bangunan Terminal Utama.') },
    rates: [],
    rateStatus: 'not-verified',
    features: [
      lt('24/7 CCTV', 'CCTV 24 jam'),
      lt('Air-conditioned waiting lounge', 'Ruang menunggu berhawa dingin'),
      lt('Restaurants and cafes nearby', 'Restoran dan kafe berdekatan'),
      lt('Dedicated bays for families and ladies', 'Petak khas untuk keluarga dan wanita'),
    ],
    bookingUrl: PARKING_BOOKING_URL,
    provenance: 'official',
    asOf: PARKING_AS_OF,
    sources: ['mahb-klia-t1-parking'],
  },
  {
    id: 'kul-t1-preferred-parking',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Preferred Parking', 'Parkir Pilihan (Preferred Parking)'),
    type: 'preferred',
    description: lt(
      'Terminal 1 Car Park Level 2, Blocks B and C: the bays closest to the Main Terminal.',
      'Aras 2 Tempat Letak Kereta Terminal 1, Blok B dan C: petak paling hampir dengan Terminal Utama.',
    ),
    bays: 300,
    baysQualifier: 'over',
    walk: { note: lt('The bays closest to the Main Terminal.', 'Petak paling hampir dengan Terminal Utama.') },
    rates: [],
    rateStatus: 'not-verified',
    features: [],
    bookingUrl: PARKING_BOOKING_URL,
    provenance: 'official',
    asOf: PARKING_AS_OF,
    sources: ['mahb-klia-t1-parking'],
  },
  {
    id: 'kul-long-term-car-park',
    airport: 'kul',
    name: lt('Long Term Car Park (LTCP)', 'Tempat Letak Kereta Jangka Panjang (LTCP)'),
    type: 'long-term',
    description: lt(
      'For longer trips. A complimentary shuttle runs to the terminals every 10 minutes.',
      'Untuk perjalanan lebih lama. Bas ulang-alik percuma ke terminal setiap 10 minit.',
    ),
    bays: 5200,
    baysQualifier: 'over',
    walk: {
      note: lt('Complimentary shuttle to the terminals every 10 minutes.', 'Bas ulang-alik percuma ke terminal setiap 10 minit.'),
    },
    rates: [],
    rateStatus: 'not-verified',
    features: [lt('Complimentary shuttle to the terminals', 'Bas ulang-alik percuma ke terminal')],
    bookingUrl: PARKING_BOOKING_URL,
    provenance: 'official',
    asOf: PARKING_AS_OF,
    sources: ['mahb-klia-t1-parking'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Airlines (published facts only; the demo flight generator has its own illustrative list)
 * ---------------------------------------------------------------------------------------- */

const THIRD_PARTY_NOTE: LocalizedText = lt(
  'Listed at Terminal 1 by third-party terminal guides, not confirmed by the airline or the airport. Check your booking.',
  'Disenaraikan di Terminal 1 oleh panduan terminal pihak ketiga, belum disahkan oleh syarikat penerbangan atau lapangan terbang. Semak tempahan anda.',
);
const THIRD_PARTY_SOURCES = ['blacklane-klia-guide', 'klairport-info-klia', 'destinationkl-klia-vs-klia2'];

function thirdPartyAirline(code: string, name: string): AirlineAtAirport {
  return {
    code,
    name,
    terminal: 'T1',
    destinations: [],
    basis: 'third-party',
    note: THIRD_PARTY_NOTE,
    asOf: '2026',
    sources: THIRD_PARTY_SOURCES,
  };
}

const airlines: AirlineAtAirport[] = [
  {
    code: 'MH',
    name: 'Malaysia Airlines',
    terminal: 'T1',
    checkIn:
      'Level 5. International Economy: Row H, counters 1 to 18. International Business: Row D, counters 4 to 12 (Business Suite: counters 1 to 3). Domestic Economy: Row B, counters 1 to 18. Groups of 10 or more (international): counter C13. Self-service bag drop: counters F and G.',
    destinations: [],
    basis: 'airline',
    note: lt(
      'Malaysia Airlines says its counters at Terminal 1 are arranged by the airport authority based on daily conditions, so check the screens on the day.',
      'Malaysia Airlines menyatakan kaunternya di Terminal 1 disusun oleh pihak berkuasa lapangan terbang mengikut keadaan harian, jadi semak skrin pada hari perjalanan.',
    ),
    asOf: 'Page undated',
    sources: ['mh-klia-t1-passenger-journey'],
  },
  {
    code: 'NH',
    name: 'All Nippon Airways (ANA)',
    terminal: 'T1',
    destinations: [],
    basis: 'airline',
    sources: ['ana-kuala-lumpur-guide'],
  },
  {
    code: 'OD',
    name: 'Batik Air Malaysia',
    terminal: 'T1',
    destinations: [],
    basis: 'third-party',
    note: THIRD_PARTY_NOTE,
    asOf: '2026',
    sources: ['blacklane-klia-guide', 'klairport-info-klia', 'klia2info-airlines'],
  },
  {
    code: 'FY',
    name: 'Firefly',
    terminal: 'T1',
    destinations: [],
    basis: 'third-party',
    note: THIRD_PARTY_NOTE,
    asOf: '2026',
    sources: ['blacklane-klia-guide', 'klairport-info-klia', 'klia2info-airlines'],
  },
  thirdPartyAirline('AI', 'Air India'),
  thirdPartyAirline('BA', 'British Airways'),
  thirdPartyAirline('CX', 'Cathay Pacific'),
  thirdPartyAirline('EK', 'Emirates'),
  thirdPartyAirline('EY', 'Etihad Airways'),
  thirdPartyAirline('KL', 'KLM'),
  thirdPartyAirline('KE', 'Korean Air'),
  thirdPartyAirline('QR', 'Qatar Airways'),
  thirdPartyAirline('SQ', 'Singapore Airlines'),
  thirdPartyAirline('TK', 'Turkish Airlines'),
  {
    code: 'AK',
    name: 'AirAsia',
    terminal: 'T2',
    destinations: [],
    basis: 'third-party',
    note: lt(
      'Third-party guides say AirAsia and AirAsia X operate from Terminal 2, where they account for most flights. Check your booking.',
      'Panduan pihak ketiga menyatakan AirAsia dan AirAsia X beroperasi dari Terminal 2 dan mengendalikan kebanyakan penerbangan di situ. Semak tempahan anda.',
    ),
    asOf: '2026',
    sources: ['destinationkl-klia-vs-klia2'],
  },
  {
    code: 'D7',
    name: 'AirAsia X',
    terminal: 'T2',
    destinations: [],
    basis: 'third-party',
    note: lt(
      'Third-party guides say AirAsia and AirAsia X operate from Terminal 2, where they account for most flights. Check your booking.',
      'Panduan pihak ketiga menyatakan AirAsia dan AirAsia X beroperasi dari Terminal 2 dan mengendalikan kebanyakan penerbangan di situ. Semak tempahan anda.',
    ),
    asOf: '2026',
    sources: ['destinationkl-klia-vs-klia2'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Notices
 * ---------------------------------------------------------------------------------------- */

const notices: Notice[] = [
  {
    id: 'kul-aerotrain-software-update-nov-2026',
    airport: 'kul',
    terminal: 'T1',
    severity: 'advisory',
    title: lt(
      'Aerotrain not running between midnight and 5am, 28 November to 1 December',
      'Aerotrain tidak beroperasi antara tengah malam dan 5 pagi, 28 November hingga 1 Disember',
    ),
    body: lt(
      'A scheduled software update, subject to an independent safety assessment, means the Aerotrain between the Main Terminal Building and the Satellite Building (C gates) will be unavailable from 00:00 to 05:00 on these nights. Shuttle buses replace it: follow the signs to the bus lounge or ask ground staff, and allow extra time to reach a C gate.',
      'Kemas kini perisian berjadual, tertakluk kepada penilaian keselamatan bebas, bermakna Aerotrain antara Bangunan Terminal Utama dan Bangunan Satelit (pintu C) tidak beroperasi dari 00:00 hingga 05:00 pada malam-malam tersebut. Bas pemindahan disediakan: ikut papan tanda ke ruang menunggu bas atau tanya petugas, dan peruntukkan masa tambahan untuk ke pintu C.',
    ),
    validFrom: '2026-11-28T00:00:00+08:00',
    validTo: '2026-12-01T05:00:00+08:00',
    provenance: 'official',
    asOf: '2026-10-07',
    sources: ['malaymail-aerotrain-software-oct-2026', 'soyacincau-aerotrain-software-oct-2026'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Notes that the journey timeline and guides attach to their steps
 * ---------------------------------------------------------------------------------------- */

const guidesNotes: GuideNote[] = [
  {
    id: 'kul-two-terminals',
    airport: 'kul',
    topic: 'terminal',
    title: lt('One airport, two terminals', 'Satu lapangan terbang, dua terminal'),
    body: lt(
      'KLIA Terminal 1 (formerly KLIA) and KLIA Terminal 2 (formerly klia2) are separate buildings. Third-party guides describe Terminal 1 as the terminal for full-service airlines and Terminal 2 as used mainly by AirAsia and AirAsia X. Always confirm the terminal on your booking.',
      'KLIA Terminal 1 (dahulu KLIA) dan KLIA Terminal 2 (dahulu klia2) ialah bangunan berasingan. Panduan pihak ketiga menyifatkan Terminal 1 sebagai terminal syarikat penerbangan perkhidmatan penuh dan Terminal 2 digunakan terutamanya oleh AirAsia dan AirAsia X. Sentiasa sahkan terminal pada tempahan anda.',
    ),
    provenance: 'estimated',
    asOf: '2026',
    sources: ['klia2info-airlines', 'destinationkl-klia-vs-klia2', 'malaymail-klia-rebrand-2023'],
  },
  {
    id: 'kul-ltcp-shuttle-note',
    airport: 'kul',
    topic: 'getting-there',
    title: lt('Parking for a longer trip', 'Parkir untuk perjalanan lebih lama'),
    body: lt(
      'The Long Term Car Park has a complimentary shuttle to the terminals every 10 minutes. Allow time for the shuttle when you plan your arrival.',
      'Tempat Letak Kereta Jangka Panjang menyediakan bas ulang-alik percuma ke terminal setiap 10 minit. Ambil kira masa menaiki bas apabila merancang ketibaan anda.',
    ),
    provenance: 'official',
    asOf: PARKING_AS_OF,
    sources: ['mahb-klia-t1-parking'],
  },
  {
    id: 'kul-t1-check-in-level',
    airport: 'kul',
    topic: 'check-in',
    title: lt('Check-in is on Level 5', 'Daftar masuk di Aras 5'),
    body: lt(
      'The departure hall and check-in counters are on Level 5 of the Main Terminal Building.',
      'Balai berlepas dan kaunter daftar masuk terletak di Aras 5 Bangunan Terminal Utama.',
    ),
    appliesTo: { terminal: 'T1', direction: 'departing' },
    provenance: 'official',
    sources: ['mh-klia-t1-passenger-journey'],
  },
  {
    id: 'kul-t1-mh-check-in-rows',
    airport: 'kul',
    topic: 'check-in',
    title: lt('Malaysia Airlines check-in rows', 'Barisan daftar masuk Malaysia Airlines'),
    body: lt(
      'Malaysia Airlines lists international Economy at Row H (counters 1 to 18), international Business at Row D (counters 4 to 12), domestic Economy at Row B (counters 1 to 18) and self-service bag drop at counters F and G. Counters are arranged by the airport based on daily conditions, so check the screens when you arrive.',
      'Malaysia Airlines menyenaraikan Ekonomi antarabangsa di Barisan H (kaunter 1 hingga 18), Perniagaan antarabangsa di Barisan D (kaunter 4 hingga 12), Ekonomi domestik di Barisan B (kaunter 1 hingga 18) dan serahan bagasi layan diri di kaunter F dan G. Kaunter disusun oleh lapangan terbang mengikut keadaan harian, jadi semak skrin apabila anda tiba.',
    ),
    appliesTo: { terminal: 'T1', airline: 'MH', direction: 'departing' },
    provenance: 'official',
    asOf: 'Page undated',
    sources: ['mh-klia-t1-passenger-journey'],
  },
  {
    id: 'kul-t1-gates-c-satellite',
    airport: 'kul',
    topic: 'gate',
    title: lt('C gates are in the Satellite Building', 'Pintu C terletak di Bangunan Satelit'),
    body: lt(
      'Take the Aerotrain from the Main Terminal Building to the Satellite Building. The ride takes under three minutes; allow extra time for waiting and walking. If the Aerotrain is closed, follow the signs to the bus lounge for transfer buses.',
      'Naiki Aerotrain dari Bangunan Terminal Utama ke Bangunan Satelit. Perjalanan mengambil masa kurang tiga minit; peruntukkan masa tambahan untuk menunggu dan berjalan. Jika Aerotrain ditutup, ikut papan tanda ke ruang menunggu bas untuk bas pemindahan.',
    ),
    appliesTo: { terminal: 'T1', gatePrefixes: ['C'], direction: 'departing' },
    provenance: 'official',
    asOf: '2026-10-07',
    sources: ['malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025', 'mh-klia-t1-passenger-journey'],
  },
  {
    id: 'kul-t1-gates-g-h-contact-pier',
    airport: 'kul',
    topic: 'gate',
    title: lt('G and H gates are in the Contact Pier', 'Pintu G dan H terletak di Contact Pier'),
    body: lt(
      "The G and H gates are in the main terminal's Contact Pier and are used for international departures. You do not need the Aerotrain.",
      'Pintu G dan H terletak di Contact Pier terminal utama dan digunakan untuk penerbangan antarabangsa. Anda tidak perlu menaiki Aerotrain.',
    ),
    appliesTo: { terminal: 'T1', gatePrefixes: ['G', 'H'], direction: 'departing' },
    provenance: 'official',
    sources: ['mh-klia-t1-passenger-journey'],
  },
  {
    id: 'kul-t1-gates-a-b-domestic',
    airport: 'kul',
    topic: 'gate',
    title: lt('A and B gates are in the main terminal', 'Pintu A dan B terletak di terminal utama'),
    body: lt(
      'The A and B gates are in the main terminal and are the gates associated with domestic flights.',
      'Pintu A dan B terletak di terminal utama dan digunakan untuk penerbangan domestik.',
    ),
    appliesTo: { terminal: 'T1', gatePrefixes: ['A', 'B'], direction: 'departing' },
    provenance: 'official',
    sources: ['mh-klia-t1-passenger-journey', 'kliainfo-domestic-departures'],
  },
  {
    id: 'kul-autogate-mdac',
    airport: 'kul',
    topic: 'immigration',
    title: lt('Autogates and the Malaysia Digital Arrival Card', 'Autogate dan Kad Ketibaan Digital Malaysia'),
    body: lt(
      'Travel guides report that visitors from 63 countries and territories can use the immigration autogates with a machine-readable e-passport and a Malaysia Digital Arrival Card (MDAC) submitted within three days before arrival. Permanent residents and long-term pass holders are reported to be exempt from the MDAC. These rules change: confirm them with the Immigration Department of Malaysia before you fly.',
      'Panduan perjalanan melaporkan pelawat dari 63 negara dan wilayah boleh menggunakan autogate imigresen dengan e-pasport boleh baca mesin dan Kad Ketibaan Digital Malaysia (MDAC) yang dihantar dalam tempoh tiga hari sebelum ketibaan. Pemastautin tetap dan pemegang pas jangka panjang dilaporkan dikecualikan daripada MDAC. Peraturan ini boleh berubah: sahkan dengan Jabatan Imigresen Malaysia sebelum anda terbang.',
    ),
    appliesTo: { scope: 'international', direction: 'arriving' },
    provenance: 'estimated',
    asOf: '2026',
    sources: ['klia2info-layout-plan', 'traveloka-mdac'],
  },
  {
    id: 'kul-lost-baggage-airline',
    airport: 'kul',
    topic: 'baggage',
    title: lt('Missing bag?', 'Bagasi tidak sampai?'),
    body: lt(
      "Report missing checked baggage to your airline or its ground handler before you leave the baggage hall. The airport's Lost & Found handles items lost in the terminal, not checked baggage.",
      'Laporkan bagasi daftar masuk yang hilang kepada syarikat penerbangan anda atau pengendali daratnya sebelum meninggalkan balai bagasi. Barang Hilang & Dijumpai lapangan terbang mengendalikan barang yang hilang di terminal, bukan bagasi daftar masuk.',
    ),
    appliesTo: { direction: 'arriving' },
    provenance: 'estimated',
    sources: ['kliainfo-lost-found'],
  },
  {
    id: 'kul-t1-arrival-hall-level',
    airport: 'kul',
    topic: 'meeting',
    title: lt('The arrival hall is on Level 3', 'Balai ketibaan di Aras 3'),
    body: lt(
      'Third-party guides place the Terminal 1 arrival hall on Level 3 of the Main Terminal Building.',
      'Panduan pihak ketiga menyatakan balai ketibaan Terminal 1 terletak di Aras 3 Bangunan Terminal Utama.',
    ),
    appliesTo: { terminal: 'T1' },
    provenance: 'estimated',
    sources: ['klia2info-level-guide'],
  },
  {
    id: 'kul-t1-buses-level-1',
    airport: 'kul',
    topic: 'onward-transport',
    title: lt('Buses leave from Level 1', 'Bas bertolak dari Aras 1'),
    body: lt(
      'The bus terminal serving Terminal 1 is on Level 1.',
      'Terminal bas untuk Terminal 1 terletak di Aras 1.',
    ),
    appliesTo: { terminal: 'T1' },
    provenance: 'official',
    sources: ['ana-kuala-lumpur-guide', 'klia2info-level-guide'],
  },
  {
    id: 'kul-t1-transit-hotel',
    airport: 'kul',
    topic: 'transit',
    title: lt('Resting between flights', 'Berehat antara penerbangan'),
    body: lt(
      'Listings describe Sama-Sama Express in the Satellite Building as an airside transit hotel that guests can reach without clearing Malaysian immigration. Guests do not have access to checked-in luggage during the stay.',
      'Penyenaraian menyifatkan Sama-Sama Express di Bangunan Satelit sebagai hotel transit kawasan udara yang boleh dikunjungi tanpa melalui imigresen Malaysia. Tetamu tidak dapat mengakses bagasi daftar masuk sepanjang penginapan.',
    ),
    appliesTo: { terminal: 'T1' },
    provenance: 'estimated',
    sources: ['booking-sama-sama-express', 'kliainfo-sama-sama-express'],
  },
  {
    id: 'kul-butterfly-effect-note',
    airport: 'kul',
    topic: 'assistance',
    title: lt('Hidden disabilities: the Butterfly Effect', 'Ketidakupayaan tersembunyi: The Butterfly Effect'),
    body: lt(
      'Register at the airport information counter to receive a Butterfly Kit. The programme offers priority access at major airport touchpoints, a Calm Room and sensory walls.',
      'Daftar di kaunter pertanyaan lapangan terbang untuk menerima Butterfly Kit. Program ini menawarkan laluan keutamaan di titik utama lapangan terbang, Bilik Tenang dan dinding deria.',
    ),
    provenance: 'official',
    asOf: '2025',
    sources: ['mahb-butterfly-effect', 'routesonline-calm-room-t2'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Schematic map: KLIA Terminal 1
 *
 * A demonstration diagram, NOT a floor plan. Four schematic levels:
 *   L5    Departures (Level 5): kerb, check-in rows, screening
 *   L3    Arrivals (Level 3): immigration, baggage reclaim, customs, arrival hall
 *   L1    Transport (Level 1): bus terminal, car park and shuttle links
 *   GATES Airside concept: Contact Pier (gates A, B, G, H) and Satellite Building (C gates).
 *         The research does not give the floor of each gate area, so this level is a concept
 *         drawing rather than a numbered floor.
 * Positions and distances are illustrative. A point is `official` or `estimated` only when a
 * source supports that the place exists in that part of the terminal; everything else is `demo`.
 * ---------------------------------------------------------------------------------------- */

const MH_JOURNEY = ['mh-klia-t1-passenger-journey'];

type PoiInput = Omit<MapPoi, 'node'>;

/** Points of interest. Each gets a walk-graph node with the same id and position. */
const POI_INPUTS: PoiInput[] = [
  // Level 5: departures
  { id: 'l5-kerb', level: 'L5', zone: 'l5-kerb-zone', x: 500, y: 545, name: lt('Departures drop-off', 'Kawasan menurunkan penumpang berlepas'), kind: 'entrance', provenance: 'demo' },
  { id: 'l5-information', level: 'L5', zone: 'l5-hall', x: 500, y: 450, name: lt('Information counter (illustrative position)', 'Kaunter pertanyaan (kedudukan ilustrasi)'), kind: 'information', ref: { type: 'facility', id: 'kul-t1-information-counter' }, provenance: 'demo' },
  { id: 'l5-row-b', level: 'L5', zone: 'l5-hall', x: 180, y: 360, name: lt('Check-in Row B (Malaysia Airlines domestic Economy)', 'Barisan daftar masuk B (Ekonomi domestik Malaysia Airlines)'), kind: 'check-in', provenance: 'official', sources: MH_JOURNEY },
  { id: 'l5-row-d', level: 'L5', zone: 'l5-hall', x: 340, y: 360, name: lt('Check-in Row D (Malaysia Airlines Business)', 'Barisan daftar masuk D (Perniagaan Malaysia Airlines)'), kind: 'check-in', provenance: 'official', sources: MH_JOURNEY },
  { id: 'l5-rows-f-g', level: 'L5', zone: 'l5-hall', x: 500, y: 360, name: lt('Rows F and G (Malaysia Airlines self-service bag drop)', 'Barisan F dan G (serahan bagasi layan diri Malaysia Airlines)'), kind: 'check-in', provenance: 'official', sources: MH_JOURNEY },
  { id: 'l5-row-h', level: 'L5', zone: 'l5-hall', x: 660, y: 360, name: lt('Check-in Row H (Malaysia Airlines international Economy)', 'Barisan daftar masuk H (Ekonomi antarabangsa Malaysia Airlines)'), kind: 'check-in', provenance: 'official', sources: MH_JOURNEY },
  { id: 'l5-calm-room', level: 'L5', zone: 'l5-hall', x: 860, y: 300, name: lt('Calm Room', 'Bilik Tenang'), kind: 'calm-room', ref: { type: 'facility', id: 'kul-t1-calm-room' }, provenance: 'official', sources: ['mahb-butterfly-effect', 'says-calm-room-sensory-walls'] },
  { id: 'l5-lifts', level: 'L5', zone: 'l5-hall', x: 860, y: 450, name: lt('Lifts to Levels 3 and 1', 'Lif ke Aras 3 dan 1'), kind: 'lift', provenance: 'demo' },
  { id: 'l5-toilets', level: 'L5', zone: 'l5-hall', x: 140, y: 290, name: lt('Toilets (illustrative position)', 'Tandas (kedudukan ilustrasi)'), kind: 'toilet', provenance: 'demo' },
  { id: 'l5-prayer-room', level: 'L5', zone: 'l5-hall', x: 780, y: 250, name: lt('Prayer room (illustrative position)', 'Surau (kedudukan ilustrasi)'), kind: 'prayer-room', ref: { type: 'facility', id: 'kul-t1-prayer-rooms' }, provenance: 'demo' },
  { id: 'l5-screening-international', level: 'L5', zone: 'l5-screening', x: 580, y: 170, name: lt('Immigration and security (international departures)', 'Imigresen dan keselamatan (berlepas antarabangsa)'), kind: 'security', provenance: 'demo' },
  { id: 'l5-screening-domestic', level: 'L5', zone: 'l5-screening', x: 420, y: 170, name: lt('Security (domestic departures)', 'Keselamatan (berlepas domestik)'), kind: 'security', provenance: 'demo' },

  // Level 3: arrivals
  { id: 'l3-immigration', level: 'L3', zone: 'l3-arrivals-airside', x: 260, y: 170, name: lt('Arrival immigration', 'Imigresen ketibaan'), kind: 'immigration', provenance: 'demo' },
  { id: 'l3-baggage-reclaim', level: 'L3', zone: 'l3-arrivals-airside', x: 520, y: 210, name: lt('Baggage reclaim', 'Tuntutan bagasi'), kind: 'baggage-reclaim', provenance: 'demo' },
  { id: 'l3-customs', level: 'L3', zone: 'l3-arrivals-airside', x: 700, y: 270, name: lt('Customs', 'Kastam'), kind: 'customs', provenance: 'demo' },
  { id: 'l3-arrival-hall', level: 'L3', zone: 'l3-hall', x: 500, y: 400, name: lt('Arrival hall meeting point', 'Tempat menunggu balai ketibaan'), kind: 'meeting-point', provenance: 'estimated', sources: ['klia2info-level-guide'] },
  { id: 'l3-atm', level: 'L3', zone: 'l3-hall', x: 300, y: 440, name: lt('ATMs (illustrative position)', 'ATM (kedudukan ilustrasi)'), kind: 'atm', ref: { type: 'facility', id: 'kul-t1-atms' }, provenance: 'demo' },
  { id: 'l3-toilets', level: 'L3', zone: 'l3-hall', x: 140, y: 400, name: lt('Toilets (illustrative position)', 'Tandas (kedudukan ilustrasi)'), kind: 'toilet', provenance: 'demo' },
  { id: 'l3-lifts', level: 'L3', zone: 'l3-hall', x: 860, y: 450, name: lt('Lifts to Levels 5 and 1', 'Lif ke Aras 5 dan 1'), kind: 'lift', provenance: 'demo' },
  { id: 'l3-kerb', level: 'L3', zone: 'l3-kerb-zone', x: 500, y: 545, name: lt('Arrivals pick-up', 'Kawasan mengambil penumpang ketibaan'), kind: 'entrance', provenance: 'demo' },

  // Level 1: transport
  { id: 'l1-bus-terminal', level: 'L1', zone: 'l1-bus-zone', x: 300, y: 430, name: lt('Bus terminal', 'Terminal bas'), kind: 'bus', ref: { type: 'transport', id: 'kul-t1-buses' }, provenance: 'official', sources: ['ana-kuala-lumpur-guide', 'klia2info-level-guide'] },
  { id: 'l1-lifts', level: 'L1', zone: 'l1-links', x: 860, y: 450, name: lt('Lifts to Levels 3 and 5', 'Lif ke Aras 3 dan 5'), kind: 'lift', provenance: 'demo' },
  { id: 'l1-ltcp-shuttle', level: 'L1', zone: 'l1-links', x: 700, y: 490, name: lt('Long Term Car Park shuttle (illustrative position)', 'Bas ulang-alik LTCP (kedudukan ilustrasi)'), kind: 'shuttle', ref: { type: 'transport', id: 'kul-ltcp-shuttle' }, provenance: 'demo' },
  { id: 'l1-car-park-link', level: 'L1', zone: 'l1-links', x: 760, y: 380, name: lt('To Terminal 1 Car Park, Blocks A to D (illustrative position)', 'Ke Tempat Letak Kereta Terminal 1, Blok A hingga D (kedudukan ilustrasi)'), kind: 'parking', ref: { type: 'car-park', id: 'kul-t1-car-park' }, provenance: 'demo' },

  // Gates concept level: Contact Pier and Satellite Building
  { id: 'g-gates-a', level: 'GATES', zone: 'g-contact-pier', x: 160, y: 410, name: lt('Gates A (domestic)', 'Pintu A (domestik)'), kind: 'gate', provenance: 'official', sources: ['mh-klia-t1-passenger-journey', 'kliainfo-domestic-departures'] },
  { id: 'g-gates-b', level: 'GATES', zone: 'g-contact-pier', x: 300, y: 410, name: lt('Gates B (domestic)', 'Pintu B (domestik)'), kind: 'gate', provenance: 'official', sources: ['mh-klia-t1-passenger-journey', 'kliainfo-domestic-departures'] },
  { id: 'g-gates-g', level: 'GATES', zone: 'g-contact-pier', x: 700, y: 410, name: lt('Gates G (international)', 'Pintu G (antarabangsa)'), kind: 'gate', provenance: 'official', sources: MH_JOURNEY },
  { id: 'g-gates-h', level: 'GATES', zone: 'g-contact-pier', x: 840, y: 410, name: lt('Gates H (international)', 'Pintu H (antarabangsa)'), kind: 'gate', provenance: 'official', sources: MH_JOURNEY },
  { id: 'g-golden-lounge-domestic', level: 'GATES', zone: 'g-contact-pier', x: 160, y: 350, name: lt('Malaysia Airlines Golden Lounge (Domestic)', 'Golden Lounge Malaysia Airlines (Domestik)'), kind: 'lounge', ref: { type: 'facility', id: 'kul-t1-golden-lounge-domestic' }, provenance: 'official', sources: MH_JOURNEY },
  { id: 'g-plaza-premium', level: 'GATES', zone: 'g-contact-pier', x: 660, y: 350, name: lt('Plaza Premium Lounge', 'Plaza Premium Lounge'), kind: 'lounge', ref: { type: 'facility', id: 'kul-t1-plaza-premium-lounge' }, provenance: 'estimated', sources: ['dragonpass-plaza-premium-kul'] },
  { id: 'g-plaza-premium-first', level: 'GATES', zone: 'g-contact-pier', x: 740, y: 350, name: lt('Plaza Premium First', 'Plaza Premium First'), kind: 'lounge', ref: { type: 'facility', id: 'kul-t1-plaza-premium-first' }, provenance: 'estimated', sources: ['layoverindex-kul-lounges'] },
  { id: 'g-golden-lounge-regional', level: 'GATES', zone: 'g-contact-pier', x: 840, y: 350, name: lt('Malaysia Airlines Golden Lounge (Regional)', 'Golden Lounge Malaysia Airlines (Serantau)'), kind: 'lounge', ref: { type: 'facility', id: 'kul-t1-golden-lounge-regional' }, provenance: 'official', sources: MH_JOURNEY },
  { id: 'g-aerotrain-main', level: 'GATES', zone: 'g-contact-pier', x: 500, y: 350, name: lt('Aerotrain station (Main Terminal Building)', 'Stesen Aerotrain (Bangunan Terminal Utama)'), kind: 'train', ref: { type: 'transport', id: 'kul-t1-aerotrain' }, provenance: 'official', sources: ['malaymail-aerotrain-software-oct-2026', 'mh-klia-t1-passenger-journey'] },
  { id: 'g-bus-lounge', level: 'GATES', zone: 'g-contact-pier', x: 580, y: 370, name: lt('Bus lounge (transfer buses when the Aerotrain is closed)', 'Ruang menunggu bas (bas pemindahan semasa Aerotrain ditutup)'), kind: 'bus', provenance: 'official', sources: ['malaymail-aerotrain-software-oct-2026', 'soyacincau-aerotrain-software-oct-2026'] },
  { id: 'g-aerotrain-satellite', level: 'GATES', zone: 'g-satellite', x: 500, y: 215, name: lt('Aerotrain station (Satellite Building)', 'Stesen Aerotrain (Bangunan Satelit)'), kind: 'train', ref: { type: 'transport', id: 'kul-t1-aerotrain' }, provenance: 'official', sources: ['malaymail-aerotrain-software-oct-2026', 'mh-klia-t1-passenger-journey'] },
  { id: 'g-jungle-boardwalk', level: 'GATES', zone: 'g-satellite', x: 500, y: 150, name: lt('KLIA Jungle Boardwalk', 'KLIA Jungle Boardwalk'), kind: 'other', ref: { type: 'facility', id: 'kul-t1-jungle-boardwalk' }, provenance: 'official', sources: ['mahb-tiktok-jungle-boardwalk'] },
  { id: 'g-gates-c', level: 'GATES', zone: 'g-satellite', x: 500, y: 85, name: lt('Gates C (Satellite Building)', 'Pintu C (Bangunan Satelit)'), kind: 'gate', provenance: 'official', sources: ['malaymail-aerotrain-software-oct-2026', 'mh-klia-t1-passenger-journey'] },
  { id: 'g-golden-lounge-satellite', level: 'GATES', zone: 'g-satellite', x: 380, y: 150, name: lt('Malaysia Airlines Golden Lounge (Satellite)', 'Golden Lounge Malaysia Airlines (Satelit)'), kind: 'lounge', ref: { type: 'facility', id: 'kul-t1-golden-lounge-satellite' }, provenance: 'official', sources: MH_JOURNEY },
  { id: 'g-sama-sama-express', level: 'GATES', zone: 'g-satellite', x: 620, y: 150, name: lt('Sama-Sama Express (airside transit hotel)', 'Sama-Sama Express (hotel transit kawasan udara)'), kind: 'hotel', ref: { type: 'facility', id: 'kul-t1-sama-sama-express' }, provenance: 'estimated', sources: ['booking-sama-sama-express', 'kliainfo-sama-sama-express'] },
];

/** Junctions and connectors that are not points of interest. */
const JUNCTIONS: MapNode[] = [
  { id: 'l5-hall-west', level: 'L5', x: 220, y: 450 },
  { id: 'l5-hall-east', level: 'L5', x: 780, y: 450 },
  { id: 'l5-hall-north', level: 'L5', x: 500, y: 260 },
  { id: 'l5-escalators', level: 'L5', x: 140, y: 450 },
  { id: 'l3-escalators', level: 'L3', x: 140, y: 470 },
  { id: 'g-airside-international', level: 'GATES', x: 600, y: 440 },
  { id: 'g-airside-domestic', level: 'GATES', x: 400, y: 440 },
];

const NODES: MapNode[] = [...POI_INPUTS.map(({ id, level, x, y }) => ({ id, level, x, y })), ...JUNCTIONS];
const edge = createEdgeBuilder(NODES);

const KUL_T1_MAP: MapModel = {
  id: 'kul-t1-schematic',
  airport: 'kul',
  terminal: 'T1',
  name: lt('KLIA Terminal 1 schematic map', 'Peta skematik KLIA Terminal 1'),
  schematic: true,
  note: lt(
    'This is a schematic demonstration map, not a floor plan. Positions, distances and walking times are illustrative. For navigation use the official KLIA Terminal 1 map and the signs in the terminal.',
    'Ini peta demonstrasi skematik, bukan pelan lantai. Kedudukan, jarak dan masa berjalan adalah ilustrasi. Untuk navigasi, gunakan peta rasmi KLIA Terminal 1 dan papan tanda di terminal.',
  ),
  levels: [
    { id: 'L5', name: lt('Level 5: departures', 'Aras 5: berlepas'), order: 5 },
    { id: 'L3', name: lt('Level 3: arrivals', 'Aras 3: ketibaan'), order: 3 },
    { id: 'L1', name: lt('Level 1: transport', 'Aras 1: pengangkutan'), order: 1 },
    {
      id: 'GATES',
      name: lt('Gates: Contact Pier and Satellite', 'Pintu: Contact Pier dan Satelit'),
      order: 4,
      note: lt(
        'A concept view of the gate areas. The floor of each gate area is not published in our sources.',
        'Paparan konsep kawasan pintu. Aras bagi setiap kawasan pintu tidak diterbitkan dalam sumber kami.',
      ),
    },
  ],
  zones: [
    { id: 'l5-kerb-zone', level: 'L5', name: lt('Departures kerb', 'Laluan menurunkan penumpang'), kind: 'kerb', shape: { type: 'rect', x: 60, y: 520, width: 880, height: 50 } },
    { id: 'l5-hall', level: 'L5', name: lt('Departure hall and check-in', 'Balai berlepas dan daftar masuk'), kind: 'landside', shape: { type: 'rect', x: 60, y: 220, width: 880, height: 290 } },
    { id: 'l5-screening', level: 'L5', name: lt('Immigration and security', 'Imigresen dan keselamatan'), kind: 'airside', shape: { type: 'rect', x: 300, y: 130, width: 400, height: 80 } },
    { id: 'l3-arrivals-airside', level: 'L3', name: lt('Immigration, baggage reclaim and customs', 'Imigresen, tuntutan bagasi dan kastam'), kind: 'airside', shape: { type: 'rect', x: 60, y: 110, width: 880, height: 200 } },
    { id: 'l3-hall', level: 'L3', name: lt('Arrival hall', 'Balai ketibaan'), kind: 'landside', shape: { type: 'rect', x: 60, y: 320, width: 880, height: 190 } },
    { id: 'l3-kerb-zone', level: 'L3', name: lt('Arrivals kerb', 'Laluan mengambil penumpang'), kind: 'kerb', shape: { type: 'rect', x: 60, y: 520, width: 880, height: 50 } },
    { id: 'l1-bus-zone', level: 'L1', name: lt('Bus terminal', 'Terminal bas'), kind: 'transport', shape: { type: 'rect', x: 60, y: 330, width: 520, height: 200 } },
    { id: 'l1-links', level: 'L1', name: lt('Car park and shuttle links', 'Laluan ke tempat letak kereta dan bas ulang-alik'), kind: 'link', shape: { type: 'rect', x: 620, y: 330, width: 320, height: 200 } },
    { id: 'g-contact-pier', level: 'GATES', name: lt('Contact Pier: gates A, B, G and H', 'Contact Pier: pintu A, B, G dan H'), kind: 'pier', shape: { type: 'rect', x: 80, y: 320, width: 840, height: 150 } },
    { id: 'g-satellite', level: 'GATES', name: lt('Satellite Building: C gates', 'Bangunan Satelit: pintu C'), kind: 'satellite', shape: { type: 'polygon', points: [[500, 50], [720, 150], [500, 240], [280, 150]] } },
    { id: 'g-aerotrain-track', level: 'GATES', name: lt('Aerotrain', 'Aerotrain'), kind: 'link', shape: { type: 'rect', x: 485, y: 240, width: 30, height: 80 } },
  ],
  pois: POI_INPUTS.map((poi) => ({ ...poi, node: poi.id })),
  nodes: NODES,
  edges: [
    // Level 5
    edge('l5-kerb', 'l5-information'),
    edge('l5-information', 'l5-hall-west'),
    edge('l5-information', 'l5-hall-east'),
    edge('l5-information', 'l5-rows-f-g'),
    edge('l5-hall-west', 'l5-escalators'),
    edge('l5-hall-west', 'l5-row-b'),
    edge('l5-hall-west', 'l5-row-d'),
    edge('l5-hall-east', 'l5-row-h'),
    edge('l5-hall-east', 'l5-lifts'),
    edge('l5-row-b', 'l5-row-d'),
    edge('l5-row-d', 'l5-rows-f-g'),
    edge('l5-rows-f-g', 'l5-row-h'),
    edge('l5-row-b', 'l5-toilets'),
    edge('l5-row-h', 'l5-calm-room'),
    edge('l5-calm-room', 'l5-lifts'),
    edge('l5-row-h', 'l5-prayer-room'),
    edge('l5-row-d', 'l5-hall-north'),
    edge('l5-rows-f-g', 'l5-hall-north'),
    edge('l5-row-h', 'l5-hall-north'),
    edge('l5-hall-north', 'l5-prayer-room'),
    edge('l5-hall-north', 'l5-screening-international'),
    edge('l5-hall-north', 'l5-screening-domestic'),
    // Between levels
    edge('l5-lifts', 'l3-lifts', { kind: 'lift', metres: 10, fixedMinutes: 1.5 }),
    edge('l3-lifts', 'l1-lifts', { kind: 'lift', metres: 10, fixedMinutes: 1.5 }),
    edge('l5-escalators', 'l3-escalators', { kind: 'escalator', metres: 30, accessible: false }),
    edge('l5-screening-international', 'g-airside-international', { metres: 120 }),
    edge('l5-screening-domestic', 'g-airside-domestic', { metres: 120 }),
    edge('g-airside-international', 'l3-immigration', { metres: 200 }),
    edge('g-airside-domestic', 'l3-baggage-reclaim', { metres: 180 }),
    // Level 3
    edge('l3-immigration', 'l3-baggage-reclaim'),
    edge('l3-baggage-reclaim', 'l3-customs'),
    edge('l3-customs', 'l3-arrival-hall'),
    edge('l3-arrival-hall', 'l3-atm'),
    edge('l3-atm', 'l3-toilets'),
    edge('l3-atm', 'l3-escalators'),
    edge('l3-arrival-hall', 'l3-lifts'),
    edge('l3-arrival-hall', 'l3-kerb'),
    // Level 1
    edge('l1-lifts', 'l1-car-park-link'),
    edge('l1-lifts', 'l1-ltcp-shuttle'),
    edge('l1-ltcp-shuttle', 'l1-bus-terminal'),
    edge('l1-car-park-link', 'l1-bus-terminal'),
    // Gates: Contact Pier
    edge('g-airside-domestic', 'g-gates-b'),
    edge('g-gates-b', 'g-gates-a'),
    edge('g-gates-a', 'g-golden-lounge-domestic'),
    edge('g-airside-international', 'g-gates-g'),
    edge('g-gates-g', 'g-gates-h'),
    edge('g-gates-g', 'g-plaza-premium'),
    edge('g-gates-g', 'g-plaza-premium-first'),
    edge('g-gates-h', 'g-golden-lounge-regional'),
    edge('g-airside-international', 'g-aerotrain-main'),
    edge('g-airside-international', 'g-bus-lounge'),
    // Gates: Aerotrain and Satellite
    edge('g-aerotrain-main', 'g-aerotrain-satellite', {
      kind: 'train',
      metres: 0,
      fixedMinutes: 3,
      note: lt(
        'Aerotrain ride, published as under three minutes. Waiting time is not included.',
        'Perjalanan Aerotrain, diterbitkan sebagai kurang tiga minit. Tidak termasuk masa menunggu.',
      ),
    }),
    edge('g-aerotrain-satellite', 'g-jungle-boardwalk'),
    edge('g-jungle-boardwalk', 'g-gates-c'),
    edge('g-jungle-boardwalk', 'g-golden-lounge-satellite'),
    edge('g-jungle-boardwalk', 'g-sama-sama-express'),
    edge('g-gates-c', 'g-sama-sama-express'),
    edge('g-gates-c', 'g-golden-lounge-satellite'),
  ],
  asOf: '2026-11-16',
  sources: ['mh-klia-t1-passenger-journey', 'malaymail-aerotrain-software-oct-2026', 'klia2info-level-guide', 'mahb-klia-t1-map'],
};

/** Everything published about KUL. Registered in `src/content/index.ts`. */
export const KUL_CONTENT = defineAirportContent({
  airport: 'kul',
  facilities,
  outlets: [],
  transport,
  carParks,
  airlines,
  notices,
  maps: [KUL_T1_MAP],
  guidesNotes,
});

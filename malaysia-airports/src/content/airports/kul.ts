/**
 * Kuala Lumpur International Airport (KUL): KLIA Terminal 1 and Terminal 2.
 *
 * Where this comes from:
 *  - `docs/research/facts/f-klia-t1.json`: only facts with confidence high or medium AND evidence
 *    `search` or `direct`. Facts tagged `prior` or low confidence were left out (for example the
 *    rail station level, the Lost & Found location and phone, Wi-Fi details, the Food Garden).
 *  - `docs/research/facts/f-klia-transport.md` (search summaries of 17 November 2026): rail, coach,
 *    taxi, e-hailing, inter-terminal transfer, parking figures and the Malaysia Digital Arrival Card.
 *  - The official parking page, read first hand on 16 November 2026
 *    (https://airports.malaysiaairports.com.my/en/klia1/parking): bays, blocks and features.
 *
 * Provenance rule used here: `official` when the core fact comes from Malaysia Airports, an airline
 * or operator speaking about itself, the government, or such a statement reported by the press;
 * `estimated` when only third-party guides or listings support it. Details that rest on guides
 * inside an `official` item say so in the text.
 *
 * Fares and rates:
 *  - The fare model has no validity dates, so the KLIA Ekspres fare change of 1 January 2027 is
 *    two destination entries with the dates in their names, plus a notice that expires at the
 *    change. KLIA Transit fares are known only for 2027, so they stay in notes (no `fare`).
 *  - Parking: every KLIA car park is `rateStatus: 'not-verified'` with `rates: []`, because the
 *    sources conflict or are partial. The figures found are quoted in each `description` with
 *    who gives them. The one firm figure is the Long Term Car Park daily maximum (`dailyMax: 32`).
 *  - Coach and taxi fares: the research rates the figures "low to medium", so no structured `fare`
 *    is set (the transport comparison treats a `fare` as a published number). The ranges that
 *    guides and booking sites quote stay in the destination notes, marked indicative.
 *  - Where the research records a conflict, both figures are given in prose and nothing is
 *    machine-readable: the inter-terminal shuttle frequency, the Jungle Boardwalk opening hours and
 *    the number of nationalities that may use the autogates.
 *
 * Sources: KLIA sources captured on 16 November 2026 are in `../sources.ts`; those captured on
 * 17 November 2026 are in `KUL_SOURCES` below. Seven of them are publisher-level only, because the
 * research file names the publisher but records no article link; their titles say so.
 *
 * Known gaps (also published as the guide note `kul-content-gaps`): no verified outlets; no first
 * or last train times or rail frequency; no train time between terminals; no current KLIA Transit
 * fares; no coach fares by operator or boarding bays; no official taxi fare table; no official
 * parking rate cards; no official autogate nationality list; no
 * Terminal 2 facilities beyond the Calm Room and sensory walls; no facility locations for prayer
 * rooms, clinics or ATMs. Leave those empty until an official source is captured.
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
  type Source,
  type TransportOption,
} from '../types';

const PARKING_AS_OF = '2026-11-16';
const INDEXED = 'As indexed in November 2026';
/** For facts whose source carries no date: the research run found them on 16 November 2026. */
const UNDATED = 'Source undated; checked 16 November 2026';
/** Date of the search summaries in `f-klia-transport.md`. */
const TRANSPORT_AS_OF = '2026-11-17';
const STATION_LEVEL_NOT_VERIFIED_T1: LocalizedText = lt(
  'Trains call at Terminal 1. The station level is not verified in this prototype: follow the signs to the trains.',
  'Tren berhenti di Terminal 1. Aras stesen belum disahkan dalam prototaip ini: ikut papan tanda ke tren.',
);
const STATION_LEVEL_NOT_VERIFIED_T2: LocalizedText = lt(
  'Trains call at Terminal 2. The station level is not verified in this prototype: follow the signs to the trains.',
  'Tren berhenti di Terminal 2. Aras stesen belum disahkan dalam prototaip ini: ikut papan tanda ke tren.',
);

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
    id: 'kul-t2-sensory-walls',
    airport: 'kul',
    terminal: 'T2',
    name: lt('Sensory walls (Terminal 2)', 'Dinding deria (Terminal 2)'),
    category: 'assistance',
    zone: 'unknown',
    description: lt(
      'Launch coverage reported four sensory walls in Terminal 2. Their locations are given in the Butterfly Kit.',
      'Liputan pelancaran melaporkan empat dinding deria di Terminal 2. Lokasinya dinyatakan dalam Butterfly Kit.',
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
      kind: 'text',
      text: lt(
        "Sources differ: Malaysia Airports' Convergence magazine (undated) gives 07:00 to 19:00 daily, and a third-party social media post (link not recorded) gives 08:00 to 19:00. Whether it is open now is not confirmed: ask at an information counter.",
        'Sumber berbeza: majalah Convergence Malaysia Airports (tanpa tarikh) menyatakan 07:00 hingga 19:00 setiap hari, dan satu hantaran media sosial pihak ketiga (pautan tidak direkodkan) menyatakan 08:00 hingga 19:00. Sama ada ia dibuka sekarang belum disahkan: tanya di kaunter pertanyaan.',
      ),
    },
    description: lt(
      'A boardwalk through rainforest planting in the Satellite Building. Malaysia Airports announced in October 2023 that it had reopened after maintenance.',
      'Laluan pejalan kaki merentas tanaman hutan hujan di Bangunan Satelit. Malaysia Airports mengumumkan pada Oktober 2023 bahawa ia dibuka semula selepas penyelenggaraan.',
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
      'Listed by lounge-network directories, not by the operator. Confirm access and opening with the operator before you travel.',
      'Disenaraikan oleh direktori rangkaian lounge, bukan oleh pengendali. Sahkan akses dan waktu operasi dengan pengendali sebelum perjalanan.',
    ),
    operator: 'Plaza Premium',
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
    operator: 'Plaza Premium',
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
    asOf: UNDATED,
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
    asOf: UNDATED,
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
    asOf: UNDATED,
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
      'Airport coaches link KLIA with KL Sentral. Booking sites name Aerobus, SkyBus and Airport Coach among the operators. The bus terminal serving Terminal 1 is on Level 1; the boarding bay there and the boarding point at Terminal 2 are not verified in this prototype. Each operator sets its own fares and timetable: check with the operator before you travel.',
      'Bas ekspres lapangan terbang menghubungkan KLIA dengan KL Sentral. Laman tempahan menamakan Aerobus, SkyBus dan Airport Coach antara pengendalinya. Terminal bas untuk Terminal 1 terletak di Aras 1; petak menaiki bas di situ dan tempat menaiki bas di Terminal 2 belum disahkan dalam prototaip ini. Setiap pengendali menetapkan tambang dan jadual sendiri: semak dengan pengendali sebelum perjalanan.',
    ),
    destinations: [
      {
        name: lt('KL Sentral', 'KL Sentral'),
        note: lt(
          'No fare is published here, because we have no operator fare table. Booking sites quoted about RM12 to RM18 one way in 2026, depending on the operator. Indicative only: check with the operator.',
          'Tiada tambang diterbitkan di sini kerana kami tiada jadual tambang pengendali. Laman tempahan menyebut kira-kira RM12 hingga RM18 sehala pada 2026, bergantung pada pengendali. Anggaran sahaja: semak dengan pengendali.',
        ),
      },
    ],
    boarding: [{ terminal: 'T1', level: 'L1', note: lt('Bus terminal, Level 1.', 'Terminal bas, Aras 1.') }],
    provenance: 'estimated',
    asOf: '2026',
    sources: ['ana-kuala-lumpur-guide', 'klia2info-level-guide', 'busonlineticket-airport-coach'],
  },
  {
    id: 'kul-klia-ekspres',
    airport: 'kul',
    mode: 'rail',
    name: lt('KLIA Ekspres (non-stop train to KL Sentral)', 'KLIA Ekspres (tren tanpa henti ke KL Sentral)'),
    operator: 'Express Rail Link',
    description: lt(
      'The non-stop airport train between KL Sentral and both KLIA terminals. The adult fare rises on 1 January 2027, so both fares are listed with their dates. Sources disagree on the last train and we have no sourced frequency, so neither is published here: check kliaekspres.com before you travel.',
      'Tren lapangan terbang tanpa henti antara KL Sentral dan kedua-dua terminal KLIA. Tambang dewasa naik pada 1 Januari 2027, jadi kedua-dua tambang disenaraikan bersama tarikhnya. Sumber berbeza tentang tren terakhir dan kami tiada kekerapan yang bersumber, jadi kedua-duanya tidak diterbitkan di sini: semak kliaekspres.com sebelum perjalanan.',
    ),
    destinations: [
      {
        name: lt('KL Sentral (fare until 31 December 2026)', 'KL Sentral (tambang hingga 31 Disember 2026)'),
        fare: { amount: 55, currency: 'MYR', basis: 'per-person' },
        durationMinutes: 28,
        note: lt(
          'Adult one-way fare, valid until 31 December 2026. A travel guide gives the non-stop journey as about 28 minutes.',
          'Tambang dewasa sehala, sah hingga 31 Disember 2026. Sebuah panduan perjalanan menyatakan perjalanan tanpa henti mengambil kira-kira 28 minit.',
        ),
      },
      {
        name: lt('KL Sentral (fare from 1 January 2027)', 'KL Sentral (tambang mulai 1 Januari 2027)'),
        fare: { amount: 65, currency: 'MYR', basis: 'per-person' },
        durationMinutes: 28,
        note: lt(
          'Adult one-way fare from 1 January 2027, as reported in October 2026. Also reported from that date: return RM118, child RM29, children under 6 free.',
          'Tambang dewasa sehala mulai 1 Januari 2027, seperti dilaporkan pada Oktober 2026. Turut dilaporkan mulai tarikh itu: pergi balik RM118, kanak-kanak RM29, kanak-kanak bawah 6 tahun percuma.',
        ),
      },
    ],
    boarding: [
      { terminal: 'T1', note: STATION_LEVEL_NOT_VERIFIED_T1 },
      { terminal: 'T2', note: STATION_LEVEL_NOT_VERIFIED_T2 },
    ],
    provenance: 'official',
    asOf: '2026-10-01',
    sources: [
      'thestar-klia-ekspres-fares-2027',
      'businesstoday-klia-ekspres-fares-2027',
      'soyacincau-klia-ekspres-fares-2027',
      'wego-klia-to-city',
    ],
  },
  {
    id: 'kul-klia-transit',
    airport: 'kul',
    mode: 'rail',
    name: lt('KLIA Transit (stopping train)', 'KLIA Transit (tren berhenti di stesen perantaraan)'),
    operator: 'Express Rail Link',
    description: lt(
      'The stopping service on the airport line. The operator lists its stops as Bandar Tasik Selatan, Putrajaya & Cyberjaya and Salak Tinggi. Fares in force today are not in our sources, so no fare is shown; the adult fares reported for 1 January 2027 are noted against each stop. For the timetable, check kliaekspres.com.',
      'Perkhidmatan berhenti-henti di laluan lapangan terbang. Pengendali menyenaraikan hentiannya sebagai Bandar Tasik Selatan, Putrajaya & Cyberjaya dan Salak Tinggi. Tambang semasa tiada dalam sumber kami, jadi tiada tambang dipaparkan; tambang dewasa yang dilaporkan mulai 1 Januari 2027 dicatat pada setiap hentian. Untuk jadual, semak kliaekspres.com.',
    ),
    destinations: [
      {
        name: lt('Bandar Tasik Selatan', 'Bandar Tasik Selatan'),
        note: lt(
          'Adult fare to KLIA reported as RM45.40 from 1 January 2027. The fare until then is not in our sources.',
          'Tambang dewasa ke KLIA dilaporkan RM45.40 mulai 1 Januari 2027. Tambang sebelum tarikh itu tiada dalam sumber kami.',
        ),
      },
      {
        name: lt('Putrajaya & Cyberjaya', 'Putrajaya & Cyberjaya'),
        note: lt(
          'Adult fare to KLIA reported as RM11.50 from 1 January 2027. The fare until then is not in our sources.',
          'Tambang dewasa ke KLIA dilaporkan RM11.50 mulai 1 Januari 2027. Tambang sebelum tarikh itu tiada dalam sumber kami.',
        ),
      },
      {
        name: lt('Salak Tinggi', 'Salak Tinggi'),
        note: lt(
          'Adult fare to KLIA reported as RM5.80 from 1 January 2027. The fare until then is not in our sources.',
          'Tambang dewasa ke KLIA dilaporkan RM5.80 mulai 1 Januari 2027. Tambang sebelum tarikh itu tiada dalam sumber kami.',
        ),
      },
    ],
    boarding: [
      { terminal: 'T1', note: STATION_LEVEL_NOT_VERIFIED_T1 },
      { terminal: 'T2', note: STATION_LEVEL_NOT_VERIFIED_T2 },
    ],
    provenance: 'official',
    asOf: '2026-10-01',
    sources: ['erl-klia-transit-product', 'soyacincau-klia-ekspres-fares-2027'],
  },
  {
    id: 'kul-coupon-taxi',
    airport: 'kul',
    mode: 'taxi',
    name: lt('Airport taxi (prepaid coupon)', 'Teksi lapangan terbang (kupon prabayar)'),
    description: lt(
      'Airport taxis are paid for by coupon at a counter before you ride. Search summaries of the official taxi information list counters in the International Arrival Hall, in the Main Terminal Building and at Domestic Baggage Reclaim on the arrival level. We have not captured the official fare table, so no fare is published here: the coupon counter gives the fare for your destination.',
      'Teksi lapangan terbang dibayar dengan kupon di kaunter sebelum menaiki teksi. Ringkasan carian maklumat teksi rasmi menyenaraikan kaunter di Balai Ketibaan Antarabangsa, di Bangunan Terminal Utama dan di Tuntutan Bagasi Domestik di aras ketibaan. Jadual tambang rasmi belum kami peroleh, jadi tiada tambang diterbitkan di sini: kaunter kupon memberikan tambang bagi destinasi anda.',
    ),
    destinations: [
      {
        name: lt('Kuala Lumpur city zone (KLCC, Bukit Bintang)', 'Zon bandar raya Kuala Lumpur (KLCC, Bukit Bintang)'),
        note: lt(
          'No fare is published here. Travel guides in 2026 quote about RM75 for a budget taxi to the city zone, and RM70 to RM100 to KLCC or Bukit Bintang for a sedan. Indicative only: the coupon counter gives the fare.',
          'Tiada tambang diterbitkan di sini. Panduan perjalanan 2026 menyebut kira-kira RM75 bagi teksi bajet ke zon bandar raya, dan RM70 hingga RM100 ke KLCC atau Bukit Bintang bagi sedan. Anggaran sahaja: kaunter kupon memberikan tambang.',
        ),
      },
    ],
    boarding: [
      {
        terminal: 'T1',
        note: lt(
          'Coupon counters: International Arrival Hall; Main Terminal Building; Domestic Baggage Reclaim, arrival level.',
          'Kaunter kupon: Balai Ketibaan Antarabangsa; Bangunan Terminal Utama; Tuntutan Bagasi Domestik, aras ketibaan.',
        ),
      },
    ],
    provenance: 'estimated',
    asOf: '2026',
    sources: ['wego-klia-to-city', 'mahb-klia-taxi'],
  },
  {
    id: 'kul-e-hailing',
    airport: 'kul',
    mode: 'e-hailing',
    name: lt('E-hailing (Grab and other apps)', 'E-hailing (Grab dan aplikasi lain)'),
    description: lt(
      'Book in your app and meet your driver at the e-hailing pick-up area for your terminal. E-hailing vehicles pay an entry fee at the pick-up area: RM3 from 4 August 2026, reduced to RM2 at both terminals from 16 September 2026. Fares are set by the app, so none is published here: check the price in your app before you confirm.',
      'Tempah melalui aplikasi dan jumpa pemandu di kawasan mengambil penumpang e-hailing bagi terminal anda. Kenderaan e-hailing dikenakan fi masuk di kawasan itu: RM3 mulai 4 Ogos 2026, dikurangkan kepada RM2 di kedua-dua terminal mulai 16 September 2026. Tambang ditetapkan oleh aplikasi, jadi tiada tambang diterbitkan di sini: semak harga dalam aplikasi sebelum mengesahkan tempahan.',
    ),
    destinations: [],
    boarding: [
      {
        terminal: 'T1',
        level: 'L1',
        note: lt('Doors 3 and 4, Level 1, Main Terminal Building.', 'Pintu 3 dan 4, Aras 1, Bangunan Terminal Utama.'),
      },
      {
        terminal: 'T2',
        note: lt(
          'Transportation Hub, Level 1. Guides published in 2026 place the pick-up by Doors 4 and 5; older sources say Door 5. Follow the signs.',
          'Hab Pengangkutan, Aras 1. Panduan terbitan 2026 meletakkan kawasan mengambil penumpang berhampiran Pintu 4 dan 5; sumber lama menyebut Pintu 5. Ikut papan tanda.',
        ),
      },
    ],
    provenance: 'official',
    asOf: '2026-09-16',
    sources: ['mahb-klia-e-hailing', 'ringgitplus-e-hailing-fee'],
  },
  {
    id: 'kul-inter-terminal-train',
    airport: 'kul',
    mode: 'inter-terminal',
    name: lt('Train between Terminal 1 and Terminal 2', 'Tren antara Terminal 1 dan Terminal 2'),
    operator: 'Express Rail Link',
    description: lt(
      'KLIA Ekspres and KLIA Transit trains run between the two terminals. This is a landside journey: there is no airside link, so if you are changing terminals between flights you clear immigration, collect your bags and check in again. No source we found confirms the journey time, so none is published.',
      'Tren KLIA Ekspres dan KLIA Transit bergerak antara kedua-dua terminal. Ini perjalanan di kawasan awam: tiada laluan kawasan udara, jadi jika anda bertukar terminal antara penerbangan, anda perlu melalui imigresen, mengambil bagasi dan mendaftar masuk semula. Tiada sumber yang mengesahkan tempoh perjalanan, jadi ia tidak diterbitkan.',
    ),
    destinations: [
      {
        name: lt('Between Terminal 1 and Terminal 2', 'Antara Terminal 1 dan Terminal 2'),
        fare: { amount: 2, currency: 'MYR', basis: 'per-person' },
        note: lt(
          'Adult fare as reported in October 2026. Check with the operator.',
          'Tambang dewasa seperti dilaporkan pada Oktober 2026. Semak dengan pengendali.',
        ),
      },
    ],
    boarding: [
      { terminal: 'T1', note: STATION_LEVEL_NOT_VERIFIED_T1 },
      { terminal: 'T2', note: STATION_LEVEL_NOT_VERIFIED_T2 },
    ],
    provenance: 'official',
    asOf: '2026-10-01',
    sources: ['soyacincau-klia-ekspres-fares-2027', 'mahb-inter-terminal-transfer'],
  },
  {
    id: 'kul-inter-terminal-shuttle',
    airport: 'kul',
    mode: 'inter-terminal',
    name: lt('Free shuttle bus between the terminals', 'Bas ulang-alik percuma antara terminal'),
    operator: 'Malaysia Airports',
    description: lt(
      'A free shuttle bus runs a loop between Terminal 1, Terminal 2 and the Long Term Car Park. It is a landside service: there is no airside link between the terminals, so passengers changing terminals clear immigration, collect their bags and check in again. Sources differ on how often the bus runs, so allow extra time.',
      'Bas ulang-alik percuma bergerak dalam satu pusingan antara Terminal 1, Terminal 2 dan Tempat Letak Kereta Jangka Panjang. Ini perkhidmatan di kawasan awam: tiada laluan kawasan udara antara terminal, jadi penumpang yang bertukar terminal perlu melalui imigresen, mengambil bagasi dan mendaftar masuk semula. Sumber berbeza tentang kekerapan bas, jadi peruntukkan masa tambahan.',
    ),
    destinations: [
      {
        name: lt('Terminal 1, Terminal 2 and the Long Term Car Park (loop)', 'Terminal 1, Terminal 2 dan Tempat Letak Kereta Jangka Panjang (pusingan)'),
        fare: { amount: 0, currency: 'MYR', basis: 'per-person' },
        note: lt('Free of charge.', 'Percuma.'),
      },
    ],
    frequency: lt(
      'Sources differ: every 15 minutes according to search summaries of the Malaysia Airports inter-terminal page; every 10 minutes, 24 hours a day, according to a third-party guide. Check the official page.',
      'Sumber berbeza: setiap 15 minit menurut ringkasan carian halaman antara terminal Malaysia Airports; setiap 10 minit, 24 jam sehari, menurut panduan pihak ketiga. Semak halaman rasmi.',
    ),
    boarding: [
      {
        terminal: 'T1',
        level: 'L1',
        note: lt(
          'Door 4, Level 1, Main Terminal Building, as listed by third-party guides.',
          'Pintu 4, Aras 1, Bangunan Terminal Utama, seperti disenaraikan oleh panduan pihak ketiga.',
        ),
      },
      {
        terminal: 'T2',
        note: lt(
          'Bay A10, Level 1, Transportation Hub, gateway@klia2, as listed by third-party guides.',
          'Petak A10, Aras 1, Hab Pengangkutan, gateway@klia2, seperti disenaraikan oleh panduan pihak ketiga.',
        ),
      },
    ],
    provenance: 'official',
    asOf: TRANSPORT_AS_OF,
    sources: ['mahb-inter-terminal-transfer', 'klia2commy-inter-terminal-shuttle'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Parking
 *
 * Bays, blocks and features: the official parking page, read first hand on 2026-11-16.
 * Rates: search summaries of 2026-11-17 (`f-klia-transport.md`). They conflict or are partial, so
 * every car park stays `rateStatus: 'not-verified'` with `rates: []`; the figures found are quoted
 * in `description` with who gives them, so the page can say "sources differ: check the official
 * page". The only firm figure is the Long Term Car Park daily maximum of RM32 from 1 May 2026.
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
      'Short-stay parking in Blocks A, B, C and D, connected to the Main Terminal Building. Online booking is offered on the official parking page. Rates are not verified: an undated Malaysia Airports page gives RM4 an hour for the first three hours and klia.info gives a daily maximum of RM52, but we could not confirm either against the current official rate card. Check the official parking page.',
      'Parkir jangka pendek di Blok A, B, C dan D, bersambung dengan Bangunan Terminal Utama. Tempahan dalam talian ditawarkan di halaman parkir rasmi. Kadar belum disahkan: halaman Malaysia Airports tanpa tarikh menyatakan RM4 sejam bagi tiga jam pertama dan klia.info menyatakan maksimum harian RM52, tetapi kami tidak dapat mengesahkannya dengan kadar rasmi semasa. Semak halaman parkir rasmi.',
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
    asOf: TRANSPORT_AS_OF,
    sources: ['mahb-klia-t1-parking', 'mahb-klia-parking-pages-indexed', 'kliainfo-parking-rates'],
  },
  {
    id: 'kul-t1-preferred-parking',
    airport: 'kul',
    terminal: 'T1',
    name: lt('Preferred Parking', 'Parkir Pilihan (Preferred Parking)'),
    type: 'preferred',
    description: lt(
      'Terminal 1 Car Park Level 2, Blocks B and C: the bays closest to the Main Terminal. This is a premium product, not long-stay parking. In January 2025 paultan.org reported a bill of RM2,084 for a driver who left a car here during a long trip. We have not captured its rates. For a longer trip use the Long Term Car Park, and check the official parking page before you park.',
      'Aras 2 Tempat Letak Kereta Terminal 1, Blok B dan C: petak paling hampir dengan Terminal Utama. Ini produk premium, bukan parkir jangka panjang. Pada Januari 2025 paultan.org melaporkan bil RM2,084 bagi pemandu yang meninggalkan kereta di sini sepanjang perjalanan yang lama. Kadarnya belum kami peroleh. Untuk perjalanan lebih lama, gunakan Tempat Letak Kereta Jangka Panjang dan semak halaman parkir rasmi sebelum meletak kereta.',
    ),
    bays: 300,
    baysQualifier: 'over',
    walk: { note: lt('The bays closest to the Main Terminal.', 'Petak paling hampir dengan Terminal Utama.') },
    rates: [],
    rateStatus: 'not-verified',
    features: [],
    bookingUrl: PARKING_BOOKING_URL,
    provenance: 'official',
    asOf: TRANSPORT_AS_OF,
    sources: ['mahb-klia-t1-parking', 'paultan-preferred-parking-2025'],
  },
  {
    id: 'kul-long-term-car-park',
    airport: 'kul',
    name: lt('Long Term Car Park (LTCP)', 'Tempat Letak Kereta Jangka Panjang (LTCP)'),
    type: 'long-term',
    description: lt(
      'For longer trips. A complimentary shuttle runs to the terminals every 10 minutes. The daily maximum rose from RM27 to RM32 on 1 May 2026. Hourly rates are not verified because sources differ: a 2026 trip.com guide gives RM3 an hour for hours 1 to 3, RM2 an hour for hours 4 to 9 and RM1 an hour from hour 10; an undated Malaysia Airports page gives RM2.50 an hour, RM32 a day and the first 30 minutes free. Check the official parking page.',
      'Untuk perjalanan lebih lama. Bas ulang-alik percuma ke terminal setiap 10 minit. Maksimum harian naik daripada RM27 kepada RM32 pada 1 Mei 2026. Kadar sejam belum disahkan kerana sumber berbeza: panduan trip.com 2026 menyatakan RM3 sejam bagi jam 1 hingga 3, RM2 sejam bagi jam 4 hingga 9 dan RM1 sejam mulai jam 10; halaman Malaysia Airports tanpa tarikh menyatakan RM2.50 sejam, RM32 sehari dan 30 minit pertama percuma. Semak halaman parkir rasmi.',
    ),
    bays: 5200,
    baysQualifier: 'over',
    walk: {
      note: lt('Complimentary shuttle to the terminals every 10 minutes.', 'Bas ulang-alik percuma ke terminal setiap 10 minit.'),
    },
    rates: [],
    rateStatus: 'not-verified',
    dailyMax: 32,
    features: [lt('Complimentary shuttle to the terminals', 'Bas ulang-alik percuma ke terminal')],
    bookingUrl: PARKING_BOOKING_URL,
    provenance: 'official',
    asOf: TRANSPORT_AS_OF,
    sources: [
      'mahb-klia-t1-parking',
      'rakyatpost-ltcp-rate-rise-2026',
      'tripcom-klia-parking-guide',
      'mahb-klia-parking-pages-indexed',
    ],
  },
  {
    id: 'kul-t2-gateway-car-park',
    airport: 'kul',
    terminal: 'T2',
    name: lt('Terminal 2 car park (gateway@klia2)', 'Tempat letak kereta Terminal 2 (gateway@klia2)'),
    type: 'terminal',
    description: lt(
      'Parking for Terminal 2 at gateway@klia2. Rates are not verified because sources differ. A 2026 trip.com guide gives, from 13 February 2026, RM6 an hour for hours 1 and 2, RM5 an hour for hours 3 and 4 and RM4 an hour for hours 5 and 6. An older Malaysia Airports page, which may be out of date, gives RM5 an hour for hours 1 to 3, RM4 for hours 4 and 5, RM3 for hours 6 to 10 and RM2 from hour 11, with a daily maximum of RM52. Check the official parking page.',
      'Parkir untuk Terminal 2 di gateway@klia2. Kadar belum disahkan kerana sumber berbeza. Panduan trip.com 2026 menyatakan, mulai 13 Februari 2026, RM6 sejam bagi jam 1 dan 2, RM5 sejam bagi jam 3 dan 4 serta RM4 sejam bagi jam 5 dan 6. Halaman Malaysia Airports yang lebih lama, yang mungkin sudah lapuk, menyatakan RM5 sejam bagi jam 1 hingga 3, RM4 bagi jam 4 dan 5, RM3 bagi jam 6 hingga 10 dan RM2 mulai jam 11, dengan maksimum harian RM52. Semak halaman parkir rasmi.',
    ),
    rates: [],
    rateStatus: 'not-verified',
    features: [],
    provenance: 'estimated',
    asOf: TRANSPORT_AS_OF,
    sources: ['tripcom-klia-parking-guide', 'mahb-klia-parking-pages-indexed'],
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
    asOf: UNDATED,
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
      'Planned: no Aerotrain between midnight and 5am, 28 November to 1 December',
      'Dirancang: tiada Aerotrain antara tengah malam dan 5 pagi, 28 November hingga 1 Disember',
    ),
    body: lt(
      'A software update is scheduled for these nights, subject to an independent safety assessment; we found no confirmation of the final dates. If it goes ahead, the Aerotrain between the Main Terminal Building and the Satellite Building (C gates) will be unavailable from 00:00 to 05:00. Shuttle buses replace it: follow the signs to the bus lounge or ask ground staff, and allow extra time to reach a C gate.',
      'Kemas kini perisian dijadualkan pada malam-malam ini, tertakluk kepada penilaian keselamatan bebas; kami tidak menemui pengesahan tarikh akhir. Jika diteruskan, Aerotrain antara Bangunan Terminal Utama dan Bangunan Satelit (pintu C) tidak beroperasi dari 00:00 hingga 05:00. Bas pemindahan disediakan: ikut papan tanda ke ruang menunggu bas atau tanya petugas, dan peruntukkan masa tambahan untuk ke pintu C.',
    ),
    validFrom: '2026-11-28T00:00:00+08:00',
    validTo: '2026-12-01T05:00:00+08:00',
    provenance: 'official',
    asOf: '2026-10-07',
    sources: ['malaymail-aerotrain-software-oct-2026', 'soyacincau-aerotrain-software-oct-2026'],
  },
  {
    id: 'kul-klia-ekspres-fare-rise-2027',
    airport: 'kul',
    severity: 'info',
    title: lt(
      'KLIA Ekspres adult fare rises to RM65 on 1 January 2027',
      'Tambang dewasa KLIA Ekspres naik kepada RM65 pada 1 Januari 2027',
    ),
    body: lt(
      'The adult one-way fare between KL Sentral and KLIA is RM55 until 31 December 2026 and RM65 from 1 January 2027 (return RM118, child RM29, children under 6 free). KLIA Transit adult fares to KLIA are also reported to change on that date: RM45.40 from Bandar Tasik Selatan, RM11.50 from Putrajaya & Cyberjaya and RM5.80 from Salak Tinggi. Check kliaekspres.com before you travel.',
      'Tambang dewasa sehala antara KL Sentral dan KLIA ialah RM55 hingga 31 Disember 2026 dan RM65 mulai 1 Januari 2027 (pergi balik RM118, kanak-kanak RM29, kanak-kanak bawah 6 tahun percuma). Tambang dewasa KLIA Transit ke KLIA turut dilaporkan berubah pada tarikh itu: RM45.40 dari Bandar Tasik Selatan, RM11.50 dari Putrajaya & Cyberjaya dan RM5.80 dari Salak Tinggi. Semak kliaekspres.com sebelum perjalanan.',
    ),
    validTo: '2026-12-31T23:59:59+08:00',
    provenance: 'official',
    asOf: '2026-10-01',
    sources: ['thestar-klia-ekspres-fares-2027', 'businesstoday-klia-ekspres-fares-2027', 'soyacincau-klia-ekspres-fares-2027'],
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
    asOf: UNDATED,
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
    asOf: UNDATED,
    sources: ['mh-klia-t1-passenger-journey'],
  },
  {
    id: 'kul-t1-gates-a-b-domestic',
    airport: 'kul',
    topic: 'gate',
    title: lt('A and B gates are in the main terminal', 'Pintu A dan B terletak di terminal utama'),
    body: lt(
      'The A and B gates are in the main terminal and are the gates associated with domestic flights.',
      'Pintu A dan B terletak di terminal utama dan merupakan pintu yang dikaitkan dengan penerbangan domestik.',
    ),
    appliesTo: { terminal: 'T1', gatePrefixes: ['A', 'B'], direction: 'departing' },
    provenance: 'official',
    asOf: UNDATED,
    sources: ['mh-klia-t1-passenger-journey', 'kliainfo-domestic-departures'],
  },
  {
    id: 'kul-autogate-mdac',
    airport: 'kul',
    topic: 'immigration',
    title: lt('Autogates and the Malaysia Digital Arrival Card', 'Autogate dan Kad Ketibaan Digital Malaysia'),
    body: lt(
      'Sources differ on who may use the immigration autogates: travel guides published in 2026 say visitors from 63 countries and territories, while older pages give 46 or 10, and we found no official list. The guides say you need a machine-readable e-passport valid for at least six months and a Malaysia Digital Arrival Card (MDAC) submitted within three days before arrival. Permanent residents and long-term pass holders are reported to be exempt from the MDAC. These rules change: confirm them with the Immigration Department of Malaysia before you fly.',
      'Sumber berbeza tentang siapa yang boleh menggunakan autogate imigresen: panduan perjalanan terbitan 2026 menyatakan pelawat dari 63 negara dan wilayah, manakala halaman lama menyatakan 46 atau 10, dan kami tidak menemui senarai rasmi. Menurut panduan itu, anda memerlukan e-pasport boleh baca mesin yang sah sekurang-kurangnya enam bulan dan Kad Ketibaan Digital Malaysia (MDAC) yang dihantar dalam tempoh tiga hari sebelum ketibaan. Pemastautin tetap dan pemegang pas jangka panjang dilaporkan dikecualikan daripada MDAC. Peraturan ini boleh berubah: sahkan dengan Jabatan Imigresen Malaysia sebelum anda terbang.',
    ),
    appliesTo: { scope: 'international', direction: 'arriving' },
    provenance: 'estimated',
    asOf: '2026',
    sources: ['klia2info-layout-plan', 'traveloka-mdac', 'dollarsandsense-autogate-guide', 'wego-klia-to-city'],
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
    asOf: UNDATED,
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
    asOf: UNDATED,
    sources: ['klia2info-level-guide'],
  },
  {
    id: 'kul-t1-buses-level-1',
    airport: 'kul',
    topic: 'onward-transport',
    title: lt('Buses leave from Level 1', 'Bas bertolak dari Aras 1'),
    body: lt(
      "ANA's airport guide and a third-party terminal guide place the bus terminal serving Terminal 1 on Level 1. Malaysia Airports' own page was not read: follow the signs.",
      'Panduan lapangan terbang ANA dan sebuah panduan terminal pihak ketiga menyatakan terminal bas untuk Terminal 1 terletak di Aras 1. Halaman Malaysia Airports sendiri belum dibaca: ikut papan tanda.',
    ),
    appliesTo: { terminal: 'T1' },
    provenance: 'estimated',
    asOf: UNDATED,
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
    asOf: 'Booking listings, undated',
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
  {
    id: 'kul-mdac-before-arrival',
    airport: 'kul',
    topic: 'landing',
    title: lt(
      'Foreign visitors: submit the Malaysia Digital Arrival Card before you land',
      'Pelawat asing: hantar Kad Ketibaan Digital Malaysia sebelum mendarat',
    ),
    body: lt(
      'Foreign visitors submit the Malaysia Digital Arrival Card (MDAC) within three days before arrival. It is free on the official Immigration portal. Singapore citizens and holders of diplomatic or official passports are exempt, and other exemptions may apply. Confirm the rules with the Immigration Department of Malaysia before you fly.',
      'Pelawat asing perlu menghantar Kad Ketibaan Digital Malaysia (MDAC) dalam tempoh tiga hari sebelum ketibaan. Ia percuma di portal rasmi Imigresen. Warganegara Singapura serta pemegang pasport diplomatik atau rasmi dikecualikan, dan pengecualian lain mungkin terpakai. Sahkan peraturan dengan Jabatan Imigresen Malaysia sebelum anda terbang.',
    ),
    appliesTo: { scope: 'international', direction: 'arriving' },
    provenance: 'official',
    asOf: TRANSPORT_AS_OF,
    sources: ['kln-mdac-mission-page'],
  },
  {
    id: 'kul-inter-terminal-landside',
    airport: 'kul',
    topic: 'transit',
    title: lt(
      'Changing terminals means leaving the secure area',
      'Bertukar terminal bermakna keluar dari kawasan udara',
    ),
    body: lt(
      'There is no airside link between Terminal 1 and Terminal 2. If your next flight leaves from the other terminal, clear immigration, collect your bags, travel between the terminals by train (RM2 adult fare, as reported in October 2026) or by the free shuttle bus, then check in again. A seamless transfer system for passengers and bags was announced in August 2025 for mid-2026; we could not confirm that it has started, so check with your airline.',
      'Tiada laluan kawasan udara antara Terminal 1 dan Terminal 2. Jika penerbangan seterusnya berlepas dari terminal yang satu lagi, lalui imigresen, ambil bagasi, bergerak antara terminal dengan tren (tambang dewasa RM2, seperti dilaporkan pada Oktober 2026) atau bas ulang-alik percuma, kemudian daftar masuk semula. Sistem pemindahan lancar bagi penumpang dan bagasi diumumkan pada Ogos 2025 untuk pertengahan 2026; kami tidak dapat mengesahkan bahawa ia sudah bermula, jadi semak dengan syarikat penerbangan anda.',
    ),
    provenance: 'official',
    asOf: TRANSPORT_AS_OF,
    sources: ['mahb-inter-terminal-transfer', 'soyacincau-klia-ekspres-fares-2027', 'malaymail-seamless-transfer-2025'],
  },
  {
    id: 'kul-preferred-parking-warning',
    airport: 'kul',
    topic: 'getting-there',
    title: lt(
      'Parking for more than a day? Avoid Preferred Parking',
      'Parkir lebih daripada sehari? Elakkan Preferred Parking',
    ),
    body: lt(
      'Preferred Parking (Terminal 1 Car Park Level 2, Blocks B and C) is a premium product. In January 2025 paultan.org reported a bill of RM2,084 for a long stay there. For a longer trip use the Long Term Car Park, where the daily maximum is RM32 from 1 May 2026, and check the official parking page before you park.',
      'Preferred Parking (Aras 2 Tempat Letak Kereta Terminal 1, Blok B dan C) ialah produk premium. Pada Januari 2025 paultan.org melaporkan bil RM2,084 bagi parkir jangka panjang di situ. Untuk perjalanan lebih lama, gunakan Tempat Letak Kereta Jangka Panjang dengan maksimum harian RM32 mulai 1 Mei 2026, dan semak halaman parkir rasmi sebelum meletak kereta.',
    ),
    provenance: 'estimated',
    asOf: TRANSPORT_AS_OF,
    sources: ['paultan-preferred-parking-2025', 'rakyatpost-ltcp-rate-rise-2026', 'mahb-klia-t1-parking'],
  },
  {
    id: 'kul-content-gaps',
    airport: 'kul',
    topic: 'terminal',
    title: lt('What this prototype has not verified at KLIA', 'Perkara yang belum disahkan oleh prototaip ini di KLIA'),
    body: lt(
      'Left out because we could not verify them: first and last trains and how often KLIA Ekspres and KLIA Transit run; the train time between terminals; KLIA Transit fares before 2027; coach fares by operator and coach boarding bays; the official taxi fare table; official parking rate cards; the official list of nationalities that may use the autogates; current opening hours of the Jungle Boardwalk; Terminal 2 facilities and airlines other than AirAsia; shops and restaurants in either terminal; the Lost & Found phone number and location; Wi-Fi details. For these, use the official Malaysia Airports website or ask at an information counter.',
      'Tidak disertakan kerana belum dapat disahkan: tren pertama dan terakhir serta kekerapan KLIA Ekspres dan KLIA Transit; tempoh perjalanan tren antara terminal; tambang KLIA Transit sebelum 2027; tambang bas ekspres mengikut pengendali dan petak menaiki bas ekspres; jadual tambang teksi rasmi; kadar parkir rasmi; senarai rasmi kewarganegaraan yang boleh menggunakan autogate; waktu operasi semasa Jungle Boardwalk; kemudahan Terminal 2 dan syarikat penerbangan selain AirAsia; kedai dan restoran di kedua-dua terminal; nombor telefon dan lokasi Barang Hilang & Dijumpai; butiran Wi-Fi. Untuk perkara ini, gunakan laman web rasmi Malaysia Airports atau tanya di kaunter pertanyaan.',
    ),
    provenance: 'suggestion',
    asOf: TRANSPORT_AS_OF,
    sources: ['prototype-method', 'mahb-klia-t1-home'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Sources used only by KLIA content and captured after the core registry was written.
 *
 * `retrieved` is the date of the research run that carried the claim (search summaries, not
 * first-hand reads). Where `f-klia-transport.md` names a publisher but records no article link,
 * the source is publisher-level: its `url` is the publisher's site and its title says that the
 * exact link was not recorded. Replace those with the article links when they are captured.
 * ---------------------------------------------------------------------------------------- */

const MAHB = 'Malaysia Airports Holdings Berhad';
const LINK_NOT_RECORDED = 'as quoted in search results on 17 November 2026; exact link not recorded';

function source(
  id: string,
  kind: Source['kind'],
  publisher: string,
  title: string,
  url: string,
  retrieved: string,
  asOf?: string,
): Source {
  return asOf ? { id, kind, publisher, title, url, retrieved, asOf } : { id, kind, publisher, title, url, retrieved };
}

const KUL_SOURCES: Source[] = [
  /* ---- Rail ------------------------------------------------------------------------------ */
  source(
    'thestar-klia-ekspres-fares-2027',
    'news',
    'The Star',
    'KLIA Ekspres, Transit fares up from Jan 1',
    'https://www.thestar.com.my/news/nation/2026/10/01/klia-ekspres-transit-fares-up-from-jan-1',
    '2026-11-17',
    '2026-10-01',
  ),
  source(
    'businesstoday-klia-ekspres-fares-2027',
    'news',
    'BusinessToday',
    'KLIA Ekspres fares to rise to RM65 from January 2027',
    'https://www.businesstoday.com.my/2026/09/30/klia-ekspres-fares-to-rise-to-rm65-from-jan-2027/',
    '2026-11-17',
    '2026-09-30',
  ),
  source(
    'soyacincau-klia-ekspres-fares-2027',
    'news',
    'SoyaCincau',
    'KLIA Ekspres and Transit adult fares to hit RM65 starting 1 January 2027',
    'https://soyacincau.com/2026/10/01/klia-ekspres-and-transit-adult-fares-to-hit-rm65-starting-1st-january-2027/',
    '2026-11-17',
    '2026-10-01',
  ),
  source(
    'erl-klia-transit-product',
    'operator',
    'Express Rail Link (kliaekspres.com)',
    'KLIA Transit: products and fares',
    'https://kliaekspres.com/products-fares/klia-transit',
    '2026-11-17',
    '2026',
  ),
  source(
    'wego-klia-to-city',
    'aggregator',
    'Wego Travel Blog',
    'KLIA to Kuala Lumpur city: transport guide',
    'https://blog.wego.com/klia-to-kuala-lumpur-city/',
    '2026-11-17',
    '2026',
  ),
  /* ---- Coach, taxi, e-hailing ------------------------------------------------------------- */
  source(
    'busonlineticket-airport-coach',
    'aggregator',
    'BusOnlineTicket.com',
    `KLIA airport coach listings and fares, ${LINK_NOT_RECORDED}`,
    'https://www.busonlineticket.com/',
    '2026-11-17',
    '2026',
  ),
  source(
    'mahb-klia-taxi',
    'official',
    MAHB,
    'Getting around: metered taxi (page found in the search index; content not read first hand)',
    'https://airports.malaysiaairports.com.my/getting-around-transport-car/taxi/metered-taxi',
    '2026-11-17',
  ),
  source(
    'mahb-klia-e-hailing',
    'official',
    MAHB,
    'Getting around: e-hailing (as summarised in search results)',
    'https://airports.malaysiaairports.com.my/getting-around-transport/car/e-hailing',
    '2026-11-17',
  ),
  source(
    'ringgitplus-e-hailing-fee',
    'other',
    'RinggitPlus',
    'KLIA e-hailing entry fee cut to RM2 at both terminals',
    'https://ringgitplus.com/en/blog/travel/klia-e-hailing-entry-fee-cut-to-rm2-at-both-terminals.html',
    '2026-11-17',
    '2026-09',
  ),
  /* ---- Between terminals ------------------------------------------------------------------ */
  source(
    'mahb-inter-terminal-transfer',
    'official',
    MAHB,
    'Transit: inter-terminal transfer (as summarised in search results)',
    'https://airports.malaysiaairports.com.my/transit/inter-terminal-transfer',
    '2026-11-17',
  ),
  source(
    'klia2commy-inter-terminal-shuttle',
    'aggregator',
    'klia2.com.my',
    `Inter-terminal shuttle bus stops and frequency, ${LINK_NOT_RECORDED}`,
    'https://www.klia2.com.my/',
    '2026-11-17',
  ),
  source(
    'malaymail-seamless-transfer-2025',
    'news',
    'Malay Mail',
    "Loke announces KLIA's seamless inter-terminal transfer system for passengers and luggage, set to roll out by mid-2026",
    'https://www.malaymail.com/news/malaysia/2025/08/27/loke-announces-klias-seamless-inter-terminal-transfer-system-for-passengers-and-luggage-set-to-roll-out-by-mid-2026/189127',
    '2026-11-17',
    '2025-08-27',
  ),
  /* ---- Parking ---------------------------------------------------------------------------- */
  source(
    'paultan-preferred-parking-2025',
    'news',
    'Paul Tan’s Automotive News',
    'RM2,084 to park at KLIA: if you are going to park long term, be careful not to go into Preferred Parking',
    'https://paultan.org/2025/01/16/rm2084-to-park-at-klia-if-youre-going-to-park-long-term-be-careful-not-to-go-into-preferred-parking/',
    '2026-11-17',
    '2025-01-16',
  ),
  source(
    'rakyatpost-ltcp-rate-rise-2026',
    'news',
    'The Rakyat Post',
    `Report on the KLIA Long Term Car Park daily maximum rising to RM32 (16 May 2026), ${LINK_NOT_RECORDED}`,
    'https://www.therakyatpost.com/',
    '2026-11-17',
    '2026-05-16',
  ),
  source(
    'tripcom-klia-parking-guide',
    'aggregator',
    'Trip.com',
    `KLIA parking guide (2026), ${LINK_NOT_RECORDED}`,
    'https://www.trip.com/',
    '2026-11-17',
    '2026',
  ),
  source(
    'mahb-klia-parking-pages-indexed',
    'official',
    MAHB,
    `KLIA car and Terminal 2 parking rate pages (undated, may be out of date), ${LINK_NOT_RECORDED}`,
    'https://airports.malaysiaairports.com.my/',
    '2026-11-17',
  ),
  source(
    'kliainfo-parking-rates',
    'aggregator',
    'klia.info',
    `KLIA Terminal 1 car park daily maximum, ${LINK_NOT_RECORDED}`,
    'https://klia.info/',
    '2026-11-17',
  ),
  /* ---- Entry formalities ------------------------------------------------------------------ */
  source(
    'kln-mdac-mission-page',
    'government',
    'Ministry of Foreign Affairs, Malaysia (mission page on kln.gov.my)',
    `Malaysia Digital Arrival Card (MDAC) requirements, ${LINK_NOT_RECORDED}`,
    'https://www.kln.gov.my/',
    '2026-11-17',
  ),
  source(
    'dollarsandsense-autogate-guide',
    'other',
    'DollarsAndSense Malaysia',
    "Guide to using Malaysia's autogate at Kuala Lumpur International Airport (KLIA)",
    'https://dollarsandsense.my/guide-to-using-malaysias-autogate-at-kuala-lumpur-international-airport-klia/',
    '2026-11-16',
  ),
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
  { id: 'l1-bus-terminal', level: 'L1', zone: 'l1-bus-zone', x: 300, y: 430, name: lt('Bus terminal', 'Terminal bas'), kind: 'bus', ref: { type: 'transport', id: 'kul-t1-buses' }, provenance: 'estimated', sources: ['ana-kuala-lumpur-guide', 'klia2info-level-guide'] },
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
  sources: KUL_SOURCES,
});

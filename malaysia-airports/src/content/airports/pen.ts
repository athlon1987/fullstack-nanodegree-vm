/**
 * Penang International Airport (PEN).
 *
 * Where this comes from: `docs/research/facts/f-penang.json`, using only facts with evidence
 * `search` and confidence high or medium (search results obtained on 16 November 2026). Nothing
 * here was read first hand.
 *
 * How the rules were applied:
 *  - Parking: Premium Parking rates come from a Malaysia Airports post (9 October 2025), so they
 *    are `published`. Standard parking rates are known only from parking directories, and older
 *    directories show a different tariff, so that car park is `not-verified` with both sets of
 *    figures quoted in its description.
 *  - Lounge hours: the operator, an airline and a reseller give three different sets of hours for
 *    the international lounge, so the hours are prose (`kind: 'text'`), not an open/closed badge.
 *  - Buses: routes and frequencies as listed by Rapid Penang (MyRapid). Fares are distance-based
 *    and the fare from the airport to each place was not captured, so no structured `fare` is set:
 *    the network's RM1.40 minimum covers only the first 7 km and is not the fare to George Town.
 *    The published fare range is in each destination note. Where older guides give a different
 *    frequency (routes 401E and 306), both figures are in the text and nothing is machine-readable.
 *  - Taxi and e-hailing fares exist only as conflicting third-party estimates: not published.
 *  - Airlines: a partial list from visitpenang.com. Entries are created only for airlines
 *    whose IATA designator is already recorded in this repository; the others are named in a note.
 *  - Levels: the registry gives Penang's terminal no levels, so locations are words only.
 *
 * Known gaps (also published as the guide note `pen-content-gaps`): no verified shops or
 * restaurants; prayer rooms, Wi-Fi, ATMs and money changers are prior knowledge only; no taxi
 * tariff; no bus stop location, exact bus fares or first and last buses; no official standard parking rate card;
 * domestic lounge hours; the full airline and destination list; terminal opening hours; whether
 * the airport telephone number in the aeronautical publication answers passenger enquiries.
 */
import {
  defineAirportContent,
  lt,
  type AirlineAtAirport,
  type CarPark,
  type Facility,
  type GuideNote,
  type LocalizedText,
  type Notice,
  type Source,
  type TransportOption,
} from '../types';
import { MAHB, RETRIEVED_16_NOV, contentGapsNote, source } from './_helpers';

const CHECKED = 'Checked 16 November 2026';
const OFFICIAL_PAGE = 'https://airports.malaysiaairports.com.my/en/penang';

/* -------------------------------------------------------------------------------------------
 * Facilities and lounges
 * ---------------------------------------------------------------------------------------- */

const facilities: Facility[] = [
  {
    id: 'pen-plaza-premium-lounge-international',
    airport: 'pen',
    terminal: 'MAIN',
    name: lt('Plaza Premium Lounge (International Departures)', 'Plaza Premium Lounge (Berlepas Antarabangsa)'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt(
      'International departures, mezzanine floor, near Gate A3.',
      'Berlepas antarabangsa, tingkat mezanin, berhampiran Pintu A3.',
    ),
    hours: {
      kind: 'text',
      text: lt(
        'Sources differ: Plaza Premium lists 06:00 to 00:00 daily, Cathay Pacific lists 06:00 to 22:30 and a ticket reseller lists 05:30 to 23:00. Check with the lounge before you travel.',
        'Sumber berbeza: Plaza Premium menyenaraikan 06:00 hingga 00:00 setiap hari, Cathay Pacific menyenaraikan 06:00 hingga 22:30 dan sebuah penjual tiket menyenaraikan 05:30 hingga 23:00. Semak dengan lounge sebelum perjalanan.',
      ),
    },
    description: lt(
      'A lounge after security and immigration. Cathay Pacific lists it as its lounge for eligible passengers at Penang.',
      'Lounge selepas pemeriksaan keselamatan dan imigresen. Cathay Pacific menyenaraikannya sebagai lounge untuk penumpangnya yang layak di Pulau Pinang.',
    ),
    operator: 'Plaza Premium',
    access: lt(
      'Only for passengers departing on international flights, with a valid boarding pass.',
      'Hanya untuk penumpang yang berlepas dengan penerbangan antarabangsa, dengan pas masuk yang sah.',
    ),
    provenance: 'official',
    asOf: CHECKED,
    sources: ['plazapremium-penang-international', 'cathay-penang-lounge', 'viator-penang-plaza-premium'],
  },
  {
    id: 'pen-plaza-premium-lounge-domestic',
    airport: 'pen',
    terminal: 'MAIN',
    name: lt('Plaza Premium Lounge (Domestic Departures)', 'Plaza Premium Lounge (Berlepas Domestik)'),
    category: 'lounge',
    zone: 'airside',
    locationNote: lt(
      'Domestic departures, 2nd floor, shop lots S14 and S14A, opposite security clearance. A second listing places it near Gate A1A.',
      'Berlepas domestik, tingkat 2, lot kedai S14 dan S14A, bertentangan dengan pemeriksaan keselamatan. Satu lagi penyenaraian meletakkannya berhampiran Pintu A1A.',
    ),
    description: lt(
      'Listed by Priority Pass, which limits its members to a stay of up to two hours. Opening hours are not verified: check with the lounge.',
      'Disenaraikan oleh Priority Pass, yang mengehadkan ahlinya kepada penginapan sehingga dua jam. Waktu operasi belum disahkan: semak dengan lounge.',
    ),
    operator: 'Plaza Premium',
    provenance: 'estimated',
    asOf: CHECKED,
    sources: ['prioritypass-penang-plaza-premium', 'taketours-penang-plaza-premium-domestic'],
  },
  {
    id: 'pen-airport-contact',
    airport: 'pen',
    terminal: 'MAIN',
    name: lt('Contacting the airport', 'Menghubungi lapangan terbang'),
    category: 'information',
    zone: 'unknown',
    description: lt(
      "The official Penang page gives Malaysia Airports' group customer line, +603-8777 0000, and info@malaysiaairports.com.my. Malaysia's aeronautical information publication lists +604-252 0252 for the airport itself; older directories show a different number, and we have not confirmed which one answers passenger enquiries.",
      'Halaman rasmi Pulau Pinang memberikan talian pelanggan kumpulan Malaysia Airports, +603-8777 0000, dan info@malaysiaairports.com.my. Penerbitan maklumat aeronautik Malaysia menyenaraikan +604-252 0252 bagi lapangan terbang ini; direktori lama memaparkan nombor lain, dan kami belum mengesahkan nombor yang menjawab pertanyaan penumpang.',
    ),
    provenance: 'official',
    asOf: CHECKED,
    sources: ['mahb-penang-site', 'caam-eaip-wmkp'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Ground transport
 * ---------------------------------------------------------------------------------------- */

const BUS_FARE_NOTE: LocalizedText = lt(
  'No fare is published here: the fare from the airport was not captured. Rapid Penang fares depend on distance, from RM1.40 for the first 7 km up to RM5.00 for 42 to 49 km. Check MyRapid.',
  'Tiada tambang diterbitkan di sini: tambang dari lapangan terbang belum diperoleh. Tambang Rapid Penang bergantung pada jarak, daripada RM1.40 bagi 7 km pertama hingga RM5.00 bagi 42 hingga 49 km. Semak MyRapid.',
);

const transport: TransportOption[] = [
  {
    id: 'pen-bus-401e',
    airport: 'pen',
    mode: 'bus',
    name: lt('Bus 401E to George Town and Balik Pulau', 'Bas 401E ke George Town dan Balik Pulau'),
    operator: 'Rapid Penang',
    description: lt(
      'Runs between Weld Quay in George Town and Balik Pulau, calling at Komtar, Queensbay Mall, Bayan Baru and the airport. Rapid Penang also lists routes 401, 102 and 306 at the airport. The bus stop at the airport and the first and last buses are not verified here: check MyRapid.',
      'Beroperasi antara Weld Quay di George Town dan Balik Pulau, melalui Komtar, Queensbay Mall, Bayan Baru dan lapangan terbang. Rapid Penang turut menyenaraikan laluan 401, 102 dan 306 di lapangan terbang. Hentian bas di lapangan terbang serta bas pertama dan terakhir belum disahkan di sini: semak MyRapid.',
    ),
    destinations: [
      {
        name: lt('George Town (Komtar and Weld Quay)', 'George Town (Komtar dan Weld Quay)'),
        note: lt(
          'No fare is published here: the fare from the airport to Komtar was not captured. Fares on route 401E range from RM1.40 to RM4.70 depending on distance. Check MyRapid.',
          'Tiada tambang diterbitkan di sini: tambang dari lapangan terbang ke Komtar belum diperoleh. Tambang laluan 401E antara RM1.40 hingga RM4.70 bergantung pada jarak. Semak MyRapid.',
        ),
      },
      {
        name: lt('Queensbay Mall and Bayan Baru', 'Queensbay Mall dan Bayan Baru'),
        note: BUS_FARE_NOTE,
      },
      { name: lt('Balik Pulau', 'Balik Pulau'), note: BUS_FARE_NOTE },
    ],
    frequency: lt(
      'Sources differ: about every 15 to 20 minutes according to Rapid Penang; older third-party guides give about 30 minutes, or 30 to 40. Check MyRapid.',
      'Sumber berbeza: kira-kira setiap 15 hingga 20 minit menurut Rapid Penang; panduan pihak ketiga yang lebih lama menyatakan kira-kira 30 minit, atau 30 hingga 40. Semak MyRapid.',
    ),
    boarding: [],
    provenance: 'official',
    asOf: CHECKED,
    sources: ['myrapid-rapid-penang-bus', 'visitpenang-bus-401', 'holidaygogogo-penang-airport', 'travelswithsun-penang-airport-georgetown'],
  },
  {
    id: 'pen-bus-102',
    airport: 'pen',
    mode: 'bus',
    name: lt('Bus 102 to Batu Ferringhi and Teluk Bahang', 'Bas 102 ke Batu Ferringhi dan Teluk Bahang'),
    operator: 'Rapid Penang',
    description: lt(
      'Runs between the airport and Teluk Bahang, passing Komtar, Gurney Drive and Batu Ferringhi.',
      'Beroperasi antara lapangan terbang dan Teluk Bahang, melalui Komtar, Gurney Drive dan Batu Ferringhi.',
    ),
    destinations: [
      {
        name: lt('Batu Ferringhi and Teluk Bahang (via Komtar and Gurney Drive)', 'Batu Ferringhi dan Teluk Bahang (melalui Komtar dan Gurney Drive)'),
        note: BUS_FARE_NOTE,
      },
    ],
    frequency: lt(
      'About every 75 minutes according to Rapid Penang: check the timetable before you rely on it.',
      'Kira-kira setiap 75 minit menurut Rapid Penang: semak jadual sebelum bergantung padanya.',
    ),
    frequencyMinutes: 75,
    boarding: [],
    provenance: 'official',
    asOf: CHECKED,
    sources: ['myrapid-rapid-penang-bus', 'visitpenang-bus-routes'],
  },
  {
    id: 'pen-bus-306',
    airport: 'pen',
    mode: 'bus',
    name: lt('Bus 306 to the General Hospital', 'Bas 306 ke Hospital Besar'),
    operator: 'Rapid Penang',
    description: lt(
      'Links the airport with Penang General Hospital by way of Scotland Road and Western Road.',
      'Menghubungkan lapangan terbang dengan Hospital Besar Pulau Pinang melalui Scotland Road dan Western Road.',
    ),
    destinations: [
      {
        name: lt('Penang General Hospital', 'Hospital Besar Pulau Pinang'),
        note: BUS_FARE_NOTE,
      },
    ],
    frequency: lt(
      'Sources differ: about every 45 minutes according to Rapid Penang; a 2025 route table on Wikipedia gives 40 minutes and an older guide gives 60 to 80. Check MyRapid.',
      'Sumber berbeza: kira-kira setiap 45 minit menurut Rapid Penang; jadual laluan 2025 di Wikipedia menyatakan 40 minit dan sebuah panduan lama menyatakan 60 hingga 80. Semak MyRapid.',
    ),
    boarding: [],
    provenance: 'official',
    asOf: CHECKED,
    sources: ['myrapid-rapid-penang-bus', 'wikipedia-penang-bus-routes', 'holidaygogogo-penang-airport'],
  },
  {
    id: 'pen-coupon-taxi',
    airport: 'pen',
    mode: 'taxi',
    name: lt('Airport taxi (prepaid coupon)', 'Teksi lapangan terbang (kupon prabayar)'),
    description: lt(
      'Third-party guides agree that airport taxis run on a prepaid coupon system. No official tariff was captured, and the fares quoted by guides conflict, so no fare is published here: the coupon counter gives the fare for your destination.',
      'Panduan pihak ketiga sepakat bahawa teksi lapangan terbang menggunakan sistem kupon prabayar. Tiada tarif rasmi diperoleh, dan tambang yang disebut oleh panduan bercanggah, jadi tiada tambang diterbitkan di sini: kaunter kupon memberikan tambang bagi destinasi anda.',
    ),
    destinations: [],
    boarding: [
      {
        terminal: 'MAIN',
        note: lt('Buy your coupon at the counter in the arrivals hall.', 'Beli kupon di kaunter dalam balai ketibaan.'),
      },
    ],
    provenance: 'estimated',
    asOf: CHECKED,
    sources: ['secretflying-penang-airports', 'themalaysianguide-penang-transfer'],
  },
  {
    id: 'pen-e-hailing',
    airport: 'pen',
    mode: 'e-hailing',
    name: lt('E-hailing (Grab and other apps)', 'E-hailing (Grab dan aplikasi lain)'),
    description: lt(
      'A pick-up zone for e-hailing was set up in the multi-storey car park opposite the terminal, as reported in March 2026. Fares are set by the app, and the estimates quoted by guides vary, so none is published here.',
      'Zon mengambil penumpang e-hailing disediakan di tempat letak kereta bertingkat bertentangan dengan terminal, seperti dilaporkan pada Mac 2026. Tambang ditetapkan oleh aplikasi, dan anggaran yang disebut oleh panduan berbeza-beza, jadi tiada tambang diterbitkan di sini.',
    ),
    destinations: [],
    boarding: [
      {
        terminal: 'MAIN',
        note: lt(
          'Ground floor (Level 1) of the multi-storey car park, across the road from the main terminal building.',
          'Tingkat bawah (Aras 1) tempat letak kereta bertingkat, di seberang jalan dari bangunan terminal utama.',
        ),
      },
    ],
    provenance: 'official',
    asOf: '2026-03-11',
    sources: ['businesstoday-penang-expansion-mar-2026', 'onpenang-grab'],
  },
  {
    id: 'pen-car-rental',
    airport: 'pen',
    mode: 'car-rental',
    name: lt('Car rental', 'Kereta sewa'),
    description: lt(
      'Several car rental companies serve the airport. The company names were not captured: see the official rental services page.',
      'Beberapa syarikat kereta sewa beroperasi di lapangan terbang ini. Nama syarikat belum diperoleh: rujuk halaman perkhidmatan sewa rasmi.',
    ),
    destinations: [],
    boarding: [
      {
        terminal: 'MAIN',
        note: lt('Rental counters on Level 1 of the terminal building.', 'Kaunter sewa di Aras 1 bangunan terminal.'),
      },
    ],
    bookingUrl: 'https://airports.malaysiaairports.com.my/en/penang/air-travel/rental-services',
    provenance: 'official',
    asOf: CHECKED,
    sources: ['mahb-penang-rental-services'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Parking
 * ---------------------------------------------------------------------------------------- */

const carParks: CarPark[] = [
  {
    id: 'pen-standard-parking',
    airport: 'pen',
    terminal: 'MAIN',
    name: lt('Standard parking', 'Parkir biasa'),
    type: 'terminal',
    description: lt(
      'Malaysia Airports says several types of parking are available, and a multi-storey car park stands across the road from the terminal. Standard rates are not verified because we have them only from parking directories, which differ: three directories give RM4 an hour for the first 4 hours, RM2 an hour for hours 5 to 10 and RM1 an hour for hours 11 to 15, up to RM33 a day; older directories still show RM3 an hour with the same RM33 daily maximum. Check the official Penang airport page.',
      'Malaysia Airports menyatakan beberapa jenis parkir disediakan, dan tempat letak kereta bertingkat terletak di seberang jalan dari terminal. Kadar biasa belum disahkan kerana kami hanya memperolehnya daripada direktori parkir yang berbeza-beza: tiga direktori menyatakan RM4 sejam bagi 4 jam pertama, RM2 sejam bagi jam 5 hingga 10 dan RM1 sejam bagi jam 11 hingga 15, sehingga RM33 sehari; direktori lama masih memaparkan RM3 sejam dengan maksimum harian RM33 yang sama. Semak halaman rasmi lapangan terbang Pulau Pinang.',
    ),
    walk: {
      note: lt(
        'The multi-storey car park is across the road from the main terminal building.',
        'Tempat letak kereta bertingkat terletak di seberang jalan dari bangunan terminal utama.',
      ),
    },
    rates: [],
    rateStatus: 'not-verified',
    features: [],
    bookingUrl: OFFICIAL_PAGE,
    provenance: 'estimated',
    asOf: CHECKED,
    sources: [
      'mahb-penang-site',
      'businesstoday-penang-expansion-mar-2026',
      'klia2info-penang-airport',
      'parkinginmalaysia-penang',
      'parkingcommy-penang',
      'penangsentral-penang-parking',
    ],
  },
  {
    id: 'pen-premium-parking',
    airport: 'pen',
    terminal: 'MAIN',
    name: lt('Premium Parking', 'Parkir Premium'),
    type: 'preferred',
    description: lt(
      'On Level 3 of the multi-storey car park, next to the link bridge to the departure level of the terminal. Rates are as Malaysia Airports announced them on 9 October 2025: check the official page for any change since.',
      'Di Aras 3 tempat letak kereta bertingkat, bersebelahan jambatan penghubung ke aras berlepas terminal. Kadar adalah seperti yang diumumkan oleh Malaysia Airports pada 9 Oktober 2025: semak halaman rasmi untuk sebarang perubahan selepas itu.',
    ),
    walk: {
      note: lt(
        'A link bridge connects Level 3 of the car park with the departure level.',
        'Jambatan penghubung menyambungkan Aras 3 tempat letak kereta dengan aras berlepas.',
      ),
    },
    rates: [
      {
        fromMinute: 0,
        toMinute: 240,
        kind: 'per-block',
        amount: 6,
        blockMinutes: 60,
        label: lt('First 4 hours: RM6 an hour', '4 jam pertama: RM6 sejam'),
      },
      {
        fromMinute: 240,
        toMinute: 720,
        kind: 'per-block',
        amount: 4,
        blockMinutes: 60,
        label: lt('Hours 5 to 12: RM4 an hour', 'Jam 5 hingga 12: RM4 sejam'),
      },
      {
        fromMinute: 720,
        toMinute: 1320,
        kind: 'per-block',
        amount: 2,
        blockMinutes: 60,
        label: lt('Hours 13 to 22: RM2 an hour', 'Jam 13 hingga 22: RM2 sejam'),
      },
    ],
    rateStatus: 'published',
    dailyMax: 76,
    features: [lt('Next to the link bridge to departures', 'Bersebelahan jambatan penghubung ke balai berlepas')],
    bookingUrl: OFFICIAL_PAGE,
    provenance: 'official',
    asOf: '2025-10-09',
    sources: ['mahb-x-penang-premium-parking', 'threads-penangfoodie-premium-parking'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Airlines (a partial list: see the header)
 * ---------------------------------------------------------------------------------------- */

const LISTED_NOTE: LocalizedText = lt(
  'Named by visitpenang.com among the airlines serving Penang in 2026. The list is partial and not confirmed by the airport: check your booking.',
  'Dinamakan oleh visitpenang.com antara syarikat penerbangan yang beroperasi di Pulau Pinang pada 2026. Senarai ini tidak lengkap dan belum disahkan oleh lapangan terbang: semak tempahan anda.',
);

function listedAirline(code: string, name: string): AirlineAtAirport {
  return {
    code,
    name,
    destinations: [],
    basis: 'third-party',
    note: LISTED_NOTE,
    asOf: '2026',
    sources: ['visitpenang-direct-flights'],
  };
}

const airlines: AirlineAtAirport[] = [
  listedAirline('AK', 'AirAsia'),
  {
    code: 'CX',
    name: 'Cathay Pacific',
    checkIn: 'Counters open 2 hours 30 minutes before scheduled departure and close 40 minutes before it, according to Cathay Pacific.',
    destinations: [],
    basis: 'airline',
    note: lt(
      'Cathay Pacific publishes its own Penang airport page and lists the Plaza Premium Lounge for its eligible passengers.',
      'Cathay Pacific menerbitkan halaman lapangan terbang Pulau Pinang sendiri dan menyenaraikan Plaza Premium Lounge untuk penumpangnya yang layak.',
    ),
    asOf: CHECKED,
    sources: ['cathay-penang-airport', 'cathay-penang-lounge'],
  },
  listedAirline('MH', 'Malaysia Airlines'),
  listedAirline('TR', 'Scoot'),
  listedAirline('SQ', 'Singapore Airlines'),
];

/* -------------------------------------------------------------------------------------------
 * Notices
 * ---------------------------------------------------------------------------------------- */

const notices: Notice[] = [
  {
    id: 'pen-terminal-expansion-works',
    airport: 'pen',
    severity: 'info',
    title: lt(
      'Penang airport is being expanded, with completion targeted for June 2028',
      'Lapangan terbang Pulau Pinang sedang dibesarkan, dengan sasaran siap pada Jun 2028',
    ),
    body: lt(
      'The airport handled about 8.31 million passengers in 2025, more than the 6.5 million a year the terminal was designed for. The expansion will raise capacity to 12 million passengers a year. The first phase was reported 98 per cent complete in March 2026, and procurement for the main terminal works began on 25 June 2026. Airside works and scheduled runway closures are listed in notices from the Civil Aviation Authority of Malaysia, and airlines plan their timetables around them. Check your flight status with your airline.',
      'Lapangan terbang ini mengendalikan kira-kira 8.31 juta penumpang pada 2025, melebihi 6.5 juta setahun yang direka untuk terminal ini. Pembesaran akan menaikkan kapasiti kepada 12 juta penumpang setahun. Fasa pertama dilaporkan 98 peratus siap pada Mac 2026, dan perolehan bagi kerja terminal utama bermula pada 25 Jun 2026. Kerja di kawasan udara dan penutupan landasan berjadual disenaraikan dalam notis Pihak Berkuasa Penerbangan Awam Malaysia, dan syarikat penerbangan merancang jadual mengikutnya. Semak status penerbangan dengan syarikat penerbangan anda.',
    ),
    provenance: 'official',
    asOf: '2026-07-03',
    sources: [
      'bernama-penang-expansion-2025',
      'bernama-penang-traffic-2026',
      'businesstoday-penang-expansion-mar-2026',
      'malaymail-penang-expansion-jul-2026',
      'caam-eaip-supplements-2026-10',
    ],
  },
];

/* -------------------------------------------------------------------------------------------
 * Notes for the journey timeline and guides
 * ---------------------------------------------------------------------------------------- */

const guidesNotes: GuideNote[] = [
  {
    id: 'pen-premium-parking-link-bridge',
    airport: 'pen',
    topic: 'getting-there',
    title: lt('Parking close to departures', 'Parkir berhampiran balai berlepas'),
    body: lt(
      'Premium Parking is on Level 3 of the multi-storey car park, next to the link bridge to the departure level. The maximum charge is RM76 for 24 hours, as announced in October 2025.',
      'Parkir Premium terletak di Aras 3 tempat letak kereta bertingkat, bersebelahan jambatan penghubung ke aras berlepas. Caj maksimum ialah RM76 bagi 24 jam, seperti diumumkan pada Oktober 2025.',
    ),
    provenance: 'official',
    asOf: '2025-10-09',
    sources: ['mahb-x-penang-premium-parking', 'threads-penangfoodie-premium-parking'],
  },
  {
    id: 'pen-cathay-check-in-times',
    airport: 'pen',
    topic: 'check-in',
    title: lt('Cathay Pacific check-in times', 'Waktu daftar masuk Cathay Pacific'),
    body: lt(
      'Cathay Pacific says its counters at Penang open 2 hours 30 minutes before scheduled departure and close 40 minutes before it. Other airlines set their own times.',
      'Cathay Pacific menyatakan kaunternya di Pulau Pinang dibuka 2 jam 30 minit sebelum waktu berlepas berjadual dan ditutup 40 minit sebelumnya. Syarikat penerbangan lain menetapkan waktu masing-masing.',
    ),
    appliesTo: { airline: 'CX', direction: 'departing' },
    provenance: 'official',
    asOf: CHECKED,
    sources: ['cathay-penang-airport'],
  },
  {
    id: 'pen-e-hailing-pick-up',
    airport: 'pen',
    topic: 'onward-transport',
    title: lt('E-hailing pick-up is in the car park opposite', 'Kawasan mengambil penumpang e-hailing di tempat letak kereta bertentangan'),
    body: lt(
      'Meet your e-hailing driver on the ground floor (Level 1) of the multi-storey car park, across the road from the main terminal building.',
      'Jumpa pemandu e-hailing anda di tingkat bawah (Aras 1) tempat letak kereta bertingkat, di seberang jalan dari bangunan terminal utama.',
    ),
    appliesTo: { direction: 'arriving' },
    provenance: 'official',
    asOf: '2026-03-11',
    sources: ['businesstoday-penang-expansion-mar-2026', 'onpenang-grab'],
  },
  {
    id: 'pen-taxi-coupon',
    airport: 'pen',
    topic: 'onward-transport',
    title: lt('Taxis use prepaid coupons', 'Teksi menggunakan kupon prabayar'),
    body: lt(
      'Third-party guides say airport taxis are paid for by coupon, bought at a counter in the arrivals hall. We have no official fare table.',
      'Panduan pihak ketiga menyatakan teksi lapangan terbang dibayar dengan kupon yang dibeli di kaunter dalam balai ketibaan. Kami tiada jadual tambang rasmi.',
    ),
    appliesTo: { direction: 'arriving' },
    provenance: 'estimated',
    asOf: CHECKED,
    sources: ['secretflying-penang-airports', 'themalaysianguide-penang-transfer'],
  },
  contentGapsNote({
    airport: 'pen',
    title: lt('What this prototype has not verified at Penang', 'Perkara yang belum disahkan oleh prototaip ini di Pulau Pinang'),
    body: lt(
      'Left out because we could not verify them: shops and restaurants; prayer rooms, Wi-Fi, ATMs and money changers; taxi fares; the airport bus stop, the exact bus fare from the airport and the first and last buses; the official rate card for standard parking; opening hours of the domestic lounge; the full list of airlines and destinations; terminal opening hours. Thai Airways and several Chinese and Indonesian airlines are also named as serving Penang, but are not listed here yet. For these, use the official Penang airport page or call Malaysia Airports on +603-8777 0000.',
      'Tidak disertakan kerana belum dapat disahkan: kedai dan restoran; surau, Wi-Fi, ATM dan pengurup wang; tambang teksi; hentian bas lapangan terbang, tambang bas yang tepat dari lapangan terbang serta bas pertama dan terakhir; kadar rasmi parkir biasa; waktu operasi lounge domestik; senarai penuh syarikat penerbangan dan destinasi; waktu operasi terminal. Thai Airways serta beberapa syarikat penerbangan China dan Indonesia turut dinamakan beroperasi di Pulau Pinang, tetapi belum disenaraikan di sini. Untuk perkara ini, gunakan halaman rasmi lapangan terbang Pulau Pinang atau hubungi Malaysia Airports di +603-8777 0000.',
    ),
    sources: ['prototype-method', 'mahb-penang-site', 'visitpenang-direct-flights'],
    asOf: RETRIEVED_16_NOV,
  }),
];

/* -------------------------------------------------------------------------------------------
 * Sources used only by Penang content (search results of 16 November 2026)
 * ---------------------------------------------------------------------------------------- */

const R = RETRIEVED_16_NOV;

const sources: Source[] = [
  source('plazapremium-penang-international', 'operator', 'Plaza Premium Lounge', 'Plaza Premium Lounge (International Departures), Penang International Airport', 'https://www.plazapremiumlounge.com/en-uk/find/asia/malaysia/penang/penang-international-airport/international-departures', R),
  source('cathay-penang-lounge', 'operator', 'Cathay Pacific', 'Plaza Premium Lounge, Penang', 'https://www.cathaypacific.com/cx/en_US/destinations/lounges/penang-pen/plaza-premium-lounge.html', R),
  source('cathay-penang-airport', 'operator', 'Cathay Pacific', 'Penang International Airport', 'https://www.cathaypacific.com/cx/en_ZA/destinations/airports/penang-international-airport.html', R),
  source('viator-penang-plaza-premium', 'aggregator', 'Viator', 'Penang International Airport Plaza Premium Lounge', 'https://www.viator.com/en-MY/tours/Penang/Penang-International-Airport-Plaza-Premium-Lounge/d339-5079PENLOUNGE', R),
  source('prioritypass-penang-plaza-premium', 'other', 'Priority Pass', 'Plaza Premium Lounge, Penang International', 'https://www.prioritypass.com/en-GB/lounges/malaysia/penang-international/pen-plaza-premium-lounge', R),
  source('taketours-penang-plaza-premium-domestic', 'aggregator', 'TakeTours', 'Plaza Premium Lounge, Penang airport (domestic departures)', 'https://www.taketours.com/page/experience/plaza-premium-lounge-penang-airport-domestic-departures-300-20731.html', R),
  source('myrapid-rapid-penang-bus', 'operator', 'Rapid Penang (MyRapid, Prasarana)', 'Rapid Penang bus routes and fares', 'https://myrapid.com.my/bus-train/rapid-penang/rapid-pg-bus/', R, '2026'),
  source('visitpenang-bus-401', 'other', 'Visit Penang', 'Bus route 401', 'https://www.visitpenang.com/getting-around/bus-routes/401', R, '2026'),
  source('visitpenang-bus-routes', 'other', 'Visit Penang', 'Bus routes', 'https://www.visitpenang.com/getting-around/bus-routes', R, '2026'),
  source('visitpenang-direct-flights', 'other', 'Visit Penang', 'Direct flights to Penang', 'https://www.visitpenang.com/getting-there/direct-flights', R, '2026'),
  source('holidaygogogo-penang-airport', 'other', 'HolidayGoGoGo', 'Penang International Airport (older guide)', 'https://www.holidaygogogo.com/penang-international-airport/', R),
  source('travelswithsun-penang-airport-georgetown', 'other', 'Travels With Sun', 'Penang airport to George Town (older guide)', 'https://www.travelswithsun.com/penang-airport-to-georgetown/', R),
  source('wikipedia-penang-bus-routes', 'other', 'Wikipedia', 'List of bus routes in Penang', 'https://en.wikipedia.org/wiki/List_of_bus_routes_in_Penang', R, '2025'),
  source('secretflying-penang-airports', 'other', 'Secret Flying', 'Penang airport guide', 'https://www.secretflying.com/guides/penang/airports/', R, '2026'),
  source('themalaysianguide-penang-transfer', 'other', 'The Malaysian Guide', 'Penang airport transfer', 'https://www.themalaysianguide.com/practical/penang-airport-transfer/', R, '2026'),
  source('onpenang-grab', 'other', 'OnPenang', 'Grab in Penang', 'https://onpenang.com/grab-in-penang/', R),
  source('mahb-penang-rental-services', 'official', MAHB, 'Penang: rental services (as summarised in search results)', 'https://airports.malaysiaairports.com.my/en/penang/air-travel/rental-services', R),
  source('mahb-x-penang-premium-parking', 'official', 'Malaysia Airports (post on X)', 'Premium Parking at Penang International Airport: location and rates', 'https://x.com/MY_Airports/status/1976208999856079058', R, '2025-10-09'),
  source('threads-penangfoodie-premium-parking', 'other', 'Penang Foodie (Threads)', 'Repost of the Malaysia Airports Premium Parking announcement', 'https://www.threads.com/@penangfoodie/post/DP5y3q-k0OU/penang-international-airport-now-offers-premium-parking-the-premium-parking-is-l', R, '2025-10'),
  source('klia2info-penang-airport', 'aggregator', 'klia2.info', 'Penang International Airport', 'https://www.klia2.info/airports/penang-international-airport/', R, '2025-10-01'),
  source('parkinginmalaysia-penang', 'aggregator', 'Parking in Malaysia', 'Penang International Airport parking info', 'https://parkinginmalaysia.com/penang-international-airport-parking-info/', R),
  source('parkingcommy-penang', 'aggregator', 'parking.com.my', 'Penang International Airport', 'https://parking.com.my/item/penang-international-airport/', R),
  source('penangsentral-penang-parking', 'aggregator', 'penangsentral.com', 'Penang airport parking (older tariff)', 'https://penangsentral.com/penang_airport/parking.htm', R),
  source('businesstoday-penang-expansion-mar-2026', 'news', 'BusinessToday', 'Penang airport expansion phase nears completion', 'https://www.businesstoday.com.my/2026/03/11/penang-airport-expansion-phase-nears-completion/', R, '2026-03-11'),
  source('bernama-penang-expansion-2025', 'news', 'Bernama', 'Penang airport expansion: capacity, cost and June 2028 target', 'https://bernama.com/en/news.php?id=2446593', R, '2025-07'),
  source('bernama-penang-traffic-2026', 'news', 'Bernama', 'Penang airport passenger traffic and expansion progress', 'https://www.bernama.com/en/region/news.php?id=2533015', R, '2026-03'),
  source('malaymail-penang-expansion-jul-2026', 'news', 'Malay Mail', 'Penang airport expansion records strong progress, project slated for 2028 completion, says exco', 'https://www.malaymail.com/amp/news/malaysia/2026/07/03/penang-airport-expansion-records-strong-progress-project-slated-for-2028-completion-says-exco/226229', R, '2026-07-03'),
  source('caam-eaip-supplements-2026-10', 'government', 'Civil Aviation Authority of Malaysia', 'eAIP Malaysia: record of AIP supplements (GEN 0.3), AIRAC 29 October 2026', 'https://aip.caam.gov.my/aip/eAIP/2026-10-29-AIRAC/html/eAIP/WM-GEN-0.3-en-MS.html', R, '2026-10-29'),
];

/** Everything published about PEN. Registered in `src/content/index.ts`. */
export const PEN_CONTENT = defineAirportContent({
  airport: 'pen',
  facilities,
  outlets: [],
  transport,
  carParks,
  airlines,
  notices,
  guidesNotes,
  sources,
});

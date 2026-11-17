/**
 * Kota Kinabalu International Airport (BKI).
 *
 * Where this comes from: `docs/research/facts/f-kk.json`, using only facts with evidence `search`
 * and confidence high or medium (search results obtained on 16 November 2026), plus three route
 * facts about Kota Kinabalu recorded in `f-others.json` (Miri, Mulu, Labuan). Nothing here was
 * read first hand.
 *
 * How the rules were applied:
 *  - Terminal: the research calls the passenger terminal "Terminal 1". The registry models Kota
 *    Kinabalu with one terminal (`MAIN`) and no levels, so locations are words only.
 *  - Buses: BAS.MY routes, fares, hours and payment come from third-party guides that cite the
 *    operator's tables, so the items are `estimated`. Departure times are prose because they are
 *    probably times from KK Sentral, not from the airport stop. No `operator` is set: BAS.MY is
 *    the service brand, and the company named as its operator is a low-confidence fact.
 *  - Parking: the tariff is known only from two parking directories, an older directory differs
 *    and the official rate board was not captured, so the car park is `not-verified` with both
 *    sets of figures quoted in its description.
 *  - Immigration: the Sabah rules for travellers from Peninsular Malaysia rest on press reports
 *    of the state government's position and on Immigration Department pages (`official`); the
 *    IMM.114 slip is reported by press and guides only, so it is a separate `estimated` note.
 *  - Airlines: entries are created only for airlines whose IATA designator is already recorded in
 *    this repository; the other carriers named by the press are listed by name in the gaps note.
 *    Foreign destinations are not listed because the research gives no airport codes for them.
 *  - Not published as current notices: the runway closure of 17 September 2026 (past) and the
 *    terminal expansion (not started as of July 2026).
 *
 * Known gaps (also published as the guide note `bki-content-gaps`): taxi and e-hailing details
 * (prior knowledge only); bus frequency and the airport bus stop; the official parking rate
 * board, bays and payment; lounges other than the Malaysia Airlines partner lounge (sources
 * conflict on whether the Golden Lounge and Plaza Premium Lounge still operate); left luggage and
 * the information desk (low confidence); shop and restaurant names; the level layout; the
 * airport operator's e-mail address (an operational contact, withheld).
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
import { CAAM, MAHB, RETRIEVED_16_NOV, contentGapsNote, source } from './_helpers';

const CHECKED = 'Checked 16 November 2026';
const OFFICIAL_PAGE = 'https://airports.malaysiaairports.com.my/kota-kinabalu';

/* -------------------------------------------------------------------------------------------
 * Facilities and lounges
 * ---------------------------------------------------------------------------------------- */

const facilities: Facility[] = [
  {
    id: 'bki-malaysia-airlines-partner-lounge',
    airport: 'bki',
    terminal: 'MAIN',
    name: lt(
      'Lounge for Malaysia Airlines passengers (domestic departures)',
      'Lounge untuk penumpang Malaysia Airlines (berlepas domestik)',
    ),
    category: 'lounge',
    zone: 'unknown',
    locationNote: lt(
      'Level 2, Domestic Departure, Main Terminal Building.',
      'Aras 2, Berlepas Domestik, Bangunan Terminal Utama.',
    ),
    hours: {
      kind: 'daily',
      open: '04:00',
      close: '00:00',
      note: lt('As listed by Malaysia Airlines on an undated page. Hours may change.', 'Seperti disenaraikan oleh Malaysia Airlines pada halaman tanpa tarikh. Waktu boleh berubah.'),
    },
    description: lt(
      "Malaysia Airlines lists this partner lounge for its eligible passengers. The lounge's brand name was not captured. Sources conflict on whether the airline's own Golden Lounge and the Plaza Premium Lounge still operate here, so neither is listed.",
      'Malaysia Airlines menyenaraikan lounge rakan kongsi ini untuk penumpangnya yang layak. Nama jenama lounge ini belum diperoleh. Sumber bercanggah tentang sama ada Golden Lounge syarikat itu dan Plaza Premium Lounge masih beroperasi di sini, jadi kedua-duanya tidak disenaraikan.',
    ),
    access: lt('Access rules are set by Malaysia Airlines.', 'Syarat akses ditetapkan oleh Malaysia Airlines.'),
    provenance: 'official',
    asOf: 'Page undated',
    sources: ['mh-lounge-partners'],
  },
  {
    id: 'bki-airport-contact',
    airport: 'bki',
    terminal: 'MAIN',
    name: lt('Contacting the airport', 'Menghubungi lapangan terbang'),
    category: 'information',
    zone: 'unknown',
    description: lt(
      "Malaysia Airports' group customer line is +603-8777 0000. Malaysia's aeronautical information publication lists +60 88 325 555 for the airport operator at Kota Kinabalu; we have not confirmed that this number answers passenger enquiries.",
      'Talian pelanggan kumpulan Malaysia Airports ialah +603-8777 0000. Penerbitan maklumat aeronautik Malaysia menyenaraikan +60 88 325 555 bagi pengendali lapangan terbang di Kota Kinabalu; kami belum mengesahkan bahawa nombor ini menjawab pertanyaan penumpang.',
    ),
    provenance: 'official',
    asOf: '2024-04-23',
    sources: ['mahb-contact', 'caam-eaip-wbkk-2024'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Ground transport: BAS.MY airport buses
 * ---------------------------------------------------------------------------------------- */

const BUS_PAYMENT = ['ManjaLink or ManjaPay', 'Concession card', 'Visa or Mastercard debit or credit card', 'DuitNow QR'];
const BUS_SOURCES = ['sabahguide-basmy-kk', 'railtravelstation-basmy-kk', 'kuchingborneo-basmy-kk-routes'];
const BUS_FREQUENCY: LocalizedText = lt(
  'Buses leave to a fixed timetable. How often they call at the airport is not verified.',
  'Bas bertolak mengikut jadual tetap. Kekerapan bas di lapangan terbang belum disahkan.',
);

function basMyRoute(input: {
  route: 'S07' | 'S08';
  path: LocalizedText;
  fare: number;
  first: string;
  last: string;
}): TransportOption {
  const { route, path, fare, first, last } = input;
  return {
    id: `bki-bus-${route.toLowerCase()}`,
    airport: 'bki',
    mode: 'bus',
    name: lt(`BAS.MY bus ${route} (KK Sentral)`, `Bas BAS.MY ${route} (KK Sentral)`),
    description: lt(
      `A loop that links the airport with the KK Sentral bus terminal: ${path.en}. Third-party guides say the buses are cashless. Routes S07 and S08 circulate in opposite directions, so the quicker one depends on where you are going. The stop at the airport is not verified here.`,
      `Laluan pusingan yang menghubungkan lapangan terbang dengan terminal bas KK Sentral: ${path.ms ?? path.en}. Panduan pihak ketiga menyatakan bas ini tanpa tunai. Laluan S07 dan S08 bergerak dalam arah bertentangan, jadi laluan yang lebih cepat bergantung pada destinasi anda. Hentian di lapangan terbang belum disahkan di sini.`,
    ),
    destinations: [
      {
        name: lt('KK Sentral bus terminal', 'Terminal bas KK Sentral'),
        fare: { amount: fare, currency: 'MYR', basis: 'per-person' },
        note: lt(
          'Fare between KK Sentral and the airport as given by a local guide that cites the operator fare table, checked 23 October 2026.',
          'Tambang antara KK Sentral dan lapangan terbang seperti dinyatakan oleh panduan tempatan yang memetik jadual tambang pengendali, disemak pada 23 Oktober 2026.',
        ),
      },
    ],
    frequency: BUS_FREQUENCY,
    hours: {
      kind: 'text',
      text: lt(
        `First departure about ${first} and last about ${last}, as listed by a third-party site. These are probably times from KK Sentral, not from the airport stop: confirm with the operator.`,
        `Bas pertama kira-kira ${first} dan terakhir kira-kira ${last}, seperti disenaraikan oleh laman pihak ketiga. Ini mungkin waktu dari KK Sentral, bukan dari hentian lapangan terbang: sahkan dengan pengendali.`,
      ),
    },
    boarding: [],
    payment: BUS_PAYMENT,
    provenance: 'estimated',
    asOf: '2026-10-23',
    sources: BUS_SOURCES,
  };
}

const transport: TransportOption[] = [
  basMyRoute({
    route: 'S07',
    path: lt(
      'KK Sentral, Jalan Kepayan, Aeropod (Tanjung Aru railway station), the airport, Jalan Lintas, KK Sentral',
      'KK Sentral, Jalan Kepayan, Aeropod (stesen kereta api Tanjung Aru), lapangan terbang, Jalan Lintas, KK Sentral',
    ),
    fare: 1.4,
    first: '05:45',
    last: '22:45',
  }),
  basMyRoute({
    route: 'S08',
    path: lt(
      'KK Sentral, Jalan Tunku Abdul Rahman, Sembulan railway station, Lido Avenue, the airport, Jalan Kepayan, KK Sentral',
      'KK Sentral, Jalan Tunku Abdul Rahman, stesen kereta api Sembulan, Lido Avenue, lapangan terbang, Jalan Kepayan, KK Sentral',
    ),
    fare: 2,
    first: '05:50',
    last: '22:50',
  }),
];

/* -------------------------------------------------------------------------------------------
 * Parking
 * ---------------------------------------------------------------------------------------- */

const carParks: CarPark[] = [
  {
    id: 'bki-airport-car-park',
    airport: 'bki',
    terminal: 'MAIN',
    name: lt('Airport car park', 'Tempat letak kereta lapangan terbang'),
    type: 'terminal',
    description: lt(
      'Rates are not verified because we have them only from parking directories, and the official rate board was not captured. Two directories agree on RM3 an hour for the first three hours, RM2 an hour for hours 4 to 12 and RM1 an hour for hours 13 to 20, up to RM35 a day. An older listing on parking.com.my, last updated in 2020, shows RM2 for the first hour, RM1 an hour after that and a RM24 daily maximum. Check the official Kota Kinabalu airport page or the rate board at the car park.',
      'Kadar belum disahkan kerana kami hanya memperolehnya daripada direktori parkir, dan papan kadar rasmi belum diperoleh. Dua direktori sepakat pada RM3 sejam bagi tiga jam pertama, RM2 sejam bagi jam 4 hingga 12 dan RM1 sejam bagi jam 13 hingga 20, sehingga RM35 sehari. Penyenaraian lama di parking.com.my, yang kali terakhir dikemas kini pada 2020, memaparkan RM2 bagi jam pertama, RM1 sejam selepas itu dan maksimum harian RM24. Semak halaman rasmi lapangan terbang Kota Kinabalu atau papan kadar di tempat letak kereta.',
    ),
    rates: [],
    rateStatus: 'not-verified',
    features: [],
    bookingUrl: OFFICIAL_PAGE,
    provenance: 'estimated',
    asOf: CHECKED,
    sources: ['parkinginmalaysia-kkia', 'klia2info-kkia', 'parkingcommy-kkia-older-listing'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Airlines (see the header: only airlines whose designator this repository already records)
 * ---------------------------------------------------------------------------------------- */

const PRESS_LIST_SOURCES = ['bernama-kkia-international-flights-2026', 'dailyexpress-kkia-international-flights-2026'];
const PRESS_LIST_NOTE: LocalizedText = lt(
  'Named in press reports of March 2026 among 13 airlines operating 153 international flights a week at Kota Kinabalu. Schedules change by season: check your booking.',
  'Dinamakan dalam laporan akhbar Mac 2026 antara 13 syarikat penerbangan yang mengendalikan 153 penerbangan antarabangsa seminggu di Kota Kinabalu. Jadual berubah mengikut musim: semak tempahan anda.',
);

const airlines: AirlineAtAirport[] = [
  {
    code: 'AK',
    name: 'AirAsia',
    destinations: [{ code: 'MYY', city: 'Miri', country: 'Malaysia' }],
    basis: 'third-party',
    note: lt(
      'Named in press reports of March 2026 among the airlines flying internationally from Kota Kinabalu. Flight listings retrieved in November 2026 also show AirAsia flying between Miri and Kota Kinabalu. Check your booking.',
      'Dinamakan dalam laporan akhbar Mac 2026 antara syarikat penerbangan antarabangsa di Kota Kinabalu. Penyenaraian penerbangan yang diperoleh pada November 2026 turut menunjukkan AirAsia terbang antara Miri dan Kota Kinabalu. Semak tempahan anda.',
    ),
    asOf: '2026-11',
    sources: [...PRESS_LIST_SOURCES, 'klia2info-miri', 'flightconnections-myy'],
  },
  {
    code: 'MY',
    name: 'AirBorneo',
    destinations: [
      { code: 'MZV', city: 'Mulu', country: 'Malaysia' },
      { code: 'LBU', city: 'Labuan', country: 'Malaysia' },
    ],
    basis: 'third-party',
    note: lt(
      "AirBorneo took over MASwings' rural and regional services in Sabah, Sarawak and Labuan on 1 January 2026. Flight listings from 2026 show it flying ATR 72 turboprops between Kota Kinabalu and Mulu, and also flying between Kota Kinabalu and Labuan.",
      'AirBorneo mengambil alih perkhidmatan luar bandar dan serantau MASwings di Sabah, Sarawak dan Labuan pada 1 Januari 2026. Penyenaraian penerbangan 2026 menunjukkan ia mengendalikan pesawat turboprop ATR 72 antara Kota Kinabalu dan Mulu, dan turut terbang antara Kota Kinabalu dan Labuan.',
    ),
    asOf: '2026-10',
    sources: ['capa-airborneo-takeover-2026', 'navitime-mzv', 'fr24-airborneo-9m-mwa', 'flightstats-lbu-departures'],
  },
  { code: 'TR', name: 'Scoot', destinations: [], basis: 'third-party', note: PRESS_LIST_NOTE, asOf: '2026-03', sources: PRESS_LIST_SOURCES },
  {
    code: 'BI',
    name: 'Royal Brunei Airlines',
    destinations: [],
    basis: 'third-party',
    note: PRESS_LIST_NOTE,
    asOf: '2026-03',
    sources: PRESS_LIST_SOURCES,
  },
];

/* -------------------------------------------------------------------------------------------
 * Notices
 * ---------------------------------------------------------------------------------------- */

const SABAH_RULE_SOURCES = [
  'thevibes-sabah-immigration-2022',
  'sinchew-sabah-mykad-2024',
  'imi-domestic-travel',
  'imi-restricted-travel-documents',
  'mh-visa-immigration-documents',
];

const notices: Notice[] = [
  {
    id: 'bki-sabah-immigration-from-peninsular',
    airport: 'bki',
    severity: 'info',
    title: lt(
      'Flying from Peninsular Malaysia? Sabah has its own immigration check',
      'Terbang dari Semenanjung Malaysia? Sabah mempunyai pemeriksaan imigresen sendiri',
    ),
    body: lt(
      'Sabah keeps its own immigration control, so you pass an immigration check at Kota Kinabalu even on a domestic flight from Peninsular Malaysia. Malaysian citizens can enter with a MyKad (a passport is also accepted) and may stay up to 90 days on a visit. A stay of more than three months needs a Restricted Travel Document from the Immigration Department, and working in Sabah needs a work pass. Malaysia Airlines accepts original documents only, not photocopies. Rules can change: confirm with the Immigration Department of Malaysia.',
      'Sabah mengekalkan kawalan imigresen sendiri, jadi anda melalui pemeriksaan imigresen di Kota Kinabalu walaupun dengan penerbangan domestik dari Semenanjung Malaysia. Warganegara Malaysia boleh masuk dengan MyKad (pasport juga diterima) dan boleh tinggal sehingga 90 hari bagi lawatan. Tinggal melebihi tiga bulan memerlukan Dokumen Perjalanan Terhad daripada Jabatan Imigresen, dan bekerja di Sabah memerlukan pas kerja. Malaysia Airlines hanya menerima dokumen asal, bukan salinan. Peraturan boleh berubah: sahkan dengan Jabatan Imigresen Malaysia.',
    ),
    provenance: 'official',
    asOf: '2026-08',
    sources: [...SABAH_RULE_SOURCES, 'seasia-sabah-sarawak-passports-2026'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Notes for the journey timeline and guides
 * ---------------------------------------------------------------------------------------- */

const guidesNotes: GuideNote[] = [
  {
    id: 'bki-all-flights-terminal-1',
    airport: 'bki',
    topic: 'terminal',
    title: lt('All passenger flights use Terminal 1', 'Semua penerbangan penumpang menggunakan Terminal 1'),
    body: lt(
      'All scheduled passenger flights use Terminal 1, a single building with separate domestic and international sections. The former Terminal 2 closed to passenger flights on 1 December 2015 and is now used for cargo, charter and general aviation.',
      'Semua penerbangan penumpang berjadual menggunakan Terminal 1, sebuah bangunan dengan bahagian domestik dan antarabangsa yang berasingan. Terminal 2 yang dahulu ditutup kepada penerbangan penumpang pada 1 Disember 2015 dan kini digunakan untuk kargo, sewa khas dan penerbangan am.',
    ),
    provenance: 'estimated',
    asOf: CHECKED,
    sources: ['wikipedia-bki', 'propertyhunter-kkia-t2-closing-2015', 'caam-eaip-wbkk-2024', 'worldtravelguide-bki'],
  },
  {
    id: 'bki-sabah-immigration-arrival',
    airport: 'bki',
    topic: 'immigration',
    title: lt('Immigration check on domestic arrivals', 'Pemeriksaan imigresen bagi ketibaan domestik'),
    body: lt(
      'Arriving from Peninsular Malaysia, have your MyKad or passport ready: Sabah checks immigration on domestic arrivals too. A visit on a MyKad is limited to 90 days.',
      'Jika tiba dari Semenanjung Malaysia, sediakan MyKad atau pasport anda: Sabah turut menjalankan pemeriksaan imigresen bagi ketibaan domestik. Lawatan dengan MyKad terhad kepada 90 hari.',
    ),
    appliesTo: { scope: 'domestic', direction: 'arriving' },
    provenance: 'official',
    asOf: '2026-08',
    sources: ['thevibes-sabah-immigration-2022', 'sinchew-sabah-mykad-2024', 'imi-domestic-travel'],
  },
  {
    id: 'bki-sabah-entry-slip',
    airport: 'bki',
    topic: 'immigration',
    title: lt('Keep the slip you are given', 'Simpan slip yang diberikan'),
    body: lt(
      'Press reports and travel guides say MyKad holders from Peninsular Malaysia are given a printed slip on arrival, described as form IMM.114, which states how long they may stay. One guide says it must be handed back when you leave Sabah, so keep it with your MyKad. We have not seen the official wording: check with the Immigration Department.',
      'Laporan akhbar dan panduan perjalanan menyatakan pemegang MyKad dari Semenanjung Malaysia diberi slip bercetak semasa ketibaan, yang disebut sebagai borang IMM.114, yang menyatakan tempoh mereka boleh tinggal. Satu panduan menyatakan slip itu perlu diserahkan semula apabila meninggalkan Sabah, jadi simpan bersama MyKad anda. Kami belum melihat teks rasmi: semak dengan Jabatan Imigresen.',
    ),
    appliesTo: { scope: 'domestic', direction: 'arriving' },
    provenance: 'estimated',
    asOf: '2026-08',
    sources: ['sinchew-sabah-mykad-2024', 'seasia-sabah-sarawak-passports-2026'],
  },
  {
    id: 'bki-domestic-departure-documents',
    airport: 'bki',
    topic: 'immigration',
    title: lt('Leaving Sabah on a domestic flight', 'Meninggalkan Sabah dengan penerbangan domestik'),
    body: lt(
      'The Immigration Department asks travellers leaving Sabah on a domestic flight to show an accepted identity document, such as a passport, MyKad or temporary identity card, together with their boarding pass. Malaysia Airlines accepts original documents only.',
      'Jabatan Imigresen meminta pengembara yang meninggalkan Sabah dengan penerbangan domestik menunjukkan dokumen pengenalan yang diterima, seperti pasport, MyKad atau kad pengenalan sementara, bersama pas masuk. Malaysia Airlines hanya menerima dokumen asal.',
    ),
    appliesTo: { scope: 'domestic', direction: 'departing' },
    provenance: 'official',
    asOf: CHECKED,
    sources: ['imi-domestic-travel', 'mh-visa-immigration-documents'],
  },
  {
    id: 'bki-airport-buses-cashless',
    airport: 'bki',
    topic: 'onward-transport',
    title: lt('Airport buses do not take cash', 'Bas lapangan terbang tidak menerima tunai'),
    body: lt(
      'Third-party guides say the BAS.MY buses on routes S07 and S08 to KK Sentral are cashless: pay with ManjaLink or ManjaPay, a concession card, a Visa or Mastercard debit or credit card, or DuitNow QR.',
      'Panduan pihak ketiga menyatakan bas BAS.MY bagi laluan S07 dan S08 ke KK Sentral adalah tanpa tunai: bayar dengan ManjaLink atau ManjaPay, kad konsesi, kad debit atau kredit Visa atau Mastercard, atau DuitNow QR.',
    ),
    appliesTo: { direction: 'arriving' },
    provenance: 'estimated',
    asOf: '2026-10-23',
    sources: BUS_SOURCES,
  },
  contentGapsNote({
    airport: 'bki',
    title: lt(
      'What this prototype has not verified at Kota Kinabalu',
      'Perkara yang belum disahkan oleh prototaip ini di Kota Kinabalu',
    ),
    body: lt(
      'Left out because we could not verify them: taxi and e-hailing pick-up points and fares; how often the airport buses run and where they stop; the official parking rates, the number of bays and how to pay; whether the Golden Lounge and Plaza Premium Lounge are open; left luggage; the information desk; shop and restaurant names; which level each service is on. Press reports of March 2026 also name Batik Air, Air Busan, Jin Air, Jeju Air, T’way Air, HK Express, China Southern Airlines, Shanghai Airlines, Spring Airlines and Xiamen Airlines at Kota Kinabalu, and other reports record flights from Shanghai (Spring Airlines, daily again from 28 January 2026) and from Chongqing (Chongqing Airlines, three a week when it launched in March 2026); they are not listed here yet and current schedules were not re-checked. For these, use the official Kota Kinabalu airport page or call Malaysia Airports on +603-8777 0000.',
      'Tidak disertakan kerana belum dapat disahkan: tempat mengambil penumpang dan tambang teksi serta e-hailing; kekerapan dan hentian bas lapangan terbang; kadar parkir rasmi, bilangan petak dan cara bayaran; sama ada Golden Lounge dan Plaza Premium Lounge dibuka; simpanan bagasi; kaunter pertanyaan; nama kedai dan restoran; aras bagi setiap perkhidmatan. Laporan akhbar Mac 2026 turut menamakan Batik Air, Air Busan, Jin Air, Jeju Air, T’way Air, HK Express, China Southern Airlines, Shanghai Airlines, Spring Airlines dan Xiamen Airlines di Kota Kinabalu, dan laporan lain merekodkan penerbangan dari Shanghai (Spring Airlines, setiap hari semula mulai 28 Januari 2026) dan dari Chongqing (Chongqing Airlines, tiga kali seminggu semasa dilancarkan pada Mac 2026); semuanya belum disenaraikan di sini dan jadual semasa tidak disemak semula. Untuk perkara ini, gunakan halaman rasmi lapangan terbang Kota Kinabalu atau hubungi Malaysia Airports di +603-8777 0000.',
    ),
    sources: [
      'prototype-method',
      'mahb-kota-kinabalu-site',
      'mahb-contact',
      ...PRESS_LIST_SOURCES,
      'tourism-malaysia-shanghai-kk-2026',
      'malaymail-chongqing-kk-2026',
    ],
    asOf: RETRIEVED_16_NOV,
  }),
];

/* -------------------------------------------------------------------------------------------
 * Sources used only by Kota Kinabalu content (search results of 16 November 2026).
 * Sources shared with other airports (Immigration Department, Malaysia Airlines, AirBorneo
 * listings) are in `../sources.ts`.
 * ---------------------------------------------------------------------------------------- */

const R = RETRIEVED_16_NOV;

const sources: Source[] = [
  source('mahb-kota-kinabalu-site', 'official', MAHB, 'Kota Kinabalu International Airport: official passenger pages (as indexed)', OFFICIAL_PAGE, R),
  source('caam-eaip-wbkk-2024', 'government', CAAM, 'eAIP Malaysia: WBKK Kota Kinabalu International (AD 2), edition of 23 April 2024', 'https://aip.caam.gov.my/aip/eAIP/2024-04-23/html/eAIP/WM-AD-2.WBKK-en-MS.html', R, '2024-04-23'),
  source('mh-lounge-partners', 'operator', 'Malaysia Airlines', 'Lounge partners', 'https://www.malaysiaairlines.com/uk/en/experience/lounge/lounge-partners.html', R),
  source('wikipedia-bki', 'other', 'Wikipedia', 'Kota Kinabalu International Airport', 'https://en.wikipedia.org/wiki/Kota_Kinabalu_International_Airport', R),
  source('propertyhunter-kkia-t2-closing-2015', 'news', 'PropertyHunter', 'Terminal 2 is closing: AirAsia will move to KKIA T1 on 1st December', 'https://www.propertyhunter.com.my/news/2015/11/1926/sabah/terminal-2-is-closing-ndash-airasia-will-move-to-kkia-t1-on-1st-december', R, '2015-11'),
  source('worldtravelguide-bki', 'aggregator', 'World Travel Guide', 'Kota Kinabalu International Airport guide', 'https://www.worldtravelguide.net/?p=23559', R),
  source('sabahguide-basmy-kk', 'aggregator', 'SabahGuide', 'BAS.MY pink bus in Kota Kinabalu', 'https://sabahguide.com/travel/basmy-pink-bus-kk/', R, '2026-10-23'),
  source('railtravelstation-basmy-kk', 'other', 'RailTravel Station', 'BAS.MY Kota Kinabalu', 'https://railtravelstation.com/bas-my-kota-kinabalu/', R, '2026-09'),
  source('kuchingborneo-basmy-kk-routes', 'other', 'KuchingBorneo.info', 'Full list of BAS.MY Kota Kinabalu routes', 'https://kuchingborneo.info/full-list-bas-my-kota-kinabalu-routes-every-stop-route-and-major-area-covered-by-sabahs-new-pink-bus-network/', R, '2026'),
  source('parkinginmalaysia-kkia', 'aggregator', 'Parking in Malaysia', 'Kota Kinabalu International Airport (KKIA) parking info', 'https://parkinginmalaysia.com/kota-kinabalu-international-airport-kkia-parking-info/', R),
  source('klia2info-kkia', 'aggregator', 'klia2.info', 'Kota Kinabalu International Airport', 'https://www.klia2.info/airports/kota-kinabalu-international-airport/', R),
  source('parkingcommy-kkia-older-listing', 'aggregator', 'parking.com.my', 'Older Kota Kinabalu airport parking listing (last updated 2020), as quoted in search results; exact link not recorded', 'https://parking.com.my/', R, '2020'),
  source('bernama-kkia-international-flights-2026', 'news', 'Bernama', '153 international flights weekly to KKIA', 'https://www.bernama.com/tv/news.php?id=2532140', R, '2026-03'),
  source('dailyexpress-kkia-international-flights-2026', 'news', 'Daily Express', '153 international flights weekly to KKIA, two new routes expected', 'https://www.dailyexpress.com.my/interest/3260/153-international-flights-weekly-to-kkia-two-new-routes-expected/', R, '2026-03'),
  source('malaymail-chongqing-kk-2026', 'news', 'Malay Mail', 'New Chongqing to Kota Kinabalu route expected to spur Sabah tourism during Visit Malaysia 2026', 'https://www.malaymail.com/news/malaysia/2026/03/21/new-chongqingkota-kinabalu-route-expected-to-spur-sabah-tourism-during-visit-malaysia-2026/213423', R, '2026-03-21'),
  source('tourism-malaysia-shanghai-kk-2026', 'government', 'Tourism Malaysia', 'New Shanghai to Kota Kinabalu direct flight boosts China to Sabah connectivity for Visit Malaysia 2026', 'https://www.tourism.gov.my/media/view/new-shanghai-kota-kinabalu-direct-flight-boosts-china-sabah-connectivity-for-visit-malaysia-2026-vm2026', R, '2026-01'),
  source('thevibes-sabah-immigration-2022', 'news', 'The Vibes', 'Sabahans first: Masidi says no to scrapping pass requirements for Peninsular Malaysians', 'https://www.thevibes.com/articles/news/68822/sabahans-first-masidi-says-no-to-scrapping-pass-requirements-for-peninsular-msians', R, '2022'),
  source('sinchew-sabah-mykad-2024', 'news', 'Sin Chew Daily', 'Report on MyKad entry to Sabah and the travel slip issued on arrival', 'https://mysinchew.sinchew.com.my/news/20240305/mysinchew/5441350', R, '2024-03-05'),
  source('seasia-sabah-sarawak-passports-2026', 'other', 'Seasia', 'Why West Malaysians need passports when visiting Sarawak and Sabah', 'https://seasia.co/2026/08/06/why-west-malaysians-need-passports-when-visiting-sarawak-and-sabah', R, '2026-08-06'),
  source('flightstats-lbu-departures', 'aggregator', 'FlightStats', 'Labuan Airport (LBU) departures', 'https://www.flightstats.com/v2/flight-tracker/departures/LBU', R, '2026-09'),
];

/** Everything published about BKI. Registered in `src/content/index.ts`. */
export const BKI_CONTENT = defineAirportContent({
  airport: 'bki',
  facilities,
  outlets: [],
  transport,
  carParks,
  airlines,
  notices,
  guidesNotes,
  sources,
});

/**
 * Kuching International Airport (KCH).
 *
 * Where this comes from: `docs/research/facts/f-kuching.json`. That file is thin: of its 62
 * facts, 41 are unconfirmed background knowledge (`prior`), including everything it holds on the
 * terminal layout, ground transport, lounges, facilities and the Sarawak arrival immigration
 * rules. None of those is published. What remains (evidence `search`, confidence high or medium)
 * is relayed from the other research files: a few airline routes, the Immigration Department's
 * domestic-travel pages and Malaysia Airlines' document policy.
 *
 * So this file is deliberately short: two airlines with sourced routes, one notice about travel
 * documents, one journey note and the gaps note. No facilities, transport options or car parks.
 *
 * Known gaps (also published as the guide note `kch-content-gaps`): terminal layout and levels;
 * taxis, e-hailing and buses; parking; lounges; facilities; outlets; the arrival immigration
 * check and the length of stay on a MyKad (prior knowledge only); the airline and destination
 * list beyond the routes below; the address of the official Kuching section on the passenger
 * website. Detailed content awaits a first-hand source.
 */
import { defineAirportContent, lt, type AirlineAtAirport, type GuideNote, type Notice, type Source } from '../types';
import { RETRIEVED_16_NOV, contentGapsNote, source } from './_helpers';

/** The day the research run checked these pages. */
const CHECKED = '2026-11-16';

/* -------------------------------------------------------------------------------------------
 * Airlines: only routes that flight listings retrieved in 2026 support
 * ---------------------------------------------------------------------------------------- */

const airlines: AirlineAtAirport[] = [
  {
    code: 'AK',
    name: 'AirAsia',
    destinations: [
      { code: 'MYY', city: 'Miri', country: 'Malaysia' },
      { code: 'SBW', city: 'Sibu', country: 'Malaysia' },
    ],
    basis: 'third-party',
    note: lt(
      'Flight listings retrieved in November 2026 show AirAsia flying between Kuching and Miri, and between Kuching and Sibu. Not confirmed by the airline or the airport: check your booking.',
      'Penyenaraian penerbangan yang diperoleh pada November 2026 menunjukkan AirAsia terbang antara Kuching dan Miri, serta antara Kuching dan Sibu. Belum disahkan oleh syarikat penerbangan atau lapangan terbang: semak tempahan anda.',
    ),
    asOf: '2026-11',
    sources: ['klia2info-miri', 'flightconnections-myy', 'fr24-sbw', 'flightstats-sbw-departures'],
  },
  {
    code: 'MY',
    name: 'AirBorneo',
    destinations: [{ code: 'MZV', city: 'Mulu', country: 'Malaysia' }],
    basis: 'third-party',
    note: lt(
      "AirBorneo, the airline owned by the Sarawak Government, took over MASwings' rural and regional services on 1 January 2026. Flight listings from 2026 show it flying ATR 72 turboprops between Kuching and Mulu, with flight numbers that begin with MY.",
      'AirBorneo, syarikat penerbangan milik Kerajaan Sarawak, mengambil alih perkhidmatan luar bandar dan serantau MASwings pada 1 Januari 2026. Penyenaraian penerbangan 2026 menunjukkan ia mengendalikan pesawat turboprop ATR 72 antara Kuching dan Mulu, dengan nombor penerbangan bermula dengan MY.',
    ),
    asOf: '2026-10',
    sources: ['capa-airborneo-takeover-2026', 'navitime-mzv', 'fr24-airborneo-9m-mwa'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Notices
 * ---------------------------------------------------------------------------------------- */

const notices: Notice[] = [
  {
    id: 'kch-sarawak-travel-documents',
    airport: 'kch',
    severity: 'info',
    title: lt(
      'Flying between Peninsular Malaysia and Sarawak? Carry your original identity document',
      'Terbang antara Semenanjung Malaysia dan Sarawak? Bawa dokumen pengenalan asal anda',
    ),
    body: lt(
      'The Immigration Department asks travellers leaving Sabah or Sarawak on a domestic flight to show an accepted identity document, such as a passport, MyKad or temporary identity card, together with their boarding pass. Malaysians from Peninsular Malaysia who plan to stay in Sarawak for more than three months need a Restricted Travel Document. Malaysia Airlines accepts original documents only, not photocopies. We have not verified the immigration check on arrival at Kuching or how long a visit on a MyKad may last: confirm with the Immigration Department of Malaysia before you travel.',
      'Jabatan Imigresen meminta pengembara yang meninggalkan Sabah atau Sarawak dengan penerbangan domestik menunjukkan dokumen pengenalan yang diterima, seperti pasport, MyKad atau kad pengenalan sementara, bersama pas masuk. Rakyat Malaysia dari Semenanjung yang bercadang tinggal di Sarawak melebihi tiga bulan memerlukan Dokumen Perjalanan Terhad. Malaysia Airlines hanya menerima dokumen asal, bukan salinan. Kami belum mengesahkan pemeriksaan imigresen semasa ketibaan di Kuching atau tempoh lawatan dengan MyKad: sahkan dengan Jabatan Imigresen Malaysia sebelum perjalanan.',
    ),
    provenance: 'official',
    asOf: CHECKED,
    sources: ['imi-domestic-travel', 'imi-restricted-travel-documents', 'mh-visa-immigration-documents'],
  },
];

/* -------------------------------------------------------------------------------------------
 * Notes for the journey timeline and guides
 * ---------------------------------------------------------------------------------------- */

const guidesNotes: GuideNote[] = [
  {
    id: 'kch-domestic-departure-documents',
    airport: 'kch',
    topic: 'immigration',
    title: lt('Leaving Sarawak on a domestic flight', 'Meninggalkan Sarawak dengan penerbangan domestik'),
    body: lt(
      'The Immigration Department asks travellers leaving Sarawak on a domestic flight to show an accepted identity document, such as a passport, MyKad or temporary identity card, together with their boarding pass. Malaysia Airlines accepts original documents only.',
      'Jabatan Imigresen meminta pengembara yang meninggalkan Sarawak dengan penerbangan domestik menunjukkan dokumen pengenalan yang diterima, seperti pasport, MyKad atau kad pengenalan sementara, bersama pas masuk. Malaysia Airlines hanya menerima dokumen asal.',
    ),
    appliesTo: { scope: 'domestic', direction: 'departing' },
    provenance: 'official',
    asOf: CHECKED,
    sources: ['imi-domestic-travel', 'mh-visa-immigration-documents'],
  },
  contentGapsNote({
    airport: 'kch',
    title: lt(
      'Detailed information for Kuching is not available here yet',
      'Maklumat terperinci untuk Kuching belum tersedia di sini',
    ),
    body: lt(
      'Detailed content for Kuching awaits a first-hand source. We have left out everything we could not verify: the terminal layout; taxis, e-hailing and buses; parking; lounges, facilities, shops and restaurants; the immigration check on arrival and how long a visit on a MyKad may last; and airlines and destinations beyond AirAsia and AirBorneo (flight listings also show a Kuching to Bintulu route, but not which airline flies it). Use the official Malaysia Airports website or call Malaysia Airports on +603-8777 0000.',
      'Kandungan terperinci untuk Kuching menunggu sumber langsung. Kami tidak menyertakan apa-apa yang belum dapat disahkan: susun atur terminal; teksi, e-hailing dan bas; parkir; lounge, kemudahan, kedai dan restoran; pemeriksaan imigresen semasa ketibaan dan tempoh lawatan dengan MyKad; serta syarikat penerbangan dan destinasi selain AirAsia dan AirBorneo (penyenaraian penerbangan turut menunjukkan laluan Kuching ke Bintulu, tetapi bukan syarikat yang mengendalikannya). Gunakan laman web rasmi Malaysia Airports atau hubungi Malaysia Airports di +603-8777 0000.',
    ),
    sources: ['prototype-method', 'mahb-airports-site', 'mahb-contact', 'fr24-btu', 'flightsfrom-btu'],
    asOf: RETRIEVED_16_NOV,
    gaps: [{ area: 'facilities' }, { area: 'outlets' }, { area: 'transport' }, { area: 'car-parks' }, { area: 'maps' }],
  }),
];

/* -------------------------------------------------------------------------------------------
 * Sources used only by Kuching content (search results of 16 November 2026)
 * ---------------------------------------------------------------------------------------- */

const sources: Source[] = [
  source(
    'flightstats-sbw-departures',
    'aggregator',
    'FlightStats',
    'Sibu Airport (SBW) departures',
    'https://www.flightstats.com/v2/flight-tracker/departures/SBW',
    RETRIEVED_16_NOV,
    '2026-11',
  ),
  source(
    'flightsfrom-btu',
    'aggregator',
    'FlightsFrom.com',
    'Flights from Bintulu (BTU)',
    'https://www.flightsfrom.com/BTU',
    RETRIEVED_16_NOV,
    '2026-11',
  ),
];

/** Everything published about KCH. Registered in `src/content/index.ts`. */
export const KCH_CONTENT = defineAirportContent({
  airport: 'kch',
  airlines,
  notices,
  guidesNotes,
  sources,
});

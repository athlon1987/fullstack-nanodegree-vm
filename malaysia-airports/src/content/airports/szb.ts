/**
 * Sultan Abdul Aziz Shah Airport, Subang (SZB).
 *
 * Subang has no dedicated research file. This file holds only what `f-network.json` and
 * `f-others.json` support at evidence level `search`, confidence medium: press reports (The Edge
 * Malaysia) on jet services and the night curfew, and flight listings that show Firefly flying
 * to Subang from Kuala Terengganu and Alor Setar. The research notes that the year of two events
 * (AirAsia's and Firefly's jet withdrawals, 2025) is inferred from the articles' context: The Edge
 * gives only "in April" and "starting Aug 19". The text therefore says that the year is our
 * reading, and the date of the curfew report is given as approximate.
 *
 * Not published: the 2025 passenger count (aggregator only, low confidence); other airlines said
 * to use Subang (unverified); capacity targets and slot limits (not passenger information).
 * Subang's ICAO code and official name are flagged as unconfirmed in the registry.
 *
 * Known gaps (also published as the guide note `szb-content-gaps`): the current airline list and
 * routes; terminal facilities, lounges, transport and parking; who operates the terminal; whether
 * the curfew is unchanged. Detailed content awaits a first-hand source.
 */
import { NOTES } from '../source-notes';
import { defineAirportContent, lt, type AirlineAtAirport, type GuideNote, type Source } from '../types';
import { RETRIEVED_16_NOV, contentGapsNote, source } from './_helpers';

const airlines: AirlineAtAirport[] = [
  {
    code: 'FY',
    name: 'Firefly',
    destinations: [
      { code: 'TGG', city: 'Kuala Terengganu', country: 'Malaysia' },
      { code: 'AOR', city: 'Alor Setar', country: 'Malaysia' },
    ],
    basis: 'third-party',
    note: lt(
      'Flight listings retrieved in late 2026 show Firefly flying between Subang and Kuala Terengganu, and between Subang and Alor Setar. The Edge reports that Firefly stopped jet flights from Subang from 19 August and kept its turboprop flights; the report does not state the year, which we read as 2025. Not confirmed by the airline or the airport: check your booking.',
      'Penyenaraian penerbangan yang diperoleh pada akhir 2026 menunjukkan Firefly terbang antara Subang dan Kuala Terengganu, serta antara Subang dan Alor Setar. The Edge melaporkan Firefly menghentikan penerbangan jet dari Subang mulai 19 Ogos dan mengekalkan penerbangan turboprop; laporan itu tidak menyatakan tahun, yang kami fahami sebagai 2025. Belum disahkan oleh syarikat penerbangan atau lapangan terbang: semak tempahan anda.',
    ),
    asOf: '2026-11',
    sources: ['fr24-tgg', 'klia2info-aor', 'theedge-firefly-jets-subang-2025'],
  },
];

const guidesNotes: GuideNote[] = [
  {
    id: 'szb-check-which-airport',
    airport: 'szb',
    topic: 'terminal',
    title: lt(
      'Check which Kuala Lumpur airport your flight uses',
      'Semak lapangan terbang Kuala Lumpur yang digunakan oleh penerbangan anda',
    ),
    body: lt(
      'Subang (SZB) and KLIA (KUL) are different airports. Scheduled jet flights returned to Subang on 1 August 2024, but The Edge reports that AirAsia then moved its jet flights to KLIA in April and that Firefly stopped jet flights from Subang from 19 August. The reports do not state the year, which we read as 2025. Check the airport code on your booking before you set off.',
      'Subang (SZB) dan KLIA (KUL) ialah lapangan terbang yang berbeza. Penerbangan jet berjadual kembali ke Subang pada 1 Ogos 2024, tetapi The Edge melaporkan AirAsia kemudian memindahkan penerbangan jetnya ke KLIA pada April dan Firefly menghentikan penerbangan jet dari Subang mulai 19 Ogos. Laporan itu tidak menyatakan tahun, yang kami fahami sebagai 2025. Semak kod lapangan terbang pada tempahan anda sebelum bertolak.',
    ),
    provenance: 'estimated',
    asOf: '2025',
    asOfNote: lt('Reported about 2024 to 2025; article dates not captured', 'Dilaporkan sekitar 2024 hingga 2025; tarikh artikel tidak direkodkan'),
    sources: ['theedge-subang-structural-limits', 'theedge-firefly-jets-subang-2025'],
  },
  {
    id: 'szb-night-curfew',
    airport: 'szb',
    topic: 'terminal',
    title: lt('Subang has a night curfew', 'Subang mempunyai perintah berkurung malam'),
    body: lt(
      'Subang Airport operates under a night curfew from 22:00 to 06:00 to limit noise for nearby homes, according to a report in The Edge that quotes the transport minister (about mid-2024; the article date was not captured). It was reported in connection with jet flights; whether it applies in the same way to turboprop flights is not verified.',
      'Lapangan Terbang Subang beroperasi di bawah perintah berkurung malam dari 22:00 hingga 06:00 bagi mengehadkan bunyi bising untuk kediaman berhampiran, menurut laporan The Edge yang memetik menteri pengangkutan (kira-kira pertengahan 2024; tarikh artikel tidak direkodkan). Ia dilaporkan berkaitan penerbangan jet; sama ada ia terpakai dengan cara yang sama bagi penerbangan turboprop belum disahkan.',
    ),
    provenance: 'estimated',
    asOf: '2024',
    asOfNote: lt('Reported about mid-2024; article date not captured', 'Dilaporkan sekitar pertengahan 2024; tarikh artikel tidak direkodkan'),
    sources: ['theedge-subang-capacity-curfew-2024', 'theedge-subang-structural-limits'],
  },
  contentGapsNote({
    airport: 'szb',
    title: lt(
      'Detailed information for Subang is not available here yet',
      'Maklumat terperinci untuk Subang belum tersedia di sini',
    ),
    body: lt(
      'Malaysia Airports lists Subang among its domestic airports. Detailed content for Subang awaits a first-hand source. We have not verified its current airlines and routes beyond the Firefly flights listed, or its facilities, lounges, transport and parking, so none is shown. Ask your airline, or call Malaysia Airports on +603-8777 0000.',
      'Malaysia Airports menyenaraikan Subang antara lapangan terbang domestiknya. Kandungan terperinci untuk Subang menunggu sumber langsung. Kami belum mengesahkan syarikat penerbangan dan laluan semasa selain penerbangan Firefly yang disenaraikan, atau kemudahan, lounge, pengangkutan dan parkirnya, jadi tiada yang dipaparkan. Tanya syarikat penerbangan anda, atau hubungi Malaysia Airports di +603-8777 0000.',
    ),
    sources: ['prototype-method', 'mahb-annual-report-2023', 'mahb-contact'],
    asOf: RETRIEVED_16_NOV,
    gaps: [{ area: 'facilities' }, { area: 'outlets' }, { area: 'transport' }, { area: 'car-parks' }],
  }),
];

const sources: Source[] = [
  source(
    'theedge-subang-structural-limits',
    'news',
    'The Edge Malaysia',
    "Subang's premium city airport ambition held back by structural limitations",
    'https://theedgemalaysia.com/node/765313',
    RETRIEVED_16_NOV,
    '2025',
    { asOfNote: NOTES.reportedAbout },
  ),
  source(
    'theedge-subang-capacity-curfew-2024',
    'news',
    'The Edge Malaysia',
    'Subang Airport doubles capacity to 3 mil passengers a year, with 10pm-6am curfew: transport minister',
    'https://theedgemalaysia.com/node/720870',
    RETRIEVED_16_NOV,
    '2024',
    { asOfNote: NOTES.reportedAbout },
  ),
  source(
    'theedge-firefly-jets-subang-2025',
    'news',
    'The Edge Malaysia',
    'Firefly to cease jet operations at Subang Airport from August',
    'https://theedgemalaysia.com/node/764537',
    RETRIEVED_16_NOV,
    '2025',
    { asOfNote: NOTES.reportedAbout },
  ),
  source(
    'klia2info-aor',
    'aggregator',
    'klia2.info',
    'Alor Setar Airport (AOR): Sultan Abdul Halim, Kedah',
    'https://www.klia2.info/airports/sultan-abdul-halim-airport/',
    RETRIEVED_16_NOV,
    '2026-10-22',
  ),
];

/** Everything published about SZB. Registered in `src/content/index.ts`. */
export const SZB_CONTENT = defineAirportContent({
  airport: 'szb',
  airlines,
  guidesNotes,
  sources,
});

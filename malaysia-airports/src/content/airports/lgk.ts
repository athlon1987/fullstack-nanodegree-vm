/**
 * Langkawi International Airport (LGK).
 *
 * Langkawi has no dedicated research file. `f-network.json` and `f-others.json` support only
 * two things at evidence level `search`: that it is one of Malaysia Airports' five international
 * airports, and that the official passenger website has a Langkawi section. Its ICAO code and
 * locality are unconfirmed background knowledge (the registry already flags the ICAO code).
 *
 * So nothing is published here except the gaps note: no facilities, transport, parking, airlines
 * or notices. Detailed content awaits a first-hand source.
 */
import { defineAirportContent, lt, type GuideNote, type Source } from '../types';
import { MAHB, RETRIEVED_16_NOV, contentGapsNote, source } from './_helpers';

const guidesNotes: GuideNote[] = [
  contentGapsNote({
    airport: 'lgk',
    title: lt(
      'Detailed information for Langkawi is not available here yet',
      'Maklumat terperinci untuk Langkawi belum tersedia di sini',
    ),
    body: lt(
      "Langkawi International Airport is one of Malaysia Airports' five international airports and has its own section on the official passenger website. Detailed content awaits a first-hand source: we have not verified its facilities, lounges, transport, parking, airlines or destinations, so none is shown. Use the official Langkawi airport page or call Malaysia Airports on +603-8777 0000.",
      'Lapangan Terbang Antarabangsa Langkawi ialah salah satu daripada lima lapangan terbang antarabangsa Malaysia Airports dan mempunyai bahagian sendiri di laman web penumpang rasmi. Kandungan terperinci menunggu sumber langsung: kami belum mengesahkan kemudahan, lounge, pengangkutan, parkir, syarikat penerbangan atau destinasinya, jadi tiada yang dipaparkan. Gunakan halaman rasmi lapangan terbang Langkawi atau hubungi Malaysia Airports di +603-8777 0000.',
    ),
    sources: ['prototype-method', 'mahb-langkawi-site', 'mahb-annual-report-2023', 'mahb-contact'],
    asOf: RETRIEVED_16_NOV,
  }),
];

const sources: Source[] = [
  source(
    'mahb-langkawi-site',
    'official',
    MAHB,
    'Langkawi International Airport: official passenger pages (as indexed)',
    'https://airports.malaysiaairports.com.my/en/langkawi',
    RETRIEVED_16_NOV,
  ),
];

/** Everything published about LGK. Registered in `src/content/index.ts`. */
export const LGK_CONTENT = defineAirportContent({
  airport: 'lgk',
  guidesNotes,
  sources,
});

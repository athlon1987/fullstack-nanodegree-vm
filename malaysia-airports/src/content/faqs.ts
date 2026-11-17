/**
 * Help-centre topics and frequently asked questions: a small verified seed plus helpers.
 *
 * Content authors: add entries to `FAQS` (or spread in arrays from new files). Each answer needs
 * `sources` and a `provenance` tag; answers must not state anything the sources do not support.
 */
import { lt, type Faq, type LocalizedText } from './types';

/** A help-centre topic (`/help/[topic]`). */
export interface HelpTopic {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
}

/** Help topics, in display order. `Faq.topic` refers to these slugs. */
export const HELP_TOPICS: HelpTopic[] = [
  { slug: 'terminals', title: lt('Terminals and finding your way', 'Terminal dan mencari arah'), summary: lt('Which terminal, which level, which gate.', 'Terminal, aras dan pintu yang betul.') },
  { slug: 'flights', title: lt('Flights and disruption', 'Penerbangan dan gangguan'), summary: lt('Flight status, delays and who to contact.', 'Status penerbangan, kelewatan dan pihak untuk dihubungi.') },
  { slug: 'baggage', title: lt('Baggage', 'Bagasi'), summary: lt('Delayed, damaged or missing bags.', 'Bagasi lewat, rosak atau hilang.') },
  { slug: 'lost-property', title: lt('Lost property', 'Barang hilang'), summary: lt('Items lost in the terminal or on the aircraft.', 'Barang yang hilang di terminal atau dalam pesawat.') },
  { slug: 'accessibility', title: lt('Assistance and accessibility', 'Bantuan dan kebolehcapaian'), summary: lt('Support for reduced mobility and hidden disabilities.', 'Sokongan untuk pergerakan terhad dan ketidakupayaan tersembunyi.') },
  { slug: 'parking-transport', title: lt('Parking and transport', 'Parkir dan pengangkutan'), summary: lt('Car parks, shuttles and getting to the airport.', 'Tempat letak kereta, bas ulang-alik dan cara ke lapangan terbang.') },
  { slug: 'contact', title: lt('Contact Malaysia Airports', 'Hubungi Malaysia Airports'), summary: lt('Official phone, email and chat.', 'Telefon, e-mel dan sembang rasmi.') },
  { slug: 'about-this-site', title: lt('About this prototype', 'Tentang prototaip ini'), summary: lt('What this site is, and what is simulated.', 'Apakah laman ini, dan apa yang disimulasikan.') },
];

/** The FAQ seed. Every answer is traceable to its sources. */
export const FAQS: Faq[] = [
  {
    id: 'klia-terminal-names',
    topic: 'terminals',
    question: lt('What are KLIA Terminal 1 and KLIA Terminal 2?', 'Apakah KLIA Terminal 1 dan KLIA Terminal 2?'),
    answer: lt(
      'KLIA Terminal 1 is the current official name of the terminal previously known simply as KLIA, and KLIA Terminal 2 is the terminal previously branded klia2. They are two terminals of one airport (KUL). Check your booking for the terminal your flight uses.',
      'KLIA Terminal 1 ialah nama rasmi semasa bagi terminal yang dahulunya dikenali sebagai KLIA, manakala KLIA Terminal 2 ialah terminal yang dahulunya berjenama klia2. Kedua-duanya terminal bagi satu lapangan terbang (KUL). Semak tempahan anda untuk mengetahui terminal penerbangan anda.',
    ),
    airports: ['kul'],
    provenance: 'official',
    asOf: '2023-02-09 (rebranding announced)',
    sources: ['mahb-klia-t1-home', 'malaymail-klia-rebrand-2023'],
  },
  {
    id: 'klia-t1-c-gates',
    topic: 'terminals',
    question: lt('How do I get to the C gates at KLIA Terminal 1?', 'Bagaimana untuk ke pintu C di KLIA Terminal 1?'),
    answer: lt(
      'The C gates are in the Satellite Building. Take the Aerotrain from the Main Terminal Building; the ride takes under three minutes. When the Aerotrain is closed, follow the signs to the bus lounge, where transfer buses are available, or ask ground staff for help.',
      'Pintu C terletak di Bangunan Satelit. Naiki Aerotrain dari Bangunan Terminal Utama; perjalanan mengambil masa kurang tiga minit. Apabila Aerotrain ditutup, ikut papan tanda ke ruang menunggu bas untuk menaiki bas pemindahan, atau minta bantuan petugas.',
    ),
    airports: ['kul'],
    provenance: 'official',
    asOf: '2026-10-07',
    sources: ['malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025', 'mh-klia-t1-passenger-journey'],
  },
  {
    id: 'klia-lost-item',
    topic: 'lost-property',
    question: lt('I lost something at KLIA. Who do I contact?', 'Saya kehilangan barang di KLIA. Siapa yang perlu dihubungi?'),
    answer: lt(
      'For items lost in the terminal, use the official Malaysia Airports Lost & Found page for KLIA Terminal 1. Missing checked baggage and items left on board an aircraft are handled by your airline or its ground handler, not by the airport Lost & Found. We have not verified the Lost & Found location, hours or phone number, so this prototype does not publish them.',
      'Untuk barang yang hilang di terminal, gunakan halaman rasmi Barang Hilang & Dijumpai Malaysia Airports bagi KLIA Terminal 1. Bagasi daftar masuk yang hilang dan barang tertinggal dalam pesawat dikendalikan oleh syarikat penerbangan anda atau pengendali daratnya, bukan oleh Barang Hilang & Dijumpai lapangan terbang. Kami belum mengesahkan lokasi, waktu operasi atau nombor telefonnya, maka prototaip ini tidak menerbitkannya.',
    ),
    airports: ['kul'],
    provenance: 'official',
    asOf: 'As indexed in November 2026',
    sources: ['mahb-lost-found', 'mahb-klia-t1-help', 'kliainfo-lost-found'],
  },
  {
    id: 'klia-hidden-disabilities',
    topic: 'accessibility',
    question: lt(
      'Is there support for passengers with hidden disabilities at KLIA?',
      'Adakah sokongan untuk penumpang dengan ketidakupayaan tersembunyi di KLIA?',
    ),
    answer: lt(
      'Yes. The Butterfly Effect is KLIA\'s assistance programme for passengers with hidden disabilities such as autism, ADHD, global developmental delay and sensory processing disorder. Register at the airport information counter to receive a Butterfly Kit with a Butterfly lanyard. The programme offers priority access at major airport touchpoints, a Calm Room and sensory walls.',
      'Ya. The Butterfly Effect ialah program bantuan KLIA untuk penumpang dengan ketidakupayaan tersembunyi seperti autisme, ADHD, kelewatan perkembangan global dan gangguan pemprosesan deria. Daftar di kaunter pertanyaan lapangan terbang untuk menerima Butterfly Kit bersama lanyard Butterfly. Program ini menawarkan laluan keutamaan di titik utama lapangan terbang, Bilik Tenang dan dinding deria.',
    ),
    airports: ['kul'],
    provenance: 'official',
    asOf: '2025',
    sources: ['mahb-butterfly-effect', 'routesonline-calm-room-t2', 'ptt-butterfly-effect-2020'],
  },
  {
    id: 'klia-long-term-parking-shuttle',
    topic: 'parking-transport',
    question: lt(
      'How do I get from the Long Term Car Park to the terminal at KLIA?',
      'Bagaimana untuk ke terminal dari Tempat Letak Kereta Jangka Panjang di KLIA?',
    ),
    answer: lt(
      'A complimentary shuttle runs between the Long Term Car Park and the terminals every 10 minutes. Parking rates are not yet verified in this prototype: see the official parking page for current rates and online booking.',
      'Bas ulang-alik percuma beroperasi antara Tempat Letak Kereta Jangka Panjang dan terminal setiap 10 minit. Kadar parkir belum disahkan dalam prototaip ini: rujuk halaman parkir rasmi untuk kadar semasa dan tempahan dalam talian.',
    ),
    airports: ['kul'],
    provenance: 'official',
    asOf: '2026-11-16',
    sources: ['mahb-klia-t1-parking'],
  },
  {
    id: 'contact-malaysia-airports',
    topic: 'contact',
    question: lt('How do I contact Malaysia Airports?', 'Bagaimana untuk menghubungi Malaysia Airports?'),
    answer: lt(
      'The group customer support line is +60 3 8777 0000 and the general email address is info@malaysiaairports.com.my. Malaysia Airports also offers a live chat staffed by people on a daily schedule, and takes feedback through the MYairports mobile app.',
      'Talian khidmat pelanggan kumpulan ialah +60 3 8777 0000 dan alamat e-mel am ialah info@malaysiaairports.com.my. Malaysia Airports juga menyediakan sembang langsung yang dikendalikan oleh petugas mengikut jadual harian, dan menerima maklum balas melalui aplikasi mudah alih MYairports.',
    ),
    provenance: 'official',
    asOf: 'Retrieved 2026-11-16',
    sources: ['mahb-contact', 'mahb-care-chat'],
  },
  {
    id: 'is-this-official',
    topic: 'about-this-site',
    question: lt('Is this the official Malaysia Airports website?', 'Adakah ini laman web rasmi Malaysia Airports?'),
    answer: lt(
      'No. This is an independent concept prototype. It has no access to airport operational systems, so flight information, wait times and availability are demonstration data and are labelled as such. Published facts come from cited sources with the date we retrieved them.',
      'Tidak. Ini prototaip konsep bebas. Ia tiada akses kepada sistem operasi lapangan terbang, maka maklumat penerbangan, masa menunggu dan ketersediaan ialah data demonstrasi dan dilabel sedemikian. Fakta yang diterbitkan datang daripada sumber yang dipetik bersama tarikh ia diperoleh.',
    ),
    provenance: 'official',
    sources: ['prototype-method'],
  },
];

/** One FAQ by id. */
export function getFaq(id: string): Faq | undefined {
  return FAQS.find((faq) => faq.id === id);
}

/** One help topic by slug. */
export function getHelpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.slug === slug);
}

/** Slugs of all help topics, for `generateStaticParams`. */
export function helpTopicSlugs(): string[] {
  return HELP_TOPICS.map((topic) => topic.slug);
}

/**
 * FAQs for a topic. With `airport`, network-wide questions and that airport's questions are
 * returned; without it, everything in the topic.
 */
export function faqsByTopic(topic: string, airport?: string): Faq[] {
  return FAQS.filter(
    (faq) => faq.topic === topic && (!airport || !faq.airports || faq.airports.includes(airport)),
  );
}

/** FAQs relevant to an airport (its own plus the network-wide ones). */
export function faqsForAirport(airport: string): Faq[] {
  return FAQS.filter((faq) => !faq.airports || faq.airports.includes(airport));
}

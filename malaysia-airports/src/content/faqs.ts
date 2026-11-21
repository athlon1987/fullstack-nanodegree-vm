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
  // Appended by the guides team (17 November 2026).
  { slug: 'feedback', title: lt('Feedback and complaints', 'Maklum balas dan aduan'), summary: lt('Tell the airport or your airline, and where to go next.', 'Beritahu lapangan terbang atau syarikat penerbangan, dan langkah seterusnya.') },
  { slug: 'scams', title: lt('Scam alerts', 'Amaran penipuan'), summary: lt('Fake job offers, fake sellers, touts and look-alike websites.', 'Tawaran kerja palsu, penjual palsu, ulat dan laman web tiruan.') },
  { slug: 'privacy', title: lt('Privacy and your data', 'Privasi dan data anda'), summary: lt('What this site keeps, and how Malaysia Airports handles personal data.', 'Apa yang disimpan oleh laman ini, dan cara Malaysia Airports mengendalikan data peribadi.') },
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
    asOf: '2023-02-09',
    asOfNote: lt('Rebranding announced', 'Penjenamaan semula diumumkan'),
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
    asOf: '2026-11-16',
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
    asOf: '2026-11-16',
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
    provenance: 'suggestion',
    // Our own statement about this prototype, written for the help centre on 17 November 2026.
    asOf: '2026-11-17',
    sources: ['prototype-method'],
  },
  /* ---- Appended by the guides team (17 November 2026); answers cite their own sources. ---- */
  {
    id: 'flight-status-real-times',
    topic: 'flights',
    question: lt('Where do I check the real status of my flight?', 'Di mana saya boleh menyemak status sebenar penerbangan saya?'),
    answer: lt(
      "Use your airline's app or website and the screens in the terminal. Malaysia Airports publishes live departures on its official website. The flight boards in this prototype are demonstration data and must not be used to plan a real trip.",
      'Gunakan aplikasi atau laman web syarikat penerbangan anda dan skrin di terminal. Malaysia Airports menerbitkan maklumat berlepas langsung di laman web rasminya. Papan penerbangan dalam prototaip ini ialah data demonstrasi dan tidak boleh digunakan untuk merancang perjalanan sebenar.',
    ),
    provenance: 'official',
    // Our own statement about this prototype, written for the help centre on 17 November 2026.
    asOf: '2026-11-17',
    sources: ['mahb-klia-t1-departures', 'prototype-method'],
  },
  {
    id: 'flight-delay-care',
    topic: 'flights',
    question: lt('My flight is delayed. What should the airline provide?', 'Penerbangan saya ditunda. Apakah yang perlu disediakan oleh syarikat penerbangan?'),
    answer: lt(
      'As summarised by the law firm Skrine, the Malaysian Aviation Consumer Protection Code 2016 says that for a delay of two hours or more airlines offer free meals, refreshments, limited phone calls and internet access, and hotel accommodation with transport when the delay runs overnight. Ask airline staff at the counter or the gate.',
      'Seperti diringkaskan oleh firma guaman Skrine, Kod Perlindungan Pengguna Penerbangan Malaysia 2016 menyatakan bagi kelewatan dua jam atau lebih, syarikat penerbangan menawarkan makanan, minuman, panggilan telefon terhad dan akses internet secara percuma, serta penginapan hotel dan pengangkutan jika kelewatan berlarutan semalaman. Tanya petugas syarikat penerbangan di kaunter atau di pintu berlepas.',
    ),
    provenance: 'estimated',
    asOf: '2016-09',
    sources: ['skrine-macpc-2016'],
  },
  {
    id: 'flight-delay-refund',
    topic: 'flights',
    question: lt('Can I get a refund if my flight is delayed by five hours or more?', 'Bolehkah saya mendapat bayaran balik jika penerbangan ditunda lima jam atau lebih?'),
    answer: lt(
      'The Malaysian Aviation Commission (Mavcom) says airlines must offer passengers a refund for delays of five hours or more, under 2024 amendments to the Malaysian Aviation Consumer Protection Code. Malay Mail reported that the refund is an option you apply for, not an automatic payment: ask your airline first.',
      'Suruhanjaya Penerbangan Malaysia (Mavcom) menyatakan syarikat penerbangan mesti menawarkan bayaran balik kepada penumpang bagi kelewatan lima jam atau lebih, di bawah pindaan 2024 kepada Kod Perlindungan Pengguna Penerbangan Malaysia. Malay Mail melaporkan bahawa bayaran balik ialah pilihan yang perlu dipohon, bukan bayaran automatik: tanya syarikat penerbangan anda dahulu.',
    ),
    provenance: 'estimated',
    asOf: '2025-02-19',
    sources: ['thestar-mavcom-delay-refunds-2025', 'malaymail-delay-refunds-2024'],
  },
  {
    id: 'missed-connection',
    topic: 'flights',
    question: lt('My first flight is late and I may miss my connection. What do I do?', 'Penerbangan pertama saya lewat dan saya mungkin terlepas sambungan. Apa yang perlu saya lakukan?'),
    answer: lt(
      'Tell your airline as soon as you know, ideally before you land. If both flights are on one booking, the airline that issued the ticket normally arranges the next option. On separate tickets the second airline may not know about your first flight, so contact it directly and ask what it can do. Confirm everything with the airlines: this is general guidance.',
      'Maklumkan kepada syarikat penerbangan sebaik sahaja anda tahu, sebaiknya sebelum mendarat. Jika kedua-dua penerbangan dalam satu tempahan, syarikat yang mengeluarkan tiket lazimnya mengatur pilihan seterusnya. Bagi tiket berasingan, syarikat penerbangan kedua mungkin tidak tahu tentang penerbangan pertama anda, jadi hubunginya terus dan tanya apa yang boleh dilakukan. Sahkan semuanya dengan syarikat penerbangan: ini panduan umum.',
    ),
    provenance: 'estimated',
    // Our own statement about this prototype, written for the help centre on 17 November 2026.
    asOf: '2026-11-17',
    sources: ['prototype-method'],
  },
  {
    id: 'airport-feedback',
    topic: 'feedback',
    question: lt('How do I give feedback or complain about the airport?', 'Bagaimana saya memberi maklum balas atau membuat aduan tentang lapangan terbang?'),
    answer: lt(
      'Malaysia Airports runs a separate feedback website, linked from the Help section of its official site. You can also write to info@malaysiaairports.com.my, use the live chat (staffed on a daily schedule, not around the clock) or the MYairports app.',
      'Malaysia Airports mengendalikan laman web maklum balas berasingan, yang dipautkan dari bahagian Help laman rasminya. Anda juga boleh menulis kepada info@malaysiaairports.com.my, menggunakan sembang langsung (dikendalikan mengikut jadual harian, bukan 24 jam) atau aplikasi MYairports.',
    ),
    provenance: 'official',
    asOf: '2026-11-16',
    sources: ['mahb-feedback-site', 'mahb-contact', 'mahb-care-chat'],
  },
  {
    id: 'airline-complaint-escalation',
    topic: 'feedback',
    question: lt('My airline has not resolved my complaint. What next?', 'Syarikat penerbangan belum menyelesaikan aduan saya. Apa seterusnya?'),
    answer: lt(
      "Complain to the airline first and keep its reference number. A law firm's guide says airlines are expected to respond within 30 days, and that if the problem is not resolved you can complain to the Malaysian Aviation Commission (Mavcom) on its website or in the FlySmart app, giving the airline's reference, your flight and booking details and your correspondence. Mavcom reported in 2026 that it resolved 99 per cent of the complaints it received.",
      'Buat aduan kepada syarikat penerbangan dahulu dan simpan nombor rujukannya. Panduan sebuah firma guaman menyatakan syarikat penerbangan dijangka memberi maklum balas dalam tempoh 30 hari, dan jika masalah tidak selesai anda boleh membuat aduan kepada Suruhanjaya Penerbangan Malaysia (Mavcom) di laman webnya atau dalam aplikasi FlySmart, dengan menyertakan nombor rujukan syarikat penerbangan, butiran penerbangan dan tempahan serta surat-menyurat anda. Mavcom melaporkan pada 2026 bahawa ia menyelesaikan 99 peratus aduan yang diterima.',
    ),
    provenance: 'estimated',
    asOf: '2026-03',
    sources: ['conventuslaw-mavcom-complaint', 'caam-mavcom-consumer-report-2026'],
  },
  {
    id: 'scam-lost-luggage-sale',
    topic: 'scams',
    question: lt('Is Malaysia Airports selling lost luggage online?', 'Adakah Malaysia Airports menjual bagasi hilang dalam talian?'),
    answer: lt(
      'No. Malaysia Airports warns about fake social media pages selling lost luggage and says it does not sell lost items or luggage under any circumstances.',
      'Tidak. Malaysia Airports memberi amaran tentang halaman media sosial palsu yang menjual bagasi hilang dan menyatakan ia tidak menjual barang atau bagasi hilang dalam apa jua keadaan.',
    ),
    provenance: 'official',
    undated: true,
    sources: ['mahb-scam-alert'],
  },
  {
    id: 'scam-job-offers',
    topic: 'scams',
    question: lt('I was offered a job at the airport. Is it genuine?', 'Saya ditawarkan kerja di lapangan terbang. Adakah ia tulen?'),
    answer: lt(
      'Malaysia Airports lists fake job recruitment among the scams on its scam alert page. It advises checking that the company is legitimate and calling it to ask about the offer.',
      'Malaysia Airports menyenaraikan pengambilan kerja palsu antara penipuan di halaman amaran penipuannya. Ia menasihatkan anda menyemak sama ada syarikat itu sah dan menghubunginya untuk bertanya tentang tawaran tersebut.',
    ),
    provenance: 'official',
    undated: true,
    sources: ['mahb-scam-alert'],
  },
  {
    id: 'scam-vendor-emails',
    topic: 'scams',
    question: lt('I received an email asking me to register as a KLIA vendor', 'Saya menerima e-mel meminta saya mendaftar sebagai vendor KLIA'),
    answer: lt(
      "Malaysia Airports' corporate scam alert page lists fraudulent vendor registration emails that claim to be from KLIA. Check any such request against the official corporate website before you reply.",
      'Halaman amaran penipuan korporat Malaysia Airports menyenaraikan e-mel pendaftaran vendor palsu yang mendakwa daripada KLIA. Semak sebarang permintaan sedemikian dengan laman web korporat rasmi sebelum membalas.',
    ),
    provenance: 'official',
    undated: true,
    sources: ['mahb-corporate-scam-alert'],
  },
  {
    id: 'scam-touts',
    topic: 'scams',
    question: lt('Someone offered me a ride in the arrival hall. Should I take it?', 'Seseorang menawarkan tumpangan di balai ketibaan. Patutkah saya terima?'),
    answer: lt(
      'Decline. In July 2026 the Road Transport Department said it was stationing more officers at both KLIA terminals against touts targeting foreign visitors, and Malay Mail reported e-hailing drivers bypassing the app and charging up to RM800. Airport taxis at KLIA are paid for by coupon at a counter; for e-hailing, book in the app and meet the driver at its pick-up point.',
      'Tolak. Pada Julai 2026 Jabatan Pengangkutan Jalan menyatakan ia menempatkan lebih ramai pegawai di kedua-dua terminal KLIA untuk membanteras ulat yang menyasarkan pelawat asing, dan Malay Mail melaporkan pemandu e-hailing memintas aplikasi dan mengenakan sehingga RM800. Teksi lapangan terbang di KLIA dibayar dengan kupon di kaunter; untuk e-hailing, tempah dalam aplikasi dan bertemu pemandu di tempat menunggunya.',
    ),
    airports: ['kul'],
    provenance: 'estimated',
    asOf: '2026-07-07',
    sources: ['thestar-jpj-touts-2026', 'malaymail-ehailing-touts-2026', 'mahb-klia-taxi', 'wego-klia-to-city'],
  },
  {
    id: 'scam-mdac-fees',
    topic: 'scams',
    question: lt('Do I have to pay for the Malaysia Digital Arrival Card?', 'Adakah saya perlu membayar untuk Kad Ketibaan Digital Malaysia?'),
    answer: lt(
      'No. The MDAC is free on the official Immigration portal. Reports describe look-alike websites that charge a fee: use only the official portal.',
      'Tidak. MDAC adalah percuma di portal rasmi Imigresen. Laporan menyebut laman web tiruan yang mengenakan bayaran: gunakan portal rasmi sahaja.',
    ),
    provenance: 'official',
    undated: true,
    sources: ['kln-mdac-mission-page', 'imi-mdac-portal', 'wikipedia-mdac'],
  },
  {
    id: 'privacy-this-site',
    topic: 'privacy',
    question: lt('What does this prototype do with my data?', 'Apakah yang dilakukan oleh prototaip ini dengan data saya?'),
    answer: lt(
      'Saved flights, places, your parking note, your airport and your display settings are kept in your browser on this device. They are not sent to a server. The site loads no analytics, advertising or third-party scripts.',
      'Penerbangan, tempat, nota parkir, lapangan terbang dan tetapan paparan yang disimpan berada dalam pelayar anda pada peranti ini. Ia tidak dihantar ke pelayan. Laman ini tidak memuatkan analitik, pengiklanan atau skrip pihak ketiga.',
    ),
    provenance: 'suggestion',
    // Our own statement about this prototype, written for the help centre on 17 November 2026.
    asOf: '2026-11-17',
    sources: ['prototype-method'],
  },
  {
    id: 'privacy-clear-data',
    topic: 'privacy',
    question: lt('How do I clear what this site saved?', 'Bagaimana saya memadam apa yang disimpan oleh laman ini?'),
    answer: lt(
      'Use "Clear my journey" on the My journey page and "Reset to defaults" in the display settings, or clear this site\'s data in your browser settings.',
      'Gunakan "Kosongkan perjalanan saya" di halaman Perjalanan saya dan "Tetapkan semula" dalam tetapan paparan, atau padam data laman ini dalam tetapan pelayar anda.',
    ),
    provenance: 'suggestion',
    // Our own statement about this prototype, written for the help centre on 17 November 2026.
    asOf: '2026-11-17',
    sources: ['prototype-method'],
  },
  {
    id: 'privacy-malaysia-airports',
    topic: 'privacy',
    question: lt('How does Malaysia Airports handle personal data?', 'Bagaimana Malaysia Airports mengendalikan data peribadi?'),
    answer: lt(
      'Malaysia Airports publishes a privacy notice covering Malaysia Airports (Sepang) Sdn Bhd and Malaysia Airports Sdn Bhd. It says personal information is handled under the Personal Data Protection Act 2010 and explains what is collected, how it is used and when it is disclosed. Read the notice itself for the current version.',
      'Malaysia Airports menerbitkan notis privasi yang meliputi Malaysia Airports (Sepang) Sdn Bhd dan Malaysia Airports Sdn Bhd. Ia menyatakan maklumat peribadi dikendalikan di bawah Akta Perlindungan Data Peribadi 2010 dan menerangkan apa yang dikumpul, cara ia digunakan dan bila ia didedahkan. Baca notis itu sendiri untuk versi semasa.',
    ),
    provenance: 'official',
    asOf: '2024-04',
    sources: ['mahb-privacy-notice'],
  },
  {
    id: 'lost-property-details',
    topic: 'lost-property',
    question: lt('What should I include when I report a lost item?', 'Apakah yang perlu saya nyatakan semasa melaporkan barang hilang?'),
    answer: lt(
      'Describe the item (brand, colour, anything distinctive), where and when you last had it, your flight number, and how to reach you. A photo helps.',
      'Terangkan barang itu (jenama, warna, apa-apa ciri khas), di mana dan bila kali terakhir anda memilikinya, nombor penerbangan anda, dan cara menghubungi anda. Gambar amat membantu.',
    ),
    provenance: 'suggestion',
    // Our own statement about this prototype, written for the help centre on 17 November 2026.
    asOf: '2026-11-17',
    sources: ['prototype-method'],
  },
  {
    id: 'lost-on-aircraft',
    topic: 'lost-property',
    question: lt('I left something on the plane', 'Saya tertinggal barang dalam pesawat'),
    answer: lt(
      'Items left on board an aircraft are handled by your airline or its ground handler, not by the airport Lost & Found. Contact the airline as soon as you can, with your flight number and seat.',
      'Barang yang tertinggal dalam pesawat dikendalikan oleh syarikat penerbangan atau pengendali daratnya, bukan oleh Barang Hilang & Dijumpai lapangan terbang. Hubungi syarikat penerbangan secepat mungkin, dengan nombor penerbangan dan tempat duduk anda.',
    ),
    provenance: 'official',
    undated: true,
    sources: ['mahb-lost-found', 'mahb-klia-t1-help'],
  },
  {
    id: 'wheelchair-request',
    topic: 'accessibility',
    question: lt('How do I ask for a wheelchair?', 'Bagaimana saya meminta kerusi roda?'),
    answer: lt(
      'Through your airline, when you book. Malaysia Airlines asks for wheelchair requests at least 48 hours before departure; later requests depend on availability, and it says the service is free of charge. Other airlines have their own rules.',
      'Melalui syarikat penerbangan anda, semasa menempah. Malaysia Airlines meminta permohonan kerusi roda dibuat sekurang-kurangnya 48 jam sebelum berlepas; permohonan lewat bergantung pada ketersediaan, dan ia menyatakan perkhidmatan ini percuma. Syarikat penerbangan lain mempunyai peraturan sendiri.',
    ),
    provenance: 'official',
    undated: true,
    sources: ['mh-special-assistance'],
  },
  {
    id: 'liquids-limit',
    topic: 'baggage',
    question: lt('How much liquid can I take in my cabin bag?', 'Berapa banyak cecair yang boleh saya bawa dalam beg kabin?'),
    answer: lt(
      'On international flights from KLIA, each container must hold 100 ml or less, all in one bag of no more than 1 litre. Medicines, baby milk and baby food are allowed. Duty-free liquids bought after the checkpoint stay in their sealed bag with the receipt.',
      'Bagi penerbangan antarabangsa dari KLIA, setiap bekas mesti mengandungi 100 ml atau kurang, semuanya dalam satu beg tidak melebihi 1 liter. Ubat, susu bayi dan makanan bayi dibenarkan. Cecair bebas cukai yang dibeli selepas pusat pemeriksaan kekal dalam beg bermeterai bersama resit.',
    ),
    airports: ['kul'],
    provenance: 'official',
    undated: true,
    sources: ['mahb-lags-restricted-items', 'mh-cabin-baggage'],
  },
  {
    id: 'power-bank-rules',
    topic: 'baggage',
    question: lt('Can I bring a power bank?', 'Bolehkah saya membawa power bank?'),
    answer: lt(
      'In your cabin bag, not your checked bag, on Malaysia Airlines. Since 1 April 2025 Malaysia Airlines, Firefly and MASwings passengers may not use or charge a power bank during the flight and must keep it on their person, not in the overhead locker. Other airlines set their own rules.',
      'Dalam beg kabin, bukan bagasi daftar masuk, bagi Malaysia Airlines. Sejak 1 April 2025 penumpang Malaysia Airlines, Firefly dan MASwings tidak boleh menggunakan atau mengecas power bank semasa penerbangan dan mesti menyimpannya pada diri sendiri, bukan di ruang simpanan atas kepala. Syarikat penerbangan lain menetapkan peraturan sendiri.',
    ),
    provenance: 'official',
    asOf: '2025-04-01',
    sources: ['mh-power-banks', 'malaymail-mh-power-banks-2025', 'thestar-power-banks-caam-2025'],
  },
  {
    id: 'missing-checked-bag',
    topic: 'baggage',
    question: lt('My checked bag did not arrive', 'Bagasi daftar masuk saya tidak sampai'),
    answer: lt(
      'Report it to your airline or its ground handler before you leave the baggage hall, and keep the reference number. The airport Lost & Found handles items lost in the terminal, not checked baggage.',
      'Laporkan kepada syarikat penerbangan atau pengendali daratnya sebelum keluar dari balai bagasi, dan simpan nombor rujukan. Barang Hilang & Dijumpai lapangan terbang mengendalikan barang yang hilang di terminal, bukan bagasi daftar masuk.',
    ),
    provenance: 'estimated',
    undated: true,
    sources: ['kliainfo-lost-found', 'mahb-lost-found'],
  },
  {
    id: 'klia-change-terminals',
    topic: 'parking-transport',
    question: lt('Can I walk between Terminal 1 and Terminal 2 at KLIA without leaving the secure area?', 'Bolehkah saya bergerak antara Terminal 1 dan Terminal 2 di KLIA tanpa keluar dari kawasan udara?'),
    answer: lt(
      'No. There is no airside link between the terminals. To change terminals, clear immigration, collect your bags, travel between the terminals by train (RM2 adult fare, as reported in October 2026) or by the free shuttle bus, then check in again. A seamless transfer system was announced for mid-2026; we could not confirm that it has started, so check with your airline.',
      'Tidak. Tiada laluan kawasan udara antara terminal. Untuk bertukar terminal, lalui imigresen, ambil bagasi, bergerak antara terminal dengan tren (tambang dewasa RM2, seperti dilaporkan pada Oktober 2026) atau bas ulang-alik percuma, kemudian daftar masuk semula. Sistem pemindahan lancar diumumkan untuk pertengahan 2026; kami tidak dapat mengesahkan bahawa ia sudah bermula, jadi semak dengan syarikat penerbangan anda.',
    ),
    airports: ['kul'],
    provenance: 'official',
    asOf: '2026-10-01',
    sources: ['mahb-inter-terminal-transfer', 'soyacincau-klia-ekspres-fares-2027', 'malaymail-seamless-transfer-2025'],
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

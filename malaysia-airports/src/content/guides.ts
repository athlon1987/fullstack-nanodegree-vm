/**
 * "Plan your journey" guides: a small seed plus helpers.
 *
 * Content authors: add guides to `GUIDES` (or spread in arrays from new files under
 * `src/content/guides/`). Every step carries its own provenance tag; a step tagged `official`
 * must cite its own sources. Generic good-practice advice that is not from an authoritative
 * source is `estimated` or `suggestion` and cites `prototype-method`.
 */
import { lt, type Audience, type Guide } from './types';

/** The guide seed. */
export const GUIDES: Guide[] = [
  {
    slug: 'departing',
    title: lt('Departing: from your door to the gate', 'Berlepas: dari rumah ke pintu berlepas'),
    summary: lt(
      'What to do before you leave home and at the airport, in order.',
      'Perkara yang perlu dilakukan sebelum bertolak dan di lapangan terbang, mengikut turutan.',
    ),
    audience: ['departing', 'first-time'],
    sections: [
      {
        id: 'before-you-leave',
        title: lt('Before you leave home', 'Sebelum bertolak'),
        steps: [
          {
            id: 'check-terminal',
            title: lt('Check your terminal', 'Semak terminal anda'),
            body: lt(
              'Your booking confirmation names the airport and, at KLIA, the terminal. KLIA Terminal 1 and KLIA Terminal 2 are separate buildings, so check before you set off.',
              'Pengesahan tempahan anda menyatakan lapangan terbang dan, di KLIA, terminalnya. KLIA Terminal 1 dan KLIA Terminal 2 ialah bangunan berasingan, jadi semak sebelum bertolak.',
            ),
            provenance: 'official',
            sources: ['mahb-klia-t1-home', 'malaymail-klia-rebrand-2023'],
          },
          {
            id: 'plan-arrival-time',
            title: lt('Plan when to arrive', 'Rancang waktu tiba'),
            body: lt(
              'As a guide, aim to be at the airport at least 3 hours before an international flight and at least 2 hours before a domestic flight. Your airline sets the actual check-in deadlines: follow its advice, especially in peak periods.',
              'Sebagai panduan, cuba tiba di lapangan terbang sekurang-kurangnya 3 jam sebelum penerbangan antarabangsa dan 2 jam sebelum penerbangan domestik. Syarikat penerbangan menetapkan had masa daftar masuk sebenar: ikut nasihatnya, terutama pada musim puncak.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
          {
            id: 'check-in-online',
            title: lt('Check in online if your airline offers it', 'Daftar masuk dalam talian jika ditawarkan'),
            body: lt(
              'Online check-in can save queueing time at the airport. You may still need to drop bags at a counter.',
              'Daftar masuk dalam talian boleh menjimatkan masa beratur di lapangan terbang. Anda mungkin masih perlu menyerahkan bagasi di kaunter.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'at-the-airport',
        title: lt('At the airport', 'Di lapangan terbang'),
        steps: [
          {
            id: 'klia-t1-check-in-level',
            title: lt('KLIA Terminal 1: check in on Level 5', 'KLIA Terminal 1: daftar masuk di Aras 5'),
            body: lt(
              'The departure hall and check-in counters are on Level 5 of the Main Terminal Building. Counter rows can change from day to day, so check the screens.',
              'Balai berlepas dan kaunter daftar masuk terletak di Aras 5 Bangunan Terminal Utama. Barisan kaunter boleh berubah dari hari ke hari, jadi semak skrin.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey'],
            actions: [{ label: lt('Open the Terminal 1 map', 'Buka peta Terminal 1'), href: '/kul/map' }],
          },
          {
            id: 'klia-t1-gates',
            title: lt('KLIA Terminal 1: know where your gate is', 'KLIA Terminal 1: ketahui lokasi pintu anda'),
            body: lt(
              'A and B gates (domestic) and G and H gates (international) are in the main terminal. C gates are in the Satellite Building, reached by the Aerotrain in under three minutes.',
              'Pintu A dan B (domestik) serta pintu G dan H (antarabangsa) terletak di terminal utama. Pintu C terletak di Bangunan Satelit, boleh dicapai dengan Aerotrain dalam masa kurang tiga minit.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey', 'malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025'],
          },
          {
            id: 'be-at-the-gate',
            title: lt('Be at the gate before boarding starts', 'Berada di pintu sebelum penumpang mula menaiki pesawat'),
            body: lt(
              'Gates usually close before the departure time. The boarding time on your boarding pass is the one to plan around.',
              'Pintu biasanya ditutup sebelum waktu berlepas. Rancang mengikut waktu menaiki pesawat pada pas masuk anda.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
        ],
      },
    ],
    asOf: '2026-11-16',
    sources: ['mh-klia-t1-passenger-journey', 'mahb-klia-t1-home', 'prototype-method'],
  },
  /* ---- Appended by the guides team (17 November 2026). Facts trace to the step's sources. ---- */
  {
    slug: 'arriving',
    title: lt('Arriving: from the aircraft door to your onward journey', 'Ketibaan: dari pintu pesawat ke perjalanan seterusnya'),
    summary: lt(
      'The arrival card, immigration, bags, customs and getting away safely, in order.',
      'Kad ketibaan, imigresen, bagasi, kastam dan meneruskan perjalanan dengan selamat, mengikut turutan.',
    ),
    audience: ['arriving', 'first-time'],
    sections: [
      {
        id: 'before-you-land',
        title: lt('Before you land', 'Sebelum mendarat'),
        steps: [
          {
            id: 'mdac',
            title: lt('Foreign visitors: submit the Malaysia Digital Arrival Card', 'Pelawat asing: hantar Kad Ketibaan Digital Malaysia'),
            body: lt(
              'Submit the Malaysia Digital Arrival Card (MDAC) within three days before you arrive. It is free on the official Immigration portal. Singapore citizens and holders of diplomatic or official passports are exempt, and other exemptions may apply: confirm with the Immigration Department of Malaysia.',
              'Hantar Kad Ketibaan Digital Malaysia (MDAC) dalam tempoh tiga hari sebelum anda tiba. Ia percuma di portal rasmi Imigresen. Warganegara Singapura serta pemegang pasport diplomatik atau rasmi dikecualikan, dan pengecualian lain mungkin terpakai: sahkan dengan Jabatan Imigresen Malaysia.',
            ),
            provenance: 'official',
            sources: ['kln-mdac-mission-page', 'imi-mdac-portal'],
            actions: [{ label: lt('Open the official MDAC portal', 'Buka portal rasmi MDAC'), href: 'https://imigresen-online.imi.gov.my/mdac/main' }],
          },
          {
            id: 'mdac-fake-sites',
            title: lt('Use only the official portal', 'Gunakan portal rasmi sahaja'),
            body: lt(
              'Reports describe look-alike websites that charge a fee for the arrival card. The official card is free, so if a site asks you to pay, leave it.',
              'Laporan menyebut laman web tiruan yang mengenakan bayaran untuk kad ketibaan. Kad rasmi adalah percuma, jadi jika sesebuah laman meminta bayaran, tinggalkannya.',
            ),
            provenance: 'estimated',
            sources: ['wikipedia-mdac', 'kln-mdac-mission-page'],
          },
        ],
      },
      {
        id: 'after-landing',
        title: lt('After landing', 'Selepas mendarat'),
        steps: [
          {
            id: 'immigration',
            title: lt('Clear immigration', 'Lalui imigresen'),
            body: lt(
              'Have your passport ready. Malaysian Immigration requires every passenger entering Malaysia to hold valid travel documents, such as a passport and, where needed, a visa.',
              'Sediakan pasport anda. Imigresen Malaysia mensyaratkan setiap penumpang yang memasuki Malaysia memiliki dokumen perjalanan yang sah, seperti pasport dan, jika perlu, visa.',
            ),
            provenance: 'official',
            sources: ['mahb-flight-transfers'],
          },
          {
            id: 'autogates',
            title: lt('Autogates: check whether you can use them', 'Autogate: semak sama ada anda layak'),
            body: lt(
              "Some visitors can use the immigration autogates at KLIA, but sources differ on who is eligible and we found no official list. Travel guides say you need a machine-readable e-passport valid for at least six months and a submitted MDAC. Follow the signs and the officers' directions.",
              'Sesetengah pelawat boleh menggunakan autogate imigresen di KLIA, tetapi sumber berbeza tentang siapa yang layak dan kami tidak menemui senarai rasmi. Panduan perjalanan menyatakan anda memerlukan e-pasport boleh baca mesin yang sah sekurang-kurangnya enam bulan dan MDAC yang telah dihantar. Ikut papan tanda dan arahan pegawai.',
            ),
            provenance: 'estimated',
            sources: ['dollarsandsense-autogate-guide', 'traveloka-mdac', 'wego-klia-to-city'],
          },
          {
            id: 'sabah-arrival',
            title: lt('Arriving in Sabah from Peninsular Malaysia', 'Tiba di Sabah dari Semenanjung Malaysia'),
            body: lt(
              'Sabah checks immigration on domestic arrivals too. Have your MyKad or passport ready. A visit on a MyKad is limited to 90 days.',
              'Sabah turut menjalankan pemeriksaan imigresen bagi ketibaan domestik. Sediakan MyKad atau pasport anda. Lawatan dengan MyKad terhad kepada 90 hari.',
            ),
            provenance: 'official',
            sources: ['thevibes-sabah-immigration-2022', 'sinchew-sabah-mykad-2024', 'imi-domestic-travel'],
          },
          {
            id: 'sarawak-arrival',
            title: lt('Arriving in Sarawak: have your identity card ready', 'Tiba di Sarawak: sediakan kad pengenalan anda'),
            body: lt(
              'Sarawak also checks the documents of Malaysians arriving from Peninsular Malaysia and Sabah. The Sarawak Tribune reported in June 2026 that a MyKad is enough and a passport is not needed. We have not seen the official wording: check with the Immigration Department.',
              'Sarawak juga memeriksa dokumen rakyat Malaysia yang tiba dari Semenanjung Malaysia dan Sabah. Sarawak Tribune melaporkan pada Jun 2026 bahawa MyKad sudah memadai dan pasport tidak diperlukan. Kami belum melihat teks rasmi: semak dengan Jabatan Imigresen.',
            ),
            provenance: 'estimated',
            sources: ['sarawaktribune-mykad-entry-2026', 'imi-domestic-travel'],
          },
          {
            id: 'bags',
            title: lt('Collect your bags', 'Ambil bagasi anda'),
            body: lt(
              "Check the screens in the baggage hall for your belt. If a checked bag does not arrive, report it to your airline or its ground handler before you leave the baggage hall: the airport's Lost & Found handles items lost in the terminal, not checked baggage.",
              'Semak skrin di balai bagasi untuk mengetahui tali sawat anda. Jika bagasi daftar masuk tidak sampai, laporkan kepada syarikat penerbangan atau pengendali daratnya sebelum meninggalkan balai bagasi: Barang Hilang & Dijumpai lapangan terbang mengendalikan barang yang hilang di terminal, bukan bagasi daftar masuk.',
            ),
            provenance: 'estimated',
            sources: ['kliainfo-lost-found'],
          },
          {
            id: 'customs',
            title: lt('Go through customs', 'Lalui kastam'),
            body: lt(
              'Malaysian customs law requires travellers arriving in or leaving Malaysia to declare dutiable or prohibited goods to the customs officers on duty. Duty-free allowances are set by the Royal Malaysian Customs Department. The figures in the guides we read disagree, so we do not publish them: ask Customs if you are unsure.',
              'Undang-undang kastam Malaysia mensyaratkan pengembara yang tiba di atau meninggalkan Malaysia mengisytiharkan barang bercukai atau larangan kepada pegawai kastam yang bertugas. Elaun bebas cukai ditetapkan oleh Jabatan Kastam Diraja Malaysia. Angka dalam panduan yang kami baca tidak sepadan, jadi kami tidak menerbitkannya: tanya Kastam jika anda tidak pasti.',
            ),
            provenance: 'official',
            sources: ['hro-customs-declaration-2022', 'customs-gov-my'],
            actions: [{ label: lt('Royal Malaysian Customs Department', 'Jabatan Kastam Diraja Malaysia'), href: 'https://www.customs.gov.my/' }],
          },
        ],
      },
      {
        id: 'leaving-the-airport',
        title: lt('Leaving the airport', 'Meninggalkan lapangan terbang'),
        steps: [
          {
            id: 'official-transport',
            title: lt('Book transport at a counter or in your app', 'Tempah pengangkutan di kaunter atau dalam aplikasi'),
            body: lt(
              "Decline rides offered by people who approach you in the arrival hall. In July 2026 the Road Transport Department said it was stationing more officers at both KLIA terminals against touts targeting foreign visitors, and Malay Mail reported e-hailing drivers bypassing the app and charging up to RM800. Airport taxis at KLIA are paid for by coupon at a counter; for e-hailing, book in the app and meet the driver at the app's pick-up point.",
              'Tolak tawaran tumpangan daripada orang yang mendekati anda di balai ketibaan. Pada Julai 2026 Jabatan Pengangkutan Jalan menyatakan ia menempatkan lebih ramai pegawai di kedua-dua terminal KLIA untuk membanteras ulat yang menyasarkan pelawat asing, dan Malay Mail melaporkan pemandu e-hailing memintas aplikasi dan mengenakan sehingga RM800. Teksi lapangan terbang di KLIA dibayar dengan kupon di kaunter; untuk e-hailing, tempah dalam aplikasi dan bertemu pemandu di tempat menunggu aplikasi.',
            ),
            provenance: 'estimated',
            sources: ['thestar-jpj-touts-2026', 'malaymail-ehailing-touts-2026', 'mahb-klia-taxi', 'wego-klia-to-city'],
            actions: [{ label: lt('Compare transport from KLIA', 'Bandingkan pengangkutan dari KLIA'), href: '/kul/transport' }],
          },
          {
            id: 'meeting-point',
            title: lt('Being met? Agree a meeting point', 'Dijemput? Tetapkan tempat bertemu'),
            body: lt(
              'Third-party guides place the KLIA Terminal 1 arrival hall on Level 3 of the Main Terminal Building. Agree a meeting point before you fly and share your flight number with whoever is meeting you.',
              'Panduan pihak ketiga menyatakan balai ketibaan KLIA Terminal 1 terletak di Aras 3 Bangunan Terminal Utama. Tetapkan tempat bertemu sebelum terbang dan kongsi nombor penerbangan anda dengan orang yang menjemput.',
            ),
            provenance: 'estimated',
            sources: ['klia2info-level-guide'],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['kln-mdac-mission-page', 'mahb-flight-transfers', 'imi-domestic-travel', 'hro-customs-declaration-2022', 'thestar-jpj-touts-2026'],
  },
  {
    slug: 'check-in',
    title: lt('Check-in and bag drop', 'Daftar masuk dan serahan bagasi'),
    summary: lt(
      'Deadlines, counters and bag drop, and what must stay out of your checked bag.',
      'Had masa, kaunter dan serahan bagasi, serta perkara yang tidak boleh dimasukkan ke dalam bagasi daftar masuk.',
    ),
    audience: ['departing', 'first-time'],
    sections: [
      {
        id: 'before-you-go',
        title: lt('Before you go', 'Sebelum bertolak'),
        steps: [
          {
            id: 'deadlines',
            title: lt('Know your airline’s deadlines', 'Ketahui had masa syarikat penerbangan anda'),
            body: lt(
              "Your airline sets the check-in and bag-drop deadlines, and they differ by airline, route and fare. Find them in your booking or on the airline's website before you leave home.",
              'Syarikat penerbangan menetapkan had masa daftar masuk dan serahan bagasi, dan ia berbeza mengikut syarikat, laluan dan tambang. Semak dalam tempahan anda atau di laman web syarikat penerbangan sebelum bertolak.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
          {
            id: 'online',
            title: lt('Check in online if you can', 'Daftar masuk dalam talian jika boleh'),
            body: lt(
              'Online check-in can save queueing time. You may still need to drop bags at a counter or a self-service bag drop.',
              'Daftar masuk dalam talian boleh menjimatkan masa beratur. Anda mungkin masih perlu menyerahkan bagasi di kaunter atau di serahan bagasi layan diri.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'original-documents',
            title: lt('Bring original documents', 'Bawa dokumen asal'),
            body: lt(
              'Malaysia Airlines accepts original documents only, not photocopies. Other airlines set their own rules.',
              'Malaysia Airlines hanya menerima dokumen asal, bukan salinan. Syarikat penerbangan lain menetapkan peraturan sendiri.',
            ),
            provenance: 'official',
            sources: ['mh-visa-immigration-documents'],
          },
        ],
      },
      {
        id: 'at-klia',
        title: lt('At KLIA Terminal 1', 'Di KLIA Terminal 1'),
        steps: [
          {
            id: 'level-5',
            title: lt('Check-in is on Level 5', 'Daftar masuk di Aras 5'),
            body: lt(
              'The departure hall and check-in counters are on Level 5 of the Main Terminal Building.',
              'Balai berlepas dan kaunter daftar masuk terletak di Aras 5 Bangunan Terminal Utama.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey'],
            actions: [{ label: lt('Open the Terminal 1 map', 'Buka peta Terminal 1'), href: '/kul/map?level=L5' }],
          },
          {
            id: 'mh-rows',
            title: lt('Malaysia Airlines rows and bag drop', 'Barisan dan serahan bagasi Malaysia Airlines'),
            body: lt(
              'Malaysia Airlines lists international Economy at Row H, international Business at Row D, domestic Economy at Row B and self-service bag drop at counters F and G. Counters are arranged by the airport based on daily conditions, so check the screens when you arrive.',
              'Malaysia Airlines menyenaraikan Ekonomi antarabangsa di Barisan H, Perniagaan antarabangsa di Barisan D, Ekonomi domestik di Barisan B dan serahan bagasi layan diri di kaunter F dan G. Kaunter disusun oleh lapangan terbang mengikut keadaan harian, jadi semak skrin apabila anda tiba.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey'],
          },
        ],
      },
      {
        id: 'checked-bag',
        title: lt('What goes in your checked bag', 'Apa yang boleh dimasukkan ke dalam bagasi daftar masuk'),
        steps: [
          {
            id: 'power-banks',
            title: lt('Keep power banks out of your checked bag', 'Jangan masukkan power bank ke dalam bagasi daftar masuk'),
            body: lt(
              'Malaysia Airlines does not accept power banks in checked baggage: they travel with you in the cabin. Other airlines set their own rules, so check before you pack.',
              'Malaysia Airlines tidak menerima power bank dalam bagasi daftar masuk: ia mesti dibawa bersama anda dalam kabin. Syarikat penerbangan lain menetapkan peraturan sendiri, jadi semak sebelum mengemas.',
            ),
            provenance: 'official',
            sources: ['mh-power-banks', 'malaymail-mh-power-banks-2025'],
          },
          {
            id: 'large-liquids',
            title: lt('Pack larger liquids in your checked bag', 'Masukkan cecair yang lebih besar ke dalam bagasi daftar masuk'),
            body: lt(
              'For international flights from KLIA, liquids, aerosols and gels in containers over 100 ml cannot go through screening in your cabin bag. Malaysia Airports says larger quantities can go in checked baggage.',
              'Bagi penerbangan antarabangsa dari KLIA, cecair, aerosol dan gel dalam bekas melebihi 100 ml tidak boleh melalui saringan dalam beg kabin. Malaysia Airports menyatakan kuantiti yang lebih besar boleh dimasukkan ke dalam bagasi daftar masuk.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
            actions: [{ label: lt('Read the security guide', 'Baca panduan keselamatan'), href: '/guides/security' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mh-klia-t1-passenger-journey', 'mh-power-banks', 'mahb-lags-restricted-items', 'prototype-method'],
  },
  {
    slug: 'security',
    title: lt('Security screening', 'Saringan keselamatan'),
    summary: lt(
      'Liquids, power banks and what to expect at the checkpoint.',
      'Cecair, power bank dan perkara yang dijangka di pusat pemeriksaan.',
    ),
    audience: ['departing', 'transiting', 'first-time'],
    sections: [
      {
        id: 'liquids',
        title: lt('Liquids, aerosols and gels', 'Cecair, aerosol dan gel'),
        steps: [
          {
            id: 'lags-scope',
            title: lt('Who is screened for liquids', 'Siapa yang disaring untuk cecair'),
            body: lt(
              'At KLIA, passengers on international flights from both terminals are screened for liquids, aerosols and gels (LAGs).',
              'Di KLIA, penumpang penerbangan antarabangsa dari kedua-dua terminal disaring untuk cecair, aerosol dan gel (LAGs).',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'lags-limits',
            title: lt('100 ml per container, one 1-litre bag', '100 ml setiap bekas, satu beg 1 liter'),
            body: lt(
              'Each container must hold 100 ml or less, and together they must fit in one bag of no more than 1 litre. Malaysia Airlines applies the same 100 ml limit per item.',
              'Setiap bekas mesti mengandungi 100 ml atau kurang, dan semuanya mesti muat dalam satu beg tidak melebihi 1 liter. Malaysia Airlines menggunakan had 100 ml yang sama bagi setiap item.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items', 'mh-cabin-baggage'],
          },
          {
            id: 'lags-exempt',
            title: lt('Medicines, baby milk and baby food are allowed', 'Ubat, susu bayi dan makanan bayi dibenarkan'),
            body: lt(
              'Medicines, baby milk and baby food are allowed in cabin baggage. Larger quantities of other liquids go in your checked bag.',
              'Ubat, susu bayi dan makanan bayi dibenarkan dalam bagasi kabin. Kuantiti cecair lain yang lebih besar perlu dimasukkan ke dalam bagasi daftar masuk.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'duty-free',
            title: lt('Duty-free liquids stay sealed', 'Cecair bebas cukai kekal bermeterai'),
            body: lt(
              'Liquids bought after the checkpoint, for example at duty-free shops, must stay in the sealed bag with the proof of purchase.',
              'Cecair yang dibeli selepas pusat pemeriksaan, contohnya di kedai bebas cukai, mesti kekal dalam beg bermeterai bersama bukti pembelian.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
        ],
      },
      {
        id: 'power-banks',
        title: lt('Power banks', 'Power bank'),
        steps: [
          {
            id: 'mh-power-banks',
            title: lt('Malaysia Airlines: no power bank use on board', 'Malaysia Airlines: power bank tidak boleh digunakan dalam pesawat'),
            body: lt(
              'Malaysia Airlines announced that from 1 April 2025 passengers on Malaysia Airlines, Firefly and MASwings flights may not use or charge power banks during the flight, must keep them on their person rather than in the overhead locker, and may not put them in checked baggage.',
              'Malaysia Airlines mengumumkan bahawa mulai 1 April 2025 penumpang penerbangan Malaysia Airlines, Firefly dan MASwings tidak boleh menggunakan atau mengecas power bank semasa penerbangan, mesti menyimpannya pada diri sendiri dan bukan di ruang simpanan atas kepala, dan tidak boleh memasukkannya ke dalam bagasi daftar masuk.',
            ),
            provenance: 'official',
            sources: ['mh-power-banks', 'malaymail-mh-power-banks-2025'],
          },
          {
            id: 'other-airlines',
            title: lt('Other airlines set their own rules', 'Syarikat penerbangan lain menetapkan peraturan sendiri'),
            body: lt(
              "The Civil Aviation Authority of Malaysia said in March 2025 that banning power bank use on board was up to each airline. In 2026 it issued a safety directive to airlines on carrying power banks; we have not read its contents. Check your airline's rules before you pack.",
              'Pihak Berkuasa Penerbangan Awam Malaysia menyatakan pada Mac 2025 bahawa larangan penggunaan power bank dalam pesawat terserah kepada setiap syarikat penerbangan. Pada 2026 ia mengeluarkan arahan keselamatan kepada syarikat penerbangan tentang membawa power bank; kami belum membaca kandungannya. Semak peraturan syarikat penerbangan anda sebelum mengemas.',
            ),
            provenance: 'official',
            sources: ['thestar-power-banks-caam-2025', 'caam-sd-01-2026-power-banks'],
          },
        ],
      },
      {
        id: 'at-the-checkpoint',
        title: lt('At the checkpoint', 'Di pusat pemeriksaan'),
        steps: [
          {
            id: 'be-ready',
            title: lt('Be ready before your turn', 'Bersedia sebelum giliran anda'),
            body: lt(
              "Have your boarding pass in hand and your liquids bag easy to reach. Follow the officers' instructions about electronics, jackets and belts.",
              'Pegang pas masuk anda dan letakkan beg cecair di tempat yang mudah dicapai. Ikut arahan pegawai tentang peranti elektronik, jaket dan tali pinggang.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'tell-officers',
            title: lt('Need help? Say so before screening starts', 'Perlukan bantuan? Beritahu sebelum saringan bermula'),
            body: lt(
              'If you use a wheelchair or a medical device, or need privacy, tell an officer before screening starts.',
              'Jika anda menggunakan kerusi roda atau peranti perubatan, atau memerlukan privasi, beritahu pegawai sebelum saringan bermula.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'butterfly-priority',
            title: lt('Hidden disabilities: priority access at KLIA', 'Ketidakupayaan tersembunyi: laluan keutamaan di KLIA'),
            body: lt(
              "KLIA's Butterfly Effect programme offers priority access at major airport touchpoints for passengers with hidden disabilities who register at an information counter.",
              'Program Butterfly Effect di KLIA menawarkan laluan keutamaan di titik utama lapangan terbang bagi penumpang dengan ketidakupayaan tersembunyi yang mendaftar di kaunter pertanyaan.',
            ),
            provenance: 'official',
            sources: ['mahb-butterfly-effect'],
            actions: [{ label: lt('About the Butterfly Effect', 'Tentang Butterfly Effect'), href: '/guides/neurodivergent' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mahb-lags-restricted-items', 'mh-cabin-baggage', 'mh-power-banks', 'thestar-power-banks-caam-2025', 'mahb-butterfly-effect'],
  },
  {
    slug: 'immigration-customs',
    title: lt('Immigration and customs', 'Imigresen dan kastam'),
    summary: lt(
      'The arrival card (MDAC), passport control, customs, and the rules for flying between Peninsular Malaysia, Sabah and Sarawak.',
      'Kad ketibaan (MDAC), kawalan pasport, kastam, dan peraturan terbang antara Semenanjung Malaysia, Sabah dan Sarawak.',
    ),
    audience: ['arriving', 'departing', 'first-time'],
    sections: [
      {
        id: 'entering-malaysia',
        title: lt('Entering Malaysia from abroad', 'Memasuki Malaysia dari luar negara'),
        steps: [
          {
            id: 'mdac',
            title: lt('Foreign visitors: the Malaysia Digital Arrival Card', 'Pelawat asing: Kad Ketibaan Digital Malaysia'),
            body: lt(
              'Submit the MDAC in the three days before you arrive. It is free on the official Immigration portal. Singapore citizens do not need one, and nor do holders of diplomatic or official passports. Other exemptions may apply.',
              'Hantar MDAC dalam tempoh tiga hari sebelum anda tiba. Ia percuma di portal rasmi Imigresen. Warganegara Singapura tidak memerlukannya, begitu juga pemegang pasport diplomatik atau rasmi. Pengecualian lain mungkin terpakai.',
            ),
            provenance: 'official',
            sources: ['kln-mdac-mission-page', 'imi-mdac-portal'],
            actions: [{ label: lt('Open the official MDAC portal', 'Buka portal rasmi MDAC'), href: 'https://imigresen-online.imi.gov.my/mdac/main' }],
          },
          {
            id: 'documents',
            title: lt('Valid travel documents', 'Dokumen perjalanan yang sah'),
            body: lt(
              'Every passenger entering Malaysia needs valid travel documents. That means a passport and, if you need one, a visa. The arrival card is not a visa.',
              'Setiap penumpang yang memasuki Malaysia memerlukan dokumen perjalanan yang sah. Ini bermaksud pasport dan, jika perlu, visa. Kad ketibaan bukan visa.',
            ),
            provenance: 'official',
            sources: ['mahb-flight-transfers', 'kln-mdac-mission-page'],
          },
          {
            id: 'autogates',
            title: lt('Autogates', 'Autogate'),
            body: lt(
              'Sources differ on which visitors may use the autogates, and we found no official list. Travel guides say you need an e-passport valid for at least six months. They also say you must have sent your MDAC.',
              'Sumber berbeza tentang pelawat yang boleh menggunakan autogate, dan kami tidak menemui senarai rasmi. Panduan perjalanan menyatakan anda memerlukan e-pasport yang sah sekurang-kurangnya enam bulan. Panduan itu juga menyatakan MDAC anda mesti sudah dihantar.',
            ),
            provenance: 'estimated',
            sources: ['dollarsandsense-autogate-guide', 'traveloka-mdac', 'wego-klia-to-city'],
          },
        ],
      },
      {
        id: 'customs',
        title: lt('Customs', 'Kastam'),
        steps: [
          {
            id: 'declare',
            title: lt('Declare dutiable or prohibited goods', 'Isytiharkan barang bercukai atau larangan'),
            body: lt(
              'Tell the customs officers if you carry goods that need duty paid, or goods that are not allowed. This applies when you arrive in Malaysia and when you leave.',
              'Beritahu pegawai kastam jika anda membawa barang yang perlu dibayar duti, atau barang yang dilarang. Ini terpakai semasa anda tiba di Malaysia dan semasa anda berlepas.',
            ),
            provenance: 'official',
            sources: ['hro-customs-declaration-2022', 'customs-gov-my'],
          },
          {
            id: 'allowances',
            title: lt('Duty-free allowances: ask Customs', 'Elaun bebas cukai: tanya Kastam'),
            body: lt(
              'Guides give different limits for alcohol, tobacco and other goods. We could not confirm them with Customs, so we do not list them. Ask the Royal Malaysian Customs Department before you travel.',
              'Panduan memberikan had yang berbeza bagi alkohol, tembakau dan barang lain. Kami tidak dapat mengesahkannya dengan Kastam, jadi kami tidak menyenaraikannya. Tanya Jabatan Kastam Diraja Malaysia sebelum perjalanan.',
            ),
            provenance: 'suggestion',
            sources: ['customs-gov-my', 'prototype-method'],
            actions: [{ label: lt('Royal Malaysian Customs Department', 'Jabatan Kastam Diraja Malaysia'), href: 'https://www.customs.gov.my/' }],
          },
        ],
      },
      {
        id: 'leaving-malaysia',
        title: lt('Leaving Malaysia', 'Meninggalkan Malaysia'),
        steps: [
          {
            id: 'passport-control',
            title: lt('Passport control after check-in', 'Kawalan pasport selepas daftar masuk'),
            body: lt(
              'On an international flight, you go through passport control after check-in. Keep your passport and boarding pass in your hand, and allow time for queues.',
              'Bagi penerbangan antarabangsa, anda melalui kawalan pasport selepas daftar masuk. Pegang pasport dan pas masuk anda, dan peruntukkan masa untuk beratur.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'sabah-sarawak',
        title: lt('Flying between Peninsular Malaysia, Sabah and Sarawak', 'Terbang antara Semenanjung Malaysia, Sabah dan Sarawak'),
        steps: [
          {
            id: 'sabah-arrival',
            title: lt('Arriving in Sabah: immigration applies', 'Tiba di Sabah: pemeriksaan imigresen'),
            body: lt(
              'Sabah checks immigration on domestic arrivals from Peninsular Malaysia too. Have your MyKad or passport ready. A visit on a MyKad is limited to 90 days.',
              'Sabah turut menjalankan pemeriksaan imigresen bagi ketibaan domestik dari Semenanjung Malaysia. Sediakan MyKad atau pasport anda. Lawatan dengan MyKad terhad kepada 90 hari.',
            ),
            provenance: 'official',
            sources: ['thevibes-sabah-immigration-2022', 'sinchew-sabah-mykad-2024', 'imi-domestic-travel'],
          },
          {
            id: 'sabah-slip',
            title: lt('Keep the slip you are given in Sabah', 'Simpan slip yang diberikan di Sabah'),
            body: lt(
              'News reports and travel guides say Sabah gives MyKad holders from Peninsular Malaysia a printed slip on arrival. It is form IMM.114, and it shows how long you may stay. One guide says you hand it back when you leave Sabah, so keep it with your MyKad.',
              'Laporan berita dan panduan perjalanan menyatakan Sabah memberikan slip bercetak kepada pemegang MyKad dari Semenanjung Malaysia semasa tiba. Ia ialah borang IMM.114, dan ia menunjukkan tempoh anda boleh tinggal. Satu panduan menyatakan slip itu diserahkan semula apabila anda meninggalkan Sabah, jadi simpan bersama MyKad anda.',
            ),
            provenance: 'estimated',
            sources: ['sinchew-sabah-mykad-2024', 'seasia-sabah-sarawak-passports-2026'],
          },
          {
            id: 'sarawak-arrival',
            title: lt('Arriving in Sarawak: identity card', 'Tiba di Sarawak: kad pengenalan'),
            body: lt(
              'A news report says Malaysians from Peninsular Malaysia and Sabah can enter Sarawak with a MyKad, without a passport. It also says every Malaysian must show an identity card on entry. We have not seen the official wording.',
              'Satu laporan berita menyatakan rakyat Malaysia dari Semenanjung Malaysia dan Sabah boleh memasuki Sarawak dengan MyKad, tanpa pasport. Laporan itu juga menyatakan setiap rakyat Malaysia mesti menunjukkan kad pengenalan semasa masuk. Kami belum melihat teks rasmi.',
            ),
            provenance: 'estimated',
            sources: ['sarawaktribune-mykad-entry-2026'],
          },
          {
            id: 'leaving-sabah-sarawak',
            title: lt('Leaving Sabah or Sarawak on a domestic flight', 'Meninggalkan Sabah atau Sarawak dengan penerbangan domestik'),
            body: lt(
              'Leaving Sabah or Sarawak on a domestic flight? The Immigration Department asks you to show an accepted identity document with your boarding pass. Examples are a passport, a MyKad or a temporary identity card. Malaysia Airlines accepts original documents only.',
              'Meninggalkan Sabah atau Sarawak dengan penerbangan domestik? Jabatan Imigresen meminta anda menunjukkan dokumen pengenalan yang diterima bersama pas masuk. Contohnya pasport, MyKad atau kad pengenalan sementara. Malaysia Airlines hanya menerima dokumen asal.',
            ),
            provenance: 'official',
            sources: ['imi-domestic-travel', 'mh-visa-immigration-documents'],
          },
          {
            id: 'long-stays',
            title: lt('Staying more than three months', 'Tinggal lebih daripada tiga bulan'),
            body: lt(
              'Planning to stay in Sarawak for more than three months? Malaysians from Peninsular Malaysia then need a Restricted Travel Document. For Sabah, check the rules with the Immigration Department.',
              'Bercadang tinggal di Sarawak melebihi tiga bulan? Rakyat Malaysia dari Semenanjung Malaysia memerlukan Dokumen Perjalanan Terhad. Bagi Sabah, semak peraturannya dengan Jabatan Imigresen.',
            ),
            provenance: 'official',
            sources: ['imi-domestic-travel', 'imi-restricted-travel-documents'],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['kln-mdac-mission-page', 'mahb-flight-transfers', 'hro-customs-declaration-2022', 'imi-domestic-travel', 'imi-restricted-travel-documents'],
  },
  {
    slug: 'baggage',
    title: lt('Baggage', 'Bagasi'),
    summary: lt(
      'What goes where, what to do when a bag is late or lost, and who to ask.',
      'Apa yang dimasukkan ke mana, apa yang perlu dilakukan apabila bagasi lewat atau hilang, dan siapa yang perlu ditanya.',
    ),
    audience: ['departing', 'arriving'],
    sections: [
      {
        id: 'packing',
        title: lt('Packing', 'Mengemas'),
        steps: [
          {
            id: 'allowance',
            title: lt('Your airline sets the allowance', 'Syarikat penerbangan menetapkan elaun'),
            body: lt(
              'Weight, size and number of bags depend on your airline and fare. Check your booking before you pack.',
              'Berat, saiz dan bilangan beg bergantung pada syarikat penerbangan dan tambang anda. Semak tempahan anda sebelum mengemas.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
          {
            id: 'power-banks',
            title: lt('Power banks travel with you', 'Power bank dibawa bersama anda'),
            body: lt(
              'Malaysia Airlines does not accept power banks in checked baggage. Other airlines set their own rules.',
              'Malaysia Airlines tidak menerima power bank dalam bagasi daftar masuk. Syarikat penerbangan lain menetapkan peraturan sendiri.',
            ),
            provenance: 'official',
            sources: ['mh-power-banks', 'malaymail-mh-power-banks-2025'],
          },
          {
            id: 'liquids',
            title: lt('Larger liquids in the hold', 'Cecair yang lebih besar dalam bagasi daftar masuk'),
            body: lt(
              'On international flights from KLIA, cabin liquids are limited to 100 ml per container in one 1-litre bag. Malaysia Airports says larger quantities can go in checked baggage.',
              'Bagi penerbangan antarabangsa dari KLIA, cecair dalam kabin dihadkan kepada 100 ml setiap bekas dalam satu beg 1 liter. Malaysia Airports menyatakan kuantiti yang lebih besar boleh dimasukkan ke dalam bagasi daftar masuk.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'medicines',
            title: lt('Medicines can stay in your cabin bag', 'Ubat boleh disimpan dalam beg kabin'),
            body: lt(
              'Medicines are allowed in cabin baggage, so you can keep what you need with you.',
              'Ubat dibenarkan dalam bagasi kabin, jadi anda boleh menyimpan ubat yang diperlukan bersama anda.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'label',
            title: lt('Label and photograph your bags', 'Labelkan dan ambil gambar beg anda'),
            body: lt(
              'Put your name and a phone number inside and outside each bag, and take a photo of it. Both help if it goes missing.',
              'Letakkan nama dan nombor telefon di dalam dan di luar setiap beg, dan ambil gambarnya. Kedua-duanya membantu jika beg hilang.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'on-arrival',
        title: lt('On arrival', 'Semasa ketibaan'),
        steps: [
          {
            id: 'missing-bag',
            title: lt('Bag missing or damaged? Report it before you leave the hall', 'Beg hilang atau rosak? Laporkan sebelum keluar dari balai'),
            body: lt(
              'Report missing checked baggage to your airline or its ground handler before you leave the baggage hall, and keep the reference you are given.',
              'Laporkan bagasi daftar masuk yang hilang kepada syarikat penerbangan atau pengendali daratnya sebelum keluar dari balai bagasi, dan simpan nombor rujukan yang diberikan.',
            ),
            provenance: 'estimated',
            sources: ['kliainfo-lost-found'],
          },
          {
            id: 'lost-in-terminal',
            title: lt('Lost something in the terminal?', 'Kehilangan barang di terminal?'),
            body: lt(
              "Malaysia Airports runs a Lost & Found service for items lost in the terminal. We have not verified its location, hours or phone number, so use the official Lost & Found page.",
              'Malaysia Airports mengendalikan perkhidmatan Barang Hilang & Dijumpai untuk barang yang hilang di terminal. Kami belum mengesahkan lokasi, waktu operasi atau nombor telefonnya, jadi gunakan halaman rasmi Barang Hilang & Dijumpai.',
            ),
            provenance: 'official',
            sources: ['mahb-lost-found'],
            actions: [{ label: lt('Lost property help', 'Bantuan barang hilang'), href: '/help/lost-property' }],
          },
          {
            id: 'unresolved',
            title: lt('Claim not resolved?', 'Tuntutan tidak selesai?'),
            body: lt(
              'Complain to the airline first and keep its reference number. A law firm guide says that if the airline does not resolve it, you can take the complaint to the Malaysian Aviation Commission (Mavcom).',
              'Buat aduan kepada syarikat penerbangan dahulu dan simpan nombor rujukannya. Panduan sebuah firma guaman menyatakan jika syarikat penerbangan tidak menyelesaikannya, anda boleh membawa aduan kepada Suruhanjaya Penerbangan Malaysia (Mavcom).',
            ),
            provenance: 'estimated',
            sources: ['conventuslaw-mavcom-complaint'],
            actions: [{ label: lt('Feedback and complaints', 'Maklum balas dan aduan'), href: '/help/feedback' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mh-power-banks', 'mahb-lags-restricted-items', 'mahb-lost-found', 'kliainfo-lost-found', 'prototype-method'],
  },
  {
    slug: 'families',
    title: lt('Travelling with babies and children', 'Melancong bersama bayi dan kanak-kanak'),
    summary: lt(
      'Baby food through security, support for children with hidden disabilities, and planning around little ones.',
      'Makanan bayi melalui saringan, sokongan untuk kanak-kanak dengan ketidakupayaan tersembunyi, dan merancang mengikut keperluan si kecil.',
    ),
    audience: ['family', 'departing', 'arriving'],
    sections: [
      {
        id: 'before-you-fly',
        title: lt('Before you fly', 'Sebelum terbang'),
        steps: [
          {
            id: 'airline-rules',
            title: lt('Check your airline’s rules for children', 'Semak peraturan syarikat penerbangan untuk kanak-kanak'),
            body: lt(
              'Your airline sets the rules for infants and children: tickets, seats, strollers, car seats and cots. Check them when you book.',
              'Syarikat penerbangan menetapkan peraturan untuk bayi dan kanak-kanak: tiket, tempat duduk, kereta sorong, kerusi keselamatan dan katil bayi. Semak semasa membuat tempahan.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
          {
            id: 'documents',
            title: lt('Check documents for each child', 'Semak dokumen setiap kanak-kanak'),
            body: lt(
              "Check what each child needs for your route with your airline and, for international trips, your destination's authorities.",
              'Semak dokumen yang diperlukan oleh setiap kanak-kanak untuk laluan anda dengan syarikat penerbangan dan, bagi perjalanan antarabangsa, pihak berkuasa destinasi anda.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'extra-time',
            title: lt('Allow extra time', 'Peruntukkan masa tambahan'),
            body: lt(
              'Queues, nappy changes and snacks all take time. Leave earlier than you would alone.',
              'Beratur, menukar lampin dan makan semuanya mengambil masa. Bertolak lebih awal berbanding jika anda bersendirian.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'screening',
        title: lt('Through security', 'Melalui saringan keselamatan'),
        steps: [
          {
            id: 'baby-food',
            title: lt('Baby milk and baby food are allowed', 'Susu bayi dan makanan bayi dibenarkan'),
            body: lt(
              'At KLIA, baby milk and baby food are allowed in cabin baggage on international flights, alongside the 100 ml rule for other liquids.',
              'Di KLIA, susu bayi dan makanan bayi dibenarkan dalam bagasi kabin bagi penerbangan antarabangsa, di samping peraturan 100 ml bagi cecair lain.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'stroller',
            title: lt('Ask about your stroller at check-in', 'Tanya tentang kereta sorong semasa daftar masuk'),
            body: lt(
              'Ask whether you can keep the stroller until the gate or must check it in.',
              'Tanya sama ada anda boleh membawa kereta sorong hingga ke pintu berlepas atau perlu mendaftarkannya.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'at-the-airport',
        title: lt('At the airport', 'Di lapangan terbang'),
        steps: [
          {
            id: 'nursing-rooms',
            title: lt('Nursing rooms and play areas', 'Bilik menyusu dan ruang permainan'),
            body: lt(
              'This prototype has not yet verified nursing rooms or play areas. Ask at an information counter or check the official airport website.',
              'Prototaip ini belum mengesahkan bilik menyusu atau ruang permainan. Tanya di kaunter pertanyaan atau semak laman web rasmi lapangan terbang.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method', 'mahb-klia-t1-facilities'],
          },
          {
            id: 'butterfly',
            title: lt('Children with hidden disabilities', 'Kanak-kanak dengan ketidakupayaan tersembunyi'),
            body: lt(
              "KLIA's Butterfly Effect programme supports passengers with hidden disabilities such as autism and ADHD, with a lanyard, priority access and Calm Rooms. In the Terminal 1 Calm Room, parents or carers are asked to stay with and supervise children.",
              'Program Butterfly Effect di KLIA menyokong penumpang dengan ketidakupayaan tersembunyi seperti autisme dan ADHD, dengan lanyard, laluan keutamaan dan Bilik Tenang. Di Bilik Tenang Terminal 1, ibu bapa atau penjaga diminta menemani dan mengawasi kanak-kanak.',
            ),
            provenance: 'official',
            sources: ['mahb-butterfly-effect', 'says-calm-room-sensory-walls'],
            actions: [{ label: lt('Read the hidden disabilities guide', 'Baca panduan ketidakupayaan tersembunyi'), href: '/guides/neurodivergent' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mahb-lags-restricted-items', 'mahb-butterfly-effect', 'prototype-method'],
  },
  {
    slug: 'first-time',
    title: lt('Flying internationally for the first time', 'Terbang ke luar negara buat kali pertama'),
    summary: lt(
      'The whole trip in order, with the few rules that catch people out.',
      'Keseluruhan perjalanan mengikut turutan, termasuk beberapa peraturan yang sering terlepas pandang.',
    ),
    audience: ['first-time', 'departing'],
    sections: [
      {
        id: 'before-you-go',
        title: lt('Before you go', 'Sebelum bertolak'),
        steps: [
          {
            id: 'documents',
            title: lt('Check your passport and visa', 'Semak pasport dan visa anda'),
            body: lt(
              "Check your passport's expiry date and any visa you need with your airline and your destination's authorities, well before you travel.",
              'Semak tarikh tamat pasport dan sebarang visa yang diperlukan dengan syarikat penerbangan dan pihak berkuasa destinasi anda, jauh lebih awal sebelum perjalanan.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'terminal',
            title: lt('Check your airport and terminal', 'Semak lapangan terbang dan terminal anda'),
            body: lt(
              'Your booking names the airport and, at KLIA, the terminal. KLIA Terminal 1 and KLIA Terminal 2 are separate buildings.',
              'Tempahan anda menyatakan lapangan terbang dan, di KLIA, terminalnya. KLIA Terminal 1 dan KLIA Terminal 2 ialah bangunan berasingan.',
            ),
            provenance: 'official',
            sources: ['mahb-klia-t1-home', 'malaymail-klia-rebrand-2023'],
          },
          {
            id: 'arrival-time',
            title: lt('Arrive about three hours before', 'Tiba kira-kira tiga jam lebih awal'),
            body: lt(
              'As a guide, aim to be at the airport at least 3 hours before an international flight. Your airline sets the real deadlines.',
              'Sebagai panduan, cuba tiba di lapangan terbang sekurang-kurangnya 3 jam sebelum penerbangan antarabangsa. Syarikat penerbangan menetapkan had masa sebenar.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
          {
            id: 'pack-liquids',
            title: lt('Pack liquids the right way', 'Kemas cecair dengan betul'),
            body: lt(
              'In your cabin bag, each liquid, aerosol or gel must be 100 ml or less, all in one bag of no more than 1 litre. Medicines, baby milk and baby food are allowed.',
              'Dalam beg kabin, setiap cecair, aerosol atau gel mesti 100 ml atau kurang, semuanya dalam satu beg tidak melebihi 1 liter. Ubat, susu bayi dan makanan bayi dibenarkan.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
            actions: [{ label: lt('Read the security guide', 'Baca panduan keselamatan'), href: '/guides/security' }],
          },
        ],
      },
      {
        id: 'at-the-airport',
        title: lt('At the airport, in order', 'Di lapangan terbang, mengikut turutan'),
        steps: [
          {
            id: 'check-in',
            title: lt('1. Check in and drop your bags', '1. Daftar masuk dan serahkan bagasi'),
            body: lt(
              'Show your passport and booking at the counter or bag drop. You leave with a boarding pass that shows your gate and boarding time.',
              'Tunjukkan pasport dan tempahan anda di kaunter atau serahan bagasi. Anda akan menerima pas masuk yang menunjukkan pintu dan waktu menaiki pesawat.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
            actions: [{ label: lt('Check-in and bag drop', 'Daftar masuk dan serahan bagasi'), href: '/guides/check-in' }],
          },
          {
            id: 'passport-control',
            title: lt('2. Passport control', '2. Kawalan pasport'),
            body: lt(
              'Keep your passport and boarding pass in hand and allow time for queues.',
              'Pegang pasport dan pas masuk anda dan peruntukkan masa untuk beratur.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'security',
            title: lt('3. Security screening', '3. Saringan keselamatan'),
            body: lt(
              'Passengers on international flights at KLIA are screened for liquids, aerosols and gels. Have your liquids bag ready.',
              'Penumpang penerbangan antarabangsa di KLIA disaring untuk cecair, aerosol dan gel. Sediakan beg cecair anda.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'gate',
            title: lt('4. Find your gate', '4. Cari pintu berlepas anda'),
            body: lt(
              'At KLIA Terminal 1, C gates are in the Satellite Building, reached by the Aerotrain in under three minutes; allow extra time for waiting and walking.',
              'Di KLIA Terminal 1, pintu C terletak di Bangunan Satelit, boleh dicapai dengan Aerotrain dalam masa kurang tiga minit; peruntukkan masa tambahan untuk menunggu dan berjalan.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey', 'malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025'],
            actions: [{ label: lt('Open the Terminal 1 map', 'Buka peta Terminal 1'), href: '/kul/map' }],
          },
          {
            id: 'boarding',
            title: lt('5. Be at the gate for boarding', '5. Berada di pintu untuk menaiki pesawat'),
            body: lt(
              'Gates usually close before the departure time. Plan around the boarding time on your boarding pass.',
              'Pintu biasanya ditutup sebelum waktu berlepas. Rancang mengikut waktu menaiki pesawat pada pas masuk anda.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'visiting-malaysia',
        title: lt('Visiting Malaysia?', 'Melawat Malaysia?'),
        steps: [
          {
            id: 'mdac',
            title: lt('Submit the arrival card before you fly', 'Hantar kad ketibaan sebelum terbang'),
            body: lt(
              'Foreign visitors submit the Malaysia Digital Arrival Card within three days before arrival. It is free on the official Immigration portal.',
              'Pelawat asing menghantar Kad Ketibaan Digital Malaysia dalam tempoh tiga hari sebelum ketibaan. Ia percuma di portal rasmi Imigresen.',
            ),
            provenance: 'official',
            sources: ['kln-mdac-mission-page', 'imi-mdac-portal'],
            actions: [{ label: lt('Immigration and customs guide', 'Panduan imigresen dan kastam'), href: '/guides/immigration-customs' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mahb-klia-t1-home', 'mahb-lags-restricted-items', 'mh-klia-t1-passenger-journey', 'kln-mdac-mission-page', 'prototype-method'],
  },
  {
    slug: 'reduced-mobility',
    title: lt('Reduced mobility and wheelchair assistance', 'Pergerakan terhad dan bantuan kerusi roda'),
    summary: lt(
      'How to ask for help through your airline and the airport, and how to plan step-free routes.',
      'Cara meminta bantuan melalui syarikat penerbangan dan lapangan terbang, serta merancang laluan tanpa tangga.',
    ),
    audience: ['accessibility'],
    sections: [
      {
        id: 'ask-for-help',
        title: lt('Ask for help before you travel', 'Minta bantuan sebelum perjalanan'),
        steps: [
          {
            id: 'airline',
            title: lt('Ask your airline when you book', 'Tanya syarikat penerbangan semasa menempah'),
            body: lt(
              'Malaysia Airlines asks for wheelchair requests at least 48 hours before departure, through its contact centre, appointed travel agents or its ticketing offices. Later requests depend on wheelchair availability. It says wheelchair assistance is free of charge. Other airlines have their own rules: ask yours when you book.',
              'Malaysia Airlines meminta permohonan kerusi roda dibuat sekurang-kurangnya 48 jam sebelum berlepas, melalui pusat panggilan, ejen pelancongan yang dilantik atau pejabat tiketnya. Permohonan lewat bergantung pada ketersediaan kerusi roda. Ia menyatakan bantuan kerusi roda adalah percuma. Syarikat penerbangan lain mempunyai peraturan sendiri: tanya semasa menempah.',
            ),
            provenance: 'official',
            sources: ['mh-special-assistance'],
          },
          {
            id: 'meet-assist',
            title: lt('Meet and Assist', 'Meet and Assist'),
            body: lt(
              'Malaysia Airlines also offers a Meet and Assist service for elderly passengers and people with special needs travelling alone, with the same 48 hours’ notice.',
              'Malaysia Airlines turut menawarkan perkhidmatan Meet and Assist untuk penumpang warga emas dan orang berkeperluan khas yang melancong bersendirian, dengan notis 48 jam yang sama.',
            ),
            provenance: 'official',
            sources: ['mh-special-assistance'],
          },
          {
            id: 'tell-details',
            title: lt('Say exactly what you need', 'Nyatakan keperluan anda dengan tepat'),
            body: lt(
              'Say whether you can walk short distances or climb steps, whether you bring your own wheelchair or mobility aid, and whether it uses batteries. Clear details help the airline arrange the right help.',
              'Nyatakan sama ada anda boleh berjalan jarak dekat atau menaiki tangga, sama ada anda membawa kerusi roda atau alat bantu pergerakan sendiri, dan sama ada ia menggunakan bateri. Butiran yang jelas membantu syarikat penerbangan menyediakan bantuan yang sesuai.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'airport-page',
            title: lt('The airport’s special assistance page', 'Halaman bantuan khas lapangan terbang'),
            body: lt(
              'Malaysia Airports lists a special assistance page for KLIA Terminal 1. We could not capture its content, so we do not summarise it: open the official page for the current arrangements.',
              'Malaysia Airports menyenaraikan halaman bantuan khas bagi KLIA Terminal 1. Kami tidak dapat memperoleh kandungannya, jadi kami tidak meringkaskannya: buka halaman rasmi untuk maklumat semasa.',
            ),
            provenance: 'official',
            sources: ['mahb-special-assistance-klia-t1'],
            actions: [{ label: lt('Special assistance (official site)', 'Bantuan khas (laman rasmi)'), href: 'https://www.malaysiaairports.com.my/en/klia1/air-travel/special-assistance' }],
          },
        ],
      },
      {
        id: 'at-the-airport',
        title: lt('At the airport', 'Di lapangan terbang'),
        steps: [
          {
            id: 'step-free-map',
            title: lt('Plan a step-free route', 'Rancang laluan tanpa tangga'),
            body: lt(
              'Our schematic map of KLIA Terminal 1 can plan a step-free route that uses lifts instead of escalators where the drawing allows. It is a demonstration map, not a floor plan: follow the signs and ask staff.',
              'Peta skematik KLIA Terminal 1 kami boleh merancang laluan tanpa tangga yang menggunakan lif dan bukan eskalator jika lukisan membenarkan. Ia peta demonstrasi, bukan pelan lantai: ikut papan tanda dan tanya petugas.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
            actions: [{ label: lt('Open the map with step-free routes', 'Buka peta dengan laluan tanpa tangga'), href: '/kul/map?sf=1' }],
          },
          {
            id: 'c-gates',
            title: lt('C gates mean a train ride', 'Pintu C bermakna menaiki tren'),
            body: lt(
              'At KLIA Terminal 1, C gates are in the Satellite Building, reached by the Aerotrain. When the Aerotrain is closed, transfer buses run from the bus lounge; ask ground staff for help.',
              'Di KLIA Terminal 1, pintu C terletak di Bangunan Satelit, boleh dicapai dengan Aerotrain. Apabila Aerotrain ditutup, bas pemindahan beroperasi dari ruang menunggu bas; minta bantuan petugas.',
            ),
            provenance: 'official',
            sources: ['malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025', 'mh-klia-t1-passenger-journey'],
          },
          {
            id: 'facilities',
            title: lt('Accessible facilities', 'Kemudahan mesra OKU'),
            body: lt(
              'Our facilities directory lists the assistance services we could verify. Accessible toilet locations are not yet verified in this prototype.',
              'Direktori kemudahan kami menyenaraikan perkhidmatan bantuan yang dapat kami sahkan. Lokasi tandas OKU belum disahkan dalam prototaip ini.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
            actions: [{ label: lt('Assistance services at KLIA', 'Perkhidmatan bantuan di KLIA'), href: '/kul/facilities?access=1' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mh-special-assistance', 'mahb-special-assistance-klia-t1', 'malaymail-aerotrain-software-oct-2026', 'prototype-method'],
  },
  {
    slug: 'neurodivergent',
    title: lt('Autism, ADHD and other hidden disabilities', 'Autisme, ADHD dan ketidakupayaan tersembunyi lain'),
    summary: lt(
      "KLIA's Butterfly Effect programme: the lanyard, priority access, Calm Rooms and sensory walls.",
      'Program Butterfly Effect di KLIA: lanyard, laluan keutamaan, Bilik Tenang dan dinding deria.',
    ),
    audience: ['accessibility', 'family'],
    sections: [
      {
        id: 'butterfly-effect',
        title: lt('The Butterfly Effect', 'The Butterfly Effect'),
        steps: [
          {
            id: 'what',
            title: lt('Who it is for', 'Untuk siapa'),
            body: lt(
              "The Butterfly Effect is KLIA's assistance programme for passengers with hidden disabilities such as autism, ADHD, global developmental delay and sensory processing disorder.",
              'The Butterfly Effect ialah program bantuan KLIA untuk penumpang dengan ketidakupayaan tersembunyi seperti autisme, ADHD, kelewatan perkembangan global dan gangguan pemprosesan deria.',
            ),
            provenance: 'official',
            sources: ['mahb-butterfly-effect'],
          },
          {
            id: 'register',
            title: lt('Register at an information counter', 'Daftar di kaunter pertanyaan'),
            body: lt(
              'Register at the airport information counter to receive a Butterfly Kit with a Butterfly lanyard and the locations of the Calm Room and sensory walls.',
              'Daftar di kaunter pertanyaan lapangan terbang untuk menerima Butterfly Kit yang mengandungi lanyard Butterfly serta lokasi Bilik Tenang dan dinding deria.',
            ),
            provenance: 'official',
            sources: ['mahb-butterfly-effect', 'routesonline-calm-room-t2'],
          },
          {
            id: 'priority',
            title: lt('Priority access', 'Laluan keutamaan'),
            body: lt(
              'The programme offers priority access at major airport touchpoints.',
              'Program ini menawarkan laluan keutamaan di titik utama lapangan terbang.',
            ),
            provenance: 'official',
            sources: ['mahb-butterfly-effect'],
          },
        ],
      },
      {
        id: 'quiet-spaces',
        title: lt('Quiet spaces', 'Ruang tenang'),
        steps: [
          {
            id: 't1-calm-room',
            title: lt('Calm Room, Terminal 1', 'Bilik Tenang, Terminal 1'),
            body: lt(
              'On Level 5 of the Main Terminal Building. Entry uses an access code supplied in the Butterfly Kit. Parents or carers are asked to stay with and supervise children.',
              'Di Aras 5 Bangunan Terminal Utama. Masuk menggunakan kod akses yang diberikan dalam Butterfly Kit. Ibu bapa atau penjaga diminta menemani dan mengawasi kanak-kanak.',
            ),
            provenance: 'official',
            sources: ['mahb-butterfly-effect', 'says-calm-room-sensory-walls'],
            actions: [{ label: lt('Calm Rooms in the facilities directory', 'Bilik Tenang dalam direktori kemudahan'), href: '/kul/facilities?cat=calm-room' }],
          },
          {
            id: 't2-calm-room',
            title: lt('Calm Room, Terminal 2', 'Bilik Tenang, Terminal 2'),
            body: lt(
              'On the Mezzanine Floor (Level 3A) of the Departure Hall. It opened in July 2025.',
              'Di Tingkat Mezanin (Aras 3A) Balai Berlepas. Ia dibuka pada Julai 2025.',
            ),
            provenance: 'estimated',
            sources: ['routesonline-calm-room-t2'],
          },
          {
            id: 'sensory-walls',
            title: lt('Sensory walls', 'Dinding deria'),
            body: lt(
              'Launch coverage reported six sensory walls in Terminal 1 and four in Terminal 2. Their locations are given in the Butterfly Kit.',
              'Liputan pelancaran melaporkan enam dinding deria di Terminal 1 dan empat di Terminal 2. Lokasinya dinyatakan dalam Butterfly Kit.',
            ),
            provenance: 'estimated',
            sources: ['says-calm-room-sensory-walls'],
          },
        ],
      },
      {
        id: 'prepare',
        title: lt('Preparing together', 'Bersedia bersama'),
        steps: [
          {
            id: 'preview',
            title: lt('Walk through the day in advance', 'Lalui perjalanan hari itu lebih awal'),
            body: lt(
              'Look at the terminal map and this guide together, and talk through each step: check-in, security, waiting, boarding.',
              'Lihat peta terminal dan panduan ini bersama-sama, dan bincangkan setiap langkah: daftar masuk, saringan keselamatan, menunggu dan menaiki pesawat.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
            actions: [{ label: lt('Open the Terminal 1 map', 'Buka peta Terminal 1'), href: '/kul/map' }],
          },
          {
            id: 'comfort',
            title: lt('Bring what helps', 'Bawa apa yang membantu'),
            body: lt(
              'Familiar comfort items, snacks and noise-reducing headphones can make waiting easier.',
              'Barang keselesaan yang biasa, snek dan fon kepala pengurang bunyi boleh memudahkan masa menunggu.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
          {
            id: 'site-settings',
            title: lt('Calmer screens on this site', 'Paparan lebih tenang di laman ini'),
            body: lt(
              'You can reduce motion, increase contrast and enlarge text on this site. Settings stay on your device.',
              'Anda boleh mengurangkan gerakan, meningkatkan kontras dan membesarkan teks di laman ini. Tetapan disimpan pada peranti anda.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
            actions: [{ label: lt('Display and accessibility settings', 'Tetapan paparan dan kebolehcapaian'), href: '/accessibility#settings' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mahb-butterfly-effect', 'routesonline-calm-room-t2', 'says-calm-room-sensory-walls', 'ptt-butterfly-effect-2020'],
  },
  {
    slug: 'older-travellers',
    title: lt('Older travellers', 'Pengembara warga emas'),
    summary: lt(
      'Assistance, medicines, distances and rest: planning a calmer trip.',
      'Bantuan, ubat, jarak dan rehat: merancang perjalanan yang lebih tenang.',
    ),
    audience: ['accessibility'],
    sections: [
      {
        id: 'before-you-go',
        title: lt('Before you go', 'Sebelum bertolak'),
        steps: [
          {
            id: 'assistance',
            title: lt('Book assistance early', 'Tempah bantuan lebih awal'),
            body: lt(
              'Malaysia Airlines asks for wheelchair requests at least 48 hours before departure and offers a Meet and Assist service for elderly passengers with the same notice. Other airlines have their own rules.',
              'Malaysia Airlines meminta permohonan kerusi roda dibuat sekurang-kurangnya 48 jam sebelum berlepas dan menawarkan perkhidmatan Meet and Assist untuk penumpang warga emas dengan notis yang sama. Syarikat penerbangan lain mempunyai peraturan sendiri.',
            ),
            provenance: 'official',
            sources: ['mh-special-assistance'],
            actions: [{ label: lt('Reduced mobility guide', 'Panduan pergerakan terhad'), href: '/guides/reduced-mobility' }],
          },
          {
            id: 'medicines',
            title: lt('Keep medicines with you', 'Simpan ubat bersama anda'),
            body: lt(
              'Medicines are allowed in cabin baggage, including liquid medicines on international flights from KLIA.',
              'Ubat dibenarkan dalam bagasi kabin, termasuk ubat cecair bagi penerbangan antarabangsa dari KLIA.',
            ),
            provenance: 'official',
            sources: ['mahb-lags-restricted-items'],
          },
          {
            id: 'documents',
            title: lt('Bring original documents', 'Bawa dokumen asal'),
            body: lt('Malaysia Airlines accepts original documents only, not photocopies.', 'Malaysia Airlines hanya menerima dokumen asal, bukan salinan.'),
            provenance: 'official',
            sources: ['mh-visa-immigration-documents'],
          },
        ],
      },
      {
        id: 'at-the-airport',
        title: lt('At the airport', 'Di lapangan terbang'),
        steps: [
          {
            id: 'distances',
            title: lt('Allow for distances', 'Ambil kira jarak'),
            body: lt(
              'At KLIA Terminal 1, C gates are in the Satellite Building, reached by the Aerotrain in under three minutes; allow extra time for waiting and walking.',
              'Di KLIA Terminal 1, pintu C terletak di Bangunan Satelit, boleh dicapai dengan Aerotrain dalam masa kurang tiga minit; peruntukkan masa tambahan untuk menunggu dan berjalan.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey', 'malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025'],
          },
          {
            id: 'rest',
            title: lt('Sit down before you queue', 'Duduk sebelum beratur'),
            body: lt(
              'Rest before the long queues. A lounge can be a quieter place to wait if your ticket or card gives access.',
              'Berehat sebelum beratur panjang. Lounge boleh menjadi tempat menunggu yang lebih tenang jika tiket atau kad anda membenarkan akses.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
            actions: [{ label: lt('Lounges and hotels at KLIA', 'Lounge dan hotel di KLIA'), href: '/kul/lounges' }],
          },
          {
            id: 'ask',
            title: lt('Ask at an information counter', 'Tanya di kaunter pertanyaan'),
            body: lt(
              'KLIA has staffed information counters for questions. Their exact positions are not yet verified in this prototype: check the official terminal map.',
              'KLIA mempunyai kaunter pertanyaan yang dikendalikan petugas. Kedudukan tepatnya belum disahkan dalam prototaip ini: rujuk peta terminal rasmi.',
            ),
            provenance: 'official',
            sources: ['routesonline-calm-room-t2', 'mahb-klia-t1-map'],
          },
          {
            id: 'text-size',
            title: lt('Larger text on this site', 'Teks lebih besar di laman ini'),
            body: lt('Make the text on this site larger, or turn on high contrast, in the display settings.', 'Besarkan teks di laman ini, atau hidupkan kontras tinggi, dalam tetapan paparan.'),
            provenance: 'suggestion',
            sources: ['prototype-method'],
            actions: [{ label: lt('Display and accessibility settings', 'Tetapan paparan dan kebolehcapaian'), href: '/accessibility#settings' }],
          },
        ],
      },
    ],
    asOf: '2026-11-17',
    sources: ['mh-special-assistance', 'mahb-lags-restricted-items', 'mh-klia-t1-passenger-journey', 'prototype-method'],
  },
];

/** One guide by slug. */
export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Slugs of all guides, for `generateStaticParams`. */
export function guideSlugs(): string[] {
  return GUIDES.map((guide) => guide.slug);
}

/** Guides written for an audience (guides tagged `all` are always included). */
export function guidesForAudience(audience: Audience): Guide[] {
  return GUIDES.filter((guide) => guide.audience.includes(audience) || guide.audience.includes('all'));
}

/** Guides relevant to an airport: network-wide guides plus those naming the airport. */
export function guidesForAirport(airport: string): Guide[] {
  return GUIDES.filter((guide) => !guide.airports || guide.airports.includes(airport));
}

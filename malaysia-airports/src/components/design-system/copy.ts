import type { Lang } from '@/content/types';

/**
 * Direction v2 copy for the living style guide (redesign round 1). It lives beside the style
 * guide rather than in the shared dictionaries, which other teams are editing in parallel; the
 * older `designSystem.*` keys still supply the section names and table headings that did not
 * change. Server-only data: passed to Client Components as plain strings where needed.
 */
const en = {
  eyebrow: 'Design system · Direction v2',
  title: 'Premium, clean, and made for the journey',
  lead: 'Midnight navy with a touch of gold, real photography, big confident type and app-like controls. Every token and component behind the pages, with its contrast measured in each theme.',
  heroNote: 'Synthetic sample image. The photography library supplies the real pictures.',
  stats: { pairs: 'Colour pairs measured', themes: 'Themes and scopes', lowest: 'Lowest text contrast' },
  sections: {
    media: 'Photography, glass and media',
    flight: 'Flight status',
  },
  intro: {
    colour: 'Midnight navy is the base, gold is used sparingly, surfaces are white and cool grey, and the status colours are tuned for flights. Each swatch shows its light and dark value.',
    contrast: 'Every text and boundary pair, measured in each theme, including text over glass and scrims composited on a pure white and a pure black photograph. Text needs 4.5:1, boundaries and focus 3:1.',
    type: 'Hanken Grotesk for big, confident headings and the whole interface; Fraunces for the wordmark and rare editorial accents; Geist Mono for times, gates and codes.',
    layout: 'Generous space, soft corners from 12 to 28 px, layered shadows, and smooth, short motion that switches off with reduced motion.',
    media:
      'Full-bleed photography behind scrims, frosted glass panels and rounded media. Words over a photograph always sit on a scrim or a glass panel, so they meet 4.5:1 even over a white picture.',
    flight: 'Seven tones tuned for flight status, as soft and solid pills, readable on light, dark and the board. Words and an icon or dot always carry the meaning, never colour alone.',
  },
  groups: {
    surfaces: 'Surfaces and fills',
    brand: 'Midnight and brand',
    accents: 'Gold, leaf and focus',
    flightTones: 'Flight status tones',
    glass: 'Glass over a photograph',
    media: 'Text over a photograph',
    flight: 'Flight status',
    scrims: 'Scrims: the worst case',
    hero: 'Hero media',
    mediaCards: 'Media cards',
    cardMedia: 'Card with an image slot',
    glassPanels: 'Glass panels',
    pills: 'Status pills',
    mapping: 'From the flight model',
    radii: 'Radius',
    elevation: 'Elevation',
    motion: 'Motion',
    serif: 'Editorial serif',
  },
  notes: {
    gold: 'Gold is an accent, never a status: one gold action or rule per view.',
    focus: 'The focus ring is orchid, never a brand or status colour; over media it turns light orchid.',
    scrims: 'The text zone of each scrim holds 78 % midnight, so white text meets 4.5:1 over a pure white picture. Beyond it the photograph breathes.',
    worstCase: 'Synthetic test image: a white, high-key field, the hardest case for light text.',
    glass: 'Glass is decoration over a strong fill: 84 % surface (theme) or 72 % midnight (dark). It turns solid with reduce transparency, without backdrop-filter, and in high contrast.',
    pills: 'Soft for lists and boards; solid for the one status that matters most on a view (final call).',
    mapping: 'Each status of the flight model and the pill it becomes. The board keeps its own chip until the page designers move it over.',
    motion: 'Lifts and image zooms use the motion-ok variant: off with the system setting and with the site’s own reduced-motion setting.',
    display: 'Display sizes are set in Hanken Grotesk 650 with tight tracking: 44 to 88 px for a hero, 38 to 72 px for a page title.',
    serif: 'Fraunces is for the wordmark and an occasional phrase or quote. Never a whole page of headings.',
    mono: 'Mono figures are for times, gates, codes and amounts.',
    sample: 'Sample',
  },
  samples: {
    heroTitle: 'Every journey, beautifully connected',
    heroLead: 'Live flights, your airport and every step from the kerb to the gate.',
    heroAction: 'Track a flight',
    heroSecondary: 'Explore airports',
    cardEyebrow: 'KLIA Terminal 1',
    cardTitle: 'A rainforest inside the terminal',
    cardBody: 'A calm walk among the trees before you board.',
    card2Eyebrow: 'Guide',
    card2Title: 'Your first time at KLIA',
    card3Eyebrow: 'Shop and dine',
    card3Title: 'Local flavours, airside',
    glassTitle: 'Next departure',
    glassBody: 'Boarding from gate C12 at 14:05.',
    scrimText: 'White text over a white photograph',
    bottom: 'Bottom scrim',
    left: 'Content scrim, beside the words',
    glassAuto: 'Theme glass',
    glassDark: 'Midnight glass',
    sizes: 'sm 24 · md 32 · lg 40',
  },
};

type Copy = typeof en;

const ms: Copy = {
  eyebrow: 'Sistem reka bentuk · Hala tuju v2',
  title: 'Premium, kemas, dan dibina untuk perjalanan',
  lead: 'Biru tengah malam dengan sentuhan emas, fotografi sebenar, huruf besar yang yakin dan kawalan seperti aplikasi. Setiap token dan komponen di sebalik halaman, dengan kontras yang diukur dalam setiap tema.',
  heroNote: 'Imej contoh sintetik. Pustaka fotografi membekalkan gambar sebenar.',
  stats: { pairs: 'Pasangan warna diukur', themes: 'Tema dan skop', lowest: 'Kontras teks terendah' },
  sections: {
    media: 'Fotografi, kaca dan media',
    flight: 'Status penerbangan',
  },
  intro: {
    colour: 'Biru tengah malam ialah asasnya, emas digunakan dengan berhemat, permukaan putih dan kelabu sejuk, dan warna status ditala untuk penerbangan. Setiap sampel menunjukkan nilai cerah dan gelapnya.',
    contrast: 'Setiap pasangan teks dan sempadan, diukur dalam setiap tema, termasuk teks di atas kaca dan lapisan gelap yang digabungkan pada gambar putih dan gambar hitam. Teks memerlukan 4.5:1, sempadan dan fokus 3:1.',
    type: 'Hanken Grotesk untuk tajuk yang besar dan yakin serta seluruh antara muka; Fraunces untuk tanda nama dan aksen editorial yang jarang; Geist Mono untuk masa, pintu dan kod.',
    layout: 'Ruang yang lapang, bucu lembut dari 12 hingga 28 px, bayang berlapis, dan gerakan yang licin dan pendek yang dimatikan apabila gerakan dikurangkan.',
    media:
      'Fotografi penuh di sebalik lapisan gelap, panel kaca beku dan media berbucu bulat. Perkataan di atas gambar sentiasa berada pada lapisan gelap atau panel kaca, jadi ia mencapai 4.5:1 walaupun di atas gambar putih.',
    flight: 'Tujuh ton yang ditala untuk status penerbangan, sebagai pil lembut dan padu, mudah dibaca pada latar cerah, gelap dan papan. Perkataan dan ikon atau titik sentiasa membawa maksudnya, bukan warna sahaja.',
  },
  groups: {
    surfaces: 'Permukaan dan isian',
    brand: 'Tengah malam dan jenama',
    accents: 'Emas, daun dan fokus',
    flightTones: 'Ton status penerbangan',
    glass: 'Kaca di atas gambar',
    media: 'Teks di atas gambar',
    flight: 'Status penerbangan',
    scrims: 'Lapisan gelap: kes paling sukar',
    hero: 'Media utama',
    mediaCards: 'Kad media',
    cardMedia: 'Kad dengan slot imej',
    glassPanels: 'Panel kaca',
    pills: 'Pil status',
    mapping: 'Daripada model penerbangan',
    radii: 'Jejari',
    elevation: 'Ketinggian',
    motion: 'Gerakan',
    serif: 'Serif editorial',
  },
  notes: {
    gold: 'Emas ialah aksen, bukan status: satu tindakan atau garis emas bagi setiap paparan.',
    focus: 'Gelang fokus berwarna orkid, bukan warna jenama atau status; di atas media ia menjadi orkid cerah.',
    scrims: 'Zon teks setiap lapisan gelap memegang 78 % biru tengah malam, jadi teks putih mencapai 4.5:1 di atas gambar putih sepenuhnya. Di luarnya gambar kekal jelas.',
    worstCase: 'Imej ujian sintetik: medan putih yang terang, kes paling sukar untuk teks cerah.',
    glass: 'Kaca ialah hiasan di atas isian yang kuat: 84 % permukaan (tema) atau 72 % tengah malam (gelap). Ia menjadi padu apabila ketelusan dikurangkan, tanpa backdrop-filter, dan dalam kontras tinggi.',
    pills: 'Lembut untuk senarai dan papan; padu untuk satu status yang paling penting pada sesuatu paparan (panggilan terakhir).',
    mapping: 'Setiap status model penerbangan dan pil yang dipaparkan. Papan mengekalkan cipnya sendiri sehingga pereka halaman memindahkannya.',
    motion: 'Angkatan dan zum imej menggunakan varian motion-ok: dimatikan oleh tetapan sistem dan oleh tetapan gerakan dikurangkan laman ini.',
    display: 'Saiz paparan menggunakan Hanken Grotesk 650 dengan jarak huruf yang rapat: 44 hingga 88 px untuk bahagian utama, 38 hingga 72 px untuk tajuk halaman.',
    serif: 'Fraunces untuk tanda nama dan frasa atau petikan sekali-sekala. Bukan untuk semua tajuk halaman.',
    mono: 'Angka mono untuk masa, pintu, kod dan jumlah.',
    sample: 'Contoh',
  },
  samples: {
    heroTitle: 'Setiap perjalanan, terhubung dengan indah',
    heroLead: 'Penerbangan langsung, lapangan terbang anda dan setiap langkah dari tepi jalan ke pintu berlepas.',
    heroAction: 'Jejak penerbangan',
    heroSecondary: 'Teroka lapangan terbang',
    cardEyebrow: 'KLIA Terminal 1',
    cardTitle: 'Hutan hujan di dalam terminal',
    cardBody: 'Berjalan dengan tenang di antara pokok sebelum anda menaiki pesawat.',
    card2Eyebrow: 'Panduan',
    card2Title: 'Kali pertama anda di KLIA',
    card3Eyebrow: 'Beli-belah dan makan',
    card3Title: 'Rasa tempatan, di kawasan berlepas',
    glassTitle: 'Penerbangan seterusnya',
    glassBody: 'Menaiki pesawat dari pintu C12 pada 14:05.',
    scrimText: 'Teks putih di atas gambar putih',
    bottom: 'Lapisan gelap bawah',
    left: 'Lapisan gelap kandungan, di sebelah perkataan',
    glassAuto: 'Kaca tema',
    glassDark: 'Kaca tengah malam',
    sizes: 'sm 24 · md 32 · lg 40',
  },
};

export type DsCopy = Copy;

export function dsCopy(lang: Lang): DsCopy {
  return lang === 'ms' ? ms : en;
}

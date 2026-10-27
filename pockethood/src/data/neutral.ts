// Neutral behaviour data that templates run when no module dresses a building (and when a
// module is switched off). Bilingual so the fallback is never English-only.
import type { LText } from '../platform/content/schema';

export const CORE_QUIZ: { topic: LText; dailyLimit: number; questions: { id: string; prompt: LText; choices: LText[]; answer: number; explain: LText }[] } = {
  topic: { en: 'Curious Minds', ms: 'Minda Ingin Tahu' },
  dailyLimit: 3,
  questions: [
    { id: 'spider_legs', prompt: { en: 'How many legs does a spider have?', ms: 'Berapakah bilangan kaki labah-labah?' }, choices: ['6', '8', '10'], answer: 1, explain: { en: 'Spiders are arachnids: eight legs. Insects have six.', ms: 'Labah-labah ialah araknid: lapan kaki. Serangga ada enam.' } },
    { id: 'planet', prompt: { en: 'Which planet do we live on?', ms: 'Kita tinggal di planet mana?' }, choices: [{ en: 'Mars', ms: 'Marikh' }, { en: 'Earth', ms: 'Bumi' }, { en: 'Venus', ms: 'Zuhrah' }], answer: 1, explain: { en: 'Earth is the third planet from the Sun.', ms: 'Bumi ialah planet ketiga dari Matahari.' } },
    { id: 'times_7_6', prompt: { en: 'What is 7 × 6?', ms: 'Berapakah 7 × 6?' }, choices: ['36', '42', '48'], answer: 1, explain: { en: '7 × 6 = 42.', ms: '7 × 6 = 42.' } },
    { id: 'mammal', prompt: { en: 'Which of these is a mammal?', ms: 'Yang manakah mamalia?' }, choices: [{ en: 'Shark', ms: 'Jerung' }, { en: 'Dolphin', ms: 'Ikan lumba-lumba' }, { en: 'Octopus', ms: 'Sotong kurita' }], answer: 1, explain: { en: 'Dolphins breathe air and feed their young milk.', ms: 'Ikan lumba-lumba bernafas dengan paru-paru dan menyusukan anak.' } },
    { id: 'freeze', prompt: { en: 'At what temperature does water freeze?', ms: 'Pada suhu berapakah air membeku?' }, choices: ['0 °C', '10 °C', '100 °C'], answer: 0, explain: { en: 'Pure water freezes at 0 °C and boils at 100 °C (at sea level).', ms: 'Air tulen membeku pada 0 °C dan mendidih pada 100 °C (di aras laut).' } },
    { id: 'leap_year', prompt: { en: 'How many days are in a leap year?', ms: 'Berapakah bilangan hari dalam tahun lompat?' }, choices: ['364', '365', '366'], answer: 2, explain: { en: 'A leap year adds 29 February: 366 days.', ms: 'Tahun lompat menambah 29 Februari: 366 hari.' } },
    { id: 'breathe', prompt: { en: 'Which gas do our bodies need from the air?', ms: 'Gas apakah yang badan kita perlukan daripada udara?' }, choices: [{ en: 'Oxygen', ms: 'Oksigen' }, { en: 'Helium', ms: 'Helium' }, { en: 'Neon', ms: 'Neon' }], answer: 0, explain: { en: 'We breathe in oxygen and breathe out carbon dioxide.', ms: 'Kita menyedut oksigen dan menghembus karbon dioksida.' } },
    { id: 'triangle', prompt: { en: 'Which shape has three sides?', ms: 'Bentuk manakah mempunyai tiga sisi?' }, choices: [{ en: 'Square', ms: 'Segi empat sama' }, { en: 'Triangle', ms: 'Segi tiga' }, { en: 'Circle', ms: 'Bulatan' }], answer: 1, explain: { en: 'Tri- means three.', ms: '“Tiga” sisi — segi tiga!' } },
    { id: 'ocean', prompt: { en: 'Which is the largest ocean on Earth?', ms: 'Lautan manakah yang terbesar di Bumi?' }, choices: [{ en: 'Atlantic', ms: 'Atlantik' }, { en: 'Indian', ms: 'Hindi' }, { en: 'Pacific', ms: 'Pasifik' }], answer: 2, explain: { en: 'The Pacific covers about a third of the planet.', ms: 'Lautan Pasifik meliputi kira-kira satu pertiga planet.' } },
    { id: 'minutes', prompt: { en: 'How many minutes are in an hour?', ms: 'Berapakah minit dalam satu jam?' }, choices: ['30', '60', '100'], answer: 1, explain: { en: 'Sixty minutes make an hour.', ms: 'Enam puluh minit ialah satu jam.' } },
    { id: 'bees', prompt: { en: 'How do bees help flowers?', ms: 'Bagaimanakah lebah membantu bunga?' }, choices: [{ en: 'They carry pollen', ms: 'Membawa debunga' }, { en: 'They eat the leaves', ms: 'Memakan daun' }, { en: 'They dig the soil', ms: 'Menggali tanah' }], answer: 0, explain: { en: 'Moving pollen between flowers helps plants make seeds.', ms: 'Debunga yang dibawa antara bunga membantu tumbuhan menghasilkan biji.' } },
    { id: 'sun', prompt: { en: 'What is the Sun?', ms: 'Apakah Matahari?' }, choices: [{ en: 'A planet', ms: 'Sebuah planet' }, { en: 'A star', ms: 'Sebutir bintang' }, { en: 'A moon', ms: 'Sebuah bulan' }], answer: 1, explain: { en: 'The Sun is a star — the closest one to us.', ms: 'Matahari ialah bintang — yang paling dekat dengan kita.' } },
  ],
};

export const CORE_SHOWROOM = {
  slots: 3,
  models: ['sedan', 'suv', 'hatchback_sports', 'van'],
  paints: [
    { id: 'pearl', name: { en: 'Pearl', ms: 'Mutiara' } as LText, hex: '#f3efe6' },
    { id: 'sky', name: { en: 'Sky Blue', ms: 'Biru Langit' } as LText, hex: '#7fb8e6' },
    { id: 'coral', name: { en: 'Coral', ms: 'Batu Karang' } as LText, hex: '#ef7a5e' },
    { id: 'leaf', name: { en: 'Leaf Green', ms: 'Hijau Daun' } as LText, hex: '#7dbb6a' },
  ],
};

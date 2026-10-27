// Bahasa Melayu names for the neutral core content (buildings, goods, recipes, achievements).
// World packs override most of these with their own localised names; this keeps everything
// they don't override (decorations, keepsakes, core-world shops) readable in Malay.

interface Overlay {
  buildings: Record<string, { name?: string; description?: string; perks?: string[][] }>;
  items: Record<string, { name: string; description: string }>;
  recipes: Record<string, string>;
  achievements: Record<string, { name: string; description: string }>;
  expansionNames: string[];
  levelUnlocks: Record<number, string[]>;
  levelDefault: string;
}

const deco = (name: string, description: string, charm: number) => ({ name, description, perks: [[`+${charm} seri`]] });

export const CORE_OVERLAY_MS: Overlay = {
  buildings: {
    starter_house: { name: 'Rumah Pertama', description: 'Rumah pertama anda di kejiranan ini. Kutip sewa dari peti surat.', perks: [['Sewa: 6 syiling / minit'], ['Sewa: 9 syiling / minit', 'Anjung depan dengan kotak bunga'], ['Sewa: 14 syiling / minit', 'Tingkap loteng & tanglung taman']] },
    cottage: { name: 'Kotej', description: 'Rumah selesa yang membawa jiran baharu ke kejiranan.', perks: [['Sewa: 8 syiling / minit'], ['Sewa: 12 syiling / minit', 'Taman berpagar kayu']] },
    townhouse: { name: 'Rumah Bandar', description: 'Rumah tinggi yang anggun untuk kejiranan yang semakin membesar.', perks: [['Sewa: 15 syiling / minit'], ['Sewa: 22 syiling / minit', 'Taman atas bumbung']] },
    cafe: { name: 'Kafe Mia', description: 'Membancuh kopi untuk seluruh kejiranan.', perks: [['Bancuh Kopi', '2 slot pengeluaran'], ['Resipi baharu: Set Sarapan', '3 slot pengeluaran', 'Teres luar dengan payung'], ['Bancuh 25% lebih pantas', '4 slot pengeluaran', 'Awning berjalur & lampu hiasan']] },
    bakery: { name: 'Kedai Roti', description: 'Roti segar setiap pagi — dan pai, jika anda membantu.', perks: [['Bakar Roti', '2 slot pengeluaran'], ['Resipi baharu: Pai Beri', '3 slot pengeluaran', 'Tingkap pameran pastri'], ['Bakar 25% lebih pantas', 'Cerobong ketuhar bata']] },
    garden: { name: 'Kebun Komuniti', description: 'Batas tanaman yang menumbuhkan bunga dan beri untuk semua.', perks: [['Tanam Bunga & Beri', '2 slot pengeluaran'], ['Tanaman baharu: Sayur', '3 slot pengeluaran', 'Rangka rumah hijau'], ['Tumbuh 30% lebih pantas', 'Bunga matahari & orang-orang']] },
    flower_shop: { name: 'Kedai Bunga', description: 'Mengubah bunga kebun menjadi jambangan dan kalungan.', perks: [['Ikat Jambangan', '2 slot pengeluaran'], ['Resipi baharu: Mahkota Bunga', 'Kereta sorong bunga di hadapan']] },
    workshop: { name: 'Bengkel', description: 'Menggergaji papan dan membakar bata — bahan untuk setiap naik taraf.', perks: [['Gergaji Papan, buat Perabot', '2 slot pengeluaran'], ['Resipi baharu: Bata', '3 slot pengeluaran', 'Laman kayu balak'], ['Kraf 30% lebih pantas', 'Kren & timbunan kayu']] },
    grocery: { name: 'Kedai Runcit', description: 'Gerai pasar dengan bakul, jem dan hasil tempatan.', perks: [['Bungkus bakul & jem', 'Pendapatan kedai: 10 syiling / minit'], ['Pendapatan kedai: 16 syiling / minit', 'Gerai buah di luar']] },
    showroom: { name: 'Bilik Pameran Kereta', description: 'Bilik pameran kaca yang terang. Susun kereta pameran; pelawat datang melihat.', perks: [['Susun 2 ruang pameran', 'Pelawat: 9 syiling / minit'], ['3 ruang pameran', 'Pelawat: 14 syiling / minit', 'Panji-panji & tiang bendera']] },
    learning_centre: { name: 'Pusat Pembelajaran', description: 'Pusat pembelajaran mesra dengan kuiz harian untuk minda yang ingin tahu.', perks: [['Kuiz harian: 3 soalan', '+6 seri'], ['Kuiz harian: 5 soalan', 'Sudut bacaan & rak buku']] },
    park: { name: 'Taman Mini', description: 'Dataran rimbun tempat penduduk berehat dan pelawat memberi tip.', perks: [['Penduduk berehat di sini', 'Tip: 7 syiling / minit', '+10 seri'], ['Tip: 11 syiling / minit', 'Gazebo untuk acara']] },
    town_hall: { name: 'Dewan Bandaran', description: 'Nadi kejiranan. Menambah satu slot pesanan.', perks: [['+1 slot pesanan kejiranan', 'Pendapatan sivik: 20 syiling / minit'], ['Menara jam & panji-panji', 'Pendapatan sivik: 30 syiling / minit']] },
    request_board: { name: 'Papan Pesanan', description: 'Jiran menampal permintaan mereka di sini.' },
    welcome_sign: { name: 'Papan Selamat Datang', description: 'Selamat datang ke kejiranan!' },
    pond: { name: 'Kolam Teratai', description: 'Kolam tenang dengan daun teratai.' },
    fountain: { name: 'Air Pancut Kejiranan', description: 'Dibina bersama melalui projek komuniti.' },
    path: { name: 'Laluan Batu', description: 'Penduduk suka berjalan di atas laluan.', perks: [['']] },
    tree_round: deco('Pokok Rimbun', 'Pokok berdaun yang ceria.', 2),
    tree_pine: deco('Pokok Pain', 'Malar hijau dan tinggi.', 2),
    tree_autumn: deco('Pokok Mapel', 'Daun keemasan sepanjang tahun.', 3),
    bush: deco('Pokok Renek', 'Pokok renek bulat yang kemas.', 1),
    flower_bed: deco('Batas Bunga', 'Sepetak bunga berwarna-warni.', 2),
    bench: deco('Bangku Taman', 'Penduduk duduk dan bersembang di sini.', 3),
    lamp: deco('Lampu Jalan', 'Bercahaya hangat pada waktu malam.', 3),
    fence: deco('Pagar Kayu', 'Pagar kayu desa.', 1),
    planter: deco('Kotak Tanaman', 'Kotak kayu berisi herba.', 2),
    rock: deco('Batu Taman', 'Batu besar berlumut.', 1),
    mushroom: deco('Cendawan', 'Seri cerita dongeng.', 1),
    barrels: deco('Tong Kayu', 'Simpanan desa.', 1),
    crate: deco('Peti Hasil', 'Hasil segar dipamerkan.', 1),
    mailbox: deco('Peti Surat', 'Surat dihantar ke sini.', 1),
    parasol: deco('Payung Kafe', 'Hadiah tanda terima kasih.', 4),
    birdbath: deco('Kolam Burung', 'Kenang-kenangan: burung sangat menyukainya.', 4),
    pie_stand: deco('Meja Kuih', 'Meja jualan amal.', 4),
    festival_arch: deco('Gerbang Bunga', 'Ganjaran pesta bunga.', 8),
    lantern_string: deco('Tiang Tanglung', 'Tiang dengan tanglung yang hangat.', 5),
    statue: deco('Tugu Pengasas', 'Meraikan mercu tanda pertama anda.', 10),
    picnic_set: deco('Set Berkelah', 'Dari kelah pembukaan taman poket.', 6),
    market_stall: deco('Gerai Pasar', 'Gerai kecil seperti di pasar dataran.', 8),
    kite_post: deco('Tiang Wau', 'Wau dari hari pembukaan taman permainan.', 6),
    telescope: deco('Teleskop', 'Untuk melihat bintang, seperti di tempat tinjau.', 8),
    spot_park: { name: 'Taman Poket', description: 'Sudut semak yang jiran-jiran mahu jadikan taman kecil.' },
    spot_plaza: { name: 'Dataran Komuniti', description: 'Dataran kosong yang boleh menjadi tempat semua orang berjumpa.' },
    spot_playground: { name: 'Taman Permainan', description: 'Tanah lapang dengan ruang untuk buaian, gelongsor dan kotak pasir.' },
    spot_lookout: { name: 'Tempat Tinjau Senja', description: 'Bukit kecil yang tenang dengan pemandangan langit petang terbaik.' },
  },
  items: {
    coffee: { name: 'Kopi', description: 'Segar dari mesin kopi.' },
    bread: { name: 'Roti', description: 'Sebuku roti yang hangat.' },
    flowers: { name: 'Bunga', description: 'Bunga kebun yang ceria.' },
    berries: { name: 'Beri', description: 'Beri manis yang masak.' },
    vegetables: { name: 'Sayur', description: 'Lobak dan sayur hijau yang rangup.' },
    breakfast: { name: 'Set Sarapan', description: 'Kopi dan roti bakar — permulaan yang sempurna.' },
    berry_pie: { name: 'Pai Beri', description: 'Resipi rahsia keluarga.' },
    bouquet: { name: 'Jambangan', description: 'Diikat dengan tangan.' },
    flower_crown: { name: 'Mahkota Bunga', description: 'Wajib untuk pesta.' },
    planks: { name: 'Papan', description: 'Bahan binaan untuk naik taraf.' },
    bricks: { name: 'Bata', description: 'Bahan binaan yang kukuh.' },
    furniture: { name: 'Perabot', description: 'Kerusi buatan tangan.' },
    veggie_basket: { name: 'Bakul Sayur', description: 'Bakul pasar yang penuh.' },
    jam: { name: 'Jem Beri', description: 'Sapu pada apa sahaja.' },
  },
  recipes: {
    coffee: 'Kopi', breakfast: 'Set Sarapan', bread: 'Roti', berry_pie: 'Pai Beri', flowers: 'Bunga', berries: 'Beri', vegetables: 'Sayur',
    bouquet: 'Jambangan', flower_crown: 'Mahkota Bunga', planks: 'Papan', bricks: 'Bata', furniture: 'Perabot', veggie_basket: 'Bakul Sayur', jam: 'Jem Beri',
  },
  achievements: {
    first_build: { name: 'Pecah Tanah', description: 'Siapkan bangunan pertama anda.' },
    first_upgrade: { name: 'Tukang Baik Pulih', description: 'Naik taraf sebuah bangunan.' },
    first_delivery: { name: 'Penghantaran Istimewa', description: 'Siapkan pesanan pertama anda.' },
    decor_10: { name: 'Pereka Laman', description: 'Letakkan 10 hiasan.' },
    friend_first: { name: 'Sehati Sejiwa', description: 'Berkawan dengan seorang penduduk.' },
    expand_1: { name: 'Perintis', description: 'Buka sebidang tanah baharu.' },
    produce_50: { name: 'Lebah Rajin', description: 'Kutip 50 barangan.' },
    produce_250: { name: 'Industri Tempatan', description: 'Kutip 250 barangan.' },
    orders_25: { name: 'Tiang Komuniti', description: 'Siapkan 25 pesanan.' },
    photo_1: { name: 'Senyum!', description: 'Ambil gambar kejiranan anda.' },
    landmark: { name: 'Dibina Bersama', description: 'Siapkan mercu tanda komuniti.' },
    story_3: { name: 'Pencerita', description: 'Siapkan 3 bab cerita penduduk.' },
  },
  expansionNames: ['Padang', 'Dusun', 'Tepi Anak Sungai', 'Puncak Bukit', 'Lorong Kilang', 'Hujung Willow', 'Sudut Cerah', 'Oak Tua', 'Tepi Sungai', 'Lorong Tanglung', 'Petak Semanggi', 'Lembah Musang'],
  levelUnlocks: {
    1: ['Rumah Pertama', 'Kafe', 'Laluan, pokok & batas bunga'],
    2: ['Kedai Roti', 'Kebun Komuniti', 'Bangku & lampu jalan'],
    3: ['Bengkel', 'Kedai Bunga', 'Kotej', 'Pusat Pembelajaran', 'Projek komuniti'],
    4: ['Taman Mini', 'Bilik Pameran Kereta', 'Buka tanah baharu', 'Pesta bermusim'],
    5: ['Kedai Runcit'],
    6: ['Rumah Bandar'],
    7: ['Dewan Bandaran'],
    8: ['Kebun Komuniti kedua'],
    9: ['Lebih banyak tanah'],
    10: ['Naik taraf Dewan Bandaran'],
  },
  levelDefault: 'Ganjaran pesanan lebih besar',
};

/**
 * Interface copy for: the photo credits page (`/[lang]/credits`).
 * Owned by the photography work of the visual redesign. Only that work edits this file.
 *
 * Read in Server Components as `t('creditsPages.<key>')` (getT(lang)). The page has no Client
 * Component that reads it, so the namespace is in `SCOPED_NAMESPACES` and never rides along in
 * the root dictionary. `creditsPagesMs` must have exactly the same keys as `creditsPagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Facts about each photograph (author, licence, source, alt text) live in `src/content/images.ts`.
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const creditsPagesEn = {
  title: 'Photo credits',
  metaDescription: 'Who took the photographs on this site, the licence each one is used under, and where to find the original.',
  lead: 'The photographs on this concept site come from Wikimedia Commons and are used under free licences. Each one is listed here with its photographer, licence and source.',
  notOfficial: 'These are not Malaysia Airports’ own photographs, and their photographers have no link with this prototype. A production site would use photography licensed by Malaysia Airports.',
  count: { one: '{count} photograph', other: '{count} photographs' },
  empty: 'This site does not show any photographs yet. When it does, each one will be listed here with its photographer, licence and source.',
  author: 'Photographer',
  licence: 'Licence',
  source: 'Original on Wikimedia Commons',
  changes: 'Changes',
  modified: {
    resized: 'Resized, colour-graded and compressed',
    cropped: 'Cropped, resized, colour-graded and compressed',
  },
  groups: {
    klia: 'KLIA Terminal 1',
    klia2: 'KLIA Terminal 2',
    aircraft: 'Aircraft and airside',
    rail: 'KLIA Ekspres',
    penang: 'Penang',
    sabah: 'Kota Kinabalu and Sabah',
    langkawi: 'Langkawi',
    kuching: 'Kuching and Sarawak',
    kualaLumpur: 'Kuala Lumpur',
    food: 'Malaysian food',
    travel: 'Travel',
  },
  reuse: {
    heading: 'Using these photographs',
    body: 'You may reuse any of them under the licence shown, which allows commercial use. Credit the photographer as listed, link to the licence, and say if you changed the image. Under a ShareAlike licence, share your version under the same licence.',
    changesBody: 'The versions on this site are resized to at most 2,560 pixels on the long edge, given one light colour grade so the set looks consistent (a little warmth, softer highlights, even contrast), compressed and stripped of camera data; where a photo is cropped, the list says so. The originals are on Wikimedia Commons.',
    replace: 'Malaysia Airports can replace these with its own photography without changing any page: every photograph and its credit is defined in one place.',
  },
};

export const creditsPagesMs: typeof creditsPagesEn = {
  title: 'Kredit foto',
  metaDescription: 'Siapa yang mengambil gambar di laman ini, lesen bagi setiap gambar, dan tempat untuk melihat gambar asal.',
  lead: 'Gambar di laman konsep ini diambil dari Wikimedia Commons dan digunakan di bawah lesen bebas. Setiap gambar disenaraikan di sini bersama jurugambar, lesen dan sumbernya.',
  notOfficial: 'Gambar ini bukan milik Malaysia Airports, dan jurugambarnya tiada kaitan dengan prototaip ini. Laman sebenar akan menggunakan gambar yang dilesenkan oleh Malaysia Airports.',
  count: { one: '{count} gambar', other: '{count} gambar' },
  empty: 'Laman ini belum memaparkan sebarang gambar. Apabila ada, setiap gambar akan disenaraikan di sini bersama jurugambar, lesen dan sumbernya.',
  author: 'Jurugambar',
  licence: 'Lesen',
  source: 'Gambar asal di Wikimedia Commons',
  changes: 'Perubahan',
  modified: {
    resized: 'Saiz diubah, warna dilaraskan dan dimampatkan',
    cropped: 'Dipangkas, saiz diubah, warna dilaraskan dan dimampatkan',
  },
  groups: {
    klia: 'KLIA Terminal 1',
    klia2: 'KLIA Terminal 2',
    aircraft: 'Pesawat dan kawasan apron',
    rail: 'KLIA Ekspres',
    penang: 'Pulau Pinang',
    sabah: 'Kota Kinabalu dan Sabah',
    langkawi: 'Langkawi',
    kuching: 'Kuching dan Sarawak',
    kualaLumpur: 'Kuala Lumpur',
    food: 'Makanan Malaysia',
    travel: 'Perjalanan',
  },
  reuse: {
    heading: 'Menggunakan gambar ini',
    body: 'Anda boleh menggunakan semula mana-mana gambar ini di bawah lesen yang ditunjukkan, termasuk untuk tujuan komersial. Nyatakan nama jurugambar seperti yang disenaraikan, pautkan kepada lesen, dan nyatakan jika anda mengubah gambar itu. Bagi lesen ShareAlike, kongsi versi anda di bawah lesen yang sama.',
    changesBody: 'Versi di laman ini diubah saiznya kepada paling banyak 2,560 piksel pada sisi panjang, diberi satu pelarasan warna yang ringan supaya set ini kelihatan seragam (sedikit kehangatan, bahagian terang yang lebih lembut, kontras yang sekata), dimampatkan dan dibuang data kameranya; jika gambar dipangkas, senarai ini menyatakannya. Gambar asal ada di Wikimedia Commons.',
    replace: 'Malaysia Airports boleh menggantikan gambar ini dengan gambarnya sendiri tanpa mengubah mana-mana halaman: setiap gambar dan kreditnya ditetapkan di satu tempat.',
  },
};

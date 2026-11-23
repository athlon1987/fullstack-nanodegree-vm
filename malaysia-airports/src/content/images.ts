/**
 * The photo library of the visual redesign: every photograph the site shows, with its size,
 * alt text in both languages, where it is, a focal point, a blur placeholder and its credit.
 *
 * Source: Wikimedia Commons, free licences only (CC0, public domain, CC BY 2.0 to 4.0,
 * CC BY-SA 2.0 to 4.0). Selection, licence rules, rejected candidates and how to swap in
 * Malaysia Airports' own photography: `docs/design/photography.md`. Every photo is credited on
 * `/[lang]/credits`, which reads this file. `images.test.ts` checks the files, sizes, licences,
 * credits, alt text and that no airport is shown with another airport's photo.
 *
 * STATUS: 30 photographs from Wikimedia Commons, chosen, licence-checked and processed on
 * 22 November 2026, and colour-graded as one set on 23 November 2026 (redesign 1c). What was
 * chosen and rejected, and why, and the grade: docs/design/photography.md.
 *
 * Every lookup can come back empty (`undefined`, or an empty list), so a page must always have
 * a designed treatment without a photo (a solid or gradient panel with the same reserved size).
 * That keeps pages right while the library is empty, and if a photo is ever withdrawn.
 *
 * Use from Server Components and pass the one `SiteImage` you need to a Client Component as a
 * prop: the blur placeholders make this module about 1 KB per photo.
 *
 *   const hero = heroForAirport(airport.slug);
 *   hero ? <Image src={hero.src} width={hero.width} height={hero.height} alt={hero.alt[lang]}
 *     placeholder="blur" blurDataURL={hero.blurDataURL} style={{ objectPosition: objectPosition(hero) }} />
 *     : <div className="bg-…" />
 *
 * Entries are written by the research procedure in `docs/design/photography.md` from the chosen
 * files, then reviewed by hand: edit alt text and focal points freely, but keep `width` and
 * `height` equal to the file's (the test checks).
 */

/** Where a photo was taken: an airport (its slug) or `my` for Malaysia in general. */
export type ImagePlace = 'kul' | 'pen' | 'bki' | 'lgk' | 'kch' | 'my';

/** What a photo shows, so a page can ask for the right kind of image. */
export type ImageSubject = 'terminal' | 'airside' | 'aircraft' | 'rail' | 'destination' | 'food' | 'interior' | 'atmosphere';

/** Groups on the credits page, in this order (copy in `creditsPages.groups`). */
export const IMAGE_GROUPS = ['klia', 'klia2', 'aircraft', 'rail', 'penang', 'sabah', 'langkawi', 'kuching', 'kualaLumpur', 'food', 'travel'] as const;
export type ImageGroup = (typeof IMAGE_GROUPS)[number];

/** The only licences the library accepts. Never NC, ND, GFDL-only, fair use or unclear. */
export const ALLOWED_LICENCES = ['CC0 1.0', 'Public domain', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0', 'CC BY-SA 2.0', 'CC BY-SA 2.5', 'CC BY-SA 3.0', 'CC BY-SA 4.0'] as const;
export type ImageLicence = (typeof ALLOWED_LICENCES)[number];

export interface ImageCredit {
  /** The author as the Commons file credits them, without markup. */
  author: string;
  licence: ImageLicence;
  /** The licence deed (or the public-domain mark). */
  licenceUrl: string;
  /** The file page on Wikimedia Commons. */
  sourceUrl: string;
  /**
   * What we changed: every file is resized, colour-graded and compressed; some are also cropped.
   * Redesign 1c: the whole library carries one subtle grade (slight warmth, controlled highlights,
   * consistent contrast; `docs/design/photography.md`, "Colour grade"), so every value says so.
   */
  modified: 'resized and colour-graded' | 'cropped, resized and colour-graded';
  /** The crop, in words, when there is one. */
  crop?: string;
}

export interface SiteImage {
  id: string;
  /** Public path, served through `next/image` (AVIF/WebP at the sizes the page asks for). */
  src: `/images/${string}.jpg`;
  /** Pixel size of the file, for `next/image` and to reserve the space (no layout shift). */
  width: number;
  height: number;
  /** Says exactly what and where the photo is. */
  alt: { en: string; ms: string };
  place: ImagePlace;
  subject: ImageSubject;
  group: ImageGroup;
  /** The point to keep in view when the photo is cropped by `object-fit: cover`, 0 to 1. */
  focal: { x: number; y: number };
  /** A 16 px wide JPEG as a data URL, for `placeholder="blur"`. */
  blurDataURL: string;
  credit: ImageCredit;
}

const DATA = {
  'klia-t1-canopy': {
    src: '/images/klia/terminal-1-canopy.jpg',
    width: 2560,
    height: 1229,
    alt: {
      en: 'White branching columns under the timber-lined roof above the C gates at KLIA Terminal 1, Sepang',
      ms: 'Tiang putih bercabang di bawah bumbung berlapik kayu di kawasan pintu C, KLIA Terminal 1, Sepang',
    },
    place: 'kul',
    subject: 'terminal',
    group: 'klia',
    focal: { x: 0.62, y: 0.45 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAQF/8QAHxAAAgICAQUAAAAAAAAAAAAAAQMAAhESBSEyYcHw/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAWEQEBAQAAAAAAAAAAAAAAAAABAAL/2gAMAwEAAhEDEQA/AMtaWitK6HIORYDtI9SpPEOczNVkjboPHxiJMJ60l//Z',
    credit: {
      author: 'Eugene Ormandy',
      licence: 'CC0 1.0',
      licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_International_Airport_20240509.jpg',
      modified: 'cropped, resized and colour-graded',
      crop: 'Cropped to the upper 64 percent of the frame (the roof and columns), leaving out the walkway, passengers and construction hoardings below.',
    },
  },
  'klia-t1-aerial': {
    src: '/images/klia/terminal-1-aerial.jpg',
    width: 2560,
    height: 1707,
    alt: {
      en: 'KLIA Terminal 1 from the air: the main terminal roof and the gate building, with aircraft parked alongside, Sepang',
      ms: 'KLIA Terminal 1 dilihat dari udara: bumbung terminal utama dan bangunan pintu berlepas, dengan pesawat di sisinya, Sepang',
    },
    place: 'kul',
    subject: 'terminal',
    group: 'klia',
    focal: { x: 0.62, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAwQFBv/EACEQAAIBAwMFAAAAAAAAAAAAAAECAwAEERMhMRIiQlGh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAf/EABYRAQEBAAAAAAAAAAAAAAAAAAEAAv/aAAwDAQACEQMRAD8AAZpwC6xXGmPLIA+mm7fUuTiNpSAO5gwIB9Vn7OaR3ZncsTz1b1Vt5XDLhiN+BtQbZMl//9k=',
    credit: {
      author: 'Yu Chu Chin',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aerial_photograph_of_Malaysia_on_15_January_2026_-_02.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'klia-t1-roof': {
    src: '/images/klia/terminal-1-roof.jpg',
    width: 1920,
    height: 1440,
    alt: {
      en: 'Curved roof canopies on tapered columns along the outside of the KLIA Terminal 1 main building, Sepang',
      ms: 'Kanopi bumbung melengkung di atas tiang tirus di luar bangunan utama KLIA Terminal 1, Sepang',
    },
    place: 'kul',
    subject: 'terminal',
    group: 'klia',
    focal: { x: 0.35, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgQH/8QAJBAAAgEEAQIHAAAAAAAAAAAAAQIDAAQSIQURQRMWIjFRkaH/xAAVAQEBAAAAAAAAAAAAAAAAAAABAv/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwA5avLx92pijxuACFZjpe3UfRrRePDW/GwB5/EJXJncbYndBHRXsoZG24hy6/Jy71X5nv8AEKFgAA16Pb9oTX//2Q==',
    credit: {
      author: 'Descon7',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:KLIA_Main_terminal.JPG',
      modified: 'resized and colour-graded',
    },
  },
  'klia-t1-airfield': {
    src: '/images/klia/terminal-1-airfield.jpg',
    width: 1920,
    height: 1011,
    alt: {
      en: 'The roofline of KLIA Terminal 1 seen across the airfield, with forested hills behind, Sepang',
      ms: 'Garis bumbung KLIA Terminal 1 dilihat dari seberang lapangan terbang, berlatarkan bukit berhutan, Sepang',
    },
    place: 'kul',
    subject: 'terminal',
    group: 'klia',
    focal: { x: 0.45, y: 0.6 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAEF/8QAHxAAAQQABwAAAAAAAAAAAAAAAQACAwQFBhEhUZKx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAXEQADAQAAAAAAAAAAAAAAAAAAARIT/9oADAMBAAIRAxEAPwDSbmGq5pIhsdFTj9YDUxWGjkx7eoidGTKP/9k=',
    credit: {
      author: 'Pangalau',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_International_Airport_2_2023_10.jpg',
      modified: 'cropped, resized and colour-graded',
      crop: 'Cropped at the bottom (to 79 percent of the height) to leave out the tail of a parked aircraft.',
    },
  },
  'klia-tower': {
    src: '/images/klia/control-tower.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'The KLIA air traffic control tower beside the airport hotel, seen from the air, Sepang',
      ms: 'Menara kawalan trafik udara KLIA di sebelah hotel lapangan terbang, dilihat dari udara, Sepang',
    },
    place: 'kul',
    subject: 'airside',
    group: 'klia',
    focal: { x: 0.6, y: 0.4 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMF/8QAHxAAAgEEAgMAAAAAAAAAAAAAAQIDAAQREgUhMWGB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAYEQADAQEAAAAAAAAAAAAAAAAAARECA//aAAwDAQACEQMRAD8Azorl203Z2yFzgDye6sZWEuA6ooOCXUH71RpVUXNwAAAJlUD1qaZLFGvHLIqgNuBUPpHBWaf/2Q==',
    credit: {
      author: 'Yu Chu Chin',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aerial_photograph_of_Malaysia_on_15_January_2026_-_04.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'klia2-terminal': {
    src: '/images/klia2/terminal-2-gate.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'An AirAsia aircraft at a gate of KLIA Terminal 2, with the control tower behind, Sepang',
      ms: 'Pesawat AirAsia di pintu berlepas KLIA Terminal 2, dengan menara kawalan di belakangnya, Sepang',
    },
    place: 'kul',
    subject: 'terminal',
    group: 'klia2',
    focal: { x: 0.6, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgUG/8QAIRAAAgEDAwUAAAAAAAAAAAAAAQIRAAMhBBITBRUyUXH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABURAQEAAAAAAAAAAAAAAAAAAAAS/9oADAMBAAIRAxEAPwCyvVNK7AJqLZIzCuDNPummmOQT6GaznGirtCKAMYFFbFrd4A/c1VEv/9k=',
    credit: {
      author: 'Pangalau',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_International_Airport_2_2023_05.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'aircraft-malaysia-airlines': {
    src: '/images/aircraft/malaysia-airlines-a330.jpg',
    width: 2560,
    height: 1441,
    alt: {
      en: 'A Malaysia Airlines Airbus A330 in a Malaysian flag livery at KLIA, Sepang',
      ms: 'Airbus A330 Malaysia Airlines bercorak bendera Malaysia di KLIA, Sepang',
    },
    place: 'kul',
    subject: 'aircraft',
    group: 'aircraft',
    focal: { x: 0.4, y: 0.6 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAwD/xAAjEAABAwIFBQAAAAAAAAAAAAABAAIRAwQSExUhMSJRcYGh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAf/EABURAQEAAAAAAAAAAAAAAAAAAAAh/9oADAMBAAIRAxEAPwCYwYQdQqjuAwuj4hzHy8C5uSI6TMb+CEdDk+klThBj/9k=',
    credit: {
      author: 'Bahnfrend',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Malaysia_Airlines_Airbus_A330_9M-MTA_Kuala_Lumpur_2024_(01).jpg',
      modified: 'resized and colour-graded',
    },
  },
  'apron-night': {
    src: '/images/aircraft/apron-night.jpg',
    width: 1920,
    height: 1279,
    alt: {
      en: 'An AirAsia Airbus A320neo at a passenger bridge on the apron at KLIA at night, Sepang',
      ms: 'Airbus A320neo AirAsia di jambatan penumpang di apron KLIA pada waktu malam, Sepang',
    },
    place: 'kul',
    subject: 'aircraft',
    group: 'aircraft',
    focal: { x: 0.62, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAwQFBv/EAB4QAAICAgMBAQAAAAAAAAAAAAECAwQAEQUhQWHB/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABcRAQEBAQAAAAAAAAAAAAAAAAEAAgP/2gAMAwEAAhEDEQA/AM2eNRSC0NhV67YgfmNw8LTlgaQW9HxR2d/cDQszpWmZZn3snZbeVoppCoJbzAeiMhgb/9k=',
    credit: {
      author: 'Bahnfrend',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:AirAsia_Airbus_A320neo_9M-RAL_Kuala_Lumpur_2024_(01).jpg',
      modified: 'resized and colour-graded',
    },
  },
  'aircraft-terminal-1': {
    src: '/images/aircraft/taxiing-terminal-1.jpg',
    width: 1920,
    height: 1069,
    alt: {
      en: 'Malaysia Airlines and Batik Air jets on the taxiway in front of KLIA Terminal 1, Sepang',
      ms: 'Pesawat Malaysia Airlines dan Batik Air di landasan teksi di hadapan KLIA Terminal 1, Sepang',
    },
    place: 'kul',
    subject: 'aircraft',
    group: 'aircraft',
    focal: { x: 0.5, y: 0.6 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMF/8QAHxAAAgEEAgMAAAAAAAAAAAAAAQIDAAQRITFxEhMy/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAXEQEBAQEAAAAAAAAAAAAAAAABABED/9oADAMBAAIRAxEAPwA9r61ePMrKAdksCeKvNDA6+STyE4zpyD1sVk23yaZHw3VROiuSwv/Z',
    credit: {
      author: 'Bahnfrend',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Airliners_Kuala_Lumpur_2025_(08).jpg',
      modified: 'resized and colour-graded',
    },
  },
  'klia-ekspres': {
    src: '/images/rail/klia-ekspres.jpg',
    width: 1920,
    height: 1200,
    alt: {
      en: 'A KLIA Ekspres train, the non-stop rail service between KL Sentral and KLIA',
      ms: 'Kereta api KLIA Ekspres, perkhidmatan rel tanpa henti antara KL Sentral dan KLIA',
    },
    place: 'kul',
    subject: 'rail',
    group: 'rail',
    focal: { x: 0.35, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQF/8QAIhAAAgICAAYDAAAAAAAAAAAAAQIDEQAEBRIhIjFBYXGR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAQEBAAAAAAAAAAAAAAAAAAAREv/aAAwDAQACEQMRAD8AzOG6kJFytEjO6xgXfkdfJ+sDbkFgRSryWSVZRf7keyA0vcAaqr9Y8aquxQUAX6HxgpZf/9k=',
    credit: {
      author: 'Wei Kakurai',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:KLIA_Express_X1-02.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'penang-bridge': {
    src: '/images/penang/penang-bridge.jpg',
    width: 2560,
    height: 1920,
    alt: {
      en: 'The Penang Bridge across the Penang Strait on a misty morning',
      ms: 'Jambatan Pulau Pinang merentasi Selat Pulau Pinang pada pagi yang berkabus',
    },
    place: 'pen',
    subject: 'destination',
    group: 'penang',
    focal: { x: 0.4, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAUG/8QAIhAAAQMDAwUAAAAAAAAAAAAAAQACAwQREgUxYRQhIkJR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABURAQEAAAAAAAAAAAAAAAAAAAAB/9oADAMBAAIRAxEAPwCvBWMhYCWNA2HfdJ6/Jvky3BKymkzSSxCokdlIbgE+o4+JslRIMrFKjH//2Q==',
    credit: {
      author: 'HundenvonPenang',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_Bridge_Dec2024-1.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'pen-terminal': {
    src: '/images/penang/airport-terminal.jpg',
    width: 2560,
    height: 1689,
    alt: {
      en: 'Penang International Airport across the airfield, with Bayan Lepas and the hills of Penang Island behind',
      ms: 'Lapangan Terbang Antarabangsa Pulau Pinang dari seberang lapangan terbang, berlatarkan Bayan Lepas dan bukit-bukau Pulau Pinang',
    },
    place: 'pen',
    subject: 'terminal',
    group: 'penang',
    focal: { x: 0.45, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAX/xAAhEAACAgECBwAAAAAAAAAAAAABAgADESOhBAUSFCEycf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGREAAgMBAAAAAAAAAAAAAAAAAAECERNB/9oADAMBAAIRAxEAPwA9L8xRz0PW1ZPtYgztF9xcH1LUZQPOkBneR1dgowxHww/FX2qcCxoNpPhOkf/Z',
    credit: {
      author: 'HundenvonPenang',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_International_Airport_Dec2024.jpg',
      modified: 'cropped, resized and colour-graded',
      crop: 'Cropped at the bottom (to 88 percent of the height) to leave out the rooftops in the foreground.',
    },
  },
  'george-town-blue-mansion': {
    src: '/images/penang/blue-mansion.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'Louvred windows on the indigo walls of the Cheong Fatt Tze Mansion, the Blue Mansion, George Town, Penang',
      ms: 'Tingkap berbidai pada dinding biru nila Rumah Agam Cheong Fatt Tze, atau Rumah Biru, di George Town, Pulau Pinang',
    },
    place: 'pen',
    subject: 'destination',
    group: 'penang',
    focal: { x: 0.5, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQAD/8QAIhAAAgEEAgEFAAAAAAAAAAAAAQMCAAQRMRIhEyJCUXGh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAAMAAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEQMRAD8AK8zxEksusB4VkXEtE7+6mXDxZJaG3YnM9g3Escfn8pyNsoqwYkjgPcazaheJ+k99bOqSoTk//9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_Malaysia-_Cheong-Fatt-Tze-Mansion-05.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'george-town-street': {
    src: '/images/penang/lebuh-penang.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'A bicycle stall selling coconuts on Lebuh Penang, George Town, Penang',
      ms: 'Gerai basikal yang menjual kelapa di Lebuh Penang, George Town, Pulau Pinang',
    },
    place: 'pen',
    subject: 'destination',
    group: 'penang',
    focal: { x: 0.45, y: 0.6 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAAF/8QAHxAAAgICAgMBAAAAAAAAAAAAAQIDBAAhETESE4Gh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABgRAAMBAQAAAAAAAAAAAAAAAAABAiEx/9oADAMBAAIRAxEAPwAr2RMPUknrBHMhdvEH6N5NYkda71ypd2KsrAyIRxrfeIhoVnbxeMkN2Cx3+5rUakFfgQxKg61irbeCZS6f/9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_Malaysia_Bicycle-in-Lebuh-Penang-01.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'khoo-kongsi': {
    src: '/images/penang/khoo-kongsi.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'Carved and gilded roof beams inside the Khoo Kongsi clan house, George Town, Penang',
      ms: 'Kekuda bumbung berukir dan bersalut emas di dalam rumah suku Khoo Kongsi, George Town, Pulau Pinang',
    },
    place: 'pen',
    subject: 'destination',
    group: 'penang',
    focal: { x: 0.5, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAgT/xAAfEAACAgICAwEAAAAAAAAAAAABAgMRABIhUQQjMWH/xAAUAQEAAAAAAAAAAAAAAAAAAAAE/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIRAxEAPwCCVJSY2SVwSDtqavn7jgEvtLysdQNbN1+5csERnkBQUnCjrGPHiEygIKfhh3hKZr//2Q==',
    credit: {
      author: 'Supanut Arunoprayote',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Khoo_Kongsi_(II).jpg',
      modified: 'resized and colour-graded',
    },
  },
  'mount-kinabalu': {
    src: '/images/sabah/mount-kinabalu.jpg',
    width: 2560,
    height: 1707,
    alt: {
      en: 'Mount Kinabalu in the evening light above forested hills, Sabah',
      ms: 'Gunung Kinabalu disinari cahaya petang di atas bukit-bukau berhutan, Sabah',
    },
    place: 'bki',
    subject: 'destination',
    group: 'sabah',
    focal: { x: 0.45, y: 0.35 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAgMEB//EACAQAQABAwQDAQAAAAAAAAAAAAECAAMRBAYhMRNBkbH/xAAUAQEAAAAAAAAAAAAAAAAAAAAB/8QAGBEAAgMAAAAAAAAAAAAAAAAAAAECEVH/2gAMAwEAAhEDEQA/ALL+4bPlTTytMDAZFX5RWtx6YkR1EY8+4D+NZ9anIk4Uz3TozknK90qTB1h//9k=',
    credit: {
      author: 'Angah hfz',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gunung_Kinabalu_during_sunset.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'bki-terminal': {
    src: '/images/sabah/kota-kinabalu-terminal.jpg',
    width: 2560,
    height: 1585,
    alt: {
      en: 'The entrance of Kota Kinabalu International Airport, with flowering shrubs in front',
      ms: 'Pintu masuk Lapangan Terbang Antarabangsa Kota Kinabalu, dengan pokok renek berbunga di hadapannya',
    },
    place: 'bki',
    subject: 'terminal',
    group: 'sabah',
    focal: { x: 0.5, y: 0.45 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAIDBP/EACMQAAEEAQEJAAAAAAAAAAAAAAEAAgURBCEDFCIkMUFRocH/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAGBEAAgMAAAAAAAAAAAAAAAAAAAEDEiH/2gAMAwEAAhEDEQA/AEEzJkkDOefA3a0GWkjV5jtBZ5Xp7WuHAGybQA4fqpMaYDnd7q0CkYlMP//Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:KotaKinabalu_Sabah_KKIA-02.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'bki-airfield': {
    src: '/images/sabah/kota-kinabalu-airfield.jpg',
    width: 1920,
    height: 1080,
    alt: {
      en: 'Terminal 1 of Kota Kinabalu International Airport across the airfield, with mountains behind',
      ms: 'Terminal 1 Lapangan Terbang Antarabangsa Kota Kinabalu dari seberang lapangan terbang, berlatarkan banjaran gunung',
    },
    place: 'bki',
    subject: 'terminal',
    group: 'sabah',
    focal: { x: 0.45, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAgMEBv/EAB4QAAEDBAMAAAAAAAAAAAAAAAEAAhIDBRFCIWGB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQT/xAAZEQACAwEAAAAAAAAAAAAAAAAAAQIDEVH/2gAMAwEAAhEDEQA/AL6d7rACRZ5kIzfXcyiR08rNM2TdQoXfPo4j/9k=',
    credit: {
      author: 'Jahurz93',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kota_Kinabalu_International_Airport_Terminal_1.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'langkawi-beach': {
    src: '/images/langkawi/pantai-cenang.jpg',
    width: 1920,
    height: 1080,
    alt: {
      en: 'Rocks, palms and white sand at Pantai Cenang, Langkawi',
      ms: 'Batu, pohon kelapa dan pasir putih di Pantai Cenang, Langkawi',
    },
    place: 'lgk',
    subject: 'destination',
    group: 'langkawi',
    focal: { x: 0.35, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQIE/8QAIhAAAQQBAgcAAAAAAAAAAAAAAQACAxEEEjETITI0QnGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQP/xAAWEQADAAAAAAAAAAAAAAAAAAAAAhP/2gAMAwEAAhEDEQA/AN7mwZd8GJ5Ox2A+o2TBkil7XW0DmGyC791SZxvFXP1BTs4yU//Z',
    credit: {
      author: 'NickLubushko',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cenang_Beach_view,_Langkawi.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'lgk-terminal': {
    src: '/images/langkawi/airport-departures.jpg',
    width: 2560,
    height: 1327,
    alt: {
      en: 'The departures entrance of Langkawi International Airport, signed Perlepasan and Departure',
      ms: 'Pintu masuk balai berlepas Lapangan Terbang Antarabangsa Langkawi, bertanda Perlepasan dan Departure',
    },
    place: 'lgk',
    subject: 'terminal',
    group: 'langkawi',
    focal: { x: 0.5, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMF/8QAHRAAAgIDAAMAAAAAAAAAAAAAAQIAAwQREiFRYf/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFREBAQAAAAAAAAAAAAAAAAAAAAH/2gAMAwEAAhEDEQA/AMHDqvYhbqn11oHQ8jcplY7LW3CuCD6+xEgx/9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Malaysia_Lankawi-International-Airport-01.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'langkawi-sky-bridge': {
    src: '/images/langkawi/sky-bridge.jpg',
    width: 1920,
    height: 1281,
    alt: {
      en: 'The curved Langkawi Sky Bridge hanging from a single pylon above the rainforest of Gunung Mat Cincang',
      ms: 'Jambatan Langit Langkawi yang melengkung, tergantung pada satu tiang di atas hutan hujan Gunung Mat Cincang',
    },
    place: 'lgk',
    subject: 'destination',
    group: 'langkawi',
    focal: { x: 0.6, y: 0.45 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEG/8QAIhAAAgEDAgcAAAAAAAAAAAAAAQIDAAQREiEFExYxYXKR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQP/xAAZEQEAAgMAAAAAAAAAAAAAAAABAAIDESH/2gAMAwEAAhEDEQA/AHDikHLLSDT7OM/BRupLFdQaCVcHbABzWStXYoN+9WcAAnzQ5XfJMqT/2Q==',
    credit: {
      author: 'Engin Akyurt',
      licence: 'CC0 1.0',
      licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Sky_Bridge_(November_2016).jpg',
      modified: 'resized and colour-graded',
    },
  },
  'langkawi-eagle-square': {
    src: '/images/langkawi/dataran-helang.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'The eagle statue at Dataran Helang (Eagle Square), Kuah, Langkawi, framed by white gateways',
      ms: 'Patung helang di Dataran Helang, Kuah, Langkawi, diapit gerbang putih',
    },
    place: 'lgk',
    subject: 'destination',
    group: 'langkawi',
    focal: { x: 0.5, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQIDBP/EACEQAAIBAwUAAwAAAAAAAAAAAAEDAgAEIRESMUGhgcHR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABcRAAMBAAAAAAAAAAAAAAAAAAACERT/2gAMAwEAAhEDEQA/AL3dkpWxipbkMAMJ6848oW1jBsJsZMLVEZmejjTHzWKD2NSpM5blxA0BA6B/TSOcxVqxa5GMTyPfoU9DSAzrT//Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Malaysia_Dataran-Helang-01.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'langkawi-paddy': {
    src: '/images/langkawi/rice-paddy.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'Green rice paddies and a scarecrow below forested hills on Langkawi',
      ms: 'Sawah padi menghijau dan orang-orang di kaki bukit berhutan di Langkawi',
    },
    place: 'lgk',
    subject: 'destination',
    group: 'langkawi',
    focal: { x: 0.5, y: 0.6 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgMF/8QAIRAAAQMEAQUAAAAAAAAAAAAAAgEDEgAEBREhMVJicZH/xAAVAQEBAAAAAAAAAAAAAAAAAAABBP/EABgRAAIDAAAAAAAAAAAAAAAAAAABAxEU/9oADAMBAAIRAxEAPwDOtH87bjEL1Ia1o3Ja+pTE8k4snr5Z+Lq0QMu5elVQyii8b9VBokBUf//Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Malaysia_Rice-Paddy-01.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'kuching-waterfront': {
    src: '/images/kuching/waterfront.jpg',
    width: 2560,
    height: 1707,
    alt: {
      en: 'The Sarawak State Legislative Assembly building across the Sarawak River from the Kuching Waterfront, with a river boat',
      ms: 'Bangunan Dewan Undangan Negeri Sarawak di seberang Sungai Sarawak dari Waterfront Kuching, dengan sebuah perahu tambang',
    },
    place: 'kch',
    subject: 'destination',
    group: 'kuching',
    focal: { x: 0.5, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAEEBf/EACAQAAICAQQDAQAAAAAAAAAAAAEDAgQABRESIRRBcYH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAMAAwAAAAAAAAAAAAAAAAABEQMSIf/aAAwDAQACEQMRAD8A3H61XhVDUND+XURE46utVXqBbOKWDoxmdv3fJfBqxrL4ogPXQwrUqxZLdMT9ydZXZBdOH//Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuching_Sarawak_Dewan-Undangan-Negeri-Sarawak-01.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'kch-terminal': {
    src: '/images/kuching/airport-terminal.jpg',
    width: 1920,
    height: 1533,
    alt: {
      en: 'The curved roof canopies of the terminal at Kuching International Airport',
      ms: 'Kanopi bumbung melengkung terminal Lapangan Terbang Antarabangsa Kuching',
    },
    place: 'kch',
    subject: 'terminal',
    group: 'kuching',
    focal: { x: 0.6, y: 0.45 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAANABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAwX/xAAfEAACAQUBAAMAAAAAAAAAAAABAhEAAwQhMRIFUWH/xAAVAQEBAAAAAAAAAAAAAAAAAAABAv/EABgRAAMBAQAAAAAAAAAAAAAAAAABAgQR/9oADAMBAAIRAxEAPwBczLs4jeVJuMYhVYRv7YwKn2Pm9K2VdsAeoK46s5P5PBSnyvEXXNUN5A6lj072JorRSfCFCP/Z',
    credit: {
      author: 'Medelam',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuching_International_Airport_2024_01.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'kl-petronas': {
    src: '/images/kuala-lumpur/petronas-towers.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'The Petronas Twin Towers and Menara Kuala Lumpur rising above the trees of Kuala Lumpur',
      ms: 'Menara Berkembar Petronas dan Menara Kuala Lumpur menjulang di atas pepohon Kuala Lumpur',
    },
    place: 'kul',
    subject: 'destination',
    group: 'kualaLumpur',
    focal: { x: 0.5, y: 0.45 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAb/xAAiEAABAwMDBQAAAAAAAAAAAAABAAIDBBIhETFRBRMUImH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAA//EABcRAQEBAQAAAAAAAAAAAAAAAAEAExT/2gAMAwEAAhEDEQA/AFCpgfJJGD7sdbpz9SOyAbTuVG01VOHiQSG9wyeUiLqNYGzDyH4GNTtlOhKeRf/Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Skyline-03.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'petronas-skybridge': {
    src: '/images/kuala-lumpur/petronas-skybridge.jpg',
    width: 1920,
    height: 1280,
    alt: {
      en: 'The skybridge between the two Petronas Twin Towers, seen from below, Kuala Lumpur',
      ms: 'Jambatan langit yang menghubungkan kedua-dua Menara Berkembar Petronas, dilihat dari bawah, Kuala Lumpur',
    },
    place: 'kul',
    subject: 'destination',
    group: 'kualaLumpur',
    focal: { x: 0.5, y: 0.4 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECBf/EACEQAAEDAwQDAAAAAAAAAAAAAAEAAhEDBCEiMTJBUoLB/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABYRAQEBAAAAAAAAAAAAAAAAAABCEf/aAAwDAQACEQMRAD8AyaLS55AMY3hFVpY/Lp0zMR2ro4uCB4p3HP1+hPGhp//Z',
    credit: {
      author: 'Marcin Konsek',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:2016_Kuala_Lumpur,_Petronas_Towers_(27).jpg',
      modified: 'resized and colour-graded',
    },
  },
  'nasi-lemak': {
    src: '/images/food/nasi-lemak.jpg',
    width: 1920,
    height: 1289,
    alt: {
      en: 'A plate of nasi lemak with fried chicken, a fried egg, sambal, cucumber and peanuts, and a young coconut to drink',
      ms: 'Sepinggan nasi lemak dengan ayam goreng, telur mata, sambal, timun dan kacang, bersama sebiji kelapa muda',
    },
    place: 'my',
    subject: 'food',
    group: 'food',
    focal: { x: 0.55, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAgMEBf/EACAQAAIBAwUBAQAAAAAAAAAAAAECAwQRIQAFEjFBE2H/xAAUAQEAAAAAAAAAAAAAAAAAAAAC/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/AMah2t6qELC6BmNlW+TnJP5pm7K1JQRba0EbMDy+wPt841C80lNxMLcD1cd20MTtKS0jFj1k+aMN/9k=',
    credit: {
      author: 'مانفی',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nasi_lemak_joh.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'satay': {
    src: '/images/food/satay.jpg',
    width: 1920,
    height: 1440,
    alt: {
      en: 'Skewers of satay with peanut sauce, nasi impit rice cakes and cucumber',
      ms: 'Sate bersama kuah kacang, nasi impit dan timun',
    },
    place: 'my',
    subject: 'food',
    group: 'food',
    focal: { x: 0.55, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAP/xAAiEAACAwABAgcAAAAAAAAAAAABAgMEEQAxQQUSUWFxocH/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAGBEBAAMBAAAAAAAAAAAAAAAAAQACESH/2gAMAwEAAhEDEQA/ABR1PCKdCNLEc4sSDRMhxx75uZwbtFUQ5IFXqjAnZB8duReRno1JnPmcoVO+inB9cdJQgkprM4JcIBu9uv7wGu8WPoE//9k=',
    credit: {
      author: 'LoneCK88',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Satay_with_Nasi_Impit.jpg',
      modified: 'resized and colour-graded',
    },
  },
  'wing-window': {
    src: '/images/travel/wing-window.jpg',
    width: 2560,
    height: 1920,
    alt: {
      en: 'An aircraft wing above islands and scattered cloud, seen from a window seat on a flight from Kuching to Kuala Lumpur',
      ms: 'Sayap pesawat di atas pulau-pulau dan awan yang berselerak, dilihat dari tempat duduk tingkap dalam penerbangan dari Kuching ke Kuala Lumpur',
    },
    place: 'my',
    subject: 'atmosphere',
    group: 'travel',
    focal: { x: 0.6, y: 0.5 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAwb/xAAgEAACAQQBBQAAAAAAAAAAAAABAgMABBESBSExQUJx/8QAFAEBAAAAAAAAAAAAAAAAAAAABP/EABcRAQEBAQAAAAAAAAAAAAAAAAECAAP/2gAMAwEAAhEDEQA/AGm5CQ3WshjSJW6YLbj74ppr8CF5EvkLD0wcmpiWSQltpGbLHvRNI2uM02OYSYtUrv/Z',
    credit: {
      author: 'Marufish from Alor Setar, Malaysia',
      licence: 'CC BY-SA 2.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Birdeye_view_flight_from_Kuching_to_KLIA_(17159233693).jpg',
      modified: 'cropped, resized and colour-graded',
      crop: 'Cropped to the upper-left 86 percent of the frame, leaving out the edge of the cabin window.',
    },
  },
} satisfies Record<string, Omit<SiteImage, 'id'>>;

export type ImageId = keyof typeof DATA;

/** Every photo by id. */
export const IMAGES = Object.fromEntries(Object.entries(DATA as Record<string, Omit<SiteImage, 'id'>>).map(([id, image]) => [id, { id, ...image }])) as Record<ImageId, SiteImage>;

/** Every photo, in credits order (by group, then as listed). */
export const ALL_IMAGES: readonly SiteImage[] = IMAGE_GROUPS.flatMap((group) => (Object.values(IMAGES) as SiteImage[]).filter((image) => image.group === group));

export const IMAGE_COUNT = ALL_IMAGES.length;

/** One photo by id. */
export function imageFor(id: ImageId): SiteImage {
  return IMAGES[id];
}

/** `object-position` for a photo's focal point: `'50% 40%'`. */
export function objectPosition(image: Pick<SiteImage, 'focal'>): string {
  return `${Math.round(image.focal.x * 100)}% ${Math.round(image.focal.y * 100)}%`;
}

/** Candidates for the home page hero, best first. */
// Redesign 1c (critique-redesign1b item 3): Mount Kinabalu in the evening light leads. Six library
// photographs were judged in place behind the real headline and search at 1440 x 900 and 390 x 844
// (the roof canopies, the 2026 aerial, the roofline across the airfield, this one, the Petronas
// Towers, the apron at night): the overcast roof read gloomy, the aerial and the airfield as grey
// texture under the veil, the towers stood behind the headline, and the apron at night is an
// airline's aircraft. The warm summit is the one picture that still says "travel" through the scrims,
// and on a phone the peak fills the band under the header. The aerial and the roof follow.
export const HOME_HERO_IMAGES: readonly ImageId[] = ['mount-kinabalu', 'klia-t1-aerial', 'klia-t1-roof'];

/** Destination cards (the places the airports serve), in display order. */
export const DESTINATION_IMAGES: readonly ImageId[] = ['kl-petronas', 'penang-bridge', 'mount-kinabalu', 'langkawi-beach', 'kuching-waterfront', 'langkawi-sky-bridge', 'george-town-blue-mansion'];

/** Discover cards and section backgrounds: food, travel, the train, the terminal experience. */
export const DISCOVER_IMAGES: readonly ImageId[] = ['klia-t1-roof', 'nasi-lemak', 'klia-ekspres', 'satay', 'petronas-skybridge', 'khoo-kongsi', 'langkawi-eagle-square', 'george-town-street', 'langkawi-paddy', 'apron-night', 'aircraft-malaysia-airlines', 'klia-t1-aerial'];

/**
 * Hero photos per airport slug, best first. Each shows that airport or the place it serves,
 * never another airport. Airports not listed get `FALLBACK_HERO`.
 */
export const AIRPORT_HERO_IMAGES: Readonly<Partial<Record<string, readonly ImageId[]>>> = {
  // Redesign 1c: the 2026 aerial leads (the Terminal 1 roof, the pier and the aircraft alongside in the
  // open right half of the cinematic shade; on a phone the terminal fills the band). Judged in place
  // against the roofline across the airfield (polish 1b's choice: at 1440 px mostly sky, the domes
  // hidden behind the search), the roof canopies, the timber ceiling and the jets taxiing past
  // Terminal 1 (two airlines' liveries as the subject).
  kul: ['klia-t1-aerial', 'klia-t1-airfield', 'klia-t1-canopy'],
  pen: ['pen-terminal', 'penang-bridge'],
  bki: ['bki-terminal', 'mount-kinabalu'],
  lgk: ['lgk-terminal', 'langkawi-beach'],
  kch: ['kch-terminal', 'kuching-waterfront'],
};

/**
 * Polish 1b (critique-redesign1b item 7): the directory card (`/airports`) for an airport whose
 * first photograph carries a sign across the frame that any card crop cuts mid-word: Kota Kinabalu
 * shows its terminal across the airfield (no name board), Langkawi the beach by its runway, Pantai
 * Cenang (its only airport photograph has "Perlepasan / Departure" across the top third).
 */
export const DIRECTORY_IMAGES: Readonly<Partial<Record<string, ImageId>>> = {
  bki: 'bki-airfield',
  lgk: 'langkawi-beach',
};

/**
 * Polish 1b (critique-redesign1b item 9): photographs for the "Explore" cards of an airport's
 * overview, by section. Only that airport's own photographs (or a Malaysian dish for food);
 * sections without one keep their line drawing.
 */
export const EXPLORE_IMAGES: Readonly<Partial<Record<string, Readonly<Partial<Record<string, ImageId>>>>>> = {
  // Redesign 1c: the aerial is now KLIA's hero, so the terminal map card shows the control tower and
  // the airport roads from the air instead of repeating it.
  kul: { flights: 'apron-night', map: 'klia-tower', 'shop-dine': 'nasi-lemak', lounges: 'klia-t1-canopy' },
  pen: { flights: 'pen-terminal', 'shop-dine': 'george-town-street' },
  bki: { flights: 'bki-airfield' },
  kch: { flights: 'kch-terminal' },
};

/** For airports without their own photo: a Malaysia image that shows no particular airport. */
export const FALLBACK_HERO: ImageId | undefined = 'wing-window';

/**
 * The hero photo for an airport (by slug or code): its own, else the Malaysia fallback, never
 * another airport's. `undefined` only while the library has no fallback photo.
 */
export function heroForAirport(code: string): SiteImage | undefined {
  const id = AIRPORT_HERO_IMAGES[code.toLowerCase()]?.[0] ?? FALLBACK_HERO;
  return id === undefined ? undefined : IMAGES[id];
}

/** Photos grouped for the credits page, groups without photos left out. */
export function imagesByGroup(): { group: ImageGroup; images: SiteImage[] }[] {
  return IMAGE_GROUPS.map((group) => ({ group, images: ALL_IMAGES.filter((image) => image.group === group) })).filter((entry) => entry.images.length > 0);
}

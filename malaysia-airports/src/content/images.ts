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
 * 22 November 2026. What was chosen and rejected, and why: docs/design/photography.md.
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
  /** What we changed: every file is resized and compressed; some are also cropped. */
  modified: 'resized' | 'cropped and resized';
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAQF/8QAHxAAAgICAQUAAAAAAAAAAAAAAQMAAhESYQUhMpHB/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABcRAQEBAQAAAAAAAAAAAAAAAAEAAhH/2gAMAwEAAhEDEQA/AMxaGiq66HIORYDxI+SpHR3uZmqiRt2HHPuIgDs9aS//2Q==',
    credit: {
      author: 'Eugene Ormandy',
      licence: 'CC0 1.0',
      licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_International_Airport_20240509.jpg',
      modified: 'cropped and resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQME/8QAIRABAAICAQMFAAAAAAAAAAAAAQIDABEhBBIxE0JhcaH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFxEBAQEBAAAAAAAAAAAAAAAAAQACEv/aAAwDAQACEQMRAD8Ak23AzK7vTPdsD9c00997qErEPKSEPjBOltslKTKTJfO+cRpsmSNS19cYNs5L/9k=',
    credit: {
      author: 'Yu Chu Chin',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aerial_photograph_of_Malaysia_on_15_January_2026_-_02.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABwQG/8QAIxAAAgEDAwQDAAAAAAAAAAAAAQIDAAQSBREhExYxQSKRof/EABUBAQEAAAAAAAAAAAAAAAAAAAAC/8QAFxEBAAMAAAAAAAAAAAAAAAAAAAERIf/aAAwDAQACEQMRAD8Azdo8um3imKLG5AIVmPC+RuPo0l6blbaXbh7jqkpkzuDuxPJNH8iLJYwyvy4hz39k5e6s7q1DFVCwAAcfDx+0jEW//9k=',
    credit: {
      author: 'Descon7',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:KLIA_Main_terminal.JPG',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAEF/8QAHhAAAQQBBQAAAAAAAAAAAAAAAQACAwQFERUhUZL/xAAUAQEAAAAAAAAAAAAAAAAAAAAC/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAESE//aAAwDAQACEQMRAD8A0G56s5pIin8K75WA1MVgDss4RE9GGUf/2Q==',
    credit: {
      author: 'Pangalau',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_International_Airport_2_2023_10.jpg',
      modified: 'cropped and resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAwT/xAAeEAACAgICAwAAAAAAAAAAAAABAgMRABIEITFhgf/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAERAv/aAAwDAQACEQMRAD8AgjnZtdyzWBdAeTiGRhJQcIoNEst/esCRQJ5wB0JVAHqsqkjReCrhQG2rJe44KzT/2Q==',
    credit: {
      author: 'Yu Chu Chin',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aerial_photograph_of_Malaysia_on_15_January_2026_-_04.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAgX/xAAgEAACAQQBBQAAAAAAAAAAAAABAhEAAxIhBAUVMlFx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAVEQEBAAAAAAAAAAAAAAAAAAAAEv/aAAwDAQACEQMRAD8ArjqXGZgFv2yRuFcGafcuPMZifQqBgiriFUCI0KK2beXgD93V0Jf/2Q==',
    credit: {
      author: 'Pangalau',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_International_Airport_2_2023_05.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwAC/8QAIhAAAQMCBgMAAAAAAAAAAAAAAQACEQMEBRITISIxUXGh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJjG5QTiFUeQGF0fEOo+XgXNwRHEzG/ohHR7W6nSC//Z',
    credit: {
      author: 'Bahnfrend',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Malaysia_Airlines_Airbus_A330_9M-MTA_Kuala_Lumpur_2024_(01).jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAwQFBv/EAB8QAAIBBAIDAAAAAAAAAAAAAAECAwAEBREhQVFhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFxEBAQEBAAAAAAAAAAAAAAAAAQACE//aAAwDAQACEQMRAD8AzRxkaFS0NwicbLED71TkOEs5rdpReaPSDk790DH3U6W0zLM+9nkturEM0hUEt14qPRGZgb//2Q==',
    credit: {
      author: 'Bahnfrend',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:AirAsia_Airbus_A320neo_9M-RAL_Kuala_Lumpur_2024_(01).jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMF/8QAHxAAAgEDBQEAAAAAAAAAAAAAAQIDAAQhERITMXEy/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAYEQEBAAMAAAAAAAAAAAAAAAABAAMREv/aAAwDAQACEQMRAD8APa8avHrKygHLFgT1V5oYHXck8hO3XDkHzIrJtvmmR9N5UjIrqXN//9k=',
    credit: {
      author: 'Bahnfrend',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Airliners_Kuala_Lumpur_2025_(08).jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMF/8QAIhAAAgICAAYDAAAAAAAAAAAAAQIDEQAEBRIhIjFBYXGx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAQEBAAAAAAAAAAAAAAAAAAAREv/aAAwDAQACEQMRAD8AzeG6kJFytEjO6xgXfkdfJ+sPtSCwIpV5bJKso/cHsgNL3AGqq/WXjVV2KCgC/Q+MNLL/2Q==',
    credit: {
      author: 'Wei Kakurai',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:KLIA_Express_X1-02.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAUG/8QAIBAAAgIBAwUAAAAAAAAAAAAAAQIAAxEEEmEFISIxQv/EABQBAQAAAAAAAAAAAAAAAAAAAAL/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEQMRAD8AqU6pKkBKKB6HeJOtLL5JjgmZjpdr21C+xt1hyAT8jiMsvcbsGOjH/9k=',
    credit: {
      author: 'HundenvonPenang',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_Bridge_Dec2024-1.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMF/8QAIRAAAgIBAgcAAAAAAAAAAAAAAQIAAxEjoQQFEhQhMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAACA//EABgRAAIDAAAAAAAAAAAAAAAAAAABERNB/9oADAMBAAIRAxEAPwCNL8xRz0PW1ZPtYgztF9xcH1LUZQPOkBneY6uwUYYj4Yfir7VOBY0NzeE4R//Z',
    credit: {
      author: 'HundenvonPenang',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_International_Airport_Dec2024.jpg',
      modified: 'cropped and resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQED/8QAIBABAAIBBAIDAAAAAAAAAAAAAQMEAgARITESE0Jxof/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFhEAAwAAAAAAAAAAAAAAAAAAAAEC/9oADAMBAAIRAxEAPwAn32DBWS3sTkW5Yz6Xh+9WSxYKMExNcM83kbOQeL0/jp7GrCxbOKnrPk6ymrxbZni8m3b1q1QuT//Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_Malaysia-_Cheong-Fatt-Tze-Mansion-05.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEF/8QAIBAAAgICAgIDAAAAAAAAAAAAAQIDBBEhADESEwVBof/EABQBAQAAAAAAAAAAAAAAAAAAAAH/xAAYEQADAQEAAAAAAAAAAAAAAAAAAQIhMf/aAAwDAQACEQMRAD8AI9kTD0xyetSMyF28VOPrI3yvZkdaz1yhkdirKymRCMa33xEHx9WR/F4yVbsFzv8AebFCpXrYEMSoOtcatt4Eyl0//9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Penang_Malaysia_Bicycle-in-Lebuh-Penang-01.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAgMEBf/EAB8QAAICAgIDAQAAAAAAAAAAAAECAxEAEiFRBCMxYf/EABQBAQAAAAAAAAAAAAAAAAAAAAT/xAAXEQADAQAAAAAAAAAAAAAAAAAAAQIx/9oADAMBAAIRAxEAPwDPlSUmNklcEg7amr5+4cAm9peVjqBrZuv3LlgiM8gKCk4UdYwePEJlUIKfhh3hXgxUf//Z',
    credit: {
      author: 'Supanut Arunoprayote',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Khoo_Kongsi_(II).jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQMEB//EACEQAAIBAwMFAAAAAAAAAAAAAAECAwAEEQYhMRITQZGx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAf/EABcRAQEBAQAAAAAAAAAAAAAAAAEAAlH/2gAMAwEAAhEDEQA/ALZ9Rwd4i2aEoMAdQJJ9UYdTWoYLcqu/mMH4azqF2VjgkZ5p6uxG5PNJthDl/9k=',
    credit: {
      author: 'Angah hfz',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gunung_Kinabalu_during_sunset.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAIDBP/EACMQAAEEAQEJAAAAAAAAAAAAAAEAAgURBDEDEhQhIiRRocH/xAAVAQEBAAAAAAAAAAAAAAAAAAACA//EABgRAAMBAQAAAAAAAAAAAAAAAAABIQMS/9oADAMBAAIRAxEAPwBROSpLgM958DhbQZmUdV5r+Qs9rp7WuFAGxaQAOn6qzQqPc4a71WoLVuj4h//Z',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:KotaKinabalu_Sabah_KKIA-02.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAgMFBv/EAB4QAAEDBAMAAAAAAAAAAAAAAAEAAhEDBRJCIWGB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAT/xAAZEQACAwEAAAAAAAAAAAAAAAAAAQIDEVH/2gAMAwEAAhEDEQA/AKNO81gBJZ5IRm9u5ygjp5WdbsmaqN3z6MR//9k=',
    credit: {
      author: 'Jahurz93',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kota_Kinabalu_International_Airport_Terminal_1.jpg',
      modified: 'resized',
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
    focal: { x: 0.8, y: 0.55 },
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAIF/8QAIhAAAgEDAgcAAAAAAAAAAAAAAQMAAgQRMUESEyEyNHGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAL/xAAWEQADAAAAAAAAAAAAAAAAAAAAAhP/2gAMAwEAAhEDEQA/AHmlF1nlLrJ02x9gGWTFs8bjAHUUsGc+9Jq2+0t/cJNWE1P/2Q==',
    credit: {
      author: 'NickLubushko',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cenang_Beach_view,_Langkawi.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAIG/8QAHRAAAgMAAgMAAAAAAAAAAAAAAQIAAxEEEiFRYf/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFREBAQAAAAAAAAAAAAAAAAAAAAH/2gAMAwEAAhEDEQA/AM/xKr2IW6p87ZuDyJfJoZUborgg+vsRJMf/2Q==',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Malaysia_Lankawi-International-Airport-01.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEG/8QAIxAAAQQBAQkAAAAAAAAAAAAAAQACAxEEBRITFiExYXKR0f/EABUBAQEAAAAAAAAAAAAAAAAAAAAD/8QAGREBAAIDAAAAAAAAAAAAAAAAAQACAxEh/9oADAMBAAIRAxEAPwBY1SDdl0gryeL9BG4lwG7YdBK2jyoA38WSxXuLBZ6qzgAE90crvkmUJ//Z',
    credit: {
      author: 'Engin Akyurt',
      licence: 'CC0 1.0',
      licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Sky_Bridge_(November_2016).jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQIDBP/EACEQAAIBAwUAAwAAAAAAAAAAAAEDAgAEIRESMUGhgcHR/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABgRAAMBAQAAAAAAAAAAAAAAAAACERMU/9oADAMBAAIRAxEAPwC93YqVsYqW5DADCevOPKFtYwbCbGTC1RGZno40x81ig9rUqTOW5cQNAQOgf00jnMVaMWuRjE8j36FJ0NIHgtP/2Q==',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Malaysia_Dataran-Helang-01.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwIF/8QAIRAAAQMEAQUAAAAAAAAAAAAAAQIDEQAEBRIxMkFicZH/xAAVAQEBAAAAAAAAAAAAAAAAAAABBP/EABgRAAIDAAAAAAAAAAAAAAAAAAABAxEU/9oADAMBAAIRAxEAPwDMtX85bp1RejSIhbkx9FIleRcOz16d/F01CFqjqPFKFnUHv6qLRICo/9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Langkawi_Malaysia_Rice-Paddy-01.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAEEBf/EACEQAAICAQQCAwAAAAAAAAAAAAEDAgQABRESIUFhcYGh/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABkRAAIDAQAAAAAAAAAAAAAAAAABAxESIf/aAAwDAQACEQMRAD8A3X65XXUDa7Q/n1ERP76wqa5VeoFzIoYOjGZ2+98jNGrGsviiA8dDHVo1iyW6Yn5wFM9VQmOH/9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuching_Sarawak_Dewan-Undangan-Negeri-Sarawak-01.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAANABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAwX/xAAfEAACAQQCAwAAAAAAAAAAAAABAhEAAwQhEjEFImH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAA//EABgRAAMBAQAAAAAAAAAAAAAAAAABAgQR/9oADAMBAAIRAxEAPwBs3MsYbFVJuMYhVYRvqWMCp1jzmlbLvWAOUFcdWcn5J0KU8VGkX161Q3kDqWPZ3sTStNJ8JqJP/9k=',
    credit: {
      author: 'Medelam',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuching_International_Airport_2024_01.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMG/8QAIhAAAQMDAwUAAAAAAAAAAAAAAQIDIQAEEgUxURETFCJh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAP/xAAYEQACAwAAAAAAAAAAAAAAAAAAARETFP/aAAwDAQACEQMRAD8AWLllbi2wfdKsenP2r9kA4nc1kLa5eCw4HDkoSeaQ1qF2EvDyFwInaaaYJVo//9k=',
    credit: {
      author: 'CEphoto, Uwe Aranas',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Skyline-03.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECBf/EACAQAAEDAgcAAAAAAAAAAAAAAAEAAgMRISIyUXKCocH/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAFREBAQAAAAAAAAAAAAAAAAAAAEL/2gAMAwEAAhEDEQA/AM6IFziAaW0RK0tfd1cNe1UVpztTnzcfU8Bp/9k=',
    credit: {
      author: 'Marcin Konsek',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:2016_Kuala_Lumpur,_Petronas_Towers_(27).jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQMEBf/EACEQAAIBBAICAwAAAAAAAAAAAAECAwAEERIFITFRE0Fx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDDsuMe5i1hdAzHCrns99n8pnKq1pYxcc0MbMDt8w95qJ5ZLfUwtofGR6oRM0pLSMWPjs/VGE//2Q==',
    credit: {
      author: 'مانفی',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nasi_lemak_joh.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAP/xAAiEAACAgEEAQUAAAAAAAAAAAABAgMRBAAFMUESIVFxocH/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAFxEBAQEBAAAAAAAAAAAAAAAAAREAAv/aAAwDAQACEQMRAD8AFHh7Nh7fGmTFOMiQWsyGnHpzV149VobtDhoalCryjAm5B8dahJI8mDiTOfJ2QqSfZTQ+tPk2+CXCWZwS4QAG+uf3QPNYuagb/9k=',
    credit: {
      author: 'LoneCK88',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Satay_with_Nasi_Impit.jpg',
      modified: 'resized',
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
    blurDataURL: 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQG/8QAHhAAAgICAgMAAAAAAAAAAAAAAQIDEQAEEjEhQsH/xAAUAQEAAAAAAAAAAAAAAAAAAAAE/8QAFxEBAQEBAAAAAAAAAAAAAAAAAQIAEf/aAAwDAQACEQMRAD8Apl3pDs1IY0iU+KLch8xZt4CFpE3ULD0o2czcskhLcnZrY94ZduPeNmAnFp67/9k=',
    credit: {
      author: 'Marufish from Alor Setar, Malaysia',
      licence: 'CC BY-SA 2.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Birdeye_view_flight_from_Kuching_to_KLIA_(17159233693).jpg',
      modified: 'cropped and resized',
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
export const HOME_HERO_IMAGES: readonly ImageId[] = ['klia-t1-canopy', 'klia-t1-aerial', 'kl-petronas'];

/** Destination cards (the places the airports serve), in display order. */
export const DESTINATION_IMAGES: readonly ImageId[] = ['kl-petronas', 'penang-bridge', 'mount-kinabalu', 'langkawi-beach', 'kuching-waterfront', 'langkawi-sky-bridge', 'george-town-blue-mansion'];

/** Discover cards and section backgrounds: food, travel, the train, the terminal experience. */
export const DISCOVER_IMAGES: readonly ImageId[] = ['klia-t1-roof', 'nasi-lemak', 'klia-ekspres', 'satay', 'petronas-skybridge', 'khoo-kongsi', 'langkawi-eagle-square', 'george-town-street', 'langkawi-paddy', 'apron-night', 'aircraft-malaysia-airlines', 'klia-t1-aerial'];

/**
 * Hero photos per airport slug, best first. Each shows that airport or the place it serves,
 * never another airport. Airports not listed get `FALLBACK_HERO`.
 */
export const AIRPORT_HERO_IMAGES: Readonly<Partial<Record<string, readonly ImageId[]>>> = {
  kul: ['klia-t1-canopy', 'klia-t1-aerial'],
  pen: ['pen-terminal', 'penang-bridge'],
  bki: ['bki-terminal', 'mount-kinabalu'],
  lgk: ['lgk-terminal', 'langkawi-beach'],
  kch: ['kch-terminal', 'kuching-waterfront'],
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

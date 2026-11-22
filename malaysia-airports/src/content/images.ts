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
 * STATUS: empty. The Wikimedia Commons research could not run on 22 November 2026: Commons and
 * upload.wikimedia.org refused every request from this environment under their robot policy
 * (docs/design/photography.md, "Status"). There are no placeholder photos: nothing is shown
 * until a photo is chosen, its licence checked and its credit written here.
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

const DATA = {} satisfies Record<string, Omit<SiteImage, 'id'>>;

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
export const HOME_HERO_IMAGES: readonly ImageId[] = [];

/** Destination cards (the places the airports serve), in display order. */
export const DESTINATION_IMAGES: readonly ImageId[] = [];

/** Discover cards and section backgrounds: food, travel, the train, the terminal experience. */
export const DISCOVER_IMAGES: readonly ImageId[] = [];

/**
 * Hero photos per airport slug, best first. Each shows that airport or the place it serves,
 * never another airport. Airports not listed get `FALLBACK_HERO`.
 */
export const AIRPORT_HERO_IMAGES: Readonly<Partial<Record<string, readonly ImageId[]>>> = {};

/** For airports without their own photo: a Malaysia image that shows no particular airport. */
export const FALLBACK_HERO: ImageId | undefined = undefined;

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

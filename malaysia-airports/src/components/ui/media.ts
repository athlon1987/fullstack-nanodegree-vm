import type { StaticImageData } from 'next/image';
import type { Lang } from '@/content/types';

/**
 * A photograph for the media primitives (`HeroMedia`, `MediaCard`, `CardMedia`). Entries of the
 * photo library (`src/content/images.ts`) convert to this with `toMediaImage(entry, lang)`; any
 * other source can build one directly.
 */
export interface MediaImage {
  /** A path under `/public` (the photo library) or a static import (width, height and blur inferred). */
  src: string | StaticImageData;
  /** The text alternative in the page language. `''` when the image is decorative (the words beside it say it all). */
  alt: string;
  /** Intrinsic size. The primitives always use `fill` inside a reserved box, so it is informative only. */
  width?: number;
  height?: number;
  /** The point kept in frame when the image is cropped, as fractions from the top left (0 to 1), as in the photo library. Default centre. */
  focal?: { x: number; y: number };
  /** A tiny base64 placeholder shown while the image loads (the library and static imports provide one). */
  blurDataURL?: string;
  /** A short credit line ("Photo: Name, CC BY-SA 4.0"), shown small and quiet where the primitive allows. */
  credit?: string;
}

/** The fields of a photo-library entry (`src/content/images.ts`) that the primitives read. */
export interface LibraryImageLike {
  src: string;
  width: number;
  height: number;
  alt: Record<Lang, string>;
  focal: { x: number; y: number };
  blurDataURL?: string;
  credit?: { author: string; licence: string };
}

/**
 * A photo-library entry as a `MediaImage` in the page language.
 *
 * @param decorative  `true` when the words beside the image already say everything (a card title
 *                    over a photograph of the same place): the alt text is dropped so screen
 *                    readers do not hear it twice.
 * @param credit      `true` to carry a short credit line (heroes); the full credits stay on the credits page.
 *
 * @example <HeroMedia image={toMediaImage(IMAGES['klia-t1-hall'], lang, { credit: true })} preload />
 */
export function toMediaImage(entry: LibraryImageLike, lang: Lang, options: { decorative?: boolean; credit?: boolean } = {}): MediaImage {
  return {
    src: entry.src,
    width: entry.width,
    height: entry.height,
    alt: options.decorative ? '' : entry.alt[lang],
    focal: entry.focal,
    blurDataURL: entry.blurDataURL,
    credit: options.credit && entry.credit ? `${lang === 'ms' ? 'Foto' : 'Photo'}: ${entry.credit.author}, ${entry.credit.licence}` : undefined,
  };
}

/** CSS `object-position` for a focal point (fractions 0 to 1). */
export function objectPosition(focal?: MediaImage['focal']): string {
  if (!focal) return '50% 50%';
  const percent = (value: number) => `${Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10}%`;
  return `${percent(focal.x)} ${percent(focal.y)}`;
}

/** `placeholder` and `blurDataURL` props for next/image: a blur when one is known, otherwise none. */
export function placeholderProps(image: MediaImage): { placeholder: 'blur' | 'empty'; blurDataURL?: string } {
  const blur = image.blurDataURL ?? (typeof image.src === 'object' ? image.src.blurDataURL : undefined);
  return blur ? { placeholder: 'blur', blurDataURL: blur } : { placeholder: 'empty' };
}

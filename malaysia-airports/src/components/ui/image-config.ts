/**
 * The image optimizer's widths and qualities, in one place: `next.config.ts` passes them to
 * Next.js (`images`), and `photoAttributes` (photo.tsx) writes only URLs the optimizer accepts.
 *
 * The widths are Next.js 16's defaults (`photo.test.ts` checks that they still are). Qualities:
 * 65 heroes, 60 cards and the place band, 75 the default (credits thumbnails), and the lower
 * phone renditions of full-width photographs (redesign 3, docs/qa/fixes/redesign3-perf.md):
 * 55 for a hero on a phone, 50 for the place band's 140 px strip.
 */
export const IMAGE_DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const IMAGE_SIZES = [32, 48, 64, 96, 128, 256, 384];
export const IMAGE_QUALITIES = [50, 55, 60, 65, 75];

/** Every width the optimizer serves, smallest first. */
export const IMAGE_ALL_SIZES = [...IMAGE_SIZES, ...IMAGE_DEVICE_SIZES].sort((a, b) => a - b);

/**
 * The widest rendition a phone picks for a full-width photograph (`sizes="100vw"`): 828 px covers
 * a 414 px screen at 2x. `phoneQuality` applies to this width and below.
 */
export const IMAGE_PHONE_MAX_WIDTH = 828;

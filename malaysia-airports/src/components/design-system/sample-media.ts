import { DESTINATION_IMAGES, DISCOVER_IMAGES, HOME_HERO_IMAGES, IMAGES, type ImageId } from '@/content/images';
import type { Lang } from '@/content/types';
import { toMediaImage, type MediaImage } from '@/components/ui/media';
import canopy from './samples/sample-canopy.jpg';
import dusk from './samples/sample-dusk.jpg';
import highkey from './samples/sample-highkey.jpg';
import warm from './samples/sample-warm.jpg';

/**
 * Synthetic sample images for the style guide (generated gradients: no people, no places, no
 * licence needed). They stand in until the photo library (`src/content/images.ts`) has pictures,
 * and `highkey` stays as the worst case for the scrim proof. Decorative here (`alt: ''`): every
 * specimen is captioned.
 */
export const SAMPLE_MEDIA = {
  dusk: { src: dusk, alt: '', focal: { x: 0.7, y: 0.7 } },
  canopy: { src: canopy, alt: '' },
  warm: { src: warm, alt: '' },
  /** A white, high-key field: the hardest background for light text. */
  highkey: { src: highkey, alt: '' },
} satisfies Record<string, MediaImage>;

/**
 * The pictures the style guide shows: real photographs from the library once it has them (with
 * their own alt text and, for the hero, a credit), otherwise the synthetic samples.
 */
export function styleGuideMedia(lang: Lang): { hero: MediaImage; heroIsSample: boolean; cards: [MediaImage, MediaImage, MediaImage] } {
  const library = (id: ImageId | undefined, credit = false) => (id === undefined ? undefined : toMediaImage(IMAGES[id], lang, { credit }));
  const heroId = HOME_HERO_IMAGES[0];
  const pool = [...DISCOVER_IMAGES, ...DESTINATION_IMAGES];
  const hero = library(heroId, true);
  return {
    hero: hero ?? SAMPLE_MEDIA.dusk,
    heroIsSample: !hero,
    cards: [library(pool[0]) ?? SAMPLE_MEDIA.canopy, library(pool[1]) ?? SAMPLE_MEDIA.dusk, library(pool[2]) ?? SAMPLE_MEDIA.warm],
  };
}

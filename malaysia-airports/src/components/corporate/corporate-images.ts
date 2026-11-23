import type { Lang } from '@/content/types';
import { IMAGES, type ImageId } from '@/content/images';
import { toMediaImage, type MediaImage } from '@/components/ui/media';
import type { CorporateNavId } from './corporate-sections';

/**
 * Redesign stage two: header photographs for the corporate pages that have a truthful one. Each
 * shows one of the company's own airports, as its alt text says: KLIA Terminal 1 from the air
 * (the company), the Terminal 1 roof canopies (who we are), the Terminal 1 roofline across the
 * airfield (the network) and an aircraft at a KLIA Terminal 2 gate (business with airlines and
 * partners). Careers, sustainability, governance, media and contact have no truthful photograph
 * in the library (no staff, no environmental work, no offices), so they keep the midnight band.
 */
export const CORPORATE_IMAGES: Readonly<Partial<Record<CorporateNavId, ImageId>>> = {
  overview: 'klia-t1-aerial',
  about: 'klia-t1-roof',
  network: 'klia-t1-airfield',
  business: 'klia2-terminal',
};

/** The header photograph of a corporate page, with its short credit line, or `undefined`. */
export function corporateImage(id: CorporateNavId, lang: Lang): MediaImage | undefined {
  const imageId = CORPORATE_IMAGES[id];
  return imageId ? toMediaImage(IMAGES[imageId], lang, { credit: true }) : undefined;
}

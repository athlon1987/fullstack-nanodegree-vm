import 'server-only';
import { serviceImageFor } from '@/content/images';
import type { Lang } from '@/content/types';
import { toMediaImage, type MediaImage } from '@/components/ui/media';

/**
 * The photograph of a service page's place band (critique-redesign2 item 1). Redesign three: the
 * section's own photograph where the library has one (`SERVICE_IMAGES`: the KLIA Ekspres for KLIA
 * transport, the C-gates roof for its lounges), else the airport overview's first hero photograph
 * (`heroForAirport`: that airport's, else the Malaysia fallback, never another airport's). The
 * page heading names the place, so the picture is decorative; its credit shows. Server only: the
 * photo library stays off the client (`service-frame.tsx` is also imported by Client Components).
 */
export type ServiceSection = 'transport' | 'parking' | 'facilities' | 'shop-dine' | 'lounges' | 'transit';

export function servicePlace(slug: string, lang: Lang, section?: ServiceSection): MediaImage | undefined {
  const entry = section ? serviceImageFor(slug, section) : serviceImageFor(slug, '');
  return entry ? toMediaImage(entry, lang, { decorative: true, credit: true }) : undefined;
}

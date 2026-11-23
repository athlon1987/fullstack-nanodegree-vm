import 'server-only';
import { heroForAirport } from '@/content/images';
import type { Lang } from '@/content/types';
import { toMediaImage, type MediaImage } from '@/components/ui/media';

/**
 * The photograph of a service page's place band (critique-redesign2 item 1): the airport
 * overview's own first hero photograph (`heroForAirport`: that airport's, else the Malaysia
 * fallback, never another airport's). The airport's name is the page heading under it, so the
 * picture is decorative; its credit shows. Server only: the photo library stays off the client
 * (`service-frame.tsx` is also imported by Client Components).
 */
export function servicePlace(slug: string, lang: Lang): MediaImage | undefined {
  const entry = heroForAirport(slug);
  return entry ? toMediaImage(entry, lang, { decorative: true, credit: true }) : undefined;
}

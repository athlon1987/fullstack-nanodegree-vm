import type { MetadataRoute } from 'next';
import { getT } from '@/lib/i18n';
import { APP_ICONS, BRAND_COLORS } from '@/components/platform/brand';

/**
 * `/manifest.webmanifest` (linked from every page by Next.js). Installable on Android, desktop
 * Chrome and Edge; iOS uses the Apple touch icon. One manifest serves both languages: it is in
 * English with Malay localised members where browsers support them, and start and shortcut URLs
 * carry no locale, so `src/proxy.ts` sends each visitor to their own language.
 */
export default function manifest(): MetadataRoute.Manifest {
  const en = getT('en');
  const ms = getT('ms');
  const localised = {
    description_localized: { ms: ms('platformPages.manifest.description') },
  };
  return {
    id: '/',
    name: en('common.appName'),
    short_name: en('platformPages.manifest.shortName'),
    description: en('platformPages.manifest.description'),
    lang: 'en',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: BRAND_COLORS.page,
    theme_color: BRAND_COLORS.page,
    categories: ['travel', 'navigation'],
    icons: [
      { src: APP_ICONS.any192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: APP_ICONS.any512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: APP_ICONS.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: en('platformPages.manifest.flights'), url: '/airports?then=flights' },
      { name: en('platformPages.manifest.journey'), url: '/journey' },
      { name: en('platformPages.manifest.offline'), url: '/offline' },
    ],
    ...localised,
  };
}

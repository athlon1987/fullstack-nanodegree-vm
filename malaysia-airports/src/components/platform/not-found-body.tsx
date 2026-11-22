import { getT } from '@/lib/i18n';
import type { Lang } from '@/content/types';
import { LocaleLink } from '@/components/common/locale-link';
import { ShortSharedCache } from '@/components/platform/short-cache';
import { HeroArt } from '@/components/home/hero-art';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

/**
 * The localised "Page not found" body inside the site shell: `[lang]/not-found.tsx` and
 * `MissingPage` both render it, so the 404 reads the same however it was reached.
 * `ShortSharedCache` keeps 404 responses out of shared caches for more than a minute (security-12).
 *
 * Direction v2: a midnight band with the home's "KLIA at dusk" art behind a scrim (an `on-media`
 * scope: light ink, light focus ring), a big gold "404" and three ways back in. Static, no script.
 */
export function NotFoundBody({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <div className="on-media relative isolate flex flex-1 flex-col overflow-hidden bg-midnight text-ink">
      <HeroArt className="absolute inset-0 -z-20" />
      <span aria-hidden="true" className="scrim-left absolute inset-0 -z-10 bg-[color-mix(in_srgb,var(--color-midnight)_45%,transparent)]" />
      <Container className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        <ShortSharedCache />
        <div className="max-w-2xl">
          <p className="type-data-xl text-gold-bright">404</p>
          <h1 className="type-display-xl mt-4 text-ink">{t('errors.notFoundTitle')}</h1>
          <p className="type-body-lg mt-6 max-w-reading text-ink-2">{t('errors.notFoundBody')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild iconEnd="arrow-right">
              <LocaleLink href="/">{t('errors.backHome')}</LocaleLink>
            </Button>
            <Button asChild variant="glass" iconStart="search">
              <LocaleLink href="/search">{t('search.label')}</LocaleLink>
            </Button>
            <Button asChild variant="glass" iconStart="tower-control">
              <LocaleLink href="/airports">{t('nav.airports')}</LocaleLink>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

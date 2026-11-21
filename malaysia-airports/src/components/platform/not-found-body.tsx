import { getT } from '@/lib/i18n';
import type { Lang } from '@/content/types';
import { RebungRule } from '@/components/art/patterns';
import { LocaleLink } from '@/components/common/locale-link';
import { ShortSharedCache } from '@/components/platform/short-cache';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

/**
 * The localised "Page not found" body inside the site shell: `[lang]/not-found.tsx` and
 * `MissingPage` both render it, so the 404 reads the same however it was reached.
 * `ShortSharedCache` keeps 404 responses out of shared caches for more than a minute (security-12).
 */
export function NotFoundBody({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-16 sm:py-24">
      <ShortSharedCache />
      <p className="type-data-lg text-ink-3">404</p>
      <h1 className="type-display-lg mt-3 text-ink">{t('errors.notFoundTitle')}</h1>
      <RebungRule className="mt-6 max-w-40" />
      <p className="type-body-lg mt-6 max-w-reading text-ink-2">{t('errors.notFoundBody')}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild iconEnd="arrow-right">
          <LocaleLink href="/">{t('errors.backHome')}</LocaleLink>
        </Button>
        <Button asChild variant="secondary" iconStart="search">
          <LocaleLink href="/search">{t('search.label')}</LocaleLink>
        </Button>
        <Button asChild variant="secondary" iconStart="tower-control">
          <LocaleLink href="/airports">{t('nav.airports')}</LocaleLink>
        </Button>
      </div>
    </Container>
  );
}

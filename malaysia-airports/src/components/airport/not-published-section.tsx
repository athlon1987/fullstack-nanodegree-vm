'use client';

import { useSearchParams } from 'next/navigation';
import { getAirport } from '@/content/airports';
import { useT } from '@/lib/i18n/client';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { overlays } from '@/components/shell/overlay-store';
import { getSection, isAirportSection, sectionPath } from '@/components/shell/sections';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export interface NotPublishedContact {
  label: string;
  value: string;
  href: string;
}

interface NotPublishedSectionProps {
  /** The official passenger website, from the source registry. */
  officialUrl?: string;
  /** The group phone line, from the content layer. */
  phone?: NotPublishedContact;
}

/** The static shell: a generic heading until the parameters are read. */
export function NotPublishedSectionFallback() {
  const t = useT();
  return <h1 className="type-display-lg text-ink">{t('shellExtras.notPublished.metaTitle')}</h1>;
}

/**
 * Says plainly that a section is not published for an airport, and where to check instead.
 * Nothing is guessed: the only facts shown are the official website and phone line.
 */
export function NotPublishedSection({ officialUrl, phone }: NotPublishedSectionProps) {
  const t = useT();
  const params = useSearchParams();
  const airport = getAirport(params.get('airport') ?? '');
  const sectionParam = params.get('section');
  const section = isAirportSection(sectionParam) ? sectionParam : undefined;

  if (!airport || !section) {
    return (
      <>
        <NotPublishedSectionFallback />
        <p className="type-body-lg mt-4 max-w-reading text-ink-2">{t('shellExtras.notPublished.missing')}</p>
        <LocaleLink href="/airports" className="link-action mt-4 text-ink">
          {t('nav.airports')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
        </LocaleLink>
      </>
    );
  }

  const label = t(getSection(section).labelKey);
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 sm:mb-6">
          <Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label }]} />
        </div>
        <h1 className="type-display-lg max-w-narrow text-ink">{t('shellExtras.notPublished.title', { section: label, airport: airport.shortName })}</h1>
        <p className="type-body-lg mt-4 max-w-reading text-ink-2">{t('shellExtras.notPublished.lead', { section: label.toLowerCase(), airport: airport.name })}</p>
      </div>

      <section aria-labelledby="not-published-check" className="flex max-w-narrow flex-col gap-3 rounded-lg border border-line-strong bg-page-subtle p-5">
        <h2 id="not-published-check" className="type-title-md text-ink">
          {t('shellExtras.notPublished.checkTitle')}
        </h2>
        <ul className="flex flex-col gap-2">
          {officialUrl ? (
            <li>
              <ExternalLink variant="action" href={officialUrl} className="text-ink">
                {t('shellExtras.notPublished.officialSite')}
              </ExternalLink>
            </li>
          ) : null}
          {phone ? (
            <li className="flex flex-wrap items-center gap-x-2">
              <Icon name="phone" size="sm" className="text-primary-ink" />
              <span className="type-body-sm text-ink-2">{phone.label}:</span>
              <a href={phone.href} className="link-action text-ink">
                {phone.value}
              </a>
            </li>
          ) : null}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild iconEnd="arrow-right">
          <LocaleLink href={sectionPath(airport.slug, 'overview')}>{t('shellExtras.notPublished.overview', { airport: airport.shortName })}</LocaleLink>
        </Button>
        <Button variant="secondary" iconStart="map-pin" onClick={() => overlays.openAirportSwitcher(section)}>
          {t('shellExtras.notPublished.otherAirport')}
        </Button>
      </div>
    </div>
  );
}

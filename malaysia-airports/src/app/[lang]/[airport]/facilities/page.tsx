import { Suspense } from 'react';
import { terminalLabel } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { PrototypeGapsLink } from '@/components/common/prototype-gaps-link';
import { TranslationNotice } from '@/components/common/translation-notice';
import { FacilitiesDirectory } from '@/components/facilities/facilities-directory';
import { facilityViews, needsTranslationNotice, officialPages, sourceLookup } from '@/components/map/map-view.server';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export const generateStaticParams = () => sectionStaticParams('facilities');

/** Fully static for the airports that have facilities; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/facilities'>) {
  const { lang, airport: slug } = await params;
  const airport = localAirport(slug, lang);
  const t = getT(toLang(lang));
  return airportSectionMetadata(params, 'facilities', airport ? { description: t('mapPages.facilities.metaDescription', { airport: airport.name }) } : {});
}

/** Facilities and services directory: every published facility with its source. */
export default function FacilitiesPage({ params }: PageProps<'/[lang]/[airport]/facilities'>) {
  return (
    <I18nPageScope namespaces={['mapPages']}>
      <Suspense
        fallback={
          <Container className="py-10" aria-hidden="true">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-8 h-64 w-full" />
          </Container>
        }
      >
        <Facilities params={params} />
      </Suspense>
  
    </I18nPageScope>
  );
}

async function Facilities({ params }: { params: AirportPageParams }) {
  const { lang, t, airport, content, sections } = await loadAirportPage(params, 'facilities');
  const items = facilityViews(content, lang);
  const official = officialPages(content);
  const translationMissing = needsTranslationNotice(
    content.facilities.flatMap((facility) => [facility.name, facility.description, facility.locationNote, facility.access]),
    lang,
  );

  return (
    <>
      <PageHeader
        eyebrow={airport.shortName}
        title={t('nav.facilities')}
        lead={t('mapPages.facilities.lead', { airport: airport.shortName })}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.facilities') }]} />}
        actions={
          sections.includes('map') ? (
            <Button asChild variant="secondary" iconStart="map">
              <LocaleLink href={`/${airport.slug}/map`}>{t('nav.map')}</LocaleLink>
            </Button>
          ) : undefined
        }
      />
      <Container className="pb-section">
        {translationMissing ? <TranslationNotice className="mb-6" /> : null}
        <FacilitiesDirectory
          items={items}
          sources={sourceLookup(items.flatMap((item) => item.sourceIds))}
          terminals={airport.terminals.map((terminal) => ({ id: terminal.id, label: terminalLabel(airport, terminal.id, lang, { short: true }) }))}
          airport={airport.slug}
          airportName={airport.shortName}
        />

        {/* D-05 hand-off (round 2): one line to the single list on About this prototype. */}
        <PrototypeGapsLink
          lang={lang}
          airport={airport.slug}
          airportName={airport.shortName}
          id="facility-gaps-title"
          title={t('mapPages.facilities.gapsTitle')}
          officialHref={official.airport}
          officialLabel={t('mapPages.officialAirportPage')}
        />
      </Container>
    </>
  );
}

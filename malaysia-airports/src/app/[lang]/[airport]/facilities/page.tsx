import { Suspense } from 'react';
import { getAirport, pick, resolveSources, terminalLabel } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { PageHeader } from '@/components/common/page-header';
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
  const airport = getAirport(slug);
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
  const gaps = content.guidesNotes.find((note) => note.id === `${airport.slug}-content-gaps`);
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

        <section aria-labelledby="facility-gaps-title" className="mt-14 grid gap-6 border-t border-line pt-10 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-10">
          <h2 id="facility-gaps-title" className="type-title-lg text-ink">
            {t('mapPages.facilities.gapsTitle')}
          </h2>
          <div className="min-w-0 max-w-reading">
            {gaps ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="type-title-sm text-ink">{pick(gaps.title, lang)}</p>
                  <ProvenanceTag provenance={gaps.provenance} />
                </div>
                <p className="type-body mt-2 text-ink-2">{pick(gaps.body, lang)}</p>
                <SourceNote sources={resolveSources(gaps.sources)} className="mt-1" />
              </>
            ) : (
              <p className="type-body text-ink-2">{t('empty.officialPointer')}</p>
            )}
            <p className="type-body-sm mt-4 text-ink-2">{t('mapPages.facilities.sourcesNote')}</p>
            <ExternalLink href={official.airport} variant="action" className="type-body-sm mt-1">
              {t('mapPages.officialAirportPage')}
            </ExternalLink>
          </div>
        </section>
      </Container>
    </>
  );
}

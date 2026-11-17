import { Suspense } from 'react';
import { getAirport, isMultiTerminal, terminalLabel } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { airportSectionMetadata, loadAirportPage, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { TranslationNotice } from '@/components/common/translation-notice';
import { MapExplorer } from '@/components/map/map-explorer';
import { MapUnavailable } from '@/components/map/map-unavailable';
import { buildMapView, mapSourceIds, needsTranslationNotice, officialPages, sourceLookup } from '@/components/map/map-view.server';
import { airportsWithSection } from '@/components/shell/sections.server';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Airports with a schematic map, plus those with a facilities directory: the latter get the
 * honest "no map yet" page that points to the directory and the official site.
 */
export function generateStaticParams() {
  const slugs = new Set([...airportsWithSection('map'), ...airportsWithSection('facilities')]);
  return [...(slugs.size > 0 ? slugs : new Set(['kul']))].map((airport) => ({ airport }));
}

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/map'>) {
  const { lang, airport: slug } = await params;
  const airport = getAirport(slug);
  const t = getT(toLang(lang));
  return airportSectionMetadata(params, 'map', airport ? { description: t('mapPages.metaDescription', { airport: airport.name }) } : {});
}

/** Terminal map and wayfinding: a schematic map, search, filters, details and written routes. */
export default function MapPage({ params }: PageProps<'/[lang]/[airport]/map'>) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <TerminalMap params={params} />
    </Suspense>
  );
}

async function TerminalMap({ params }: { params: AirportPageParams }) {
  const { lang, t, airport, content, sections } = await loadAirportPage(params);
  const maps = content.maps.map((model) => buildMapView(model, content, lang));
  const official = officialPages(content);
  const facilitiesHref = sections.includes('facilities') ? `/${airport.slug}/facilities` : undefined;
  const translationMissing = needsTranslationNotice(
    content.maps.flatMap((model) => [model.name, model.note, ...model.pois.map((poi) => poi.name), ...model.levels.map((level) => level.name)]),
    lang,
  );
  const terminalLabels = Object.fromEntries(airport.terminals.map((terminal) => [terminal.id, terminalLabel(airport, terminal.id, lang)]));

  return (
    <>
      <PageHeader
        eyebrow={maps.length > 0 && isMultiTerminal(airport) ? maps.map((map) => map.terminalLabel).join(' · ') : airport.shortName}
        title={t('mapPages.title')}
        lead={maps.length > 0 ? t('mapPages.lead') : undefined}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.map') }]} />}
      />
      <Container className="pb-section">
        {translationMissing ? <TranslationNotice className="mb-6" /> : null}
        {maps.length > 0 ? (
          <MapExplorer
            maps={maps}
            sources={sourceLookup(mapSourceIds(maps))}
            airportSlug={airport.slug}
            terminalLabels={terminalLabels}
            facilitiesHref={facilitiesHref}
            officialMapUrl={official.map?.url}
            officialAirportUrl={official.airport}
          />
        ) : (
          <MapUnavailable t={t} airportName={airport.name} facilitiesHref={facilitiesHref} officialAirportUrl={official.airport} />
        )}
      </Container>
    </>
  );
}

function MapSkeleton() {
  return (
    <Container className="py-10" aria-hidden="true">
      <Skeleton className="h-10 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[23rem_1fr]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </Container>
  );
}

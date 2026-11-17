import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAirport } from '@/content/airports';
import { getT } from '@/lib/i18n';
import { loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { FlightBoardExplorer } from '@/components/flights/flight-board-explorer';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

/** Only airports with a demonstration board are prerendered; others answer with the not-found page. */
export function generateStaticParams() {
  return sectionStaticParams('flights');
}

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/flights'>): Promise<Metadata> {
  const { lang, airport: slug } = await params;
  const t = getT(lang);
  const airport = getAirport(slug);
  if (!airport) return { title: t('errors.notFoundTitle') };
  return {
    title: t('flightPages.board.metaTitle', { airport: airport.shortName }),
    description: t('flightPages.board.metaDescription', { airport: airport.name }),
  };
}

/**
 * Departures and arrivals for one airport. The header and the board's frame are static; rows are
 * computed on the client from the demonstration provider after hydration, and the filters live
 * in the URL (`?dir=`, `?t=`, `?q=`, `?s=`), read inside the explorer's own Suspense boundary.
 */
export default function FlightsPage({ params }: PageProps<'/[lang]/[airport]/flights'>) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="mt-8 h-96 w-full" />
        </Container>
      }
    >
      <Flights params={params} />
    </Suspense>
  );
}

async function Flights({ params }: { params: AirportPageParams }) {
  const { t, airport } = await loadAirportPage(params, 'flights');
  return (
    <>
      <PageHeader
        title={t('flightPages.board.title')}
        lead={t('flightPages.board.lead', { airport: airport.shortName })}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.flights') }]} />}
      />
      <Container className="pb-section">
        <FlightBoardExplorer airport={airport.slug} />
      </Container>
    </>
  );
}

import type { Metadata } from 'next';
import { getAirport } from '@/content/airports';
import { getT } from '@/lib/i18n';
import { loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { FlightBoardExplorer } from '@/components/flights/flight-board-explorer';
import { Container } from '@/components/ui/container';

/** Only airports with a demonstration board are prerendered; others answer with the not-found page. */
export function generateStaticParams() {
  return sectionStaticParams('flights');
}

/**
 * Fully static for those airports (round 2; the C-06 hand-off): any other airport waits for the
 * complete render, so its first response is already a 404, and the page needs no fallback.
 */
export const ensureStatic = 'navigation';

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
 * in the URL (`?dir=`, `?t=`, `?q=`, `?s=`), read by the explorer after hydration.
 *
 * No page-level `<Suspense>` (round 2, as on the airport overview): it only made React send a
 * skeleton and reveal the board later with its throttled script (LCP 4.4 s in two of three runs).
 */
export default function FlightsPage({ params }: PageProps<'/[lang]/[airport]/flights'>) {
  return <Flights params={params} />;
}

async function Flights({ params }: { params: AirportPageParams }) {
  const { t, airport } = await loadAirportPage(params, 'flights');
  return (
    <>
      <PageHeader
        title={t('flightPages.board.title')}
        lead={t('flightPages.board.lead', { airport: airport.shortName })}
        // A-01 (round 2): on phones the first screen goes to the board; the lead stays for screen
        // readers, and the board footer repeats that times are airport time.
        leadClassName="max-sm:sr-only"
        tightOnPhones
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.flights') }]} />}
      />
      <Container className="pb-section">
        <FlightBoardExplorer airport={airport.slug} />
      </Container>
    </>
  );
}

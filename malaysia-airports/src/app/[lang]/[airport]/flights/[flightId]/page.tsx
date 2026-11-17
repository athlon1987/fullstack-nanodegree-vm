import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAirport, resolveSources, type Source } from '@/content';
import { formatFlightNumber } from '@/lib/flights';
import { getT } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
import { loadAirportPage } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { AirlineFacts, hasAirlineFacts } from '@/components/flights/airline-facts';
import { DisruptionHelp } from '@/components/flights/disruption-help';
import { FlightDetail } from '@/components/flights/flight-detail';
import { FlightNotFound } from '@/components/flights/flight-not-found';
import { flightTitle, identifyFlight } from '@/components/flights/identify-flight';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

type FlightPageProps = PageProps<'/[lang]/[airport]/flights/[flightId]'>;

/*
 * Flight ids cannot be enumerated at build time (they carry a date), so this route has no
 * `generateStaticParams`: `params` is awaited inside Suspense and the page renders per request
 * (Next.js notes, section 5). The flight's identity comes from the id alone; its status is
 * computed on the client from the demonstration provider.
 */

export async function generateMetadata({ params }: FlightPageProps): Promise<Metadata> {
  const { lang, airport: slug, flightId } = await params;
  const t = getT(lang);
  const airport = getAirport(slug);
  const flight = airport ? identifyFlight(flightId, airport.slug) : null;
  // Demonstration flights change every day: keep them out of search engines.
  if (!airport || !flight) return { title: t('flightPages.notFound.title'), robots: { index: false } };
  return {
    title: `${flightTitle(flight, t)}: ${airport.shortName}`,
    description: t('flightPages.detail.metaDescription', { number: formatFlightNumber(flight), airport: airport.name }),
    robots: { index: false, follow: true },
  };
}

export default function FlightPage({ params }: FlightPageProps) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-6 h-12 w-80 max-w-full" />
          <Skeleton className="mt-10 h-72 w-full" />
        </Container>
      }
    >
      <Flight params={params} />
    </Suspense>
  );
}

async function Flight({ params }: { params: FlightPageProps['params'] }) {
  const { flightId } = await params;
  const { lang, t, airport, content } = await loadAirportPage(params, 'flights');
  const flight = identifyFlight(flightId, airport.slug);
  const crumbs = [
    { label: airport.shortName, href: `/${airport.slug}` },
    { label: t('nav.flights'), href: `/${airport.slug}/flights` },
  ];

  if (!flight) {
    return (
      <>
        <PageHeader
          title={t('flightPages.notFound.title')}
          lead={t('flightPages.notFound.unknownBody')}
          breadcrumbs={<Breadcrumbs items={[...crumbs, { label: t('flightPages.notFound.crumb') }]} />}
        />
        <Container className="pb-section">
          <FlightNotFound airport={airport.slug} reason="unknown" showMessage={false} />
        </Container>
      </>
    );
  }

  const title = flightTitle(flight, t);
  const date = formatDate(flight.scheduled, lang, 'weekday', airport.timezone);
  const sourceIds = [...new Set(content.guidesNotes.flatMap((note) => note.sources))];
  const sources: Record<string, Source> = Object.fromEntries(resolveSources(sourceIds).map((source) => [source.id, source]));
  const airline = content.airlines.find((item) => item.code === flight.airline.code);

  return (
    <>
      <PageHeader
        eyebrow={flight.direction === 'd' ? t('flightPages.detail.eyebrowDeparture', { date }) : t('flightPages.detail.eyebrowArrival', { date })}
        title={title}
        lead={t('flightPages.detail.lead', {
          airline: flight.airline.name,
          origin: flight.origin.city,
          originCode: flight.origin.code,
          destination: flight.destination.city,
          destinationCode: flight.destination.code,
        })}
        breadcrumbs={<Breadcrumbs items={[...crumbs, { label: formatFlightNumber(flight) }]} />}
      />
      <Container className="pb-section">
        <FlightDetail
          flightId={flight.id}
          airport={airport.slug}
          title={title}
          journeyContent={{ airport, guidesNotes: content.guidesNotes }}
          sources={sources}
          disruption={<DisruptionHelp lang={lang} airline={flight.airline.name} />}
          airlineFacts={airline && hasAirlineFacts(airline) ? <AirlineFacts lang={lang} airport={airport} airline={airline} /> : undefined}
        />
      </Container>
    </>
  );
}

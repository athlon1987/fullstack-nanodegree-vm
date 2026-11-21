import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAirport, getNotices, resolveSources, type Source } from '@/content';
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
import { journeyExtras, publishedCheckInFor } from '@/components/flights/journey-content';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

type FlightPageProps = PageProps<'/[lang]/[airport]/flights/[flightId]'>;

/*
 * Flight ids cannot be enumerated at build time (they carry a date), so this route has no
 * `generateStaticParams`: `params` is awaited inside Suspense and the page renders per request
 * (Next.js notes, section 5). The flight's identity comes from the id alone; its status comes
 * from the flight feed on the client. Malformed and unknown ids get a small 404, and codeshare
 * numbers a 308 to the operating flight, before this page is built (`src/lib/providers/flight-route.ts`,
 * called from `src/proxy.ts`).
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
  const notices = getNotices(airport.slug);
  const extras = journeyExtras(content, lang);
  const sourceIds = [
    ...new Set([
      ...content.guidesNotes.flatMap((note) => note.sources),
      ...notices.flatMap((notice) => notice.sources),
      ...(extras.places ?? []).flatMap((place) => place.sources),
      ...Object.values(extras.airlineAssistance ?? {}).flatMap((service) => service.sources),
      ...(extras.fastTrack?.sources ?? []),
    ]),
  ];
  const sources: Record<string, Source> = Object.fromEntries(resolveSources(sourceIds).map((source) => [source.id, source]));
  const airline = content.airlines.find((item) => item.code === flight.airline.code);
  const airlineLabel = `${flight.airline.name} · ${flight.direction === 'd' ? t('flightPages.detail.eyebrowDeparture', { date }) : t('flightPages.detail.eyebrowArrival', { date })}`;

  return (
    <>
      <PageHeader
        eyebrow={airlineLabel}
        // Lining, tabular figures for the flight number in the display face (ux-frequent-20).
        title={<span className="lining-nums tabular-nums">{title}</span>}
        breadcrumbs={<Breadcrumbs items={[...crumbs, { label: formatFlightNumber(flight) }]} />}
        className="[&>div]:pb-5 sm:[&>div]:pb-6"
      />
      <Container className="pb-section">
        <FlightDetail
          flightId={flight.id}
          airport={airport.slug}
          title={title}
          journeyContent={{ airport, guidesNotes: content.guidesNotes, ...extras }}
          sources={sources}
          notices={notices}
          publishedCheckIn={flight.direction === 'd' && airline ? publishedCheckInFor(airline, lang) : undefined}
          disruption={<DisruptionHelp lang={lang} airline={flight.airline.name} />}
          airlineFacts={airline && hasAirlineFacts(airline) ? <AirlineFacts lang={lang} airport={airport} airline={airline} /> : undefined}
        />
      </Container>
    </>
  );
}


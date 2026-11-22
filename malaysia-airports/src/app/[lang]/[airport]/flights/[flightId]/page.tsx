import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { getNotices, resolveSources, type Source } from '@/content';
import { formatFlightNumber } from '@/lib/flights';
import { getT } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
import { localAirport, loadAirportPage, sectionStaticParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { MissingPage } from '@/components/common/missing-page';
import { AirlineFacts, hasAirlineFacts } from '@/components/flights/airline-facts';
import { DisruptionHelp } from '@/components/flights/disruption-help';
import { FlightDetail } from '@/components/flights/flight-detail';
import { flightIdentity } from '@/components/flights/flight-identity';
import { flightTitle } from '@/components/flights/flight-title';
import { identifyFlight } from '@/components/flights/identify-flight';
import { journeyExtras, publishedCheckInFor } from '@/components/flights/journey-content';
import { AirportBackdrop } from '@/components/airport/airport-backdrop';
import { I18nPageScope } from '@/lib/i18n/page-scope';

type FlightPageProps = PageProps<'/[lang]/[airport]/flights/[flightId]'>;

/*
 * Flight ids cannot be enumerated at build time (they carry a date), so this route has no
 * `generateStaticParams` and renders per request. The flight's identity comes from the id alone;
 * its status comes from the flight feed on the client. Malformed and unknown ids get a small 404,
 * and codeshare numbers a 308 to the operating flight, before this page is built
 * (`src/lib/providers/flight-route.ts`, called from `src/proxy.ts`).
 *
 * Round 5 (E-01, E-02): no page-level `<Suspense>`. Inside one, React sent the whole page as a
 * hidden segment at the end of the document and revealed it with its throttled `$RC` script, so
 * the `h1` painted late (LCP 4.2 to 5.3 s on a slow phone, performance 56 to 75). Without one,
 * Next.js sends the static start of the document at once (site and airport chrome) and the page
 * follows in document order, not hidden: the `h1`, the eyebrow, the summary frame and the status
 * card's timetable facts are in the HTML about 20 KB in; the status and times follow from the
 * feed. Nothing here reads the clock or request data, so the render is quick (tens of
 * milliseconds) and the same for everyone.
 *
 * `instant = false` is what allows that (Next.js 16.4, `instant`, "Disabling static shell
 * validation"): without it the build rejects `params` read outside `<Suspense>` on a route with
 * no `generateStaticParams` (blocking-prerender-dynamic). It is not one of the forbidden segment
 * exports (`dynamic`, `dynamicParams`, `revalidate`, `fetchCache`, `runtime`; Next.js notes,
 * Do/Don't 3), and it is set on this page only. The alternative, `generateStaticParams` with
 * `ensureStatic = 'navigation'` like the board, would store every flight page a visitor opens on
 * the server's disk for good (any date is a valid id), so it was not used. The trade-off: a
 * client navigation to a flight page waits for its server render (no skeleton), which takes
 * tens of milliseconds.
 */
export const instant = false;

export async function generateMetadata({ params }: FlightPageProps): Promise<Metadata> {
  const { lang, airport: slug, flightId } = await params;
  const t = getT(lang);
  const airport = localAirport(slug, lang);
  const flight = airport ? identifyFlight(flightId, airport.slug) : null;
  // Demonstration flights change every day: keep them out of search engines.
  if (!airport || !flight) return { title: t('flightPages.notFound.title'), robots: { index: false } };
  return {
    alternates: languageAlternates(lang, `/${slug}/flights/${flightId}`),
    title: `${flightTitle(flight, t)}: ${airport.shortName}`,
    description: t('flightPages.detail.metaDescription', { number: formatFlightNumber(flight), airport: airport.name }),
    robots: { index: false, follow: true },
  };
}

export default function FlightPage({ params }: FlightPageProps) {
  return (
    <I18nPageScope namespaces={['home']}>
      <Flight params={params} />
    </I18nPageScope>
  );
}

async function Flight({ params }: { params: FlightPageProps['params'] }) {
  const { airport: slug, flightId } = await params;
  // An airport without a board, or a flight the timetable does not know: `src/proxy.ts` answers
  // these with a 404 before this page runs (`flight-route.ts`). This page cannot set the status
  // itself: Next.js sends the static start of the document (◐ in the build) before the page
  // renders, so a `notFound()` here arrived after a 200 and left Next's error document. Should
  // one get through, it gets `MissingPage` (the not-found body in the site shell, `noindex`).
  if (!sectionStaticParams('flights').some((listed) => listed.airport === slug)) return <MissingPage />;
  const { lang, t, airport, content } = await loadAirportPage(params, 'flights');
  const flight = identifyFlight(flightId, airport.slug);
  if (!flight) return <MissingPage />;
  const crumbs = [
    { label: airport.shortName, href: `/${airport.slug}` },
    { label: t('nav.flights'), href: `/${airport.slug}/flights` },
  ];

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
  const eyebrowFor = (day: string) => `${flight.airline.name} · ${flight.direction === 'd' ? t('flightPages.detail.eyebrowDeparture', { date: day }) : t('flightPages.detail.eyebrowArrival', { date: day })}`;
  // On phones the short date keeps the line from wrapping, so the h1 starts within the first
  // 200 px (A-01, round 2: it was at 201 px in English, under a two-line eyebrow).
  const airlineLabel = (
    <>
      <span className="sm:hidden">{eyebrowFor(formatDate(flight.scheduled, lang, 'short', airport.timezone))}</span>
      <span className="max-sm:hidden">{eyebrowFor(date)}</span>
    </>
  );

  return (
    <FlightDetail
      flightId={flight.id}
      airport={airport.slug}
      title={title}
      identity={flightIdentity(flight)}
      journeyContent={{ airport, guidesNotes: content.guidesNotes, ...extras }}
      sources={sources}
      notices={notices}
      publishedCheckIn={flight.direction === 'd' && airline ? publishedCheckInFor(airline, lang) : undefined}
      disruption={<DisruptionHelp lang={lang} airline={flight.airline.name} />}
      airlineFacts={airline && hasAirlineFacts(airline) ? <AirlineFacts lang={lang} airport={airport} airline={airline} /> : undefined}
      // Redesign round one: the header is a midnight band (the airport's photograph or pattern),
      // the flight card rises into its lower edge. The eyebrow and h1 are server HTML, inline.
      band={{
        backdrop: <AirportBackdrop slug={airport.slug} code={airport.code} lang={lang} variant="band" />,
        header: (
          <>
            {/* Redesign round one (critique items 4 and 18): a flight page has no airport bar or
                section tabs (globals.css, `data-flight-page`), so on phones the trail is back as its
                one "< Flights" link: the h1 still starts above 200 px (A-01). */}
            <div data-flight-page="" className="mb-2 sm:mb-4">
              <Breadcrumbs items={[...crumbs, { label: formatFlightNumber(flight) }]} />
            </div>
            <p className="type-caption font-semibold text-gold-bright">{airlineLabel}</p>
            {/* Lining, tabular figures for the flight number in the display face (ux-frequent-20). */}
            <h1 className="type-display-md mt-2 text-balance text-ink">
              <span className="lining-nums tabular-nums">{title}</span>
            </h1>
          </>
        ),
      }}
    />
  );
}

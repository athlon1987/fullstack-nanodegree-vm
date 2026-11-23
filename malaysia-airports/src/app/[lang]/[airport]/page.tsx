import { CLASSIFICATION_LABELS, airportSlugs, formatAsOf, getNotices, getSource, pick, resolveSources, type Provenance } from '@/content';
import { GROUP_CONTACTS, terminalLabel } from '@/content/airports';
import { AirportFlightSearch } from '@/components/airport/airport-flight-search';
import { LazyAirportFlightTools } from '@/components/airport/airport-flight-tools-lazy';
import { opsServicesFor } from '@/lib/providers/demo-operations';
import { cn } from '@/lib/cn';
import { AirportBanner } from '@/components/airport/airport-header';
import { MissingPage } from '@/components/common/missing-page';
import { NoticeList } from '@/components/airport/notice-list';
import { OpsStatusSection } from '@/components/flights/ops-status-section';
import { toNoticeViews } from '@/components/airport/notice-views.server';
import { airportSectionMetadata, loadAirportPage, type AirportPageParams } from '@/components/airport/section-page';
import { ExternalLink } from '@/components/common/external-link';
import { KeyFact } from '@/components/common/key-fact';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { NotPublished } from '@/components/common/not-published';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import { AIRPORT_SECTIONS, sectionPath, type AirportSectionId } from '@/components/shell/sections';
import { Callout } from '@/components/ui/callout';
import { DeferredImage } from '@/components/ui/deferred-image';
import { EXPLORE_IMAGES, IMAGES, objectPosition } from '@/content/images';
import { Card, CardLink } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { JsonLd, airportJsonLd } from '@/lib/seo';
import { I18nPageScope } from '@/lib/i18n/page-scope';

/**
 * Redesign round one (critique items 7 and 8): Explore shows four large midnight media cards
 * (the places people come to the overview for), not eight pastel icon tiles that repeated the
 * section tabs and the "What do you need" module. Every other section stays one tap away in the
 * section tabs, the Sections sheet and the persona module.
 */
const FEATURED_SECTIONS: readonly AirportSectionId[] = ['flights', 'map', 'shop-dine', 'lounges'];

/** Every airport in the registry gets an overview page, including directory-only ones. */
export function generateStaticParams() {
  return airportSlugs().map((airport) => ({ airport }));
}

/**
 * The overview is fully static for every listed airport. An unknown code then waits for the
 * complete render instead of serving the fallback shell, so its first response is already a 404.
 */
export const ensureStatic = 'navigation';

export function generateMetadata({ params }: PageProps<'/[lang]/[airport]'>) {
  return airportSectionMetadata(params, 'overview');
}

/**
 * Airport overview: the airport banner, the scoped flight search, mode-aware quick actions and a
 * board preview, the airport's notices, key facts with their sources, and a card for each section
 * the airport has. Airports with little or no verified content say so and point to the official
 * channels.
 *
 * `params` is awaited without a page-level `<Suspense>` (round 2, a deliberate exception to the
 * Next.js notes, Do/Don't 1): every airport is listed by `generateStaticParams` and
 * `ensureStatic = 'navigation'` refuses any other, so nothing here waits on a request. A
 * boundary only made React send a skeleton and reveal the body later with its throttled `$RC`
 * script (Suspense content above about 12.8 KB of shell is outlined): LCP was 4.4 s on a phone.
 */
export default function AirportPage({ params }: PageProps<'/[lang]/[airport]'>) {
  return (
    <I18nPageScope namespaces={['home']}>
      <Overview params={params} />
    </I18nPageScope>
  );
}

async function Overview({ params }: { params: AirportPageParams }) {
  if (!airportSlugs().includes((await params).airport)) return <MissingPage />;
  const { lang, t, airport, content, sections } = await loadAirportPage(params);
  const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
  const unverified = (field: (typeof airport.unverifiedFields)[number]): boolean => airport.unverifiedFields.includes(field);
  const tag = (field: (typeof airport.unverifiedFields)[number]): Provenance => (unverified(field) ? 'estimated' : 'official');
  const hint = (field: (typeof airport.unverifiedFields)[number]): string | undefined => (unverified(field) ? t('common.labels.unverified') : undefined);
  const limited = airport.depth === 'listing' || !content.hasContent;
  const official = getSource('mahb-airports-site');
  const notices = toNoticeViews(getNotices(airport.slug), lang).filter((notice) => notice.airport === airport.slug);
  const counts: Partial<Record<AirportSectionId, number>> = {
    facilities: content.facilities.length,
    transport: content.transport.length,
    parking: content.carParks.length,
    'shop-dine': content.outlets.length,
    lounges: content.facilities.filter((facility) => facility.category === 'lounge' || facility.category === 'hotel').length,
  };
  const available = AIRPORT_SECTIONS.filter((section) => section.id !== 'overview' && sections.includes(section.id));
  const featured = available.filter((section) => FEATURED_SECTIONS.includes(section.id));
  const explore = (featured.length >= 2 ? featured : available).slice(0, 4);
  // Fast Track, one record per KLIA terminal (D-02 hand-off, round 2). The records share their
  // provenance and sources, so both are shown once for the group (A-14).
  const bookable = content.facilities.filter((facility) => facility.id.endsWith('-fast-track') && facility.bookingUrl);
  // Round 4 (re-review 6.1.8): the airlines and the airport's own contact, only as far as the
  // content has them; otherwise "Not published", never a guess (needs MAHB data for most airports).
  const airlineNames = content.airlines.map((airline) => airline.name);
  const airlinesValue =
    airlineNames.length > 3 ? t('flightPages.overview.airlinesMore', { names: airlineNames.slice(0, 3).join(', '), count: airlineNames.length - 3 }) : airlineNames.join(', ');
  const airlinesOfficial = content.airlines.length > 0 && content.airlines.every((airline) => airline.basis !== 'third-party');
  const airlineSources = resolveSources([...new Set(content.airlines.flatMap((airline) => airline.sources))]);
  const groupValues = new Set(GROUP_CONTACTS.map((contact) => contact.value));
  const ownContacts = airport.contacts.filter((contact) => !groupValues.has(contact.value));
  const bookableSources = resolveSources([...new Set(bookable.flatMap((facility) => facility.sources))]);

  // Redesign round one: at-a-glance tiles for the sections a traveller checks first, with the
  // honest label of what is behind each (the board is a demonstration; counts are of our sources).
  const glance = [
    sections.includes('flights')
      ? { id: 'flights' as const, icon: 'plane-takeoff' as const, label: t('nav.flights'), value: t('flightPages.look.flightsValue'), note: t('flightPages.look.flightsNote') }
      : null,
    sections.includes('transport') && content.transport.length > 0
      ? { id: 'transport' as const, icon: 'train-front' as const, label: t('nav.groundTransport'), value: t.count('flightPages.look.transportValue', content.transport.length), note: t('flightPages.look.transportNote') }
      : null,
    sections.includes('parking') && content.carParks.length > 0
      ? { id: 'parking' as const, icon: 'square-parking' as const, label: t('nav.parking'), value: t.count('flightPages.look.parkingValue', content.carParks.length), note: t('flightPages.look.parkingNote') }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <>
      <JsonLd data={airportJsonLd(airport, lang)} />
      {/* Round 6 (review-3 9.1 item 7): the flight search first, on the first phone screen; the
          notices follow it. Redesign round one: it sits on the airport's cinematic header. */}
      <AirportBanner
        airport={airport}
        lang={lang}
        sections={sections}
        search={sections.includes('flights') ? <AirportFlightSearch slug={airport.slug} name={airport.shortName} hasFlights onMedia /> : undefined}
      />

      {glance.length > 0 || opsServicesFor(airport.slug).length > 0 ? (
        <Section spacing="sm" aria-labelledby="airport-glance-title" className="pb-4 sm:pb-6">
          <h2 id="airport-glance-title" className="type-title-lg mb-4 text-ink">
            {t('flightPages.look.glanceTitle')}
          </h2>
          {glance.length > 0 ? (
            <ul className={cn('grid gap-3 sm:grid-cols-2', glance.length >= 3 ? 'lg:grid-cols-3' : '')}>
              {glance.map((item) => (
                <Card as="li" key={item.id} interactive className="flex min-w-0 items-center gap-4 rounded-2xl p-4 sm:p-5">
                  <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-midnight text-gold-bright shadow-sm">
                    <Icon name={item.icon} size="md" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="type-caption font-semibold text-ink-2">{item.label}</p>
                    <h3 className="type-title-md text-ink">
                      <CardLink href={sectionPath(airport.slug, item.id)}>{item.value}</CardLink>
                    </h3>
                    <p className="type-caption mt-0.5 text-ink-2">{item.note}</p>
                  </div>
                  <Icon name="arrow-right" size="sm" className="shrink-0 text-ink-2 transition-transform duration-fast motion-ok:group-hover/card:translate-x-0.5" />
                </Card>
              ))}
            </ul>
          ) : null}
          {/* Service status tiles with demo queue estimates (B-01 hand-off, round 2), now tiles.
              Renders nothing for an airport without any of the services. */}
          <OpsStatusSection airport={airport.slug} headingLevel={3} variant="tiles" className={glance.length > 0 ? 'mt-8' : undefined} />
        </Section>
      ) : null}

      <Section spacing="sm" aria-labelledby="airport-notices-title" className="pt-6 sm:pt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <h2 id="airport-notices-title" className="type-title-lg text-ink">
            {t('airportPage.noticesTitle', { airport: airport.shortName })}
          </h2>
        </div>
        <NoticeList notices={notices} emptyText={t('notices.none')} linkToAll compact className="max-w-narrow" />
      </Section>

      {limited ? (
        <Section spacing="sm" className="pt-0">
          <Callout tone="neutral" icon="info" title={t('airportPage.limited.title')} className="max-w-narrow">
            <p>{airport.depth === 'listing' ? t('airportPage.limited.listing') : t('airportPage.limited.noContent')}</p>
            <p className="mt-1.5">{t('airportPage.limited.pointer')}</p>
          </Callout>
        </Section>
      ) : null}

      {explore.length > 0 ? (
        <Section tone="subtle" spacing="md" aria-labelledby="airport-explore-title">
          <div className="mb-6 flex flex-col gap-1">
            <p className="type-caption font-semibold tracking-[0.14em] text-ink-2 uppercase">{t('flightPages.look.exploreKicker')}</p>
            <h2 id="airport-explore-title" className="type-title-lg text-ink">
              {t('airportPage.exploreTitle', { airport: airport.shortName })}
            </h2>
            <p className="type-body-sm text-ink-2">{t('airportPage.exploreLead')}</p>
          </div>
          <ul className={cn('grid gap-3 sm:grid-cols-2 sm:gap-4', explore.length >= 4 ? 'lg:grid-cols-4' : explore.length === 3 ? 'lg:grid-cols-3' : '')}>
            {explore.map((section) => {
              const count = counts[section.id];
              // Polish 1b (critique-redesign1b item 9): the airport's own photograph where the library
              // has one for the section (decorative: the title is the link), requested near the
              // viewport only; the words keep a scrim under them. Otherwise the line drawing.
              const photoId = EXPLORE_IMAGES[airport.slug]?.[section.id];
              const photo = photoId ? IMAGES[photoId] : undefined;
              return (
                <Card as="li" key={section.id} interactive className="on-media relative isolate flex min-h-52 min-w-0 flex-col justify-end overflow-hidden rounded-3xl border-0 bg-midnight p-5 text-ink sm:min-h-64 sm:p-6">
                  {photo ? (
                    <span aria-hidden="true" className="absolute inset-0 -z-10">
                      <DeferredImage
                        src={photo.src}
                        alt=""
                        fill
                        sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 50vw, 100vw"
                        quality={60}
                        blurDataURL={photo.blurDataURL}
                        style={{ objectPosition: objectPosition(photo) }}
                        className="object-cover transition-[scale] duration-slower ease-out motion-ok:group-hover/card:scale-[1.04]"
                      />
                    </span>
                  ) : (
                    <>
                      {/* The vignette: a deep gradient and the section's line icon drawn large and faint (decoration). */}
                      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,color-mix(in_oklab,var(--color-gold)_24%,transparent),transparent_60%),linear-gradient(160deg,var(--color-midnight-2),var(--color-midnight))]" />
                      <span aria-hidden="true" className="absolute -top-3 -right-3 -z-10 text-gold-bright/25 transition-transform duration-slow ease-out motion-ok:group-hover/card:scale-105">
                        <Icon name={section.icon} strokeWidth={0.75} className="size-36 sm:size-44" />
                      </span>
                    </>
                  )}
                  <div className={cn('flex flex-col', photo && 'scrim-behind -mx-5 -mb-5 rounded-b-[inherit] px-5 pt-6 pb-5 [--scrim-behind-fade:3rem] sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6')}>
                    {count ? <span className="type-display-md text-gold-bright tabular-nums">{count}</span> : null}
                    <h3 className="type-title-lg mt-1 text-ink">
                      <CardLink href={sectionPath(airport.slug, section.id)}>{t(section.labelKey)}</CardLink>
                    </h3>
                    {section.descriptionKey ? <p className="type-body-sm mt-1 text-ink-2">{t(section.descriptionKey)}</p> : null}
                    <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="mt-4 text-gold-bright transition-transform duration-base motion-ok:group-hover/card:translate-x-1" />
                  </div>
                </Card>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section spacing="md">
        <LazyAirportFlightTools slug={airport.slug} name={airport.shortName} hasFlights={sections.includes('flights')} />
      </Section>

      {bookable.length > 0 ? (
        <Section spacing="md" aria-labelledby="airport-services-title" className="pt-0">
          <SectionHeading id="airport-services-title" title={t('airportPage.servicesTitle')} lead={t('airportPage.servicesLead')} variant="title" />
          <ul className="grid gap-4 sm:grid-cols-2">
            {bookable.map((facility) => (
              <Card as="li" key={facility.id} variant="midnight" className="flex min-w-0 flex-col gap-2 rounded-2xl p-5 sm:p-6">
                <h3 className="type-title-md text-ink">
                  {pick(facility.name, lang)}
                  {facility.terminal ? <span className="type-body-sm ml-2 font-normal text-ink-2">{terminalLabel(airport, facility.terminal, lang)}</span> : null}
                </h3>
                <p className="type-body-sm text-ink-2">{t('airportPage.fastTrackSummary')}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-1">
                  <LocaleLink href={`${sectionPath(airport.slug, 'facilities')}#${facility.id}`} className="link-action type-body-sm text-ink">
                    {t('airportPage.fastTrackDetails')}
                    <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                  </LocaleLink>
                  {facility.bookingUrl ? (
                    <ExternalLink href={facility.bookingUrl} variant="action" className="type-body-sm text-gold-bright" data-handoff="fast-track-booking">
                      {t('airportPage.fastTrackBook')}
                    </ExternalLink>
                  ) : null}
                </div>
              </Card>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <ProvenanceTag provenance={bookable[0].provenance} length="short" />
            <SourceNote sources={bookableSources} />
          </div>
        </Section>
      ) : null}

      <Section tone={explore.length > 0 ? 'subtle' : 'page'} spacing="md" aria-labelledby="airport-facts-title">
        <SectionHeading id="airport-facts-title" title={t('airportPage.factsTitle')} lead={t('airportPage.factsLead')} variant="title" />
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Round 5 (A-14, at most 8 type sizes): the two codes in the data face at the step the
              page already uses for times (20 px), not a 24 px step of their own. */}
          <KeyFact label={t('airportPage.facts.iata')} value={<span className="type-data-lg">{airport.code}</span>} provenance={tag('code')} hint={hint('code')} />
          <KeyFact
            label={t('airportPage.facts.icao')}
            value={airport.icao ? <span className="type-data-lg">{airport.icao}</span> : <NotPublished />}
            provenance={airport.icao ? tag('icao') : undefined}
            hint={airport.icao ? (unverified('icao') ? t('airportPage.facts.icaoUnverified') : undefined) : t('airportPage.facts.icaoMissing')}
          />
          <KeyFact
            label={t('airportPage.facts.classification')}
            value={pick(CLASSIFICATION_LABELS[airport.classification], lang)}
            provenance={tag('network-membership')}
            hint={hint('network-membership')}
          />
          <KeyFact label={t('airportPage.facts.location')} value={place} provenance={tag('location')} hint={hint('location')} />
          <KeyFact
            label={t('flightPages.overview.airlines')}
            value={airlineNames.length > 0 ? <span data-airlines="">{airlinesValue}</span> : <NotPublished />}
            hint={airlineNames.length > 0 ? undefined : t('flightPages.overview.airlinesMissing')}
            provenance={airlineNames.length > 0 ? (airlinesOfficial ? 'official' : 'estimated') : undefined}
            sources={airlineNames.length > 0 ? airlineSources : undefined}
            className="sm:col-span-2 lg:col-span-4"
          />
        </div>
        <div className="mt-5 flex flex-wrap items-start gap-x-6 gap-y-1">
          <SourceNote sources={resolveSources(airport.sources)} />
          {airport.asOf ? <p className="type-caption py-2 text-ink-2">{t('freshness.asOf', { date: formatAsOf(airport.asOf, lang) })}</p> : null}
        </div>

        {/* Target of "Official contacts" on the status lines (round 4, 6.1.1). */}
        <h3 id="airport-contacts" className="type-title-md mt-10 mb-3 scroll-mt-28 text-ink">
          {t('airportPage.contactsTitle')}
        </h3>
        {ownContacts.length === 0 ? (
          <p data-own-contact="missing" className="type-body-sm mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
            <span className="font-semibold text-ink">{t('flightPages.overview.ownContact')}:</span>
            <NotPublished />
            <span>{t('flightPages.overview.ownContactMissing')}</span>
          </p>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {airport.contacts.map((contact) => (
            <li key={`${contact.kind}-${contact.value}`} className="flex min-w-0 gap-3.5 rounded-xl border border-line bg-surface p-4 shadow-sm">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
                <Icon name={contact.kind} size="sm" />
              </span>
              <div className="min-w-0">
                <p className="type-body-sm text-ink-2">{pick(contact.label, lang)}</p>
                {contact.href ? (
                  contact.href.startsWith('http') ? (
                    <ExternalLink href={contact.href} className="type-body break-all text-ink">
                      {contact.value}
                    </ExternalLink>
                  ) : (
                    <a href={contact.href} className="link type-body inline-flex min-h-8 items-center break-all text-ink touch:min-h-11">
                      {contact.value}
                    </a>
                  )
                ) : (
                  <p className="type-body font-semibold text-ink">{contact.value}</p>
                )}
                {contact.note ? <p className="type-caption mt-1 text-ink-2">{pick(contact.note, lang)}</p> : null}
              </div>
            </li>
          ))}
        </ul>
        {official ? (
          <p className="type-body-sm mt-4 text-ink-2">
            {t('empty.officialPointer')}{' '}
            <ExternalLink href={official.url} className="text-ink">
              {t('footer.officialSite')}
            </ExternalLink>
          </p>
        ) : null}
      </Section>
    </>
  );
}

import { CLASSIFICATION_LABELS, airportSlugs, formatAsOf, getNotices, getSource, pick, resolveSources, type Provenance } from '@/content';
import { GROUP_CONTACTS, terminalLabel } from '@/content/airports';
import { AirportFlightSearch, AirportFlightTools } from '@/components/airport/airport-flight-tools';
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
import { Card, CardLink } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { JsonLd, airportJsonLd } from '@/lib/seo';
import { I18nPageScope } from '@/lib/i18n/page-scope';

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
  const explore = AIRPORT_SECTIONS.filter((section) => section.id !== 'overview' && sections.includes(section.id));
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

  return (
    <>
      <JsonLd data={airportJsonLd(airport, lang)} />
      <AirportBanner airport={airport} lang={lang} sections={sections} />
      {/* Round 6 (review-3 9.1 item 7): the flight search first, on the first phone screen; the
          notices follow it, still within the first phone screens (A-20, BR-08). */}
      {sections.includes('flights') ? (
        <Section as="div" spacing="sm" className="pb-6 sm:pb-8">
          <AirportFlightSearch slug={airport.slug} name={airport.shortName} hasFlights />
        </Section>
      ) : null}
      <Section tone="subtle" spacing="sm" aria-labelledby="airport-notices-title">
        <SectionHeading
          id="airport-notices-title"
          eyebrow={t('nav.notices')}
          title={t('airportPage.noticesTitle', { airport: airport.shortName })}
          variant="title"
        />
        <NoticeList
          notices={notices}
          emptyText={t('notices.none')}
          linkToAll
          listClassName={notices.length > 1 ? 'grid items-start lg:grid-cols-2' : 'max-w-narrow'}
        />
        {/* Service status lines with demo queue estimates, under the notices (B-01 hand-off, round 2).
            Renders nothing for an airport without any of the services. */}
        <OpsStatusSection airport={airport.slug} headingLevel={3} className="mt-6 max-w-narrow" />
      </Section>

      <Section spacing="md">
        <div className="flex flex-col gap-10">
          {limited ? (
            <Callout tone="neutral" icon="info" title={t('airportPage.limited.title')}>
              <p>{airport.depth === 'listing' ? t('airportPage.limited.listing') : t('airportPage.limited.noContent')}</p>
              <p className="mt-1.5">{t('airportPage.limited.pointer')}</p>
            </Callout>
          ) : null}
          <AirportFlightTools slug={airport.slug} name={airport.shortName} hasFlights={sections.includes('flights')} />
        </div>
      </Section>

      {explore.length > 0 ? (
        <Section spacing="md" aria-labelledby="airport-explore-title">
          <SectionHeading
            id="airport-explore-title"
            title={t('airportPage.exploreTitle', {
              airport: airport.shortName,
            })}
            lead={t('airportPage.exploreLead')}
            variant="title"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {explore.map((section) => {
              const count = counts[section.id];
              return (
                <Card as="li" key={section.id} interactive padding="md" className="flex min-w-0 flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Icon name={section.icon} size="lg" className="text-primary-ink" />
                    {count ? <span className="type-data-sm text-ink-2">{count}</span> : null}
                  </div>
                  <h3 className="type-title-md text-ink">
                    <CardLink href={sectionPath(airport.slug, section.id)}>{t(section.labelKey)}</CardLink>
                  </h3>
                  {section.descriptionKey ? <p className="type-body-sm text-ink-2">{t(section.descriptionKey)}</p> : null}
                </Card>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {bookable.length > 0 ? (
        <Section spacing="md" aria-labelledby="airport-services-title" className="pt-0">
          <SectionHeading id="airport-services-title" title={t('airportPage.servicesTitle')} lead={t('airportPage.servicesLead')} variant="title" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {bookable.map((facility) => (
              <Card as="li" key={facility.id} padding="md" className="flex min-w-0 flex-col gap-2">
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
                    <ExternalLink href={facility.bookingUrl} variant="action" className="type-body-sm text-ink" data-handoff="fast-track-booking">
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
            <li key={`${contact.kind}-${contact.value}`} className="flex min-w-0 gap-3 rounded-lg border border-line-strong bg-surface p-4">
              <Icon name={contact.kind} className="mt-0.5 text-primary-ink" />
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

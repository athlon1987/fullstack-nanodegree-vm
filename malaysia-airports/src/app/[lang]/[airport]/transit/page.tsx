import { Suspense } from 'react';
import { airportsWithContent, getSource, pick, resolveSources } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPageFor, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { EmptyState } from '@/components/common/empty-state';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { ServiceBody, ServiceHeading, ServiceIntro, SERVICE_ICON } from '@/components/facilities/service-frame';
import { servicePlace } from '@/components/facilities/service-place';
import { FactCard, type FactView } from '@/components/guides/fact-card';
import { SectionSourceList } from '@/components/common/section-source-list';
import { transitData, type RestView, type TransitData } from '@/components/guides/transit-data.server';
import { DEFAULT_TRANSIT_INPUT } from '@/components/guides/transit-logic';
import { TransitPlanner } from '@/components/guides/transit-planner';
import { TransitPlannerFromUrl } from '@/components/guides/transit-planner-url';
import { OpsStatusSection } from '@/components/flights/ops-status-section';
import { airportsWithSection } from '@/components/shell/sections.server';
import { Icon } from '@/components/ui/icon';
import type { Translator } from '@/lib/i18n/translate';
import { I18nPageScope } from '@/lib/i18n/page-scope';

/** KLIA has the planner; the other airports with content get the simpler page. Any other airport is a 404 (C-06). */
export function generateStaticParams() {
  return transitAirports().map((airport) => ({ airport }));
}

/** Fully static for those airports; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

const transitAirports = () => [...new Set([...airportsWithSection('transit'), ...airportsWithContent()])];
/** The simple page for an airport with content but no transit section is an empty state: not indexed. */
const transitEmptyState = (_sections: readonly unknown[], slug: string) => airportsWithContent().includes(slug);

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/transit'>) {
  const { lang, airport: slug } = await params;
  const airport = localAirport(slug, lang);
  const t = getT(toLang(lang));
  return airportSectionMetadata(
    params,
    'transit',
    airport
      ? {
          title: t('guidePages.transit.metaTitle', { airport: airport.shortName }),
          description: t('guidePages.transit.metaDescription', { airport: airport.name }),
        }
      : {},
    { emptyState: transitEmptyState },
  );
}

/**
 * Connections and transit: an interactive planner at KLIA, honest guidance everywhere else.
 *
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed airport is complete in the static HTML, so the heading and the first content
 * paint with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other airport gets `MissingPage`, a 404 with the site shell.
 */
export default function TransitPage({ params }: PageProps<'/[lang]/[airport]/transit'>) {
  return (
    <I18nPageScope namespaces={['guidePages', 'transportPages']}>
      <Transit params={params} />
    </I18nPageScope>
  );
}

async function Transit({ params }: { params: AirportPageParams }) {
  const { airport: slug } = await params;
  if (!generateStaticParams().some((listed) => listed.airport === slug)) return <MissingPage />;
  // KLIA's planner, or the honest simple page for another airport with content; others are a 404.
  const { lang, t, airport, content, sections } = await loadAirportPageFor(params, (has, slug) => has.includes('transit') || transitAirports().includes(slug));
  const data = transitData(content, lang, t, sections.includes('lounges'));
  const planner =
    airport.terminals.some((terminal) => terminal.id === 'T1') && airport.terminals.some((terminal) => terminal.id === 'T2') && data.options.length > 0;
  // Redesign stage two: the service-page frame. On the planner page the answer (the verdict) is
  // the first thing beside the form on desktop and under it on phones (C-03), with its one-line
  // summary pinned at the top of the form while it is answered.
  const header = (
    <ServiceIntro
      eyebrow={t('mapPages.frame.group')}
      place={servicePlace(airport.slug, lang)}
      title={t('guidePages.transit.title', { airport: airport.shortName })}
      summary={planner ? t('guidePages.transit.lead') : t('guidePages.transit.leadSimple', { airport: airport.shortName })}
      summaryClassName={planner ? 'max-sm:sr-only' : undefined}
      breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.transit') }]} />}
      className={planner ? '[&>div]:pb-6 sm:[&>div]:pb-10' : undefined}
    />
  );

  if (!planner) {
    const notes = content.guidesNotes.filter((note) => (note.topic === 'transit' || note.topic === 'immigration') && note.provenance !== 'suggestion');
    const official = getSource('mahb-airports-site');
    return (
      <>
        {header}
        <ServiceBody>
          {notes.length > 0 ? (
            <section aria-labelledby="transit-notes-title">
              <ServiceHeading id="transit-notes-title" title={t('guidePages.transit.simple.notesTitle', { airport: airport.shortName })} />
              <ul className="grid items-start gap-3 lg:grid-cols-2">
                {notes.map((note) => (
                  <li key={note.id} className="min-w-0">
                    <FactCard
                      fact={{
                        id: note.id,
                        title: pick(note.title, lang),
                        body: pick(note.body, lang),
                        provenance: note.provenance,
                        sources: resolveSources(note.sources),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <EmptyState
            icon="arrow-left-right"
            headingLevel={2}
            title={t('guidePages.transit.simple.emptyTitle', { airport: airport.shortName })}
            action={
              official ? (
                <ExternalLink href={official.url} variant="action">
                  {t('common.actions.openOfficialSite')}
                </ExternalLink>
              ) : undefined
            }
          >
            {t('guidePages.transit.simple.emptyBody')}
          </EmptyState>
          <Basics t={t} />
          <section
            aria-labelledby="transit-klia-title"
            className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-3xl bg-page-subtle p-6 sm:p-8"
          >
            <div className="min-w-0">
              <h2 id="transit-klia-title" className="type-title-md text-ink">
                {t('guidePages.transit.simple.kliaTitle')}
              </h2>
              <p className="type-body-sm mt-1 text-ink-2">{t('guidePages.transit.simple.kliaBody')}</p>
            </div>
            <LocaleLink href="/kul/transit" className="link-action type-body-sm text-ink">
              {t('guidePages.transit.simple.kliaAction')}
              <Icon name="arrow-right" size="sm" />
            </LocaleLink>
          </section>
          <LateSection t={t} facts={data.late} />
          <ProvenanceLegend headingLevel={2} />
        </ServiceBody>
      </>
    );
  }

  return (
    <>
      {header}
      <ServiceBody>
        <noscript>
          <p className="type-body-sm rounded-2xl bg-page-subtle p-4 text-ink">{t('guidePages.transit.planner.noJs')}</p>
        </noscript>
        <Suspense fallback={<TransitPlanner data={data} initial={DEFAULT_TRANSIT_INPUT} />}>
          <TransitPlannerFromUrl data={data} />
        </Suspense>

        <section id="between-terminals" aria-labelledby="between-terminals-title" className="scroll-mt-32">
          <ServiceHeading id="between-terminals-title" title={t('guidePages.transit.official.title', { airport: airport.shortName })} />
          <div className="flex flex-col gap-4">
            {/* Whether the train and shuttle between terminals are running, from current notices (B-01 hand-off). */}
            <OpsStatusSection airport={airport.slug} services={['inter-terminal-train', 'inter-terminal-shuttle']} headingLevel={3} className="max-w-narrow" />
            {data.interTerminal ? <FactCard fact={data.interTerminal} className="max-w-narrow border-ink" groupedSources /> : null}
            <h3 className="type-title-lg mt-4 text-ink">{t('guidePages.transit.official.optionsTitle')}</h3>
            <ul className="grid items-start gap-4 lg:grid-cols-2">
              {data.options.map((option) => (
                <li key={option.id} className="min-w-0">
                  <FactCard fact={option} headingLevel={4} groupedSources />
                </li>
              ))}
            </ul>
            {/* Round 4 (A-14): one source list for the section. */}
            <SectionSourceList items={[...(data.interTerminal ? [data.interTerminal] : []), ...data.options].map((fact) => ({ name: fact.title, sources: fact.sources }))} />
          </div>
        </section>

        <RestSection t={t} data={data} />
        <LateSection t={t} facts={data.late} />
        <ProvenanceLegend headingLevel={2} />
      </ServiceBody>
    </>
  );
}

function Basics({ t }: { t: Translator }) {
  const items = [
    {
      id: 'protected',
      icon: 'ticket-check' as const,
      title: t('guidePages.transit.simple.protectedTitle'),
      body: t('guidePages.transit.simple.protectedBody'),
    },
    { id: 'self', icon: 'ticket' as const, title: t('guidePages.transit.simple.selfTitle'), body: t('guidePages.transit.simple.selfBody') },
  ];
  return (
    <section aria-labelledby="transit-basics-title">
      <ServiceHeading
        id="transit-basics-title"
        title={t('guidePages.transit.simple.basicsTitle')}
       
        action={<ProvenanceTag provenance="estimated" />}
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <span aria-hidden="true" className={SERVICE_ICON}>
              <Icon name={item.icon} />
            </span>
            <div className="min-w-0">
              <h3 className="type-title-sm text-ink">{item.title}</h3>
              <p className="type-body-sm mt-1 text-ink-2">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RestCard({ item, t }: { item: RestView; t: Translator }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <h3 className="type-title-sm min-w-0 text-ink">{item.name}</h3>
        <ProvenanceTag provenance={item.provenance} length="short" />
      </div>
      <dl className="type-body-sm grid gap-x-3 gap-y-1 text-ink-2 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="contents">
          <dt className="font-semibold text-ink">{t('common.labels.terminal')}</dt>
          <dd>{item.terminal}</dd>
        </div>
        <div className="contents">
          <dt className="font-semibold text-ink">{t('guidePages.transit.rest.zone')}</dt>
          <dd>{item.zone}</dd>
        </div>
        {item.location ? (
          <div className="contents">
            <dt className="font-semibold text-ink">{t('guidePages.transit.rest.location')}</dt>
            <dd>{item.location}</dd>
          </div>
        ) : null}
      </dl>
      <p className="type-body-sm text-ink-2">{item.description}</p>
    </div>
  );
}

function RestSection({ t, data }: { t: Translator; data: TransitData }) {
  const leaving = [data.entry, data.mdac].filter((fact): fact is FactView => Boolean(fact));
  return (
    <section id="transit-rest" aria-labelledby="transit-rest-title" className="scroll-mt-32">
      <ServiceHeading
        id="transit-rest-title"
        title={t('guidePages.transit.rest.title')}
        lead={t('guidePages.transit.rest.lead')}
       
        action={
          data.hasLounges ? (
            <LocaleLink href={`/${data.airportSlug}/lounges`} className="link-action type-body-sm text-ink">
              {t('guidePages.transit.rest.lounges', { airport: data.airportName })}
              <Icon name="arrow-right" size="sm" />
            </LocaleLink>
          ) : undefined
        }
      />
      {data.rest.length > 0 ? (
        <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.rest.map((item) => (
            <li key={item.id} className="min-w-0">
              <RestCard item={item} t={t} />
            </li>
          ))}
        </ul>
      ) : null}
      {leaving.length > 0 ? (
        <>
          <h3 className="type-title-lg mt-10 mb-4 text-ink">{t('guidePages.transit.rest.leaveTitle')}</h3>
          <ul className="grid items-start gap-4 lg:grid-cols-2">
            {leaving.map((fact) => (
              <li key={fact.id} className="min-w-0">
                <FactCard fact={fact} headingLevel={4} groupedSources />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {/* Round 4 (A-14): one source list for the rest places and the entry facts. */}
      <SectionSourceList
        className="mt-3"
        items={[...data.rest.map((item) => ({ name: item.name, sources: item.sources })), ...leaving.map((fact) => ({ name: fact.title, sources: fact.sources }))]}
      />
    </section>
  );
}

function LateSection({ t, facts }: { t: Translator; facts: readonly FactView[] }) {
  if (facts.length === 0) return null;
  return (
    <section id="transit-late" aria-labelledby="transit-late-title" className="scroll-mt-32">
      <ServiceHeading
        id="transit-late-title"
        title={t('guidePages.transit.late.title')}
        lead={t('guidePages.transit.late.lead')}
       
        action={
          <LocaleLink href="/notices" className="link-action type-body-sm text-ink">
            {t('guidePages.transit.late.notices')}
            <Icon name="arrow-right" size="sm" />
          </LocaleLink>
        }
      />
      <ul className="grid items-start gap-4 lg:grid-cols-3">
        {facts.map((fact) => (
          <li key={fact.id} className="min-w-0">
            <FactCard fact={fact} groupedSources />
          </li>
        ))}
      </ul>
      <SectionSourceList className="mt-3" items={facts.map((fact) => ({ name: fact.title, sources: fact.sources }))} />
      <LocaleLink href="/help/flights" className="link-action type-body-sm mt-4 text-ink">
        {t('guidePages.transit.late.rights')}
        <Icon name="arrow-right" size="sm" />
      </LocaleLink>
    </section>
  );
}

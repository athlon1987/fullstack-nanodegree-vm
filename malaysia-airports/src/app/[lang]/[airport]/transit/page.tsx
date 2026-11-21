import { Suspense } from 'react';
import { airportsWithContent, getSource, pick, resolveSources } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPageFor, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { EmptyState } from '@/components/common/empty-state';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import { FactCard, type FactView } from '@/components/guides/fact-card';
import { transitData, type RestView, type TransitData } from '@/components/guides/transit-data.server';
import { DEFAULT_TRANSIT_INPUT } from '@/components/guides/transit-logic';
import { TransitPlanner } from '@/components/guides/transit-planner';
import { TransitPlannerFromUrl } from '@/components/guides/transit-planner-url';
import { OpsStatusSection } from '@/components/flights/ops-status-section';
import { airportsWithSection } from '@/components/shell/sections.server';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
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
      ? { title: t('guidePages.transit.metaTitle', { airport: airport.shortName }), description: t('guidePages.transit.metaDescription', { airport: airport.name }) }
      : {},
    { emptyState: transitEmptyState },
  );
}

/** Connections and transit: an interactive planner at KLIA, honest guidance everywhere else. */
export default function TransitPage({ params }: PageProps<'/[lang]/[airport]/transit'>) {
  return (
    <I18nPageScope namespaces={['guidePages', 'transportPages']}>
      <Suspense
        fallback={
          <Container className="py-10" aria-hidden="true">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-8 h-96 w-full" />
          </Container>
        }
      >
        <Transit params={params} />
      </Suspense>
  
    </I18nPageScope>
  );
}

async function Transit({ params }: { params: AirportPageParams }) {
  // KLIA's planner, or the honest simple page for another airport with content; others are a 404.
  const { lang, t, airport, content, sections } = await loadAirportPageFor(params, (has, slug) => has.includes('transit') || transitAirports().includes(slug));
  const data = transitData(content, lang, t, sections.includes('lounges'));
  const planner = airport.terminals.some((terminal) => terminal.id === 'T1') && airport.terminals.some((terminal) => terminal.id === 'T2') && data.options.length > 0;
  const header = (
    <PageHeader
      eyebrow={airport.shortName}
      title={t('guidePages.transit.title', { airport: airport.shortName })}
      lead={planner ? t('guidePages.transit.lead') : t('guidePages.transit.leadSimple', { airport: airport.shortName })}
      breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.transit') }]} />}
    />
  );

  if (!planner) {
    const notes = content.guidesNotes.filter((note) => (note.topic === 'transit' || note.topic === 'immigration') && note.provenance !== 'suggestion');
    const official = getSource('mahb-airports-site');
    return (
      <>
        {header}
        <Container className="flex flex-col gap-14 pb-section">
          {notes.length > 0 ? (
            <section aria-labelledby="transit-notes-title">
              <SectionHeading id="transit-notes-title" title={t('guidePages.transit.simple.notesTitle', { airport: airport.shortName })} variant="title" />
              <ul className="grid items-start gap-3 lg:grid-cols-2">
                {notes.map((note) => (
                  <li key={note.id} className="min-w-0">
                    <FactCard fact={{ id: note.id, title: pick(note.title, lang), body: pick(note.body, lang), provenance: note.provenance, sources: resolveSources(note.sources) }} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <EmptyState
            icon="arrow-left-right"
            headingLevel={2}
            title={t('guidePages.transit.simple.emptyTitle', { airport: airport.shortName })}
            action={official ? <ExternalLink href={official.url} variant="action">{t('common.actions.openOfficialSite')}</ExternalLink> : undefined}
          >
            {t('guidePages.transit.simple.emptyBody')}
          </EmptyState>
          <Basics t={t} />
          <section aria-labelledby="transit-klia-title" className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-line-strong bg-page-subtle p-5">
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
        </Container>
      </>
    );
  }

  return (
    <>
      {header}
      <Container className="flex flex-col gap-16 pb-section">
        <noscript>
          <p className="type-body-sm rounded-lg border border-line-strong bg-page-subtle p-4 text-ink">{t('guidePages.transit.planner.noJs')}</p>
        </noscript>
        <Suspense fallback={<TransitPlanner data={data} initial={DEFAULT_TRANSIT_INPUT} />}>
          <TransitPlannerFromUrl data={data} />
        </Suspense>

        <section id="between-terminals" aria-labelledby="between-terminals-title" className="scroll-mt-32 border-t border-line pt-12">
          <SectionHeading id="between-terminals-title" title={t('guidePages.transit.official.title', { airport: airport.shortName })} variant="title" />
          <div className="flex flex-col gap-4">
            {/* Whether the train and shuttle between terminals are running, from current notices (B-01 hand-off). */}
            <OpsStatusSection airport={airport.slug} services={['inter-terminal-train', 'inter-terminal-shuttle']} headingLevel={3} className="max-w-narrow" />
            {data.interTerminal ? <FactCard fact={data.interTerminal} className="max-w-narrow border-ink" /> : null}
            <h3 className="type-title-md mt-4 text-ink">{t('guidePages.transit.official.optionsTitle')}</h3>
            <ul className="grid items-start gap-4 lg:grid-cols-2">
              {data.options.map((option) => (
                <li key={option.id} className="min-w-0">
                  <FactCard fact={option} headingLevel={4} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <RestSection t={t} data={data} />
        <LateSection t={t} facts={data.late} />
        <ProvenanceLegend headingLevel={2} />
      </Container>
    </>
  );
}

function Basics({ t }: { t: Translator }) {
  const items = [
    { id: 'protected', icon: 'ticket-check' as const, title: t('guidePages.transit.simple.protectedTitle'), body: t('guidePages.transit.simple.protectedBody') },
    { id: 'self', icon: 'ticket' as const, title: t('guidePages.transit.simple.selfTitle'), body: t('guidePages.transit.simple.selfBody') },
  ];
  return (
    <section aria-labelledby="transit-basics-title">
      <SectionHeading id="transit-basics-title" title={t('guidePages.transit.simple.basicsTitle')} variant="title" action={<ProvenanceTag provenance="estimated" />} />
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 gap-4 rounded-lg border border-line-strong bg-surface p-5">
            <Icon name={item.icon} className="mt-0.5 shrink-0 text-primary-ink" />
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
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-line-strong bg-surface p-4">
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
      <SourceNote sources={item.sources} />
    </div>
  );
}

function RestSection({ t, data }: { t: Translator; data: TransitData }) {
  const leaving = [data.entry, data.mdac].filter((fact): fact is FactView => Boolean(fact));
  return (
    <section id="transit-rest" aria-labelledby="transit-rest-title" className="scroll-mt-32 border-t border-line pt-12">
      <SectionHeading
        id="transit-rest-title"
        title={t('guidePages.transit.rest.title')}
        lead={t('guidePages.transit.rest.lead')}
        variant="title"
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
          <h3 className="type-title-md mt-10 mb-4 text-ink">{t('guidePages.transit.rest.leaveTitle')}</h3>
          <ul className="grid items-start gap-4 lg:grid-cols-2">
            {leaving.map((fact) => (
              <li key={fact.id} className="min-w-0">
                <FactCard fact={fact} headingLevel={4} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function LateSection({ t, facts }: { t: Translator; facts: readonly FactView[] }) {
  if (facts.length === 0) return null;
  return (
    <section id="transit-late" aria-labelledby="transit-late-title" className="scroll-mt-32 border-t border-line pt-12">
      <SectionHeading
        id="transit-late-title"
        title={t('guidePages.transit.late.title')}
        lead={t('guidePages.transit.late.lead')}
        variant="title"
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
            <FactCard fact={fact} />
          </li>
        ))}
      </ul>
      <LocaleLink href="/help/flights" className="link-action type-body-sm mt-4 text-ink">
        {t('guidePages.transit.late.rights')}
        <Icon name="arrow-right" size="sm" />
      </LocaleLink>
    </section>
  );
}

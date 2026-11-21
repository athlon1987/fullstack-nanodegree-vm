import { Suspense } from 'react';
import { getAirport, pick, TRANSPORT_MODE_LABELS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { NotPublished } from '@/components/common/not-published';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { TerminalTransfers } from '@/components/transport/terminal-transfers';
import { ToutsWarning } from '@/components/transport/touts-warning';
import { transportPageModel } from '@/components/transport/transport-data.server';
import { DEFAULT_PLANNER_STATE, TransportPlanner } from '@/components/transport/transport-planner';
import { TransportPlannerFromUrl } from '@/components/transport/transport-planner-url';
import { sourcesFor } from '@/components/transport/transport-types';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

export const generateStaticParams = () => sectionStaticParams('transport');

/** Fully static for the airports that have transport; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/transport'>) {
  const { lang, airport: slug } = await params;
  const airport = getAirport(slug);
  const t = getT(toLang(lang));
  return airportSectionMetadata(
    params,
    'transport',
    airport
      ? {
          title: t('transportPages.transport.metaTitle', { airport: airport.shortName }),
          description: t('transportPages.transport.metaDescription', { airport: airport.name }),
        }
      : {},
  );
}

/** Ground transport planner: compare the published ways to and from the airport, and between its terminals. */
export default function TransportPage({ params }: PageProps<'/[lang]/[airport]/transport'>) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-8 h-40 w-full" />
          <Skeleton className="mt-6 h-96 w-full" />
        </Container>
      }
    >
      <Transport params={params} />
    </Suspense>
  );
}

async function Transport({ params }: { params: AirportPageParams }) {
  const { lang, t, airport, sections, content } = await loadAirportPage(params, 'transport');
  const model = transportPageModel(content, lang);
  const plannerData = { context: model.context, options: model.planner };
  const hasParking = sections.includes('parking');

  return (
    <>
      <PageHeader
        eyebrow={airport.shortName}
        title={t('transportPages.transport.title', { airport: airport.shortName })}
        lead={t('transportPages.transport.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.groundTransport') }]} />}
        actions={
          <>
            {model.between.length > 0 ? (
              <Button asChild variant="secondary" iconStart="arrow-left-right">
                <a href="#between-terminals">{t('transportPages.transport.jumpToTerminals')}</a>
              </Button>
            ) : null}
            {hasParking ? (
              <Button asChild variant="secondary" iconStart="square-parking">
                <LocaleLink href={`/${airport.slug}/parking`}>{t('transportPages.transport.parkingAction')}</LocaleLink>
              </Button>
            ) : null}
          </>
        }
      />
      <Container className="flex flex-col gap-14 pb-section">
        {model.translationMissing ? <TranslationNotice /> : null}

        {/* Before any option: book rides only through official channels (C-02). */}
        <ToutsWarning context={model.context} className="-mb-6" />

        <section aria-labelledby="planner-title">
          <SectionHeading id="planner-title" title={t('transportPages.planner.title')} variant="title" />
          {model.planner.length > 0 ? (
            <Suspense fallback={<TransportPlanner {...plannerData} state={DEFAULT_PLANNER_STATE} />}>
              <TransportPlannerFromUrl {...plannerData} />
            </Suspense>
          ) : (
            <NotPublished variant="block" label={t('transport.none')} officialUrl={model.context.officialUrl} />
          )}
        </section>

        {model.missingModes.length > 0 ? (
          <section aria-labelledby="missing-modes-title" className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-line bg-page-subtle p-5 lg:order-2">
              <h2 id="missing-modes-title" className="type-title-md text-ink">
                {t('transportPages.planner.missingTitle')}
              </h2>
              <p className="type-body-sm mt-1 text-ink-2">{t('transportPages.planner.missingBody', { airport: airport.shortName })}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {model.missingModes
                  .filter((mode) => !(mode === 'private-car' && hasParking))
                  .map((mode) => (
                    <li key={mode} className="flex items-center gap-2.5">
                      <Icon name={mode} size="sm" className="text-ink-2" />
                      <span className="type-body-sm font-medium text-ink">{pick(TRANSPORT_MODE_LABELS[mode], lang)}</span>
                      <NotPublished />
                    </li>
                  ))}
              </ul>
              <ExternalLink href={model.context.officialUrl} variant="action" className="type-body-sm mt-2">
                {t('transportPages.gaps.officialSite')}
              </ExternalLink>
            </div>
            {model.missingModes.includes('private-car') && hasParking ? (
              <div className="flex min-w-0 items-start gap-4 rounded-xl border border-line-strong bg-surface p-5 lg:order-1">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-page-subtle text-ink">
                  <Icon name="private-car" />
                </span>
                <div className="min-w-0">
                  <h3 className="type-title-md text-ink">{t('transportPages.planner.privateCar')}</h3>
                  <p className="type-body-sm mt-1 text-ink-2">{t('transportPages.planner.privateCarBody')}</p>
                  <LocaleLink href={`/${airport.slug}/parking`} className="link-action type-body-sm mt-2 text-ink">
                    {t('transportPages.planner.seeParking')}
                    <Icon name="arrow-right" size="sm" />
                  </LocaleLink>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <TerminalTransfers t={t} context={model.context} between={model.between} inside={model.inside} notes={model.transferNotes} />

        <section aria-labelledby="transport-gaps-title" className="grid gap-6 border-t border-line pt-10 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-10">
          <h2 id="transport-gaps-title" className="type-title-lg text-ink">
            {t('transportPages.gaps.title')}
          </h2>
          <div className="min-w-0 max-w-reading">
            {model.gaps ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="type-title-sm text-ink">{model.gaps.title}</p>
                  <ProvenanceTag provenance={model.gaps.provenance} />
                </div>
                <p className="type-body mt-2 text-ink-2">{model.gaps.body}</p>
                <SourceNote sources={sourcesFor(model.gaps.sourceIds, model.context.sources)} className="mt-1" />
              </>
            ) : null}
            <p className="type-body-sm mt-4 text-ink-2">{t('transportPages.gaps.lead')}</p>
            <ExternalLink href={model.context.officialUrl} variant="action" className="type-body-sm mt-1">
              {t('transportPages.gaps.officialSite')}
            </ExternalLink>
          </div>
        </section>
      </Container>
    </>
  );
}

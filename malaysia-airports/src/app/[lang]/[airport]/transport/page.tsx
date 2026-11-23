import { Suspense } from 'react';
import { pick, TRANSPORT_MODE_LABELS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { NotPublished } from '@/components/common/not-published';
import { PrototypeGapsLink } from '@/components/common/prototype-gaps-link';
import { TranslationNotice } from '@/components/common/translation-notice';
import { TerminalTransfers } from '@/components/transport/terminal-transfers';
import { ToutsWarning } from '@/components/transport/touts-warning';
import { TransportGlance } from '@/components/transport/transport-glance';
import { transportPageModel } from '@/components/transport/transport-data.server';
import { DEFAULT_PLANNER_STATE, TransportPlanner } from '@/components/transport/transport-planner';
import { TransportPlannerFromUrl } from '@/components/transport/transport-planner-url';
import { Button } from '@/components/ui/button';
import { ServiceBody, ServiceHeading, ServiceIntro, SERVICE_CARD, SERVICE_ICON, SERVICE_ICON_SM, SERVICE_JUMP, SERVICE_WELL } from '@/components/facilities/service-frame';
import { servicePlace } from '@/components/facilities/service-place';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export const generateStaticParams = () => sectionStaticParams('transport');

/** Fully static for the airports that have transport; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/transport'>) {
  const { lang, airport: slug } = await params;
  const airport = localAirport(slug, lang);
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

/**
 * Ground transport planner: compare the published ways to and from the airport, and between its terminals.
 *
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed airport is complete in the static HTML, so the heading and the first content
 * paint with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other airport gets `MissingPage`, a 404 with the site shell.
 */
export default function TransportPage({ params }: PageProps<'/[lang]/[airport]/transport'>) {
  return (
    <I18nPageScope namespaces={['transportPages']}>
      <Transport params={params} />
    </I18nPageScope>
  );
}

async function Transport({ params }: { params: AirportPageParams }) {
  const { airport: slug } = await params;
  if (!generateStaticParams().some((listed) => listed.airport === slug)) return <MissingPage />;
  const { lang, t, airport, sections, content } = await loadAirportPage(params, 'transport');
  const model = transportPageModel(content, lang);
  const plannerData = { context: model.context, options: model.planner };
  const hasParking = sections.includes('parking');

  return (
    <>
      {/* Redesign stage two: the service-page frame. The answer (the cheapest published scheduled
          fares, round 4's 6.1.6) sits beside the title from lg up and under it on phones, still
          above the warning, which still precedes every taxi and e-hailing option (C-02). */}
      <ServiceIntro
        eyebrow={t('transportPages.frame.group')}
        place={servicePlace(airport.slug, lang, 'transport')}
        title={t('transportPages.transport.title', { airport: airport.shortName })}
        summary={t('transportPages.frame.transportSummary')}
        summaryClassName="max-sm:sr-only"
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.groundTransport') }]} />}
        answer={model.planner.length > 0 ? <TransportGlance {...plannerData} /> : undefined}
        meta={
          model.between.length > 0 || hasParking ? (
            // On phones the fares come straight under the title (6.1.6); the jumps show from `sm` up.
            <nav aria-label={t('transportPages.transport.jumpsLabel')} className="flex flex-wrap gap-2 max-sm:hidden">
              {model.between.length > 0 ? (
                <a href="#between-terminals" className={SERVICE_JUMP}>
                  <Icon name="arrow-left-right" size="sm" />
                  {t('transportPages.transport.jumpToTerminals')}
                </a>
              ) : null}
              {hasParking ? (
                <LocaleLink href={`/${airport.slug}/parking`} className={SERVICE_JUMP}>
                  <Icon name="square-parking" size="sm" />
                  {t('transportPages.transport.parkingAction')}
                </LocaleLink>
              ) : null}
            </nav>
          ) : undefined
        }
      />
      <ServiceBody>
        {model.translationMissing ? <TranslationNotice /> : null}

        {/* Before any taxi or e-hailing option: book rides only through official channels (C-02). */}
        <ToutsWarning context={model.context} className="-mb-6 sm:-mb-8" />

        <section aria-labelledby="planner-title">
          <ServiceHeading id="planner-title" title={t('transportPages.planner.title')} />
          {model.planner.length > 0 ? (
            <Suspense fallback={<TransportPlanner {...plannerData} state={DEFAULT_PLANNER_STATE} />}>
              <TransportPlannerFromUrl {...plannerData} />
            </Suspense>
          ) : (
            <NotPublished variant="block" label={t('transport.none')} officialUrl={model.context.officialUrl} />
          )}
        </section>

        {model.missingModes.length > 0 ? (
          <section aria-labelledby="missing-modes-title" className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div className={cn(SERVICE_WELL, 'min-w-0 p-5 sm:p-6 lg:order-2')}>
              <h2 id="missing-modes-title" className="type-title-lg text-ink">
                {t('transportPages.planner.missingTitle')}
              </h2>
              <p className="type-body-sm mt-1 text-ink-2">{t('transportPages.planner.missingBody', { airport: airport.shortName })}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {model.missingModes
                  .filter((mode) => !(mode === 'private-car' && hasParking))
                  .map((mode) => (
                    <li key={mode} className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className={cn(SERVICE_ICON_SM, 'size-9 bg-surface text-ink-2')}>
                        <Icon name={mode} size="sm" />
                      </span>
                      <span className="type-body-sm font-medium text-ink">{pick(TRANSPORT_MODE_LABELS[mode], lang)}</span>
                      <NotPublished />
                    </li>
                  ))}
              </ul>
              <ExternalLink href={model.context.officialUrl} variant="action" className="type-body-sm mt-3">
                {t('transportPages.gaps.officialSite')}
              </ExternalLink>
            </div>
            {model.missingModes.includes('private-car') && hasParking ? (
              <div className={cn(SERVICE_CARD, 'flex min-w-0 items-start gap-4 p-5 sm:p-6 lg:order-1')}>
                <span className={SERVICE_ICON}>
                  <Icon name="private-car" />
                </span>
                <div className="min-w-0">
                  <h3 className="type-title-lg text-ink">{t('transportPages.planner.privateCar')}</h3>
                  <p className="type-body-sm mt-1 text-ink-2">{t('transportPages.planner.privateCarBody')}</p>
                  <Button asChild variant="secondary" size="sm" iconEnd="arrow-right" className="mt-4">
                    <LocaleLink href={`/${airport.slug}/parking`}>{t('transportPages.planner.seeParking')}</LocaleLink>
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <TerminalTransfers t={t} lang={lang} context={model.context} between={model.between} inside={model.inside} notes={model.transferNotes} />

        {/* D-05 hand-off (round 2): one line to the single list on About this prototype. */}
        <PrototypeGapsLink
          lang={lang}
          airport={airport.slug}
          airportName={airport.shortName}
          id="transport-gaps-title"
          title={t('transportPages.gaps.title')}
          officialHref={model.context.officialUrl}
          officialLabel={t('transportPages.gaps.officialSite')}
        />
      </ServiceBody>
    </>
  );
}

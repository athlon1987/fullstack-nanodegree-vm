import { Suspense } from 'react';
import { getAirport } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { CarParkList } from '@/components/parking/car-park-list';
import { CarParkListFromUrl } from '@/components/parking/car-park-list-url';
import { parkingPageModel } from '@/components/parking/parking-data.server';
import { ParkedCarControl } from '@/components/parking/parked-car-control';
import { ParkingCalculator } from '@/components/parking/parking-calculator';
import { sourcesFor } from '@/components/transport/transport-types';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export const generateStaticParams = () => sectionStaticParams('parking');

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/parking'>) {
  const { lang, airport: slug } = await params;
  const airport = getAirport(slug);
  const t = getT(toLang(lang));
  return airportSectionMetadata(
    params,
    'parking',
    airport
      ? {
          title: t('transportPages.parking.metaTitle', { airport: airport.shortName }),
          description: t('transportPages.parking.metaDescription', { airport: airport.name }),
        }
      : {},
  );
}

/** Parking: car parks compared, rates by status with an estimate where possible, and a parked-car note. */
export default function ParkingPage({ params }: PageProps<'/[lang]/[airport]/parking'>) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-8 h-32 w-full" />
          <Skeleton className="mt-6 h-96 w-full" />
        </Container>
      }
    >
      <Parking params={params} />
    </Suspense>
  );
}

async function Parking({ params }: { params: AirportPageParams }) {
  const { lang, t, airport, sections, content } = await loadAirportPage(params, 'parking');
  const { data, someNotVerified, gaps, translationMissing } = parkingPageModel(content, lang);
  const warning = data.premiumWarning;

  return (
    <>
      <PageHeader
        eyebrow={airport.shortName}
        title={t('transportPages.parking.title', { airport: airport.shortName })}
        lead={t('transportPages.parking.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.parking') }]} />}
        actions={
          <>
            <Button asChild iconEnd="arrow-up-right">
              <ExternalLink href={data.officialUrl} variant="plain" hideIcon>
                {t('transportPages.parking.bookAction')}
              </ExternalLink>
            </Button>
            {sections.includes('transport') ? (
              <Button asChild variant="secondary" iconStart="train-front">
                <LocaleLink href={`/${airport.slug}/transport`}>{t('transportPages.parking.seeTransport')}</LocaleLink>
              </Button>
            ) : null}
          </>
        }
      />
      <Container className="flex flex-col gap-14 pb-section">
        {translationMissing ? <TranslationNotice /> : null}

        {warning || someNotVerified ? (
          <div className="flex flex-col gap-4">
            {warning ? (
              <Callout tone="critical" icon="triangle-alert" title={warning.title} className="border-2">
                <p>{warning.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <ProvenanceTag provenance={warning.provenance} />
                  <SourceNote sources={sourcesFor(warning.sourceIds, data.sources)} />
                </div>
              </Callout>
            ) : null}
            {someNotVerified ? (
              <Callout
                tone="warning"
                title={t('transportPages.parking.ratesCalloutTitle')}
                actions={
                  <ExternalLink href={data.officialUrl} variant="action" className="type-body-sm">
                    {t('transportPages.parking.ratesCalloutAction')}
                  </ExternalLink>
                }
              >
                <p>{t('transportPages.parking.ratesCalloutBody')}</p>
              </Callout>
            ) : null}
          </div>
        ) : null}

        <section aria-labelledby="parking-calculator-title">
          <SectionHeading id="parking-calculator-title" title={t('transportPages.calculator.title')} lead={t('transportPages.calculator.lead')} variant="title" />
          <ParkingCalculator data={data} />
        </section>

        <section aria-labelledby="car-parks-title">
          <SectionHeading id="car-parks-title" title={t('transportPages.parking.listTitle')} lead={t('transportPages.parking.listLead')} variant="title" />
          <Suspense fallback={<CarParkList data={data} />}>
            <CarParkListFromUrl data={data} />
          </Suspense>
        </section>

        <section aria-labelledby="parked-car-title" id="where-i-parked" className="scroll-mt-32">
          <SectionHeading id="parked-car-title" title={t('transportPages.parked.title')} lead={t('transportPages.parked.lead')} variant="title" />
          <ParkedCarControl slug={airport.slug} timezone={airport.timezone} carParks={data.carParks.map(({ id, name, type }) => ({ id, name, type }))} premiumWarning={warning?.title} />
        </section>

        {gaps ? (
          <section aria-labelledby="parking-gaps-title" className="grid gap-6 border-t border-line pt-10 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-10">
            <h2 id="parking-gaps-title" className="type-title-lg text-ink">
              {t('transportPages.gaps.title')}
            </h2>
            <div className="min-w-0 max-w-reading">
              <div className="flex flex-wrap items-center gap-3">
                <p className="type-title-sm text-ink">{gaps.title}</p>
                <ProvenanceTag provenance={gaps.provenance} />
              </div>
              <p className="type-body mt-2 text-ink-2">{gaps.body}</p>
              <SourceNote sources={sourcesFor(gaps.sourceIds, data.sources)} className="mt-1" />
              <p className="type-body-sm mt-4 text-ink-2">{t('transportPages.gaps.lead')}</p>
              <ExternalLink href={data.officialUrl} variant="action" className="type-body-sm mt-1">
                {t('transportPages.parking.officialPage')}
              </ExternalLink>
            </div>
          </section>
        ) : null}
      </Container>
    </>
  );
}

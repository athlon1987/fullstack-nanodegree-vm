import { Suspense } from 'react';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { PageHeader } from '@/components/common/page-header';
import { PrototypeGapsLink } from '@/components/common/prototype-gaps-link';
import { SectionHeading } from '@/components/common/section-heading';
import { TranslationNotice } from '@/components/common/translation-notice';
import { CarParkList } from '@/components/parking/car-park-list';
import { CarParkListFromUrl } from '@/components/parking/car-park-list-url';
import { parkingPageModel } from '@/components/parking/parking-data.server';
import { ParkedCarControl } from '@/components/parking/parked-car-control';
import { ParkingCalculator } from '@/components/parking/parking-calculator';
import { ParkingCalculatorFromUrl } from '@/components/parking/parking-calculator-url';
import { ParkingPriceMatrix } from '@/components/parking/parking-price-matrix';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export const generateStaticParams = () => sectionStaticParams('parking');

/** Fully static for the airports that have parking; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/parking'>) {
  const { lang, airport: slug } = await params;
  const airport = localAirport(slug, lang);
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

/**
 * Parking, price first (C-01): a compact matrix of what 1, 3 or 7 days cost at each car park
 * (with Preferred Parking's warning in its row), then the calculator for exact dates, the car
 * parks, and a parked-car note.
 *
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed airport is complete in the static HTML, so the heading and the first content
 * paint with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other airport gets `MissingPage`, a 404 with the site shell.
 */
export default function ParkingPage({ params }: PageProps<'/[lang]/[airport]/parking'>) {
  return (
    <I18nPageScope namespaces={['transportPages']}>
      <Parking params={params} />
    </I18nPageScope>
  );
}

async function Parking({ params }: { params: AirportPageParams }) {
  const { airport: slug } = await params;
  if (!generateStaticParams().some((listed) => listed.airport === slug)) return <MissingPage />;
  const { lang, t, airport, sections, content } = await loadAirportPage(params, 'parking');
  const { data, translationMissing } = parkingPageModel(content, lang);
  const warning = data.premiumWarning;

  return (
    <>
      <PageHeader
        eyebrow={airport.shortName}
        title={t('transportPages.parking.title', { airport: airport.shortName })}
        lead={t('transportPages.parking.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.parking') }]} />}
        className="[&>div]:pb-5 sm:[&>div]:pb-8"
      />
      <Container className="flex flex-col gap-14 pb-section">
        <ParkingPriceMatrix
          data={data}
          t={t}
          lang={lang}
          transportLink={
            sections.includes('transport') ? (
              <LocaleLink href={`/${airport.slug}/transport`} className="link-action type-body-sm text-ink">
                <Icon name="train-front" size="sm" />
                {t('transportPages.parking.seeTransport')}
              </LocaleLink>
            ) : undefined
          }
        />

        {translationMissing ? <TranslationNotice /> : null}

        <section aria-labelledby="parking-calculator-title">
          <SectionHeading
            id="parking-calculator-title"
            title={t('transportPages.calculator.title')}
            lead={t('transportPages.calculator.lead')}
            variant="title"
          />
          <Suspense fallback={<ParkingCalculator data={data} />}>
            <ParkingCalculatorFromUrl data={data} />
          </Suspense>
        </section>

        <section aria-labelledby="car-parks-title">
          <SectionHeading id="car-parks-title" title={t('transportPages.parking.listTitle')} lead={t('transportPages.parking.listLead')} variant="title" />
          <Suspense fallback={<CarParkList data={data} />}>
            <CarParkListFromUrl data={data} />
          </Suspense>
        </section>

        <section aria-labelledby="parked-car-title" id="where-i-parked" className="scroll-mt-32">
          <SectionHeading id="parked-car-title" title={t('transportPages.parked.title')} lead={t('transportPages.parked.lead')} variant="title" />
          <ParkedCarControl
            slug={airport.slug}
            timezone={airport.timezone}
            carParks={data.carParks.map(({ id, name, type }) => ({ id, name, type }))}
            premiumWarning={warning?.title}
          />
        </section>

        {/* D-05 hand-off (round 2): one line to the single list on About this prototype. */}
        <PrototypeGapsLink
          lang={lang}
          airport={airport.slug}
          airportName={airport.shortName}
          id="parking-gaps-title"
          title={t('transportPages.gaps.title')}
          officialHref={data.officialUrl}
          officialLabel={t('transportPages.parking.officialPage')}
        />
      </Container>
    </>
  );
}

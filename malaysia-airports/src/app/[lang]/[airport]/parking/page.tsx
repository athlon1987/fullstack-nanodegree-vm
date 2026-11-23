import { Suspense } from 'react';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { PrototypeGapsLink } from '@/components/common/prototype-gaps-link';
import { ServiceBody, ServiceHeading, ServiceIntro, SERVICE_JUMP } from '@/components/facilities/service-frame';
import { servicePlace } from '@/components/facilities/service-place';
import { TranslationNotice } from '@/components/common/translation-notice';
import { CarParkList } from '@/components/parking/car-park-list';
import { CarParkListFromUrl } from '@/components/parking/car-park-list-url';
import { parkingPageModel } from '@/components/parking/parking-data.server';
import { ParkedCarControl } from '@/components/parking/parked-car-control';
import { ParkingCalculator } from '@/components/parking/parking-calculator';
import { ParkingCalculatorFromUrl } from '@/components/parking/parking-calculator-url';
import { ParkingKeyAnswer, ParkingPriceMatrix } from '@/components/parking/parking-price-matrix';
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
      {/* Redesign stage two: the service-page frame. The price matrix is the answer, the first
          panel under the intro (C-01: on the first phone screen, before the calculator). */}
      <ServiceIntro
        eyebrow={t('transportPages.frame.group')}
        place={servicePlace(airport.slug, lang)}
        title={t('transportPages.parking.title', { airport: airport.shortName })}
        summary={t('transportPages.parking.lead')}
        summaryClassName="max-sm:sr-only"
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.parking') }]} />}
        className="[&>div]:pb-5 sm:[&>div]:pb-10"
        answer={<ParkingKeyAnswer data={data} t={t} lang={lang} />}
        answerClassName="max-lg:hidden"
        meta={
          <nav aria-label={t('transportPages.transport.jumpsLabel')} className="flex flex-wrap gap-2">
            <a href="#parking-calculator-title" className={SERVICE_JUMP}>
              <Icon name="calculator" size="sm" />
              {t('transportPages.calculator.title')}
            </a>
            <a href="#parked-car-title" className={SERVICE_JUMP}>
              <Icon name="map-pin" size="sm" />
              {t('transportPages.parked.title')}
            </a>
          </nav>
        }
      />
      <ServiceBody>
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
          <ServiceHeading
            id="parking-calculator-title"
            title={t('transportPages.calculator.title')}
            lead={t('transportPages.calculator.lead')}
           
          />
          <Suspense fallback={<ParkingCalculator data={data} />}>
            <ParkingCalculatorFromUrl data={data} />
          </Suspense>
        </section>

        <section aria-labelledby="car-parks-title">
          <ServiceHeading id="car-parks-title" title={t('transportPages.parking.listTitle')} lead={t('transportPages.parking.listLead')} />
          <Suspense fallback={<CarParkList data={data} />}>
            <CarParkListFromUrl data={data} />
          </Suspense>
        </section>

        <section aria-labelledby="parked-car-title" id="where-i-parked" className="scroll-mt-32">
          <ServiceHeading id="parked-car-title" title={t('transportPages.parked.title')} lead={t('transportPages.parked.lead')} />
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
      </ServiceBody>
    </>
  );
}

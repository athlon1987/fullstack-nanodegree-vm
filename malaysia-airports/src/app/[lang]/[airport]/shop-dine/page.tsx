import { terminalLabel } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { localAirport, airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { TranslationNotice } from '@/components/common/translation-notice';
import { coverage } from '@/components/commerce/commerce-view';
import { needsTranslationNotice, officialDirectory, outletViews, sourceLookup } from '@/components/commerce/commerce-view.server';
import { Coverage, PartialNote } from '@/components/commerce/directory-notes';
import { OutletDirectory } from '@/components/commerce/outlet-directory';
import { sectionPath } from '@/components/shell/sections';
import { Button } from '@/components/ui/button';
import { ServiceBody, ServiceIntro } from '@/components/facilities/service-frame';
import { servicePlace } from '@/components/facilities/service-place';
import { GlancePanel } from '@/components/commerce/glance-panel';
import { KIND_ICONS } from '@/components/commerce/category-art';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export const generateStaticParams = () => sectionStaticParams('shop-dine');

/** Fully static for the airports that have this section; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/shop-dine'>) {
  const { lang, airport: slug } = await params;
  const airport = localAirport(slug, lang);
  const t = getT(toLang(lang));
  return airportSectionMetadata(params, 'shop-dine', airport ? { description: t('commercePages.metaDescription', { airport: airport.name }) } : {});
}

/**
 * Shop and dine discovery for one airport: every published outlet, with filters and sources.
 *
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed airport is complete in the static HTML, so the heading and the first content
 * paint with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other airport gets `MissingPage`, a 404 with the site shell.
 */
export default function ShopDinePage({ params }: PageProps<'/[lang]/[airport]/shop-dine'>) {
  return (
    <I18nPageScope namespaces={['commercePages']}>
      <ShopDine params={params} />
    </I18nPageScope>
  );
}

const OUTLET_KINDS = ['dine', 'shop', 'service'] as const;

async function ShopDine({ params }: { params: AirportPageParams }) {
  const { airport: slug } = await params;
  if (!generateStaticParams().some((listed) => listed.airport === slug)) return <MissingPage />;
  const { lang, t, airport, content, sections } = await loadAirportPage(params, 'shop-dine');
  const items = outletViews(content, lang, t);
  const terminals = airport.terminals.map((terminal) => ({ id: terminal.id, label: terminalLabel(airport, terminal.id, lang, { short: true }) }));
  const terminalLabels = Object.fromEntries(terminals.map((terminal) => [terminal.id, terminal.label]));
  const translationMissing = needsTranslationNotice(
    content.outlets.flatMap((outlet) => [outlet.description, outlet.locationNote]),
    lang,
  );
  const loungesHref = sections.includes('lounges') ? sectionPath(airport.slug, 'lounges') : undefined;

  return (
    <>
      {/* Redesign stage two: the service-page frame; the answer is what the directory holds, by
          kind, each row opening the directory filtered to it, under the section's photograph. */}
      <ServiceIntro
        eyebrow={t('commercePages.frame.group')}
        place={servicePlace(airport.slug, lang, 'shop-dine')}
        title={t('nav.shopDine')}
        summary={t('commercePages.lead')}
        summaryClassName="max-sm:sr-only"
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.shopDine') }]} />}
        answer={
          items.length > 0 ? (
            <GlancePanel
              title={t('commercePages.frame.atAGlance')}
              rows={OUTLET_KINDS.flatMap((kind) => {
                const count = items.filter((item) => item.kind === kind).length;
                return count > 0 ? [{ key: kind, icon: KIND_ICONS[kind], label: t.count(`commercePages.frame.kindCount.${kind}`, count), href: `/${airport.slug}/shop-dine?kind=${kind}` }] : [];
              })}
              footer={t.count('commercePages.frame.confirmed', items.length)}
            />
          ) : undefined
        }
        actions={
          loungesHref ? (
            <Button asChild variant="secondary" iconStart="armchair">
              <LocaleLink href={loungesHref}>{t('commercePages.loungesLink')}</LocaleLink>
            </Button>
          ) : undefined
        }
      />
      <ServiceBody className="gap-12 sm:gap-16">
        {translationMissing ? <TranslationNotice /> : null}
        <OutletDirectory
          airport={airport.slug}
          items={items}
          sources={sourceLookup(items.flatMap((item) => item.sourceIds))}
          terminals={terminals}
          loungesHref={loungesHref}
          notice={
            <PartialNote lang={lang} airportName={airport.shortName} count={items.length} links={officialDirectory(content)} terminalLabels={terminalLabels} />
          }
        />
        <Coverage lang={lang} stats={coverage(items)} />
      </ServiceBody>
    </>
  );
}

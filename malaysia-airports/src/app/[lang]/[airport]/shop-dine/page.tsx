import { Suspense } from 'react';
import { getAirport, terminalLabel } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { TranslationNotice } from '@/components/common/translation-notice';
import { coverage } from '@/components/commerce/commerce-view';
import { needsTranslationNotice, officialDirectory, outletViews, sourceLookup } from '@/components/commerce/commerce-view.server';
import { Coverage, PartialNote } from '@/components/commerce/directory-notes';
import { OutletDirectory } from '@/components/commerce/outlet-directory';
import { sectionPath } from '@/components/shell/sections';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export const generateStaticParams = () => sectionStaticParams('shop-dine');

/** Fully static for the airports that have this section; any other airport gets a 404 on the first request (C-06). */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/shop-dine'>) {
  const { lang, airport: slug } = await params;
  const airport = getAirport(slug);
  const t = getT(toLang(lang));
  return airportSectionMetadata(params, 'shop-dine', airport ? { description: t('commercePages.metaDescription', { airport: airport.name }) } : {});
}

/** Shop and dine discovery for one airport: every published outlet, with filters and sources. */
export default function ShopDinePage({ params }: PageProps<'/[lang]/[airport]/shop-dine'>) {
  return (
    <I18nPageScope namespaces={['commercePages']}>
      <Suspense
        fallback={
          <Container className="py-10" aria-hidden="true">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-8 h-14 w-full" />
            <Skeleton className="mt-8 h-72 w-full" />
          </Container>
        }
      >
        <ShopDine params={params} />
      </Suspense>
  
    </I18nPageScope>
  );
}

async function ShopDine({ params }: { params: AirportPageParams }) {
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
      <PageHeader
        eyebrow={airport.shortName}
        title={t('nav.shopDine')}
        lead={t('commercePages.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.shopDine') }]} />}
        actions={
          loungesHref ? (
            <Button asChild variant="secondary" iconStart="armchair">
              <LocaleLink href={loungesHref}>{t('commercePages.loungesLink')}</LocaleLink>
            </Button>
          ) : undefined
        }
      />
      <Container className="pb-section">
        {translationMissing ? <TranslationNotice className="mb-6" /> : null}
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
      </Container>
    </>
  );
}

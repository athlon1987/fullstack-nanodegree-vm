import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AIRPORTS, getAirportContent, resolveSources, terminalLabel } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { loadAirportPage } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { TranslationNotice } from '@/components/common/translation-notice';
import { relatedOutlets } from '@/components/commerce/commerce-view';
import { needsTranslationNotice, officialDirectory, outletViews, sourceLookup } from '@/components/commerce/commerce-view.server';
import { OutletCard } from '@/components/commerce/outlet-card';
import { OutletDetails } from '@/components/commerce/outlet-details';
import { SavePlaceButton } from '@/components/commerce/save-place-button';
import { airportsWithSection } from '@/components/shell/sections.server';
import { sectionPath } from '@/components/shell/sections';
import { Chip } from '@/components/ui/chip';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { I18nPageScope } from '@/lib/i18n/page-scope';

type OutletPageProps = PageProps<'/[lang]/[airport]/shop-dine/[outlet]'>;

/** Every published outlet of every airport with a shop and dine section is prerendered. */
export function generateStaticParams() {
  const params = airportsWithSection('shop-dine').flatMap((airport) =>
    (getAirportContent(airport)?.outlets ?? []).map((outlet) => ({ airport, outlet: outlet.slug })),
  );
  // Cache Components rejects an empty list; this fallback answers with the not-found page.
  return params.length > 0 ? params : [{ airport: AIRPORTS[0].slug, outlet: 'directory' }];
}

export async function generateMetadata({ params }: OutletPageProps): Promise<Metadata> {
  const { lang: rawLang, airport: slug, outlet: outletSlug } = await params;
  const lang = toLang(rawLang);
  const t = getT(lang);
  const content = getAirportContent(slug);
  const outlet = content?.outlets.find((item) => item.slug === outletSlug);
  if (!content || !outlet) return { title: t('errors.notFoundTitle') };
  const place = terminalLabel(content.airport, outlet.terminal, lang);
  return {
    title: `${outlet.name}, ${place}`,
    description: t('commercePages.outlet.metaDescription', { name: outlet.name, airport: place }),
  };
}

export default function OutletPage({ params }: OutletPageProps) {
  return (
    <I18nPageScope namespaces={['commercePages']}>
      <Suspense
        fallback={
          <Container className="py-10" aria-hidden="true">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-6 h-12 w-80 max-w-full" />
            <Skeleton className="mt-10 h-72 w-full" />
          </Container>
        }
      >
        <Outlet params={params} />
      </Suspense>
  
    </I18nPageScope>
  );
}

async function Outlet({ params }: { params: OutletPageProps['params'] }) {
  const { outlet: outletSlug } = await params;
  const { lang, t, airport, content, sections } = await loadAirportPage(params, 'shop-dine');
  const record = content.outlets.find((item) => item.slug === outletSlug);
  if (!record) notFound();
  const items = outletViews(content, lang, t);
  const outlet = items.find((item) => item.id === record.id);
  if (!outlet) notFound();

  const multiTerminal = airport.terminals.length > 1;
  const directory = officialDirectory(content);
  const directoryKey = outlet.kind === 'service' ? 'services' : outlet.kind;
  const officialUrl =
    directory.find((link) => link.key === directoryKey && (!link.terminal || link.terminal === outlet.terminal))?.url ??
    directory.find((link) => link.key === 'airportPage')?.url ??
    directory[0].url;
  const related = relatedOutlets(items, outlet);
  const shopDine = sectionPath(airport.slug, 'shop-dine');
  const translationMissing = needsTranslationNotice([record.description, record.locationNote], lang);

  return (
    <>
      <PageHeader
        eyebrow={`${outlet.categoryLabel} · ${outlet.terminalLabel}`}
        title={outlet.name}
        lead={outlet.description}
        breadcrumbs={
          <Breadcrumbs
            items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.shopDine'), href: shopDine }, { label: outlet.name }]}
          />
        }
        meta={
          <>
            <ProvenanceTag provenance={outlet.provenance} />
            {outlet.zone === 'airside' ? <Chip icon="scan-line">{t('commercePages.card.zone.airside')}</Chip> : null}
            {outlet.zone === 'landside' ? <Chip icon="door-open">{t('commercePages.card.zone.landside')}</Chip> : null}
            {outlet.halal === 'certified' ? (
              <Chip tone="positive" icon="badge-check">
                {t('commercePages.card.halal.certified')}
              </Chip>
            ) : null}
          </>
        }
        actions={<SavePlaceButton id={outlet.id} airport={airport.slug} title={outlet.name} href={outlet.href} />}
      />
      <Container className="pb-section">
        {translationMissing ? <TranslationNotice className="mb-6" /> : null}
        <OutletDetails
          outlet={outlet}
          terminalName={terminalLabel(airport, outlet.terminal, lang)}
          sources={resolveSources(record.sources)}
          officialUrl={officialUrl}
          mapPageHref={sections.includes('map') ? sectionPath(airport.slug, 'map', multiTerminal ? outlet.terminal : undefined) : undefined}
        />

        {related.length > 0 ? (
          <section aria-labelledby="related-title" className="mt-16 border-t border-line pt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <h2 id="related-title" className="type-title-lg text-ink">
                {t('commercePages.outlet.relatedTitle', { airport: airport.shortName })}
              </h2>
              <LocaleLink href={shopDine} className="link-action type-body-sm inline-flex items-center gap-1.5">
                {t('commercePages.outlet.backToAll')}
                <Icon name="arrow-right" size="sm" />
              </LocaleLink>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="flex min-w-0 [&>article]:flex-1">
                  <OutletCard outlet={item} sources={sourceLookup(item.sourceIds)} showTerminal={multiTerminal} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}

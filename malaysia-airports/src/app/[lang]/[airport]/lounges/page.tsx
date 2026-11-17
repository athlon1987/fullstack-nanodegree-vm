import { Suspense } from 'react';
import { getAirport, terminalLabel, type Lang } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { TranslationNotice } from '@/components/common/translation-notice';
import {
  REST_CATEGORIES,
  needsTranslationNotice,
  officialAirportPage,
  officialLoungeListing,
  restViews,
  type RestView,
} from '@/components/commerce/commerce-view.server';
import { LoungeCard } from '@/components/commerce/lounge-card';
import { RestExplainer } from '@/components/commerce/rest-explainer';
import { TerminalSections } from '@/components/commerce/terminal-sections';
import { sectionPath } from '@/components/shell/sections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

export const generateStaticParams = () => sectionStaticParams('lounges');

export async function generateMetadata({ params }: PageProps<'/[lang]/[airport]/lounges'>) {
  const { lang, airport: slug } = await params;
  const airport = getAirport(slug);
  const t = getT(toLang(lang));
  return airportSectionMetadata(params, 'lounges', airport ? { description: t('commercePages.lounges.metaDescription', { airport: airport.name }) } : {});
}

/** Lounges, hotels, rest and shower facilities at one airport, by terminal and side of security. */
export default function LoungesPage({ params }: PageProps<'/[lang]/[airport]/lounges'>) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-8 h-72 w-full" />
        </Container>
      }
    >
      <Lounges params={params} />
    </Suspense>
  );
}

const SIDES = ['airside', 'landside', 'unknown'] as const;
type Side = (typeof SIDES)[number];

function sideOf(item: RestView): Side {
  return item.zone === 'airside' || item.zone === 'both' ? 'airside' : item.zone;
}

function SideGroups({ items, lang, level, idPrefix, showTerminal }: { items: RestView[]; lang: Lang; level: 2 | 3; idPrefix: string; showTerminal: boolean }) {
  const t = getT(lang);
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className="flex flex-col gap-10">
      {SIDES.map((side) => {
        const group = items.filter((item) => sideOf(item) === side);
        if (group.length === 0) return null;
        const id = `${idPrefix}-${side}`;
        return (
          <section key={side} aria-labelledby={id}>
            <div className="mb-4 border-b border-line pb-2">
              <Heading id={id} className="type-title-md flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
                <Icon name={side === 'airside' ? 'scan-line' : side === 'landside' ? 'door-open' : 'circle-dashed'} size="sm" className="text-ink-2" />
                {t(`commercePages.lounges.groups.${side}`)}
                <span className="type-data-sm text-ink-3">{group.length}</span>
              </Heading>
              <p className="type-body-sm mt-1 text-ink-2">{t(`commercePages.lounges.groups.${side}Hint`)}</p>
            </div>
            <ul className="grid gap-4 lg:grid-cols-2">
              {group.map((item) => (
                <li key={item.id} className="flex min-w-0 [&>article]:flex-1">
                  <LoungeCard item={item} lang={lang} showTerminal={showTerminal} headingLevel={level === 2 ? 3 : 4} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

async function Lounges({ params }: { params: AirportPageParams }) {
  const { lang, t, airport, content, sections } = await loadAirportPage(params, 'lounges');
  const items = restViews(content, lang);
  const multiTerminal = airport.terminals.length > 1;
  const counts = REST_CATEGORIES.map((category) => ({ category, count: items.filter((item) => item.category === category).length })).filter(
    (entry) => entry.count > 0,
  );
  const listing = officialLoungeListing(content);
  const translationMissing = needsTranslationNotice(
    content.facilities.flatMap((facility) => [facility.name, facility.description, facility.locationNote, facility.access]),
    lang,
  );

  return (
    <>
      <PageHeader
        eyebrow={airport.shortName}
        title={t('nav.lounges')}
        lead={t('commercePages.lounges.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.lounges') }]} />}
        meta={counts.map((entry) => (
          <Badge key={entry.category} size="md" className="type-body-sm px-2.5">
            {t.count(`commercePages.lounges.count.${entry.category}`, entry.count)}
          </Badge>
        ))}
        actions={
          sections.includes('shop-dine') ? (
            <Button asChild variant="secondary" iconStart="utensils">
              <LocaleLink href={sectionPath(airport.slug, 'shop-dine')}>{t('nav.shopDine')}</LocaleLink>
            </Button>
          ) : undefined
        }
      />
      <Container className="pb-section">
        {translationMissing ? <TranslationNotice className="mb-6" /> : null}
        {multiTerminal ? (
          <TerminalSections
            sections={airport.terminals.map((terminal) => {
              const list = items.filter((item) => item.terminal === terminal.id);
              const id = `lounges-${terminal.id.toLowerCase()}`;
              const name = terminalLabel(airport, terminal.id, lang);
              return {
                id: terminal.id,
                content: (
                  <section aria-labelledby={id} className="mb-14">
                    <h2 id={id} className="type-display-sm mb-6 text-ink">
                      {name}
                    </h2>
                    {list.length > 0 ? (
                      <SideGroups items={list} lang={lang} level={3} idPrefix={id} showTerminal={false} />
                    ) : (
                      <p className="type-body text-ink-2">{t('commercePages.lounges.terminalEmpty', { terminal: name })}</p>
                    )}
                  </section>
                ),
              };
            })}
          />
        ) : (
          <SideGroups items={items} lang={lang} level={2} idPrefix="lounges" showTerminal={false} />
        )}

        <RestExplainer lang={lang} transitHref={sections.includes('transit') ? sectionPath(airport.slug, 'transit') : undefined} />

        <section aria-labelledby="lounges-gaps-title" className="mt-14 grid gap-6 border-t border-line pt-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10">
          <h2 id="lounges-gaps-title" className="type-title-lg text-ink">
            {t('commercePages.lounges.gapsTitle')}
          </h2>
          <div className="min-w-0 max-w-reading">
            <p className="type-body text-ink-2">{t('commercePages.lounges.gapsBody')}</p>
            <ul className="mt-4 flex flex-col gap-1">
              {listing ? (
                <li>
                  <ExternalLink href={listing} variant="action" className="type-body-sm">
                    {t('commercePages.lounges.officialListing')}
                  </ExternalLink>
                </li>
              ) : null}
              <li>
                <ExternalLink href={officialAirportPage(content)} variant="action" className="type-body-sm">
                  {t('commercePages.lounges.officialAirport')}
                </ExternalLink>
              </li>
              {sections.includes('facilities') ? (
                <li>
                  <LocaleLink href={sectionPath(airport.slug, 'facilities')} className="link-action type-body-sm">
                    {t('commercePages.lounges.facilitiesLink')}
                  </LocaleLink>
                </li>
              ) : null}
            </ul>
          </div>
        </section>
      </Container>
    </>
  );
}

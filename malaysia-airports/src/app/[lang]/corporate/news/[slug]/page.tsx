import type { Metadata } from 'next';
import { CORPORATE_LINKS, getAirport, localizeAirport } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { mediaSlugs, mediaView, mediaViews } from '@/components/corporate/corporate-data.server';
import { MediaList } from '@/components/corporate/media-list';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';

export function generateStaticParams() {
  return mediaSlugs().map((slug) => ({ slug }));
}

/** Module content only: every story is fully static and an unknown slug is a real 404. */
export const ensureStatic = 'navigation';

/** Same shape as `PageProps<'/[lang]/corporate/news/[slug]'>`, written out so it does not depend on generated route types. */
type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = toLang(rawLang);
  const item = mediaView(slug, lang);
  if (!item) return { title: getT(lang)('errors.notFoundTitle') };
  return { title: item.title, description: item.summary };
}

/**
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed story is complete in the static HTML, so the heading and the first content paint
 * with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other story gets `MissingPage`, a 404 with the site shell.
 */
export default function CorporateNewsItemPage({ params }: { params: Params }) {
  return <NewsItem params={params} />;
}

async function NewsItem({ params }: { params: Params }) {
  const { lang: rawLang, slug } = await params;
  const lang = toLang(rawLang);
  const t = getT(lang);
  const item = mediaView(slug, lang);
  if (!item) return <MissingPage />;
  const more = mediaViews(lang)
    .filter((other) => other.slug !== item.slug)
    .sort((a, b) => Number(b.topic === item.topic) - Number(a.topic === item.topic))
    .slice(0, 3);

  return (
    <>
      <CorporateHeader
        t={t}
        current="media"
        title={item.title}
        trail={[{ label: t('corporatePages.media.title'), href: '/corporate/news' }]}
        meta={
          <>
            <time dateTime={item.date} className="type-body-sm tabular font-semibold text-ink">
              {item.dateLabel}
            </time>
            <Badge tone={item.kind === 'release' ? 'primary' : 'neutral'} size="sm">
              {t(`corporatePages.media.kind.${item.kind}`)}
            </Badge>
            <span className="type-body-sm text-ink-2">{t(`corporatePages.media.topic.${item.topic}`)}</span>
          </>
        }
      />
      <Container className="flex flex-col gap-14 pb-section">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="min-w-0">
            <p className="type-body-lg max-w-reading text-ink">{item.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProvenanceTag provenance={item.provenance} length="short" />
            </div>
            {item.airports.length ? (
              <div className="mt-10">
                <h2 className="type-title-sm text-ink">{t('corporatePages.media.airportsTitle')}</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.airports.map((slug) => {
                    const airport = getAirport(slug);
                    if (!airport) return null;
                    return (
                      <li key={slug}>
                        <LocaleLink
                          href={`/${airport.slug}`}
                          className="type-body-sm inline-flex min-h-11 items-center gap-2 rounded-pill border border-line-control bg-surface px-4 text-ink transition-colors duration-fast hover:border-ink"
                        >
                          <span className="type-data-xs text-ink-3">{airport.code}</span>
                          {localizeAirport(airport, lang).shortName}
                        </LocaleLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <LocaleLink href="/corporate/news" className="link-action type-body-sm mt-10 text-ink">
              <Icon name="arrow-left" size="sm" strokeWidth={1.75} />
              {t('corporatePages.media.back')}
            </LocaleLink>
          </article>
          <aside aria-labelledby="story-sources" className="self-start rounded-lg border border-line-strong bg-surface p-5">
            <h2 id="story-sources" className="type-title-sm text-ink">
              {t('corporatePages.media.sourcesTitle')}
            </h2>
            <p className="type-body-sm mt-1 text-ink-2">{t('corporatePages.media.sourcesLead')}</p>
            <SourceNote className="mt-2" sources={item.sources} defaultOpen />
          </aside>
        </div>

        {more.length ? (
          <section aria-labelledby="story-more" className="border-t border-line pt-12">
            <h2 id="story-more" className="type-display-sm mb-6 text-ink">
              {t('corporatePages.media.moreTitle')}
            </h2>
            <MediaList items={more} t={t} variant="cards" />
          </section>
        ) : null}

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

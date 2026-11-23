import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { Suspense } from 'react';
import { getT } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHero } from '@/components/guides/page-hero';
import { SearchResults } from '@/components/search/search-results';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { alternates: languageAlternates(await routeLang(), '/search'), title: t('search.title'), description: t('search.pageLead') };
}

/**
 * Search results. The page is static: the query (`?q=`) is read on the client inside the
 * Suspense boundary, and the documents are fetched from `/[lang]/search/index.json`.
 */
export default async function SearchPage() {
  const t = getT(await routeLang());
  return (
    <>
      {/* Redesign stage two: the quiet editorial header, then the search card and app-like results. */}
      <PageHero tone="light" emblem="search" width="narrow" title={t('search.title')} lead={t('search.pageLead')} breadcrumbs={<Breadcrumbs items={[{ label: t('search.title') }]} />} />
      {/* The results arrive after the index loads: the column reserves most of a screen, so the
          footer is never in the first view and is not pushed down while the visitor watches. */}
      <Container size="narrow" className="min-h-[70vh] pb-section">
        <Suspense
          fallback={
            // The same box as the search card (field plus padding), so nothing moves when it arrives.
            <div className="flex flex-col gap-8">
              <Skeleton className="h-20 w-full rounded-3xl sm:h-24" />
              <p className="type-body px-1 text-ink-2">{t('search.pagePrompt')}</p>
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </Container>
    </>
  );
}

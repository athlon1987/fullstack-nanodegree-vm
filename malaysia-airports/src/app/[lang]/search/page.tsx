import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { Suspense } from 'react';
import { getT } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { SearchResults } from '@/components/search/search-results';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { title: t('search.title'), description: t('search.pageLead') };
}

/**
 * Search results. The page is static: the query (`?q=`) is read on the client inside the
 * Suspense boundary, and the documents are fetched from `/[lang]/search/index.json`.
 */
export default async function SearchPage() {
  const t = getT(await routeLang());
  return (
    <>
      <PageHeader title={t('search.title')} lead={t('search.pageLead')} breadcrumbs={<Breadcrumbs items={[{ label: t('search.title') }]} />} width="narrow" />
      <Container size="narrow" className="pb-section">
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-13 w-full" />
              <p className="type-body text-ink-2">{t('search.pagePrompt')}</p>
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </Container>
    </>
  );
}

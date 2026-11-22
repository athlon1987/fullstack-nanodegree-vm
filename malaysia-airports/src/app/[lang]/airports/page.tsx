import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { Suspense } from 'react';
import { AIRPORTS } from '@/content';
import { getT } from '@/lib/i18n';
import { AirportDirectory, AirportDirectoryView } from '@/components/airport/airport-directory';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { alternates: languageAlternates(await routeLang(), '/airports'), title: t('airportsPage.title'), description: t('airportsPage.metaDescription') };
}

/**
 * The airport chooser and directory. It is also the "choose an airport first" step:
 * `/airports?then=parking` continues to that section once an airport is chosen. The parameter is
 * read on the client inside the Suspense boundary, so the page stays static; the fallback is the
 * same directory without the continuation, which is also what visitors without JavaScript get.
 */
export default async function AirportsPage() {
  const t = getT(await routeLang());
  return (
    <>
      <PageHeader
        eyebrow={t('airportsPage.eyebrow')}
        title={t('airportsPage.title')}
        lead={t('airportsPage.lead', { count: AIRPORTS.length })}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.airports') }]} />}
      />
      <Container className="pb-section">
        <Suspense fallback={<AirportDirectoryView />}>
          <AirportDirectory />
        </Suspense>
      </Container>
    </>
  );
}

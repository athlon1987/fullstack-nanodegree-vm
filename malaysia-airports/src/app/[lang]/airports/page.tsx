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
import { toMediaImage, type MediaImage } from '@/components/ui/media';
import { AIRPORT_HERO_IMAGES, IMAGES } from '@/content/images';
import { toLang } from '@/lib/i18n';

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
  const lang = toLang(await routeLang());
  const t = getT(lang);
  // Redesign round one: photo-led cards for airports with their own photograph (never the
  // Malaysia fallback: a directory card shows the airport itself). Decorative: the name is the link.
  const photos: Record<string, MediaImage> = {};
  for (const airport of AIRPORTS) {
    const id = AIRPORT_HERO_IMAGES[airport.slug]?.[0];
    if (id !== undefined) photos[airport.slug] = toMediaImage(IMAGES[id], lang, { decorative: true });
  }
  return (
    <>
      <PageHeader
        eyebrow={t('airportsPage.eyebrow')}
        title={t('airportsPage.title')}
        lead={t('airportsPage.lead', { count: AIRPORTS.length })}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.airports') }]} />}
      />
      <Container className="pb-section">
        <Suspense fallback={<AirportDirectoryView photos={photos} />}>
          <AirportDirectory photos={photos} />
        </Suspense>
      </Container>
    </>
  );
}

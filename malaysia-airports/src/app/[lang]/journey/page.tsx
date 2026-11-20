import type { Metadata } from 'next';
import { Suspense } from 'react';
import { airportsWithContent, getAirportContent, pick } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { MyJourney } from '@/components/flights/my-journey';
import type { CarParkOption } from '@/components/flights/parked-car-card';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

export async function generateMetadata({ params }: PageProps<'/[lang]/journey'>): Promise<Metadata> {
  const { lang } = await params;
  const t = getT(lang);
  return { title: t('journey.saved.title'), description: t('flightPages.journey.metaDescription'), robots: { index: false, follow: true } };
}

/**
 * My journey. The page itself is static: the server prepares the published car parks for the
 * parking note, and the empty state is in the server HTML. Everything personal is read from this
 * device after hydration; each saved flight's airport notes are fetched on demand from
 * `/[lang]/journey/content/[airport]` (performance-06).
 */
export default function JourneyPage({ params }: PageProps<'/[lang]/journey'>) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="mt-8 h-64 w-full" />
        </Container>
      }
    >
      <Journey params={params} />
    </Suspense>
  );
}

async function Journey({ params }: { params: PageProps<'/[lang]/journey'>['params'] }) {
  const lang = toLang((await params).lang);
  const t = getT(lang);
  const carParks: CarParkOption[] = [];
  for (const slug of airportsWithContent()) {
    const content = getAirportContent(slug);
    if (!content) continue;
    // Premium car parks repeat the airport's warning in the saved note (transport hand-off).
    const premium = content.guidesNotes.find((note) => note.id === `${slug}-preferred-parking-warning`);
    for (const carPark of content.carParks) {
      const warning = carPark.type === 'preferred' && premium ? { title: pick(premium.title, lang), body: pick(premium.body, lang), provenance: premium.provenance } : undefined;
      carParks.push({ id: carPark.id, airport: carPark.airport, name: pick(carPark.name, lang), warning });
    }
  }

  return (
    <>
      <PageHeader
        title={t('journey.saved.title')}
        lead={t('flightPages.journey.lead')}
        meta={
          <p className="type-body-sm inline-flex items-center gap-2 text-ink-2">
            <Icon name="shield-check" size="sm" className="text-ink" />
            {t('journey.saved.storedLocally')}
          </p>
        }
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.myJourney') }]} />}
      />
      <Container className="pb-section">
        <MyJourney carParks={carParks} />
      </Container>
    </>
  );
}

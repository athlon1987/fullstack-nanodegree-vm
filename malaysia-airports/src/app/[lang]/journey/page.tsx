import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { airportsWithContent, getAirportContent, pick } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { MyJourney } from '@/components/flights/my-journey';
import type { CarParkOption } from '@/components/flights/parked-car-card';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/journey'), title: t('journey.saved.title'), description: t('flightPages.journey.metaDescription'), robots: { index: false, follow: true } };
}

/**
 * My journey. The page itself is static: the server prepares the published car parks for the
 * parking note, and the empty state is in the server HTML. Everything personal is read from this
 * device after hydration; each saved flight's airport notes are fetched on demand from
 * `/[lang]/journey/content/[airport]` (performance-06).
 *
 * The language comes from the root params (as on the concierge page), so there is no Suspense
 * fallback to swap out: the first HTML is the page itself, with no layout shift.
 */
export default async function JourneyPage() {
  const lang = toLang(await routeLang());
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
    <I18nPageScope namespaces={['home']}>
      <>
        {/* Redesign round one (critique item 10): a compact midnight header (the h1 and the lead),
            so the saved flight, not a form page, is the first thing; the privacy line sits under the list. */}
        <PageHeader
          tone="midnight"
          tightOnPhones
          compactOnDesktop
          title={t('journey.saved.title')}
          lead={t('flightPages.journey.lead')}
          leadClassName="max-sm:hidden"
          breadcrumbs={<Breadcrumbs items={[{ label: t('nav.myJourney') }]} />}
        />
        <Container className="pt-6 pb-section sm:pt-8">
          <MyJourney carParks={carParks} />
          <p className="type-body-sm mt-10 inline-flex items-center gap-2 text-ink-2">
            <Icon name="shield-check" size="sm" className="text-ink" />
            {t('journey.saved.storedLocally')}
          </p>
        </Container>
      </>
  
    </I18nPageScope>
  );
}

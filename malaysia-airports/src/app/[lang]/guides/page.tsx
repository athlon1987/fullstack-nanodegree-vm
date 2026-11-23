import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { GuideIndex } from '@/components/guides/guide-index';
import { guideGroups } from '@/components/guides/guide-views.server';
import { NextStepCards } from '@/components/guides/next-step-cards';
import { GUIDES_HUB_IMAGE } from '@/components/guides/guide-meta';
import { PageHero } from '@/components/guides/page-hero';
import { toMediaImage } from '@/components/ui/media';
import { IMAGES } from '@/content/images';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/guides'), title: t('guidePages.title'), description: t('guidePages.hub.metaDescription') };
}

/**
 * Plan your journey: every guide, grouped by stage of the trip, with an "applies to" filter.
 * Fully static; the filter is the only client-side behaviour.
 */
export default async function GuidesPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  return (
    <I18nPageScope namespaces={['guidePages']}>
      <>
        {/* Redesign stage two: an editorial hub under a photograph of the gate area at KLIA Terminal 1. */}
        <PageHero
          image={toMediaImage(IMAGES[GUIDES_HUB_IMAGE], lang, { credit: true })}
          size="lg"
          title={t('guidePages.title')}
          lead={t('guidePages.hub.lead')}
          breadcrumbs={<Breadcrumbs items={[{ label: t('nav.plan') }]} />}
        />
        <Container className="pt-10 pb-section sm:pt-14">
          <GuideIndex groups={guideGroups(lang)} />
        </Container>
        <Section tone="midnight" spacing="md" aria-label={t('guidePages.hub.help.title')}>
          <NextStepCards t={t} />
        </Section>
        <Container className="py-14 sm:py-16">
          <ProvenanceLegend headingLevel={2} />
        </Container>
      </>
    </I18nPageScope>
  );
}

import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { GuideIndex } from '@/components/guides/guide-index';
import { guideGroups } from '@/components/guides/guide-views.server';
import { NextStepCards } from '@/components/guides/next-step-cards';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('guidePages.title'), description: t('guidePages.hub.metaDescription') };
}

/**
 * Plan your journey: every guide, grouped by stage of the trip, with an "applies to" filter.
 * Fully static; the filter is the only client-side behaviour.
 */
export default async function GuidesPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  return (
    <>
      <PageHeader title={t('guidePages.title')} lead={t('guidePages.hub.lead')} breadcrumbs={<Breadcrumbs items={[{ label: t('nav.plan') }]} />} />
      <Container className="pb-16">
        <GuideIndex groups={guideGroups(lang)} />
      </Container>
      <Section tone="subtle" spacing="md" aria-label={t('guidePages.hub.help.title')}>
        <NextStepCards t={t} />
      </Section>
      <Container className="py-section">
        <ProvenanceLegend headingLevel={2} />
      </Container>
    </>
  );
}

import { Suspense } from 'react';
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
import { I18nPageScope } from '@/lib/i18n/page-scope';

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
    <I18nPageScope namespaces={['guidePages']}>
      <>
        <PageHeader title={t('guidePages.title')} lead={t('guidePages.hub.lead')} breadcrumbs={<Breadcrumbs items={[{ label: t('nav.plan') }]} />} />
        {/* Round 5 (A-09, E-01): the index and the cards below the header hydrate in their own
            boundary, after the header and in small slices. Nothing in it suspends: the HTML is
            the same and nothing is revealed late (no `$RC`). */}
        <Suspense>
          <Container className="pb-16">
            <GuideIndex groups={guideGroups(lang)} />
          </Container>
          <Section tone="subtle" spacing="md" aria-label={t('guidePages.hub.help.title')}>
            <NextStepCards t={t} />
          </Section>
          <Container className="py-section">
            <ProvenanceLegend headingLevel={2} />
          </Container>
        </Suspense>
      </>
    </I18nPageScope>
  );
}

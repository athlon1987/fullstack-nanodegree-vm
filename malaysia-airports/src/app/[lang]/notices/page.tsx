import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getNotices } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { NoticesBrowser } from '@/components/airport/notices-browser';
import { toNoticeViews } from '@/components/airport/notice-views.server';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHero } from '@/components/guides/page-hero';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { alternates: languageAlternates(await routeLang(), '/notices'), title: t('notices.title'), description: t('noticesPage.metaDescription') };
}

/**
 * Travel advisories and operational notices: everything in the content layer, with provenance
 * and sources. Whether a notice is in effect depends on the clock, so that label and the
 * filters are client-side; the notices themselves are in the static HTML.
 */
export default async function NoticesPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  return (
    <>
      {/* Redesign stage two: the quiet editorial header, a white filter tray, compact expandable notices. */}
      <PageHero tone="light" emblem="megaphone" width="narrow" title={t('notices.title')} lead={t('noticesPage.lead')} breadcrumbs={<Breadcrumbs items={[{ label: t('notices.title') }]} />} />
      <Container size="narrow" className="flex flex-col gap-12 pb-section">
        <NoticesBrowser notices={toNoticeViews(getNotices(), lang)} />
        <ProvenanceLegend headingLevel={2} />
      </Container>
    </>
  );
}

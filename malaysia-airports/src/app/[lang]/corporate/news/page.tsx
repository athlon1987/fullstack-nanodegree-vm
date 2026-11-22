import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CORPORATE_LINKS, TRAFFIC_FIGURES, TRAFFIC_RELEASE_PATTERN } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, mediaViews } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { JumpNav } from '@/components/corporate/jump-nav';
import { MediaList } from '@/components/corporate/media-list';
import { PageSection } from '@/components/corporate/page-section';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { TrafficTable } from '@/components/corporate/traffic-table';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/corporate/news'), title: t('corporatePages.media.title'), description: t('corporatePages.media.metaDescription') };
}

/** Media centre: traffic statistics as reported, then company news, newest first. */
export default async function CorporateMediaPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const items = mediaViews(lang);

  return (
    <>
      <CorporateHeader
        t={t}
        current="media"
        title={t('corporatePages.media.title')}
        lead={t('corporatePages.media.lead')}
        meta={
          <JumpNav
            label={t('corporatePages.common.onThisPage')}
            items={[
              { id: 'statistics', label: t('corporatePages.media.statsTitle'), icon: 'layers' },
              { id: 'news', label: t('corporatePages.media.newsTitle'), icon: 'newspaper' },
            ]}
          />
        }
      />
      <Container className="flex flex-col gap-14 pb-section">
        <PageSection
          id="statistics"
          first
          number={1}
          title={t('corporatePages.media.statsTitle')}
          lead={t('corporatePages.media.statsLead')}
          action={
            <ExternalLink variant="action" href={CORPORATE_LINKS.corporateSite.url} className="text-ink">
              {t('corporatePages.media.officialAction')}
            </ExternalLink>
          }
        >
          <TrafficTable figures={TRAFFIC_FIGURES} lang={lang} t={t} />
          <FactList className="mt-8" facts={factViews([TRAFFIC_RELEASE_PATTERN], lang)} t={t} layout="rows" />
        </PageSection>

        <PageSection id="news" number={2} title={t('corporatePages.media.newsTitle')} lead={`${t('corporatePages.media.newsLead')} ${t.count('corporatePages.media.count', items.length)}.`}>
          <MediaList items={items} t={t} />
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

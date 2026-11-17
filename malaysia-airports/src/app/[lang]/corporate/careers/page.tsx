import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CORPORATE_LINKS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { FactMeta } from '@/components/corporate/fact-meta';
import { MissingFact } from '@/components/corporate/missing-fact';
import { LinkOutCard } from '@/components/corporate/link-out-card';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { RebungRule } from '@/components/art/patterns';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('corporatePages.careers.title'), description: t('corporatePages.careers.metaDescription') };
}

/** Careers: the official portal, what is not published, and how to apply safely. */
export default async function CorporateCareersPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const portalSources = resolveCorporateSources([...CORPORATE_LINKS.careers.sources, ...CORPORATE_LINKS.careersLeaders.sources]);

  return (
    <>
      <CorporateHeader t={t} current="careers" title={t('corporatePages.careers.title')} lead={t('corporatePages.careers.lead')} />
      <Container className="flex flex-col gap-10 pb-section">
        <section aria-labelledby="careers-portal" className="relative overflow-hidden rounded-xl bg-inverse px-5 py-8 text-on-inverse sm:px-10 sm:py-12">
          <RebungRule size="lg" className="absolute inset-x-0 top-0 opacity-70" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <span aria-hidden="true" className="mb-5 flex size-12 items-center justify-center rounded-md border border-on-inverse-dim/40">
                <Icon name="users" size="lg" strokeWidth={1.5} />
              </span>
              <h2 id="careers-portal" className="type-display-md">
                {t('corporatePages.careers.portalTitle')}
              </h2>
              <p className="type-body-lg mt-3 max-w-reading text-on-inverse-dim">{t('corporatePages.careers.portalBody')}</p>
            </div>
            <a
              href={CORPORATE_LINKS.careers.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-md bg-on-inverse px-5 text-base font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 lg:self-end"
            >
              {t('corporatePages.careers.portalAction')}
              <Icon name="arrow-up-right" size="sm" strokeWidth={1.75} />
              <span className="sr-only"> ({t('common.labels.newTab')})</span>
            </a>
          </div>
        </section>
        <FactMeta provenance="official" sources={portalSources} className="-mt-6" />

        <div className="grid gap-5 lg:grid-cols-3">
          <LinkOutCard icon="landmark" title={t('corporatePages.about.leadership.title')} links={[{ href: CORPORATE_LINKS.careersLeaders.url, label: t('corporatePages.careers.leadersAction') }]} sources={resolveCorporateSources(CORPORATE_LINKS.careersLeaders.sources)}>
            {t('corporatePages.careers.leadersBody')}
          </LinkOutCard>
          <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
            <h2 className="type-title-md text-ink">{t('corporatePages.careers.programmesTitle')}</h2>
            <MissingFact t={t} officialUrl={CORPORATE_LINKS.careers.url} />
          </div>
          <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="type-title-md text-ink">{t('corporatePages.careers.safetyTitle')}</h2>
              <ProvenanceTag provenance="suggestion" length="short" />
            </div>
            <p className="type-body text-ink-2">{t('corporatePages.careers.safetyBody')}</p>
            <ExternalLink variant="action" href={CORPORATE_LINKS.scamAlert.url} className="type-body-sm mt-auto text-ink">
              {t('corporatePages.careers.safetyAction')}
            </ExternalLink>
            <FactMeta provenance="official" sources={resolveCorporateSources(CORPORATE_LINKS.scamAlert.sources)} />
          </div>
        </div>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

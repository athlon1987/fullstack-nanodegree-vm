import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CORPORATE_IDENTITY, CORPORATE_LINKS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { LinkOutCard } from '@/components/corporate/link-out-card';
import { PageSection } from '@/components/corporate/page-section';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/corporate/governance'), title: t('corporatePages.governance.title'), description: t('corporatePages.governance.metaDescription') };
}

/** Governance: ownership and oversight, agreements, privacy, scam alerts, concerns and company details. */
export default async function CorporateGovernancePage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const sources = (ids: readonly string[]) => resolveCorporateSources(ids);

  return (
    <>
      <CorporateHeader t={t} current="governance" title={t('corporatePages.governance.title')} lead={t('corporatePages.governance.lead')} />
      <Container className="flex flex-col gap-14 pb-section">
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <li className="flex">
            <LinkOutCard
              className="w-full"
              icon="landmark"
              title={t('corporatePages.governance.ownershipTitle')}
              links={[
                { href: '/corporate/about#ownership', label: t('corporatePages.governance.ownershipAction') },
                { href: CORPORATE_LINKS.board.url, label: t('corporatePages.about.leadership.boardAction') },
              ]}
            >
              {t('corporatePages.governance.ownershipBody')}
            </LinkOutCard>
          </li>
          <li className="flex">
            <LinkOutCard className="w-full" icon="file-text" title={t('corporatePages.governance.agreementsTitle')} links={[{ href: '/corporate/about#agreements', label: t('corporatePages.governance.agreementsAction') }]}>
              {t('corporatePages.governance.agreementsBody')}
            </LinkOutCard>
          </li>
          <li className="flex">
            <LinkOutCard className="w-full" icon="shield-check" title={t('corporatePages.governance.privacyTitle')} links={[{ href: CORPORATE_LINKS.privacyNotice.url, label: t('corporatePages.governance.privacyAction') }, { href: '/privacy', label: t('corporatePages.governance.privacyPrototype') }]} sources={sources(CORPORATE_LINKS.privacyNotice.sources)}>
              {t('corporatePages.governance.privacyBody')}
            </LinkOutCard>
          </li>
          <li className="flex">
            <LinkOutCard className="w-full" icon="megaphone" title={t('corporatePages.governance.whistleTitle')} notPublished={{ officialUrl: CORPORATE_LINKS.contact.url, t }}>
              {t('corporatePages.governance.whistleBody')}
            </LinkOutCard>
          </li>
          <li className="flex">
            <LinkOutCard className="w-full" icon="ban" title={t('corporatePages.governance.briberyTitle')} notPublished={{ officialUrl: CORPORATE_LINKS.corporateSite.url, t }}>
              {t('corporatePages.governance.briberyBody')}
            </LinkOutCard>
          </li>
          <li className="flex">
            <LinkOutCard
              className="w-full"
              icon="triangle-alert"
              title={t('corporatePages.governance.scamTitle')}
              links={[
                { href: CORPORATE_LINKS.scamAlert.url, label: t('corporatePages.governance.scamPassenger') },
                { href: CORPORATE_LINKS.corporateScamAlert.url, label: t('corporatePages.governance.scamCorporate') },
              ]}
              sources={sources([...CORPORATE_LINKS.scamAlert.sources, ...CORPORATE_LINKS.corporateScamAlert.sources])}
            >
              {t('corporatePages.governance.scamBody')}
            </LinkOutCard>
          </li>
        </ul>

        <PageSection id="company" title={t('corporatePages.governance.identityTitle')}>
          <FactList facts={factViews(CORPORATE_IDENTITY.filter((fact) => fact.id === 'registration-number'), lang)} t={t} layout="rows" />
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

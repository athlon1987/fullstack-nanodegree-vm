import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CORPORATE_IDENTITY, CORPORATE_LINKS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { ContactChannelList } from '@/components/corporate/contact-channel-list';
import { corporateChannels } from '@/components/corporate/contact-views.server';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { LinkOutCard } from '@/components/corporate/link-out-card';
import { PageSection } from '@/components/corporate/page-section';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/corporate/contact'), title: t('corporatePages.contact.title'), description: t('corporatePages.contact.metaDescription') };
}

/** Contact: sourced channels only, the corporate office, and where other enquiries go. */
export default async function CorporateContactPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);

  return (
    <>
      <CorporateHeader t={t} current="contact" title={t('corporatePages.contact.title')} lead={t('corporatePages.contact.lead')} />
      <Container className="flex flex-col gap-20 pt-12 pb-section sm:gap-24 sm:pt-16">
        <PageSection id="channels" first title={t('corporatePages.contact.channelsTitle')}>
          <ContactChannelList label={t('corporatePages.contact.channelsTitle')} channels={corporateChannels(lang, t)} />
        </PageSection>

        <PageSection id="office" title={t('corporatePages.contact.officeTitle')}>
          <FactList facts={factViews(CORPORATE_IDENTITY.filter((fact) => fact.id === 'corporate-office'), lang)} t={t} layout="rows" />
        </PageSection>

        <PageSection id="other" title={t('corporatePages.contact.otherTitle')}>
          <div className="grid gap-5 md:grid-cols-3">
            <LinkOutCard icon="newspaper" title={t('corporatePages.contact.mediaTitle')} notPublished={{ officialUrl: CORPORATE_LINKS.contact.url, t }}>
              {t('corporatePages.contact.mediaBody')}
            </LinkOutCard>
            <LinkOutCard icon="landmark" title={t('corporatePages.contact.investorsTitle')} links={[{ href: '/corporate/about#ownership', label: t('corporatePages.contact.investorsAction') }]}>
              {t('corporatePages.contact.investorsBody')}
            </LinkOutCard>
            <LinkOutCard icon="circle-help" title={t('corporatePages.contact.passengersTitle')} links={[{ href: '/help', label: t('corporatePages.contact.passengersAction') }]}>
              {t('corporatePages.contact.passengersBody')}
            </LinkOutCard>
          </div>
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

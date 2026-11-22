import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CORPORATE_LINKS, GROUP_COMPANIES, LEADERSHIP_CHECKED, LEADERSHIP_UNNAMED_ROLES, SUSTAINABILITY_TARGETS, pick, type CorporateFact, type Lang } from '@/content';
import { getT, toLang, type Translator } from '@/lib/i18n';
import type { TKey } from '@/lib/i18n/translate';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { BusinessAreaCard } from '@/components/corporate/business-area-card';
import { ContactChannelList } from '@/components/corporate/contact-channel-list';
import { corporateChannels } from '@/components/corporate/contact-views.server';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, formatPartialDate, resolveCorporateSources, type FactView } from '@/components/corporate/corporate-data.server';
import { FactMeta } from '@/components/corporate/fact-meta';
import { PageSection } from '@/components/corporate/page-section';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Callout } from '@/components/ui/callout';
import { Container } from '@/components/ui/container';
import type { IconName } from '@/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/corporate/business'), title: t('corporatePages.business.title'), description: t('corporatePages.business.metaDescription') };
}

type AreaId = 'procurement' | 'commercial' | 'advertising' | 'airlines' | 'cargo' | 'aeropolis' | 'consultancy';

const AREAS: readonly { id: AreaId; icon: IconName }[] = [
  { id: 'procurement', icon: 'stamp' },
  { id: 'commercial', icon: 'shopping-bag' },
  { id: 'advertising', icon: 'megaphone' },
  { id: 'airlines', icon: 'plane-takeoff' },
  { id: 'cargo', icon: 'package-search' },
  { id: 'aeropolis', icon: 'sun' },
  { id: 'consultancy', icon: 'compass' },
];

/** A role the management team page lists, as a fact ("The management team page lists a Chief Procurement Officer."). */
function roleFact(en: string, lang: Lang, t: Translator): FactView[] {
  const role = LEADERSHIP_UNNAMED_ROLES.find((item) => item.en === en);
  if (!role) return [];
  return [
    {
      id: `role-${role.en.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      label: t('corporatePages.about.leadership.managementTitle'),
      value: t('corporatePages.business.roleKnown', { role: pick(role, lang) }),
      asOf: formatPartialDate(LEADERSHIP_CHECKED, lang),
      provenance: 'official',
      sources: resolveCorporateSources(CORPORATE_LINKS.managementTeam.sources),
    },
  ];
}

const byId = (facts: readonly CorporateFact[], id: string) => facts.filter((fact) => fact.id === id);

/** Business with us: what is published for each line of business, and how to reach Malaysia Airports. */
export default async function CorporateBusinessPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const facts: Record<AreaId, FactView[]> = {
    procurement: roleFact('Chief Procurement Officer', lang, t),
    commercial: factViews(byId(GROUP_COMPANIES, 'ma-niaga'), lang),
    advertising: [],
    airlines: roleFact('Chief Aviation Development Officer', lang, t),
    cargo: [],
    aeropolis: factViews(byId(SUSTAINABILITY_TARGETS, 'klia-solar-impact'), lang),
    consultancy: factViews(byId(GROUP_COMPANIES, 'macs'), lang),
  };
  const scamSources = resolveCorporateSources(CORPORATE_LINKS.corporateScamAlert.sources);

  return (
    <>
      <CorporateHeader t={t} current="business" title={t('corporatePages.business.title')} lead={t('corporatePages.business.lead')} />
      <Container className="flex flex-col gap-14 pb-section">
        <Callout tone="warning" title={t('corporatePages.business.scamTitle')}>
          <p>{t('corporatePages.business.scamBody')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            <ExternalLink variant="action" href={CORPORATE_LINKS.corporateScamAlert.url} className="type-body-sm text-ink">
              {t('corporatePages.business.scamAction')}
            </ExternalLink>
            <FactMeta provenance="official" sources={scamSources} />
          </div>
        </Callout>

        <section aria-labelledby="areas-title">
          <h2 id="areas-title" className="sr-only">
            {t('corporatePages.business.title')}
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {AREAS.map((area) => (
              <li key={area.id}>
                <BusinessAreaCard
                  id={area.id}
                  icon={area.icon}
                  title={t(`corporatePages.business.areas.${area.id}.title` as TKey)}
                  body={t(`corporatePages.business.areas.${area.id}.body` as TKey)}
                  facts={facts[area.id]}
                  t={t}
                />
              </li>
            ))}
          </ul>
        </section>

        <PageSection id="contact" title={t('corporatePages.business.contactTitle')} lead={t('corporatePages.business.contactBody')}>
          <ContactChannelList label={t('corporatePages.business.contactTitle')} channels={corporateChannels(lang, t, ['contact-page', 'group-email', 'group-phone'])} />
          <p className="type-body-sm mt-5 flex max-w-reading flex-wrap items-center gap-x-3 gap-y-2 text-ink-2">
            <ProvenanceTag provenance="suggestion" length="short" />
            {t('corporatePages.common.channelCheck')}
          </p>
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import {
  BRAND_FACTS,
  CORPORATE_LINKS,
  CORPORATE_MILESTONES,
  GROUP_COMPANIES,
  LEADERSHIP_BOARD,
  LEADERSHIP_CHECKED,
  LEADERSHIP_MANAGEMENT,
  LEADERSHIP_UNNAMED_ROLES,
  OPERATING_AGREEMENT_FACTS,
  OWNERSHIP_FACTS,
  RECOGNITION_FACTS,
  pick,
  type CorporatePerson,
  type Lang,
} from '@/content';
import { getT, toLang, type Translator } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { BrandStatement } from '@/components/corporate/brand-statement';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, formatPartialDate, provenanceOf, resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { FactMeta } from '@/components/corporate/fact-meta';
import { JumpNav } from '@/components/corporate/jump-nav';
import { MissingFact } from '@/components/corporate/missing-fact';
import { MilestoneList, type MilestoneView } from '@/components/corporate/milestone-list';
import { PageSection } from '@/components/corporate/page-section';
import { PersonList, type PersonView } from '@/components/corporate/person-list';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('corporatePages.about.title'), description: t('corporatePages.about.metaDescription') };
}

function personView(person: CorporatePerson, lang: Lang, t: Translator): PersonView {
  const sources = resolveCorporateSources(person.sources);
  return {
    id: person.id,
    name: person.name,
    role: pick(person.role, lang),
    since: person.since ? t('corporatePages.common.since', { date: formatPartialDate(person.since, lang) }) : undefined,
    note: person.note ? pick(person.note, lang) : undefined,
    provenance: provenanceOf(sources),
    sources,
  };
}

/** About: history, ownership, leadership, brand, group companies, Operating Agreements, recognition. */
export default async function CorporateAboutPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const asOf = (date: string) => t('corporatePages.common.asOf', { date });

  const milestones: MilestoneView[] = CORPORATE_MILESTONES.map((item) => {
    const sources = resolveCorporateSources(item.sources);
    return {
      id: item.id,
      year: item.date.slice(0, 4),
      dateLabel: item.date.length > 4 ? formatPartialDate(item.date, lang) : undefined,
      title: pick(item.title, lang),
      body: item.body ? pick(item.body, lang) : undefined,
      provenance: provenanceOf(sources),
      sources,
    };
  });
  const checked = formatPartialDate(LEADERSHIP_CHECKED, lang);
  const managementSources = resolveCorporateSources(LEADERSHIP_MANAGEMENT.flatMap((person) => person.sources).filter((id, index, all) => all.indexOf(id) === index));

  const jump = [
    { id: 'history', label: t('corporatePages.about.jump.history') },
    { id: 'ownership', label: t('corporatePages.about.jump.ownership') },
    { id: 'leadership', label: t('corporatePages.about.jump.leadership') },
    { id: 'brand', label: t('corporatePages.about.jump.brand') },
    { id: 'companies', label: t('corporatePages.about.jump.companies') },
    { id: 'agreements', label: t('corporatePages.about.jump.agreements') },
    { id: 'recognition', label: t('corporatePages.about.jump.recognition') },
  ];

  return (
    <>
      <CorporateHeader
        t={t}
        current="about"
        title={t('corporatePages.about.title')}
        lead={t('corporatePages.about.lead')}
        meta={<JumpNav label={t('corporatePages.common.onThisPage')} items={jump} />}
      />
      <Container className="flex flex-col gap-14 pb-section">
        <PageSection id="history" first number={1} title={t('corporatePages.about.history.title')} lead={t('corporatePages.about.history.lead')}>
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <MilestoneList items={milestones} />
            <aside aria-labelledby="history-earlier" className="self-start rounded-lg border border-line-strong bg-page-subtle p-5">
              <h3 id="history-earlier" className="type-title-sm text-ink">
                {t('corporatePages.about.history.earlierTitle')}
              </h3>
              <p className="type-body-sm mt-1.5 text-ink-2">{t('corporatePages.about.history.earlierBody')}</p>
              <ExternalLink variant="action" href={CORPORATE_LINKS.corporateSite.url} className="type-body-sm mt-1 text-ink">
                {t('corporatePages.common.officialSite')}
              </ExternalLink>
            </aside>
          </div>
        </PageSection>

        <PageSection id="ownership" number={2} title={t('corporatePages.about.ownership.title')} lead={t('corporatePages.about.ownership.lead')}>
          <FactList facts={factViews(OWNERSHIP_FACTS, lang)} t={t} layout="rows" />
        </PageSection>

        <PageSection id="leadership" number={3} title={t('corporatePages.about.leadership.title')} lead={t('corporatePages.about.leadership.lead', { date: checked })}>
          <h3 className="type-title-lg mb-5 text-ink">{t('corporatePages.about.leadership.boardTitle')}</h3>
          <PersonList variant="lead" label={t('corporatePages.about.leadership.boardTitle')} people={LEADERSHIP_BOARD.map((person) => personView(person, lang, t))} />

          <div className="mt-12 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <h3 className="type-title-lg text-ink">{t('corporatePages.about.leadership.managementTitle')}</h3>
              <p className="type-body-sm mt-1.5 mb-4 max-w-reading text-ink-2">{t('corporatePages.about.leadership.managementNote', { date: checked })}</p>
              <PersonList label={t('corporatePages.about.leadership.managementTitle')} people={LEADERSHIP_MANAGEMENT.map((person) => personView(person, lang, t))} />
              <FactMeta className="mt-4" provenance={provenanceOf(managementSources)} dateLabel={asOf(checked)} sources={managementSources} />
              <h4 className="type-title-sm mt-8 text-ink">{t('corporatePages.about.leadership.unnamedTitle')}</h4>
              <ul className="type-body-sm mt-2 grid list-disc gap-1 pl-5 text-ink-2 sm:grid-cols-2">
                {LEADERSHIP_UNNAMED_ROLES.map((role) => (
                  <li key={role.en}>{pick(role, lang)}</li>
                ))}
              </ul>
              <ExternalLink variant="action" href={CORPORATE_LINKS.managementTeam.url} className="type-body-sm mt-3 text-ink">
                {t('corporatePages.about.leadership.managementAction')}
              </ExternalLink>
            </div>
            <div className="self-start">
              <MissingFact
                t={t}
                label={t('corporatePages.about.leadership.boardNotPublished')}
                officialUrl={CORPORATE_LINKS.board.url}
                actionLabel={t('corporatePages.about.leadership.boardAction')}
              />
            </div>
          </div>
        </PageSection>

        <PageSection id="brand" number={4} title={t('corporatePages.about.brand.title')} lead={t('corporatePages.about.brand.lead')}>
          <BrandStatement statements={factViews([BRAND_FACTS.vision, BRAND_FACTS.promise], lang)} asOfLabel={asOf} />
          <FactList className="mt-10" facts={factViews([BRAND_FACTS.values], lang)} t={t} layout="rows" />
          <ExternalLink variant="action" href={CORPORATE_LINKS.brand.url} className="type-body-sm mt-3 text-ink">
            {t('corporatePages.about.brand.brandAction')}
          </ExternalLink>
        </PageSection>

        <PageSection id="companies" number={5} title={t('corporatePages.about.companies.title')} lead={t('corporatePages.about.companies.lead')}>
          <FactList facts={factViews(GROUP_COMPANIES, lang)} t={t} layout="rows" />
          <ExternalLink variant="action" href={CORPORATE_LINKS.subsidiaries.url} className="type-body-sm mt-3 text-ink">
            {t('corporatePages.about.companies.action')}
          </ExternalLink>
        </PageSection>

        <PageSection id="agreements" number={6} title={t('corporatePages.about.agreements.title')} lead={t('corporatePages.about.agreements.lead')}>
          <FactList facts={factViews(OPERATING_AGREEMENT_FACTS, lang)} t={t} layout="rows" />
        </PageSection>

        <PageSection id="recognition" number={7} title={t('corporatePages.about.recognition.title')} lead={t('corporatePages.about.recognition.lead')}>
          <FactList facts={factViews(RECOGNITION_FACTS, lang)} t={t} layout="grid" />
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

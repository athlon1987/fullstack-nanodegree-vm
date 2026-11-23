import { languageAlternates } from '@/lib/seo/metadata';
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
import { corporateImage } from '@/components/corporate/corporate-images';
import { factViews, formatPartialDate, provenanceOf, resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { FactMeta } from '@/components/corporate/fact-meta';
import { JumpNav } from '@/components/corporate/jump-nav';
import { MissingFact } from '@/components/corporate/missing-fact';
import { MilestoneList, type MilestoneView } from '@/components/corporate/milestone-list';
import { PageSection } from '@/components/corporate/page-section';
import { PersonList, type PersonView } from '@/components/corporate/person-list';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { MoreOnPhones } from '@/components/common/more-on-phones';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/corporate/about'), title: t('corporatePages.about.title'), description: t('corporatePages.about.metaDescription') };
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
  // Redesign three (phone page length: about was 15,185 px at 390 px): on phones the latest
  // milestones show and the earlier ones sit behind one line above them, so the timeline still
  // reads oldest first; secondary lists below follow the same pattern (`MoreOnPhones`: open in the
  // server HTML and from 768 px, closed on a phone once loaded below the first screen). Every
  // heading, lead, "not published" note and provenance line outside those lists stays in view.
  const latestShown = 4;
  const earlier = milestones.slice(0, Math.max(0, milestones.length - latestShown));
  const latest = milestones.slice(earlier.length);
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
        image={corporateImage('about', lang)}
        title={t('corporatePages.about.title')}
        lead={t('corporatePages.about.lead')}
        meta={<JumpNav label={t('corporatePages.common.onThisPage')} items={jump} />}
      />
      <Container className="flex flex-col gap-20 pt-12 pb-section sm:gap-24 sm:pt-16">
        <PageSection id="history" first number={1} title={t('corporatePages.about.history.title')} lead={t('corporatePages.about.history.lead')}>
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              {earlier.length > 0 ? (
                <MoreOnPhones
                  className="mb-4 md:mb-0 md:border-b md:border-line md:pb-6"
                  contentClassName="md:pt-0"
                  summary={t('corporatePages.aboutPhone.earlier', { count: earlier.length, from: earlier[0].year, to: earlier[earlier.length - 1].year })}
                >
                  <MilestoneList items={earlier} />
                </MoreOnPhones>
              ) : null}
              <MilestoneList items={latest} />
            </div>
            <aside aria-labelledby="history-earlier" className="self-start rounded-2xl bg-page-subtle p-5 sm:p-6">
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
              <MoreOnPhones summary={t('corporatePages.aboutPhone.management', { count: LEADERSHIP_MANAGEMENT.length })} contentClassName="md:pt-0">
                <PersonList label={t('corporatePages.about.leadership.managementTitle')} people={LEADERSHIP_MANAGEMENT.map((person) => personView(person, lang, t))} />
              </MoreOnPhones>
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
          <MoreOnPhones summary={t('corporatePages.aboutPhone.companies', { count: GROUP_COMPANIES.length })} contentClassName="md:pt-0">
            <FactList facts={factViews(GROUP_COMPANIES, lang)} t={t} layout="rows" />
          </MoreOnPhones>
          <ExternalLink variant="action" href={CORPORATE_LINKS.subsidiaries.url} className="type-body-sm mt-3 text-ink">
            {t('corporatePages.about.companies.action')}
          </ExternalLink>
        </PageSection>

        <PageSection id="agreements" number={6} title={t('corporatePages.about.agreements.title')} lead={t('corporatePages.about.agreements.lead')}>
          <MoreOnPhones summary={t('corporatePages.aboutPhone.agreements', { count: OPERATING_AGREEMENT_FACTS.length })} contentClassName="md:pt-0">
            <FactList facts={factViews(OPERATING_AGREEMENT_FACTS, lang)} t={t} layout="rows" />
          </MoreOnPhones>
        </PageSection>

        <PageSection id="recognition" number={7} title={t('corporatePages.about.recognition.title')} lead={t('corporatePages.about.recognition.lead')}>
          <MoreOnPhones summary={t('corporatePages.aboutPhone.recognition', { count: RECOGNITION_FACTS.length })} contentClassName="md:pt-0">
            <FactList facts={factViews(RECOGNITION_FACTS, lang)} t={t} layout="grid" />
          </MoreOnPhones>
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

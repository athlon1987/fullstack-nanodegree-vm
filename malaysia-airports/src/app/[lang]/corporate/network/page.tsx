import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import {
  AIRPORTS,
  CORPORATE_KEY_FIGURES,
  CORPORATE_LINKS,
  GROUP_COMPANIES,
  NETWORK_PROJECTS,
  TRAFFIC_FIGURES,
  airportsByClassification,
  getAirport,
  getCorporatePage,
  pick,
  type CorporateFact,
} from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { LocaleLink } from '@/components/common/locale-link';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, formatMillions, mediaView, provenanceOf, resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { FactMeta } from '@/components/corporate/fact-meta';
import { PageSection } from '@/components/corporate/page-section';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('corporatePages.network.title'), description: t('corporatePages.network.metaDescription') };
}

/** Our airports: how the network is organised, how busy it is, and what is being built. */
export default async function CorporateNetworkPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const groups = airportsByClassification();
  const networkPage = getCorporatePage('network');
  const networkSources = resolveCorporateSources(networkPage?.sources);
  const notInNetwork = networkPage?.body.find((block) => block.type === 'paragraph');

  // The classification counts come from the airport registry; the annual report states the same split.
  const structure: CorporateFact[] = [
    { id: 'international', label: { en: t('airportSwitcher.international'), ms: t('airportSwitcher.international') }, value: { en: String(groups.international.length) }, asOf: networkPage?.asOf ?? '2024-04-29', sources: networkPage?.sources ?? [] },
    { id: 'domestic', label: { en: t('airportSwitcher.domestic') }, value: { en: String(groups.domestic.length) }, asOf: networkPage?.asOf ?? '2024-04-29', sources: networkPage?.sources ?? [] },
    { id: 'stolports', label: { en: t('airportSwitcher.stolports') }, value: { en: String(groups.stolport.length) }, asOf: networkPage?.asOf ?? '2024-04-29', sources: networkPage?.sources ?? [] },
  ];
  const trafficFacts = factViews(CORPORATE_KEY_FIGURES.filter((fact) => fact.id !== 'airports-in-malaysia'), lang);
  const istanbul = GROUP_COMPANIES.find((company) => company.id === 'istanbul-sabiha-gokcen');
  const istanbulTraffic = TRAFFIC_FIGURES.find((figure) => figure.id === 'istanbul-2025');
  const kotaBharu = mediaView('kota-bharu-expanded-terminal-full-operation', lang);

  return (
    <>
      <CorporateHeader t={t} current="network" title={t('corporatePages.network.title')} lead={t('corporatePages.network.lead')} />
      <Container className="flex flex-col gap-14 pb-section">
        <PageSection
          id="structure"
          first
          number={1}
          title={t('corporatePages.network.structureTitle')}
          lead={t('corporatePages.network.structureLead')}
          action={
            <LocaleLink href="/airports" className="link-action text-ink">
              {t('corporatePages.network.browseAction', { count: AIRPORTS.length })}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          }
        >
          <FactList facts={factViews(structure, lang)} t={t} layout="figures" className="lg:grid-cols-3" />
          <div className="mt-10 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <h3 className="type-title-md text-ink">{t('corporatePages.network.internationalTitle')}</h3>
              <ul className="mt-3 border-t border-line">
                {groups.international.map((airport) => (
                  <li key={airport.slug} className="border-b border-line">
                    <LocaleLink href={`/${airport.slug}`} className="group flex min-h-12 items-center justify-between gap-4 py-2 text-ink">
                      <span className="flex min-w-0 items-baseline gap-3">
                        <span className="type-data-sm w-10 shrink-0 text-ink-3">{airport.code}</span>
                        <span className="type-body group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{airport.name}</span>
                      </span>
                      <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="shrink-0 text-ink-3 group-hover:text-ink" />
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 self-start lg:pt-10">
              {notInNetwork && notInNetwork.type === 'paragraph' ? <p className="type-body max-w-reading text-ink-2">{pick(notInNetwork.text, lang)}</p> : null}
              <FactMeta className="mt-3" provenance={provenanceOf(networkSources)} sources={networkSources} />
            </div>
          </div>
        </PageSection>

        <PageSection
          id="traffic"
          number={2}
          title={t('corporatePages.network.trafficTitle')}
          lead={t('corporatePages.network.trafficLead')}
          action={
            <LocaleLink href="/corporate/news#statistics" className="link-action text-ink">
              {t('corporatePages.network.trafficAction')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          }
        >
          <FactList facts={trafficFacts} t={t} layout="figures" className="lg:grid-cols-3" />
          {istanbul && istanbulTraffic ? (
            <div className="mt-10 grid gap-x-12 gap-y-2 border-t border-line pt-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
              <h3 className="type-body-sm font-semibold text-ink-2">{pick(istanbul.label, lang)}</h3>
              <div className="min-w-0">
                <p className="type-body-lg text-ink">{pick(istanbul.value, lang)}</p>
                <p className="type-body mt-1 text-ink-2">{t('corporatePages.network.istanbulTraffic', { value: formatMillions(istanbulTraffic.millions, lang, t, istanbulTraffic.qualifier) })}</p>
                <FactMeta
                  className="mt-2"
                  provenance={provenanceOf(resolveCorporateSources([...istanbul.sources, ...istanbulTraffic.sources]))}
                  sources={resolveCorporateSources([...istanbul.sources, ...istanbulTraffic.sources])}
                />
              </div>
            </div>
          ) : null}
        </PageSection>

        <PageSection id="projects" number={3} title={t('corporatePages.network.projectsTitle')} lead={t('corporatePages.network.projectsLead')}>
          <ul className="grid gap-5 lg:grid-cols-3">
            {NETWORK_PROJECTS.map((project) => {
              const airport = getAirport(project.airport);
              return (
                <li key={project.id} className="flex min-w-0 flex-col gap-4 rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
                  <div>
                    {airport ? <p className="type-eyebrow text-gold-ink">{airport.shortName}</p> : null}
                    <h3 className="type-title-md mt-1.5 text-ink">{pick(project.title, lang)}</h3>
                  </div>
                  <FactList facts={factViews(project.facts, lang)} t={t} layout="rows" className="[&>div]:md:grid-cols-1" />
                </li>
              );
            })}
            {kotaBharu ? (
              <li className="flex min-w-0 flex-col gap-4 rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
                <div>
                  <p className="type-eyebrow text-gold-ink">{getAirport('kbr')?.shortName}</p>
                  <h3 className="type-title-md mt-1.5 text-ink">{kotaBharu.title}</h3>
                </div>
                <p className="type-body text-ink-2">{kotaBharu.summary}</p>
                <FactMeta provenance={kotaBharu.provenance} dateLabel={kotaBharu.dateLabel} sources={kotaBharu.sources} />
                <LocaleLink href={`/corporate/news/${kotaBharu.slug}`} className="link-action type-body-sm mt-auto text-ink">
                  {t('corporatePages.common.readMore')}
                  <span className="sr-only">: {kotaBharu.title}</span>
                  <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                </LocaleLink>
              </li>
            ) : null}
          </ul>
        </PageSection>

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

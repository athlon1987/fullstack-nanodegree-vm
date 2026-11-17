import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CARBON_ACCREDITATIONS, CORPORATE_LINKS, SUSTAINABILITY_TARGETS, getAirport, pick } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { SourceNote } from '@/components/common/source-note';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, formatPartialDate, mediaViews, resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { MissingFact } from '@/components/corporate/missing-fact';
import { MediaList } from '@/components/corporate/media-list';
import { PageSection } from '@/components/corporate/page-section';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { Container } from '@/components/ui/container';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { RowHeader } from '@/components/corporate/row-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('corporatePages.sustainability.title'), description: t('corporatePages.sustainability.metaDescription') };
}

/** Sustainability: climate targets, Airport Carbon Accreditation by airport, related news. */
export default async function CorporateSustainabilityPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const news = mediaViews(lang).filter((item) => item.topic === 'sustainability');

  return (
    <>
      <CorporateHeader
        t={t}
        current="sustainability"
        title={t('corporatePages.sustainability.title')}
        lead={t('corporatePages.sustainability.lead')}
        actions={
          <ExternalLink variant="action" href={CORPORATE_LINKS.sustainability.url} className="text-ink">
            {t('corporatePages.sustainability.officialAction')}
          </ExternalLink>
        }
      />
      <Container className="flex flex-col gap-14 pb-section">
        <PageSection id="targets" first number={1} title={t('corporatePages.sustainability.targetsTitle')}>
          <FactList facts={factViews(SUSTAINABILITY_TARGETS, lang)} t={t} layout="grid" />
        </PageSection>

        <PageSection id="accreditation" number={2} title={t('corporatePages.sustainability.accreditationTitle')} lead={t('corporatePages.sustainability.accreditationLead')}>
          <TableScroll label={t('corporatePages.sustainability.tableCaption')}>
            <Table className="min-w-[36rem]">
              <caption className="sr-only">{t('corporatePages.sustainability.tableCaption')}</caption>
              <THead>
                <Tr>
                  <Th>{t('corporatePages.sustainability.colAirport')}</Th>
                  <Th>{t('corporatePages.sustainability.colLevel')}</Th>
                  <Th>{t('corporatePages.sustainability.colDate')}</Th>
                  <Th>{t('corporatePages.sustainability.colSources')}</Th>
                </Tr>
              </THead>
              <TBody>
                {CARBON_ACCREDITATIONS.map((item) => {
                  const airport = getAirport(item.airport);
                  return (
                    <Tr key={item.airport}>
                      <RowHeader>
                        {airport ? (
                          <LocaleLink href={`/${airport.slug}`} className="link font-semibold text-ink">
                            {airport.name}
                          </LocaleLink>
                        ) : (
                          item.airport.toUpperCase()
                        )}
                      </RowHeader>
                      <Td>
                        <span className="font-semibold text-ink">{t('corporatePages.sustainability.level', { level: item.level })}</span>
                        {item.levelName ? <span className="text-ink-2"> · {pick(item.levelName, lang)}</span> : null}
                      </Td>
                      <Td className="whitespace-nowrap">{formatPartialDate(item.asOf, lang, 'medium')}</Td>
                      <Td>
                        <SourceNote sources={resolveCorporateSources(item.sources)} />
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </TableScroll>
          <div className="mt-6 max-w-reading">
            <h3 className="type-title-sm text-ink">{t('corporatePages.sustainability.othersTitle')}</h3>
            <MissingFact t={t} className="mt-2" label={t('corporatePages.sustainability.othersBody')} officialUrl={CORPORATE_LINKS.sustainability.url} />
          </div>
        </PageSection>

        {news.length ? (
          <PageSection id="news" number={3} title={t('corporatePages.media.newsTitle')}>
            <MediaList items={news} t={t} />
          </PageSection>
        ) : null}

        <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
      </Container>
    </>
  );
}

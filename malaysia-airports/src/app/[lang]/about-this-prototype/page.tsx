import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { ALL_SOURCES, CORPORATE_SOURCES, airportsWithContent, formatAsOf, getAirportContent, localizeAirport, pick, resolveSources } from '@/content';
import { getDictionary, getT, toLang } from '@/lib/i18n';
import type { TKey } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { JumpNav } from '@/components/corporate/jump-nav';
import { PageSection } from '@/components/corporate/page-section';
import { Chip } from '@/components/ui/chip';
import { Container } from '@/components/ui/container';
import { Icon, type IconName } from '@/components/ui/icon';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { RowHeader } from '@/components/corporate/row-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/about-this-prototype'), title: t('corporatePages.prototype.title'), description: t('corporatePages.prototype.metaDescription') };
}

type Status = 'verified' | 'mixed' | 'demo' | 'grounded';
type DataRow = 'airports' | 'content' | 'corporate' | 'flights' | 'waits' | 'maps' | 'alerts' | 'concierge';

const DATA_ROWS: readonly { id: DataRow; status: Status }[] = [
  { id: 'airports', status: 'verified' },
  { id: 'content', status: 'mixed' },
  { id: 'corporate', status: 'verified' },
  { id: 'flights', status: 'demo' },
  { id: 'waits', status: 'demo' },
  { id: 'maps', status: 'demo' },
  { id: 'alerts', status: 'demo' },
  { id: 'concierge', status: 'grounded' },
];

const STATUS_CHIP: Record<Exclude<Status, 'demo'>, { icon: IconName; tone: 'positive' | 'neutral' | 'info' }> = {
  verified: { icon: 'badge-check', tone: 'positive' },
  mixed: { icon: 'circle-dashed', tone: 'neutral' },
  grounded: { icon: 'messages-square', tone: 'info' },
};

const INTEGRATIONS = ['flights', 'parking', 'retail', 'transport', 'cms', 'notifications'] as const;

/** About this prototype: what it is, real versus demonstration data, sourcing, production needs, targets, limits. */
export default async function AboutPrototypePage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const copy = getDictionary(lang).corporatePages.prototype;
  const sourceCount = new Set([...ALL_SOURCES, ...CORPORATE_SOURCES].map((source) => source.id)).size;

  // What the prototype has not verified, one list per airport, from the coverage notes (D-05).
  // Section pages link here (`#gaps-<airport>`) instead of repeating the list.
  const gapLists = airportsWithContent().flatMap((slug) => {
    const content = getAirportContent(slug);
    if (!content) return [];
    const notes = content.guidesNotes.filter((note) => note.topic === 'coverage');
    return notes.length > 0 ? [{ slug, name: localizeAirport(content.airport, lang).shortName, notes }] : [];
  });

  const jump = (['what', 'data', 'sourcing', 'gaps', 'integrations', 'targets', 'limits'] as const).map((id) => ({ id, label: t(`corporatePages.prototype.jump.${id}`) }));

  return (
    <>
      <CorporateHeader
        t={t}
        current={null}
        title={t('corporatePages.prototype.title')}
        lead={t('corporatePages.prototype.lead')}
        meta={<JumpNav label={t('corporatePages.common.onThisPage')} items={jump} />}
      />
      <Container className="flex flex-col gap-14 pb-section">
        <PageSection id="what" first number={1} title={t('corporatePages.prototype.what.title')}>
          <div className="grid gap-5 md:grid-cols-2">
            {(
              [
                ['isTitle', copy.what.is, 'circle-check'],
                ['isNotTitle', copy.what.isNot, 'circle-x'],
              ] as const
            ).map(([titleKey, list, icon]) => (
              <div key={titleKey} className="rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
                <h3 className="type-title-md text-ink">{t(`corporatePages.prototype.what.${titleKey}`)}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {Object.values(list).map((item) => (
                    <li key={item} className="type-body flex gap-3 text-ink-2">
                      <Icon name={icon} size="md" strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink" />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 max-w-reading">
            <h3 className="type-title-sm text-ink">{t('corporatePages.prototype.what.markTitle')}</h3>
            <p className="type-body-sm mt-1 text-ink-2">{t('corporatePages.prototype.what.markBody')}</p>
          </div>
        </PageSection>

        <PageSection id="data" number={2} title={t('corporatePages.prototype.data.title')} lead={t('corporatePages.prototype.data.lead')}>
          <TableScroll label={t('corporatePages.prototype.data.tableCaption')}>
            <Table className="min-w-[40rem]">
              <caption className="sr-only">{t('corporatePages.prototype.data.tableCaption')}</caption>
              <THead>
                <Tr>
                  <Th>{t('corporatePages.prototype.data.colArea')}</Th>
                  <Th>{t('corporatePages.prototype.data.colStatus')}</Th>
                  <Th>{t('corporatePages.prototype.data.colLabel')}</Th>
                </Tr>
              </THead>
              <TBody>
                {DATA_ROWS.map((row) => (
                  <Tr key={row.id}>
                    <RowHeader>
                      {t(`corporatePages.prototype.data.rows.${row.id}.area` as TKey)}
                    </RowHeader>
                    <Td className="whitespace-nowrap">
                      {row.status === 'demo' ? (
                        <ProvenanceTag provenance="demo" />
                      ) : (
                        <Chip tone={STATUS_CHIP[row.status].tone} icon={STATUS_CHIP[row.status].icon}>
                          {t(`corporatePages.prototype.data.${row.status}`)}
                        </Chip>
                      )}
                    </Td>
                    <Td className="text-ink-2">{t(`corporatePages.prototype.data.rows.${row.id}.label` as TKey)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        </PageSection>

        <PageSection id="sourcing" number={3} title={t('corporatePages.prototype.sourcing.title')} lead={t('corporatePages.prototype.sourcing.lead')}>
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ol className="flex flex-col gap-5">
              {Object.values(copy.sourcing.steps).map((step, index) => (
                <li key={step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
                  <span aria-hidden="true" className="type-data-md tabular flex size-10 items-center justify-center rounded-pill border border-line-strong text-ink">
                    {index + 1}
                  </span>
                  <p className="type-body pt-1.5 text-ink-2">{step}</p>
                </li>
              ))}
            </ol>
            <dl className="flex flex-col gap-6 self-start">
              <div className="flex flex-col gap-1 border-t border-ink pt-4">
                <dt className="type-body-sm text-ink-2">{t('corporatePages.prototype.sourcing.countLabel')}</dt>
                <dd className="type-data-xl order-first text-ink">{sourceCount}</dd>
              </div>
              <div className="flex flex-col gap-1 border-t border-line-strong pt-4">
                <dt className="type-body-sm text-ink-2">{t('corporatePages.prototype.sourcing.corporateCountLabel')}</dt>
                <dd className="type-data-lg order-first text-ink">{CORPORATE_SOURCES.length}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-10">
            <h3 className="type-title-md mb-4 text-ink">{t('corporatePages.prototype.sourcing.legendTitle')}</h3>
            <ProvenanceLegend headingLevel={null} />
          </div>
        </PageSection>

        <PageSection id="gaps" number={4} title={t('corporatePages.prototype.gaps.title')} lead={t('corporatePages.prototype.gaps.lead')}>
          <ul className="flex flex-col border-t border-line">
            {gapLists.map((airport) => (
              <li key={airport.slug} id={`gaps-${airport.slug}`} className="scroll-mt-32 border-b border-line py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="type-title-md text-ink">{airport.name}</h3>
                  <LocaleLink href={`/${airport.slug}`} className="link-action type-body-sm text-ink">
                    {t('corporatePages.prototype.gaps.open', { airport: airport.name })}
                    <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                  </LocaleLink>
                </div>
                {airport.notes.map((note) => (
                  <div key={note.id} className="mt-3 max-w-reading">
                    <h4 className="type-title-sm text-ink">{pick(note.title, lang)}</h4>
                    <p className="type-body mt-1 text-ink-2">{pick(note.body, lang)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3">
                      <ProvenanceTag provenance={note.provenance} length="short" />
                      {note.asOf ? <span className="type-caption text-ink-2">{t('corporatePages.prototype.gaps.checked', { date: formatAsOf(note.asOf, lang) })}</span> : null}
                      <SourceNote sources={resolveSources(note.sources)} />
                    </div>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </PageSection>

        <PageSection id="integrations" number={5} title={t('corporatePages.prototype.integrations.title')} lead={t('corporatePages.prototype.integrations.lead')}>
          <TableScroll label={t('corporatePages.prototype.integrations.tableCaption')}>
            <Table className="min-w-[48rem]">
              <caption className="sr-only">{t('corporatePages.prototype.integrations.tableCaption')}</caption>
              <THead>
                <Tr>
                  <Th>{t('corporatePages.prototype.integrations.colIntegration')}</Th>
                  <Th>{t('corporatePages.prototype.integrations.colProvides')}</Th>
                  <Th>{t('corporatePages.prototype.integrations.colDepends')}</Th>
                </Tr>
              </THead>
              <TBody>
                {INTEGRATIONS.map((id) => (
                  <Tr key={id}>
                    <RowHeader className="align-top">
                      {t(`corporatePages.prototype.integrations.rows.${id}.name`)}
                    </RowHeader>
                    <Td className="align-top">{t(`corporatePages.prototype.integrations.rows.${id}.provides`)}</Td>
                    <Td className="align-top text-ink-2">{t(`corporatePages.prototype.integrations.rows.${id}.depends`)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        </PageSection>

        <PageSection
          id="targets"
          number={6}
          title={t('corporatePages.prototype.targets.title')}
          lead={t('corporatePages.prototype.targets.lead')}
          action={
            <LocaleLink href="/accessibility#statement" className="link-action text-ink">
              {t('corporatePages.prototype.targets.statementAction')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            {(
              [
                ['a11yTitle', copy.targets.a11y, 'accessibility'],
                ['perfTitle', copy.targets.perf, 'timer'],
              ] as const
            ).map(([titleKey, list, icon]) => (
              <div key={titleKey} className="rounded-lg border border-line-strong bg-surface p-5 sm:p-6">
                <h3 className="type-title-md flex items-center gap-3 text-ink">
                  <Icon name={icon} size="md" strokeWidth={1.5} />
                  {t(`corporatePages.prototype.targets.${titleKey}`)}
                </h3>
                <ul className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4">
                  {Object.values(list).map((item) => (
                    <li key={item} className="type-body flex gap-3 text-ink-2">
                      <Icon name="check" size="sm" strokeWidth={2} className="mt-1 shrink-0 text-ink" />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </PageSection>

        <PageSection id="limits" number={7} title={t('corporatePages.prototype.limits.title')}>
          <ul className="grid gap-x-10 border-t border-line md:grid-cols-2">
            {Object.values(copy.limits.items).map((item) => (
              <li key={item} className="type-body flex gap-3 border-b border-line py-4 text-ink-2">
                <Icon name="info" size="md" strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-3" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
            <LocaleLink href="/privacy" className="link-action text-ink">
              {t('footer.privacy')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
            <LocaleLink href="/terms" className="link-action text-ink">
              {t('footer.terms')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          </div>
        </PageSection>
      </Container>
    </>
  );
}

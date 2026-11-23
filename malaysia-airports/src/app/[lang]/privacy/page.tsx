import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { CORPORATE_LINKS } from '@/content';
import { I18nScope, getDictionary, getT, toLang } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { resolveCorporateSources } from '@/components/corporate/corporate-data.server';
import { DeviceData } from '@/components/corporate/device-data';
import { MeasurementSwitch } from '@/components/corporate/measurement-switch';
import { FactMeta } from '@/components/corporate/fact-meta';
import { JumpNav } from '@/components/corporate/jump-nav';
import { PageSection } from '@/components/corporate/page-section';
import { DEVICE_KEYS } from '@/components/corporate/storage-keys';
import { Callout } from '@/components/ui/callout';
import { Container } from '@/components/ui/container';
import { Icon, type IconName } from '@/components/ui/icon';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { RowHeader } from '@/components/corporate/row-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/privacy'), title: t('corporatePages.privacy.title'), description: t('corporatePages.privacy.metaDescription') };
}

const SUMMARY_ICONS: readonly IconName[] = ['key-round', 'eye', 'smartphone', 'messages-square'];

/** Privacy: what stays on the device, what the concierge sends, clearing it all, and production intentions. */
export default async function PrivacyPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const copy = getDictionary(lang).corporatePages.privacy;
  const jump = (['summary', 'stored', 'concierge', 'measurement', 'clear', 'production'] as const).map((id) => ({ id, label: t(`corporatePages.privacy.jump.${id}`) }));

  return (
    <>
      <CorporateHeader
        t={t}
        current={null}
        title={t('corporatePages.privacy.title')}
        lead={t('corporatePages.privacy.lead')}
        meta={<JumpNav label={t('corporatePages.common.onThisPage')} items={jump} />}
      />
      <Container className="flex flex-col gap-20 pt-12 pb-section sm:gap-24 sm:pt-16">
        <PageSection id="summary" first number={1} title={t('corporatePages.privacy.summary.title')}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(copy.summary.points).map((point, index) => (
              <li key={point} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary-ink">
                  <Icon name={SUMMARY_ICONS[index] ?? 'check'} size="md" strokeWidth={1.5} />
                </span>
                <p className="type-body text-ink">{point}</p>
              </li>
            ))}
          </ul>
        </PageSection>

        <PageSection id="stored" number={2} title={t('corporatePages.privacy.stored.title')} lead={t('corporatePages.privacy.stored.lead')}>
          <ul aria-label={t('corporatePages.privacy.stored.tableCaption')} className="divide-y divide-line rounded-2xl border border-line bg-surface px-5 shadow-sm sm:hidden">
            {DEVICE_KEYS.map((item) => (
              <li key={item.key} className="py-3.5">
                <code className="type-data-sm break-all text-ink">{item.key}</code>
                <p className="type-body-sm mt-1 text-ink">{t(item.label)}</p>
                <p className="type-caption mt-0.5 text-ink-3">{t(`corporatePages.privacy.stored.${item.area}`)}</p>
              </li>
            ))}
          </ul>
          <TableScroll label={t('corporatePages.privacy.stored.tableCaption')} className="max-sm:hidden">
            <Table className="min-w-[40rem]">
              <caption className="sr-only">{t('corporatePages.privacy.stored.tableCaption')}</caption>
              <THead>
                <Tr>
                  <Th>{t('corporatePages.privacy.stored.colKey')}</Th>
                  <Th>{t('corporatePages.privacy.stored.colWhat')}</Th>
                  <Th>{t('corporatePages.privacy.stored.colWhere')}</Th>
                </Tr>
              </THead>
              <TBody>
                {DEVICE_KEYS.map((item) => (
                  <Tr key={item.key}>
                    <RowHeader className="align-top">
                      <code className="type-data-sm whitespace-nowrap text-ink">{item.key}</code>
                    </RowHeader>
                    <Td className="align-top">{t(item.label)}</Td>
                    <Td className="align-top text-ink-2">{t(`corporatePages.privacy.stored.${item.area}`)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        </PageSection>

        <PageSection id="concierge" number={3} title={t('corporatePages.privacy.concierge.title')} lead={t('corporatePages.privacy.concierge.lead')}>
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ol className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface px-5 shadow-sm sm:px-6">
              {Object.values(copy.concierge.items).map((item, index) => (
                <li key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 py-4">
                  <span aria-hidden="true" className="type-data-sm tabular pt-0.5 text-ink-3">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="type-body text-ink-2">{item}</p>
                </li>
              ))}
            </ol>
            <div className="self-start rounded-2xl bg-page-subtle p-5 sm:p-6">
              <h3 className="type-title-sm flex items-center gap-2 text-ink">
                <Icon name="bell" size="sm" />
                {t('corporatePages.privacy.concierge.notificationsTitle')}
              </h3>
              <p className="type-body-sm mt-1.5 text-ink-2">{t('corporatePages.privacy.concierge.notificationsBody')}</p>
            </div>
          </div>
        </PageSection>

        <PageSection id="measurement" number={4} title={t('corporatePages.privacy.measurement.title')} lead={t('corporatePages.privacy.measurement.lead')}>
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface px-5 shadow-sm sm:px-6">
              {Object.values(copy.measurement.items).map((item) => (
                <li key={item} className="py-4">
                  <p className="type-body text-ink-2">{item}</p>
                </li>
              ))}
            </ul>
            <div className="self-start">
              <I18nScope lang={lang} namespaces={['corporatePages.privacy.measurement']}>
                <MeasurementSwitch />
              </I18nScope>
            </div>
          </div>
        </PageSection>

        <PageSection id="clear" number={5} title={t('corporatePages.privacy.clear.title')} lead={t('corporatePages.privacy.clear.lead')}>
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Package E (fix round, performance-09): corporate copy is no longer in the root dictionary. */}
            <I18nScope lang={lang} namespaces={['corporatePages.privacy']}>
              <DeviceData />
            </I18nScope>
            <div className="self-start">
              <h3 className="type-title-sm text-ink">{t('corporatePages.privacy.clear.browserTitle')}</h3>
              <p className="type-body-sm mt-1.5 text-ink-2">{t('corporatePages.privacy.clear.browserBody')}</p>
            </div>
          </div>
        </PageSection>

        <PageSection id="production" number={6} title={t('corporatePages.privacy.production.title')} lead={t('corporatePages.privacy.production.lead')}>
          <Callout tone="info" title={t('corporatePages.privacy.production.disclaimerTitle')} className="mb-8">
            {t('corporatePages.privacy.production.disclaimer')}
          </Callout>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(copy.production.items).map((item) => (
              <li key={item.title} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <h3 className="type-title-sm text-ink">{item.title}</h3>
                <p className="type-body-sm mt-1.5 text-ink-2">{item.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <ProvenanceTag provenance="suggestion" />
          </div>
          <div className="mt-10 max-w-reading rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <h3 className="type-title-md text-ink">{t('corporatePages.privacy.production.officialTitle')}</h3>
            <p className="type-body mt-1.5 text-ink-2">{t('corporatePages.privacy.production.officialBody')}</p>
            <ExternalLink variant="action" href={CORPORATE_LINKS.privacyNotice.url} className="type-body-sm mt-1 text-ink">
              {t('corporatePages.privacy.production.officialAction')}
            </ExternalLink>
            <FactMeta className="mt-1" provenance="official" sources={resolveCorporateSources(CORPORATE_LINKS.privacyNotice.sources)} />
          </div>
        </PageSection>
      </Container>
    </>
  );
}

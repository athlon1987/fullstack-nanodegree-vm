import type { Lang } from '@/content/types';
import { getT } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { Icon } from '@/components/ui/icon';
import type { OfficialLink } from './commerce-view.server';

export interface PartialNoteProps {
  lang: Lang;
  airportName: string;
  count: number;
  links: readonly OfficialLink[];
  terminalLabels: Readonly<Record<string, string>>;
}

/**
 * The honest note at the top of the results: the directory is partial in this prototype, and
 * the official directory is one tap away.
 */
export function PartialNote({ lang, airportName, count, links, terminalLabels }: PartialNoteProps) {
  const t = getT(lang);
  const directory = links.filter((link) => link.key !== 'airportPage');
  const airportPage = links.find((link) => link.key === 'airportPage');
  return (
    <aside aria-labelledby="partial-note-title" className="mb-6 flex gap-4 rounded-xl border border-line-strong bg-page-subtle p-4 sm:p-5">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-2 max-xs:hidden">
        <Icon name="circle-dashed" />
      </span>
      <div className="min-w-0">
        <p className="type-eyebrow text-gold-ink">{t('commercePages.partial.eyebrow')}</p>
        <h2 id="partial-note-title" className="type-title-sm mt-1 text-ink">
          {t('commercePages.partial.title')}
        </h2>
        <p className="type-body-sm mt-1.5 max-w-reading text-ink-2">{t('commercePages.partial.body', { count, airport: airportName })}</p>
        <div className="mt-3 flex flex-col gap-1">
          <p className="type-caption font-semibold text-ink-2">
            {t('commercePages.partial.officialTitle')}
            {directory[0]?.terminal ? ` · ${terminalLabels[directory[0].terminal] ?? directory[0].terminal}` : null}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-0">
            {directory.map((link) => (
              <li key={link.key}>
                <ExternalLink href={link.url} variant="action" className="type-body-sm">
                  {t(`commercePages.partial.${link.key as 'dine' | 'shop' | 'services'}`)}
                </ExternalLink>
              </li>
            ))}
            {airportPage ? (
              <li>
                <ExternalLink href={airportPage.url} variant="action" className="type-body-sm">
                  {t('commercePages.partial.airportPage')}
                </ExternalLink>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export interface CoverageProps {
  lang: Lang;
  stats: { total: number; location: number; hours: number; halal: number; price: number };
}

/**
 * How much of each detail the sources publish. It explains why "Open now" and price filters
 * find little, and shows what discovery will do once the official data is connected.
 */
export function Coverage({ lang, stats }: CoverageProps) {
  const t = getT(lang);
  const rows = [
    { key: 'location', value: stats.location },
    { key: 'hours', value: stats.hours },
    { key: 'halal', value: stats.halal },
    { key: 'price', value: stats.price },
  ] as const;
  return (
    <section aria-labelledby="coverage-title" className="mt-16 border-t border-line pt-10">
      <div className="grid gap-x-10 gap-y-3 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <h2 id="coverage-title" className="type-title-lg text-ink">
          {t('commercePages.coverage.title')}
        </h2>
        <p className="type-body max-w-reading text-ink-2">{t('commercePages.coverage.lead')}</p>
      </div>
      <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line-strong bg-line sm:grid-cols-2 lg:grid-cols-5">
        <div className="min-w-0 bg-surface p-5">
          <dt className="type-body-sm text-ink-2">{t('commercePages.coverage.outlets')}</dt>
          <dd className="type-data-xl mt-2 text-ink">{stats.total}</dd>
        </div>
        {rows.map((row) => {
          const share = stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0;
          return (
            <div key={row.key} className="min-w-0 bg-surface p-5">
              <dt className="type-body-sm text-ink-2">{t(`commercePages.coverage.${row.key}`)}</dt>
              <dd className="mt-2">
                <span className="type-data-md text-ink">{t('commercePages.coverage.of', { count: row.value, total: stats.total })}</span>
                <span aria-hidden="true" className="mt-3 block h-1.5 overflow-hidden rounded-pill bg-line">
                  <span className="block h-full rounded-pill bg-ink" style={{ width: `${share}%` }} />
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-10 grid gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h3 className="type-title-md text-ink">{t('commercePages.howTitle')}</h3>
          <p className="type-body-sm mt-2 text-ink-2">{t('commercePages.howBody')}</p>
        </div>
        <ProvenanceLegend kinds={['official', 'estimated', 'demo']} headingLevel={null} className="max-w-narrow" />
      </div>
    </section>
  );
}

'use client';

import type { Source } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { NotPublished } from '@/components/common/not-published';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Icon } from '@/components/ui/icon';
import type { OutletView } from './commerce-view';
import { AsOfText, FactRows, HoursText } from './fact-rows';
import { OpenStatus } from './open-status';

export interface OutletDetailsProps {
  outlet: OutletView;
  /** Full terminal name ("KLIA Terminal 1"). */
  terminalName: string;
  sources: Source[];
  /** Official page to check hours and location: the directory for its type, or the airport page. */
  officialUrl: string;
  /** Locale-free link to the airport's terminal map, when it has one. */
  mapPageHref?: string;
}

/** The body of an outlet page: where, when, what, and who says so. */
export function OutletDetails({ outlet, terminalName, sources, officialUrl, mapPageHref }: OutletDetailsProps) {
  const t = useT();
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
      <div className="flex min-w-0 flex-col gap-10">
        <section aria-labelledby="outlet-where-title">
          <h2 id="outlet-where-title" className="type-display-sm mb-5 text-ink">
            {t('commercePages.outlet.whereTitle')}
          </h2>
          <FactRows
            wide
            facts={[
              { label: t('commercePages.outlet.terminal'), value: terminalName },
              { label: t('commercePages.outlet.security'), value: outlet.zone !== 'unknown' ? t(`commercePages.card.zone.${outlet.zone}`) : undefined },
              { label: t('commercePages.outlet.level'), value: outlet.levelName },
              { label: t('commercePages.outlet.location'), value: outlet.locationNote },
            ]}
          />
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            {outlet.mapHref ? (
              <LocaleLink href={outlet.mapHref} className="link-action type-body-sm inline-flex items-center gap-1.5">
                <Icon name="map" size="sm" />
                {t('commercePages.outlet.showOnMap')}
              </LocaleLink>
            ) : (
              <p className="type-body-sm inline-flex items-center gap-1.5 text-ink-2">
                <Icon name="circle-dashed" size="sm" />
                {t('commercePages.outlet.notOnMap')}
              </p>
            )}
            {!outlet.mapHref && mapPageHref ? (
              <LocaleLink href={mapPageHref} className="link-action type-body-sm">
                {t('commercePages.outlet.openMap')}
              </LocaleLink>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="outlet-hours-title">
          <h2 id="outlet-hours-title" className="type-display-sm mb-5 text-ink">
            {t('commercePages.outlet.hours')}
          </h2>
          {outlet.hours ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-page-subtle px-5 py-4">
              <div className="type-body flex flex-wrap items-center gap-3 font-medium text-ink">
                <HoursText hours={outlet.hours} />
                <OpenStatus hours={outlet.hours} />
              </div>
              <p className="type-body-sm text-ink-2">{t('commercePages.outlet.checkOfficial')}</p>
            </div>
          ) : (
            <NotPublished variant="block" officialUrl={officialUrl} />
          )}
        </section>

        <section aria-labelledby="outlet-details-title">
          <h2 id="outlet-details-title" className="type-display-sm mb-5 text-ink">
            {t('commercePages.outlet.detailsTitle')}
          </h2>
          <FactRows
            wide
            facts={[
              { label: t('commercePages.outlet.type'), value: t(`commercePages.kindLabel.${outlet.kind}`) },
              { label: t('commercePages.outlet.category'), value: outlet.categoryLabel },
              ...(outlet.kind === 'dine' ? [{ label: t('commercePages.outlet.cuisine'), value: outlet.cuisine }] : []),
              {
                label: t('commercePages.outlet.halal'),
                value: outlet.halal ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name={outlet.halal === 'non-halal' ? 'info' : 'badge-check'} size="sm" />
                    {t(`commercePages.card.halal.${outlet.halal}`)}
                  </span>
                ) : undefined,
              },
              {
                label: t('commercePages.outlet.price'),
                value: outlet.priceBand ? t(`commercePages.filters.band${outlet.priceBand}`) : undefined,
              },
            ]}
          />
        </section>
      </div>

      <aside aria-labelledby="outlet-sources-title" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-sticky)+1rem)] lg:self-start">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-md sm:p-6">
          <h2 id="outlet-sources-title" className="type-title-md text-ink">
            {t('commercePages.outlet.sourcesTitle')}
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            <ProvenanceTag provenance={outlet.provenance} className="self-start" />
            <p className="type-body-sm text-ink-2">
              {outlet.provenance === 'official' ? t('commercePages.outlet.provenanceOfficial') : t('commercePages.outlet.provenanceEstimated')}
            </p>
          </div>
          <SourceNote sources={sources} defaultOpen className="mt-3" />
          {outlet.asOf ? <AsOfText value={outlet.asOf} /> : null}
        </div>
        <div className="rounded-2xl bg-page-subtle p-5">
          <p className="type-body-sm text-ink-2">{t('commercePages.outlet.checkOfficial')}</p>
          <ExternalLink href={officialUrl} variant="action" className="type-body-sm mt-2">
            {t('commercePages.partial.officialTitle')}
          </ExternalLink>
        </div>
      </aside>
    </div>
  );
}

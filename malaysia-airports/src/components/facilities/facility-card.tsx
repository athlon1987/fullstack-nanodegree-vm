'use client';

import type { Source } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { AccessibleValue, AreaValue, FactList, HoursValue, sourcesFor } from './facility-values';
import type { FacilityView } from './facility-view';

export interface FacilityCardProps {
  facility: FacilityView;
  sources: Readonly<Record<string, Source>>;
  showTerminal: boolean;
}

/** One facility: what it is, where, when, for whom, how sure we are and where that comes from. */
export function FacilityCard({ facility, sources, showTerminal }: FacilityCardProps) {
  const t = useT();
  return (
    <article
      id={facility.id}
      aria-labelledby={`${facility.id}-title`}
      className="flex min-w-0 scroll-mt-32 flex-col rounded-xl border border-line-strong bg-surface p-4 shadow-xs target:border-ink target:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-page-subtle text-ink">
          <Icon name={facility.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={`${facility.id}-title`} className="type-title-md text-ink">
            {facility.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ProvenanceTag provenance={facility.provenance} />
            {showTerminal ? <Badge size="sm">{facility.terminalLabel}</Badge> : null}
          </div>
        </div>
      </div>

      <p className="type-body mt-3 text-ink-2">{facility.description}</p>

      <FactList
        className="mt-4"
        facts={[
          { label: t('mapPages.details.location'), value: facility.locationNote },
          { label: t('mapPages.details.level'), value: facility.levelName },
          { label: t('mapPages.details.area'), value: facility.zone !== 'unknown' ? <AreaValue side={facility.zone} /> : undefined },
          { label: t('mapPages.details.hours'), value: facility.hours ? <HoursValue hours={facility.hours} /> : undefined },
          { label: t('mapPages.details.accessibility'), value: facility.accessible !== undefined ? <AccessibleValue accessible={facility.accessible} /> : undefined },
          ...(facility.access ? [{ label: t('mapPages.details.access'), value: facility.access }] : []),
          ...(facility.operator ? [{ label: t('mapPages.details.operator'), value: facility.operator }] : []),
        ]}
      />

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-4">
        {facility.mapHref ? (
          <LocaleLink href={facility.mapHref} className="link-action type-body-sm inline-flex items-center gap-1.5">
            <Icon name="map" size="sm" />
            {t('mapPages.facilities.showOnMap')}
            <span className="sr-only">: {facility.name}</span>
          </LocaleLink>
        ) : null}
        {facility.bookingUrl ? (
          <ExternalLink href={facility.bookingUrl} variant="action" className="type-body-sm">
            {t('common.actions.openOfficialSite')}
          </ExternalLink>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4">
        <SourceNote sources={sourcesFor(facility.sourceIds, sources)} />
        {facility.asOf ? <p className="type-caption py-2 text-ink-2">{t('freshness.asOf', { date: facility.asOf })}</p> : null}
      </div>
    </article>
  );
}

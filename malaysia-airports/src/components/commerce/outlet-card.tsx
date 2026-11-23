'use client';

import { CategoryArt, KIND_ICONS } from './category-art';
import type { Source } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { CardLink } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import type { OutletView, ProximityKind } from './commerce-view';
import { OpenStatus } from './open-status';

// The icons live in a server-safe module, so Server Components read the values (not a client reference).
export { KIND_ICONS };

export interface OutletCardProps {
  outlet: OutletView;
  sources: Readonly<Record<string, Source>>;
  showTerminal: boolean;
  /** Schematic proximity to the passenger's gate, when a gate is set and the list is not grouped by it. */
  proximity?: ProximityKind;
  headingLevel?: 2 | 3;
}

/**
 * One outlet in the directory: what and where, the facts that matter at a glance (side of
 * security, halal status, open now), how sure we are and who says so. The whole card links to
 * the outlet page.
 */
export function OutletCard({ outlet, sources, showTerminal, proximity, headingLevel = 3 }: OutletCardProps) {
  const t = useT();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const cited = outlet.sourceIds.map((id) => sources[id]).filter((source): source is Source => source !== undefined);
  const lead = cited.find((source) => source.kind === 'official' || source.kind === 'operator') ?? cited[0];
  const attribution = lead
    ? cited.length > 1
      ? t('commercePages.card.viaMore', { publisher: lead.publisher, count: cited.length - 1 })
      : t('commercePages.card.via', { publisher: lead.publisher })
    : undefined;

  return (
    <article
      id={outlet.id}
      aria-labelledby={`${outlet.id}-name`}
      className="group/card relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-[border-color,box-shadow,translate] duration-base hover:border-line-strong hover:shadow-lg motion-ok:hover:-translate-y-0.5 has-[[data-card-link]:focus-visible]:focus-ring"
    >
      {/* Redesign stage two: category art in the picture slot (no outlet has a licensed photograph). */}
      <CategoryArt name={outlet.name} tone={outlet.kind} icon={KIND_ICONS[outlet.kind]} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="min-w-0 flex-1">
            <p className="type-caption text-ink-2">
              {outlet.categoryLabel}
              {showTerminal ? <span className="text-ink-3"> · </span> : null}
              {showTerminal ? outlet.terminalLabel : null}
            </p>
            <Heading id={`${outlet.id}-name`} className="type-title-lg mt-0.5 text-ink">
              <CardLink href={outlet.href}>{outlet.name}</CardLink>
            </Heading>
          </div>
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors duration-fast group-hover/card:border-ink group-hover/card:text-ink"
          >
            <Icon name="arrow-right" size="sm" className="transition-transform duration-fast group-hover/card:translate-x-0.5" />
          </span>
        </div>

        {outlet.zone === 'airside' || outlet.zone === 'landside' || outlet.zone === 'both' || outlet.halal || outlet.hours ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {outlet.zone === 'airside' ? <Chip icon="scan-line">{t('commercePages.card.zone.airside')}</Chip> : null}
            {outlet.zone === 'landside' ? <Chip icon="door-open">{t('commercePages.card.zone.landside')}</Chip> : null}
            {outlet.zone === 'both' ? <Chip icon="arrow-left-right">{t('commercePages.card.zone.both')}</Chip> : null}
            {outlet.halal ? (
              <Chip tone={outlet.halal === 'non-halal' ? 'neutral' : 'positive'} icon={outlet.halal === 'non-halal' ? 'info' : 'badge-check'}>
                {t(`commercePages.card.halal.${outlet.halal}`)}
              </Chip>
            ) : null}
            <OpenStatus hours={outlet.hours} />
          </div>
        ) : null}

        <p className={cn('type-body-sm mt-3 flex gap-2', outlet.locationNote ? 'text-ink' : 'text-ink-2')}>
          <Icon name={outlet.locationNote ? 'map-pin' : 'circle-dashed'} size="sm" className="mt-0.5 shrink-0 text-ink-2" />
          <span className="min-w-0">
            {outlet.levelName ? <span className="font-medium">{outlet.levelName}. </span> : null}
            {outlet.locationNote ?? t('commercePages.card.locationNotPublished')}
          </span>
        </p>

        {proximity && proximity !== 'unknown' ? (
          <p className="type-body-sm mt-2 flex gap-2 text-ink">
            <Icon name="navigation" size="sm" className="mt-0.5 shrink-0 text-ink-2" />
            <span className="min-w-0">
              <span className="font-medium">{t(`commercePages.gate.proximity.${proximity}`)}</span>
              <span className="text-ink-2"> · {t('provenance.estimated.short')}</span>
            </span>
          </p>
        ) : null}

        <div aria-hidden="true" className="min-h-4 flex-1" />
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-line pt-3.5">
          <ProvenanceTag provenance={outlet.provenance} length="short" />
          {attribution ? <span className="type-caption min-w-0 text-ink-2">{attribution}</span> : null}
        </div>
      </div>
    </article>
  );
}

'use client';

import { useState } from 'react';
import type { Source } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { AccessibleValue, AreaValue, FactList, HoursValue, sourcesFor } from '@/components/facilities/facility-values';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { placePosition, type LevelView, type PoiView } from './map-logic';

export interface PlaceDetailsProps {
  poi: PoiView;
  level: LevelView | undefined;
  sources: Readonly<Record<string, Source>>;
  /** Locale-free path of the facilities directory, when the airport has one. */
  facilitiesHref?: string;
  isDestination: boolean;
  isStart: boolean;
  onClose: () => void;
  onRouteHere: () => void;
  onRouteFrom: () => void;
}

export const DETAILS_HEADING_ID = 'map-place-title';

/**
 * The selected place: what it is, where it is, hours and accessibility when a source publishes
 * them, how sure we are of its position, and the way there.
 */
export function PlaceDetails({ poi, level, sources, facilitiesHref, isDestination, isStart, onClose, onRouteHere, onRouteFrom }: PlaceDetailsProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const facility = poi.facility;
  const placeSources = sourcesFor(poi.sourceIds, sources);
  const facilitySources = facility ? sourcesFor(facility.sourceIds, sources) : [];
  // An illustrative pin may not claim a level or area its facility does not publish (C-04).
  const position = placePosition(poi);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby={DETAILS_HEADING_ID} className="animate-rise-in rounded-xl border border-line-strong bg-surface shadow-sm">
      <div className="flex items-start gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ink text-page">
          <Icon name={poi.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-eyebrow text-gold-ink">
            {poi.kindLabel}
            {level && position.level ? <span className="text-ink-3"> · {level.label}</span> : null}
          </p>
          <h2 id={DETAILS_HEADING_ID} tabIndex={-1} className="type-title-lg mt-1 text-ink outline-none">
            {poi.name}
          </h2>
        </div>
        <IconButton icon="x" size="sm" label={t('mapPages.details.close')} onClick={onClose} className="-mt-1 -mr-1" />
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
        <FactList
          facts={[
            { label: t('mapPages.details.level'), value: position.level ? (level?.name ?? poi.level) : undefined },
            { label: t('mapPages.details.area'), value: position.area && poi.side !== 'unknown' ? <AreaValue side={poi.side} /> : undefined },
            ...(facility?.locationNote ? [{ label: t('mapPages.details.location'), value: facility.locationNote }] : []),
            { label: t('mapPages.details.hours'), value: facility?.hours ? <HoursValue hours={facility.hours} /> : undefined },
            { label: t('mapPages.details.accessibility'), value: facility?.accessible !== undefined ? <AccessibleValue accessible={facility.accessible} /> : undefined },
            ...(facility?.access ? [{ label: t('mapPages.details.access'), value: facility.access }] : []),
            ...(facility?.operator ? [{ label: t('mapPages.details.operator'), value: facility.operator }] : []),
          ]}
        />

        <div className="flex flex-wrap gap-2">
          {!isDestination ? (
            <Button iconStart="navigation" onClick={onRouteHere}>
              {t('mapPages.details.routeHere')}
            </Button>
          ) : null}
          {!isStart ? (
            <Button variant="secondary" iconStart="footprints" onClick={onRouteFrom}>
              {t('mapPages.details.routeFromHere')}
            </Button>
          ) : null}
        </div>

        {facility ? (
          <div className="border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="type-title-sm text-ink">{t('mapPages.details.aboutTitle')}</h3>
              <ProvenanceTag provenance={facility.provenance} />
            </div>
            <p className="type-body-sm mt-2 text-ink-2">{facility.description}</p>
            <SourceNote sources={facilitySources} className="mt-1" />
          </div>
        ) : null}

        <div className="border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="type-title-sm text-ink">{t('mapPages.details.positionTitle')}</h3>
            <ProvenanceTag provenance={poi.provenance} />
          </div>
          <p className="type-body-sm mt-2 text-ink-2" data-position={position.unpublished ? 'unpublished' : poi.provenance === 'demo' ? 'illustrative' : 'sourced'}>
            {position.unpublished
              ? t('mapPages.details.positionUnpublished')
              : poi.provenance === 'demo'
                ? t('mapPages.details.positionIllustrative')
                : t('mapPages.details.positionSourced')}
          </p>
          <SourceNote sources={placeSources} className="mt-1" />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3">
          {facility && facilitiesHref ? (
            <LocaleLink href={`${facilitiesHref}#${facility.id}`} className="link-action type-body-sm">
              {t('mapPages.details.inDirectory')}
            </LocaleLink>
          ) : null}
          <button type="button" onClick={copyLink} className="link-action type-body-sm inline-flex items-center gap-1.5" aria-live="polite">
            <Icon name={copied ? 'check' : 'copy'} size="sm" />
            {copied ? t('common.actions.copied') : t('common.actions.copyLink')}
          </button>
        </div>
      </div>
    </section>
  );
}

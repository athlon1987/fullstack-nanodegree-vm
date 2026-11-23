'use client';

import type { Source } from '@/content/types';
import { useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { MoreOnPhones } from '@/components/common/more-on-phones';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { AccessibleValue, AreaValue, AsOf, FactList, HoursValue, sourcesFor } from './facility-values';
import type { FacilityView } from './facility-view';

export interface FacilityCardProps {
  facility: FacilityView;
  sources: Readonly<Record<string, Source>>;
  showTerminal: boolean;
  /** Airport slug: shows a toggle that saves the facility to My journey's saved places. */
  airport?: string;
  /** The list states this provenance once (`ProvenanceDefault`): no tag of its own when it matches (A-14). */
  defaultProvenance?: FacilityView['provenance'];
  /** The section shows the sources once (round 4: always, with what each supports): none on the card (A-14). */
  groupedSources?: boolean;
  /** With `groupedSources`: keep the card's own "As of" date (the section's cards differ). */
  showAsOf?: boolean;
}

/** One facility: what it is, where, when, for whom, how sure we are and where that comes from. */
export function FacilityCard({ facility, sources, showTerminal, airport, defaultProvenance, groupedSources = false, showAsOf = false }: FacilityCardProps) {
  const t = useT();
  const secondary = [
    ...(facility.access ? [{ label: t('mapPages.details.access'), value: facility.access }] : []),
    ...(facility.zone !== 'unknown' ? [{ label: t('mapPages.details.area'), value: <AreaValue side={facility.zone} /> }] : []),
    ...(facility.operator ? [{ label: t('mapPages.details.operator'), value: facility.operator }] : []),
  ];
  const collapse = secondary.length >= 2 || (facility.access?.length ?? 0) > 90;
  return (
    <article
      id={facility.id}
      aria-labelledby={`${facility.id}-title`}
      className="flex min-w-0 scroll-mt-32 flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm target:border-ink target:shadow-lg sm:p-6"
    >
      {/* Round 6 (review-3 9.1 item 8): the title is never narrower than its longest word
          ("ketidakupayaan" broke at 360 px and 125% text); the save button moves under it instead. */}
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink sm:size-12 sm:rounded-2xl">
          <Icon name={facility.icon} />
        </span>
        <h3 id={`${facility.id}-title`} className="type-title-lg flex-1 basis-0 self-center [overflow-wrap:normal] text-ink">
          {facility.name}
        </h3>
        {airport ? <SaveFacility airport={airport} facility={facility} /> : null}
      </div>
      {/* Round 4 (A-16): the tags get the card's full width. Between the icon and the save button
          they had 98 px at 320 px and 125% text, and "Estimated" was clipped to "Estimatec". */}
      {facility.provenance !== defaultProvenance || showTerminal ? (
        <div data-facility-tags="" className="mt-2 flex flex-wrap items-center gap-2">
          {facility.provenance !== defaultProvenance ? <ProvenanceTag provenance={facility.provenance} /> : null}
          {showTerminal ? <Badge size="sm" variant="label">{facility.terminalLabel}</Badge> : null}
        </div>
      ) : null}

      {/* Redesign three: tighter on phones (facilities was 14,483 px at 390 px); the same content. */}
      <p className="type-body mt-3 text-ink-2 sm:mt-4">{facility.description}</p>

      {/* Round 6 (review-3 9.1 item 7): where and when stay on the card; who may use it, the area
          and the operator go behind a disclosure on phones when there are two or more of them or
          the access rules are long (facilities was 15,451 px at 390 px). Accessibility stays out. */}
      <FactList
        className="mt-3 sm:mt-4"
        facts={[
          { label: t('mapPages.details.location'), value: facility.locationNote },
          { label: t('mapPages.details.level'), value: facility.levelName },
          { label: t('mapPages.details.hours'), value: facility.hours ? <HoursValue hours={facility.hours} /> : undefined },
          { label: t('mapPages.details.accessibility'), value: facility.accessible !== undefined ? <AccessibleValue accessible={facility.accessible} /> : undefined },
          ...(collapse ? [] : secondary),
        ]}
      />
      {collapse ? (
        <MoreOnPhones className="mt-3" summary={<>{t('mapPages.details.more')}<span className="sr-only">: {facility.name}</span></>}>
          <FactList facts={secondary} />
        </MoreOnPhones>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-3 sm:pt-4">
        {facility.mapHref ? (
          <LocaleLink
            href={facility.mapHref}
            aria-label={`${t('mapPages.facilities.showOnMap')}: ${facility.name}`}
            className="link-action type-body-sm inline-flex items-center gap-1.5"
          >
            <Icon name="map" size="sm" />
            {t('mapPages.facilities.showOnMap')}
          </LocaleLink>
        ) : null}
        {facility.bookingUrl ? (
          // E-17 (round 4): commercial sites are measured hand-offs with campaign parameters (named like the
          // overview's Fast Track link); official airport pages such as Lost & Found are not.
          <ExternalLink
            href={facility.bookingUrl}
            variant="action"
            className="type-body-sm"
            data-handoff={handoffName(facility)}
          >
            {t('common.actions.openOfficialSite')}
          </ExternalLink>
        ) : null}
      </div>
      {groupedSources ? (
        showAsOf && facility.asOf ? <AsOf value={facility.asOf} className="mt-2" /> : null
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-x-4">
          <SourceNote sources={sourcesFor(facility.sourceIds, sources)} />
          {facility.asOf ? <AsOf value={facility.asOf} /> : null}
        </div>
      )}
    </article>
  );
}

/** Save the facility to "Saved places" on My journey (this device only), or remove it. */
function SaveFacility({ airport, facility }: { airport: string; facility: FacilityView }) {
  const t = useT();
  const { isPlaceSaved, savePlace, removePlace, hydrated } = useSavedJourney();
  const saved = hydrated && isPlaceSaved('facility', facility.id);
  return (
    <IconButton
      icon={saved ? 'bookmark-check' : 'bookmark'}
      label={`${t('common.actions.save')}: ${facility.name}`}
      pressed={saved}
      disabled={!hydrated}
      className="shrink-0"
      onClick={() =>
        saved
          ? removePlace('facility', facility.id)
          : savePlace({ id: facility.id, type: 'facility', airport, title: facility.name, href: `/${airport}/facilities#${facility.id}` })
      }
    />
  );
}

/** Facilities whose booking link sells something: a measured hand-off (E-17). */
const COMMERCIAL: ReadonlySet<FacilityView['category']> = new Set<FacilityView['category']>(['lounge', 'hotel', 'rest', 'shower']);

function handoffName(facility: FacilityView): string | undefined {
  if (facility.id.endsWith('-fast-track')) return 'fast-track-booking';
  return COMMERCIAL.has(facility.category) ? `${facility.category}-booking` : undefined;
}

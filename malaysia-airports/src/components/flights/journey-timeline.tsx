'use client';

import { useMemo, useState } from 'react';
import { hasTranslation, pick, type Source } from '@/content/types';
import type { Flight } from '@/lib/flights';
import { useJourneyMode } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { buildJourney, type JourneyAirportContent, type JourneyMode } from '@/lib/journey';
import { formatTime, type Instant } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { AIRPORT_SECTIONS, hasSection } from '@/components/shell/sections';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Timeline, TimelineItem } from '@/components/ui/timeline';

/** The journey modes that make sense for a flight: a departure is a departure; an arrival can be met or connected from. */
export function modesForFlight(flight: Pick<Flight, 'direction'>): JourneyMode[] {
  return flight.direction === 'd' ? ['departing'] : ['arriving', 'meeting', 'transiting'];
}

export interface JourneyTimelineProps {
  flight: Flight;
  /** `{ airport, guidesNotes }` of the flight's airport, passed from the server. */
  content: JourneyAirportContent;
  /** Sources cited by the airport's notes, by id. */
  sources: Readonly<Record<string, Source>>;
  now: Instant;
  /** Heading of the section (an `h2`); steps are `h3`. */
  title: string;
  headingId: string;
  /** The mode to start in when the visitor's journey mode does not fit this flight (a saved flight's own mode). */
  preferredMode?: JourneyMode;
  intro?: boolean;
  className?: string;
}

/**
 * The personal journey for a flight, from `buildJourney`: each step with its time or moment,
 * a provenance tag, the airport's sourced notes, and links onward. Links to sections an airport
 * does not have are left out.
 */
export function JourneyTimeline({ flight, content, sources, now, title, headingId, preferredMode, intro = true, className }: JourneyTimelineProps) {
  const t = useT();
  const lang = useLang();
  const availability = useSectionAvailability();
  const { effectiveMode } = useJourneyMode();
  const modes = modesForFlight(flight);
  const [chosen, setChosen] = useState<JourneyMode | null>(null);
  const mode =
    chosen && modes.includes(chosen)
      ? chosen
      : preferredMode && modes.includes(preferredMode)
        ? preferredMode
        : modes.includes(effectiveMode)
          ? effectiveMode
          : modes[0];
  const zone = content.airport.timezone;

  const steps = useMemo(() => buildJourney({ flight, mode, airportContent: content, now }), [flight, mode, content, now]);
  const untranslated = lang !== 'en' && steps.some((step) => step.notes.some((note) => !hasTranslation(note.body, lang) || !hasTranslation(note.title, lang)));

  const resolve = (ids: readonly string[] | undefined): Source[] => (ids ?? []).map((id) => sources[id]).filter((source): source is Source => Boolean(source));
  const allowed = (href: string): boolean => {
    const match = /^\/([a-z]{3})\/([a-z-]+)/.exec(href);
    if (!match) return true;
    const section = AIRPORT_SECTIONS.find((item) => item.segment === match[2]);
    return section ? hasSection(availability, match[1], section.id) : true;
  };
  const stateLabel = { done: t('journey.timeline.done'), current: t('journey.timeline.current'), upcoming: t('journey.timeline.upcoming') };

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="type-title-lg text-ink">
        {title}
      </h2>
      {intro ? <p className="type-body-sm mt-1.5 max-w-reading text-ink-2">{t('journey.timeline.intro')}</p> : null}
      {modes.length > 1 ? (
        <SegmentedControl<JourneyMode>
          label={t('flightPages.detail.timelineMode')}
          showLabel
          value={mode}
          onValueChange={setChosen}
          className="mt-4"
          stackOnPhone
          options={modes.map((value) => ({ value, label: t(`journey.modes.${value}.label`), icon: value }))}
        />
      ) : null}
      {untranslated ? <TranslationNotice className="mt-4" /> : null}

      <Timeline className="mt-6">
        {steps.map((step) => {
          const actions = step.actions.filter((action) => allowed(action.href));
          const stepSources = resolve(step.sources);
          return (
            <TimelineItem
              key={step.id}
              state={step.state}
              stateLabel={stateLabel[step.state]}
              time={step.time ? <time dateTime={step.time}>{formatTime(step.time, zone)}</time> : undefined}
              eyebrow={step.relative ? t(step.relative) : undefined}
              title={pick(step.title, lang)}
              meta={<ProvenanceTag provenance={step.provenance} length="short" />}
              actions={
                actions.length > 0
                  ? actions.map((action) => (
                      <LocaleLink key={`${action.labelKey}-${action.href}`} href={action.href} className="link-action type-body-sm text-ink">
                        {t(action.labelKey)}
                        <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                      </LocaleLink>
                    ))
                  : undefined
              }
            >
              <p>{pick(step.body, lang)}</p>
              {stepSources.length > 0 ? <SourceNote sources={stepSources} className="mt-1" /> : null}
              {step.notes.length > 0 ? (
                <ul aria-label={t('flightPages.timeline.notesLabel')} className="mt-3 flex flex-col gap-2">
                  {step.notes.map((note) => (
                    <li key={note.id} className="rounded-md border border-line bg-page-subtle px-3.5 py-3">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <p className="type-body-sm font-semibold text-ink" lang={hasTranslation(note.title, lang) ? undefined : 'en'}>
                          {pick(note.title, lang)}
                        </p>
                        <ProvenanceTag provenance={note.provenance} length="short" />
                      </div>
                      <p className="type-body-sm mt-1 text-ink-2" lang={hasTranslation(note.body, lang) ? undefined : 'en'}>
                        {pick(note.body, lang)}
                      </p>
                      <SourceNote sources={resolve(note.sources)} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </TimelineItem>
          );
        })}
      </Timeline>
    </section>
  );
}

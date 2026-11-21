'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { hasTranslation, pick } from '@/content/values';
import type { Notice, Source } from '@/content/types';
import type { Flight } from '@/lib/flights';
import { useJourneyMode } from '@/lib/hooks/use-journey-mode';
import { useLang, useT } from '@/lib/i18n/client';
import { buildJourney, type JourneyAirportContent, type JourneyMode } from '@/lib/journey';
import { formatTime, type Instant } from '@/lib/time';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionSourceList } from '@/components/common/section-source-list';
import { TranslationNotice } from '@/components/common/translation-notice';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { AIRPORT_SECTIONS, hasSection } from '@/components/shell/sections';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { stepAnchor } from './flight-summary';
import { OpsStatus } from './ops-status';

// Moved to `journey-preferences.ts` in round 5 (the flight page needs them before this module loads).
import { modesForFlight, useJourneyPreferences } from './journey-preferences';
export { modesForFlight, useJourneyPreferences };

export interface JourneyTimelineProps {
  flight: Flight;
  /** `{ airport, guidesNotes }` of the flight's airport, passed from the server. */
  content: JourneyAirportContent;
  /** Sources cited by the airport's notes, by id. */
  sources: Readonly<Record<string, Source>>;
  now: Instant;
  /** The airport's notices, for the status lines of the C-gate, immigration and transfer steps (B-01). */
  notices?: readonly Notice[];
  /** Heading of the section (an `h2`); steps are `h3`. */
  title: string;
  headingId: string;
  /** The mode to start in when the visitor's journey mode does not fit this flight (a saved flight's own mode). */
  preferredMode?: JourneyMode;
  intro?: boolean;
  /** `md` where the page's other section headings are `type-title-md` (the flight page, A-14 type sizes). */
  headingSize?: 'md' | 'lg';
  /**
   * Classes for the Demo tag of the simulated steps at the top of the timeline, for a page that
   * shows a demonstration banner directly above them at some widths (My journey: `lg:hidden`).
   */
  leadingDemoTagClassName?: string;
  className?: string;
}

/**
 * The personal journey for a flight, from `buildJourney`: each step with its time or moment,
 * a provenance tag, the airport's sourced notes, and links onward. Links to sections an airport
 * does not have are left out.
 */
export function JourneyTimeline({ flight, content, sources, now, notices, title, headingId, preferredMode, intro = true, headingSize = 'lg', leadingDemoTagClassName, className }: JourneyTimelineProps) {
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

  const preferences = useJourneyPreferences();
  const steps = buildJourney({ flight, mode, airportContent: content, now, preferences });
  const untranslated = lang !== 'en' && steps.some((step) => step.notes.some((note) => !hasTranslation(note.body, lang) || !hasTranslation(note.title, lang)));

  const resolve = (ids: readonly string[] | undefined): Source[] => (ids ?? []).map((id) => sources[id]).filter((source): source is Source => Boolean(source));
  const allowed = (href: string): boolean => {
    const match = /^\/([a-z]{3})\/([a-z-]+)/.exec(href);
    if (!match) return true;
    const section = AIRPORT_SECTIONS.find((item) => item.segment === match[2]);
    return section ? hasSection(availability, match[1], section.id) : true;
  };
  // Round 4 (6.1.2): a past step is "Past", not "Done" (only a landing the feed confirms is done),
  // and the delayed-flight step is the flight's status, not a step of the journey.
  const stateLabel = { done: t('journey.timeline.done'), past: t('flightPages.timeline.past'), current: t('journey.timeline.current'), upcoming: t('journey.timeline.upcoming') };

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className={cn(headingSize === 'md' ? 'type-title-md' : 'type-title-lg', 'text-ink')}>
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
          options={modes.map((value) => ({ value, label: t(`journey.modes.${value}.label`), icon: value }))}
        />
      ) : null}
      {untranslated ? <TranslationNotice className="mt-4" /> : null}

      <Timeline className="mt-6">
        {steps.map((step, index) => {
          const actions = step.actions.filter((action) => allowed(action.href));
          // Round 5 (A-14, one Demo label per view): a run of simulated steps (boarding, then
          // departure) shares the label of its first step, a few lines above in the same view.
          const demoAbove = step.provenance === 'demo' && index > 0 && steps[index - 1].provenance === 'demo';
          const leading = steps.slice(0, index + 1).every((item) => item.provenance === 'demo');
          return (
            <TimelineItem
              key={step.id}
              id={stepAnchor(step.id)}
              tabIndex={-1}
              data-step={step.id}
              className="scroll-mt-28 focus-visible:focus-ring"
              state={step.state}
              stateLabel={step.flightStatus ? t('flightPages.timeline.flightStatus') : stateLabel[step.state]}
              time={step.time ? <time dateTime={step.time}>{formatTime(step.time, zone)}</time> : undefined}
              eyebrow={step.relative ? t(step.relative) : undefined}
              title={pick(step.title, lang)}
              meta={
                <>
                  {step.optional ? <span className="type-caption rounded-xs border border-dashed border-line-control px-1.5 py-0.5 font-semibold text-ink-2">{t('flightPages.timeline.optional')}</span> : null}
                  {demoAbove ? null : <ProvenanceTag provenance={step.provenance} length="short" className={leading ? leadingDemoTagClassName : undefined} />}
                </>
              }
              actions={
                actions.length > 0
                  ? actions.map((action) =>
                      action.handoff ? (
                        // A measured hand-off to another site (round 4, re-review 6.1.9).
                        <ExternalLink key={`${action.labelKey}-${action.href}`} href={action.href} variant="action" className="type-body-sm text-ink" data-handoff={action.handoff}>
                          {t(action.labelKey)}
                        </ExternalLink>
                      ) : (
                        <LocaleLink key={`${action.labelKey}-${action.href}`} href={action.href} className="link-action type-body-sm text-ink">
                          {t(action.labelKey)}
                          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                        </LocaleLink>
                      ),
                    )
                  : undefined
              }
            >
              <p>{pick(step.body, lang)}</p>
              {step.warning ? (
                <p data-step-warning="" className="type-body-sm mt-2 flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-warning-fg">
                  <Icon name="triangle-alert" size="sm" className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="font-semibold">{t('flightPages.timeline.warning')}:</strong> {pick(step.warning, lang)}
                  </span>
                </p>
              ) : null}
              {step.places && step.places.length > 0 ? (
                <ul aria-label={t('flightPages.timeline.placesLabel')} className="mt-3 flex flex-col gap-1.5">
                  {step.places.map((place) => (
                    <li key={place.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Icon name={place.kind === 'lounge' ? 'armchair' : 'utensils'} size="sm" className="text-ink-2" />
                      <LocaleLink href={place.href} className="link type-body-sm" lang={hasTranslation(place.name, lang) ? undefined : 'en'}>
                        {pick(place.name, lang)}
                      </LocaleLink>
                      {place.location ? <span className="type-caption text-ink-2">{pick(place.location, lang)}</span> : null}
                      <ProvenanceTag provenance={place.provenance} length="short" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.ops && notices ? (
                <OpsStatus
                  variant="inline"
                  airport={content.airport.slug}
                  notices={notices}
                  sources={sources}
                  services={step.ops}
                  terminal={flight.terminal}
                  checkpoints={flight.direction === 'd' ? ['security', 'immigration-departure'] : ['immigration-arrival']}
                />
              ) : null}
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
                    </li>
                  ))}
                </ul>
              ) : null}
            </TimelineItem>
          );
        })}
      </Timeline>
      {/* Round 5 (A-14): one source list for the timeline instead of a toggle on every step and
          note; each source names the steps and notes it supports. */}
      <SectionSourceList
        className="mt-6"
        items={steps.flatMap((step) => [
          { name: pick(step.title, lang), sources: resolve(step.sources) },
          ...step.notes.map((note) => ({ name: pick(note.title, lang), sources: resolve(note.sources) })),
        ])}
      />
    </section>
  );
}

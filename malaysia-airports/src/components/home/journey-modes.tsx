'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { useJourneyMode } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { JOURNEY_MODES, type JourneyMode } from '@/lib/journey/modes';
import { directionForMode, resetFlightDirection } from '@/components/flights/flight-direction';
import { Icon } from '@/components/ui/icon';
import { JOURNEY_ACTIONS, actionTitleKey } from './journey-actions';

/**
 * The four journey modes: departing, arriving, transiting, meeting someone. Choosing one sets
 * Departures or Arrivals, reorders and renames the quick actions, rewrites the guidance line,
 * and tells assistive technology what changed (politely, and only after a real choice).
 *
 * The same pattern as `SegmentedControl` (native radios, one tab stop, arrow keys), laid out
 * four-up on every screen: on phones the icon sits above the label and the sub-label is dropped.
 */
export function JourneyModes({ className }: { className?: string }) {
  const t = useT();
  const group = useId();
  const { effectiveMode, set } = useJourneyMode();
  const [announcement, setAnnouncement] = useState('');

  const choose = (mode: JourneyMode) => {
    set(mode);
    resetFlightDirection();
    setAnnouncement(
      t('home.modes.announce', {
        mode: t(`journey.modes.${mode}.label`),
        direction: directionForMode(mode) === 'd' ? t('common.labels.departures') : t('common.labels.arrivals'),
        first: t(actionTitleKey(JOURNEY_ACTIONS[mode][0].copy)),
      }),
    );
  };

  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="sr-only">{t('journey.modes.title')}</legend>
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-line-control bg-page-subtle p-1">
        {JOURNEY_MODES.map((mode) => (
          <label
            key={mode}
            className={cn(
              'relative flex min-h-12 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-center font-semibold text-ink-2 transition-colors duration-fast select-none',
              'sm:min-h-13 sm:flex-row sm:gap-2.5 sm:px-4 sm:py-1.5',
              'hover:text-ink has-[:checked]:bg-ink has-[:checked]:text-page has-[:checked]:shadow-xs has-[:focus-visible]:focus-ring',
              'forced-colors:has-[:checked]:forced-color-adjust-none forced-colors:has-[:checked]:bg-[Highlight] forced-colors:has-[:checked]:text-[HighlightText]',
            )}
          >
            <input type="radio" name={group} value={mode} checked={effectiveMode === mode} onChange={() => choose(mode)} className="sr-only" />
            <Icon name={mode} size="md" strokeWidth={1.75} className="sm:size-4" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[0.8125rem] sm:text-base">{t(`journey.modes.${mode}.label`)}</span>
              <span className="type-data-xs mt-0.5 font-medium opacity-80 max-sm:hidden">{t(`home.modes.sub.${mode}`)}</span>
            </span>
          </label>
        ))}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  );
}

/** The one-line guidance for the current mode: "Departing: check your flight first…". */
export function JourneyModeGuidance({ className }: { className?: string }) {
  const t = useT();
  const { effectiveMode } = useJourneyMode();
  return (
    <p className={cn('type-body-sm text-ink-2', className)}>
      <span className="type-eyebrow mr-2.5 text-gold-ink">{t(`journey.modes.${effectiveMode}.label`)}</span>
      {t(`home.modes.guidance.${effectiveMode}`)}
    </p>
  );
}

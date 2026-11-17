'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useJourneyMode } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { JOURNEY_MODES, type JourneyMode } from '@/lib/journey/modes';
import { directionForMode, resetFlightDirection } from '@/components/flights/flight-direction';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { JOURNEY_ACTIONS, actionTitleKey } from './journey-actions';

/**
 * The four journey modes: departing, arriving, transiting, meeting someone. Choosing one sets
 * Departures or Arrivals, reorders and renames the quick actions, rewrites the guidance line,
 * and tells assistive technology what changed (politely, and only after a real choice).
 */
export function JourneyModes({ className }: { className?: string }) {
  const t = useT();
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
    <div className={cn('min-w-0', className)}>
      <SegmentedControl<JourneyMode>
        label={t('journey.modes.title')}
        value={effectiveMode}
        onValueChange={choose}
        size="lg"
        block
        stackOnPhone
        options={JOURNEY_MODES.map((mode) => ({
          value: mode,
          label: t(`journey.modes.${mode}.label`),
          hint: t(`home.modes.sub.${mode}`),
          icon: mode,
        }))}
      />
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
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

'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { useTripOptions } from '@/lib/journey/trip-options';
import { TRAVELLER_NEEDS, useNeeds, type TravellerNeed } from '@/lib/needs';
import { FilterChip } from '@/components/ui/filter-chip';
import type { IconKey } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';

const NEED_KEYS: Record<TravellerNeed, 'wheelchair' | 'stepFree' | 'older' | 'companion'> = {
  wheelchair: 'wheelchair',
  'step-free': 'stepFree',
  older: 'older',
  companion: 'companion',
};

const NEED_ICONS: Record<TravellerNeed, IconKey> = {
  wheelchair: 'accessibility',
  'step-free': 'accessibility',
  older: 'hand-helping',
  companion: 'users',
};

export interface NeedsControlProps {
  /** Heading level of the control's title. */
  headingLevel?: 2 | 3;
  /** Also show the two trip options (hand luggage only, lounge access) under the needs. */
  tripOptions?: boolean;
  className?: string;
}

/**
 * "My needs" (BR-18, first-time-access-01): wheelchair, step-free routes, older traveller,
 * travelling with someone who needs help. Toggle chips saved on this device only; the journey
 * timeline adds the assistance step and step-free map links as soon as one is chosen. Optionally
 * also the remembered trip options (ux-frequent-13). Every change is announced politely.
 *
 * Package D can render it on /accessibility: `<NeedsControl headingLevel={2} />`.
 */
export function NeedsControl({ headingLevel = 3, tripOptions = false, className }: NeedsControlProps) {
  const t = useT();
  const { needs, setNeed } = useNeeds();
  const { options, setOption } = useTripOptions();
  const [message, setMessage] = useState('');
  const Heading = `h${headingLevel}` as 'h2' | 'h3';

  const toggle = (need: TravellerNeed, on: boolean) => {
    setNeed(need, on);
    const next = TRAVELLER_NEEDS.filter((item) => (item === need ? on : needs.includes(item)));
    setMessage(next.length > 0 ? t('flightPages.needs.updated', { needs: next.map((item) => t(`flightPages.needs.options.${NEED_KEYS[item]}`)).join(', ') }) : t('flightPages.needs.cleared'));
  };

  return (
    <section aria-labelledby="needs-control-title" className={cn('rounded-lg border border-line-strong bg-surface p-5', className)}>
      <Heading id="needs-control-title" className="type-title-md text-ink">
        {t('flightPages.needs.title')}
      </Heading>
      <p className="type-body-sm mt-1 text-ink-2">{t('flightPages.needs.lead')}</p>
      <div role="group" aria-labelledby="needs-control-title" className="mt-3 flex flex-wrap gap-2">
        {TRAVELLER_NEEDS.map((need) => (
          <FilterChip key={need} pressed={needs.includes(need)} onPressedChange={(on) => toggle(need, on)} icon={NEED_ICONS[need]}>
            {t(`flightPages.needs.options.${NEED_KEYS[need]}`)}
          </FilterChip>
        ))}
      </div>
      {tripOptions ? (
        <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
          <p className="type-eyebrow text-ink-2">{t('flightPages.tripOptions.title')}</p>
          <Switch
            label={t('flightPages.tripOptions.handLuggage')}
            hint={t('flightPages.tripOptions.handLuggageHint')}
            checked={options.handLuggageOnly}
            onCheckedChange={(on) => setOption('handLuggageOnly', on)}
          />
          <Switch label={t('flightPages.tripOptions.lounge')} hint={t('flightPages.tripOptions.loungeHint')} checked={options.loungeAccess} onCheckedChange={(on) => setOption('loungeAccess', on)} />
        </div>
      ) : null}
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  );
}

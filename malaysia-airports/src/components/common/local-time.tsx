'use client';

import { cn } from '@/lib/cn';
import { useNow } from '@/lib/hooks/use-now';
import { useT } from '@/lib/i18n/client';
import { DEFAULT_TIMEZONE, formatTime, timezoneDiffers, timezoneLabel, toIsoWithOffset } from '@/lib/time';

export interface LocalTimeProps {
  /** IANA timezone of the airport. Every Malaysia Airports airport is `Asia/Kuala_Lumpur`. */
  timeZone?: string;
  /** Prefix with "Airport time". */
  showLabel?: boolean;
  /** `auto` (default) shows "MYT (UTC+8)" only when the visitor's own timezone differs. */
  zone?: 'auto' | 'always' | 'never';
  className?: string;
}

/**
 * The airport's local clock, on a 24-hour clock. Shows a placeholder until hydration (the
 * server never reads the clock), then updates every 30 seconds.
 *
 * @example <LocalTime showLabel />
 */
export function LocalTime({ timeZone = DEFAULT_TIMEZONE, showLabel = false, zone = 'auto', className }: LocalTimeProps) {
  const t = useT();
  const now = useNow();
  const showZone =
    now !== null && (zone === 'always' || (zone === 'auto' && timezoneDiffers(now, Intl.DateTimeFormat().resolvedOptions().timeZone, timeZone)));
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 whitespace-nowrap', className)}>
      {showLabel ? <span className="type-caption text-ink-2">{t('common.labels.airportTime')}</span> : null}
      {now === null ? (
        <span className="type-data-md text-ink-3" aria-hidden="true">
          --:--
        </span>
      ) : (
        <time dateTime={toIsoWithOffset(now, timeZone)} className="type-data-md text-ink">
          {formatTime(now, timeZone)}
        </time>
      )}
      {showZone && now !== null ? <span className="type-data-xs text-ink-3">{timezoneLabel(now, timeZone)}</span> : null}
    </span>
  );
}

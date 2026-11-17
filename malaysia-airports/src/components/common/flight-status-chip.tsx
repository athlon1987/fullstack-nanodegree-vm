'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { flightStatusMeta, type FlightStatus, type StatusTone } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { Icon } from '@/components/ui/icon';

/**
 * Shape by tone, so the chip reads without colour:
 *   neutral  outlined            nothing to do yet
 *   positive filled, fine border moving as planned
 *   warning  filled, heavy border act soon, or something changed
 *   critical dashed border       will not operate as planned
 *   muted    flat fill, no border the flight is over
 */
const SHAPES: Record<StatusTone, string> = {
  neutral: 'border-neutral-border bg-transparent text-ink',
  positive: 'border-positive-border bg-positive-bg text-positive-fg',
  warning: 'border-2 border-warning-fg bg-warning-bg text-warning-fg',
  critical: 'border-dashed border-critical-fg bg-critical-bg text-critical-fg',
  muted: 'border-transparent bg-neutral-bg text-neutral-fg',
};

export interface FlightStatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  status: FlightStatus;
  /** sm 24px for dense rows, md 28px (default). */
  size?: 'sm' | 'md';
  /** Extra detail after the label, for example the new time of a delayed flight. */
  detail?: ReactNode;
}

/**
 * A flight status as icon, words and shape (never colour alone). Uses the status model in
 * `@/lib/flights`, so labels and tones stay in one place.
 *
 * @example <FlightStatusChip status={flight.status} detail={flight.status === 'delayed' ? formatTime(flight.estimated) : undefined} />
 */
export function FlightStatusChip({ status, size = 'md', detail, className, ...rest }: FlightStatusChipProps) {
  const t = useT();
  const meta = flightStatusMeta(status);
  return (
    <span
      data-status={status}
      data-tone={meta.tone}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-sm border font-semibold whitespace-nowrap',
        size === 'sm' ? 'type-caption h-6 px-1.5' : 'h-chip px-2 text-sm',
        SHAPES[meta.tone],
        className,
      )}
      {...rest}
    >
      <Icon name={meta.icon} size="xs" strokeWidth={2} />
      {t(meta.i18nKey)}
      {detail ? <span className="type-data-sm font-semibold">{detail}</span> : null}
    </span>
  );
}

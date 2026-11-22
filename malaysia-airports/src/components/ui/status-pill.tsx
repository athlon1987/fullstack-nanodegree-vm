import type { HTMLAttributes, ReactNode } from 'react';
import type { FlightStatus } from '@/lib/flights';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from './icon';

export type StatusPillTone = 'scheduled' | 'ontime' | 'boarding' | 'delayed' | 'cancelled' | 'landed' | 'departed';

const SOFT: Record<StatusPillTone, string> = {
  scheduled: 'bg-flight-scheduled-bg text-flight-scheduled-fg',
  ontime: 'bg-flight-ontime-bg text-flight-ontime-fg',
  boarding: 'bg-flight-boarding-bg text-flight-boarding-fg',
  delayed: 'bg-flight-delayed-bg text-flight-delayed-fg',
  cancelled: 'bg-flight-cancelled-bg text-flight-cancelled-fg',
  landed: 'bg-flight-landed-bg text-flight-landed-fg',
  departed: 'bg-flight-departed-bg text-flight-departed-fg',
};

const SOLID: Record<StatusPillTone, string> = {
  scheduled: 'bg-flight-scheduled-solid text-flight-scheduled-on',
  ontime: 'bg-flight-ontime-solid text-flight-ontime-on',
  boarding: 'bg-flight-boarding-solid text-flight-boarding-on',
  delayed: 'bg-flight-delayed-solid text-flight-delayed-on',
  cancelled: 'bg-flight-cancelled-solid text-flight-cancelled-on',
  landed: 'bg-flight-landed-solid text-flight-landed-on',
  departed: 'bg-flight-departed-solid text-flight-departed-on',
};

const SIZES = {
  sm: { box: 'type-caption h-6 gap-1.5 px-2.5', icon: 'xs' },
  md: { box: 'h-8 gap-2 px-3 text-sm', icon: 'sm' },
  lg: { box: 'h-10 gap-2 px-4 text-base', icon: 'sm' },
} as const;

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusPillTone;
  /** `soft` (default): tinted fill, coloured words. `solid`: strong fill for the one status that matters most on a view. */
  variant?: 'soft' | 'solid';
  /** sm 24px (dense rows), md 32px (default), lg 40px (a flight hero). */
  size?: keyof typeof SIZES;
  /** An icon before the words. Without one a small dot is shown; the words always carry the meaning. */
  icon?: IconKey;
  /** A breathing ring around the dot for a live, time-critical state (boarding now). Off with reduced motion. */
  live?: boolean;
  /** Extra detail after the words in tabular figures: the new time of a delayed flight, a gate. */
  detail?: ReactNode;
  /** The status in words. */
  children: ReactNode;
}

/**
 * A flight status as words, an icon or dot, and a colour tuned for flight status in both themes
 * and on the board. Colour is never the only signal. Prefer `flightStatusPill(status)` to choose
 * the tone and variant from the status model.
 *
 * @example
 * const pill = flightStatusPill(flight.status);
 * <StatusPill tone={pill.tone} variant={pill.variant} icon={flightStatusMeta(flight.status).icon}>{t(meta.i18nKey)}</StatusPill>
 */
export function StatusPill({ tone, variant = 'soft', size = 'md', icon, live = false, detail, className, children, ...rest }: StatusPillProps) {
  const s = SIZES[size];
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex shrink-0 items-center rounded-pill font-semibold whitespace-nowrap',
        'hc:border hc:border-current forced-colors:border forced-colors:border-[CanvasText]',
        s.box,
        variant === 'solid' ? SOLID[tone] : SOFT[tone],
        className,
      )}
      {...rest}
    >
      {icon ? (
        <Icon name={icon} size={s.icon} strokeWidth={2} />
      ) : (
        <span aria-hidden="true" className="relative inline-flex size-2 shrink-0">
          {live ? <span className="absolute inset-0 animate-pulse-ring rounded-full bg-current opacity-0" /> : null}
          <span className="relative size-2 rounded-full bg-current" />
        </span>
      )}
      <span>{children}</span>
      {detail ? <span className="type-data-sm font-semibold opacity-90">{detail}</span> : null}
    </span>
  );
}

/**
 * Tone and variant for each status of the flight model (`@/lib/flights`). Final call is the one
 * status shown solid by default: it is the most time-critical moment of a departure.
 */
export const FLIGHT_STATUS_PILL: Record<FlightStatus, { tone: StatusPillTone; variant: 'soft' | 'solid' }> = {
  scheduled: { tone: 'scheduled', variant: 'soft' },
  'check-in-open': { tone: 'ontime', variant: 'soft' },
  'check-in-closed': { tone: 'scheduled', variant: 'soft' },
  boarding: { tone: 'boarding', variant: 'soft' },
  'final-call': { tone: 'boarding', variant: 'solid' },
  'gate-closed': { tone: 'departed', variant: 'soft' },
  departed: { tone: 'departed', variant: 'soft' },
  delayed: { tone: 'delayed', variant: 'soft' },
  cancelled: { tone: 'cancelled', variant: 'soft' },
  'en-route': { tone: 'scheduled', variant: 'soft' },
  landed: { tone: 'landed', variant: 'soft' },
  'at-gate': { tone: 'landed', variant: 'soft' },
  baggage: { tone: 'landed', variant: 'soft' },
  completed: { tone: 'departed', variant: 'soft' },
};

export function flightStatusPill(status: FlightStatus): { tone: StatusPillTone; variant: 'soft' | 'solid' } {
  return FLIGHT_STATUS_PILL[status];
}

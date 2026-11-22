'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { flightStatusMeta, type FlightStatus } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { StatusPill, flightStatusPill } from '@/components/ui/status-pill';

export interface FlightStatusPillProps {
  status: FlightStatus;
  /** sm 24 px (dense rows), md 32 px, lg 40 px (the flight card). */
  size?: 'sm' | 'md' | 'lg';
  /** Override the soft or solid choice of `flightStatusPill` (final call is solid by default). */
  variant?: 'soft' | 'solid';
  detail?: ReactNode;
  className?: string;
}

/**
 * A flight's status as a v2 `StatusPill` (redesign round one): the status model's icon and words,
 * and the colour tuned for that status in both themes and on the board. Carries `data-status`,
 * as `FlightStatusChip` did, so pages and tests find statuses the same way.
 */
export function FlightStatusPill({ status, size = 'sm', variant, detail, className }: FlightStatusPillProps) {
  const t = useT();
  const meta = flightStatusMeta(status);
  const pill = flightStatusPill(status);
  return (
    <StatusPill data-status={status} tone={pill.tone} variant={variant ?? pill.variant} size={size} icon={meta.icon} detail={detail} className={className}>
      {t(meta.i18nKey)}
    </StatusPill>
  );
}

/** Three quiet tones, so neighbouring airlines are told apart at a glance (never a status colour). */
const BADGE_TONES = ['bg-primary-soft text-primary-ink', 'bg-gold-soft text-gold-ink', 'bg-fill text-ink'] as const;

/**
 * The airline's two-letter code as a small badge, standing in for a logo (we have no licensed
 * airline marks). Decorative: the airline's name is always in text beside it.
 */
export function AirlineBadge({ code, size = 'md', className }: { code: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  let hash = 0;
  for (const char of code) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-mono font-semibold tracking-tight uppercase',
        size === 'sm' ? 'size-6 rounded-md text-[0.8125rem]' : size === 'lg' ? 'size-12 rounded-xl text-sm' : 'size-8 rounded-lg text-[0.8125rem]',
        BADGE_TONES[hash % BADGE_TONES.length],
        className,
      )}
    >
      {code}
    </span>
  );
}

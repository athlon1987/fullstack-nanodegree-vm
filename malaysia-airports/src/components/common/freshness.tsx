'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { formatTime, toIsoWithOffset, type Instant } from '@/lib/time';
import { Icon } from '@/components/ui/icon';

export interface FreshnessProps {
  /** When the data was generated or last refreshed; `null` while it is not known yet (before hydration). */
  updatedAt: Instant | null;
  /** Adds "Refreshes every N seconds". */
  refreshSeconds?: number;
  /** Context shown before the time, for example the airport and day: "KUL · Tuesday, 17 November". */
  context?: ReactNode;
  /**
   * `polite` (default) announces the new time to screen readers when it changes (at most once a
   * minute). Use `off` when the view already announces its own update.
   */
  live?: 'polite' | 'off';
  className?: string;
}

/**
 * How fresh the data is: "Updated 14:05", in airport time. Use one per data view.
 *
 * @example <Freshness updatedAt={provider?.meta().generatedAt ?? null} refreshSeconds={30} />
 */
export function Freshness({ updatedAt, refreshSeconds, context, live = 'polite', className }: FreshnessProps) {
  const t = useT();
  return (
    <p className={cn('type-data-sm flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-ink-2', className)}>
      {context ? <span className="text-ink">{context}</span> : null}
      <span className="inline-flex items-center gap-1.5" role={live === 'polite' ? 'status' : undefined} aria-live={live} aria-atomic="true">
        <Icon name="refresh-cw" size="xs" strokeWidth={2} />
        {updatedAt === null ? (
          <span>{t('common.labels.loading')}</span>
        ) : (
          <time dateTime={toIsoWithOffset(updatedAt)} className="text-ink">
            {t('freshness.updated', { time: formatTime(updatedAt) })}
          </time>
        )}
      </span>
      {refreshSeconds ? <span>{t('freshness.refreshesEvery', { seconds: refreshSeconds })}</span> : null}
    </p>
  );
}

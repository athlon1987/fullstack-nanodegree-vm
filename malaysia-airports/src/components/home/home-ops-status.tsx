'use client';

import { useMemo, useState } from 'react';
import type { Notice, Source } from '@/content/types';
import { useNow } from '@/lib/hooks/use-now';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { opsServicesFor, opsStatus } from '@/lib/providers/demo-operations';
import { OpsStatus } from '@/components/flights/ops-status';
import { Icon } from '@/components/ui/icon';

export interface HomeOpsStatusProps {
  /** KLIA's notices and the sources they cite, prepared on the server. */
  notices: readonly Notice[];
  sources: Readonly<Record<string, Source>>;
}

/**
 * The KLIA status lines in the home notice strip (B-01 hand-off, round 2): Aerotrain, the train
 * and shuttle between terminals, and immigration with demo queue estimates. One row that says
 * how many services have a notice (or that the status is not available: there is no live feed),
 * opening to the lines themselves (package B's `OpsStatus`), so
 * the first screen grows by a single row. Always about KLIA, whatever airport is chosen, so the
 * row never appears or disappears after hydration.
 */
export function HomeOpsStatus({ notices, sources }: HomeOpsStatusProps) {
  const t = useT();
  const now = useNow(60_000);
  // The summary needs only the states; the lines (with demo queue estimates) render once opened,
  // so the closed row costs almost nothing at hydration (round 2, TBT).
  const lines = useMemo(() => (now === null ? null : opsStatus({ airport: 'kul', notices, now, waits: false })), [notices, now]);
  const [open, setOpen] = useState(false);
  const affected = lines?.filter((line) => line.state !== 'unknown').length ?? 0;
  // Round 4 (re-review 6.1.1): with no notice in effect the row says the status is not available
  // (there is no live feed), never "no disruption reported".
  const current = lines === null ? null : affected > 0 ? `affected-${affected}` : 'unknown';
  const summaries = [
    { key: 'unknown', text: t('flightPages.ops.homeUnknown') },
    ...opsServicesFor('kul').map((_, index) => ({ key: `affected-${index + 1}`, text: t.count('home.strip.opsAffected', index + 1) })),
  ];
  return (
    <details className="group border-t border-line lg:col-span-3" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-1.5 text-ink transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset sm:px-4 [&::-webkit-details-marker]:hidden">
        <Icon name="train-front" className="text-primary-ink max-xs:hidden" />
        <span className="type-body-sm flex min-w-0 flex-1 flex-wrap gap-x-1">
          <span className="font-semibold">{t('home.strip.opsTitle')}</span>
          {/* The summary needs the clock, so it arrives after hydration. Every summary it can show
              sits in the same grid cell and only the current one is visible, so the row is as tall
              as the longest one from the first paint and nothing moves when it arrives (round 3:
              Malay phones wrapped to a second line after hydration, CLS 0.029). */}
          <span className="grid text-ink-2">
            {summaries.map((summary) => (
              <span key={summary.key} className={cn('[grid-area:1/1]', summary.key !== current && 'invisible')}>
                {summary.text}
              </span>
            ))}
          </span>
        </span>
        <Icon name="chevron-down" size="sm" className="shrink-0 text-ink-3 transition-transform duration-base group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 sm:px-4">
        {open ? <OpsStatus airport="kul" notices={notices} sources={sources} variant="inline" className="mt-0" /> : null}
      </div>
    </details>
  );
}

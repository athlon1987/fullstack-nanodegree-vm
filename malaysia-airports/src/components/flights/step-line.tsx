'use client';

import { pick } from '@/content/values';
import { useLang, useT } from '@/lib/i18n/client';
import type { StepSummary, TravelDeadline } from '@/lib/journey';
import { formatTime } from '@/lib/time';
import { keepRanges } from '@/components/common/keep-ranges';

/** Dictionary keys of the deadline labels on the saved-flight cards (home and My journey; round 4, 6.1.2). */
export const DEADLINE_KEYS = {
  'arrive-by': 'flightPages.journey.deadline.arriveBy',
  'check-in-closes': 'flightPages.journey.deadline.checkInCloses',
  boarding: 'flightPages.journey.deadline.boarding',
  'gate-closes': 'flightPages.journey.deadline.gateCloses',
} as const satisfies Record<TravelDeadline['kind'], string>;

/**
 * A step named on a saved-flight card, with its time only when it is still ahead: a step to come
 * shows when it starts, a step under way when it ends ("until 19:00"). No second time when the
 * title already says it ("Board from 10:50", round 2).
 */
export function StepLine({ summary, hideTime = false }: { summary: StepSummary; hideTime?: boolean }) {
  const t = useT();
  const lang = useLang();
  const title = pick(summary.step.title, lang);
  const time = summary.time && !hideTime && !title.includes(formatTime(summary.time)) ? formatTime(summary.time) : null;
  return (
    <>
      <span className="font-semibold text-ink">{keepRanges(title)}</span>
      {time ? (
        <span className="type-data-md ml-1.5 font-normal text-ink-2">{summary.timeRole === 'ends' ? t('flightPages.journey.until', { time }) : time}</span>
      ) : null}
    </>
  );
}

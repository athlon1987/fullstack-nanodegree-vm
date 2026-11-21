/**
 * Network-wide notices and the pure helpers for deciding which notices to show.
 *
 * Airport-specific notices live in the airport's content file (`airports/<code>.ts`);
 * `getNotices()` in `@/content` merges both. Nothing here reads the clock: pass `now` in
 * (on the client, from `useNow()`).
 *
 * Content authors: add network-wide notices to `NETWORK_NOTICES`. A simulated notice must use
 * `provenance: 'demo'` so that the UI labels it as demonstration data.
 */
import { lt } from './values';
import type { Notice, NoticeSeverity } from './types';

/** Notices that apply to the whole network. */
export const NETWORK_NOTICES: Notice[] = [
  {
    id: 'prototype-demo-data',
    severity: 'info',
    title: lt('Flight information on this site is simulated', 'Maklumat penerbangan di laman ini adalah simulasi'),
    body: lt(
      'This is an independent concept prototype with no connection to airport systems. Flight times, gates, belts and wait times are demonstration data. For real flight status, check with your airline or the official Malaysia Airports website.',
      'Ini prototaip konsep bebas yang tidak berhubung dengan sistem lapangan terbang. Waktu penerbangan, pintu, karusel bagasi dan masa menunggu ialah data demonstrasi. Untuk status penerbangan sebenar, semak dengan syarikat penerbangan anda atau laman web rasmi Malaysia Airports.',
    ),
    provenance: 'demo',
    sources: ['prototype-method'],
  },
];

/** Where a notice stands relative to a moment in time. */
export type NoticeState = 'upcoming' | 'active' | 'expired';

/**
 * State of a notice at `now`: `upcoming` before `validFrom`, `expired` after `validTo`, otherwise
 * `active`. A notice with no dates is always active.
 */
export function noticeState(notice: Notice, now: Date): NoticeState {
  const time = now.getTime();
  if (notice.validFrom && time < Date.parse(notice.validFrom)) return 'upcoming';
  if (notice.validTo && time > Date.parse(notice.validTo)) return 'expired';
  return 'active';
}

const SEVERITY_RANK: Record<NoticeSeverity, number> = { critical: 0, warning: 1, advisory: 2, info: 3 };

/** Sort notices by severity (most serious first), then by start date (soonest first). */
export function sortNotices(notices: readonly Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const aStart = a.validFrom ? Date.parse(a.validFrom) : 0;
    const bStart = b.validFrom ? Date.parse(b.validFrom) : 0;
    return aStart - bStart || a.id.localeCompare(b.id);
  });
}

/** Options for `currentNotices`. */
export interface CurrentNoticeOptions {
  /** Also include notices that start within this many days. Default 14. */
  upcomingWithinDays?: number;
}

/**
 * Notices worth showing at `now`: active ones, plus upcoming ones that start soon. Expired
 * notices are dropped. Sorted with `sortNotices`.
 */
export function currentNotices(notices: readonly Notice[], now: Date, options: CurrentNoticeOptions = {}): Notice[] {
  const horizon = now.getTime() + (options.upcomingWithinDays ?? 14) * 24 * 60 * 60 * 1000;
  return sortNotices(
    notices.filter((notice) => {
      const state = noticeState(notice, now);
      if (state === 'active') return true;
      if (state === 'upcoming') return Date.parse(notice.validFrom as string) <= horizon;
      return false;
    }),
  );
}

/** Notices for one airport: its own plus the network-wide ones (which have no `airport`). */
export function filterNoticesForAirport(notices: readonly Notice[], airport: string | undefined): Notice[] {
  return notices.filter((notice) => !notice.airport || notice.airport === airport);
}

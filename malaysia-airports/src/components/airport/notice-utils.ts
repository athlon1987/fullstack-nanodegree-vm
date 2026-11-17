/**
 * Notices as the UI needs them: already in one language, with their sources resolved, small
 * enough to hand to Client Components. Build them on the server with `toNoticeViews` from
 * `notice-views.server.ts`; decide what is current on the client with a clock from `useNow()`.
 */
import type { NoticeSeverity, Provenance, Source, TerminalId } from '@/content/types';

/** One notice, localised. `body` and `sources` are left out of compact lists. */
export interface NoticeView {
  id: string;
  /** Airport slug; undefined for network-wide notices. */
  airport?: string;
  terminal?: TerminalId;
  /** Where it applies, for example "KLIA Terminal 1". Undefined for the whole network. */
  scope?: string;
  severity: NoticeSeverity;
  title: string;
  body?: string;
  provenance: Provenance;
  validFrom?: string;
  validTo?: string;
  sources?: Source[];
  /** False when the page language had to fall back to English for this notice. */
  translated: boolean;
}

/** Where a notice stands at a moment in time. */
export type NoticeViewState = 'upcoming' | 'active' | 'expired';

/** `upcoming` before `validFrom`, `expired` after `validTo`, otherwise `active`. Pure: pass the time in. */
export function noticeViewState(notice: Pick<NoticeView, 'validFrom' | 'validTo'>, now: number): NoticeViewState {
  if (notice.validFrom && now < Date.parse(notice.validFrom)) return 'upcoming';
  if (notice.validTo && now > Date.parse(notice.validTo)) return 'expired';
  return 'active';
}

const SEVERITY_RANK: Record<NoticeSeverity, number> = { critical: 0, warning: 1, advisory: 2, info: 3 };

/** Most serious first, then soonest start. */
export function sortNoticeViews<T extends Pick<NoticeView, 'severity' | 'validFrom' | 'id'>>(notices: readonly T[]): T[] {
  return [...notices].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return (a.validFrom ? Date.parse(a.validFrom) : 0) - (b.validFrom ? Date.parse(b.validFrom) : 0) || a.id.localeCompare(b.id);
  });
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Notices worth showing at `now`: active ones and ones that start within `upcomingWithinDays`
 * (default 14). With `now === null` (before hydration) nothing can be ruled out, so all are kept.
 */
export function currentNoticeViews<T extends Pick<NoticeView, 'severity' | 'validFrom' | 'validTo' | 'id'>>(
  notices: readonly T[],
  now: number | null,
  upcomingWithinDays = 14,
): T[] {
  if (now === null) return sortNoticeViews(notices);
  return sortNoticeViews(
    notices.filter((notice) => {
      const state = noticeViewState(notice, now);
      if (state === 'active') return true;
      return state === 'upcoming' && Date.parse(notice.validFrom as string) <= now + upcomingWithinDays * DAY;
    }),
  );
}

/**
 * The one notice for a first screen: the chosen airport's own notices first, then the network's,
 * most serious first. Simulated (`demo`) notices come last: the demonstration banner already says it.
 */
export function pickHeadlineNotice<T extends Pick<NoticeView, 'severity' | 'validFrom' | 'validTo' | 'id' | 'airport' | 'provenance'>>(
  notices: readonly T[],
  now: number | null,
  airport?: string,
): T | undefined {
  const relevant = currentNoticeViews(notices, now).filter((notice) => !airport || !notice.airport || notice.airport === airport);
  const rank = (notice: T): number => (notice.provenance === 'demo' ? 2 : airport && notice.airport === airport ? 0 : 1);
  return [...relevant].sort((a, b) => rank(a) - rank(b))[0];
}

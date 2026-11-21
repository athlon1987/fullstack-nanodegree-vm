'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import type { Flight } from '@/lib/flights';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useLang, useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FOLLOW_PANEL_ID, useIsFollowing } from './follow-state';
import { buildIcs, flightCalendarEvent, icsFileName } from './ics';
import { toSavedFlight } from './saved-flight';

export interface FlightActionsProps {
  flight: Flight;
  /** The page title, for the share sheet: "MH 2610 to London". */
  title: string;
}

// The follow panel is opened by few visitors: it loads when the page is idle, or when it is opened
// before that (round 2, E-03), instead of with the flight page.
const loadFollowPanel = () => import('./flight-alerts-panel');
const FollowPanel = lazy(() => loadFollowPanel().then((module) => ({ default: module.FollowPanel })));

/** The current page without its hash, for sharing and for the calendar entry. */
const pageUrl = (): string => window.location.href.split('#')[0];

/**
 * Save to My journey, Follow (opens the follow panel right here, ux-frequent-03), share (the
 * system share sheet where there is one, otherwise copy the link) and add to calendar (an .ics
 * file made in the browser and marked as demonstration data).
 */
export function FlightActions({ flight, title }: FlightActionsProps) {
  const t = useT();
  const lang = useLang();
  const { isFlightSaved, saveFlight, removeFlight } = useSavedJourney();
  const saved = isFlightSaved(flight.id);
  const following = useIsFollowing(flight.id);
  const [followOpen, setFollowOpen] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const idle = typeof window.requestIdleCallback === 'function';
    const handle = idle
      ? window.requestIdleCallback(() => void loadFollowPanel(), {
          timeout: 5000,
        })
      : window.setTimeout(() => void loadFollowPanel(), 3000);
    return () => (idle ? window.cancelIdleCallback(handle) : window.clearTimeout(handle));
  }, []);

  const share = async () => {
    const url = pageUrl();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: t('flightPages.detail.shareText', { title }),
          url,
        });
        setMessage('');
        return;
      } catch (error) {
        // The visitor closed the share sheet: nothing to report.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t('flightPages.detail.linkCopied'));
    } catch {
      setMessage(t('flightPages.detail.copyFailed'));
    }
  };

  const addToCalendar = () => {
    const ics = buildIcs(
      flightCalendarEvent(flight, {
        t,
        lang,
        url: pageUrl(),
        stamp: Date.now(),
      }),
    );
    const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = icsFileName(flight);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 2000);
    setMessage(t('flightPages.detail.calendarDone'));
  };

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={t('flightPages.detail.actionsLabel')} className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Button
          variant={saved ? 'secondary' : 'primary'}
          iconStart={saved ? 'bookmark-check' : 'bookmark'}
          aria-pressed={saved}
          className={saved ? 'border-ink bg-ink text-page hover:border-ink hover:bg-ink' : undefined}
          onClick={() => (saved ? removeFlight(flight.id) : saveFlight(toSavedFlight(flight, t)))}
        >
          {t('flightPages.detail.save')}
        </Button>
        <Button
          variant="secondary"
          iconStart={following ? 'bell-ring' : 'bell'}
          aria-expanded={followOpen}
          aria-controls={FOLLOW_PANEL_ID}
          onClick={() => setFollowOpen((value) => !value)}
        >
          {following ? t('flightPages.follow.following') : t('flightPages.follow.button')}
        </Button>
        <Button variant="secondary" iconStart="share-2" onClick={share}>
          {t('flightPages.detail.share')}
        </Button>
        <Button variant="secondary" iconStart="calendar-days" onClick={addToCalendar}>
          {t('flightPages.detail.calendar')}
        </Button>
      </div>
      <p role="status" className="type-body-sm flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
        {saved ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Icon name="bookmark-check" size="sm" />
              {t('flightPages.detail.savedNote')}
            </span>
            <LocaleLink href="/journey" className="link">
              {t('flightPages.board.openJourney')}
            </LocaleLink>
          </>
        ) : null}
        {message ? <span>{message}</span> : null}
      </p>
      {followOpen ? (
        <Suspense fallback={null}>
          <FollowPanel flight={flight} />
        </Suspense>
      ) : null}
    </div>
  );
}

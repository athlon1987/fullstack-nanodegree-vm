'use client';

import { formatDuration } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import type { FlightFeedState } from '@/lib/providers/use-flight-feed';
import { formatTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';

export interface FeedNoticeProps {
  feed: Pick<FlightFeedState, 'status' | 'updatedAt' | 'ageSeconds' | 'retry'>;
  timeZone?: string;
  className?: string;
}

/**
 * What a page says when the flight feed is not live (BR-05): last-known data with its time and
 * age, or nothing loaded, each with a retry. Renders nothing while the feed is live or loading.
 * The container is a polite status region, so the change is announced once.
 */
export function FeedNotice({ feed, timeZone, className }: FeedNoticeProps) {
  const t = useT();
  const lang = useLang();
  const retry = (
    <Button size="sm" variant="secondary" iconStart="refresh-cw" onClick={feed.retry}>
      {t('flightPages.feed.retry')}
    </Button>
  );
  return (
    <div role="status" className={className}>
      {feed.status === 'stale' && feed.updatedAt ? (
        <Callout role="none" tone="warning" icon="clock-alert" actions={retry} data-feed-state="stale">
          {t('flightPages.feed.stale', {
            time: formatTime(feed.updatedAt, timeZone),
            age: formatDuration(Math.max(1, Math.round((feed.ageSeconds ?? 0) / 60)), lang),
          })}
        </Callout>
      ) : feed.status === 'error' ? (
        <Callout role="none" tone="critical" title={t('flightPages.feed.error')} actions={retry} data-feed-state="error">
          {t('flightPages.feed.errorHint')}
        </Callout>
      ) : null}
    </div>
  );
}

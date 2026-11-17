'use client';

import { useEffect, useRef } from 'react';
import type { Flight } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import { collectChanges, describeFlightChanges, snapshotOf, type FlightSnapshot } from './flight-changes';
import { showDemoNotification } from './flight-alerts';

export interface FlightWatcherProps {
  /**
   * The flights to watch: pass ONLY the visitor's saved flights (or the one flight they asked
   * alerts for), so that announcements stay rare. `null` while loading.
   */
  flights: readonly Flight[] | null;
  /** Announce changes in a polite live region. Default true. */
  announce?: boolean;
  /** Flights that also get a demo browser notification when they change. */
  alertIds?: ReadonlySet<string>;
  timeZone?: string;
}

/**
 * Watches flights across refreshes and reports what changed (status, time, gate, belt): once,
 * politely, in a visually hidden live region, and as a labelled demo notification for flights
 * with alerts on. The first snapshot is never announced.
 */
export function FlightWatcher({ flights, announce = true, alertIds, timeZone }: FlightWatcherProps) {
  const t = useT();
  const lang = useLang();
  const region = useRef<HTMLDivElement>(null);
  const previous = useRef<Map<string, FlightSnapshot> | null>(null);

  useEffect(() => {
    if (!flights) return;
    const before = previous.current;
    previous.current = new Map(flights.map((flight) => [flight.id, snapshotOf(flight)]));
    if (!before) return;
    const changed = collectChanges(before, flights);
    if (changed.length === 0) return;
    const sentences = changed.map(({ flight, changes }) => ({ flight, text: describeFlightChanges(flight, changes, t, lang, timeZone) }));
    if (announce && region.current) region.current.textContent = sentences.map((item) => item.text).join(' ');
    for (const { flight, text } of sentences) {
      if (alertIds?.has(flight.id)) {
        showDemoNotification(t('flightPages.alerts.notificationTitle', { summary: text }), t('flightPages.alerts.notificationBody'), `flight-${flight.id}`);
      }
    }
  }, [flights, announce, alertIds, t, lang, timeZone]);

  return <div ref={region} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />;
}

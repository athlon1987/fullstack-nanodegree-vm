'use client';

import { useSyncExternalStore } from 'react';
import { emailFollowStore } from '@/lib/providers/follow';
import { useAlertPermission, useFlightAlerts } from './flight-alerts';

/**
 * What the Follow button needs before its panel is opened (round 2, E-03): the panel itself
 * (`flight-alerts-panel.tsx`) is loaded only when the page is idle or the panel is opened.
 */
export const FOLLOW_PANEL_ID = 'follow-panel';

/** True when the flight is followed on any channel on this device. */
export function useIsFollowing(flightId: string): boolean {
  const permission = useAlertPermission();
  const { ids } = useFlightAlerts();
  const emails = useSyncExternalStore(emailFollowStore.subscribe, emailFollowStore.getSnapshot, emailFollowStore.getServerSnapshot);
  return (permission === 'granted' && ids.has(flightId)) || Boolean(emails[flightId]);
}

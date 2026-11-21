'use client';

import { Activity, lazy } from 'react';

const Runtime = lazy(() => import('./platform-runtime').then((module) => ({ default: module.PlatformRuntime })));

/**
 * `PlatformRuntime` as its own script (round 5, E-03): the service-worker client, the install
 * prompt and the aggregate measurement are not in any page's first-load JavaScript. The server
 * HTML still has the runtime's (empty) live region; in the browser the script loads during
 * hydration and the runtime hydrates in its own pass when it arrives (an Activity boundary: written
 * in place, never revealed late like a Suspense boundary). It shows nothing until
 * the connection or an update changes, and registers the worker after the network is idle anyway.
 */
export function PlatformRuntimeLazy() {
  return (
    <Activity mode="visible">
      <Runtime />
    </Activity>
  );
}

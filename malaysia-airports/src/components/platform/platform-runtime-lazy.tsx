'use client';

import { Activity, Component, lazy, type ReactNode } from 'react';
import { retryingImport } from '@/lib/retrying-import';
import { ConnectionNotice } from './connection-notice';

/*
 * Verification, round 5: when this script could not be fetched (the connection dropped while the
 * page was starting), the rejected import reached the root error boundary and replaced every page,
 * the offline page included, with "This page couldn't load". It is now fetched again when the
 * connection returns (`retryingImport`); until then the runtime's region stays as the server sent it.
 */
const Runtime = lazy(() => retryingImport(() => import('./platform-runtime')).then((module) => ({ default: module.PlatformRuntime })));

/** Whatever happens inside the runtime, it must not take the page down: it is an optional layer. */
class RuntimeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * `PlatformRuntime` as its own script (round 5, E-03): the service-worker client, the install
 * prompt and the aggregate measurement are not in any page's first-load JavaScript. The server
 * HTML still has the runtime's (empty) live region; in the browser the script loads during
 * hydration and the runtime hydrates in its own pass when it arrives (an Activity boundary: written
 * in place, never revealed late like a Suspense boundary). It shows nothing until
 * an update is ready, and registers the worker after the network is idle anyway. The connection
 * notice is not part of it (round 6): it is rendered here directly, with only the small shared
 * state of `connectivity.ts`, so "You are offline" appears even when this script has not arrived.
 */
export function PlatformRuntimeLazy() {
  return (
    <div
      data-print="hidden"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      <RuntimeBoundary>
        <Activity mode="visible">
          <Runtime />
        </Activity>
      </RuntimeBoundary>
      {/* Round 6 (G8 item 8): in the first load, so it does not wait for the runtime's script. */}
      <ConnectionNotice />
    </div>
  );
}

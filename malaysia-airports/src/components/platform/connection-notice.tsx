'use client';

import { useSyncExternalStore } from 'react';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { connectionNotice, getConnectivity, getServerConnectivity, getServerWorker, getWorker, subscribeConnectivity, subscribeWorker } from './connectivity';

/**
 * "You are offline: showing saved information" while the connection is down, or when this page
 * came from the saved copy because the network failed; "Back online" briefly after. Polite, never
 * takes focus. Round 6 (G8 item 8, gallery note 3): part of the shell's first load, not of the
 * lazily loaded runtime, so a connection that drops before the runtime's script arrives still gets
 * the notice. The live region always exists, so changes are announced.
 */
export function ConnectionNotice() {
  const t = useT();
  const { online, justReconnected } = useSyncExternalStore(subscribeConnectivity, getConnectivity, getServerConnectivity);
  const { servedFromCache, status } = useSyncExternalStore(subscribeWorker, getWorker, getServerWorker);
  // The same answer as the offline page's status card (round 4): "showing saved information"
  // only when the worker controls the page; otherwise it says nothing is saved yet.
  const state = connectionNotice({ online, justReconnected, servedFromCache, status });

  return (
    <div role="status" aria-live="polite" className="flex w-full justify-center">
      {state ? (
        <div
          className={cn(
            'pointer-events-auto flex w-full max-w-md animate-rise-in items-center gap-3 rounded-lg border py-1.5 pr-1.5 pl-4 shadow-md sm:w-auto sm:max-w-xl',
            state === 'back' ? 'border-positive-border bg-positive-bg text-positive-fg' : 'border-line-strong bg-inverse text-on-inverse',
          )}
        >
          <Icon name={state === 'back' ? 'wifi' : 'wifi-off'} size="sm" className="shrink-0" />
          <p className="type-body-sm min-w-0 flex-1 py-1.5 font-semibold">
            {state === 'back'
              ? t('platformPages.indicator.backOnline')
              : state === 'offline-nothing-saved'
                ? t('flightPages.offline.toastNothingSaved')
                : t(state === 'offline' ? 'platformPages.indicator.offline' : 'platformPages.indicator.unreachable')}
          </p>
          {state === 'back' ? null : (
            <LocaleLink
              href="/offline"
              className="type-body-sm inline-flex min-h-9 shrink-0 items-center rounded-md px-3 font-semibold underline underline-offset-4 transition-colors duration-fast hover:bg-on-inverse/10 touch:min-h-11"
            >
              {t('platformPages.indicator.details')}
            </LocaleLink>
          )}
        </div>
      ) : null}
    </div>
  );
}


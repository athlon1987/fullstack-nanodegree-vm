'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { listenForInstall } from './install-client';
import {
  applyUpdate,
  dismissUpdate,
  getConnectivity,
  getServerConnectivity,
  getServerWorker,
  getWorker,
  startServiceWorker,
  subscribeConnectivity,
  subscribeWorker,
} from './sw-client';

/**
 * Mounted once in the root layout, beside the global overlays. It registers the service worker
 * (production builds only) and shows two small, polite notices above the phone bottom bar:
 *  - "You are offline: showing saved information" while the connection is down, or when this
 *    page came from the saved copy because the network failed; "Back online" briefly after;
 *  - "A new version is ready" with Reload and Later, when an update has been installed.
 * Neither takes focus or blocks the page. The live region always exists, so changes are announced.
 */
export function PlatformRuntime() {
  useEffect(() => {
    startServiceWorker();
    listenForInstall();
  }, []);
  return (
    <div
      data-print="hidden"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      <UpdatePrompt />
      <ConnectionNotice />
    </div>
  );
}

function ConnectionNotice() {
  const t = useT();
  const { online, justReconnected } = useSyncExternalStore(subscribeConnectivity, getConnectivity, getServerConnectivity);
  const { servedFromCache } = useSyncExternalStore(subscribeWorker, getWorker, getServerWorker);
  const state = !online ? 'offline' : servedFromCache ? 'unreachable' : justReconnected ? 'back' : null;

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
            {state === 'back' ? t('platformPages.indicator.backOnline') : t(state === 'offline' ? 'platformPages.indicator.offline' : 'platformPages.indicator.unreachable')}
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

function UpdatePrompt() {
  const t = useT();
  const { updateReady } = useSyncExternalStore(subscribeWorker, getWorker, getServerWorker);
  if (!updateReady) return null;
  return (
    <section
      aria-label={t('platformPages.update.label')}
      className="pointer-events-auto w-full max-w-md animate-rise-in rounded-lg border border-line-strong bg-surface-raised p-4 shadow-lg"
    >
      <div className="flex gap-3">
        <Icon name="refresh-cw" className="mt-0.5 text-primary-ink" />
        <div className="min-w-0 flex-1">
          <p role="status" className="type-title-sm text-ink">
            {t('platformPages.update.title')}
          </p>
          <p className="type-body-sm mt-1 text-ink-2">{t('platformPages.update.body')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={applyUpdate}>
              {t('platformPages.update.reload')}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissUpdate}>
              {t('platformPages.update.later')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

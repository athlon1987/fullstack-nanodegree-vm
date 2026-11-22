'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useT } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { startAnalytics } from './analytics';
import { listenForInstall } from './install-client';
import { applyUpdate, dismissUpdate, getServerWorker, getWorker, startServiceWorker, subscribeWorker } from './sw-client';

/**
 * Mounted once in the root layout, beside the global overlays. It registers the service worker
 * (production builds only) and shows "A new version is ready" with Reload and Later, when an
 * update has been installed, above the phone bottom bar (in `PlatformRuntimeLazy`'s region, beside
 * the connection notice, which round 6 moved into the shell so it does not wait for this script).
 * It does not take focus or block the page.
 * It also starts the first-party aggregate measurement (`analytics.ts`), which respects Global
 * Privacy Control, Do Not Track and the visitor's measurement switch.
 */
export function PlatformRuntime() {
  useEffect(() => {
    startServiceWorker();
    listenForInstall();
    startAnalytics();
  }, []);
  // The connection notice is in the shell (`ConnectionNotice`, round 6), so it does not wait for this script.
  return <UpdatePrompt />;
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

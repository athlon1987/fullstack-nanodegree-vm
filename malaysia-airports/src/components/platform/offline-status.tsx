'use client';

import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/cn';
import { Callout } from '@/components/ui/callout';
import { Icon } from '@/components/ui/icon';
import { getConnectivity, getServerConnectivity, getServerWorker, getWorker, savingState, subscribeConnectivity, subscribeWorker, type SavingState } from './sw-client';

/** One message per saving state, the same states the connection toast uses (round 4). */
const SAVING_KEY = {
  on: 'platformPages.status.savingOn',
  checking: 'platformPages.status.checking',
  starting: 'platformPages.status.savingStarting',
  'not-ready': 'flightPages.offline.notReady',
  failed: 'flightPages.offline.failed',
  off: 'flightPages.offline.off',
} as const satisfies Record<SavingState, string>;

/**
 * "Your connection": online or offline (icon and words, never colour alone), and whether this
 * browser is saving pages. The server snapshot renders the neutral "checking" line.
 */
export function ConnectionStatus() {
  const t = useT();
  const { online } = useSyncExternalStore(subscribeConnectivity, getConnectivity, getServerConnectivity);
  const { status } = useSyncExternalStore(subscribeWorker, getWorker, getServerWorker);
  const known = status !== 'unknown';
  return (
    <div className="flex items-start gap-4 rounded-xl border border-line-strong bg-surface p-5 shadow-xs sm:p-6">
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-pill',
          !known ? 'bg-surface-sunken text-ink-2' : online ? 'bg-positive-bg text-positive-fg' : 'bg-warning-bg text-warning-fg',
        )}
      >
        <Icon name={!known || online ? 'wifi' : 'wifi-off'} size="lg" />
      </span>
      <div className="min-w-0">
        <h2 className="type-eyebrow text-gold-ink">{t('platformPages.status.heading')}</h2>
        <p className="type-title-lg mt-1 text-ink">{known ? t(online ? 'platformPages.status.online' : 'platformPages.status.offline') : ' '}</p>
        <p data-saving={savingState(status, online)} className="type-body mt-1 text-ink-2">
          {status === 'unsupported' ? t('platformPages.status.unsupported') : t(SAVING_KEY[savingState(status, online)])}
        </p>
      </div>
    </div>
  );
}

/** Shown when the worker sent the visitor here because the page they asked for is not saved. */
export function NotSavedNotice() {
  const t = useT();
  const from = useSearchParams().get('from');
  if (!from || !from.startsWith('/') || from.length > 200) return null;
  return (
    <Callout tone="warning" icon="wifi-off" title={t('platformPages.notSaved.title')}>
      <p>
        {t('platformPages.notSaved.body', { path: from })}
      </p>
    </Callout>
  );
}

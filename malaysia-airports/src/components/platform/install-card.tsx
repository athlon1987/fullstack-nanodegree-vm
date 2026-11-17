'use client';

import { useSyncExternalStore } from 'react';
import { useT } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { getInstall, getServerInstall, promptInstall, subscribeInstall } from './install-client';

const ROUTES: { icon: IconName; key: 'platformPages.install.ios' | 'platformPages.install.android' | 'platformPages.install.desktop' }[] = [
  { icon: 'smartphone', key: 'platformPages.install.ios' },
  { icon: 'smartphone', key: 'platformPages.install.android' },
  { icon: 'monitor', key: 'platformPages.install.desktop' },
];

/**
 * "Keep it on your home screen". Where the browser offers installation we show one button that
 * opens its own dialog; everywhere else, the steps for each platform. No user-agent sniffing.
 */
export function InstallCard() {
  const t = useT();
  const state = useSyncExternalStore(subscribeInstall, getInstall, getServerInstall);
  const finished = state === 'installed' || state === 'done';
  return (
    <section aria-labelledby="install-title" className="flex h-full flex-col gap-4 rounded-xl border border-line-strong bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
          <Icon name="smartphone" size="lg" />
        </span>
        <div className="min-w-0">
          <h2 id="install-title" className="type-title-lg text-ink">
            {t('platformPages.install.heading')}
          </h2>
          <p className="type-body mt-1 text-ink-2">{t('platformPages.install.lead')}</p>
        </div>
      </div>
      {finished ? (
        <p className="type-body flex items-center gap-2 font-semibold text-ink" role="status">
          <Icon name="circle-check" className="text-positive-fg" />
          {t(state === 'done' ? 'platformPages.install.done' : 'platformPages.install.installed')}
        </p>
      ) : (
        <>
          {state === 'available' ? (
            <div>
              <Button iconStart="plus" onClick={() => void promptInstall()}>
                {t('platformPages.install.button')}
              </Button>
            </div>
          ) : null}
          <ul className="flex flex-col gap-2.5">
            {ROUTES.map((route) => (
              <li key={route.key} className="type-body-sm flex gap-3 text-ink-2">
                <Icon name={route.icon} size="sm" className="mt-0.5 shrink-0 text-ink-3" />
                <span>{t(route.key)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

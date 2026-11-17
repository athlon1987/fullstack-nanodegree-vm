'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { applyPreferences, DEFAULT_PREFERENCES } from '@/lib/preferences';
import { airportStore, journeyModeStore, preferencesStore, savedJourneyStore } from '@/lib/stores';
import { DEVICE_KEYS, LANG_COOKIE, STORAGE_KEY_PREFIX, type StorageArea } from './storage-keys';

interface Entry {
  key: string;
  area: StorageArea;
  size: number;
}

const CLEARED_PARAM = 'cleared';

function storageAreas(): [StorageArea, Storage][] {
  const areas: [StorageArea, Storage][] = [];
  try {
    areas.push(['local', window.localStorage]);
  } catch {
    // Storage blocked: nothing stored there.
  }
  try {
    areas.push(['session', window.sessionStorage]);
  } catch {
    // Storage blocked: nothing stored there.
  }
  return areas;
}

function langCookie(): string | undefined {
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LANG_COOKIE}=`));
}

/** Everything this site keeps in the browser, as a JSON string so the snapshot compares by value. */
function readInventory(): string {
  const entries: Entry[] = [];
  for (const [area, storage] of storageAreas()) {
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) entries.push({ key, area, size: (storage.getItem(key) ?? '').length });
      }
    } catch {
      // Unreadable storage counts as empty.
    }
  }
  const cookie = langCookie();
  if (cookie) entries.push({ key: LANG_COOKIE, area: 'cookie', size: cookie.length - LANG_COOKIE.length - 1 });
  entries.sort((a, b) => a.area.localeCompare(b.area) || a.key.localeCompare(b.key));
  return JSON.stringify(entries);
}

const CORE_STORES = [preferencesStore, airportStore, journeyModeStore, savedJourneyStore] as const;

function subscribe(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener('focus', listener);
  const unsubscribers = CORE_STORES.map((store) => store.subscribe(listener));
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('focus', listener);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

/** Remove every entry this site wrote. Returns how many there were. */
function clearEverything(): number {
  let count = 0;
  for (const [, storage] of storageAreas()) {
    try {
      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) keys.push(key);
      }
      keys.forEach((key) => storage.removeItem(key));
      count += keys.length;
    } catch {
      // Nothing we can remove.
    }
  }
  if (langCookie()) {
    document.cookie = `${LANG_COOKIE}=; path=/; max-age=0; samesite=lax`;
    count += 1;
  }
  CORE_STORES.forEach((store) => store.clear());
  applyPreferences(DEFAULT_PREFERENCES);
  return count;
}

/** Read once when this module loads in the browser: the count passed back after a clear-and-reload. */
const clearedOnLoad = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(CLEARED_PARAM);
const noop = () => () => {};

const LABELS = new Map(DEVICE_KEYS.map((item) => [item.key, item.label]));

/**
 * The live "on this device now" list and the clear-all button for the privacy page.
 *
 * Clearing removes every `ma:` entry from local and session storage and the language cookie,
 * resets the core stores, then reloads the page so every part of the site (search, alerts,
 * concierge) starts again from empty storage. The count comes back in `?cleared=` and is read
 * once, announced and focused, then removed from the address.
 */
export function DeviceData() {
  const t = useT();
  const raw = useSyncExternalStore(subscribe, readInventory, () => null);
  const cleared = useSyncExternalStore(noop, () => clearedOnLoad, () => null);
  const [nothingCleared, setNothingCleared] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const entries: Entry[] = raw ? (JSON.parse(raw) as Entry[]) : [];

  useEffect(() => {
    if (cleared === null) return;
    statusRef.current?.focus();
    const url = new URL(window.location.href);
    url.searchParams.delete(CLEARED_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }, [cleared]);

  const onConfirm = () => {
    const count = clearEverything();
    if (count === 0) {
      setNothingCleared(true);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set(CLEARED_PARAM, String(count));
    window.location.replace(url);
  };

  const clearedCount = cleared === null ? null : Number.parseInt(cleared, 10);
  const status =
    clearedCount !== null && Number.isFinite(clearedCount) && clearedCount > 0
      ? t.count('corporatePages.privacy.clear.done', clearedCount)
      : nothingCleared
        ? t('corporatePages.privacy.clear.doneNothing')
        : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-line-strong bg-surface">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4">
          <h3 className="type-title-sm text-ink">{t('corporatePages.privacy.stored.deviceTitle')}</h3>
          {entries.length > 0 ? <p className="type-caption text-ink-2">{t.count('corporatePages.privacy.stored.deviceCount', entries.length)}</p> : null}
        </div>
        {entries.length > 0 ? (
          <ul aria-label={t('corporatePages.privacy.stored.deviceTitle')} className="divide-y divide-line">
            {entries.map((entry) => {
              const label = LABELS.get(entry.key);
              return (
                <li key={`${entry.area}:${entry.key}`} className="grid gap-x-6 gap-y-1 px-5 py-3 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] sm:items-baseline">
                  <code className="type-data-sm break-all text-ink">{entry.key}</code>
                  <span className="type-body-sm text-ink-2">{label ? t(label) : t('corporatePages.privacy.stored.deviceOther')}</span>
                  <span className="type-caption tabular text-ink-3">
                    {t(`corporatePages.privacy.stored.${entry.area}`)} · {t('corporatePages.privacy.stored.bytes', { size: entry.size })}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="type-body-sm flex items-center gap-2 px-5 py-4 text-ink-2">
            <Icon name={raw === null ? 'loader-circle' : 'circle-check'} size="sm" />
            {raw === null ? t('corporatePages.privacy.stored.deviceLoading') : t('corporatePages.privacy.stored.deviceEmpty')}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger" iconStart="trash-2">
              {t('corporatePages.privacy.clear.button')}
            </Button>
          </DialogTrigger>
          <DialogContent
            title={t('corporatePages.privacy.clear.confirmTitle')}
            description={t('corporatePages.privacy.clear.confirmBody')}
            size="sm"
            footer={
              <div className="flex flex-wrap justify-end gap-3">
                <DialogClose asChild>
                  <Button variant="secondary">{t('corporatePages.privacy.clear.cancel')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="danger" iconStart="trash-2" onClick={onConfirm}>
                    {t('corporatePages.privacy.clear.confirm')}
                  </Button>
                </DialogClose>
              </div>
            }
          >
            {null}
          </DialogContent>
        </Dialog>
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className={cn('type-body-sm flex items-center gap-2 rounded-sm text-ink focus-visible:focus-ring', !status && 'sr-only')}
        >
          {status ? <Icon name="circle-check" size="sm" className="text-positive-fg" /> : null}
          {status}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDateTime } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { CACHE_NAMES, SAVED_AT_HEADER, TITLE_HEADER } from './sw-routes';
import { getServerWorker, getWorker, subscribeWorker } from './sw-client';

interface SavedPage {
  path: string;
  title: string;
  savedAt: string;
}

/** Read the pages the worker saved, newest first, for one language. */
async function readSavedPages(lang: string, siteName: string): Promise<SavedPage[]> {
  if (typeof caches === 'undefined' || !(await caches.has(CACHE_NAMES.pages))) return [];
  const cache = await caches.open(CACHE_NAMES.pages);
  const pages: SavedPage[] = [];
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (path !== `/${lang}` && !path.startsWith(`/${lang}/`)) continue;
    const response = await cache.match(request);
    const rawTitle = decodeURIComponent(response?.headers.get(TITLE_HEADER) ?? '') || path;
    const suffix = ` | ${siteName}`;
    pages.push({
      path,
      title: rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle,
      savedAt: response?.headers.get(SAVED_AT_HEADER) ?? '',
    });
  }
  return pages.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/**
 * "Saved on this device": every page the worker has kept for this language, with when it was
 * saved, and a control to remove them all (they are copies on this device, nothing more).
 * Hidden while the browser cannot save pages; the connection card explains why.
 */
export function SavedPages() {
  const t = useT();
  const lang = useLang();
  const { status } = useSyncExternalStore(subscribeWorker, getWorker, getServerWorker);
  const [pages, setPages] = useState<SavedPage[] | null>(null);
  const [cleared, setCleared] = useState(false);
  const siteName = t('common.appName');

  const refresh = useCallback(() => {
    readSavedPages(lang, siteName)
      .then(setPages)
      .catch(() => setPages([]));
  }, [lang, siteName]);

  useEffect(() => {
    if (status !== 'active' && status !== 'installing') return;
    refresh();
    // The worker may still be saving this page and its bundles: look again shortly.
    const timer = setTimeout(refresh, 2500);
    return () => clearTimeout(timer);
  }, [status, refresh]);

  if (status !== 'active' && status !== 'installing') return null;

  const clear = async () => {
    await Promise.all([caches.delete(CACHE_NAMES.pages), caches.delete(CACHE_NAMES.data)]);
    setPages([]);
    setCleared(true);
  };

  return (
    <section aria-labelledby="saved-pages-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="max-w-reading">
          <h2 id="saved-pages-title" className="type-display-sm text-ink">
            {t('platformPages.saved.heading')}
          </h2>
          <p className="type-body mt-1.5 text-ink-2">{t('platformPages.saved.lead')}</p>
        </div>
        {pages && pages.length > 0 ? <p className="type-data-sm text-ink-2">{t.count('platformPages.saved.count', pages.length)}</p> : null}
      </div>

      {pages === null ? (
        <p className="type-body-sm text-ink-2">{t('platformPages.status.checking')}</p>
      ) : pages.length === 0 ? (
        <p className="type-body rounded-lg border border-dashed border-line-strong bg-surface p-5 text-ink-2">{t('platformPages.saved.empty')}</p>
      ) : (
        <ul aria-label={t('platformPages.saved.listLabel')} className="divide-y divide-line overflow-hidden rounded-lg border border-line-strong bg-surface">
          {pages.map((page) => (
            <li key={page.path}>
              <LocaleLink
                href={page.path}
                className="group flex min-h-touch items-center gap-4 px-4 py-3 transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset sm:px-5"
              >
                <Icon name="bookmark-check" className="shrink-0 text-primary-ink" />
                <span className="min-w-0 flex-1">
                  <span className="type-body block font-semibold text-ink group-hover:underline">{page.title}</span>
                  {page.savedAt ? (
                    <span className="type-caption mt-0.5 block text-ink-2">{t('platformPages.saved.savedAt', { time: formatDateTime(page.savedAt, lang) })}</span>
                  ) : null}
                </span>
                <Icon name="chevron-right" size="sm" className="shrink-0 text-ink-3" />
              </LocaleLink>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {pages && pages.length > 0 ? (
          <Button size="sm" variant="secondary" iconStart="trash-2" onClick={clear}>
            {t('platformPages.saved.clear')}
          </Button>
        ) : null}
        <p className="type-caption text-ink-2" role="status">
          {cleared ? t('platformPages.saved.cleared') : t('platformPages.saved.privacy')}
        </p>
      </div>
    </section>
  );
}

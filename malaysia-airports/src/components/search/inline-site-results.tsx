'use client';

import { localName } from '@/content/airports';
import { useLang, useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { rememberSearch, useSiteSearch } from './site-search';

const LIMIT = 3;

export interface InlineSiteResultsProps {
  query: string;
  /** Prefer this airport's items (and network-wide ones). */
  airport?: string;
  /** No flight matched: lead with a sentence that says so. */
  noFlights: boolean;
}

/**
 * The top three site-search matches under the home and airport flight search (A-03), with
 * "See all results for …" leading to `/search?q=`. Flights stay first: this block always comes
 * after any flight results. Loaded lazily with the search engine.
 */
export function InlineSiteResults({ query, airport, noFlights }: InlineSiteResultsProps) {
  const t = useT();
  const lang = useLang();
  const results = useSiteSearch(lang, query, { airport, limit: LIMIT, flightLimit: 0 });
  const text = results.query;
  if (text.length < 2) return null;
  const hits = results.groups
    .flatMap((group) => group.hits)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT);
  const all = `/search?q=${encodeURIComponent(text)}`;

  return (
    <section aria-label={t('shellExtras.homeSearch.siteTitle')} className="rounded-lg border border-line bg-page-subtle p-3 sm:p-4">
      {noFlights ? <p className="type-body font-semibold text-ink">{t('shellExtras.homeSearch.noFlights', { query: text })}</p> : null}
      {hits.length > 0 ? (
        <>
          <h3 className={noFlights ? 'type-body-sm mt-1 text-ink-2' : 'type-title-sm text-ink'}>
            {noFlights ? t('shellExtras.homeSearch.tryThese') : t('shellExtras.homeSearch.siteTitle')}
          </h3>
          <ul className="mt-2 flex flex-col gap-1">
            {hits.map((hit) => {
              const place = hit.airport ? localName(hit.airport, lang) : undefined;
              return (
                <li key={hit.id}>
                  <LocaleLink
                    href={hit.href}
                    onClick={() => rememberSearch(text)}
                    className="group flex min-h-11 items-center gap-3 rounded-md px-2 py-1.5 text-ink hover:bg-surface"
                  >
                    <Icon name={hit.type} size="sm" className="shrink-0 text-primary-ink" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{hit.title}</span>
                      <span className="type-caption block text-ink-2">
                        {t(`search.types.${hit.type}`)}
                        {place ? ` · ${place}` : ''}
                      </span>
                    </span>
                    <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="shrink-0 text-ink-3 transition-transform duration-base group-hover:translate-x-0.5" />
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        </>
      ) : results.status === 'loading' ? (
        <p className="type-body-sm mt-1 text-ink-2">{t('search.loading')}</p>
      ) : noFlights ? (
        <p className="type-body-sm mt-1 text-ink-2">{t('flights.search.noResultsHint')}</p>
      ) : null}
      <LocaleLink href={all} onClick={() => rememberSearch(text)} className="link-action type-body-sm mt-2 text-ink">
        <Icon name="search" size="sm" strokeWidth={1.75} />
        {t('search.openFullResults', { query: text })}
      </LocaleLink>
    </section>
  );
}

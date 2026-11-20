'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getAirport } from '@/content/airports';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import type { SearchDocType } from '@/lib/search/engine';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { DemoMarkedList } from '@/components/common/demo-tag';
import { EmptyState } from '@/components/common/empty-state';
import { FlightRow } from '@/components/flights/flight-row';
import { overlays } from '@/components/shell/overlay-store';
import { Button } from '@/components/ui/button';
import { Card, CardLink } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FilterChip } from '@/components/ui/filter-chip';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { loadSearchIndex, rememberSearch, useSiteSearch } from './site-search';

/**
 * The body of `/search`: the same engine as the command palette, with every match. The query
 * lives in the URL (`?q=`), so results can be shared and the back button works.
 *
 * It reads `useSearchParams`, so the page wraps it in `<Suspense>`.
 */
export function SearchResults() {
  const t = useT();
  const lang = useLang();
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const { airport } = useAirportContext();
  const [everywhere, setEverywhere] = useState(false);
  const scoped = airport && !everywhere ? airport.slug : undefined;
  const results = useSiteSearch(lang, query, { airport: scoped, limit: 30, flightLimit: 8 });
  const text = results.query;
  const searching = text.length >= 2;

  const setQuery = (value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set('q', value);
    else next.delete('q');
    const suffix = next.toString();
    // `replaceState` is integrated with the router: `useSearchParams` follows it without a round trip.
    window.history.replaceState(null, '', `${window.location.pathname}${suffix ? `?${suffix}` : ''}`);
  };

  const flights =
    results.flights.length > 0 ? (
      <section aria-labelledby="search-flights" className="min-w-0">
        <h2 id="search-flights" className="type-title-lg mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
          {t('search.types.flight')}
          <span className="type-data-sm text-ink-2">{results.flights.length}</span>
        </h2>
        <DemoDataBanner compact attached />
        {/* A "Demo" marker stays in view while the rows scroll past on a phone (A-04). */}
        <DemoMarkedList start="top-0">
          <div className="surface-board @container overflow-hidden rounded-b-lg border border-t-0 border-line">
            <ul aria-label={t('search.types.flight')}>
              {results.flights.map((flight) => (
                <FlightRow key={`${flight.airport}-${flight.id}`} flight={flight} showAirport={!scoped} onNavigate={() => rememberSearch(text)} />
              ))}
            </ul>
          </div>
        </DemoMarkedList>
      </section>
    ) : null;

  return (
    <div className="flex flex-col gap-8">
      <form
        role="search"
        aria-label={t('search.label')}
        onSubmit={(event) => {
          event.preventDefault();
          rememberSearch(text);
        }}
        className="flex flex-col gap-3"
      >
        <SearchField
          label={t('search.label')}
          size="lg"
          value={query}
          onValueChange={setQuery}
          placeholder={t('search.placeholder')}
          placeholderShort={t('search.title')}
          name="q"
          autoFocus
        />
        {airport ? (
          <div role="group" aria-label={t('search.scopeLabel')} className="flex flex-wrap items-center gap-2">
            <span className="type-body-sm text-ink-2">{t('search.scopeLabel')}</span>
            <FilterChip pressed={!everywhere} onPressedChange={() => setEverywhere(false)}>
              {airport.shortName}
            </FilterChip>
            <FilterChip pressed={everywhere} onPressedChange={() => setEverywhere(true)}>
              {t('search.everywhere')}
            </FilterChip>
          </div>
        ) : null}
      </form>

      <p role="status" className="type-body text-ink-2">
        {!searching
          ? t('search.pagePrompt')
          : results.status === 'error'
            ? t('search.failed')
            : results.status !== 'ready'
              ? t('search.loading')
              : `${t('search.resultsFor', { query: text })}: ${t.count('search.resultsCount', results.total)}`}
      </p>

      {searching && results.status === 'error' ? (
        <div>
          <Button variant="secondary" iconStart="refresh-cw" onClick={() => loadSearchIndex(lang)}>
            {t('common.actions.retry')}
          </Button>
        </div>
      ) : null}

      {searching && results.status === 'loading' ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {searching && results.flightShaped ? flights : null}

      {results.groups.map((group) => (
        <section key={group.type} aria-labelledby={`search-${group.type}`} className="min-w-0">
          <h2 id={`search-${group.type}`} className="type-title-lg mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
            {t(`search.types.${group.type}` as `search.types.${SearchDocType}`)}
            <span className="type-data-sm text-ink-2">{group.total}</span>
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {group.hits.map((hit) => {
              const place = hit.airport ? getAirport(hit.airport) : undefined;
              return (
                <Card as="li" key={hit.id} interactive padding="sm" className="flex min-w-0 gap-3.5">
                  <Icon name={hit.type} className="mt-0.5 text-primary-ink" />
                  <div className="min-w-0 flex-1">
                    <h3 className="type-title-sm text-ink">
                      <CardLink href={hit.href} onClick={() => rememberSearch(text)}>
                        {hit.title}
                      </CardLink>
                    </h3>
                    {hit.summary ? <p className="type-body-sm mt-1 text-ink-2">{hit.summary}</p> : null}
                    {place ? (
                      <Chip className="mt-2.5" icon="map-pin">
                        {place.shortName}
                      </Chip>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </ul>
          {group.total > group.hits.length ? (
            <p className="type-caption mt-2 text-ink-2">
              {t.count('search.moreOfType', group.total - group.hits.length, { type: t(`search.types.${group.type}` as `search.types.${SearchDocType}`) })}
            </p>
          ) : null}
        </section>
      ))}

      {searching && !results.flightShaped ? flights : null}

      {searching && results.status === 'ready' && results.total === 0 ? (
        <EmptyState
          icon="search-x"
          title={t('search.noResults', { query: text })}
          headingLevel={2}
          action={
            <Button variant="secondary" iconStart="sparkles" onClick={() => overlays.openConcierge(text)}>
              {t('concierge.open')}
            </Button>
          }
        >
          {t('search.noResultsHint')}
        </EmptyState>
      ) : null}
    </div>
  );
}

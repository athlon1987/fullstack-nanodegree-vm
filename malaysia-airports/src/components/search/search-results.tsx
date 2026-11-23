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
import { FilterChip } from '@/components/ui/filter-chip';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { Highlight } from './highlight';
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
        <h2 id="search-flights" className="type-title-lg mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
          {t('search.types.flight')}
          <span className="type-data-sm inline-flex h-6 min-w-6 items-center justify-center rounded-pill bg-fill px-2 text-ink-2">{results.flights.length}</span>
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
        className="flex flex-col gap-3 rounded-3xl bg-surface p-3 shadow-lg ring-1 ring-line sm:p-4"
      >
        {/* Polish (critique-redesign2 item 11): with a query the visitor came to read the results, so
            the field is not focused on arrival (its focus ring was the first thing seen). */}
        <SearchField
          label={t('search.label')}
          size="lg"
          value={query}
          onValueChange={setQuery}
          placeholder={t('search.placeholder')}
          placeholderShort={t('search.title')}
          name="q"
          autoFocus={query === ''}
        />
        {airport ? (
          <div role="group" aria-label={t('search.scopeLabel')} className="flex flex-wrap items-center gap-2 px-1">
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

      <p role="status" className="type-body px-1 text-ink-2">
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
          {/* Polish (critique-redesign2 item 18): a list with hierarchy, one column, the type's icon on
              the group heading instead of on every result, summaries kept to two lines, the airport
              at the right. */}
          <h2 id={`search-${group.type}`} className="type-title-lg mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
            <span aria-hidden="true" className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', group.type === 'unpublished' ? 'bg-gold-soft text-gold-ink' : 'bg-primary-soft text-primary-ink')}>
              <Icon name={group.type} size="sm" />
            </span>
            {t(`search.types.${group.type}` as `search.types.${SearchDocType}`)}
            <span className="type-data-sm inline-flex h-6 min-w-6 items-center justify-center rounded-pill bg-fill px-2 text-ink-2">{group.total}</span>
          </h2>
          <ul className="grid gap-3">
            {group.hits.map((hit) => {
              const place = hit.airport ? getAirport(hit.airport) : undefined;
              const gap = hit.type === 'unpublished';
              return (
                <Card
                  as="li"
                  key={hit.id}
                  interactive
                  padding="sm"
                  // An honest "not published" answer (its title says so) is styled as help, not as an
                  // error: a dashed edge and a soft gold tile; its link leads to the official place to ask.
                  className={cn('flex min-w-0 items-start gap-4 rounded-2xl sm:px-5 sm:py-4', gap && 'border-dashed border-line-strong bg-surface')}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="type-title-sm text-ink">
                      <CardLink href={hit.href} onClick={() => rememberSearch(text)}>
                        <Highlight text={hit.title} query={text} />
                      </CardLink>
                    </h3>
                    {hit.summary ? (
                      <p className="type-body-sm mt-1 line-clamp-2 text-ink-2">
                        <Highlight text={hit.summary} query={text} />
                      </p>
                    ) : null}
                  </div>
                  {place ? (
                    <Badge size="sm" variant="label" className="mt-0.5">
                      {place.shortName}
                    </Badge>
                  ) : null}
                  <Icon name="arrow-right" size="sm" className="mt-1 shrink-0 text-ink-3 transition-transform duration-fast group-hover/card:translate-x-0.5 group-hover/card:text-ink" />
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
